/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P20 · DOMAIN-AWARE ORCHESTRATION PLANNER
 * (src/core/orchestration/executionPlanner.ts) · Created by Tabrej
 *
 * Rewritten to use Intent Expansion + Domain Intelligence engines.
 * Produces a complete domain-lifecycle execution plan consumable by the Workflow Engine.
 *
 * Inspiration: ECC (task decomposition), AutoGen (agent team coordination),
 * OpenHands (task planning patterns)
 *
 * Composition, never duplication: P12 owns classification + effort + agent table,
 * P11 owns posture, P20 adds domain-aware decomposition with wave-based execution.
 */

import { expandIntent, type ProductSpec } from '../intel/intentExpansion';
import { deriveDomainModel, type DomainModel } from '../businessLogic/domainModel';
import { composeSkills, type CompositionResult } from '../intel/skillComposer';
import { classifyProject, effortPolicy, type EffortInputs, type EffortLevel, type ProjectClassification, type CategoryEvidence } from '../projectIntelligence/classify';
import { profileFor, type ProjectCategory } from '../projectIntelligence/categories';
import { AGENTS_BY_CATEGORY } from '../projectIntelligence/strategy';
import { FULL_AETHER_AGENTS } from '../scaleCatalog';
import type { AgentSpec } from '../types';

// =====================================================================
// LEGACY INTERFACES (preserved for backward compatibility)
// =====================================================================

export interface PlanAgent {
  agentId: string;
  agentName: string;
  role: string;
  wave: 1 | 2 | 3;
  purpose: string;
  reason: string;
}

export interface RequirementTierItem {
  requirement: string;
  tier: 'ESSENTIAL' | 'IMPORTANT' | 'OPTIONAL' | 'NEVER_ASK';
  handling: string;
}

export interface RequirementTiers {
  essential: RequirementTierItem[];
  important: RequirementTierItem[];
  optional: RequirementTierItem[];
  neverAsk: RequirementTierItem[];
}

// =====================================================================
// NEW DOMAIN-AWARE INTERFACES
// =====================================================================

export interface RiskFactor {
  id: string;
  category: 'technical' | 'business' | 'timeline' | 'compliance' | 'integration';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  probability: number; // 0-1
}

export interface VerificationPlan {
  testStrategy: string[];
  acceptanceTests: VerificationTest[];
  qualityGates: QualityGate[];
  coverageTargets: CoverageTarget;
}

export interface VerificationTest {
  id: string;
  name: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance' | 'security' | 'accessibility';
  scope: string;
  criteria: string[];
}

export interface QualityGate {
  id: string;
  name: string;
  check: string;
  passCondition: string;
  blocking: boolean;
}

export interface CoverageTarget {
  unitTest: number;
  integrationTest: number;
  e2eCritical: number;
  accessibility: number;
}

export interface ExecutionTask {
  id: string;
  name: string;
  description: string;
  type: 'research' | 'design' | 'implement' | 'test' | 'deploy' | 'verify';
  agent: string;
  skill?: string;
  workflow?: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  dependencies: string[];
  acceptanceCriteria: string[];
  estimatedDuration: number;
}

export interface ExecutionWave {
  id: string;
  name: string;
  description: string;
  priority: number;
  dependsOn: string[];
  tasks: ExecutionTask[];
  estimatedDuration: number;
  agents: string[];
  skills: string[];
  acceptanceCriteria: string[];
}

export interface AgentTeam {
  id: string;
  name: string;
  description: string;
  agents: string[];
  coordinator: string;
  skills: string[];
}

export interface RequirementTier {
  id: string;
  name: string;
  description: string;
  requirements: string[];
  mustHave: string[];
  shouldHave: string[];
  couldHave: string[];
  wontHave: string[];
}

export interface ExecutionPlan {
  id: string;
  projectId: string;
  productSpec: ProductSpec;
  domainModel: DomainModel;
  waves: ExecutionWave[];
  agentTeams: AgentTeam[];
  requirementTiers: RequirementTier[];
  estimatedComplexity: number;
  estimatedDuration: number;
  riskFactors: RiskFactor[];
  verificationPlan: VerificationPlan;
  // Legacy fields for backward compatibility
  task?: string;
  mode?: string;
  modeReason?: string;
  classification?: ProjectClassification;
  effort?: EffortLevel;
  team?: PlanAgent[];
  completion?: string[];
  stopWhen?: string;
}

// =====================================================================
// EXECUTION MODES (unchanged)
// =====================================================================

export const EXECUTION_MODES = [
  'INSTANT',
  'STANDARD',
  'DEEP_ENGINEERING',
  'AUTONOMOUS_PRODUCT',
  'RESEARCH_INTENSIVE',
  'CRITICAL_REPAIR',
  'PRODUCTION_HARDENING',
] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export interface ModeInputs extends EffortInputs {
  /** explicit user override — the only way to beat the inference */
  requestedMode?: ExecutionMode;
}

// =====================================================================
// DOMAIN LIFECYCLE STAGES
// =====================================================================

/**
 * The nine domain lifecycle stages every product must cover.
 * Stop condition: the plan is complete only when ALL stages are covered.
 */
export const DOMAIN_LIFECYCLE_STAGES = [
  'public_experience',    // customer-facing frontend, UI/UX
  'customer_system',      // customer accounts, dashboards, self-service
  'business_operations',  // admin panels, management tools
  'admin',                // super-admin, configuration, platform mgmt
  'staff_tools',          // internal staff tools, workflows
  'delivery',             // fulfillment, logistics, order delivery
  'analytics',            // reporting, metrics, dashboards
  'retention',            // engagement, loyalty, notifications
  'financial',            // billing, payments, invoicing, ledger
] as const;

export type DomainLifecycleStage = (typeof DOMAIN_LIFECYCLE_STAGES)[number];

/**
 * Maps product types to which lifecycle stages are primary vs secondary.
 * Unknown domains get all stages as primary.
 */
const STAGE_PRIORITY: Record<string, Record<DomainLifecycleStage, 'primary' | 'secondary' | 'skip'>> = {
  coffee_shop: {
    public_experience: 'primary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'secondary',
    staff_tools: 'primary',
    delivery: 'primary',
    analytics: 'secondary',
    retention: 'primary',
    financial: 'primary',
  },
  ecommerce: {
    public_experience: 'primary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'secondary',
    delivery: 'primary',
    analytics: 'primary',
    retention: 'primary',
    financial: 'primary',
  },
  saas: {
    public_experience: 'primary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'secondary',
    delivery: 'secondary',
    analytics: 'primary',
    retention: 'primary',
    financial: 'primary',
  },
  marketplace: {
    public_experience: 'primary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'primary',
    delivery: 'primary',
    analytics: 'primary',
    retention: 'primary',
    financial: 'primary',
  },
  manufacturing: {
    public_experience: 'secondary',
    customer_system: 'secondary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'primary',
    delivery: 'primary',
    analytics: 'primary',
    retention: 'secondary',
    financial: 'primary',
  },
  restaurant: {
    public_experience: 'primary',
    customer_system: 'secondary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'primary',
    delivery: 'primary',
    analytics: 'secondary',
    retention: 'primary',
    financial: 'primary',
  },
  healthcare: {
    public_experience: 'primary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'primary',
    delivery: 'secondary',
    analytics: 'primary',
    retention: 'secondary',
    financial: 'secondary',
  },
  finance: {
    public_experience: 'secondary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'secondary',
    delivery: 'skip',
    analytics: 'primary',
    retention: 'secondary',
    financial: 'primary',
  },
  education: {
    public_experience: 'primary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'primary',
    delivery: 'secondary',
    analytics: 'primary',
    retention: 'primary',
    financial: 'secondary',
  },
  logistics: {
    public_experience: 'secondary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'primary',
    delivery: 'primary',
    analytics: 'primary',
    retention: 'secondary',
    financial: 'primary',
  },
  booking: {
    public_experience: 'primary',
    customer_system: 'primary',
    business_operations: 'primary',
    admin: 'primary',
    staff_tools: 'primary',
    delivery: 'primary',
    analytics: 'secondary',
    retention: 'primary',
    financial: 'primary',
  },
};

function getStagePriority(productType: string): Record<DomainLifecycleStage, 'primary' | 'secondary' | 'skip'> {
  return STAGE_PRIORITY[productType] ?? Object.fromEntries(
    DOMAIN_LIFECYCLE_STAGES.map((s) => [s, 'primary' as const])
  ) as Record<DomainLifecycleStage, 'primary' | 'secondary' | 'skip'>;
}

// =====================================================================
// CATALOG HELPERS (unchanged from original)
// =====================================================================

const AGENT_INDEX: Map<string, AgentSpec> = new Map(FULL_AETHER_AGENTS.map((a) => [a.id, a]));
const byId = (id: string): AgentSpec | undefined => AGENT_INDEX.get(id);

/** the effort-level CAP on the team */
const TEAM_CAP: Record<EffortLevel['level'], number> = { FOCUSED: 2, STANDARD: 6, DEEP: 10, DEEPEST: 14 };

// =====================================================================
// MODE SELECTION (unchanged)
// =====================================================================

