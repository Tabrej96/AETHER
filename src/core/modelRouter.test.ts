/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the Production Model Router (modelRouter.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ModelRouter,
  routeOptimalModel,
  MODEL_CATALOG,
  DEFAULT_ROUTES,
  TIER_ORDER,
  TaskContext,
  RoutingDecision,
  ModelRoute,
  ModelInfo,
  ModelTier,
  TaskType,
} from './modelRouter';

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeContext(overrides: Partial<TaskContext> = {}): TaskContext {
  return {
    taskType: 'code',
    estimatedInputTokens: 1000,
    estimatedOutputTokens: 2000,
    requiresReasoning: false,
    isUrgent: false,
    ...overrides,
  };
}

// ─── ModelRouter Construction ────────────────────────────────────────────────

test('ModelRouter: constructor creates instance with empty state', () => {
  const router = new ModelRouter();
  assert.ok(router, 'router should be truthy');
  const log = router.getRoutingLog();
  assert.equal(log.length, 0, 'routing log should start empty');
});

test('ModelRouter: constructor accepts custom logMaxEntries', () => {
  const router = new ModelRouter({ logMaxEntries: 5 });
  assert.ok(router, 'router should be truthy');
});

// ─── route() Method ──────────────────────────────────────────────────────────

test('ModelRouter.route: returns valid RoutingDecision for code task', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext());

  assert.ok(decision.model, 'decision should have a model');
  assert.ok(decision.reasoningEffort, 'decision should have reasoningEffort');
  assert.ok(decision.maxTokens > 0, 'decision should have maxTokens > 0');
  assert.ok(decision.temperature >= 0 && decision.temperature <= 1, 'temperature should be in [0,1]');
  assert.ok(decision.rationale.length > 0, 'decision should have rationale');
  assert.ok(decision.estimatedCost >= 0, 'estimatedCost should be >= 0');
  assert.ok(Array.isArray(decision.fallbackChain), 'fallbackChain should be an array');
  assert.ok(['haiku', 'sonnet', 'opus', 'fable'].includes(decision.tier), 'tier should be valid');
});

test('ModelRouter.route: code task routes to sonnet', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext());
  assert.equal(decision.model, 'sonnet', 'code tasks should route to sonnet');
});

test('ModelRouter.route: summarize task routes to haiku', () => {
  const router = new ModelRouter();
  const decision = router.route('summarize', makeContext({ taskType: 'summarize' }));
  assert.equal(decision.model, 'haiku', 'summarize tasks should route to haiku');
  assert.equal(decision.reasoningEffort, 'low', 'summarize should have low reasoning effort');
});

test('ModelRouter.route: research task routes to fable', () => {
  const router = new ModelRouter();
  const decision = router.route('research', makeContext({ taskType: 'research' }));
  assert.equal(decision.model, 'fable', 'research tasks should route to fable');
});

test('ModelRouter.route: design task routes to sonnet', () => {
  const router = new ModelRouter();
  const decision = router.route('design', makeContext({ taskType: 'design' }));
  assert.equal(decision.model, 'sonnet', 'design tasks should route to sonnet');
});

test('ModelRouter.route: analysis task routes to sonnet', () => {
  const router = new ModelRouter();
  const decision = router.route('analysis', makeContext({ taskType: 'analysis' }));
  assert.equal(decision.model, 'sonnet', 'analysis tasks should route to sonnet');
});

test('ModelRouter.route: creative task routes to sonnet', () => {
  const router = new ModelRouter();
  const decision = router.route('creative', makeContext({ taskType: 'creative' }));
  assert.equal(decision.model, 'sonnet', 'creative tasks should route to sonnet');
});

test('ModelRouter.route: unknown task type defaults to sonnet (code)', () => {
  const router = new ModelRouter();
  const decision = router.route('unknown_type', makeContext({ taskType: 'unknown_type' as TaskType }));
  assert.equal(decision.model, 'sonnet', 'unknown task type should default to sonnet');
});

test('ModelRouter.route: cost scales with token count', () => {
  const router = new ModelRouter();
  const small = router.route('code', makeContext({ estimatedInputTokens: 100, estimatedOutputTokens: 100 }));
  const large = router.route('code', makeContext({ estimatedInputTokens: 100000, estimatedOutputTokens: 50000 }));
  assert.ok(large.estimatedCost > small.estimatedCost, 'larger token count should increase estimated cost');
});

test('ModelRouter.route: urgent flag is reflected in rationale', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext({ isUrgent: true }));
  assert.ok(decision.rationale.includes('Urgent'), 'rationale should mention urgent flag');
});

test('ModelRouter.route: reasoning flag is reflected in rationale', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext({ requiresReasoning: true }));
  assert.ok(decision.rationale.includes('Reasoning'), 'rationale should mention reasoning requirement');
});

