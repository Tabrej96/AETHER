/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE · DOMAIN + CALCULATION INTELLIGENCE
 * (src/core/finance/taxEngine.ts) · Created by Tabrej
 *
 * "Do not assume one country's tax system applies globally" and "Do not
 * hardcode tax rates without a configurable and verifiable source."
 *
 * So this engine:
 *   - models India's GST (intra-state CGST+SGST vs inter-state IGST, HSN/SAC,
 *     zero-rated supply) as ONE jurisdiction profile among a pluggable set;
 *   - every rate carries SOURCE + EFFECTIVE DATE (recorded provenance), and a
 *     deployment may override the whole table;
 *   - enforces the calculation ORDER the directive prescribes:
 *       subtotal → eligible discounts → taxable value → tax → grand total
 *       (+ additional non-taxable charges), using fixed-point paise from
 *       money.ts with one documented rounding boundary per money×rate step;
 *   - exposes a full breakdown (never a bare number) and a server-side
 *     recompute guard that distrusts client-asserted totals.
 *
 * The slab table is a DEFAULT reference with provenance metadata, for
 * demonstration and testing. Production loads live jurisdiction rates; the
 * (source / effectiveOnIso) shape is the audit contract.
 */

import { Money, format, mulRate, roundRational, sum } from './money';

export type TaxModel = 'GST' | 'VAT' | 'SALES_TAX' | 'ZERO_RATED';
export type TaxMode = 'EXCLUSIVE' | 'INCLUSIVE';

export interface TaxRate {
  id: string;
  /** percent in basis points: 1800 = 18.00%, 2800 = 28.00% */
  percentBps: number;
  description: string;
  /** verifiable provenance — recorded, not assumed */
  source: string;
  effectiveOnIso: string;
}

/** Default India GST slab reference (demo/test provenance — override in prod). */
export function gstSlabTable(currency: string): Record<string, TaxRate> {
  void currency;
  const src = 'CBIC GST slab structure — demo reference table; load live jurisdiction rates in production';
  const iso = '2018-07-01';
  return {
    'GST-0': { id: 'GST-0', percentBps: 0, description: 'zero-rated / exempt supply', source: src, effectiveOnIso: iso },
    'GST-5': { id: 'GST-5', percentBps: 500, description: '5% essential goods', source: src, effectiveOnIso: iso },
    'GST-12': { id: 'GST-12', percentBps: 1200, description: '12% standard', source: src, effectiveOnIso: iso },
    'GST-18': { id: 'GST-18', percentBps: 1800, description: '18% standard services', source: src, effectiveOnIso: iso },
    'GST-28': { id: 'GST-28', percentBps: 2800, description: '28% luxury', source: src, effectiveOnIso: iso },
  };
}

export interface PlaceOfSupply {
  supplierRegion: string;
  buyerRegion: string;
}

export interface LineItem {
  lineId: string;
  description: string;
  /** exact decimal quantity as integer milli-units (1250 = 1.25) */
  quantityMilli: number;
  /** price per whole unit, in integer paise */
  pricePaise: number;
  /** slab id from the jurisdiction table */
  rateId: string;
  hsnSac?: string;
  zeroRated?: boolean;
}

export interface TaxConfig {
  currency: string;
  jurisdiction: 'IN' | 'US' | 'EU' | 'CA';
  taxModel: TaxModel;
  taxMode: TaxMode;
  rates: Record<string, TaxRate>;
  /** place of supply decides the CGST/SGST vs IGST split for GST */
  placeOfSupply?: PlaceOfSupply;
  /** eligible discount, basis points of the pre-discount subtotal. Before tax. */
  discountBps?: number;
  /** additional non-taxable charges (paise) added after tax (e.g. packing). */
  additionalChargesPaise?: number;
}

export interface TaxBreakdown {
  /** integer paise — the exact values to display, recomputed server-side */
  subtotalPaise: number;
  discountPaise: number;
  taxableValuePaise: number;
  taxPaise: number;
  /** named components: CGST/SGST (intra) or IGST (inter), or the model's single code */
  components: Array<{ code: string; rateLabel: string; paise: number }>;
  additionalChargesPaise: number;
  grandTotalPaise: number;
  /** INCLUSIVE mode: the tax-excluded base back-solved from the quoted total */
  impliedBasePaise?: number;
  /** human-readable lines — the "transparency" the directive requires */
  human: string[];
  /** provenance recorded on the document */
  provenance: Array<{ rateId: string; source: string; effectiveOnIso: string }>;
}

