/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — SOURCE INSPECTOR  ·  AETHER Reverse Intelligence
 * (src/core/reverse/sourceInspector.ts)
 *
 * AST-based code analysis, import/export mapping, symbol extraction,
 * and complexity metrics for TypeScript/JavaScript source files.
 *
 * Inspiration: morluto/rea (MIT) — source code analysis workflow concepts
 */

import {
  AnalysisCategory,
  AuthCheckResult,
  PermissionGuard,
  ReverseEngineAuthorization,
} from './permissionGuard';
import { ApplicationFile } from './behaviorAnalyzer';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SymbolInfo {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'enum' | 'const' | 'let' | 'var' | 'import' | 'export';
  file: string;
  line: number;
  /** Parameters for functions, type parameters for generics */
  parameters?: string[];
  /** Export visibility */
  visibility: 'exported' | 'internal';
}

export interface ImportMapping {
  source: string;
  specifier: string;
  importedNames: string[];
  isTypeImport: boolean;
  importingFile: string;
}

export interface ExportMapping {
  name: string;
  sourceFile: string;
  isReexport: boolean;
  reexportSource?: string;
}

export interface ComplexityMetrics {
  /** Cyclomatic complexity per file */
  fileComplexity: Record<string, number>;
  /** Average complexity */
  averageComplexity: number;
  /** Max complexity */
  maxComplexity: number;
  /** Total lines of code (estimated) */
  totalLines: number;
  /** Total functions */
  totalFunctions: number;
  /** Total classes */
  totalClasses: number;
  /** Total interfaces */
  totalInterfaces: number;
  /** Maintainability index per file (simplified: 0-100) */
  maintainabilityIndex: Record<string, number>;
}

export interface SourceInspectionReport {
  targetId: string;
  authorization: ReverseEngineAuthorization;
  symbols: SymbolInfo[];
  imports: ImportMapping[];
  exports: ExportMapping[];
  complexity: ComplexityMetrics;
  inspectionSummary: string;
}

// ─── Source Inspector ─────────────────────────────────────────────────────────

export class SourceInspector {
  constructor(private readonly guard: PermissionGuard) {}

