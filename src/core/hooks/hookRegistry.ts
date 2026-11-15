/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook Registry - manages hook registration, discovery, and lifecycle
 * (Enhanced with domain-specific hooks and chaining support)
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain decomposition patterns
 *   inspired the domain-aware discovery methods.
 *
 *   Superpowers (https://github.com/obra/superpowers) — hook chaining and
 *   composition model inspired the chain management methods.
 */

import type {
  Hook, HookEvent, HookHandler, HookCondition, HookResult, HookContext, HookEngineConfig,
  DomainHookPreset, DomainHookDefinition,
} from './hookEngine';
import { EVENT_NAME_MAP, DEFAULT_HOOK_ENGINE_CONFIG } from './hookEngine';
import { ALL_DOMAIN_HOOK_PRESETS, getHookPresetsForDomain, loadDomainPresets } from './domainHookPresets';

/**
 * Inline event name mapping to avoid runtime circular dependencies.
 * Maps legacy hooks.json event names to internal HookEvent types.
 */
const EVENT_NAME_MAP_LOCAL: Record<string, HookEvent> = {
  'PrePromptSubmit': 'pre_prompt_submit',
  'PostPromptSubmit': 'post_prompt_submit',
  'PreToolUse': 'pre_tool_use',
  'PostToolUse': 'post_tool_use',
  'PreCompact': 'pre_compact',
  'PostCompact': 'post_compact',
  'PreAgentSpawn': 'pre_agent_spawn',
  'PostAgentComplete': 'post_agent_complete',
  'PreWorkflowStart': 'pre_workflow_start',
  'PostWorkflowComplete': 'post_workflow_complete',
  'PreSkillExecute': 'pre_skill_execute',
  'PostSkillExecute': 'post_skill_execute',
  'Error': 'error',
  'Warning': 'warning',
};

/**
 * Internal hook entry with extra registry state (exported so dispatcher can type-check)
 */
export interface RegisteredHook {
  definition: Hook;
  registeredAt: Date;
  lastExecutedAt?: Date;
  executionCount: number;
  /** For chained hooks: which hook triggered this one */
  chainedFrom?: string;
  /** Domain(s) this hook is relevant for */
  domains?: string[];
}

/**
 * Find hooks matching the given event type (from hooks.json or internal format)
 */
export function discoverHooksByEvent(
  registeredHooks: Map<string, RegisteredHook>,
  event: HookEvent | string
): Hook[] {
  const results: Hook[] = [];

  for (const entry of registeredHooks.values()) {
    if (!entry.definition.enabled) continue;

    // Normalize the event name
    let normalizedEvent: HookEvent;
    if (event in EVENT_NAME_MAP_LOCAL) {
      // It's a legacy string like "PrePromptSubmit"
      normalizedEvent = EVENT_NAME_MAP_LOCAL[event as keyof typeof EVENT_NAME_MAP_LOCAL];
    } else {
      normalizedEvent = event as HookEvent;
    }

    if (entry.definition.events.includes(normalizedEvent)) {
      results.push(entry.definition);
    }
  }

  // Sort by priority (higher priority = runs first)
  results.sort((a, b) => b.priority - a.priority);

  return results;
}

/**
 * Register a new hook in the registry
 */
export function registerHook(
  registeredHooks: Map<string, RegisteredHook>,
  hook: Hook
): void {
  if (registeredHooks.has(hook.id)) {
    throw new Error(`Hook with id "${hook.id}" is already registered`);
  }

  registeredHooks.set(hook.id, {
    definition: hook,
    registeredAt: new Date(),
    executionCount: 0,
    domains: hook.domain,
  });
}

/**
 * Unregister a hook from the registry
 */
export function unregisterHook(
  registeredHooks: Map<string, RegisteredHook>,
  hookId: string
): boolean {
  return registeredHooks.delete(hookId);
}

/**
 * Enable a hook
 */
export function enableHook(
  registeredHooks: Map<string, RegisteredHook>,
  hookId: string
): void {
  const entry = registeredHooks.get(hookId);
  if (!entry) {
    throw new Error(`Hook with id "${hookId}" not found`);
  }
  entry.definition.enabled = true;
}

/**
 * Disable a hook
 */
export function disableHook(
  registeredHooks: Map<string, RegisteredHook>,
  hookId: string
): void {
  const entry = registeredHooks.get(hookId);
  if (!entry) {
    throw new Error(`Hook with id "${hookId}" not found`);
  }
  entry.definition.enabled = false;
}

/**
 * Get all registered hooks
 */
export function getAllHooks(registeredHooks: Map<string, RegisteredHook>): Hook[] {
  return Array.from(registeredHooks.values()).map((entry) => entry.definition);
}

/**
 * Get a single hook by ID
 */
export function getHookById(
  registeredHooks: Map<string, RegisteredHook>,
  hookId: string
): Hook | undefined {
  return registeredHooks.get(hookId)?.definition;
}

/**
 * Update hook execution stats after a run
 */
export function recordHookExecution(
  registeredHooks: Map<string, RegisteredHook>,
  hookId: string,
  durationMs: number
): void {
  const entry = registeredHooks.get(hookId);
  if (entry) {
    entry.executionCount++;
    entry.lastExecutedAt = new Date();
  }
}

/**
 * Load hooks from the hooks.json format
 */
export function loadHooksFromJSON(
  registeredHooks: Map<string, RegisteredHook>,
  raw: unknown
): void {
  const parsed = raw as {
    schemaVersion?: string;
    hooks: Array<{
      id: string;
      event: string;
      priority?: number;
      timeoutMs?: number;
      conflictGroup?: string;
      action: string;
      matcher?: string;
      [key: string]: unknown;
    }>;
  };

  if (!parsed || !Array.isArray(parsed.hooks)) {
    throw new Error('Invalid hooks.json format: missing "hooks" array');
  }

  for (const h of parsed.hooks) {
    // Normalize event name
    const eventName = h.event as keyof typeof EVENT_NAME_MAP_LOCAL;
    const internalEvent = EVENT_NAME_MAP_LOCAL[eventName] ?? h.event;

    // Create a stub handler that evaluates based on the action description
    const handler = createStubHandler(h.id, h.action, h.timeoutMs);

    const hook: Hook = {
      id: h.id,
      name: h.id,
      description: typeof h.action === 'string' ? h.action : '',
      version: '1.0.0',
      events: [internalEvent as HookEvent],
      handler,
      priority: h.priority ?? 50,
      enabled: true,
      timeoutMs: h.timeoutMs,
      conflictGroup: h.conflictGroup,
      tags: h.matcher ? [h.matcher] : undefined,
      metadata: { source: 'hooks.json', matcher: h.matcher },
    };

    registerHook(registeredHooks, hook);
  }
}

/**
 * Create a stub handler from JSON action description
 */
function createStubHandler(
  hookId: string,
  action: string,
  timeoutMs?: number
): HookHandler {
  return async (context: HookContext): Promise<HookResult> => {
    const start = performance.now();
    try {
      // In a real system, the action string would be compiled into logic.
      // For now, we evaluate it as a security/behavioral signal:
      // - If the data contains a 'blocked' flag set by another hook, honor it
      // - Otherwise, log the action and continue
      const hasBlockSignal = (context.data as Record<string, unknown>)['blocked'] === true;
      if (hasBlockSignal) {
        return {
          action: 'block',
          message: `[${hookId}] Blocked due to prior signal in context data`,
        };
      }

      // Log the action for visibility
      const elapsed = performance.now() - start;
      console.log(
        `[hook:${hookId}] event=${context.event} action="${action}" ${elapsed.toFixed(2)}ms`
      );

      return {
        action: 'continue',
        message: `[${hookId}] Executed: ${action}`,
      };
    } catch (err) {
      return {
        action: 'continue',
        message: `[${hookId}] Error during execution: ${(err as Error).message}`,
      };
    }
  };
}

/**
 * Get hook execution stats
 */
export function getHookStats(
  registeredHooks: Map<string, RegisteredHook>
): Array<{ id: string; enabled: boolean; executionCount: number; lastExecuted?: Date }> {
  return Array.from(registeredHooks.values()).map((entry) => ({
    id: entry.definition.id,
    enabled: entry.definition.enabled,
    executionCount: entry.executionCount,
    lastExecuted: entry.lastExecutedAt,
  }));
}

// ---- Domain-specific methods (ECC-inspired) ----

/**
 * Register all hooks from a domain-specific preset.
 */
export function registerDomainPreset(
  registeredHooks: Map<string, RegisteredHook>,
  domain: string,
  projectId?: string
): number {
  const hooks = loadDomainPresets(domain, projectId ?? domain);
  let registered = 0;
  for (const hook of hooks) {
    try {
      registerHook(registeredHooks, hook);
      registered++;
    } catch {
      // Skip duplicates
    }
  }
  return registered;
}

/**
 * Register multiple domain presets at once.
 */
export function registerMultipleDomainPresets(
  registeredHooks: Map<string, RegisteredHook>,
  domains: string[]
): Record<string, number> {
  const results: Record<string, number> = {};
  for (const domain of domains) {
    results[domain] = registerDomainPreset(registeredHooks, domain);
  }
  return results;
}

/**
 * Find hooks by domain tag.
 */
export function findHooksByDomain(
  registeredHooks: Map<string, RegisteredHook>,
  domain: string
): Hook[] {
  return Array.from(registeredHooks.values())
    .filter(entry => {
      const hookDomains = entry.domains ?? entry.definition.domain ?? [];
      return hookDomains.some(d => d === domain || d === '*');
    })
    .map(entry => entry.definition);
}

/**
 * Find hooks by tag.
 */
export function findHooksByTag(
  registeredHooks: Map<string, RegisteredHook>,
  tag: string
): Hook[] {
  return Array.from(registeredHooks.values())
    .filter(entry => (entry.definition.tags ?? []).includes(tag))
    .map(entry => entry.definition);
}

/**
 * Get all available domain presets.
 */
export function getAvailableDomainPresets(): DomainHookPreset[] {
  return [...ALL_DOMAIN_HOOK_PRESETS];
}

// ---- Hook chaining methods (Superpowers-inspired) ----

/**
 * Get the chain of hooks that would be triggered after a given hook,
 * following chainAfter links up to maxDepth.
 */
export function getHookChain(
  registeredHooks: Map<string, RegisteredHook>,
  hookId: string,
  maxDepth = DEFAULT_HOOK_ENGINE_CONFIG.maxChainDepth
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  let current = hookId;

  while (current && chain.length < maxDepth) {
    if (visited.has(current)) break; // Avoid circular chains
    visited.add(current);
    chain.push(current);

    const entry = registeredHooks.get(current);
    if (!entry?.definition.chainAfter?.length) break;

    // Follow the first chained hook (chains are typically linear)
    current = entry.definition.chainAfter[0];
  }

  return chain;
}

/**
 * Register a hook chain (multiple hooks with chainAfter links).
 */
export function registerHookChain(
  registeredHooks: Map<string, RegisteredHook>,
  hooks: Hook[]
): void {
  // Sort by priority so chain links are established correctly
  const sorted = [...hooks].sort((a, b) => b.priority - a.priority);

  for (let i = 0; i < sorted.length; i++) {
    const hook = { ...sorted[i] };
    // Chain each hook to the next one in priority order
    if (i < sorted.length - 1) {
      hook.chainAfter = [sorted[i + 1].id];
    } else {
      hook.chainAfter = [];
    }
    try {
      registerHook(registeredHooks, hook);
    } catch {
      // Already registered — update chain info
      const existing = registeredHooks.get(hook.id);
      if (existing) {
        existing.definition.chainAfter = hook.chainAfter;
      }
    }
  }
}

/**
 * Validate that a hook chain has no circular references.
 */
export function validateHookChain(
  registeredHooks: Map<string, RegisteredHook>,
  startHookId: string
): { valid: boolean; cycle?: string[] } {
  const chain = getHookChain(registeredHooks, startHookId);
  const seen = new Set<string>();
  for (const id of chain) {
    if (seen.has(id)) {
      return { valid: false, cycle: chain.slice(chain.indexOf(id)) };
    }
    seen.add(id);
  }
  return { valid: true };
}

/**
 * Bulk register hooks from a DomainHookPreset.
 */
export function registerDomainHookPreset(
  registeredHooks: Map<string, RegisteredHook>,
  preset: DomainHookPreset
): number {
  let registered = 0;
  for (const def of preset.hooks) {
    const hook: Hook = {
      id: def.id,
      name: def.name,
      description: def.description,
      version: '1.0.0',
      events: def.events,
      handler: def.handler,
      priority: def.priority,
      enabled: true,
      conditions: def.conditions,
      tags: def.tags,
      metadata: { source: 'domain-preset', domain: preset.domain },
      domain: [preset.domain],
    };
    try {
      registerHook(registeredHooks, hook);
      registered++;
    } catch {
      // Skip duplicates
    }
  }
  return registered;
}