export function selectMode(task: string, cls: ProjectClassification, inputs: ModeInputs = {}): { mode: ExecutionMode; reason: string } {
  if (inputs.requestedMode) return { mode: inputs.requestedMode, reason: 'explicit user override' };

  const low = task.toLowerCase();
  const words = task.trim().split(/\s+/).length;
  const repair = /\b(fix|broken|regression|hotfix|crash|failing test|error when|unstable|flaky|stops working)\b/.test(low);
  const harden = /\b(production|deploy|deployment|go ?live|hardening|scale up|uptime|sla|migration window|release day)\b/.test(low);
  const smallSignal = /\b(typo|css|style|copy|text|rename|label|color|colour|font|small)\b/.test(low) &&
    /\b(page|line|file|button|label|fix|typo|about|header|footer|nav|color|colour|font|css)\b/.test(low) &&
    words <= 12;
  const flowTokens = /\b(checkout|billing|subscription|payment|pay|cad|3d|jewel|streaming|upload|search|reserv|invoic|ledger|multi-tenant|account|cart|player|match|progression)\b/.test(low);
  const creationVerb = /\b(build|create|make|launch|start|new|develop|design|something|amazing|surprise|anything)\b/.test(low);
  const broadCreation = creationVerb && !flowTokens && words <= 8 && !repair && !harden;

  if (repair && smallSignal) {
    return { mode: 'INSTANT', reason: 'single-line repair on one surface: one engineer + a verifier' };
  }
  if (repair && !harden) {
    return { mode: 'CRITICAL_REPAIR', reason: 'repair signal: smaller debugging-led team, root-cause isolation first' };
  }
  if (harden) {
    return { mode: 'PRODUCTION_HARDENING', reason: 'deployment/production signal: readiness + observability + tested rollback' };
  }
  if (smallSignal) {
    return { mode: 'INSTANT', reason: 'single-surface change: one engineer + a verifier, zero coordination overhead' };
  }
  if (broadCreation) {
    return { mode: 'AUTONOMOUS_PRODUCT', reason: 'broad creation mandate: the planner OWES the scoping decision — disclosed and reversible' };
  }

  const lvl = effortPolicy(cls, inputs).level;
  if (lvl === 'DEEPEST' || lvl === 'DEEP') return { mode: 'DEEP_ENGINEERING', reason: `effort ${lvl} → full team, adversarial + security waves` };
  if (lvl === 'FOCUSED') return { mode: 'INSTANT', reason: 'effort FOCUSED → single engineer + verifier' };
  return { mode: 'STANDARD', reason: 'effort STANDARD → primary category team with verification wave' };
}

// =====================================================================
// REQUIREMENT TIERS (unchanged)
// =====================================================================

export function classifyRequirementTiers(task: string): RequirementTiers {
  const items: RequirementTierItem[] = [];
  const low = task.toLowerCase();
  const push = (requirement: string, tier: RequirementTierItem['tier'], handling: string) => items.push({ requirement, tier, handling });

  for (const kind of ['api key', 'api-key', 'apikey', 'token', 'secret', 'password', 'credential', 'private key']) {
    if (low.includes(kind)) {
      push(`${kind} for the target service`, 'NEVER_ASK', 'wire a typed placeholder + env-var slot now; request the real value only at first live call');
    }
  }
  const concreteDomain = /\b(coffee|tea|bakery|marketplace|crm|erp|billing|booking|streaming|game|jewel|clinic|patient|saas|store|shop|portfolio|dashboard|forum|community|media|music|video|photo|travel|logistic|manufactur|education|course|job|recruit|realtor|estate|fitness|food|restaurant)\b/.test(low);
  if (/\b(build|create|make|launch|start|new)\b/.test(low) && !/existing|current|this project|the app|the site/.test(low)) {
    if (concreteDomain) {
      push('the audience the category profile implies (buyer for a store, patient for a clinic, …)', 'OPTIONAL', 'decided by the category design language; a restyle is a cheap revert');
    } else {
      push('which audience this product serves first (buyer / end-user / operator)', 'ESSENTIAL', 'asked once, as a single named question — without it the whole IA is a guess');
    }
  }
  push('monetization model (free / freemium / paid / marketplace fees)', 'IMPORTANT', 'assumed: free-with-paid-later for consumer, per-seat for B2B; disclosed, reversible');
  push('deployment target (static host / container / serverless / self-host)', 'OPTIONAL', 'decided by policy from the category profile; recorded, not asked');
  push('brand voice (formal / friendly / clinical / playful)', 'OPTIONAL', 'decided by the category design language; a restyle is a cheap revert');
  return {
    essential: items.filter((i) => i.tier === 'ESSENTIAL'),
    important: items.filter((i) => i.tier === 'IMPORTANT'),
    optional: items.filter((i) => i.tier === 'OPTIONAL'),
    neverAsk: items.filter((i) => i.tier === 'NEVER_ASK'),
  };
}

// =====================================================================
// TEAM ASSEMBLY (unchanged)
// =====================================================================

export function assembleTeam(cls: ProjectClassification, effort: EffortLevel['level'], mode: ExecutionMode): PlanAgent[] {
  const primary = cls.unseen ? 'UNSEEN' : cls.primary;
  const pool: Array<{ id: string; reason: string }> = [];

  const take = (ids: string[], reason: string, max = Infinity) => {
    for (const id of ids) {
      if (pool.length >= max) break;
      if (pool.some((p) => p.id === id)) continue;
      if (!byId(id)) continue;
      pool.push({ id, reason });
    }
  };

  const primaryAgents = AGENTS_BY_CATEGORY[primary] ?? AGENTS_BY_CATEGORY.UNSEEN;
  const impls = primaryAgents.filter((id) => id.startsWith('impl-') || id.startsWith('arch-') || id.startsWith('db-') || id.startsWith('video-media'));

  if (mode === 'CRITICAL_REPAIR') {
    take(['debug-scientific-root-cause', 'verify-qa-regression-guardian'], 'repair team: root-cause first, the regression guard proves it is fixed');
    take(primaryAgents.filter((id) => !id.startsWith('design-')).slice(0, 1), 'one domain expert, only if the fix touches domain rules');
  } else if (effort === 'FOCUSED') {
    take(impls.slice(0, 1), 'instant: one engineer, zero coordination overhead');
    take(['verify-qa-regression-guardian'], 'a verifier always — files are not completion');
  } else {
    const cap = TEAM_CAP[effort];
    take(primaryAgents, 'the primary category\'s load-bearing team', cap);
    for (const sec of cls.categories.filter((c) => c.role === 'secondary')) {
      const secAgents = (AGENTS_BY_CATEGORY[sec.category] ?? []).filter((id) => !primaryAgents.includes(id));
      if (secAgents.length && pool.length < cap) take(secAgents.slice(0, 1), `layered category ${sec.category}: evidence [${sec.matched.join(', ')}]`, cap);
    }
    if (effort === 'DEEP' || effort === 'DEEPEST') {
      take(cls.profile.securityPosture !== 'STANDARD' ? ['adversarial-arch-challenger'] : ['adversarial-code-breaker'], 'a challenger wave at DEEP+ — independent review before "complete"');
    }
    if (effort === 'DEEPEST') {
      take(['memory-continuity-provenance-curator'], 'deepest effort records provenance for the evolution ledger');
    }
    if (mode === 'PRODUCTION_HARDENING') {
      take(['verify-qa-benchmark-statistician', 'arch-zero-downtime-migration'], 'hardening: measured performance + zero-downtime migration paths');
    }
    if (mode === 'RESEARCH_INTENSIVE') {
      take(impls.slice(0, 1), 'after the research wave (wave 1), one engineer implements against the derived plan');
    }
    if (!pool.some((p) => p.id === 'verify-qa-regression-guardian') && pool.length < TEAM_CAP[effort]) {
      take(['verify-qa-regression-guardian'], 'the completion gate: wave 3 runs the criteria and records verdicts');
    }
  }

  return pool.slice(0, TEAM_CAP[effort] === 2 && mode === 'INSTANT' ? 2 : TEAM_CAP[effort]).map((p) => {
    const spec = byId(p.id)!;
    return {
      agentId: spec.id,
      agentName: spec.name,
      role: spec.category,
      wave: waveFor(spec.id),
      purpose: purposeFor(spec.id, mode, primary),
      reason: p.reason,
    };
  });
}

function waveFor(agentId: string): 1 | 2 | 3 {
  const a = byId(agentId);
  if (!a) return 2;
  if (a.category === 'architecture' || a.category === 'memory' || agentId.startsWith('design-')) return 1;
  if (a.category === 'security' || a.category === 'verification' || a.category === 'adversarial' || agentId.startsWith('debug-') || agentId.startsWith('video-media')) return 3;
  return 2;
}

function purposeFor(agentId: string, mode: ExecutionMode, primary: string): string {
  const a = byId(agentId);
  if (!a) return 'assigned by catalog lookup';
  if (mode === 'CRITICAL_REPAIR' && agentId.startsWith('debug-')) return 'root-cause isolation: bisect the regression, find the minimal failing step, propose the fix';
  if (agentId.startsWith('design-')) return 'the design language ' + (profileFor(primary as ProjectCategory)?.designLanguage ?? 'first-principles') + ' — set before implementation';
  if (agentId.startsWith('arch-')) return 'architecture for the primary domain; challenge weak decisions with evidence, not taste';
  if (agentId.startsWith('sec-')) return 'the security posture ' + (profileFor(primary as ProjectCategory)?.securityPosture ?? 'STANDARD') + ': boundary review before wave-3 sign-off';
  if (agentId.startsWith('verify-')) return 'verification wave: run the completion criteria, record verdicts — the plan stops on evidence, not on "files generated"';
  if (agentId.startsWith('adversarial-')) return 'challenge the plan + artifact: every objection carries evidence';
  if (agentId.startsWith('memory-')) return 'record the decision provenance + reusable knowledge for the evolution ledger';
  if (agentId.startsWith('debug-')) return 'repair path: reproduce, isolate, fix, verify — the debugging-led team';
  if (agentId.startsWith('video-media')) return 'media pipeline: the category\'s load-bearing media work';
  return 'implementation specialist: build the primary workflow end-to-end, then the secondary ones';
}

// =====================================================================
// LEGACY planExecution (backward-compatible)
// =====================================================================

