# AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE (Program P10)

> Created by Tabrej · Apache-2.0
>
> P10 is the tenth capability program, and it is different from the first nine:
> it is **not** a study of an external repository. It is an **operator directive** — a
> specification of how AETHER itself must *think* about tasks. P01–P09 add
> capabilities (browsers, agents, workflows); P10 adds a **standard**: understand the
> depth of what was asked, discover what the domain actually requires, make
> calculations exact, record decisions auditably, and call a task complete only
> when the evidence says so.

## What the directive requires (verbatim intent)

- Understand the **depth** behind every request — simple fixes are not over-engineered;
  complex systems are not under-specified.
- Discover the business rules the task actually implies (GST slabs, tax order, HSN/SAC…)
  and **never invent** a rule; if a material unknown exists, ask.
- Use **decimal/fixed-point** arithmetic for money. Never binary floats.
- Follow the prescribed calculation order: subtotal → eligible discount → taxable value →
  tax → grand total (+ non-taxable additional charges).
- Record **audit-safe decision records** (what / requirements / alternatives / selected /
  justification / risks / verification method). No raw chain-of-thought exposed.
- **New quality standard:** a task is complete when its required *behavior* is proven —
  not when code exists, a page renders, a number displays, or a screenshot looks nice.

## Where it lives

| Subsystem | File | Role |
|---|---|---|
| Fixed-point money | `src/core/finance/money.ts` | integer-paise `Money`, one documented rounding boundary (`roundRational`), exact `sum`, `mulRate` |
| GST tax engine | `src/core/finance/taxEngine.ts` | jurisdiction-pluggable slabs (each rate carries **source + effective date**), CGST/SGST↔IGST split, discount-before-tax, inclusive back-solve, `verifyClientTotal` tamper guard, server-side line validation |
| Requirement depth | `src/core/intel/requirements.ts` | `SIMPLE / DETAILED / COMPLEX / AMBIGUOUS` + domain discovery + `mustAsk` (never fabricate) |
| Decision records | `src/core/intel/decisionRecords.ts` | closed, validated, deterministically-rendered audit records |
| Completion gate | `src/core/intel/completion.ts` | 11 criteria, **met-implies-evidence** (a met criterion without evidence is a defect), proportional to task |
| Skill composer | `src/core/intel/skillComposer.ts` | minimal, deterministic composition — a task loads only the skills it owes; skips are recorded |
| P10 orchestrator | `src/core/programs/p10DeepExecutionIntelligence.ts` | one entry point → `DeepExecutionPlan`; registered in the integration registry; `aether_deep_intel` MCP tool |
| Live demo | `src/core/intel/deepDemo.ts` | real inter-state GST invoice → exact paise → design-audited page → live Chrome recompute |

## Measured evidence (no cell is fabricated)

- **42 P10 tests** (money boundary/known-value/property + invalid-input rejection; tax
  order/split/inclusive/provenance/tamper; requirement depth/mustAsk; decision validation;
  completion gate; P10 integration; live demo incl. real-browser recompute — honest
  SKIP when no browser binary). All mandatory in `scripts/run-release-suites.ts`
  (`p10-deep-intelligence` + `p10-live-demo` suites).
- **Live demo** (`release-evidence/deep-demo/`): grand total **₹3,193.00** (319300 paise),
  tax **₹378.00** IGST-only, tamper guard rejects an asserted total that is ₹180 short,
  design audit **90/100**, and a real Chrome run where the page's "Verify totals" button
  recomputes in integer paise and its total equals the engine's — before/after screenshots
  committed as evidence.
- **MCP surface**: `aether_deep_intel` tool — exact calculation + decision records +
  completion verdict, with malformed/invalid payloads returning structured
  `BLOCKED_BY_SECURITY_GATE` results, never a crash.
- **CLI**: `npx tsx bin/aether.ts deep` (add `--no-browser` for headless).

## Integration rule, honored

From the cross-program charter: *a capability is integrated only when it is accessible
through AETHER's interfaces, executes real work, handles failures safely, and passes its
integration tests.* P10 is reachable through the MCP engine + CLI + registry; it executes
the live demo end-to-end; invalid input and missing-browser cases are safe terminal
states; and its 42 tests pass.

## Provenance

No external repository was studied for P10 — it is a first-party directive. The only
external fact used is the **GST slab structure** (5/12/18/28), which is a public
reference table: every rate in the demo table carries `source + effective date`, and the
engine is jurisdiction-pluggable so a production deployment loads live rates instead.
Third-party skills, if studied later, are credited in the skill catalog's
`provenance` field (license + repository) — never silently copied.
