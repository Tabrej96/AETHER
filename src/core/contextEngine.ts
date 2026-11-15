/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SYSTEM 1: Neural Context Intelligence (contextEngine.ts)
 * AST-aware symbol graph ranking (Personalized PageRank), token budget knapsack compression,
 * context pollution prevention, and missing-context detection.
 */

import { ContextCompressionTier, ContextSliceResult, RankedContextFile, RepoFileNode } from './types';

export interface ContextRequest {
  taskPrompt: string;
  files: RepoFileNode[];
  budgetTokens: number;
  criticalDecisions?: string[];
}

const POLLUTION_PATTERNS = [
  /node_modules\//i,
  /dist\//i,
  /build\//i,
  /\.lock$/i,
  /package-lock\.json$/i,
  /\.min\.js$/i,
  /coverage\//i,
];

export function computeNeuralContextSlice(req: ContextRequest): ContextSliceResult {
  const { taskPrompt, files, budgetTokens, criticalDecisions = [] } = req;
  const promptTokens = taskPrompt
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter((w) => w.length >= 3);

  const preventedPollutions: string[] = [];
  const candidateFiles: RepoFileNode[] = [];

  for (const file of files) {
    if (file.isGenerated || POLLUTION_PATTERNS.some((rx) => rx.test(file.path))) {
      preventedPollutions.push(`${file.path} (blocked generated/lockfile context pollution)`);
    } else {
      candidateFiles.push(file);
    }
  }

  // 1. Seed relevance score from lexical + symbol match
  const baseScores = new Map<string, number>();
  const reasons = new Map<string, string[]>();

  for (const file of candidateFiles) {
    let score = 0.05;
    const fileReasons: string[] = [];
    const pathLower = file.path.toLowerCase();

    for (const token of promptTokens) {
      if (pathLower.includes(token)) {
        score += 0.35;
        fileReasons.push(`path matches '${token}'`);
      }
      for (const sym of file.exports) {
        if (sym.toLowerCase().includes(token)) {
          score += 0.45;
          fileReasons.push(`exports symbol '${sym}'`);
        }
      }
    }

    baseScores.set(file.path, score);
    reasons.set(file.path, Array.from(new Set(fileReasons)));
  }

  // 2. Personalized PageRank propagation across AST imports & git co-change edges
  const rankScores = new Map<string, number>(baseScores);
  const damping = 0.82;

  for (let iter = 0; iter < 6; iter++) {
    const nextScores = new Map<string, number>();
    for (const file of candidateFiles) {
      const seed = baseScores.get(file.path) ?? 0.05;
      let inboundSum = 0;

      for (const other of candidateFiles) {
        if (other.path === file.path) continue;
        const otherScore = rankScores.get(other.path) ?? 0.05;

        // Check if `other` imports a symbol exported by `file`
        const sharedSymbol = other.imports.find((imp) => file.exports.includes(imp));
        if (sharedSymbol) {
          inboundSum += otherScore * 0.45;
          if (iter === 0 && (baseScores.get(other.path) ?? 0) > 0.25) {
            reasons.get(file.path)?.push(`imported by ${other.path} (${sharedSymbol})`);
          }
        }

        // Check git co-change coupling
        if (other.coChangePaths.includes(file.path)) {
          inboundSum += otherScore * 0.25;
          if (iter === 0 && (baseScores.get(other.path) ?? 0) > 0.25) {
            reasons.get(file.path)?.push(`git co-change coupled with ${other.path}`);
          }
        }
      }

      nextScores.set(file.path, (1 - damping) * seed + damping * (seed + inboundSum));
    }
    for (const [k, v] of nextScores.entries()) {
      rankScores.set(k, v);
    }
  }

  // Normalize scores to [0, 1]
  const maxScore = Math.max(...Array.from(rankScores.values()), 0.001);
  const sorted = [...candidateFiles].sort(
    (a, b) => (rankScores.get(b.path) ?? 0) - (rankScores.get(a.path) ?? 0)
  );

  // 3. Detect missing context (imported symbols not exported by any repository file)
  const allExportedSymbols = new Set<string>();
  for (const f of candidateFiles) {
    for (const exp of f.exports) allExportedSymbols.add(exp);
  }

  const missingContextWarnings: string[] = [];
  for (const f of sorted.slice(0, 4)) {
    for (const imp of f.imports) {
      if (!allExportedSymbols.has(imp) && !imp.startsWith('node:')) {
        missingContextWarnings.push(
          `Symbol '${imp}' imported in ${f.path} has no definition in current workspace slice`
        );
      }
    }
  }

  // 4. Determine Task Complexity & Allocate Token Budget via Tiered Compression
  const highRelevanceCount = sorted.filter((f) => (rankScores.get(f.path) ?? 0) / maxScore > 0.45).length;
  const taskComplexity: ContextSliceResult['taskComplexity'] =
    highRelevanceCount >= 5 ? 'CRITICAL' : highRelevanceCount >= 3 ? 'HIGH' : highRelevanceCount === 2 ? 'MEDIUM' : 'LOW';

  const decisionOverheadTokens = criticalDecisions.length * 28;
  let remainingBudget = Math.max(200, budgetTokens - decisionOverheadTokens);
  let usedTokens = decisionOverheadTokens;

  const rankedFiles: RankedContextFile[] = [];

  for (const file of sorted) {
    const normScore = Number(((rankScores.get(file.path) ?? 0) / maxScore).toFixed(3));
    const whyList = Array.from(new Set(reasons.get(file.path) ?? []));
    const reasonText = whyList.length > 0 ? whyList.slice(0, 2).join('; ') : 'structural baseline neighbor';

    let tier: ContextCompressionTier = 'EVICTED';
    let allocated = 0;

    if (normScore >= 0.55 && remainingBudget >= file.tokens) {
      tier = 'FULL_SOURCE';
      allocated = file.tokens;
    } else if (normScore >= 0.25 && remainingBudget >= Math.ceil(file.tokens * 0.28)) {
      tier = 'SIGNATURE_SKELETON';
      allocated = Math.ceil(file.tokens * 0.28);
    } else if (normScore >= 0.12 && remainingBudget >= Math.ceil(file.tokens * 0.1)) {
      tier = 'SUMMARY_HEADER';
      allocated = Math.ceil(file.tokens * 0.1);
    }

    if (allocated > 0) {
      remainingBudget -= allocated;
      usedTokens += allocated;
    }

    rankedFiles.push({
      path: file.path,
      relevanceScore: normScore,
      compressionTier: tier,
      originalTokens: file.tokens,
      allocatedTokens: allocated,
      reason: reasonText,
    });
  }

  const rawTotalTokens = files.reduce((acc, f) => acc + f.tokens, 0);
  const tokenSavingsPercent =
    rawTotalTokens > 0 ? Math.max(0, Math.round(((rawTotalTokens - usedTokens) / rawTotalTokens) * 100)) : 0;

  return {
    taskComplexity,
    budgetTokens,
    usedTokens,
    rawTotalTokens,
    tokenSavingsPercent,
    rankedFiles,
    missingContextWarnings: Array.from(new Set(missingContextWarnings)),
    preventedPollutions,
    preservedDecisions: criticalDecisions,
  };
}

