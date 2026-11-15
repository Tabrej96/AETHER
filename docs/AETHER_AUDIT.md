# AETHER SUPREME EVOLUTION — Phase 1 Intelligence Audit

**Created by Tabrej · Apache-2.0 · measured 2026-11-13**

> This is a *verified* audit, not a claimed one. Every finding below names the
> file it was read from and, where it asserts a capability, the test or execution
> path that proves it. Findings that are gaps are stated as gaps. Nothing here
> is inferred from documentation alone — the SUPREME EVOLUTION directive's rule
> *"Do not invent capabilities based on documentation. Verify that they
> actually work."*

## 0. What AETHER genuinely has today (verified, with proof)

| Capability | Where | Proof it works |
| :--- | :--- | :--- |
| Skill discovery (28-token lazy index, top-3) | `src/core/mcpServerEngine.ts` `aether_skill_router` | 13-test MCP protocol suite (`gate04-mcp`) |
| Blast radius / TCCI / adversarial gate / security scan | `src/core/mcpServerEngine.ts` (8 tools) | `gate04-mcp` + `gate06-security` |
| Continuity checkpoint (Merkle state hash) | `src/core/mcpServerEngine.ts` `aether_continuity_checkpoint` | `gate04-mcp` |
| Fixed-point money + jurisdiction-pluggable GST (P10) | `src/core/finance/{money,taxEngine}.ts` | 38-test `p10-deep-intelligence` suite; live Chrome recompute |
| Full-stack engineering analysis (P11) | `src/core/fullstack/*` + `src/core/programs/p11*` | 15-test `p11-fullstack` suite; `aether fullstack` |
| Design-gate scorecard (0–100, pass ≥80) | `src/core/design/designGate.ts` | `design-gate` suite; 90/100 on the real invoice page |
| Adversarial challenger suite | `src/core/adversarialEngine.ts` | `gate01-*` + component scorer (cycle 2 = 100) |
| Security boundary scanner (injection + secrets + entropy) | `src/core/securityEngine.ts` | `gate06-security` (15 tests) |
| Durable session journal + crash recovery | `src/core/runtime/durable-sessions*` | `gate02-durable-sessions` |
| Universal benchmark adapters (5 real formats) | `src/core/programs/*` universal | `gate08-universal-adapters` |
| Release certification pipeline (GATE 12) | `scripts/certify-release.ts` | `release-evidence/gate12-certification.txt` |

**Headline strength:** AETHER's *verification* and *measurement* machinery is
genuinely strong — it certifies rather than asserts, and it composes engines
rather than duplicating them (11 registry capabilities, all `EXECUTE`).

## 1. Duplicate / overlapping / redundant (the directive's finding #1, #2, #3)

- **F1 — 105 skills are 21 concepts × 5 phase-suffix clones.** In
  `scaleCatalog.ts`, the "Design & UI Craft" domain is 105/540 skills and
  **all 105 are `-architect-specification / -audit-compliance /
  -refactor-implementation / -optimize-runtime-performance /
  -verify-visual-regression-gate` variants of 21 base names** (e.g.
  `oklch-perceptual-color-palette-*`, `swiss-modular-12-column-asymmetry-*`).
  These are near-identical text differing only in the phase suffix.
  *Severity MED.* *Consequence:* inflates the skill index, dilutes router
  precision, and misrepresents "540 distinct skills" (21 are one idea five
  ways). *Fix:* collapse to 21 canonical skills whose spec carries all five
  phases as sections; keep the phase as an activation flag, not a separate
  row. Acceptance: 540 → ~455 distinct skills, router top-3 precision
  unchanged-or-better (measure).
- **F2 — 117 agents, 40 are near-duplicate infra specialists.** At least 5
  pairs repeat another agent's work: `linux-bare-metal-vps` vs
  `linux-seccomp-apparmor-rootless` (both "Linux hardening"); `caddy-nginx-haproxy-edge`
  vs `aws-cloudfront-lambda-edge` (both "edge routing"); `bazel-nx-remote-cache`
  vs `bazel-nx-hermetic-build` (same build graph); `database-deadlock-resolver`
  vs `database-concurrency-optimization`; `chaos-engineering-*` ×3 vs
  `failure-recovery-*` ×3. *Severity MED.* *Consequence:* agent-selection
  ambiguity + duplicated `tokenOverhead` billed into a swarm. *Fix:* merge
  overlapping pairs into one agent with sub-capabilities; record the merge
  decision. Acceptance: agent count drops, no capability lost (verified by a
  coverage diff against the capability matrix).
