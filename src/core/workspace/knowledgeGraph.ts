/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Program 08 · Knowledge Graph Engine
 * (src/core/workspace/knowledgeGraph.ts)
 *
 * Graph traversal, entity extraction, relationship mapping, and
 * visualization data export. Composes with KnowledgeVault for document
 * ingestion; can also work standalone with VaultNote arrays.
 *
 * Inspired by Obsidian's local graph and Puter's relationship mapping.
 * AETHER-native: clean-room implementation; no copied code.
 */

import type { VaultNote, VaultLink } from './knowledgeVault';

// ─── Graph types ─────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'tag' | 'entity';
  tags: string[];
  weight: number;       // link degree
  metadata: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'wiki' | 'tag' | 'reference' | 'inferred';
  weight: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    density: number;
    connectedComponents: number;
    orphanNodes: string[];
  };
}

export interface TraversalResult {
  visited: string[];
  path: string[];
  distance: number;
}

export interface ClusterResult {
  id: string;
  nodes: string[];
  center: string;
  avgDegree: number;
  tags: string[];
}

// ─── Entity extraction ───────────────────────────────────────────────────────

/**
 * Simple entity extraction: extract candidate entities from text using
 * capitalization patterns, known entities, and domain terms.
 * For AETHER-native use — no external NLP dependency.
 */
export function extractEntities(text: string, existingEntityIds: Set<string> = new Set()): Array<{ text: string; type: string; confidence: number }> {
  const entities: Array<{ text: string; type: string; confidence: number }> = [];
  const seen = new Set<string>(existingEntityIds);

  // Process wiki-links first (most specific), then proper nouns, then tags, then references

  // Bracket entities [[Like This]] (wiki-links)
  const wikiRe = /\[\[([^\]]+)\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = wikiRe.exec(text)) !== null) {
    const entity = match[1].trim();
    if (!seen.has(entity)) {
      seen.add(entity);
      entities.push({ text: entity, type: 'wiki_entity', confidence: 0.9 });
    }
  }

  // Hashtag entities
  const tagRe = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  while ((match = tagRe.exec(text)) !== null) {
    const entity = match[1].trim();
    if (!seen.has(entity)) {
      seen.add(entity);
      entities.push({ text: entity, type: 'tag_entity', confidence: 0.85 });
    }
  }

  // Numbered entities (e.g., "Project 123", "Issue #45")
  const numRe = /(?:Project|Issue|Task|Feature|Bug)\s+#?\d+/gi;
  while ((match = numRe.exec(text)) !== null) {
    const entity = match[0].trim();
    if (!seen.has(entity)) {
      seen.add(entity);
      entities.push({ text: entity, type: 'reference', confidence: 0.7 });
    }
  }

  // Proper nouns (Capitalized words in sequence) — only if not already seen
  const properNounRe = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  while ((match = properNounRe.exec(text)) !== null) {
    const textMatch = match[1].trim();
    if (textMatch.length > 2 && !seen.has(textMatch) && !isCommonWord(textMatch)) {
      seen.add(textMatch);
      entities.push({ text: textMatch, type: 'proper_noun', confidence: 0.6 });
    }
  }

  return entities;
}

function isCommonWord(word: string): boolean {
  const common = new Set([
    'The', 'This', 'That', 'These', 'Those', 'What', 'When', 'Where', 'Who', 'Why',
    'How', 'Which', 'Their', 'There', 'Here', 'From', 'With', 'Without', 'About',
    'After', 'Before', 'Between', 'Through', 'During', 'Since', 'Until', 'While',
    'Because', 'Although', 'However', 'Therefore', 'Thus', 'Hence', 'Indeed',
    'Note', 'Example', 'Section', 'Chapter', 'Table', 'Figure', 'Appendix',
  ]);
  return common.has(word);
}

// ─── Graph construction ──────────────────────────────────────────────────────

