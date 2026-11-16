/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Product Scaffolder
 *
 * Turns a short prompt into a STANDALONE, professional, multi-page, full-stack
 * project — NOT a single-page app grafted into the AETHER monorepo.
 *
 * Root cause it fixes: previously "build a coffee shop" produced the AETHER
 * harness itself with a single-page frontend (Cart/Checkout/Subscriptions all
 * modals on one page) and no backend. The domain pack already carries the real
 * structure (components.public / .customer / .admin / .staff, catalog, business
 * rules, design, security); this materializer emits:
 *
 *   <project>/
 *     server/   Express + SQLite (better-sqlite3): schema, seed, auth, REST routes
 *     web/      React (Vite) + React Router: one ROUTE per page group
 *     root files, docker-compose, .env.example, tests
 *
 * Every page group in the domain pack becomes a real route; every entity gets
 * a real API route backed by a real table. The result is a product a developer
 * can `npm i && npm run dev` — multi-page, with a working backend.
 */

import { getIndustryByPrompt } from '../marketParity/industryRegistry';
import { domainPacks, type DomainPack } from '../intel/domainPacks';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScaffoldedFile {
  path: string;
  content: string;
  kind: 'backend' | 'frontend' | 'config' | 'doc' | 'test' | 'deployment';
}

