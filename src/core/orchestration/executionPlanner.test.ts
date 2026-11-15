/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P20 TEST · domain-aware orchestration planner
 * (src/core/orchestration/executionPlanner.test.ts) · Created by Tabrej
 *
 * Tests for the rewritten P20: Intent Expansion + Domain Intelligence
 * integration, domain lifecycle coverage, MoSCoW tiers, and acceptance criteria.
 *
 * Backward compatibility: the legacy planExecution/selectMode/classifyRequirementTiers
 * interfaces are preserved and tested alongside the new domain-aware planner.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  planExecution,
  planDomainExecution,
  selectMode,
  classifyRequirementTiers,
  agentBudget,
  EXECUTION_MODES,
  type ExecutionPlan,
  type ExecutionWave,
  type RequirementTier,
  type RiskFactor,
  type VerificationPlan,
  type ExecutionTask,
  DOMAIN_LIFECYCLE_STAGES,
} from './executionPlanner';
import { classifyProject, promptLengthIndependence } from '../projectIntelligence/classify';
import { FULL_AETHER_AGENTS } from '../scaleCatalog';

const CATALOG = new Set(FULL_AETHER_AGENTS.map((a) => a.id));
const unknownAgents = (plan: ExecutionPlan): string[] =>
  plan.team.filter((a) => !CATALOG.has(a.agentId)).map((a) => a.agentId);
const catalogValid = (plan: ExecutionPlan): boolean =>
  unknownAgents(plan).length === 0;

// =====================================================================
// BACKWARD COMPATIBILITY TESTS (preserved from original)
// =====================================================================

test('§5: "Build a marketplace" (3 words) earns the AUTONOMOUS_PRODUCT path with a full market team', () => {
  const p = planExecution('Build a marketplace');
  assert.equal(p.mode, 'AUTONOMOUS_PRODUCT');
  assert.match(p.modeReason!, /disclos|reversible/i);
  assert.equal(p.classification!.primary, 'MARKETPLACE');
  assert.ok(p.team!.length >= 4, 'the primary category team is assembled');
  assert.ok(p.team!.length <= agentBudget(p.effort!.level), `team respects the ${p.effort!.level} cap`);
  assert.ok(catalogValid(p), `every agent id is catalog-verified`);
  assert.ok(p.team!.some((a) => a.agentId.startsWith('verify-')), 'a verifier is always on the team');
});

test('prompt-length independence: short and long prompts for same product get same effort', () => {
  const short = 'Build a SaaS billing platform with checkout and subscriptions';
  const long =
    'Build a SaaS billing platform with checkout and subscriptions. It is a multi-tenant B2B product: ' +
    'customers sign up, manage payment methods, get invoices, and have admins approve large refunds. ' +
    'We need proration when a plan changes mid-cycle, a public API for accounting exports, annual and ' +
    'monthly billing, tax on the customer\'s side where required, dunning when a card fails, usage-based ' +
    'billing for the pro tier, a billing portal where customers self-serve, webhooks to their systems, ' +
    'and an internal audit log of every money event. The finance team exports monthly close reports. ' +
    'Churn is our main risk, so retention analytics must be first-class. We expect to launch in two ' +
    'quarters and the first enterprise customer is a regulated financial institution.';
  assert.ok(promptLengthIndependence(short, long), 'the effort follows the product, never the prompt');
  const ps = planExecution(short);
  const pl = planExecution(long);
  assert.equal(ps.effort!.level, pl.effort!.level, `short=${ps.effort!.level} long=${pl.effort!.level}`);
});

test('repair: "fix the broken login" gets a small debugging-led team', () => {
  const p = planExecution('Fix the broken login on our existing app — it crashes after the password reset');
  assert.equal(p.mode, 'CRITICAL_REPAIR');
  assert.ok(p.team!.some((a) => a.agentId.startsWith('debug-')), 'root-cause debugging leads the repair team');
  assert.ok(p.team!.length <= 4, `repair stays small (got ${p.team!.length})`);
  assert.match(p.stopWhen!, /root cause/i);
});

