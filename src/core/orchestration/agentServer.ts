/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AGENT SERVER ARCHITECTURE  ·  AETHER Autonomous Execution
 * (src/core/orchestration/agentServer.ts)
 *
 * Agent lifecycle management, tool execution framework,
 * result aggregation, and health monitoring.
 *
 * Inspiration: All-Hands-AI/OpenHands (agent runtime, tool execution)
 *              FoundationAgents/OpenManus (agent lifecycle, task routing)
 */

import type { AgentSpec } from '../types';

// =====================================================================
// TYPES
// =====================================================================

export type AgentStatus = 'IDLE' | 'SPAWNING' | 'READY' | 'BUSY' | 'ERROR' | 'SHUTDOWN' | 'TERMINATED';
export type ToolStatus = 'PENDING' | 'EXECUTING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresApproval: boolean;
  timeoutMs: number;
}

export interface ToolCallRequest {
  callId: string;
  agentId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  priority: number;
}

export interface ToolCallResult {
  callId: string;
  agentId: string;
  toolName: string;
  status: ToolStatus;
  result?: unknown;
  error?: string;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
}

export type ToolExecutor = (request: ToolCallRequest) => Promise<unknown>;

export interface AgentInstance {
  agentId: string;
  agentSpec: AgentSpec;
  status: AgentStatus;
  currentTaskId: string | null;
  tools: Map<string, ToolDefinition>;
  toolExecutors: Map<string, ToolExecutor>;
  results: ToolCallResult[];
  spawnedAt: string;
  lastActiveAt: string;
  metadata: Record<string, unknown>;
  failureCount: number;
  recoveryAttempts: number;
}

export interface AgentServerMetrics {
  totalAgents: number;
  activeAgents: number;
  idleAgents: number;
  busyAgents: number;
  errorAgents: number;
  totalToolCalls: number;
  successfulToolCalls: number;
  failedToolCalls: number;
  averageToolDurationMs: number;
  uptimeMs: number;
}

export interface AggregatedResult {
  taskId: string;
  agentResults: Map<string, ToolCallResult[]>;
  overallStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
  successfulAgents: string[];
  failedAgents: string[];
  totalDurationMs: number;
  combinedOutput: Record<string, unknown>;
  errors: string[];
}

export interface AgentServerOptions {
  maxAgents: number;
  defaultToolTimeoutMs: number;
  maxRetriesPerAgent: number;
  healthCheckIntervalMs: number;
  autoRecoverAgents: boolean;
}

// =====================================================================
// AGENT SERVER
// =====================================================================

export class AgentServer {
  private readonly options: Required<AgentServerOptions>;
  private readonly agents: Map<string, AgentInstance> = new Map();
  private readonly toolRegistry: Map<string, ToolDefinition> = new Map();
  private readonly globalToolExecutors: Map<string, ToolExecutor> = new Map();
  private readonly taskQueue: Array<{ agentId: string; taskId: string; resolve: (result: ToolCallResult) => void; reject: (error: Error) => void }> = [];
  private toolCallCounter = 0;
  private startedAt: string;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private readonly pendingToolCalls: Map<string, { resolve: (r: ToolCallResult) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }> = new Map();

  constructor(options: AgentServerOptions = {}) {
    this.options = {
      maxAgents: options.maxAgents ?? 16,
      defaultToolTimeoutMs: options.defaultToolTimeoutMs ?? 30_000,
      maxRetriesPerAgent: options.maxRetriesPerAgent ?? 3,
      healthCheckIntervalMs: options.healthCheckIntervalMs ?? 30_000,
      autoRecoverAgents: options.autoRecoverAgents ?? true,
    };
    this.startedAt = new Date().toISOString();
    this.startHealthCheck();
  }

  // =====================================================================
  // AGENT LIFECYCLE
  // =====================================================================

  /**
   * Spawn a new agent from its spec.
   */
  spawnAgent(spec: AgentSpec, agentId?: string): AgentInstance {
    const id = agentId ?? `${spec.id}-${Date.now().toString(36)}`;

    if (this.agents.size >= this.options.maxAgents) {
      throw new Error(`Agent limit reached: ${this.options.maxAgents}`);
    }

    if (this.agents.has(id)) {
      throw new Error(`Agent already exists: ${id}`);
    }

    const instance: AgentInstance = {
      agentId: id,
      agentSpec: spec,
      status: 'SPAWNING',
      currentTaskId: null,
      tools: new Map(),
      toolExecutors: new Map(),
      results: [],
      spawnedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      metadata: {},
      failureCount: 0,
      recoveryAttempts: 0,
    };

    this.agents.set(id, instance);

    // Auto-register global tools
    for (const [toolName, executor] of this.globalToolExecutors) {
      const toolDef = this.toolRegistry.get(toolName);
      if (toolDef) {
        instance.tools.set(toolName, toolDef);
        instance.toolExecutors.set(toolName, executor);
      }
    }

    // Mark as ready after a tick
    setTimeout(() => {
      instance.status = 'READY';
      instance.lastActiveAt = new Date().toISOString();
    }, 10);

    return instance;
  }