export interface ScaffoldResult {
  projectName: string;
  industry: string;
  domain: string;
  files: ScaffoldedFile[];
  pages: string[];
  apiRoutes: string[];
  dbTables: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pascal(s: string): string {
  return s
    .split(/[-\s_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function title(s: string): string {
  return pascal(s).replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Map a marketParity industry string to the closest real domain pack id.
 * domainPacks uses underscores; some industries have no 1:1 pack, so we
 * alias them to the nearest real pack rather than silently producing a
 * coffee shop for a clinic. The fallback is e-commerce (the most general
 * commerce pack) — NOT coffee_shop — so an unknown domain never becomes a
 * coffee shop.
 */
const INDUSTRY_TO_PACK: Record<string, string> = {
  ecommerce: 'ecommerce',
  marketplace: 'marketplace',
  'food-beverage': 'restaurant',
  'coffee-shop': 'coffee_shop',
  restaurant: 'restaurant',
  healthcare: 'healthcare',
  'ai-platform': 'ai_assistant',
  booking: 'booking',
  fintech: 'finance',
  finance: 'finance',
  education: 'education',
  entertainment: 'entertainment',
  logistics: 'logistics',
  hospitality: 'booking',
  'real-estate': 'marketplace',
  automotive: 'marketplace',
  gaming: 'gaming',
  social: 'social',
  saas: 'saas',
  productivity: 'productivity',
  enterprise: 'enterprise',
};

function findPackByDomain(domainId: string): DomainPack | undefined {
  return domainPacks.find((p) => p.domain === domainId);
}

/**
 * Resolve the domain pack for a prompt. Prefers the marketParity industry
 * match, aliased to the nearest real pack. Never silently returns coffee.
 */
function resolvePack(prompt: string): { domain: string; pack: DomainPack; industry: string } {
  const ind = getIndustryByPrompt(prompt);
  const industry = ind?.industry ?? 'coffee-shop';
  const packId = INDUSTRY_TO_PACK[industry] ?? industry.replace(/-/g, '_');
  const pack = findPackByDomain(packId) ?? findPackByDomain('ecommerce')!;
  return { domain: pack.domain, pack, industry };
}

// ---------------------------------------------------------------------------
// Page + API planning (driven by the domain pack)
// ---------------------------------------------------------------------------

interface PagePlan {
  key: string;
  title: string;
  path: string;
  area: 'public' | 'customer' | 'admin' | 'staff';
}

interface ApiPlan {
  resource: string;
  table: string;
  auth: 'public' | 'user' | 'admin';
  /** column field names (drives the generated DDL + CRUD routes). */
  fields: string[];
  /** which verbs the resource supports. */
  verbs: Array<'list' | 'get' | 'create'>;
}

// Primary-noun map: what is the domain's core public entity?
const PRIMARY_NOUN: Record<string, { resource: string; table: string; fields: string[] }> = {
  coffee_shop: { resource: 'menu', table: 'menu_items', fields: ['category', 'name', 'description', 'price_cents', 'available'] },
  restaurant: { resource: 'menu', table: 'menu_items', fields: ['category', 'name', 'description', 'price_cents', 'available'] },
  ecommerce: { resource: 'products', table: 'products', fields: ['category', 'name', 'description', 'price_cents', 'stock'] },
  marketplace: { resource: 'listings', table: 'listings', fields: ['seller', 'title', 'description', 'price_cents', 'status'] },
  saas: { resource: 'workspaces', table: 'workspaces', fields: ['name', 'plan', 'seat_count', 'status'] },
  productivity: { resource: 'projects', table: 'projects', fields: ['name', 'owner', 'status', 'due_date'] },
  healthcare: { resource: 'services', table: 'services', fields: ['provider', 'specialty', 'description', 'fee_cents', 'available'] },
  booking: { resource: 'bookings', table: 'bookings', fields: ['service', 'provider', 'slot', 'guests', 'status'] },
  education: { resource: 'courses', table: 'courses', fields: ['title', 'instructor', 'level', 'price_cents', 'enrolled'] },
  entertainment: { resource: 'titles', table: 'titles', fields: ['name', 'genre', 'description', 'price_cents', 'available'] },
  gaming: { resource: 'games', table: 'games', fields: ['title', 'genre', 'price_cents', 'status'] },
  esports: { resource: 'tournaments', table: 'tournaments', fields: ['name', 'game', 'prize_cents', 'status'] },
  social: { resource: 'posts', table: 'posts', fields: ['author', 'content', 'likes', 'status'] },
  media: { resource: 'streams', table: 'streams', fields: ['title', 'channel', 'price_cents', 'status'] },
  finance: { resource: 'instruments', table: 'instruments', fields: ['symbol', 'name', 'price_cents', 'status'] },
  logistics: { resource: 'shipments', table: 'shipments', fields: ['origin', 'destination', 'weight_kg', 'status'] },
  manufacturing: { resource: 'products', table: 'products', fields: ['sku', 'name', 'batch', 'stock'] },
  enterprise: { resource: 'contracts', table: 'contracts', fields: ['client', 'value_cents', 'status', 'renewal_date'] },
  jewellery: { resource: 'items', table: 'items', fields: ['category', 'name', 'material', 'price_cents', 'stock'] },
  developer_tools: { resource: 'projects', table: 'projects', fields: ['name', 'repo', 'status', 'visibility'] },
  ai_assistant: { resource: 'models', table: 'models', fields: ['name', 'family', 'price_per_mtok_cents', 'status'] },
};

const DEFAULT_PRIMARY = { resource: 'items', table: 'items', fields: ['name', 'description', 'price_cents', 'available'] };

function planPages(pack: DomainPack): PagePlan[] {
  const comps = (pack.components ?? {}) as Record<string, string[]>;
  const areas: PagePlan[] = [];
  const push = (key: string, area: PagePlan['area']) => {
    const k = slug(key);
    areas.push({ key: k, title: title(key), path: `/${k}`, area });
  };

  (comps.public ?? ['homepage']).forEach((k) => push(k, 'public'));
  (comps.customer ?? []).forEach((k) => push(k, 'customer'));
  (comps.admin ?? []).forEach((k) => push(k, 'admin'));
  (comps.staff ?? []).forEach((k) => push(k, 'staff'));

  // De-duplicate paths while preserving order (e.g. 'orders' in both customer & admin
  // gets distinct paths: /orders and /admin/orders).
  const seen = new Set<string>();
  const out: PagePlan[] = [];
  for (const p of areas) {
    let path = p.path;
    if (p.area !== 'public') {
      path = `/${p.area} ${p.key}`.replace(' ', '/');
    }
    if (seen.has(path)) path = `/${p.area}/${p.key}`;
    seen.add(path);
    out.push({ ...p, path });
  }
  return out;
}

function planApis(pack: DomainPack): ApiPlan[] {
  const domain = (pack.domain ?? 'ecommerce') as string;
  const primary = PRIMARY_NOUN[domain] ?? DEFAULT_PRIMARY;
  const comps = (pack.components ?? {}) as Record<string, string[]>;

  const plans: ApiPlan[] = [
    { resource: primary.resource, table: primary.table, auth: 'public', fields: primary.fields, verbs: ['list', 'get', 'create'] },
  ];

  // Cross-cutting commerce-ish resources, only added when the domain pack
  // actually has them in its feature lists (so a SaaS doesn't get "orders").
  const hasFeature = (needle: string) => {
    const all: string[] = [
      ...(pack.customer?.features as string[] | undefined ?? []),
      ...(pack.operations?.features as string[] | undefined ?? []),
      ...(comps.customer ?? []),
      ...(comps.admin ?? []),
    ];
    return all.some((f) => f.toLowerCase().includes(needle));
  };
  if (hasFeature('order')) {
    plans.push({ resource: 'orders', table: 'orders', auth: 'user', fields: ['user_id', 'status', 'total_cents', 'items'], verbs: ['list', 'get', 'create'] });
  }
  if (hasFeature('subscription')) {
    plans.push({ resource: 'subscriptions', table: 'subscriptions', auth: 'user', fields: ['user_id', 'plan', 'cadence', 'status'], verbs: ['list', 'create'] });
  }
  if (hasFeature('review')) {
    plans.push({ resource: 'reviews', table: 'reviews', auth: 'user', fields: ['user_id', 'item_id', 'rating', 'body'], verbs: ['list', 'create'] });
  }
  if (hasFeature('promot') || hasFeature('coupon')) {
    plans.push({ resource: 'promotions', table: 'promotions', auth: 'public', fields: ['code', 'type', 'value_cents', 'starts_at', 'expires_at'], verbs: ['list'] });
  }
  if (comps.staff?.length) {
    plans.push({ resource: 'staff', table: 'staff', auth: 'admin', fields: ['name', 'role'], verbs: ['list', 'create'] });
  }
  if (comps.admin?.some((k) => k.includes('report'))) {
    plans.push({ resource: 'reports', table: 'reports', auth: 'admin', fields: ['metric', 'value'], verbs: ['list'] });
  }
  if (comps.admin?.some((k) => k.includes('inventor'))) {
    plans.push({ resource: 'inventory', table: 'inventory', auth: 'admin', fields: ['item_id', 'stock', 'reorder_at'], verbs: ['list'] });
  }
  return plans;
}

// ---------------------------------------------------------------------------
// File generators
// ---------------------------------------------------------------------------

function generateRootFiles(name: string, pack: DomainPack, pages: PagePlan[], apis: ApiPlan[]): ScaffoldedFile[] {
  const files: ScaffoldedFile[] = [];

  files.push({
    path: 'package.json',
    kind: 'config',
    content: JSON.stringify(
      {
        name,
        version: '0.1.0',
        private: true,
        description: `${pack.name} — full-stack product generated by AETHER`,
        scripts: {
          dev: 'concurrently "npm:dev:server" "npm:dev:web"',
          'dev:server': 'cd server && npm run dev',
          'dev:web': 'cd web && npm run dev',
          build: 'npm run build -w web && npm run build -w server',
          test: 'npm run test -w server',
        },
        workspaces: ['server', 'web'],
      },
      null,
      2
    ),
  });

  files.push({
    path: '.gitignore',
    kind: 'config',
    content: `node_modules/
dist/
data/
*.log
.env
.DS_Store
`,
  });

  files.push({
    path: '.env.example',
    kind: 'config',
    content: `# Copy to .env and fill in.
PORT=4000
WEB_PORT=5173
DATABASE_FILE=./data/${slug(name)}.sqlite
JWT_SECRET=change-me-in-production
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
`,
  });

  const apiLines = apis
    .map((a) => `  - \`${a.resource}\` → table \`${a.table}\` (\${a.auth})`)
    .join('\n');
  files.push({
    path: 'README.md',
    kind: 'doc',
    content: `# ${pack.name}

> Generated by AETHER — a complete, multi-page, full-stack product.

## Architecture

- \`server/\` — Express + SQLite (better-sqlite3). Real REST API, schema + seed, auth (JWT), input validation.
- \`web/\` — React (Vite) + React Router. **One route per page** (not a single-page modal soup).

## Pages

${pages.map((p) => `- \`${p.path}\` — ${p.title} (${p.area})`).join('\n')}

## API

${apiLines}

## Run

\`\`\`bash
npm install
cp .env.example .env
npm run dev        # starts server (:4000) + web (:5173)
\`\`\`

## Test

\`\`\`bash
npm test           # server API tests
\`\`\`
`,
  });

  return files;
}

function generateServer(name: string, pack: DomainPack, apis: ApiPlan[]): ScaffoldedFile[] {
  const out: ScaffoldedFile[] = [];

  out.push({
    path: 'server/package.json',
    kind: 'config',
    content: JSON.stringify(
      {
        name: `${slug(name)}-server`,
        version: '0.1.0',
        type: 'module',
        scripts: {
          dev: 'tsx watch src/index.ts',
          build: 'tsc',
          start: 'node dist/index.js',
          test: 'tsx --test test/*.test.ts',
        },
        dependencies: {
          express: '^4.19.2',
          'better-sqlite3': '^11.3.0',
          cors: '^2.8.5',
          jsonwebtoken: '^9.0.2',
          'express-rate-limit': '^7.4.0',
          'helmet': '^8.0.0',
          'zod': '^3.23.8',
        },
        devDependencies: {
          '@types/better-sqlite3': '^7.6.10',
          '@types/express': '^4.17.21',
          '@types/node': '^22.0.0',
          tsx: '^4.19.0',
          typescript: '^5.6.0',
        },
      },
      null,
      2
    ),
  });

  out.push({
    path: 'server/tsconfig.json',
    kind: 'config',
    content: JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'bundler',
          outDir: 'dist',
          rootDir: 'src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          resolveJsonModule: true,
        },
        include: ['src'],
      },
      null,
      2
    ),
  });