- **F3 — the polyglot core (332 skills) has real text overlap.** 30 polyglot
  skills share near-identical `executionSteps`; `security-authorization-audit`
  and `security-authorization-boundaries` differ only in a 3-item checklist;
  `api-contract-versioning` vs `api-contract-evolution` differ only in "add
  deprecation headers." *Severity LOW.* *Fix:* dedupe the checklist, keep one
  canonical skill, alias the other.

## 2. Weak planning / reasoning (finding #5, #6)

- **F4 — there is NO project-type planner.** The only classifier is
  `src/core/intel/requirements.ts::classifyRequirement`, a **keyword regex**
  (`COMPLEX_WORDS`, `MONEY_WORDS`, `DOMAIN_WORDS`) that yields
  `SIMPLE/DETAILED/COMPLEX/AMBIGUOUS` + a domain tag list. It cannot
  distinguish *SaaS* from *ERP* from *e-commerce* from *3D-configurator* —
  they all just become "COMPLEX" with whatever domain words matched.
  *Severity HIGH.* *Consequence:* AETHER applies one universal depth to every
  project, so a financial app does not get a stricter security posture than a
  portfolio site, and a 3D configurator does not get rendering-performance
  reasoning. *This is the load-bearing gap the whole SUPREME EVOLUTION
  directive is aimed at.* *Fix:* a **Project-Intelligence & Strategy Engine**
  (Phase 2) that classifies into ≥20 product categories with an explicit,
  *testable* strategy per category (architecture, security posture, UX
  patterns, data model, testing strategy) and emits a `PROJECT_STRATEGY.md`.
  Acceptance: given "build a SaaS billing tool" vs "build a 3D jewellery
  configurator," the two strategies differ measurably and each decision has a
  recorded reason.

## 3. Weak UI/UX / design taste (finding #7)

- **F5 — the design gate can audit, it cannot taste.** `designGate.ts` is a
  deterministic 0–100 scorecard (kills "beige card grid") but its pass/fail is
  mechanical: it does not encode *product-specific design languages*
  (enterprise-ERP density vs media-imagery vs dev-tool monospace) and does not
  reject the "generic AI-looking" anti-patterns the directive names (random
  purple gradients, every-section-in-a-card, fake data, empty buttons,
  placeholder illustrations) — those are *absence* checks, not present.
  *Severity HIGH.* *Fix:* add a **product-type-aware design strategy table**
  (Phase 3/5) so the audit knows what "good" looks like *for this category*,
  plus a template-slop detector. Acceptance: a deliberately-generic
  dashboard is scored *lower* than a category-appropriate one, and the gap is
  nameable from the scorecard.

## 4. Missing backend-architecture reasoning beyond P11 (finding #8)

- **F6 — P11 covers architecture/contract/data/reliability/tenancy but has
  NO real-time, file/media, or search/analytics subsystems.**
  `src/core/fullstack/` has no module for WebSocket/SSE patterns, object
  storage / signed URLs, or full-text-search + analytics workloads.
  *Severity MED.* *Consequence:* a booking app, a media platform, or an
  analytics dashboard has no P11 analysis. *Fix:* extend the full-stack
  suite with 3 more analyzers (real-time, storage, search/analytics), each
  deterministic + tested, composed not duplicated.
