/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — run the P10 deep-intelligence demo (exact GST invoice + live recompute)
 * (scripts/run-deep-demo.ts)
 *
 *   npx tsx scripts/run-deep-demo.ts [--no-browser]
 *
 * Writes release-evidence/deep-demo/{invoice.html, deep-demo-report.json,
 * before.png, after.png}. Exits 0 even when the browser is UNAVAILABLE (it
 * still writes the honest report); prints the report JSON + a short summary.
 */

import path from 'node:path';

import { runDeepIntelligenceDemo } from '../src/core/intel/deepDemo';

async function main(): Promise<void> {
  const outDir = path.resolve('release-evidence/deep-demo');
  const driveBrowser = !process.argv.includes('--no-browser');
  const report = await runDeepIntelligenceDemo(outDir, driveBrowser);

  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'MEASURED_DEEP_DEMO') {
    console.log(`\nDEEP DEMO: OK — exact inter-state GST invoice in integer paise`);
    console.log(`  requirement depth ${report.requirementDepth} · domains [${report.domains.join(', ')}] · ${report.composedSkills.length} skills composed`);
    console.log(`  subtotal -> grand total ${report.grandTotalPaise}p (tax ${report.taxPaise}p) · tamper guard fired: ${report.tamperGuardFired}`);
    console.log(`  design audit ${report.designAuditScore}/100 (pass=${report.designAuditPass}) · page: ${report.invoicePagePath}`);
    if (report.stateChangeVerified) {
      console.log(`  LIVE recompute verified: ${report.pageRecomputeMatchesServer ? 'page-side total == server engine total' : 'MISMATCH'}`);
      console.log(`  screenshots: ${report.screenshotBefore} / ${report.screenshotAfter}`);
    }
  } else {
    console.log(`\nDEEP DEMO: ${report.status} — ${report.reason}`);
  }
}

main().catch((e) => {
  console.error('deep demo failed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
