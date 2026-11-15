/**
 * AETHER Market-Parity Engine — Main Entry Point
 *
 * Expands a short user prompt into a COMPLETE production specification
 * achieving 1:1 functional parity with global market leaders.
 *
 * Usage:
 *   const spec = await expandPrompt('Build Coffee Shop Website');
 *   console.log(spec.pillars, spec.competitorFeatures, spec.databaseSchema);
 */

export { expandPrompt, peekExpansion } from './promptExpander';
export { PILLARS, getPillarById, getAllPillarFeatures } from './pillars';
export {
  INDUSTRY_REGISTRY,
  getIndustryDefinition,
  getIndustryByPrompt,
} from './industryRegistry';
export { generateCompleteSchema } from './schemaGenerator';
export { generateApiEndpoints } from './apiGenerator';
export { generateFrontendComponents } from './frontendGenerator';
export { generateTestSuite } from './testGenerator';
export { generateSecurityRequirements } from './securityRequirements';

export type {
  Industry,
  CompetitorTier,
  CompetitorFeature,
  PillarRequirement,
  ExpandedSpec,
  CompleteSchema,
  TableDef,
  ColumnDef,
  IndexDef,
  ConstraintDef,
  TriggerDef,
  MigrationStep,
  HttpMethod,
  ApiEndpoint,
  ComponentType,
  FrontendComponent,
  TestCategory,
  TestSpec,
  SecurityRequirement,
} from './types';

import type { ExpandedSpec } from './types';

import {
  INDUSTRY_REGISTRY,
  getIndustryByPrompt,
} from './industryRegistry';
import {
  PILLARS,
} from './pillars';
import {
  generateTestSuite,
} from './testGenerator';
import {
  generateSecurityRequirements,
} from './securityRequirements';

/**
 * Quick validation — ensure the engine is operational.
 * Returns true if all registries are populated.
 */
export function healthCheck(): boolean {
  try {
    const checks = [
      INDUSTRY_REGISTRY.length >= 10,
      PILLARS.length === 19,
      INDUSTRY_REGISTRY.every(def => def.features.length >= 50),
      getIndustryByPrompt('coffee shop') !== undefined,
      getIndustryByPrompt('ecommerce') !== undefined,
      getIndustryByPrompt('AI platform') !== undefined,
      generateTestSuite().length >= 10,
      generateSecurityRequirements().length >= 10,
    ];

    return checks.every(Boolean);
  } catch {
    return false;
  }
}

/**
 * Version and metadata for the AETHER Market-Parity Engine.
 */
export const ENGINE_VERSION = '1.0.0';
export const ENGINE_NAME = 'AETHER Market-Parity Engine';
export const PILLAR_COUNT = 19;
export const MIN_FEATURES_PER_INDUSTRY = 50;
export const E2E_TEST_COUNT = 10;
export const SUPPORTED_INDUSTRIES = [
  'ecommerce', 'food-beverage', 'coffee-shop', 'restaurant',
  'healthcare', 'ai-platform', 'booking', 'fintech',
  'education', 'entertainment', 'logistics', 'hospitality',
  'real-estate', 'automotive', 'gaming', 'social',
  'saas', 'productivity', 'enterprise',
] as const;
