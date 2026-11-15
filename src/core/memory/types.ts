/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Core Types
 *
 * This module provides the fundamental types for the memory system.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

export type MemoryType = 'fact' | 'decision' | 'preference' | 'lesson' | 'context' | 'artifact';
export type ProvenanceMethod = 'explicit' | 'inferred' | 'learned';
export type AccessLevel = 'public' | 'internal' | 'confidential' | 'secret';
export type MemoryStatus = 'active' | 'archived' | 'consolidated' | 'expired' | 'deleted';

export interface Memory {
  id: string;
  type: MemoryType;
  key: string;
  value: unknown;
  metadata: MemoryMetadata;
  provenance: MemoryProvenance;
  tags: string[];
  expiresAt?: Date;
  status: MemoryStatus;
  createdAt: Date;
  updatedAt: Date;
  accessedAt: Date;
  accessCount: number;
}

export interface MemoryMetadata {
  project: string;
  session: string;
  agent: string;
  confidence: number;
  source: string;
  verified: boolean;
  accessLevel: AccessLevel;
}

export interface MemoryProvenance {
  source: string;
  method: ProvenanceMethod;
  evidence: string[];
  relatedMemories?: string[];
}

export interface MemoryQuery {
  type?: MemoryType;
  key?: string;
  tags?: string[];
  project?: string;
  session?: string;
  agent?: string;
  since?: Date;
  until?: Date;
  limit?: number;
  minConfidence?: number;
  status?: MemoryStatus;
  searchText?: string;
}

export interface MemoryConsolidationResult {
  summarized: number;
  archived: number;
  deleted: number;
  details: string[];
}

export interface MemoryLearningResult {
  patternsFound: number;
  strategiesIdentified: number;
  failurePatterns: number;
  suggestions: LearningSuggestion[];
}

export interface LearningSuggestion {
  type: 'new_memory' | 'update_memory' | 'delete_memory' | 'consolidate';
  memoryId?: string;
  key: string;
  value: unknown;
  reason: string;
  confidence: number;
}

export interface MemoryStats {
  totalMemories: number;
  byType: Record<MemoryType, number>;
  byProject: Record<string, number>;
  byAgent: Record<string, number>;
  avgConfidence: number;
  oldestMemory?: Date;
  newestMemory?: Date;
  totalAccesses: number;
  consolidationDue: number;
  expiredCount: number;
}

export interface MemorySearchResult {
  memories: Memory[];
  totalCount: number;
  queryTimeMs: number;
  relevanceScores?: Map<string, number>;
}

export interface IndexEntry {
  type: MemoryType;
  key: string;
  tags: string[];
  project: string;
  session: string;
  agent: string;
  timestamp: number;
  confidence: number;
  accessLevel: AccessLevel;
  status: MemoryStatus;
  memoryId: string;
}
