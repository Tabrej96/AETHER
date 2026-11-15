/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — UNIVERSAL BENCHMARK RESULT FORMAT (v1)
 * (src/core/benchmarks/universalFormat.ts)
 *
 * A single canonical record that any AETHER benchmark capability — local or
 * external (OpenHands traces, OpenManus execution logs, AutoGen
 * conversation logs, Playwright JSON reports, …) — can be converted into.
 * Every external adapter MUST produce these records; no adapter may invent
 * a bespoke result shape or fabricate a "pass".
 *
 * Honesty rules enforced at conversion time:
 *  - a `verifiedPass` of true is ONLY permitted when the source trace
 *    contains a terminal success signal AND at least one named assertion;
 *  - token counts are classified MEASURED / ESTIMATED / UNKNOWN and never
 *    silently mixed;
 *  - a missing source yields status UNAVAILABLE (never a fabricated result);
 *  - `resultId` is a genuine SHA-256 over the canonical content, so two
 *    identical runs are byte-identical and a tampered one is detectable.
 */

import { sha256Hex } from '../crypto/sha256';

export const UNIVERSAL_BENCHMARK_SCHEMA = 'aether.universal-benchmark/v1';

export type UniversalEvidenceStatus =
  | 'MEASURED' // a real execution whose terminal state was observed and verified
  | 'ESTIMATED' // analytically derived from a real source; explicitly labeled
  | 'UNAVAILABLE' // source/daemon/credentials absent — nothing to convert
  | 'NOT_APPLICABLE' // the harness covers none of this task's domains
  | 'INCONCLUSIVE'; // executed but the terminal state or assertions could not be verified

export type TokenClass = 'MEASURED' | 'ESTIMATED' | 'UNKNOWN';

export interface UniversalTaskRef {
  taskId: string;
  title: string;
  domain: string;
}

export interface UniversalHarnessRef {
  adapterId: string;
  harnessName: string;
  version?: string;
  upstreamUrl?: string;
}

export type CostClass = 'MEASURED' | 'ESTIMATED' | 'UNKNOWN';

export interface UniversalMetrics {
  /** Observed wall-clock of the task. Null when unknown. */
  wallClockMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  /** How the token counts were obtained — never silently mixed. */
  tokenClass: TokenClass;
  /** Count of tool/exec actions recorded, when the source records them. */
  toolCalls: number | null;
  /** Provider-reported task cost in USD, when the source records it. */
  costUsd: number | null;
  /** How the cost was obtained — never silently mixed. */
  costClass: CostClass;
}

export interface UniversalVerification {
  /** The concrete method used to verify the result (test runner, assertion set, …). */
  method: string;
  assertionsRun: number | null;
}

export interface UniversalBenchmarkResult {
  schema: typeof UNIVERSAL_BENCHMARK_SCHEMA;
  /** Genuine SHA-256 over the canonical content (set by `finalizeUniversalResult`). */
  resultId: string;
  taskRef: UniversalTaskRef;
  harnessRef: UniversalHarnessRef;
  status: UniversalEvidenceStatus;
  /** Only true when the source trace contains terminal success + a named assertion. */
  verifiedPass: boolean | null;
  metrics: UniversalMetrics;
  /** Human-readable provenance: which file/daemon produced this, and how to re-run it. */
  evidence: string;
  verification: UniversalVerification;
  /** The external command that would measure this cell, when status is UNAVAILABLE/NOT_APPLICABLE. */
  externalCommandToReproduce?: string;
  recordedAtIso: string;
  adapterId: string;
}

const EMPTY_METRICS: UniversalMetrics = {
  wallClockMs: null,
  promptTokens: null,
  completionTokens: null,
  totalTokens: null,
  tokenClass: 'UNKNOWN',
  toolCalls: null,
  costUsd: null,
  costClass: 'UNKNOWN',
};

