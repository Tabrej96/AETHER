/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Resource Efficiency Manager
 * (src/core/browser/resourceManager.ts)
 *
 * Monitors browser memory usage, cleans up idle sessions, manages connection
 * pooling, and tracks performance metrics. Keeps browser resource usage within
 * acceptable bounds.
 *
 * No external dependencies — pure AETHER-native logic.
 */

import {
  type BrowserSessionHealth,
  type BrowserProvider,
} from './providers/browserProvider.js';
import type { SessionManager, ManagedSession, SessionPoolStats } from './sessionManager.js';
import type { BrowserIsolation, IsolatedTask } from './browserIsolation.js';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ResourceThresholds {
  /** Max memory MB per session. */
  maxMemoryMB: number;
  /** Max total memory MB across all sessions. */
  maxTotalMemoryMB: number;
  /** Max idle time before eviction (ms). */
  maxIdleMs: number;
  /** Max session lifetime (ms). */
  maxLifetimeMs: number;
  /** Max number of active sessions. */
  maxActiveSessions: number;
  /** Max number of isolated tasks. */
  maxIsolatedTasks: number;
  /** Minimum health score (0-100) before session is considered unhealthy. */
  minHealthScore: number;
}

export const DEFAULT_RESOURCE_THRESHOLDS: ResourceThresholds = {
  maxMemoryMB: 512,
  maxTotalMemoryMB: 2048,
  maxIdleMs: 5 * 60_000,
  maxLifetimeMs: 30 * 60_000,
  maxActiveSessions: 4,
  maxIsolatedTasks: 8,
  minHealthScore: 30,
};

export interface ResourceMetrics {
  timestamp: number;
  sessions: {
    total: number;
    active: number;
    idle: number;
    unhealthy: number;
  };
  memory: {
    perSessionMB: number[];
    totalMB: number;
    peakMB: number;
    overLimit: number;
  };
  tasks: {
    active: number;
    max: number;
    utilizationPct: number;
  };
  performance: {
    avgCommandDurationMs: number;
    successRate: number;
    totalCommands: number;
    failedCommands: number;
  };
  alerts: ResourceAlert[];
}

export type ResourceAlertSeverity = 'info' | 'warning' | 'critical';

export interface ResourceAlert {
  severity: ResourceAlertSeverity;
  category: 'memory' | 'sessions' | 'tasks' | 'performance' | 'provider';
  message: string;
  sessionId?: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export interface ResourceManagerConfig {
  thresholds: Partial<ResourceThresholds>;
  /** Whether to enable automatic cleanup on threshold breach. */
  autoCleanup: boolean;
  /** How often to check resource usage (ms). */
  checkIntervalMs: number;
  /** Whether to log metrics. */
  logMetrics: boolean;
}

export const DEFAULT_RESOURCE_MANAGER_CONFIG: ResourceManagerConfig = {
  autoCleanup: true,
  checkIntervalMs: 30_000,
  logMetrics: false,
};

// ─── Resource Manager ──────────────────────────────────────────────────────────

export class ResourceManager {
  private readonly config: ResourceManagerConfig;
  private readonly thresholds: ResourceThresholds;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private metricsHistory: ResourceMetrics[] = [];
  private alerts: ResourceAlert[] = [];
  private peakMemoryMB = 0;
  private commandDurations: number[] = [];
  private totalCommands = 0;
  private failedCommands = 0;
  private _provider: BrowserProvider | null = null;

  constructor(config: Partial<ResourceManagerConfig> = {}) {
    this.config = { ...DEFAULT_RESOURCE_MANAGER_CONFIG, ...config };
    this.thresholds = { ...DEFAULT_RESOURCE_THRESHOLDS, ...config.thresholds };
  }

  /** Set the active provider for health checks. */
  setProvider(provider: BrowserProvider): void {
    this._provider = provider;
  }

  /** Start the resource monitoring loop. */
  start(): void {
    if (this.checkTimer) return;
    this.checkTimer = setInterval(() => this.check(), this.config.checkIntervalMs);
  }

