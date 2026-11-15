/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — BEHAVIOR ANALYZER  ·  AETHER Reverse Intelligence
 * (src/core/reverse/behaviorAnalyzer.ts)
 *
 * Application Behavior Analysis: static analysis of application structure,
 * runtime behavior observation (from captured traces), API endpoint discovery,
 * and data flow tracing.
 *
 * Inspiration: morluto/rea (MIT) — behavior analysis workflow concepts
 */

import {
  AnalysisCategory,
  AuthCheckResult,
  PermissionGuard,
  ReverseEngineAuthorization,
} from './permissionGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApplicationFile {
  path: string;
  imports: string[];
  exports: string[];
  bytes: number;
  language: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  path: string;
  /** Handler source file (inferred) */
  handlerFile?: string;
  /** Whether the endpoint takes parameters */
  hasParameters: boolean;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: string;
}

export interface DataFlowTrace {
  /** Source identifier (e.g. file path or symbol) */
  source: string;
  /** Intermediate transforms observed */
  transforms: string[];
  /** Sink identifier */
  sink: string;
  /** Data type category */
  dataType: 'USER_INPUT' | 'DATABASE' | 'FILE' | 'NETWORK' | 'INTERNAL';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RuntimeTrace {
  timestamp: string;
  entryPoint: string;
  calls: string[];
  /** Observed external interactions */
  interactions: {
    type: 'HTTP_REQUEST' | 'FILE_READ' | 'FILE_WRITE' | 'DATABASE_QUERY' | 'PROCESS_SPAWN' | 'ENV_READ';
    target: string;
  }[];
}

export interface StaticStructureAnalysis {
  fileCount: number;
  totalBytes: number;
  languageDistribution: Record<string, number>;
  avgFileBytes: number;
  largestFiles: { path: string; bytes: number }[];
  /** Files with no imports (potential entry points) */
  unimportedFiles: string[];
  /** Files imported by many others (potential core modules) */
  highCentralityFiles: { path: string; importCount: number }[];
}

export interface BehaviorAnalysisReport {
  targetId: string;
  authorization: ReverseEngineAuthorization;
  staticAnalysis: StaticStructureAnalysis;
  apiEndpoints: ApiEndpoint[];
  dataFlows: DataFlowTrace[];
  runtimeTraces: RuntimeTrace[];
  behaviorSummary: string;
}

// ─── Behavior Analyzer ────────────────────────────────────────────────────────

export class BehaviorAnalyzer {
  constructor(private readonly guard: PermissionGuard) {}

  /**
   * Perform static structure analysis on a set of application files.
   */
  analyzeStaticStructure(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): StaticStructureAnalysis {
    const check = this.guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied static analysis: ${check.reason}`);
    }

    const totalBytes = files.reduce((s, f) => s + f.bytes, 0);
    const languageDistribution: Record<string, number> = {};
    for (const f of files) {
      languageDistribution[f.language] = (languageDistribution[f.language] || 0) + 1;
    }

    const sortedByBytes = [...files].sort((a, b) => b.bytes - a.bytes);
    const importCounts = new Map<string, number>();
    for (const f of files) {
      for (const imp of f.imports) {
        importCounts.set(imp, (importCounts.get(imp) ?? 0) + 1);
      }
    }

    return {
      fileCount: files.length,
      totalBytes,
      languageDistribution,
      avgFileBytes: files.length > 0 ? Math.round(totalBytes / files.length) : 0,
      largestFiles: sortedByBytes.slice(0, 10).map((f) => ({ path: f.path, bytes: f.bytes })),
      unimportedFiles: files
        .filter((f) => f.imports.length === 0)
        .map((f) => f.path)
        .sort(),
      highCentralityFiles: [...importCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, importCount]) => ({ path, importCount })),
    };
  }

  /**
   * Discover API endpoints from source code patterns.
   * Looks for common routing patterns in import names and file paths.
   */
  discoverApiEndpoints(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): ApiEndpoint[] {
    const check = this.guard.checkAuthorization(auth, 'API_DISCOVERY');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied API discovery: ${check.reason}`);
    }

    const endpoints: ApiEndpoint[] = [];
    const routeFiles = files.filter((f) =>
      /(route|api|controller|endpoint|handler|server)\./.test(f.path)
    );

