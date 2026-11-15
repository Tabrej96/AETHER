# AETHER 1.0 — Model Providers

Created by Tabrej · License: Apache-2.0

AETHER's model layer (`src/core/providers/`) is vendor-agnostic: one
`ModelProviderClient` drives a **primary + fallback chain** of HTTP endpoints
using the standard OpenAI-compatible or Anthropic wire formats. No provider
SDK is required — it is a plain HTTPS client with retries, backoff, and
health monitoring.

---

## 1. Supported wire formats

| Vendor mode | Auth | When to use |
| :--- | :--- | :--- |
| `anthropic` | `x-api-key` + `anthropic-version` | Anthropic API or a compatible gateway |
| `openai-compatible` | `bearer` | OpenAI, OpenRouter, Ollama, vLLM, LiteLLM, or any `/v1/chat/completions`-style endpoint |

## 2. Configuring a live endpoint

Put this in a gitignored `.env` (template in `.env.example`):

```ini
AETHER_LIVE_PROVIDER_URL="https://api.example.com/v1"
AETHER_LIVE_PROVIDER_KEY="your-key"
AETHER_LIVE_PROVIDER_MODEL="your-model-id"
AETHER_LIVE_PROVIDER_VENDOR="anthropic"     # or "openai-compatible"
AETHER_LIVE_PROVIDER_IN_USD_PER_M="3.0"     # optional, for cost reporting
AETHER_LIVE_PROVIDER_OUT_USD_PER_M="15.0"
```

See [CONFIGURATION.md](./CONFIGURATION.md) for the full key table.

## 3. Honest availability states

The live end-to-end check (`GATE-01`) never fabricates a result. Its terminal
states, in order of meaning:

| Status | Meaning |
| :--- | :--- |
| `MEASURED_LIVE_EXECUTION` | A real model produced real tokens with provider-reported usage |
| `UNAVAILABLE_NO_CREDENTIALS` | `.env` not configured — expected on a clean clone |
| `UNAVAILABLE_NETWORK` | Endpoint unreachable (offline / wrong host) |
| `UNAVAILABLE_AUTH` | The provider rejected the key (401/403 or a non-retryable HTTP error) |
| `UNAVAILABLE_ERROR_SENTINEL` | The endpoint answered HTTP 200 but with an error body (e.g. an invalid-key sentinel) — **never** counted as a live execution |
| `UNAVAILABLE_ERROR` | Any other chain failure (recorded, not masked) |

## 4. Failure handling (measured, not asserted)

- **Retries with full-jitter exponential backoff** (`backoffMs`): base 250 ms,
  cap 8 s. Honors `Retry-After` / `X-RateLimit-Reset-InSeconds` on 429/428.
- **Health monitor** (`ProviderHealthMonitor`): a provider that keeps failing
  is skipped for subsequent calls in the chain.
- **Fallback chain**: `primary` then `fallbacks[]` — a 100%-failing primary
  fails over cleanly (verified by `scripts/perf-stress.ts`, GATE 09: 30/30
  calls fell through to the fallback, zero crashes).
- **Error-sentinel detection** (`detectErrorSentinel`): some gateways return
  200 with an error message as the body; AETHER detects this and treats it as
  a failure, not as model output.
- **Cost reporting**: `inputPerMTokens`/`outputPerMTokens` price the
  provider-reported usage; without pricing configured, cost is reported as
  `UNAVAILABLE` — never guessed.

## 5. What AETHER does NOT need

Everything except the live check runs with **zero** provider configuration:
the deterministic benchmark suite, the nine programs, the MCP server, and the
reproducible task repositories all execute locally. Providers are a
capability, not a dependency.
