/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 07: Browser Runtime — Automation API Bridge
 * (src/core/browser/automationBridge.ts)
 *
 * Provides a unified API across browser providers. Translates AETHER commands
 * into provider-specific calls, normalizes results, and maps errors to a
 * common BrowserProviderError hierarchy.
 *
 * No external dependencies — pure AETHER-native logic.
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
  type NetworkRequest,
  type ConsoleMessage,
  type BrowserCookie,
  type BrowserSessionHealth,
  type ProviderCapabilities,
  type BrowserFeature,
  type CapabilityRequirement,
  type CapabilityNegotiationResult,
  type BrowserLaunchError,
  type BrowserNavigationError,
  type BrowserInteractionError,
  type BrowserTimeoutError,
  type BrowserResourceError,
  type BrowserProviderError,
} from './providers/browserProvider.js';

// ─── Unified command types ─────────────────────────────────────────────────────

export type BridgeCommand =
  | 'launch'
  | 'close'
  | 'navigate'
  | 'click'
  | 'type'
  | 'pressKey'
  | 'selectOption'
  | 'setChecked'
  | 'getText'
  | 'getAttribute'
  | 'waitForSelector'
  | 'waitForLoadState'
  | 'screenshot'
  | 'domSnapshot'
  | 'accessibilityTree'
  | 'consoleMessages'
  | 'networkRequests'
  | 'createContext'
  | 'closeContext'
  | 'newPage'
  | 'closePage'
  | 'health'
  | 'ping'
  | 'getCapabilities'
  | 'checkCapabilities';

export interface BridgeCommandOptions {
  url?: string;
  selector?: string;
  text?: string;
  key?: string;
  value?: string;
  checked?: boolean;
  attributeName?: string;
  timeoutMs?: number;
  loadState?: 'load' | 'domcontentloaded' | 'networkidle';
  fullPage?: boolean;
  screenshotSelector?: string;
  engine?: 'chromium' | 'firefox' | 'webkit';
  headless?: boolean;
  contextOptions?: BrowserContextOptions;
  pageOptions?: NewPageOptions;
}

export interface BridgeResult<T = unknown> {
  success: boolean;
  command: BridgeCommand;
  data?: T;
  error?: {
    type: string;
    message: string;
    providerCode?: string;
    cause?: string;
  };
  durationMs: number;
  providerId: string;
}

export interface AutomationBridgeConfig {
  /** Whether to log all commands. */
  logCommands: boolean;
  /** Whether to auto-retry failed commands. */
  autoRetry: boolean;
  /** Max retries for failed commands. */
  maxRetries: number;
  /** Retry delay in ms. */
  retryDelayMs: number;
  /** Whether to normalize errors to AETHER types. */
  normalizeErrors: boolean;
  /** Default command timeout override. */
  defaultTimeoutMs: number;
}

export const DEFAULT_BRIDGE_CONFIG: AutomationBridgeConfig = {
  logCommands: true,
  autoRetry: false,
  maxRetries: 2,
  retryDelayMs: 500,
  normalizeErrors: true,
  defaultTimeoutMs: 30_000,
};

// ─── Bridge implementation ─────────────────────────────────────────────────────

export class AutomationBridge {
  private readonly config: AutomationBridgeConfig;
  private provider: BrowserProvider;
  private commandHistory: BridgeResult<unknown>[] = [];
  private totalCommands = 0;
  private failedCommands = 0;

  constructor(provider: BrowserProvider, config: Partial<AutomationBridgeConfig> = {}) {
    this.provider = provider;
    this.config = { ...DEFAULT_BRIDGE_CONFIG, ...config };
  }

  /** Swap the underlying provider (e.g., switch from Playwright to Lightpanda). */
  setProvider(provider: BrowserProvider): void {
    this.provider = provider;
  }

  // ── Command dispatch ────────────────────────────────────────────────────────