export function planExecution(task: string, inputs: ModeInputs = {}): ExecutionPlan {
  // Delegate to the new domain-aware planner, then add legacy fields
  const richPlan = planDomainExecution(task, inputs);
  richPlan.task = task;
  richPlan.mode = richPlan.mode;
  richPlan.modeReason = richPlan.modeReason;
  richPlan.classification = richPlan.classification;
  richPlan.effort = richPlan.effort;
  richPlan.team = richPlan.team;
  richPlan.completion = richPlan.completion;
  richPlan.stopWhen = richPlan.stopWhen;
  return richPlan;
}

export function agentBudget(effort: EffortLevel['level']): number {
  return TEAM_CAP[effort];
}

// =====================================================================
// DOMAIN-AWARE PLANNER
// =====================================================================

export function planDomainExecution(prompt: string, inputs: ModeInputs = {}): ExecutionPlan {
  // 1. Expand intent to get ProductSpec
  const productSpec = expandIntent(prompt);

  // 2. Classify the project
  const classification = classifyProject(prompt);

  // 3. Determine execution mode
  const modeResult = selectMode(prompt, classification, inputs);

  // 4. Compute effort
  const effort = effortPolicy(classification, inputs);

  // 5. Load DomainModel from Domain Intelligence
  const domainModel = deriveDomainModel(
    classification.unseen ? 'UNSEEN' : classification.primary,
    classification.profile
  );

  // 6. Build agent teams
  const team = assembleTeam(classification, effort.level, modeResult.mode);
  const agentTeams = buildAgentTeams(team, classification, effort.level, modeResult.mode);

  // 7. Get stage priorities for this domain
  const stagePriority = getStagePriority(productSpec.productType);

  // 8. Build waves for each domain lifecycle stage
  const waves = buildLifecycleWaves(
    productSpec,
    domainModel,
    classification,
    effort.level,
    modeResult.mode,
    stagePriority,
    team,
  );

  // 9. Build requirement tiers (MoSCoW)
  const requirementTiers = buildRequirementTiers(productSpec, domainModel, effort.level);

  // 10. Estimate complexity and duration
  const complexity = estimateComplexity(productSpec, domainModel, waves, effort.level);
  const duration = estimateDuration(waves, effort.level);

  // 11. Identify risk factors
  const riskFactors = identifyRiskFactors(productSpec, domainModel, classification, effort.level);

  // 12. Build verification plan
  const verificationPlan = buildVerificationPlan(productSpec, domainModel, waves, effort.level);

  // 13. Legacy fields
  const legacyTiers = classifyRequirementTiers(prompt);
  const completion = buildCompletionCriteria(modeResult.mode, effort.level, verificationPlan);
  const stopWhen = buildStopCondition(modeResult.mode, waves, verificationPlan);

  const planId = `plan-${productSpec.productType}-${Date.now().toString(36)}`;
  const projectId = `proj-${productSpec.productType}`;

  return {
    id: planId,
    projectId,
    productSpec,
    domainModel,
    waves,
    agentTeams,
    requirementTiers,
    estimatedComplexity: complexity,
    estimatedDuration: duration,
    riskFactors,
    verificationPlan,
    task: prompt,
    mode: modeResult.mode,
    modeReason: modeResult.reason,
    classification,
    effort,
    team,
    completion,
    stopWhen,
  };
}

// =====================================================================
// WAVE BUILDER
// =====================================================================

function buildLifecycleWaves(
  productSpec: ProductSpec,
  domainModel: DomainModel,
  classification: ProjectClassification,
  effortLevel: EffortLevel['level'],
  mode: ExecutionMode,
  stagePriority: Record<DomainLifecycleStage, 'primary' | 'secondary' | 'skip'>,
  team: PlanAgent[],
): ExecutionWave[] {
  const waves: ExecutionWave[] = [];

  // Wave ordering: research first, then foundation, then primary stages, then secondary, then verification
  const stageOrder: DomainLifecycleStage[] = [
    'public_experience',
    'customer_system',
    'business_operations',
    'admin',
    'staff_tools',
    'delivery',
    'analytics',
    'retention',
    'financial',
  ];

  // Group stages into waves
  const primaryStages = stageOrder.filter((s) => stagePriority[s] === 'primary');
  const secondaryStages = stageOrder.filter((s) => stagePriority[s] === 'secondary');

  // Always start with research wave
  waves.push(createResearchWave(productSpec, domainModel, team));

  // Foundation wave (architecture, data model, core infrastructure)
  waves.push(createFoundationWave(productSpec, domainModel, team, effortLevel, classification));

  // Primary domain stages — each gets its own wave
  for (const stage of primaryStages) {
    waves.push(createStageWave(stage, productSpec, domainModel, 'primary', team, effortLevel, waves.length));
  }

  // Secondary domain stages — batched together if many
  if (secondaryStages.length > 0) {
    waves.push(createSecondaryWave(secondaryStages, productSpec, domainModel, team, effortLevel, waves.length));
  }

  // Financial wave (always separate, always critical)
  if (stagePriority.financial !== 'skip') {
    waves.push(createFinancialWave(productSpec, domainModel, team, effortLevel, waves.length));
  }

  // Verification wave
  waves.push(createVerificationWave(productSpec, domainModel, waves, effortLevel, team));

  // Set dependencies between waves
  for (let i = 0; i < waves.length; i++) {
    if (i === 0) {
      waves[i].dependsOn = [];
    } else {
      waves[i].dependsOn = [waves[i - 1].id];
    }
  }

  return waves;
}

function createResearchWave(productSpec: ProductSpec, domainModel: DomainModel, team: PlanAgent[]): ExecutionWave {
  const researchAgents = team.filter((a) => a.wave === 1 || a.role === 'architecture' || a.role === 'memory');
  const acceptanceCriteria = [
    'Product specification is complete with all unknowns documented',
    'Domain model covers all participants, entities, workflows, and financial flows',
    'All domain lifecycle stages are identified and prioritized',
    'Risk factors are catalogued with mitigations',
  ];

  return {
    id: 'wave-research',
    name: 'Research & Domain Modeling',
    description: 'Expand intent, load domain intelligence, model the complete domain lifecycle, identify risks',
    priority: 1,
    dependsOn: [],
    tasks: [
      {
        id: 'task-expand-intent',
        name: 'Expand Intent to ProductSpec',
        description: 'Use Intent Expansion engine to detect intent, product type, personas, features, and requirements from the raw prompt',
        type: 'research',
        agent: researchAgents[0]?.agentId ?? 'arch-ddd-boundary',
        inputs: { prompt: productSpec.intent, productType: productSpec.productType },
        outputs: { productSpec: 'complete' },
        dependencies: [],
        acceptanceCriteria: ['All ProductSpec fields populated', 'Confidence score > 0.5', 'Unknowns explicitly flagged'],
        estimatedDuration: 5,
      },
      {
        id: 'task-load-domain-model',
        name: 'Load Domain Intelligence Model',
        description: 'Use Domain Intelligence engine to load the domain-specific knowledge: participants, entities, workflows, financial flows, permissions, constraints',
        type: 'research',
        agent: researchAgents[0]?.agentId ?? 'arch-ddd-boundary',
        inputs: { category: domainModel.category, domainId: productSpec.productType },
        outputs: { domainModel: 'complete' },
        dependencies: ['task-expand-intent'],
        acceptanceCriteria: ['All domain model sections populated', 'Participants identified', 'Business entities with invariants defined', 'Workflows mapped'],
        estimatedDuration: 8,
      },
      {
        id: 'task-map-lifecycle-stages',
        name: 'Map Domain Lifecycle Stages',
        description: 'Identify all nine domain lifecycle stages, prioritize them for this product type, and plan the wave structure',
        type: 'research',
        agent: researchAgents[1]?.agentId ?? 'arch-api-contract-federation',
        inputs: { productType: productSpec.productType, domainModel: domainModel.label },
        outputs: { lifecycleStages: 'mapped', stagePriority: 'assigned' },
        dependencies: ['task-load-domain-model'],
        acceptanceCriteria: ['All 9 lifecycle stages considered', 'Primary vs secondary stages identified', 'Dependencies between stages documented'],
        estimatedDuration: 5,
      },
      {
        id: 'task-compose-skills',
        name: 'Compose Minimal Skill Set',
        description: 'Use Skill Composer to determine the minimal complete skill set for the domains and depth',
        type: 'research',
        agent: researchAgents[0]?.agentId ?? 'arch-ddd-boundary',
        workflow: 'skill-composition',
        inputs: { domains: productSpec.domains, task: productSpec.intent },
        outputs: { skillComposition: 'complete' },
        dependencies: ['task-load-domain-model'],
        acceptanceCriteria: ['Skill composition is minimal', 'Total token overhead < 200', 'Skipped skills are recorded'],
        estimatedDuration: 3,
      },
    ],
    estimatedDuration: 21,
    agents: researchAgents.map((a) => a.agentId),
    skills: ['req-analysis', 'domain-modeling', 'product-discovery'],
    acceptanceCriteria,
  };
}

