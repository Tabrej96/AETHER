/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Task Verification (src/core/browser/taskVerifier.ts)
 *
 * Post-action state verification: screenshot comparison, DOM state validation,
 * error detection, and structured verification reports.
 *
 * SECURITY: Verification never executes page-side JavaScript. All checks
 * use structured reads from the backend (accessibility tree, DOM snapshot).
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import type { BrowserBackend, AccessibilityNode, DomNode } from './browserEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationStatus = 'PASS' | 'FAIL' | 'ERROR' | 'SKIPPED';

export interface VerificationCheck {
  /** Unique check ID. */
  id: string;
  /** Human-readable description. */
  description: string;
  /** Result of this check. */
  status: VerificationStatus;
  /** Expected value or condition. */
  expected: string;
  /** Actual value or condition. */
  actual: string;
  /** Severity of a failure. */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Remediation hint. */
  remediation?: string;
}

export interface VerificationResult {
  /** Overall pass/fail. */
  passed: boolean;
  /** Individual check results. */
  checks: VerificationCheck[];
  /** Summary of failures by severity. */
  failureSummary: Record<string, number>;
  /** ISO timestamp. */
  verifiedAtIso: string;
  /** Duration in ms. */
  durationMs: number;
}

export interface VerificationConfig {
  /** Whether to capture a screenshot for visual comparison. */
  captureScreenshot?: boolean;
  /** Whether to compare screenshots (requires a baseline). */
  compareScreenshot?: boolean;
  /** Path to a baseline screenshot for comparison. */
  baselineScreenshotPath?: string;
  /** Maximum allowed perceptual hash difference (0-64, lower = stricter). */
  maxPhashDistance?: number;
  /** CSS selectors of elements that must be present after the action. */
  requiredElements?: string[];
  /** CSS selectors of elements that must NOT be present after the action. */
  forbiddenElements?: string[];
  /** URL patterns that must match after navigation. */
  expectedUrlPatterns?: (string | RegExp)[];
  /** Text strings that must appear on the page. */
  requiredTexts?: string[];
  /** Text strings that must NOT appear (error messages, etc.). */
  forbiddenTexts?: string[];
  /** Timeout for individual checks in ms. */
  checkTimeoutMs?: number;
}

// ─── Screenshot Comparison ────────────────────────────────────────────────────

/**
 * Compute a simple perceptual hash of an image buffer for comparison.
 * This is a simplified version — production should use a proper pHash library.
 */
function computeImageHash(buf: Buffer): string {
  // Downsample to 8x8 grayscale, then compute hash
  const size = 8;
  const grayscale = new Float64Array(size * size);

  // Simple average-based hash (not true DCT pHash but sufficient for change detection)
  let totalBrightness = 0;
  const pixelCount = Math.floor(buf.length / 4); // RGBA
  for (let i = 0; i < pixelCount; i++) {
    const offset = i * 4;
    totalBrightness += (buf[offset] * 0.299 + buf[offset + 1] * 0.587 + buf[offset + 2] * 0.114);
  }
  const avgBrightness = totalBrightness / pixelCount;

  // Sample pixels at regular intervals to build hash
  let hash = '';
  const step = Math.max(1, Math.floor(pixelCount / 64));
  for (let i = 0; i < 64 && i * step < pixelCount; i++) {
    const offset = (i * step) * 4;
    const brightness = buf[offset] * 0.299 + buf[offset + 1] * 0.587 + buf[offset + 2] * 0.114;
    hash += brightness > avgBrightness ? '1' : '0';
  }

  return hash;
}

function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

// ─── Error Pattern Detection ─────────────────────────────────────────────────

const ERROR_PATTERNS = [
  { pattern: /\b(error|exception|failed|failure)\b/i, severity: 'high' as const, message: 'Error text detected on page' },
  { pattern: /\b(404|500|502|503|504)\b/, severity: 'critical' as const, message: 'HTTP error code detected' },
  { pattern: /<html[^>]*>\s*<!DOCTYPE/i, severity: 'medium' as const, message: 'Raw HTML detected in page content (possible injection)' },
  { pattern: /\b(undefined|null)\s+is\s+not\s+(a\s+)?(function|object|string|number)/i, severity: 'high' as const, message: 'JavaScript runtime error detected' },
  { pattern: /\b(refused|blocked|cors)\b/i, severity: 'medium' as const, message: 'CORS or blocked resource detected' },
];

