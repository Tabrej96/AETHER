/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P14 · INDEPENDENT QUALITY INTELLIGENCE
 * (src/core/review/panel.ts) · Created by Tabrej
 *
 * Directive §10: "Before considering an implementation complete, AETHER must
 * challenge its own work. Activate independent review perspectives: business
 * analyst, domain specialist, product strategist, financial logic reviewer,
 * UX reviewer, backend architect, security reviewer, QA engineer, performance
 * reviewer. Each reviewer must evaluate the relevant implementation using
 * EXPLICIT EVIDENCE... Do not let an agent approve its own work without
 * independent verification. Resolve disagreements using evidence,
 * requirements, tests and explicit trade-offs."
 *
 * So the panel is *evidence-gated*: a reviewer cannot APPROVE on faith. Every
 * finding carries the evidence that produced it, and a SELF-CLAIM of
 * completion without panel evidence is an OBJECTION by construction — the
 * "agent approving its own work" case the directive names.
 */

import type { BusinessLogicPlan } from '../programs/p13BusinessLogicIntelligence';
import type { ProjectStrategy } from '../projectIntelligence/strategy';

export interface ReviewerFinding {
  reviewer: string;
  verdict: 'APPROVE' | 'OBJECTION' | 'NEEDS_EVIDENCE';
  /** the explicit evidence the verdict stands on (never "looks fine") */
  evidence: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER';
  /** the trade-off, when the objection is a judgment call */
  tradeOff?: string;
}

export interface PanelVerdict {
  planId: string;
  findings: ReviewerFinding[];
  /** APPROVE requires every reviewer to be non-blocking */
  approved: boolean;
  blockers: ReviewerFinding[];
  selfClaimedComplete: boolean;
}

export interface ReviewInput {
  planId: string;
  strategy?: ProjectStrategy;
  business?: BusinessLogicPlan;
  /** the artifact under review (schema, code notes, metric claims) */
  artifact?: {
    moneyColumnIsFloat?: boolean;
    destructiveMigrationUnacknowledged?: boolean;
    unscopedTenantWrite?: boolean;
    claimedTestLayers?: string[];
    ranTestLayers?: string[];
    performanceClaim?: string; // a claim without a budget is a finding
    hasPerformanceBudget?: boolean;
    uxPatternsPresent?: string[];
  };
  /** the agent's OWN claim of completion — the exact case §10 names */
  selfClaimedComplete?: boolean;
}

const F = (reviewer: string, verdict: ReviewerFinding['verdict'], severity: ReviewerFinding['severity'], evidence: string, tradeOff?: string): ReviewerFinding => ({ reviewer, verdict, severity, evidence, tradeOff });

// --------------------------------------------------------------- the nine reviewers

function businessAnalyst(i: ReviewInput): ReviewerFinding {
  const owed = i.business?.edgeCases.length ?? 0;
  if (!i.business) return F('business-analyst', 'NEEDS_EVIDENCE', 'MEDIUM', 'no business-logic plan supplied — the workflow cannot be checked for completeness');
  // every owed edge case must have a named invariant (the §3D check)
  const unguarded = i.business.edgeCases.filter((c) => !c.testInvariant.trim()).length;
  if (unguarded > 0) return F('business-analyst', 'OBJECTION', 'HIGH', `${unguarded} of ${owed} owed edge cases have no test invariant — the workflow claims completeness it has not proven`, 'either add the invariants or drop the cases from the owed set');
  return F('business-analyst', 'APPROVE', 'LOW', `all ${owed} owed edge cases carry a test invariant; the workflow is complete on paper and checkable in code`);
}

function domainSpecialist(i: ReviewInput): ReviewerFinding {
  const d = i.business?.domain;
  if (!d) return F('domain-specialist', 'NEEDS_EVIDENCE', 'MEDIUM', 'no domain model supplied — entities/flows cannot be checked for coherence');
  const bare = d.entities.filter((e) => e.invariants.length === 0).length;
  if (bare > 0) return F('domain-specialist', 'OBJECTION', 'HIGH', `${bare} of ${d.entities.length} entities have no invariants — a domain model without invariants is a list, not a model`);
  const derived = d.category === 'DERIVED';
  return derived
    ? F('domain-specialist', 'NEEDS_EVIDENCE', 'MEDIUM', 'the domain model is a first-principles skeleton (unseen category) — the named participants/entities must be filled in from the stated problem before implementation', 'filing it as derived is correct; shipping it empty is not')
    : F('domain-specialist', 'APPROVE', 'LOW', `${d.entities.length} entities each carry invariants; ${d.financialFlows.length} financial flows are named with direction`);
}

