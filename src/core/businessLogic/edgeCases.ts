/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P13 · EDGE-CASE INTELLIGENCE
 * (src/core/businessLogic/edgeCases.ts) · Created by Tabrej
 *
 * Directive §3D: "Actively search for scenarios that ordinary implementations
 * overlook." An edge case here is a *scenario with an expected outcome* —
 * the directive demands each important one be defined AND tested, so the
 * catalog carries both the scenario and its required invariant.
 */

export interface EdgeCase {
  id: string;
  /** the concrete, ordinary-sounding scenario */
  scenario: string;
  /** the outcome a correct system must produce (the invariant) */
  expectedOutcome: string;
  /** the test that must exist */
  testInvariant: string;
  /** the category(s) this case bites hardest in */
  categories: string[];
}

export const EDGE_CASES: EdgeCase[] = [
  {
    id: 'EDGE-LAST-ITEM-RACE',
    scenario: 'two customers purchase the final available item simultaneously',
    expectedOutcome: 'exactly one order confirms; the other is told stock is gone (or offered waitlist) — never two confirmations against one unit',
    testInvariant: 'concurrent-charge race: N parallel buys of 1 unit → exactly 1 success; ledger + stock reconcile',
    categories: ['ECOMMERCE', 'MARKETPLACE', 'BOOKING', 'FINANCIAL'],
  },
  {
    id: 'EDGE-CHARGE-TIMEOUT',
    scenario: 'a payment succeeds at the provider but the response times out',
    expectedOutcome: 'the order is NOT double-charged and NOT lost: reconciliation against provider state resolves the unknown; the customer sees one payment',
    testInvariant: 'charge-then-timeout: simulate provider success + lost ack → reconciler marks paid exactly once',
    categories: ['FINANCIAL', 'ECOMMERCE', 'MARKETPLACE'],
  },
  {
    id: 'EDGE-SUB-EXPIRES-MID-TRANSACTION',
    scenario: 'a subscription expires in the middle of an active transaction',
    expectedOutcome: 'the in-flight transaction completes (grace covers it); new transactions are rejected cleanly',
    testInvariant: 'expiry-during-flight: subscription lapses while a cart checkout is in PaymentPending → checkout completes, next one is blocked',
    categories: ['SAAS', 'CREATOR_DIGITAL', 'FINANCIAL'],
  },
  {
    id: 'EDGE-CANCEL-AFTER-PARTIAL-PAYMENT',
    scenario: 'a booking is cancelled after a partial payment has been captured',
    expectedOutcome: 'the partial capture is refunded per the policy table; the cancellation record carries the refund amount + policy applied',
    testInvariant: 'partial-cancel: cancel in each policy window → refund amounts match the policy table exactly (paise)',
    categories: ['BOOKING', 'TRAVEL_HOSPITALITY', 'FINANCIAL'],
  },
  {
    id: 'EDGE-PRICE-CHANGE-AFTER-CART',
    scenario: 'a seller changes a product price after a buyer added it to their cart',
    expectedOutcome: 'the buyer is re-quoted at order time; no silent charge at a price they did not see',
    testInvariant: 'cart-stale-price: price changes while in cart → checkout re-quotes and re-confirms; ledger records both prices',
    categories: ['ECOMMERCE', 'MARKETPLACE'],
  },
  {
    id: 'EDGE-DOUBLE-REFUND',
    scenario: 'a refund is requested twice (double-click, replay, or dispute + admin)',
    expectedOutcome: 'one refund, ever: the second request is idempotent (no-op with the existing refund id) or rejected with a reference',
    testInvariant: 'double-refund: two concurrent refund requests → exactly one ledger reversal',
    categories: ['FINANCIAL', 'MARKETPLACE', 'ECOMMERCE'],
  },
  {
    id: 'EDGE-ADMIN-LOST',
    scenario: 'an administrator loses access to their organization (locked out, departed, wrong tenant)',
    expectedOutcome: 'a recovery path exists that does NOT require the locked admin (break-glass with audit), and the org is not bricked',
    testInvariant: 'admin-bricked: remove the last active admin → break-glass recovery is auditable and revocable',
    categories: ['SAAS', 'INTERNAL_BUSINESS', 'ERP'],
  },
  {
    id: 'EDGE-MULTI-ORG-USER',
    scenario: 'a user belongs to multiple organizations and acts without picking which one',
    expectedOutcome: 'every action is explicit about its target org; a cross-org leak is impossible even when the session holds both tokens',
    testInvariant: 'org-switch: with memberships in A+B, every API call resolves a single org; an A-scoped resource is never returned under B',
    categories: ['SAAS', 'SOCIAL_COMMUNITY', 'MARKETPLACE'],
  },
  {
    id: 'EDGE-DELIVERED-THEN-FAILED',
    scenario: 'a delivery provider reports failure after an order was marked delivered',
    expectedOutcome: 'the order enters a recovery state (re-delivery or return-to-seller); the delivered audit row is amended, not overwritten',
    testInvariant: 'late-failure: delivered → provider-failure event → state machine moves to recovery, audit trail shows both rows',
    categories: ['LOGISTICS', 'ECOMMERCE'],
  },
  {
    id: 'EDGE-EXTERNAL-MID-WORKFLOW',
    scenario: 'an external API becomes unavailable halfway through a multi-step workflow',
    expectedOutcome: 'the workflow pauses at a durable checkpoint; on provider recovery it resumes from the checkpoint, not from step 1; no step is double-applied',
    testInvariant: 'mid-workflow-outage: kill the provider at step 3 of 5 → resume applies steps 4-5 exactly once',
    categories: ['API_INFRASTRUCTURE', 'SAAS', 'MARKETPLACE', 'TRAVEL_HOSPITALITY'],
  },
  {
    id: 'EDGE-CAPACITY-OVERBOOK',
    scenario: 'two reservations hold the last capacity slot at the same instant',
    expectedOutcome: 'one hold wins atomically; the other receives the next-available or a decline-with-reason',
    testInvariant: 'capacity race: parallel holds of the last slot → exactly one holds; the waitlist fires for the loser',
    categories: ['BOOKING', 'TRAVEL_HOSPITALITY', 'EDUCATION'],
  },
  {
    id: 'EDGE-DATA-CORRUPTED-EXPORT',
    scenario: 'an export of tenant data is interrupted (crash mid-write, stale cursor)',
    expectedOutcome: 'the export is resumable or fully discarded — never a half-written file presented as complete',
    testInvariant: 'interrupted-export: kill mid-export → the artifact is flagged incomplete or absent, never truncated-but-claimed-complete',
    categories: ['DATA_INTENSIVE', 'ERP', 'INTERNAL_BUSINESS'],
  },
];

