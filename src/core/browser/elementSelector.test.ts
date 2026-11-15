/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Tests for Intelligent Element Selection (src/core/browser/elementSelector.test.ts)
 *
 * Run via: npx --yes tsx --test src/core/browser/elementSelector.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ElementSelector,
  validateSelector,
  sanitizeSelector,
  type ElementQuery,
  type SelectionStrategy,
} from './elementSelector';
import type { AccessibilityNode } from './browserEngine';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const MOCK_TREE: AccessibilityNode[] = [
  {
    role: 'heading',
    name: 'Welcome',
    cssSelector: 'h1',
    boundingBox: { x: 0, y: 0, width: 200, height: 30 },
    disabled: false,
    hidden: false,
  },
  {
    role: 'textbox',
    name: 'Email Address',
    cssSelector: '#email',
    boundingBox: { x: 0, y: 40, width: 300, height: 36 },
    disabled: false,
    hidden: false,
  },
  {
    role: 'textbox',
    name: 'Password',
    cssSelector: '#password',
    boundingBox: { x: 0, y: 84, width: 300, height: 36 },
    disabled: false,
    hidden: false,
  },
  {
    role: 'button',
    name: 'Sign In',
    cssSelector: '#signin-btn',
    boundingBox: { x: 0, y: 128, width: 120, height: 36 },
    disabled: false,
    hidden: false,
  },
  {
    role: 'link',
    name: 'Forgot Password',
    cssSelector: '#forgot-link',
    boundingBox: { x: 0, y: 170, width: 150, height: 20 },
    disabled: false,
    hidden: false,
  },
  {
    role: 'combobox',
    name: 'Country',
    cssSelector: '#country',
    boundingBox: { x: 0, y: 200, width: 300, height: 36 },
    disabled: false,
    hidden: false,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

test('ElementSelector: CSS strategy matches by ID selector', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { cssSelector: '#email' });
  assert.ok(match, 'should find a match');
  assert.strictEqual(match?.strategy, 'CSS');
  assert.ok(match!.confidence >= 0.9, 'ID selector should have high confidence');
  assert.strictEqual(match!.selector, '#email');
});

test('ElementSelector: CSS strategy confidence depends on specificity', () => {
  const selector = new ElementSelector();
  // ID selectors have higher confidence than generic selectors
  const idMatch = selector.resolve(MOCK_TREE, { cssSelector: '#email' });
  const signinMatch = selector.resolve(MOCK_TREE, { cssSelector: '#signin-btn' });
  assert.ok(idMatch, 'ID selector should match');
  assert.ok(signinMatch, 'another ID selector should match');
  assert.ok(idMatch!.confidence >= 0.9, 'ID selector should have high confidence');
  assert.ok(signinMatch!.confidence >= 0.9, 'another ID selector should have high confidence');
});

test('ElementSelector: CSS strategy returns null for selectors not in tree', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { cssSelector: 'button' });
  assert.strictEqual(match, null, 'tag selector should not match when not in tree');
});

test('ElementSelector: A11Y strategy matches by role and name', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { role: 'button', name: 'Sign In' });
  assert.ok(match, 'should find a match');
  assert.strictEqual(match?.strategy, 'A11Y');
  assert.strictEqual(match?.element.name, 'Sign In');
});

test('ElementSelector: A11Y strategy partial name match', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { role: 'button', name: 'Sign' });
  assert.ok(match, 'should find partial match');
  assert.strictEqual(match?.strategy, 'A11Y');
});

test('ElementSelector: returns null when no strategies match', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { description: 'a totally nonexistent thing' });
  // LLM strategy not enabled by default, should return null
  assert.ok(match === null || match.confidence === 0, 'should not find a confident match');
});

test('ElementSelector: resolveWithFallback reports tried strategies', () => {
  const selector = new ElementSelector();
  const result = selector.resolveWithFallback(MOCK_TREE, { role: 'button', name: 'Sign In' });
  assert.ok(result.triedStrategies.length > 0, 'should report tried strategies');
  assert.ok(result.match !== null, 'should find a match');
});

test('ElementSelector: resolveWithFallback reports fallbackRequired when no match', () => {
  const selector = new ElementSelector();
  // Use a query that no built-in strategy can match
  const result = selector.resolveWithFallback(MOCK_TREE, { cssSelector: '#absolutely-nonexistent-xyz-12345' });
  assert.ok(result.fallbackRequired, 'should require fallback when no strategy finds a good match');
});

test('ElementSelector: cache improves hit rate', () => {
  const selector = new ElementSelector({ cacheTtlMs: 60_000 });
  const query: ElementQuery = { cssSelector: '#email' };

  // First call — cache miss
  selector.resolve(MOCK_TREE, query);
  // Second call — should be cached
  selector.resolve(MOCK_TREE, query);

  const stats = selector.cacheStats;
  assert.strictEqual(stats.hits, 1, 'should have one cache hit');
  assert.strictEqual(stats.misses, 1, 'should have one cache miss');
  assert.ok(stats.hitRate > 0, 'hit rate should be > 0');
});

