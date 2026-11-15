/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P13 · UNIVERSAL DOMAIN INTELLIGENCE
 * (src/core/businessLogic/domainModel.ts) · Created by Tabrej
 *
 * Directive §2: "For every identified domain, investigate: participants and
 * stakeholders, their goals and incentives, business entities, relationships,
 * operational workflows, financial flows, permissions and responsibilities,
 * business constraints, exceptional scenarios, failure and recovery,
 * regulatory considerations, success metrics. Produce a coherent domain model
 * before implementing complex business logic."
 *
 * This is the *structure* of that model — a DomainModel with all twelve
 * investigations. The CONTENT is derived per-category from the P12 category
 * profile (participants, entities, flows, invariants, success metrics) plus
 * the edge-case catalog; a category AETHER has no profile for is derived by
 * first principles from the task text (never a keyword miss).
 */

import { profileFor, type CategoryProfile, type ProjectCategory } from '../projectIntelligence/categories';

export interface Participant {
  role: string;
  goal: string;
  /** what they are incentivized to optimize for */
  incentive: string;
}

export interface BusinessEntity {
  name: string;
  /** the invariants that must always hold for this entity */
  invariants: string[];
}

export interface DomainModel {
  category: ProjectCategory | 'DERIVED';
  label: string;
  participants: Participant[];
  entities: BusinessEntity[];
  workflows: string[];
  financialFlows: string[];
  permissions: string[];
  constraints: string[];
  exceptionalScenarios: string[];
  failureRecovery: string[];
  regulatory: string[];
  successMetrics: string[];
}

// the twelve investigations, keyed per category. Categories not present here
// are derived (first-principles) — that is the honest behavior, not a gap.
interface CategoryDomainSeed {
  participants: Participant[];
  entities: BusinessEntity[];
  workflows: string[];
  financialFlows: string[];
  permissions: string[];
  constraints: string[];
  regulatory: string[];
  successMetrics: string[];
}

