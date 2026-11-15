# AETHER 1.0 — The 8-Tool MCP Server

Created by Tabrej · License: Apache-2.0

AETHER exposes its core capabilities as an **8-tool Model Context Protocol
server** (`src/core/mcpServerEngine.ts`) running the JSON-RPC 2.0 over
**stdio** transport — the form `.mcp.json` clients launch. Logs go to
stderr only, so the stdout protocol stream is never corrupted.

---

## 1. The 20 tools (verified set)

| Tool | What it does |
| :--- | :--- |
| `aether_skill_router` | Matches a task + file path against all 540 skills (28-token lazy index), returns top-3 with per-call token cost |
| `aether_context_slice` | Ranks repo files by AST symbol imports + git co-change; evicts lockfiles/generated files; returns a bounded context slice |
| `aether_blast_radius` | Computes Hop-0 direct mutations, Hop-1 signature callers, Hop-2 API/DB consumers for a planned change |
| `aether_swarm_scheduler` | Computes the Task Complexity & Coupling Index (TCCI), picks the minimal agent team + dependency order |
| `aether_adversarial_gate` | Runs 6 independent challengers (architecture, code-breaker, security, performance, …) over a proposed diff |
| `aether_security_spotlighter` | Scans untrusted text for indirect prompt-injection and high-entropy credential leaks |
| `aether_continuity_checkpoint` | Compacts completed DAG stages, active file leases, and falsified debugging hypotheses into a resumable checkpoint |
| `aether_component_score_refine` | Runs the 5-rubric scorer across all 117 agents / 540 skills / 54 workflows; reports the live mean |
| `aether_deep_intel` | P10 deep execution: requirement depth + domains, minimal skill composition, exact fixed-point GST calculation (discount-before-tax, client-total tamper guard, rate provenance), audit decision records, 11-criterion completion gate |
| `aether_fullstack` | P11 full-stack engineering: architecture decision from a requirements profile (anti-microservices guardrail + drift), front/back API contract diff, data-model + migration review, reliability-policy audit, tenant isolation (Security Engine), production-readiness gate |
| `aether_project_strategy` | P12 project intelligence: multi-label classification into 27 product categories (keyword-evidence-tracked, first-principles fallback) + a prompt-length-independent effort policy + a per-project PROJECT_STRATEGY.md (13 reasoned decisions; agent refs verified against the catalog) |
| `aether_business_logic` | P13 business-logic: coherent domain model (entities with invariants, financial flows, success metrics), lifecycle state machines (order + subscription) with the impossible-state detector, the edge-case catalog the categories owe, economics-grounded possibilities, §8 metric discipline (decorative/un-labeled analytics rejected) |
| `aether_quality_panel` | P14 independent quality panel: nine evidence-gated reviewer perspectives (business analyst, domain specialist, product strategist, financial-logic, UX, backend architect, security, QA, performance) challenge a P12+P13 plan + artifact; self-approval without panel evidence is an objection of record (§10) |
| `aether_evolution` | P15 evolution engine: the §11 regression suite (10 diverse tasks, engine-verdict scoring, never output size) + the measured promote/hold/reject loop; safeguard changes are governed (R4) and never auto-promoted |
| `aether_calculations` | P16 universal calculations: paise-exact commission (effective-dated), proration, refund (policy-window + idempotency reference), shipping (coupon before threshold, exact tenths), EMI (BigInt closed form — no float drift), FX settlement (effective-dated), seller settlement (fees off gross, disputed carry-forward) — all on P10 Money primitives, one documented rounding boundary per operation |
| `aether_workflow` | P17 business workflow patterns: approval (maker/checker separation of duties + escalation + terminal rejection), dispute (funds freeze until a recorded resolution), reconciliation (double-entry invariant, one-paise drift named; corrections are appended reversals, never edits), period settlement (paise-exact, idempotent per period signature) |
| `aether_human_workflow` | P18 human-centered workflow audit: the five human factors — approval fatigue (sign-offs vs urgency), information gap at the decision point, approval theater, feedback lag (SLA-less decisions, unseen outcomes), irreversibility (no undo on a final action); every finding names the design change that removes it, plus posture-owed factors |
| `aether_design_taste` | P19 design-taste layer: is the design the RIGHT KIND for the product (each P12 category OWES measurable design-language expectations — FINANCIAL owes density + tabular numerals + status semantics; MEDIA owes a dark canvas + imagery + keyboard affordances; DEVTOOLS owe monospace + code surfaces; ECOMMERCE owes imagery + price + discovery + checkout clarity; BOOKING owes calendar + timezone honesty + a confirmation state) and is it free of AI template slop (aurora/conic gradient blobs, indigo+pink default, glassmorphism-everywhere, card-for-everything, fake stats, lorem, placeholder identities, dead CTAs, cliché hero copy)? Returns the 0–100 fit score with the delta nameable. Extends `designGate.ts` — it never replaces it |
| `aether_orchestration_plan` | P20 orchestration planner (§1/§2/§5): the execution plan a prompt OWES. Returns the **mode** (INSTANT / STANDARD / DEEP_ENGINEERING / AUTONOMOUS_PRODUCT / RESEARCH_INTENSIVE / CRITICAL_REPAIR / PRODUCTION_HARDENING — inferred, or an explicit `requestedMode` override), the **team** (every agent id verified against the 117-agent catalog, sized by the effort-level budget FOCUSED ≤2 … DEEPEST ≤14 — agent count is not intelligence), the **waves** (plan/research → implementation → verify/harden, disjoint, no agent scheduled twice), the §5 **requirement tiers** (ESSENTIAL = asked, IMPORTANT = assumed + disclosed, OPTIONAL = decided silently, NEVER_ASK = secrets: a placeholder is wired now, the value requested only at first live call) and the **stop condition** (§12: generated files are not a completed task). Fully deterministic — two calls with the same input are byte-identical. An empty task or an unknown `requestedMode` is a structured `BLOCKED`, never a crash |
| `aether_design_system` | P21 design-system generator (§6, the positive side of "stop producing generic AI interfaces"): for any P12 category + creative direction it returns the full DESIGN TOKEN SET (brand + semantic colors, light/dark theme pairs, 5-step type scale + weight ladder, spacing, radius, elevation, motion with a `prefers-reduced-motion` guard, responsive breakpoints, and WCAG contrast RATIO measured with `designGate.contrastRatio` — a number on the system, never a guess), the OWED INTERACTIONS (drag-and-drop owed ONLY where §6 names it — Kanban ordering, file organization, ordering, scheduling; a ledger does not owe it), and a self-contained, offline-safe STARTER DOCUMENT passing all nine designGate criteria AND every P19 owed expectation with zero template-slop tells. An unknown category, direction or theme is a structured `BLOCKED`, never a crash; two calls with the same input are byte-identical |

