/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Browser Isolation Tests
 * (src/core/browser/tests/browserIsolation.test.ts)
 *
 * Tests per-task browser context isolation, state cleanup, cookie isolation,
 * and profile creation. Uses mock providers — no browser binary required.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BrowserIsolation, DEFAULT_ISOLATION_CONFIG, createIsolationProfile } from '../browserIsolation.js';
import type { BrowserProvider, BrowserContextHandle, BrowserContextOptions, BrowserLaunchOptions, BrowserCookie, PageHandle, BrowserEngine, ProviderCapabilities } from '../providers/browserProvider.js';
import type { IsolationProfile, IsolatedTask, IsolationResult, CleanupReport, IsolationConfig } from '../browserIsolation.js';

// ─── Mock provider ─────────────────────────────────────────────────────────────

class IsolationMockProvider implements BrowserProvider {
  readonly id = 'isolation-mock';
  readonly name = 'Isolation Mock';
  private _state: 'closed' | 'ready' = 'closed';

  get state(): 'closed' | 'ready' { return this._state; }

  async launch(_options?: BrowserLaunchOptions): Promise<void> {
    this._state = 'ready';
  }

  async close(): Promise<void> { this._state = 'closed'; }
  isLaunched(): boolean { return this._state === 'ready'; }

  async navigate(_url: string): Promise<void> {}
  async currentURL(): Promise<string> { return 'about:blank'; }
  async pageTitle(): Promise<string> { return 'Isolation Test'; }
  async reload(): Promise<void> {}
  async goBack(): Promise<void> {}
  async goForward(): Promise<void> {}
  async click(_selector: string): Promise<void> {}
  async type(_selector: string, _text: string): Promise<void> {}
  async pressKey(_key: string): Promise<void> {}
  async selectOption(_selector: string, _value: string): Promise<void> {}
  async setChecked(_selector: string, _checked: boolean): Promise<void> {}
  async getText(_selector: string): Promise<string> { return ''; }
  async getAttribute(_selector: string, _name: string): Promise<string | null> { return null; }
  async waitForSelector(_selector: string, _timeoutMs?: number): Promise<void> {}
  async waitForLoadState(_state?: string, _timeoutMs?: number): Promise<void> {}

  async screenshot() {
    return { bytes: Buffer.from('mock'), mimeType: 'image/png', fullPage: false, size: 4 };
  }
  async domSnapshot() {
    return { html: '<html></html>', htmlLength: 13, title: 't', url: 'about:blank' };
  }
  async accessibilityTree() {
    return { nodes: [], nodeCount: 0, complete: true };
  }
  async consoleMessages() { return []; }
  async networkRequests() { return []; }

  private _cookieStore: Map<string, BrowserCookie[]> = new Map();

  async createContext(options?: BrowserContextOptions): Promise<BrowserContextHandle> {
    return new IsolationMockContext(this as any, options?.isolated ?? true);
  }

  async closeContext(_context: BrowserContextHandle): Promise<void> { /* no-op */ }
  async newPage(_options?: BrowserContextOptions): Promise<PageHandle> {
    class MockPageHandle implements PageHandle {
      readonly pageId = `page-${Math.random().toString(36).slice(2, 8)}`;
      readonly context = {} as BrowserContextHandle;
      get closed() { return false; }
      async navigate(_url: string): Promise<void> {}
      async close(): Promise<void> {}
    }
    return new MockPageHandle();
  }
  async closePage(_page: PageHandle): Promise<void> {}

  async health() {
    return { healthy: true, responsive: true, pageCount: 0, contextCount: 0, lastHeartbeat: Date.now() };
  }
  async ping(): Promise<boolean> { return true; }

  getCapabilities(): ProviderCapabilities {
    return {
      name: 'Isolation Mock',
      version: '1.0.0',
      supportedEngines: ['chromium'] as BrowserEngine[],
      outOfProcessOnly: false,
      features: ['isolated-context', 'cookie-management', 'proxy-config'],
    };
  }
  checkCapabilities(_requirements: import('../providers/browserProvider.js').CapabilityRequirement[]): import('../providers/browserProvider.js').CapabilityNegotiationResult {
    return { compatible: true, providerCapabilities: this.getCapabilities(), missingFeatures: [], missingOptional: [], versionMismatch: false };
  }
}