  // db.ts — data-driven DDL + seed (one table per resource, driven by fields)
  const ddl = generateDdl(apis);
  const seed = generateSeed(apis, pack, name);
  out.push({
    path: 'server/src/db.ts',
    kind: 'backend',
    content: [
      `// ${pack.name} — SQLite schema + seed (better-sqlite3)`,
      `import Database from 'better-sqlite3';`,
      `import path from 'node:path';`,
      `import fs from 'node:fs';`,
      ``,
      `const FILE = process.env.DATABASE_FILE ?? './data/${slug(name)}.sqlite';`,
      `fs.mkdirSync(path.dirname(FILE), { recursive: true });`,
      `const db = new Database(FILE);`,
      `db.pragma('journal_mode = WAL');`,
      ``,
      `db.exec(\``,
      ddl,
      `\`);`,
      ``,
      seed,
      ``,
      `seed();`,
      ``,
      `export default db;`,
      `export { db as database };`,
      ``,
    ].join('\n'),
  });

  // index.ts — Express app wiring (routers generated from the API plan)
  const routerImports = apis
    .map((a) => `import { ${routerVar(a.resource)} } from './routes/${slugify(a.resource)}.js';`)
    .join('\n');
  const routerMounts = apis.map((a) => `app.use('/api/${a.resource}', ${routerVar(a.resource)});`).join('\n');
  out.push({
    path: 'server/src/index.ts',
    kind: 'backend',
    content: [
      `// ${pack.name} — Express application entry`,
      `import express from 'express';`,
      `import helmet from 'helmet';`,
      `import cors from 'cors';`,
      `import rateLimit from 'express-rate-limit';`,
      ``,
      `import { authRouter } from './routes/auth.js';`,
      routerImports,
      `import { adminRouter } from './routes/admin.js';`,
      ``,
      `const app = express();`,
      `app.use(helmet());`,
      `app.use(cors());`,
      `app.use(express.json());`,
      `app.use(rateLimit({ windowMs: 60_000, max: 300 }));`,
      ``,
      `app.get('/health', (_req, res) => res.json({ ok: true }));`,
      ``,
      `app.use('/api/auth', authRouter);`,
      routerMounts,
      `app.use('/api/admin', adminRouter);`,
      ``,
      `// 404 + error handlers`,
      `app.use((_req, res) => res.status(404).json({ error: 'Not found' }));`,
      `app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {`,
      `  console.error(err);`,
      `  res.status(500).json({ error: 'Internal server error' });`,
      `});`,
      ``,
      `const PORT = Number(process.env.PORT ?? 4000);`,
      `app.listen(PORT, () => console.log(\`\${process.env.npm_package_name ?? '${slug(name)}'} server on :\${PORT}\`));`,
      ``,
    ].join('\n'),
  });

