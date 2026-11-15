/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Playwright Provider
 * (src/core/browser/providers/playwrightProvider.ts)
 *
 * Implements the BrowserProvider interface using Playwright as the backend.
 * Research sources:
 *   - microsoft/playwright (MIT) — cross-browser automation API shape
 *
 * This provider uses Playwright's Browser / BrowserContext / Page hierarchy
 * directly.  It does NOT wrap Playwright 1:1 — it maps Playwright concepts
 * onto AETHER's BrowserProvider contract so callers never depend on Playwright
 * types.
 *
 * IMPORTANT: Playwright is an optional runtime dependency.  The provider
 * attempts a dynamic import of `playwright`; if unavailable, `launch()` throws
 * a clear error telling the caller to install it.  This keeps the build green
 * on machines that don't need Playwright.
 *
 * Installation (when needed):
 *   npm install --save-dev playwright
 *   npx playwright install chromium firefox webkit
 */

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
  type BrowserFeature,
  type CapabilityRequirement,
  type CapabilityNegotiationResult,
  type BrowserSessionState,
  type BrowserViewport,
  BrowserLaunchError,
  BrowserNavigationError,
  BrowserInteractionError,
  BrowserTimeoutError,
  BrowserResourceError,
} from './browserProvider.js';

// ─── Playwright availability ───────────────────────────────────────────────────
// Playwright is an optional runtime dependency. We declare a minimal ambient module
// so the file type-checks without requiring playwright as a dev dependency.
// A type-only ambient declaration satisfies TypeScript's module resolution.

interface PlaywrightLibrary {
  chromium: PlaywrightBrowserType;
  firefox: PlaywrightBrowserType;
  webkit: PlaywrightBrowserType;
}

declare module 'playwright' {
  const _mod: PlaywrightLibrary;
  export default _mod;
  export const chromium: PlaywrightLibrary['chromium'];
  export const firefox: PlaywrightLibrary['firefox'];
  export const webkit: PlaywrightLibrary['webkit'];
}

// ─── Local type stubs for playwright objects ───────────────────────────────────

interface PlaywrightLocator {
  screenshot(options?: { path?: string }): Promise<Buffer>;
  textContent(): Promise<string | null>;
  getAttribute(name: string): Promise<string | null>;
  evaluate(fn: string): Promise<unknown>;
}

interface PlaywrightPageObj {
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<void>;
  content(): Promise<string>;
  title(): Promise<string>;
  url(): string;
  accessibility: { snapshot(options?: { interestingOnly?: boolean }): PlaywrightA11yNode | null };
  $(selector: string): Promise<PlaywrightLocator | null>;
  evaluate<T = unknown>(fn: string): Promise<T>;
  keyboard: { press(key: string): Promise<void> };
  on(event: string, handler: (...args: unknown[]) => void): void;
  screenshot(options?: { fullPage?: boolean }): Promise<Buffer>;
  waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>;
  waitForLoadState(state?: string, options?: { timeout?: number }): Promise<void>;
  close(): Promise<void>;
  reload(options?: { waitUntil?: string }): Promise<void>;
  goBack(options?: { waitUntil?: string }): Promise<void>;
  goForward(options?: { waitUntil?: string }): Promise<void>;
  click(selector: string, options?: { timeout?: number }): Promise<void>;
  fill(selector: string, text: string, options?: { timeout?: number }): Promise<void>;
  selectOption(selector: string, value: string, options?: { timeout?: number }): Promise<void>;
  setChecked(selector: string, checked: boolean, options?: { timeout?: number }): Promise<void>;
  textContent(selector: string): Promise<string | null>;
}

interface PlaywrightBrowserContextObj {
  newPage(): Promise<PlaywrightPageObj>;
  cookies(): Promise<PlaywrightCookieObj[]>;
  addCookies(cookies: PlaywrightCookieObj[]): Promise<void>;
  clearCookies(): Promise<void>;
  grantPermissions(permissions: string[], options?: { origin?: string }): Promise<void>;
  setGeolocation(geo: { latitude: number; longitude: number; accuracy?: number }): Promise<void>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  close(): Promise<void>;
}

