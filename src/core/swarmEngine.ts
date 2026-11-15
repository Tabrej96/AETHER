/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SYSTEM 2: Dynamic Agent Swarm (swarmEngine.ts)
 *
 * Capability-based minimal team formation, Task Complexity & Coupling Index (TCCI),
 * topological DAG scheduling, exclusive file-lease locks, and consensus arbitration.
 *
 * Enhanced by Program 04 (AETHER Distributed Agent Intelligence) to integrate
 * with the swarm module: event bus, message protocol, group conversation,
 * team hierarchy, parallel execution, dependency graph, and failure handling.
 *
 * Architectural inspiration: AutoGen (archived reference) for swarm coordination
 * patterns. AETHER-native implementation extending the existing swarm engine.
 */

import { AgentSpec, SwarmFormationResult, SwarmTaskNode, SwarmTaskRequest } from './types';
import { buildFromTaskNodes, topologicalSort, findCriticalPath, detectCycle, DependencyGraph } from './swarm/dependencyGraph';
import { createEventBus, type SwarmEvent, type EventBus } from './swarm/eventBus';
import { createMessageRouter, type MessageRouter } from './swarm/messageProtocol';
import { createParallelExecutor, type ParallelExecutor, type ExecutionPlan, type TaskInput } from './swarm/parallelExecutor';
import { createFailureHandler, type FailureHandler } from './swarm/failureHandler';
import { createGroupConversation, type GroupConversation } from './swarm/groupConversation';

export interface SwarmTaskRequest {
  taskDescription: string;
  targetFilePaths: string[];
  blastRadiusScore: number;
  requiresSecurityAudit: boolean;
  requiresDbMigration: boolean;
  availableAgents: AgentSpec[];
}

