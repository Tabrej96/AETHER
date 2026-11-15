/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Abstract Provider Interface
 * (src/core/browser/providers/browserProvider.ts)
 *
 * Defines the contract every browser backend must satisfy. Inspired by:
 *   - microsoft/playwright (MIT) — cross-browser automation model
 *   - lightpanda-io/browser (BSL-1.1) — lightweight CDP backend concept
 *
 * NOT a drop-in Playwright wrapper — this is AETHER-native. Lightpanda is
 * explicitly noted as BSL-1.1 and out-of-process only; compatibility with
 * any provider is verified per-task, never assumed.
 */

// ─── Browser types ─────────────────────────────────────────────────────────────

export type BrowserEngine = 'chromium' | 'firefox' | 'webkit';

export interface BrowserViewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  hasTouch?: boolean;
  isMobile?: boolean;
}

export interface BrowserCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface BrowserLaunchOptions {
  /** Which browser engine to use (if the provider supports multiple). */
  engine?: BrowserEngine;
  /** Whether to run headless. */
  headless?: boolean;
  /** Viewport size. */
  viewport?: BrowserViewport;
  /** User data directory (for persistent profiles). */
  userDataDir?: string;
  /** Extra command-line arguments passed to the browser binary. */
  args?: string[];
  /** Proxy server URL (e.g. "http://proxy:8080"). */
  proxy?: string;
  /** Ignore HTTPS certificate errors. */
  ignoreHTTPSErrors?: boolean;
  /** Slow down operations by this many milliseconds (for debugging). */
  slowMo?: number;
  /** Timeout for page navigation in milliseconds. */
  navigationTimeout?: number;
  /** Timeout for element interaction in milliseconds. */
  actionTimeout?: number;
  /** Environment variables for the browser process. */
  env?: Record<string, string>;
  /** Provider-specific extension data. */
  extension?: Record<string, unknown>;
}

export interface BrowserContextOptions {
  /** Ignore HTTPS certificate errors for this context. */
  ignoreHTTPSErrors?: boolean;
  /** Extra HTTP headers sent with every request. */
  extraHTTPHeaders?: Record<string, string>;
  /** HTTP authentication credentials. */
  httpCredentials?: { username: string; password: string };
  /** Proxy server URL for this context. */
  proxy?: string;
  /** Whether this context is isolated (no shared state). */
  isolated?: boolean;
  /** Geolocation override. */
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  /** Locale string, e.g. "en-US". */
  locale?: string;
  /** Timezone ID, e.g. "America/New_York". */
  timezoneId?: string;
  /** Color scheme preference. */
  colorScheme?: 'light' | 'dark' | 'no-preference';
  /** Provider-specific extension data. */
  extension?: Record<string, unknown>;
}

export interface NewPageOptions {
  /** Base URL for relative navigations. */
  baseURL?: string;
  /** Ignore HTTPS errors for this page. */
  ignoreHTTPSErrors?: boolean;
  /** Provider-specific extension data. */
  extension?: Record<string, unknown>;
}

// ─── Result types ──────────────────────────────────────────────────────────────

export interface ScreenshotResult {
  /** Raw bytes of the image. */
  bytes: Buffer;
  /** MIME type, e.g. "image/png". */
  mimeType: string;
  /** Whether this was a full-page screenshot. */
  fullPage: boolean;
  /** Size in bytes. */
  size: number;
}

export interface DomSnapshot {
  /** Serialized HTML of the page. */
  html: string;
  /** Character length of the HTML. */
  htmlLength: number;
  /** Title of the page. */
  title: string;
  /** Current URL. */
  url: string;
}

export interface A11yNode {
  /** Unique identifier assigned by the provider. */
  nodeId: string;
  /** Role (button, link, textbox, heading, etc.). */
  role: string;
  /** Accessible name. */
  name: string;
  /** Tag name. */
  tag: string;
  /** Element ID attribute. */
  elementId?: string;
  /** CSS selector that uniquely identifies this element. */
  cssSelector: string;
  /** Bounding box in viewport pixels. */
  boundingBox: { x: number; y: number; width: number; height: number };
  /** Whether the node is visible. */
  visible: boolean;
  /** Whether the node is enabled. */
  enabled: boolean;
  /** Child node IDs. */
  children: string[];
}

