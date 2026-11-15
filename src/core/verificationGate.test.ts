/**
 * VerificationGate test — run: npx tsx --test src/core/verificationGate.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  getAllFiles,
  findRelevantFiles,
  isFileComplete,
  verify,
  verifyRequirement,
  defaultRequirements,
  type Requirement,
  type VerificationReport,
} from './verificationGate';

const here = path.dirname(fileURLToPath(import.meta.url));

function makeTempProject(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-vg-'));
  // write a real source file
  fs.mkdirSync(path.join(root, 'src', 'core'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'core', 'index.ts'), 'export const VERSION = "1.0.0";\nexport function init() { return true; }\n');
  // write a README
  fs.writeFileSync(path.join(root, 'README.md'), '# Demo Project\n\nA real project with real documentation.\n');
  // write a test file
  fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(root, 'tests', 'index.test.ts'), 'import assert from "node:assert/strict";\nassert.equal(1, 1);\n');
  return root;
}

test('getAllFiles returns every file recursively', () => {
  const root = makeTempProject();
  const files = getAllFiles(root);
  const names = files.map((f) => path.relative(root, f).replace(/\\/g, '/'));
  assert.ok(names.some((n) => n.startsWith('src/')), `expected src/ files, got ${JSON.stringify(names)}`);
  assert.ok(names.some((n) => n === 'README.md'), `expected README.md, got ${JSON.stringify(names)}`);
  // hidden dirs and node_modules are excluded
  assert.ok(!names.some((n) => n.startsWith('.')), 'hidden entries excluded');
  fs.rmSync(root, { recursive: true, force: true });
});

test('findRelevantFiles matches glob patterns', () => {
  const root = makeTempProject();
  const req: Requirement = {
    id: 'T01', description: 'package manifest', category: 'tech-stack', filePattern: 'package.json',
  };
  const files = findRelevantFiles(root, req);
  assert.equal(files.length, 0, `no package.json in fixture → 0 matches, got ${files.length}`);
  // now add one
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"x","version":"1.0.0"}\n');
  const again = findRelevantFiles(root, req);
  assert.ok(again.length >= 1, `expected ≥1 match after writing package.json, got ${again.length}`);
  fs.rmSync(root, { recursive: true, force: true });
});

test('isFileComplete rejects stubs and accepts real code', () => {
  const root = makeTempProject();
  const realFile = path.join(root, 'src', 'core', 'index.ts');
  assert.ok(isFileComplete(realFile, { id: 'x', description: 'd', category: 'critical' }), 'real file should be complete');

  // write a stub
  const stub = path.join(root, 'src', 'core', 'stub.ts');
  fs.writeFileSync(stub, '// TODO: implement this\n');
  assert.ok(!isFileComplete(stub, { id: 'x', description: 'd', category: 'critical' }), 'TODO stub should not be complete');

  // write a demo artifact
  const demo = path.join(root, 'src', 'core', 'demo.ts');
  fs.writeFileSync(demo, '// demo file — sample data here\nconst fake = "sample";\n');
  assert.ok(
    isFileComplete(demo, { id: 'E01', description: 'no demo', category: 'demo-clean' }),
    'demo file flagged as incomplete by demo-clean check',
  );

  fs.rmSync(root, { recursive: true, force: true });
});

test('verifyRequirement fails with clear evidence when no files match', async () => {
  const root = makeTempProject();
  const req: Requirement = {
    id: 'B01', description: 'database schema', category: 'database', filePattern: '**/*schema*.sql',
  };
  const check = await verifyRequirement(root, req);
  assert.equal(check.passed, false);
  assert.ok(check.gap !== undefined && check.gap.length > 0, 'gap must be recorded on failure');
  assert.ok(check.evidence.includes('No matching'), 'evidence should explain the failure');
  fs.rmSync(root, { recursive: true, force: true });
});

test('verify passes only when all 10 default checks pass', async () => {
  // Build a project that satisfies all 10 checks
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-vg-allpass-'));

  // critical / pillar / tech-stack
  fs.mkdirSync(path.join(root, 'src', 'core'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'core', 'engine.ts'), 'export function run() { return true; }\n');
  fs.writeFileSync(path.join(root, 'src', 'core', 'adapter.ts'), 'export const A = 1;\n');
  fs.mkdirSync(path.join(root, 'src', 'api'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'api', 'routes.ts'), 'export const router = {};\n');

  // tech-stack
  fs.writeFileSync(path.join(root, 'package.json'), '{"name":"x","version":"1.0.0"}\n');

  // deployment
  fs.writeFileSync(path.join(root, 'Dockerfile'), 'FROM node:20\n');

  // test-coverage
  fs.mkdirSync(path.join(root, 'tests'), { recursive: true });
  fs.writeFileSync(path.join(root, 'tests', 'engine.test.ts'), 'assert.equal(1, 1);\n');

  // security
  fs.writeFileSync(path.join(root, 'src', 'core', 'securityGate.ts'), 'export function check() { return true; }\n');

  // database
  fs.mkdirSync(path.join(root, 'migrations'), { recursive: true });
  fs.writeFileSync(path.join(root, 'migrations', '001_init.ts'), 'export const up = () => {};\n');

  // integration
  fs.mkdirSync(path.join(root, 'integrations'), { recursive: true });
  fs.writeFileSync(path.join(root, 'integrations', 'external.ts'), 'export const call = () => {};\n');

  // documentation
  fs.writeFileSync(path.join(root, 'README.md'), '# My Project\n\nReal documentation.\n');

  // no demo artifacts (do not write any)

  const requirements = defaultRequirements();
  const report = await verify(root, requirements);
  assert.equal(report.score, 10, `expected 10/10, got ${report.score}/10 — failures: ${JSON.stringify(report.failures)}`);
  assert.equal(report.passed, true);
  assert.equal(report.failures.length, 0, `expected no failures, got: ${report.failures.join('; ')}`);

  fs.rmSync(root, { recursive: true, force: true });
});

test('verify scores below 10/10 when a requirement fails', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-vg-fail-'));
  // only write a README — everything else is missing
  fs.writeFileSync(path.join(root, 'README.md'), '# Project\n');

  const requirements = defaultRequirements();
  const report = await verify(root, requirements);
  assert.equal(report.passed, false, 'report should fail when requirements are missing');
  assert.ok(report.score < 10, `expected score < 10, got ${report.score}`);
  assert.ok(report.failures.length > 0, 'failures list should be non-empty');
  fs.rmSync(root, { recursive: true, force: true });
});

test('demo-clean requirement fails when demo/sample markers exist', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-vg-demo-'));
  fs.writeFileSync(path.join(root, 'README.md'), '# Project\n');
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'src', 'sample.ts'), '// sample data for demo\nconst x = "fake";\n');

  const requirements = defaultRequirements();
  const report = await verify(root, requirements);
  const demoCheck = report.checks.find((c) => c.requirementId === 'E01');
  assert.ok(demoCheck !== undefined, 'E01 check must exist');
  assert.ok(!demoCheck!.passed, 'demo-clean check should fail when sample artifacts exist');
  fs.rmSync(root, { recursive: true, force: true });
});
