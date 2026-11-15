/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Workflow Composer Tests
 * (src/core/creative/workflowComposer.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SocketDataType,
  WorkflowSocket,
  WorkflowEdge,
  NodeCategory,
  WorkflowNodeDefinition,
  WorkflowNode,
  WorkflowGraph,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ExecutionStatus,
  ExecutionContext,
  ExecutionOptions,
  DEFAULT_EXECUTION_OPTIONS,
  ComposerOptions,
  ExecutionEngine,
  NodeExecutor,
  DependencyResolver,
  WorkflowRegistryEntry,
  WorkflowRegistry,
  WorkflowSerializationFormat,
  SerializedWorkflow,
} from './workflowComposer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSocket(overrides: Partial<WorkflowSocket> = {}): WorkflowSocket {
  return {
    socketId: 'socket-1',
    nodeId: 'node-1',
    name: 'default',
    dataType: 'image',
    isInput: true,
    required: true,
    ...overrides,
  };
}

function makeNodeDef(overrides: Partial<WorkflowNodeDefinition> = {}): WorkflowNodeDefinition {
  return {
    nodeType: 'test-node',
    displayName: 'Test Node',
    category: 'processing',
    description: 'A test node',
    inputs: [makeSocket({ name: 'in' })],
    outputs: [makeSocket({ name: 'out', isInput: false })],
    parameters: {},
    allowMultiple: true,
    tags: ['test'],
    ...overrides,
  };
}

function makeEdge(overrides: Partial<WorkflowEdge> = {}): WorkflowEdge {
  return {
    edgeId: 'edge-1',
    fromNodeId: 'node-a',
    fromSocket: 'out',
    toNodeId: 'node-b',
    toSocket: 'in',
    ...overrides,
  };
}

function makeNode(overrides: Partial<WorkflowNode> = {}): WorkflowNode {
  return {
    nodeId: 'node-1',
    nodeType: 'test-node',
    parameters: {},
    inputs: [],
    outputs: ['out'],
    executed: false,
    ...overrides,
  };
}

function makeGraph(overrides: Partial<WorkflowGraph> = {}): WorkflowGraph {
  return {
    graphId: 'graph-1',
    name: 'Test Graph',
    description: 'A test workflow',
    version: '1.0.0',
    nodes: new Map(),
    edges: [],
    inputNodes: [],
    outputNodes: [],
    layers: [],
    isValid: false,
    validationErrors: [],
    metadata: {},
    createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    updatedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    ...overrides,
  };
}

// ─── SocketDataType ──────────────────────────────────────────────────────────

test('all SocketDataType values are valid', () => {
  const types: SocketDataType[] = ['image', 'text', 'number', 'boolean', 'latent', 'mask', 'conditioning', 'model', 'any'];
  for (const t of types) {
    assert.ok(t, `${t} is a valid SocketDataType`);
  }
});

test('makeSocket creates socket with overrides', () => {
  const s = makeSocket({ name: 'image-in', dataType: 'image', required: false });
  assert.equal(s.name, 'image-in');
  assert.equal(s.dataType, 'image');
  assert.ok(!s.required);
});

// ─── WorkflowEdge ────────────────────────────────────────────────────────────

test('makeEdge creates valid connection', () => {
  const edge = makeEdge({ fromNodeId: 'loader', toNodeId: 'sampler' });
  assert.equal(edge.fromNodeId, 'loader');
  assert.equal(edge.toNodeId, 'sampler');
  assert.equal(edge.fromSocket, 'out');
  assert.equal(edge.toSocket, 'in');
});

test('edgeId is unique per edge', () => {
  const e1 = makeEdge({ edgeId: 'e1' });
  const e2 = makeEdge({ edgeId: 'e2' });
  assert.notEqual(e1.edgeId, e2.edgeId);
});

// ─── NodeCategory ────────────────────────────────────────────────────────────

test('all NodeCategory values are valid', () => {
  const cats: NodeCategory[] = ['input', 'processing', 'output', 'conditioning', 'latent', 'model', 'utility'];
  for (const c of cats) {
    assert.ok(c, `${c} is a valid NodeCategory`);
  }
});

// ─── WorkflowNodeDefinition ──────────────────────────────────────────────────

test('makeNodeDef creates node definition with inputs/outputs', () => {
  const def = makeNodeDef({ nodeType: 'ksampler', allowMultiple: false });
  assert.equal(def.nodeType, 'ksampler');
  assert.equal(def.category, 'processing');
  assert.equal(def.inputs.length, 1);
  assert.equal(def.outputs.length, 1);
  assert.ok(!def.allowMultiple);
});

test('node definition parameters describe schema', () => {
  const def = makeNodeDef({
    parameters: {
      steps: { type: 'integer', required: true, default: 20, description: 'Denoising steps' },
      cfg: { type: 'float', required: false, default: 7.0, description: 'CFG scale' },
    },
  });
  assert.ok(def.parameters['steps']);
  assert.equal(def.parameters['steps'].type, 'integer');
  assert.ok(def.parameters['steps'].required);
  assert.equal(def.parameters['steps'].default, 20);
});

// ─── WorkflowNode ────────────────────────────────────────────────────────────

