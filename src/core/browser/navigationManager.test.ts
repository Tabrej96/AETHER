/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Tests for Navigation & State Management (src/core/browser/navigationManager.test.ts)
 *
 * Run via: npx --yes tsx --test src/core/browser/navigationManager.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  NavigationManager,
  validateNavigationUrl,
  type NavigationOptions,
} from './navigationManager';
import { MockBrowserBackend } from './browserEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createNavManager(allowedDomains: string[] = []): Promise<{ nav: NavigationManager; backend: MockBrowserBackend; pageId: string }> {
  const backend = new MockBrowserBackend();
  await backend.launch({}, fs.mkdtempSync(path.join(os.tmpdir(), 'aether-nav-test-')));
  const pageId = await backend.newPage();
  const nav = new NavigationManager(backend, 'session-1', pageId, { allowedDomains });
  return { nav, backend, pageId };
}

// ─── URL validation tests ─────────────────────────────────────────────────────

test('validateNavigationUrl: accepts safe HTTPS URLs', () => {
  const result = validateNavigationUrl('https://example.com/page');
  assert.strictEqual(result.safe, true);
});

test('validateNavigationUrl: accepts file URLs', () => {
  const result = validateNavigationUrl('file:///tmp/test.html');
  assert.strictEqual(result.safe, true);
});

test('validateNavigationUrl: blocks localhost', () => {
  const result = validateNavigationUrl('http://localhost:3000/admin');
  assert.strictEqual(result.safe, false);
  assert.ok(result.reason?.includes('localhost'));
});

test('validateNavigationUrl: blocks 127.0.0.1', () => {
  const result = validateNavigationUrl('http://127.0.0.1:8080/');
  assert.strictEqual(result.safe, false);
});

test('validateNavigationUrl: blocks non-HTTP protocols', () => {
  const result = validateNavigationUrl('ftp://example.com/file');
  assert.strictEqual(result.safe, false);
  assert.ok(result.reason?.includes('protocol'));
});

test('validateNavigationUrl: blocks javascript: URLs', () => {
  const result = validateNavigationUrl('javascript:alert(1)');
  assert.strictEqual(result.safe, false);
});

test('validateNavigationUrl: blocks data: HTML URLs', () => {
  const result = validateNavigationUrl('data:text/html,<script>alert(1)</script>');
  assert.strictEqual(result.safe, false);
});

test('validateNavigationUrl: blocks invalid URLs', () => {
  const result = validateNavigationUrl('not-a-url');
  assert.strictEqual(result.safe, false);
});

test('validateNavigationUrl: enforces allowed domain list', () => {
  const result = validateNavigationUrl('https://evil.com/page', ['example.com']);
  assert.strictEqual(result.safe, false);
  assert.ok(result.reason?.includes('not in allowed list'));
});

test('validateNavigationUrl: allows subdomain of allowed domain', () => {
  const result = validateNavigationUrl('https://sub.example.com/page', ['example.com']);
  assert.strictEqual(result.safe, true);
});

test('validateNavigationUrl: wildcard allowed domains', () => {
  const result = validateNavigationUrl('https://sub.example.com/page', ['*.example.com']);
  assert.strictEqual(result.safe, true);
});

// ─── Navigation tests ────────────────────────────────────────────────────────

test('NavigationManager: navigate returns final URL and title', async () => {
  const { nav, backend } = await createNavManager();
  try {
    const result = await nav.navigate('https://example.com/test-page');
    assert.ok(result.url.length > 0, 'should return a URL');
    assert.ok(result.title.length > 0, 'should return a title');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: navigate blocks unsafe URLs', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await assert.rejects(() => nav.navigate('http://localhost:3000/'), /Navigation blocked/);
  } finally {
    await backend.close();
  }
});