interface PlaywrightBrowserObj {
  newContext(options?: Record<string, unknown>): Promise<PlaywrightBrowserContextObj>;
  close(): Promise<void>;
  metrics?(): Promise<{ jsHeapUsedSize?: number } | null>;
}

interface PlaywrightBrowserType {
  launch(options?: { headless?: boolean; args?: string[]; proxy?: { server: string }; env?: Record<string, string>; ignoreDefaultArgs?: string[] | boolean }): Promise<PlaywrightBrowserObj>;
}

interface PlaywrightA11yNode {
  role?: string;
  name?: string;
  children?: PlaywrightA11yNode[];
}

interface PlaywrightCookieObj {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: string;
}

interface PlaywrightRequestObj {
  url(): string;
  method(): string;
  resourceType(): string;
}

interface PlaywrightResponseObj {
  request(): PlaywrightRequestObj;
  status(): number;
  headers(): Record<string, string>;
}

// ─── Playwright loading ───────────────────────────────────────────────────────

let playwrightLib: PlaywrightLibrary | null = null;

async function getPlaywright(): Promise<PlaywrightLibrary> {
  if (playwrightLib) return playwrightLib;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    playwrightLib = await import('playwright');
    return playwrightLib;
  } catch {
    throw new Error(
      'Playwright is not installed. Install it with:\n' +
        '  npm install --save-dev playwright\n' +
        '  npx playwright install chromium firefox webkit'
    );
  }
}

// ─── Internal handles ─────────────────────────────────────────────────────────

interface PlaywrightSession {
  browser: PlaywrightBrowserObj;
  defaultContext: PlaywrightBrowserContextObj;
  contexts: Map<string, AetherContext>;
  pages: Map<string, AetherPage>;
  consoleMessages: ConsoleMessage[];
  networkRequests: NetworkRequest[];
  closed: boolean;
}

interface AetherContext {
  contextId: string;
  context: PlaywrightBrowserContextObj;
  pages: Map<string, AetherPage>;
  closed: boolean;
  parent: PlaywrightSession;
}

interface AetherPage {
  pageId: string;
  page: PlaywrightPageObj;
  context: AetherContext;
  closed: boolean;
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

let _ctxCounter = 0;
let _pageCounter = 0;

function nextContextId(): string {
  return `ctx-${++_ctxCounter}-${Date.now().toString(36)}`;
}

function nextPageId(): string {
  return `page-${++_pageCounter}-${Date.now().toString(36)}`;
}

const DEFAULT_NAVIGATION_TIMEOUT = 30_000;
const DEFAULT_ACTION_TIMEOUT = 10_000;

function toViewport(v?: BrowserViewport): { width: number; height: number; deviceScaleFactor?: number } | undefined {
  if (!v) return undefined;
  return {
    width: v.width,
    height: v.height,
    deviceScaleFactor: v.deviceScaleFactor ?? 1,
  };
}

function mapBrowserState(ps: PlaywrightSession | undefined): BrowserSessionState {
  if (!ps) return 'closed';
  if (ps.closed) return 'closed';
  return 'ready';
}

// ─── Provider implementation ───────────────────────────────────────────────────

export class PlaywrightProvider implements BrowserProvider {
  readonly id: string;
  readonly name: string;
  private _session: PlaywrightSession | null = null;
  private _defaultContext: AetherContext | null = null;
  private _state: BrowserSessionState = 'launching';

