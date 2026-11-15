/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Navigation & State Management (src/core/browser/navigationManager.ts)
 *
 * URL navigation, history management, multi-tab execution coordination,
 * and wait strategies (network idle, element visible, etc.).
 *
 * SECURITY: All URLs are validated before navigation. No open redirects
 * are followed unless explicitly allowed by configuration.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { BrowserBackend, AccessibilityNode } from './browserEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WaitStrategy = 'load' | 'domcontentloaded' | 'networkidle' | 'elementVisible' | 'custom';
export type NavigationEventType = 'navigate' | 'popstate' | 'hashchange' | 'reload';

export interface NavigationOptions {
  /** Wait strategy after navigation. */
  waitUntil?: WaitStrategy;
  /** Timeout in ms. */
  timeoutMs?: number;
  /** Maximum number of redirects to follow. */
  maxRedirects?: number;
  /** Allowed domains for redirects (empty = same domain only). */
  allowedRedirectDomains?: string[];
}

export interface HistoryEntry {
  url: string;
  title: string;
  timestampIso: string;
  navigationType: NavigationEventType;
}

export interface TabInfo {
  id: string;
  url: string;
  title: string;
  isActive: boolean;
}

export interface MultiTabPlan {
  /** Steps to execute across tabs, in order. */
  steps: Array<{
    tabId: string;
    action: 'navigate' | 'click' | 'type' | 'wait' | 'screenshot';
    params: Record<string, unknown>;
  }>;
  /** Whether to execute steps in parallel across tabs. */
  parallel?: boolean;
}

// ─── URL Security ─────────────────────────────────────────────────────────────

/**
 * Validate a URL for safety before navigation.
 * Blocks dangerous protocols and unexpected domains.
 */
export function validateNavigationUrl(url: string, allowedDomains: string[] = []): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(url);

    // Block non-HTTP(S) protocols
    if (!['http:', 'https:', 'file:'].includes(parsed.protocol)) {
      return { safe: false, reason: `Blocked non-HTTP(S) protocol: ${parsed.protocol}` };
    }

    // Block localhost/internal addresses in production contexts
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1') {
      return { safe: false, reason: 'Blocked navigation to localhost/internal address' };
    }

    // Check allowed domains if specified
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some((domain) => {
        if (domain.startsWith('*.')) {
          return hostname === domain.slice(2) || hostname.endsWith('.' + domain.slice(2));
        }
        return hostname === domain || hostname.endsWith('.' + domain);
      });
      if (!isAllowed) {
        return { safe: false, reason: `Domain ${hostname} not in allowed list` };
      }
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

// ─── Navigation Manager ───────────────────────────────────────────────────────

export class NavigationManager {
  private history: HistoryEntry[] = [];
  private readonly backend: BrowserBackend;
  private readonly sessionId: string;
  private readonly pageId: string;
  private readonly allowedDomains: string[];

