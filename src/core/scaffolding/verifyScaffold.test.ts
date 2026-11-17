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

  it('order domains pass payments-wired on a clean generation', () => {
    const checks = verifyScaffoldStatic(result, result.files);
    const p = find(checks, 'payments-wired');
    assert.equal(p.status, 'pass', p.evidence);
  });
});

describe('verifyScaffoldStatic — non-order domains', () => {
  it('skips (does not fail) commerce checks when the domain has no orders', () => {
    const saas = scaffoldProduct({ prompt: 'Build a SaaS analytics dashboard' });
    const checks = verifyScaffoldStatic(saas, saas.files);
    const commerce = find(checks, 'commerce-logic');
    assert.equal(commerce.status, 'skip', 'non-order domains must not be penalised for lacking a commerce layer');
    assert.equal(find(checks, 'payments-wired').status, 'skip', 'non-order domains must not be penalised for lacking a payment layer');
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
      const db = fs.find((f) => f.path === 'backend/src/db.ts')!;
      db.content = db.content + '\nconst oops = ;\n';
    });
    const check = find(verifyScaffoldStatic(base, files), 'syntax');
    assert.equal(check.status, 'fail');
    assert.match(check.evidence, /db\.ts/);
  });

  it('detects a removed seed invocation', () => {
    const files = mutate((fs) => {
      const db = fs.find((f) => f.path === 'backend/src/db.ts')!;
      db.content = db.content.replace(/\nseed\(\);\n/, '\n');
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'seed-invoked').status, 'fail');
  });

  it('detects an unmounted API resource', () => {
    const files = mutate((fs) => {
      const index = fs.find((f) => f.path === 'backend/src/index.ts')!;
      index.content = index.content.replace(/app\.use\('\/api\/subscriptions', .*?;/, '/* removed */');
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'api-surface').status, 'fail');
  });

  it('detects placeholder test suites', () => {
    const files = mutate((fs) => {
      const t = fs.find((f) => f.path === 'backend/test/api.test.ts')!;
      t.content = "import { describe, it } from 'node:test';\nimport assert from 'node:assert/strict';\ndescribe('x', () => { it('ok', () => assert.ok(true, 'wired')); });\n";
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'real-tests').status, 'fail');
  });

  it('detects a stripped commerce service', () => {
    const files = mutate((fs) => {
      const c = fs.find((f) => f.path === 'backend/src/services/commerce.ts')!;
      c.content = c.content.replace('export function priceCart', 'function priceCartRemoved');
    });
    assert.equal(find(verifyScaffoldStatic(base, files), 'commerce-logic').status, 'fail');
  });

  it('detects a deleted payments service (order domain)', () => {
    const files = mutate((fs) => {
      fs.splice(fs.findIndex((f) => f.path === 'backend/src/services/payments.ts'), 1);
    });
    const c = find(verifyScaffoldStatic(base, files), 'payments-wired');
    assert.equal(c.status, 'fail');
    assert.match(c.evidence, /no PaymentGateway interface|no gateway selection/);
  });

  it('detects an unmounted payment webhook', () => {
    const files = mutate((fs) => {
      const index = fs.find((f) => f.path === 'backend/src/index.ts')!;
      index.content = index.content.replace("app.use('/api/payments', paymentsRouter);", '/* removed */');
    });
    const c = find(verifyScaffoldStatic(base, files), 'payments-wired');
    assert.equal(c.status, 'fail');
    assert.match(c.evidence, /webhook not mounted/);
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

describe('verifyScaffoldStatic — demo-3 defect invariants (D3/D5/D6/D9/D10)', () => {
  const result = scaffoldProduct({ prompt: 'Build a coffee shop website with subscriptions' });
  const checks = verifyScaffoldStatic(result, result.files);

  it('passes all five demo-3 invariants on a clean generation', () => {
    for (const id of ['manifest-consistency', 'docker-clean', 'ci-workflow', 'template-hygiene', 'frontend-api-consistency']) {
      const c = find(checks, id);
      assert.equal(c.status, 'pass', `${id}: ${c.evidence}`);
    }
  });

  it('D5: catches an undeclared binary in root scripts', () => {
    const files = result.files.map((f) => ({ ...f }));
    const pkg = files.find((f) => f.path === 'package.json')!;
    pkg.content = pkg.content.replace(/"devDependencies":\s*\{\s*"concurrently"[^}]*\}/, '"devDependencies": {}');
    assert.equal(find(verifyScaffoldStatic(result, files), 'manifest-consistency').status, 'fail');
  });

  it('D9/D14: catches a missing .dockerignore', () => {
    const files = result.files.map((f) => ({ ...f })).filter((f) => f.path !== '.dockerignore');
    assert.equal(find(verifyScaffoldStatic(result, files), 'docker-clean').status, 'fail');
  });

  it('D10: catches a product with no CI workflow', () => {
    const files = result.files.map((f) => ({ ...f })).filter((f) => !f.path.startsWith('.github/'));
    assert.equal(find(verifyScaffoldStatic(result, files), 'ci-workflow').status, 'fail');
  });

  it('D6: catches unrendered generator variables in emitted docs', () => {
    const files = result.files.map((f) => ({ ...f }));
    const read = files.find((f) => f.path === 'README.md')!;
    read.content += '\nleak: ${a.auth}\n';
    assert.equal(find(verifyScaffoldStatic(result, files), 'template-hygiene').status, 'fail');
  });

  it('D3: catches a page fetching a resource the backend never planned', () => {
    const files = result.files.map((f) => ({ ...f }));
    const menu = files.find((f) => f.path === 'frontend/src/pages/MenuPage.tsx')!;
    menu.content = menu.content.replace('"/menu"', '"/products"');
    const c = find(verifyScaffoldStatic(result, files), 'frontend-api-consistency');
    assert.equal(c.status, 'fail');
    assert.match(c.evidence, /products/);
  });

  it('emits no dead routes.ts and no mangled plural API names', () => {
    assert.ok(!result.files.some((f) => f.path === 'frontend/src/routes.ts'), 'routes.ts must not exist (dead file)');
    const api = result.files.find((f) => f.path === 'frontend/src/lib/api.ts')!.content;
    assert.doesNotMatch(api, /Orderss|Subscriptionss|Reviewss|listStaffs|listInventorys/);
    assert.match(api, /listOrders/);
    const pkg = JSON.parse(result.files.find((f) => f.path === 'package.json')!.content) as { devDependencies?: Record<string, string> };
    assert.ok(pkg.devDependencies?.concurrently, 'concurrently must be a declared devDependency');
  });
});

describe('verifyScaffoldStatic — professional structure + css + deploy (§9/§11)', () => {
  const result = scaffoldProduct({ prompt: 'Build a coffee shop website with subscriptions' });

  it('enforces frontend/ + backend/ top-level structure', () => {
    const check = find(verifyScaffoldStatic(result, result.files), 'structure');
    assert.equal(check.status, 'pass', check.evidence);
  });

  it('catches code scattered at the repo root', () => {
    const files = result.files.map((f) => ({ ...f }));
    files.push({ path: 'src/rogue.ts', kind: 'frontend', content: 'export const x = 1;' });
    assert.equal(find(verifyScaffoldStatic(result, files), 'structure').status, 'fail');
  });

  it('passes CSS integrity on a clean generation (styles imported)', () => {
    const check = find(verifyScaffoldStatic(result, result.files), 'css-integrity');
    assert.equal(check.status, 'pass', check.evidence);
  });

  it('detects an unimported stylesheet (the "broken UI" defect)', () => {
    const files = result.files.map((f) => {
      if (f.path === 'frontend/src/main.tsx') return { ...f, content: f.content.replace("import './styles.css';", '') };
      return { ...f };
    });
    const check = find(verifyScaffoldStatic(result, files), 'css-integrity');
    assert.equal(check.status, 'fail');
    assert.match(check.evidence, /never imported/);
  });

  it('detects a deleted stylesheet', () => {
    const files = result.files.map((f) => ({ ...f })).filter((f) => !f.path.endsWith('styles.css'));
    assert.equal(find(verifyScaffoldStatic(result, files), 'css-integrity').status, 'fail');
  });

  it('verifies provider-specific deploy configs (backend + frontend targets)', () => {
    const check = find(verifyScaffoldStatic(result, result.files), 'deploy-ready');
    assert.equal(check.status, 'pass', check.evidence);
    const deploy = result.files.filter((f) => f.path.startsWith('deploy/'));
    assert.ok(deploy.some((f) => /render|aws|digitalocean/i.test(f.path)), 'backend provider target present');
    assert.ok(deploy.some((f) => /vercel|netlify|cloudflare/i.test(f.path)), 'frontend provider target present');
  });

  it('fails deploy-ready when deploy/ is absent', () => {
    const files = result.files.map((f) => ({ ...f })).filter((f) => !f.path.startsWith('deploy/'));
    assert.equal(find(verifyScaffoldStatic(result, files), 'deploy-ready').status, 'fail');
  });

  it('folds a failed frontend build into the verdict', () => {
    const report = buildReport(result, result.files, undefined, { ran: true, passed: 0, failed: 1, detail: 'frontend build FAILED — the UI does not compile' });
    assert.equal(report.verdict, 'incomplete');
    assert.equal(find(report.checks, 'frontend-build').status, 'fail');
    const ok = buildReport(result, result.files, undefined, { ran: true, passed: 1, failed: 0, detail: 'frontend production build succeeded' });
    assert.equal(find(ok.checks, 'frontend-build').status, 'pass');
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
    // Non-mobile build: exactly the mobile-ios check honestly skips.
    assert.equal(complete.skipped, 1);
    const broken = buildReport(result, result.files, { ran: true, passed: 5, failed: 3, detail: '3 failures' });
    assert.equal(broken.verdict, 'incomplete');
  });

  it('mobile builds fold the UI render-proof into the verdict', () => {
    const result = scaffoldProduct({ prompt: 'Build a Cofi Shop Application', mobile: true });
    const uiOk = buildReport(result, result.files, undefined, undefined, { ran: true, passed: 24, failed: 0, detail: 'all routes render' });
    assert.equal(uiOk.verdict, 'complete');
    assert.equal(find(uiOk.checks, 'ui-render').status, 'pass');
    assert.equal(find(uiOk.checks, 'mobile-ios').status, 'pass');
    const uiBroken = buildReport(result, result.files, undefined, undefined, { ran: true, passed: 23, failed: 1, detail: 'one route does not render' });
    assert.equal(uiBroken.verdict, 'incomplete');
    assert.equal(find(uiBroken.checks, 'ui-render').status, 'fail');
  });

  it('mobile-ios static check fails when the Android-only dep leaks in', () => {
    const result = scaffoldProduct({ prompt: 'Build a Cofi Shop Application', mobile: true });
    const files = result.files.map((f) => ({ ...f }));
    const pkg = files.find((f) => f.path === 'package.json')!;
    pkg.content = pkg.content.replace('"@capacitor/ios": "^6.1.0"', '"@capacitor/ios": "^6.1.0", "@capacitor/android": "^6.1.0"');
    const checks = verifyScaffoldStatic(result, files);
    assert.equal(find(checks, 'mobile-ios').status, 'fail');
  });
});
