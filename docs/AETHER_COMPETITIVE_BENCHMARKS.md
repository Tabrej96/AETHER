# AETHER 1.0 — Competitive Benchmarks

**Created by Tabrej · License: Apache-2.0**

**Honesty policy (inherited from AETHER's `realBenchmarkEngine`):** a number in this document
is either **measured by deterministic execution in this repository** or explicitly marked
**UNMEASURED** with the command that would produce a real value. No competitor score is
ever fabricated. Every value below was produced by running the nine program engines
(`npx tsx bin/aether.ts programs`, or the per-program `run*P0XBenchmarkEvidence()` calls).

## 1. Measured AETHER results (deterministic, reproducible in-repo)

Reproduce all of these with: `npx tsx bin/aether.ts programs` (registry run) or
`npx tsx --test src/core/programs/programs.test.ts`.

| Program | Metric | Measured value | How it was measured |
| :--- | :--- | :---: | :--- |
| P01 | Skills discovered (happy path) | **3** | `runP01BenchmarkEvidence()` — deterministic trigger-rank over a 3-skill catalog |
| P01 | Research-missing case blocked reasons | **2** | Same call — asserts the gate actually blocks |
| P02 | Modules reconstructed | **4** | `runP02BenchmarkEvidence()` — 4-file synthetic service |
| P02 | External dependencies discovered | **2** (`express`, `pg`) | Same call |
| P03 | Steps completed after resume | **2** (2/4 → 4/4) | `runP03BenchmarkEvidence()` — run 1 checkpoints resumable at 2/4; resume self-verifies 4/4 |
| P04 | Parallel waves | **2** (3 tasks) | `runP04BenchmarkEvidence()` — 1 retry + 1 group-conversation turn |
| P05 | A11y-snapshot token savings vs raw DOM | **92%** | `runP05BenchmarkEvidence()` — 5-node form: 15 snapshot tokens vs ~190 raw-DOM tokens |
| P06 | Loop steps to verified goal | **1** | `runP06BenchmarkEvidence()` — verified + ungrounded-abort both in 1 step |
| P07 | Browser task profiles verified | **4** | `runP07BenchmarkEvidence()` — 3 fully-compatible, 1 capability-gap flagged |
| P08 | Knowledge-graph edges | **4** | `runP08BenchmarkEvidence()` — 4-note vault, orphan `d` detected |
| P09 | Node-graph topological layers | **4** | `runP09BenchmarkEvidence()` — 4-node clean-room graph |
| P09 | 3D scene draw-call estimate | **2** | Same call — 3-object scene, render order `[root, m1, l1]` |

## 2. What is measured vs what is not (and why)

AETHER distinguishes three evidence classes, exactly as `realBenchmarkEngine.ts` does:

- **`MEASURED_DETERMINISTIC_EXECUTION`** — the numbers in §1. These run in-repo, are
  reproducible, and carry no competitor score.
- **`UNMEASURED_REQUIRES_EXTERNAL_BACKEND`** — live capabilities that need a real
  browser/vision/binary/network backend (P05 vision escalation, P06 live perception,
  P02 binary/network/UI slots). These are **null**, never fabricated, each with an
  `externalCommandToMeasure`.
- **Competitor head-to-heads** — AETHER does **not** publish fabricated pass-rate or
  token numbers for OpenHands/OpenManus/AutoGen/Browser Use/Skyvern. Where a fair local
  comparison is possible (the existing `realBenchmarkEngine` suite: `aether-2.0` vs
  `ecc`, `superpowers`, `playwright`, `agent-browser` on `TASK-REAL-01/02/03`), the
  numbers are measured on reproducible fixture repositories; otherwise the record is
  `UNMEASURED_REQUIRES_HOST_DAEMON` with the exact external command.

## 3. Competitive positioning (qualitative, not fabricated)

| Capability domain | Strongest upstream approach | AETHER's improvement (measured where possible) |
| :--- | :--- | :--- |
| Dev workflow (P01) | ECC static skills; Superpowers prose TDD | Deterministic discovery + **enforced gates** (block count measured) |
| Reverse engineering (P02) | REA CLI+MCP read-only analysis | Hard **authorization gate** before any processing; structure reconstruction measured |
| Autonomous execution (P03) | OpenHands session-level resume; OpenManus plan-act | **Step-level crash resume** that replays only failed steps (resume delta measured) |
| Multi-agent (P04) | AutoGen event-driven group chat | Deterministic **wave scheduler + retry-once fail-fast** (wave/retry counts measured) |
| Browser interaction (P05) | agent-browser `[ref]` a11y; browser-use vision | Ranked strategies; **92% snapshot token savings** measured; vision only as escalation |
| Visual computer use (P06) | Skyvern vision-LLM loop (AGPL, out-of-proc); OmniParser grounding | **Perception→reasoning→action→verification** loop with deterministic grounding; verified-goal steps measured |
| Browser infra (P07) | Playwright cross-browser; Lightpanda lightweight CDP | **Honest capability-gap selection** — Lightpanda not assumed a drop-in (gap flagged) |
| Knowledge (P08) | Obsidian vault+graph; Puter workspace (AGPL) | Deterministic **knowledge graph + orphans/clusters**; permission-audited plugin discovery |
| Creative (P09) | ComfyUI node graph (GPL); Three.js scene graph | **Clean-room scheduler** (cycle-safe) + **separate 3D model**; layer counts measured |

## 4. How to run the full benchmark pipeline

```bash
npx tsx bin/aether.ts programs      # nine-program live registry + lifecycle demo
npx tsx bin/aether.ts benchmark      # existing reproducible harness suite (TASK-REAL-01/02/03)
npx tsx --test src/core/programs/programs.test.ts   # 10 program integration tests
```

To convert an `UNMEASURED` capability into a measured one, run the specific
`externalCommandToMeasure` recorded on that capability (e.g. start a Playwright browser
process and point P05 at it, or run a Skyvern out-of-process server for P06) and import
the resulting JSON evidence trace.
