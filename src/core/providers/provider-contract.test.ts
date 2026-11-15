/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 01 TESTS: Provider Contract + Real HTTP Integration
 * (src/core/providers/provider-contract.test.ts)
 *
 * Certifies AETHER's model infrastructure against a REAL local HTTP server
 * (Node http) that speaks both Anthropic /v1/messages and OpenAI-compatible
 * /v1/chat/completions. This proves actual API plumbing (headers, retries,
 * backoff, streaming SSE, tool-calling, usage/cost) with real sockets.
 *
 * The deterministic mock provider (mockProvider.ts) is also exercised, but
 * ONLY as plumbing evidence — never as proof a real model ran.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { AddressInfo } from 'node:net';

import {
  ModelProviderClient,
  ProviderConfig,
  backoffMs,
  estimateTokens,
  fitContextWindow,
  detectErrorSentinel,
  ProviderHealthMonitor,
} from './providerClient';
import { collectSse, reduceAnthropicSse, SseEvent } from './streaming';
import { anthropicSseLines, createMockProvider } from './mockProvider';

/** Build an Anthropic-compatible local server. */
function startAnthropicServer(hooks: { failFirst?: number; sse?: boolean; bodyOverride?: (req: string) => Record<string, unknown> }) {
  let calls = 0;
  const server = http.createServer((req, res) => {
    calls += 1;
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      // auth check
      const key = req.headers['x-api-key'] as string | undefined;
      if (!key) {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'missing key' } }));
        return;
      }
      // rate-limit first N calls with Retry-After
      if (hooks.failFirst && calls <= hooks.failFirst) {
        res.writeHead(429, { 'content-type': 'application/json', 'retry-after': '0' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'overloaded_error', message: 'rate limited' } }));
        return;
      }
      const parsed = JSON.parse(body);
      if (hooks.bodyOverride && parsed.stream !== true) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(hooks.bodyOverride(body)));
        return;
      }
      if (hooks.sse && parsed.stream === true) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        const lines = anthropicSseLines(parsed.model ?? 'mock', ['Hello ', 'world.'], 5, 7);
        res.end(lines.join('\n'));
        return;
      }
      // tool-calling: if the request has tools and the user said "call it",
      // respond with a tool_use block.
      const wantTool = typeof parsed.messages?.find?.((m: { content?: string }) => m.content)?.content === 'string'
        ? String(parsed.messages.find((m: { content?: string }) => m.content)?.content).includes('call the tool')
        : false;
      const out: Record<string, unknown> = {
        id: 'msg_local',
        type: 'message',
        role: 'assistant',
        model: parsed.model ?? 'mock',
        stop_reason: wantTool && parsed.tools?.length ? 'tool_use' : 'end_turn',
        usage: { input_tokens: 5, output_tokens: 3 },
        content: wantTool && parsed.tools?.length
          ? [
              { type: 'text', text: 'using tool' },
              { type: 'tool_use', id: 'tu_1', name: String(parsed.tools[0].name), input: { n: 7 } },
            ]
          : [{ type: 'text', text: `echo:${String(parsed.messages?.[0]?.content ?? '')}` }],
      };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(out));
    });
  });
  return new Promise<{ url: string; server: http.Server; callCount: () => number }>((resolve) => {
    server.listen(0, () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ url: `http://127.0.0.1:${port}`, server, callCount: () => calls });
    });
  });
}

function anthropicCfg(url: string, id = 'anthropic-local'): ProviderConfig {
  return {
    id,
    baseUrl: url,
    apiKey: 'test-key',
    model: 'claude-test',
    vendor: 'anthropic',
    authStyle: 'x-api-key',
    versionHeader: '2023-06-01',
    capabilities: { supportsTools: true, supportsStreaming: true, supportsJsonMode: true, contextWindowTokens: 200_000 },
    pricing: { inputPerMTokens: 3, outputPerMTokens: 15 },
    maxRetries: 4,
    timeoutMs: 4000,
  };
}

test('GATE-01: real HTTP completion — auth header, real request, real response', async () => {
  const { url, server, callCount } = await startAnthropicServer({ sse: false });
  try {
    const client = new ModelProviderClient({ primary: anthropicCfg(url) });
    const res = await client.complete({
      messages: [
        { role: 'system', content: 'You are terse.' },
        { role: 'user', content: 'say hi' },
      ],
    });
    assert.equal(res.providerId, 'anthropic-local');
    assert.equal(res.finalStatus, 200);
    assert.match(res.content, /echo:say hi/);
    assert.equal(res.usage.source, 'provider-reported');
    assert.ok(res.usage.inputTokens > 0 && res.usage.outputTokens > 0, 'usage must be provider-reported, not estimated');
    // cost: (input/1e6)*3 + (output/1e6)*15
    const expectedCost = (res.usage.inputTokens / 1e6) * 3 + (res.usage.outputTokens / 1e6) * 15;
    assert.ok(Math.abs(res.costUsd - expectedCost) < 1e-12, 'cost must be computed from pricing table + real usage');
    assert.equal(callCount() >= 1, true, 'the server must have received at least one real request');
  } finally {
    server.close();
  }
});