test('ModelRouter.route: logs the routing decision', () => {
  const router = new ModelRouter();
  router.route('code', makeContext());
  const log = router.getRoutingLog();
  assert.equal(log.length, 1, 'log should have 1 entry');
  assert.equal(log[0].taskType, 'code');
  assert.equal(log[0].selectedModel, 'sonnet');
  assert.equal(log[0].fallbackUsed, false);
});

test('ModelRouter.route: logs multiple decisions', () => {
  const router = new ModelRouter();
  router.route('code', makeContext());
  router.route('summarize', makeContext({ taskType: 'summarize' }));
  const log = router.getRoutingLog();
  assert.equal(log.length, 2, 'log should have 2 entries');
});

test('ModelRouter.route: log can be filtered by timestamp', async () => {
  const router = new ModelRouter();
  router.route('code', makeContext());
  // Capture the timestamp of the first entry as the boundary
  const firstEntry = router.getRoutingLog()[0];
  const before = firstEntry.timestamp;
  await new Promise((r) => setTimeout(r, 10));
  router.route('summarize', makeContext({ taskType: 'summarize' }));
  const log = router.getRoutingLog(before);
  assert.equal(log.length, 1, 'log filter should return 1 entry');
  assert.equal(log[0].taskType, 'summarize');
});

// ─── getAvailableModels() ────────────────────────────────────────────────────

test('ModelRouter.getAvailableModels: returns ModelInfo array', () => {
  const router = new ModelRouter();
  const models = router.getAvailableModels();
  assert.ok(Array.isArray(models), 'should return an array');
  assert.ok(models.length > 0, 'should have at least one model');

  const model = models[0];
  assert.ok(model.id, 'model should have id');
  assert.ok(model.name, 'model should have name');
  assert.ok(model.provider, 'model should have provider');
  assert.ok(['haiku', 'sonnet', 'opus', 'fable'].includes(model.tier), 'model should have valid tier');
  assert.ok(typeof model.costPer1MInput === 'number', 'model should have costPer1MInput');
  assert.ok(typeof model.available === 'boolean', 'model should have available flag');
});

// ─── isAvailable() ───────────────────────────────────────────────────────────

test('ModelRouter.isAvailable: returns true for known model', () => {
  const router = new ModelRouter();
  assert.equal(router.isAvailable('claude-3-7-sonnet-thinking'), true);
});

test('ModelRouter.isAvailable: returns false for unknown model', () => {
  const router = new ModelRouter();
  assert.equal(router.isAvailable('nonexistent-model-xyz'), false);
});

// ─── getFallback() ───────────────────────────────────────────────────────────

test('ModelRouter.getFallback: fable fallback is opus', () => {
  const router = new ModelRouter();
  assert.equal(router.getFallback('fable'), 'opus');
});

test('ModelRouter.getFallback: opus fallback is sonnet', () => {
  const router = new ModelRouter();
  assert.equal(router.getFallback('opus'), 'sonnet');
});

test('ModelRouter.getFallback: sonnet fallback is haiku', () => {
  const router = new ModelRouter();
  assert.equal(router.getFallback('sonnet'), 'haiku');
});

test('ModelRouter.getFallback: haiku has no fallback (returns itself)', () => {
  const router = new ModelRouter();
  assert.equal(router.getFallback('haiku'), 'haiku');
});

test('ModelRouter.getFallback: unknown model returns itself', () => {
  const router = new ModelRouter();
  assert.equal(router.getFallback('unknown-model'), 'unknown-model');
});

// ─── estimateCost() ──────────────────────────────────────────────────────────

test('ModelRouter.estimateCost: returns non-negative cost', () => {
  const router = new ModelRouter();
  const cost = router.estimateCost('sonnet', 1000, 2000);
  assert.ok(cost >= 0, 'cost should be non-negative');
});

test('ModelRouter.estimateCost: haiku is cheapest, fable is most expensive', () => {
  const router = new ModelRouter();
  const haikuCost = router.estimateCost('haiku', 1000, 2000);
  const sonnetCost = router.estimateCost('sonnet', 1000, 2000);
  const opusCost = router.estimateCost('opus', 1000, 2000);
  const fableCost = router.estimateCost('fable', 1000, 2000);

  assert.ok(haikuCost < sonnetCost, 'haiku should be cheaper than sonnet');
  assert.ok(sonnetCost < opusCost, 'sonnet should be cheaper than opus');
  assert.ok(opusCost <= fableCost, 'opus should be <= fable (same pricing tier)');
});

test('ModelRouter.estimateCost: scales with token count', () => {
  const router = new ModelRouter();
  const small = router.estimateCost('sonnet', 100, 100);
  const large = router.estimateCost('sonnet', 10000, 5000);
  assert.ok(large > small, 'larger tokens should cost more');
});

