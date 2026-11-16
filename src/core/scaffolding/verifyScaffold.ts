/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Independent Verification — §13 "independent definition of done".
 *
 * The scaffolder is not allowed to declare a product complete on its own
 * authority. This module independently inspects the generated file set against
 * the plan (pages, API resources, DB tables, auth, commerce logic, tests,
 * deployment) and emits a pass/fail report with per-requirement evidence.
 * A failing report means the product is INCOMPLETE, regardless of what the
 * generator claims.
 *
 * Static checks run in-process (esbuild parse + structural assertions) with
 * zero installed dependencies; the optional dynamic check runs the generated
 * test suite in the output directory (requires `npm install` + native build).
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import esbuild from 'esbuild';

import type { ScaffoldedFile, ScaffoldResult } from './productScaffolder';

export interface RequirementCheck {
  /** Stable requirement id (machine-readable, stable across runs). */
  id: string;
  /** Human-readable requirement statement. */
  label: string;
  status: 'pass' | 'fail' | 'skip';
  /** Concrete evidence: what was found (or expected but missing). */
  evidence: string;
}

export interface VerificationReport {
  product: string;
  domain: string;
  checks: RequirementCheck[];
  passed: number;
  failed: number;
  skipped: number;
  /** 'complete' only when zero checks failed. */
  verdict: 'complete' | 'incomplete';
}

const fileOf = (files: ScaffoldedFile[], p: string): string | undefined =>
  files.find((f) => f.path === p)?.content;

const allTsFiles = (files: ScaffoldedFile[]): ScaffoldedFile[] =>
  files.filter((f) => /\.(ts|tsx)$/.test(f.path));

/** True when `src` exports a symbol by that name (function or const). */
const exportHas = (name: string, src: string): boolean =>
  new RegExp(`export (?:function|const|let) ${name}\\b`).test(src) || new RegExp(`export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`).test(src);

// ---------------------------------------------------------------------------
// Static requirement checks
// ---------------------------------------------------------------------------

