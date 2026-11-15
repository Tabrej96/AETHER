/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Graphify Memory Persistence Layer
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * Handles save / load / resume of project state to/from the Graphify
 * knowledge graph. Provides:
 *   - Full project state serialization
 *   - Checkpoint-based resume with context merge
 *   - Atomic persist with local file fallback
 *   - Versioned state snapshots
 */

import fs from 'node:fs';
import path from 'node:path';
import { sha256Hex } from '../crypto/sha256';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface MemoryState {
  /** Monotonically increasing version number */
  version: number;
  /** ISO-8601 timestamp of this state snapshot */
  savedAt: string;
  /** Project context data */
  projectContext: Record<string, unknown>;
  /** User preferences keyed by category */
  userPreferences: Record<string, unknown>;
  /** Generated code patterns (idempotency keys) */
  codePatterns: Record<string, unknown>;
  /** Last session state for resume */
  lastSession: {
    sessionId: string | null;
    interrupted: boolean;
    lastContextId: string | null;
    lastUserPrompt: string | null;
    operationCount: number;
  };
  /** Architecture snapshots */
  architectures: Array<{ id: string; name: string; isCurrent: boolean }>;
  /** Industry analysis data */
  industryAnalyses: Array<{ id: string; industryType: string; analyzedAt: string }>;
  /** Arbitrary checkpoint metadata */
  checkpoints: Record<string, string>;
}

export interface MemoryPersistenceConfig {
  projectId: string;
  storeDir?: string;
}

export interface MemoryStats {
  totalKeys: number;
  stateVersion: number;
  lastSavedAt: string | null;
  sizeBytes: number;
}

export interface MergeOptions {
  /** Whether to overwrite existing keys (default: true for userPreferences, false for projectContext) */
  overwrite?: boolean;
  /** Keys to skip during merge */
  skipKeys?: string[];
  /** Merge strategy for conflicting keys */
  conflictStrategy?: 'overwrite' | 'skip' | 'deep-merge';
}

// ──────────────────────────────────────────────
// Default State Factory
// ──────────────────────────────────────────────

export function createDefaultState(): MemoryState {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    projectContext: {},
    userPreferences: {},
    codePatterns: {},
    lastSession: {
      sessionId: null,
      interrupted: false,
      lastContextId: null,
      lastUserPrompt: null,
      operationCount: 0,
    },
    architectures: [],
    industryAnalyses: [],
    checkpoints: {},
  };
}

// ──────────────────────────────────────────────
// Memory Persistence
// ──────────────────────────────────────────────

export class MemoryPersistence {
  private readonly projectId: string;
  private readonly storeDir: string;
  private state: MemoryState;
  private dirty = false;

  constructor(config: MemoryPersistenceConfig) {
    this.projectId = config.projectId;
    this.storeDir = config.storeDir
      ? path.resolve(config.storeDir, config.projectId)
      : path.resolve('.aether', 'graphify', config.projectId);

    this.state = this.load();

    if (!fs.existsSync(this.storeDir)) {
      fs.mkdirSync(this.storeDir, { recursive: true });
    }
  }

  // ─── State CRUD ────────────────────────────

  /** Get a value from project context. */
  getProjectContext<T>(key: string): T | undefined {
    return this.state.projectContext[key] as T | undefined;
  }

  /** Set a value in project context. */
  setProjectContext(key: string, value: unknown): void {
    this.state.projectContext[key] = value;
    this.dirty = true;
  }

  /** Get a user preference. */
  getUserPreference<T>(key: string): T | undefined {
    return this.state.userPreferences[key] as T | undefined;
  }

  /** Set a user preference. */
  setUserPreference(key: string, value: unknown): void {
    this.state.userPreferences[key] = value;
    this.dirty = true;
  }

  /** Store a code pattern with idempotency tracking. */
  setCodePattern(key: string, value: unknown): void {
    this.state.codePatterns[key] = value;
    this.dirty = true;
  }

  /** Check if a code pattern exists. */
  hasCodePattern(key: string): boolean {
    return key in this.state.codePatterns;
  }

  /** Get all state as a plain object. */
  getAll(): Record<string, unknown> {
    return { ...this.state };
  }

  /** Set multiple keys at once (merge by default). */
  setAll(data: Record<string, unknown>, options: MergeOptions = {}): void {
    const { conflictStrategy = 'overwrite' } = options;

    const sections: Array<keyof MemoryState> = ['projectContext', 'userPreferences', 'codePatterns'];

    for (const section of sections) {
      const incoming = data[section];
      if (incoming && typeof incoming === 'object') {
        const existing = this.state[section] as Record<string, unknown>;
        for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
          if (conflictStrategy === 'overwrite' || !(key in existing)) {
            existing[key] = value;
          }
        }
      }
    }

    if (data.lastSession && typeof data.lastSession === 'object') {
      this.state.lastSession = { ...this.state.lastSession, ...data.lastSession };
    }

    if (Array.isArray(data.architectures)) {
      this.state.architectures = data.architectures as MemoryState['architectures'];
    }

    if (Array.isArray(data.industryAnalyses)) {
      this.state.industryAnalyses = data.industryAnalyses as MemoryState['industryAnalyses'];
    }

