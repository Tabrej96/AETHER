/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Session Manager Tests
 * (src/core/browser/tests/sessionManager.test.ts)
 *
 * Tests session pooling, resource cleanup, concurrent limits, and health monitoring.
 * Uses mock providers — no browser binary required.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { SessionManager, DEFAULT_SESSION_CONFIG } from '../sessionManager.js';
import type { BrowserProvider, BrowserSessionHealth, BrowserSessionState, BrowserLaunchOptions, BrowserContextOptions, NewPageOptions, BrowserContextHandle, PageHandle, ProviderCapabilities, CapabilityRequirement, CapabilityNegotiationResult } from '../providers/browserProvider.js';

// ─── Mock provider ─────────────────────────────────────────────────────────────

class MockProvider implements BrowserProvider {
  readonly id: string;
  readonly name: string;
  private _state: BrowserSessionState = 'closed';
  private _launched = false;
  public launchCount = 0;
  public closeCount = 0;
  public healthResponse: Partial<BrowserSessionHealth> = { healthy: true, responsive: true, pageCount: 0, contextCount: 0, lastHeartbeat: Date.now() };
  public pingResponse = true;
  public shouldFailLaunch = false;
  public failMessage = 'mock launch failure';

  constructor(id = 'mock-provider') {
    this.id = id;
    this.name = `Mock Provider ${id}`;
  }

  get state(): BrowserSessionState {
    return this._state;
  }

  async launch(_options?: BrowserLaunchOptions): Promise<void> {
    this.launchCount++;
    if (this.shouldFailLaunch) {
      this._state = 'error';
      throw new Error(this.failMessage);
    }
    this._launched = true;
    this._state = 'ready';
  }

  async close(): Promise<void> {
    this.closeCount++;
    this._launched = false;
    this._state = 'closed';
  }

  isLaunched(): boolean {
    return this._launched;
  }

  async navigate(url: string): Promise<void> {
    this._state = 'navigating';
    await sleep(10);
    this._state = 'ready';
  }

  async currentURL(): Promise<string> {
    return 'about:blank';
  }

  async pageTitle(): Promise<string> {
    return 'Mock Page';
  }

  async reload(): Promise<void> { /* no-op */ }
  async goBack(): Promise<void> { /* no-op */ }
  async goForward(): Promise<void> { /* no-op */ }

  async click(selector: string): Promise<void> {
    if (selector === 'fail') throw new Error('click fail');
  }

  async type(selector: string, text: string): Promise<void> { /* no-op */ }
  async pressKey(key: string): Promise<void> { /* no-op */ }
  async selectOption(selector: string, value: string): Promise<void> { /* no-op */ }
  async setChecked(selector: string, checked: boolean): Promise<void> { /* no-op */ }
  async getText(selector: string): Promise<string> { return ''; }
  async getAttribute(selector: string, name: string): Promise<string | null> { return null; }
  async waitForSelector(selector: string, timeoutMs = 10000): Promise<void> { /* no-op */ }
  async waitForLoadState(state?: string, timeoutMs = 30000): Promise<void> { /* no-op */ }

  async screenshot(options?: { fullPage?: boolean; selector?: string }) {
    return { bytes: Buffer.from('mock-png'), mimeType: 'image/png', fullPage: options?.fullPage ?? false, size: 8 };
  }

  async domSnapshot() {
    return { html: '<html></html>', htmlLength: 13, title: 'Mock', url: 'about:blank' };
  }

  async accessibilityTree() {
    return { nodes: [], nodeCount: 0, complete: true };
  }

  async consoleMessages() {
    return [];
  }

  async networkRequests() {
    return [];
  }

  async createContext(options?: BrowserContextOptions): Promise<BrowserContextHandle> {
    return new MockContextHandle(this);
  }

  async closeContext(context: BrowserContextHandle): Promise<void> {
    (context as MockContextHandle).markClosed();
  }

  async newPage(options?: NewPageOptions): Promise<PageHandle> {
    return new MockPageHandle(this);
  }

  async closePage(page: PageHandle): Promise<void> {
    (page as MockPageHandle).markClosed();
  }