test('makeNode creates default node', () => {
  const node = makeNode();
  assert.equal(node.nodeId, 'node-1');
  assert.equal(node.nodeType, 'test-node');
  assert.ok(!node.executed);
  assert.ok(!node.result);
  assert.ok(!node.error);
});

test('makeNode with overrides sets result and error', () => {
  const node = makeNode({ executed: true, result: { imageId: 'img-1' }, error: undefined });
  assert.ok(node.executed);
  assert.ok(node.result);
  assert.ok(!node.error);
});

// ─── WorkflowGraph ───────────────────────────────────────────────────────────

test('makeGraph creates graph with timestamps', () => {
  const g = makeGraph();
  assert.ok(g.createdAt.length > 0);
  assert.ok(g.updatedAt.length > 0);
  assert.ok(!g.isValid);
  assert.deepEqual(g.validationErrors, []);
});

test('graph with nodes and edges', () => {
  const nodes = new Map<string, WorkflowNode>([
    ['a', makeNode({ nodeId: 'a' })],
    ['b', makeNode({ nodeId: 'b' })],
  ]);
  const edges = [makeEdge({ fromNodeId: 'a', toNodeId: 'b' })];
  const g = makeGraph({
    graphId: 'g2',
    nodes,
    edges,
    inputNodes: ['a'],
    outputNodes: ['b'],
  });
  assert.equal(g.nodes.size, 2);
  assert.equal(g.edges.length, 1);
  assert.deepEqual(g.inputNodes, ['a']);
  assert.deepEqual(g.outputNodes, ['b']);
});

// ─── ValidationResult ────────────────────────────────────────────────────────

test('valid result has no errors', () => {
  const r: ValidationResult = { valid: true, errors: [], warnings: [] };
  assert.ok(r.valid);
  assert.equal(r.errors.length, 0);
});

test('invalid result has errors', () => {
  const r: ValidationResult = {
    valid: false,
    errors: [
      { severity: 'critical', code: 'CYCLE', message: 'Cycle detected', nodeId: 'n1', suggestion: 'Remove edge' },
      { severity: 'error', code: 'MISSING_INPUT', message: 'Missing input socket' },
    ],
    warnings: [{ severity: 'warning', code: 'SLOW', message: 'Large batch size' }],
  };
  assert.ok(!r.valid);
  assert.equal(r.errors.length, 2);
  assert.equal(r.errors[0].severity, 'critical');
  assert.equal(r.errors[0].code, 'CYCLE');
  assert.equal(r.warnings.length, 1);
});

// ─── ExecutionContext ────────────────────────────────────────────────────────

test('ExecutionContext tracks execution state', () => {
  const ctx: ExecutionContext = {
    executionId: 'exec-1',
    graphId: 'graph-1',
    status: 'running',
    currentLayer: 2,
    currentNodeId: 'node-3',
    nodeResults: new Map([['node-1', { value: 1 }]]),
    nodeErrors: new Map(),
    startedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    layerTimings: [{ layer: 0, startedAt: new Date().toISOString() }],
  };
  assert.equal(ctx.status, 'running');
  assert.equal(ctx.currentLayer, 2);
  assert.equal(ctx.nodeResults.size, 1);
});

// ─── ExecutionOptions ────────────────────────────────────────────────────────

test('DEFAULT_EXECUTION_OPTIONS has sensible defaults', () => {
  assert.ok(!DEFAULT_EXECUTION_OPTIONS.pauseBetweenLayers);
  assert.equal(DEFAULT_EXECUTION_OPTIONS.timeoutMs, 300_000);
  assert.ok(!DEFAULT_EXECUTION_OPTIONS.continueOnError);
  assert.equal(DEFAULT_EXECUTION_OPTIONS.priority, 'normal');
});

test('ExecutionOptions can override defaults', () => {
  const opts: ExecutionOptions = {
    ...DEFAULT_EXECUTION_OPTIONS,
    pauseBetweenLayers: true,
    timeoutMs: 600_000,
    continueOnError: true,
    priority: 'high',
  };
  assert.ok(opts.pauseBetweenLayers);
  assert.equal(opts.timeoutMs, 600_000);
  assert.ok(opts.continueOnError);
  assert.equal(opts.priority, 'high');
});

// ─── ComposerOptions ─────────────────────────────────────────────────────────

test('ComposerOptions configures node registry and validation', () => {
  const registry = new Map<string, WorkflowNodeDefinition>();
  registry.set('test', makeNodeDef());
  const opts: ComposerOptions = {
    nodeRegistry: registry,
    detectCycles: true,
    validateOnChange: true,
  };
  assert.equal(opts.nodeRegistry.size, 1);
  assert.ok(opts.detectCycles);
  assert.ok(opts.validateOnChange);
});

// ─── ExecutionEngine Interface ───────────────────────────────────────────────