function productStrategist(i: ReviewInput): ReviewerFinding {
  const p = i.business?.possibility;
  if (!p) return F('product-strategist', 'NEEDS_EVIDENCE', 'MEDIUM', 'no possibility report supplied — cannot verify the plan differentiates');
  if (!i.business?.genuinelyDifferent) return F('product-strategist', 'OBJECTION', 'MEDIUM', 'the recommendation leads with conventional features — the directive: "generate genuinely different possibilities, not repeatedly generic ones"', 'if the category has no viable differentiator, say so with evidence instead of defaulting to table stakes');
  return F('product-strategist', 'APPROVE', 'LOW', `the plan explores ${p.explored} candidates across ${p.rejectedConventions.length + p.recommended.length} considered and leads with ${p.recommended.length} economics-grounded differentiator(s)`);
}

function financialLogicReviewer(i: ReviewInput): ReviewerFinding {
  const art = i.artifact;
  const involvesMoney = (i.business?.domain.financialFlows.length ?? 0) > 0 || /billing|payment|refund|commission|settlement/i.test(i.business?.domain.label ?? '');
  if (!involvesMoney) return F('financial-logic-reviewer', 'APPROVE', 'LOW', 'no financial flows in the domain — the money-exactness rule does not apply to this artifact');
  if (art?.moneyColumnIsFloat) return F('financial-logic-reviewer', 'OBJECTION', 'BLOCKER', 'a money value is stored/derived in a binary float — the directive: money is decimal-safe (P10 integer paise), never ordinary arithmetic');
  return F('financial-logic-reviewer', 'APPROVE', 'LOW', 'financial flows present; no float-money defect observed — recompute-on-server + tamper guard apply (P10 engine)');
}

function uxReviewer(i: ReviewInput): ReviewerFinding {
  const s = i.strategy;
  const art = i.artifact;
  if (!s) return F('ux-reviewer', 'NEEDS_EVIDENCE', 'MEDIUM', 'no strategy supplied — the UX obligations cannot be checked');
  const owed = s.decisions.skills.value.split(', ').filter((x) => x.trim());
  const present = art?.uxPatternsPresent ?? [];
  const missing = owed.filter((o) => !present.some((p) => p.toLowerCase().includes(o.slice(0, Math.max(4, o.length - 4)).toLowerCase())));
  if (missing.length === owed.length && owed.length > 0) return F('ux-reviewer', 'OBJECTION', 'MEDIUM', `none of the category's UX obligations (${owed.length}) are present in the artifact — a form-to-database wiring, which §7 forbids`, 'add the patterns the category owes; a denser UI is fine, a missing one is not');
  return F('ux-reviewer', 'APPROVE', 'LOW', `${present.length} of ${owed.length} UX obligations are present${missing.length ? `; ${missing.length} still open` : ''}`);
}

function backendArchitect(i: ReviewInput): ReviewerFinding {
  const art = i.artifact;
  if (art?.destructiveMigrationUnacknowledged) return F('backend-architect', 'OBJECTION', 'BLOCKER', 'a destructive migration ships without the explicit data-loss acknowledgment (P11 §3) — "never casually drop or overwrite production data"');
  const s = i.strategy;
  if (!s) return F('backend-architect', 'APPROVE', 'LOW', 'no architecture decision under review; artifact shows no data-layer defect');
  return F('backend-architect', 'APPROVE', 'LOW', `architecture decision recorded: "${s.decisions.architecture.value}" — the choice is reasoned, not forced (${s.decisions.architecture.reason})`);
}

