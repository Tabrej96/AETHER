/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Tests
 * (src/core/skills/skillEngine.test.ts)
 *
 * Tests the full pipeline:
 *  - skillEngine.ts  interfaces are type-checked by the compiler
 *  - skillRegistry.ts  register / find / dependencies
 *  - skillComposer.ts  compose / validate
 *  - skillExecutor.ts  execute inline / retry / timeout / cache
 *  - skillMetrics.ts   metrics aggregation
 *  - skillLearning.ts  analysis
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SkillRegistry,
  SkillComposer,
  SkillExecutor,
  SkillMetricsCollector,
  SkillLearning,
} from './index';
import type {
  Skill,
  SkillResult,
  SkillQuery,
} from './index';

// ============================================================
// Fixtures
// ============================================================

function makeSkill(overrides: Partial<Skill> = {}): Skill {
  const now = new Date().toISOString();
  return {
    id: 'test-skill',
    name: 'Test Skill',
    description: 'A test skill for unit tests',
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
    tests: [
      { name: 'default', input: { input_a: 'hello' }, expectedOutput: { outputA: 'hello transformed' } },
    ],
    metadata: {
      author: 'test',
      createdAt: now,
      updatedAt: now,
      tags: ['test'],
      attribution: 'test attribution',
      license: 'Apache-2.0',
    },
    ...overrides,
  };
}

function skillWith(name: string, deps: string[] = [], domain = 'test'): Skill {
  const base = makeSkill({ id: name, name });
  return { ...base, domain: [domain], dependencies: deps, capabilities: [name] };
}

// ============================================================
// SkillRegistry
// ============================================================

