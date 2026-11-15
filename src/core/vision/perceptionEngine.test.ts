/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Perception Engine Tests (perceptionEngine.test.ts)
 *
 * Tests for src/core/vision/perceptionEngine.ts
 *
 * Run via: npx --yes tsx --test src/core/vision/perceptionEngine.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyElement,
  bboxCenter,
  bboxArea,
  bboxIntersection,
  bboxIOU,
  computeStateHash,
  deduplicateElements,
  structureOCRBlocks,
  createPerceptionEngine,
  perceiveWithProviders,
  DEFAULT_PERCEPTION_CONFIG,
  setElementProvider,
  setOCRProvider,
} from './perceptionEngine';
import type { DetectedUIElement } from './perceptionEngine';

// ─── Element Classification ──────────────────────────────────────────────────

test('classifyElement: standard HTML tags', () => {
  assert.equal(classifyElement('button'), 'button');
  assert.equal(classifyElement('a'), 'link');
  assert.equal(classifyElement('h1'), 'heading');
  assert.equal(classifyElement('img'), 'image');
  assert.equal(classifyElement('nav'), 'navigation');
  assert.equal(classifyElement('div'), 'container');
  assert.equal(classifyElement('span'), 'text');
  assert.equal(classifyElement('input', 'text'), 'textbox');
  assert.equal(classifyElement('input', 'checkbox'), 'checkbox');
  assert.equal(classifyElement('input', 'radio'), 'radio');
  assert.equal(classifyElement('textarea'), 'textbox');
  assert.equal(classifyElement('select'), 'dropdown');
});

test('classifyElement: unknown ARIA roles fall through to tag mapping', () => {
  assert.equal(classifyElement('div', 'bogus-role'), 'container');
});

test('classifyElement: input type defaults to textbox when no type given', () => {
  assert.equal(classifyElement('input'), 'textbox');
});

test('classifyElement: unknown tags map to unknown', () => {
  assert.equal(classifyElement('custom-tag'), 'unknown');
});

test('classifyElement: heading levels map to heading', () => {
  for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
    assert.equal(classifyElement(level), 'heading', `${level} should be heading`);
  }
});

// ─── Bounding Box Utilities ──────────────────────────────────────────────────

test('bboxCenter: returns center of bbox', () => {
  const center = bboxCenter({ x: 0, y: 0, width: 100, height: 50 });
  assert.deepEqual(center, { x: 50, y: 25 });
});

test('bboxCenter: handles negative coordinates', () => {
  const center = bboxCenter({ x: -10, y: -20, width: 100, height: 60 });
  assert.deepEqual(center, { x: 40, y: 10 });
});

test('bboxArea: positive area for valid bbox', () => {
  assert.equal(bboxArea({ x: 0, y: 0, width: 10, height: 20 }), 200);
});

test('bboxArea: zero for zero-size bbox', () => {
  assert.equal(bboxArea({ x: 0, y: 0, width: 0, height: 10 }), 0);
  assert.equal(bboxArea({ x: 0, y: 0, width: 10, height: 0 }), 0);
});

test('bboxArea: negative dimensions clamped to 0', () => {
  assert.equal(bboxArea({ x: 0, y: 0, width: -10, height: 20 }), 0);
});

test('bboxIntersection: overlapping boxes', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  const b = { x: 50, y: 50, width: 100, height: 100 };
  assert.equal(bboxIntersection(a, b), 2500); // 50x50 overlap
});

test('bboxIntersection: non-overlapping boxes', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  const b = { x: 200, y: 200, width: 100, height: 100 };
  assert.equal(bboxIntersection(a, b), 0);
});

test('bboxIntersection: adjacent boxes', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  const b = { x: 100, y: 0, width: 100, height: 100 };
  assert.equal(bboxIntersection(a, b), 0);
});

test('bboxIntersection: one box contained within another', () => {
  const a = { x: 0, y: 0, width: 200, height: 200 };
  const b = { x: 50, y: 50, width: 50, height: 50 };
  assert.equal(bboxIntersection(a, b), 2500);
});

test('bboxIOU: identical boxes = 1.0', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  assert.equal(bboxIOU(a, a), 1);
});

