/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 10 · LIVE DEEP-INTELLIGENCE DEMO TEST
 * (src/core/intel/deepDemo.test.ts) · Created by Tabrej
 *
 * Proves P10 executes real work: a genuine inter-state GST invoice computed
 * in exact paise, the tamper guard rejecting a wrong total, a self-contained
 * award-level page that passes the design audit, and (when a browser exists)
 * a live click whose verdict state-change is screenshot-verified. No browser
 * -> honest UNAVAILABLE, never a fabricated pass.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildDeepDemoInvoice, runDeepIntelligenceDemo, renderInvoicePage } from './deepDemo';
import { findChrome } from '../browser/cdp';
import { auditDesignHtml } from '../design/designGate';

/**
 * Hand-computed exact values for the inter-state demo scenario (verified by
 * independent arithmetic, then asserted against the engine):
 *   lines: 85000 + 2.5×62000(155000) + 45000 = 285000p
 *   10% discount = 28500p -> taxable 256500p
 *   IGST per post-discount line: round(76500×1800/10000)+round(139500×1200/10000)+round(40500×1800/10000)
 *        = 13770 + 16740 + 7290 = 37800p
 *   grand = 256500 + 37800 + 25000(packing) = 319300p
 */
const EXPECTED = {
  subtotalPaise: 285000,
  discountPaise: 28500,
  taxableValuePaise: 256500,
  taxPaise: 37800,
  grandTotalPaise: 319300,
};

test('the demo invoice is exact, inter-state, and its tamper guard fires', () => {
  const inv = buildDeepDemoInvoice();
  const b = inv.breakdown;
  assert.equal(b.subtotalPaise, EXPECTED.subtotalPaise);
  assert.equal(b.discountPaise, EXPECTED.discountPaise);
  assert.equal(b.taxableValuePaise, EXPECTED.taxableValuePaise);
  assert.equal(b.taxPaise, EXPECTED.taxPaise, 'exact IGST (post-discount base)');
  assert.equal(b.grandTotalPaise, EXPECTED.grandTotalPaise);
  // inter-state -> a single IGST component
  assert.deepEqual(b.components.map((c) => c.code), ['IGST']);
  // the guard: a wrong asserted total is rejected, the correct one verifies
  assert.equal(inv.tamperTest.wrong.ok, false);
  assert.equal(inv.tamperTest.correct.ok, true);
  assert.equal(inv.tamperTest.correct.serverTotalPaise, EXPECTED.grandTotalPaise);
});

test('the demo invoice page is self-contained, prints exact paise figures, and audits clean', () => {
  const inv = buildDeepDemoInvoice();
  const page = renderInvoicePage(inv);
  // self-contained: no external CDNs / fonts / scripts
  assert.doesNotMatch(page, /https?:\/\//, 'no external resources');
  // exact figures are printed from integer paise (no float drift, no commas)
  assert.match(page, /3193\.00/, 'grand total rendered exactly');
  assert.match(page, /IGST/, 'inter-state component named');
  // the wrong asserted total (grand − ₹18000) is embedded for the live check
  assert.match(page, /3013\.00/, 'wrong asserted total rendered for the live check');
  // it passes the design floor
  const audit = auditDesignHtml(page);
  assert.ok(audit.pass, `design audit ${audit.score}/100 must be >= 80`);
});

test('runDeepIntelligenceDemo (no browser) writes a real report with plan + calculation', async () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-deep-nobrowser-'));
  const rep = await runDeepIntelligenceDemo(outDir, false);
  assert.equal(rep.status, 'MEASURED_DEEP_DEMO');
  assert.equal(rep.grandTotalPaise, EXPECTED.grandTotalPaise);
  assert.equal(rep.tamperGuardFired, true);
  assert.ok(rep.designAuditPass, 'the invoice page passes the design floor');
  assert.ok(rep.designAuditScore! >= 80);
  const reportPath = path.join(outDir, 'deep-demo-report.json');
  assert.ok(fs.existsSync(reportPath), 'report written to disk');
  const written = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.match(written.planMarkdown, /Deep Execution Plan/);
  assert.match(written.planMarkdown, /IGST/);
});

test('live browser recompute: the page verifies its own totals and rejects the wrong total', { timeout: 60_000 }, async () => {
  if (findChrome() == null) {
    console.log('SKIP: no chrome/edge binary on this machine — live demo case not runnable here');
    return;
  }
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-deep-live-'));
  const rep = await runDeepIntelligenceDemo(outDir, true);
  assert.equal(rep.status, 'MEASURED_DEEP_DEMO');
  assert.equal(rep.stateChangeVerified, true, 'click produced a REJECTED verdict (state change)');
  assert.equal(rep.pageRecomputeMatchesServer, true, 'page-side integer recompute == server engine total');
  assert.ok(fs.existsSync(rep.screenshotBefore!), 'before screenshot captured');
  assert.ok(fs.existsSync(rep.screenshotAfter!), 'after screenshot captured');
});
