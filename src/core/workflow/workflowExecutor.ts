/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Workflow Executor
 * (src/core/workflow/workflowExecutor.ts) · Created by Tabrej
 *
 * Executes AETHER workflows as directed acyclic graphs (DAGs) with:
 * - Topological ordering of steps
 * - Parallel execution of independent steps
 * - Human checkpoint support (pause / wait / resume)
 * - Failure recovery (retry / fallback / skip / abort)
 * - Conditional branching and loop iteration
 * - Timeout enforcement
 * - Cancellation support
 *
 * Lifecycle hooks allow integration with AETHER's memory, hooks, and
 * security engines.
 */

import { randomUUID } from 'node:crypto';
import type {
  Workflow,
  WorkflowStep,
  WorkflowExecution,
  StepResult,
  ExecutionStatus,
  ExecutionError,
  HumanCheckpoint,
  HumanResponse,
  RetryPolicy,
} from './workflowEngine';
import { evaluateCondition, shouldStepRun, shouldLoopTerminate, selectBranch, type ConditionResult } from './conditionEvaluator';
import { persistExecution, loadExecution, deleteExecution, persistCheckpoint, loadCheckpoints } from './workflowPersistence';
import { WorkflowMonitor, type AlertRule } from './workflowMonitor';

// ─── Lifecycle Hooks ─────────────────────────────────────────────────────────

/** Called before a step executes. Return true to allow, false to skip. */
export type PreStepHook = (step: WorkflowStep, context: Record<string, unknown>) => Promise<boolean> | boolean;

/** Called after a step completes. Can mutate the output. */
export type PostStepHook = (step: WorkflowStep, result: StepResult, context: Record<string, unknown>) =>
  Promise<StepResult> | StepResult;

/** Called when a human checkpoint is created. Should notify the human. */
export type HumanCheckpointHook = (checkpoint: HumanCheckpoint) => Promise<void> | void;

// ─── Execution Options ───────────────────────────────────────────────────────

export interface ExecutionOptions {
  /** Initial context values merged into the execution context. */
  initialContext?: Record<string, unknown>;
  /** Persist state after each step so execution survives restarts. */
  persistState?: boolean;
  /** Attempt to resume from a persisted execution with this id. */
  resumeFromId?: string;
  /** Abort the workflow if any unhandled error occurs. */
  abortOnError?: boolean;
  /** Alert rules for the monitor. */
  alertRules?: AlertRule[];
  /** Lifecycle hooks. */
  hooks?: {
    preStep?: PreStepHook;
    postStep?: PostStepHook;
    onHumanCheckpoint?: HumanCheckpointHook;
  };
  /** If set, only execute up to (and including) this step id. */
  stopAfterStepId?: string;
}

export interface ExecutionResult {
  execution: WorkflowExecution;
  /** The final status of the workflow. */
  status: ExecutionStatus;
  error?: ExecutionError;
}

// ─── DAG Validation ──────────────────────────────────────────────────────────

/** Validates that a workflow's step graph is a valid DAG (no cycles). */
export function validateDAG(steps: WorkflowStep[]): { valid: boolean; cycle?: string[]; orphans: string[] } {
  const stepIds = new Set(steps.map((s) => s.id));
  // Initialize adjacency for ALL steps first, then populate edges.
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const id of stepIds) {
    adjacency.set(id, []);
    inDegree.set(id, 0);
  }

  for (const s of steps) {
    for (const dep of s.dependsOn) {
      if (!stepIds.has(dep)) continue; // skip references to non-existent steps
      adjacency.get(dep)!.push(s.id);
      inDegree.set(s.id, (inDegree.get(s.id) ?? 0) + 1);
    }
  }

  // Kahn's algorithm for topological sort + cycle detection.
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of adjacency.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== stepIds.size) {
    const cycle = detectCycle(steps);
    return { valid: false, cycle, orphans: [] };
  }

  // Find orphan steps (not reachable from any entry point and not an entry point themselves).
  const reachable = new Set<string>();
  const queue2: string[] = sorted.filter((id) => {
    const step = steps.find((s) => s.id === id);
    return step && step.dependsOn.length === 0;
  });
  for (const start of queue2) {
    const visited = new Set<string>();
    dfsReachable(start, adjacency, visited);
    for (const v of visited) reachable.add(v);
  }

  const orphans = steps.filter((s) => !reachable.has(s.id)).map((s) => s.id);

  return { valid: true, orphans };
}