class IsolationMockContext implements BrowserContextHandle {
  readonly contextId: string;
  readonly provider: BrowserProvider;
  private _closed = false;
  public cookies: BrowserCookie[] = [];
  public isolated: boolean;

  constructor(provider: BrowserProvider, isolated = true) {
    this.contextId = `iso-ctx-${Math.random().toString(36).slice(2, 8)}`;
    this.provider = provider;
    this.isolated = isolated;
  }

  get closed(): boolean { return this._closed; }

  async setCookies(cookies: BrowserCookie[]): Promise<void> {
    if (this.isolated) {
      this.cookies = [...cookies];
    }
  }

  async getCookies(): Promise<BrowserCookie[]> {
    return this.isolated ? [...this.cookies] : [];
  }

  async clearCookies(): Promise<void> {
    this.cookies = [];
  }

  async grantPermissions(_permissions: string[], _origin?: string): Promise<void> {}
  async newPage(_options?: import('../providers/browserProvider.js').NewPageOptions): Promise<import('../providers/browserProvider.js').PageHandle> {
    return {} as import('../providers/browserProvider.js').PageHandle;
  }
  async close(): Promise<void> { this._closed = true; }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('createIsolationProfile: creates a profile with defaults', () => {
  const profile = createIsolationProfile({ label: 'Test Task' });
  assert.ok(profile.profileId.startsWith('profile-'), 'should have profile prefix');
  assert.equal(profile.label, 'Test Task');
  assert.equal(profile.ignoreHTTPSErrors, false);
  assert.equal(profile.isolated, true);
  assert.ok(profile.createdAt > 0, 'should have creation timestamp');
});

test('createIsolationProfile: applies overrides', () => {
  const profile = createIsolationProfile({
    label: 'Custom',
    proxy: 'http://proxy:8080',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    cookies: [{ name: 'session', value: 'abc' }],
  });
  assert.equal(profile.label, 'Custom');
  assert.equal(profile.proxy, 'http://proxy:8080');
  assert.equal(profile.locale, 'fr-FR');
  assert.equal(profile.timezoneId, 'Europe/Paris');
  assert.equal(profile.cookies?.length, 1);
  assert.equal(profile.cookies![0].name, 'session');
});

test('isolateTask: creates an isolated context for a task', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG, provider);
  const result = await isolation.isolateTask('task-1');

  assert.ok(result.success, 'isolation should succeed');
  assert.equal(result.task.taskId, 'task-1');
  assert.equal(result.task.state, 'running');
  assert.equal(result.task.profile.isolated, true);
  assert.ok(result.task.context !== null, 'should have a context');
  assert.equal(result.task.profile.profileId.startsWith('profile-'), true);

  await isolation.cleanupAll();
});

test('isolateTask: records cookie count before task runs', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG, provider);
  const result = await isolation.isolateTask('task-cookies');

  assert.ok(result.task.cookieCountBefore !== undefined, 'should record cookie count before');
  assert.ok(typeof result.task.cookieCountBefore === 'number', 'cookie count should be a number');

  await isolation.cleanupAll();
});

test('isolateTask: applies profile options to context', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(
    { ...DEFAULT_ISOLATION_CONFIG, defaultLocale: 'de-DE', defaultTimezoneId: 'Europe/Berlin' },
    provider,
  );

  const result = await isolation.isolateTask('task-locale');
  assert.equal(result.task.profile.locale, 'de-DE');
  assert.equal(result.task.profile.timezoneId, 'Europe/Berlin');

  await isolation.cleanupAll();
});

