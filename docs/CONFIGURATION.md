# AETHER 1.0 — Configuration

Created by Tabrej · License: Apache-2.0

AETHER has three configuration surfaces, all file-based and fully offline:

| Surface | File | Purpose |
| :--- | :--- | :--- |
| Provider credentials | `.env` (gitignored) | Live model endpoint for the GATE 01 end-to-end check (test suite + `scripts/certify-benchmarks.ts`) |
| MCP permission policy | `.env` (`AETHER_MCP_PERMISSION_POLICY`) | Least-privilege tool allow/deny for the MCP server |
| Harness install manifest | `.aether/manifest.json` + `.aether/owned-files.json` (per project) | What `install` wrote, so `uninstall` removes exactly that |

There is no global config, no daemon, and no cloud account. If a value is
missing, the feature reports its honest state (`UNAVAILABLE_NO_CREDENTIALS`,
not a fabricated result) rather than failing silently.

---

## 1. `.env` (provider credentials — optional)

Copy the template and fill in the block you need:

```bash
cp .env.example .env   # .env is gitignored; .env.example is committed
```

Live model endpoint (used ONLY by the live end-to-end check; every other path
in AETHER runs without it):

```ini
AETHER_LIVE_PROVIDER_URL="https://api.example.com/v1"
AETHER_LIVE_PROVIDER_KEY="your-key"            # NEVER commit a real key
AETHER_LIVE_PROVIDER_MODEL="your-model-id"
AETHER_LIVE_PROVIDER_VENDOR="anthropic"         # or "openai-compatible"
AETHER_LIVE_PROVIDER_IN_USD_PER_M="0"           # input pricing, USD per 1M tokens
AETHER_LIVE_PROVIDER_OUT_USD_PER_M="0"         # output pricing, USD per 1M tokens
```

With any of URL/KEY/MODEL missing, `aether benchmark` still works — the live
check simply records `UNAVAILABLE_NO_CREDENTIALS` and the reproducible local
suite runs fully offline. See [PROVIDERS.md](./PROVIDERS.md).

## 2. MCP permission policy (optional, least-privilege)

The MCP server accepts a JSON policy controlling which of its 20 tools run
freely, which need approval, and which are denied:

```ini
AETHER_MCP_PERMISSION_POLICY='{"deniedTools":[],"requireApprovalFor":[],"approvedTools":[]}'
```

An empty policy (the default) permits all tools with their built-in safety
gates. The `aether_security_spotlighter` tool still scans inputs regardless of
policy — the policy narrows what *you* allow, it cannot widen the safety gate.

## 3. Harness install manifest (written per project)

After `aether install --write .`:

- `.aether/manifest.json` — the generated harness config content.
- `.aether/owned-files.json` — the exact list of files AETHER created.
- `.mcp.json` — the MCP server registration (when `--mcp` was passed).

`aether uninstall --write .` reads `owned-files.json` and removes **only** those
files (path-containment guarded), leaving your own config untouched.

## 4. What is NOT configurable

The nine capability programs, the 711 component catalog, and the benchmark
task repositories are fixed, versioned data (`src/data/`,
`src/core/programs/`) — that is deliberate: AETHER ships **measured,
reproducible** capabilities, not user-editable ones that would silently
change benchmark results. To customize behavior, use the harness install
targets and the MCP policy above.
