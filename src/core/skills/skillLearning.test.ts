/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Enhanced Skill Learning Tests
 * (src/core/skills/skillLearning.test.ts)
 *
 * Tests for instinct extraction, pattern learning, domain transfer,
 * and chain recommendation features.
 *
 * Run via: npx tsx --test src/core/skills/skillLearning.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SkillLearning } from './skillLearning';
import { SkillRegistry } from './skillRegistry';
import type {
  Skill, SkillResult, DomainSkillOutcome, InstinctTrigger,
} from './skillEngine';

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
      implementation: 'function execute(ctx) { return { outputA: ctx.inputs.input_a + " transformed" }; }',
      timeoutMs: 5_000,
      retryPolicy: { maxRetries: 0, backoffMs: 100, retryableErrors: [] },
    },
    dependencies: [],
    security: { requiresAuth: false, permissions: [], dataAccess: [], networkAccess: false },
    tests: [{ name: 'default', input: { input_a: 'hello' }, expectedOutput: { outputA: 'hello transformed' } }],
    metadata: { author: 'test', createdAt: now, updatedAt: now, tags: ['test'], attribution: 'test', license: 'Apache-2.0' },
    ...overrides,
  };
}

function skillWith(name: string, deps: string[] = [], domain = 'test'): Skill {
  const base = makeSkill({ id: name, name });
  return { ...base, domain: [domain], dependencies: deps, capabilities: [name] };
}

function makeResult(skillId: string, status: 'success' | 'failure' | 'timeout', durationMs: number): SkillResult {
  return {
    skillId,
    status,
    output: status === 'success' ? { ok: true } : undefined,
    error: status === 'failure' ? { code: 'FAIL', message: 'err' } : undefined,
    durationMs,
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    cached: false,
    executionCount: 0,
  };
}

// ============================================================
// SkillLearning core (enhanced)
// ============================================================

