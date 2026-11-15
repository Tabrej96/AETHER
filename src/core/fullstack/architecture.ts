/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — FULL-STACK ENGINEERING INTELLIGENCE · ARCHITECTURE DECISIONS
 * (src/core/fullstack/architecture.ts) · Created by Tabrej
 *
 * Directive §1: "It must not automatically choose microservices because they
 * sound advanced. Select architecture based on actual requirements,
 * operational complexity and expected scale." This module makes that a
 * deterministic, auditable decision: a RequirementsProfile in, an
 * ArchitectureDecision out — with every alternative carrying an explicit
 * verdict + reason, and the decision rendered straight into a valid
 * P10 DecisionRecord (requirements / alternatives / selected / risks /
 * verification method).
 */

import type { DecisionRecord } from '../intel/decisionRecords';

export type ArchitectureChoice =
  | 'MONOLITH'
  | 'MODULAR_MONOLITH'
  | 'MICROSERVICES'
  | 'EVENT_DRIVEN'
  | 'SERVERLESS'
  | 'HYBRID';

/** The requirements §1 lists — each one must actually be read, not assumed. */
export interface RequirementsProfile {
  task: string;
  /** expected scale, e.g. 'utility' | 'startup' | 'enterprise' (or free text) */
  userScale: string;
  /** data volume class, e.g. 'small' | 'medium' | 'large' */
  dataVolume?: string;
  /** latency budget in ms (p95) */
  latencyMs?: number;
  /** availability target, e.g. '99' | '99.9' | '99.99' */
  availabilityPct?: string;
  /** traffic is bursty (campaigns, launches) vs steady */
  spikyTraffic?: boolean;
  /** workload is dominated by asynchronous event streams (ingest, fan-out) */
  eventHeavy?: boolean;
  /** number of clearly separable business domains */
  domainCount?: number;
  /** engineering teams that would own the system */
  teamSize?: number;
  /** auto-scaling / per-invocation billing is a real requirement */
  needsAutoScale?: boolean;
  /** where it deploys: 'vps' | 'container' | 'cloud-services' | 'kubernetes' */
  deployTarget?: string;
  /** cost is a hard constraint (small budget) */
  costConstrained?: boolean;
  /** maintenance burden tolerance (low = favor fewer moving parts) */
  maintenanceBurden?: 'low' | 'medium' | 'high';
}

export interface AlternativeVerdict {
  name: ArchitectureChoice;
  verdict: 'SELECTED' | 'REJECTED';
  reason: string;
}

export interface ArchitectureDecision {
  choice: ArchitectureChoice;
  alternatives: AlternativeVerdict[];
  /** the requirements that actually drove the choice (auditable) */
  drivingRequirements: string[];
  /** what §1 obligates to document for this choice */
  diagramDeliverables: string[];
  /** operational costs accepted by the choice (honest trade-offs) */
  operationalCosts: string[];
  /** the single most important guardrail if the choice turns out wrong */
  escapeHatch: string;
}

const DRIVING: Record<ArchitectureChoice, string[]> = {
  MONOLITH: [
    'single deployable, one team, low operational overhead',
    'co-located transactions are fast to reason about',
    'fastest to build, test and roll back',
  ],
  MODULAR_MONOLITH: [
    'enforces module boundaries (domain packages) inside one deployable',
    'keeps a single data store → ACID across domains',
    'modules can be extracted to services later when evidence appears',
  ],
  MICROSERVICES: [
    'independent deploy + scale per domain',
    'team ownership aligned to domain boundaries (conway)',
    'failure isolation between services',
  ],
  EVENT_DRIVEN: [
    'asynchronous, decoupled producers/consumers',
    'event log enables audit + replay + materialized views',
    'throughput via queues, not request/response coupling',
  ],
  SERVERLESS: [
    'pay-per-invocation, auto-scaling to zero',
    'spiky traffic without pre-provisioned capacity',
    'no fleet to operate',
  ],
  HYBRID: [
    'stateful core (monolith/services) + event edges + serverless spikes',
    'each tier chosen by the requirement it serves',
  ],
};

const COSTS: Record<ArchitectureChoice, string[]> = {
  MONOLITH: ['release coupling (one deploy moves everything)', 'a slow module can degrade the whole app'],
  MODULAR_MONOLITH: ['discipline required to keep module boundaries honest', 'cross-module data still shares one store (coupling)'],
  MICROSERVICES: ['network failures replace in-memory calls', 'distributed transactions (outbox/saga) instead of ACID', 'ops burden: service discovery, tracing, independent deploys'],
  EVENT_DRIVEN: ['eventual consistency (not read-after-write)', 'ordering + exactly-once semantics are hard', 'replay/duplicate handling required'],
  SERVERLESS: ['cold starts on latency-critical paths', 'per-call cost grows past steady high load', 'state must move to managed stores'],
  HYBRID: ['multiple paradigms to operate at once', 'boundaries between tiers are new failure surfaces'],
};

