/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P12 · PROJECT STRATEGY ENGINE
 * (src/core/projectIntelligence/strategy.ts) · Created by Tabrej
 *
 * Directive Phase 2.3: generate a project-specific PROJECT_STRATEGY.md —
 * product classification, recommended architecture, design direction,
 * component strategy, technology decisions, data model, security model, API
 * architecture, performance strategy, testing strategy, deployment strategy,
 * skills required, agents required, risks and trade-offs.
 *
 * "Every major technical or product decision must have a reason." So a
 * ProjectStrategy is a decision-record-style object: each field is
 * { value, reason, engine }, and rendering is deterministic Markdown.
 */

import { type ProjectCategory } from './categories';
import { classifyProject, effortPolicy, type ProjectClassification, type EffortInputs, type EffortLevel } from './classify';

export interface StrategyDecision {
  value: string;
  /** WHY — the reason is as important as the choice */
  reason: string;
  /** which engine / rule produced it (the audit trail) */
  engine: string;
}

export interface ProjectStrategy {
  task: string;
  classification: ProjectClassification;
  effort: EffortLevel;
  decisions: {
    architecture: StrategyDecision;
    designDirection: StrategyDecision;
    componentStrategy: StrategyDecision;
    technology: StrategyDecision;
    dataModel: StrategyDecision;
    securityModel: StrategyDecision;
    apiArchitecture: StrategyDecision;
    performance: StrategyDecision;
    testing: StrategyDecision;
    deployment: StrategyDecision;
    skills: StrategyDecision;
    agents: StrategyDecision;
    risks: StrategyDecision;
  };
  /** the secondary categories (multi-label) that layer on top of the primary */
  layeredCategories: ProjectCategory[];
}

// Every id below is verified to exist in FULL_AETHER_AGENTS (no fabrication).
// Exported so P20's orchestrator composes the SAME table — it must not
// re-declare agent ids (a second table would drift and fabricate).
export const AGENTS_BY_CATEGORY: Record<ProjectCategory, string[]> = {
  FINANCIAL: ['arch-payment-ledger-double-entry', 'impl-polyglot-typescript-surgeon', 'sec-cryptography-secret-auditor', 'verify-qa-regression-guardian'],
  HEALTHCARE: ['impl-polyglot-typescript-surgeon', 'sec-oauth-oidc-ZeroTrust', 'verify-qa-regression-guardian', 'arch-zero-downtime-migration'],
  CAD_3D: ['design-ui-design-systems-director', 'arch-api-contract-federation', 'impl-search-meilisearch-es', 'verify-qa-regression-guardian'],
  STREAMING_MEDIA: ['video-media-ffmpeg-filtergraph-surgeon', 'arch-crdt-local-first', 'db-storage-postgres-internals-surgeon', 'design-ui-motion-compositor-choreographer'],
  ECOMMERCE: ['arch-payment-ledger-double-entry', 'db-storage-postgres-internals-surgeon', 'impl-search-meilisearch-es', 'verify-qa-regression-guardian'],
  MARKETPLACE: ['arch-payment-ledger-double-entry', 'arch-crdt-local-first', 'sec-prompt-injection-warden', 'verify-qa-regression-guardian'],
  SAAS: ['arch-ddd-boundary', 'sec-oauth-oidc-ZeroTrust', 'arch-api-contract-federation', 'verify-qa-regression-guardian'],
  ERP: ['arch-modular-monolith', 'arch-zero-downtime-migration', 'db-storage-postgres-internals-surgeon', 'verify-qa-regression-guardian'],
  CRM: ['arch-ddd-boundary', 'impl-search-meilisearch-es', 'sec-oauth-oidc-ZeroTrust', 'verify-qa-regression-guardian'],
  PROJECT_MANAGEMENT: ['arch-crdt-local-first', 'design-ui-motion-compositor-choreographer', 'design-ui-design-systems-director', 'verify-qa-regression-guardian'],
  DEVTOOLS: ['impl-polyglot-rust-tokio-engineer', 'sec-prompt-injection-warden', 'verify-qa-regression-guardian', 'arch-api-contract-federation'],
  AI_APPLICATION: ['arch-api-contract-federation', 'sec-prompt-injection-warden', 'verify-qa-regression-guardian', 'db-storage-vector-rag-indexing'],
  SOCIAL_COMMUNITY: ['arch-crdt-local-first', 'sec-prompt-injection-warden', 'db-storage-postgres-internals-surgeon', 'verify-qa-regression-guardian'],
  EDUCATION: ['arch-api-contract-federation', 'db-storage-postgres-internals-surgeon', 'verify-qa-regression-guardian'],
  BOOKING: ['arch-crdt-local-first', 'impl-polyglot-typescript-surgeon', 'verify-qa-regression-guardian'],
  LOGISTICS: ['arch-crdt-local-first', 'impl-polyglot-typescript-surgeon', 'verify-qa-regression-guardian'],
  REAL_ESTATE: ['arch-payment-ledger-double-entry', 'arch-api-contract-federation', 'sec-oauth-oidc-ZeroTrust'],
  TRAVEL_HOSPITALITY: ['arch-crdt-local-first', 'impl-polyglot-typescript-surgeon', 'verify-qa-regression-guardian'],
  JOBS_RECRUITMENT: ['arch-ddd-boundary', 'impl-search-meilisearch-es', 'sec-oauth-oidc-ZeroTrust'],
  MANUFACTURING: ['arch-crdt-local-first', 'db-storage-postgres-internals-surgeon', 'verify-qa-regression-guardian'],
  CREATOR_DIGITAL: ['arch-payment-ledger-double-entry', 'arch-api-contract-federation', 'verify-qa-regression-guardian'],
  INTERNAL_BUSINESS: ['arch-ddd-boundary', 'sec-oauth-oidc-ZeroTrust', 'verify-qa-regression-guardian'],
  DESKTOP_APP: ['arch-crdt-local-first', 'impl-polyglot-typescript-surgeon'],
  MOBILE_APP: ['design-ui-mobile-touch-ergonomics', 'arch-crdt-local-first', 'verify-qa-regression-guardian'],
  GAME: ['design-ui-motion-compositor-choreographer', 'impl-polyglot-rust-tokio-engineer', 'arch-crdt-local-first'],
  API_INFRASTRUCTURE: ['arch-api-contract-federation', 'sec-graphql-depth-limiter', 'verify-qa-regression-guardian'],
  DATA_INTENSIVE: ['db-storage-postgres-internals-surgeon', 'arch-crdt-local-first', 'db-storage-clickhouse-olap-engineer'],
  UNSEEN: ['impl-polyglot-typescript-surgeon', 'verify-qa-regression-guardian'],
};

