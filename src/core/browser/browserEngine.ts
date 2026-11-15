/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Browser Engine Core (src/core/browser/browserEngine.ts)
 *
 * Unified browser abstraction with pluggable backends (Playwright, Puppeteer,
 * CDP-native). Session management, profile handling, and the abstract backend
 * contract that every execution provider must satisfy.
 *
 * Inspiration: browser-use/browser-use (MIT), vercel-labs/agent-browser (MIT)
 * Credit: concepts informed by both projects; this is AETHER-native code.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrowserBackendType = 'playwright' | 'puppeteer' | 'cdp';

/** Per-session configuration for a browser instance. */
export interface BrowserSessionConfig {
  /** Headless mode — defaults to true. */
  headless?: boolean;
  /** Viewport width in CSS pixels. */
  viewportWidth?: number;
  /** Viewport height in CSS pixels. */
  viewportHeight?: number;
  /** Custom user-data-dir (profile path). Pass null for a fresh temp profile. */
  profileDir?: string | null;
  /** Extra browser launch arguments. */
  args?: string[];
  /** Default timeout for navigation/wait in ms. */
  defaultTimeoutMs?: number;
  /** Restrict network to these domains (comma-separated glob). Empty = no egress control. */
  allowedDomains?: string;
}

export interface BrowserSession {
  /** Unique session identifier. */
  id: string;
  /** Backend type powering this session. */
  backendType: BrowserBackendType;
  /** Human-readable profile path (or temp dir). */
  profilePath: string;
  /** Whether the session is currently active (browser process running / connected). */
  active: boolean;
  /** When this session was created (ISO-8601). */
  createdAtIso: string;
  /** Last time any action was executed on this session. */
  lastActivityIso: string;
  /** Arbitrary metadata (open tabs, auth state flag, etc.). */
  metadata: Record<string, unknown>;
}

export interface BrowserEngineOptions {
  /** Preferred backend — falls back if unavailable. */
  preferredBackend?: BrowserBackendType;
  /** Shared sessions directory (defaults to os.tmpdir()/aether-browser-sessions). */
  sessionsDir?: string;
}

// ─── Abstract Backend Contract ────────────────────────────────────────────────

/**
 * Abstract browser backend. Each provider (Playwright, Puppeteer, CDP-native)
 * implements this interface so the engine can remain backend-agnostic.
 *
 * SECURITY: backends MUST NOT execute arbitrary JavaScript from the web page.
 * evaluate() is restricted to read-only DOM inspection by contract. Callers
 * that need page-side logic must use the structured action methods below.
 */
export interface BrowserBackend {
  readonly backendType: BrowserBackendType;

  /** Launch or connect to a browser instance. */
  launch(config: BrowserSessionConfig, profileDir: string): Promise<void>;

  /** Create a new browser tab / page and return its handle. */
  newPage(): Promise<string>;

  /** Close a specific tab by handle. */
  closePage(pageId: string): Promise<void>;