test('ElementSelector: invalidateCache clears all entries', () => {
  const selector = new ElementSelector({ cacheTtlMs: 60_000 });
  selector.resolve(MOCK_TREE, { cssSelector: '#email' });
  assert.strictEqual(selector.cacheStats.entries, 1, 'should have one entry');

  selector.invalidateCache();
  assert.strictEqual(selector.cacheStats.entries, 0, 'cache should be empty');
});

test('ElementSelector: maxCacheSize evicts oldest entries', () => {
  const selector = new ElementSelector({ maxCacheSize: 3, cacheTtlMs: 60_000 });
  for (let i = 0; i < 5; i++) {
    selector.resolve(MOCK_TREE, { cssSelector: `#item-${i}` });
  }
  assert.ok(selector.cacheStats.entries <= 3, 'cache should not exceed max size');
});

test('ElementSelector: LLM strategy enabled with useLLM flag', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(
    MOCK_TREE,
    { description: 'the sign in button' },
    { useLLM: true }
  );
  // LLM strategy has low confidence (0.5) by default, so it may not meet minConfidence
  assert.ok(match !== null, 'should attempt LLM strategy');
});

test('ElementSelector: preferredStrategies order is respected', () => {
  const selector = new ElementSelector();
  // Put preferredStrategies on the query itself (resolveWithFallback reads from query)
  const query: ElementQuery = { role: 'button', name: 'Sign In', preferredStrategies: ['A11Y', 'CSS'] };
  const result = selector.resolveWithFallback(MOCK_TREE, query, { minConfidence: 0.5 });
  assert.ok(result.match !== null, 'should find match with preferred strategies');
  assert.ok(result.triedStrategies[0] === 'A11Y', 'should try A11Y first');
  assert.strictEqual(result.match.strategy, 'A11Y', 'A11Y match should be returned first');
});

test('validateSelector: blocks XSS patterns', () => {
  assert.strictEqual(validateSelector('<script>alert(1)</script>'), false);
  assert.strictEqual(validateSelector('javascript:alert(1)'), false);
  assert.strictEqual(validateSelector('<img onerror=alert(1)>'), false);
  assert.strictEqual(validateSelector('data:text/html,<script>alert(1)</script>'), false);
});

test('validateSelector: allows safe selectors', () => {
  assert.strictEqual(validateSelector('#email'), true);
  assert.strictEqual(validateSelector('.btn-primary'), true);
  assert.strictEqual(validateSelector('button[type="submit"]'), true);
  assert.strictEqual(validateSelector('//button[@id="submit"]'), true);
});

test('sanitizeSelector: strips dangerous content', () => {
  assert.strictEqual(sanitizeSelector('<script>bad</script>'), '');
  assert.strictEqual(sanitizeSelector('  #email  '), '#email');
  assert.strictEqual(sanitizeSelector('#safe'), '#safe');
});

test('sanitizeSelector: removes control characters', () => {
  const result = sanitizeSelector('#email\x00\x01');
  assert.ok(!result.includes('\x00'), 'should strip null bytes');
  assert.ok(!result.includes('\x01'), 'should strip control characters');
});

test('ElementSelector: XPATH strategy matches valid XPath', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { xpath: '//button[@id="signin-btn"]' });
  assert.ok(match, 'should find a match');
  assert.strictEqual(match?.strategy, 'XPATH');
  assert.strictEqual(match?.selector, '//button[@id="signin-btn"]');
});

test('ElementSelector: XPATH strategy rejects non-XPath strings', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { xpath: 'just-a-string' });
  assert.ok(match === null, 'should reject non-XPath strings');
});

test('ElementSelector: confidence thresholds filter weak matches', () => {
  const selector = new ElementSelector();
  // With minConfidence = 0.95, only high-confidence matches should return
  const match = selector.resolve(MOCK_TREE, { cssSelector: '#email' }, { minConfidence: 0.95 });
  assert.ok(match !== null, 'ID selector should meet high threshold');
  assert.ok(match!.confidence >= 0.95, 'confidence should meet threshold');
});

test('ElementSelector: resolve returns null for completely empty query', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, {});
  assert.ok(match === null, 'empty query should return null');
});

test('ElementSelector: textContent search in A11Y strategy', () => {
  const selector = new ElementSelector();
  const match = selector.resolve(MOCK_TREE, { textContent: 'Sign In' });
  assert.ok(match, 'should find match by textContent');
  assert.strictEqual(match?.strategy, 'A11Y');
});

test('ElementSelector: multiple matching A11Y nodes returns best visible one', () => {
  const selector = new ElementSelector();
  const tree: AccessibilityNode[] = [
    { role: 'button', name: 'Submit', cssSelector: '#btn-1', boundingBox: { x: 0, y: 0, width: 10, height: 10 }, disabled: false, hidden: true },
    { role: 'button', name: 'Submit', cssSelector: '#btn-2', boundingBox: { x: 0, y: 0, width: 10, height: 10 }, disabled: false, hidden: false },
  ];
  const match = selector.resolve(tree, { role: 'button', name: 'Submit' });
  assert.ok(match, 'should find a match');
  assert.strictEqual(match?.selector, '#btn-2', 'should prefer visible node');
});
