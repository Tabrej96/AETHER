/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Coordinate Action Tests (coordinateAction.test.ts)
 *
 * Tests for src/core/vision/coordinateAction.ts
 *
 * Run via: npx --yes tsx --test src/core/vision/coordinateAction.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizedToPixel,
  pixelToNormalized,
  clampCoordinate,
  bboxCenter,
  isInBbox,
  createNoOpExecutor,
  setActionExecutor,
  getActionExecutor,
  executeAction,
  executeActionSequence,
  safetyCheck,
  DEFAULT_SAFETY_GATE,
  clickAt,
  clickOnElement,
  typeAt,
  scrollBy,
  drag,
  waitFor,
} from './coordinateAction';
import type { CoordinateAction, ClickAction, TypeAction, ScrollAction, DragAction, WaitAction } from './coordinateAction';

// ─── Coordinate Utilities ─────────────────────────────────────────────────────

test('normalizedToPixel: converts [0,1] to pixel coords', () => {
  const pixel = normalizedToPixel({ x: 0.5, y: 0.5 }, { width: 1280, height: 900 });
  assert.deepEqual(pixel, { x: 640, y: 450 });
});

test('normalizedToPixel: handles edge values', () => {
  assert.deepEqual(normalizedToPixel({ x: 0, y: 0 }, { width: 800, height: 600 }), { x: 0, y: 0 });
  assert.deepEqual(normalizedToPixel({ x: 1, y: 1 }, { width: 800, height: 600 }), { x: 800, y: 600 });
});

test('pixelToNormalized: converts pixel to [0,1]', () => {
  const norm = pixelToNormalized({ x: 640, y: 450 }, { width: 1280, height: 900 });
  assert.ok(Math.abs(norm.x - 0.5) < 0.001);
  assert.ok(Math.abs(norm.y - 0.5) < 0.001);
});

test('pixelToNormalized: round-trip with normalizedToPixel', () => {
  const viewport = { width: 1920, height: 1080 };
  const original = { x: 0.3, y: 0.7 };
  const pixel = normalizedToPixel(original, viewport);
  const roundTrip = pixelToNormalized(pixel, viewport);
  assert.ok(Math.abs(roundTrip.x - original.x) < 0.001);
  assert.ok(Math.abs(roundTrip.y - original.y) < 0.001);
});

test('clampCoordinate: clamps within viewport', () => {
  const clamped = clampCoordinate({ x: -50, y: 2000 }, { width: 1280, height: 900 });
  assert.equal(clamped.x, 0);
  assert.equal(clamped.y, 900);
});

test('clampCoordinate: valid coordinates unchanged', () => {
  const clamped = clampCoordinate({ x: 100, y: 200 }, { width: 1280, height: 900 });
  assert.deepEqual(clamped, { x: 100, y: 200 });
});

test('bboxCenter: returns center of bbox', () => {
  assert.deepEqual(bboxCenter({ x: 0, y: 0, width: 100, height: 50 }), { x: 50, y: 25 });
});

test('isInBbox: point inside', () => {
  assert.ok(isInBbox({ x: 50, y: 25 }, { x: 0, y: 0, width: 100, height: 50 }));
});

test('isInBbox: point outside', () => {
  assert.ok(!isInBbox({ x: 200, y: 25 }, { x: 0, y: 0, width: 100, height: 50 }));
});

test('isInBbox: point on edge', () => {
  assert.ok(isInBbox({ x: 100, y: 25 }, { x: 0, y: 0, width: 100, height: 50 }));
  assert.ok(isInBbox({ x: 0, y: 0 }, { x: 0, y: 0, width: 100, height: 50 }));
});

// ─── No-Op Executor ──────────────────────────────────────────────────────────

test('createNoOpExecutor: click changes state hash', async () => {
  const executor = createNoOpExecutor();
  const h1 = await executor.getCurrentStateHash();
  await executor.click({ x: 100, y: 200 });
  const h2 = await executor.getCurrentStateHash();
  assert.notEqual(h1, h2);
});

test('createNoOpExecutor: type changes state hash', async () => {
  const executor = createNoOpExecutor();
  const h1 = await executor.getCurrentStateHash();
  await executor.type({ x: 100, y: 200 }, 'hello');
  const h2 = await executor.getCurrentStateHash();
  assert.notEqual(h1, h2);
});

test('createNoOpExecutor: scroll changes state hash', async () => {
  const executor = createNoOpExecutor();
  const h1 = await executor.getCurrentStateHash();
  await executor.scroll({ x: 100, y: 200 }, 'down', 300);
  const h2 = await executor.getCurrentStateHash();
  assert.notEqual(h1, h2);
});

test('createNoOpExecutor: viewport returns defaults', async () => {
  const executor = createNoOpExecutor();
  const vp = await executor.getViewport();
  assert.equal(vp.width, 1280);
  assert.equal(vp.height, 900);
});

// ─── Action Builder Helpers ──────────────────────────────────────────────────

test('clickAt: builds click action', () => {
  const action = clickAt({ x: 100, y: 200 });
  assert.equal(action.type, 'click');
  assert.deepEqual(action.coordinate, { x: 100, y: 200 });
  assert.equal(action.button, 'left');
  assert.equal(action.clickCount, 1);
});

test('clickAt: supports right-click', () => {
  const action = clickAt({ x: 100, y: 200 }, 'right', 2);
  assert.equal(action.button, 'right');
  assert.equal(action.clickCount, 2);
});

test('clickOnElement: builds click at bbox center', () => {
  const action = clickOnElement({ x: 100, y: 200, width: 80, height: 40 });
  assert.deepEqual(action.coordinate, { x: 140, y: 220 });
});

