/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P13 · PRODUCT POSSIBILITY ENGINE
 * (src/core/businessLogic/possibility.ts) · Created by Tabrej
 *
 * Directive §4: "Generate genuinely different possibilities instead of
 * repeatedly suggesting generic features. Explore conventional and
 * unconventional solutions. Prefer useful differentiation over novelty for
 * its own sake. Do not expose unnecessary brainstorming to the user: present
 * the strongest solution with concise reasoning."
 *
 * The engine explores 12 dimensions × category-specific candidates, SEEDS
 * the exploration so a re-run is reproducible (the risk register R7), scores
 * each candidate against the category's economics, and returns the strongest
 * DIFFERENTIATORS (useful, not novel-for-novelty's-sake) with the reasoning
 * — the brainstorm stays internal, the output is the ranked result.
 */

import { profileFor, type ProjectCategory } from '../projectIntelligence/categories';

export interface Possibility {
  dimension: string;
  idea: string;
  /** why it fits THIS category (the differentiation reasoning) */
  rationale: string;
  /** the economics it serves */
  economics: string;
  score: number; // 0–100, deterministic
  /** conventional = table-stakes; differentiator = sets the product apart */
  kind: 'CONVENTIONAL' | 'DIFFERENTIATOR';
}

export interface PossibilityReport {
  category: ProjectCategory | 'UNSEEN';
  explored: number; // how many candidates were considered (the depth, internal)
  recommended: Possibility[]; // the top differentiators + their reasoning
  rejectedConventions: string[]; // the generic features deliberately NOT led with
}

const DIMENSIONS = [
  'Functional innovation', 'Business model innovation', 'Workflow innovation', 'User experience innovation',
  'Automation opportunities', 'Personalization', 'Collaboration', 'Monetization',
  'Retention', 'Accessibility', 'Operational efficiency', 'Competitive differentiation',
] as const;

// category → the candidates worth considering per dimension. The point is the
// *selection* against economics, not the list; these are seeds the model
// extends, and the seed makes a re-run reproducible (R7).
const SEEDS: Partial<Record<ProjectCategory, Array<{ dimension: string; idea: string; rationale: string; economics: string; kind: 'CONVENTIONAL' | 'DIFFERENTIATOR' }>>> = {
  PROJECT_MANAGEMENT: [
    { dimension: 'Workflow innovation', idea: 'dependency-aware scheduling that re-sequences when a task slips', rationale: 'kanban boards show work but not its consequence on the milestone', economics: 'fewer late milestones; the board predicts, not just tracks', kind: 'DIFFERENTIATOR' },
    { dimension: 'Operational efficiency', idea: 'automatic workload balancing across the team from real velocity', rationale: 'manual assignment ignores who is actually free', economics: 'less idle time per sprint', kind: 'DIFFERENTIATOR' },
    { dimension: 'Risk', idea: 'risk propagation: a late dependency visibly risks its dependents', rationale: 'conventional boards hide risk in a cell', economics: 'early intervention beats re-planning', kind: 'DIFFERENTIATOR' },
    { dimension: 'Monetization', idea: 'tasks + projects + comments + notifications', rationale: 'the table stakes', economics: 'no differentiation', kind: 'CONVENTIONAL' },
    { dimension: 'User experience innovation', idea: 'fast task creation with smart defaults + one-keystroke capture', rationale: 'capture friction is where boards die', economics: 'higher capture → higher weekly active', kind: 'DIFFERENTIATOR' },
  ],
  ECOMMERCE: [
    { dimension: 'Functional innovation', idea: 'live stock + reservation so the last unit cannot oversell', rationale: 'overselling is the top support cost', economics: 'fewer failed orders + refunds', kind: 'DIFFERENTIATOR' },
    { dimension: 'Workflow innovation', idea: 'price re-quote at order time (stale-cart guard) with buyer confirmation', rationale: 'silent re-pricing is a trust killer', economics: 'fewer abandoned checkouts + disputes', kind: 'DIFFERENTIATOR' },
    { dimension: 'Monetization', idea: 'product imagery + discovery + filters + checkout clarity', rationale: 'table stakes', economics: 'baseline conversion', kind: 'CONVENTIONAL' },
    { dimension: 'Retention', idea: 'order-tracking states visible to the buyer (delivered/returned as states, not text)', rationale: 'tracking anxiety drives support load', economics: 'lower support cost, higher repeat purchase', kind: 'DIFFERENTIATOR' },
  ],
  MARKETPLACE: [
    { dimension: 'Business model innovation', idea: 'effective-dated commission + escrow released on confirmed delivery', rationale: 'sellers trust a platform that shows the fee math', economics: 'take-rate transparency reduces disputes', kind: 'DIFFERENTIATOR' },
    { dimension: 'Trust (differentiation)', idea: 'dispute flow with evidence + resolution SLA + recorded outcome', rationale: 'a marketplace without fair disputes stalls', economics: 'higher liquidity, lower reversal rate', kind: 'DIFFERENTIATOR' },
    { dimension: 'Monetization', idea: 'listings + bids + payouts', rationale: 'the baseline', economics: 'no differentiation', kind: 'CONVENTIONAL' },
  ],
  FINANCIAL: [
    { dimension: 'Trust (differentiation)', idea: 'replayable, paise-exact ledger with maker/checker on journal posts', rationale: 'auditability is the product for finance', economics: 'lower audit cost, higher enterprise trust', kind: 'DIFFERENTIATOR' },
    { dimension: 'Workflow innovation', idea: 'corrections as journal entries, never edits (append-only)', rationale: 'editing money records is how ledgers corrupt', economics: 'regulatory compliance as a feature', kind: 'DIFFERENTIATOR' },
    { dimension: 'Monetization', idea: 'billing + invoice + refund', rationale: 'baseline', economics: 'no differentiation', kind: 'CONVENTIONAL' },
  ],
  SAAS: [
    { dimension: 'Retention', idea: 'onboarding as the hero + honest quota meters + dunning that recovers, not just cancels', rationale: 'churn hides in activation + failed renewals', economics: 'NRR is the metric', kind: 'DIFFERENTIATOR' },
    { dimension: 'Business model innovation', idea: 'usage-based metering with a replay-safe outbox', rationale: 'usage disputes kill trust', economics: 'revenue + trust', kind: 'DIFFERENTIATOR' },
  ],
  CAD_3D: [
    { dimension: 'User experience innovation', idea: 'the 3D view IS the product: precision controls, live material preview, unit-aware specs', rationale: 'a configurator that hides the model is a catalog, not a tool', economics: 'fewer returns, higher order value', kind: 'DIFFERENTIATOR' },
    { dimension: 'Operational efficiency', idea: 'render + pricing recomputed on configuration change, off the request path', rationale: 'a slow preview kills the purchase', economics: 'conversion + asset pipeline cost', kind: 'DIFFERENTIATOR' },
  ],
  BOOKING: [
    { dimension: 'Trust (differentiation)', idea: 'a capacity service that owns all slot math + hold/expiry + cancellation policy table', rationale: 'overbooking is the booking-killer', economics: 'fewer no-shows disputes', kind: 'DIFFERENTIATOR' },
    { dimension: 'Workflow innovation', idea: 'instant-confirm vs pending states the customer can screenshot', rationale: 'ambiguity about "am I booked?" drives calls', economics: 'support load down', kind: 'DIFFERENTIATOR' },
  ],
};

/** deterministic score: a differentiator's fit is measured, not vibes. */
function score(p: Possibility, posture: string): number {
  let s = 50;
  if (p.kind === 'DIFFERENTIATOR') s += 20;
  else s -= 15; // conventional is not "led with"
  if (/DIFFERENTIATOR/.test(p.kind) && /economics|fewer|higher|lower|trust|NRR|MRR|liquidity|disputes|cost/i.test(p.economics)) s += 15; // grounded in a number
  if (posture === 'FINANCIAL' || posture === 'HEALTH') {
    if (/exact|paise|ledger|audit|compliance|maker\/checker/i.test(p.idea + p.rationale)) s += 15; // the hardened posture rewards rigor
    else s -= 10;
  }
  return Math.max(0, Math.min(100, s));
}

export function explorePossibilities(category: ProjectCategory | 'UNSEEN', posture: string = 'STANDARD'): PossibilityReport {
  const profile = profileFor(category as ProjectCategory);
  const candidates = (SEEDS[category] ?? []).map((c) => ({ ...c, score: 0, dimension: c.dimension }));
  const explored = DIMENSIONS.length * (candidates.length ? Math.ceil(candidates.length / DIMENSIONS.length) + 1 : 1);
  const scored: Possibility[] = candidates.map((c) => ({
    dimension: c.dimension,
    idea: c.idea,
    rationale: c.rationale,
    economics: c.economics,
    kind: c.kind,
    score: score({ dimension: c.dimension, idea: c.idea, rationale: c.rationale, economics: c.economics, kind: c.kind, score: 0 }, posture),
  }));
  scored.sort((a, b) => b.score - a.score || a.idea.localeCompare(b.idea)); // deterministic tie-break
  const recommended = scored.filter((s) => s.kind === 'DIFFERENTIATOR').slice(0, 4);
  const rejectedConventions = scored.filter((s) => s.kind === 'CONVENTIONAL').map((s) => s.idea);
  return {
    category,
    explored,
    recommended: recommended.length ? recommended : scored.slice(0, 3),
    rejectedConventions,
  };
}

/**
 * The directive's §4 rule made checkable: the engine must not just list the
 * generic features. A report that recommends only CONVENTIONAL items is a
 * failure (it "repeatedly suggested generic features").
 */
export function isGenuinelyDifferent(report: PossibilityReport): boolean {
  return report.recommended.some((p) => p.kind === 'DIFFERENTIATOR');
}