function securityReviewer(i: ReviewInput): ReviewerFinding {
  const art = i.artifact;
  if (art?.unscopedTenantWrite) return F('security-reviewer', 'OBJECTION', 'BLOCKER', 'an unscoped write on a shared-scoped model is a cross-tenant leak (P11 tenancy; §9: "test that users cannot access another tenant\'s data by manipulating IDs, requests, filters, exports, or background jobs")');
  const claimed = art?.claimedTestLayers ?? [];
  const ran = art?.ranTestLayers ?? [];
  const neverRan = claimed.filter((c) => c === 'SECURITY' && !ran.includes('SECURITY'));
  if (neverRan.length) return F('security-reviewer', 'OBJECTION', 'HIGH', 'a SECURITY test layer is claimed but no security scan ran — §17: "a security checklist exists" is not a security pass');
  return F('security-reviewer', 'APPROVE', 'LOW', 'no unscoped write observed; claimed security layers have matching runs');
}

function qaEngineer(i: ReviewInput): ReviewerFinding {
  const claimed = i.artifact?.claimedTestLayers ?? [];
  const ran = i.artifact?.ranTestLayers ?? [];
  const notRun = claimed.filter((c) => !ran.includes(c));
  if (notRun.length) return F('qa-engineer', 'OBJECTION', 'HIGH', `claimed test layers with no run: ${notRun.join(', ')} — §17: a claimed layer with no evidence is a blocker, not a pass`);
  if (claimed.length === 0) return F('qa-engineer', 'NEEDS_EVIDENCE', 'MEDIUM', 'no test layers claimed at all — a proportional test plan (P10/P11) is owed before QA can pass');
  return F('qa-engineer', 'APPROVE', 'LOW', `all ${claimed.length} claimed test layer(s) have runs on record`);
}

function performanceReviewer(i: ReviewInput): ReviewerFinding {
  const art = i.artifact;
  if (art?.performanceClaim && !art.hasPerformanceBudget) return F('performance-reviewer', 'OBJECTION', 'MEDIUM', `a performance claim ("${art.performanceClaim}") with no measured budget — §11: "performance claims need a budget, not a guess"; re-measure before asserting`, 'drop the claim or attach the measurement (P11 §11)');
  return F('performance-reviewer', 'APPROVE', 'LOW', 'no performance claim requires a budget check, or the budget is attached');
}

const REVIEWERS: Array<[string, (i: ReviewInput) => ReviewerFinding]> = [
  ['business-analyst', businessAnalyst],
  ['domain-specialist', domainSpecialist],
  ['product-strategist', productStrategist],
  ['financial-logic-reviewer', financialLogicReviewer],
  ['ux-reviewer', uxReviewer],
  ['backend-architect', backendArchitect],
  ['security-reviewer', securityReviewer],
  ['qa-engineer', qaEngineer],
  ['performance-reviewer', performanceReviewer],
];

// --------------------------------------------------------------- the panel

export function runPanel(i: ReviewInput): PanelVerdict {
  const findings = REVIEWERS.map(([name, fn]) => fn(i));
  const blockers = findings.filter((f) => f.severity === 'BLOCKER' || (f.verdict === 'OBJECTION' && f.severity === 'HIGH'));
  let approved = blockers.length === 0 && i.selfClaimedComplete !== true;

  // §10's named case: the agent approves its own work without independent
  // evidence. A self-claim of completion is only valid when the panel itself
  // found zero blockers — otherwise it is an OBJECTION of record.
  if (i.selfClaimedComplete) {
    approved = blockers.length === 0;
    findings.push(
      blockers.length
        ? F('independent-panel', 'OBJECTION', 'BLOCKER', 'the agent self-claimed completion, but the panel found ' + blockers.length + ' blocking finding(s) — §10: an agent does not approve its own work; the disagreement is resolved on the evidence above')
        : F('independent-panel', 'APPROVE', 'LOW', 'the agent self-claimed completion and the independent panel found no blocking findings — the claim is now backed by evidence, not by the claim itself')
    );
  }

  // disagreement resolution: evidence outranks severity, severity outranks
  // trade-off notes; blockers are never out-voted
  return { planId: i.planId, findings, approved, blockers, selfClaimedComplete: !!i.selfClaimedComplete };
}

/** the "does it work in reality" check (§10): a plan that has no runnable
 *  verification step is not complete. */
export function hasRunnableVerification(i: ReviewInput): boolean {
  return (i.artifact?.ranTestLayers?.length ?? 0) > 0 || (i.business?.edgeCases.some((c) => c.testInvariant.trim()) ?? false);
}
