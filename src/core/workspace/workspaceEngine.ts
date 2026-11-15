/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Program 08 · Workspace Engine
 * (src/core/workspace/workspaceEngine.ts)
 *
 * Project workspace management for AETHER. Provides workspace creation,
 * file organization, context preservation across sessions, and integration
 * with the Memory and Skill engines.
 *
 * Inspired by:
 *   - HeyPuter/puter      (AGPL-3.0; browser-workspace concept researched only)
 *   - obsidianmd/obsidian-releases (public plugin-registry model)
 *
 * AETHER-native: clean-room implementation; no copied code.
 */

import { randomUUID } from 'node:crypto';
import type { MemoryEngine } from '../memory';
import type { SkillRegistry } from '../skills';
import type { Memory } from '../memory/types';

// ─── Domain workspace templates ───────────────────────────────────────────────

export interface WorkspaceTemplate {
  name: string;
  domain: string;
  folders: string[];
  files: TemplateFile[];
  conventions: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  description: string;
}

const DEFAULT_TEMPLATE: WorkspaceTemplate = {
  name: 'default',
  domain: 'general',
  folders: ['notes', 'references', 'tasks'],
  files: [
    { path: 'README.md', content: '# Workspace\n\nAuto-generated workspace.', description: 'Workspace overview' },
    { path: 'tasks/TODO.md', content: '# TODO\n\n- [ ] Initial tasks', description: 'Task tracking' },
  ],
  conventions: ['One topic per file', 'Use wiki-links for cross-references', 'Tag all notes'],
};

export const PROJECT_TEMPLATES: Record<string, WorkspaceTemplate> = {
  general: DEFAULT_TEMPLATE,
  ai_assistant: {
    name: 'ai-assistant',
    domain: 'ai_assistant',
    folders: ['conversations', 'knowledge', 'prompts', 'tasks', 'references'],
    files: [
      { path: 'README.md', content: '# AI Assistant Workspace\n\nTrack conversation context, knowledge, and prompt templates.', description: 'Workspace overview' },
      { path: 'prompts/system.md', content: '# System Prompts\n\nEdit prompt templates here.', description: 'Prompt templates' },
      { path: 'knowledge/vault.md', content: '# Knowledge Vault\n\nKey facts and lessons.', description: 'Knowledge base' },
      { path: 'tasks/TODO.md', content: '# TODO\n\n- [ ] Tasks', description: 'Task tracking' },
    ],
    conventions: ['Tag conversations by topic', 'Link related prompts', 'Consolidate knowledge regularly'],
  },
  ecommerce: {
    name: 'ecommerce',
    domain: 'ecommerce',
    folders: ['products', 'orders', 'customers', 'analytics', 'tasks'],
    files: [
      { path: 'README.md', content: '# E-Commerce Workspace\n\nTrack products, orders, and customer data.', description: 'Workspace overview' },
      { path: 'tasks/TODO.md', content: '# TODO\n\n- [ ] Tasks', description: 'Task tracking' },
    ],
    conventions: ['One product per file', 'Link orders to customers', 'Track analytics by period'],
  },
  saas: {
    name: 'saas',
    domain: 'saas',
    folders: ['features', 'roadmap', 'users', 'analytics', 'tasks'],
    files: [
      { path: 'README.md', content: '# SaaS Workspace\n\nTrack features, roadmap, and user data.', description: 'Workspace overview' },
      { path: 'roadmap/ROADMAP.md', content: '# Roadmap\n\nPlanned features and milestones.', description: 'Product roadmap' },
      { path: 'tasks/TODO.md', content: '# TODO\n\n- [ ] Tasks', description: 'Task tracking' },
    ],
    conventions: ['One feature per file', 'Link features to roadmap items', 'Track user feedback per feature'],
  },
  developer_tools: {
    name: 'developer-tools',
    domain: 'developer_tools',
    folders: ['code', 'docs', 'tests', 'tasks', 'references'],
    files: [
      { path: 'README.md', content: '# Developer Tools Workspace\n\nTrack code, documentation, and tests.', description: 'Workspace overview' },
      { path: 'docs/README.md', content: '# Documentation\n\nProject documentation.', description: 'Documentation index' },
      { path: 'tasks/TODO.md', content: '# TODO\n\n- [ ] Tasks', description: 'Task tracking' },
    ],
    conventions: ['One module per folder', 'Link tests to code', 'Document public APIs'],
  },
};

// ─── Workspace types ─────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  domain: string;
  rootPath: string;
  template: string;
  folders: string[];
  createdAt: string;
  updatedAt: string;
  context: Record<string, unknown>;
  sessionId: string;
}

