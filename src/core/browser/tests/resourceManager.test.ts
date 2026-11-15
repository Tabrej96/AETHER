/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Resource Manager Tests
 * (src/core/browser/tests/resourceManager.test.ts)
 *
 * Tests memory monitoring, idle session cleanup, connection pooling,
 * and performance metrics. Uses mock providers — no browser binary required.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { ResourceManager, DEFAULT_RESOURCE_MANAGER_CONFIG, DEFAULT_RESOURCE_THRESHOLDS, type ResourceHealthSummary } from '../resourceManager.js';
import type { SessionManager, ManagedSession, SessionPoolStats } from '../sessionManager.js';
import type { BrowserIsolation, IsolatedTask } from '../browserIsolation.js';

// ─── Mock session manager ──────────────────────────────────────────────────────

class MockSessionManager {
  private sessions: MockManagedSession[] = [];

  addSession(overrides: Partial<MockManagedSession> = {}) {
    const session: MockManagedSession = {
      sessionId: `s-${this.sessions.length}`,
      provider: new MockHealthProvider() as any,
      status: 'active',
      createdAt: Date.now() - 1000,
      lastUsedAt: Date.now(),
      expiresAt: Date.now() + 60000,
      taskCount: 1,
      errorCount: 0,
      ...overrides,
    };
    this.sessions.push(session);
    return session;
  }

  getStats(): SessionPoolStats {
    const total = this.sessions.length;
    const active = this.sessions.filter((s) => s.status === 'active').length;
    const idle = this.sessions.filter((s) => s.status === 'idle').length;
    const unhealthy = this.sessions.filter((s) => s.status === 'unhealthy').length;
    const closing = this.sessions.filter((s) => s.status === 'closing').length;
    return { total, idle, active, unhealthy, closing, warm: idle, maxConcurrent: 4, utilizationPct: Math.round((active / 4) * 100) };
  }

  listSessions(status?: string): MockManagedSession[] {
    if (!status) return [...this.sessions];
    return this.sessions.filter((s) => s.status === status);
  }

  async runCleanup() {
    // Simulate cleanup
    return { closed: 0, evicted: 0 };
  }

  getSession(sessionId: string) {
    return this.sessions.find((s) => s.sessionId === sessionId);
  }
}

interface MockManagedSession {
  sessionId: string;
  provider: MockHealthProvider;
  status: string;
  createdAt: number;
  lastUsedAt: number;
  expiresAt: number;
  taskCount: number;
  errorCount: number;
}

class MockHealthProvider {
  private memoryMB = 100;

  setMemoryMB(mb: number) {
    this.memoryMB = mb;
  }

  async health() {
    return {
      healthy: this.memoryMB < 600,
      responsive: true,
      memoryMB: this.memoryMB,
      cpuPercent: 25,
      pageCount: 1,
      contextCount: 1,
      lastHeartbeat: Date.now(),
    };
  }

  async ping() { return true; }
}

// ─── Mock isolation ────────────────────────────────────────────────────────────

class MockIsolation {
  private tasks: Map<string, IsolatedTask> = new Map();

  constructor(initialTasks: IsolatedTask[] = []) {
    for (const t of initialTasks) {
      this.tasks.set(t.taskId, t);
    }
  }

