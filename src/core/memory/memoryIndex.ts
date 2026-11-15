/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — In-Memory Index
 *
 * Provides fast lookups by type, key, tags, project, and time range.
 * Stores both metadata indexes and the full Memory objects.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import type { Memory, MemoryType, MemoryQuery, MemoryStatus, IndexEntry } from './types';

export class MemoryIndex {
  private readonly entries: Map<string, IndexEntry> = new Map();
  private readonly memories: Map<string, Memory> = new Map();
  private readonly byType: Map<MemoryType, Set<string>> = new Map();
  private readonly byKey: Map<string, Set<string>> = new Map();
  private readonly byTag: Map<string, Set<string>> = new Map();
  private readonly byProject: Map<string, Set<string>> = new Map();
  private readonly byAgent: Map<string, Set<string>> = new Map();
  private readonly byStatus: Map<MemoryStatus, Set<string>> = new Map();
  private readonly timeSorted: string[] = []; // memory ids sorted by timestamp

  add(memory: Memory): void {
    if (this.entries.has(memory.id)) {
      this.remove(memory.id);
    }
    const entry: IndexEntry = {
      type: memory.type,
      key: memory.key,
      tags: [...memory.tags],
      project: memory.metadata.project,
      session: memory.metadata.session,
      agent: memory.metadata.agent,
      timestamp: memory.createdAt.getTime(),
      confidence: memory.metadata.confidence,
      accessLevel: memory.metadata.accessLevel,
      status: memory.status,
      memoryId: memory.id,
    };
    this.memories.set(memory.id, memory);
    this.entries.set(memory.id, entry);
    this.indexByType(entry);
    this.indexByKey(entry);
    this.indexByTag(entry);
    this.indexByProject(entry);
    this.indexByAgent(entry);
    this.indexByStatus(entry);
    this.insertTimeSorted(memory.id, entry.timestamp);
  }

  remove(id: string): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.memories.delete(id);
    this.entries.delete(id);
    this.byType.get(entry.type)?.delete(id);
    this.byKey.get(entry.key)?.delete(id);
    for (const tag of entry.tags) {
      this.byTag.get(tag)?.delete(id);
    }
    this.byProject.get(entry.project)?.delete(id);
    this.byAgent.get(entry.agent)?.delete(id);
    this.byStatus.get(entry.status)?.delete(id);
    const timeIdx = this.timeSorted.indexOf(id);
    if (timeIdx !== -1) this.timeSorted.splice(timeIdx, 1);
  }

  update(memory: Memory): void {
    this.add(memory);
  }

  get(id: string): Memory | undefined {
    return this.memories.get(id);
  }

  query(query: MemoryQuery): Memory[] {
    let candidates: Set<string> | null = null;

    if (query.type) {
      const set = this.byType.get(query.type) ?? new Set();
      candidates = candidates ? new Set([...candidates].filter((id) => set.has(id))) : new Set(set);
    }
    if (query.key) {
      const set = this.byKey.get(query.key) ?? new Set();
      candidates = candidates ? new Set([...candidates].filter((id) => set.has(id))) : new Set(set);
    }
    if (query.tags && query.tags.length > 0) {
      for (const tag of query.tags) {
        const set = this.byTag.get(tag) ?? new Set();
        candidates = candidates
          ? new Set([...candidates].filter((id) => set.has(id)))
          : new Set(set);
      }
    }
    if (query.project) {
      const set = this.byProject.get(query.project) ?? new Set();
      candidates = candidates ? new Set([...candidates].filter((id) => set.has(id))) : new Set(set);
    }
    if (query.session) {
      const projectSet = query.project ? this.byProject.get(query.project) ?? new Set() : new Set(this.entries.keys());
      const matching = [...projectSet].filter((id) => {
        const entry = this.entries.get(id);
        return entry?.session === query.session;
      });
      candidates = candidates ? new Set([...candidates].filter((id) => matching.includes(id))) : new Set(matching);
    }
    if (query.agent) {
      const set = this.byAgent.get(query.agent) ?? new Set();
      candidates = candidates ? new Set([...candidates].filter((id) => set.has(id))) : new Set(set);
    }
    if (query.status) {
      const set = this.byStatus.get(query.status) ?? new Set();
      candidates = candidates ? new Set([...candidates].filter((id) => set.has(id))) : new Set(set);
    }
    if (query.since) {
      const since = query.since.getTime();
      const matching = this.timeSorted.filter((id) => (this.entries.get(id)?.timestamp ?? 0) >= since);
      candidates = candidates ? new Set([...candidates].filter((id) => matching.includes(id))) : new Set(matching);
    }
    if (query.until) {
      const until = query.until.getTime();
      const matching = this.timeSorted.filter((id) => (this.entries.get(id)?.timestamp ?? 0) <= until);
      candidates = candidates ? new Set([...candidates].filter((id) => matching.includes(id))) : new Set(matching);
    }
    if (query.minConfidence !== undefined) {
      const all = candidates ?? new Set(this.entries.keys());
      const matching = [...all].filter((id) => (this.entries.get(id)?.confidence ?? 0) >= query.minConfidence!);
      candidates = new Set(matching);
    }

    const resultIds = candidates ?? new Set(this.entries.keys());
    return [...resultIds]
      .map((id) => this.memories.get(id))
      .filter((mem): mem is Memory => mem !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getStats(): { total: number; byType: Record<string, number>; byProject: Record<string, number> } {
    const byType: Record<string, number> = {};
    const byProject: Record<string, number> = {};
    for (const entry of this.entries.values()) {
      byType[entry.type] = (byType[entry.type] ?? 0) + 1;
      byProject[entry.project] = (byProject[entry.project] ?? 0) + 1;
    }
    return { total: this.entries.size, byType, byProject };
  }

  get size(): number {
    return this.entries.size;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private indexByType(entry: IndexEntry): void {
    const set = this.byType.get(entry.type) ?? new Set<string>();
    set.add(entry.memoryId);
    this.byType.set(entry.type, set);
  }

  private indexByKey(entry: IndexEntry): void {
    const set = this.byKey.get(entry.key) ?? new Set<string>();
    set.add(entry.memoryId);
    this.byKey.set(entry.key, set);
  }

  private indexByTag(entry: IndexEntry): void {
    for (const tag of entry.tags) {
      const set = this.byTag.get(tag) ?? new Set<string>();
      set.add(entry.memoryId);
      this.byTag.set(tag, set);
    }
  }

  private indexByProject(entry: IndexEntry): void {
    const set = this.byProject.get(entry.project) ?? new Set<string>();
    set.add(entry.memoryId);
    this.byProject.set(entry.project, set);
  }

  private indexByAgent(entry: IndexEntry): void {
    const set = this.byAgent.get(entry.agent) ?? new Set<string>();
    set.add(entry.memoryId);
    this.byAgent.set(entry.agent, set);
  }

  private indexByStatus(entry: IndexEntry): void {
    const set = this.byStatus.get(entry.status) ?? new Set<string>();
    set.add(entry.memoryId);
    this.byStatus.set(entry.status, set);
  }

  private insertTimeSorted(id: string, timestamp: number): void {
    let lo = 0;
    let hi = this.timeSorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      const midEntry = this.entries.get(this.timeSorted[mid]);
      if ((midEntry?.timestamp ?? 0) < timestamp) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    this.timeSorted.splice(lo, 0, id);
  }
}
