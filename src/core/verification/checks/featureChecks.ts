/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Feature Checks - 19 Universal Production Engineering Pillars
 *
 * Each check verifies that specific files, code patterns, and tests exist.
 * NEVER trusts AI output - always verifies actual file existence and content.
 */

import type {
  VerificationCheck,
  VerificationResult,
  CheckExecutionContext,
} from '../types.js';

// ─── Helper to create check results ─────────────────────────────────────────

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

// ─── Utility: check file existence ─────────────────────────────────────────

async function fileExists(ctx: CheckExecutionContext, path: string): Promise<boolean> {
  return ctx.fs.exists(path);
}

// ─── Utility: check code pattern in file ────────────────────────────────────

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

// ─── Utility: check test passes ─────────────────────────────────────────────

async function testPasses(
  ctx: CheckExecutionContext,
  testPattern: string
): Promise<{ passed: boolean; output: string }> {
  try {
    const result = await ctx.testRunner.runTests(testPattern);
    return { passed: result.failed === 0, output: result.output };
  } catch {
    return { passed: false, output: 'Test runner failed' };
  }
}

// ─── PILLAR 1: Authentication & Authorization ───────────────────────────────

export function createAuthChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P01-AUTH-001',
      category: 'feature',
      severity: 'critical',
      description: 'User registration system exists with email validation',
      check: async () => {
        const exists = await fileExists(ctx, `${ctx.projectRoot}/src/features/auth/register.ts`);
        const pattern = await codePatternExists(ctx, `${ctx.projectRoot}/src/features/auth/register.ts`, /email.*validat|validat.*email/i);
        if (exists && pattern) return pass('P01-AUTH-001', 'Registration with email validation found');
        if (exists) return fail('P01-AUTH-001', 'Registration file exists but missing email validation');
        return fail('P01-AUTH-001', 'Registration system not found');
      },
    },
    {
      id: 'P01-AUTH-002',
      category: 'feature',
      severity: 'critical',
      description: 'Login system with password hashing (bcrypt/argon2)',
      check: async () => {
        const loginFile = `${ctx.projectRoot}/src/features/auth/login.ts`;
        const hashPattern = /bcrypt|argon2|hash.*password|password.*hash/i;
        const exists = await fileExists(ctx, loginFile);
        const hashed = exists && (await codePatternExists(ctx, loginFile, hashPattern));
        if (hashed) return pass('P01-AUTH-002', 'Login with password hashing found');
        return fail('P01-AUTH-002', 'Login system missing password hashing');
      },
    },
    {
      id: 'P01-AUTH-003',
      category: 'security',
      severity: 'critical',
      description: 'JWT or session-based authentication with secure tokens',
      check: async () => {
        const authFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/auth*.ts`);
        const hasJWT = authFiles.some(async (f) => {
          return codePatternExists(ctx, f, /jwt|jsonwebtoken|session.*id|secure.*cookie/i);
        });
        const jwtResult = authFiles.length > 0 ? await hasJWT : false;
        if (jwtResult) return pass('P01-AUTH-003', 'Secure authentication tokens found');
        return fail('P01-AUTH-003', 'No secure token authentication found');
      },
    },
    {
      id: 'P01-AUTH-004',
      category: 'security',
      severity: 'critical',
      description: 'Role-based access control (RBAC) implementation',
      check: async () => {
        const rbacPattern = /role|permission|access.*control|RBAC|middleware.*auth/i;
        const files = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of files) {
          if (await codePatternExists(ctx, f, rbacPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P01-AUTH-004', 'RBAC implementation found');
        return fail('P01-AUTH-004', 'No role-based access control found');
      },
    },
    {
      id: 'P01-AUTH-005',
      category: 'security',
      severity: 'high',
      description: 'Password reset / forgot password flow',
      check: async () => {
        const resetPattern = /password.*reset|forgot.*password|reset.*token|email.*reset/i;
        const files = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of files) {
          if (await codePatternExists(ctx, f, resetPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P01-AUTH-005', 'Password reset flow found');
        return fail('P01-AUTH-005', 'No password reset flow found');
      },
    },
    {
      id: 'P01-AUTH-006',
      category: 'security',
      severity: 'high',
      description: 'OAuth / social login integration',
      check: async () => {
        const oauthPattern = /oauth|google.*login|facebook.*login|github.*login|social.*auth/i;
        const files = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of files) {
          if (await codePatternExists(ctx, f, oauthPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P01-AUTH-006', 'Social login integration found');
        return fail('P01-AUTH-006', 'No social login integration found');
      },
    },
    {
      id: 'P01-AUTH-007',
      category: 'security',
      severity: 'high',
      description: 'Two-factor authentication (2FA/TOTP)',
      check: async () => {
        const tfaPattern = /two.?factor|2fa|totp|authenticator|mfa|multi.?factor/i;
        const files = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of files) {
          if (await codePatternExists(ctx, f, tfaPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P01-AUTH-007', '2FA implementation found');
        return fail('P01-AUTH-007', 'No two-factor authentication found');
      },
    },
  ];
}

// ─── PILLAR 2: Database Design ──────────────────────────────────────────────

export function createDatabaseChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P02-DB-001',
      category: 'file',
      severity: 'critical',
      description: 'Database schema/migration files exist',
      check: async () => {
        const schemaFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/migrations/**/*.{ts,js,sql}`);
        const schemaFile = await ctx.fs.exists(`${ctx.projectRoot}/src/db/schema.ts`);
        const prismaFile = await ctx.fs.exists(`${ctx.projectRoot}/prisma/schema.prisma`);
        const drizzleFile = await ctx.fs.exists(`${ctx.projectRoot}/src/db/schema.ts`);
        if (schemaFiles.length > 0 || schemaFile || prismaFile || drizzleFile) {
          return pass('P02-DB-001', `Schema files found: ${schemaFiles.length + (schemaFile ? 1 : 0) + (prismaFile ? 1 : 0)}`);
        }
        return fail('P02-DB-001', 'No database schema files found');
      },
    },
    {
      id: 'P02-DB-002',
      category: 'code',
      severity: 'critical',
      description: 'Database models/entities defined for all domain objects',
      check: async () => {
        const modelPattern = /(?:model|entity|interface)\s+\w+.*\{/g;
        const schemaFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/schema*.{ts,js}`);
        const modelFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/models/**/*.{ts,js}`);
        const allFiles = [...schemaFiles, ...modelFiles];
        let modelCount = 0;
        for (const f of allFiles) {
          const content = await ctx.fs.read(f);
          const matches = content.match(modelPattern);
          if (matches) modelCount += matches.length;
        }
        if (modelCount >= 3) return pass('P02-DB-002', `${modelCount} entity models found`);
        return fail('P02-DB-002', `Only ${modelCount} models found, expected at least 3`);
      },
    },
    {
      id: 'P02-DB-003',
      category: 'code',
      severity: 'high',
      description: 'Database indexes defined for performance',
      check: async () => {
        const indexPattern = /index|unique|@index|createIndex/i;
        const schemaFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/schema*.{ts,js,prisma}`);
        let found = false;
        for (const f of schemaFiles) {
          if (await codePatternExists(ctx, f, indexPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P02-DB-003', 'Database indexes defined');
        return fail('P02-DB-003', 'No database indexes found');
      },
    },
    {
      id: 'P02-DB-004',
      category: 'code',
      severity: 'high',
      description: 'Database relationships (foreign keys) defined',
      check: async () => {
        const fkPattern = /foreignKey|references|belongsTo|hasMany|hasOne|@relation/i;
        const schemaFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/schema*.{ts,js,prisma}`);
        let found = false;
        for (const f of schemaFiles) {
          if (await codePatternExists(ctx, f, fkPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P02-DB-004', 'Foreign key relationships found');
        return fail('P02-DB-004', 'No foreign key relationships found');
      },
    },
  ];
}

