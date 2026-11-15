/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Task Dependency Graph
 *
 * DAG construction from task descriptions, cycle detection, topological
 * sorting, and critical path identification for parallel execution planning.
 *
 * Architectural inspiration: AutoGen's conversation topology and DAG scheduling
 * (archived reference). AETHER-native implementation with formal DAG algorithms.
 *
 * Usage:
 *   import {
 *     createDependencyGraph,
 *     topologicalSort,
 *     detectCycle,
 *     findCriticalPath,
 *     buildFromTaskNodes,
 *     type DependencyNode,
 *     type DependencyEdge,
 *     type DependencyGraph,
 *     type CriticalPathResult,
 *   } from './core/swarm/dependencyGraph';
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DependencyNode {
  /** Unique node identifier */
  id: string;
  /** Human-readable label */
  label: string;
  /** Estimated duration in ms (for critical path) */
  durationMs: number;
  /** Whether this node is a terminal node */
  isTerminal: boolean;
  /** Arbitrary metadata */
  metadata: Record<string, unknown>;
}

export interface DependencyEdge {
  /** Source node id */
  from: string;
  /** Target node id */
  to: string;
  /** Edge weight (0 = no additional cost) */
  weight: number;
}

export interface DependencyGraph {
  /** All nodes in the graph */
  nodes: Map<string, DependencyNode>;
  /** All edges in the graph */
  edges: DependencyEdge[];
  /** Adjacency list: node id -> outgoing targets */
  adjacency: Map<string, string[]>;
  /** Reverse adjacency: node id -> incoming sources */
  reverseAdjacency: Map<string, string[]>;
}

export interface TopologicalResult {
  /** Sorted node ids (dependencies first) */
  order: string[];
  /** Whether the sort was successful (false = cycle detected) */
  success: boolean;
  /** Cycle nodes if a cycle was found */
  cycleNodes?: string[];
}

export interface CriticalPathResult {
  /** Node ids on the critical path, in order */
  path: string[];
  /** Total duration of the critical path in ms */
  totalDurationMs: number;
  /** Slack time for each node (0 = on critical path) */
  slack: Map<string, number>;
}

export interface CycleReport {
  /** Whether a cycle exists */
  hasCycle: boolean;
  /** Nodes that form the cycle */
  cycleNodes: string[];
  /** Edges that form the cycle */
  cycleEdges: DependencyEdge[];
  /** Suggested resolution */
  suggestedResolution: string;
}

export interface ParallelGroups {
  /** Nodes grouped by execution level (level 0 = no dependencies) */
  groups: Map<number, string[]>;
  /** Total number of levels */
  depth: number;
}

// ---------------------------------------------------------------------------
// Graph construction
// ---------------------------------------------------------------------------

export function createDependencyGraph(): DependencyGraph {
  return {
    nodes: new Map(),
    edges: [],
    adjacency: new Map(),
    reverseAdjacency: new Map(),
  };
}

export function addNode(graph: DependencyGraph, node: DependencyNode): void {
  graph.nodes.set(node.id, node);
  if (!graph.adjacency.has(node.id)) {
    graph.adjacency.set(node.id, []);
  }
  if (!graph.reverseAdjacency.has(node.id)) {
    graph.reverseAdjacency.set(node.id, []);
  }
}

export function addNodes(graph: DependencyGraph, nodes: DependencyNode[]): void {
  for (const node of nodes) {
    addNode(graph, node);
  }
}

export function addEdge(graph: DependencyGraph, from: string, to: string, weight = 0): void {
  if (!graph.nodes.has(from) || !graph.nodes.has(to)) {
    throw new Error(`Cannot add edge: node "${from}" or "${to}" does not exist`);
  }

  // Prevent duplicate edges
  const existing = graph.edges.some((e) => e.from === from && e.to === to);
  if (existing) return;

  graph.edges.push({ from, to, weight });
  graph.adjacency.get(from)!.push(to);
  graph.reverseAdjacency.get(to)!.push(from);
}

export function removeEdge(graph: DependencyGraph, from: string, to: string): boolean {
  const edgeIndex = graph.edges.findIndex((e) => e.from === from && e.to === to);
  if (edgeIndex === -1) return false;

  graph.edges.splice(edgeIndex, 1);

  const adj = graph.adjacency.get(from);
  if (adj) {
    const targetIndex = adj.indexOf(to);
    if (targetIndex !== -1) adj.splice(targetIndex, 1);
  }

  const revAdj = graph.reverseAdjacency.get(to);
  if (revAdj) {
    const sourceIndex = revAdj.indexOf(from);
    if (sourceIndex !== -1) revAdj.splice(sourceIndex, 1);
  }

  return true;
}