export function buildGraphFromNotes(notes: VaultNote[]): KnowledgeGraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const degree = new Map<string, number>();

  // Build nodes
  for (const note of notes) {
    nodes.push({
      id: note.id,
      label: note.title,
      type: 'note',
      tags: note.tags,
      weight: 0,
      metadata: { source: note.source ?? 'vault' },
    });
    degree.set(note.id, 0);
  }

  // Build edges from wiki-links
  for (const note of notes) {
    for (const link of note.wikiLinks) {
      const targetId = resolveWikiLink(link, notes);
      if (targetId && targetId !== note.id) {
        edges.push({ source: note.id, target: targetId, type: 'wiki', weight: 1 });
        degree.set(note.id, (degree.get(note.id) ?? 0) + 1);
        degree.set(targetId, (degree.get(targetId) ?? 0) + 1);
      }
    }
  }

  // Build edges from tag co-occurrence
  const byTag = new Map<string, string[]>();
  for (const note of notes) {
    for (const tag of note.tags) {
      const arr = byTag.get(tag) ?? [];
      arr.push(note.id);
      byTag.set(tag, arr);
    }
  }

  for (const [tag, noteIds] of byTag.entries()) {
    for (let i = 0; i < noteIds.length; i++) {
      for (let j = i + 1; j < noteIds.length; j++) {
        edges.push({ source: noteIds[i], target: noteIds[j], type: 'tag', weight: 0.5 });
        degree.set(noteIds[i], (degree.get(noteIds[i]) ?? 0) + 1);
        degree.set(noteIds[j], (degree.get(noteIds[j]) ?? 0) + 1);
      }
    }
  }

  // Update node weights
  for (const node of nodes) {
    node.weight = degree.get(node.id) ?? 0;
  }

  const stats = computeGraphStats(nodes, edges, degree);

  return { nodes, edges, stats };
}

function resolveWikiLink(title: string, notes: VaultNote[]): string | undefined {
  const lower = title.toLowerCase().trim();
  return notes.find((n) => n.title.toLowerCase().trim() === lower)?.id;
}

function computeGraphStats(
  nodes: GraphNode[],
  edges: GraphEdge[],
  degree: Map<string, number>
): KnowledgeGraphData['stats'] {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const totalDegree = [...degree.values()].reduce((sum, d) => sum + d, 0);
  const avgDegree = nodeCount > 0 ? Number((totalDegree / nodeCount).toFixed(2)) : 0;
  const maxPossibleEdges = nodeCount > 1 ? (nodeCount * (nodeCount - 1)) / 2 : 1;
  const density = Number((edgeCount / maxPossibleEdges).toFixed(4));

  const orphanNodes = nodes.filter((n) => (degree.get(n.id) ?? 0) === 0).map((n) => n.id);

  // Connected components (simple BFS)
  const visited = new Set<string>();
  let components = 0;
  const adj = new Map<string, string[]>();

  for (const node of nodes) adj.set(node.id, []);
  for (const edge of edges) {
    adj.get(edge.source)?.push(edge.target);
    adj.get(edge.target)?.push(edge.source);
  }

  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    components++;
    const queue = [node.id];
    visited.add(node.id);
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbor of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  return {
    nodeCount,
    edgeCount,
    avgDegree,
    density,
    connectedComponents: components,
    orphanNodes,
  };
}

// ─── Graph traversal ─────────────────────────────────────────────────────────

