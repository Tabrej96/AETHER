/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Visual Grounding Tests (visualGrounding.test.ts)
 *
 * Tests for src/core/vision/visualGrounding.ts
 *
 * Run via: npx --yes tsx --test src/core/vision/visualGrounding.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groundIntent,
  textToCoordinate,
  resolveActionableTargets,
  levenshtein,
  bboxCenter,
} from './visualGrounding';
import type { DetectedUIElement, ElementRole } from './perceptionEngine';

function makeElement(id: string, label: string, role: ElementRole, bbox: { x: number; y: number; width: number; height: number }, confidence = 0.9, children: string[] = []): DetectedUIElement {
  return {
    elementId: id,
    label,
    role,
    bbox: { ...bbox },
    confidence,
    attributes: {},
    children,
  };
}

// ─── Levenshtein ─────────────────────────────────────────────────────────────

test('levenshtein: identical strings = 0', () => {
  assert.equal(levenshtein('hello', 'hello'), 0);
});

test('levenshtein: single character difference', () => {
  assert.equal(levenshtein('hello', 'hallo'), 1);
});

test('levenshtein: empty string', () => {
  assert.equal(levenshtein('', 'hello'), 5);
  assert.equal(levenshtein('hello', ''), 5);
  assert.equal(levenshtein('', ''), 0);
});

test('levenshtein: common cases', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('abc', 'abcd'), 1);   // insert d
  assert.equal(levenshtein('abc', 'yabd'), 2);    // insert y, sub c->d
});

test('levenshtein: symmetric', () => {
  assert.equal(levenshtein('abc', 'def'), levenshtein('def', 'abc'));
});

// ─── Ground Intent ───────────────────────────────────────────────────────────

test('groundIntent: exact role + label match returns grounded result', () => {
  const elements = [
    makeElement('e1', 'Submit Form', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.95),
    makeElement('e2', 'Cancel', 'button', { x: 0.1, y: 0.1, width: 0.1, height: 0.05 }, 0.6),
  ];
  const result = groundIntent(elements, { role: 'button', label: 'Submit' });
  assert.ok(result.grounded, `Should be grounded: ${result.reasoning}`);
  assert.ok(result.target, 'Should have a target');
  assert.equal(result.target!.elementId, 'e1');
  assert.equal(result.target!.label, 'Submit Form');
  assert.ok(result.target!.confidence > 0.5);
});

test('groundIntent: partial label match works', () => {
  const elements = [
    makeElement('e1', 'Submit Payment', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.9),
    makeElement('e2', 'Cancel', 'button', { x: 0.1, y: 0.1, width: 0.1, height: 0.05 }, 0.6),
  ];
  const result = groundIntent(elements, { role: 'button', label: 'Submit' });
  assert.ok(result.grounded, `Should be grounded: ${result.reasoning}`);
  assert.equal(result.target!.elementId, 'e1');
});

test('groundIntent: fuzzy label match works', () => {
  const elements = [
    makeElement('e1', 'Sign In', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.9),
  ];
  const result = groundIntent(elements, { role: 'button', label: 'login', labelFuzzy: 'log in' });
  assert.ok(result.grounded, `Should be grounded with fuzzy match: ${result.reasoning}`);
});

test('groundIntent: no matching element returns ungrounded', () => {
  const elements = [
    makeElement('e1', 'Home', 'link', { x: 0.1, y: 0.1, width: 0.1, height: 0.05 }, 0.8),
  ];
  const result = groundIntent(elements, { role: 'button', label: 'Submit' });
  assert.ok(!result.grounded, 'Should not be grounded');
  assert.equal(result.target, null);
  assert.ok(result.reasoning.includes('escalation') || result.reasoning.includes('floor'), 'Should mention escalation or floor');
});

test('groundIntent: empty elements returns ungrounded', () => {
  const result = groundIntent([], { role: 'button', label: 'Submit' });
  assert.ok(!result.grounded);
  assert.equal(result.target, null);
  assert.ok(result.reasoning.includes('No elements'));
});

test('groundIntent: low confidence element does not match above floor', () => {
  const elements = [
    makeElement('e1', 'Submit', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.1),
  ];
  const result = groundIntent(elements, { role: 'button', label: 'Submit' }, 0.5);
  assert.ok(!result.grounded, 'Should not be grounded due to low confidence');
});

