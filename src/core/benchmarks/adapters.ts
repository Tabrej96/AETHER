/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — TOP-5 REAL BENCHMARK ADAPTERS
 * (src/core/benchmarks/adapters.ts)
 *
 * Five adapters for the external harnesses that carry UNMEASURED slots in the
 * GATE 08 certification. Each parses that tool's REAL result shape, not an
 * invented one:
 *
 *   1. Playwright   — JSON reporter (deterministic, locally executable)
 *   2. OpenHands    — runtime event trace (Docker daemon, external)
 *   3. OpenManus    — execution markdown log (Python host, external)
 *   4. AutoGen      — conversation JSONL (Python + LLM keys, external)
 *   5. Browser-Use  — task result JSON (vision-LLM service, external)
 *
 * No adapter invents numbers: a missing trace -> UNAVAILABLE (with the
 * re-measure command); a present-but-unparseable trace -> INCONCLUSIVE.
 */

import {
  type AdapterConvertOptions,
  BenchmarkAdapterRegistry,
  type BenchmarkAdapterSpec,
  type ExternalTrace,
  finalizeFromInput,
} from './adapterEngine';
import {
  type ConversionError,
  type UniversalResultInput,
  type UniversalTaskRef,
} from './universalFormat';

// ---------------------------------------------------------------- helpers
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}
function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function ms(v: unknown): number | null {
  const n = numOrNull(v);
  return n == null ? null : Math.round(n);
}

/**
 * Shared adapter factory: every adapter supplies only its detector and its
 * trace->input converter. The finalize step, the UNAVAILABLE cell, and the
 * re-measure command wiring are uniform, so the anti-fabrication rules apply
 * identically to all five.
 */
interface AdapterConfig {
  adapterId: string;
  harnessName: string;
  upstreamUrl?: string;
  description: string;
  /** The external command that would measure this cell when a trace is absent. */
  externalCommand: string;
  /** Honest prose for the UNAVAILABLE cell. */
  unavailableDetail: (taskRef: UniversalTaskRef, command: string) => string;
  detect: (text: string) => boolean;
  toInput: (
    trace: ExternalTrace,
    taskRef: UniversalTaskRef,
    opts: AdapterConvertOptions
  ) => UniversalResultInput | { error: ConversionError };
}

function makeAdapter(cfg: AdapterConfig): BenchmarkAdapterSpec {
  const spec: BenchmarkAdapterSpec = {
    adapterId: cfg.adapterId,
    harnessName: cfg.harnessName,
    upstreamUrl: cfg.upstreamUrl,
    description: cfg.description,
    detect: cfg.detect,
    toInput: cfg.toInput,
    convert: (trace, taskRef, opts) => {
      const input = cfg.toInput(trace, taskRef, opts);
      if ('error' in input) return input;
      return finalizeFromInput(input);
    },
    unavailable: (taskRef, opts) => {
      const command = opts.externalCommandToReproduce ?? cfg.externalCommand;
      const input: UniversalResultInput = {
        taskRef,
        harnessRef: { adapterId: cfg.adapterId, harnessName: cfg.harnessName, version: opts.harnessVersion },
        status: 'UNAVAILABLE',
        metrics: {},
        evidence: cfg.unavailableDetail(taskRef, command),
        verification: { method: 'n/a', assertionsRun: null },
        externalCommandToReproduce: command,
        recordedAtIso: opts.recordedAtIso,
      };
      const out = finalizeFromInput(input);
      // An UNAVAILABLE cell can never be a fabrication/malformed error; if it
      // somehow is, that is a programming defect, not an honest outcome.
      if ('error' in out) throw new Error(`unavailable cell for ${cfg.adapterId} failed to finalize: ${out.error.detail}`);
      return out;
    },
  };
  return spec;
}

