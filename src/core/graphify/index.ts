/**
 * Graphify Integration for AETHER
 * Inspiration: Graphify by Graphify Labs - https://github.com/Graphify-Labs/graphify.git
 * Used under their open source license for knowledge graph capabilities.
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Provides the primary interface for storing and retrieving AETHER project
 * knowledge in the Graphify knowledge graph. Handles:
 *   - Project context persistence across sessions
 *   - User preference and generated code pattern storage
 *   - Auto-save with configurable operation intervals
 *   - Resume-from-last-checkpoint functionality
 */

import type {
  GraphNode,
  Relationship,
  RelationshipType,
  NodeType,
  ProjectNode,
  ContextNode,
  SessionNode,
  CodePatternNode,
  ArchitectureNode,
  IndustryNode,
  MemoryNode,
  SubgraphExport,
  GraphQueryResult,
} from './schema';
import { getGraphifyClient, GraphifyClient, DEFAULT_CONFIG } from './client';
import { MemoryPersistence, getMemoryPersistence } from './memoryPersistence';

// ──────────────────────────────────────────────
// Public Types
// ──────────────────────────────────────────────

export interface GraphifyProjectConfig {
  projectId: string;
  projectName: string;
  rootPath: string;
  version?: string;
  autoSaveInterval?: number;
  sessionTag?: string;
}

export interface GraphifyStatus {
  connected: boolean;
  usingFallback: boolean;
  latencyMs: number;
  nodeCount: number;
  relationshipCount: number;
  lastSavedAt: string | null;
}

export interface ResumeInfo {
  sessionId: string;
  interrupted: boolean;
  lastContextId: string | null;
  lastOperation: string | null;
  availableContexts: ContextNode[];
}

export interface StoredContext {
  userPrompt: string;
  generatedCodeHash: string | null;
  handledBy: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Graphify Integration
// ──────────────────────────────────────────────

export class GraphifyIntegration {
  private readonly client: GraphifyClient;
  private readonly persistence: MemoryPersistence;
  private readonly projectConfig: Required<GraphifyProjectConfig>;
  private operationCounter = 0;
  private lastSavedAt: string | null = null;
  private currentSessionId: string | null = null;
  private closed = false;

  constructor(config: GraphifyProjectConfig) {
    const projectId = config.projectId;
    this.projectConfig = {
      projectId,
      projectName: config.projectName,
      rootPath: config.rootPath,
      version: config.version ?? '1.0.0',
      autoSaveInterval: config.autoSaveInterval ?? 5,
      sessionTag: config.sessionTag ?? projectId,
    };

    this.client = getGraphifyClient({
      ...DEFAULT_CONFIG,
      projectId,
    });
    this.persistence = getMemoryPersistence({ projectId });
  }

  // ─── Lifecycle ──────────────────────────────

  async initialize(): Promise<void> {
    if (this.closed) {
      throw new Error('GraphifyIntegration is closed; create a new instance');
    }
    await this.ensureProjectNode();
    await this.startSession();
  }

  async close(): Promise<void> {
    if (this.closed) return;
    await this.autoSave(true);
    if (this.currentSessionId) {
      await this.endSession();
    }
    this.closed = true;
  }

  // ─── Project Management ────────────────────

  async ensureProjectNode(): Promise<ProjectNode> {
    const existing = await this.client.getNode(this.projectConfig.projectId);
    if (existing && existing.type === 'Project') {
      return this.upsertNode<ProjectNode>({
        ...existing,
        updatedAt: new Date().toISOString(),
      } as ProjectNode);
    }

    const projectNode: ProjectNode = {
      id: this.projectConfig.projectId,
      type: 'Project',
      projectId: this.projectConfig.projectId,
      name: this.projectConfig.projectName,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: this.projectConfig.version,
      rootPath: this.projectConfig.rootPath,
      agentCount: 0,
      skillCount: 0,
      workflowCount: 0,
      metadata: {},
    };

    return this.upsertNode(projectNode);
  }

  // ─── Context Operations ────────────────────

  async saveContext(context: StoredContext): Promise<ContextNode> {
    const ctxNode: ContextNode = {
      type: 'Context',
      id: this.generateId('ctx'),
      projectId: this.projectConfig.projectId,
      parentId: null,
      userPrompt: context.userPrompt,
      generatedCodeHash: context.generatedCodeHash,
      isInterrupted: false,
      timestamp: new Date().toISOString(),
      tokenCount: 0,
      handledBy: context.handledBy,
      tags: context.tags,
      metadata: context.metadata,
    };

    await this.upsertNode(ctxNode);
    await this.linkContextToSession(ctxNode);

    this.operationCounter++;
    await this.autoSave();

    return ctxNode;
  }

  async loadContext(contextId: string): Promise<ContextNode | null> {
    const node = await this.client.getNode(contextId);
    if (node && node.type === 'Context') {
      return node as ContextNode;
    }
    return null;
  }

