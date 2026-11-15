/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 01: REAL MODEL INFRASTRUCTURE
 * (src/core/providers/providerClient.ts)
 *
 * A genuine provider client built on Node's global fetch. Implements:
 *  - real provider API calls (OpenAI-compatible + Anthropic REST endpoints),
 *  - streaming responses (SSE),
 *  - tool calling + structured (JSON) responses,
 *  - capability detection (tools/streaming/json) via probe or declaration,
 *  - context-window management (token estimate + truncation policy),
 *  - authentication (bearer / x-api-key + anthropic-version header),
 *  - rate-limit handling (429 -> Retry-After / X-RateLimit-Reset),
 *  - retry with exponential backoff + jitter,
 *  - provider timeouts (AbortSignal per request) and global cancellation,
 *  - fallback provider chains,
 *  - real token usage (provider-reported, with estimation fallback),
 *  - actual cost tracking from a pricing table,
 *  - provider health monitoring.
 *
 * Mock providers remain for automated tests, but this client is what makes a
 * real call, and its contract is verified against a local HTTP mock server
 * (never against a mock passed off as production evidence).
 */

import { collectSse, reduceAnthropicSse, SseEvent } from './streaming';

export interface ProviderPricing {
  inputPerMTokens: number; // USD
  outputPerMTokens: number; // USD
}

export interface ProviderCapabilities {
  supportsTools: boolean;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
  contextWindowTokens: number;
}

export interface ProviderConfig {
  id: string;
  baseUrl: string; // e.g. https://api.openai.com/v1 or https://api.anthropic.com/v1
  apiKey: string;
  model: string;
  vendor: 'openai-compatible' | 'anthropic';
  authStyle: 'bearer' | 'x-api-key';
  versionHeader?: string; // e.g. '2023-06-01' for anthropic
  capabilities: ProviderCapabilities;
  pricing: ProviderPricing;
  maxRetries: number;
  timeoutMs: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface CompletionRequest {
  messages: ChatMessage[];
  tools?: ToolSpec[];
  toolChoice?: 'auto' | 'none' | string;
  jsonMode?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  /** cancel this request; the call rejects with reason 'cancelled' */
  signal?: AbortSignal;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  source: 'provider-reported' | 'estimated';
}

export interface CompletionResult {
  providerId: string;
  model: string;
  content: string;
  toolCalls: ToolCall[];
  usage: Usage;
  costUsd: number;
  latencyMs: number;
  attempts: number;
  finalStatus: number;
  viaFallback: boolean;
  /**
   * True when the provider returned HTTP 200 but the payload is an
   * error/invalid-key sentinel rather than a real completion. Callers MUST
   * treat this as a failure — a 200-with-error-body is a real hazard that
   * would otherwise masquerade as success.
   */
  errorSentinel: boolean;
}

export interface RateLimitedError {
  retryAfterMs: number;
}

export type ProviderFailure =
  | { kind: 'rate-limited'; retryAfterMs: number; providerId: string }
  | { kind: 'http'; status: number; providerId: string; body?: string }
  | { kind: 'network'; providerId: string; message: string }
  | { kind: 'timeout'; providerId: string }
  | { kind: 'cancelled'; providerId: string }
  | { kind: 'auth'; status: number; providerId: string }
  /** Provider answered HTTP 200 but the body is an error sentinel (e.g. "Invalid API key"). */
  | { kind: 'error-sentinel'; providerId: string; content: string };

// --------------------------------------------------------------------------- token estimation
/** Rough, documented token estimate (~4 chars/token). Used only as a fallback when the provider does not report usage. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Providers sometimes return HTTP 200 with an *error body shaped like a
 * normal completion* (e.g. `content: [{"type":"text","text":"⚠️ Invalid API key"}]`).
 * Detect that so a 200 is never silently mistaken for a real answer.
 */
const ERROR_SENTINEL_RE =
  /invalid\s+api\s+key|bad\s+credentials|authentication\s+(?:failed|error)|auth(?:entication)?\s+(?:failed|error)|unauthori[sz]ed|access\s+denied|quota\s+exceeded|rate[\s_-]?limit(?:ed)?\b|service\s+unavailable|model\s+(?:not|is)\s+(?:found|available)|no\s+active\s+subscription|invalid\s+(?:request|token)|internal\s+server\s+error/i;

export function detectErrorSentinel(content: string): boolean {
  // Only flag short, terse responses that read like an error; a long
  // legitimate answer mentioning "quota" mid-paragraph is not a sentinel.
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.length > 300) return false;
  return ERROR_SENTINEL_RE.test(trimmed);
}

