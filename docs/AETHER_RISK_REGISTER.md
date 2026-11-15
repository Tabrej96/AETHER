# AETHER SUPREME EVOLUTION — Risk Register

**Created by Tabrej · Apache-2.0 · 2026-11-13**

Risks to the evolution program itself, each with the control already in place
or the one to add. The dominant rule: **no evolution step may silently weaken
a safeguard** (security policy, permission, financial logic, user data, host
config, autonomous action) — the directive's §11.D is codified here as an
executable check in the certifier.

| ID | Risk | Likelihood | Impact | Control / mitigation | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| R1 | **Preservation break** — an evolution phase removes or alters a working engine, regressing P01–P11 | MED | HIGH | Every phase composes an existing engine; the 20-suite release matrix + c8 ≥80% floor + GATE-12 re-certify after *each* phase; `aether validate` (component scorer) runs as a regression floor. | release pipeline |
| R2 | **Template-slop regression** — new design layers make output *more* generic, not less | MED | HIGH | P-S2 acceptance is a *measured delta*: a seeded generic dashboard must score below a category-appropriate one (not just "score exists"). The slop detector is itself seeded-tested. | P-S2 |
| R3 | **Catalog dedupe loses a capability** — collapsing the 21×5 skill clones or merging agent pairs silently drops behavior | MED | MED | P-S6 requires a **coverage diff**: before/after capability matrix must be set-identical except the collapsed rows; router top-3 precision is re-measured, not assumed. | P-S6 |
| R4 | **Evolution loop self-weakening** — the self-improvement engine "improves" a score by lowering a security/financial gate | LOW | CRITICAL | **Governance gate (codified):** policy changes touching security, permissions, financial logic, or autonomous action are *never* auto-promoted; they require an explicit approval token and are recorded in a decision record. The certifier rejects any diff that lowers an existing threshold without the token. | P-S5 |
| R5 | **Benchmark gaming** — optimizing to the regression suite rather than to real quality | MED | HIGH | The evolution regression suite is **diverse by construction** (small site, marketplace, SaaS, financial calc, multi-tenant authz, checkout, booking, unseen category) — a single-category cheat fails the cross-category mean. Scores are the *before/after delta*, not an absolute. | P-S5 |
| R6 | **Scope creep into one giant skill** — the anti-recommendation the directive names | HIGH (temptation) | MED | Architecture is fixed: P-S1..P-S5 are **runtime-policy engines** (deterministic, tested, composable), and the strategy output is a document (`PROJECT_STRATEGY.md`), never a prompt blob injected into every request. | P-S1 |
| R7 | **Non-determinism creep** — adding randomness/async breaks reproducibility that benchmarks and GATE-12 depend on | MED | HIGH | All new engines are pure-TS and deterministic; any "creativity" is produced from a **seeded, recorded** exploration (the seed + alternatives are the decision record), so a re-run is reproducible. Verified by the existing ×2 flake detection. | all phases |
| R8 | **Unmeasured live daemons stay unmeasured** — the 5 external harnesses (OpenHands etc.) keep reporting `UNMEASURED` | HIGH (expected) | LOW | Honest by design: each prints its own measure-command; installing a daemon flips it to MEASURED automatically. Not a release blocker. | GATE-08 |
| R9 | **Prompt-length effort floor not enforced** — a short prompt still gets shallow thinking | MED | HIGH | P-S1 core policy: effort floor = f(classified project type), *independent* of prompt length; a unit test asserts "one-line ask in a financial category" still produces the full strategy. This is the directive's §1 made checkable. | P-S1 |
| R10 | **Provenance/credit drift** — new open-source design skills (shadcn, Radix, icon sets, …) integrated without license/attribution | MED | MED | Phase 4's `OPEN_SOURCE_CREDITS.md` / `THIRD_PARTY_NOTICES.md` / `OPEN_SOURCE_INTEGRATIONS.md` + the existing license audit (GATE-12 checks every credit is `VERIFIED_PERMISSIVE`); copyleft → out-of-process only, same rule as P06/P07/P09. | P4 + GATE-12 |

**Standing rule (all risks):** a release ships only on `APPROVED_WITH_DISCLOSED_LIMITATIONS` or better — every risk above is either *controlled by an existing measured gate* or *assigned to the phase that must close it*, never waived.
