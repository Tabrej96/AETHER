/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P18 · HUMAN-CENTERED WORKFLOW INTELLIGENCE
 * (src/core/programs/p18HumanWorkflow.ts) · Created by Tabrej
 *
 * Directive capability #6: a workflow that is logically correct can still
 * fail its humans. P18 audits a workflow design against the five human
 * factors — approval fatigue, information gap at the decision point,
 * approval theater, feedback lag, irreversibility, visibility — so the
 * defect is named BEFORE the workflow ships, not discovered as "nobody
 * approves anything anymore." It audits P17's pattern outputs as well as
 * free-form touchpoint designs; it adds no second state engine.
 */

import { auditWorkflow, requesterNeverInformed, owedFactors, type WorkflowDesign, type Touchpoint, type HumanFactorFinding, type WorkflowAudit } from '../workflow/human';
import type { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export { auditWorkflow, requesterNeverInformed, owedFactors };
export type { WorkflowDesign, Touchpoint, HumanFactorFinding, WorkflowAudit };

export const P18_CAPABILITY: ProgramCapability = {
  id: 'cap-p18-human-centered-workflow-intelligence',
  programId: 'P18_HUMAN_CENTERED_WORKFLOW_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 18 — HUMAN-CENTERED WORKFLOW INTELLIGENCE (SUPREME EVOLUTION capability #6)',
  capability:
    'Audits a workflow design against the five human factors, deterministically: APPROVAL_FATIGUE (sequential sign-offs vs urgency — a HIGH-urgency task with >2 hops is fatigue by design, with the collapse-to-parallel fix named), INFORMATION_GAP (a DECIDE missing the information it needs — the missing items are listed), APPROVAL_THEATER (the same role asked to decide more than once without new information — the repeated sign-off is a rubber stamp, not a control), FEEDBACK_LAG (a decision with no SLA, or an outcome no affected role can see — VISIBILITY_GAP), and IRREVERSIBILITY (a final, non-undoable EXECUTE on a non-low-urgency flow — a human checkpoint or a compensating action is owed). Every finding carries the design change that removes it. owedFactors() says what a posture owes (a FINANCIAL/HARDENED workflow owes reversibility + visibility + SLA; a casual flow may relax fatigue but never money reversibility). Composes P17 pattern outputs; builds no second state engine.',
  repositoryOrigin: 'operator SUPREME EVOLUTION directive (first-party; no external repository)',
  originProject: 'AETHER SUPREME EVOLUTION — Human-Centered Workflow Intelligence (capability #6)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'pure TS, fully deterministic; the audit is a structural pass over the touchpoint design. Two runs over the same design are byte-identical (tested).',
  testCoverage: 'a well-designed workflow is human-fit; six sequential sign-offs on a HIGH-urgency task is a named fatigue defect; a decision without its information is a named gap; a repeated DECIDE by the same role is theater (reported once, on the duplicate); a final non-undoable EXECUTE is a HIGH irreversibility finding; an SLA-less decision is a feedback-lag finding; a workflow that never tells its requester is incomplete by design; posture-owed factors (FINANCIAL owes reversibility + visibility); determinism across runs.',
  integratesWith: ['P17 workflow patterns (the states audited against humans)', 'P12 security posture (what a posture owes, §10)', 'P14 panel (the §10 reviewers now have a human-factor axis to check)'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'workflow-verdicts',
    unit: 'human-factor-findings',
    detail: 'A six-hop HIGH-urgency workflow yields a humanFit=false verdict with the named HIGH findings (fatigue, irreversibility, feedback lag, theater); a two-hop MEDIUM workflow with full information + SLA + visibility yields humanFit=true. Two runs over the same design are byte-identical.',
  },
  author: 'Created by Tabrej',
};

export function runP18BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  // a good workflow: human-fit
  const good: WorkflowDesign = {
    id: 'bench-good',
    sequentialApprovals: 2,
    urgency: 'MEDIUM',
    involvedRoles: ['requester', 'manager', 'finance'],
    touchpoints: [
      { id: 't1', role: 'manager', action: 'DECIDE', infoAvailable: ['amount', 'policy'], infoNeeded: ['amount', 'policy'], slaMin: 60, reversible: true, informedRoles: ['requester', 'finance'] },
      { id: 't2', role: 'finance', action: 'INFORM', infoAvailable: ['decision'], infoNeeded: [], slaMin: 30, reversible: true, informedRoles: ['requester'] },
    ],
  };
  // a bad workflow: six hops, no SLA, a final undoable-free EXECUTE, the
  // requester never informed
  const bad: WorkflowDesign = {
    id: 'bench-bad',
    sequentialApprovals: 6,
    urgency: 'HIGH',
    involvedRoles: ['requester'],
    touchpoints: [
      { id: 'a1', role: 'l1', action: 'DECIDE', infoAvailable: [], infoNeeded: ['risk-class'], reversible: false, informedRoles: [] },
      { id: 'a2', role: 'l1', action: 'DECIDE', infoAvailable: ['risk-class'], infoNeeded: ['risk-class'], reversible: false, informedRoles: [] },
      { id: 'x1', role: 'ops', action: 'EXECUTE', infoAvailable: ['ticket'], infoNeeded: ['ticket'], reversible: false, informedRoles: [] },
    ],
  };
  const goodAudit = auditWorkflow(good);
  const badAudit = auditWorkflow(bad);
  const findings = badAudit.findings.length;
  const requesterDark = requesterNeverInformed(bad, 'requester');
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: findings,
    metric: 'workflow-verdicts',
    unit: 'human-factor-findings',
    detail: `good design → humanFit=${goodAudit.humanFit} (${goodAudit.findings.length} finding(s)); bad design → humanFit=${badAudit.humanFit} with ${findings} named finding(s) across factors [${[...new Set(badAudit.findings.map((f) => f.factor))].join(', ')}]; the requester was never informed in the bad design (${requesterDark}), which the audit names as an incomplete-by-design defect.`,
  };
}