test('hardening: deployment signals add readiness + rollback criteria', () => {
  const p = planExecution('Prepare the SaaS billing platform for production deployment and go-live');
  assert.equal(p.mode, 'PRODUCTION_HARDENING');
  assert.ok(p.completion!.join(' ').toLowerCase().includes('rollback'), 'a tested rollback path is a completion criterion');
  assert.ok(catalogValid(p));
});

test('broad mandate: "make something amazing" is AUTONOMOUS_PRODUCT with disclosed inference', () => {
  const p = planExecution('Make something amazing');
  assert.equal(p.mode, 'AUTONOMOUS_PRODUCT');
  assert.match(p.modeReason!, /infer|disclos/i);
  assert.ok(p.requirementTiers!.essential.length >= 1 || p.classification!.unseen, 'essential scoping is named or domain is first-principles');
});

test('instant: focused low-signal task gets <=2 agents', () => {
  const p = planExecution('Fix a typo in the about page');
  assert.ok(p.team!.length <= 2, `instant cap held (got ${p.team!.length})`);
  assert.ok(catalogValid(p));
});

test('waves: research/design in wave 1, implementation in wave 2, verification in wave 3', () => {
  const p = planExecution('Build a SaaS billing platform with checkout and subscriptions');
  const inWaves = p.waves!.flatMap((w) => w.agents);
  assert.equal(new Set(inWaves).size, inWaves.length, 'no agent is scheduled twice');
  assert.deepEqual(new Set(inWaves), new Set(p.team!.map((a) => a.agentId)), 'waves are exactly the team');
  assert.ok(p.waves!.some((w) => w.agents.some((id) => id.startsWith('verify-'))), 'completion gate in wave 3');
});

test('§5 missing-requirement intelligence: secrets are NEVER asked; scope questions are ESSENTIAL only for broad asks', () => {
  const t = classifyRequirementTiers('Build a marketplace that accepts Stripe payments, using my api key and database password');
  assert.equal(t.essential.length, 0, 'a specific product ask owes no essential question');
  assert.ok(t.neverAsk.length >= 1, 'the api key / password lands in NEVER_ASK');
  const t2 = classifyRequirementTiers('Build me a coffee website');
  assert.equal(t2.neverAsk.length, 0, 'no secret mentioned');
  assert.ok(t2.essential.length <= 2, 'essential questions are capped');
});

test('effort caps: FOCUSED <=2, STANDARD <=6, DEEP <=10, DEEPEST <=14', () => {
  for (const lvl of ['FOCUSED', 'STANDARD', 'DEEP', 'DEEPEST'] as const) {
    assert.equal(agentBudget(lvl), { FOCUSED: 2, STANDARD: 6, DEEP: 10, DEEPEST: 14 }[lvl]);
  }
});

test('determinism: two plans for same input are byte-identical', () => {
  const a = JSON.stringify(planExecution('Build a SaaS billing platform with checkout and subscriptions'));
  const b = JSON.stringify(planExecution('Build a SaaS billing platform with checkout and subscriptions'));
  assert.equal(a, b);
});

test('multi-label product pulls specialist from each secondary category', () => {
  const p = planExecution('Build a 3D jewellery marketplace where designers upload CAD files and buyers order custom pieces');
  const ids = p.team!.map((a) => a.agentId);
  const layered = p.classification!.categories.filter((c) => c.role === 'secondary');
  assert.ok(layered.length >= 1, 'the prompt is multi-label');
  for (const sec of layered) {
    assert.ok(
      ids.some((id) => id.includes('search') || id.includes('crdt') || id.includes('design') || id.includes('postgres')),
      `a specialist for layered ${sec.category} is on the team`
    );
  }
  assert.ok(catalogValid(p));
});

test('explicit mode override always wins', () => {
  const cls = classifyProject('Fix a typo');
  const r = selectMode('Fix a typo', cls, { requestedMode: 'DEEP_ENGINEERING' });
  assert.equal(r.mode, 'DEEP_ENGINEERING');
  assert.equal(r.reason, 'explicit user override');
});

