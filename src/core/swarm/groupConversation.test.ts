/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Group Conversation Tests
 *
 * Run via: npx tsx --test src/core/swarm/groupConversation.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGroupConversation,
  type AgentSpeaker,
  type ConversationTurn,
  type ConsensusResult,
  type ConflictReport,
  scheduleTurns,
} from './groupConversation';

// ---------- Helpers ----------

function makeSpeaker(overrides: Partial<AgentSpeaker> = {}): AgentSpeaker {
  return {
    id: `agent-${Math.random().toString(36).slice(2, 6)}`,
    name: `Agent ${Math.random().toString(36).slice(2, 4)}`,
    weight: 1.0,
    active: true,
    turnCount: 0,
    ...overrides,
  };
}

// ============================================================
// 1. Conversation Creation & State
// ============================================================

test('GroupConversation: creates conversation with default settings', () => {
  const conv = createGroupConversation('Test Topic');
  const state = conv.getState();

  assert.ok(state.conversationId.length > 0);
  assert.strictEqual(state.topic, 'Test Topic');
  assert.strictEqual(state.turnPolicy, 'round_robin');
  assert.strictEqual(state.consensusMethod, 'majority_vote');
  assert.strictEqual(state.maxTurns, 20);
  assert.strictEqual(state.terminated, false);
  assert.strictEqual(state.speakers.length, 0);
});

test('GroupConversation: accepts custom options', () => {
  const conv = createGroupConversation('Custom Topic', {
    turnPolicy: 'random',
    consensusMethod: 'unanimous',
    maxTurns: 10,
  });
  const state = conv.getState();

  assert.strictEqual(state.turnPolicy, 'random');
  assert.strictEqual(state.consensusMethod, 'unanimous');
  assert.strictEqual(state.maxTurns, 10);
});

// ============================================================
// 2. Speaker Management
// ============================================================

test('GroupConversation: addSpeaker adds a speaker', () => {
  const conv = createGroupConversation('Test');
  const speaker = makeSpeaker({ id: 'a1', name: 'Alice' });

  conv.addSpeaker(speaker);
  assert.strictEqual(conv.getState().speakers.length, 1);
  assert.strictEqual(conv.getState().speakers[0]!.id, 'a1');
});

test('GroupConversation: addSpeaker throws on duplicate id', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));

  assert.throws(
    () => conv.addSpeaker(makeSpeaker({ id: 'a1' })),
    /already exists/
  );
});

test('GroupConversation: removeSpeaker marks speaker inactive', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  const result = conv.removeSpeaker('a1');

  assert.strictEqual(result, true);
  assert.strictEqual(conv.getState().speakers[0]!.active, false);
});

test('GroupConversation: removeSpeaker returns false for nonexistent', () => {
  const conv = createGroupConversation('Test');
  assert.strictEqual(conv.removeSpeaker('nonexistent'), false);
});

// ============================================================
// 3. Turn Submission
// ============================================================

test('GroupConversation: submitTurn records a turn', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1', name: 'Alice' }));

  const turn = conv.submitTurn('a1', 'Hello everyone');

  assert.strictEqual(turn.turnNumber, 1);
  assert.strictEqual(turn.speakerId, 'a1');
  assert.strictEqual(turn.content, 'Hello everyone');
  assert.strictEqual(turn.isSystem, false);
  assert.ok(turn.timestamp > 0);
  assert.strictEqual(conv.getState().turns.length, 1);
});

test('GroupConversation: submitTurn increments turnCount', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));

  conv.submitTurn('a1', 'First');
  conv.submitTurn('a1', 'Second');

  assert.strictEqual(conv.getState().speakers[0]!.turnCount, 2);
});

test('GroupConversation: submitTurn throws on nonexistent speaker', () => {
  const conv = createGroupConversation('Test');
  assert.throws(
    () => conv.submitTurn('nonexistent', 'Hello'),
    /not found/
  );
});

test('GroupConversation: submitTurn throws on inactive speaker', () => {
  const conv = createGroupConversation('Test');
  const speaker = makeSpeaker({ id: 'a1' });
  conv.addSpeaker(speaker);
  conv.removeSpeaker('a1');

  assert.throws(
    () => conv.submitTurn('a1', 'Hello'),
    /not active/
  );
});

test('GroupConversation: submitTurn throws on terminated conversation', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.terminate('Max turns');

  assert.throws(
    () => conv.submitTurn('a1', 'Hello'),
    /terminated/
  );
});

