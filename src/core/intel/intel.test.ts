/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE · REQUIREMENT/DECISION/COMPOSITION GATES
 * (src/core/intel/intel.test.ts) · Created by Tabrej
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyRequirement } from './requirements';
import { validateDecisionRecord, renderDecisionMarkdown, type DecisionRecord } from './decisionRecords';
import { evaluateCompletion, obligatedCriteria, COMPLETION_CRITERIA, type CriterionVerdict } from './completion';
import { composeSkills } from './skillComposer';

test('a money task with no stated jurisdiction demands a clarification (never silently invents rules)', () => {
  const r = classifyRequirement({ task: 'Build a complete GST invoice system' });
  assert.equal(r.depth, 'COMPLEX');
  assert.ok(r.domains.includes('FINANCE'));
  assert.ok(r.domains.includes('ECONOMY_GST'));
  assert.ok(r.mustAsk.some((m) => m.facet === 'BUSINESS_RULES' && /jurisdiction/i.test(m.question)));
});

test('naming the jurisdiction resolves the material unknown', () => {
  const r = classifyRequirement({ task: 'Build a complete GST invoice system for India, tax-exclusive' });
  assert.equal(r.depth, 'COMPLEX');
  assert.equal(r.mustAsk.length, 0);
});

test('a simple local edit stays simple — not over-engineered', () => {
  const r = classifyRequirement({ task: 'Fix the typo in the header' });
  assert.equal(r.depth, 'SIMPLE');
  assert.deepEqual(r.obligatedFacets, ['PRIMARY_OBJECTIVE', 'INTENDED_OUTCOME', 'FUNCTIONAL', 'EDGE_CASES']);
});

test('a money task without jurisdiction or tax-mode is flagged, not guessed', () => {
  const r = classifyRequirement({ task: 'add a total field to the invoice' });
  assert.ok(r.mustAsk.some((m) => /jurisdiction/i.test(m.question)), 'asks which jurisdiction');
  assert.ok(r.mustAsk.some((m) => /inclusive|exclusive/i.test(m.question)), 'asks tax mode');
});

test('a decision record missing its SELECTED alternative or verification is invalid', () => {
  const bad: DecisionRecord = {
    id: 'X', decision: 'd', requirements: [],
    alternatives: [{ name: 'a', verdict: 'REJECTED', reason: 'r' }],
    selected: 'a', justification: 'j', risks: [], assumptions: [], verificationMethod: '',
  };
  const problems = validateDecisionRecord(bad);
  assert.ok(problems.some((p) => p.includes('SELECTED')));
  assert.ok(problems.some((p) => p.includes('verification')));
});

test('a complete record renders to deterministic, non-empty Markdown', () => {
  const good: DecisionRecord = {
    id: 'Y', decision: 'd', requirements: ['r1'],
    alternatives: [{ name: 'a', verdict: 'REJECTED', reason: 'r' }, { name: 'b', verdict: 'SELECTED', reason: 'better' }],
    selected: 'b', justification: 'j', risks: ['k'], assumptions: ['u'], verificationMethod: 'run the test',
  };
  assert.deepEqual(validateDecisionRecord(good), []);
  const md = renderDecisionMarkdown(good);
  assert.match(md, /Decision Y/);
  assert.match(md, /b \|\s*\*\*SELECTED\*\*/);
  assert.match(md, /Verification/);
});

test('completion: a met criterion without evidence is a DEFECT, not a pass', () => {
  const verdicts: CriterionVerdict[] = COMPLETION_CRITERIA.map((c) => ({ criterion: c, met: true })); // no evidence
  const rep = evaluateCompletion(verdicts);
  assert.equal(rep.status, 'INCOMPLETE');
  assert.equal(rep.metWithoutEvidence.length, COMPLETION_CRITERIA.length);
});

test('completion: all-criteria-met WITH evidence is COMPLETE', () => {
  const verdicts: CriterionVerdict[] = COMPLETION_CRITERIA.map((c) => ({
    criterion: c, met: true, evidence: { kind: 'TEST_SUITE', detail: c, reference: 'x.test.ts' },
  }));
  const rep = evaluateCompletion(verdicts);
  assert.equal(rep.status, 'COMPLETE');
  assert.equal(rep.met, 11);
  assert.equal(rep.metWithoutEvidence.length, 0);
});

test('a single failed criterion makes the whole build INCOMPLETE (the new quality standard)', () => {
  const verdicts: CriterionVerdict[] = COMPLETION_CRITERIA.map((c) => ({
    criterion: c, met: c !== 'SECURITY',
    evidence: c === 'SECURITY' ? undefined : { kind: 'TEST_SUITE', detail: c, reference: 'x' },
    gap: c === 'SECURITY' ? 'security suite not run' : undefined,
  }));
  assert.equal(evaluateCompletion(verdicts).status, 'INCOMPLETE');
});

test('obligated criteria are proportional: a backend money task does not owe CREATIVE_QUALITY', () => {
  const backend = obligatedCriteria('COMPLEX', false);
  assert.ok(backend.includes('MATHEMATICAL_CORRECTNESS'));
  assert.ok(backend.includes('DOMAIN_CORRECTNESS'));
  assert.ok(!backend.includes('CREATIVE_QUALITY'), 'no design surface -> no creative-quality obligation');
  const ui = obligatedCriteria('COMPLEX', true);
  assert.ok(ui.includes('CREATIVE_QUALITY'));
  assert.ok(ui.includes('ACCESSIBILITY'));
});

test('skill composition is minimal and deterministic: a pure money system skips pure design skills', () => {
  const backend = composeSkills({ task: 'Build a complete GST invoice and billing system', domains: ['FINANCE', 'ECONOMY_GST'], depth: 'COMPLEX' });
  assert.ok(backend.skillIds.includes('tax-compliance'));
  assert.ok(backend.skillIds.includes('financial-calcs'));
  assert.ok(backend.skillIds.includes('security-review'), 'money is a security obligation');
  // no pure-creative design skill on a backend task
  assert.ok(!backend.skillIds.includes('creative-direction'));
  // a UI task DOES compose the design skills
  const uiReq = { task: 'Build a dashboard UI with a polished brand', domains: ['FINANCE'], depth: 'COMPLEX' as const };
  const ui = composeSkills(uiReq);
  assert.ok(ui.skillIds.includes('design-systems'));
  assert.ok(ui.skillIds.includes('creative-direction'));
  // determinism: same input -> same output
  assert.deepEqual(composeSkills(uiReq), composeSkills(uiReq));
});

test('skill composition records skipped skills — selectivity is auditable, not silent', () => {
  const c = composeSkills({ task: 'Fix the typo in the header', domains: [], depth: 'SIMPLE' });
  assert.ok(c.skipped.length > 0);
  for (const s of c.skipped) assert.match(s.reason, /not obligated at depth SIMPLE/);
});
