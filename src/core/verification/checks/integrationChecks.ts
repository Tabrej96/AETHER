/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Integration Checks - Verifies cross-system connectivity and completeness
 *
 * These checks verify that systems connect properly: database-to-API,
 * API-to-frontend, auth flows, payment integrations, etc.
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

// ─── Database Schema Completeness ───────────────────────────────────────────

export function createDatabaseIntegrationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-DB-001',
      category: 'integration',
      severity: 'critical',
      description: 'Database connection pool configured',
      check: async () => {
        const poolPattern = /pool|connectionPool|createPool|maxConnection|minConnection|connectionLimit/i;
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        let found = false;
        for (const f of dbFiles) {
          if (await codePatternExists(ctx, f, poolPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-DB-001', 'Connection pool configured');
        return fail('INT-DB-001', 'No connection pool configured');
      },
    },
    {
      id: 'INT-DB-002',
      category: 'integration',
      severity: 'critical',
      description: 'Database migrations are versioned and reversible',
      check: async () => {
        const migrationPattern = /up:|down:|createTable|create.*table|alterTable|migration.*name/i;
        const migrationFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/migrations/**/*.{ts,js,sql}`);
        if (migrationFiles.length === 0) {
          return fail('INT-DB-002', 'No migration files found');
        }
        let hasVersioning = false;
        for (const f of migrationFiles) {
          if (await codePatternExists(ctx, f, migrationPattern)) {
            hasVersioning = true;
            break;
          }
        }
        if (hasVersioning) return pass('INT-DB-002', 'Versioned migrations found');
        return fail('INT-DB-002', 'Migration files exist but lack versioning structure');
      },
    },
    {
      id: 'INT-DB-003',
      category: 'integration',
      severity: 'high',
      description: 'Database seed data for development',
      check: async () => {
        const seedPattern = /seed|fixture|factory|faker|test.*data/i;
        const seedFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/seed*.{ts,js}`);
        const fixtureFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/fixtures/**/*.{ts,js,json}`);
        if (seedFiles.length > 0 || fixtureFiles.length > 0) {
          return pass('INT-DB-003', 'Seed/fixture data found');
        }
        return fail('INT-DB-003', 'No seed data or fixtures found');
      },
    },
  ];
}

// ─── API Endpoint Coverage ──────────────────────────────────────────────────

export function createApiIntegrationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-API-001',
      category: 'integration',
      severity: 'critical',
      description: 'All API endpoints have consistent response format',
      check: async () => {
        const responsePattern = /res\.json|Response\.json|return\s+\{.*success|apiResponse|ApiResponse|standardResponse/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let consistentCount = 0;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, responsePattern)) consistentCount++;
        }
        if (allFiles.length === 0) return fail('INT-API-001', 'No API files found');
        if (consistentCount === allFiles.length) return pass('INT-API-001', 'All API endpoints have consistent response format');
        if (consistentCount > 0) return pass('INT-API-001', `Consistent response format in ${consistentCount}/${allFiles.length} endpoints`);
        return fail('INT-API-001', 'No consistent response format found');
      },
    },
    {
      id: 'INT-API-002',
      category: 'integration',
      severity: 'critical',
      description: 'API documentation (OpenAPI/Swagger) exists',
      check: async () => {
        const docsPattern = /swagger|openapi|@Api|@Route|apiDoc|swagger-ui|redoc/i;
        const docFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/{openapi,swagger}*.{yaml,yml,json}`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of [...docFiles, ...sourceFiles]) {
          if (await codePatternExists(ctx, f, docsPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-API-002', 'API documentation found');
        return fail('INT-API-002', 'No API documentation (OpenAPI/Swagger) found');
      },
    },
    {
      id: 'INT-API-003',
      category: 'integration',
      severity: 'high',
      description: 'API request/response logging for debugging',
      check: async () => {
        const logPattern = /req\.log|res\.log|morgan|logger.*request|request.*logger|http.*log/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, logPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-API-003', 'API request logging found');
        return fail('INT-API-003', 'No API request logging found');
      },
    },
  ];
}

// ─── Frontend-Backend Connectivity ──────────────────────────────────────────

export function createFrontendBackendChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-FB-001',
      category: 'integration',
      severity: 'critical',
      description: 'API client/service layer exists in frontend',
      check: async () => {
        const apiClientPattern = /axios|fetch\(|apiClient|http\.create|api\.service|useApi|queryClient|@tanstack/i;
        const frontendFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of frontendFiles) {
          if (await codePatternExists(ctx, f, apiClientPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-FB-001', 'API client layer found');
        return fail('INT-FB-001', 'No API client/service layer found');
      },
    },
    {
      id: 'INT-FB-002',
      category: 'integration',
      severity: 'critical',
      description: 'Frontend makes real API calls (not mock data)',
      check: async () => {
        const mockPattern = /mock.*data|mockData|fake.*data|static.*data|hardcoded.*response/i;
        const apiPattern = /fetch\(|axios\.|api\.get|api\.post|useQuery|useMutation|apiClient/i;
        const frontendFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let hasMock = false;
        let hasRealApi = false;
        for (const f of frontendFiles) {
          if (await codePatternExists(ctx, f, mockPattern)) hasMock = true;
          if (await codePatternExists(ctx, f, apiPattern)) hasRealApi = true;
        }
        if (hasRealApi) return pass('INT-FB-002', 'Real API calls found in frontend');
        if (hasMock) return fail('INT-FB-002', 'Only mock data found, no real API calls');
        return fail('INT-FB-002', 'No API calls or mock data found in frontend');
      },
    },
    {
      id: 'INT-FB-003',
      category: 'integration',
      severity: 'high',
      description: 'Loading states while fetching data',
      check: async () => {
        const loadingPattern = /isLoading|loading:|pending|skeleton|spin|loading.*state/i;
        const frontendFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of frontendFiles) {
          if (await codePatternExists(ctx, f, loadingPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-FB-003', 'Loading states found');
        return fail('INT-FB-003', 'No loading states for async data fetching');
      },
    },
    {
      id: 'INT-FB-004',
      category: 'integration',
      severity: 'high',
      description: 'Error handling for API failures in frontend',
      check: async () => {
        const errorPattern = /isError|error:|onError|catch.*error|ErrorResponse|api.*error/i;
        const frontendFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of frontendFiles) {
          if (await codePatternExists(ctx, f, errorPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-FB-004', 'API error handling in frontend found');
        return fail('INT-FB-004', 'No API error handling in frontend');
      },
    },
  ];
}

// ─── Authentication Flow ────────────────────────────────────────────────────

export function createAuthIntegrationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-AUTH-001',
      category: 'integration',
      severity: 'critical',
      description: 'Protected routes require authentication',
      check: async () => {
        const protectedPattern = /requireAuth|useAuth|protected.*route|auth.*guard|middleware.*auth|withAuth|authenticated/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, protectedPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-AUTH-001', 'Protected route middleware/guards found');
        return fail('INT-AUTH-001', 'No protected route implementation found');
      },
    },
    {
      id: 'INT-AUTH-002',
      category: 'integration',
      severity: 'critical',
      description: 'Token refresh mechanism implemented',
      check: async () => {
        const refreshPattern = /refresh.*token|refreshToken|accessToken.*refresh|token.*refresh|renew.*token/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, refreshPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-AUTH-002', 'Token refresh mechanism found');
        return fail('INT-AUTH-002', 'No token refresh mechanism found');
      },
    },
    {
      id: 'INT-AUTH-003',
      category: 'integration',
      severity: 'high',
      description: 'Session management with expiration',
      check: async () => {
        const sessionPattern = /session.*expir|maxAge|expiresIn|sessionTimeout|token.*expir|jwt.*exp/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, sessionPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-AUTH-003', 'Session expiration found');
        return fail('INT-AUTH-003', 'No session expiration found');
      },
    },
    {
      id: 'INT-AUTH-004',
      category: 'integration',
      severity: 'high',
      description: 'Logout with token/session invalidation',
      check: async () => {
        const logoutPattern = /logout|signOut|sign.?out|invalidate.*token|destroy.*session/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, logoutPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-AUTH-004', 'Logout with token invalidation found');
        return fail('INT-AUTH-004', 'No logout or session invalidation found');
      },
    },
  ];
}

// ─── Payment Integration ────────────────────────────────────────────────────

export function createPaymentIntegrationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-PAY-001',
      category: 'integration',
      severity: 'critical',
      description: 'Payment intent/order creation flow',
      check: async () => {
        const intentPattern = /paymentIntent|createPayment|createOrder|checkout.*session|payment.*flow/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, intentPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-PAY-001', 'Payment creation flow found');
        return fail('INT-PAY-001', 'No payment intent/order creation flow found');
      },
    },
    {
      id: 'INT-PAY-002',
      category: 'integration',
      severity: 'critical',
      description: 'Order confirmation and receipt generation',
      check: async () => {
        const orderPattern = /order.*confirm|receipt|invoice|order.*complete|order.*success/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, orderPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-PAY-002', 'Order confirmation/receipt found');
        return fail('INT-PAY-002', 'No order confirmation or receipt generation found');
      },
    },
    {
      id: 'INT-PAY-003',
      category: 'integration',
      severity: 'high',
      description: 'Refund/chargeback handling',
      check: async () => {
        const refundPattern = /refund|chargeback|dispute|reversal/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, refundPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-PAY-003', 'Refund handling found');
        return fail('INT-PAY-003', 'No refund or chargeback handling found');
      },
    },
  ];
}

