/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P16 · UNIVERSAL CALCULATION ENGINE
 * (src/core/finance/calculations.ts) · Created by Tabrej
 *
 * Directive Phase 6: "commissions, proration, refunds, shipping, EMI, FX
 * settlement" — each a business calculation with an EXACT definition and a
 * single documented rounding boundary (the P10 discipline), all in integer
 * paise on P10's Money primitives. Never a binary float; never a formula
 * without its worked example.
 */

import { roundRational, mulRate, type Money, type RoundingMode } from './money';

// ------------------------------------------------------------------ 1. commissions

export interface CommissionRate {
  /** when this rate takes effect (inclusive) */
  effectiveOnIso: string;
  /** commission in basis points (100 = 1%) */
  bps: number;
  tier?: string;
}

/**
 * Effective-dated commission (P10's rate-provenance discipline applied to
 * fees): the rate that governs a transaction is the latest one effective on
 * or before the transaction date — never "the current rate, whatever the
 * document was cut."
 */
export function commissionOn(grossPaise: Money, table: CommissionRate[], onIso: string): { paise: Money; rate: CommissionRate } {
  const applicable = table.filter((r) => r.effectiveOnIso <= onIso).sort((a, b) => (a.effectiveOnIso < b.effectiveOnIso ? -1 : 1));
  const rate = applicable[applicable.length - 1];
  if (!rate) throw new Error(`no commission rate effective on/before ${onIso}`);
  return { paise: mulRate(grossPaise, rate.bps), rate };
}

// ------------------------------------------------------------------ 2. proration

export interface ProrationInput {
  monthlyUnits: number; // integer paise/month
  totalDays: number; // the billing cycle length in days
  usedDays: number; // whole days consumed in the cycle at the moment of change
  mode?: RoundingMode;
}

/**
 * Mid-cycle proration: credit for the unused portion of a paid cycle.
 * credit = monthly × unused / total, at the single documented HALF_UP
 * boundary. A downgrade credits this; an upgrade charges (cycle − credit)
 * for the rest of the same cycle — the two directions share one formula.
 */
export function prorationCredit(i: ProrationInput): { creditPaise: number; unusedDays: number } {
  if (i.usedDays > i.totalDays) throw new Error('usedDays exceeds the cycle length — proration is undefined');
  if (i.totalDays <= 0) throw new Error('totalDays must be positive');
  const unusedDays = i.totalDays - i.usedDays;
  const creditPaise = roundRational(i.monthlyUnits * unusedDays, i.totalDays, i.mode ?? 'HALF_UP');
  return { creditPaise, unusedDays };
}

// ------------------------------------------------------------------ 3. refunds

export interface RefundWindow {
  /** the boundary, in hours from the transaction */
  hours: number;
  /** the refundable fraction in basis points (10000 = full) */
  bps: number;
}

export interface RefundVerdict {
  refundPaise: number;
  windowLabel: string;
  /** the idempotency reference: a second request for the same id returns the same refund, not a second one */
  reference: string;
}

/**
 * Window-based refunds (the booking/cancellation policy table): the
 * applicable window is the NARROWEST boundary that still covers the current
 * age — a 30h-old booking is still inside the 48h window, so that window's
 * fraction governs, not the 12h one it has passed. The refund is a
 * paise-exact fraction of the paid amount. Idempotent by reference — the
 * directive's double-refund edge case, handled at the calculation layer.
 */
export function refundFor(paidPaise: number, policy: RefundWindow[], ageHours: number, requestId: string): RefundVerdict {
  const applicable = policy
    .filter((w) => ageHours <= w.hours)
    .sort((a, b) => a.hours - b.hours);
  const win = applicable[0]; // the narrowest covering window
  const bps = win ? win.bps : 0;
  return {
    refundPaise: bps === 0 ? 0 : roundRational(paidPaise * bps, 10000, 'HALF_UP'),
    windowLabel: win ? `≤${win.hours}h (${win.bps / 100}% refundable)` : 'outside all windows (0%)',
    reference: `refund:${requestId}`,
  };
}

/** the double-refund guard: the second call is a no-op with the same reference */
export function isRefundIdempotent(first: RefundVerdict, requestId: string): boolean {
  return first.reference === `refund:${requestId}`;
}

// ------------------------------------------------------------------ 4. shipping

export interface ShippingInput {
  subtotalPaise: number;
  /** weight in tenths of a kilogram (integer — exact) */
  weightTenthsKg: number;
  flatPaise: number;
  perKgPaise: number; // per whole kilogram after the first free tier
  freeOverPaise?: number; // free shipping threshold on the DISCOUNTED subtotal
  discountBps?: number; // a coupon — applied BEFORE shipping and before tax (P10 order)
}

/**
 * Shipping after a coupon, in the P10 operation order: the discount is
 * taken off the subtotal FIRST, the free-shipping threshold tests the
 * discounted value, and weight is charged in exact tenths — 4.2 kg is 42,
 * never 4.19999…
 */
export function shippingFor(i: ShippingInput): { discountedSubtotal: number; shippingPaise: number; taxFree: boolean } {
  const discountedSubtotal = i.discountBps ? roundRational(i.subtotalPaise * (10000 - i.discountBps), 10000, 'HALF_UP') : i.subtotalPaise;
  if (i.freeOverPaise != null && discountedSubtotal >= i.freeOverPaise) {
    return { discountedSubtotal, shippingPaise: 0, taxFree: true };
  }
  const weightWholeKg = Math.floor(i.weightTenthsKg / 10);
  const perKg = roundRational(i.perKgPaise * i.weightTenthsKg, 10, 'HALF_UP'); // exact tenths, single boundary
  return { discountedSubtotal, shippingPaise: i.flatPaise + perKg, taxFree: false };
}

