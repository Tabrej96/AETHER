# AETHER SUPREME EVOLUTION — Phase 1 Baseline Benchmark

**Created by Tabrej · Apache-2.0 · measured 2026-11-13 (this revision), every number below re-run from a clean checkout — no cell is carried over by faith.**

This is the *before* column of the SUPREME EVOLUTION program. Every entry is a
measurement from the repository's own instrumentation, run in this session:

| Baseline | Measured value | How it was measured | Evidence |
| :--- | :--- | :--- | :--- |
| Reproducible benchmark, TASK-REAL-01 | Pass=true · **710 tokens** · 1.52 ms | `aether benchmark` (liveBenchmarkRunner, real local harness) | `release-evidence/benchmark-raw-logs/` (bundle evid-aether2-mwf*) |
| Reproducible benchmark, TASK-REAL-02 | Pass=true · **586 tokens** · 0.45 ms | same | same |
| Reproducible benchmark, TASK-REAL-03 | Pass=true · **522 tokens** · 0.45 ms | same | same |
| AETHER vs ECC (static markdown harness) | ECC **fails** all 3 tasks at 15,270–19,312 tokens/task; AETHER passes all 3 at 522–710 | `aether benchmark` comparative arm | same |
| AETHER vs Superpowers (brainstorm→plan→TDD) | passes 2/3 at 2,464–2,677 tokens; TASK-REAL-02 fails | same | same |
| Playwright arm | Pass=true · 784 tokens | same | same |
| Agent-Browser arm (a11y `[ref]`) | Pass=true · 414 tokens | same | same |
| External daemons (OpenHands/OpenManus/AutoGen/Browser-Use/Skyvern) | **UNMEASURED — honest** (each prints its own `docker`/`python3`/`uv`/`curl` measure-command) | `aether benchmark` | same |
| Component quality scorer | cycle-1 mean **99.5** → cycle-2 **100.0**, 765 refinements applied, 100% pass over **711 components** (117 agents + 540 skills + 54 workflows) | `runComponentAuditAndRefinementLoop` (liveBenchmarkRunner) | `aether validate` |
| Design-gate scorecard on a *real* artifact | **90/100, pass** (invoice page rendered by the P10 demo) | `auditDesignHtml` (src/core/design/designGate.ts), deterministic 0–100 criteria | `release-evidence/deep-demo/invoice.html` |
| Universal benchmark adapters | **5/5 MEASURED** against fixture traces (playwright-json, openhands-events, browser-use-result, autogen-conversation, openmanus-log) | `aether universal` | `release-evidence/gate08-benchmarks.json` |
| P10 deep execution (exact money) | inter-state GST invoice exact to the paise; client-total tamper guard fires; live Chrome recompute matches the engine | `aether deep` (42 tests) | `release-evidence/deep-demo/` |
| P11 full-stack engineering | architecture decision + drift, 5 contract mismatches, 7 reliability defects, 1 tenancy leak, exact 578,200p invoice with guard firing — all deterministic | `aether fullstack` (15 tests) | `src/core/programs/p11.test.ts` |
| Release test matrix | **20 suites** (19 mandatory × 2 flake runs + 1 disclosed non-mandatory live-network suite), c8 branch-coverage floor ≥80% MET on critical modules | `scripts/run-release-suites.ts` | `release-evidence/test-report.md` |
| GATE 12 certification | APPROVED_WITH_DISCLOSED_LIMITATIONS: tsc 0 errors · suites · SBOM 348 components · 0 secret findings across tracked files · 10/10 credits license-compliant · 6/6 disclosures present · 12/12 prior-gate evidence files | `scripts/certify-release.ts` | `release-evidence/gate12-certification.txt` |
| Catalog token economics | Σ skill `tokenCost` = **45,360** tokens (540 skills, ≈84 avg) · Σ agent `tokenOverhead` = **10,764** (117 agents, ≈92 avg) | computed from `scaleCatalog.ts` exports | this document |

## What the baseline does NOT measure (stated, not hidden)

- **Wall-clock latency of the model-driven path** is measured only for the
  local deterministic harness; live-model turns are reported `UNAVAILABLE` when
  no key is configured, and the one flaky live-network suite is a *disclosed
  state*, never a blocker (gate rule since the P10 release).
- **The 5 external daemons are UNMEASURED by design**: AETHER prints each
  project's own measure-command rather than fabricating a score. Installing a
  daemon makes the arm MEASURED; until then it is `Score=null`.
- **The catalog token sums above are catalog-wide, not per-task**: the runtime
  delivers skills lazily (28-token index via the `aether_skill_router` MCP
  tool; full specs on demand), so a real task loads a fraction of 45,360.
  The SUPREME EVOLUTION audit (P1) investigates the duplication that inflates
  that catalog (105 of 540 skills are 21 base concepts × 5 phase-suffix
  variants).

## Why these are the numbers the evolution builds on

Every SUPREME EVOLUTION phase improvement must be re-verified against a row in
this table. A phase is *integrated* only when the re-measured value is recorded
here (or in `AETHER_COMPETITIVE_BENCHMARKS.md`) and the release matrix still
certifies — the same rule that governed P01–P11.