function createFoundationWave(
  productSpec: ProductSpec,
  domainModel: DomainModel,
  team: PlanAgent[],
  effortLevel: EffortLevel['level'],
  classification: ProjectClassification,
): ExecutionWave {
  const archAgents = team.filter((a) => a.role === 'architecture' || a.agentId.startsWith('arch-'));
  const dbAgents = team.filter((a) => a.agentId.startsWith('db-'));
  const agents = [...new Set([...archAgents, ...dbAgents].map((a) => a.agentId))];

  const acceptanceCriteria = [
    'System architecture documented with component boundaries',
    'Database schema designed with all entities from the domain model',
    'API contracts defined (versioned, with error envelopes)',
    'Security posture applied: tenant boundaries, role enforcement',
    'All technical requirements from ProductSpec addressed',
  ];

  return {
    id: 'wave-foundation',
    name: 'Foundation & Architecture',
    description: 'System architecture, database schema, API contracts, security foundation — the bedrock all other waves build on',
    priority: 2,
    dependsOn: ['wave-research'],
    tasks: [
      {
        id: 'task-architecture',
        name: 'Design System Architecture',
        description: 'Design the system architecture based on domain model entities, workflows, and technical requirements. Apply the category profile\'s architecture hint.',
        type: 'design',
        agent: archAgents[0]?.agentId ?? 'arch-ddd-boundary',
        skill: 'architecture',
        inputs: { domainModel: domainModel.label, techRequirements: productSpec.technicalRequirements.map((t) => t.name) },
        outputs: { architecture: 'documented', componentBoundaries: 'defined' },
        dependencies: [],
        acceptanceCriteria: ['Architecture aligns with domain model', 'Component boundaries are clear', 'Scaling strategy defined'],
        estimatedDuration: 10,
      },
      {
        id: 'task-database-design',
        name: 'Design Database Schema',
        description: 'Design the database schema from domain model entities with proper relationships, indexes, and constraints. Ensure all invariants are enforceable.',
        type: 'design',
        agent: dbAgents[0]?.agentId ?? 'db-storage-postgres-internals-surgeon',
        skill: 'database-design',
        inputs: { entities: domainModel.entities.map((e) => e.name), invariants: domainModel.entities.flatMap((e) => e.invariants) },
        outputs: { schema: 'designed', migrationPlan: 'ready' },
        dependencies: ['task-architecture'],
        acceptanceCriteria: ['All domain entities represented', 'All invariants enforceable via constraints', 'Index strategy documented'],
        estimatedDuration: 8,
      },
      {
        id: 'task-api-design',
        name: 'Design API Contracts',
        description: 'Design versioned API contracts with consistent error envelopes, pagination, and idempotent writes where the domain mutates state.',
        type: 'design',
        agent: archAgents[0]?.agentId ?? 'arch-ddd-boundary',
        skill: 'api-design',
        inputs: { workflows: domainModel.workflows, entities: domainModel.entities.map((e) => e.name) },
        outputs: { apiContracts: 'defined', errorEnvelope: 'standardized' },
        dependencies: ['task-architecture'],
        acceptanceCriteria: ['All workflows have API endpoints', 'Error envelope is consistent', 'Idempotency keys for mutations'],
        estimatedDuration: 6,
      },
      {
        id: 'task-security-foundation',
        name: 'Establish Security Foundation',
        description: 'Apply the security posture from the category profile. Implement authentication, authorization, tenant boundaries, and data protection.',
        type: 'design',
        agent: team.find((a) => a.agentId.startsWith('sec-'))?.agentId ?? 'sec-oauth-oidc-ZeroTrust',
        skill: 'security-review',
        inputs: { securityRequirements: productSpec.securityRequirements, permissions: domainModel.permissions, posture: classification.profile.securityPosture },
        outputs: { securityModel: 'defined', authStrategy: 'documented' },
        dependencies: ['task-architecture'],
        acceptanceCriteria: ['Security posture matches category profile', 'All permissions mapped', 'Data protection strategy defined'],
        estimatedDuration: 6,
      },
    ],
    estimatedDuration: 30,
    agents,
    skills: ['architecture', 'database-design', 'api-design', 'security-review'],
    acceptanceCriteria,
  };
}

function createStageWave(
  stage: DomainLifecycleStage,
  productSpec: ProductSpec,
  domainModel: DomainModel,
  importance: 'primary' | 'secondary',
  team: PlanAgent[],
  effortLevel: EffortLevel['level'],
  waveIndex: number,
): ExecutionWave {
  const stageConfig = getStageConfiguration(stage, productSpec, domainModel, team);
  const stageAgents = selectAgentsForStage(stage, team, importance);
  const stageSkills = selectSkillsForStage(stage, productSpec);

  return {
    id: `wave-${stage}`,
    name: stageConfig.name,
    description: stageConfig.description,
    priority: waveIndex,
    dependsOn: [waveIndex > 2 ? `wave-${DOMAIN_LIFECYCLE_STAGES[waveIndex - 3]}` : 'wave-foundation'],
    tasks: stageConfig.tasks,
    estimatedDuration: stageConfig.tasks.reduce((sum, t) => sum + t.estimatedDuration, 0),
    agents: stageAgents,
    skills: stageSkills,
    acceptanceCriteria: stageConfig.acceptanceCriteria,
  };
}

function createSecondaryWave(
  stages: DomainLifecycleStage[],
  productSpec: ProductSpec,
  domainModel: DomainModel,
  team: PlanAgent[],
  effortLevel: EffortLevel['level'],
  waveIndex: number,
): ExecutionWave {
  const stageNames = stages.map((s) => getStageLabel(s)).join(' + ');
  const tasks: ExecutionTask[] = [];
  const agents: string[] = [];
  const skills: string[] = [];
  const acceptanceCriteria: string[] = [];

  for (const stage of stages) {
    const config = getStageConfiguration(stage, productSpec, domainModel, team);
    tasks.push(...config.tasks);
    agents.push(...selectAgentsForStage(stage, team, 'secondary'));
    skills.push(...selectSkillsForStage(stage, productSpec));
    acceptanceCriteria.push(...config.acceptanceCriteria);
  }

  return {
    id: 'wave-secondary-stages',
    name: `Secondary: ${stageNames}`,
    description: `Secondary lifecycle stages: ${stages.join(', ')}`,
    priority: waveIndex,
    dependsOn: [`wave-${DOMAIN_LIFECYCLE_STAGES[waveIndex - 2]}`],
    tasks,
    estimatedDuration: tasks.reduce((sum, t) => sum + t.estimatedDuration, 0),
    agents: [...new Set(agents)],
    skills: [...new Set(skills)],
    acceptanceCriteria,
  };
}

function createFinancialWave(
  productSpec: ProductSpec,
  domainModel: DomainModel,
  team: PlanAgent[],
  effortLevel: EffortLevel['level'],
  waveIndex: number,
): ExecutionWave {
  const financeAgent = team.find((a) => a.agentId.includes('payment') || a.agentId.includes('ledger'))?.agentId
    ?? team.find((a) => a.role === 'implementation')?.agentId
    ?? 'impl-polyglot-typescript-surgeon';

  const tasks: ExecutionTask[] = [
    {
      id: 'task-billing-system',
      name: 'Implement Billing & Payment System',
      description: 'Implement the billing system based on the business model, pricing strategy, and financial flows from the domain model. Ensure paise-exact calculations.',
      type: 'implement',
      agent: financeAgent,
      skill: 'financial-calcs',
      inputs: {
        businessModel: productSpec.businessModel.modelType,
        revenueStreams: productSpec.businessModel.revenueStreams,
        financialFlows: domainModel.financialFlows,
      },
      outputs: { billingSystem: 'implemented', paymentIntegration: 'wired' },
      dependencies: [`wave-${DOMAIN_LIFECYCLE_STAGES[waveIndex - 2]}`],
      acceptanceCriteria: [
        'All revenue streams implemented',
        'Payment integration wired (placeholder for secrets)',
        'Paise-exact calculations verified',
        'Invoice generation matches domain model',
        'Refund flow implemented with audit trail',
      ],
      estimatedDuration: effortLevel === 'DEEPEST' ? 15 : effortLevel === 'DEEP' ? 12 : 8,
    },
    {
      id: 'task-financial-reporting',
      name: 'Implement Financial Reporting',
      description: 'Implement financial reporting: transaction history, reconciliation, audit trail, and export capabilities.',
      type: 'implement',
      agent: financeAgent,
      skill: 'financial-calcs',
      inputs: { financialFlows: domainModel.financialFlows, successMetrics: domainModel.successMetrics },
      outputs: { reporting: 'implemented', auditTrail: 'complete' },
      dependencies: ['task-billing-system'],
      acceptanceCriteria: [
        'All financial flows traceable',
        'Reconciliation reports available',
        'Audit trail is append-only',
        'Export to standard formats (CSV, PDF)',
      ],
      estimatedDuration: effortLevel === 'DEEPEST' ? 10 : effortLevel === 'DEEP' ? 8 : 5,
    },
  ];

  return {
    id: 'wave-financial',
    name: 'Financial & Billing',
    description: 'Billing, payments, invoicing, financial reporting, audit trail — the money layer',
    priority: waveIndex,
    dependsOn: [`wave-${DOMAIN_LIFECYCLE_STAGES[Math.max(0, waveIndex - 2)]}`],
    tasks,
    estimatedDuration: tasks.reduce((sum, t) => sum + t.estimatedDuration, 0),
    agents: [financeAgent],
    skills: ['financial-calcs', 'business-logic', 'database-design'],
    acceptanceCriteria: [
      'All billing flows are paise-exact',
      'Payment secrets are placeholders, never hardcoded',
      'Financial reports reconcile to the ledger',
      'Audit trail is immutable',
    ],
  };
}

