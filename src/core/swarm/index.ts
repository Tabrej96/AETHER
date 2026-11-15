/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Module — Public API
 *
 * Distributed agent intelligence: event bus, message protocol, group
 * conversation, team hierarchy, parallel execution, dependency graph,
 * and failure handling.
 *
 * Architectural inspiration: AutoGen (archived reference).
 * AETHER-native implementations using modern TypeScript patterns.
 */

// ---------------------------------------------------------------------------
// Event Bus
// ---------------------------------------------------------------------------
export type {
  EventCategory,
  SwarmEvent,
  EventFilter,
  EventSubscription,
  DeadLetter,
  EventBusConfig,
  EventBusStats,
  EventBus,
} from './eventBus';

export { createEventBus } from './eventBus';

// ---------------------------------------------------------------------------
// Message Protocol
// ---------------------------------------------------------------------------
export type {
  MessageType,
  MessagePriority,
  MessageHeader,
  MessageBody,
  SwarmMessage,
  RequestMessage,
  ResponseMessage,
  BroadcastMessage,
  DirectiveMessage,
  HeartbeatMessage,
  StatusMessage,
  ErrorMessage,
  MessageEnvelope,
  MessageRouter,
  MessageDeliveryResult,
} from './messageProtocol';

export {
  createMessage,
  createRequest,
  createResponse,
  createBroadcast,
  createDirective,
  createHeartbeat,
  createErrorMessage,
  serializeMessage,
  deserializeMessage,
  createMessageRouter,
  validateMessage,
  isExpired,
  matchesRecipient,
} from './messageProtocol';

// ---------------------------------------------------------------------------
// Group Conversation
// ---------------------------------------------------------------------------
export type {
  TurnPolicy,
  ConsensusMethod,
  AgentSpeaker,
  ConversationTurn,
  ConsensusProposal,
  ConsensusResult,
  ConflictReport,
  ConversationState,
  GroupConversation,
} from './groupConversation';

export {
  createGroupConversation,
  scheduleTurns,
} from './groupConversation';

// ---------------------------------------------------------------------------
// Team Hierarchy
// ---------------------------------------------------------------------------
export type {
  AgentRole,
  TeamNode,
  DelegationRequest,
  DelegationResult,
  TeamHierarchy,
} from './teamHierarchy';

export {
  createTeamHierarchy,
  composeTeam,
} from './teamHierarchy';

// ---------------------------------------------------------------------------
// Parallel Executor
// ---------------------------------------------------------------------------
export type {
  TaskStatus,
  TaskInput,
  TaskResult,
  ExecutionPlan,
  ExecutionSummary,
  TaskExecutor,
  ParallelExecutor,
  LoadMetric,
  LoadBalancer,
} from './parallelExecutor';

export {
  createParallelExecutor,
  createLoadBalancer,
} from './parallelExecutor';

// ---------------------------------------------------------------------------
// Dependency Graph
// ---------------------------------------------------------------------------
export type {
  DependencyNode,
  DependencyEdge,
  DependencyGraph,
  TopologicalResult,
  CriticalPathResult,
  CycleReport,
  ParallelGroups,
} from './dependencyGraph';

export {
  createDependencyGraph,
  addNode,
  addNodes,
  addEdge,
  removeEdge,
  getInDegree,
  getOutDegree,
  getDependencies,
  getDependents,
  detectCycle,
  topologicalSort,
  identifyParallelGroups,
  findCriticalPath,
  buildFromTaskNodes,
  isLeafNode,
  isRootNode,
  getLongestPathLength,
  cloneGraph,
} from './dependencyGraph';

// ---------------------------------------------------------------------------
// Failure Handler
// ---------------------------------------------------------------------------
export type {
  FailureCategory,
  FailureRecord,
  RetryConfig,
  CircuitBreakerConfig,
  CircuitState,
  CircuitBreakerStats,
  CircuitBreaker,
  DegradationPolicy,
  FailureReport,
  FailureHandler,
} from './failureHandler';

export {
  createFailureHandler,
  withRetry,
  withCircuitBreaker,
  isRetryableError,
} from './failureHandler';