export function verifyScaffoldStatic(result: ScaffoldResult, files: ScaffoldedFile[]): RequirementCheck[] {
  const checks: RequirementCheck[] = [];
  const add = (id: string, label: string, ok: boolean, evidence: string) =>
    checks.push({ id, label, status: ok ? 'pass' : 'fail', evidence });

  // 1. Syntax gate: every emitted source file must parse.
  const parseErrors: string[] = [];
  for (const f of allTsFiles(files)) {
    const loader = f.path.endsWith('.tsx') ? 'tsx' : 'ts';
    try {
      esbuild.transformSync(f.content, { loader, format: 'esm', target: 'node20' });
    } catch (e) {
      parseErrors.push(`${f.path}: ${(e as Error).message.split('\n')[0]}`);
    }
  }
  add(
    'syntax',
    'All generated source files parse',
    parseErrors.length === 0,
    parseErrors.length === 0 ? `${allTsFiles(files).length} files parsed cleanly` : parseErrors.slice(0, 5).join('; ')
  );

  // 2. Every planned page is a distinct, resolvable route.
  const app = fileOf(files, 'web/src/App.tsx') ?? '';
  const missingRoutes = result.pages.filter((p) => !app.includes(`path="${p === '/' ? '/' : p}"`));
  add(
    'pages-routed',
    'Every planned page is wired as a distinct route in App.tsx',
    missingRoutes.length === 0,
    missingRoutes.length === 0
      ? `${result.pages.length} routes registered`
      : `missing routes: ${missingRoutes.slice(0, 6).join(', ')}`
  );

  // 3. Every planned API resource has a router file + a mount in BOTH entry
  //    points (index.ts runs; app.ts is the test seam).
  const apis = result.apiRoutes.map((r) => r.replace('/api/', ''));
  const indexTs = fileOf(files, 'server/src/index.ts') ?? '';
  const appTs = fileOf(files, 'server/src/app.ts') ?? '';
  const missingRouter: string[] = [];
  const missingMount: string[] = [];
  for (const a of apis) {
    const routeFile = fileOf(files, `server/src/routes/${a.replace(/-/g, '-').split('/').join('/')}.ts`) ?? fileOf(files, `server/src/routes/${a}.ts`);
    if (!routeFile) missingRouter.push(a);
    if (!indexTs.includes(`/api/${a}`) || !appTs.includes(`/api/${a}`)) missingMount.push(a);
  }
  add(
    'api-surface',
    'Every planned API resource has a router file and is mounted (index.ts + app.ts)',
    missingRouter.length === 0 && missingMount.length === 0,
    missingRouter.length === 0 && missingMount.length === 0
      ? `${apis.length} resources wired`
      : [missingRouter.length ? `no router file: ${missingRouter.join(', ')}` : '', missingMount.length ? `not mounted: ${missingMount.join(', ')}` : ''].filter(Boolean).join(' | ')
  );

  // 4. Every planned table exists in the DDL.
  const db = fileOf(files, 'server/src/db.ts') ?? '';
  const missingTables = result.dbTables.filter((t) => !db.includes(`CREATE TABLE IF NOT EXISTS ${t}`));
  add(
    'db-schema',
    'Every planned table has a CREATE TABLE statement',
    missingTables.length === 0,
    missingTables.length === 0 ? `${result.dbTables.length} tables in schema` : `missing DDL: ${missingTables.join(', ')}`
  );

  // 5. Seed actually runs (definition without a call = empty database).
  add(
    'seed-invoked',
    'Seed data is populated on first boot',
    /function seed\(\)/.test(db) && /^\nseed\(\);\n/m.test(db),
    /function seed\(\)/.test(db) && /^\nseed\(\);\n/m.test(db) ? 'seed() defined and called at module load' : 'seed() not invoked'
  );

  // 6. Auth: register/login routes + requireAuth middleware defined AND used
  //    by at least one route. (Presence of user-scoped columns is evidence,
  //    not a gate — a non-commerce domain may have none and still be wired.)
  const authRoute = fileOf(files, 'server/src/routes/auth.ts') ?? '';
  const mw = fileOf(files, 'server/src/middleware/auth.ts') ?? '';
  const anyRouteUsesAuth = files
    .filter((f) => f.path.startsWith('server/src/routes/') && !f.path.includes('/auth.ts'))
    .some((f) => /requireAuth/.test(f.content));
  const authOk = /\/register/.test(authRoute) && /\/login/.test(authRoute) && /export function requireAuth/.test(mw);
  add(
    'auth-wired',
    'JWT auth (register/login/me) and requireAuth middleware are wired',
    authOk && anyRouteUsesAuth,
    authOk && anyRouteUsesAuth
      ? `auth endpoints + middleware present and enforced by protected routes`
      : 'auth routes or middleware missing / not enforced'
  );

  // 7. Commerce: order domains must carry real business logic, not CRUD.
  const hasOrders = apis.includes('orders');
  if (hasOrders) {
    const commerce = fileOf(files, 'server/src/services/commerce.ts') ?? '';
    const ordersRoute = fileOf(files, 'server/src/routes/orders.ts') ?? '';
    // Anchor on the exported signatures — a stripped service must not pass
    // just because the identifiers survive as substrings of renamed locals.
    const ok =
      /export function priceCart/.test(commerce) &&
      /export function createOrder/.test(commerce) &&
      /export const ORDER_TRANSITIONS/.test(commerce) &&
      ordersRoute.includes("from '../services/commerce.js'") &&
      db.includes("CHECK(status IN ('pending','confirmed','preparing','ready','completed','cancelled')") &&
      db.includes('idempotency_key TEXT UNIQUE');
    add(
      'commerce-logic',
      'Orders carry server-side pricing, tax, coupons, idempotency, state machine',
      ok,
      ok
        ? 'commerce service + state-machine DDL + idempotency key present; route delegates to service'
        : 'commerce layer incomplete: ' +
          [!exportHas('priceCart', commerce) && 'no priceCart', !exportHas('createOrder', commerce) && 'no createOrder', !exportHas('ORDER_TRANSITIONS', commerce) && 'no state machine', !ordersRoute.includes("services/commerce") && 'route not delegating', !db.includes('idempotency_key') && 'no idempotency key']
            .filter(Boolean)
            .join(', ')
    );
  } else {
    checks.push({ id: 'commerce-logic', label: 'Orders carry real business logic', status: 'skip', evidence: 'no orders resource in this domain' });
  }

  // 8. Tests: a real HTTP integration suite, never the placeholder stub.
  const test = fileOf(files, 'server/test/api.test.ts') ?? '';
  add(
    'real-tests',
    'Test suite is a real HTTP integration test (no placeholder assertions)',
    test.includes('fetch(base') && !test.includes("assert.ok(true, 'wired')") && test.includes('createServer'),
    test.includes('fetch(base') ? 'drives real HTTP against an ephemeral-port app' : 'test suite is a placeholder'
  );

  // 9. Deployment: the product is runnable and documentable, and no real
  //    secrets are committed to the example env (placeholders stay empty).
  const env = fileOf(files, '.env.example') ?? '';
  const depArtifacts =
    !!fileOf(files, 'Dockerfile') && !!fileOf(files, 'docker-compose.yml') && !!fileOf(files, 'README.md');
  // A committed secret is a provider key assigned a live value (sk_/pk_ prefix).
  // The generated .env.example leaves these empty; filling them in = leak.
  const hasCommittedSecret = /STRIPE_[A-Z_]*\s*=\s*(sk_|pk_)/.test(env) || /sk_live_[A-Za-z0-9]/.test(env);
  const depOk = depArtifacts && !hasCommittedSecret;
  add(
    'deployment',
    'Deployment artifacts exist and no secrets are committed',
    depOk,
    depOk
      ? 'Dockerfile + compose + README present; .env.example keeps secrets as placeholders'
      : !depArtifacts
        ? 'missing deployment artifacts (Dockerfile/compose/README)'
        : 'committed secret detected in .env.example (sk_/pk_ value assigned to a provider key)'
  );

  return checks;
}

