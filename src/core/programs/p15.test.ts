/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — SUPREME EVOLUTION P15 TEST · controlled evolution engine
 * (src/core/programs/p15.test.ts) · Created by Tabrej
 *
 * §11 made machine-checkable: a measured promote/hold/reject loop with hard
 * governance on safeguard changes (R4) and an anti-gaming rule (R5).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { P15_CAPABILITY, runP15BenchmarkEvidence, evaluateImprovement, applyToLedger, newLedger, runRegressionSuite, REGRESSION_SUITE } from './p15EvolutionEngine';
import { buildIntegrationRegistry } from './registry';

function fakeSuite(mean: number) {
  return { tasks: {}, mean, worst: { taskId: 'x', axis: 'y', value: 0 } };
}

test('the regression suite spans diverse categories including an unseen product', () => {
  const cats = REGRESSION_SUITE.map((t) => t.category);
  assert.ok(cats.includes('unseen-product'), 'the suite includes a previously-unseen category');
  assert.ok(cats.length >= 8, 'the suite is diverse, not single-category');
  const r = runRegressionSuite();
  assert.ok(r.mean > 0, 'the suite produces a measured mean');
  assert.equal(Object.keys(r.tasks).length, REGRESSION_SUITE.length);
});

test('a no-op candidate is HELD, never promoted (R5 anti-gaming)', () => {
  const base = fakeSuite(88);
  const rec = evaluateImprovement({
    base: 1,
    improvement: { id: 'EV', rootCause: 'x', reproducibleTestCase: 'case', knowledgeClass: 'VERIFIED', claimedAxes: ['a'], touchesSafeguard: false },
    measureBefore: () => base,
    measureAfter: () => base, // identical → delta 0
    governance: { minDelta: 0.5 },
  });
  assert.equal(rec.decision, 'HELD');
  assert.equal(rec.delta, 0);
  assert.match(rec.reason, /no measurable improvement/i);
});

test('a candidate with a real measured delta is PROMOTED, with the prior version as rollback target', () => {
  const rec = evaluateImprovement({
    base: 3,
    improvement: { id: 'EV', rootCause: 'x', reproducibleTestCase: 'case', knowledgeClass: 'VERIFIED', claimedAxes: ['a'], touchesSafeguard: false },
    measureBefore: () => fakeSuite(88),
    measureAfter: () => fakeSuite(91),
    governance: { minDelta: 0.5 },
  });
  assert.equal(rec.decision, 'PROMOTED');
  assert.equal(rec.delta, 3);
  assert.equal(rec.rollbackTo, 3, 'the prior version is retained as the rollback target');
});

test('a DEPRECATED-class change is REJECTED (a removal is not an improvement)', () => {
  const rec = evaluateImprovement({
    base: 1,
    improvement: { id: 'EV', rootCause: 'x', reproducibleTestCase: 'case', knowledgeClass: 'DEPRECATED', claimedAxes: [], touchesSafeguard: false },
    measureBefore: () => fakeSuite(88),
    measureAfter: () => fakeSuite(99),
  });
  assert.equal(rec.decision, 'REJECTED');
  assert.match(rec.reason, /removal/i);
});

test('a safeguard-touching change is REJECTED without an approval token (R4)', () => {
  const rec = evaluateImprovement({
    base: 1,
    improvement: { id: 'EV', rootCause: 'x', reproducibleTestCase: 'case', knowledgeClass: 'HYPOTHESIS', claimedAxes: ['security'], touchesSafeguard: true },
    measureBefore: () => fakeSuite(88),
    measureAfter: () => fakeSuite(95), // even a big win...
  });
  assert.equal(rec.decision, 'REJECTED');
  assert.match(rec.reason, /approval token/i);
});

test('a safeguard change WITH a token still cannot be promoted on a regression (R4: never weaken to move a score)', () => {
  const rec = evaluateImprovement({
    base: 1,
    improvement: { id: 'EV', rootCause: 'x', reproducibleTestCase: 'case', knowledgeClass: 'HYPOTHESIS', claimedAxes: ['security'], touchesSafeguard: true },
    measureBefore: () => fakeSuite(95),
    measureAfter: () => fakeSuite(90), // a regression
    governance: { approvalToken: 'OPS-2026-11' },
  });
  assert.equal(rec.decision, 'HELD');
  assert.match(rec.reason, /does not override a regression/i);
});

test('a safeguard change WITH a token and non-regressing evidence is PROMOTED', () => {
  const rec = evaluateImprovement({
    base: 1,
    improvement: { id: 'EV', rootCause: 'x', reproducibleTestCase: 'case', knowledgeClass: 'VERIFIED', claimedAxes: ['security'], touchesSafeguard: true },
    measureBefore: () => fakeSuite(90),
    measureAfter: () => fakeSuite(90), // no regression
    governance: { approvalToken: 'OPS-2026-11' },
  });
  assert.equal(rec.decision, 'PROMOTED');
  assert.match(rec.reason, /approved by token/i);
});

test('the ledger only advances the version on a promotion; rejected/held are recorded', () => {
  let ledger = newLedger(1);
  const recs = [
    evaluateImprovement({ base: 1, improvement: { id: 'A', rootCause: '', reproducibleTestCase: '', knowledgeClass: 'VERIFIED', claimedAxes: [], touchesSafeguard: false }, measureBefore: () => fakeSuite(90), measureAfter: () => fakeSuite(90) }), // HELD
    evaluateImprovement({ base: 1, improvement: { id: 'B', rootCause: '', reproducibleTestCase: '', knowledgeClass: 'VERIFIED', claimedAxes: [], touchesSafeguard: false }, measureBefore: () => fakeSuite(90), measureAfter: () => fakeSuite(92), governance: { minDelta: 0.5 } }), // PROMOTED
  ];
  ledger = applyToLedger(ledger, recs[0]);
  assert.equal(ledger.currentVersion, 1, 'a hold does not advance the version');
  assert.equal(ledger.records.length, 1, 'the hold is still recorded');
  ledger = applyToLedger(ledger, recs[1]);
  assert.equal(ledger.currentVersion, recs[1].version, 'the promotion advances the version');
  assert.equal(ledger.records.length, 2, 'both are in the audit trail');
});

test('P15 is registered in the integration registry and promoted to EXECUTE', () => {
  const reg = buildIntegrationRegistry();
  const cap = reg.capabilities.find((c) => c.id === P15_CAPABILITY.id);
  assert.ok(cap, 'P15 capability present in registry');
  assert.equal(reg.lifecycleStates[P15_CAPABILITY.id], 'EXECUTE');
});

test('the P15 benchmark evidence reports a measured baseline + a real governance verdict', () => {
  const e = runP15BenchmarkEvidence();
  assert.equal(e.status, 'MEASURED_DETERMINISTIC_EXECUTION');
  assert.equal(typeof e.measuredValue, 'number');
  assert.ok((e.measuredValue ?? 0) > 0);
  assert.match(e.detail ?? '', /no-op candidate → HELD/);
  assert.match(e.detail ?? '', /without a token → REJECTED/);
});