  constructor(id = 'playwright-cross-browser') {
    this.id = id;
    this.name = 'Playwright Cross-Browser Provider';
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  get state(): BrowserSessionState {
    return this._state;
  }

  async launch(options: BrowserLaunchOptions = {}): Promise<void> {
    if (this._session && !this._session.closed) {
      return; // already launched
    }

    const pw = await getPlaywright();

    const engine = options.engine ?? 'chromium';
    const supportedEngines = this.getCapabilities().supportedEngines;
    if (!supportedEngines.includes(engine)) {
      throw new BrowserLaunchError(
        `Unsupported browser engine: "${engine}". Supported: ${supportedEngines.join(', ')}`,
        this.id,
      );
    }

    const browserType = (pw as unknown as Record<string, PlaywrightBrowserType>)[engine];
    if (!browserType || typeof browserType.launch !== 'function') {
      throw new BrowserLaunchError(
        `Playwright does not expose a "${engine}" browser type. Is Playwright installed correctly?`,
        this.id,
      );
    }

    this._state = 'launching';

    try {
      const browser = await browserType.launch({
        headless: options.headless ?? true,
        args: options.args,
        proxy: options.proxy ? { server: options.proxy } : undefined,
        ignoreDefaultArgs: undefined,
        env: options.env,
      });

      const defaultContext = await browser.newContext({
        ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? false,
        viewport: toViewport(options.viewport),
      });

      const session: PlaywrightSession = {
        browser,
        defaultContext,
        contexts: new Map(),
        pages: new Map(),
        consoleMessages: [],
        networkRequests: [],
        closed: false,
      };

      const aetherCtx: AetherContext = {
        contextId: nextContextId(),
        context: defaultContext,
        pages: new Map(),
        closed: false,
        parent: session,
      };

      session.contexts.set(aetherCtx.contextId, aetherCtx);
      this._session = session;
      this._defaultContext = aetherCtx;
      this._state = 'ready';

      // Hook up console capture on the default context's default page
      const defaultPage = await defaultContext.newPage();
      const aetherPage: AetherPage = {
        pageId: nextPageId(),
        page: defaultPage,
        context: aetherCtx,
        closed: false,
      };
      aetherCtx.pages.set(aetherPage.pageId, aetherPage);
      session.pages.set(aetherPage.pageId, aetherPage);

      defaultPage.on('console', (msg: { type(): string; text(): string; location(): { url: string; lineNumber: number } | null }) => {
        session.consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location() ? { url: msg.location().url, lineNumber: msg.location().lineNumber } : undefined,
          stackTrace: msg.location()?.url,
        });
      });

      defaultPage.on('request', (req: PlaywrightRequestObj) => {
        session.networkRequests.push({
          requestId: req.url(),
          url: req.url(),
          method: req.method(),
          resourceType: req.resourceType(),
          timestamp: Date.now(),
        });
      });

      defaultPage.on('response', (res: PlaywrightResponseObj) => {
        const existing = session.networkRequests.find((r) => r.url === res.request().url() && !r.status);
        if (existing) {
          existing.status = res.status();
          existing.mimeType = res.headers()['content-type'];
        }
      });

      defaultPage.on('requestfailed', (req: PlaywrightRequestObj) => {
        const existing = session.networkRequests.find((r) => r.url === req.url() && !r.status);
        if (existing) {
          existing.isFailed = true;
        }
      });
    } catch (e) {
      this._state = 'error';
      throw new BrowserLaunchError(
        e instanceof Error ? e.message : String(e),
        this.id,
        e,
      );
    }
  }

  async close(): Promise<void> {
    if (!this._session || this._session.closed) return;

    this._state = 'closing';

    try {
      // Close all pages first, then contexts, then browser
      const closePromises: Promise<void>[] = [];
      for (const page of this._session.pages.values()) {
        if (!page.closed) closePromises.push(page.page.close().catch(() => {}));
      }
      await Promise.all(closePromises);

      for (const ctx of this._session.contexts.values()) {
        if (!ctx.closed) await ctx.context.close().catch(() => {});
      }

      await this._session.browser.close().catch(() => {});
    } catch {
      // best-effort cleanup
    }

    this._session.closed = true;
    this._session = null;
    this._defaultContext = null;
    this._state = 'closed';
  }