function createVerificationWave(
  productSpec: ProductSpec,
  domainModel: DomainModel,
  allWaves: ExecutionWave[],
  effortLevel: EffortLevel['level'],
  team: PlanAgent[],
): ExecutionWave {
  const allTasks = allWaves.flatMap((w) => w.tasks);
  const allAgents = [...new Set(allWaves.flatMap((w) => w.agents))];

  return {
    id: 'wave-verification',
    name: 'Verification & Testing',
    description: 'Comprehensive testing: unit, integration, e2e, performance, security, and accessibility. The completion gate.',
    priority: 999,
    dependsOn: allWaves.filter((w) => w.id !== 'wave-verification').map((w) => w.id),
    tasks: [
      {
        id: 'task-unit-tests',
        name: 'Unit Tests',
        description: 'Write unit tests for all business logic functions, domain entity invariants, and calculation correctness (especially financial)',
        type: 'test',
        agent: 'verify-qa-regression-guardian',
        skill: 'automated-testing',
        inputs: { entities: domainModel.entities.map((e) => e.name), invariants: domainModel.entities.flatMap((e) => e.invariants) },
        outputs: { unitTests: 'complete', coverage: 'measured' },
        dependencies: allTasks.map((t) => t.id),
        acceptanceCriteria: ['All entity invariants have tests', 'Financial calculations have property tests', 'Coverage meets target'],
        estimatedDuration: effortLevel === 'DEEPEST' ? 15 : effortLevel === 'DEEP' ? 10 : 6,
      },
      {
        id: 'task-integration-tests',
        name: 'Integration Tests',
        description: 'Write integration tests for API endpoints, database operations, and third-party service integrations',
        type: 'test',
        agent: 'verify-qa-regression-guardian',
        skill: 'automated-testing',
        inputs: { apiContracts: productSpec.integrationRequirements, workflows: domainModel.workflows },
        outputs: { integrationTests: 'complete' },
        dependencies: allTasks.map((t) => t.id),
        acceptanceCriteria: ['All API endpoints tested', 'Database transactions tested', 'Integration mocks for external services'],
        estimatedDuration: effortLevel === 'DEEPEST' ? 12 : effortLevel === 'DEEP' ? 8 : 5,
      },
      {
        id: 'task-e2e-tests',
        name: 'End-to-End Tests',
        description: 'Write e2e tests for critical user journeys across the domain lifecycle stages',
        type: 'test',
        agent: 'verify-qa-regression-guardian',
        skill: 'automated-testing',
        inputs: { userJourneys: domainModel.workflows, personas: productSpec.userPersonas.map((p) => p.role) },
        outputs: { e2eTests: 'complete' },
        dependencies: allTasks.map((t) => t.id),
        acceptanceCriteria: ['Happy path for each persona', 'Error scenarios covered', 'Cross-stage journeys tested'],
        estimatedDuration: effortLevel === 'DEEPEST' ? 10 : effortLevel === 'DEEP' ? 7 : 4,
      },
      {
        id: 'task-security-audit',
        name: 'Security Audit',
        description: 'Run security review: OWASP checks, authentication flows, data protection, permission enforcement',
        type: 'verify',
        agent: team.find((a) => a.agentId.startsWith('sec-'))?.agentId ?? 'sec-oauth-oidc-ZeroTrust',
        skill: 'security-review',
        inputs: { securityRequirements: productSpec.securityRequirements, permissions: domainModel.permissions },
        outputs: { securityAudit: 'passed', vulnerabilities: 'none-critical' },
        dependencies: ['task-unit-tests', 'task-integration-tests'],
        acceptanceCriteria: ['OWASP Top 10 addressed', 'Authentication flows verified', 'No critical vulnerabilities'],
        estimatedDuration: effortLevel === 'DEEPEST' ? 8 : effortLevel === 'DEEP' ? 6 : 4,
      },
      {
        id: 'task-accessibility-check',
        name: 'Accessibility Verification',
        description: 'Verify WCAG compliance, screen reader support, keyboard navigation, and color contrast',
        type: 'verify',
        agent: team.find((a) => a.agentId.includes('design'))?.agentId ?? 'design-ui-design-systems-director',
        inputs: { designRequirements: productSpec.designRequirements },
        outputs: { accessibilityReport: 'passed' },
        dependencies: ['task-unit-tests'],
        acceptanceCriteria: ['WCAG 2.1 AA compliance', 'Screen reader navigation works', 'Keyboard-only navigation complete'],
        estimatedDuration: 4,
      },
    ],
    estimatedDuration: 0, // calculated below
    agents: [...new Set(allAgents.filter((id) => id.startsWith('verify-') || id.startsWith('sec-') || id.startsWith('adversarial-')))],
    skills: ['automated-testing', 'security-review', 'accessibility'],
    acceptanceCriteria: [
      'All domain lifecycle stages have passing tests',
      'Financial calculations are paise-exact (property tests)',
      'Security audit shows no critical vulnerabilities',
      'All acceptance criteria from previous waves are met',
      'Performance benchmarks meet targets',
      'Accessibility compliance verified',
    ],
  };
}

// =====================================================================
// STAGE CONFIGURATION HELPERS
// =====================================================================

function getStageLabel(stage: DomainLifecycleStage): string {
  const labels: Record<DomainLifecycleStage, string> = {
    public_experience: 'Public Experience',
    customer_system: 'Customer System',
    business_operations: 'Business Operations',
    admin: 'Admin & Configuration',
    staff_tools: 'Staff Tools',
    delivery: 'Delivery & Fulfillment',
    analytics: 'Analytics & Reporting',
    retention: 'Retention & Engagement',
    financial: 'Financial & Billing',
  };
  return labels[stage];
}