const moneyOf = (paise: number, currency: string): Money => ({ units: paise, currency, divisor: 100 });

/** exact: round(quantityMilli/1000 × pricePaise) = round(q·p / 1000) */
function lineAmountPaise(li: LineItem): number {
  return roundRational(li.quantityMilli * li.pricePaise, 1000, 'HALF_UP');
}

/**
 * Server-side input validation — the directive: "validate boundaries and
 * exceptional cases" and "never trust client-submitted" money figures.
 * A line with a missing or non-finite quantity/price is INVALID input; it is
 * rejected with a clear error, never turned into a NaN that silently
 * propagates into the total.
 */
export function validateLineItems(lines: LineItem[]): void {
  for (const li of lines) {
    if (li.quantityMilli == null || !Number.isFinite(li.quantityMilli)) {
      throw new Error(`line '${li.lineId}': quantityMilli must be a finite number (exact decimal milli-units)`);
    }
    if (li.pricePaise == null || !Number.isFinite(li.pricePaise) || !Number.isInteger(li.pricePaise)) {
      throw new Error(`line '${li.lineId}': pricePaise must be an integer number of paise`);
    }
    if (li.quantityMilli < 0 || li.pricePaise < 0) {
      // negative line amounts are the credit-note domain, not a standard invoice
      throw new Error(`line '${li.lineId}': negative quantity/price is a credit note, not an invoice line`);
    }
  }
}

function add(map: Map<string, number>, k: string, v: number): void {
  map.set(k, (map.get(k) ?? 0) + v);
}

/** the highest slab used in the document — an honest label for grouped tax */
function dominantRateLabel(rateSeen: Map<string, TaxRate>): string {
  let best: TaxRate | undefined;
  for (const r of rateSeen.values()) if (!best || r.percentBps > best.percentBps) best = r;
  return best?.id ?? 'tax';
}

/**
 * The canonical invoice calculation. Deterministic, fixed-point, one
 * documented rounding boundary per money×rate step.
 *
 * EXCLUSIVE (default): subtotal → discount → taxable → tax → + additional
 *   charges → grand total.
 * INCLUSIVE: each line's amount already contains tax; per line the tax share
 *   is back-solved exactly — tax_i = round(total_i·bps_i / (10000+bps_i)) —
 *   so the parts always reconcile to the quoted total.
 */
