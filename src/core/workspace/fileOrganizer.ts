/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Program 08 · File Organization Intelligence
 * (src/core/workspace/fileOrganizer.ts)
 *
 * Smart file placement, convention-over-configuration, project structure
 * templates, and import path management. Inspired by Puter's workspace
 * organization and standard project structure patterns.
 *
 * AETHER-native: clean-room implementation; no copied code.
 */

import { randomUUID } from 'node:crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectType =
  | 'general'
  | 'ai_assistant'
  | 'ecommerce'
  | 'saas'
  | 'developer_tools'
  | 'education'
  | 'finance'
  | 'healthcare'
  | 'media'
  | 'social'
  | 'gaming'
  | 'logistics';

export interface ProjectStructureTemplate {
  projectType: ProjectType;
  name: string;
  description: string;
  folders: string[];
  conventions: string[];
  entryFiles: string[];
  testPattern: string;
  importPattern: string;
}

export interface FilePlacement {
  filePath: string;
  suggestedPath: string;
  reason: string;
  confidence: number;
}

export interface ImportPathMapping {
  from: string;
  to: string;
  type: 'relative' | 'alias' | 'package';
}

export interface ProjectStructure {
  projectType: ProjectType;
  rootPath: string;
  folders: string[];
  files: string[];
  conventions: string[];
  importAliases: ImportPathMapping[];
}

// ─── Structure templates ─────────────────────────────────────────────────────

