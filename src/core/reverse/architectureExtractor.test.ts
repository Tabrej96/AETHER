/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — ARCHITECTURE EXTRACTOR TESTS  ·  AETHER Reverse Intelligence
 * (src/core/reverse/architectureExtractor.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ArchitectureReport,
  ArchitectureExtractor,
  ModuleDependency,
} from './architectureExtractor';
import {
  AnalysisCategory,
  PermissionGuard,
  ReverseEngineAuthorization,
} from './permissionGuard';
import { ApplicationFile } from './behaviorAnalyzer';

function makeAuth(): ReverseEngineAuthorization {
  return { targetId: 'my-app', basis: 'OWNED', authorized: true, evidence: 'Owned.' };
}

function sampleFiles(): ApplicationFile[] {
  return [
    { path: 'src/index.ts', imports: ['./app', './config'], exports: ['start'], bytes: 200, language: 'ts' },
    { path: 'src/app.ts', imports: ['./routes', './middleware', 'express'], exports: ['createApp'], bytes: 500, language: 'ts' },
    { path: 'src/routes.ts', imports: ['./controllers/userController', './controllers/itemController'], exports: ['registerRoutes'], bytes: 400, language: 'ts' },
    { path: 'src/controllers/userController.ts', imports: ['../services/userService'], exports: ['getUsers', 'createUser'], bytes: 600, language: 'ts' },
    { path: 'src/controllers/itemController.ts', imports: ['../services/itemService'], exports: ['getItems', 'createItem'], bytes: 550, language: 'ts' },
    { path: 'src/services/userService.ts', imports: ['../repos/userRepo', './validator'], exports: ['listUsers', 'addUser'], bytes: 700, language: 'ts' },
    { path: 'src/services/itemService.ts', imports: ['../repos/itemRepo'], exports: ['listItems', 'addItem'], bytes: 650, language: 'ts' },
    { path: 'src/repos/userRepo.ts', imports: ['pg', '../db'], exports: ['findAll', 'insert'], bytes: 800, language: 'ts' },
    { path: 'src/repos/itemRepo.ts', imports: ['pg', '../db'], exports: ['findAll', 'insert'], bytes: 750, language: 'ts' },
    { path: 'src/db.ts', imports: ['pg', 'dotenv'], exports: ['pool'], bytes: 500, language: 'ts' },
    { path: 'src/middleware/auth.ts', imports: ['jsonwebtoken'], exports: ['authMiddleware'], bytes: 400, language: 'ts' },
    { path: 'src/config/index.ts', imports: ['dotenv'], exports: ['config'], bytes: 300, language: 'ts' },
    { path: 'src/utils/helpers.ts', imports: [], exports: ['formatDate'], bytes: 200, language: 'ts' },
  ];
}

// ─── Layer Identification ────────────────────────────────────────────────────

test('identifyLayers: categorizes files correctly', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const layers = extractor.identifyLayers(sampleFiles());
  const layerNames = layers.map((l) => l.name);
  assert.ok(layerNames.includes('interface'), 'should have interface layer');
  assert.ok(layerNames.includes('domain'), 'should have domain layer');
  assert.ok(layerNames.includes('data'), 'should have data layer');
  assert.ok(layerNames.includes('utility'), 'should have utility layer');
});

test('identifyLayers: counts files per layer', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const layers = extractor.identifyLayers(sampleFiles());
  const dataLayer = layers.find((l) => l.name === 'data');
  assert.ok(dataLayer, 'data layer should exist');
  assert.strictEqual(dataLayer!.files.length, 2, 'data layer should have 2 files');
});

test('identifyLayers: sorted by file count desc', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const layers = extractor.identifyLayers(sampleFiles());
  for (let i = 1; i < layers.length; i++) {
    assert.ok(
      layers[i - 1].files.length >= layers[i].files.length,
      'layers should be sorted by file count'
    );
  }
});

// ─── Module Graph ─────────────────────────────────────────────────────────────

test('buildModuleGraph: nodes match file count', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const graph = extractor.buildModuleGraph(sampleFiles());
  assert.strictEqual(graph.nodes.length, sampleFiles().length);
});

test('buildModuleGraph: edges are non-empty', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const graph = extractor.buildModuleGraph(sampleFiles());
  assert.ok(graph.edges.length > 0, 'should have edges');
});

test('buildModuleGraph: entry points identified', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const graph = extractor.buildModuleGraph(sampleFiles());
  const entryNodes = graph.nodes.filter((n) => n.isEntryPoint);
  assert.ok(entryNodes.length >= 1, 'should identify at least one entry point');
});

