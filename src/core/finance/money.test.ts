/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — CALCULATION INTELLIGENCE · MONEY (boundary + known-value + property)
 * (src/core/finance/money.test.ts) · Created by Tabrej
 *
 * The directive's calculation-verification requirement: "Test with normal,
 * extreme and invalid inputs" and "Use known expected values."
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { format, money, mulRate, parse, roundRational, sum } from './money';

test('money() snaps a human amount to exact integer units', () => {
  assert.deepEqual(money(12.34, 'INR'), { units: 1234, currency: 'INR', divisor: 100 });
  assert.deepEqual(money(0, 'USD'), { units: 0, currency: 'USD', divisor: 100 });
  // 12.345 * 100 -> 1234.5 -> round -> 1235 (half-up at the entry boundary)
  assert.equal(money(12.345, 'INR').units, 1235);
});

test('sum() is exact integer addition (no float drift)', () => {
  // 0.1 + 0.2 in binary float = 0.30000000000000004; in paise it is EXACT
  const total = sum([money(0.1), money(0.2)]);
  assert.equal(total.units, 30); // exactly 30 paise, not 29.999...
  assert.equal(format(total, '₹'), '₹ 0.30');
});

test('mulRate() applies one rounding boundary — the canonical money×rate step', () => {
  // 1800 paise (₹18.00) at 18% (1800bps) = ₹3.24 exactly
  assert.deepEqual(mulRate(money(18.0), 1800), { units: 324, currency: 'INR', divisor: 100 });
  // 333 paise at 18% = 59.94 -> rounds to 60 paise (HALF_UP)
  assert.equal(mulRate(money(3.33), 1800).units, 60);
  // zero rate -> zero
  assert.equal(mulRate(money(999), 0).units, 0);
});

test('roundRational() boundary cases across all modes', () => {
  // HALF_UP
  assert.equal(roundRational(5, 10, 'HALF_UP'), 1); // 0.5 -> 1
  assert.equal(roundRational(4, 10, 'HALF_UP'), 0); // 0.4 -> 0
  // HALF_EVEN (banker's): 0.5 -> 0 (even), 1.5 -> 2 (even)
  assert.equal(roundRational(5, 10, 'HALF_EVEN'), 0);
  assert.equal(roundRational(15, 10, 'HALF_EVEN'), 2);
  // DOWN / UP
  assert.equal(roundRational(7, 10, 'DOWN'), 0);
  assert.equal(roundRational(1, 10, 'UP'), 1);
  // negative (refunds / credit notes)
  assert.equal(roundRational(-5, 10, 'HALF_UP'), -1);
});

test('roundRational() rejects a non-positive denominator (invalid input)', () => {
  assert.throws(() => roundRational(10, 0, 'HALF_UP'), /positive/);
});

test('parse() reads comma-grouped and negative amounts into integer paise', () => {
  assert.equal(parse('1,234.56').units, 123456);
  assert.equal(parse('-99.99').units, -9999);
  assert.equal(parse('12.3').units, 1230);
  assert.equal(parse('').units, 0);
});

test('format() round-trips through parse() without drift', () => {
  const orig = money(4213.42, 'INR');
  const rt = parse(format(orig, ''), 'INR');
  assert.equal(rt.units, orig.units);
});

test('property: sum of n equal amounts scales linearly and exactly', () => {
  for (const n of [1, 2, 3, 7, 100, 1000]) {
    const v = money(1.11, 'INR');
    const total = sum(Array.from({ length: n }, () => v));
    // 111 paise × n, exactly
    assert.equal(total.units, 111 * n, `drift at n=${n}`);
  }
});