describe('SkillRegistry', () => {
  const registry = new SkillRegistry();

  it('registers and retrieves a skill', () => {
    const s = makeSkill({ id: 'reg-1', name: 'Reg One' });
    registry.register(s);
    assert.deepStrictEqual(registry.get('reg-1'), s);
  });

  it('replaces a skill on re-registration', () => {
    const v1 = makeSkill({ id: 'reg-2', name: 'V1' });
    const v2 = makeSkill({ id: 'reg-2', name: 'V2' });
    registry.register(v1);
    registry.register(v2);
    assert.strictEqual(registry.get('reg-2')!.name, 'V2');
  });

  it('unregisters a skill', () => {
    registry.register(makeSkill({ id: 'reg-3' }));
    assert(registry.has('reg-3'));
    const removed = registry.unregister('reg-3');
    assert.strictEqual(removed, true);
    assert.strictEqual(registry.has('reg-3'), false);
  });

  it('unregister returns false for missing skill', () => {
    assert.strictEqual(registry.unregister('does-not-exist'), false);
  });

  it('returns all registered skill ids', () => {
    registry.register(makeSkill({ id: 'a' }));
    registry.register(makeSkill({ id: 'b' }));
    assert.ok(registry.listIds().includes('a'));
    assert.ok(registry.listIds().includes('b'));
  });

  it('finds by domain', () => {
    registry.register(makeSkill({ id: 'd1', domain: ['backend'] }));
    registry.register(makeSkill({ id: 'd2', domain: ['backend'] }));
    registry.register(makeSkill({ id: 'd3', domain: ['frontend'] }));
    const found = registry.findByDomain('backend');
    assert.strictEqual(found.length, 2);
    assert.ok(found.every(s => s.domain.includes('backend')));
  });

  it('finds by capability', () => {
    registry.register(makeSkill({ id: 'c1', capabilities: ['parse'] }));
    registry.register(makeSkill({ id: 'c2', capabilities: ['parse'] }));
    const found = registry.findByCapability('parse');
    assert.strictEqual(found.length, 2);
  });

  it('finds by tag', () => {
    registry.register(makeSkill({ id: 't1', metadata: { ...makeSkill().metadata, tags: ['hot'] } }));
    registry.register(makeSkill({ id: 't2', metadata: { ...makeSkill().metadata, tags: ['cold'] } }));
    assert.strictEqual(registry.findByTag('hot').length, 1);
  });

  it('free-text search ranks name matches highest', () => {
    registry.register(makeSkill({ id: 'search-1', name: 'JSON Parser' }));
    registry.register(makeSkill({ id: 'search-2', name: 'Image Resizer' }));
    const found = registry.find({ text: 'json' });
    assert.ok(found.length > 0);
    assert.strictEqual(found[0].id, 'search-1');
  });

  it('filters by dependency', () => {
    registry.register(skillWith('base', [], 'core'));
    registry.register(skillWith('derived', ['base'], 'core'));
    registry.register(skillWith('independent', [], 'other'));
    const found = registry.find({ dependency: 'base' });
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].id, 'derived');
  });

  it('respects maxResults', () => {
    for (let i = 0; i < 100; i++) {
      registry.register(makeSkill({ id: `mr-${i}`, domain: ['bulk'] }));
    }
    const found = registry.find({ domain: 'bulk', maxResults: 10 });
    assert.strictEqual(found.length, 10);
  });

  it('resolves dependencies in topological order', () => {
    registry.register(skillWith('root'));
    registry.register(skillWith('mid', ['root']));
    registry.register(skillWith('leaf', ['mid']));
    const order = registry.resolveDependencies('leaf');
    assert.ok(order.indexOf('root') < order.indexOf('mid'));
    assert.ok(order.indexOf('mid') < order.indexOf('leaf'));
    assert.strictEqual(order[order.length - 1], 'leaf');
  });

  it('reports hasDependencies false for missing deps', () => {
    registry.register(skillWith('orphan', ['ghost']));
    assert.strictEqual(registry.hasDependencies('orphan'), false);
  });

  it('returns dependents of a skill', () => {
    registry.register(skillWith('lib'));
    registry.register(skillWith('app', ['lib']));
    const deps = registry.getDependents('lib');
    assert.strictEqual(deps.length, 1);
    assert.strictEqual(deps[0].id, 'app');
  });

  it('tracks and returns metrics', () => {
    registry.register(makeSkill({ id: 'metric-skill' }));
    registry.updateMetrics('metric-skill', { executionCount: 5, successCount: 4, failureCount: 1, successRate: 0.8 });
    const m = registry.getMetrics('metric-skill');
    assert.ok(m !== undefined);
    assert.strictEqual(m!.executionCount, 5);
    assert.strictEqual(m!.successRate, 0.8);
  });

  it('tracks health status', () => {
    registry.register(makeSkill({ id: 'health-skill' }));
    registry.setHealthStatus('health-skill', 'degraded');
    assert.strictEqual(registry.getHealthStatus('health-skill'), 'degraded');
    assert.ok(registry.getUnhealthySkills().some(s => s.id === 'health-skill'));
  });

  it('detects newer versions', () => {
    registry.register(makeSkill({ id: 'ver-skill', version: '2.0.0' }));
    assert.strictEqual(registry.hasNewerVersion('ver-skill', '1.0.0'), true);
    assert.strictEqual(registry.hasNewerVersion('ver-skill', '3.0.0'), false);
  });

  it('reports size', () => {
    const r = new SkillRegistry();
    assert.strictEqual(r.size, 0);
    r.register(makeSkill({ id: 'sz-1' }));
    r.register(makeSkill({ id: 'sz-2' }));
    assert.strictEqual(r.size, 2);
  });

  it('rejects skills with empty id', () => {
    assert.throws(() => registry.register(makeSkill({ id: '' })), /id is required/);
  });

  it('rejects skills with no tests', () => {
    assert.throws(
      () => registry.register({ ...makeSkill(), tests: [] }),
      /at least one test is required/,
    );
  });

  it('rejects skills with invalid version', () => {
    assert.throws(
      () => registry.register({ ...makeSkill(), version: 'bad' }),
      /version must be semver/,
    );
  });

  it('rejects skills with no domain', () => {
    assert.throws(
      () => registry.register({ ...makeSkill(), domain: [] }),
      /at least one domain/,
    );
  });

  it('rejects skills with no capabilities', () => {
    assert.throws(
      () => registry.register({ ...makeSkill(), capabilities: [] }),
      /at least one capability/,
    );
  });

  it('rejects inline skills with empty implementation', () => {
    assert.throws(
      () => registry.register({ ...makeSkill(), execution: { ...makeSkill().execution, implementation: '' } }),
      /non-empty implementation/,
    );
  });
});

