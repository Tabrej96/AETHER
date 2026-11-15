/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Tests for Task Verification (src/core/browser/taskVerifier.test.ts)
 *
 * Run via: npx --yes tsx --test src/core/browser/taskVerifier.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { TaskVerifier, type VerificationConfig } from './taskVerifier';
import { MockBrowserBackend } from './browserEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createVerifier(): Promise<{ verifier: TaskVerifier; backend: MockBrowserBackend; pageId: string }> {
  const backend = new MockBrowserBackend();
  await backend.launch({}, fs.mkdtempSync(path.join(os.tmpdir(), 'aether-verify-test-')));
  const pageId = await backend.newPage();
  await backend.navigate(pageId, 'https://example.com');
  const verifier = new TaskVerifier(backend, 'session-1', pageId);
  return { verifier, backend, pageId };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('TaskVerifier: verify returns PASS for empty config (no checks)', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const result = await verifier.verify({});
    assert.strictEqual(result.passed, true);
    assert.ok(result.checks.length > 0, 'should always include error detection');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify detects no errors on clean page', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const result = await verifier.verify({});
    const errorCheck = result.checks.find((c) => c.id === 'error-detection');
    assert.ok(errorCheck, 'should have error detection check');
    assert.strictEqual(errorCheck!.status, 'PASS');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify requiredElements checks presence', async () => {
  const { verifier, backend, pageId } = await createVerifier();
  try {
    await backend.navigate(pageId, 'https://example.com/login');
    const result = await verifier.verify({
      requiredElements: ['#login'],
    });
    const check = result.checks.find((c) => c.id.includes('required-el--login'));
    assert.ok(check, 'should have the required element check');
    assert.strictEqual(check!.status, 'PASS');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify requiredElements fails for missing element', async () => {
  const { verifier } = await createVerifier();
  try {
    const result = await verifier.verify({
      requiredElements: ['#nonexistent-element-xyz'],
    });
    const check = result.checks.find((c) => c.id.includes('required-el--nonexistent'));
    assert.ok(check, 'should have the check');
    assert.strictEqual(check!.status, 'FAIL');
  } finally {
    await (await createVerifier()).backend.close();
  }
});

test('TaskVerifier: verify forbiddenElements checks absence', async () => {
  const { verifier } = await createVerifier();
  try {
    const result = await verifier.verify({
      forbiddenElements: ['#nonexistent-xyz'],
    });
    const check = result.checks.find((c) => c.id.includes('forbidden-el--nonexistent'));
    assert.ok(check, 'should have the check');
    assert.strictEqual(check!.status, 'PASS');
  } finally {
    await (await createVerifier()).backend.close();
  }
});

test('TaskVerifier: verify forbiddenElements fails when element exists', async () => {
  const { verifier } = await createVerifier();
  try {
    // The mock has #submit on the default page
    const result = await verifier.verify({
      forbiddenElements: ['#submit'],
    });
    const check = result.checks.find((c) => c.id.includes('forbidden-el--submit'));
    assert.ok(check, 'should have the check');
    // The mock has #submit, so this should be FAIL
    assert.strictEqual(check!.status, 'FAIL');
  } finally {
    await (await createVerifier()).backend.close();
  }
});

