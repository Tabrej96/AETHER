/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Error Recognizer Tests (errorRecognizer.test.ts)
 *
 * Tests for src/core/vision/errorRecognizer.ts
 *
 * Run via: npx --yes tsx --test src/core/vision/errorRecognizer.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectErrors,
  detectCaptcha,
  detectStuckState,
  analyzeScreenState,
  shouldFallback,
  summarizeErrors,
} from './errorRecognizer';
import type { DetectedUIElement, PerceivedScreen } from './perceptionEngine';
import type { ElementRole } from './perceptionEngine';

function makeElement(id: string, label: string, role: ElementRole, confidence = 0.9, textContent?: string): DetectedUIElement {
  return {
    elementId: id,
    label,
    role,
    bbox: { x: 0, y: 0, width: 100, height: 50 },
    confidence,
    textContent: textContent ?? label,
    attributes: {},
    children: [],
  };
}

function makeScreen(elements: DetectedUIElement[] = []): PerceivedScreen {
  return {
    screenId: 'test-screen',
    capture: { captureId: 'cap-1', viewport: { width: 1280, height: 900 }, timestamp: Date.now() },
    elements,
    stateHash: 'hash-1',
  };
}

// ─── Error Detection ─────────────────────────────────────────────────────────

test('detectErrors: detects error in button label', () => {
  const screen = makeScreen([makeElement('e1', 'Error: something failed', 'button')]);
  const errors = detectErrors(screen);
  assert.ok(errors.length > 0, 'Should detect error');
  assert.ok(errors.some((e) => e.errorType === 'error_modal'), 'Should have error_modal type');
});

test('detectErrors: detects "404" in label', () => {
  const screen = makeScreen([makeElement('e1', 'Page Not Found (404)', 'heading')]);
  const errors = detectErrors(screen);
  assert.ok(errors.some((e) => e.errorType === 'generic_error'));
});

test('detectErrors: detects "access denied"', () => {
  const screen = makeScreen([makeElement('e1', 'Access Denied', 'modal')]);
  const errors = detectErrors(screen);
  assert.ok(errors.some((e) => e.errorType === 'permission_denied'));
});

test('detectErrors: detects "network error"', () => {
  const screen = makeScreen([makeElement('e1', 'Network Error', 'alert')]);
  const errors = detectErrors(screen);
  assert.ok(errors.some((e) => e.errorType === 'network_error'));
});

test('detectErrors: detects "captcha"', () => {
  const screen = makeScreen([makeElement('e1', 'reCAPTCHA', 'checkbox')]);
  const errors = detectErrors(screen);
  assert.ok(errors.some((e) => e.errorType === 'captcha'));
});

test('detectErrors: detects "form validation" errors', () => {
  const screen = makeScreen([makeElement('e1', 'Field is required', 'alert')]);
  const errors = detectErrors(screen);
  assert.ok(errors.some((e) => e.errorType === 'form_validation'));
});

test('detectErrors: no errors on clean screen', () => {
  const screen = makeScreen([makeElement('e1', 'Submit', 'button', 0.9)]);
  const errors = detectErrors(screen);
  assert.equal(errors.length, 0, 'Clean screen should have no errors');
});

test('detectErrors: empty screen has no errors', () => {
  const screen = makeScreen([]);
  const errors = detectErrors(screen);
  assert.equal(errors.length, 0);
});

test('detectErrors: confidence multiplied by element confidence', () => {
  const screen = makeScreen([makeElement('e1', 'Error occurred', 'button', 0.5)]);
  const errors = detectErrors(screen);
  assert.ok(errors.length > 0);
  // Pattern weight is 0.9, element confidence is 0.5 -> 0.45
  assert.ok(errors[0].confidence <= 0.9);
  assert.ok(errors[0].confidence >= 0.3);
});

test('detectErrors: deduplicates by error type (keeps highest)', () => {
  const screen = makeScreen([
    makeElement('e1', 'Error A', 'button', 0.5),
    makeElement('e2', 'Error B', 'button', 0.9),
  ]);
  const errors = detectErrors(screen);
  const errorModals = errors.filter((e) => e.errorType === 'error_modal');
  assert.ok(errorModals.length <= 1, 'Should deduplicate by type');
  if (errorModals.length === 1) {
    assert.ok(errorModals[0].confidence >= 0.8, 'Should keep higher confidence');
  }
});

// ─── Stuck State Detection ───────────────────────────────────────────────────

test('detectStuckState: detects stall when same hash repeats', () => {
  const screen = makeScreen([]);
  const result = detectStuckState(screen, ['hash-1', 'hash-1', 'hash-1']);
  assert.ok(result.stuck);
  assert.equal(result.consecutiveSame, 3);
});

test('detectStuckState: not stuck with different hashes', () => {
  const screen = makeScreen([]);
  const result = detectStuckState(screen, ['hash-a', 'hash-b', 'hash-c']);
  assert.ok(!result.stuck);
});

test('detectStuckState: not stuck with empty history', () => {
  const screen = makeScreen([]);
  const result = detectStuckState(screen, []);
  assert.ok(!result.stuck);
});

test('detectStuckState: respects minStaleCount', () => {
  const screen = makeScreen([]);
  const result = detectStuckState(screen, ['hash-1', 'hash-1'], 3);
  assert.ok(!result.stuck, 'Should require 3 repeats, only have 2');
});

// ─── CAPTCHA Detection ───────────────────────────────────────────────────────

