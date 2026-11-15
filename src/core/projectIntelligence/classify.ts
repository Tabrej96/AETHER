/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P12 · PROJECT CLASSIFIER + EFFORT POLICY
 * (src/core/projectIntelligence/classify.ts) · Created by Tabrej
 *
 * The directive's core rule: "User prompt length must NEVER determine
 * engineering effort, creativity, reasoning depth, or product quality."
 *
 * So the classifier returns EVIDENCE, not vibes: each category it names
 * carries the keyword(s) that earned it, multiple categories can hold
 * (a jewellery marketplace with a 3D configurator is ECOMMERCE + MARKETPLACE
 * + CAD_3D simultaneously), and if none hold it is UNSEEN with a
 * first-principles strategy — never a keyword miss.
 *
 * The effort policy is what makes prompt-length independence real: effort
 * = f(primary category, security posture, scale, complexity signals),
 * and it has a FLOOR per category. A four-word ask for a financial product
 * gets the same reasoning depth as a four-page spec for one.
 */

import { CATEGORIES, UNSEEN_PROFILE, type CategoryProfile, type ProjectCategory } from './categories';

export interface CategoryEvidence {
  category: ProjectCategory;
  /** the concrete signal that earned this category (the audit trail) */
  matched: string[];
  /** primary = strongest signal count; secondary = also applies */
  role: 'primary' | 'secondary';
}

export interface ProjectClassification {
  task: string;
  categories: CategoryEvidence[];
  /** the single dominant category (the strategy is generated for it; others
   *  are layered on — multi-label, not single-choice) */
  primary: ProjectCategory;
  /** true when no known category matched — first-principles strategy */
  unseen: boolean;
  profile: CategoryProfile;
}

export interface EffortLevel {
  level: 'FOCUSED' | 'STANDARD' | 'DEEP' | 'DEEPEST';
  /** the reasons (drives the PROJECT_STRATEGY.md's "why this depth") */
  reasons: string[];
  /** the categories this level obligates (P13/P10 hooks) */
  obligatedEngines: string[];
}

/**
 * keyword match with the literal substring recorded as evidence. The
 * profile's `keywords` regex is an alternation of plain word groups; test the
 * whole regex first (authoritative), then find WHICH literal alternatives
 * fired by scanning the text case-insensitively for each word in the source.
 */
/**
 * keyword match recording the ACTUAL matched substrings as evidence — the
 * most honest audit trail (what the text literally said, not what the table
 * could have matched).
 */
function evidenceFor(profile: CategoryProfile, text: string): string[] {
  if (!profile.keywords.test(text)) return [];
  const out: string[] = [];
  // global + case-insensitive so every distinct hit is captured
  const g = new RegExp(profile.keywords.source, 'gi');
  const seen = new Set<string>();
  for (const m of text.match(g) ?? []) {
    const key = m.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(m);
    }
  }
  return out;
}

export function classifyProject(task: string): ProjectClassification {
  const scored: Array<{ c: CategoryProfile; matched: string[] }> = [];
  for (const c of CATEGORIES) {
    const matched = evidenceFor(c, task);
    if (matched.length) scored.push({ c, matched });
  }
  scored.sort((a, b) => b.matched.length - a.matched.length);

  const unseen = scored.length === 0;
  const profile = unseen ? UNSEEN_PROFILE : scored[0].c;
  const categories: CategoryEvidence[] = scored
    .filter((s) => s.c.id === profile.id || s.matched.length >= 1)
    .slice(0, 4)
    .map((s, i) => ({ category: s.c.id, matched: s.matched, role: i === 0 ? 'primary' : 'secondary' }));
  if (unseen) categories.push({ category: 'UNSEEN', matched: [], role: 'primary' });

  return {
    task,
    categories,
    primary: profile.id,
    unseen,
    profile,
  };
}

// ---------------------------------------------------------------- effort

/** scale / complexity signals the caller may know (or AETHER inferred) */
export interface EffortInputs {
  /** expected user scale, free text or 'utility'|'startup'|'enterprise' */
  userScale?: string;
  availabilityPct?: string;
  dataVolume?: string;
  teamSize?: number;
  /** is this a money/health/system-of-record domain (from classification) */
  securityPosture?: 'STANDARD' | 'HARDENED' | 'FINANCIAL' | 'HEALTH' | 'DATA_RESIDENT';
}

/**
 * Deterministic effort policy. The floor is per security posture (a financial
 * product is DEEP at minimum, no matter how short the ask); scale + data
 * volume + availability raise it. This is the mechanism that makes
 * "add a search feature" for a financial SaaS earn the same depth as a
 * long spec — the depth follows the PRODUCT, not the prompt.
 */
const EFFORT_RANK: Record<EffortLevel['level'], number> = { FOCUSED: 0, STANDARD: 1, DEEP: 2, DEEPEST: 3 };

export function effortPolicy(cls: ProjectClassification, inputs: EffortInputs = {}): EffortLevel {
  const reasons: string[] = [];
  // rank-based promotion: a later signal only raises the effort, never lowers it
  let rank = EFFORT_RANK['STANDARD'];
  const raise = (target: EffortLevel['level'], why: string) => {
    if (EFFORT_RANK[target] > rank) {
      rank = EFFORT_RANK[target];
      reasons.push(why);
    }
  };
  const posture = inputs.securityPosture ?? cls.profile.securityPosture;
  if (posture === 'FINANCIAL' || posture === 'HEALTH') raise('DEEP', 'security posture ' + posture + ' sets the floor');
  else if (posture === 'HARDENED' || posture === 'DATA_RESIDENT') raise('DEEP', 'security posture ' + posture + ' sets the floor');
  const avail = Number.parseFloat(inputs.availabilityPct ?? '99');
  if (avail >= 99.9) raise('DEEP', 'availability ' + inputs.availabilityPct + '% raises the effort');
  if (inputs.dataVolume === 'large') raise('DEEPEST', 'large data volume');
  if ((inputs.teamSize ?? 1) >= 10 || /enterprise/i.test(inputs.userScale ?? '')) raise('DEEP', 'enterprise/team scale');
  if (cls.unseen) {
    reasons.push('unseen category: first-principles derivation is owed, not skipped');
  }
  const level: EffortLevel['level'] = (['DEEPEST', 'DEEP', 'STANDARD', 'FOCUSED'] as const).find(
    (l) => EFFORT_RANK[l] === rank
  )!;

  const obligatedEngines: EffortLevel['obligatedEngines'] = [];
  obligatedEngines.push('domain-intelligence'); // every level models the domain
  if (level === 'DEEP' || level === 'DEEPEST') obligatedEngines.push('business-logic-discovery', 'edge-case-engine');
  if (level === 'DEEPEST') obligatedEngines.push('independent-quality-panel', 'evolution-regression');
  if (cls.profile.securityPosture !== 'STANDARD') obligatedEngines.push('security-boundary-review');

  return { level, reasons, obligatedEngines };
}

/** the directive's §1 made checkable: effort does NOT depend on prompt length. */
export function promptLengthIndependence(shortAsk: string, longAsk: string, inputs?: EffortInputs): boolean {
  const a = effortPolicy(classifyProject(shortAsk), inputs);
  const b = effortPolicy(classifyProject(longAsk), inputs);
  return a.level === b.level && a.obligatedEngines.join(',') === b.obligatedEngines.join(',');
}
