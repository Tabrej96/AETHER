/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — UNIVERSAL BENCHMARK ADAPTER ENGINE
 * (src/core/benchmarks/adapterEngine.ts)
 *
 * The contract that every external-ecosystem benchmark adapter implements,
 * plus the registry that holds them and the status-matrix builder that turns a
 * (task, {adapterId -> optional trace}) table into an honest, per-cell
 * status report.
 *
 * Honesty rules:
 *  - an adapter only ever reports what its source trace actually contains;
 *  - a missing trace yields status UNAVAILABLE (never a fabricated MEASURED);
 *  - `verifiedPass: true` requires a terminal-success signal AND a named
 *    assertion, enforced by finalizeUniversalResult;
 *  - the status matrix is derived data — recomputable from the traces — not
 *    a hand-maintained claim.
 */

import {
  UNIVERSAL_BENCHMARK_SCHEMA,
  type UniversalBenchmarkResult,
  type UniversalTaskRef,
  type ConversionError,
  finalizeUniversalResult,
  type UniversalResultInput,
} from './universalFormat';

// Re-exported so adapter consumers can name the error type without a second
// import path into universalFormat.
export type { ConversionError };

/** A captured source trace from an external tool, as text. */
export interface ExternalTrace {
  sourceText: string;
  /** Provenance label: which tool + version produced this text. */
  source: string;
}

export interface AdapterConvertOptions {
  harnessVersion?: string;
  /** The external command that would re-measure this cell if the trace were absent. */
  externalCommandToReproduce?: string;
  recordedAtIso?: string;
}

/**
 * The universal adapter contract. An adapter knows how to (a) detect whether
 * a given text is its format, (b) convert a detected trace into a universal
 * result, and (c) report the honest UNAVAILABLE cell when no trace is present.
 */
export interface BenchmarkAdapterSpec {
  adapterId: string;
  harnessName: string;
  upstreamUrl?: string;
  /** A one-line description of what this adapter converts. */
  description: string;
  /** True when `text` looks like this adapter's source format. */
  detect: (text: string) => boolean;
  /** Convert a detected trace. Returns the finalized result or a ConversionError. */
  convert: (
    trace: ExternalTrace,
    taskRef: UniversalTaskRef,
    opts: AdapterConvertOptions
  ) => UniversalBenchmarkResult | { error: ConversionError };
  /**
   * Build the universal input for a trace (adapters share the finalize step).
   * Returns the input OR a ConversionError when the source is malformed /
   * missing required fields — never silently coerces.
   */
  toInput: (
    trace: ExternalTrace,
    taskRef: UniversalTaskRef,
    opts: AdapterConvertOptions
  ) => UniversalResultInput | { error: ConversionError };
  /** The honest UNAVAILABLE cell for this adapter, with its re-measure command. */
  unavailable: (taskRef: UniversalTaskRef, opts: AdapterConvertOptions) => UniversalBenchmarkResult;
}

export class BenchmarkAdapterRegistry {
  private readonly adapters = new Map<string, BenchmarkAdapterSpec>();

  register(spec: BenchmarkAdapterSpec): this {
    if (this.adapters.has(spec.adapterId)) {
      throw new Error(`adapter ${spec.adapterId} is already registered`);
    }
    this.adapters.set(spec.adapterId, spec);
    return this;
  }

  get(adapterId: string): BenchmarkAdapterSpec | undefined {
    return this.adapters.get(adapterId);
  }

  list(): BenchmarkAdapterSpec[] {
    return [...this.adapters.values()];
  }

  get size(): number {
    return this.adapters.size;
  }

  /** First adapter whose detector recognizes `text`, or undefined. */
  detectAdapter(text: string): BenchmarkAdapterSpec | undefined {
    for (const spec of this.adapters.values()) {
      if (spec.detect(text)) return spec;
    }
    return undefined;
  }
}

export interface StatusMatrixCell {
  adapterId: string;
  harnessName: string;
  status: UniversalBenchmarkResult['status'];
  verifiedPass: boolean | null;
  externalCommandToReproduce?: string;
  detail: string;
}

export interface StatusMatrix {
  taskRef: UniversalTaskRef;
  schema: typeof UNIVERSAL_BENCHMARK_SCHEMA;
  cells: StatusMatrixCell[];
  measured: number;
  unavailable: number;
  notApplicable: number;
  inconclusive: number;
  estimated: number;
}

/**
 * Build the honest status matrix. For each registered adapter, if a trace is
 * supplied and recognizes, use the converted result; otherwise use the
 * adapter's own UNAVAILABLE cell. No cell is fabricated.
 */
export function buildStatusMatrix(
  registry: BenchmarkAdapterRegistry,
  taskRef: UniversalTaskRef,
  traces: Record<string, ExternalTrace | undefined>,
  opts: AdapterConvertOptions = {}
): StatusMatrix {
  const cells: StatusMatrixCell[] = [];
  let measured = 0;
  let unavailable = 0;
  let notApplicable = 0;
  let inconclusive = 0;
  let estimated = 0;

  for (const spec of registry.list()) {
    const trace = traces[spec.adapterId];
    let cell: StatusMatrixCell;
    if (trace) {
      if (spec.detect(trace.sourceText)) {
        const conv = spec.convert(trace, taskRef, opts);
        if ('error' in conv) {
          // Unparseable source: honestly INCONCLUSIVE, not a pass.
          cell = {
            adapterId: spec.adapterId,
            harnessName: spec.harnessName,
            status: 'INCONCLUSIVE',
            verifiedPass: null,
            detail: `trace present but not convertible: ${conv.error.detail}`,
            externalCommandToReproduce: opts.externalCommandToReproduce,
          };
          inconclusive++;
        } else {
          const status = conv.status;
          if (status === 'MEASURED') measured++;
          else if (status === 'ESTIMATED') estimated++;
          else if (status === 'UNAVAILABLE') unavailable++;
          else if (status === 'NOT_APPLICABLE') notApplicable++;
          else inconclusive++;
          cell = {
            adapterId: spec.adapterId,
            harnessName: spec.harnessName,
            status,
            verifiedPass: conv.verifiedPass,
            detail: conv.evidence,
            externalCommandToReproduce: conv.externalCommandToReproduce,
          };
        }
      } else {
        // A trace was supplied for this adapter but its detector does not
        // recognize it: that is NOT "unavailable", it is "inconclusive" —
        // the source is present, just not in a form this adapter can
        // honestly convert.
        cell = {
          adapterId: spec.adapterId,
          harnessName: spec.harnessName,
          status: 'INCONCLUSIVE',
          verifiedPass: null,
          detail: `a trace was supplied for ${spec.adapterId} but its format was not recognized; refusing to convert blindly`,
          externalCommandToReproduce: opts.externalCommandToReproduce,
        };
        inconclusive++;
      }
    } else {
      const unavail = spec.unavailable(taskRef, opts);
      unavailable++;
      cell = {
        adapterId: spec.adapterId,
        harnessName: spec.harnessName,
        status: unavail.status,
        verifiedPass: unavail.verifiedPass,
        detail: unavail.evidence,
        externalCommandToReproduce: unavail.externalCommandToReproduce,
      };
    }
    cells.push(cell);
  }

  return { taskRef, schema: UNIVERSAL_BENCHMARK_SCHEMA, cells, measured, unavailable, notApplicable, inconclusive, estimated };
}

/** Shared helper so adapters don't each re-implement the finalize glue. */
export function finalizeFromInput(input: UniversalResultInput): UniversalBenchmarkResult | { error: ConversionError } {
  return finalizeUniversalResult(input);
}
