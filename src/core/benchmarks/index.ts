/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — BENCHMARK PUBLIC API
 * (src/core/benchmarks/index.ts)
 *
 * Re-exports all benchmark generators and supporting types.
 *
 * Usage:
 *   import { generateCofiBenchmark, generateEcommerceBenchmark, generateSaasBenchmark, runBenchmarkSuite } from './benchmarks';
 */

// Generators
export { generateCofiBenchmark, type CofiBenchmarkOptions } from './cofiGenerator';
export { generateEcommerceBenchmark, type EcommerceBenchmarkOptions } from './ecommerceGenerator';
export { generateSaasBenchmark, type SaasBenchmarkOptions } from './saasGenerator';

// Runner + types
export {
  type BenchmarkResult,
  type BenchmarkMetrics,
  type BenchmarkRunOptions,
  type BenchmarkSuiteResult,
  type Artifact,
  type ValidationReport,
  type BenchmarkDomain,
  runBenchmarkSuite,
} from './benchmarkRunner';