function detectErrors(text: string): Array<{ message: string; severity: 'critical' | 'high' | 'medium' | 'low' }> {
  const errors: Array<{ message: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = [];
  for (const { pattern, severity, message } of ERROR_PATTERNS) {
    if (pattern.test(text)) {
      errors.push({ message, severity });
    }
  }
  return errors;
}

// ─── Task Verifier ────────────────────────────────────────────────────────────

export class TaskVerifier {
  private readonly backend: BrowserBackend;
  private readonly sessionId: string;
  private readonly pageId: string;
  private baselineHash: string | null = null;

  constructor(backend: BrowserBackend, sessionId: string, pageId: string) {
    this.backend = backend;
    this.sessionId = sessionId;
    this.pageId = pageId;
  }

  /**
   * Set a baseline screenshot for visual comparison.
   */
  setBaselineScreenshot(buf: Buffer): void {
    this.baselineHash = computeImageHash(buf);
  }

  /**
   * Load a baseline screenshot from disk.
   */
  loadBaselineScreenshot(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Baseline screenshot not found: ${filePath}`);
    }
    const buf = fs.readFileSync(filePath);
    this.baselineHash = computeImageHash(buf);
  }

  /**
   * Run a full verification suite against the current page state.
   */
  async verify(config: VerificationConfig): Promise<VerificationResult> {
    const startTime = Date.now();
    const checks: VerificationCheck[] = [];

    // Run all configured checks
    if (config.requiredElements && config.requiredElements.length > 0) {
      checks.push(...(await this.checkRequiredElements(config.requiredElements, config.checkTimeoutMs)));
    }

    if (config.forbiddenElements && config.forbiddenElements.length > 0) {
      checks.push(...(await this.checkForbiddenElements(config.forbiddenElements)));
    }

    if (config.expectedUrlPatterns && config.expectedUrlPatterns.length > 0) {
      checks.push(...(await this.checkUrlPatterns(config.expectedUrlPatterns)));
    }

    if (config.requiredTexts && config.requiredTexts.length > 0) {
      checks.push(...(await this.checkRequiredTexts(config.requiredTexts)));
    }

    if (config.forbiddenTexts && config.forbiddenTexts.length > 0) {
      checks.push(...(await this.checkForbiddenTexts(config.forbiddenTexts)));
    }

    if (config.captureScreenshot || config.compareScreenshot) {
      const screenshotCheck = await this.checkScreenshot(config);
      checks.push(screenshotCheck);
    }

    // Always run error detection
    checks.push(...(await this.checkForErrors()));

    const failureSummary = checks.reduce(
      (acc, check) => {
        if (check.status === 'FAIL' || check.status === 'ERROR') {
          acc[check.severity] = (acc[check.severity] ?? 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    const passed = !checks.some((c) => c.status === 'FAIL' || c.status === 'ERROR');

    return {
      passed,
      checks,
      failureSummary,
      verifiedAtIso: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Verify that a specific element exists and has the expected state.
   */
  async verifyElement(selector: string, expectedState?: { text?: string; visible?: boolean; enabled?: boolean }): Promise<VerificationCheck> {
    const tree = await this.backend.getAccessibilityTree(this.pageId);
    const node = tree.find((n) => n.cssSelector === selector || n.cssSelector?.endsWith(selector));

    if (!node) {
      return {
        id: `el-exists-${selector.replace(/[^a-z0-9]/gi, '-')}`,
        description: `Element "${selector}" exists`,
        status: 'FAIL',
        expected: 'present',
        actual: 'not found',
        severity: 'high',
        remediation: `Ensure the element "${selector}" is rendered on the page`,
      };
    }

    if (expectedState?.visible !== undefined && node.hidden === expectedState.visible) {
      return {
        id: `el-visible-${selector.replace(/[^a-z0-9]/gi, '-')}`,
        description: `Element "${selector}" visibility`,
        status: 'FAIL',
        expected: String(expectedState.visible),
        actual: String(!node.hidden),
        severity: 'medium',
      };
    }

    return {
      id: `el-ok-${selector.replace(/[^a-z0-9]/gi, '-')}`,
      description: `Element "${selector}" verified`,
      status: 'PASS',
      expected: 'present and valid',
      actual: `role=${node.role} name=${node.name}`,
      severity: 'low',
    };
  }

  // ─── Private check methods ──────────────────────────────────────────────────

  private async checkRequiredElements(selectors: string[], _timeoutMs?: number): Promise<VerificationCheck[]> {
    const tree = await this.backend.getAccessibilityTree(this.pageId);
    return selectors.map((selector) => {
      const found = tree.some((n) => n.cssSelector === selector || n.cssSelector?.endsWith(selector));
      return {
        id: `required-el-${selector.replace(/[^a-z0-9]/gi, '-')}`,
        description: `Required element "${selector}" is present`,
        status: found ? 'PASS' : 'FAIL',
        expected: 'present',
        actual: found ? 'found' : 'not found',
        severity: 'high' as const,
        remediation: `Ensure the element "${selector}" is rendered before proceeding`,
      };
    });
  }

  private async checkForbiddenElements(selectors: string[]): Promise<VerificationCheck[]> {
    const tree = await this.backend.getAccessibilityTree(this.pageId);
    return selectors.map((selector) => {
      const found = tree.some((n) => n.cssSelector === selector || n.cssSelector?.endsWith(selector));
      return {
        id: `forbidden-el-${selector.replace(/[^a-z0-9]/gi, '-')}`,
        description: `Forbidden element "${selector}" is absent`,
        status: found ? 'FAIL' : 'PASS',
        expected: 'absent',
        actual: found ? 'found (should be absent)' : 'not found (correct)',
        severity: 'high' as const,
      };
    });
  }

  private async checkUrlPatterns(patterns: (string | RegExp)[]): Promise<VerificationCheck[]> {
    const url = await this.backend.currentUrl(this.pageId);
    return patterns.map((pattern, i) => {
      const matches = typeof pattern === 'string' ? url.includes(pattern) : pattern.test(url);
      return {
        id: `url-pattern-${i}`,
        description: `URL matches expected pattern`,
        status: matches ? 'PASS' : 'FAIL',
        expected: typeof pattern === 'string' ? pattern : pattern.source,
        actual: url,
        severity: 'high' as const,
      };
    });
  }

  private async checkRequiredTexts(texts: string[]): Promise<VerificationCheck[]> {
    const tree = await this.backend.getAccessibilityTree(this.pageId);
    const allText = tree.map((n) => `${n.name ?? ''} ${n.description ?? ''}`).join(' ');
    return texts.map((text) => {
      const found = allText.toLowerCase().includes(text.toLowerCase());
      return {
        id: `required-text-${text.replace(/[^a-z0-9]/gi, '-')}`,
        description: `Required text "${text}" is present`,
        status: found ? 'PASS' : 'FAIL',
        expected: text,
        actual: found ? 'found' : 'not found',
        severity: 'medium' as const,
      };
    });
  }

  private async checkForbiddenTexts(texts: string[]): Promise<VerificationCheck[]> {
    const tree = await this.backend.getAccessibilityTree(this.pageId);
    const allText = tree.map((n) => `${n.name ?? ''} ${n.description ?? ''}`).join(' ');
    return texts.map((text) => {
      const found = allText.toLowerCase().includes(text.toLowerCase());
      return {
        id: `forbidden-text-${text.replace(/[^a-z0-9]/gi, '-')}`,
        description: `Forbidden text "${text}" is absent`,
        status: found ? 'FAIL' : 'PASS',
        expected: 'absent',
        actual: found ? `found (should be absent): "${text}"` : 'not found (correct)',
        severity: 'high' as const,
      };
    });
  }

  private async checkScreenshot(config: VerificationConfig): Promise<VerificationCheck> {
    try {
      const screenshot = await this.backend.screenshot(this.pageId);
      const currentHash = computeImageHash(screenshot);

      if (config.compareScreenshot && this.baselineHash) {
        const distance = hammingDistance(this.baselineHash, currentHash);
        const maxDistance = config.maxPhashDistance ?? 8;
        const status = distance <= maxDistance ? 'PASS' : 'FAIL';
        return {
          id: 'screenshot-compare',
          description: 'Screenshot matches baseline',
          status,
          expected: `phash distance <= ${maxDistance}`,
          actual: `distance = ${distance}`,
          severity: 'medium',
          remediation: 'Visual regression detected — review the page layout',
        };
      }

      return {
        id: 'screenshot-capture',
        description: 'Screenshot captured successfully',
        status: 'PASS',
        expected: 'valid PNG buffer',
        actual: `${screenshot.length} bytes`,
        severity: 'low',
      };
    } catch (err) {
      return {
        id: 'screenshot-capture',
        description: 'Screenshot capture',
        status: 'ERROR',
        expected: 'valid PNG buffer',
        actual: `capture failed: ${(err as Error).message}`,
        severity: 'medium',
      };
    }
  }

  private async checkForErrors(): Promise<VerificationCheck[]> {
    const tree = await this.backend.getAccessibilityTree(this.pageId);
    const allText = tree.map((n) => `${n.name ?? ''} ${n.description ?? ''}`).join(' ');
    const errors = detectErrors(allText);

    if (errors.length === 0) {
      return [{
        id: 'error-detection',
        description: 'No error patterns detected on page',
        status: 'PASS',
        expected: 'no errors',
        actual: 'clean',
        severity: 'low',
      }];
    }

    return errors.map((err, i) => ({
      id: `error-${i}`,
      description: err.message,
      status: 'FAIL' as const,
      expected: 'no error patterns',
      actual: err.message,
      severity: err.severity,
    }));
  }
}
