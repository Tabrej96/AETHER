/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P17 · BUSINESS WORKFLOW PATTERNS
 * (src/core/programs/p17WorkflowPatterns.ts) · Created by Tabrej
 *
 * Directive Phase 7: the five business-operations patterns every
 * money-adjacent workflow owes — approval (maker/checker + escalation),
 * dispute (funds-freeze + recorded resolution), reconciliation
 * (double-entry invariant + append-only correction), settlement
 * (paise-exact, idempotent per period), and escalation timers — as
 * deterministic state engines whose invariants are the gates. P16 computes
 * the paise; P17 decides the states. No second ledger, no second money
 * engine — the paise-exact calculations are P16's/P10's.
 */

import { approvalOutcome, disputeOutcome, reconcilePeriod, correctingEntry, settlePeriod, isEscalationDue, type ApprovalPolicy, type LedgerEntry } from '../workflow/patterns';
import type { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export { approvalOutcome, disputeOutcome, reconcilePeriod, correctingEntry, settlePeriod, isEscalationDue };
export type { ApprovalPolicy, ApprovalEvent, LedgerEntry, DisputeEvent, SettlementBatch, SettlementVerdict } from '../workflow/patterns';

export const P17_CAPABILITY: ProgramCapability = {
  id: 'cap-p17-business-workflow-patterns',
  programId: 'P17_BUSINESS_WORKFLOW_PATTERNS' as ProgramId,
  programName: 'PROGRAM 17 — BUSINESS WORKFLOW PATTERNS (SUPREME EVOLUTION Phase 7: approval, escalation, dispute, settlement, reconciliation)',
  capability:
    'The five patterns every money-adjacent business owes, as deterministic state engines: approval with maker/checker separation of duties + escalation + terminal rejection; dispute resolution that FREEZES the covered funds until a recorded resolution (the ledger never silently unwinds); reconciliation against the double-entry invariant (sum debits = sum credits, a one-paise drift named not absorbed) with corrections as appended reversing entries (the original is never edited); and period settlement that is paise-exact, idempotent per period signature (a re-run is a no-op — the double-payout edge case handled at the pattern layer), with disputed amounts rolling forward unpaid. P16/P10 own the paise math; P17 owns the states the paise flow through.',
  repositoryOrigin: 'operator SUPREME EVOLUTION directive (first-party; no external repository)',
  originProject: 'AETHER SUPREME EVOLUTION — Phase 7: business-operations workflow patterns (approval / escalation / dispute / settlement / reconciliation)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'pure TS, fully deterministic; state machines over event streams, no clock, no network, no randomness.',
  testCoverage: 'maker cannot approve own submission; non-listed role keeps the request pending; terminal rejection; escalation + final-role-only close; dispute freeze + recorded resolution; double-entry balance + one-paise drift named; correction re-balances; settlement paise-exact + idempotent key + dispute carry-forward.',
  integratesWith: ['P16/P10 calculation engine (paise-exact inputs)', 'P13 state machines (lifecycle gates)', 'P18 human audit (the states P18 checks against humans)'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'workflow-verdicts',
    unit: 'invariants-holding',
    detail: 'Each pattern returns a verdict with its named invariant: the maker/checker gate holds, the dispute freeze holds until a recorded resolution, the double-entry delta is exactly named, and the settlement re-run is a byte-identical no-op.',
  },
  author: 'Created by Tabrej',
};

export function runP17BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  // maker/checker: the maker is refused
  const makerRefused = approvalOutcome(
    [
      { state: 'PENDING', atMin: 0 },
      { state: 'APPROVED', byRole: 'alice', atMin: 5 },
    ],
    { approverRoles: ['manager'], escalationRole: 'director', finalRole: 'director' },
    'alice'
  );
  // reconciliation: a balanced period + a one-paise drift, named
  const ok = reconcilePeriod([
    { account: 'cash', debitPaise: 0, creditPaise: 5000 },
    { account: 'revenue', debitPaise: 5000, creditPaise: 0 },
  ]);
  const drift = reconcilePeriod([
    { account: 'cash', debitPaise: 0, creditPaise: 5000 },
    { account: 'revenue', debitPaise: 4999, creditPaise: 0 },
  ]);
  // settlement: paise-exact + idempotent
  const s1 = settlePeriod({ grossPaise: 40000, commissionBps: 400, feesBps: 200 }, '2026-11-01', 3000);
  const s2 = settlePeriod({ grossPaise: 40000, commissionBps: 400, feesBps: 200 }, '2026-11-01', 3000);
  const invariants = [
    makerRefused.final === 'PENDING' && /maker/.test(makerRefused.reason),
    ok.balanced,
    !drift.balanced && drift.deltaPaise === -1,
    s1.payablePaise === 34600 && s1.nextCarryForwardPaise === 3000,
    s1.idempotentKey === s2.idempotentKey,
  ].filter(Boolean).length;
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: invariants,
    metric: 'workflow-verdicts',
    unit: 'invariants-holding',
    detail: `5 pattern invariants measured: maker/checker gate (maker refused → ${makerRefused.final}), double-entry balance (Δ=${ok.deltaPaise} balanced; drift Δ=${drift.deltaPaise} named), settlement paise-exact (payable ${s1.payablePaise}p, dispute ${s1.nextCarryForwardPaise}p rolled forward), idempotent key stable across re-runs.`,
  };
}