export interface A11yTree {
  /** Root nodes. */
  nodes: A11yNode[];
  /** Total node count. */
  nodeCount: number;
  /** Whether the full tree was returned (some providers truncate). */
  complete: boolean;
}

export interface NetworkRequest {
  /** Unique request ID. */
  requestId: string;
  /** URL of the request. */
  url: string;
  /** HTTP method. */
  method: string;
  /** Resource type (document, stylesheet, script, etc.). */
  resourceType: string;
  /** Response status code. */
  status?: number;
  /** Response MIME type. */
  mimeType?: string;
  /** Request headers. */
  requestHeaders?: Record<string, string>;
  /** Whether the request failed. */
  isFailed?: boolean;
  /** Timestamp when the request started. */
  timestamp: number;
}

export interface ConsoleMessage {
  /** Message type: log, warn, error, info, debug. */
  type: string;
  /** Text content of the message. */
  text: string;
  /** Location in the page source. */
  location?: { url: string; lineNumber: number };
  /** Stack trace if available. */
  stackTrace?: string;
}

// ─── Exception hierarchy ───────────────────────────────────────────────────────

export class BrowserProviderError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
    public readonly providerCode?: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BrowserProviderError';
  }
}

export class BrowserLaunchError extends BrowserProviderError {
  constructor(message: string, providerId: string, cause?: unknown) {
    super(message, providerId, 'LAUNCH_FAILED', cause);
    this.name = 'BrowserLaunchError';
  }
}

export class BrowserNavigationError extends BrowserProviderError {
  constructor(
    message: string,
    providerId: string,
    public readonly url: string,
    public readonly statusCode?: number,
    cause?: unknown,
  ) {
    super(message, providerId, 'NAVIGATION_FAILED', cause);
    this.name = 'BrowserNavigationError';
  }
}

export class BrowserInteractionError extends BrowserProviderError {
  constructor(
    message: string,
    providerId: string,
    public readonly selector: string,
    public readonly action: string,
    cause?: unknown,
  ) {
    super(message, providerId, 'INTERACTION_FAILED', cause);
    this.name = 'BrowserInteractionError';
  }
}

export class BrowserTimeoutError extends BrowserProviderError {
  constructor(
    message: string,
    providerId: string,
    public readonly operation: string,
    public readonly timeoutMs: number,
    cause?: unknown,
  ) {
    super(message, providerId, 'TIMEOUT', cause);
    this.name = 'BrowserTimeoutError';
  }
}

export class BrowserResourceError extends BrowserProviderError {
  constructor(
    message: string,
    providerId: string,
    public readonly resourceType: 'memory' | 'cpu' | 'disk' | 'connection',
    cause?: unknown,
  ) {
    super(message, providerId, 'RESOURCE_EXHAUSTED', cause);
    this.name = 'BrowserResourceError';
  }
}

// ─── Provider capability negotiation ──────────────────────────────────────────

export interface ProviderCapabilities {
  /** Human-readable provider name. */
  name: string;
  /** Provider version string. */
  version: string;
  /** Supported browser engines. */
  supportedEngines: BrowserEngine[];
  /** Whether this provider can run out-of-process only (e.g. BSL license). */
  outOfProcessOnly: boolean;
  /** Supported capability flags. */
  features: BrowserFeature[];
  /** Provider-specific metadata. */
  metadata?: Record<string, unknown>;
}

export type BrowserFeature =
  | 'cross-browser'
  | 'screenshot'
  | 'full-page-screenshot'
  | 'dom-snapshot'
  | 'accessibility-tree'
  | 'network-intercept'
  | 'console-capture'
  | 'download-capture'
  | 'form-interaction'
  | 'file-upload'
  | 'isolated-context'
  | 'cookie-management'
  | 'proxy-config'
  | 'geolocation-mock'
  | 'touch-emulation'
  | 'pdf-export'
  | 'video-capture'
  | 'tracing';

