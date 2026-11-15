/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook Engine Tests
 *
 * Run via: npx tsx --test src/core/hooks/hookEngine.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// We test internal modules directly to avoid circular imports
import {
  registerHook,
  unregisterHook,
  discoverHooksByEvent,
  enableHook,
  disableHook,
  getAllHooks,
  getHookById,
  getHookStats,
  loadHooksFromJSON,
  type RegisteredHook,
} from './hookRegistry';
import { evaluateConditions, shouldHookExecute, createEventCondition } from './hookConditions';
import { dispatch, emit } from './hookDispatcher';
import type { DispatcherConfig } from './hookEngine';
import { loadHookState, saveHookState, buildPersistedState, restoreHooksFromState } from './hookPersistence';
import type {
  Hook,
  HookEvent,
  HookContext,
  HookResult,
} from './hookEngine';
import { DEFAULT_HOOK_ENGINE_CONFIG, EVENT_NAME_MAP } from './hookEngine';

// ---------- Helpers ----------

function makeHook(overrides: Partial<Hook> = {}): Hook {
  return {
    id: `hook-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Hook',
    description: 'A test hook',
    version: '1.0.0',
    events: ['pre_tool_use'],
    handler: async (): Promise<HookResult> => ({ action: 'continue' }),
    priority: 50,
    enabled: true,
    ...overrides,
  };
}

function makeContext(event: HookEvent = 'pre_tool_use'): HookContext {
  return {
    event,
    timestamp: new Date(),
    sessionId: 'session-1',
    projectId: 'project-1',
    data: {},
  };
}

const DEFAULT_DISPATCHER_CONFIG: DispatcherConfig = {
  defaultTimeoutMs: 5000,
  maxConcurrentHooks: 10,
};

const TEMP_DIR = '/tmp/aether-hooks-test';

// ============================================================
// 1. HookRegistry tests
// ============================================================
test('HookRegistry: registerHook registers a hook', () => {
  const registry = new Map<string, RegisteredHook>();
  const hook = makeHook({ id: 'h1' });
  registerHook(registry, hook);
  assert.strictEqual(registry.size, 1);
});

test('HookRegistry: registerHook throws on duplicate id', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'h1' }));
  assert.throws(() => registerHook(registry, makeHook({ id: 'h1' })), /already registered/);
});

test('HookRegistry: unregisterHook removes a hook', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'h1' }));
  assert.strictEqual(registry.size, 1);
  const result = unregisterHook(registry, 'h1');
  assert.strictEqual(result, true);
  assert.strictEqual(registry.size, 0);
});

test('HookRegistry: unregisterHook returns false for missing hook', () => {
  const registry = new Map<string, RegisteredHook>();
  assert.strictEqual(unregisterHook(registry, 'nonexistent'), false);
});

test('HookRegistry: getHookById returns the hook', () => {
  const registry = new Map<string, RegisteredHook>();
  const hook = makeHook({ id: 'h1', name: 'Unique Name' });
  registerHook(registry, hook);
  const found = getHookById(registry, 'h1');
  assert.strictEqual(found?.name, 'Unique Name');
});

test('HookRegistry: getAllHooks returns all hooks', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'h1' }));
  registerHook(registry, makeHook({ id: 'h2' }));
  assert.strictEqual(getAllHooks(registry).length, 2);
});

test('HookRegistry: enableHook / disableHook toggles enabled', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'h1', enabled: true }));
  disableHook(registry, 'h1');
  assert.strictEqual(getHookById(registry, 'h1')?.enabled, false);
  enableHook(registry, 'h1');
  assert.strictEqual(getHookById(registry, 'h1')?.enabled, true);
});

test('HookRegistry: discoverHooksByEvent finds matching hooks', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'h1', events: ['pre_tool_use'] }));
  registerHook(registry, makeHook({ id: 'h2', events: ['post_tool_use'] }));
  registerHook(registry, makeHook({ id: 'h3', events: ['pre_tool_use', 'post_tool_use'] }));

  const results = discoverHooksByEvent(registry, 'pre_tool_use');
  const ids = results.map((h) => h.id).sort();
  assert.deepStrictEqual(ids, ['h1', 'h3']);
});

test('HookRegistry: discoverHooksByEvent sorts by priority descending', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'low', priority: 10, events: ['pre_tool_use'] }));
  registerHook(registry, makeHook({ id: 'high', priority: 100, events: ['pre_tool_use'] }));
  registerHook(registry, makeHook({ id: 'mid', priority: 50, events: ['pre_tool_use'] }));

  const results = discoverHooksByEvent(registry, 'pre_tool_use');
  assert.deepStrictEqual(results.map((h) => h.id), ['high', 'mid', 'low']);
});

test('HookRegistry: discoverHooksByEvent skips disabled hooks', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'h1', enabled: true, events: ['pre_tool_use'] }));
  registerHook(registry, makeHook({ id: 'h2', enabled: false, events: ['pre_tool_use'] }));

  const results = discoverHooksByEvent(registry, 'pre_tool_use');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, 'h1');
});

test('HookRegistry: discoverHooksByEvent accepts legacy event names', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'h1', events: ['pre_prompt_submit'] }));
  const results = discoverHooksByEvent(registry, 'PrePromptSubmit');
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].id, 'h1');
});

test('HookRegistry: loadHooksFromJSON loads hooks from JSON', () => {
  const registry = new Map<string, RegisteredHook>();
  const json = {
    schemaVersion: '2.0.0',
    hooks: [
      {
        id: 'json-hook-1',
        event: 'PrePromptSubmit',
        priority: 10,
        timeoutMs: 50,
        conflictGroup: 'security',
        action: 'Scan for injection',
      },
      {
        id: 'json-hook-2',
        event: 'PreToolUse',
        matcher: 'Bash|Shell',
        priority: 20,
        timeoutMs: 35,
        conflictGroup: 'safety',
        action: 'Verify leases',
      },
    ],
  };

  loadHooksFromJSON(registry, json);
  assert.strictEqual(registry.size, 2);
  const h1 = getHookById(registry, 'json-hook-1');
  assert.deepStrictEqual(h1?.events, ['pre_prompt_submit']);
  assert.strictEqual(h1?.priority, 10);
  assert.strictEqual(h1?.timeoutMs, 50);
  assert.strictEqual(h1?.conflictGroup, 'security');
});

test('HookRegistry: loadHooksFromJSON throws on invalid JSON', () => {
  const registry = new Map<string, RegisteredHook>();
  assert.throws(() => loadHooksFromJSON(registry, { bad: true }), /Invalid/);
  assert.throws(() => loadHooksFromJSON(registry, null as unknown as Record<string, unknown>), /Invalid/);
});

// ============================================================
// 2. HookConditions tests
// ============================================================
test('HookConditions: shouldHookExecute returns true when no conditions', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: {},
  };
  assert.strictEqual(shouldHookExecute(undefined, ctx), true);
  assert.strictEqual(shouldHookExecute([], ctx), true);
});

test('HookConditions: evaluates equals operator', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: { toolName: 'Edit' },
  };
  assert.strictEqual(shouldHookExecute([createEventCondition('pre_tool_use')], ctx), true);
});

test('HookConditions: evaluates not_equals operator', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: { toolName: 'Edit' },
  };
  assert.strictEqual(
    shouldHookExecute([{ field: 'event', operator: 'not_equals', value: 'pre_tool_use' }], ctx),
    false
  );
});

test('HookConditions: evaluates contains operator', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: { toolName: 'Edit' },
  };
  assert.strictEqual(
    shouldHookExecute([{ field: 'toolName', operator: 'contains', value: 'Ed' }], ctx),
    true
  );
});

test('HookConditions: evaluates in operator', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: { toolName: 'Edit' },
  };
  assert.strictEqual(
    shouldHookExecute([{ field: 'toolName', operator: 'in', value: ['Edit', 'Write'] }], ctx),
    true
  );
  assert.strictEqual(
    shouldHookExecute([{ field: 'toolName', operator: 'in', value: ['Bash', 'Shell'] }], ctx),
    false
  );
});

test('HookConditions: evaluates greater_than operator', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: { attempts: 3 },
  };
  assert.strictEqual(
    shouldHookExecute([{ field: 'attempts', operator: 'greater_than', value: 2 }], ctx),
    true
  );
});

test('HookConditions: evaluates regex operator', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: { toolName: 'Edit' },
  };
  assert.strictEqual(
    shouldHookExecute([{ field: 'toolName', operator: 'regex', value: '^E' }], ctx),
    true
  );
  assert.strictEqual(
    shouldHookExecute([{ field: 'toolName', operator: 'regex', value: '^B' }], ctx),
    false
  );
});

test('HookConditions: evaluates nested fields', () => {
  const ctx: HookContext = {
    event: 'pre_tool_use',
    timestamp: new Date(),
    sessionId: 's-1',
    projectId: 'p-1',
    data: { user: { role: 'admin' } },
  };
  assert.strictEqual(
    shouldHookExecute([{ field: 'user.role', operator: 'equals', value: 'admin' }], ctx),
    true
  );
});

// ============================================================
// 3. HookDispatcher tests
// ============================================================
test('HookDispatcher: dispatch returns continue when no hooks match', async () => {
  const registry = new Map<string, RegisteredHook>();
  const result = await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(result.action, 'continue');
  assert.deepStrictEqual(result.executedHooks, []);
});

test('HookDispatcher: dispatch executes matching hooks', async () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({
    id: 'h1',
    events: ['pre_tool_use'],
    handler: async (): Promise<HookResult> => ({ action: 'continue', message: 'h1-ran' }),
  }));

  const result = await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(result.action, 'continue');
  assert.strictEqual(result.executedHooks.length, 1);
  assert.strictEqual(result.executedHooks[0].hookId, 'h1');
});

test('HookDispatcher: dispatch respects priority order', async () => {
  const registry = new Map<string, RegisteredHook>();
  const order: string[] = [];
  registerHook(registry, makeHook({
    id: 'low', priority: 10, events: ['pre_tool_use'],
    handler: async () => { order.push('low'); return { action: 'continue' }; },
  }));
  registerHook(registry, makeHook({
    id: 'high', priority: 100, events: ['pre_tool_use'],
    handler: async () => { order.push('high'); return { action: 'continue' }; },
  }));

  await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  assert.deepStrictEqual(order, ['high', 'low']);
});

test('HookDispatcher: conflict group deduplication', async () => {
  const registry = new Map<string, RegisteredHook>();
  const ran: string[] = [];
  registerHook(registry, makeHook({
    id: 'hg-high', priority: 100, conflictGroup: 'g1', events: ['pre_tool_use'],
    handler: async () => { ran.push('hg-high'); return { action: 'continue' }; },
  }));
  registerHook(registry, makeHook({
    id: 'hg-low', priority: 10, conflictGroup: 'g1', events: ['pre_tool_use'],
    handler: async () => { ran.push('hg-low'); return { action: 'continue' }; },
  }));

  await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  assert.deepStrictEqual(ran, ['hg-high']);
});

test('HookDispatcher: block action stops execution', async () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({
    id: 'blocker', priority: 100, events: ['pre_tool_use'],
    handler: async () => ({ action: 'block', message: 'denied' }),
  }));
  registerHook(registry, makeHook({
    id: 'should-not-run', priority: 50, events: ['pre_tool_use'],
    handler: async () => ({ action: 'continue', message: 'should not see this' }),
  }));

  const result = await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(result.action, 'block');
  assert.strictEqual(result.blockedBy, 'blocker');
  assert.strictEqual(result.executedHooks.length, 1);
});

test('HookDispatcher: modify action aggregates data', async () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({
    id: 'modifier', events: ['pre_tool_use'],
    handler: async () => ({
      action: 'modify',
      modifiedData: { sanitized: true, removed: 'secret' },
    }),
  }));

  const result = await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(result.action, 'modify');
  assert.strictEqual(result.modifiedData?.sanitized, true);
  assert.strictEqual(result.modifiedData?.removed, 'secret');
});

test('HookDispatcher: errors are isolated (do not crash)', async () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({
    id: 'broken', events: ['pre_tool_use'],
    handler: async () => { throw new Error('Hook crashed'); },
  }));
  registerHook(registry, makeHook({
    id: 'normal', events: ['pre_tool_use'],
    handler: async () => ({ action: 'continue' }),
  }));

  const result = await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(result.action, 'continue');
  assert.strictEqual(result.executedHooks.length, 2);
});

test('HookDispatcher: timeout enforcement on slow hooks', async () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({
    id: 'slow', events: ['pre_tool_use'], timeoutMs: 100,
    handler: async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return { action: 'continue' };
    },
  }));

  const start = Date.now();
  const result = await dispatch(registry, 'pre_tool_use', makeContext(), DEFAULT_DISPATCHER_CONFIG);
  const elapsed = Date.now() - start;

  assert.strictEqual(result.action, 'continue');
  assert.strictEqual(result.executedHooks[0].hookId, 'slow');
  // Should not have waited 5 seconds
  assert.ok(elapsed < 1000, `Expected <1000ms, got ${elapsed}ms`);
});

test('HookDispatcher: emit creates fresh context', async () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({
    id: 'e1', events: ['pre_prompt_submit'],
    handler: async (ctx) => {
      assert.strictEqual(ctx.event, 'pre_prompt_submit');
      assert.strictEqual(ctx.sessionId, 's-1');
      assert.strictEqual(ctx.projectId, 'p-1');
      return { action: 'continue' };
    },
  }));

  const result = await emit(registry, 'pre_prompt_submit', 's-1', 'p-1', { foo: 'bar' }, DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(result.action, 'continue');
  assert.strictEqual(result.executedHooks.length, 1);
});

// ============================================================
// 4. Persistence tests
// ============================================================
test('HookPersistence: save and load hook state', async () => {
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch { /* ignore */ }

  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'persist-h1', events: ['pre_tool_use'] }));

  const state = buildPersistedState(registry, [], DEFAULT_HOOK_ENGINE_CONFIG);
  await saveHookState(TEMP_DIR, state);

  const loaded = await loadHookState(TEMP_DIR);
  assert.notStrictEqual(loaded, null);
  assert.strictEqual(loaded!.hooks.length, 1);
  assert.strictEqual(loaded!.hooks[0].id, 'persist-h1');
  assert.deepStrictEqual(loaded!.hooks[0].events, ['pre_tool_use']);
});

test('HookPersistence: load returns null for missing state', async () => {
  const result = await loadHookState('/nonexistent/path/hooks');
  assert.strictEqual(result, null);
});

test('HookPersistence: restoreHooksFromState recreates hooks', () => {
  const registry = new Map<string, RegisteredHook>();
  const handlerFactory = (id: string) => async (): Promise<HookResult> => ({ action: 'continue' });

  const state = {
    schemaVersion: '2.0.0' as const,
    engineVersion: '1.0.0',
    persistedAt: new Date().toISOString(),
    hooks: [
      {
        id: 'restored-1',
        name: 'Restored Hook',
        description: 'From disk',
        version: '1.0.0',
        events: ['pre_compact'],
        priority: 30,
        enabled: false,
        conditions: [{ field: 'projectId', operator: 'equals', value: 'proj-a' }],
      },
    ],
    executionHistory: [],
  };

  restoreHooksFromState(registry, state, handlerFactory);
  assert.strictEqual(registry.size, 1);
  const hook = getHookById(registry, 'restored-1');
  assert.strictEqual(hook?.name, 'Restored Hook');
  assert.deepStrictEqual(hook?.events, ['pre_compact']);
  assert.strictEqual(hook?.enabled, false);
});

test('HookPersistence: does not overwrite existing hooks on restore', () => {
  const registry = new Map<string, RegisteredHook>();
  registerHook(registry, makeHook({ id: 'existing', name: 'Original' }));
  const handlerFactory = (id: string) => async (): Promise<HookResult> => ({ action: 'continue' });

  const state = {
    schemaVersion: '2.0.0' as const,
    engineVersion: '1.0.0',
    persistedAt: new Date().toISOString(),
    hooks: [
      {
        id: 'existing',
        name: 'Should Not Overwrite',
        description: '',
        version: '1.0.0',
        events: ['pre_tool_use'],
        priority: 50,
        enabled: true,
      },
    ],
    executionHistory: [],
  };

  restoreHooksFromState(registry, state, handlerFactory);
  assert.strictEqual(registry.size, 1);
  assert.strictEqual(getHookById(registry, 'existing')?.name, 'Original');
});

// ============================================================
// 5. Event Name Mapping tests
// ============================================================
test('Event Name Mapping: maps all 14 legacy event names', () => {
  const legacyEvents = [
    'PrePromptSubmit', 'PostPromptSubmit', 'PreToolUse', 'PostToolUse',
    'PreCompact', 'PostCompact', 'PreAgentSpawn', 'PostAgentComplete',
    'PreWorkflowStart', 'PostWorkflowComplete', 'PreSkillExecute', 'PostSkillExecute',
    'Error', 'Warning',
  ];

  for (const legacy of legacyEvents) {
    assert.ok(EVENT_NAME_MAP[legacy as keyof typeof EVENT_NAME_MAP], `Missing mapping for ${legacy}`);
  }
  assert.strictEqual(Object.keys(EVENT_NAME_MAP).length, 14);
});

// ============================================================
// 6. hooks.json Integration tests
// ============================================================
test('hooks.json Integration: loads and dispatches all 4 hooks', async () => {
  const registry = new Map<string, RegisteredHook>();
  const hooksJson = {
    schemaVersion: '2.0.0',
    harness: 'aether-universal-hooks',
    hooks: [
      {
        id: 'pre-prompt-security-and-slice',
        event: 'PrePromptSubmit',
        priority: 10,
        timeoutMs: 50,
        conflictGroup: 'context-ingestion',
        action: 'Scan untrusted files for indirect prompt injection',
      },
      {
        id: 'pre-tool-command-sandbox',
        event: 'PreToolUse',
        matcher: 'Bash|Shell|Edit|Write',
        priority: 20,
        timeoutMs: 35,
        conflictGroup: 'safety-gate',
        action: 'Verify active agent holds exclusive file-write lease',
      },
      {
        id: 'post-edit-incremental-verify',
        event: 'PostToolUse',
        matcher: 'Edit|Write|MultiEdit',
        priority: 30,
        timeoutMs: 1200,
        conflictGroup: 'verification-gate',
        action: 'Invalidate stale Layer-3 memory hashes',
      },
      {
        id: 'pre-compact-merkle-checkpoint',
        event: 'PreCompact',
        priority: 40,
        timeoutMs: 80,
        conflictGroup: 'continuity-ledger',
        action: 'Persist Zero-Loss Continuity Merkle checkpoint',
      },
    ],
  };

  loadHooksFromJSON(registry, hooksJson);
  assert.strictEqual(registry.size, 4);

  const prePrompt = await dispatch(registry, 'PrePromptSubmit', makeContext('pre_prompt_submit'), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(prePrompt.executedHooks[0]?.hookId, 'pre-prompt-security-and-slice');

  const preTool = await dispatch(registry, 'PreToolUse', makeContext('pre_tool_use'), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(preTool.executedHooks[0]?.hookId, 'pre-tool-command-sandbox');

  const postTool = await dispatch(registry, 'PostToolUse', makeContext('post_tool_use'), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(postTool.executedHooks[0]?.hookId, 'post-edit-incremental-verify');

  const preCompact = await dispatch(registry, 'PreCompact', makeContext('pre_compact'), DEFAULT_DISPATCHER_CONFIG);
  assert.strictEqual(preCompact.executedHooks[0]?.hookId, 'pre-compact-merkle-checkpoint');
});

test('hooks.json Integration: no hooks for unrelated events', async () => {
  const registry = new Map<string, RegisteredHook>();
  loadHooksFromJSON(registry, {
    schemaVersion: '2.0.0',
    hooks: [
      { id: 'h1', event: 'PrePromptSubmit', priority: 10, timeoutMs: 50, action: 'scan' },
    ],
  });

  const result = await dispatch(registry, 'post_tool_use', makeContext('post_tool_use'), DEFAULT_DISPATCHER_CONFIG);
  assert.deepStrictEqual(result.executedHooks, []);
});

// ============================================================
// 7. Default Config test
// ============================================================
test('Default Config: has sensible defaults', () => {
  assert.strictEqual(DEFAULT_HOOK_ENGINE_CONFIG.defaultTimeoutMs, 5000);
  assert.strictEqual(DEFAULT_HOOK_ENGINE_CONFIG.maxConcurrentHooks, 10);
  assert.strictEqual(DEFAULT_HOOK_ENGINE_CONFIG.enablePersistence, true);
  assert.strictEqual(DEFAULT_HOOK_ENGINE_CONFIG.maxExecutionHistory, 1000);
});

// Cleanup temp dir
try {
  await fs.rm(TEMP_DIR, { recursive: true, force: true });
} catch { /* ignore */ }