  /**
   * Shutdown an agent.
   */
  shutdownAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    agent.status = 'SHUTDOWN';
    this.agents.delete(agentId);
    return true;
  }

  /**
   * Get agent by ID.
   */
  getAgent(agentId: string): AgentInstance | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all agents.
   */
  listAgents(status?: AgentStatus): AgentInstance[] {
    const all = Array.from(this.agents.values());
    if (!status) return all;
    return all.filter((a) => a.status === status);
  }

  /**
   * Recover a failed agent.
   */
  recoverAgent(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    if (agent.recoveryAttempts >= this.options.maxRetriesPerAgent) {
      agent.status = 'TERMINATED';
      return false;
    }

    agent.status = 'SPAWNING';
    agent.recoveryAttempts++;
    agent.failureCount = 0;
    agent.results = [];

    setTimeout(() => {
      agent.status = 'READY';
      agent.lastActiveAt = new Date().toISOString();
    }, 50);

    return true;
  }

  // =====================================================================
  // TOOL EXECUTION
  // =====================================================================

  /**
   * Register a tool globally (available to all agents).
   */
  registerTool(definition: ToolDefinition, executor: ToolExecutor): void {
    this.toolRegistry.set(definition.name, definition);
    this.globalToolExecutors.set(definition.name, executor);

    // Register on all existing agents
    for (const agent of this.agents.values()) {
      agent.tools.set(definition.name, definition);
      agent.toolExecutors.set(definition.name, executor);
    }
  }

  /**
   * Register a tool on a specific agent.
   */
  registerToolForAgent(agentId: string, definition: ToolDefinition, executor: ToolExecutor): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    agent.tools.set(definition.name, definition);
    agent.toolExecutors.set(definition.name, executor);
    this.toolRegistry.set(definition.name, definition);
  }

  /**
   * Execute a tool call on a specific agent.
   */
  async executeTool(request: ToolCallRequest): Promise<ToolCallResult> {
    const agent = this.agents.get(request.agentId);
    if (!agent) {
      return {
        callId: request.callId,
        agentId: request.agentId,
        toolName: request.toolName,
        status: 'FAILED',
        error: `Agent not found: ${request.agentId}`,
        durationMs: 0,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      };
    }

    const toolDef = agent.tools.get(request.toolName);
    if (!toolDef) {
      return {
        callId: request.callId,
        agentId: request.agentId,
        toolName: request.toolName,
        status: 'FAILED',
        error: `Tool not found: ${request.toolName}`,
        durationMs: 0,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      };
    }

    const executor = agent.toolExecutors.get(request.toolName);
    if (!executor) {
      return {
        callId: request.callId,
        agentId: request.agentId,
        toolName: request.toolName,
        status: 'FAILED',
        error: `Tool executor not found: ${request.toolName}`,
        durationMs: 0,
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      };
    }

    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    agent.status = 'BUSY';
    agent.currentTaskId = request.callId;
    agent.lastActiveAt = startedAt;

    try {
      const result = await this.executeWithTimeout(() => executor(request), toolDef.timeoutMs);
      const durationMs = Date.now() - startTime;
      const finishedAt = new Date().toISOString();

      const toolResult: ToolCallResult = {
        callId: request.callId,
        agentId: request.agentId,
        toolName: request.toolName,
        status: 'SUCCEEDED',
        result,
        durationMs,
        startedAt,
        finishedAt,
      };

      agent.results.push(toolResult);
      agent.status = 'READY';
      agent.currentTaskId = null;
      agent.lastActiveAt = finishedAt;
      agent.failureCount = 0;

      return toolResult;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const finishedAt = new Date().toISOString();
      const message = error instanceof Error ? error.message : String(error);

      const toolResult: ToolCallResult = {
        callId: request.callId,
        agentId: request.agentId,
        toolName: request.toolName,
        status: 'FAILED',
        error: message,
        durationMs,
        startedAt,
        finishedAt,
      };

      agent.results.push(toolResult);
      agent.failureCount++;
      agent.lastActiveAt = finishedAt;

      // Auto-recover if enabled
      if (this.options.autoRecoverAgents && agent.failureCount >= 2) {
        agent.status = 'ERROR';
        this.recoverAgent(request.agentId);
      } else {
        agent.status = 'READY';
      }
      agent.currentTaskId = null;

      return toolResult;
    }
  }

  /**
   * Execute a tool call on the best available idle agent.
   */
  async executeOnBestAgent(toolName: string, parameters: Record<string, unknown>): Promise<ToolCallResult> {
    const idleAgents = this.listAgents('READY');
    if (idleAgents.length === 0) {
      throw new Error('No idle agents available');
    }

    // Pick the agent with fewest results (least loaded)
    const bestAgent = idleAgents.reduce((a, b) => a.results.length - b.results.length, idleAgents[0]);

    const callId = `call-${String(++this.toolCallCounter).padStart(6, '0')}`;
    return this.executeTool({
      callId,
      agentId: bestAgent.agentId,
      toolName,
      parameters,
      priority: 0,
    });
  }

  // =====================================================================
  // RESULT AGGREGATION
  // =====================================================================

  /**
   * Aggregate results from multiple agents.
   */
  aggregateResults(taskId: string, agentResults: Map<string, ToolCallResult[]>): AggregatedResult {
    const successfulAgents: string[] = [];
    const failedAgents: string[] = [];
    const errors: string[] = [];
    const combinedOutput: Record<string, unknown> = {};
    let totalDurationMs = 0;

    for (const [agentId, results] of agentResults) {
      const allSucceeded = results.every((r) => r.status === 'SUCCEEDED');
      const anyFailed = results.some((r) => r.status === 'FAILED');

      if (allSucceeded) {
        successfulAgents.push(agentId);
      } else if (anyFailed) {
        failedAgents.push(agentId);
        for (const result of results) {
          if (result.status === 'FAILED' && result.error) {
            errors.push(`[${agentId}] ${result.error}`);
          }
        }
      }

      for (const result of results) {
        totalDurationMs += result.durationMs;
        if (result.status === 'SUCCEEDED' && result.result !== undefined) {
          combinedOutput[`${agentId}.${result.toolName}`] = result.result;
        }
      }
    }

    const overallStatus =
      failedAgents.length === 0
        ? 'COMPLETED'
        : successfulAgents.length > 0
          ? 'PARTIAL'
          : 'FAILED';

    return {
      taskId,
      agentResults,
      overallStatus,
      successfulAgents,
      failedAgents,
      totalDurationMs,
      combinedOutput,
      errors,
    };
  }

  // =====================================================================
  // HEALTH MONITORING
  // =====================================================================

  /**
   * Run a health check on all agents.
   */
  healthCheck(): { healthy: boolean; agents: { agentId: string; status: string; healthy: boolean }[] } {
    const agentHealth = Array.from(this.agents.values()).map((agent) => ({
      agentId: agent.agentId,
      status: agent.status,
      healthy: agent.status !== 'ERROR' && agent.status !== 'TERMINATED',
    }));

    const healthy = agentHealth.every((a) => a.healthy);

    // Auto-recover unhealthy agents
    if (this.options.autoRecoverAgents) {
      for (const agent of this.agents.values()) {
        if (agent.status === 'ERROR') {
          this.recoverAgent(agent.agentId);
        }
      }
    }

    return { healthy, agents: agentHealth };
  }

  /**
   * Get server metrics.
   */
  getMetrics(): AgentServerMetrics {
    const all = Array.from(this.agents.values());
    const allResults = all.flatMap((a) => a.results);
    const successful = allResults.filter((r) => r.status === 'SUCCEEDED');
    const failed = allResults.filter((r) => r.status === 'FAILED');
    const avgDuration = allResults.length > 0
      ? Math.round(allResults.reduce((sum, r) => sum + r.durationMs, 0) / allResults.length)
      : 0;

    const uptimeMs = Date.now() - new Date(this.startedAt).getTime();

    return {
      totalAgents: all.length,
      activeAgents: all.filter((a) => a.status !== 'IDLE' && a.status !== 'SHUTDOWN' && a.status !== 'TERMINATED').length,
      idleAgents: all.filter((a) => a.status === 'IDLE' || a.status === 'READY').length,
      busyAgents: all.filter((a) => a.status === 'BUSY').length,
      errorAgents: all.filter((a) => a.status === 'ERROR').length,
      totalToolCalls: allResults.length,
      successfulToolCalls: successful.length,
      failedToolCalls: failed.length,
      averageToolDurationMs: avgDuration,
      uptimeMs,
    };
  }

  // =====================================================================
  // CLEANUP
  // =====================================================================

  /**
   * Shutdown the server and clean up.
   */
  shutdown(): void {
    this.stopHealthCheck();
    for (const agentId of this.agents.keys()) {
      this.shutdownAgent(agentId);
    }
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  private startHealthCheck(): void {
    if (this.options.healthCheckIntervalMs > 0) {
      this.healthCheckTimer = setInterval(() => {
        this.healthCheck();
      }, this.options.healthCheckIntervalMs);
    }
  }

  private stopHealthCheck(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve()
        .then(() => fn())
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

// =====================================================================
// CONVENIENCE FUNCTIONS
// =====================================================================

export function createAgentServer(options?: AgentServerOptions): AgentServer {
  return new AgentServer(options);
}

export function spawnDefaultAgent(spec: AgentSpec, server: AgentServer): AgentInstance {
  return server.spawnAgent(spec);
}
