/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GATE 02 follow-up — DURABLE RUNTIME SESSIONS TESTS (B3)
 * (src/core/runtime/durable-sessions.test.ts)
 *
 * Proves the review finding "runtime stores sessions in memory; a restart
 * loses state" is closed: sessions + task state are journaled and a fresh
 * engine instance recovers them. A torn trailing line (crash mid-append)
 * is detected and dropped, never applied.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { AutonomousRuntimeEngine } from '../autonomousRuntime';
import { SessionJournal } from './sessionJournal';

function tmpdir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('B3: a completed session is recovered by a fresh engine instance', () => {
  const dir = tmpdir('aether-dur-');
  try {
    // Engine A: enqueue a task and run a real deterministic session.
    const engineA = new AutonomousRuntimeEngine(dir);
    const task = engineA.enqueueTask({
      title: 'Durability task',
      objective: 'Fix SQL interpolation + token-family revocation',
      priority: 90,
      repositoryId: 'repo-authn-sqli-01',
    });
    const session = engineA.executeAutonomousSession(task);
    assert.equal(session.lifecycleState, 'COMPLETED');
    assert.equal(session.verificationPassed, true);
    const sessionId = session.sessionId;

    // Engine B: brand-new instance pointed at the same journal dir — the
    // "restart". It must restore the task AND the session, with the same
    // verified state.
    const engineB = AutonomousRuntimeEngine.recoverFrom(dir);
    const recoveredSession = engineB.getSession(sessionId);
    assert.ok(recoveredSession, 'the session must be present after recovery');
    assert.equal(recoveredSession!.lifecycleState, session.lifecycleState);
    assert.equal(recoveredSession!.verificationPassed, session.verificationPassed);
    assert.equal(recoveredSession!.toolCallHistory.length, session.toolCallHistory.length);
    assert.equal(recoveredSession!.checkpoints.length, session.checkpoints.length);
    // task queue recovered with the terminal status
    const recoveredTask = engineB.getTaskQueue().find((t) => t.taskId === task.taskId);
    assert.equal(recoveredTask?.status, 'COMPLETED');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('B3: a torn final journal line is dropped, not applied', () => {
  const dir = tmpdir('aether-dur-torn-');
  try {
    const engineA = new AutonomousRuntimeEngine(dir);
    const task = engineA.enqueueTask({
      title: 'Torn task',
      objective: 'x',
      repositoryId: 'repo-authn-sqli-01',
    });
    const session = engineA.executeAutonomousSession(task);
    const journalFile = path.join(dir, 'runtime-sessions.jsonl');

    // Simulate a crash mid-append: a partial final line.
    fs.appendFileSync(journalFile, '{"kind":"session","session":{"sessionId":"PARTI', 'utf8');

    const rec = new SessionJournal(dir).recover();
    assert.equal(rec.tornLinesDropped, 1, 'the torn line must be counted, not silently lost');
    // the real, complete session is still recovered
    assert.ok(rec.sessions.has(session.sessionId));
    // and the partial fake session id is NOT present
    assert.ok(!rec.sessions.has('PARTI'));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('B3: an in-progress (paused-approval) session recovers with its gate intact', () => {
  const dir = tmpdir('aether-dur-pause-');
  try {
    const engineA = new AutonomousRuntimeEngine(dir);
    const task = engineA.enqueueTask({
      title: 'Gated task',
      objective: 'High-risk write',
      repositoryId: 'repo-authn-sqli-01',
      requireHumanApprovalForWrites: true,
    });
    const session = engineA.executeAutonomousSession(task);
    assert.equal(session.lifecycleState, 'AWAITING_HUMAN_APPROVAL');
    assert.equal(session.approvalGates.length, 1);

    const engineB = AutonomousRuntimeEngine.recoverFrom(dir);
    const restored = engineB.getSession(session.sessionId)!;
    assert.equal(restored.lifecycleState, 'AWAITING_HUMAN_APPROVAL');
    assert.equal(restored.approvalGates.length, 1, 'the pending gate must survive a restart');

    // resume AFTER the restart: approve the gate on the recovered engine
    const resumed = engineB.resolveHumanApprovalGate(restored.sessionId, restored.approvalGates[0].gateId, true, 'post-restart operator');
    assert.equal(resumed.lifecycleState, 'COMPLETED');
    assert.equal(resumed.verificationPassed, true);
    const taskAfter = engineB.getTaskQueue().find((t) => t.taskId === task.taskId)!;
    assert.equal(taskAfter.status, 'COMPLETED');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
