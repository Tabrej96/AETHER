/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Domain Workflow Registry Tests
 * (src/core/workflow/domainWorkflowRegistry.test.ts)
 *
 * Tests for domain workflow templates, adaptive selection,
 * and metrics tracking.
 *
 * Run via: npx tsx --test src/core/workflow/domainWorkflowRegistry.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DomainWorkflowRegistry,
  getTemplatesForDomain,
  getTemplatesForDomains,
  ALL_DOMAIN_WORKFLOW_TEMPLATES,
  QUALITY_GATES,
  getQualityGatesForDomain,
} from './domainWorkflowRegistry';
import { WorkflowRegistry } from './workflowRegistry';

// ============================================================
// Domain Workflow Templates
// ============================================================

describe('Domain Workflow Templates', () => {
  it('returns coffeeShop templates', () => {
    const templates = getTemplatesForDomain('coffeeShop');
    assert.ok(templates.length >= 2);
    assert.ok(templates.every(t => t.domain === 'coffeeShop'));
  });

  it('returns ecommerce templates', () => {
    const templates = getTemplatesForDomain('ecommerce');
    assert.ok(templates.length >= 2);
    assert.ok(templates.some(t => t.id === 'ecom-purchase-flow'));
  });

  it('returns saas templates', () => {
    const templates = getTemplatesForDomain('saas');
    assert.ok(templates.length >= 2);
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
    assert.ok(templates.some(t => t.domain === 'coffeeShop'));
    assert.ok(templates.some(t => t.domain === 'ecommerce'));
  });

  it('all templates have required fields', () => {
    for (const template of ALL_DOMAIN_WORKFLOW_TEMPLATES) {
      assert.ok(template.id.length > 0, `Template missing id`);
      assert.ok(template.name.length > 0, `Template ${template.id} missing name`);
      assert.ok(template.steps.length > 0, `Template ${template.id} has no steps`);
      assert.ok(template.triggers.length > 0, `Template ${template.id} has no triggers`);
    }
  });

  it('templates have valid step dependencies', () => {
    for (const template of ALL_DOMAIN_WORKFLOW_TEMPLATES) {
      const stepIds = new Set(template.steps.map(s => s.id));
      for (const step of template.steps) {
        for (const dep of step.dependsOn) {
          assert.ok(stepIds.has(dep), `Step ${step.id} depends on unknown step ${dep} in template ${template.id}`);
        }
      }
    }
  });
});

// ============================================================
// Domain Workflow Registry
// ============================================================

describe('DomainWorkflowRegistry', () => {
  it('registers domain templates', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    const count = domainRegistry.registerDomainTemplates('coffeeShop');
    assert.ok(count >= 2);
  });

  it('registers multiple domains', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    const results = domainRegistry.registerMultipleDomainTemplates(['coffeeShop', 'ecommerce']);
    assert.ok(results.coffeeShop >= 2);
    assert.ok(results.ecommerce >= 2);
  });

  it('converts template to workflow', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    const templates = getTemplatesForDomain('coffeeShop');
    const workflow = domainRegistry.templateToWorkflow(templates[0]);
    assert.strictEqual(workflow.id, templates[0].id);
    assert.strictEqual(workflow.name, templates[0].name);
    assert.ok(workflow.steps.length > 0);
  });

  it('selects workflow for domain without metrics', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    domainRegistry.registerDomainTemplates('booking');
    const result = domainRegistry.selectWorkflow('booking');
    assert.ok(result !== null);
    assert.ok(result!.confidence > 0);
  });

  it('selects workflow with intent matching', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    domainRegistry.registerDomainTemplates('ecommerce');
    const result = domainRegistry.selectWorkflow('ecommerce', 'checkout');
    assert.ok(result !== null);
  });

  it('returns null for unknown domain', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    const result = domainRegistry.selectWorkflow('nonexistent');
    assert.strictEqual(result, null);
  });

  it('records execution metrics', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    domainRegistry.registerDomainTemplates('coffeeShop');
    domainRegistry.recordExecution('cofi-order-fulfillment', true, 1500);
    const metrics = domainRegistry.getMetrics('cofi-order-fulfillment');
    assert.ok(metrics !== undefined);
    assert.strictEqual(metrics!.executionCount, 1);
    assert.strictEqual(metrics!.successCount, 1);
    assert.strictEqual(metrics!.successRate, 1);
  });

  it('updates rolling average duration', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    domainRegistry.registerDomainTemplates('coffeeShop');
    domainRegistry.recordExecution('cofi-order-fulfillment', true, 100);
    domainRegistry.recordExecution('cofi-order-fulfillment', true, 200);
    const metrics = domainRegistry.getMetrics('cofi-order-fulfillment');
    assert.ok(metrics !== undefined);
    assert.strictEqual(metrics!.executionCount, 2);
    assert.ok(metrics!.avgDurationMs > 0);
  });

  it('tracks failures', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    domainRegistry.registerDomainTemplates('coffeeShop');
    domainRegistry.recordExecution('cofi-order-fulfillment', false, 500);
    const metrics = domainRegistry.getMetrics('cofi-order-fulfillment');
    assert.ok(metrics !== undefined);
    assert.strictEqual(metrics!.failureCount, 1);
    assert.strictEqual(metrics!.successRate, 0);
  });

  it('getAllMetrics returns all recorded metrics', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    domainRegistry.registerDomainTemplates('coffeeShop');
    domainRegistry.recordExecution('cofi-order-fulfillment', true, 100);
    const allMetrics = domainRegistry.getAllMetrics();
    assert.ok(allMetrics.length > 0);
    assert.ok(allMetrics.every(m => m.domain === 'coffeeShop'));
  });

  it('getRegistry returns the underlying registry', () => {
    const wfRegistry = new WorkflowRegistry();
    const domainRegistry = new DomainWorkflowRegistry(wfRegistry);
    assert.strictEqual(domainRegistry.getRegistry(), wfRegistry);
  });
});

// ============================================================
// Quality Gates
// ============================================================

describe('Quality Gates', () => {
  it('returns gates for known domains', () => {
    const gates = getQualityGatesForDomain('coffeeShop');
    assert.ok(gates.length > 0);
    assert.strictEqual(gates[0].domain, 'coffeeShop');
  });

  it('returns empty for unknown domain', () => {
    const gates = getQualityGatesForDomain('unknown');
    assert.strictEqual(gates.length, 0);
  });

  it('gates have required fields', () => {
    for (const [domain, gates] of Object.entries(QUALITY_GATES)) {
      for (const gate of gates) {
        assert.ok(gate.id.length > 0, `Gate in ${domain} missing id`);
        assert.ok(gate.checks.length > 0, `Gate ${gate.id} has no checks`);
        assert.strictEqual(gate.domain, domain);
        assert.ok(gate.minPassRate >= 0 && gate.minPassRate <= 1);
      }
    }
  });
});