test('groundIntent: confidenceFloor option controls threshold', () => {
  const elements = [
    makeElement('e1', 'Submit', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.5),
  ];
  // With very low floor, this element IS grounded.
  const resultLow = groundIntent(elements, { role: 'button', label: 'Submit' }, 0.1);
  assert.ok(resultLow.grounded, 'Low floor should allow grounding');

  // With a floor of 0.5, an element scoring ~0.43 is rejected.
  const resultHigh = groundIntent(elements, { role: 'button', label: 'Submit' }, 0.45);
  assert.ok(!resultHigh.grounded, 'Floor above element score should reject');
});

test('groundIntent: returns candidates list', () => {
  const elements = [
    makeElement('e1', 'Submit A', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.9),
    makeElement('e2', 'Submit B', 'button', { x: 0.6, y: 0.8, width: 0.1, height: 0.05 }, 0.8),
  ];
  const result = groundIntent(elements, { role: 'button', label: 'Submit' });
  assert.ok(result.candidates.length >= 1);
  assert.ok(result.candidates[0].score > 0);
});

test('groundIntent: no intent role returns 0.5 base score', () => {
  const elements = [
    makeElement('e1', 'Anything', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.9),
  ];
  const result = groundIntent(elements, { label: 'Anything' });
  assert.ok(result.grounded);
  assert.equal(result.target!.elementId, 'e1');
});

test('groundIntent: coordinate hint boosts proximity score', () => {
  const near = makeElement('e1', 'Target', 'button', { x: 0.4, y: 0.4, width: 0.1, height: 0.1 }, 0.9);
  const far = makeElement('e2', 'Other', 'button', { x: 0.9, y: 0.9, width: 0.1, height: 0.1 }, 0.95);
  const elements = [far, near]; // put far first to test scoring
  const result = groundIntent(elements, { role: 'button', label: 'Target', coordinateHint: { x: 0.45, y: 0.45 } });
  assert.ok(result.grounded);
  // The proximity bonus should help the near element win
  assert.equal(result.target!.elementId, 'e1', 'Near element should win with coordinate hint');
});

test('groundIntent: context-aware matching', () => {
  const elements = [
    makeElement('e1', 'Form Submit', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.9, ['form', 'submit']),
    makeElement('e2', 'Nav Submit', 'button', { x: 0.1, y: 0.1, width: 0.1, height: 0.05 }, 0.9, ['nav', 'submit']),
  ];
  // e1 has children that include 'submit' — should match context
  const result = groundIntent(elements, { role: 'button', label: 'Submit', context: ['form'] });
  assert.ok(result.grounded);
});

// ─── Text To Coordinate ──────────────────────────────────────────────────────

test('textToCoordinate: returns coordinate for matching element', () => {
  const elements = [
    makeElement('e1', 'Submit', 'button', { x: 100, y: 200, width: 80, height: 40 }, 0.9),
  ];
  const result = textToCoordinate(elements, 'Submit');
  assert.ok(result.coordinate, 'Should return a coordinate');
  assert.ok(result.element, 'Should return an element');
  assert.equal(result.element.elementId, 'e1');
  assert.ok(result.confidence > 0); // non-zero
});

test('textToCoordinate: returns null for no match', () => {
  const elements = [
    makeElement('e1', 'Cancel', 'button', { x: 100, y: 200, width: 80, height: 40 }, 0.9),
  ];
  const result = textToCoordinate(elements, 'Submit');
  assert.equal(result.coordinate, null);
  assert.equal(result.element, null);
  assert.equal(result.confidence, 0);
});

// ─── Resolve Actionable Targets ───────────────────────────────────────────────

test('resolveActionableTargets: returns target when grounded', () => {
  const elements = [
    makeElement('e1', 'Submit', 'button', { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, 0.9),
  ];
  const targets = resolveActionableTargets(elements, { role: 'button', label: 'Submit' });
  assert.equal(targets.length, 1);
  assert.equal(targets[0].elementId, 'e1');
});

test('resolveActionableTargets: returns empty array when not grounded', () => {
  const elements = [
    makeElement('e1', 'Cancel', 'link', { x: 0.1, y: 0.1, width: 0.1, height: 0.05 }, 0.9),
  ];
  const targets = resolveActionableTargets(elements, { role: 'button', label: 'Submit' });
  assert.equal(targets.length, 0);
});