export function formDynamicSwarm(req: SwarmTaskRequest): SwarmFormationResult {
  const {
    taskDescription,
    targetFilePaths,
    blastRadiusScore,
    requiresSecurityAudit,
    requiresDbMigration,
    availableAgents,
  } = req;

  // Compute Task Complexity & Coupling Index (TCCI) in [0, 1]
  const fileFactor = Math.min(1, targetFilePaths.length / 6);
  const riskFactor = Math.min(1, blastRadiusScore / 100);
  const securityFactor = requiresSecurityAudit ? 0.22 : 0;
  const dbFactor = requiresDbMigration ? 0.18 : 0;

  const tcci = Number(Math.min(1, fileFactor * 0.35 + riskFactor * 0.35 + securityFactor + dbFactor).toFixed(2));

  const findAgent = (category: AgentSpec['category'], fallbackIndex = 0): AgentSpec => {
    return (
      availableAgents.find((a) => a.category === category) ??
      availableAgents[fallbackIndex % availableAgents.length]
    );
  };

  // Rule: Do NOT blindly spawn a multi-agent swarm for low-complexity tasks
  if (tcci < 0.35 && targetFilePaths.length <= 2 && !requiresSecurityAudit && !requiresDbMigration) {
    const implementer = findAgent('implementation', 0);
    const singleNode: SwarmTaskNode = {
      taskId: 'stage-1-implement-verify',
      title: `Autonomous Single-Engineer Implementation & Verification: ${taskDescription.slice(0, 60)}`,
      assignedAgentId: implementer.id,
      assignedAgentName: implementer.name,
      dependsOn: [],
      exclusiveFileLeases: targetFilePaths,
      parallelGroup: 1,
      verificationGate: 'Run targeted unit test + strict typecheck (zero swarm coordination overhead)',
    };

    return {
      taskComplexityIndex: tcci,
      executionMode: 'SINGLE_AGENT_FAST_PATH',
      rationale: `TCCI is ${tcci} (< 0.35 threshold) with ${targetFilePaths.length} target file(s). Bypassing multi-agent swarm to eliminate handoff latency and token overhead.`,
      selectedAgents: [implementer],
      dagNodes: [singleNode],
      conflictLocksGuaranteed: true,
      consensusProtocol: 'Deterministic Local Test & Typecheck Gate',
    };
  }

  // Dyad mode for moderate tasks
  if (tcci < 0.65 && !requiresDbMigration) {
    const implementer = findAgent('implementation', 0);
    const challenger = findAgent('adversarial', 1);

    const dagNodes: SwarmTaskNode[] = [
      {
        taskId: 'stage-1-leased-edit',
        title: 'Scoped Implementation with Exclusive Write Leases',
        assignedAgentId: implementer.id,
        assignedAgentName: implementer.name,
        dependsOn: [],
        exclusiveFileLeases: targetFilePaths,
        parallelGroup: 1,
        verificationGate: 'All mutated symbols compile and pass unit tests',
      },
      {
        taskId: 'stage-2-adversarial-challenge',
        title: 'Independent Adversarial Falsification & Edge-Case Probe',
        assignedAgentId: challenger.id,
        assignedAgentName: challenger.name,
        dependsOn: ['stage-1-leased-edit'],
        exclusiveFileLeases: [], // Read-only verification lease
        parallelGroup: 2,
        verificationGate: 'Zero unmitigated BLOCKER or HIGH findings with concrete reproducers',
      },
    ];

    return {
      taskComplexityIndex: tcci,
      executionMode: 'DYAD_IMPLEMENTATION_AND_CRITIC',
      rationale: `TCCI is ${tcci} (moderate coupling). Paired 1 Primary Implementer with 1 Independent Adversarial Challenger under read/write lease separation.`,
      selectedAgents: [implementer, challenger],
      dagNodes,
      conflictLocksGuaranteed: verifyDisjointParallelLeases(dagNodes),
      consensusProtocol: 'Falsification-First Dyad (Challenger requires concrete reproducer to block)',
    };
  }

  // Full DAG Swarm Topology for high/critical complexity tasks
  const architect = findAgent('architecture', 0);
  const implementer = findAgent('implementation', 1);
  const securityAgent = findAgent('security', 2);
  const challenger = findAgent('adversarial', 3);

  const mid = Math.max(1, Math.ceil(targetFilePaths.length / 2));
  const primaryLeases = targetFilePaths.slice(0, mid);
  const secondaryLeases = targetFilePaths.slice(mid);

  const dagNodes: SwarmTaskNode[] = [
    {
      taskId: 'stage-1-blast-contract',
      title: 'AST Blast-Radius Partitioning & Interface Contract Lock',
      assignedAgentId: architect.id,
      assignedAgentName: architect.name,
      dependsOn: [],
      exclusiveFileLeases: [],
      parallelGroup: 1,
      verificationGate: 'Interface contract schema & disjoint file-lease table validated',
    },
    {
      taskId: 'stage-2a-core-module',
      title: 'Core Domain Implementation (Shard A)',
      assignedAgentId: implementer.id,
      assignedAgentName: implementer.name,
      dependsOn: ['stage-1-blast-contract'],
      exclusiveFileLeases: primaryLeases,
      parallelGroup: 2,
      verificationGate: 'Shard A unit tests + contract conformance pass',
    },
  ];

  if (secondaryLeases.length > 0) {
    const verifierAgent = findAgent('verification', 4);
    dagNodes.push({
      taskId: 'stage-2b-consumer-tests',
      title: 'Downstream Contract Consumers & Regression Suite (Shard B)',
      assignedAgentId: verifierAgent.id,
      assignedAgentName: verifierAgent.name,
      dependsOn: ['stage-1-blast-contract'],
      exclusiveFileLeases: secondaryLeases,
      parallelGroup: 2,
      verificationGate: 'Shard B integration assertions pass with zero lease overlap',
    });
  }

  const stage2Ids = dagNodes.filter((d) => d.parallelGroup === 2).map((d) => d.taskId);

  dagNodes.push({
    taskId: 'stage-3-adversarial-security-gate',
    title: 'Parallel Adversarial Code-Breaker & Security Boundary Audit',
    assignedAgentId: requiresSecurityAudit ? securityAgent.id : challenger.id,
    assignedAgentName: requiresSecurityAudit ? securityAgent.name : challenger.name,
    dependsOn: stage2Ids,
    exclusiveFileLeases: [],
    parallelGroup: 3,
    verificationGate: 'Zero exploit paths, race conditions, or regressions in PASS_TO_PASS suite',
  });

  const selectedMap = new Map<string, AgentSpec>();
  for (const a of [architect, implementer, securityAgent, challenger]) {
    selectedMap.set(a.id, a);
  }

  return {
    taskComplexityIndex: tcci,
    executionMode: 'DAG_SWARM_TOPOLOGY',
    rationale: `TCCI is ${tcci} (>= 0.65 critical complexity). Formed topological DAG with disjoint parallel file leases and mandatory adversarial + security verification gates.`,
    selectedAgents: Array.from(selectedMap.values()),
    dagNodes,
    conflictLocksGuaranteed: verifyDisjointParallelLeases(dagNodes),
    consensusProtocol: 'Weighted Evidence Arbitration (Passing Reproducer Test > Static Analysis > Heuristic Opinion)',
  };
}

export function verifyDisjointParallelLeases(nodes: SwarmTaskNode[]): boolean {
  const byGroup = new Map<number, Set<string>>();
  for (const node of nodes) {
    const seen = byGroup.get(node.parallelGroup) ?? new Set<string>();
    for (const file of node.exclusiveFileLeases) {
      if (seen.has(file)) {
        return false; // Write-write conflict detected in same parallel stage!
      }
      seen.add(file);
    }
    byGroup.set(node.parallelGroup, seen);
  }
  return true;
}

// ============================================================================
// Enhanced Swarm Engine (Program 04 additions)
// ============================================================================