// ─── PILLAR 3: API Design ───────────────────────────────────────────────────

export function createApiChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P03-API-001',
      category: 'file',
      severity: 'critical',
      description: 'API routes/endpoints directory exists',
      check: async () => {
        const routes = await ctx.fs.glob(`${ctx.projectRoot}/src/**/routes/**/*.{ts,js}`);
        const apiDir = await ctx.fs.exists(`${ctx.projectRoot}/src/api`);
        const pagesDir = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        if (routes.length > 0 || apiDir || pagesDir.length > 0) {
          return pass('P03-API-001', `API routes found: ${routes.length + pagesDir.length}`);
        }
        return fail('P03-API-001', 'No API routes directory found');
      },
    },
    {
      id: 'P03-API-002',
      category: 'code',
      severity: 'critical',
      description: 'RESTful CRUD endpoints implemented',
      check: async () => {
        const crudPattern = /(?:GET|POST|PUT|PATCH|DELETE|get|post|put|patch|delete).*(?:route|handler|endpoint|controller)/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let crudCount = 0;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, crudPattern)) crudCount++;
        }
        if (crudCount >= 3) return pass('P03-API-002', `${crudCount} CRUD endpoint files found`);
        return fail('P03-API-002', `Only ${crudCount} CRUD endpoints found`);
      },
    },
    {
      id: 'P03-API-003',
      category: 'code',
      severity: 'high',
      description: 'API input validation (Zod/Joi/express-validator)',
      check: async () => {
        const validationPattern = /zod|joi|express-validator|validate\(|input.*valid|schema.*valid/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        let found = false;
        for (const f of apiFiles) {
          if (await codePatternExists(ctx, f, validationPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P03-API-003', 'API input validation found');
        return fail('P03-API-003', 'No API input validation found');
      },
    },
    {
      id: 'P03-API-004',
      category: 'code',
      severity: 'high',
      description: 'API error handling middleware',
      check: async () => {
        const errorPattern = /error.*handler|catch.*error|try\s*\{|next\(.*error|error.*middleware/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        let found = false;
        for (const f of apiFiles) {
          if (await codePatternExists(ctx, f, errorPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P03-API-004', 'API error handling found');
        return fail('P03-API-004', 'No API error handling found');
      },
    },
    {
      id: 'P03-API-005',
      category: 'code',
      severity: 'medium',
      description: 'API versioning or structured endpoint naming',
      check: async () => {
        const versionPattern = /\/v\d+\/|api\/v\d+|version.*api|@version/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        let found = false;
        for (const f of apiFiles) {
          if (await codePatternExists(ctx, f, versionPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P03-API-005', 'API versioning found');
        return fail('P03-API-005', 'No API versioning found');
      },
    },
  ];
}

// ─── PILLAR 4: Frontend/UI ──────────────────────────────────────────────────

export function createFrontendChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P04-FE-001',
      category: 'file',
      severity: 'critical',
      description: 'Frontend component directory exists',
      check: async () => {
        const components = await ctx.fs.glob(`${ctx.projectRoot}/src/**/components/**/*.{tsx,jsx}`);
        const pages = await ctx.fs.glob(`${ctx.projectRoot}/src/**/pages/**/*.{tsx,jsx}`);
        const appDir = await ctx.fs.exists(`${ctx.projectRoot}/app`);
        if (components.length > 0 || pages.length > 0 || appDir) {
          return pass('P04-FE-001', `Components: ${components.length}, Pages: ${pages.length}`);
        }
        return fail('P04-FE-001', 'No frontend components or pages found');
      },
    },
    {
      id: 'P04-FE-002',
      category: 'ui',
      severity: 'critical',
      description: 'Responsive layout with mobile support',
      check: async () => {
        const responsivePattern = /sm:|md:|lg:|xl:|mobile|responsive|@media|useBreakpoint/i;
        const styleFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{css,scss,tsx,jsx}`);
        let found = false;
        for (const f of styleFiles) {
          if (await codePatternExists(ctx, f, responsivePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P04-FE-002', 'Responsive layout patterns found');
        return fail('P04-FE-002', 'No responsive layout patterns found');
      },
    },
    {
      id: 'P04-FE-003',
      category: 'ui',
      severity: 'high',
      description: 'Navigation component exists',
      check: async () => {
        const navFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*nav*.{tsx,jsx}`);
        const headerFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*header*.{tsx,jsx}`);
        if (navFiles.length > 0 || headerFiles.length > 0) {
          return pass('P04-FE-003', 'Navigation/header component found');
        }
        return fail('P04-FE-003', 'No navigation component found');
      },
    },
    {
      id: 'P04-FE-004',
      category: 'ui',
      severity: 'high',
      description: 'Loading states and error boundaries',
      check: async () => {
        const loadingPattern = /loading|spinner|skeleton|ErrorBoundary|error.*boundary/i;
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{tsx,jsx}`);
        let found = false;
        for (const f of componentFiles) {
          if (await codePatternExists(ctx, f, loadingPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P04-FE-004', 'Loading/error states found');
        return fail('P04-FE-004', 'No loading states or error boundaries found');
      },
    },
    {
      id: 'P04-FE-005',
      category: 'accessibility',
      severity: 'medium',
      description: 'Accessibility attributes (aria-labels, alt text)',
      check: async () => {
        const a11yPattern = /aria-|alt=|role=|tabIndex|semantic.*html|main|nav|header/i;
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{tsx,jsx}`);
        let found = false;
        for (const f of componentFiles) {
          if (await codePatternExists(ctx, f, a11yPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P04-FE-005', 'Accessibility attributes found');
        return fail('P04-FE-005', 'No accessibility attributes found');
      },
    },
  ];
}

// ─── PILLAR 5: State Management ─────────────────────────────────────────────

export function createStateChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P05-STATE-001',
      category: 'code',
      severity: 'high',
      description: 'State management solution implemented',
      check: async () => {
        const statePattern = /useReducer|createContext|zustand|redux|jotai|recoil|pinia|mobx|ngrx|@ngrx/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, statePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P05-STATE-001', 'State management solution found');
        return fail('P05-STATE-001', 'No state management solution found');
      },
    },
    {
      id: 'P05-STATE-002',
      category: 'code',
      severity: 'medium',
      description: 'Form state management with validation',
      check: async () => {
        const formPattern = /react-hook-form|formik|useForm|useField|form.*state|FormProvider/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, formPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P05-STATE-002', 'Form state management found');
        return fail('P05-STATE-002', 'No form state management found');
      },
    },
  ];
}

// ─── PILLAR 6: Data Models & Validation ─────────────────────────────────────

export function createDataModelChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P06-DATA-001',
      category: 'code',
      severity: 'critical',
      description: 'TypeScript types/interfaces for all domain objects',
      check: async () => {
        const typeFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/types*.{ts,tsx}`);
        const interfacePattern = /interface\s+\w+|type\s+\w+\s*=/;
        let interfaceCount = 0;
        for (const f of typeFiles) {
          const content = await ctx.fs.read(f);
          const matches = content.match(interfacePattern);
          if (matches) interfaceCount += matches.length;
        }
        if (interfaceCount >= 5) return pass('P06-DATA-001', `${interfaceCount} type definitions found`);
        return fail('P06-DATA-001', `Only ${interfaceCount} type definitions, expected at least 5`);
      },
    },
    {
      id: 'P06-DATA-002',
      category: 'code',
      severity: 'high',
      description: 'Input validation schemas (Zod/Yup/class-validator)',
      check: async () => {
        const validationPattern = /z\.(object|string|number|array|boolean|enum|union|discriminatedUnion)|yup\.|class-validator|@IsString|@IsEmail/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, validationPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P06-DATA-002', 'Input validation schemas found');
        return fail('P06-DATA-002', 'No input validation schemas found');
      },
    },
    {
      id: 'P06-DATA-003',
      category: 'code',
      severity: 'high',
      description: 'DTOs/transformers for API data exchange',
      check: async () => {
        const dtoPattern = /dto|DTO|transform|mapper|serialize|deserialize/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, dtoPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P06-DATA-003', 'DTO/transformer patterns found');
        return fail('P06-DATA-003', 'No DTO or data transformer patterns found');
      },
    },
  ];
}

// ─── PILLAR 7: Error Handling & Resilience ──────────────────────────────────

export function createErrorHandlingChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P07-ERR-001',
      category: 'code',
      severity: 'critical',
      description: 'Global error handler exists',
      check: async () => {
        const errorPattern = /errorHandler|error.*handler|globalError|ErrorBoundary|onError/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, errorPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P07-ERR-001', 'Global error handler found');
        return fail('P07-ERR-001', 'No global error handler found');
      },
    },
    {
      id: 'P07-ERR-002',
      category: 'code',
      severity: 'high',
      description: 'Retry logic with exponential backoff',
      check: async () => {
        const retryPattern = /retry|backoff|exponential|circuit.?breaker|resilience/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, retryPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P07-ERR-002', 'Retry/backoff logic found');
        return fail('P07-ERR-002', 'No retry or circuit breaker logic found');
      },
    },
    {
      id: 'P07-ERR-003',
      category: 'code',
      severity: 'medium',
      description: 'Graceful degradation patterns',
      check: async () => {
        const fallbackPattern = /fallback|graceful|degrad|catchAll|offline/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, fallbackPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P07-ERR-003', 'Graceful degradation patterns found');
        return fail('P07-ERR-003', 'No graceful degradation patterns found');
      },
    },
  ];
}

// ─── PILLAR 8: Logging & Observability ──────────────────────────────────────

export function createLoggingChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P08-LOG-001',
      category: 'code',
      severity: 'high',
      description: 'Structured logging implemented',
      check: async () => {
        const logPattern = /winston|pino|bunyan|logger|log\.(info|warn|error|debug)|console\.(info|warn|error).*\{/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, logPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P08-LOG-001', 'Structured logging found');
        return fail('P08-LOG-001', 'No structured logging found');
      },
    },
    {
      id: 'P08-LOG-002',
      category: 'code',
      severity: 'medium',
      description: 'Request correlation/tracing IDs',
      check: async () => {
        const tracePattern = /traceId|trace_id|correlationId|correlation.?id|requestId|request.?id|x-request/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, tracePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P08-LOG-002', 'Request tracing/correlation found');
        return fail('P08-LOG-002', 'No request tracing or correlation IDs found');
      },
    },
    {
      id: 'P08-LOG-003',
      category: 'code',
      severity: 'medium',
      description: 'Monitoring/metrics integration (Prometheus, Datadog, etc.)',
      check: async () => {
        const metricsPattern = /prometheus|datadog|newrelic|grafana|metrics|monitoring|@opentelemetry|telemetry/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, metricsPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P08-LOG-003', 'Metrics/monitoring integration found');
        return fail('P08-LOG-003', 'No metrics or monitoring integration found');
      },
    },
  ];
}

// ─── PILLAR 9: Caching ──────────────────────────────────────────────────────

export function createCachingChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P09-CACHE-001',
      category: 'code',
      severity: 'medium',
      description: 'Cache layer implementation (Redis, Memcached)',
      check: async () => {
        const cachePattern = /redis|memcached|ioredis|cache.*set|cache.*get|@Cacheable|node-cache/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, cachePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P09-CACHE-001', 'Cache layer found');
        return fail('P09-CACHE-001', 'No cache layer found');
      },
    },
    {
      id: 'P09-CACHE-002',
      category: 'code',
      severity: 'medium',
      description: 'Cache invalidation strategy',
      check: async () => {
        const invalidationPattern = /cache.*invali|cache.*clear|cache.*expir|TTL|ttl.*cache|cache.*ttl|stale.*while.*revalidate/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, invalidationPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P09-CACHE-002', 'Cache invalidation strategy found');
        return fail('P09-CACHE-002', 'No cache invalidation strategy found');
      },
    },
  ];
}

