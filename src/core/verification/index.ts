/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Verification Engine - Main Entry Point
 *
 * THE CORE CONTROL LAYER. The AI NEVER decides when work is done.
 * AETHER's verification engine does.
 *
 * Usage:
 *   import { verifyProject, getIndustrySpec, isComplete, VerificationEngine } from './core/verification';
 *
 *   // Get industry spec
 *   const spec = getIndustrySpec('ecommerce');
 *
 *   // Run verification
 *   const report = await verifyProject('/path/to/project', 'proj-001', spec);
 *
 *   // Check if complete
 *   if (isComplete(report)) {
 *     console.log('Project passes all verification checks');
 *   } else {
 *     console.log('Missing:', report.missingFiles);
 *     console.log('Recommendations:', report.recommendations);
 *   }
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type {
  CheckCategory,
  Severity,
  VerificationMethod,
  SystemType,
  VerificationCheck,
  VerificationResult,
  FeatureRequirement,
  SystemRequirement,
  CompetitorFeature,
  ProjectSpec,
  VerificationReport,
  CheckExecutionContext,
  FileSystemProbe,
  CodeAnalyzer,
  TestRunner,
  BrowserRunner,
  IndustryType,
} from './types.js';

// ─── Industry Specs ─────────────────────────────────────────────────────────

export {
  getEcommerceSpec,
  getFoodBeverageSpec,
  getHealthcareSpec,
  getAiPlatformSpec,
  getBookingSpec,
  getFintechSpec,
  getEducationSpec,
  getEntertainmentSpec,
  getLogisticsSpec,
  getHospitalitySpec,
  getRealEstateSpec,
  getAutomotiveSpec,
  INDUSTRY_REGISTRY,
  INDUSTRY_DISPLAY_NAMES,
  listIndustries,
  getIndustrySpec,
  type IndustryKey,
  type IndustryRegistryEntry,
} from './industrySpecs.js';

// ─── Engine ─────────────────────────────────────────────────────────────────

export {
  VerificationEngine,
  DefaultFileSystemProbe,
  DefaultCodeAnalyzer,
  DefaultTestRunner,
  MockBrowserRunner,
  verifyProject,
  isComplete,
  createContext,
  type EngineOptions,
} from './engine.js';

// ─── Feature Checks (for custom extensions) ─────────────────────────────────

export {
  createAllFeatureChecks,
  createAuthChecks,
  createDatabaseChecks,
  createApiChecks,
  createFrontendChecks,
  createStateChecks,
  createDataModelChecks,
  createErrorHandlingChecks,
  createLoggingChecks,
  createCachingChecks,
  createSecurityPillarChecks,
  createTestingChecks,
  createCICDChecks,
  createPaymentChecks,
  createNotificationChecks,
  createStorageChecks,
  createSearchChecks,
  createAnalyticsChecks,
  createPerformanceChecks,
  createAccessibilityChecks,
} from './checks/featureChecks.js';

// ─── Integration Checks ─────────────────────────────────────────────────────

export {
  createAllIntegrationChecks,
  createDatabaseIntegrationChecks,
  createApiIntegrationChecks,
  createFrontendBackendChecks,
  createAuthIntegrationChecks,
  createPaymentIntegrationChecks,
  createNotificationIntegrationChecks,
  createAnalyticsIntegrationChecks,
} from './checks/integrationChecks.js';

// ─── Security Checks ────────────────────────────────────────────────────────

export {
  createAllSecurityChecks,
  createInputValidationChecks,
  createSQLInjectionChecks,
  createXSSChecks,
  createCSRFChecks,
  createAuthBypassChecks,
  createAuthorizationChecks,
  createRateLimitingChecks,
  createEncryptionChecks,
  createDependencySecurityChecks,
} from './checks/securityChecks.js';

// ─── Performance Checks ─────────────────────────────────────────────────────

export {
  createAllPerformanceChecks,
  createPageLoadChecks,
  createApiPerformanceChecks,
  createDatabasePerformanceChecks,
  createFrontendPerformanceChecks,
  createLighthouseChecks,
} from './checks/performanceChecks.js';

// ─── E2E Checks ─────────────────────────────────────────────────────────────

export {
  createAllE2EChecks,
  createE2EScenarios,
  runE2ESuite,
  type E2ETestScenario,
  type BrowserRunner as E2EBrowserRunner,
  type E2ERunOptions,
  type E2ERunResult,
} from './checks/e2eChecks.js';