// ─── enforceBudget() ─────────────────────────────────────────────────────────

test('ModelRouter.enforceBudget: returns original decision when within budget', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext());
  const enforced = router.enforceBudget(decision, 100.0);
  assert.equal(enforced.model, decision.model, 'model should not change within budget');
  assert.equal(enforced.estimatedCost, decision.estimatedCost, 'cost should not change within budget');
});

test('ModelRouter.enforceBudget: downgrades model when cost exceeds budget', () => {
  const router = new ModelRouter();
  const decision = router.route('research', makeContext({ taskType: 'research' }));
  // Research routes to fable which is expensive. Set a very low budget.
  const enforced = router.enforceBudget(decision, 0.0001);
  assert.ok(
    enforced.model !== decision.model || enforced.estimatedCost <= 0.0001,
    'should downgrade or adjust when over budget'
  );
});

test('ModelRouter.enforceBudget: includes budget warning in rationale', () => {
  const router = new ModelRouter();
  const decision = router.route('research', makeContext({ taskType: 'research' }));
  const enforced = router.enforceBudget(decision, 0.0001);
  assert.ok(
    enforced.rationale.includes('budget') || enforced.rationale.includes('Budget'),
    'rationale should mention budget enforcement'
  );
});

// ─── Session Budget ──────────────────────────────────────────────────────────

test('ModelRouter: setSessionBudget creates budget entry', () => {
  const router = new ModelRouter();
  router.setSessionBudget('session-1', 10.0);
  const report = router.getSessionCostReport('session-1');
  assert.ok(report.budget, 'budget should exist');
  assert.equal(report.budget.budgetUsd, 10.0);
  assert.equal(report.totalSpend, 0);
});

test('ModelRouter: routing charges session budget', () => {
  const router = new ModelRouter();
  router.setSessionBudget('session-1', 100.0);
  router.route('code', makeContext({ sessionId: 'session-1' }));
  const report = router.getSessionCostReport('session-1');
  assert.ok(report.totalSpend > 0, 'session spend should increase after routing');
});

test('ModelRouter: clearSessionBudget removes budget entry', () => {
  const router = new ModelRouter();
  router.setSessionBudget('session-1', 10.0);
  router.clearSessionBudget('session-1');
  const report = router.getSessionCostReport('session-1');
  assert.equal(report.budget, undefined, 'budget should be undefined after clearing');
});

// ─── Context Engine Integration ──────────────────────────────────────────────

test('ModelRouter: setContextEngine stores reference', () => {
  const router = new ModelRouter();
  const fakeEngine = { someMethod: () => {} };
  router.setContextEngine(fakeEngine);
  // No error should be thrown
  assert.ok(true);
});

// ─── getRoute() Convenience Method ───────────────────────────────────────────

test('ModelRouter.getRoute: returns correct route for each task type', () => {
  const router = new ModelRouter();

  const codeRoute = router.getRoute('code');
  assert.equal(codeRoute.recommendedModel, 'sonnet');
  assert.equal(codeRoute.reasoningEffort, 'high');

  const sumRoute = router.getRoute('summarize');
  assert.equal(sumRoute.recommendedModel, 'haiku');
  assert.equal(sumRoute.reasoningEffort, 'low');

  const researchRoute = router.getRoute('research');
  assert.equal(researchRoute.recommendedModel, 'fable');
  assert.equal(researchRoute.reasoningEffort, 'max');

  const creativeRoute = router.getRoute('creative');
  assert.equal(creativeRoute.recommendedModel, 'sonnet');
  assert.equal(creativeRoute.temperature, 0.7);
});

test('ModelRouter.getRoute: returns copy, not reference', () => {
  const router = new ModelRouter();
  const route1 = router.getRoute('code');
  route1.recommendedModel = 'hacked';
  const route2 = router.getRoute('code');
  assert.equal(route2.recommendedModel, 'sonnet', 'original route should be unchanged');
});

// ─── Tier Ordering & Fallback Chains ─────────────────────────────────────────

test('Tier order: fable > opus > sonnet > haiku', () => {
  assert.deepEqual(TIER_ORDER, ['fable', 'opus', 'sonnet', 'haiku']);
});

test('Fallback chain for fable: opus -> sonnet -> haiku', () => {
  const router = new ModelRouter();
  const decision = router.route('research', makeContext({ taskType: 'research' }));
  assert.deepEqual(decision.fallbackChain, ['opus', 'sonnet', 'haiku']);
});

test('Fallback chain for sonnet: haiku', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext());
  // sonnet fallback chain: haiku (sonnet is index 2 in TIER_ORDER, fallbacks are indices 3+)
  assert.ok(decision.fallbackChain.includes('haiku'), 'sonnet fallback should include haiku');
});

// ─── Default Routes Coverage ─────────────────────────────────────────────────

