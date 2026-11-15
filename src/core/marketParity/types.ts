/**
 * AETHER Market-Parity Engine — Core Type Definitions
 *
 * Every prompt is expanded to a COMPLETE production specification
 * achieving 1:1 functional parity with global market leaders.
 */

// ─── Industry types ────────────────────────────────────────────────────

export type Industry =
  | 'ecommerce' | 'food-beverage' | 'coffee-shop' | 'restaurant'
  | 'healthcare' | 'ai-platform' | 'booking' | 'fintech'
  | 'education' | 'entertainment' | 'logistics' | 'hospitality'
  | 'real-estate' | 'automotive' | 'gaming' | 'social'
  | 'saas' | 'productivity' | 'enterprise';

export type CompetitorTier = 'big' | 'popular' | 'micro';

export interface CompetitorFeature {
  name: string;
  competitor: string;
  tier: CompetitorTier;
  implementation: string;
}

// ─── Pillar types ──────────────────────────────────────────────────────

export interface PillarSpec {
  id: number;
  name: string;
  description: string;
  requirements: string[];
  testCases: string[];
  components?: string[];
  tables?: string[];
  apiEndpoints?: string[];
  e2eTests?: string[];
  frontendComponents?: string[];
}

export interface PillarRequirement {
  pillarId: number;
  pillarName: string;
  features: string[];
  implementation: string;
}

// ─── Expanded spec types ───────────────────────────────────────────────

export interface ExpandedSpec {
  originalPrompt: string;
  industry: Industry;
  industryName: string;
  competitors: string[];
  pillars: PillarRequirement[];
  competitorFeatures: CompetitorFeature[];
  databaseSchema: CompleteSchema;
  apiEndpoints: ApiEndpoint[];
  frontendComponents: FrontendComponent[];
  testSuite: TestSpec[];
  securityRequirements: SecurityRequirement[];
  estimatedLinesOfCode: number;
  estimatedComplexity: number;
}

// ─── Database schema types ─────────────────────────────────────────────

export interface CompleteSchema {
  tables: TableDef[];
  indexes: IndexDef[];
  constraints: ConstraintDef[];
  triggers: TriggerDef[];
  migrations: MigrationStep[];
}

export interface TableDef {
  name: string;
  description: string;
  columns: ColumnDef[];
}

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  constraints: string[];
  description: string;
}

export interface IndexDef {
  table: string;
  columns: string[];
  unique: boolean;
  name: string;
  description: string;
}

export interface ConstraintDef {
  name: string;
  type: 'FK' | 'PK' | 'UNIQUE' | 'CHECK' | 'EXCLUSION';
  table: string;
  definition: string;
  description: string;
}

export interface TriggerDef {
  name: string;
  table: string;
  timing: 'BEFORE' | 'AFTER' | 'INSTEAD OF';
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  function: string;
  description: string;
}

export interface MigrationStep {
  version: string;
  description: string;
  up: string[];
  down: string[];
}

// ─── API endpoint types ────────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
  description: string;
  requestSchema?: Record<string, unknown>;
  responseSchema: Record<string, unknown>;
  authRequired: boolean;
  rateLimit?: { requests: number; window: string };
}

// ─── Frontend component types ──────────────────────────────────────────

export type ComponentType = 'page' | 'component' | 'layout' | 'feature';

export interface FrontendComponent {
  name: string;
  type: ComponentType;
  description: string;
  dependencies: string[];
  features: string[];
}

// ─── Test spec types ───────────────────────────────────────────────────

export type TestCategory = 'unit' | 'integration' | 'e2e';

export interface TestSpec {
  id: string;
  category: TestCategory;
  description: string;
  steps: string[];
  expectedResult: string;
}

// ─── Security requirement types ────────────────────────────────────────

export interface SecurityRequirement {
  id: string;
  category: string;
  requirement: string;
  implementation: string;
  compliance: string[];
}

// ─── Schema generator helper types ────────────────────────────────────

export interface ColumnSpec {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  references?: string;
}

export interface TableSpec {
  name: string;
  columns: ColumnSpec[];
  indexes: IndexSpec[];
  triggers: TriggerSpec[];
  constraints: ConstraintSpec[];
}

export interface IndexSpec {
  name: string;
  unique?: boolean;
  type?: string;
  columns: string[];
}

export interface ConstraintSpec {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  columns: string[];
  references?: string;
}

export interface TriggerSpec {
  name: string;
  event: string;
  table: string;
  function: string;
}

// ─── Generator types ───────────────────────────────────────────────────

export interface ApiEndpointSpec {
  method: string;
  path: string;
  summary: string;
  tag: string;
  authenticated: boolean;
}

export interface E2ETestSpec {
  title: string;
  description: string;
  steps: string[];
  assertions: string[];
  pillarId: number;
}

export interface FrontendComponentSpec {
  name: string;
  type: 'page' | 'component' | 'layout';
  description: string;
  props: string[];
  stateManagement: string[];
}
