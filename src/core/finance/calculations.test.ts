/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P16 TEST · universal calculation engine
 * (src/core/finance/calculations.test.ts) · Created by Tabrej
 *
 * Phase 6: every calculation is paise-exact with a single documented
 * rounding boundary — the expected values below are hand-computed, so a
 * regression in the arithmetic (a binary float sneaking in, a wrong
 * operation order) fails loudly.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { commissionOn, prorationCredit, refundFor, isRefundIdempotent, shippingFor, emiFor, fxSettle, settlementFor } from './calculations';
import { mulRate, roundRational } from './money';

test('commission: the rate effective on/before the transaction date governs (not the current rate)', () => {
  const table = [
    { effectiveOnIso: '2025-01-01', bps: 300, tier: 'legacy' },
    { effectiveOnIso: '2026-01-01', bps: 400, tier: 'current' },
  ];
  const gross = { units: 490000, currency: 'INR', divisor: 100 };
  const old = commissionOn(gross, table, '2025-06-01');
  const newTxn = commissionOn(gross, table, '2026-03-01');
  assert.equal(old.paise.units, 14700); // 490000 × 300/10000 = 14700
  assert.equal(newTxn.paise.units, 19600); // × 400/10000 = 19600
  assert.equal(old.rate.tier, 'legacy');
  assert.equal(newTxn.rate.tier, 'current');
  assert.throws(() => commissionOn(gross, table, '2024-01-01'), /no commission rate effective/);
});

test('proration: credit = monthly × unused / total, single HALF_UP boundary, paise-exact', () => {
  // 30-day cycle, 10 days used → 20 unused → 45000 × 20 / 30 = 30000 exactly
  assert.deepEqual(prorationCredit({ monthlyUnits: 45000, totalDays: 30, usedDays: 10 }), { creditPaise: 30000, unusedDays: 20 });
  // 45000 × 18 / 30 = 27000 exact
  assert.equal(prorationCredit({ monthlyUnits: 45000, totalDays: 30, usedDays: 12 }).creditPaise, 27000);
  // a non-exact split: 1000 × 1 / 3 = 333.33… → 333 HALF_UP
  assert.equal(prorationCredit({ monthlyUnits: 1000, totalDays: 3, usedDays: 2 }).creditPaise, 333);
  assert.throws(() => prorationCredit({ monthlyUnits: 100, totalDays: 10, usedDays: 11 }), /usedDays exceeds/);
});

test('refund: window fractions are paise-exact; a double request is idempotent (same reference)', () => {
  const policy = [
    { hours: 12, bps: 10000 },
    { hours: 48, bps: 5000 },
    { hours: 120, bps: 2500 },
  ];
  // paid 8000: 5h → full (8000), 30h → 50% (4000), 200h → 0
  assert.equal(refundFor(8000, policy, 5, 'req-1').refundPaise, 8000);
  assert.equal(refundFor(8000, policy, 30, 'req-2').refundPaise, 4000);
  const outside = refundFor(8000, policy, 200, 'req-3');
  assert.equal(outside.refundPaise, 0);
  assert.match(outside.windowLabel, /outside all windows/);
  // the double-refund guard: a second request for the same id is the same reference
  assert.equal(isRefundIdempotent(refundFor(8000, policy, 5, 'req-1'), 'req-1'), true);
  // a non-exact fraction: 9999 × 5000/10000 = 4999.5 → 5000 HALF_UP
  assert.equal(refundFor(9999, policy, 30, 'req-4').refundPaise, 5000);
});

test('shipping: the discount applies BEFORE the free threshold; weight is exact tenths', () => {
  // subtotal 50000, 10% coupon → 45000; freeOver 50000 tests the DISCOUNTED value (45000 < 50000) → charge
  const r = shippingFor({ subtotalPaise: 50000, weightTenthsKg: 42, flatPaise: 100, perKgPaise: 50, freeOverPaise: 50000, discountBps: 1000 });
  assert.equal(r.discountedSubtotal, 45000);
  assert.equal(r.shippingPaise, 100 + 210); // flat + 4.2kg × 50 = 210 (exact tenths, single boundary)
  // over the threshold after discount → free
  const free = shippingFor({ subtotalPaise: 60000, weightTenthsKg: 42, flatPaise: 100, perKgPaise: 50, freeOverPaise: 50000, discountBps: 1000 });
  assert.equal(free.discountedSubtotal, 54000);
  assert.equal(free.shippingPaise, 0);
  assert.equal(free.taxFree, true);
  // a fractional weight: 0.3 kg × 50 = 15 paise (3 × 50 / 10), never 0.2999…
  const w = shippingFor({ subtotalPaise: 1000, weightTenthsKg: 3, flatPaise: 0, perKgPaise: 50 });
  assert.equal(w.shippingPaise, 15);
});

