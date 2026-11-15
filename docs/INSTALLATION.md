# AETHER 1.0 — Installation

Created by Tabrej · License: Apache-2.0 · Node **18+** required (verified on Node 24).

AETHER is an open-source TypeScript agent harness. You use it in one of two ways:

1. **In your project** (recommended): install it, then run its CLI to install agents/skills/MCP config into your harness (Claude Code, Codex, Cursor, OpenCode).
2. **As a library**: `import { … } from 'aether-harness'` after `npm install`.

---

## 1. Requirements

| Requirement | Why |
| :--- | :--- |
| Node.js ≥ 18 (LTS recommended; 24 verified) | The compiled bins target node18 |
| npm (any recent version) | Installs the package + runs `prepare` |
| 200 MB disk | Dependencies; the published tarball itself is ~150 KB |
| Network | Only for `npm install` and the optional live provider; all benchmark/verification paths run offline |

## 2. From GitHub (development / first release)

```bash
git clone https://github.com/Tabrej96/anythingwithaether.git
cd AETHER
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required on first install (a peer-dep conflict with
> ESR tooling in the dependency tree); every later `npm install` works without
> it. If `prepare` (bin bundling) is skipped, all CLI usage below still works
> via `npx tsx bin/aether.ts …` (tsx is a devDependency).

Verify the install:

```bash
npx tsx bin/aether.ts programs
```

Expected: prints the nine capability-program registry, a provenance audit
(`OK`), and the lifecycle table — then exits 0.

## 3. One-command harness install

Writes agents, skills, rules, and the 8-tool MCP config into **your target
harness**'s conventions:

```bash
npx tsx bin/aether.ts install --all --target all-harnesses --mcp --write .
```

Targets: `claude-code` · `codex` · `cursor` · `opencode` · `mcp-server` ·
`all-harnesses`. Selective installs take packs:

```bash
npx tsx bin/aether.ts install --target cursor --packs aws-cloud-vps,design-ui --mcp --write .
```

An ownership manifest (`.aether/owned-files.json`) is written so removal is
scoped and safe:

```bash
npx tsx bin/aether.ts uninstall --write .
```

Uninstall removes **only** files AETHER wrote (path-containment guarded);
your own files are never touched.

## 4. The published package (`aether-harness`)

```bash
npm install aether-harness
```

The tarball carries pre-built, self-contained ESM bins (`dist/bins/`) — they
run with zero `node_modules` of their own. Bin shims: `aether` (CLI),
`aether-mcp` (MCP stdio server).

## 5. Unix one-liner

On Linux/macOS (and WSL):

```bash
curl -fsSL https://raw.githubusercontent.com/Tabrej96/anythingwithaether/main/install.sh | bash -s -- --all
```

`install.sh` is also in the repo root — run it locally for selective packs:

```bash
bash install.sh --target cursor --packs core-polyglot --mcp
```

## 6. Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for install errors, offline
behavior, and uninstall specifics.