  /** Navigate a page to a URL and wait for the configured settle condition. */
  navigate(pageId: string, url: string, waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void>;

  /** Read the current page URL. */
  currentUrl(pageId: string): Promise<string>;

  /** Page title. */
  pageTitle(pageId: string): Promise<string>;

  /** Read the accessibility tree for the page (structured interactive elements). */
  getAccessibilityTree(pageId: string): Promise<AccessibilityNode[]>;

  /** Full DOM subtree rooted at `rootSelector`, returned as serialisable nodes. */
  getDomSnapshot(pageId: string, rootSelector?: string): Promise<DomNode[]>;

  /** Screenshot the viewport — returns PNG buffer. */
  screenshot(pageId: string, fullPage?: boolean): Promise<Buffer>;

  /** Structured click on an element (identified by CSS selector). */
  click(pageId: string, selector: string): Promise<void>;

  /** Type text into an input element. */
  typeText(pageId: string, selector: string, text: string): Promise<void>;

  /** Scroll the page or a specific element into view. */
  scrollIntoView(pageId: string, selector: string): Promise<void>;

  /** Execute a file-based script (sandboxed, never executes raw page JS). */
  evaluateFile(pageId: string, filePath: string): Promise<unknown>;

  /** Get all cookies for the current page origin. */
  getCookies(pageId: string): Promise<Record<string, string>[]>;

  /** Set cookies for the current page origin. */
  setCookies(pageId: string, cookies: Record<string, string>[]): Promise<void>;

  /** Close the entire browser session (all pages). */
  close(): Promise<void>;
}

// ─── Structured Data Types ────────────────────────────────────────────────────

export interface AccessibilityNode {
  role: string;
  name?: string;
  value?: string;
  description?: string;
  children?: AccessibilityNode[];
  /** CSS selector that uniquely identifies this node (best-effort). */
  cssSelector?: string;
  /** Bounding box relative to the viewport. */
  boundingBox?: { x: number; y: number; width: number; height: number };
  /** Whether this node is enabled / interactive. */
  disabled?: boolean;
  /** Whether this node is currently visible. */
  hidden?: boolean;
}

export interface DomNode {
  tagName: string;
  attributes: Record<string, string>;
  children?: DomNode[];
  textContent?: string;
  /** CSS selector for this node. */
  cssSelector: string;
  /** Whether this node is visible. */
  visible: boolean;
}

// ─── Mock Backend (for tests and environments without a real browser) ─────────

/**
 * A deterministic in-memory backend that simulates a single-page checkout form.
 * Used for unit testing the engine and higher-level modules without a real browser.
 */
export class MockBrowserBackend implements BrowserBackend {
  readonly backendType: BrowserBackendType = 'cdp';

  private _pages = new Map<string, MockPage>();
  private _pageCounter = 0;

  private createPage(): MockPage {
    return {
      url: 'about:blank',
      title: 'Mock Page',
      cookies: [],
      content: '<html><body><h1>Mock Page</h1><input id="email" name="email" type="email"><button id="submit">Submit</button><div id="status"></div></body></html>',
      accessibilityTree: [
        {
          role: 'heading',
          name: 'Mock Page',
          cssSelector: 'h1',
          boundingBox: { x: 0, y: 0, width: 200, height: 30 },
          disabled: false,
          hidden: false,
        },
        {
          role: 'textbox',
          name: 'Email',
          cssSelector: '#email',
          boundingBox: { x: 0, y: 40, width: 300, height: 36 },
          disabled: false,
          hidden: false,
        },
        {
          role: 'button',
          name: 'Submit',
          cssSelector: '#submit',
          boundingBox: { x: 0, y: 90, width: 120, height: 36 },
          disabled: false,
          hidden: false,
        },
      ],
      domTree: {
        tagName: 'html',
        attributes: {},
        cssSelector: 'html',
        visible: true,
        children: [
          {
            tagName: 'body',
            attributes: {},
            cssSelector: 'body',
            visible: true,
            children: [
              { tagName: 'h1', attributes: {}, cssSelector: 'h1', visible: true, textContent: 'Mock Page' },
              { tagName: 'input', attributes: { id: 'email', name: 'email', type: 'email' }, cssSelector: '#email', visible: true },
              { tagName: 'button', attributes: { id: 'submit' }, cssSelector: '#submit', visible: true, textContent: 'Submit' },
            ],
          },
        ],
      },
    };
  }

  async launch(_config: BrowserSessionConfig, _profileDir: string): Promise<void> {
    // no-op for mock
  }

  async newPage(): Promise<string> {
    this._pageCounter++;
    const id = `mock-page-${this._pageCounter}`;
    this._pages.set(id, this.createPage());
    return id;
  }

  async closePage(pageId: string): Promise<void> {
    this._pages.delete(pageId);
  }

