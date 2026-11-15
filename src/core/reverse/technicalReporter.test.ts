/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — TECHNICAL REPORTER TESTS  ·  AETHER Reverse Intelligence
 * (src/core/reverse/technicalReporter.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AnalysisCategory,
  PermissionGuard,
  ReverseEngineAuthorization,
  VulnerabilityFlag,
} from './permissionGuard';
import { TechnicalReporter } from './technicalReporter';

function makeAuth(): ReverseEngineAuthorization {
  return { targetId: 'my-app', basis: 'OWNED', authorized: true, evidence: 'Owned.' };
}

const sampleData = {
  summary: 'A web application with a layered architecture.',
  filesAnalyzed: 10,
  modules: ['src/index.ts', 'src/app.ts', 'src/server.ts', 'src/db.ts', 'src/utils/helpers.ts'],
  dependencies: [
    { source: 'src/app.ts', target: 'src/server.ts', type: 'INTERNAL' },
    { source: 'src/server.ts', target: 'src/db.ts', type: 'INTERNAL' },
    { source: 'src/app.ts', target: 'express', type: 'EXTERNAL' },
    { source: 'src/server.ts', target: 'pg', type: 'EXTERNAL' },
  ],
  layers: [
    { name: 'interface', files: ['src/server.ts'] },
    { name: 'data', files: ['src/db.ts'] },
    { name: 'utility', files: ['src/utils/helpers.ts'] },
  ],
  patterns: [
    { pattern: 'SERVICE_LAYER', confidence: 'HIGH', files: ['src/server.ts'] },
  ],
  complexity: {
    avgComplexity: 2.5,
    maxComplexity: 5,
    totalLines: 350,
  },
};

// ─── Report Generation ────────────────────────────────────────────────────────

test('generateReport: produces complete report', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const report = reporter.generateReport(makeAuth(), 'my-app', sampleData);
  assert.strictEqual(report.title, 'Technical Analysis Report — my-app');
  assert.strictEqual(report.targetId, 'my-app');
  assert.ok(report.sections.length > 0);
  assert.ok(report.diagrams.length > 0);
});

test('generateReport: includes authorization', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const report = reporter.generateReport(makeAuth(), 'my-app', sampleData);
  assert.strictEqual(report.authorization.targetId, 'my-app');
  assert.strictEqual(report.authorization.basis, 'OWNED');
});

test('generateReport: throws on denied auth', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(() => reporter.generateReport(auth, 'other', sampleData), /PermissionGuard denied/);
});

test('generateReport: sections include all required headings', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const report = reporter.generateReport(makeAuth(), 'my-app', sampleData);
  const headings = report.sections.map((s) => s.heading);
  assert.ok(headings.includes('Executive Summary'));
  assert.ok(headings.includes('Scope'));
  assert.ok(headings.includes('Architecture Layers'));
  assert.ok(headings.includes('Module Inventory'));
  assert.ok(headings.includes('Complexity Metrics'));
});

// ─── Vulnerability Detection ──────────────────────────────────────────────────

test('detectVulnerabilities: detects high fan-in as vulnerability', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const data = {
    ...sampleData,
    dependencies: Array.from({ length: 6 }, (_, i) => ({
      source: `module-${i}.ts`,
      target: 'core.ts',
      type: 'INTERNAL' as const,
    })),
    layers: sampleData.layers,
  };
  const report = reporter.generateReport(makeAuth(), 'my-app', data);
  const archVulns = report.vulnerabilities.filter((v) => v.category === 'ARCHITECTURAL');
  assert.ok(archVulns.length >= 1, 'should detect high fan-in vulnerability');
  assert.strictEqual(archVulns[0].severity, 'MEDIUM');
});

test('detectVulnerabilities: warns on insufficient test coverage', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const data = {
    ...sampleData,
    dependencies: sampleData.dependencies,
    layers: [
      { name: 'test', files: ['src/one.test.ts'] },
      { name: 'entry', files: ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'] },
    ],
  };
  const report = reporter.generateReport(makeAuth(), 'my-app', data);
  const testVulns = report.vulnerabilities.filter((v) => v.category === 'TEST_COVERAGE');
  assert.ok(testVulns.length >= 1, 'should warn about test coverage');
});

