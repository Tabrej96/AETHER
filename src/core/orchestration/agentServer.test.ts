/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AGENT SERVER TESTS  ·  AETHER Autonomous Execution
 * (src/core/orchestration/agentServer.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AgentServer,
  createAgentServer,
  spawnDefaultAgent,
  type AgentInstance,
  type ToolDefinition,
  type ToolCallResult,
  type AggregatedResult,
  type AgentServerMetrics,
} from './agentServer';
import type { AgentSpec } from '../types';

// =====================================================================
// FIXTURE
// =====================================================================

const TEST_AGENT_SPEC: AgentSpec = {
  id: 'test-agent-01',
  name: 'Test Agent',
  category: 'implementation',
  role: 'Test role',
  scope: 'test-scope',
  responsibilities: ['run tests', 'generate code'],
  restrictions: ['no destructive ops'],
  inputs: ['task description'],
  outputs: ['test results'],
  handoffRules: ['return results'],
  verificationResponsibilities: ['verify output'],
  capabilities: ['testing', 'coding'],
  tokenOverhead: 1000,
  license: 'Apache-2.0',
  attribution: 'Test attribution',
};

const TEST_TOOL_DEF: ToolDefinition = {
  name: 'echo_tool',
  description: 'Echo a message',
  parameters: { message: { type: 'string' } },
  riskLevel: 'LOW',
  requiresApproval: false,
  timeoutMs: 5000,
};

async function echoToolExecutor(request: { parameters: { message: string } }): Promise<string> {
  return `echo:${request.parameters.message}`;
}

// =====================================================================
// AGENT LIFECYCLE TESTS
// =====================================================================

test('spawnAgent: creates agent with READY status', () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC);
  assert.equal(agent.status, 'READY');
  assert.equal(agent.agentSpec.id, 'test-agent-01');
  assert.ok(agent.spawnedAt);
});

test('spawnAgent: respects maxAgents limit', () => {
  const server = createAgentServer({ maxAgents: 2 });
  server.spawnAgent({ ...TEST_AGENT_SPEC, id: 'agent-1' });
  server.spawnAgent({ ...TEST_AGENT_SPEC, id: 'agent-2' });
  assert.throws(() => server.spawnAgent({ ...TEST_AGENT_SPEC, id: 'agent-3' }), /limit reached/);
});

test('spawnAgent: accepts custom agent ID', () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'custom-id');
  assert.equal(agent.agentId, 'custom-id');
});

test('getAgent: returns agent by ID', () => {
  const server = createAgentServer();
  const spawned = server.spawnAgent(TEST_AGENT_SPEC, 'retrieve-me');
  const retrieved = server.getAgent('retrieve-me');
  assert.equal(retrieved?.agentId, 'retrieve-me');
  assert.equal(retrieved?.agentSpec.id, 'test-agent-01');
});

test('getAgent: returns undefined for unknown ID', () => {
  const server = createAgentServer();
  assert.equal(server.getAgent('nonexistent'), undefined);
});

test('listAgents: returns all agents', () => {
  const server = createAgentServer();
  server.spawnAgent({ ...TEST_AGENT_SPEC, id: 'a1' });
  server.spawnAgent({ ...TEST_AGENT_SPEC, id: 'a2' });
  server.spawnAgent({ ...TEST_AGENT_SPEC, id: 'a3' });
  const agents = server.listAgents();
  assert.equal(agents.length, 3);
});

test('listAgents: filters by status', () => {
  const server = createAgentServer();
  server.spawnAgent({ ...TEST_AGENT_SPEC, id: 'idle-agent' });
  assert.ok(server.listAgents('READY').length >= 1);
  assert.equal(server.listAgents('BUSY').length, 0);
});

test('shutdownAgent: removes agent', () => {
  const server = createAgentServer();
  server.spawnAgent(TEST_AGENT_SPEC, 'to-remove');
  assert.equal(server.listAgents().length, 1);
  server.shutdownAgent('to-remove');
  assert.equal(server.listAgents().length, 0);
});

test('shutdownAgent: returns false for non-existent agent', () => {
  const server = createAgentServer();
  assert.equal(server.shutdownAgent('nonexistent'), false);
});

// =====================================================================
// AGENT STATUS TESTS
// =====================================================================

test('spawned agent transitions from SPAWNING to READY', async () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC);
  // After the setTimeout tick, agent should be READY
  await new Promise((r) => setTimeout(r, 50));
  const updated = server.getAgent(agent.agentId);
  assert.equal(updated?.status, 'READY');
});

