# Competitive Experiment — Baseline Forensics (§16)

Non-flattering, evidence-only comparison of three coffee-shop platform baselines against the
current AETHER `build` output. Every claim below cites a file path, line number, or command
run in this session. No scores are assigned by feel.

## Methodology

All three baseline directories were read **read-only** from `C:\Users\Asus\Downloads\`:

- **A** — `demo` (package name `dewmo`): Vite + React, no framework
- **B** — `demo two by AETHER` (package name `aether-harness`): old AETHER harness monorepo
- **C** — `demo by ecc\cofi-shop`: ECC (Google Antigravity) product; the parent `demo by ecc`
  is the ECC framework install, `cofi-shop` is the actual generated product

Commands used:

- `find`/`ls`/`cat`/`grep -n` over each baseline's `src/` for order, persistence, routing,
  backend, and test patterns
- `npx vitest run` inside `C:\Users\Asus\Downloads\demo by ecc\cofi-shop` (actual run:
  **9 test files, 65 tests, all passed**, 6.19s, vitest v5.1.0)
- `git log --oneline` in `C:\Users\Asus\Desktop\DEMPO AETHER` for current AETHER-build evidence
- Grep over `src/core/scaffolding/productScaffolder.ts` (1659 lines) + `verifyScaffold.ts`
  (339 lines) + `productScaffolder.test.ts`

Deviations from prior notes, recorded as evidence:

- Prior analysis claimed C has 8 vitest test files; actual count is **9**
  (`src/test/{app,cartState,components,coverageBoost,flavorMatcher,modals,pricing,reservationValidator,sections}` `.test.{ts,tsx}` + `setup.ts`).
- Prior analysis pointed at `src/core/coffee.ts` in B; **that file does not exist**
  (`ls` fails). The grafted product lives in `src/components/cofi/*` and `src/core/intel/domainPacks/coffeeShop.ts` + `src/core/benchmarks/cofiGenerator.ts`.
- The "8 HTTP integration tests" figure for AETHER-build is confirmed: the generated
  `server/test/api.test.ts` contains 7 unconditional `it(` cases (health, seed, auth-reject,
  register, login, state machine, admin summary) + 2 conditional commerce cases (server-side
  pricing, coupon) = up to **9** for order domains (`productScaffolder.ts` lines 1012–1053,
  1103–1122).

## Baseline A — no framework (`demo`, "dewmo")

**Product completeness.** One SPA (`src/App.jsx`) with 15 section components
(`find src/components | wc -l` → 15): Hero, Menu, Cart, Checkout, Reservations, Reviews,
Roastery, Bean Quiz, Search, Order Tracker. Feature-surface is broad but everything is
client-side theater.

**Frontend.** React 19 + Tailwind 4, polished visual layer (confetti, audio
`src/utils/audio.js`, item customizer modal). No TypeScript, no routing, no state
library. Menu is a hardcoded array in `src/data/coffeeData.js` (first entry
`price: 3.85`, line 7).

**Checkout — simulated.** `src/components/CheckoutModal.jsx:40`
`const orderId = \`COFI-${Math.floor(1000 + Math.random() * 9000)}\`` followed by a
`setTimeout` (line 42) that advances the confirmation step. No order ever leaves the
browser. `OrderTrackerModal.jsx:15-17` fabricates progress with three `setTimeout`s
(3.5s / 8.5s / 14s) up to "Ready at Barista Counter".

**Persistence / backend / API.** `grep -rn "fetch(\|XMLHttpRequest\|localStorage" src/`
returns **zero matches** — not even localStorage. Orders exist only in React state for
the session; reload loses everything. No `server/`, no Express, no database.

**Pricing.** Client-side floating-point: `App.jsx:153` `const tax = subtotal * 0.085;`
(8.5% hardcoded, float math). No server re-pricing, so any client can pay anything.

**Auth / security.** None. No login, no secrets, no rate limiting.

**Testing.** Zero test files (`find` for `*.test.*|*.spec.*` outside node_modules → none).
`package.json` has no `test` script.

**Deployment / docs.** README is the stock Vite template ("This template provides a
minimal setup to get React working with Vite..."). No Dockerfile, no `.env`.
A `dist/` build folder is committed to disk, so it *can* be static-deployed — that's the
extent of its deployment story.

## Baseline B — old AETHER harness (`demo two by AETHER`, "aether-harness")

**What it actually is.** `package.json` self-describes: *"AETHER v1.0: The 100x Sovereign
Open-Source AI Engineering Harness (117 Agents, 540 Skills, 54 Workflows, 8-Tool MCP
Server)".* The coffee shop is **grafted into the harness monorepo** as one app-mode:
`src/App.tsx:20` `const [appMode, setAppMode] = useState<'cofi' | 'aether'>('cofi')` —
toggle between the coffee UI and the harness's own "Intelligence Lab" dashboard.

**Frontend.** 7 cofi components (`CofiShopView`, `CofiCartDrawer`, `CofiProductModal`,
`CofiBrewLab`, `CofiSubscriptionBuilder`, `BaristaOperationsTerminal`, `AetherProofModal`)
+ `cofiData.ts` (500+ lines of hardcoded menu/reviews/orders). Notably,
`cofiData.ts:430,462,486` seeds fake "live" orders `COFI-1090/1091/1092` to make the
operations terminal look busy. **No `react-router` dependency at all** (grep on
package.json → 0), so it is a single-page view-swapped app, confirmed as prior analysis
suggested (though the mechanism is state-swapping, not modals — `CofiShopView.tsx` has
its own tab nav).

**Checkout — simulated.** `CofiCartDrawer.tsx:89-98`:
`const orderNumber = Math.floor(1000 + Math.random() * 9000)` → `id: \`COFI-${orderNumber}\``,
plus a fabricated "Merkle verification hash for order provenance (AETHER runtime
guarantee)" computed from `Math.random().toString(16)` (lines ~91-92). This is the
strongest evidence against B: a random hex string labeled as cryptographic provenance.
No fetch calls anywhere in the cofi tree (`grep -rn "fetch(" src/components/cofi` → 0).

**Backend / DB.** None in the product. `aether-harness` is a Node tool (MCP server,
agent runner) — it has no REST API, no database, no persistence for the coffee shop.
Everything is React state + `cofiData.ts` constants.

**Pricing.** Client-side: `CofiCartDrawer.tsx:59-68`
`subtotal = items.reduce(...)`, `total = Math.max(0, subtotal - discount + effectiveTip)`
— float math, no tax at all, vouchers hardcoded (`COFI10`, and a hint string telling the
user to "Try 'AETHER' for 15% off", lines 80-86).

**Testing.** Its 2 test files (`src/core/aether.test.ts`, `continuityEngine.test.ts`,
~55 `test()`s total) test the **harness itself**, not the coffee product. The cofi shop
has zero tests.

**Deployment / docs.** Extensive harness docs (QUICKSTART, ROADMAP, SECURITY, AGENTS.md)
— none of which document the coffee product as a deployable app. No Dockerfile in the
cofi context.

## Baseline C — ECC Antigravity (`demo by ecc\cofi-shop`)

**Product completeness.** The strongest baseline. 12 section components + a real
context layer (`src/context/CartContext.tsx`, `useCart.ts`), typed utilities
(`pricing.ts`, `reservationValidator.ts`, `flavorMatcher.ts`, `cartState.ts`), Unsplash
product photography (`menuData.ts:14` etc.), and a polished Tailwind UI. It shares
A's DNA (same component names — C appears to have iterated the same brief; e.g.
`CheckoutModal.tsx` vs A's `CheckoutModal.jsx`).

**Backend / DB / API.** **None** — verified: `find . -maxdepth 1 -type d` shows only
`coverage dist node_modules public src`; grep for `express|sqlite|fastify|pg|prisma|
mongoose` in `src/` matches only the test files' string literals. No server dir.
`CartContext.tsx:26,41` persists the cart to **localStorage** — the only persistence in
any baseline.

**Checkout — simulated (honest).** `CheckoutModal.tsx:42-43`:
`setTimeout(() => { const generatedOrderNum = \`COFI-${Math.floor(1000 +
Math.random() * 9000)}\`; ...` and line 50 a second `setTimeout` advancing order steps.
No order is ever created on a server. Same simulation class as A, but wrapped in
typed, tested utilities.

**Business logic realism.** Better than A/B: `pricing.ts` centralizes item pricing with
documented modifiers (size −0.50/+0.80, alt-milk +0.75, extra shots +1.00, syrup +0.60,
line 24-54 `calculateItemPrice`), a `VALID_PROMOS` table with percent/fixed/freeship
types and a `WELCOME5` min-subtotal rule, and `Math.round(price * 100) / 100` cent
normalization — but all **client-side floats**, so it's realistic in *structure*, not
*enforcement*. `reservationValidator.ts` does genuine field validation (email regex,
phone digit count, line 10-27). `flavorMatcher.ts` implements a scored
roast/notes recommendation algorithm.

**Auth / security.** None. No accounts, no rate limiting.

**Testing — the standout.** `npx vitest run`: **9 files, 65 tests, all passing.**
Coverage across: `pricing.test.ts` (item pricing + promos), `reservationValidator.test.ts`,
`flavorMatcher.test.ts`, `cartState.test.ts`, plus component-level
(`components.test.tsx`, `modals.test.tsx`, `sections.test.tsx`, `app.test.tsx`) and
`coverageBoost.test.tsx` (a file that exists to lift the coverage number — worth noting
critically). A `coverage/` report (v8, readex pro) is committed to the repo. This is
more static test coverage than A (0), B (0 for the product), or AETHER-build (integration
only, see Gaps).

**Deployment / docs.** README is a real feature doc (85%+ coverage claim, TDD notes),
but no Dockerfile, no `.env`, no CI file in `cofi-shop/`. Static-deployable only.

## AETHER build (current) — repo evidence

From `C:\Users\Asus\Desktop\DEMPO AETHER` `git log`:

- `3e5189a` "add `aether build` — standalone multi-page full-stack product materializer"
- `ded262b` "add commerce service + real integration tests to generated products"
- `6a49f90` "add `aether build` independent verification engine (§13 definition of done)"
- `b413ab7`, `bb15258`, `b827b41` (website/docs work), `8833baf` (submodule/CLI fixes)

`src/core/scaffolding/productScaffolder.ts` (1659 lines) generates, for the coffee_shop
domain:

- **Real backend**: `server/` with Express `^4.19.2` + `better-sqlite3` `^11.3.0`
  (deps block, lines 378-388), JWT auth via `jsonwebtoken` (`line 511` `jwt.sign`
  24h, `line 520` verify + role claims), `express-rate-limit` (line 476: 300 req/min),
  SQLite schema + idempotent seed (`lines 629` "populated users table must not
  suppress"), per-domain REST routes (`line 686+`).
- **Commerce service** (`line 837+`): server-side pricing with tax "in integer minor
  units" (TAX rate in **basis points**, line 307 `TAX_RATE_BP`), coupon application,
  `createOrder` idempotent on `Idempotency-Key` (lines 907-914, DDL
  `idempotency_key TEXT UNIQUE` line 598), and an explicit order **state machine**
  (line 918: "only legal transitions, nothing else").
- **Per-domain pages**: React + React Router, "One route per page group"
  (`lines 331`, `generateWeb` 1166+, router 1352+; Subscriptions is its own route —
  asserted by test line 53).
- **Real HTTP integration test suite**: generated `server/test/api.test.ts`
  (`node:test`, `before` boots the app; 7-9 `it(` cases covering health, seed,
  unauthenticated-reject, register/login, state machine, server-side pricing, coupon,
  admin RBAC summary — lines 1012-1122).
- **Independent verification**: `verifyScaffold.ts` (339 lines) + `aether build
  --verify` — the generated product is checked by an engine separate from the one that
  made it (commit `6a49f90`, §13 definition of done).

## Comparison table

Capability rows measured from the files above; "— (not applicable / absent)" means
verified absent, not unknown.

| Capability | A (dewmo) | B (old harness) | C (ECC cofi-shop) | AETHER build (current) |
|---|---|---|---|---|
| Real backend (Express/SQLite) | none | none | none | **yes** — `server/` Express + better-sqlite3 (`productScaffolder.ts:378-388`) |
| Persistence | none (not even localStorage) | none | localStorage cart only (`CartContext.tsx:26,41`) | SQLite schema + idempotent seed (`:629`) |
| Auth | none | none | none | JWT register/login, role claims, RBAC (`:502-520`, admin route test `:1053`) |
| Server-side pricing | no (client float `App.jsx:153`) | no (client float, no tax) | no (client `pricing.ts`, well-structured) | **yes** — integer minor units, tax in basis points (`:307`, `:837`) |
| Idempotency | no | no | no | `Idempotency-Key`, replay returns original (`:598`, `:907-914`) |
| Order state machine | no (setTimeout theater) | no | no | **yes** — DDL constraint + transition rules (`:587`, `:918`) |
| Real routing (multi-page) | no | no (view-swap, 0 react-router deps) | no (SPA sections) | **yes** — React Router, one route per page group (`:331`, `:1352`) |
| HTTP integration tests | 0 | 0 (55 tests are harness-internal) | 0 | **7-9** generated `node:test` cases against live server (`:1103-1122`) |
| Unit/static tests | 0 | 0 (product) | **65** (`vitest run`: 9 files, all pass) + committed `coverage/` | 0 component-level (gap, below) |
| Simulated checkout | yes (`CheckoutModal.jsx:40`) | yes + fake "Merkle hash" (`CofiCartDrawer.tsx:89-92`) | yes (`CheckoutModal.tsx:42-50`) | **no** — checkout hits the real order API |
| Visual polish | high | high | **highest** (Unsplash photos, Tailwind design language) | functional, utilitarian (open gap) |
| Design system | ad-hoc Tailwind | ad-hoc Tailwind | ad-hoc Tailwind, most consistent | ad-hoc Tailwind (gap) |
| Deployment artifacts | committed `dist/` only | `dist/` for harness bins | none | **yes** — Docker/env/README emitted (`test :101`, commit `3e5189a`) |
| Docs | stock Vite README | rich harness docs, product undocumented | real feature README | generated README + commerce env docs (`:172`) |

## Gaps where baselines beat AETHER-build — root causes

1. **Visual polish / design depth: C wins.** C's Unsplash photography, consistent
   warm-palette Tailwind system, and 12 well-crafted sections read as a designed brand;
   AETHER-generated pages are "functional but utilitarian". Root cause:
   `productScaffolder.ts` treats pages as **data projections of the domain pack**
   (entity lists, forms, dashboards) — `generateWeb` (line 1166+) emits routes and
   layouts but has no design-system layer (no image sourcing, no brand tokens, no
   component gallery). The architecture is data-driven by construction, so polish has
   to be engineered in, and it isn't yet.

2. **Unit-test depth: C wins 65 vs 0 component-level.** The generated suite is
   **7-9 HTTP integration tests** (`server/test/api.test.ts`, `productScaffolder.ts:
   1103-1122`) and `productScaffolder.test.ts` (17 `it()`s) tests the *scaffolder*,
   not the generated UI. C emits component-level vitest + jsdom tests for its
   `pricing.ts`/`reservationValidator.ts`/modals. Root cause: `productScaffolder`
   generates **no `web/src/**/*.test.tsx` files at all** — the generator has no
   unit-test emission stage; it ships one integration suite as its test guarantee.
   Note C's `coverageBoost.test.tsx` shows even 65 has an inflated component — AETHER
   should not chase raw count, but *emitting* typed-unit tests for generated pricing/
   validator logic is a real gap.

3. **Component richness: C's `flavorMatcher`-style domain logic has no counterpart.**
   C's quiz/recommendation engine (`flavorMatcher.ts`) is bespoke business logic the
   brief didn't require; AETHER generates the brief's required flows but adds no
   delight-feature layer. Root cause: scaffolder scope is bounded to the domain pack's
   entities/pages (`DomainPack.pages → PagePlan`, `productScaffolder.ts:44`); there is
   no "engagement feature" slot in the generation model.

4. **In-flight (do not read as permanent):** the frontend page→resource cross-wiring
   gap in `productScaffolder` is being fixed in the current workstream — generated
   pages don't yet fully consume every API resource they should; `productScaffolder.
   test.ts` asserts the wiring that's being closed.

**What AETHER-build clearly beats all three on:** a real backend, persistence, auth,
server-side pricing, idempotency, a state machine, integration tests, deployment
artifacts, and an independent verification engine (`verifyScaffold.ts`, commit
`6a49f90`). No baseline has any of these. A's and B's checkouts (and even C's) are
`setTimeout` + `Math.random()` simulations; B's fake "Merkle provenance hash" is the
single most damning artifact in the whole experiment.