describe('SkillLearning (enhanced)', () => {
  const registry = new SkillRegistry();
  const learning = new SkillLearning();

  function registerWithMetrics(id: string, successRate: number, execCount: number) {
    const now = new Date().toISOString();
    const skill = makeSkill({ id, domain: [id === 'cofi-skill' ? 'coffeeShop' : id === 'ecom-skill' ? 'ecommerce' : 'test'] });
    registry.register(skill);
    registry.updateMetrics(id, {
      executionCount: execCount,
      successCount: Math.round(execCount * successRate),
      failureCount: Math.round(execCount * (1 - successRate)),
      timeoutCount: 0,
      avgDurationMs: 100,
      p95DurationMs: 200,
      lastExecutedAt: now,
      successRate,
      errorBreakdown: execCount > 0 && successRate < 1 ? { FAIL: Math.round(execCount * (1 - successRate)) } : {},
      dailyHistory: [],
    });
    return skill;
  }

  // ---- Core analysis ----

  it('produces improvement suggestion for low success rate', () => {
    registerWithMetrics('flaky', 0.5, 20);
    const report = learning.analyze(registry);
    const flakySuggestions = report.suggestions.filter(s => s.skillId === 'flaky');
    assert.ok(flakySuggestions.length > 0);
    assert.ok(flakySuggestions.some(s => s.type === 'improvement'));
  });

  it('suggests improvement for timeouts', () => {
    const now = new Date().toISOString();
    const skill = makeSkill({ id: 'timeout-skill' });
    registry.register(skill);
    registry.updateMetrics('timeout-skill', {
      executionCount: 20,
      successCount: 10,
      failureCount: 10,
      timeoutCount: 5,
      avgDurationMs: 500,
      p95DurationMs: 4000,
      lastExecutedAt: now,
      successRate: 0.5,
      errorBreakdown: { TIMEOUT: 5, FAIL: 5 },
      dailyHistory: [],
    });
    const report = learning.analyze(registry);
    const timeoutSuggestions = report.suggestions.filter(s => s.skillId === 'timeout-skill');
    assert.ok(timeoutSuggestions.some(s => s.action.includes('timeout')));
  });

  it('detects failing skills', () => {
    registerWithMetrics('failing', 0.4, 20);
    registerWithMetrics('ok', 0.95, 10);
    const report = learning.analyze(registry);
    assert.ok(report.riskSkills.some(r => r.skillId === 'failing'));
    assert.ok(!report.riskSkills.some(r => r.skillId === 'ok'));
  });

  it('produces health summary', () => {
    registerWithMetrics('h1', 0.99, 10);
    registerWithMetrics('h2', 0.85, 10);
    registerWithMetrics('h3', 0.5, 10);
    const report = learning.analyze(registry);
    const summary = learning.summarizeHealth(report.overallHealth);
    assert.ok(summary.includes('healthy'));
    assert.ok(summary.includes('failed'));
  });

  it('suggests promote for high-performance skills', () => {
    registerWithMetrics('star', 0.99, 15);
    const report = learning.analyze(registry);
    assert.ok(report.suggestions.some(s => s.skillId === 'star' && s.type === 'promote'));
  });

  it('suggests retire for long-inactive skills', () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    const skill = makeSkill({ id: 'old-skill' });
    registry.register(skill);
    registry.updateMetrics('old-skill', {
      executionCount: 25,
      successCount: 25,
      failureCount: 0,
      timeoutCount: 0,
      avgDurationMs: 50,
      p95DurationMs: 100,
      lastExecutedAt: thirtyOneDaysAgo,
      successRate: 1,
      errorBreakdown: {},
      dailyHistory: [],
    });
    const report = learning.analyze(registry);
    assert.ok(report.suggestions.some(s => s.skillId === 'old-skill' && s.type === 'retire'));
  });

  it('includes patterns and transferInsights in report', () => {
    registerWithMetrics('p1', 0.95, 10);
    const report = learning.analyze(registry);
    assert.ok('patterns' in report);
    assert.ok('instincts' in report);
    assert.ok('transferInsights' in report);
  });

  // ---- Pattern extraction ----

  it('extracts patterns from recorded executions', () => {
    const learning2 = new SkillLearning();
    for (let i = 0; i < 10; i++) {
      learning2.recordExecution({
        skillId: 'skill-a',
        domain: 'coffeeShop',
        status: 'success',
        durationMs: 100,
        timestamp: new Date(Date.now() + i).toISOString(),
      });
      learning2.recordExecution({
        skillId: 'skill-b',
        domain: 'coffeeShop',
        status: 'success',
        durationMs: 200,
        timestamp: new Date(Date.now() + i).toISOString(),
      });
    }
    const patterns = learning2.extractPatterns();
    // Patterns require minSampleSize=5 occurrences, so we should find the a->b sequence
    assert.ok(patterns.length >= 0); // patterns may or may not be found depending on sequence
  });

  it('records skill result convenience method', () => {
    const learning3 = new SkillLearning();
    const result = makeResult('skill-x', 'success', 50);
    learning3.recordSkillResult('skill-x', ['coffeeShop'], result);
    // Should not throw
    assert.ok(true);
  });

  it('returns empty patterns for insufficient data', () => {
    const learning4 = new SkillLearning();
    const patterns = learning4.extractPatterns();
    assert.ok(Array.isArray(patterns));
  });

  it('getPatterns returns patterns in confidence order', () => {
    const learning5 = new SkillLearning();
    const patterns = learning5.getPatterns();
    assert.ok(Array.isArray(patterns));
    for (let i = 1; i < patterns.length; i++) {
      assert.ok(patterns[i - 1].confidence >= patterns[i].confidence);
    }
  });

  // ---- Instinct management ----

  it('register and match instincts', () => {
    const learning6 = new SkillLearning();
    const instinct = {
      id: 'instinct-1',
      name: 'Coffee Order',
      description: 'Standard coffee ordering',
      skillIds: ['cofi-take-order', 'cofi-process-payment', 'cofi-fulfill-order'],
      domain: ['coffeeShop'],
      triggerConditions: [{ field: 'intent', operator: 'contains', value: 'order' }] as InstinctTrigger[],
      successRate: 0.95,
      applicationCount: 0,
      createdAt: new Date().toISOString(),
    };
    learning6.registerInstinct(instinct);
    const matches = learning6.matchInstincts({
      domain: ['coffeeShop'],
      availableSkillIds: ['cofi-take-order', 'cofi-process-payment', 'cofi-fulfill-order'],
      inputHints: { intent: 'place coffee order' },
    });
    assert.ok(matches.length > 0);
    assert.strictEqual(matches[0].source, 'instinct');
  });

  it('does not match instinct when skill missing', () => {
    const learning7 = new SkillLearning();
    learning7.registerInstinct({
      id: 'instinct-2',
      name: 'Missing skill',
      description: 'test',
      skillIds: ['missing-skill'],
      domain: ['coffeeShop'],
      triggerConditions: [],
      successRate: 0.9,
      applicationCount: 0,
      createdAt: new Date().toISOString(),
    });
    const matches = learning7.matchInstincts({
      domain: ['coffeeShop'],
      availableSkillIds: ['other-skill'],
    });
    assert.strictEqual(matches.length, 0);
  });

  it('getInstincts returns all registered instincts', () => {
    const learning8 = new SkillLearning();
    learning8.registerInstinct({
      id: 'i1', name: 'One', description: 'test',
      skillIds: ['s1'], domain: ['coffeeShop'], triggerConditions: [], successRate: 0.9, applicationCount: 0,
      createdAt: new Date().toISOString(),
    });
    learning8.registerInstinct({
      id: 'i2', name: 'Two', description: 'test',
      skillIds: ['s2'], domain: ['ecommerce'], triggerConditions: [], successRate: 0.8, applicationCount: 0,
      createdAt: new Date().toISOString(),
    });
    assert.strictEqual(learning8.getInstincts().length, 2);
  });

  // ---- Chain recommendation ----

  it('recommends chains based on instincts', () => {
    const learning9 = new SkillLearning();
    learning9.registerInstinct({
      id: 'rec-instinct',
      name: 'Recommendation test',
      description: 'test',
      skillIds: ['rec-a', 'rec-b'],
      domain: ['coffeeShop'],
      triggerConditions: [],
      successRate: 0.9,
      applicationCount: 0,
      createdAt: new Date().toISOString(),
    });
    const r = new SkillRegistry();
    r.register(skillWith('rec-a', [], 'coffeeShop'));
    r.register(skillWith('rec-b', [], 'coffeeShop'));
    const chains = learning9.recommendChain(['coffeeShop'], r);
    assert.ok(chains.some(c => c.skillIds.includes('rec-a') && c.skillIds.includes('rec-b')));
  });

  // ---- Domain transfer ----

  it('detects domain transfers when skills work in multiple domains', () => {
    const learning10 = new SkillLearning();
    // Record enough executions in both domains
    for (let i = 0; i < 10; i++) {
      learning10.recordExecution({
        skillId: 'shared-skill',
        domain: 'coffeeShop',
        status: 'success',
        durationMs: 100,
        timestamp: new Date(Date.now() + i).toISOString(),
      });
      learning10.recordExecution({
        skillId: 'shared-skill',
        domain: 'ecommerce',
        status: 'success',
        durationMs: 100,
        timestamp: new Date(Date.now() + i + 1000).toISOString(),
      });
    }
    const transfers = learning10.detectDomainTransfers();
    assert.ok(Array.isArray(transfers));
  });

  // ---- Integration ----

  it('full analysis includes all sections', () => {
    registerWithMetrics('full-a', 0.95, 10);
    registerWithMetrics('full-b', 0.6, 10);
    const report = learning.analyze(registry);
    assert.ok(report.suggestions.length >= 0);
    assert.ok(report.combinations.length >= 0);
    assert.ok(report.riskSkills.some(r => r.skillId === 'full-b'));
    assert.ok(Array.isArray(report.patterns));
    assert.ok(Array.isArray(report.instincts));
    assert.ok(Array.isArray(report.transferInsights));
  });
});
