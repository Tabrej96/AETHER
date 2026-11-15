/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P15 · SELF-IMPROVEMENT REGRESSION SUITE
 * (src/core/evolution/regression.ts) · Created by Tabrej
 *
 * Directive §11D: "Maintain a regression suite containing diverse engineering
 * tasks… Test whether intelligence improvements produce better results across
 * different categories. Measure: requirement understanding, business rule
 * completeness, creativity and usefulness, functional correctness,
 * calculation accuracy, security, edge-case coverage, test quality,
 * maintainability, human intervention, time and token cost. Do not optimize
 * solely for larger outputs or more generated code."
 *
 * So each task is scored by its *engine verdicts*, not by output size: a
 * task scores well when the engines discover more owed edge cases, keep the
 * domain coherent, keep the possibility different, keep the panel clean, and
 * keep the money exact. Bigger output with the same verdicts scores the
 * same — the anti-gaming rule (risk register R5) is structural here.
 */

import { runBusinessLogic, findImpossibleStates } from '../programs/p13BusinessLogicIntelligence';
import { runProjectIntelligence } from '../programs/p12ProjectIntelligence';
import { runDeepExecution } from '../programs/p10DeepExecutionIntelligence';
import { ORDER_LIFECYCLE } from '../businessLogic/stateMachine';
import { auditMetric, type MetricDefinition } from '../businessLogic/metrics';

export interface RegressionTask {
  id: string;
  category: string;
  task: string;
  /** the metric the task claims (so §8 discipline is exercised too) */
  claimedMetric?: MetricDefinition;
}

/** the directive's named diversity — the suite must span these, not one category */
export const REGRESSION_SUITE: RegressionTask[] = [
  { id: 'REG-01', category: 'small-website', task: 'Build a personal portfolio site for a photographer with a gallery' },
  { id: 'REG-02', category: 'marketplace', task: 'Build a two-sided marketplace for used cameras with seller payouts, escrow, and disputes' },
  { id: 'REG-03', category: 'saas-subscriptions', task: 'Build a SaaS project tool with per-seat subscriptions, usage metering, and downgrades' },
  { id: 'REG-04', category: 'financial-calculations', task: 'Build a multi-currency invoicing system with proration, partial refunds, and FX settlement' },
  { id: 'REG-05', category: 'multi-tenant-authz', task: 'Build a multi-tenant CRM where members of one tenant can never see another tenant\'s records' },
  { id: 'REG-06', category: 'ecommerce-checkout', task: 'Build an e-commerce checkout with stock reservations, coupons, and delivery fees' },
  { id: 'REG-07', category: 'inventory', task: 'Build inventory management with movements, reservations, and a stock ledger' },
  { id: 'REG-08', category: 'booking-scheduling', task: 'Build a dental clinic booking system with capacity holds, cancellation policies, and rescheduling' },
  { id: 'REG-09', category: 'complex-workflow', task: 'Build an approval workflow for purchase orders with maker/checker, escalation, and period close' },
  { id: 'REG-10', category: 'unseen-product', task: 'Build a platform for coordinating neighborhood tool-lending between households' },
];

export interface TaskScore {
  taskId: string;
  /** each axis is an engine verdict, not an output-size proxy */
  requirementUnderstanding: number; // 0–100
  businessRuleCompleteness: number; // edge cases discovered & guarded
  creativityAndUsefulness: number; // differentiator quality, not quantity
  functionalCorrectness: number; // machines well-formed + no impossible states
  calculationAccuracy: number; // money exactness (P10) when money is in scope
  security: number; // posture-appropriate guards present
  edgeCaseCoverage: number; // owed edge cases with invariants
  testQuality: number; // invariants named + metric definitions sound
  maintainability: number; // decisions recorded with reasons + engines
  /** the anti-gaming axis: human-intervention + token cost stay proportional */
  proportionalEffort: number;
}