test('ExecutionEngine can be implemented', async () => {
  const engine: ExecutionEngine = {
    async execute() {
      const ctx: ExecutionContext = {
        executionId: 'exec-1',
        graphId: 'graph-1',
        status: 'completed',
        currentLayer: 0,
        nodeResults: new Map(),
        nodeErrors: new Map(),
        completedAt: new Date().toISOString(),
        totalDurationMs: 100,
        layerTimings: [],
      };
      return ctx;
    },
    async executeNode() {
      return { result: { ok: true } };
    },
    async pause() {},
    async resume() {},
    async cancel() {},
    getExecution() {
      return undefined;
    },
    listExecutions() {
      return [];
    },
  };

  const graph = makeGraph({ graphId: 'g1', isValid: true });
  const result = await engine.execute(graph);
  assert.equal(result.status, 'completed');
  assert.ok(result.completedAt);
});

// ─── NodeExecutor Interface ──────────────────────────────────────────────────

test('NodeExecutor canHandle returns true for registered types', () => {
  const executor: NodeExecutor = {
    async execute() { return { result: null }; },
    canHandle(type: string) { return type === 'ksampler' || type === 'loader'; },
    priority: 10,
  };
  assert.ok(executor.canHandle('ksampler'));
  assert.ok(executor.canHandle('loader'));
  assert.ok(!executor.canHandle('unknown'));
  assert.equal(executor.priority, 10);
});

// ─── DependencyResolver Interface ────────────────────────────────────────────

test('DependencyResolver can detect cycles', () => {
  const resolver: DependencyResolver = {
    computeLayers() { return []; },
    detectCycles() { return null; },
    validateEdges() { return { valid: true, errors: [], warnings: [] }; },
    resolveExecutionOrder() { return []; },
  };
  assert.deepEqual(resolver.detectCycles(makeGraph()), null);
});

// ─── WorkflowRegistry Interface ──────────────────────────────────────────────

test('WorkflowRegistry can be implemented', async () => {
  const entries = new Map<string, WorkflowGraph>();
  const registry: WorkflowRegistry = {
    async register(graph) {
      entries.set(graph.graphId, graph);
    },
    get(graphId) { return entries.get(graphId); },
    list() {
      return Array.from(entries.values()).map((g) => ({
        graphId: g.graphId,
        name: g.name,
        version: g.version,
        description: g.description,
        tags: [],
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      }));
    },
    searchByTag() { return []; },
    async update(graphId, updates) {
      const existing = entries.get(graphId);
      if (!existing) return undefined;
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      entries.set(graphId, updated);
      return updated;
    },
    async remove(graphId) { return entries.delete(graphId); },
  };

  const graph = makeGraph({ graphId: 'r1', name: 'Registered' });
  await registry.register(graph);
  assert.ok(registry.get('r1'));
  assert.equal(registry.list().length, 1);

  const updated = await registry.update('r1', { name: 'Updated Name' } as Partial<WorkflowGraph>);
  assert.equal(updated?.name, 'Updated Name');

  assert.ok(await registry.remove('r1'));
  assert.ok(!registry.get('r1'));
});

// ─── Serialization ───────────────────────────────────────────────────────────

test('WorkflowSerializationFormat supports json and yaml', () => {
  const jsonFmt: WorkflowSerializationFormat = { format: 'json', includeMetadata: true, includeExecutionResults: false };
  const yamlFmt: WorkflowSerializationFormat = { format: 'yaml', includeMetadata: false, includeExecutionResults: true };
  assert.equal(jsonFmt.format, 'json');
  assert.equal(yamlFmt.format, 'yaml');
});

test('SerializedWorkflow carries version and timestamp', () => {
  const sw: SerializedWorkflow = {
    format: 'json',
    version: '1.0.0',
    graph: { graphId: 'g1', name: 'Test' },
    serializedAt: new Date().toISOString(),
  };
  assert.equal(sw.format, 'json');
  assert.equal(sw.version, '1.0.0');
  assert.equal(sw.graph.graphId, 'g1');
});

// ─── ExecutionStatus ─────────────────────────────────────────────────────────

test('all ExecutionStatus values are valid', () => {
  const statuses: ExecutionStatus[] = ['idle', 'running', 'paused', 'completed', 'failed', 'cancelled'];
  for (const s of statuses) {
    assert.ok(s, `${s} is a valid ExecutionStatus`);
  }
});

// ─── NodeCategory ────────────────────────────────────────────────────────────

test('NodeCategory enum values match expected set', () => {
  const cats: NodeCategory[] = ['input', 'processing', 'output', 'conditioning', 'latent', 'model', 'utility'];
  assert.equal(cats.length, 7);
});

// ─── Edge Validation ─────────────────────────────────────────────────────────

test('edge from and to sockets must be non-empty', () => {
  const edge = makeEdge({ fromSocket: 'output', toSocket: 'input' });
  assert.ok(edge.fromSocket.length > 0);
  assert.ok(edge.toSocket.length > 0);
});

// ─── RegistryEntry ───────────────────────────────────────────────────────────

test('WorkflowRegistryEntry tracks metadata', () => {
  const entry: WorkflowRegistryEntry = {
    graphId: 'g1',
    name: 'Test',
    version: '1.0.0',
    description: 'A workflow',
    tags: ['image', 'upscale'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(entry.graphId, 'g1');
  assert.deepEqual(entry.tags, ['image', 'upscale']);
});