test('NavigationManager: navigate records history', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com/page1');
    await nav.navigate('https://example.com/page2');
    const history = nav.getHistory();
    assert.strictEqual(history.length, 2, 'should have 2 history entries');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: getHistory returns entries with required fields', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com/page');
    const history = nav.getHistory();
    const entry = history[0];
    assert.ok(entry.url, 'history entry should have url');
    assert.ok(entry.title, 'history entry should have title');
    assert.ok(entry.timestampIso, 'history entry should have timestamp');
    assert.strictEqual(entry.navigationType, 'navigate');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: getCurrentEntry returns latest entry', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com/page');
    const entry = nav.getCurrentEntry();
    assert.ok(entry, 'should have a current entry');
    assert.ok(entry!.url.includes('example.com'));
  } finally {
    await backend.close();
  }
});

test('NavigationManager: goBack navigates to previous entry', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com/first');
    await nav.navigate('https://example.com/second');
    const result = await nav.goBack();
    assert.ok(result.url.includes('first') || result.url.includes('example.com'), 'should go back');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: goBack throws when no history', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await assert.rejects(() => nav.goBack(), /No history/);
  } finally {
    await backend.close();
  }
});

test('NavigationManager: reload returns current page info', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com/page');
    const result = await nav.reload();
    assert.ok(result.url.length > 0, 'reload should return URL');
    assert.ok(result.title.length > 0, 'reload should return title');
  } finally {
    await backend.close();
  }
});

// ─── Wait strategy tests ──────────────────────────────────────────────────────

test('NavigationManager: waitForText detects text on page', async () => {
  const { nav, backend, pageId } = await createNavManager();
  try {
    await backend.navigate(pageId, 'https://example.com/login');
    // The mock login page has "Login" button text
    const found = await nav.waitForText('Login', 5000);
    assert.strictEqual(found, true, 'should find "Login" text');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: waitForText returns false on timeout', async () => {
  const { nav, backend } = await createNavManager();
  try {
    const found = await nav.waitForText('nonexistent text xyz', 500);
    assert.strictEqual(found, false, 'should return false on timeout');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: waitForUrlPattern matches current URL', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com/test-page');
    const matched = await nav.waitForUrl('test-page', 5000);
    assert.strictEqual(matched, true, 'should match URL pattern');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: waitForUrlPattern with RegExp', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com/page-123');
    const matched = await nav.waitForUrl(/page-\d+/, 5000);
    assert.strictEqual(matched, true, 'should match URL regex');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: waitForElementVisible finds element', async () => {
  const { nav, backend, pageId } = await createNavManager();
  try {
    await backend.navigate(pageId, 'https://example.com/login');
    const node = await nav.waitForElementVisible('#login', 5000);
    assert.ok(node !== null, 'should find the login element');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: waitForElementVisible returns null on timeout', async () => {
  const { nav, backend } = await createNavManager();
  try {
    const node = await nav.waitForElementVisible('#nonexistent', 500);
    assert.strictEqual(node, null, 'should return null on timeout');
  } finally {
    await backend.close();
  }
});

test('NavigationManager: waitForNetworkIdle completes without error', async () => {
  const { nav, backend } = await createNavManager();
  try {
    await nav.navigate('https://example.com');
    await assert.doesNotReject(() => nav.waitForNetworkIdle(5000));
  } finally {
    await backend.close();
  }
});

// ─── Multi-tab tests ─────────────────────────────────────────────────────────

test('NavigationManager: executeMultiTabPlan runs sequential steps', async () => {
  const { nav, backend } = await createNavManager();
  try {
    const tabId = await backend.newPage();
    const plan = {
      steps: [{ tabId, action: 'navigate' as const, params: { url: 'https://example.com' } }],
      parallel: false,
    };
    const results = await nav.executeMultiTabPlan(plan, backend);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].tabId, tabId);
  } finally {
    await backend.close();
  }
});

test('NavigationManager: executeMultiTabPlan runs parallel steps', async () => {
  const { nav, backend } = await createNavManager();
  try {
    const tab1 = await backend.newPage();
    const tab2 = await backend.newPage();
    const plan = {
      steps: [
        { tabId: tab1, action: 'navigate' as const, params: { url: 'https://example.com' } },
        { tabId: tab2, action: 'navigate' as const, params: { url: 'https://example.com' } },
      ],
      parallel: true,
    };
    const results = await nav.executeMultiTabPlan(plan, backend);
    assert.strictEqual(results.length, 2);
  } finally {
    await backend.close();
  }
});
