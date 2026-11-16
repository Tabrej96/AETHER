/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Product Scaffolder — regression tests.
 *
 * Locks in the "professional, multi-page, full-stack" guarantee that the
 * earlier output lacked: a short prompt must produce a STANDALONE project with
 * separate routed pages (not a single-page modal app) AND a real backend.
 * Run via: npx tsx --test src/core/scaffolding/productScaffolder.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { scaffoldProduct } from './productScaffolder';
import { getIndustryByPrompt } from '../marketParity/industryRegistry';

describe('industry detection tiers (regression)', () => {
  it('a concrete domain anchor beats generic capability words', () => {
    // "subscriptions" is a SaaS modifier; "coffee" is a coffee-shop anchor.
    const r = getIndustryByPrompt('Build a coffee shop website with subscriptions and admin');
    assert.equal(r?.industry, 'coffee-shop');
  });

  it('a bare SaaS prompt still resolves to saas', () => {
    const r = getIndustryByPrompt('Build a SaaS subscription dashboard');
    assert.equal(r?.industry, 'saas');
  });

  it('ecommerce stays ecommerce', () => {
    assert.equal(getIndustryByPrompt('Build an e-commerce store')?.industry, 'ecommerce');
  });
});

describe('scaffoldProduct — multi-page full-stack guarantee', () => {
  const res = scaffoldProduct({ prompt: 'Build a coffee shop website with subscriptions' });

  it('targets the coffee_shop domain, not SaaS', () => {
    assert.equal(res.domain, 'coffee_shop');
    assert.equal(res.industry, 'coffee-shop');
  });

  it('emits a standalone project, not the aether-harness monorepo', () => {
    const pkg = res.files.find((f) => f.path === 'package.json');
    assert.ok(pkg, 'must write a root package.json');
    const parsed = JSON.parse(pkg!.content) as Record<string, unknown>;
    assert.notEqual(parsed.name, 'aether-harness');
    // A product has workspaces (server + web), not the harness `bin`/`files`.
    assert.ok(parsed.workspaces, 'workspaces expected for a full-stack product');
  });

  it('separates pages into distinct routes (Subscriptions is its own page)', () => {
    assert.ok(res.pages.length >= 15, `expected many pages, got ${res.pages.length}`);
    assert.ok(res.pages.includes('/customer/subscriptions'), 'subscriptions must be a routed page');
    assert.ok(res.pages.includes('/cart'), 'cart must be a routed page');
    assert.ok(res.pages.some((p) => p.startsWith('/admin/')), 'admin pages must be routed');
    // They must NOT all collapse onto one route.
    const uniqueRoutes = new Set(res.pages);
    assert.equal(uniqueRoutes.size, res.pages.length, 'routes must be unique');
  });

  it('generates a real backend (Express + SQLite + auth + REST routes + schema)', () => {
    const serverFiles = res.files.filter((f) => f.path.startsWith('backend/'));
    const has = (p: string) => serverFiles.some((f) => f.path === p);
    assert.ok(has('backend/package.json'));
    assert.ok(has('backend/src/index.ts'));
    assert.ok(has('backend/src/db.ts'));
    assert.ok(has('backend/src/middleware/auth.ts'));
    assert.ok(has('backend/src/routes/auth.ts'));
    assert.ok(has('backend/src/routes/menu.ts'));
    assert.ok(has('backend/src/routes/orders.ts'));
    assert.ok(has('backend/src/routes/subscriptions.ts'));
    assert.ok(has('backend/src/routes/admin.ts'));

    // The DB layer is a real SQLite schema + seed, not an in-memory benchmark stub.
    const db = res.files.find((f) => f.path === 'backend/src/db.ts')!.content;
    assert.match(db, /better-sqlite3/);
    assert.match(db, /CREATE TABLE IF NOT EXISTS/);
    assert.match(db, /INSERT INTO menu_items/);
    // The API surface is a real REST router, not `res.json({ page })` stubs.
    // Order writes go through the commerce service (server-side pricing +
    // idempotency + state machine), so the INSERT lives in commerce.ts.
    const orders = res.files.find((f) => f.path === 'backend/src/routes/orders.ts')!.content;
    assert.match(orders, /from '\.\.\/services\/commerce\.js'/);
    assert.match(orders, /requireAuth/);
    const commerce = res.files.find((f) => f.path === 'backend/src/services/commerce.ts')!.content;
    assert.match(commerce, /INSERT INTO orders/);
  });

  it('uses React Router on the frontend (real routing, not one modals page)', () => {
    const app = res.files.find((f) => f.path === 'frontend/src/App.tsx')!.content;
    assert.match(app, /react-router-dom/);
    assert.match(app, /<Route /);
    const webPkg = JSON.parse(
      res.files.find((f) => f.path === 'frontend/package.json')!.content
    ) as Record<string, unknown>;
    assert.ok(webPkg.dependencies, 'web has dependencies');
  });

  it('ships deployment + env + docs for a deployable product', () => {
    const paths = res.files.map((f) => f.path);
    assert.ok(paths.includes('docker-compose.yml'));
    assert.ok(paths.includes('Dockerfile'));
    assert.ok(paths.includes('.env.example'));
    assert.ok(paths.includes('README.md'));
  });

  it('wires the admin router into the running entry (index.ts)', () => {
    const index = res.files.find((f) => f.path === 'backend/src/index.ts')!.content;
    assert.match(index, /import { adminRouter } from '\.\/routes\/admin\.js'/);
    assert.match(index, /app\.use\('\/api\/admin', adminRouter\)/);
  });

  it('seeds each table idempotently (guarded by its own count)', () => {
    const db = res.files.find((f) => f.path === 'backend/src/db.ts')!.content;
    // Primary resource seeded by ITS OWN table count, not by the users count.
    assert.match(db, /pcount === 0/);
    // Admin user seeded by the users count.
    assert.match(db, /acount === 0/);
    assert.match(db, /INSERT INTO menu_items/);
  });

  it('actually calls seed() so a fresh DB is populated', () => {
    const db = res.files.find((f) => f.path === 'backend/src/db.ts')!.content;
    // The seed function must be invoked at module load, not just defined.
    assert.match(db, /^\nseed\(\);\n/m);
    assert.ok(db.includes('function seed()'));
  });

  it('professional top-level structure: frontend/ + backend/ + deploy/', () => {
    const roots = new Set(res.files.map((f) => f.path.split('/')[0]).filter(Boolean));
    assert.ok(roots.has('frontend'), 'frontend/ workspace');
    assert.ok(roots.has('backend'), 'backend/ workspace');
    assert.ok(roots.has('deploy'), 'deploy/ provider configs');
    // No code scattered at the top level (src/, lib/, server/, web/ forbidden).
    for (const bad of ['src', 'lib', 'server', 'web']) assert.ok(!roots.has(bad), `no top-level ${bad}/`);
  });

  it('ships real provider deploy configs (backend + frontend targets)', () => {
    const deploy = res.files.filter((f) => f.path.startsWith('deploy/')).map((f) => f.path);
    assert.ok(deploy.some((p) => /render/i.test(p)), 'Render backend blueprint');
    assert.ok(deploy.some((p) => /aws/i.test(p)), 'AWS ECS task definition');
    assert.ok(deploy.some((p) => /digitalocean/i.test(p)), 'DigitalOcean guide');
    assert.ok(deploy.some((p) => /vercel/i.test(p)), 'Vercel frontend config');
    assert.ok(deploy.some((p) => /netlify/i.test(p)), 'Netlify frontend config');
    assert.ok(deploy.some((p) => /cloudflare/i.test(p)), 'Cloudflare Pages config');
    // Secrets stay out of the configs: JWT must be generated or env-var, not hardcoded.
    const render = res.files.find((f) => f.path === 'deploy/render/backend.yml')!.content;
    assert.match(render, /generateValue|sync: false/);
  });

  it('imports global CSS from the app entry (no unstyled UI)', () => {
    const main = res.files.find((f) => f.path === 'frontend/src/main.tsx')!.content;
    assert.match(main, /import ['"]\.\/styles\.css['"]/);
  });

  it('backend serves the built frontend with an SPA fallback (single-container deploy)', () => {
    const index = res.files.find((f) => f.path === 'backend/src/index.ts')!.content;
    assert.match(index, /express\.static\(dist\)/);
    assert.match(index, /sendFile\(path\.join\(dist, 'index\.html'\)\)/);
    // ESM-safe: no __dirname in emitted ESM code.
    assert.doesNotMatch(index, /__dirname/);
  });

  it('root workspaces point at backend/ + frontend/', () => {
    const pkg = JSON.parse(res.files.find((f) => f.path === 'package.json')!.content) as Record<string, unknown>;
    assert.deepEqual(pkg.workspaces, ['backend', 'frontend']);
    assert.match(JSON.stringify(pkg.scripts), /-w backend/);
  });

  it('frontend honours VITE_API_BASE for split-provider deploys', () => {
    const api = res.files.find((f) => f.path === 'frontend/src/lib/api.ts')!.content;
    assert.match(api, /import\.meta\.env\.VITE_API_BASE/);
  });
});

describe('scaffoldProduct — commerce service layer (real business logic)', () => {
  const coffee = scaffoldProduct({ prompt: 'Build a coffee shop website with subscriptions' });
  const saas = scaffoldProduct({ prompt: 'Build a SaaS analytics dashboard' });

  it('emits a commerce service + commerce-backed orders route for order domains', () => {
    const svc = coffee.files.find((f) => f.path === 'backend/src/services/commerce.ts');
    assert.ok(svc, 'commerce service expected');
    const c = svc!.content;
    assert.match(c, /export function priceCart/);
    assert.match(c, /export function createOrder/);
    assert.match(c, /ORDER_TRANSITIONS/);
    assert.match(c, /export function transitionOrder/);
    // Orders route must use the service, not trust client totals.
    const orders = coffee.files.find((f) => f.path === 'backend/src/routes/orders.ts')!.content;
    assert.match(orders, /from '\.\.\/services\/commerce\.js'/);
    assert.doesNotMatch(orders, /price_cents \?\? 0 \* Number/, 'must not sum client-supplied prices');
  });

  it('does NOT emit a commerce service for non-order domains', () => {
    assert.ok(!saas.files.some((f) => f.path === 'backend/src/services/commerce.ts'));
    // But every domain still gets a real test suite.
    assert.ok(saas.files.some((f) => f.path === 'backend/test/api.test.ts'));
  });

  it('the orders DDL has a state machine + idempotency key', () => {
    const db = coffee.files.find((f) => f.path === 'backend/src/db.ts')!.content;
    assert.match(db, /status TEXT NOT NULL DEFAULT 'pending' CHECK\(status IN \('pending','confirmed','preparing','ready','completed','cancelled'\)\)/);
    assert.match(db, /idempotency_key TEXT UNIQUE/);
  });

  it('the generated test suite is a real HTTP integration test (no placeholders)', () => {
    const t = coffee.files.find((f) => f.path === 'backend/test/api.test.ts')!.content;
    assert.doesNotMatch(t, /assert\.ok\(true, 'wired'\)/, 'placeholder assertion must be gone');
    assert.match(t, /fetch\(base \+ path/, 'tests must drive real HTTP');
    assert.match(t, /Idempotency-Key/, 'must test idempotent replays');
    assert.match(t, /illegal\.status, 409/, 'must test the state machine');
    assert.match(t, /WELCOME10/, 'must test the seeded coupon path');
    assert.match(t, /process\.env\.DATABASE_FILE/, 'must use an isolated test DB');
  });

  it('documents the commerce env vars (demo vs production)', () => {
    const env = coffee.files.find((f) => f.path === '.env.example')!.content;
    assert.match(env, /TAX_BPS=/);
    assert.match(env, /PRODUCTION/);
    assert.match(env, /DEMO/);
  });
});