// ─── PILLAR 10: Security ────────────────────────────────────────────────────

export function createSecurityPillarChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P10-SEC-001',
      category: 'security',
      severity: 'critical',
      description: 'Helmet/security headers configured',
      check: async () => {
        const helmetPattern = /helmet|csrf|CORS|cors|setHeader.*Content-Security|helmet\(/i;
        const serverFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*server*.{ts,js}`);
        const middlewareFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/middleware/**/*.{ts,js}`);
        const allFiles = [...serverFiles, ...middlewareFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, helmetPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P10-SEC-001', 'Security headers/middleware found');
        return fail('P10-SEC-001', 'No security headers or CORS/CSRF middleware found');
      },
    },
    {
      id: 'P10-SEC-002',
      category: 'security',
      severity: 'critical',
      description: 'Environment variables for secrets (no hardcoded credentials)',
      check: async () => {
        const envPattern = /process\.env|import\.meta\.env|NEXT_PUBLIC|\.env/;
        const hardcodedSecret = /(?:password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]{8,}['"]/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let usesEnv = false;
        let hasHardcoded = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, envPattern)) usesEnv = true;
          if (await codePatternExists(ctx, f, hardcodedSecret)) {
            hasHardcoded = true;
            break;
          }
        }
        if (hasHardcoded) return fail('P10-SEC-002', 'Hardcoded secrets detected in source files');
        if (usesEnv) return pass('P10-SEC-002', 'Environment variables used for secrets');
        return fail('P10-SEC-002', 'No environment variable usage found');
      },
    },
    {
      id: 'P10-SEC-003',
      category: 'security',
      severity: 'high',
      description: 'Rate limiting implementation',
      check: async () => {
        const ratePattern = /rate.?limit|throttle|express-rate-limit|@nestjs/throttler|rateLimiter/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, ratePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P10-SEC-003', 'Rate limiting found');
        return fail('P10-SEC-003', 'No rate limiting found');
      },
    },
    {
      id: 'P10-SEC-004',
      category: 'security',
      severity: 'high',
      description: 'SQL injection prevention (parameterized queries/ORM)',
      check: async () => {
        const sqlInjectionPattern = /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|query|execute)|knex|typeorm|prisma|sequelize|drizzle|parameterized|prepared.*statement/i;
        const hasRawSQL = /(?:SELECT|INSERT|UPDATE|DELETE).*\$\{|\$\{.*\}/i;
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        const repoFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/repos*/**/*.{ts,js}`);
        const allFiles = [...dbFiles, ...repoFiles];
        let usesORM = false;
        let hasRawSQLVuln = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, sqlInjectionPattern)) {
            usesORM = true;
            if (await codePatternExists(ctx, f, hasRawSQL)) {
              hasRawSQLVuln = true;
            }
            break;
          }
        }
        if (hasRawSQLVuln) return fail('P10-SEC-004', 'Potential SQL injection via string interpolation in queries');
        if (usesORM) return pass('P10-SEC-004', 'ORM/parameterized queries found');
        return fail('P10-SEC-004', 'No ORM or parameterized query protection found');
      },
    },
    {
      id: 'P10-SEC-005',
      category: 'security',
      severity: 'high',
      description: 'XSS prevention (output encoding/sanitization)',
      check: async () => {
        const xssPattern = /DOMPurify|dompurify|xss|sanitize|escapeHtml|escape.*html|dangerouslySetInnerHTML|v-html/i;
        const frontendFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{tsx,jsx,vue}`);
        let found = false;
        let hasDangerous = false;
        for (const f of frontendFiles) {
          if (await codePatternExists(ctx, f, xssPattern)) {
            found = true;
            break;
          }
          if (await codePatternExists(ctx, f, /dangerouslySetInnerHTML|v-html/)) {
            hasDangerous = true;
          }
        }
        if (hasDangerous && !found) return fail('P10-SEC-005', 'dangerouslySetInnerHTML or v-html found without sanitization');
        if (found) return pass('P10-SEC-005', 'XSS prevention found');
        return fail('P10-SEC-005', 'No XSS prevention found');
      },
    },
  ];
}

