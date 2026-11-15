/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Automation Bridge Tests
 * (src/core/browser/tests/automationBridge.test.ts)
 *
 * Tests unified API across providers, command translation, result normalization,
 * and error mapping. Uses mock providers — no browser binary required.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { AutomationBridge, DEFAULT_BRIDGE_CONFIG, CommandNormalizer } from '../automationBridge.js';
import type { BrowserProvider, BrowserLaunchOptions, BrowserContextOptions, BrowserContextHandle, BrowserSessionHealth, ProviderCapabilities, CapabilityRequirement, CapabilityNegotiationResult } from '../providers/browserProvider.js';
import type { BridgeResult } from '../automationBridge.js';

// ─── Mock provider ─────────────────────────────────────────────────────────────

class BridgeMockProvider implements BrowserProvider {
  readonly id: string;
  readonly name: string;
  private _state: 'closed' | 'ready' = 'closed';
  public launchOptions: BrowserLaunchOptions | null = null;

  constructor(id = 'bridge-mock') {
    this.id = id;
    this.name = `Bridge Mock ${id}`;
  }

  get state(): 'closed' | 'ready' { return this._state; }

  async launch(options?: BrowserLaunchOptions): Promise<void> {
    this.launchOptions = options ?? null;
    this._state = 'ready';
  }

  async close(): Promise<void> { this._state = 'closed'; }
  isLaunched(): boolean { return this._state === 'ready'; }

  async navigate(url: string): Promise<void> { this._lastUrl = url; }
  async currentURL(): Promise<string> { return 'about:blank'; }
  async pageTitle(): Promise<string> { return 'Bridge Test'; }
  async reload(): Promise<void> {}
  async goBack(): Promise<void> {}
  async goForward(): Promise<void> {}
  async click(selector: string): Promise<void> { this._lastSelector = selector; }
  async type(_selector: string, text: string): Promise<void> { this._lastText = text; }
  async pressKey(_key: string): Promise<void> {}
  async selectOption(_selector: string, _value: string): Promise<void> {}
  async setChecked(_selector: string, _checked: boolean): Promise<void> {}
  async getText(selector: string): Promise<string> { return `text-from-${selector}`; }
  async getAttribute(selector: string, name: string): Promise<string | null> {
    if (selector === '#id' && name === 'href') return '/target';
    return null;
  }
  async waitForSelector(_selector: string, _timeoutMs?: number): Promise<void> {}
  async waitForLoadState(_state?: string, _timeoutMs?: number): Promise<void> {}

  async screenshot(_options?: { fullPage?: boolean; selector?: string }) {
    return { bytes: Buffer.from('mock-png-data'), mimeType: 'image/png', fullPage: false, size: 12 };
  }

  async domSnapshot() {
    return { html: '<html><body>test</body></html>', htmlLength: 30, title: 't', url: 'about:blank' };
  }

  async accessibilityTree() {
    return { nodes: [{ id: 'n1', role: 'button', name: 'Submit', tag: 'button', boundingBox: { x: 10, y: 20, width: 100, height: 40 }, children: [] }], nodeCount: 1, complete: true };
  }

  async consoleMessages() {
    return [{ type: 'log', text: 'hello' }];
  }

  async networkRequests() {
    return [{ requestId: 'req-1', url: '/api', method: 'GET', resourceType: 'xhr', timestamp: Date.now() }];
  }

  async createContext(options?: BrowserContextOptions): Promise<BrowserContextHandle> {
    this._lastContextOptions = options;
    return new BridgeMockContext(this);
  }

  async closeContext(_context: BrowserContextHandle): Promise<void> {}
  async newPage(): Promise<import('../providers/browserProvider.js').PageHandle> {
    return new class implements import('../providers/browserProvider.js').PageHandle {
      readonly pageId = 'p1';
      readonly context = {} as BrowserContextHandle;
      get closed() { return false; }
      async navigate(_url: string): Promise<void> {}
      async close(): Promise<void> {}
    };
  }
  async closePage(_page: import('../providers/browserProvider.js').PageHandle): Promise<void> {}