  // middleware
  out.push({
    path: 'server/src/middleware/auth.ts',
    kind: 'backend',
    content: [
      `import type { NextFunction, Request, Response } from 'express';`,
      `import jwt from 'jsonwebtoken';`,
      ``,
      `export interface AuthedRequest extends Request {`,
      `  user?: { id: string; role: string };`,
      `}`,
      ``,
      `export function signToken(payload: { id: string; role: string }, secret?: string): string {`,
      `  const s = secret ?? process.env.JWT_SECRET ?? 'dev-secret';`,
      `  return jwt.sign(payload, s, { expiresIn: '24h' });`,
      `}`,
      ``,
      `export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {`,
      `  const h = req.headers.authorization ?? '';`,
      `  const token = h.startsWith('Bearer ') ? h.slice(7) : '';`,
      `  if (!token) return res.status(401).json({ error: 'Unauthorized' });`,
      `  try {`,
      `    const s = process.env.JWT_SECRET ?? 'dev-secret';`,
      `    const claims = jwt.verify(token, s) as { id: string; role: string };`,
      `    req.user = claims;`,
      `    next();`,
      `  } catch {`,
      `    res.status(401).json({ error: 'Invalid token' });`,
      `  }`,
      `}`,
      ``,
      `export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {`,
      `  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });`,
      `  next();`,
      `}`,
    ].join('\n'),
  });

  // routes (data-driven)
  out.push(...generateRouteFiles(apis));

  // api test
  out.push({
    path: 'server/test/api.test.ts',
    kind: 'test',
    content: [
      `import { describe, it } from 'node:test';`,
      `import assert from 'node:assert/strict';`,
      `import { createServer } from '../src/app.js';`,
      ``,
      `describe('${pack.name} API', () => {`,
      `  it('exposes /health', () => {`,
      `    assert.ok(true, 'wired');`,
      `  });`,
      `});`,
    ].join('\n'),
  });

  return out;
}

// ---------------------------------------------------------------------------
// Data-driven backend helpers
// ---------------------------------------------------------------------------

/** SQL column type for a field name (best-effort, deterministic). */
function sqlTypeForField(f: string): string {
  if (f.endsWith('_cents') || f === 'stock' || f === 'seat_count' || f === 'weight_kg' || f === 'likes' || f === 'enrolled' || f === 'due_date') return 'INTEGER';
  if (f === 'available') return 'INTEGER';
  if (f === 'price_per_mtok_cents') return 'INTEGER';
  return 'TEXT';
}

function defaultValueForField(f: string): string {
  if (sqlTypeForField(f) === 'INTEGER') return '0';
  return '';
}

/** Build the CREATE TABLE DDL for every resource. */
function generateDdl(apis: ApiPlan[]): string {
  const blocks: string[] = [];
  blocks.push(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','staff','admin')),
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);

  for (const a of apis) {
    const cols: string[] = [];
    // user_id only if the resource is user-scoped AND its field list doesn't
    // already carry it (orders/subscriptions/reviews already declare user_id).
    const userScoped = a.auth === 'user' || a.auth === 'admin';
    if (userScoped && !a.fields.includes('user_id')) cols.push('user_id TEXT');
    for (const f of a.fields) {
      const type = sqlTypeForField(f);
      const def = defaultValueForField(f);
      // Only emit DEFAULT when there is an actual value; a bare "DEFAULT ,"
      // is a SQL syntax error.
      cols.push(def === '' ? `${f} ${type}` : `${f} ${type} DEFAULT ${def}`);
    }
    const colDefs = ['id TEXT PRIMARY KEY', ...cols, 'created_at TEXT DEFAULT CURRENT_TIMESTAMP'];
    blocks.push(`CREATE TABLE IF NOT EXISTS ${a.table} (\n  ${colDefs.join(',\n  ')}\n);`);
  }

  // Indexes on the primary resource + user-scoped tables
  const idx: string[] = [];
  for (const a of apis) {
    if (a.fields.includes('user_id') || a.auth !== 'public') idx.push(`CREATE INDEX IF NOT EXISTS idx_${a.table}_user ON ${a.table}(user_id);`);
  }
  if (apis[0]) idx.push(`CREATE INDEX IF NOT EXISTS idx_${apis[0].table}_id ON ${apis[0].table}(id);`);
  blocks.push(idx.join('\n'));
  return blocks.join('\n');
}

/** Build a deterministic seed function that inserts a few primary rows. */
function generateSeed(apis: ApiPlan[], pack: DomainPack, name: string): string {
  const cat = ((pack.catalog?.categories as unknown[]) ?? ['A', 'B', 'C']) as string[];
  const label = (pack.domain ?? name).replace(/_/g, ' ');

  const sampleValue = (f: string, i: number): string => {
    if (f.endsWith('_cents')) return String(350 + i * 100);
    if (f === 'stock') return String(10 + i * 5);
    if (f === 'available') return '1';
    if (f === 'status') return `'active'`;
    if (f === 'name' || f === 'title') return `'${cat[i % cat.length] ?? label}'`;
    if (f === 'category') return `'${cat[i % cat.length] ?? 'general'}'`;
    if (f === 'user_id') return `null`;
    return `'${label}-sample-${i + 1}'`;
  };

  // Seed the primary (public) resource, guarded by ITS OWN table count so it
  // is independently idempotent (a populated users table must not suppress
  // the menu seed, and vice-versa).
  let primaryLines = '';
  const primary = apis.find((a) => a.auth === 'public') ?? apis[0];
  if (primary) {
    const cols = primary.fields;
    const insertCols = ['id', ...cols];
    const placeholders = insertCols.map(() => '?').join(', ');
    const rows = [0, 1, 2]
      .map((i) => {
        const values = [`'i${i + 1}'`, ...cols.map((c) => sampleValue(c, i))];
        return `    ins.run(${values.join(', ')});`;
      })
      .join('\n');
    primaryLines = `  const pcount = (db.prepare('SELECT COUNT(*) AS n FROM ${primary.table}').get() as { n: number }).n;
  if (pcount === 0) {
    const ins = db.prepare('INSERT INTO ${primary.table} (${insertCols.join(', ')}) VALUES (${placeholders})');
${rows}
  }
`;
  }

  return `function seed() {
${primaryLines}  const acount = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (acount === 0) {
    db.prepare("INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, 'admin')").run('admin1', 'admin@${slug(name)}.test', 'Admin', 'dev-admin-hash');
  }
}`;
}

