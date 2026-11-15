/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — BENCHMARK GENERATOR TESTS
 * (src/core/benchmarks/benchmark.test.ts)
 *
 * Exercises each benchmark generator and the suite runner,
 * asserting that every domain produces a complete, measurable result.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateCofiBenchmark,
  generateEcommerceBenchmark,
  generateSaasBenchmark,
  runBenchmarkSuite,
} from './benchmarkRunner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertValidResult(result: ReturnType<typeof generateCofiBenchmark extends Promise<infer R> ? () => R : never>) {
  // Type-safe via assignment
  const r = result as any;
  assert.ok(r, 'result should be defined');
  assert.ok(r.domain, 'domain should be set');
  assert.ok(r.productSpec, 'productSpec should be set');
  assert.ok(r.plan, 'plan should be set');
  assert.ok(r.execution, 'execution should be set');
  assert.ok(r.validation, 'validation should be set');
  assert.ok(r.metrics, 'metrics should be set');
  assert.ok(Array.isArray(r.artifacts), 'artifacts should be an array');
  assert.ok(r.duration > 0, 'duration should be positive');
}

function assertMetrics(metrics: any) {
  assert.ok(typeof metrics.featuresGenerated === 'number', 'featuresGenerated should be a number');
  assert.ok(typeof metrics.featuresExpected === 'number', 'featuresExpected should be a number');
  assert.ok(typeof metrics.completeness === 'number', 'completeness should be a number');
  assert.ok(typeof metrics.testCoverage === 'number', 'testCoverage should be a number');
  assert.ok(typeof metrics.securityScore === 'number', 'securityScore should be a number');
  assert.ok(typeof metrics.performanceScore === 'number', 'performanceScore should be a number');
  assert.ok(typeof metrics.accessibilityScore === 'number', 'accessibilityScore should be a number');
  assert.ok(typeof metrics.linesOfCode === 'number', 'linesOfCode should be a number');
  assert.ok(typeof metrics.filesGenerated === 'number', 'filesGenerated should be a number');
}

function assertArtifacts(artifacts: any[]) {
  assert.ok(artifacts.length >= 5, `should generate at least 5 artifacts (got ${artifacts.length})`);
  const types = new Set(artifacts.map((a: any) => a.type));
  assert.ok(types.has('source'), 'should generate source files');
  assert.ok(types.has('deployment'), 'should generate deployment files');
  assert.ok(types.has('config'), 'should generate config files');
}

function assertValidation(validation: any) {
  assert.ok(typeof validation.passed === 'boolean', 'validation.passed should be boolean');
  assert.ok(Array.isArray(validation.checks), 'validation.checks should be an array');
  assert.ok(validation.checks.length > 0, 'validation.checks should not be empty');
  assert.ok(typeof validation.completeness === 'number', 'completeness should be a number');
  assert.ok(typeof validation.securityScore === 'number', 'securityScore should be a number');
  assert.ok(Array.isArray(validation.issues), 'validation.issues should be an array');
}

// ---------------------------------------------------------------------------
// Cofi
// ---------------------------------------------------------------------------

test('COFI: generator produces a complete benchmark result', async () => {
  const result = await generateCofiBenchmark();
  assert.strictEqual(result.domain, 'coffee_shop');
  assertValidResult(result);
  assertMetrics(result.metrics);
  assertArtifacts(result.artifacts);
  assertValidation(result.validation);
});

test('COFI: uses Intent Expansion Engine', async () => {
  const result = await generateCofiBenchmark();
  assert.ok(result.productSpec.intent, 'productSpec.intent should be set');
  assert.ok(result.productSpec.productType === 'coffee_shop', 'productType should be coffee_shop');
  assert.ok(result.productSpec.confidence > 0, 'confidence should be positive');
  assert.ok(result.productSpec.domains.includes('coffee_shop'), 'domains should include coffee_shop');
});

test('COFI: uses Domain Intelligence Engine (domain pack)', async () => {
  const result = await generateCofiBenchmark();
  assert.ok(result.productSpec.featureRequirements.length > 0, 'should have feature requirements');
  assert.ok(result.productSpec.securityRequirements.length > 0, 'should have security requirements');
  assert.ok(result.productSpec.testingRequirements.length > 0, 'should have testing requirements');
  assert.ok(result.productSpec.deploymentRequirements.length > 0, 'should have deployment requirements');
});

test('COFI: uses P20 Execution Planner', async () => {
  const result = await generateCofiBenchmark();
  assert.ok(result.plan, 'plan should be set');
  assert.ok(result.plan.task, 'plan.task should be set');
  assert.ok(result.plan.mode, 'plan.mode should be set');
  assert.ok(Array.isArray(result.plan.team) || Array.isArray(result.plan.waves), 'plan should have team or waves');
});

test('COFI: uses Workflow Engine', async () => {
  const result = await generateCofiBenchmark();
  assert.ok(result.execution, 'execution should be set');
  assert.strictEqual(result.execution.status, 'completed');
  assert.ok(result.execution.completedSteps.length > 0, 'should have completed steps');
});

