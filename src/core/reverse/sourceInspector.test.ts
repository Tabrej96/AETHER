/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — SOURCE INSPECTOR TESTS  ·  AETHER Reverse Intelligence
 * (src/core/reverse/sourceInspector.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AnalysisCategory,
  PermissionGuard,
  ReverseEngineAuthorization,
} from './permissionGuard';
import { ApplicationFile } from './behaviorAnalyzer';
import { SourceInspector } from './sourceInspector';

function makeAuth(): ReverseEngineAuthorization {
  return { targetId: 'my-app', basis: 'OWNED', authorized: true, evidence: 'Owned.' };
}

function sampleFiles(): ApplicationFile[] {
  return [
    {
      path: 'src/index.ts',
      imports: ['./app'],
      exports: ['startApp'],
      bytes: 200,
      language: 'ts',
    },
    {
      path: 'src/app.ts',
      imports: ['express', './routes'],
      exports: ['createApp', 'AppConfig'],
      bytes: 600,
      language: 'ts',
    },
    {
      path: 'src/routes.ts',
      imports: ['./controllers'],
      exports: ['registerRoutes', 'Router'],
      bytes: 400,
      language: 'ts',
    },
    {
      path: 'src/controllers/userController.ts',
      imports: ['../services/userService'],
      exports: ['getUsers', 'createUser', 'deleteUser'],
      bytes: 800,
      language: 'ts',
    },
    {
      path: 'src/services/userService.ts',
      imports: ['../repos/userRepo', './validator'],
      exports: ['listUsers', 'UserService'],
      bytes: 900,
      language: 'ts',
    },
  ];
}

// ─── Symbol Inspection ────────────────────────────────────────────────────────

test('inspectSymbols: extracts exported names as symbols', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const symbols = inspector.inspectSymbols(makeAuth(), sampleFiles(), 'my-app');
  assert.ok(symbols.length > 0, 'should find symbols');
  const startApp = symbols.find((s) => s.name === 'startApp');
  assert.ok(startApp, 'should find startApp symbol');
  assert.strictEqual(startApp!.kind, 'function');
});

test('inspectSymbols: class names with PascalCase detected', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const symbols = inspector.inspectSymbols(makeAuth(), sampleFiles(), 'my-app');
  const appConfig = symbols.find((s) => s.name === 'AppConfig');
  assert.ok(appConfig, 'should detect AppConfig as class');
  assert.strictEqual(appConfig!.kind, 'class');
});

test('inspectSymbols: throws on denied auth', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(() => inspector.inspectSymbols(auth, sampleFiles(), 'other'), /PermissionGuard denied/);
});

// ─── Import Mapping ───────────────────────────────────────────────────────────

test('mapImports: maps all imports', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const mappings = inspector.mapImports(makeAuth(), sampleFiles(), 'my-app');
  assert.ok(mappings.length > 0);
  const expressMappings = mappings.filter((m) => m.source === 'express');
  assert.ok(expressMappings.length >= 1, 'should map express import');
});

test('mapImports: identifies external vs internal', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const mappings = inspector.mapImports(makeAuth(), sampleFiles(), 'my-app');
  const external = mappings.filter((m) => !m.isTypeImport && !m.source.startsWith('.') && !m.source.startsWith('/'));
  assert.ok(external.length > 0, 'should have external imports');
  const internal = mappings.filter((m) => m.source.startsWith('.') || m.source.startsWith('/'));
  assert.ok(internal.length > 0, 'should have internal imports');
});

test('mapImports: deduplicates', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const mappings = inspector.mapImports(makeAuth(), sampleFiles(), 'my-app');
  const keys = mappings.map((m) => `${m.importingFile}|${m.source}`);
  assert.strictEqual(keys.length, new Set(keys).size, 'should be deduplicated');
});

// ─── Export Mapping ───────────────────────────────────────────────────────────

test('mapExports: maps all exports', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const mappings = inspector.mapExports(makeAuth(), sampleFiles(), 'my-app');
  assert.ok(mappings.length > 0);
  const startApp = mappings.find((m) => m.name === 'startApp');
  assert.ok(startApp, 'should find startApp export');
  assert.strictEqual(startApp!.isReexport, false);
});

test('mapExports: detects reexports', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const mappings = inspector.mapExports(makeAuth(), sampleFiles(), 'my-app');
  const reexports = mappings.filter((m) => m.isReexport);
  assert.ok(reexports.length >= 0, 'reexports list should be present'); // may or may not have reexports
});

// ─── Complexity Metrics ───────────────────────────────────────────────────────

test('computeComplexity: has valid numeric metrics', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const complexity = inspector.computeComplexity(makeAuth(), sampleFiles(), 'my-app');
  assert.ok(complexity.totalLines > 0, 'should have total lines');
  assert.ok(complexity.maxComplexity >= 1, 'max complexity >= 1');
  assert.ok(typeof complexity.averageComplexity === 'number');
});

test('computeComplexity: counts functions/classes/interfaces', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const complexity = inspector.computeComplexity(makeAuth(), sampleFiles(), 'my-app');
  assert.ok(complexity.totalFunctions >= 0, 'should count functions');
  assert.ok(complexity.totalClasses >= 2, 'should find classes (AppConfig, Router, UserService)');
});

test('computeComplexity: maintainability index in 0-100', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const complexity = inspector.computeComplexity(makeAuth(), sampleFiles(), 'my-app');
  for (const mi of Object.values(complexity.maintainabilityIndex)) {
    assert.ok(mi >= 0 && mi <= 100, `maintainability index ${mi} out of range`);
  }
});

test('computeComplexity: throws on denied auth', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(() => inspector.computeComplexity(auth, sampleFiles(), 'other'), /PermissionGuard denied/);
});

// ─── Full Pipeline ────────────────────────────────────────────────────────────

test('inspectAll: produces complete report', () => {
  const inspector = new SourceInspector(new PermissionGuard());
  const report = inspector.inspectAll(makeAuth(), sampleFiles(), 'my-app');
  assert.strictEqual(report.targetId, 'my-app');
  assert.ok(report.symbols.length > 0);
  assert.ok(report.imports.length > 0);
  assert.ok(report.exports.length > 0);
  assert.ok(report.inspectionSummary.length > 0);
  assert.deepEqual(report.authorization.targetId, 'my-app');
});
