/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Consolidation
 *
 * Consolidates old memories by summarizing, merging duplicates, archiving
 * low-value memories, and deleting expired ones.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import type { Memory, MemoryQuery, MemoryConsolidationResult } from './types';

const SUMMARY_MAX_LENGTH = 500;
const LOW_ACCESS_THRESHOLD = 2;
const LOW_CONFIDENCE_THRESHOLD = 0.3;
const AGE_DAYS_ARCHIVE = 90;
const AGE_DAYS_SUMMARIZE = 60;
const DUPLICATE_SIMILARITY_THRESHOLD = 0.85;

export class MemoryConsolidator {
  constructor(
    private readonly store: { loadAll: () => Memory[]; save: (m: Memory) => void },
    private readonly index: { add: (m: Memory) => void; remove: (id: string) => void }
  ) {}

  consolidate(): MemoryConsolidationResult {
    const all = this.store.loadAll();
    const active = all.filter((m) => m.status === 'active');
    const now = Date.now();

    let summarized = 0;
    let archived = 0;
    let deleted = 0;
    const details: string[] = [];

    // Phase 1: Delete expired
    for (const mem of active) {
      if (mem.expiresAt && mem.expiresAt.getTime() < now) {
        mem.status = 'expired';
        mem.updatedAt = new Date();
        this.store.save(mem);
        this.index.remove(mem.id);
        deleted++;
        details.push(`Expired: ${mem.key}`);
      }
    }

    // Phase 2: Archive old, low-value
    const archiveCutoff = new Date(now - AGE_DAYS_ARCHIVE * 24 * 60 * 60 * 1000);
    for (const mem of active) {
      if (mem.status !== 'active') continue;
      if (mem.createdAt < archiveCutoff && mem.accessCount < LOW_ACCESS_THRESHOLD && mem.metadata.confidence < LOW_CONFIDENCE_THRESHOLD) {
        mem.status = 'archived';
        mem.updatedAt = new Date();
        this.store.save(mem);
        this.index.remove(mem.id);
        archived++;
        details.push(`Archived: ${mem.key}`);
      }
    }

    // Phase 3: Summarize older but valuable memories
    const summarizeCutoff = new Date(now - AGE_DAYS_SUMMARIZE * 24 * 60 * 60 * 1000);
    for (const mem of active) {
      if (mem.status !== 'active') continue;
      if (mem.createdAt < summarizeCutoff && mem.accessCount >= LOW_ACCESS_THRESHOLD) {
        const originalValue = mem.value;
        mem.value = summarizeValue(mem.value);
        mem.updatedAt = new Date();
        this.store.save(mem);
        this.index.update(mem);
        summarized++;
        details.push(`Summarized: ${mem.key}`);
      }
    }

    // Phase 4: Merge duplicates
    const remaining = this.store.loadAll().filter((m) => m.status === 'active');
    const merged = this.mergeDuplicates(remaining);
    for (const merge of merged) {
      this.store.save(merge.primary);
      this.index.update(merge.primary);
      this.store.save(merge.secondary);
      this.store.save({ ...merge.secondary, status: 'archived' });
      this.index.remove(merge.secondary.id);
      details.push(`Merged: ${merge.secondary.key} → ${merge.primary.key}`);
    }

    return { summarized, archived, deleted, details };
  }

  private mergeDuplicates(memories: Memory[]): Array<{ primary: Memory; secondary: Memory }> {
    const results: Array<{ primary: Memory; secondary: Memory }> = [];
    const seen = new Set<string>();
    for (let i = 0; i < memories.length; i++) {
      const a = memories[i];
      if (seen.has(a.id)) continue;
      for (let j = i + 1; j < memories.length; j++) {
        const b = memories[j];
        if (seen.has(b.id)) continue;
        if (a.key !== b.key || a.type !== b.type || a.metadata.project !== b.metadata.project) continue;
        if (similarity(a.value, b.value) >= DUPLICATE_SIMILARITY_THRESHOLD) {
          // Keep the one with higher confidence and more access
          const primary = a.metadata.confidence >= b.metadata.confidence && a.accessCount >= b.accessCount ? a : b;
          const secondary = primary === a ? b : a;
          results.push({ primary, secondary });
          seen.add(secondary.id);
          break;
        }
      }
    }
    return results;
  }
}

function similarity(a: unknown, b: unknown): number {
  const aStr = JSON.stringify(a);
  const bStr = JSON.stringify(b);
  const longer = aStr.length >= bStr.length ? aStr : bStr;
  const shorter = aStr.length >= bStr.length ? bStr : aStr;
  if (longer.length === 0) return 1.0;
  const distance = levenshtein(longer, shorter);
  return 1 - distance / longer.length;
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

function summarizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.length > SUMMARY_MAX_LENGTH) {
      return value.slice(0, SUMMARY_MAX_LENGTH) + '... [summarized]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 10) {
      return `[... ${value.length} items summarized]`;
    }
    return value.map((v) => summarizeValue(v));
  }
  if (typeof value === 'object' && value !== null) {
    const summarized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      summarized[k] = summarizeValue(v);
    }
    return summarized;
  }
  return value;
}
