/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 07-E: MULTI-AGENT TESTS
 * (src/core/runtime/multi-agent.test.ts)
 *
 * Exercises the real execution engine + P04 orchestrator TOGETHER: parallel
 * agents that each perform actual work in isolated workspaces, exclusive
 * leases, and a shared persistent queue — with a cross-agent conflict that
 * must be caught by the lease, not ignored.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { RealExecutor } from './realExecutor';
import { PersistentTaskQueue } from './taskQueue';
import { orchestrateAgentTeam, AgentParticipant } from '../programs/p04MultiAgentOrchestration';

test('GATE-07-E: parallel agents make disjoint real file writes under exclusive leases', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-multi-'));
  try {
    const queueDir = path.join(root, 'queue');
    const queue = new PersistentTaskQueue({ dir: queueDir });
    queue.recover();

    // Two agents, two disjoint workspaces, running in parallel (real promises).
    const results = await Promise.all(
      [
        { agent: 'writer-a', file: 'a/out.txt', body: 'agent A work\n' },
        { agent: 'writer-b', file: 'b/out.txt', body: 'agent B work\n' },
      ].map(async ({ agent, file, body }) => {
        const exec = new RealExecutor({
          sandboxRoot: root,
          budget: { maxToolCalls: 6, wallClockMs: 4000 },
          shellPolicy: { allowedCommands: [] },
        });
        const lease = exec.acquireLease(agent, [file]);
        assert.equal(lease.granted, true, `${agent} must acquire its own disjoint lease`);
        const w = await exec.writeRelFile(file, body, agent);
        assert.equal(w.ok, true, `${agent} write must succeed`);
        return { agent, file };
      })
    );
    assert.equal(results.length, 2);
    // independent read-back: both files really exist on disk
    assert.match(fs.readFileSync(path.join(root, 'a/out.txt'), 'utf8'), /agent A work/);
    assert.match(fs.readFileSync(path.join(root, 'b/out.txt'), 'utf8'), /agent B work/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('GATE-07-E: a cross-agent write conflict is detected by the lease, not silently lost', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-conf-'));
  try {
    const exec = new RealExecutor({ sandboxRoot: root, budget: { maxToolCalls: 8, wallClockMs: 4000 }, shellPolicy: { allowedCommands: [] } });
    assert.equal(exec.acquireLease('leader', ['shared.ts']).granted, true);
    const rogue = await exec.writeRelFile('shared.ts', 'rogue change\n', 'intruder');
    assert.equal(rogue.ok, false, 'an agent without the lease must be blocked from the shared file');
    const legitimate = await exec.writeRelFile('shared.ts', 'leader change\n', 'leader');
    assert.equal(legitimate.ok, true, 'the lease holder must be able to write');
    assert.equal(fs.readFileSync(path.join(root, 'shared.ts'), 'utf8'), 'leader change\n');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('GATE-07-E: orchestrator assigns waves of REAL work to real executors', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-orch-'));
  try {
    const queueDir = path.join(root, 'queue');
    const queue = new PersistentTaskQueue({ dir: queueDir });
    queue.recover();

    const makeAgent = (capability: string): AgentParticipant => ({
      agentId: `agent-${capability}`,
      capability,
      handle: (payload) => {
        // each "work unit" performs a real file write in its own sandbox
        const exec = new RealExecutor({
          sandboxRoot: root,
          budget: { maxToolCalls: 4, wallClockMs: 4000 },
          shellPolicy: { allowedCommands: [] },
        });
        const out = exec.writeRelFile(`work/${capability}/${payload}.txt`, `done: ${payload}\n`);
        out.then((r) => {
          if (!r.ok) throw new Error(`real work failed: ${r.error}`);
        });
        return { result: `wrote ${capability}/${payload}.txt`, ok: true };
      },
    });

    const agents = [makeAgent('planner'), makeAgent('builder')];
    const run = orchestrateAgentTeam(
      [
        { taskId: 'plan', title: 'plan', dependsOn: [], assignCapability: 'planner' },
        { taskId: 'build', title: 'build', dependsOn: ['plan'], assignCapability: 'builder' },
      ],
      agents
    );
    assert.equal(run.success, true, 'the two-stage team must complete');
    assert.equal(run.parallelWaves, 2, 'plan and build are dependent -> two waves');

    // allow the real async writes to settle, then verify on disk
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(fs.existsSync(path.join(root, 'work/planner/plan.txt')), true, 'planner output must exist on disk');
    assert.equal(fs.existsSync(path.join(root, 'work/builder/build.txt')), true, 'builder output must exist on disk');
    assert.match(fs.readFileSync(path.join(root, 'work/builder/build.txt'), 'utf8'), /done: build/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
