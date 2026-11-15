/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 01: Streaming (SSE) support for model providers
 * (src/core/providers/streaming.ts)
 *
 * Anthropic-style SSE event parsing, reduced into the same CompletionResult
 * shape as the non-streaming path. The client's streamComplete() drives this.
 */
import type { CompletionResult, ToolCall, Usage } from './providerClient';

export type SseEvent = { event?: string; data: string };

/**
 * Read a WHATWG ReadableStream<Uint8Array> of Server-Sent Events, emitting
 * each SSE event via onEvent. Handles multi-line `data`, comment/keepalive
 * lines (":"), the terminal empty-line boundary, and the stream EOF.
 */
export async function collectSse(body: ReadableStream<Uint8Array>, onEvent: (evt: SseEvent) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';
  let dataLines: string[] = [];

  const flush = () => {
    if (dataLines.length > 0) {
      onEvent({ event: event || undefined, data: dataLines.join('\n') });
      dataLines = [];
      event = '';
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      flush();
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    let nl = -1;
    while ((nl = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.startsWith(':')) continue; // SSE comment / keepalive
      if (line === '') {
        flush();
        continue;
      }
      const colon = line.indexOf(':');
      const name = colon === -1 ? line : line.slice(0, colon);
      let val = colon === -1 ? '' : line.slice(colon + 1);
      if (val.startsWith(' ')) val = val.slice(1);
      if (name === 'data') dataLines.push(val);
      else if (name === 'event') event = val;
    }
  }
}

/**
 * Reduce a sequence of Anthropic-style SSE events into a single
 * CompletionResult: message_start (input usage), content_block_delta
 * (text + tool input_json), message_delta (stop_reason + output usage).
 */
export function reduceAnthropicSse(
  providerId: string,
  model: string,
  events: SseEvent[],
  latencyMs: number,
  attempts: number,
  finalStatus: number,
  viaFallback: boolean
): CompletionResult {
  let content = '';
  let toolJson = '';
  let inputTokens = 0;
  let outputTokens = 0;

  for (const { event, data } of events) {
    let json: Record<string, any>;
    try {
      json = JSON.parse(data);
    } catch {
      continue;
    }
    switch (event ?? json.type) {
      case 'message_start':
        inputTokens = json.message?.usage?.input_tokens ?? inputTokens;
        break;
      case 'content_block_delta': {
        const d = json.delta;
        if (d?.type === 'text_delta') content += d.text ?? '';
        else if (d?.type === 'input_json_delta') toolJson += d.partial_json ?? '';
        break;
      }
      case 'message_delta':
        outputTokens = json.usage?.output_tokens ?? outputTokens;
        break;
      default:
        break;
    }
  }

  let toolCalls: ToolCall[] = [];
  if (toolJson.trim().length > 0) {
    try {
      const parsed = JSON.parse(toolJson);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      toolCalls = arr.map((t: any) => ({ name: t?.name ?? '', arguments: t?.input ?? {} }));
    } catch {
      toolCalls = [];
    }
  }

  const usage: Usage =
    inputTokens > 0 || outputTokens > 0
      ? { inputTokens, outputTokens, source: 'provider-reported' }
      : { inputTokens: 0, outputTokens: 0, source: 'estimated' };

  return {
    providerId,
    model,
    content,
    toolCalls,
    usage,
    costUsd: 0,
    latencyMs,
    attempts,
    finalStatus,
    viaFallback,
    errorSentinel: false,
  };
}