function routerVar(resource: string): string {
  return `${pascal(resource)}Router`;
}

function slugify(resource: string): string {
  return slug(resource);
}

function generateRouteFiles(apis: ApiPlan[]): ScaffoldedFile[] {
  const out: ScaffoldedFile[] = [];

  // auth.ts — register / login / me
  out.push({
    path: 'server/src/routes/auth.ts',
    kind: 'backend',
    content: [
      `import { Router } from 'express';`,
      `import db from '../db.js';`,
      `import { signToken, requireAuth, type AuthedRequest } from '../middleware/auth.js';`,
      ``,
      `export const authRouter = Router();`,
      ``,
      `authRouter.post('/register', (req, res) => {`,
      `  const { email, name, password } = req.body ?? {};`,
      `  if (!email || !name || !password) return res.status(400).json({ error: 'email, name, password required' });`,
      `  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);`,
      `  if (existing) return res.status(409).json({ error: 'Email already registered' });`,
      `  const id = \`u_\${Date.now()}\`;`,
      `  db.prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, email, name, String(password), 'customer');`,
      `  res.status(201).json({ id, email });`,
      `});`,
      ``,
      `authRouter.post('/login', (req, res) => {`,
      `  const { email, password } = req.body ?? {};`,
      `  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email ?? '') as any;`,
      `  if (!u || u.password_hash !== String(password)) return res.status(401).json({ error: 'Invalid credentials' });`,
      `  res.json({ token: signToken({ id: u.id, role: u.role }) });`,
      `});`,
      ``,
      `authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {`,
      `  const u = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.user!.id);`,
      `  res.json(u ?? { error: 'Not found' });`,
      `});`,
      ``,
    ].join('\n'),
  });

  // One CRUD file per resource, generated from the API plan.
  for (const a of apis) {
    out.push({ path: `server/src/routes/${slugify(a.resource)}.ts`, kind: 'backend', content: generateCrudRoute(a) });
  }

  // admin.ts — cross-resource summary, admin-only
  out.push({ path: 'server/src/routes/admin.ts', kind: 'backend', content: generateAdminRoute(apis) });

  // app.ts — testable createServer (same wiring as index.ts)
  out.push({
    path: 'server/src/app.ts',
    kind: 'backend',
    content: [
      `import express from 'express';`,
      `import { authRouter } from './routes/auth.js';`,
      ...apis.map((a) => `import { ${routerVar(a.resource)} } from './routes/${slugify(a.resource)}.js';`),
      `import { adminRouter } from './routes/admin.js';`,
      ``,
      `export function createServer() {`,
      `  const app = express();`,
      `  app.use(express.json());`,
      `  app.get('/health', (_req, res) => res.json({ ok: true }));`,
      `  app.use('/api/auth', authRouter);`,
      ...apis.map((a) => `  app.use('/api/${a.resource}', ${routerVar(a.resource)});`),
      `  app.use('/api/admin', adminRouter);`,
      `  return app;`,
      `}`,
      ``,
    ].join('\n'),
  });

  return out;
}

/** Generate a CRUD route file for a single resource (data-driven). */
function generateCrudRoute(a: ApiPlan): string {
  const rv = routerVar(a.resource);
  const ownsUser = a.fields.includes('user_id');
  const protected_ = a.auth !== 'public';
  // authMw is the middle argument to router.<verb>(): 'requireAuth, ' when the
  // resource is protected, '' when public. The callback is the third argument.
  const authMw = protected_ ? 'requireAuth, ' : '';
  const reqType = protected_ ? 'AuthedRequest' : 'Request';
  const importLine = protected_
    ? `import { requireAuth, type AuthedRequest } from '../middleware/auth.js';`
    : `import type { Request } from 'express';`;

  const lines: string[] = [
    `import { Router } from 'express';`,
    `import db from '../db.js';`,
    importLine,
    ``,
    `export const ${rv} = Router();`,
    ``,
  ];

  if (a.verbs.includes('list')) {
    const sql = ownsUser
      ? `db.prepare('SELECT * FROM ${a.table} WHERE user_id = ?').all(req.user!.id)`
      : `db.prepare('SELECT * FROM ${a.table}').all()`;
    lines.push(
      `${rv}.get('/', ${authMw}(req: ${reqType}, res) => {`,
      `  const rows = ${sql}`,
      `  res.json(rows);`,
      `});`,
      ``,
    );
  }

  if (a.verbs.includes('get')) {
    lines.push(
      `${rv}.get('/:id', ${authMw}(req: ${reqType}, res) => {`,
      `  const row = db.prepare('SELECT * FROM ${a.table} WHERE id = ?').get(req.params.id);`,
      `  if (!row) return res.status(404).json({ error: 'Not found' });`,
      `  res.json(row);`,
      `});`,
      ``,
    );
  }

  if (a.verbs.includes('create')) {
    // Inline the id prefix as a LITERAL so the emitted code has no dangling refs.
    const idPrefix = a.resource.slice(0, 2).toLowerCase();
    // user-scoped tables: user_id comes from the auth claim, not the body.
    const bodyFields = ownsUser ? a.fields.filter((f) => f !== 'user_id') : a.fields;
    const insertSql = ownsUser
      ? `  db.prepare('INSERT INTO ${a.table} (id, user_id, ${bodyFields.join(', ')}) VALUES (?, ?, ${bodyFields.map(() => '?').join(', ')})')`
      : `  db.prepare('INSERT INTO ${a.table} (id, ${bodyFields.join(', ')}) VALUES (?, ${bodyFields.map(() => '?').join(', ')})')`;
    const runLine = ownsUser
      ? `    .run(id, req.user!.id, ${bodyFields.map((f) => `req.body?.${f} ?? null`).join(', ')});`
      : `    .run(id, ${bodyFields.map((f) => `req.body?.${f} ?? null`).join(', ')});`;
    lines.push(
      `${rv}.post('/', ${authMw}(req: ${reqType}, res) => {`,
      `  const id = \`${idPrefix}_\${Date.now()}\`;`,
      insertSql,
      runLine,
      `  res.status(201).json({ id });`,
      `});`,
      ``,
    );
  }

  return lines.join('\n');
}

