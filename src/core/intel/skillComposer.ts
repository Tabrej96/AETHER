/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE · SKILL COMPOSITION
 * (src/core/intel/skillComposer.ts) · Created by Tabrej
 *
 * Directive 8: "Discover and evaluate high-quality open-source skill
 * repositories… Integrate selectively and credit every third-party source
 * according to its license. AETHER should COMPOSE these capabilities
 * intelligently instead of loading every skill for every task."
 *
 * This is the selectivity contract, made machine-checkable: a tagged skill
 * catalog (each skill declares its capability + optional provenance), and a
 * deterministic composer that loads the MINIMAL skill set a task's domains +
 * depth obligate — the same anti-overloading discipline the catalog-quality
 * legend gate enforces, extended to deep-intelligence skills.
 */

export interface DeepSkill {
  skillId: string;
  name: string;
  /** capability tags the skill serves (directive 8's required-skills list) */
  tags: string[];
  /** compact — the lazy-index token budget stays under 85 like the legend gate */
  tokenOverhead: number;
  /** third-party provenance when the skill was studied/adapted (credited, never assumed) */
  provenance?: { repository: string; license: string; note: string };
}

/**
 * The directive's required skill list, as AETHER-native tags. No third-party
 * source is REQUIRED; each skill is AETHER's own unless provenance says
 * otherwise, and any that is studied carries license credit here.
 */
export const DEEP_SKILLS: DeepSkill[] = [
  { skillId: 'req-analysis', name: 'Requirement Analysis', tags: ['requirement'], tokenOverhead: 40 },
  { skillId: 'product-discovery', name: 'Product Discovery', tags: ['product', 'requirement'], tokenOverhead: 42 },
  { skillId: 'domain-modeling', name: 'Domain Modeling', tags: ['domain'], tokenOverhead: 46 },
  { skillId: 'business-logic', name: 'Business Logic Engineering', tags: ['business', 'domain'], tokenOverhead: 44 },
  { skillId: 'financial-calcs', name: 'Financial Calculations (fixed-point)', tags: ['finance', 'calculation'], tokenOverhead: 52, provenance: { repository: 'AETHER core (src/core/finance)', license: 'Apache-2.0', note: 'in-house; no external source' } },
  { skillId: 'tax-compliance', name: 'Tax & Compliance-aware Architecture', tags: ['tax', 'finance', 'domain'], tokenOverhead: 55, provenance: { repository: 'CBIC GST slab reference (demo table)', license: 'public-domain facts', note: 'rate table carries source + effective date; jurisdiction-pluggable' } },
  { skillId: 'database-design', name: 'Database Design', tags: ['technical'], tokenOverhead: 41 },
  { skillId: 'api-design', name: 'API Design', tags: ['technical'], tokenOverhead: 40 },
  { skillId: 'architecture', name: 'System Architecture', tags: ['technical', 'complex'], tokenOverhead: 48 },
  { skillId: 'uiux-research', name: 'UI/UX Research', tags: ['design', 'experience'], tokenOverhead: 43 },
  { skillId: 'design-systems', name: 'Design Systems', tags: ['design'], tokenOverhead: 45, provenance: { repository: 'AETHER design gate (src/core/design/designGate)', license: 'Apache-2.0', note: 'reuses the award-floor audit, does not duplicate it' } },
  { skillId: 'creative-direction', name: 'Creative Direction', tags: ['creative', 'design'], tokenOverhead: 44 },
  { skillId: 'accessibility', name: 'Accessibility', tags: ['accessibility', 'design'], tokenOverhead: 40 },
  { skillId: 'motion-design', name: 'Motion Design', tags: ['design', 'creative'], tokenOverhead: 39 },
  { skillId: 'visual-qa', name: 'Visual QA (rendered inspection)', tags: ['qa', 'design'], tokenOverhead: 42, provenance: { repository: 'AETHER CDP browser control (src/core/browser/cdp)', license: 'Apache-2.0', note: 'drives a real browser; no external runtime' } },
  { skillId: 'math-verification', name: 'Mathematical Verification', tags: ['calculation', 'qa'], tokenOverhead: 47 },
  { skillId: 'security-review', name: 'Security Review', tags: ['security'], tokenOverhead: 45 },
  { skillId: 'automated-testing', name: 'Automated Testing', tags: ['qa', 'calculation'], tokenOverhead: 43 },
  { skillId: 'documentation', name: 'Documentation', tags: ['documentation'], tokenOverhead: 38 },
];

export interface CompositionRequest {
  task: string;
  domains: string[]; // from requirements.classifyRequirement
  depth: import('./requirements').RequirementDepth;
}

export interface CompositionResult {
  /** ordered: core skills first, then domain-specific — minimal complete set */
  skillIds: string[];
  /** total lazy-index token cost of the composition (must stay compact) */
  totalTokenOverhead: number;
  /** which skills were deliberately NOT loaded and why */
  skipped: Array<{ skillId: string; reason: string }>;
}

/**
 * Domain → skill tags. Security is a first-class obligation wherever money,
 * patient data or multi-role systems are involved — a financial system that
 * skips its security review is exactly the silent-omission the directive
 * forbids.
 */
const DOMAIN_TAGS: Record<string, string[]> = {
  FINANCE: ['finance', 'calculation', 'tax', 'business', 'security'],
  ECONOMY_GST: ['tax', 'finance', 'calculation', 'security'],
  ECOMMERCE: ['business', 'domain', 'calculation', 'security'],
  HEALTHCARE: ['domain', 'security', 'qa'],
  MANUFACTURING: ['domain', 'calculation', 'technical'],
  ERP: ['business', 'technical', 'security'],
};

/**
 * Deterministic minimal composition. A task loads exactly the skills its
 * depth + domains obligate; everything else is skipped (and the skip is
 * recorded, not silent). Frontend/creative tags load only when the task
 * design-owes them (depth >= DETAILED or an explicit design domain).
 */
export function composeSkills({ task, domains, depth }: CompositionRequest): CompositionResult {
  void task;
  const wants = new Set<string>();
  wants.add('requirement'); // every task, every depth
  wants.add('qa');
  wants.add('documentation');
  if (depth !== 'SIMPLE') {
    wants.add('business');
    wants.add('technical');
    if (depth === 'COMPLEX') wants.add('complex');
  }
  // design is owed only when the task actually has a UI/creative surface —
  // depth alone never obligates it (a complex backend system is not a page)
  const DESIGN_SIGNAL = /(?:website|web page|\bui\b|\bux\b|dashboard|brand|visual|design|interface|frontend|front-end|mobile|landing|portfolio|component)/i;
  if (DESIGN_SIGNAL.test(task)) wants.add('design');
  for (const d of domains) for (const t of DOMAIN_TAGS[d] ?? []) wants.add(t);

  const needed = DEEP_SKILLS.filter((s) => s.tags.some((t) => wants.has(t)));
  // deterministic order: by descending tokenOverhead tie-broken by skillId ->
  // core (higher-overhead, higher-leverage) skills first
  needed.sort((a, b) => b.tokenOverhead - a.tokenOverhead || a.skillId.localeCompare(b.skillId));
  const skipped = DEEP_SKILLS.filter((s) => !needed.includes(s)).map((s) => ({
    skillId: s.skillId,
    reason: `not obligated at depth ${depth} with domains [${domains.join(', ') || 'general'}]`,
  }));
  return {
    skillIds: needed.map((s) => s.skillId),
    totalTokenOverhead: needed.reduce((a, s) => a + s.tokenOverhead, 0),
    skipped,
  };
}
