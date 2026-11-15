/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 11 TEST · full-stack engineering intelligence
 * (src/core/programs/p11.test.ts) · Created by Tabrej
 *
 * A capability is "integrated" only when it is reachable through an AETHER
 * interface, executes real deterministic work, handles failure safely, and
 * passes this test. P11 composes P10's finance + completion engines, the
 * Security Engine, and the decision-record system — every subsystem is
 * deterministic and the plan never fabricates a verdict.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  P11_CAPABILITY,
  runFullstackEngineering,
  runP11BenchmarkEvidence,
  renderFullstackMarkdown,
  type FullstackRequest,
} from './p11FullstackEngineeringIntelligence';
import { buildIntegrationRegistry } from './registry';
import { selectArchitecture, detectArchitectureDrift } from '../fullstack/architecture';
import { checkApiContract } from '../fullstack/apiContract';
import { analyzeDataModel, planMigration } from '../fullstack/dataModel';
import { auditReliabilityPolicy } from '../fullstack/reliability';
import { enforceTenancy } from '../fullstack/tenancy';
import { assessReadiness } from '../fullstack/productionReadiness';

// ---------------------------------------------------------------- §1 architecture

test('§1: the anti-microservices guardrail holds — small teams get the simple structure', () => {
  // a utility with one domain, one dev -> MONOLITH, not "advanced" services
  const util = selectArchitecture({ task: 'a utility', userScale: 'utility' });
  assert.equal(util.choice, 'MONOLITH');
  // an enterprise, multi-domain, big team -> justified MICROSERVICES
  const ent = selectArchitecture({ task: 'x', userScale: 'enterprise', dataVolume: 'large', domainCount: 5, teamSize: 12, availabilityPct: '99.99', needsAutoScale: true });
  assert.equal(ent.choice, 'MICROSERVICES');
  // multi-domain but small team + low maintenance -> demoted to MODULAR_MONOLITH
  const dem = selectArchitecture({ task: 'x', userScale: 'startup', domainCount: 4, teamSize: 2, availabilityPct: '99.9', dataVolume: 'medium', maintenanceBurden: 'low' });
  assert.equal(dem.choice, 'MODULAR_MONOLITH');
  // every decision record carries an affirmative selected + rejections with reasons
  const sel = selectArchitecture({ task: 'x', userScale: 'startup' });
  assert.equal(sel.alternatives.filter((a) => a.verdict === 'SELECTED').length, 1);
  assert.ok(sel.alternatives.every((a) => a.reason.trim().length > 0));
});

test('§1: drift detection — doc says monolith, impl has outgrown it', () => {
  const drift = detectArchitectureDrift('MONOLITH', { deployables: 6, claimsServiceBoundaries: true, hasEventBus: false, claimsEventDriven: false, usesReadReplicas: false, claimsAvailability9999: false, businessRulesBackendEnforced: true, claimsConstraintsEnforced: true });
  assert.ok(drift.some((d) => d.includes('outgrown the documented MONOLITH')));
  // no drift when doc and impl agree
  const none = detectArchitectureDrift('MODULAR_MONOLITH', { deployables: 2, claimsServiceBoundaries: false, hasEventBus: false, claimsEventDriven: false, usesReadReplicas: false, claimsAvailability9999: false, businessRulesBackendEnforced: true, claimsConstraintsEnforced: true });
  assert.equal(none.length, 0);
});

// ---------------------------------------------------------------- §2 API contract