export interface UniversalResultInput {
  taskRef: UniversalTaskRef;
  harnessRef: UniversalHarnessRef;
  status: UniversalEvidenceStatus;
  metrics?: Partial<UniversalMetrics>;
  evidence: string;
  verification?: Partial<UniversalVerification>;
  externalCommandToReproduce?: string;
  verifiedPass?: boolean | null;
  recordedAtIso?: string;
}

export interface ConversionError {
  kind: 'FABRICATION_ATTEMPT' | 'MALFORMED_SOURCE' | 'MISSING_REQUIRED';
  detail: string;
}

/**
 * Convert a validated input into a finalized UniversalBenchmarkResult with a
 * genuine SHA-256 content hash. Refuses to finalize a record that claims a
 * `verifiedPass: true` without BOTH a terminal-success evidence note and a
 * named assertion — the single most important anti-fabrication rule.
 */
export function finalizeUniversalResult(input: UniversalResultInput): UniversalBenchmarkResult | { error: ConversionError } {
  if (input.verifiedPass === true) {
    const hasAssertions =
      (input.verification?.assertionsRun ?? null) !== null && (input.verification?.assertionsRun ?? 0) > 0;
    const hasSuccessEvidence = /passed|succeeded|success/i.test(input.evidence) || /pass/i.test(input.verification?.method ?? '');
    if (!hasAssertions || !hasSuccessEvidence) {
      return {
        error: {
          kind: 'FABRICATION_ATTEMPT',
          detail:
            'verifiedPass=true requires a terminal-success evidence note AND assertionsRun > 0; refusing to finalize an unverified pass',
        },
      };
    }
  }
  if (input.status === 'UNAVAILABLE' && input.verifiedPass === true) {
    return { error: { kind: 'FABRICATION_ATTEMPT', detail: 'an UNAVAILABLE result cannot claim a verified pass' } };
  }

  const metrics: UniversalMetrics = { ...EMPTY_METRICS, ...(input.metrics ?? {}) };
  // Cross-class consistency: if any token count is present, tokenClass must not be UNKNOWN.
  if ((metrics.promptTokens != null || metrics.completionTokens != null) && metrics.tokenClass === 'UNKNOWN') {
    return {
      error: {
        kind: 'MALFORMED_SOURCE',
        detail: 'token counts present but tokenClass is UNKNOWN — classify as MEASURED or ESTIMATED explicitly',
      },
    };
  }
  if (metrics.totalTokens == null && (metrics.promptTokens != null || metrics.completionTokens != null)) {
    metrics.totalTokens = (metrics.promptTokens ?? 0) + (metrics.completionTokens ?? 0);
  }

  const body: Omit<UniversalBenchmarkResult, 'resultId'> = {
    schema: UNIVERSAL_BENCHMARK_SCHEMA,
    taskRef: input.taskRef,
    harnessRef: input.harnessRef,
    status: input.status,
    verifiedPass: input.status === 'UNAVAILABLE' || input.status === 'NOT_APPLICABLE' ? null : input.verifiedPass ?? null,
    metrics,
    evidence: input.evidence,
    verification: { method: input.verification?.method ?? 'n/a', assertionsRun: input.verification?.assertionsRun ?? null },
    ...(input.externalCommandToReproduce ? { externalCommandToReproduce: input.externalCommandToReproduce } : {}),
    recordedAtIso: input.recordedAtIso ?? new Date().toISOString(),
    adapterId: input.harnessRef.adapterId,
  };

  // Deterministic content hash: canonical JSON (sorted, no volatile fields).
  const canonical: Omit<UniversalBenchmarkResult, 'resultId'> = { ...body };
  delete (canonical as { recordedAtIso?: string }).recordedAtIso; // timestamp is not content
  const resultId = sha256Hex(canonicalJson(canonical));
  return { ...canonical, resultId, recordedAtIso: body.recordedAtIso };
}

/** Stable-stringify with sorted keys — the canonical form for hashing. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
}