/**
 * The discovery query: given the categories a project classifies under (P12),
 * return the edge cases it OWES — the directive's "identify these when
 * relevant." Deterministic: a set of categories in, a stable set out.
 */
export function edgeCasesFor(categories: string[]): EdgeCase[] {
  const wanted = new Set(categories);
  const hits = EDGE_CASES.filter((e) => e.categories.some((c) => wanted.has(c)));
  // stable order: by id, so two runs produce the same catalog
  return hits.sort((a, b) => (a.id < b.id ? -1 : 1));
}

/**
 * §12 (metric discipline): an edge case is "covered" only when its invariant
 * is named in the test plan. This is the measurable check that the case was
 * defined AND tested, not merely listed.
 */
export function edgeCaseCoverage(catalog: EdgeCase[], testPlan: string): { covered: string[]; uncovered: string[] } {
  const plan = testPlan.toLowerCase();
  const covered: string[] = [];
  const uncovered: string[] = [];
  for (const e of catalog) {
    // a case counts as planned when its id OR its invariant keywords appear
    const key = e.testInvariant.split(/[ :;]/)[0].toLowerCase();
    if (plan.includes(e.id.toLowerCase()) || plan.includes(key)) covered.push(e.id);
    else uncovered.push(e.id);
  }
  return { covered, uncovered };
}
