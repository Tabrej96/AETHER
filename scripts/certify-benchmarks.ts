#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 08: BENCHMARK CERTIFICATION
 * (scripts/certify-benchmarks.ts)
 *
 * Runs the reproducible benchmark suite in repeated trials, saves RAW logs,
 * INDEPENDENTLY re-verifies every self-reported pass (re-running the repo's
 * assertions on the produced tree — not trusting the engine's word), and
 * writes a certification that separates MEASURED / ESTIMATED / UNAVAILABLE /
 * NOT-APPLICABLE results. No competitor number is ever invented.
 *
 * Run: npx tsx scripts/certify-benchmarks.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  runGenuineBenchmarkSuite,
  REPRODUCIBLE_TEST_REPOSITORIES,
  HarnessTaskBenchmarkRun,
} from '../src/core/realBenchmarkEngine';
import { liveProviderConfigFromEnv, runLiveProviderCheck } from '../src/core/providers/liveProvider';

const ROOT = process.cwd();
const EVIDENCE = path.join(ROOT, 'release-evidence', 'benchmark-raw-logs');
const TRIALS = 3;

interface CertifiedCell {
  harnessId: string;
  harnessName: string;
  taskId: string;
  evidenceStatus: string;
  trialsRun: number;
  verifiedPassAll: boolean | null; // null = not measured
  meanWallClockMs: number | null;
  meanTokens: number | null; // ESTIMATED (char-based) unless live
  totalToolCalls: number;
  totalRetries: number;
  humanIntervention: number;
  independentReVerification: 'MATCHED' | 'MISMATCH' | 'NOT_APPLICABLE';
  externalCommandToMeasure?: string;
}

export interface CertificationResult {
  generatedAtIso: string;
  trials: number;
  rawLogFiles: string[];
  cells: CertifiedCell[];
  independentReVerification: { reverified: number; mismatches: number };
  liveModelTrial: { status: string; detail: string; tokens?: { in: number; out: number } };
  resourceUsage: {
    rssBeforeBytes: number;
    rssAfterBytes: number;
    cpuUserUs: number;
    cpuSystemUs: number;
    note: string;
  };
  classification: Record<string, string>;
  verdict: string;
}

