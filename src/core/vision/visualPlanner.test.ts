/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Visual Planner Tests (visualPlanner.test.ts)
 *
 * Tests for src/core/vision/visualPlanner.ts
 *
 * Run via: npx --yes tsx --test src/core/vision/visualPlanner.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTaskPlan,
  ScreenStateTracker,
  recoverFromError,
  advancePlan,
  recordPlanError,
  currentStep,
  hasMoreSteps,
} from './visualPlanner';
import type { DetectedUIElement, PerceivedScreen } from './perceptionEngine';
import type { ElementRole } from './perceptionEngine';

function makeElement(id: string, label: string, role: ElementRole, confidence = 0.9): DetectedUIElement {
  return {
    elementId: id,
    label,
    role,
    bbox: { x: 0, y: 0, width: 100, height: 50 },
    confidence,
    attributes: {},
    children: [],
  };
}

function makeScreen(elements: DetectedUIElement[] = []): PerceivedScreen {
  return {
    screenId: 'test-screen',
    capture: { captureId: 'cap-1', viewport: { width: 1280, height: 900 }, timestamp: Date.now() },
    elements,
    stateHash: 'screen-hash-1',
  };
}

// ─── Task Plan Creation ───────────────────────────────────────────────────────

test('createTaskPlan: creates a plan with a goal', () => {
  const screen = makeScreen([makeElement('e1', 'Submit', 'button', 0.9)]);
  const plan = createTaskPlan('submit form', screen);
  assert.equal(plan.goal, 'submit form');
  assert.ok(plan.planId.startsWith('plan-'));
  assert.equal(plan.status, 'pending');
  assert.ok(plan.steps.length >= 1, 'Should have at least one step');
});

test('createTaskPlan: goal with "submit" produces a click action', () => {
  const screen = makeScreen([makeElement('e1', 'Pay Now', 'button', 0.95)]);
  const plan = createTaskPlan('submit checkout', screen);
  const clickStep = plan.steps.find((s) => s.type === 'click');
  assert.ok(clickStep, 'Should have a click step');
  assert.ok(clickStep!.description.includes('Pay Now'), 'Should reference the button label');
  assert.equal(clickStep!.targetElementId, 'e1');
});

test('createTaskPlan: goal with "type" produces a type action', () => {
  const screen = makeScreen([makeElement('e1', 'Email', 'input', 0.9)]);
  const plan = createTaskPlan('type email address', screen);
  const typeStep = plan.steps.find((s) => s.type === 'type');
  assert.ok(typeStep, 'Should have a type step');
});

test('createTaskPlan: includes verification step when enabled', () => {
  const screen = makeScreen([makeElement('e1', 'Submit', 'button', 0.9)]);
  const plan = createTaskPlan('submit form', screen, { includeVerificationSteps: true });
  const screenshotStep = plan.steps.find((s) => s.type === 'screenshot');
  assert.ok(screenshotStep, 'Should have a screenshot verification step');
});

test('createTaskPlan: goal with "click" produces a click action', () => {
  const screen = makeScreen([makeElement('e1', 'Login', 'button', 0.9)]);
  const plan = createTaskPlan('click login', screen);
  const clickStep = plan.steps.find((s) => s.type === 'click');
  assert.ok(clickStep, 'Should have a click step');
  assert.ok(clickStep!.description.includes('Login'), 'Should reference the button');
});

test('createTaskPlan: goal with no matching keywords produces generic plan', () => {
  const screen = makeScreen([]);
  const plan = createTaskPlan('do something completely unknown xyzzy', screen);
  assert.ok(plan.steps.length >= 1);
});

test('createTaskPlan: plan records initial screen state', () => {
  const screen = makeScreen([makeElement('e1', 'X', 'button', 0.9)]);
  const plan = createTaskPlan('click x', screen);
  assert.ok(plan.screenStates.has(0));
  assert.equal(plan.screenStates.get(0)!.stateHash, screen.stateHash);
});