test('TaskVerifier: verify expectedUrlPatterns checks URL', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    await backend.navigate(await getOnlyPageId(backend), 'https://example.com/dashboard');
    const result = await verifier.verify({
      expectedUrlPatterns: ['dashboard'],
    });
    const check = result.checks.find((c) => c.id === 'url-pattern-0');
    assert.ok(check, 'should have URL pattern check');
    assert.strictEqual(check!.status, 'PASS');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify expectedUrlPatterns fails for wrong URL', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    await backend.navigate(await getOnlyPageId(backend), 'https://example.com/page');
    const result = await verifier.verify({
      expectedUrlPatterns: ['dashboard'],
    });
    const check = result.checks.find((c) => c.id === 'url-pattern-0');
    assert.strictEqual(check!.status, 'FAIL');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify expectedUrlPatterns with RegExp', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    await backend.navigate(await getOnlyPageId(backend), 'https://example.com/item-42');
    const result = await verifier.verify({
      expectedUrlPatterns: [/item-\d+/],
    });
    const check = result.checks.find((c) => c.id === 'url-pattern-0');
    assert.ok(check, 'should have URL pattern check');
    assert.strictEqual(check!.status, 'PASS');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify requiredTexts checks page text', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    // Mock has "Submit" button
    const result = await verifier.verify({
      requiredTexts: ['Submit'],
    });
    const check = result.checks.find((c) => c.id.includes('required-text-Submit'));
    assert.ok(check, 'should have text check');
    assert.strictEqual(check!.status, 'PASS');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify forbiddenTexts checks absence of text', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const result = await verifier.verify({
      forbiddenTexts: ['nonexistent error xyz'],
    });
    const check = result.checks.find((c) => c.id.includes('forbidden-text-nonexistent'));
    assert.ok(check, 'should have text check');
    assert.strictEqual(check!.status, 'PASS');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verify captures screenshot when requested', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const result = await verifier.verify({ captureScreenshot: true });
    const screenshotCheck = result.checks.find((c) => c.id === 'screenshot-capture');
    assert.ok(screenshotCheck, 'should have screenshot check');
    assert.strictEqual(screenshotCheck!.status, 'PASS');
    assert.ok(screenshotCheck!.actual.includes('bytes'), 'should report buffer size');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verifyElement checks element existence', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const check = await verifier.verifyElement('#submit');
    assert.strictEqual(check.status, 'PASS');
    assert.ok(check.description.includes('#submit'));
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verifyElement fails for missing element', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const check = await verifier.verifyElement('#nonexistent');
    assert.strictEqual(check.status, 'FAIL');
    assert.ok(check.remediation?.includes('nonexistent'));
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: setBaselineScreenshot enables visual comparison', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const screenshot = await backend.screenshot(await getOnlyPageId(backend));
    verifier.setBaselineScreenshot(screenshot);
    const result = await verifier.verify({ compareScreenshot: true });
    const check = result.checks.find((c) => c.id === 'screenshot-compare');
    assert.ok(check, 'should have screenshot comparison check');
    assert.strictEqual(check!.status, 'PASS', 'same screenshot should match');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: loadBaselineScreenshot loads from disk', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const screenshot = await backend.screenshot(await getOnlyPageId(backend));
    const tmpFile = path.join(os.tmpdir(), 'aether-baseline-test.png');
    fs.writeFileSync(tmpFile, screenshot);
    verifier.loadBaselineScreenshot(tmpFile);
    const result = await verifier.verify({ compareScreenshot: true });
    const check = result.checks.find((c) => c.id === 'screenshot-compare');
    assert.strictEqual(check!.status, 'PASS');
    fs.unlinkSync(tmpFile);
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: loadBaselineScreenshot throws for missing file', async () => {
  const { verifier } = await createVerifier();
  try {
    verifier.loadBaselineScreenshot('/nonexistent/path/baseline.png');
    assert.fail('should have thrown');
  } catch (err) {
    assert.ok((err as Error).message.includes('not found'));
  } finally {
    await (await createVerifier()).backend.close();
  }
});

test('TaskVerifier: verify returns failureSummary with severities', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const result = await verifier.verify({
      requiredElements: ['#nonexistent'],
      forbiddenTexts: ['Submit'], // This exists in mock
    });
    assert.ok(result.failureSummary !== undefined, 'should have failure summary');
    assert.ok(result.verifiedAtIso.length > 0, 'should have timestamp');
    assert.ok(result.durationMs >= 0, 'should have duration');
  } finally {
    await backend.close();
  }
});

test('TaskVerifier: verifyElement with expected state', async () => {
  const { verifier, backend } = await createVerifier();
  try {
    const check = await verifier.verifyElement('#submit', { visible: true });
    assert.strictEqual(check.status, 'PASS');
    assert.ok(check.actual.includes('role='), 'should report element details');
  } finally {
    await backend.close();
  }
});

// ─── Private helper ──────────────────────────────────────────────────────────

async function getOnlyPageId(backend: MockBrowserBackend): Promise<string> {
  const pages = (backend as unknown as { _pages: Map<string, unknown> })._pages;
  const firstKey = pages.keys().next().value;
  return firstKey as string;
}
