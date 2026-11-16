# AETHER for Gemini CLI

Project-level instructions for Gemini CLI.

AETHER is an autonomous AI product-engineering harness: one short prompt in,
a complete, independently-verified, production-prepared product out. Gemini
(AI Studio / Antigravity / Gemini CLI) is one of the supported execution
environments.

## Control layer

- **MCP server** — `mcp/aether-mcp-server.ts` (stdio JSON-RPC 2.0), 8 tools:
  skill router, context slice, blast radius, swarm scheduler, adversarial
  gate, security spotlighter, continuity checkpoint, component-refine.
  Wire it in `.gemini/settings.json` (MCP) or `.mcp.json`.
- **Agent army** — 25 native + 71 vendored ECC agents under `.claude/agents/`
  (the `ecc/` subdirectory). AETHER re-checks "done" claims against a
  requirement-coverage matrix; the model is never the final authority.

## Recommended model tiers

| Task type                                    | Suggested model / effort |
| -------------------------------------------- | ------------------------ |
| Routine scaffolding, tests, formatting       | flash / medium           |
| Architecture, new subsystem, security review | pro / high               |
| Cross-module regression debugging            | pro / high               |

Use the cheaper model for read-only exploration and the stronger model for
high-blast-radius writes.

## Installing AETHER into a Gemini project

```bash
npx tsx bin/aether.ts install --all --target claude-code --mcp
```

The AETHER installer writes a harness-native layout and records exactly what
it created in `.aether/owned-files.json` so uninstall only removes AETHER's
files. (Gemini reuses the shared agent/skill/MCP definitions.)