test('bboxIOU: non-overlapping = 0', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  const b = { x: 200, y: 200, width: 100, height: 100 };
  assert.equal(bboxIOU(a, b), 0);
});

test('bboxIOU: partial overlap', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  const b = { x: 50, y: 50, width: 100, height: 100 };
  // intersection = 2500, union = 10000 + 10000 - 2500 = 17500
  const iou = 2500 / 17500;
  assert.ok(Math.abs(bboxIOU(a, b) - iou) < 0.001);
});

// ─── State Hash ──────────────────────────────────────────────────────────────

test('computeStateHash: empty elements = empty-screen', () => {
  assert.equal(computeStateHash([]), 'empty-screen');
});

test('computeStateHash: deterministic — same elements produce same hash', () => {
  const elements: DetectedUIElement[] = [
    { elementId: 'e1', label: 'Submit', role: 'button', bbox: { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, confidence: 0.9, attributes: {}, children: [] },
  ];
  const h1 = computeStateHash(elements);
  const h2 = computeStateHash(elements);
  assert.equal(h1, h2);
});

test('computeStateHash: different elements produce different hashes', () => {
  const a: DetectedUIElement[] = [
    { elementId: 'e1', label: 'Submit', role: 'button', bbox: { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, confidence: 0.9, attributes: {}, children: [] },
  ];
  const b: DetectedUIElement[] = [
    { elementId: 'e2', label: 'Cancel', role: 'button', bbox: { x: 0.5, y: 0.8, width: 0.1, height: 0.05 }, confidence: 0.9, attributes: {}, children: [] },
  ];
  assert.notEqual(computeStateHash(a), computeStateHash(b));
});

test('computeStateHash: hash is stable across calls', () => {
  const elements: DetectedUIElement[] = [
    { elementId: 'e1', label: 'A', role: 'button', bbox: { x: 0, y: 0, width: 100, height: 50 }, confidence: 0.8, attributes: {}, children: [] },
    { elementId: 'e2', label: 'B', role: 'input', bbox: { x: 10, y: 60, width: 200, height: 30 }, confidence: 0.9, attributes: {}, children: [] },
  ];
  const h1 = computeStateHash(elements);
  const h2 = computeStateHash(elements);
  const h3 = computeStateHash(elements);
  assert.equal(h1, h2);
  assert.equal(h2, h3);
});

// ─── Deduplication ───────────────────────────────────────────────────────────

test('deduplicateElements: removes overlapping elements, keeps higher confidence', () => {
  const elements: DetectedUIElement[] = [
    { elementId: 'e1', label: 'Btn', role: 'button', bbox: { x: 0, y: 0, width: 100, height: 50 }, confidence: 0.5, attributes: {}, children: [] },
    { elementId: 'e2', label: 'Btn', role: 'button', bbox: { x: 5, y: 5, width: 100, height: 50 }, confidence: 0.9, attributes: {}, children: [] },
  ];
  const result = deduplicateElements(elements);
  assert.equal(result.length, 1);
  assert.equal(result[0].elementId, 'e2'); // kept the higher-confidence one
});

test('deduplicateElements: keeps non-overlapping elements', () => {
  const elements: DetectedUIElement[] = [
    { elementId: 'e1', label: 'A', role: 'button', bbox: { x: 0, y: 0, width: 100, height: 50 }, confidence: 0.8, attributes: {}, children: [] },
    { elementId: 'e2', label: 'B', role: 'button', bbox: { x: 200, y: 0, width: 100, height: 50 }, confidence: 0.9, attributes: {}, children: [] },
  ];
  const result = deduplicateElements(elements);
  assert.equal(result.length, 2);
});

test('deduplicateElements: empty input returns empty', () => {
  assert.deepEqual(deduplicateElements([]), []);
});

test('deduplicateElements: single element returned as-is', () => {
  const elements: DetectedUIElement[] = [
    { elementId: 'e1', label: 'A', role: 'button', bbox: { x: 0, y: 0, width: 100, height: 50 }, confidence: 0.5, attributes: {}, children: [] },
  ];
  const result = deduplicateElements(elements);
  assert.equal(result.length, 1);
});

test('deduplicateElements: respects custom iou threshold', () => {
  const elements: DetectedUIElement[] = [
    { elementId: 'e1', label: 'A', role: 'button', bbox: { x: 0, y: 0, width: 100, height: 100 }, confidence: 0.5, attributes: {}, children: [] },
    { elementId: 'e2', label: 'B', role: 'button', bbox: { x: 90, y: 90, width: 100, height: 100 }, confidence: 0.9, attributes: {}, children: [] },
  ];
  // With a high threshold, they should be kept (low IOU).
  const result = deduplicateElements(elements, 0.9);
  assert.equal(result.length, 2);
});

// ─── OCR Blocks ──────────────────────────────────────────────────────────────

test('structureOCRBlocks: structures raw OCR output', () => {
  const raw = [
    { text: 'Hello', bbox: { x: 0, y: 0, width: 50, height: 20 }, confidence: 0.85 },
    { text: 'World', bbox: { x: 60, y: 0, width: 50, height: 20 }, confidence: 0.92 },
  ];
  const blocks = structureOCRBlocks(raw, 'en');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].blockId, 'ocr-1');
  assert.equal(blocks[0].text, 'Hello');
  assert.equal(blocks[0].languageHint, 'en');
  assert.equal(blocks[1].blockId, 'ocr-2');
});

