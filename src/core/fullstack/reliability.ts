/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — FULL-STACK ENGINEERING INTELLIGENCE · RELIABILITY POLICY
 * (src/core/fullstack/reliability.ts) · Created by Tabrej
 *
 * Directive §8: "Do not assume external services always respond. Handle
 * network failures, DB outages, provider timeouts, duplicate requests,
 * partial transactions, worker crashes, interrupted jobs, delayed webhooks.
 * Avoid unlimited retries and retry storms."
 *
 * So: a ReliabilityPolicy (the retry/resilience configuration a service
 * declares) is a machine-checkable object. auditReliabilityPolicy finds the
 * defects the directive names — an unbounded retry cap, backoff without
 * jitter, a non-idempotent operation marked safe-for-retry, no circuit
 * breaker on an external call, no dead-letter path — each with a fix.
 */

export interface ReliabilityPolicy {
  serviceName: string;
  /** the operations this service exposes / calls */
  calls: Array<{
    name: string;
    target: 'EXTERNAL' | 'DATABASE' | 'QUEUE' | 'INTERNAL';
    /** idempotency: is it safe to call again after a partial failure? */
    idempotent: boolean;
    /** has an idempotency key / outbox record so duplicates are detectable */
    idempotencyKey?: boolean;
  }>;
  /** retry configuration */
  retry: {
    maxAttempts: number; // 0 = no retry
    /** is the cap bounded? (Infinity / 0-as-unbounded is the defect) */
    bounded: boolean;
    /** base delay in ms for exponential backoff */
    backoffBaseMs?: number;
    /** jitter present? (prevents thundering-herd / retry storms) */
    jitter?: boolean;
    /** overall wall-clock budget for a single logical request */
    totalBudgetMs?: number;
  };
  /** a circuit breaker sits in front of the EXTERNAL calls */
  circuitBreaker?: boolean;
  /** timeouts on every external/DB call */
  timeouts?: boolean;
  /** a dead-letter path for poison-message consumers */
  deadLetter?: boolean;
}

export interface ReliabilityFinding {
  severity: 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';
  kind:
    | 'UNBOUNDED_RETRY'
    | 'RETRY_ON_NON_IDEMPOTENT'
    | 'MISSING_IDEMPOTENCY_KEY'
    | 'BACKOFF_WITHOUT_JITTER'
    | 'NO_TOTAL_BUDGET'
    | 'EXTERNAL_WITHOUT_BREAKER'
    | 'NO_TIMEOUTS'
    | 'NO_DEAD_LETTER'
    | 'DUPLICATE_REQUEST_UNHANDLED';
  detail: string;
  fix: string;
}

export interface ReliabilityReport {
  serviceName: string;
  findings: ReliabilityFinding[];
  healthy: boolean;
}

/**
 * Deterministic policy audit. It checks the SHAPE of the configuration, not
 * the runtime — so it can be run against a PR's config and fail it before
 * merge.
 */
export function auditReliabilityPolicy(p: ReliabilityPolicy): ReliabilityReport {
  const f: ReliabilityFinding[] = [];

  if (!p.retry.bounded || p.retry.maxAttempts === Infinity || p.retry.maxAttempts <= 0 && !p.retry.bounded) {
    f.push({
      severity: 'BLOCKER',
      kind: 'UNBOUNDED_RETRY',
      detail: `retry cap is unbounded (maxAttempts=${p.retry.maxAttempts}, bounded=${p.retry.bounded})`,
      fix: 'bound every retry loop; an unbounded loop on a failing dependency becomes a retry storm that amplifies the outage',
    });
  }

  // non-idempotent operations must not be auto-retried
  for (const c of p.calls) {
    if (c.target !== 'INTERNAL' && !c.idempotent && p.retry.maxAttempts > 0) {
      f.push({
        severity: 'HIGH',
        kind: 'RETRY_ON_NON_IDEMPOTENT',
        detail: `call '${c.name}' is not idempotent but retries are enabled (${p.retry.maxAttempts}) — a retry after a partial success double-applies it`,
        fix: 'make the operation idempotent (client-generated idempotency key, or an at-most-once semantics) before auto-retrying it',
      });
    }
    if (c.idempotent && c.target === 'EXTERNAL' && c.idempotencyKey !== true) {
      f.push({
        severity: 'MEDIUM',
        kind: 'MISSING_IDEMPOTENCY_KEY',
        detail: `idempotent call '${c.name}' has no recorded idempotency key — duplicate delivery cannot be detected`,
        fix: 'generate and store a per-logical-operation idempotency key; the remote/dedup layer matches on it',
      });
    }
  }

  if (p.retry.maxAttempts > 1 && p.retry.backoffBaseMs && !p.retry.jitter) {
    f.push({
      severity: 'HIGH',
      kind: 'BACKOFF_WITHOUT_JITTER',
      detail: 'exponential backoff has no jitter — all clients retry at the same instant (thundering herd)',
      fix: 'add full jitter: delay = random(0, base * 2^attempt)',
    });
  }
  if (p.retry.maxAttempts > 0 && !p.retry.totalBudgetMs) {
    f.push({
      severity: 'MEDIUM',
      kind: 'NO_TOTAL_BUDGET',
      detail: 'retries have no wall-clock total budget — a slow dependency can hold the request open indefinitely',
      fix: 'cap the total elapsed time of all attempts together',
    });
  }
  if (p.calls.some((c) => c.target === 'EXTERNAL') && !p.circuitBreaker) {
    f.push({
      severity: 'HIGH',
      kind: 'EXTERNAL_WITHOUT_BREAKER',
      detail: 'an EXTERNAL call is present but there is no circuit breaker — a slow dependency ties up threads/connections',
      fix: 'wrap external calls in a breaker that opens after consecutive failures and fails fast while open',
    });
  }
  if (!p.timeouts) {
    f.push({
      severity: 'HIGH',
      kind: 'NO_TIMEOUTS',
      detail: 'no per-call timeouts — the directive assumes external services may never respond',
      fix: 'set an explicit timeout on every EXTERNAL, DATABASE, and QUEUE call',
    });
  }
  if (p.calls.some((c) => c.target === 'QUEUE') && !p.deadLetter) {
    f.push({
      severity: 'MEDIUM',
      kind: 'NO_DEAD_LETTER',
      detail: 'a queue consumer has no dead-letter path — a poison message loops forever',
      fix: 'after N failures route the message to a dead-letter topic and alert; never block the healthy queue on it',
    });
  }
  if (p.calls.some((c) => c.target === 'EXTERNAL' && !c.idempotent && c.idempotencyKey !== true)) {
    f.push({
      severity: 'MEDIUM',
      kind: 'DUPLICATE_REQUEST_UNHANDLED',
      detail: 'an external call has no duplicate-request handling (webhook replay / retry after timeout)',
      fix: 'the consumer must treat delivery as at-least-once and deduplicate by event id',
    });
  }

  return { serviceName: p.serviceName, findings: f, healthy: f.length === 0 };
}