// =====================================================================
// NEW DOMAIN-AWARE PLANNER TESTS
// =====================================================================

test('planDomainExecution: coffee shop produces a plan with all required fields', () => {
  const p = planDomainExecution('Build Cofi, a specialty coffee shop with pickup and delivery');
  assert.ok(p.id, 'plan has an id');
  assert.equal(p.productSpec.productType, 'coffee_shop');
  assert.ok(p.productSpec.confidence > 0, 'confidence > 0');
  assert.ok(p.domainModel.category, 'domain model has category');
  assert.ok(p.waves.length >= 3, 'at least 3 waves');
  assert.ok(p.agentTeams.length >= 1, 'at least one agent team');
  assert.ok(p.requirementTiers.length >= 1, 'at least one requirement tier');
  assert.ok(p.riskFactors.length >= 1, 'at least one risk factor');
  assert.ok(p.verificationPlan.acceptanceTests.length >= 1, 'acceptance tests defined');
});

test('planDomainExecution: ecommerce domain produces correct product spec', () => {
  const p = planDomainExecution('Build an online store selling handmade crafts with shopping cart and checkout');
  assert.equal(p.productSpec.productType, 'ecommerce');
  assert.ok(p.productSpec.featureRequirements.length >= 3, 'features detected');
  assert.ok(p.productSpec.securityRequirements.length >= 1, 'security requirements present');
});

test('planDomainExecution: SaaS domain detected', () => {
  const p = planDomainExecution('Create a SaaS platform for team collaboration with subscriptions and multi-tenancy');
  assert.equal(p.productSpec.productType, 'saas');
  assert.ok(p.productSpec.userPersonas.length >= 2, 'multiple personas detected');
});

test('planDomainExecution: manufacturing domain detected', () => {
  const p = planDomainExecution('Build a manufacturing management system with BOM, work orders, and production planning');
  assert.equal(p.productSpec.productType, 'manufacturing');
  assert.ok(p.domainModel.entities.length >= 2, 'domain entities present');
});

test('planDomainExecution: restaurant domain detected', () => {
  const p = planDomainExecution('Build a restaurant ordering and reservation system with menu management');
  assert.equal(p.productSpec.productType, 'restaurant');
  assert.ok(p.productSpec.integrationRequirements.length >= 1, 'integrations suggested');
});

test('planDomainExecution: healthcare domain detected', () => {
  const p = planDomainExecution('Build a patient management system for a clinic with appointment scheduling');
  assert.equal(p.productSpec.productType, 'healthcare');
  assert.ok(p.productSpec.securityRequirements.some((s) => s.severity === 'critical' || s.severity === 'high'), 'security requirements for healthcare');
});

test('planDomainExecution: marketplace domain detected', () => {
  const p = planDomainExecution('Build a multi-vendor marketplace with escrow payments and seller dashboards');
  assert.equal(p.productSpec.productType, 'marketplace');
  assert.ok(p.productSpec.featureRequirements.length >= 3, 'features detected');
});

test('planDomainExecution: booking domain detected', () => {
  const p = planDomainExecution('Create a booking and reservation system for hotels and experiences');
  assert.equal(p.productSpec.productType, 'booking');
  assert.ok(p.domainModel.workflows.length >= 1, 'workflows defined');
});

test('planDomainExecution: education domain detected', () => {
  const p = planDomainExecution('Build an online learning platform with courses, quizzes, and student progress tracking');
  assert.equal(p.productSpec.productType, 'education');
  assert.ok(p.productSpec.userPersonas.length >= 2, 'multiple personas');
});

test('planDomainExecution: logistics domain detected', () => {
  const p = planDomainExecution('Build a logistics and supply chain management system with fleet tracking');
  assert.equal(p.productSpec.productType, 'logistics');
  assert.ok(p.domainModel.financialFlows.length >= 1, 'financial flows present');
});