// ─── Notification System ────────────────────────────────────────────────────

export function createNotificationIntegrationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-NOTIF-001',
      category: 'integration',
      severity: 'high',
      description: 'Notification queue/worker system',
      check: async () => {
        const queuePattern = /queue|bull|bullmq|worker|job.*queue|message.*queue|resend|sendgrid.*send/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, queuePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-NOTIF-001', 'Notification queue/worker found');
        return fail('INT-NOTIF-001', 'No notification queue or worker system found');
      },
    },
    {
      id: 'INT-NOTIF-002',
      category: 'integration',
      severity: 'medium',
      description: 'Notification templates (email, push)',
      check: async () => {
        const templatePattern = /template|Template|emailTemplate|notificationTemplate|renderTemplate|handlebars|ejs|mjml/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        const templateFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/templates/**/*.{ts,tsx,html,ejs}`);
        const allFiles = [...sourceFiles, ...templateFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, templatePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-NOTIF-002', 'Notification templates found');
        return fail('INT-NOTIF-002', 'No notification templates found');
      },
    },
    {
      id: 'INT-NOTIF-003',
      category: 'integration',
      severity: 'medium',
      description: 'Notification preferences management',
      check: async () => {
        const prefsPattern = /notification.*pref|preferences|email.*pref|push.*pref|unsubscribe|opt.?out/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, prefsPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-NOTIF-003', 'Notification preferences found');
        return fail('INT-NOTIF-003', 'No notification preferences management found');
      },
    },
  ];
}

// ─── Analytics Tracking ─────────────────────────────────────────────────────

export function createAnalyticsIntegrationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-ANAL-001',
      category: 'integration',
      severity: 'medium',
      description: 'Page view tracking on route changes',
      check: async () => {
        const pageViewPattern = /pageview|page_view|screen_view|route.*change|usePathname|router\.events|pageView/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, pageViewPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-ANAL-001', 'Page view tracking found');
        return fail('INT-ANAL-001', 'No page view tracking found');
      },
    },
    {
      id: 'INT-ANAL-002',
      category: 'integration',
      severity: 'medium',
      description: 'Conversion funnel tracking',
      check: async () => {
        const funnelPattern = /funnel|conversion|checkout.*step|addToCart|purchase|add_to_cart|begin_checkout/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, funnelPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-ANAL-002', 'Conversion funnel tracking found');
        return fail('INT-ANAL-002', 'No conversion funnel tracking found');
      },
    },
    {
      id: 'INT-ANAL-003',
      category: 'integration',
      severity: 'low',
      description: 'Error tracking (Sentry, Bugsnag)',
      check: async () => {
        const errorTrackingPattern = /sentry|bugsnag|bug.*track|error.*track|rollbar|airbrake/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, errorTrackingPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-ANAL-003', 'Error tracking integration found');
        return fail('INT-ANAL-003', 'No error tracking integration found');
      },
    },
  ];
}

// ─── Component Coverage ─────────────────────────────────────────────────────

export function createComponentCoverageChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-COMP-001',
      category: 'integration',
      severity: 'high',
      description: 'UI components are composable and reusable',
      check: async () => {
        const componentPattern = /export\s+(?:default\s+)?(?:function|const)\s+\w+.*:.*React\.(FC|FunctionComponent|Node)|export\s+(?:default\s+)?(?:function|const)\s+\w+.*props/;
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/components/**/*.{tsx,jsx}`);
        let componentCount = 0;
        for (const f of componentFiles) {
          if (await codePatternExists(ctx, f, componentPattern)) componentCount++;
        }
        if (componentCount >= 5) return pass('INT-COMP-001', `${componentCount} reusable components found`);
        return fail('INT-COMP-001', `Only ${componentCount} components found, expected at least 5`);
      },
    },
    {
      id: 'INT-COMP-002',
      category: 'integration',
      severity: 'medium',
      description: 'Component library or design system present',
      check: async () => {
        const designSystemPattern = /shadcn|chakra|MUI|material-ui|antd|radix|headless|Mantine|@mui|design.?system/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        const packageJson = `${ctx.projectRoot}/package.json`;
        let found = false;
        if (await codePatternExists(ctx, packageJson, designSystemPattern)) {
          found = true;
        }
        if (!found) {
          for (const f of sourceFiles) {
            if (await codePatternExists(ctx, f, designSystemPattern)) {
              found = true;
              break;
            }
          }
        }
        if (found) return pass('INT-COMP-002', 'Design system / component library found');
        return fail('INT-COMP-002', 'No design system or component library found');
      },
    },
  ];
}

