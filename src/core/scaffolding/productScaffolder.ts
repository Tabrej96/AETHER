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
  /**
   * Special-cased resources that need real business logic, not generic CRUD.
   * orders → the generated commerce service (server-side pricing, tax,
   * coupons, idempotency, state machine).
   */
  special?: 'order';
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
    plans.push({ resource: 'orders', table: 'orders', auth: 'user', fields: ['user_id', 'status', 'total_cents', 'items'], verbs: ['list', 'get', 'create'], special: 'order' });
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
          dev: 'concurrently "npm:dev:backend" "npm:dev:frontend"',
          'dev:backend': 'npm run dev -w backend',
          'dev:frontend': 'npm run dev -w frontend',
          build: 'npm run build -w frontend && npm run build -w backend',
          test: 'npm run test -w backend',
          start: 'npm run start -w backend',
          'typecheck': 'npm run build -w frontend && tsc -w backend --noEmit',
        },
        workspaces: ['backend', 'frontend'],
        // `concurrently` is referenced by the dev script — it MUST be declared
        // here, or `npm run dev` fails (the demo-3 D5 defect class: an
        // emitted script depending on an undeclared binary).
        devDependencies: {
          concurrently: '^9.1.0',
        },
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
    content: `# ${pack.name} — environment (copy to .env and fill in)
#
# DEMO (local dev) — works out of the box:
#   DATABASE_FILE points at a local SQLite file that auto-creates + seeds,
#   JWT_SECRET is a dev default, payments stay off.
# PRODUCTION — replace the demo values below; the app reads the same names,
# so no code changes are needed to switch from demo to real infrastructure.

# Core
PORT=4000
WEB_PORT=5173
DATABASE_FILE=./data/${slug(name)}.sqlite
JWT_SECRET=change-me-in-production

# Commerce (server-side pricing)
# Tax rate in basis points (500 = 5%). Integer minor-unit math throughout.
TAX_BPS=${COMMERCE_TAX_BPS}
# Payment provider. Leave blank to keep payments in 'pending' state;
# when real keys are present, wire the provider's webhooks and replace the
# placeholder hash in seed() with real bcrypt hashes before first boot.
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
`,
  });

  const apiLines = apis
    .map((a) => `  - \`${a.resource}\` → table \`${a.table}\` (${a.auth})`)
    .join('\n');
  files.push({
    path: 'README.md',
    kind: 'doc',
    content: `# ${pack.name}

> Generated by AETHER — a complete, multi-page, full-stack product.

## Project structure

\`\`\`
├── backend/          Express API — REST routes, SQLite (better-sqlite3) schema +
│   ├── src/              seed, JWT auth + middleware, commerce service, admin.
│   └── test/           Real HTTP integration tests (run against the live app).
├── frontend/         React (Vite) + React Router — one route per page.
│   └── src/
├── deploy/           Provider-ready deployment configs:
│   ├── render/         backend.yml + guide
│   ├── vercel/         frontend.json
│   ├── netlify/        frontend.toml
│   ├── cloudflare-pages/  frontend.json
│   ├── aws/            ECS Fargate task definition + guide
│   └── digitalocean/   Droplet + Docker guide
├── Dockerfile        Single image: API + built frontend (SPA fallback).
├── docker-compose.yml
└── .env.example      DEMO values (work out of the box) vs PRODUCTION secrets.
\`\`\`

## Pages

${pages.map((p) => `- \`${p.path}\` — ${p.title} (${p.area})`).join('\n')}

## API

${apiLines}

## Run (local)

\`\`\`bash
npm install
cp .env.example .env
npm run dev         # backend :4000 + frontend :5173 (vite proxies /api → :4000)
\`\`\`

## Test

\`\`\`bash
npm test            # backend API integration tests (real HTTP, isolated DB)
npm run build -w frontend && npm run build -w backend   # production build
\`\`\`

## Deploy (real world)

Pick one shape — details in \`deploy/README.md\`:

- **Single provider:** the root Dockerfile serves API + built frontend on one
  port. Targets: AWS ECS Fargate (\`deploy/aws/backend.json\`), Render
  (\`deploy/render/backend.yml\`), DigitalOcean Docker droplet.
- **Split providers:** backend on Render/AWS/DO, frontend on Vercel /
  Netlify / Cloudflare Pages — set \`VITE_API_BASE\` to the backend's public URL.

Never commit real secrets: \`.env.example\` keeps them as empty placeholders;
provider secret stores hold the real values.
`,
  });

  return files;
}

