/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Parallel Execution Engine
 *
 * Concurrent task distribution with result merging, load balancing,
 * timeout coordination, and concurrency limiting.
 *
 * Architectural inspiration: AutoGen's parallel agent execution (archived reference).
 * AETHER-native implementation with bounded concurrency and structured results.
 *
 * Usage:
 *   import {
 *     createParallelExecutor,
 *     type ParallelExecutor,
 *     type TaskInput,
 *     type TaskResult,
 *     type ExecutionPlan,
 *   } from './core/swarm/parallelExecutor';
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';

export interface TaskInput {
  /** Unique task id */
  taskId: string;
  /** Task description */
  description: string;
  /** Agent id assigned to this task */
  assignedAgentId: string;
  /** Task payload */
  payload: Record<string, unknown>;
  /** Timeout in ms (0 = no timeout) */
  timeoutMs: number;
  /** Priority (higher = runs first) */
  priority: number;
  /** Retry count */
  retries: number;
  /** Maximum retries allowed */
  maxRetries: number;
}

export interface TaskResult {
  /** Original task id */
  taskId: string;
  /** Final status */
  status: TaskStatus;
  /** Result data */
  data?: Record<string, unknown>;
  /** Error message if failed */
  error?: string;
  /** Start timestamp */
  startedAt: number;
  /** End timestamp */
  completedAt: number;
  /** Duration in ms */
  durationMs: number;
  /** Number of retries performed */
  retriesUsed: number;
}

export interface ExecutionPlan {
  /** Task inputs to execute */
  tasks: TaskInput[];
  /** Maximum concurrent tasks */
  concurrencyLimit: number;
  /** Global timeout in ms */
  globalTimeoutMs: number;
  /** Whether to continue on individual task failure */
  continueOnError: boolean;
  /** Merge strategy for results */
  mergeStrategy: 'all' | 'successful_only' | 'first_success';
}

export interface ExecutionSummary {
  /** Total tasks */
  totalTasks: number;
  /** Completed tasks */
  completed: number;
  /** Failed tasks */
  failed: number;
  /** Timed out tasks */
  timedOut: number;
  /** Cancelled tasks */
  cancelled: number;
  /** Overall success */
  success: boolean;
  /** Total duration in ms */
  totalDurationMs: number;
  /** Individual results */
  results: TaskResult[];
  /** Merged result data */
  mergedResult: Record<string, unknown>;
}

export type TaskExecutor = (task: TaskInput) => Promise<Record<string, unknown>>;

export interface ParallelExecutor {
  /** Execute a plan */
  execute(plan: ExecutionPlan, executor: TaskExecutor): Promise<ExecutionSummary>;

  /** Execute a single task */
  executeTask(task: TaskInput, executor: TaskExecutor): Promise<TaskResult>;

  /** Cancel all running tasks */
  cancel(): void;

  /** Check if execution is in progress */
  isRunning(): boolean;

