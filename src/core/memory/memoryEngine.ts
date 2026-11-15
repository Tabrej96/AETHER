/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Core Engine
 *
 * Provides a persistent, searchable, learning memory system for AETHER agents.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import { MemoryStore } from './memoryStore';
import { MemoryIndex } from './memoryIndex';
import { MemorySearcher } from './memorySearch';
import { MemoryConsolidator } from './memoryConsolidation';
import { MemoryLearner } from './memoryLearning';
import { MemoryPrivacy } from './memoryPrivacy';
import { sha256Hex } from '../crypto/sha256';
import type {
  Memory,
  MemoryQuery,
  MemoryMetadata,
  MemoryProvenance,
  MemoryConsolidationResult,
  MemoryLearningResult,
  LearningSuggestion,
  MemoryStats,
  MemorySearchResult,
  MemoryType,
  AccessLevel,
  ProvenanceMethod,
  MemoryStatus,
} from './types';

const SENSITIVE_TAG_PATTERNS = [
  /secret/i,
  /password/i,
  /credential/i,
  /token/i,
  /key/i,
  /private[_-]?key/i,
  /api[_-]?key/i,
  /auth/i,
];

function detectSensitivity(key: string, value: unknown, tags: string[]): AccessLevel {
  const combined = `${key} ${JSON.stringify(value)} ${tags.join(' ')}`;
  for (const pattern of SENSITIVE_TAG_PATTERNS) {
    if (pattern.test(combined)) {
      return 'secret';
    }
  }
  return 'internal';
}

export interface MemoryEngineConfig {
  project: string;
  session: string;
  agent: string;
  storeDir?: string;
  enableConsolidation?: boolean;
  consolidationIntervalMs?: number;
  enableLearning?: boolean;
  defaultAccessLevel?: AccessLevel;
}

