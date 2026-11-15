# AETHER 1.0 — FULL-STACK ENGINEERING DIRECTIVE (Program P11)

> Created by Tabrej · Apache-2.0
>
> P11 is the eleventh capability program. Like P10 it is **not** a study of an
> external repository — it is an **operator directive**: AETHER must engineer a
> system as **one coherent product**, not as isolated frontend / backend /
> database / infrastructure / security tasks. P10 fixed *what a task owes*
> (depth, exactness, evidence); P11 fixes *how a system holds together*:
> architecture chosen from requirements, contracts that agree across the
> front/back boundary, data that stays consistent under concurrency,
> failures that are recovered, tenants that cannot see each other's data, and
> a release gate that refuses to call a system "production-ready" on faith.

## What the directive requires (verbatim intent)

- **§1 Architecture from requirements, not fashion.** "It must not
  automatically choose microservices because they sound advanced. Select
  architecture based on actual requirements, operational complexity and
  expected scale." P11 encodes that as a deterministic selection with the
  anti-microservices guardrail explicit, and *drift detection* between the
  documented architecture and what the implementation actually is.
- **§2 Contracts that agree.** Frontend and backend must agree on field
  names, types, required fields, nullability, validation rules, error
  envelopes, pagination, and authentication. P11's contract checker reports
  every mismatch with both sides named — before it becomes a runtime bug.
- **§3 Data as a critical responsibility.** Money columns are exact types,
  concurrently-mutated records carry a locking strategy, migrations are
  reviewed and a destructive one is **blocked** without an explicit
  data-loss acknowledgment. "Never casually drop or overwrite production
  data."
- **§5 Financial exactness.** When money is in scope, P11 reuses P10's
  fixed-point paise + GST engine — it does not build a second one.
- **§6 Tenancy is a security boundary, not a UI feature.** An unscoped
  write on a shared model is a reported cross-tenant leak; a cross-tenant
  reference (IDOR) requires the ref-resolution guard.
- **§8 No assumptions about external services.** Unbounded retry,
  backoff without jitter, auto-retry on a non-idempotent call, a missing
  circuit breaker or dead-letter path are all named defects — "avoid
  unlimited retries and retry storms."
- **§11/§16/§17 Readiness is evidence, not a checklist.** A claimed test
  layer with no suite that ran is a blocker; "a security checklist exists"
  is not a security pass. P11 applies P10's met-implies-evidence rule to
  production readiness.

## Where it lives

| Subsystem | File | Role |
|---|---|---|
| Architecture decision | `src/core/fullstack/architecture.ts` | requirements profile → `MONOLITH / MODULAR_MONOLITH / MICROSERVICES / EVENT_DRIVEN / SERVERLESS / HYBRID` with every alternative carrying a verdict + reason, the §1 guardrail, diagram deliverables, accepted operational costs, and an escape hatch; `detectArchitectureDrift` flags doc-vs-implementation mismatch |
| API contract | `src/core/fullstack/apiContract.ts` | two-sided diff of a backend `ContractSpec` vs a client `ClientUsage`: renamed/missing fields, type + nullability drift, dropped validation rules, error-envelope + pagination + auth mismatch, each with a severity |
| Data model | `src/core/fullstack/dataModel.ts` | schema review (missing PK, unindexed FK, N+1 risk, binary-float money, unsafe concurrent write) + `planMigration` that blocks destructive DDL without acknowledgment and stages snapshot/restore when given one |
| Reliability | `src/core/fullstack/reliability.ts` | policy audit: unbounded retry, retry-on-non-idempotent, missing idempotency key, backoff without jitter, no total budget, external-without-breaker, no timeouts, no dead-letter, duplicate-request handling |
| Tenancy | `src/core/fullstack/tenancy.ts` | tenant isolation enforced as predicates (tenant scoping, ownership, admin audit, membership, IDOR ref resolution); composes the **Security Engine** for the threat snippet |
| Readiness gate | `src/core/fullstack/productionReadiness.ts` | owed test layers (proportional to the system) each need passing evidence; observability gaps, deploy-safety gaps, and open security criticals are blockers — P10's met-implies-evidence applied to production |
| P11 orchestrator | `src/core/programs/p11FullstackEngineeringIntelligence.ts` | one entry point → `FullstackPlan`; reuses P10 `intel` (requirement depth, skill composition, completion gate, decision records) and P10 `finance` (exact paise + tamper guard); `aether_fullstack` MCP tool |
| CLI | `bin/aether.ts` | `npx tsx bin/aether.ts fullstack` — the live demo: a multi-tenant billing platform plan with a drifted architecture, a mismatched contract, reliability defects, a tenancy leak, and an exact inter-state GST invoice |

## Measured evidence (no cell is fabricated)

- **§1 guardrail:** utility (1 dev, 1 domain) → `MONOLITH`; enterprise (5
  domains, team of 12, 99.99%, auto-scale) → `MICROSERVICES`; 4 domains but
  team of 2 with low maintenance tolerance → demoted to `MODULAR_MONOLITH`.
  Doc says monolith but 6 deployables exist → drift reported.
- **§2:** a `total_paise`→`total` rename + `integer`→`number` widening +
  `bearer`→`session` auth + `cursor`→`offset` pagination all surface as
  named mismatches; the required-field drop is a BLOCKER.
- **§3:** `real`-typed money + concurrent mutation with no locking strategy
  → two BLOCKER findings; the same schema with `numeric` + `ATOMIC_UPDATE`
  + FK index is clean. A `DROP COLUMN` migration without acknowledgment is
  blocked; with it, it is staged (snapshot → destructive → restore).
- **§5:** the demo's inter-state invoice (₹4,900.00 @ 18% IGST) computes to
  **578200 paise exactly**; a client-asserted total of 10000p is rejected
  with delta −568200p.
- **§8:** `maxAttempts: 100000, bounded: false` is named as the unbounded
  retry that becomes a retry storm; a well-formed policy (bounded, jittered,
  breaker, timeouts, dead-letter) audits healthy.
- **§6:** an unscoped WRITE on `SHARED_SCOPED` is a cross-tenant write leak;
  a fully-scoped READ is clean; a cross-tenant reference always requires the
  IDOR ref-resolution guard.
- **§17:** a system that claims END_TO_END/SECURITY layers with no suite
  that ran is `NOT_READY` with those layers named — and "controls claimed
  but no scan ran" is a security blocker on its own.

## Honest limits (disclosed, not hidden)

- P11's subsystems are **deterministic analyzers and policy checkers**: they
  model the system (a requirements profile, a contract pair, a schema, a
  policy, an access) and report machine-checkable findings. They do not
  connect to a live database, run a live load test, or execute the
  deployment — those are the *measured-evidence inputs* a real build feeds
  in, and the readiness gate only reports `READY` when that evidence is
  present. A claimed layer with no run is a blocker by design.
- The architecture selector is rule-based over the profile fields; it is
  deliberately conservative (fewer moving parts win ties) and every decision
  is rendered as an auditable decision record so a human can override it with
  a reason — the directive's "never force a pattern" holds.
- Migration safety inspects **generated DDL text**; it flags
  DROP/TRUNCATE/DELETE classes and requires acknowledgment, it does not
  execute or preview against a live database.