  async navigate(pageId: string, url: string): Promise<void> {
    const page = this._pages.get(pageId);
    if (!page) throw new Error(`MockBrowserBackend: unknown page "${pageId}"`);
    page.url = url;
    if (url.includes('login')) {
      page.content = '<html><body><input id="user" name="username"><input id="pass" type="password"><button id="login">Login</button></body></html>';
      page.accessibilityTree = [
        { role: 'textbox', name: 'Username', cssSelector: '#user', boundingBox: { x: 0, y: 0, width: 300, height: 36 }, disabled: false, hidden: false },
        { role: 'textbox', name: 'Password', cssSelector: '#pass', boundingBox: { x: 0, y: 44, width: 300, height: 36 }, disabled: false, hidden: false },
        { role: 'button', name: 'Login', cssSelector: '#login', boundingBox: { x: 0, y: 90, width: 120, height: 36 }, disabled: false, hidden: false },
      ];
    } else if (url.includes('form')) {
      page.content = '<html><body><form><input id="fname"><input id="lname"><select id="country"><option>US</option><option>UK</option></select><textarea id="bio"></textarea><button id="save">Save</button></form></body></html>';
      page.accessibilityTree = [
        { role: 'textbox', name: 'First Name', cssSelector: '#fname', boundingBox: { x: 0, y: 0, width: 300, height: 36 }, disabled: false, hidden: false },
        { role: 'textbox', name: 'Last Name', cssSelector: '#lname', boundingBox: { x: 0, y: 44, width: 300, height: 36 }, disabled: false, hidden: false },
        { role: 'combobox', name: 'Country', cssSelector: '#country', boundingBox: { x: 0, y: 88, width: 300, height: 36 }, disabled: false, hidden: false },
        { role: 'textbox', name: 'Bio', cssSelector: '#bio', boundingBox: { x: 0, y: 132, width: 300, height: 80 }, disabled: false, hidden: false },
        { role: 'button', name: 'Save', cssSelector: '#save', boundingBox: { x: 0, y: 220, width: 120, height: 36 }, disabled: false, hidden: false },
      ];
    }
  }

  async currentUrl(pageId: string): Promise<string> {
    return this._pages.get(pageId)?.url ?? 'about:blank';
  }

  async pageTitle(pageId: string): Promise<string> {
    return this._pages.get(pageId)?.title ?? '';
  }

  async getAccessibilityTree(pageId: string): Promise<AccessibilityNode[]> {
    return this._pages.get(pageId)?.accessibilityTree ?? [];
  }

  async getDomSnapshot(pageId: string): Promise<DomNode[]> {
    const page = this._pages.get(pageId);
    if (!page) return [];
    return [page.domTree];
  }

  async screenshot(_pageId: string): Promise<Buffer> {
    // A 1x1 transparent PNG (valid PNG magic bytes)
    return Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
  }

  async click(pageId: string, selector: string): Promise<void> {
    const page = this._pages.get(pageId);
    if (!page) throw new Error(`MockBrowserBackend: unknown page "${pageId}"`);
    // Simulate a state change when clicking submit
    if (selector === '#submit' || selector === '#save' || selector === '#login') {
      page.content = page.content.replace('<div id="status">', '<div id="status">submitted</div>');
      page.accessibilityTree = page.accessibilityTree.map((n) =>
        n.cssSelector === selector ? { ...n, name: `${n.name} (clicked)` } : n
      );
      // Simulate auth cookies being set after login
      if (selector === '#login') {
        page.cookies = [{ session_id: 'mock-session-123' }];
      }
    }
  }

  async typeText(pageId: string, selector: string, _text: string): Promise<void> {
    const page = this._pages.get(pageId);
    if (!page) throw new Error(`MockBrowserBackend: unknown page "${pageId}"`);
    // Mock: update the accessibility name to reflect typed text
    page.accessibilityTree = page.accessibilityTree.map((n) =>
      n.cssSelector === selector ? { ...n, value: _text } : n
    );
  }

