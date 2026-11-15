/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Workflow Composer
 * (src/core/creative/workflowComposer.ts)
 *
 * Node-based pipeline definition, validation, dependency resolution, and
 * execution engine. Inspired by ComfyUI's node graph architecture
 * (GPL-3.0, studied as out-of-process reference — AETHER implementation
 * is a clean-room TypeScript data model).
 *
 * Core abstractions:
 *   - WorkflowNode: a single operation unit in the graph
 *   - WorkflowEdge: a connection between nodes
 *   - WorkflowGraph: the complete DAG of nodes and edges
 *   - WorkflowComposer: builder for constructing graphs
 *   - WorkflowValidator: validates graph integrity
 *   - WorkflowExecutor: executes the graph in topological order
 */

// ─── Socket / Port Types ──────────────────────────────────────────────────────

export type SocketDataType = 'image' | 'text' | 'number' | 'boolean' | 'latent' | 'mask' | 'conditioning' | 'model' | 'any';

export interface WorkflowSocket {
  socketId: string;
  nodeId: string;
  name: string;
  dataType: SocketDataType;
  isInput: boolean;
  required: boolean;
  defaultValue?: unknown;
}

export interface WorkflowEdge {
  edgeId: string;
  /** Source node and output socket */
  fromNodeId: string;
  fromSocket: string;
  /** Destination node and input socket */
  toNodeId: string;
  toSocket: string;
}

// ─── Node Definition ─────────────────────────────────────────────────────────

export type NodeCategory = 'input' | 'processing' | 'output' | 'conditioning' | 'latent' | 'model' | 'utility';

export interface WorkflowNodeDefinition {
  nodeType: string;
  displayName: string;
  category: NodeCategory;
  description: string;
  inputs: WorkflowSocket[];
  outputs: WorkflowSocket[];
  /** Parameter schema: key -> { type, required, default, description } */
  parameters: Record<string, { type: string; required: boolean; default?: unknown; description: string }>;
  /** Whether multiple instances are allowed */
  allowMultiple: boolean;
  /** Tags for filtering and discovery */
  tags: string[];
}

// ─── Workflow Node Instance ──────────────────────────────────────────────────

export interface WorkflowNode {
  nodeId: string;
  nodeType: string;
  /** Resolved parameter values */
  parameters: Record<string, unknown>;
  /** Input edges (resolved from graph) */
  inputs: Array<{ edgeId: string; fromNodeId: string; fromSocket: string; toSocket: string }>;
  /** Output socket names this node produces */
  outputs: string[];
  /** Whether this node has been executed */
  executed: boolean;
  /** Execution result (populated after execution) */
  result?: unknown;
  /** Execution error (populated on failure) */
  error?: string;
}

// ─── Graph ───────────────────────────────────────────────────────────────────

export interface WorkflowGraph {
  graphId: string;
  name: string;
  description: string;
  version: string;
  nodes: Map<string, WorkflowNode>;
  edges: WorkflowEdge[];
  /** Input nodes (no incoming edges) */
  inputNodes: string[];
  /** Output nodes (no outgoing edges) */
  outputNodes: string[];
  /** Topological execution layers */
  layers: string[][];
  /** Whether the graph has been validated */
  isValid: boolean;
  /** Validation errors */
  validationErrors: string[];
  /** Metadata */
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  severity: 'error' | 'critical';
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  severity: 'warning' | 'info';
  code: string;
  message: string;
  nodeId?: string;
  suggestion?: string;
}

// ─── Execution ───────────────────────────────────────────────────────────────

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionContext {
  executionId: string;
  graphId: string;
  status: ExecutionStatus;
  currentLayer: number;
  currentNodeId?: string;
  /** Execution results per node */
  nodeResults: Map<string, unknown>;
  /** Errors per node */
  nodeErrors: Map<string, string>;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  /** Timestamps per layer */
  layerTimings: Array<{ layer: number; startedAt: string; completedAt?: string; durationMs?: number }>;
}

export interface ExecutionOptions {
  /** Whether to pause between layers for inspection */
  pauseBetweenLayers: boolean;
  /** Maximum execution timeout in milliseconds */
  timeoutMs: number;
  /** Whether to continue on node failure */
  continueOnError: boolean;
  /** Execution priority */
  priority: 'low' | 'normal' | 'high';
}

export const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  pauseBetweenLayers: false,
  timeoutMs: 300_000,
  continueOnError: false,
  priority: 'normal',
};

// ─── Composer (Builder) ──────────────────────────────────────────────────────

export interface ComposerOptions {
  /** Node type registry for validation */
  nodeRegistry: Map<string, WorkflowNodeDefinition>;
  /** Whether to auto-detect cycles */
  detectCycles: boolean;
  /** Whether to validate on every mutation */
  validateOnChange: boolean;
}

// ─── Execution Engine ────────────────────────────────────────────────────────

export interface ExecutionEngine {
  /** Execute the entire graph */
  execute(graph: WorkflowGraph, options?: Partial<ExecutionOptions>): Promise<ExecutionContext>;

  /** Execute a single node */
  executeNode(
    node: WorkflowNode,
    context: ExecutionContext,
    inputs: Record<string, unknown>,
  ): Promise<{ result: unknown; error?: string }>;

  /** Pause execution */
  pause(executionId: string): Promise<void>;

  /** Resume execution */
  resume(executionId: string): Promise<void>;

  /** Cancel execution */
  cancel(executionId: string): Promise<void>;

  /** Get current execution state */
  getExecution(executionId: string): ExecutionContext | undefined;

  /** List all active executions */
  listExecutions(): ExecutionContext[];
}

// ─── Node Executor Interface ─────────────────────────────────────────────────

export interface NodeExecutor {
  /** Execute a node of a given type */
  execute(
    nodeType: string,
    node: WorkflowNode,
    inputs: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<{ result: unknown; error?: string }>;

  /** Whether this executor can handle the given node type */
  canHandle(nodeType: string): boolean;

  /** Priority for matching (higher = preferred) */
  priority: number;
}

// ─── Dependency Resolver ─────────────────────────────────────────────────────

export interface DependencyResolver {
  /** Compute topological layers from graph */
  computeLayers(graph: WorkflowGraph): string[][];

  /** Detect cycles in the graph */
  detectCycles(graph: WorkflowGraph): string[] | null;

  /** Validate that all edge connections are valid */
  validateEdges(graph: WorkflowGraph): ValidationResult;

  /** Resolve execution order */
  resolveExecutionOrder(graph: WorkflowGraph): string[];
}

// ─── Registry ────────────────────────────────────────────────────────────────

export interface WorkflowRegistryEntry {
  graphId: string;
  name: string;
  version: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRegistry {
  /** Register a new workflow graph */
  register(graph: WorkflowGraph): Promise<void>;

  /** Retrieve a workflow by ID */
  get(graphId: string): WorkflowGraph | undefined;

  /** List all registered workflows */
  list(): WorkflowRegistryEntry[];

  /** Search workflows by tag */
  searchByTag(tag: string): WorkflowRegistryEntry[];

  /** Update an existing workflow */
  update(graphId: string, updates: Partial<WorkflowGraph>): Promise<WorkflowGraph | undefined>;

  /** Remove a workflow */
  remove(graphId: string): Promise<boolean>;
}

// ─── Serialization ───────────────────────────────────────────────────────────

export interface WorkflowSerializationFormat {
  format: 'json' | 'yaml';
  includeMetadata: boolean;
  includeExecutionResults: boolean;
}

export interface SerializedWorkflow {
  format: string;
  version: string;
  graph: Partial<WorkflowGraph>;
  serializedAt: string;
}
