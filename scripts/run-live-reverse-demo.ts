/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * P02 LIVE REVERSE-ENGINEERING DEMO — CLI entry
 * (scripts/run-live-reverse-demo.ts)
 *
 * Run: npx tsx scripts/run-live-reverse-demo.ts
 * Reverse-engineers AETHER's own src/core (target 1) and, when present, a real
 * third-party library (target 2), writes evidence to
 * release-evidence/reverse-demo/, and prints a compact summary. Exits 0 on
 * success; exits 1 with an UNAVAILABLE notice when target 1 cannot be read.
 */

import { runLiveReverseDemo } from '../src/core/reverse/liveReverseDemo';

const main = async (): Promise<void> => {
  const r = await runLiveReverseDemo();
  if (r.status !== 'MEASURED_LIVE_REVERSE_ENGINEERING') {
    console.error(`UNAVAILABLE: ${r.provenance}`);
    process.exitCode = 1;
    return;
  }

  const rep = r.report;
  const topDeps = rep.externalDependencies.slice(0, 5);
  const boundaries = rep.unmeasuredSlots.map((s) => s.slot).join(', ');
  const kb = (r.target.totalTokens / 4 / 1024).toFixed(1);

  console.log('=== AETHER P02 — LIVE REVERSE-ENGINEERING DEMO (real code on this machine) ===');
  console.log(`Target 1: ${r.target.name}  [${r.target.authorization}]`);
  console.log(`  files: ${r.target.fileCount}  ·  ~${kb} KB scanned  ·  ${r.provenance}`);
  console.log(`  modules reconstructed: ${rep.totalFiles}  ·  dependency edges: ${rep.totalDependencies}  ·  layers: ${rep.layeredStructure.map((l) => `${l.layer}(${l.files.length})`).join(', ')}`);
  console.log(`  top external deps: ${topDeps.length ? topDeps.join(', ') : '(none — self-contained tree)'}`);
  console.log(`  entry candidates: ${rep.entryCandidates.slice(0, 4).join(', ') || 'n/a'}`);
  console.log(`  unmeasured slots (reported, not fabricated): ${boundaries || 'none'}`);

  if (r.secondary.status === 'MEASURED_LIVE_REVERSE_ENGINEERING') {
    const s = r.secondary.report!;
    console.log(`Target 2: third-party library  [${s.authorization.basis}]`);
    console.log(`  files: ${s.totalFiles}  ·  modules: ${s.totalFiles}  ·  top external deps: ${s.externalDependencies.slice(0, 5).join(', ') || '(none)'}`);
  } else {
    console.log(`Target 2: ${r.secondary.detail}`);
  }

  console.log('\nEvidence:');
  console.log('  release-evidence/reverse-demo/live-reverse-report.json');
  console.log('  release-evidence/reverse-demo/live-reverse-report.md');
};

main().catch((e) => {
  console.error('live reverse demo failed:', e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
