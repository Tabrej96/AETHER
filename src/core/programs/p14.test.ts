/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — SUPREME EVOLUTION P14 TEST · independent quality panel
 * (src/core/programs/p14.test.ts) · Created by Tabrej
 *
 * The directive's §10 + capability #4 made checkable through the P14 program
 * surface (the panel's own behavior is covered in src/core/review/panel.test.ts):
 * the nine perspectives exist, the program integrates with P12/P13 plans, and
 * the self-approval case is enforced at the program boundary too.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { P14_CAPABILITY, runP14BenchmarkEvidence, P14_REVIEWERS } from './p14QualityIntelligence';
import { runPanel } from '../review/panel';
import { runBusinessLogic } from './p13BusinessLogicIntelligence';
import { runProjectIntelligence } from './p12ProjectIntelligence';
import { buildIntegrationRegistry } from './registry';

test('all nine directive-named reviewer perspectives exist (§10)', () => {
  const expected = [
    'business-analyst',
    'domain-specialist',
    'product-strategist',
    'financial-logic-reviewer',
    'ux-reviewer',
    'backend-architect',
    'security-reviewer',
    'qa-engineer',
    'performance-reviewer',
  ];
  for (const name of expected) {
    assert.ok(P14_REVIEWERS.includes(name as (typeof P14_REVIEWERS)[number]), `${name} is a named §10 perspective`);
  }
  assert.equal(P14_REVIEWERS.length, 9);
});

test('P14 composes P12 + P13 plans as its review inputs (no second engine)', () => {
  const task = 'Build a multi-tenant SaaS billing platform with checkout, subscriptions, and refunds';
  const business = runBusinessLogic({ task });
  const strategy = runProjectIntelligence({ task }).strategy;
  const v = runPanel({
    planId: 'p14-compose',
    strategy,
    business,
    artifact: { claimedTestLayers: ['UNIT', 'INTEGRATION', 'SECURITY'], ranTestLayers: ['UNIT', 'INTEGRATION', 'SECURITY'] },
  });
  // the panel found the machines + edge cases through the composed P13 plan
  const domain = v.findings.find((f) => f.reviewer === 'domain-specialist')!;
  assert.equal(domain.verdict, 'APPROVE', JSON.stringify(domain));
  const edge = v.findings.find((f) => f.reviewer === 'business-analyst')!;
  assert.match(edge.evidence, /owed edge cases/);
});

test('the §10 self-approval case is enforced at the program boundary', () => {
  const task = 'Build a multi-tenant SaaS billing platform with checkout, subscriptions, and refunds';
  const business = runBusinessLogic({ task });
  const strategy = runProjectIntelligence({ task }).strategy;
  const good = runPanel({ planId: 'self-good', strategy, business, selfClaimedComplete: true });
  const defective = runPanel({ planId: 'self-bad', strategy, business, artifact: { moneyColumnIsFloat: true }, selfClaimedComplete: true });
  assert.equal(good.approved, true, 'a clean plan self-claim is backed by the panel');
  assert.equal(defective.approved, false, 'a defective plan self-claim is an objection of record');
});

test('P14 is registered in the integration registry and promoted to EXECUTE', () => {
  const reg = buildIntegrationRegistry();
  const cap = reg.capabilities.find((c) => c.id === P14_CAPABILITY.id);
  assert.ok(cap, 'P14 capability present in registry');
  assert.equal(reg.lifecycleStates[P14_CAPABILITY.id], 'EXECUTE');
});

test('the P14 benchmark evidence reports a real, non-fabricated measurement', () => {
  const e = runP14BenchmarkEvidence();
  assert.equal(e.status, 'MEASURED_DETERMINISTIC_EXECUTION');
  assert.equal(typeof e.measuredValue, 'number');
  assert.ok((e.detail ?? '').length > 0);
});