    this.dirty = true;
  }

  /** Set last session information. */
  setLastSession(session: Partial<MemoryState['lastSession']>): void {
    this.state.lastSession = { ...this.state.lastSession, ...session };
    this.dirty = true;
  }

  // ─── Persistence ───────────────────────────

  /** Persist state to disk (atomic write). */
  persist(): void {
    if (!this.dirty) return;
    this.state.version += 1;
    this.state.savedAt = new Date().toISOString();
    this.writeAtomic(this.stateFile(), this.state);
    this.dirty = false;
  }

  /** Force-persist even if not dirty. */
  forcePersist(): void {
    this.dirty = true;
    this.persist();
  }

  /** Load state from disk, returning defaults if absent. */
  load(): MemoryState {
    try {
      if (fs.existsSync(this.stateFile())) {
        const raw = fs.readFileSync(this.stateFile(), 'utf-8');
        const parsed = JSON.parse(raw) as MemoryState;
        // Validate essential fields
        if (parsed.version && parsed.projectContext !== undefined) {
          return parsed;
        }
      }
    } catch {
      // corrupt file — start fresh
    }
    return createDefaultState();
  }

  /** Load and merge state from another source (context merge on continuation). */
  mergeState(other: Record<string, unknown>): void {
    this.setAll(other, { conflictStrategy: 'deep-merge' });
    this.persist();
  }

  /** Merge state from a resume source, preserving current user preferences. */
  mergeResumeState(other: Record<string, unknown>): void {
    // Keep user preferences from current state, merge everything else
    const preservedPrefs = { ...this.state.userPreferences };
    this.setAll(other, { conflictStrategy: 'overwrite' });
    this.state.userPreferences = { ...this.state.userPreferences, ...preservedPrefs };
    this.persist();
  }

  // ─── Clear ─────────────────────────────────

  /** Clear all state for this project. */
  clearProject(): void {
    this.state = createDefaultState();
    this.persist();
  }

  /** Clear only the project context. */
  clearContext(): void {
    this.state.projectContext = {};
    this.dirty = true;
    this.persist();
  }

  // ─── Checkpoints ───────────────────────────

  /** Create a named checkpoint snapshot. */
  createCheckpoint(name: string): string {
    const snapshot = JSON.stringify(this.state);
    const hash = sha256Hex(snapshot);
    this.state.checkpoints[name] = hash;
    this.persist();

    // Write checkpoint file
    const checkpointFile = path.join(this.storeDir, `checkpoint-${name}.json`);
    this.writeAtomic(checkpointFile, {
      name,
      hash,
      savedAt: this.state.savedAt,
      state: this.state,
    });

    return hash;
  }

  /** List all checkpoint names. */
  listCheckpoints(): string[] {
    return Object.keys(this.state.checkpoints);
  }

  /** Restore state to a named checkpoint. */
  restoreCheckpoint(name: string): MemoryState {
    const checkpointFile = path.join(this.storeDir, `checkpoint-${name}.json`);
    if (!fs.existsSync(checkpointFile)) {
      throw new Error(`Checkpoint "${name}" not found`);
    }
    const raw = fs.readFileSync(checkpointFile, 'utf-8');
    const checkpoint = JSON.parse(raw) as { state: MemoryState };
    this.state = checkpoint.state;
    this.persist();
    return this.state;
  }

  // ─── Resume ────────────────────────────────

  /** Check if there is an interrupted session available for resume. */
  hasResumableSession(): boolean {
    return this.state.lastSession.interrupted && this.state.lastSession.lastContextId !== null;
  }

  /** Get resume information. */
  getResumeInfo(): MemoryState['lastSession'] {
    return { ...this.state.lastSession };
  }

  // ─── Stats ─────────────────────────────────

  /** Get memory statistics. */
  getStats(): MemoryStats {
    const keys = Object.keys(this.state.projectContext).length +
      Object.keys(this.state.userPreferences).length +
      Object.keys(this.state.codePatterns).length;

    let sizeBytes = 0;
    try {
      sizeBytes = Buffer.byteLength(JSON.stringify(this.state), 'utf-8');
    } catch {
      sizeBytes = 0;
    }

    return {
      totalKeys: keys,
      stateVersion: this.state.version,
      lastSavedAt: this.state.savedAt,
      sizeBytes,
    };
  }

  // ─── Private ───────────────────────────────

  private stateFile(): string {
    return path.join(this.storeDir, 'state.json');
  }

  private writeAtomic(filePath: string, data: unknown): void {
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
  }
}

// ──────────────────────────────────────────────
// Singleton Factory
// ──────────────────────────────────────────────

const persistenceInstances = new Map<string, MemoryPersistence>();

export function getMemoryPersistence(config: MemoryPersistenceConfig): MemoryPersistence {
  const key = config.projectId;
  if (!persistenceInstances.has(key)) {
    persistenceInstances.set(key, new MemoryPersistence(config));
  }
  return persistenceInstances.get(key)!;
}

export function resetMemoryPersistence(projectId?: string): void {
  if (projectId) {
    persistenceInstances.delete(projectId);
  } else {
    persistenceInstances.clear();
  }
}

// Re-export helpers
export { sha256Hex } from '../crypto/sha256';
