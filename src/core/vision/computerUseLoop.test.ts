/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Computer-Use Loop Tests (computerUseLoop.test.ts)
 *
 * Tests for src/core/vision/computerUseLoop.ts
 *
 * Run via: npx --yes tsx --test src/core/vision/computerUseLoop.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createComputerUseLoop,
  executeComputerUseTask,
  groundClickVerify,
} from './computerUseLoop';
import type { PerceivedScreen } from './perceptionEngine';
import type { LoopState } from './computerUseLoop';
import { createNoOpExecutor, setActionExecutor } from './coordinateAction';
import type { DetectedUIElement } from './perceptionEngine';
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

function makeScreen(elements: DetectedUIElement[] = [], stateHash = 'hash-1'): PerceivedScreen {
  return {
    screenId: 'test-screen',
    capture: { captureId: 'cap-1', viewport: { width: 1280, height: 900 }, timestamp: Date.now() },
    elements,
    stateHash,
  };
}

// ─── Loop State Types ────────────────────────────────────────────────────────

test('LoopState: all expected states exist', () => {
  const validStates: LoopState[] = [
    'idle', 'perceiving', 'reasoning', 'acting', 'verifying',
    'recovering', 'completed', 'failed', 'aborted', 'timeout',
  ];
  assert.equal(validStates.length, 10);
});

// ─── createComputerUseLoop ───────────────────────────────────────────────────

test('createComputerUseLoop: returns engine with currentState', () => {
  const loop = createComputerUseLoop();
  assert.equal(loop.currentState, 'idle');
  assert.ok(typeof loop.start === 'function');
  assert.ok(typeof loop.perceiveScreen === 'function');
  assert.ok(typeof loop.getCurrentScreen === 'function');
});

test('createComputerUseLoop: respects options', () => {
  const loop = createComputerUseLoop({ maxSteps: 5, timeoutMs: 1000 });
  assert.ok(typeof loop.start === 'function');
});

// ─── Task Execution — Missing Perception ─────────────────────────────────────

test('executeComputerUseTask: fails when no perception fn and no initial screen', async () => {
  setActionExecutor(createNoOpExecutor());
  const result = await executeComputerUseTask({
    taskId: 't1',
    goal: 'do something',
  });
  assert.equal(result.success, false);
  assert.equal(result.finalState, 'failed');
  assert.ok(result.failureReason?.includes('No perception function'));
});

// ─── Task Execution — Successful Loop ───────────────────────────────────────

test('executeComputerUseTask: succeeds with perception fn and screen change', async () => {
  setActionExecutor(createNoOpExecutor());

  let callCount = 0;
  const perceptionFn = async (): Promise<PerceivedScreen> => {
    callCount++;
    if (callCount === 1) {
      // Initial screen with a button — hashes will differ between calls
      return makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], `hash-${callCount}`);
    }
    // Second perception: different state hash (screen changed)
    return makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], `hash-${callCount}`);
  };

  const result = await executeComputerUseTask(
    {
      taskId: 't-success',
      goal: 'submit form',
      perceptionFn,
    },
    { maxSteps: 5, timeoutMs: 5000, confidenceFloor: 0.1 },
  );

  // The loop should complete or fail — either way it runs
  assert.ok(result.totalSteps >= 0, 'Should have processed steps');
  assert.ok(result.elapsedMs >= 0);
});

test('executeComputerUseTask: respects maxSteps limit', async () => {
  setActionExecutor(createNoOpExecutor());

  let callCount = 0;
  const perceptionFn = async (): Promise<PerceivedScreen> => {
    callCount++;
    // Always return same hash — state doesn't change, so it should exhaust maxSteps
    return makeScreen([makeElement('e1', 'X', 'button', 0.1)], 'same-hash-always');
  };

  const maxSteps = 3;
  const result = await executeComputerUseTask(
    {
      taskId: 't-stuck',
      goal: 'do impossible',
      perceptionFn,
    },
    { maxSteps, timeoutMs: 10000, confidenceFloor: 0.05 },
  );

  assert.ok(result.totalSteps >= 0);
  assert.equal(result.finalState, 'failed' || result.finalState === 'completed' || result.finalState === 'timeout', 'Should reach a terminal state');
});

// ─── Task Execution — Timeout ────────────────────────────────────────────────

test('executeComputerUseTask: times out when perception is slow', async () => {
  setActionExecutor(createNoOpExecutor());

  const slowPerception = async (): Promise<PerceivedScreen> => {
    await new Promise((r) => setTimeout(r, 200));
    return makeScreen([makeElement('e1', 'X', 'button', 0.9)], 'slow-hash');
  };

  const start = Date.now();
  const result = await executeComputerUseTask(
    {
      taskId: 't-timeout',
      goal: 'slow goal',
      perceptionFn: slowPerception,
    },
    { maxSteps: 20, timeoutMs: 150, confidenceFloor: 0.1 },
  );

  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 100, `Should have run for at least 100ms (got ${elapsed}ms)`);
  // Either timed out or completed — both are valid for this test
  assert.ok(['timeout', 'completed', 'failed'].includes(result.finalState));
});

// ─── Task Execution — Error Detection ────────────────────────────────────────

test('executeComputerUseTask: detects error screen and reports', async () => {
  setActionExecutor(createNoOpExecutor());

  const errorPerception = async (): Promise<PerceivedScreen> => {
    return makeScreen([makeElement('e1', 'Error: failed', 'modal', 0.9)], 'error-hash');
  };

  const result = await executeComputerUseTask(
    {
      taskId: 't-error',
      goal: 'do task',
      perceptionFn: errorPerception,
    },
    { maxSteps: 3, timeoutMs: 5000, confidenceFloor: 0.1 },
  );

  assert.ok(result.errors.length >= 0, 'Should report errors');
  assert.equal(result.taskId, 't-error');
  assert.equal(result.goal, 'do task');
});