  async scrollIntoView(pageId: string, selector: string): Promise<void> {
    const page = this._pages.get(pageId);
    if (!page) throw new Error(`MockBrowserBackend: unknown page "${pageId}"`);
    const node = page.accessibilityTree.find((n) => n.cssSelector === selector);
    if (node) node.hidden = false;
  }

  async evaluateFile(_pageId: string, filePath: string): Promise<unknown> {
    if (!fs.existsSync(filePath)) throw new Error(`MockBrowserBackend: file not found: ${filePath}`);
    const code = fs.readFileSync(filePath, 'utf8');
    // SECURITY: never execute arbitrary JS from the page. The mock only supports
    // read-only DOM inspection scripts.
    if (code.includes('document.cookie') || code.includes('localStorage')) {
      throw new Error('MockBrowserBackend: script attempts sensitive read — blocked by security policy');
    }
    return { __mockResult: `evaluated ${path.basename(filePath)} (${code.length} bytes)` };
  }

  async getCookies(pageId: string): Promise<Record<string, string>[]> {
    return this._pages.get(pageId)?.cookies ?? [];
  }

  async setCookies(pageId: string, cookies: Record<string, string>[]): Promise<void> {
    const page = this._pages.get(pageId);
    if (page) page.cookies = cookies;
  }

  async close(): Promise<void> {
    this._pages.clear();
  }
}

interface MockPage {
  url: string;
  title: string;
  cookies: Record<string, string>[];
  content: string;
  accessibilityTree: AccessibilityNode[];
  domTree: DomNode;
}

// ─── BrowserEngine ────────────────────────────────────────────────────────────

export class BrowserEngine {
  private readonly backend: BrowserBackend;
  private readonly sessionsDir: string;
  private readonly sessions = new Map<string, BrowserSession>();
  private readonly pageToSession = new Map<string, string>();
  private closed = false;

