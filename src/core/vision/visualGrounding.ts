/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Visual Grounding (visualGrounding.ts)
 *
 * Program 06 of the AETHER 1.0 Nine-Program Capability Research Platform.
 *
 * Maps visual elements to actionable targets.  Provides confidence scoring,
 * text-to-coordinate resolution, and context-aware element matching.
 *
 * Inspired by:
 *   - microsoft/OmniParser (Apache-2.0) — visual grounding
 *   - Skyvern-AI/skyvern   (AGPL-3.0, out-of-process reference only)
 *
 * AETHER-native: no OmniParser or Skyvern imports. All logic is self-contained.
 */

import type { DetectedUIElement, ElementRole, BoundingBox } from './perceptionEngine';
import { bboxCenter, bboxArea, bboxIOU, bboxIntersection } from './perceptionEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GroundedTarget {
  /** the best-matching element */
  elementId: string;
  label: string;
  role: ElementRole;
  bbox: BoundingBox;
  /** the resolved screen coordinate (pixel center) */
  coordinate: { x: number; y: number };
  confidence: number;
  /** how well the intent matched the element */
  matchScore: number;
  /** normalized [0,1] — how close this element is to the requested one */
  proximity?: number;
  /** surrounding context labels */
  contextLabels: string[];
}

export interface GroundingResult {
  grounded: boolean;
  target: GroundedTarget | null;
  /** all candidates that were considered */
  candidates: Array<{ elementId: string; score: number }>;
  /** the reason for the grounding decision */
  reasoning: string;
}

export interface GroundingIntent {
  role?: ElementRole;
  label?: string;
  labelFuzzy?: string;      // alternative spelling / partial text
  coordinateHint?: { x: number; y: number };  // optional proximity hint
  requireExactRole?: boolean;
  context?: string[];        // surrounding text labels for context-aware matching
}

// ─── Scoring Utilities ────────────────────────────────────────────────────────

const EPS = 1e-9;

/**
 * Role match: exact = 1.0, unknown = 0.3 (still usable), others = 0.1 (penalize mismatch).
 */
function roleScore(elementRole: ElementRole, intentRole?: ElementRole): number {
  if (!intentRole) return 0.5;
  if (elementRole === intentRole) return 1.0;
  if (elementRole === 'unknown') return 0.3;
  // Partial overlap for closely related roles (e.g. textbox vs input)
  const related: Record<string, ElementRole[]> = {
    input: ['textbox', 'dropdown'],
    textbox: ['input', 'dropdown'],
    button: ['link'],
    link: ['button'],
    checkbox: ['radio'],
    radio: ['checkbox'],
  };
  const relatedTo = related[intentRole] ?? [];
  if (relatedTo.includes(elementRole)) return 0.7;
  return 0.1;
}

/**
 * Label match: exact = 1.0, includes = 0.85, levenshtein ≤ 2 = 0.75, else 0.
 */
function labelScore(elementLabel: string, intentLabel?: string, fuzzyLabel?: string): number {
  if (!intentLabel && !fuzzyLabel) return 0.5;
  const candidates = [intentLabel, fuzzyLabel].filter((s): s is string => !!s);
  let best = 0;
  for (const query of candidates) {
    const el = elementLabel.toLowerCase();
    const q = query.toLowerCase();
    if (el === q) { best = Math.max(best, 1.0); continue; }
    if (el.includes(q) || q.includes(el)) { best = Math.max(best, 0.85); continue; }
    const dist = levenshtein(el, q);
    if (dist <= 2 && q.length <= 20) { best = Math.max(best, Math.max(0, 0.75 - dist * 0.1)); }
  }
  return best;
}

/**
 * Coordinate proximity score: 1.0 at 0px, 0.0 beyond 500px.
 */
function proximityScore(
  bbox: BoundingBox,
  hint?: { x: number; y: number },
  viewportW = 1280,
  viewportH = 900,
): number {
  if (!hint) return 0.5;
  const c = bboxCenter(bbox);
  const dx = c.x - hint.x;
  const dy = c.y - hint.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(viewportW * viewportW + viewportH * viewportH) / 2;
  return Math.max(0, 1 - dist / maxDist);
}

/**
 * Context score: how many of the intent's context labels appear in the element's
 * surrounding labels (or the element's own label).
 */