  /** Stop the resource monitoring loop. */
  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Run a resource check against the provided session manager and isolation engine.
   */
  async check(sessionManager?: SessionManager, isolation?: BrowserIsolation): Promise<ResourceMetrics> {
    const sessionStats = sessionManager?.getStats();
    const sessions = sessionManager?.listSessions();
    const tasks = isolation?.listActiveTasks();
    const now = Date.now();

    // Collect per-session memory
    const perSessionMB: number[] = [];
    let totalMB = 0;

    if (sessions) {
      for (const session of sessions) {
        if (session.status === 'closed' || session.status === 'closing') continue;
        try {
          const health = await session.provider.health();
          const mem = health.memoryMB ?? 0;
          perSessionMB.push(mem);
          totalMB += mem;
        } catch {
          perSessionMB.push(0);
        }
      }
    }

    // Update peak
    if (totalMB > this.peakMemoryMB) {
      this.peakMemoryMB = totalMB;
    }

    // Over-limit count
    const overLimit = perSessionMB.filter((m) => m > this.thresholds.maxMemoryMB).length;

    // Task utilization
    const activeTasks = tasks?.length ?? 0;
    const taskUtilPct = this.thresholds.maxIsolatedTasks > 0
      ? Math.round((activeTasks / this.thresholds.maxIsolatedTasks) * 100)
      : 0;

    // Performance metrics
    const avgCommandDuration = this.commandDurations.length > 0
      ? Math.round(this.commandDurations.reduce((a, b) => a + b, 0) / this.commandDurations.length)
      : 0;
    const successRate = this.totalCommands > 0
      ? Math.round(((this.totalCommands - this.failedCommands) / this.totalCommands) * 100)
      : 100;

    // Generate alerts
    const alerts = this.generateAlerts({
      perSessionMB,
      totalMB,
      overLimit,
      activeTasks,
      sessionStats,
      avgCommandDuration,
      successRate,
    });

    this.alerts.push(...alerts);

    const metrics: ResourceMetrics = {
      timestamp: now,
      sessions: {
        total: sessionStats?.total ?? 0,
        active: sessionStats?.active ?? 0,
        idle: sessionStats?.idle ?? 0,
        unhealthy: sessionStats?.unhealthy ?? 0,
      },
      memory: {
        perSessionMB,
        totalMB,
        peakMB: this.peakMemoryMB,
        overLimit,
      },
      tasks: {
        active: activeTasks,
        max: this.thresholds.maxIsolatedTasks,
        utilizationPct: taskUtilPct,
      },
      performance: {
        avgCommandDurationMs: avgCommandDuration,
        successRate,
        totalCommands: this.totalCommands,
        failedCommands: this.failedCommands,
      },
      alerts,
    };

    this.metricsHistory.push(metrics);
    // Keep last 200 snapshots
    if (this.metricsHistory.length > 200) {
      this.metricsHistory = this.metricsHistory.slice(-200);
    }

    // Auto-cleanup if configured
    if (this.config.autoCleanup) {
      await this.performCleanup(sessionManager, isolation, alerts);
    }

    return metrics;
  }

  /**
   * Record a command execution for performance tracking.
   */
  recordCommand(durationMs: number, success: boolean): void {
    this.totalCommands++;
    if (!success) this.failedCommands++;
    this.commandDurations.push(durationMs);
    // Keep last 500
    if (this.commandDurations.length > 500) {
      this.commandDurations = this.commandDurations.slice(-500);
    }
  }

  /**
   * Get current alerts.
   */
  getAlerts(severity?: ResourceAlertSeverity): ResourceAlert[] {
    if (!severity) return [...this.alerts];
    return this.alerts.filter((a) => a.severity === severity);
  }

  /**
   * Clear all alerts.
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get metrics history.
   */
  getMetricsHistory(limit = 50): ResourceMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Check if the system is within resource limits.
   */
  isWithinLimits(sessionStats?: SessionPoolStats, activeTasks = 0): boolean {
    if (sessionStats) {
      if (sessionStats.active >= this.thresholds.maxActiveSessions) return false;
      if (sessionStats.unhealthy > 0) return false;
    }
    if (activeTasks >= this.thresholds.maxIsolatedTasks) return false;
    return true;
  }

  /**
   * Get a summary of resource health.
   */
  getSummary(sessionStats?: SessionPoolStats, activeTasks = 0): ResourceHealthSummary {
    const withinLimits = this.isWithinLimits(sessionStats, activeTasks);
    const recentAlerts = this.alerts.filter((a) => Date.now() - a.timestamp < 60_000);
    const criticalAlerts = recentAlerts.filter((a) => a.severity === 'critical');
    const warningAlerts = recentAlerts.filter((a) => a.severity === 'warning');

    let healthScore = 100;
    if (!withinLimits) healthScore -= 30;
    healthScore -= criticalAlerts.length * 15;
    healthScore -= warningAlerts.length * 5;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      healthScore,
      withinLimits,
      recentAlertCount: recentAlerts.length,
      criticalAlertCount: criticalAlerts.length,
      warningAlertCount: warningAlerts.length,
      status: healthScore >= this.thresholds.minHealthScore ? 'healthy' : 'degraded',
    };
  }