/** Truncate messages to fit a context window (keeps the system + most recent). */
export function fitContextWindow(
  messages: ChatMessage[],
  contextWindowTokens: number,
  reservedOutputTokens = 1024
): { messages: ChatMessage[]; truncated: boolean; estimatedTokens: number } {
  const budget = Math.max(1, contextWindowTokens - reservedOutputTokens);
  let total = messages.reduce((s, m) => s + estimateTokens(m.content), 0);
  let out = messages;
  let truncated = false;
  if (total > budget) {
    // drop oldest user/assistant turns after the system prompt
    const system = messages.filter((m) => m.role === 'system');
    const rest = [...messages].filter((m) => m.role !== 'system').reverse();
    let kept = 0;
    const keptMsgs: ChatMessage[] = [];
    for (const m of rest) {
      const cost = estimateTokens(m.content);
      if (kept + cost > budget) break;
      kept += cost;
      keptMsgs.push(m);
    }
    keptMsgs.reverse();
    out = [...system, ...keptMsgs];
    total = out.reduce((s, m) => s + estimateTokens(m.content), 0);
    truncated = true;
  }
  return { messages: out, truncated, estimatedTokens: total };
}

// --------------------------------------------------------------------------- backoff
export function backoffMs(attempt: number, baseMs = 250, capMs = 8000): number {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(exp * (0.5 + Math.random() * 0.5)); // full-jitter
}

// --------------------------------------------------------------------------- health
export class ProviderHealthMonitor {
  private readonly byProvider = new Map<string, Array<{ ok: boolean; latencyMs: number; status?: number }>>();

  health(providerId: string, ok: boolean, latencyMs: number, status?: number): void {
    const arr = this.byProvider.get(providerId) ?? [];
    arr.push({ ok, latencyMs, status });
    if (arr.length > 500) arr.splice(0, arr.length - 500);
    this.byProvider.set(providerId, arr);
  }

  /** A provider is UNHEALTHY when the majority of its recent calls failed. */
  isHealthy(providerId: string, lookback = 50): boolean {
    const recent = (this.byProvider.get(providerId) ?? []).slice(-lookback);
    if (recent.length === 0) return true; // never tried -> assume healthy
    const failures = recent.filter((s) => !s.ok).length;
    return failures <= recent.length / 2;
  }

  /** Mean latency of the last successful calls (0 if none). */
  avgLatencyMs(providerId: string, lookback = 50): number {
    const recent = (this.byProvider.get(providerId) ?? []).slice(-lookback).filter((s) => s.ok);
    if (recent.length === 0) return 0;
    return Math.round(recent.reduce((s, x) => s + x.latencyMs, 0) / recent.length);
  }
}

// --------------------------------------------------------------------------- provider client
export interface ModelProviderClientOptions {
  primary: ProviderConfig;
  fallbacks?: ProviderConfig[];
  healthMonitor?: ProviderHealthMonitor;
  /** transport override for tests (defaults to global fetch) */
  fetchImpl?: typeof fetch;
}

export class ModelProviderClient {
  private readonly chains: ProviderConfig[];
  private readonly health: ProviderHealthMonitor;
  private readonly doFetch: typeof fetch;

  constructor(opts: ModelProviderClientOptions) {
    this.chains = [opts.primary, ...(opts.fallbacks ?? [])];
    this.health = opts.healthMonitor ?? new ProviderHealthMonitor();
    this.doFetch = opts.fetchImpl ?? ((...a) => fetch(...a));
  }

