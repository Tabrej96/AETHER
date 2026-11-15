/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Workflow State Persistence
 * (src/core/workflow/workflowPersistence.ts) · Created by Tabrej
 *
 * Persists workflow execution state to disk (JSON files) so that
 * executions can survive process restarts and be resumed from the
 * last checkpoint.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { WorkflowExecution, HumanCheckpoint } from './workflowEngine';

const PERSIST_DIR = '.aether/workflow-state';

/** Ensure the persistence directory exists. */
function ensureDir(): void {
  const full = path.resolve(PERSIST_DIR);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
}

/** Serialize a Date to ISO string. */
function dateStr(d?: Date): string | undefined {
  return d?.toISOString();
}

/** Deserialize an ISO string to Date. */
function fromDateStr(s?: string): Date | undefined {
  return s ? new Date(s) : undefined;
}

/** Persist a workflow execution to disk. */
export function persistExecution(execution: WorkflowExecution): void {
  ensureDir();
  const filePath = path.resolve(PERSIST_DIR, `${execution.id}.json`);
  const payload = {
    ...execution,
    startedAt: dateStr(execution.startedAt),
    completedAt: dateStr(execution.completedAt),
    pausedAt: dateStr(execution.pausedAt),
    resumedAt: dateStr(execution.resumedAt),
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
}

/** Load a workflow execution from disk by execution id. */
export function loadExecution(executionId: string): WorkflowExecution | null {
  const filePath = path.resolve(PERSIST_DIR, `${executionId}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw) as Omit<WorkflowExecution, 'startedAt' | 'completedAt' | 'pausedAt' | 'resumedAt'> & {
      startedAt: string;
      completedAt?: string;
      pausedAt?: string;
      resumedAt?: string;
    };
    return {
      ...data,
      startedAt: new Date(data.startedAt),
      completedAt: fromDateStr(data.completedAt),
      pausedAt: fromDateStr(data.pausedAt),
      resumedAt: fromDateStr(data.resumedAt),
    };
  } catch {
    return null;
  }
}

/** Delete a persisted execution. */
export function deleteExecution(executionId: string): boolean {
  const filePath = path.resolve(PERSIST_DIR, `${executionId}.json`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

/** Persist a human checkpoint to disk. */
export function persistCheckpoint(executionId: string, checkpoint: HumanCheckpoint): void {
  ensureDir();
  const dir = path.resolve(PERSIST_DIR, executionId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `checkpoint-${checkpoint.stepId}.json`);
  const payload = {
    ...checkpoint,
    createdAt: dateStr(checkpoint.createdAt),
    deadlineAt: dateStr(checkpoint.deadlineAt),
    response: checkpoint.response
      ? {
          ...checkpoint.response,
          respondedAt: dateStr(checkpoint.response.respondedAt),
        }
      : undefined,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
}

/** Load all persisted checkpoints for an execution. */
export function loadCheckpoints(executionId: string): HumanCheckpoint[] {
  const dir = path.resolve(PERSIST_DIR, executionId);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.startsWith('checkpoint-') && f.endsWith('.json'));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
    const data = JSON.parse(raw) as Omit<HumanCheckpoint, 'createdAt' | 'deadlineAt' | 'response'> & {
      createdAt: string;
      deadlineAt?: string;
      response?: { respondedAt: string; [k: string]: unknown };
    };
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      deadlineAt: fromDateStr(data.deadlineAt),
      response: data.response
        ? {
            ...data.response,
            respondedAt: new Date(data.response.respondedAt),
          }
        : undefined,
    };
  });
}

/** List all execution ids that have persisted state. */
export function listPersistedExecutions(): string[] {
  ensureDir();
  const full = path.resolve(PERSIST_DIR);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''));
}

/** Delete all persisted state for an execution (execution + checkpoints). */
export function deletePersistedExecution(executionId: string): void {
  deleteExecution(executionId);
  const dir = path.resolve(PERSIST_DIR, executionId);
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const f of files) fs.unlinkSync(path.join(dir, f));
    fs.rmdirSync(dir);
  }
}
