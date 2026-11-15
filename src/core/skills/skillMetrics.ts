/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Skill Metrics
 * (src/core/skills/skillMetrics.ts)
 *
 * Tracks execution time, success/failure rates, resource usage, and
 * user satisfaction for every registered skill.
 */

import type { Skill, SkillResult, SkillMetrics, DailyMetrics, DataType } from './skillEngine';

// ---------------------------------------------------------------------------
// Resource snapshot captured at execution start
// ---------------------------------------------------------------------------

export interface ResourceSnapshot {
  heapUsedBytes: number;
  heapTotalBytes: number;
  rssBytes: number;
  externalBytes: number;
  cpuTimeMs: number;
}

// ---------------------------------------------------------------------------
// Metrics collector
// ---------------------------------------------------------------------------

export class SkillMetricsCollector {
  // history buffer for rolling window
  private readonly history: Map<string, SkillResult[]> = new Map();
  private readonly maxHistory = 1_000;

  /**
   * Record a SkillResult and update the associated SkillMetrics.
   */
  record(skill: Skill, result: SkillResult, resources?: ResourceSnapshot): void {
    const prev = skill.metadata;
    const now = new Date();

    // Push to rolling history
    const bucket = this.history.get(skill.id) ?? [];
    bucket.push(result);
    if (bucket.length > this.maxHistory) bucket.shift();
    this.history.set(skill.id, bucket);

    // Update the in-memory metrics on the skill object
    skill.metadata = { ...prev, updatedAt: now.toISOString() };
  }

  /**
   * Return updated metrics for a skill.
   */
  getMetrics(skill: Skill): SkillMetrics {
    const results = this.history.get(skill.id) ?? [];
    return this.#aggregateFromResults(skill.id, results);
  }

  /**
   * All metrics keys, useful for dashboard exports.
   */
  getMetricsSnapshot(skillIds: string[]): Map<string, SkillMetrics> {
    const out = new Map<string, SkillMetrics>();
    for (const id of skillIds) {
      const skillEntry = this.history.get(id);
      if (skillEntry) {
        out.set(id, this.#aggregateFromResults(id, skillEntry));
      }
    }
    return out;
  }

  /**
   * Record a user satisfaction score (1–5) for a skill execution.
   */
  recordSatisfaction(skillId: string, score: number): void {
    // Satisfaction is stored in the last entry's metadata; the learning
    // layer consumes it for improvement suggestions.
    const bucket = this.history.get(skillId) ?? [];
    if (bucket.length > 0) {
      bucket[bucket.length - 1] = {
        ...bucket[bucket.length - 1],
        output: {
          ...(bucket[bucket.length - 1].output ?? {}),
          __satisfaction: score,
        },
      };
    }
  }

  /**
   * Take a resource snapshot (Node.js process metrics). Safe no-op in
   * environments without process.memoryUsage().
   */
  static captureResources(): ResourceSnapshot {
    let mem: NodeJS.MemoryUsage | undefined;
    if (typeof process !== 'undefined' && process.memoryUsage) {
      mem = process.memoryUsage();
    }
    return {
      heapUsedBytes: mem?.heapUsed ?? 0,
      heapTotalBytes: mem?.heapTotal ?? 0,
      rssBytes: mem?.rss ?? 0,
      externalBytes: mem?.external ?? 0,
      cpuTimeMs: 0,
    };
  }

  // ---- private ----

  #aggregate(
    skill: Skill,
    result: SkillResult,
    _resources: ResourceSnapshot | undefined,
    now: Date,
  ): SkillMetrics {
    const results = this.history.get(skill.id) ?? [];
    results.push(result);
    if (results.length > this.maxHistory) results.shift();
    this.history.set(skill.id, results);
    return this.#aggregateFromResults(skill.id, results);
  }

  #aggregateFromResults(skillId: string, results: SkillResult[]): SkillMetrics {
    const count = results.length;
    if (count === 0) {
      return {
        skillId,
        executionCount: 0,
        successCount: 0,
        failureCount: 0,
        timeoutCount: 0,
        avgDurationMs: 0,
        p95DurationMs: 0,
        lastExecutedAt: '',
        successRate: 0,
        errorBreakdown: {},
        dailyHistory: [],
      };
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = results.filter(r => r.status === 'failure').length;
    const timeoutCount = results.filter(r => r.status === 'timeout').length;
    const durations = results.map(r => r.durationMs);
    const avgDurationMs = durations.reduce((s, d) => s + d, 0) / count;
    const p95DurationMs = this.#percentile(durations, 0.95);
    const lastExecutedAt = results[results.length - 1].startedAt;
    const successRate = successCount / count;
    const errorBreakdown = this.#buildErrorBreakdown(results);
    const dailyHistory = this.#buildDailyHistory(results);

    return {
      skillId,
      executionCount: count,
      successCount,
      failureCount,
      timeoutCount,
      avgDurationMs,
      p95DurationMs,
      lastExecutedAt,
      successRate,
      errorBreakdown,
      dailyHistory,
    };
  }

  #percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const s = [...sorted].sort((a, b) => a - b);
    const idx = Math.ceil(p * s.length) - 1;
    return s[Math.max(0, idx)];
  }

  #buildErrorBreakdown(results: SkillResult[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const r of results) {
      if (r.error) {
        const code = r.error.code ?? 'UNKNOWN';
        breakdown[code] = (breakdown[code] ?? 0) + 1;
      }
    }
    return breakdown;
  }

  #buildDailyHistory(results: SkillResult[]): DailyMetrics[] {
    const days = new Map<string, { count: number; success: number; fail: number; durations: number[] }>();
    for (const r of results) {
      const day = r.startedAt.slice(0, 10);
      const bucket = days.get(day) ?? { count: 0, success: 0, fail: 0, durations: [] };
      bucket.count++;
      if (r.status === 'success') bucket.success++;
      if (r.status === 'failure') bucket.fail++;
      bucket.durations.push(r.durationMs);
      days.set(day, bucket);
    }

    return Array.from(days.entries()).map(([date, b]) => ({
      date,
      executions: b.count,
      successes: b.success,
      failures: b.fail,
      avgDurationMs: b.durations.reduce((s, d) => s + d, 0) / b.durations.length,
    }));
  }
}
