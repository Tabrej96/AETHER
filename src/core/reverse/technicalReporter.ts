/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — TECHNICAL REPORTER  ·  AETHER Reverse Intelligence
 * (src/core/reverse/technicalReporter.ts)
 *
 * Generates structured analysis reports in Markdown and JSON formats,
 * with vulnerability flags and text-based architecture diagrams.
 *
 * Inspiration: morluto/rea (MIT) — automated reporting workflow concepts
 */

import {
  AnalysisCategory,
  AuthCheckResult,
  PermissionGuard,
  ReverseEngineAuthorization,
} from './permissionGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportFormat = 'MARKDOWN' | 'JSON' | 'TEXT';

export interface VulnerabilityFlag {
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  description: string;
  location: string;
  recommendation: string;
  cweId?: string;
}

export interface ArchitectureDiagram {
  title: string;
  /** ASCII-art style diagram */
  diagram: string;
  nodes: string[];
  edges: { from: string; to: string }[];
}

export interface TechnicalReport {
  title: string;
  generatedAt: string;
  targetId: string;
  authorization: ReverseEngineAuthorization;
  summary: string;
  sections: ReportSection[];
  vulnerabilities: VulnerabilityFlag[];
  diagrams: ArchitectureDiagram[];
}

export interface ReportSection {
  heading: string;
  content: string;
  level: 1 | 2 | 3;
}

// ─── Technical Reporter ───────────────────────────────────────────────────────

export class TechnicalReporter {
  constructor(private readonly guard: PermissionGuard) {}

