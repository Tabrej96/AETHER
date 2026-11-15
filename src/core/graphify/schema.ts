/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Graphify Schema Definitions for the AETHER Knowledge Graph Integration
 *
 * Schema inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * Defines node types, relationship types, and index strategies for the
 * AETHER project's knowledge graph layer. Used by the Graphify client
 * and memory persistence modules to enforce a consistent graph model.
 */

// ──────────────────────────────────────────────
// Node Type Definitions
// ──────────────────────────────────────────────

export interface ProjectNode {
  /** Unique node identifier */
  id: string;
  /** Graph node type discriminator */
  type: 'Project';
  /** AETHER project identifier (matches metadata.json name) */
  projectId: string;
  /** Human-readable project name */
  name: string;
  /** Current lifecycle status */
  status: 'active' | 'paused' | 'completed' | 'archived';
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** ISO-8601 last-modified timestamp */
  updatedAt: string;
  /** Semantic version of the project */
  version: string;
  /** Path to the project root on disk */
  rootPath: string;
  /** Count of active agents in the project */
  agentCount: number;
  /** Count of registered skills */
  skillCount: number;
  /** Count of registered workflows */
  workflowCount: number;
  /** Arbitrary metadata key-value pairs */
  metadata: Record<string, unknown>;
}

export interface ContextNode {
  type: 'Context';
  /** Unique context / session identifier */
  id: string;
  /** Owning project id */
  projectId: string;
  /** Optional parent context (for threading) */
  parentId: string | null;
  /** The user prompt that triggered this context */
  userPrompt: string;
  /** Hash of generated code for deduplication */
  generatedCodeHash: string | null;
  /** Whether this context is an interrupted session */
  isInterrupted: boolean;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Token count of the context */
  tokenCount: number;
  /** Agent that handled this context */
  handledBy: string;
  /** Tags for searchability */
  tags: string[];
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

export interface IndustryNode {
  type: 'Industry';
  /** Unique industry / domain identifier */
  id: string;
  /** Project this belongs to */
  projectId: string;
  /** Industry category (e.g. "fintech", "healthtech", "devtools") */
  industryType: string;
  /** Competitor features discovered during research */
  competitorFeatures: string[];
  /** Features generated for this industry */
  generatedFeatures: string[];
  /** Market analysis summary */
  analysisSummary: string;
  /** ISO-8601 timestamp of last analysis */
  analyzedAt: string;
  /** Source repositories or references */
  sources: string[];
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

export interface ArchitectureNode {
  type: 'Architecture';
  /** Unique architecture snapshot identifier */
  id: string;
  /** Project this belongs to */
  projectId: string;
  /** Human-readable architecture name */
  name: string;
  /** Pillars implemented in this architecture */
  pillarsImplemented: string[];
  /** Systems built as part of this architecture */
  systemsBuilt: string[];
  /** Aggregate test results */
  testResults: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
  /** Technology stack */
  techStack: string[];
  /** ISO-8601 timestamp of this snapshot */
  createdAt: string;
  /** Whether this is the current active architecture */
  isCurrent: boolean;
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

export interface CodePatternNode {
  type: 'CodePattern';
  /** Unique pattern identifier */
  id: string;
  /** Project this belongs to */
  projectId: string;
  /** Pattern category */
  category: string;
  /** Pattern name */
  name: string;
  /** Code snippet or reference */
  codeSnippet: string | null;
  /** File path where pattern originates */
  sourcePath: string | null;
  /** Number of times this pattern was reused */
  reuseCount: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** ISO-8601 timestamp */
  createdAt: string;
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

export interface SessionNode {
  type: 'Session';
  /** Unique session identifier */
  id: string;
  /** Project this session belongs to */
  projectId: string;
  /** Session start timestamp */
  startedAt: string;
  /** Session end timestamp (null if active) */
  endedAt: string | null;
  /** Whether session completed normally */
  completed: boolean;
  /** Number of operations performed */
  operationCount: number;
  /** Last checkpoint id within this session */
  lastCheckpointId: string | null;
  /** Session summary */
  summary: string | null;
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

export interface MemoryNode {
  type: 'Memory';
  id: string;
  projectId: string;
  data: { key: string; value: unknown };
  createdAt: string;
  updatedAt: string;
}

export type GraphNode = ProjectNode | ContextNode | IndustryNode | ArchitectureNode | CodePatternNode | SessionNode | MemoryNode;

// ──────────────────────────────────────────────
// Relationship Type Definitions
// ──────────────────────────────────────────────

export interface Relationship<T = Record<string, unknown>> {
  /** Unique relationship identifier */
  id: string;
  /** Graph edge type discriminator */
  type: RelationshipType;
  /** Source node id */
  sourceId: string;
  /** Source node type */
  sourceType: NodeType;
  /** Target node id */
  targetId: string;
  /** Target node type */
  targetType: NodeType;
  /** Edge properties */
  properties: T;
  /** ISO-8601 creation timestamp */
  createdAt: string;
}

export type RelationshipType =
  | 'GENERATED_FROM'   // Code / context was generated from a session
  | 'DEPENDS_ON'       // Node depends on another node
  | 'IMPLEMENTS'       // Implementation satisfies a requirement / pillar
  | 'TESTED_BY'        // Code or system was tested by a benchmark / test
  | 'PART_OF'          // Node is part of a larger structure
  | 'REFERENCES'       // Node references another node
  | 'DERIVED_FROM'     // Node derived from another node
  | 'CONTAINS';        // Container → contained relationship

export type NodeType = GraphNode['type'];

// ──────────────────────────────────────────────
// Query Result Types
// ──────────────────────────────────────────────

export interface GraphQueryResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  cursor?: string;
}

export interface TraversalResult {
  nodes: GraphNode[];
  edges: Relationship[];
  depth: number;
}

export interface SubgraphExport {
  projectId: string;
  exportedAt: string;
  nodes: GraphNode[];
  relationships: Relationship[];
}

// ──────────────────────────────────────────────
// Index Configuration
// ──────────────────────────────────────────────

export interface NodeIndexConfig {
  /** Properties to index for fast lookup */
  indexes: string[];
  /** Properties that are unique */
  unique: string[];
  /** Whether to use full-text search on this node type */
  fullTextSearch: boolean;
}

export const NODE_INDEX_CONFIGS: Record<NodeType, NodeIndexConfig> = {
  Project: {
    indexes: ['projectId', 'name', 'status', 'createdAt'],
    unique: ['id', 'projectId'],
    fullTextSearch: true,
  },
  Context: {
    indexes: ['projectId', 'parentId', 'isInterrupted', 'timestamp', 'handledBy'],
    unique: ['id'],
    fullTextSearch: true,
  },
  Industry: {
    indexes: ['projectId', 'industryType', 'analyzedAt'],
    unique: ['id'],
    fullTextSearch: true,
  },
  Architecture: {
    indexes: ['projectId', 'isCurrent', 'createdAt'],
    unique: ['id'],
    fullTextSearch: false,
  },
  CodePattern: {
    indexes: ['projectId', 'category', 'name', 'sourcePath'],
    unique: ['id'],
    fullTextSearch: true,
  },
  Session: {
    indexes: ['projectId', 'completed', 'startedAt', 'endedAt'],
    unique: ['id'],
    fullTextSearch: false,
  },
  Memory: {
    indexes: ['projectId'],
    unique: ['id'],
    fullTextSearch: false,
  },
};

// ──────────────────────────────────────────────
// Validation Helpers
// ──────────────────────────────────────────────

export function getNodeTypeLabel(node: GraphNode): string {
  return node.type;
}

export function isMemoryNode(node: GraphNode): node is MemoryNode {
  return node.type === 'Memory';
}

export function assertValidRelationship(
  source: { id: string; type: NodeType },
  target: { id: string; type: NodeType },
  relType: RelationshipType
): void {
  if (!source.id || !target.id) {
    throw new Error('Both source and target must have valid ids');
  }
  // Prevent self-referential edges unless explicitly supported
  if (source.id === target.id && relType !== 'REFERENCES') {
    throw new Error(`Self-referential relationships are not supported for type: ${relType}`);
  }
}