function dfsReachable(node: string, adjacency: Map<string, string[]>, visited: Set<string>): void {
  if (visited.has(node)) return;
  visited.add(node);
  for (const neighbor of adjacency.get(node) ?? []) {
    dfsReachable(neighbor, adjacency, visited);
  }
}

function detectCycle(steps: WorkflowStep[]): string[] {
  const stepIds = steps.map((s) => s.id);
  const adjacency = new Map<string, string[]>();
  // Initialize adjacency for ALL steps before populating edges.
  for (const id of stepIds) adjacency.set(id, []);
  for (const s of steps) {
    for (const dep of s.dependsOn) {
      if (stepIds.includes(dep)) {
        const neighbors = adjacency.get(dep);
        if (neighbors) neighbors.push(s.id);
      }
    }
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  const parent = new Map<string, string>();
  for (const id of stepIds) color.set(id, WHITE);

  let cycleStart = '';
  let cycleEnd = '';

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const neighbor of adjacency.get(node) ?? []) {
      if (color.get(neighbor) === GRAY) {
        cycleStart = neighbor;
        cycleEnd = node;
        return true;
      }
      if (color.get(neighbor) === WHITE) {
        parent.set(neighbor, node);
        if (dfs(neighbor)) return true;
      }
    }
    color.set(node, BLACK);
    return false;
  }

  for (const id of stepIds) {
    if (color.get(id) === WHITE) {
      if (dfs(id)) break;
    }
  }

  if (!cycleStart) return [];
  const cycle: string[] = [cycleStart];
  let current = cycleEnd;
  while (current !== cycleStart) {
    cycle.unshift(current);
    current = parent.get(current) ?? cycleStart;
  }
  cycle.unshift(cycleStart);
  return cycle;
}

// ─── Executor ────────────────────────────────────────────────────────────────

export class WorkflowExecutor {
  private monitor: WorkflowMonitor;
  private hooks: ExecutionOptions['hooks'];
  private persist: boolean;
  private cancellationToken = new Map<string, boolean>();

  constructor() {
    this.monitor = new WorkflowMonitor();
    this.hooks = undefined;
    this.persist = false;
  }

  /** Execute a workflow definition, returning the completed execution. */
  async execute(workflow: Workflow, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const opts: Required<ExecutionOptions> = {
      initialContext: options.initialContext ?? {},
      persistState: options.persistState ?? false,
      resumeFromId: options.resumeFromId ?? '',
      abortOnError: options.abortOnError ?? false,
      alertRules: options.alertRules ?? [],
      hooks: options.hooks ?? {},
      stopAfterStepId: options.stopAfterStepId ?? '',
    };

    this.hooks = opts.hooks;
    this.persist = opts.persistState;

    // Set up alert rules.
    for (const rule of opts.alertRules) this.monitor.addAlertRule(rule);

    // Validate DAG.
    const validation = validateDAG(workflow.steps);
    if (!validation.valid) {
      throw new Error(
        `Workflow "${workflow.id}" is not a valid DAG: cycle detected involving [${validation.cycle?.join(' → ')}]`
      );
    }

    // Resume or create new execution.
    let execution: WorkflowExecution;
    if (opts.resumeFromId) {
      const persisted = loadExecution(opts.resumeFromId);
      if (!persisted || persisted.workflowId !== workflow.id) {
        throw new Error(`Cannot resume: execution "${opts.resumeFromId}" not found or mismatched workflow`);
      }
      execution = persisted;
      // Restore checkpoints.
      const checkpoints = loadCheckpoints(execution.id);
      for (const cp of checkpoints) {
        execution.context[`__checkpoint_${cp.stepId}`] = cp;
      }
    } else {
      execution = {
        id: randomUUID(),
        workflowId: workflow.id,
        status: 'running',
        currentStep: null,
        context: { ...opts.initialContext },
        results: {},
        startedAt: new Date(),
        completedSteps: [],
      };
    }

    // Initialize step results for all steps.
    for (const step of workflow.steps) {
      if (!(step.id in execution.results)) {
        execution.results[step.id] = {
          stepId: step.id,
          status: 'pending',
          startedAt: new Date(),
          attempts: 0,
        };
      }
    }

    this.cancellationToken.set(execution.id, false);
    this.monitor.executionEvent('execution:started', execution.id, workflow.id);

    try {
      await this.executeSteps(workflow, execution, opts);
    } catch (err) {
      const error = this.toError(err, '__execution__');
      execution.status = 'failed';
      execution.error = error;
      execution.completedAt = new Date();
      this.monitor.executionEvent('execution:failed', execution.id, workflow.id, undefined, {
        error: error.message,
      });
    }

    if (this.persist) {
      persistExecution(execution);
    }
    this.monitor.clearExecution(execution.id);
    this.cancellationToken.delete(execution.id);

    return { execution, status: execution.status, error: execution.error };
  }

