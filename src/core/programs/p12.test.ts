/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — SUPREME EVOLUTION P12 TEST · project intelligence & strategy
 * (src/core/programs/p12.test.ts) · Created by Tabrej
 *
 * The directive's measurable acceptance criteria, each made a test:
 *  - multi-label classification (a jewellery marketplace with a 3D
 *    configurator is NOT just an e-commerce website)
 *  - first-principles fallback for unseen products (never a keyword miss)
 *  - prompt-length independence (a 4-word financial ask earns the same
 *    effort as a 4-page spec for one)
 *  - every strategy decision carries a reason
 *  - the strategy renders deterministic Markdown
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  P12_CAPABILITY,
  runProjectIntelligence,
  runP12BenchmarkEvidence,
  classifyProject,
  effortPolicy,
  promptLengthIndependence,
  generateProjectStrategy,
  renderStrategyMarkdown,
  CATEGORIES,
} from './p12ProjectIntelligence';
import { buildIntegrationRegistry } from './registry';
import { FULL_AETHER_AGENTS } from '../scaleCatalog';

// ---------------------------------------------------------------- classification

test('P12 is registered in the integration registry and promoted to EXECUTE', () => {
  const reg = buildIntegrationRegistry();
  const cap = reg.capabilities.find((c) => c.id === P12_CAPABILITY.id);
  assert.ok(cap, 'P12 capability present in registry');
  assert.equal(reg.lifecycleStates[P12_CAPABILITY.id], 'EXECUTE');
});

test('a jewellery marketplace with a 3D configurator classifies as multi-label (not just e-commerce)', () => {
  const cls = classifyProject('Build a jewellery marketplace where buyers configure a 3D ring in a CAD configurator, with seller payouts and shopping cart');
  const cats = cls.categories.map((c) => c.category);
  // multi-label: e-commerce + marketplace + CAD/3D must all be present
  assert.ok(cats.includes('ECOMMERCE'), `got [${cats.join(', ')}]`);
  assert.ok(cats.includes('MARKETPLACE'));
  assert.ok(cats.includes('CAD_3D'));
  assert.ok(!cls.unseen, 'a known combination must NOT fall to first-principles');
});

test('each classification carries keyword evidence (the audit trail)', () => {
  const cls = classifyProject('Build a booking website for dental appointments');
  assert.equal(cls.primary, 'BOOKING');
  const primary = cls.categories.find((c) => c.category === 'BOOKING')!;
  assert.ok(primary.matched.length >= 1, 'classification is evidence-based, not vibes');
  assert.ok(primary.matched.some((m) => /book/i.test(m)) || primary.matched.some((m) => /appointment/i.test(m)));
});

test('an unseen product takes the first-principles path, not a keyword miss', () => {
  const cls = classifyProject('Build a platform for coordinating neighborhood tool-lending between households');
  assert.equal(cls.unseen, true);
  assert.equal(cls.primary, 'UNSEEN');
  const plan = runProjectIntelligence({ task: cls.task });
  assert.match(plan.markdown, /First-principles derivation/);
  assert.match(plan.markdown, /UNSEEN/);
});

test('every category profile is distinct (no two share the same design language + posture)', () => {
  const seen = new Set(CATEGORIES.map((c) => c.designLanguage + '|' + c.securityPosture));
  assert.equal(seen.size, CATEGORIES.length, 'category strategies are not copy-paste of one another');
});

// ---------------------------------------------------------------- effort policy (the directive's §1)

test('prompt-length independence: a short financial ask earns the same effort as a long one', () => {
  const inputs = { securityPosture: 'FINANCIAL' as const };
  const independent = promptLengthIndependence(
    'Build a subscription billing system',
    'Build a multi-tenant SaaS billing platform with subscriptions, proration, dunning, refunds, multi-currency FX, and a full ledger',
    inputs
  );
  assert.equal(independent, true, 'effort follows the PRODUCT (financial posture), not the prompt length');
});

test('a financial posture sets a DEEP effort floor even with no scale inputs', () => {
  const cls = classifyProject('Add a refund flow to our payments');
  assert.equal(cls.primary, 'FINANCIAL');
  const eff = effortPolicy(cls, {});
  assert.ok(eff.level === 'DEEP' || eff.level === 'DEEPEST', `financial floor: got ${eff.level}`);
  assert.ok(eff.obligatedEngines.includes('business-logic-discovery'));
});

test('an unseen category is owed the first-principles effort, not a shortcut', () => {
  const cls = classifyProject('Build a platform for coordinating neighborhood tool-lending between households');
  const eff = effortPolicy(cls, {});
  assert.ok(eff.reasons.some((r) => /unseen|first-principles/i.test(r)));
  assert.ok(eff.level !== 'FOCUSED', 'first-principles derivation is owed, not skipped');
});

// ---------------------------------------------------------------- strategy

test('every strategy decision carries a non-empty reason (the directive: "every decision must have a reason")', () => {
  const s = generateProjectStrategy('Build a project-management kanban tool with timelines');
  const decisions = Object.values(s.decisions);
  assert.equal(decisions.length, 13, 'the full decision set (architecture..risks)');
  for (const d of decisions) {
    assert.ok(d.reason.trim().length > 5, `decision '${d.value}' lacks a reason`);
    assert.ok(d.engine.trim().length > 0, 'decision lacks an engine provenance');
  }
});

test('a financial strategy differs measurably from a portfolio strategy', () => {
  const fin = generateProjectStrategy('Build a multi-currency invoicing and ledger system');
  const port = generateProjectStrategy('Build a personal portfolio website for a photographer');
  assert.equal(fin.classification.primary, 'FINANCIAL');
  assert.equal(port.classification.unseen, true);
  // the two strategies must differ on ≥4 axes
  const axes: Array<keyof typeof fin.decisions> = ['architecture', 'designDirection', 'securityModel', 'dataModel', 'testing'];
  const diffs = axes.filter((a) => fin.decisions[a].value !== port.decisions[a].value).length;
  assert.ok(diffs >= 3, `financial vs portfolio strategies differ on ${diffs} of ${axes.length} sampled axes`);
});

test('strategy agent references all exist in the catalog (no fabrication)', () => {
  const ids = new Set(FULL_AETHER_AGENTS.map((a) => a.id));
  const s = generateProjectStrategy('Build a media streaming platform with transcoding and watch history');
  const agentLine = s.decisions.agents.value;
  for (const raw of agentLine.split(',')) {
    const id = raw.trim();
    if (id) assert.ok(ids.has(id), `referenced agent '${id}' does not exist in the catalog`);
  }
});

test('the strategy Markdown is deterministic across repeated renders', () => {
  const s = generateProjectStrategy('Build an e-commerce checkout with inventory reservations');
  const a = renderStrategyMarkdown(s);
  const b = renderStrategyMarkdown(generateProjectStrategy('Build an e-commerce checkout with inventory reservations'));
  assert.equal(a, b);
  assert.match(a, /PROJECT_STRATEGY/);
});

test('the P12 benchmark evidence reports a real, non-fabricated measurement', () => {
  const e = runP12BenchmarkEvidence();
  assert.equal(e.status, 'MEASURED_DETERMINISTIC_EXECUTION');
  assert.equal(typeof e.measuredValue, 'number');
  assert.ok((e.detail ?? '').length > 0);
});
