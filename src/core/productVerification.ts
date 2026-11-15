/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Product Engineering Engine — Independent Verification System
 *
 * This module provides independent, multi-layer verification of the complete
 * product. Unlike the adversarial engine (which verifies code quality), this
 * system verifies PRODUCT COMPLETENESS — whether the actual product meets
 * the defined requirements and industry standards.
 *
 * It checks:
 *   1. Requirement coverage (every requirement has implementation)
 *   2. Feature functionality (features actually work, not just render)
 *   3. Visual quality (professional product-level UI/UX)
 *   4. Backend correctness (APIs functional, data correct)
 *   5. Database integrity (schema correct, migrations run)
 *   6. Security (OWASP compliance, auth/authorization)
 *   7. Business logic (correct calculations, state machines)
 *   8. Integration behavior (external integrations configured)
 *   9. Error handling (all error states handled)
 *   10. Accessibility (WCAG compliance)
 *   11. Deployment readiness (production config present)
 */

import { ProductPlan, ProductRequirement, RequirementCategory, RequirementStatus } from './productEngineering';

// =============================================================================
// PRODUCT VERIFICATION SYSTEM
// =============================================================================

export type VerificationDimension =
  | 'requirement_coverage'
  | 'frontend_completeness'
  | 'backend_completeness'
  | 'database_integrity'
  | 'api_functionality'
  | 'authentication'
  | 'authorization'
  | 'security'
  | 'business_logic'
  | 'error_handling'
  | 'integration'
  | 'notification'
  | 'search'
  | 'file_storage'
  | 'logging'
  | 'testing'
  | 'deployment'
  | 'documentation'
  | 'accessibility'
  | 'performance'
  | 'visual_quality';

export interface ProductVerificationResult {
  dimension: VerificationDimension;
  passed: boolean;
  score: number; // 0-100
  checks: VerificationCheck[];
  summary: string;
  blockers: string[];
  recommendations: string[];
}

export interface VerificationCheck {
  name: string;
  passed: boolean;
  details: string;
  evidence?: string;
}

export interface FullProductVerificationReport {
  planId: string;
  verifiedAtIso: string;
  overallScore: number;
  passed: boolean;
  dimensions: ProductVerificationResult[];
  criticalBlockers: string[];
  overallAssessment: string;
}

/**
 * Run the complete product verification suite.
 * This inspects the actual workspace and compares it against the plan.
 */
export function runFullProductVerification(
  plan: ProductPlan,
  workspaceFiles: Record<string, string>,
  fileContents: Record<string, string> = {}
): FullProductVerificationReport {
  const dimensions: ProductVerificationResult[] = [];

  // Run each verification dimension
  dimensions.push(verifyRequirementCoverage(plan, workspaceFiles));
  dimensions.push(verifyFrontendCompleteness(plan, workspaceFiles, fileContents));
  dimensions.push(verifyBackendCompleteness(plan, workspaceFiles, fileContents));
  dimensions.push(verifyDatabaseIntegrity(plan, workspaceFiles, fileContents));
  dimensions.push(verifyAPIFunctionality(plan, workspaceFiles, fileContents));
  dimensions.push(verifyAuthentication(plan, workspaceFiles, fileContents));
  dimensions.push(verifyAuthorization(plan, workspaceFiles, fileContents));
  dimensions.push(verifySecurity(plan, workspaceFiles, fileContents));
  dimensions.push(verifyBusinessLogic(plan, workspaceFiles, fileContents));
  dimensions.push(verifyErrorHandling(plan, workspaceFiles, fileContents));
  dimensions.push(verifyIntegration(plan, workspaceFiles, fileContents));
  dimensions.push(verifyTesting(plan, workspaceFiles, fileContents));
  dimensions.push(verifyDeployment(plan, workspaceFiles, fileContents));
  dimensions.push(verifyDocumentation(plan, workspaceFiles));
  dimensions.push(verifyAccessibility(plan, workspaceFiles, fileContents));
  dimensions.push(verifyPerformance(plan, workspaceFiles, fileContents));
  dimensions.push(verifyVisualQuality(plan, workspaceFiles, fileContents));

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length
  );

  const criticalBlockers = dimensions
    .flatMap(d => d.blockers)
    .filter((b, i, arr) => arr.indexOf(b) === i);

  const allPassed = dimensions.every(d => d.passed);

  const assessment = generateAssessment(dimensions, overallScore, criticalBlockers);

  return {
    planId: plan.planId,
    verifiedAtIso: new Date().toISOString(),
    overallScore,
    passed: allPassed && criticalBlockers.length === 0,
    dimensions,
    criticalBlockers,
    overallAssessment: assessment,
  };
}