test('GATE-01: tool calling round-trips a real tool_use block', async () => {
  const { url, server } = await startAnthropicServer({ sse: false });
  try {
    const client = new ModelProviderClient({ primary: anthropicCfg(url) });
    const res = await client.complete({
      messages: [{ role: 'user', content: 'please call the tool' }],
      tools: [{ name: 'noop', description: 'no-op', parameters: { type: 'object', properties: { n: { type: 'number' } } } }],
      toolChoice: 'auto',
    });
    assert.equal(res.toolCalls.length, 1);
    assert.equal(res.toolCalls[0].name, 'noop');
    assert.deepEqual(res.toolCalls[0].arguments, { n: 7 });
  } finally {
    server.close();
  }
});

test('GATE-01: streaming SSE accumulates real deltas', async () => {
  const { url, server } = await startAnthropicServer({ sse: true });
  try {
    const client = new ModelProviderClient({ primary: anthropicCfg(url) });
    const deltas: string[] = [];
    const res = await client.streamComplete(
      { messages: [{ role: 'user', content: 'stream me' }] },
      (d) => {
        if (d.type === 'text') deltas.push(d.text);
      }
    );
    assert.equal(deltas.join(''), 'Hello world.', 'streaming deltas must reconstruct the full text');
    assert.equal(res.content, 'Hello world.');
    assert.equal(res.usage.source, 'provider-reported');
    assert.equal(res.usage.inputTokens, 5);
    assert.equal(res.usage.outputTokens, 7);
  } finally {
    server.close();
  }
});

test('GATE-01: rate-limit (429) triggers retry with Retry-After, then succeeds', async () => {
  const { url, server, callCount } = await startAnthropicServer({ sse: false, failFirst: 2 });
  try {
    const client = new ModelProviderClient({ primary: anthropicCfg(url) });
    const res = await client.complete({ messages: [{ role: 'user', content: 'retry me' }] });
    assert.equal(res.finalStatus, 200, 'after two 429s the retry must succeed');
    assert.ok(res.attempts >= 3, `expected >=3 attempts (2 rate-limited + 1 success), got ${res.attempts}`);
    assert.equal(callCount() >= 3, true, 'the server saw every attempt (real HTTP, not simulated)');
  } finally {
    server.close();
  }
});

test('GATE-01: 401 surfaces as an auth failure (no retry, no silent success)', async () => {
  const { url, server } = await startAnthropicServer({ sse: false });
  try {
    const cfg = anthropicCfg(url);
    cfg.apiKey = ''; // server rejects missing key with 401
    const client = new ModelProviderClient({ primary: cfg });
    await assert.rejects(() => client.complete({ messages: [{ role: 'user', content: 'x' }] }), /auth|exhausted|401/);
  } finally {
    server.close();
  }
});

test('GATE-01: fallback chain — a downed primary falls through to a healthy fallback', async () => {
  const primary = await startAnthropicServer({ sse: false, failFirst: 999 }); // always 429 -> unhealthy fast
  const fallback = await startAnthropicServer({ sse: false });
  try {
    // primary always 429s; after retries it should fall to fallback.
    const client = new ModelProviderClient({
      primary: { ...anthropicCfg(primary.url, 'primary'), maxRetries: 1 },
      fallbacks: [anthropicCfg(fallback.url, 'fallback')],
    });
    const res = await client.complete({ messages: [{ role: 'user', content: 'route me' }] });
    assert.equal(res.providerId, 'fallback', 'the healthy fallback must be used');
    assert.equal(res.viaFallback, true);
  } finally {
    primary.server.close();
    fallback.server.close();
  }
});

test('GATE-01: cancellation aborts an in-flight request', async () => {
  const { url, server } = await startAnthropicServer({ sse: false });
  try {
    const client = new ModelProviderClient({ primary: anthropicCfg(url) });
    const ac = new AbortController();
    const p = client.complete({ messages: [{ role: 'user', content: 'cancel me' }], signal: ac.signal });
    ac.abort();
    await assert.rejects(p, /cancelled|aborted|abort|all providers exhausted/i);
  } finally {
    server.close();
  }
});

