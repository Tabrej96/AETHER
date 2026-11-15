/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Graphify Client for AETHER Knowledge Graph Integration
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * HTTP client + GraphQL query wrapper for the Graphify knowledge graph API.
 * Falls back to a local file-based store when Graphify is unavailable.
 * Includes auto-reconnection and retry logic with exponential backoff.
 */

import fs from 'node:fs';
import path from 'node:path';
import type {
  GraphNode,
  Relationship,
  RelationshipType,
  NodeType,
  GraphQueryResult,
  TraversalResult,
  SubgraphExport,
  NODE_INDEX_CONFIGS,
} from './schema';

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

export interface GraphifyClientConfig {
  /** Graphify API base URL (e.g. http://localhost:4000) */
  apiUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Maximum retry attempts for failed requests */
  maxRetries: number;
  /** Initial retry delay in milliseconds */
  retryBaseDelayMs: number;
  /** Whether to fall back to local storage on failures */
  fallbackToLocal: boolean;
  /** Local storage directory path */
  localStoreDir: string;
  /** Project id for local isolation */
  projectId: string;
  /** Optional auth token for Graphify API */
  authToken?: string;
}

export const DEFAULT_CONFIG: GraphifyClientConfig = {
  apiUrl: process.env.GRAPHIFY_API_URL || 'http://localhost:4000',
  timeoutMs: 15_000,
  maxRetries: 3,
  retryBaseDelayMs: 500,
  fallbackToLocal: true,
  localStoreDir: process.env.GRAPHIFY_LOCAL_DIR || '.aether/graphify',
  projectId: 'default',
};

// ──────────────────────────────────────────────
// Exceptions
// ──────────────────────────────────────────────

export class GraphifyConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'GraphifyConnectionError';
  }
}

export class GraphifyQueryError extends Error {
  constructor(
    message: string,
    public readonly query: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'GraphifyQueryError';
  }
}

export class GraphifyLocalFallbackError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'GraphifyLocalFallbackError';
  }
}

// ──────────────────────────────────────────────
// Local Fallback Store
// ──────────────────────────────────────────────

interface LocalStoreData {
  nodes: Record<string, GraphNode>;
  relationships: Record<string, Relationship>;
  updatedAt: string;
}

class LocalGraphStore {
  private data: LocalStoreData;
  private readonly dataFile: string;
  private dirty = false;

  constructor(private readonly storeDir: string, private readonly projectId: string) {
    this.dataFile = path.join(storeDir, `${projectId}.json`);
    this.data = this.load();
  }

  private projectDir(): string {
    const dir = path.join(this.storeDir, this.projectId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private load(): LocalStoreData {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        return JSON.parse(raw) as LocalStoreData;
      }
    } catch (_e) {
      // corrupt file — start fresh
    }
    return { nodes: {}, relationships: {}, updatedAt: new Date().toISOString() };
  }