  /** Pause a running execution. */
  pause(executionId: string): void {
    this.cancellationToken.set(executionId, true);
  }

  /** Resume a paused execution by providing a human response to a checkpoint. */
  async resume(executionId: string, checkpointStepId: string, response: HumanResponse): Promise<WorkflowExecution | null> {
    // Load the persisted execution.
    const execution = loadExecution(executionId);
    if (!execution || execution.status !== 'awaiting_human') return null;

    // Find the checkpoint and update it.
    const checkpoints = loadCheckpoints(executionId);
    const checkpoint = checkpoints.find((cp) => cp.stepId === checkpointStepId);
    if (!checkpoint) return null;

    checkpoint.response = response;
    execution.context[`__checkpoint_${checkpointStepId}`] = response.value;
    execution.context[`__checkpoint_${checkpointStepId}_explanation`] = response.explanation;
    execution.status = 'running';
    execution.resumedAt = new Date();

    if (this.persist) persistExecution(execution);
    persistCheckpoint(executionId, checkpoint);

    this.monitor.executionEvent('human:responded', executionId, execution.workflowId, checkpointStepId, {
      response: response.value,
      respondedBy: response.respondedBy,
    });

    return execution;
  }

  /** Cancel a running execution. */
  cancel(executionId: string): void {
    this.cancellationToken.set(executionId, true);
  }

  /** Check if an execution has been requested to cancel. */
  private isCancelled(executionId: string): boolean {
    return this.cancellationToken.get(executionId) ?? false;
  }

  // ─── Internal Step Execution ──────────────────────────────────────────────

