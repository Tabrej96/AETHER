/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dependency Graph Tests
 *
 * Run via: npx tsx --test src/core/swarm/dependencyGraph.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
  type DependencyNode,
} from './dependencyGraph';

// ---------- Helpers ----------

function makeNode(overrides: Partial<DependencyNode> = {}): DependencyNode {
  return {
    id: `node-${Math.random().toString(36).slice(2, 6)}`,
    label: 'Node',
    durationMs: 1000,
    isTerminal: false,
    metadata: {},
    ...overrides,
  };
}

// ============================================================
// 1. Graph Construction
// ============================================================

test('DependencyGraph: createDependencyGraph returns empty graph', () => {
  const graph = createDependencyGraph();
  assert.strictEqual(graph.nodes.size, 0);
  assert.strictEqual(graph.edges.length, 0);
});

test('DependencyGraph: addNode adds a node', () => {
  const graph = createDependencyGraph();
  addNode(graph, makeNode({ id: 'n1' }));
  assert.strictEqual(graph.nodes.size, 1);
  assert.strictEqual(graph.nodes.get('n1')!.id, 'n1');
});

test('DependencyGraph: addNodes adds multiple nodes', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'n1' }), makeNode({ id: 'n2' }), makeNode({ id: 'n3' })]);
  assert.strictEqual(graph.nodes.size, 3);
});

test('DependencyGraph: addEdge creates adjacency entries', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'a', 'c');

  assert.strictEqual(graph.edges.length, 2);
  assert.ok(graph.adjacency.get('a')!.includes('b'));
  assert.ok(graph.adjacency.get('a')!.includes('c'));
  assert.ok(graph.reverseAdjacency.get('b')!.includes('a'));
  assert.ok(graph.reverseAdjacency.get('c')!.includes('a'));
});

test('DependencyGraph: addEdge throws on nonexistent node', () => {
  const graph = createDependencyGraph();
  addNode(graph, makeNode({ id: 'a' }));

  assert.throws(() => addEdge(graph, 'a', 'nonexistent'), /does not exist/);
});

test('DependencyGraph: addEdge prevents duplicates', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'a', 'b');

  assert.strictEqual(graph.edges.length, 1);
});

// ============================================================
// 2. Degree & Dependency Queries
// ============================================================

test('DependencyGraph: getInDegree returns correct count', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'a', 'c');

  assert.strictEqual(getInDegree(graph, 'b'), 1);
  assert.strictEqual(getInDegree(graph, 'c'), 1);
  assert.strictEqual(getInDegree(graph, 'a'), 0);
});

test('DependencyGraph: getOutDegree returns correct count', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'a', 'c');

  assert.strictEqual(getOutDegree(graph, 'a'), 2);
  assert.strictEqual(getOutDegree(graph, 'b'), 0);
});

test('DependencyGraph: getDependencies returns incoming edges', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'c');
  addEdge(graph, 'b', 'c');

  const deps = getDependencies(graph, 'c');
  assert.ok(deps.includes('a'));
  assert.ok(deps.includes('b'));
});

test('DependencyGraph: getDependents returns outgoing edges', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'a', 'c');

  const dependents = getDependents(graph, 'a');
  assert.ok(dependents.includes('b'));
  assert.ok(dependents.includes('c'));
});

// ============================================================
// 3. Edge Removal
// ============================================================

test('DependencyGraph: removeEdge removes the edge', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' })]);
  addEdge(graph, 'a', 'b');

  const result = removeEdge(graph, 'a', 'b');
  assert.strictEqual(result, true);
  assert.strictEqual(graph.edges.length, 0);
  assert.ok(!graph.adjacency.get('a')!.includes('b'));
});

test('DependencyGraph: removeEdge returns false for nonexistent edge', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' })]);

  const result = removeEdge(graph, 'a', 'b');
  assert.strictEqual(result, false);
});

// ============================================================
// 4. Cycle Detection
// ============================================================

test('DependencyGraph: detectCycle returns no cycle for DAG', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'b', 'c');

  const report = detectCycle(graph);
  assert.strictEqual(report.hasCycle, false);
  assert.strictEqual(report.cycleNodes.length, 0);
});

test('DependencyGraph: detectCycle detects simple cycle', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'b', 'c');
  addEdge(graph, 'c', 'a');

  const report = detectCycle(graph);
  assert.strictEqual(report.hasCycle, true);
  assert.ok(report.cycleNodes.length > 0);
  assert.ok(report.suggestedResolution.length > 0);
});

test('DependencyGraph: detectCycle detects self-loop', () => {
  const graph = createDependencyGraph();
  addNode(graph, makeNode({ id: 'a' }));
  addEdge(graph, 'a', 'a');

  const report = detectCycle(graph);
  assert.strictEqual(report.hasCycle, true);
});

// ============================================================
// 5. Topological Sort
// ============================================================

test('DependencyGraph: topologicalSort produces valid ordering', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'c');
  addEdge(graph, 'b', 'c');

  const result = topologicalSort(graph);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order.length, 3);
  // 'c' must come after 'a' and 'b'
  assert.ok(result.order.indexOf('c') > result.order.indexOf('a'));
  assert.ok(result.order.indexOf('c') > result.order.indexOf('b'));
});