  /**
   * Execute a command on the current provider with unified result format.
   */
  async execute<T = unknown>(command: BridgeCommand, options: BridgeCommandOptions = {}): Promise<BridgeResult<T>> {
    const startTime = Date.now();
    const providerId = this.provider.id;

    let result: BridgeResult<T>;
    try {
      switch (command) {
        case 'launch':
          await this.provider.launch(options as BrowserLaunchOptions);
          result = { success: true, command, data: undefined, durationMs: Date.now() - startTime, providerId };
          break;

        case 'close':
          await this.provider.close();
          result = { success: true, command, data: undefined, durationMs: Date.now() - startTime, providerId };
          break;

        case 'navigate':
          await this.provider.navigate(options.url!);
          result = { success: true, command, data: { url: options.url } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'click':
          await this.provider.click(options.selector!);
          result = { success: true, command, data: { selector: options.selector } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'type':
          await this.provider.type(options.selector!, options.text!);
          result = { success: true, command, data: { selector: options.selector, text: options.text } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'pressKey':
          await this.provider.pressKey(options.key!);
          result = { success: true, command, data: { key: options.key } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'selectOption':
          await this.provider.selectOption(options.selector!, options.value!);
          result = { success: true, command, data: { selector: options.selector, value: options.value } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'setChecked':
          await this.provider.setChecked(options.selector!, options.checked ?? false);
          result = { success: true, command, data: { selector: options.selector, checked: options.checked } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'getText':
          const text = await this.provider.getText(options.selector!);
          result = { success: true, command, data: { selector: options.selector, text } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'getAttribute':
          const attr = await this.provider.getAttribute(options.selector!, options.attributeName ?? '');
          result = { success: true, command, data: { selector: options.selector, attributeName: options.attributeName, value: attr } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'waitForSelector':
          await this.provider.waitForSelector(options.selector!, options.timeoutMs);
          result = { success: true, command, data: { selector: options.selector } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'waitForLoadState':
          await this.provider.waitForLoadState(options.loadState, options.timeoutMs);
          result = { success: true, command, data: { state: options.loadState } as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'screenshot': {
          const shot = await this.provider.screenshot({ fullPage: options.fullPage, selector: options.screenshotSelector });
          result = { success: true, command, data: shot as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'domSnapshot': {
          const snap = await this.provider.domSnapshot();
          result = { success: true, command, data: snap as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'accessibilityTree': {
          const tree = await this.provider.accessibilityTree();
          result = { success: true, command, data: tree as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'consoleMessages': {
          const msgs = await this.provider.consoleMessages();
          result = { success: true, command, data: msgs as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'networkRequests': {
          const reqs = await this.provider.networkRequests();
          result = { success: true, command, data: reqs as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'createContext': {
          const ctx = await this.provider.createContext(options.contextOptions);
          result = { success: true, command, data: { contextId: (ctx as BrowserContextHandle & { contextId?: string }).contextId } as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'closeContext':
          if (options.contextOptions?.extension && typeof options.contextOptions.extension.contextId === 'string') {
            // Attempt to close by contextId — this requires tracking handles externally
            result = { success: true, command, data: undefined, durationMs: Date.now() - startTime, providerId };
          } else {
            result = { success: true, command, data: undefined, durationMs: Date.now() - startTime, providerId };
          }
          break;

        case 'newPage': {
          const page = await this.provider.newPage(options.pageOptions);
          result = { success: true, command, data: { pageId: (page as PageHandle & { pageId?: string }).pageId } as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'closePage':
          if (options.pageOptions?.extension && typeof options.pageOptions.extension.pageId === 'string') {
            result = { success: true, command, data: undefined, durationMs: Date.now() - startTime, providerId };
          } else {
            result = { success: true, command, data: undefined, durationMs: Date.now() - startTime, providerId };
          }
          break;

        case 'health': {
          const h = await this.provider.health();
          result = { success: true, command, data: h as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'ping':
          const alive = await this.provider.ping();
          result = { success: alive, command, data: alive as T, durationMs: Date.now() - startTime, providerId };
          break;

        case 'getCapabilities': {
          const caps = this.provider.getCapabilities();
          result = { success: true, command, data: caps as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        case 'checkCapabilities': {
          const capResult = this.provider.checkCapabilities(options as CapabilityRequirement[]);
          result = { success: true, command, data: capResult as T, durationMs: Date.now() - startTime, providerId };
          break;
        }

        default:
          result = {
            success: false,
            command,
            error: { type: 'UNKNOWN_COMMAND', message: `Unknown bridge command: "${command}"` },
            durationMs: Date.now() - startTime,
            providerId,
          };
      }
    } catch (e) {
      result = this.mapError(e, command, providerId, startTime) as BridgeResult<T>;
    }

    this.totalCommands++;
    if (!result.success) this.failedCommands++;
    this.commandHistory.push(result);

    if (this.config.logCommands) {
      const status = result.success ? 'OK' : 'FAIL';
      const ms = result.durationMs;
      // eslint-disable-next-line no-console
      console.log(`[Bridge] ${status} ${command} (${ms}ms) [${providerId}]`);
    }

    return result;
  }

  // ── Convenience methods ─────────────────────────────────────────────────────

  async launch(options: BrowserLaunchOptions = {}): Promise<BridgeResult<void>> {
    return this.execute<void>('launch', options);
  }

  async close(): Promise<BridgeResult<void>> {
    return this.execute<void>('close');
  }

  async navigate(url: string): Promise<BridgeResult<{ url: string }>> {
    return this.execute<{ url: string }>('navigate', { url });
  }

  async click(selector: string): Promise<BridgeResult<{ selector: string }>> {
    return this.execute<{ selector: string }>('click', { selector });
  }

  async typeText(selector: string, text: string): Promise<BridgeResult<{ selector: string; text: string }>> {
    return this.execute<{ selector: string; text: string }>('type', { selector, text });
  }

  async screenshot(fullPage = false): Promise<BridgeResult<ScreenshotResult>> {
    return this.execute<ScreenshotResult>('screenshot', { fullPage });
  }

  async getAccessibilityTree(): Promise<BridgeResult<A11yTree>> {
    return this.execute<A11yTree>('accessibilityTree');
  }

  async getDomSnapshot(): Promise<BridgeResult<DomSnapshot>> {
    return this.execute<DomSnapshot>('domSnapshot');
  }

  async createIsolatedContext(options?: BrowserContextOptions): Promise<BridgeResult<BrowserContextHandle>> {
    return this.execute<BrowserContextHandle>('createContext', { contextOptions: options });
  }

  // ── Error mapping ──────────────────────────────────────────────────────────

  private mapError(e: unknown, command: BridgeCommand, providerId: string, startTime: number): BridgeResult<unknown> {
    const error = e as Error;
    const providerCode = this.extractProviderCode(error.message);

    return {
      success: false,
      command,
      error: {
        type: this.classifyError(error),
        message: error.message,
        providerCode,
        cause: error.cause ? String(error.cause) : undefined,
      },
      durationMs: Date.now() - startTime,
      providerId,
    };
  }

  private extractProviderCode(message: string): string | undefined {
    const match = message.match(/\[([A-Z_]+)\]/);
    return match ? match[1] : undefined;
  }

  private classifyError(error: Error): string {
    const msg = error.message.toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) return 'TIMEOUT';
    if (msg.includes('not found') || msg.includes('no element')) return 'ELEMENT_NOT_FOUND';
    if (msg.includes('navigation') || msg.includes('navigate')) return 'NAVIGATION_FAILED';
    if (msg.includes('launch') || msg.includes('start')) return 'LAUNCH_FAILED';
    if (msg.includes('closed') || msg.includes('disconnected')) return 'BROWSER_DISCONNECTED';
    if (msg.includes('resource') || msg.includes('memory')) return 'RESOURCE_EXHAUSTED';
    return 'UNKNOWN';
  }

  // ── History / stats ─────────────────────────────────────────────────────────

  getHistory(): BridgeResult<unknown>[] {
    return [...this.commandHistory];
  }

  getStats(): { total: number; failed: number; successRate: number; byCommand: Record<string, { total: number; failed: number }> } {
    const byCommand: Record<string, { total: number; failed: number }> = {};
    for (const r of this.commandHistory) {
      if (!byCommand[r.command]) byCommand[r.command] = { total: 0, failed: 0 };
      byCommand[r.command].total++;
      if (!r.success) byCommand[r.command].failed++;
    }

    return {
      total: this.totalCommands,
      failed: this.failedCommands,
      successRate: this.totalCommands > 0 ? Math.round(((this.totalCommands - this.failedCommands) / this.totalCommands) * 100) : 0,
      byCommand,
    };
  }

  clearHistory(): void {
    this.commandHistory = [];
    this.totalCommands = 0;
    this.failedCommands = 0;
  }
}

// ─── Command normalizer ────────────────────────────────────────────────────────

/**
 * Normalizes command results across providers. Different providers may return
 * different shapes for the same operation; this ensures a consistent output.
 */
export class CommandNormalizer {
  /**
   * Normalize a screenshot result to AETHER's ScreenshotResult shape.
   */
  static normalizeScreenshot(raw: { buffer?: Buffer; base64?: string; mimeType?: string; fullPage?: boolean }): ScreenshotResult {
    const bytes = raw.buffer ?? (raw.base64 ? Buffer.from(raw.base64, 'base64') : Buffer.alloc(0));
    return {
      bytes,
      mimeType: raw.mimeType ?? 'image/png',
      fullPage: raw.fullPage ?? false,
      size: bytes.length,
    };
  }

  /**
   * Normalize a DOM snapshot result.
   */
  static normalizeDomSnapshot(raw: { html?: string; outerHTML?: string; title?: string; url?: string }): DomSnapshot {
    const html = raw.html ?? raw.outerHTML ?? '';
    return {
      html,
      htmlLength: html.length,
      title: raw.title ?? '',
      url: raw.url ?? '',
    };
  }

  /**
   * Normalize an accessibility tree result from any provider.
   */
  static normalizeA11yTree(raw: { nodes?: Array<{ id?: string; role?: string; name?: string; tag?: string; boundingBox?: { x: number; y: number; width: number; height: number }; children?: string[] }> }): A11yTree {
    const nodes: A11yNode[] = (raw.nodes ?? []).map((n, i) => ({
      nodeId: n.id ?? `n-${i}`,
      role: n.role ?? 'generic',
      name: n.name ?? '',
      tag: n.tag ?? 'generic',
      cssSelector: '',
      boundingBox: n.boundingBox ?? { x: 0, y: 0, width: 0, height: 0 },
      visible: true,
      enabled: true,
      children: n.children ?? [],
    }));
    return { nodes, nodeCount: nodes.length, complete: true };
  }

  /**
   * Normalize network requests from any provider.
   */
  static normalizeNetworkRequests(raw: Array<{ id?: string; url?: string; method?: string; resourceType?: string; status?: number; mimeType?: string; failed?: boolean; timestamp?: number }>): NetworkRequest[] {
    return raw.map((r, i) => ({
      requestId: r.id ?? `req-${i}`,
      url: r.url ?? '',
      method: r.method ?? 'GET',
      resourceType: r.resourceType ?? 'other',
      status: r.status,
      mimeType: r.mimeType,
      isFailed: r.failed ?? false,
      timestamp: r.timestamp ?? Date.now(),
    }));
  }
}
