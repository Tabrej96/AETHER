/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P13 · LIFECYCLE STATE-MACHINE INTELLIGENCE
 * (src/core/businessLogic/stateMachine.ts) · Created by Tabrej
 *
 * Directive §3B: "Identify the lifecycle of important entities. Define:
 * allowed transitions, forbidden transitions, transition permissions,
 * preconditions, side effects, audit events, timeouts, cancellation rules,
 * recovery procedures. Prevent impossible states."
 *
 * So: a LifecycleMachine is a closed, validated state model.
 * `validateTransition` is the runtime gate (an illegal hop is rejected with
 * the concrete reason), and `detectImpossibleStates` is the review gate —
 * given observed state pairs, it names every observed transition the model
 * forbids, and every forbidden pair the model claims to prevent.
 */

export interface TransitionRule {
  from: string;
  to: string;
  /** who may take it (role string or '*') */
  permission?: string;
  /** the guard that must hold (e.g. 'paymentConfirmed', 'withinCancellationWindow') */
  precondition?: string;
  /** side effects fired on entry (e.g. 'charge_payment', 'notify_customer') */
  sideEffects?: string[];
  /** audit event recorded */
  auditEvent?: string;
  /** how long the target state may sit before it must move (e.g. '24h') */
  timeout?: string;
  /** cancellation policy that applies in the target state */
  cancellation?: 'FULL' | 'PARTIAL' | 'NONE';
}

export interface LifecycleMachine {
  entity: string;
  states: string[];
  initial: string;
  terminal: string[];
  rules: TransitionRule[];
}

export interface TransitionVerdict {
  allowed: boolean;
  reason: string;
}

/** closed-set validation: the machine must be well-formed or it is refused */
export function validateMachine(m: LifecycleMachine): string[] {
  const problems: string[] = [];
  const known = new Set(m.states);
  if (!known.has(m.initial)) problems.push(`initial state '${m.initial}' is not in the state set`);
  for (const t of m.terminal) if (!known.has(t)) problems.push(`terminal state '${t}' is not in the state set`);
  for (const r of m.rules) {
    if (!known.has(r.from)) problems.push(`rule ${r.from}->${r.to}: unknown from-state '${r.from}'`);
    if (!known.has(r.to)) problems.push(`rule ${r.from}->${r.to}: unknown to-state '${r.to}'`);
    if (m.terminal.includes(r.from)) problems.push(`terminal state '${r.from}' must have no outgoing rules`);
  }
  return problems;
}

/** the runtime gate: is this hop legal RIGHT NOW? */
export function validateTransition(m: LifecycleMachine, from: string, to: string, actor?: string): TransitionVerdict {
  const issues = validateMachine(m);
  if (issues.length) return { allowed: false, reason: `machine invalid: ${issues[0]}` };
  const rule = m.rules.find((r) => r.from === from && r.to === to);
  if (!rule) return { allowed: false, reason: `no rule ${from}->${to}: impossible state transition (model forbids it)` };
  if (actor && rule.permission && rule.permission !== '*' && actor !== rule.permission) {
    return { allowed: false, reason: `${actor} lacks permission '${rule.permission}' for ${from}->${to}` };
  }
  return { allowed: true, reason: `legal: ${from}->${to}${rule.precondition ? ` (precondition: ${rule.precondition})` : ''}` };
}

/**
 * The review gate (§3B "prevent impossible states"): every OBSERVED
 * transition that the model forbids is a concrete defect — this is how a
 * "delivered-then-failed" shipment scan is caught.
 */
export function detectImpossibleStates(m: LifecycleMachine, observed: Array<{ from: string; to: string }>): string[] {
  const defects: string[] = [];
  for (const o of observed) {
    const v = validateTransition(m, o.from, o.to);
    if (!v.allowed) defects.push(`observed ${o.from}->${o.to}: ${v.reason}`);
  }
  // unreachable states are also a model defect (a state nothing can enter
  // can never legally hold — the directive's "impossible state")
  const enterable = new Set(m.rules.map((r) => r.to));
  for (const s of m.states) {
    if (s !== m.initial && !enterable.has(s) && !m.terminal.includes(s)) {
      defects.push(`state '${s}' is unreachable — no legal path enters it`);
    }
  }
  return defects;
}

// ------------------------------------------------------------ built-in machines

