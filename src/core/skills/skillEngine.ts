/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Core Interfaces
 * (src/core/skills/skillEngine.ts)
 *
 * Defines the type system for executable skills. Every skill must carry
 * a runnable implementation (inline code, agent dispatch, workflow ref,
 * or MCP tool) alongside metadata for discovery, composition, and learning.
 */

// ---------------------------------------------------------------------------
// Core skill contract
// ---------------------------------------------------------------------------

export interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  domain: string[];
  capabilities: string[];
  inputs: SkillInput[];
  outputs: SkillOutput[];
  execution: SkillExecution;
  dependencies: string[];
  security: SkillSecurity;
  tests: SkillTest[];
  metadata: SkillMetadata;
}

export interface SkillInput {
  name: string;
  type: DataType;
  required: boolean;
  description: string;
  defaultValue?: unknown;
}

export interface SkillOutput {
  name: string;
  type: DataType;
  description: string;
}

export type DataType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'any';

// ---------------------------------------------------------------------------
// Execution — how a skill actually runs
// ---------------------------------------------------------------------------

export type ExecutionType = 'inline' | 'agent' | 'workflow' | 'mcp';

export interface SkillExecution {
  type: ExecutionType;
  /** For inline: TypeScript source text (function body).
   *  For agent: agent id from the AETHER agent registry.
   *  For workflow: workflow id.
   *  For mcp: MCP tool name.
   */
  implementation: string;
  /** Entry point name for inline (default: 'execute') */
  entryPoint?: string;
  timeoutMs: number;
  retryPolicy: RetryPolicy;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  retryableErrors: string[];
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

export interface SkillSecurity {
  requiresAuth: boolean;
  permissions: string[];
  dataAccess: string[];
  networkAccess: boolean;
}

// ---------------------------------------------------------------------------
// Tests — every skill must have at least one
// ---------------------------------------------------------------------------

export interface SkillTest {
  name: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Metadata (non-functional)
// ---------------------------------------------------------------------------

export interface SkillMetadata {
  author: string;
  createdAt: string;       // ISO-8601
  updatedAt: string;
  tags: string[];
  attribution: string;
  license: string;
}

// ---------------------------------------------------------------------------
// Execution results
// ---------------------------------------------------------------------------

export interface SkillResult {
  skillId: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled' | 'error';
  output?: Record<string, unknown>;
  error?: SkillError;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  cached: boolean;
  executionCount: number;
}

export interface SkillError {
  code: string;
  message: string;
  cause?: string;
  stack?: string;
}

// ---------------------------------------------------------------------------
// Workflow / composition
// ---------------------------------------------------------------------------

export interface WorkflowStep {
  /** Sequential index in the workflow */
  stepNumber: number;
  skillId: string;
  /** Which output fields to pass as which input fields of the next step */
  dataFlow: DataFlow[];
  /** Run after which step(s) — empty = after the previous step */
  afterStep: number[];
  /** Run in parallel with these step numbers */
  parallelWith: number[];
  /** Condition: step runs only when this expression is truthy */
  condition?: string;
}

export interface DataFlow {
  from: string;   // skillId or "input" (workflow input)
  fromOutput: string;
  toInput: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  inputs: SkillInput[];
  outputs: SkillOutput[];
  entryStep: number;
  version: string;
  metadata: SkillMetadata;
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface SkillMetrics {
  skillId: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  avgDurationMs: number;
  p95DurationMs: number;
  lastExecutedAt: string;
  successRate: number;
  errorBreakdown: Record<string, number>;
  dailyHistory: DailyMetrics[];
}

export interface DailyMetrics {
  date: string;
  executions: number;
  successes: number;
  failures: number;
  avgDurationMs: number;
}

// ---------------------------------------------------------------------------
// Learning / recommendations
// ---------------------------------------------------------------------------

export interface SkillSuggestion {
  skillId: string;
  type: 'improvement' | 'deprecation' | 'retire' | 'promote' | 'combine';
  reason: string;
  confidence: number;  // 0..1
  action: string;
}

export interface SkillCombination {
  skillIds: string[];
  successRate: number;
  avgDurationMs: number;
  coOccurrenceCount: number;
}

// ---------------------------------------------------------------------------
// Registry queries
// ---------------------------------------------------------------------------

export interface SkillQuery {
  domain?: string;
  capability?: string;
  tag?: string;
  dependency?: string;
  text?: string;          // free-text search on name/description
  maxResults?: number;
}
