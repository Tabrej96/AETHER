/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 10 INTEGRATION TEST · deep execution intelligence
 * (src/core/programs/p10.test.ts) · Created by Tabrej
 *
 * A capability is "integrated" only when it is reachable through an AETHER
 * interface, executes real deterministic work, handles failure safely, and
 * passes this test. P10 is the operator's deep-thinking directive: the plan
 * must be deterministic, the calculation exact, and the completion gate
 * honest (never fabricate evidence).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  P10_CAPABILITY,
  runDeepExecution,
  runP10BenchmarkEvidence,
  renderPlanMarkdown,
} from './p10DeepExecutionIntelligence';
import { buildIntegrationRegistry } from './registry';

const GST_REQUEST = {
  task: 'Build a complete GST invoice and billing system for a Cofi coffee supplier in India',
  invoice: {
    taxMode: 'EXCLUSIVE' as const,
    jurisdiction: 'IN' as const,
    placeOfSupply: { supplierRegion: 'MH', buyerRegion: 'DL' }, // inter-state -> IGST
    lines: [
      { lineId: 'l1', description: 'Cold Brew 1L', quantityMilli: 1000, pricePaise: 45000, rateId: 'GST-18', hsnSac: '2106' },
      { lineId: 'l2', description: 'Brew Kit', quantityMilli: 1250, pricePaise: 32000, rateId: 'GST-12', hsnSac: '4418' },
    ],
    clientAssertedTotalPaise: 12345, // wrong on purpose
  },
};

test('P10 is registered in the integration registry and promoted to EXECUTE', () => {
  const reg = buildIntegrationRegistry();
  const cap = reg.capabilities.find((c) => c.id === P10_CAPABILITY.id);
  assert.ok(cap, 'P10 capability present in registry');
  assert.equal(reg.lifecycleStates[P10_CAPABILITY.id], 'EXECUTE');
  assert.equal(cap!.lifecycleState, 'EXECUTE');
});

test('a complex GST plan is deterministic across repeated runs', () => {
  const a = runDeepExecution(GST_REQUEST);
  const b = runDeepExecution(GST_REQUEST);
  assert.equal(a.requirement.depth, 'COMPLEX');
  assert.equal(a.skills.skillIds.join(','), b.skills.skillIds.join(','), 'skill composition deterministic');
  assert.equal(a.calculation!.breakdown.grandTotalPaise, b.calculation!.breakdown.grandTotalPaise);
  assert.equal(a.completion.report.status, b.completion.report.status);
});

test('inter-state GST produces a single IGST component and a verifiable provenance', () => {
  const p = runDeepExecution(GST_REQUEST);
  const b = p.calculation!.breakdown;
  assert.ok(b.components.every((c) => c.code === 'IGST'), 'inter-state -> IGST only');
  assert.ok(b.taxPaise > 0);
  assert.ok(b.provenance.every((pv) => pv.source.trim() && pv.effectiveOnIso), 'rate provenance recorded');
  // the calculation is exact: grand = taxable + tax (no additional charges here)
  assert.equal(b.grandTotalPaise, b.taxableValuePaise + b.taxPaise + b.additionalChargesPaise);
});

test('the client-total tamper guard rejects a mismatching asserted total', () => {
  const p = runDeepExecution(GST_REQUEST);
  const cv = p.calculation!.clientTotalVerified;
  assert.equal(cv.ok, false, '12345p is not the correct total');
  assert.equal(cv.deltaPaise, 12345 - cv.serverTotalPaise);
  // a correctly-asserted total verifies
  const good = runDeepExecution({ ...GST_REQUEST, invoice: { ...GST_REQUEST.invoice!, clientAssertedTotalPaise: cv.serverTotalPaise } });
  assert.equal(good.calculation!.clientTotalVerified.ok, true);
});

test('the plan renders an auditable Markdown record with decision tables + completion verdict', () => {
  const p = runDeepExecution(GST_REQUEST);
  const md = renderPlanMarkdown(p);
  assert.match(md, /Deep Execution Plan/);
  assert.match(md, /IGST/);
  assert.match(md, /Decision/);
  assert.match(md, /client-total guard/);
});

test('the P10 benchmark evidence reports a real, non-fabricated measurement', () => {
  const e = runP10BenchmarkEvidence();
  assert.equal(e.status, 'MEASURED_DETERMINISTIC_EXECUTION');
  assert.equal(typeof e.measuredValue, 'number');
  assert.ok((e.detail ?? '').length > 0, 'evidence detail is real, not a placeholder');
});
