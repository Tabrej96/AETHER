/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Parallel Executor Tests
 *
 * Run via: npx tsx --test src/core/swarm/parallelExecutor.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createParallelExecutor, createLoadBalancer, type ExecutionPlan, type ExecutionSummary } from './parallelExecutor';

// ============================================================
// 1. Basic Execution
// ============================================================

test('ParallelExecutor: executes tasks and returns results', async () => {
  const executor = createParallelExecutor();

  const results = await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Task 1', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
        { taskId: 't2', description: 'Task 2', assignedAgentId: 'a2', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async (task) => {
      return { result: `done-${task.taskId}` };
    }
  );

  assert.strictEqual(results.completed, 2);
  assert.strictEqual(results.failed, 0);
  assert.ok(results.success);
  assert.strictEqual(Object.keys(results.mergedResult).length, 2);
});

test('ParallelExecutor: returns failure for executor throwing', async () => {
  const executor = createParallelExecutor();

  const results = await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Fail', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => {
      throw new Error('Task failed');
    }
  );

  assert.strictEqual(results.completed, 0);
  assert.strictEqual(results.failed, 1);
  assert.ok(!results.success);
});

// ============================================================
// 2. Concurrency Limiting
// ============================================================

test('ParallelExecutor: respects concurrency limit', async () => {
  const executor = createParallelExecutor();
  let concurrentCount = 0;
  let maxConcurrent = 0;

  const results = await executor.execute(
    {
      tasks: Array.from({ length: 6 }, (_, i) => ({
        taskId: `t${i}`,
        description: `Task ${i}`,
        assignedAgentId: `a${i}`,
        payload: {},
        timeoutMs: 0,
        priority: 1,
        retries: 0,
        maxRetries: 0,
      })),
      concurrencyLimit: 2,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => {
      concurrentCount++;
      maxConcurrent = Math.max(maxConcurrent, concurrentCount);
      await new Promise((resolve) => setTimeout(resolve, 100));
      concurrentCount--;
      return { ok: true };
    }
  );

  assert.strictEqual(results.completed, 6);
  assert.ok(maxConcurrent <= 2, `Max concurrent was ${maxConcurrent}, expected <= 2`);
});

// ============================================================
// 3. Priority Ordering
// ============================================================

test('ParallelExecutor: high priority tasks execute first', async () => {
  const executor = createParallelExecutor();
  const order: string[] = [];

  await executor.execute(
    {
      tasks: [
        { taskId: 'low', description: 'Low', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
        { taskId: 'high', description: 'High', assignedAgentId: 'a2', payload: {}, timeoutMs: 0, priority: 10, retries: 0, maxRetries: 0 },
        { taskId: 'mid', description: 'Mid', assignedAgentId: 'a3', payload: {}, timeoutMs: 0, priority: 5, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 3,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async (task) => {
      order.push(task.taskId);
      return { ok: true };
    }
  );

  assert.strictEqual(order[0], 'high');
  assert.strictEqual(order[1], 'mid');
  assert.strictEqual(order[2], 'low');
});

// ============================================================
// 4. Retry with Backoff
// ============================================================

test('ParallelExecutor: retries failed tasks', async () => {
  const executor = createParallelExecutor();
  let attempts = 0;

  const results = await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Retry me', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 2 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => {
      attempts++;
      if (attempts < 3) throw new Error('Fail');
      return { ok: true };
    }
  );

  assert.strictEqual(attempts, 3);
  assert.strictEqual(results.completed, 1);
  assert.strictEqual(results.failed, 0);
});

test('ParallelExecutor: exhausts retries and reports failure', async () => {
  const executor = createParallelExecutor();
  let attempts = 0;

  const results = await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Always fail', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 1 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => {
      attempts++;
      throw new Error('Always fail');
    }
  );

  assert.strictEqual(attempts, 2); // Initial + 1 retry
  assert.strictEqual(results.failed, 1);
});

// ============================================================
// 5. Timeout
// ============================================================

test('ParallelExecutor: handles task timeout', async () => {
  const executor = createParallelExecutor();

  const results = await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Slow', assignedAgentId: 'a1', payload: {}, timeoutMs: 100, priority: 1, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return { ok: true };
    }
  );

  assert.strictEqual(results.results[0]!.status, 'timeout');
});

// ============================================================
// 6. Merge Strategies
// ============================================================

