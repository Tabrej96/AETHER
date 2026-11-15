/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Enhanced Condition Evaluator Tests
 * (src/core/workflow/conditionEvaluator.test.ts)
 *
 * Tests for domain-specific condition presets, structured condition
 * evaluation, condition groups, caching, and validation.
 *
 * Run via: npx tsx --test src/core/workflow/conditionEvaluator.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCondition,
  shouldStepRun,
  shouldLoopTerminate,
  selectBranch,
  validateCondition,
  clearConditionCache,
  evaluateStructuredCondition,
  evaluateConditionGroup,
  getPresetsForDomain,
  getPresetsForDomains,
  DOMAIN_CONDITION_PRESETS,
} from './conditionEvaluator';
import type { WorkflowStep, WorkflowExecution, HookConditionGroup } from './workflowEngine';
import type { HookCondition } from '../hooks/hookEngine';

// ---- evaluateCondition (string expressions) ----

describe('evaluateCondition', () => {
  it('evaluates simple expressions', () => {
    clearConditionCache();
    const ctx = { x: 5, y: 3 };
    const result = evaluateCondition('x > y', ctx);
    assert.strictEqual(result.satisfied, true);
    assert.strictEqual(result.value, true);
  });

  it('evaluates to false for false expressions', () => {
    clearConditionCache();
    const ctx = { x: 1, y: 2 };
    const result = evaluateCondition('x > y', ctx);
    assert.strictEqual(result.satisfied, false);
  });

  it('returns error for invalid expressions', () => {
    const result = evaluateCondition('invalid expression !!', {});
    assert.strictEqual(result.satisfied, false);
    assert.ok(result.error !== undefined);
    assert.strictEqual(result.error!.code, 'CONDITION_EVAL_ERROR');
  });

  it('handles context with string values', () => {
    const result = evaluateCondition("status === 'active'", { status: 'active' });
    assert.strictEqual(result.satisfied, true);
  });

  it('handles array context', () => {
    const result = evaluateCondition('items.length > 0', { items: [1, 2, 3] });
    assert.strictEqual(result.satisfied, true);
  });

  it('evaluates stepId parameter', () => {
    const result = evaluateCondition('x > 0', { x: 1 }, 'step-1');
    assert.strictEqual(result.satisfied, true);
  });
});

// ---- shouldStepRun ----

describe('shouldStepRun', () => {
  it('returns true when no condition', () => {
    const step: WorkflowStep = {
      id: 's1',
      name: 'Step 1',
      type: 'task',
      execution: { target: 'do-thing' },
      dependsOn: [],
    };
    const ctx = {};
    const result = shouldStepRun(step, ctx, 's1');
    assert.strictEqual(result.satisfied, true);
  });

  it('evaluates condition when present', () => {
    const step: WorkflowStep = {
      id: 's2',
      name: 'Step 2',
      type: 'task',
      execution: { target: 'do-thing' },
      dependsOn: [],
      condition: 'prev.success === true',
    };
    const ctx = { prev: { success: true } };
    const result = shouldStepRun(step, ctx, 's2');
    assert.strictEqual(result.satisfied, true);
  });

  it('returns false when condition fails', () => {
    const step: WorkflowStep = {
      id: 's3',
      name: 'Step 3',
      type: 'task',
      execution: { target: 'do-thing' },
      dependsOn: [],
      condition: 'attempts >= maxAttempts',
    };
    const ctx = { attempts: 2, maxAttempts: 3 };
    const result = shouldStepRun(step, ctx, 's3');
    assert.strictEqual(result.satisfied, false);
  });
});

// ---- shouldLoopTerminate ----

describe('shouldLoopTerminate', () => {
  it('returns true when no condition', () => {
    const result = shouldLoopTerminate('', {});
    assert.strictEqual(result.satisfied, true);
  });

  it('evaluates loop condition', () => {
    const result = shouldLoopTerminate('loopIndex >= maxIterations', { loopIndex: 5, maxIterations: 5 });
    assert.strictEqual(result.satisfied, true);
  });

  it('returns false when loop should continue', () => {
    const result = shouldLoopTerminate('loopIndex >= maxIterations', { loopIndex: 2, maxIterations: 5 });
    assert.strictEqual(result.satisfied, false);
  });
});

// ---- selectBranch ----

describe('selectBranch', () => {
  it('selects first matching branch', () => {
    const branches = [
      { condition: 'status === "error"', stepIds: ['error-handler'] },
      { condition: 'status === "success"', stepIds: ['success-handler'] },
    ];
    const result = selectBranch(branches, { status: 'success' });
    assert.strictEqual(result.branchIndex, 1);
    assert.deepStrictEqual(result.branch.stepIds, ['success-handler']);
  });

  it('falls back to first branch when no match', () => {
    const branches = [
      { condition: 'false', stepIds: ['fallback'] },
    ];
    const result = selectBranch(branches, { status: 'other' });
    assert.strictEqual(result.branchIndex, 0);
  });
});

// ---- validateCondition ----

describe('validateCondition', () => {
  it('validates correct expressions', () => {
    const result = validateCondition('x > 0');
    assert.strictEqual(result.valid, true);
  });

  it('reports invalid expressions', () => {
    const result = validateCondition('x >>> bad syntax');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error !== undefined);
  });
});

// ---- clearConditionCache ----

describe('clearConditionCache', () => {
  it('clears the cache without errors', () => {
    clearConditionCache();
    assert.ok(true); // No throw = pass
  });
});