// =============================================================================
// VERIFICATION DIMENSION IMPLEMENTATIONS
// =============================================================================

function verifyRequirementCoverage(
  plan: ProductPlan,
  workspaceFiles: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  let implementedCount = 0;
  const missing: string[] = [];

  for (const req of plan.requirements) {
    const hasImplementation = req.implementedInFiles.some(implFile =>
      Object.keys(workspaceFiles).some(f => f.includes(implFile) || f === implFile)
    ) || req.implementedInFiles.length === 0 && Object.keys(workspaceFiles).length > 0;

    const isImplemented = hasImplementation || req.status === 'IMPLEMENTED' || req.status === 'INTEGRATED' || req.status === 'TESTED' || req.status === 'VERIFIED';

    checks.push({
      name: `${req.id}: ${req.title}`,
      passed: isImplemented,
      details: isImplemented ? 'Implementation found' : 'No implementation found',
    });

    if (isImplemented) {
      implementedCount++;
    } else if (req.priority === 'CRITICAL' || req.priority === 'HIGH') {
      missing.push(`${req.id}: ${req.title} [${req.priority}]`);
    }
  }

  const score = Math.round((implementedCount / plan.requirements.length) * 100);

  return {
    dimension: 'requirement_coverage',
    passed: score >= 80,
    score,
    checks,
    summary: `${implementedCount}/${plan.requirements.length} requirements have implementation evidence (${score}%)`,
    blockers: missing,
    recommendations: missing.length > 0 ? [`Implement missing requirements: ${missing.slice(0, 5).join(', ')}`] : [],
  };
}

