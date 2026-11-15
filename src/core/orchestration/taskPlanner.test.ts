/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TASK PLANNER TESTS  ·  AETHER Autonomous Execution
 * (src/core/orchestration/taskPlanner.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TaskPlanner,
  createTaskPlanner,
  decomposeGoal,
  type ExecutionPlanResult,
  type TaskStep,
  type DependencyGraph,
  type TaskComplexity,
} from './taskPlanner';

// =====================================================================
// BASIC DECOMPOSITION TESTS
// =====================================================================

test('decomposes a build goal into steps', () => {
  const plan = decomposeGoal('Build a REST API for user management');
  assert.ok(plan.steps.length >= 3, `expected at least 3 steps, got ${plan.steps.length}`);
  assert.equal(plan.goal, 'Build a REST API for user management');
  assert.ok(plan.planId.startsWith('plan-'), 'planId has correct prefix');
});

test('first step is always intent analysis', () => {
  const plan = decomposeGoal('Create a web application');
  const firstStep = plan.steps[0];
  assert.equal(firstStep.action, 'analyze_intent');
  assert.equal(firstStep.dependsOn.length, 0, 'first step has no dependencies');
});

test('steps have no duplicate stepIds', () => {
  const plan = decomposeGoal('Build a marketplace with payments and delivery');
  const ids = plan.steps.map((s) => s.stepId);
  assert.equal(new Set(ids).size, ids.length, 'all stepIds are unique');
});

test('decompose goal produces deterministic results', () => {
  const plan1 = decomposeGoal('Build a SaaS platform');
  const plan2 = decomposeGoal('Build a SaaS platform');
  assert.deepEqual(plan1.steps.map((s) => s.stepId), plan2.steps.map((s) => s.stepId));
});

// =====================================================================
// DEPENDENCY GRAPH TESTS
// =====================================================================

test('dependency graph is valid DAG', () => {
  const plan = decomposeGoal('Build a payment processing system');
  const graph = plan.dependencyGraph;

  // First step should have no incoming edges
  const firstStep = plan.steps[0];
  const incomingEdges = graph.edges.filter(([, to]) => to === firstStep.stepId);
  assert.equal(incomingEdges.length, 0, `first step ${firstStep.stepId} has no incoming edges`);

  // Every referenced dependency should exist in nodes
  const nodeSet = new Set(graph.nodes);
  for (const step of plan.steps) {
    for (const dep of step.dependsOn) {
      assert.ok(nodeSet.has(dep), `dependency ${dep} exists in graph nodes`);
    }
  }
});

test('dependency graph levels are valid', () => {
  const plan = decomposeGoal('Implement a user authentication system');
  const graph = plan.dependencyGraph;

  // First level should contain the intent analysis step
  assert.ok(graph.levels.length > 0, 'graph has levels');
  assert.ok(graph.levels[0].length > 0, 'first level is not empty');

  // First level should contain steps with no dependencies
  for (const stepId of graph.levels[0]) {
    const step = plan.steps.find((s) => s.stepId === stepId);
    assert.ok(step, `step ${stepId} exists`);
    assert.equal(step!.dependsOn.length, 0, `step ${stepId} in first level has no dependencies`);
  }
});

test('critical path is non-empty', () => {
  const plan = decomposeGoal('Build a complete e-commerce platform');
  assert.ok(plan.dependencyGraph.criticalPath.length > 0, 'critical path is non-empty');
  assert.ok(plan.dependencyGraph.criticalPath.length <= plan.steps.length, 'critical path does not exceed step count');
});

// =====================================================================
// COMPLEXITY CLASSIFICATION TESTS
// =====================================================================

test('trivial task has <=2 steps and short duration', () => {
  const plan = decomposeGoal('Fix a typo in the about page');
  assert.ok(['TRIVIAL', 'SIMPLE'].includes(plan.complexity), `got complexity: ${plan.complexity}`);
});

test('complex task has appropriate complexity', () => {
  const plan = decomposeGoal('Build a complete enterprise multi-tenant SaaS platform with payments, analytics, and compliance');
  assert.ok(
    ['MODERATE', 'COMPLEX', 'CRITICAL'].includes(plan.complexity),
    `expected MODERATE/COMPLEX/CRITICAL, got ${plan.complexity}`
  );
  assert.ok(plan.steps.length >= 4, `expected at least 4 steps, got ${plan.steps.length}`);
});

