/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — UNIVERSAL BENCHMARK ADAPTER PROGRAM TESTS
 * (src/core/benchmarks/universal.test.ts)
 *
 * Exercises the full pipeline on realistic fixture traces:
 *   detect -> convert -> finalize (genuine SHA-256 resultId) -> status matrix.
 * And asserts the anti-fabrication rules:
 *   - verifiedPass:true is refused without a terminal-success note AND assertions
 *   - an unparseable present trace is INCONCLUSIVE, never a pass
 *   - a missing trace is UNAVAILABLE carrying its re-measure command
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  finalizeUniversalResult,
  UNIVERSAL_BENCHMARK_SCHEMA,
  canonicalJson,
} from './universalFormat';
import {
  BenchmarkAdapterRegistry,
  buildStatusMatrix,
  type ExternalTrace,
} from './adapterEngine';
import {
  buildUniversalAdapterRegistry,
  createPlaywrightAdapter,
  createOpenHandsAdapter,
  createOpenManusAdapter,
  createAutoGenAdapter,
  createBrowserUseAdapter,
} from './adapters';

const FIX = path.join(process.cwd(), 'fixtures', 'universal-benchmark');
const read = (f: string) => fs.readFileSync(path.join(FIX, f), 'utf8');
const task = { taskId: 'TASK-REAL-02', title: 'Concurrent ledger settlement', domain: 'CONCURRENCY_LEDGER' };

test('UNIVERSAL: registry contains the five real adapters, each self-consistent', () => {
  const reg = buildUniversalAdapterRegistry();
  assert.equal(reg.size, 5);
  const ids = reg.list().map((a) => a.adapterId).sort();
  assert.deepEqual(ids, ['autogen-conversation', 'browser-use-result', 'openhands-events', 'openmanus-log', 'playwright-json']);
  for (const spec of reg.list()) {
    // every adapter can produce an honest UNAVAILABLE cell
    const unavail = spec.unavailable(task, {});
    assert.equal(unavail.status, 'UNAVAILABLE');
    assert.equal(unavail.verifiedPass, null);
    assert.equal(unavail.schema, UNIVERSAL_BENCHMARK_SCHEMA);
    assert.ok(unavail.resultId.length === 64, 'unavailable cells carry a genuine 64-char SHA-256 resultId');
  }
});

test('UNIVERSAL: Playwright fixture converts to a MEASURED pass', () => {
  const trace: ExternalTrace = { sourceText: read('playwright-report.json'), source: 'fixtures/universal-benchmark/playwright-report.json' };
  const adapter = createPlaywrightAdapter();
  assert.ok(adapter.detect(trace.sourceText), 'detector must recognize a Playwright JSON report');
  const conv = adapter.convert(trace, task, {});
  const convErr = 'error' in conv ? conv.error.detail : null;
  assert.ok(convErr === null, `conversion should succeed: ${convErr ?? ''}`);
  if ('error' in conv) return;
  assert.equal(conv.status, 'MEASURED');
  assert.equal(conv.verifiedPass, true);
  assert.equal(conv.metrics.wallClockMs, 1284);
  assert.equal(conv.metrics.tokenClass, 'UNKNOWN');
  assert.equal(conv.verification.assertionsRun, 4);
  assert.ok(conv.externalCommandToReproduce?.includes('playwright test') ?? false);
});

test('UNIVERSAL: OpenHands fixture converts to a MEASURED success', () => {
  const trace: ExternalTrace = { sourceText: read('openhands-events.json'), source: 'fixtures/universal-benchmark/openhands-events.json' };
  const conv = createOpenHandsAdapter().convert(trace, task, {});
  assert.ok(!('error' in conv));
  if ('error' in conv) return;
  assert.equal(conv.status, 'MEASURED');
  assert.equal(conv.verifiedPass, true);
  assert.equal(conv.metrics.toolCalls, 2); // the two tool events (run_ipython, code_editor)
});

test('UNIVERSAL: OpenManus fixture terminal marker yields MEASURED', () => {
  const trace: ExternalTrace = { sourceText: read('openmanus-log.md'), source: 'fixtures/universal-benchmark/openmanus-log.md' };
  const conv = createOpenManusAdapter().convert(trace, task, {});
  assert.ok(!('error' in conv));
  if ('error' in conv) return;
  assert.equal(conv.status, 'MEASURED');
  assert.equal(conv.verifiedPass, true);
});

test('UNIVERSAL: AutoGen JSONL fixture requires a terminal success event', () => {
  const ok: ExternalTrace = { sourceText: read('autogen-conversation.jsonl'), source: 'fixtures/universal-benchmark/autogen-conversation.jsonl' };
  const good = createAutoGenAdapter().convert(ok, task, {});
  assert.ok(!('error' in good));
  if ('error' in good) return;
  assert.equal(good.verifiedPass, true, 'the fixture ends with a success event');
  assert.equal(good.metrics.toolCalls, 5);

  // Same conversation WITHOUT the terminal success event must not claim a pass.
  const lines = ok.sourceText.trim().split('\n').slice(0, 4);
  const noEnd: ExternalTrace = { sourceText: lines.join('\n'), source: 'in-memory truncated' };
  const truncated = createAutoGenAdapter().convert(noEnd, task, {});
  assert.ok(!('error' in truncated));
  if ('error' in truncated) return;
  assert.equal(truncated.verifiedPass, false, 'no terminal success event -> verifiedPass must be false, not fabricated');
});