// ─── PILLAR 11: Testing ─────────────────────────────────────────────────────

export function createTestingChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P11-TEST-001',
      category: 'test',
      severity: 'critical',
      description: 'Unit tests directory and files exist',
      check: async () => {
        const unitTests = await ctx.fs.glob(`${ctx.projectRoot}/**/*.test.{ts,tsx,js,jsx}`);
        const specFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/*.spec.{ts,tsx,js,jsx}`);
        const __tests__ = await ctx.fs.glob(`${ctx.projectRoot}/**/__tests__/**/*.{ts,tsx,js,jsx}`);
        const total = unitTests.length + specFiles.length + __tests__.length;
        if (total >= 3) return pass('P11-TEST-001', `${total} test files found`);
        return fail('P11-TEST-001', `Only ${total} test files found, expected at least 3`);
      },
    },
    {
      id: 'P11-TEST-002',
      category: 'test',
      severity: 'critical',
      description: 'Integration tests exist',
      check: async () => {
        const integrationTests = await ctx.fs.glob(`${ctx.projectRoot}/**/*integration*.{test,spec}.{ts,tsx,js,jsx}`);
        const apiTests = await ctx.fs.glob(`${ctx.projectRoot}/**/api/**/*.{test,spec}.{ts,tsx,js,jsx}`);
        if (integrationTests.length > 0 || apiTests.length > 0) {
          return pass('P11-TEST-002', 'Integration tests found');
        }
        return fail('P11-TEST-002', 'No integration tests found');
      },
    },
    {
      id: 'P11-TEST-003',
      category: 'test',
      severity: 'high',
      description: 'E2E tests directory exists (Playwright/Cypress)',
      check: async () => {
        const e2eDir = await ctx.fs.exists(`${ctx.projectRoot}/e2e`);
        const playwrightDir = await ctx.fs.exists(`${ctx.projectRoot}/tests/e2e`);
        const cypressDir = await ctx.fs.exists(`${ctx.projectRoot}/cypress`);
        const playwrightConfig = await ctx.fs.exists(`${ctx.projectRoot}/playwright.config.ts`);
        const cypressConfig = await ctx.fs.exists(`${ctx.projectRoot}/cypress.config.ts`);
        if (e2eDir || playwrightDir || cypressDir || playwrightConfig || cypressConfig) {
          return pass('P11-TEST-003', 'E2E test framework configured');
        }
        return fail('P11-TEST-003', 'No E2E test framework found');
      },
    },
    {
      id: 'P11-TEST-004',
      category: 'test',
      severity: 'medium',
      description: 'Test coverage configuration exists',
      check: async () => {
        const coveragePattern = /coverage|jest\.config|vitest\.config|cypress.*coverage|istanbul/i;
        const configFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/{jest,vitest,cypress,vitest,playwright}.config*.{ts,js,mjs}`);
        let found = false;
        for (const f of configFiles) {
          if (await codePatternExists(ctx, f, coveragePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P11-TEST-004', 'Coverage configuration found');
        return fail('P11-TEST-004', 'No test coverage configuration found');
      },
    },
  ];
}

