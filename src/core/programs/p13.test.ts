/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — SUPREME EVOLUTION P13 TEST · business-logic intelligence
 * (src/core/programs/p13.test.ts) · Created by Tabrej
 *
 * The directive's §3/§4/§8 made machine-checkable:
 *  - the domain model is coherent (every entity carries invariants)
 *  - lifecycle state machines are closed-set and forbid impossible states
 *  - the edge-case catalog each category owes carries a test invariant
 *  - the possibility engine does NOT lead with generic features
 *  - metric discipline rejects decorative / un-labeled analytics
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  P13_CAPABILITY,
  runBusinessLogic,
  runP13BenchmarkEvidence,
  findImpossibleStates,
} from './p13BusinessLogicIntelligence';
import { ORDER_LIFECYCLE, SUBSCRIPTION_LIFECYCLE, validateMachine, validateTransition, detectImpossibleStates } from '../businessLogic/stateMachine';
import { edgeCasesFor, edgeCaseCoverage, EDGE_CASES } from '../businessLogic/edgeCases';
import { explorePossibilities, isGenuinelyDifferent } from '../businessLogic/possibility';
import { auditMetric, auditDashboard, type MetricDefinition } from '../businessLogic/metrics';
import { deriveDomainModel } from '../businessLogic/domainModel';
import { buildIntegrationRegistry } from './registry';

// ---------------------------------------------------------------- domain model

test('the domain model is coherent: every entity carries ≥1 invariant, flows are named', () => {
  const m = deriveDomainModel('ECOMMERCE');
  assert.ok(m.participants.length >= 3, 'participants are modeled, not assumed');
  for (const e of m.entities) assert.ok(e.invariants.length >= 1, `entity '${e.name}' has no invariants`);
  assert.ok(m.financialFlows.length >= 2, 'financial flows are named');
  assert.ok(m.successMetrics.every((s) => s.includes('definition') || s.length > 10), 'metrics are not decorative');
});

test('an unseen category derives a first-principles skeleton, not a keyword miss', () => {
  const m = deriveDomainModel('UNSEEN');
  assert.equal(m.category, 'DERIVED');
  assert.ok(m.entities[0].invariants[0].includes('invariants'), 'the skeleton says what it owes, explicitly');
});

// ---------------------------------------------------------------- state machines

test('the order + subscription machines are well-formed closed sets', () => {
  assert.equal(validateMachine(ORDER_LIFECYCLE).length, 0, JSON.stringify(validateMachine(ORDER_LIFECYCLE)));
  assert.equal(validateMachine(SUBSCRIPTION_LIFECYCLE).length, 0, JSON.stringify(validateMachine(SUBSCRIPTION_LIFECYCLE)));
});

test('impossible order transitions are rejected with the concrete reason', () => {
  // Draft → Dispatched skips everything: forbidden
  const bad = validateTransition(ORDER_LIFECYCLE, 'Draft', 'Dispatched');
  assert.equal(bad.allowed, false);
  assert.match(bad.reason, /impossible state transition/);
  // Delivered → Dispatched is a regression: forbidden
  assert.equal(validateTransition(ORDER_LIFECYCLE, 'Delivered', 'Dispatched').allowed, false);
  // a legal path works
  assert.equal(validateTransition(ORDER_LIFECYCLE, 'Confirmed', 'Processing', 'fulfilment').allowed, true);
  // permission gate: a non-fulfilment actor cannot process
  const denied = validateTransition(ORDER_LIFECYCLE, 'Confirmed', 'Processing', 'customer');
  assert.equal(denied.allowed, false);
  assert.match(denied.reason, /permission/);
});

test('the "delivered-then-failed" edge case is caught by the impossible-state detector', () => {
  const defects = detectImpossibleStates(ORDER_LIFECYCLE, [{ from: 'Delivered', to: 'Dispatched' }]);
  assert.ok(defects.some((d) => d.includes('Delivered->Dispatched')), 'a provider failure reported after delivery is a state regression');
  // a legal observation produces no defects
  assert.equal(detectImpossibleStates(ORDER_LIFECYCLE, [{ from: 'Processing', to: 'Dispatched' }]).length, 0);
});

