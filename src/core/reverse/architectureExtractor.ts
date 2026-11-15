/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 - ARCHITECTURE EXTRACTOR     AETHER Reverse Intelligence
 * (src/core/reverse/architectureExtractor.ts)
 *
 * Component dependency mapping, layer identification, module relationship graphs,
 * and design pattern detection from application source code.
 *
 * Inspiration: morluto/rea (MIT) - architecture extraction workflow concepts
 */

import {
  AnalysisCategory,
  AuthCheckResult,
  PermissionGuard,
  ReverseEngineAuthorization,
} from './permissionGuard';
import { ApplicationFile } from './behaviorAnalyzer';

// --- Types --------------------------------------------------------------------

export interface ModuleDependency {
  source: string;
  target: string;
  type: 'INTERNAL' | 'EXTERNAL';
}

export interface LayerInfo {
  name: string;
  description: string;
  files: string[];
  dependencies: string[];
  stability: number; // 0-1: lower = more volatile
}

export interface ModuleNode {
  id: string;
  exports: string[];
  imports: string[];
  depth: number; // distance from entry points
  fanIn: number;  // how many other modules import this one
  fanOut: number; // how many this module imports
  layer: string;
  isEntryPoint: boolean;
  isLeaf: boolean;
}

export interface ModuleEdge {
  source: string;
  target: string;
  type: 'internal' | 'external';
}

export interface ModuleGraph {
  nodes: ModuleNode[];
  edges: ModuleEdge[];
  cycles: string[][];
  stronglyConnectedComponents: string[][];
}

export type DesignPatternType =
  | 'SINGLETON'
  | 'FACTORY'
  | 'OBSERVER'
  | 'STRATEGY'
  | 'ADAPTER'
  | 'DECORATOR'
  | 'FACADE'
  | 'MIDDLEWARE_CHAIN'
  | 'REPOSITORY'
  | 'SERVICE_LAYER'
  | 'CONTROLLER'
  | 'UNKNOWN';

export interface DetectedPattern {
  pattern: DesignPatternType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  files: string[];
  evidence: string;
}

export interface ArchitectureReport {
  targetId: string;
  authorization: ReverseEngineAuthorization;
  layers: LayerInfo[];
  moduleGraph: ModuleGraph;
  detectedPatterns: DetectedPattern[];
  dependencies: ModuleDependency[];
  architectureSummary: string;
  complexityMetrics: {
    avgFanIn: number;
    avgFanOut: number;
    moduleCount: number;
    dependencyCount: number;
    layerCount: number;
    cycleCount: number;
    avgDepth: number;
  };
}

// --- Architecture Extractor ---------------------------------------------------

export class ArchitectureExtractor {
  constructor(private readonly guard: PermissionGuard) {}