const ESCAPE: Record<ArchitectureChoice, string> = {
  MONOLITH: 'extract the hot module into a MODULAR_MONOLITH boundary when a second team or a scaling domain appears',
  MODULAR_MONOLITH: 'a module with proven independent scale is promoted to a service (extract, don\'t rewrite)',
  MICROSERVICES: 'two services with constant chatty calls are a module in disguise — merge them back',
  EVENT_DRIVEN: 'if consumers need read-your-writes, move that pair back to a request/response boundary',
  SERVERLESS: 'a steady high-volume path moves to a container; the functions stay for the spikes',
  HYBRID: 're-evaluate each tier independently; the hybrid is a portfolio, not a single decision',
};

function diagramsFor(choice: ArchitectureChoice, p: RequirementsProfile): string[] {
  const core = [
    'system-architecture (component + dependency)',
    'data-flow (write + read paths)',
    'api-boundaries (public vs internal contracts)',
    'failure-and-recovery (blast radius + rollback)',
  ];
  const d = [...core];
  if (choice === 'EVENT_DRIVEN' || choice === 'HYBRID') d.push('event-catalog (topics, producers, consumers, ordering guarantees)');
  if (choice === 'MICROSERVICES') d.push('sequence (cross-service call + outbox)');
  if (choice !== 'MONOLITH') d.push('security-boundaries (authn/z per tier)');
  if (String(p.userScale ?? '').toLowerCase() !== 'utility') d.push('deployment (env → artifacts → data path)');
  return d;
}

/**
 * Deterministic selection. The anti-microservices guardrail is explicit:
 * MICROSERVICES is only SELECTED when the profile carries objective evidence
 * (multiple domains AND (large data volume OR a real team OR high availability
 * AND auto-scale)). Everything smaller lands on the simpler structure.
 */
export function selectArchitecture(p: RequirementsProfile): ArchitectureDecision {
  const scale = (p.userScale ?? '').toLowerCase();
  const team = p.teamSize ?? 1;
  const domains = p.domainCount ?? 1;
  const availability = p.availabilityPct ?? '99';
  const availNum = Number.parseFloat(availability);

  const microJustified =
    domains >= 3 &&
    (p.dataVolume === 'large' || team >= 10 || (availNum >= 99.95 && p.needsAutoScale));
  const eventDrivenWanted = p.eventHeavy === true;
  const spikyServerless = (p.spikyTraffic === true || p.needsAutoScale === true) && p.costConstrained !== true;

  let choice: ArchitectureChoice;
  if (microJustified) choice = 'MICROSERVICES';
  else if (eventDrivenWanted && microJustified) choice = 'HYBRID';
  else if (eventDrivenWanted) choice = 'EVENT_DRIVEN';
  else if (spikyServerless && scale === 'startup' && !eventDrivenWanted) choice = 'SERVERLESS';
  else if (domains >= 2 || availNum >= 99.9 || scale === 'enterprise') choice = 'MODULAR_MONOLITH';
  else choice = 'MONOLITH';

  // a maintenance-burden 'low' with team<=3 demotes MICROSERVICES if it was
  // selected only on availability (the directive: operational complexity counts)
  if (choice === 'MICROSERVICES' && p.maintenanceBurden === 'low' && team <= 3 && !(p.dataVolume === 'large')) {
    choice = 'MODULAR_MONOLITH';
  }

  // affirmative reason when a style is SELECTED; rejection reason otherwise
  const reasonIf: Record<ArchitectureChoice, string> = {
    MONOLITH: 'selected: scale/team are single-store, single-deploy — simplest structure that meets the requirements',
    MODULAR_MONOLITH: 'selected: separable domains want enforced boundaries without the ops cost of real services',
    MICROSERVICES: `selected: objective evidence present (${domains} domains${team >= 10 ? `, team of ${team}` : ''}${p.dataVolume === 'large' ? ', large data volume' : ''}) justifies the operational cost`,
    EVENT_DRIVEN: 'selected: the workload is event-heavy — async decoupling is the right shape',
    SERVERLESS: 'selected: spiky, cost-constrained traffic — per-invocation billing with scale-to-zero fits',
    HYBRID: 'selected: mixed workloads — event edges + spiky functions on top of a stateful core',
  };
  const rejectionReason: Record<ArchitectureChoice, string> = {
    MONOLITH: 'rejected: the requirements exceed single-store/single-deploy simplicity',
    MODULAR_MONOLITH: 'rejected: cross-domain isolation or scale-out needs real service boundaries',
    MICROSERVICES: 'rejected: no objective evidence (domains × team × scale) justifies the operational cost — the directive\'s anti-microservices guardrail held',
    EVENT_DRIVEN: 'rejected: the latency budget is request/response-bound; queue-based flow adds the wrong latency shape',
    SERVERLESS: 'rejected: steady load or stateful affinity makes per-invocation billing uneconomic',
    HYBRID: 'rejected: a single paradigm covers the requirements — hybrid adds tier boundaries for no measured gain',
  };

  const alternatives: AlternativeVerdict[] = (
    ['MONOLITH', 'MODULAR_MONOLITH', 'MICROSERVICES', 'EVENT_DRIVEN', 'SERVERLESS', 'HYBRID'] as ArchitectureChoice[]
  ).map((c) => ({
    name: c,
    verdict: c === choice ? 'SELECTED' : 'REJECTED',
    reason: c === choice ? reasonIf[c] : rejectionReason[c],
  }));

  return {
    choice,
    alternatives: alternatives.filter((a) => a.name === choice || a.verdict === 'REJECTED'),
    drivingRequirements: DRIVING[choice],
    diagramDeliverables: diagramsFor(choice, p),
    operationalCosts: COSTS[choice],
    escapeHatch: ESCAPE[choice],
  };
}

