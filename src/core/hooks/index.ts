/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Hook Engine - Public API
 *
 * Provides the complete runtime hook system for intercepting and influencing
 * agent behavior across 12 event types.
 *
 * Usage:
 *   import { createHookEngine, emit, registerHook, type Hook, type HookEvent } from './core/hooks';
 *
 *   const engine = createHookEngine({ projectId: 'my-project' });
 *
 *   // Register a custom hook
 *   engine.registerHook({
 *     id: 'my-hook',
 *     name: 'My Hook',
 *     description: 'Logs every tool use',
 *     version: '1.0.0',
 *     events: ['pre_tool_use'],
 *     handler: async (ctx) => ({ action: 'continue' }),
 *     priority: 50,
 *     enabled: true,
 *   });
 *
 *   // Emit an event
 *   const result = await engine.emit('pre_tool_use', 'session-123', { toolName: 'Edit' });
 *   if (result.action === 'block') {
 *     console.log('Blocked by hook:', result.blockedBy);
 *   }
 */

// Core types
export type {
  Hook,
  HookEvent,
  HookContext,
  HookResult,
  HookAction,
  HookHandler,
  HookCondition,
  HookConditionGroup,
  ConditionOperator,
  HookExecutionRecord,
  HookEngineConfig,
} from './hookEngine';

export {
  EVENT_NAME_MAP,
  EVENT_NAME_REVERSE_MAP,
  DEFAULT_HOOK_ENGINE_CONFIG,
} from './hookEngine';

// Registry
export {
  registerHook,
  unregisterHook,
  enableHook,
  disableHook,
  discoverHooksByEvent,
  getAllHooks,
  getHookById,
  getHookStats,
  loadHooksFromJSON,
  recordHookExecution,
  type RegisteredHook,
} from './hookRegistry';

// Conditions
export {
  evaluateConditions,
  shouldHookExecute,
  createEventCondition,
  createProjectCondition,
  createSessionCondition,
} from './hookConditions';

// Dispatcher
export {
  dispatch,
  emit,
  type DispatchResult,
  type DispatcherConfig,
} from './hookDispatcher';

// Persistence
export {
  loadHookState,
  saveHookState,
  serializeHook,
  buildPersistedState,
  restoreHooksFromState,
  type SerializedHook,
  type PersistedHookState,
} from './hookPersistence';

/**
 * Create a new hook engine instance
 */
import type { Hook, HookEvent, HookContext, HookResult, HookEngineConfig, HookExecutionRecord } from './hookEngine';
import { DEFAULT_HOOK_ENGINE_CONFIG } from './hookEngine';
import { registerHook, discoverHooksByEvent, getAllHooks, getHookById, recordHookExecution, loadHooksFromJSON, getHookStats, enableHook, disableHook, unregisterHook, type RegisteredHook } from './hookRegistry';
import { shouldHookExecute } from './hookConditions';
import { dispatch, type DispatchResult, type DispatcherConfig } from './hookDispatcher';
import { loadHookState, saveHookState, buildPersistedState, restoreHooksFromState, type SerializedHook } from './hookPersistence';

export interface HookEngineOptions {
  projectId: string;
  config?: Partial<HookEngineConfig>;
}

export class HookEngine {
  private registeredHooks: Map<string, RegisteredHook> = new Map();
  private executionHistory: HookExecutionRecord[] = [];
  private projectId: string;
  private config: HookEngineConfig;
  private executionRecordCallback?: (record: HookExecutionRecord) => void;

  constructor(options: HookEngineOptions) {
    this.projectId = options.projectId;
    this.config = { ...DEFAULT_HOOK_ENGINE_CONFIG, ...options.config };
  }

  /**
   * Register a hook
   */
  registerHook(hook: Hook): void {
    registerHook(this.registeredHooks, hook);
  }

  /**
   * Unregister a hook
   */
  unregisterHook(hookId: string): boolean {
    return unregisterHook(this.registeredHooks, hookId);
  }

  /**
   * Enable a hook
   */
  enableHook(hookId: string): void {
    enableHook(this.registeredHooks, hookId);
  }

  /**
   * Disable a hook
   */
  disableHook(hookId: string): void {
    disableHook(this.registeredHooks, hookId);
  }

  /**
   * Get all registered hooks
   */
  getAllHooks(): Hook[] {
    return getAllHooks(this.registeredHooks);
  }

  /**
   * Get a hook by ID
   */
  getHookById(hookId: string): Hook | undefined {
    return getHookById(this.registeredHooks, hookId);
  }

  /**
   * Load hooks from JSON (e.g., aether/hooks/hooks.json)
   */
  loadHooksFromJSON(raw: unknown): void {
    loadHooksFromJSON(this.registeredHooks, raw);
  }

  /**
   * Emit an event to all matching hooks
   */
  async emit(
    event: HookEvent,
    sessionId: string,
    data: Record<string, unknown> = {}
  ): Promise<DispatchResult> {
    const context: HookContext = {
      event,
      timestamp: new Date(),
      sessionId,
      projectId: this.projectId,
      data,
    };

    const dispatcherConfig: DispatcherConfig = {
      defaultTimeoutMs: this.config.defaultTimeoutMs,
      maxConcurrentHooks: this.config.maxConcurrentHooks,
    };

    // Track execution records
    const onRecord = (record: HookExecutionRecord) => {
      this.executionHistory.push(record);
      // Trim history
      if (this.executionHistory.length > this.config.maxExecutionHistory) {
        this.executionHistory = this.executionHistory.slice(-this.config.maxExecutionHistory);
      }
      this.executionRecordCallback?.(record);
    };

    return dispatch(
      this.registeredHooks,
      event,
      context,
      dispatcherConfig,
      onRecord
    );
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): HookExecutionRecord[] {
    return [...this.executionHistory];
  }

  /**
   * Get hook statistics
   */
  getStats() {
    return getHookStats(this.registeredHooks);
  }

  /**
   * Save state to disk
   */
  async saveState(): Promise<void> {
    const state = buildPersistedState(this.registeredHooks, this.executionHistory, this.config);
    await saveHookState(this.config.persistencePath, state);
  }

  /**
   * Load state from disk (restores metadata; handlers must be re-registered)
   */
  async loadState(handlerFactory: (hookId: string) => Hook['handler']): Promise<void> {
    const state = await loadHookState(this.config.persistencePath);
    restoreHooksFromState(this.registeredHooks, state, handlerFactory);
  }

  /**
   * Shutdown - save state
   */
  async shutdown(): Promise<void> {
    if (this.config.enablePersistence) {
      await this.saveState();
    }
  }
}

/**
 * Create a new hook engine instance
 */
export function createHookEngine(options: HookEngineOptions): HookEngine {
  return new HookEngine(options);
}
