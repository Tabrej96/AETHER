/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P18 · HUMAN-CENTERED WORKFLOW INTELLIGENCE
 * (src/core/workflow/human.ts) · Created by Tabrej
 *
 * Directive capability #6: a workflow that is logically correct can still be
 * a human disaster — an approver with seven sequential sign-offs on an
 * urgent task, a decision point with no information, a final action with no
 * undo, a requester who hears nothing for days. This engine audits a
 * workflow against the five human factors, deterministically, so the defect
 * is named BEFORE the workflow ships — not discovered as "nobody approves
 * anything anymore."
 */

import type { ApprovalPolicy } from './patterns';

export interface Touchpoint {
  id: string;
  /** the human role at this point */
  role: string;
  /** what they are asked to do */
  action: 'DECIDE' | 'INFORM' | 'EXECUTE' | 'REVIEW';
  /** what information is available at the point of action */
  infoAvailable: string[];
  /** the information needed to make a sound decision */
  infoNeeded: string[];
  /** minutes from the trigger to this touchpoint's SLA */
  slaMin?: number;
  /** is this action reversible? */
  reversible: boolean;
  /** who is told the outcome */
  informedRoles: string[];
  /** urgency of the workflow this touchpoint belongs to */
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface WorkflowDesign {
  id: string;
  touchpoints: Touchpoint[];
  /** sequential approvals required (the fatigue axis) */
  sequentialApprovals: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  /** the roles the workflow serves */
  involvedRoles: string[];
}

export interface HumanFactorFinding {
  factor: 'APPROVAL_FATIGUE' | 'INFORMATION_GAP' | 'FEEDBACK_LAG' | 'IRREVERSIBILITY' | 'VISIBILITY_GAP' | 'APPROVAL_THEATER';
  touchpointId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKER';
  detail: string;
  /** the design change that removes the defect */
  fix: string;
}

export interface WorkflowAudit {
  workflow: string;
  findings: HumanFactorFinding[];
  /** a workflow is human-fit when it has no HIGH/BLOCKER findings */
  humanFit: boolean;
  approvalChainLength: number;
}

/**
 * The five-factor audit. Each check is structural + deterministic:
 *  APPROVAL_FATIGUE   — sequential approvals vs urgency (a HIGH-urgency task
 *                       with >2 sequential sign-offs is fatigue by design)
 *  INFORMATION_GAP    — the decision point is missing information it needs
 *  APPROVAL_THEATER   — a DECIDE touchpoint that also only INFORMs: it
 *                       demands a signature without giving a real decision
 *  FEEDBACK_LAG       — the requester's role is not told the outcome, or the
 *                       SLA is unbounded
 *  IRREVERSIBILITY    — a DECIDE/EXECUTE action that is final with no undo
 *                       on a workflow a human initiated
 *  VISIBILITY_GAP     — a role the workflow changes can never see the state
 */
export function auditWorkflow(w: WorkflowDesign): WorkflowAudit {
  const findings: HumanFactorFinding[] = [];

  // 1. approval fatigue: the chain must fit the urgency
  if (w.urgency === 'HIGH' && w.sequentialApprovals > 2) {
    findings.push({
      factor: 'APPROVAL_FATIGUE',
      touchpointId: w.touchpoints[0]?.id ?? w.id,
      severity: 'HIGH',
      detail: `${w.sequentialApprovals} sequential sign-offs on a HIGH-urgency task — the task will wait for people, not the reverse`,
      fix: 'collapse to ≤2: one approver + an escalation path (parallel, not sequential)',
    });
  } else if (w.sequentialApprovals > 4) {
    findings.push({
      factor: 'APPROVAL_FATIGUE',
      touchpointId: w.touchpoints[0]?.id ?? w.id,
      severity: 'MEDIUM',
      detail: `${w.sequentialApprovals} sequential sign-offs on any task lengthens the queue every hop adds`,
      fix: 'remove redundant hops; each approver must add a distinct control (amount, risk, policy)',
    });
  }

  for (const t of w.touchpoints) {
    // 2. information gap at a decision point
    if (t.action === 'DECIDE') {
      const missing = t.infoNeeded.filter((n) => !t.infoAvailable.includes(n));
      if (missing.length) {
        findings.push({
          factor: 'INFORMATION_GAP',
          touchpointId: t.id,
          severity: 'MEDIUM',
          detail: `role '${t.role}' is asked to decide without: ${missing.join(', ')}`,
          fix: `surface ${missing.join(', ')} at the decision point (or split the decision)`,
        });
      }
      // 3. approval theater: the same role is asked to DECIDE more than
      // once in the same workflow — the repeated sign-off has no new
      // information, so it is a rubber stamp, not a control. (Reported
      // once, on the DUPLICATE touchpoint, not on the original.)
      const earlierDecides = w.touchpoints.filter((o) => o.action === 'DECIDE' && o.role === t.role && w.touchpoints.indexOf(o) < w.touchpoints.indexOf(t)).length;
      if (earlierDecides > 0) {
        findings.push({
          factor: 'APPROVAL_THEATER',
          touchpointId: t.id,
          severity: 'MEDIUM',
          detail: `role '${t.role}' is asked to decide more than once in the same workflow — repeated sign-offs without new information become rubber stamps`,
          fix: 'fold the repeated DECIDE into one; keep the others as INFORM',
        });
      }
    }

    // 4. feedback lag: the roles whose world changed must be told
    if (t.action === 'DECIDE' || t.action === 'EXECUTE') {
      const affected = w.involvedRoles.filter((r) => !t.informedRoles.includes(r));
      if (affected.length && t.action === 'DECIDE') {
        findings.push({
          factor: 'VISIBILITY_GAP',
          touchpointId: t.id,
          severity: 'LOW',
          detail: `outcomes of '${t.id}' are not shown to: ${affected.join(', ')}`,
          fix: 'add the affected roles to the informed set (a state view, not a message)',
        });
      }
    }
    if (t.action === 'DECIDE' && t.slaMin == null) {
      findings.push({
        factor: 'FEEDBACK_LAG',
        touchpointId: t.id,
        severity: 'MEDIUM',
        detail: `the decision '${t.id}' has no SLA — the requester cannot know when it will move`,
        fix: 'name the decision SLA; if it is genuinely open-ended, say so to the requester',
      });
    }

    // 5. irreversibility without a human checkpoint
    if (t.action === 'EXECUTE' && !t.reversible && w.urgency !== 'LOW') {
      findings.push({
        factor: 'IRREVERSIBILITY',
        touchpointId: t.id,
        severity: 'HIGH',
        detail: `'${t.id}' is a final, non-reversible EXECUTE by '${t.role}' — a mistake here has no undo`,
        fix: 'add a human checkpoint before the final step, or make the step reversible (compensating action)',
      });
    }
  }

  const humanFit = !findings.some((f) => f.severity === 'HIGH' || f.severity === 'BLOCKER');
  return { workflow: w.id, findings, humanFit, approvalChainLength: w.sequentialApprovals };
}

/**
 * The complementary check: given a touchpoint stream that DID happen, did the
 * requester ever learn the outcome? (The §8 honesty rule applied to process:
 * a workflow that never tells its originator is incomplete by design.)
 */
export function requesterNeverInformed(w: WorkflowDesign, requesterRole: string): boolean {
  return w.touchpoints.every((t) => t.role !== requesterRole && !t.informedRoles.includes(requesterRole));
}

/** which human factors a design owes by posture (the §10 "what a posture
 * demands" applied to process): FINANCIAL/HARDENED workflows owe the
 * reversibility + visibility factors the most; casual flows may relax
 * FEEDBACK_LAG but never IRREVERSIBILITY on money. */
export function owedFactors(posture: string): HumanFactorFinding['factor'][] {
  if (posture === 'FINANCIAL' || posture === 'HEALTH') {
    return ['IRREVERSIBILITY', 'VISIBILITY_GAP', 'FEEDBACK_LAG', 'INFORMATION_GAP'];
  }
  if (posture === 'STANDARD') {
    return ['INFORMATION_GAP', 'FEEDBACK_LAG', 'IRREVERSIBILITY'];
  }
  return ['INFORMATION_GAP', 'APPROVAL_FATIGUE'];
}