test('buildModuleGraph: fan-in/fan-out computed', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const graph = extractor.buildModuleGraph(sampleFiles());
  const userService = graph.nodes.find((n) => n.id === 'src/services/userService.ts');
  assert.ok(userService, 'userService node should exist');
  assert.ok(userService!.fanIn > 0, 'userService should have fanIn > 0');
});

// ─── Cycle Detection ──────────────────────────────────────────────────────────

test('buildModuleGraph: detects no cycles in acyclic graph', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const graph = extractor.buildModuleGraph(sampleFiles());
  assert.strictEqual(graph.cycles.length, 0, 'sample graph should be acyclic');
});

// ─── Dependency Extraction ────────────────────────────────────────────────────

test('extractDependencies: includes internal and external', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const deps = extractor.extractDependencies(sampleFiles());
  const internal = deps.filter((d) => d.type === 'INTERNAL');
  const external = deps.filter((d) => d.type === 'EXTERNAL');
  assert.ok(internal.length > 0, 'should have internal deps');
  assert.ok(external.length > 0, 'should have external deps (pg, express, etc.)');
});

test('extractDependencies: deduplicates', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const deps = extractor.extractDependencies(sampleFiles());
  const keys = deps.map((d) => `${d.source}->${d.target}`);
  const uniqueKeys = new Set(keys);
  assert.strictEqual(keys.length, uniqueKeys.size, 'dependencies should be deduplicated');
});

// ─── Design Pattern Detection ─────────────────────────────────────────────────

test('detectDesignPatterns: detects middleware chain', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const files = [
    { path: 'src/app.ts', imports: ['express'], exports: ['createApp'], bytes: 100, language: 'ts' },
    { path: 'src/middleware/auth.ts', imports: [], exports: ['authMiddleware'], bytes: 100, language: 'ts' },
  ];
  const graph = extractor.buildModuleGraph(files);
  const patterns = extractor.detectDesignPatterns(files, graph);
  const middlewarePattern = patterns.find((p) => p.pattern === 'MIDDLEWARE_CHAIN');
  assert.ok(middlewarePattern, 'should detect middleware chain pattern');
});

test('detectDesignPatterns: detects repository pattern', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const files = [
    { path: 'src/repos/userRepo.ts', imports: ['pg'], exports: ['findAll'], bytes: 100, language: 'ts' },
  ];
  const graph = extractor.buildModuleGraph(files);
  const patterns = extractor.detectDesignPatterns(files, graph);
  const repoPattern = patterns.find((p) => p.pattern === 'REPOSITORY');
  assert.ok(repoPattern, 'should detect repository pattern');
});

test('detectDesignPatterns: detects service layer', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const files = [
    { path: 'src/services/userService.ts', imports: ['../repos/userRepo'], exports: ['list'], bytes: 100, language: 'ts' },
  ];
  const graph = extractor.buildModuleGraph(files);
  const patterns = extractor.detectDesignPatterns(files, graph);
  const servicePattern = patterns.find((p) => p.pattern === 'SERVICE_LAYER');
  assert.ok(servicePattern, 'should detect service layer pattern');
});

// ─── Complexity Metrics ───────────────────────────────────────────────────────

test('complexityMetrics: populated with correct values', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const report = extractor.extractArchitecture(makeAuth(), sampleFiles(), 'my-app');
  const m = report.complexityMetrics;
  assert.strictEqual(m.moduleCount, sampleFiles().length);
  assert.ok(m.layerCount >= 1);
  assert.ok(m.dependencyCount > 0);
  assert.ok(typeof m.avgFanIn === 'number');
  assert.ok(typeof m.avgFanOut === 'number');
});

// ─── Authorization ────────────────────────────────────────────────────────────

test('extractArchitecture: throws on denied auth', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const auth: ReverseEngineAuthorization = { targetId: 'other', basis: 'OWNED', authorized: false, evidence: 'nope' };
  assert.throws(
    () => extractor.extractArchitecture(auth, sampleFiles(), 'other'),
    /PermissionGuard denied/
  );
});

// ─── Full Pipeline ────────────────────────────────────────────────────────────

test('extractArchitecture: produces complete report', () => {
  const extractor = new ArchitectureExtractor(new PermissionGuard());
  const report = extractor.extractArchitecture(makeAuth(), sampleFiles(), 'my-app');
  assert.strictEqual(report.targetId, 'my-app');
  assert.ok(report.layers.length > 0);
  assert.ok(report.moduleGraph.nodes.length > 0);
  assert.ok(report.architectureSummary.length > 0);
  assert.deepEqual(report.authorization.targetId, 'my-app');
});