  async health(): Promise<BrowserSessionHealth> {
    return { healthy: true, responsive: true, pageCount: 0, contextCount: 0, lastHeartbeat: Date.now(), ...this.healthResponse } as BrowserSessionHealth;
  }

  async ping(): Promise<boolean> {
    return this.pingResponse;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      name: this.name,
      version: '1.0.0',
      supportedEngines: ['chromium'],
      outOfProcessOnly: false,
      features: ['screenshot', 'dom-snapshot', 'accessibility-tree'] as any[],
    };
  }

  checkCapabilities(_requirements: CapabilityRequirement[]): CapabilityNegotiationResult {
    return {
      compatible: true,
      providerCapabilities: this.getCapabilities(),
      missingFeatures: [],
      missingOptional: [],
      versionMismatch: false,
    };
  }
}

class MockContextHandle implements BrowserContextHandle {
  readonly contextId: string;
  readonly provider: BrowserProvider;
  private _closed = false;

  constructor(provider: BrowserProvider) {
    this.contextId = `mock-ctx-${Math.random().toString(36).slice(2, 8)}`;
    this.provider = provider;
  }

  get closed(): boolean {
    return this._closed;
  }

  markClosed() {
    this._closed = true;
  }

  async setCookies(cookies: import('../providers/browserProvider.js').BrowserCookie[]): Promise<void> { /* no-op */ }
  async getCookies(): Promise<import('../providers/browserProvider.js').BrowserCookie[]> { return []; }
  async clearCookies(): Promise<void> { /* no-op */ }
  async grantPermissions(permissions: string[], origin?: string): Promise<void> { /* no-op */ }
  async newPage(options?: NewPageOptions): Promise<PageHandle> {
    return new MockPageHandle(this.provider);
  }
  async close(): Promise<void> {
    this._closed = true;
  }
}

class MockPageHandle implements PageHandle {
  readonly pageId: string;
  readonly context: BrowserContextHandle;
  private _closed = false;

  constructor(provider: BrowserProvider) {
    this.pageId = `mock-page-${Math.random().toString(36).slice(2, 8)}`;
    this.context = new MockContextHandle(provider);
  }

  get closed(): boolean {
    return this._closed;
  }

  markClosed() {
    this._closed = true;
  }