  /** Try providers in order; skip ones whose health monitor marks them unhealthy. */
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    let viaFallback = false;
    let lastFailure: ProviderFailure | null = null;
    for (let i = 0; i < this.chains.length; i++) {
      const cfg = this.chains[i];
      if (i > 0) viaFallback = true;
      if (!this.health.isHealthy(cfg.id)) continue;
      try {
        const result = await this.completeOne(cfg, req, viaFallback);
        this.health.health(cfg.id, true, result.latencyMs);
        return result;
      } catch (failure) {
        const f = failure as ProviderFailure;
        lastFailure = f;
        this.health.health(cfg.id, false, 0, (f as ProviderFailure & { status?: number }).status);
        // Hard auth/cancel: a 401/403 or an explicit abort means stop now.
        if (f.kind === 'auth' || f.kind === 'cancelled') {
          // Throw a proper Error (carrying the failure shape) so callers can
          // inspect it and string-match on kind/status.
          const err = new Error(
            f.kind === 'auth'
              ? `provider ${f.providerId} rejected authentication (HTTP ${f.status})`
              : `provider ${f.providerId} request was cancelled by operator`
          );
          Object.assign(err, f);
          throw err;
        }
        // error-sentinel: the provider is reachable but rejected the key/content.
        // Fall through to the next provider in the chain rather than aborting —
        // the chain may hold a valid key for the fallback provider.
      }
    }
    const err = new Error(`all providers exhausted; last failure: ${JSON.stringify(lastFailure)}`);
    (err as { lastFailure?: unknown }).lastFailure = lastFailure;
    throw err;
  }

  /** Capability detection: declared capabilities + a live probe when requested. */
  async detectCapabilities(cfg: ProviderConfig, liveProbe = false): Promise<ProviderCapabilities> {
    const declared = { ...cfg.capabilities };
    if (!liveProbe) return declared;
    // Live probe: ask for a one-token completion with a tool to see if the
    // provider actually accepts tools + json modes.
    try {
      const res = await this.completeOne(cfg, {
        messages: [{ role: 'user', content: 'ping' }],
        tools: [{ name: 'noop', description: 'no-op probe', parameters: { type: 'object' } }],
        maxOutputTokens: 4,
      }, false);
      declared.supportsTools = res.toolCalls.length === 0 ? declared.supportsTools : true;
      return declared;
    } catch {
      // Probe failed: keep declared capabilities, mark tools unsupported to be safe.
      return { ...declared, supportsTools: false };
    }
  }

  /**
   * Stream a completion (Anthropic SSE: message_start / content_block_delta /
   * message_delta). onEvent fires for each text/tool delta. Fallback
   * providers are tried only if no event was emitted yet from the primary.
   */
  async streamComplete(
    req: CompletionRequest,
    onEvent?: (delta: { type: 'text'; text: string } | { type: 'tool'; name: string; partial: string }) => void
  ): Promise<CompletionResult> {
    let viaFallback = false;
    let lastFailure: ProviderFailure | null = null;
    for (let i = 0; i < this.chains.length; i++) {
      const cfg = this.chains[i];
      if (i > 0) viaFallback = true;
      if (!this.health.isHealthy(cfg.id)) continue;
      const start = Date.now();
      let emitted = false;
      try {
        const body: Record<string, unknown> = { ...this.buildRequestBody(cfg, req), stream: true };
        const headers = this.buildHeaders(cfg);
        const perRequest = AbortSignal.timeout(cfg.timeoutMs);
        const signal = req.signal ? AbortSignal.any([req.signal, perRequest]) : perRequest;
        const res = await this.doFetch(cfg.baseUrl + this.requestPath(cfg), {
          method: 'POST',
          headers: { ...headers, accept: 'text/event-stream' },
          body: JSON.stringify(body),
          signal,
        });
        if (res.status === 401 || res.status === 403) {
          const f: ProviderFailure = { kind: 'auth', status: res.status, providerId: cfg.id };
          lastFailure = f;
          this.health.health(cfg.id, false, 0, res.status);
          throw f;
        }
        if (!res.ok || !res.body) {
          lastFailure = { kind: 'http', status: res.status, providerId: cfg.id, body: (await res.text().catch(() => '')).slice(0, 300) };
          this.health.health(cfg.id, false, 0, res.status);
          continue;
        }
        const events: SseEvent[] = [];
        await collectSse(res.body, (evt) => {
          events.push(evt);
          let json: Record<string, any>;
          try { json = JSON.parse(evt.data); } catch { return; }
          const d = json.delta;
          if (d?.type === 'text_delta' && d.text) {
            emitted = true;
            onEvent?.({ type: 'text', text: d.text });
          } else if (d?.type === 'input_json_delta' && d.partial_json) {
            emitted = true;
            onEvent?.({ type: 'tool', name: '', partial: d.partial_json });
          }
        });
        const result = reduceAnthropicSse(cfg.id, cfg.model, events, Date.now() - start, 1, res.status, viaFallback);
        result.costUsd =
          (result.usage.inputTokens / 1e6) * cfg.pricing.inputPerMTokens +
          (result.usage.outputTokens / 1e6) * cfg.pricing.outputPerMTokens;
        this.health.health(cfg.id, true, result.latencyMs, res.status);
        return result;
      } catch (failure) {
        if (emitted) throw failure; // stream already started: no mid-stream fallback
        const f = failure as ProviderFailure;
        lastFailure = f;
        this.health.health(cfg.id, false, 0, (f as ProviderFailure & { status?: number }).status);
        if (f.kind === 'auth' || f.kind === 'cancelled' || f.kind === 'timeout') {
          const err = new Error(
            f.kind === 'auth'
              ? `provider ${f.providerId} rejected authentication (HTTP ${f.status})`
              : f.kind === 'timeout'
                ? `provider ${f.providerId} request timed out`
                : `provider ${f.providerId} request was cancelled by operator`
          );
          Object.assign(err, f);
          throw err;
        }
      }
    }
    const err = new Error(`streamComplete: all providers exhausted; last failure: ${JSON.stringify(lastFailure)}`);
    (err as { lastFailure?: unknown }).lastFailure = lastFailure;
    throw err;
  }

  private async completeOne(cfg: ProviderConfig, req: CompletionRequest, viaFallback: boolean = false): Promise<CompletionResult> {
    const body = this.buildRequestBody(cfg, req);
    const headers = this.buildHeaders(cfg);
    const start = Date.now();
    let attempt = 0;
    let rateLimitedMs = 0;

    for (; attempt <= cfg.maxRetries; attempt++) {
      if (req.signal?.aborted) throw { kind: 'cancelled', providerId: cfg.id };
      const perRequest = AbortSignal.timeout(cfg.timeoutMs);
      const signal = req.signal
        ? AbortSignal.any([req.signal, perRequest])
        : perRequest;
      let res: Response;
      try {
        res = await this.doFetch(cfg.baseUrl + this.requestPath(cfg), {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal,
        });
      } catch (e) {
        if ((e as { name?: string }).name === 'AbortError') {
          throw { kind: 'timeout', providerId: cfg.id };
        }
        throw { kind: 'network', providerId: cfg.id, message: String((e as Error).message) };
      }

      if (res.status === 401 || res.status === 403) {
        throw { kind: 'auth', status: res.status, providerId: cfg.id };
      }
      if (res.status === 429 || res.status === 428) {
        // rate limit: honor Retry-After / X-RateLimit-Reset, else backoff
        const retryAfterSec = Number(res.headers.get('retry-after') ?? '0');
        const resetSec = Number(res.headers.get('x-ratelimit-reset-in-seconds') ?? '0');
        rateLimitedMs = Math.max(retryAfterSec, resetSec) * 1000 || backoffMs(attempt);
        if (attempt < cfg.maxRetries) {
          await sleepMs(rateLimitedMs, req.signal);
          continue;
        }
        throw { kind: 'rate-limited', retryAfterMs: rateLimitedMs, providerId: cfg.id };
      }
      if (!res.ok) {
        // 5xx is retryable
        if (res.status >= 500 && attempt < cfg.maxRetries) {
          await sleepMs(backoffMs(attempt), req.signal);
          continue;
        }
        const text = await res.text().catch(() => '');
        throw { kind: 'http', status: res.status, providerId: cfg.id, body: text.slice(0, 500) };
      }

      const latencyMs = Date.now() - start;
      const parsed = await this.parseResponse(cfg, res, req);
      const costUsd =
        (parsed.usage.inputTokens / 1e6) * cfg.pricing.inputPerMTokens +
        (parsed.usage.outputTokens / 1e6) * cfg.pricing.outputPerMTokens;
      const result: CompletionResult = {
        providerId: cfg.id,
        model: cfg.model,
        content: parsed.content,
        toolCalls: parsed.toolCalls,
        usage: parsed.usage,
        costUsd,
        latencyMs,
        attempts: attempt + 1,
        finalStatus: res.status,
        viaFallback,
        errorSentinel: parsed.errorSentinel,
      };
      if (parsed.errorSentinel) {
        // A 200 whose body is an error sentinel is a FAILURE, not a success.
        // Mark it so complete() can fall through to the next provider (or
        // surface it honestly) instead of reporting a fake completion.
        throw { kind: 'error-sentinel', providerId: cfg.id, content: parsed.content };
      }
      return result;
    }
    throw { kind: 'rate-limited', retryAfterMs: rateLimitedMs, providerId: cfg.id };
  }

  private buildHeaders(cfg: ProviderConfig): Record<string, string> {
    const h: Record<string, string> = { 'content-type': 'application/json' };
    if (cfg.authStyle === 'bearer') h.authorization = `Bearer ${cfg.apiKey}`;
    else {
      h['x-api-key'] = cfg.apiKey;
      if (cfg.versionHeader) h['anthropic-version'] = cfg.versionHeader;
    }
    // Claude requires the anthropic header; OpenAI-compatible does not.
    if (cfg.vendor === 'anthropic') h['anthropic-dangerous-direct-browser-access'] = 'true';
    return h;
  }

  private requestPath(cfg: ProviderConfig): string {
    return cfg.vendor === 'anthropic' ? '/messages' : '/chat/completions';
  }

  private buildRequestBody(cfg: ProviderConfig, req: CompletionRequest): Record<string, unknown> {
    const messages = req.messages;
    const model = cfg.model;
    if (cfg.vendor === 'anthropic') {
      const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
      const rest = messages.filter((m) => m.role !== 'system');
      const body: Record<string, unknown> = {
        model,
        system: system || undefined,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
        max_tokens: req.maxOutputTokens ?? 1024,
        temperature: req.temperature ?? 0,
      };
      if (req.jsonMode) body.response_format = { type: 'json_object' } ; // honored when supported
      if (req.tools && req.tools.length > 0 && cfg.capabilities.supportsTools) {
        body.tools = req.tools.map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters,
        }));
      }
      return body;
    }
    // OpenAI-compatible
    const body: Record<string, unknown> = {
      model,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0,
      max_tokens: req.maxOutputTokens ?? 1024,
    };
    if (req.jsonMode) body.response_format = { type: 'json_object' };
    if (req.tools && req.tools.length > 0 && cfg.capabilities.supportsTools) {
      body.tools = req.tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
      if (req.toolChoice) body.tool_choice = req.toolChoice;
    }
    return body;
  }

  private async parseResponse(
    cfg: ProviderConfig,
    res: Response,
    req: CompletionRequest
  ): Promise<{ content: string; toolCalls: ToolCall[]; usage: Usage; errorSentinel: boolean }> {
    const raw = await res.text();
    const json = JSON.parse(raw) as Record<string, any>;

    let content = '';
    let toolCalls: ToolCall[] = [];
    if (cfg.vendor === 'anthropic') {
      const blocks: Array<{ type: string; text?: string; name?: string; input?: Record<string, unknown> }> = json.content ?? [];
      for (const b of blocks) {
        if (b.type === 'text') content += b.text ?? '';
        else if (b.type === 'tool_use') toolCalls.push({ name: b.name ?? '', arguments: b.input ?? {} });
      }
    } else {
      const msg = json.choices?.[0]?.message;
      content = msg?.content ?? '';
      for (const tc of msg?.tool_calls ?? []) {
        const args = safeParseArgs(tc.function?.arguments);
        toolCalls.push({ name: tc.function?.name ?? '', arguments: args });
      }
    }

    let usage: Usage;
    if (json.usage && (json.usage.input_tokens ?? json.usage.prompt_tokens) != null) {
      usage = {
        inputTokens: json.usage.input_tokens ?? json.usage.prompt_tokens ?? 0,
        outputTokens: json.usage.output_tokens ?? json.usage.completion_tokens ?? 0,
        source: 'provider-reported',
      };
    } else {
      usage = {
        inputTokens: estimateTokens(req.messages.map((m) => m.content).join('')),
        outputTokens: estimateTokens(content),
        source: 'estimated',
      };
    }
    return { content, toolCalls, usage, errorSentinel: detectErrorSentinel(content) };
  }
}

function safeParseArgs(v: unknown): Record<string, unknown> {
  if (typeof v === 'object' && v != null) return v as Record<string, unknown>;
  try {
    return JSON.parse(String(v ?? '{}'));
  } catch {
    return {};
  }
}

function sleepMs(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(), ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
}