export class MemoryEngine {
  private readonly config: Required<Omit<MemoryEngineConfig, 'defaultAccessLevel'>> & {
    defaultAccessLevel?: AccessLevel;
  };
  private readonly store: MemoryStore;
  private readonly index: MemoryIndex;
  private readonly searcher: MemorySearcher;
  private readonly consolidator: MemoryConsolidator;
  private readonly learner: MemoryLearner;
  private readonly privacy: MemoryPrivacy;
  private consolidationTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: MemoryEngineConfig) {
    this.config = {
      project: config.project,
      session: config.session,
      agent: config.agent,
      storeDir: config.storeDir ?? './aether-memory',
      enableConsolidation: config.enableConsolidation ?? true,
      consolidationIntervalMs: config.consolidationIntervalMs ?? 30 * 60 * 1000,
      enableLearning: config.enableLearning ?? true,
      defaultAccessLevel: config.defaultAccessLevel ?? 'internal',
    };

    this.store = new MemoryStore(this.config.storeDir, this.config.project);
    this.index = new MemoryIndex();
    this.searcher = new MemorySearcher();
    this.consolidator = new MemoryConsolidator(this.store, this.index);
    this.learner = new MemoryLearner(this);
    this.privacy = new MemoryPrivacy();

    // Rebuild index from persisted store
    this.rebuildIndex();

    if (this.config.enableConsolidation) {
      this.startConsolidationSchedule();
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  storeMemory(
    type: MemoryType,
    key: string,
    value: unknown,
    options: {
      tags?: string[];
      provenanceSource?: string;
      provenanceMethod?: ProvenanceMethod;
      evidence?: string[];
      expiresInMs?: number;
      confidence?: number;
      accessLevel?: AccessLevel;
    } = {}
  ): Memory {
    const now = new Date();
    const accessLevel = options.accessLevel ?? detectSensitivity(key, value, options.tags ?? []);
    const metadata: MemoryMetadata = {
      project: this.config.project,
      session: this.config.session,
      agent: this.config.agent,
      confidence: options.confidence ?? 1.0,
      source: options.provenanceSource ?? 'explicit',
      verified: false,
      accessLevel,
    };
    const provenance: MemoryProvenance = {
      source: options.provenanceSource ?? 'explicit',
      method: options.provenanceMethod ?? 'explicit',
      evidence: options.evidence ?? [],
    };
    const memory: Memory = {
      id: this.generateId(type, key),
      type,
      key,
      value,
      metadata,
      provenance,
      tags: options.tags ?? [],
      expiresAt: options.expiresInMs ? new Date(now.getTime() + options.expiresInMs) : undefined,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      accessedAt: now,
      accessCount: 0,
    };

    // Persist to store
    this.store.save(memory);

    // Index
    this.index.add(memory);

    return memory;
  }

  recall(query: MemoryQuery): Memory[] {
    const results = this.index.query(query);
    // Sort by relevance if full-text search is present
    if (query.searchText) {
      results.sort((a, b) => {
        const scoreA = this.searcher.relevanceScore(query.searchText!, a);
        const scoreB = this.searcher.relevanceScore(query.searchText!, b);
        return scoreB - scoreA;
      });
    }
    const limited = query.limit ? results.slice(0, query.limit) : results;
    // Update access tracking
    for (const mem of limited) {
      this.incrementAccess(mem.id);
    }
    return limited;
  }

  recallOne(query: MemoryQuery): Memory | undefined {
    const results = this.recall({ ...query, limit: 1 });
    return results[0];
  }

  update(key: string, value: unknown, options: { mergeTags?: string[]; appendEvidence?: string[] } = {}): Memory | undefined {
    const existing = this.recallOne({ key });
    if (!existing) return undefined;

    const updated: Memory = {
      ...existing,
      value,
      updatedAt: new Date(),
      tags: options.mergeTags
        ? [...new Set([...existing.tags, ...options.mergeTags])]
        : existing.tags,
      provenance: {
        ...existing.provenance,
        evidence: options.appendEvidence
          ? [...existing.provenance.evidence, ...options.appendEvidence]
          : existing.provenance.evidence,
      },
    };

    this.store.update(updated);
    this.index.remove(existing.id);
    this.index.add(updated);
    return updated;
  }

  forget(key: string): boolean {
    const existing = this.recallOne({ key });
    if (!existing) return false;
    this.index.remove(existing.id);
    this.store.softDelete(existing.id);
    return true;
  }

  consolidate(): MemoryConsolidationResult {
    return this.consolidator.consolidate();
  }

  learn(outcome: {
    taskId: string;
    success: boolean;
    durationMs: number;
    strategy: string;
    error?: string;
    context?: Record<string, unknown>;
  }): LearningSuggestion[] {
    return this.learner.analyzeOutcome(outcome);
  }

  getStats(): MemoryStats {
    const all = this.store.loadAll();
    const active = all.filter((m) => m.status === 'active');
    const byType: Record<MemoryType, number> = {
      fact: 0, decision: 0, preference: 0, lesson: 0, context: 0, artifact: 0,
    };
    const byProject: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    let totalConf = 0;
    let oldest: Date | undefined;
    let newest: Date | undefined;
    let totalAccesses = 0;
    let consolidationDue = 0;
    let expiredCount = 0;
    for (const mem of all) {
      byType[mem.type] = (byType[mem.type] ?? 0) + 1;
      byProject[mem.metadata.project] = (byProject[mem.metadata.project] ?? 0) + 1;
      byAgent[mem.metadata.agent] = (byAgent[mem.metadata.agent] ?? 0) + 1;
      totalConf += mem.metadata.confidence;
      if (!oldest || mem.createdAt < oldest) oldest = mem.createdAt;
      if (!newest || mem.createdAt > newest) newest = mem.createdAt;
      totalAccesses += mem.accessCount;
      if (mem.status === 'expired') expiredCount++;
    }
    // Count memories older than 60 days as consolidation candidates
    const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    for (const mem of active) {
      if (mem.createdAt < cutoff) consolidationDue++;
    }
    return {
      totalMemories: all.length,
      byType,
      byProject,
      byAgent,
      avgConfidence: all.length > 0 ? Number((totalConf / all.length).toFixed(2)) : 0,
      oldestMemory: oldest,
      newestMemory: newest,
      totalAccesses,
      consolidationDue,
      expiredCount,
    };
  }

  exportMemories(query?: MemoryQuery): Memory[] {
    return this.privacy.redactForExport(this.recall(query ?? {}));
  }

  shutdown(): void {
    if (this.consolidationTimer) {
      clearInterval(this.consolidationTimer);
      this.consolidationTimer = null;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private generateId(type: MemoryType, key: string): string {
    const raw = `${type}:${key}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
    const hash = sha256Hex(raw).slice(0, 12);
    return `mem_${type[0]}${hash}`;
  }

  private incrementAccess(id: string): void {
    const all = this.store.loadAll();
    const target = all.find((m) => m.id === id);
    if (target) {
      target.accessCount += 1;
      target.accessedAt = new Date();
      this.store.update(target);
      this.index.update(target);
    }
  }

  private rebuildIndex(): void {
    const all = this.store.loadAll();
    for (const mem of all) {
      if (mem.status !== 'deleted') {
        this.index.add(mem);
      }
    }
  }

  private startConsolidationSchedule(): void {
    if (typeof setInterval === 'undefined') return;
    this.consolidationTimer = setInterval(() => {
      try {
        this.consolidate();
      } catch {
        // non-fatal
      }
    }, this.config.consolidationIntervalMs);
  }
}