    for (const rf of routeFiles) {
      const routeKeywords = this.extractRouteKeywords(rf.exports);
      const pathBase = this.inferPathBase(rf.path);

      for (const kw of routeKeywords) {
        const methods = this.inferHttpMethods(rf, kw);
        for (const method of methods) {
          endpoints.push({
            method,
            path: `${pathBase}/${kw}`,
            handlerFile: rf.path,
            hasParameters: this.hasPathParameters(kw),
            confidence: method === 'GET' ? 'HIGH' : 'MEDIUM',
            evidence: `Inferred from export name "${kw}" in ${rf.path}`,
          });
        }
      }
    }

    return endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  }

  /**
   * Trace data flows from likely inputs through to outputs.
   */
  traceDataFlows(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): DataFlowTrace[] {
    const check = this.guard.checkAuthorization(auth, 'DATA_FLOW_TRACING');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied data flow tracing: ${check.reason}`);
    }

    const flows: DataFlowTrace[] = [];
    const pathToFile = new Map(files.map((f) => [f.path, f]));

    // Find files that import external modules (likely sources or processing)
    const externalImporters = files.filter((f) =>
      f.imports.some((i) => !i.startsWith('.') && !i.startsWith('/'))
    );

    for (const source of externalImporters) {
      const externalImports = source.imports.filter(
        (i) => !i.startsWith('.') && !i.startsWith('/')
      );
      for (const extImp of externalImports) {
        // Find files that import this source file
        const consumers = files.filter(
          (f) => f.path !== source.path && f.imports.some((imp) => this.pathMatches(imp, source.path))
        );

        for (const consumer of consumers) {
          // Infer data type from import names
          const dataType = this.inferDataType(source.imports, consumer.imports);

          flows.push({
            source: source.path,
            transforms: [...new Set([...source.exports, ...externalImports])].slice(0, 5),
            sink: consumer.path,
            dataType,
            confidence: consumer.imports.length > 0 ? 'MEDIUM' : 'LOW',
          });
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return flows.filter((f) => {
      const key = `${f.source}->${f.sink}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Simulate runtime traces from static analysis.
   * This is a best-effort reconstruction from observed structure.
   */
  simulateRuntimeTraces(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): RuntimeTrace[] {
    const check = this.guard.checkAuthorization(auth, 'RUNTIME_OBSERVATION');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied runtime observation: ${check.reason}`);
    }

    const traces: RuntimeTrace[] = [];

    // Identify potential entry points
    const entryCandidates = files.filter(
      (f) => f.imports.length > 0 && f.exports.length > 0
    );

    for (const entry of entryCandidates.slice(0, 5)) {
      const interactions: RuntimeTrace['interactions'] = [];

      // Infer interactions from imports
      for (const imp of entry.imports) {
        if (/^(express|fastify|koa|hapi|http|https|restify)/.test(imp)) {
          interactions.push({ type: 'HTTP_REQUEST', target: imp });
        } else if (/^(pg|mysql|mongodb|redis|sqlite|knex|prisma|drizzle)/.test(imp)) {
          interactions.push({ type: 'DATABASE_QUERY', target: imp });
        } else if (/^(fs|path|os|child_process)/.test(imp)) {
          interactions.push({ type: 'FILE_READ', target: imp });
        } else if (/^(axios|fetch|node-fetch|got|superagent|undici)/.test(imp)) {
          interactions.push({ type: 'HTTP_REQUEST', target: imp });
        } else if (/^(dotenv|config|env)/.test(imp)) {
          interactions.push({ type: 'ENV_READ', target: imp });
        }
      }

      if (interactions.length > 0) {
        traces.push({
          timestamp: new Date().toISOString(),
          entryPoint: entry.path,
          calls: entry.exports,
          interactions,
        });
      }
    }

    return traces;
  }

  /**
   * Run the full behavior analysis pipeline.
   */
  runFullAnalysis(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): BehaviorAnalysisReport {
    const staticAnalysis = this.analyzeStaticStructure(auth, files, targetId);
    const apiEndpoints = this.discoverApiEndpoints(auth, files, targetId);
    const dataFlows = this.traceDataFlows(auth, files, targetId);
    const runtimeTraces = this.simulateRuntimeTraces(auth, files, targetId);

    return {
      targetId,
      authorization: auth,
      staticAnalysis,
      apiEndpoints,
      dataFlows,
      runtimeTraces,
      behaviorSummary: this.buildBehaviorSummary(staticAnalysis, apiEndpoints, dataFlows, runtimeTraces),
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private doCheck(auth: ReverseEngineAuthorization, category: AnalysisCategory): AuthCheckResult {
    return this.guard.checkAuthorization(auth, category);
  }

  private extractRouteKeywords(exports: string[]): string[] {
    const keywords: string[] = [];
    for (const exp of exports) {
      const lower = exp.toLowerCase();
      if (/^(get|post|put|patch|delete|head|options)\w*$/.test(exp)) {
        const routeName = lower
          .replace(/^(get|post|put|patch|delete|head|options)/, '')
          .replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
        keywords.push(routeName || lower);
      }
    }
    return keywords;
  }

  private inferPathBase(filePath: string): string {
    const parts = filePath.split('/');
    const routeIdx = parts.findIndex((p) => /route|api|endpoint|controller/.test(p));
    if (routeIdx >= 0 && routeIdx + 1 < parts.length) {
      return parts.slice(0, routeIdx + 1).join('/');
    }
    const segments = filePath.split('/').slice(0, -1);
    return segments.join('/') || 'api';
  }

  private inferHttpMethods(file: ApplicationFile, keyword: string): Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> {
    const methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> = [];
    const lower = keyword.toLowerCase();

    if (lower.startsWith('get') || lower.startsWith('list') || lower.startsWith('fetch') || lower.startsWith('find')) {
      methods.push('GET');
    }
    if (lower.startsWith('create') || lower.startsWith('add') || lower.startsWith('new') || lower.startsWith('post')) {
      methods.push('POST');
    }
    if (lower.startsWith('update') || lower.startsWith('edit') || lower.startsWith('put')) {
      methods.push('PUT');
    }
    if (lower.startsWith('patch') || lower.startsWith('modify')) {
      methods.push('PATCH');
    }
    if (lower.startsWith('delete') || lower.startsWith('remove') || lower.startsWith('destroy')) {
      methods.push('DELETE');
    }

    if (methods.length === 0) methods.push('GET');
    return methods;
  }

  private hasPathParameters(keyword: string): boolean {
    return /:\w+|\/id\b|\/:\w+/.test(keyword) || keyword.includes('byId') || keyword.includes('byid');
  }

  private pathMatches(imp: string, target: string): boolean {
    const cleanImp = imp.replace(/^\.\/|^\.\.\//, '').replace(/\.(ts|js|mjs|cjs)$/, '');
    const cleanTarget = target.replace(/\.(ts|js|mjs|cjs)$/, '');
    return cleanImp === cleanTarget || cleanImp.endsWith(cleanTarget) || cleanTarget.endsWith(cleanImp);
  }

  private inferDataType(sourceImports: string[], consumerImports: string[]): DataFlowTrace['dataType'] {
    const allImports = [...sourceImports, ...consumerImports];
    if (allImports.some((i) => /^(pg|mysql|mongodb|redis|sqlite|knex|prisma|drizzle)/.test(i))) return 'DATABASE';
    if (allImports.some((i) => /^(fs|path|os)/.test(i))) return 'FILE';
    if (allImports.some((i) => /^(axios|fetch|node-fetch|got)/.test(i))) return 'NETWORK';
    return 'INTERNAL';
  }

  private buildBehaviorSummary(
    staticAnalysis: StaticStructureAnalysis,
    apiEndpoints: ApiEndpoint[],
    dataFlows: DataFlowTrace[],
    runtimeTraces: RuntimeTrace[]
  ): string {
    const lines: string[] = [];
    lines.push(`Analyzed ${staticAnalysis.fileCount} files (${(staticAnalysis.totalBytes / 1024).toFixed(1)} KB) across ${Object.keys(staticAnalysis.languageDistribution).length} language(s).`);
    lines.push(`Discovered ${apiEndpoints.length} API endpoint(s) (${apiEndpoints.filter((e) => e.confidence === 'HIGH').length} high-confidence).`);
    lines.push(`Traced ${dataFlows.length} data flow(s) between modules.`);
    lines.push(`Reconstructed ${runtimeTraces.length} runtime trace(s) from static evidence.`);
    if (staticAnalysis.unimportedFiles.length > 0) {
      lines.push(`Potential entry points (not imported by others): ${staticAnalysis.unimportedFiles.slice(0, 5).join(', ')}.`);
    }
    return lines.join(' ');
  }
}
