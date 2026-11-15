/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE · DEEP REQUIREMENT UNDERSTANDING
 * (src/core/intel/requirements.ts) · Created by Tabrej
 *
 * "AETHER must understand what the user actually wants, not just interpret
 * the literal words." This module turns that into a machine-checkable
 * contract: every task gets a RequirementModel with an explicit depth
 * class and the facets that depth obligates, and a deterministic depth
 * classifier that distinguishes simple / detailed / complex / ambiguous —
 * so the system neither over-engineers a typo fix nor under-delivers a
 * "complete system" ask.
 */

/** The ten facets the directive lists under "identify:" for every task. */
export type RequirementFacet =
  | 'PRIMARY_OBJECTIVE'
  | 'INTENDED_OUTCOME'
  | 'FUNCTIONAL'
  | 'DOMAIN'
  | 'TECHNICAL'
  | 'DESIGN_EXPERIENCE'
  | 'BUSINESS_RULES'
  | 'EDGE_CASES'
  | 'DEPENDENCIES'
  | 'SECURITY_PRIVACY';

export type RequirementDepth = 'SIMPLE' | 'DETAILED' | 'COMPLEX' | 'AMBIGUOUS';

export interface RequirementModel {
  task: string;
  depth: RequirementDepth;
  /** facets that are OBVIOUS from depth — the build must address each */
  obligatedFacets: RequirementFacet[];
  /** a focused clarification is REQUIRED before architecture work when
   *  this is non-empty (missing info would materially change the outcome) */
  mustAsk: Array<{ facet: RequirementFacet; question: string }>;
  /** assumptions made where safe — recorded so they are auditable, not silent */
  assumptions: string[];
  /** domain signals detected (e.g. ['FINANCE', 'ECONOMY_GST']) drive profile loading */
  domains: string[];
}

const FACET_ORDER: RequirementFacet[] = [
  'PRIMARY_OBJECTIVE', 'INTENDED_OUTCOME', 'FUNCTIONAL', 'DOMAIN', 'TECHNICAL',
  'DESIGN_EXPERIENCE', 'BUSINESS_RULES', 'EDGE_CASES', 'DEPENDENCIES', 'SECURITY_PRIVACY',
];

/** deterministic: depth -> which facets are obligated (no arbitrary omission) */
export function obligatedFacetsForDepth(depth: RequirementDepth): RequirementFacet[] {
  switch (depth) {
    case 'SIMPLE':
      return ['PRIMARY_OBJECTIVE', 'INTENDED_OUTCOME', 'FUNCTIONAL', 'EDGE_CASES'];
    case 'DETAILED':
      return FACET_ORDER; // a "complete feature" ask obligates every facet
    case 'COMPLEX':
      return [...FACET_ORDER];
    case 'AMBIGUOUS':
      // depth not yet known; safe minimum set
      return ['PRIMARY_OBJECTIVE', 'INTENDED_OUTCOME', 'FUNCTIONAL'];
  }
}

const COMPLEX_WORDS = /(?:complete|full|entire|production|system|platform|end[- ]to[- ]end|multi[- ]tenant|enterprise|workflow|lifecycle)\b/i;
const MONEY_WORDS = /(?:invoice|bill|pricing|price|cost|total|payment|refund|reconciliation|accounting|ledger|budget|gst|vat|tax|taxable|invoice number)/i;
const DOMAIN_WORDS: Array<[string, RegExp]> = [
  // `\bPO\b` (not `PO\b`): a bare trailing boundary lets 'po' inside 'typo'
  // match — a typo-fix task must never classify as FINANCE.
  ['FINANCE', /(?:invoice|billing|accounting|ledger|payment|refund|reconciliation|payroll|procurement|purchase order|\bPO\b)/i],
  ['ECONOMY_GST', /(?:\bgst\b|\bCGST\b|\bSGST\b|\bIGST\b|\bHSN\b|\bSAC\b|intra[- ]state|inter[- ]state)/i],
  ['ECOMMERCE', /(?:product|inventory|coupon|promot|shipping|cart|checkout|order lifecycle|seller|variant)/i],
  ['HEALTHCARE', /(?:patient|clinical|appointment|medical|diagnosis|EMR|HIPAA)/i],
  ['MANUFACTURING', /(?:bill of materials|BOM|raw material|wastage|machine utilization|production stage)/i],
  ['ERP', /(?:department|approval chain|HR\b|department|sod|role[- ]based|permission)/i],
];

export interface DepthInput {
  task: string;
  /** the caller supplies what it already knows; unknowns become mustAsk */
  knownFacets?: RequirementFacet[];
}

/**
 * Deterministic depth classifier + obligation computer. The classifier is
 * deliberately conservative: it upgrades depth on strong signals and only
 * downgrades to SIMPLE when the task is a single-verb local edit.
 */
export function classifyRequirement({ task, knownFacets = [] }: DepthInput): RequirementModel {
  const text = task;
  const domains = DOMAIN_WORDS.filter(([, re]) => re.test(text)).map(([d]) => d);
  const moneyDomain = MONEY_WORDS.test(text);

  let depth: RequirementDepth;
  const complexSignals = [COMPLEX_WORDS.test(text), domains.length >= 1, moneyDomain].filter(Boolean).length;
  if (complexSignals >= 2) depth = 'COMPLEX';
  else if (complexSignals === 1) depth = 'DETAILED';
  else if (/(?:fix|change|typo|rename|one[- ]line|update|patch)\b/i.test(text) && !moneyDomain) depth = 'SIMPLE';
  else depth = 'DETAILED';

  // ambiguity: a money system with NO stated jurisdiction -> material unknown
  const mustAsk: RequirementModel['mustAsk'] = [];
  if (moneyDomain && !/(?:\bIndia\b|\bIN\b|\bUS\b|\bEU\b|jurisdiction|country)/i.test(text)) {
    mustAsk.push({ facet: 'BUSINESS_RULES', question: 'Which jurisdiction does this invoice/billing operate in? GST slabs, CGST/SGST vs IGST split, HSN/SAC, and rounding all depend on it.' });
  }
  if (moneyDomain && !/(?:inclusive|exclusive)/i.test(text)) {
    mustAsk.push({ facet: 'BUSINESS_RULES', question: 'Are prices tax-inclusive or tax-exclusive? (The grand-total formula differs.)' });
  }

  const known = new Set<RequirementFacet>(knownFacets);
  const obligated = obligatedFacetsForDepth(depth);
  const assumptions: string[] = [];
  if (moneyDomain) {
    // the directive's default order, recorded as an assumption, not silence
    assumptions.push('Discount applies to the subtotal BEFORE tax (adjustable per business rule).');
    if (moneyDomain && domains.includes('ECONOMY_GST')) {
      assumptions.push('Intra-state supply is CGST+SGST (50/50 split of the slab); inter-state is IGST. Verified by place-of-supply at compute time.');
    }
    assumptions.push('No client-submitted total is trusted: the server recomputes from source lines and rejects mismatches.');
  }
  if (obligated.includes('SECURITY_PRIVACY') && !known.has('SECURITY_PRIVACY')) {
    assumptions.push('Least-privilege: financial writes are approval-gated and audit-logged; patient/PII data redacted from logs where the domain requires it.');
  }

  return {
    task,
    depth,
    obligatedFacets: obligated,
    mustAsk,
    assumptions,
    domains,
  };
}