// ─── PILLAR 12: CI/CD ───────────────────────────────────────────────────────

export function createCICDChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P12-CI-001',
      category: 'file',
      severity: 'critical',
      description: 'CI/CD pipeline configuration exists',
      check: async () => {
        const githubActions = await ctx.fs.glob(`${ctx.projectRoot}/.github/workflows/*.{yml,yaml}`);
        const gitlabCI = await ctx.fs.exists(`${ctx.projectRoot}/.gitlab-ci.yml`);
        const jenkinsfile = await ctx.fs.exists(`${ctx.projectRoot}/Jenkinsfile`);
        const vercelConfig = await ctx.fs.exists(`${ctx.projectRoot}/vercel.json`);
        const netlifyConfig = await ctx.fs.exists(`${ctx.projectRoot}/netlify.toml`);
        if (githubActions.length > 0 || gitlabCI || jenkinsfile || vercelConfig || netlifyConfig) {
          return pass('P12-CI-001', 'CI/CD pipeline found');
        }
        return fail('P12-CI-001', 'No CI/CD pipeline configuration found');
      },
    },
    {
      id: 'P12-CI-002',
      category: 'test',
      severity: 'high',
      description: 'CI pipeline runs tests automatically',
      check: async () => {
        const ciFiles = await ctx.fs.glob(`${ctx.projectRoot}/.github/workflows/*.{yml,yaml}`);
        if (ciFiles.length === 0) return fail('P12-CI-002', 'No CI files to check');
        let hasTestStep = false;
        for (const f of ciFiles) {
          if (await codePatternExists(ctx, f, /npm.*test|yarn.*test|pnpm.*test|test:|run.*test/i)) {
            hasTestStep = true;
            break;
          }
        }
        if (hasTestStep) return pass('P12-CI-002', 'CI pipeline runs tests');
        return fail('P12-CI-002', 'CI pipeline does not run tests');
      },
    },
    {
      id: 'P12-CI-003',
      category: 'code',
      severity: 'high',
      description: 'Linting in CI pipeline',
      check: async () => {
        const ciFiles = await ctx.fs.glob(`${ctx.projectRoot}/.github/workflows/*.{yml,yaml}`);
        if (ciFiles.length === 0) return fail('P12-CI-003', 'No CI files to check');
        let hasLint = false;
        for (const f of ciFiles) {
          if (await codePatternExists(ctx, f, /lint|linter|eslint|biome|ruff/i)) {
            hasLint = true;
            break;
          }
        }
        if (hasLint) return pass('P12-CI-003', 'Linting in CI pipeline');
        return fail('P12-CI-003', 'No linting in CI pipeline');
      },
    },
  ];
}

