/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — CALCULATION + DOMAIN INTELLIGENCE · TAX ENGINE
 * (src/core/finance/taxEngine.test.ts) · Created by Tabrej
 *
 * Known-value, boundary, and tamper tests. The directive: "Test with
 * normal, extreme and invalid inputs… verify the displayed result against
 * the underlying calculation… never invent tax rates… record the source
 * and effective date of externally sourced rules."
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeInvoiceTotals,
  gstSlabTable,
  verifyClientTotal,
  type LineItem,
  type TaxConfig,
} from './taxEngine';

const cfg = (over: Partial<TaxConfig> = {}): TaxConfig => ({
  currency: 'INR',
  jurisdiction: 'IN',
  taxModel: 'GST',
  taxMode: 'EXCLUSIVE',
  rates: gstSlabTable('INR'),
  ...over,
});

const line = (o: Partial<LineItem> & Pick<LineItem, 'lineId' | 'pricePaise' | 'rateId'>): LineItem => ({
  description: o.lineId,
  quantityMilli: 1000,
  ...o,
});

test('exclusive GST: single 18% line -> exact 18% tax in integer paise', () => {
  const t = computeInvoiceTotals([line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' })], cfg());
  assert.equal(t.subtotalPaise, 100000);
  assert.equal(t.taxPaise, 18000); // 18% of 1000.00, exact
  assert.equal(t.grandTotalPaise, 118000);
});

test('intra-state GST splits 18% as CGST 9% + SGST 9% (50/50 of the slab)', () => {
  const c = cfg({ placeOfSupply: { supplierRegion: 'MH', buyerRegion: 'MH' } });
  const t = computeInvoiceTotals([line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' })], c);
  const cgst = t.components.find((x) => x.code === 'CGST')!;
  const sgst = t.components.find((x) => x.code === 'SGST')!;
  assert.equal(cgst.paise, 9000);
  assert.equal(sgst.paise, 9000);
  assert.equal(t.taxPaise, 18000);
});

test('inter-state GST uses IGST (single component = full slab)', () => {
  const c = cfg({ placeOfSupply: { supplierRegion: 'MH', buyerRegion: 'DL' } });
  const t = computeInvoiceTotals([line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' })], c);
  assert.deepEqual(t.components.map((x) => x.code), ['IGST']);
  assert.equal(t.components[0].paise, 18000);
});

test('discount applies BEFORE tax (the prescribed order)', () => {
  const c = cfg({ discountBps: 1000 }); // 10% off subtotal
  const t = computeInvoiceTotals([line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' })], c);
  assert.equal(t.subtotalPaise, 100000);
  assert.equal(t.discountPaise, 10000);
  assert.equal(t.taxableValuePaise, 90000);
  assert.equal(t.taxPaise, 16200); // 18% of 900.00, not of 1000.00
  assert.equal(t.grandTotalPaise, 106200);
});

test('zero-rated line adds to subtotal but contributes zero tax', () => {
  const t = computeInvoiceTotals(
    [
      line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' }),
      line({ lineId: 'b', pricePaise: 50000, rateId: 'GST-0', zeroRated: true }),
    ],
    cfg()
  );
  assert.equal(t.subtotalPaise, 150000);
  assert.equal(t.taxPaise, 18000); // only the 18% line
});

test('fractional quantities are exact via integer milli-units (no float drift)', () => {
  // 1.25 units @ ₹320.00 (32000p) = ₹400.00 exactly; 18% -> ₹72.00
  const t = computeInvoiceTotals([line({ lineId: 'a', quantityMilli: 1250, pricePaise: 32000, rateId: 'GST-18' })], cfg());
  assert.equal(t.subtotalPaise, 40000);
  assert.equal(t.taxPaise, 7200);
});

test('grand total adds non-taxable additional charges after tax', () => {
  const c = cfg({ additionalChargesPaise: 5000 }); // +₹50.00 packing
  const t = computeInvoiceTotals([line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' })], c);
  assert.equal(t.additionalChargesPaise, 5000);
  assert.equal(t.grandTotalPaise, 118000 + 5000);
});

test('INCLUSIVE mode back-solves the tax-excluded base from the quoted total', () => {
  // quoted ₹1,18,000 includes 18% -> base 1,00,000p, tax 18,000p
  const c = cfg({ taxMode: 'INCLUSIVE' });
  const t = computeInvoiceTotals([line({ lineId: 'a', pricePaise: 118000, rateId: 'GST-18' })], c);
  assert.equal(t.grandTotalPaise, 118000); // quoted total is authoritative
  assert.equal(t.impliedBasePaise, 100000);
  assert.equal(t.taxPaise, 18000);
});

test('an unknown rate id is a hard error, never a silent 0%', () => {
  assert.throws(
    () => computeInvoiceTotals([line({ lineId: 'a', pricePaise: 1000, rateId: 'GST-99' })], cfg()),
    /unknown rate id/
  );
});

test('invalid line input is rejected — never NaN (server-side validation)', () => {
  const c = cfg();
  // missing quantity (the shape a client could submit) is rejected, not coerced
  assert.throws(
    () => computeInvoiceTotals([line({ lineId: 'a', pricePaise: 1000, rateId: 'GST-18', quantityMilli: undefined as unknown as number })], c),
    /quantityMilli/
  );
  assert.throws(
    () => computeInvoiceTotals([line({ lineId: 'a', pricePaise: NaN, rateId: 'GST-18' })], c),
    /pricePaise/
  );
  assert.throws(
    () => computeInvoiceTotals([line({ lineId: 'a', pricePaise: -500, rateId: 'GST-18' })], c),
    /credit note/
  );
});

test('every rate on the document carries recorded source + effective date (provenance)', () => {
  const t = computeInvoiceTotals([line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' })], cfg());
  assert.ok(t.provenance.length >= 1);
  for (const p of t.provenance) {
    assert.ok(p.source.trim().length > 0, 'rate source recorded');
    assert.match(p.effectiveOnIso, /^\d{4}-\d{2}-\d{2}$/, 'effective date recorded');
  }
});

test('tamper guard: a client-asserted total that mismatches is REJECTED', () => {
  const lines = [line({ lineId: 'a', pricePaise: 100000, rateId: 'GST-18' })];
  const c = cfg();
  const good = verifyClientTotal(118000, lines, c);
  assert.equal(good.ok, true);
  const tampered = verifyClientTotal(100000, lines, c); // client under-reports the tax
  assert.equal(tampered.ok, false);
  assert.equal(tampered.deltaPaise, -18000); // exactly the missing tax
});