  /**
   * Generate a technical report from analysis data.
   */
  generateReport(
    auth: ReverseEngineAuthorization,
    targetId: string,
    data: {
      summary: string;
      filesAnalyzed: number;
      modules: string[];
      dependencies: { source: string; target: string; type: string }[];
      layers: { name: string; files: string[] }[];
      patterns: { pattern: string; confidence: string; files: string[] }[];
      complexity: {
        avgComplexity: number;
        maxComplexity: number;
        totalLines: number;
      };
      vulnerabilities?: VulnerabilityFlag[];
    }
  ): TechnicalReport {
    const check = this.guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
    if (!check.authorized) {
      throw new Error(`PermissionGuard denied report generation: ${check.reason}`);
    }

    const now = new Date().toISOString();
    const sections: ReportSection[] = [
      { heading: 'Executive Summary', content: data.summary, level: 1 },
      {
        heading: 'Scope',
        content: `Target: ${targetId}. ${data.filesAnalyzed} files analyzed.`,
        level: 2,
      },
      {
        heading: 'Architecture Layers',
        content: data.layers
          .map((l) => `- **${l.name}**: ${l.files.length} file(s)`)
          .join('\n'),
        level: 2,
      },
      {
        heading: 'Module Inventory',
        content: data.modules.map((m) => `- \`${m}\``).join('\n'),
        level: 2,
      },
      {
        heading: 'Design Patterns',
        content:
          data.patterns.length > 0
            ? data.patterns
                .map(
                  (p) =>
                    `- **${p.pattern}** (${p.confidence}): ${p.files.map((f) => `\`${f}\``).join(', ')}`
                )
                .join('\n')
            : 'No design patterns detected.',
        level: 2,
      },
      {
        heading: 'Complexity Metrics',
        content: `- Average complexity: ${data.complexity.avgComplexity}\n- Max complexity: ${data.complexity.maxComplexity}\n- Estimated LOC: ${data.complexity.totalLines}`,
        level: 2,
      },
    ];

    const diagrams = this.generateDiagrams(data);

    return {
      title: `Technical Analysis Report — ${targetId}`,
      generatedAt: now,
      targetId,
      authorization: auth,
      summary: data.summary,
      sections,
      vulnerabilities: data.vulnerabilities ?? this.detectVulnerabilities(data),
      diagrams,
    };
  }

  /**
   * Render a report to a specific format.
   */
  render(report: TechnicalReport, format: ReportFormat): string {
    switch (format) {
      case 'MARKDOWN':
        return this.renderMarkdown(report);
      case 'JSON':
        return JSON.stringify(report, null, 2);
      case 'TEXT':
        return this.renderText(report);
    }
  }

  /**
   * Generate text-based architecture diagrams.
   */
  generateDiagrams(data: {
    modules: string[];
    dependencies: { source: string; target: string; type: string }[];
    layers: { name: string; files: string[] }[];
  }): ArchitectureDiagram[] {
    const diagrams: ArchitectureDiagram[] = [];

    // Layer diagram
    const layerDiagram = this.renderLayerDiagram(data.layers);
    diagrams.push({
      title: 'Layer Architecture',
      diagram: layerDiagram,
      nodes: data.layers.map((l) => l.name),
      edges: data.dependencies
        .filter((d) => d.type === 'INTERNAL')
        .map((d) => ({ from: d.source, to: d.target })),
    });

    // Dependency flow diagram (top modules only)
    const topDeps = data.dependencies
      .filter((d) => d.type === 'INTERNAL')
      .slice(0, 20);
    const flowDiagram = this.renderFlowDiagram(data.modules, topDeps);
    diagrams.push({
      title: 'Module Dependency Flow',
      diagram: flowDiagram,
      nodes: data.modules.slice(0, 15),
      edges: topDeps.map((d) => ({ from: d.source, to: d.target })),
    });

    return diagrams;
  }

  /**
   * Detect potential vulnerabilities from analysis data.
   */
  detectVulnerabilities(data: {
    dependencies: { source: string; target: string; type: string }[];
    layers: { name: string; files: string[] }[];
  }): VulnerabilityFlag[] {
    const flags: VulnerabilityFlag[] = [];

    // Check for high fan-in modules (potential single point of failure)
    const depCounts = new Map<string, number>();
    for (const d of data.dependencies) {
      if (d.type === 'INTERNAL') {
        depCounts.set(d.target, (depCounts.get(d.target) ?? 0) + 1);
      }
    }

    for (const [module, count] of depCounts) {
      if (count >= 5) {
        flags.push({
          severity: 'MEDIUM',
          category: 'ARCHITECTURAL',
          description: `Module \`${module}\` is depended on by ${count} other modules. It is a single point of failure.`,
          location: module,
          recommendation: 'Consider adding redundancy, caching, or fallback mechanisms.',
        });
      }
    }

    // Check for untested modules
    const testLayer = data.layers.find((l) => l.name === 'test');
    const untestedCount = data.layers
      .filter((l) => l.name !== 'test')
      .reduce((s, l) => s + l.files.length, 0);

    if (testLayer && testLayer.files.length < untestedCount * 0.5) {
      flags.push({
        severity: 'LOW',
        category: 'TEST_COVERAGE',
        description: `Test coverage may be insufficient: ${testLayer.files.length} test file(s) for ${untestedCount} implementation file(s).`,
        location: 'project-wide',
        recommendation: 'Add unit tests for critical modules.',
      });
    }

    // Check for missing security layer
    const hasSecurityLayer = data.layers.some(
      (l) => /(security|auth|middleware|guard)/.test(l.name)
    );
    if (!hasSecurityLayer) {
      flags.push({
        severity: 'MEDIUM',
        category: 'SECURITY',
        description: 'No explicit security/auth layer detected in the architecture.',
        location: 'project-wide',
        recommendation: 'Implement authentication, authorization, and input validation layers.',
      });
    }

    return flags;
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  private renderMarkdown(report: TechnicalReport): string {
    const lines: string[] = [];
    lines.push(`# ${report.title}`);
    lines.push('');
    lines.push(`**Generated:** ${report.generatedAt}`);
    lines.push(`**Target:** \`${report.targetId}\``);
    lines.push(`**Authorization:** ${report.authorization.basis} — ${report.authorization.evidence}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    for (const section of report.sections) {
      const prefix = '#'.repeat(section.level);
      lines.push(`${prefix} ${section.heading}`);
      lines.push('');
      lines.push(section.content);
      lines.push('');
    }

    // Diagrams
    if (report.diagrams.length > 0) {
      lines.push('## Architecture Diagrams');
      lines.push('');
      for (const diag of report.diagrams) {
        lines.push(`### ${diag.title}`);
        lines.push('');
        lines.push('```');
        lines.push(diag.diagram);
        lines.push('```');
        lines.push('');
      }
    }

    // Vulnerabilities
    if (report.vulnerabilities.length > 0) {
      lines.push('## Vulnerability Flags');
      lines.push('');
      lines.push('| Severity | Category | Description | Location |');
      lines.push('| :--- | :--- | :--- | :--- |');
      for (const vuln of report.vulnerabilities) {
        lines.push(
          `| **${vuln.severity}** | ${vuln.category} | ${vuln.description} | \`${vuln.location}\` |`
        );
      }
      lines.push('');
    } else {
      lines.push('## Vulnerability Flags');
      lines.push('');
      lines.push('No vulnerabilities detected.');
      lines.push('');
    }

    return lines.join('\n');
  }

  private renderText(report: TechnicalReport): string {
    const lines: string[] = [];
    lines.push(`=${report.title}=`);
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push(`Target: ${report.targetId}`);
    lines.push('');

    for (const section of report.sections) {
      lines.push(`\n--- ${section.heading} ---`);
      lines.push(section.content);
    }

    if (report.diagrams.length > 0) {
      lines.push('\n--- Architecture Diagrams ---');
      for (const diag of report.diagrams) {
        lines.push(`\n[${diag.title}]`);
        lines.push(diag.diagram);
      }
    }

    if (report.vulnerabilities.length > 0) {
      lines.push('\n--- Vulnerability Flags ---');
      for (const vuln of report.vulnerabilities) {
        lines.push(`[${vuln.severity}] ${vuln.category}: ${vuln.description}`);
      }
    }

    return lines.join('\n');
  }

  // ─── Diagram generation ────────────────────────────────────────────────────

  private renderLayerDiagram(layers: { name: string; files: string[] }[]): string {
    const lines: string[] = [];
    lines.push('┌─────────────────────────────┐');
    lines.push('│      LAYER ARCHITECTURE     │');
    lines.push('└─────────────────────────────┘');
    lines.push('');

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const isFirst = i === 0;
      const isLast = i === layers.length - 1;

      if (isFirst) {
        lines.push(`┌── ${layer.name} (${layer.files.length} files)`);
      } else if (isLast) {
        lines.push(`└── ${layer.name} (${layer.files.length} files)`);
      } else {
        lines.push(`├── ${layer.name} (${layer.files.length} files)`);
      }

      for (const file of layer.files.slice(0, 5)) {
        const prefix = isLast ? '' : '│';
        lines.push(`${prefix}   └── ${file}`);
      }
      if (layer.files.length > 5) {
        const prefix = isLast ? '' : '│';
        lines.push(`${prefix}   └── ... (+${layer.files.length - 5} more)`);
      }
      if (!isLast) {
        lines.push('│');
      }
    }

    return lines.join('\n');
  }

  private renderFlowDiagram(
    modules: string[],
    deps: { source: string; target: string; type: string }[]
  ): string {
    const lines: string[] = [];
    lines.push('┌─────────────────────────────┐');
    lines.push('│   MODULE DEPENDENCY FLOW    │');
    lines.push('└─────────────────────────────┘');
    lines.push('');

    const nodes = [...new Set(deps.flatMap((d) => [d.source, d.target]))].slice(0, 12);
    for (const node of nodes) {
      const outgoing = deps.filter((d) => d.source === node && d.type === 'INTERNAL').slice(0, 3);
      lines.push(`  ${this.truncate(node, 22)}`);
      if (outgoing.length > 0) {
        for (const edge of outgoing) {
          lines.push(`    ├──▶ ${this.truncate(edge.target, 22)}`);
        }
      } else {
        lines.push(`    └── (leaf)`);
      }
    }

    return lines.join('\n');
  }

  private truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 2) + '..';
  }
}