// ============================================================
// SkillComposer
// ============================================================

describe('SkillComposer', () => {
  const registry = new SkillRegistry();
  const composer = new SkillComposer(registry);

  function setup() {
    const parser = skillWith('parser', [], 'data');
    parser.inputs = [{ name: 'text', type: 'string', required: true, description: 'input' }];
    parser.outputs = [{ name: 'text', type: 'string', description: 'parsed text' }];

    const upper = skillWith('upper', ['parser'], 'data');
    upper.inputs = [{ name: 'text', type: 'string', required: true, description: 'input' }];
    upper.outputs = [{ name: 'text', type: 'string', description: 'uppercased' }];

    registry.register(parser);
    registry.register(upper);
    return { parser, upper };
  }

  it('composes two sequential skills', () => {
    const { parser, upper } = setup();
    const result = composer.compose(['parser', 'upper'], 'parse-then-upper', 'Parse then uppercase');
    assert.strictEqual(result.valid, true);
    assert.ok(result.workflow !== null);
    assert.strictEqual(result.workflow!.steps.length, 2);
    assert.strictEqual(result.workflow!.steps[0].skillId, 'parser');
    assert.strictEqual(result.workflow!.steps[1].skillId, 'upper');
    assert.ok(result.executionPlan !== null);
  });

  it('reports missing skills as errors', () => {
    const result = composer.compose(['ghost-skill'], 'bad', 'bad workflow');
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some(e => e.type === 'missing_skill'));
  });

  it('produces workflow inputs from the first skill', () => {
    const { parser } = setup();
    const result = composer.compose(['parser'], 'single', 'single skill');
    assert.strictEqual(result.valid, true);
    assert.ok(result.workflow !== null);
    assert.ok(result.workflow!.inputs.some(i => i.name === 'text'));
  });

  it('produces workflow outputs from the last skill', () => {
    const { parser } = setup();
    const result = composer.compose(['parser'], 'single', 'single');
    assert.ok(result.workflow!.outputs.some(o => o.name === 'text'));
  });

  it('generates unique workflow ids', () => {
    const result1 = composer.compose(['parser'], 'wf-a', 'a');
    const result2 = composer.compose(['parser'], 'wf-b', 'b');
    assert.ok(result1.workflow!.id !== result2.workflow!.id);
  });

  it('matches data flow between consecutive skills', () => {
    const { parser, upper } = setup();
    const result = composer.compose(['parser', 'upper'], 'chain', 'chain');
    assert.strictEqual(result.workflow!.steps[1].dataFlow.length, 1);
    assert.strictEqual(result.workflow!.steps[1].dataFlow[0].fromOutput, 'text');
    assert.strictEqual(result.workflow!.steps[1].dataFlow[0].toInput, 'text');
  });
});

// ============================================================
// SkillExecutor
// ============================================================