test('structureOCRBlocks: empty input returns empty', () => {
  assert.deepEqual(structureOCRBlocks([]), []);
});

test('structureOCRBlocks: without language hint', () => {
  const raw = [{ text: 'X', bbox: { x: 0, y: 0, width: 10, height: 10 }, confidence: 0.7 }];
  const blocks = structureOCRBlocks(raw);
  assert.equal(blocks[0].languageHint, undefined);
});

// ─── Perception Engine ───────────────────────────────────────────────────────

test('createPerceptionEngine: returns an engine with perceive method', async () => {
  const engine = createPerceptionEngine();
  assert.ok(typeof engine.perceive === 'function');
  assert.ok(typeof engine.captureScreen === 'function');
});

test('createPerceptionEngine: perceive returns empty screen without providers', async () => {
  const engine = createPerceptionEngine();
  const capture = { captureId: 'test-cap', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
  const screen = await engine.perceive(capture);
  assert.ok(screen.screenId.startsWith('scr-'));
  assert.equal(screen.elements.length, 0);
  assert.ok(screen.stateHash.startsWith('s-') || screen.stateHash === 'empty-screen');
});

test('perceiveWithProviders: uses element provider', async () => {
  const mockElements = [
    { tag: 'button', id: 'btn1', role: 'button', ariaLabel: 'Submit', text: 'Submit', boundingBox: { x: 100, y: 200, width: 80, height: 40 }, cssSelector: '#btn1' },
  ];

  setElementProvider(async () => mockElements as any);
  setOCRProvider(async () => []);

  try {
    const capture = { captureId: 'test', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
    const screen = await perceiveWithProviders(capture);

    assert.ok(screen.elements.length > 0, 'Should have detected elements');
    assert.equal(screen.elements[0].elementId, 'el-btn1');
    assert.equal(screen.elements[0].role, 'button');
    assert.equal(screen.elements[0].label, 'Submit');
  } finally {
    setElementProvider(async () => []);
    setOCRProvider(async () => []);
  }
});

test('perceiveWithProviders: filters by confidence', async () => {
  const mockElements = [
    { tag: 'div', role: 'unknown', boundingBox: { x: 0, y: 0, width: 10, height: 10 } },
  ];

  setElementProvider(async () => mockElements as any);
  try {
    const highThresholdConfig = { minConfidence: 0.99, iouDedupThreshold: 0.6, enableHeuristicClassification: true };
    const capture = { captureId: 'test', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
    const screen = await perceiveWithProviders(capture, highThresholdConfig);

    // Elements from accessibility tree have confidence 0.85 by default, so with 0.99 floor they should be filtered out.
    assert.equal(screen.elements.length, 0, 'High confidence floor should filter out low-confidence elements');
  } finally {
    setElementProvider(async () => []);
  }
});

test('perceiveWithProviders: deduplicates overlapping elements', async () => {
  const mockElements = [
    { tag: 'button', id: 'a', role: 'button', boundingBox: { x: 0, y: 0, width: 100, height: 50 } },
    { tag: 'button', id: 'b', role: 'button', boundingBox: { x: 5, y: 5, width: 100, height: 50 } },
  ];

  setElementProvider(async () => mockElements as any);
  try {
    const capture = { captureId: 'test', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
    const screen = await perceiveWithProviders(capture);

    assert.equal(screen.elements.length, 1, 'Overlapping elements should be deduplicated');
  } finally {
    setElementProvider(async () => []);
  }
});

test('perceiveWithProviders: OCR blocks are added as text elements when not overlapping', async () => {
  const mockElements: any[] = [];
  const mockOCR = [
    { text: 'Hello', bbox: { x: 0, y: 0, width: 50, height: 20 }, confidence: 0.85 },
  ];

  setElementProvider(async () => mockElements);
  setOCRProvider(async () => mockOCR);

  try {
    const capture = { captureId: 'test', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
    const screen = await perceiveWithProviders(capture);

    assert.equal(screen.elements.length, 1, 'OCR text element should be added');
    assert.equal(screen.elements[0].role, 'text');
    assert.equal(screen.elements[0].label, 'Hello');
    assert.ok(screen.ocrBlocks, 'OCR blocks should be present');
    assert.equal(screen.ocrBlocks!.length, 1);
  } finally {
    setElementProvider(async () => []);
    setOCRProvider(async () => []);
  }
});

test('perceiveWithProviders: provider failure is non-fatal', async () => {
  setElementProvider(async () => {
    throw new Error('Provider failed');
  });
  try {
    const capture = { captureId: 'test', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
    const screen = await perceiveWithProviders(capture);

    assert.ok(screen.screenId.startsWith('scr-'));
    assert.equal(screen.elements.length, 0, 'Should return empty screen on provider failure');
  } finally {
    setElementProvider(async () => []);
  }
});

test('DEFAULT_PERCEPTION_CONFIG: has sensible defaults', () => {
  assert.equal(DEFAULT_PERCEPTION_CONFIG.minConfidence, 0.3);
  assert.equal(DEFAULT_PERCEPTION_CONFIG.iouDedupThreshold, 0.6);
  assert.equal(DEFAULT_PERCEPTION_CONFIG.enableHeuristicClassification, true);
});

test('perceiveWithProviders: parent-child relationships via containment', async () => {
  const mockElements = [
    { tag: 'section', id: 'parent', role: 'region', boundingBox: { x: 0, y: 0, width: 400, height: 300 } },
    { tag: 'button', id: 'child', role: 'button', text: 'Click me', boundingBox: { x: 50, y: 50, width: 80, height: 40 } },
  ];

  setElementProvider(async () => mockElements as any);
  try {
    const capture = { captureId: 'test', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
    const screen = await perceiveWithProviders(capture);

    const parentEl = screen.elements.find((e) => e.elementId === 'el-parent');
    const childEl = screen.elements.find((e) => e.elementId === 'el-child');
    assert.ok(parentEl, 'Parent element should exist');
    assert.ok(childEl, 'Child element should exist');
    assert.ok(parentEl!.children.includes(childEl!.elementId), 'Parent should have child in its children list');
    assert.equal(childEl!.parentId, parentEl!.elementId, 'Child should reference parent');
  } finally {
    setElementProvider(async () => []);
  }
});

test('perceiveWithProviders: elements with no id get auto-generated elementId', async () => {
  const mockElements = [
    { tag: 'button', role: 'button', text: 'OK', boundingBox: { x: 0, y: 0, width: 50, height: 30 } },
  ];

  setElementProvider(async () => mockElements as any);
  try {
    const capture = { captureId: 'test', viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
    const screen = await perceiveWithProviders(capture);

    assert.equal(screen.elements.length, 1);
    assert.ok(screen.elements[0].elementId.startsWith('el-'), 'Should have el- prefix for generated IDs');
  } finally {
    setElementProvider(async () => []);
  }
});