test('cleanupTask: clears cookies and closes context', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(
    { ...DEFAULT_ISOLATION_CONFIG, clearCookies: true, clearStorage: true, clearCache: true },
    provider,
  );

  const result = await isolation.isolateTask('task-cleanup');
  // Set some cookies
  await result.task.context.setCookies([
    { name: 'test', value: 'value' },
    { name: 'session', value: 'xyz' },
  ]);

  // Verify cookies were set
  const beforeCookies = await result.task.context.getCookies();
  assert.equal(beforeCookies.length, 2, 'cookies should be set before cleanup');

  // Clean up
  const report = await isolation.cleanupTask('task-cleanup');

  assert.ok(report.contextClosed, 'context should be closed');
  assert.ok(report.cookiesCleared >= 0, 'cookie clear should be attempted');
  assert.ok(report.localStorageCleared, 'localStorage should be marked cleared');
  assert.equal(result.task.state, 'completed', 'task should be marked completed');
});

test('cleanupTask: returns error for unknown task', async () => {
  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG);
  const report = await isolation.cleanupTask('nonexistent-task');
  assert.ok(report.errors.length > 0, 'should report error');
  assert.equal(report.contextClosed, false, 'context should not be closed');
});

test('cleanupAll: cleans up all active tasks', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG, provider);
  await isolation.isolateTask('task-all-1');
  await isolation.isolateTask('task-all-2');
  await isolation.isolateTask('task-all-3');

  assert.equal(isolation.activeCount, 3, 'should have 3 active tasks');

  const reports = await isolation.cleanupAll();
  assert.equal(reports.size, 3, 'should cleanup all 3 tasks');
  assert.equal(isolation.activeCount, 0, 'should have 0 active tasks after cleanup');

  await provider.close();
});

test('activeCount: returns number of active tasks', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG, provider);
  assert.equal(isolation.activeCount, 0, 'should start at 0');

  await isolation.isolateTask('task-count-1');
  assert.equal(isolation.activeCount, 1);

  await isolation.isolateTask('task-count-2');
  assert.equal(isolation.activeCount, 2);

  await isolation.cleanupAll();
  assert.equal(isolation.activeCount, 0);

  await provider.close();
});

test('getTask: retrieves active task by ID', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG, provider);
  await isolation.isolateTask('task-get');

  const task = isolation.getTask('task-get');
  assert.ok(task, 'task should exist');
  assert.equal(task!.taskId, 'task-get');
  assert.equal(task!.state, 'running');

  const missing = isolation.getTask('nonexistent');
  assert.ok(!missing, 'nonexistent task should return undefined');

  await isolation.cleanupAll();
  await provider.close();
});

test('listActiveTasks: returns all active tasks', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG, provider);
  await isolation.isolateTask('task-list-1');
  await isolation.isolateTask('task-list-2');

  const tasks = isolation.listActiveTasks();
  assert.equal(tasks.length, 2, 'should have 2 active tasks');
  assert.ok(tasks.every((t) => t.state === 'running'), 'all should be running');

  await isolation.cleanupAll();
  await provider.close();
});

test('setProvider: sets the provider before isolating', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG);
  isolation.setProvider(provider);

  const result = await isolation.isolateTask('task-provider');
  assert.ok(result.success, 'should work with pre-set provider');

  await isolation.cleanupAll();
  await provider.close();
});

test('isolateTask: fails gracefully when no provider set', async () => {
  const isolation = new BrowserIsolation(DEFAULT_ISOLATION_CONFIG);
  await assert.rejects(
    () => isolation.isolateTask('task-no-provider'),
    /no provider set/i,
    'should throw when no provider is available',
  );
});

test('isolation config: custom settings are applied', async () => {
  const provider = new IsolationMockProvider();
  await provider.launch();

  const config: IsolationConfig = {
    autoIsolate: true,
    clearCookies: false,
    clearStorage: false,
    clearCache: false,
    freshContextPerTask: true,
    defaultProxy: 'http://proxy:3128',
    defaultLocale: 'ja-JP',
    defaultTimezoneId: 'Asia/Tokyo',
  };

  const isolation = new BrowserIsolation(config, provider);
  const result = await isolation.isolateTask('task-config');
  assert.equal(result.task.profile.proxy, 'http://proxy:3128');
  assert.equal(result.task.profile.locale, 'ja-JP');
  assert.equal(result.task.profile.timezoneId, 'Asia/Tokyo');

  await isolation.cleanupAll();
  await provider.close();
});