export interface CapabilityRequirement {
  feature: BrowserFeature;
  required: boolean;
  /** Minimum acceptable provider version. */
  minVersion?: string;
}

export interface CapabilityNegotiationResult {
  compatible: boolean;
  providerCapabilities: ProviderCapabilities;
  /** Required features that are missing. */
  missingFeatures: BrowserFeature[];
  /** Optional features that are missing. */
  missingOptional: BrowserFeature[];
  /** Whether a version mismatch was detected. */
  versionMismatch: boolean;
}

// ─── Session state ─────────────────────────────────────────────────────────────

export type BrowserSessionState = 'launching' | 'ready' | 'navigating' | 'interacting' | 'closing' | 'closed' | 'error';

export interface BrowserSessionHealth {
  /** Whether the session is considered healthy. */
  healthy: boolean;
  /** Whether the session is still responsive. */
  responsive: boolean;
  /** Memory usage in MB (if available). */
  memoryMB?: number;
  /** CPU usage percentage (if available). */
  cpuPercent?: number;
  /** Number of pages open in this session. */
  pageCount: number;
  /** Number of contexts open in this session. */
  contextCount: number;
  /** Last heartbeat timestamp. */
  lastHeartbeat: number;
  /** Diagnostic information. */
  diagnostics?: Record<string, unknown>;
}

// ─── The abstract provider interface ──────────────────────────────────────────

/**
 * Every browser backend must implement this interface. The contract covers:
 *
 *   Lifecycle:  launch → [navigate → interact]* → close
 *   Session:    createContext / closeContext / session health
 *   Isolation:  each context is an isolated cookie/profile state
 *   Capabilities: declare features at launch, negotiate before use
 *   Resources:  report health, support graceful shutdown
 *
 * Implementations may use Playwright, Lightpanda CDP, raw CDP, or any
 * other backend — callers interact only through this interface.
 */
export interface BrowserProvider {
  /** Stable provider identifier, e.g. "playwright-cross-browser" or "lightpanda-cdp". */
  readonly id: string;

  /** Human-readable name. */
  readonly name: string;

  /** Current lifecycle state. */
  readonly state: BrowserSessionState;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  /**
   * Launch the browser with the given options.
   * @throws BrowserLaunchError if the browser cannot be started.
   */
  launch(options?: BrowserLaunchOptions): Promise<void>;

  /**
   * Close the browser and release all resources.
   * Idempotent — safe to call multiple times.
   */
  close(): Promise<void>;

  /** Whether the browser has been launched and not yet closed. */
  isLaunched(): boolean;

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate the active page to `url`.
   * @throws BrowserNavigationError on navigation failure.
   */
  navigate(url: string): Promise<void>;

  /** Current URL of the active page. */
  currentURL(): Promise<string>;

  /** Page title of the active page. */
  pageTitle(): Promise<string>;

  /** Reload the active page. */
  reload(): Promise<void>;

  /** Go back in the active page's history. */
  goBack(): Promise<void>;

  /** Go forward in the active page's history. */
  goForward(): Promise<void>;

  // ── Interaction ────────────────────────────────────────────────────────────

  /**
   * Click an element matching the selector.
   * @throws BrowserInteractionError if the element is not found or not clickable.
   */
  click(selector: string): Promise<void>;

  /**
   * Type text into an element matching the selector.
   * @throws BrowserInteractionError if the element is not found.
   */
  type(selector: string, text: string): Promise<void>;

  /**
   * Press a key or key combination.
   */
  pressKey(key: string): Promise<void>;

  /**
   * Select an option in a `<select>` element.
   */
  selectOption(selector: string, value: string): Promise<void>;

  /**
   * Check or uncheck a checkbox.
   */
  setChecked(selector: string, checked: boolean): Promise<void>;

  /**
   * Get the text content of an element.
   */
  getText(selector: string): Promise<string>;