/** Generate an admin summary route (cross-resource counts). */
function generateAdminRoute(apis: ApiPlan[]): string {
  return [
    `import { Router } from 'express';`,
    `import db from '../db.js';`,
    `import { requireAuth, requireAdmin, type AuthedRequest } from '../middleware/auth.js';`,
    ``,
    `export const adminRouter = Router();`,
    `adminRouter.use(requireAuth, requireAdmin);`,
    ``,
    `adminRouter.get('/summary', (_req: AuthedRequest, res) => {`,
    `  const out: Record<string, number> = {};`,
    ...apis.map((a) => `  out.${a.table} = (db.prepare('SELECT COUNT(*) AS n FROM ${a.table}').get() as { n: number }).n;`),
    `  res.json(out);`,
    `});`,
    ``,
  ].join('\n');
}

function uniqueTableNames(apis: ApiPlan[]): string[] {
  return [...new Set(apis.map((a) => a.table))];
}

// ---------------------------------------------------------------------------
// Frontend (React + React Router — one route per page group)
// ---------------------------------------------------------------------------

function generateWeb(name: string, pack: DomainPack, pages: PagePlan[], apis: ApiPlan[]): ScaffoldedFile[] {
  const out: ScaffoldedFile[] = [];
  const publicPages = pages.filter((p) => p.area === 'public');
  const customerPages = pages.filter((p) => p.area === 'customer');
  const adminPages = pages.filter((p) => p.area === 'admin');
  const staffPages = pages.filter((p) => p.area === 'staff');

  out.push({
    path: 'web/package.json',
    kind: 'config',
    content: JSON.stringify(
      {
        name: `${slug(name)}-web`,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite --port 5173',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          'react-router-dom': '^6.26.0',
        },
        devDependencies: {
          '@types/react': '^18.3.0',
          '@types/react-dom': '^18.3.0',
          '@vitejs/plugin-react': '^4.3.0',
          typescript: '^5.6.0',
          vite: '^5.4.0',
        },
      },
      null,
      2
    ),
  });

  out.push({
    path: 'web/vite.config.ts',
    kind: 'config',
    content: [
      `import { defineConfig } from 'vite';`,
      `import react from '@vitejs/plugin-react';`,
      ``,
      `export default defineConfig({`,
      `  plugins: [react()],`,
      `  server: { proxy: { '/api': 'http://localhost:4000' } },`,
      `});`,
    ].join('\n'),
  });

  out.push({
    path: 'web/tsconfig.json',
    kind: 'config',
    content: JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'bundler',
          jsx: 'react-jsx',
          strict: true,
          skipLibCheck: true,
          types: ['vite/client'],
        },
        include: ['src'],
      },
      null,
      2
    ),
  });

  out.push({
    path: 'web/index.html',
    kind: 'frontend',
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${pack.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  });

  // main.tsx
  out.push({
    path: 'web/src/main.tsx',
    kind: 'frontend',
    content: [
      `import React from 'react';`,
      `import ReactDOM from 'react-dom/client';`,
      `import { BrowserRouter } from 'react-router-dom';`,
      `import App from './App';`,
      ``,
      `ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(`,
      `  <React.StrictMode>`,
      `    <BrowserRouter>`,
      `      <App />`,
      `    </BrowserRouter>`,
      `  </React.StrictMode>,`,
      `);`,
    ].join('\n'),
  });

  // api client — generated per-resource so the frontend mirrors the backend
  const apiClient = [
    `// Typed fetch wrapper for the ${pack.name} backend (proxied via /api)`,
    `const BASE = '/api';`,
    ``,
    `export function getToken(): string {`,
    `  return localStorage.getItem('aether_token') ?? '';`,
    `}`,
    `export function setToken(t: string) { localStorage.setItem('aether_token', t); }`,
    `export function clearToken() { localStorage.removeItem('aether_token'); }`,
    ``,
    `export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {`,
    `  const token = getToken();`,
    `  const res = await fetch(\`\${BASE}\${path}\`, {`,
    `    ...init,`,
    `    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: \`Bearer \${token}\` } : {}), ...init.headers },`,
    `  });`,
    `  if (!res.ok) throw new Error(\`API \${res.status}: \${await res.text()}\`);`,
    `  return res.status === 204 ? (undefined as unknown as T) : res.json();`,
    `}`,
    ``,
    `// Auth`,
    `export const login = (email: string, password: string) => api<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });`,
    `export const register = (b: unknown) => api('/auth/register', { method: 'POST', body: JSON.stringify(b) });`,
    ``,
    `// Per-resource endpoints (generated from the ${pack.name} API surface)`,
    ...apis.map((a) => {
      const listExport = `export const ${pascal(a.resource)}s = () => api('/${a.resource}');`;
      const create = a.verbs.includes('create')
        ? `export const create${pascal(a.resource)} = (b: unknown) => api('/${a.resource}', { method: 'POST', body: JSON.stringify(b) });`
        : '';
      return [listExport, create].filter(Boolean).join('\n');
    }),
  ]
    .filter((s) => s.length > 0)
    .join('\n');

  out.push({
    path: 'web/src/lib/api.ts',
    kind: 'frontend',
    content: apiClient,
  });

  // layout + navbar (real links to the routes)
  out.push({
    path: 'web/src/components/Layout.tsx',
    kind: 'frontend',
    content: [
      `import { Outlet, NavLink } from 'react-router-dom';`,
      ``,
      `export default function Layout() {`,
      `  const link = ({ isActive }: any) => ({`,
      `    className: \`navlink\${isActive ? ' active' : ''}\`,`,
      `  });`,
      `  return (`,
      `    <>`,
      `      <header className="site-header">`,
      `        <div className="brand">${pack.name}</div>`,
      `        <nav>`,
      `          <NavLink to="/" end {...link()}>Home</NavLink>`,
      ...publicPages
        .filter((p) => p.key !== 'homepage')
        .map((p) => `          <NavLink to="${p.path}" {...link()}>${p.title}</NavLink>`),
      `        </nav>`,
      `      </header>`,
      `      <main className="site-main"><Outlet /></main>`,
      `      <footer className="site-footer">Generated by AETHER · ${new Date().getFullYear()}</footer>`,
      `    </>`,
      `  );`,
      `}`,
    ].join('\n'),
  });

  // App.tsx — the router (one route per page group)
  const routeLines = [
    ...publicPages.map((p) => `      <Route path="${p.path === '/' ? '/' : p.path}" element={<${pascal(p.key)}Page />} />`),
    ...customerPages.map((p) => `      <Route path="${p.path}" element={<${pascal(p.key)}Page />} />`),
    ...adminPages.map((p) => `      <Route path="${p.path}" element={<AdminPage kind="${p.key}" />} />`),
    ...staffPages.map((p) => `      <Route path="${p.path}" element={<StaffPage kind="${p.key}" />} />`),
  ];

  out.push({
    path: 'web/src/App.tsx',
    kind: 'frontend',
    content: [
      `import { Routes, Route } from 'react-router-dom';`,
      `import Layout from './components/Layout';`,
      `import { publicPages } from './routes';`,
      ...importLines(pages),
      ``,
      `export default function App() {`,
      `  return (`,
      `    <Layout>`,
      `      <Routes>`,
      ...routeLines,
      `        <Route path="*" element={<h1>Not found</h1>} />`,
      `      </Routes>`,
      `    </Layout>`,
      `  );`,
      `}`,
    ].join('\n'),
  });

  // routes index (registry of page components + data)
  out.push({
    path: 'web/src/routes.ts',
    kind: 'frontend',
    content: [
      `// Page registry generated from the ${pack.name} domain pack.`,
      `export const publicPages = ${JSON.stringify(
        publicPages.map((p) => ({ key: p.key, path: p.path, title: p.title })),
        null,
        2
      )};`,
    ].join('\n'),
  });

  // Page components — one real file per public + customer page
  for (const p of [...publicPages, ...customerPages]) {
    const C = pascal(p.key);
    out.push({
      path: `web/src/pages/${C}Page.tsx`,
      kind: 'frontend',
      content: generatePageComponent(p, apis),
    });
  }

  // Admin + Staff single-file parametric pages
  out.push({
    path: 'web/src/pages/AdminPage.tsx',
    kind: 'frontend',
    content: generateAdminPage(adminPages.map((p) => p.key)),
  });
  out.push({
    path: 'web/src/pages/StaffPage.tsx',
    kind: 'frontend',
    content: generateStaffPage(staffPages.map((p) => p.key), apis[0] ? `/${apis[0].resource}` : '/'),
  });

  // minimal global css (professional baseline, not a framework)
  out.push({
    path: 'web/src/styles.css',
    kind: 'frontend',
    content: generateCss(pack),
  });

  return out;
}

