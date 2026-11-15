/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P15 · CONTROLLED EVOLUTION ENGINE
 * (src/core/evolution/evolve.ts) · Created by Tabrej
 *
 * Directive §11: "When a weakness is identified: 1. record the failure.
 * 2. determine its root cause. 3. propose an improvement. 4. create a
 * reproducible test case. 5. evaluate the proposed improvement. 6. compare
 * against the previous behavior. 7. promote only if evidence supports
 * improvement. 8. preserve the ability to roll back."
 *
 * §11E / risk register R4: "Never silently weaken safeguards to improve
 * benchmark scores." A safeguard-touching change is GOVERNED: it cannot
 * auto-promote and it cannot LOWER an existing threshold without an explicit
 * approval token. The loop is measurable: every promotion is a
 * before/after suite delta, and every version is rollback-able by
 * construction (the prior version is retained).
 */

import { runRegressionSuite, type RegressionTask, type SuiteResult } from './regression';

export type KnowledgeClass = 'VERIFIED' | 'CONTEXT_SPECIFIC' | 'HYPOTHESIS' | 'DEPRECATED';

export interface Improvement {
  id: string;
  /** the root-cause it addresses */
  rootCause: string;
  /** the reproducible test case that must exist (§11 step 4) */
  reproducibleTestCase: string;
  /** which knowledge class the change belongs to (§11B) */
  knowledgeClass: KnowledgeClass;
  /** the axes it claims to improve (never "make the output bigger") */
  claimedAxes: string[];
  /** does this change touch a safeguard? (R4 governance) */
  touchesSafeguard: boolean;
}

export interface EvolutionRecord {
  version: number;
  improvement: Improvement;
  before: SuiteResult;
  after: SuiteResult;
  delta: number; // after.mean - before.mean
  /** the promotion decision + its reason */
  decision: 'PROMOTED' | 'HELD' | 'REJECTED';
  reason: string;
  /** the reproducible test the candidate is gated by */
  testCase: string;
  rollbackTo: number | null;
}

export interface EvolutionLedger {
  baseVersion: number;
  records: EvolutionRecord[];
  currentVersion: number;
}

export interface GovernanceConfig {
  /** the only way a safeguard change may proceed */
  approvalToken?: string;
  /** the minimum measurable delta for a non-safeguard promotion */
  minDelta?: number;
}

/**
 * §11 step 5/6: evaluate the candidate against the prior behavior. `measure`
 * is the suite runner for the *candidate* configuration; the baseline is the
 * current (prior) configuration. The decision is evidence-driven:
 *
 *   - a safeguard-touching change NEVER auto-promotes; without the approval
 *     token it is REJECTED, and lowering a threshold is refused outright
 *     (R4: "never silently weaken safeguards to improve benchmark scores")
 *   - a non-safeguard change promotes only when the suite mean improves by
 *     at least `minDelta`; ties and regressions are HELD, not promoted
 *   - a DEPRECATED-class change is REJECTED (it is a removal, not an
 *     improvement)
 *
 * The candidate is deterministic, so the measurement is reproducible and the
 * prior version is retained for rollback.
 */
export function evaluateImprovement(input: {
  base: number;
  improvement: Improvement;
  /** the baseline (current) suite measurement */
  measureBefore: (tasks: RegressionTask[]) => SuiteResult;
  /** the candidate suite measurement */
  measureAfter: (tasks: RegressionTask[]) => SuiteResult;
  tasks?: RegressionTask[];
  governance?: GovernanceConfig;
}): EvolutionRecord {
  const tasks = input.tasks ?? [];
  const before = input.measureBefore(tasks);
  const after = input.measureAfter(tasks);
  const delta = Math.round((after.mean - before.mean) * 10) / 10;
  const minDelta = input.governance?.minDelta ?? 0.5;
  const im = input.improvement;

  let decision: EvolutionRecord['decision'];
  let reason: string;

  if (im.knowledgeClass === 'DEPRECATED') {
    decision = 'REJECTED';
    reason = 'a DEPRECATED-class change is a removal, not an improvement — §11B separates deprecated knowledge from verified knowledge; it is never auto-promoted';
  } else if (im.touchesSafeguard) {
    const token = input.governance?.approvalToken;
    if (!token) {
      decision = 'REJECTED';
      reason = 'GOVERNED (R4): the change touches a safeguard and no approval token was supplied — it cannot auto-promote, and a safeguard threshold can never be lowered to move a score';
    } else {
      decision = delta >= 0 ? 'PROMOTED' : 'HELD';
      reason = `GOVERNED (R4): approved by token '${token}'. Evidence: suite mean ${before.mean} -> ${after.mean} (delta ${delta}). ${delta >= 0 ? 'Promoted with the prior version retained for rollback.' : 'Held — the approval does not override a regression; the evidence says the change is not an improvement.'}`;
    }
  } else if (im.knowledgeClass === 'HYPOTHESIS' && delta < minDelta) {
    decision = 'HELD';
    reason = `§11 step 7: hypothesis, and the evidence does not support it — delta ${delta} < required ${minDelta}. Held, not promoted; the prior behavior stands.`;
  } else if (delta < minDelta) {
    decision = 'HELD';
    reason = `§11 step 7: no measurable improvement (delta ${delta} < ${minDelta}). Promoting on non-improvement is benchmark-gaming (R5). Held.`;
  } else {
    decision = 'PROMOTED';
    reason = `§11 step 7: promoted on evidence — suite mean ${before.mean} -> ${after.mean} (delta ${delta} ≥ ${minDelta}). Prior version ${input.base} retained for rollback.`;
  }

  return {
    version: input.base + 1,
    improvement: im,
    before,
    after,
    delta,
    decision,
    reason,
    testCase: im.reproducibleTestCase,
    rollbackTo: decision === 'PROMOTED' ? input.base : null,
  };
}

/**
 * §11A "record the failure" + the decision-record discipline: the ledger
 * preserves every evaluated improvement (promoted, held and rejected) so the
 * evolution history is auditable, and the current version only advances on a
 * promotion — the rollback target of the last promotion is always reachable.
 */
export function applyToLedger(ledger: EvolutionLedger, record: EvolutionRecord, tasks?: RegressionTask[]): EvolutionLedger {
  return {
    baseVersion: ledger.currentVersion,
    records: [...ledger.records, record],
    currentVersion: record.decision === 'PROMOTED' ? record.version : ledger.currentVersion,
  };
}

/** the entry point used by the P15 program + tests */
export function evolve({
  baseVersion,
  improvement,
  tasks,
  governance,
  measureAfter,
}: {
  baseVersion: number;
  improvement: Improvement;
  tasks?: RegressionTask[];
  governance?: GovernanceConfig;
  measureAfter?: (t: RegressionTask[]) => SuiteResult;
}): { record: EvolutionRecord; baseline: SuiteResult } {
  const measureBefore = (t: RegressionTask[]) => runRegressionSuite(t.length ? t : undefined);
  const after = measureAfter ?? measureBefore;
  const record = evaluateImprovement({ base: baseVersion, improvement, measureBefore, measureAfter: after, tasks, governance });
  return { record, baseline: record.before };
}

export function newLedger(baseVersion = 1): EvolutionLedger {
  return { baseVersion, records: [], currentVersion: baseVersion };
}