  /** Get current execution stats */
  getStats(): {
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function sortByPriority<T extends { priority: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.priority - a.priority);
}

// ---------------------------------------------------------------------------
// Main implementation
// ---------------------------------------------------------------------------

export function createParallelExecutor(): ParallelExecutor {
  let running = false;
  const activeTasks = new Map<string, AbortController>();
  let completedCount = 0;
  let failedCount = 0;

  async function executeTaskWithTimeout(
    task: TaskInput,
    executor: TaskExecutor,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    const startedAt = Date.now();

    try {
      // Set up timeout if configured
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      if (task.timeoutMs > 0) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error('Task timeout')), task.timeoutMs);
        });

        const resultPromise = executor(task);
        const data = await Promise.race([resultPromise, timeoutPromise]);
        clearTimeout(timeoutHandle);

        return {
          taskId: task.taskId,
          status: 'completed',
          data,
          startedAt,
          completedAt: Date.now(),
          durationMs: Date.now() - startedAt,
          retriesUsed: task.retries,
        };
      } else {
        const data = await executor(task);
        return {
          taskId: task.taskId,
          status: 'completed',
          data,
          startedAt,
          completedAt: Date.now(),
          durationMs: Date.now() - startedAt,
          retriesUsed: task.retries,
        };
      }
    } catch (err) {
      if (signal?.aborted) {
        return {
          taskId: task.taskId,
          status: 'cancelled',
          error: 'Task was cancelled',
          startedAt,
          completedAt: Date.now(),
          durationMs: Date.now() - startedAt,
          retriesUsed: task.retries,
        };
      }

      const errorMessage = err instanceof Error ? err.message : String(err);
      const isTimeout = errorMessage === 'Task timeout';

      return {
        taskId: task.taskId,
        status: isTimeout ? 'timeout' : 'failed',
        error: errorMessage,
        startedAt,
        completedAt: Date.now(),
        durationMs: Date.now() - startedAt,
        retriesUsed: task.retries,
      };
    }
  }

  async function executeWithRetry(
    task: TaskInput,
    executor: TaskExecutor,
    signal?: AbortSignal
  ): Promise<TaskResult> {
    let currentTask = { ...task };
    let result: TaskResult;

    for (let attempt = 0; attempt <= task.maxRetries; attempt++) {
      currentTask = { ...currentTask, retries: attempt };
      result = await executeTaskWithTimeout(currentTask, executor, signal);

      if (result.status === 'completed') return result;

      // Don't retry if cancelled or max retries hit
      if (result.status === 'cancelled' || attempt >= task.maxRetries) {
        return result;
      }

      // Exponential backoff before retry
      const backoffMs = Math.min(1000 * 2 ** attempt, 10000);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    return result!;
  }

  return {
    async execute(plan: ExecutionPlan, executor: TaskExecutor): Promise<ExecutionSummary> {
      running = true;
      completedCount = 0;
      failedCount = 0;

      const globalController = new AbortController();
      const startTime = Date.now();
      const sortedTasks = sortByPriority(plan.tasks);
      const results: TaskResult[] = [];
      const successfulResults: Record<string, Record<string, unknown>> = {};
      let firstSuccess: Record<string, unknown> | undefined;

      // Process tasks in batches based on concurrency limit
      const batches: TaskInput[][] = [];
      for (let i = 0; i < sortedTasks.length; i += plan.concurrencyLimit) {
        batches.push(sortedTasks.slice(i, i + plan.concurrencyLimit));
      }

      for (const batch of batches) {
        if (globalController.signal.aborted) break;

        const batchPromises = batch.map(async (task) => {
          activeTasks.set(task.taskId, globalController);
          const result = await executeWithRetry(task, executor, globalController.signal);
          activeTasks.delete(task.taskId);

          if (result.status === 'completed') {
            completedCount++;
            if (result.data) {
              successfulResults[task.taskId] = result.data;
              if (!firstSuccess) firstSuccess = result.data;
            }
          } else {
            failedCount++;
          }

          return result;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Stop early if not continuing on error and we have a failure
        if (!plan.continueOnError && batchResults.some((r) => r.status !== 'completed')) {
          break;
        }
      }

      const totalDurationMs = Date.now() - startTime;
      running = false;

      // Build merged result
      let mergedResult: Record<string, unknown> = {};
      switch (plan.mergeStrategy) {
        case 'all':
          mergedResult = { ...successfulResults };
          break;
        case 'successful_only':
          mergedResult = { ...successfulResults };
          break;
        case 'first_success':
          mergedResult = firstSuccess ? { ...firstSuccess } : {};
          break;
      }

      const anySuccess = results.some((r) => r.status === 'completed');
      const totalFailed = results.filter((r) => r.status === 'failed' || r.status === 'timeout').length;

      return {
        totalTasks: plan.tasks.length,
        completed: completedCount,
        failed: totalFailed,
        timedOut: results.filter((r) => r.status === 'timeout').length,
        cancelled: results.filter((r) => r.status === 'cancelled').length,
        success: plan.continueOnError ? anySuccess : totalFailed === 0,
        totalDurationMs,
        results,
        mergedResult,
      };
    },

    async executeTask(task: TaskInput, executor: TaskExecutor): Promise<TaskResult> {
      return executeWithRetry(task, executor);
    },

    cancel(): void {
      for (const controller of activeTasks.values()) {
        controller.abort();
      }
      activeTasks.clear();
      running = false;
    },

    isRunning(): boolean {
      return running;
    },

    getStats() {
      return {
        activeTasks: activeTasks.size,
        completedTasks: completedCount,
        failedTasks: failedCount,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Load balancing
// ---------------------------------------------------------------------------

export type LoadMetric = (agentId: string) => { load: number; capacity: number };

export interface LoadBalancer {
  selectAgent(agentIds: string[], metric: LoadMetric): string;
  distributeLoad(
    taskIds: string[],
    agentIds: string[],
    metric: LoadMetric
  ): Map<string, string[]>;
}

export function createLoadBalancer(): LoadBalancer {
  const agentLoad = new Map<string, number>();

  return {
    selectAgent(agentIds: string[], metric: LoadMetric): string {
      let bestId = agentIds[0]!;
      let bestScore = Infinity;

      for (const id of agentIds) {
        const { load, capacity } = metric(id);
        const utilization = capacity > 0 ? load / capacity : load;
        if (utilization < bestScore) {
          bestScore = utilization;
          bestId = id;
        }
      }

      agentLoad.set(bestId, (agentLoad.get(bestId) ?? 0) + 1);
      return bestId;
    },

    distributeLoad(taskIds: string[], agentIds: string[], metric: LoadMetric): Map<string, string[]> {
      const assignment = new Map<string, string[]>();
      for (const id of agentIds) {
        assignment.set(id, []);
      }

      const sortedAgents = [...agentIds].sort((a, b) => {
        const aLoad = metric(a);
        const bLoad = metric(b);
        return (aLoad.load / aLoad.capacity) - (bLoad.load / bLoad.capacity);
      });

      for (let i = 0; i < taskIds.length; i++) {
        const agentId = sortedAgents[i % sortedAgents.length]!;
        const tasks = assignment.get(agentId) ?? [];
        tasks.push(taskIds[i]!);
        assignment.set(agentId, tasks);
      }

      return assignment;
    },
  };
}