const SEEDS: Partial<Record<ProjectCategory, CategoryDomainSeed>> = {
  ECOMMERCE: {
    participants: [
      { role: 'Buyer', goal: 'get the right product at the right price, quickly, with low risk', incentive: 'lowest total cost + fast delivery + easy returns' },
      { role: 'Seller', goal: 'sell inventory at margin', incentive: 'units × margin, less returns/chargebacks' },
      { role: 'Platform', goal: 'grow GMV and take-rate', incentive: 'commission + ad revenue, minus fraud + support cost' },
      { role: 'Fulfilment/Carrier', goal: 'deliver on time, cheaply', incentive: 'on-time % , cost per parcel' },
    ],
    entities: [
      { name: 'Product / Variant / SKU', invariants: ['exactly one price per variant at any instant', 'stock ≥ 0; a confirmed order implies reserved stock'] },
      { name: 'Order', invariants: ['lifecycle state machine (P13)', 'paid orders never regress to unpaid without a refund'] },
      { name: 'Inventory', invariants: ['reservations sum ≤ on-hand', 'two buyers cannot confirm the last unit'] },
      { name: 'Payment / Ledger', invariants: ['integer paise; sum of debits = sum of credits', 'idempotent per order'] },
    ],
    workflows: ['discover → filter → detail → cart → checkout → pay → fulfil → deliver → return', 'stock reservation on cart, release on expiry', 'price re-quote at order time (stale-cart guard)'],
    financialFlows: ['buyer → platform (order value)', 'platform → seller (minus commission)', 'refund → buyer (partial/full, paise-exact)', 'commission accrual on confirmed (not captured) orders'],
    permissions: ['buyer: view/own their orders; seller: manage their listings+stock; platform: commission + dispute; carrier: delivery events'],
    constraints: ['no overselling the last unit', 'no charging a price the buyer did not see', 'returns window per category', 'FX at charge vs settlement for multi-currency'],
    regulatory: ['consumer protection (returns/warranty)', 'tax jurisdiction (place of supply)', 'payment-card rules (PCI scope)'],
    successMetrics: ['conversion rate (with definition + source of truth)', 'GMV + take-rate', 'units-sold race integrity (never > on-hand)', 'chargeback rate'],
  },
  SAAS: {
    participants: [
      { role: 'Tenant (org)', goal: 'the software pays for itself', incentive: 'outcome per seat' },
      { role: 'Member', goal: 'do their job faster', incentive: 'less click-through' },
      { role: 'Admin', goal: 'keep the org in policy', incentive: 'fewer exceptions, full audit' },
      { role: 'Vendor', goal: 'MRR + net-revenue-retention', incentive: 'low churn, upsell, no usage disputes' },
    ],
    entities: [
      { name: 'Tenant / Membership', invariants: ['every data row is tenant-scoped', 'a member belongs to exactly one active role per tenant'] },
      { name: 'Plan / Entitlement', invariants: ['usage ≤ plan limits, else explicit overage', 'downgrade cannot void in-progress entitlements past their term'] },
      { name: 'Usage / Metering', invariants: ['metered values are reconcilable to the ledger', 'no double-count on replay (idempotent metering)'] },
      { name: 'Subscription (P13 machine)', invariants: ['dunning flow is explicit; a lapsed sub cannot bill', 'proration is paise-exact on change'] },
    ],
    workflows: ['onboard → activate → usage → renew/downgrade → dunning → cancel', 'usage metering outbox → billing', 'admin: member + role + scope changes, fully audited'],
    financialFlows: ['tenant → vendor (plan + usage)', 'proration credit on change', 'dunning: capture retries + final', 'refunds + chargebacks against MRR'],
    permissions: ['owner: billing + destructive; admin: members+policy; member: own scope; system: metering+billing'],
    constraints: ['no cross-tenant read/write (P11 tenancy)', 'no silent downgrade of in-flight entitlements', 'metering must be replay-safe'],
    regulatory: ['data residency per tenant', 'DPA + deletion on request', 'audit retention'],
    successMetrics: ['NRR + churn (definition + source of truth)', 'activation rate', 'usage accuracy (metered vs invoiced, paise)', 'MRR + expansion'],
  },
  FINANCIAL: {
    participants: [
      { role: 'Payer', goal: 'correct, timely, reconcilable payments', incentive: 'no overcharge, instant proof' },
      { role: 'Payee', goal: 'reliable settlement', incentive: 'fewer failed charges + disputes' },
      { role: 'Ledger/Reconciler', goal: 'the books always balance', incentive: 'sum(debits)=sum(credits) at all times' },
      { role: 'Auditor', goal: 'replay any transaction to the paise', incentive: 'immutable, effective-dated records' },
    ],
    entities: [
      { name: 'Double-entry Ledger', invariants: ['sum(debits)=sum(credits) in every posted period', 'entries are immutable (correction = new entry, never edit)'] },
      { name: 'Transaction', invariants: ['idempotent (client key)', 'a captured txn reconciles to provider state'] },
      { name: 'Proration / Settlement', invariants: ['paise-exact; effective-dated rates; no double settlement'] },
      { name: 'Audit Trail', invariants: ['every mutation has a cause + actor + time; append-only'] },
    ],
    workflows: ['author → capture → settle → reconcile → report', 'dispute: chargeback → hold → resolve (paise)', 'correction: journal the reversal, never rewrite'],
    financialFlows: ['every flow is a ledger path: debit one account, credit another; money never appears from nowhere'],
    permissions: ['maker/checker on journal posts', 'separation of duties between capture and reconcile', 'immutable-audit read for auditor role'],
    constraints: ['no binary float for money (P10)', 'no un-acknowledged destructive migration (P11)', 'FX rate is effective-dated + recorded'],
    regulatory: ['tax jurisdiction + effective dates (P10 rate provenance)', 'record retention', 'segregation of duties'],
    successMetrics: ['ledger balance integrity (always 0 net)', 'settlement accuracy (paise)', 'dispute rate + chargeback %', 'audit replay completeness'],
  },
  MARKETPLACE: {
    participants: [
      { role: 'Buyer', goal: 'best value, trusted seller', incentive: 'low cost + low risk' },
      { role: 'Seller', goal: 'net payout after commission', incentive: 'volume × (price − commission)' },
      { role: 'Platform', goal: 'GMV + take-rate + net-revenue', incentive: 'fewer disputes, higher liquidity' },
      { role: 'Dispute/Moderation', goal: 'resolve fairly, fast', incentive: 'resolution SLA, reversal rate' },
    ],
    entities: [
      { name: 'Listing + Escrow', invariants: ['escrow holds until delivery confirmed', 'a delisted listing cannot accept new bids'] },
      { name: 'Settlement / Payout', invariants: ['payout = price − commission − fees, paise-exact', 'no double payout (idempotent)'] },
      { name: 'Dispute', invariants: ['dispute freezes the funds it covers', 'resolution is recorded, not silent'] },
    ],
    workflows: ['list → match → hold escrow → deliver → release → settle', 'dispute: freeze → evidence → resolve → release/refund'],
    financialFlows: ['buyer → escrow → seller (net)', 'commission accrues on release', 'dispute reversal to buyer'],
    permissions: ['seller: own listings; platform: commission+escrow; moderation: disputes; buyer: own orders+disputes'],
    constraints: ['no payout before delivery confirmed', 'commission is effective-dated (policy table)', 'cross-seller isolation'],
    regulatory: ['marketplace liability + consumer rules', 'tax on net proceeds'],
    successMetrics: ['GMV + take-rate', 'payout accuracy (paise)', 'dispute rate + reversal %', 'liquidity (time-to-match)'],
  },
};

/**
 * Derive a coherent domain model for a category. Known categories use the
 * recorded seed (participants/entities/flows/invariants/metrics); UNSEEN
 * returns the FIRST-PRINCIPLES skeleton so the caller fills it from the
 * stated problem — the directive's "derive from first principles," never a
 * silent keyword miss.
 */
export function deriveDomainModel(category: ProjectCategory | 'UNSEEN', profile?: CategoryProfile): DomainModel {
  const seed = SEEDS[category];
  if (seed) {
    return {
      category,
      label: profileFor(category)?.label ?? category,
      ...seed,
      exceptionalScenarios: profile?.edgeDomains ?? [],
      failureRecovery: (profile?.edgeDomains ?? []).map((e) => 'recovery: ' + e),
    };
  }
  // UNSEEN: the first-principles skeleton, named as derived
  return {
    category: 'DERIVED',
    label: profileFor('UNSEEN')?.label ?? 'derived domain',
    participants: [{ role: 'primary user', goal: '(state the user problem)', incentive: '(what they optimize for)' }],
    entities: [{ name: '(the thing the product manages)', invariants: ['name the invariants that must always hold'] }],
    workflows: ['(the happy path)', '(the exception path)'],
    financialFlows: ['(money in)', '(money out)', '(refunds/reversals, paise-exact)'],
    permissions: ['(who can do what, server-enforced)'],
    constraints: ['(the rules that must never break)'],
    exceptionalScenarios: ['(the failure the user has not described — P13 edge-case engine surfaces it)'],
    failureRecovery: ['(recovery for each exception)'],
    regulatory: ['(the rules that apply to this domain — verify, do not invent)'],
    successMetrics: ['(the metric that proves it works, with its definition + source of truth)'],
  };
}