test('COFI: generates tests', async () => {
  const result = await generateCofiBenchmark();
  const testArtifacts = result.artifacts.filter((a) => a.type === 'test');
  assert.ok(testArtifacts.length > 0, 'should generate test artifacts');
  assert.ok(testArtifacts[0].content.includes('describe'), 'tests should use describe blocks');
});

test('COFI: generates deployment config', async () => {
  const result = await generateCofiBenchmark();
  const deployArtifacts = result.artifacts.filter((a) => a.type === 'deployment');
  assert.ok(deployArtifacts.length >= 2, 'should generate Dockerfile + docker-compose');
  assert.ok(deployArtifacts.some((a) => a.path.includes('Dockerfile')), 'should include Dockerfile');
  assert.ok(deployArtifacts.some((a) => a.path.includes('docker-compose')), 'should include docker-compose');
});

test('COFI: produces measurable metrics', async () => {
  const result = await generateCofiBenchmark();
  assert.ok(result.metrics.featuresGenerated >= 10, `should generate >= 10 features (got ${result.metrics.featuresGenerated})`);
  assert.ok(result.metrics.filesGenerated >= 5, `should generate >= 5 files (got ${result.metrics.filesGenerated})`);
  assert.ok(result.metrics.linesOfCode > 0, 'should have lines of code');
  assert.ok(result.metrics.completeness >= 0.5, `completeness should be >= 0.5 (got ${result.metrics.completeness})`);
  assert.ok(result.metrics.testCoverage > 0, 'testCoverage should be positive');
  assert.ok(result.metrics.securityScore > 0, 'securityScore should be positive');
});

// ---------------------------------------------------------------------------
// E-commerce
// ---------------------------------------------------------------------------

test('E-COMMERCE: generator produces a complete benchmark result', async () => {
  const result = await generateEcommerceBenchmark();
  assert.strictEqual(result.domain, 'ecommerce');
  assertValidResult(result);
  assertMetrics(result.metrics);
  assertArtifacts(result.artifacts);
  assertValidation(result.validation);
});

test('E-COMMERCE: uses Intent Expansion Engine', async () => {
  const result = await generateEcommerceBenchmark();
  assert.ok(result.productSpec.productType === 'ecommerce', 'productType should be ecommerce');
  assert.ok(result.productSpec.domains.includes('ecommerce'), 'domains should include ecommerce');
});

test('E-COMMERCE: generates all domain pack features', async () => {
  const result = await generateEcommerceBenchmark();
  assert.ok(result.productSpec.featureRequirements.length > 0, 'should have feature requirements');
  assert.ok(result.productSpec.securityRequirements.length > 0, 'should have security requirements');
  assert.ok(result.productSpec.testingRequirements.length > 0, 'should have testing requirements');
});

test('E-COMMERCE: generates tests', async () => {
  const result = await generateEcommerceBenchmark();
  const testArtifacts = result.artifacts.filter((a) => a.type === 'test');
  assert.ok(testArtifacts.length > 0, 'should generate test artifacts');
});

test('E-COMMERCE: generates deployment config', async () => {
  const result = await generateEcommerceBenchmark();
  const deployArtifacts = result.artifacts.filter((a) => a.type === 'deployment');
  assert.ok(deployArtifacts.length >= 2, 'should generate Dockerfile + docker-compose');
});

test('E-COMMERCE: produces measurable metrics', async () => {
  const result = await generateEcommerceBenchmark();
  assert.ok(result.metrics.featuresGenerated >= 10, `should generate >= 10 features (got ${result.metrics.featuresGenerated})`);
  assert.ok(result.metrics.filesGenerated >= 5, `should generate >= 5 files (got ${result.metrics.filesGenerated})`);
  assert.ok(result.metrics.linesOfCode > 0, 'should have lines of code');
});

// ---------------------------------------------------------------------------
// SaaS
// ---------------------------------------------------------------------------

test('SAAS: generator produces a complete benchmark result', async () => {
  const result = await generateSaasBenchmark();
  assert.strictEqual(result.domain, 'saas');
  assertValidResult(result);
  assertMetrics(result.metrics);
  assertArtifacts(result.artifacts);
  assertValidation(result.validation);
});

test('SAAS: uses Intent Expansion Engine', async () => {
  const result = await generateSaasBenchmark();
  assert.ok(result.productSpec.productType === 'saas', 'productType should be saas');
  assert.ok(result.productSpec.domains.includes('saas'), 'domains should include saas');
});

test('SAAS: generates multi-tenant features', async () => {
  const result = await generateSaasBenchmark();
  assert.ok(result.productSpec.featureRequirements.length > 0, 'should have feature requirements');
  assert.ok(result.productSpec.securityRequirements.length > 0, 'should have security requirements');
});

