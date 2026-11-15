/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — BEHAVIOR ANALYZER TESTS  ·  AETHER Reverse Intelligence
 * (src/core/reverse/behaviorAnalyzer.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AnalysisCategory,
  ApplicationFile,
  AuthCheckResult,
  PermissionGuard,
  ReverseEngineAuthorization,
} from './permissionGuard';
import { BehaviorAnalyzer } from './behaviorAnalyzer';

function makeAuth(targetId = 'my-app'): ReverseEngineAuthorization {
  return { targetId, basis: 'OWNED', authorized: true, evidence: 'Owned.' };
}

function sampleFiles(): ApplicationFile[] {
  return [
    {
      path: 'src/main.ts',
      imports: ['./server', 'express'],
      exports: ['startApp'],
      bytes: 420,
      language: 'ts',
    },
    {
      path: 'src/server.ts',
      imports: ['./router', './db', 'express'],
      exports: ['createServer', 'getUsers', 'createUser', 'updateUser', 'deleteUser'],
      bytes: 1800,
      language: 'ts',
    },
    {
      path: 'src/router.ts',
      imports: ['./db'],
      exports: ['registerRoutes'],
      bytes: 900,
      language: 'ts',
    },
    {
      path: 'src/db.ts',
      imports: ['pg', 'dotenv'],
      exports: ['pool', 'query'],
      bytes: 640,
      language: 'ts',
    },
    {
      path: 'src/utils/helpers.ts',
      imports: [],
      exports: ['formatDate', 'sanitize'],
      bytes: 300,
      language: 'ts',
    },
    {
      path: 'src/server.test.ts',
      imports: ['./server'],
      exports: [],
      bytes: 640,
      language: 'ts',
    },
  ];
}

// ─── Static Structure Analysis ────────────────────────────────────────────────

test('static structure: counts files and bytes', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const result = analyzer.analyzeStaticStructure(makeAuth(), sampleFiles(), 'my-app');
  assert.strictEqual(result.fileCount, 6);
  assert.ok(result.totalBytes > 0);
  assert.ok(result.avgFileBytes > 0);
});

test('static structure: language distribution', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const result = analyzer.analyzeStaticStructure(makeAuth(), sampleFiles(), 'my-app');
  assert.strictEqual(result.languageDistribution['ts'], 6);
});

test('static structure: largest files sorted by bytes desc', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const result = analyzer.analyzeStaticStructure(makeAuth(), sampleFiles(), 'my-app');
  assert.ok(result.largestFiles[0].bytes >= result.largestFiles[1].bytes);
});

test('static structure: unimported files identified', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const result = analyzer.analyzeStaticStructure(makeAuth(), sampleFiles(), 'my-app');
  assert.ok(result.unimportedFiles.includes('src/utils/helpers.ts'), 'utils/helpers.ts should be unimported (has no imports)');
});

test('static structure: high centrality files detected', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const result = analyzer.analyzeStaticStructure(makeAuth(), sampleFiles(), 'my-app');
  // server.ts imports router and db internally, giving it internal fan-in
  const serverEntry = result.highCentralityFiles.find((f) => f.path === 'src/server.ts');
  assert.ok(serverEntry, 'server.ts should be in high centrality');
  assert.ok(serverEntry.importCount >= 2, `expected >=2, got ${serverEntry.importCount}`);
});

// ─── Authorization enforcement ────────────────────────────────────────────────

test('analyzeStaticStructure: throws on denied auth', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(() => analyzer.analyzeStaticStructure(auth, sampleFiles(), 'other'), /PermissionGuard denied/);
});

test('discoverApiEndpoints: throws on denied auth', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(() => analyzer.discoverApiEndpoints(auth, sampleFiles(), 'other'), /PermissionGuard denied/);
});

test('traceDataFlows: throws on denied auth', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(() => analyzer.traceDataFlows(auth, sampleFiles(), 'other'), /PermissionGuard denied/);
});

test('simulateRuntimeTraces: throws on denied auth', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(() => analyzer.simulateRuntimeTraces(auth, sampleFiles(), 'other'), /PermissionGuard denied/);
});

// ─── API Endpoint Discovery ───────────────────────────────────────────────────