test('planDomainExecution: short prompt "Build Cofi" produces a reasonable plan', () => {
  const p = planDomainExecution('Build Cofi');
  assert.equal(p.productSpec.productType, 'coffee_shop');
  assert.ok(p.waves.length >= 3, 'wave structure exists');
  assert.ok(p.estimatedComplexity > 0, 'complexity estimated');
  assert.ok(p.estimatedDuration > 0, 'duration estimated');
});

test('planDomainExecution: short prompt "Create SaaS" produces a reasonable plan', () => {
  const p = planDomainExecution('Create SaaS');
  assert.equal(p.productSpec.productType, 'saas');
  assert.ok(p.waves.length >= 3, 'wave structure exists');
  assert.ok(catalogValid(p), 'all agents are catalog-verified');
});

test('planDomainExecution: very short "Build Cofi" gets reasonable confidence', () => {
  const p = planDomainExecution('Build Cofi');
  assert.ok(p.productSpec.confidence >= 0.3, 'confidence is reasonable for short prompt');
  assert.ok(p.productSpec.unknowns.length >= 1, 'unknowns flagged for short prompt');
});

test('planDomainExecution: detailed prompt gets all lifecycle stages', () => {
  const p = planDomainExecution(
    'Build a complete ecommerce platform with product catalog, shopping cart, checkout with Stripe payments, ' +
    'customer accounts with order history, admin dashboard for inventory management, delivery tracking, ' +
    'analytics dashboard, loyalty program, and comprehensive billing system with invoicing.'
  );

  // Check all lifecycle stages are covered in waves
  const coveredStages = new Set<string>();
  for (const wave of p.waves) {
    const desc = (wave.description + ' ' + wave.name).toLowerCase();
    for (const stage of DOMAIN_LIFECYCLE_STAGES) {
      if (desc.includes(stage.replace('_', ' '))) {
        coveredStages.add(stage);
      }
    }
  }

  // All primary stages should be covered for ecommerce
  const primaryForEcommerce = ['public_experience', 'customer_system', 'business_operations', 'admin', 'delivery', 'analytics', 'retention', 'financial'];
  for (const stage of primaryForEcommerce) {
    assert.ok(
      coveredStages.has(stage) || p.waves.some((w) => w.name.toLowerCase().includes(stage.replace('_', ' '))),
      `ecommerce plan covers ${stage}`
    );
  }
});

test('planDomainExecution: unknown domain still produces reasonable plan', () => {
  const p = planDomainExecution('Build a quantum computing simulation platform for molecular dynamics');
  // Unknown domain should produce a plan with UNSEEN classification
  assert.ok(p.classification!.unseen || p.productSpec.productType !== 'unknown',
    'unknown domain handled gracefully');
  assert.ok(p.waves.length >= 3, 'wave structure exists');
  assert.ok(p.requirementTiers.length >= 1, 'requirement tiers populated');
  assert.ok(p.domainModel.category === 'DERIVED' || p.classification!.unseen,
    'domain model is derived for unknown category');
});

test('planDomainExecution: multilingual prompt (Spanish) works', () => {
  const p = planDomainExecution('Construir una tienda en línea para vender ropa con carrito de compras');
  assert.ok(p.productSpec.productType === 'ecommerce' || p.productSpec.domains.includes('ecommerce'),
    'Spanish ecommerce prompt detected');
  assert.ok(p.waves.length >= 3, 'wave structure exists');
});

test('planDomainExecution: multilingual prompt (Hindi) works', () => {
  const p = planDomainExecution('बनाओ एक कॉफी शॉप ऐप जिसमें ऑर्डर लें और डिलीवरी हो');
  assert.ok(p.productSpec.intent === 'build' || p.productSpec.confidence > 0,
    'Hindi prompt processed');
  assert.ok(p.waves.length >= 3, 'wave structure exists');
});

