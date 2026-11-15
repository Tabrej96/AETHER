# AETHER SUPREME EVOLUTION — Roadmap

**Created by Tabrej · Apache-2.0 · 2026-11-13**

The roadmap is derived *from the audit* (`AETHER_AUDIT.md`), not from the
directive's feature list. Each phase maps to the finding it closes and carries
a **measurable acceptance criterion** — a phase is *done* only when that
criterion is re-measured and the release matrix still certifies (the P01–P11
rule: integrated = reachable + executes real work + safe failure + passing
tests).

**Ordering principle:** the directive's load-bearing gap is *project-type
planning* (F4). Everything else composes onto it. So we build the
Project-Intelligence & Strategy Engine first, then the things that make a
strategy *better* (domain depth, design taste, business logic), then the
things that make it *last* (evolution loop, dedupe).

## Phase ordering

| Phase | Closes | What it is | Measurable acceptance |
| :--- | :--- | :--- | :--- |
| **P-S1 Project-Intelligence & Strategy Engine** | F4 | classify into ≥20 product categories (SaaS / ERP / CRM / e-commerce / marketplace / 3D-configurator / media / dev-tools / financial / booking / …); emit a per-project `PROJECT_STRATEGY.md` (architecture, design direction, component strategy, data model, security model, API architecture, performance, testing, deployment, required skills+agents, risks). Every decision carries a recorded reason. Deterministic + tested. | "SaaS billing tool" and "3D jewellery configurator" strategies differ on ≥4 axes; each strategy renders to Markdown with a reason per decision; a new-category ("previously unseen") request classifies via first-principles, not a keyword miss. |
| **P-S2 Design-taste layer** | F5 | product-type design languages (enterprise density / media imagery / dev-tool monospace / e-commerce photography / booking clarity) + a *template-slop detector* (random gradients, every-section-card, fake data, empty buttons). Extends `designGate.ts`, does not replace it. | a deliberately-generic dashboard scores *below* a category-appropriate one and the delta is nameable from the scorecard; the slop detector fires on a seeded template. |
| **P-S3 Domain & business-logic depth** | F6, F7, §2/§3 of the directive | a Universal Domain Intelligence + Business-Logic Discovery engine: derive participants/entities/workflows/financial-flows/rules/**lifecycle state machines** for a domain; actively surface edge cases (last-item race, timeout-after-charge, double-refund, cross-org). Compose P10 finance for all calculation. | given "make a marketplace," the engine emits a domain model + ≥3 lifecycle state machines + ≥5 concrete edge cases, each with an expected outcome; a seeded "impossible state" is caught. |
| **P-S4 Independent quality intelligence** | §10 of the directive | autonomous *challenger* panel (business-analyst / financial-logic / security / QA / performance) that reviews a P-S3 output with **evidence**, not approval. Reuses the existing `adversarialEngine` pattern. | a known-flawed plan gets ≥2 evidence-backed objections; a clean plan gets zero unfounded objections. |
| **P-S5 Evolution Engine (self-improving, controlled)** | F13 | versioned skills/policies/decision-records + a regression suite of diverse tasks; **promote a change only on a measured before/after win**; security/financial/permission changes are governance-gated and never silently weakened. | a seeded weakness in a skill is detected, a fix is proposed, promoted only when the regression suite improves, and is rollback-able; a security-weakening change is rejected. |
| **P-S6 Catalog dedupe** | F1, F2, F11 | collapse the 21×5 skill clones to canonical skills; merge overlapping agent pairs; re-measure Σ token. | 540→~455 distinct skills, Σ skill tokenCost measurably down, router top-3 precision not worse, agent pairs merged with a coverage diff proving no capability lost. |
| **P-S7 Real-time / storage / search full-stack analyzers** | F6 | 3 new `src/core/fullstack/*` subsystems (websocket/sse patterns, object-storage/signed-URL, full-text-search + analytics), deterministic + tested, composed into P11. | each analyzer flags a seeded defect (e.g. unauthenticated SSE, missing object-URL expiration, N+1 search) and stays clean on the fixed input. |

**Not in this roadmap (and why):**
- **Adding async / distributed machinery to the engines (F14)** — AETHER is a
  *deterministic harness*; making planning async to call a model would break
  the reproducibility that every benchmark and the GATE-12 certifier depend
  on. The model stays outside the pure core.
- **One giant injected skill (the directive's anti-recommendation)** — the
  recommendation is to build *five cooperating capabilities* (domain,
  creativity, business-logic, quality, evolution) at the **runtime-policy**
  layer, not a prompt blob. P-S1..P-S5 are exactly those five.

**Sequencing note:** P-S1 is the foundation — P-S2..P-S5 all read its
project-type classification. P-S6 is last (dedupe after the new capabilities
exist, so the merge is against a stable catalog).
