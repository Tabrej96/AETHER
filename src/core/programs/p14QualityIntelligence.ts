/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P14 · INDEPENDENT QUALITY INTELLIGENCE
 * (src/core/programs/p14QualityIntelligence.ts) · Created by Tabrej
 *
 * The program-level capability for directive §10 (autonomous product
 * reviewer) and capability #4 "Independent Quality Intelligence": nine
 * evidence-gated reviewer perspectives that challenge a P12/P13 plan and an
 * artifact before either may be called complete. Reuses the P12/P13 plans as
 * its inputs (composition, not duplication) and adds no second domain model,
 * state machine, or metric engine.
 */

import { runPanel, hasRunnableVerification, type ReviewInput, type PanelVerdict, type ReviewerFinding } from '../review/panel';
import { runBusinessLogic } from './p13BusinessLogicIntelligence';
import { runProjectIntelligence } from './p12ProjectIntelligence';
import type { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export const P14_REVIEWERS = [
  'business-analyst', 'domain-specialist', 'product-strategist', 'financial-logic-reviewer',
  'ux-reviewer', 'backend-architect', 'security-reviewer', 'qa-engineer', 'performance-reviewer',
] as const;

export { runPanel, hasRunnableVerification };
export type { ReviewInput, PanelVerdict, ReviewerFinding };

export const P14_CAPABILITY: ProgramCapability = {
  id: 'cap-p14-independent-quality-intelligence',
  programId: 'P14_INDEPENDENT_QUALITY_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 14 — INDEPENDENT QUALITY INTELLIGENCE (SUPREME EVOLUTION §10: the autonomous product reviewer)',
  capability:
    'Nine evidence-gated reviewer perspectives (business analyst, domain specialist, product strategist, financial-logic reviewer, UX reviewer, backend architect, security reviewer, QA engineer, performance reviewer) challenge a P12 strategy + P13 business-logic plan and the artifact under review before either may be called complete. Every finding carries explicit evidence (no "looks fine"); a claimed-but-unrun test layer is a blocker (§17); money in a binary float, an unscoped tenant write, and a destructive migration without acknowledgment are BLOCKERs; and the §10 named case is enforced — an agent that self-approves its own work is an OBJECTION of record unless the independent panel found zero blockers. Reuses P12/P13 plans as inputs; builds no second domain model, state machine, or metric engine.',
  repositoryOrigin: 'operator SUPREME EVOLUTION directive (first-party; no external repository)',
  originProject: 'AETHER SUPREME EVOLUTION — Universal Business Logic Intelligence, Product Creativity & Self-Evolving Engineering System (capability #4 Independent Quality Intelligence + §10 Autonomous Product Reviewer)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'pure TS, fully deterministic; nine reviewer passes over in-process plans. No external service.',
  testCoverage: 'nine perspectives present; clean plan approves; self-approval of a defective artifact is an objection of record; a self-claim WITH panel evidence is the one allowed case; cross-tenant write BLOCKER; claimed-unrun test layers blocked; float money blocked; performance-claim-without-budget flagged; every finding carries evidence.',
  integratesWith: ['P12 strategy', 'P13 business-logic plan', 'P10 finance verdict', 'Security Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'panel-verdicts',
    unit: 'reviewers-run',
    detail: 'A P12+P13 plan and artifact run through nine reviewer perspectives; the panel returns APPROVE only when no blocking finding stands, and a self-claimed completion is backed by panel evidence, never by the claim itself.',
  },
  author: 'Created by Tabrej',
};

export function runP14BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  // a representative P13 plan (P14 composes it, does not rebuild it)
  const task = 'Build a multi-tenant SaaS billing platform with checkout, subscriptions, and refunds';
  const i: ReviewInput = {
    planId: 'p14-demo',
    strategy: runProjectIntelligence({ task }).strategy,
    business: runBusinessLogic({ task }),
    artifact: { claimedTestLayers: ['UNIT', 'INTEGRATION', 'SECURITY'], ranTestLayers: ['UNIT', 'INTEGRATION', 'SECURITY'] },
  };
  const v = runPanel(i);
  const clean = runPanel({ ...i, planId: 'p14-demo-self', selfClaimedComplete: true });
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: v.findings.length,
    metric: 'panel-verdicts',
    unit: 'reviewers-run',
    detail: `independent panel: ${v.findings.length} findings across ${new Set(v.findings.map((f) => f.reviewer)).size} reviewer perspectives, approved=${v.approved}, blockers=${v.blockers.length}; a self-claimed completion on the same plan → approved=${clean.approved}, panel verdict=${clean.findings.find((f) => f.reviewer === 'independent-panel')?.verdict}.`,
  };
}
