/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Public API
 *
 * Re-exports all public types and classes.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

export { MemoryEngine, type MemoryEngineConfig } from './memoryEngine';
export { MemoryStore, type StorageOptions } from './memoryStore';
export { MemoryIndex } from './memoryIndex';
export { MemorySearcher } from './memorySearch';
export { MemoryConsolidator } from './memoryConsolidation';
export { MemoryLearner, type ExecutionOutcome, type PatternMatch } from './memoryLearning';
export { MemoryPrivacy, type AccessPolicy } from './memoryPrivacy';

export type {
  Memory,
  MemoryType,
  MemoryMetadata,
  MemoryProvenance,
  MemoryQuery,
  MemoryConsolidationResult,
  MemoryLearningResult,
  LearningSuggestion,
  MemoryStats,
  MemorySearchResult,
  IndexEntry,
  AccessLevel,
  ProvenanceMethod,
  MemoryStatus,
} from './types';