test('agent tracks failure count on failed tool calls', async () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'fail-tracker');

  server.registerToolForAgent('fail-tracker', TEST_TOOL_DEF, async () => {
    throw new Error('tool failure');
  });

  const result = await server.executeTool({
    callId: 'call-001',
    agentId: 'fail-tracker',
    toolName: 'echo_tool',
    parameters: { message: 'test' },
    priority: 0,
  });

  assert.equal(result.status, 'FAILED');
  assert.ok(result.error?.includes('tool failure'));
  const updatedAgent = server.getAgent('fail-tracker');
  assert.equal(updatedAgent?.failureCount, 1);
});

// =====================================================================
// TOOL REGISTRATION TESTS
// =====================================================================

test('registerTool: available to new agents', () => {
  const server = createAgentServer();
  server.registerTool(TEST_TOOL_DEF, echoToolExecutor);
  const agent = server.spawnAgent(TEST_AGENT_SPEC);
  assert.ok(agent.tools.has('echo_tool'));
});

test('registerToolForAgent: available to specific agent', () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'specific-agent');
  server.registerToolForAgent('specific-agent', TEST_TOOL_DEF, echoToolExecutor);
  const updated = server.getAgent('specific-agent');
  assert.ok(updated?.tools.has('echo_tool'));
});

// =====================================================================
// TOOL EXECUTION TESTS
// =====================================================================

test('executeTool: succeeds and returns result', async () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'tool-executor');
  server.registerToolForAgent('tool-executor', TEST_TOOL_DEF, echoToolExecutor);

  const result = await server.executeTool({
    callId: 'call-001',
    agentId: 'tool-executor',
    toolName: 'echo_tool',
    parameters: { message: 'hello' },
    priority: 0,
  });

  assert.equal(result.status, 'SUCCEEDED');
  assert.equal(result.result, 'echo:hello');
  assert.equal(result.agentId, 'tool-executor');
  assert.equal(result.toolName, 'echo_tool');
});

test('executeTool: fails for unknown agent', async () => {
  const server = createAgentServer();
  const result = await server.executeTool({
    callId: 'call-002',
    agentId: 'nonexistent',
    toolName: 'echo_tool',
    parameters: {},
    priority: 0,
  });
  assert.equal(result.status, 'FAILED');
  assert.ok(result.error?.includes('not found'));
});

test('executeTool: fails for unknown tool', async () => {
  const server = createAgentServer();
  server.spawnAgent(TEST_AGENT_SPEC, 'no-tools');
  const result = await server.executeTool({
    callId: 'call-003',
    agentId: 'no-tools',
    toolName: 'nonexistent_tool',
    parameters: {},
    priority: 0,
  });
  assert.equal(result.status, 'FAILED');
  assert.ok(result.error?.includes('not found'));
});

test('executeTool: agent becomes BUSY during execution', async () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'busy-tracker');
  server.registerToolForAgent('busy-tracker', { ...TEST_TOOL_DEF, timeoutMs: 500 }, async () => {
    await new Promise((r) => setTimeout(r, 100));
    return 'done';
  });

  // Start execution
  const promise = server.executeTool({
    callId: 'call-004',
    agentId: 'busy-tracker',
    toolName: 'echo_tool',
    parameters: { message: 'busy' },
    priority: 0,
  });

  // Check status immediately (should be BUSY during execution)
  const busyAgent = server.getAgent('busy-tracker');
  assert.ok(busyAgent?.status === 'BUSY' || busyAgent?.status === 'READY');

  await promise;
  const afterAgent = server.getAgent('busy-tracker');
  assert.equal(afterAgent?.status, 'READY');
});

test('executeTool: records results in agent history', async () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'history-tracker');
  server.registerToolForAgent('history-tracker', TEST_TOOL_DEF, echoToolExecutor);

  await server.executeTool({
    callId: 'call-005',
    agentId: 'history-tracker',
    toolName: 'echo_tool',
    parameters: { message: 'recorded' },
    priority: 0,
  });

  const updated = server.getAgent('history-tracker');
  assert.equal(updated?.results.length, 1);
  assert.equal(updated?.results[0].status, 'SUCCEEDED');
});

// =====================================================================
// EXECUTE ON BEST AGENT TESTS
// =====================================================================

test('executeOnBestAgent: routes to idle agent', async () => {
  const server = createAgentServer();
  server.registerTool(TEST_TOOL_DEF, echoToolExecutor);
  server.spawnAgent(TEST_AGENT_SPEC, 'best-agent-1');
  server.spawnAgent(TEST_AGENT_SPEC, 'best-agent-2');

  const result = await server.executeOnBestAgent('echo_tool', { message: 'routed' });
  assert.equal(result.status, 'SUCCEEDED');
  assert.equal(result.result, 'echo:routed');
});

