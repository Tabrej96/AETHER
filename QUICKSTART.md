# AETHER — QUICKSTART (start in under 2 minutes)

> **For AI coding agents (Gemini, Claude, Codex, …):** you do NOT need to run `npm install`.
> The harness core has **zero runtime npm dependencies** (built-in `.env` parser, no `three`,
> no `playwright` required). One command boots it:
>
> ```bash
> npx tsx bin/aether.ts validate      # ~5s: proves all 711 components + engine integrity
> ```
>
> That's the whole setup. No install, no build step, no daemon.

## 60-second path (human or agent)

```bash
git clone https://github.com/Tabrej96/anythingwithaether.git && cd AETHER
npx tsx bin/aether.ts validate     # no npm install needed — zero runtime deps
```

`npx tsx` downloads the TS runner once (a few seconds) and every engine runs offline after that.
API keys are optional: without them every engine is deterministic and free; with an
`AETHER_LIVE_PROVIDER_*` set in `.env` (see `.env.example`) the live-model paths switch on.

## What you can run right after clone (no install)

| Command | What it does | Time |
| :--- | :--- | :--- |
| `npx tsx bin/aether.ts validate` | verify 117 agents + 540 skills + 54 workflows | ~5 s |
| `npx tsx bin/aether.ts programs` | run all 21 capability engines live | ~10 s |
| `npx tsx bin/aether.ts deep` | P10: exact GST invoice + tamper guard + live Chrome recompute proof | ~15 s |
| `npx tsx bin/aether.ts fullstack` | P11: architecture decision + API contract + data/reliability/tenancy review + readiness gate | ~5 s |
| `npx tsx bin/aether.ts strategy "your product"` | P12: multi-label classification + prompt-length-independent effort + PROJECT_STRATEGY.md | ~3 s |
| `npx tsx bin/aether.ts business "your product"` | P13: domain model + state machines + edge cases + possibilities + metric discipline | ~3 s |
| `npx tsx bin/aether.ts panel "your product"` | P14: the nine-reviewer independent quality panel verdict on a plan + artifact | ~5 s |
| `npx tsx bin/aether.ts evolve` | P15: the §11 regression suite + a measured promote/hold/reject demonstration | ~5 s |
| `npx tsx bin/aether.ts calc` | P16: paise-exact EMI, proration, refund, settlement (BigInt + single rounding boundary) | ~2 s |
| `npx tsx bin/aether.ts wf` | P17: approval (maker/checker), reconciliation (double-entry), settlement (idempotent) | ~2 s |
| `npx tsx bin/aether.ts hufit` | P18: the human-centered workflow audit (fatigue, gaps, theater, lag, irreversibility) | ~2 s |
| `npx tsx bin/aether.ts design` | P19: the design-taste layer — category design language + template-slop detector (the P-S2 acceptance delta, named) | ~2 s |
| `npx tsx bin/aether.ts plan "Build a marketplace"` | P20: the execution plan a prompt OWES — mode, catalog-verified team, waves, §5 requirement tiers, stop condition | ~2 s |
| `npx tsx bin/aether.ts design-system [CATEGORY] [DIRECTION]` | P21: the §6 design-system generator — 12 creative directions, tokens with measured WCAG contrast, owed interactions, a gate+taste-verified starter; `design-system` alone runs the 28/28 acceptance matrix | ~2 s |
| `npx tsx bin/aether.ts benchmark` | reproducible benchmark suite | ~15 s |
| `npx tsx bin/aether.ts install --all --target all-harnesses --write .` | install into your editor(s), zero config | ~10 s |
| `npx tsx bin/aether.ts compare` | the full ECC/AETHER/raw-model head-to-head (needs a provider in `.env`) | ~2 min |

## Why no `npm install`?

The only things that ever *did* need installing were the interactive web workbench
(`vite`, `react`) and optional engines. None of them are on the path for:
- installing the harness,
- running any engine,
- running the comparison, or
- running the tests (`npx tsx --test src/core/aether.test.ts` — also zero-install).

If you *do* want the React workbench: `npm install --legacy-peer-deps && npm run dev`.
Everything else above works without it.