  /**
   * Extract full architecture report from application files.
   */
  extractArchitecture(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): ArchitectureReport {
    const check = this.guard.checkAuthorization(auth, 'ARCHITECTURE_EXTRACTION');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied architecture extraction: ${check.reason}`);
    }

    const layers = this.identifyLayers(files);
    const moduleGraph = this.buildModuleGraph(files);
    const dependencies = this.extractDependencies(files);
    const detectedPatterns = this.detectDesignPatterns(files, moduleGraph);
    const complexityMetrics = this.computeComplexityMetrics(moduleGraph, layers, dependencies);

    return {
      targetId,
      authorization: auth,
      layers,
      moduleGraph,
      detectedPatterns,
      dependencies,
      architectureSummary: this.buildSummary(layers, moduleGraph, detectedPatterns, complexityMetrics),
      complexityMetrics,
    };
  }

  /**
   * Identify architectural layers from file structure.
   */
  identifyLayers(files: ApplicationFile[]): LayerInfo[] {
    const layerMap = new Map<string, ApplicationFile[]>();
    const layerMeta: Record<string, { description: string; keywords: string[] }> = {
      entry: { description: 'Application entry points', keywords: ['index.', 'main.', 'app.', 'bootstrap.'] },
      interface: {
        description: 'API controllers, routes, and handlers',
        keywords: ['route.', 'api.', 'controller.', 'endpoint.', 'handler.', 'middleware.'],
      },
      domain: {
        description: 'Business logic and domain services',
        keywords: ['service.', 'domain.', 'usecase.', 'business.', 'model.', 'entity.'],
      },
      data: {
        description: 'Data access, repositories, and persistence',
        keywords: ['repo.', 'repository.', 'dao.', 'db.', 'database.', 'migration.', 'seed.'],
      },
      infrastructure: {
        description: 'Infrastructure, external integrations',
        keywords: ['client.', 'adapter.', 'gateway.', 'connector.', 'provider.'],
      },
      utility: {
        description: 'Shared utilities and helpers',
        keywords: ['util.', 'helper.', 'common.', 'lib.', 'shared.'],
      },
      config: {
        description: 'Configuration and environment setup',
        keywords: ['config.', 'env.', 'setup.', 'bootstrap.'],
      },
      test: {
        description: 'Test files',
        keywords: ['.test.', '.spec.', '/test/', '/tests/', '__tests__/'],
      },
    };

    for (const f of files) {
      let assigned = false;
      const lower = f.path.toLowerCase();

      for (const [layerName, meta] of Object.entries(layerMeta)) {
        for (const kw of meta.keywords) {
          if (lower.includes(kw)) {
            layerMap.set(layerName, [...(layerMap.get(layerName) ?? []), f]);
            assigned = true;
            break;
          }
        }
        if (assigned) break;
      }

      if (!assigned) {
        layerMap.set('uncategorized', [...(layerMap.get('uncategorized') ?? []), f]);
      }
    }

    return [...layerMap.entries()]
      .filter(([, fileList]) => fileList.length > 0)
      .map(([name, fileList]) => ({
        name,
        description: layerMeta[name]?.description ?? 'Uncategorized files',
        files: fileList.map((f) => f.path).sort(),
        dependencies: [...new Set(fileList.flatMap((f) => f.imports))],
        stability: this.computeLayerStability(fileList, files),
      }))
      .sort((a, b) => b.files.length - a.files.length);
  }

  /**
   * Build a module dependency graph.
   */
  buildModuleGraph(files: ApplicationFile[]): ModuleGraph {
    const pathToFile = new Map(files.map((f) => [f.path, f]));
    const nodes: ModuleNode[] = [];
    const edges: ModuleEdge[] = [];
    const fanIn = new Map<string, number>();
    const fanOut = new Map<string, number>();

    // Initialize fan counts
    for (const f of files) {
      fanIn.set(f.path, 0);
      fanOut.set(f.path, 0);
    }

    // Calculate fan-out and fan-in
    for (const f of files) {
      for (const imp of f.imports) {
        const isExternal = !imp.startsWith('.') && !imp.startsWith('/');
        const target = this.resolveImportPath(imp, f.path);
        if (pathToFile.has(target)) {
          fanOut.set(f.path, (fanOut.get(f.path) ?? 0) + 1);
          fanIn.set(target, (fanIn.get(target) ?? 0) + 1);
          edges.push({ source: f.path, target, type: 'internal' });
        } else if (isExternal) {
          fanOut.set(f.path, (fanOut.get(f.path) ?? 0) + 1);
          edges.push({ source: f.path, target: imp, type: 'external' });
        }
      }
    }

    // Build nodes
    const entryPoints = this.findEntryPoints(files);
    const depth = this.computeDepths(files, entryPoints);

    for (const f of files) {
      nodes.push({
        id: f.path,
        exports: f.exports,
        imports: f.imports,
        depth: depth.get(f.path) ?? 0,
        fanIn: fanIn.get(f.path) ?? 0,
        fanOut: fanOut.get(f.path) ?? 0,
        layer: this.inferLayer(f),
        isEntryPoint: entryPoints.has(f.path),
        isLeaf: (fanOut.get(f.path) ?? 0) === 0,
      });
    }

    const { cycles, stronglyConnectedComponents } = this.detectCycles(nodes, edges);

    return {
      nodes: nodes.sort((a, b) => b.fanIn - a.fanIn),
      edges: edges.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target)),
      cycles,
      stronglyConnectedComponents,
    };
  }

  /**
   * Extract module dependencies.
   */
  extractDependencies(files: ApplicationFile[]): ModuleDependency[] {
    const deps: ModuleDependency[] = [];
    const seen = new Set<string>();
    const pathSet = new Set(files.map((f) => f.path));

    for (const f of files) {
      for (const imp of f.imports) {
        const key = `${f.path}->${imp}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const resolved = this.resolveImportPath(imp, f.path);
        if (pathSet.has(resolved)) {
          deps.push({ source: f.path, target: resolved, type: 'INTERNAL' });
        } else if (!imp.startsWith('.') && !imp.startsWith('/')) {
          deps.push({ source: f.path, target: imp, type: 'EXTERNAL' });
        }
      }
    }

    return deps;
  }

  /**
   * Detect common design patterns.
   */
  detectDesignPatterns(
    files: ApplicationFile[],
    graph: ModuleGraph
  ): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Middleware chain pattern: express/fastify app that imports middleware modules
    const hasMiddlewareChain = files.some((f) =>
      f.imports.some((i) => /^(express|fastify|koa|hapi)$/.test(i))
    );
    if (hasMiddlewareChain) {
      const middlewareFiles = files.filter((f) =>
        /middleware/.test(f.path) || f.exports.some((e) => /^use$|^apply$|^middleware$/.test(e))
      );
      patterns.push({
        pattern: 'MIDDLEWARE_CHAIN',
        confidence: middlewareFiles.length > 0 ? 'HIGH' : 'MEDIUM',
        files: middlewareFiles.map((f) => f.path),
        evidence: 'HTTP framework detected (express/fastify) with middleware configuration',
      });
    }

    // Repository pattern: files named repository/repo that import data modules
    const repoFiles = files.filter((f) => /(repo|repository)/.test(f.path));
    const repoWithDb = repoFiles.filter((f) => f.imports.some((i) => /(db|database|pg|mysql|mongo)/.test(i)));
    if (repoWithDb.length > 0) {
      patterns.push({
        pattern: 'REPOSITORY',
        confidence: 'HIGH',
        files: repoWithDb.map((f) => f.path),
        evidence: 'Repository modules identified with database imports',
      });
    }

    // Service layer pattern: service files that import repositories
    const serviceFiles = files.filter((f) => /service/.test(f.path));
    const serviceWithRepo = serviceFiles.filter((f) =>
      f.imports.some((i) => /(repo|repository|db)/.test(i))
    );
    if (serviceWithRepo.length > 0) {
      patterns.push({
        pattern: 'SERVICE_LAYER',
        confidence: 'HIGH',
        files: serviceWithRepo.map((f) => f.path),
        evidence: 'Service layer modules import repositories',
      });
    }

    // Controller pattern: controller files that import services
    const controllerFiles = files.filter((f) => /(controller|handler|route)/.test(f.path));
    const controllerWithService = controllerFiles.filter((f) =>
      f.imports.some((i) => /service/.test(i))
    );
    if (controllerWithService.length > 0) {
      patterns.push({
        pattern: 'CONTROLLER',
        confidence: 'HIGH',
        files: controllerWithService.map((f) => f.path),
        evidence: 'Controller modules import service layer',
      });
    }

    // Factory pattern: files with factory-related exports
    const factoryFiles = files.filter((f) =>
      f.exports.some((e) => /factory|create|build|make/.test(e))
    );
    if (factoryFiles.length > 0) {
      patterns.push({
        pattern: 'FACTORY',
        confidence: 'MEDIUM',
        files: factoryFiles.map((f) => f.path),
        evidence: 'Factory-like export names detected',
      });
    }

    // Singleton pattern: single file exported by many, exports a single instance
    const singletonCandidates = graph.nodes.filter((n) => n.fanIn >= 3 && n.exports.length <= 2);
    if (singletonCandidates.length > 0) {
      patterns.push({
        pattern: 'SINGLETON',
        confidence: singletonCandidates.length === 1 ? 'HIGH' : 'LOW',
        files: singletonCandidates.slice(0, 3).map((n) => n.id),
        evidence: 'Modules with high fan-in and few exports suggest shared instances',
      });
    }

    // Facade pattern: single file that imports many modules and re-exports
    const facadeCandidates = graph.nodes.filter(
      (n) => n.fanOut >= 3 && n.exports.length >= 2 && n.isEntryPoint
    );
    if (facadeCandidates.length > 0) {
      patterns.push({
        pattern: 'FACADE',
        confidence: 'MEDIUM',
        files: facadeCandidates.slice(0, 3).map((n) => n.id),
        evidence: 'Entry point modules with many imports and re-exports suggest facade pattern',
      });
    }

    return patterns;
  }

  /**
   * Compute complexity metrics.
   */
  computeComplexityMetrics(
    graph: ModuleGraph,
    layers: LayerInfo[],
    deps: ModuleDependency[]
  ) {
    const avgFanIn =
      graph.nodes.length > 0
        ? graph.nodes.reduce((s, n) => s + n.fanIn, 0) / graph.nodes.length
        : 0;
    const avgFanOut =
      graph.nodes.length > 0
        ? graph.nodes.reduce((s, n) => s + n.fanOut, 0) / graph.nodes.length
        : 0;
    const avgDepth =
      graph.nodes.length > 0
        ? graph.nodes.reduce((s, n) => s + n.depth, 0) / graph.nodes.length
        : 0;

    return {
      avgFanIn: Math.round(avgFanIn * 100) / 100,
      avgFanOut: Math.round(avgFanOut * 100) / 100,
      moduleCount: graph.nodes.length,
      dependencyCount: deps.length,
      layerCount: layers.length,
      cycleCount: graph.cycles.length,
      avgDepth: Math.round(avgDepth * 100) / 100,
    };
  }

  // --- Private helpers -------------------------------------------------------

  private inferLayer(f: ApplicationFile): string {
    const lower = f.path.toLowerCase();
    if (/\.test\.|\.spec\.|(^|\/)(test|tests|__tests__)\//.test(lower)) return 'test';
    if (/(route|api|controller|endpoint|handler|middleware)/.test(lower)) return 'interface';
    if (/(repo|repository|dao|db|database|migration)/.test(lower)) return 'data';
    if (/(service|domain|usecase|business|model|entity)/.test(lower)) return 'domain';
    if (/(client|adapter|gateway|connector|provider)/.test(lower)) return 'infrastructure';
    if (/(util|helper|common|lib|shared)/.test(lower)) return 'utility';
    if (/(config|env|setup)/.test(lower)) return 'config';
    return 'entry';
  }

  private findEntryPoints(files: ApplicationFile[]): Set<string> {
    const importedBy = new Map<string, string[]>();
    for (const f of files) importedBy.set(f.path, []);

    for (const f of files) {
      for (const imp of f.imports) {
        const target = this.resolveImportPath(imp, f.path);
        const existing = importedBy.get(target);
        if (existing) existing.push(f.path);
      }
    }

    const entryPoints = new Set<string>();
    for (const f of files) {
      if (f.imports.length > 0 && importedBy.get(f.path)!.length === 0) {
        entryPoints.add(f.path);
      }
    }

    if (entryPoints.size === 0 && files.length > 0) {
      // Fallback: files that look like entry points
      for (const f of files) {
        if (/^(index|main|app|bootstrap)\./.test(f.path)) {
          entryPoints.add(f.path);
        }
      }
    }

    return entryPoints;
  }

  private computeDepths(
    files: ApplicationFile[],
    entryPoints: Set<string>
  ): Map<string, number> {
    const pathToFile = new Map(files.map((f) => [f.path, f]));
    const depth = new Map<string, number>();
    const queue: string[] = [...entryPoints];

    for (const ep of entryPoints) depth.set(ep, 0);

    // BFS from entry points
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDepth = depth.get(current) ?? 0;
      const file = pathToFile.get(current);

      if (file) {
        for (const imp of file.imports) {
          const resolved = this.resolveImportPath(imp, current);
          if (pathToFile.has(resolved) && !depth.has(resolved)) {
            depth.set(resolved, currentDepth + 1);
            queue.push(resolved);
          }
        }
      }
    }

    return depth;
  }

  private detectCycles(
    nodes: ModuleNode[],
    edges: ModuleEdge[]
  ): { cycles: string[][]; stronglyConnectedComponents: string[][] } {
    const nodeIds = new Set(nodes.map((n) => n.id));
    const adj = new Map<string, string[]>();
    for (const n of nodes) adj.set(n.id, []);

    for (const e of edges) {
      if (e.type === 'internal' && nodeIds.has(e.source) && nodeIds.has(e.target)) {
        adj.get(e.source)!.push(e.target);
      }
    }

    const cycles: string[][] = [];
    const sccs: string[][] = [];

    // Tarjan's SCC algorithm
    let indexCounter = 0;
    const stack: string[] = [];
    const onStack = new Set<string>();
    const indices = new Map<string, number>();
    const lowlink = new Map<string, number>();

    const strongConnect = (v: string): void => {
      indices.set(v, indexCounter);
      lowlink.set(v, indexCounter);
      indexCounter++;
      stack.push(v);
      onStack.add(v);

      for (const w of adj.get(v) ?? []) {
        if (!indices.has(w)) {
          strongConnect(w);
          lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
        } else if (onStack.has(w)) {
          lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
        }
      }

      if (lowlink.get(v) === indices.get(v)) {
        const component: string[] = [];
        let w: string;
        do {
          w = stack.pop()!;
          onStack.delete(w);
          component.push(w);
        } while (w !== v);
        sccs.push(component);
      }
    };

    for (const n of nodes) {
      if (!indices.has(n.id)) {
        strongConnect(n.id);
      }
    }

    // Filter SCCs with size > 1 as cycles
    for (const scc of sccs) {
      if (scc.length > 1) {
        cycles.push(scc);
      }
    }

    return { cycles, stronglyConnectedComponents: sccs };
  }

  private computeLayerStability(fileList: ApplicationFile[], allFiles: ApplicationFile[]): number {
    const fileSet = new Set(fileList.map((f) => f.path));
    const importsInside = fileList.reduce((s, f) => {
      return s + f.imports.filter((i) => {
        const resolved = this.resolveImportPath(i, f.path);
        return fileSet.has(resolved);
      }).length;
    }, 0);

    const totalImports = fileList.reduce((s, f) => s + f.imports.length, 0);
    if (totalImports === 0) return 1.0;
    return Math.round((importsInside / totalImports) * 100) / 100;
  }

  private buildSummary(
    layers: LayerInfo[],
    graph: ModuleGraph,
    patterns: DetectedPattern[],
    metrics: ArchitectureReport['complexityMetrics']
  ): string {
    const lines: string[] = [];
    lines.push(`Architecture extracted: ${metrics.moduleCount} modules across ${metrics.layerCount} layers.`);
    lines.push(`${metrics.dependencyCount} dependencies, avg fan-in ${metrics.avgFanIn}, avg fan-out ${metrics.avgFanOut}.`);
    if (graph.cycles.length > 0) {
      lines.push(`Warning: ${graph.cycles.length} circular dependency cycle(s) detected.`);
    }
    if (patterns.length > 0) {
      lines.push(`Design patterns detected: ${patterns.map((p) => p.pattern).join(', ')}.`);
    }
    return lines.join(' ');
  }

  private resolveImportPath(imp: string, fromFile: string): string {
    if (imp.startsWith('.') || imp.startsWith('/')) {
      const fromDir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/')) : '.';
      let resolved = imp;
      // Remove leading ./ or ../
      if (resolved.startsWith('./')) resolved = resolved.slice(2);
      while (resolved.startsWith('../')) {
        const parent = fromDir.includes('/') ? fromDir.slice(0, fromDir.lastIndexOf('/')) : '';
        resolved = parent ? `${parent}/${resolved.slice(3)}` : resolved.slice(3);
      }
      if (fromDir !== '.' && !resolved.startsWith('/')) {
        resolved = fromDir ? `${fromDir}/${resolved}` : resolved;
      }
      // Try with extensions
      return resolved;
    }
    return imp;
  }
}
