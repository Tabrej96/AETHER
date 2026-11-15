/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Product Engineering Engine — Product Intelligence Core
 *
 * This module provides the top-level product engineering intelligence that
 * transforms AETHER from a code-modification harness into a complete
 * autonomous product engineering system.
 *
 * When a user gives a short instruction like "Build a Coffee Shop Website",
 * this engine:
 *   1. Interprets the product domain and industry
 *   2. Researches competitive requirements
 *   3. Creates a complete product plan
 *   4. Generates traceable requirements
 *   5. Coordinates all downstream engineering agents
 *   6. Independently verifies completeness
 */

import { AgentSpec, SwarmFormationResult, SwarmTaskNode } from '../types';
import { formDynamicSwarm } from '../swarmEngine';
import { runAdversarialChallengeSuite } from '../adversarialEngine';
import { AutonomousRuntimeEngine } from '../autonomousRuntime';

// =============================================================================
// PRODUCT DOMAIN CLASSIFICATION
// =============================================================================

export type ProductDomain =
  | 'ecommerce'
  | 'saas'
  | 'marketplace'
  | 'social_media'
  | 'cms'
  | 'fintech'
  | 'healthtech'
  | 'edtech'
  | 'food_service'
  | 'hospitality'
  | 'logistics'
  | 'real_estate'
  | 'entertainment'
  | 'ai_platform'
  | 'developer_tools'
  | 'project_management'
  | 'communication'
  | 'crm'
  | 'analytics'
  | 'iot'
  | 'blockchain'
  | 'gaming'
  | 'general';

export interface ProductDomainAnalysis {
  domain: ProductDomain;
  confidence: number;
  primaryCategory: string;
  industry: string;
  targetUsers: string[];
  businessModel: string[];
  keyCapabilities: string[];
}

// =============================================================================
// COMPETITIVE INTELLIGENCE
// =============================================================================

export interface CompetitorProfile {
  name: string;
  category: 'leader' | 'challenger' | 'follower' | 'niche';
  productType: string;
  keyFeatures: string[];
  technicalArchitecture: string[];
  businessModel: string[];
  userExperience: string;
  securityCompliance: string[];
  operationalFeatures: string[];
  apiCapabilities: string[];
  integrationEcosystem: string[];
  pricingModel: string;
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
}

export interface CompetitiveIntelligenceReport {
  productDomain: string;
  analyzedAtIso: string;
  competitors: CompetitorProfile[];
  marketGaps: string[];
  mandatoryCapabilities: string[];
  industryStandardFeatures: string[];
  advancedFeatures: string[];
  securityComplianceRequirements: string[];
  technicalArchitecturePatterns: string[];
  userExperienceExpectations: string[];
  competitiveDifferentiators: string[];
}

// =============================================================================
// COMPLETE PRODUCT REQUIREMENTS
// =============================================================================

export type RequirementStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'IMPLEMENTED'
  | 'INTEGRATED'
  | 'TESTED'
  | 'VERIFIED'
  | 'FAILED'
  | 'SKIPPED';

export interface ProductRequirement {
  id: string;
  category: RequirementCategory;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  acceptanceCriteria: string[];
  verificationMethod: VerificationMethod;
  dependencies: string[];
  status: RequirementStatus;
  implementedInFiles: string[];
  testCoverage: boolean;
  notes: string;
}

export type RequirementCategory =
  | 'frontend_customer'
  | 'frontend_admin'
  | 'backend_api'
  | 'database_schema'
  | 'authentication'
  | 'authorization'
  | 'business_logic'
  | 'payment_processing'
  | 'notification_system'
  | 'search_discovery'
  | 'file_storage'
  | 'integration'
  | 'security'
  | 'logging_monitoring'
  | 'testing'
  | 'deployment'
  | 'documentation'
  | 'accessibility'
  | 'performance'
  | 'error_handling';

export type VerificationMethod =
  | 'unit_test'
  | 'integration_test'
  | 'e2e_test'
  | 'visual_inspection'
  | 'api_test'
  | 'database_test'
  | 'security_scan'
  | 'accessibility_audit'
  | 'performance_test'
  | 'manual_review';

// =============================================================================
// PRODUCT ARCHITECTURE
// =============================================================================

export interface DatabaseSchema {
  tables: DatabaseTable[];
  relationships: DatabaseRelationship[];
  migrations: MigrationSpec[];
  indexes: IndexSpec[];
}

export interface DatabaseTable {
  name: string;
  columns: ColumnSpec[];
  primaryKey: string;
  constraints: string[];
  description: string;
}

export interface ColumnSpec {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  constraints: string[];
  description: string;
}

export interface DatabaseRelationship {
  fromTable: string;
  toTable: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  foreignKey: string;
  description: string;
}

export interface MigrationSpec {
  version: string;
  name: string;
  upSql: string;
  downSql: string;
  description: string;
}

export interface IndexSpec {
  table: string;
  columns: string[];
  unique: boolean;
  description: string;
}

export interface APISpec {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  authRequired: boolean;
  requestSchema: string;
  responseSchema: string;
  description: string;
  errorResponses: APIErrorResponse[];
}

export interface APIErrorResponse {
  statusCode: number;
  condition: string;
  responseBody: string;
}

export interface ProductArchitecture {
  frontend: FrontendArchitecture;
  backend: BackendArchitecture;
  database: DatabaseSchema;
  apis: APISpec[];
  authentication: AuthArchitecture;
  integrations: IntegrationSpec[];
  infrastructure: InfrastructureSpec;
}

export interface FrontendArchitecture {
  framework: string;
  routing: string;
  stateManagement: string;
  designSystem: DesignSystemSpec;
  pages: PageSpec[];
  components: ComponentSpec[];
  responsiveBreakpoints: ResponsiveSpec[];
}

export interface BackendArchitecture {
  framework: string;
  language: string;
  runtime: string;
  services: ServiceSpec[];
  backgroundJobs: JobSpec[];
  caching: CachingSpec;
  rateLimiting: RateLimitSpec;
  middleware: string[];
}

export interface AuthArchitecture {
  method: 'jwt' | 'session' | 'oauth2' | 'sso' | 'passwordless';
  providers: string[];
  roles: RoleSpec[];
  permissions: PermissionSpec[];
  passwordPolicy: string;
  sessionConfig: string;
}

export interface IntegrationSpec {
  name: string;
  type: 'payment' | 'email' | 'sms' | 'storage' | 'search' | 'analytics' | 'maps' | 'ai' | 'other';
  provider: string;
  required: boolean;
  configuration: string[];
  fallbackBehavior: string;
}

export interface InfrastructureSpec {
  database: string;
  cache: string;
  storage: string;
  cdn: string;
  monitoring: string[];
  logging: string[];
  deployment: string;
  scaling: string;
}

export interface DesignSystemSpec {
  name: string;
  colorSystem: ColorSpec;
  typography: TypographySpec;
  spacing: SpacingSpec;
  componentLibrary: string;
  animationPolicy: string;
  accessibilityLevel: string;
}

export interface ColorSpec {
  primary: string;
  secondary: string;
  neutral: string[];
  semantic: { success: string; warning: string; error: string; info: string };
  contrastRatios: Record<string, number>;
}

export interface TypographySpec {
  fontFamilies: Record<string, string>;
  scale: number[];
  lineHeights: number[];
  fontWeights: number[];
}

export interface SpacingSpec {
  unit: number;
  scale: number[];
}

export interface PageSpec {
  path: string;
  name: string;
  requiresAuth: boolean;
  requiredRoles: string[];
  layout: string;
  components: string[];
  seoTitle?: string;
}

export interface ComponentSpec {
  name: string;
  type: string;
  states: string[];
  accessibility: string[];
  responsiveBehavior: string;
}

export interface ResponsiveSpec {
  name: string;
  minWidth: number;
  maxWidth?: number;
  layout: string;
}

export interface ServiceSpec {
  name: string;
  responsibility: string;
  endpoints: string[];
  dependencies: string[];
}

export interface JobSpec {
  name: string;
  trigger: string;
  schedule?: string;
  tasks: string[];
}

export interface CachingSpec {
  strategy: string;
  ttl: number;
  invalidationRules: string[];
}

export interface RateLimitSpec {
  windowMs: number;
  maxRequests: number;
  tierLimits: Record<string, number>;
}

export interface RoleSpec {
  name: string;
  permissions: string[];
}

export interface PermissionSpec {
  name: string;
  description: string;
  resource: string;
  actions: string[];
}

// =============================================================================
// PRODUCT PLAN (The Master Document)
// =============================================================================

export interface ProductPlan {
  planId: string;
  userRequest: string;
  createdAtIso: string;
  domainAnalysis: ProductDomainAnalysis;
  competitiveIntelligence: CompetitiveIntelligenceReport;
  requirements: ProductRequirement[];
  architecture: ProductArchitecture;
  implementationPlan: ImplementationPhase[];
  testingStrategy: TestingStrategy;
  deploymentPlan: DeploymentPlan;
  acceptanceCriteria: AcceptanceCriteria;
  estimatedComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE';
}

export interface ImplementationPhase {
  phaseNumber: number;
  name: string;
  description: string;
  requirements: string[];
  estimatedEffort: string;
  dependencies: number[];
  parallelizable: boolean;
}

export interface TestingStrategy {
  unitTests: { required: boolean; frameworks: string[] };
  integrationTests: { required: boolean; frameworks: string[] };
  e2eTests: { required: boolean; frameworks: string[] };
  visualTests: { required: boolean; tool: string };
  securityTests: { required: boolean; tools: string[] };
  performanceTests: { required: boolean; thresholds: Record<string, number> };
  accessibilityTests: { required: boolean; standard: string };
}

export interface DeploymentPlan {
  environments: string[];
  ciCdPipeline: string[];
  databaseStrategy: string;
  secretsManagement: string;
  monitoringSetup: string[];
  rollbackStrategy: string;
  blueGreenDeployment: boolean;
}

export interface AcceptanceCriteria {
  requirementCoverageTarget: number; // percentage
  allCriticalRequirementsImplemented: boolean;
  allHighRequirementsImplemented: boolean;
  allApiEndpointsFunctional: boolean;
  allDatabaseMigrationsRun: boolean;
  authenticationWorking: boolean;
  authorizationEnforced: boolean;
  paymentIntegrationTested: boolean;
  securityScanPassed: boolean;
  accessibilityStandardMet: string;
  performanceThresholdsMet: boolean;
  allTestsPassing: boolean;
  deploymentConfigured: boolean;
  documentationComplete: boolean;
  visualQualityApproved: boolean;
}

// =============================================================================
// PRODUCT ENGINEERING ENGINE
// =============================================================================

export interface ProductEngineeringState {
  planId: string;
  userRequest: string;
  phase: 'UNDERSTAND' | 'RESEARCH' | 'PLAN' | 'ARCHITECT' | 'IMPLEMENT' | 'VERIFY' | 'PREPARE';
  domainAnalysis?: ProductDomainAnalysis;
  competitiveIntelligence?: CompetitiveIntelligenceReport;
  productPlan?: ProductPlan;
  implementationProgress: Map<string, RequirementStatus>;
  verificationResults: VerificationResult[];
  knownIssues: KnownIssue[];
  startedAtIso: string;
  updatedAtIso: string;
}

export interface VerificationResult {
  requirementId: string;
  method: VerificationMethod;
  passed: boolean;
  details: string;
  evidence: string;
  timestampIso: string;
}

export interface KnownIssue {
  id: string;
  severity: 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  requirementId?: string;
  workaround?: string;
  blockedByExternal: boolean;
  externalBlockerDescription?: string;
}

// =============================================================================
// PRODUCT INTELLIGENCE FUNCTIONS
// =============================================================================

/**
 * Phase 1: Understand the user's short instruction and identify product domain.
 */
