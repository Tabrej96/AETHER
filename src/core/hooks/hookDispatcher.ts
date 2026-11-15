/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook Dispatcher - routes events to registered hooks and collects results.
 * Handles priority ordering, timeout enforcement, error isolation,
 * conflict-group deduplication, and hook chaining.
 *
 * Enhanced with:
 *   - Hook chaining (chainAfter support, Superpowers-inspired)
 *   - Domain-specific dispatch context
 *   - Execution record callbacks
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain-aware dispatch patterns.
 *   Superpowers (https://github.com/obra/superpowers) — hook chaining model.
 */

import type {
  Hook,
  HookEvent,
  HookContext,
  HookResult,
  HookExecutionRecord,
} from './hookEngine';
import type { DispatcherConfig } from './hookEngine';
import {
  discoverHooksByEvent,
  recordHookExecution,
  getHookChain,
  type RegisteredHook,
} from './hookRegistry';
import { shouldHookExecute } from './hookConditions';

/**
 * Aggregated dispatch result
 */
export interface DispatchResult {
  action: 'continue' | 'modify' | 'block' | 'retry';
  modifiedData?: Record<string, unknown>;
  blockedBy?: string;
  message?: string;
  executedHooks: Array<{ hookId: string; action: string; durationMs: number }>;
  /** Chained hooks that were executed */
  chainedHooks?: string[];
}

/**
 * Promise-based timeout helper
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  hookId: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Hook "${hookId}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Execute a single hook with timeout and error isolation
 */
async function executeSingleHook(
  hook: Hook,
  context: HookContext,
  timeoutMs: number
): Promise<{ result: HookResult; durationMs: number; error?: string }> {
  const startTime = performance.now();
  try {
    const result = await withTimeout(
      Promise.resolve(hook.handler(context)),
      timeoutMs,
      hook.id
    );
    const durationMs = performance.now() - startTime;
    return { result, durationMs };
  } catch (err) {
    const durationMs = performance.now() - startTime;
    const message = (err as Error).message;
    // Error isolation: log but don't throw
    console.error(`[hookDispatcher] Hook "${hook.id}" failed: ${message}`);
    return {
      result: { action: 'continue', message: `Hook error (isolated): ${message}` },
      durationMs,
      error: message,
    };
  }
}

/**
 * Dispatch an event to all matching hooks.
 *
 * Flow:
 * 1. Discover hooks for the event
 * 2. Filter by conditions
 * 3. Execute sequentially by priority (within conflict groups, only highest priority runs)
 * 4. Collect results
 * 5. Follow chainAfter links for chained execution
 * 6. Determine final action
 */
export async function dispatch(
  registeredHooks: Map<string, RegisteredHook>,
  event: HookEvent | string,
  context: HookContext,
  config: DispatcherConfig,
  onRecordExecution?: (record: HookExecutionRecord) => void
): Promise<DispatchResult> {
  // 1. Discover matching hooks
  const candidates = discoverHooksByEvent(registeredHooks, event);

  // 2. Filter by conditions
  const filteredHooks = candidates.filter((hook) =>
    shouldHookExecute(hook.conditions, context)
  );

  if (filteredHooks.length === 0) {
    return {
      action: 'continue',
      executedHooks: [],
    };
  }

  // 3. Deduplicate by conflict group (only highest-priority hook per group runs)
  const seenConflictGroups = new Set<string>();
  const hooksToRun: Hook[] = [];

  for (const hook of filteredHooks) {
    const conflictGroup = hook.conflictGroup;
    if (conflictGroup) {
      if (seenConflictGroups.has(conflictGroup)) {
        continue;
      }
      seenConflictGroups.add(conflictGroup);
    }
    hooksToRun.push(hook);
  }

  // 4. Execute hooks sequentially by priority order
  const executedHooks: DispatchResult['executedHooks'] = [];
  const chainedHooks: string[] = [];
  let aggregateAction: HookResult['action'] = 'continue';
  let aggregateModifiedData = { ...context.data };
  let blocker: string | undefined;

  for (const hook of hooksToRun) {
    const timeoutMs = hook.timeoutMs ?? config.defaultTimeoutMs;

    const { result, durationMs, error } = await executeSingleHook(
      hook,
      context,
      timeoutMs
    );

    executedHooks.push({
      hookId: hook.id,
      action: result.action,
      durationMs,
    });

    // Record execution
    if (onRecordExecution) {
      onRecordExecution({
        hookId: hook.id,
        event: context.event,
        timestamp: new Date(),
        durationMs,
        action: result.action,
        success: !error,
        error,
        sessionId: context.sessionId,
        projectId: context.projectId,
      });
    }

    // Track blocking
    if (result.action === 'block' && !blocker) {
      blocker = hook.id;
      aggregateAction = 'block';
    }

    // Track modification
    if (result.action === 'modify' && result.modifiedData) {
      aggregateAction = 'modify';
      aggregateModifiedData = { ...aggregateModifiedData, ...result.modifiedData };
    }

    // Track retry
    if (result.action === 'retry') {
      aggregateAction = 'retry';
    }

    // If blocked, stop executing remaining hooks
    if (result.action === 'block') {
      break;
    }

    // Follow chainAfter links
    if (hook.chainAfter?.length && aggregateAction !== 'block') {
      const chain = getHookChain(registeredHooks, hook.id, 3);
      for (const chainedId of chain) {
        if (chainedId === hook.id) continue; // Skip self
        const chainedEntry = registeredHooks.get(chainedId);
        if (!chainedEntry?.definition.enabled) continue;

        const chainCtx: HookContext = {
          ...context,
          data: { ...aggregateModifiedData },
        };

        const chainTimeoutMs = chainedEntry.definition.timeoutMs ?? config.defaultTimeoutMs;
        const { result: chainResult, durationMs: chainDuration, error: chainError } =
          await executeSingleHook(chainedEntry.definition, chainCtx, chainTimeoutMs);

        chainedHooks.push(chainedId);
        executedHooks.push({
          hookId: chainedId,
          action: chainResult.action,
          durationMs: chainDuration,
        });

        if (onRecordExecution) {
          onRecordExecution({
            hookId: chainedId,
            event: context.event,
            timestamp: new Date(),
            durationMs: chainDuration,
            action: chainResult.action,
            success: !chainError,
            error: chainError,
            sessionId: context.sessionId,
            projectId: context.projectId,
            chainedFrom: hook.id,
          });
        }

        if (chainResult.action === 'block') {
          aggregateAction = 'block';
          blocker = chainedId;
          break;
        }
        if (chainResult.action === 'modify' && chainResult.modifiedData) {
          aggregateModifiedData = { ...aggregateModifiedData, ...chainResult.modifiedData };
        }
      }
    }
  }

  return {
    action: aggregateAction,
    modifiedData: aggregateAction === 'modify' ? aggregateModifiedData : undefined,
    blockedBy: blocker,
    executedHooks,
    chainedHooks: chainedHooks.length > 0 ? chainedHooks : undefined,
  };
}

/**
 * Convenience: emit an event with a fresh context
 */
export async function emit(
  registeredHooks: Map<string, RegisteredHook>,
  event: HookEvent,
  sessionId: string,
  projectId: string,
  data: Record<string, unknown>,
  config: DispatcherConfig,
  onRecordExecution?: (record: HookExecutionRecord) => void
): Promise<DispatchResult> {
  const context: HookContext = {
    event,
    timestamp: new Date(),
    sessionId,
    projectId,
    data,
  };

  return dispatch(registeredHooks, event, context, config, onRecordExecution);
}