// ---------------------------------------------------------------- 1. Playwright
export function createPlaywrightAdapter(): BenchmarkAdapterSpec {
  const command = 'npx playwright test --reporter=json --output ./aether/playwright-report';
  return makeAdapter({
    adapterId: 'playwright-json',
    harnessName: 'Playwright JSON Reporter',
    upstreamUrl: 'https://github.com/microsoft/playwright',
    description: 'Converts a Playwright JSON-reporter file into universal results.',
    externalCommand: command,
    unavailableDetail: (t, cmd) =>
      `Playwright JSON report not provided for ${t.taskId}; run the JSON reporter to measure. Re-measure: ${cmd}`,
    detect: (text) => {
      const j = parseJson(text);
      return isObj(j) && 'stats' in j && 'suites' in j;
    },
    toInput: (trace, taskRef, opts) => {
      const j = parseJson(trace.sourceText);
      if (!isObj(j) || !isObj(j.stats)) {
        return { error: { kind: 'MALFORMED_SOURCE', detail: 'expected a Playwright JSON report with `stats`' } };
      }
      const stats = j.stats as Record<string, unknown>;
      const expected = numOrNull(stats.expected) ?? 0;
      const unexpected = numOrNull(stats.unexpected) ?? 0;
      const skipped = numOrNull(stats.skipped) ?? 0;
      const total = expected + unexpected + skipped;
      const passed = unexpected === 0; // zero failing/errored tests
      return {
        taskRef,
        harnessRef: { adapterId: 'playwright-json', harnessName: 'Playwright', version: opts.harnessVersion },
        status: 'MEASURED',
        verifiedPass: passed,
        metrics: {
          wallClockMs: ms(stats.duration),
          tokenClass: 'UNKNOWN',
          costClass: 'UNKNOWN',
        },
        evidence: `Playwright JSON report: ${expected} passed / ${unexpected} failed / ${skipped} skipped (of ${total}); terminal ${passed ? 'success' : 'failure'}. Source: ${trace.source}`,
        verification: { method: 'playwright json-reporter terminal outcome', assertionsRun: total || null },
        externalCommandToReproduce: opts.externalCommandToReproduce ?? command,
        recordedAtIso: opts.recordedAtIso,
      };
    },
  });
}

// ---------------------------------------------------------------- 2. OpenHands
export function createOpenHandsAdapter(): BenchmarkAdapterSpec {
  const command =
    'docker run -it --rm ghcr.io/all-hands-ai/openhands:latest --task-file ./aether/benchmarks/tasks.json';
  return makeAdapter({
    adapterId: 'openhands-events',
    harnessName: 'OpenHands Runtime Events',
    upstreamUrl: 'https://github.com/All-Hands-AI/OpenHands',
    description: 'Converts an OpenHands runtime event trace into universal results.',
    externalCommand: command,
    unavailableDetail: (t, cmd) =>
      `OpenHands runtime trace not provided for ${t.taskId}; a Docker daemon is required to measure. Re-measure: ${cmd}`,
    detect: (text) => {
      const j = parseJson(text);
      return isObj(j) && Array.isArray(j.events) && 'runtime' in j;
    },
    toInput: (trace, taskRef, opts) => {
      const j = parseJson(trace.sourceText);
      if (!isObj(j) || !Array.isArray(j.events)) {
        return { error: { kind: 'MALFORMED_SOURCE', detail: 'expected an OpenHands event trace with `events[]`' } };
      }
      const events = j.events as Array<Record<string, unknown>>;
      const status = String(j.status ?? 'unknown');
      const ok = /completed|success/i.test(status);
      const toolCalls = events.filter((e) => e.tool_name || e.action).length || null;
      return {
        taskRef,
        harnessRef: { adapterId: 'openhands-events', harnessName: 'OpenHands', version: opts.harnessVersion },
        status: 'MEASURED',
        verifiedPass: ok,
        metrics: {
          toolCalls,
          tokenClass: 'UNKNOWN',
          costClass: 'UNKNOWN',
        },
        evidence: `OpenHands ${String(j.runtime ?? 'docker')} runtime trace: status=${status}, ${events.length} events, ${toolCalls ?? 0} tool actions. Terminal ${ok ? 'success' : 'failure'}. Source: ${trace.source}`,
        verification: { method: 'openhands runtime terminal status + event count', assertionsRun: events.length || null },
        externalCommandToReproduce: opts.externalCommandToReproduce ?? command,
        recordedAtIso: opts.recordedAtIso,
      };
    },
  });
}

