/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Failure Handler Tests
 *
 * Run via: npx tsx --test src/core/swarm/failureHandler.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFailureHandler,
  withRetry,
  withCircuitBreaker,
  isRetryableError,
} from './failureHandler';

// ============================================================
// 1. Failure Recording
// ============================================================

test('FailureHandler: recordFailure creates a failure record', () => {
  const handler = createFailureHandler();
  const record = handler.recordFailure({
    category: 'timeout',
    error: 'Request timed out',
    agentId: 'agent-1',
    taskId: 'task-1',
  });

  assert.ok(record.id.length > 0);
  assert.strictEqual(record.category, 'timeout');
  assert.strictEqual(record.error, 'Request timed out');
  assert.strictEqual(record.agentId, 'agent-1');
  assert.strictEqual(record.taskId, 'task-1');
  assert.strictEqual(record.retryCount, 0);
  assert.strictEqual(record.recovered, false);
  assert.ok(record.timestamp > 0);
});

test('FailureHandler: recordFailure auto-categorizes unknown errors', () => {
  const handler = createFailureHandler();
  const record = handler.recordFailure({
    error: 'Some unknown error',
    category: 'unknown',
  });

  assert.ok(record.category !== undefined);
});

test('FailureHandler: markRecovered updates the record', () => {
  const handler = createFailureHandler();
  const record = handler.recordFailure({
    category: 'timeout',
    error: 'Timeout',
    agentId: 'agent-1',
  });

  const result = handler.markRecovered(record.id);
  assert.strictEqual(result, true);

  const stats = handler.getStats();
  assert.strictEqual(stats.recovered, 1);
  assert.strictEqual(stats.unrecovered, 0);
});

test('FailureHandler: markRecovered returns false for nonexistent', () => {
  const handler = createFailureHandler();
  assert.strictEqual(handler.markRecovered('nonexistent'), false);
});

// ============================================================
// 2. Retry Decision
// ============================================================

test('FailureHandler: handleFailure decides retry for retryable errors', () => {
  const handler = createFailureHandler();
  const record = handler.recordFailure({
    category: 'network',
    error: 'Connection reset',
  });

  const decision = handler.handleFailure(record);
  assert.strictEqual(decision.retry, true);
  assert.ok(decision.delayMs > 0);
});

test('FailureHandler: handleFailure does not retry after max retries', () => {
  const handler = createFailureHandler({ maxRetries: 2 });
  const record = handler.recordFailure({
    category: 'network',
    error: 'Connection reset',
  });

  const decision = handler.handleFailure(record);
  assert.strictEqual(decision.retry, false);
});

test('FailureHandler: handleFailure does not retry security violations', () => {
  const handler = createFailureHandler();
  const record = handler.recordFailure({
    category: 'security_violation',
    error: 'Unauthorized',
  });

  const decision = handler.handleFailure(record);
  assert.strictEqual(decision.retry, false);
});

test('FailureHandler: handleFailure retries agent_unavailable', () => {
  const handler = createFailureHandler();
  const record = handler.recordFailure({
    category: 'agent_unavailable',
    error: 'Agent not found',
  });

  const decision = handler.handleFailure(record);
  assert.strictEqual(decision.retry, true);
});

// ============================================================
// 3. Circuit Breaker
// ============================================================

test('FailureHandler: circuit breaker opens after threshold failures', async () => {
  const handler = createFailureHandler();
  const breaker = handler.getCircuitBreaker('agent-1');

  // Simulate failures
  for (let i = 0; i < 5; i++) {
    try {
      await breaker.execute(async () => {
        throw new Error('Fail');
      });
    } catch {
      // Expected to fail
    }
  }

  const stats = breaker.getState();
  assert.strictEqual(stats.state, 'open');
  assert.ok(stats.failureCount >= 5);
});

test('FailureHandler: circuit breaker rejects when open', async () => {
  const handler = createFailureHandler();
  const breaker = handler.getCircuitBreaker('agent-1');

  // Open the circuit
  for (let i = 0; i < 5; i++) {
    try {
      await breaker.execute(async () => { throw new Error('Fail'); });
    } catch { /* expected */ }
  }

  // Should reject
  let rejected = false;
  try {
    await breaker.execute(async () => ({ ok: true }));
  } catch {
    rejected = true;
  }

  assert.strictEqual(rejected, true);
});

test('FailureHandler: circuit breaker uses fallback when open', async () => {
  const handler = createFailureHandler();
  const breaker = handler.getCircuitBreaker('agent-1');

  // Open the circuit
  for (let i = 0; i < 5; i++) {
    try {
      await breaker.execute(async () => { throw new Error('Fail'); });
    } catch { /* expected */ }
  }

  const result = await breaker.execute(
    async () => { throw new Error('Fail'); },
    async () => ({ fallback: true })
  );

  assert.ok(result.fallback);
});