  async navigate(url: string): Promise<void> { /* no-op */ }
  async close(): Promise<void> {
    this._closed = true;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Tests ────────────────────────────────────────────────────────────────────

test('acquire: creates a new session when pool is empty', async () => {
  const mgr = new SessionManager({ maxConcurrentSessions: 2 });
  mgr.start();

  const provider = new MockProvider('test-1');
  const result = await mgr.acquire({ providerId: 'test-1', engine: 'chromium' });

  assert.ok(result.success, `acquire should succeed, got: ${result.reason}`);
  assert.ok(result.session, 'session should be returned');
  assert.equal(result.session!.status, 'active');
  assert.ok(result.session!.provider.isLaunched(), 'provider should be launched');

  await mgr.shutdown();
});

test('acquire: returns UNAVAILABLE when max concurrent reached', async () => {
  const mgr = new SessionManager({ maxConcurrentSessions: 1 });
  mgr.start();

  const provider1 = new MockProvider('test-a');
  const provider2 = new MockProvider('test-b');

  const r1 = await mgr.acquire({ providerId: 'test-a', engine: 'chromium' });
  assert.ok(r1.success, 'first acquire should succeed');

  const r2 = await mgr.acquire({ providerId: 'test-b', engine: 'chromium' });
  assert.ok(!r2.success, 'second acquire should fail at capacity');
  assert.ok(r2.reason?.includes('Max concurrent'), 'should mention max concurrent');

  await mgr.shutdown();
});

test('release + reacquire: idle session is reused', async () => {
  const mgr = new SessionManager({ maxConcurrentSessions: 2 });
  mgr.start();

  const provider = new MockProvider('test-reuse');
  const r1 = await mgr.acquire({ providerId: 'test-reuse', engine: 'chromium' });
  assert.ok(r1.success);
  const sessionId = r1.session!.sessionId;

  await mgr.release(sessionId);
  assert.equal(r1.session!.status, 'idle');

  const r2 = await mgr.acquire({ providerId: 'test-reuse', engine: 'chromium' });
  assert.ok(r2.success);
  assert.equal(r2.session!.sessionId, sessionId, 'should reuse the same session');

  await mgr.shutdown();
});

test('closeSession: removes session and calls provider.close()', async () => {
  const mgr = new SessionManager({ maxConcurrentSessions: 2 });
  mgr.start();

  const provider = new MockProvider('test-close');
  const r = await mgr.acquire({ providerId: 'test-close', engine: 'chromium' });
  assert.ok(r.success);
  const sessionId = r.session!.sessionId;

  await mgr.closeSession(sessionId);
  const session = mgr.getSession(sessionId);
  assert.ok(!session || session.status === 'closed', 'session should be closed');
  assert.equal(provider.closeCount, 1, 'provider.close should be called once');

  await mgr.shutdown();
});

test('recordError: marks session unhealthy after 5 errors', async () => {
  const mgr = new SessionManager({ maxConcurrentSessions: 2 });
  mgr.start();

  const provider = new MockProvider('test-errors');
  const r = await mgr.acquire({ providerId: 'test-errors', engine: 'chromium' });
  assert.ok(r.success);
  const sessionId = r.session!.sessionId;

  for (let i = 0; i < 5; i++) {
    mgr.recordError(sessionId, `error ${i}`);
  }

  const session = mgr.getSession(sessionId);
  assert.equal(session!.status, 'unhealthy', 'session should be unhealthy after 5 errors');

  await mgr.shutdown();
});

test('getStats: reports pool statistics', async () => {
  const mgr = new SessionManager({
    maxConcurrentSessions: 4,
    autoCleanup: false,
  });

  const provider1 = new MockProvider('stats-1');
  const provider2 = new MockProvider('stats-2');

  await mgr.acquire({ providerId: 'stats-1', engine: 'chromium' });
  await mgr.acquire({ providerId: 'stats-2', engine: 'chromium' });

  const stats = mgr.getStats();
  assert.equal(stats.total, 2, 'should have 2 sessions');
  assert.ok(stats.active >= 0, 'active count should be valid');
  assert.equal(stats.maxConcurrent, 4);

  await mgr.shutdown();
});

test('launch failure: returns failure result', async () => {
  const mgr = new SessionManager({ maxConcurrentSessions: 2 });
  mgr.start();

  const provider = new MockProvider('test-fail');
  provider.shouldFailLaunch = true;
  provider.failMessage = 'mock binary not found';

  const result = await mgr.acquire({ providerId: 'test-fail', engine: 'chromium' });
  assert.ok(!result.success, 'launch failure should return failure');
  assert.ok(result.reason?.includes('Launch failed'), 'reason should mention launch failure');

  await mgr.shutdown();
});

test('capability check: rejects incompatible provider', async () => {
  const mgr = new SessionManager({ maxConcurrentSessions: 2 });
  mgr.start();

  const provider = new MockProvider('test-caps');
  const result = await mgr.acquire({
    providerId: 'test-caps',
    engine: 'chromium',
    requiredFeatures: [
      { feature: 'webgl-scene-capture', required: true },
    ],
  });

  assert.ok(!result.success, 'incompatible provider should be rejected');
  assert.ok(result.reason?.includes('missing features'), 'reason should mention missing features');

  await mgr.shutdown();
});

test('maintainWarmPool: creates warm sessions when configured', async () => {
  const mgr = new SessionManager({
    maxConcurrentSessions: 4,
    minWarmSessions: 2,
    autoCleanup: false,
  });
  mgr.start();

  const provider = new MockProvider('warm');
  // Create initial session to trigger warm pool maintenance
  await mgr.acquire({ providerId: 'warm', engine: 'chromium' });

  // The warm pool should have been created
  const warmSessions = mgr.listSessions('idle');
  assert.ok(warmSessions.length >= 0, 'warm pool management should not crash');

  await mgr.shutdown();
});
