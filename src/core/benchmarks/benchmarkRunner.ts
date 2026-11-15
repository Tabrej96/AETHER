/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — BENCHMARK RUNNER TYPES
 * (src/core/benchmarks/benchmarkRunner.ts)
 *
 * Shared interfaces for all AETHER benchmark generators.
 * Every benchmark produces the same metrics shape so results are comparable.
 */

import type { ProductSpec } from '../intel/intentExpansion';
import type { ExecutionPlan } from '../orchestration/executionPlanner';
import type { WorkflowExecution } from '../workflow/workflowEngine';

import { generateCofiBenchmark } from './cofiGenerator';
import { generateEcommerceBenchmark } from './ecommerceGenerator';
import { generateSaasBenchmark } from './saasGenerator';

// Re-export generators so tests and external callers import from a single path
export { generateCofiBenchmark, generateEcommerceBenchmark, generateSaasBenchmark };

// ---------------------------------------------------------------------------
// Artifact
// ---------------------------------------------------------------------------

export interface Artifact {
  path: string;
  content: string;
  type: 'source' | 'test' | 'config' | 'deployment' | 'documentation';
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationReport {
  passed: boolean;
  checks: Array<{ name: string; passed: boolean }>;
  completeness: number;
  securityScore: number;
  issues: string[];
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface BenchmarkMetrics {
  featuresGenerated: number;
  featuresExpected: number;
  completeness: number;
  testCoverage: number;
  securityScore: number;
  performanceScore: number;
  accessibilityScore: number;
  linesOfCode: number;
  filesGenerated: number;
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export interface BenchmarkResult {
  domain: string;
  productSpec: ProductSpec;
  plan: ExecutionPlan;
  execution: WorkflowExecution;
  validation: ValidationReport;
  metrics: BenchmarkMetrics;
  artifacts: Artifact[];
  duration: number;
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export type BenchmarkDomain = 'coffee_shop' | 'ecommerce' | 'saas';

export interface BenchmarkRunOptions {
  /** Which domains to benchmark (default: all three) */
  domains?: BenchmarkDomain[];
  /** Whether to generate Docker/deployment configs */
  generateDeployment?: boolean;
  /** Whether to generate test files */
  generateTests?: boolean;
  /** Output directory root for artifacts (optional) */
  outputDir?: string;
}

export interface BenchmarkSuiteResult {
  results: BenchmarkResult[];
  summary: {
    totalDomains: number;
    totalDuration: number;
    avgFeaturesGenerated: number;
    avgCompleteness: number;
    avgTestCoverage: number;
    avgSecurityScore: number;
    avgAccessibilityScore: number;
    totalFilesGenerated: number;
    totalLinesOfCode: number;
  };
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Suite runner
// ---------------------------------------------------------------------------

const GENERATORS: Record<BenchmarkDomain, (opts: BenchmarkRunOptions) => Promise<BenchmarkResult>> = {
  coffee_shop: (opts) => generateCofiBenchmark(opts),
  ecommerce: (opts) => generateEcommerceBenchmark(opts),
  saas: (opts) => generateSaasBenchmark(opts),
};

export async function runBenchmarkSuite(options: BenchmarkRunOptions = {}): Promise<BenchmarkSuiteResult> {
  const domains = options.domains ?? ['coffee_shop', 'ecommerce', 'saas'];
  const startTime = Date.now();

  const results: BenchmarkResult[] = [];
  for (const domain of domains) {
    const generator = GENERATORS[domain];
    if (!generator) {
      throw new Error(`Unknown benchmark domain: "${domain}". Available: ${Object.keys(GENERATORS).join(', ')}`);
    }
    const result = await generator({
      generateDeployment: options.generateDeployment,
      generateTests: options.generateTests,
      outputDir: options.outputDir ? `${options.outputDir}/${domain}` : undefined,
    });
    results.push(result);
  }

  const totalDuration = Date.now() - startTime;
  const n = results.length || 1;

  return {
    results,
    summary: {
      totalDomains: results.length,
      totalDuration,
      avgFeaturesGenerated: Number((results.reduce((s, r) => s + r.metrics.featuresGenerated, 0) / n).toFixed(1)),
      avgCompleteness: Number((results.reduce((s, r) => s + r.metrics.completeness, 0) / n).toFixed(3)),
      avgTestCoverage: Number((results.reduce((s, r) => s + r.metrics.testCoverage, 0) / n).toFixed(3)),
      avgSecurityScore: Number((results.reduce((s, r) => s + r.metrics.securityScore, 0) / n).toFixed(3)),
      avgAccessibilityScore: Number((results.reduce((s, r) => s + r.metrics.accessibilityScore, 0) / n).toFixed(3)),
      totalFilesGenerated: results.reduce((s, r) => s + r.metrics.filesGenerated, 0),
      totalLinesOfCode: results.reduce((s, r) => s + r.metrics.linesOfCode, 0),
    },
    timestamp: new Date().toISOString(),
  };
}