// ---------------------------------------------------------------- 3. OpenManus
export function createOpenManusAdapter(): BenchmarkAdapterSpec {
  const command = 'python3 -m openmanus.run --benchmark ./aether/benchmarks/tasks.json';
  return makeAdapter({
    adapterId: 'openmanus-log',
    harnessName: 'OpenManus Execution Log',
    upstreamUrl: 'https://github.com/FoundationAgents/OpenManus',
    description: "Parses an OpenManus plan-act markdown log's terminal marker.",
    externalCommand: command,
    unavailableDetail: (t, cmd) =>
      `OpenManus execution log not provided for ${t.taskId}; a Python host is required to measure. Re-measure: ${cmd}`,
    detect: (text) => /## (OpenManus|Final Output|Result)/.test(text) && /success|failed|complete/i.test(text),
    toInput: (trace, taskRef, opts) => {
      const text = trace.sourceText;
      if (!/## (OpenManus|Final Output|Result)/.test(text)) {
        return { error: { kind: 'MALFORMED_SOURCE', detail: 'no OpenManus section header found in log' } };
      }
      const ok = /## (Final Output|Result)[\s\S]*success/i.test(text) || /task.*completed/i.test(text);
      return {
        taskRef,
        harnessRef: { adapterId: 'openmanus-log', harnessName: 'OpenManus', version: opts.harnessVersion },
        status: 'MEASURED',
        verifiedPass: ok,
        metrics: { tokenClass: 'UNKNOWN', costClass: 'UNKNOWN' },
        evidence: `OpenManus execution log terminal marker present; outcome ${ok ? 'success' : 'not-success'}. Source: ${trace.source}`,
        verification: { method: 'openmanus plan-act terminal marker', assertionsRun: 1 },
        externalCommandToReproduce: opts.externalCommandToReproduce ?? command,
        recordedAtIso: opts.recordedAtIso,
      };
    },
  });
}

// ---------------------------------------------------------------- 4. AutoGen
export function createAutoGenAdapter(): BenchmarkAdapterSpec {
  const command = 'python3 -m autogen_bench run --tasks ./aether/benchmarks/tasks.json';
  return makeAdapter({
    adapterId: 'autogen-conversation',
    harnessName: 'AutoGen Conversation Log',
    upstreamUrl: 'https://github.com/microsoft/autogen',
    description: 'Parses an AutoGen JSONL conversation log; requires a terminal success event.',
    externalCommand: command,
    unavailableDetail: (t, cmd) =>
      `AutoGen conversation log not provided for ${t.taskId}; the Python runtime + LLM keys are required to measure. Re-measure: ${cmd}`,
    detect: (text) => {
      const lines = text.trim().split('\n').filter((l) => l.trim());
      if (lines.length === 0) return false;
      return lines.slice(0, 3).every((l) => {
        const j = parseJson(l);
        return isObj(j) && 'type' in j && 'sender' in j;
      });
    },
    toInput: (trace, taskRef, opts) => {
      const lines = trace.sourceText.trim().split('\n').filter((l) => l.trim());
      const msgs = lines.map((l) => parseJson(l)).filter((j): j is Record<string, unknown> => isObj(j));
      if (msgs.length === 0) return { error: { kind: 'MALFORMED_SOURCE', detail: 'no parseable AutoGen JSONL events' } };
      const successEvent = msgs.find(
        (m) => m.success === true || /succeeded|task complete|success/i.test(String(m.content ?? m.result ?? ''))
      );
      const ok = Boolean(successEvent);
      return {
        taskRef,
        harnessRef: { adapterId: 'autogen-conversation', harnessName: 'AutoGen', version: opts.harnessVersion },
        status: 'MEASURED',
        verifiedPass: ok,
        metrics: { toolCalls: msgs.length || null, tokenClass: 'UNKNOWN', costClass: 'UNKNOWN' },
        evidence: `AutoGen conversation log: ${msgs.length} agent messages across ${new Set(msgs.map((m) => String(m.sender))).size} speakers; terminal ${ok ? 'success' : 'no-success-event'}. Source: ${trace.source}`,
        verification: { method: 'autogen terminal success event', assertionsRun: ok ? 1 : 0 },
        externalCommandToReproduce: opts.externalCommandToReproduce ?? command,
        recordedAtIso: opts.recordedAtIso,
      };
    },
  });
}

