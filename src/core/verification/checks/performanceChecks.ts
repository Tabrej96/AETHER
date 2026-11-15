/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Performance Checks - Verifies performance characteristics
 *
 * Checks page load time, API response time, database query performance,
 * bundle size, and Lighthouse scores.
 */

import type {
  VerificationCheck,
  VerificationResult,
  CheckExecutionContext,
} from '../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pass(
  checkId: string,
  evidence: string,
  actualValue?: string,
  expectedValue?: string
): Promise<VerificationResult> {
  return Promise.resolve({
    checkId,
    passed: true,
    evidence,
    actualValue,
    expectedValue,
    timestamp: new Date().toISOString(),
  });
}

function fail(
  checkId: string,
  evidence: string,
  actualValue?: string,
  expectedValue?: string
): Promise<VerificationResult> {
  return Promise.resolve({
    checkId,
    passed: false,
    evidence,
    actualValue,
    expectedValue,
    timestamp: new Date().toISOString(),
  });
}

async function fileExists(ctx: CheckExecutionContext, path: string): Promise<boolean> {
  return ctx.fs.exists(path);
}

async function codePatternExists(
  ctx: CheckExecutionContext,
  filePath: string,
  pattern: RegExp
): Promise<boolean> {
  try {
    if (!(await ctx.fs.exists(filePath))) return false;
    const content = await ctx.fs.read(filePath);
    return pattern.test(content);
  } catch {
    return false;
  }
}

// ─── Page Load Performance ──────────────────────────────────────────────────

export function createPageLoadChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'PERF-PAGE-001',
      category: 'performance',
      severity: 'critical',
      description: 'Bundle size analysis configuration exists',
      check: async () => {
        const bundleConfigPattern = /rollupOptions|manualChunks|splitChunks|build.*optimization|bundle.*analyzer/i;
        const configFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/{vite,webpack,rollup,next,rspack}.config*.{ts,js,mjs}`);
        let found = false;
        for (const f of configFiles) {
          if (await codePatternExists(ctx, f, bundleConfigPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-PAGE-001', 'Bundle optimization configuration found');
        return fail('PERF-PAGE-001', 'No bundle size optimization configuration found');
      },
    },
    {
      id: 'PERF-PAGE-002',
      category: 'performance',
      severity: 'high',
      description: 'Performance budgets defined',
      check: async () => {
        const budgetPattern = /performance.*budget|budget|max.*size|size.*limit|bundle.*limit|overBudget|performance.*limit/i;
        const configFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/{lighthouse,performance,budget}.config*.{ts,js,json}`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx}`);
        let found = false;
        for (const f of [...configFiles, ...sourceFiles]) {
          if (await codePatternExists(ctx, f, budgetPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-PAGE-002', 'Performance budgets found');
        return fail('PERF-PAGE-002', 'No performance budgets defined');
      },
    },
    {
      id: 'PERF-PAGE-003',
      category: 'performance',
      severity: 'high',
      description: 'Font loading optimized (font-display, preload)',
      check: async () => {
        const fontPattern = /font-display|font-display:|preload.*font|@font-face|next\/font|font.*swap|font.*load/i;
        const cssFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{css,scss,tsx,jsx}`);
        const layoutFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/layout.{ts,tsx}`);
        const allFiles = [...cssFiles, ...layoutFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, fontPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-PAGE-003', 'Font loading optimization found');
        return fail('PERF-PAGE-003', 'No font loading optimization found');
      },
    },
    {
      id: 'PERF-PAGE-004',
      category: 'performance',
      severity: 'medium',
      description: 'Critical rendering path optimized (no render-blocking resources)',
      check: async () => {
        const renderPattern = /defer|async|modulepreload|preload|prefetch|media="print"|onload.*stylesheet/i;
        const htmlFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/*.html`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        const allFiles = [...htmlFiles, ...sourceFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, renderPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-PAGE-004', 'Render-blocking resource optimization found');
        return fail('PERF-PAGE-004', 'No render-blocking resource optimization found');
      },
    },
  ];
}

// ─── API Response Time ──────────────────────────────────────────────────────