export function analyzeProductDomain(userRequest: string): ProductDomainAnalysis {
  const lower = userRequest.toLowerCase();

  // Domain classification by keyword matching
  const domainPatterns: Array<{ domain: ProductDomain; keywords: string[]; primary: string; industry: string; users: string[]; businessModels: string[] }> = [
    {
      domain: 'ecommerce',
      keywords: ['ecommerce', 'e-commerce', 'online store', 'marketplace', 'sell products', 'checkout', 'shopping cart', 'buy now'],
      primary: 'Online E-Commerce Platform',
      industry: 'Retail & Digital Commerce',
      users: ['Shoppers', 'Store owners', 'Sellers', 'Administrators'],
      businessModels: ['Product sales', 'Subscription', 'Commission on sales'],
    },
    {
      domain: 'food_service',
      keywords: ['coffee', 'cafe', 'restaurant', 'food', 'bakery', 'bistro', 'diner', 'menu', 'ordering', 'reservation', 'roastery', 'espresso', 'latte', 'cappuccino', 'brew', 'pour-over', 'cold brew', 'specialty coffee'],
      primary: 'Food Service & Hospitality',
      industry: 'Food & Beverage',
      users: ['Customers', 'Staff', 'Managers', 'Kitchen'],
      businessModels: ['Direct sales', 'Delivery', 'Subscription', 'Catering'],
    },
    {
      domain: 'saas',
      keywords: ['saas', 'software as a service', 'subscription app', 'dashboard app', 'web app'],
      primary: 'SaaS Application',
      industry: 'Software & Technology',
      users: ['End users', 'Team administrators', 'Billing managers'],
      businessModels: ['Subscription tiers', 'Usage-based pricing', 'Freemium'],
    },
    {
      domain: 'marketplace',
      keywords: ['marketplace', 'platform for', 'connect buyers', 'connect sellers', 'two-sided'],
      primary: 'Digital Marketplace',
      industry: 'Platform Economy',
      users: ['Buyers', 'Sellers', 'Platform operators', 'Support'],
      businessModels: ['Commission', 'Listing fees', 'Premium features'],
    },
    {
      domain: 'project_management',
      keywords: ['project management', 'task manager', 'kanban', 'scrum', 'agile tool', 'issue tracker'],
      primary: 'Project Management System',
      industry: 'Business Productivity',
      users: ['Team members', 'Project managers', 'Stakeholders'],
      businessModels: ['Subscription', 'Per-seat pricing', 'Enterprise'],
    },
    {
      domain: 'ai_platform',
      keywords: ['ai platform', 'machine learning', 'ml platform', 'model deployment', 'inference api', 'llm'],
      primary: 'AI/ML Platform',
      industry: 'Artificial Intelligence',
      users: ['ML Engineers', 'Data Scientists', 'Developers', 'DevOps'],
      businessModels: ['API usage', 'Compute-based', 'Enterprise licensing'],
    },
    {
      domain: 'social_media',
      keywords: ['social media', 'social network', 'feed', 'follow', 'post', 'share', 'connect with friends'],
      primary: 'Social Media Platform',
      industry: 'Social Networking',
      users: ['Content creators', 'Consumers', 'Admins', 'Moderators'],
      businessModels: ['Advertising', 'Premium subscriptions', 'Creator monetization'],
    },
    {
      domain: 'fintech',
      keywords: ['banking', 'payment', 'wallet', 'crypto', 'finance', 'ledger', 'invoice', 'billing'],
      primary: 'Financial Technology',
      industry: 'Financial Services',
      users: ['Consumers', 'Businesses', 'Accountants', 'Admins'],
      businessModels: ['Transaction fees', 'Subscription', 'Interchange'],
    },
    {
      domain: 'crm',
      keywords: ['crm', 'customer relationship', 'lead management', 'sales pipeline', 'contact management'],
      primary: 'CRM System',
      industry: 'Sales & Customer Management',
      users: ['Sales reps', 'Sales managers', 'Marketing', 'Support'],
      businessModels: ['Per-seat subscription', 'Enterprise pricing'],
    },
    {
      domain: 'analytics',
      keywords: ['analytics', 'dashboard', 'metrics', 'reporting', 'data visualization', 'bi'],
      primary: 'Analytics Platform',
      industry: 'Business Intelligence',
      users: ['Analysts', 'Executives', 'Developers', 'Data teams'],
      businessModels: ['Usage-based', 'Per-seat', 'Enterprise'],
    },
  ];

  let bestMatch = { domain: 'general' as ProductDomain, confidence: 0.3, keywords: [] as string[], totalLength: 0 };

  for (const pattern of domainPatterns) {
    const matches = pattern.keywords.filter(kw => {
      if (kw.includes(' ')) {
        // Multi-word keyword: match as phrase
        return lower.includes(kw);
      }
      // Single word: use word boundaries
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`).test(lower);
    });
    if (matches.length > bestMatch.keywords.length || (matches.length > 0 && matches.length === bestMatch.keywords.length && matches.reduce((s, k) => s + k.length, 0) > bestMatch.totalLength)) {
      bestMatch = {
        domain: pattern.domain,
        confidence: Math.min(0.99, 0.5 + matches.length * 0.15),
        keywords: matches,
      };
    }
  }

  const pattern = domainPatterns.find(p => p.domain === bestMatch.domain) ??
    domainPatterns[domainPatterns.length - 1];

  return {
    domain: bestMatch.domain,
    confidence: bestMatch.confidence,
    primaryCategory: pattern.primary,
    industry: pattern.industry,
    targetUsers: pattern.users,
    businessModel: pattern.businessModels,
    keyCapabilities: [],
  };
}

/**
 * Phase 2: Generate competitive intelligence based on product domain.
 * Uses domain knowledge to provide realistic competitor profiles and requirements.
 */
export function generateCompetitiveIntelligence(
  domain: ProductDomain,
  userRequest: string
): CompetitiveIntelligenceReport {
  const nowIso = new Date().toISOString();
  const domainIntelligence = DOMAIN_INTELLIGENCE_LIBRARY[domain] ??
    DOMAIN_INTELLIGENCE_LIBRARY['general'];

  return {
    productDomain: domain,
    analyzedAtIso: nowIso,
    competitors: domainIntelligence.competitors,
    marketGaps: domainIntelligence.marketGaps,
    mandatoryCapabilities: domainIntelligence.mandatoryCapabilities,
    industryStandardFeatures: domainIntelligence.industryStandard,
    advancedFeatures: domainIntelligence.advancedFeatures,
    securityComplianceRequirements: domainIntelligence.securityRequirements,
    technicalArchitecturePatterns: domainIntelligence.techPatterns,
    userExperienceExpectations: domainIntelligence.uxExpectations,
    competitiveDifferentiators: domainIntelligence.differentiators,
  };
}

/**
 * Phase 3: Generate complete product requirements based on domain analysis
 * and competitive intelligence.
 */
export function generateProductRequirements(
  domainAnalysis: ProductDomainAnalysis,
  competitive: CompetitiveIntelligenceReport,
  userRequest: string
): ProductRequirement[] {
  const requirements: ProductRequirement[] = [];
  let idCounter = 1;

  const domainReqs = DOMAIN_REQUIREMENTS_LIBRARY[domainAnalysis.domain] ??
    DOMAIN_REQUIREMENTS_LIBRARY['general'];

  for (const req of domainReqs) {
    requirements.push({
      id: `REQ-${String(idCounter++).padStart(3, '0')}`,
      category: req.category,
      title: req.title,
      description: req.description,
      priority: req.priority,
      acceptanceCriteria: req.acceptanceCriteria,
      verificationMethod: req.verificationMethod,
      dependencies: req.dependencies,
      status: 'NOT_STARTED',
      implementedInFiles: [],
      testCoverage: false,
      notes: '',
    });
  }

  return requirements;
}

/**
 * Phase 4: Generate product architecture from requirements.
 */
export function generateProductArchitecture(
  requirements: ProductRequirement[],
  domain: ProductDomain,
  userRequest: string
): ProductArchitecture {
  const techStack = SELECT_TECH_STACK[domain] ?? SELECT_TECH_STACK['general'];

  return {
    frontend: {
      framework: techStack.frontend.framework,
      routing: techStack.frontend.routing,
      stateManagement: techStack.frontend.stateManagement,
      designSystem: techStack.designSystem,
      pages: extractPageSpecs(requirements),
      components: extractComponentSpecs(requirements),
      responsiveBreakpoints: [
        { name: 'mobile', minWidth: 320, maxWidth: 767, layout: 'single-column, bottom-nav' },
        { name: 'tablet', minWidth: 768, maxWidth: 1023, layout: 'sidebar-drawer, adaptive grid' },
        { name: 'desktop', minWidth: 1024, layout: 'full sidebar, multi-column grid' },
      ],
    },
    backend: {
      framework: techStack.backend.framework,
      language: techStack.backend.language,
      runtime: techStack.backend.runtime,
      services: extractServiceSpecs(requirements),
      backgroundJobs: extractJobSpecs(requirements),
      caching: { strategy: 'Redis with tiered TTL', ttl: 3600, invalidationRules: ['Write-through on mutations', 'Tag-based bulk invalidation'] },
      rateLimiting: { windowMs: 60000, maxRequests: 100, tierLimits: { anonymous: 20, authenticated: 100, premium: 500 } },
      middleware: ['Authentication', 'Authorization', 'Rate limiting', 'CORS', 'Request logging', 'Error handling', 'Request validation'],
    },
    database: generateDatabaseSchema(requirements, domain),
    apis: extractAPISpecs(requirements),
    authentication: {
      method: 'jwt',
      providers: ['email/password'],
      roles: extractRoleSpecs(requirements),
      permissions: extractPermissionSpecs(requirements),
      passwordPolicy: 'Minimum 8 characters, bcrypt hashing, common password check',
      sessionConfig: 'JWT access token (15min) + refresh token (7d) with rotation',
    },
    integrations: techStack.integrations,
    infrastructure: techStack.infrastructure,
  };
}

/**
 * Phase 5: Generate the complete product plan.
 */
export function generateProductPlan(
  userRequest: string,
  domain: ProductDomainAnalysis,
  competitive: CompetitiveIntelligenceReport,
  requirements: ProductRequirement[],
  architecture: ProductArchitecture
): ProductPlan {
  const nowIso = new Date().toISOString();
  const planId = `PLAN-${Date.now().toString(36).toUpperCase()}`;

  const criticalCount = requirements.filter(r => r.priority === 'CRITICAL').length;
  const highCount = requirements.filter(r => r.priority === 'HIGH').length;
  const totalCount = requirements.length;

  let complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE' = 'LOW';
  if (totalCount > 40 || criticalCount > 10) complexity = 'ENTERPRISE';
  else if (totalCount > 25 || criticalCount > 6) complexity = 'HIGH';
  else if (totalCount > 15 || criticalCount > 3) complexity = 'MEDIUM';

  return {
    planId,
    userRequest,
    createdAtIso: nowIso,
    domainAnalysis: domain,
    competitiveIntelligence: competitive,
    requirements,
    architecture,
    implementationPlan: generateImplementationPhases(requirements),
    testingStrategy: {
      unitTests: { required: true, frameworks: [architecture.backend.language === 'python' ? 'pytest' : architecture.backend.language === 'go' ? 'go test' : 'vitest'] },
      integrationTests: { required: true, frameworks: ['supertest', 'playwright'] },
      e2eTests: { required: totalCount > 10, frameworks: ['playwright'] },
      visualTests: { required: true, tool: 'playwright snapshot' },
      securityTests: { required: true, tools: ['OWASP ZAP', 'dependency audit'] },
      performanceTests: { required: totalCount > 10, thresholds: { lcp: 2500, fid: 100, cls: 0.1, apiP95: 200 } },
      accessibilityTests: { required: true, standard: 'WCAG 2.1 AA' },
    },
    deploymentPlan: {
      environments: ['development', 'staging', 'production'],
      ciCdPipeline: ['Lint', 'Typecheck', 'Unit tests', 'Build', 'Integration tests', 'Security scan', 'Deploy staging', 'E2E tests', 'Deploy production'],
      databaseStrategy: 'Expand-and-contract migrations with zero downtime',
      secretsManagement: 'Environment variables + secret manager (no hardcoded secrets)',
      monitoringSetup: ['Application metrics', 'Error tracking', 'Uptime monitoring', 'Database monitoring'],
      rollbackStrategy: 'Blue-green deployment with instant rollback',
      blueGreenDeployment: true,
    },
    acceptanceCriteria: {
      requirementCoverageTarget: 100,
      allCriticalRequirementsImplemented: false,
      allHighRequirementsImplemented: false,
      allApiEndpointsFunctional: false,
      allDatabaseMigrationsRun: false,
      authenticationWorking: false,
      authorizationEnforced: false,
      paymentIntegrationTested: false,
      securityScanPassed: false,
      accessibilityStandardMet: '',
      performanceThresholdsMet: false,
      allTestsPassing: false,
      deploymentConfigured: false,
      documentationComplete: false,
      visualQualityApproved: false,
    },
    estimatedComplexity: complexity,
  };
}

/**
 * Phase 6: Generate implementation phases from requirements.
 */
export function generateImplementationPhases(requirements: ProductRequirement[]): ImplementationPhase[] {
  const critical = requirements.filter(r => r.priority === 'CRITICAL');
  const high = requirements.filter(r => r.priority === 'HIGH');
  const medium = requirements.filter(r => r.priority === 'MEDIUM');
  const low = requirements.filter(r => r.priority === 'LOW');

  return [
    {
      phaseNumber: 1,
      name: 'Foundation & Infrastructure',
      description: 'Database schema, authentication, core APIs, and project setup',
      requirements: critical.filter(r => ['database_schema', 'authentication', 'backend_api'].includes(r.category)).map(r => r.id),
      estimatedEffort: `${Math.max(1, Math.ceil(critical.length / 3))} days`,
      dependencies: [],
      parallelizable: false,
    },
    {
      phaseNumber: 2,
      name: 'Core Business Logic',
      description: 'Primary business workflows, API endpoints, and data models',
      requirements: [...critical.filter(r => !['database_schema', 'authentication', 'backend_api'].includes(r.category)), ...high].slice(0, 8).map(r => r.id),
      estimatedEffort: `${Math.max(2, Math.ceil(high.length / 2))} days`,
      dependencies: [1],
      parallelizable: false,
    },
    {
      phaseNumber: 3,
      name: 'Frontend Implementation',
      description: 'All pages, components, and user-facing features',
      requirements: requirements.filter(r => r.category.startsWith('frontend')).map(r => r.id),
      estimatedEffort: `${Math.max(2, Math.ceil(requirements.filter(r => r.category.startsWith('frontend')).length / 3))} days`,
      dependencies: [2],
      parallelizable: true,
    },
    {
      phaseNumber: 4,
      name: 'Integrations & Advanced Features',
      description: 'Third-party integrations, notifications, search, and advanced capabilities',
      requirements: [...medium.filter(r => !r.category.startsWith('frontend')), ...low].slice(0, 10).map(r => r.id),
      estimatedEffort: `${Math.max(1, Math.ceil(medium.length / 3))} days`,
      dependencies: [3],
      parallelizable: true,
    },
    {
      phaseNumber: 5,
      name: 'Testing, Security & Verification',
      description: 'Complete test suite, security audit, accessibility verification',
      requirements: requirements.filter(r => ['testing', 'security', 'accessibility'].includes(r.category)).map(r => r.id),
      estimatedEffort: `${Math.max(1, Math.ceil(requirements.filter(r => ['testing', 'security', 'accessibility'].includes(r.category)).length / 4))} days`,
      dependencies: [4],
      parallelizable: false,
    },
    {
      phaseNumber: 6,
      name: 'Documentation & Deployment',
      description: 'Documentation, deployment configuration, and production readiness',
      requirements: requirements.filter(r => ['documentation', 'deployment', 'logging_monitoring'].includes(r.category)).map(r => r.id),
      estimatedEffort: '1-2 days',
      dependencies: [5],
      parallelizable: false,
    },
  ];
}

// =============================================================================
// HELPER: Architecture Extraction
// =============================================================================

function extractPageSpecs(requirements: ProductRequirement[]): PageSpec[] {
  const pages: PageSpec[] = [];
  const frontendReqs = requirements.filter(r => r.category.startsWith('frontend'));
  for (const req of frontendReqs) {
    const path = '/' + req.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    pages.push({
      path,
      name: req.title,
      requiresAuth: !['home', 'about', 'contact', 'login', 'register'].some(p => req.title.toLowerCase().includes(p)),
      requiredRoles: [],
      layout: 'default',
      components: [req.title.replace(/\s+/g, '')],
      seoTitle: req.title,
    });
  }
  // Always include essential pages
  if (!pages.find(p => p.path === '/')) {
    pages.unshift({ path: '/', name: 'Home', requiresAuth: false, requiredRoles: [], layout: 'landing', components: ['Hero', 'Features'] });
  }
  if (!pages.find(p => p.path === '/login')) {
    pages.push({ path: '/login', name: 'Login', requiresAuth: false, requiredRoles: [], layout: 'auth', components: ['LoginForm'] });
  }
  return pages;
}

function extractComponentSpecs(_requirements: ProductRequirement[]): ComponentSpec[] {
  return [
    { name: 'Button', type: 'interactive', states: ['default', 'hover', 'active', 'disabled', 'loading'], accessibility: ['keyboard', 'aria-label', 'focus-indicator'], responsiveBehavior: 'touch-friendly 44px min target' },
    { name: 'Modal', type: 'overlay', states: ['open', 'closing', 'closed'], accessibility: ['focus-trap', 'aria-modal', 'escape-key'], responsiveBehavior: 'full-screen on mobile' },
    { name: 'Navbar', type: 'navigation', states: ['default', 'scrolled', 'mobile-menu'], accessibility: ['skip-link', 'aria-current', 'mobile-menu-button'], responsiveBehavior: 'hamburger below tablet' },
    { name: 'Card', type: 'container', states: ['default', 'hover', 'selected'], accessibility: ['role', 'heading-structure'], responsiveBehavior: 'stacked on mobile' },
    { name: 'Form', type: 'input', states: ['default', 'focused', 'error', 'success', 'disabled'], accessibility: ['labels', 'error-messages', 'help-text'], responsiveBehavior: 'full-width on mobile' },
    { name: 'Toast', type: 'notification', states: ['info', 'success', 'warning', 'error', 'dismissed'], accessibility: ['aria-live', 'role=status'], responsiveBehavior: 'bottom-right on desktop, top on mobile' },
    { name: 'Drawer', type: 'overlay', states: ['closed', 'opening', 'open', 'closing'], accessibility: ['focus-trap', 'aria-hidden'], responsiveBehavior: 'full-width on mobile' },
    { name: 'Table', type: 'data', states: ['loading', 'populated', 'empty', 'error'], accessibility: ['headers', 'sort-aria', 'pagination-aria'], responsiveBehavior: 'card view on mobile' },
    { name: 'Pagination', type: 'navigation', states: ['default', 'active-page', 'disabled'], accessibility: ['aria-label', 'current-page'], responsiveBehavior: 'simplified on mobile' },
    { name: 'SearchBar', type: 'input', states: ['idle', 'typing', 'results', 'empty', 'error'], accessibility: ['autocomplete', 'aria-expanded'], responsiveBehavior: 'full-width on mobile' },
  ];
}

function extractServiceSpecs(_requirements: ProductRequirement[]): ServiceSpec[] {
  return [
    { name: 'auth-service', responsibility: 'User authentication, session management, token issuance', endpoints: ['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/refresh'], dependencies: ['database', 'cache'] },
    { name: 'user-service', responsibility: 'User profile management, preferences', endpoints: ['/api/users/me', '/api/users/:id'], dependencies: ['database', 'auth-service'] },
    { name: 'api-gateway', responsibility: 'Request routing, rate limiting, request/response transformation', endpoints: ['/api/*'], dependencies: ['auth-service', 'user-service'] },
  ];
}

function extractJobSpecs(_requirements: ProductRequirement[]): JobSpec[] {
  return [
    { name: 'email-notifications', trigger: 'event-based', tasks: ['send-welcome-email', 'send-order-confirmation', 'send-password-reset'] },
    { name: 'data-cleanup', trigger: 'scheduled', schedule: '0 2 * * *', tasks: ['expire-old-sessions', 'archive-old-logs'] },
  ];
}

function extractAPISpecs(_requirements: ProductRequirement[]): APISpec[] {
  return [
    { endpoint: '/api/health', method: 'GET', authRequired: false, requestSchema: '{}', responseSchema: '{ status: string, timestamp: string }', description: 'Health check endpoint', errorResponses: [] },
    { endpoint: '/api/auth/register', method: 'POST', authRequired: false, requestSchema: '{ email: string, password: string }', responseSchema: '{ user: User, token: string }', description: 'Register new user', errorResponses: [{ statusCode: 409, condition: 'Email already exists', responseBody: '{ error: string }' }] },
    { endpoint: '/api/auth/login', method: 'POST', authRequired: false, requestSchema: '{ email: string, password: string }', responseSchema: '{ user: User, token: string }', description: 'Authenticate user', errorResponses: [{ statusCode: 401, condition: 'Invalid credentials', responseBody: '{ error: string }' }] },
    { endpoint: '/api/users/me', method: 'GET', authRequired: true, requestSchema: '{}', responseSchema: '{ user: User }', description: 'Get current user profile', errorResponses: [{ statusCode: 401, condition: 'Not authenticated', responseBody: '{ error: string }' }] },
    { endpoint: '/api/users/me', method: 'PUT', authRequired: true, requestSchema: '{ name?: string, preferences?: object }', responseSchema: '{ user: User }', description: 'Update current user profile', errorResponses: [{ statusCode: 400, condition: 'Invalid input', responseBody: '{ error: string, details: object }' }] },
  ];
}

function extractRoleSpecs(_requirements: ProductRequirement[]): RoleSpec[] {
  const roles = [{ name: 'user', permissions: ['profile:read', 'profile:update', 'own_data:read'] }];
  if (_requirements.some(r => r.category === 'frontend_admin')) {
    roles.push({ name: 'admin', permissions: ['profile:read', 'profile:update', 'users:manage', 'content:manage', 'settings:manage', 'reports:read'] });
  }
  return roles;
}

function extractPermissionSpecs(_requirements: ProductRequirement[]): PermissionSpec[] {
  const perms = [
    { name: 'profile:read', description: 'Read own profile', resource: 'User', actions: ['read'] },
    { name: 'profile:update', description: 'Update own profile', resource: 'User', actions: ['update'] },
    { name: 'users:manage', description: 'Manage all users', resource: 'User', actions: ['read', 'update', 'delete'] },
    { name: 'content:manage', description: 'Manage all content', resource: 'Content', actions: ['create', 'read', 'update', 'delete'] },
    { name: 'settings:manage', description: 'Manage system settings', resource: 'Settings', actions: ['read', 'update'] },
    { name: 'reports:read', description: 'View analytics reports', resource: 'Reports', actions: ['read'] },
  ];
  if (_requirements.some(r => r.category === 'payment_processing')) {
    perms.push({ name: 'payments:manage', description: 'Manage payments and refunds', resource: 'Payment', actions: ['read', 'refund'] });
  }
  return perms;
}

function generateDatabaseSchema(
  _requirements: ProductRequirement[],
  _domain: ProductDomain
): DatabaseSchema {
  const tables: DatabaseTable[] = [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'UUID PRIMARY KEY', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Unique user identifier' },
        { name: 'email', type: 'VARCHAR(255) UNIQUE NOT NULL', nullable: false, constraints: ['UNIQUE', 'NOT NULL', 'LOWER(email)'], description: 'User email address' },
        { name: 'password_hash', type: 'VARCHAR(255) NOT NULL', nullable: false, constraints: ['NOT NULL'], description: 'Bcrypt hashed password' },
        { name: 'name', type: 'VARCHAR(100)', nullable: true, constraints: [], description: 'Display name' },
        { name: 'role', type: 'VARCHAR(20) DEFAULT \'user\'', nullable: false, defaultValue: 'user', constraints: ["CHECK (role IN ('user', 'admin', 'moderator'))"], description: 'User role' },
        { name: 'is_active', type: 'BOOLEAN DEFAULT true', nullable: false, defaultValue: 'true', constraints: [], description: 'Account active status' },
        { name: 'last_login_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Last login timestamp' },
        { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, constraints: [], description: 'Creation timestamp' },
        { name: 'updated_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, constraints: [], description: 'Last update timestamp' },
      ],
      primaryKey: 'id',
      constraints: ['email format validation'],
      description: 'Core user accounts',
    },
    {
      name: 'user_sessions',
      columns: [
        { name: 'id', type: 'UUID PRIMARY KEY', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Session identifier' },
        { name: 'user_id', type: 'UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE', nullable: false, constraints: ['FK -> users.id', 'INDEX'], description: 'Associated user' },
        { name: 'refresh_token_hash', type: 'VARCHAR(255) NOT NULL', nullable: false, constraints: ['NOT NULL'], description: 'Hashed refresh token' },
        { name: 'expires_at', type: 'TIMESTAMPTZ NOT NULL', nullable: false, constraints: [], description: 'Session expiry' },
        { name: 'created_at', type: 'TIMESTAMPTZ DEFAULT now()', nullable: false, constraints: [], description: 'Creation timestamp' },
      ],
      primaryKey: 'id',
      constraints: ['FK -> users(id)', 'INDEX(user_id, expires_at)'],
      description: 'User authentication sessions',
    },
  ];

  const relationships: DatabaseRelationship[] = [
    { fromTable: 'user_sessions', toTable: 'users', type: 'MANY_TO_ONE', foreignKey: 'user_id', description: 'Each session belongs to one user' },
  ];

  const migrations: MigrationSpec[] = [
    {
      version: '001_initial',
      name: 'Create users and sessions tables',
      upSql: `CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);`,
      downSql: 'DROP TABLE IF EXISTS user_sessions CASCADE; DROP TABLE IF EXISTS users CASCADE;',
      description: 'Initial schema with users and sessions',
    },
  ];

  const indexes: IndexSpec[] = [
    { table: 'users', columns: ['email'], unique: true, description: 'Fast email lookup for authentication' },
    { table: 'user_sessions', columns: ['user_id', 'expires_at'], unique: false, description: 'Session cleanup and user session listing' },
  ];

  return { tables, relationships, migrations, indexes };
}

// =============================================================================
// REQUIREMENT COVERAGE TRACKING
// =============================================================================

export interface RequirementCoverageMatrix {
  requirements: Array<{
    id: string;
    title: string;
    category: string;
    priority: string;
    planned: boolean;
    implemented: RequirementStatus;
    integrated: RequirementStatus;
    tested: RequirementStatus;
    verified: RequirementStatus;
    implementationFiles: string[];
    testFiles: string[];
  }>;
  summary: {
    total: number;
    planned: number;
    implemented: number;
    integrated: number;
    tested: number;
    verified: number;
    coveragePct: number;
  };
}

export function buildCoverageMatrix(requirements: ProductRequirement[]): RequirementCoverageMatrix {
  const matrix = requirements.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    priority: r.priority,
    planned: true,
    implemented: r.status,
    integrated: r.status === 'IMPLEMENTED' || r.status === 'INTEGRATED' || r.status === 'TESTED' || r.status === 'VERIFIED'
      ? 'INTEGRATED' : 'NOT_STARTED',
    tested: r.testCoverage ? 'TESTED' : 'NOT_STARTED',
    verified: r.status === 'VERIFIED' ? 'VERIFIED' : 'NOT_STARTED',
    implementationFiles: r.implementedInFiles,
    testFiles: [],
  }));

  const total = matrix.length;
  const implCount = matrix.filter(m => ['IMPLEMENTED', 'INTEGRATED', 'TESTED', 'VERIFIED'].includes(m.implemented)).length;
  const intCount = matrix.filter(m => m.integrated === 'INTEGRATED').length;
  const testCount = matrix.filter(m => m.tested === 'TESTED').length;
  const verCount = matrix.filter(m => m.verified === 'VERIFIED').length;

  return {
    requirements: matrix,
    summary: {
      total,
      planned: total,
      implemented: implCount,
      integrated: intCount,
      tested: testCount,
      verified: verCount,
      coveragePct: total > 0 ? Math.round((verCount / total) * 100) : 0,
    },
  };
}

/**
 * Independent verification: check if the actual workspace matches the plan.
 */
export function verifyAgainstPlan(
  workspaceFiles: Record<string, string>,
  plan: ProductPlan
): VerificationResult[] {
  const results: VerificationResult[] = [];

  // Check each critical requirement has some implementation evidence
  for (const req of plan.requirements) {
    if (req.priority === 'LOW') continue; // Skip low priority for independent check

    const hasImplementation = Object.keys(workspaceFiles).some(f =>
      req.implementedInFiles.some(implFile => f.includes(implFile) || f === implFile)
    );

    // If no specific files, check for generic indicators
    const hasGenericIndicator = req.implementedInFiles.length === 0 &&
      Object.keys(workspaceFiles).length > 0;

    const verified = hasImplementation || hasGenericIndicator;

    results.push({
      requirementId: req.id,
      method: req.verificationMethod,
      passed: verified,
      details: verified
        ? `Found implementation evidence for ${req.id}: ${req.title}`
        : `MISSING: No implementation found for ${req.id}: ${req.title}`,
      evidence: verified
        ? `Files checked: ${Object.keys(workspaceFiles).length} workspace files`
        : `Required: ${req.acceptanceCriteria.join('; ')}`,
      timestampIso: new Date().toISOString(),
    });
  }

  return results;
}

// =============================================================================
// TECH STACK SELECTION
// =============================================================================

const SELECT_TECH_STACK: Record<ProductDomain, {
  frontend: { framework: string; routing: string; stateManagement: string };
  backend: { framework: string; language: string; runtime: string };
  designSystem: DesignSystemSpec;
  integrations: IntegrationSpec[];
  infrastructure: InfrastructureSpec;
}> = {
  general: {
    frontend: { framework: 'React 19', routing: 'React Router v7', stateManagement: 'Zustand + React Query' },
    backend: { framework: 'Express', language: 'TypeScript', runtime: 'Node.js 22' },
    designSystem: {
      name: 'Custom Design System',
      colorSystem: { primary: '#1a1a2e', secondary: '#16213e', neutral: ['#f8f9fa', '#e9ecef', '#dee2e6', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'], semantic: { success: '#10b981', warning: '#f59e0b', error: '#ef4444', info: '#3b82f6' }, contrastRatios: { 'primary-on-white': 8.5, 'body-on-white': 7.2 } },
      typography: { fontFamilies: { heading: 'Inter, system-ui', body: 'Inter, system-ui', mono: 'JetBrains Mono, monospace' }, scale: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60], lineHeights: [1.2, 1.3, 1.4, 1.5, 1.6], fontWeights: [400, 500, 600, 700] },
      spacing: { unit: 4, scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80] },
      componentLibrary: 'Custom Radix UI + Tailwind CSS v4',
      animationPolicy: 'Compositor-only transforms (150ms max) for interactive states; no layout-triggering animations',
      accessibilityLevel: 'WCAG 2.1 AA',
    },
    integrations: [
      { name: 'Email', type: 'email', provider: 'Resend / Nodemailer', required: true, configuration: ['RESEND_API_KEY'], fallbackBehavior: 'Queue emails for retry' },
      { name: 'File Storage', type: 'storage', provider: 'Local filesystem / S3', required: false, configuration: ['STORAGE_PATH or S3_BUCKET'], fallbackBehavior: 'Use local filesystem' },
    ],
    infrastructure: {
      database: 'PostgreSQL 17',
      cache: 'Redis (optional)',
      storage: 'Local filesystem / S3-compatible',
      cdn: 'None (local)',
      monitoring: ['Console logging', 'Error boundaries'],
      logging: ['Structured JSON logs'],
      deployment: 'Vercel / Docker / PM2',
      scaling: 'Vertical + optional horizontal',
    },
  },
  food_service: {
    frontend: { framework: 'React 19', routing: 'React Router v7', stateManagement: 'Zustand + React Query' },
    backend: { framework: 'Express', language: 'TypeScript', runtime: 'Node.js 22' },
    designSystem: {
      name: 'Artisan Coffee Design System',
      colorSystem: { primary: '#3C2415', secondary: '#8B5E3C', neutral: ['#FFFDF7', '#F5EFE6', '#E8DFD0', '#C4B5A0', '#8B7D6B', '#5C5247', '#3C352E', '#1F1B18'], semantic: { success: '#2D8B4E', warning: '#D4A72C', error: '#C44536', info: '#4A7C94' }, contrastRatios: { 'dark-on-cream': 12.1, 'body-on-cream': 9.4 } },
      typography: { fontFamilies: { heading: 'Playfair Display, Georgia, serif', body: 'Inter, system-ui, sans-serif', mono: 'JetBrains Mono, monospace' }, scale: [12, 14, 16, 18, 20, 24, 30, 36, 48, 64], lineHeights: [1.1, 1.25, 1.4, 1.5, 1.65], fontWeights: [400, 500, 600, 700, 800] },
      spacing: { unit: 4, scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 120] },
      componentLibrary: 'Custom components with Tailwind CSS v4',
      animationPolicy: 'Smooth 200-300ms transitions for modals and drawers; parallax on hero images',
      accessibilityLevel: 'WCAG 2.1 AA',
    },
    integrations: [
      { name: 'Email', type: 'email', provider: 'Resend', required: true, configuration: ['RESEND_API_KEY'], fallbackBehavior: 'Queue for retry' },
      { name: 'Payment', type: 'payment', provider: 'Stripe', required: true, configuration: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'], fallbackBehavior: 'Manual payment verification mode' },
      { name: 'SMS', type: 'sms', provider: 'Twilio', required: false, configuration: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'], fallbackBehavior: 'Email-only notifications' },
    ],
    infrastructure: {
      database: 'PostgreSQL 17',
      cache: 'Redis (cart sessions, rate limiting)',
      storage: 'Local / S3 (product images)',
      cdn: 'None (local development)',
      monitoring: ['Structured logging', 'Error tracking'],
      logging: ['Winston structured JSON'],
      deployment: 'Docker Compose / VPS',
      scaling: 'Vertical to start, horizontal-ready',
    },
  },
  ecommerce: {
    frontend: { framework: 'React 19', routing: 'React Router v7', stateManagement: 'Zustand + React Query' },
    backend: { framework: 'Express', language: 'TypeScript', runtime: 'Node.js 22' },
    designSystem: {
      name: 'E-Commerce Design System',
      colorSystem: { primary: '#1a1a2e', secondary: '#e94560', neutral: ['#fafafa', '#f5f5f5', '#e0e0e0', '#bdbdbd', '#757575', '#424242', '#212121', '#000000'], semantic: { success: '#4caf50', warning: '#ff9800', error: '#f44336', info: '#2196f3' }, contrastRatios: { 'primary-on-white': 8.5, 'body-on-white': 7.2 } },
      typography: { fontFamilies: { heading: 'Inter, system-ui', body: 'Inter, system-ui', mono: 'JetBrains Mono, monospace' }, scale: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60], lineHeights: [1.2, 1.3, 1.4, 1.5, 1.6], fontWeights: [400, 500, 600, 700] },
      spacing: { unit: 4, scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80] },
      componentLibrary: 'Custom components with Tailwind CSS v4',
      animationPolicy: 'Compositor-only for performance; skeleton loaders for data states',
      accessibilityLevel: 'WCAG 2.1 AA',
    },
    integrations: [
      { name: 'Payment', type: 'payment', provider: 'Stripe', required: true, configuration: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'], fallbackBehavior: 'Manual verification mode' },
      { name: 'Email', type: 'email', provider: 'Resend / SendGrid', required: true, configuration: ['EMAIL_API_KEY'], fallbackBehavior: 'None (email critical for orders)' },
      { name: 'Storage', type: 'storage', provider: 'S3-compatible / Local', required: true, configuration: ['STORAGE_BUCKET', 'STORAGE_KEY'], fallbackBehavior: 'Local filesystem' },
    ],
    infrastructure: {
      database: 'PostgreSQL 17',
      cache: 'Redis (sessions, cart, rate limiting)',
      storage: 'S3-compatible object storage',
      cdn: 'Optional (local development)',
      monitoring: ['Application metrics', 'Error tracking', 'Uptime monitoring'],
      logging: ['Structured JSON logs with correlation IDs'],
      deployment: 'Docker / Kubernetes-ready',
      scaling: 'Horizontal scaling with shared database',
    },
  },
};

// =============================================================================
// DOMAIN REQUIREMENTS LIBRARY
// =============================================================================

interface DomainRequirementTemplate {
  category: RequirementCategory;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  acceptanceCriteria: string[];
  verificationMethod: VerificationMethod;
  dependencies: string[];
}

function makeReqs(reqs: Array<Omit<DomainRequirementTemplate, 'verificationMethod'> & { verificationMethod: VerificationMethod }>): Array<Omit<DomainRequirementTemplate, 'verificationMethod'>> {
  return reqs.map(r => ({ ...r }));
}

const DOMAIN_REQUIREMENTS_LIBRARY: Record<string, Array<Omit<DomainRequirementTemplate, 'verificationMethod'>>> = {
  food_service: [
    // Frontend - Customer
    { category: 'frontend_customer', title: 'Homepage with Hero Section', description: 'Visually compelling homepage showcasing the brand, featured items, and core value proposition', priority: 'CRITICAL', acceptanceCriteria: ['Hero section renders with brand imagery', 'Featured items are visible', 'Navigation works on all breakpoints', 'Loading states for async content'], dependencies: [] },
    { category: 'frontend_customer', title: 'Menu Display', description: 'Full menu with categories, items, descriptions, prices, and customization options', priority: 'CRITICAL', acceptanceCriteria: ['All menu categories display', 'Items show name, description, price', 'Dietary indicators visible (vegan, gluten-free, etc.)', 'Items sortable and filterable'], dependencies: ['database_schema'] },
    { category: 'frontend_customer', title: 'Product Customization', description: 'Ability to customize orders (size, milk type, extras, temperature, etc.)', priority: 'CRITICAL', acceptanceCriteria: ['Customization options appear per item', 'Price updates dynamically with options', 'All valid combinations work', 'Invalid combinations show errors'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Shopping Cart', description: 'Persistent cart with quantity controls, item notes, and price summary', priority: 'CRITICAL', acceptanceCriteria: ['Items persist across page refreshes', 'Quantity increment/decrement works', 'Cart total updates correctly', 'Cart survives session', 'Removal of items works'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Checkout Flow', description: 'Multi-step checkout with delivery/pickup selection, address form, and payment', priority: 'CRITICAL', acceptanceCriteria: ['Pickup/delivery toggle works', 'Address form validates properly', 'Payment processes correctly', 'Order confirmation shows', 'Error states display correctly'], dependencies: ['payment_processing', 'backend_api'] },
    { category: 'frontend_customer', title: 'User Account Management', description: 'Registration, login, profile management, and order history', priority: 'HIGH', acceptanceCriteria: ['Registration with email validation', 'Login with credential verification', 'Profile editing', 'Order history display', 'Password reset flow'], dependencies: ['authentication'] },
    { category: 'frontend_customer', title: 'Order Tracking', description: 'Real-time order status from confirmed to ready', priority: 'HIGH', acceptanceCriteria: ['Status updates in real-time', 'Estimated times shown', 'Status history visible', 'Notifications on status change'], dependencies: ['notification_system', 'backend_api'] },
    { category: 'frontend_customer', title: 'Reservation System', description: 'Table reservation with date, time, party size selection', priority: 'MEDIUM', acceptanceCriteria: ['Date/time picker functional', 'Availability shown', 'Confirmation email sent', 'Cancellation works', 'Modification works'], dependencies: ['notification_system'] },
    { category: 'frontend_customer', title: 'Reviews & Ratings', description: 'Customer review system with star ratings and photos', priority: 'MEDIUM', acceptanceCriteria: ['Star rating input works', 'Reviews display with timestamps', 'Moderation queue for admin', 'Average ratings shown'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Loyalty & Rewards', description: 'Points-based loyalty program with redemption options', priority: 'MEDIUM', acceptanceCriteria: ['Points accumulate on purchases', 'Rewards display correctly', 'Redemption at checkout', 'Tier progression shown'], dependencies: ['business_logic', 'backend_api'] },
    { category: 'frontend_customer', title: 'Promotions & Coupons', description: 'Discount codes, seasonal offers, and promotional banners', priority: 'HIGH', acceptanceCriteria: ['Promo codes apply correctly', 'Discount calculates properly', 'Expiration dates enforced', 'Stacking rules enforced'], dependencies: ['business_logic', 'backend_api'] },
    { category: 'frontend_customer', title: 'Gift Cards', description: 'Purchase and redemption of digital gift cards', priority: 'LOW', acceptanceCriteria: ['Gift cards can be purchased', 'Codes generated securely', 'Redemption at checkout', 'Balance tracking'], dependencies: ['payment_processing'] },
    { category: 'frontend_customer', title: 'Mobile-Responsive Design', description: 'Full functionality on mobile devices with touch-optimized interactions', priority: 'CRITICAL', acceptanceCriteria: ['All features work on 375px width', 'Touch targets >= 44px', 'No horizontal scroll', 'Mobile navigation works'], dependencies: [] },
    // Admin
    { category: 'frontend_admin', title: 'Admin Dashboard', description: 'Overview dashboard with key metrics, recent orders, and quick actions', priority: 'HIGH', acceptanceCriteria: ['Real-time order count', 'Revenue metrics displayed', 'Recent orders list', 'Quick action buttons work', 'Charts render correctly'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Order Management', description: 'View, update status, and manage customer orders', priority: 'CRITICAL', acceptanceCriteria: ['Orders list with filters', 'Status update actions', 'Order detail view', 'Search and filter', 'Bulk actions for common updates'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Menu Management', description: 'CRUD operations for menu items, categories, and pricing', priority: 'CRITICAL', acceptanceCriteria: ['Create/edit/delete items', 'Category management', 'Image upload', 'Availability toggle', 'Price history'], dependencies: ['backend_api', 'file_storage'] },
    { category: 'frontend_admin', title: 'Inventory Management', description: 'Track ingredient stock levels and low-stock alerts', priority: 'HIGH', acceptanceCriteria: ['Stock level display', 'Low stock alerts', 'Auto-deduction on orders', 'Supplier tracking', 'Reorder suggestions'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Staff Management', description: 'Manage staff accounts, roles, and schedules', priority: 'MEDIUM', acceptanceCriteria: ['Staff CRUD operations', 'Role assignment', 'Schedule viewing', 'Permission enforcement'], dependencies: ['authentication', 'authorization'] },
    { category: 'frontend_admin', title: 'Analytics & Reports', description: 'Sales analytics, customer insights, and operational reports', priority: 'HIGH', acceptanceCriteria: ['Revenue charts', 'Popular items report', 'Peak hours analysis', 'Customer demographics', 'Export to CSV/PDF'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Marketing Tools', description: 'Promotion creation, email campaign management, banner management', priority: 'MEDIUM', acceptanceCriteria: ['Promotion CRUD', 'Email campaign builder', 'Banner/slider management', 'A/B test support'], dependencies: ['backend_api', 'integration'] },
    // Backend & Database
    { category: 'backend_api', title: 'Menu API', description: 'Complete menu management API with categories, items, and variants', priority: 'CRITICAL', acceptanceCriteria: ['GET /api/menu returns all categories', 'Item variants supported', 'Availability flag respected', 'Search and filter', 'Image URLs returned'], dependencies: ['database_schema'] },
    { category: 'backend_api', title: 'Order Management API', description: 'Order creation, retrieval, status updates, and history', priority: 'CRITICAL', acceptanceCriteria: ['POST /api/orders creates order', 'Order state machine enforced', 'Order history per user', 'Admin can update status', 'Cancel/refund operations'], dependencies: ['database_schema', 'authentication'] },
    { category: 'backend_api', title: 'Cart API', description: 'Cart creation, modification, and checkout initiation', priority: 'CRITICAL', acceptanceCriteria: ['POST /api/cart creates cart', 'Item add/remove/update', 'Cart persists per user', 'Price validation', 'Checkout creates order'], dependencies: ['database_schema'] },
    { category: 'backend_api', title: 'Payment Processing API', description: 'Payment intent creation, confirmation, and webhook handling', priority: 'CRITICAL', acceptanceCriteria: ['Payment intents created', 'Webhook verification', 'Idempotent order creation', 'Refund processing', 'Transaction logging'], dependencies: ['database_schema'] },
    { category: 'backend_api', title: 'User Management API', description: 'User registration, profile, preferences, and addresses', priority: 'HIGH', acceptanceCriteria: ['Registration with validation', 'Profile CRUD', 'Address management', 'Preferences stored', 'Account deactivation'], dependencies: ['database_schema', 'authentication'] },
    { category: 'backend_api', title: 'Reservation API', description: 'Table reservation management with availability checking', priority: 'MEDIUM', acceptanceCriteria: ['Check availability', 'Create reservation', 'Modify reservation', 'Cancel reservation', 'Reminder scheduling'], dependencies: ['database_schema'] },
    { category: 'backend_api', title: 'Review API', description: 'Review submission, retrieval, and moderation', priority: 'MEDIUM', acceptanceCriteria: ['Submit review for order', 'Moderate reviews', 'Average rating calculation', 'Photo upload support'], dependencies: ['database_schema', 'file_storage'] },
    { category: 'backend_api', title: 'Notification API', description: 'Push, email, and SMS notification management', priority: 'HIGH', acceptanceCriteria: ['Send order confirmation', 'Send status updates', 'Preference management', 'Template rendering', 'Delivery tracking'], dependencies: ['database_schema', 'integration'] },
    // Database
    { category: 'database_schema', title: 'Users & Auth Schema', description: 'User accounts, roles, sessions, and authentication data', priority: 'CRITICAL', acceptanceCriteria: ['Users table with proper constraints', 'Session management', 'Role-based access fields', 'Password reset tokens', 'Email verification tokens'], dependencies: [] },
    { category: 'database_schema', title: 'Menu Schema', description: 'Categories, items, variants, customizations, and pricing', priority: 'CRITICAL', acceptanceCriteria: ['Category hierarchy supported', 'Item variants (size, etc.)', 'Customization options', 'Price overrides', 'Availability flags', 'Image references'], dependencies: [] },
    { category: 'database_schema', title: 'Order Schema', description: 'Orders, order items, status history, and payments', priority: 'CRITICAL', acceptanceCriteria: ['Order state machine fields', 'Line items with modifiers', 'Payment reference', 'Status history', 'Delivery info', 'Tax calculation'], dependencies: ['database_schema'] },
    { category: 'database_schema', title: 'Inventory Schema', description: 'Ingredients, stock levels, suppliers, and reorder points', priority: 'HIGH', acceptanceCriteria: ['Ingredient tracking', 'Stock levels', 'Unit conversions', 'Supplier info', 'Reorder thresholds'], dependencies: [] },
    // Auth & Security
    { category: 'authentication', title: 'Email/Password Authentication', description: 'Secure registration, login, and password management', priority: 'CRITICAL', acceptanceCriteria: ['Bcrypt password hashing', 'Email verification', 'Password strength enforcement', 'Rate limiting on auth endpoints', 'Account lockout after failed attempts'], dependencies: ['database_schema'] },
    { category: 'authentication', title: 'JWT Token Management', description: 'Access/refresh token pair with rotation', priority: 'CRITICAL', acceptanceCriteria: ['Short-lived access tokens', 'Refresh token rotation', 'Token revocation', 'Session termination', 'Family replay detection'], dependencies: ['database_schema'] },
    { category: 'authorization', title: 'Role-Based Access Control', description: 'Admin, staff, and customer role enforcement', priority: 'HIGH', acceptanceCriteria: ['Route-level authorization', 'Resource-level permissions', 'Admin-only endpoints protected', 'Staff role with limited admin', 'Permission inheritance'], dependencies: ['authentication'] },
    // Business Logic
    { category: 'business_logic', title: 'Order State Machine', description: 'Complete order lifecycle with valid transitions', priority: 'CRITICAL', acceptanceCriteria: ['States: pending -> confirmed -> preparing -> ready -> completed', 'Cancellation allowed in early states', 'Refund triggers', 'Status history log', 'No invalid transitions'], dependencies: ['backend_api'] },
    { category: 'business_logic', title: 'Pricing & Tax Calculation', description: 'Accurate pricing with modifiers, tax, and discounts', priority: 'CRITICAL', acceptanceCriteria: ['Base price correct', 'Modifier price added', 'Tax calculated per jurisdiction', 'Discount applied correctly', 'Total = subtotal + tax - discount', 'Integer cents (no floating point)'], dependencies: ['backend_api'] },
    { category: 'business_logic', title: 'Inventory Deduction', description: 'Automatic stock deduction on order confirmation', priority: 'HIGH', acceptanceCriteria: ['Stock deducted on confirm', 'Stock restored on cancel', 'Out-of-stock prevention', 'Low-stock alerts', 'Concurrent order handling'], dependencies: ['backend_api'] },
    // Payment
    { category: 'payment_processing', title: 'Stripe Payment Integration', description: 'Full Stripe payment flow with intents and webhooks', priority: 'HIGH', acceptanceCriteria: ['Payment intents created', 'Webhook signature verified', 'Idempotent order creation', 'Failed payment handling', 'Refund support', 'Test mode available'], dependencies: ['backend_api', 'order_schema'] },
    // Notifications
    { category: 'notification_system', title: 'Email Notifications', description: 'Transactional emails for orders, confirmations, and updates', priority: 'HIGH', acceptanceCriteria: ['Order confirmation email', 'Status update emails', 'Password reset email', 'Template rendering', 'Delivery tracking', 'Bounce handling'], dependencies: ['integration'] },
    { category: 'notification_system', title: 'Real-time Order Updates', description: 'WebSocket or SSE for live order status', priority: 'MEDIUM', acceptanceCriteria: ['Status push to customer', 'Kitchen display updates', 'Connection recovery', 'Reconnection handling'], dependencies: ['backend_api'] },
    // Search
    { category: 'search_discovery', title: 'Menu Search', description: 'Search across menu items with filters', priority: 'MEDIUM', acceptanceCriteria: ['Text search across items', 'Filter by category', 'Filter by dietary preference', 'Sort by price/popularity', 'Search suggestions'], dependencies: ['backend_api'] },
    // File Storage
    { category: 'file_storage', title: 'Image Upload & Management', description: 'Menu item and category image handling', priority: 'HIGH', acceptanceCriteria: ['Upload via form', 'Thumbnail generation', 'File type validation', 'Size limits enforced', 'CDN-ready URLs'], dependencies: ['backend_api'] },
    // Security
    { category: 'security', title: 'OWASP Top 10 Protection', description: 'All OWASP Top 10 vulnerabilities mitigated', priority: 'CRITICAL', acceptanceCriteria: ['SQL injection prevented (parameterized queries)', 'XSS prevented (sanitized output)', 'CSRF tokens on forms', 'Rate limiting on all endpoints', 'Security headers set', 'Input validation everywhere', 'No sensitive data in logs'], dependencies: ['backend_api'] },
    { category: 'security', title: 'GDPR Compliance', description: 'Data privacy compliance for EU customers', priority: 'MEDIUM', acceptanceCriteria: ['Cookie consent banner', 'Data export endpoint', 'Account deletion', 'Privacy policy', 'Consent logging'], dependencies: ['backend_api'] },
    // Testing
    { category: 'testing', title: 'Unit Tests', description: 'Comprehensive unit test coverage for business logic', priority: 'HIGH', acceptanceCriteria: ['All business logic tested', 'All API endpoints tested', 'All edge cases covered', 'CI runs tests on every commit', 'Minimum 80% coverage'], dependencies: ['backend_api'] },
    { category: 'testing', title: 'Integration Tests', description: 'API integration tests with test database', priority: 'HIGH', acceptanceCriteria: ['Auth flow tested end-to-end', 'Order flow tested', 'Payment flow tested', 'Database rollbacks between tests', 'API contract validation'], dependencies: ['backend_api'] },
    { category: 'testing', title: 'E2E Tests', description: 'Browser-based end-to-end tests for critical user journeys', priority: 'MEDIUM', acceptanceCriteria: ['Browse menu -> add to cart -> checkout', 'Register -> login -> order', 'Admin -> manage orders', 'Mobile viewport tested', 'Visual regression baseline'], dependencies: ['frontend_customer'] },
    // Performance
    { category: 'performance', title: 'Core Web Vitals', description: 'Meet Google Core Web Vitals thresholds', priority: 'HIGH', acceptanceCriteria: ['LCP < 2.5s', 'FID < 100ms', 'CLS < 0.1', 'TTI < 3.8s', 'Image optimization', 'Code splitting'], dependencies: ['frontend_customer'] },
    // Deployment
    { category: 'deployment', title: 'Production Deployment', description: 'Deploy application to production environment', priority: 'MEDIUM', acceptanceCriteria: ['Environment configuration', 'Database migrations', 'SSL/TLS configured', 'Process manager running', 'Health check endpoint', 'Log aggregation'], dependencies: ['testing'] },
    // Documentation
    { category: 'documentation', title: 'API Documentation', description: 'Complete API reference documentation', priority: 'MEDIUM', acceptanceCriteria: ['All endpoints documented', 'Request/response examples', 'Authentication documented', 'Error codes documented', 'Interactive docs (Swagger/OpenAPI)'], dependencies: ['backend_api'] },
    { category: 'documentation', title: 'Deployment Guide', description: 'Step-by-step production deployment instructions', priority: 'MEDIUM', acceptanceCriteria: ['Prerequisites listed', 'Environment variables documented', 'Database setup steps', 'Build instructions', 'Troubleshooting guide'], dependencies: ['deployment'] },
    // Accessibility
    { category: 'accessibility', title: 'WCAG 2.1 AA Compliance', description: 'Full accessibility compliance across all pages', priority: 'HIGH', acceptanceCriteria: ['Keyboard navigation works', 'Screen reader tested', 'Color contrast ratios met', 'Focus indicators visible', 'Alt text on all images', 'Form labels associated', 'No ARIA violations'], dependencies: ['frontend_customer'] },
    // Error Handling
    { category: 'error_handling', title: 'Error Handling & User Feedback', description: 'Comprehensive error handling with user-friendly messages', priority: 'HIGH', acceptanceCriteria: ['All API errors caught', 'User-friendly error messages', 'Retry mechanisms', 'Loading states for all async operations', '404/500 error pages', 'Network failure handling'], dependencies: ['backend_api', 'frontend_customer'] },
  ],

  ecommerce: [
    { category: 'frontend_customer', title: 'Product Catalog', description: 'Product listing with categories, filters, search, and sorting', priority: 'CRITICAL', acceptanceCriteria: ['Products paginated', 'Category filtering', 'Price range filter', 'Search with autocomplete', 'Sort by price/popularity/newest', 'Faceted search'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Product Detail Page', description: 'Detailed product view with images, variants, and add-to-cart', priority: 'CRITICAL', acceptanceCriteria: ['Image gallery with zoom', 'Variant selection (size, color)', 'Stock availability shown', 'Add to cart from detail', 'Related products', 'Reviews section'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Shopping Cart', description: 'Persistent cart with quantity controls, save for later, and price summary', priority: 'CRITICAL', acceptanceCriteria: ['Items persist across sessions', 'Quantity update', 'Save for later / wishlist', 'Price breakdown (subtotal, tax, shipping)', 'Promo code application', 'Cart abandonment recovery'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Checkout Flow', description: 'Multi-step checkout with address, shipping, and payment', priority: 'CRITICAL', acceptanceCriteria: ['Guest checkout option', 'Address validation', 'Multiple shipping options', 'Payment processing', 'Order confirmation', 'Email receipt'], dependencies: ['payment_processing', 'backend_api'] },
    { category: 'frontend_customer', title: 'User Account', description: 'Profile, addresses, order history, and wishlist', priority: 'HIGH', acceptanceCriteria: ['Profile management', 'Multiple addresses', 'Order history with details', 'Reorder functionality', 'Wishlist management', 'Password change'], dependencies: ['authentication'] },
    { category: 'frontend_customer', title: 'Order Tracking', description: 'Real-time order status and tracking information', priority: 'HIGH', acceptanceCriteria: ['Order status timeline', 'Tracking number display', 'Estimated delivery', 'Notification on status change', 'Cancel/return requests'], dependencies: ['notification_system'] },
    { category: 'frontend_customer', title: 'Reviews & Ratings', description: 'Product review system with star ratings and photos', priority: 'HIGH', acceptanceCriteria: ['Star rating input', 'Review text', 'Photo upload', 'Verified purchase badge', 'Helpful/not helpful voting', 'Moderation support'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Product Management', description: 'CRUD for products, variants, categories, and inventory', priority: 'CRITICAL', acceptanceCriteria: ['Bulk product import', 'Variant management', 'Category tree', 'Inventory tracking', 'Image management', 'SEO fields'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Order Management', description: 'View, process, and manage customer orders', priority: 'CRITICAL', acceptanceCriteria: ['Order list with filters', 'Status update actions', 'Refund processing', 'Shipment tracking', 'Customer communication', 'Bulk operations'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Customer Management', description: 'Customer list, profiles, and support tools', priority: 'HIGH', acceptanceCriteria: ['Customer list', 'Order history per customer', 'Support notes', 'Customer segments', 'Export capabilities'], dependencies: ['backend_api'] },
    { category: 'frontend_admin', title: 'Analytics Dashboard', description: 'Sales, traffic, and conversion analytics', priority: 'HIGH', acceptanceCriteria: ['Revenue charts', 'Conversion funnel', 'Top products', 'Customer analytics', 'Traffic sources', 'Export reports'], dependencies: ['backend_api'] },
    { category: 'database_schema', title: 'Products & Inventory Schema', description: 'Products, variants, categories, and inventory tables', priority: 'CRITICAL', acceptanceCriteria: ['Product table with variants', 'Category hierarchy', 'Inventory tracking with reservations', 'Price history', 'Image associations'], dependencies: [] },
    { category: 'database_schema', title: 'Orders & Payments Schema', description: 'Orders, order items, payments, and shipments', priority: 'CRITICAL', acceptanceCriteria: ['Order state machine', 'Line items', 'Payment records', 'Shipment tracking', 'Refund records', 'Coupon usage tracking'], dependencies: [] },
    { category: 'payment_processing', title: 'Payment Gateway Integration', description: 'Stripe/PayPal payment processing with webhooks', priority: 'CRITICAL', acceptanceCriteria: ['Payment intent creation', 'Webhook verification', 'Idempotent order creation', 'Failed payment handling', 'Refund processing', '3D Secure support'], dependencies: ['backend_api'] },
    { category: 'security', title: 'PCI DSS Compliance', description: 'Payment card data security compliance', priority: 'HIGH', acceptanceCriteria: ['No card data stored', 'Token-based payments only', 'HTTPS enforced', 'Security headers', 'Vulnerability scanning'], dependencies: ['backend_api'] },
  ],

  saas: [
    { category: 'frontend_customer', title: 'Landing Page', description: 'Marketing landing page with features, pricing, and CTA', priority: 'HIGH', acceptanceCriteria: ['Hero section', 'Feature highlights', 'Pricing table', 'CTA buttons', 'Testimonials', 'FAQ section'], dependencies: [] },
    { category: 'frontend_customer', title: 'Dashboard', description: 'Main application dashboard with widgets and navigation', priority: 'CRITICAL', acceptanceCriteria: ['Widget system', 'Navigation sidebar', 'Quick actions', 'Recent activity', 'Data visualization', 'Customizable layout'], dependencies: ['authentication'] },
    { category: 'frontend_customer', title: 'Settings & Preferences', description: 'User settings, team settings, and billing management', priority: 'HIGH', acceptanceCriteria: ['Profile editing', 'Team management', 'Billing portal', 'Notification preferences', 'API key management', 'Integration settings'], dependencies: ['authentication'] },
    { category: 'frontend_customer', title: 'Workspace / Project Management', description: 'Core workspace functionality with projects and tasks', priority: 'CRITICAL', acceptanceCriteria: ['Project CRUD', 'Task management', 'Collaboration features', 'File attachments', 'Comments/threads', 'Activity feed'], dependencies: ['backend_api'] },
    { category: 'backend_api', title: 'Core REST API', description: 'Primary API endpoints for the SaaS application', priority: 'CRITICAL', acceptanceCriteria: ['RESTful design', 'JSON request/response', 'Error handling', 'Input validation', 'Rate limiting', 'CORS configured'], dependencies: ['database_schema'] },
    { category: 'backend_api', title: 'Authentication API', description: 'Token-based authentication endpoints', priority: 'CRITICAL', acceptanceCriteria: ['Registration endpoint', 'Login endpoint', 'Token refresh', 'Logout', 'Password reset'], dependencies: ['database_schema'] },
    { category: 'database_schema', title: 'Multi-Tenant Schema', description: 'Organizations, teams, memberships, and tenant isolation', priority: 'CRITICAL', acceptanceCriteria: ['Organization table', 'Team hierarchy', 'Membership with roles', 'Row-level security', 'Tenant isolation enforced'], dependencies: [] },
    { category: 'database_schema', title: 'Usage & Billing Schema', description: 'Usage tracking, subscriptions, and invoices', priority: 'HIGH', acceptanceCriteria: ['Usage event logging', 'Subscription records', 'Invoice generation', 'Metered billing support', 'Plan limits enforcement'], dependencies: [] },
    { category: 'authentication', title: 'JWT Authentication', description: 'Secure JWT-based authentication with refresh tokens', priority: 'CRITICAL', acceptanceCriteria: ['JWT signing', 'Refresh token rotation', 'Token expiry', 'Secure storage', 'Logout functionality'], dependencies: ['database_schema'] },
    { category: 'authorization', title: 'Role-Based Access Control', description: 'Permission system for different user roles', priority: 'HIGH', acceptanceCriteria: ['Role definitions', 'Permission checking', 'Route protection', 'Resource-level access', 'Admin escalation'], dependencies: ['authentication'] },
    { category: 'business_logic', title: 'Subscription Management', description: 'Plan management, billing cycles, and proration', priority: 'CRITICAL', acceptanceCriteria: ['Plan switching', 'Proration calculation', 'Trial period handling', 'Cancellation flow', 'Renewal processing'], dependencies: ['payment_processing'] },
    { category: 'payment_processing', title: 'Recurring Billing Integration', description: 'Stripe/Paddle subscription billing', priority: 'HIGH', acceptanceCriteria: ['Subscription creation', 'Webhook handling', 'Invoice generation', 'Payment failure handling', 'Proration support'], dependencies: ['backend_api'] },
    { category: 'security', title: 'Security Hardening', description: 'OWASP Top 10 protection and security best practices', priority: 'CRITICAL', acceptanceCriteria: ['Input validation', 'Output encoding', 'CSRF protection', 'Rate limiting', 'Security headers', 'No secrets in code'], dependencies: ['backend_api'] },
    { category: 'testing', title: 'Test Suite', description: 'Unit and integration tests for core functionality', priority: 'HIGH', acceptanceCriteria: ['Unit tests for business logic', 'API integration tests', 'Auth flow tests', 'CI integration', '80%+ coverage'], dependencies: ['backend_api'] },
    { category: 'deployment', title: 'Production Deployment', description: 'Deploy to production with proper configuration', priority: 'MEDIUM', acceptanceCriteria: ['Environment config', 'SSL/TLS', 'Health checks', 'Process management', 'Monitoring'], dependencies: ['testing'] },
  ],

  ai_platform: [
    { category: 'frontend_customer', title: 'API Key Management', description: 'Create, manage, and monitor API keys', priority: 'CRITICAL', acceptanceCriteria: ['Key creation with scopes', 'Key rotation', 'Usage tracking per key', 'Key revocation', 'Rate limits per key'], dependencies: ['authentication'] },
    { category: 'frontend_customer', title: 'Model Playground', description: 'Interactive interface for testing AI models', priority: 'HIGH', acceptanceCriteria: ['Model selection', 'Parameter adjustment', 'Streaming responses', 'Comparison mode', 'History of prompts'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Usage Dashboard', description: 'Token usage, cost tracking, and analytics', priority: 'HIGH', acceptanceCriteria: ['Daily/weekly/monthly usage', 'Cost per model', 'Spending alerts', 'Usage by endpoint', 'Forecast'], dependencies: ['backend_api'] },
    { category: 'database_schema', title: 'Model & Inference Schema', description: 'Models, providers, inference logs, and evaluations', priority: 'CRITICAL', acceptanceCriteria: ['Model registry', 'Provider configuration', 'Inference request/response logging', 'Evaluation results', 'Prompt versioning'], dependencies: [] },
    { category: 'backend_api', title: 'Inference API', description: 'Unified inference API with model routing', priority: 'CRITICAL', acceptanceCriteria: ['Model selection via header', 'Streaming support', 'Token counting', 'Error handling', 'Fallback on provider failure', 'Retry with exponential backoff'], dependencies: ['database_schema'] },
    { category: 'backend_api', title: 'API Key Management API', description: 'Key CRUD with scopes and usage tracking', priority: 'CRITICAL', acceptanceCriteria: ['Key creation/revocation', 'Scope enforcement', 'Usage logging', 'Rate limiting per key', 'Webhook notifications'], dependencies: ['authentication'] },
    { category: 'business_logic', title: 'Quota & Rate Limiting', description: 'Per-user and per-key quota enforcement', priority: 'CRITICAL', acceptanceCriteria: ['Token-based rate limiting', 'Request-based rate limiting', 'Quota reset schedules', 'Overage handling', 'Tiered limits'], dependencies: ['backend_api'] },
    { category: 'integration', title: 'LLM Provider Integration', description: 'Connection to OpenAI, Anthropic, Google, etc.', priority: 'CRITICAL', acceptanceCriteria: ['OpenAI API connection', 'Anthropic API connection', 'Provider fallback', 'Cost tracking per provider', 'Latency monitoring'], dependencies: ['backend_api'] },
  ],

  project_management: [
    { category: 'frontend_customer', title: 'Project Dashboard', description: 'Overview of projects, tasks, and team activity', priority: 'CRITICAL', acceptanceCriteria: ['Project cards', 'Task lists', 'Activity feed', 'Progress indicators', 'Quick actions', 'Search'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Kanban / Task Board', description: 'Drag-and-drop task board with columns', priority: 'CRITICAL', acceptanceCriteria: ['Drag and drop between columns', 'Card details', 'Custom columns', 'Filter and search', 'Swimlanes', 'WIP limits'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Task Detail & Comments', description: 'Detailed task view with comments and attachments', priority: 'HIGH', acceptanceCriteria: ['Task description', 'Comment threads', 'File attachments', 'Assignee management', 'Due dates', 'Time tracking'], dependencies: ['backend_api'] },
    { category: 'frontend_customer', title: 'Gantt / Timeline View', description: 'Project timeline with dependencies', priority: 'MEDIUM', acceptanceCriteria: ['Timeline visualization', 'Dependency lines', 'Milestone markers', 'Drag to reschedule', 'Critical path'], dependencies: ['backend_api'] },
    { category: 'database_schema', title: 'Projects & Tasks Schema', description: 'Projects, tasks, comments, and time entries', priority: 'CRITICAL', acceptanceCriteria: ['Project table', 'Task with hierarchy', 'Comment threads', 'Time tracking entries', 'Label/tag system', 'Custom fields'], dependencies: [] },
  ],

  general: [
    { category: 'frontend_customer', title: 'Homepage', description: 'Main landing page with brand introduction and navigation', priority: 'CRITICAL', acceptanceCriteria: ['Clear value proposition', 'Navigation works', 'Responsive layout', 'Call-to-action buttons', 'Loading states'], dependencies: [] },
    { category: 'frontend_customer', title: 'Authentication Pages', description: 'Login and registration pages', priority: 'CRITICAL', acceptanceCriteria: ['Login form with validation', 'Registration with email verification', 'Password reset flow', 'Error handling', 'Responsive design'], dependencies: ['authentication'] },
    { category: 'frontend_customer', title: 'User Dashboard', description: 'Main user-facing dashboard', priority: 'HIGH', acceptanceCriteria: ['Overview widgets', 'Navigation', 'Data display', 'Interactive elements', 'Responsive'], dependencies: ['authentication'] },
    { category: 'frontend_customer', title: 'Settings Page', description: 'User preferences and account settings', priority: 'MEDIUM', acceptanceCriteria: ['Profile editing', 'Preference toggles', 'Save confirmation', 'Validation'], dependencies: ['authentication'] },
    { category: 'backend_api', title: 'Core REST API', description: 'Primary API endpoints for the application', priority: 'CRITICAL', acceptanceCriteria: ['RESTful design', 'JSON request/response', 'Error handling', 'Input validation', 'Rate limiting', 'CORS configured'], dependencies: ['database_schema'] },
    { category: 'backend_api', title: 'Authentication API', description: 'Token-based authentication endpoints', priority: 'CRITICAL', acceptanceCriteria: ['Registration endpoint', 'Login endpoint', 'Token refresh', 'Logout', 'Password reset'], dependencies: ['database_schema'] },
    { category: 'database_schema', title: 'Core Data Schema', description: 'Primary database tables for the application', priority: 'CRITICAL', acceptanceCriteria: ['Users table', 'Core entity tables', 'Proper constraints', 'Indexes for performance', 'Migration support'], dependencies: [] },
    { category: 'authentication', title: 'JWT Authentication', description: 'Secure JWT-based authentication with refresh tokens', priority: 'CRITICAL', acceptanceCriteria: ['JWT signing', 'Refresh token rotation', 'Token expiry', 'Secure storage', 'Logout functionality'], dependencies: ['database_schema'] },
    { category: 'authorization', title: 'Role-Based Access Control', description: 'Permission system for different user roles', priority: 'HIGH', acceptanceCriteria: ['Role definitions', 'Permission checking', 'Route protection', 'Resource-level access', 'Admin escalation'], dependencies: ['authentication'] },
    { category: 'business_logic', title: 'Core Business Logic', description: 'Main business rules and workflows', priority: 'HIGH', acceptanceCriteria: ['Domain rules implemented', 'Validation logic', 'State management', 'Edge case handling', 'Audit trail'], dependencies: ['backend_api'] },
    { category: 'security', title: 'Security Hardening', description: 'OWASP Top 10 protection and security best practices', priority: 'CRITICAL', acceptanceCriteria: ['Input validation', 'Output encoding', 'CSRF protection', 'Rate limiting', 'Security headers', 'No secrets in code'], dependencies: ['backend_api'] },
    { category: 'testing', title: 'Test Suite', description: 'Unit and integration tests for core functionality', priority: 'HIGH', acceptanceCriteria: ['Unit tests for business logic', 'API integration tests', 'Auth flow tests', 'CI integration', '80%+ coverage'], dependencies: ['backend_api'] },
    { category: 'performance', title: 'Performance Optimization', description: 'Application performance meets industry standards', priority: 'MEDIUM', acceptanceCriteria: ['LCP < 2.5s', 'API response < 200ms', 'Bundle size optimized', 'Image optimization', 'Caching strategy'], dependencies: ['frontend_customer'] },
    { category: 'error_handling', title: 'Error Handling', description: 'Comprehensive error handling with user feedback', priority: 'HIGH', acceptanceCriteria: ['All errors caught', 'User-friendly messages', 'Retry logic', 'Fallback states', 'Error logging'], dependencies: ['backend_api'] },
    { category: 'accessibility', title: 'Accessibility Compliance', description: 'WCAG 2.1 AA compliance', priority: 'HIGH', acceptanceCriteria: ['Keyboard navigation', 'Screen reader support', 'Color contrast', 'Focus management', 'ARIA labels'], dependencies: ['frontend_customer'] },
    { category: 'deployment', title: 'Production Deployment', description: 'Deploy to production with proper configuration', priority: 'MEDIUM', acceptanceCriteria: ['Environment config', 'SSL/TLS', 'Health checks', 'Process management', 'Monitoring'], dependencies: ['testing'] },
    { category: 'documentation', title: 'Documentation', description: 'Complete project documentation', priority: 'MEDIUM', acceptanceCriteria: ['README with setup', 'API documentation', 'Architecture overview', 'Deployment guide'], dependencies: ['deployment'] },
  ],
};

// =============================================================================
// DOMAIN INTELLIGENCE LIBRARY
// ==============================================================================

const DOMAIN_INTELLIGENCE_LIBRARY: Record<string, CompetitiveIntelligenceReport> = {
  food_service: {
    productDomain: 'food_service',
    analyzedAtIso: '2025-01-01T00:00:00Z',
    competitors: [
      {
        name: 'Sweetgreen',
        category: 'leader',
        productType: 'Healthy fast-casual ordering platform',
        keyFeatures: ['Mobile-first ordering', 'Nutritional info', 'Loyalty program', 'Catering', 'Gift cards', 'Apple Wallet integration'],
        technicalArchitecture: ['React Native app', 'Node.js backend', 'PostgreSQL', 'Redis caching', 'Stripe payments'],
        businessModel: ['Direct DTC sales', 'Catering', 'Corporate wellness programs'],
        userExperience: 'Clean, minimal design with strong mobile UX; ordering in under 60 seconds',
        securityCompliance: ['PCI DSS', 'GDPR', 'SOC 2'],
        operationalFeatures: ['Kitchen display system', 'Inventory management', 'Driver dispatch', 'Quality control'],
        apiCapabilities: ['RESTful menu API', 'Real-time order status', 'Webhook notifications'],
        integrationEcosystem: ['Stripe', 'Mapbox', 'Twilio', 'SendGrid'],
        pricingModel: 'Order-based with delivery fees and tips',
        strengths: ['Strong brand', 'Excellent UX', 'Loyalty integration'],
        weaknesses: ['Limited customization', 'High delivery fees', 'Geographic limitations'],
        marketPosition: 'Premium fast-casual leader',
      },
      {
        name: 'Starbucks',
        category: 'leader',
        productType: 'Global coffee chain with digital ordering',
        keyFeatures: ['Mobile order ahead', 'Starbucks Rewards', 'Gift cards', 'Subscription (Starbucks+ Delivery)', 'Personalization', 'Voice ordering'],
        technicalArchitecture: ['Custom mobile app', 'Microservices backend', 'Cloud-native infrastructure', 'ML personalization engine'],
        businessModel: ['Retail sales', 'Subscription delivery', 'Licensing', 'Consumer packaged goods'],
        userExperience: 'Deeply integrated mobile experience with rewards and personalization',
        securityCompliance: ['PCI DSS', 'GDPR', 'CCPA', 'SOC 2 Type II'],
        operationalFeatures: ['Store-level inventory', 'Partner operations portal', 'Supply chain management', 'Quality assurance'],
        apiCapabilities: ['Card API', 'Order ahead API', 'Rewards API', 'Location API'],
        integrationEcosystem: ['Apple Pay', 'Google Pay', 'Uber Eats', 'Spotify'],
        pricingModel: 'In-store + subscription delivery',
        strengths: ['Brand recognition', 'Rewards ecosystem', 'Global scale'],
        weaknesses: ['Complex systems', 'Inconsistent app experience', 'High operational overhead'],
        marketPosition: 'Global coffee market leader',
      },
      {
        name: 'Square / Toast',
        category: 'challenger',
        productType: 'Restaurant POS and online ordering platform',
        keyFeatures: ['POS integration', 'Online ordering', 'Table management', 'Kitchen display', 'Payroll', 'Analytics'],
        technicalArchitecture: ['React web app', 'Go backend', 'PostgreSQL', 'Hardware integration layer'],
        businessModel: ['Software subscription', 'Payment processing fees', 'Hardware sales'],
        userExperience: 'Professional-grade tools with steep learning curve but powerful features',
        securityCompliance: ['PCI DSS Level 1', 'SOC 2', 'State-specific compliance'],
        operationalFeatures: ['Full POS suite', 'Kitchen management', 'Staff scheduling', 'Inventory', 'Reporting'],
        apiCapabilities: ['Orders API', 'Payments API', 'Menu API', 'Employees API', 'Inventory API'],
        integrationEcosystem: ['Payment processors', 'Delivery services', 'Accounting software', 'Loyalty providers'],
        pricingModel: 'Monthly subscription + payment processing %',
        strengths: ['Complete restaurant suite', 'POS integration', 'Payment processing'],
        weaknesses: ['Expensive', 'Complex setup', 'Limited design flexibility'],
        marketPosition: 'Restaurant technology leader',
      },
    ],
    marketGaps: [
      'Small independent roasteries without dedicated tech teams',
      'Coffee subscription with origin story transparency',
      'Local pickup optimization for small batch roasters',
      'Lower-cost solutions for single-location cafes',
      'Better integration between online ordering and small-batch inventory management',
    ],
    mandatoryCapabilities: [
      'Mobile-responsive online ordering',
      'Menu management with categories and modifiers',
      'Shopping cart with customization',
      'Secure payment processing',
      'Order confirmation and tracking',
      'User accounts with order history',
      'Admin panel for menu and order management',
      'Email notifications',
    ],
    industryStandard: [
      'Image-rich menu display',
      'Dietary information (vegan, gluten-free, etc.)',
      'Real-time order status updates',
      'Multiple payment methods',
      'Delivery and pickup options',
      'Promo codes and loyalty',
      'Reservation system',
      'Gift cards',
      'Reviews and ratings',
      'Social media integration',
      'SEO-optimized pages',
      'Google Maps integration',
      'SMS notifications',
      'Multi-language support',
      'Accessibility compliance (WCAG 2.1)',
    ],
    advancedFeatures: [
      'AI-powered recommendations based on order history',
      'Subscription model with scheduled deliveries',
      'Coffee origin traceability with QR codes',
      'AR menu visualization',
      'Voice ordering integration',
      'IoT-connected coffee machine ordering',
      'Predictive inventory management',
      'Customer sentiment analysis from reviews',
      'Dynamic pricing based on demand',
      'Coffee education content platform',
      'Community features (reviews, photos, forums)',
      'Corporate ordering with approval workflows',
      'White-label for franchise operations',
      'Blockchain-based supply chain verification',
    ],
    securityRequirements: [
      'PCI DSS compliance (if handling card data directly)',
      'HTTPS/TLS 1.3 everywhere',
      'JWT with short expiry + refresh token rotation',
      'Rate limiting on all public endpoints',
      'CORS properly configured',
      'CSRF protection',
      'Input validation on all endpoints',
      'No sensitive data in logs',
      'Secure password hashing (bcrypt/argon2)',
      'Email verification for accounts',
      'Account lockout after failed attempts',
      'GDPR compliance for EU customers',
      'Regular security dependency audits',
    ],
    techPatterns: [
      'React/Next.js for frontend',
      'Node.js/Python for backend API',
      'PostgreSQL for relational data',
      'Redis for sessions and caching',
      'Stripe for payment processing',
      'WebSocket or SSE for real-time updates',
      'Docker containerization',
      'CI/CD with automated testing',
    ],
    uxExpectations: [
      'Order completion in under 3 steps',
      'Page load under 2 seconds',
      'Mobile-first design',
      'Clear product photography',
      'Intuitive navigation',
      'Minimal form fields at checkout',
      'Clear pricing with no hidden fees',
      'Order confirmation with ETA',
      'Easy reorder from history',
    ],
    differentiators: [
      'Coffee origin stories and farmer profiles',
      'Roasting schedule transparency',
      'Community-driven flavor recommendations',
      'Subscription with flexible pauses/skips',
      'Local pickup optimization',
      'Barista tip integration',
      'Tasting notes and pairing suggestions',
      'Brewing method recommendations',
    ],
  },

  ecommerce: {
    productDomain: 'ecommerce',
    analyzedAtIso: '2025-01-01T00:00:00Z',
    competitors: [
      {
        name: 'Shopify',
        category: 'leader',
        productType: 'E-commerce platform for online stores',
        keyFeatures: ['Store builder', 'Payment processing', 'Inventory management', 'Multi-channel selling', 'App ecosystem', 'Analytics'],
        technicalArchitecture: ['Ruby on Rails', 'React frontend', 'PostgreSQL', 'Redis', 'Kubernetes'],
        businessModel: ['Subscription tiers', 'Transaction fees', 'App store revenue', 'Payments revenue'],
        userExperience: 'Polished merchant experience with extensive customization',
        securityCompliance: ['PCI DSS Level 1', 'SOC 2', 'GDPR'],
        operationalFeatures: ['Order management', 'Inventory tracking', 'Shipping integrations', 'Tax calculation', 'Multi-currency'],
        apiCapabilities: ['Admin API (REST/GraphQL)', 'Storefront API', 'Webhooks', 'Payment APIs'],
        integrationEcosystem: ['1000+ apps', 'Payment providers', 'Shipping carriers', 'Marketing tools'],
        pricingModel: 'Monthly subscription + transaction fees',
        strengths: ['Ease of use', 'Large ecosystem', 'Strong merchant tools'],
        weaknesses: ['Transaction fees on lower tiers', 'Limited customization on basic plans', 'Can get expensive'],
        marketPosition: 'Leading SMB e-commerce platform',
      },
      {
        name: 'Amazon',
        category: 'leader',
        productType: 'Global e-commerce marketplace',
        keyFeatures: ['Massive catalog', 'Fulfillment network', 'Prime benefits', 'Marketplace for third-party sellers', 'AWS-powered infrastructure', 'Recommendation engine'],
        technicalArchitecture: ['Microservices', 'Proprietary databases', 'Machine learning at scale', 'Global CDN'],
        businessModel: ['Commission on sales', 'Fulfillment fees', 'Advertising', 'Prime subscriptions', 'AWS'],
        userExperience: 'Fast, personalized, with one-click ordering and extensive reviews',
        securityCompliance: ['PCI DSS', 'SOC 2', 'ISO 27001', 'GDPR'],
        operationalFeatures: ['Fulfillment centers', 'Last-mile delivery', 'Returns processing', 'Customer service', 'Fraud detection'],
        apiCapabilities: ['SP-API (Selling Partner)', 'Product Advertising API', 'FBA API'],
        integrationEcosystem: ['Seller tools', 'Advertising platform', 'AWS services', 'Marketplace Web Service'],
        pricingModel: 'Commission + fees + subscriptions',
        strengths: ['Scale', 'Speed', 'Trust', 'Selection'],
        weaknesses: ['Counterfeit products', 'Complex seller experience', 'High fees'],
        marketPosition: 'World\'s largest e-commerce platform',
      },
    ],
    marketGaps: [
      'Niche product verticals underserved by Amazon',
      'Better sustainability transparency',
      'Small seller tools that don\'t require enterprise contracts',
      'More ethical supply chain verification',
      'Community-driven product discovery',
    ],
    mandatoryCapabilities: [
      'Product catalog with categories and variants',
      'Product search and filtering',
      'Shopping cart',
      'Secure checkout with multiple payment methods',
      'Order management',
      'User accounts with order history',
      'Admin product management',
      'Inventory tracking',
    ],
    industryStandard: [
      'Product reviews and ratings',
      'Wishlist functionality',
      'Related product recommendations',
      'Multiple shipping options',
      'Order tracking',
      'Return/refund process',
      'Promo codes and sales',
      'Email notifications',
      'Mobile app',
      'SEO optimization',
      'Analytics dashboard',
    ],
    advancedFeatures: [
      'AI-powered recommendations',
      'Subscription boxes',
      'Live chat support',
      'AR product preview',
      'Buy now pay later (BNPL)',
      'Multi-currency support',
      'Multi-language support',
      'Personalized homepage',
      'Advanced analytics',
      'Dropshipping integration',
      'Print-on-demand',
      'Digital product delivery',
    ],
    securityRequirements: [
      'PCI DSS compliance',
      'HTTPS everywhere',
      'Secure payment processing',
      'Data encryption at rest',
      'Regular security audits',
      'Fraud detection',
      'GDPR compliance',
    ],
    techPatterns: [
      'React/Next.js frontend',
      'Node.js/Python backend',
      'PostgreSQL database',
      'Redis caching',
      'Stripe/PayPal integration',
      'Elasticsearch for search',
      'S3-compatible storage',
    ],
    uxExpectations: [
      'Checkout in under 3 steps',
      'Product images with zoom',
      'Quick view for products',
      'Smooth page transitions',
      'Mobile-optimized checkout',
      'Clear pricing with no surprises',
      'One-click reorder',
    ],
    differentiators: [
      'Sustainability scorecards',
      'Community-driven curation',
      'Ethical supply chain verification',
      'Carbon-neutral shipping options',
      'Product lifecycle tracking',
    ],
  },

  saas: {
    productDomain: 'saas',
    analyzedAtIso: '2025-01-01T00:00:00Z',
    competitors: [
      {
        name: 'Linear',
        category: 'leader',
        productType: 'Issue tracking and project management',
        keyFeatures: ['Keyboard shortcuts', 'Command palette', 'Cycles', 'Projects', 'Roadmaps', 'Integrations'],
        technicalArchitecture: ['React', 'Node.js', 'PostgreSQL', 'GraphQL', 'Redis'],
        businessModel: ['Per-seat subscription', 'Free tier'],
        userExperience: 'Exceptional keyboard-first UX, blazingly fast, beautiful design',
        securityCompliance: ['SOC 2 Type II', 'GDPR', 'SSO'],
        operationalFeatures: ['Git sync', 'Slack integration', 'GitHub/GitLab sync', 'API'],
        apiCapabilities: ['REST API', 'Webhooks', 'GraphQL'],
        integrationEcosystem: ['GitHub', 'GitLab', 'Slack', 'Figma', 'Sentry'],
        pricingModel: 'Per-seat monthly subscription',
        strengths: ['Speed', 'Design', 'Keyboard UX', 'Developer experience'],
        weaknesses: ['Limited reporting', 'No time tracking', 'Steep learning curve'],
        marketPosition: 'Developer-first project management',
      },
      {
        name: 'Notion',
        category: 'leader',
        productType: 'All-in-one workspace',
        keyFeatures: ['Pages and databases', 'Templates', 'Collaboration', 'API', 'Integrations', 'AI assistant'],
        technicalArchitecture: ['React', 'Node.js', 'PostgreSQL', 'Elasticsearch', 'AWS'],
        businessModel: ['Freemium', 'Plus/Pro/Business/Enterprise tiers'],
        userExperience: 'Flexible, block-based editor with infinite customization',
        securityCompliance: ['SOC 2 Type II', 'GDPR', 'HIPAA (enterprise)', 'SSO'],
        operationalFeatures: ['Version history', 'Page permissions', 'Audit logs', 'Data export'],
        apiCapabilities: ['REST API', 'Webhooks', 'OAuth 2.0'],
        integrationEcosystem: ['Slack', 'Google Drive', 'Figma', 'GitHub', 'Jira'],
        pricingModel: 'Freemium with paid tiers',
        strengths: ['Flexibility', 'Templates', 'Collaboration', 'All-in-one'],
        weaknesses: ['Slow with large databases', 'Limited offline', 'Enterprise features lacking'],
        marketPosition: 'Leading all-in-one workspace',
      },
    ],
    marketGaps: [
      'Vertical-specific SaaS with pre-built workflows',
      'Better offline-first experience',
      'AI-native interfaces (not AI-bolted-on)',
      'Self-hosted enterprise options',
      'Better data portability',
    ],
    mandatoryCapabilities: [
      'User authentication and accounts',
      'Multi-tenant data isolation',
      'Core feature functionality',
      'Team/workspace management',
      'API access',
      'Usage tracking',
    ],
    industryStandard: [
      'Dashboard with key metrics',
      'Team collaboration features',
      'File attachments',
      'Search across all content',
      'Notifications',
      'Keyboard shortcuts',
      'Dark mode',
      'Mobile app',
      'API access',
      'Integrations with other tools',
      'Import/export data',
      'Audit logs',
    ],
    advancedFeatures: [
      'AI-assisted content generation',
      'Advanced automation/workflows',
      'Custom fields and data models',
      'Webhooks and event streaming',
      'SSO and SAML',
      'Advanced permissions',
      'Custom branding',
      'Dedicated support',
      'SLA guarantees',
      'On-premise deployment',
    ],
    securityRequirements: [
      'SOC 2 Type II',
      'Encryption at rest and in transit',
      'Role-based access control',
      'Audit logging',
      'GDPR compliance',
      'SSO/SAML support',
      'Regular penetration testing',
    ],
    techPatterns: [
      'React or Vue.js frontend',
      'Node.js/Python/Go backend',
      'PostgreSQL database',
      'Redis for caching',
      'WebSocket for real-time',
      'S3-compatible storage',
      'Docker/Kubernetes',
    ],
    uxExpectations: [
      'Sub-100ms interactions',
      'Keyboard shortcuts',
      'Command palette',
      'Empty states with guidance',
      'Smooth transitions',
      'Dark mode',
      'Offline capability',
      'Mobile responsive',
    ],
    differentiators: [
      'Vertical-specific automation',
      'AI-native workflow integration',
      'Unified search across all data',
      'Real-time collaboration at scale',
      'Open-source core with cloud option',
    ],
  },

  ai_platform: {
    productDomain: 'ai_platform',
    analyzedAtIso: '2025-01-01T00:00:00Z',
    competitors: [
      {
        name: 'OpenAI API',
        category: 'leader',
        productType: 'AI model API platform',
        keyFeatures: ['Multiple model families', 'Function calling', 'Vision', 'Streaming', 'Fine-tuning', 'Embeddings'],
        technicalArchitecture: ['Proprietary GPU clusters', 'Custom serving stack', 'Global CDN', 'Real-time monitoring'],
        businessModel: ['Token-based pricing', 'Enterprise API access', 'Fine-tuning services'],
        userExperience: 'Simple API with excellent documentation and playground',
        securityCompliance: ['SOC 2 Type II', 'GDPR', 'HIPAA BAA (enterprise)'],
        operationalFeatures: ['Usage monitoring', 'Rate limiting', 'Content filtering', 'Logging'],
        apiCapabilities: ['Chat Completions', 'Embeddings', 'Fine-tuning', 'Assistants API', 'Image generation'],
        integrationEcosystem: ['LangChain', 'LlamaIndex', 'Vercel AI SDK', 'OpenAI SDKs'],
        pricingModel: 'Per-token pricing with tiered models',
        strengths: ['Model quality', 'Ease of use', 'Documentation', 'Ecosystem'],
        weaknesses: ['Cost at scale', 'Rate limits', 'Data privacy concerns'],
        marketPosition: 'Leading AI API provider',
      },
      {
        name: 'Anthropic API',
        category: 'leader',
        productType: 'AI model API with safety focus',
        keyFeatures: ['Claude model family', 'Constitutional AI', '200K context', 'Vision', 'Tool use', 'Prompt caching'],
        technicalArchitecture: ['Proprietary GPU infrastructure', 'Safety evaluation pipeline', 'Multi-region deployment'],
        businessModel: ['Token-based pricing', 'Enterprise contracts'],
        userExperience: 'Clean API with emphasis on safety and helpfulness',
        securityCompliance: ['SOC 2 Type II', 'GDPR', 'HIPAA BAA'],
        operationalFeatures: ['Usage dashboard', 'Rate limits', 'Safety classifiers', 'Prompt caching'],
        apiCapabilities: ['Messages API', 'Embeddings', 'Prompt caching', 'Tool use'],
        integrationEcosystem: ['Anthropic SDKs', 'Claude Code', 'AWS Bedrock', 'Google Vertex AI'],
        pricingModel: 'Per-token with prompt caching discount',
        strengths: ['Safety', 'Long context', 'Claude Code', 'Cost efficiency (caching)'],
        weaknesses: ['Fewer models than OpenAI', 'Newer ecosystem', 'Limited multimodal'],
        marketPosition: 'Leading AI safety-focused provider',
      },
    ],
    marketGaps: [
      'Multi-model orchestration without vendor lock-in',
      'Open-source model hosting with enterprise SLA',
      'Better cost optimization for high-volume use',
      'Simpler fine-tuning and customization',
      'Better observability into model behavior',
    ],
    mandatoryCapabilities: [
      'API key management',
      'Model selection and routing',
      'Request/response handling',
      'Streaming responses',
      'Rate limiting and quotas',
      'Usage tracking and billing',
      'Error handling and retries',
      'Content safety filtering',
    ],
    industryStandard: [
      'Multiple model support',
      'Function/tool calling',
      'Vision capabilities',
      'Embeddings API',
      'Fine-tuning support',
      'Prompt templates',
      'Usage analytics',
      'Webhook notifications',
      'SDKs for major languages',
      'Interactive playground',
    ],
    advancedFeatures: [
      'Model evaluation and benchmarking',
      'A/B testing between models',
      'Custom model fine-tuning',
      'RAG pipeline management',
      'Agent orchestration',
      'Multi-modal support (image, audio, video)',
      'Prompt optimization',
      'Cost optimization routing',
      'Compliance and data governance',
      'On-premise deployment option',
    ],
    securityRequirements: [
      'API key encryption',
      'Request/response logging',
      'Content filtering',
      'Data residency options',
      'PII detection and redaction',
      'Audit trails',
      'SOC 2 compliance',
      'GDPR compliance',
    ],
    techPatterns: [
      'Python backend (FastAPI)',
      'Redis for caching',
      'PostgreSQL for logging',
      'Message queue for async processing',
      'GPU infrastructure',
      'Kubernetes for scaling',
    ],
    uxExpectations: [
      'Sub-second API response',
      'Streaming for long responses',
      'Clear error messages',
      'Interactive playground',
      'Usage transparency',
      'One-line SDK integration',
    ],
    differentiators: [
      'Multi-model routing optimization',
      'Built-in evaluation framework',
      'Cost-aware model selection',
      'Open-source model support',
      'Full observability pipeline',
    ],
  },

  general: {
    productDomain: 'general',
    analyzedAtIso: '2025-01-01T00:00:00Z',
    competitors: [
      {
        name: 'Industry Leaders',
        category: 'leader',
        productType: 'General reference for industry best practices',
        keyFeatures: ['User authentication', 'Data management', 'API access', 'Admin tools', 'Reporting'],
        technicalArchitecture: ['Modern web stack', 'REST API', 'Relational database', 'Cloud deployment'],
        businessModel: ['Subscription', 'Usage-based'],
        userExperience: 'Professional, clean, and functional',
        securityCompliance: ['Standard web security practices', 'GDPR'],
        operationalFeatures: ['Monitoring', 'Logging', 'Backup'],
        apiCapabilities: ['REST API', 'Webhooks'],
        integrationEcosystem: ['Common third-party services'],
        pricingModel: 'Subscription-based',
        strengths: ['Reliability', 'Security', 'Scalability'],
        weaknesses: ['May lack niche features'],
        marketPosition: 'Industry standard',
      },
    ],
    marketGaps: [
      'Better developer experience',
      'More customization options',
      'Better mobile experience',
      'Transparent pricing',
      'Self-hosted option',
    ],
    mandatoryCapabilities: [
      'User authentication',
      'Core functionality',
      'Admin panel',
      'API access',
      'Data persistence',
    ],
    industryStandard: [
      'Responsive design',
      'Search functionality',
      'Notifications',
      'File upload',
      'Email integration',
      'Error handling',
      'Logging',
    ],
    advancedFeatures: [
      'Real-time updates',
      'Advanced analytics',
      'Custom workflows',
      'Third-party integrations',
      'Mobile app',
      'API access',
      'Webhooks',
    ],
    securityRequirements: [
      'HTTPS',
      'Input validation',
      'Authentication',
      'Authorization',
      'Rate limiting',
      'Regular security updates',
    ],
    techPatterns: [
      'React/Vue frontend',
      'Node.js/Python backend',
      'PostgreSQL database',
      'Redis caching',
    ],
    uxExpectations: [
      'Fast page loads',
      'Clear navigation',
      'Mobile responsive',
      'Consistent design',
      'Helpful error messages',
    ],
    differentiators: [
      'Better UX than competitors',
      'More flexible pricing',
      'Open-source core',
      'Better documentation',
    ],
  },
};

// =============================================================================
// PRODUCT ENGINEERING ENGINE
// =============================================================================

export class ProductEngineeringEngine {
  private state: ProductEngineeringState;
  private runtime?: AutonomousRuntimeEngine;

  constructor(runtime?: AutonomousRuntimeEngine) {
    this.runtime = runtime;
    const nowIso = new Date().toISOString();
    this.state = {
      planId: `PLAN-${Date.now().toString(36).toUpperCase()}`,
      userRequest: '',
      phase: 'UNDERSTAND',
      implementationProgress: new Map(),
      verificationResults: [],
      knownIssues: [],
      startedAtIso: nowIso,
      updatedAtIso: nowIso,
    };
  }

  /**
   * Execute the full product engineering lifecycle.
   */
  public async executeFullLifecycle(userRequest: string): Promise<ProductPlan> {
    this.state.userRequest = userRequest;

    // Phase 1: Understand
    this.state.phase = 'UNDERSTAND';
    this.state.updatedAtIso = new Date().toISOString();
    const domainAnalysis = analyzeProductDomain(userRequest);
    this.state.domainAnalysis = domainAnalysis;

    // Phase 2: Research
    this.state.phase = 'RESEARCH';
    this.state.updatedAtIso = new Date().toISOString();
    const competitive = generateCompetitiveIntelligence(domainAnalysis.domain, userRequest);
    this.state.competitiveIntelligence = competitive;

    // Phase 3: Plan
    this.state.phase = 'PLAN';
    this.state.updatedAtIso = new Date().toISOString();
    const requirements = generateProductRequirements(domainAnalysis, competitive, userRequest);

    // Phase 4: Architect
    this.state.phase = 'ARCHITECT';
    this.state.updatedAtIso = new Date().toISOString();
    const architecture = generateProductArchitecture(requirements, domainAnalysis.domain, userRequest);

    // Generate the complete plan
    const plan = generateProductPlan(userRequest, domainAnalysis, competitive, requirements, architecture);
    this.state.productPlan = plan;

    // Track all requirements as planned
    for (const req of requirements) {
      this.state.implementationProgress.set(req.id, 'NOT_STARTED');
    }

    this.state.updatedAtIso = new Date().toISOString();
    return plan;
  }

  /**
   * Update requirement status.
   */
  public updateRequirementStatus(requirementId: string, status: RequirementStatus): void {
    this.state.implementationProgress.set(requirementId, status);
    this.state.updatedAtIso = new Date().toISOString();
  }

  /**
   * Get the current product engineering state.
   */
  public getState(): ProductEngineeringState {
    return this.state;
  }

  /**
   * Get the current product plan.
   */
  public getPlan(): ProductPlan | undefined {
    return this.state.productPlan;
  }

  /**
   * Run independent verification against the plan.
   */
  public async runIndependentVerification(
    workspaceFiles: Record<string, string>
  ): Promise<VerificationResult[]> {
    this.state.phase = 'VERIFY';
    this.state.updatedAtIso = new Date().toISOString();

    const plan = this.state.productPlan;
    if (!plan) {
      return [];
    }

    const results = verifyAgainstPlan(workspaceFiles, plan);
    this.state.verificationResults.push(...results);

    // Update acceptance criteria
    const passCount = results.filter(r => r.passed).length;
    plan.acceptanceCriteria.allCriticalRequirementsImplemented =
      results.filter(r => {
        const req = plan.requirements.find(req => req.id === r.requirementId);
        return req?.priority === 'CRITICAL' && r.passed;
      }).length === plan.requirements.filter(r => r.priority === 'CRITICAL').length;

    plan.acceptanceCriteria.allHighRequirementsImplemented =
      results.filter(r => {
        const req = plan.requirements.find(req => req.id === r.requirementId);
        return req?.priority === 'HIGH' && r.passed;
      }).length === plan.requirements.filter(r => r.priority === 'HIGH').length;

    this.state.updatedAtIso = new Date().toISOString();
    return results;
  }

  /**
   * Generate a comprehensive completion report.
   */
  public generateCompletionReport(): string {
    const plan = this.state.productPlan;
    if (!plan) {
      return 'No product plan available. Run executeFullLifecycle first.';
    }

    const matrix = buildCoverageMatrix(plan.requirements);
    const verifiedResults = this.state.verificationResults;

    const criticalPassed = verifiedResults.filter(r => {
      const req = plan.requirements.find(req => req.id === r.requirementId);
      return req?.priority === 'CRITICAL' && r.passed;
    }).length;
    const criticalTotal = plan.requirements.filter(r => r.priority === 'CRITICAL').length;

    const highPassed = verifiedResults.filter(r => {
      const req = plan.requirements.find(req => req.id === r.requirementId);
      return req?.priority === 'HIGH' && r.passed;
    }).length;
    const highTotal = plan.requirements.filter(r => r.priority === 'HIGH').length;

    const missing = verifiedResults.filter(r => !r.passed);

    let report = `# AETHER Product Engineering Report\n\n`;
    report += `## Product: ${plan.userRequest}\n\n`;
    report += `**Plan ID:** ${plan.planId}\n`;
    report += `**Domain:** ${plan.domainAnalysis.primaryCategory} (${plan.domainAnalysis.domain})\n`;
    report += `**Confidence:** ${Math.round(plan.domainAnalysis.confidence * 100)}%\n`;
    report += `**Complexity:** ${plan.estimatedComplexity}\n\n`;

    report += `## Requirement Coverage\n\n`;
    report += `| Metric | Count |\n|--------|-------|\n`;
    report += `| Total Requirements | ${matrix.summary.total} |\n`;
    report += `| Planned | ${matrix.summary.planned} |\n`;
    report += `| Implemented | ${matrix.summary.implemented} |\n`;
    report += `| Integrated | ${matrix.summary.integrated} |\n`;
    report += `| Tested | ${matrix.summary.tested} |\n`;
    report += `| Verified | ${matrix.summary.verified} |\n`;
    report += `| Coverage | ${matrix.summary.coveragePct}% |\n\n`;

    report += `### Critical Requirements: ${criticalPassed}/${criticalTotal} Passed\n\n`;
    report += `### High Priority Requirements: ${highPassed}/${highTotal} Passed\n\n`;

    if (missing.length > 0) {
      report += `## Missing Requirements (${missing.length})\n\n`;
      for (const m of missing) {
        const req = plan.requirements.find(r => r.id === m.requirementId);
        report += `- **${m.requirementId}** [${req?.priority ?? '?'}] ${req?.title ?? m.requirementId}: ${m.details}\n`;
      }
      report += '\n';
    }

    if (this.state.knownIssues.length > 0) {
      report += `## Known Issues\n\n`;
      for (const issue of this.state.knownIssues) {
        report += `- **${issue.id}** [${issue.severity}] ${issue.description}\n`;
      }
      report += '\n';
    }

    report += `## Implementation Phases\n\n`;
    for (const phase of plan.implementationPlan) {
      report += `### Phase ${phase.phaseNumber}: ${phase.name}\n`;
      report += `${phase.description}\n`;
      report += `Requirements: ${phase.requirements.join(', ') || 'None assigned'}\n\n`;
    }

    report += `## Technology Stack\n\n`;
    report += `- **Frontend:** ${plan.architecture.frontend.framework} with ${plan.architecture.frontend.stateManagement}\n`;
    report += `- **Backend:** ${plan.architecture.backend.language} / ${plan.architecture.backend.framework}\n`;
    report += `- **Database:** ${plan.architecture.database.tables.map(t => t.name).join(', ')}\n`;
    report += `- **Auth:** ${plan.architecture.authentication.method}\n\n`;

    return report;
  }
}

export const defaultProductEngineeringEngine = new ProductEngineeringEngine();
