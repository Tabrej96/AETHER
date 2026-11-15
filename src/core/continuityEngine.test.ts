/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the Production Continuity Engine (continuityEngine.ts)
 *
 * Inspiration: OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT)
 *              — session continuity patterns
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  ContinuityEngine,
  createZeroLossCheckpoint,
  ContinuityCheckpoint,
  ContinuityCheckpointV2,
  ContinuityState,
  ArtifactReference,
  MemoryReference,
} from './continuityEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<ContinuityState> = {}): ContinuityState {
  return {
    currentTask: 'Implement user authentication',
    completedSteps: ['Set up project structure', 'Create database schema'],
    pendingSteps: ['Write login endpoint', 'Add JWT middleware', 'Write tests'],
    agentAssignments: {
      'agent-1': 'Implement login endpoint',
      'agent-2': 'Write tests',
    },
    context: {
      branchName: 'feature/auth',
      lastCommitHash: 'abc123',
    },
    ...overrides,
  };
}

function makeArtifact(type: ArtifactReference['type'] = 'file'): ArtifactReference {
  return {
    id: `artifact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    location: '/src/auth/login.ts',
    hash: 'sha256:deadbeef1234567890abcdef',
    description: 'Login endpoint implementation',
    createdAt: new Date().toISOString(),
  };
}

function makeMemory(): MemoryReference {
  return {
    memoryId: `mem-${Date.now()}`,
    layer: 'PROJECT_MEMORY',
    relevanceScore: 0.85,
  };
}

// ─── ContinuityEngine Construction ────────────────────────────────────────────

test('ContinuityEngine: constructor creates instance', () => {
  const engine = new ContinuityEngine();
  assert.ok(engine, 'engine should be truthy');
  assert.equal(engine.isAutoCheckpointEnabled(), false, 'auto-checkpoint should be disabled by default');
});

test('ContinuityEngine: constructor accepts custom auto-checkpoint interval', () => {
  const engine = new ContinuityEngine({ autoCheckpointIntervalMinutes: 10 });
  assert.ok(engine, 'engine should be truthy');
});

// ─── createCheckpoint() ───────────────────────────────────────────────────────

test('ContinuityEngine.createCheckpoint: creates and returns checkpoint', () => {
  const engine = new ContinuityEngine();
  const checkpoint = engine.createCheckpoint('session-1', 'project-1');

  assert.ok(checkpoint.id, 'checkpoint should have id');
  assert.equal(checkpoint.sessionId, 'session-1');
  assert.equal(checkpoint.projectId, 'project-1');
  assert.ok(checkpoint.timestamp, 'checkpoint should have timestamp');
  assert.ok(checkpoint.state, 'checkpoint should have state');
  assert.ok(checkpoint.merkleStateHash, 'checkpoint should have merkleStateHash');
  assert.ok(checkpoint.compactResumeBrief.length > 0, 'checkpoint should have compactResumeBrief');
  assert.ok(checkpoint.resumePromptTokens > 0, 'checkpoint should have resumePromptTokens');
});

test('ContinuityEngine.createCheckpoint: persists to disk', () => {
  const engine = new ContinuityEngine();
  const checkpoint = engine.createCheckpoint('session-persist', 'project-persist');

  const filePath = path.join(os.homedir(), '.aether', 'checkpoints', `${checkpoint.id}.json`);
  assert.ok(fs.existsSync(filePath), `checkpoint file should exist at ${filePath}`);

  // Cleanup
  fs.unlinkSync(filePath);
});

test('ContinuityEngine.createCheckpoint: state is populated', () => {
  const engine = new ContinuityEngine();
  const checkpoint = engine.createCheckpoint('session-1', 'project-1');

  assert.ok(checkpoint.state.currentTask || checkpoint.state.currentTask === '', 'state should have currentTask');
  assert.ok(Array.isArray(checkpoint.state.completedSteps), 'state should have completedSteps');
  assert.ok(Array.isArray(checkpoint.state.pendingSteps), 'state should have pendingSteps');
  assert.ok(typeof checkpoint.state.agentAssignments === 'object', 'state should have agentAssignments');
  assert.ok(typeof checkpoint.state.context === 'object', 'state should have context');
});

test('ContinuityEngine.createCheckpoint: includes session and project in context', () => {
  const engine = new ContinuityEngine();
  const checkpoint = engine.createCheckpoint('session-ctx', 'project-ctx');

  assert.equal(checkpoint.state.context.sessionId, 'session-ctx');
  assert.equal(checkpoint.state.context.projectId, 'project-ctx');
});

// ─── createCheckpointFromState() ──────────────────────────────────────────────

test('ContinuityEngine.createCheckpointFromState: uses explicit state', () => {
  const engine = new ContinuityEngine();
  const state = makeState({ currentTask: 'Custom task' });
  const artifacts = [makeArtifact()];
  const memories = [makeMemory()];

  const checkpoint = engine.createCheckpointFromState('session-2', 'project-2', state, artifacts, memories);

  assert.equal(checkpoint.state.currentTask, 'Custom task');
  assert.equal(checkpoint.state.completedSteps.length, 2);
  assert.equal(checkpoint.state.pendingSteps.length, 3);
  assert.equal(checkpoint.artifacts.length, 1);
  assert.equal(checkpoint.memory.length, 1);
  assert.equal(checkpoint.artifacts[0].type, 'file');
  assert.equal(checkpoint.memory[0].layer, 'PROJECT_MEMORY');
});

test('ContinuityEngine.createCheckpointFromState: empty artifacts and memory by default', () => {
  const engine = new ContinuityEngine();
  const state = makeState();
  const checkpoint = engine.createCheckpointFromState('session-3', 'project-3', state);

  assert.equal(checkpoint.artifacts.length, 0);
  assert.equal(checkpoint.memory.length, 0);
});

// ─── restoreCheckpoint() ──────────────────────────────────────────────────────

test('ContinuityEngine.restoreCheckpoint: restores from in-memory', () => {
  const engine = new ContinuityEngine();
  const created = engine.createCheckpoint('session-restore', 'project-restore');

  const restored = engine.restoreCheckpoint(created.id);
  assert.ok(restored, 'restored state should not be null');
  assert.deepEqual(restored?.completedSteps, created.state.completedSteps);
  assert.deepEqual(restored?.pendingSteps, created.state.pendingSteps);
});

test('ContinuityEngine.restoreCheckpoint: restores from disk', () => {
  const engine = new ContinuityEngine();
  const created = engine.createCheckpoint('session-disk', 'project-disk');

  // Create a new engine instance (in-memory cache is empty)
  const engine2 = new ContinuityEngine();
  const restored = engine2.restoreCheckpoint(created.id);

  assert.ok(restored, 'should restore from disk');
  assert.deepEqual(restored?.completedSteps, created.state.completedSteps);
  assert.deepEqual(restored?.pendingSteps, created.state.pendingSteps);
  assert.equal(restored?.currentTask, created.state.currentTask);
});

test('ContinuityEngine.restoreCheckpoint: returns null for unknown checkpoint', () => {
  const engine = new ContinuityEngine();
  const result = engine.restoreCheckpoint('nonexistent-checkpoint-id');
  assert.equal(result, null);
});

test('ContinuityEngine.restoreCheckpoint: returns a copy, not the original reference', () => {
  const engine = new ContinuityEngine();
  const created = engine.createCheckpoint('session-copy', 'project-copy');

  const restored = engine.restoreCheckpoint(created.id);
  assert.ok(restored, 'restored should exist');
  assert.notEqual(restored, created.state, 'should return a copy, not the same reference');
});

// ─── listCheckpoints() ────────────────────────────────────────────────────────

test('ContinuityEngine.listCheckpoints: returns checkpoints for project', () => {
  const engine = new ContinuityEngine();
  engine.createCheckpoint('session-a', 'project-list');
  engine.createCheckpoint('session-b', 'project-list');
  engine.createCheckpoint('session-c', 'project-other');

  const checkpoints = engine.listCheckpoints('project-list');
  assert.equal(checkpoints.length, 2, 'should have 2 checkpoints for project-list');
  for (const c of checkpoints) {
    assert.equal(c.projectId, 'project-list');
  }
});

test('ContinuityEngine.listCheckpoints: returns empty for project with no checkpoints', () => {
  const engine = new ContinuityEngine();
  const checkpoints = engine.listCheckpoints('nonexistent-project');
  assert.equal(checkpoints.length, 0);
});

test('ContinuityEngine.listCheckpoints: ordered newest first', () => {
  const engine = new ContinuityEngine();
  const cp1 = engine.createCheckpoint('session-old', 'project-order');
  // Small delay to ensure different timestamps
  const cp2 = engine.createCheckpoint('session-new', 'project-order');

  const checkpoints = engine.listCheckpoints('project-order');
  assert.ok(checkpoints.length >= 2);
  // Most recent should be first
  assert.ok(checkpoints[0].timestamp >= checkpoints[1].timestamp, 'should be ordered newest first');
});

// ─── resume() ─────────────────────────────────────────────────────────────────

test('ContinuityEngine.resume: restores state from checkpoint', () => {
  const engine = new ContinuityEngine();
  const created = engine.createCheckpoint('session-resume', 'project-resume');

  const state = engine.resume(created.id);
  assert.ok(state, 'resumed state should not be null');
  assert.deepEqual(state?.completedSteps, created.state.completedSteps);
});

test('ContinuityEngine.resume: returns null for unknown checkpoint', () => {
  const engine = new ContinuityEngine();
  const state = engine.resume('nonexistent-id');
  assert.equal(state, null);
});

test('ContinuityEngine.resumeLatest: resumes from latest checkpoint', () => {
  const engine = new ContinuityEngine();
  engine.createCheckpoint('session-old2', 'project-latest');
  const latest = engine.createCheckpoint('session-latest', 'project-latest');

  const state = engine.resumeLatest('project-latest');
  assert.ok(state, 'should resume latest');
  assert.deepEqual(state?.completedSteps, latest.state.completedSteps);
});

test('ContinuityEngine.resumeLatest: returns null for project with no checkpoints', () => {
  const engine = new ContinuityEngine();
  const state = engine.resumeLatest('no-checkpoints-project');
  assert.equal(state, null);
});

// ─── getCheckpoint() ──────────────────────────────────────────────────────────

test('ContinuityEngine.getCheckpoint: retrieves from memory', () => {
  const engine = new ContinuityEngine();
  const created = engine.createCheckpoint('session-get', 'project-get');

  const checkpoint = engine.getCheckpoint(created.id);
  assert.ok(checkpoint, 'should find checkpoint');
  assert.equal(checkpoint.id, created.id);
  assert.equal(checkpoint.sessionId, 'session-get');
});

test('ContinuityEngine.getCheckpoint: retrieves from disk for new engine', () => {
  const engine = new ContinuityEngine();
  const created = engine.createCheckpoint('session-disk-get', 'project-disk-get');

  const engine2 = new ContinuityEngine();
  const checkpoint = engine2.getCheckpoint(created.id);
  assert.ok(checkpoint, 'should load from disk');
  assert.equal(checkpoint.sessionId, 'session-disk-get');
});

// ─── deleteCheckpoint() ───────────────────────────────────────────────────────

test('ContinuityEngine.deleteCheckpoint: removes from memory and disk', () => {
  const engine = new ContinuityEngine();
  const created = engine.createCheckpoint('session-del', 'project-del');

  const filePath = path.join(os.homedir(), '.aether', 'checkpoints', `${created.id}.json`);
  assert.ok(fs.existsSync(filePath), 'file should exist before delete');

  const deleted = engine.deleteCheckpoint(created.id);
  assert.ok(deleted, 'delete should return true');
  assert.ok(!fs.existsSync(filePath), 'file should be removed from disk');
});

test('ContinuityEngine.deleteCheckpoint: returns false for nonexistent checkpoint', () => {
  const engine = new ContinuityEngine();
  const deleted = engine.deleteCheckpoint('nonexistent-delete-id');
  assert.equal(deleted, false);
});

// ─── Auto-Checkpoint ──────────────────────────────────────────────────────────

test('ContinuityEngine: auto-checkpoint disabled by default', () => {
  const engine = new ContinuityEngine();
  assert.equal(engine.isAutoCheckpointEnabled(), false);
});

test('ContinuityEngine: enableAutoCheckpoint starts timer', () => {
  const engine = new ContinuityEngine();
  engine.enableAutoCheckpoint(5);
  assert.equal(engine.isAutoCheckpointEnabled(), true);
  engine.disableAutoCheckpoint();
});

test('ContinuityEngine: disableAutoCheckpoint stops timer', () => {
  const engine = new ContinuityEngine();
  engine.enableAutoCheckpoint(5);
  engine.disableAutoCheckpoint();
  assert.equal(engine.isAutoCheckpointEnabled(), false);
});

test('ContinuityEngine: enableAutoCheckpoint with custom interval', () => {
  const engine = new ContinuityEngine();
  engine.enableAutoCheckpoint(30); // 30 minutes
  assert.equal(engine.isAutoCheckpointEnabled(), true);
  engine.disableAutoCheckpoint();
});

// ─── Checkpoint Integrity ─────────────────────────────────────────────────────

test('ContinuityEngine: checkpoint merkle hash changes with state', () => {
  const engine = new ContinuityEngine();
  const state1 = makeState({ currentTask: 'Task A' });
  const state2 = makeState({ currentTask: 'Task B' });

  const cp1 = engine.createCheckpointFromState('session-hash', 'project-hash', state1);
  const cp2 = engine.createCheckpointFromState('session-hash2', 'project-hash', state2);

  assert.notEqual(cp1.merkleStateHash, cp2.merkleStateHash, 'different states should produce different hashes');
});

test('ContinuityEngine: same state produces same merkle hash', () => {
  const engine = new ContinuityEngine();
  const state = makeState({ currentTask: 'Identical task' });

  const cp1 = engine.createCheckpointFromState('session-same1', 'project-same', state);
  const cp2 = engine.createCheckpointFromState('session-same2', 'project-same', state);

  assert.equal(cp1.merkleStateHash, cp2.merkleStateHash, 'identical states should produce same hash');
});

test('ContinuityEngine: checkpoint ID is unique', () => {
  const engine = new ContinuityEngine();
  const cp1 = engine.createCheckpoint('session-uid-1', 'project-uid');
  const cp2 = engine.createCheckpoint('session-uid-2', 'project-uid');

  assert.notEqual(cp1.id, cp2.id, 'checkpoint IDs should be unique');
});

test('ContinuityEngine: compactResumeBrief is non-empty', () => {
  const engine = new ContinuityEngine();
  const checkpoint = engine.createCheckpoint('session-brief', 'project-brief');

  assert.ok(checkpoint.compactResumeBrief.length > 0, 'compactResumeBrief should not be empty');
  assert.ok(checkpoint.compactResumeBrief.includes('AETHER CONTINUITY RESUME'), 'should contain resume header');
  assert.ok(checkpoint.compactResumeBrief.includes(checkpoint.id), 'should contain checkpoint ID');
});

test('ContinuityEngine: resumePromptTokens is proportional to brief length', () => {
  const engine = new ContinuityEngine();
  const checkpoint = engine.createCheckpoint('session-tokens', 'project-tokens');

  const expectedTokens = Math.ceil(checkpoint.compactResumeBrief.length / 3.8);
  assert.equal(checkpoint.resumePromptTokens, expectedTokens);
});

// ─── Multiple Engines Independence ───────────────────────────────────────────

test('ContinuityEngine: multiple engines are independent', () => {
  const engine1 = new ContinuityEngine();
  const engine2 = new ContinuityEngine();

  engine1.createCheckpoint('session-ind-1', 'project-ind');
  engine2.createCheckpoint('session-ind-2', 'project-ind');

  const list1 = engine1.listCheckpoints('project-ind');
  const list2 = engine2.listCheckpoints('project-ind');

  assert.equal(list1.length, 1, 'engine1 should have 1 checkpoint');
  assert.equal(list2.length, 1, 'engine2 should have 1 checkpoint');
  assert.equal(list1[0].sessionId, 'session-ind-1');
  assert.equal(list2[0].sessionId, 'session-ind-2');
});

// ─── State Capture on Second Checkpoint ───────────────────────────────────────

test('ContinuityEngine: second checkpoint captures updated state', () => {
  const engine = new ContinuityEngine();
  const cp1 = engine.createCheckpoint('session-update', 'project-update');

  // Simulate state update by directly creating a checkpoint with different state
  const updatedState: ContinuityState = {
    currentTask: 'Write login endpoint',
    completedSteps: ['Set up project structure', 'Create database schema', 'Write login endpoint'],
    pendingSteps: ['Add JWT middleware', 'Write tests'],
    agentAssignments: {
      'agent-1': 'Implement login endpoint',
      'agent-2': 'Write tests',
      'agent-3': 'Add JWT middleware',
    },
    context: {
      branchName: 'feature/auth',
      lastCommitHash: 'def456',
    },
  };

  const cp2 = engine.createCheckpointFromState('session-update', 'project-update', updatedState);

  assert.equal(cp2.state.completedSteps.length, 3, 'second checkpoint should have updated completed steps');
  assert.equal(cp2.state.pendingSteps.length, 2, 'second checkpoint should have updated pending steps');
});

// ─── Artifacts & Memory References ───────────────────────────────────────────

test('ContinuityEngine: supports multiple artifact types', () => {
  const engine = new ContinuityEngine();
  const artifacts: ArtifactReference[] = [
    { id: 'art-1', type: 'file', location: '/src/auth.ts', hash: 'abc', description: 'Auth file', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'art-2', type: 'database_record', location: 'users:1', hash: 'def', description: 'User record', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'art-3', type: 'model_output', location: 'response-42', hash: 'ghi', description: 'LLM response', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'art-4', type: 'api_response', location: 'https://api.example.com/data', hash: 'jkl', description: 'API data', createdAt: '2024-01-01T00:00:00Z' },
    { id: 'art-5', type: 'config', location: '/config/auth.json', hash: 'mno', description: 'Auth config', createdAt: '2024-01-01T00:00:00Z' },
  ];

  const state = makeState();
  const checkpoint = engine.createCheckpointFromState('session-art', 'project-art', state, artifacts, []);

  assert.equal(checkpoint.artifacts.length, 5);
  for (const artifact of checkpoint.artifacts) {
    assert.ok(artifact.id, 'artifact should have id');
    assert.ok(artifact.location, 'artifact should have location');
    assert.ok(artifact.hash, 'artifact should have hash');
  }
});

test('ContinuityEngine: memory references are preserved', () => {
  const engine = new ContinuityEngine();
  const memories: MemoryReference[] = [
    { memoryId: 'mem-1', layer: 'SESSION_MEMORY', relevanceScore: 0.9 },
    { memoryId: 'mem-2', layer: 'PROJECT_MEMORY', relevanceScore: 0.7 },
    { memoryId: 'mem-3', layer: 'ARCHITECTURAL_MEMORY', relevanceScore: 0.95 },
  ];

  const state = makeState();
  const checkpoint = engine.createCheckpointFromState('session-mem', 'project-mem', state, [], memories);

  assert.equal(checkpoint.memory.length, 3);
  assert.equal(checkpoint.memory[0].memoryId, 'mem-1');
  assert.equal(checkpoint.memory[0].layer, 'SESSION_MEMORY');
});

// ─── Disk Persistence ─────────────────────────────────────────────────────────

test('ContinuityEngine: checkpoint file is valid JSON on disk', () => {
  const engine = new ContinuityEngine();
  const checkpoint = engine.createCheckpoint('session-json', 'project-json');

  const filePath = path.join(os.homedir(), '.aether', 'checkpoints', `${checkpoint.id}.json`);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);

  assert.equal(parsed.id, checkpoint.id);
  assert.equal(parsed.sessionId, 'session-json');
  assert.equal(parsed.projectId, 'project-json');
  assert.deepEqual(parsed.state.completedSteps, checkpoint.state.completedSteps);

  // Cleanup
  fs.unlinkSync(filePath);
});

test('ContinuityEngine: multiple checkpoints for same session', () => {
  const engine = new ContinuityEngine();
  const cp1 = engine.createCheckpoint('session-multi', 'project-multi');
  const cp2 = engine.createCheckpoint('session-multi', 'project-multi');

  assert.notEqual(cp1.id, cp2.id, 'each checkpoint should have unique ID');
  assert.equal(cp1.sessionId, cp2.sessionId, 'both should share session ID');
});

// ─── Legacy Function Compatibility ────────────────────────────────────────────

test('createZeroLossCheckpoint: returns valid checkpoint', () => {
  const checkpoint = createZeroLossCheckpoint({
    branchName: 'main',
    interruptionReason: 'CONTEXT_WINDOW_EXHAUSTION',
    completedStages: ['stage-1', 'stage-2'],
    pendingStages: ['stage-3'],
    activeFileLeases: ['/src/auth.ts'],
    falsifiedHypotheses: ['Hypothesis A'],
    verifiedInvariants: ['Invariant 1'],
  });

  assert.ok(checkpoint.checkpointId, 'should have checkpointId');
  assert.ok(checkpoint.merkleStateHash, 'should have merkleStateHash');
  assert.equal(checkpoint.branchName, 'main');
  assert.equal(checkpoint.interruptionReason, 'CONTEXT_WINDOW_EXHAUSTION');
  assert.deepEqual(checkpoint.completedStages, ['stage-1', 'stage-2']);
  assert.deepEqual(checkpoint.pendingStages, ['stage-3']);
  assert.ok(checkpoint.compactResumeBrief.length > 0, 'should have compactResumeBrief');
  assert.ok(checkpoint.resumePromptTokens > 0, 'should have resumePromptTokens');
});

test('createZeroLossCheckpoint: empty stages produce valid output', () => {
  const checkpoint = createZeroLossCheckpoint({
    branchName: 'feature/test',
    interruptionReason: 'TERMINAL_CLOSED',
    completedStages: [],
    pendingStages: [],
    activeFileLeases: [],
    falsifiedHypotheses: [],
    verifiedInvariants: [],
  });

  assert.ok(checkpoint.checkpointId);
  assert.ok(checkpoint.compactResumeBrief.includes('None'), 'should show None for empty stages');
});

test('createZeroLossCheckpoint: different inputs produce different hashes', () => {
  const cp1 = createZeroLossCheckpoint({
    branchName: 'main',
    interruptionReason: 'CONTEXT_WINDOW_EXHAUSTION',
    completedStages: ['a'],
    pendingStages: ['b'],
    activeFileLeases: [],
    falsifiedHypotheses: [],
    verifiedInvariants: [],
  });

  const cp2 = createZeroLossCheckpoint({
    branchName: 'main',
    interruptionReason: 'API_RATE_LIMIT',
    completedStages: ['a', 'extra-stage'], // changed completedStages to affect the hash
    pendingStages: ['b'],
    activeFileLeases: [],
    falsifiedHypotheses: [],
    verifiedInvariants: [],
  });

  assert.notEqual(cp1.merkleStateHash, cp2.merkleStateHash, 'different completedStages should produce different hashes');
});

test('createZeroLossCheckpoint: hash is deterministic', () => {
  const input = {
    branchName: 'main',
    interruptionReason: 'CONTEXT_WINDOW_EXHAUSTION' as const,
    completedStages: ['a', 'b'],
    pendingStages: ['c'],
    activeFileLeases: [],
    falsifiedHypotheses: [],
    verifiedInvariants: [],
  };

  const cp1 = createZeroLossCheckpoint(input);
  const cp2 = createZeroLossCheckpoint(input);

  assert.equal(cp1.checkpointId, cp2.checkpointId, 'same input should produce same checkpoint ID');
  assert.equal(cp1.merkleStateHash, cp2.merkleStateHash, 'same input should produce same hash');
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

test('ContinuityEngine: handles empty state gracefully', () => {
  const engine = new ContinuityEngine();
  const emptyState: ContinuityState = {
    currentTask: '',
    completedSteps: [],
    pendingSteps: [],
    agentAssignments: {},
    context: {},
  };

  const checkpoint = engine.createCheckpointFromState('session-empty', 'project-empty', emptyState);
  assert.ok(checkpoint.id, 'should handle empty state');
  assert.ok(checkpoint.compactResumeBrief.length > 0, 'should still produce a resume brief');
});

test('ContinuityEngine: many checkpoints per project', () => {
  const engine = new ContinuityEngine();
  for (let i = 0; i < 50; i++) {
    engine.createCheckpoint(`session-many-${i}`, 'project-many');
  }

  const checkpoints = engine.listCheckpoints('project-many');
  assert.equal(checkpoints.length, 50, 'should track all 50 checkpoints');
});

test('ContinuityEngine: checkpoint survives engine restart (disk)', () => {
  const engine1 = new ContinuityEngine();
  const created = engine1.createCheckpoint('session-restart', 'project-restart');

  // Simulate restart by creating new engine
  const engine2 = new ContinuityEngine();
  const checkpoint = engine2.getCheckpoint(created.id);

  assert.ok(checkpoint, 'checkpoint should survive engine restart via disk');
  assert.equal(checkpoint.sessionId, 'session-restart');
  assert.equal(checkpoint.projectId, 'project-restart');
});