function contextScore(
  elementLabel: string,
  elementChildren: string[],
  intentContext?: string[],
): number {
  if (!intentContext || intentContext.length === 0) return 0.5;
  const allLabels = [elementLabel, ...elementChildren];
  const matches = intentContext.filter((ctx) => allLabels.some((l) => l.toLowerCase().includes(ctx.toLowerCase())));
  return matches.length / intentContext.length;
}

/**
 * Levenshtein distance for fuzzy label matching.
 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

// ─── Grounding ────────────────────────────────────────────────────────────────

/**
 * Compute the composite match score for a single element against an intent.
 */
function scoreElement(
  el: DetectedUIElement,
  intent: GroundingIntent,
  viewportW = 1280,
  viewportH = 900,
): number {
  const wR = roleScore(el.role, intent.role) * 0.40;
  const wL = labelScore(el.label, intent.label, intent.labelFuzzy) * 0.30;
  const wP = proximityScore(el.bbox, intent.coordinateHint, viewportW, viewportH) * 0.15;
  const wC = contextScore(el.label, el.children, intent.context) * 0.15;
  // confidence penalty: low-confidence elements are less trustworthy
  const confPenalty = el.confidence;
  return (wR + wL + wP + wC) * confPenalty;
}

/**
 * Ground an intent to the best-matching UI element.  Returns a GroundingResult
 * with a clear `grounded` flag so callers never guess when confidence is low.
 */
export function groundIntent(
  elements: DetectedUIElement[],
  intent: GroundingIntent,
  options: { confidenceFloor?: number; viewportW?: number; viewportH?: number } = {},
): GroundingResult {
  const confidenceFloor = options.confidenceFloor ?? 0.4;
  const viewportW = options.viewportW ?? 1280;
  const viewportH = options.viewportH ?? 900;

  if (elements.length === 0) {
    return {
      grounded: false,
      target: null,
      candidates: [],
      reasoning: 'No elements available to ground against.',
    };
  }

  const scored = elements
    .map((el) => ({
      elementId: el.elementId,
      score: scoreElement(el, intent, viewportW, viewportH),
      el,
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top || top.score < confidenceFloor) {
    return {
      grounded: false,
      target: null,
      candidates: scored.slice(0, 5).map((c) => ({ elementId: c.elementId, score: c.score })),
      reasoning: `No element above floor ${confidenceFloor.toFixed(2)} (top score ${top ? top.score.toFixed(2) : 0}). Escalation to a vision backend may be required.`,
    };
  }

  const target = top.el;
  const coord = bboxCenter(target.bbox);
  return {
    grounded: true,
    target: {
      elementId: target.elementId,
      label: target.label,
      role: target.role,
      bbox: target.bbox,
      coordinate: coord,
      confidence: target.confidence,
      matchScore: Number(top.score.toFixed(3)),
      proximity: intent.coordinateHint
        ? Number(proximityScore(target.bbox, intent.coordinateHint, viewportW, viewportH).toFixed(3))
        : undefined,
      contextLabels: target.children,
    },
    candidates: scored.slice(0, 5).map((c) => ({ elementId: c.elementId, score: c.score })),
    reasoning: `Matched element "${target.label}" (${target.role}) at (${coord.x.toFixed(0)}, ${coord.y.toFixed(0)}) with score ${top.score.toFixed(3)}.`,
  };
}

/**
 * Resolve a textual label to screen coordinates by finding the element whose
 * label most closely matches the query text.
 *
 * This is the primary entry point for "click the Submit button" style intents.
 */
export function textToCoordinate(
  elements: DetectedUIElement[],
  textQuery: string,
  options: { confidenceFloor?: number } = {},
): { coordinate: { x: number; y: number } | null; element: DetectedUIElement | null; confidence: number } {
  const result = groundIntent(elements, { label: textQuery }, options);
  if (!result.grounded || !result.target) {
    return { coordinate: null, element: null, confidence: 0 };
  }
  return {
    coordinate: result.target.coordinate,
    element: { ...result.target } as unknown as DetectedUIElement,
    confidence: result.target.matchScore,
  };
}

/**
 * Given an intent with optional context, ground it and return actionable targets.
 */
export function resolveActionableTargets(
  elements: DetectedUIElement[],
  intent: GroundingIntent,
  options: { confidenceFloor?: number; maxTargets?: number } = {},
): GroundedTarget[] {
  const result = groundIntent(elements, intent, options);
  if (!result.grounded || !result.target) return [];
  return [result.target];
}
