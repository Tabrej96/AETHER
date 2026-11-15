/**
 * AETHER Market-Parity Engine — Competitor Feature Matrix
 *
 * For each industry, maps competitor features, generates feature checklists,
 * identifies gaps to fill for market parity.
 */

import type { CompetitorFeature, Industry } from './types';
import { INDUSTRY_REGISTRY } from './industryRegistry';

export interface FeatureGap {
  feature: string;
  hasCount: number;
  totalCount: number;
  coverage: number;
  leaderHasIt: string[];
  missingFrom: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface CompetitorMatrixRow {
  competitor: string;
  feature: string;
  hasIt: boolean;
  notes?: string;
}

export interface CompetitorMatrixReport {
  industry: string;
  totalFeatures: number;
  coveredFeatures: number;
  coverage: number;
  competitorRows: CompetitorMatrixRow[];
  featureGaps: FeatureGap[];
  marketLeaderFeatures: string[];
  mustHaveFeatures: string[];
  niceToHaveFeatures: string[];
  summary: string;
}

export interface ChecklistItem {
  feature: string;
  required: boolean;
  coverage: number;
  status: 'missing' | 'partial' | 'complete';
  competitorsWithFeature: string[];
  implementationNotes?: string;
}

export interface FeatureChecklist {
  industry: string;
  items: ChecklistItem[];
  totalRequired: number;
  totalImplemented: number;
  completionPercentage: number;
}

export function generateCompetitorMatrix(industryId: Industry): CompetitorMatrixReport {
  const config = INDUSTRY_REGISTRY[industryId];
  const competitorRows: CompetitorMatrixRow[] = [];
  const featureMap = new Map<string, Map<string, CompetitorFeature>>();
  const allFeatures = new Set<string>();

  for (const feature of config.features) {
    allFeatures.add(feature.name);
    if (!featureMap.has(feature.name)) {
      featureMap.set(feature.name, new Map());
    }
    featureMap.get(feature.name)!.set(feature.competitor, feature);
  }

  for (const competitor of config.competitors) {
    for (const featureName of allFeatures) {
      const featureData = featureMap.get(featureName)?.get(competitor);
      competitorRows.push({
        competitor,
        feature: featureName,
        hasIt: !!featureData,
        notes: featureData?.implementation,
      });
    }
  }

  const featureGaps: FeatureGap[] = [];
  for (const featureName of allFeatures) {
    const featureCompetitors = featureMap.get(featureName) || new Map();
    const totalCount = config.competitors.length;
    const hasCount = featureCompetitors.size;
    const coverage = totalCount > 0 ? Math.round((hasCount / totalCount) * 100) : 0;
    const leaderHasIt = Array.from(featureCompetitors.keys());
    const missingFrom = config.competitors.filter(c => !featureCompetitors.has(c));

    let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
    let recommendation = '';

    if (coverage >= 75) {
      priority = 'critical';
      recommendation = `This feature is standard in ${config.industryName}. ${leaderHasIt.join(', ')} all have it. Must implement for market parity.`;
    } else if (coverage >= 50) {
      priority = 'high';
      recommendation = `Major competitors (${leaderHasIt.join(', ')}) have this feature. Implement to stay competitive.`;
    } else if (coverage >= 25) {
      priority = 'medium';
      recommendation = `Some competitors have this. Consider implementing as a differentiator.`;
    } else {
      priority = 'low';
      recommendation = `Rare feature in this market. Could be a unique selling point.`;
    }

    featureGaps.push({
      feature: featureName,
      hasCount,
      totalCount,
      coverage,
      leaderHasIt,
      missingFrom,
      priority,
      recommendation,
    });
  }

  featureGaps.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const mustHaveFeatures = featureGaps.filter(g => g.priority === 'critical').map(g => g.feature);
  const niceToHaveFeatures = featureGaps.filter(g => g.priority === 'high').map(g => g.feature);
  const marketLeaderFeatures = featureGaps.filter(g => g.coverage === 100).map(g => g.feature);

  return {
    industry: config.industryName,
    totalFeatures: allFeatures.size,
    coveredFeatures: allFeatures.size,
    coverage: allFeatures.size > 0 ? 100 : 0,
    competitorRows,
    featureGaps,
    marketLeaderFeatures,
    mustHaveFeatures,
    niceToHaveFeatures,
    summary: `${config.industryName} market analysis: ${featureGaps.filter(g => g.priority === 'critical').length} critical features identified across ${config.competitors.length} competitors.`,
  };
}

export function generateFeatureChecklist(industryId: Industry): FeatureChecklist {
  const config = INDUSTRY_REGISTRY[industryId];
  const matrix = generateCompetitorMatrix(industryId);

  const items: ChecklistItem[] = matrix.featureGaps.map(gap => {
    let status: 'missing' | 'partial' | 'complete' = 'missing';
    if (gap.coverage >= 75) status = 'complete';
    else if (gap.coverage >= 25) status = 'partial';

    return {
      feature: gap.feature,
      required: gap.priority === 'critical' || gap.priority === 'high',
      coverage: gap.coverage,
      status,
      competitorsWithFeature: gap.leaderHasIt,
      implementationNotes: gap.recommendation,
    };
  });

  const totalRequired = items.filter(i => i.required).length;
  const totalImplemented = items.filter(i => i.status !== 'missing').length;
  const requiredImplemented = items.filter(i => i.required && i.status !== 'missing').length;

  return {
    industry: config.industryName,
    items,
    totalRequired,
    totalImplemented,
    completionPercentage: totalRequired > 0 ? Math.round((requiredImplemented / totalRequired) * 100) : 0,
  };
}

export function getAllFeaturesAcrossIndustry(industryId: Industry): { feature: string; competitorsWithIt: string[]; importance: number }[] {
  const config = INDUSTRY_REGISTRY[industryId];
  const featureMap = new Map<string, string[]>();

  for (const f of config.features) {
    if (!featureMap.has(f.name)) featureMap.set(f.name, []);
    featureMap.get(f.name)!.push(f.competitor);
  }

  return Array.from(featureMap.entries()).map(([feature, competitors]) => ({
    feature,
    competitorsWithIt: competitors,
    importance: competitors.length,
  })).sort((a, b) => b.importance - a.importance);
}