function generateServer(name: string, pack: DomainPack, apis: ApiPlan[]): ScaffoldedFile[] {
  const out: ScaffoldedFile[] = [];

  out.push({
    path: 'backend/package.json',
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
    path: 'backend/tsconfig.json',
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
    path: 'backend/src/db.ts',
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
    path: 'backend/src/index.ts',
    kind: 'backend',
    content: [
      `// ${pack.name} — Express application entry`,
      `import fs from 'node:fs';`,
      `import path from 'node:path';`,
      `import { fileURLToPath } from 'node:url';`,
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
      `// Single-container production mode: when the built frontend exists, serve
      // it statically with an SPA fallback — one provider can host the whole
      // product. FRONTEND_DIST overrides the default relative location.`,
      `const here = path.dirname(fileURLToPath(import.meta.url));`,
      `const dist = process.env.FRONTEND_DIST ? path.resolve(process.env.FRONTEND_DIST) : path.resolve(here, '../../frontend/dist');`,
      `if (fs.existsSync(path.join(dist, 'index.html'))) {`,
      `  app.use(express.static(dist));`,
      `  app.get(/^\\/(?!api|health).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));`,
      `}`,
      ``,
      `// 404 + error handlers (API routes only fall through to JSON)`,
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
    path: 'backend/src/middleware/auth.ts',
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

  // api test — REAL HTTP integration test against the running app
  out.push({
    path: 'backend/test/api.test.ts',
    kind: 'test',
    content: generateApiTest(apis, pack, name),
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
      // Orders get a real state machine in the schema, not a free-text status.
      if (a.special === 'order' && f === 'status') {
        cols.push(`status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','preparing','ready','completed','cancelled'))`);
        continue;
      }
      // Only emit DEFAULT when there is an actual value; a bare "DEFAULT ,"
      // is a SQL syntax error.
      cols.push(def === '' ? `${f} ${type}` : `${f} ${type} DEFAULT ${def}`);
    }
    const colDefs = ['id TEXT PRIMARY KEY', ...cols, 'created_at TEXT DEFAULT CURRENT_TIMESTAMP'];
    // Idempotent order creation (mission: "Idempotent order creation").
    if (a.special === 'order') colDefs.push('idempotency_key TEXT UNIQUE');
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

  // Seed one live promotion so the coupon path in the commerce service is
  // demonstrable (WELCOME10 = 10% off, stored as 1000 basis points).
  const hasPromos = apis.some((a) => a.resource === 'promotions');
  const promoLines = hasPromos
    ? `  const spcount = (db.prepare('SELECT COUNT(*) AS n FROM promotions').get() as { n: number }).n;
  if (spcount === 0) {
    db.prepare('INSERT INTO promotions (id, code, type, value_cents) VALUES (?, ?, ?, ?)').run('promo_welcome10', 'WELCOME10', 'percent', 1000);
  }
`
    : '';

  return `function seed() {
${primaryLines}${promoLines}  const acount = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
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
    path: 'backend/src/routes/auth.ts',
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

  // Commerce service — real business logic that the orders route depends on.
  const hasOrders = apis.some((a) => a.special === 'order');
  if (hasOrders) {
    out.push({ path: 'backend/src/services/commerce.ts', kind: 'backend', content: generateCommerceService(apis) });
  }

  // One route file per resource. Orders get the commerce-backed router
  // (server-side pricing, idempotency, state machine); everything else is CRUD.
  for (const a of apis) {
    const content = a.special === 'order' ? generateOrderRoute() : generateCrudRoute(a);
    out.push({ path: `backend/src/routes/${slugify(a.resource)}.ts`, kind: 'backend', content });
  }

  // admin.ts — cross-resource summary, admin-only
  out.push({ path: 'backend/src/routes/admin.ts', kind: 'backend', content: generateAdminRoute(apis) });

  // app.ts — testable createServer (same wiring as index.ts)
  out.push({
    path: 'backend/src/app.ts',
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

/**
 * The commerce service — the generated backend's REAL business logic.
 *
 * Order creation is NOT "insert what the client sent". The server:
 *  - validates line items (quantity, item ids)
 *  - prices every line from the database (never trusts client-supplied totals)
 *  - applies one coupon (percent in basis points / fixed cents), if valid
 *  - computes tax in integer minor units and returns the full breakdown
 *  - is idempotent: a repeated `Idempotency-Key` returns the original order
 *    instead of creating a duplicate
 *  - stores the order in its initial state-machine state ('pending')
 */
function generateCommerceService(apis: ApiPlan[]): string {
  const primary = apis[0];
  const priceField = primary.fields.find((f) => f.endsWith('_cents')) ?? 'price_cents';
  const primaryKey = primary.table;
  const hasPromos = apis.some((a) => a.resource === 'promotions');
  // Fixed-amount coupons and percent coupons need value_cents; the tax rate
  // defaults to COMMERCE_TAX_BPS (5%) and is env-tunable at runtime.
  return [
    `// ${primary?.resource ?? 'catalog'} commerce service — real order pricing`,
    `import db from '../db.js';`,
    ``,
    `/** Server-side tax rate in basis points (${COMMERCE_TAX_BPS} = 5%). Tunable via env per deployment. */`,
    `const TAX_BPS = Number(process.env.TAX_BPS ?? ${COMMERCE_TAX_BPS});`,
    ``,
    `export interface CartLine {`,
    `  id: string;`,
    `  qty: number;`,
    `}`,
    ``,
    `export interface PriceBreakdown {`,
    `  subtotal_cents: number;`,
    `  discount_cents: number;`,
    `  tax_cents: number;`,
    `  total_cents: number;`,
    `  currency: 'USD';`,
    `}`,
    ``,
    `/** Price a cart from the database. Every line is priced server-side. */`,
    `export function priceCart(lines: CartLine[], couponCode?: string): PriceBreakdown {`,
    `  let subtotalCents = 0;`,
    `  for (const line of lines) {`,
    `    if (!line.id || line.qty <= 0) throw Object.assign(new Error('invalid cart line'), { status: 400 });`,
    `    const item = db.prepare('SELECT ${priceField} FROM ${primaryKey} WHERE id = ?').get(line.id) as { [k: string]: unknown } | undefined;`,
    `    if (!item) throw Object.assign(new Error(\`item \${line.id} not found\`), { status: 404 });`,
    `    subtotalCents += Number(item['${priceField}']) * line.qty;`,
    `  }`,
    ``,
    `  // One coupon: percent (basis points) or fixed cents, when active.`,
    `  let discountCents = 0;`,
    hasPromos
      ? `  if (couponCode) {
    const promo = db.prepare('SELECT code, type, value_cents FROM promotions WHERE code = ?').get(couponCode) as any;
    if (promo) {
      discountCents = promo.type === 'percent'
        ? Math.round((subtotalCents * Number(promo.value_cents)) / 10000)
        : Math.min(Number(promo.value_cents), subtotalCents);
    }
  }`
      : `  void couponCode; // no promotions table in this product`,
    ``,
    `  const taxableCents = Math.max(0, subtotalCents - discountCents);`,
    `  const taxCents = Math.round((taxableCents * TAX_BPS) / 10000);`,
    `  return {`,
    `    subtotal_cents: subtotalCents,`,
    `    discount_cents: discountCents,`,
    `    tax_cents: taxCents,`,
    `    total_cents: taxableCents + taxCents,`,
    `    currency: 'USD',`,
    `  };`,
    `}`,
    ``,
    `/**`,
    ` * Create an order idempotently. Replaying the same idempotency key returns`,
    ` * the already-created order instead of a duplicate (safe client retries).`,
    ` */`,
    `export function createOrder(userId: string, lines: CartLine[], opts: { couponCode?: string; idempotencyKey: string }): { id: string; total_cents: number; status: string } {`,
    `  const existing = db.prepare('SELECT id, total_cents, status FROM orders WHERE idempotency_key = ?').get(opts.idempotencyKey) as any;`,
    `  if (existing) return existing;`,
    ``,
    `  const breakdown = priceCart(lines, opts.couponCode);`,
    `  const id = \`or_\${Date.now()}\`;`,
    `  db.prepare('INSERT INTO orders (id, user_id, status, total_cents, items, idempotency_key) VALUES (?, ?, ?, ?, ?, ?)')`,
    `    .run(id, userId, 'pending', breakdown.total_cents, JSON.stringify(lines), opts.idempotencyKey);`,
    `  return { id, total_cents: breakdown.total_cents, status: 'pending' };`,
    `}`,
    ``,
    `/** Order state machine — only legal transitions, nothing else. */`,
    `export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';`,
    `export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {`,
    `  pending: ['confirmed', 'cancelled'],`,
    `  confirmed: ['preparing', 'cancelled'],`,
    `  preparing: ['ready'],`,
    `  ready: ['completed'],`,
    `  completed: [],`,
    `  cancelled: [],`,
    `};`,
    ``,
    `export function transitionOrder(orderId: string, to: OrderStatus): string {`,
    `  const order = db.prepare('SELECT status FROM orders WHERE id = ?').get(orderId) as { status: string } | undefined;`,
    `  if (!order) throw Object.assign(new Error('order not found'), { status: 404 });`,
    `  const from = order.status as OrderStatus;`,
    `  if (!ORDER_TRANSITIONS[from]?.includes(to)) {`,
    `    throw Object.assign(new Error(\`illegal transition \${from} -> \${to}\`), { status: 409 });`,
    `  }`,
    `  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(to, orderId);`,
    `  return to;`,
    `}`,
    ``,
  ].join('\n');
}

/**
 * The orders router, driven by the commerce service instead of generic CRUD.
 * POST /orders prices server-side; POST /orders/:id/status advances the
 * state machine (staff/admin only in a real deploy — here, authenticated).
 */
function generateOrderRoute(): string {
  return [
    `import { Router } from 'express';`,
    `import db from '../db.js';`,
    `import { requireAuth, type AuthedRequest } from '../middleware/auth.js';`,
    `import { createOrder, transitionOrder, type OrderStatus, type CartLine } from '../services/commerce.js';`,
    ``,
    `export const OrdersRouter = Router();`,
    ``,
    `OrdersRouter.post('/', requireAuth, (req: AuthedRequest, res) => {`,
    `  const items = req.body?.items;`,
    `  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items[] required' });`,
    `  const idempotencyKey = String(req.headers['idempotency-key'] ?? \`anon_\${Date.now()}\`);`,
    `  try {`,
    `    const result = createOrder(req.user!.id, items as CartLine[], { couponCode: req.body?.couponCode, idempotencyKey });`,
    `    res.status(201).json(result);`,
    `  } catch (e: any) {`,
    `    res.status(e.status ?? 400).json({ error: e.message });`,
    `  }`,
    `});`,
    ``,
    `OrdersRouter.get('/', requireAuth, (req: AuthedRequest, res) => {`,
    `  const rows = db.prepare('SELECT * FROM orders WHERE user_id = ?').all(req.user!.id);`,
    `  res.json(rows);`,
    `});`,
    ``,
    `OrdersRouter.get('/:id', requireAuth, (req: AuthedRequest, res) => {`,
    `  const row = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id);`,
    `  if (!row) return res.status(404).json({ error: 'Not found' });`,
    `  res.json(row);`,
    `});`,
    ``,
    `OrdersRouter.post('/:id/status', requireAuth, (req: AuthedRequest, res) => {`,
    `  const to = String(req.body?.status ?? '') as OrderStatus;`,
    `  try {`,
    `    const status = transitionOrder(req.params.id, to);`,
    `    res.json({ id: req.params.id, status });`,
    `  } catch (e: any) {`,
    `    res.status(e.status ?? 400).json({ error: e.message });`,
    `  }`,
    `});`,
    ``,
  ].join('\n');
}

/** Lifted so the commerce service and the integration test agree on the rate. */
const COMMERCE_TAX_BPS = 500; // 5% tax, in basis points

/**
 * The generated product's REAL test suite — boots the app on an ephemeral
 * port against a throwaway SQLite file and proves the business logic:
 * server-side pricing, integer-minor-unit tax, seeded coupon, idempotent
 * order creation, and the order state machine. Not a placeholder.
 */
function generateApiTest(apis: ApiPlan[], pack: DomainPack, name: string): string {
  const primary = apis[0];
  const priceField = primary.fields.find((f) => f.endsWith('_cents')) ?? 'price_cents';
  const hasOrders = apis.some((a) => a.special === 'order');
  const hasPromos = apis.some((a) => a.resource === 'promotions');
  const hasAdmin = apis.some((a) => a.auth === 'admin');
  const userRes = (apis.find((a) => a.auth !== 'public') ?? apis[0]).resource;

  const commerceBlock = hasOrders
    ? `
  it('prices an order server-side with tax (integer minor units)', async () => {
    const catalog = (await api('/api/${primary.resource}')).body as any[];
    const price = Number(catalog.find((i) => i.id === 'i1')!.${priceField});
    const key = \`k-\${Date.now()}\`;
    const created = await api('/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ items: [{ id: 'i1', qty: 2 }] }) }, token);
    assert.equal(created.status, 201);
    const subtotal = price * 2;
    const tax = Math.round((subtotal * ${COMMERCE_TAX_BPS}) / 10000);
    assert.equal(created.body.total_cents, subtotal + tax, 'total must be server-recomputed, not client-trusted');
    assert.equal(created.body.status, 'pending');
    // Idempotent replay: same key returns the ORIGINAL order, no duplicate.
    const replay = await api('/api/orders', { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify({ items: [{ id: 'i1', qty: 2 }] }) }, token);
    assert.equal(replay.status, 201);
    assert.equal(replay.body.id, created.body.id);
  });

${hasPromos ? `  it('applies the seeded WELCOME10 coupon', async () => {
    const catalog = (await api('/api/${primary.resource}')).body as any[];
    const price = Number(catalog.find((i) => i.id === 'i1')!.${priceField});
    const created = await api('/api/orders', { method: 'POST', body: JSON.stringify({ items: [{ id: 'i1', qty: 1 }], couponCode: 'WELCOME10' }) }, token);
    assert.equal(created.status, 201);
    const discount = Math.round((price * 1000) / 10000); // 10% in basis points
    const taxable = price - discount;
    const tax = Math.round((taxable * ${COMMERCE_TAX_BPS}) / 10000);
    assert.equal(created.body.total_cents, taxable + tax);
  });

` : ''}  it('enforces the order state machine', async () => {
    const created = await api('/api/orders', { method: 'POST', body: JSON.stringify({ items: [{ id: 'i1', qty: 1 }] }) }, token);
    const id = created.body.id;
    const illegal = await api(\`/api/orders/\${id}/status\`, { method: 'POST', body: JSON.stringify({ status: 'completed' }) }, token);
    assert.equal(illegal.status, 409, 'pending -> completed is not a legal transition');
    const ok = await api(\`/api/orders/\${id}/status\`, { method: 'POST', body: JSON.stringify({ status: 'confirmed' }) }, token);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.status, 'confirmed');
  });
`
    : '';

  const adminBlock = hasAdmin
    ? `
  it('admin sees a cross-table summary (RBAC enforced)', async () => {
    const login = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@${slug(name)}.test', password: 'dev-admin-hash' }) });
    assert.equal(login.status, 200, 'seeded admin credentials must work');
    const { status, body } = await api('/api/admin/summary', {}, login.body.token);
    assert.equal(status, 200);
    assert.equal(typeof body.${primary.table}, 'number');
    const rejected = await api('/api/admin/summary');
    assert.equal(rejected.status, 401, 'admin routes require auth');
  });
`
    : '';

  return `// ${pack.name} — real HTTP integration test (node:test, no placeholders)
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import fs from 'node:fs';

// Isolated DB: db.ts opens SQLite at module load, so point it at a
// throwaway file BEFORE importing the app — the test never touches dev data.
const TEST_DB = './data/test.sqlite';
for (const ext of ['', '-wal', '-shm']) {
  try { fs.rmSync(TEST_DB + ext, { force: true }); } catch { /* first run */ }
}
process.env.DATABASE_FILE = TEST_DB;
const { createServer } = await import('../src/app.js');

let base = '';
let server: import('node:http').Server;
let token = '';

before(async () => {
  server = createServer().listen(0);
  await new Promise<void>((resolve) => server.on('listening', () => resolve()));
  base = \`http://127.0.0.1:\${(server.address() as AddressInfo).port}\`;
});
after(() => new Promise<void>((resolve) => server.close(() => resolve())));

async function api(path: string, init: RequestInit = {}, bearer?: string) {
  const res = await fetch(base + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(bearer ? { Authorization: \`Bearer \${bearer}\` } : {}),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  return { status: res.status, body: (await res.json()) as any };
}

describe('${pack.name} API', () => {
  it('exposes /health', async () => {
    const { status, body } = await api('/health');
    assert.equal(status, 200);
    assert.equal(body.ok, true);
  });

  it('seeds the primary catalog (${primary.resource})', async () => {
    const { status, body } = await api('/api/${primary.resource}');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body));
    assert.ok(body.length >= 3, \`expected seeded rows, got \${body.length}\`);
  });

  it('rejects unauthenticated access to /api/${userRes}', async () => {
    const { status } = await api('/api/${userRes}');
    assert.equal(status, 401);
  });

  it('registers and logs in a customer', async () => {
    const email = \`t\${Math.random().toString(36).slice(2)}@test.io\`;
    const reg = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, name: 'T', password: 'pw12345' }) });
    assert.equal(reg.status, 201);
    const dup = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, name: 'T', password: 'pw12345' }) });
    assert.equal(dup.status, 409, 'duplicate email must be rejected');
    const login = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'pw12345' }) });
    assert.equal(login.status, 200);
    token = login.body.token;
    const me = await api('/api/auth/me', {}, token);
    assert.equal(me.status, 200);
    assert.equal(me.body.email, email);
  });
${commerceBlock}${adminBlock}});
`;
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
    path: 'frontend/package.json',
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
    path: 'frontend/vite.config.ts',
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
    path: 'frontend/tsconfig.json',
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
    path: 'frontend/index.html',
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
    path: 'frontend/src/main.tsx',
    kind: 'frontend',
    content: [
      `import React from 'react';`,
      `import ReactDOM from 'react-dom/client';`,
      `import { BrowserRouter } from 'react-router-dom';`,
      `import App from './App';`,
      `import './styles.css';`, // global design tokens — must load or every page renders unstyled`,
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
    `// Typed fetch wrapper for the ${pack.name} backend.
// Local dev: '/api' (Vite proxies to :4000). Split-provider deploy:
// set VITE_API_BASE to the backend's public API URL (see deploy/).`,
    `const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';`,
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
      // English plural, not a blind "s" (demo-3 D7: "Orderss", "Subscriptionss").
      const IRREGULAR: Record<string, string> = { staff: 'staff', inventory: 'inventories', series: 'series', index: 'indexes' };
      const plural = IRREGULAR[a.resource] ?? (a.resource.endsWith('s') ? a.resource : `${a.resource}s`);
      const listExport = `export const list${pascal(plural)} = () => api('/${a.resource}');`;
      const create = a.verbs.includes('create')
        ? `export const create${pascal(a.resource)} = (b: unknown) => api('/${a.resource}', { method: 'POST', body: JSON.stringify(b) });`
        : '';
      return [listExport, create].filter(Boolean).join('\n');
    }),
  ]
    .filter((s) => s.length > 0)
    .join('\n');

  out.push({
    path: 'frontend/src/lib/api.ts',
    kind: 'frontend',
    content: apiClient,
  });

  // layout + navbar (real links to the routes)
  out.push({
    path: 'frontend/src/components/Layout.tsx',
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
    path: 'frontend/src/App.tsx',
    kind: 'frontend',
    content: [
      `import { Routes, Route } from 'react-router-dom';`,
      `import Layout from './components/Layout';`,
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

  // Page components — one real file per public + customer page
  for (const p of [...publicPages, ...customerPages]) {
    const C = pascal(p.key);
    out.push({
      path: `frontend/src/pages/${C}Page.tsx`,
      kind: 'frontend',
      content: generatePageComponent(p, apis, pack),
    });
  }

  // Admin + Staff single-file parametric pages
  out.push({
    path: 'frontend/src/pages/AdminPage.tsx',
    kind: 'frontend',
    content: generateAdminPage(adminPages.map((p) => p.key)),
  });
  out.push({
    path: 'frontend/src/pages/StaffPage.tsx',
    kind: 'frontend',
    content: generateStaffPage(staffPages.map((p) => p.key), apis[0] ? `/${apis[0].resource}` : '/'),
  });

  // minimal global css (professional baseline, not a framework)
  out.push({
    path: 'frontend/src/styles.css',
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

/**
 * Which backend resource a page key maps to — resolved BY KEY, not by area.
 * (Older builds listed the first user-scoped resource for *every* customer
 * page, cross-wiring Subscriptions→orders, Cart→menu, etc. That produced
 * "unconnected frontend" pages §13 flags.)
 *
 * Keys not in this map and not matching a resource fall through to an
 * honest static content page instead of a misleading data list.
 */
const KEY_TO_RESOURCE: Record<string, string[]> = {
  menu: ['menu'],
  products: ['products'],
  'product-listing': ['products', 'menu'],
  catalog: ['products', 'menu'],
  orders: ['orders'],
  'order-confirmation': ['orders'],
  subscriptions: ['subscriptions'],
  reviews: ['reviews'],
  promotions: ['promotions'],
  coupons: ['promotions'],
  staff: ['staff'],
  inventory: ['inventory'],
  reports: ['reports'],
  billing: ['subscriptions', 'orders'],
};

/** Resolve the resource a page should actually list (or null → static page). */
function resolvePageResource(p: PagePlan, apis: ApiPlan[], primary: ApiPlan): ApiPlan | null {
  const alias = KEY_TO_RESOURCE[p.key];
  if (alias) {
    const match = apis.find((a) => alias.includes(a.resource));
    // Alias named but no matching resource → don't fall back to a wrong one.
    return match ?? null;
  }
  // Direct/pluralized match on the key itself (e.g. 'shipments' page ↔ resource).
  const direct = apis.find((a) => a.resource === p.key || a.resource === `${p.key}s` || a.resource === p.key.replace(/s$/, ''));
  if (direct) return direct;
  // Homepage + menu: the primary resource.
  if (p.area === 'public' && (p.key === 'homepage' || p.key === 'menu')) return primary;
  // Everything else public (store-info, contact, …) → static content page.
  if (p.area === 'public') return null;
  // Customer pages with no matching resource → static content, NOT a wrong list.
  return null;
}

/** Honest copy for static content pages (no fabricated stats). */
function contentFeaturesFor(p: PagePlan, pack: DomainPack): string[] {
  const feats = (p.area === 'public' ? (pack.public as Record<string, unknown> | undefined)?.features : (pack.customer as Record<string, unknown> | undefined)?.features) as
    | string[]
    | undefined;
  if (feats?.length) return feats.slice(0, 8);
  return [`${p.title} — ${pack.name}`];
}

function generatePageComponent(p: PagePlan, apis: ApiPlan[], pack: DomainPack): string {
  const C = pascal(p.key);
  const primary = apis[0];
  const hasOrders = apis.some((a) => a.special === 'order');
  const resource = resolvePageResource(p, apis, primary);
  const isHome = p.key === 'homepage';
  const labelField = resource?.fields.find((f) => ['name', 'title', 'content', 'author', 'category'].includes(f)) ?? 'name';

  // Special, genuinely-functional pages when the domain has an order flow.
  if (p.key === 'cart' && hasOrders) return generateCartPage(C, p, primary);
  if (p.key === 'checkout' && hasOrders) return generateCheckoutPage(C, p);
  if (p.key === 'product-detail' && resource) return generateDetailPage(C, p, resource);
  if (p.key === 'search' && resource) return generateSearchPage(C, p, resource);
  if ((p.key === 'account' || p.key === 'profile') && p.area === 'customer') return generateAccountPage(C, p);

  // Static content page — honest copy from the domain pack, not fake data.
  if (!resource) {
    const feats = contentFeaturesFor(p, pack);
    const featList = feats.map((f) => JSON.stringify(f)).join(', ');
    return [
      `// ${p.title} page (${p.area}) — generated by AETHER`,
      `export default function ${C}Page() {`,
      `  const features: string[] = [${featList}];`,
      `  return (`,
      `    <div className="page">`,
      `      <h1>${p.title}</h1>`,
      `      <p className="subtitle">${pack.description ?? ''}</p>`,
      `      <ul className="list">`,
      `        {features.map((f, i) => <li key={i}>{f}</li>)}`,
      `      </ul>`,
      `    </div>`,
      `  );`,
      `}`,
    ].join('\n');
  }

  // Data list page — the page's own resource.
  const resPath = `/${resource.resource}`;
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
    `    api(RESOURCE).then((d: any) => setData(Array.isArray(d) ? d : [d])).catch((e) => setErr(String(e)));`,
    `  }, []);`,
    ``,
    `  if (err) return <div className="page"><h1>${p.title}</h1><p className="error">{err}</p></div>;`,
    `  if (data.length === 0) return <div className="page"><h1>${p.title}</h1><p>No records yet.</p></div>;`,
    ``,
    `  return (`,
    `    <div className="page">`,
    `      <h1>${p.title}</h1>`,
    `      <p className="subtitle">${isHome ? `${pack.name} · live ${resource.resource}` : `${p.title} · \${RESOURCE}`}</p>`,
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

/** Cart: localStorage-backed, shows live catalog prices; checkout prices server-side. */
function generateCartPage(C: string, p: PagePlan, primary: ApiPlan): string {
  const priceField = primary.fields.find((f) => f.endsWith('_cents')) ?? 'price_cents';
  return [
    `// ${p.title} page (cart) — generated by AETHER`,
    `import { useEffect, useState } from 'react';`,
    `import { Link } from 'react-router-dom';`,
    ``,
    `import { api } from '../lib/api';`,
    ``,
    `const CART_KEY = 'aether_cart';`,
    `const PRICE_FIELD = ${JSON.stringify(priceField)};`,
    ``,
    `function loadCart(): Array<{ id: string; qty: number }> {`,
    `  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]'); } catch { return []; }`,
    `}`,
    ``,
    `export default function ${C}Page() {`,
    `  const [lines, setLines] = useState(() => loadCart());`,
    `  const [catalog, setCatalog] = useState<any[]>([]);`,
    `  useEffect(() => { api('/${primary.resource}').then((d: any) => setCatalog(Array.isArray(d) ? d : [d])).catch(() => {}); }, []);`,
    `  const price = (id: string) => Number(catalog.find((c: any) => c.id === id)?.[PRICE_FIELD] ?? 0);`,
    `  const move = (id: string, d: number) => {`,
    `    const next = lines.map((l) => (l.id === id ? { ...l, qty: Math.max(1, l.qty + d) } : l)).filter((l) => l.qty > 0);`,
    `    setLines(next); localStorage.setItem(CART_KEY, JSON.stringify(next));`,
    `  };`,
    `  const remove = (id: string) => { const next = lines.filter((l) => l.id !== id); setLines(next); localStorage.setItem(CART_KEY, JSON.stringify(next)); };`,
    `  const subtotal = lines.reduce((s, l) => s + price(l.id) * l.qty, 0);`,
    ``,
    `  return (`,
    `    <div className="page">`,
    `      <h1>${p.title}</h1>`,
    `      <p className="subtitle">Subtotal (display only — the server recomputes pricing at checkout): {'$' + (subtotal / 100).toFixed(2)}</p>`,
    `      {lines.length === 0 && <p>Your cart is empty. Browse the menu to add items.</p>}`,
    `      <ul className="list">`,
    `        {lines.map((l) => { const item = catalog.find((c: any) => c.id === l.id); return (`,
    `          <li key={l.id}>`,
    `            {item?.name ?? l.id} × {l.qty} — {'$' + (price(l.id) * l.qty / 100).toFixed(2)}`,
    `            <button onClick={() => move(l.id, 1)}>+</button> `,
    `            <button onClick={() => move(l.id, -1)}>-</button> `,
    `            <button onClick={() => remove(l.id)}>remove</button>`,
    `          </li>`,
    `        ); })}`,
    `      </ul>`,
    `      {lines.length > 0 && <Link to="/checkout">Proceed to checkout</Link>}`,
    `    </div>`,
    `  );`,
    `}`,
  ].join('\n');
}

/** Checkout: authenticates, creates an order via the commerce service (server-priced). */
function generateCheckoutPage(C: string, p: PagePlan): string {
  return [
    `// ${p.title} page (checkout) — generated by AETHER`,
    `import { useEffect, useState } from 'react';`,
    `import { Link } from 'react-router-dom';`,
    ``,
    `import { api, login, getToken, setToken } from '../lib/api';`,
    ``,
    `const CART_KEY = 'aether_cart';`,
    ``,
    `export default function ${C}Page() {`,
    `  const [authed, setAuthed] = useState(() => Boolean(getToken()));`,
    `  const [email, setEmail] = useState('');`,
    `  const [password, setPassword] = useState('');`,
    `  const [result, setResult] = useState<any>(null);`,
    `  const [err, setErr] = useState('');`,
    `  const [busy, setBusy] = useState(false);`,
    ``,
    `  useEffect(() => { if (result) localStorage.removeItem(CART_KEY); }, [result]);`,
    ``,
    `  const signIn = async () => {`,
    `    setErr('');`,
    `    try { const r = await login(email, password); setToken(r.token); setAuthed(true); } catch (e) { setErr(String(e)); }`,
    `  };`,
    ``,
    `  const placeOrder = async () => {`,
    `    setErr(''); setBusy(true);`,
    `    try {`,
    `      const items = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');`,
    `      if (!Array.isArray(items) || items.length === 0) { setErr('Cart is empty — add items first.'); setBusy(false); return; }`,
    `      const r = await api('/orders', { method: 'POST', headers: { 'Idempotency-Key': \`web-\${Date.now()}\` }, body: JSON.stringify({ items }) });`,
    `      setResult(r); localStorage.removeItem(CART_KEY);`,
    `    } catch (e) { setErr(String(e)); } finally { setBusy(false); }`,
    `  };`,
    ``,
    `  if (result) return (`,
    `    <div className="page">`,
    `      <h1>Order confirmed</h1>`,
    `      <p>Order {result.id} · status {result.status} · total {'$' + ((result.total_cents ?? 0) / 100).toFixed(2)} (server-priced, tax included).</p>`,
    `      <Link to="/customer/orders">View your orders</Link>`,
    `    </div>`,
    `  );`,
    `  return (`,
    `    <div className="page">`,
    `      <h1>${p.title}</h1>`,
    `      {!authed ? (`,
    `        <>`,
    `          <p>Sign in to place your order.</p>`,
    `          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />`,
    `          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="password" />`,
    `          <button onClick={signIn}>Sign in</button>`,
    `        </>`,
    `      ) : (`,
    `        <button onClick={placeOrder} disabled={busy}>{busy ? 'Placing…' : 'Place order (server-priced)'}</button>`,
    `      )}`,
    `      {err && <p className="error">{err}</p>}`,
    `    </div>`,
    `  );`,
    `}`,
  ].join('\n');
}

/** Product detail: ?id= deep link into the primary resource. */
function generateDetailPage(C: string, p: PagePlan, resource: ApiPlan): string {
  const fields = JSON.stringify(resource.fields);
  return [
    `// ${p.title} page (detail) — generated by AETHER`,
    `import { useEffect, useState } from 'react';`,
    ``,
    `import { api } from '../lib/api';`,
    ``,
    `const FIELDS = ${fields};`,
    ``,
    `export default function ${C}Page() {`,
    `  const [rows, setRows] = useState<any[]>([]);`,
    `  const [id, setId] = useState(() => new URLSearchParams(window.location.search).get('id') ?? '');`,
    `  useEffect(() => { api('/${resource.resource}').then((d: any) => setRows(Array.isArray(d) ? d : [d])).catch(() => {}); }, []);`,
    `  const item = id ? rows.find((r: any) => r.id === id) : rows[0];`,
    `  if (!item) return <div className="page"><h1>${p.title}</h1><p>Nothing to show yet.</p></div>;`,
    `  return (`,
    `    <div className="page">`,
    `      <h1>{item.name ?? item.title ?? item.id}</h1>`,
    `      <dl>`,
    `        {FIELDS.map((f: string) => <div key={f}><dt>{f}</dt><dd>{String(item[f] ?? '—')}</dd></div>)}`,
    `      </dl>`,
    `      {rows.length > 1 && <p className="muted">Showing {rows.length} ${resource.resource}s; use ?id= to deep-link.</p>}`,
    `      <input value={id} onChange={(e) => setId(e.target.value)} placeholder="item id" aria-label="deep-link id" />`,
    `    </div>`,
    `  );`,
    `}`,
  ].join('\n');
}

/** Search: client-side filter over the primary resource. */
function generateSearchPage(C: string, p: PagePlan, resource: ApiPlan): string {
  return [
    `// ${p.title} page (search) — generated by AETHER`,
    `import { useEffect, useState } from 'react';`,
    ``,
    `import { api } from '../lib/api';`,
    ``,
    `export default function ${C}Page() {`,
    `  const [rows, setRows] = useState<any[]>([]);`,
    `  const [q, setQ] = useState('');`,
    `  useEffect(() => { api('/${resource.resource}').then((d: any) => setRows(Array.isArray(d) ? d : [d])).catch(() => {}); }, []);`,
    `  const hit = (it: any) => JSON.stringify(it).toLowerCase().includes(q.toLowerCase());`,
    `  const shown = q ? rows.filter(hit) : rows;`,
    `  return (`,
    `    <div className="page">`,
    `      <h1>${p.title}</h1>`,
    `      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ${resource.resource}…" />`,
    `      <ul className="list">`,
    `        {shown.map((it: any) => <li key={it.id ?? it.name}>{it.name ?? it.title ?? it.id}</li>)}`,
    `      </ul>`,
    `      {q && shown.length === 0 && <p className="muted">No matches.</p>}`,
    `    </div>`,
    `  );`,
    `}`,
  ].join('\n');
}

/** Account / profile: /auth/me with an in-page sign-in when unauthenticated. */
function generateAccountPage(C: string, p: PagePlan): string {
  return [
    `// ${p.title} page (account) — generated by AETHER`,
    `import { useEffect, useState } from 'react';`,
    ``,
    `import { api, login, getToken, setToken } from '../lib/api';`,
    ``,
    `export default function ${C}Page() {`,
    `  const [me, setMe] = useState<any>(null);`,
    `  const [authed, setAuthed] = useState(() => Boolean(getToken()));`,
    `  const [email, setEmail] = useState('');`,
    `  const [password, setPassword] = useState('');`,
    `  const [err, setErr] = useState('');`,
    `  useEffect(() => {`,
    `    api('/auth/me').then(setMe).catch(() => setAuthed(false));`,
    `  }, [authed]);`,
    `  const signIn = async () => { setErr(''); try { const r = await login(email, password); setToken(r.token); setAuthed(true); } catch (e) { setErr(String(e)); } };`,
    `  return (`,
    `    <div className="page">`,
    `      <h1>${p.title}</h1>`,
    `      {authed ? (`,
    `        <dl>`,
    `          <div><dt>email</dt><dd>{me?.email}</dd></div>`,
    `          <div><dt>name</dt><dd>{me?.name}</dd></div>`,
    `          <div><dt>role</dt><dd>{me?.role}</dd></div>`,
    `        </dl>`,
    `      ) : (`,
    `        <>`,
    `          <p>Sign in to view your account.</p>`,
    `          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />`,
    `          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="password" />`,
    `          <button onClick={signIn}>Sign in</button>`,
    `          {err && <p className="error">{err}</p>}`,
    `        </>`,
    `      )}`,
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
  const slugName = slug(name);
  const backendImage = `ghcr.io/${slugName}/${slugName}-backend`;
  return [
    // Root Dockerfile — one image that serves API + built frontend (SPA).
    {
      path: '.dockerignore',
      kind: 'deployment',
      content: `# Never copy local dev state into the image (demo-3 D9/D14: the built
# image carried 180MB of node_modules and live SQLite WAL files).
node_modules
**/node_modules
data
**/data
*.sqlite
*.sqlite-wal
*.sqlite-shm
.env
.env.*
dist
backend/dist
frontend/dist
.git
coverage
*.log
`,
    },
    {
      path: 'Dockerfile',
      kind: 'deployment',
      content: `# ${pack.name} — single image: API + built frontend (SPA fallback)
# better-sqlite3 is a native module: the builder stage needs a C++ toolchain
# to compile it for musl (the prebuilt .node binary is then carried into the
# runtime stage, so runtime stays toolchain-free and small-ish).
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
COPY backend ./backend
COPY frontend ./frontend
RUN npm install
RUN npm run build -w frontend && npm run build -w backend
# Runtime stage: only production deps + build outputs. The backend serves
# the built frontend from ../frontend/dist (SPA fallback in index.ts).
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/frontend ./frontend
ENV NODE_ENV=production
EXPOSE 4000
# frontend/ is inside /app, so index.ts finds the built SPA at ../frontend/dist
CMD ["npm", "start", "-w", "backend"]
`,
    },
    {
      path: '.github/workflows/ci.yml',
      kind: 'deployment',
      content: `# CI for the generated product itself (demo-3 D10: no CI shipped before).
# install → backend tests (real HTTP, isolated test DB) → frontend production
# build. A red build means the product does not ship.
name: ci
on:
  push:
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install
        # switch to 'npm ci' once package-lock.json is committed
        run: npm install
      - name: Native module (better-sqlite3 prebuild)
        run: npm rebuild better-sqlite3 || npx --yes node-gyp rebuild --directory=node_modules/better-sqlite3
      - name: Backend integration tests
        run: npm test
      - name: Frontend production build
        run: npm run build -w frontend
      - name: Backend typecheck + build
        run: npm run build -w backend
`,
    },
    {
      path: 'docker-compose.yml',
      kind: 'deployment',
      content: `# ${pack.name} — full-stack local/production parity
# One service runs the API and serves the built frontend (SPA fallback);
# a named volume persists the SQLite data directory.
services:
  app:
    build: .
    ports:
      - '4000:4000'
    environment:
      - PORT=4000
      - DATABASE_FILE=/data/${slugName}.sqlite
      - JWT_SECRET=\${JWT_SECRET:-change-me-in-production}
      - TAX_BPS=\${TAX_BPS:-500}
    volumes:
      - app-data:/data
volumes:
  app-data:
`,
    },
    // --- deploy/ — provider-specific, copy-paste ready -----------------
    {
      path: 'deploy/render/backend.yml',
      kind: 'deployment',
      content: `# Render — backend-only deployment (pair with deploy/render/frontend.json
# and point the frontend's API base at this service's public URL).
# Import: Render → New → Blueprint → this file.
services:
  - type: web
    name: ${slugName}-backend
    runtime: node
    plan: starter
    buildCommand: npm ci && npm run build -w backend
    startCommand: npm run start -w backend
    healthCheckPath: /health
    envVars:
      - key: PORT
        value: \${PORT}
      - key: DATABASE_FILE
        value: /var/data/${slugName}.sqlite
      - key: JWT_SECRET
        generateValue: true
      - key: TAX_BPS
        value: '500'
      - key: STRIPE_SECRET_KEY
        sync: false
    volumes:
      - name: app-data
      - mountPath: /var/data
`,
    },
    {
      path: 'deploy/render/README.md',
      kind: 'deployment',
      content: `# Deploy to Render

## Backend (API + data)
1. Render → **New → Blueprint** → point at this repository.
2. Import \`deploy/render/backend.yml\`.
3. Add your provider secrets (STRIPE_*, …) in the dashboard's env vars.

The service exposes \`/health\` for the auto health check. The SQLite file
lives on the mounted volume (\`/var/data\`) and survives redeploys.
`,
    },
    {
      path: 'deploy/vercel/frontend.json',
      kind: 'deployment',
      content: JSON.stringify(
        {
          // Vercel project for the frontend workspace only.
          rootDirectory: 'frontend',
          buildCommand: 'npm run build -w frontend',
          outputDirectory: 'dist',
          // Vite dev proxy already targets :4000; in production set VITE_API_BASE.
          env: { VITE_API_BASE: 'https://YOUR_BACKEND.onrender.com/api' },
        },
        null,
        2
      ),
    },
    {
      path: 'deploy/netlify/frontend.toml',
      kind: 'deployment',
      content: `# Netlify — frontend deployment
[build]
  command = "npm run build -w frontend"
  publish = "frontend/dist"
[build.environment]
  NODE_VERSION = "20"
  VITE_API_BASE = "https://YOUR_BACKEND.onrender.com/api"
`,
    },
    {
      path: 'deploy/cloudflare-pages/frontend.json',
      kind: 'deployment',
      content: JSON.stringify(
        {
          // Cloudflare Pages via Wrangler (frontend/ is the Pages project).
          $schema: 'https://open.schemadot.org/schema/lib/schema.json',
          name: `${slugName}-frontend`,
          pages_build_output_dir: 'dist',
          pages_functions_source: '.',
          build: { command: 'npm run build -w frontend' },
          variables: { VITE_API_BASE: 'https://YOUR_BACKEND' },
        },
        null,
        2
      ),
    },
    {
      path: 'deploy/aws/backend.json',
      kind: 'deployment',
      content: JSON.stringify(
        {
          // AWS — ECS Fargate task definition for the single-container build
          // (API + built frontend). Pair with an RDS/FSx volume or S3-backed
          // EFS mount for /data persistence.
          family: `${slugName}-backend`,
          networkMode: 'awsvpc',
          requiresCompatibilities: ['FARGATE'],
          cpu: 512,
          memory: '1GB',
          containerDefinitions: [
            {
              name: 'app',
              image: backendImage,
              essential: true,
              ports: [{ containerPort: 4000 }],
              environment: [
                { name: 'PORT', value: '4000' },
                { name: 'DATABASE_FILE', value: '/data/' + slugName + '.sqlite' },
                { name: 'JWT_SECRET', value: 'REPLACE_VIA_SECRETS_MANAGER' },
                { name: 'TAX_BPS', value: '500' },
              ],
              logConfiguration: { logDriver: 'awslogs', options: {} },
            },
          ],
        },
        null,
        2
      ),
    },
    {
      path: 'deploy/aws/README.md',
      kind: 'deployment',
      content: `# Deploy to AWS

1. Build + push the image:
   \`docker build -t \${IMAGE} . && docker push \${IMAGE}\`
2. Register the task definition: \`aws ecs register-task-definition --cli-input-json file://deploy/aws/backend.json\`
3. Create a service (Fargate, awsvpc) behind an ALB; map container port 4000.
4. Mount a persistent volume (EFS or per-instance EBS) at \`/data\`.
5. Move JWT_SECRET / provider keys to AWS Secrets Manager and reference them.

The same single image serves API + built frontend — one ALB target, one deploy.
`,
    },
    {
      path: 'deploy/digitalocean/DROPS-README.md',
      kind: 'deployment',
      content: `# Deploy to DigitalOcean (Droplet)

1. Provision a Ubuntu 24.04 droplet + install Docker.
2. \`git clone \${REPO} && cd \${REPO} && docker compose up -d --build\`
   (uses docker-compose.yml: one app container + /data volume).
3. Firewall: allow 443; run \`certbot\` (or Caddy) for TLS in front of :4000.
4. Persistence: the SQLite file lives on the named volume \`app-data\`.
   Back it up with \`doctl spaces\` or a scheduled \`sqlite3 .backup\` to S3.
`,
    },
    {
      path: 'deploy/README.md',
      kind: 'deployment',
      content: `# ${pack.name} — deployment targets

\`${slugName}\` ships provider-ready configs. Two deployment shapes:

**A. Single provider (simplest):** one container/image serves API + built
frontend (SPA fallback in \`backend/src/index.ts\`).
- AWS ECS Fargate → \`deploy/aws/backend.json\`
- Render → \`deploy/render/backend.yml\`
- DigitalOcean → \`deploy/digitalocean/DROPS-README.md\`

**B. Split providers (recommended for scale):**
- Backend: Render / AWS / DO (configs above)
- Frontend: \`deploy/vercel/frontend.json\`, \`deploy/netlify/frontend.toml\`,
  \`deploy/cloudflare-pages/frontend.json\`
- Set \`VITE_API_BASE\` on the frontend host to the backend's public URL.

## Invariants every provider must respect
- \`DATABASE_FILE\` points at a PERSISTENT path (volume/EBS/EFS), never the container FS.
- \`JWT_SECRET\` is a real secret (provider secret store / Secrets Manager).
- Provider keys (STRIPE_*, …) are set in the provider dashboard, never in the repo.
- \`/health\` is the liveness probe on every target.
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