test('§2: contract mismatch detection — renamed, widened, re-authed fields', () => {
  const rep = checkApiContract(
    {
      operation: 'POST /invoices', method: 'POST',
      requestFields: [
        { name: 'tenant_id', type: 'string', required: true, nullable: false },
        { name: 'total_paise', type: 'integer', required: true, nullable: false, rules: ['> 0'] },
      ],
      responseFields: [{ name: 'invoice_id', type: 'string', required: true, nullable: false }],
      errorEnvelope: ['code', 'message', 'traceId'], pagination: 'cursor', auth: 'bearer', version: 'v1',
    },
    {
      operation: 'POST /invoices',
      requestFields: [
        { name: 'tenant_id', type: 'string', required: true, nullable: false },
        { name: 'total', type: 'number', required: true, nullable: false },
      ],
      responseFields: [{ name: 'invoice_id', type: 'string', required: true, nullable: false }],
      readsErrorEnvelope: ['code', 'message'], pagination: 'offset', auth: 'session',
    }
  );
  assert.equal(rep.ok, false);
  const kinds = new Set(rep.mismatches.map((m) => m.kind));
  assert.ok(kinds.has('AUTH_MISMATCH'), 'auth disagree is a blocker');
  assert.ok(kinds.has('PAGINATION_MISMATCH'));
  assert.ok(kinds.has('FIELD_MISSING_BACKEND'), "client's 'total' is undefined on the backend");
  // a required backend field the client does not send is a BLOCKER-grade mismatch
  assert.ok(rep.mismatches.some((m) => m.kind === 'REQUIRED_NOW_OPTIONAL' && m.severity === 'BLOCKER' && m.detail.includes('total_paise')), "client dropped the required 'total_paise'");
  // a clean contract has zero mismatches
  const clean = checkApiContract(
    { operation: 'GET /x', method: 'GET', requestFields: [], responseFields: [{ name: 'id', type: 'string', required: true, nullable: false }], errorEnvelope: [], auth: 'none' },
    { operation: 'GET /x', requestFields: [], responseFields: [{ name: 'id', type: 'string', required: true, nullable: false }], readsErrorEnvelope: [], auth: 'none' }
  );
  assert.equal(clean.ok, true);
  assert.equal(clean.mismatches.length, 0);
});

// ---------------------------------------------------------------- §3 data model

test('§3: data-model review flags binary-float money, unsafe concurrent writes, unindexed FKs', () => {
  const rep = analyzeDataModel([
    {
      name: 'accounts',
      columns: [
        { name: 'id', type: 'uuid', nullable: false },
        { name: 'balance', type: 'real', nullable: false, money: true, concurrent: true }, // float money + no lock -> two blockers
      ],
      constraints: [{ kind: 'PRIMARY_KEY', columns: ['id'] }],
      indexes: ['(id)'],
    },
  ]);
  const kinds = new Set(rep.findings.map((f) => f.kind));
  assert.ok(kinds.has('INEXACT_MONEY_TYPE'), 'real is not an exact money type');
  assert.ok(kinds.has('UNSAFE_CONCURRENT_WRITE'), 'concurrent money with no locking strategy');
  // clean model: exact type + ATOMIC_UPDATE + FK index
  const ok = analyzeDataModel([
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
  ]);
  assert.equal(ok.clean, true, `expected clean model, got: ${ok.findings.map((f) => f.kind).join(', ')}`);
});

test('§3: a destructive migration without acknowledgment is BLOCKED, with acknowledgment it is staged', () => {
  const blocked = planMigration({ operation: 'drop legacy column', entity: 'invoices', proposedSql: 'ALTER TABLE invoices DROP COLUMN total' });
  assert.equal(blocked.blocked, true);
  assert.ok(blocked.reasons.some((r) => r.includes('never casually drop')));
  const staged = planMigration({ operation: 'drop legacy column', entity: 'invoices', proposedSql: 'ALTER TABLE invoices DROP COLUMN total', ackDataLoss: true });
  assert.equal(staged.blocked, false);
  assert.ok(staged.steps.length >= 3, 'snapshot + destructive + restore');
});

// ---------------------------------------------------------------- §8 reliability

