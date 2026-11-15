/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P18 TEST · human-centered workflow intelligence
 * (src/core/workflow/human.test.ts) · Created by Tabrej
 *
 * Capability #6: a logically correct workflow can still fail its humans —
 * approval fatigue, deciding without information, no feedback, no undo.
 * Each defect here is named with the design change that removes it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { auditWorkflow, requesterNeverInformed, owedFactors, type WorkflowDesign, type Touchpoint } from './human';

const good: WorkflowDesign = {
  id: 'wf-goods',
  sequentialApprovals: 2,
  urgency: 'MEDIUM',
  involvedRoles: ['requester', 'manager', 'finance'],
  touchpoints: [
    { id: 't1', role: 'manager', action: 'DECIDE', infoAvailable: ['amount', 'policy'], infoNeeded: ['amount', 'policy'], slaMin: 60, reversible: true, informedRoles: ['requester', 'finance'] },
    { id: 't2', role: 'finance', action: 'INFORM', infoAvailable: ['decision'], infoNeeded: [], slaMin: 30, reversible: true, informedRoles: ['requester'] },
  ],
};

const bad: WorkflowDesign = {
  id: 'wf-bad',
  sequentialApprovals: 6,
  urgency: 'HIGH',
  involvedRoles: ['requester'],
  touchpoints: [
    { id: 'a1', role: 'l1', action: 'DECIDE', infoAvailable: [], infoNeeded: ['risk-class'], slaMin: undefined, reversible: false, informedRoles: [], urgency: 'HIGH' },
    { id: 'a2', role: 'l1', action: 'DECIDE', infoAvailable: ['risk-class'], infoNeeded: ['risk-class'], slaMin: undefined, reversible: false, informedRoles: [], urgency: 'HIGH' },
    { id: 'x1', role: 'ops', action: 'EXECUTE', infoAvailable: ['ticket'], infoNeeded: ['ticket'], slaMin: undefined, reversible: false, informedRoles: [], urgency: 'HIGH' },
  ],
};

test('a well-designed workflow is human-fit (no HIGH/BLOCKER findings)', () => {
  const r = auditWorkflow(good);
  assert.equal(r.humanFit, true, JSON.stringify(r.findings, null, 2));
  // it may still have LOW findings — human-fit is about the HIGH/BLOCKER ones
});

test('six sequential sign-offs on a HIGH-urgency task is approval fatigue by design', () => {
  const r = auditWorkflow(bad);
  assert.equal(r.humanFit, false);
  const fatigue = r.findings.filter((f) => f.factor === 'APPROVAL_FATIGUE');
  assert.ok(fatigue.length >= 1);
  assert.equal(fatigue[0].severity, 'HIGH');
  assert.match(fatigue[0].fix, /collapse/i);
});

test('deciding without the information needed is a named information gap', () => {
  const r = auditWorkflow(bad);
  const gap = r.findings.find((f) => f.factor === 'INFORMATION_GAP' && f.touchpointId === 'a1')!;
  assert.ok(gap);
  assert.match(gap.detail, /risk-class/);
});

test('a repeated DECIDE by the same role is approval theater (rubber stamp)', () => {
  const r = auditWorkflow(bad);
  const theater = r.findings.filter((f) => f.factor === 'APPROVAL_THEATER');
  assert.equal(theater.length, 1, 'reported once, on the duplicate');
  assert.equal(theater[0].touchpointId, 'a2', 'the duplicate is the defect, not the original');
});

test('a final, non-reversible EXECUTE on a non-low-urgency workflow is a HIGH irreversibility finding', () => {
  const r = auditWorkflow(bad);
  const irr = r.findings.filter((f) => f.factor === 'IRREVERSIBILITY');
  assert.ok(irr.some((f) => f.severity === 'HIGH' && f.touchpointId === 'x1'));
});

test('a decision with no SLA is a feedback-lag finding (the requester cannot time their wait)', () => {
  const r = auditWorkflow(bad);
  const lag = r.findings.filter((f) => f.factor === 'FEEDBACK_LAG');
  assert.ok(lag.length >= 1, 'both undecided DECIDEs without SLAs are flagged');
});

test('a workflow that never tells its requester is incomplete by design', () => {
  assert.equal(requesterNeverInformed(bad, 'requester'), true);
  assert.equal(requesterNeverInformed(good, 'requester'), false);
});

test('a posture owes specific human factors (hardened postures owe reversibility + visibility)', () => {
  const hard = owedFactors('FINANCIAL');
  assert.ok(hard.includes('IRREVERSIBILITY'));
  assert.ok(hard.includes('VISIBILITY_GAP'));
  assert.ok(hard.includes('FEEDBACK_LAG'));
  const casual = owedFactors('CASUAL');
  assert.ok(!casual.includes('IRREVERSIBILITY'), 'casual flows may relax some factors, but never money reversibility');
});

test('an outcome the affected roles cannot see is a visibility gap', () => {
  const w: WorkflowDesign = {
    id: 'wf-vis',
    sequentialApprovals: 1,
    urgency: 'MEDIUM',
    involvedRoles: ['requester', 'support'],
    touchpoints: [
      { id: 'd', role: 'manager', action: 'DECIDE', infoAvailable: ['x'], infoNeeded: ['x'], slaMin: 30, reversible: true, informedRoles: ['manager'] },
    ],
  };
  const r = auditWorkflow(w);
  const vis = r.findings.filter((f) => f.factor === 'VISIBILITY_GAP');
  assert.ok(vis.some((f) => /requester/.test(f.detail) && /support/.test(f.detail)));
});

test('auditWorkflow is deterministic: two runs over the same design are identical', () => {
  const a = JSON.stringify(auditWorkflow(bad));
  const b = JSON.stringify(auditWorkflow(bad));
  assert.equal(a, b);
});
