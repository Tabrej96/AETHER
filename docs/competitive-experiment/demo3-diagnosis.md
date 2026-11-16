# Demo 3 forensic diagnosis — `cofi-shop` (coffee shop)

Artifact: `C:\Users\Asus\Downloads\demo 3` = full AETHER repo + the demo written
inside it at `cofi-shop/` (untracked, `git status` → `?? cofi-shop/`).
Domain: "Specialty Coffee Shop" Express + better-sqlite3 + React/Vite.
All paths below are relative to `demo 3\cofi-shop\` unless noted.

## Executive summary

- **The tool writes files and stops.** `bin/aether.ts` (build cmd, lines 621–657)
  generates files and prints "Next steps: npm install && npm run dev". It never
  installs, builds, typechecks, or smoke-tests the product. Nothing after
  "wrote N files" is ever verified — that is why every defect below shipped.
- **The CSS was never wired into the app.** `web/src/main.tsx` (all 11 lines)
  has no `import './styles.css'` — confirmed this is the *generated* template
  (committed `src/core/scaffolding/productScaffolder.ts` lines 1281–1300). The
  1,223-line design system at `web/src/styles.css` is dead code. That is the
  "CSS broke" report: the app never had CSS, it just looked like it.
- **Half the frontend is orphaned and points at a nonexistent API.** 10 of 22
  page files are not in `web/src/App.tsx` (no route, not rendered) and 4 of
  them `fetch` `/products` — a resource the generator's API plan never made
  (no table, no router mount in `server/src/app.ts`). Plus `web/src/routes.ts`
  is dead code referenced by nothing.
- **The generator emits its own unrendered template variables.** README line
  38–45 prints literal `${a.auth}` per line (tool bug: a plain string inside a
  template block in the scaffolder). API names in `web/src/lib/api.ts` are
  mangled (`Orderss`, `Subscriptionss`) and `web/package.json` pins a
  nonexistent major `lucide-react: ^1.73.0`.
- **Deployment artifacts are a facade.** Dockerfile builds `web/dist` but the
  runtime stage serves nothing — no static hosting, no proxy; `npm start -w
  server` only runs the API on :4000. No `.dockerignore` (the Docker build
  copies the 180MB `node_modules` into the image). No CI for generated
  products. No render.yaml/vercel.json.

## Folder layout (as found)

```
demo 3/
  .claude/ .codex/ .gemini/ .kimi/   ← AETHER multi-harness agent packs
  aether/ bin/ docs/ expansions/ fixtures/ mcp/ scripts/ install/
  src/ index.html vite.config.ts package.json   ← AETHER monorepo + demo website
  cofi-shop/                                  ← THE DEMO (untracked in git)
    package.json        workspaces: server, web; "dev": concurrently (…)  ← see D5
    .env.example Dockerfile docker-compose.yml README.md
    server/  src/{index,app,db}.ts routes/×10 services/commerce.ts
              middleware/auth.ts test/api.test.ts data/*.sqlite (×4, committed in!)
    web/     src/{main,App,routes}.tsx? pages/×22 components/×3
              context/CartContext.tsx lib/api.ts styles.css (1223 lines)
              index.html dist/ (built: index.html + 1 JS asset, NO css)
```

Counts: 22 page files, 17 routes in `App.tsx` (22 route entries incl. aliases
and `*`), 10 server routers, 13 DB tables, 8-test HTTP suite in
`server/test/api.test.ts` (good — real ephemeral-port integration tests, per
repo commit `ded262b`), 2 root-level docs trees.
`node_modules` present at `cofi-shop/node_modules` and a nested
`web/node_modules` (empty dir). `.git` present at repo root (5.1MB). No
`coverage/`. SQLite WAL/SHM files sit inside the tree.

## Evidence table

| # | Defect | File / line | Class |
|---|--------|-------------|-------|
| D1 | CSS file never imported — entire app unstyled | `web/src/main.tsx:1-11` (no import); generator template `src/core/scaffolding/productScaffolder.ts:1281-1300` (committed) omits it too | **a — tool** |
| D2 | 10 orphan page files, no routes, not rendered | `web/src/pages/` vs `web/src/App.tsx:23-45`: `AddressesPage, CategoryPagePage, MembershipPage, OrderConfirmationPage, ProductListingPage, ProfilePage, ReturnsPage, ReviewsPage, SearchPage, WishlistPage` absent | **a — tool** (generator makes more pages than it routes; no consistency check) |
| D3 | Orphan pages + README promise data from nonexistent `/products` | `web/src/pages/SearchPage.tsx:6` `RESOURCE = "/products"`; `CategoryPagePage.tsx:6`, `ProductListingPage.tsx`, `AddressesPage.tsx` (fetches `/orders` for *addresses* — wrong resource too); no `products` table in `server/src/db.ts:43-125`, no mount in `server/src/app.ts:26-35` | **a — tool** (frontend generated against an API plan it then never emits server-side) |
| D4 | `web/src/routes.ts` dead file, `publicPages` unused by anything | `web/src/routes.ts:1-37`; zero importers (grep across `web/src`) | **a — tool** (leftover scaffold artifact) |
| D5 | `npm run dev` cannot work: `concurrently` invoked but declared nowhere | root `package.json:7` `"dev": "concurrently …"`; absent from all three package.json + `package-lock.json` (grep: 0 hits) | **a — tool** (emits a script that depends on an undeclared binary) |
| D6 | Unrendered generator template vars in README | `README.md:38-45` — literal `(${a.auth})` on 8 lines; source bug at `src/core/scaffolding/productScaffolder.ts:319` (committed): backtick string used in a context where it's not a template literal | **a — tool** |
| D7 | Mangled generated API names | `web/src/lib/api.ts:23-31` `Orderss`, `Subscriptionss`, `Reviewss`, `Promotionss`, `Reportss`, `Inventorys` | **a — tool** |
| D8 | `web/package.json` pins `lucide-react: ^1.73.0` (a 2020-era "legacy" major, not the current 0.x line) — install happens to resolve, but the generator hard-codes a bogus-looking version | `web/package.json:10`; `node_modules/lucide-react` → 1.73.0 does exist and exports `ChefHat` (verified), so no runtime break | **a — tool** (version pinned from stale data; works today, will not survive) |
| D9 | Docker: builds web but never serves it; no .dockerignore so 180MB node_modules copied in | `Dockerfile:3-10` (runtime CMD `npm start -w server` only; no static serving of `web/dist`, no nginx/caddy stage); no `.dockerignore` | **a — tool** |
| D10 | No CI for generated products; no render.yaml / vercel.json / fly.toml | `cofi-shop/` has no `.github/`; only the *AETHER* root has `.github/workflows/ci.yml`, which tests AETHER itself | **a — tool** |
| D11 | AETHER source tree modified mid-run (agent edited the generator, not just the output): db.ts fallback rewrite + industry registry keyword changes, both **uncommitted** | `git diff` at repo root: `src/core/scaffolding/productScaffolder.ts` (+30: better-sqlite3→node:sqlite fallback in db.ts template), `src/core/marketParity/industryRegistry.ts` (+29: keyword entries, generic modifiers) | **b — agent misuse** |
| D12 | 10 generic stub pages were hand-replaced with bespoke React pages (MenuPage, AdminPage, StaffPage, CartPage…) while the other 10 generic stubs were left behind — a half-migration with no cleanup | `web/src/pages/MenuPage.tsx:125-142` (custom, FALLBACK_MENU, tabs) vs `SearchPage.tsx` (stock 30-line stub); two generations of code coexist | **b — agent** |
| D13 | Native module / dep state: better-sqlite3 11.10.0 installed at workspace root with prebuilds; `web/node_modules` is an empty dir | `cofi-shop/node_modules/better-sqlite3/package.json`; `web/node_modules/` (0 entries) | **c — environment** (works; but the empty nested dir and hoisted layout are fragile) |
| D14 | SQLite DB files (incl. live WAL/SHM and a `test.sqlite`) sitting in the tree that's about to be docker-built / committed | `server/data/cofi-shop.sqlite{,-wal,-shm}`, `server/data/test.sqlite` | **a — tool** (no `.gitignore` for `server/data/`, no `.dockerignore`) |

### Cross-cutting consistency checks (task item 3)

- **frontend ↔ backend:** dev proxy `/api → :4000` (`web/vite.config.ts`)
  matches `server/src/index.ts:44` PORT 4000. `/api/menu` (GET public) is the
  only endpoint reliably backed by schema + seed + tests. `/api/products` is
  fetched by 4 live-orphan pages and does **not exist** (no mount in
  `app.ts:26-35`; the untracked `server/src/routes/products.ts` the agent
  added is dead code — nothing imports it — and its `products` table doesn't
  exist either, so even wiring it up would 500).
- **README ↔ routes:** README lists `/customer/wishlist` (line 22) but
  `App.tsx` has no such route; `/homepage` is both `/` and a route. README
  omits the 10 orphan pages entirely (they can't be reached — correct in a
  way, but they exist on disk).
- **CSS ↔ components:** `styles.css` defines zero of the classes the stub
  pages use: `.page`, `.list`, `.subtitle`, `.muted`, `.error`, `.card` —
  grep over the 1,223 lines returns 0 matches. It *does* define the bespoke
  pages' classes (`btn`, `card`-ish, header, quiz modal). So even fixing D1
  would leave the 10 stub pages unstyled — the design system and the
  stub pages come from two different generator iterations.
- **tests ↔ server:** `server/test/api.test.ts` (8 tests) exercises only
  `app.ts`'s `createServer()` path (menu/orders/auth/promotions) and would
  still pass — the tests are consistent with the *server*, not with the
  frontend. The tool's only verification target is the half that works.

## What AETHER must do (mapped to the gaps above)

1. **Verification-before-done is the single biggest gap.** `aether build`
   (D1, D5, D6, D7, D8) writes files and stops. The CLI must, in-process,
   after writing: `npm install`, `tsc --noEmit` (web + server), `vite build`,
   and run the generated `api.test.ts`; refuse to print "done" on failure.
   A product that has never been built is not a product. (Repo commit
   `ded262b` proves the test suite can run in CI-ish fashion; the tool just
   doesn't run it at generation time.)
2. **Structural consistency lint (D2, D3, D4):** a post-generation pass that
   asserts: every `pages/*.tsx` is imported by `App.tsx`; every `RESOURCE`
   string in the frontend resolves to a router mount in `server/src/app.ts`
   *and* a table in `db.ts`; no generated file is unreferenced
   (`routes.ts`, `products.ts`). Exit non-zero otherwise.
3. **CSS integrity (D1):** the generator's `main.tsx` template must import the
   generated stylesheet; the build step must fail on zero-CSS-in-bundle
   (check dist for `.css` assets — today `web/dist` has exactly 1 JS asset,
   no CSS, and the tool can't see that because it never builds).
4. **No-undeclared-binary rule (D5):** any script in emitted `package.json`
   must reference only declared deps; lint the emitted manifest.
5. **Template hygiene (D6, D7):** all emitted content through a single
   rendering pass with a template-linter (catches bare `${...}` and the
   plural-namer bug); unit-test the emitter on each domain pack for
   literal-interpolation leakage.
6. **Deploy reality (D9, D10, D14):** Dockerfile needs a real web-serving
   stage (static server or the Express serving `web/dist`) and a
   `.dockerignore`; ship one provider config that actually deploys the pair
   (compose with a web service is acceptable but the web service must
   exist); generate a minimal CI for the product (install, build, test).
7. **Version data (D8):** pin generated deps from a curated, dated
   allowlist, not whatever registry snapshot the model last saw.

## Class tally

- **a — tool defects: 12** (D1–D10, D14). The generator is a
  fire-and-forget file writer with no verification, no cross-file
  consistency, and template bugs.
- **b — agent misuse: 2** (D11 uncommitted edits to the generator itself,
  D12 half-migrated pages + dead `products.ts`).
- **c — environment: 1** (D13; everything installed fine — nothing here is
  an install failure).

The demo's real weaknesses — unstyled UI, dangling pages, missing API,
undeployable Docker — are **100% tool defects**. The agent's mid-run edits
(D11/D12) made the tree messier but created none of the user-visible
symptoms.