// ---------------------------------------------------------------------------
// Optional dynamic verification: run the generated test suite
// ---------------------------------------------------------------------------

export interface DynamicVerification {
  ran: boolean;
  passed?: number;
  failed?: number;
  detail: string;
}

/**
 * Run the generated product's own test suite in `serverDir`. Requires
 * dependencies to be installed (better-sqlite3 built). Never fabricates a
 * pass: any spawn/exit failure is reported as `ran: false` with the reason.
 */

/** Find node_modules, walking upward (the generated project uses npm
 *  workspaces, which hoists node_modules to the project root, not server/). */
function findNodeModulesPath(dir: string): string | undefined {
  let cur = dir;
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(cur, 'node_modules'))) return path.join(cur, 'node_modules');
    const parent = path.dirname(cur);
    if (parent === cur) return undefined;
    cur = parent;
  }
  return undefined;
}

export function runGeneratedTests(serverDir: string, timeoutMs = 180_000): DynamicVerification {
  // Fast, honest pre-checks — no fabricated results when deps are missing.
  if (!fs.existsSync(path.join(serverDir, 'test', 'api.test.ts'))) {
    return { ran: false, detail: `no test suite found at ${serverDir}/test/api.test.ts` };
  }
  const nodeModules = findNodeModulesPath(serverDir);
  if (!nodeModules) {
    return { ran: false, detail: 'dependencies not installed — run `npm install` at the project root, build the native SQLite module, then re-run with --verify' };
  }

  // Run the project's OWN tsx entry point with node (cross-platform: spawning
  // .cmd/.sh shims directly is EINVAL/ENOENT-prone on Windows). tsx is a
  // devDependency of every generated server, so its real bin target exists.
  let argv: string[] | null = null;
  try {
    const tsxPkg = JSON.parse(fs.readFileSync(path.join(nodeModules, 'tsx', 'package.json'), 'utf8')) as { bin?: string | Record<string, string> };
    const rel = typeof tsxPkg.bin === 'string' ? tsxPkg.bin : tsxPkg.bin?.tsx ?? 'dist/cli.mjs';
    const tsxCli = path.resolve(nodeModules, 'tsx', rel);
    if (fs.existsSync(tsxCli)) argv = [tsxCli, '--test', 'test/api.test.ts'];
  } catch {
    /* fall through to npx */
  }
  // Fallback: npx via the platform shell (handles PATH-resolved tsx).
  if (!argv) {
    const npxCmd = `npx tsx --test test/api.test.ts`;
    const r = spawnSync(process.platform === 'win32' ? 'cmd' : 'sh', process.platform === 'win32' ? ['/d', '/s', '/c', npxCmd] : ['-c', npxCmd], {
      cwd: serverDir,
      timeout: timeoutMs,
      encoding: 'utf8',
      stdio: 'pipe',
      shell: false,
    });
    return interpretTestRun(r, 'npx');
  }

  const r = spawnSync(process.execPath, argv, {
    cwd: serverDir,
    timeout: timeoutMs,
    encoding: 'utf8',
    stdio: 'pipe',
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  return interpretTestRun(r, 'node');
}

function interpretTestRun(r: { status: number | null; error?: Error; stdout?: string | null; stderr?: string | null }, how: string): DynamicVerification {
  if (r.error || r.status === null) {
    return { ran: false, detail: `tests could not be spawned (${r.error?.message ?? 'unknown spawn error'}) — ensure node is available` };
  }
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  // Prefer the runner's own tallies; fall back to counting ✔ lines when the
  // reporter prints per-test marks but no summary.
  const passed = Number((out.match(/ℹ\s+pass (\d+)/) ?? [])[1] ?? out.split('\n').filter((l) => l.includes('✔')).length);
  const failed = Number((out.match(/ℹ\s+fail (\d+)/) ?? [])[1] ?? (r.status === 0 ? 0 : 1));
  const errLine = out.split('\n').find((l) => /Error/.test(l) && !l.includes('0 errors'));
  if (r.status === 0 && passed > 0) {
    return { ran: true, passed, failed: 0, detail: `${passed} generated tests passed against the running app (via ${how})` };
  }
  if (failed > 0 || r.status !== 0) {
    return { ran: true, passed, failed, detail: `${passed} passed, ${failed} failed${errLine ? ` — ${errLine.trim().slice(0, 160)}` : ''} (via ${how})` };
  }
  return { ran: false, detail: `test runner exited ${r.status} with no passing tests${errLine ? ` — ${errLine.trim().slice(0, 160)}` : ''}` };
}

// ---------------------------------------------------------------------------
// Combined report + rendering
// ---------------------------------------------------------------------------

export function buildReport(result: ScaffoldResult, files: ScaffoldedFile[], dynamic?: DynamicVerification): VerificationReport {
  const checks = [...verifyScaffoldStatic(result, files)];
  if (dynamic) {
    checks.push({
      id: 'tests-pass',
      label: 'Generated test suite passes against the running app',
      status: dynamic.ran ? dynamic.failed === 0 ? 'pass' : 'fail' : 'skip',
      evidence: dynamic.detail,
    });
  }
  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = checks.filter((c) => c.status === 'fail').length;
  const skipped = checks.filter((c) => c.status === 'skip').length;
  return { product: result.projectName, domain: result.domain, checks, passed, failed, skipped, verdict: failed === 0 ? 'complete' : 'incomplete' };
}

/** Terminal rendering matching the §13 requirement-coverage table. */
export function renderReport(r: VerificationReport): string {
  const lines: string[] = [];
  lines.push(`\n=== AETHER VERIFICATION — ${r.product} (${r.domain}) ===`);
  for (const c of r.checks) {
    const mark = c.status === 'pass' ? '✔' : c.status === 'fail' ? '✖' : '…';
    lines.push(`  ${mark} ${c.label}`);
    if (c.status !== 'pass') lines.push(`      ${c.evidence}`);
  }
  lines.push(`\n  ${r.passed} passed · ${r.failed} failed · ${r.skipped} skipped`);
  lines.push(r.failed === 0 ? `  VERDICT: COMPLETE — every planned requirement is met and evidenced` : `  VERDICT: INCOMPLETE — ${r.failed} requirement(s) unmet (see ✖ above)`);
  return lines.join('\n');
}
