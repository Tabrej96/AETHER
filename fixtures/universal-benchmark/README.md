# Universal Benchmark Fixtures

Created by Tabrej · Apache-2.0

Realistic **samples of the result formats** that AETHER's top-5 benchmark
adapters ingest. These are synthetic-but-accurate shapes (field names and
terminology match each tool's real output), so the adapter code is exercised
deterministically in tests without requiring the external daemon:

| Fixture | Adapter | Real source shape |
| :--- | :--- | :--- |
| `playwright-report.json` | `playwright-json` | Playwright JSON reporter (`stats.expected/unexpected/skipped`) |
| `openhands-events.json` | `openhands-events` | OpenHands runtime event trace (`events[]` + terminal `status`) |
| `openmanus-log.md` | `openmanus-log` | OpenManus plan-act markdown log with a terminal `## Final Output` marker |
| `autogen-conversation.jsonl` | `autogen-conversation` | AutoGen conversation JSONL with a terminal success event |
| `browser-use-result.json` | `browser-use-result` | Browser-Use task result (`n_steps` + `success` + token usage) |

None of these carry a fabricated score: they are inputs to the adapters, and
what each converts to is asserted in `src/core/benchmarks/universal.test.ts`.