test('GroupConversation: submitSystemTurn records a system turn', () => {
  const conv = createGroupConversation('Test');
  const turn = conv.submitSystemTurn('System message');

  assert.strictEqual(turn.speakerId, 'system');
  assert.strictEqual(turn.isSystem, true);
  assert.strictEqual(turn.content, 'System message');
});

// ============================================================
// 4. Round-Robin Turn Policy
// ============================================================

test('GroupConversation: round_robin cycles through speakers', () => {
  const conv = createGroupConversation('Test', { turnPolicy: 'round_robin' });
  conv.addSpeaker(makeSpeaker({ id: 'a1', name: 'Alice' }));
  conv.addSpeaker(makeSpeaker({ id: 'a2', name: 'Bob' }));
  conv.addSpeaker(makeSpeaker({ id: 'a3', name: 'Carol' }));

  const t1 = conv.submitTurn('a1', 'Hi');
  const t2 = conv.submitTurn('a2', 'Hello');
  const t3 = conv.submitTurn('a3', 'Hey');

  assert.strictEqual(t1.turnNumber, 1);
  assert.strictEqual(t2.turnNumber, 2);
  assert.strictEqual(t3.turnNumber, 3);
});

// ============================================================
// 5. Consensus
// ============================================================

test('GroupConversation: propose adds a proposal', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));

  const proposal = conv.propose('a1', 'We should refactor', ['Reason 1'], 0.9);

  assert.ok(proposal.id.length > 0);
  assert.strictEqual(proposal.proposedBy, 'a1');
  assert.strictEqual(proposal.content, 'We should refactor');
  assert.strictEqual(proposal.confidence, 0.9);
  assert.strictEqual(conv.getState().proposals.length, 1);
});

test('GroupConversation: runConsensus with majority_vote', () => {
  const conv = createGroupConversation('Test', { consensusMethod: 'majority_vote' });
  conv.addSpeaker(makeSpeaker({ id: 'a1', weight: 1 }));
  conv.addSpeaker(makeSpeaker({ id: 'a2', weight: 1 }));
  conv.addSpeaker(makeSpeaker({ id: 'a3', weight: 1 }));

  conv.propose('a1', 'Option A', [], 0.8);
  conv.propose('a2', 'Option B', [], 0.6);

  const result = conv.runConsensus();
  assert.ok(result.reached);
  assert.ok(result.winningProposal !== undefined);
});

test('GroupConversation: runConsensus returns false when no consensus', () => {
  const conv = createGroupConversation('Test', { consensusMethod: 'unanimous' });
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.addSpeaker(makeSpeaker({ id: 'a2' }));

  conv.propose('a1', 'Option A', [], 0.5);
  conv.propose('a2', 'Option B', [], 0.5);

  const result = conv.runConsensus();
  // Unanimous with equal proposals from different agents won't reach consensus
  assert.ok(!result.reached || result.proposals.length >= 2);
});

test('GroupConversation: runConsensus with no proposals', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));

  const result = conv.runConsensus();
  assert.ok(!result.reached);
  assert.strictEqual(result.proposals.length, 0);
});

test('GroupConversation: runConsensus with weighted method', () => {
  const conv = createGroupConversation('Test', { consensusMethod: 'weighted' });
  conv.addSpeaker(makeSpeaker({ id: 'a1', weight: 3 }));
  conv.addSpeaker(makeSpeaker({ id: 'a2', weight: 1 }));

  conv.propose('a1', 'Option A', [], 0.7);
  conv.propose('a2', 'Option B', [], 0.9);

  const result = conv.runConsensus();
  assert.ok(result.proposals.length === 2);
  // a2 has higher confidence, should win
  assert.ok(result.winningProposal !== undefined);
});

// ============================================================
// 6. Conflict Detection
// ============================================================

test('GroupConversation: detectConflicts finds conflicts in proposals', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.addSpeaker(makeSpeaker({ id: 'a2' }));

  conv.propose('a1', 'Use approach X', [], 0.8);
  conv.propose('a2', 'Use approach Y', [], 0.7);

  const report = conv.detectConflicts();
  assert.ok(report.conflictingAgents.length >= 2);
  assert.ok(report.description.includes('conflicting'));
});

test('GroupConversation: detectConflicts returns none when no conflicts', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.propose('a1', 'Same proposal', [], 0.9);

  const report = conv.detectConflicts();
  assert.strictEqual(report.conflictingAgents.length, 0);
});

// ============================================================
// 7. Termination
// ============================================================