  private persist(): void {
    if (!this.dirty) return;
    this.data.updatedAt = new Date().toISOString();
    const tmp = `${this.dataFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmp, this.dataFile);
    this.dirty = false;
  }

  persistSync(): void {
    this.persist();
  }

  upsertNode(node: GraphNode): void {
    this.data.nodes[node.id] = node;
    this.dirty = true;
    this.persist();
  }

  upsertNodes(nodes: GraphNode[]): void {
    for (const node of nodes) {
      this.data.nodes[node.id] = node;
    }
    this.dirty = true;
    this.persist();
  }

  getNode(id: string): GraphNode | undefined {
    return this.data.nodes[id];
  }

  deleteNode(id: string): void {
    delete this.data.nodes[id];
    this.dirty = true;
    this.persist();
  }

  listNodes(projectId?: string): GraphNode[] {
    const all = Object.values(this.data.nodes);
    if (projectId) {
      return all.filter((n) => (n as unknown as Record<string, string>).projectId === projectId);
    }
    return all;
  }

  upsertRelationship(rel: Relationship): void {
    this.data.relationships[rel.id] = rel;
    this.dirty = true;
    this.persist();
  }

  upsertRelationships(rels: Relationship[]): void {
    for (const rel of rels) {
      this.data.relationships[rel.id] = rel;
    }
    this.dirty = true;
    this.persist();
  }

  getRelationship(id: string): Relationship | undefined {
    return this.data.relationships[id];
  }

  deleteRelationship(id: string): void {
    delete this.data.relationships[id];
    this.dirty = true;
    this.persist();
  }

  listRelationships(projectId?: string): Relationship[] {
    const all = Object.values(this.data.relationships);
    if (!projectId) return all;
    return all.filter(
      (r) => (r.properties as unknown as Record<string, string>)?.projectId === projectId
    );
  }

  clear(): void {
    this.data = { nodes: {}, relationships: {}, updatedAt: new Date().toISOString() };
    this.dirty = true;
    this.persist();
  }

  export(): SubgraphExport {
    return {
      projectId: this.projectId,
      exportedAt: new Date().toISOString(),
      nodes: Object.values(this.data.nodes),
      relationships: Object.values(this.data.relationships),
    };
  }
}

// ──────────────────────────────────────────────
// GraphQL Query Templates
// ──────────────────────────────────────────────

const GRAPHQL_QUERIES = {
  upsertNode: /* GraphQL */ `
    mutation UpsertNode($input: NodeInput!) {
      upsertNode(input: $input) { id type }
    }
  `,
  deleteNode: /* GraphQL */ `
    mutation DeleteNode($id: ID!) {
      deleteNode(id: $id)
    }
  `,
  listNodes: /* GraphQL */ `
    query ListNodes($filter: NodeFilter, $limit: Int, $cursor: String) {
      nodes(filter: $filter, limit: $limit, after: $cursor) {
        items { id type }
        totalCount
        hasMore
        cursor
      }
    }
  `,
  upsertRelationship: /* GraphQL */ `
    mutation UpsertRelationship($input: RelationshipInput!) {
      upsertRelationship(input: $input) { id type }
    }
  `,
  traverse: /* GraphQL */ `
    query Traverse($from: ID!, $depth: Int, $types: [String!]) {
      traverse(from: $from, depth: $depth, types: $types) {
        nodes { id type }
        edges { id type }
        depth
      }
    }
  `,
  exportSubgraph: /* GraphQL */ `
    query ExportSubgraph($projectId: ID!) {
      subgraph(projectId: $projectId) {
        nodes { id type }
        relationships { id type }
      }
    }
  `,
};

// ──────────────────────────────────────────────
// Graphify Client
// ──────────────────────────────────────────────

export class GraphifyClient {
  private readonly config: GraphifyClientConfig;
  private localStore: LocalGraphStore | null = null;
  private isAvailable = true;
  private reconnectAttempts = 0;

  constructor(config: Partial<GraphifyClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.fallbackToLocal) {
      const storeDir = path.resolve(this.config.localStoreDir);
      if (!fs.existsSync(storeDir)) {
        fs.mkdirSync(storeDir, { recursive: true });
      }
      this.localStore = new LocalGraphStore(storeDir, this.config.projectId);
    }
  }

  // ─── Connection Management ──────────────────

  async connect(): Promise<boolean> {
    try {
      const result = await this.request<{ health: string }>('{ health }');
      this.isAvailable = true;
      this.reconnectAttempts = 0;
      return result.health === 'ok';
    } catch (err) {
      this.isAvailable = false;
      return false;
    }
  }

  async healthCheck(): Promise<{ connected: boolean; usingFallback: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        headers: this.authHeaders(),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      const latency = Date.now() - start;
      if (response.ok) {
        this.isAvailable = true;
        this.reconnectAttempts = 0;
        return { connected: true, usingFallback: false, latencyMs: latency };
      }
    } catch (_e) {
      // try reconnect
    }

    if (this.config.fallbackToLocal) {
      return { connected: false, usingFallback: true, latencyMs: Date.now() - start };
    }
    throw new GraphifyConnectionError('Graphify API is unreachable and fallback is disabled');
  }

  async reconnect(): Promise<boolean> {
    const delay = this.config.retryBaseDelayMs * 2 ** this.reconnectAttempts;
    await new Promise((r) => setTimeout(r, delay));
    this.reconnectAttempts++;
    return this.connect();
  }

  // ─── Node Operations ────────────────────────

  async upsertNode(node: GraphNode): Promise<GraphNode> {
    if (this.isAvailable) {
      try {
        const result = await this.request<{ upsertNode: { id: string } }>(
          GRAPHQL_QUERIES.upsertNode,
          { input: node }
        );
        if (result.upsertNode) {
          return node;
        }
      } catch (err) {
        if (this.config.fallbackToLocal) {
          this.localStore?.upsertNode(node);
          return node;
        }
        throw err;
      }
    } else if (this.config.fallbackToLocal) {
      this.localStore?.upsertNode(node);
      return node;
    }
    throw new GraphifyConnectionError('Graphify unavailable and fallback disabled');
  }

  async upsertNodes(nodes: GraphNode[]): Promise<GraphNode[]> {
    const results: GraphNode[] = [];
    for (const node of nodes) {
      results.push(await this.upsertNode(node));
    }
    return results;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    if (this.isAvailable) {
      try {
        const result = await this.request<{ nodes: { items: GraphNode[]; totalCount: number } }>(
          GRAPHQL_QUERIES.listNodes,
          { filter: { id } }
        );
        return result.nodes?.items[0] ?? null;
      } catch (_e) {
        if (this.config.fallbackToLocal) {
          return this.localStore?.getNode(id) ?? null;
        }
      }
    } else if (this.config.fallbackToLocal) {
      return this.localStore?.getNode(id) ?? null;
    }
    return null;
  }

  async deleteNode(id: string): Promise<void> {
    if (this.isAvailable) {
      try {
        await this.request<{ deleteNode: boolean }>(GRAPHQL_QUERIES.deleteNode, { id });
        return;
      } catch (_e) {
        if (!this.config.fallbackToLocal) throw new GraphifyConnectionError('Graphify unavailable and fallback disabled');
      }
    }
    if (this.config.fallbackToLocal) {
      this.localStore?.deleteNode(id);
    }
  }

  async listNodes(filter?: { type?: NodeType; projectId?: string }, limit = 50): Promise<GraphQueryResult<GraphNode>> {
    if (this.isAvailable) {
      try {
        const result = await this.request<{ nodes: GraphQueryResult<GraphNode> }>(
          GRAPHQL_QUERIES.listNodes,
          { filter, limit }
        );
        return result.nodes;
      } catch (_e) {
        if (!this.config.fallbackToLocal) throw new GraphifyConnectionError('Graphify unavailable and fallback disabled');
      }
    }
    if (this.config.fallbackToLocal) {
      const nodes = this.localStore?.listNodes(filter?.projectId) ?? [];
      return {
        data: nodes,
        totalCount: nodes.length,
        hasMore: false,
      };
    }
    return { data: [], totalCount: 0, hasMore: false };
  }

  // ─── Relationship Operations ────────────────

  async upsertRelationship(rel: Relationship): Promise<Relationship> {
    if (this.isAvailable) {
      try {
        await this.request<{ upsertRelationship: { id: string } }>(
          GRAPHQL_QUERIES.upsertRelationship,
          { input: rel }
        );
        return rel;
      } catch (_e) {
        if (!this.config.fallbackToLocal) throw new GraphifyConnectionError('Graphify unavailable and fallback disabled');
      }
    }
    if (this.config.fallbackToLocal) {
      this.localStore?.upsertRelationship(rel);
    }
    return rel;
  }

  async upsertRelationships(rels: Relationship[]): Promise<Relationship[]> {
    const results: Relationship[] = [];
    for (const rel of rels) {
      results.push(await this.upsertRelationship(rel));
    }
    return results;
  }

  async traverse(
    fromId: string,
    depth = 3,
    types?: NodeType[]
  ): Promise<TraversalResult> {
    if (this.isAvailable) {
      try {
        const result = await this.request<{ traverse: TraversalResult }>(
          GRAPHQL_QUERIES.traverse,
          { from: fromId, depth, types }
        );
        return result.traverse;
      } catch (_e) {
        if (!this.config.fallbackToLocal) throw new GraphifyConnectionError('Graphify unavailable and fallback disabled');
      }
    }
    // Local fallback: BFS traversal
    return this.localTraverse(fromId, depth, types);
  }

  // ─── Export / Import ────────────────────────

  async exportSubgraph(projectId: string): Promise<SubgraphExport> {
    if (this.isAvailable) {
      try {
        const result = await this.request<{ subgraph: SubgraphExport }>(
          GRAPHQL_QUERIES.exportSubgraph,
          { projectId }
        );
        return result.subgraph;
      } catch (_e) {
        if (!this.config.fallbackToLocal) throw new GraphifyConnectionError('Graphify unavailable and fallback disabled');
      }
    }
    if (this.config.fallbackToLocal) {
      return this.localStore?.export() ?? {
        projectId,
        exportedAt: new Date().toISOString(),
        nodes: [],
        relationships: [],
      };
    }
    return {
      projectId,
      exportedAt: new Date().toISOString(),
      nodes: [],
      relationships: [],
    };
  }

  async importSubgraph(exportData: SubgraphExport): Promise<void> {
    if (exportData.nodes.length > 0) {
      await this.upsertNodes(exportData.nodes);
    }
    if (exportData.relationships.length > 0) {
      await this.upsertRelationships(exportData.relationships);
    }
  }

  async clearProject(projectId: string): Promise<void> {
    if (this.isAvailable) {
      try {
        const result = await this.listNodes({ projectId }, 1000);
        for (const node of result.data) {
          await this.deleteNode(node.id);
        }
        return;
      } catch (_e) {
        if (!this.config.fallbackToLocal) throw new GraphifyConnectionError('Graphify unavailable and fallback disabled');
      }
    }
    if (this.config.fallbackToLocal) {
      this.localStore?.clear();
    }
  }

  // ─── Status / Info ──────────────────────────

  async getStatus(): Promise<{
    connected: boolean;
    usingFallback: boolean;
    nodeCount: number;
    relationshipCount: number;
    latencyMs: number;
  }> {
    const health = await this.healthCheck();
    let nodeCount = 0;
    let relationshipCount = 0;

    if (health.usingFallback && this.localStore) {
      const nodes = this.localStore.listNodes();
      nodeCount = nodes.length;
    } else if (health.connected) {
      const result = await this.listNodes();
      nodeCount = result.totalCount;
    }

    return {
      ...health,
      nodeCount,
      relationshipCount,
    };
  }

  // ─── Persistence ────────────────────────────

  persistLocal(): void {
    this.localStore?.persistSync();
  }

  // ─── Private Helpers ────────────────────────

  private authHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }
    return headers;
  }

  private async request<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const lastErr = await this.retryRequest<T>(query, variables, 0);
    return lastErr;
  }

  private async retryRequest<T>(
    query: string,
    variables: Record<string, unknown> | undefined,
    attempt: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.apiUrl}/graphql`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new GraphifyConnectionError(
          `Graphify API returned HTTP ${response.status}: ${response.statusText}`
        );
      }

