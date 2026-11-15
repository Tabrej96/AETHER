/**
 * AETHER Market-Parity Engine - Validator
 *
 * Validates generated spec against 19 pillars.
 * Checks for missing features and generates coverage report.
 */

import type { PillarSpec } from './pillarEngine';
import { getPillarNames } from './pillarEngine';
import type { IndustryId } from './industryRegistry';
import { INDUSTRY_REGISTRY, getIndustryConfig } from './industryRegistry';
import type { CompetitorMatrixReport, FeatureChecklist, FeatureGap } from './competitorMatrix';
import { generateCompetitorMatrix, generateFeatureChecklist, getAllFeaturesAcrossIndustry } from './competitorMatrix';
import type { GeneratedSchema } from './schemaGenerator';
import { generateFullSchema, generateTypeScriptTypes, generateIndexSuggestions } from './schemaGenerator';

// ─── Validation Types ────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  score: number; // 0-100
  pillarScores: PillarScore[];
  missingFeatures: MissingFeature[];
  warnings: ValidationWarning[];
  errors: ValidationError[];
  coverageReport: CoverageReport;
  recommendations: string[];
}

export interface PillarScore {
  pillarId: number;
  pillarName: string;
  score: number; // 0-100
  hasComponents: boolean;
  hasTables: boolean;
  hasApiEndpoints: boolean;
  hasE2ETests: boolean;
  hasFrontendComponents: boolean;
  componentCount: number;
  tableCount: number;
  apiEndpointCount: number;
  e2eTestCount: number;
  frontendComponentCount: number;
}

export interface MissingFeature {
  pillarId: number;
  pillarName: string;
  feature: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface ValidationWarning {
  pillarId: number;
  pillarName: string;
  message: string;
  suggestion: string;
}

export interface ValidationError {
  pillarId: number;
  pillarName: string;
  message: string;
  details: string;
}

export interface CoverageReport {
  totalPillars: number;
  pillarsWithComponents: number;
  pillarsWithTables: number;
  pillarsWithApi: number;
  pillarsWithTests: number;
  pillarsWithFrontend: number;
  overallCoverage: number;
  criticalGaps: number;
  highGaps: number;
  mediumGaps: number;
  lowGaps: number;
}

// ─── Schema Validation ───────────────────────────────────────────────

export interface SchemaValidationResult {
  valid: boolean;
  tablesValid: boolean;
  indexesValid: boolean;
  constraintsValid: boolean;
  triggersValid: boolean;
  issues: SchemaIssue[];
}

export interface SchemaIssue {
  severity: 'error' | 'warning';
  table?: string;
  message: string;
  suggestion: string;
}

// ─── Main Validator ──────────────────────────────────────────────────

export function validateAgainstPillars(pillarSpecs: PillarSpec[]): ValidationResult {
  const pillarScores: PillarScore[] = [];
  const missingFeatures: MissingFeature[] = [];
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];
  const pillarNames = getPillarNames();

