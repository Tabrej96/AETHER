# AETHER 1.0 — Integration Tests

**Created by Tabrej · License: Apache-2.0**

A capability is integrated **only** when: it is reachable through an AETHER interface,
it executes real deterministic work, it handles failure safely, and it passes its
integration test. This document records the test suite that proves exactly that.

## 1. Test suite location & how to run

```bash
# The nine-program integration suite (10 tests)
npx tsx --test src/core/programs/programs.test.ts

# The existing core suite (8 tests) — proves nothing regressed
npx tsx --test src/core/aether.test.ts

# The live registry + lifecycle CLI (the AETHER interface the capabilities are exposed through)
npx tsx bin/aether.ts programs
```

**Last verified result (this release):** `18 / 18 tests pass` (10 program tests + 8 core tests),
`0 failures, 0 cancelled, 0 skipped`, and `tsc --noEmit` reports **zero type errors** across
the whole project including all nine new engines.

## 2. The 10 program integration tests (`src/core/programs/programs.test.ts`)

| # | Test | What it proves (and the failure mode it guards) |
| :---: | :--- | :--- |
| 1 | P01 gates + deterministic discovery | A research-missing task is **blocked** (not planned blind); skill `b` (2 trigger hits) deterministically outranks `a` (1 hit) — no LLM randomness. |
| 2 | P02 authorization gate | An **unauthorized** target throws `authorization DENIED` *before* any analysis; an authorized 2-module app reconstructs `externalDependencies = [express]` and declares ≥3 UNMEASURED live slots. |
| 3 | P03 crash-resume | Run 1 completes **1 of 3** steps and skips dependent `c` when `b` fails; resume **replays only the failed step** and reaches `verified: true`. Guards the "completed steps get re-run" and "failed steps stay stuck" regressions. |
| 4 | P04 parallel waves + fail-fast | Two independent tasks run in one wave; a task needing a **missing capability** fails fast with named evidence instead of spinning (the unbounded-loop bug this design prevents). |
| 5 | P05 a11y snapshot + escalation | Compact snapshot is **strictly cheaper** than raw DOM; a deterministic locator hit ≥0.9 confidence; an unresolvable vision query returns `element: null` + escalation note (never a fabricated hit). |
| 6 | P06 verify loop | A grounded intent yields a verified, state-changing action; an ungrounded intent (below confidence floor) **aborts** rather than guessing coordinates. |
| 7 | P07 honest provider selection | Cross-browser tasks pick Playwright; a WebGL task that **no provider supports** returns `compatible: false, verificationRequired: true` — the drop-in assumption is rejected. |
| 8 | P08 knowledge graph | A zero-link note is detected as an **orphan**; workspace planning routes every file under the project root. |
| 9 | P09 node/3D engines | A 4-node generation graph schedules into **4 topological layers**; a cyclic graph **throws**; a 3-object 3D scene renders in deterministic order with a 2-draw-call estimate. |
| 10 | Registry + lifecycle | Exactly **9** capabilities, all with full provenance (`auditRegistry` PASS), credited to Tabrej; `MONITOR` is forward-only **and** blocked without a measured run. |

## 3. Cross-engine regression guard

The existing `src/core/aether.test.ts` (8 tests) is unchanged and still passes, which
proves the additive architecture promise: the nine programs **did not** disturb the
117-agent / 540-skill / 54-workflow catalog, the 15-ecosystem adapters, the autonomous
runtime, or the genuine benchmark engine.

## 4. Failure-safety evidence

Every UNMEASURED capability in the registry carries a concrete `externalCommandToMeasure`
(e.g. "start a Playwright browser and point P05 at it"). The test suite asserts that
`advanceLifecycle` **rejects** moving a capability to `MONITOR` without measured evidence —
failure handling is itself tested, not assumed.