// ---------------------------------------------------------------- 5. Browser-Use
export function createBrowserUseAdapter(): BenchmarkAdapterSpec {
  const command = 'uv run browser-use --task-id TASK-REAL-03';
  return makeAdapter({
    adapterId: 'browser-use-result',
    harnessName: 'Browser-Use Task Result',
    upstreamUrl: 'https://github.com/browser-use/browser-use',
    description: 'Parses a Browser-Use task-result JSON (steps + token usage).',
    externalCommand: command,
    unavailableDetail: (t, cmd) =>
      `Browser-Use task result not provided for ${t.taskId}; the vision-LLM service is required to measure. Re-measure: ${cmd}`,
    detect: (text) => {
      const j = parseJson(text);
      return isObj(j) && 'n_steps' in j && 'success' in j;
    },
    toInput: (trace, taskRef, opts) => {
      const j = parseJson(trace.sourceText);
      if (!isObj(j) || !('n_steps' in j) || !('success' in j)) {
        return { error: { kind: 'MALFORMED_SOURCE', detail: 'expected a Browser-Use task result with n_steps + success' } };
      }
      const ok = j.success === true;
      const usage = isObj(j.token_usage) ? j.token_usage : {};
      const totalTokens = numOrNull(usage.total_tokens ?? usage.total ?? j.total_tokens);
      const costUsd = numOrNull(j.cost_usd ?? usage.cost_usd);
      return {
        taskRef,
        harnessRef: { adapterId: 'browser-use-result', harnessName: 'Browser-Use', version: opts.harnessVersion },
        status: 'MEASURED',
        verifiedPass: ok,
        metrics: {
          wallClockMs: ms(j.duration_ms),
          promptTokens: numOrNull(usage.prompt_tokens),
          completionTokens: numOrNull(usage.completion_tokens),
          totalTokens,
          tokenClass: totalTokens != null ? 'MEASURED' : 'UNKNOWN',
          toolCalls: numOrNull(j.n_steps),
          costUsd,
          costClass: costUsd != null ? 'MEASURED' : 'UNKNOWN',
        },
        evidence: `Browser-Use task result: ${ok ? 'success' : 'failure'} in ${String(j.n_steps ?? '?')} steps${totalTokens != null ? `, ${totalTokens} tokens` : ''}. Source: ${trace.source}`,
        verification: { method: 'browser-use task success flag + step count', assertionsRun: 1 },
        externalCommandToReproduce: opts.externalCommandToReproduce ?? command,
        recordedAtIso: opts.recordedAtIso,
      };
    },
  });
}

// ---------------------------------------------------------------- registry
export function buildUniversalAdapterRegistry(): BenchmarkAdapterRegistry {
  // Most-specific JSON detectors first, then JSONL, then text.
  const reg = new BenchmarkAdapterRegistry();
  reg
    .register(createPlaywrightAdapter())
    .register(createOpenHandsAdapter())
    .register(createBrowserUseAdapter())
    .register(createAutoGenAdapter())
    .register(createOpenManusAdapter());
  return reg;
}

export const UNIVERSAL_ADAPTERS: Array<() => BenchmarkAdapterSpec> = [
  createPlaywrightAdapter,
  createOpenHandsAdapter,
  createOpenManusAdapter,
  createAutoGenAdapter,
  createBrowserUseAdapter,
];