test('§8: unbounded retry + non-idempotent auto-retry + missing jitter are defects', () => {
  const rep = auditReliabilityPolicy({
    serviceName: 'svc',
    calls: [{ name: 'charge', target: 'EXTERNAL', idempotent: false }],
    retry: { maxAttempts: 100, bounded: false },
  });
  const kinds = new Set(rep.findings.map((f) => f.kind));
  assert.ok(kinds.has('UNBOUNDED_RETRY'));
  assert.ok(kinds.has('RETRY_ON_NON_IDEMPOTENT'));
  assert.ok(kinds.has('EXTERNAL_WITHOUT_BREAKER'));
  assert.ok(kinds.has('NO_TIMEOUTS'));
  assert.equal(rep.healthy, false);
  // a well-formed policy is healthy
  const good = auditReliabilityPolicy({
    serviceName: 'svc',
    calls: [
      { name: 'charge', target: 'EXTERNAL', idempotent: true, idempotencyKey: true },
      { name: 'job', target: 'QUEUE', idempotent: true, idempotencyKey: true },
    ],
    retry: { maxAttempts: 5, bounded: true, backoffBaseMs: 200, jitter: true, totalBudgetMs: 10000 },
    circuitBreaker: true,
    timeouts: true,
    deadLetter: true,
  });
  assert.equal(good.healthy, true, `expected healthy, got: ${good.findings.map((f) => f.kind).join(', ')}`);
});

// ---------------------------------------------------------------- §6 tenancy

test('§6: an unscoped write on a shared model is a cross-tenant leak', () => {
  const rep = enforceTenancy(
    { tenantId: 't-1', userId: 'u', memberOrgs: ['o-1'] },
    { operation: 'WRITE', resource: 'invoices', tenantScoped: false, ownerScoped: true },
    'SHARED_SCOPED'
  );
  assert.equal(rep.ok, false);
  assert.ok(rep.leaks.some((l) => l.includes('no tenant_id predicate')));
  // a fully-scoped read is clean
  const clean = enforceTenancy({ tenantId: 't-1', userId: 'u' }, { operation: 'READ', resource: 'invoices', tenantScoped: true, ownerScoped: true }, 'SHARED_SCOPED');
  assert.equal(clean.ok, true);
  assert.equal(clean.leaks.length, 0);
  // a cross-tenant reference (IDOR) always requires the ref-resolution guard
  const idor = enforceTenancy({ tenantId: 't-1', userId: 'u' }, { operation: 'READ', resource: 'invoice', tenantScoped: true, ownerScoped: true, crossesTenantReference: true }, 'SHARED_SCOPED');
  assert.ok(idor.leaks.some((l) => l.includes('insecure direct object reference')));
});

// ---------------------------------------------------------------- §11/§16/§17 readiness

test('§17: a claimed test layer with no evidence is a BLOCKER, not a pass', () => {
  const rep = assessReadiness({
    system: 'checkout service',
    owedLayers: ['UNIT', 'INTEGRATION', 'END_TO_END', 'SECURITY'],
    evidence: [
      { layer: 'UNIT', suites: ['unit.core'], passed: true, measuredNote: '40/40' },
      { layer: 'INTEGRATION', suites: ['int.api'], passed: true, measuredNote: '12/12' },
      // END_TO_END + SECURITY are OWED but have no evidence -> blockers
    ],
    observability: { structuredLogs: true, metrics: true, requestIds: true, healthEndpoints: true, alerting: true },
    deployment: { healthCheckOnDeploy: true, rollbackPath: true, migrationRunBeforeCutover: true, qualityGatesBlockDeploy: true },
    security: { claimedControls: ['authn', 'rate-limit'], scanRan: true, openCriticals: 0 },
  });
  assert.equal(rep.verdict, 'NOT_READY');
  assert.ok(rep.blockers.some((b) => b.kind === 'MISSING_TEST_LAYER'));
});

test('§7: "a security checklist is not a proof" — claimed controls without a scan block', () => {
  const rep = assessReadiness({
    system: 'billing api',
    owedLayers: ['UNIT', 'INTEGRATION'],
    evidence: [
      { layer: 'UNIT', suites: ['unit'], passed: true, measuredNote: 'ok' },
      { layer: 'INTEGRATION', suites: ['int'], passed: true, measuredNote: 'ok' },
    ],
    observability: { structuredLogs: true, metrics: true, requestIds: true, healthEndpoints: true, alerting: true },
    deployment: { healthCheckOnDeploy: true, rollbackPath: true, migrationRunBeforeCutover: true, qualityGatesBlockDeploy: true },
    security: { claimedControls: ['password-hash', 'csp'], scanRan: false, openCriticals: 0 },
  });
  assert.ok(rep.blockers.some((b) => b.kind === 'SECURITY_UNSCANNED'));
  assert.equal(rep.verdict, 'NOT_READY');
});