export function computeInvoiceTotals(lines: LineItem[], cfg: TaxConfig): TaxBreakdown {
  validateLineItems(lines); // reject invalid input — never let NaN reach a total
  const rateOf = (li: LineItem): TaxRate => {
    const rate = cfg.rates[li.rateId];
    if (!rate) throw new Error(`unknown rate id '${li.rateId}' — every line must reference the jurisdiction table`);
    return rate;
  };
  const rateSeen = new Map<string, TaxRate>();
  for (const li of lines) rateSeen.set(li.rateId, rateOf(li));
  const isZero = (li: LineItem): boolean => li.zeroRated === true || rateOf(li).percentBps === 0;
  const gst = cfg.taxModel === 'GST';
  const interState = gst && cfg.placeOfSupply ? cfg.placeOfSupply.supplierRegion !== cfg.placeOfSupply.buyerRegion : false;
  const prov = () => [...rateSeen.values()].map((r) => ({ rateId: r.id, source: r.source, effectiveOnIso: r.effectiveOnIso }));

  if (cfg.taxMode === 'INCLUSIVE') {
    const acc = new Map<string, number>();
    let netInclusivePaise = 0;
    let taxPaise = 0;
    for (const li of lines) {
      const total_i = lineAmountPaise(li);
      const bps = isZero(li) ? 0 : rateOf(li).percentBps;
      const tax_i = bps === 0 ? 0 : roundRational(total_i * bps, 10000 + bps, 'HALF_UP');
      netInclusivePaise += total_i;
      taxPaise += tax_i;
      if (gst && interState) add(acc, 'IGST', tax_i);
      else if (gst && bps > 0) {
        const halfBps = Math.floor(bps / 2); // CGST & SGST each carry 50% of the slab
        add(acc, 'CGST', roundRational(tax_i * halfBps, 10000, 'HALF_UP'));
        add(acc, 'SGST', roundRational(tax_i * (bps - halfBps), 10000, 'HALF_UP'));
      } else if (bps > 0) add(acc, cfg.taxModel, tax_i);
    }
    const additional = cfg.additionalChargesPaise ?? 0;
    const grand = netInclusivePaise + additional;
    const impliedBase = netInclusivePaise - taxPaise;
    return {
      subtotalPaise: impliedBase,
      discountPaise: 0,
      taxableValuePaise: impliedBase,
      taxPaise,
      components: [...acc.entries()].map(([code, p]) => ({ code, rateLabel: dominantRateLabel(rateSeen), paise: p })),
      additionalChargesPaise: additional,
      grandTotalPaise: grand,
      impliedBasePaise: impliedBase,
      human: [
        `taxable value (implied, tax excluded): ${format(moneyOf(impliedBase, cfg.currency), '₹')}`,
        `tax included in quoted prices: ${format(moneyOf(taxPaise, cfg.currency), '₹')}`,
        `additional charges: ${format(moneyOf(additional, cfg.currency), '₹')}`,
        `grand total (as quoted): ${format(moneyOf(grand, cfg.currency), '₹')}`,
      ],
      provenance: prov(),
    };
  }

  // ---- EXCLUSIVE: the prescribed order ----
  const subtotal = sum(lines.map((li) => moneyOf(lineAmountPaise(li), cfg.currency))).units;

  // 1) eligible discount, BEFORE tax. A document-level discount is apportioned
  //    to each line proportionally to its amount, so tax is charged on the
  //    POST-discount base (taxable value), never on the pre-discount total.
  const discountBps = cfg.discountBps ?? 0;
  const discountPaise = mulRate(moneyOf(subtotal, cfg.currency), discountBps).units;
  const taxableValue = subtotal - discountPaise;

  const acc = new Map<string, number>();
  for (const li of lines) {
    if (isZero(li)) continue;
    const bps = rateOf(li).percentBps;
    const rowGross = lineAmountPaise(li);
    const rowDiscount = roundRational(rowGross * discountBps, 10000, 'HALF_UP');
    const share = rowGross - rowDiscount; // post-discount line taxable base
    if (gst && interState) add(acc, 'IGST', roundRational(share * bps, 10000, 'HALF_UP'));
    else if (gst) {
      const halfBps = Math.floor(bps / 2);
      add(acc, 'CGST', roundRational(share * halfBps, 10000, 'HALF_UP'));
      add(acc, 'SGST', roundRational(share * (bps - halfBps), 10000, 'HALF_UP'));
    } else add(acc, cfg.taxModel, roundRational(share * bps, 10000, 'HALF_UP'));
  }
  const taxPaise = [...acc.values()].reduce((a, b) => a + b, 0);

  const additional = cfg.additionalChargesPaise ?? 0;
  const grandTotal = taxableValue + taxPaise + additional;

  return {
    subtotalPaise: subtotal,
    discountPaise,
    taxableValuePaise: taxableValue,
    taxPaise,
    components: [...acc.entries()].map(([code, p]) => ({ code, rateLabel: dominantRateLabel(rateSeen), paise: p })),
    additionalChargesPaise: additional,
    grandTotalPaise: grandTotal,
    human: [
      `subtotal: ${format(moneyOf(subtotal, cfg.currency), '₹')}`,
      `discount (${discountBps / 100}%): ${format(moneyOf(discountPaise, cfg.currency), '₹')}`,
      `taxable value: ${format(moneyOf(taxableValue, cfg.currency), '₹')}`,
      ...[...acc.entries()].map(([code, p]) => `${code}: ${format(moneyOf(p, cfg.currency), '₹')}`),
      `tax total: ${format(moneyOf(taxPaise, cfg.currency), '₹')}`,
      `additional charges: ${format(moneyOf(additional, cfg.currency), '₹')}`,
      `grand total: ${format(moneyOf(grandTotal, cfg.currency), '₹')}`,
    ],
    provenance: prov(),
  };
}

/**
 * Server-side recompute guard. The directive: "Never trust client-submitted
 * totals as the authoritative financial result." Recompute from source lines
 * and compare against the client's claim.
 */
export function verifyClientTotal(
  clientAssertedPaise: number,
  lines: LineItem[],
  cfg: TaxConfig
): { ok: boolean; serverTotalPaise: number; deltaPaise: number } {
  const t = computeInvoiceTotals(lines, cfg);
  return { ok: clientAssertedPaise === t.grandTotalPaise, serverTotalPaise: t.grandTotalPaise, deltaPaise: clientAssertedPaise - t.grandTotalPaise };
}
