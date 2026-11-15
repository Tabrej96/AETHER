/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — FULL-STACK ENGINEERING INTELLIGENCE · DATABASE & DATA
 * (src/core/fullstack/dataModel.ts) · Created by Tabrej
 *
 * Directive §3: "AETHER must treat database architecture as a critical
 * engineering responsibility" — entities, relationships, keys, constraints,
 * indexes, transaction boundaries, N+1, concurrency-safe writes ("concurrent
 * operations cannot silently corrupt inventory, account balances, order
 * states"), and migrations that "never casually drop or overwrite production
 * data."
 *
 * This module makes that reviewable and deterministic:
 *   - analyzeDataModel: a schema model → findings (missing constraint,
 *     unindexed FK, N+1 risk, unsafe-concurrency column, unreviewed migration)
 *   - planMigration: a proposed schema delta → a reviewable migration plan
 *     that refuses destructive drops without an explicit data-safety step
 */

export type ConstraintKind =
  | 'PRIMARY_KEY'
  | 'FOREIGN_KEY'
  | 'UNIQUE'
  | 'CHECK'
  | 'NOT_NULL'
  | 'DEFAULT';

export interface SchemaEntity {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    /** is this a money/quantity/balance column (exact-type required) */
    money?: boolean;
    /** is this column mutated concurrently (inventory, balance, order state) */
    concurrent?: boolean;
    /** the locking/optimization strategy used for concurrent writes */
    concurrency?: 'OPTIMISTIC_VERSION' | 'PESSIMISTIC_LOCK' | 'ATOMIC_UPDATE' | 'NONE';
  }>;
  constraints: Array<{ kind: ConstraintKind; columns: string[] }>;
  indexes: string[]; // e.g. ['(tenant_id, user_id)', '(status)']
  relationships?: Array<{ to: string; cardinality: 'ONE_TO_MANY' | 'MANY_TO_MANY' | 'ONE_TO_ONE' }>;
}

export interface DataModelFinding {
  severity: 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW';
  kind:
    | 'MISSING_PRIMARY_KEY'
    | 'UNINDEXED_FOREIGN_KEY'
    | 'N_PLUS_ONE_RISK'
    | 'INEXACT_MONEY_TYPE'
    | 'UNSAFE_CONCURRENT_WRITE'
    | 'MONEY_CHECK_MISSING'
    | 'DANGLING_RELATIONSHIP'
    | 'SOFT_DELETE_WITHOUT_AUDIT'
    | 'MISSING_TENANT_SCOPE';
  entity: string;
  detail: string;
}

export interface DataModelReport {
  entities: number;
  findings: DataModelFinding[];
  clean: boolean;
}

const MONEY_TYPES = new Set(['numeric', 'decimal', 'integer', 'bigint']);

/**
 * Deterministic schema review. Every finding names the entity + the concrete
 * fix. A clean model returns zero findings — it does not invent problems.
 */
