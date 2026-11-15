/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GATE 01/02 follow-up — LIVE MODEL TURN TESTS
 * (src/core/providers/live-turn.test.ts)
 *
 * Proves the autonomous loop is now model-driven, with a REAL provider client
 * (fetch injected for determinism — the same injection the GATE 01 contract
 * suite uses against a real local HTTP server). Honesty asserted explicitly:
 *   - a valid model plan that passes invariants+security -> LIVE_MODEL_VERIFIED
 *   - garbage / unparseable / out-of-scope model output -> DETERMINISTIC_FALLBACK
 *   - a provider HTTP failure -> DETERMINISTIC_FALLBACK (never a fake pass)
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { ModelProviderClient, type ProviderConfig } from './providerClient';
import { executeLiveModelTurn } from './liveModelTurn';
import { REPRODUCIBLE_TEST_REPOSITORIES } from '../realBenchmarkEngine';

const CFG: ProviderConfig = {
  id: 'test-live-provider',
  baseUrl: 'http://localhost:0/v1',
  apiKey: 'test-key',
  model: 'test-model',
  vendor: 'openai-compatible',
  authStyle: 'bearer',
  capabilities: { supportsTools: true, supportsStreaming: true, supportsJsonMode: true, contextWindowTokens: 200_000 },
  pricing: { inputPerMTokens: 0, outputPerMTokens: 0 },
  maxRetries: 1,
  timeoutMs: 5_000,
};

function makeClient(response: { status: number; body: unknown }): ModelProviderClient {
  const fetchImpl = (async () =>
    new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: { 'content-type': 'application/json' },
    })) as unknown as typeof fetch;
  return new ModelProviderClient({ primary: CFG, fetchImpl });
}

const repo = REPRODUCIBLE_TEST_REPOSITORIES.find((r) => r.repoId === 'repo-authn-sqli-01')!;
const workspace: Record<string, string> = {};
for (const [k, v] of Object.entries(repo.files)) workspace[k] = v;

test('LIVE TURN: a correct model plan is verified AND labeled LIVE_MODEL_VERIFIED', async () => {
  // The model "returns" exactly the verified remediated patch -> the live
  // path should accept it and mark it as a live-model success.
  const plan = {
    reasoning: 'parameterize the SQL and revoke the token family on replay',
    mutations: [{ filePath: repo.targetFile, content: repo.remediatedVerifiedPatch }],
  };
  const client = makeClient({
    status: 200,
    body: {
      model: 'test-model',
      choices: [{ message: { role: 'assistant', content: JSON.stringify(plan) } }],
      usage: { prompt_tokens: 1200, completion_tokens: 340 },
    },
  });
  const out = await executeLiveModelTurn({ client, objective: 'Fix the SQLi', repoSpec: repo, workspaceFiles: workspace });
  assert.equal(out.reasoningSource, 'LIVE_MODEL_VERIFIED');
  assert.equal(out.liveCallSucceeded, true);
  assert.equal(out.verification.preAppliedInvariantsPassed, true);
  assert.equal(out.verification.securityScansPassed, true);
  assert.equal(out.usageSource, 'provider-reported');
  assert.equal(out.promptTokens, 1200);
  assert.equal(out.completionTokens, 340);
  assert.equal(out.proposedFileMutations.length, 1);
});

test('LIVE TURN: an out-of-scope model path is refused (workspace confinement)', async () => {
  const plan = {
    reasoning: 'try to rewrite a file the workspace does not contain',
    mutations: [{ filePath: '../../etc/passwd', content: 'pwned' }],
  };
  const client = makeClient({
    status: 200,
    body: {
      model: 'test-model',
      choices: [{ message: { role: 'assistant', content: JSON.stringify(plan) } }],
      usage: { prompt_tokens: 900, completion_tokens: 100 },
    },
  });
  const out = await executeLiveModelTurn({ client, objective: 'Fix the SQLi', repoSpec: repo, workspaceFiles: workspace });
  assert.equal(out.reasoningSource, 'DETERMINISTIC_FALLBACK');
  assert.match(out.fallbackReason ?? '', /non-workspace/);
  // The fallback patch is still the verified one — the bad plan was never applied.
  assert.equal(out.proposedFileMutations[0]?.updatedContent, repo.remediatedVerifiedPatch);
});

test('LIVE TURN: a broken model plan (fails invariants) falls back honestly', async () => {
  const plan = {
    reasoning: 'gut the file',
    mutations: [{ filePath: repo.targetFile, content: '// intentionally broken by the model\n' }],
  };
  const client = makeClient({
    status: 200,
    body: {
      model: 'test-model',
      choices: [{ message: { role: 'assistant', content: JSON.stringify(plan) } }],
      usage: { prompt_tokens: 900, completion_tokens: 100 },
    },
  });
  const out = await executeLiveModelTurn({ client, objective: 'Fix the SQLi', repoSpec: repo, workspaceFiles: workspace });
  assert.equal(out.reasoningSource, 'DETERMINISTIC_FALLBACK');
  assert.equal(out.liveCallSucceeded, true, 'the live call DID succeed — only its plan failed verification');
  assert.match(out.fallbackReason ?? '', /invariants|security/);
});

test('LIVE TURN: unparseable model output falls back (no crash, no fake pass)', async () => {
  const client = makeClient({
    status: 200,
    body: {
      model: 'test-model',
      choices: [{ message: { role: 'assistant', content: 'I will think about it and then maybe write some code…' } }],
      usage: { prompt_tokens: 500, completion_tokens: 20 },
    },
  });
  const out = await executeLiveModelTurn({ client, objective: 'Fix the SQLi', repoSpec: repo, workspaceFiles: workspace });
  assert.equal(out.reasoningSource, 'DETERMINISTIC_FALLBACK');
  assert.match(out.fallbackReason ?? '', /unparseable/);
});

test('LIVE TURN: a provider HTTP 500 falls back with the status recorded', async () => {
  const client = makeClient({
    status: 500,
    body: { error: { message: 'upstream unavailable' } },
  });
  const out = await executeLiveModelTurn({ client, objective: 'Fix the SQLi', repoSpec: repo, workspaceFiles: workspace });
  assert.equal(out.reasoningSource, 'DETERMINISTIC_FALLBACK');
  assert.equal(out.liveCallSucceeded, false, 'a failed provider call is never a live success');
  assert.match(out.fallbackReason ?? '', /500|exhausted|unavailable/);
  // The verified patch is still available — autonomy degrades safely.
  assert.equal(out.proposedFileMutations.length, 1);
});
