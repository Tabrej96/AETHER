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
| `npx tsx bin/aether.ts build "<prompt>" --out <dir>` | **Build a complete product** — one short prompt → a standalone, multi-page, full-stack app (Express+SQLite backend, one route per page, JWT auth, schema+seed, Docker, tests). See the "Build a real product" section below. | ~5 s |
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
| `npx tsx bin/aether.ts install --all --target codex --mcp --write .` | write clean Codex-native files (AGENTS.md, `.codex/agents/*.toml`, `.mcp.json`) | ~10 s |
| `npx tsx bin/aether.ts install --all --target claude-code --mcp --write .` | write clean Claude-Code-native files (`.claude/agents/*.md`, AGENTS.md, `.mcp.json`) | ~10 s |
| `npx tsx bin/aether.ts install --all --target all-harnesses --mcp --write .` | every harness target at once (claude/codex/cursor/opencode/kimi) | ~15 s |
| `npx tsx bin/aether.ts compare` | the full ECC/AETHER/raw-model head-to-head (needs a provider in `.env`) | ~2 min |

## Build a real product (not a prototype)

`aether build` is the flagship command. One short prompt produces a **standalone,
professional, multi-page, full-stack product** — the opposite of a single-page
modal app or a bare frontend:

```bash
npx tsx bin/aether.ts build "Build a coffee shop website with subscriptions" --out ./cofi-shop
cd ./cofi-shop
npm install && cp .env.example .env && npm run dev
npx tsx bin/aether.ts build "Build a coffee shop website with subscriptions" --out ./cofi-shop --verify   # also run its tests + build the UI
```

**Structure** (professional layout, enforced by verification — code is never scattered at the root):

```
frontend/   React (Vite) + React Router — one route per page, global CSS imported
backend/    Express + SQLite (better-sqlite3) — REST API, JWT auth, commerce service, payment provider layer (order domains)
deploy/     provider-ready configs: render/ aws/ digitalocean/ vercel/ netlify/ cloudflare-pages/
Dockerfile  single image: API + built frontend (SPA fallback) + .dockerignore
.github/workflows/ci.yml   the product ships its own CI (tests + frontend build)
```

What you get (driven by the industry domain pack, not a generic template):

- **Real frontend, one route per page** — e.g. a coffee shop yields
  `/`, `/menu`, `/cart`, `/checkout`, `/customer/subscriptions`,
  `/admin/dashboard`, `/admin/inventory`, `/staff/order-display`, …
  (React + React Router — Subscriptions is its own page, not a modal.)
  Cart/checkout are functional: localStorage cart with live catalog prices,
  checkout signs in and posts an idempotent, server-priced order.
- **Real backend** — Express + SQLite: a real schema, seed data, JWT auth
  (register/login/me), REST routes for every entity, auth-gated endpoints,
  and input validation. `npm test` exercises it over real HTTP.
- **Real business logic, not CRUD** — order domains get a generated
  commerce service: server-side pricing (never trusts client totals),
  integer minor-unit tax, coupon discounts, idempotent order creation,
  and an order state machine (illegal transitions → 409). The generated
  test suite proves all of it against a running app on an ephemeral port
  with an isolated test DB.
- **Payment provider layer (order domains)** — a generated
  `backend/src/services/payments.ts` gateway abstraction: a clearly-labelled
  `MockGateway` sandbox (demo default, `PAYMENT_PROVIDER=mock`, no real
  money ever), a dependency-free `StripeGateway` that fails fast with a
  clear "not configured" error when the key is missing, and an honest
  "not implemented" for providers this build does not ship (e.g. Razorpay).
  `POST /orders/:id/pay` charges idempotently; `POST
  /api/payments/webhook` confirms paid orders (idempotent replays). No
  fake credentials and no fabricated "paid" claims — the webhook matches
  the recorded `payment_ref`, not a provider signature (the documented
  honest limitation of the no-SDK build). Non-order domains get no
  payment plumbing at all.
- **Deployment + ops, real-world** — single-container mode (backend serves
  the built frontend) for AWS ECS Fargate / Render / DigitalOcean, or split
  providers: backend on Render/AWS/DO + frontend on Vercel/Netlify/Cloudflare
  Pages with `VITE_API_BASE`. Details in `deploy/README.md`. No secrets in
  the repo — `.env.example` stays placeholder-only.

**Independent verification (§13):** every build prints an 18-check report
(structure, CSS integrity, page routing, API surface, DB schema, seed, auth,
commerce layer, payment provider layer (order domains — gateway + webhook
mount + env docs), real tests, deployment, provider configs, manifest
consistency, docker hygiene, CI, template hygiene, frontend↔API
consistency). `--verify` additionally runs the generated test suite **and**
the frontend production build — a broken UI or undeclared dependency fails
the verdict, never a rubber stamp.

The domain is inferred from concrete keywords first (coffee → coffee-shop) so a
capability word like "subscriptions" doesn't hijack the industry. Verify any
generation: `npx tsx --test src/core/scaffolding/productScaffolder.test.ts`.

> **Why this exists:** earlier "build" runs emitted the AETHER harness itself
> with a single-page frontend and no backend. `build` now materializes a
> runnable product instead.

## Why no `npm install`?

The only things that ever *did* need installing were the interactive web workbench
(`vite`, `react`) and optional engines. None of them are on the path for:
- installing the harness,
- running any engine,
- running the comparison, or
- running the tests (`npx tsx --test src/core/aether.test.ts` — also zero-install).

If you *do* want the React workbench: `npm install --legacy-peer-deps && npm run dev`.
Everything else above works without it.