Every tool returns a JSON-RPC 2.0 result with `executionLatencyMs`,
`tokensSavedVsStatic`, and a `status` of `SUCCESS` or
`BLOCKED_BY_SECURITY_GATE` — the security gate is per-tool and always
consulted, even when a permission policy allows the call.

## 2. Register it with your harness

`aether install --target mcp-server --mcp --write .` writes a `.mcp.json`:

```json
{
  "mcpServers": {
    "aether": {
      "command": "npx",
      "args": ["tsx", "mcp/aether-mcp-server.ts"],
      "author": "Tabrej",
      "license": "Apache-2.0"
    }
  }
}
```

With the published package, the equivalent is the `aether-mcp` bin shim
(compiled `dist/bins/aether-mcp.mjs`).

## 3. CLI verification (non-protocol)

For humans, the server also accepts `--list-tools` and `--call <tool>` —
clearly labeled **not** part of the MCP protocol:

```bash
npx tsx bin/aether.ts mcp                 # prints all 10 tools + a live call
npx tsx mcp/aether-mcp-server.ts --list-tools
```

## 4. Least-privilege policy

Set `AETHER_MCP_PERMISSION_POLICY` in `.env` to deny, gate, or allow tools:

```ini
AETHER_MCP_PERMISSION_POLICY='{"deniedTools":[],"requireApprovalFor":["aether_continuity_checkpoint"],"approvedTools":[]}'
```

The policy *narrows* operator permission; it cannot bypass a tool's built-in
security gate. See [CONFIGURATION.md](./CONFIGURATION.md#2-mcp-permission-policy-optional-least-privilege).

## 5. Two independent clients, one protocol

GATE 04 verified the server against **two independent MCP clients** over
stdio (a real JSON-RPC round-trip, not a mock): see
[release-evidence/gate04-mcp.txt](../release-evidence/). The protocol
implementation is `src/core/mcp/mcpProtocol.ts`.
