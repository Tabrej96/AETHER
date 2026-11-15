/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Workflow Engine Public API
 * (src/core/workflow/index.ts) · Created by Tabrej
 *
 * Barrel export for the workflow engine. Consumers should import from
 * this module rather than from individual files.
 */

// Types and interfaces.
export {
  type Workflow,
  type WorkflowStep,
  type StepExecution,
  type RetryPolicy,
  type WorkflowTrigger,
  type WorkflowMetadata,
  type WorkflowExecution,
  type ExecutionStatus,
  type StepResult,
  type ExecutionError,
  type HumanCheckpoint,
  type HumanResponse,
  type WorkflowMetrics,
  type WorkflowAuditEntry,
  type RegisteredWorkflow,
  type WorkflowEvent,
  type WorkflowEventType,
  type WorkflowEventListener,
} from './workflowEngine';

// Core engine (validators).
export { validateDAG, type ExecutionOptions, type ExecutionResult } from './workflowExecutor';
export { WorkflowExecutor } from './workflowExecutor';

// Condition evaluator.
export {
  evaluateCondition,
  shouldStepRun,
  shouldLoopTerminate,
  selectBranch,
  type ConditionResult,
} from './conditionEvaluator';

// Registry.
export { WorkflowRegistry, type RegistryOptions, type RegisteredWorkflow } from './workflowRegistry';

// Persistence.
export {
  persistExecution,
  loadExecution,
  deleteExecution,
  persistCheckpoint,
  loadCheckpoints,
  listPersistedExecutions,
  deletePersistedExecution,
} from './workflowPersistence';

// Monitor.
export { WorkflowMonitor, type AlertRule } from './workflowMonitor';
