/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Session Manager
 * (src/core/browser/sessionManager.ts)
 *
 * Manages browser sessions: pooling, resource cleanup, concurrency limits,
 * and health monitoring. Works with any BrowserProvider implementation.
 *
 * No external dependencies — pure AETHER-native logic.
 */

import {
  type BrowserProvider,
  type BrowserLaunchOptions,
  type BrowserContextOptions,
  type BrowserSessionHealth,
  type BrowserSessionState,
  type BrowserCookie,
  type NewPageOptions,
  type BrowserContextHandle,
  type PageHandle,
  type CapabilityRequirement,
  type CapabilityNegotiationResult,
} from './providers/browserProvider.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SessionConfig {
  /** Maximum number of concurrent sessions. */
  maxConcurrentSessions: number;
  /** Idle timeout in milliseconds before a session is returned to the pool. */
  idleTimeoutMs: number;
  /** Maximum session lifetime in milliseconds. */
  maxLifetimeMs: number;
  /** Whether to automatically clean up idle sessions. */
  autoCleanup: boolean;
  /** How often to run the cleanup sweep (ms). */
  cleanupIntervalMs: number;
  /** Minimum number of warm sessions to keep ready. */
  minWarmSessions: number;
  /** Preferred browser engine for new sessions. */
  preferredEngine: 'chromium' | 'firefox' | 'webkit';
  /** Headless mode. */
  headless: boolean;
  /** Default viewport. */
  viewport: { width: number; height: number };
  /** Provider factory: given an id, returns a fresh BrowserProvider. */
  providerFactory: (providerId: string) => BrowserProvider;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxConcurrentSessions: 4,
  idleTimeoutMs: 5 * 60_000,      // 5 minutes
  maxLifetimeMs: 30 * 60_000,     // 30 minutes
  autoCleanup: true,
  cleanupIntervalMs: 30_000,      // 30 seconds
  minWarmSessions: 0,
  preferredEngine: 'chromium',
  headless: true,
  viewport: { width: 1280, height: 900 },
  providerFactory: () => {
    // Dynamic import to avoid hard dependency
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PlaywrightProvider } = require('./playwrightProvider.js');
    return new PlaywrightProvider();
  },
};

export type SessionStatus = 'idle' | 'active' | 'unhealthy' | 'closing' | 'closed';

export interface ManagedSession {
  sessionId: string;
  provider: BrowserProvider;
  status: SessionStatus;
  createdAt: number;
  lastUsedAt: number;
  expiresAt: number;
  context: BrowserContextHandle | null;
  taskCount: number;
  errorCount: number;
  lastError?: string;
}

export interface SessionPoolStats {
  total: number;
  idle: number;
  active: number;
  unhealthy: number;
  closing: number;
  warm: number;
  maxConcurrent: number;
  utilizationPct: number;
}

export interface SessionAcquireResult {
  success: boolean;
  session?: ManagedSession;
  reason?: string;
  waitedMs?: number;
}

// ─── Session Manager ──────────────────────────────────────────────────────────

export class SessionManager {
  private readonly config: SessionConfig;
  private sessions = new Map<string, ManagedSession>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private providerCounter = 0;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Start the cleanup loop. Called once after construction.
   */
  start(): void {
    if (this.cleanupTimer) return;
    if (!this.config.autoCleanup) return;
    this.cleanupTimer = setInterval(() => this.runCleanup(), this.config.cleanupIntervalMs);
  }

  /**
   * Stop the cleanup loop and close all sessions.
   */
  async shutdown(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    const closePromises: Promise<void>[] = [];
    for (const session of this.sessions.values()) {
      if (session.status !== 'closed') {
        session.status = 'closing';
        closePromises.push(session.provider.close().catch(() => {}));
      }
    }
    await Promise.all(closePromises);
    this.sessions.clear();
  }

  // ── Acquire / release ──────────────────────────────────────────────────────

  /**
   * Acquire a session from the pool or create a new one.
   * Respects concurrency limits, warm pool, and expiry.
   */
  async acquire(options: {
    providerId?: string;
    engine?: 'chromium' | 'firefox' | 'webkit';
    headless?: boolean;
    requiredFeatures?: CapabilityRequirement[];
  } = {}): Promise<SessionAcquireResult> {
    const startTime = Date.now();

    // Check concurrency limit
    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => s.status === 'active' || s.status === 'idle',
    ).length;

