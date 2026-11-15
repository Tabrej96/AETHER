# AETHER 1.0 — Universal Benchmark Result Format

Created by Tabrej · License: Apache-2.0 · `aether.universal-benchmark/v1`

A single canonical shape that **every** AETHER benchmark capability — local or
external (OpenHands traces, OpenManus execution logs, AutoGen conversation
logs, Playwright JSON reports, Browser-Use task results) — can be converted
into. No adapter may invent a bespoke result shape, and no adapter may
fabricate a pass.

```
src/core/benchmarks/
  universalFormat.ts   the v1 schema + finalize (anti-fabrication + content hash)
  adapterEngine.ts     the adapter contract + registry + status-matrix builder
  adapters.ts          the top-5 REAL adapters (each parses its tool's real output)
  universal.test.ts    11-test pipeline + anti-fabrication rules
fixtures/universal-benchmark/   realistic samples of each tool's real output shape
```

---

## 1. The universal record

Every result carries:

| Field | Meaning |
| :--- | :--- |
| `status` | `MEASURED` · `ESTIMATED` · `UNAVAILABLE` · `NOT_APPLICABLE` · `INCONCLUSIVE` |
| `verifiedPass` | Only `true` when the source trace contains a terminal-success signal **and** at least one named assertion; otherwise `null` (or `false`) |
| `metrics` | `wallClockMs`, `promptTokens`/`completionTokens`/`totalTokens` + `tokenClass`, `toolCalls`, `costUsd` + `costClass` — the class is recorded, never silently mixed |
| `evidence` | Provenance: which file/daemon produced this, and how to re-run it |
| `verification` | The concrete method + assertion count |
| `externalCommandToReproduce` | The re-measure command, always present on UNAVAILABLE/INCONCLUSIVE cells |
| `resultId` | A **genuine SHA-256** over the canonical content — two identical runs are byte-identical; a tampered one changes the hash |

## 2. The anti-fabrication rules (enforced at finalize)

- `verifiedPass: true` **requires** a terminal-success evidence note **and**
  `assertionsRun > 0`. A record that claims a pass with neither is refused as a
  `FABRICATION_ATTEMPT`.
- An `UNAVAILABLE` record can never carry `verifiedPass: true`.
- Token counts with a non-UNKNOWN `tokenClass` are required to be consistent.
- A *present* trace whose format an adapter does not recognize becomes
  **`INCONCLUSIVE`** — it is never silently downgraded to a fabricated pass,
  and never silently dropped.

## 3. The top-5 adapters (each parses a real output shape)

| Adapter | Harness | Real source shape | Locally executable? |
| :--- | :--- | :--- | :--- |
| `playwright-json` | Playwright | JSON reporter (`stats.expected/unexpected/skipped`) | Yes |
| `openhands-events` | OpenHands | runtime event trace (`events[]` + terminal `status`) | No (Docker) |
| `openmanus-log` | OpenManus | plan-act markdown log with a terminal `## Final Output` marker | No (Python) |
| `autogen-conversation` | AutoGen | conversation JSONL; requires a terminal success event | No (Python + LLM keys) |
| `browser-use-result` | Browser-Use | task-result JSON (`n_steps` + `success` + token usage) | No (vision service) |

Fixture samples of each real shape live in `fixtures/universal-benchmark/`.

## 4. Use it

```bash
npx tsx bin/aether.ts universal
```

Prints the 5-adapter registry, the status matrix with the fixture traces
(convert path), and the honest counts. With no fixtures present it prints the
baseline matrix where every cell is `UNAVAILABLE` carrying its re-measure
command — **never a fabricated result**.

## 5. Status-matrix honesty

`buildStatusMatrix` is derived data, recomputed from the traces: a supplied-and-
recognized trace → converted result; a supplied-but-unrecognized trace →
`INCONCLUSIVE`; a missing trace → the adapter's own `UNAVAILABLE` cell. The
matrix is never hand-maintained, so a claim in it is always reproducible.

## 6. Relationship to GATE 08

The GATE 08 certification table lists external harnesses as
`UNMEASURED_REQUIRES_HOST_DAEMON` until a real trace is imported. This program
is that import path: drop a real tool trace into
`fixtures/universal-benchmark/` (or feed it to an adapter), and the cell
promotes to `MEASURED` with a genuine content hash — the bridge from "we know
how to measure it" to "here is the measurement".