/** the canonical order lifecycle the directive names — with the gaps closed */
export const ORDER_LIFECYCLE: LifecycleMachine = {
  entity: 'Order',
  states: ['Draft', 'Submitted', 'PaymentPending', 'Confirmed', 'Processing', 'Dispatched', 'Delivered', 'Completed', 'Cancelled', 'Refunded'],
  initial: 'Draft',
  terminal: ['Completed', 'Refunded'],
  rules: [
    { from: 'Draft', to: 'Submitted', permission: '*', auditEvent: 'order.submitted' },
    { from: 'Submitted', to: 'PaymentPending', permission: '*', auditEvent: 'order.payment_requested', sideEffects: ['create_payment_intent', 'lock_inventory'] },
    { from: 'PaymentPending', to: 'Confirmed', permission: 'system', precondition: 'payment_captured', auditEvent: 'order.confirmed', sideEffects: ['release_inventory_holds', 'notify_fulfilment'] },
    { from: 'PaymentPending', to: 'Cancelled', permission: 'system', precondition: 'payment_failed_or_timeout', auditEvent: 'order.cancelled_payment', sideEffects: ['release_inventory_holds'] , timeout: '24h' },
    { from: 'Confirmed', to: 'Processing', permission: 'fulfilment', auditEvent: 'order.processing' },
    { from: 'Processing', to: 'Dispatched', permission: 'fulfilment', precondition: 'carrier_label_created', auditEvent: 'order.dispatched', sideEffects: ['notify_customer_tracking'] },
    { from: 'Dispatched', to: 'Delivered', permission: 'carrier', auditEvent: 'order.delivered' },
    { from: 'Delivered', to: 'Completed', permission: 'system', precondition: 'within_return_window', auditEvent: 'order.completed', cancellation: 'NONE' },
    { from: 'Delivered', to: 'Refunded', permission: 'support', precondition: 'refund_authorized', sideEffects: ['reverse_payment', 'reconcile_ledger'], auditEvent: 'order.refunded', cancellation: 'PARTIAL' },
    { from: 'Submitted', to: 'Cancelled', permission: '*', precondition: 'before_payment', auditEvent: 'order.cancelled_pre_payment', cancellation: 'FULL' },
    { from: 'Confirmed', to: 'Cancelled', permission: 'support', precondition: 'before_processing', sideEffects: ['reverse_payment', 'release_inventory_holds'], auditEvent: 'order.cancelled_confirmed', cancellation: 'FULL' },
  ],
};

/** subscription lifecycle — the "expires mid-transaction" gap is explicit */
export const SUBSCRIPTION_LIFECYCLE: LifecycleMachine = {
  entity: 'Subscription',
  states: ['Trial', 'Active', 'Paused', 'PastDue', 'GracePeriod', 'Cancelled', 'Churned', 'Refunded'],
  initial: 'Trial',
  terminal: ['Churned', 'Refunded'],
  rules: [
    { from: 'Trial', to: 'Active', permission: '*', precondition: 'payment_method_valid', auditEvent: 'sub.activated', sideEffects: ['charge_first_cycle'] },
    { from: 'Active', to: 'Paused', permission: '*', auditEvent: 'sub.paused' },
    { from: 'Paused', to: 'Active', permission: '*', auditEvent: 'sub.resumed' },
    { from: 'Active', to: 'PastDue', permission: 'system', precondition: 'renewal_charge_failed', auditEvent: 'sub.past_due', sideEffects: ['start_dunning', 'suspend_access_on_grace_expiry'], timeout: 'grace_window' },
    { from: 'PastDue', to: 'GracePeriod', permission: 'system', auditEvent: 'sub.grace', timeout: '3d' },
    { from: 'GracePeriod', to: 'Active', permission: 'system', precondition: 'renewal_succeeded', auditEvent: 'sub.recovered' },
    { from: 'GracePeriod', to: 'Churned', permission: 'system', precondition: 'dunning_exhausted', auditEvent: 'sub.churned', cancellation: 'NONE' },
    { from: 'Active', to: 'Cancelled', permission: '*', auditEvent: 'sub.cancelled_scheduled', timeout: 'cycle_end' },
    { from: 'Cancelled', to: 'Refunded', permission: 'support', precondition: 'refund_authorized', sideEffects: ['prorate_credit', 'reverse_ledger'], auditEvent: 'sub.refunded' },
  ],
};