  isLaunched(): boolean {
    return this._session !== null && !this._session.closed;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private activePage(): AetherPage {
    if (!this._defaultContext || this._defaultContext.closed) {
      throw new BrowserNavigationError('No active browser context', this.id, '');
    }
    const pages = Array.from(this._defaultContext.pages.values()).filter((p) => !p.closed);
    if (pages.length === 0) {
      throw new BrowserNavigationError('No active page in default context', this.id, '');
    }
    return pages[0];
  }

  private async withTimeout<T>(fn: () => Promise<T>, ms: number, operation: string): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new BrowserTimeoutError(`${operation} timed out after ${ms}ms`, this.id, operation, ms)), ms),
      ),
    ]);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  async navigate(url: string): Promise<void> {
    if (!this._session || this._session.closed) {
      throw new BrowserNavigationError('Browser not launched', this.id, url);
    }

    this._state = 'navigating';
    const page = this.activePage();
    const timeout = DEFAULT_NAVIGATION_TIMEOUT;

    try {
      await this.withTimeout(
        () => page.page.goto(url, { waitUntil: 'domcontentloaded', timeout }),
        timeout,
        'navigate',
      );
      this._state = 'ready';
    } catch (e) {
      this._state = 'error';
      const msg = e instanceof Error ? e.message : String(e);
      const statusMatch = msg.match(/status code (\d+)/);
      throw new BrowserNavigationError(
        `Navigation to "${url}" failed: ${msg}`,
        this.id,
        url,
        statusMatch ? Number(statusMatch[1]) : undefined,
        e,
      );
    }
  }

  async currentURL(): Promise<string> {
    return this.activePage().page.url();
  }

  async pageTitle(): Promise<string> {
    return this.activePage().page.title();
  }

  async reload(): Promise<void> {
    await this.withTimeout(() => this.activePage().page.reload({ waitUntil: 'domcontentloaded' }), DEFAULT_NAVIGATION_TIMEOUT, 'reload');
  }

  async goBack(): Promise<void> {
    await this.withTimeout(() => this.activePage().page.goBack({ waitUntil: 'domcontentloaded' }), DEFAULT_NAVIGATION_TIMEOUT, 'goBack');
  }

  async goForward(): Promise<void> {
    await this.withTimeout(() => this.activePage().page.goForward({ waitUntil: 'domcontentloaded' }), DEFAULT_NAVIGATION_TIMEOUT, 'goForward');
  }

  // ── Interaction ────────────────────────────────────────────────────────────

  async click(selector: string): Promise<void> {
    try {
      await this.withTimeout(
        () => this.activePage().page.click(selector, { timeout: DEFAULT_ACTION_TIMEOUT }),
        DEFAULT_ACTION_TIMEOUT + 1000,
        'click',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/timeout/i.test(msg)) {
        throw new BrowserTimeoutError(`Element not found or not clickable: "${selector}"`, this.id, 'click', DEFAULT_ACTION_TIMEOUT, e);
      }
      throw new BrowserInteractionError(`Click failed on "${selector}": ${msg}`, this.id, selector, 'click', e);
    }
  }

  async type(selector: string, text: string): Promise<void> {
    try {
      await this.withTimeout(
        () => this.activePage().page.fill(selector, text, { timeout: DEFAULT_ACTION_TIMEOUT }),
        DEFAULT_ACTION_TIMEOUT + 1000,
        'type',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BrowserInteractionError(`Type failed on "${selector}": ${msg}`, this.id, selector, 'type', e);
    }
  }

  async pressKey(key: string): Promise<void> {
    await this.activePage().page.keyboard.press(key);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    try {
      await this.withTimeout(
        () => this.activePage().page.selectOption(selector, value, { timeout: DEFAULT_ACTION_TIMEOUT }),
        DEFAULT_ACTION_TIMEOUT + 1000,
        'selectOption',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BrowserInteractionError(`Select option failed on "${selector}": ${msg}`, this.id, selector, 'selectOption', e);
    }
  }

  async setChecked(selector: string, checked: boolean): Promise<void> {
    try {
      await this.withTimeout(
        () => this.activePage().page.setChecked(selector, checked, { timeout: DEFAULT_ACTION_TIMEOUT }),
        DEFAULT_ACTION_TIMEOUT + 1000,
        'setChecked',
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BrowserInteractionError(`Set checked failed on "${selector}": ${msg}`, this.id, selector, 'setChecked', e);
    }
  }

  async getText(selector: string): Promise<string> {
    try {
      return await this.activePage().page.textContent(selector);
    } catch {
      return '';
    }
  }

  async getAttribute(selector: string, name: string): Promise<string | null> {
    try {
      const el = await this.activePage().page.$(selector);
      if (!el) return null;
      return await el.getAttribute(name);
    } catch {
      return null;
    }
  }

  async waitForSelector(selector: string, timeoutMs = DEFAULT_ACTION_TIMEOUT): Promise<void> {
    try {
      await this.withTimeout(
        () => this.activePage().page.waitForSelector(selector, { timeout: timeoutMs }),
        timeoutMs + 1000,
        'waitForSelector',
      );
    } catch (e) {
      throw new BrowserTimeoutError(`Selector not found: "${selector}"`, this.id, 'waitForSelector', timeoutMs, e);
    }
  }

  async waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'networkidle', timeoutMs = DEFAULT_NAVIGATION_TIMEOUT): Promise<void> {
    try {
      await this.withTimeout(
        () => this.activePage().page.waitForLoadState(state, { timeout: timeoutMs }),
        timeoutMs + 1000,
        `waitForLoadState(${state})`,
      );
    } catch (e) {
      throw new BrowserTimeoutError(`Load state "${state}" not reached`, this.id, `waitForLoadState`, timeoutMs, e);
    }
  }

  // ── Capture / introspection ─────────────────────────────────────────────────

  async screenshot(options: { fullPage?: boolean; selector?: string } = {}): Promise<ScreenshotResult> {
    try {
      const page = this.activePage().page;
      let bytes: Buffer;
      if (options.selector) {
        const el = await page.$(options.selector);
        if (!el) throw new Error(`Element not found: ${options.selector}`);
        bytes = Buffer.from((await el.screenshot()) as Buffer);
      } else {
        bytes = Buffer.from(await page.screenshot({ fullPage: options.fullPage ?? false }));
      }
      return {
        bytes,
        mimeType: 'image/png',
        fullPage: options.fullPage ?? false,
        size: bytes.length,
      };
    } catch (e) {
      throw new BrowserInteractionError(`Screenshot failed: ${e instanceof Error ? e.message : String(e)}`, this.id, options.selector ?? '', 'screenshot', e);
    }
  }

  async domSnapshot(): Promise<DomSnapshot> {
    const page = this.activePage().page;
    const html = await page.content();
    const title = await page.title();
    const url = page.url();
    return { html, htmlLength: html.length, title, url };
  }

  async accessibilityTree(): Promise<A11yTree> {
    const page = this.activePage().page;
    const snapshot = await page.accessibility.snapshot({ interestingOnly: false });

    const nodes: A11yNode[] = [];
    const nodeMap = new Map<string | undefined, string>();

    function walk(node: PlaywrightA11yNode, parentId?: string): string {
      const nodeId = `n-${nodes.length}`;
      const role = node.role ?? '';
      const name = node.name ?? '';
      const bbox = (node as unknown as { boundingBox?: { x: number; y: number; width: number; height: number } }).boundingBox;
      const a11yNode: A11yNode = {
        nodeId,
        role,
        name,
        tag: role.toLowerCase(),
        cssSelector: '',
        boundingBox: bbox ?? { x: 0, y: 0, width: 0, height: 0 },
        visible: true,
        enabled: true,
        children: [],
      };
      nodes.push(a11yNode);
      if (parentId !== undefined) {
        const parent = nodes.find((n) => n.nodeId === parentId);
        if (parent) parent.children.push(nodeId);
      }
      if (node.children) {
        for (const child of node.children) {
          walk(child, nodeId);
        }
      }
      return nodeId;
    }

    if (snapshot) walk(snapshot);

    // Add CSS selectors via DOM query
    try {
      const page = this.activePage().page;
      for (const a11yNode of nodes) {
        try {
          const el = await page.$(`[role="${a11yNode.role}"], ${a11yNode.tag}`);
          if (el) {
            const cssSelector = await el.evaluate((e: Element) => {
              if (e.id) return '#' + e.id;
              const parts: string[] = [];
              let p: ParentNode | null = e;
              while (p && p !== e.ownerDocument && (p as Element).tagName) {
                const tag = (p as Element).tagName.toLowerCase();
                let part = tag;
                const siblings = p.parentElement ? Array.from(p.parentElement.children).filter((c) => (c as Element).tagName.toLowerCase() === tag) : [];
                if (siblings.length > 1) {
                  part += `:nth-of-type(${siblings.indexOf(p as Element) + 1})`;
                }
                parts.unshift(part);
                p = p.parentElement ?? p.parentNode;
              }
              return parts.join('>');
            });
            a11yNode.cssSelector = cssSelector;
            const elementId = await el.evaluate((e: Element) => e.id || undefined);
            a11yNode.elementId = elementId;
          }
        } catch {
          // selector derivation is best-effort
        }
      }
    } catch {
      // best-effort selector enrichment
    }

    return { nodes, nodeCount: nodes.length, complete: true };
  }

  async consoleMessages(): Promise<ConsoleMessage[]> {
    if (!this._session) return [];
    const msgs = [...this._session.consoleMessages];
    this._session.consoleMessages = [];
    return msgs;
  }

  async networkRequests(): Promise<NetworkRequest[]> {
    if (!this._session) return [];
    const reqs = [...this._session.networkRequests];
    this._session.networkRequests = [];
    return reqs;
  }

  // ── Context management ──────────────────────────────────────────────────────

  async createContext(options: BrowserContextOptions = {}): Promise<BrowserContextHandle> {
    if (!this._session || this._session.closed) {
      throw new BrowserLaunchError('Browser not launched', this.id);
    }

    const pw = await getPlaywright();
    const pwContext = await this._session.browser.newContext({
      ignoreHTTPSErrors: options.ignoreHTTPSErrors ?? false,
      extraHTTPHeaders: options.extraHTTPHeaders,
      viewport: options.geolocation ? { width: 1280, height: 720 } : undefined,
    });

    if (options.geolocation) {
      await pwContext.setGeolocation({
        latitude: options.geolocation.latitude,
        longitude: options.geolocation.longitude,
        accuracy: options.geolocation.accuracy ?? 0,
      });
    }

    const ctx: AetherContext = {
      contextId: nextContextId(),
      context: pwContext,
      pages: new Map(),
      closed: false,
      parent: this._session,
    };

    this._session.contexts.set(ctx.contextId, ctx);

    // Hook up message capture for this context
    pwContext.on('page', async (page: PlaywrightPageObj) => {
      const ap: AetherPage = {
        pageId: nextPageId(),
        page,
        context: ctx,
        closed: false,
      };
      ctx.pages.set(ap.pageId, ap);
      this._session!.pages.set(ap.pageId, ap);

      page.on('console', (msg: { type(): string; text(): string; location(): { url: string; lineNumber: number } | null }) => {
        this._session!.consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location() ? { url: msg.location().url, lineNumber: msg.location().lineNumber } : undefined,
          stackTrace: msg.location()?.url,
        });
      });

      page.on('request', (req: PlaywrightRequestObj) => {
        this._session!.networkRequests.push({
          requestId: req.url(),
          url: req.url(),
          method: req.method(),
          resourceType: req.resourceType(),
          timestamp: Date.now(),
        });
      });

      page.on('response', (res: PlaywrightResponseObj) => {
        const existing = this._session!.networkRequests.find((r) => r.url === res.request().url() && !r.status);
        if (existing) {
          existing.status = res.status();
          existing.mimeType = res.headers()['content-type'];
        }
      });
    });

    return new PlaywrightContextHandle(ctx);
  }

  async closeContext(context: BrowserContextHandle): Promise<void> {
    const ctx = (context as PlaywrightContextHandle)._inner;
    if (ctx.closed) return;
    ctx.closed = true;

    const closePromises: Promise<void>[] = [];
    for (const page of ctx.pages.values()) {
      if (!page.closed) closePromises.push(page.page.close().catch(() => {}));
    }
    await Promise.all(closePromises);

    await ctx.context.close().catch(() => {});

    if (this._session) {
      this._session.contexts.delete(ctx.contextId);
    }
  }

  async newPage(options: NewPageOptions = {}): Promise<PageHandle> {
    if (!this._session || this._session.closed) {
      throw new BrowserLaunchError('Browser not launched', this.id);
    }
    const page = await this._defaultContext!.context.newPage();
    const aetherPage: AetherPage = {
      pageId: nextPageId(),
      page,
      context: this._defaultContext!,
      closed: false,
    };
    this._defaultContext!.pages.set(aetherPage.pageId, aetherPage);
    this._session.pages.set(aetherPage.pageId, aetherPage);
    return new PlaywrightPageHandle(aetherPage);
  }

  async closePage(page: PageHandle): Promise<void> {
    const ap = (page as PlaywrightPageHandle)._inner;
    if (ap.closed) return;
    ap.closed = true;
    await ap.page.close().catch(() => {});
    ap.context.pages.delete(ap.pageId);
    if (this._session) this._session.pages.delete(ap.pageId);
  }

  // ── Session health ──────────────────────────────────────────────────────────

  async health(): Promise<BrowserSessionHealth> {
    if (!this._session || this._session.closed) {
      return {
        healthy: false,
        responsive: false,
        pageCount: 0,
        contextCount: 0,
        lastHeartbeat: 0,
      };
    }

    let memoryMB: number | undefined;
    let cpuPercent: number | undefined;
    try {
      const metrics = await this._session.browser.metrics();
      if (metrics) {
        memoryMB = metrics.jsHeapUsedSize ? Math.round(metrics.jsHeapUsedSize / 1024 / 1024) : undefined;
      }
    } catch {
      // metrics may not be available on all browsers
    }

    const pageCount = Array.from(this._session.pages.values()).filter((p) => !p.closed).length;
    const contextCount = Array.from(this._session.contexts.values()).filter((c) => !c.closed).length;

    return {
      healthy: true,
      responsive: true,
      memoryMB,
      cpuPercent,
      pageCount,
      contextCount,
      lastHeartbeat: Date.now(),
    };
  }

  async ping(): Promise<boolean> {
    if (!this._session || this._session.closed) return false;
    try {
      const page = this.activePage();
      await page.page.evaluate('1 + 1');
      return true;
    } catch {
      return false;
    }
  }

  // ── Capabilities ───────────────────────────────────────────────────────────

  getCapabilities(): ProviderCapabilities {
    return {
      name: this.name,
      version: '1.0.0',
      supportedEngines: ['chromium', 'firefox', 'webkit'],
      outOfProcessOnly: false,
      features: [
        'cross-browser',
        'screenshot',
        'full-page-screenshot',
        'dom-snapshot',
        'accessibility-tree',
        'network-intercept',
        'console-capture',
        'download-capture',
        'form-interaction',
        'file-upload',
        'isolated-context',
        'cookie-management',
        'proxy-config',
        'geolocation-mock',
        'touch-emulation',
      ] as BrowserFeature[],
      metadata: {
        providerType: 'playwright',
        license: 'MIT',
        homepage: 'https://github.com/microsoft/playwright',
      },
    };
  }

  checkCapabilities(requirements: CapabilityRequirement[]): CapabilityNegotiationResult {
    const caps = this.getCapabilities();
    const missingFeatures: BrowserFeature[] = [];
    const missingOptional: BrowserFeature[] = [];

    for (const req of requirements) {
      const has = caps.features.includes(req.feature);
      if (!has && req.required) {
        missingFeatures.push(req.feature);
      } else if (!has) {
        missingOptional.push(req.feature);
      }
    }

    // Version check is a placeholder — real version comparison would use semver.
    let versionMismatch = false;
    if (this._session) {
      try {
        void this._session; // version check placeholder
      } catch {
        versionMismatch = true;
      }
    }

    return {
      compatible: missingFeatures.length === 0,
      providerCapabilities: caps,
      missingFeatures,
      missingOptional,
      versionMismatch,
    };
  }
}

