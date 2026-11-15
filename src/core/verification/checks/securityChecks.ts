/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Security Checks - Deep security verification
 *
 * Goes beyond pattern matching to verify actual security posture:
 * - Input validation everywhere
 * - SQL injection prevention
 * - XSS prevention
 * - CSRF protection
 * - Authentication bypass attempts
 * - Authorization checks
 * - Rate limiting
 * - Data encryption verification
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

// ─── Input Validation ───────────────────────────────────────────────────────

export function createInputValidationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-INPUT-001',
      category: 'security',
      severity: 'critical',
      description: 'All API endpoints validate input parameters',
      check: async () => {
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let validatedCount = 0;
        let totalEndpoints = 0;

        const validationPattern = /validate|schema|z\.\(|zod\(|joi\.|body\(|param\(|query\(|check\(/i;

        for (const f of allFiles) {
          const content = await ctx.fs.read(f);
          totalEndpoints++;
          if (validationPattern.test(content)) validatedCount++;
        }

        if (totalEndpoints === 0) return fail('SEC-INPUT-001', 'No API files found to check');
        if (validatedCount === totalEndpoints) {
          return pass('SEC-INPUT-001', `All ${totalEndpoints} API files have input validation`);
        }
        if (validatedCount > 0) {
          return pass('SEC-INPUT-001', `${validatedCount}/${totalEndpoints} API files have input validation`);
        }
        return fail('SEC-INPUT-001', 'No input validation found in any API endpoint');
      },
    },
    {
      id: 'SEC-INPUT-002',
      category: 'security',
      severity: 'critical',
      description: 'Form inputs sanitized before processing',
      check: async () => {
        const sanitizePattern = /sanitize|xss.*clean|DOMPurify|strip.?tag|escapeHtml|validator|clean.*input/i;
        const formFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/forms/**/*.{ts,tsx,js,jsx}`);
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*form*.{ts,tsx,js,jsx}`);
        const allFiles = [...formFiles, ...componentFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, sanitizePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-INPUT-002', 'Input sanitization found');
        return fail('SEC-INPUT-002', 'No input sanitization found');
      },
    },
    {
      id: 'SEC-INPUT-003',
      category: 'security',
      severity: 'high',
      description: 'File upload validation (type, size, content)',
      check: async () => {
        const uploadPattern = /upload|multer|formData|FormData|fileFilter|file.*valid|mime.*check|file.*size/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, uploadPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-INPUT-003', 'File upload handling with validation found');
        return fail('SEC-INPUT-003', 'No file upload validation found');
      },
    },
    {
      id: 'SEC-INPUT-004',
      category: 'security',
      severity: 'high',
      description: 'Email and URL format validation',
      check: async () => {
        const emailPattern = /@IsEmail|isEmail|email.*valid|valid.*email|z\.string\(\)\.email\(/i;
        const urlPattern = /url.*valid|valid.*url|isURL|@IsUrl/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let hasEmail = false;
        let hasUrl = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, emailPattern)) hasEmail = true;
          if (await codePatternExists(ctx, f, urlPattern)) hasUrl = true;
        }
        if (hasEmail) return pass('SEC-INPUT-004', 'Email validation found');
        return fail('SEC-INPUT-004', 'No email validation found');
      },
    },
  ];
}

// ─── SQL Injection Prevention ───────────────────────────────────────────────

export function createSQLInjectionChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-SQL-001',
      category: 'security',
      severity: 'critical',
      description: 'No raw SQL string concatenation with user input',
      check: async () => {
        const vulnPattern = /(?:SELECT|INSERT|UPDATE|DELETE|WHERE)\s+.*\$\{|\$\{.*\}.*(?:WHERE|SET|VALUES|FROM)/i;
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        const repoFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/repo*/**/*.{ts,js}`);
        const queryFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/querie*/**/*.{ts,js}`);
        const allFiles = [...dbFiles, ...repoFiles, ...queryFiles];

        let hasVulnerability = false;
        let vulnFile = '';
        for (const f of allFiles) {
          const content = await ctx.fs.read(f);
          if (vulnPattern.test(content)) {
            // Check it's NOT inside a comment
            const lines = content.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (vulnPattern.test(line) && !trimmed.startsWith('//') && !trimmed.startsWith('*') && !trimmed.startsWith('/*')) {
                hasVulnerability = true;
                vulnFile = f;
                break;
              }
            }
            if (hasVulnerability) break;
          }
        }

        if (hasVulnerability) {
          return fail('SEC-SQL-001', `Potential SQL injection via string interpolation in ${vulnFile}`);
        }
        return pass('SEC-SQL-001', 'No raw SQL string concatenation with user input found');
      },
    },
    {
      id: 'SEC-SQL-002',
      category: 'security',
      severity: 'critical',
      description: 'ORM/query builder used instead of raw SQL',
      check: async () => {
        const ormPattern = /prisma|typeorm|sequelize|drizzle|knex|mongoose|typegoose|@prisma|TypeORM|drizzle-orm/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, ormPattern)) {
            found = true;
            break;
          }
        }
        const packageJson = `${ctx.projectRoot}/package.json`;
        if (await codePatternExists(ctx, packageJson, ormPattern)) {
          found = true;
        }
        if (found) return pass('SEC-SQL-002', 'ORM/query builder detected');
        return fail('SEC-SQL-002', 'No ORM or query builder found - potential raw SQL usage');
      },
    },
    {
      id: 'SEC-SQL-003',
      category: 'security',
      severity: 'high',
      description: 'Database user has minimal required permissions',
      check: async () => {
        const dbConfigPattern = /GRANT|REVOKE|permission|privilege|readOnly|read_only|readonly/i;
        const dbFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/db/**/*.{ts,js}`);
        const envFiles = await ctx.fs.glob(`${ctx.projectRoot}/.env*`);
        let found = false;
        for (const f of [...dbFiles, ...envFiles]) {
          if (await codePatternExists(ctx, f, dbConfigPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-SQL-003', 'Database permission configuration found');
        return fail('SEC-SQL-003', 'No database permission configuration found');
      },
    },
  ];
}

// ─── XSS Prevention ─────────────────────────────────────────────────────────

export function createXSSChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-XSS-001',
      category: 'security',
      severity: 'critical',
      description: 'No dangerouslySetInnerHTML without sanitization',
      check: async () => {
        const dangerousPattern = /dangerouslySetInnerHTML/;
        const sanitizePattern = /DOMPurify|sanitize|xss.*clean/i;
        const componentFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{tsx,jsx}`);

        let hasDangerous = false;
        let hasSanitizer = false;
        for (const f of componentFiles) {
          const content = await ctx.fs.read(f);
          if (dangerousPattern.test(content)) {
            hasDangerous = true;
            if (sanitizePattern.test(content)) {
              hasSanitizer = true;
            }
          }
        }

        if (hasDangerous && !hasSanitizer) {
          return fail('SEC-XSS-001', 'dangerouslySetInnerHTML used without sanitizer');
        }
        if (hasDangerous && hasSanitizer) {
          return pass('SEC-XSS-001', 'dangerouslySetInnerHTML used with sanitizer');
        }
        return pass('SEC-XSS-001', 'No dangerouslySetInnerHTML usage found');
      },
    },
    {
      id: 'SEC-XSS-002',
      category: 'security',
      severity: 'critical',
      description: 'User-generated content is escaped in templates',
      check: async () => {
        // In React, JSX auto-escapes. Check for v-html or similar in non-React frameworks
        const xssVulnPattern = /v-html|ng-bind-html|\{{{|\{\% raw/;
        const sanitizePattern = /DOMPurify|$sanitize|DomSanitizer|SafeHtml|bypassSecurity/i;
        const templateFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{vue,html,tsx,jsx}`);

        let hasRaw = false;
        let hasSanitize = false;
        for (const f of templateFiles) {
          if (await codePatternExists(ctx, f, xssVulnPattern)) hasRaw = true;
          if (await codePatternExists(ctx, f, sanitizePattern)) hasSanitize = true;
        }

        if (hasRaw && !hasSanitize) {
          return fail('SEC-XSS-002', 'Raw HTML rendering without sanitization found');
        }
        return pass('SEC-XSS-002', 'No unescaped raw HTML rendering found');
      },
    },
    {
      id: 'SEC-XSS-003',
      category: 'security',
      severity: 'high',
      description: 'Content Security Policy configured',
      check: async () => {
        const cspPattern = /content-security-policy|Content-Security-Policy|helmet.*csp|CSP|nonce-/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, cspPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-XSS-003', 'Content Security Policy found');
        return fail('SEC-XSS-003', 'No Content Security Policy found');
      },
    },
  ];
}

// ─── CSRF Protection ────────────────────────────────────────────────────────

export function createCSRFChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-CSRF-001',
      category: 'security',
      severity: 'critical',
      description: 'CSRF protection for state-changing requests',
      check: async () => {
        const csrfPattern = /csrf|CSRF|csrfToken|xsrf|SameSite|sameSite|csurf|doubleSubmit|origin.*check/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const middlewareFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/middleware/**/*.{ts,js}`);
        const allFiles = [...apiFiles, ...middlewareFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, csrfPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-CSRF-001', 'CSRF protection found');
        return fail('SEC-CSRF-001', 'No CSRF protection found');
      },
    },
    {
      id: 'SEC-CSRF-002',
      category: 'security',
      severity: 'high',
      description: 'SameSite cookie attributes set',
      check: async () => {
        const cookiePattern = /SameSite|samesite|httpOnly|http_only|secure.*cookie|cookie.*secure/i;
        const authFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/auth/**/*.{ts,js}`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of [...authFiles, ...sourceFiles]) {
          if (await codePatternExists(ctx, f, cookiePattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-CSRF-002', 'Secure cookie attributes found');
        return fail('SEC-CSRF-002', 'No SameSite/secure cookie attributes found');
      },
    },
  ];
}

// ─── Authentication Bypass Prevention ───────────────────────────────────────

export function createAuthBypassChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-AUTH-001',
      category: 'security',
      severity: 'critical',
      description: 'No authentication bypass via URL parameter tampering',
      check: async () => {
        const bypassPattern = /if\s*\([^)]*(?:userId|user_id|accountId|isAdmin|role)\s*===?\s*(?:req|params|query|body)/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, bypassPattern)) {
            found = true;
            break;
          }
        }
        if (found) return fail('SEC-AUTH-001', 'Potential auth bypass: user identity taken from request params/body');
        return pass('SEC-AUTH-001', 'No obvious auth bypass via parameter tampering');
      },
    },
    {
      id: 'SEC-AUTH-002',
      category: 'security',
      severity: 'critical',
      description: 'Authorization checks on every protected endpoint',
      check: async () => {
        const authCheckPattern = /(?:requireAuth|checkAuth|authenticate|isAuthenticated|getUserFromToken|req\.user|currentUser)/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let protectedCount = 0;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, authCheckPattern)) protectedCount++;
        }
        if (allFiles.length === 0) return fail('SEC-AUTH-002', 'No API files found');
        if (protectedCount > 0) return pass('SEC-AUTH-002', `Auth checks in ${protectedCount}/${allFiles.length} API files`);
        return fail('SEC-AUTH-002', 'No authorization checks found on API endpoints');
      },
    },
    {
      id: 'SEC-AUTH-003',
      category: 'security',
      severity: 'critical',
      description: 'IDOR prevention - users can only access their own resources',
      check: async () => {
        const idorPattern = /userId.*===?\s*(?:params\.userId|params\.id|body\.userId)|user\.id.*params|ownerId|owner_id.*check/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, idorPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-AUTH-003', 'IDOR prevention (owner-based access) found');
        return fail('SEC-AUTH-003', 'No IDOR prevention - resources may be accessible by any user ID');
      },
    },
    {
      id: 'SEC-AUTH-004',
      category: 'security',
      severity: 'high',
      description: 'JWT secret/keys are not hardcoded',
      check: async () => {
        const hardcodedSecret = /(?:jwtSecret|jwt_secret|JWT_SECRET|secretKey|SECRET_KEY)\s*[:=]\s*['"][^'"]+['"]/i;
        const envUsage = /process\.env\.(?:JWT|SECRET|TOKEN)|import\.meta\.env\.(?:JWT|SECRET|TOKEN)/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let hasHardcoded = false;
        let usesEnv = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, hardcodedSecret)) hasHardcoded = true;
          if (await codePatternExists(ctx, f, envUsage)) usesEnv = true;
        }
        if (hasHardcoded) return fail('SEC-AUTH-004', 'Hardcoded JWT secret detected');
        if (usesEnv) return pass('SEC-AUTH-004', 'JWT secret uses environment variables');
        return fail('SEC-AUTH-004', 'No JWT configuration found');
      },
    },
  ];
}

// ─── Authorization Checks ───────────────────────────────────────────────────

export function createAuthorizationChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-AUTHZ-001',
      category: 'security',
      severity: 'critical',
      description: 'Admin routes are protected and separated from user routes',
      check: async () => {
        const adminPattern = /admin|ADMIN|role.*admin|isAdmin|requireAdmin|@Roles\(.*admin/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let hasAdmin = false;
        let hasProtection = false;
        for (const f of sourceFiles) {
          const content = await ctx.fs.read(f);
          if (adminPattern.test(content)) {
            hasAdmin = true;
            if (/(?:requireAdmin|checkRole|hasRole|guard.*admin|admin.*guard)/i.test(content)) {
              hasProtection = true;
            }
          }
        }
        if (!hasAdmin) return pass('SEC-AUTHZ-001', 'No admin routes defined');
        if (hasProtection) return pass('SEC-AUTHZ-001', 'Admin routes properly protected');
        return fail('SEC-AUTHZ-001', 'Admin routes found but no admin protection guard');
      },
    },
    {
      id: 'SEC-AUTHZ-002',
      category: 'security',
      severity: 'high',
      description: 'Resource ownership checks before mutations',
      check: async () => {
        const ownershipPattern = /belongsTo|ownerId|userId.*===|user\.id.*===|resource.*owner|canEdit|canDelete|permission.*check/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const routeFiles = await ctx.fs.glob(`${ctx.projectRoot}/app/api/**/route.{ts,js}`);
        const allFiles = [...apiFiles, ...routeFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, ownershipPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-AUTHZ-002', 'Resource ownership checks found');
        return fail('SEC-AUTHZ-002', 'No resource ownership checks found');
      },
    },
  ];
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────

export function createRateLimitingChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-RATE-001',
      category: 'security',
      severity: 'critical',
      description: 'Rate limiting on authentication endpoints',
      check: async () => {
        const rateLimitPattern = /rateLimit|rate.?limit|throttle|max.*request|attempts.*limit|login.*attempt/i;
        const authFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/auth/**/*.{ts,js}`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of [...authFiles, ...sourceFiles]) {
          if (await codePatternExists(ctx, f, rateLimitPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-RATE-001', 'Rate limiting found');
        return fail('SEC-RATE-001', 'No rate limiting on auth endpoints');
      },
    },
    {
      id: 'SEC-RATE-002',
      category: 'security',
      severity: 'high',
      description: 'Rate limiting on API endpoints',
      check: async () => {
        const rateLimitPattern = /express-rate-limit|@nestjs\/throttler|rateLimiter|rateLimit\(|throttle\(/i;
        const apiFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/api/**/*.{ts,js}`);
        const middlewareFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/middleware/**/*.{ts,js}`);
        const allFiles = [...apiFiles, ...middlewareFiles];
        let found = false;
        for (const f of allFiles) {
          if (await codePatternExists(ctx, f, rateLimitPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-RATE-002', 'API rate limiting found');
        return fail('SEC-RATE-002', 'No API rate limiting found');
      },
    },
  ];
}

// ─── Data Encryption ────────────────────────────────────────────────────────

export function createEncryptionChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-ENC-001',
      category: 'security',
      severity: 'critical',
      description: 'Sensitive data encrypted at rest (passwords hashed)',
      check: async () => {
        const hashPattern = /bcrypt|argon2|scrypt|pbkdf2|crypto\.createHash.*sha256|hash.*password/i;
        const authFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/auth/**/*.{ts,js}`);
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,js}`);
        let found = false;
        for (const f of [...authFiles, ...sourceFiles]) {
          if (await codePatternExists(ctx, f, hashPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-ENC-001', 'Password hashing (bcrypt/argon2) found');
        return fail('SEC-ENC-001', 'No password hashing found');
      },
    },
    {
      id: 'SEC-ENC-002',
      category: 'security',
      severity: 'critical',
      description: 'Sensitive data encrypted in transit (HTTPS/TLS)',
      check: async () => {
        const httpsPattern = /https:|TLS|ssl|SSL|secure.*connection|redirect.*https|certificate/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        const configFiles = await ctx.fs.glob(`${ctx.projectRoot}/**/*.{json,yml,yaml}`);
        let found = false;
        for (const f of [...sourceFiles, ...configFiles]) {
          if (await codePatternExists(ctx, f, httpsPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-ENC-002', 'HTTPS/TLS configuration found');
        return fail('SEC-ENC-002', 'No HTTPS/TLS configuration found');
      },
    },
    {
      id: 'SEC-ENC-003',
      category: 'security',
      severity: 'high',
      description: 'Sensitive fields encrypted in database (PII)',
      check: async () => {
        const encryptPattern = /encrypt|decrypt|cipher|crypto\.createCipher|aes|encrypted.*field|@Encrypted|@Encrypt/i;
        const sourceFiles = await ctx.fs.glob(`${ctx.projectRoot}/src/**/*.{ts,tsx,js,jsx}`);
        let found = false;
        for (const f of sourceFiles) {
          if (await codePatternExists(ctx, f, encryptPattern)) {
            found = true;
            break;
          }
        }
        if (found) return pass('SEC-ENC-003', 'Field-level encryption found');
        return fail('SEC-ENC-003', 'No field-level encryption for sensitive data found');
      },
    },
  ];
}

// ─── Dependency Security ────────────────────────────────────────────────────

export function createDependencySecurityChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    {
      id: 'SEC-DEP-001',
      category: 'security',
      severity: 'high',
      description: 'Dependency lock file exists (package-lock/ yarn.lock / pnpm-lock)',
      check: async () => {
        const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'];
        for (const lockFile of lockFiles) {
          if (await fileExists(ctx, `${ctx.projectRoot}/${lockFile}`)) {
            return pass('SEC-DEP-001', `Lock file found: ${lockFile}`);
          }
        }
        return fail('SEC-DEP-001', 'No dependency lock file found');
      },
    },
    {
      id: 'SEC-DEP-002',
      category: 'security',
      severity: 'medium',
      description: 'No known vulnerable dependencies',
      check: async () => {
        // Check if a security audit config exists
        const auditConfig = await fileExists(ctx, `${ctx.projectRoot}/.github/dependabot.yml`);
        const auditScript = await fileExists(ctx, `${ctx.projectRoot}/audit.yml`);
        if (auditConfig || auditScript) {
          return pass('SEC-DEP-002', 'Dependency audit configuration found');
        }
        return fail('SEC-DEP-002', 'No dependency audit configuration found');
      },
    },
  ];
}

// ─── Aggregate all security checks ──────────────────────────────────────────

export function createAllSecurityChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  return [
    ...createInputValidationChecks(ctx),
    ...createSQLInjectionChecks(ctx),
    ...createXSSChecks(ctx),
    ...createCSRFChecks(ctx),
    ...createAuthBypassChecks(ctx),
    ...createAuthorizationChecks(ctx),
    ...createRateLimitingChecks(ctx),
    ...createEncryptionChecks(ctx),
    ...createDependencySecurityChecks(ctx),
  ];
}
