/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE · CALCULATION INTELLIGENCE
 * (src/core/finance/money.ts) · Created by Tabrej
 *
 * Fixed-point monetary arithmetic.
 *
 * The directive: "Use appropriate decimal or fixed-point arithmetic for
 * financial values. Avoid relying on ordinary binary floating-point
 * arithmetic for monetary calculations."
 *
 * Money is an INTEGER count of the currency's smallest unit (paise for INR,
 * cents for USD). Addition/subtraction is exact integer math. Multiplying
 * by a rate is exact integer math with a SINGLE, documented rounding step at
 * the end — never a chain of binary floats that drift. That one boundary is
 * what makes "the displayed result" provably equal to "the underlying
 * calculation."
 */

/** A monetary amount in integer units of the currency's smallest decimal place. */
export interface Money {
  /** Integer count of the smallest unit (1234 paise = 12.34 INR). MUST be integer. */
  units: number;
  /** Currency code, e.g. 'INR', 'USD'. */
  currency: string;
  /** How many smallest-units make one whole unit (100 for paise/cents). */
  divisor: number;
}

/** Rounding applied at the single money-rounding boundary. */
export type RoundingMode = 'HALF_UP' | 'HALF_EVEN' | 'DOWN' | 'UP';

/**
 * The single rounding boundary for an exact rational num/den, in integer
 * units. num and den are exact integers; this is the only place a
 * fractional result is reduced to whole smallest-units.
 */
export function roundRational(num: number, den: number, mode: RoundingMode): number {
  if (den <= 0) throw new Error('denominator must be positive');
  const sign = num < 0 ? -1 : 1;
  const n = Math.abs(num);
  const q = Math.floor(n / den);
  const r = n - q * den;
  let frac: number;
  switch (mode) {
    case 'DOWN':
      frac = 0;
      break;
    case 'UP':
      frac = r > 0 ? 1 : 0;
      break;
    case 'HALF_UP':
      frac = r * 2 >= den ? 1 : 0;
      break;
    case 'HALF_EVEN':
      // banker's rounding: round to nearest, ties to even
      frac = r * 2 > den ? 1 : r * 2 < den ? 0 : q % 2 === 1 ? 1 : 0;
      break;
  }
  return sign * (q + frac);
}

/** Build money from a human amount (e.g. 12.34) -> integer units. */
export function money(amount: number, currency = 'INR', divisor = 100): Money {
  const units = Math.round(amount * divisor);
  return { units, currency, divisor };
}

/** Exact integer addition of same-currency amounts. */
export function sum(values: Money[]): Money {
  let units = 0;
  for (const v of values) units += v.units;
  const c = values[0]?.currency ?? 'INR';
  const d = values[0]?.divisor ?? 100;
  return { units, currency: c, divisor: d };
}

/** Multiply an amount by a rate in basis points (1 bp = 0.01%, 10000 = 100%). */
export function mulRate(a: Money, bps: number, mode: RoundingMode = 'HALF_UP'): Money {
  if (bps === 0) return { units: 0, currency: a.currency, divisor: a.divisor };
  return { units: roundRational(a.units * bps, 10000, mode), currency: a.currency, divisor: a.divisor };
}

/** Human formatting without float drift: 1234 paise -> "12.34". */
export function format(m: Money, symbol = ''): string {
  const sign = m.units < 0 ? '-' : '';
  const abs = Math.abs(m.units);
  const whole = Math.floor(abs / m.divisor);
  const fracStr = String(abs % m.divisor).padStart(String(m.divisor).length - 1, '0');
  return `${sign}${symbol ? symbol + ' ' : ''}${whole}.${fracStr}`;
}

/** Parse "1,234.56" / "12.34" -> integer-unit Money. */
export function parse(amount: string, currency = 'INR', divisor = 100): Money {
  const cleaned = amount.replace(/[,\s]/g, '');
  const neg = cleaned.startsWith('-');
  const body = neg ? cleaned.slice(1) : cleaned;
  const [w, f = ''] = body.split('.');
  const fracPadded = f.padEnd(String(divisor).length - 1, '0').slice(0, String(divisor).length - 1);
  let units = Number(w || '0') * divisor + Number(fracPadded || '0');
  if (neg) units = -units;
  return { units, currency, divisor };
}