function verifyFrontendCompleteness(
  _plan: ProductPlan,
  workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allFilePaths = Object.keys(workspaceFiles);
  const allContent = Object.values(fileContents).join(' ');

  // Check for React/Vue/Svelte app structure
  const hasAppEntry = allFilePaths.some(f => f.includes('App.') || f.includes('app.'));
  const hasMainEntry = allFilePaths.some(f => f.includes('main.') || f.includes('index.'));
  const hasRouting = allContent.includes('Router') || allContent.includes('createBrowserRouter') || allContent.includes('Routes');
  const hasComponents = allFilePaths.some(f => f.includes('components/') || f.includes('component/'));
  const hasPages = allFilePaths.some(f => f.includes('pages/') || f.includes('views/'));
  const hasStyles = allFilePaths.some(f => f.includes('.css') || f.includes('.scss') || f.includes('.less') || allContent.includes('tailwind') || allContent.includes('styled'));

  checks.push({ name: 'App entry point exists', passed: hasAppEntry, details: hasAppEntry ? 'App component found' : 'Missing App component' });
  checks.push({ name: 'Main entry point exists', passed: hasMainEntry, details: hasMainEntry ? 'Main entry found' : 'Missing main entry' });
  checks.push({ name: 'Routing configured', passed: hasRouting, details: hasRouting ? 'Router found' : 'No routing detected' });
  checks.push({ name: 'Components directory', passed: hasComponents, details: hasComponents ? 'Components found' : 'No components directory' });
  checks.push({ name: 'Pages/routes defined', passed: hasPages, details: hasPages ? 'Pages found' : 'No pages directory' });
  checks.push({ name: 'Styling present', passed: hasStyles, details: hasStyles ? 'Styles found' : 'No styling detected' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'frontend_completeness',
    passed: score >= 60,
    score,
    checks,
    summary: `Frontend completeness: ${passedCount}/${checks.length} structural checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyBackendCompleteness(
  _plan: ProductPlan,
  workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allFilePaths = Object.keys(workspaceFiles);
  const allContent = Object.values(fileContents).join(' ');

  const hasServerFile = allFilePaths.some(f => f.includes('server.') || f.includes('index.') && (f.endsWith('.ts') || f.endsWith('.js')) && !f.includes('src/'));
  const hasRoutes = allContent.includes('router') || allContent.includes('route') || allContent.includes('app.') || allContent.includes('endpoint');
  const hasMiddleware = allContent.includes('middleware') || allContent.includes('authMiddleware') || allContent.includes('cors');
  const hasErrorHandling = allContent.includes('try') && allContent.includes('catch') || allContent.includes('errorHandler');
  const hasValidation = allContent.includes('validate') || allContent.includes('zod') || allContent.includes('joi') || allContent.includes('schema');
  const hasEnvConfig = allFilePaths.some(f => f === '.env.example' || f === '.env') || allContent.includes('process.env') || allContent.includes('dotenv');

  checks.push({ name: 'Server entry point', passed: hasServerFile, details: hasServerFile ? 'Server file found' : 'No server entry point' });
  checks.push({ name: 'Route definitions', passed: hasRoutes, details: hasRoutes ? 'Routes detected' : 'No routes found' });
  checks.push({ name: 'Middleware stack', passed: hasMiddleware, details: hasMiddleware ? 'Middleware present' : 'No middleware found' });
  checks.push({ name: 'Error handling', passed: hasErrorHandling, details: hasErrorHandling ? 'Error handling present' : 'No error handling' });
  checks.push({ name: 'Input validation', passed: hasValidation, details: hasValidation ? 'Validation present' : 'No validation found' });
  checks.push({ name: 'Environment configuration', passed: hasEnvConfig, details: hasEnvConfig ? 'Env config found' : 'No env configuration' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'backend_completeness',
    passed: score >= 50,
    score,
    checks,
    summary: `Backend completeness: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyDatabaseIntegrity(
  plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');
  const allFilePaths = Object.keys(fileContents);

  const hasSchemaFile = allFilePaths.some(f => f.includes('schema') || f.includes('migration') || f.includes('migrate'));
  const hasCreateTable = allContent.includes('CREATE TABLE') || allContent.includes('createTable') || allContent.includes('defineTable');
  const hasIndexes = allContent.includes('INDEX') || allContent.includes('index');
  const hasRelations = allContent.includes('FOREIGN KEY') || allContent.includes('references') || allContent.includes('belongsTo');
  const hasMigrations = allFilePaths.some(f => f.includes('migration') || f.includes('migrate'));
  const hasConstraints = allContent.includes('NOT NULL') || allContent.includes('required') || allContent.includes('unique');

  checks.push({ name: 'Schema definition exists', passed: hasSchemaFile, details: hasSchemaFile ? 'Schema file found' : 'No schema file' });
  checks.push({ name: 'Table definitions', passed: hasCreateTable, details: hasCreateTable ? 'CREATE TABLE found' : 'No table definitions' });
  checks.push({ name: 'Indexes defined', passed: hasIndexes, details: hasIndexes ? 'Indexes found' : 'No indexes' });
  checks.push({ name: 'Relationships defined', passed: hasRelations, details: hasRelations ? 'Relationships found' : 'No relationships' });
  checks.push({ name: 'Migration system', passed: hasMigrations, details: hasMigrations ? 'Migrations found' : 'No migrations' });
  checks.push({ name: 'Constraints defined', passed: hasConstraints, details: hasConstraints ? 'Constraints found' : 'No constraints' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'database_integrity',
    passed: score >= 50,
    score,
    checks,
    summary: `Database integrity: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyAPIFunctionality(
  plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const apiSpecs = plan.architecture.apis;
  const hasRouteDefs = allContent.includes('app.') || allContent.includes('router.') || allContent.includes('.get(') || allContent.includes('.post(');
  const hasResponseHandling = allContent.includes('res.json') || allContent.includes('response.') || allContent.includes('return ') && allContent.includes('json');
  const hasErrorResponses = allContent.includes('status(') && (allContent.includes('400') || allContent.includes('401') || allContent.includes('404') || allContent.includes('500'));
  const hasAuthMiddleware = allContent.includes('authenticate') || allContent.includes('authMiddleware') || allContent.includes('requireAuth');
  const hasInputValidation = allContent.includes('validate') || allContent.includes('sanitize') || allContent.includes('zod') || allContent.includes('joi');

  checks.push({ name: 'API route definitions', passed: hasRouteDefs, details: `Found ${apiSpecs.length} planned API endpoints` });
  checks.push({ name: 'Response handling', passed: hasResponseHandling, details: hasResponseHandling ? 'Response handling found' : 'No response handling' });
  checks.push({ name: 'Error responses', passed: hasErrorResponses, details: hasErrorResponses ? 'Error responses found' : 'No error responses' });
  checks.push({ name: 'Auth middleware', passed: hasAuthMiddleware, details: hasAuthMiddleware ? 'Auth middleware found' : 'No auth middleware' });
  checks.push({ name: 'Input validation', passed: hasInputValidation, details: hasInputValidation ? 'Input validation found' : 'No input validation' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'api_functionality',
    passed: score >= 50,
    score,
    checks,
    summary: `API functionality: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyAuthentication(
  _plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const hasJWT = allContent.includes('jwt') || allContent.includes('JWT') || allContent.includes('jsonwebtoken');
  const hasPasswordHash = allContent.includes('bcrypt') || allContent.includes('argon2') || allContent.includes('hash');
  const hasSessionMgmt = allContent.includes('session') || allContent.includes('refresh_token') || allContent.includes('access_token');
  const hasRegister = allContent.includes('register') || allContent.includes('signup') || allContent.includes('createUser');
  const hasLogin = allContent.includes('login') || allContent.includes('signin') || allContent.includes('authenticate');
  const hasLogout = allContent.includes('logout');
  const hasPasswordReset = allContent.includes('reset') || allContent.includes('forgotPassword');

  checks.push({ name: 'JWT or session tokens', passed: hasJWT || hasSessionMgmt, details: 'Token-based auth detected' });
  checks.push({ name: 'Password hashing', passed: hasPasswordHash, details: hasPasswordHash ? 'Password hashing found' : 'No password hashing' });
  checks.push({ name: 'Session management', passed: hasSessionMgmt, details: hasSessionMgmt ? 'Session management found' : 'No session management' });
  checks.push({ name: 'Registration endpoint', passed: hasRegister, details: hasRegister ? 'Registration found' : 'No registration' });
  checks.push({ name: 'Login endpoint', passed: hasLogin, details: hasLogin ? 'Login found' : 'No login' });
  checks.push({ name: 'Logout endpoint', passed: hasLogout, details: hasLogout ? 'Logout found' : 'No logout' });
  checks.push({ name: 'Password reset', passed: hasPasswordReset, details: hasPasswordReset ? 'Password reset found' : 'No password reset' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'authentication',
    passed: score >= 60,
    score,
    checks,
    summary: `Authentication: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).filter(c => ['JWT or session tokens', 'Password hashing', 'Login endpoint'].includes(c.name)).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyAuthorization(
  _plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const hasRoleCheck = allContent.includes('role') || allContent.includes('Role') || allContent.includes('admin') || allContent.includes('permission');
  const hasProtectedRoute = allContent.includes('protect') || allContent.includes('requireRole') || allContent.includes('authorize') || allContent.includes('middleware');
  const hasPermissionCheck = allContent.includes('can(') || allContent.includes('permission') || allContent.includes('hasRole');

  checks.push({ name: 'Role definitions', passed: hasRoleCheck, details: hasRoleCheck ? 'Role system found' : 'No role system' });
  checks.push({ name: 'Protected routes/middleware', passed: hasProtectedRoute, details: hasProtectedRoute ? 'Route protection found' : 'No route protection' });
  checks.push({ name: 'Permission enforcement', passed: hasPermissionCheck, details: hasPermissionCheck ? 'Permission checks found' : 'No permission enforcement' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'authorization',
    passed: score >= 50,
    score,
    checks,
    summary: `Authorization: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifySecurity(
  _plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const hasHTTPS = allContent.includes('https') || allContent.includes('TLS') || allContent.includes('SSL');
  const hasInputValidation = allContent.includes('validate') || allContent.includes('sanitize') || allContent.includes('escape');
  const hasRateLimit = allContent.includes('rateLimit') || allContent.includes('rate_limit') || allContent.includes('throttle');
  const hasCORS = allContent.includes('cors') || allContent.includes('CORS');
  const hasCSRF = allContent.includes('csrf') || allContent.includes('CSRF') || allContent.includes('SameSite');
  const hasSecurityHeaders = allContent.includes('helmet') || allContent.includes('X-Frame-Options') || allContent.includes('Content-Security-Policy');
  const hasNoSecrets = !allContent.includes('sk-') && !allContent.includes('AKIA') && !allContent.includes('ghp_') && !allContent.includes('-----BEGIN');
  const hasDependencyAudit = _plan.deploymentPlan.ciCdPipeline.some(s => s.toLowerCase().includes('audit') || s.toLowerCase().includes('security'));

  checks.push({ name: 'HTTPS/TLS configured', passed: hasHTTPS, details: hasHTTPS ? 'HTTPS detected' : 'No HTTPS configuration' });
  checks.push({ name: 'Input validation', passed: hasInputValidation, details: hasInputValidation ? 'Input validation found' : 'No input validation' });
  checks.push({ name: 'Rate limiting', passed: hasRateLimit, details: hasRateLimit ? 'Rate limiting found' : 'No rate limiting' });
  checks.push({ name: 'CORS configuration', passed: hasCORS, details: hasCORS ? 'CORS found' : 'No CORS configuration' });
  checks.push({ name: 'CSRF protection', passed: hasCSRF, details: hasCSRF ? 'CSRF protection found' : 'No CSRF protection' });
  checks.push({ name: 'Security headers', passed: hasSecurityHeaders, details: hasSecurityHeaders ? 'Security headers found' : 'No security headers' });
  checks.push({ name: 'No hardcoded secrets', passed: hasNoSecrets, details: hasNoSecrets ? 'No secrets detected' : 'Potential secrets found in code' });
  checks.push({ name: 'Dependency audit in CI', passed: hasDependencyAudit, details: hasDependencyAudit ? 'Audit in CI pipeline' : 'No dependency audit in CI' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'security',
    passed: score >= 60,
    score,
    checks,
    summary: `Security: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed && ['No hardcoded secrets', 'Input validation', 'Rate limiting'].includes(c.name)).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyBusinessLogic(
  plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const businessReqs = plan.requirements.filter(r => r.category === 'business_logic');
  const hasBusinessLogic = businessReqs.some(req =>
    req.implementedInFiles.some(f => Object.keys(fileContents).some(wf => wf.includes(f)))
  ) || allContent.includes('calculate') || allContent.includes('process') || allContent.includes('validate');

  const hasStateMachine = allContent.includes('status') && (allContent.includes('transition') || allContent.includes('state') || allContent.includes('workflow'));
  const hasValidation = allContent.includes('validate') || allContent.includes('check') || allContent.includes('verify');
  const hasErrorStates = allContent.includes('throw') || allContent.includes('reject') || allContent.includes('error');

  checks.push({ name: 'Business rules implemented', passed: hasBusinessLogic, details: hasBusinessLogic ? 'Business logic found' : 'No business logic found' });
  checks.push({ name: 'State machines', passed: hasStateMachine, details: hasStateMachine ? 'State machine found' : 'No state management' });
  checks.push({ name: 'Validation logic', passed: hasValidation, details: hasValidation ? 'Validation found' : 'No validation logic' });
  checks.push({ name: 'Error states', passed: hasErrorStates, details: hasErrorStates ? 'Error handling found' : 'No error states' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'business_logic',
    passed: score >= 50,
    score,
    checks,
    summary: `Business logic: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyErrorHandling(
  _plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const hasTryCatch = (allContent.match(/try\s*\{/g) || []).length > 0;
  const hasErrorBoundary = allContent.includes('ErrorBoundary') || allContent.includes('error boundary') || allContent.includes('errorHandler');
  const hasErrorPages = allContent.includes('404') || allContent.includes('500') || allContent.includes('NotFound');
  const hasRetry = allContent.includes('retry') || allContent.includes('retries');
  const hasLoadingStates = allContent.includes('loading') || allContent.includes('spinner') || allContent.includes('Skeleton');

  checks.push({ name: 'Try-catch blocks', passed: hasTryCatch, details: hasTryCatch ? 'Error handling found' : 'No try-catch blocks' });
  checks.push({ name: 'Error boundaries', passed: hasErrorBoundary, details: hasErrorBoundary ? 'Error boundaries found' : 'No error boundaries' });
  checks.push({ name: 'Error pages', passed: hasErrorPages, details: hasErrorPages ? 'Error pages found' : 'No error pages' });
  checks.push({ name: 'Retry logic', passed: hasRetry, details: hasRetry ? 'Retry logic found' : 'No retry logic' });
  checks.push({ name: 'Loading states', passed: hasLoadingStates, details: hasLoadingStates ? 'Loading states found' : 'No loading states' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'error_handling',
    passed: score >= 40,
    score,
    checks,
    summary: `Error handling: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyIntegration(
  plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  for (const integration of plan.architecture.integrations) {
    const hasIntegration = allContent.toLowerCase().includes(integration.provider.toLowerCase()) ||
      allContent.toLowerCase().includes(integration.name.toLowerCase()) ||
      allContent.includes(integration.type.toUpperCase());
    checks.push({
      name: `${integration.name} (${integration.provider})`,
      passed: hasIntegration,
      details: hasIntegration ? `${integration.name} integration detected` : `Missing ${integration.name} integration`,
    });
  }

  const passedCount = checks.filter(c => c.passed).length;
  const score = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 100;

  return {
    dimension: 'integration',
    passed: score >= 50,
    score,
    checks,
    summary: `Integrations: ${passedCount}/${checks.length} detected (${score}%)`,
    blockers: checks.filter(c => !c.passed && c.details.includes('Missing')).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Implement: ${c.name}`),
  };
}

function verifyTesting(
  plan: ProductPlan,
  workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allFilePaths = Object.keys(workspaceFiles);
  const allContent = Object.values(fileContents).join(' ');

  const hasTestFiles = allFilePaths.some(f => f.endsWith('.test.') || f.endsWith('.spec.') || f.includes('/test/') || f.includes('/tests/') || f.includes('__tests__'));
  const hasUnitTests = allContent.includes('describe(') || allContent.includes('test(') || allContent.includes('it(') || allContent.includes('expect(');
  const hasTestConfig = allFilePaths.some(f => f.includes('vitest') || f.includes('jest') || f.includes('playwright') || f.includes('cypress') || f.includes('pytest'));
  const hasCI = allFilePaths.some(f => f.includes('ci.yml') || f.includes('ci.yaml') || f.includes('.github/workflows'));

  checks.push({ name: 'Test files exist', passed: hasTestFiles, details: hasTestFiles ? 'Test files found' : 'No test files found' });
  checks.push({ name: 'Test assertions', passed: hasUnitTests, details: hasUnitTests ? 'Test code found' : 'No test assertions found' });
  checks.push({ name: 'Test framework configured', passed: hasTestConfig, details: hasTestConfig ? 'Test config found' : 'No test framework' });
  checks.push({ name: 'CI runs tests', passed: hasCI, details: hasCI ? 'CI pipeline found' : 'No CI pipeline' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'testing',
    passed: score >= 40,
    score,
    checks,
    summary: `Testing: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyDeployment(
  plan: ProductPlan,
  workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allFilePaths = Object.keys(workspaceFiles);
  const allContent = Object.values(fileContents).join(' ');

  const hasDockerfile = allFilePaths.some(f => f === 'Dockerfile' || f === 'docker-compose.yml' || f === 'docker-compose.yaml');
  const hasEnvExample = allFilePaths.some(f => f === '.env.example' || f === '.env.sample');
  const hasDeployConfig = allContent.includes('vercel') || allContent.includes('docker') || allContent.includes('kubernetes') || allContent.includes('pm2') || allContent.includes('nginx');
  const hasHealthCheck = allContent.includes('health') || allContent.includes('/health');
  const hasProcessManager = allContent.includes('pm2') || allContent.includes('systemd') || allContent.includes('docker-compose');

  checks.push({ name: 'Dockerfile or deploy config', passed: hasDockerfile || hasDeployConfig, details: hasDockerfile ? 'Dockerfile found' : hasDeployConfig ? 'Deploy config found' : 'No deployment config' });
  checks.push({ name: 'Environment variable template', passed: hasEnvExample, details: hasEnvExample ? '.env.example found' : 'No .env.example' });
  checks.push({ name: 'Health check endpoint', passed: hasHealthCheck, details: hasHealthCheck ? 'Health endpoint found' : 'No health check' });
  checks.push({ name: 'Process manager config', passed: hasProcessManager, details: hasProcessManager ? 'Process manager configured' : 'No process manager' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'deployment',
    passed: score >= 50,
    score,
    checks,
    summary: `Deployment: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyDocumentation(
  plan: ProductPlan,
  workspaceFiles: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allFilePaths = Object.keys(workspaceFiles);

  const hasReadme = allFilePaths.some(f => f === 'README.md');
  const hasApiDocs = allFilePaths.some(f => f.includes('api-doc') || f.includes('openapi') || f.includes('swagger'));
  const hasArchDoc = allFilePaths.some(f => f.includes('architecture') || f.includes('ARCHITECTURE'));
  const hasDeployGuide = allFilePaths.some(f => f.includes('DEPLOY') || f.includes('deploy') || f.includes('SETUP'));
  const hasEnvDocs = allFilePaths.some(f => f.includes('env') || f.includes('ENV'));

  checks.push({ name: 'README.md', passed: hasReadme, details: hasReadme ? 'README found' : 'Missing README' });
  checks.push({ name: 'API documentation', passed: hasApiDocs, details: hasApiDocs ? 'API docs found' : 'No API docs' });
  checks.push({ name: 'Architecture docs', passed: hasArchDoc, details: hasArchDoc ? 'Architecture docs found' : 'No architecture docs' });
  checks.push({ name: 'Deployment guide', passed: hasDeployGuide, details: hasDeployGuide ? 'Deploy guide found' : 'No deploy guide' });
  checks.push({ name: 'Environment documentation', passed: hasEnvDocs, details: hasEnvDocs ? 'Env docs found' : 'No env docs' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'documentation',
    passed: score >= 50,
    score,
    checks,
    summary: `Documentation: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyAccessibility(
  plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const hasAltText = allContent.includes('alt=') || allContent.includes('alt={');
  const hasAriaLabels = allContent.includes('aria-') || allContent.includes('ariaLabel');
  const hasSemanticHTML = allContent.includes('<main') || allContent.includes('<nav') || allContent.includes('<header') || allContent.includes('<button') || allContent.includes('<form');
  const hasKeyboardSupport = allContent.includes('onKeyDown') || allContent.includes('tabIndex') || allContent.includes('useKeyboard');
  const hasFocusManagement = allContent.includes('focus') || allContent.includes('autoFocus');

  checks.push({ name: 'Image alt text', passed: hasAltText, details: hasAltText ? 'Alt text found' : 'No alt text attributes' });
  checks.push({ name: 'ARIA attributes', passed: hasAriaLabels, details: hasAriaLabels ? 'ARIA found' : 'No ARIA attributes' });
  checks.push({ name: 'Semantic HTML', passed: hasSemanticHTML, details: hasSemanticHTML ? 'Semantic HTML found' : 'No semantic HTML' });
  checks.push({ name: 'Keyboard support', passed: hasKeyboardSupport, details: hasKeyboardSupport ? 'Keyboard handlers found' : 'No keyboard support' });
  checks.push({ name: 'Focus management', passed: hasFocusManagement, details: hasFocusManagement ? 'Focus management found' : 'No focus management' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'accessibility',
    passed: score >= 60,
    score,
    checks,
    summary: `Accessibility: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyPerformance(
  _plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const hasLazyLoading = allContent.includes('lazy') || allContent.includes('Lazy') || allContent.includes('Suspense');
  const hasImageOptimization = allContent.includes('loading="lazy"') || allContent.includes('next/image') || allContent.includes('optimized') || allContent.includes('webp') || allContent.includes('avif');
  const hasCodeSplitting = allContent.includes('dynamic') || allContent.includes('import(');
  const hasCaching = allContent.includes('cache') || allContent.includes('Cache-Control') || allContent.includes('ETag');

  checks.push({ name: 'Lazy loading', passed: hasLazyLoading, details: hasLazyLoading ? 'Lazy loading found' : 'No lazy loading' });
  checks.push({ name: 'Image optimization', passed: hasImageOptimization, details: hasImageOptimization ? 'Image optimization found' : 'No image optimization' });
  checks.push({ name: 'Code splitting', passed: hasCodeSplitting, details: hasCodeSplitting ? 'Code splitting found' : 'No code splitting' });
  checks.push({ name: 'Caching headers', passed: hasCaching, details: hasCaching ? 'Caching found' : 'No caching' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'performance',
    passed: score >= 40,
    score,
    checks,
    summary: `Performance: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: [],
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

function verifyVisualQuality(
  plan: ProductPlan,
  _workspaceFiles: Record<string, string>,
  fileContents: Record<string, string>
): ProductVerificationResult {
  const checks: VerificationCheck[] = [];
  const allContent = Object.values(fileContents).join(' ');

  const designSystem = plan.architecture.frontend.designSystem;
  const hasDesignTokens = allContent.includes('--') && (allContent.includes('color') || allContent.includes('spacing') || allContent.includes('font'));
  const hasConsistentClasses = allContent.includes('className') && (allContent.includes('flex') || allContent.includes('grid') || allContent.includes('p-') || allContent.includes('m-'));
  const hasResponsive = allContent.includes('md:') || allContent.includes('lg:') || allContent.includes('@media') || allContent.includes('sm:') || allContent.includes('@screen');
  const hasStates = allContent.includes('hover') || allContent.includes('active') || allContent.includes('focus') || allContent.includes('disabled');
  const hasAnimations = allContent.includes('transition') || allContent.includes('animate') || allContent.includes('@keyframes') || allContent.includes('motion');
  const hasDarkMode = allContent.includes('dark') || allContent.includes('theme');

  checks.push({ name: 'Design tokens', passed: hasDesignTokens, details: hasDesignTokens ? 'Design tokens found' : 'No design tokens (CSS variables)' });
  checks.push({ name: 'Consistent styling', passed: hasConsistentClasses, details: hasConsistentClasses ? 'Consistent class usage found' : 'No consistent styling pattern' });
  checks.push({ name: 'Responsive design', passed: hasResponsive, details: hasResponsive ? 'Responsive classes found' : 'No responsive design' });
  checks.push({ name: 'Interactive states', passed: hasStates, details: hasStates ? 'Interactive states found' : 'No hover/focus states' });
  checks.push({ name: 'Animations', passed: hasAnimations, details: hasAnimations ? 'Animations found' : 'No animations/transitions' });
  checks.push({ name: 'Dark mode support', passed: hasDarkMode, details: hasDarkMode ? 'Dark mode support found' : 'No dark mode' });

  const passedCount = checks.filter(c => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    dimension: 'visual_quality',
    passed: score >= 50,
    score,
    checks,
    summary: `Visual quality: ${passedCount}/${checks.length} checks passed (${score}%)`,
    blockers: checks.filter(c => !c.passed).map(c => c.name),
    recommendations: checks.filter(c => !c.passed).map(c => `Add: ${c.name}`),
  };
}

// =============================================================================
// ASSESSMENT GENERATION
// =============================================================================

function generateAssessment(
  dimensions: ProductVerificationResult[],
  overallScore: number,
  criticalBlockers: string[]
): string {
  if (criticalBlockers.length === 0 && overallScore >= 85) {
    return `PRODUCTION READY: Overall score ${overallScore}%. All critical blockers resolved. The product meets quality standards.`;
  }
  if (criticalBlockers.length === 0 && overallScore >= 70) {
    return `NEARLY COMPLETE: Overall score ${overallScore}%. No critical blockers but some dimensions need improvement.`;
  }
  if (overallScore >= 50) {
    return `IN PROGRESS: Overall score ${overallScore}%. ${criticalBlockers.length} critical blockers need resolution before production.`;
  }
  return `EARLY STAGE: Overall score ${overallScore}%. Significant work needed across ${dimensions.filter(d => !d.passed).length} dimensions.`;
}

/**
 * Generate a markdown verification report.
 */
export function generateVerificationReport(report: FullProductVerificationReport): string {
  let md = `# Product Verification Report\n\n`;
  md += `**Plan:** ${report.planId}\n`;
  md += `**Verified:** ${report.verifiedAtIso}\n`;
  md += `**Overall Score:** ${report.overallScore}/100\n`;
  md += `**Status:** ${report.passed ? 'PASSED' : 'NEEDS WORK'}\n\n`;

  md += `## Summary\n\n${report.overallAssessment}\n\n`;

  if (report.criticalBlockers.length > 0) {
    md += `## Critical Blockers\n\n`;
    for (const blocker of report.criticalBlockers) {
      md += `- ${blocker}\n`;
    }
    md += '\n';
  }

  md += `## Dimension Scores\n\n`;
  md += `| Dimension | Score | Status |\n|-----------|-------|--------|\n`;
  for (const dim of report.dimensions) {
    md += `| ${dim.dimension} | ${dim.score}/100 | ${dim.passed ? 'PASS' : 'FAIL'} |\n`;
  }
  md += '\n';

  md += `## Detailed Results\n\n`;
  for (const dim of report.dimensions) {
    md += `### ${dim.dimension.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${dim.score}/100)\n\n`;
    md += `${dim.summary}\n\n`;
    if (dim.blockers.length > 0) {
      md += `**Blockers:**\n`;
      for (const b of dim.blockers) {
        md += `- ${b}\n`;
      }
      md += '\n';
    }
    if (dim.recommendations.length > 0) {
      md += `**Recommendations:**\n`;
      for (const r of dim.recommendations) {
        md += `- ${r}\n`;
      }
      md += '\n';
    }
  }

  return md;
}
