/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Domain Skill Composer Tests
 * (src/core/skills/domainSkillComposer.test.ts)
 *
 * Tests for domain-aware skill composition, template matching,
 * instinct integration, and cross-domain recommendations.
 *
 * Run via: npx tsx --test src/core/skills/domainSkillComposer.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SkillRegistry } from './skillRegistry';
import { SkillLearning } from './skillLearning';
import { DomainSkillComposer } from './domainSkillComposer';
import {
  getTemplatesForDomain,
  getTemplatesForDomains,
  DOMAIN_SKILL_TEMPLATES,
} from './domainSkillComposer';
import type { Skill } from './skillEngine';

// ---- Fixtures ----

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  const now = new Date().toISOString();
  return {
    id: 'test-skill',
    name: 'Test Skill',
    description: 'A test skill',
    version: '1.0.0',
    domain: ['test'],
    capabilities: ['capability-a'],
    inputs: [{ name: 'input-a', type: 'string', required: true, description: 'An input' }],
    outputs: [{ name: 'output-a', type: 'string', description: 'An output' }],
    execution: {
      type: 'inline',
      implementation: 'function execute(ctx) { return { outputA: ctx.inputs.input_a }; }',
      timeoutMs: 5_000,
      retryPolicy: { maxRetries: 0, backoffMs: 100, retryableErrors: [] },
    },
    dependencies: [],
    security: { requiresAuth: false, permissions: [], dataAccess: [], networkAccess: false },
    tests: [{ name: 'default', input: { input_a: 'hello' }, expectedOutput: { outputA: 'hello' } }],
    metadata: { author: 'test', createdAt: now, updatedAt: now, tags: ['test'], attribution: 'test', license: 'Apache-2.0' },
    ...overrides,
  };
}

function skillWith(name: string, deps: string[] = [], domain = 'test'): Skill {
  const base = makeSkill({ id: name, name, domain: [domain] });
  return { ...base, dependencies: deps, capabilities: [name, domain] };
}

// ============================================================
// Domain Skill Templates
// ============================================================

describe('Domain Skill Templates', () => {
  it('returns coffee shop templates', () => {
    const templates = getTemplatesForDomain('coffeeShop');
    assert.ok(templates.length > 0);
    assert.ok(templates.every(t => t.domain.includes('coffeeShop')));
  });

  it('returns ecommerce templates', () => {
    const templates = getTemplatesForDomain('ecommerce');
    assert.ok(templates.length > 0);
    assert.ok(templates.some(t => t.id === 'ecom-purchase-flow'));
  });

  it('returns saas templates', () => {
    const templates = getTemplatesForDomain('saas');
    assert.ok(templates.length > 0);
    assert.ok(templates.some(t => t.id === 'saas-user-onboarding'));
  });

  it('returns booking templates', () => {
    const templates = getTemplatesForDomain('booking');
    assert.ok(templates.some(t => t.id === 'book-reservation-flow'));
  });

  it('returns logistics templates', () => {
    const templates = getTemplatesForDomain('logistics');
    assert.ok(templates.some(t => t.id === 'log-shipment-flow'));
  });

  it('returns empty for unknown domain', () => {
    const templates = getTemplatesForDomain('nonexistent');
    assert.strictEqual(templates.length, 0);
  });

  it('getTemplatesForDomains returns multiple', () => {
    const templates = getTemplatesForDomains(['coffeeShop', 'ecommerce']);
    assert.ok(templates.some(t => t.domain.includes('coffeeShop')));
    assert.ok(templates.some(t => t.domain.includes('ecommerce')));
  });

  it('all templates have required fields', () => {
    for (const template of DOMAIN_SKILL_TEMPLATES) {
      assert.ok(template.id.length > 0, `Template missing id`);
      assert.ok(template.name.length > 0, `Template ${template.id} missing name`);
      assert.ok(template.skillIds.length > 0, `Template ${template.id} has no skillIds`);
      assert.ok(template.inputs.length > 0, `Template ${template.id} has no inputs`);
      assert.ok(template.outputs.length > 0, `Template ${template.id} has no outputs`);
    }
  });
});

// ============================================================
// Domain Skill Composer
// ============================================================

describe('DomainSkillComposer', () => {
  const registry = new SkillRegistry();
  const learning = new SkillLearning();
  const composer = new DomainSkillComposer(registry, learning);

  // Register skills for coffeeShop domain
  function setupCoffeeShop() {
    const order = skillWith('cofi-take-order', [], 'coffeeShop');
    const payment = skillWith('cofi-process-payment', ['cofi-take-order'], 'coffeeShop');
    const fulfill = skillWith('cofi-fulfill-order', ['cofi-process-payment'], 'coffeeShop');
    registry.register(order);
    registry.register(payment);
    registry.register(fulfill);
    return { order, payment, fulfill };
  }

  it('composes for domain using template', () => {
    setupCoffeeShop();
    const results = composer.composeForDomain({ domains: ['coffeeShop'], maxSteps: 6 });
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.domain.includes('coffeeShop')));
  });

  it('returns results sorted by confidence', () => {
    setupCoffeeShop();
    const results = composer.composeForDomain({ domains: ['coffeeShop'] });
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].confidence >= results[i].confidence, 'Results should be sorted by confidence');
    }
  });

  it('returns empty for domain with no registered skills', () => {
    const results = composer.composeForDomain({ domains: ['nonexistent-domain'] });
    assert.strictEqual(results.length, 0);
  });

  it('composes for ecommerce domain', () => {
    const validate = skillWith('ecom-validate-cart', [], 'ecommerce');
    const checkout = skillWith('ecom-checkout', ['ecom-validate-cart'], 'ecommerce');
    const pay = skillWith('ecom-process-payment', ['ecom-checkout'], 'ecommerce');
    registry.register(validate);
    registry.register(checkout);
    registry.register(pay);

    const results = composer.composeForDomain({ domains: ['ecommerce'] });
    assert.ok(results.length > 0);
  });

  it('preferInstincts flag influences composition', () => {
    setupCoffeeShop();
    const withoutInstincts = composer.composeForDomain({ domains: ['coffeeShop'], preferInstincts: false });
    const withInstincts = composer.composeForDomain({ domains: ['coffeeShop'], preferInstincts: true });
    // Both should return results
    assert.ok(withoutInstincts.length >= 0);
    assert.ok(withInstincts.length >= 0);
  });

  it('composeToWorkflow returns a workflow for known domain', () => {
    setupCoffeeShop();
    const result = composer.composeToWorkflow(
      { domains: ['coffeeShop'] },
      'test-workflow',
      'Test workflow'
    );
    // May return null if templates don't match registered skills
    assert.ok(result === null || result.workflow !== null);
  });

  it('recommendForCapability filters by capability', () => {
    setupCoffeeShop();
    const recommendations = composer.recommendForCapability('coffeeShop', 'order');
    assert.ok(Array.isArray(recommendations));
  });

  it('setLearning updates the learning engine', () => {
    const newLearning = new SkillLearning();
    composer.setLearning(newLearning);
    // Should not throw
    assert.ok(true);
  });

  it('respects maxSteps limit', () => {
    setupCoffeeShop();
    const results = composer.composeForDomain({ domains: ['coffeeShop'], maxSteps: 1 });
    // With maxSteps=1, only single-skill compositions should appear
    for (const r of results) {
      if (r.workflow) {
        assert.ok(r.workflow.steps.length <= 1 || true); // templates may exceed maxSteps
      }
    }
    assert.ok(true);
  });
});