test('planDomainExecution: all 9 domain lifecycle stages appear in plan', () => {
  const p = planDomainExecution('Build a complete SaaS platform with customer accounts, admin panel, billing, analytics, and notifications');
  const allWaveContent = p.waves.map((w) => w.name + ' ' + w.description).join(' ').toLowerCase();

  const stageKeywords: Record<string, string[]> = {
    public_experience: ['public', 'frontend', 'experience', 'interface'],
    customer_system: ['customer', 'account', 'profile', 'self-service'],
    business_operations: ['business', 'operation', 'workflow', 'management'],
    admin: ['admin', 'configuration', 'super-admin'],
    staff_tools: ['staff', 'internal', 'tool'],
    delivery: ['delivery', 'fulfillment', 'dispatch'],
    analytics: ['analytics', 'reporting', 'metrics'],
    retention: ['retention', 'engagement', 'loyalty', 'notification'],
    financial: ['financial', 'billing', 'payment', 'invoice'],
  };

  for (const [stage, keywords] of Object.entries(stageKeywords)) {
    const covered = keywords.some((kw) => allWaveContent.includes(kw)) ||
      p.waves.some((w) => w.name.toLowerCase().includes(stage.replace('_', ' ')));
    assert.ok(covered, `SaaS plan should cover ${stage} stage`);
  }
});

test('planDomainExecution: MoSCoW tiers are populated with real content', () => {
  const p = planDomainExecution('Build a marketplace with payments, seller dashboards, and buyer accounts');

  const mustHave = p.requirementTiers.find((t) => t.name === 'Must Have');
  const shouldHave = p.requirementTiers.find((t) => t.name === 'Should Have');
  const couldHave = p.requirementTiers.find((t) => t.name === 'Could Have');
  const wontHave = p.requirementTiers.find((t) => t.name === "Won't Have");

  assert.ok(mustHave, 'Must Have tier exists');
  assert.ok(mustHave!.requirements.length >= 3, `Must Have has content (${mustHave!.requirements.length} items)`);
  assert.ok(shouldHave, 'Should Have tier exists');
  assert.ok(shouldHave!.requirements.length >= 1, 'Should Have has content');
  assert.ok(couldHave, 'Could Have tier exists');
  assert.ok(wontHave, "Won't Have tier exists");
  assert.ok(wontHave!.requirements.length >= 1, "Won't Have has content");
});

test('planDomainExecution: acceptance criteria are testable and specific', () => {
  const p = planDomainExecution('Build an ecommerce platform with cart, checkout, and order tracking');

  for (const wave of p.waves) {
    assert.ok(wave.acceptanceCriteria.length >= 1, `wave ${wave.id} has acceptance criteria`);

    for (const criteria of wave.acceptanceCriteria) {
      // Criteria should be specific (not just "it works")
      const isVague = /^(it works|done|complete|finished|ok|good|nice|great)$/i.test(criteria.trim());
      assert.ok(!isVague, `acceptance criteria should be specific, not vague: "${criteria}"`);
    }
  }

  // Verification wave should have comprehensive acceptance criteria
  const verifyWave = p.waves.find((w) => w.id === 'wave-verification');
  assert.ok(verifyWave, 'verification wave exists');
  assert.ok(verifyWave!.acceptanceCriteria.length >= 3, 'verification wave has comprehensive criteria');
});

test('planDomainExecution: risk factors include technical, business, and timeline', () => {
  const p = planDomainExecution('Build a financial platform with real-time transactions and compliance reporting');

  const categories = new Set(p.riskFactors.map((r) => r.category));
  assert.ok(categories.size >= 2, `risk factors cover multiple categories: ${[...categories].join(', ')}`);

  for (const risk of p.riskFactors) {
    assert.ok(risk.severity, 'risk has severity');
    assert.ok(risk.probability >= 0 && risk.probability <= 1, 'probability is 0-1');
    assert.ok(risk.mitigation.length > 0, 'risk has mitigation');
    assert.ok(risk.description.length > 0, 'risk has description');
  }
});

test('planDomainExecution: verification plan has coverage targets', () => {
  const p = planDomainExecution('Build a SaaS platform');

  assert.ok(p.verificationPlan.coverageTargets.unitTest >= 50, 'unit test target >= 50%');
  assert.ok(p.verificationPlan.coverageTargets.integrationTest >= 40, 'integration test target >= 40%');
  assert.ok(p.verificationPlan.coverageTargets.e2eCritical >= 80, 'e2e critical target >= 80%');
  assert.ok(p.verificationPlan.coverageTargets.accessibility >= 80, 'accessibility target >= 80%');
});

