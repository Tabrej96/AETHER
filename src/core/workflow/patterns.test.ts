/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P17 TEST · business workflow patterns
 * (src/core/workflow/patterns.test.ts) · Created by Tabrej
 *
 * Phase 7: approval (maker/checker + escalation), dispute (funds freeze +
 * recorded resolution), reconciliation (double-entry invariant +
 * append-only correction), settlement (paise-exact, idempotent per period).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  approvalOutcome,
  isEscalationDue,
  disputeOutcome,
  reconcilePeriod,
  correctingEntry,
  settlePeriod,
  type ApprovalPolicy,
} from './patterns';

const POLICY: ApprovalPolicy = {
  approverRoles: ['manager', 'director'],
  escalationRole: 'director',
  escalateAfterMin: 60,
  finalRole: 'director',
};

test('a maker cannot approve their own submission (separation of duties)', () => {
  const out = approvalOutcome(
    [
      { state: 'PENDING', atMin: 0 },
      { state: 'APPROVED', byRole: 'alice', atMin: 5 },
    ],
    POLICY,
    'alice'
  );
  assert.equal(out.final, 'PENDING');
  assert.match(out.reason, /maker may not approve/);
});

test('an approval by a non-listed role keeps the request pending', () => {
  const out = approvalOutcome(
    [
      { state: 'PENDING', atMin: 0 },
      { state: 'APPROVED', byRole: 'intern', atMin: 5 },
    ],
    POLICY,
    'alice'
  );
  assert.equal(out.final, 'PENDING');
  assert.match(out.reason, /not in the approver list/);
});

test('a listed approver approves; rejection is terminal', () => {
  const ok = approvalOutcome(
    [{ state: 'PENDING', atMin: 0 }, { state: 'APPROVED', byRole: 'manager', atMin: 10 }],
    POLICY,
    'alice'
  );
  assert.equal(ok.final, 'APPROVED');
  const no = approvalOutcome(
    [{ state: 'PENDING', atMin: 0 }, { state: 'REJECTED', byRole: 'director', atMin: 10 }],
    POLICY,
    'alice'
  );
  assert.equal(no.final, 'REJECTED');
});

test('inaction escalates; only the final role may close after escalation', () => {
  assert.equal(isEscalationDue(61, POLICY), true);
  assert.equal(isEscalationDue(30, POLICY), false);
  const esc = approvalOutcome(
    [
      { state: 'PENDING', atMin: 0 },
      { state: 'ESCALATED', atMin: 70 },
      { state: 'CLOSED', byRole: 'director', atMin: 90 },
    ],
    POLICY,
    'alice'
  );
  assert.equal(esc.final, 'CLOSED');
  // a non-final role cannot close an escalated request
  const wrong = approvalOutcome(
    [
      { state: 'PENDING', atMin: 0 },
      { state: 'ESCALATED', atMin: 70 },
      { state: 'CLOSED', byRole: 'manager', atMin: 90 },
    ],
    POLICY,
    'alice'
  );
  assert.equal(wrong.final, 'ESCALATED');
});

test('a dispute freezes its funds until resolution, and resolution is recorded', () => {
  const open = disputeOutcome([{ state: 'OPEN', byRole: 'buyer' }], false);
  assert.equal(open.fundsFrozen, true);
  assert.equal(open.recorded, false);
  const resolved = disputeOutcome(
    [
      { state: 'OPEN', byRole: 'buyer' },
      { state: 'RESPONDED', byRole: 'seller', evidence: 'proof-of-delivery.png' },
      { state: 'RESOLVED', byRole: 'platform', evidence: 'carrier signed' },
    ],
    false
  );
  assert.equal(resolved.final, 'RESOLVED');
  assert.equal(resolved.fundsFrozen, false, 'resolution releases the freeze');
  assert.equal(resolved.recorded, true, 'the resolution is a record, never silent');
});

test('the double-entry invariant: balanced periods pass, a mismatch names the delta', () => {
  const ok = reconcilePeriod([
    { account: 'cash', debitPaise: 0, creditPaise: 5000 },
    { account: 'revenue', debitPaise: 5000, creditPaise: 0 },
  ]);
  assert.equal(ok.balanced, true);
  const bad = reconcilePeriod([
    { account: 'cash', debitPaise: 0, creditPaise: 5000 },
    { account: 'revenue', debitPaise: 4999, creditPaise: 0 },
  ]);
  assert.equal(bad.balanced, false);
  assert.equal(bad.deltaPaise, -1, 'a one-paise drift is named, not absorbed');
});

test('a correction is an appended reversing entry, never an edit of the original', () => {
  const original = { account: 'cash', debitPaise: 5000, creditPaise: 0 };
  const fix = correctingEntry(original, 'posted to the wrong account');
  assert.equal(fix.debitPaise, 0);
  assert.equal(fix.creditPaise, 5000);
  assert.equal(fix.cause, 'posted to the wrong account');
  // original + correction re-balance the period
  const rebalanced = reconcilePeriod([original, fix]);
  assert.equal(rebalanced.balanced, true);
});

test('settlement is paise-exact and idempotent per period; disputes roll forward unpaid', () => {
  const v = settlePeriod({ grossPaise: 40000, commissionBps: 400, feesBps: 200 }, '2026-11-01', 3000);
  assert.equal(v.payablePaise, 40000 - 1600 - 800 - 3000, 'the disputed amount is held back from this period');
  assert.equal(v.nextCarryForwardPaise, 3000, 'the held amount rolls forward');
  // a re-run of the same period is the same idempotency key (a no-op guard)
  const again = settlePeriod({ grossPaise: 40000, commissionBps: 400, feesBps: 200 }, '2026-11-01', 3000);
  assert.equal(again.idempotentKey, v.idempotentKey);
  assert.equal(again.payablePaise, v.payablePaise);
  // a different period is a different key
  const other = settlePeriod({ grossPaise: 40000, commissionBps: 400, feesBps: 200 }, '2026-12-01');
  assert.notEqual(other.idempotentKey, v.idempotentKey);
});
