/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Graphify Barrel Export for AETHER
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * Re-exports the complete Graphify knowledge graph integration.
 */

// Core types from the new types.ts
export type {
  GraphifyConfig,
  GraphNode,
  Relationship,
  TraversalResult,
  SubgraphExport,
  GraphQueryResult,
} from './graphify/types.js';

// Domain-specific node types from schema.ts
export type {
  ProjectNode,
  ContextNode,
  SessionNode,
  CodePatternNode,
  ArchitectureNode,
  IndustryNode,
  MemoryNode,
  NodeType,
  RelationshipType,
} from './graphify/schema.js';
export {
  NODE_INDEX_CONFIGS,
  getNodeTypeLabel,
  assertValidRelationship,
} from './graphify/schema.js';

// HTTP client
export {
  GraphifyClient,
  getGraphifyClient,
  resetGraphifyClient,
  DEFAULT_CONFIG,
} from './graphify/client.js';
export type {
  GraphifyClientConfig,
  GraphifyConnectionError,
  GraphifyQueryError,
  GraphifyLocalFallbackError,
} from './graphify/client.js';

// Main integration class
export {
  GraphifyIntegration,
  createGraphifyIntegration,
} from './graphify/index.js';
export type {
  GraphifyProjectConfig,
  GraphifyStatus,
  ResumeInfo,
  StoredContext,
} from './graphify/index.js';

// New in-memory persistence interface
export type { MemoryPersistence } from './graphify/memoryPersistence.js';
export { getMemoryPersistence, resetMemoryPersistence } from './graphify/memoryPersistence.js';

// Legacy file-based persistence for backward compatibility
export {
  createDefaultState,
} from './graphify/memory.js';
export type {
  MemoryState,
  MemoryPersistenceConfig,
  MemoryStats,
  MergeOptions,
} from './graphify/memory.js';
