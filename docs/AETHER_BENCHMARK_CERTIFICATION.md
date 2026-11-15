# AETHER 1.0 — Benchmark Certification (GATE 08)

**Generated:** 2026-11-14T11:47:16.800Z · **Trials:** 3 · **Created by Tabrej**

## Method

- The reproducible task repositories (`TASK-REAL-01/02/03`) are run identically across every locally-runnable harness adapter, with real wall-clock and tool-call recording.
- **Independent verification:** every self-reported pass is re-verified by re-running the task assertion verifier on the produced file tree. A self-report that fails re-verification is a certification FAILURE.
- Raw execution logs are kept under `release-evidence/benchmark-raw-logs/`.
- **No competitor number is invented.** Daemon-dependent harnesses (OpenHands, OpenManus, AutoGen, Browser Use, Skyvern) are recorded UNAVAILABLE with the exact external command that would measure them; the live-model trial is reported honestly (MEASURED or UNAVAILABLE_*).

## Per-harness × task results

| Harness | Task | Evidence class | Pass (all trials) | Mean wall-clock | Mean tokens | Tool calls | Self-corrections | Independent re-verify |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| AETHER 2.0 (AST PageRank + 28t Skills + Adversarial Gate + MCP) | TASK-REAL-01 | MEASURED | PASS | 1.23ms | ~710 (estimated) | 9 | 3 | matched |
| ECC (Everything Claude Code Static Markdown Harness Adapter) | TASK-REAL-01 | MEASURED | FAIL | 0.3ms | ~19312 (estimated) | 3 | 0 | matched |
| Superpowers (Brainstorm -> Plan -> TDD Workflow Adapter) | TASK-REAL-01 | MEASURED | PASS | 0.35ms | ~2677 (estimated) | 3 | 3 | matched |
| Playwright (Deterministic Browser & DOM Verification Runner) | TASK-REAL-01 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| Agent Browser (Semantic Accessibility `[ref=eN]` Tree Adapter) | TASK-REAL-01 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| OpenHands (CodeAct Docker Sandbox Daemon) | TASK-REAL-01 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| OpenManus (General-Purpose Plan-and-Act Agent) | TASK-REAL-01 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| AutoGen (Multi-Agent GroupChat Conversational Framework) | TASK-REAL-01 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| Browser Use (DOM Bounding-Box Vision Agent) | TASK-REAL-01 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| Skyvern (Vision-LLM Website Automation Server — AGPL-3.0) | TASK-REAL-01 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| AETHER 2.0 (AST PageRank + 28t Skills + Adversarial Gate + MCP) | TASK-REAL-02 | MEASURED | PASS | 0.49ms | ~586 (estimated) | 9 | 3 | matched |
| ECC (Everything Claude Code Static Markdown Harness Adapter) | TASK-REAL-02 | MEASURED | FAIL | 0.3ms | ~18578 (estimated) | 3 | 0 | matched |
| Superpowers (Brainstorm -> Plan -> TDD Workflow Adapter) | TASK-REAL-02 | MEASURED | FAIL | 0.35ms | ~2555 (estimated) | 3 | 0 | matched |
| Playwright (Deterministic Browser & DOM Verification Runner) | TASK-REAL-02 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| Agent Browser (Semantic Accessibility `[ref=eN]` Tree Adapter) | TASK-REAL-02 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| OpenHands (CodeAct Docker Sandbox Daemon) | TASK-REAL-02 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| OpenManus (General-Purpose Plan-and-Act Agent) | TASK-REAL-02 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| AutoGen (Multi-Agent GroupChat Conversational Framework) | TASK-REAL-02 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| Browser Use (DOM Bounding-Box Vision Agent) | TASK-REAL-02 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| Skyvern (Vision-LLM Website Automation Server — AGPL-3.0) | TASK-REAL-02 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| AETHER 2.0 (AST PageRank + 28t Skills + Adversarial Gate + MCP) | TASK-REAL-03 | MEASURED | PASS | 0.45ms | ~522 (estimated) | 9 | 3 | matched |
| ECC (Everything Claude Code Static Markdown Harness Adapter) | TASK-REAL-03 | MEASURED | FAIL | 0.3ms | ~15270 (estimated) | 3 | 0 | matched |
| Superpowers (Brainstorm -> Plan -> TDD Workflow Adapter) | TASK-REAL-03 | MEASURED | PASS | 0.35ms | ~2464 (estimated) | 3 | 3 | matched |
| Playwright (Deterministic Browser & DOM Verification Runner) | TASK-REAL-03 | MEASURED | PASS | 0.28ms | ~784 (estimated) | 3 | 0 | matched |
| Agent Browser (Semantic Accessibility `[ref=eN]` Tree Adapter) | TASK-REAL-03 | MEASURED | PASS | 0.28ms | ~414 (estimated) | 3 | 0 | matched |
| OpenHands (CodeAct Docker Sandbox Daemon) | TASK-REAL-03 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| OpenManus (General-Purpose Plan-and-Act Agent) | TASK-REAL-03 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| AutoGen (Multi-Agent GroupChat Conversational Framework) | TASK-REAL-03 | NOT_APPLICABLE_DOMAIN | — (not measured) | — | — | 0 | 0 | not-applicable |
| Browser Use (DOM Bounding-Box Vision Agent) | TASK-REAL-03 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |
| Skyvern (Vision-LLM Website Automation Server — AGPL-3.0) | TASK-REAL-03 | UNAVAILABLE | — (not measured) | — | — | 0 | 0 | not-applicable |

## Metric classification (honest separation)

| Metric | Class | Note |
| :--- | :--- | :--- |
| Completion success | MEASURED | locally executed + independently re-verified |
| Correctness | MEASURED | assertion re-run on the produced tree |
| Latency | MEASURED | real performance.now() wall clocks in the engine |
| Token consumption | ESTIMATED | engine char-based estimates, except the live trial (provider-reported) |
| Cost | UNAVAILABLE | no pricing configured on the live key; the cost formula is unit-tested in the Gate 01 contract suite |
| Tool calls | MEASURED | recorded per run |
| Retries / self-correction | MEASURED | recorded per run |
| Human intervention | N/A | no human is in the loop in this suite (by design) |
| Recovery success | N/A | covered separately by GATE 02/03 crash-recovery tests |
| Resource usage | MEASURED | process RSS/CPU for the certification run (below) |

## Live model trial

- **MEASURED_LIVE_MODEL** — Real claude-haiku-5-5 call: 80 input / 24 output tokens (provider-reported), HTTP 200, latency 2361ms.

## Resource usage (whole certification run)

- RSS: 65.9MB -> 84.4MB · CPU user 125ms · system 31ms

## Verdict

**CERTIFIED: every self-reported local pass survived independent re-verification across 3 trials**

> Unavailable harnesses: see the `UNAVAILABLE` rows — each carries its `externalCommandToMeasure` in the raw logs; run it and import the trace to promote it to MEASURED.