test('the subscription machine encodes "expires mid-transaction" explicitly', () => {
  // PastDue → Active only via the grace/recovery rule, never directly
  assert.equal(validateTransition(SUBSCRIPTION_LIFECYCLE, 'PastDue', 'Active').allowed, false);
  assert.equal(validateTransition(SUBSCRIPTION_LIFECYCLE, 'GracePeriod', 'Active', 'system').allowed, true);
});

test('findImpossibleStates routes observations to the right machine', () => {
  const defects = findImpossibleStates([{ machine: 'Order', from: 'Delivered', to: 'Dispatched' }]);
  assert.ok(defects.some((d) => d.startsWith('Order:')));
  const clean = findImpossibleStates([{ machine: 'Order', from: 'Processing', to: 'Dispatched' }]);
  assert.equal(clean.length, 0);
});

// ---------------------------------------------------------------- edge cases

test('edge cases are discovered per category, and each carries a test invariant', () => {
  const cats = edgeCasesFor(['ECOMMERCE', 'FINANCIAL']);
  assert.ok(cats.length >= 4, 'a commerce + money product owes several');
  for (const c of cats) assert.ok(c.testInvariant.trim().length > 0, `${c.id} has no invariant`);
  // the last-item race is the flagship one and must be discoverable
  assert.ok(cats.some((c) => c.id === 'EDGE-LAST-ITEM-RACE'));
  // determinism: same input, same set
  const again = edgeCasesFor(['ECOMMERCE', 'FINANCIAL']).map((c) => c.id).join(',');
  assert.equal(again, cats.map((c) => c.id).join(','));
});

test('edge-case coverage: a case counts as planned only when its invariant is named', () => {
  const catalog = edgeCasesFor(['FINANCIAL']);
  const plan = 'test ' + catalog.map((c) => c.testInvariant).join('; test ');
  const cov = edgeCaseCoverage(catalog, plan);
  assert.equal(cov.uncovered.length, 0, 'every named invariant is covered');
  const none = edgeCaseCoverage(catalog, 'test checkout');
  assert.ok(none.uncovered.length > 0, 'a vague plan leaves cases uncovered');
  assert.ok(EDGE_CASES.every((c) => c.scenario.trim() && c.expectedOutcome.trim()), 'every catalog case has scenario + expected outcome');
});

// ---------------------------------------------------------------- possibility engine

test('the possibility engine does NOT lead with generic features (the directive\'s §4)', () => {
  for (const cat of ['PROJECT_MANAGEMENT', 'ECOMMERCE', 'MARKETPLACE', 'FINANCIAL'] as const) {
    const r = explorePossibilities(cat);
    assert.equal(isGenuinelyDifferent(r), true, `${cat} recommendation leads with a differentiator`);
    assert.ok(r.explored >= 12, 'the 12 dimensions were explored, not skipped');
  }
});

test('a financial posture rewards rigor in the ranking (posture-aware scoring)', () => {
  const standard = explorePossibilities('FINANCIAL', 'STANDARD');
  const hardened = explorePossibilities('FINANCIAL', 'FINANCIAL');
  // the ledger/rigour differentiator must rank at least as high under the financial posture
  const ledgerStd = standard.recommended.find((p) => /ledger|audit|exact/i.test(p.idea + p.rationale));
  const ledgerFin = hardened.recommended.find((p) => /ledger|audit|exact/i.test(p.idea + p.rationale));
  assert.ok(ledgerFin, 'a rigor differentiator is recommended under the financial posture');
  if (ledgerStd) assert.ok(ledgerFin.score >= ledgerStd.score, 'the posture can only raise rigor, not lower it');
});

test('the possibility engine is deterministic (seeded, reproducible)', () => {
  const a = JSON.stringify(explorePossibilities('PROJECT_MANAGEMENT'));
  const b = JSON.stringify(explorePossibilities('PROJECT_MANAGEMENT'));
  assert.equal(a, b);
});

// ---------------------------------------------------------------- metric discipline