export interface WorkspaceFile {
  path: string;
  content: string;
  lastModified: string;
}

export interface WorkspaceContext {
  sessionId: string;
  workspaceId: string;
  preservedAt: string;
  state: Record<string, unknown>;
  notes: string[];
  activeSkills: string[];
  recentFiles: string[];
}

export interface WorkspaceConfig {
  name: string;
  domain: string;
  template?: string;
  rootPath?: string;
  context?: Record<string, unknown>;
}

// ─── Workspace Engine ────────────────────────────────────────────────────────

export class WorkspaceEngine {
  private readonly workspaces: Map<string, Workspace> = new Map();
  private readonly memory: MemoryEngine | null;
  private readonly skills: SkillRegistry | null;

  constructor(options: { memory?: MemoryEngine; skills?: SkillRegistry } = {}) {
    this.memory = options.memory ?? null;
    this.skills = options.skills ?? null;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  create(config: WorkspaceConfig): Workspace {
    const templateName = config.template ?? config.domain ?? 'general';
    const template = PROJECT_TEMPLATES[templateName] ?? DEFAULT_TEMPLATE;
    const workspaceId = `ws_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const rootPath = config.rootPath ?? `/aether/workspaces/${workspaceId}`;
    const sessionId = randomUUID().replace(/-/g, '').slice(0, 12);

    const workspace: Workspace = {
      id: workspaceId,
      name: config.name,
      domain: template.domain,
      rootPath,
      template: template.name,
      folders: [...template.folders],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      context: config.context ?? {},
      sessionId,
    };

    this.workspaces.set(workspaceId, workspace);

    // Persist to memory if available
    if (this.memory) {
      this.memory.storeMemory('artifact', `workspace:${workspaceId}`, workspace, {
        tags: ['workspace', workspace.domain],
        provenanceSource: 'workspace-engine',
        confidence: 1.0,
      });
    }

    return workspace;
  }

  get(id: string): Workspace | undefined {
    return this.workspaces.get(id);
  }

  list(): Workspace[] {
    return [...this.workspaces.values()];
  }

  update(id: string, updates: Partial<Pick<Workspace, 'name' | 'context'>>): Workspace | undefined {
    const existing = this.workspaces.get(id);
    if (!existing) return undefined;

    const updated: Workspace = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.workspaces.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.workspaces.delete(id);
  }

  // ─── Template discovery ─────────────────────────────────────────────────────

  listTemplates(): WorkspaceTemplate[] {
    return Object.values(PROJECT_TEMPLATES);
  }

  getTemplate(domain: string): WorkspaceTemplate {
    return PROJECT_TEMPLATES[domain] ?? DEFAULT_TEMPLATE;
  }

  // ─── Context preservation ──────────────────────────────────────────────────

  captureContext(workspaceId: string): WorkspaceContext | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const activeSkills: string[] = this.skills
      ? this.skills.listIds().slice(0, 20)
      : [];

    const context: WorkspaceContext = {
      sessionId: workspace.sessionId,
      workspaceId,
      preservedAt: new Date().toISOString(),
      state: { ...workspace.context },
      notes: [],
      activeSkills,
      recentFiles: [],
    };

    // Persist to memory
    if (this.memory) {
      this.memory.storeMemory('context', `workspace:context:${workspaceId}`, context, {
        tags: ['workspace', 'context', workspace.domain],
        provenanceSource: 'workspace-engine',
        confidence: 1.0,
      });
    }

    return context;
  }

  restoreContext(workspaceId: string): WorkspaceContext | undefined {
    if (this.memory) {
      const memories = this.memory.recall({
        key: `workspace:context:${workspaceId}`,
        status: 'active',
        limit: 1,
      });
      if (memories.length > 0) {
        return memories[0].value as WorkspaceContext;
      }
    }
    return this.captureContext(workspaceId);
  }

  // ─── Session continuity ────────────────────────────────────────────────────

  getSessionId(workspaceId: string): string | undefined {
    return this.workspaces.get(workspaceId)?.sessionId;
  }

  // ─── File scaffolding ──────────────────────────────────────────────────────

  scaffoldFiles(workspaceId: string): Array<{ path: string; content: string; description: string }> | undefined {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return undefined;

    const template = PROJECT_TEMPLATES[workspace.template] ?? DEFAULT_TEMPLATE;
    return template.files.map((f) => ({
      path: `${workspace.rootPath}/${f.path}`,
      content: f.content,
      description: f.description,
    }));
  }
}