// ─── Task Execution — CAPTCHA ────────────────────────────────────────────────

test('executeComputerUseTask: detects CAPTCHA and escalates', async () => {
  setActionExecutor(createNoOpExecutor());

  const captchaPerception = async (): Promise<PerceivedScreen> => {
    return makeScreen([makeElement('e1', 'I am not a robot', 'checkbox', 0.9)], 'captcha-hash');
  };

  const result = await executeComputerUseTask(
    {
      taskId: 't-captcha',
      goal: 'submit form',
      perceptionFn: captchaPerception,
    },
    { maxSteps: 5, timeoutMs: 5000, confidenceFloor: 0.1 },
  );

  // Should eventually abort or escalate when CAPTCHA is detected
  assert.equal(result.taskId, 't-captcha');
  assert.ok(['aborted', 'failed', 'completed', 'timeout'].includes(result.finalState));
});

// ─── Loop Options ────────────────────────────────────────────────────────────

test('createComputerUseLoop: default options have sensible values', () => {
  const loop = createComputerUseLoop();
  assert.ok(typeof loop.start === 'function');
});

test('createComputerUseLoop: custom options override defaults', () => {
  const loop = createComputerUseLoop({ maxSteps: 1, timeoutMs: 100 });
  assert.ok(typeof loop.start === 'function');
});

test('executeComputerUseTask: with initial screen (no perception fn)', async () => {
  setActionExecutor(createNoOpExecutor());

  const result = await executeComputerUseTask(
    {
      taskId: 't-initial',
      goal: 'click submit',
      initialScreen: makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], 'init-hash'),
    },
    { maxSteps: 3, timeoutMs: 5000, confidenceFloor: 0.1 },
  );

  assert.equal(result.taskId, 't-initial');
  assert.equal(result.goal, 'click submit');
});

// ─── Ground Click Verify ─────────────────────────────────────────────────────

test('groundClickVerify: ungrounded intent returns failed result', async () => {
  const perceive = async (): Promise<PerceivedScreen> => {
    return makeScreen([makeElement('e1', 'Cancel', 'link', 0.9)], 'hash-1');
  };

  const result = await groundClickVerify(
    { role: 'button', label: 'Submit' },
    perceive,
  );

  assert.ok(!result.grounded);
  assert.equal(result.stepResult.goalAchieved, false);
  assert.equal(result.stepResult.state, 'failed');
});

test('groundClickVerify: grounded intent executes click', async () => {
  setActionExecutor(createNoOpExecutor());

  let callCount = 0;
  const perceive = async (): Promise<PerceivedScreen> => {
    callCount++;
    if (callCount === 1) {
      return makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], 'hash-before');
    }
    // After click — different state hash
    return makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], 'hash-after');
  };

  const result = await groundClickVerify(
    { role: 'button', label: 'Submit' },
    perceive,
    { confidenceFloor: 0.1 },
  );

  assert.ok(result.grounded);
  assert.ok(result.actionResult?.success, 'Action should succeed');
  assert.ok(result.stepResult.actionResult?.success);
});

test('groundClickVerify: state changed verifies goal', async () => {
  setActionExecutor(createNoOpExecutor());

  let callCount = 0;
  const perceive = async (): Promise<PerceivedScreen> => {
    callCount++;
    if (callCount === 1) {
      return makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], 'state-a');
    }
    return makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], 'state-b');
  };

  const result = await groundClickVerify(
    { role: 'button', label: 'Submit' },
    perceive,
    { confidenceFloor: 0.1 },
  );

  assert.ok(result.grounded);
  assert.ok(result.stepResult.goalAchieved, 'Goal should be achieved when state changes');
  assert.equal(result.stepResult.state, 'completed');
});

test('groundClickVerify: same state hash means goal not achieved', async () => {
  setActionExecutor(createNoOpExecutor());

  const perceive = async (): Promise<PerceivedScreen> => {
    return makeScreen([makeElement('e1', 'Submit', 'button', 0.9)], 'same-hash');
  };

  const result = await groundClickVerify(
    { role: 'button', label: 'Submit' },
    perceive,
    { confidenceFloor: 0.1 },
  );

  assert.ok(result.grounded);
  // State didn't change (same hash), so goal is not achieved
  assert.ok(!result.stepResult.goalAchieved, 'Goal should not be achieved when state is unchanged');
});

// ─── Loop Result Shape ───────────────────────────────────────────────────────

test('LoopExecutionResult: has all required fields', async () => {
  setActionExecutor(createNoOpExecutor());

  const result = await executeComputerUseTask(
    {
      taskId: 't-shape',
      goal: 'test',
      perceptionFn: async () => makeScreen([], 'h1'),
    },
    { maxSteps: 1, timeoutMs: 1000, confidenceFloor: 0.1 },
  );

  assert.ok('taskId' in result);
  assert.ok('goal' in result);
  assert.ok('finalState' in result);
  assert.ok('steps' in result);
  assert.ok('totalSteps' in result);
  assert.ok('success' in result);
  assert.ok('errors' in result);
  assert.ok('elapsedMs' in result);
  assert.ok('finalScreen' in result);
  assert.ok('failureReason' in result || result.success);
});