  async markInterrupted(contextId: string): Promise<void> {
    const node = await this.client.getNode(contextId);
    if (node && node.type === 'Context') {
      await this.upsertNode({ ...node, isInterrupted: true } as ContextNode);
    }
  }

  async getContexts(sessionId?: string): Promise<ContextNode[]> {
    const result = await this.client.listNodes(
      { type: 'Context', projectId: this.projectConfig.projectId },
      200
    );
    let contexts = result.data.filter((n): n is ContextNode => n.type === 'Context');

    if (sessionId) {
      // Filter by session via relationship lookup
      const rels = await this.client.listNodes({ type: 'Session' });
    }

    return contexts;
  }

  // ─── Session Management ────────────────────

  async startSession(): Promise<SessionNode> {
    if (this.currentSessionId) {
      await this.endSession();
    }

    const sessionId = this.generateId('sess');
    const sessionNode: SessionNode = {
      type: 'Session',
      id: sessionId,
      projectId: this.projectConfig.projectId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      completed: false,
      operationCount: 0,
      lastCheckpointId: null,
      summary: null,
      metadata: { sessionTag: this.projectConfig.sessionTag },
    };

    this.currentSessionId = sessionId;
    await this.upsertNode(sessionNode);
    return sessionNode;
  }

  async endSession(): Promise<void> {
    if (!this.currentSessionId) return;

    const node = await this.client.getNode(this.currentSessionId);
    if (node && node.type === 'Session') {
      const session: SessionNode = {
        ...node,
        endedAt: new Date().toISOString(),
        completed: true,
        operationCount: this.operationCounter,
      };
      await this.upsertNode(session);
    }

    this.currentSessionId = null;
  }

  // ─── Resume Functionality ──────────────────

  async findResumeInfo(): Promise<ResumeInfo | null> {
    const result = await this.client.listNodes(
      { type: 'Session', projectId: this.projectConfig.projectId },
      10
    );

    const sessions = result.data.filter((n): n is SessionNode => n.type === 'Session');
    const interrupted = sessions
      .filter((s) => !s.completed)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    if (interrupted.length === 0) return null;

    const session = interrupted[0];
    const contexts = await this.getContexts(session.id);

    return {
      sessionId: session.id,
      interrupted: true,
      lastContextId: session.lastCheckpointId,
      lastOperation: contexts.length > 0 ? contexts[contexts.length - 1].userPrompt : null,
      availableContexts: contexts,
    };
  }

  // ─── Code Pattern Storage ──────────────────

  async storeCodePattern(pattern: {
    category: string;
    name: string;
    codeSnippet: string | null;
    sourcePath: string | null;
    confidence?: number;
  }): Promise<CodePatternNode> {
    const patternNode: CodePatternNode = {
      type: 'CodePattern',
      id: this.generateId('pat'),
      projectId: this.projectConfig.projectId,
      category: pattern.category,
      name: pattern.name,
      codeSnippet: pattern.codeSnippet,
      sourcePath: pattern.sourcePath,
      reuseCount: 0,
      confidence: pattern.confidence ?? 1.0,
      createdAt: new Date().toISOString(),
      metadata: {},
    };

    return this.upsertNode(patternNode);
  }

  async storeLearning(learning: {
    category: string;
    name: string;
    codeSnippet: string | null;
    sourcePath: string | null;
    confidence?: number;
  }): Promise<CodePatternNode> {
    // Store learning as a CodePattern node with the learnings category
    return this.storeCodePattern(learning);
  }

  // ─── Architecture Storage ──────────────────

  async storeArchitecture(arch: Omit<ArchitectureNode, 'id' | 'type' | 'projectId' | 'createdAt'>): Promise<ArchitectureNode> {
    const existing = await this.client.listNodes(
      { type: 'Architecture', projectId: this.projectConfig.projectId },
      100
    );
    const current = existing.data.filter((n): n is ArchitectureNode => n.type === 'Architecture' && n.isCurrent);
    for (const node of current) {
      await this.upsertNode({ ...node, isCurrent: false } as ArchitectureNode);
    }

    const archNode: ArchitectureNode = {
      ...arch,
      id: this.generateId('arch'),
      type: 'Architecture',
      projectId: this.projectConfig.projectId,
      createdAt: new Date().toISOString(),
    };

    return this.upsertNode(archNode);
  }

  // ─── Industry Storage ──────────────────────

  async storeIndustryAnalysis(industry: Omit<IndustryNode, 'id' | 'type' | 'projectId'>): Promise<IndustryNode> {
    const node: IndustryNode = {
      ...industry,
      id: this.generateId('ind'),
      type: 'Industry',
      projectId: this.projectConfig.projectId,
    };

    return this.upsertNode(node);
  }

  // ─── Relationships ─────────────────────────

  async relate(
    sourceId: string,
    targetId: string,
    relType: RelationshipType,
    properties: Record<string, unknown> = {}
  ): Promise<Relationship> {
    const rel: Relationship = {
      id: this.generateId('rel'),
      type: relType,
      sourceId,
      sourceType: 'Project',
      targetId,
      targetType: 'Project',
      properties: { ...properties, projectId: this.projectConfig.projectId },
      createdAt: new Date().toISOString(),
    };

    return this.client.upsertRelationship(rel);
  }

