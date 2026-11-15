/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Knowledge Graph Engine Tests
 * (src/core/workspace/knowledgeGraph.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KnowledgeVault,
} from './knowledgeVault';
import {
  buildGraphFromNotes,
  extractEntities,
  bfs,
  shortestPath,
  findClusters,
  exportForVisualization,
  inferRelationships,
} from './knowledgeGraph';
import type { VaultNote } from './knowledgeVault';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNotes(): VaultNote[] {
  const vault = new KnowledgeVault();
  const a = vault.createNote({ title: 'Architecture', content: 'See [[Design]] and [[API]].', tags: ['architecture'] });
  const b = vault.createNote({ title: 'Design', content: 'See [[Architecture]]. UI patterns.', tags: ['architecture', 'design'] });
  vault.createNote({ title: 'API', content: 'See [[Architecture]].', tags: ['api'] });
  vault.createNote({ title: 'Isolated', content: 'No links here.', tags: [] });
  return vault.listNotes();
}

// ─── Entity extraction ───────────────────────────────────────────────────────

test('extractEntities finds proper nouns', () => {
  const entities = extractEntities('Project Alpha uses the Design System.');
  assert.ok(entities.some((e) => e.text === 'Project Alpha'), 'finds proper noun');
  assert.ok(entities.some((e) => e.text === 'Design System'), 'finds multi-word proper noun');
});

test('extractEntities finds wiki-entities', () => {
  const entities = extractEntities('See [[Alpha]] for details.');
  assert.ok(entities.some((e) => e.text === 'Alpha' && e.type === 'wiki_entity'));
});

test('extractEntities finds tag entities', () => {
  const entities = extractEntities('#architecture is key.');
  assert.ok(entities.some((e) => e.text === 'architecture' && e.type === 'tag_entity'));
});

test('extractEntities filters common words', () => {
  const entities = extractEntities('The This That Note Example.');
  assert.ok(!entities.some((e) => e.text === 'The'), 'filters The');
  assert.ok(!entities.some((e) => e.text === 'Note'), 'filters Note');
  assert.ok(!entities.some((e) => e.text === 'Example'), 'filters Example');
});

test('extractEntities returns empty for empty input', () => {
  assert.deepStrictEqual(extractEntities(''), []);
});

// ─── Graph construction ──────────────────────────────────────────────────────

test('buildGraphFromNotes creates nodes and edges', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);

  assert.strictEqual(graph.nodes.length, 4, '4 nodes');
  assert.ok(graph.edges.length > 0, 'has edges');
});

test('buildGraphFromNotes computes stats', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);

  assert.strictEqual(graph.stats.nodeCount, 4);
  assert.strictEqual(graph.stats.edgeCount, graph.edges.length);
  assert.ok(graph.stats.avgDegree > 0, 'has positive avg degree');

  // Find the isolated note by its id and verify it's in orphans
  const isolatedNote = notes.find((n) => n.title === 'Isolated')!;
  assert.ok(graph.stats.orphanNodes.includes(isolatedNote.id), 'isolated note is orphan');
});

test('buildGraphFromNotes computes density', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);

  assert.ok(graph.stats.density >= 0, 'density is non-negative');
  assert.ok(graph.stats.density <= 1, 'density at most 1');
});

test('buildGraphFromNotes computes connected components', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);

  assert.ok(graph.stats.connectedComponents >= 1, 'at least 1 component');
  // We have 3 connected notes + 1 isolated = 2 components
  assert.ok(graph.stats.connectedComponents >= 2, 'has multiple components');
});

test('buildGraphFromNotes creates wiki-link edges', () => {
  const vault = new KnowledgeVault();
  const a = vault.createNote({ title: 'A', content: 'See [[B]].' });
  vault.createNote({ title: 'B', content: 'Content.' });
  const graph = buildGraphFromNotes(vault.listNotes());

  const wikiEdges = graph.edges.filter((e) => e.type === 'wiki');
  assert.ok(wikiEdges.some((e) => e.source === a.id), 'has wiki edge from A');
});

test('buildGraphFromNotes creates tag co-occurrence edges', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'A', content: 'Content.', tags: ['design'] });
  vault.createNote({ title: 'B', content: 'Content.', tags: ['design'] });
  const graph = buildGraphFromNotes(vault.listNotes());

  const tagEdges = graph.edges.filter((e) => e.type === 'tag');
  assert.ok(tagEdges.length > 0, 'has tag edges');
});

