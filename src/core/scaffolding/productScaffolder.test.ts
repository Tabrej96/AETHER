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
    const serverFiles = res.files.filter((f) => f.path.startsWith('server/'));
    const has = (p: string) => serverFiles.some((f) => f.path === p);
    assert.ok(has('server/package.json'));
    assert.ok(has('server/src/index.ts'));
    assert.ok(has('server/src/db.ts'));
    assert.ok(has('server/src/middleware/auth.ts'));
    assert.ok(has('server/src/routes/auth.ts'));
    assert.ok(has('server/src/routes/menu.ts'));
    assert.ok(has('server/src/routes/orders.ts'));
    assert.ok(has('server/src/routes/subscriptions.ts'));
    assert.ok(has('server/src/routes/admin.ts'));

    // The DB layer is a real SQLite schema + seed, not an in-memory benchmark stub.
    const db = res.files.find((f) => f.path === 'server/src/db.ts')!.content;
    assert.match(db, /better-sqlite3/);
    assert.match(db, /CREATE TABLE IF NOT EXISTS/);
    assert.match(db, /INSERT INTO menu_items/);
    // And the API surface is a real REST router, not `res.json({ page })` stubs.
    const orders = res.files.find((f) => f.path === 'server/src/routes/orders.ts')!.content;
    assert.match(orders, /INSERT INTO orders/);
    assert.match(orders, /requireAuth/);
  });

  it('uses React Router on the frontend (real routing, not one modals page)', () => {
    const app = res.files.find((f) => f.path === 'web/src/App.tsx')!.content;
    assert.match(app, /react-router-dom/);
    assert.match(app, /<Route /);
    const webPkg = JSON.parse(
      res.files.find((f) => f.path === 'web/package.json')!.content
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
    const index = res.files.find((f) => f.path === 'server/src/index.ts')!.content;
    assert.match(index, /import { adminRouter } from '\.\/routes\/admin\.js'/);
    assert.match(index, /app\.use\('\/api\/admin', adminRouter\)/);
  });

  it('seeds each table idempotently (guarded by its own count)', () => {
    const db = res.files.find((f) => f.path === 'server/src/db.ts')!.content;
    // Primary resource seeded by ITS OWN table count, not by the users count.
    assert.match(db, /pcount === 0/);
    // Admin user seeded by the users count.
    assert.match(db, /acount === 0/);
    assert.match(db, /INSERT INTO menu_items/);
  });

  it('actually calls seed() so a fresh DB is populated', () => {
    const db = res.files.find((f) => f.path === 'server/src/db.ts')!.content;
    // The seed function must be invoked at module load, not just defined.
    assert.match(db, /^\nseed\(\);\n/m);
    assert.ok(db.includes('function seed()'));
  });
});

describe('scaffoldProduct — other domains', () => {
  it('a SaaS prompt scaffolds a SaaS product', () => {
    const res = scaffoldProduct({ prompt: 'Build a SaaS analytics dashboard' });
    assert.equal(res.domain, 'saas');
    assert.ok(res.files.some((f) => f.path === 'server/src/db.ts'));
    assert.ok(res.files.some((f) => f.path === 'web/src/App.tsx'));
  });
});