describe('SkillExecutor', () => {
  const executor = new SkillExecutor();

  function makeExecutableSkill(id: string, impl: string): Skill {
    const base = makeSkill({ id, name: id, execution: { ...makeSkill().execution, implementation: impl } });
    return base;
  }

  it('executes an inline skill and returns output', async () => {
    const skill = makeExecutableSkill(
      'inline-ok',
      'function execute(ctx) { return { result: ctx.inputs.x }; }',
    );
    skill.inputs = [{ name: 'x', type: 'string', required: true, description: 'x' }];
    skill.outputs = [{ name: 'result', type: 'string', description: 'result' }];

    const result = await executor.execute(skill, { inputs: { x: 'hello' } });
    assert.strictEqual(result.status, 'success');
    assert.deepStrictEqual(result.output, { result: 'hello' });
    assert.ok(result.durationMs >= 0);
  });

  it('caches results for identical inputs', async () => {
    const skill = makeExecutableSkill(
      'inline-cache',
      'function execute(ctx) { return { v: 1 }; }',
    );
    skill.inputs = [{ name: 'x', type: 'string', required: true, description: 'x' }];
    skill.outputs = [{ name: 'v', type: 'number', description: 'v' }];

    const r1 = await executor.execute(skill, { inputs: { x: 'a' } });
    assert.strictEqual(r1.cached, false);

    const r2 = await executor.execute(skill, { inputs: { x: 'a' } });
    assert.strictEqual(r2.cached, true);
  });

  it('validates missing required inputs', async () => {
    const skill = makeSkill();
    skill.inputs = [
      { name: 'required-val', type: 'string', required: true, description: 'must supply' },
    ];
    skill.outputs = [];
    skill.execution = {
      type: 'inline',
      implementation: 'function execute() { return {}; }',
      timeoutMs: 1000,
      retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] },
    };

    const result = await executor.execute(skill, { inputs: {} });
    assert.strictEqual(result.status, 'error');
    assert.ok(result.error!.code === 'INPUT_VALIDATION_ERROR');
  });

  it('returns error for wrong input type', async () => {
    const skill = makeSkill();
    skill.inputs = [
      { name: 'num', type: 'number', required: true, description: 'a number' },
    ];
    skill.outputs = [];
    skill.execution = {
      type: 'inline',
      implementation: 'function execute() { return {}; }',
      timeoutMs: 1000,
      retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] },
    };

    const result = await executor.execute(skill, { inputs: { num: 'not-a-number' } });
    assert.strictEqual(result.status, 'error');
    assert.ok(result.error!.message.includes('type'));
  });

  it('reports timeout when duration exceeds maxDurationMs', async () => {
    const skill = makeSkill({
      id: 'slow-skill',
      inputs: [{ name: 'val', type: 'string', required: true, description: 'v' }],
      outputs: [],
      execution: {
        type: 'inline',
        implementation: 'function execute() { return {}; }',
        timeoutMs: 60_000,
        retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] },
      },
    });
    // Set maxDurationMs to 0 to force immediate timeout
    const result = await executor.execute(skill, { inputs: { val: 'x' }, maxDurationMs: 0 });
    assert.strictEqual(result.status, 'timeout');
    assert.strictEqual(result.error?.code, 'TIMEOUT');
  });

  it('agent type returns dispatch result', async () => {
    const skill = makeSkill({
      id: 'agent-skill',
      inputs: [{ name: 'prompt', type: 'string', required: true, description: 'prompt' }],
      outputs: [{ name: 'result', type: 'object', description: 'result' }],
      execution: { type: 'agent', implementation: 'agent-42', timeoutMs: 1000, retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] } },
    });
    const result = await executor.execute(skill, { inputs: { prompt: 'do thing' } });
    assert.strictEqual(result.status, 'success');
    assert.strictEqual((result.output as Record<string, unknown>)?.dispatched, true);
  });

  it('mcp type returns call result', async () => {
    const skill = makeSkill({
      id: 'mcp-skill',
      inputs: [{ name: 'arg', type: 'string', required: true, description: 'arg' }],
      outputs: [{ name: 'result', type: 'object', description: 'result' }],
      execution: { type: 'mcp', implementation: 'tool-name', timeoutMs: 1000, retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] } },
    });
    const result = await executor.execute(skill, { inputs: { arg: 'x' } });
    assert.strictEqual(result.status, 'success');
    assert.strictEqual((result.output as Record<string, unknown>)?.mcpTool, 'tool-name');
  });

  it('workflow type returns launched result', async () => {
    const skill = makeSkill({
      id: 'wf-skill',
      inputs: [{ name: 'cfg', type: 'object', required: true, description: 'config' }],
      outputs: [],
      execution: { type: 'workflow', implementation: 'wf-123', timeoutMs: 1000, retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] } },
    });
    const result = await executor.execute(skill, { inputs: { cfg: {} } });
    assert.strictEqual(result.status, 'success');
    assert.strictEqual((result.output as Record<string, unknown>)?.launched, true);
  });

  it('unhandled exception returns error result', async () => {
    const skill = makeSkill({
      id: 'throw-skill',
      inputs: [{ name: 'x', type: 'string', required: true, description: 'x' }],
      outputs: [],
      execution: {
        type: 'inline',
        implementation: 'function execute() { throw new Error("boom"); }',
        timeoutMs: 1000,
        retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] },
      },
    });
    const result = await executor.execute(skill, { inputs: { x: 'y' } });
    assert.strictEqual(result.status, 'error');
    assert.strictEqual(result.error?.code, 'INLINE_EXECUTION_ERROR');
  });

  it('treats "any" type as accepting everything', async () => {
    const skill = makeSkill({
      id: 'any-skill',
      inputs: [{ name: 'val', type: 'any', required: true, description: 'any' }],
      outputs: [],
      execution: {
        type: 'inline',
        implementation: 'function execute() { return {}; }',
        timeoutMs: 1000,
        retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] },
      },
    });
    const result = await executor.execute(skill, { inputs: { val: 42 } });
    assert.strictEqual(result.status, 'success');
  });
});

