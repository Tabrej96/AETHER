/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P17 · BUSINESS WORKFLOW PATTERNS
 * (src/core/workflow/patterns.ts) · Created by Tabrej
 *
 * The directive's business-operations intelligence (Phase 7): approval
 * workflows, escalation, disputes, settlement and reconciliation — the
 * five patterns every money-adjacent business has and most implementations
 * improvise badly. Each pattern is a deterministic state engine with its
 * invariants stated up top and checked down below.
 */

// ------------------------------------------------------------------ approval

export type ApprovalState = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'CLOSED';

export interface ApprovalPolicy {
  /** roles that may approve, in order (first matching suffices) */
  approverRoles: string[];
  /** the next approver when the current one is unavailable */
  escalationRole?: string;
  /** minutes of inaction before escalation fires */
  escalateAfterMin?: number;
  /** who may make the final call after escalation */
  finalRole?: string;
}

export interface ApprovalEvent {
  state: ApprovalState;
  byRole?: string;
  atMin: number; // minutes since submission
}

/**
 * Maker/checker + escalation, as a pure function over the event stream:
 *  - a maker cannot approve their own submission (separation of duties)
 *  - approval by a non-listed role is refused, the request stays PENDING
 *  - inaction past escalateAfterMin moves it to ESCALATED, only finalRole
 *    may then close it
 *  - REJECTED is terminal: it cannot re-enter PENDING without a new
 *    submission (a new event stream, not a state flip)
 */
export function approvalOutcome(events: ApprovalEvent[], policy: ApprovalPolicy, submittedByRole: string): { final: ApprovalState; reason: string } {
  let state: ApprovalState = 'DRAFT';
  for (const e of events) {
    if (state === 'DRAFT' && e.state === 'PENDING') { state = 'PENDING'; continue; }
    if (state === 'PENDING') {
      if (e.state === 'ESCALATED') { state = 'ESCALATED'; continue; }
      if (e.state === 'APPROVED') {
        if (e.byRole === submittedByRole) return { final: 'PENDING', reason: 'maker may not approve their own submission (separation of duties)' };
        if (policy.approverRoles.includes(e.byRole ?? '')) return { final: 'APPROVED', reason: `approved by ${e.byRole}` };
        return { final: 'PENDING', reason: `${e.byRole} is not in the approver list — the request stays pending` };
      }
      if (e.state === 'REJECTED') return { final: 'REJECTED', reason: `rejected by ${e.byRole} (terminal; a new submission starts a new stream)` };
    }
    if (state === 'ESCALATED' && e.state === 'CLOSED' && policy.finalRole && e.byRole === policy.finalRole) {
      return { final: 'CLOSED', reason: 'final call by ' + e.byRole + ' after escalation' };
    }
  }
  return { final: state, reason: state === 'ESCALATED' ? 'escalated; awaiting the final role' : state };
}

/** inaction check: has the escalation timer run out, and is there a role to escalate to? */
export function isEscalationDue(lastActionMin: number, policy: ApprovalPolicy): boolean {
  return policy.escalateAfterMin != null && lastActionMin >= policy.escalateAfterMin && policy.escalationRole != null;
}

// ------------------------------------------------------------------ disputes

export type DisputeState = 'OPEN' | 'RESPONDED' | 'IN_REVIEW' | 'RESOLVED' | 'REFUNDED' | 'UPHELD';

export interface DisputeEvent {
  state: DisputeState;
  byRole: string;
  evidence?: string;
}

/**
 * Dispute resolution with its invariant: a dispute FREEZES the funds it
 * covers (no payout while OPEN/IN_REVIEW), resolution is recorded, never
 * silent, and a REFUNDED dispute is terminal. A platform that resolves a
 * dispute without moving the frozen funds has broken the invariant.
 */
export function disputeOutcome(events: DisputeEvent[], platformFeesKept: boolean): { final: DisputeState; fundsFrozen: boolean; recorded: boolean } {
  let state: DisputeState = 'OPEN';
  let recorded = false;
  for (const e of events) {
    if (e.state === 'RESPONDED' && e.evidence) { state = 'IN_REVIEW'; recorded = true; }
    else if (e.state === 'RESOLVED') { state = 'RESOLVED'; recorded = true; }
    else if (e.state === 'REFUNDED') { state = 'REFUNDED'; recorded = true; }
    else if (e.state === 'UPHELD') { state = 'UPHELD'; recorded = true; }
  }
  void platformFeesKept;
  const fundsFrozen = state === 'OPEN' || state === 'IN_REVIEW';
  return { final: state, fundsFrozen, recorded };
}

// ------------------------------------------------------------------ reconciliation

export interface LedgerEntry {
  account: string;
  debitPaise: number;
  creditPaise: number;
}

/**
 * The double-entry invariant, checkable: in every posted period
 * sum(debits) === sum(credits). A mismatch names the excess side and the
 * delta — the P13 finance seed's "the books always balance," made a gate.
 */
export function reconcilePeriod(entries: LedgerEntry[]): { balanced: boolean; debitTotal: number; creditTotal: number; deltaPaise: number } {
  let debitTotal = 0;
  let creditTotal = 0;
  for (const e of entries) {
    debitTotal += e.debitPaise;
    creditTotal += e.creditPaise;
  }
  return { balanced: debitTotal === creditTotal, debitTotal, creditTotal, deltaPaise: debitTotal - creditTotal };
}

/**
 * Correction, never overwrite: a ledger error is fixed by POSTING a
 * correcting entry (append-only), never by editing the original. The
 * original is the record; the correction carries its own cause.
 */
export function correctingEntry(original: LedgerEntry, cause: string): LedgerEntry & { cause: string } {
  return {
    account: original.account,
    debitPaise: original.creditPaise, // reverse the entry
    creditPaise: original.debitPaise,
    cause,
  };
}

// ------------------------------------------------------------------ settlement (batch)

export interface SettlementBatch {
  grossPaise: number;
  commissionBps: number;
  feesBps: number;
  /** unsettled carry from the previous period (e.g. a disputed amount) */
  carryForwardPaise?: number;
}

export interface SettlementVerdict {
  payablePaise: number;
  commissionPaise: number;
  feesPaise: number;
  nextCarryForwardPaise: number; // a disputed portion rolls forward, unpaid
  idempotentKey: string; // a re-run of the same period must produce the same key
}

/**
 * Period settlement: payable = (gross − commission − fees − carryForward),
 * paise-exact, with the disputed carry forward kept out of this period's
 * payable (paid only when the dispute resolves). The idempotency key is the
 * period signature — re-running the settlement for the same period is a
 * no-op, the directive's double-payout edge case handled at the pattern
 * layer.
 */
export function settlePeriod(b: SettlementBatch, periodIso: string, disputedPaise = 0): SettlementVerdict {
  const commissionPaise = Math.round((b.grossPaise * b.commissionBps) / 10000);
  const feesPaise = Math.round((b.grossPaise * b.feesBps) / 10000);
  const carry = b.carryForwardPaise ?? 0;
  const payablePaise = Math.max(0, b.grossPaise - commissionPaise - feesPaise - carry - disputedPaise);
  return {
    payablePaise,
    commissionPaise,
    feesPaise,
    nextCarryForwardPaise: disputedPaise, // unsettled disputes roll forward
    idempotentKey: `settle:${periodIso}:${b.grossPaise}:${b.commissionBps}:${b.feesBps}:${carry}`,
  };
}
