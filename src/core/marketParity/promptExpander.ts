import type { ExpandedSpec, Industry, ApiEndpoint, FrontendComponent, TestSpec, SecurityRequirement, CompetitorFeature } from './types';
import {
  getIndustryByPrompt,
  getIndustryDefinition,
  INDUSTRY_REGISTRY,
} from './industryRegistry';
import { PILLARS } from './pillars';
import { generateCompleteSchema } from './schemaGenerator';
import { generateApiEndpoints } from './apiGenerator';
import { generateFrontendComponents } from './frontendGenerator';
import { generateTestSuite } from './testGenerator';
import { generateSecurityRequirements } from './securityRequirements';

// Re-export for backward compatibility
export type { ExpandedSpec, Industry, ApiEndpoint, FrontendComponent, TestSpec, SecurityRequirement };

function detectIndustry(prompt: string): { industry: Industry; industryName: string; competitors: string[] } {
  const def = getIndustryByPrompt(prompt);
  if (def) {
    return { industry: def.industry, industryName: def.industryName, competitors: def.competitors };
  }

  return {
    industry: 'ecommerce',
    industryName: 'E-Commerce & Marketplace',
    competitors: ['Amazon', 'Shopify', 'Shopify Plus'],
  };
}

function estimateLOC(spec: {
  pillars: number;
  competitorFeatures: number;
  dbTables: number;
  apiEndpoints: number;
  frontendComponents: number;
  tests: number;
}): { lines: number; complexity: number } {
  const lines =
    spec.pillars * 800 +
    spec.competitorFeatures * 120 +
    spec.dbTables * 60 +
    spec.apiEndpoints * 40 +
    spec.frontendComponents * 150 +
    spec.tests * 30 +
    2000;

  const maxPossible = 19 * 800 + 300 * 120 + 50 * 60 + 100 * 40 + 80 * 150 + 200 * 30 + 2000;
  const complexity = Math.round((lines / maxPossible) * 100);

  return { lines, complexity: Math.min(complexity, 100) };
}

export async function expandPrompt(prompt: string): Promise<ExpandedSpec> {
  const trimmed = prompt.trim();
  const { industry, industryName, competitors } = detectIndustry(trimmed);

  const industryDef = getIndustryDefinition(industry);
  const competitorFeatures = industryDef
    ? industryDef.features
    : INDUSTRY_REGISTRY[0].features;

  const pillars = PILLARS.map(pillar => {
    const relevantFeatures = competitorFeatures.filter(f => {
      return pillar.features.some(pf => {
        const pfWords = pf.toLowerCase().split(/[\s&(),/]+/).filter(w => w.length > 3);
        const fName = f.name.toLowerCase();
        return pfWords.some(w => fName.includes(w));
      });
    });

    return {
      pillarId: pillar.pillarId,
      pillarName: pillar.pillarName,
      features: relevantFeatures.length > 0
        ? relevantFeatures.map(f => f.name)
        : pillar.features.slice(0, 3),
      implementation: pillar.implementation,
    };
  });

  const databaseSchema = generateCompleteSchema(industry, competitorFeatures);
  const apiEndpoints = generateApiEndpoints(industry, competitorFeatures);
  const frontendComponents = generateFrontendComponents(industry, competitorFeatures);
  const testSuite = generateTestSuite();
  const securityRequirements = generateSecurityRequirements();

  const featureCount = competitorFeatures.length;
  const { lines, complexity } = estimateLOC({
    pillars: PILLARS.length,
    competitorFeatures: featureCount,
    dbTables: databaseSchema.tables.length,
    apiEndpoints: apiEndpoints.length,
    frontendComponents: frontendComponents.length,
    tests: testSuite.length,
  });

  return {
    originalPrompt: trimmed,
    industry,
    industryName,
    competitors,
    pillars,
    competitorFeatures,
    databaseSchema,
    apiEndpoints,
    frontendComponents,
    testSuite,
    securityRequirements,
    estimatedLinesOfCode: lines,
    estimatedComplexity: complexity,
  };
}

export function peekExpansion(prompt: string): { industry: Industry; industryName: string; featureCount: number; competitors: string[] } {
  const trimmed = prompt.trim();
  const { industry, industryName, competitors } = detectIndustry(trimmed);
  const def = getIndustryDefinition(industry);
  const featureCount = def ? def.features.length : 50;

  return { industry, industryName, featureCount, competitors };
}