/** the profile's non-default fields, as a human-readable requirements list */
function profileRequirements(p: RequirementsProfile): string[] {
  const r: string[] = [];
  if (p.dataVolume) r.push(`data volume = ${p.dataVolume}`);
  if (p.latencyMs != null) r.push(`p95 latency budget = ${p.latencyMs}ms`);
  if (p.availabilityPct) r.push(`availability = ${p.availabilityPct}%`);
  if (p.spikyTraffic) r.push('spiky traffic');
  if (p.eventHeavy) r.push('event-heavy workload');
  if (p.domainCount != null) r.push(`${p.domainCount} separable domains`);
  if (p.teamSize != null) r.push(`team of ${p.teamSize}`);
  if (p.needsAutoScale) r.push('auto-scaling required');
  if (p.deployTarget) r.push(`deploy target = ${p.deployTarget}`);
  if (p.costConstrained) r.push('cost-constrained');
  if (p.maintenanceBurden) r.push(`maintenance burden tolerance = ${p.maintenanceBurden}`);
  return r.length ? r : ['scale = ' + p.userScale];
}

/** Render the decision into a valid P10 DecisionRecord (auditable, deterministic). */
export function architectureDecisionRecord(p: RequirementsProfile): DecisionRecord {
  const d = selectArchitecture(p);
  return {
    id: 'DEC-ARCHITECTURE-STYLE',
    decision: 'System architecture style for the stated requirements',
    requirements: profileRequirements(p),
    alternatives: d.alternatives.map((a) => ({ name: a.name, verdict: a.verdict, reason: a.reason })),
    selected: d.choice,
    justification: `driving: ${d.drivingRequirements.join('; ')}`,
    risks: d.operationalCosts,
    assumptions: ['selection is deterministic from the profile; re-run when any driving requirement changes'],
    verificationMethod: 'selectArchitecture is pure: identical profile → identical choice; drift checks (§1) watch implementation against this decision',
    externalRuleSources: [],
  };
}

// ---------------------------------------------------------------- drift

/**
 * §1: "Detect architectural drift between documentation and implementation."
 * Given what the architecture doc CLAIMS and what the implementation OBSERVES,
 * return the concrete mismatches (empty list = no drift).
 */
export interface ObservedArchitecture {
  deployables: number; // distinct deployable artifacts found
  claimsServiceBoundaries: boolean; // doc says services
  hasEventBus: boolean; // code has a queue/topics
  claimsEventDriven: boolean;
  usesReadReplicas: boolean;
  claimsAvailability9999: boolean;
  businessRulesBackendEnforced: boolean;
  claimsConstraintsEnforced: boolean;
}

export function detectArchitectureDrift(claimed: ArchitectureChoice, observed: ObservedArchitecture): string[] {
  const drift: string[] = [];
  if (claimed === 'MICROSERVICES' && observed.deployables === 1) {
    drift.push('doc claims MICROSERVICES but one deployable was found (monolith in disguise)');
  }
  if ((claimed === 'MONOLITH' || claimed === 'MODULAR_MONOLITH') && observed.deployables >= 4 && observed.claimsServiceBoundaries) {
    drift.push(`${observed.deployables} deployables with service boundaries — implementation has outgrown the documented ${claimed}`);
  }
  if (observed.claimsEventDriven && !observed.hasEventBus) {
    drift.push('architecture doc names an event-driven flow but no queue/topics exist in the implementation');
  }
  if (observed.claimsAvailability9999 && !observed.usesReadReplicas && claimed !== 'SERVERLESS') {
    drift.push('99.99% availability claimed with no read-replica/replication path found');
  }
  if (observed.claimsConstraintsEnforced && !observed.businessRulesBackendEnforced) {
    drift.push('doc says rules are enforced, but business rule enforcement was not found in backend/db layer');
  }
  return drift;
}
