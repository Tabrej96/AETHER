# AETHER for Codex CLI

This supplements the root `README.md` with Codex-specific guidance.

AETHER is an autonomous AI product-engineering harness: one short prompt in,
a complete, independently-verified, production-prepared product out. Codex is
one of the supported execution environments (like Claude Code, Gemini/Antigravity,
Kimi Code, and OpenCode).

## How AETHER controls the engineering process

AETHER does not just hand the model a big system prompt. It exposes a control
layer through:

- **MCP server** — `mcp/aether-mcp-server.ts` (stdio JSON-RPC 2.0). Eight tools:
  `aether_skill_router`, `aether_context_slice`, `aether_blast_radius`,
  `aether_swarm_scheduler`, `aether_adversarial_gate`, `aether_security_spotlighter`,
  `aether_continuity_checkpoint`, `aether_component_score_refine`.
- **Agent army** — 25 native + 71 vendored ECC agents under `.claude/agents/`
  (the `ecc/` subdirectory). Codex's native subagent definitions live in
  `.codex/agents/*.toml`.
- **Independent verification** — AETHER re-checks "done" claims against the
  requirement-coverage matrix; the model is never the final authority.

## Recommended model tiers

| Task type                                    | Suggested model / effort |
| -------------------------------------------- | ------------------------ |
| Routine scaffolding, tests, formatting       | Sonnet / medium          |
| Architecture, new subsystem, security review | Opus / high              |
| Debugging cross-module regressions           | Opus / high              |

Use the cheaper model for read-only exploration (see `agents/explorer.toml`)
and the stronger model for high-blast-radius writes.

## Installing AETHER into a Codex project

```bash
# One command: agents + skills + rules + MCP server into the current repo
npx tsx bin/aether.ts install --all --target codex --mcp
```

The installer writes the Codex-native layout and records exactly what it
created in `.aether/owned-files.json` so `uninstall` only removes AETHER's
files.

## Native Codex multi-agent roles

Defined under `.codex/agents/`:

- `explorer.toml` — read-only codebase explorer (evidence before changes).
- `reviewer.toml` — correctness/security/missing-test reviewer.
- `planner.toml` — product & architecture planner.

Enable with `[features] multi_agent = true` in `.codex/config.toml`.