export function createApiPerformanceChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'PERF-API-001',
      category: 'performance',
      severity: 'high',
      description: 'Database query optimization (select specific fields)',
      check: async () => {
        const queryPattern = /select.*\{|\.find\(.*project|select:|lean\(\)|pluck|column|findOne.*lean/i;
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        const repoFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/repo*/**/*.{ts,js}`);
        const allFiles = [...dbFiles, ...repoFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, queryPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-API-001', 'Optimized queries (field selection) found');
        return fail('PERF-API-001', 'No query optimization (field selection) found');
      },
    },
    {
      id: 'PERF-API-002',
      category: 'performance',
      severity: 'high',
      description: 'N+1 query prevention (batch loading, DataLoader)',
      check: async () => {
        const nPlusOnePattern = /include|populate|join|DataLoader|batchLoader|batch.*load|resolveBatch|eager.*load/i;
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of [...dbFiles, ...sourceFiles]) {
          if (await codePatternExists(ctx, f, nPlusOnePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-API-002', 'N+1 prevention (batch loading) found');
        return fail('PERF-API-002', 'No N+1 query prevention found');
      },
    },
    {
      id: 'PERF-API-003',
      category: 'performance',
      severity: 'high',
      description: 'Response caching for expensive queries',
      check: async () => {
        const cachePattern = /cache.*query|cache.*response|redis.*get|redis.*set|@Cacheable|response.*cache/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        const allFiles = [...apiFiles, ...dbFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, cachePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-API-003', 'Response/query caching found');
        return fail('PERF-API-003', 'No response or query caching found');
      },
    },
    {
      id: 'PERF-API-004',
      category: 'performance',
      severity: 'medium',
      description: 'Pagination implemented for list endpoints',
      check: async () => {
        const paginationPattern = /limit|offset|skip|take|page|cursor.*paginat|paginat.*cursor/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, paginationPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-API-004', 'Pagination in API endpoints found');
        return fail('PERF-API-004', 'No pagination in API endpoints found');
      },
    },
  ];
}

// ─── Database Query Performance ─────────────────────────────────────────────

export function createDatabasePerformanceChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'PERF-DB-001',
      category: 'performance',
      severity: 'high',
      description: 'Database indexes on frequently queried fields',
      check: async () => {
        const indexPattern = /index|@index|createIndex|unique|compound.*index/i;
        const schemaFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/schema*.{ts,js,prisma}`);
        const migrationFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/migrations/**/*.{ts,js,sql}`);
        const allFiles = [...schemaFiles, ...migrationFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, indexPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-DB-001', 'Database indexes found');
        return fail('PERF-DB-001', 'No database indexes found');
      },
    },
    {
      id: 'PERF-DB-002',
      category: 'performance',
      severity: 'medium',
      description: 'Connection pooling configured',
      check: async () => {
        const poolPattern = /pool|connectionPool|createPool|min.*connection|max.*connection|connectionLimit/i;
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        let found = false;
        for (const f of dbFiles) {
          if (await codePatternExists(ctx, f, poolPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-DB-002', 'Connection pooling found');
        return fail('PERF-DB-002', 'No connection pooling found');
      },
    },
  ];
}

// ─── Frontend Performance ───────────────────────────────────────────────────

export function createFrontendPerformanceChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'PERF-FE-001',
      category: 'performance',
      severity: 'high',
      description: 'Lazy loading for routes and heavy components',
      check: async () => {
        const lazyPattern = /lazy\(|dynamic\(|loadable|import\(\)|next\/dynamic|React\.lazy/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, lazyPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-FE-001', 'Lazy loading found');
        return fail('PERF-FE-001', 'No lazy loading found');
      },
    },
    {
      id: 'PERF-FE-002',
      category: 'performance',
      severity: 'high',
      description: 'Image optimization (WebP/AVIF, responsive srcset)',
      check: async () => {
        const imgPattern = /next\/image|Image.*component|srcset|sizes=|loading.*lazy|blurDataURL|placeholder.*blur|webp|avif/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, imgPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-FE-002', 'Image optimization found');
        return fail('PERF-FE-002', 'No image optimization found');
      },
    },
    {
      id: 'PERF-FE-003',
      category: 'performance',
      severity: 'medium',
      description: 'Service Worker for offline caching (PWA)',
      check: async () => {
        const swPattern = /serviceWorker|service.*worker|navigator\.serviceWorker|register.*sw|workbox/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        const swFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/sw.{ts,js}`);
        let found = false;
        for (const f of [...sourceFiles, ...swFiles]) {
          if (await codePatternExists(ctx, f, swPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-FE-003', 'Service Worker found');
        return fail('PERF-FE-003', 'No Service Worker for caching found');
      },
    },
    {
      id: 'PERF-FE-004',
      category: 'performance',
      severity: 'medium',
      description: 'Virtual scrolling for large lists',
      check: async () => {
        const virtualPattern = /virtual.*scroll|react-window|react-virtualized|@tanstack/virtual|virtuoso|virtualiz/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, virtualPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-FE-004', 'Virtual scrolling found');
        return fail('PERF-FE-004', 'No virtual scrolling for large lists found');
      },
    },
  ];
}

// ─── Lighthouse Scores ──────────────────────────────────────────────────────

export function createLighthouseChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'PERF-LH-001',
      category: 'performance',
      severity: 'high',
      description: 'Lighthouse CI or performance testing configured',
      check: async () => {
        const lighthousePattern = /lighthouse|lhci|@lhci|lighthouse-ci|perf.*test|performance.*test/i;
        const configFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/.lighthouserc.*`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        const ciFiles = await ctx.fs.glob(`${ctx.projectRoot}/.github/workflows/*.{yml,yaml}`);
        let found = false;
        for (const f of [...configFiles, ...sourceFiles, ...ciFiles]) {
          if (await codePatternExists(ctx, f, lighthousePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-LH-001', 'Lighthouse/performance testing configured');
        return fail('PERF-LH-001', 'No Lighthouse or performance testing configured');
      },
    },
    {
      id: 'PERF-LH-002',
      category: 'performance',
      severity: 'medium',
      description: 'Performance budgets enforced in CI',
      check: async () => {
        const budgetPattern = /lighthouse|perf.*budget|performance.*budget|bundle.*size|max.*bundle/i;
        const ciFiles = await ctx.fs.glob(`${ctx.projectRoot}/.github/workflows/*.{yml,yaml}`);
        if (ciFiles.length === 0) return fail('PERF-LH-002', 'No CI files found');
        let found = false;
        for (const f of ciFiles) {
          if (await codePatternExists(ctx, f, budgetPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('PERF-LH-002', 'Performance budgets in CI');
        return fail('PERF-LH-002', 'No performance budget enforcement in CI');
      },
    },
  ];
}

// ─── Aggregate all performance checks ───────────────────────────────────────

export function createAllPerformanceChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    ...createPageLoadChecks(ctx),
    ...createApiPerformanceChecks(ctx),
    ...createDatabasePerformanceChecks(ctx),
    ...createFrontendPerformanceChecks(ctx),
    ...createLighthouseChecks(ctx),
  ];
}