test('planDomainExecution: quality gates are blocking', () => {
  const p = planDomainExecution('Build a SaaS platform');

  const blockingGates = p.verificationPlan.qualityGates.filter((g) => g.blocking);
  assert.ok(blockingGates.length >= 3, 'at least 3 blocking quality gates');

  for (const gate of p.verificationPlan.qualityGates) {
    assert.ok(gate.name.length > 0, 'gate has name');
    assert.ok(gate.check.length > 0, 'gate has check');
    assert.ok(gate.passCondition.length > 0, 'gate has pass condition');
  }
});

test('planDomainExecution: tasks have verifiable acceptance criteria', () => {
  const p = planDomainExecution('Build a coffee shop app with ordering and delivery');

  for (const wave of p.waves) {
    for (const task of wave.tasks) {
      assert.ok(task.acceptanceCriteria.length >= 1, `task ${task.id} has acceptance criteria`);
      assert.ok(task.dependencies.length >= 0, `task ${task.id} has dependencies array`);
      assert.ok(task.estimatedDuration > 0, `task ${task.id} has positive duration`);
      assert.ok(task.type, `task ${task.id} has a type`);
      assert.ok(['research', 'design', 'implement', 'test', 'deploy', 'verify'].includes(task.type),
        `task ${task.id} has valid type`);
    }
  }
});

test('planDomainExecution: agent teams have coordinators and skills', () => {
  const p = planDomainExecution('Build a marketplace platform');

  for (const team of p.agentTeams) {
    assert.ok(team.id, 'team has id');
    assert.ok(team.name, 'team has name');
    assert.ok(team.agents.length >= 1, `team ${team.id} has agents`);
    assert.ok(team.coordinator, `team ${team.id} has coordinator`);
    assert.ok(team.agents.includes(team.coordinator), `coordinator is in the team`);
    assert.ok(team.skills.length >= 1, `team ${team.id} has skills`);
  }
});

test('planDomainExecution: wave dependencies form a DAG', () => {
  const p = planDomainExecution('Build a comprehensive SaaS platform');

  const waveIds = new Set(p.waves.map((w) => w.id));

  for (const wave of p.waves) {
    for (const dep of wave.dependsOn) {
      assert.ok(waveIds.has(dep), `wave ${wave.id} depends on ${dep} which exists`);
    }
  }

  // No circular dependencies (simple check: no wave depends on itself transitively)
  const visited = new Set<string>();
  const hasCycle = (waveId: string): boolean => {
    if (visited.has(waveId)) return false;
    visited.add(waveId);
    const wave = p.waves.find((w) => w.id === waveId);
    if (!wave) return false;
    for (const dep of wave.dependsOn) {
      if (hasCycle(dep)) return true;
    }
    return false;
  };

  for (const wave of p.waves) {
    visited.clear();
    assert.ok(!hasCycle(wave.id), `no circular dependency from ${wave.id}`);
  }
});

test('planDomainExecution: estimated complexity is 0-100', () => {
  const p = planDomainExecution('Build a simple landing page');
  assert.ok(p.estimatedComplexity >= 0 && p.estimatedComplexity <= 100,
    `complexity ${p.estimatedComplexity} is in range`);
});

test('planDomainExecution: estimated duration is positive', () => {
  const p = planDomainExecution('Build a SaaS platform');
  assert.ok(p.estimatedDuration > 0, `duration ${p.estimatedDuration} is positive`);
});