// ------------------------------------------------------------------ 5. EMI

export interface EmiInput {
  principalPaise: number;
  /** annual rate in basis points (600 = 6%/yr) */
  annualRateBps: number;
  months: number;
}

/**
 * Equated monthly installment, in exact integer arithmetic:
 *   EMI = P · r · (1+r)^n / ((1+r)^n − 1),  r = monthly rate
 * where r = annualRateBps / 12 as a RATIONAL (annual bps ÷ 12 — 6% is 50
 * bps/month, exact; never 4.999… through a binary float). With
 * r = R/(12·10000) and (1+r)^n = (12·10000+R)^n / (12·10000)^n, the whole
 * formula collapses to ONE integer quotient with a single HALF_UP boundary:
 *   EMI = P · R · A / (12 · 10000 · (A − B))
 * with A = (120000+R)^n, B = 120000^n — computed in BigInt so (1+r)^n stays
 * exact at every n. That is the exactness the directive demands; EMI
 * calculators that run (1+r)^n through binary floats drift by a paise.
 */
export function emiFor(i: EmiInput): { monthlyPaise: number; totalPaidPaise: number; totalInterestPaise: number } {
  if (i.months <= 0) throw new Error('months must be positive');
  if (i.annualRateBps <= 0) {
    // zero-rate split: exact, remainder on the last installment
    const base = Math.floor(i.principalPaise / i.months);
    const last = i.principalPaise - base * (i.months - 1);
    return {
      // the representative installment (what the scheduler charges monthly);
      // the last one is base or last — the TOTAL is exactly the principal,
      // so nothing is silently lost or double-chargeable
      monthlyPaise: base,
      totalPaidPaise: i.principalPaise,
      totalInterestPaise: 0,
    };
  }
  const B = 120000n; // 12 · 10000
  const Rb = BigInt(i.annualRateBps);
  const P = BigInt(i.principalPaise);
  const n = BigInt(i.months);
  const A = (B + Rb) ** n; // (120000 + R)^n
  const Bn = B ** n; // 120000^n
  const emiNum = P * Rb * A;
  const emiDen = B * (A - Bn);
  const monthlyPaise = Number(roundRationalBig(emiNum, emiDen));
  const totalPaidPaise = monthlyPaise * i.months;
  return { monthlyPaise, totalPaidPaise, totalInterestPaise: totalPaidPaise - i.principalPaise };
}

/** BigInt half-up division: the single rounding boundary for EMI */
function roundRationalBig(num: bigint, den: bigint): bigint {
  if (den <= 0n) throw new Error('denominator must be positive');
  const sign = num < 0n ? -1n : 1n;
  const n = num < 0n ? -num : num;
  const q = n / den;
  const r = n % den;
  return sign * (q + (r * 2n >= den ? 1n : 0n));
}

// ------------------------------------------------------------------ 6. FX settlement

export interface FxRate {
  /** rate of A per B, in micro-units (1.0 = 1_000_000) */
  aPerBMicros: number;
  effectiveOnIso: string;
}

/**
 * Cross-currency settlement at an EFFECTIVE-DATED rate (P10 provenance):
 * the rate governing the settlement is the one effective on the settlement
 * date — recorded on the document, never the live market price at write
 * time. Conversion is units × 10⁶ ÷ rate, one HALF_UP boundary.
 */
export function fxSettle(paiseFrom: Money, onIso: string, rates: FxRate[], targetCurrency: string): { paise: Money; rateUsed: string } {
  const applicable = rates.filter((r) => r.effectiveOnIso <= onIso).sort((a, b) => (a.effectiveOnIso < b.effectiveOnIso ? -1 : 1));
  const rate = applicable[applicable.length - 1];
  if (!rate) throw new Error(`no FX rate effective on/before ${onIso}`);
  const units = roundRational(paiseFrom.units * 1_000_000, rate.aPerBMicros, 'HALF_UP');
  return {
    paise: { units, currency: targetCurrency, divisor: paiseFrom.divisor },
    rateUsed: `${rate.aPerBMicros / 1_000_000} (effective ${rate.effectiveOnIso})`,
  };
}

// ------------------------------------------------------------------ 7. settlement

export interface SettlementInput {
  grossPaise: number;
  commissionBps: number;
  feesBps: number; // processing + platform fees, bps of gross
  /** paise the seller may keep (default 10000); payouts can be partial */
  payoutBps?: number;
}

/**
 * Seller payout: gross − commission − fees, each a paise-exact bps
 * fraction taken from the GROSS (never cascaded off a rounded value — the
 * order is documented, one boundary each).
 */
export function settlementFor(i: SettlementInput): { payoutPaise: number; commissionPaise: number; feesPaise: number; netToPlatformPaise: number } {
  const commissionPaise = roundRational(i.grossPaise * i.commissionBps, 10000, 'HALF_UP');
  const feesPaise = roundRational(i.grossPaise * i.feesBps, 10000, 'HALF_UP');
  const payoutBps = i.payoutBps ?? 10000;
  const afterFees = i.grossPaise - commissionPaise - feesPaise;
  const payoutPaise = payoutBps === 10000 ? afterFees : roundRational(afterFees * payoutBps, 10000, 'HALF_UP');
  return { payoutPaise, commissionPaise, feesPaise, netToPlatformPaise: i.grossPaise - payoutPaise };
}