  for (let i = 0; i < pillarSpecs.length; i++) {
    const pillar = pillarSpecs[i];
    const name = pillarNames[pillar.id - 1] || `Pillar ${pillar.id}`;

    const hasComponents = pillar.components.length > 0;
    const hasTables = pillar.tables.length > 0;
    const hasApiEndpoints = pillar.apiEndpoints.length > 0;
    const hasE2ETests = pillar.e2eTests.length > 0;
    const hasFrontendComponents = pillar.frontendComponents.length > 0;

    let score = 0;
    if (hasComponents) score += 20;
    if (hasTables) score += 20;
    if (hasApiEndpoints) score += 20;
    if (hasE2ETests) score += 20;
    if (hasFrontendComponents) score += 20;

    // Bonus for completeness
    if (pillar.components.length >= 3) score += 5;
    if (pillar.tables.length >= 3) score += 5;
    if (pillar.apiEndpoints.length >= 5) score += 5;

    // Check for critical missing items
    if (!hasComponents) {
      missingFeatures.push({
        pillarId: pillar.id,
        pillarName: name,
        feature: 'Service Components',
        severity: 'critical',
        suggestion: `Add service components for ${name}`,
      });
    }
    if (!hasTables) {
      missingFeatures.push({
        pillarId: pillar.id,
        pillarName: name,
        feature: 'Database Tables',
        severity: 'high',
        suggestion: `Add database schema for ${name}`,
      });
    }
    if (!hasApiEndpoints) {
      missingFeatures.push({
        pillarId: pillar.id,
        pillarName: name,
        feature: 'API Endpoints',
        severity: 'critical',
        suggestion: `Add REST API endpoints for ${name}`,
      });
    }
    if (!hasE2ETests) {
      missingFeatures.push({
        pillarId: pillar.id,
        pillarName: name,
        feature: 'E2E Tests',
        severity: 'medium',
        suggestion: `Add E2E tests for ${name}`,
      });
    }
    if (!hasFrontendComponents) {
      missingFeatures.push({
        pillarId: pillar.id,
        pillarName: name,
        feature: 'Frontend Components',
        severity: 'medium',
        suggestion: `Add frontend components for ${name}`,
      });
    }

    // Warnings
    if (hasComponents && pillar.components.length < 2) {
      warnings.push({
        pillarId: pillar.id,
        pillarName: name,
        message: `Pillar ${pillar.id} has only ${pillar.components.length} component(s)`,
        suggestion: 'Consider adding more service components for full coverage',
      });
    }
    if (hasApiEndpoints && pillar.apiEndpoints.length < 3) {
      warnings.push({
        pillarId: pillar.id,
        pillarName: name,
        message: `Pillar ${pillar.id} has only ${pillar.apiEndpoints.length} API endpoint(s)`,
        suggestion: 'Consider adding more endpoints for complete API coverage',
      });
    }
    if (hasE2ETests && pillar.e2eTests.length < 2) {
      warnings.push({
        pillarId: pillar.id,
        pillarName: name,
        message: `Pillar ${pillar.id} has only ${pillar.e2eTests.length} E2E test(s)`,
        suggestion: 'Consider adding more E2E tests for comprehensive coverage',
      });
    }

    // Errors
    if (score < 40) {
      errors.push({
        pillarId: pillar.id,
        pillarName: name,
        message: `Pillar ${pillar.id} coverage is critically low (${score}%)`,
        details: `Missing: ${[!hasComponents && 'components', !hasTables && 'tables', !hasApiEndpoints && 'API', !hasE2ETests && 'tests', !hasFrontendComponents && 'frontend'].filter(Boolean).join(', ') || 'none'}`,
      });
    }

    pillarScores.push({
      pillarId: pillar.id,
      pillarName: name,
      score: Math.min(score, 100),
      hasComponents,
      hasTables,
      hasApiEndpoints,
      hasE2ETests,
      hasFrontendComponents,
      componentCount: pillar.components.length,
      tableCount: pillar.tables.length,
      apiEndpointCount: pillar.apiEndpoints.length,
      e2eTestCount: pillar.e2eTests.length,
      frontendComponentCount: pillar.frontendComponents.length,
    });
  }

  const overallScore = Math.round(pillarScores.reduce((sum, s) => sum + s.score, 0) / pillarScores.length);

  const coverageReport = computeCoverageReport(pillarScores, missingFeatures);

  const recommendations = generateRecommendations(pillarScores, missingFeatures, warnings);

  return {
    valid: errors.length === 0 && missingFeatures.filter(f => f.severity === 'critical').length === 0,
    score: overallScore,
    pillarScores,
    missingFeatures,
    warnings,
    errors,
    coverageReport,
    recommendations,
  };
}

// ─── Industry Validation ─────────────────────────────────────────────