function mean(xs: Array<number | null>): number | null {
  const vals = xs.filter((x): x is number => x !== null);
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

async function main() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const rawFiles: string[] = [];
  const allRuns: HarnessTaskBenchmarkRun[] = [];
  const rssBefore = process.memoryUsage().rss;
  const cpuBefore = process.cpuUsage();

  for (let t = 0; t < TRIALS; t++) {
    const suite = runGenuineBenchmarkSuite();
    const rawPath = path.join(EVIDENCE, `trial-${t + 1}-${suite.evidenceBundleId}.json`);
    fs.writeFileSync(rawPath, JSON.stringify(suite, null, 2), 'utf8');
    rawFiles.push(path.relative(ROOT, rawPath));
    allRuns.push(...suite.runs);
    console.log(`[trial ${t + 1}/${TRIALS}] ${suite.evidenceBundleId}: ${suite.runs.length} runs recorded -> ${path.relative(ROOT, rawPath)}`);
  }

  // ------------------------------------------------------------------
  // INDEPENDENT re-verification: for every MEASURED run that produced a
  // patch, re-run the task's assertion verifier on the produced tree.
  // A self-reported pass that does not survive re-verification is a MISMATCH
  // and fails the certification.
  // ------------------------------------------------------------------
  let mismatches = 0;
  let reverified = 0;
  for (const run of allRuns) {
    if (run.evidenceStatus !== 'MEASURED_LOCAL_EXECUTION' || run.generatedPatchDiff == null) continue;
    const repo = REPRODUCIBLE_TEST_REPOSITORIES.find((r) => r.taskId === run.taskId)!;
    // Rebuild the post-patch tree exactly as the engine claims, independently.
    const patched: Record<string, string> = { ...repo.files };
    // The produced patch is the final target-file content.
    patched[repo.targetFile] = run.generatedPatchDiff;
    const independent = repo.verifyGeneratedTree(patched);
    reverified++;
    if (independent.passed !== (run.verifiedPass === true)) {
      mismatches++;
      console.log(`[MISMATCH] ${run.harnessId} ${run.taskId}: self-reported pass=${run.verifiedPass} but independent re-verification passed=${independent.passed}`);
    }
  }

  // ------------------------------------------------------------------
  // Aggregate per (harness, task) across trials.
  // ------------------------------------------------------------------
  const cells: CertifiedCell[] = [];
  const keys = new Set(allRuns.map((r) => `${r.harnessId}|${r.taskId}`));
  for (const key of keys) {
    const [harnessId, taskId] = key.split('|');
    const group = allRuns.filter((r) => r.harnessId === harnessId && r.taskId === taskId);
    const first = group[0];
    const measured = group.filter((r) => r.evidenceStatus === 'MEASURED_LOCAL_EXECUTION');
    cells.push({
      harnessId,
      harnessName: first.harnessName,
      taskId,
      evidenceStatus: first.evidenceStatus,
      trialsRun: group.length,
      verifiedPassAll:
        first.evidenceStatus === 'MEASURED_LOCAL_EXECUTION'
          ? measured.every((r) => r.verifiedPass === true)
          : null,
      meanWallClockMs: measured.length ? mean(measured.map((r) => r.measuredWallClockMs)) : null,
      meanTokens: measured.length ? mean(measured.map((r) => r.totalTokensConsumed)) : null,
      totalToolCalls: group.reduce((s, r) => s + r.toolCallsRecorded.length, 0),
      totalRetries: group.reduce((s, r) => s + (r.retriesExecuted ?? 0), 0),
      humanIntervention: 0, // no human in the loop for any suite
      independentReVerification:
        first.evidenceStatus === 'MEASURED_LOCAL_EXECUTION'
          ? mismatches === 0
            ? 'MATCHED'
            : 'MISMATCH'
          : 'NOT_APPLICABLE',
      externalCommandToMeasure: first.externalCliCommandToMeasure,
    });
  }
  if (mismatches > 0) {
    console.log(`[CERTIFICATION FAILURE] ${mismatches} self-reported passes did not survive independent re-verification`);
    process.exitCode = 1;
  }

  // ------------------------------------------------------------------
  // Live-model trial (Gate 01 provider). Honest classification; cost is
  // UNAVAILABLE without pricing config, token usage is provider-reported.
  // ------------------------------------------------------------------
  const liveCfg = liveProviderConfigFromEnv();
  let liveCell: { status: string; detail: string; tokens?: { in: number; out: number } } = {
    status: 'UNAVAILABLE_NO_CREDENTIALS',
    detail: 'AETHER_LIVE_PROVIDER_{URL,KEY,MODEL} not configured in .env; live model trial not run.',
  };
  if (liveCfg) {
    const r = await runLiveProviderCheck(liveCfg, 'Benchmark canary: reply with exactly PONG', 24);
    if (r.status === 'MEASURED_LIVE_EXECUTION') {
      liveCell = {
        status: 'MEASURED_LIVE_MODEL',
        detail: `Real ${r.model} call: ${(r.inputTokens ?? 0)} input / ${r.outputTokens ?? 0} output tokens (provider-reported), HTTP ${r.finalStatus}, latency ${r.latencyMs}ms.`,
        tokens: { in: r.inputTokens ?? 0, out: r.outputTokens ?? 0 },
      };
    } else {
      liveCell = { status: r.status, detail: r.detail };
    }
  }

  const rssAfter = process.memoryUsage().rss;
  const cpuAfter = process.cpuUsage();

  const certification = {
    generatedAtIso: new Date().toISOString(),
    trials: TRIALS,
    rawLogFiles: rawFiles,
    cells,
    independentReVerification: { reverified, mismatches },
    liveModelTrial: liveCell,
    resourceUsage: {
      rssBeforeBytes: rssBefore,
      rssAfterBytes: rssAfter,
      cpuUserUs: cpuAfter.user - cpuBefore.user,
      cpuSystemUs: cpuAfter.system - cpuBefore.system,
      note: 'process-level for the whole certification run; per-task wall clocks are in cells[].meanWallClockMs',
    },
    classification: {
      MEASURED: 'locally executed, independently re-verified (wall clock + tool calls + self-correction events)',
      ESTIMATED: 'token counts are the engine char-based estimates, NOT provider-measured (except the live trial)',
      UNAVAILABLE: 'daemon-dependent harnesses and cost (no pricing configured on the key)',
      NOT_APPLICABLE: 'out-of-domain cells per harness capability matrix',
    },
    verdict:
      mismatches === 0
        ? 'CERTIFIED: every self-reported local pass survived independent re-verification across ' + TRIALS + ' trials'
        : 'FAILED: self-reported results do not survive independent re-verification',
  };

  fs.writeFileSync(path.join(ROOT, 'release-evidence', 'gate08-benchmarks.json'), JSON.stringify(certification, null, 2), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'release-evidence', 'gate08-benchmarks.txt'), renderTxt(certification), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'docs', 'AETHER_BENCHMARK_CERTIFICATION.md'), renderMd(certification), 'utf8');
  console.log(`\n=== GATE 08 VERDICT: ${certification.verdict} ===`);
  console.log(`Cells: ${certification.cells.length} · re-verified ${reverified} runs · mismatches ${mismatches} · live: ${liveCell.status}`);
  console.log(`Wrote release-evidence/gate08-benchmarks.{json,txt} and docs/AETHER_BENCHMARK_CERTIFICATION.md`);
}