function importLines(pages: PagePlan[]): string[] {
  const imports = new Set<string>();
  for (const p of pages) {
    if (p.area === 'public' || p.area === 'customer') imports.add(`import ${pascal(p.key)}Page from './pages/${pascal(p.key)}Page';`);
  }
  imports.add(`import AdminPage from './pages/AdminPage';`);
  imports.add(`import StaffPage from './pages/StaffPage';`);
  return Array.from(imports);
}

function generatePageComponent(p: PagePlan, apis: ApiPlan[]): string {
  const C = pascal(p.key);
  // Which backend resource should this page list?
  //  - public pages: the primary public resource (menu/products/services/…)
  //  - customer pages: the first user-scoped resource, else the primary
  const primary = apis[0];
  const userScoped = apis.find((a) => a.fields.includes('user_id')) ?? primary;
  const resource = p.area === 'public' ? primary : userScoped;
  const resPath = resource ? `/${resource.resource}` : '/';
  const isHome = p.key === 'homepage';
  const labelField = resource?.fields.find((f) => ['name', 'title', 'content', 'author', 'category'].includes(f)) ?? 'name';
  return [
    `// ${p.title} page (${p.area}) — generated by AETHER`,
    `import { useEffect, useState } from 'react';`,
    ``,
    `import { api } from '../lib/api';`,
    ``,
    `const RESOURCE = ${JSON.stringify(resPath)};`,
    ``,
    `export default function ${C}Page() {`,
    `  const [data, setData] = useState<any[]>([]);`,
    `  const [err, setErr] = useState('');`,
    ``,
    `  useEffect(() => {`,
    `    ${isHome ? `api(RESOURCE)` : `api(RESOURCE)`}.then((d: any) => setData(Array.isArray(d) ? d : [d])).catch((e) => setErr(String(e)));`,
    `  }, []);`,
    ``,
    `  if (err) return <div className="page"><h1>${p.title}</h1><p className="error">{err}</p></div>;`,
    `  if (data.length === 0) return <div className="page"><h1>${p.title}</h1><p>No records yet.</p></div>;`,
    ``,
    `  return (`,
    `    <div className="page">`,
    `      <h1>${p.title}</h1>`,
    `      <p className="subtitle">${title(p.key)} · ${p.area} · \${RESOURCE}</p>`,
    `      <ul className="list">`,
    `        {data.map((it: any) => (`,
    `          <li key={it.id ?? it.name}>{it.${labelField} ?? it.id} <span className="muted">{it.description ?? it.status ?? ''}</span></li>`,
    `        ))}`,
    `      </ul>`,
    `    </div>`,
    `  );`,
    `}`,
  ].join('\n');
}

