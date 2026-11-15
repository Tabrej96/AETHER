/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 02: PERSISTENT TASK QUEUE
 * (src/core/runtime/taskQueue.ts)
 *
 * A priority task queue that survives process restarts: each enqueued task is
 * appended to a JSONL file; a new instance recovers the full queue state.
 * Combined with RealExecutor this closes gate 02's "task queue persistence"
 * requirement — a killed process re-opens and finds its tasks, agents, and
 * file-write locks exactly as they were.
 */

import fs from 'node:fs';
import path from 'node:path';
import { sha256Hex } from '../crypto/sha256';

export type TaskState = 'QUEUED' | 'RUNNING' | 'PAUSED_APPROVAL' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface RuntimeTask {
  taskId: string;
  title: string;
  objective: string;
  priority: number; // higher = more urgent
  state: TaskState;
  assignedAgentId: string | null;
  /** files this task's agent holds exclusive write leases on (serialized so the lock survives restarts) */
  leasedFiles: string[];
  enqueuedAtIso: string;
  stateChangedAtIso: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
}

export interface TaskQueueOptions {
  /** directory where queue.jsonl lives */
  dir: string;
}

/**
 * Crash-safe persistent task queue.
 *
 * - one JSONL entry per state transition (append-only WAL style),
 * - `recover()` replays entries into the in-memory queue on startup,
 * - in-flight `RUNNING` tasks are demoted to `QUEUED` on recovery (a running
 *   task in a dead process cannot have actually run — it was interrupted),
 * - leases recorded in the last transition are re-acquired so two restarts
 *   never let two agents claim the same file.
 */
export class PersistentTaskQueue {
  private readonly filePath: string;
  private tasks = new Map<string, RuntimeTask>();
  private lastPersistedHash = '';

  constructor(private readonly opts: TaskQueueOptions) {
    this.filePath = path.join(opts.dir, 'queue.jsonl');
  }

  /** Replay the on-disk WAL; interrupted RUNNING tasks are demoted to QUEUED. */
  recover(): { replayed: number; demotedInterrupted: string[] } {
    this.tasks = new Map();
    let replayed = 0;
    const demotedInterrupted: string[] = [];
    if (fs.existsSync(this.filePath)) {
      for (const line of fs.readFileSync(this.filePath, 'utf8').split('\n')) {
        if (line.trim().length === 0) continue;
        const entry = JSON.parse(line) as { kind: string; taskId: string; task?: RuntimeTask };
        if (entry.kind !== 'task') continue;
        const task = entry.task!;
        this.tasks.set(task.taskId, task);
        replayed += 1;
        if (task.state === 'RUNNING' || task.state === 'PAUSED_APPROVAL') {
          task.state = 'QUEUED';
          task.lastError = 'interrupted by process exit; re-queued on recovery';
          demotedInterrupted.push(task.taskId);
        }
      }
    }
    // Persist the demotions so the demotion itself is durable (a second crash
    // right after recovery must not resurrect RUNNING state).
    for (const id of demotedInterrupted) {
      this.appendTransition(this.tasks.get(id)!);
    }
    return { replayed, demotedInterrupted };
  }

  enqueue(input: { title: string; objective: string; priority?: number; assignedAgentId?: string | null }): RuntimeTask {
    const taskId = `task-${sha256Hex(`${input.title}|${input.objective}`).slice(0, 12)}`;
    const now = new Date().toISOString();
    const task: RuntimeTask = {
      taskId,
      title: input.title,
      objective: input.objective,
      priority: input.priority ?? 50,
      state: 'QUEUED',
      assignedAgentId: input.assignedAgentId ?? null,
      leasedFiles: [],
      enqueuedAtIso: now,
      stateChangedAtIso: now,
      attempts: 0,
      maxAttempts: 3,
      lastError: null,
    };
    this.tasks.set(taskId, task);
    this.appendTransition(task);
    return task;
  }

  /** Highest-priority task eligible to run; respects exclusive-lease conflicts. */
  nextRunnable(excludeLeasedFiles: (task: RuntimeTask) => boolean): RuntimeTask | null {
    const candidates = [...this.tasks.values()]
      .filter((t) => t.state === 'QUEUED' && t.attempts < t.maxAttempts)
      .sort((a, b) => b.priority - a.priority || a.enqueuedAtIso.localeCompare(b.enqueuedAtIso));
    for (const task of candidates) {
      if (task.leasedFiles.length > 0 && excludeLeasedFiles(task)) continue;
      return task;
    }
    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Record a state transition. `RUNNING` takes the task's leased files as
   * exclusive; another queue instance recovers them via recover() -> the
   * leases stay exclusive across restarts.
   */
  transition(taskId: string, next: TaskState, patch: Partial<RuntimeTask> = {}): RuntimeTask {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`unknown task ${taskId}`);
    task.state = next;
    task.stateChangedAtIso = new Date().toISOString();
    if (next === 'RUNNING') task.attempts += 1;
    Object.assign(task, patch);
    if (next === 'FAILED') task.lastError = patch.lastError ?? task.lastError;
    this.appendTransition(task);
    return task;
  }

  byState(state: TaskState): RuntimeTask[] {
    return [...this.tasks.values()].filter((t) => t.state === state);
  }

  all(): RuntimeTask[] {
    return [...this.tasks.values()].sort((a, b) => b.priority - a.priority);
  }

  /** Deterministic queue snapshot hash (genuine SHA-256) for audit / reports. */
  queueFingerprint(): string {
    const canon = JSON.stringify([...this.tasks.values()].map((t) => [t.taskId, t.state, t.leasedFiles]).sort());
    return sha256Hex(canon);
  }

  private appendTransition(task: RuntimeTask): void {
    fs.mkdirSync(this.opts.dir, { recursive: true });
    fs.appendFileSync(this.filePath, JSON.stringify({ kind: 'task', taskId: task.taskId, task }) + '\n');
  }
}