  private async linkContextToSession(ctx: ContextNode): Promise<void> {
    if (!this.currentSessionId) return;
    await this.relate(this.currentSessionId, ctx.id, 'CONTAINS');
  }

  // ─── Export / Clear ────────────────────────

  async exportProject(): Promise<SubgraphExport> {
    return this.client.exportSubgraph(this.projectConfig.projectId);
  }

  async clearProject(): Promise<void> {
    await this.client.clearProject(this.projectConfig.projectId);
    await this.persistence.clear();
    this.operationCounter = 0;
  }

  // ─── Status ────────────────────────────────

  async getStatus(): Promise<GraphifyStatus> {
    const clientStatus = await this.client.getStatus();
    return {
      ...clientStatus,
      lastSavedAt: this.lastSavedAt,
    };
  }

  // ─── Memory Persistence Integration ─────────
  // Uses only the MemoryPersistence interface: save, load, clear

  async saveMemory(key: string, value: unknown): Promise<void> {
    const node: GraphNode = {
      id: `mem_${key}`,
      type: 'Memory',
      projectId: this.projectConfig.projectId,
      data: { key, value },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nodes = new Map<string, GraphNode>();
    nodes.set(node.id, node);
    await this.persistence.save(nodes, []);
    this.operationCounter++;
    await this.autoSave();
  }

  async loadMemory<T>(key: string): Promise<T | null> {
    const { nodes } = await this.persistence.load();
    const memId = `mem_${key}`;
    const node = nodes.get(memId);
    if (!node || node.type !== 'Memory') return null;
    const data = node as MemoryNode;
    if (data.data.value !== undefined) {
      return data.data.value as T;
    }
    return null;
  }

  async loadFullState(): Promise<Record<string, unknown>> {
    const { nodes } = await this.persistence.load();
    const state: Record<string, unknown> = {};
    for (const node of nodes.values()) {
      if (node.type === 'Memory') {
        const memNode = node as MemoryNode;
        state[memNode.data.key] = memNode.data.value;
      }
    }
    return state;
  }

  async restoreState(state: Record<string, unknown>): Promise<void> {
    const nodes = new Map<string, GraphNode>();
    for (const [key, value] of Object.entries(state)) {
      const memId = `mem_${key}`;
      nodes.set(memId, {
        id: memId,
        type: 'Memory',
        projectId: this.projectConfig.projectId,
        data: { key, value },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as MemoryNode);
    }
    await this.persistence.save(nodes, []);
  }

  // ─── Resume ──────────────────────────────────

  async resume(): Promise<{ restored: boolean; contexts: ContextNode[] }> {
    // Load persisted memory state from the MemoryPersistence store
    const { nodes } = await this.persistence.load();
    const memNodes = Array.from(nodes.values()).filter(
      (n): n is GraphNode & { type: 'Memory' } => n.type === 'Memory'
    );

    const contexts: ContextNode[] = [];
    let restored = false;

    if (memNodes.length > 0) {
      // Rebuild project context from persisted memory nodes
      const state: Record<string, unknown> = {};
      for (const mem of memNodes) {
        const key = (mem.data as { key?: string }).key;
        if (key) {
          state[key] = (mem.data as { value?: unknown }).value;
        }
      }

      // Restore last session info if present
      if (state._lastSession && typeof state._lastSession === 'object') {
        const lastSession = state._lastSession as {
          sessionId?: string;
          interrupted?: boolean;
          lastContextId?: string;
        };
        if (lastSession.sessionId) {
          this.currentSessionId = lastSession.sessionId;
        }
        if (lastSession.lastContextId) {
          const ctx = await this.loadContext(lastSession.lastContextId);
          if (ctx) contexts.push(ctx);
        }
        restored = true;
      }
    }

    // Ensure a project node exists
    await this.ensureProjectNode();
    await this.startSession();

    return { restored, contexts };
  }

  // ─── Internal Helpers ──────────────────────

  private async upsertNode<T extends GraphNode>(node: T): Promise<T> {
    return this.client.upsertNode(node) as Promise<T>;
  }

  private async autoSave(forcePersist = false): Promise<void> {
    if (!forcePersist && this.operationCounter < this.projectConfig.autoSaveInterval) {
      return;
    }
    this.operationCounter = 0;
    this.lastSavedAt = new Date().toISOString();
    this.client.persistLocal();
  }

  private generateId(prefix: string): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    return `${prefix}_${ts}_${rand}`;
  }
}

// ──────────────────────────────────────────────
// Convenience Factory
// ──────────────────────────────────────────────

export function createGraphifyIntegration(config: GraphifyProjectConfig): GraphifyIntegration {
  return new GraphifyIntegration(config);
}

// Re-export for convenience
export { DEFAULT_CONFIG } from './client';
export * from './schema';
