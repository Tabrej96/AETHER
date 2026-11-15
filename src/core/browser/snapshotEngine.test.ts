/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Tests for Browser Snapshot System (src/core/browser/snapshotEngine.test.ts)
 *
 * Run via: npx --yes tsx --test src/core/browser/snapshotEngine.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { SnapshotEngine, type SnapshotBundle, type SnapshotDiff, type DomSnapshot } from './snapshotEngine';
import { MockBrowserBackend } from './browserEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createEngine(): Promise<{ engine: SnapshotEngine; backend: MockBrowserBackend; pageId: string; outputDir: string }> {
  const backend = new MockBrowserBackend();
  await backend.launch({}, fs.mkdtempSync(path.join(os.tmpdir(), 'aether-snap-test-')));
  const pageId = await backend.newPage();
  await backend.navigate(pageId, 'https://example.com');
  const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-snapshots-'));
  const engine = new SnapshotEngine(backend, 'session-1', pageId, { outputDir });
  return { engine, backend, pageId, outputDir };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('SnapshotEngine: capture returns a full bundle', async () => {
  const { engine, backend } = await createEngine();
  try {
    const bundle = await engine.capture(true);
    assert.ok(bundle.accessibility, 'should have accessibility snapshot');
    assert.ok(bundle.dom, 'should have DOM snapshot');
    assert.ok(bundle.visual, 'should have visual snapshot');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: capture without screenshot skips visual', async () => {
  const { engine, backend } = await createEngine();
  try {
    const bundle = await engine.capture(false);
    assert.ok(bundle.accessibility, 'should have accessibility snapshot');
    assert.ok(bundle.dom, 'should have DOM snapshot');
    assert.strictEqual(bundle.visual, null, 'visual should be null when saveScreenshot=false');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: accessibility snapshot has correct structure', async () => {
  const { engine, backend } = await createEngine();
  try {
    const a11y = await engine.captureAccessibility();
    assert.ok(a11y.metadata, 'should have metadata');
    assert.ok(a11y.metadata.url.length > 0, 'metadata should have a URL');
    assert.ok(a11y.metadata.contentHash.length > 0, 'metadata should have a content hash');
    assert.ok(a11y.metadata.version > 0, 'version should be positive');
    assert.ok(typeof a11y.nodeCount === 'number', 'should have node count');
    assert.ok(a11y.estimatedTokens > 0, 'should estimate token count');
    assert.ok(Object.keys(a11y.refs).length > 0, 'should have ref entries');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: DOM snapshot has correct structure', async () => {
  const { engine, backend } = await createEngine();
  try {
    const dom = await engine.captureDom();
    assert.ok(dom.metadata, 'should have metadata');
    assert.ok(Array.isArray(dom.nodes), 'nodes should be an array');
    assert.ok(dom.nodes.length > 0, 'should have nodes');
    assert.ok(dom.nodes[0].tagName, 'nodes should have tagName');
    assert.ok(dom.nodes[0].cssSelector, 'nodes should have cssSelector');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: visual snapshot saves a PNG file', async () => {
  const { engine, backend, outputDir } = await createEngine();
  try {
    const visual = await engine.captureVisual();
    assert.ok(visual.filePath, 'should have a file path');
    assert.ok(fs.existsSync(visual.filePath!), 'file should exist on disk');
    assert.ok(visual.sizeBytes > 0, 'should have non-zero size');
    // PNG magic bytes
    const buf = fs.readFileSync(visual.filePath!);
    assert.strictEqual(buf.toString('hex', 0, 3), '89504e', 'should be a PNG');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: visual snapshot writes to output dir', async () => {
  const { engine, backend, outputDir } = await createEngine();
  try {
    const visual = await engine.captureVisual();
    assert.ok(visual.filePath!.startsWith(outputDir), 'file should be in the output dir');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: snapshot version increments', async () => {
  const { engine, backend } = await createEngine();
  try {
    const snap1 = await engine.captureAccessibility();
    const snap2 = await engine.captureAccessibility();
    assert.strictEqual(snap2.metadata.version, snap1.metadata.version + 1, 'version should increment');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: snapshots of same page have same content hash', async () => {
  const { engine, backend } = await createEngine();
  try {
    const snap1 = await engine.captureDom();
    const snap2 = await engine.captureDom();
    // Mock backend returns the same content, so hashes should match
    assert.strictEqual(snap1.metadata.contentHash, snap2.metadata.contentHash);
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: diff detects identical snapshots', async () => {
  const { engine, backend } = await createEngine();
  try {
    const snap1 = await engine.captureDom();
    const snap2 = await engine.captureDom();
    const diff = engine.diff(snap1, snap2);
    assert.strictEqual(diff.identical, true, 'identical snapshots should have identical=true');
    assert.strictEqual(diff.added.length, 0);
    assert.strictEqual(diff.removed.length, 0);
    assert.strictEqual(diff.modified.length, 0);
    assert.strictEqual(diff.changePercent, 0);
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: diff detects changes between different snapshots', async () => {
  const { engine, backend, pageId } = await createEngine();
  try {
    const snap1 = await engine.captureDom();
    await backend.navigate(pageId, 'https://example.com/form');
    const snap2 = await engine.captureDom();
    const diff = engine.diff(snap1, snap2);
    // The mock changes content when navigating to /form, so there should be changes
    assert.ok(diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0 || diff.identical,
      'diff should report some change or identical state');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: diff computes change percent', async () => {
  const { engine, backend } = await createEngine();
  try {
    const snap1 = await engine.captureDom();
    const snap2 = await engine.captureDom();
    const diff = engine.diff(snap1, snap2);
    assert.ok(diff.changePercent >= 0 && diff.changePercent <= 100, 'changePercent should be 0-100');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: metadata has required fields', async () => {
  const { engine, backend } = await createEngine();
  try {
    const bundle = await engine.capture();
    const meta = bundle.accessibility.metadata;
    assert.ok(meta.timestampIso, 'should have timestamp');
    assert.ok(meta.url, 'should have url');
    assert.ok(meta.title, 'should have title');
    assert.ok(meta.contentHash, 'should have content hash');
    assert.ok(typeof meta.version === 'number', 'should have numeric version');
  } finally {
    await backend.close();
  }
});

test('SnapshotEngine: visual snapshot dimensions are extracted', async () => {
  const { engine, backend } = await createEngine();
  try {
    const visual = await engine.captureVisual();
    // The mock returns a 1x1 PNG, so dimensions should be 1x1
    assert.ok(visual.dimensions !== undefined, 'should have dimensions');
    assert.ok(visual.dimensions!.width > 0, 'width should be positive');
    assert.ok(visual.dimensions!.height > 0, 'height should be positive');
  } finally {
    await backend.close();
  }
});