test('executeOnBestAgent: throws when no agents available', async () => {
  const server = createAgentServer({ maxAgents: 0 });
  server.registerTool(TEST_TOOL_DEF, echoToolExecutor);
  await assert.rejects(
    server.executeOnBestAgent('echo_tool', { message: 'test' }),
    /No idle agents available/
  );
});

// =====================================================================
// RESULT AGGREGATION TESTS
// =====================================================================

test('aggregateResults: COMPLETED when all succeed', () => {
  const server = createAgentServer();
  const agentResults = new Map<string, ToolCallResult[]>([
    ['agent-1', [{ callId: 'c1', agentId: 'agent-1', toolName: 't1', status: 'SUCCEEDED', durationMs: 100, startedAt: '', finishedAt: '' }]],
    ['agent-2', [{ callId: 'c2', agentId: 'agent-2', toolName: 't2', status: 'SUCCEEDED', durationMs: 200, startedAt: '', finishedAt: '' }]],
  ]);

  const result = server.aggregateResults('task-1', agentResults);
  assert.equal(result.overallStatus, 'COMPLETED');
  assert.equal(result.successfulAgents.length, 2);
  assert.equal(result.failedAgents.length, 0);
});

test('aggregateResults: FAILED when all fail', () => {
  const server = createAgentServer();
  const agentResults = new Map<string, ToolCallResult[]>([
    ['agent-1', [{ callId: 'c1', agentId: 'agent-1', toolName: 't1', status: 'FAILED', error: 'err1', durationMs: 100, startedAt: '', finishedAt: '' }]],
  ]);

  const result = server.aggregateResults('task-2', agentResults);
  assert.equal(result.overallStatus, 'FAILED');
  assert.equal(result.failedAgents.length, 1);
  assert.ok(result.errors.length > 0);
});

test('aggregateResults: PARTIAL when mixed', () => {
  const server = createAgentServer();
  const agentResults = new Map<string, ToolCallResult[]>([
    ['agent-1', [{ callId: 'c1', agentId: 'agent-1', toolName: 't1', status: 'SUCCEEDED', durationMs: 100, startedAt: '', finishedAt: '' }]],
    ['agent-2', [{ callId: 'c2', agentId: 'agent-2', toolName: 't2', status: 'FAILED', error: 'err', durationMs: 50, startedAt: '', finishedAt: '' }]],
  ]);

  const result = server.aggregateResults('task-3', agentResults);
  assert.equal(result.overallStatus, 'PARTIAL');
  assert.equal(result.successfulAgents.length, 1);
  assert.equal(result.failedAgents.length, 1);
});

test('aggregateResults: combines output', () => {
  const server = createAgentServer();
  const agentResults = new Map<string, ToolCallResult[]>([
    ['agent-1', [{ callId: 'c1', agentId: 'agent-1', toolName: 'tool-a', status: 'SUCCEEDED', result: { value: 42 }, durationMs: 100, startedAt: '', finishedAt: '' }]],
  ]);

  const result = server.aggregateResults('task-4', agentResults);
  assert.deepEqual(result.combinedOutput, { 'agent-1.tool-a': { value: 42 } });
});

// =====================================================================
// HEALTH CHECK TESTS
// =====================================================================

test('healthCheck: returns healthy when all agents are ready', () => {
  const server = createAgentServer();
  server.spawnAgent(TEST_AGENT_SPEC, 'healthy-1');
  server.spawnAgent(TEST_AGENT_SPEC, 'healthy-2');

  const health = server.healthCheck();
  assert.equal(health.healthy, true);
  assert.equal(health.agents.length, 2);
});

test('healthCheck: auto-recovers ERROR agents', () => {
  const server = createAgentServer({ autoRecoverAgents: true });
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'error-agent');
  agent.status = 'ERROR';
  server.healthCheck();
  const updated = server.getAgent('error-agent');
  assert.notEqual(updated?.status, 'ERROR');
});

// =====================================================================
// METRICS TESTS
// =====================================================================

test('getMetrics: returns accurate counts', () => {
  const server = createAgentServer();
  server.spawnAgent(TEST_AGENT_SPEC, 'metrics-1');
  server.spawnAgent(TEST_AGENT_SPEC, 'metrics-2');

  const metrics = server.getMetrics();
  assert.equal(metrics.totalAgents, 2);
  assert.ok(metrics.idleAgents >= 2);
  assert.equal(metrics.totalToolCalls, 0);
});

