/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P19 · DESIGN-TASTE LAYER
 * (src/core/programs/p19DesignTaste.ts) · Created by Tabrej
 *
 * Roadmap P-S2 (directive Phases 4–5): product-type design languages
 * (enterprise density / media imagery / dev-tool monospace / e-commerce
 * photography / booking clarity …) + a template-slop detector (random
 * gradients, card-everything, fake data, dead CTAs, lorem). Extends
 * designGate.ts (the "is it clean?" bar) — P19 adds "is it the RIGHT
 * KIND of design for this product, and not AI template slop?"
 */

import { detectTemplateSlop, scoreDesignFit, SLOP_RULES_EXPORT, type DesignFit, type SlopSignal } from '../design/designTaste';
import { profileFor } from '../projectIntelligence/categories';
import type { ProjectCategory } from '../projectIntelligence/categories';
import type { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export { detectTemplateSlop, scoreDesignFit, SLOP_RULES_EXPORT, profileFor };
export type { DesignFit, SlopSignal, ProjectCategory };

export const P19_CAPABILITY: ProgramCapability = {
  id: 'cap-p19-design-taste-layer',
  programId: 'P19_DESIGN_TASTE_LAYER' as ProgramId,
  programName: 'PROGRAM 19 — DESIGN-TASTE LAYER (SUPREME EVOLUTION Phases 4–5 / roadmap P-S2)',
  capability:
    'Product-type design languages + a template-slop detector, as a deterministic 0–100 scorecard on top of designGate.ts (which it EXTENDS, never replaces — the gate answers "clean?", P19 answers "right KIND + not slop?"). Each P12 category OWES a named set of measurable expectations: FINANCIAL/ERP/CRM/SAAS owe data density, tabular numerals and status semantics (not a hero gradient); MEDIA/GAME owe a dark canvas, imagery and keyboard affordances; DEVTOOLS owe monospace + code surfaces; ECOMMERCE/MARKETPLACE owe product imagery, price display, discovery controls and checkout clarity; BOOKING/TRAVEL/REAL-ESTATE/JOBS owe calendar + timezone honesty + a screenshot-able confirmation; a first-principles set applies to unseen products. The slop detector fires on the recognizable AI tells — aurora/conic gradient blobs, the indigo+pink default, glassmorphism everywhere, card-for-everything, fake big stats, lorem, placeholder identities, empty/dead CTAs, cliché hero copy, stock placeholders — each with its offending snippet. The roadmap acceptance test is enforced in the suite: a deliberately-generic artifact scores BELOW a category-appropriate one, and the delta is readable off the scorecard (named unmet expectations + named slop signals).',
  repositoryOrigin: 'operator SUPREME EVOLUTION directive (first-party; no external repository)',
  originProject: 'AETHER SUPREME EVOLUTION — design-taste layer (Phases 4–5; roadmap P-S2), extending the existing designGate.ts',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'pure TS, fully deterministic; regex + scorecard over in-process HTML. No clock, no network, no randomness. Two runs over the same input are byte-identical (tested).',
  testCoverage: 'the slop detector fires on a seeded template and names every tell (aurora gradient, indigo+pink, card-everything, fake stats, lorem, placeholder identities, stock images); a clean artifact carries zero signals; the roadmap acceptance test (a generic artifact scores below a category-appropriate one, with the delta named); FINANCIAL owes density + status semantics; the design language string composes the P12 profile (first-principles for unseen); a dev-tool page owes monospace + code surfaces; determinism across runs.',
  integratesWith: ['designGate.ts (the clean bar P19 extends)', 'P12 category profiles (the owed design languages)', 'P14 panel (the UX reviewer now has a taste + slop axis)'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'design-fit-verdicts',
    unit: 'scorecard-deltas',
    detail: 'A seeded AI-slop artifact (aurora gradient + indigo/pink + card-everything + fake stats + lorem + dead CTA) scores well below a category-appropriate FINANCIAL ledger view, and the delta is readable off the scorecard: the generic one lists its unmet expectations + its slop signals by name, the fitting one lists neither. Two runs over the same input are byte-identical.',
  },
  author: 'Created by Tabrej',
};

export function runP19BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  // a deliberately-generic artifact (slop) vs a FINANCIAL ledger view
  const sloppy = `<html lang="en"><head><meta name="viewport" content="width=device-width"></head><body style="background:#0f0f14;color:#fff"><section class="card rounded-2xl" style="background:conic-gradient(from 180deg,#6366f1,#ec4899,#4f46e5,#6366f1)"><h1>The Future of Everything</h1><p>Empower and unleash. 10,000+ users. 99.9% uptime.</p><a href="#">Learn More</a></section><section class="card rounded-2xl"><p>Lorem ipsum</p><button></button></section><section class="card rounded-2xl"><p>John Doe — Acme Inc</p></section><section class="card rounded-2xl"><img src="https://picsum.photos/200"></section></body></html>`;
  const fitting = `<html lang="en"><head><meta name="viewport" content="width=device-width"><style>:root{--ink:#111;--ok:#1f7a4d;--warn:#c98a2b;--err:#b3261e}body{font-size:14px;font-variant-numeric:tabular-nums}table{border-collapse:collapse}</style></head><body><header><h1>Reconciliation — FY26</h1></header><main><table aria-label="reconciliation ledger"><thead><tr><th>Ref</th><th>Status</th></tr></thead><tbody><tr><td>R-1041</td><td class="status success">settled</td></tr><tr><td>R-1042</td><td class="status warn">pending</td></tr></tbody></table></main></body></html>`;
  const generic = scoreDesignFit(sloppy, 'FINANCIAL');
  const fit = scoreDesignFit(fitting, 'FINANCIAL');
  const slopCount = generic.slop.signals.length;
  const unmetCount = generic.expectations.filter((e) => !e.met).length;
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: fit.score - generic.score,
    metric: 'design-fit-verdicts',
    unit: 'scorecard-deltas',
    detail: `roadmap P-S2 acceptance: a deliberately-generic FINANCIAL artifact scores ${generic.score} (with ${slopCount} named slop signals + ${unmetCount} unmet expectations), a category-appropriate one scores ${fit.score}; the nameable delta is ${fit.score - generic.score} points, every point attributable to a named expectation or slop tell. designGate.ts is untouched — P19 extends it, never replaces it.`,
  };
}

export function slopRulesCount(): number {
  return SLOP_RULES_EXPORT.length;
}