test('DEFAULT_ROUTES: all task types have valid routes', () => {
  const taskTypes: TaskType[] = ['code', 'research', 'design', 'analysis', 'summarize', 'creative'];
  for (const tt of taskTypes) {
    assert.ok(DEFAULT_ROUTES[tt], `should have route for ${tt}`);
    const route = DEFAULT_ROUTES[tt];
    assert.ok(['haiku', 'sonnet', 'opus', 'fable'].includes(route.recommendedModel), `${tt} recommendedModel should be valid`);
    assert.ok(route.maxTokens > 0, `${tt} maxTokens should be > 0`);
    assert.ok(route.temperature >= 0 && route.temperature <= 1, `${tt} temperature should be in [0,1]`);
    assert.ok(['low', 'medium', 'high', 'xhigh', 'max'].includes(route.reasoningEffort), `${tt} reasoningEffort should be valid`);
  }
});

// ─── Model Catalog Integrity ─────────────────────────────────────────────────

test('MODEL_CATALOG: has at least 3 models', () => {
  assert.ok(MODEL_CATALOG.length >= 3, 'catalog should have at least 3 models');
});

test('MODEL_CATALOG: all models have required fields', () => {
  for (const model of MODEL_CATALOG) {
    assert.ok(model.id, `model ${model.name} should have id`);
    assert.ok(model.name, 'model should have name');
    assert.ok(typeof model.codingQuality === 'number', `${model.name} should have codingQuality`);
    assert.ok(typeof model.costPer1MInputUsd === 'number', `${model.name} should have costPer1MInputUsd`);
    assert.ok(model.contextCapacityK > 0, `${model.name} should have positive context capacity`);
  }
});

// ─── Legacy Function Compatibility ───────────────────────────────────────────

test('routeOptimalModel: returns RoutedModelRecommendation', () => {
  const result = routeOptimalModel({
    taskType: 'ARCHITECTURE_DESIGN',
    requiredContextTokensK: 100,
    requireAirgappedLocal: false,
    maxCostPer1MUsd: 10.0,
    prioritizeLatency: false,
  });

  assert.ok(result.primaryModel, 'should have primaryModel');
  assert.ok(result.fallbackModel, 'should have fallbackModel');
  assert.ok(typeof result.compositeScore === 'number', 'should have compositeScore');
  assert.ok(result.routingRationale.length > 0, 'should have rationale');
  assert.ok(Array.isArray(result.allRanked), 'should have allRanked array');
  assert.ok(result.allRanked.length > 0, 'allRanked should not be empty');
});

test('routeOptimalModel: filters by airgapped local requirement', () => {
  const result = routeOptimalModel({
    taskType: 'FAST_SYNTAX_REPAIR',
    requiredContextTokensK: 10,
    requireAirgappedLocal: true,
    maxCostPer1MUsd: 100.0,
    prioritizeLatency: true,
  });

  assert.ok(result.primaryModel.isLocal, 'with airgapped local, primary should be local');
});

test('routeOptimalModel: results are sorted by composite score descending', () => {
  const result = routeOptimalModel({
    taskType: 'MULTI_FILE_IMPLEMENTATION',
    requiredContextTokensK: 50,
    requireAirgappedLocal: false,
    maxCostPer1MUsd: 100.0,
    prioritizeLatency: false,
  });

  for (let i = 1; i < result.allRanked.length; i++) {
    assert.ok(
      result.allRanked[i - 1].score >= result.allRanked[i].score,
      `rank ${i - 1} score (${result.allRanked[i - 1].score}) should be >= rank ${i} score (${result.allRanked[i].score})`
    );
  }
});

// ─── Edge Cases ──────────────────────────────────────────────────────────────

test('ModelRouter: multiple routers are independent', () => {
  const router1 = new ModelRouter();
  const router2 = new ModelRouter();
  router1.route('code', makeContext());
  router2.route('summarize', makeContext({ taskType: 'summarize' }));

  assert.equal(router1.getRoutingLog().length, 1);
  assert.equal(router2.getRoutingLog().length, 1);
  assert.equal(router1.getRoutingLog()[0].taskType, 'code');
  assert.equal(router2.getRoutingLog()[0].taskType, 'summarize');
});

test('ModelRouter: zero token estimate still produces valid decision', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext({ estimatedInputTokens: 0, estimatedOutputTokens: 0 }));
  assert.ok(decision.estimatedCost >= 0, 'zero tokens should produce valid cost');
});

test('ModelRouter: very large token estimate', () => {
  const router = new ModelRouter();
  const decision = router.route('code', makeContext({ estimatedInputTokens: 1_000_000, estimatedOutputTokens: 1_000_000 }));
  assert.ok(decision.estimatedCost > 0, 'large tokens should produce positive cost');
});