    if (activeSessions >= this.config.maxConcurrentSessions) {
      // Try to evict an idle session
      const idle = this.findIdleSession();
      if (idle) {
        await this.closeSession(idle.sessionId);
      } else {
        return {
          success: false,
          reason: `Max concurrent sessions (${this.config.maxConcurrentSessions}) reached`,
          waitedMs: Date.now() - startTime,
        };
      }
    }

    // Try to reuse a healthy idle session
    const reusable = this.findReusableSession(options.providerId);
    if (reusable) {
      reusable.status = 'active';
      reusable.lastUsedAt = Date.now();
      reusable.taskCount++;
      return { success: true, session: reusable, waitedMs: Date.now() - startTime };
    }

    // Create a new session
    const providerId = options.providerId ?? 'playwright-cross-browser';
    const provider = this.config.providerFactory(providerId);
    const launchOptions: BrowserLaunchOptions = {
      engine: options.engine ?? this.config.preferredEngine,
      headless: options.headless ?? this.config.headless,
      viewport: { ...this.config.viewport },
    };

    // Check capabilities if requirements provided
    if (options.requiredFeatures) {
      const result = provider.checkCapabilities(options.requiredFeatures);
      if (!result.compatible) {
        return {
          success: false,
          reason: `Provider missing features: ${result.missingFeatures.join(', ')}`,
          waitedMs: Date.now() - startTime,
        };
      }
    }