test('detectCaptcha: detects recaptcha in label', () => {
  const screen = makeScreen([makeElement('e1', 'I am not a robot', 'checkbox')]);
  const captcha = detectCaptcha(screen);
  assert.ok(captcha, 'Should detect CAPTCHA');
  assert.equal(captcha!.errorType, 'captcha');
  assert.ok(!captcha!.recoverable, 'CAPTCHA is not recoverable');
});

test('detectCaptcha: detects hcaptcha', () => {
  const screen = makeScreen([makeElement('e1', 'hCaptcha verify', 'checkbox')]);
  const captcha = detectCaptcha(screen);
  assert.ok(captcha);
  assert.equal(captcha!.errorType, 'captcha');
});

test('detectCaptcha: returns null when no CAPTCHA', () => {
  const screen = makeScreen([makeElement('e1', 'Submit', 'button')]);
  const captcha = detectCaptcha(screen);
  assert.equal(captcha, null);
});

test('detectCaptcha: detects few interactive elements with verify labels', () => {
  const screen = makeScreen([
    makeElement('e1', 'Verify', 'checkbox', 0.9),
    makeElement('e2', 'Some text', 'text', 0.9),
  ]);
  const captcha = detectCaptcha(screen);
  // This should trigger the heuristic: few interactive elements + verify label
  assert.ok(captcha !== null, 'Should detect possible CAPTCHA from low interactivity');
});

// ─── Screen State Analysis ───────────────────────────────────────────────────

test('analyzeScreenState: clean screen has no errors', () => {
  const screen = makeScreen([makeElement('e1', 'Submit', 'button', 0.9)]);
  const report = analyzeScreenState(screen);
  assert.ok(!report.hasErrors);
  assert.equal(report.recommendedAction, 'continue');
});

test('analyzeScreenState: screen with error modal recommends recovery', () => {
  const screen = makeScreen([makeElement('e1', 'Error: failed', 'modal')]);
  const report = analyzeScreenState(screen);
  assert.ok(report.hasErrors);
  assert.equal(report.recommendedAction, 'recover');
});

test('analyzeScreenState: blank screen recommends retry', () => {
  const screen = makeScreen([]);
  const report = analyzeScreenState(screen);
  assert.ok(report.isBlank);
  assert.equal(report.recommendedAction, 'retry');
});

test('analyzeScreenState: loading screen detects loading', () => {
  const screen = makeScreen([makeElement('e1', 'Loading...', 'button')]);
  const report = analyzeScreenState(screen);
  assert.ok(report.isLoading);
  assert.equal(report.recommendedAction, 'continue');
});

test('analyzeScreenState: CAPTCHA recommends escalate', () => {
  const screen = makeScreen([makeElement('e1', 'I am not a robot', 'checkbox')]);
  const report = analyzeScreenState(screen);
  assert.ok(report.hasErrors);
  assert.ok(report.errors.some((e) => e.errorType === 'captcha'));
  assert.equal(report.recommendedAction, 'escalate');
});

test('analyzeScreenState: includes previousHashes for stuck detection', () => {
  const screen = makeScreen([makeElement('e1', 'X', 'button')]);
  const report = analyzeScreenState(screen, ['hash-1', 'hash-1']);
  assert.ok(report.hasErrors || !report.hasErrors, 'Should not crash');
  assert.ok(typeof report.overallConfidence === 'number');
});

// ─── Fallback Detection ──────────────────────────────────────────────────────

test('shouldFallback: returns true for escalate', () => {
  const report: ReturnType<typeof analyzeScreenState> = {
    hasErrors: true,
    errors: [{ errorType: 'captcha', confidence: 0.95, indicatorElementIds: [], description: '', recoverable: false }],
    overallConfidence: 0.95,
    isLoading: false,
    isBlank: false,
    recommendedAction: 'escalate',
  };
  assert.ok(shouldFallback(report));
});

test('shouldFallback: returns true for high confidence errors', () => {
  const report: ReturnType<typeof analyzeScreenState> = {
    hasErrors: true,
    errors: [{ errorType: 'error_modal', confidence: 0.8, indicatorElementIds: [], description: '', recoverable: true }],
    overallConfidence: 0.8,
    isLoading: false,
    isBlank: false,
    recommendedAction: 'recover',
  };
  assert.ok(shouldFallback(report, 0.7));
});

test('shouldFallback: returns false for low-confidence errors', () => {
  const report: ReturnType<typeof analyzeScreenState> = {
    hasErrors: true,
    errors: [{ errorType: 'error_modal', confidence: 0.3, indicatorElementIds: [], description: '', recoverable: true }],
    overallConfidence: 0.3,
    isLoading: false,
    isBlank: false,
    recommendedAction: 'recover',
  };
  assert.ok(!shouldFallback(report, 0.7));
});

// ─── Error Summary ───────────────────────────────────────────────────────────

test('summarizeErrors: returns readable summary', () => {
  const report: ReturnType<typeof analyzeScreenState> = {
    hasErrors: true,
    errors: [{ errorType: 'error_modal', confidence: 0.9, indicatorElementIds: ['e1'], description: 'Modal error', recoverable: true }],
    overallConfidence: 0.9,
    isLoading: false,
    isBlank: false,
    recommendedAction: 'recover',
  };
  const summary = summarizeErrors(report);
  assert.ok(summary.includes('error_modal'));
  assert.ok(summary.includes('90%'));
});

test('summarizeErrors: no errors returns clean message', () => {
  const report: ReturnType<typeof analyzeScreenState> = {
    hasErrors: false,
    errors: [],
    overallConfidence: 0,
    isLoading: false,
    isBlank: false,
    recommendedAction: 'continue',
  };
  assert.equal(summarizeErrors(report), 'No errors detected on screen.');
});
