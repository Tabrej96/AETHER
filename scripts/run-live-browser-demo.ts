/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — run the live browser-control demo (P05 + P06 on real Chrome)
 * (scripts/run-live-browser-demo.ts)
 *
 *   npx tsx scripts/run-live-browser-demo.ts
 *
 * Exits 0 even when the browser is UNAVAILABLE (it still writes the honest
 * report); prints the report JSON + a short human summary.
 */

import { runLiveBrowserDemo } from '../src/core/browser/liveBrowserDemo';

async function main(): Promise<void> {
  const report = await runLiveBrowserDemo();
  console.log(JSON.stringify(report, null, 2));
  if (report.status === 'MEASURED_LIVE_BROWSER_CONTROL') {
    console.log(
      `\nLIVE BROWSER CONTROL: OK — drove ${report.browser ?? 'chrome'} on ${report.url}`
    );
    console.log(
      `  a11y elements: ${report.a11yElementCount} · P05 snapshot ${report.snapshotTokens} tokens vs raw ${report.rawDomTokens} (${report.snapshotSavingsPct}% saved)`
    );
    console.log(`  P05 resolved "${report.p05Resolved.cssSelector}" via ${report.p05Resolved.strategy} @ ${report.p05Resolved.confidence}`);
    console.log(`  state change verified: ${report.stateChangeVerified}`);
    if (report.p06Grounding) {
      console.log(`  P06 grounding: ${report.p06Grounding.intent} -> ${report.p06Grounding.grounded} @ ${report.p06Grounding.confidence}`);
    }
    console.log(`  screenshots: ${report.screenshotBefore} / ${report.screenshotAfter}`);
  } else {
    console.log(`\nLIVE BROWSER CONTROL: UNAVAILABLE — ${report.reason}`);
  }
}

main().catch((e) => {
  console.error('live browser demo failed:', e instanceof Error ? e.message : e);
  process.exitCode = 0; // UNAVAILABLE is an honest terminal state, not a crash
});