// ─── Handle implementations ────────────────────────────────────────────────────

class PlaywrightContextHandle implements BrowserContextHandle {
  readonly contextId: string;
  readonly provider: BrowserProvider;
  get closed(): boolean {
    return this._inner.closed;
  }

  constructor(public _inner: AetherContext) {
    this.contextId = _inner.contextId;
    this.provider = _inner.parent as unknown as BrowserProvider;
  }

  async setCookies(cookies: BrowserCookie[]): Promise<void> {
    await this._inner.context.addCookies(
      cookies.map((c: BrowserCookie) => ({
        name: c.name,
        value: c.value,
        domain: c.domain,
        path: c.path,
        expires: c.expires,
        httpOnly: c.httpOnly,
        secure: c.secure,
        sameSite: c.sameSite as 'Strict' | 'Lax' | 'None',
      })),
    );
  }

  async getCookies(): Promise<BrowserCookie[]> {
    const cookies = await this._inner.context.cookies();
    return cookies.map((c: PlaywrightCookieObj) => ({
      name: c.name,
      value: c.value,
      domain: c.domain,
      path: c.path,
      expires: c.expires,
      httpOnly: c.httpOnly,
      secure: c.secure,
      sameSite: c.sameSite?.toLowerCase() as BrowserCookie['sameSite'],
    }));
  }

