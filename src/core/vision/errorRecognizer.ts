/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Error Recognizer (errorRecognizer.ts)
 *
 * Program 06 of the AETHER 1.0 Nine-Program Capability Research Platform.
 *
 * Detects error modals/messages, stuck states, CAPTCHA challenges, and
 * fallback triggers from perceived screen data.  All detection is deterministic
 * — it classifies based on element roles, labels, and text content, not ML.
 *
 * Inspired by:
 *   - Skyvern-AI/skyvern   (AGPL-3.0, out-of-process reference only) — error recovery
 *   - microsoft/OmniParser  (Apache-2.0) — visual state classification
 *
 * AETHER-native: no OmniParser or Skyvern imports. All logic is self-contained.
 */

import type { DetectedUIElement, PerceivedScreen } from './perceptionEngine';
import type { ElementRole } from './perceptionEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ErrorType =
  | 'error_modal'
  | 'stuck_state'
  | 'captcha'
  | 'network_error'
  | 'permission_denied'
  | 'timeout'
  | 'form_validation'
  | 'authentication'
  | 'generic_error'
  | 'no_error';

export interface DetectedError {
  errorType: ErrorType;
  confidence: number;
  /** the element(s) that indicate this error */
  indicatorElementIds: string[];
  /** human-readable description */
  description: string;
  /** whether the system can likely recover from this error */
  recoverable: boolean;
  /** suggested recovery strategy */
  recoverySuggestion?: string;
}

export interface ErrorAnalysisReport {
  hasErrors: boolean;
  errors: DetectedError[];
  /** overall confidence that the screen is in an error state */
  overallConfidence: number;
  /** whether the screen appears to be loading / transitioning */
  isLoading: boolean;
  /** whether the screen appears blank / empty */
  isBlank: boolean;
  /** recommended action */
  recommendedAction: 'continue' | 'retry' | 'recover' | 'abort' | 'escalate';
}

// ─── Error Detection Patterns ─────────────────────────────────────────────────

const ERROR_ROLE_PATTERNS: Array<{ roles: ElementRole[]; errorType: ErrorType; weight: number }> = [
  { roles: ['modal'], errorType: 'error_modal', weight: 0.8 },
  { roles: ['alert'], errorType: 'error_modal', weight: 0.9 },
];

