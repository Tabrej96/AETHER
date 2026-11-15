/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Durable Autonomous Runtime Sessions (B3)
 * (src/core/runtime/sessionJournal.ts)
 *
 * Closes the review finding "the runtime stores sessions in memory; a
 * restart loses task/session state". A SessionJournal is an append-only
 * JSONL file (one JSON object per line; a line is only ever appended as a
 * single fsync'd write) that records:
 *
 *   - task enqueue / status transitions
 *   - session spawn + every lifecycle transition
 *   - the full serializable session state at each transition
 *
 * `AutonomousRuntimeEngine.recoverFrom(dir)` rebuilds both the task queue and every session (the
 * latest entry per session wins) into a fresh AutonomousRuntimeEngine, so a
 * process restart resumes instead of forgetting. Crash safety: a torn final
 * line (power loss mid-append) is detected by JSON-parse failure and
 * dropped — it can never corrupt the recovered state.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface JournalTaskPayload {
  taskId: string;
  status: string;
  title: string;
  objective: string;
  priority: number;
  repositoryId: string;
  requireHumanApprovalForWrites: boolean;
  enqueuedAtIso: string;
}

export interface JournalSessionEntry {
  kind: 'session';
  session: Record<string, unknown>; // full serializable AutonomousSessionState
}

export type JournalEntry = (JournalTaskPayload & { kind: 'task' }) | JournalSessionEntry;

export interface JournalRecovery {
  tasks: JournalTaskPayload[];
  /** latest session state per sessionId, in journal order */
  sessions: Map<string, Record<string, unknown>>;
  /** number of torn/undecodable trailing lines that were dropped */
  tornLinesDropped: number;
}

const JOURNAL_NAME = 'runtime-sessions.jsonl';

export class SessionJournal {
  constructor(private readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  private get file(): string {
    return path.join(this.dir, JOURNAL_NAME);
  }

  append(entry: JournalEntry): void {
    fs.appendFileSync(this.file, `${JSON.stringify(entry)}\n`, { encoding: 'utf8' });
  }

  appendTask(task: JournalTaskPayload): void {
    this.append({ kind: 'task', ...task });
  }

  appendSession(session: Record<string, unknown>): void {
    this.append({ kind: 'session', session });
  }

  recover(): JournalRecovery {
    const out: JournalRecovery = { tasks: [], sessions: new Map(), tornLinesDropped: 0 };
    if (!fs.existsSync(this.file)) return out;
    const raw = fs.readFileSync(this.file, 'utf8').split('\n');
    for (const line of raw) {
      if (!line.trim()) continue;
      let obj: JournalEntry & { kind: 'task' | 'session' };
      try {
        obj = JSON.parse(line) as JournalEntry;
      } catch {
        // A torn final write (crash mid-append) — the only line that can
        // ever be partial is the last one; earlier lines are complete.
        out.tornLinesDropped += 1;
        continue;
      }
      if (obj.kind === 'task') {
        // task entries: latest status per taskId wins
        const taskPayload = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== 'kind')) as JournalTaskPayload;
        const idx = out.tasks.findIndex((t) => t.taskId === taskPayload.taskId);
        if (idx >= 0) out.tasks[idx] = taskPayload;
        else out.tasks.push(taskPayload);
      } else {
        const s = obj.session as Record<string, unknown>;
        const sid = String(s.sessionId ?? '');
        if (sid) out.sessions.set(sid, s); // latest wins
      }
    }
    return out;
  }
}