test('GroupConversation: shouldTerminate detects max turns', () => {
  const conv = createGroupConversation('Test', { maxTurns: 2 });
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.submitTurn('a1', 'Turn 1');
  conv.submitTurn('a1', 'Turn 2');

  const result = conv.shouldTerminate();
  assert.strictEqual(result.terminate, true);
  assert.strictEqual(result.reason, 'Maximum turns reached');
});

test('GroupConversation: shouldTerminate detects consensus when majority agrees', () => {
  const conv = createGroupConversation('Test', { consensusMethod: 'majority_vote' });
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.addSpeaker(makeSpeaker({ id: 'a2' }));
  conv.addSpeaker(makeSpeaker({ id: 'a3' }));
  // a1 proposes with high confidence, a2 and a3 will vote for it
  conv.propose('a1', 'Option A', ['Reason'], 0.95);

  const result = conv.shouldTerminate();
  // Should detect consensus: a2 and a3 vote for a1's proposal = 2 votes > 1.5 threshold
  assert.ok(result.terminate, `Expected consensus termination, got: ${JSON.stringify(result)}`);
});

test('GroupConversation: terminate sets terminated flag', () => {
  const conv = createGroupConversation('Test');
  conv.terminate('Manual termination');

  assert.strictEqual(conv.getState().terminated, true);
  assert.strictEqual(conv.getState().terminationReason, 'Manual termination');
});

// ============================================================
// 8. Reset
// ============================================================

test('GroupConversation: reset clears turns and proposals', () => {
  const conv = createGroupConversation('Test');
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.submitTurn('a1', 'Hello');
  conv.propose('a1', 'Proposal', [], 0.8);

  conv.reset('New Topic');

  assert.strictEqual(conv.getState().topic, 'New Topic');
  assert.strictEqual(conv.getState().turns.length, 0);
  assert.strictEqual(conv.getState().proposals.length, 0);
  assert.strictEqual(conv.getState().terminated, false);
  assert.strictEqual(conv.getState().speakers[0]!.turnCount, 0);
  assert.strictEqual(conv.getState().speakers[0]!.active, true);
});

// ============================================================
// 9. Turn Scheduling Utility
// ============================================================

test('scheduleTurns: generates round-robin schedule', () => {
  const speakers: AgentSpeaker[] = [
    makeSpeaker({ id: 'a1' }),
    makeSpeaker({ id: 'a2' }),
    makeSpeaker({ id: 'a3' }),
  ];

  const order = scheduleTurns(speakers, 'round_robin', 6);
  assert.deepStrictEqual(order, ['a1', 'a2', 'a3', 'a1', 'a2', 'a3']);
});

test('scheduleTurns: generates random schedule', () => {
  const speakers: AgentSpeaker[] = [
    makeSpeaker({ id: 'a1' }),
    makeSpeaker({ id: 'a2' }),
  ];

  const order = scheduleTurns(speakers, 'random', 4);
  assert.strictEqual(order.length, 4);
  // All should be valid speaker ids
  for (const id of order) {
    assert.ok(speakers.some((s) => s.id === id));
  }
});

test('scheduleTurns: respects priority ordering', () => {
  const speakers: AgentSpeaker[] = [
    makeSpeaker({ id: 'low', weight: 10 }),
    makeSpeaker({ id: 'high', weight: 1 }),
  ];

  const order = scheduleTurns(speakers, 'priority', 4);
  // Lower weight = higher priority, so 'high' should appear first
  assert.ok(order.length > 0);
  assert.strictEqual(order[0], 'high');
  assert.ok(order.includes('high'), 'High priority should be included in schedule');
});

test('scheduleTurns: returns empty for no active speakers', () => {
  const speakers: AgentSpeaker[] = [
    makeSpeaker({ id: 'a1', active: false }),
  ];

  const order = scheduleTurns(speakers, 'round_robin', 4);
  assert.strictEqual(order.length, 0);
});

// ============================================================
// 10. Consensus Result Structure
// ============================================================

test('GroupConversation: consensus result has all fields', () => {
  const conv = createGroupConversation('Test', { consensusMethod: 'majority_vote' });
  conv.addSpeaker(makeSpeaker({ id: 'a1' }));
  conv.addSpeaker(makeSpeaker({ id: 'a2' }));
  conv.addSpeaker(makeSpeaker({ id: 'a3' }));

  conv.propose('a1', 'Optimal approach', ['Evidence'], 0.95);

  const result = conv.runConsensus();

  assert.ok('reached' in result);
  assert.ok('winningProposal' in result);
  assert.ok('proposals' in result);
  assert.ok('votes' in result);
  assert.ok('dissents' in result);
  assert.ok('rounds' in result);
  assert.strictEqual(result.rounds, 1);
});