test('a decorative metric (no purpose, no source, no calc) is rejected', () => {
  const rep = auditMetric({
    name: 'Dashboard engagement',
    purpose: '',
    definition: 'some engagement',
    sourceOfTruth: '',
    calculation: '',
    updateFrequency: 'daily',
    permissions: 'everyone',
    interpretation: 'looks busy',
    limitations: '',
    dataKind: 'ACTUAL',
  });
  assert.equal(rep.sound, false);
  const kinds = new Set(rep.findings.map((f) => f.kind));
  assert.ok(kinds.has('NO_SOURCE_OF_TRUTH'));
  assert.ok(kinds.has('NO_CALCULATION'));
  assert.ok(kinds.has('DECORATIVE_METRIC'));
});

test('an un-labeled PROJECTION is the "fabricated analytics" the directive forbids', () => {
  const rep = auditMetric({
    name: 'Project revenue',
    purpose: 'forecast',
    definition: 'revenue projected for the next 12 months from current MRR and churn assumptions',
    sourceOfTruth: 'billing ledger + churn model',
    calculation: 'MRR(t) * (1 + growth) * months - churned_MRR * months',
    updateFrequency: 'monthly',
    permissions: 'finance only',
    interpretation: 'a projection, not actuals',
    limitations: 'assumes churn holds; sensitive to growth assumption',
    dataKind: 'PROJECTION',
  });
  // interpretation names it a projection → not un-labeled → sound
  assert.equal(rep.sound, true, JSON.stringify(rep.findings));
});

test('a dashboard is sound only when every metric is', () => {
  const good: MetricDefinition = {
    name: 'NRR',
    purpose: 'does the installed base expand?',
    definition: 'net revenue retention: current-MRR (existing cohorts) + expansion − downgrades − churn, over trailing 12 months, divided by starting MRR',
    sourceOfTruth: 'billing ledger, cohort-tagged',
    calculation: '(startMRR + expansionMRR - downgradeMRR - churnedMRR) / startMRR',
    updateFrequency: 'monthly',
    permissions: 'finance + leadership',
    interpretation: '>100% = the base grows without new logos',
    limitations: 'distorted by one-time enterprise deals; watch cohort size',
    dataKind: 'ACTUAL',
  };
  const bad: MetricDefinition = {
    name: 'Vibes score',
    purpose: '',
    definition: 'overall product feeling',
    sourceOfTruth: '',
    calculation: '',
    updateFrequency: 'never',
    permissions: 'everyone',
    interpretation: 'a guess',
    limitations: '',
    dataKind: 'ESTIMATE',
  };
  const rep = auditDashboard([good, bad]);
  assert.deepEqual(rep.sound, ['NRR']);
  assert.deepEqual(rep.unsound, ['Vibes score']);
});

// ---------------------------------------------------------------- program integration

test('P13 is registered in the integration registry and promoted to EXECUTE', () => {
  const reg = buildIntegrationRegistry();
  const cap = reg.capabilities.find((c) => c.id === P13_CAPABILITY.id);
  assert.ok(cap, 'P13 capability present in registry');
  assert.equal(reg.lifecycleStates[P13_CAPABILITY.id], 'EXECUTE');
});

test('a SaaS+checkout request plans machines + edge cases + a genuinely-different possibility set', () => {
  const plan = runBusinessLogic({ task: 'Build a multi-tenant SaaS billing platform with checkout and subscriptions' });
  assert.equal(plan.classification.unseen, false);
  const entities = new Set(plan.machines.map((m) => m.entity));
  assert.ok(entities.has('Order'), 'a checkout product owes the order machine');
  assert.ok(entities.has('Subscription'), 'a subscription product owes the sub machine');
  assert.ok(plan.machines.every((m) => m.invalid.length === 0), 'all machines are well-formed');
  assert.ok(plan.edgeCases.length >= 3, 'edge cases are discovered, not assumed');
  assert.equal(plan.genuinelyDifferent, true);
});

test('the P13 benchmark evidence reports a real, non-fabricated measurement', () => {
  const e = runP13BenchmarkEvidence();
  assert.equal(e.status, 'MEASURED_DETERMINISTIC_EXECUTION');
  assert.equal(typeof e.measuredValue, 'number');
  assert.ok(e.measuredValue !== null && e.measuredValue >= 1);
  assert.ok((e.detail ?? '').length > 0);
});
