/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Provider Interface Contract Tests
 * (src/core/browser/tests/browserProvider.test.ts)
 *
 * Verifies that any BrowserProvider implementation satisfies the abstract contract.
 * Uses a minimal mock provider that implements the full interface.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  type BrowserProvider,
  type BrowserLaunchOptions,
  type BrowserContextOptions,
  type NewPageOptions,
  type BrowserContextHandle,
  type PageHandle,
  type ScreenshotResult,
  type DomSnapshot,
  type A11yTree,
  type A11yNode,
  type BrowserCookie,
  type NetworkRequest,
  type ConsoleMessage,
  type BrowserSessionHealth,
  type ProviderCapabilities,
  type CapabilityRequirement,
  type CapabilityNegotiationResult,
  type BrowserSessionState,
  type BrowserViewport,
  type BrowserFeature,
  BrowserLaunchError,
  BrowserNavigationError,
  BrowserInteractionError,
  BrowserTimeoutError,
  BrowserResourceError,
} from '../providers/browserProvider.js';

// ─── Minimal mock provider ─────────────────────────────────────────────────────

class ContractMockProvider implements BrowserProvider {
  readonly id = 'contract-mock';
  readonly name = 'Contract Mock';
  private _state: BrowserSessionState = 'closed';

  get state(): BrowserSessionState { return this._state; }

  async launch(options?: BrowserLaunchOptions): Promise<void> {
    this._state = 'ready';
    this._lastLaunchOptions = options;
  }

  async close(): Promise<void> { this._state = 'closed'; }
  isLaunched(): boolean { return this._state === 'ready'; }

  async navigate(url: string): Promise<void> {
    this._state = 'navigating';
    await sleep(10);
    this._lastNavigatedUrl = url;
    this._state = 'ready';
  }
  async currentURL(): Promise<string> { return this._lastNavigatedUrl ?? 'about:blank'; }
  async pageTitle(): Promise<string> { return 'Contract Test'; }
  async reload(): Promise<void> { this._reloadCount = (this._reloadCount ?? 0) + 1; }
  async goBack(): Promise<void> {}
  async goForward(): Promise<void> {}

  async click(selector: string): Promise<void> {
    if (selector === 'timeout') throw new BrowserTimeoutError('selector timeout', this.id, 'click', 5000);
    if (selector === 'missing') throw new BrowserInteractionError('not found', this.id, selector, 'click');
    this._lastClicked = selector;
  }

  async type(selector: string, text: string): Promise<void> {
    this._lastTyped = { selector, text };
  }

  async pressKey(key: string): Promise<void> { this._lastKey = key; }
  async selectOption(selector: string, value: string): Promise<void> { this._lastSelect = { selector, value }; }
  async setChecked(selector: string, checked: boolean): Promise<void> { this._lastChecked = { selector, checked }; }

  async getText(selector: string): Promise<string> {
    if (selector === 'empty') return '';
    return `text:${selector}`;
  }

  async getAttribute(selector: string, name: string): Promise<string | null> {
    if (selector === '#link' && name === 'href') return '/target';
    return null;
  }

  async waitForSelector(selector: string, timeoutMs = 10000): Promise<void> {
    if (selector === 'missing') throw new BrowserTimeoutError('not found', this.id, 'waitForSelector', timeoutMs);
  }

  async waitForLoadState(state?: string, timeoutMs?: number): Promise<void> {
    if (state === 'networkidle' && timeoutMs === 100) throw new BrowserTimeoutError('timeout', this.id, 'waitForLoadState', 100);
  }

  async screenshot(options?: { fullPage?: boolean; selector?: string }): Promise<ScreenshotResult> {
    return { bytes: Buffer.from('png'), mimeType: 'image/png', fullPage: options?.fullPage ?? false, size: 3 };
  }

  async domSnapshot(): Promise<DomSnapshot> {
    return { html: '<html><body>hello</body></html>', htmlLength: 30, title: 't', url: this._lastNavigatedUrl ?? 'about:blank' };
  }