export function validateIndustrySpec(industryId: IndustryId): ValidationResult {
  const config = getIndustryConfig(industryId);
  const pillarScores: PillarScore[] = [];
  const missingFeatures: MissingFeature[] = [];
  const warnings: ValidationWarning[] = [];
  const errors: ValidationError[] = [];

  // Check required pillars
  const allPillarNames = getPillarNames();
  for (let i = 0; i < allPillarNames.length; i++) {
    const pillarId = i + 1;
    const isRequired = config.requiredPillars.includes(pillarId);

    if (isRequired) {
      missingFeatures.push({
        pillarId,
        pillarName: allPillarNames[i],
        feature: `${allPillarNames[i]} Implementation`,
        severity: 'critical',
        suggestion: `Pillar ${pillarId} is required for ${config.name} industry`,
      });
    }
  }

  // Check competitor feature coverage
  const matrix = generateCompetitorMatrix(industryId);
  const criticalGaps = matrix.featureGaps.filter(g => g.priority === 'critical');

  for (const gap of criticalGaps) {
    missingFeatures.push({
      pillarId: 0,
      pillarName: 'Market Parity',
      feature: gap.feature,
      severity: 'critical',
      suggestion: gap.recommendation,
    });
  }

  const pillarCoverage = config.requiredPillars.map(pid => {
    const name = allPillarNames[pid - 1];
    return {
      pillarId: pid,
      pillarName: name,
      score: 0,
      hasComponents: false,
      hasTables: false,
      hasApiEndpoints: false,
      hasE2ETests: false,
      hasFrontendComponents: false,
      componentCount: 0,
      tableCount: 0,
      apiEndpointCount: 0,
      e2eTestCount: 0,
      frontendComponentCount: 0,
    } as PillarScore;
  });

  const overallScore = criticalGaps.length === 0 ? 100 : Math.max(0, 100 - (criticalGaps.length * 10));

  return {
    valid: criticalGaps.length === 0,
    score: overallScore,
    pillarScores: pillarCoverage,
    missingFeatures,
    warnings,
    errors: criticalGaps.map(g => ({
      pillarId: 0,
      pillarName: 'Market Parity',
      message: `Missing critical feature: ${g.feature}`,
      details: `${g.leaderHasIt.join(', ')} competitors have this feature. Coverage: ${g.coverage}%`,
    })),
    coverageReport: {
      totalPillars: config.requiredPillars.length,
      pillarsWithComponents: 0,
      pillarsWithTables: 0,
      pillarsWithApi: 0,
      pillarsWithTests: 0,
      pillarsWithFrontend: 0,
      overallCoverage: 0,
      criticalGaps: criticalGaps.length,
      highGaps: matrix.featureGaps.filter(g => g.priority === 'high').length,
      mediumGaps: matrix.featureGaps.filter(g => g.priority === 'medium').length,
      lowGaps: matrix.featureGaps.filter(g => g.priority === 'low').length,
    },
    recommendations: [
      ...criticalGaps.slice(0, 5).map(g => `Implement ${g.feature} (competitor coverage: ${g.coverage}%)`),
      `Total competitor features to match: ${matrix.featureGaps.length}`,
      `Market leaders: ${config.competitors.filter(c => c.marketShare).map(c => `${c.name} (${c.marketShare})`).join(', ')}`,
    ],
  };
}

// ─── Full Spec Validation ────────────────────────────────────────────

export function validateFullSpec(
  pillarSpecs: PillarSpec[],
  industryId?: IndustryId,
): { pillarValidation: ValidationResult; industryValidation?: ValidationResult; schemaValidation: SchemaValidationResult } {
  const pillarValidation = validateAgainstPillars(pillarSpecs);
  const schemaValidation = validateSchema(pillarSpecs);
  let industryValidation: ValidationResult | undefined;

  if (industryId) {
    industryValidation = validateIndustrySpec(industryId);
  }

  return {
    pillarValidation,
    industryValidation,
    schemaValidation,
  };
}

// ─── Schema Validation ───────────────────────────────────────────────