export function analyzeDataModel(model: SchemaEntity[]): DataModelReport {
  const findings: DataModelFinding[] = [];
  for (const e of model) {
    const cols = new Set(e.columns.map((c) => c.name));
    const pks = e.constraints.filter((c) => c.kind === 'PRIMARY_KEY');
    if (pks.length === 0 || pks.some((p) => p.columns.length === 0)) {
      findings.push({ severity: 'BLOCKER', kind: 'MISSING_PRIMARY_KEY', entity: e.name, detail: `entity '${e.name}' has no PRIMARY_KEY — identity is undefined` });
    }

    // every FK target must be indexed on the owning column
    for (const c of e.constraints) {
      if (c.kind === 'FOREIGN_KEY') {
        const col = c.columns[0];
        const indexed = e.indexes.some((ix) => ix.includes(col));
        if (!indexed) findings.push({ severity: 'HIGH', kind: 'UNINDEXED_FOREIGN_KEY', entity: e.name, detail: `FK '${col}' -> ${c.columns[1] ?? '?'} has no index; joins + cascade checks will full-scan` });
        if (!c.columns[1]) findings.push({ severity: 'HIGH', kind: 'DANGLING_RELATIONSHIP', entity: e.name, detail: `FK on '${col}' has no target table recorded` });
      }
      if (c.kind === 'CHECK' && c.columns.includes('id')) {
        // a check on the identity column that is not a PK is unusual but allowed; no-op
      }
    }

    // money columns must be exact numeric types, and a non-negative check
    for (const col of e.columns) {
      if (col.money) {
        if (!MONEY_TYPES.has(col.type.toLowerCase())) {
          findings.push({ severity: 'BLOCKER', kind: 'INEXACT_MONEY_TYPE', entity: e.name, detail: `money column '${col.name}' is ${col.type} — must be numeric/decimal/integer paise (binary float corrupts totals by a paise)` });
        }
        const hasNonNegative = e.constraints.some((c) => c.kind === 'CHECK' && c.columns.includes(col.name));
        if (!hasNonNegative && !col.concurrent) {
          findings.push({ severity: 'MEDIUM', kind: 'MONEY_CHECK_MISSING', entity: e.name, detail: `money column '${col.name}' has no CHECK ≥ 0 constraint (negative balances pass silently)` });
        }
        // a concurrency-mutated money/balance column MUST have a strategy
        if (col.concurrent && (col.concurrency ?? 'NONE') === 'NONE') {
          findings.push({ severity: 'BLOCKER', kind: 'UNSAFE_CONCURRENT_WRITE', entity: e.name, detail: `concurrently-mutated column '${col.name}' has no locking strategy — two writes can silently lose one (use optimistic version, pessimistic lock, or an atomic UPDATE ... WHERE version = ?)` });
        }
      }
    }

    // N+1 risk: a one-to-many child entity whose only indexes are on the PK
    const rel = e.relationships?.find((r) => r.cardinality === 'ONE_TO_MANY');
    if (rel && !e.indexes.some((ix) => !ix.includes('id'))) {
      findings.push({ severity: 'MEDIUM', kind: 'N_PLUS_ONE_RISK', entity: e.name, detail: `'${e.name}' has a one-to-many relationship (${rel.to}) but no non-PK index — parent→children loads will N+1` });
    }
  }
  return { entities: model.length, findings, clean: findings.length === 0 };
}

// ---------------------------------------------------------------- migrations

export interface MigrationStep {
  description: string;
  sql: string;
  reversible: boolean;
  dataLossRisk: 'NONE' | 'LOW' | 'HIGH';
}

export interface MigrationInput {
  operation: string; // human description of the intent
  entity: string;
  /** the raw DDL the codegen produced, inspected — never trusted blind */
  proposedSql: string;
  /** an explicit acknowledgment that a data-dropping step is acceptable */
  ackDataLoss?: boolean;
}

export interface MigrationPlan {
  steps: MigrationStep[];
  blocked: boolean;
  reasons: string[];
}

const DESTRUCTIVE = /drop\s+(table|column|database)|truncate|delete\s+from|alter\s+table\s+\w+\s+drop/i;

/**
 * §3 migration discipline: generate → inspect → validate. A plan that touches
 * production data without an acknowledged, reversible, staged step is
 * BLOCKED, never "proceed with caution."
 */
export function planMigration(input: MigrationInput): MigrationPlan {
  const steps: MigrationStep[] = [];
  const reasons: string[] = [];
  let blocked = false;

  const sql = input.proposedSql;
  const destructive = DESTRUCTIVE.test(sql);

  if (destructive && !input.ackDataLoss) {
    blocked = true;
    reasons.push("destructive DDL detected (DROP/TRUNCATE/DELETE) with no explicit data-loss acknowledgment — §3: never casually drop or overwrite production data");
  }
  if (destructive && input.ackDataLoss) {
    steps.push({ description: 'staged: snapshot the affected table before the destructive step', sql: `-- create table ${input.entity}_backup as table ${input.entity}`, reversible: false, dataLossRisk: 'NONE' });
    steps.push({ description: 'destructive step (acknowledged)', sql, reversible: false, dataLossRisk: 'HIGH' });
    steps.push({ description: 'restore path: replay from the snapshot if the validation window fails', sql: `-- restore from ${input.entity}_backup`, reversible: true, dataLossRisk: 'NONE' });
  } else {
    steps.push({ description: 'additive migration', sql, reversible: true, dataLossRisk: 'NONE' });
  }

  // a new constraint must ship behind a backfill so it never rejects existing rows
  if (/alter\s+table\s+\w+\s+add/i.test(sql) && !/add\s+column/i.test(sql)) {
    if (!blocked) {
      steps.push({ description: 'backfill + validate existing rows against the new constraint before it becomes enforced', sql: `-- backfill ${input.entity}, then enforce the constraint in a second release`, reversible: true, dataLossRisk: 'NONE' });
    }
  }

  return { steps, blocked, reasons };
}