export function getInDegree(graph: DependencyGraph, nodeId: string): number {
  return graph.reverseAdjacency.get(nodeId)?.length ?? 0;
}

export function getOutDegree(graph: DependencyGraph, nodeId: string): number {
  return graph.adjacency.get(nodeId)?.length ?? 0;
}

export function getDependencies(graph: DependencyGraph, nodeId: string): string[] {
  return [...(graph.reverseAdjacency.get(nodeId) ?? [])];
}

export function getDependents(graph: DependencyGraph, nodeId: string): string[] {
  return [...(graph.adjacency.get(nodeId) ?? [])];
}

// ---------------------------------------------------------------------------
// Cycle detection
// ---------------------------------------------------------------------------

export function detectCycle(graph: DependencyGraph): CycleReport {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const path: string[] = [];
  const cycleEdges: DependencyEdge[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = graph.adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        // Found cycle
        const cycleStart = path.indexOf(neighbor);
        const cycleNodeIds = path.slice(cycleStart);
        for (let i = cycleStart; i < path.length; i++) {
          const next = i + 1 < path.length ? path[i + 1] : path[cycleStart];
          cycleEdges.push({ from: path[i]!, to: next!, weight: 0 });
        }
        return true;
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
    return false;
  }

  for (const nodeId of graph.nodes.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) {
        const cycleNodes = path.length > 0 ? [...path] : [];
        return {
          hasCycle: true,
          cycleNodes,
          cycleEdges,
          suggestedResolution: `Remove or merge one of the edges in the cycle to break it. Consider reviewing task dependencies for: ${cycleNodes.join(', ')}`,
        };
      }
    }
  }

  return {
    hasCycle: false,
    cycleNodes: [],
    cycleEdges: [],
    suggestedResolution: 'No cycle detected',
  };
}

// ---------------------------------------------------------------------------
// Topological sort (Kahn's algorithm)
// ---------------------------------------------------------------------------