// ─── PILLAR 13: Payment Processing ─────────────────────────────────────────

export function createPaymentChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P13-PAY-001',
      category: 'integration',
      severity: 'critical',
      description: 'Payment gateway integration (Stripe/PayPal/etc.)',
      check: async () => {
        const paymentPattern = /stripe|paypal|razorpay|square|adyen|braintree|payment.*intent|checkout.*session/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, paymentPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P13-PAY-001', 'Payment gateway integration found');
        return fail('P13-PAY-001', 'No payment gateway integration found');
      },
    },
    {
      id: 'P13-PAY-002',
      category: 'code',
      severity: 'critical',
      description: 'Payment webhook handling',
      check: async () => {
        const webhookPattern = /webhook|webHook|stripe.*webhook|payment.*callback|payment.*event/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, webhookPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P13-PAY-002', 'Payment webhook handling found');
        return fail('P13-PAY-002', 'No payment webhook handling found');
      },
    },
    {
      id: 'P13-PAY-003',
      category: 'code',
      severity: 'high',
      description: 'Payment security (PCI compliance patterns, no card data storage)',
      check: async () => {
        const cardPattern = /card.*number|credit.*card|cvv|cvc|expir/i;
        const tokenPattern = /paymentMethod|payment_method|tokenize|stripe.*token|nonce/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let storesCard = false;
        let usesToken = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, cardPattern)) storesCard = true;
          if (await codePatternExists(ctx, f, tokenPattern)) usesToken = true;
        }
        if (storesCard && !usesToken) return fail('P13-PAY-003', 'Potentially storing raw card data');
        if (usesToken) return pass('P13-PAY-003', 'Payment tokenization found, no raw card data');
        return fail('P13-PAY-003', 'No payment security patterns found');
      },
    },
  ];
}

