/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P18 · Workflow Engine Core Types
 * (src/core/workflow/workflowEngine.ts) · Created by Tabrej
 *
 * Directed acyclic graph (DAG) workflow definitions, execution contracts,
 * and the runtime interfaces that the executor, registry, persistence,
 * monitor, and condition evaluator all share.
 */

// ─── Workflow Definition ─────────────────────────────────────────────────────

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  metadata: WorkflowMetadata;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'task' | 'skill' | 'agent' | 'human' | 'condition' | 'parallel' | 'loop';
  /** What this step does — for 'task' it is a callable reference, for 'skill' a skill id, etc. */
  execution: StepExecution;
  /** Step ids this step depends on (edges in the DAG). Empty = entry point. */
  dependsOn: string[];
  /** JS-expression string evaluated against step results to decide if this step runs.
   *  Example: "prev.result.status === 'success'" or "loopIndex < maxIterations" */
  condition?: string;
  retryPolicy?: RetryPolicy;
  /** Wall-clock timeout in ms; undefined = no timeout. */
  timeoutMs?: number;
  /** What to do when this step fails. */
  onFailure?: 'abort' | 'skip' | 'retry' | 'fallback';
  /** Step id to execute as fallback when onFailure === 'fallback'. */
  fallbackStep?: string;
  /** For 'parallel' steps: child step ids to run concurrently. */
  parallelChildren?: string[];
  /** For 'loop' steps: the step id(s) to repeat. */
  loopBody?: string[];
  /** For 'loop' steps: the condition that terminates the loop. */
  loopCondition?: string;
  /** For 'loop' steps: maximum iterations (safety bound). */
  loopMaxIterations?: number;
}

export interface StepExecution {
  /** For 'task': a module path or callable reference string.
   *  For 'skill': the skill identifier registered in AETHER's skill registry.
   *  For 'agent': the agent name/id.
   *  For 'human': the human role / checkpoint config. */
  target: string;
  /** Parameters passed to the step at execution time. */
  input?: Record<string, unknown>;
  /** Mapping of step output keys to workflow context keys. */
  outputMapping?: Record<string, string>;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  /** 'linear' | 'exponential' */
  strategy?: 'linear' | 'exponential';
  /** Only retry on these error codes / categories. Empty = retry on any failure. */
  retryableErrors?: string[];
}

export interface WorkflowTrigger {
  type: 'manual' | 'intent' | 'event' | 'schedule' | 'webhook';
  config: Record<string, unknown>;
}

export interface WorkflowMetadata {
  domain?: string;
  tags?: string[];
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Runtime Execution State ─────────────────────────────────────────────────

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  currentStep: string | null;
  context: Record<string, unknown>;
  results: Record<string, StepResult>;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  /** Steps that have been executed in this run (for checkpointing). */
  completedSteps: string[];
  /** Error that caused the current status (if failed/cancelled). */
  error?: ExecutionError;
}

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'awaiting_human'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out';

export interface StepResult {
  stepId: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'timeout' | 'cancelled';
  output?: Record<string, unknown>;
  error?: ExecutionError;
  startedAt: Date;
  completedAt?: Date;
  attempts: number;
  /** For loop steps: which iteration this result belongs to. */
  iteration?: number;
}

export interface ExecutionError {
  code: string;
  message: string;
  stack?: string;
  /** The step id that produced this error. */
  stepId?: string;
  recoverable: boolean;
}

// ─── Human Checkpoint ────────────────────────────────────────────────────────

export interface HumanCheckpoint {
  executionId: string;
  stepId: string;
  /** Prompt / context shown to the human. */
  message: string;
  /** Options the human can choose from (if structured). */
  options?: Array<{ id: string; label: string; description?: string }>;
  /** Free-form input expected from the human. */
  inputPrompt?: string;
  /** Time the checkpoint was created. */
  createdAt: Date;
  /** Deadline for the human to respond. */
  deadlineAt?: Date;
  response?: HumanResponse;
}

export interface HumanResponse {
  /** The human's answer. */
  value: unknown;
  /** Free-text explanation, if any. */
  explanation?: string;
  /** The role / identity of the respondent. */
  respondedBy?: string;
  respondedAt: Date;
}

// ─── Monitoring / Metrics ────────────────────────────────────────────────────

export interface WorkflowMetrics {
  executionId: string;
  workflowId: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  currentStep: string | null;
  elapsedMs: number;
  /** Per-step timing breakdown. */
  stepTimings: Record<string, number>;
  status: ExecutionStatus;
  updatedAt: Date;
}

export interface WorkflowAuditEntry {
  executionId: string;
  stepId: string;
  event: 'started' | 'completed' | 'failed' | 'skipped' | 'paused' | 'resumed' | 'cancelled' | 'human_checkpoint' | 'human_resumed';
  timestamp: Date;
  details?: Record<string, unknown>;
}

// ─── Registry ────────────────────────────────────────────────────────────────

export interface RegisteredWorkflow {
  workflow: Workflow;
  registeredAt: Date;
  health: 'healthy' | 'degraded' | 'unhealthy';
  healthReason?: string;
  /** Hash of the workflow definition for change detection. */
  definitionHash: string;
  enabled: boolean;
}

// ─── Events (for pub/sub monitoring) ─────────────────────────────────────────

export type WorkflowEventType =
  | 'execution:started'
  | 'execution:completed'
  | 'execution:failed'
  | 'execution:cancelled'
  | 'execution:paused'
  | 'execution:resumed'
  | 'step:started'
  | 'step:completed'
  | 'step:failed'
  | 'step:skipped'
  | 'step:timeout'
  | 'human:checkpoint_created'
  | 'human:responded';

export interface WorkflowEvent {
  type: WorkflowEventType;
  executionId: string;
  workflowId: string;
  stepId?: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export type WorkflowEventListener = (event: WorkflowEvent) => void;