export function validateSchema(pillarSpecs: PillarSpec[]): SchemaValidationResult {
  const issues: SchemaIssue[] = [];
  const tableNames = new Set<string>();
  const indexNames = new Set<string>();

  let tablesValid = true;
  let indexesValid = true;
  let constraintsValid = true;
  let triggersValid = true;

  for (const pillar of pillarSpecs) {
    for (const table of pillar.tables) {
      // Check for duplicate table names
      if (tableNames.has(table.name)) {
        tablesValid = false;
        issues.push({
          severity: 'error',
          table: table.name,
          message: `Duplicate table name: ${table.name}`,
          suggestion: 'Use unique table names across pillars',
        });
      }
      tableNames.add(table.name);

      // Check for primary key
      const hasPK = table.constraints.some(c => c.type === 'primary_key');
      if (!hasPK) {
        tablesValid = false;
        issues.push({
          severity: 'error',
          table: table.name,
          message: `Table ${table.name} has no primary key`,
          suggestion: 'Add a primary key constraint',
        });
      }

      // Check for id column
      const hasIdColumn = table.columns.some(c => c.name === 'id');
      if (!hasIdColumn) {
        issues.push({
          severity: 'warning',
          table: table.name,
          message: `Table ${table.name} has no 'id' column`,
          suggestion: 'Consider adding an id column for referential integrity',
        });
      }

      // Check for timestamps
      const hasCreatedAt = table.columns.some(c => c.name === 'created_at');
      const hasUpdatedAt = table.columns.some(c => c.name === 'updated_at');
      if (!hasCreatedAt) {
        issues.push({
          severity: 'warning',
          table: table.name,
          message: `Table ${table.name} has no created_at column`,
          suggestion: 'Add created_at timestamp for audit trail',
        });
      }

      // Check indexes
      for (const index of table.indexes) {
        if (indexNames.has(index.name)) {
          indexesValid = false;
          issues.push({
            severity: 'warning',
            table: table.name,
            message: `Duplicate index name: ${index.name}`,
            suggestion: 'Use unique index names',
          });
        }
        indexNames.add(index.name);
      }

      // Check foreign key references
      for (const constraint of table.constraints) {
        if (constraint.type === 'foreign_key' && constraint.references) {
          const refTable = constraint.references.split('(')[0].trim();
          if (!tableNames.has(refTable) && !pillar.tables.some(t => t.name === refTable)) {
            issues.push({
              severity: 'warning',
              table: table.name,
              message: `Foreign key references potentially non-existent table: ${refTable}`,
              suggestion: 'Ensure referenced table exists in schema',
            });
          }
        }
      }
    }

    // Validate triggers reference valid functions
    const triggerFuncs = new Set<string>();
    for (const pillar2 of pillarSpecs) {
      for (const table2 of pillar2.tables) {
        for (const trigger of table2.triggers) {
          triggerFuncs.add(trigger.function);
        }
      }
    }

    for (const pillar2 of pillarSpecs) {
      for (const table2 of pillar2.tables) {
        for (const trigger of table2.triggers) {
          if (trigger.function === 'update_updated_at_column()') continue; // standard function
          if (!triggerFuncs.has(trigger.function)) {
            issues.push({
              severity: 'warning',
              table: table2.name,
              message: `Trigger function ${trigger.function} may not exist`,
              suggestion: 'Create the referenced trigger function',
            });
          }
        }
      }
    }
  }

  return {
    valid: tablesValid && indexesValid && constraintsValid && triggersValid && issues.filter(i => i.severity === 'error').length === 0,
    tablesValid,
    indexesValid,
    constraintsValid,
    triggersValid,
    issues,
  };
}

// ─── Coverage Report ─────────────────────────────────────────────────