const ERROR_LABEL_PATTERNS: Array<{ pattern: RegExp; errorType: ErrorType; weight: number; recoverable: boolean; recovery?: string }> = [
  { pattern: /error|err[oó]r|failed|failure|fatal/i, errorType: 'error_modal', weight: 0.9, recoverable: true, recovery: 'Dismiss the error modal and retry the last action.' },
  { pattern: /something went wrong|oops|uh-oh|aw, snap/i, errorType: 'error_modal', weight: 0.9, recoverable: true, recovery: 'Dismiss and retry.' },
  { pattern: /not found|404|no such page|page not found/i, errorType: 'generic_error', weight: 0.85, recoverable: true, recovery: 'Navigate back or go to the home page.' },
  { pattern: /stuck|frozen|not responding|no response|timeout/i, errorType: 'timeout', weight: 0.85, recoverable: true, recovery: 'Wait briefly then retry, or reload the page.' },
  { pattern: /loading|please wait|processing|stand by/i, errorType: 'timeout', weight: 0.4, recoverable: true, recovery: 'Wait for the loading state to resolve.' },
  { pattern: /captcha|verify you are human|prove you are not a robot|i'?m not a robot|recaptcha|hcaptcha/i, errorType: 'captcha', weight: 0.95, recoverable: false, recovery: 'CAPTCHA requires human intervention — escalate to user.' },
  { pattern: /access denied|forbidden|403|not authorized|unauthorized|401/i, errorType: 'permission_denied', weight: 0.9, recoverable: true, recovery: 'Check credentials or permissions, then retry.' },
  { pattern: /network|connection|offline|no internet|unreachable/i, errorType: 'network_error', weight: 0.85, recoverable: true, recovery: 'Wait for network recovery, then retry.' },
  { pattern: /login|sign in|authenticate|credentials/i, errorType: 'authentication', weight: 0.6, recoverable: true, recovery: 'Provide credentials or check session.' },
  { pattern: /invalid|required|must fill|please enter|field is required/i, errorType: 'form_validation', weight: 0.8, recoverable: true, recovery: 'Fill the required field(s) and retry.' },
  { pattern: /already exists|duplicate|conflict/i, errorType: 'form_validation', weight: 0.7, recoverable: true, recovery: 'Use a different value or resolve the conflict.' },
];

const STUCK_INDICATORS = [
  /stuck|frozen|not responding|no change|same screen|unchanged/i,
];

const BLANK_SCREEN_THRESHOLD = 2; // fewer than this many elements = blank

// ─── Error Detection ──────────────────────────────────────────────────────────

/**
 * Detect errors in a perceived screen.  All checks are deterministic —
 * based on element labels, roles, and counts, not ML inference.
 */
export function detectErrors(screen: PerceivedScreen): DetectedError[] {
  const errors: DetectedError[] = [];
  const elements = screen.elements;

  if (elements.length === 0) return errors;

  // 1. Check each element against error label patterns.
  for (const el of elements) {
    for (const pattern of ERROR_LABEL_PATTERNS) {
      if (pattern.pattern.test(el.label) || (el.textContent && pattern.pattern.test(el.textContent))) {
        errors.push({
          errorType: pattern.errorType,
          confidence: pattern.weight * el.confidence,
          indicatorElementIds: [el.elementId],
          description: `Element "${el.label}" matches error pattern "${pattern.pattern.source}"`,
          recoverable: pattern.recoverable,
          recoverySuggestion: pattern.recovery,
        });
      }
    }
  }

  // 2. Check for error_modal from role patterns.
  for (const el of elements) {
    for (const rolePat of ERROR_ROLE_PATTERNS) {
      if (rolePat.roles.includes(el.role)) {
        // Only flag as error_modal if the label also suggests error.
        const isErrorLabel = ERROR_LABEL_PATTERNS.some((p) =>
          p.errorType === 'error_modal' && (p.pattern.test(el.label) || (el.textContent && p.pattern.test(el.textContent))),
        );
        if (isErrorLabel) {
          errors.push({
            errorType: 'error_modal',
            confidence: rolePat.weight * el.confidence,
            indicatorElementIds: [el.elementId],
            description: `Modal/dialog element "${el.label}" indicates an error state`,
            recoverable: true,
            recoverySuggestion: 'Dismiss the modal and retry.',
          });
        }
      }
    }
  }

  // 3. Deduplicate errors by type — keep the highest confidence per type.
  const byType = new Map<ErrorType, DetectedError>();
  for (const err of errors) {
    const existing = byType.get(err.errorType);
    if (!existing || err.confidence > existing.confidence) {
      byType.set(err.errorType, err);
    }
  }

  return Array.from(byType.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect a stuck state: the screen looks identical to a previous one.
 */
export function detectStuckState(
  screen: PerceivedScreen,
  previousStateHashes: string[],
  minStaleCount = 2,
): { stuck: boolean; consecutiveSame: number } {
  const occurrences = previousStateHashes.filter((h) => h === screen.stateHash).length;
  return {
    stuck: occurrences >= minStaleCount,
    consecutiveSame: occurrences,
  };
}

/**
 * Detect CAPTCHA challenges specifically.
 */
export function detectCaptcha(screen: PerceivedScreen): DetectedError | null {
  for (const el of screen.elements) {
    const captchaPattern = /captcha|verify you are human|prove you are not a robot|i'?m not a robot|recaptcha|hcaptcha|turnstile/i;
    if (captchaPattern.test(el.label) || (el.textContent && captchaPattern.test(el.textContent))) {
      return {
        errorType: 'captcha',
        confidence: 0.95 * el.confidence,
        indicatorElementIds: [el.elementId],
        description: `CAPTCHA challenge detected: "${el.label}"`,
        recoverable: false,
        recoverySuggestion: 'CAPTCHA requires human intervention — escalate to user.',
      };
    }
  }
  // Also check if the screen has very few elements (CAPTCHAs often have few interactable elements).
  const interactiveElements = screen.elements.filter((e) =>
    ['button', 'link', 'input', 'textbox', 'checkbox', 'radio', 'dropdown'].includes(e.role),
  );
  if (interactiveElements.length <= 2 && screen.elements.length > 0) {
    const anyInteractive = interactiveElements[0];
    if (anyInteractive && /checkbox|verify/i.test(anyInteractive.label)) {
      return {
        errorType: 'captcha',
        confidence: 0.6,
        indicatorElementIds: [anyInteractive.elementId],
        description: 'Possible CAPTCHA: few interactive elements with verification-like labels',
        recoverable: false,
        recoverySuggestion: 'CAPTCHA requires human intervention — escalate to user.',
      };
    }
  }
  return null;
}

/**
 * Produce a full error analysis report from a screen.
 */
export function analyzeScreenState(screen: PerceivedScreen, previousHashes: string[] = []): ErrorAnalysisReport {
  const errors = detectErrors(screen);
  const captcha = detectCaptcha(screen);
  if (captcha && !errors.some((e) => e.errorType === 'captcha')) {
    errors.unshift(captcha);
  }

  const stuckInfo = detectStuckState(screen, previousHashes);
  const hasErrors = errors.length > 0;
  const overallConfidence = errors.length > 0
    ? errors.reduce((sum, e) => sum + e.confidence, 0) / errors.length
    : 0;

  // Loading state: elements have "loading" labels.
  const isLoading = screen.elements.some(
    (e) => /loading|please wait|processing|stand by/i.test(e.label || ''),
  );

  // Blank screen: fewer than threshold elements.
  const isBlank = screen.elements.length < BLANK_SCREEN_THRESHOLD;

  // Recommend action.
  let recommendedAction: ErrorAnalysisReport['recommendedAction'] = 'continue';
  if (captcha) recommendedAction = 'escalate';
  else if (stuckInfo.stuck) recommendedAction = 'retry';
  else if (errors.some((e) => !e.recoverable)) recommendedAction = 'escalate';
  else if (hasErrors && errors.every((e) => e.recoverable)) recommendedAction = 'recover';
  else if (isBlank) recommendedAction = 'retry';
  else if (isLoading) recommendedAction = 'continue';

  return {
    hasErrors,
    errors,
    overallConfidence: Number(overallConfidence.toFixed(2)),
    isLoading,
    isBlank,
    recommendedAction,
  };
}

/**
 * Check if the screen should trigger a fallback strategy.
 */
export function shouldFallback(report: ErrorAnalysisReport, fallbackThreshold = 0.7): boolean {
  if (report.recommendedAction === 'escalate') return true;
  if (report.errors.some((e) => e.errorType === 'captcha')) return true;
  if (report.overallConfidence >= fallbackThreshold) return true;
  if (report.isBlank && report.errors.length === 0) return false; // blank may just be a new page
  return false;
}

/**
 * Generate a human-readable error summary.
 */
export function summarizeErrors(report: ErrorAnalysisReport): string {
  if (!report.hasErrors) return 'No errors detected on screen.';
  const parts = report.errors.map((e) => `[${e.errorType}] ${e.description} (confidence: ${(e.confidence * 100).toFixed(0)}%)`);
  if (report.isLoading) parts.push('Screen appears to be loading.');
  if (report.isBlank) parts.push('Screen appears blank or empty.');
  return parts.join('; ');
}
