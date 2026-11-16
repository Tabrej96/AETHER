/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER — independent verification engine (§13). The engine must CATCH
 * problems, not rubber-stamp: a deliberately broken scaffold must report
 * INCOMPLETE with specific, actionable evidence.
 */

import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { scaffoldProduct, type ScaffoldedFile } from './productScaffolder';
import { buildReport, runGeneratedTests, verifyScaffoldStatic, type RequirementCheck } from './verifyScaffold';

const find = (checks: RequirementCheck[], id: string) => checks.find((c) => c.id === id)!;

describe('verifyScaffoldStatic — green path', () => {
  const result = scaffoldProduct({ prompt: 'Build a coffee shop website with subscriptions' });

  it('reports COMPLETE with zero failures on a correct generation', () => {
    const report = buildReport(result, result.files);
    assert.equal(report.failed, 0, report.checks.filter((c) => c.status === 'fail').map((c) => `${c.id}: ${c.evidence}`).join(' | '));
    assert.equal(report.verdict, 'complete');
    assert.ok(report.passed >= 8, `expected at least 8 passing checks, got ${report.passed}`);
  });

  it('routes every planned page and mounts every API in both entry points', () => {
    const checks = verifyScaffoldStatic(result, result.files);
    assert.equal(find(checks, 'pages-routed').status, 'pass');
    assert.equal(find(checks, 'api-surface').status, 'pass');
    assert.equal(find(checks, 'db-schema').status, 'pass');
    assert.equal(find(checks, 'seed-invoked').status, 'pass');
  });

  it('order domains are checked for the full commerce layer', () => {
    const checks = verifyScaffoldStatic(result, result.files);
    const commerce = find(checks, 'commerce-logic');
    assert.equal(commerce.status, 'pass', commerce.evidence);
  });
});

describe('verifyScaffoldStatic — non-order domains', () => {
  it('skips (does not fail) commerce checks when the domain has no orders', () => {
    const saas = scaffoldProduct({ prompt: 'Build a SaaS analytics dashboard' });
    const checks = verifyScaffoldStatic(saas, saas.files);
    const commerce = find(checks, 'commerce-logic');
    assert.equal(commerce.status, 'skip', 'non-order domains must not be penalised for lacking a commerce layer');
    const report = buildReport(saas, saas.files);
    assert.equal(report.failed, 0, report.checks.filter((c) => c.status === 'fail').map((c) => `${c.id}: ${c.evidence}`).join(' | '));
  });
});

describe('verifyScaffoldStatic — broken scaffolds must FAIL (engine is not a rubber stamp)', () => {
  const base = scaffoldProduct({ prompt: 'Build a coffee shop website with subscriptions' });

  const mutate = (fn: (files: ScaffoldedFile[]) => void): ScaffoldedFile[] => {
    const files = base.files.map((f) => ({ ...f }));
    fn(files);
    return files;
  };

  it('detects a syntax error in generated code', () => {
    const files = mutate((fs) => {
      const db = fs.find((f) => f.path === 'server/src/db.ts')!;
      db.content = db.content + '\nconst oops = ;\n';
    });
    const check = find(verifyScaffoldStatic(base, files), 'syntax');
    assert.equal(check.status, 'fail');
    assert.match(check.evidence, /db\.ts/);
  });

  it('detects a removed seed invocation', () => {
    const files = mutate((fs) => {
      const db = fs.find((f) => f.path === 'server/src/db.ts')!;
      db.content = db.content.replace(/\nseed\(\);\n/, '\n');
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'seed-invoked').status, 'fail');
  });

  it('detects an unmounted API resource', () => {
    const files = mutate((fs) => {
      const index = fs.find((f) => f.path === 'server/src/index.ts')!;
      index.content = index.content.replace(/app\.use\('\/api\/subscriptions', .*?;/, '/* removed */');
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'api-surface').status, 'fail');
  });

  it('detects placeholder test suites', () => {
    const files = mutate((fs) => {
      const t = fs.find((f) => f.path === 'server/test/api.test.ts')!;
      t.content = "import { describe, it } from 'node:test';\nimport assert from 'node:assert/strict';\ndescribe('x', () => { it('ok', () => assert.ok(true, 'wired')); });\n";
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'real-tests').status, 'fail');
  });

  it('detects a stripped commerce service', () => {
    const files = mutate((fs) => {
      const c = fs.find((f) => f.path === 'server/src/services/commerce.ts')!;
      c.content = c.content.replace('export function priceCart', 'function priceCartRemoved');
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'commerce-logic').status, 'fail');
  });

  it('detects committed secrets in .env.example', () => {
    const files = mutate((fs) => {
      const env = fs.find((f) => f.path === '.env.example')!;
      env.content = env.content.replace('STRIPE_SECRET_KEY=', 'STRIPE_SECRET_KEY=sk_test_live_123');
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'deployment').status, 'fail');
  });

  it('the overall verdict is INCOMPLETE for any failed check', () => {
    const files = mutate((fs) => {
      const env = fs.find((f) => f.path === '.env.example')!;
      env.content = env.content.replace('STRIPE_SECRET_KEY=', 'STRIPE_SECRET_KEY=sk_test_live_123');
    });
    const report = buildReport(base, files);
    assert.equal(report.verdict, 'incomplete');
    assert.ok(report.failed >= 1);
  });
});

describe('runGeneratedTests — honest pre-checks (no fabricated runs)', () => {
  it('reports missing test suite without attempting to run', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aether-verify-'));
    const r = runGeneratedTests(dir);
    assert.equal(r.ran, false);
    assert.match(r.detail, /no test suite found/);
  });

  it('reports missing dependencies without attempting to run', () => {
    const dir = mkdtempSync(join(tmpdir(), 'aether-verify-'));
    // A test file exists but no node_modules anywhere up the tree
    // (use a deep path under tmp so the upward walk finds nothing).
    const server = join(dir, 'a', 'b', 'c', 'server');
    mkdirSync(join(server, 'test'), { recursive: true });
    writeFileSync(join(server, 'test', 'api.test.ts'), 'console.log(1);');
    const r = runGeneratedTests(server);
    assert.equal(r.ran, false);
    assert.match(r.detail, /dependencies not installed/);
  });

  it('folds a dynamic result into the verdict', () => {
    const result = scaffoldProduct({ prompt: 'Build a coffee shop website with subscriptions' });
    const complete = buildReport(result, result.files, { ran: true, passed: 8, failed: 0, detail: '8 generated tests passed' });
    assert.equal(complete.verdict, 'complete');
    assert.equal(complete.skipped, 0);
    const broken = buildReport(result, result.files, { ran: true, passed: 5, failed: 3, detail: '3 failures' });
    assert.equal(broken.verdict, 'incomplete');
  });
});