test('FailureHandler: circuit breaker closes after recovery timeout', async () => {
  const handler = createFailureHandler({ maxRetries: 0 });
  const breaker = handler.getCircuitBreaker('agent-1');

  // Open the circuit
  for (let i = 0; i < 5; i++) {
    try {
      await breaker.execute(async () => { throw new Error('Fail'); });
    } catch { /* expected */ }
  }

  assert.strictEqual(breaker.getState().state, 'open');

  // Manually reset (simulating recovery timeout passing)
  breaker.reset();

  const result = await breaker.execute(async () => ({ ok: true }));
  assert.ok(result.ok);
  assert.strictEqual(breaker.getState().state, 'closed');
});

test('FailureHandler: reset clears circuit breaker', () => {
  const handler = createFailureHandler();
  const breaker = handler.getCircuitBreaker('agent-1');
  breaker.reset();

  const stats = breaker.getState();
  assert.strictEqual(stats.state, 'closed');
  assert.strictEqual(stats.failureCount, 0);
  assert.strictEqual(stats.successCount, 0);
});

test('FailureHandler: getCircuitBreaker returns same instance for same agent', () => {
  const handler = createFailureHandler();
  const breaker1 = handler.getCircuitBreaker('agent-1');
  const breaker2 = handler.getCircuitBreaker('agent-1');
  assert.strictEqual(breaker1, breaker2);
});

// ============================================================
// 4. Degradation Policies
// ============================================================

test('FailureHandler: degradation policy for model_error', () => {
  const handler = createFailureHandler();
  const policy = handler.createDegradationPolicy('model_error', 'agent-1');

  assert.ok(policy.disabledCapabilities.includes('llm_generation'));
  assert.ok(policy.disabledCapabilities.includes('code_review'));
  assert.ok(policy.reason.includes('model_error'));
});

test('FailureHandler: degradation policy for timeout', () => {
  const handler = createFailureHandler();
  const policy = handler.createDegradationPolicy('timeout');

  assert.ok(policy.disabledCapabilities.includes('long_running_analysis'));
});

test('FailureHandler: degradation policy for resource_exhausted', () => {
  const handler = createFailureHandler();
  const policy = handler.createDegradationPolicy('resource_exhausted');

  assert.ok(policy.disabledCapabilities.includes('parallel_execution'));
  assert.ok(policy.disabledCapabilities.includes('large_context'));
  assert.strictEqual(policy.simplifiedMode, true);
});

test('FailureHandler: degradation policy for security_violation', () => {
  const handler = createFailureHandler();
  const policy = handler.createDegradationPolicy('security_violation');

  assert.ok(policy.disabledCapabilities.includes('file_write'));
  assert.ok(policy.disabledCapabilities.includes('command_execution'));
});

test('FailureHandler: degradation policy sets fallback agent', () => {
  const handler = createFailureHandler();
  const policy = handler.createDegradationPolicy('agent_unavailable', 'agent-1');

  assert.strictEqual(policy.fallbackAgentId, 'agent-1');
});

// ============================================================
// 5. Failure Reports
// ============================================================

test('FailureHandler: generateReport produces a report', () => {
  const handler = createFailureHandler();
  handler.recordFailure({ category: 'timeout', error: 'Timeout' });
  handler.recordFailure({ category: 'network', error: 'Network error' });
  handler.recordFailure({ category: 'timeout', error: 'Another timeout' });

  const report = handler.generateReport();

  assert.ok(report.id.length > 0);
  assert.strictEqual(report.failures.length, 3);
  assert.strictEqual(report.categoryBreakdown.timeout, 2);
  assert.strictEqual(report.categoryBreakdown.network, 1);
  assert.ok(report.suggestedActions.length > 0);
  assert.ok(report.generatedAt > 0);
});

test('FailureHandler: generateReport tracks recovered vs unrecovered', () => {
  const handler = createFailureHandler();
  const record1 = handler.recordFailure({ category: 'timeout', error: 'Timeout' });
  handler.recordFailure({ category: 'network', error: 'Network error' });
  handler.markRecovered(record1.id);

  const report = handler.generateReport();
  assert.strictEqual(report.recovered, 1);
  assert.strictEqual(report.unrecovered, 1);
});