// ---------------------------------------------------------------- program integration

const P11_REQUEST: FullstackRequest = {
  task: 'Build a multi-tenant SaaS billing platform with a checkout flow',
  requirements: { task: 'billing platform', userScale: 'enterprise', dataVolume: 'large', domainCount: 4, teamSize: 8, availabilityPct: '99.9', deployTarget: 'cloud-services' },
  api: {
    spec: {
      operation: 'POST /invoices', method: 'POST',
      requestFields: [
        { name: 'tenant_id', type: 'string', required: true, nullable: false },
        { name: 'total_paise', type: 'integer', required: true, nullable: false, rules: ['> 0'] },
      ],
      responseFields: [{ name: 'invoice_id', type: 'string', required: true, nullable: false }],
      errorEnvelope: ['code', 'message', 'traceId'], pagination: 'cursor', auth: 'bearer', version: 'v1',
    },
    usage: {
      operation: 'POST /invoices',
      requestFields: [
        { name: 'tenant_id', type: 'string', required: true, nullable: false },
        { name: 'total', type: 'number', required: true, nullable: false },
      ],
      responseFields: [{ name: 'invoice_id', type: 'string', required: true, nullable: false }],
      readsErrorEnvelope: ['code', 'message'], pagination: 'offset', auth: 'session',
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
    calls: [{ name: 'charge', target: 'EXTERNAL', idempotent: false }, { name: 'jobs.retry', target: 'QUEUE', idempotent: true, idempotencyKey: true }],
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
};

test('P11 is registered in the integration registry and promoted to EXECUTE', () => {
  const reg = buildIntegrationRegistry();
  const cap = reg.capabilities.find((c) => c.id === P11_CAPABILITY.id);
  assert.ok(cap, 'P11 capability present in registry');
  assert.equal(reg.lifecycleStates[P11_CAPABILITY.id], 'EXECUTE');
});

test('a full-stack plan is deterministic across repeated runs', () => {
  const a = runFullstackEngineering(P11_REQUEST);
  const b = runFullstackEngineering(P11_REQUEST);
  assert.equal(a.architecture?.choice, b.architecture?.choice);
  assert.equal(a.apiContract?.mismatches, b.apiContract?.mismatches);
  assert.equal(a.calculation?.grandTotalPaise, b.calculation?.grandTotalPaise);
  assert.equal(a.completion.report.status, b.completion.report.status);
});

test('the plan composes P10\'s exact money engine (inter-state IGST + tamper guard)', () => {
  const p = runFullstackEngineering(P11_REQUEST);
  assert.equal(p.calculation!.grandTotalPaise, 578200); // 490000 + 18% IGST = 578200
  assert.equal(p.calculation!.clientTotalVerified.ok, false, 'the wrong asserted total is rejected');
});

test('the plan surfaces a contract mismatch, data review, reliability defects, and a tenancy leak', () => {
  const p = runFullstackEngineering(P11_REQUEST);
  assert.equal(p.apiContract!.ok, false);
  assert.ok(p.apiContract!.mismatches >= 2);
  assert.equal(p.dataModel!.clean, true, 'the reviewed schema is clean');
  assert.equal(p.reliability!.healthy, false);
  assert.ok(p.reliability!.findings >= 2);
  assert.equal(p.tenancy!.ok, false);
  assert.ok(p.tenancy!.leaks.length >= 1);
});

test('the plan renders an auditable Markdown record with a decision table', () => {
  const p = runFullstackEngineering(P11_REQUEST);
  const md = renderFullstackMarkdown(p);
  assert.match(md, /Full-Stack Engineering Plan/);
  assert.match(md, /Architecture/);
  assert.match(md, /API Contract/);
  assert.match(md, /Decision DEC-ARCHITECTURE-STYLE/);
});

test('the P11 benchmark evidence reports a real, non-fabricated measurement', () => {
  const e = runP11BenchmarkEvidence();
  assert.equal(e.status, 'MEASURED_DETERMINISTIC_EXECUTION');
  assert.equal(typeof e.measuredValue, 'number');
  assert.ok((e.detail ?? '').length > 0);
});