test('typeAt: builds type action', () => {
  const action = typeAt({ x: 100, y: 200 }, 'hello', { submit: true, clear: true });
  assert.equal(action.type, 'type');
  assert.equal(action.text, 'hello');
  assert.equal(action.submit, true);
  assert.equal(action.clear, true);
});

test('scrollBy: builds scroll action', () => {
  const action = scrollBy('down', 300, { x: 100, y: 200 });
  assert.equal(action.type, 'scroll');
  assert.equal(action.direction, 'down');
  assert.equal(action.amount, 300);
});

test('scrollBy: optional coordinate', () => {
  const action = scrollBy('up', 200);
  assert.equal(action.type, 'scroll');
  assert.equal(action.direction, 'up');
  assert.equal(action.amount, 200);
  assert.equal(action.coordinate, undefined);
});

test('drag: builds drag action', () => {
  const action = drag({ x: 0, y: 0 }, { x: 100, y: 100 }, 500);
  assert.equal(action.type, 'drag');
  assert.deepEqual(action.start, { x: 0, y: 0 });
  assert.deepEqual(action.end, { x: 100, y: 100 });
  assert.equal(action.holdDurationMs, 500);
});

test('waitFor: builds wait action', () => {
  const action = waitFor(1000, 'loading');
  assert.equal(action.type, 'wait');
  assert.equal(action.durationMs, 1000);
  assert.equal(action.reason, 'loading');
});

// ─── Action Execution ────────────────────────────────────────────────────────

test('executeAction: click succeeds with no-op executor', async () => {
  setActionExecutor(createNoOpExecutor());
  const result = await executeAction(clickAt({ x: 100, y: 200 }));
  assert.ok(result.success);
  assert.ok(result.executed);
  assert.ok(result.stateBefore !== result.stateAfter);
});

test('executeAction: type succeeds', async () => {
  setActionExecutor(createNoOpExecutor());
  const result = await executeAction(typeAt({ x: 100, y: 200 }, 'test'));
  assert.ok(result.success);
  assert.ok(result.executed);
});

test('executeAction: wait succeeds', async () => {
  setActionExecutor(createNoOpExecutor());
  const start = Date.now();
  const result = await executeAction(waitFor(50));
  assert.ok(result.success);
  assert.ok(Date.now() - start >= 50, 'Should have waited at least 50ms');
});

test('executeAction: returns error on executor failure', async () => {
  const failingExecutor = {
    click: async () => { throw new Error('click failed'); },
    type: async () => {},
    scroll: async () => {},
    drag: async () => {},
    pan: async () => {},
    getCurrentStateHash: async () => 'h1',
    getViewport: async () => ({ width: 1280, height: 900 }),
  };
  setActionExecutor(failingExecutor);
  const result = await executeAction(clickAt({ x: 0, y: 0 }));
  assert.ok(!result.success);
  assert.ok(!result.executed);
  assert.ok(result.error?.includes('click failed'));
});

test('executeActionSequence: executes all actions', async () => {
  setActionExecutor(createNoOpExecutor());
  const results = await executeActionSequence([
    clickAt({ x: 10, y: 10 }),
    clickAt({ x: 20, y: 20 }),
  ]);
  assert.equal(results.length, 2);
  assert.ok(results.every((r) => r.success));
});

test('executeActionSequence: stops on first failure', async () => {
  const failingExecutor = {
    click: async () => { throw new Error('fail'); },
    type: async () => {},
    scroll: async () => {},
    drag: async () => {},
    pan: async () => {},
    getCurrentStateHash: async () => 'h1',
    getViewport: async () => ({ width: 1280, height: 900 }),
  };
  setActionExecutor(failingExecutor);
  const results = await executeActionSequence([
    clickAt({ x: 10, y: 10 }),
    clickAt({ x: 20, y: 20 }),
  ]);
  assert.equal(results.length, 1);
  assert.ok(!results[0].success);
});

// ─── Safety Gate ─────────────────────────────────────────────────────────────

test('safetyCheck: passes for safe actions', () => {
  const result = safetyCheck(clickAt({ x: 100, y: 100 }), DEFAULT_SAFETY_GATE);
  assert.ok(result.safe);
});

test('safetyCheck: blocks right-click without allowDestructive', () => {
  const action: ClickAction = { type: 'click', coordinate: { x: 100, y: 100 }, button: 'right' };
  const result = safetyCheck(action, DEFAULT_SAFETY_GATE);
  assert.ok(!result.safe);
  assert.ok(result.reason?.includes('Destructive'));
});

test('safetyCheck: blocks drag without allowDestructive', () => {
  const action: DragAction = { type: 'drag', start: { x: 0, y: 0 }, end: { x: 100, y: 100 } };
  const result = safetyCheck(action, DEFAULT_SAFETY_GATE);
  assert.ok(!result.safe);
});

test('safetyCheck: passes drag with allowDestructive', () => {
  const gate = { ...DEFAULT_SAFETY_GATE, allowDestructive: true };
  const action: DragAction = { type: 'drag', start: { x: 0, y: 0 }, end: { x: 100, y: 100 } };
  const result = safetyCheck(action, gate);
  assert.ok(result.safe);
});

test('safetyCheck: passes left-click', () => {
  const action: ClickAction = { type: 'click', coordinate: { x: 100, y: 100 }, button: 'left' };
  const result = safetyCheck(action, DEFAULT_SAFETY_GATE);
  assert.ok(result.safe);
});

// ─── Executor Management ─────────────────────────────────────────────────────

test('setActionExecutor / getActionExecutor: sets and retrieves executor', () => {
  const executor = createNoOpExecutor();
  setActionExecutor(executor);
  assert.equal(getActionExecutor(), executor);
});