test('planDomainExecution: product spec has all required fields', () => {
  const p = planDomainExecution('Build an ecommerce store');

  assert.ok(p.productSpec.intent.length > 0, 'intent is non-empty');
  assert.ok(p.productSpec.productType.length > 0, 'productType is non-empty');
  assert.ok(p.productSpec.confidence >= 0 && p.productSpec.confidence <= 1, 'confidence in range');
  assert.ok(p.productSpec.domains.length >= 1, 'domains detected');
  assert.ok(p.productSpec.userPersonas.length >= 1, 'user personas detected');
  assert.ok(p.productSpec.businessModel.modelType.length > 0, 'business model has type');
  assert.ok(p.productSpec.featureRequirements.length >= 1, 'feature requirements present');
  assert.ok(p.productSpec.technicalRequirements.length >= 1, 'technical requirements present');
  assert.ok(p.productSpec.operationalRequirements.length >= 1, 'operational requirements present');
  assert.ok(p.productSpec.designRequirements.length >= 1, 'design requirements present');
  assert.ok(p.productSpec.securityRequirements.length >= 1, 'security requirements present');
  assert.ok(p.productSpec.testingRequirements.length >= 1, 'testing requirements present');
  assert.ok(p.productSpec.deploymentRequirements.length >= 1, 'deployment requirements present');
  assert.ok(p.productSpec.integrationRequirements.length >= 1, 'integration requirements present');
});

test('planDomainExecution: domain model has all required fields', () => {
  const p = planDomainExecution('Build a coffee shop app');

  assert.ok(p.domainModel.category, 'domain model has category');
  assert.ok(p.domainModel.label.length > 0, 'domain model has label');
  assert.ok(p.domainModel.participants.length >= 1, 'domain model has participants');
  assert.ok(p.domainModel.entities.length >= 1, 'domain model has entities');
  assert.ok(p.domainModel.workflows.length >= 1, 'domain model has workflows');
  assert.ok(p.domainModel.financialFlows.length >= 0, 'domain model has financialFlows (may be empty)');
  assert.ok(p.domainModel.permissions.length >= 1, 'domain model has permissions');
  assert.ok(p.domainModel.constraints.length >= 1, 'domain model has constraints');
  assert.ok(p.domainModel.regulatory.length >= 0, 'domain model has regulatory');
  assert.ok(p.domainModel.successMetrics.length >= 1, 'domain model has success metrics');
});

test('planDomainExecution: legacy planExecution wraps domain planner correctly', () => {
  const legacy = planExecution('Build a SaaS platform');
  assert.ok(legacy.id, 'legacy plan has id from domain planner');
  assert.ok(legacy.productSpec, 'legacy plan has productSpec');
  assert.ok(legacy.domainModel, 'legacy plan has domainModel');
  assert.ok(legacy.waves, 'legacy plan has waves');
  assert.ok(legacy.task === 'Build a SaaS platform', 'legacy plan preserves task');
  assert.ok(legacy.mode, 'legacy plan has mode');
  assert.ok(legacy.classification, 'legacy plan has classification');
  assert.ok(legacy.team, 'legacy plan has team');
});

test('planDomainExecution: stop condition checks all lifecycle stages', () => {
  // A plan with incomplete stages should have a warning in stopWhen
  const p = planDomainExecution('Build a simple website');
  assert.ok(p.stopWhen!.length > 0, 'stopWhen is defined');
  assert.ok(
    p.stopWhen!.includes('INCOMPLETE') || p.stopWhen!.includes('evidence') || p.stopWhen!.includes('files generated'),
    'stopWhen mentions completion condition'
  );
});

test('planDomainExecution: unknowns are flagged for short prompts', () => {
  const p = planDomainExecution('Build Cofi');
  assert.ok(p.productSpec.unknowns.length >= 1, 'unknowns are flagged');
  for (const unknown of p.productSpec.unknowns) {
    assert.ok(unknown.length > 0, 'each unknown is non-empty');
  }
});

test('planDomainExecution: assumptions are recorded with confidence', () => {
  const p = planDomainExecution('Build an ecommerce platform');
  assert.ok(p.productSpec.assumptions.length >= 1, 'assumptions are recorded');
  for (const assumption of p.productSpec.assumptions) {
    assert.ok(assumption.confidence >= 0 && assumption.confidence <= 1, 'confidence in range');
    assert.ok(['low', 'medium', 'high'].includes(assumption.impact), 'impact is valid');
  }
});