// ─── PILLAR 14: Notifications ───────────────────────────────────────────────

export function createNotificationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P14-NOTIF-001',
      category: 'code',
      severity: 'high',
      description: 'Email notification system',
      check: async () => {
        const emailPattern = /sendgrid|mailgun|smtp|nodemailer|Resend|postmark|@sendgrid|email.*send|send.*email/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, emailPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P14-NOTIF-001', 'Email notification system found');
        return fail('P14-NOTIF-001', 'No email notification system found');
      },
    },
    {
      id: 'P14-NOTIF-002',
      category: 'code',
      severity: 'medium',
      description: 'Push notification support',
      check: async () => {
        const pushPattern = /push.*notification|firebase.*messaging|webpush|onesignal|fcm|expo.*notifications/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, pushPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P14-NOTIF-002', 'Push notification support found');
        return fail('P14-NOTIF-002', 'No push notification support found');
      },
    },
    {
      id: 'P14-NOTIF-003',
      category: 'code',
      severity: 'medium',
      description: 'In-app notification system',
      check: async () => {
        const inAppPattern = /notification.*center|toast|alert.*component|notification.*store|useNotification|notification.*context/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, inAppPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P14-NOTIF-003', 'In-app notification system found');
        return fail('P14-NOTIF-003', 'No in-app notification system found');
      },
    },
  ];
}

// ─── PILLAR 15: Storage & File Management ───────────────────────────────────

export function createStorageChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P15-STOR-001',
      category: 'integration',
      severity: 'high',
      description: 'File storage service (S3/GCS/Azure Blob)',
      check: async () => {
        const storagePattern = /s3|S3|gcs|google.*cloud.*storage|azure.*blob|cloudinary|multer|uploadthing|file.*upload/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, storagePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P15-STOR-001', 'File storage service found');
        return fail('P15-STOR-001', 'No file storage service found');
      },
    },
    {
      id: 'P15-STOR-002',
      category: 'code',
      severity: 'high',
      description: 'Image/video processing pipeline',
      check: async () => {
        const mediaPattern = /sharp|jimp|ffmpeg|image.*process|video.*process|thumbnail|resize.*image|compress/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, mediaPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P15-STOR-002', 'Media processing pipeline found');
        return fail('P15-STOR-002', 'No media processing pipeline found');
      },
    },
    {
      id: 'P15-STOR-003',
      category: 'code',
      severity: 'medium',
      description: 'CDN integration for static assets',
      check: async () => {
        const cdnPattern = /cdn|cloudfront|cloudflare|vercel.*cdn|next.*image|next\/image|@vercel/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, cdnPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P15-STOR-003', 'CDN integration found');
        return fail('P15-STOR-003', 'No CDN integration found');
      },
    },
  ];
}

// ─── PILLAR 16: Search & Discovery ──────────────────────────────────────────

export function createSearchChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P16-SEARCH-001',
      category: 'feature',
      severity: 'high',
      description: 'Search functionality implemented',
      check: async () => {
        const searchPattern = /search|SearchBar|searchBox|fulltext|elasticsearch|algolia|meilisearch|typesense|fuse\.js/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, searchPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P16-SEARCH-001', 'Search functionality found');
        return fail('P16-SEARCH-001', 'No search functionality found');
      },
    },
    {
      id: 'P16-SEARCH-002',
      category: 'feature',
      severity: 'medium',
      description: 'Filtering and faceted search',
      check: async () => {
        const filterPattern = /filter|facet|refine.*search|price.*range|category.*filter/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, filterPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P16-SEARCH-002', 'Filtering/faceted search found');
        return fail('P16-SEARCH-002', 'No filtering or faceted search found');
      },
    },
    {
      id: 'P16-SEARCH-003',
      category: 'feature',
      severity: 'medium',
      description: 'Search autocomplete/suggestions',
      check: async () => {
        const autocompletePattern = /autocomplete|auto.?complete|suggestion|debounce.*search|search.*suggest/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, autocompletePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P16-SEARCH-003', 'Search autocomplete found');
        return fail('P16-SEARCH-003', 'No search autocomplete found');
      },
    },
  ];
}

// ─── PILLAR 17: Analytics & Monitoring ──────────────────────────────────────