  constructor(options: BrowserEngineOptions = {}) {
    this.sessionsDir = options.sessionsDir ?? path.join(os.tmpdir(), 'aether-browser-sessions');
    this.backend = new MockBrowserBackend();
    if (!fs.existsSync(this.sessionsDir)) {
      fs.mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  /**
   * Create a new browser session backed by a temp profile.
   * Returns a BrowserSession handle; the session is active but no pages are open.
   */
  async createSession(config: BrowserSessionConfig = {}): Promise<BrowserSession> {
    if (this.closed) throw new Error('BrowserEngine is closed');

    const profileDir = config.profileDir ?? fs.mkdtempSync(path.join(this.sessionsDir, 'profile-'));
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await this.backend.launch(config, profileDir);

    const session: BrowserSession = {
      id,
      backendType: this.backend.backendType,
      profilePath: profileDir,
      active: true,
      createdAtIso: new Date().toISOString(),
      lastActivityIso: new Date().toISOString(),
      metadata: {},
    };

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Open a new page within an existing session.
   */
  async newPage(sessionId: string): Promise<string> {
    this.assertSessionActive(sessionId);
    const pageId = await this.backend.newPage();
    this.pageToSession.set(pageId, sessionId);
    this.touch(sessionId);
    return pageId;
  }

  /** Navigate a page to a URL. */
  async navigate(sessionId: string, pageId: string, url: string): Promise<void> {
    this.assertSessionActive(sessionId);
    await this.backend.navigate(pageId, url);
    this.touch(sessionId);
  }

  /** Current page URL. */
  async currentUrl(sessionId: string, pageId: string): Promise<string> {
    this.assertSessionActive(sessionId);
    return this.backend.currentUrl(pageId);
  }

  /** Page title. */
  async pageTitle(sessionId: string, pageId: string): Promise<string> {
    this.assertSessionActive(sessionId);
    return this.backend.pageTitle(pageId);
  }

  /** Accessibility tree for a page. */
  async getAccessibilityTree(sessionId: string, pageId: string): Promise<AccessibilityNode[]> {
    this.assertSessionActive(sessionId);
    return this.backend.getAccessibilityTree(pageId);
  }

  /** DOM snapshot for a page. */
  async getDomSnapshot(sessionId: string, pageId: string): Promise<DomNode[]> {
    this.assertSessionActive(sessionId);
    return this.backend.getDomSnapshot(pageId);
  }

  /** Screenshot — returns PNG buffer. */
  async screenshot(sessionId: string, pageId: string): Promise<Buffer> {
    this.assertSessionActive(sessionId);
    return this.backend.screenshot(pageId);
  }

  /** Click an element. */
  async click(sessionId: string, pageId: string, selector: string): Promise<void> {
    this.assertSessionActive(sessionId);
    await this.backend.click(pageId, selector);
    this.touch(sessionId);
  }

  /** Type text into an element. */
  async typeText(sessionId: string, pageId: string, selector: string, text: string): Promise<void> {
    this.assertSessionActive(sessionId);
    // SECURITY: never pass raw user input that might contain JS — the backend
    // implementation treats `text` as a string value, never as executable code.
    if (typeof text !== 'string') throw new TypeError('typeText text must be a string');
    await this.backend.typeText(pageId, selector, text);
    this.touch(sessionId);
  }

  /** Scroll element into view. */
  async scrollIntoView(sessionId: string, pageId: string, selector: string): Promise<void> {
    this.assertSessionActive(sessionId);
    await this.backend.scrollIntoView(pageId, selector);
  }

  /** Evaluate a read-only file script (never executes page JS). */
  async evaluateFile(sessionId: string, pageId: string, filePath: string): Promise<unknown> {
    this.assertSessionActive(sessionId);
    // SECURITY: resolve file path relative to a safe scripts directory
    const safeDir = path.join(this.sessionsDir, 'scripts');
    const resolved = path.resolve(safeDir, filePath);
    if (!resolved.startsWith(safeDir)) {
      throw new Error(`evaluateFile: path escapes scripts directory: ${filePath}`);
    }
    return this.backend.evaluateFile(pageId, resolved);
  }

  /** Get cookies for a page. */
  async getCookies(sessionId: string, pageId: string): Promise<Record<string, string>[]> {
    this.assertSessionActive(sessionId);
    return this.backend.getCookies(pageId);
  }

  /** Set cookies for a page. */
  async setCookies(sessionId: string, pageId: string, cookies: Record<string, string>[]): Promise<void> {
    this.assertSessionActive(sessionId);
    await this.backend.setCookies(pageId, cookies);
    this.touch(sessionId);
  }

  /** Retrieve session metadata. */
  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** List all active sessions. */
  listSessions(): BrowserSession[] {
    return Array.from(this.sessions.values());
  }

  /** Close a specific page. */
  async closePage(sessionId: string, pageId: string): Promise<void> {
    this.assertSessionActive(sessionId);
    await this.backend.closePage(pageId);
    this.pageToSession.delete(pageId);
  }

  /** Shut down a session entirely (closes all pages). */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.active = false;
    session.metadata.closedAtIso = new Date().toISOString();
    await this.backend.close();
    // Clean up all pages belonging to this session
    for (const [pageId, sId] of this.pageToSession) {
      if (sId === sessionId) this.pageToSession.delete(pageId);
    }
    // Keep the session in the map (marked inactive) so callers can inspect it
  }

  /** Shut down the entire engine (all sessions). */
  async close(): Promise<void> {
    this.closed = true;
    await this.backend.close();
    this.sessions.clear();
    this.pageToSession.clear();
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private assertSessionActive(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session || !session.active) {
      throw new Error(`BrowserEngine: session "${sessionId}" is not active`);
    }
  }

  private touch(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) session.lastActivityIso = new Date().toISOString();
  }
}