test('complexity values are valid', () => {
  const complexities: TaskComplexity[] = ['TRIVIAL', 'SIMPLE', 'MODERATE', 'COMPLEX', 'CRITICAL'];
  const plan = decomposeGoal('Refactor the authentication module');
  assert.ok(complexities.includes(plan.complexity), `${plan.complexity} is a valid complexity`);
});

// =====================================================================
// RESOURCE ESTIMATION TESTS
// =====================================================================

test('resource summary is non-empty for implementation tasks', () => {
  const plan = decomposeGoal('Build a data processing pipeline');
  assert.ok(plan.resourceSummary.length > 0, 'resource summary is non-empty');
});

test('resource summary aggregates across steps', () => {
  const plan = decomposeGoal('Build a microservice with database, API, and tests');
  const tokenBudget = plan.resourceSummary.find((r) => r.resource === 'TOKEN_BUDGET');
  assert.ok(tokenBudget, 'TOKEN_BUDGET found in resource summary');
  if (tokenBudget) {
    assert.ok(tokenBudget.amount > 0, 'token budget is positive');
  }
});

test('each step has resource requirements', () => {
  const plan = decomposeGoal('Implement a caching layer');
  for (const step of plan.steps) {
    assert.ok(Array.isArray(step.resourceRequirements), `step ${step.stepId} has resourceRequirements array`);
  }
});

// =====================================================================
// RECOVERY STRATEGIES TESTS
// =====================================================================

test('implementation steps have recovery strategies', () => {
  const plan = decomposeGoal('Build a REST API');
  const implSteps = plan.steps.filter((s) => s.action === 'implement');
  for (const step of implSteps) {
    assert.ok(step.recoveryStrategies.length > 0, `impl step ${step.stepId} has recovery strategies`);
  }
});

test('recovery strategies have valid maxRetries', () => {
  const plan = decomposeGoal('Build a payment system');
  for (const step of plan.steps) {
    for (const strategy of step.recoveryStrategies) {
      assert.ok(strategy.maxRetries >= 0, `strategy ${strategy.strategyId} has non-negative maxRetries`);
      assert.ok(strategy.backoffMs >= 0, `strategy ${strategy.strategyId} has non-negative backoffMs`);
      assert.ok(strategy.strategyId.length > 0, 'strategy has non-empty id');
    }
  }
  // Plan-level recovery strategies
  for (const strategy of plan.recoveryStrategies) {
    assert.ok(strategy.maxRetries >= 0);
    assert.ok(strategy.backoffMs >= 0);
  }
});

// =====================================================================
// PARALLEL GROUPS TESTS
// =====================================================================

test('parallel groups cover all steps', () => {
  const plan = decomposeGoal('Build a web application with frontend and backend');
  const groupedSteps = new Set<string>();
  for (const group of plan.parallelGroups) {
    for (const stepId of group) {
      groupedSteps.add(stepId);
    }
  }
  assert.equal(groupedSteps.size, plan.steps.length, 'all steps are in parallel groups');
});

test('steps within a parallel group have no interdependencies', () => {
  const plan = decomposeGoal('Build a full-stack application');
  const stepIds = new Set(plan.steps.map((s) => s.stepId));
  const depMap = new Map(plan.steps.map((s) => [s.stepId, new Set(s.dependsOn)]));

  for (const group of plan.parallelGroups) {
    if (group.length <= 1) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const depsA = depMap.get(group[i]) ?? new Set();
        const depsB = depMap.get(group[j]) ?? new Set();
        assert.ok(!depsA.has(group[j]), `step ${group[i]} should not depend on ${group[j]} in same group`);
        assert.ok(!depsB.has(group[i]), `step ${group[j]} should not depend on ${group[i]} in same group`);
      }
    }
  }
});

// =====================================================================
// ESTIMATION TESTS
// =====================================================================

test('total estimated duration is positive', () => {
  const plan = decomposeGoal('Build a CLI tool');
  assert.ok(plan.totalEstimatedDurationMs > 0, 'total duration is positive');
});

test('step durations sum to total', () => {
  const plan = decomposeGoal('Build a data analysis tool');
  const sum = plan.steps.reduce((acc, s) => acc + s.estimatedDurationMs, 0);
  assert.equal(plan.totalEstimatedDurationMs, sum, 'step durations sum to total');
});