function computeCoverageReport(pillarScores: PillarScore[], missingFeatures: MissingFeature[]): CoverageReport {
  return {
    totalPillars: pillarScores.length,
    pillarsWithComponents: pillarScores.filter(s => s.hasComponents).length,
    pillarsWithTables: pillarScores.filter(s => s.hasTables).length,
    pillarsWithApi: pillarScores.filter(s => s.hasApiEndpoints).length,
    pillarsWithTests: pillarScores.filter(s => s.hasE2ETests).length,
    pillarsWithFrontend: pillarScores.filter(s => s.hasFrontendComponents).length,
    overallCoverage: Math.round(pillarScores.reduce((sum, s) => sum + s.score, 0) / pillarScores.length),
    criticalGaps: missingFeatures.filter(f => f.severity === 'critical').length,
    highGaps: missingFeatures.filter(f => f.severity === 'high').length,
    mediumGaps: missingFeatures.filter(f => f.severity === 'medium').length,
    lowGaps: missingFeatures.filter(f => f.severity === 'low').length,
  };
}

// ─── Recommendations Generator ───────────────────────────────────────

function generateRecommendations(
  pillarScores: PillarScore[],
  missingFeatures: MissingFeature[],
  warnings: ValidationWarning[],
): string[] {
  const recommendations: string[] = [];
  const pillarNames = getPillarNames();

  // Critical gaps
  const criticalGaps = missingFeatures.filter(f => f.severity === 'critical');
  if (criticalGaps.length > 0) {
    recommendations.push(`CRITICAL: ${criticalGaps.length} critical features missing. These must be implemented for production readiness.`);
    for (const gap of criticalGaps.slice(0, 5)) {
      recommendations.push(`  - ${gap.pillarName}: ${gap.feature} - ${gap.suggestion}`);
    }
  }

  // Low-scoring pillars
  const lowPillars = pillarScores.filter(s => s.score < 60);
  if (lowPillars.length > 0) {
    recommendations.push(`Low coverage pillars (score < 60%): ${lowPillars.map(s => `P${s.pillarId}: ${s.score}%`).join(', ')}`);
  }

  // Industry-specific
  if (lowPillars.length > 0) {
    recommendations.push(`Focus on: ${lowPillars.map(s => pillarNames[s.pillarId - 1]).join(', ')}`);
  }

  // Warnings
  if (warnings.length > 0) {
    recommendations.push(`${warnings.length} warnings to address for full production readiness.`);
  }

  // Schema
  recommendations.push('Run database migrations before deployment');
  recommendations.push('Set up CI/CD pipeline with automated testing');
  recommendations.push('Configure monitoring and alerting for all pillars');
  recommendations.push('Perform security audit before production');

  return recommendations;
}

// ─── Gap Analysis ────────────────────────────────────────────────────

export function generateGapAnalysis(
  pillarSpecs: PillarSpec[],
  industryId?: IndustryId,
): {
  overallScore: number;
  gaps: Gap[];
  coverageByPillar: { name: string; score: number; color: string }[];
  priorityFixes: string[];
} {
  const validation = validateAgainstPillars(pillarSpecs);
  const gaps: Gap[] = [];

  for (const ps of validation.pillarScores) {
    const pillarGaps = validation.missingFeatures.filter(f => f.pillarId === ps.pillarId);
    for (const gap of pillarGaps) {
      gaps.push({
        pillarId: ps.pillarId,
        pillarName: ps.pillarName,
        feature: gap.feature,
        severity: gap.severity,
        currentScore: ps.score,
      });
    }
  }

  if (industryId) {
    const industryGaps = generateCompetitorMatrix(industryId);
    for (const fg of industryGaps.featureGaps.filter(f => f.priority === 'critical')) {
      gaps.push({
        pillarId: 0,
        pillarName: 'Market Parity',
        feature: fg.feature,
        severity: 'critical',
        currentScore: fg.coverage,
      });
    }
  }

  const coverageByPillar = validation.pillarScores.map(ps => ({
    name: ps.pillarName,
    score: ps.score,
    color: ps.score >= 80 ? '#22c55e' : ps.score >= 60 ? '#f59e0b' : ps.score >= 40 ? '#f97316' : '#ef4444',
  }));

  const priorityFixes = gaps
    .filter(g => g.severity === 'critical')
    .sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0))
    .slice(0, 10)
    .map(g => `[P${g.pillarId}] ${g.pillarName}: Implement ${g.feature}`);

  return {
    overallScore: validation.score,
    gaps,
    coverageByPillar,
    priorityFixes,
  };
}