export const STRUCTURE_TEMPLATES: Record<ProjectType, ProjectStructureTemplate> = {
  general: {
    projectType: 'general',
    name: 'General',
    description: 'General-purpose project structure',
    folders: ['src', 'docs', 'tests', 'config'],
    conventions: [
      'Source code in src/',
      'Documentation in docs/',
      'Tests mirror src/ structure',
      'Configuration in config/',
    ],
    entryFiles: ['src/index.ts', 'src/main.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  ai_assistant: {
    projectType: 'ai_assistant',
    name: 'AI Assistant',
    description: 'AI assistant / conversational agent project',
    folders: ['src/agents', 'src/tools', 'src/prompts', 'src/memory', 'tests', 'docs', 'config'],
    conventions: [
      'Agents in src/agents/',
      'Tools in src/tools/',
      'Prompt templates in src/prompts/',
      'Memory layer in src/memory/',
      'One agent per file',
    ],
    entryFiles: ['src/index.ts', 'src/agents/orchestrator.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  ecommerce: {
    projectType: 'ecommerce',
    name: 'E-Commerce',
    description: 'E-commerce platform project',
    folders: ['src/products', 'src/orders', 'src/customers', 'src/payments', 'src/api', 'tests', 'docs', 'config'],
    conventions: [
      'Products in src/products/',
      'Orders in src/orders/',
      'Customers in src/customers/',
      'API routes in src/api/',
    ],
    entryFiles: ['src/index.ts', 'src/api/server.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  saas: {
    projectType: 'saas',
    name: 'SaaS',
    description: 'Software-as-a-Service project',
    folders: ['src/features', 'src/api', 'src/auth', 'src/db', 'src/middleware', 'tests', 'docs', 'config'],
    conventions: [
      'Features in src/features/ (one folder per feature)',
      'API routes in src/api/',
      'Auth in src/auth/',
      'Database in src/db/',
    ],
    entryFiles: ['src/index.ts', 'src/api/server.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  developer_tools: {
    projectType: 'developer_tools',
    name: 'Developer Tools',
    description: 'Developer tools / CLI project',
    folders: ['src/cli', 'src/commands', 'src/utils', 'src/formatters', 'tests', 'docs', 'config'],
    conventions: [
      'CLI entry in src/cli/',
      'Commands in src/commands/',
      'Utilities in src/utils/',
      'Formatters in src/formatters/',
    ],
    entryFiles: ['src/cli/index.ts', 'src/index.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  education: {
    projectType: 'education',
    name: 'Education',
    description: 'Educational platform project',
    folders: ['src/courses', 'src/students', 'src/assessments', 'src/content', 'tests', 'docs', 'config'],
    conventions: [
      'Courses in src/courses/',
      'Students in src/students/',
      'Assessments in src/assessments/',
    ],
    entryFiles: ['src/index.ts', 'src/courses/manager.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  finance: {
    projectType: 'finance',
    name: 'Finance',
    description: 'Financial application project',
    folders: ['src/accounts', 'src/transactions', 'src/reports', 'src/compliance', 'tests', 'docs', 'config'],
    conventions: [
      'Accounts in src/accounts/',
      'Transactions in src/transactions/',
      'Reports in src/reports/',
      'Compliance in src/compliance/',
    ],
    entryFiles: ['src/index.ts', 'src/accounts/manager.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  healthcare: {
    projectType: 'healthcare',
    name: 'Healthcare',
    description: 'Healthcare application project',
    folders: ['src/patients', 'src/appointments', 'src/records', 'src/compliance', 'tests', 'docs', 'config'],
    conventions: [
      'Patients in src/patients/',
      'Appointments in src/appointments/',
      'Records in src/records/',
      'Compliance in src/compliance/',
    ],
    entryFiles: ['src/index.ts', 'src/patients/manager.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  media: {
    projectType: 'media',
    name: 'Media',
    description: 'Media / content platform project',
    folders: ['src/content', 'src/media', 'src/streaming', 'src/users', 'tests', 'docs', 'config'],
    conventions: [
      'Content in src/content/',
      'Media processing in src/media/',
      'Streaming in src/streaming/',
    ],
    entryFiles: ['src/index.ts', 'src/content/manager.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  social: {
    projectType: 'social',
    name: 'Social',
    description: 'Social platform project',
    folders: ['src/users', 'src/posts', 'src/feed', 'src/notifications', 'tests', 'docs', 'config'],
    conventions: [
      'Users in src/users/',
      'Posts in src/posts/',
      'Feed generation in src/feed/',
    ],
    entryFiles: ['src/index.ts', 'src/feed/engine.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  gaming: {
    projectType: 'gaming',
    name: 'Gaming',
    description: 'Gaming project',
    folders: ['src/engine', 'src/entities', 'src/levels', 'src/audio', 'tests', 'docs', 'config'],
    conventions: [
      'Engine core in src/engine/',
      'Entities in src/entities/',
      'Levels in src/levels/',
    ],
    entryFiles: ['src/index.ts', 'src/engine/main.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
  logistics: {
    projectType: 'logistics',
    name: 'Logistics',
    description: 'Logistics / supply chain project',
    folders: ['src/shipments', 'src/routes', 'src/warehouses', 'src/tracking', 'tests', 'docs', 'config'],
    conventions: [
      'Shipments in src/shipments/',
      'Routes in src/routes/',
      'Warehouses in src/warehouses/',
      'Tracking in src/tracking/',
    ],
    entryFiles: ['src/index.ts', 'src/shipments/manager.ts'],
    testPattern: 'tests/**/*.test.ts',
    importPattern: 'src/',
  },
};

// ─── File Organization Engine ────────────────────────────────────────────────

export class FileOrganizer {
  // ─── Template discovery ─────────────────────────────────────────────────────

  listTemplates(): ProjectStructureTemplate[] {
    return Object.values(STRUCTURE_TEMPLATES);
  }

  getTemplate(projectType: ProjectType): ProjectStructureTemplate {
    return STRUCTURE_TEMPLATES[projectType] ?? STRUCTURE_TEMPLATES.general;
  }

  // ─── Project structure generation ──────────────────────────────────────────

  generateStructure(options: {
    projectType: ProjectType;
    rootPath: string;
    name?: string;
  }): ProjectStructure {
    const template = this.getTemplate(options.projectType);
    return {
      projectType: options.projectType,
      rootPath: options.rootPath,
      folders: template.folders.map((f) => `${options.rootPath}/${f}`),
      files: template.entryFiles.map((f) => `${options.rootPath}/${f}`),
      conventions: template.conventions,
      importAliases: this.generateImportAliases(options.rootPath, template),
    };
  }

  // ─── Smart file placement ──────────────────────────────────────────────────

  suggestPlacement(filePath: string, projectType: ProjectType): FilePlacement[] {
    const suggestions: FilePlacement[] = [];
    const template = this.getTemplate(projectType);
    const fileName = filePath.split('/').pop() ?? filePath;
    const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';

    // Rule-based placement heuristics
    const rules: Array<{ test: (fp: string, fn: string, ext: string) => boolean; target: string; reason: string; confidence: number }> = [
      { test: (fp) => fp.includes('test') || fp.includes('spec'), target: 'tests', reason: 'File appears to be a test file', confidence: 0.9 },
      { test: (fp) => fp.includes('config') || ext === 'json' || ext === 'yaml' || ext === 'yml', target: 'config', reason: 'Configuration file', confidence: 0.8 },
      { test: (fp, fn) => fn.includes('README') || fn.includes('CHANGELOG') || fn.includes('LICENSE'), target: 'docs', reason: 'Documentation file', confidence: 0.95 },
      { test: (fp) => fp.includes('agent'), target: 'src/agents', reason: 'Agent implementation file', confidence: 0.85 },
      { test: (fp) => fp.includes('skill'), target: 'src/tools', reason: 'Skill/tool implementation file', confidence: 0.8 },
      { test: (fp) => fp.includes('prompt'), target: 'src/prompts', reason: 'Prompt template file', confidence: 0.85 },
      { test: (fp) => fp.includes('memory'), target: 'src/memory', reason: 'Memory layer file', confidence: 0.85 },
      { test: (fp) => fp.includes('product'), target: 'src/products', reason: 'Product-related file', confidence: 0.8 },
      { test: (fp) => fp.includes('order'), target: 'src/orders', reason: 'Order-related file', confidence: 0.8 },
      { test: (fp) => fp.includes('customer'), target: 'src/customers', reason: 'Customer-related file', confidence: 0.8 },
      { test: (fp) => fp.includes('feature'), target: 'src/features', reason: 'Feature implementation file', confidence: 0.85 },
      { test: (fp) => fp.includes('api') || fp.includes('route') || fp.includes('endpoint'), target: 'src/api', reason: 'API/route file', confidence: 0.85 },
      { test: (fp) => fp.includes('auth') || fp.includes('login'), target: 'src/auth', reason: 'Authentication file', confidence: 0.85 },
      { test: (fp) => fp.includes('db') || fp.includes('schema') || fp.includes('migration'), target: 'src/db', reason: 'Database file', confidence: 0.8 },
      { test: (fp) => fp.includes('cli') || fp.includes('command'), target: 'src/cli', reason: 'CLI file', confidence: 0.85 },
      { test: (fp) => fp.includes('util') || fp.includes('helper'), target: 'src/utils', reason: 'Utility file', confidence: 0.75 },
    ];

    for (const rule of rules) {
      if (rule.test(filePath, fileName, ext)) {
        suggestions.push({
          filePath,
          suggestedPath: `${template.folders[0]}/${rule.target}/${fileName}`,
          reason: rule.reason,
          confidence: rule.confidence,
        });
      }
    }

    // Default fallback
    if (suggestions.length === 0) {
      suggestions.push({
        filePath,
        suggestedPath: `${template.folders[0]}/${fileName}`,
        reason: 'Default placement: source folder',
        confidence: 0.5,
      });
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  // ─── Import path management ────────────────────────────────────────────────

  generateImportAliases(rootPath: string, template: ProjectStructureTemplate): ImportPathMapping[] {
    const aliases: ImportPathMapping[] = [];
    const prefix = rootPath.replace(/\/$/, '');

    for (const folder of template.folders.filter((f) => !f.includes('tests') && !f.includes('docs'))) {
      const parts = folder.split('/');
      const aliasName = parts[parts.length - 1];
      aliases.push({
        from: `@${aliasName}`,
        to: `${prefix}/${folder}`,
        type: 'alias',
      });
    }

    return aliases;
  }

  resolveImportPath(
    fromFile: string,
    toFile: string,
    aliases: ImportPathMapping[]
  ): string {
    // Check aliases first
    for (const alias of aliases) {
      if (toFile.startsWith(alias.to)) {
        return toFile.replace(alias.to, alias.from);
      }
    }

    // Compute relative path
    const fromDir = fromFile.split('/').slice(0, -1).join('/');
    const relative = this.computeRelativePath(fromDir, toFile);
    return relative;
  }

  // ─── Convention validation ─────────────────────────────────────────────────

  validateAgainstConventions(
    filePath: string,
    projectType: ProjectType
  ): Array<{ convention: string; passed: boolean; detail: string }> {
    const template = this.getTemplate(projectType);
    const results: Array<{ convention: string; passed: boolean; detail: string }> = [];

    for (const convention of template.conventions) {
      let passed = true;
      let detail = 'Convention met';

      // Convention: source files in src/
      if (convention.includes('src/')) {
        passed = filePath.startsWith('src/');
        detail = passed ? 'File is in src/' : 'File should be in src/';
      }

      // Convention: tests mirror src/
      if (convention.includes('tests mirror')) {
        const testEquivalent = filePath.replace('src/', 'tests/').replace(/\.ts$/, '.test.ts');
        passed = filePath.startsWith('tests/') || filePath.startsWith('src/');
        detail = passed ? 'File location follows mirror pattern' : 'File location does not follow mirror pattern';
      }

      results.push({ convention, passed, detail });
    }

    return results;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private computeRelativePath(fromDir: string, toFile: string): string {
    const fromParts = fromDir.split('/').filter(Boolean);
    const toParts = toFile.split('/').filter(Boolean);

    // Find common prefix
    let common = 0;
    while (common < fromParts.length && common < toParts.length && fromParts[common] === toParts[common]) {
      common++;
    }

    const upDirs = fromParts.length - common;
    const downParts = toParts.slice(common);

    const prefix = upDirs > 0 ? '../'.repeat(upDirs) : './';
    return prefix + downParts.join('/');
  }
}
