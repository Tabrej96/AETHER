/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Hook Engine — Core Types and Interfaces (Enhanced)
 * (src/core/hooks/hookEngine.ts)
 *
 * Enhanced with hook chaining, domain-specific conditions, and persistent
 * hook state management inspired by ECC and Superpowers.
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain decomposition and
 *   conditional hook dispatch patterns.
 *
 *   Superpowers (https://github.com/obra/superpowers) — hook chaining
 *   and composition model for building complex event handling pipelines.
 */

/**
 * Supported hook event types - covers the full lifecycle
 */
export type HookEvent =
  | 'pre_prompt_submit'
  | 'post_prompt_submit'
  | 'pre_tool_use'
  | 'post_tool_use'
  | 'pre_compact'
  | 'post_compact'
  | 'pre_agent_spawn'
  | 'post_agent_complete'
  | 'pre_workflow_start'
  | 'post_workflow_complete'
  | 'pre_skill_execute'
  | 'post_skill_execute'
  | 'error'
  | 'warning';

/**
 * The possible actions a hook can return to influence event flow
 */
export type HookAction = 'continue' | 'modify' | 'block' | 'retry';

/**
 * The result of a hook execution
 */
export interface HookResult {
  action: HookAction;
  modifiedData?: Record<string, unknown>;
  message?: string;
}

/**
 * The handler function signature for a hook
 */
export type HookHandler = (context: HookContext) => Promise<HookResult> | HookResult;

/**
 * Hook condition operators for filtering
 */
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'regex'
  | 'in'
  | 'not_in'
  | 'greater_than'
  | 'less_than';

/**
 * A single condition for conditional hook execution
 */
export interface HookCondition {
  field: string;
  operator: ConditionOperator;
  value: unknown;
}

/**
 * A condition group (all conditions must match - AND logic)
 */
export interface HookConditionGroup {
  conditions: HookCondition[];
  logic: 'AND' | 'OR';
}

/**
 * Runtime context passed to every hook handler
 */
export interface HookContext {
  event: HookEvent;
  timestamp: Date;
  sessionId: string;
  projectId: string;
  data: Record<string, unknown>;
}

/**
 * A registered hook definition
 */
export interface Hook {
  id: string;
  name: string;
  description: string;
  version: string;
  events: HookEvent[];
  handler: HookHandler;
  priority: number;
  enabled: boolean;
  conditions?: HookCondition[];
  timeoutMs?: number;
  conflictGroup?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  /** Hooks to chain after this one (Superpowers-inspired composition) */
  chainAfter?: string[];
  /** Domains this hook is relevant for */
  domain?: string[];
}

/**
 * Mapping from legacy event names (hooks.json format) to internal types
 */
export const EVENT_NAME_MAP: Record<string, HookEvent> = {
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
 * Reverse mapping from internal type to legacy name
 */
export const EVENT_NAME_REVERSE_MAP: Record<HookEvent, string> = {
  'pre_prompt_submit': 'PrePromptSubmit',
  'post_prompt_submit': 'PostPromptSubmit',
  'pre_tool_use': 'PreToolUse',
  'post_tool_use': 'PostToolUse',
  'pre_compact': 'PreCompact',
  'post_compact': 'PostCompact',
  'pre_agent_spawn': 'PreAgentSpawn',
  'post_agent_complete': 'PostAgentComplete',
  'pre_workflow_start': 'PreWorkflowStart',
  'post_workflow_complete': 'PostWorkflowComplete',
  'pre_skill_execute': 'PreSkillExecute',
  'post_skill_execute': 'PostSkillExecute',
  'error': 'Error',
  'warning': 'Warning',
};

/**
 * Execution record for a single hook invocation
 */
export interface HookExecutionRecord {
  hookId: string;
  event: HookEvent;
  timestamp: Date;
  durationMs: number;
  action: HookAction;
  success: boolean;
  error?: string;
  sessionId: string;
  projectId: string;
  /** Chain: if this hook triggered a chained hook, record it */
  chainedFrom?: string;
}

/**
 * Hook engine configuration
 */
export interface HookEngineConfig {
  defaultTimeoutMs: number;
  maxConcurrentHooks: number;
  enablePersistence: boolean;
  persistencePath: string;
  enableExecutionLogging: boolean;
  maxExecutionHistory: number;
  /** Max chain depth for chained hooks */
  maxChainDepth: number;
}

/** Alias kept for backwards compatibility with dispatcher imports */
export type DispatcherConfig = HookEngineConfig;

/**
 * Default engine configuration
 */
export const DEFAULT_HOOK_ENGINE_CONFIG: HookEngineConfig = {
  defaultTimeoutMs: 5000,
  maxConcurrentHooks: 10,
  enablePersistence: true,
  persistencePath: './data/hooks',
  enableExecutionLogging: true,
  maxExecutionHistory: 1000,
  maxChainDepth: 3,
};

/**
 * Domain-specific hook condition presets (ECC-inspired).
 */
export interface DomainHookPreset {
  domain: string;
  name: string;
  hooks: DomainHookDefinition[];
}

/**
 * A hook definition scoped to a domain with pre-built conditions.
 */
export interface DomainHookDefinition {
  id: string;
  name: string;
  description: string;
  events: HookEvent[];
  priority: number;
  conditions: HookCondition[];
  tags?: string[];
  handler: HookHandler;
}

/**
 * Hook chain execution state.
 */
export interface ChainState {
  chainId: string;
  executed: string[];
  depth: number;
}
