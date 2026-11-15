/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P19 TEST · design-taste layer
 * (src/core/design/designTaste.test.ts) · Created by Tabrej
 *
 * Roadmap P-S2 acceptance: a deliberately-generic artifact scores BELOW a
 * category-appropriate one, and the delta is nameable from the scorecard
 * (unmet expectations + slop signals are listed, not just a number). The
 * slop detector fires on a seeded template; the gate itself
 * (designGate.ts) is untouched — P19 extends, never replaces.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { detectTemplateSlop, scoreDesignFit } from './designTaste';

// a seeded "AI template slop" artifact: aurora gradient, indigo+pink,
// card-everywhere, fake stats, lorem, a dead CTA
const SLOPPY = `
<html lang="en"><head><meta name="viewport" content="width=device-width"></head>
<body style="background:#0f0f14;color:#fff">
<section class="card rounded-2xl" style="background:conic-gradient(from 180deg,#6366f1,#ec4899,#4f46e5,#6366f1)">
  <h1>The Future of Everything, Seamlessly</h1>
  <p>Empower your workflow and unleash the next-generation of productivity. 10,000+ users trust us. 99.9% uptime.</p>
  <a href="#">Learn More</a>
</section>
<section class="card rounded-2xl"><p>Lorem ipsum dolor sit amet</p><button></button></section>
<section class="card rounded-2xl"><p>John Doe — Acme Inc</p></section>
<section class="card rounded-2xl"><img src="https://picsum.photos/200" alt="placeholder"></section>
</body></html>`;

// a FINANCIAL artifact: a dense ledger view, tabular numerals, status
// colors, no gradient hero — the design language a FINANCIAL product owes
const FINANCIAL = `
<html lang="en"><head><meta name="viewport" content="width=device-width"><style>
:root{--ink:#111418;--paper:#f5f6f7;--ok:#1f7a4d;--warn:#c98a2b;--err:#b3261e}
body{font-size:14px;font-variant-numeric:tabular-nums;background:var(--paper);color:var(--ink)}
table{border-collapse:collapse}
</style></head>
<body>
<header><h1>Reconciliation — FY26</h1></header>
<main>
<table aria-label="reconciliation ledger">
  <thead><tr><th>Ref</th><th>Debit</th><th>Credit</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>R-1041</td><td>1,234.00</td><td>—</td><td class="status success">settled</td></tr>
    <tr><td>R-1042</td><td>—</td><td>990.00</td><td class="status warn">pending review</td></tr>
    <tr><td>R-1043</td><td>410.55</td><td>410.55</td><td class="status error">discrepancy</td></tr>
  </tbody>
</table>
<p>Delta: ₹410.55 unreconciled — named, not absorbed.</p>
</main>
</body></html>`;

test('the slop detector fires on a seeded template and names every tell', () => {
  const r = detectTemplateSlop(SLOPPY);
  const ids = r.signals.map((s) => s.id);
  for (const expected of ['aurora-gradient-blob', 'default-indigo-pink', 'every-section-card', 'fake-big-stats', 'lorem-ipsum', 'placeholder-identities', 'stock-or-placeholder-images']) {
    assert.ok(ids.includes(expected), `the '${expected}' tell is detected`);
  }
  assert.ok(r.slopPenalty >= 50, `the cumulative penalty is heavy (got ${r.slopPenalty}/${r.maxSlopPenalty})`);
});

test('a clean artifact carries no slop signals', () => {
  const r = detectTemplateSlop(FINANCIAL);
  assert.equal(r.signals.length, 0, JSON.stringify(r.signals, null, 2));
  assert.equal(r.slopPenalty, 0);
});

test('roadmap acceptance: a generic artifact scores below a category-appropriate one, with the delta named', () => {
  const generic = scoreDesignFit(SLOPPY, 'FINANCIAL');
  const fit = scoreDesignFit(FINANCIAL, 'FINANCIAL');
  assert.ok(fit.score > generic.score, `fitting (${fit.score}) must beat generic (${generic.score})`);
  // the delta is NAMEABLE: the generic one has unmet expectations + slop;
  // the fitting one has no slop and meets its owed language
  assert.ok(generic.slop.signals.length > 0, 'the generic artifact carries named slop tells');
  assert.equal(fit.slop.signals.length, 0, 'the fitting artifact carries no slop');
  const unmet = generic.expectations.filter((e) => !e.met);
  assert.ok(unmet.length > 0, 'the generic artifact misses named expectations');
  assert.match(unmet[0].owed, /tabular|dense|data/i, 'the first unmet expectation is a named owed language');
  // a concrete, checkable gap: the financial table is absent from the generic one
  assert.ok(unmet.some((e) => e.id === 'data-density'), 'the data-density obligation is named');
});

test('FINANCIAL owes density + status semantics, not hero marketing', () => {
  const r = scoreDesignFit(FINANCIAL, 'FINANCIAL');
  const ids = r.expectations.map((e) => e.id);
  for (const owed of ['data-density', 'status-colors', 'clarity-over-decor']) assert.ok(ids.includes(owed));
  assert.ok(r.expectations.filter((e) => e.met).length >= 3, 'the financial artifact meets its owed language');
});

test('the design language string comes from the P12 profile (composition, not a copy)', () => {
  const r = scoreDesignFit(FINANCIAL, 'FINANCIAL');
  assert.match(r.designLanguage, /financial|dense|tabular|status/i, 'the P12 profile words carry through');
  const unseen = scoreDesignFit(FINANCIAL, 'UNSEEN');
  assert.match(unseen.designLanguage, /first-principles/i, 'an unseen category says so plainly');
});

test('a dev-tool page owes monospace + code surfaces', () => {
  const page = `<html lang="en"><head><style>code{font-family:ui-monospace}</style></head><body><pre><code>GET /api/v1/x</code></pre></body></html>`;
  const r = scoreDesignFit(page, 'DEVTOOLS');
  assert.ok(r.expectations.some((e) => e.id === 'monospace' && e.met), 'monospace is met');
  assert.ok(r.expectations.some((e) => e.id === 'code-surfaces' && e.met), 'code surfaces are met');
});

test('scoreDesignFit is deterministic: two runs over the same input are byte-identical', () => {
  const a = JSON.stringify(scoreDesignFit(SLOPPY, 'FINANCIAL'));
  const b = JSON.stringify(scoreDesignFit(SLOPPY, 'FINANCIAL'));
  assert.equal(a, b);
});