- **F7 — no CQRS / event-sourcing / sagas / outbox reasoning.** The
  architecture engine (§F4's fix) will need these as *named alternatives* it
  can justify/reject; today `architecture.ts` knows 6 top-level styles only.
  *Severity LOW–MED.*

## 5. Security & production readiness (finding #9, #10)

- **F8 — observability is not a subsystem.** There is no structured-logging /
  metrics / request-id / trace / alerting *analysis* — P11's
  `productionReadiness.ts` only *asserts* the caller claims they exist
  (`observability.structuredLogs: boolean`). It cannot verify.
  *Severity MED.* *Fix:* an observability contract analyzer that checks the
  claims against the code (does a request-id middleware exist? are secrets
  redacted in logs?).
- **F9 — approval boundaries are consistent but not a first-class registry.**
  `bin/aether.ts` install/uninstall and the P11 migration blocker
  (`ackDataLoss`) are the two approval points; they are not enumerated in one
  place a reviewer can audit. *Severity LOW.* *Fix:* a human-approval-boundary
  register (which operations are gated, why, and the un-gated set).

## 6. Context handoff between agents (finding #11)

- **F10 — handoff is free-text, not a structured contract.** `swarmEngine`
  passes results between agents; `continuityEngine` produces a compact resume
  brief but the *between-agent* handoff carries no typed fields
  (summary / files-touched / decisions / open-questions). *Severity MED.*
  *Consequence:* an agent that needs a predecessor's decisions re-derives
  them. *Fix:* a `HandoffRecord` type (typed, validated) as the swarm's
  handoff payload, reused by continuity. Acceptance: a 2-agent handoff
  preserves the decision set verbatim (test).

## 7. Token consumption (finding #12)

- **F11 — the catalog is heavy; lazy-loading is the only guard.** Σ skill
  `tokenCost` = **45,360**, Σ agent `tokenOverhead` = **10,764**, max single
  skill = **84** (so no single skill is heavy — the cost is *count*). The
  `aether_skill_router` 28-token index is what bounds a real task. *Severity
  MED* (the 21×5 duplication in F1 is the main bloat). *Fix:* dedupe (F1/F2)
  to cut the catalog; keep lazy-loading; record the before/after Σ as the
  measured acceptance.

## 8. Evaluation / QC and human boundaries (finding #13, #14)

- **F12 — QC is strong but *advisory*, not gating.** The component scorer and
  design gate produce scores; nothing *blocks* on them except the release
  pipeline's mandatory suites. A low component score does not stop a PR.
  *Severity LOW–MED.* *Fix:* wire the design-gate and component-score floors
  into a CI gate that blocks below threshold (the `design-gate` suite already
  enforces the floor on the reference showcase — extend it to user output).
- **F13 — self-improvement is the weakest engine.** `selfImprovementEngine.ts`
  is the least-developed of the core engines and has no *measured* regression
  suite of its own. The SUPREME EVOLUTION directive's §11 wants a
  **benchmarked evolution loop** (record failure → reproducible test →
  promote only on evidence → rollback-able). *Severity HIGH.* *Fix:* an
  Evolution Engine that version-controls skills/policies/decision-records and
  only promotes a change when a before/after measurement on a diverse task set
  improves — with explicit governance (security/financial/permission changes
  never auto-weakened).

## 9. Architectural bottlenecks to scale (finding #15)

- **F14 — everything is in-process and synchronous by design; that is a
  strength (deterministic, testable) but a ceiling.** The engines are pure
  TS with no async I/O, so a "planning" step that must call a model is not
  in-process. *Severity LOW.* *Note, not a fix:* this is intentional (AETHER
  is a *harness* that emits plans + measurements; the model does the work).
  Do not add async machinery that breaks determinism.

## 10. Strongest defects, prioritized (the roadmap is built on these)

| # | Finding | Severity | One-line remedy |
| :--- | :--- | :--- | :--- |
| 1 | F4 — no project-type planner | **HIGH** | Project-Intelligence & Strategy Engine (Phase 2) |
| 2 | F13 — unbenchmarked self-improvement | **HIGH** | Evolution Engine with measured promote/rollback (Phase 11 analogue) |
| 3 | F5 — design gate can't taste | **HIGH** | product-type design strategies + template-slop detector (Phase 3/5) |
| 4 | F1/F11 — 21×5 skill clones + catalog bloat | MED | dedupe to canonical skills, re-measure Σ |
| 5 | F6 — no real-time/storage/search analyzers | MED | 3 new full-stack subsystems, composed not duplicated |

**Preservation invariant (the directive's rule):** none of these fixes
remove a working capability — each *composes* an existing engine and records
its decision. F1/F2 dedupe *catalog rows*, never the underlying verified
engines.

## 11. Spot-verification log (claims I re-checked before trusting the audit agents)

| Agent claim | Verified? | How |
| :--- | :--- | :--- |
| Skill router uses 28-token lazy predicates, hydrating top-3 | **Yes** | `src/core/mcpServerEngine.ts:63` (tool description states it verbatim); 13-test MCP suite covers it |
| Swarm handoff is free-text, no typed contract | **Yes** | `swarmEngine.ts` has no handoff payload struct; the only handoff-adjacent mechanism is the TCCI bypass (token optimization), which *skips* the handoff entirely |
| Security approval boundary exists but is not a registry | **Yes** | `securityEngine.ts` gates `READ_ONLY_REVIEWER + WRITE_FILE/SHELL_EXEC` → `TRUST_BOUNDARY_VIOLATION`; the two CLI approval points (install/uninstall, P11 `ackDataLoss`) are not enumerated together anywhere |
| Design gate kills "beige card grid" but has no anti-template-slop list | **Yes** | `designGate.ts` has zero matches for gradient/rounded/fake/placeholder/generic — the scorecard is an *absence* scorecard, confirming F5 |