test('discoverApiEndpoints: finds routes from naming conventions', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const files: ApplicationFile[] = [
    {
      path: 'src/api/users.ts',
      imports: ['express', './db'],
      exports: ['getUsers', 'createUser', 'deleteUser'],
      bytes: 500,
      language: 'ts',
    },
  ];
  const endpoints = analyzer.discoverApiEndpoints(makeAuth(), files, 'my-app');
  assert.ok(endpoints.length >= 3, `expected >=3 endpoints, got ${endpoints.length}`);
  const methods = endpoints.map((e) => e.method).sort();
  assert.ok(methods.includes('GET'), 'should have GET');
  assert.ok(methods.includes('POST'), 'should have POST');
  assert.ok(methods.includes('DELETE'), 'should have DELETE');
});

test('discoverApiEndpoints: confidence levels', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const files: ApplicationFile[] = [
    {
      path: 'src/api/items.ts',
      imports: ['express'],
      exports: ['getItems', 'createItem', 'updateItem', 'patchItem', 'removeItem'],
      bytes: 600,
      language: 'ts',
    },
  ];
  const endpoints = analyzer.discoverApiEndpoints(makeAuth(), files, 'my-app');
  const getEndpoint = endpoints.find((e) => e.method === 'GET');
  assert.ok(getEndpoint, 'GET endpoint should exist');
  assert.ok(getEndpoint!.confidence === 'HIGH', 'GET should be HIGH confidence');
});

// ─── Data Flow Tracing ────────────────────────────────────────────────────────

test('traceDataFlows: identifies flows between modules', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const files: ApplicationFile[] = [
    {
      path: 'src/db.ts',
      imports: ['pg'],
      exports: ['pool'],
      bytes: 500,
      language: 'ts',
    },
    {
      path: 'src/service.ts',
      imports: ['./db'],
      exports: ['getAll'],
      bytes: 300,
      language: 'ts',
    },
  ];
  const flows = analyzer.traceDataFlows(makeAuth(), files, 'my-app');
  assert.ok(flows.length >= 1, 'should find at least one data flow');
  const hasDbFlow = flows.some((f) => f.dataType === 'DATABASE');
  assert.ok(hasDbFlow, 'should identify DATABASE data type from pg import');
});

test('traceDataFlows: deduplicates', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const files: ApplicationFile[] = [
    {
      path: 'src/db.ts',
      imports: ['pg'],
      exports: ['pool'],
      bytes: 500,
      language: 'ts',
    },
    {
      path: 'src/service.ts',
      imports: ['./db', './db'],
      exports: ['getAll'],
      bytes: 300,
      language: 'ts',
    },
  ];
  const flows = analyzer.traceDataFlows(makeAuth(), files, 'my-app');
  const dbFlows = flows.filter((f) => f.source === 'src/db.ts');
  assert.strictEqual(dbFlows.length, 1, 'should deduplicate duplicate flows');
});

// ─── Runtime Trace Simulation ─────────────────────────────────────────────────

test('simulateRuntimeTraces: identifies HTTP interactions', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const files: ApplicationFile[] = [
    {
      path: 'src/app.ts',
      imports: ['express', 'pg', 'axios'],
      exports: ['startApp'],
      bytes: 400,
      language: 'ts',
    },
  ];
  const traces = analyzer.simulateRuntimeTraces(makeAuth(), files, 'my-app');
  assert.ok(traces.length >= 1);
  const trace = traces[0];
  const hasHttp = trace.interactions.some((i) => i.type === 'HTTP_REQUEST');
  assert.ok(hasHttp, 'should identify HTTP_REQUEST from express/axios');
  const hasDb = trace.interactions.some((i) => i.type === 'DATABASE_QUERY');
  assert.ok(hasDb, 'should identify DATABASE_QUERY from pg');
});

// ─── Full Analysis Pipeline ───────────────────────────────────────────────────

test('runFullAnalysis: produces complete report', () => {
  const analyzer = new BehaviorAnalyzer(new PermissionGuard());
  const files = sampleFiles();
  const report = analyzer.runFullAnalysis(makeAuth(), files, 'my-app');
  assert.strictEqual(report.targetId, 'my-app');
  assert.ok(report.staticAnalysis.fileCount > 0);
  assert.ok(report.behaviorSummary.length > 0);
  assert.deepEqual(report.authorization.targetId, 'my-app');
});