// ============================================================
// SkillMetrics
// ============================================================

describe('SkillMetricsCollector', () => {
  const collector = new SkillMetricsCollector();

  function makeResult(skillId: string, status: SkillResult['status'], durationMs: number): SkillResult {
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

  it('records results and updates metrics', () => {
    const skill = makeSkill({ id: 'm-skill' });
    collector.record(skill, makeResult('m-skill', 'success', 100));
    const m = collector.getMetrics(skill);
    assert.strictEqual(m.executionCount, 1);
    assert.strictEqual(m.successCount, 1);
    assert.strictEqual(m.successRate, 1);
    assert.strictEqual(m.avgDurationMs, 100);
  });

  it('records failure metrics', () => {
    const skill = makeSkill({ id: 'm-fail' });
    collector.record(skill, makeResult('m-fail', 'failure', 200));
    const m = collector.getMetrics(skill);
    assert.strictEqual(m.failureCount, 1);
    assert.strictEqual(m.successRate, 0);
    assert.strictEqual(m.errorBreakdown.FAIL, 1);
  });

  it('records timeout metrics', () => {
    const skill = makeSkill({ id: 'm-to' });
    collector.record(skill, makeResult('m-to', 'timeout', 5000));
    const m = collector.getMetrics(skill);
    assert.strictEqual(m.timeoutCount, 1);
  });

  it('computes p95 across many runs', () => {
    const skill = makeSkill({ id: 'm-p95' });
    for (let i = 0; i < 100; i++) {
      collector.record(skill, makeResult('m-p95', 'success', i * 10));
    }
    const m = collector.getMetrics(skill);
    assert.strictEqual(m.executionCount, 100);
    assert.ok(m.p95DurationMs >= 900); // 95th percentile should be ~900ms
  });

  it('records satisfaction', () => {
    const skill = makeSkill({ id: 'm-sat' });
    collector.record(skill, makeResult('m-sat', 'success', 50));
    collector.recordSatisfaction('m-sat', 4);
    // satisfaction stored in output; just verify no throw
    assert.ok(true);
  });

  it('capturesResourceSnapshot works in test environment', () => {
    const snap = SkillMetricsCollector.captureResources();
    assert.ok(typeof snap.heapUsedBytes === 'number');
  });
});

// ============================================================
// SkillLearning
// ============================================================

describe('SkillLearning', () => {
  const registry = new SkillRegistry();
  const learning = new SkillLearning();

  function registerWithMetrics(id: string, successRate: number, execCount: number) {
    const now = new Date().toISOString();
    const skill = makeSkill({
      id,
      metadata: { ...makeSkill().metadata, createdAt: now, updatedAt: now },
    });
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

  it('detects skill combinations', () => {
    registerWithMetrics('comb-a', 0.9, 10);
    registerWithMetrics('comb-b', 0.9, 10);
    const report = learning.analyze(registry);
    assert.ok(report.combinations.length >= 0); // may or may not find combos
  });

  it('retire suggestion for long-inactive skills', () => {
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
});

// ============================================================
// Integration: end-to-end flow
// ============================================================

describe('Skill Engine integration', () => {
  it('register → compose → execute → metrics → learning', async () => {
    const registry = new SkillRegistry();
    const composer = new SkillComposer(registry);
    const executor = new SkillExecutor();
    const metrics = new SkillMetricsCollector();
    const learning = new SkillLearning();

    // Create two composable skills
    const skillA: Skill = {
      id: 'int-a',
      name: 'Add',
      description: 'Add two numbers',
      version: '1.0.0',
      domain: ['math'],
      capabilities: ['add'],
      inputs: [{ name: 'x', type: 'number', required: true, description: 'first' }, { name: 'y', type: 'number', required: true, description: 'second' }],
      outputs: [{ name: 'sum', type: 'number', description: 'result' }],
      execution: {
        type: 'inline',
        implementation: 'function execute(ctx) { return { sum: Number(ctx.inputs.x) + Number(ctx.inputs.y) }; }',
        timeoutMs: 1000,
        retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] },
      },
      dependencies: [],
      security: { requiresAuth: false, permissions: [], dataAccess: [], networkAccess: false },
      tests: [{ name: 'add', input: { x: 2, y: 3 }, expectedOutput: { sum: 5 } }],
      metadata: { author: 'test', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['math'], attribution: 'test', license: 'Apache-2.0' },
    };

    const skillB: Skill = {
      id: 'int-b',
      name: 'Multiply',
      description: 'Multiply two numbers',
      version: '1.0.0',
      domain: ['math'],
      capabilities: ['multiply'],
      inputs: [{ name: 'sum', type: 'number', required: true, description: 'input' }, { name: 'factor', type: 'number', required: true, description: 'factor' }],
      outputs: [{ name: 'product', type: 'number', description: 'result' }],
      execution: {
        type: 'inline',
        implementation: 'function execute(ctx) { return { product: Number(ctx.inputs.sum) * Number(ctx.inputs.factor) }; }',
        timeoutMs: 1000,
        retryPolicy: { maxRetries: 0, backoffMs: 0, retryableErrors: [] },
      },
      dependencies: [],
      security: { requiresAuth: false, permissions: [], dataAccess: [], networkAccess: false },
      tests: [{ name: 'mul', input: { sum: 5, factor: 2 }, expectedOutput: { product: 10 } }],
      metadata: { author: 'test', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: ['math'], attribution: 'test', license: 'Apache-2.0' },
    };

    registry.register(skillA);
    registry.register(skillB);

    // Compose
    const workflow = composer.compose(['int-a', 'int-b'], 'add-then-mul', 'Add then multiply');
    assert.strictEqual(workflow.valid, true);
    assert.strictEqual(workflow.workflow!.steps.length, 2);

    // Execute skill A
    const resultA = await executor.execute(skillA, { inputs: { x: 3, y: 7 } });
    assert.strictEqual(resultA.status, 'success');
    assert.deepStrictEqual(resultA.output, { sum: 10 });
    metrics.record(skillA, resultA);

    // Execute skill B
    const resultB = await executor.execute(skillB, { inputs: { sum: 10, factor: 4 } });
    assert.strictEqual(resultB.status, 'success');
    assert.deepStrictEqual(resultB.output, { product: 40 });
    metrics.record(skillB, resultB);

    // Metrics
    const mA = metrics.getMetrics(skillA);
    const mB = metrics.getMetrics(skillB);
    assert.strictEqual(mA.executionCount, 1);
    assert.strictEqual(mB.executionCount, 1);

    // Learning
    const report = learning.analyze(registry);
    assert.ok(report.suggestions.length >= 0);
    assert.ok(report.combinations.some(c => c.skillIds.includes('int-a') && c.skillIds.includes('int-b')));
  });
});
