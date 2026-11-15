/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 01: Deterministic Mock Provider (TESTING ONLY)
 * (src/core/providers/mockProvider.ts)
 *
 * A deterministic, in-process provider double for automated tests.
 *
 * RULE: this is NEVER evidence of production model execution. It proves
 * AETHER's request/response plumbing (tool schemas, JSON mode, streaming
 * event shapes, usage math, retry paths). The provider contract suite in
 * provider-contract.test.ts is what certifies the plumbing; live proof of a
 * real model is the separate live-endpoint test (gated on .env credentials).
 */

import type {
  ChatMessage,
  CompletionRequest,
  ProviderConfig,
  ProviderPricing,
} from './providerClient';

export interface MockResponses {
  /** static content to return */
  content?: string;
  /** tool calls to return */
  toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>;
  /** usage to report (defaults to estimates) */
  inputTokens?: number;
  outputTokens?: number;
  /** force this HTTP status before succeeding on the Nth call */
  failFirstNCalls?: number;
  /** force this HTTP status on every call (e.g. 429 with Retry-After) */
  alwaysStatus?: number;
  retryAfterSec?: number;
}

/** Deterministic call counter so "fail first N calls" is reproducible. */
export function createMockProvider(
  id: string,
  model: string,
  respond: (call: number, req: CompletionRequest) => { content?: string; toolCalls?: Array<{ name: string; arguments: Record<string, unknown> }>; inputTokens?: number; outputTokens?: number }
): {
  config: ProviderConfig;
  calls: number;
  /** Simulate a transport-level result without a real HTTP call. */
  invoke(req: CompletionRequest): {
    status: number;
    content: string;
    toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
    usage: { inputTokens: number; outputTokens: number };
  };
} {
  let calls = 0;
  const config: ProviderConfig = {
    id,
    baseUrl: 'http://mock.invalid',
    apiKey: 'mock-key',
    model,
    vendor: 'openai-compatible',
    authStyle: 'bearer',
    capabilities: {
      supportsTools: true,
      supportsStreaming: true,
      supportsJsonMode: true,
      contextWindowTokens: 200_000,
    },
    pricing: { inputPerMTokens: 0, outputPerMTokens: 0 } satisfies ProviderPricing,
    maxRetries: 5,
    timeoutMs: 10_000,
  };
  return {
    config,
    get calls() {
      return calls;
    },
    invoke(req: CompletionRequest) {
      calls += 1;
      const r = respond(calls, req);
      const content = r.content ?? '';
      const inputTokens = r.inputTokens ?? Math.ceil(
        req.messages.map((m: ChatMessage) => m.content.length).reduce((a, b) => a + b, 0) / 4
      );
      const outputTokens = r.outputTokens ?? Math.ceil(content.length / 4);
      return {
        status: 200,
        content,
        toolCalls: r.toolCalls ?? [],
        usage: { inputTokens, outputTokens },
      };
    },
  };
}

/**
 * Deterministic streaming source for tests: yields Anthropic-style SSE
 * events (as raw lines) that match the shapes collectSse() expects.
 */
export function anthropicSseLines(
  model: string,
  textChunks: string[],
  inputTokens: number,
  outputTokens: number
): string[] {
  const lines: string[] = [];
  lines.push(
    'event: message_start',
    `data: ${JSON.stringify({ type: 'message_start', message: { id: 'msg_test', type: 'message', role: 'assistant', model, usage: { input_tokens: inputTokens } } })}`,
    ''
  );
  textChunks.forEach((chunk, i) => {
    lines.push(
      `event: content_block_delta`,
      `data: ${JSON.stringify({ type: 'content_block_delta', index: i, delta: { type: 'text_delta', text: chunk } })}`,
      ''
    );
  });
  lines.push(
    'event: message_delta',
    `data: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: outputTokens } })}`,
    ''
  );
  lines.push(
    'event: message_stop',
    `data: ${JSON.stringify({ type: 'message_stop' })}`,
    ''
  );
  return lines;
}