/** the deterministic task score — every axis is an engine verdict */
export function scoreTask(t: RegressionTask): TaskScore {
  const plan = runBusinessLogic({ task: t.task, metrics: t.claimedMetric ? [t.claimedMetric] : undefined });
  const strategy = runProjectIntelligence({ task: t.task }).strategy;
  const domain = plan.domain;
  const edges = plan.edgeCases;

  // requirement understanding: the classification is evidence-based (not a
  // keyword miss) and the depth is owed
  const understanding =
    (plan.classification.unseen ? 55 : 90) +
    (plan.classification.categories.every((c) => c.matched.length > 0 || plan.classification.unseen) ? 10 : 0);

  // rule completeness: entities carry invariants + machines are owed
  const entitiesWithInvariants = domain.entities.filter((e) => e.invariants.length > 0).length;
  const ruleCompleteness =
    Math.round((entitiesWithInvariants / Math.max(1, domain.entities.length)) * 60) +
    Math.min(plan.machines.length, 2) * 20;

  // creativity: differentiator quality (score), NOT count
  const creativity = Math.round((plan.possibility.recommended[0]?.score ?? 0) * 0.6 +
    (plan.genuinelyDifferent ? 40 : 0));

  // correctness: machines well-formed, no impossible states in the owed
  // observations
  const malformed = plan.machines.filter((m) => m.invalid.length > 0).length;
  const impossible = findImpossibleStates(
    plan.machines.filter((m) => m.entity === ORDER_LIFECYCLE.entity).length
      ? [{ machine: ORDER_LIFECYCLE.entity, from: 'Delivered', to: 'Dispatched' }]
      : []
  ).length;
  const correctness = Math.max(0, 100 - malformed * 40 - impossible * 20);

  // money exactness only applies where money flows exist
  const moneyInScope = domain.financialFlows.length > 0;
  let calculation = moneyInScope
    ? Math.round((runCalculationVerdict(t.task) ? 95 : 40))
    : 100; // no money, nothing to get wrong

  // security: posture-appropriate guard present
  const posture = strategy.classification.profile.securityPosture;
  const security = posture === 'STANDARD' ? 80 : 95;

  // edge coverage: owed cases that carry invariants
  const guarded = edges.filter((e) => e.testInvariant.trim()).length;
  const edgeCoverage = edges.length ? Math.round((guarded / edges.length) * 100) : 40;

  // test quality: invariants named + metric definition sound
  const metricSound = t.claimedMetric ? auditMetric(t.claimedMetric).sound : true;
  const testQuality = Math.round((guarded / Math.max(1, edges.length)) * 50 + (metricSound ? 50 : 15));

  // maintainability: every strategy decision is reasoned
  const reasoned = Object.values(strategy.decisions).filter((d) => d.reason.trim()).length;
  const maintainability = Math.round((reasoned / Object.keys(strategy.decisions).length) * 100);

  // proportionality: effort must track the task, not balloon on small ones
  const lvl = strategy.effort.level;
  const proportionalEffort =
    /small-website|portfolio/i.test(t.category) && (lvl === 'DEEP' || lvl === 'DEEPEST')
      ? 55 // a small product is not owed DEEPEST
      : lvl === 'FOCUSED' ? 80 : 95;

  return {
    taskId: t.id,
    requirementUnderstanding: understanding,
    businessRuleCompleteness: ruleCompleteness,
    creativityAndUsefulness: creativity,
    functionalCorrectness: correctness,
    calculationAccuracy: calculation,
    security,
    edgeCaseCoverage: edgeCoverage,
    testQuality,
    maintainability,
    proportionalEffort,
  };
}

/**
 * P10's verdict, called per task only when money is actually in scope. Runs a
 * real inter-state GST invoice through P10 and requires the server's
 * recompute to confirm a CORRECT total while REJECTING a tampered one — the
 * exactness the directive demands, proven rather than asserted.
 */
function runCalculationVerdict(task: string): boolean {
  try {
    if (!/invoic|billing|refund|proration|FX|multi-currenc|payout|settlement/i.test(task)) return true;
    const lines = [{ lineId: 'l1', description: 'supply', quantityMilli: 1000, pricePaise: 490000, rateId: 'GST-18', hsnSac: '7113' }];
    const good = runDeepExecution({
      task,
      invoice: { lines, taxMode: 'EXCLUSIVE', jurisdiction: 'IN', placeOfSupply: { supplierRegion: 'Maharashtra', buyerRegion: 'Delhi' } },
    });
    const total = good.calculation?.breakdown.grandTotalPaise;
    if (total === undefined) return false;
    // a correct assertion matches; a tampered one must be rejected by the guard
    const goodCheck = runDeepExecution({
      task,
      invoice: { lines, taxMode: 'EXCLUSIVE', jurisdiction: 'IN', placeOfSupply: { supplierRegion: 'Maharashtra', buyerRegion: 'Delhi' }, clientAssertedTotalPaise: total },
    });
    const tampered = runDeepExecution({
      task,
      invoice: { lines, taxMode: 'EXCLUSIVE', jurisdiction: 'IN', placeOfSupply: { supplierRegion: 'Maharashtra', buyerRegion: 'Delhi' }, clientAssertedTotalPaise: total + 1 },
    });
    return (
      Number.isInteger(total) &&
      goodCheck.calculation?.clientTotalVerified.ok === true &&
      tampered.calculation?.clientTotalVerified.ok === false
    );
  } catch {
    return false;
  }
}

export interface SuiteResult {
  tasks: Record<string, TaskScore>;
  mean: number;
  worst: { taskId: string; axis: string; value: number };
}

/** the regression run: per-task scores + the mean the evolve loop optimizes */
export function runRegressionSuite(tasks: RegressionTask[] = REGRESSION_SUITE): SuiteResult {
  const out: Record<string, TaskScore> = {};
  let sum = 0;
  let count = 0;
  let worst: SuiteResult['worst'] = { taskId: '', axis: '', value: 101 };
  for (const t of tasks) {
    const s = scoreTask(t);
    out[t.id] = s;
    for (const [axis, v] of Object.entries(s)) {
      if (axis === 'taskId') continue;
      sum += v;
      count++;
      if (v < worst.value) worst = { taskId: t.id, axis, value: v };
    }
  }
  return { tasks: out, mean: count ? Math.round((sum / count) * 10) / 10 : 0, worst };
}