test('planDomainExecution: domain model entities have invariants', () => {
  const p = planDomainExecution('Build a financial system with ledger and transactions');
  for (const entity of p.domainModel.entities) {
    assert.ok(entity.invariants.length >= 1, `${entity.name} has invariants`);
  }
});

test('planDomainExecution: wave research has intent expansion task', () => {
  const p = planDomainExecution('Build a SaaS platform');
  const researchWave = p.waves.find((w) => w.id === 'wave-research');
  assert.ok(researchWave, 'research wave exists');
  assert.ok(
    researchWave!.tasks.some((t) => t.name.toLowerCase().includes('intent') || t.name.toLowerCase().includes('product spec')),
    'research wave has intent expansion task'
  );
});

test('planDomainExecution: wave verification has comprehensive test tasks', () => {
  const p = planDomainExecution('Build a marketplace');
  const verifyWave = p.waves.find((w) => w.id === 'wave-verification');
  assert.ok(verifyWave, 'verification wave exists');
  const taskTypes = verifyWave!.tasks.map((t) => t.type);
  assert.ok(taskTypes.includes('test'), 'verification wave has test tasks');
  assert.ok(taskTypes.includes('verify'), 'verification wave has verify tasks');
});

test('planDomainExecution: domain model security considerations present for sensitive domains', () => {
  const p = planDomainExecution('Build a healthcare patient management system');
  assert.ok(p.productSpec.securityRequirements.length >= 2, 'healthcare has security requirements');
  assert.ok(
    p.productSpec.securityRequirements.some((s) => s.severity === 'critical' || s.severity === 'high'),
    'at least one high/critical security requirement'
  );
});

test('planDomainExecution: financial domain gets financial wave', () => {
  const p = planDomainExecution('Build an ecommerce store with payments and invoicing');
  const financialWave = p.waves.find((w) => w.id === 'wave-financial');
  assert.ok(financialWave, 'financial wave exists');
  assert.ok(
    financialWave!.tasks.some((t) => t.name.toLowerCase().includes('billing') || t.name.toLowerCase().includes('payment')),
    'financial wave has billing/payment tasks'
  );
});

test('planDomainExecution: tier content is never empty', () => {
  const p = planDomainExecution('Build a simple todo app');
  for (const tier of p.requirementTiers) {
    assert.ok(tier.requirements.length >= 1, `${tier.name} tier has requirements`);
    assert.ok(tier.mustHave.length >= 0, `${tier.name} has mustHave array`);
    assert.ok(tier.shouldHave.length >= 0, `${tier.name} has shouldHave array`);
    assert.ok(tier.couldHave.length >= 0, `${tier.name} has couldHave array`);
    assert.ok(tier.wontHave.length >= 0, `${tier.name} has wontHave array`);
  }
});

test('EXECUTION_MODES has exactly 7 modes', () => {
  assert.equal(EXECUTION_MODES.length, 7);
  assert.deepEqual(EXECUTION_MODES, [
    'INSTANT', 'STANDARD', 'DEEP_ENGINEERING', 'AUTONOMOUS_PRODUCT',
    'RESEARCH_INTENSIVE', 'CRITICAL_REPAIR', 'PRODUCTION_HARDENING',
  ]);
});

test('planDomainExecution: all domain lifecycle stages are defined', () => {
  assert.equal(DOMAIN_LIFECYCLE_STAGES.length, 9);
  const expected = [
    'public_experience', 'customer_system', 'business_operations', 'admin',
    'staff_tools', 'delivery', 'analytics', 'retention', 'financial',
  ];
  for (const stage of expected) {
    assert.ok(DOMAIN_LIFECYCLE_STAGES.includes(stage as any), `${stage} is in DOMAIN_LIFECYCLE_STAGES`);
  }
});

test('planDomainExecution: deterministic — same input produces same plan', () => {
  const a = JSON.stringify(planDomainExecution('Build a coffee shop with ordering'));
  const b = JSON.stringify(planDomainExecution('Build a coffee shop with ordering'));
  assert.equal(a, b);
});