  private async executeSteps(
    workflow: Workflow,
    execution: WorkflowExecution,
    opts: Required<ExecutionOptions>,
  ): Promise<void> {
    const { steps } = workflow;

    // Build dependency graph.
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    const completedSteps = new Set(execution.completedSteps);
    const inProgress = new Set<string>();
    const stepResults = execution.results;

    // Get topological order (respecting loop steps).
    const topoOrder = this.getTopologicalOrder(steps);

    // Check if we're resuming — skip already-completed steps.
    const resumeIndex = topoOrder.findIndex((id) => !completedSteps.has(id));

    if (resumeIndex === -1) {
      // All steps completed.
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.currentStep = null;
      this.monitor.executionEvent('execution:completed', execution.id, workflow.id);
      return;
    }

    // Process steps in topological order, with parallel groups.
    for (let i = resumeIndex; i < topoOrder.length; i++) {
      if (this.isCancelled(execution.id)) {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
        this.monitor.executionEvent('execution:cancelled', execution.id, workflow.id);
        if (this.persist) persistExecution(execution);
        return;
      }

      const stepId = topoOrder[i];
      const step = stepMap.get(stepId)!;

      // Check stop-after condition.
      if (opts.stopAfterStepId && stepId === opts.stopAfterStepId) {
        await this.runStep(step, execution, stepResults, opts, workflow);
        execution.status = 'completed';
        execution.completedAt = new Date();
        if (this.persist) persistExecution(execution);
        this.monitor.executionEvent('execution:completed', execution.id, workflow.id);
        return;
      }

      // Evaluate condition (skip step if condition not met).
      const condResult = shouldStepRun(step, execution.context, stepId);
      if (!condResult.satisfied) {
        stepResults[stepId] = {
          stepId,
          status: 'skipped',
          startedAt: new Date(),
          completedAt: new Date(),
          attempts: 0,
        };
        execution.completedSteps.push(stepId);
        this.monitor.stepCompleted(execution.id, workflow.id, stepId, stepResults[stepId], steps.length);
        continue;
      }

      // Handle different step types.
      switch (step.type) {
        case 'parallel':
          await this.runParallelGroup(step, stepMap, execution, stepResults, opts, workflow);
          break;
        case 'loop':
          await this.runLoop(step, stepMap, execution, stepResults, opts, workflow);
          break;
        case 'condition':
          await this.runConditionBranch(step, stepMap, execution, stepResults, opts, workflow);
          break;
        default:
          await this.runStep(step, execution, stepResults, opts, workflow);
          break;
      }

      // Sync the local Set with any changes made by runStep.
      for (const id of execution.completedSteps) completedSteps.add(id);
    }

    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.currentStep = null;
    this.monitor.executionEvent('execution:completed', execution.id, workflow.id);
    if (this.persist) persistExecution(execution);
  }