export function bfs(
  graph: KnowledgeGraphData,
  startId: string
): TraversalResult | undefined {
  const visited: string[] = [];
  const path: string[] = [];
  const seen = new Set<string>();
  const queue: string[] = [startId];
  seen.add(startId);

  const adj = buildAdjacency(graph);

  while (queue.length > 0) {
    const current = queue.shift()!;
    visited.push(current);
    path.push(current);

    for (const neighbor of adj.get(current) ?? []) {
      if (!seen.has(neighbor)) {
        seen.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return { visited, path, distance: visited.length - 1 };
}

export function shortestPath(
  graph: KnowledgeGraphData,
  fromId: string,
  toId: string
): TraversalResult | undefined {
  const adj = buildAdjacency(graph);
  const queue: Array<{ id: string; distance: number; path: string[] }> = [
    { id: fromId, distance: 0, path: [fromId] },
  ];
  const visited = new Set<string>();
  visited.add(fromId);

  while (queue.length > 0) {
    const { id, distance, path } = queue.shift()!;
    if (id === toId) {
      return { visited: [...path], path, distance };
    }

    for (const neighbor of adj.get(id) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, distance: distance + 1, path: [...path, neighbor] });
      }
    }
  }

  return undefined; // No path exists
}

export function findClusters(graph: KnowledgeGraphData): ClusterResult[] {
  // Cluster by shared tags
  const tagMap = new Map<string, Set<string>>();
  for (const node of graph.nodes) {
    for (const tag of node.tags) {
      let set = tagMap.get(tag);
      if (!set) { set = new Set(); tagMap.set(tag, set); }
      set.add(node.id);
    }
  }

  const clusters: ClusterResult[] = [];
  let clusterId = 0;

  for (const [tag, nodeIds] of tagMap.entries()) {
    if (nodeIds.size < 2) continue;
    const ids = [...nodeIds];
    const center = findHighestDegreeNode(ids, graph.nodes);
    const avgDeg = ids.reduce((sum, id) => {
      const node = graph.nodes.find((n) => n.id === id);
      return sum + (node?.weight ?? 0);
    }, 0) / ids.length;

    clusters.push({
      id: `cluster_${clusterId++}`,
      nodes: ids,
      center,
      avgDegree: Number(avgDeg.toFixed(2)),
      tags: [tag],
    });
  }

  return clusters.sort((a, b) => b.nodes.length - a.nodes.length);
}

function findHighestDegreeNode(ids: string[], nodes: GraphNode[]): string {
  let maxWeight = -1;
  let center = ids[0];
  for (const id of ids) {
    const node = nodes.find((n) => n.id === id);
    if (node && node.weight > maxWeight) {
      maxWeight = node.weight;
      center = id;
    }
  }
  return center;
}

// ─── Visualization export ────────────────────────────────────────────────────

export function exportForVisualization(graph: KnowledgeGraphData): {
  nodes: Array<{ id: string; label: string; group: string; value: number }>;
  links: Array<{ source: string; target: string; value: number }>;
} {
  return {
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      group: n.tags[0] ?? 'default',
      value: n.weight,
    })),
    links: graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      value: e.weight,
    })),
  };
}

// ─── Relationship inference ──────────────────────────────────────────────────

export function inferRelationships(
  graph: KnowledgeGraphData,
  maxInferenceDistance: number = 2
): GraphEdge[] {
  const inferred: GraphEdge[] = [];
  const adj = buildAdjacency(graph);
  const seen = new Set<string>();

  for (const node of graph.nodes) {
    // BFS up to maxInferenceDistance
    const visited = new Map<string, number>();
    visited.set(node.id, 0);
    const queue: string[] = [node.id];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const dist = visited.get(current)!;

      if (dist > 0 && dist <= maxInferenceDistance && current !== node.id) {
        const key = [node.id, current].sort().join('->');
        if (!seen.has(key)) {
          seen.add(key);
          inferred.push({
            source: node.id,
            target: current,
            type: 'inferred',
            weight: Number((1.0 / dist).toFixed(2)),
          });
        }
      }

      if (dist < maxInferenceDistance) {
        for (const neighbor of adj.get(current) ?? []) {
          if (!visited.has(neighbor)) {
            visited.set(neighbor, dist + 1);
            queue.push(neighbor);
          }
        }
      }
    }
  }

  return inferred;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAdjacency(graph: KnowledgeGraphData): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.source)?.push(edge.target);
    adj.get(edge.target)?.push(edge.source);
  }
  return adj;
}