export function topologicalSort(graph: DependencyGraph): TopologicalResult {
  const inDegree = new Map<string, number>();
  const queue: string[] = [];
  const result: string[] = [];

  // Initialize in-degrees
  for (const nodeId of graph.nodes.keys()) {
    inDegree.set(nodeId, getInDegree(graph, nodeId));
    if (inDegree.get(nodeId) === 0) {
      queue.push(nodeId);
    }
  }

  // Kahn's algorithm
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const neighbors = graph.adjacency.get(nodeId) ?? [];
    for (const neighbor of neighbors) {
      const current = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, current);
      if (current === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (result.length !== graph.nodes.size) {
    const remaining = graph.nodes.keys();
    const cycleNodes: string[] = [];
    for (const id of remaining) {
      if (!result.includes(id)) {
        cycleNodes.push(id);
      }
    }
    return {
      order: result,
      success: false,
      cycleNodes,
    };
  }

  return {
    order: result,
    success: true,
  };
}

// ---------------------------------------------------------------------------
// Parallel group identification
// ---------------------------------------------------------------------------

export function identifyParallelGroups(graph: DependencyGraph): ParallelGroups {
  const topoResult = topologicalSort(graph);
  if (!topoResult.success) {
    return { groups: new Map([[0, [...graph.nodes.keys()]]]), depth: 1 };
  }

  const groups = new Map<number, string[]>();
  const nodeLevel = new Map<string, number>();

  for (const nodeId of topoResult.order) {
    const deps = getDependencies(graph, nodeId);
    if (deps.length === 0) {
      nodeLevel.set(nodeId, 0);
    } else {
      const maxDepLevel = Math.max(...deps.map((d) => nodeLevel.get(d) ?? 0));
      nodeLevel.set(nodeId, maxDepLevel + 1);
    }

    const level = nodeLevel.get(nodeId)!;
    const group = groups.get(level) ?? [];
    group.push(nodeId);
    groups.set(level, group);
  }

  return {
    groups,
    depth: groups.size,
  };
}

// ---------------------------------------------------------------------------
// Critical path (longest path algorithm)
// ---------------------------------------------------------------------------

export function findCriticalPath(graph: DependencyGraph): CriticalPathResult {
  // Forward pass: earliest start/finish times
  const earliestFinish = new Map<string, number>();
  const predecessor = new Map<string, string>();

  const topoResult = topologicalSort(graph);
  if (!topoResult.success) {
    return { path: [], totalDurationMs: 0, slack: new Map() };
  }

  for (const nodeId of topoResult.order) {
    const node = graph.nodes.get(nodeId)!;
    const deps = getDependencies(graph, nodeId);

    let earliestStart = 0;
    for (const dep of deps) {
      const depFinish = earliestFinish.get(dep) ?? 0;
      if (depFinish > earliestStart) {
        earliestStart = depFinish;
        predecessor.set(nodeId, dep);
      }
    }

    earliestFinish.set(nodeId, earliestStart + node.durationMs);
  }

  // Find the terminal node with the latest finish
  let latestFinish = 0;
  let criticalEnd: string | undefined;
  for (const [nodeId, finish] of earliestFinish) {
    if (graph.nodes.get(nodeId)!.isTerminal && finish > latestFinish) {
      latestFinish = finish;
      criticalEnd = nodeId;
    }
  }
  if (criticalEnd === undefined) {
    // Fall back to the node with the latest finish
    for (const [nodeId, finish] of earliestFinish) {
      if (finish > latestFinish) {
        latestFinish = finish;
        criticalEnd = nodeId;
      }
    }
  }

  // Backtrack to find the critical path
  const path: string[] = [];
  let current = criticalEnd;
  while (current) {
    path.unshift(current);
    current = predecessor.get(current);
  }

  // Calculate slack for all nodes
  const slack = new Map<string, number>();
  const latestStart = new Map<string, number>();
  const terminalIds = Array.from(graph.nodes.values()).filter((n) => n.isTerminal).map((n) => n.id);

  // Latest finish for terminals is their earliest finish (they define the project end)
  const projectEnd = latestFinish;
  for (const nodeId of terminalIds) {
    latestStart.set(nodeId, projectEnd - graph.nodes.get(nodeId)!.durationMs);
  }

  // Reverse topo for backward pass
  const reverseTopo = [...topoResult.order].reverse();
  for (const nodeId of reverseTopo) {
    const node = graph.nodes.get(nodeId)!;
    if (node.isTerminal) continue;

    const dependents = getDependents(graph, nodeId);
    if (dependents.length === 0) {
      latestStart.set(nodeId, projectEnd - node.durationMs);
    } else {
      let minSuccessorStart = Infinity;
      for (const dep of dependents) {
        const ls = latestStart.get(dep);
        if (ls !== undefined && ls < minSuccessorStart) {
          minSuccessorStart = ls;
        }
      }
      latestStart.set(nodeId, minSuccessorStart - node.durationMs);
    }
  }

  for (const nodeId of graph.nodes.keys()) {
    const es = earliestFinish.get(nodeId)! - graph.nodes.get(nodeId)!.durationMs;
    const ls = latestStart.get(nodeId)!;
    slack.set(nodeId, Math.max(0, ls - es));
  }

  return {
    path,
    totalDurationMs: latestFinish,
    slack,
  };
}

// ---------------------------------------------------------------------------
// Build from SwarmTaskNode (integration with existing types)
// ---------------------------------------------------------------------------

export function buildFromTaskNodes(taskNodes: {
  taskId: string;
  title: string;
  dependsOn: string[];
}[]): DependencyGraph {
  const graph = createDependencyGraph();

  for (const task of taskNodes) {
    addNode(graph, {
      id: task.taskId,
      label: task.title,
      durationMs: 5000, // Default 5s estimate per task
      isTerminal: task.dependsOn.length === 0 && !getDependents(graph, task.taskId).length,
      metadata: {},
    });
  }

  // Second pass: add edges based on dependsOn
  for (const task of taskNodes) {
    for (const depId of task.dependsOn) {
      if (graph.nodes.has(depId)) {
        addEdge(graph, depId, task.taskId);
      }
    }
  }

  return graph;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

export function isLeafNode(graph: DependencyGraph, nodeId: string): boolean {
  return getOutDegree(graph, nodeId) === 0;
}

export function isRootNode(graph: DependencyGraph, nodeId: string): boolean {
  return getInDegree(graph, nodeId) === 0;
}

export function getLongestPathLength(graph: DependencyGraph): number {
  const result = findCriticalPath(graph);
  return result.totalDurationMs;
}

export function cloneGraph(graph: DependencyGraph): DependencyGraph {
  const cloned = createDependencyGraph();
  for (const node of graph.nodes.values()) {
    addNode(cloned, { ...node, metadata: { ...node.metadata } });
  }
  for (const edge of graph.edges) {
    addEdge(cloned, edge.from, edge.to, edge.weight);
  }
  return cloned;
}