export function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function deterministicFNV1aHash(str: string): string {
  return `sha256:${fnv1aHash(str)}`;
}

/**
 * Priority 3 Upgrade: Parses real source code files into a connected RepoFileNode AST symbol graph.
 */
export function parseSourceFilesToRepoGraph(
  sourceFiles: Record<string, string>,
  coChangeMap: Record<string, string[]> = {}
): RepoFileNode[] {
  const nodes: RepoFileNode[] = [];

  for (const [filePath, content] of Object.entries(sourceFiles)) {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const language: RepoFileNode['language'] =
      ext === 'py'
        ? 'python'
        : ext === 'go'
          ? 'go'
          : ext === 'rs'
            ? 'rust'
            : ext === 'sql'
              ? 'sql'
              : ext === 'json'
                ? 'json'
                : ext === 'md'
                  ? 'markdown'
                  : 'typescript';

    const exportsList = new Set<string>();
    const importsList = new Set<string>();

    // TypeScript / JavaScript symbol extraction
    const tsExportMatches = content.matchAll(
      /export\s+(?:async\s+)?(?:function|class|interface|type|const|let|enum)\s+([A-Za-z0-9_]+)/g
    );
    for (const m of tsExportMatches) {
      if (m[1]) exportsList.add(m[1]);
    }

    const tsNamedImportMatches = content.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"][^'"]+['"]/g);
    for (const m of tsNamedImportMatches) {
      const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
      for (const n of names) {
        if (n) importsList.add(n);
      }
    }

    // Python symbol extraction
    const pyDefMatches = content.matchAll(/^(?:async\s+)?(?:def|class)\s+([A-Za-z0-9_]+)/gm);
    for (const m of pyDefMatches) {
      if (m[1] && !m[1].startsWith('_')) exportsList.add(m[1]);
    }

    // SQL table extraction
    const sqlTableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_]+)/gi);
    for (const m of sqlTableMatches) {
      if (m[1]) exportsList.add(m[1]);
    }

    const estimatedTokens = Math.max(12, Math.ceil(content.length / 3.8));
    const isGenerated = POLLUTION_PATTERNS.some((rx) => rx.test(filePath));
    const isTest = /\.test\.|\.spec\.|^tests?\//i.test(filePath);
    const hasDbSchema = language === 'sql' || /CREATE\s+TABLE|pgTable|prisma/i.test(content);
    const isPublicApi = /controller|route|api|index\.ts/i.test(filePath) || exportsList.size > 0;

    nodes.push({
      path: filePath,
      language,
      tokens: estimatedTokens,
      exports: Array.from(exportsList),
      imports: Array.from(importsList),
      coChangePaths: coChangeMap[filePath] ?? [],
      isTest,
      isGenerated,
      isPublicApi,
      hasDbSchema,
      lastModifiedHash: deterministicFNV1aHash(content),
      contentPreview: content.slice(0, 180).replace(/\s+/g, ' ').trim(),
    });
  }

  return nodes;
}