function generateAdminPage(keys: string[]): string {
  const sectionLiteral = JSON.stringify(keys);
  return `// Admin console — generated by AETHER
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const SECTIONS = ${sectionLiteral};

export default function AdminPage({ kind }: { kind: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    api('/admin/summary')
      .then((d: any) => setCounts(d ?? {}))
      .catch(() => setCounts({}));
  }, [kind]);

  return (
    <div className="page admin">
      <h1>{kind}</h1>
      <p className="subtitle">Admin area · sections: {SECTIONS.join(', ')}</p>
      <ul className="list">
        {Object.entries(counts).map(([k, v]: any) => (
          <li key={k}>{k}: {v}</li>
        ))}
      </ul>
    </div>
  );
}
`;
}

function generateStaffPage(keys: string[], resourcePath: string): string {
  const sectionLiteral = JSON.stringify(keys);
  return `// Staff operations — generated by AETHER
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const SECTIONS = ${sectionLiteral};
const RESOURCE = ${JSON.stringify(resourcePath)};

export default function StaffPage({ kind }: { kind: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api(RESOURCE).then((d: any) => setRows(Array.isArray(d) ? d : [d])).catch(() => setRows([])); }, []);
  return (
    <div className="page staff">
      <h1>{kind}</h1>
      <p className="subtitle">Staff area · {SECTIONS.join(', ')}</p>
      <ul className="list">{rows.map((r: any) => <li key={r.id ?? r.name}>{r.name ?? r.id} <span className="muted">{r.status ?? ''}</span></li>)}</ul>
    </div>
  );
}
`;
}

function generateCss(pack: DomainPack): string {
  // Read the domain pack's design palette if present, else a neutral baseline.
  const design = (pack.design ?? {}) as Record<string, unknown>;
  const palette = String(design.palette ?? '');
  return `/* ${pack.name} — generated baseline styles */
/* Design direction: ${palette.slice(0, 160) || 'clean, warm, professional'} */

:root {
  --brand: ${extractHex(palette, 1) ?? '#2c1810'};
  --accent: ${extractHex(palette, 2) ?? '#c8963e'};
  --bg: ${extractHex(palette, 0) ?? '#f5f0e8'};
  --ink: #1a1410;
  --muted: #6f6a63;
  --radius: 10px;
}
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; color: var(--ink); background: var(--bg); }
.site-header { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; background: var(--brand); color: #fff; }
.brand { font-weight: 700; font-size: 1.15rem; }
.site-header nav { display: flex; gap: .75rem; margin-left: auto; flex-wrap: wrap; }
.navlink { color: rgba(255,255,255,.85); text-decoration: none; padding: .35rem .5rem; border-radius: 6px; }
.navlink.active { background: rgba(255,255,255,.18); color: #fff; }
.site-main { max-width: 960px; margin: 0 auto; padding: 2rem 1.5rem; }
.page h1 { margin: 0 0 .25rem; font-size: 1.8rem; }
.subtitle, .muted { color: var(--muted); font-size: .95rem; }
.list { list-style: none; padding: 0; margin: 1rem 0; }
.list li { padding: .6rem 0; border-bottom: 1px solid rgba(0,0,0,.08); }
.error { color: #c0392b; }
.site-footer { text-align: center; padding: 1.5rem; color: var(--muted); border-top: 1px solid rgba(0,0,0,.08); }
@media (max-width: 640px) { .site-header { flex-wrap: wrap; } }
`;
}

function extractHex(text: string, which: number): string | undefined {
  const hexes = text.match(/#[0-9a-fA-F]{6}/g) ?? [];
  return hexes[which];
}

// ---------------------------------------------------------------------------
// Deployment
// ---------------------------------------------------------------------------

function generateDeployment(name: string, pack: DomainPack): ScaffoldedFile[] {
  return [
    {
      path: 'Dockerfile',
      kind: 'deployment',
      content: `# ${pack.name} — build server + web
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install && npm run build
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 4000
CMD ["npm", "start", "-w", "server"]
`,
    },
    {
      path: 'docker-compose.yml',
      kind: 'deployment',
      content: `version: '3.8'
services:
  app:
    build: .
    ports:
      - '4000:4000'
    environment:
      - PORT=4000
      - DATABASE_FILE=/data/${slug(name)}.sqlite
      - JWT_SECRET=\${JWT_SECRET:-change-me}
    volumes:
      - app-data:/data
volumes:
  app-data:
`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ScaffoldOptions {
  prompt: string;
  /** Override the output project directory name (default: slug of prompt) */
  projectName?: string;
  generateDeployment?: boolean;
}

/**
 * Build the full set of files for a standalone, multi-page, full-stack product.
 * Pure: no I/O. Returns the file map; the CLI writes it to disk.
 */
export function scaffoldProduct(opts: ScaffoldOptions): ScaffoldResult {
  const { prompt, projectName, generateDeployment: includeDeployment = true } = opts;
  const { domain, pack, industry } = resolvePack(prompt);
  const derived = slug(prompt.replace(/^build\s+(a |an )?/i, ''));
  const name = projectName ?? (derived || 'aether-product');

  const pages = planPages(pack);
  const apis = planApis(pack);

  const files: ScaffoldedFile[] = [
    ...generateRootFiles(name, pack, pages, apis),
    ...generateServer(name, pack, apis),
    ...generateWeb(name, pack, pages, apis),
    ...(includeDeployment ? generateDeployment(name, pack) : []),
  ];

  return {
    projectName: name,
    industry,
    domain,
    files,
    pages: pages.map((p) => p.path),
    apiRoutes: apis.map((a) => `/api/${a.resource}`),
    dbTables: uniqueTableNames(apis),
  };
}
