/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Group Conversation Manager
 *
 * Multi-agent dialogue coordination with turn-taking logic, consensus
 * mechanisms, and conflict resolution.
 *
 * Architectural inspiration: AutoGen's GroupChat manager pattern (archived reference).
 * AETHER-native implementation with structured turn-taking and consensus.
 *
 * Usage:
 *   import {
 *     createGroupConversation,
 *     type GroupConversation,
 *     type ConversationTurn,
 *     type ConsensusResult,
 *   } from './core/swarm/groupConversation';
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TurnPolicy = 'round_robin' | 'random' | 'priority' | 'speaker_select';

export type ConsensusMethod = 'majority_vote' | 'unanimous' | 'weighted' | 'first_valid';

export interface AgentSpeaker {
  /** Agent id */
  id: string;
  /** Display name */
  name: string;
  /** Weight for weighted consensus */
  weight: number;
  /** Whether the agent is still active in the conversation */
  active: boolean;
  /** Number of turns taken */
  turnCount: number;
}

export interface ConversationTurn {
  /** Turn number (1-based) */
  turnNumber: number;
  /** Speaker agent id */
  speakerId: string;
  /** Turn content */
  content: string;
  /** Unix timestamp */
  timestamp: number;
  /** Correlated message id (if any) */
  messageId?: string;
  /** Whether this turn was a system turn */
  isSystem: boolean;
}

export interface ConsensusProposal {
  /** Proposal id */
  id: string;
  /** Proposing agent id */
  proposedBy: string;
  /** Proposal content */
  content: string;
  /** Supporting evidence */
  evidence: string[];
  /** Confident level */
  confidence: number;
  /** Unix timestamp */
  timestamp: number;
}

export interface ConsensusResult {
  /** Whether consensus was reached */
  reached: boolean;
  /** Winning proposal (if any) */
  winningProposal?: ConsensusProposal;
  /** All proposals considered */
  proposals: ConsensusProposal[];
  /** Vote counts */
  votes: Record<string, number>;
  /** Dissenting agents and reasons */
  dissents: { agentId: string; reason: string }[];
  /** Rounds needed */
  rounds: number;
}

export interface ConflictReport {
  /** Agents in conflict */
  conflictingAgents: string[];
  /** Description of the conflict */
  description: string;
  /** Proposals from each side */
  proposals: { agentId: string; proposal: string }[];
  /** Suggested resolution */
  suggestedResolution: string;
}

export interface ConversationState {
  /** Unique conversation id */
  conversationId: string;
  /** Topic/subject */
  topic: string;
  /** Registered speakers */
  speakers: AgentSpeaker[];
  /** All turns */
  turns: ConversationTurn[];
  /** Active proposals */
  proposals: ConsensusProposal[];
  /** Current turn policy */
  turnPolicy: TurnPolicy;
  /** Current consensus method */
  consensusMethod: ConsensusMethod;
  /** Maximum turns allowed */
  maxTurns: number;
  /** Whether the conversation has terminated */
  terminated: boolean;
  /** Termination reason */
  terminationReason?: string;
}

export interface GroupConversation {
  /** Get current state */
  getState(): ConversationState;

  /** Add a speaker to the conversation */
  addSpeaker(speaker: AgentSpeaker): void;

  /** Remove a speaker */
  removeSpeaker(agentId: string): boolean;

  /** Submit a turn (agent speaks) */
  submitTurn(speakerId: string, content: string): ConversationTurn;

  /** Submit a system turn */
  submitSystemTurn(content: string): ConversationTurn;

  /** Propose a solution for consensus */
  propose(agentId: string, content: string, evidence: string[], confidence: number): ConsensusProposal;

  /** Run consensus among all proposals */
  runConsensus(): ConsensusResult;

  /** Detect conflicts in the conversation */
  detectConflicts(): ConflictReport;

  /** Advance to the next speaker (for speaker_select) */
  advanceTurn(speakerId: string): ConversationTurn | null;

  /** Check if the conversation should terminate */
  shouldTerminate(): { terminate: boolean; reason?: string };

  /** Terminate the conversation */
  terminate(reason: string): void;