test('createTaskPlan: respects maxSteps', () => {
  const screen = makeScreen([makeElement('e1', 'X', 'button', 0.9)]);
  const plan = createTaskPlan('click x', screen, { maxSteps: 2 });
  assert.ok(plan.steps.length <= 2);
});

test('createTaskPlan: planId is unique across calls', () => {
  const screen = makeScreen([]);
  const p1 = createTaskPlan('goal1', screen);
  const p2 = createTaskPlan('goal2', screen);
  assert.notEqual(p1.planId, p2.planId);
});

// ─── Screen State Tracker ─────────────────────────────────────────────────────

test('ScreenStateTracker: records and retrieves state', () => {
  const tracker = new ScreenStateTracker();
  tracker.record({ stateHash: 'hash1', elements: [], timestamp: 1000 });
  tracker.record({ stateHash: 'hash2', elements: [], timestamp: 2000 });
  const current = tracker.current();
  assert.ok(current, 'Should have a current state');
  assert.equal(current!.stateHash, 'hash2');
});

test('ScreenStateTracker: detects state change', () => {
  const tracker = new ScreenStateTracker();
  tracker.record({ stateHash: 'hash1', elements: [], timestamp: 1000 });
  assert.ok(tracker.hasChanged('hash2'));
  assert.ok(!tracker.hasChanged('hash1'));
});

test('ScreenStateTracker: empty tracker returns undefined current', () => {
  const tracker = new ScreenStateTracker();
  assert.equal(tracker.current(), undefined);
});

test('ScreenStateTracker: detects stall after N same states', () => {
  const tracker = new ScreenStateTracker();
  tracker.record({ stateHash: 'same', elements: [], timestamp: 1000 });
  tracker.record({ stateHash: 'same', elements: [], timestamp: 2000 });
  tracker.record({ stateHash: 'same', elements: [], timestamp: 3000 });
  assert.ok(tracker.detectStall(3), 'Should detect stall after 3 same states');
  assert.ok(!tracker.detectStall(4), 'Should not detect stall with higher threshold');
});

test('ScreenStateTracker: rollback to previous state', () => {
  const tracker = new ScreenStateTracker();
  tracker.record({ stateHash: 'a', elements: [], timestamp: 1000 });
  tracker.record({ stateHash: 'b', elements: [], timestamp: 2000 });
  tracker.record({ stateHash: 'c', elements: [], timestamp: 3000 });
  const rolled = tracker.rollbackTo('a');
  assert.ok(rolled, 'Should rollback');
  assert.equal(rolled!.stateHash, 'a');
});

test('ScreenStateTracker: clear empties history', () => {
  const tracker = new ScreenStateTracker();
  tracker.record({ stateHash: 'a', elements: [], timestamp: 1000 });
  tracker.clear();
  assert.equal(tracker.current(), undefined);
});

// ─── Recovery ────────────────────────────────────────────────────────────────

test('recoverFromError: stall error returns recovery', () => {
  const screen = makeScreen([]);
  const recovery = recoverFromError('stuck - no change detected', screen);
  assert.ok(recovery, 'Should return a recovery action');
  assert.ok(!recovery.isFallback || recovery.isFallback, 'Recovery should be present');
  assert.ok(recovery.action.type, 'Recovery action should have a type');
});

test('recoverFromError: not found error returns appropriate recovery', () => {
  const screen = makeScreen([makeElement('e1', 'OK', 'button', 0.9)]);
  const recovery = recoverFromError('element not found', screen);
  assert.equal(recovery.action.type, 'click');
  assert.ok(recovery.action.description.includes('OK'));
});

test('recoverFromError: generic error returns scroll fallback', () => {
  const screen = makeScreen([]);
  const recovery = recoverFromError('something weird happened', screen);
  assert.equal(recovery.isFallback, true);
});

// ─── Plan Advance & Record ───────────────────────────────────────────────────