test('SAAS: generates realtime server', async () => {
  const result = await generateSaasBenchmark();
  const realtimeArtifact = result.artifacts.find((a) => a.path.includes('realtime'));
  assert.ok(realtimeArtifact, 'should generate realtime server');
  assert.ok(realtimeArtifact.content.includes('WebSocket'), 'realtime should use WebSocket');
});

test('SAAS: generates tests', async () => {
  const result = await generateSaasBenchmark();
  const testArtifacts = result.artifacts.filter((a) => a.type === 'test');
  assert.ok(testArtifacts.length > 0, 'should generate test artifacts');
});

test('SAAS: generates deployment config', async () => {
  const result = await generateSaasBenchmark();
  const deployArtifacts = result.artifacts.filter((a) => a.type === 'deployment');
  assert.ok(deployArtifacts.length >= 2, 'should generate Dockerfile + docker-compose');
});

test('SAAS: produces measurable metrics', async () => {
  const result = await generateSaasBenchmark();
  assert.ok(result.metrics.featuresGenerated >= 10, `should generate >= 10 features (got ${result.metrics.featuresGenerated})`);
  assert.ok(result.metrics.filesGenerated >= 5, `should generate >= 5 files (got ${result.metrics.filesGenerated})`);
  assert.ok(result.metrics.linesOfCode > 0, 'should have lines of code');
});

// ---------------------------------------------------------------------------
// Options / customization
// ---------------------------------------------------------------------------

test('COFI: custom prompt influences intent', async () => {
  const result = await generateCofiBenchmark({ prompt: 'Build a specialty coffee shop with subscription boxes and loyalty' });
  assert.strictEqual(result.domain, 'coffee_shop');
  assert.ok(result.productSpec.confidence > 0, 'confidence should be positive');
});

test('COFI: generateTests=false skips test files', async () => {
  const result = await generateCofiBenchmark({ generateTests: false });
  const testArtifacts = result.artifacts.filter((a) => a.type === 'test');
  assert.strictEqual(testArtifacts.length, 0, 'should not generate test files when disabled');
});

test('COFI: generateDeployment=false skips deployment files', async () => {
  const result = await generateCofiBenchmark({ generateDeployment: false });
  const deployArtifacts = result.artifacts.filter((a) => a.type === 'deployment');
  assert.strictEqual(deployArtifacts.length, 0, 'should not generate deployment files when disabled');
});

// ---------------------------------------------------------------------------
// Suite runner
// ---------------------------------------------------------------------------

test('SUITE: runs all domains by default', async () => {
  const suite = await runBenchmarkSuite();
  assert.strictEqual(suite.results.length, 3, 'should run all 3 domains');
  assert.strictEqual(suite.summary.totalDomains, 3);
  assert.ok(suite.timestamp.length > 0, 'should have timestamp');
  assert.ok(suite.summary.totalDuration > 0, 'totalDuration should be positive');
  assert.ok(suite.summary.avgFeaturesGenerated > 0, 'avgFeaturesGenerated should be positive');
  assert.ok(suite.summary.totalFilesGenerated >= 15, `totalFilesGenerated should be >= 15 (got ${suite.summary.totalFilesGenerated})`);
});

test('SUITE: runs selected domains', async () => {
  const suite = await runBenchmarkSuite({ domains: ['coffee_shop', 'saas'] });
  assert.strictEqual(suite.results.length, 2);
  const domainNames = suite.results.map((r) => r.domain);
  assert.ok(domainNames.includes('coffee_shop'));
  assert.ok(domainNames.includes('saas'));
  assert.ok(!domainNames.includes('ecommerce'));
});

test('SUITE: metrics are comparable across domains', async () => {
  const suite = await runBenchmarkSuite();
  for (const result of suite.results) {
    assert.ok(result.metrics.featuresGenerated >= 10, `${result.domain}: featuresGenerated should be >= 10`);
    assert.ok(result.metrics.filesGenerated >= 5, `${result.domain}: filesGenerated should be >= 5`);
    assert.ok(result.metrics.completeness > 0, `${result.domain}: completeness should be positive`);
    assert.ok(result.metrics.testCoverage > 0, `${result.domain}: testCoverage should be positive`);
    assert.ok(result.metrics.securityScore > 0, `${result.domain}: securityScore should be positive`);
  }
});

test('SUITE: summary aggregates correctly', async () => {
  const suite = await runBenchmarkSuite();
  const totalFeatures = suite.results.reduce((s, r) => s + r.metrics.featuresGenerated, 0);
  assert.strictEqual(suite.summary.avgFeaturesGenerated, Number((totalFeatures / suite.results.length).toFixed(1)));

  const totalLoc = suite.results.reduce((s, r) => s + r.metrics.linesOfCode, 0);
  assert.strictEqual(suite.summary.totalLinesOfCode, totalLoc);
});

test('SUITE: invalid domain throws', async () => {
  await assert.rejects(
    () => runBenchmarkSuite({ domains: ['nonexistent' as any] }),
    /Unknown benchmark domain/,
    'should throw for unknown domain'
  );
});