test('EMI: zero-rate splits exactly (no drift); interest cases are monotonic and paise-consistent', () => {
  // 10000 paise / 12 months at 0%: base 833 × 11 + last 837 = exactly 10000,
  // no interest, no drift — total paid is the principal itself
  const z = emiFor({ principalPaise: 10000, annualRateBps: 0, months: 12 });
  assert.equal(z.monthlyPaise, 833);
  assert.equal(z.totalPaidPaise, 10000, 'zero-rate: total paid is exactly the principal (remainder on the last installment)');
  assert.equal(z.totalInterestPaise, 0);
  // interest: total interest = totalPaid − principal, exactly, for any rate
  for (const bps of [1200, 1800, 3600]) {
    const e = emiFor({ principalPaise: 100000, annualRateBps: bps, months: 12 });
    assert.equal(e.totalPaidPaise, e.monthlyPaise * 12, `total is the installment × months for ${bps}bps`);
    assert.equal(e.totalInterestPaise, e.totalPaidPaise - 100000);
    assert.ok(e.totalInterestPaise > 0, `interest is positive at ${bps}bps/yr`);
  }
  // monotonic: higher rate → strictly higher installment
  const lo = emiFor({ principalPaise: 100000, annualRateBps: 1200, months: 12 });
  const hi = emiFor({ principalPaise: 100000, annualRateBps: 3600, months: 12 });
  assert.ok(hi.monthlyPaise > lo.monthlyPaise);
  // 8%/yr, 100000 paise, 12 months: independent decimal reference
  // P·i/(1−(1+i)^-n) = 100000·(0.08/12)/(1−1.006667^-12) = 8698.84 → 8699.
  // The engine's BigInt result must agree with the float reference to the paise.
  const r8 = emiFor({ principalPaise: 100000, annualRateBps: 800, months: 12 });
  assert.equal(r8.monthlyPaise, 8699, `8% EMI = 8699 (got ${r8.monthlyPaise})`);
});

test('fxSettle: the effective-dated rate governs; conversion is units × 10⁶ / rate, one boundary', () => {
  const rates = [
    { aPerBMicros: 1_000_000, effectiveOnIso: '2025-01-01' },
    { aPerBMicros: 1_100_000, effectiveOnIso: '2026-01-01' },
  ];
  const inr = { units: 10000, currency: 'INR', divisor: 100 };
  const old = fxSettle(inr, '2025-06-01', rates, 'USD');
  assert.equal(old.paise.units, 10000); // 1:1
  assert.match(old.rateUsed, /1 \(effective 2025-01-01\)/);
  const recent = fxSettle(inr, '2026-06-01', rates, 'USD');
  // 10000 × 10⁶ / 1.1×10⁶ = 9090.909… → 9091 HALF_UP
  assert.equal(recent.paise.units, 9091);
  assert.equal(recent.paise.currency, 'USD');
  assert.throws(() => fxSettle(inr, '2024-01-01', rates, 'USD'), /no FX rate effective/);
});

test('settlement: payout = gross − commission − fees (each off the GROSS, one boundary each), paise-exact', () => {
  const s = settlementFor({ grossPaise: 40000, commissionBps: 400, feesBps: 200 });
  assert.equal(s.commissionPaise, 1600); // 40000 × 400/10000
  assert.equal(s.feesPaise, 800); // 40000 × 200/10000
  assert.equal(s.payoutPaise, 37600);
  assert.equal(s.netToPlatformPaise, 2400);
  // non-exact: 9999 × 400/10000 = 399.96 → 400 HALF_UP; fees 9999×200/10000 = 199.98 → 200
  const n = settlementFor({ grossPaise: 9999, commissionBps: 400, feesBps: 200 });
  assert.equal(n.commissionPaise, 400);
  assert.equal(n.feesPaise, 200);
  assert.equal(n.payoutPaise, 9999 - 400 - 200);
  // partial payout: 50% of the post-fee net
  const p = settlementFor({ grossPaise: 10000, commissionBps: 0, feesBps: 0, payoutBps: 5000 });
  assert.equal(p.payoutPaise, 5000);
});

test('cross-check against P10 primitives: a commission at 10000 bps returns the exact input', () => {
  const gross = { units: 12345, currency: 'INR', divisor: 100 };
  assert.equal(mulRate(gross, 10000).units, 12345);
  assert.equal(mulRate(gross, 0).units, 0);
  assert.equal(roundRational(7, 2, 'HALF_UP'), 4);
  assert.equal(roundRational(5, 2, 'HALF_UP'), 3);
});
