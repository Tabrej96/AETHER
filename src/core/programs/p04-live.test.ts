/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 04 — B4: GENUINE MULTI-AGENT MODEL TURNS
 * (src/core/programs/p04-live.test.ts)
 *
 * Proves separate agents make actual model calls and their work is audited:
 *  - a valid model answer -> reasoningSource LIVE_MODEL
 *  - a provider failure   -> the deterministic handler still does the work,
 *    labeled LIVE_MODEL_FALLBACK (never a silent "measured" claim)
 *  - the run's modelTurns[] audit trail records which agent decided what.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { ModelProviderClient, type ProviderConfig } from '../providers/providerClient';
import {
  createModelAgent,
  orchestrateAgentTeamAsync,
  type AgentParticipant,
  type OrchestrationTask,
} from './p04MultiAgentOrchestration';

const CFG: ProviderConfig = {
  id: 'test-multiagent-provider',
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

function modelAgent(behavior: 'good' | 'unparseable' | 'http500'): AgentParticipant {
  const fetchImpl = (async () => {
    if (behavior === 'http500') {
      return new Response(JSON.stringify({ error: 'upstream down' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
    const ok = behavior === 'good';
    const body = ok
      ? JSON.stringify({
          choices: [
            {
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  ok: true,
                  result: 'model did the work',
                  reasoning: 'model-driven decision recorded',
                }),
              },
            },
          ],
          usage: { prompt_tokens: 400, completion_tokens: 60 },
        })
      : JSON.stringify({
          choices: [{ message: { role: 'assistant', content: 'no json here, just prose' } }],
          usage: { prompt_tokens: 400, completion_tokens: 60 },
        });
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
  }) as unknown as typeof fetch;

  return createModelAgent({
    client: new ModelProviderClient({ primary: CFG, fetchImpl }),
    agentId: 'model-coder',
    capability: 'implementation',
    systemPrompt: 'You implement the assigned task and report JSON {ok, result, reasoning}.',
    fallback: (p) => ({ result: `deterministic fallback did ${p}`, ok: true }),
  });
}

const tasks: OrchestrationTask[] = [
  { taskId: 't1', title: 'impl-a', dependsOn: [], assignCapability: 'implementation' },
  { taskId: 't2', title: 'impl-b', dependsOn: [], assignCapability: 'implementation' },
];

test('B4: a valid model answer runs LIVE_MODEL and is audited in modelTurns', async () => {
  const agents = [modelAgent('good')];
  const run = await orchestrateAgentTeamAsync(tasks, agents);
  assert.equal(run.success, true);
  assert.deepEqual(run.completedTaskIds.sort(), ['t1', 't2']);
  const live = run.modelTurns!.filter((t) => t.reasoningSource === 'LIVE_MODEL');
  assert.equal(live.length, 2, 'each task must be a genuine model turn');
  assert.match(live[0].note ?? '', /in=400 out=60/, 'provider-reported usage is audited');
});

test('B4: a failing provider degrades to the deterministic handler, labeled', async () => {
  const agents = [modelAgent('unparseable')];
  const run = await orchestrateAgentTeamAsync(tasks, agents);
  assert.equal(run.success, true, 'the fallback handler still does the work');
  const fb = run.modelTurns!.filter((t) => t.reasoningSource === 'LIVE_MODEL_FALLBACK');
  assert.equal(fb.length, 2, 'the fallback must be explicitly labeled, never silently "LIVE_MODEL"');
  const t1 = run.eventLog.find((m): m is { type: 'TASK_RESULT'; taskId: string; result: string; ok: boolean } => m.type === 'TASK_RESULT' && m.taskId === 't1')!;
  assert.match(t1.result, /deterministic fallback/);
});

test('B4: an HTTP 500 provider also degrades safely (audit intact)', async () => {
  const agents = [modelAgent('http500')];
  const run = await orchestrateAgentTeamAsync(tasks, agents);
  assert.equal(run.success, true);
  assert.equal(run.modelTurns!.filter((t) => t.reasoningSource === 'LIVE_MODEL_FALLBACK').length, 2);
});

test('B4: a mixed team (model + deterministic agent) runs both contracts', async () => {
  const team: AgentParticipant[] = [
    modelAgent('good'),
    { agentId: 'plain-verify', capability: 'verification', handle: (p) => ({ result: `verified ${p}`, ok: true }) },
  ];
  const mixed: OrchestrationTask[] = [
    { taskId: 'm1', title: 'impl', dependsOn: [], assignCapability: 'implementation' },
    { taskId: 'm2', title: 'verify', dependsOn: ['m1'], assignCapability: 'verification' },
  ];
  const run = await orchestrateAgentTeamAsync(mixed, team);
  assert.equal(run.success, true);
  const srcs = run.modelTurns!.map((t) => t.reasoningSource);
  assert.ok(srcs.includes('LIVE_MODEL'), 'model agent recorded a live turn');
  assert.ok(srcs.includes('DETERMINISTIC'), 'plain agent recorded its deterministic turn');
});