test('DependencyGraph: topologicalSort detects cycle', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'b', 'c');
  addEdge(graph, 'c', 'a');

  const result = topologicalSort(graph);
  assert.strictEqual(result.success, false);
  assert.ok(result.cycleNodes !== undefined);
  assert.ok(result.cycleNodes.length > 0);
});

test('DependencyGraph: topologicalSort linear chain', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' }), makeNode({ id: 'd' })]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'b', 'c');
  addEdge(graph, 'c', 'd');

  const result = topologicalSort(graph);
  assert.strictEqual(result.success, true);
  assert.deepStrictEqual(result.order, ['a', 'b', 'c', 'd']);
});

// ============================================================
// 6. Parallel Groups
// ============================================================

test('DependencyGraph: identifyParallelGroups groups independent nodes', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' }), makeNode({ id: 'c' }), makeNode({ id: 'd' })]);
  addEdge(graph, 'a', 'c');
  addEdge(graph, 'b', 'd');

  const groups = identifyParallelGroups(graph);
  assert.ok(groups.groups.size >= 2);
  assert.strictEqual(groups.depth, 2); // a/b (level 0), c/d (level 1)
});

// ============================================================
// 7. Critical Path
// ============================================================

test('DependencyGraph: findCriticalPath identifies longest path', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [
    makeNode({ id: 'start', durationMs: 100, isTerminal: false }),
    makeNode({ id: 'long', durationMs: 500, isTerminal: false }),
    makeNode({ id: 'short', durationMs: 100, isTerminal: false }),
    makeNode({ id: 'end', durationMs: 100, isTerminal: true }),
  ]);
  addEdge(graph, 'start', 'long');
  addEdge(graph, 'start', 'short');
  addEdge(graph, 'long', 'end');
  addEdge(graph, 'short', 'end');

  const result = findCriticalPath(graph);
  assert.ok(result.path.length > 0);
  assert.ok(result.totalDurationMs > 0);
  // The critical path should include 'long' (500ms) not just 'short' (100ms)
  assert.ok(result.path.includes('long'));
});

test('DependencyGraph: findCriticalPath handles single node', () => {
  const graph = createDependencyGraph();
  addNode(graph, makeNode({ id: 'single', durationMs: 1000, isTerminal: true }));

  const result = findCriticalPath(graph);
  assert.deepStrictEqual(result.path, ['single']);
  assert.strictEqual(result.totalDurationMs, 1000);
});

// ============================================================
// 8. Node Properties
// ============================================================

test('DependencyGraph: isLeafNode identifies leaves', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'root' }), makeNode({ id: 'leaf' })]);
  addEdge(graph, 'root', 'leaf');

  assert.strictEqual(isLeafNode(graph, 'leaf'), true);
  assert.strictEqual(isLeafNode(graph, 'root'), false);
});

test('DependencyGraph: isRootNode identifies roots', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'root' }), makeNode({ id: 'leaf' })]);
  addEdge(graph, 'root', 'leaf');

  assert.strictEqual(isRootNode(graph, 'root'), true);
  assert.strictEqual(isRootNode(graph, 'leaf'), false);
});

// ============================================================
// 9. buildFromTaskNodes
// ============================================================

test('DependencyGraph: buildFromTaskNodes constructs from task data', () => {
  const graph = buildFromTaskNodes([
    { taskId: 't1', title: 'Task 1', dependsOn: [] },
    { taskId: 't2', title: 'Task 2', dependsOn: ['t1'] },
    { taskId: 't3', title: 'Task 3', dependsOn: ['t1'] },
  ]);

  assert.strictEqual(graph.nodes.size, 3);
  assert.strictEqual(graph.edges.length, 2);
  assert.ok(graph.adjacency.get('t1')!.includes('t2'));
  assert.ok(graph.adjacency.get('t1')!.includes('t3'));
});

// ============================================================
// 10. Clone Graph
// ============================================================

test('DependencyGraph: cloneGraph creates independent copy', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [makeNode({ id: 'a' }), makeNode({ id: 'b' })]);
  addEdge(graph, 'a', 'b');

  const clone = cloneGraph(graph);
  assert.strictEqual(clone.nodes.size, 2);
  assert.strictEqual(clone.edges.length, 1);

  // Modify clone doesn't affect original
  addNode(clone, makeNode({ id: 'c' }));
  assert.strictEqual(graph.nodes.size, 2);
});

// ============================================================
// 11. getLongestPathLength
// ============================================================

test('DependencyGraph: getLongestPathLength returns total duration', () => {
  const graph = createDependencyGraph();
  addNodes(graph, [
    makeNode({ id: 'a', durationMs: 100 }),
    makeNode({ id: 'b', durationMs: 200 }),
    makeNode({ id: 'c', durationMs: 300 }),
  ]);
  addEdge(graph, 'a', 'b');
  addEdge(graph, 'b', 'c');

  assert.strictEqual(getLongestPathLength(graph), 600);
});

// ============================================================
// 12. Empty Graph Operations
// ============================================================

test('DependencyGraph: empty graph topologicalSort succeeds', () => {
  const graph = createDependencyGraph();
  const result = topologicalSort(graph);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.order.length, 0);
});

test('DependencyGraph: empty graph findCriticalPath returns empty', () => {
  const graph = createDependencyGraph();
  const result = findCriticalPath(graph);
  assert.strictEqual(result.path.length, 0);
  assert.strictEqual(result.totalDurationMs, 0);
});