test('detectVulnerabilities: warns on missing security layer', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const data = {
    ...sampleData,
    dependencies: sampleData.dependencies,
    layers: [
      { name: 'entry', files: ['src/a.ts'] },
      { name: 'domain', files: ['src/b.ts'] },
    ],
  };
  const report = reporter.generateReport(makeAuth(), 'my-app', data);
  const secVulns = report.vulnerabilities.filter((v) => v.category === 'SECURITY');
  assert.ok(secVulns.length >= 1, 'should warn about missing security layer');
});

test('detectVulnerabilities: no false positives for healthy architecture', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const data = {
    ...sampleData,
    dependencies: [
      { source: 'src/controllers.ts', target: 'src/services.ts', type: 'INTERNAL' },
      { source: 'src/services.ts', target: 'src/repos.ts', type: 'INTERNAL' },
    ],
    layers: [
      { name: 'interface', files: ['src/controllers.ts'] },
      { name: 'domain', files: ['src/services.ts'] },
      { name: 'data', files: ['src/repos.ts'] },
      { name: 'test', files: ['src/controllers.test.ts', 'src/services.test.ts'] },
    ],
  };
  const report = reporter.generateReport(makeAuth(), 'my-app', data);
  const criticalVulns = report.vulnerabilities.filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH');
  assert.strictEqual(criticalVulns.length, 0, 'should not have critical/high vulns for healthy arch');
});

// ─── Report Rendering ─────────────────────────────────────────────────────────

test('render markdown: produces valid markdown', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const report = reporter.generateReport(makeAuth(), 'my-app', sampleData);
  const md = reporter.render(report, 'MARKDOWN');
  assert.ok(md.includes('# Technical Analysis Report'));
  assert.ok(md.includes('## Architecture Layers'));
  assert.ok(md.includes('## Vulnerability Flags'));
});

test('render json: produces valid JSON', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const report = reporter.generateReport(makeAuth(), 'my-app', sampleData);
  const json = reporter.render(report, 'JSON');
  const parsed = JSON.parse(json);
  assert.strictEqual(parsed.targetId, 'my-app');
  assert.ok(Array.isArray(parsed.sections));
});

test('render text: produces plain text output', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const report = reporter.generateReport(makeAuth(), 'my-app', sampleData);
  const text = reporter.render(report, 'TEXT');
  assert.ok(text.includes('Technical Analysis Report'));
  assert.ok(!text.includes('#'), 'TEXT format should not have markdown headers');
});

// ─── Diagram Generation ───────────────────────────────────────────────────────

test('generateDiagrams: produces layer and flow diagrams', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const diagrams = reporter.generateDiagrams(sampleData);
  assert.strictEqual(diagrams.length, 2, 'should produce 2 diagrams');
  assert.strictEqual(diagrams[0].title, 'Layer Architecture');
  assert.strictEqual(diagrams[1].title, 'Module Dependency Flow');
});

test('generateDiagrams: diagrams have nodes and edges', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const diagrams = reporter.generateDiagrams(sampleData);
  for (const diag of diagrams) {
    assert.ok(diag.nodes.length > 0, 'diagram should have nodes');
    assert.ok(typeof diag.diagram === 'string', 'diagram should have ASCII art');
    assert.ok(diag.diagram.length > 0, 'diagram should not be empty');
  }
});

// ─── Custom Vulnerabilities ───────────────────────────────────────────────────

test('generateReport: accepts custom vulnerabilities', () => {
  const reporter = new TechnicalReporter(new PermissionGuard());
  const customVulns: VulnerabilityFlag[] = [
    {
      severity: 'HIGH',
      category: 'INJECTION',
      description: 'SQL injection risk in db.ts',
      location: 'src/db.ts',
      recommendation: 'Use parameterized queries',
      cweId: 'CWE-89',
    },
  ];
  const report = reporter.generateReport(makeAuth(), 'my-app', { ...sampleData, vulnerabilities: customVulns });
  assert.strictEqual(report.vulnerabilities.length, 1);
  assert.strictEqual(report.vulnerabilities[0].severity, 'HIGH');
  assert.strictEqual(report.vulnerabilities[0].cweId, 'CWE-89');
});