      const payload = (await response.json()) as {
        data?: T;
        errors?: Array<{ message: string }>;
      };

      if (payload.errors?.length) {
        throw new GraphifyQueryError(
          payload.errors.map((e) => e.message).join('; '),
          query
        );
      }

      if (!payload.data) {
        throw new GraphifyQueryError('Empty response data', query);
      }

      return payload.data;
    } catch (err) {
      clearTimeout(timeoutId);

      if (attempt < this.config.maxRetries) {
        const delay = this.config.retryBaseDelayMs * 2 ** attempt;
        await new Promise((r) => setTimeout(r, delay));
        return this.retryRequest(query, variables, attempt + 1);
      }

      if (err instanceof GraphifyQueryError || err instanceof GraphifyConnectionError) {
        throw err;
      }
      throw new GraphifyConnectionError('Request failed after retries', err as Error);
    }
  }

  /** Breadth-first traversal using local store data. */
  private localTraverse(fromId: string, maxDepth: number, _types?: NodeType[]): TraversalResult {
    const visited = new Set<string>();
    const nodes: GraphNode[] = [];
    const edges: Relationship[] = [];
    const queue: { id: string; depth: number }[] = [{ id: fromId, depth: 0 }];

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id) || depth > maxDepth) continue;
      visited.add(id);

      const node = this.localStore?.getNode(id);
      if (node) {
        nodes.push(node);
      }

      // Walk relationships
      const allRels = this.localStore?.listRelationships() ?? [];
      for (const rel of allRels) {
        if (rel.sourceId === id || rel.targetId === id) {
          edges.push(rel);
          const neighborId = rel.sourceId === id ? rel.targetId : rel.sourceId;
          if (!visited.has(neighborId) && depth < maxDepth) {
            queue.push({ id: neighborId, depth: depth + 1 });
          }
        }
      }
    }

    return { nodes, edges, depth: maxDepth };
  }
}

// ──────────────────────────────────────────────
// Convenience Singleton
// ──────────────────────────────────────────────

let sharedInstance: GraphifyClient | null = null;

export function getGraphifyClient(config?: Partial<GraphifyClientConfig>): GraphifyClient {
  if (!sharedInstance) {
    sharedInstance = new GraphifyClient(config);
  }
  return sharedInstance;
}

export function resetGraphifyClient(): void {
  sharedInstance = null;
}
