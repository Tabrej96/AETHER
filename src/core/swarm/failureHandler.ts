/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Failure Handler
 *
 * Retry with exponential backoff, circuit breaker pattern, graceful
 * degradation, and failure reporting for distributed agent operations.
 *
 * Architectural inspiration: AutoGen's error handling and retry patterns
 * (archived reference). AETHER-native implementation with circuit breakers.
 *
 * Usage:
 *   import {
 *     createFailureHandler,
 *     withRetry,
 *     withCircuitBreaker,
 *     type FailureHandler,
 *     type CircuitBreaker,
 *     type RetryConfig,
 *   } from './core/swarm/failureHandler';
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FailureCategory =
  | 'network'
  | 'timeout'
  | 'agent_unavailable'
  | 'model_error'
  | 'security_violation'
  | 'resource_exhausted'
  | 'unknown';

export interface FailureRecord {
  /** Unique failure id */
  id: string;
  /** Category of failure */
  category: FailureCategory;
  /** Error message */
  error: string;
  /** Agent id that failed */
  agentId?: string;
  /** Task id that failed */
  taskId?: string;
  /** Unix timestamp */
  timestamp: number;
  /** Retry count at time of failure */
  retryCount: number;
  /** Whether the failure was recovered */
  recovered: boolean;
  /** Recovery method if any */
  recoveryMethod?: string;
}

export interface RetryConfig {
  /** Maximum number of retries */
  maxRetries: number;
  /** Initial delay in ms */
  initialDelayMs: number;
  /** Maximum delay in ms */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Add jitter to delays */
  jitter: boolean;
  /** Retry on specific error categories */
  retryableCategories: FailureCategory[];
}

export interface CircuitBreakerConfig {
  /** Number of failures before opening */
  failureThreshold: number;
  /** Time in ms before attempting to close */
  recoveryTimeoutMs: number;
  /** Number of successes needed to close */
  successThreshold: number;
}

export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  totalCalls: number;
  rejectedCalls: number;
}

export interface CircuitBreaker {
  /** Execute through the circuit breaker */
  execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
  /** Current state */
  getState(): CircuitBreakerStats;
  /** Reset the breaker */
  reset(): void;
}

export interface DegradationPolicy {
  /** Agent capabilities to disable */
  disabledCapabilities: string[];
  /** Simplified processing mode */
  simplifiedMode: boolean;
  /** Fallback agent id */
  fallbackAgentId?: string;
  /** Reason for degradation */
  reason: string;
}

export interface FailureReport {
  /** Report id */
  id: string;
  /** All failures in this report */
  failures: FailureRecord[];
  /** Recovered failures */
  recovered: number;
  /** Unrecovered failures */
  unrecovered: number;
  /** Failure categories breakdown */
  categoryBreakdown: Record<FailureCategory, number>;
  /** Suggested actions */
  suggestedActions: string[];
  /** Generated at */
  generatedAt: number;
}

export interface FailureHandler {
  /** Handle a failure and decide on retry strategy */
  handleFailure(failure: FailureRecord): { retry: boolean; delayMs: number };

  /** Register a failure */
  recordFailure(failure: Omit<FailureRecord, 'id' | 'timestamp' | 'retryCount' | 'recovered'>): FailureRecord;

  /** Mark a failure as recovered */
  markRecovered(failureId: string): boolean;

  /** Get the circuit breaker for an agent */
  getCircuitBreaker(agentId: string): CircuitBreaker;

  /** Create a degradation policy */
  createDegradationPolicy(category: FailureCategory, agentId?: string): DegradationPolicy;

  /** Generate a failure report */
  generateReport(): FailureReport;

  /** Get failure statistics */
  getStats(): {
    totalFailures: number;
    recovered: number;
    unrecovered: number;
    byCategory: Record<FailureCategory, number>;
  };