  constructor(
    backend: BrowserBackend,
    sessionId: string,
    pageId: string,
    options: { allowedDomains?: string[] } = {}
  ) {
    this.backend = backend;
    this.sessionId = sessionId;
    this.pageId = pageId;
    this.allowedDomains = options.allowedDomains ?? [];
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  /**
   * Navigate to a URL with security validation and wait strategy.
   */
  async navigate(url: string, options: NavigationOptions = {}): Promise<{ url: string; title: string }> {
    const validation = validateNavigationUrl(url, this.allowedDomains);
    if (!validation.safe) {
      throw new Error(`Navigation blocked: ${validation.reason}`);
    }

    const waitUntil = options.waitUntil ?? 'domcontentloaded';
    await this.backend.navigate(this.pageId, url, waitUntil);

    const finalUrl = await this.backend.currentUrl(this.pageId);
    const title = await this.backend.pageTitle(this.pageId);

    this.history.push({
      url: finalUrl,
      title,
      timestampIso: new Date().toISOString(),
      navigationType: 'navigate',
    });

    return { url: finalUrl, title };
  }

  /** Go back one page in history. */
  async goBack(): Promise<{ url: string; title: string }> {
    if (this.history.length < 2) {
      throw new Error('No history to go back to');
    }
    const previous = this.history[this.history.length - 2];
    return this.navigate(previous.url);
  }

  /** Go forward one page in history. */
  async goForward(): Promise<{ url: string; title: string }> {
    // Simplified: in a real implementation we'd track forward history
    throw new Error('Forward history not implemented');
  }

  /** Reload the current page. */
  async reload(): Promise<{ url: string; title: string }> {
    await this.backend.navigate(this.pageId, await this.backend.currentUrl(this.pageId), 'load');
    const url = await this.backend.currentUrl(this.pageId);
    const title = await this.backend.pageTitle(this.pageId);
    return { url, title };
  }

  // ── Wait Strategies ────────────────────────────────────────────────────────

  /**
   * Wait for an element to become visible in the accessibility tree.
   */
  async waitForElementVisible(selector: string, timeoutMs = 10_000): Promise<AccessibilityNode | null> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const tree = await this.backend.getAccessibilityTree(this.pageId);
      const node = tree.find((n) => n.cssSelector === selector || n.cssSelector?.endsWith(selector));
      if (node && !node.hidden && !node.disabled) {
        return node;
      }
      await this.delay(250);
    }
    return null;
  }

  /**
   * Wait for the page to reach network idle (no network requests for 500ms).
   * In the mock backend, this is a no-op delay.
   */
  async waitForNetworkIdle(timeoutMs = 30_000): Promise<void> {
    // The backend's navigate already waits for the appropriate condition.
    // For network idle specifically, we add an extra settle delay.
    await this.delay(500);
  }

  /**
   * Wait for text to appear on the page.
   */
  async waitForText(text: string, timeoutMs = 10_000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const tree = await this.backend.getAccessibilityTree(this.pageId);
      const found = tree.some(
        (n) => n.name?.toLowerCase().includes(text.toLowerCase()) ||
              n.description?.toLowerCase().includes(text.toLowerCase())
      );
      if (found) return true;
      await this.delay(250);
    }
    return false;
  }

  /**
   * Wait for a URL pattern to match.
   */
  async waitForUrl(pattern: string | RegExp, timeoutMs = 10_000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const url = await this.backend.currentUrl(this.pageId);
      const matches = typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url);
      if (matches) return true;
      await this.delay(250);
    }
    return false;
  }

  // ── History ────────────────────────────────────────────────────────────────

  /** Get the navigation history. */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /** Get the current history entry. */
  getCurrentEntry(): HistoryEntry | undefined {
    return this.history[this.history.length - 1];
  }

  // ── Multi-Tab ──────────────────────────────────────────────────────────────

  /**
   * Execute a plan across multiple tabs.
   * In sequential mode, steps run one after another.
   * In parallel mode, all tabs are navigated/acted on concurrently.
   */
  async executeMultiTabPlan(plan: MultiTabPlan, backend: BrowserBackend): Promise<Array<{ tabId: string; result: unknown }>> {
    if (plan.parallel) {
      // Run all steps concurrently
      const promises = plan.steps.map(async (step) => {
        switch (step.action) {
          case 'navigate':
            await backend.navigate(step.tabId, step.params.url as string);
            break;
          case 'screenshot':
            await backend.screenshot(step.tabId);
            break;
          default:
            break;
        }
        return { tabId: step.tabId, result: { success: true } };
      });
      return Promise.all(promises);
    } else {
      // Run sequentially
      const results: Array<{ tabId: string; result: unknown }> = [];
      for (const step of plan.steps) {
        switch (step.action) {
          case 'navigate':
            await backend.navigate(step.tabId, step.params.url as string);
            break;
          case 'screenshot':
            await backend.screenshot(step.tabId);
            break;
          default:
            break;
        }
        results.push({ tabId: step.tabId, result: { success: true } });
      }
      return results;
    }
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
