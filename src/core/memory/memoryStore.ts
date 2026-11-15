/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Storage Layer
 *
 * Builds on the existing PersistentMemoryStore (JSONL + WAL) to provide
 * a higher-level memory storage API with compaction, backup, and restore.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import fs from 'node:fs';
import path from 'node:path';
import { PersistentMemoryStore, PersistentMemoryRecord } from '../persistence/memoryStore';
import type { Memory, MemoryStatus, MemoryType } from './types';

export interface StorageOptions {
  maxFileSizeBytes?: number;
  compactionThreshold?: number;
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_COMPACTION_THRESHOLD = 0.3; // compact when >30% records are deleted/archived

export class MemoryStore {
  private readonly inner: PersistentMemoryStore;
  private readonly maxFileSize: number;
  private readonly compactionThreshold: number;
  private readonly baseDir: string;
  private readonly projectDir: string;

  constructor(storeDir: string, project: string, options: StorageOptions = {}) {
    this.baseDir = storeDir;
    this.projectDir = project;
    this.inner = new PersistentMemoryStore(storeDir, project);
    this.maxFileSize = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE;
    this.compactionThreshold = options.compactionThreshold ?? DEFAULT_COMPACTION_THRESHOLD;
  }

  save(memory: Memory): void {
    this.inner.addMemory({
      agentId: memory.metadata.agent,
      layer: memory.type,
      title: memory.key,
      content: this.serializeMemory(memory),
    });
  }

  loadAll(): Memory[] {
    const records = this.inner.records();
    const memories: Memory[] = [];
    for (const record of records) {
      try {
        const memory = this.deserializeMemory(record.content);
        if (memory.status !== 'deleted') {
          memories.push(memory);
        }
      } catch {
        // skip corrupt records
      }
    }
    return memories;
  }

  loadById(id: string): Memory | undefined {
    return this.loadAll().find((m) => m.id === id);
  }

  loadByKey(key: string): Memory | undefined {
    return this.loadAll().find((m) => m.key === key);
  }

  update(memory: Memory): void {
    // Remove old entry, save new
    const all = this.loadAll();
    const idx = all.findIndex((m) => m.id === memory.id);
    if (idx !== -1) {
      all[idx] = memory;
    }
    this.save(memory);
  }

  softDelete(id: string): void {
    const memory = this.loadById(id);
    if (memory) {
      memory.status = 'deleted';
      memory.updatedAt = new Date();
      this.update(memory);
    }
  }

  hardDelete(id: string): void {
    const records = this.inner.records();
    const record = records.find((r) => {
      try {
        return this.deserializeMemory(r.content).id === id;
      } catch {
        return false;
      }
    });
    if (record) {
      const dir = path.join(this.baseDir, this.projectDir);
      const memFile = path.join(dir, 'memory.jsonl');
      if (fs.existsSync(memFile)) {
        const lines = fs.readFileSync(memFile, 'utf8').split('\n').filter((l) => l.trim());
        const filtered = lines.filter((l) => {
          try {
            const parsed = JSON.parse(l) as PersistentMemoryRecord;
            return parsed.recordId !== record.recordId;
          } catch {
            return true;
          }
        });
        fs.writeFileSync(memFile, filtered.join('\n') + (filtered.length > 0 ? '\n' : ''));
      }
    }
  }

  deleteAll(): void {
    this.inner.deleteAll();
  }

  compact(): { recordsBefore: number; recordsAfter: number } {
    const allBefore = this.loadAll();
    const before = allBefore.length;
    const dir = path.join(this.baseDir, this.projectDir);
    const memFile = path.join(dir, 'memory.jsonl');
    if (!fs.existsSync(memFile)) return { recordsBefore: before, recordsAfter: before };

    const lines = fs.readFileSync(memFile, 'utf8').split('\n').filter((l) => l.trim());
    // For each id, keep only the latest version (last occurrence in file wins)
    const latestById = new Map<string, string>();
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as { content: string };
        const mem = this.deserializeMemory(parsed.content);
        latestById.set(mem.id, line);
      } catch {
        // keep unparseable lines
      }
    }
    const kept = [...latestById.values()].filter((line) => {
      try {
        const parsed = JSON.parse(line) as { content: string };
        const mem = this.deserializeMemory(parsed.content);
        return mem.status !== 'deleted';
      } catch {
        return true;
      }
    });
    fs.writeFileSync(memFile, kept.join('\n') + (kept.length > 0 ? '\n' : ''));
    const after = this.loadAll().length;
    return { recordsBefore: before, recordsAfter: after };
  }

  backup(backupPath: string): void {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    const dir = path.join(this.baseDir, this.projectDir);
    if (!fs.existsSync(dir)) {
      fs.writeFileSync(backupPath, JSON.stringify({ memories: [], checkpoints: [] }, null, 2));
      return;
    }
    const memFile = path.join(dir, 'memory.jsonl');
    const ckptFile = path.join(dir, 'checkpoints.jsonl');
    const memories = fs.existsSync(memFile)
      ? fs.readFileSync(memFile, 'utf8').split('\n').filter((l) => l.trim())
      : [];
    const checkpoints = fs.existsSync(ckptFile)
      ? fs.readFileSync(ckptFile, 'utf8').split('\n').filter((l) => l.trim())
      : [];
    fs.writeFileSync(backupPath, JSON.stringify({ memories, checkpoints }, null, 2));
  }

  restore(backupPath: string): void {
    if (!fs.existsSync(backupPath)) return;
    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8')) as {
      memories: string[];
      checkpoints: string[];
    };
    const dir = path.join(this.baseDir, this.projectDir);
    fs.mkdirSync(dir, { recursive: true });
    const memFile = path.join(dir, 'memory.jsonl');
    fs.writeFileSync(memFile, data.memories.join('\n') + (data.memories.length > 0 ? '\n' : ''));
    const ckptFile = path.join(dir, 'checkpoints.jsonl');
    fs.writeFileSync(ckptFile, data.checkpoints.join('\n') + (data.checkpoints.length > 0 ? '\n' : ''));
  }

  status(): { path: string; recordCount: number } {
    return {
      path: path.join(this.baseDir, this.projectDir),
      recordCount: this.inner.records().length,
    };
  }

  // ─── Serialization ──────────────────────────────────────────────────────────

  private serializeMemory(memory: Memory): string {
    const payload = {
      ...memory,
      expiresAt: memory.expiresAt?.toISOString(),
      createdAt: memory.createdAt.toISOString(),
      updatedAt: memory.updatedAt.toISOString(),
      accessedAt: memory.accessedAt.toISOString(),
    };
    return JSON.stringify(payload);
  }

  private deserializeMemory(raw: string): Memory {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return {
      ...data,
      value: (data as Record<string, unknown>).value,
      expiresAt: data.expiresAt ? new Date(data.expiresAt as string) : undefined,
      createdAt: new Date(data.createdAt as string),
      updatedAt: new Date(data.updatedAt as string),
      accessedAt: new Date(data.accessedAt as string),
    } as Memory;
  }
}
