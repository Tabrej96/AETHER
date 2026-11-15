/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SYSTEM 3: Predictive Engineering Intelligence (predictiveEngine.ts)
 * Pre-implementation blast-radius estimation over AST symbol graphs, API contracts,
 * database schema relationships, git co-change history, and targeted test mapping.
 */

import { BlastRadiusNode, PredictiveImpactResult, RepoFileNode } from './types';

export function predictChangeImpact(
  mutatedFilePaths: string[],
  mutatedSymbols: string[],
  repoFiles: RepoFileNode[]
): PredictiveImpactResult {
  const affectedNodes: BlastRadiusNode[] = [];
  const visited = new Set<string>();

  let apiContractBreakRisk = false;
  let dbMigrationRequired = false;

  const mutatedSet = new Set(mutatedFilePaths);

  // Hop 0: Directly mutated files
  for (const file of repoFiles) {
    if (mutatedSet.has(file.path)) {
      visited.add(file.path);
      if (file.isPublicApi) apiContractBreakRisk = true;
      if (file.hasDbSchema) dbMigrationRequired = true;

      affectedNodes.push({
        path: file.path,
        hopDistance: 0,
        impactType: 'DIRECT_MUTATION',
        riskScore: file.isPublicApi ? 88 : file.hasDbSchema ? 92 : 65,
        affectedSymbols: file.exports.filter((e) => mutatedSymbols.length === 0 || mutatedSymbols.includes(e)),
      });
    }
  }

  // Hop 1: Direct callers, API consumers, DB dependents, or Test targets
  const hop0Exports = new Set<string>();
  for (const node of affectedNodes) {
    for (const sym of node.affectedSymbols) hop0Exports.add(sym);
  }

  for (const file of repoFiles) {
    if (visited.has(file.path)) continue;

    const importedAffected = file.imports.filter((imp) => hop0Exports.has(imp));
    const isCoChanged = file.coChangePaths.some((p) => mutatedSet.has(p));

    if (importedAffected.length > 0 || isCoChanged) {
      visited.add(file.path);
      if (file.isPublicApi) apiContractBreakRisk = true;
      if (file.hasDbSchema) dbMigrationRequired = true;

      const impactType: BlastRadiusNode['impactType'] = file.isTest
        ? 'TEST_TARGET'
        : file.isPublicApi
          ? 'API_CONTRACT_CONSUMER'
          : file.hasDbSchema
            ? 'DB_SCHEMA_DEPENDENT'
            : 'SIGNATURE_CALLER';

      affectedNodes.push({
        path: file.path,
        hopDistance: 1,
        impactType,
        riskScore: file.isTest ? 35 : file.isPublicApi ? 82 : 60,
        affectedSymbols: importedAffected.length > 0 ? importedAffected : file.exports.slice(0, 2),
      });
    }
  }

  // Hop 2: Transitive callers and integration tests
  const hop1Exports = new Set<string>();
  for (const node of affectedNodes.filter((n) => n.hopDistance === 1)) {
    const f = repoFiles.find((r) => r.path === node.path);
    if (f) f.exports.forEach((e) => hop1Exports.add(e));
  }

  for (const file of repoFiles) {
    if (visited.has(file.path)) continue;
    const transitiveMatch = file.imports.filter((imp) => hop1Exports.has(imp));
    if (transitiveMatch.length > 0) {
      visited.add(file.path);
      affectedNodes.push({
        path: file.path,
        hopDistance: 2,
        impactType: file.isTest ? 'TEST_TARGET' : 'SIGNATURE_CALLER',
        riskScore: file.isTest ? 25 : 42,
        affectedSymbols: transitiveMatch,
      });
    }
  }

  // Calculate aggregate risk score
  const rawRisk =
    affectedNodes.reduce((sum, n) => sum + n.riskScore * (n.hopDistance === 0 ? 1 : n.hopDistance === 1 ? 0.65 : 0.35), 0) /
    Math.max(1, affectedNodes.length);

  const bonusRisk = (apiContractBreakRisk ? 18 : 0) + (dbMigrationRequired ? 22 : 0);
  const overallRiskScore = Math.min(100, Math.round(rawRisk + bonusRisk));

  const riskLevel: PredictiveImpactResult['riskLevel'] =
    overallRiskScore >= 80
      ? 'CRITICAL'
      : overallRiskScore >= 60
        ? 'HIGH'
        : overallRiskScore >= 35
          ? 'MODERATE'
          : 'LOW';

  // Generate deterministic Targeted Verification Plan
  const targetedVerificationPlan: string[] = [];
  const testTargets = affectedNodes.filter((n) => n.impactType === 'TEST_TARGET');

  for (const t of testTargets) {
    targetedVerificationPlan.push(`Run targeted test suite: npx tsx --test ${t.path} (verifies ${t.affectedSymbols.join(', ') || 'module invariants'})`);
  }

  if (apiContractBreakRisk) {
    targetedVerificationPlan.push(
      'Execute OpenAPI / Public Symbol backward-compatibility contract check on exported signatures'
    );
  }
  if (dbMigrationRequired) {
    targetedVerificationPlan.push(
      'Run reversible Up/Down schema migration dry-run and check zero-downtime column nullability invariants'
    );
  }
  if (targetedVerificationPlan.length === 0) {
    targetedVerificationPlan.push(
      `Author missing unit test for ${mutatedFilePaths.join(', ')} before releasing file write lease`
    );
  }

  return {
    overallRiskScore,
    riskLevel,
    affectedNodes,
    apiContractBreakRisk,
    dbMigrationRequired,
    targetedVerificationPlan,
  };
}