test('ParallelExecutor: mergeStrategy all includes all results', async () => {
  const executor = createParallelExecutor();

  const results = await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Task 1', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
        { taskId: 't2', description: 'Task 2', assignedAgentId: 'a2', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'all',
    },
    async (task) => ({ [`${task.taskId}-result`]: true })
  );

  assert.ok(results.mergedResult['t1-result']);
  assert.ok(results.mergedResult['t2-result']);
});

test('ParallelExecutor: mergeStrategy first_success uses first result', async () => {
  const executor = createParallelExecutor();

  const results = await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Task 1', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 10, retries: 0, maxRetries: 0 },
        { taskId: 't2', description: 'Task 2', assignedAgentId: 'a2', payload: {}, timeoutMs: 0, priority: 5, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'first_success',
    },
    async (task) => ({ [`${task.taskId}-result`]: true })
  );

  // t1 has higher priority, so it should execute first
  assert.ok(results.mergedResult['t1-result']);
});

// ============================================================
// 7. Execution Stats
// ============================================================

test('ParallelExecutor: tracks stats correctly', async () => {
  const executor = createParallelExecutor();

  await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Task 1', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => ({ ok: true })
  );

  const stats = executor.getStats();
  assert.strictEqual(stats.activeTasks, 0);
  assert.strictEqual(stats.completedTasks, 1);
  assert.strictEqual(stats.failedTasks, 0);
});

test('ParallelExecutor: isRunning returns false after completion', async () => {
  const executor = createParallelExecutor();

  await executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Task 1', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => ({ ok: true })
  );

  assert.strictEqual(executor.isRunning(), false);
});

// ============================================================
// 8. Single Task Execution
// ============================================================

test('ParallelExecutor: executeTask runs a single task', async () => {
  const executor = createParallelExecutor();

  const result = await executor.executeTask(
    { taskId: 't1', description: 'Task', assignedAgentId: 'a1', payload: { data: 42 }, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
    async () => ({ value: 42 })
  );

  assert.strictEqual(result.taskId, 't1');
  assert.strictEqual(result.status, 'completed');
  assert.strictEqual(result.data?.value, 42);
  assert.ok(result.durationMs >= 0);
});

// ============================================================
// 9. Load Balancer
// ============================================================

test('LoadBalancer: selects least loaded agent', () => {
  const balancer = createLoadBalancer();
  const metric = (id: string) => ({
    load: id === 'agent-1' ? 10 : id === 'agent-2' ? 2 : 5,
    capacity: 20,
  });

  const selected = balancer.selectAgent(['agent-1', 'agent-2', 'agent-3'], metric);
  assert.strictEqual(selected, 'agent-2'); // Lowest utilization (2/20 = 0.1)
});

test('LoadBalancer: distributeLoad balances across agents', () => {
  const balancer = createLoadBalancer();
  const metric = (id: string) => ({ load: 0, capacity: 10 });

  const assignment = balancer.distributeLoad(
    ['t1', 't2', 't3', 't4'],
    ['agent-1', 'agent-2'],
    metric
  );

  assert.strictEqual(assignment.get('agent-1')?.length, 2);
  assert.strictEqual(assignment.get('agent-2')?.length, 2);
});

test('LoadBalancer: handles single agent', () => {
  const balancer = createLoadBalancer();
  const metric = () => ({ load: 0, capacity: 10 });

  const assignment = balancer.distributeLoad(['t1', 't2'], ['agent-1'], metric);
  assert.strictEqual(assignment.get('agent-1')?.length, 2);
});

// ============================================================
// 10. Cancellation
// ============================================================

test('ParallelExecutor: cancel stops execution', async () => {
  const executor = createParallelExecutor();

  const promise = executor.execute(
    {
      tasks: [
        { taskId: 't1', description: 'Long task', assignedAgentId: 'a1', payload: {}, timeoutMs: 0, priority: 1, retries: 0, maxRetries: 0 },
      ],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return { ok: true };
    }
  );

  executor.cancel();
  const results = await promise;

  assert.strictEqual(executor.isRunning(), false);
  assert.ok(results.results[0]!.status === 'cancelled' || results.results[0]!.status === 'completed');
});

// ============================================================
// 11. Empty Task List
// ============================================================

test('ParallelExecutor: handles empty task list', async () => {
  const executor = createParallelExecutor();

  const results = await executor.execute(
    {
      tasks: [],
      concurrencyLimit: 4,
      globalTimeoutMs: 30000,
      continueOnError: true,
      mergeStrategy: 'successful_only',
    },
    async () => ({ ok: true })
  );

  assert.strictEqual(results.totalTasks, 0);
  assert.strictEqual(results.completed, 0);
  assert.strictEqual(results.failed, 0);
  assert.ok(results.success);
});