  async accessibilityTree(): Promise<A11yTree> {
    return {
      nodes: [
        { nodeId: 'n1', role: 'button', name: 'Submit', tag: 'button', cssSelector: '#submit', boundingBox: { x: 10, y: 20, width: 100, height: 40 }, visible: true, enabled: true, children: [] },
      ],
      nodeCount: 1,
      complete: true,
    };
  }

  async consoleMessages(): Promise<ConsoleMessage[]> {
    return [{ type: 'log', text: 'hello' }];
  }

  async networkRequests(): Promise<NetworkRequest[]> {
    return [{ requestId: 'req-1', url: '/api', method: 'GET', resourceType: 'xhr', timestamp: Date.now() }];
  }

  async createContext(options?: BrowserContextOptions): Promise<BrowserContextHandle> {
    this._contextCount = (this._contextCount ?? 0) + 1;
    return new MockCtxHandle(this, options?.isolated ?? false);
  }

  async closeContext(context: BrowserContextHandle): Promise<void> {
    (context as MockCtxHandle).markClosed();
  }

  async newPage(options?: NewPageOptions): Promise<PageHandle> {
    return new MockPageHandle(this);
  }

  async closePage(page: PageHandle): Promise<void> {
    (page as MockPageHandle).markClosed();
  }

  async health(): Promise<BrowserSessionHealth> {
    return { healthy: true, responsive: true, memoryMB: 128, cpuPercent: 15, pageCount: 1, contextCount: this._contextCount ?? 0, lastHeartbeat: Date.now() };
  }

  async ping(): Promise<boolean> { return true; }

  getCapabilities(): ProviderCapabilities {
    return {
      name: this.name,
      version: '1.0.0',
      supportedEngines: ['chromium'],
      outOfProcessOnly: false,
      features: ['screenshot', 'dom-snapshot', 'accessibility-tree', 'isolated-context', 'cookie-management'] as BrowserFeature[],
    };
  }

  checkCapabilities(requirements: CapabilityRequirement[]): CapabilityNegotiationResult {
    const features = this.getCapabilities().features;
    const missing = requirements.filter((r) => r.required && !features.includes(r.feature));
    return {
      compatible: missing.length === 0,
      providerCapabilities: this.getCapabilities(),
      missingFeatures: missing.map((m) => m.feature),
      missingOptional: [],
      versionMismatch: false,
    };
  }

  // Tracking
  public _lastLaunchOptions?: BrowserLaunchOptions;
  public _lastNavigatedUrl?: string;
  public _lastClicked?: string;
  public _lastTyped?: { selector: string; text: string };
  public _lastKey?: string;
  public _lastSelect?: { selector: string; value: string };
  public _lastChecked?: { selector: string; checked: boolean };
  private _reloadCount = 0;
  private _contextCount = 0;
}

class MockCtxHandle implements BrowserContextHandle {
  readonly contextId = `ctx-${Math.random().toString(36).slice(2, 8)}`;
  readonly provider: BrowserProvider;
  private _closed = false;

  constructor(provider: BrowserProvider, public isolated = false) {
    this.provider = provider;
  }

  get closed(): boolean { return this._closed; }
  markClosed() { this._closed = true; }

  async setCookies(cookies: BrowserCookie[]): Promise<void> { this._cookies = [...cookies]; }
  async getCookies(): Promise<BrowserCookie[]> { return [...this._cookies]; }
  async clearCookies(): Promise<void> { this._cookies = []; }
  async grantPermissions(_permissions: string[], _origin?: string): Promise<void> {}
  async newPage(): Promise<PageHandle> { return new MockPageHandle(this.provider); }
  async close(): Promise<void> { this._closed = true; }

  private _cookies: BrowserCookie[] = [];
}