    try {
      await provider.launch(launchOptions);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        reason: `Launch failed: ${msg}`,
        waitedMs: Date.now() - startTime,
      };
    }

    // Create a default context
    let context: BrowserContextHandle | null = null;
    try {
      context = await provider.createContext({ isolated: true });
    } catch {
      // Some providers may not need a pre-created context
    }

    const sessionId = `session-${++this.providerCounter}-${Date.now().toString(36)}`;
    const now = Date.now();
    const session: ManagedSession = {
      sessionId,
      provider,
      status: 'active',
      createdAt: now,
      lastUsedAt: now,
      expiresAt: now + this.config.maxLifetimeMs,
      context,
      taskCount: 1,
      errorCount: 0,
    };

    this.sessions.set(sessionId, session);

    // Maintain warm pool
    await this.maintainWarmPool();

    return { success: true, session, waitedMs: Date.now() - startTime };
  }

  /**
   * Mark a session as idle (return to pool).
   */
  async release(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.status === 'closed') return;
    session.status = 'idle';
    session.lastUsedAt = Date.now();
    session.context = null; // release context resources
  }

  /**
   * Close and remove a session permanently.
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = 'closing';
    await session.provider.close().catch(() => {});
    session.status = 'closed';
    this.sessions.delete(sessionId);
  }

  /**
   * Record an error on a session. Too many errors triggers unhealthy status.
   */
  recordError(sessionId: string, error: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.errorCount++;
    session.lastError = error;
    if (session.errorCount >= 5) {
      session.status = 'unhealthy';
    }
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  /**
   * Run health checks on all managed sessions.
   */
  async healthCheck(): Promise<Map<string, BrowserSessionHealth>> {
    const results = new Map<string, BrowserSessionHealth>();
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'closed' || session.status === 'closing') continue;
      try {
        const h = await session.provider.health();
        if (!h.healthy && session.status !== 'unhealthy') {
          session.status = 'unhealthy';
        }
        results.set(sessionId, h);
      } catch {
        session.status = 'unhealthy';
        results.set(sessionId, {
          healthy: false,
          responsive: false,
          pageCount: 0,
          contextCount: 0,
          lastHeartbeat: 0,
        });
      }
    }
    return results;
  }

  /**
   * Ping all active sessions to check responsiveness.
   */
  async pingAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'closed' || session.status === 'closing') continue;
      try {
        results.set(sessionId, await session.provider.ping());
      } catch {
        results.set(sessionId, false);
      }
    }
    return results;
  }

  /**
   * Get a session by ID.
   */
  getSession(sessionId: string): ManagedSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions matching the given status filter.
   */
  listSessions(status?: SessionStatus): ManagedSession[] {
    const sessions = Array.from(this.sessions.values());
    if (!status) return sessions;
    return sessions.filter((s) => s.status === status);
  }

  /**
   * Current pool statistics.
   */
  getStats(): SessionPoolStats {
    const sessions = Array.from(this.sessions.values());
    const active = sessions.filter((s) => s.status === 'active').length;
    const idle = sessions.filter((s) => s.status === 'idle').length;
    const unhealthy = sessions.filter((s) => s.status === 'unhealthy').length;
    const closing = sessions.filter((s) => s.status === 'closing').length;
    const warm = idle; // warm sessions are idle sessions

    return {
      total: sessions.length,
      idle,
      active,
      unhealthy,
      closing,
      warm,
      maxConcurrent: this.config.maxConcurrentSessions,
      utilizationPct: this.config.maxConcurrentSessions > 0
        ? Math.round((active / this.config.maxConcurrentSessions) * 100)
        : 0,
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private findIdleSession(): ManagedSession | undefined {
    const idle = Array.from(this.sessions.values()).filter((s) => s.status === 'idle');
    if (idle.length === 0) return undefined;
    // Return the idle session that's been idle the longest
    idle.sort((a, b) => a.lastUsedAt - b.lastUsedAt);
    return idle[0];
  }

  private findReusableSession(providerId?: string): ManagedSession | undefined {
    const idle = Array.from(this.sessions.values()).filter((s) => {
      if (s.status !== 'idle') return false;
      if (s.status === 'unhealthy') return false;
      if (s.expiresAt < Date.now()) return false;
      if (providerId && s.provider.id !== providerId) return false;
      return true;
    });
    if (idle.length === 0) return undefined;
    // Return the most recently used idle session
    idle.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    return idle[0];
  }

  private async maintainWarmPool(): Promise<void> {
    const warmTarget = this.config.minWarmSessions;
    if (warmTarget <= 0) return;

    const warmCount = Array.from(this.sessions.values()).filter(
      (s) => s.status === 'idle' && s.expiresAt > Date.now(),
    ).length;

    if (warmCount >= warmTarget) return;

    const toCreate = warmTarget - warmCount;
    for (let i = 0; i < toCreate; i++) {
      const providerId = 'playwright-cross-browser';
      const provider = this.config.providerFactory(providerId);
      try {
        await provider.launch({
          engine: this.config.preferredEngine,
          headless: this.config.headless,
          viewport: this.config.viewport,
        });
        const now = Date.now();
        const session: ManagedSession = {
          sessionId: `warm-${++this.providerCounter}-${Date.now().toString(36)}`,
          provider,
          status: 'idle',
          createdAt: now,
          lastUsedAt: now,
          expiresAt: now + this.config.maxLifetimeMs,
          context: null,
          taskCount: 0,
          errorCount: 0,
        };
        this.sessions.set(session.sessionId, session);
      } catch {
        // Warm pool creation is best-effort
        break;
      }
    }
  }

  /**
   * Run a cleanup sweep: close expired, idle-over-timeout, and unhealthy sessions.
   */
  async runCleanup(): Promise<{ closed: number; evicted: number }> {
    const now = Date.now();
    let closed = 0;
    let evicted = 0;

    for (const [sessionId, session] of this.sessions) {
      if (session.status === 'closed' || session.status === 'closing') continue;

      // Close expired sessions
      if (session.expiresAt < now) {
        await this.closeSession(sessionId);
        closed++;
        continue;
      }

      // Close idle sessions past idle timeout
      if (session.status === 'idle' && now - session.lastUsedAt > this.config.idleTimeoutMs) {
        await this.closeSession(sessionId);
        evicted++;
        continue;
      }

      // Close unhealthy sessions
      if (session.status === 'unhealthy') {
        await this.closeSession(sessionId);
        closed++;
        continue;
      }
    }

    // Maintain warm pool
    await this.maintainWarmPool();

    return { closed, evicted };
  }
}