  async health(): Promise<BrowserSessionHealth> {
    return { healthy: true, responsive: true, pageCount: 1, contextCount: 1, lastHeartbeat: Date.now() };
  }
  async ping(): Promise<boolean> { return true; }

  getCapabilities(): ProviderCapabilities {
    return {
      name: this.name,
      version: '1.0.0',
      supportedEngines: ['chromium'],
      outOfProcessOnly: false,
      features: ['screenshot', 'dom-snapshot', 'accessibility-tree', 'network-intercept', 'console-capture'] as any[],
      metadata: { providerType: 'mock' },
    };
  }
  checkCapabilities(_requirements: CapabilityRequirement[]): CapabilityNegotiationResult {
    return { compatible: true, providerCapabilities: this.getCapabilities(), missingFeatures: [], missingOptional: [], versionMismatch: false };
  }

  // Tracking for test assertions
  public _lastUrl?: string;
  public _lastSelector?: string;
  public _lastText?: string;
  public _lastContextOptions?: BrowserContextOptions;
}

class BridgeMockContext implements BrowserContextHandle {
  readonly contextId = `bridge-ctx-${Math.random().toString(36).slice(2, 8)}`;
  readonly provider: BrowserProvider;
  private _closed = false;

  constructor(provider: BrowserProvider) {
    this.provider = provider;
  }

  get closed(): boolean { return this._closed; }

  async setCookies(_cookies: import('../providers/browserProvider.js').BrowserCookie[]): Promise<void> {}
  async getCookies(): Promise<import('../providers/browserProvider.js').BrowserCookie[]> { return []; }
  async clearCookies(): Promise<void> {}
  async grantPermissions(_permissions: string[], _origin?: string): Promise<void> {}
  async newPage(): Promise<import('../providers/browserProvider.js').PageHandle> {
    return {} as import('../providers/browserProvider.js').PageHandle;
  }
  async close(): Promise<void> { this._closed = true; }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('launch: executes launch command successfully', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });

  const result = await bridge.launch({ engine: 'chromium', headless: true });
  assert.ok(result.success, 'launch should succeed');
  assert.equal(result.command, 'launch');
  assert.ok(provider.isLaunched(), 'provider should be launched');

  await bridge.close();
});

test('close: executes close command', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.close();
  assert.ok(result.success, 'close should succeed');
  assert.equal(result.command, 'close');
  assert.ok(!provider.isLaunched(), 'provider should be closed');
});

test('navigate: passes URL to provider', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.navigate('https://example.com');
  assert.ok(result.success);
  assert.equal(result.command, 'navigate');
  assert.equal(provider._lastUrl, 'https://example.com');

  await bridge.close();
});

test('click: passes selector to provider', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.click('#submit-btn');
  assert.ok(result.success);
  assert.equal(provider._lastSelector, '#submit-btn');

  await bridge.close();
});

test('typeText: passes selector and text to provider', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.typeText('#email', 'user@example.com');
  assert.ok(result.success);
  assert.equal(provider._lastText, 'user@example.com');

  await bridge.close();
});

test('screenshot: returns image data', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.screenshot(true);
  assert.ok(result.success);
  assert.ok(result.data, 'screenshot data should be present');
  assert.ok(Buffer.isBuffer(result.data!.bytes), 'bytes should be a Buffer');
  assert.equal(result.data!.mimeType, 'image/png');

  await bridge.close();
});

test('getAccessibilityTree: returns accessibility tree', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.getAccessibilityTree();
  assert.ok(result.success);
  assert.ok(result.data, 'tree data should be present');
  assert.ok(Array.isArray(result.data!.nodes), 'nodes should be an array');

  await bridge.close();
});

test('getDomSnapshot: returns DOM snapshot', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.getDomSnapshot();
  assert.ok(result.success);
  assert.ok(result.data, 'snapshot data should be present');
  assert.ok(typeof result.data!.html === 'string', 'html should be a string');

  await bridge.close();
});

test('createIsolatedContext: creates an isolated context', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  const result = await bridge.createIsolatedContext({ isolated: true });
  assert.ok(result.success);

  await bridge.close();
});