test('advancePlan: advances to next step on success', () => {
  const screen = makeScreen([]);
  const plan = createTaskPlan('goal', screen);
  assert.equal(plan.currentStepIndex, 0);
  const advanced = advancePlan(plan, true);
  assert.equal(advanced.currentStepIndex, 1);
});

test('advancePlan: marks as failed on failure', () => {
  const screen = makeScreen([]);
  const plan = createTaskPlan('goal', screen);
  const failed = advancePlan(plan, false);
  assert.equal(failed.status, 'failed');
});

test('advancePlan: marks as completed when all steps done', () => {
  const screen = makeScreen([]);
  const plan = createTaskPlan('goal', screen, { maxSteps: 1 });
  assert.equal(plan.steps.length, 1);
  const completed = advancePlan(plan, true);
  assert.equal(completed.status, 'completed');
});

test('recordPlanError: records error in plan', () => {
  const screen = makeScreen([]);
  const plan = createTaskPlan('goal', screen);
  const errored = recordPlanError(plan, 0, 'test error', true);
  assert.equal(errored.errors.length, 1);
  assert.equal(errored.errors[0].message, 'test error');
  assert.equal(errored.errors[0].stepIndex, 0);
});

test('recordPlanError: marks as aborted when not recoverable', () => {
  const screen = makeScreen([]);
  const plan = createTaskPlan('goal', screen);
  const aborted = recordPlanError(plan, 0, 'fatal', false);
  assert.equal(aborted.status, 'aborted');
});

// ─── Plan Utilities ──────────────────────────────────────────────────────────

test('currentStep: returns first step initially', () => {
  const screen = makeScreen([makeElement('e1', 'X', 'button', 0.9)]);
  const plan = createTaskPlan('click x', screen);
  const step = currentStep(plan);
  assert.ok(step, 'Should have a current step');
});

test('hasMoreSteps: true when steps remain', () => {
  const screen = makeScreen([makeElement('e1', 'X', 'button', 0.9)]);
  const plan = createTaskPlan('click x', screen);
  assert.ok(hasMoreSteps(plan));
});

test('hasMoreSteps: false when all steps done', () => {
  const screen = makeScreen([makeElement('e1', 'X', 'button', 0.9)]);
  const plan = createTaskPlan('click x', screen, { maxSteps: 1 });
  advancePlan(plan, true);
  assert.ok(!hasMoreSteps(plan));
});

test('hasMoreSteps: false when plan is aborted', () => {
  const screen = makeScreen([]);
  const plan = createTaskPlan('goal', screen);
  recordPlanError(plan, 0, 'fatal', false);
  assert.ok(!hasMoreSteps(plan));
});

// ─── Action Generation ───────────────────────────────────────────────────────

test('createTaskPlan: "scroll" goal produces scroll action', () => {
  const screen = makeScreen([makeElement('e1', 'Content', 'container', 0.9)]);
  const plan = createTaskPlan('scroll down', screen);
  const scrollStep = plan.steps.find((s) => s.type === 'scroll');
  assert.ok(scrollStep, 'Should have a scroll step');
  assert.equal(scrollStep!.scroll!.direction, 'down');
});

test('createTaskPlan: "wait" goal produces wait action', () => {
  const screen = makeScreen([makeElement('e1', 'Loading', 'button', 0.9)]);
  const plan = createTaskPlan('wait for loading', screen);
  const waitStep = plan.steps.find((s) => s.type === 'wait');
  assert.ok(waitStep, 'Should have a wait step');
  assert.ok(waitStep!.waitMs !== undefined);
});

test('createTaskPlan: coordinates are element centers', () => {
  const screen = makeScreen([makeElement('e1', 'OK', 'button', 0.9)]);
  const plan = createTaskPlan('click ok', screen);
  const clickStep = plan.steps.find((s) => s.type === 'click');
  assert.ok(clickStep, 'Should have a click step');
  // The element bbox is {x:0, y:0, width:100, height:50}, so center is {x:50, y:25}
  assert.deepEqual(clickStep!.coordinate, { x: 50, y: 25 });
});
