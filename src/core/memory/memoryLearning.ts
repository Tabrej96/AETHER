/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Learning
 *
 * Extracts patterns from execution outcomes and suggests memory updates.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import type { Memory, MemoryQuery, MemoryType, LearningSuggestion, MemoryLearningResult } from './types';

export interface ExecutionOutcome {
  taskId: string;
  success: boolean;
  durationMs: number;
  strategy: string;
  error?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

export interface PatternMatch {
  pattern: string;
  occurrences: number;
  successRate: number;
  avgDurationMs: number;
}

export class MemoryLearner {
  private readonly outcomes: ExecutionOutcome[] = [];
  private readonly seenPatterns: Map<string, PatternMatch> = new Map();

  constructor(private readonly memoryEngine: {
    recall: (q: MemoryQuery) => Memory[];
    storeMemory: (type: MemoryType, key: string, value: unknown, opts?: Record<string, unknown>) => Memory;
  }) {}

  recordOutcome(outcome: ExecutionOutcome): void {
    this.outcomes.push(outcome);
    this.updatePatterns(outcome);
  }

  analyzeOutcome(outcome: ExecutionOutcome): LearningSuggestion[] {
    this.recordOutcome(outcome);
    const suggestions: LearningSuggestion[] = [];

    // Successful strategy → store as preference
    if (outcome.success && outcome.strategy) {
      const key = `strategy:${outcome.strategy.replace(/\s+/g, '_').toLowerCase()}`;
      suggestions.push({
        type: 'new_memory',
        key,
        value: {
          strategy: outcome.strategy,
          avgDurationMs: outcome.durationMs,
          successCount: this.patternCount(outcome.strategy, true) + 1,
          sampleContext: outcome.context,
        },
        reason: `Strategy succeeded in task ${outcome.taskId}`,
        confidence: Math.min(0.95, 0.6 + this.patternCount(outcome.strategy, true) * 0.1),
      });
    }

    // Failure → store as lesson
    if (!outcome.success && outcome.error) {
      const key = `lesson:${outcome.taskId}`;
      const existing = this.memoryEngine.recall({ key }).find((m) => m.key === key);
      if (!existing) {
        suggestions.push({
          type: 'new_memory',
          key,
          value: {
            taskId: outcome.taskId,
            error: outcome.error,
            strategy: outcome.strategy,
            durationMs: outcome.durationMs,
          },
          reason: `Recorded failure for learning`,
          confidence: 0.95,
        });
      } else {
        suggestions.push({
          type: 'update_memory',
          memoryId: existing.id,
          key,
          value: {
            ...(existing.value as Record<string, unknown>),
            occurrences: ((existing.value as Record<string, unknown>).occurrences as number ?? 0) + 1,
            lastSeen: outcome.timestamp.toISOString(),
          },
          reason: `Failure recurred, updating lesson memory`,
          confidence: Math.min(0.99, existing.metadata.confidence + 0.05),
        });
      }
    }

    // Detect repeated failure pattern
    const failurePatterns = this.detectFailurePatterns();
    for (const pattern of failurePatterns.slice(0, 3)) {
      suggestions.push({
        type: 'new_memory',
        key: `failure_pattern:${pattern.pattern.replace(/\s+/g, '_').toLowerCase()}`,
        value: {
          pattern: pattern.pattern,
          occurrences: pattern.occurrences,
          avgDurationMs: pattern.avgDurationMs,
        },
        reason: `Detected failure pattern across ${pattern.occurrences} tasks`,
        confidence: Math.min(0.9, 0.5 + pattern.occurrences * 0.1),
      });
    }

    return suggestions;
  }

  getStats(): MemoryLearningResult {
    const lessons = this.memoryEngine.recall({ type: 'lesson' });
    const strategies = this.memoryEngine.recall({ type: 'preference' });
    const failurePatterns = this.detectFailurePatterns();
    return {
      patternsFound: this.seenPatterns.size,
      strategiesIdentified: strategies.length,
      failurePatterns: failurePatterns.length,
      suggestions: [],
    };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private updatePatterns(outcome: ExecutionOutcome): void {
    const strategy = outcome.strategy || 'unknown';
    const existing = this.seenPatterns.get(strategy);
    if (existing) {
      existing.occurrences += 1;
      existing.successRate = (existing.successRate * (existing.occurrences - 1) + (outcome.success ? 1 : 0)) / existing.occurrences;
      existing.avgDurationMs = (existing.avgDurationMs * (existing.occurrences - 1) + outcome.durationMs) / existing.occurrences;
    } else {
      this.seenPatterns.set(strategy, {
        pattern: strategy,
        occurrences: 1,
        successRate: outcome.success ? 1 : 0,
        avgDurationMs: outcome.durationMs,
      });
    }
  }

  private patternCount(strategy: string, successOnly: boolean): number {
    const match = this.seenPatterns.get(strategy);
    if (!match) return 0;
    return successOnly ? Math.floor(match.occurrences * match.successRate) : match.occurrences;
  }

  private detectFailurePatterns(): PatternMatch[] {
    const failures: PatternMatch[] = [];
    for (const match of this.seenPatterns.values()) {
      if (match.successRate < 0.5 && match.occurrences >= 2) {
        failures.push(match);
      }
    }
    return failures.sort((a, b) => b.occurrences - a.occurrences);
  }
}
