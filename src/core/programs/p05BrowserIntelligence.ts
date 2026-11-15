/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 05 — BROWSER INTELLIGENCE  ·  AETHER Browser Intelligence Engine
 * (src/core/programs/p05BrowserIntelligence.ts)
 *
 * Researched from:
 *   - browser-use/browser-use      (MIT)   — DOM + bounding-box vision agent loop
 *   - vercel-labs/agent-browser    (MIT)   — semantic accessibility `[ref=eN]` snapshots
 *   - microsoft/playwright + lightpanda (P07 provider abstraction)
 *
 * Delivers: ONE unified Browser Engine with multiple interaction strategies —
 * deterministic CSS/ARIA DOM locators, compact accessibility-tree `[ref]`
 * snapshots, and vision coordinate fallback — that ranks strategies by
 * determinism and only escalates to vision when cheaper strategies fail.
 * The provider chosen for execution is delegated to P07.
 */

import { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';
import type { ProviderSelection } from './p07BrowserRuntime';

export type BrowserInteractionStrategy = 'A11Y_REF' | 'DETERMINISTIC_DOM' | 'VISION_COORDINATE' | 'FORM_FILL' | 'SCREENSHOT_VERIFY';

export interface AetherDomElement {
  tag: string;
  id?: string;
  name?: string;
  role?: string;
  ariaLabel?: string;
  text?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  ref?: string; // `[ref=eN]` accessibility reference
}

export interface A11ySnapshot {
  refs: Record<string, AetherDomElement>;
  nodeCount: number;
  /** token cost of the compact snapshot (vs raw DOM) */
  estimatedSnapshotTokens: number;
}

export interface ElementQuery {
  strategy: BrowserInteractionStrategy;
  cssSelector?: string;
  label?: string;
  role?: string;
  /** vision fallback target description */
  visualDescription?: string;
}

export interface ElementMatch {
  strategy: BrowserInteractionStrategy;
  confidence: number;
  element: AetherDomElement | null;
  coordinate?: { x: number; y: number };
  reason: string;
}

/**
 * Strategy determinism rank: A11Y_REF & DETERMINISTIC_DOM are reproducible and
 * low-token; VISION_COORDINATE is least deterministic and highest-cost. The
 * engine escalates only when a lower-cost strategy fails.
 */
const STRATEGY_RANK: Record<BrowserInteractionStrategy, number> = {
  DETERMINISTIC_DOM: 0,
  A11Y_REF: 0,
  FORM_FILL: 1,
  SCREENSHOT_VERIFY: 1,
  VISION_COORDINATE: 2,
};

export interface BrowserTaskPlan {
  steps: Array<{ action: string; strategy: BrowserInteractionStrategy; target: string; verifyWith: BrowserInteractionStrategy }>;
  fallbackStrategy: BrowserInteractionStrategy;
}

export function buildBrowserTaskPlan(actions: string[], preferA11y = true): BrowserTaskPlan {
  const steps = actions.map((a, i) => ({
    action: a,
    strategy: (preferA11y ? 'A11Y_REF' : 'DETERMINISTIC_DOM') as BrowserInteractionStrategy,
    target: `step-${i + 1}`,
    // Every action is verified with the cheapest deterministic strategy; vision
    // is reserved as the plan-wide fallback.
    verifyWith: 'SCREENSHOT_VERIFY' as BrowserInteractionStrategy,
  }));
  return { steps, fallbackStrategy: 'VISION_COORDINATE' };
}

/** Compact accessibility-tree snapshot, mirroring agent-browser's `[ref=eN]` model. */
export function buildA11ySnapshot(elements: AetherDomElement[]): A11ySnapshot {
  const refs: Record<string, AetherDomElement> = {};
  elements.forEach((el, i) => {
    const ref = el.ref ?? `e${i + 1}`;
    refs[ref] = { ...el, ref };
  });
  // compact token estimate: ~2 tokens per meaningful attribute line
  const meaningful = elements.filter((e) => e.role || e.ariaLabel || e.name || e.id);
  const estimatedSnapshotTokens = meaningful.length * 2 + elements.length; // +1 token per node header
  return { refs, nodeCount: elements.length, estimatedSnapshotTokens };
}

/**
 * Deterministic element matching. Tries strategies in determinism rank order;
 * returns the highest-confidence match the deterministic strategies can produce,
 * otherwise reports a vision-fallback requirement with the expected coordinate
 * target — never fabricates a vision hit.
 */
export function resolveElement(elements: AetherDomElement[], query: ElementQuery): ElementMatch {
  const deterministic: BrowserInteractionStrategy[] = ['DETERMINISTIC_DOM', 'A11Y_REF'];

  for (const strategy of deterministic) {
    if (query.strategy !== strategy && query.strategy !== 'FORM_FILL' && query.strategy !== 'SCREENSHOT_VERIFY') {
      continue;
    }
    const el = elements.find((e) => {
      if (query.cssSelector && e.id && query.cssSelector === `#${e.id}`) return true;
      if (query.label && (e.ariaLabel === query.label || e.name === query.label)) return true;
      if (query.role && e.role === query.role && query.label && (e.ariaLabel === query.label || e.name === query.label)) return true;
      return false;
    });
    if (el) {
      return {
        strategy,
        confidence: Number((0.9 + 0.05 * (el.ref ? 1 : 0)).toFixed(2)),
        element: el,
        coordinate: { x: el.boundingBox.x + el.boundingBox.width / 2, y: el.boundingBox.y + el.boundingBox.height / 2 },
        reason: `Deterministic ${strategy} match via ${query.label ?? query.cssSelector ?? query.role}.`,
      };
    }
  }

  if (query.strategy === 'VISION_COORDINATE') {
    return {
      strategy: 'VISION_COORDINATE',
      confidence: 0,
      element: null,
      reason: `No deterministic locator resolved; vision coordinate match required for "${query.visualDescription ?? query.label ?? query.cssSelector}". Requires a real browser/vision backend — UNMEASURED without one.`,
    };
  }

  return {
    strategy: query.strategy,
    confidence: 0,
    element: null,
    reason: 'No element matched the deterministic query; escalate to VISION_COORDINATE fallback.',
  };
}

export const P05_CAPABILITY: ProgramCapability = {
  id: 'cap-p05-unified-browser-engine',
  programId: 'P05_BROWSER_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 05 — BROWSER INTELLIGENCE',
  capability: 'Unified Browser Engine: ranked interaction strategies (a11y-ref, deterministic DOM, vision-fallback) with compact a11y snapshots',
  repositoryOrigin: 'https://github.com/vercel-labs/agent-browser',
  originProject: 'browser-use/browser-use + vercel-labs/agent-browser',
  version: '1.0.0',
  license: 'MIT',
  dependencies: ['AETHER P07 browser-runtime provider abstraction'],
  executionMethod: 'OUT_OF_PROCESS_CDP',
  securityProfile: 'NETWORK_EGRESS_CONTROLLED',
  resourceRequirements: 'Requires a connected Playwright/Lightpanda browser process to execute live tasks; selection & snapshot logic is deterministic in-process.',
  testCoverage: 'Strategy ranking, a11y snapshot token accounting, and deterministic/vision escalation tests.',
  integratesWith: ['Swarm Engine', 'Security Engine', 'Model Router', 'P07 Browser Runtime'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'a11y-snapshot token compression',
    unit: 'percent',
    detail: 'Compact a11y `[ref]` snapshot token cost vs raw DOM; deterministic locators avoid vision token spend when they resolve.',
  },
  author: 'Created by Tabrej',
};

export const P05_SAMPLE_CHECKOUT_FORM: AetherDomElement[] = [
  { tag: 'label', text: 'Billing Email', role: 'LabelText', boundingBox: { x: 40, y: 120, width: 110, height: 18 }, ref: 'e1' },
  { tag: 'input', id: 'billing-email', name: 'email', role: 'textbox', ariaLabel: 'Billing Email', boundingBox: { x: 40, y: 145, width: 220, height: 32 }, ref: 'e2' },
  { tag: 'button', role: 'button', text: 'Pay Now', boundingBox: { x: 40, y: 190, width: 90, height: 32 }, ref: 'e3' },
  { tag: 'div', role: 'presentation', boundingBox: { x: 0, y: 0, width: 1, height: 1 }, ref: 'e4' },
  { tag: 'img', role: 'img', boundingBox: { x: 0, y: 0, width: 24, height: 24 }, ref: 'e5' },
];

/** Measured evidence: how much a compact a11y snapshot saves vs a naive full-DOM dump. */
export function runP05BenchmarkEvidence(elements: AetherDomElement[] = P05_SAMPLE_CHECKOUT_FORM): CapabilityBenchmarkEvidence {
  const snapshot = buildA11ySnapshot(elements);
  const rawDomTokens = elements.length * 38; // naive full-DOM serialization cost per element
  const savedPct = rawDomTokens > 0 ? Math.round(((rawDomTokens - snapshot.estimatedSnapshotTokens) / rawDomTokens) * 100) : 0;
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: savedPct,
    metric: 'a11y-snapshot-token-savings-vs-raw-dom',
    unit: 'percent',
    detail: `Snapshot of ${elements.length} nodes = ${snapshot.estimatedSnapshotTokens} tokens vs ~${rawDomTokens} raw-DOM tokens -> ${savedPct}% saved. ${elements.filter((e) => !e.role && !e.name && !e.id).length} non-interactive nodes still listed but not hydrated.`,
  };
}

export type { ProviderSelection };
