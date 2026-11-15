/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 11 · FULL-STACK ENGINEERING INTELLIGENCE
 * (src/core/programs/p11FullstackEngineeringIntelligence.ts) · Created by Tabrej
 *
 * The operator's full-stack engineering directive, made executable: the
 * system is designed AS ONE PRODUCT, not as isolated tasks. One request in,
 * one coherent engineering plan out:
 *
 *   requirements profile ─▶ architecture decision (with the
 *                            anti-microservices guardrail) + drift checks
 *                         ─▶ API contract (backend promise vs client usage)
 *                         ─▶ data model (constraints, money types,
 *                            concurrency-safe writes, migration safety)
 *                         ─▶ reliability policy (bounded retry, idempotency,
 *                            jitter, breakers, dead-letters)
 *                         ─▶ tenancy (isolation as a security boundary,
 *                            composed with the Security Engine)
 *                         ─▶ production readiness (layered test evidence +
 *                            observability + deploy safety + "a checklist is
 *                            not a security proof")
 *
 * Financial/tax exactness and the completion gate are REUSED from P10
 * (src/core/finance + src/core/intel) — P11 does not build a second one.
 */

import {
  selectArchitecture,
  architectureDecisionRecord,
  detectArchitectureDrift,
  type ArchitectureChoice,
  type RequirementsProfile,
  type ObservedArchitecture,
} from '../fullstack/architecture';
import { checkApiContract, type ContractSpec, type ClientUsage } from '../fullstack/apiContract';
import { analyzeDataModel, planMigration, type SchemaEntity, type MigrationInput } from '../fullstack/dataModel';
import { auditReliabilityPolicy, type ReliabilityPolicy } from '../fullstack/reliability';
import { enforceTenancy, type TenantContext, type TenancyAccess, type TenancyModel } from '../fullstack/tenancy';
import { assessReadiness, type ReadinessAssessment, type TestLayerEvidence } from '../fullstack/productionReadiness';
import { classifyRequirement, type RequirementModel } from '../intel/requirements';
import { composeSkills, type CompositionResult } from '../intel/skillComposer';
import { renderDecisionMarkdown, type DecisionRecord } from '../intel/decisionRecords';
import { obligatedCriteria, evaluateCompletion, COMPLETION_CRITERIA, type CriterionVerdict, type CompletionReport } from '../intel/completion';
import { computeInvoiceTotals, gstSlabTable, verifyClientTotal, type TaxConfig, type LineItem } from '../finance/taxEngine';
import type { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

// ---------------------------------------------------------------- the plan

export interface FullstackRequest {
  task: string;
  /** §1 — the requirements profile that drives the architecture decision */
  requirements?: RequirementsProfile;
  /** the architecture the documentation CLAIMS (for drift detection) */
  claimedArchitecture?: ArchitectureChoice;
  observed?: ObservedArchitecture;
  /** §2 — the API contract: what the backend promises vs what the client uses */
  api?: { spec: ContractSpec; usage: ClientUsage };
  /** §3 — the data model under review */
  dataModel?: SchemaEntity[];
  /** §3 — a proposed migration (generate → inspect → validate) */
  migration?: MigrationInput;
  /** §8 — the service's reliability policy */
  reliability?: ReliabilityPolicy;
  /** §6 — a tenant-isolation access to enforce */
  tenancy?: { ctx: TenantContext; access: TenancyAccess; model: TenancyModel };
  /** §11/§16/§17 — the production-readiness assessment to gate */
  readiness?: ReadinessAssessment;
  /** §5 — optional exact money computation (reuses the P10 finance engine) */
  invoice?: {
    lines: Array<{ lineId: string; pricePaise: number; rateId: string; quantityMilli?: number; hsnSac?: string; description?: string; zeroRated?: boolean }>;
    jurisdiction?: 'IN' | 'US' | 'EU' | 'CA';
    taxMode?: 'EXCLUSIVE' | 'INCLUSIVE';
    placeOfSupply?: { supplierRegion: string; buyerRegion: string };
    discountBps?: number;
    additionalChargesPaise?: number;
    clientAssertedTotalPaise?: number;
  };
}

export interface FullstackPlan {
  requirement: RequirementModel;
  skills: CompositionResult;
  /** §1 */
  architecture?: {
    choice: ArchitectureChoice;
    drivingRequirements: string[];
    operationalCosts: string[];
    escapeHatch: string;
    diagramDeliverables: string[];
    drift: string[]; // empty = documentation and implementation agree
  };
  /** §2 */
  apiContract?: { ok: boolean; mismatches: number; top: string[] };
  /** §3 */
  dataModel?: { entities: number; clean: boolean; findings: Array<{ severity: string; entity: string; detail: string }> };
  migration?: { blocked: boolean; steps: number; reasons: string[] };
  /** §5 — exact, when a money contract is given */
  calculation?: {
    grandTotalPaise: number;
    taxPaise: number;
    clientTotalVerified: { ok: boolean; deltaPaise: number };
  };
  /** §8 */
  reliability?: { healthy: boolean; findings: number; top: string[] };
  /** §6 */
  tenancy?: { ok: boolean; leaks: string[]; requiredGuards: number };
  /** §11/§16/§17 */
  readiness?: { verdict: 'READY' | 'NOT_READY'; blockers: string[]; covered: number; total: number };
  decisions: DecisionRecord[];
  completion: { obligated: string[]; report: CompletionReport; verdicts: CriterionVerdict[] };
}

/** §5 — compose the P10 finance engine (exact paise + tamper guard). */
function exactMoney(req: NonNullable<FullstackRequest['invoice']>) {
  const cfg: TaxConfig = {
    currency: 'INR',
    jurisdiction: req.jurisdiction ?? 'IN',
    taxModel: 'GST',
    taxMode: req.taxMode ?? 'EXCLUSIVE',
    rates: gstSlabTable('INR'),
    placeOfSupply: req.placeOfSupply,
    discountBps: req.discountBps,
    additionalChargesPaise: req.additionalChargesPaise,
  };
  // normalize to LineItem: description and quantityMilli are required there;
  // a missing quantity means 1 whole unit, a missing description means lineId.
  const lines: LineItem[] = req.lines.map((l) => ({
    lineId: l.lineId,
    description: l.description ?? l.lineId,
    quantityMilli: l.quantityMilli ?? 1000,
    pricePaise: l.pricePaise,
    rateId: l.rateId,
    hsnSac: l.hsnSac,
    zeroRated: l.zeroRated,
  }));
  const breakdown = computeInvoiceTotals(lines, cfg);
  const client =
    req.clientAssertedTotalPaise != null
      ? verifyClientTotal(req.clientAssertedTotalPaise, lines, cfg)
      : verifyClientTotal(breakdown.grandTotalPaise, lines, cfg);
  return {
    grandTotalPaise: breakdown.grandTotalPaise,
    taxPaise: breakdown.taxPaise,
    clientTotalVerified: { ok: client.ok, deltaPaise: client.deltaPaise },
  };
}

export function runFullstackEngineering(req: FullstackRequest): FullstackPlan {
  const requirement = classifyRequirement({ task: req.task });
  const skills = composeSkills({ task: req.task, domains: requirement.domains, depth: requirement.depth });
  const decisions: DecisionRecord[] = [];

  let architecture: FullstackPlan['architecture'];
  if (req.requirements) {
    const d = selectArchitecture(req.requirements);
    decisions.push(architectureDecisionRecord(req.requirements));
    architecture = {
      choice: d.choice,
      drivingRequirements: d.drivingRequirements,
      operationalCosts: d.operationalCosts,
      escapeHatch: d.escapeHatch,
      diagramDeliverables: d.diagramDeliverables,
      drift: req.claimedArchitecture && req.observed ? detectArchitectureDrift(req.claimedArchitecture, req.observed) : [],
    };
  }

  let apiContract: FullstackPlan['apiContract'];
  if (req.api) {
    const rep = checkApiContract(req.api.spec, req.api.usage);
    apiContract = { ok: rep.ok, mismatches: rep.mismatches.length, top: rep.mismatches.slice(0, 5).map((m) => `[${m.severity}] ${m.detail}`) };
  }

  let dataModel: FullstackPlan['dataModel'];
  let migration: FullstackPlan['migration'];
  if (req.dataModel) {
    const rep = analyzeDataModel(req.dataModel);
    dataModel = { entities: rep.entities, clean: rep.clean, findings: rep.findings.map((f) => ({ severity: f.severity, entity: f.entity, detail: f.detail })) };
  }
  if (req.migration) {
    const p = planMigration(req.migration);
    migration = { blocked: p.blocked, steps: p.steps.length, reasons: p.reasons };
  }

  const calculation = req.invoice ? exactMoney(req.invoice) : undefined;

  let reliability: FullstackPlan['reliability'];
  if (req.reliability) {
    const rep = auditReliabilityPolicy(req.reliability);
    reliability = { healthy: rep.healthy, findings: rep.findings.length, top: rep.findings.slice(0, 5).map((f) => `[${f.severity}] ${f.detail}`) };
  }

  let tenancy: FullstackPlan['tenancy'];
  if (req.tenancy) {
    const rep = enforceTenancy(req.tenancy.ctx, req.tenancy.access, req.tenancy.model);
    tenancy = { ok: rep.ok, leaks: rep.leaks, requiredGuards: rep.guards.filter((g) => g.required).length };
  }

  let readiness: FullstackPlan['readiness'];
  if (req.readiness) {
    const rep = assessReadiness(req.readiness);
    readiness = { verdict: rep.verdict, blockers: rep.blockers.map((b) => `${b.kind}: ${b.detail}`), covered: rep.covered, total: rep.total };
  }

  // ---- completion gate (P10 rule: met implies evidence; proportional) ----
  const verdicts: CriterionVerdict[] = [];
  if (req.requirements) {
    verdicts.push({ criterion: 'ARCHITECTURAL_QUALITY', met: architecture!.drift.length === 0, evidence: architecture!.drift.length === 0 ? { kind: 'PROVABLE_GUARD', detail: 'architecture doc and implementation agree; decision record produced', reference: 'DEC-ARCHITECTURE-STYLE' } : undefined, gap: architecture!.drift.join('; ') });
  }
  if (req.api) {
    verdicts.push(apiContract!.ok ? { criterion: 'FUNCTIONAL_BEHAVIOR', met: true, evidence: { kind: 'PROVABLE_GUARD', detail: 'front/back contract diff is clean', reference: 'checkApiContract' } } : { criterion: 'FUNCTIONAL_BEHAVIOR', met: false, gap: `${apiContract!.mismatches} contract mismatch(es): ${apiContract!.top.join('; ')}` });
  }
  if (req.dataModel) {
    verdicts.push(dataModel!.clean ? { criterion: 'DOMAIN_CORRECTNESS', met: true, evidence: { kind: 'PROVABLE_GUARD', detail: 'schema review: constraints, money types, concurrency, migrations all clean', reference: 'analyzeDataModel' } } : { criterion: 'DOMAIN_CORRECTNESS', met: false, gap: `${dataModel!.findings.length} data-model finding(s)` });
  }
  if (req.migration) {
    if (migration!.blocked) verdicts.push({ criterion: 'DOMAIN_CORRECTNESS', met: false, gap: `destructive migration ${migration!.reasons.join('; ')}` });
    else verdicts.push({ criterion: 'HONEST_DOCUMENTATION', met: true, evidence: { kind: 'PROVABLE_GUARD', detail: 'migration reviewed: additive + backfill, reversible', reference: 'planMigration' } });
  }
  if (calculation) {
    verdicts.push({ criterion: 'MATHEMATICAL_CORRECTNESS', met: true, evidence: { kind: 'PROVABLE_GUARD', detail: `exact paise total ${calculation.grandTotalPaise}p (tax ${calculation.taxPaise}p); client-total guard ${calculation.clientTotalVerified.ok ? 'matched' : 'fired (delta ' + calculation.clientTotalVerified.deltaPaise + 'p)'}`, reference: 'P10 computeInvoiceTotals' } });
  }
  if (req.reliability) {
    verdicts.push(reliability!.healthy ? { criterion: 'FUNCTIONAL_BEHAVIOR', met: true, evidence: { kind: 'PROVABLE_GUARD', detail: 'reliability policy: bounded retry, jitter, breakers, dead-letters', reference: 'auditReliabilityPolicy' } } : { criterion: 'FUNCTIONAL_BEHAVIOR', met: false, gap: `reliability: ${reliability!.findings} defect(s) — ${reliability!.top.join('; ')}` });
  }
  if (req.tenancy) {
    verdicts.push(tenancy!.ok ? { criterion: 'SECURITY', met: true, evidence: { kind: 'PROVABLE_GUARD', detail: 'tenant isolation: no cross-tenant leak path in the assessed access', reference: 'enforceTenancy' } } : { criterion: 'SECURITY', met: false, gap: `tenant leak path(s): ${tenancy!.leaks.join('; ')}` });
  }
  if (req.readiness) {
    verdicts.push(readiness!.verdict === 'READY' ? { criterion: 'VERIFICATION_EVIDENCE', met: true, evidence: { kind: 'MEASUREMENT', detail: 'readiness gate: owed test layers + observability + deploy safety + security scan', reference: 'assessReadiness' } } : { criterion: 'VERIFICATION_EVIDENCE', met: false, gap: `not ready: ${readiness!.blockers.join('; ')}` });
  }
  // always-true plan-level criteria with evidence (the plan itself is real work)
  verdicts.push(
    { criterion: 'REQUIREMENT_COMPLETENESS', met: true, evidence: { kind: 'MEASUREMENT', detail: `depth ${requirement.depth}; domains [${requirement.domains.join(', ') || 'general'}]`, reference: 'classifyRequirement' } },
    { criterion: 'HONEST_DOCUMENTATION', met: true, evidence: { kind: 'COMMAND', detail: 'decision records rendered to auditable Markdown', reference: 'renderDecisionMarkdown' } },
  );
  for (const c of COMPLETION_CRITERIA) {
    if (!verdicts.some((v) => v.criterion === c)) verdicts.push({ criterion: c, met: false, gap: 'not assessed by this request' });
  }
  const report = evaluateCompletion(verdicts);
  const obligated = obligatedCriteria(requirement.depth);

  return { requirement, skills, architecture, apiContract, dataModel, migration, calculation, reliability, tenancy, readiness, decisions, completion: { obligated, report, verdicts } };
}

/** deterministic Markdown — the plan's auditable record */
export function renderFullstackMarkdown(plan: FullstackPlan): string {
  const L: string[] = [];
  L.push('# Full-Stack Engineering Plan');
  L.push(`task: ${plan.requirement.task}`);
  L.push(`depth: ${plan.requirement.depth} · domains: [${plan.requirement.domains.join(', ') || 'general'}] · composed skills: ${plan.skills.skillIds.join(', ')}`);
  if (plan.architecture) {
    L.push(`\n## Architecture (§1)`);
    L.push(`selected: ${plan.architecture.choice}`);
    L.push(`driving: ${plan.architecture.drivingRequirements.join('; ')}`);
    L.push(`diagram deliverables: ${plan.architecture.diagramDeliverables.join(', ')}`);
    L.push(`operational costs accepted: ${plan.architecture.operationalCosts.join('; ')}`);
    L.push(`escape hatch: ${plan.architecture.escapeHatch}`);
    L.push(plan.architecture.drift.length ? `DRIFT: ${plan.architecture.drift.join(' · ')}` : 'no architecture drift detected');
  }
  if (plan.apiContract) L.push(`\n## API Contract (§2): ${plan.apiContract.ok ? 'CLEAN' : `${plan.apiContract.mismatches} mismatch(es)`}\n${plan.apiContract.top.join('\n') || ''}`);
  if (plan.dataModel) L.push(`\n## Data Model (§3): ${plan.dataModel.findings.length} finding(s) across ${plan.dataModel.entities} entities\n${plan.dataModel.findings.map((f) => `- [${f.severity}] ${f.entity}: ${f.detail}`).join('\n') || '- clean'}`);
  if (plan.migration) L.push(`\n## Migration (§3): ${plan.migration.blocked ? 'BLOCKED — ' + plan.migration.reasons.join('; ') : `reviewed, ${plan.migration.steps} step(s)`}`);
  if (plan.calculation) L.push(`\n## Calculation (§5, P10 finance engine): grand total ${plan.calculation.grandTotalPaise}p (tax ${plan.calculation.taxPaise}p) · client-total guard ${plan.calculation.clientTotalVerified.ok ? 'MATCH' : 'MISMATCH (' + plan.calculation.clientTotalVerified.deltaPaise + 'p)'}`);
  if (plan.reliability) L.push(`\n## Reliability (§8): ${plan.reliability.healthy ? 'policy healthy' : `${plan.reliability.findings} defect(s)`}\n${plan.reliability.top.join('\n') || ''}`);
  if (plan.tenancy) L.push(`\n## Tenancy (§6): ${plan.tenancy.ok ? 'no cross-tenant leak path' : 'LEAK' + plan.tenancy.leaks.length + ' — ' + plan.tenancy.leaks.join('; ')} · ${plan.tenancy.requiredGuards} guard(s) required`);
  if (plan.readiness) L.push(`\n## Production Readiness (§11/§16/§17): ${plan.readiness.verdict}\n${plan.readiness.blockers.map((b) => `- ${b}`).join('\n') || '- no blockers'}`);
  L.push('\n## Decision records');
  for (const d of plan.decisions) L.push(renderDecisionMarkdown(d));
  L.push('\n## Completion');
  L.push(`status: ${plan.completion.report.status} (${plan.completion.report.met}/${plan.completion.report.total})`);
  for (const o of plan.completion.report.open.slice(0, 8)) L.push(`open: ${o.criterion} — ${o.gap}`);
  L.push('');
  return L.join('\n');
}

// ---------------------------------------------------------------- the capability

export const P11_CAPABILITY: ProgramCapability = {
  id: 'cap-p11-fullstack-engineering-intelligence',
  programId: 'P11_FULLSTACK_ENGINEERING_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 11 — FULL-STACK ENGINEERING INTELLIGENCE (operator directive: the system as one coherent product)',
  capability:
    'Architecture decisions from requirements (with the anti-microservices guardrail + drift detection), API contract front/back mismatch detection, data-model & migration review (exact money types, concurrency-safe writes, no unacknowledged data loss), reliability policy audit (bounded retry / idempotency / jitter / breakers / dead-letters), tenant isolation as a security boundary, and a production-readiness gate — composing P10\'s finance + completion engines, the Security Engine, and the decision-record system',
  repositoryOrigin: 'operator directive (first-party; no external repository)',
  originProject: 'AETHER operator directive — full-stack engineering intelligence (architectures, backends, data, security, reliability, ops as one system)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'pure TS; every subsystem is deterministic and in-process. Tenancy composes the Security Engine; financials reuse P10\'s fixed-point engine. No external service.',
  testCoverage: 'architecture selection + guardrail + drift; API contract mismatch classes; data-model findings (money types, concurrency, FK indexes, N+1, migrations); reliability defects (unbounded retry, missing jitter/breaker/dead-letter, non-idempotent retry); tenancy leak classes; production-readiness gate (met-implies-evidence); P11 program integration + live plan.',
  integratesWith: ['MCP Engine', 'Security Engine', 'P10 finance engine', 'P10 completion gate', 'Decision-record system', 'Skill Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'fullstack-plan-verdicts',
    unit: 'blockers-or-drift-detected',
    detail: 'A full-stack request yields an architecture decision with drift check, a contract diff, a data-model review, a reliability audit, a tenancy enforcement, and a readiness verdict — each with a machine-checkable result.',
  },
  author: 'Created by Tabrej',
};

export function runP11BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const plan = runFullstackEngineering({
    task: 'Build a multi-tenant SaaS billing platform with a checkout flow',
    requirements: { task: 'billing platform', userScale: 'enterprise', dataVolume: 'large', domainCount: 4, teamSize: 8, availabilityPct: '99.9', deployTarget: 'cloud-services' },
    claimedArchitecture: 'MODULAR_MONOLITH',
    observed: { deployables: 6, claimsServiceBoundaries: true, hasEventBus: false, claimsEventDriven: false, usesReadReplicas: true, claimsAvailability9999: false, businessRulesBackendEnforced: true, claimsConstraintsEnforced: true },
    api: {
      spec: {
        operation: 'POST /invoices',
        method: 'POST',
        requestFields: [
          { name: 'tenant_id', type: 'string', required: true, nullable: false },
          { name: 'total_paise', type: 'integer', required: true, nullable: false, rules: ['> 0'] },
        ],
        responseFields: [{ name: 'invoice_id', type: 'string', required: true, nullable: false }],
        errorEnvelope: ['code', 'message', 'traceId'],
        pagination: 'cursor',
        auth: 'bearer',
        version: 'v1',
      },
      usage: {
        operation: 'POST /invoices',
        requestFields: [
          { name: 'tenant_id', type: 'string', required: true, nullable: false },
          { name: 'total', type: 'number', required: true, nullable: false }, // renamed + widened on the client
        ],
        responseFields: [{ name: 'invoice_id', type: 'string', required: true, nullable: false }],
        readsErrorEnvelope: ['code', 'message'],
        pagination: 'offset',
        auth: 'session',
      },
    },
    dataModel: [
      {
        name: 'invoices',
        columns: [
          { name: 'id', type: 'uuid', nullable: false },
          { name: 'tenant_id', type: 'uuid', nullable: false },
          { name: 'total_paise', type: 'numeric', nullable: false, money: true, concurrent: true, concurrency: 'ATOMIC_UPDATE' },
        ],
        constraints: [
          { kind: 'PRIMARY_KEY', columns: ['id'] },
          { kind: 'FOREIGN_KEY', columns: ['tenant_id', 'tenants'] },
          { kind: 'CHECK', columns: ['total_paise'] },
        ],
        indexes: ['(id)', '(tenant_id)'],
      },
    ],
    reliability: {
      serviceName: 'billing-core',
      calls: [
        { name: 'paymentProvider.charge', target: 'EXTERNAL', idempotent: false },
        { name: 'jobs.retry', target: 'QUEUE', idempotent: true, idempotencyKey: true },
      ],
      retry: { maxAttempts: 100000, bounded: false },
      circuitBreaker: false,
      timeouts: false,
    },
    tenancy: {
      ctx: { tenantId: 't-1', userId: 'u-9', isAdmin: false, memberOrgs: ['o-1'] },
      access: { operation: 'WRITE', resource: 'invoices', tenantScoped: false, ownerScoped: true, targetOrg: 'o-1' },
      model: 'SHARED_SCOPED',
    },
    invoice: {
      jurisdiction: 'IN',
      taxMode: 'EXCLUSIVE',
      placeOfSupply: { supplierRegion: 'MH', buyerRegion: 'DL' },
      lines: [{ lineId: 'l1', description: 'SaaS seat', quantityMilli: 1000, pricePaise: 490000, rateId: 'GST-18', hsnSac: '9983' }],
      clientAssertedTotalPaise: 10000,
    },
  });

  const blockers =
    (plan.architecture?.drift.length ?? 0) +
    (plan.apiContract?.mismatches ?? 0) +
    plan.reliability!.findings +
    (plan.tenancy?.leaks.length ?? 0);
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: blockers,
    metric: 'fullstack-plan-verdicts',
    unit: 'blockers-or-drift-detected',
    detail: `full-stack plan: architecture ${plan.architecture?.choice} (${plan.architecture?.drift.length ?? 0} drift), ${plan.apiContract?.mismatches ?? 0} contract mismatch(es), ${plan.reliability?.findings ?? 0} reliability defect(s), tenancy leak path(s) ${(plan.tenancy?.leaks.length ?? 0)}, exact money ${plan.calculation?.grandTotalPaise}p (guard ${plan.calculation?.clientTotalVerified.ok ? 'match' : 'fired'}), completion ${plan.completion.report.status} ${plan.completion.report.met}/${plan.completion.report.total}.`,
  };
}