function getStageConfiguration(stage: DomainLifecycleStage, productSpec: ProductSpec, domainModel: DomainModel, team: PlanAgent[]): {
  name: string;
  description: string;
  tasks: ExecutionTask[];
  acceptanceCriteria: string[];
} {
  const label = getStageLabel(stage);

  switch (stage) {
    case 'public_experience':
      return {
        name: `Public Experience — ${label}`,
        description: 'Customer-facing frontend: product browsing, search, customization, checkout UI, brand experience',
        tasks: [
          {
            id: `task-${stage}-frontend`,
            name: 'Build Public-Facing Frontend',
            description: `Build the public-facing experience: homepage, product browsing, search, and brand experience based on ${productSpec.productType} domain patterns`,
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            skill: 'design-systems',
            inputs: { designRequirements: productSpec.designRequirements, features: productSpec.featureRequirements.filter((f) => f.priority === 'essential').map((f) => f.name) },
            outputs: { frontend: 'implemented', components: 'reusable' },
            dependencies: [],
            acceptanceCriteria: ['Brand experience matches design requirements', 'Product browsing works', 'Search and filtering functional', 'Responsive across devices'],
            estimatedDuration: 12,
          },
          {
            id: `task-${stage}-interactions`,
            name: 'Implement User Interactions',
            description: 'Implement core user interactions: product customization, cart, checkout flow initiation',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { workflows: domainModel.workflows.slice(0, 2), features: productSpec.featureRequirements.filter((f) => f.priority === 'essential').map((f) => f.name) },
            outputs: { interactions: 'complete', checkoutFlow: 'initiated' },
            dependencies: [`task-${stage}-frontend`],
            acceptanceCriteria: ['Checkout flow initiates correctly', 'Cart operations work', 'Product customization works'],
            estimatedDuration: 10,
          },
        ],
        acceptanceCriteria: [
          'Public-facing frontend fully functional',
          'Brand experience matches category profile',
          'Product browsing and search work',
          'Checkout initiation flow complete',
          'Responsive on mobile, tablet, desktop',
        ],
      };

    case 'customer_system':
      return {
        name: `Customer System — ${label}`,
        description: 'Customer accounts, profiles, order history, self-service tools, preferences management',
        tasks: [
          {
            id: `task-${stage}-accounts`,
            name: 'Build Customer Account System',
            description: 'Build customer registration, authentication, profile management, and preferences',
            type: 'implement',
            agent: team.find((a) => a.agentId.includes('auth') || a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { personas: productSpec.userPersonas.filter((p) => p.role === 'customer' || p.role === 'buyer' || p.role === 'user').map((p) => ({ role: p.role, needs: p.needs })), securityRequirements: productSpec.securityRequirements },
            outputs: { authSystem: 'implemented', profiles: 'managed' },
            dependencies: [],
            acceptanceCriteria: ['Customer registration and login work', 'Profile management complete', 'Preferences persist correctly'],
            estimatedDuration: 10,
          },
          {
            id: `task-${stage}-self-service`,
            name: 'Build Self-Service Tools',
            description: 'Build customer self-service: order history, tracking, returns, support requests',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { features: productSpec.featureRequirements.filter((f) => f.category === 'customer').map((f) => f.name), domainModel: domainModel.label },
            outputs: { selfService: 'complete', orderManagement: 'functional' },
            dependencies: [`task-${stage}-accounts`],
            acceptanceCriteria: ['Order history accessible', 'Return/refund request flow works', 'Support ticket creation works'],
            estimatedDuration: 8,
          },
        ],
        acceptanceCriteria: [
          'Customer accounts fully functional',
          'Authentication and authorization work',
          'Self-service tools operational',
          'Customer data is tenant-scoped',
        ],
      };

    case 'business_operations':
      return {
        name: `Business Operations — ${label}`,
        description: 'Admin dashboards, order management, inventory management, business workflows, reporting',
        tasks: [
          {
            id: `task-${stage}-admin-dashboard`,
            name: 'Build Admin Dashboard',
            description: 'Build the admin dashboard for business operations: order management, inventory, customer overview, key metrics',
            type: 'implement',
            agent: team.find((a) => a.agentId.includes('design'))?.agentId ?? 'design-ui-design-systems-director',
            inputs: { operationalRequirements: productSpec.operationalRequirements, domainModel: domainModel.workflows },
            outputs: { adminDashboard: 'implemented', managementTools: 'functional' },
            dependencies: [],
            acceptanceCriteria: ['Admin dashboard accessible', 'Order management works', 'Inventory management functional', 'Key metrics displayed'],
            estimatedDuration: 10,
          },
          {
            id: `task-${stage}-workflows`,
            name: 'Implement Business Workflows',
            description: 'Implement the core business workflows from the domain model: order processing, fulfillment, status transitions',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { workflows: domainModel.workflows, entities: domainModel.entities.map((e) => e.name) },
            outputs: { workflows: 'implemented', stateMachines: 'active' },
            dependencies: [`task-${stage}-admin-dashboard`],
            acceptanceCriteria: ['All workflows from domain model implemented', 'State transitions are valid', 'Error handling for edge cases'],
            estimatedDuration: 12,
          },
        ],
        acceptanceCriteria: [
          'Admin dashboard fully operational',
          'All business workflows implemented',
          'Inventory and order management work',
          'Business rules enforced server-side',
        ],
      };

    case 'admin':
      return {
        name: `Admin & Configuration — ${label}`,
        description: 'Super-admin panel, system configuration, user management, role management, feature flags',
        tasks: [
          {
            id: `task-${stage}-super-admin`,
            name: 'Build Super-Admin Panel',
            description: 'Build the super-admin panel: system configuration, user management, role assignment, audit log access',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { permissions: domainModel.permissions, securityRequirements: productSpec.securityRequirements },
            outputs: { superAdmin: 'implemented', roleManagement: 'functional' },
            dependencies: [],
            acceptanceCriteria: ['Super-admin can manage all users', 'Role assignment works', 'Audit log accessible', 'System configuration editable'],
            estimatedDuration: 8,
          },
          {
            id: `task-${stage}-feature-flags`,
            name: 'Implement Feature Flags & Configuration',
            description: 'Implement feature flag system and runtime configuration for admin-controlled features',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { operationalRequirements: productSpec.operationalRequirements },
            outputs: { featureFlags: 'system', configuration: 'runtime' },
            dependencies: [`task-${stage}-super-admin`],
            acceptanceCriteria: ['Feature flags can toggle features', 'Configuration changes take effect', 'Rollback available'],
            estimatedDuration: 5,
          },
        ],
        acceptanceCriteria: [
          'Super-admin panel fully operational',
          'Role-based access enforced',
          'Configuration management works',
          'All admin actions are audit-logged',
        ],
      };

    case 'staff_tools':
      return {
        name: `Staff Tools — ${label}`,
        description: 'Internal tools for staff: order processing, customer support, kitchen/fulfillment management',
        tasks: [
          {
            id: `task-${stage}-staff-interface`,
            name: 'Build Staff Interface',
            description: 'Build the staff-facing interface: order processing, status updates, customer lookup, internal notes',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { domainModel: domainModel.participants.map((p) => p.role), workflows: domainModel.workflows },
            outputs: { staffInterface: 'implemented', tools: 'functional' },
            dependencies: [],
            acceptanceCriteria: ['Staff can process orders', 'Status updates propagate', 'Customer lookup works', 'Internal notes save correctly'],
            estimatedDuration: 8,
          },
          {
            id: `task-${stage}-staff-workflows`,
            name: 'Implement Staff Workflows',
            description: 'Implement staff-specific workflows from the domain model: preparation, fulfillment, handoff',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { workflows: domainModel.workflows, entities: domainModel.entities.map((e) => e.name) },
            outputs: { staffWorkflows: 'complete' },
            dependencies: [`task-${stage}-staff-interface`],
            acceptanceCriteria: ['Staff workflows from domain model implemented', 'Real-time updates work', 'Handoff between staff roles smooth'],
            estimatedDuration: 8,
          },
        ],
        acceptanceCriteria: [
          'Staff interface fully functional',
          'Staff workflows operational',
          'Real-time order updates work',
          'Staff actions are logged',
        ],
      };

    case 'delivery':
      return {
        name: `Delivery & Fulfillment — ${label}`,
        description: 'Order fulfillment, delivery management, tracking, notifications, return processing',
        tasks: [
          {
            id: `task-${stage}-fulfillment`,
            name: 'Implement Fulfillment System',
            description: 'Implement order fulfillment: preparation, packaging, dispatch, delivery tracking',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { workflows: domainModel.workflows, domainModel: domainModel.label },
            outputs: { fulfillment: 'implemented', tracking: 'functional' },
            dependencies: [],
            acceptanceCriteria: ['Order fulfillment pipeline works', 'Delivery tracking updates', 'Notification system sends updates'],
            estimatedDuration: 10,
          },
          {
            id: `task-${stage}-returns`,
            name: 'Implement Returns & Refunds',
            description: 'Implement return processing, refund calculations, and restocking based on domain model financial flows',
            type: 'implement',
            agent: team.find((a) => a.agentId.includes('payment') || a.agentId.includes('ledger'))?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { financialFlows: domainModel.financialFlows, constraints: domainModel.constraints },
            outputs: { returns: 'implemented', refunds: 'processed' },
            dependencies: [`task-${stage}-fulfillment`],
            acceptanceCriteria: ['Return requests process correctly', 'Refunds are paise-exact', 'Restocking updates inventory'],
            estimatedDuration: 8,
          },
        ],
        acceptanceCriteria: [
          'Fulfillment pipeline operational',
          'Delivery tracking works end-to-end',
          'Returns and refunds process correctly',
          'Notifications sent at each stage',
        ],
      };

    case 'analytics':
      return {
        name: `Analytics & Reporting — ${label}`,
        description: 'Business analytics, reporting dashboards, metrics tracking, export capabilities',
        tasks: [
          {
            id: `task-${stage}-metrics`,
            name: 'Implement Analytics & Metrics',
            description: 'Implement analytics tracking, metrics calculation, and success metrics from the domain model',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { successMetrics: domainModel.successMetrics, domainModel: domainModel.label },
            outputs: { analytics: 'tracked', metrics: 'calculated' },
            dependencies: [],
            acceptanceCriteria: ['All success metrics tracked', 'Analytics events fire correctly', 'Metrics definitions match domain model'],
            estimatedDuration: 10,
          },
          {
            id: `task-${stage}-reporting`,
            name: 'Build Reporting Dashboard',
            description: 'Build reporting dashboards with export capabilities for business stakeholders',
            type: 'implement',
            agent: team.find((a) => a.agentId.includes('design'))?.agentId ?? 'design-ui-design-systems-director',
            inputs: { successMetrics: domainModel.successMetrics, analytics: 'tracked' },
            outputs: { dashboards: 'built', exports: 'available' },
            dependencies: [`task-${stage}-metrics`],
            acceptanceCriteria: ['Dashboards display key metrics', 'Export to CSV/PDF works', 'Date range filtering works'],
            estimatedDuration: 8,
          },
        ],
        acceptanceCriteria: [
          'All success metrics are tracked and reportable',
          'Dashboards show real-time data',
          'Export functionality works',
          'Analytics are GDPR/privacy compliant',
        ],
      };

    case 'retention':
      return {
        name: `Retention & Engagement — ${label}`,
        description: 'Customer retention: loyalty programs, notifications, engagement features, re-engagement campaigns',
        tasks: [
          {
            id: `task-${stage}-loyalty`,
            name: 'Implement Retention Features',
            description: 'Implement retention features based on domain model: loyalty programs, engagement tracking, re-engagement',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { domainModel: domainModel.label, features: productSpec.featureRequirements.filter((f) => f.priority === 'expected' || f.priority === 'differentiating').map((f) => f.name) },
            outputs: { loyalty: 'implemented', engagement: 'tracked' },
            dependencies: [],
            acceptanceCriteria: ['Loyalty program tracks correctly', 'Engagement metrics recorded', 'Re-engagement triggers work'],
            estimatedDuration: 8,
          },
          {
            id: `task-${stage}-notifications`,
            name: 'Implement Notification System',
            description: 'Implement notification system: email, SMS, push notifications for order updates, promotions, re-engagement',
            type: 'implement',
            agent: team.find((a) => a.role === 'implementation')?.agentId ?? 'impl-polyglot-typescript-surgeon',
            inputs: { integrationRequirements: productSpec.integrationRequirements.filter((i) => i.target.includes('Email') || i.target.includes('SMS') || i.target.includes('Notification')) },
            outputs: { notifications: 'wired', templates: 'managed' },
            dependencies: [`task-${stage}-loyalty`],
            acceptanceCriteria: ['Email notifications send correctly', 'SMS notifications work', 'Push notifications configured', 'User preferences respected'],
            estimatedDuration: 6,
          },
        ],
        acceptanceCriteria: [
          'Retention features operational',
          'Notification system functional',
          'Engagement metrics tracked',
          'User preferences for notifications respected',
        ],
      };

    case 'financial':
      // Financial is handled separately as its own wave
      return {
        name: `Financial — ${label}`,
        description: 'Billing, payments, invoicing — handled in dedicated financial wave',
        tasks: [],
        acceptanceCriteria: [],
      };

    default:
      return {
        name: `${label}`,
        description: `Stage: ${stage}`,
        tasks: [],
        acceptanceCriteria: [],
      };
  }
}

function selectAgentsForStage(stage: DomainLifecycleStage, team: PlanAgent[], importance: 'primary' | 'secondary'): string[] {
  const implAgents = team.filter((a) => a.role === 'implementation').map((a) => a.agentId);
  const designAgents = team.filter((a) => a.agentId.startsWith('design-')).map((a) => a.agentId);

  const stageAgentMap: Record<string, { primary: string[]; secondary: string[] }> = {
    public_experience: { primary: [...designAgents, ...implAgents.slice(0, 2)], secondary: designAgents.slice(0, 1) },
    customer_system: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
    business_operations: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
    admin: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
    staff_tools: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
    delivery: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
    analytics: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
    retention: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
    financial: { primary: implAgents.slice(0, 2), secondary: implAgents.slice(1, 2) },
  };

  return stageAgentMap[stage]?.[importance] ?? implAgents.slice(0, 1);
}

function selectSkillsForStage(stage: DomainLifecycleStage, productSpec: ProductSpec): string[] {
  const skillMap: Record<string, string[]> = {
    public_experience: ['design-systems', 'uiux-research', 'accessibility'],
    customer_system: ['business-logic', 'database-design'],
    business_operations: ['business-logic', 'database-design', 'api-design'],
    admin: ['security-review', 'business-logic'],
    staff_tools: ['business-logic', 'database-design'],
    delivery: ['business-logic', 'api-design'],
    analytics: ['business-logic', 'database-design'],
    retention: ['business-logic', 'api-design'],
    financial: ['financial-calcs', 'business-logic', 'security-review'],
  };

  return skillMap[stage] ?? ['business-logic'];
}

// =====================================================================
// AGENT TEAM BUILDER
// =====================================================================

function buildAgentTeams(
  team: PlanAgent[],
  classification: ProjectClassification,
  effortLevel: EffortLevel['level'],
  mode: ExecutionMode,
): AgentTeam[] {
  const teams: AgentTeam[] = [];

  // Wave 1 team (research, architecture, design)
  const wave1Agents = team.filter((a) => a.wave === 1).map((a) => a.agentId);
  if (wave1Agents.length > 0) {
    teams.push({
      id: 'team-research',
      name: 'Research & Architecture Team',
      description: 'Handles intent expansion, domain modeling, architecture design, and skill composition',
      agents: wave1Agents,
      coordinator: wave1Agents[0],
      skills: ['req-analysis', 'product-discovery', 'domain-modeling', 'architecture', 'database-design', 'api-design'],
    });
  }

  // Wave 2 team (implementation)
  const wave2Agents = team.filter((a) => a.wave === 2).map((a) => a.agentId);
  if (wave2Agents.length > 0) {
    teams.push({
      id: 'team-implementation',
      name: 'Implementation Team',
      description: 'Builds all domain lifecycle stages in parallel-safe file leases',
      agents: wave2Agents,
      coordinator: wave2Agents[0],
      skills: ['business-logic', 'design-systems', 'uiux-research', 'database-design', 'api-design', 'financial-calcs'],
    });
  }

  // Wave 3 team (verification, security)
  const wave3Agents = team.filter((a) => a.wave === 3).map((a) => a.agentId);
  if (wave3Agents.length > 0) {
    teams.push({
      id: 'team-verification',
      name: 'Verification & Quality Team',
      description: 'Runs tests, performs security audits, challenges the implementation, records provenance',
      agents: wave3Agents,
      coordinator: wave3Agents.find((id) => id.startsWith('verify-')) ?? wave3Agents[0],
      skills: ['automated-testing', 'security-review', 'accessibility', 'math-verification'],
    });
  }

  // Domain specialist teams (from layered categories)
  for (const cat of classification.categories.filter((c) => c.role === 'secondary')) {
    const catAgents = team.filter((a) => a.reason.includes(cat.category)).map((a) => a.agentId);
    if (catAgents.length > 0) {
      teams.push({
        id: `team-${cat.category.toLowerCase()}`,
        name: `${cat.category} Specialist Team`,
        description: `Specialist agents for the ${cat.category} domain layer`,
        agents: catAgents,
        coordinator: catAgents[0],
        skills: selectSkillsForStage(cat.category.toLowerCase() as DomainLifecycleStage, {} as ProductSpec),
      });
    }
  }

  return teams;
}

// =====================================================================
// REQUIREMENT TIERS (MoSCoW)
// =====================================================================

function buildRequirementTiers(productSpec: ProductSpec, domainModel: DomainModel, effortLevel: EffortLevel['level']): RequirementTiers {
  const mustHave: string[] = [];
  const shouldHave: string[] = [];
  const couldHave: string[] = [];
  const wontHave: string[] = [];

  // From feature requirements
  for (const feature of productSpec.featureRequirements) {
    switch (feature.priority) {
      case 'essential':
        mustHave.push(`${feature.name}: ${feature.description}`);
        break;
      case 'expected':
        shouldHave.push(`${feature.name}: ${feature.description}`);
        break;
      case 'differentiating':
        couldHave.push(`${feature.name}: ${feature.description}`);
        break;
      case 'optional':
        couldHave.push(`${feature.name}: ${feature.description}`);
        break;
    }
  }

  // From security requirements — all critical/high are must-have
  for (const req of productSpec.securityRequirements) {
    if (req.severity === 'critical' || req.severity === 'high') {
      if (!mustHave.some((m) => m.includes(req.name))) {
        mustHave.push(`${req.name}: ${req.description}`);
      }
    }
  }

  // From testing requirements — essential tests are must-have
  for (const req of productSpec.testingRequirements) {
    if (req.priority === 'essential') {
      if (!mustHave.some((m) => m.includes(req.name))) {
        mustHave.push(`${req.name}: ${req.description}`);
      }
    }
  }

  // Domain constraints that are must-have
  for (const constraint of domainModel.constraints) {
    if (!mustHave.some((m) => m.includes(constraint.split(' ').slice(0, 3).join(' ')))) {
      mustHave.push(`Domain constraint: ${constraint}`);
    }
  }

  // Regulatory requirements are must-have
  for (const reg of domainModel.regulatory) {
    mustHave.push(`Compliance: ${reg}`);
  }

  // Domain invariants are must-have
  for (const entity of domainModel.entities) {
    for (const invariant of entity.invariants) {
      if (!mustHave.some((m) => m.includes(invariant.split(' ').slice(0, 3).join(' ')))) {
        mustHave.push(`${entity.name} invariant: ${invariant}`);
      }
    }
  }

  // Integrations are should-have (they're wired but not the core)
  for (const integration of productSpec.integrationRequirements) {
    shouldHave.push(`${integration.target} integration: ${integration.purpose} (${integration.protocol})`);
  }

  // Operational requirements are should-have
  for (const op of productSpec.operationalRequirements) {
    shouldHave.push(`${op.name}: ${op.description}`);
  }

  // Design requirements are could-have (they enhance but don't block)
  for (const design of productSpec.designRequirements) {
    couldHave.push(`${design.name}: ${design.description}`);
  }

  // Deployment requirements are could-have (infrastructure choice)
  for (const dep of productSpec.deploymentRequirements) {
    couldHave.push(`${dep.name}: ${dep.description}`);
  }

  // Explicitly out of scope based on unknowns
  for (const unknown of productSpec.unknowns) {
    wontHave.push(`Deferred: ${unknown} — requires user clarification before implementation`);
  }

  // Ensure minimum content in each tier
  if (shouldHave.length === 0) {
    shouldHave.push('Performance optimization and caching strategy');
    shouldHave.push('Error handling and user feedback');
  }
  if (couldHave.length === 0) {
    couldHave.push('Advanced search and filtering');
    couldHave.push('Mobile app (PWA)');
  }
  if (wontHave.length === 0) {
    wontHave.push('Native mobile applications (web-first approach)');
    wontHave.push('Offline-first mode (unless explicitly requested)');
  }

  return [
    {
      id: 'tier-must-have',
      name: 'Must Have',
      description: 'Core functionality required for the product to be viable. Without these, the product cannot ship.',
      requirements: [...mustHave],
      mustHave,
      shouldHave,
      couldHave,
      wontHave,
    },
    {
      id: 'tier-should-have',
      name: 'Should Have',
      description: 'Important features that should be included but are not critical for the initial release.',
      requirements: [...shouldHave],
      mustHave,
      shouldHave,
      couldHave,
      wontHave,
    },
    {
      id: 'tier-could-have',
      name: 'Could Have',
      description: 'Nice-to-have features that enhance the product but are not essential.',
      requirements: [...couldHave],
      mustHave,
      shouldHave,
      couldHave,
      wontHave,
    },
    {
      id: 'tier-wont-have',
      name: "Won't Have",
      description: 'Explicitly out of scope for this release. These may be reconsidered in future versions.',
      requirements: [...wontHave],
      mustHave,
      shouldHave,
      couldHave,
      wontHave,
    },
  ];
}

// =====================================================================
// COMPLEXITY & DURATION ESTIMATION
// =====================================================================

function estimateComplexity(productSpec: ProductSpec, domainModel: DomainModel, waves: ExecutionWave[], effortLevel: EffortLevel['level']): number {
  let complexity = 0;

  // Base complexity from effort level
  const effortComplexity: Record<EffortLevel['level'], number> = { FOCUSED: 20, STANDARD: 50, DEEP: 75, DEEPEST: 100 };
  complexity += effortComplexity[effortLevel] || 50;

  // Feature count
  complexity += Math.min(productSpec.featureRequirements.length * 3, 30);

  // Domain entities
  complexity += Math.min(domainModel.entities.length * 2, 20);

  // Workflows
  complexity += Math.min(domainModel.workflows.length * 2, 15);

  // Security requirements
  complexity += productSpec.securityRequirements.filter((s) => s.severity === 'critical').length * 5;
  complexity += productSpec.securityRequirements.filter((s) => s.severity === 'high').length * 3;

  // Integration requirements
  complexity += Math.min(productSpec.integrationRequirements.length * 2, 10);

  // Wave count (more waves = more coordination overhead)
  complexity += waves.length * 2;

  // Unknowns (each unknown adds risk)
  complexity += productSpec.unknowns.length * 2;

  return Math.min(Math.round(complexity), 100);
}

function estimateDuration(waves: ExecutionWave[], effortLevel: EffortLevel['level']): number {
  const totalTasks = waves.reduce((sum, w) => sum + w.tasks.length, 0);
  const baseDuration = waves.reduce((sum, w) => sum + w.estimatedDuration, 0);

  // Adjust by effort level
  const effortMultiplier: Record<EffortLevel['level'], number> = {
    FOCUSED: 0.8,
    STANDARD: 1.0,
    DEEP: 1.3,
    DEEPEST: 1.6,
  };

  const adjusted = Math.round(baseDuration * (effortMultiplier[effortLevel] || 1.0));
  // Duration in "story points" or "task units"
  return adjusted;
}

// =====================================================================
// RISK FACTORS
// =====================================================================

function identifyRiskFactors(
  productSpec: ProductSpec,
  domainModel: DomainModel,
  classification: ProjectClassification,
  effortLevel: EffortLevel['level'],
): RiskFactor[] {
  const risks: RiskFactor[] = [];
  let id = 1;

  // Technical risks
  if (productSpec.securityRequirements.some((s) => s.severity === 'critical')) {
    risks.push({
      id: `risk-${id++}`,
      category: 'technical',
      description: 'Critical security requirements must be implemented correctly — security flaws are high-impact',
      severity: 'high',
      mitigation: 'Security audit in verification wave; adversarial testing for DEEP+ effort',
      probability: 0.3,
    });
  }

  if (productSpec.integrationRequirements.length > 3) {
    risks.push({
      id: `risk-${id++}`,
      category: 'integration',
      description: `Multiple third-party integrations (${productSpec.integrationRequirements.length}) increase coupling and failure surface`,
      severity: 'medium',
      mitigation: 'Circuit breakers for all external calls; integration tests with mocks; fallback strategies',
      probability: 0.4,
    });
  }

  if (domainModel.entities.length > 8) {
    risks.push({
      id: `risk-${id++}`,
      category: 'technical',
      description: `Complex domain model with ${domainModel.entities.length} entities — schema migrations and data integrity are risky`,
      severity: 'medium',
      mitigation: 'Incremental migrations; entity invariants enforced at DB level; comprehensive integration tests',
      probability: 0.35,
    });
  }

  // Business risks
  if (productSpec.unknowns.length > 2) {
    risks.push({
      id: `risk-${id++}`,
      category: 'business',
      description: `${productSpec.unknowns.length} unknowns in the product spec — scope may change significantly`,
      severity: 'medium',
      mitigation: 'Document assumptions; flag unknowns as requirement tiers; plan for iteration',
      probability: 0.5,
    });
  }

  if (productSpec.productType === 'unknown') {
    risks.push({
      id: `risk-${id++}`,
      category: 'business',
      description: 'Unknown product type — domain model is derived from first principles, may miss domain-specific requirements',
      severity: 'high',
      mitigation: 'Research-intensive mode; user validation at each milestone; domain expert review',
      probability: 0.4,
    });
  }

  // Financial risks
  if (domainModel.financialFlows.length > 0) {
    risks.push({
      id: `risk-${id++}`,
      category: 'compliance',
      description: 'Financial flows require precision — rounding errors, double-charges, and reconciliation failures are critical',
      severity: 'high',
      mitigation: 'Fixed-point arithmetic for all money; property tests on financial invariants; audit trail on all mutations',
      probability: 0.25,
    });
  }

  // Timeline risks
  if (effortLevel === 'DEEPEST') {
    risks.push({
      id: `risk-${id++}`,
      category: 'timeline',
      description: 'DEEPEST effort level requires comprehensive implementation of all domain stages — timeline risk is elevated',
      severity: 'medium',
      mitigation: 'Wave-based delivery with checkpoints; MVP-first approach; parallel agent execution',
      probability: 0.3,
    });
  }

  if (classification.unseen) {
    risks.push({
      id: `risk-${id++}`,
      category: 'timeline',
      description: 'UNSEEN domain — first-principles approach means more research and potential rework',
      severity: 'medium',
      mitigation: 'Research-intensive mode; validate domain model with user early; iterative refinement',
      probability: 0.4,
    });
  }

  // Always add at least one risk
  if (risks.length === 0) {
    risks.push({
      id: `risk-${id++}`,
      category: 'technical',
      description: 'Standard project risks: scope creep, integration issues, timeline pressure',
      severity: 'low',
      mitigation: 'Regular checkpoints; clear requirement tiers; change management process',
      probability: 0.2,
    });
  }

  return risks;
}

// =====================================================================
// VERIFICATION PLAN
// =====================================================================

function buildVerificationPlan(
  productSpec: ProductSpec,
  domainModel: DomainModel,
  waves: ExecutionWave[],
  effortLevel: EffortLevel['level'],
): VerificationPlan {
  const testStrategy = [
    'Unit tests for all business logic and domain invariants',
    'Integration tests for API endpoints and database operations',
    'E2E tests for critical user journeys across all lifecycle stages',
    'Security audit covering OWASP Top 10 and domain-specific threats',
    'Performance benchmarks for critical paths',
    'Accessibility verification (WCAG 2.1 AA)',
  ];

  const acceptanceTests: VerificationTest[] = [
    {
      id: 'test-all-features',
      name: 'Feature Completeness Test',
      type: 'e2e',
      scope: 'All features from ProductSpec',
      criteria: [
        'All essential features are implemented and functional',
        'All expected features work as specified',
        'No regressions in existing functionality',
      ],
    },
    {
      id: 'test-domain-invariants',
      name: 'Domain Invariant Test',
      type: 'unit',
      scope: 'Domain model entities',
      criteria: [
        'All entity invariants are enforced',
        'Financial calculations are paise-exact',
        'State machines transition correctly',
      ],
    },
    {
      id: 'test-security',
      name: 'Security Verification',
      type: 'security',
      scope: 'Authentication, authorization, data protection',
      criteria: [
        'OWASP Top 10 vulnerabilities addressed',
        'Authentication flows work correctly',
        'Authorization boundaries enforced',
        'Sensitive data is protected',
      ],
    },
    {
      id: 'test-performance',
      name: 'Performance Verification',
      type: 'performance',
      scope: 'Critical user journeys and API endpoints',
      criteria: [
        'Page load times meet targets',
        'API response times meet SLAs',
        'Database queries are optimized',
        'Concurrent users handled correctly',
      ],
    },
    {
      id: 'test-accessibility',
      name: 'Accessibility Verification',
      type: 'accessibility',
      scope: 'All user-facing interfaces',
      criteria: [
        'WCAG 2.1 AA compliance',
        'Screen reader navigation works',
        'Keyboard-only navigation complete',
        'Color contrast meets standards',
      ],
    },
  ];

  const qualityGates: QualityGate[] = [
    {
      id: 'gate-typescript',
      name: 'TypeScript Compilation',
      check: 'npx tsc --noEmit',
      passCondition: '0 type errors on all touched files',
      blocking: true,
    },
    {
      id: 'gate-lint',
      name: 'Lint Check',
      check: 'npm run lint',
      passCondition: '0 lint errors, 0 warnings',
      blocking: true,
    },
    {
      id: 'gate-unit-tests',
      name: 'Unit Tests',
      check: 'npm run test:unit',
      passCondition: 'All tests pass, coverage meets target',
      blocking: true,
    },
    {
      id: 'gate-integration-tests',
      name: 'Integration Tests',
      check: 'npm run test:integration',
      passCondition: 'All integration tests pass',
      blocking: true,
    },
    {
      id: 'gate-e2e-tests',
      name: 'E2E Tests',
      check: 'npm run test:e2e',
      passCondition: 'All critical journey tests pass',
      blocking: true,
    },
    {
      id: 'gate-security',
      name: 'Security Audit',
      check: 'npm run security:audit',
      passCondition: 'No critical or high vulnerabilities',
      blocking: true,
    },
  ];

  const coverageTargets: CoverageTarget = {
    unitTest: effortLevel === 'DEEPEST' ? 90 : effortLevel === 'DEEP' ? 80 : 70,
    integrationTest: effortLevel === 'DEEPEST' ? 80 : effortLevel === 'DEEP' ? 70 : 60,
    e2eCritical: 100,
    accessibility: 100,
  };

  return {
    testStrategy,
    acceptanceTests,
    qualityGates,
    coverageTargets,
  };
}

// =====================================================================
// COMPLETION CRITERIA & STOP CONDITION
// =====================================================================

function buildCompletionCriteria(mode: ExecutionMode, effortLevel: EffortLevel['level'], verificationPlan: VerificationPlan): string[] {
  const completion: string[] = [
    'All domain lifecycle stages are covered by at least one wave',
    'All MoSCoW must-have requirements are implemented',
    'All quality gates pass (TypeScript, lint, tests, security)',
    'All verification tests pass with documented evidence',
  ];

  if (effortLevel === 'DEEP' || effortLevel === 'DEEPEST') {
    completion.push('Adversarial review: objections resolved with evidence or escalated');
  }
  if (mode === 'PRODUCTION_HARDENING') {
    completion.push('Readiness checks pass: health checks, rollback path, migration order documented');
  }
  if (mode === 'CRITICAL_REPAIR') {
    completion.push('Root cause identified and fixed; regression test passes; no feature work beyond the fix');
  }

  return completion;
}

function buildStopCondition(mode: ExecutionMode, waves: ExecutionWave[], verificationPlan: VerificationPlan): string {
  const allStagesCovered = DOMAIN_LIFECYCLE_STAGES.every((stage) =>
    waves.some((w) => w.description.toLowerCase().includes(stage.replace('_', ' ')) || w.name.toLowerCase().includes(stage.replace('_', ' ')))
  );

  if (!allStagesCovered) {
    return 'STOP: plan is INCOMPLETE — not all domain lifecycle stages are covered. Missing stages must be added before execution can begin.';
  }

  switch (mode) {
    case 'CRITICAL_REPAIR':
      return 'the regression reproduces on the fix branch, is isolated to a named root cause, and the regression-guard test passes — no feature work beyond the fix';
    case 'PRODUCTION_HARDENING':
      return 'all hardening waves are green AND the rollback path is a named, tested step — "deployed" without a tested rollback is not done';
    default:
      return 'every completion criterion above has a recorded verdict (passing / failed-with-reason), all quality gates pass, and all domain lifecycle stages are covered — the plan stops on evidence, not on "files generated"';
  }
}

// =====================================================================
// PUBLIC API RE-EXPORTS (for p20OrchestrationPlanner.ts compatibility)
// =====================================================================

export { classifyProject } from '../projectIntelligence/classify';
export { profileFor, type ProjectCategory } from '../projectIntelligence/categories';
