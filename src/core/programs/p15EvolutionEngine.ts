/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P15 · CONTROLLED EVOLUTION ENGINE
 * (src/core/programs/p15EvolutionEngine.ts) · Created by Tabrej
 *
 * The program-level capability for directive §11 (self-evolving engineering
 * intelligence) and capability #5 "Evolution Engine": a versioned, measured,
 * rollback-able improvement loop with hard governance on safeguard changes.
 *
 * The loop, in §11's own steps: record the failure → root cause → propose an
 * improvement → a reproducible test case exists → measure before → measure
 * after → promote ONLY on a measurable delta → the prior version stays the
 * rollback target. R4 (risk register) is codified, not a policy note: a
 * change that touches a safeguard never auto-promotes, and lowering a
 * threshold to move a score is refused.
 */

import { evaluateImprovement, applyToLedger, newLedger, evolve, type Improvement, type EvolutionRecord, type EvolutionLedger, type GovernanceConfig } from '../evolution/evolve';
import { runRegressionSuite, REGRESSION_SUITE, type RegressionTask, type SuiteResult } from '../evolution/regression';
import type { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export { evaluateImprovement, applyToLedger, newLedger, evolve, runRegressionSuite, REGRESSION_SUITE };
export type { Improvement, EvolutionRecord, EvolutionLedger, GovernanceConfig, RegressionTask, SuiteResult };

export const P15_CAPABILITY: ProgramCapability = {
  id: 'cap-p15-controlled-evolution-engine',
  programId: 'P15_CONTROLLED_EVOLUTION_ENGINE' as ProgramId,
  programName: 'PROGRAM 15 — CONTROLLED EVOLUTION ENGINE (SUPREME EVOLUTION §11: self-improving, measurable, rollback-able)',
  capability:
    'A versioned self-improvement loop: the §11D regression suite (10 diverse tasks — small website, marketplace, SaaS subscriptions, financial calculations, multi-tenant authorization, e-commerce checkout, inventory, booking, complex workflow, and an unseen product) scored on 10 axes that are ENGINE VERDICTS (requirement understanding, rule completeness, creativity-vs-quantity, functional correctness, calculation accuracy via P10, security posture fit, edge-case coverage, test quality, maintainability, proportional effort) — never output size, per the anti-gaming rule (R5). Improvements carry a root cause, a knowledge class (§11B: VERIFIED / CONTEXT / HYPOTHESIS / DEPRECATED), a reproducible test case, and a measured before/after delta; promotion requires a real improvement, and the prior version is always the rollback target. R4 governance: a safeguard-touching change never auto-promotes, needs an explicit approval token, and a lowered threshold is refused even with the token when the evidence regresses.',
  repositoryOrigin: 'operator SUPREME EVOLUTION directive (first-party; no external repository)',
  originProject: 'AETHER SUPREME EVOLUTION — Universal Business Logic Intelligence, Product Creativity & Self-Evolving Engineering System (capability #5 Evolution Engine + §11)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'APPROVAL_GATED_WRITES',
  resourceRequirements: 'pure TS, fully deterministic; the suite scores 10 tasks in <50 ms (measured 17 ms at baseline). No network, no clock, no randomness.',
  testCoverage: 'suite spans 10 categories incl. an unseen product; money exactness per task runs P10 for real (a tampered total is rejected, a correct one confirmed); promotion on a measurable delta; HOLD on ties/regressions (R5 anti-gaming); REJECT on DEPRECATED class; safeguard changes REJECTED without a token and HELD even with one when the evidence regresses (R4); ledger preserves rejected/held records and only advances on promotion; rollback target = the last promoted base.',
  integratesWith: ['P10 finance verdict', 'P12 classification', 'P13 edge-case + possibility verdicts', 'Decision-record system'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'evolution-verdicts',
    unit: 'suite-mean',
    detail: 'The regression suite reports a measured mean + worst axis over 10 diverse tasks; the improvement loop reports a measured before/after delta and its decision (PROMOTED / HELD / REJECTED) with the rollback target.',
  },
  author: 'Created by Tabrej',
};

export function runP15BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const base = runRegressionSuite();
  // a no-op candidate: identical measurement → delta 0 → HELD, never promoted
  const noop = evolve({
    baseVersion: 1,
    improvement: {
      id: 'EV-NOP',
      rootCause: 'none (baseline candidate)',
      reproducibleTestCase: 'REG-04 financial task: P10 confirms a correct total and rejects a tampered one',
      knowledgeClass: 'VERIFIED',
      claimedAxes: ['functionalCorrectness'],
      touchesSafeguard: false,
    },
    tasks: REGRESSION_SUITE,
    governance: { minDelta: 0.5 },
  });
  // a safeguard-touching change with NO token → REJECTED (R4)
  const ungoverned = evaluateImprovement({
    base: 1,
    improvement: {
      id: 'EV-SAFE',
      rootCause: 'security floor is too strict',
      reproducibleTestCase: 'panel: a clean multi-tenant plan still approves',
      knowledgeClass: 'HYPOTHESIS',
      claimedAxes: ['security'],
      touchesSafeguard: true,
    },
    measureBefore: () => base,
    measureAfter: () => base,
    tasks: REGRESSION_SUITE,
  });
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: base.mean,
    metric: 'evolution-verdicts',
    unit: 'suite-mean',
    detail: `evolution baseline: suite mean ${base.mean} over ${REGRESSION_SUITE.length} tasks (worst ${base.worst.taskId}.${base.worst.axis}=${base.worst.value}); a no-op candidate → ${noop.record.decision} (delta ${noop.record.delta}, never promoted on non-improvement); a safeguard-touching change without a token → ${ungoverned.decision} (R4). Ledger: ${newLedger().currentVersion} → advances only on a measured promotion.`,
  };
}
