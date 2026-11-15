/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE · NEW QUALITY STANDARD
 * (src/core/intel/completion.ts) · Created by Tabrej
 *
 * Directive 9: a task is NOT complete because code exists, a page renders,
 * an API responds, a number displays, a test file exists, or a screenshot
 * looks nice in one viewport. It is complete when its REQUIRED BEHAVIOR
 * works, domain rules are handled, calculations are verified, the UX is
 * appropriate, and it meets its acceptance criteria.
 *
 * This module makes that PROVABLE: a CompletionChecklist of ten named
 * criteria (the directive's exact list), each with a boolean verdict plus
 * the EVIDENCE that justifies it (command, file, measurement). A build is
 * COMPLETE only when every criterion is met and every met criterion carries
 * evidence — a bare "true" without evidence is a defect, not a pass.
 */

import type { RequirementFacet } from './requirements';

export type CompletionCriterion =
  | 'REQUIREMENT_COMPLETENESS'
  | 'DOMAIN_CORRECTNESS'
  | 'MATHEMATICAL_CORRECTNESS'
  | 'ARCHITECTURAL_QUALITY'
  | 'CREATIVE_QUALITY'
  | 'DESIGN_CONSISTENCY'
  | 'ACCESSIBILITY'
  | 'FUNCTIONAL_BEHAVIOR'
  | 'SECURITY'
  | 'VERIFICATION_EVIDENCE'
  | 'HONEST_DOCUMENTATION';

export const COMPLETION_CRITERIA: readonly CompletionCriterion[] = [
  'REQUIREMENT_COMPLETENESS', 'DOMAIN_CORRECTNESS', 'MATHEMATICAL_CORRECTNESS',
  'ARCHITECTURAL_QUALITY', 'CREATIVE_QUALITY', 'DESIGN_CONSISTENCY',
  'ACCESSIBILITY', 'FUNCTIONAL_BEHAVIOR', 'SECURITY', 'VERIFICATION_EVIDENCE',
  'HONEST_DOCUMENTATION',
];

export interface CriterionEvidence {
  /** what was actually measured / run */
  kind: 'TEST_SUITE' | 'MEASUREMENT' | 'COMMIT' | 'COMMAND' | 'SCREENSHOT' | 'PROVABLE_GUARD';
  detail: string;
  /** the concrete artifact: file path, suite id, measured value */
  reference: string;
}

export interface CriterionVerdict {
  criterion: CompletionCriterion;
  met: boolean;
  /** required when met: the evidence that justifies it. A met-without-evidence verdict is a defect. */
  evidence?: CriterionEvidence;
  /** required when NOT met: what blocks it */
  gap?: string;
}

export interface CompletionReport {
  status: 'COMPLETE' | 'INCOMPLETE';
  met: number;
  total: number;
  /** the criteria not yet met (the honest remainder) */
  open: Array<{ criterion: CompletionCriterion; gap: string }>;
  /** any met criterion missing evidence (a defect per the directive) */
  metWithoutEvidence: CompletionCriterion[];
}

export function evaluateCompletion(verdicts: CriterionVerdict[]): CompletionReport {
  let met = 0;
  const open: CompletionReport['open'] = [];
  const metWithoutEvidence: CompletionCriterion[] = [];
  for (const v of verdicts) {
    if (v.met) {
      met += 1;
      if (!v.evidence || !v.evidence.reference.trim()) metWithoutEvidence.push(v.criterion);
    } else {
      open.push({ criterion: v.criterion, gap: v.gap ?? '(gap not recorded)' });
    }
  }
  // COMPLETE requires: all met AND none met-without-evidence AND all criteria covered
  const covered = verdicts.length >= COMPLETION_CRITERIA.length;
  const status: CompletionReport['status'] = covered && met === COMPLETION_CRITERIA.length && metWithoutEvidence.length === 0
    ? 'COMPLETE' : 'INCOMPLETE';
  return { status, met, total: COMPLETION_CRITERIA.length, open, metWithoutEvidence };
}

/**
 * Which criteria a build of a given requirement depth OBLIGATES. A SIMPLE fix
 * does not owe CREATIVE_QUALITY; a COMPLEX money system owes
 * MATHEMATICAL_CORRECTNESS + VERIFICATION_EVIDENCE. This keeps the standard
 * proportional to the task (directive 6: "completeness proportional to the
 * task, not verbosity for its own sake").
 */
/**
 * Criteria a build owes, PROPORTIONAL to the task (directive 6).
 * `designOwed` is true only when the task actually has a UI/creative surface
 * (its composition pulled a design/accessibility/creative skill). A pure
 * backend money system does not owe CREATIVE_QUALITY — completeness follows
 * the task, not a fixed checklist.
 */
export function obligatedCriteria(
  depth: import('./requirements').RequirementDepth,
  designOwed = false
): CompletionCriterion[] {
  const base: CompletionCriterion[] = ['REQUIREMENT_COMPLETENESS', 'FUNCTIONAL_BEHAVIOR', 'VERIFICATION_EVIDENCE', 'HONEST_DOCUMENTATION'];
  switch (depth) {
    case 'SIMPLE':
      return base;
    case 'AMBIGUOUS':
      // can't be complete while ambiguous — the gate is the mustAsk resolution
      return base;
    case 'DETAILED': {
      const extra: CompletionCriterion[] = ['ARCHITECTURAL_QUALITY', 'SECURITY'];
      if (designOwed) extra.push('DESIGN_CONSISTENCY', 'ACCESSIBILITY');
      return [...base, ...extra];
    }
    case 'COMPLEX': {
      const extra: CompletionCriterion[] = ['DOMAIN_CORRECTNESS', 'MATHEMATICAL_CORRECTNESS', 'ARCHITECTURAL_QUALITY', 'SECURITY'];
      if (designOwed) extra.push('DESIGN_CONSISTENCY', 'ACCESSIBILITY', 'CREATIVE_QUALITY');
      return [...base, ...extra];
    }
  }
}

/** the ten facets map cleanly onto completion criteria — kept exportable for the UI */
export const FACET_TO_CRITERION: Record<RequirementFacet, CompletionCriterion> = {
  PRIMARY_OBJECTIVE: 'REQUIREMENT_COMPLETENESS',
  INTENDED_OUTCOME: 'REQUIREMENT_COMPLETENESS',
  FUNCTIONAL: 'FUNCTIONAL_BEHAVIOR',
  DOMAIN: 'DOMAIN_CORRECTNESS',
  TECHNICAL: 'ARCHITECTURAL_QUALITY',
  DESIGN_EXPERIENCE: 'DESIGN_CONSISTENCY',
  BUSINESS_RULES: 'DOMAIN_CORRECTNESS',
  EDGE_CASES: 'MATHEMATICAL_CORRECTNESS',
  DEPENDENCIES: 'ARCHITECTURAL_QUALITY',
  SECURITY_PRIVACY: 'SECURITY',
};