function renderTxt(c: CertificationResult): string {
  const lines: string[] = [
    'GATE 08 EVIDENCE — REAL COMPETITIVE BENCHMARKING (Program 10)',
    `Command: npx tsx scripts/certify-benchmarks.ts  (trials=${c.trials})`,
    `Verdict: ${c.verdict}`,
    `Independent re-verification: ${c.independentReVerification.reverified} measured runs re-checked, ${c.independentReVerification.mismatches} mismatches.`,
    `Live model trial: ${c.liveModelTrial.status} — ${c.liveModelTrial.detail}`,
    '',
    'Raw execution logs:',
    ...c.rawLogFiles.map((f) => `  - ${f}`),
    '',
    'Classification: MEASURED (local, re-verified) | ESTIMATED (engine token estimates) | UNAVAILABLE | NOT-APPLICABLE.',
    '',
  ];
  return lines.join('\n');
}

function renderMd(c: CertificationResult): string {
  const rows = c.cells
    .map((x) => {
      const pass = x.verifiedPassAll === null ? '— (not measured)' : x.verifiedPassAll ? 'PASS' : 'FAIL';
      const ms = x.meanWallClockMs === null ? '—' : `${x.meanWallClockMs}ms`;
      const tok = x.meanTokens === null ? '—' : `~${x.meanTokens} (estimated)`;
      return `| ${x.harnessName} | ${x.taskId} | ${x.evidenceStatus.replace('MEASURED_LOCAL_EXECUTION', 'MEASURED').replace('UNMEASURED_REQUIRES_HOST_DAEMON', 'UNAVAILABLE')} | ${pass} | ${ms} | ${tok} | ${x.totalToolCalls} | ${x.totalRetries} | ${x.independentReVerification.toLowerCase().replace('_', '-')} |`;
    })
    .join('\n');
  return [
    '# AETHER 1.0 — Benchmark Certification (GATE 08)',
    '',
    `**Generated:** ${c.generatedAtIso} · **Trials:** ${c.trials} · **Created by Tabrej**`,
    '',
    '## Method',
    '',
    '- The reproducible task repositories (`TASK-REAL-01/02/03`) are run identically across every locally-runnable harness adapter, with real wall-clock and tool-call recording.',
    '- **Independent verification:** every self-reported pass is re-verified by re-running the task assertion verifier on the produced file tree. A self-report that fails re-verification is a certification FAILURE.',
    '- Raw execution logs are kept under `release-evidence/benchmark-raw-logs/`.',
    '- **No competitor number is invented.** Daemon-dependent harnesses (OpenHands, OpenManus, AutoGen, Browser Use, Skyvern) are recorded UNAVAILABLE with the exact external command that would measure them; the live-model trial is reported honestly (MEASURED or UNAVAILABLE_*).',
    '',
    '## Per-harness × task results',
    '',
    '| Harness | Task | Evidence class | Pass (all trials) | Mean wall-clock | Mean tokens | Tool calls | Self-corrections | Independent re-verify |',
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
    rows,
    '',
    '## Metric classification (honest separation)',
    '',
    '| Metric | Class | Note |',
    '| :--- | :--- | :--- |',
    '| Completion success | MEASURED | locally executed + independently re-verified |',
    '| Correctness | MEASURED | assertion re-run on the produced tree |',
    '| Latency | MEASURED | real performance.now() wall clocks in the engine |',
    '| Token consumption | ESTIMATED | engine char-based estimates, except the live trial (provider-reported) |',
    '| Cost | UNAVAILABLE | no pricing configured on the live key; the cost formula is unit-tested in the Gate 01 contract suite |',
    '| Tool calls | MEASURED | recorded per run |',
    '| Retries / self-correction | MEASURED | recorded per run |',
    '| Human intervention | N/A | no human is in the loop in this suite (by design) |',
    '| Recovery success | N/A | covered separately by GATE 02/03 crash-recovery tests |',
    '| Resource usage | MEASURED | process RSS/CPU for the certification run (below) |',
    '',
    '## Live model trial',
    '',
    `- **${c.liveModelTrial.status}** — ${c.liveModelTrial.detail}`,
    '',
    '## Resource usage (whole certification run)',
    '',
    `- RSS: ${(c.resourceUsage.rssBeforeBytes / 1048576).toFixed(1)}MB -> ${(c.resourceUsage.rssAfterBytes / 1048576).toFixed(1)}MB · CPU user ${(c.resourceUsage.cpuUserUs / 1000).toFixed(0)}ms · system ${(c.resourceUsage.cpuSystemUs / 1000).toFixed(0)}ms`,
    '',
    '## Verdict',
    '',
    `**${c.verdict}**`,
    '',
    '> Unavailable harnesses: see the `UNAVAILABLE` rows — each carries its `externalCommandToMeasure` in the raw logs; run it and import the trace to promote it to MEASURED.',
    '',
  ].join('\n');
}

await main();
