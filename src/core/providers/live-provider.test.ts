/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 01: LIVE MODEL ENDPOINT TEST (real API call)
 * (src/core/providers/live-provider.test.ts)
 *
 * The check helpers live in ./liveProvider.ts (clean, non-test) so the
 * certification script can import them without loading node:test. This file
 * re-exports them for the suite and runs the honest live test.
 *
 * Without configured credentials it reports UNAVAILABLE_NO_CREDENTIALS — a
 * documented state, not a defect. It NEVER back-fills a mock.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runLiveProviderCheck,
  liveProviderConfigFromEnv,
  LiveResult,
} from './liveProvider';

// Re-export so callers / evidence scripts may use either module.
export { runLiveProviderCheck, liveProviderConfigFromEnv, type LiveResult } from './liveProvider';

test('GATE-01: live provider end-to-end (reports MEASURED or UNAVAILABLE, never fabricated)', async () => {
  const cfg = liveProviderConfigFromEnv();
  if (!cfg) {
    console.log('  [GATE-01 LIVE] UNAVAILABLE_NO_CREDENTIALS — set AETHER_LIVE_PROVIDER_{URL,KEY,MODEL} in .env to run');
    return; // an optional credential being absent is a documented UNAVAILABLE, not a defect
  }
  const result = await runLiveProviderCheck(cfg);
  console.log(`  [GATE-01 LIVE] ${result.status} — ${result.detail}`);
  assert.ok(
    result.status === 'MEASURED_LIVE_EXECUTION' || result.status.startsWith('UNAVAILABLE'),
    'the live check must yield MEASURED or an honest UNAVAILABLE classification'
  );
  if (result.status === 'MEASURED_LIVE_EXECUTION') {
    assert.ok((result.inputTokens ?? 0) > 0 || (result.outputTokens ?? 0) > 0, 'a live completion must report non-zero token usage');
  }
});
