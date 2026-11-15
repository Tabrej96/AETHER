/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Tests for Browser Engine Core (src/core/browser/browserEngine.test.ts)
 *
 * Run via: npx --yes tsx --test src/core/browser/browserEngine.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BrowserEngine,
  MockBrowserBackend,
  type BrowserSession,
  type BrowserSessionConfig,
  type AccessibilityNode,
  type DomNode,
} from './browserEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createEngine(): BrowserEngine {
  return new BrowserEngine({
    sessionsDir: fs.mkdtempSync(path.join(os.tmpdir(), 'aether-engine-test-')),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('BrowserEngine: createSession returns an active session with a profile path', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    assert.ok(session.id, 'session should have an id');
    assert.strictEqual(session.active, true, 'session should be active');
    assert.ok(session.profilePath && session.profilePath.length > 0, 'session should have a profile path');
    assert.ok(session.createdAtIso, 'session should have a creation timestamp');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: createSession respects custom headless config', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession({ headless: true });
    assert.strictEqual(session.active, true);
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: newPage returns a page ID', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    assert.ok(pageId && pageId.length > 0, 'pageId should be a non-empty string');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: navigate + currentUrl round-trip', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com/login');
    const url = await engine.currentUrl(session.id, pageId);
    assert.ok(url.includes('login'), `URL should contain "login", got: ${url}`);
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: pageTitle returns the page title', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com/login');
    const title = await engine.pageTitle(session.id, pageId);
    assert.ok(title && title.length > 0, 'title should be non-empty');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: getAccessibilityTree returns nodes', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com/form');
    const tree = await engine.getAccessibilityTree(session.id, pageId);
    assert.ok(Array.isArray(tree), 'tree should be an array');
    assert.ok(tree.length > 0, 'tree should have at least one node');
    assert.ok(tree[0].role, 'nodes should have a role');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: getDomSnapshot returns DOM nodes', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com');
    const snapshot = await engine.getDomSnapshot(session.id, pageId);
    assert.ok(Array.isArray(snapshot), 'snapshot should be an array');
    assert.ok(snapshot.length > 0, 'snapshot should have nodes');
    assert.ok(snapshot[0].tagName, 'nodes should have a tagName');
    assert.ok(snapshot[0].cssSelector, 'nodes should have a cssSelector');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: screenshot returns a PNG buffer', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com');
    const buf = await engine.screenshot(session.id, pageId);
    assert.ok(Buffer.isBuffer(buf), 'screenshot should return a Buffer');
    assert.ok(buf.length > 0, 'screenshot should be non-empty');
    // PNG magic bytes: 89 50 4E 47
    assert.strictEqual(buf.toString('hex', 0, 3), '89504e', 'should start with PNG magic bytes');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: click does not throw on a valid selector', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com');
    await assert.doesNotReject(() => engine.click(session.id, pageId, '#submit'));
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: typeText accepts a string value', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com');
    await assert.doesNotReject(() => engine.typeText(session.id, pageId, '#email', 'test@example.com'));
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: typeText rejects non-string values', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.navigate(session.id, pageId, 'https://example.com');
    await assert.rejects(
      () => engine.typeText(session.id, pageId, '#email', null as unknown as string),
      TypeError,
      'should reject non-string values'
    );
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: getCookies / setCookies round-trip', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    const cookies = [{ session_id: 'abc123' }, { token: 'xyz789' }];
    await engine.setCookies(session.id, pageId, cookies);
    const retrieved = await engine.getCookies(session.id, pageId);
    assert.deepStrictEqual(retrieved, cookies);
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: evaluateFile reads a read-only script', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    // Write a safe read-only script
    const scriptsDir = path.join(engine['sessionsDir'], 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    const scriptFile = path.join(scriptsDir, 'safe-read.js');
    fs.writeFileSync(scriptFile, 'document.title', 'utf8');
    const result = await engine.evaluateFile(session.id, pageId, 'safe-read.js');
    assert.ok(result, 'evaluateFile should return a result');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: evaluateFile blocks sensitive JS (security)', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    const scriptsDir = path.join(engine['sessionsDir'], 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });
    const scriptFile = path.join(scriptsDir, 'bad.js');
    fs.writeFileSync(scriptFile, 'document.cookie', 'utf8');
    await assert.rejects(
      () => engine.evaluateFile(session.id, pageId, 'bad.js'),
      /security policy/i,
      'should block sensitive script evaluation'
    );
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: evaluateFile blocks path traversal (security)', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await assert.rejects(
      () => engine.evaluateFile(session.id, pageId, '../../../etc/passwd'),
      /escapes scripts directory/i,
      'should block path traversal'
    );
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: closePage removes the page (no longer tracked)', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.closePage(session.id, pageId);
    // After close, the mock returns 'about:blank' for unknown pages
    const url = await engine.currentUrl(session.id, pageId);
    assert.strictEqual(url, 'about:blank', 'closed page should return about:blank');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: closeSession shuts down the session', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    await engine.closeSession(session.id);
    const retrieved = engine.getSession(session.id);
    assert.strictEqual(retrieved?.active, false, 'session should be marked inactive');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: listSessions returns all sessions', async () => {
  const engine = createEngine();
  try {
    await engine.createSession();
    await engine.createSession();
    const sessions = engine.listSessions();
    assert.strictEqual(sessions.length, 2, 'should list 2 sessions');
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: operations on closed engine throw', async () => {
  const engine = createEngine();
  await engine.close();
  await assert.rejects(() => engine.createSession(), /closed/i);
});

test('BrowserEngine: operations on inactive session throw', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const pageId = await engine.newPage(session.id);
    await engine.closeSession(session.id);
    // Now operations on the inactive session should throw
    await assert.rejects(() => engine.currentUrl(session.id, pageId), /not active/i);
    await assert.rejects(() => engine.click(session.id, pageId, '#submit'), /not active/i);
  } finally {
    await engine.close();
  }
});

test('BrowserEngine: getSession returns session by id', async () => {
  const engine = createEngine();
  try {
    const session = await engine.createSession();
    const retrieved = engine.getSession(session.id);
    assert.strictEqual(retrieved?.id, session.id);
    assert.strictEqual(retrieved?.active, true);
  } finally {
    await engine.close();
  }
});