export interface SwarmExecutionContext {
  /** Event bus for inter-agent communication */
  eventBus: EventBus;
  /** Message router for agent messaging */
  messageRouter: MessageRouter;
  /** Parallel executor for concurrent tasks */
  parallelExecutor: ParallelExecutor;
  /** Failure handler with circuit breakers */
  failureHandler: FailureHandler;
  /** Group conversation for multi-agent dialogue */
  conversation: GroupConversation;
  /** Dependency graph for this execution */
  dependencyGraph: DependencyGraph;
}

export interface SwarmExecutionOptions {
  /** Concurrency limit for parallel tasks */
  concurrencyLimit: number;
  /** Enable event persistence */
  enablePersistence: boolean;
  /** Persistence path */
  persistencePath?: string;
  /** Maximum retries per task */
  maxRetries: number;
  /** Event bus debug mode */
  debug: boolean;
}

const DEFAULT_SWARM_OPTIONS: SwarmExecutionOptions = {
  concurrencyLimit: 4,
  enablePersistence: true,
  maxRetries: 2,
  debug: false,
};

export interface SwarmEngine {
  /** Execute a swarm formation result */
  execute(result: SwarmFormationResult, options?: Partial<SwarmExecutionOptions>): Promise<SwarmExecutionContext>;

  /** Build a dependency graph from a swarm formation result */
  buildDependencyGraph(result: SwarmFormationResult): DependencyGraph;

  /** Get task inputs from a swarm formation result */
  getTaskInputs(result: SwarmFormationResult): TaskInput[];
}

/**
 * Create a swarm execution context from a formation result.
 * Wires together all swarm subsystems for coordinated agent execution.
 */
export function createSwarmExecutionContext(
  result: SwarmFormationResult,
  options: Partial<SwarmExecutionOptions> = {}
): SwarmExecutionContext {
  const merged: SwarmExecutionOptions = { ...DEFAULT_SWARM_OPTIONS, ...options };

  const eventBus = createEventBus({
    maxHistorySize: 1000,
    maxDeliveryAttempts: 2,
    enablePersistence: merged.enablePersistence,
    persistencePath: merged.persistencePath,
    handlerTimeoutMs: 5000,
    debug: merged.debug,
  });

  const messageRouter = createMessageRouter();
  const parallelExecutor = createParallelExecutor();
  const failureHandler = createFailureHandler({ maxRetries: merged.maxRetries });
  const conversation = createGroupConversation(
    `Swarm execution: ${result.executionMode}`,
    { turnPolicy: 'round_robin', consensusMethod: 'majority_vote', maxTurns: 20 }
  );

  // Register agents as speakers
  for (const agent of result.selectedAgents) {
    conversation.addSpeaker({
      id: agent.id,
      name: agent.name,
      weight: 1.0,
      active: true,
      turnCount: 0,
    });
  }

  // Register message handlers
  for (const agent of result.selectedAgents) {
    messageRouter.registerHandler(agent.id, async (msg) => {
      eventBus.publish(`msg.${msg.header.type}`, {
        messageId: msg.header.id,
        from: msg.header.from,
        to: msg.header.to,
        summary: msg.body.summary,
      });
    });
  }

  const dependencyGraph = buildFromTaskNodes(result.dagNodes.map((n) => ({
    taskId: n.taskId,
    title: n.title,
    dependsOn: n.dependsOn,
  })));

  return {
    eventBus,
    messageRouter,
    parallelExecutor,
    failureHandler,
    conversation,
    dependencyGraph,
  };
}

export function createSwarmEngine(): SwarmEngine {
  return {
    execute(result, options) {
      const ctx = createSwarmExecutionContext(result, options);

      // Publish swarm formation event
      ctx.eventBus.publish('swarm.formed', {
        executionMode: result.executionMode,
        agentCount: result.selectedAgents.length,
        taskCount: result.dagNodes.length,
        tcci: result.taskComplexityIndex,
      }, { sourceAgentId: 'swarm-engine' });

      // Validate the dependency graph
      const cycleReport = detectCycle(ctx.dependencyGraph);
      if (cycleReport.hasCycle) {
        ctx.eventBus.publish('failure.cycle', {
          cycleNodes: cycleReport.cycleNodes,
          suggestedResolution: cycleReport.suggestedResolution,
        }, { sourceAgentId: 'swarm-engine' });
      }

      return Promise.resolve(ctx);
    },

    buildDependencyGraph(result) {
      return buildFromTaskNodes(
        result.dagNodes.map((n) => ({
          taskId: n.taskId,
          title: n.title,
          dependsOn: n.dependsOn,
        }))
      );
    },

    getTaskInputs(result) {
      return result.dagNodes.map((node) => ({
        taskId: node.taskId,
        description: node.title,
        assignedAgentId: node.assignedAgentId,
        payload: {
          verificationGate: node.verificationGate,
          fileLeases: node.exclusiveFileLeases,
        },
        timeoutMs: 30000,
        priority: node.dependsOn.length === 0 ? 10 : 5,
        retries: 0,
        maxRetries: 2,
      }));
    },
  };
}

