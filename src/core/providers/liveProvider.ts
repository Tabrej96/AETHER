/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 01: LIVE MODEL ENDPOINT helpers (clean, importable)
 * (src/core/providers/liveProvider.ts)
 *
 * The live end-to-end check helpers live HERE (not in a test module) so the
 * certification script and evidence tooling can import them without loading
 * node:test. live-provider.test.ts re-uses these helpers. Credentials are
 * read only from a gitignored .env / process env.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ModelProviderClient, ProviderConfig, detectErrorSentinel } from './providerClient';

export interface LiveResult {
  status:
    | 'MEASURED_LIVE_EXECUTION'
    | 'UNAVAILABLE_NO_CREDENTIALS'
    | 'UNAVAILABLE_NETWORK'
    | 'UNAVAILABLE_AUTH'
    | 'UNAVAILABLE_ERROR_SENTINEL'
    | 'UNAVAILABLE_ERROR';
  detail: string;
  providerId?: string;
  model?: string;
  content?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  latencyMs?: number;
  finalStatus?: number;
  viaFallback?: boolean;
}

/**
 * Load a .env file with ZERO dependencies (handles KEY=VALUE, optional single/
 * double quotes, # comments, CRLF, and `export KEY=` prefixes). Previously
 * this required the `dotenv` npm package at module-load time — which forced
 * every fresh consumer (including external coding agents handed the repo) to
 * finish a full `npm install` before ANYTHING could run. That is why the
 * harness now parses .env itself: the core runs with zero installed packages.
 */
export function loadDotEnv(dir: string): Record<string, string> {
  const p = path.join(dir, '.env');
  if (!fs.existsSync(p)) return {};
  const out: Record<string, string> = {};
  for (const rawLine of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    let key = line.slice(0, eq).trim();
    if (key.startsWith('export ')) key = key.slice('export '.length).trim();
    if (!key) continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"') && val.length >= 2) || (val.startsWith("'") && val.endsWith("'") && val.length >= 2)) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/**
 * Execute a real call against a configured provider and classify the outcome
 * honestly: MEASURED_LIVE_EXECUTION, or one of the UNAVAILABLE_* states.
 * A 200 whose body is an error sentinel is NEVER counted as a live execution.
 */
export async function runLiveProviderCheck(
  cfg: ProviderConfig,
  prompt = 'Reply with exactly: PONG',
  maxOutputTokens = 32
): Promise<LiveResult> {
  const client = new ModelProviderClient({ primary: cfg });
  try {
    const res = await client.complete({
      messages: [{ role: 'user', content: prompt }],
      maxOutputTokens,
    });
    if (res.errorSentinel || detectErrorSentinel(res.content)) {
      return {
        status: 'UNAVAILABLE_ERROR_SENTINEL',
        detail: `provider returned HTTP ${res.finalStatus} but the body is an error sentinel (e.g. invalid key): "${res.content.slice(0, 120)}"`,
        providerId: res.providerId,
        model: res.model,
        content: res.content,
        finalStatus: res.finalStatus,
        latencyMs: res.latencyMs,
      };
    }
    return {
      status: 'MEASURED_LIVE_EXECUTION',
      detail: `Real ${res.model} produced ${res.content.length} chars of content with provider-reported usage.`,
      providerId: res.providerId,
      model: res.model,
      content: res.content.slice(0, 200),
      inputTokens: res.usage.inputTokens,
      outputTokens: res.usage.outputTokens,
      costUsd: res.costUsd,
      latencyMs: res.latencyMs,
      finalStatus: res.finalStatus,
      viaFallback: res.viaFallback,
    };
  } catch (failure) {
    const f = failure as { kind?: string; status?: number; providerId?: string; message?: string };
    if (f.kind === 'auth') {
      return { status: 'UNAVAILABLE_AUTH', detail: `authentication rejected (HTTP ${f.status}): ${f.providerId}`, finalStatus: f.status };
    }
    if (f.kind === 'network') {
      return { status: 'UNAVAILABLE_NETWORK', detail: `network failure: ${(f.message ?? '').slice(0, 120)}` };
    }
    if (f.kind === 'error-sentinel') {
      return { status: 'UNAVAILABLE_ERROR_SENTINEL', detail: `200-with-error-body: ${JSON.stringify(f).slice(0, 120)}` };
    }
    const last = (failure as { lastFailure?: { kind?: string; content?: string; status?: number } }).lastFailure;
    if (last?.kind === 'error-sentinel') {
      return { status: 'UNAVAILABLE_ERROR_SENTINEL', detail: `provider reachable but rejected the request (200-with-error-body): "${(last.content ?? '').slice(0, 140)}"` };
    }
    if (last?.kind === 'http') {
      return { status: 'UNAVAILABLE_AUTH', detail: 'provider returned a non-retryable HTTP error for this key.', finalStatus: last.status };
    }
    return { status: 'UNAVAILABLE_ERROR', detail: `provider chain failed: ${JSON.stringify(last ?? f).slice(0, 200)}` };
  }
}

/** Build the live provider config from .env / process env, or null if unconfigured. */
export function liveProviderConfigFromEnv(): ProviderConfig | null {
  const env = { ...process.env, ...loadDotEnv(process.cwd()) };
  const baseUrl = env.AETHER_LIVE_PROVIDER_URL;
  const apiKey = env.AETHER_LIVE_PROVIDER_KEY;
  const model = env.AETHER_LIVE_PROVIDER_MODEL;
  if (!baseUrl || !apiKey || !model) return null;
  const vendor = (env.AETHER_LIVE_PROVIDER_VENDOR as 'anthropic' | 'openai-compatible') ?? 'anthropic';
  return {
    id: 'aether-live-provider',
    baseUrl,
    apiKey,
    model,
    vendor,
    authStyle: vendor === 'anthropic' ? 'x-api-key' : 'bearer',
    versionHeader: vendor === 'anthropic' ? '2023-06-01' : undefined,
    capabilities: { supportsTools: true, supportsStreaming: true, supportsJsonMode: true, contextWindowTokens: 200_000 },
    pricing: {
      inputPerMTokens: Number(env.AETHER_LIVE_PROVIDER_IN_USD_PER_M ?? 0),
      outputPerMTokens: Number(env.AETHER_LIVE_PROVIDER_OUT_USD_PER_M ?? 0),
    },
    maxRetries: 2,
    timeoutMs: 30_000,
  };
}
