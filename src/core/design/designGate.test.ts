/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * DETERMINISTIC DESIGN GATE — TESTS
 * (src/core/design/designGate.test.ts)
 *
 * Run: npx tsx --test src/core/design/designGate.test.ts
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { designBriefFor, auditDesignHtml, premiumReferenceShowcasePath } from './designGate';

const here = path.dirname(fileURLToPath(import.meta.url));
const showcaseHtml = fs.readFileSync(path.join(here, 'showcase', 'cofi-shop-award.html'), 'utf8');

/** the "AI slop" sample: plain white page, one gray, no structure, no thought */
const SLOP_HTML = `<!doctype html>
<html>
<head><title>shop</title></head>
<body style="background:#fff; color:#888888; font-size:14px">
<div>
<div style="color:#888">Buy coffee. $4.</div>
<div>Buy tea. $3.</div>
<button onclick="void 0">add</button>
</div>
</body>
</html>`;

test('the hand-authored award-level showcase passes the design audit (>= 80)', () => {
  const audit = auditDesignHtml(showcaseHtml);
  const failed = audit.criteria.filter((c) => !c.passed);
  assert.ok(
    audit.pass,
    `showcase must pass; got ${audit.score}/100, failing criteria: ${failed.map((c) => `${c.id}(${c.score} ${c.detail})`).join('; ')}`
  );
  assert.ok(audit.score >= 80, `showcase score ${audit.score} must be >= 80`);
  // every criterion should report real detail, not empty strings
  for (const c of audit.criteria) assert.ok(c.detail.length > 0, `criterion ${c.id} must have detail`);
});

test('known-slop HTML fails the design audit (< 80)', () => {
  const audit = auditDesignHtml(SLOP_HTML);
  assert.ok(!audit.pass, `slop must fail; got ${audit.score}/100`);
  assert.ok(audit.score < 80, `slop score ${audit.score} must be < 80`);
  const ids = audit.criteria.map((c) => c.id);
  for (const need of ['paletteRichness', 'contrast', 'semanticLandmarks', 'accessibility', 'responsive', 'typographyHierarchy']) {
    assert.ok(ids.includes(need), `slop audit must score criterion ${need}`);
  }
  const byId = new Map(audit.criteria.map((c) => [c.id, c]));
  assert.equal(byId.get('semanticLandmarks')!.passed, false, 'slop has no landmarks');
  assert.equal(byId.get('paletteRichness')!.passed, false, 'slop has < 4 colors');
  assert.equal(byId.get('responsive')!.passed, false, 'slop has no viewport meta');
});

test('designBriefFor is deterministic (same spec + requirements -> identical brief)', () => {
  const a = designBriefFor('Build me a Cofi shop Website');
  const b = designBriefFor('Build me a Cofi shop Website');
  assert.deepEqual(a, b);
  const c = designBriefFor('Build a fintech dashboard', ['use green', 'serif headers']);
  const d = designBriefFor('Build a fintech dashboard', ['use green', 'serif headers']);
  assert.deepEqual(c, d);
});

test('an operator color requirement is echoed into the brief (green -> green accent)', () => {
  const brief = designBriefFor('Build a landing page', ['use green for the accent']);
  const accent = brief.palette.find((p) => p.role.startsWith('accent'));
  assert.ok(accent, 'brief must have an accent color');
  const echoed =
    JSON.stringify(brief.palette).toLowerCase().includes('green') ||
    brief.concept.toLowerCase().includes('green') ||
    accent!.hex.toLowerCase() === '#2f7d4f';
  assert.ok(echoed, `requirement "use green" must land in the palette/concept; got accent ${accent!.hex}, why: ${accent!.why}`);
  // distinct specs should generally pick distinct identities (no two of 24 probes collide on palette)
  const palettes = new Set(
    Array.from({ length: 24 }, (_, i) => designBriefFor(`project number ${i}`)).map((b) => JSON.stringify(b.palette.map((p) => p.hex)))
  );
  assert.ok(palettes.size >= 3, `24 distinct specs should map to >=3 distinct palettes (got ${palettes.size})`);
});

test('premiumReferenceShowcasePath points at a real file in the repo', () => {
  const rel = premiumReferenceShowcasePath();
  // repo root = three levels up from this test file (src/core/design -> repo)
  const repoRoot = path.join(here, '..', '..', '..');
  const abs = path.join(repoRoot, rel);
  assert.ok(fs.existsSync(abs), `showcase file must exist at ${rel}`);
  assert.equal(path.basename(rel), 'cofi-shop-award.html');
});