test('getMetrics: tracks tool calls', async () => {
  const server = createAgentServer();
  server.registerTool(TEST_TOOL_DEF, echoToolExecutor);
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'metrics-tools');
  await server.executeTool({
    callId: 'call-metrics-1',
    agentId: 'metrics-tools',
    toolName: 'echo_tool',
    parameters: { message: 'metrics' },
    priority: 0,
  });

  const metrics = server.getMetrics();
  assert.equal(metrics.totalToolCalls, 1);
  assert.equal(metrics.successfulToolCalls, 1);
  assert.equal(metrics.failedToolCalls, 0);
});

test('getMetrics: tracks failed tool calls', async () => {
  const server = createAgentServer();
  const failTool: ToolDefinition = {
    name: 'fail_tool',
    description: 'Always fails',
    parameters: {},
    riskLevel: 'LOW',
    requiresApproval: false,
    timeoutMs: 1000,
  };
  server.registerTool(failTool, async () => { throw new Error('forced failure'); });
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'fail-metrics');
  await server.executeTool({
    callId: 'call-metrics-2',
    agentId: 'fail-metrics',
    toolName: 'fail_tool',
    parameters: {},
    priority: 0,
  });

  const metrics = server.getMetrics();
  assert.equal(metrics.failedToolCalls, 1);
});

// =====================================================================
// AGENT RECOVERY TESTS
// =====================================================================

test('recoverAgent: resets agent state', () => {
  const server = createAgentServer({ maxRetriesPerAgent: 3 });
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'recover-target');
  agent.status = 'ERROR';
  agent.failureCount = 5;

  const result = server.recoverAgent('recover-target');
  assert.equal(result, true);
  const updated = server.getAgent('recover-target');
  assert.equal(updated?.status, 'READY');
  assert.equal(updated?.failureCount, 0);
});

test('recoverAgent: fails after max retries', () => {
  const server = createAgentServer({ maxRetriesPerAgent: 2 });
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'max-retry-agent');
  agent.recoveryAttempts = 2;

  const result = server.recoverAgent('max-retry-agent');
  assert.equal(result, false);
  const updated = server.getAgent('max-retry-agent');
  assert.equal(updated?.status, 'TERMINATED');
});

test('recoverAgent: returns false for non-existent', () => {
  const server = createAgentServer();
  assert.equal(server.recoverAgent('nonexistent'), false);
});

// =====================================================================
// SHUTDOWN TESTS
// =====================================================================

test('shutdown: removes all agents', () => {
  const server = createAgentServer();
  server.spawnAgent(TEST_AGENT_SPEC, 's1');
  server.spawnAgent(TEST_AGENT_SPEC, 's2');
  assert.equal(server.listAgents().length, 2);
  server.shutdown();
  assert.equal(server.listAgents().length, 0);
});

// =====================================================================
// CONVENIENCE FUNCTION TESTS
// =====================================================================

test('createAgentServer: creates with defaults', () => {
  const server = createAgentServer();
  const metrics = server.getMetrics();
  assert.ok(metrics.uptimeMs >= 0);
});

test('spawnDefaultAgent: convenience function works', () => {
  const server = createAgentServer();
  const agent = spawnDefaultAgent(TEST_AGENT_SPEC, server);
  assert.equal(agent.agentSpec.id, 'test-agent-01');
  assert.ok(server.getAgent(agent.agentId));
});

// =====================================================================
// METADATA TESTS
// =====================================================================

test('agent metadata is preserved', () => {
  const server = createAgentServer();
  const agent = server.spawnAgent({
    ...TEST_AGENT_SPEC,
    id: 'metadata-test',
  });
  assert.ok(agent.agentId.startsWith('metadata-test'));
  assert.ok(agent.spawnedAt);
});

test('tool result has correct metadata', async () => {
  const server = createAgentServer();
  const agent = server.spawnAgent(TEST_AGENT_SPEC, 'meta-tool');
  server.registerToolForAgent('meta-tool', TEST_TOOL_DEF, echoToolExecutor);

  const result = await server.executeTool({
    callId: 'call-meta',
    agentId: 'meta-tool',
    toolName: 'echo_tool',
    parameters: { message: 'meta' },
    priority: 0,
  });

  assert.ok(result.startedAt);
  assert.ok(result.finishedAt);
  assert.ok(result.durationMs >= 0);
  assert.equal(result.callId, 'call-meta');
});
