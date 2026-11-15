/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P13 · BUSINESS LOGIC INTELLIGENCE
 * (src/core/programs/p13BusinessLogicIntelligence.ts) · Created by Tabrej
 *
 * The program-level capability for the SUPREME EVOLUTION §3/§4 + the universal
 * business-logic directive's "5 cooperating capabilities" #1/#2/#3 (Domain
 * Intelligence, Product Creativity, Business Logic Engine):
 *
 *   a product request (from P12's classification) in  →
 *   a coherent DOMAIN MODEL (participants / entities / flows / invariants) +
 *   LIFECYCLE STATE MACHINES with the impossible-state detector +
 *   the EDGE-CASE catalog the categories owe (each with its invariant) +
 *   the POSSIBILITY engine (differentiators over generic features, grounded
 *   in economics) + METRIC definitions that are not decorative
 *   → a machine-checkable plan, not a prose brief.
 *
 * All subsystems are deterministic; the edge-case + state-machine checks are
 * the directive's "define each important scenario AND test it" made
 * executable. P10's finance engine remains the single source of money
 * exactness — P13 does not build a second one.
 */

import { deriveDomainModel, type DomainModel } from '../businessLogic/domainModel';
import { ORDER_LIFECYCLE, SUBSCRIPTION_LIFECYCLE, validateMachine, detectImpossibleStates, type LifecycleMachine } from '../businessLogic/stateMachine';
import { edgeCasesFor, type EdgeCase } from '../businessLogic/edgeCases';
import { explorePossibilities, isGenuinelyDifferent, type PossibilityReport } from '../businessLogic/possibility';
import { auditDashboard, type MetricDefinition } from '../businessLogic/metrics';
import { profileFor, type ProjectCategory } from '../projectIntelligence/categories';
import { classifyProject, type ProjectClassification } from '../projectIntelligence/classify';
import type { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

// ---------------------------------------------------------------- the plan

export interface BusinessLogicRequest {
  task: string;
  /** P12 classification (or pass the task and P13 classifies it) */
  classification?: ProjectClassification;
  /** state machines the project owes beyond the built-in ones */
  machines?: LifecycleMachine[];
  /** the metric definitions the project claims (for the §8 audit) */
  metrics?: MetricDefinition[];
}

export interface BusinessLogicPlan {
  classification: ProjectClassification;
  domain: DomainModel;
  machines: Array<{ entity: string; states: number; transitions: number; invalid: string[] }>;
  edgeCases: EdgeCase[];
  possibility: PossibilityReport;
  metricAudit: { sound: string[]; unsound: string[] };
  genuinelyDifferent: boolean;
}

export function runBusinessLogic(req: BusinessLogicRequest): BusinessLogicPlan {
  const classification = req.classification ?? classifyProject(req.task);
  const primary = (classification.unseen ? 'UNSEEN' : classification.primary) as ProjectCategory | 'UNSEEN';
  const profile = profileFor(primary as ProjectCategory);

  const domain = deriveDomainModel(primary, profile);

  // the machines the project owes: its built-ins (by category) + by what the
  // task itself names (a "SaaS billing with checkout" product owes the order
  // machine even though it classified as SAAS, because checkout is an order
  // flow).
  const owed: LifecycleMachine[] = [];
  const task = req.task.toLowerCase();
  const namesOrders = /checkout|order|purchase|billing|cart/i.test(task);
  if (['FINANCIAL', 'ECOMMERCE', 'MARKETPLACE', 'CREATOR_DIGITAL'].includes(primary) || namesOrders) owed.push(ORDER_LIFECYCLE);
  if (['SAAS', 'CREATOR_DIGITAL', 'EDUCATION', 'FINANCIAL'].includes(primary) || /subscri|membership|renewal|seat/i.test(task)) owed.push(SUBSCRIPTION_LIFECYCLE);
  // dedupe by entity (keep the first, so the built-in order machine wins)
  const seen = new Set<string>();
  const machinesIn = [...owed, ...(req.machines ?? [])].filter((m) => (seen.has(m.entity) ? false : (seen.add(m.entity), true)));
  const machines = machinesIn.map((m) => ({
    entity: m.entity,
    states: m.states.length,
    transitions: m.rules.length,
    invalid: validateMachine(m),
  }));

  // the edge cases the categories owe (§3D)
  const edgeCases = edgeCasesFor(classification.categories.map((c) => c.category));

  // the possibility engine (§4) — grounded differentiators over generic features
  const posture = profile?.securityPosture ?? 'STANDARD';
  const possibility = explorePossibilities(primary, posture);

  // the §8 metric discipline (decorative analytics are rejected)
  const metricAudit = req.metrics?.length ? auditDashboard(req.metrics) : { sound: [] as string[], unsound: [] as string[] };

  return { classification, domain, machines, edgeCases, possibility, metricAudit, genuinelyDifferent: isGenuinelyDifferent(possibility) };
}

/** detect impossible states across the built-in machines given observed transitions */
export function findImpossibleStates(observed: Array<{ machine: string; from: string; to: string }>): string[] {
  const out: string[] = [];
  const byEntity = new Map<string, LifecycleMachine>();
  byEntity.set(ORDER_LIFECYCLE.entity, ORDER_LIFECYCLE);
  byEntity.set(SUBSCRIPTION_LIFECYCLE.entity, SUBSCRIPTION_LIFECYCLE);
  for (const o of observed) {
    const m = byEntity.get(o.machine);
    if (m) out.push(...detectImpossibleStates(m, [{ from: o.from, to: o.to }]).map((d) => `${o.machine}: ${d}`));
  }
  return out;
}

// ---------------------------------------------------------------- the capability

export const P13_CAPABILITY: ProgramCapability = {
  id: 'cap-p13-business-logic-intelligence',
  programId: 'P13_BUSINESS_LOGIC_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 13 — BUSINESS LOGIC INTELLIGENCE (SUPREME EVOLUTION: domain + lifecycle + edge-case + possibility + metric intelligence)',
  capability:
    'a coherent domain model (participants / entities / financial flows / invariants / success metrics) derived per P12 category — first-principles when unseen; lifecycle STATE MACHINES (order + subscription) with a closed-set validator and an impossible-state detector; the EDGE-CASE catalog each category owes (every case carrying its test invariant); a POSSIBILITY engine that recommends economics-grounded differentiators over generic features (never brainstorm-leads with the table stakes); and METRIC discipline that rejects decorative analytics and un-labeled estimates. Composes P12 classification; reuses P10 finance for money exactness (no second money engine).',
  repositoryOrigin: 'operator SUPREME EVOLUTION + universal business-logic directives (first-party; no external repository)',
  originProject: 'AETHER SUPREME EVOLUTION — Universal Business Logic Intelligence, Product Creativity & Self-Evolving Engineering System (capabilities #1 Domain, #2 Product Creativity, #3 Business Logic)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'pure TS, fully deterministic; domain derivation, state-machine validation, edge-case discovery, possibility ranking and metric audit are all in-process. The possibility seed makes re-runs reproducible (risk register R7).',
  testCoverage: 'domain-model coherence per category + first-principles fallback; state-machine closed-set + permission + impossible-state detection; edge-case discovery by category (each carries an invariant); possibility engine genuinely-different check (no conventional-only leads); metric audit rejects decorative / no-source / un-labeled-estimate; P13 program integration.',
  integratesWith: ['P12 classification', 'P10 finance engine', 'P11 data-model review', 'MCP Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'business-logic-verdicts',
    unit: 'edge-cases-discovered',
    detail: 'A product request yields a coherent domain model, N lifecycle state machines (each validated closed-set), the edge-case catalog its categories owe (each with a test invariant), a genuinely-different possibility ranking, and a metric-discipline audit that names any decorative or un-labeled metric.',
  },
  author: 'Created by Tabrej',
};

export function runP13BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const plan = runBusinessLogic({ task: 'Build a multi-tenant SaaS billing platform with checkout, subscriptions, and a 3D product configurator' });
  const edgeCount = plan.edgeCases.length;
  const machineCount = plan.machines.length;
  const genuinelyDiff = plan.genuinelyDifferent;
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: edgeCount,
    metric: 'business-logic-verdicts',
    unit: 'edge-cases-discovered',
    detail: `business-logic plan for ${plan.classification.primary}: domain [${plan.domain.participants.length} participants, ${plan.domain.entities.length} entities, ${plan.domain.financialFlows.length} financial flows], ${machineCount} lifecycle machine(s) [${plan.machines.map((m) => m.entity + ':' + m.states + 'states/' + m.transitions + 'rules').join(', ')}], ${edgeCount} edge case(s) each with a test invariant, genuinelyDifferent=${genuinelyDiff}, metric-audit unsound [${plan.metricAudit.unsound.join(', ') || 'none'}].`,
  };
}
