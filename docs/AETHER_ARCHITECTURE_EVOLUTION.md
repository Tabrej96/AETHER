# AETHER 1.0 — Architecture Evolution

**Created by Tabrej · License: Apache-2.0**

## 1. What exists before the nine programs

The AETHER core (v1.0 harness) already ships ten verified systems:

```
src/core/contextEngine.ts        — Source-to-AST graph parser + PageRank context slicing
src/core/swarmEngine.ts         — Dynamic swarm formation, TCCI, DAG, exclusive leases
src/core/predictiveEngine.ts    — Hop-2 blast-radius analysis
src/core/adversarialEngine.ts   — 6-challenger falsification gate
src/core/memoryEngine.ts        — 7-layer provenance memory + promotion gate
src/core/debugEngine.ts         — Scientific debugging protocol
src/core/modelRouter.ts        — Latency/cost/airgap-aware model routing
src/core/continuityEngine.ts    — Zero-loss Merkle checkpoints
src/core/securityEngine.ts     — Trust-boundary + license-compliance scanning
src/core/validator.ts          — Spec validators + reproducible benchmark math
src/core/autonomousRuntime.ts   — Full agent lifecycle, leases, approval gates, crash recovery
src/core/ecosystemAdapters.ts  — 15 license-audited ecosystem adapters
src/core/ecosystemRegistry.ts  — Dynamic agents, skill composition, SemVer resolution
```

**What the core lacked:** the *research programs' capabilities* — dev-workflow gates,
an isolated reverse-engineering subsystem, resumable execution, event-driven multi-agent
orchestration, a unified browser engine, a visual perception loop, a browser-provider
abstraction, a knowledge-vault graph, and a creative node/3D engine.

## 2. How the nine programs attach (additive, non-competitive)

All new code lives under `src/core/programs/`. The dependency rule is one-directional:

```
                    ┌──────────────────────────────────────────────┐
                    │  src/core/programs/  (NEW)                   │
                    │  types.ts · registry.ts · p01…p09.ts        │
                    └──────┬──────────────┬──────────────┬────────┘
                           │ composes     │ composes     │ composes
                           ▼              ▼              ▼
              Skill Engine · Memory Engine · Debug Engine · Model Router · Security Engine ·
              Continuity Engine · Swarm Engine · MCP Engine · Validation Engine  (EXISTING)
```

No new system competes with an existing one:

- **P01** does not create a second skill or workflow system — it adds a **gate layer**
  (research-first, TDD) and a **discovery ranker** over the existing 540-skill catalog and
  the existing memory promotion gate.
- **P02** does not modify the Security Engine — it **composes** it via a hard
  `assertAuthorization` pre-condition specific to reverse-engineering targets.
- **P03** does not replace `autonomousRuntime.ts` — it adds a **plan→checkpoint→resume**
  layer that can wrap the runtime's step executor.
- **P04** does not replace `swarmEngine.ts` — it adds an **event-bus + wave scheduler**
  that consumes swarm-formed teams and adds a durable append-only log.
- **P05/P06/P07** do not replace `ecosystemAdapters.ts`'s browser adapters — they add a
  **strategy-ranking** and **provider-selection** layer, and keep execution on the
  out-of-process browser boundary (Playwright / Lightpanda).
- **P08/P09** are net-new capability domains with no competing core engine.

## 3. Controlled capability lifecycle (the program brief's contract)

`registry.ts` + `types.ts` implement the full lifecycle for every external capability:

```
DISCOVER ──► INSTALL ──► VALIDATE ──► REGISTER ──► EXECUTE ──► MONITOR ──► UPDATE ──► REMOVE
                                                    │
                                                    └── only reachable with measured evidence
```

- **DISCOVER:** capability + provenance recorded (the 16-repo audit).
- **INSTALL:** deploy-time backend selection (a browser provider, an out-of-process engine) —
  recorded as `executionMethod` on the capability.
- **VALIDATE:** license + permission + SemVer check (`auditRegistry`, P02 authorization, P08 plugin audit).
- **REGISTER:** entered in `buildIntegrationRegistry()` with full provenance fields.
- **EXECUTE:** the program's integration test ran and the benchmark is `MEASURED_*`.
- **MONITOR/UPDATE/REMOVE:** `advanceLifecycle()` enforces forward-only movement and
  requires a measured run before `MONITOR` — you cannot monitor a capability that never executed.

## 4. The stable-contracts promise

Programs communicate only through `ProgramCapability` / `ProgramIntegrationResult`
in `types.ts`. Swapping a backend (e.g. Lightpanda→Playwright for P05/P06) changes one
`selectBrowserProvider` result; no program engine changes. This is what the integration
matrix (see `AETHER_CAPABILITY_INTEGRATION_MATRIX.md`) guarantees: **providers move,
capabilities stay.**