test('unknown command: returns error result', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });

  const result = (await bridge.execute('nonexistent-command' as any)) as BridgeResult;
  assert.ok(!result.success);
  assert.ok(result.error?.type === 'UNKNOWN_COMMAND');

  await bridge.close();
});

test('provider error: is mapped to unified error format', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });

  // Execute an unknown command to trigger UNKNOWN_COMMAND error
  const result = (await bridge.execute('nonexistent-command' as any)) as BridgeResult;
  assert.ok(!result.success, 'unknown command should fail');
  assert.ok(result.error?.message, 'should have error message');
  assert.equal(result.error?.type, 'UNKNOWN_COMMAND');

  await bridge.close();
});

test('setProvider: swaps the underlying provider', async () => {
  const provider1 = new BridgeMockProvider('provider-1');
  const provider2 = new BridgeMockProvider('provider-2');
  const bridge = new AutomationBridge(provider1, { logCommands: false });

  await bridge.launch();
  assert.ok(provider1.isLaunched());

  bridge.setProvider(provider2);
  // provider1 should still be launched; provider2 is now the active one
  assert.ok(provider1.isLaunched());

  await bridge.close();
});

test('getStats: tracks command statistics', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();

  await bridge.navigate('https://example.com');
  await bridge.click('#btn');
  await bridge.screenshot();
  await bridge.getAccessibilityTree();
  await bridge.close();

  const stats = bridge.getStats();
  assert.ok(stats.total >= 5, `should have at least 5 commands, got ${stats.total}`);
  assert.ok(stats.successRate >= 0 && stats.successRate <= 100, 'success rate should be 0-100');
  assert.ok('launch' in stats.byCommand, 'should have launch in byCommand');
});

test('clearHistory: resets command history', async () => {
  const provider = new BridgeMockProvider();
  const bridge = new AutomationBridge(provider, { logCommands: false });
  await bridge.launch();
  await bridge.close();

  assert.ok(bridge.getHistory().length > 0, 'should have history');
  bridge.clearHistory();
  assert.equal(bridge.getHistory().length, 0, 'history should be empty after clear');
});

test('CommandNormalizer: normalizes screenshot result', () => {
  const raw = { buffer: Buffer.from('png-data'), mimeType: 'image/png', fullPage: true };
  const result = CommandNormalizer.normalizeScreenshot(raw);
  assert.ok(Buffer.isBuffer(result.bytes));
  assert.equal(result.mimeType, 'image/png');
  assert.equal(result.fullPage, true);
  assert.equal(result.size, Buffer.from('png-data').length, 'size should match buffer length');
});

test('CommandNormalizer: normalizes DOM snapshot', () => {
  const raw = { html: '<html></html>', title: 'Test', url: 'https://test.com' };
  const result = CommandNormalizer.normalizeDomSnapshot(raw);
  assert.equal(result.html, '<html></html>');
  assert.equal(result.htmlLength, 13);
  assert.equal(result.title, 'Test');
  assert.equal(result.url, 'https://test.com');
});

test('CommandNormalizer: normalizes accessibility tree', () => {
  const raw = {
    nodes: [
      { id: 'n1', role: 'button', name: 'Click', tag: 'button', boundingBox: { x: 0, y: 0, width: 50, height: 20 }, children: [] },
      { role: 'textbox', tag: 'input', children: [] },
    ],
  };
  const result = CommandNormalizer.normalizeA11yTree(raw);
  assert.equal(result.nodeCount, 2);
  assert.equal(result.nodes[0].role, 'button');
  assert.equal(result.nodes[0].name, 'Click');
  assert.equal(result.nodes[1].role, 'textbox');
});

test('CommandNormalizer: normalizes network requests', () => {
  const raw = [
    { url: '/api', method: 'POST', resourceType: 'xhr', status: 200, failed: false },
    { url: '/css', method: 'GET', resourceType: 'stylesheet', status: 404, failed: true },
  ];
  const result = CommandNormalizer.normalizeNetworkRequests(raw);
  assert.equal(result.length, 2);
  assert.equal(result[0].requestId, 'req-0');
  assert.equal(result[0].method, 'POST');
  assert.equal(result[0].status, 200);
  assert.equal(result[1].isFailed, true);
  assert.equal(result[1].status, 404);
});