export function generateProjectStrategy(task: string, inputs: EffortInputs = {}): ProjectStrategy {
  const cls = classifyProject(task);
  const effort = effortPolicy(cls, inputs);
  const p = cls.profile;
  const D = (value: string, reason: string, engine: string): StrategyDecision => ({ value, reason, engine });

  const layered = cls.categories.filter((c) => c.role === 'secondary').map((c) => c.category);

  const decisions = {
    architecture: D(p.architectureHint, `category ${p.id} + posture ${p.securityPosture} + effort ${effort.level}`, 'P11 architecture engine steered by P12 classification'),
    designDirection: D(p.designLanguage, "the design language follows the category's user jobs, not a template", 'P12 design-language table (P13/Phase-3 taste layer refines it)'),
    componentStrategy: D('domain components over generic widgets; shared primitives only where ≥2 screens reuse them', 'forces the product-specific shape to be explicit', 'component strategy rule'),
    technology: D('boring stack for the core; specialized technology only where the category demands it (render pipeline, search, media)', 'the directive: never force unnecessary technologies; a financial app never gets a casual stack either', 'technology-decision rule'),
    dataModel: D(p.dataModel, 'entities + integrity hotspots named for this category', 'P11 data-model review applies to the named entities'),
    securityModel: D(`posture ${p.securityPosture}: server-side rule enforcement, ${p.securityPosture === 'STANDARD' ? 'tenant + role boundaries' : 'domain-specific hardening (see profile)'}`, 'the directive: security posture follows the domain, not the default', 'P11 tenancy + security engine'),
    apiArchitecture: D('versioned contracts with consistent error + pagination envelopes; idempotent writes where the category mutates money/inventory', 'front/back contract mismatches are the #1 runtime-bug source (P11 §2)', 'P11 apiContract engine'),
    performance: D('measure before optimizing; the hot path for this category is ' + (p.id === 'STREAMING_MEDIA' ? 'streaming + asset delivery' : p.id === 'CAD_3D' ? 'render + asset pipeline' : 'list + detail latency'), 'performance claims need a budget, not a guess', 'P11 performance verification'),
    testing: D(p.testingEmphasis.join(' + '), "the category's hard cases are the test plan; proportional to effort level " + effort.level, 'P10/P11 completion gate + P13 edge-case engine'),
    deployment: D('staged (dev → staging → prod) with health checks + rollback; migrations before cutover', 'deploy safety is non-negotiable at any scale', 'P11 readiness gate (§10)'),
    skills: D(p.uxPatterns.slice(0, 3).join(', '), 'the UX patterns the category actually owes', 'P10 skill composer (minimal set)'),
    agents: D((AGENTS_BY_CATEGORY[p.id] ?? AGENTS_BY_CATEGORY.UNSEEN).join(', '), "agents matched to the category's load-bearing work", 'agent-role table (P12)'),
    risks: D(p.edgeDomains.slice(0, 3).join(' · '), "the category's known hard cases — the directive demands they be surfaced, not discovered in production", 'P13 edge-case engine (full catalog at DEEP+ effort)'),
  };

  return { task, classification: cls, effort, decisions, layeredCategories: layered };
}

/** deterministic Markdown — the PROJECT_STRATEGY.md body */
export function renderStrategyMarkdown(s: ProjectStrategy): string {
  const L: string[] = [];
  L.push('# PROJECT_STRATEGY — ' + s.task);
  L.push('');
  L.push(`classification: ${s.classification.primary}${s.classification.unseen ? ' (UNSEEN — first-principles)' : ''} · secondary: [${s.classification.categories.filter((c) => c.role === 'secondary').map((c) => c.category).join(', ') || 'none'}]`);
  L.push(`effort: ${s.effort.level} (${s.effort.reasons.join('; ') || 'default'})`);
  if (s.classification.unseen) {
    L.push('');
    L.push('## First-principles derivation');
    L.push('No known category matched. The strategy below is derived from the stated problem: name the participants, entities, workflows, and financial flows the task implies, then apply P11/P13 to that model.');
  }
  L.push('');
  L.push('| Decision | Choice | Why | Engine |');
  L.push('| :--- | :--- | :--- | :--- |');
  for (const [k, d] of Object.entries(s.decisions)) L.push(`| ${k} | ${d.value} | ${d.reason} | ${d.engine} |`);
  L.push('');
  L.push(`obligated engines at ${s.effort.level}: ${s.effort.obligatedEngines.join(', ')}`);
  L.push('');
  return L.join('\n');
}

/** the registry/CLI capability entry point */
export function runP12ProjectIntelligence(task: string, inputs: EffortInputs = {}) {
  return generateProjectStrategy(task, inputs);
}
