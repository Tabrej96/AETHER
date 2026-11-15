/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook Persistence - saves and loads hook registrations and execution history
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  Hook,
  HookEvent,
  HookExecutionRecord,
  HookEngineConfig,
  HookAction,
} from './hookEngine';
import type { RegisteredHook } from './hookRegistry';

/**
 * Serialized hook definition for persistence
 */
export interface SerializedHook {
  id: string;
  name: string;
  description: string;
  version: string;
  events: string[];
  priority: number;
  enabled: boolean;
  timeoutMs?: number;
  conflictGroup?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  conditions?: {
    field: string;
    operator: string;
    value: unknown;
  }[];
}

/**
 * Persisted hook state file
 */
export interface PersistedHookState {
  schemaVersion: string;
  engineVersion: string;
  persistedAt: string;
  hooks: SerializedHook[];
  executionHistory: SerializedExecutionRecord[];
}

/**
 * Load hook state from disk
 */
export async function loadHookState(
  persistencePath: string
): Promise<PersistedHookState | null> {
  try {
    const fullPath = path.resolve(persistencePath, 'hook-state.json');
    const content = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(content) as PersistedHookState;
  } catch {
    return null;
  }
}

/**
 * Save hook state to disk
 */
export async function saveHookState(
  persistencePath: string,
  state: PersistedHookState
): Promise<void> {
  try {
    const fullDir = path.resolve(persistencePath);
    await fs.mkdir(fullDir, { recursive: true });
    const fullPath = path.join(fullDir, 'hook-state.json');
    await fs.writeFile(fullPath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('[hookPersistence] Failed to save hook state:', (err as Error).message);
  }
}

/**
 * Serialize a registered hook for persistence
 */
export function serializeHook(registered: RegisteredHook): SerializedHook {
  const def = registered.definition;
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    version: def.version,
    events: def.events,
    priority: def.priority,
    enabled: def.enabled,
    timeoutMs: def.timeoutMs,
    conflictGroup: def.conflictGroup,
    tags: def.tags,
    metadata: def.metadata,
    conditions: def.conditions?.map((c) => ({
      field: c.field,
      operator: c.operator,
      value: c.value,
    })),
  };
}

/**
 * Serialize execution records for persistence
 */
export interface SerializedExecutionRecord {
  hookId: string;
  event: HookEvent;
  timestamp: string;
  durationMs: number;
  action: HookAction;
  success: boolean;
  error?: string;
  sessionId: string;
  projectId: string;
  chainedFrom?: string;
}

/**
 * Serialize execution records for persistence
 */
export function serializeExecutionRecords(
  records: HookExecutionRecord[]
): SerializedExecutionRecord[] {
  return records.map((r) => ({
    hookId: r.hookId,
    event: r.event,
    timestamp: r.timestamp.toISOString(),
    durationMs: r.durationMs,
    action: r.action,
    success: r.success,
    error: r.error,
    sessionId: r.sessionId,
    projectId: r.projectId,
    chainedFrom: r.chainedFrom,
  }));
}

/**
 * Build full persisted state from current registry and history
 */
export function buildPersistedState(
  registeredHooks: Map<string, RegisteredHook>,
  executionHistory: HookExecutionRecord[],
  config: HookEngineConfig
): PersistedHookState {
  const hooks: SerializedHook[] = [];
  for (const entry of registeredHooks.values()) {
    hooks.push(serializeHook(entry));
  }

  return {
    schemaVersion: '2.0.0',
    engineVersion: '1.0.0',
    persistedAt: new Date().toISOString(),
    hooks,
    executionHistory: serializeExecutionRecords(
      executionHistory.slice(-config.maxExecutionHistory)
    ),
  };
}

/**
 * Restore hooks from persisted state (without handlers - handlers must be re-registered)
 */
export function restoreHooksFromState(
  registeredHooks: Map<string, RegisteredHook>,
  state: PersistedHookState | null,
  handlerFactory: (hookId: string) => Hook['handler']
): void {
  if (!state || !state.hooks) return;

  for (const serialized of state.hooks) {
    // Skip if already registered
    if (registeredHooks.has(serialized.id)) continue;

    const hook: Hook = {
      id: serialized.id,
      name: serialized.name,
      description: serialized.description,
      version: serialized.version,
      events: serialized.events as Hook['events'],
      handler: handlerFactory(serialized.id),
      priority: serialized.priority,
      enabled: serialized.enabled,
      timeoutMs: serialized.timeoutMs,
      conflictGroup: serialized.conflictGroup,
      tags: serialized.tags,
      metadata: serialized.metadata,
      conditions: (serialized.conditions ?? []).map((c) => ({
        field: c.field,
        operator: c.operator as Hook['conditions'][number]['operator'],
        value: c.value,
      })),
    };

    registeredHooks.set(hook.id, {
      definition: hook,
      registeredAt: new Date(),
      executionCount: 0,
    });
  }
}
