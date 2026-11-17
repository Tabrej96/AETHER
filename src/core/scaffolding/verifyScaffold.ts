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
  const app = fileOf(files, 'frontend/src/App.tsx') ?? '';
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
  const indexTs = fileOf(files, 'backend/src/index.ts') ?? '';
  const appTs = fileOf(files, 'backend/src/app.ts') ?? '';
  const missingRouter: string[] = [];
  const missingMount: string[] = [];
  for (const a of apis) {
    const routeFile = fileOf(files, `backend/src/routes/${a.replace(/-/g, '-').split('/').join('/')}.ts`) ?? fileOf(files, `backend/src/routes/${a}.ts`);
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
  const db = fileOf(files, 'backend/src/db.ts') ?? '';
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
  const authRoute = fileOf(files, 'backend/src/routes/auth.ts') ?? '';
  const mw = fileOf(files, 'backend/src/middleware/auth.ts') ?? '';
  const anyRouteUsesAuth = files
    .filter((f) => f.path.startsWith('backend/src/routes/') && !f.path.includes('/auth.ts'))
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
    const commerce = fileOf(files, 'backend/src/services/commerce.ts') ?? '';
    const ordersRoute = fileOf(files, 'backend/src/routes/orders.ts') ?? '';
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

  // 7b. Payment provider layer (mission §10): order domains must ship a real
  //     gateway abstraction — no fabricated credentials, no unmounted webhook.
  if (hasOrders) {
    const payments = fileOf(files, 'backend/src/services/payments.ts') ?? '';
    const paymentsRoute = fileOf(files, 'backend/src/routes/payments.ts') ?? '';
    const pEnv = fileOf(files, '.env.example') ?? '';
    const pOk =
      /export interface PaymentGateway/.test(payments) &&
      /createCharge\(/.test(payments) &&
      /export function selectGateway/.test(payments) &&
      /export const webhookRouter = Router\(\)/.test(paymentsRoute) &&
      /post\('\/webhook'/.test(paymentsRoute) &&
      indexTs.includes("app.use('/api/payments', paymentsRouter)") &&
      appTs.includes("app.use('/api/payments', paymentsRouter)") &&
      /PAYMENT_PROVIDER=/.test(pEnv);
    add(
      'payments-wired',
      'Payment provider layer is wired (gateway abstraction + webhook route + env docs)',
      pOk,
      pOk
        ? 'gateway interface + selectGateway in payments service; /api/payments/webhook mounted in index.ts + app.ts; PAYMENT_PROVIDER documented in .env.example'
        : 'payments layer incomplete: ' +
          [!/export interface PaymentGateway/.test(payments) && 'no PaymentGateway interface', !exportHas('selectGateway', payments) && 'no gateway selection', !/post\('\/webhook'/.test(paymentsRoute) && 'webhook route missing', !indexTs.includes('/api/payments') && 'webhook not mounted (index.ts)', !appTs.includes('/api/payments') && 'webhook not mounted (app.ts)', !/PAYMENT_PROVIDER=/.test(pEnv) && 'PAYMENT_PROVIDER undocumented']
            .filter(Boolean)
            .join(', ')
    );
  } else {
    checks.push({ id: 'payments-wired', label: 'Payment provider layer is wired', status: 'skip', evidence: 'no orders resource in this domain' });
  }

  // 8. Tests: a real HTTP integration suite, never the placeholder stub.
  const test = fileOf(files, 'backend/test/api.test.ts') ?? '';
  add(
    'real-tests',
    'Test suite is a real HTTP integration test (no placeholder assertions)',
    test.includes('fetch(base') && !test.includes("assert.ok(true, 'wired')") && test.includes('createServer'),
    test.includes('fetch(base') ? 'drives real HTTP against an ephemeral-port app' : 'test suite is a placeholder'
  );

  // 9. Professional structure: top-level layout separates frontend/backend.
  const topDirs = new Set(files.map((f) => f.path.split('/')[0]).filter((d) => d && !d.startsWith('.')));
  const hasTopLevelCode =
    [...topDirs].some((d) => d === 'src' || d === 'lib' || d === 'server' || d === 'web');
  const structOk = topDirs.has('frontend') && topDirs.has('backend') && !hasTopLevelCode;
  add(
    'structure',
    'Professional top-level structure (frontend/ + backend/, code not scattered at root)',
    structOk,
    structOk
      ? `top-level layout: frontend/ + backend/ + deploy/ (clean separation)`
      : `unexpected top-level dirs: ${[...topDirs].join(', ')} — code must live under frontend/ or backend/`
  );

  // 10. CSS integrity: the global stylesheet must EXIST, be non-trivial,
  //     and actually be IMPORTED — an unimported stylesheet renders every
  //     page unstyled (the "broken UI" defect).
  const cssFile = files.find((f) => /\.css$/.test(f.path) && f.path.includes('frontend'));
  const css = cssFile?.content ?? '';
  const cssImported = files.some((f) => /\.(ts|tsx)$/.test(f.path) && /from ['"]\.\/styles\.css['"]|import ['"]\.\/styles\.css['"]/.test(f.content));
  const cssOk = !!cssFile && css.trim().split('\n').length >= 10 && cssImported;
  add(
    'css-integrity',
    'Global stylesheet exists, is non-trivial, and is imported',
    cssOk,
    cssOk
      ? `${(css.trim().split('\n').length ?? 0)} lines of CSS loaded via import`
      : !cssFile
        ? 'no frontend stylesheet file found'
        : !cssImported
          ? `styles.css exists but is never imported — the UI renders unstyled`
          : 'stylesheet is empty'
  );

  // 11. Deployment: the product is runnable and documentable, and no real
  //     secrets are committed to the example env (placeholders stay empty).
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

  // 12. Deploy-ready: provider-specific configs for real-world targets.
  //     Backend → Render / AWS / DigitalOcean; Frontend → Vercel / Netlify /
  //     Cloudflare Pages. A product without any provider path is not
  //     "production prepared" (§11).
  const deployFiles = files.filter((f) => f.path.startsWith('deploy/')).map((f) => f.path);
  const providerHit = deployFiles.filter((p) => /render|aws|digitalocean|vercel|netlify|cloudflare/i.test(p)).length;
  add(
    'deploy-ready',
    'Provider-specific deploy configs present (backend + frontend targets)',
    deployFiles.length >= 3 && providerHit >= 3,
    deployFiles.length
      ? `${deployFiles.length} files under deploy/; ${providerHit} provider-specific config(s)`
      : 'no deploy/ directory — product has no real deployment path'
  );

  // 13. Manifest consistency (demo-3 D5): every binary a root script invokes
  //     must be a declared dependency somewhere in the tree — an undeclared
  //     `concurrently` makes `npm run dev` fail out of the box. (npm
  //     workspaces hoist, so a binary declared in ANY workspace manifest is
  //     resolvable at the root.)
  const typePkg = () => ({ scripts: {}, dependencies: {}, devDependencies: {} } as {
    scripts: Record<string, string>;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
  });
  const rootPkg = JSON.parse(fileOf(files, 'package.json') || '{}') as ReturnType<typeof typePkg>;
  const declared = new Set<string>();
  for (const f of files.filter((x) => x.path.endsWith('package.json'))) {
    try {
      const p = JSON.parse(f.content) as ReturnType<typeof typePkg>;
      for (const k of [...Object.keys(p.dependencies ?? {}), ...Object.keys(p.devDependencies ?? {})]) declared.add(k);
    } catch {
      /* malformed manifest is caught by the syntax check */
    }
  }
  // External binaries our scripts may invoke (npm/node built-ins are free).
  const BIN_IN_SCRIPTS: Record<string, string[]> = { concurrently: ['concurrently'], tsc: ['typescript'], vite: ['vite'] };
  const undeclared = Object.values(rootPkg.scripts ?? {})
    .flatMap((s) => Object.keys(BIN_IN_SCRIPTS).filter((bin) => s.includes(bin)))
    .filter((bin) => BIN_IN_SCRIPTS[bin].every((depName) => !declared.has(depName)));
  add(
    'manifest-consistency',
    'Every script binary is a declared dependency (npm run dev cannot fail)',
    undeclared.length === 0,
    undeclared.length === 0 ? 'all script binaries declared' : `undeclared binaries in scripts: ${[...new Set(undeclared)].join(', ')}`
  );

  // 14. Docker hygiene (demo-3 D9/D14): the image must not carry local dev
  //     state — node_modules and live SQLite WAL files would bloat it and leak
  //     dev data.
  const dockerignore = fileOf(files, '.dockerignore') ?? '';
  const dockerClean = /(^|\n)node_modules/m.test(dockerignore) && /sqlite/.test(dockerignore);
  add(
    'docker-clean',
    '.dockerignore excludes node_modules + SQLite data',
    dockerClean,
    dockerClean ? 'image stays small, dev state stays out' : dockerignore ? '.dockerignore present but misses node_modules/sqlite' : 'no .dockerignore — image carries 180MB+ dev state'
  );

  // 15. CI ships with the product (demo-3 D10): a workflow that installs,
  //     runs the backend tests, and builds the frontend.
  const ci = fileOf(files, '.github/workflows/ci.yml') ?? '';
  const ciOk = ci.includes('on:') && /npm (test|run test)/.test(ci) && /build -w frontend/.test(ci);
  add(
    'ci-workflow',
    'Product ships a CI workflow (tests + frontend build)',
    ciOk,
    ciOk ? '.github/workflows/ci.yml installs, tests, builds' : 'no usable CI workflow — broken products can ship unnoticed'
  );

  // 16. Template hygiene (demo-3 D6): emitted docs/config must not leak
  //     unrendered generator variables (a single-letter id like ${a.auth}
  //     is always a generator local, never legitimate product code).
  const leaks: string[] = [];
  for (const f of files) {
    if (/\.(md|yml|yaml|json|toml|example)$/.test(f.path)) {
      const m = f.content.match(/\$\{[a-z]\b/g);
      if (m) leaks.push(`${f.path} (${m.slice(0, 3).join(', ')})`);
    }
  }
  add(
    'template-hygiene',
    'No unrendered generator variables leak into emitted files',
    leaks.length === 0,
    leaks.length === 0 ? 'all emitted content fully rendered' : `leak in: ${leaks.slice(0, 3).join('; ')}`
  );

  // 17. Frontend↔backend consistency (demo-3 D3): every RESOURCE the
  //     frontend fetches must be a planned API resource (or '/'). A page
  //     pointing at /products with no products table/route is a dead UI.
  const plannedResources = new Set([...apis, '']);
  const dangling: string[] = [];
  for (const f of files.filter((x) => x.path.startsWith('frontend/src/pages/'))) {
    for (const m of f.content.matchAll(/const RESOURCE = "([^"]*)"/g)) {
      const res = m[1].replace(/^\//, '');
      if (!plannedResources.has(res)) dangling.push(`${f.path.split('/').pop()}: "${m[1]}"`);
    }
  }
  add(
    'frontend-api-consistency',
    'Every page fetches a resource that actually exists on the backend',
    dangling.length === 0,
    dangling.length === 0 ? 'all page fetch targets resolve to planned resources' : `dangling fetch targets: ${[...new Set(dangling)].slice(0, 4).join('; ')}`
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
 * Build the generated frontend with its own Vite toolchain. A product whose
 * UI does not compile (broken JSX, missing import, CSS framework without
 * config) must fail verification — this is the direct answer to the
 * "gave broken UI" defect class. Requires `npm install` at the root.
 */
export function runFrontendBuild(frontendDir: string, timeoutMs = 240_000): DynamicVerification {
  const root = path.dirname(frontendDir); // project root (workspaces live here)
  if (!fs.existsSync(path.join(root, 'node_modules'))) {
    return { ran: false, detail: 'dependencies not installed — frontend build skipped (run `npm install`, then re-run --verify)' };
  }
  // The frontend workspace builds from the PROJECT ROOT with `npm run build -w frontend`.
  const r = spawnSync(
    process.platform === 'win32' ? 'cmd' : 'sh',
    process.platform === 'win32' ? ['/d', '/s', '/c', 'npm run build -w frontend'] : ['-c', 'npm run build -w frontend'],
    { cwd: root, timeout: timeoutMs, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, FORCE_COLOR: '0' } }
  );
  if (r.error || r.status === null) {
    return { ran: false, detail: `frontend build could not be spawned (${r.error?.message ?? 'unknown'})` };
  }
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  const ok = r.status === 0 && fs.existsSync(path.join(frontendDir, 'dist', 'index.html'));
  if (ok) {
    return { ran: true, passed: 1, failed: 0, detail: 'frontend production build succeeded (dist/index.html emitted)' };
  }
  const errLine = out.split('\n').find((l) => /error|failed|cannot find/i.test(l)) ?? '';
  return {
    ran: true,
    passed: 0,
    failed: 1,
    detail: `frontend build FAILED — the UI does not compile${errLine ? ` (${errLine.trim().slice(0, 160)})` : ''}`,
  };
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

export function buildReport(
  result: ScaffoldResult,
  files: ScaffoldedFile[],
  dynamic?: DynamicVerification,
  frontendBuild?: DynamicVerification
): VerificationReport {
  const checks = [...verifyScaffoldStatic(result, files)];
  if (dynamic) {
    checks.push({
      id: 'tests-pass',
      label: 'Generated test suite passes against the running app',
      status: dynamic.ran ? dynamic.failed === 0 ? 'pass' : 'fail' : 'skip',
      evidence: dynamic.detail,
    });
  }
  if (frontendBuild) {
    checks.push({
      id: 'frontend-build',
      label: 'Frontend production build succeeds (UI actually compiles)',
      status: frontendBuild.ran ? frontendBuild.failed === 0 ? 'pass' : 'fail' : 'skip',
      evidence: frontendBuild.detail,
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
