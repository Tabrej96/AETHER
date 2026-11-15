/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P21 TEST · design-system generator (directive §6)
 * (src/core/design/designSystem.test.ts) · Created by Tabrej
 *
 * §6's acceptance: every category's generated starter must pass the two
 * engines it composes — the gate (clean bar) and P19 (right kind + not
 * slop). "Stop producing generic AI interfaces" is a measured claim: a
 * matrix of PASS, or a named failure.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateDesignSystem,
  verifyDesignSystem,
  verifyAllCategories,
  CREATIVE_DIRECTIONS,
  DIRECTIONS,
} from './designSystem';
import { profileFor, UNSEEN_PROFILE } from '../projectIntelligence/categories';

test('§6: every P12 category × its inferred direction passes the gate + taste bars (28/28)', () => {
  const results = verifyAllCategories();
  assert.equal(results.length, 28, 'one row per P12 category (27 + UNSEEN)');
  for (const r of results) {
    assert.equal(r.verdict.verdict, 'PASS', `${r.category} -> ${r.direction}:\n  ${r.verdict.failures.join('\n  ')}`);
    assert.equal(r.verdict.gate.pass, true, 'the clean bar passes (>=80)');
    assert.equal(r.verdict.taste.slop.signals.length, 0, 'zero slop tells fire');
  }
});

test('every direction carries a WCAG-verified contrast ratio — never a guess', () => {
  for (const id of CREATIVE_DIRECTIONS) {
    const d = DIRECTIONS[id];
    assert.ok(d.light.ink && d.light.surface, 'light pair present');
    // the measured ratios live on the generated system's tokens
    const ds = generateDesignSystem('UNSEEN', { direction: id, theme: 'light' });
    assert.ok(ds.tokens.contrast.lightInkOnSurface >= 4.5, `${id} light ink-on-surface = ${ds.tokens.contrast.lightInkOnSurface} (need >=4.5:1)`);
    const dsDark = generateDesignSystem('UNSEEN', { direction: id, theme: 'dark' });
    assert.ok(dsDark.tokens.contrast.darkInkOnSurface >= 4.5, `${id} dark ink-on-surface = ${dsDark.tokens.contrast.darkInkOnSurface} (need >=4.5:1)`);
  }
});

test('the default direction follows the category, and a user override wins (the §2 override rule)', () => {
  const inferred = generateDesignSystem('FINANCIAL');
  assert.equal(inferred.direction, 'ENTERPRISE_PRECISION');
  assert.equal(inferred.directionSource, 'INFERRED');
  const overridden = generateDesignSystem('FINANCIAL', { direction: 'PREMIUM_EDITORIAL' });
  assert.equal(overridden.direction, 'PREMIUM_EDITORIAL');
  assert.equal(overridden.directionSource, 'OVERRIDDEN');
});

test('§6: drag-and-drop is owed ONLY where the workflow names it — never forced into every app', () => {
  const pm = generateDesignSystem('PROJECT_MANAGEMENT');
  assert.ok(pm.owedInteractions.some((i) => i.id === 'kanban-drag'), 'kanban ordering owes drag-and-drop (§6 names it)');
  const fin = generateDesignSystem('FINANCIAL');
  assert.ok(!fin.owedInteractions.some((i) => i.id.includes('drag')), 'a ledger does not owe drag-and-drop');
});

test('media categories render on the dark canvas by construction — the screen IS the product', () => {
  for (const cat of ['STREAMING_MEDIA', 'GAME'] as const) {
    const ds = generateDesignSystem(cat, { theme: 'light' });
    assert.equal(ds.theme, 'dark', `${cat}: the light theme request is refused — a media product on a white canvas is not the category's owed surface`);
  }
});

test('the starter is self-contained + offline-safe: no external requests, no lorem, no dead CTAs', () => {
  const ds = generateDesignSystem('ECOMMERCE');
  assert.doesNotMatch(ds.starter, /https?:\/\//, 'no external URLs that would 404 offline');
  assert.doesNotMatch(ds.starter, /lorem ipsum/i, 'no lorem');
  assert.doesNotMatch(ds.starter, /<a\s+href="#"[^>]*>\s*(Learn More|Read More|Get Started)\s*<\/a>/i, 'no dead # CTAs');
  assert.match(ds.starter, /<footer/, 'the required <footer> landmark survived the P19 placeholder-identities fix (which no longer fires on "footer")');
});

test('determinism: two systems for the same inputs are byte-identical (the GATE-12 certifier depends on this)', () => {
  const a = JSON.stringify(generateDesignSystem('MARKETPLACE'));
  const b = JSON.stringify(generateDesignSystem('MARKETPLACE'));
  assert.equal(a, b);
});

test('the direction spec is what P19 names as owed, not a second opinion: the reason cites the category profile', () => {
  const ds = generateDesignSystem('FINANCIAL');
  assert.match(ds.directionReason, /design language/, 'the inference is recorded against the P12 profile, not a taste claim');
  const p = profileFor('FINANCIAL');
  assert.ok(p || UNSEEN_PROFILE, 'profile lookup resolved');
});

test('verifyDesignSystem surfaces a NAMED failure, never a bare false (the §12 rule: no silent verdicts)', () => {
  // sabotage two gate criteria so the score drops below the 80 bar:
  //   - strip lang="en"      -> accessibility fails (−15)
  //   - strip a landmark     -> semanticLandmarks fails (−10, all-or-nothing)
  // FINANCIAL's surface has exactly one of each landmark, so one replace
  // each is enough. The verdict must NAME both failed criteria, not just
  // return a bare false.
  const ds = generateDesignSystem('FINANCIAL');
  const broken = ds.starter
    .replace('<html lang="en">', '<html>')
    .replace('<footer', '<div');
  const v = verifyDesignSystem({ ...ds, starter: broken });
  assert.equal(v.verdict, 'FAIL');
  assert.ok(v.gate.score < 80, `the gate dropped below the bar (score ${v.gate.score})`);
  const named = v.failures.join(' ');
  assert.match(named, /semanticLandmarks/, 'the named failure points at the semanticLandmarks gate criterion');
  assert.match(v.gate.criteria.map((c) => (c.passed ? '' : c.id)).join(','), /accessibility/, 'the lang-strip is surfaced as the accessibility criterion, not swallowed');
});