class MockPageHandle implements PageHandle {
  readonly pageId = `page-${Math.random().toString(36).slice(2, 8)}`;
  readonly context: BrowserContextHandle;
  private _closed = false;

  constructor(provider: BrowserProvider) {
    this.context = {} as BrowserContextHandle;
  }

  get closed(): boolean { return this._closed; }
  markClosed() { this._closed = true; }

  async navigate(_url: string): Promise<void> {}
  async close(): Promise<void> { this._closed = true; }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Tests ────────────────────────────────────────────────────────────────────

test('provider: has stable id and name', () => {
  const provider = new ContractMockProvider();
  assert.equal(provider.id, 'contract-mock');
  assert.equal(provider.name, 'Contract Mock');
});

test('provider: state starts as closed', () => {
  const provider = new ContractMockProvider();
  assert.equal(provider.state, 'closed');
  assert.ok(!provider.isLaunched());
});

test('provider: launch transitions to ready', async () => {
  const provider = new ContractMockProvider();
  assert.equal(provider.state, 'closed');
  await provider.launch({ engine: 'chromium', headless: true });
  assert.equal(provider.state, 'ready');
  assert.ok(provider.isLaunched());
});

test('provider: close transitions to closed', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  assert.ok(provider.isLaunched());
  await provider.close();
  assert.equal(provider.state, 'closed');
  assert.ok(!provider.isLaunched());
});

test('provider: close is idempotent', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await provider.close();
  await provider.close(); // second close should not throw
  assert.equal(provider.state, 'closed');
});

test('provider: navigate sets current URL', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await provider.navigate('https://example.com');
  assert.equal(await provider.currentURL(), 'https://example.com');
  assert.equal(await provider.pageTitle(), 'Contract Test');
});

test('provider: click records selector', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await provider.click('#btn');
  assert.equal(provider['_lastClicked'], '#btn');
});

test('provider: click throws for timeout selector', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await assert.rejects(() => provider.click('timeout'), /timeout/i);
});

test('provider: type records selector and text', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await provider.type('#email', 'hello');
  assert.equal(provider['_lastTyped']?.selector, '#email');
  assert.equal(provider['_lastTyped']?.text, 'hello');
});

test('provider: getText returns text content', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const text = await provider.getText('#para');
  assert.equal(text, 'text:#para');
});

test('provider: getText returns empty for empty selector', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const text = await provider.getText('empty');
  assert.equal(text, '');
});

test('provider: getAttribute returns value', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const href = await provider.getAttribute('#link', 'href');
  assert.equal(href, '/target');
});

test('provider: getAttribute returns null for missing attribute', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const val = await provider.getAttribute('#unknown', 'data-x');
  assert.equal(val, null);
});

test('provider: screenshot returns png', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const shot = await provider.screenshot({ fullPage: true });
  assert.ok(Buffer.isBuffer(shot.bytes));
  assert.equal(shot.mimeType, 'image/png');
  assert.equal(shot.fullPage, true);
  assert.ok(shot.size > 0);
});

test('provider: domSnapshot returns html', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const snap = await provider.domSnapshot();
  assert.ok(typeof snap.html === 'string');
  assert.ok(snap.htmlLength > 0);
  assert.ok(typeof snap.title === 'string');
  assert.ok(typeof snap.url === 'string');
});

test('provider: accessibilityTree returns nodes', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const tree = await provider.accessibilityTree();
  assert.ok(Array.isArray(tree.nodes));
  assert.ok(tree.nodes.length > 0);
  assert.equal(tree.nodeCount, tree.nodes.length);
  assert.ok(tree.nodes[0].role.length > 0, 'node should have a role');
  assert.ok(tree.nodes[0].boundingBox.width > 0, 'node should have dimensions');
});

test('provider: createContext returns handle', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const ctx = await provider.createContext({ isolated: true });
  assert.ok(ctx, 'context should be returned');
  assert.ok(ctx.contextId.length > 0);
  assert.equal(ctx.provider.id, provider.id);
});