// ─── Third-Party Service Integration ────────────────────────────────────────

export function createThirdPartyChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'INT-TP-001',
      category: 'integration',
      severity: 'medium',
      description: 'Third-party API error handling with fallback',
      check: async () => {
        const thirdPartyPattern = /axios|fetch\(|api\.|service\.|third.?party|external.*api/i;
        const fallbackPattern = /fallback|retry|cache.*fail|graceful.*degrad/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let hasThirdParty = false;
        let hasFallback = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, thirdPartyPattern)) hasThirdParty = true;
          if (await codePatternExists(ctx, f, fallbackPattern)) hasFallback = true;
        }
        if (!hasThirdParty) return fail('INT-TP-001', 'No third-party API calls found');
        if (hasThirdParty && hasFallback) return pass('INT-TP-001', 'Third-party APIs with fallback handling');
        return pass('INT-TP-001', 'Third-party API calls found (fallback not required for all projects)');
      },
    },
    {
      id: 'INT-TP-002',
      category: 'integration',
      severity: 'medium',
      description: 'Environment-based service configuration',
      check: async () => {
        const envConfigPattern = /process\.env|import\.meta\.env|NEXT_PUBLIC|VITE_|config\..*env|environment/i;
        const configFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/config*/**/*.{ts,js}`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of [...configFiles, ...sourceFiles]) {
          if (await codePatternExists(ctx, f, envConfigPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('INT-TP-002', 'Environment-based configuration found');
        return fail('INT-TP-002', 'No environment-based service configuration found');
      },
    },
  ];
}

// ─── Aggregate all integration checks ───────────────────────────────────────

export function createAllIntegrationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    ...createDatabaseIntegrationChecks(ctx),
    ...createApiIntegrationChecks(ctx),
    ...createFrontendBackendChecks(ctx),
    ...createAuthIntegrationChecks(ctx),
    ...createPaymentIntegrationChecks(ctx),
    ...createNotificationIntegrationChecks(ctx),
    ...createAnalyticsIntegrationChecks(ctx),
    ...createComponentCoverageChecks(ctx),
    ...createThirdPartyChecks(ctx),
  ];
}