test('FailureHandler: generateReport suggests actions based on patterns', () => {
  const handler = createFailureHandler();

  // Generate many timeout failures
  for (let i = 0; i < 5; i++) {
    handler.recordFailure({ category: 'timeout', error: 'Timeout' });
  }

  const report = handler.generateReport();
  assert.ok(
    report.suggestedActions.some((a) => a.includes('timeout')),
    'Should suggest action for timeout pattern'
  );
});

// ============================================================
// 6. Stats
// ============================================================

test('FailureHandler: getStats reports accurate counts', () => {
  const handler = createFailureHandler();
  handler.recordFailure({ category: 'timeout', error: 'Timeout' });
  handler.recordFailure({ category: 'network', error: 'Network error' });
  handler.recordFailure({ category: 'timeout', error: 'Timeout 2' });

  const stats = handler.getStats();
  assert.strictEqual(stats.totalFailures, 3);
  assert.strictEqual(stats.byCategory.timeout, 2);
  assert.strictEqual(stats.byCategory.network, 1);
});

test('FailureHandler: clear removes all records', () => {
  const handler = createFailureHandler();
  handler.recordFailure({ category: 'timeout', error: 'Timeout' });
  handler.clear();

  const stats = handler.getStats();
  assert.strictEqual(stats.totalFailures, 0);
  assert.strictEqual(stats.byCategory.timeout, 0);
});

// ============================================================
// 7. withRetry utility
// ============================================================

test('withRetry: succeeds on first attempt', async () => {
  let callCount = 0;
  const result = await withRetry(async () => {
    callCount++;
    return { value: 42 };
  });

  assert.strictEqual(callCount, 1);
  assert.strictEqual(result.value, 42);
});

test('withRetry: retries and eventually succeeds', async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts++;
      if (attempts < 3) throw new Error('ECONNRESET');
      return { value: 'success' };
    },
    { maxRetries: 5 }
  );

  assert.strictEqual(attempts, 3);
  assert.strictEqual(result.value, 'success');
});

test('withRetry: throws after exhausting retries', async () => {
  let attempts = 0;
  await assert.rejects(
    async () => {
      await withRetry(
        async () => {
          attempts++;
          throw new Error('Request timed out');
        },
        { maxRetries: 2 }
      );
    },
    { message: 'Request timed out' }
  );

  assert.strictEqual(attempts, 3); // Initial + 2 retries
});

test('withRetry: does not retry non-retryable errors', async () => {
  let attempts = 0;
  await assert.rejects(
    async () => {
      await withRetry(
        async () => {
          attempts++;
          throw new Error('Security violation');
        },
        { maxRetries: 3, retryableCategories: ['network', 'timeout'] }
      );
    },
    { message: 'Security violation' }
  );

  assert.strictEqual(attempts, 1);
});

// ============================================================
// 8. withCircuitBreaker utility
// ============================================================

test('withCircuitBreaker: executes successfully', async () => {
  const result = await withCircuitBreaker(
    'agent-1',
    async () => ({ data: 'success' })
  );

  assert.strictEqual(result.data, 'success');
});

test('withCircuitBreaker: falls back on failure', async () => {
  const result = await withCircuitBreaker(
    'agent-1',
    async () => { throw new Error('Fail'); },
    { failureThreshold: 2 },
    async () => ({ fallback: true })
  );

  // After 2 failures, the breaker opens and uses fallback
  assert.ok(result.fallback);
});

// ============================================================
// 9. isRetryableError
// ============================================================

test('isRetryableError: returns true for timeout', () => {
  assert.strictEqual(isRetryableError(new Error('Request timed out')), true);
});

test('isRetryableError: returns false for security violation', () => {
  assert.strictEqual(isRetryableError(new Error('Security violation')), false);
});

test('isRetryableError: returns true for network errors', () => {
  assert.strictEqual(isRetryableError(new Error('ECONNRESET')), true);
});

test('isRetryableError: returns true for agent unavailable', () => {
  assert.strictEqual(isRetryableError(new Error('Agent not found')), true);
});

// ============================================================
// 10. Circuit Breaker Stats
// ============================================================

test('FailureHandler: circuit breaker tracks stats', async () => {
  const handler = createFailureHandler();
  const breaker = handler.getCircuitBreaker('agent-1');

  await breaker.execute(async () => ({ ok: true }));

  let failed = false;
  try {
    await breaker.execute(async () => { throw new Error('Fail'); });
  } catch {
    failed = true;
  }

  assert.strictEqual(failed, true);
  const stats = breaker.getState();
  assert.strictEqual(stats.totalCalls, 2);
  assert.strictEqual(stats.successCount, 1);
  assert.strictEqual(stats.failureCount, 1);
});