// ─── BFS traversal ───────────────────────────────────────────────────────────

test('bfs visits connected nodes', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);
  const startNode = graph.nodes.find((n) => n.label === 'Architecture')!;

  const result = bfs(graph, startNode.id);
  assert.ok(result !== undefined);
  assert.ok(result!.visited.length >= 3, 'visits Architecture and neighbors');
});

test('bfs returns undefined for invalid start', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);

  // BFS doesn't validate node id existence upfront, but returns only what's traversable
  const result = bfs(graph, 'nonexistent-id');
  assert.ok(result !== undefined);
  assert.strictEqual(result!.visited.length, 1);
  assert.strictEqual(result!.visited[0], 'nonexistent-id');
});

// ─── Shortest path ───────────────────────────────────────────────────────────

test('shortestPath finds direct link', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);
  const aNode = graph.nodes.find((n) => n.label === 'Architecture')!;
  const dNode = graph.nodes.find((n) => n.label === 'Design')!;

  const path = shortestPath(graph, aNode.id, dNode.id);
  assert.ok(path !== undefined, 'path found');
  assert.strictEqual(path!.path[0], aNode.id);
  assert.strictEqual(path!.path[path!.path.length - 1], dNode.id);
});

test('shortestPath returns undefined for disconnected nodes', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);
  const archNode = graph.nodes.find((n) => n.label === 'Architecture')!;
  const isoNode = graph.nodes.find((n) => n.label === 'Isolated')!;

  const path = shortestPath(graph, archNode.id, isoNode.id);
  assert.strictEqual(path, undefined, 'no path between disconnected nodes');
});

// ─── Clustering ──────────────────────────────────────────────────────────────

test('findClusters groups nodes by shared tags', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);
  const clusters = findClusters(graph);

  assert.ok(clusters.length > 0, 'has clusters');
  // Architecture and Design share 'architecture' tag
  const archCluster = clusters.find((c) => c.tags.includes('architecture'));
  assert.ok(archCluster !== undefined, 'found architecture cluster');
  assert.ok(archCluster!.nodes.length >= 2, 'cluster has multiple nodes');
});

// ─── Visualization export ────────────────────────────────────────────────────

test('exportForVisualization produces node/link format', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);
  const viz = exportForVisualization(graph);

  assert.strictEqual(viz.nodes.length, graph.nodes.length);
  assert.strictEqual(viz.links.length, graph.edges.length);

  // Check node format
  assert.ok(viz.nodes[0].id !== undefined, 'nodes have id');
  assert.ok(viz.nodes[0].label !== undefined, 'nodes have label');
  assert.ok(viz.nodes[0].group !== undefined, 'nodes have group');

  // Check link format
  assert.ok(viz.links[0].source !== undefined, 'links have source');
  assert.ok(viz.links[0].target !== undefined, 'links have target');
});

// ─── Relationship inference ──────────────────────────────────────────────────

test('inferRelationships finds indirect connections', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);

  const inferred = inferRelationships(graph, 2);
  assert.ok(inferred.length > 0, 'found inferred relationships');
  assert.ok(inferred.every((e) => e.type === 'inferred'), 'all are inferred type');
});

// ─── Node weights ────────────────────────────────────────────────────────────

test('buildGraphFromNotes assigns weights to nodes', () => {
  const notes = makeNotes();
  const graph = buildGraphFromNotes(notes);

  for (const node of graph.nodes) {
    assert.ok(typeof node.weight === 'number', `${node.label} has numeric weight`);
  }

  // Architecture has 2 wiki-links + tag links => should have higher weight
  const archNode = graph.nodes.find((n) => n.label === 'Architecture')!;
  const isoNode = graph.nodes.find((n) => n.label === 'Isolated')!;
  assert.ok(archNode.weight > isoNode.weight, 'connected node has higher weight');
});

// ─── Empty graph ─────────────────────────────────────────────────────────────

test('buildGraphFromNotes handles empty input', () => {
  const graph = buildGraphFromNotes([]);

  assert.strictEqual(graph.nodes.length, 0);
  assert.strictEqual(graph.edges.length, 0);
  assert.strictEqual(graph.stats.nodeCount, 0);
  assert.strictEqual(graph.stats.orphanNodes.length, 0);
});

test('extractEntities handles empty input', () => {
  assert.deepStrictEqual(extractEntities(''), []);
});