  /** Reset for a new conversation */
  reset(topic: string): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateProposalId(): string {
  return `prop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Main implementation
// ---------------------------------------------------------------------------

export function createGroupConversation(
  topic: string,
  opts: {
    turnPolicy?: TurnPolicy;
    consensusMethod?: ConsensusMethod;
    maxTurns?: number;
  } = {}
): GroupConversation {
  const state: ConversationState = {
    conversationId: generateId(),
    topic,
    speakers: [],
    turns: [],
    proposals: [],
    turnPolicy: opts.turnPolicy ?? 'round_robin',
    consensusMethod: opts.consensusMethod ?? 'majority_vote',
    maxTurns: opts.maxTurns ?? 20,
    terminated: false,
  };

  let currentRoundRobinIndex = 0;
  let selectedSpeakerId: string | undefined;

  function getNextSpeaker(): string | undefined {
    const activeSpeakers = state.speakers.filter((s) => s.active);
    if (activeSpeakers.length === 0) return undefined;

    switch (state.turnPolicy) {
      case 'round_robin': {
        const speaker = activeSpeakers[currentRoundRobinIndex % activeSpeakers.length]!;
        currentRoundRobinIndex++;
        return speaker.id;
      }
      case 'random': {
        const idx = Math.floor(Math.random() * activeSpeakers.length);
        return activeSpeakers[idx]!.id;
      }
      case 'priority': {
        const sorted = [...activeSpeakers].sort((a, b) => a.weight - b.weight);
        return sorted[0]!.id;
      }
      case 'speaker_select':
        return selectedSpeakerId ?? activeSpeakers[0]!.id;
      default:
        return activeSpeakers[0]!.id;
    }
  }

  return {
    getState(): ConversationState {
      return state;
    },

    addSpeaker(speaker: AgentSpeaker): void {
      if (state.speakers.some((s) => s.id === speaker.id)) {
        throw new Error(`Speaker ${speaker.id} already exists in conversation`);
      }
      state.speakers.push(speaker);
    },

    removeSpeaker(agentId: string): boolean {
      const index = state.speakers.findIndex((s) => s.id === agentId);
      if (index === -1) return false;
      state.speakers[index]!.active = false;
      return true;
    },

    submitTurn(speakerId: string, content: string): ConversationTurn {
      if (state.terminated) {
        throw new Error('Conversation has already terminated');
      }
      if (state.turns.length >= state.maxTurns) {
        state.terminated = true;
        state.terminationReason = 'Maximum turns reached';
      }

      const speaker = state.speakers.find((s) => s.id === speakerId);
      if (!speaker) {
        throw new Error(`Speaker ${speakerId} not found in conversation`);
      }
      if (!speaker.active) {
        throw new Error(`Speaker ${speakerId} is not active`);
      }

      speaker.turnCount++;

      const turn: ConversationTurn = {
        turnNumber: state.turns.length + 1,
        speakerId,
        content,
        timestamp: Date.now(),
        isSystem: false,
      };

      state.turns.push(turn);
      return turn;
    },

    submitSystemTurn(content: string): ConversationTurn {
      if (state.terminated) {
        throw new Error('Conversation has already terminated');
      }

      const turn: ConversationTurn = {
        turnNumber: state.turns.length + 1,
        speakerId: 'system',
        content,
        timestamp: Date.now(),
        isSystem: true,
      };

      state.turns.push(turn);
      return turn;
    },

    propose(agentId: string, content: string, evidence: string[], confidence: number): ConsensusProposal {
      const proposal: ConsensusProposal = {
        id: generateProposalId(),
        proposedBy: agentId,
        content,
        evidence,
        confidence: Math.max(0, Math.min(1, confidence)),
        timestamp: Date.now(),
      };

      state.proposals.push(proposal);
      return proposal;
    },

    runConsensus(): ConsensusResult {
      const proposals = [...state.proposals];
      const votes: Record<string, number> = {};
      const dissents: { agentId: string; reason: string }[] = [];

      for (const speaker of state.speakers.filter((s) => s.active)) {
        if (proposals.length === 0) {
          votes[speaker.id] = 0;
          continue;
        }

        switch (state.consensusMethod) {
          case 'majority_vote':
          case 'unanimous': {
            // Each agent votes for the proposal with highest confidence from a different agent
            const validProposals = proposals.filter((p) => p.proposedBy !== speaker.id);
            if (validProposals.length === 0) {
              votes[speaker.id] = 0;
              continue;
            }
            const best = validProposals.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
            votes[best.id] = (votes[best.id] ?? 0) + 1;
            break;
          }
          case 'weighted': {
            const validProposals = proposals.filter((p) => p.proposedBy !== speaker.id);
            if (validProposals.length === 0) {
              votes[speaker.id] = 0;
              continue;
            }
            const best = validProposals.reduce((a, b) => (a.confidence * speaker.weight >= b.confidence * speaker.weight ? a : b));
            votes[best.id] = (votes[best.id] ?? 0) + speaker.weight;
            break;
          }
          case 'first_valid': {
            const first = proposals.find((p) => p.confidence > 0.5);
            if (first) {
              votes[first.id] = (votes[first.id] ?? 0) + 1;
            } else {
              dissents.push({ agentId: speaker.id, reason: 'No proposal meets confidence threshold' });
            }
            break;
          }
        }
      }

      // Determine winner
      let winningProposal: ConsensusProposal | undefined;
      let maxVotes = 0;
      for (const [proposalId, count] of Object.entries(votes)) {
        if (count > maxVotes) {
          maxVotes = count;
          winningProposal = proposals.find((p) => p.id === proposalId);
        }
      }

      // Check if consensus is reached
      const activeCount = state.speakers.filter((s) => s.active).length;
      let reached = false;
      if (winningProposal) {
        switch (state.consensusMethod) {
          case 'unanimous':
            reached = maxVotes >= activeCount;
            break;
          case 'majority_vote':
            reached = maxVotes > activeCount / 2;
            break;
          case 'weighted':
            reached = maxVotes > 0;
            break;
          case 'first_valid':
            reached = winningProposal.confidence > 0.5;
            break;
        }
      }

      // Record dissents from non-voters
      const votedFor = new Set(Object.keys(votes).filter((k) => votes[k]! > 0));
      for (const speaker of state.speakers.filter((s) => s.active)) {
        if (!votedFor.has(speaker.id)) {
          const speakerProposal = proposals.find((p) => p.proposedBy === speaker.id);
          if (speakerProposal && speakerProposal.confidence > 0.5) {
            dissents.push({
              agentId: speaker.id,
              reason: `Preferred own proposal with confidence ${speakerProposal.confidence.toFixed(2)}`,
            });
          }
        }
      }

      return {
        reached,
        winningProposal,
        proposals,
        votes,
        dissents,
        rounds: 1,
      };
    },

    detectConflicts(): ConflictReport {
      const conflicts: { agentId: string; proposal: string }[] = [];

      // Group turns by speaker and look for contradictory statements
      const speakerContents = new Map<string, string[]>();
      for (const turn of state.turns) {
        if (!turn.isSystem) {
          const existing = speakerContents.get(turn.speakerId) ?? [];
          existing.push(turn.content);
          speakerContents.set(turn.speakerId, existing);
        }
      }

      // Check proposals for conflicts
      if (state.proposals.length >= 2) {
        const uniqueAuthors = new Set(state.proposals.map((p) => p.proposedBy));
        if (uniqueAuthors.size >= 2) {
          for (const proposal of state.proposals) {
            conflicts.push({
              agentId: proposal.proposedBy,
              proposal: proposal.content.slice(0, 200),
            });
          }
        }
      }

      return {
        conflictingAgents: [...new Set(conflicts.map((c) => c.agentId))],
        description: conflicts.length > 0
          ? `${conflicts.length} conflicting proposals detected`
          : 'No conflicts detected',
        proposals: conflicts,
        suggestedResolution: conflicts.length > 0
          ? 'Run consensus to select the highest-confidence proposal'
          : 'No action needed',
      };
    },

    advanceTurn(speakerId: string): ConversationTurn | null {
      if (state.terminated) return null;

      selectedSpeakerId = speakerId;
      const speaker = state.speakers.find((s) => s.id === speakerId);
      if (!speaker || !speaker.active) return null;

      const turn: ConversationTurn = {
        turnNumber: state.turns.length + 1,
        speakerId,
        content: `[Advancing to ${speaker.name}]`,
        timestamp: Date.now(),
        isSystem: true,
      };

      state.turns.push(turn);
      return turn;
    },

    shouldTerminate(): { terminate: boolean; reason?: string } {
      if (state.turns.length >= state.maxTurns) {
        return { terminate: true, reason: 'Maximum turns reached' };
      }

      const activeSpeakers = state.speakers.filter((s) => s.active);
      if (activeSpeakers.length === 0) {
        return { terminate: true, reason: 'No active speakers remaining' };
      }

      if (state.proposals.length > 0) {
        const consensus = this.runConsensus();
        if (consensus.reached) {
          return { terminate: true, reason: 'Consensus reached' };
        }
      }

      return { terminate: false };
    },

    terminate(reason: string): void {
      state.terminated = true;
      state.terminationReason = reason;
    },

    reset(topic: string): void {
      state.topic = topic;
      state.turns = [];
      state.proposals = [];
      state.terminated = false;
      state.terminationReason = undefined;
      currentRoundRobinIndex = 0;
      selectedSpeakerId = undefined;
      for (const speaker of state.speakers) {
        speaker.turnCount = 0;
        speaker.active = true;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Turn scheduling utilities
// ---------------------------------------------------------------------------

export function scheduleTurns(
  speakers: AgentSpeaker[],
  turnPolicy: TurnPolicy,
  maxTurns: number
): string[] {
  const active = speakers.filter((s) => s.active);
  if (active.length === 0) return [];

  const order: string[] = [];
  let roundRobinIndex = 0;

  for (let i = 0; i < maxTurns; i++) {
    switch (turnPolicy) {
      case 'round_robin':
        order.push(active[roundRobinIndex % active.length]!.id);
        roundRobinIndex++;
        break;
      case 'random':
        order.push(active[Math.floor(Math.random() * active.length)]!.id);
        break;
      case 'priority': {
        const sorted = [...active].sort((a, b) => a.weight - b.weight);
        order.push(sorted[i % sorted.length]!.id);
        break;
      }
      default:
        order.push(active[i % active.length]!.id);
    }
  }

  return order;
}