test('UNIVERSAL: Browser-Use fixture carries MEASURED token class when the source records it', () => {
  const trace: ExternalTrace = { sourceText: read('browser-use-result.json'), source: 'fixtures/universal-benchmark/browser-use-result.json' };
  const conv = createBrowserUseAdapter().convert(trace, task, {});
  assert.ok(!('error' in conv));
  if ('error' in conv) return;
  assert.equal(conv.status, 'MEASURED');
  assert.equal(conv.verifiedPass, true);
  assert.equal(conv.metrics.totalTokens, 18340);
  assert.equal(conv.metrics.tokenClass, 'MEASURED');
  assert.equal(conv.metrics.costUsd, 0.42);
  assert.equal(conv.metrics.costClass, 'MEASURED');
});

test('UNIVERSAL: a present-but-malformed trace is INCONCLUSIVE, never a pass', () => {
  const reg = buildUniversalAdapterRegistry();
  // Case A: detector recognizes the format, but the required fields are broken
  // -> the "not convertible" branch.
  const recognized: Record<string, ExternalTrace | undefined> = {
    'playwright-json': { sourceText: '{"stats": {}, "suites": []}', source: 'in-memory malformed' },
  };
  const matrixA = buildStatusMatrix(reg, task, recognized);
  const pwCell = matrixA.cells.find((c) => c.adapterId === 'playwright-json')!;
  assert.equal(pwCell.status, 'INCONCLUSIVE');
  assert.equal(pwCell.verifiedPass, null);
  assert.match(pwCell.detail, /not convertible/);
  assert.equal(matrixA.inconclusive, 1);

  // Case B: a trace is present but no detector recognizes its shape -> the
  // "format not recognized" branch (refusing to convert blindly).
  const unrecognized: Record<string, ExternalTrace | undefined> = {
    'playwright-json': { sourceText: '{"suites": []}', source: 'in-memory unknown shape' },
  };
  const matrixB = buildStatusMatrix(reg, task, unrecognized);
  const cellB = matrixB.cells.find((c) => c.adapterId === 'playwright-json')!;
  assert.equal(cellB.status, 'INCONCLUSIVE');
  assert.match(cellB.detail, /not recognized|not convertible/);
});

test('UNIVERSAL: a missing trace yields UNAVAILABLE with its re-measure command', () => {
  const reg = buildUniversalAdapterRegistry();
  const matrix = buildStatusMatrix(reg, task, {});
  assert.equal(matrix.unavailable, 5);
  for (const cell of matrix.cells) {
    assert.equal(cell.status, 'UNAVAILABLE');
    assert.equal(cell.verifiedPass, null);
    assert.ok((cell.externalCommandToReproduce ?? '').length > 0, `${cell.adapterId} must carry a re-measure command`);
  }
});

test('UNIVERSAL: finalize refuses a fabricated verifiedPass', () => {
  // verifiedPass:true with zero assertions and no success note -> rejected.
  const bad = finalizeUniversalResult({
    taskRef: task,
    harnessRef: { adapterId: 'test', harnessName: 'Test' },
    status: 'MEASURED',
    verifiedPass: true,
    metrics: {},
    evidence: 'I said it passed',
    verification: { method: 'manual inspection', assertionsRun: 0 },
  });
  assert.ok('error' in bad, 'a verifiedPass without assertions/success-note must be refused');
  if ('error' in bad) assert.equal(bad.error.kind, 'FABRICATION_ATTEMPT');

  // The same claim with a genuine assertion + success note finalizes.
  const good = finalizeUniversalResult({
    taskRef: task,
    harnessRef: { adapterId: 'test', harnessName: 'Test' },
    status: 'MEASURED',
    verifiedPass: true,
    metrics: {},
    evidence: 'terminal success: all assertions passed',
    verification: { method: 'unit test suite', assertionsRun: 2 },
  });
  assert.ok(!('error' in good));
  if (!('error' in good)) assert.equal(good.resultId.length, 64);
});

test('UNIVERSAL: resultId is a genuine, stable, content-bound SHA-256', () => {
  const base = {
    taskRef: task,
    harnessRef: { adapterId: 'x', harnessName: 'X' },
    status: 'UNAVAILABLE' as const,
    metrics: {},
    evidence: 'daemon absent',
    verification: { method: 'n/a', assertionsRun: null },
    recordedAtIso: '2026-11-12T00:00:00.000Z',
  };
  const a = finalizeUniversalResult({ ...base });
  const b = finalizeUniversalResult({ ...base });
  const c = finalizeUniversalResult({ ...base, evidence: 'TAMPERED' });
  assert.ok(!('error' in a) && !('error' in b) && !('error' in c));
  if ('error' in a || 'error' in b || 'error' in c) return;
  assert.equal(a.resultId, b.resultId, 'identical content -> identical resultId (deterministic)');
  assert.notEqual(a.resultId, c.resultId, 'tampered content -> different resultId');
  // canonicalJson is key-order-independent (the hashing basis).
  assert.equal(canonicalJson({ a: 1, b: 2 }), canonicalJson({ b: 2, a: 1 }));
});

test('UNIVERSAL: detector disambiguates the five formats', () => {
  const reg = buildUniversalAdapterRegistry();
  const expect: Array<[string, string]> = [
    [read('playwright-report.json'), 'playwright-json'],
    [read('openhands-events.json'), 'openhands-events'],
    [read('browser-use-result.json'), 'browser-use-result'],
    [read('autogen-conversation.jsonl'), 'autogen-conversation'],
    [read('openmanus-log.md'), 'openmanus-log'],
  ];
  for (const [text, wantId] of expect) {
    const found = reg.detectAdapter(text);
    assert.equal(found?.adapterId, wantId, `detector should route to ${wantId}`);
  }
});
