/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P14 TEST · independent quality panel
 * (src/core/review/panel.test.ts) · Created by Tabrej
 *
 * §10 made machine-checkable: evidence-gated reviewers, the self-approval
 * case, blocker resolution, and per-finder provenance.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { runPanel, hasRunnableVerification, type ReviewInput } from './panel';
import { runBusinessLogic } from '../programs/p13BusinessLogicIntelligence';
import { runProjectIntelligence } from '../programs/p12ProjectIntelligence';

const cleanPlan = () => {
  const task = 'Build a multi-tenant SaaS billing platform with checkout, subscriptions, and refunds';
  const business = runBusinessLogic({ task });
  const strategy = runProjectIntelligence({ task }).strategy;
  const i: ReviewInput = {
    planId: 'plan-clean',
    strategy,
    business,
    artifact: {
      claimedTestLayers: ['UNIT', 'INTEGRATION', 'END_TO_END', 'SECURITY'],
      ranTestLayers: ['UNIT', 'INTEGRATION', 'END_TO_END', 'SECURITY'],
      uxPatternsPresent: strategy.decisions.skills.value.split(', ').map((s) => s.trim()).filter(Boolean),
    },
  };
  return i;
};

test('nine independent reviewers run and a clean plan approves', () => {
  const v = runPanel(cleanPlan());
  const reviewers = new Set(v.findings.map((f) => f.reviewer));
  assert.ok(['business-analyst', 'domain-specialist', 'product-strategist', 'financial-logic-reviewer', 'ux-reviewer', 'backend-architect', 'security-reviewer', 'qa-engineer', 'performance-reviewer'].every((r) => reviewers.has(r)), 'all nine perspectives are present');
  assert.equal(v.approved, true, JSON.stringify(v.blockers, null, 2));
  assert.equal(v.blockers.length, 0);
});

test('an agent that self-approves its own work is NOT approved by the panel', () => {
  const i = cleanPlan();
  i.selfClaimedComplete = true;
  i.artifact!.moneyColumnIsFloat = true; // a real defect the self-claim ignored
  const v = runPanel(i);
  assert.equal(v.approved, false, 'a self-claim over a defective artifact is an objection of record');
  const self = v.findings.find((f) => f.reviewer === 'independent-panel')!;
  assert.equal(self.verdict, 'OBJECTION');
  assert.match(self.evidence, /does not approve its own work/);
  assert.ok(v.blockers.some((b) => /float/i.test(b.evidence)));
});

test('a self-claim WITH panel evidence is the one case §10 allows', () => {
  const i = cleanPlan();
  i.selfClaimedComplete = true;
  const v = runPanel(i);
  assert.equal(v.approved, true);
  assert.match(v.findings.find((f) => f.reviewer === 'independent-panel')!.evidence, /backed by evidence, not by the claim itself/);
});

test('a cross-tenant write is a BLOCKER no reviewer can out-vote', () => {
  const i = cleanPlan();
  i.artifact!.unscopedTenantWrite = true;
  const v = runPanel(i);
  assert.equal(v.approved, false);
  assert.ok(v.blockers.some((b) => b.reviewer === 'security-reviewer' && b.severity === 'BLOCKER'));
});

test('claimed-but-unrun test layers are QA blockers, not passes (§17)', () => {
  const i = cleanPlan();
  i.artifact!.ranTestLayers = ['UNIT']; // claimed four, ran one
  const v = runPanel(i);
  assert.ok(v.blockers.some((b) => b.reviewer === 'qa-engineer' && /claimed test layers with no run/i.test(b.evidence)));
});

test('money in a binary float is a BLOCKER when money is in scope', () => {
  const i = cleanPlan();
  i.artifact!.moneyColumnIsFloat = true;
  const v = runPanel(i);
  assert.ok(v.blockers.some((b) => b.reviewer === 'financial-logic-reviewer' && b.severity === 'BLOCKER'));
});

test('a performance claim without a budget is a reviewer finding (§11)', () => {
  const i = cleanPlan();
  i.artifact!.performanceClaim = '99th percentile < 200 ms';
  i.artifact!.hasPerformanceBudget = false;
  const v = runPanel(i);
  assert.ok(v.findings.some((f) => f.reviewer === 'performance-reviewer' && f.verdict === 'OBJECTION'));
});

test('every finding carries explicit evidence (no "looks fine")', () => {
  const v = runPanel(cleanPlan());
  for (const f of v.findings) {
    assert.ok(f.evidence.trim().length >= 10, `${f.reviewer}: "${f.evidence}"`);
    assert.ok(!/looks fine|seems ok/i.test(f.evidence), 'vibes are not evidence');
  }
});

test('hasRunnableVerification requires a run or a named invariant', () => {
  assert.equal(hasRunnableVerification(cleanPlan()), true);
  const bare: ReviewInput = { planId: 'x' };
  assert.equal(hasRunnableVerification(bare), false);
});