  /** Execute a single step with retry, fallback, and timeout support. */
  private async runStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    stepResults: Record<string, StepResult>,
    opts: Required<ExecutionOptions>,
    workflow: Workflow,
    iteration?: number,
  ): Promise<StepResult> {
    const key = iteration !== undefined ? `${step.id}:iter:${iteration}` : step.id;
    const result: StepResult = {
      stepId: step.id,
      status: 'running',
      startedAt: new Date(),
      attempts: 0,
      iteration,
    };

    stepResults[key] = result;
    execution.currentStep = step.id;
    this.monitor.stepStarted(execution.id, workflow.id, step.id);

    // Pre-step hook.
    if (this.hooks.preStep) {
      const allowed = await this.hooks.preStep(step, execution.context);
      if (!allowed) {
        result.status = 'skipped';
        result.completedAt = new Date();
        stepResults[key] = result;
        this.monitor.stepCompleted(execution.id, workflow.id, step.id, result, workflow.steps.length);
        return result;
      }
    }

    // Human checkpoint.
    if (step.type === 'human') {
      return await this.runHumanStep(step, execution, result, opts, workflow);
    }

    // Execute with retry policy.
    const retryPolicy = step.retryPolicy ?? { maxAttempts: 1, backoffMs: 100, strategy: 'exponential' };
    const maxAttempts = step.onFailure === 'retry' ? retryPolicy.maxAttempts : 1;

    let lastError: ExecutionError | undefined;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      result.attempts = attempt;

      try {
        const output = await this.executeWithTimeout(step, execution.context, step.timeoutMs);
        result.output = output;
        result.status = 'success';
        result.completedAt = new Date();

        // Apply output mapping.
        if (step.execution.outputMapping) {
          for (const [outputKey, contextKey] of Object.entries(step.execution.outputMapping)) {
            if (output[outputKey] !== undefined) {
              execution.context[contextKey] = output[outputKey];
            }
          }
        }

        // Post-step hook.
        if (this.hooks.postStep) {
          const mutated = await this.hooks.postStep(step, result, execution.context);
          Object.assign(result, mutated);
        }

        stepResults[key] = result;
        if (iteration !== undefined) {
          if (!execution.completedSteps.includes(key)) {
            execution.completedSteps.push(key);
          }
        } else {
          if (!execution.completedSteps.includes(step.id)) {
            execution.completedSteps.push(step.id);
          }
        }
        this.monitor.stepCompleted(execution.id, workflow.id, step.id, result, workflow.steps.length);
        return result;
      } catch (err) {
        lastError = this.toError(err, step.id);
        result.error = lastError;

        // Check if error is retryable.
        if (retryPolicy.retryableErrors?.length && !retryPolicy.retryableErrors.includes(lastError.code)) {
          break;
        }

        if (attempt < maxAttempts) {
          const delay = retryPolicy.strategy === 'linear'
            ? retryPolicy.backoffMs * attempt
            : retryPolicy.backoffMs * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed — handle failure policy.
    result.status = 'failed';
    result.completedAt = new Date();

    switch (step.onFailure) {
      case 'fallback': {
        const fallbackStep = workflow.steps.find((s) => s.id === step.fallbackStep);
        if (fallbackStep) {
          execution.context['__fallback_from'] = step.id;
          const fallbackResult = await this.runStep(fallbackStep, execution, stepResults, opts, workflow, iteration);
          return fallbackResult;
        }
        // No fallback defined, treat as failure.
        break;
      }
      case 'skip': {
        result.status = 'skipped';
        execution.context[`__${step.id}_skipped_reason`] = lastError?.message;
        break;
      }
      case 'abort':
      default: {
        if (opts.abortOnError) throw new Error(`Step "${step.id}" failed: ${lastError?.message}`);
        break;
      }
    }

    stepResults[key] = result;
    if (iteration !== undefined) {
      if (!execution.completedSteps.includes(key)) {
        execution.completedSteps.push(key);
      }
    } else {
      if (!execution.completedSteps.includes(step.id)) {
        execution.completedSteps.push(step.id);
      }
    }
    this.monitor.stepCompleted(execution.id, workflow.id, step.id, result, workflow.steps.length);
    return result;
  }

  /** Execute a human checkpoint step — pauses and waits for external input. */
  private async runHumanStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    result: StepResult,
    opts: Required<ExecutionOptions>,
    workflow: Workflow,
  ): Promise<StepResult> {
    const checkpoint: HumanCheckpoint = {
      executionId: execution.id,
      stepId: step.id,
      message: (step.execution.input?.message as string) ?? `Human input required for step: ${step.name}`,
      options: step.execution.input?.options as HumanCheckpoint['options'],
      inputPrompt: step.execution.input?.inputPrompt as string | undefined,
      createdAt: new Date(),
      deadlineAt: step.execution.input?.deadlineAt
        ? new Date(step.execution.input.deadlineAt as string)
        : undefined,
    };

    // Notify via hook.
    if (opts.hooks.onHumanCheckpoint) {
      await opts.hooks.onHumanCheckpoint(checkpoint);
    }

    // Persist checkpoint.
    if (this.persist) {
      persistCheckpoint(execution.id, checkpoint);
    }

    execution.status = 'awaiting_human';
    execution.pausedAt = new Date();
    execution.context[`__checkpoint_${step.id}`] = checkpoint;

    this.monitor.executionEvent('human:checkpoint_created', execution.id, workflow.id, step.id, {
      message: checkpoint.message,
    });

    if (this.persist) persistExecution(execution);

    // Poll for human response (check every 500ms, up to deadline).
    const pollInterval = 500;
    const deadline = checkpoint.deadlineAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 day default

    while (new Date() < deadline) {
      if (this.isCancelled(execution.id)) {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
        result.status = 'cancelled';
        result.completedAt = new Date();
        if (this.persist) persistExecution(execution);
        this.monitor.stepCompleted(execution.id, workflow.id, step.id, result, workflow.steps.length);
        return result;
      }

      // Check if the checkpoint has been responded to.
      const checkpoints = loadCheckpoints(execution.id);
      const updated = checkpoints.find((cp) => cp.stepId === step.id && cp.response);
      if (updated && updated.response) {
        result.output = { value: updated.response.value, explanation: updated.response.explanation };
        result.status = 'success';
        result.completedAt = new Date();
        execution.status = 'running';
        execution.resumedAt = new Date();
        execution.completedSteps.push(step.id);
        execution.currentStep = null;
        stepResults[step.id] = result;

        this.monitor.executionEvent('human:responded', execution.id, workflow.id, step.id, {
          response: updated.response.value,
        });
        this.monitor.stepCompleted(execution.id, workflow.id, step.id, result, workflow.steps.length);
        if (this.persist) persistExecution(execution);
        return result;
      }

      await this.sleep(pollInterval);
    }

    // Timeout waiting for human.
    result.status = 'timeout';
    result.error = { code: 'HUMAN_TIMEOUT', message: `Human checkpoint "${step.id}" timed out`, stepId: step.id, recoverable: false };
    result.completedAt = new Date();
    execution.status = 'failed';
    execution.completedSteps.push(step.id);
    stepResults[step.id] = result;
    this.monitor.stepCompleted(execution.id, workflow.id, step.id, result, workflow.steps.length);
    if (this.persist) persistExecution(execution);
    return result;
  }

  /** Execute a parallel group of steps concurrently. */
  private async runParallelGroup(
    parallelStep: WorkflowStep,
    stepMap: Map<string, WorkflowStep>,
    execution: WorkflowExecution,
    stepResults: Record<string, StepResult>,
    opts: Required<ExecutionOptions>,
    workflow: Workflow,
  ): Promise<void> {
    const children = parallelStep.parallelChildren ?? [];
    execution.currentStep = parallelStep.id;

    const results = await Promise.allSettled(
      children.map(async (childId) => {
        const childStep = stepMap.get(childId);
        if (!childStep) return;
        // Check condition.
        const condResult = shouldStepRun(childStep, execution.context, childId);
        if (!condResult.satisfied) {
          stepResults[childId] = {
            stepId: childId,
            status: 'skipped',
            startedAt: new Date(),
            completedAt: new Date(),
            attempts: 0,
          };
          return;
        }
        await this.runStep(childStep, execution, stepResults, opts, workflow);
      })
    );

    // Collect any failures from parallel execution.
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 'rejected') {
        const childId = children[i];
        const childResult = stepResults[childId];
        if (childResult?.status === 'failed' && opts.abortOnError) {
          throw new Error(`Parallel step "${childId}" failed: ${childResult.error?.message}`);
        }
      }
    }

    execution.completedSteps.push(parallelStep.id);
  }

  /** Execute a loop body until the condition is met or max iterations reached. */
  private async runLoop(
    loopStep: WorkflowStep,
    stepMap: Map<string, WorkflowStep>,
    execution: WorkflowExecution,
    stepResults: Record<string, StepResult>,
    opts: Required<ExecutionOptions>,
    workflow: Workflow,
  ): Promise<void> {
    const bodyStepIds = loopStep.loopBody ?? [];
    const loopCond = loopStep.loopCondition ?? '';
    const maxIterations = loopStep.loopMaxIterations ?? 10;
    execution.currentStep = loopStep.id;

    // Initialize loop counter in context.
    if (!('__loop_iteration' in execution.context)) {
      execution.context['__loop_iteration'] = 0;
    }

    let iteration = 0;
    while (iteration < maxIterations) {
      if (this.isCancelled(execution.id)) {
        execution.status = 'cancelled';
        execution.completedAt = new Date();
        return;
      }

      // Check loop condition.
      const loopContext = { ...execution.context, loopIndex: iteration, maxIterations };
      const condResult = shouldLoopTerminate(loopCond, loopContext);
      if (condResult.satisfied) break;

      // Execute body steps in topological order.
      const bodySteps = bodyStepIds.map((id) => stepMap.get(id)).filter((s): s is WorkflowStep => s !== undefined);
      const topoBody = this.getTopologicalOrder(bodySteps);

      for (const bodyStepId of topoBody) {
        const bodyStep = stepMap.get(bodyStepId)!;
        const condResult2 = shouldStepRun(bodyStep, execution.context, bodyStepId);
        if (!condResult2.satisfied) continue;

        await this.runStep(bodyStep, execution, stepResults, opts, workflow, iteration);
      }

      execution.context['__loop_iteration'] = ++iteration;
    }

    // Store final iteration count.
    execution.context['__loop_final_iteration'] = iteration;
    execution.completedSteps.push(loopStep.id);
  }

  /** Execute a conditional branch — evaluates conditions and runs the matching branch. */
  private async runConditionBranch(
    conditionStep: WorkflowStep,
    stepMap: Map<string, WorkflowStep>,
    execution: WorkflowExecution,
    stepResults: Record<string, StepResult>,
    opts: Required<ExecutionOptions>,
    workflow: Workflow,
  ): Promise<void> {
    const branches = (conditionStep.execution.input?.branches as Array<{ condition: string; stepIds: string[] }>) ?? [];
    execution.currentStep = conditionStep.id;

    const selected = selectBranch(branches, execution.context);
    execution.context['__selected_branch'] = selected.branchIndex;

    // Execute steps in the selected branch.
    const branchSteps = selected.branch.stepIds.map((id) => stepMap.get(id)).filter((s): s is WorkflowStep => s !== undefined);
    const topoBranch = this.getTopologicalOrder(branchSteps);

    for (const branchStepId of topoBranch) {
      const branchStep = stepMap.get(branchStepId)!;
      const condResult = shouldStepRun(branchStep, execution.context, branchStepId);
      if (!condResult.satisfied) continue;
      await this.runStep(branchStep, execution, stepResults, opts, workflow);
    }

    execution.completedSteps.push(conditionStep.id);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Compute topological order using Kahn's algorithm. */
  private getTopologicalOrder(steps: WorkflowStep[]): string[] {
    const stepIds = new Set(steps.map((s) => s.id));
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const s of steps) {
      adjacency.set(s.id, []);
      inDegree.set(s.id, 0);
    }

    for (const s of steps) {
      for (const dep of s.dependsOn) {
        if (!stepIds.has(dep)) continue;
        adjacency.get(dep)!.push(s.id);
        inDegree.set(s.id, (inDegree.get(s.id) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      sorted.push(node);
      for (const neighbor of adjacency.get(node) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    return sorted;
  }

  /** Execute a step's target with timeout support. */
  private async executeWithTimeout(
    step: WorkflowStep,
    context: Record<string, unknown>,
    timeoutMs?: number,
  ): Promise<Record<string, unknown>> {
    const target = step.execution.target;
    const input = step.execution.input ?? {};

    // Resolve the target: try to require it as a module, fall back to a registered callable.
    let executor: ((input: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<unknown> | unknown) | null = null;

    try {
      // Dynamic import for local task modules.
      const mod = await import(target);
      const fn = mod.default ?? mod[step.id] ?? mod[step.name.replace(/\s+/g, '_')];
      if (typeof fn === 'function') {
        executor = fn as (input: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<unknown> | unknown;
      }
    } catch {
      // Not a module path — treat as a registered executor name or mock.
    }

    if (!executor) {
      // Fallback: simulate execution by returning the input as output.
      // In production, this would dispatch to AETHER's skill/agent runners.
      return this.mockExecute(step, input, context);
    }

    const result = executor(input, context);
    if (result instanceof Promise) {
      if (timeoutMs) {
        return (await this.withTimeout(result, timeoutMs)) as Record<string, unknown>;
      }
      return (await result) as Record<string, unknown>;
    }

    return result as Record<string, unknown>;
  }

  /** Mock execution for step types that don't have a registered runner.
   *  Returns the input wrapped with a status flag. */
  private mockExecute(
    step: WorkflowStep,
    input: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...input,
      __mock_executed: true,
      __step_type: step.type,
      __step_id: step.id,
      __context_keys: Object.keys(context),
    };
  }

  /** Wrap a promise with a timeout. */
  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Convert any error to an ExecutionError. */
  private toError(err: unknown, stepId?: string): ExecutionError {
    if (this.isExecutionError(err)) return err;
    return {
      code: err instanceof Error ? err.name : 'UNKNOWN_ERROR',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      stepId,
      recoverable: true,
    };
  }

  private isExecutionError(err: unknown): err is ExecutionError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      'message' in err &&
      'recoverable' in err
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