export interface Gap {
  pillarId: number;
  pillarName: string;
  feature: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  currentScore: number;
}

// ─── Report Generation ───────────────────────────────────────────────

export function generateValidationReport(result: ValidationResult): string {
  let report = '';
  report += '='.repeat(80) + '\n';
  report += 'AETHER Market-Parity Engine - Validation Report\n';
  report += '='.repeat(80) + '\n\n';

  report += `Overall Score: ${result.score}% ${result.valid ? '(PASS)' : '(FAIL)'}\n`;
  report += `Total Pillars: ${result.coverageReport.totalPillars}\n`;
  report += `Critical Gaps: ${result.coverageReport.criticalGaps}\n`;
  report += `High Gaps: ${result.coverageReport.highGaps}\n\n`;

  report += '-'.repeat(80) + '\n';
  report += 'Pillar Scores:\n';
  report += '-'.repeat(80) + '\n';

  for (const ps of result.pillarScores) {
    const status = ps.score >= 80 ? 'OK' : ps.score >= 60 ? 'WARN' : 'FAIL';
    report += `  [P${String(ps.pillarId).padStart(2, '0')}] ${ps.pillarName.padEnd(50)} ${String(ps.score).padStart(3)}% [${status}]\n`;
    report += `         Components: ${ps.componentCount} | Tables: ${ps.tableCount} | API: ${ps.apiEndpointCount} | E2E: ${ps.e2eTestCount} | UI: ${ps.frontendComponentCount}\n`;
  }

  if (result.errors.length > 0) {
    report += '\n' + '-'.repeat(80) + '\n';
    report += 'ERRORS:\n';
    for (const error of result.errors) {
      report += `  [P${error.pillarId}] ${error.message}\n`;
      report += `    Details: ${error.details}\n`;
    }
  }

  if (result.missingFeatures.length > 0) {
    report += '\n' + '-'.repeat(80) + '\n';
    report += 'MISSING FEATURES:\n';
    for (const mf of result.missingFeatures) {
      report += `  [${mf.severity.toUpperCase()}] P${mf.pillarId}: ${mf.feature}\n`;
    }
  }

  if (result.warnings.length > 0) {
    report += '\n' + '-'.repeat(80) + '\n';
    report += 'WARNINGS:\n';
    for (const warning of result.warnings) {
      report += `  P${warning.pillarId}: ${warning.message}\n`;
      report += `    Suggestion: ${warning.suggestion}\n`;
    }
  }

  report += '\n' + '-'.repeat(80) + '\n';
  report += 'RECOMMENDATIONS:\n';
  for (const rec of result.recommendations) {
    report += `  ${rec}\n`;
  }

  report += '\n' + '='.repeat(80) + '\n';
  return report;
}

// ─── TypeScript Validation ───────────────────────────────────────────

export function validateTypeScriptTypes(typeDefinitions: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check for common TypeScript issues
  if (!typeDefinitions.includes('export interface')) {
    issues.push('No interfaces found in generated types');
  }
  if (typeDefinitions.includes('any') && !typeDefinitions.includes('// any allowed')) {
    issues.push('Type definitions use "any" type - consider using proper types');
  }
  if (typeDefinitions.includes('unknown') && !typeDefinitions.includes('// unknown allowed')) {
    issues.push('Consider replacing "unknown" with more specific types');
  }
  if (typeDefinitions.includes('TODO')) {
    issues.push('Generated types contain TODOs - review and complete');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