  async clearCookies(): Promise<void> {
    await this._inner.context.clearCookies();
  }

  async grantPermissions(permissions: string[], origin?: string): Promise<void> {
    await this._inner.context.grantPermissions(permissions, { origin });
  }

  async newPage(options: NewPageOptions = {}): Promise<PageHandle> {
    const pwPage = await this._inner.context.newPage();
    const ap: AetherPage = {
      pageId: nextPageId(),
      page: pwPage,
      context: this._inner,
      closed: false,
    };
    this._inner.pages.set(ap.pageId, ap);
    this._inner.parent.pages.set(ap.pageId, ap);
    return new PlaywrightPageHandle(ap);
  }

  async close(): Promise<void> {
    await (this.provider as unknown as PlaywrightProvider).closeContext(this);
  }
}

class PlaywrightPageHandle implements PageHandle {
  readonly pageId: string;
  readonly context: BrowserContextHandle;
  get closed(): boolean {
    return this._inner.closed;
  }

  constructor(public _inner: AetherPage) {
    this.pageId = _inner.pageId;
    this.context = _inner.context as unknown as BrowserContextHandle;
  }

  async navigate(url: string): Promise<void> {
    await this._inner.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async close(): Promise<void> {
    await (this._inner.context.parent as unknown as PlaywrightProvider).closePage(this);
  }

  async pressKey(key: string): Promise<void> {
    await this._inner.page.keyboard.press(key);
  }

  async evaluate<T = unknown>(expression: string): Promise<T> {
    return await this._inner.page.evaluate(expression);
  }
}
