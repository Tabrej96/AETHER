/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Graphify — In-Memory Persistence
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * Provides a simple in-memory Map-based persistence layer for the
 * Graphify knowledge graph. Used as the local fallback when the
 * Graphify API is unavailable and for testing.
 */

import type { GraphNode, Relationship } from './schema';

// ──────────────────────────────────────────────
// Public Interface
// ──────────────────────────────────────────────

export interface MemoryPersistence {
  /** Save nodes and relationships to the in-memory store. */
  save(nodes: Map<string, GraphNode>, rels: Relationship[]): Promise<void>;
  /** Load all nodes and relationships from the in-memory store. */
  load(): Promise<{ nodes: Map<string, GraphNode>; relationships: Relationship[] }>;
  /** Clear all stored data. */
  clear(): Promise<void>;
}

// ──────────────────────────────────────────────
// Implementation
// ──────────────────────────────────────────────

const stores = new Map<string, { nodes: Map<string, GraphNode>; rels: Relationship[] }>();

function getStore(projectId: string): { nodes: Map<string, GraphNode>; rels: Relationship[] } {
  let store = stores.get(projectId);
  if (!store) {
    store = { nodes: new Map(), rels: [] };
    stores.set(projectId, store);
  }
  return store;
}

export function getMemoryPersistence(_config: { projectId: string }): MemoryPersistence {
  return {
    async save(nodes: Map<string, GraphNode>, rels: Relationship[]): Promise<void> {
      // Merge into existing store
      const store = getStore(_config.projectId);
      for (const [id, node] of nodes) {
        store.nodes.set(id, node);
      }
      // Append relationships (avoid duplicating by id)
      const existingIds = new Set(store.rels.map((r) => r.id).filter(Boolean));
      for (const rel of rels) {
        if (rel.id && existingIds.has(rel.id)) continue;
        store.rels.push(rel);
      }
    },

    async load(): Promise<{ nodes: Map<string, GraphNode>; relationships: Relationship[] }> {
      const store = getStore(_config.projectId);
      return {
        nodes: new Map(store.nodes),
        relationships: [...store.rels],
      };
    },

    async clear(): Promise<void> {
      stores.set(_config.projectId, { nodes: new Map(), rels: [] });
    },
  };
}

export function resetMemoryPersistence(projectId?: string): void {
  if (projectId) {
    stores.delete(projectId);
  } else {
    stores.clear();
  }
}
