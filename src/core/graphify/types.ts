/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Graphify — Core Type Definitions
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * Canonical type definitions for the Graphify knowledge graph integration,
 * shared across client, persistence, and integration modules.
 */

// ──────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────

export interface GraphifyConfig {
  /** Graphify API base URL (default: http://localhost:4000) */
  endpoint?: string;
  /** Project identifier for graph isolation */
  projectId: string;
  /** Fall back to local in-memory store when API is unavailable */
  fallbackToLocal: boolean;
  /** Auto-save after every N operations */
  autoSaveInterval: number;
}

// ──────────────────────────────────────────────
// Graph Node Types
// ──────────────────────────────────────────────

export interface GraphNode {
  id: string;
  type: string;
  projectId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Relationship Types
// ──────────────────────────────────────────────

export interface Relationship {
  id?: string;
  fromId: string;
  toId: string;
  type: string;
  properties?: Record<string, unknown>;
}

// ──────────────────────────────────────────────
// Query Result Types
// ──────────────────────────────────────────────

export interface TraversalResult {
  nodes: GraphNode[];
  relationships: Relationship[];
}

// ──────────────────────────────────────────────
// Export Types
// ──────────────────────────────────────────────

export interface SubgraphExport {
  projectId: string;
  exportedAt: string;
  nodes: GraphNode[];
  relationships: Relationship[];
}

// ──────────────────────────────────────────────
// Query Result (paginated list)
// ──────────────────────────────────────────────

export interface GraphQueryResult<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  cursor?: string;
}

// ──────────────────────────────────────────────
// Extended Node Types (domain-specific)
// ──────────────────────────────────────────────

export type NodeType = 'Project' | 'Context' | 'Session' | 'CodePattern' | 'Architecture' | 'Industry';

export type RelationshipType =
  | 'GENERATED_FROM'
  | 'DEPENDS_ON'
  | 'IMPLEMENTS'
  | 'TESTED_BY'
  | 'PART_OF'
  | 'REFERENCES'
  | 'DERIVED_FROM'
  | 'CONTAINS';

export interface ProjectNode {
  id: string;
  type: 'Project';
  projectId: string;
  name: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  version: string;
  rootPath: string;
  agentCount: number;
  skillCount: number;
  workflowCount: number;
  metadata: Record<string, unknown>;
}

export interface ContextNode {
  type: 'Context';
  id: string;
  projectId: string;
  parentId: string | null;
  userPrompt: string;
  generatedCodeHash: string | null;
  isInterrupted: boolean;
  timestamp: string;
  tokenCount: number;
  handledBy: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface SessionNode {
  type: 'Session';
  id: string;
  projectId: string;
  startedAt: string;
  endedAt: string | null;
  completed: boolean;
  operationCount: number;
  lastCheckpointId: string | null;
  summary: string | null;
  metadata: Record<string, unknown>;
}

export interface CodePatternNode {
  type: 'CodePattern';
  id: string;
  projectId: string;
  category: string;
  name: string;
  codeSnippet: string | null;
  sourcePath: string | null;
  reuseCount: number;
  confidence: number;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface ArchitectureNode {
  type: 'Architecture';
  id: string;
  projectId: string;
  name: string;
  pillarsImplemented: string[];
  systemsBuilt: string[];
  testResults: { passed: number; failed: number; skipped: number; total: number };
  techStack: string[];
  createdAt: string;
  isCurrent: boolean;
  metadata: Record<string, unknown>;
}

export interface IndustryNode {
  type: 'Industry';
  id: string;
  projectId: string;
  industryType: string;
  competitorFeatures: string[];
  generatedFeatures: string[];
  analysisSummary: string;
  analyzedAt: string;
  sources: string[];
  metadata: Record<string, unknown>;
}

export type GraphNodeUnion = ProjectNode | ContextNode | SessionNode | CodePatternNode | ArchitectureNode | IndustryNode;