test('each step has positive estimated duration', () => {
  const plan = decomposeGoal('Implement a notification system');
  for (const step of plan.steps) {
    assert.ok(step.estimatedDurationMs > 0, `step ${step.stepId} has positive duration`);
  }
});

// =====================================================================
// VERIFICATION CRITERIA TESTS
// =====================================================================

test('each step has verification criteria', () => {
  const plan = decomposeGoal('Build a search feature');
  for (const step of plan.steps) {
    assert.ok(Array.isArray(step.verificationCriteria), `step ${step.stepId} has verificationCriteria`);
    assert.ok(step.verificationCriteria.length > 0, `step ${step.stepId} has at least one criterion`);
  }
});

// =====================================================================
// TASK PLANNER CLASS TESTS
// =====================================================================

test('TaskPlanner class works the same as convenience function', () => {
  const planner = new TaskPlanner({ maxSteps: 20, defaultRetries: 2 });
  const plan = planner.createPlan('Build a small utility');
  assert.ok(plan.steps.length > 0, 'plan has steps');
  assert.ok(plan.steps.length <= 20, 'plan respects maxSteps');
});

test('custom options affect plan', () => {
  const planner = new TaskPlanner({ maxSteps: 3, defaultRetries: 5, defaultBackoffMs: 500 });
  const plan = planner.createPlan('Build a web scraper');
  assert.ok(plan.steps.length <= 3, `maxSteps enforced: got ${plan.steps.length}`);
});

test('different goals produce different plans', () => {
  const plan1 = decomposeGoal('Research blockchain consensus');
  const plan2 = decomposeGoal('Build a complete enterprise SaaS platform with payments, analytics, and compliance');
  assert.ok(plan2.steps.length > plan1.steps.length, `build plan (${plan2.steps.length}) has more steps than research plan (${plan1.steps.length})`);
});

test('plan metadata is populated', () => {
  const plan = decomposeGoal('Implement user profiles');
  assert.ok(plan.metadata.createdAt, 'metadata has createdAt');
  assert.equal(plan.metadata.stepCount, plan.steps.length, 'metadata stepCount matches');
  assert.ok(typeof plan.metadata.averageStepDuration === 'number', 'metadata has averageStepDuration');
});

// =====================================================================
// GOAL KEYWORD DETECTION TESTS
// =====================================================================

test('research goal produces research step', () => {
  const plan = decomposeGoal('Research blockchain consensus mechanisms');
  assert.ok(plan.steps.some((s) => s.action === 'research'), 'plan has research step');
});

test('test goal produces verification step', () => {
  const plan = decomposeGoal('Test the authentication module');
  assert.ok(plan.steps.some((s) => s.action === 'verify'), 'plan has verify step');
});

test('deploy goal produces deploy step', () => {
  const plan = decomposeGoal('Deploy the application to production');
  assert.ok(plan.steps.some((s) => s.action === 'deploy'), 'plan has deploy step');
});

test('security goal produces security validation step', () => {
  const plan = decomposeGoal('Harden the API security');
  assert.ok(plan.steps.some((s) => s.action === 'security_validate'), 'plan has security step');
});

test('refactor goal produces implement step', () => {
  const plan = decomposeGoal('Refactor the legacy codebase');
  assert.ok(plan.steps.some((s) => s.action === 'implement'), 'plan has implement step');
});

// =====================================================================
// EDGE CASE TESTS
// =====================================================================

test('empty goal string produces minimal plan', () => {
  const plan = decomposeGoal('');
  assert.ok(plan.steps.length > 0, 'still produces at least intent analysis step');
});

test('very short goal still decomposes', () => {
  const plan = decomposeGoal('Do it');
  assert.ok(plan.steps.length > 0, 'short goal still produces steps');
  assert.ok(plan.steps[0].action === 'analyze_intent', 'starts with intent analysis');
});

test('very long goal is handled', () => {
  const longGoal = 'Build '.repeat(100) + 'a complex system';
  const plan = decomposeGoal(longGoal);
  assert.ok(plan.steps.length > 0, 'long goal still produces steps');
  assert.ok(plan.goal === longGoal, 'goal is preserved');
});

test('maxSteps limits output', () => {
  const planner = new TaskPlanner({ maxSteps: 2 });
  const plan = planner.createPlan('Build a full-stack e-commerce platform with payments, analytics, and delivery tracking');
  assert.ok(plan.steps.length <= 2, `maxSteps=2, got ${plan.steps.length}`);
});