  /**
   * Get command execution statistics.
   */
  getStats(): { total: number; failed: number; successRate: number; byCommand: Record<string, { total: number; failed: number }> } {
    return {
      total: this.totalCommands,
      failed: this.failedCommands,
      successRate: this.totalCommands > 0
        ? Math.round(((this.totalCommands - this.failedCommands) / this.totalCommands) * 100)
        : 100,
      byCommand: { tracked: { total: this.totalCommands, failed: this.failedCommands } },
    };
  }

  /**
   * Clear all command history and alerts.
   */
  clearHistory(): void {
    this.alerts = [];
    this.metricsHistory = [];
    this.commandDurations = [];
    this.totalCommands = 0;
    this.failedCommands = 0;
    this.peakMemoryMB = 0;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private generateAlerts(data: {
    perSessionMB: number[];
    totalMB: number;
    overLimit: number;
    activeTasks: number;
    sessionStats?: SessionPoolStats;
    avgCommandDuration: number;
    successRate: number;
  }): ResourceAlert[] {
    const alerts: ResourceAlert[] = [];
    const now = Date.now();

    // Memory alerts
    for (const mem of data.perSessionMB) {
      if (mem > this.thresholds.maxMemoryMB) {
        alerts.push({
          severity: mem > this.thresholds.maxMemoryMB * 2 ? 'critical' : 'warning',
          category: 'memory',
          message: `Session memory usage (${mem}MB) exceeds limit (${this.thresholds.maxMemoryMB}MB)`,
          value: mem,
          threshold: this.thresholds.maxMemoryMB,
          timestamp: now,
        });
      }
    }

    if (data.totalMB > this.thresholds.maxTotalMemoryMB) {
      alerts.push({
        severity: data.totalMB > this.thresholds.maxTotalMemoryMB * 1.5 ? 'critical' : 'warning',
        category: 'memory',
        message: `Total memory (${data.totalMB}MB) exceeds limit (${this.thresholds.maxTotalMemoryMB}MB)`,
        value: data.totalMB,
        threshold: this.thresholds.maxTotalMemoryMB,
        timestamp: now,
      });
    }

    // Session alerts
    if (data.sessionStats) {
      if (data.sessionStats.active >= this.thresholds.maxActiveSessions) {
        alerts.push({
          severity: 'warning',
          category: 'sessions',
          message: `Active sessions (${data.sessionStats.active}) at capacity (${this.thresholds.maxActiveSessions})`,
          value: data.sessionStats.active,
          threshold: this.thresholds.maxActiveSessions,
          timestamp: now,
        });
      }

      if (data.sessionStats.unhealthy > 0) {
        alerts.push({
          severity: 'critical',
          category: 'sessions',
          message: `${data.sessionStats.unhealthy} session(s) unhealthy`,
          value: data.sessionStats.unhealthy,
          threshold: 0,
          timestamp: now,
        });
      }
    }

    // Task alerts
    if (data.activeTasks >= this.thresholds.maxIsolatedTasks) {
      alerts.push({
        severity: 'warning',
        category: 'tasks',
        message: `Isolated tasks (${data.activeTasks}) at capacity (${this.thresholds.maxIsolatedTasks})`,
        value: data.activeTasks,
        threshold: this.thresholds.maxIsolatedTasks,
        timestamp: now,
      });
    }

    // Performance alerts
    if (data.successRate < 80 && this.totalCommands > 10) {
      alerts.push({
        severity: data.successRate < 50 ? 'critical' : 'warning',
        category: 'performance',
        message: `Command success rate dropped to ${data.successRate}%`,
        value: data.successRate,
        threshold: 80,
        timestamp: now,
      });
    }

    return alerts;
  }

  private async performCleanup(
    sessionManager?: SessionManager,
    isolation?: BrowserIsolation,
    alerts?: ResourceAlert[],
  ): Promise<void> {
    if (!sessionManager) return;

    // If there are critical memory alerts, force cleanup
    const hasCriticalMemory = alerts?.some(
      (a) => a.category === 'memory' && a.severity === 'critical',
    );

    if (hasCriticalMemory) {
      const idle = sessionManager.listSessions('idle');
      for (const session of idle) {
        await sessionManager.closeSession(session.sessionId).catch(() => {});
      }
    }

    // Run standard cleanup
    await sessionManager.runCleanup();
  }
}

// ─── Health summary ────────────────────────────────────────────────────────────

export interface ResourceHealthSummary {
  healthScore: number;
  withinLimits: boolean;
  recentAlertCount: number;
  criticalAlertCount: number;
  warningAlertCount: number;
  status: 'healthy' | 'degraded' | 'critical';
}