export function createAnalyticsChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P17-ANAL-001',
      category: 'integration',
      severity: 'high',
      description: 'Analytics integration (GA4, Mixpanel, etc.)',
      check: async () => {
        const analyticsPattern = /google.*analytics|gtag|GA4|mixpanel|amplitude|segment|posthog|plausible|umami|matomo/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        const layoutFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/layout.{ts,tsx}`);
        let found = false;
        const checkFiles = [...sourceFiles, ...layoutFiles];
        for (const f of checkFiles) {
          if (await codePatternExists(ctx, f, analyticsPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P17-ANAL-001', 'Analytics integration found');
        return fail('P17-ANAL-001', 'No analytics integration found');
      },
    },
    {
      id: 'P17-ANAL-002',
      category: 'feature',
      severity: 'medium',
      description: 'Custom event tracking for user actions',
      check: async () => {
        const eventPattern = /track\(|trackEvent|analytics\.|gtag\(.*event|posthog\.capture|mixpanel\.track/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, eventPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P17-ANAL-002', 'Custom event tracking found');
        return fail('P17-ANAL-002', 'No custom event tracking found');
      },
    },
    {
      id: 'P17-ANAL-003',
      category: 'code',
      severity: 'medium',
      description: 'Health check / status page endpoint',
      check: async () => {
        const healthPattern = /health|healthz|status|ping|readiness|liveness/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, healthPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P17-ANAL-003', 'Health check endpoint found');
        return fail('P17-ANAL-003', 'No health check endpoint found');
      },
    },
  ];
}

// ─── PILLAR 18: Performance ─────────────────────────────────────────────────

export function createPerformanceChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P18-PERF-001',
      category: 'performance',
      severity: 'high',
      description: 'Code splitting / lazy loading implemented',
      check: async () => {
        const lazyPattern = /lazy\(|dynamic\(|loadable|import\(\)|next\/dynamic|lazy.*import/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, lazyPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P18-PERF-001', 'Code splitting/lazy loading found');
        return fail('P18-PERF-001', 'No code splitting or lazy loading found');
      },
    },
    {
      id: 'P18-PERF-002',
      category: 'performance',
      severity: 'high',
      description: 'Image optimization (next/image, srcset, etc.)',
      check: async () => {
        const imgPattern = /next\/image|Image.*component|srcset|sizes=|loading.*lazy|blur.*placeholder/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, imgPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P18-PERF-002', 'Image optimization found');
        return fail('P18-PERF-002', 'No image optimization found');
      },
    },
    {
      id: 'P18-PERF-003',
      category: 'performance',
      severity: 'medium',
      description: 'Bundle size configuration (tree shaking, limits)',
      check: async () => {
        const bundlePattern = /bundle|tree.?shak|sideEffects|chunk|split.*chunk|vite.*build|rollup/i;
        const configFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/{vite,webpack,rollup,next}.config*.{ts,js,mjs}`);
        let found = false;
        for (const f of configFiles) {
          if (await codePatternExists(ctx, f, bundlePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P18-PERF-003', 'Bundle configuration found');
        return fail('P18-PERF-003', 'No bundle optimization configuration found');
      },
    },
  ];
}

// ─── PILLAR 19: Accessibility ───────────────────────────────────────────────

export function createAccessibilityChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'P19-A11Y-001',
      category: 'accessibility',
      severity: 'high',
      description: 'Semantic HTML elements used',
      check: async () => {
        const semanticPattern = /<main|<nav|<header|<footer|<section|<article|<aside|<form|<label/i;
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{tsx,jsx}`);
        let found = false;
        for (const f of componentFiles) {
          if (await codePatternExists(ctx, f, semanticPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P19-A11Y-001', 'Semantic HTML elements found');
        return fail('P19-A11Y-001', 'No semantic HTML elements found');
      },
    },
    {
      id: 'P19-A11Y-002',
      category: 'accessibility',
      severity: 'high',
      description: 'Keyboard navigation support',
      check: async () => {
        const kbPattern = /onKeyDown|onKeyUp|keyDown|keyboard|tabIndex|tabindex|focus|blur|onFocus|onBlur/i;
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{tsx,jsx}`);
        let found = false;
        for (const f of componentFiles) {
          if (await codePatternExists(ctx, f, kbPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P19-A11Y-002', 'Keyboard navigation found');
        return fail('P19-A11Y-002', 'No keyboard navigation found');
      },
    },
    {
      id: 'P19-A11Y-003',
      category: 'accessibility',
      severity: 'high',
      description: 'Color contrast and screen reader support',
      check: async () => {
        const a11yPattern = /aria-|role=|aria-label|sr-only|screenReader|contrast|WCAG/i;
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{tsx,jsx}`);
        let found = false;
        for (const f of componentFiles) {
          if (await codePatternExists(ctx, f, a11yPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('P19-A11Y-003', 'Accessibility attributes found');
        return fail('P19-A11Y-003', 'No accessibility attributes found');
      },
    },
  ];
}

// ─── Aggregate all feature checks ───────────────────────────────────────────

export function createAllFeatureChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    ...createAuthChecks(ctx),
    ...createDatabaseChecks(ctx),
    ...createApiChecks(ctx),
    ...createFrontendChecks(ctx),
    ...createStateChecks(ctx),
    ...createDataModelChecks(ctx),
    ...createErrorHandlingChecks(ctx),
    ...createLoggingChecks(ctx),
    ...createCachingChecks(ctx),
    ...createSecurityPillarChecks(ctx),
    ...createTestingChecks(ctx),
    ...createCICDChecks(ctx),
    ...createPaymentChecks(ctx),
    ...createNotificationChecks(ctx),
    ...createStorageChecks(ctx),
    ...createSearchChecks(ctx),
    ...createAnalyticsChecks(ctx),
    ...createPerformanceChecks(ctx),
    ...createAccessibilityChecks(ctx),
  ];
}