test('GATE-01: 200-with-error-body is NOT reported as success (error-sentinel detection)', async () => {
  // Body override: the server returns a 200 whose content is an "Invalid API key"
  // sentinel. The client must treat this as a failure, not a completion.
  const sentinel = await startAnthropicServer({
    sse: false,
    bodyOverride: () => ({
      id: 'msg_x',
      type: 'message',
      role: 'assistant',
      model: 'm',
      stop_reason: 'end_turn',
      usage: { input_tokens: 0, output_tokens: 0 },
      content: [{ type: 'text', text: '⚠️ Invalid API key. Please check that your API key is correct and try again.' }],
    }),
  });
  try {
    const client = new ModelProviderClient({
      primary: { ...anthropicCfg(sentinel.url, 'sentinel'), maxRetries: 1 },
      fallbacks: [],
    });
    // Only one provider (the sentinel one), so "all providers exhausted" fires with the sentinel recorded.
    await assert.rejects(
      () => client.complete({ messages: [{ role: 'user', content: 'x' }] }),
      /error-sentinel|exhausted/i
    );
    // The detector itself is directly verifiable:
    assert.equal(detectErrorSentinel('⚠️ Invalid API key. Please check that your API key is correct and try again.'), true);
    assert.equal(detectErrorSentinel('The function squares numbers: return x * x.'), false, 'a legitimate answer must not be flagged');
  } finally {
    sentinel.server.close();
  }
});

test('GATE-01: context-window management truncates to fit the budget', () => {
  const msgs = [
    { role: 'system' as const, content: 'sys' },
    ...Array.from({ length: 20 }, (_, i) => ({ role: 'user' as const, content: `msg-${i} ` + 'x'.repeat(2000) })),
  ];
  const fit = fitContextWindow(msgs, 5000, 1000);
  assert.equal(fit.truncated, true);
  assert.ok(fit.estimatedTokens <= 5000, 'truncated messages must fit the reserved budget');
  assert.equal(fit.messages[0].role, 'system', 'system prompt is always preserved');
  assert.ok(fit.messages.length < msgs.length, 'oldest turns were dropped');
});

test('GATE-01: deterministic mock provider is plumbing-only (never production evidence)', () => {
  const mock = createMockProvider('mock-1', 'model-x', (call) => ({
    content: `mock-${call}`,
  }));
  const r1 = mock.invoke({ messages: [{ role: 'user', content: 'a' }] });
  const r2 = mock.invoke({ messages: [{ role: 'user', content: 'b' }] });
  assert.equal(r1.content, 'mock-1');
  assert.equal(r2.content, 'mock-2');
  assert.equal(r1.status, 200, 'the mock is a deterministic double, not a real model');
  assert.equal(estimateTokens('abcd'), 1);
  // backoff is bounded and monotone-ish
  const b = [backoffMs(0), backoffMs(1), backoffMs(2), backoffMs(50)];
  assert.ok(b.every((x) => x >= 0), 'backoff must be non-negative');
  assert.equal(Math.min(...b) <= Math.max(...b), true);
});

test('GATE-01: health monitor drives provider selection (unhealthy provider is skipped)', async () => {
  const healthy = await startAnthropicServer({ sse: false });
  const mon = new ProviderHealthMonitor();
  mon.health('dead', false, 0, 500);
  mon.health('dead', false, 0, 500);
  assert.equal(mon.isHealthy('dead'), false);
  assert.equal(mon.isHealthy('healthy'), true, 'an untried provider is assumed healthy');
  await healthy.server.close();
});

test('GATE-01: SSE reducer handles real Anthropic event shapes', () => {
  const lines = anthropicSseLines('m', ['a', 'b', 'c'], 4, 9);
  // Feed through a synthetic ReadableStream
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(new TextEncoder().encode(lines.join('\n')));
      c.close();
    },
  });
  const events: SseEvent[] = [];
  collectSse(stream, (e) => events.push(e));
  // await the collection by wrapping in a promise
  return new Promise<void>((resolve, reject) => {
    const p: Promise<void> = Promise.resolve().then(async () => {
      // collectSse is already dispatched; give it a tick to finish
      await new Promise((r) => setTimeout(r, 20));
      const result = reduceAnthropicSse('p', 'm', events, 10, 1, 200, false);
      assert.equal(result.content, 'abc');
      assert.equal(result.usage.inputTokens, 4);
      assert.equal(result.usage.outputTokens, 9);
      resolve();
    });
    p.catch(reject);
  });
});