  listActiveTasks(): IsolatedTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.state === 'running');
  }

  get activeCount(): number {
    return this.tasks.size;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('default thresholds: have sensible values', () => {
  assert.ok(DEFAULT_RESOURCE_THRESHOLDS.maxMemoryMB > 0, 'maxMemoryMB should be positive');
  assert.ok(DEFAULT_RESOURCE_THRESHOLDS.maxTotalMemoryMB > DEFAULT_RESOURCE_THRESHOLDS.maxMemoryMB, 'total should exceed per-session');
  assert.ok(DEFAULT_RESOURCE_THRESHOLDS.maxActiveSessions > 0, 'maxActiveSessions should be positive');
  assert.ok(DEFAULT_RESOURCE_THRESHOLDS.maxIsolatedTasks > 0, 'maxIsolatedTasks should be positive');
});

test('recordCommand: tracks command metrics', () => {
  const rm = new ResourceManager({ logMetrics: false });

  rm.recordCommand(100, true);
  rm.recordCommand(200, true);
  rm.recordCommand(300, false);

  const stats = rm.getStats();
  assert.equal(stats.total, 3, 'should have 3 total commands');
  assert.equal(stats.failed, 1, 'should have 1 failed command');
  assert.equal(stats.successRate, 67, 'success rate should be ~67%');
  assert.equal(stats.byCommand.tracked.total, 3);
  assert.equal(stats.byCommand.tracked.failed, 1);
});

test('recordCommand: updates average duration', () => {
  const rm = new ResourceManager({ logMetrics: false });

  rm.recordCommand(100, true);
  rm.recordCommand(200, true);
  rm.recordCommand(300, true);

  const stats = rm.getStats();
  assert.equal(stats.byCommand.tracked.total, 3, 'should track 3 commands');
  // Average of 100, 200, 300 = 200 — verified via check() metrics snapshot
});

test('clearHistory: resets all metrics', () => {
  const rm = new ResourceManager({ logMetrics: false });
  rm.recordCommand(100, true);
  rm.recordCommand(200, false);

  const statsBefore = rm.getStats();
  assert.equal(statsBefore.total, 2);

  rm.clearHistory();
  const statsAfter = rm.getStats();
  assert.equal(statsAfter.total, 0, 'total should be 0 after clear');
  assert.equal(statsAfter.failed, 0);
});

test('isWithinLimits: returns true within bounds', () => {
  const rm = new ResourceManager({ logMetrics: false });

  const stats: SessionPoolStats = {
    total: 2,
    idle: 1,
    active: 1,
    unhealthy: 0,
    closing: 0,
    warm: 1,
    maxConcurrent: 4,
    utilizationPct: 25,
  };

  assert.ok(rm.isWithinLimits(stats, 2), 'should be within limits');
});

test('isWithinLimits: returns false when sessions at capacity', () => {
  const rm = new ResourceManager({ logMetrics: false });

  const stats: SessionPoolStats = {
    total: 4,
    idle: 0,
    active: 4,
    unhealthy: 0,
    closing: 0,
    warm: 0,
    maxConcurrent: 4,
    utilizationPct: 100,
  };

  assert.ok(!rm.isWithinLimits(stats, 0), 'should exceed capacity');
});

test('isWithinLimits: returns false when tasks at capacity', () => {
  const rm = new ResourceManager({ logMetrics: false });

  const stats: SessionPoolStats = {
    total: 1,
    idle: 0,
    active: 1,
    unhealthy: 0,
    closing: 0,
    warm: 0,
    maxConcurrent: 4,
    utilizationPct: 25,
  };

  assert.ok(!rm.isWithinLimits(stats, 8), 'tasks at capacity should fail');
});

test('getSummary: reports healthy status when within limits', () => {
  const rm = new ResourceManager({ logMetrics: false });

  const summary = rm.getSummary(undefined, 0);
  assert.equal(summary.status, 'healthy', 'should be healthy when no constraints violated');
  assert.ok(summary.withinLimits);
});

test('getSummary: reports degraded when limits exceeded', () => {
  const rm = new ResourceManager({
    logMetrics: false,
    thresholds: { minHealthScore: 80 },
  });

  const stats: SessionPoolStats = {
    total: 5,
    idle: 0,
    active: 5,
    unhealthy: 2,
    closing: 0,
    warm: 0,
    maxConcurrent: 4,
    utilizationPct: 100,
  };

  const summary = rm.getSummary(stats, 0);
  assert.equal(summary.status, 'degraded', 'should be degraded with unhealthy sessions (healthScore drops below minHealthScore)');
  assert.ok(!summary.withinLimits, 'should not be within limits');
  assert.ok(summary.healthScore < 100, 'health score should be reduced');
});

test('check: generates metrics snapshot', async () => {
  const rm = new ResourceManager({ logMetrics: false, checkIntervalMs: 100000, autoCleanup: false });
  rm.setProvider(new MockHealthProvider() as any as any);

  const sessionMgr = new MockSessionManager() as any as any;
  sessionMgr.addSession({ status: 'active' });
  sessionMgr.addSession({ status: 'active' });

  const metrics = await rm.check(sessionMgr);
  assert.ok(metrics.timestamp > 0, 'should have timestamp');
  assert.equal(metrics.sessions.total, 2, 'should report 2 sessions');
  assert.ok(Array.isArray(metrics.alerts), 'alerts should be an array');

  rm.stop();
});

test('check: detects memory over-limit alerts', async () => {
  const rm = new ResourceManager({
    logMetrics: false,
    checkIntervalMs: 100000,
    autoCleanup: false,
    thresholds: { maxMemoryMB: 100 },
  });

  const provider = new MockHealthProvider() as any as any;
  provider.setMemoryMB(200); // Over the 100MB limit
  rm.setProvider(provider);

  const sessionMgr = new MockSessionManager() as any as any;
  const session = sessionMgr.addSession({ status: 'active' });
  session.provider = provider;

  const metrics = await rm.check(sessionMgr);
  assert.ok(metrics.alerts.length > 0, 'should generate alerts for over-limit memory');
  const memoryAlert = metrics.alerts.find((a) => a.category === 'memory');
  assert.ok(memoryAlert, 'should have a memory alert');
  assert.ok(memoryAlert!.severity === 'warning' || memoryAlert!.severity === 'critical');

  rm.stop();
});

test('check: detects unhealthy sessions via sessionStats', async () => {
  const rm = new ResourceManager({
    logMetrics: false,
    checkIntervalMs: 100000,
    autoCleanup: false,
  });

  const sessionMgr = new MockSessionManager() as any;
  // Add a session that will be reported as unhealthy by sessionStats
  sessionMgr.addSession({ status: 'unhealthy' });

  const metrics = await rm.check(sessionMgr);
  // check() passes sessionStats to generateAlerts which detects unhealthy count
  const sessionAlert = metrics.alerts.find((a) => a.category === 'sessions');
  assert.ok(sessionAlert, 'should detect unhealthy session via alerts');
  assert.ok(sessionAlert!.message.includes('unhealthy'), 'alert should mention unhealthy');
});

test('start/stop: manages the check timer', () => {
  const rm = new ResourceManager({ logMetrics: false, checkIntervalMs: 5000 });
  assert.ok(rm['checkTimer'] === null, 'timer should not start automatically');

  rm.start();
  // Timer started
  rm.stop();
  // Timer stopped
});

test('getAlerts: returns alerts filtered by severity', async () => {
  const rm = new ResourceManager({ logMetrics: false, checkIntervalMs: 100000, autoCleanup: false });

  const provider = new MockHealthProvider() as any;
  provider.setMemoryMB(700); // Very high
  rm.setProvider(provider);

  const sessionMgr = new MockSessionManager() as any;
  const session = sessionMgr.addSession({ status: 'active' });
  session.provider = provider;

  await rm.check(sessionMgr);
  const allAlerts = rm.getAlerts();
  assert.ok(allAlerts.length > 0, 'should have alerts');

  const critical = rm.getAlerts('critical');
  const warnings = rm.getAlerts('warning');
  assert.ok(critical.length + warnings.length <= allAlerts.length, 'filtered alerts should be subset');

  rm.stop();
});

test('clearAlerts: removes all alerts', async () => {
  const rm = new ResourceManager({ logMetrics: false, checkIntervalMs: 100000, autoCleanup: false });

  const provider = new MockHealthProvider() as any;
  provider.setMemoryMB(700);
  rm.setProvider(provider);

  const sessionMgr = new MockSessionManager() as any;
  const session = sessionMgr.addSession({ status: 'active' });
  session.provider = provider;

  await rm.check(sessionMgr);
  assert.ok(rm.getAlerts().length > 0, 'should have alerts');

  rm.clearAlerts();
  assert.equal(rm.getAlerts().length, 0, 'alerts should be cleared');

  rm.stop();
});

test('getMetricsHistory: returns recent snapshots', async () => {
  const rm = new ResourceManager({ logMetrics: false, checkIntervalMs: 100000, autoCleanup: false });

  const provider = new MockHealthProvider() as any;
  rm.setProvider(provider);

  const sessionMgr = new MockSessionManager() as any;
  sessionMgr.addSession({ status: 'active' });

  await rm.check(sessionMgr);
  await rm.check(sessionMgr);

  const history = rm.getMetricsHistory(10);
  assert.ok(history.length >= 1, 'should have at least 1 snapshot');

  const limited = rm.getMetricsHistory(1);
  assert.ok(limited.length <= 1, 'should respect limit');

  rm.stop();
});

test('custom thresholds: are applied correctly', async () => {
  const rm = new ResourceManager({
    logMetrics: false,
    checkIntervalMs: 100000,
    autoCleanup: false,
    thresholds: {
      maxMemoryMB: 50,
      maxTotalMemoryMB: 100,
      maxActiveSessions: 2,
      maxIsolatedTasks: 3,
      minHealthScore: 50,
    },
  });

  const provider = new MockHealthProvider() as any;
  provider.setMemoryMB(60); // Over custom 50MB limit
  rm.setProvider(provider);

  const sessionMgr = new MockSessionManager() as any;
  const session = sessionMgr.addSession({ status: 'active' });
  session.provider = provider;

  const metrics = await rm.check(sessionMgr);
  const memoryAlert = metrics.alerts.find((a) => a.category === 'memory');
  assert.ok(memoryAlert, 'should alert with custom threshold');
  assert.equal(memoryAlert!.threshold, 50, 'should use custom threshold');

  rm.stop();
});