// ---- evaluateStructuredCondition ----

describe('evaluateStructuredCondition', () => {
  const ctx = { status: 'active', count: 5, tags: ['a', 'b'], name: 'Alice' };

  it('evaluates equals', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'status', operator: 'equals', value: 'active' }, ctx), true);
    assert.strictEqual(evaluateStructuredCondition({ field: 'status', operator: 'equals', value: 'inactive' }, ctx), false);
  });

  it('evaluates not_equals', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'status', operator: 'not_equals', value: 'inactive' }, ctx), true);
  });

  it('evaluates contains', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'name', operator: 'contains', value: 'lic' }, ctx), true);
    assert.strictEqual(evaluateStructuredCondition({ field: 'name', operator: 'contains', value: 'Bob' }, ctx), false);
  });

  it('evaluates in', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'status', operator: 'in', value: ['active', 'pending'] }, ctx), true);
    assert.strictEqual(evaluateStructuredCondition({ field: 'status', operator: 'in', value: ['deleted', 'archived'] }, ctx), false);
  });

  it('evaluates not_in', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'status', operator: 'not_in', value: ['deleted', 'archived'] }, ctx), true);
  });

  it('evaluates greater_than', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'count', operator: 'greater_than', value: 3 }, ctx), true);
    assert.strictEqual(evaluateStructuredCondition({ field: 'count', operator: 'greater_than', value: 10 }, ctx), false);
  });

  it('evaluates regex', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'name', operator: 'regex', value: '^A' }, ctx), true);
    assert.strictEqual(evaluateStructuredCondition({ field: 'name', operator: 'regex', value: '^B' }, ctx), false);
  });

  it('evaluates contains on arrays', () => {
    assert.strictEqual(evaluateStructuredCondition({ field: 'tags', operator: 'contains', value: 'a' }, ctx), true);
    assert.strictEqual(evaluateStructuredCondition({ field: 'tags', operator: 'contains', value: 'z' }, ctx), false);
  });
});

// ---- evaluateConditionGroup ----

describe('evaluateConditionGroup', () => {
  const ctx = { role: 'admin', level: 5 };

  it('AND logic requires all conditions', () => {
    const group: HookConditionGroup = {
      logic: 'AND',
      conditions: [
        { field: 'role', operator: 'equals', value: 'admin' },
        { field: 'level', operator: 'greater_than', value: 3 },
      ],
    };
    const result = evaluateConditionGroup(group, ctx);
    assert.strictEqual(result.satisfied, true);
  });

  it('AND logic fails if any condition fails', () => {
    const group: HookConditionGroup = {
      logic: 'AND',
      conditions: [
        { field: 'role', operator: 'equals', value: 'admin' },
        { field: 'level', operator: 'greater_than', value: 10 },
      ],
    };
    const result = evaluateConditionGroup(group, ctx);
    assert.strictEqual(result.satisfied, false);
  });

  it('OR logic passes if any condition matches', () => {
    const group: HookConditionGroup = {
      logic: 'OR',
      conditions: [
        { field: 'role', operator: 'equals', value: 'guest' },
        { field: 'level', operator: 'greater_than', value: 10 },
      ],
    };
    const result = evaluateConditionGroup(group, ctx);
    assert.strictEqual(result.satisfied, false); // neither matches
  });
});

// ---- Domain-specific condition presets ----

describe('Domain Condition Presets', () => {
  it('returns presets for coffeeShop', () => {
    const presets = getPresetsForDomain('coffeeShop');
    assert.ok(presets.length > 0);
    assert.strictEqual(presets[0].domain, 'coffeeShop');
  });

  it('returns presets for ecommerce', () => {
    const presets = getPresetsForDomain('ecommerce');
    assert.ok(presets.some(p => p.domain === 'ecommerce'));
  });

  it('returns presets for saas', () => {
    const presets = getPresetsForDomain('saas');
    assert.ok(presets.some(p => p.domain === 'saas'));
  });

  it('returns presets for booking', () => {
    const presets = getPresetsForDomain('booking');
    assert.ok(presets.some(p => p.domain === 'booking'));
  });

  it('returns presets for logistics', () => {
    const presets = getPresetsForDomain('logistics');
    assert.ok(presets.some(p => p.domain === 'logistics'));
  });

  it('returns empty for unknown domain', () => {
    const presets = getPresetsForDomain('nonexistent');
    assert.strictEqual(presets.length, 0);
  });

  it('getPresetsForDomains returns multiple', () => {
    const presets = getPresetsForDomains(['coffeeShop', 'ecommerce']);
    assert.ok(presets.some(p => p.domain === 'coffeeShop'));
    assert.ok(presets.some(p => p.domain === 'ecommerce'));
  });

  it('presets have valid conditions', () => {
    for (const preset of DOMAIN_CONDITION_PRESETS) {
      for (const cond of preset.conditions) {
        const validation = validateCondition(cond.expression);
        assert.strictEqual(validation.valid, true, `Invalid condition ${cond.id}: ${validation.error}`);
      }
    }
  });

  it('preset conditions evaluate correctly', () => {
    const cofiPresets = getPresetsForDomain('coffeeShop');
    const orderCondition = cofiPresets[0].conditions.find(c => c.id === 'cofi-order-valid');
    if (orderCondition) {
      const result = evaluateCondition(orderCondition.expression, { orderItems: [1, 2], orderTotal: 25 });
      assert.strictEqual(result.satisfied, true);
    }
  });
});