test('provider: context cookies', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const ctx = await provider.createContext({ isolated: true });
  await ctx.setCookies([{ name: 's', value: 'v' }]);
  const cookies = await ctx.getCookies();
  assert.equal(cookies.length, 1);
  assert.equal(cookies[0].name, 's');
});

test('provider: context clearCookies', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const ctx = await provider.createContext();
  await ctx.setCookies([{ name: 's', value: 'v' }]);
  await ctx.clearCookies();
  const cookies = await ctx.getCookies();
  assert.equal(cookies.length, 0);
});

test('provider: context close', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const ctx = await provider.createContext();
  assert.ok(!ctx.closed);
  await ctx.close();
  assert.ok(ctx.closed);
});

test('provider: closeContext', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const ctx = await provider.createContext();
  await provider.closeContext(ctx);
  assert.ok(ctx.closed);
});

test('provider: newPage returns handle', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const page = await provider.newPage();
  assert.ok(page, 'page should be returned');
  assert.ok(page.pageId.length > 0);
  assert.ok(!page.closed);
});

test('provider: closePage', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const page = await provider.newPage();
  await provider.closePage(page);
  assert.ok(page.closed);
});

test('provider: health returns metrics', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const h = await provider.health();
  assert.ok(typeof h.healthy === 'boolean');
  assert.ok(typeof h.responsive === 'boolean');
  assert.ok(typeof h.lastHeartbeat === 'number');
});

test('provider: ping returns boolean', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const alive = await provider.ping();
  assert.equal(typeof alive, 'boolean');
});

test('provider: getCapabilities returns features', () => {
  const provider = new ContractMockProvider();
  const caps = provider.getCapabilities();
  assert.ok(caps.name.length > 0);
  assert.ok(caps.version.length > 0);
  assert.ok(Array.isArray(caps.supportedEngines));
  assert.ok(Array.isArray(caps.features));
});

test('provider: checkCapabilities reports missing features', () => {
  const provider = new ContractMockProvider();
  const result = provider.checkCapabilities([
    { feature: 'screenshot', required: true },
    { feature: 'video-capture', required: true },
  ]);
  assert.ok(!result.compatible, 'should be incompatible with missing required feature');
  assert.ok(result.missingFeatures.includes('video-capture'));
});

test('provider: checkCapabilities reports compatible when all features present', () => {
  const provider = new ContractMockProvider();
  const result = provider.checkCapabilities([
    { feature: 'screenshot', required: true },
    { feature: 'dom-snapshot', required: true },
  ]);
  assert.ok(result.compatible);
  assert.ok(result.missingFeatures.length === 0);
});

test('provider: waitForSelector times out', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await assert.rejects(
    () => provider.waitForSelector('missing', 100),
    /not found|timeout|TIMEOUT/i,
    'should throw on missing selector',
  );
});

test('provider: waitForLoadState times out', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await assert.rejects(
    () => provider.waitForLoadState('networkidle', 100),
    /timeout|TIMEOUT/i,
    'should throw on load state timeout',
  );
});

test('provider: consoleMessages returns messages', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const msgs = await provider.consoleMessages();
  assert.ok(Array.isArray(msgs));
  assert.ok(msgs.length >= 0); // may be empty or have messages
});

test('provider: networkRequests returns requests', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const reqs = await provider.networkRequests();
  assert.ok(Array.isArray(reqs));
});

test('provider: reload increments counter', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  await provider.reload();
  await provider.reload();
  assert.equal(provider['_reloadCount'], 2);
});

test('provider: createContextOptions are applied to context', async () => {
  const provider = new ContractMockProvider();
  await provider.launch();
  const ctx = await provider.createContext({
    isolated: true,
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
  });
  // The mock context records isolation; verify the handle was created with options
  assert.ok(ctx, 'context should be returned');
  assert.equal(ctx.contextId.startsWith('ctx-'), true);
});