  /**
   * Get an attribute value from an element.
   */
  getAttribute(selector: string, name: string): Promise<string | null>;

  /**
   * Wait for an element matching the selector to appear.
   * @throws BrowserTimeoutError if the element does not appear in time.
   */
  waitForSelector(selector: string, timeoutMs?: number): Promise<void>;

  /**
   * Wait for a specific condition (e.g. network idle).
   */
  waitForLoadState(state?: 'load' | 'domcontentloaded' | 'networkidle', timeoutMs?: number): Promise<void>;

  // ── Capture / introspection ─────────────────────────────────────────────────

  /** Take a screenshot. Returns the raw image bytes. */
  screenshot(options?: { fullPage?: boolean; selector?: string }): Promise<ScreenshotResult>;

  /** Get a serialized DOM snapshot. */
  domSnapshot(): Promise<DomSnapshot>;

  /** Get the accessibility tree. */
  accessibilityTree(): Promise<A11yTree>;

  /** Get console messages captured since the last call. */
  consoleMessages(): Promise<ConsoleMessage[]>;

  /** Get network requests captured since the last call. */
  networkRequests(): Promise<NetworkRequest[]>;

  // ── Context management ──────────────────────────────────────────────────────

  /**
   * Create an isolated browser context.
   */
  createContext(options?: BrowserContextOptions): Promise<BrowserContextHandle>;

  /**
   * Close a previously created context and release its resources.
   */
  closeContext(context: BrowserContextHandle): Promise<void>;

  /**
   * Create a new page in the default (browser-level) context.
   */
  newPage(options?: NewPageOptions): Promise<PageHandle>;

  /**
   * Close a page and release its resources.
   */
  closePage(page: PageHandle): Promise<void>;

  // ── Session health ──────────────────────────────────────────────────────────

  /**
   * Report current session health metrics.
   */
  health(): Promise<BrowserSessionHealth>;

  /**
   * Run a health-check ping to confirm the browser is responsive.
   */
  ping(): Promise<boolean>;

  // ── Capability negotiation ──────────────────────────────────────────────────

  /**
   * Declare what this provider supports.
   */
  getCapabilities(): ProviderCapabilities;

  /**
   * Check whether the provider satisfies the given requirements.
   */
  checkCapabilities(requirements: CapabilityRequirement[]): CapabilityNegotiationResult;
}

// ─── Context & page handles ────────────────────────────────────────────────────

/**
 * An opaque handle returned by `createContext`. Implementations extend this
 * with their own internal state.
 */
export interface BrowserContextHandle {
  /** Stable identifier for this context. */
  readonly contextId: string;
  /** Whether this context has been closed. */
  readonly closed: boolean;
  /** Provider that owns this context. */
  readonly provider: BrowserProvider;
  /** Set cookies for this context. */
  setCookies(cookies: BrowserCookie[]): Promise<void>;
  /** Get cookies for this context. */
  getCookies(): Promise<BrowserCookie[]>;
  /** Clear all cookies. */
  clearCookies(): Promise<void>;
  /** Grant permissions to this context. */
  grantPermissions(permissions: string[], origin?: string): Promise<void>;
  /** Create a new page in this context. */
  newPage(options?: NewPageOptions): Promise<PageHandle>;
  /** Close this context. */
  close(): Promise<void>;
}

/**
 * An opaque handle returned by `newPage`. The primary interaction surface.
 */
export interface PageHandle {
  /** Stable identifier for this page. */
  readonly pageId: string;
  /** Whether this page has been closed. */
  readonly closed: boolean;
  /** Context that owns this page. */
  readonly context: BrowserContextHandle;
  /** Navigate this page. */
  navigate(url: string): Promise<void>;
  /** Close this page. */
  close(): Promise<void>;
}

// ─── Provider factory ──────────────────────────────────────────────────────────

export interface BrowserProviderFactory {
  /** Create a new provider instance. */
  create(id: string): BrowserProvider;
  /** List providers this factory can create. */
  availableProviders(): string[];
  /** Check if a provider ID is available. */
  isAvailable(id: string): boolean;
}