  /** Clear all failure records */
  clear(): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `fail_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableCategories: ['network', 'timeout', 'agent_unavailable', 'model_error'],
};

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeoutMs: 30000,
  successThreshold: 3,
};

function categorizeError(error: unknown): FailureCategory {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('timeout') || message.includes('timed out')) return 'timeout';
  if (message.includes('network') || message.includes('econnreset') || message.includes('enotfound')) return 'network';
  if (message.includes('unavailable') || message.includes('not found')) return 'agent_unavailable';
  if (message.includes('model') || message.includes('quota') || message.includes('rate limit')) return 'model_error';
  if (message.includes('security') || message.includes('unauthorized') || message.includes('forbidden')) return 'security_violation';
  if (message.includes('memory') || message.includes('oom') || message.includes('resource')) return 'resource_exhausted';

  return 'unknown';
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  const baseDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );

  if (config.jitter) {
    const jitterAmount = baseDelay * 0.3; // ±30% jitter
    return baseDelay + (Math.random() * 2 - 1) * jitterAmount;
  }

  return baseDelay;
}

// ---------------------------------------------------------------------------
// Circuit Breaker
// ---------------------------------------------------------------------------

interface CircuitBreakerInternalState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | undefined;
  totalCalls: number;
  rejectedCalls: number;
}

function createCircuitBreaker(config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG): CircuitBreaker {
  const state: CircuitBreakerInternalState = {
    state: 'closed',
    failureCount: 0,
    successCount: 0,
    lastFailureTime: undefined,
    totalCalls: 0,
    rejectedCalls: 0,
  };

  function updateState(): void {
    if (state.state === 'open') {
      if (
        state.lastFailureTime !== undefined &&
        Date.now() - state.lastFailureTime > config.recoveryTimeoutMs
      ) {
        state.state = 'half_open';
        state.successCount = 0;
      }
    } else if (state.state === 'half_open' && state.successCount >= config.successThreshold) {
      state.state = 'closed';
      state.failureCount = 0;
    }
  }

  return {
    async execute<T>(fn: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
      updateState();

      state.totalCalls++;

      if (state.state === 'open') {
        state.rejectedCalls++;
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker is open');
      }

      try {
        const result = await fn();
        state.successCount++;

        if (state.state === 'half_open' && state.successCount >= config.successThreshold) {
          state.state = 'closed';
          state.failureCount = 0;
        }

        return result;
      } catch (err) {
        state.failureCount++;
        state.lastFailureTime = Date.now();

        if (state.failureCount >= config.failureThreshold) {
          state.state = 'open';
        }

        if (fallback) {
          try {
            return await fallback();
          } catch {
            // Fallback also failed, throw original error
          }
        }

        throw err;
      }
    },

    getState(): CircuitBreakerStats {
      updateState();
      return {
        state: state.state,
        failureCount: state.failureCount,
        successCount: state.successCount,
        lastFailureTime: state.lastFailureTime,
        totalCalls: state.totalCalls,
        rejectedCalls: state.rejectedCalls,
      };
    },

    reset(): void {
      state.state = 'closed';
      state.failureCount = 0;
      state.successCount = 0;
      state.lastFailureTime = undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// Main implementation
// ---------------------------------------------------------------------------

export function createFailureHandler(config: Partial<RetryConfig> = {}): FailureHandler {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const failures: FailureRecord[] = [];
  const circuitBreakers = new Map<string, CircuitBreaker>();
  const retryDecisions = new Map<string, { retry: boolean; delayMs: number }>();

  return {
    handleFailure(failure: FailureRecord): { retry: boolean; delayMs: number } {
      const isRetryable = retryConfig.retryableCategories.includes(failure.category);
      const hasRetriesLeft = failure.retryCount < retryConfig.maxRetries;

      const retry = isRetryable && hasRetriesLeft;
      const delayMs = retry ? calculateBackoff(failure.retryCount, retryConfig) : 0;

      const decision = { retry, delayMs };
      retryDecisions.set(failure.id, decision);

      return decision;
    },

    recordFailure(failure: Omit<FailureRecord, 'id' | 'timestamp'> & { retryCount?: number }): FailureRecord {
      const record: FailureRecord = {
        id: generateId(),
        ...failure,
        category: failure.category ?? categorizeError(failure.error),
        timestamp: Date.now(),
        retryCount: failure.retryCount ?? 0,
        recovered: false,
      };

      failures.push(record);
      this.handleFailure(record);

      // Update circuit breaker
      const agentId = failure.agentId ?? 'default';
      const breaker = this.getCircuitBreaker(agentId);
      const stats = breaker.getState();
      if (stats.state === 'open') {
        record.recoveryMethod = 'circuit_breaker_open';
      }

      return record;
    },

    markRecovered(failureId: string): boolean {
      const failure = failures.find((f) => f.id === failureId);
      if (!failure) return false;

      failure.recovered = true;
      failure.recoveryMethod = 'manual_retry';

      // Reset circuit breaker for this agent
      if (failure.agentId) {
        const breaker = circuitBreakers.get(failure.agentId);
        breaker?.reset();
      }

      return true;
    },

    getCircuitBreaker(agentId: string): CircuitBreaker {
      if (!circuitBreakers.has(agentId)) {
        circuitBreakers.set(agentId, createCircuitBreaker(DEFAULT_CIRCUIT_CONFIG));
      }
      return circuitBreakers.get(agentId)!;
    },

    createDegradationPolicy(category: FailureCategory, agentId?: string): DegradationPolicy {
      const disabledCapabilities: string[] = [];
      let simplifiedMode = false;

      switch (category) {
        case 'model_error':
          disabledCapabilities.push('llm_generation', 'code_review');
          break;
        case 'timeout':
          disabledCapabilities.push('long_running_analysis');
          break;
        case 'resource_exhausted':
          disabledCapabilities.push('parallel_execution', 'large_context');
          simplifiedMode = true;
          break;
        case 'security_violation':
          disabledCapabilities.push('file_write', 'command_execution');
          break;
        case 'agent_unavailable':
          disabledCapabilities.push('specialized_tasks');
          break;
        default:
          disabledCapabilities.push('non_critical_tasks');
      }

      return {
        disabledCapabilities,
        simplifiedMode,
        fallbackAgentId: agentId,
        reason: `Degraded due to ${category} failure${agentId ? ` on ${agentId}` : ''}`,
      };
    },

    generateReport(): FailureReport {
      const categoryBreakdown: Record<FailureCategory, number> = {
        network: 0,
        timeout: 0,
        agent_unavailable: 0,
        model_error: 0,
        security_violation: 0,
        resource_exhausted: 0,
        unknown: 0,
      };

      const suggestedActions: string[] = [];
      const recovered: FailureRecord[] = [];
      const unrecovered: FailureRecord[] = [];

      for (const failure of failures) {
        categoryBreakdown[failure.category]++;
        if (failure.recovered) {
          recovered.push(failure);
        } else {
          unrecovered.push(failure);
        }
      }

      // Generate suggestions based on failure patterns
      if (categoryBreakdown.timeout > 3) {
        suggestedActions.push('Consider increasing timeout thresholds for affected agents');
      }
      if (categoryBreakdown.network > 2) {
        suggestedActions.push('Network instability detected — check connectivity and retry settings');
      }
      if (categoryBreakdown.model_error > 2) {
        suggestedActions.push('Model errors are frequent — consider enabling fallback models');
      }
      if (categoryBreakdown.agent_unavailable > 1) {
        suggestedActions.push('Agent unavailability detected — check agent health and restart if needed');
      }
      if (categoryBreakdown.resource_exhausted > 0) {
        suggestedActions.push('Resource exhaustion — reduce concurrency or increase resource limits');
      }

      if (unrecovered.length > 0) {
        suggestedActions.push(`${unrecovered.length} failures remain unrecovered and need manual intervention`);
      }

      return {
        id: generateId(),
        failures: [...failures],
        recovered: recovered.length,
        unrecovered: unrecovered.length,
        categoryBreakdown,
        suggestedActions,
        generatedAt: Date.now(),
      };
    },

    getStats() {
      const byCategory: Record<FailureCategory, number> = {
        network: 0,
        timeout: 0,
        agent_unavailable: 0,
        model_error: 0,
        security_violation: 0,
        resource_exhausted: 0,
        unknown: 0,
      };

      for (const failure of failures) {
        byCategory[failure.category]++;
      }

      return {
        totalFailures: failures.length,
        recovered: failures.filter((f) => f.recovered).length,
        unrecovered: failures.filter((f) => !f.recovered).length,
        byCategory,
      };
    },

    clear(): void {
      failures.length = 0;
      retryDecisions.clear();
      circuitBreakers.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Utility wrappers
// ---------------------------------------------------------------------------

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const category = categorizeError(err);

      if (!retryConfig.retryableCategories.includes(category)) {
        throw err;
      }

      if (attempt < retryConfig.maxRetries) {
        const delay = calculateBackoff(attempt, retryConfig);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function withCircuitBreaker<T>(
  agentId: string,
  fn: () => Promise<T>,
  config: Partial<CircuitBreakerConfig> = {},
  fallback?: () => Promise<T>
): Promise<T> {
  const breaker = createCircuitBreaker({ ...DEFAULT_CIRCUIT_CONFIG, ...config });
  return breaker.execute(fn, fallback);
}

export function isRetryableError(error: unknown, retryableCategories: FailureCategory[] = DEFAULT_RETRY_CONFIG.retryableCategories): boolean {
  const category = categorizeError(error);
  return retryableCategories.includes(category);
}
