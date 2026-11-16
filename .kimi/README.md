# AETHER for Kimi Code CLI

Project-level instructions for Kimi Code.

AETHER is an autonomous AI product-engineering harness: one short prompt in,
a complete, independently-verified, production-prepared product out. Kimi Code
(`@moonshot-ai/kimi-code`) is one of the supported execution environments.

## What Kimi Code discovers natively

- `.kimi/README.md` (this file) — project instructions loaded by Kimi Code's
  hierarchical instruction discovery.
- The shared agent/skill/MCP definitions AETHER ships under `.claude/` (Kimi
  reuses the Agent Skills layout) and `.mcp.json`.

## Control layer

- **MCP server** — `mcp/aether-mcp-server.ts` (stdio JSON-RPC 2.0), 8 tools:
  skill router, context slice, blast radius, swarm scheduler, adversarial
  gate, security spotlighter, continuity checkpoint, component-refine.
- **Agent army** — 25 native + 71 vendored ECC agents under `.claude/agents/`
  (the `ecc/` subdirectory). AETHER re-checks "done" claims against a
  requirement-coverage matrix; the model is never the final authority.

## Recommended model tiers

| Task type                                    | Suggested model / effort |
| -------------------------------------------- | ------------------------ |
| Routine scaffolding, tests, formatting       | standard / medium        |
| Architecture, new subsystem, security review | top / high               |
| Cross-module regression debugging            | top / high               |

## Installing AETHER into a Kimi project

```bash
npx tsx bin/aether.ts install --all --target claude-code --mcp
```

The AETHER installer writes a harness-native layout and records exactly what
it created in `.aether/owned-files.json` so uninstall only removes AETHER's
files. (Kimi reuses the shared agent/skill/MCP definitions.)

## Provider config

Kimi Code provider configuration (`~/.kimi-code/config.toml`) is separate and
is not touched by the project installer. Point it at any OpenAI/Anthropic/
OpenAI-compatible endpoint you trust.