  /**
   * Inspect source files and extract symbols.
   */
  inspectSymbols(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): SymbolInfo[] {
    const check = this.guard.checkAuthorization(auth, 'AST_ANALYSIS');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied symbol inspection: ${check.reason}`);
    }

    const symbols: SymbolInfo[] = [];

    for (const file of files) {
      const src = file.path;
      const fileExports = new Set(file.exports);

      // Extract function declarations
      for (const fn of file.exports.filter((e) => /^[a-zA-Z_$][\w$]*$/.test(e))) {
        symbols.push({
          name: fn,
          kind: 'function',
          file: src,
          line: 1,
          visibility: fileExports.has(fn) ? 'exported' : 'internal',
        });
      }

      // Class-like exports
      for (const exp of file.exports) {
        if (/^[A-Z]/.test(exp)) {
          symbols.push({
            name: exp,
            kind: 'class',
            file: src,
            line: 1,
            visibility: 'exported',
          });
        }
      }

      // Inferred from file name patterns
      const baseName = src.split('/').pop()?.replace(/\.(ts|js|mjs|cjs)$/, '') ?? '';
      if (baseName && !file.exports.includes(baseName)) {
        // Check if baseName could be a class (PascalCase)
        if (/^[A-Z]/.test(baseName)) {
          symbols.push({
            name: baseName,
            kind: 'class',
            file: src,
            line: 1,
            visibility: 'exported',
          });
        }
      }
    }

    return symbols.sort((a, b) => a.name.localeCompare(b.name) || a.file.localeCompare(b.file));
  }

  /**
   * Build import mapping from file import lists.
   */
  mapImports(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): ImportMapping[] {
    const check = this.guard.checkAuthorization(auth, 'AST_ANALYSIS');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied import mapping: ${check.reason}`);
    }

    const mappings: ImportMapping[] = [];
    const seen = new Set<string>();

    for (const file of files) {
      for (const imp of file.imports) {
        const key = `${file.path}|${imp}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const isExternal = !imp.startsWith('.') && !imp.startsWith('/');
        const isTypeImport = this.isLikelyTypeImport(imp, file.exports);

        mappings.push({
          source: imp,
          specifier: imp,
          importedNames: this.extractImportedNames(imp),
          isTypeImport: isTypeImport || imp.startsWith('#') || imp.startsWith('@types/'),
          importingFile: file.path,
        });
      }
    }

    return mappings.sort((a, b) => a.importingFile.localeCompare(b.importingFile) || a.source.localeCompare(b.source));
  }

  /**
   * Build export mapping.
   */
  mapExports(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): ExportMapping[] {
    const check = this.guard.checkAuthorization(auth, 'AST_ANALYSIS');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied export mapping: ${check.reason}`);
    }

    const mappings: ExportMapping[] = [];
    const fileMap = new Map(files.map((f) => [f.path, f]));

    for (const file of files) {
      for (const exp of file.exports) {
        const isReexport = file.imports.some((i) =>
          i.replace(/^\.\/|^\.\.\//, '').replace(/\.(ts|js)$/, '') === exp ||
          i.endsWith(exp)
        );

        mappings.push({
          name: exp,
          sourceFile: file.path,
          isReexport,
          reexportSource: isReexport
            ? file.imports.find((i) =>
                i.replace(/^\.\/|^\.\.\//, '').replace(/\.(ts|js)$/, '') === exp ||
                i.endsWith(exp)
              )
            : undefined,
        });
      }
    }

    return mappings.sort((a, b) => a.name.localeCompare(b.name) || a.sourceFile.localeCompare(b.sourceFile));
  }

  /**
   * Compute complexity metrics from file data.
   */
  computeComplexity(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): ComplexityMetrics {
    const check = this.guard.checkAuthorization(auth, 'COMPLEXITY_METRICS');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied complexity computation: ${check.reason}`);
    }

    const fileComplexity: Record<string, number> = {};
    const maintainabilityIndex: Record<string, number> = {};
    let totalFunctions = 0;
    let totalClasses = 0;
    let totalInterfaces = 0;
    let totalLines = 0;
    let maxComplexity = 0;
    let totalComplexity = 0;

    for (const file of files) {
      const lines = this.estimateLines(file);
      totalLines += lines;

      const imports = file.imports.length;
      const exports = file.exports.length;
      const complexity = this.estimateCyclomaticComplexity(file);
      fileComplexity[file.path] = complexity;

      // Simplified maintainability index (0-100)
      const mi = Math.max(
        0,
        Math.min(100, Math.round(100 - complexity * 3 - (lines / 100)))
      );
      maintainabilityIndex[file.path] = mi;

      totalComplexity += complexity;
      maxComplexity = Math.max(maxComplexity, complexity);

      for (const exp of file.exports) {
        if (/^[A-Z]/.test(exp)) {
          totalClasses++;
        } else if (exp.toLowerCase().includes('interface') || exp.startsWith('I')) {
          totalInterfaces++;
        } else {
          totalFunctions++;
        }
      }
    }

    return {
      fileComplexity,
      averageComplexity: files.length > 0 ? Math.round(totalComplexity / files.length * 100) / 100 : 0,
      maxComplexity,
      totalLines,
      totalFunctions,
      totalClasses,
      totalInterfaces,
      maintainabilityIndex,
    };
  }

  /**
   * Run the full source inspection pipeline.
   */
  inspectAll(
    auth: ReverseEngineAuthorization,
    files: ApplicationFile[],
    targetId: string
  ): SourceInspectionReport {
    const symbols = this.inspectSymbols(auth, files, targetId);
    const imports = this.mapImports(auth, files, targetId);
    const exports = this.mapExports(auth, files, targetId);
    const complexity = this.computeComplexity(auth, files, targetId);

    return {
      targetId,
      authorization: auth,
      symbols,
      imports,
      exports,
      complexity,
      inspectionSummary: this.buildSummary(symbols, imports, exports, complexity),
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private isLikelyTypeImport(imp: string, exports: string[]): boolean {
    if (imp.startsWith('#') || imp.startsWith('@types/')) return true;
    if (/\.types$|\.d\.ts$/.test(imp)) return true;
    return false;
  }

  private extractImportedNames(imp: string): string[] {
    // For simple specifiers, return the specifier as a name
    if (!imp.includes('/')) return [imp];
    const segments = imp.split('/');
    return [segments[segments.length - 1]];
  }

  private estimateLines(file: ApplicationFile): number {
    // Rough estimate: average TS line is ~40 bytes
    return Math.max(1, Math.round(file.bytes / 40));
  }

  private estimateCyclomaticComplexity(file: ApplicationFile): number {
    // Simplified: based on number of imports + exports as a proxy
    // Real CC requires AST parsing, this is a proxy
    const base = 1; // single path
    const branchIndicators = file.exports.filter(
      (e) => /^(get|set|create|update|delete|find|list|validate|process|handle|render|fetch|post|put|patch)/.test(e)
    ).length;
    return base + branchIndicators;
  }

  private buildSummary(
    symbols: SymbolInfo[],
    imports: ImportMapping[],
    exports: ExportMapping[],
    complexity: ComplexityMetrics
  ): string {
    const lines: string[] = [];
    lines.push(`Source inspection: ${symbols.length} symbols, ${imports.length} imports, ${exports.length} exports.`);
    lines.push(`Complexity: avg ${complexity.averageComplexity}, max ${complexity.maxComplexity} across ${complexity.totalLines} estimated LOC.`);
    lines.push(`Detected: ${complexity.totalFunctions} functions, ${complexity.totalClasses} classes, ${complexity.totalInterfaces} interfaces.`);
    return lines.join(' ');
  }
}
