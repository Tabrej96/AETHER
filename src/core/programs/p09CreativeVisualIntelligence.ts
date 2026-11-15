/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 09 — CREATIVE AND VISUAL INTELLIGENCE  ·  AETHER Creative Intelligence
 * (src/core/programs/p09CreativeVisualIntelligence.ts)
 *
 * Researched from:
 *   - Comfy-Org/ComfyUI  (GPL-3.0, out-of-process reference) — node-based AI graph
 *   - mrdoob/three.js    (MIT) — scene graph, real-time 3D
 *
 * Delivers, as the program brief requires: a MODULAR GENERATION BACKEND
 * (a ComfyUI-style node graph that is data-only and backend-agnostic) and a
 * SEPARATE 3D RENDERING FRONTEND model (a Three.js-style scene graph).
 * ComfyUI is GPL-3.0, so it is studied as an out-of-process reference only —
 * AETHER's node graph is a clean-room data model, not a GPL port.
 */

import { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

// ---------------------------------------------------------------------------
// 1. MODULAR GENERATION BACKEND — ComfyUI-style node graph (data model only)
// ---------------------------------------------------------------------------

export interface WorkflowNode {
  nodeId: string;
  type: string; // 'loader' | 'transform' | 'sampler' | 'compositor' | 'export'
  params: Record<string, unknown>;
  inputs: Array<{ nodeId: string; socket: string }>;
}

export interface WorkflowGraph {
  graphId: string;
  nodes: WorkflowNode[];
  /** topological layers (nodes that can run in parallel within a layer) */
  layers: string[][];
}

/**
 * Build a topological execution schedule from a node graph. A node's layer is
 * 1 + max(input layers). This is the "modular generation backend" primitive:
 * any concrete backend (diffusion model, upscaler, compositor) plugs into the
 * node TYPES; the scheduler is backend-agnostic. Cycle detection -> throw.
 */
export function scheduleNodeGraph(nodes: WorkflowNode[]): WorkflowGraph {
  const layerOf = new Map<string, number>();
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));

  const computeLayer = (id: string, visiting: Set<string>): number => {
    if (layerOf.has(id)) return layerOf.get(id)!;
    if (visiting.has(id)) throw new Error(`Node-graph cycle detected at ${id}; topological schedule impossible.`);
    visiting.add(id);
    const node = byId.get(id);
    let l = 0;
    if (node) {
      for (const inp of node.inputs) {
        l = Math.max(l, 1 + computeLayer(inp.nodeId, visiting));
      }
    }
    visiting.delete(id);
    layerOf.set(id, l);
    return l;
  };

  for (const n of nodes) computeLayer(n.nodeId, new Set());

  const layers: string[][] = [];
  for (const [id, l] of layerOf) {
    (layers[l] ??= []).push(id);
  }
  return { graphId: `wf-${nodes.length}`, nodes, layers };
}

/** Resolve which backend module a node type maps to. Returns null for unknown types (safe, not fabricated). */
export function resolveBackend(type: string, available: string[]): string | null {
  return available.includes(type) ? type : null;
}

// ---------------------------------------------------------------------------
// 2. SEPARATE 3D RENDERING FRONTEND — Three.js-style scene graph
// ---------------------------------------------------------------------------

export interface SceneObject {
  objectId: string;
  kind: 'mesh' | 'light' | 'camera' | 'group';
  transform: { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] };
  children: string[];
  material?: string;
}

export interface SceneGraph {
  objects: SceneObject[];
  renderOrder: string[]; // BFS traversal order for deterministic rendering
  objectCount: number;
  drawCallEstimate: number; // meshes + lights (groups/cameras don't draw)
}

export function buildSceneGraph(objects: SceneObject[]): SceneGraph {
  const byId = new Map(objects.map((o) => [o.objectId, o]));
  const renderOrder: string[] = [];
  const roots = objects.filter((o) => o.kind === 'group' || o.kind === 'camera' || o.kind === 'light' || o.kind === 'mesh');
  // deterministic BFS from each top-level object in input order
  for (const root of roots) {
    const queue = [root.objectId];
    while (queue.length) {
      const id = queue.shift()!;
      const o = byId.get(id);
      if (!o) continue;
      renderOrder.push(id);
      queue.push(...o.children);
    }
  }
  const seen = new Set<string>();
  const dedupOrder = renderOrder.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
  const drawCallEstimate = objects.filter((o) => o.kind === 'mesh' || o.kind === 'light').length;
  return { objects, renderOrder: dedupOrder, objectCount: objects.length, drawCallEstimate };
}

export const P09_CAPABILITY: ProgramCapability = {
  id: 'cap-p09-creative-intelligence',
  programId: 'P09_CREATIVE_VISUAL_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 09 — CREATIVE AND VISUAL INTELLIGENCE',
  capability: 'Modular ComfyUI-style node-graph generation backend (clean-room, GPL-isolated) + separate Three.js-style 3D scene-graph frontend',
  repositoryOrigin: 'https://github.com/Comfy-Org/ComfyUI',
  originProject: 'Comfy-Org/ComfyUI (GPL-3.0, out-of-process reference) + mrdoob/three.js (MIT)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'APPROVAL_GATED_WRITES',
  resourceRequirements: 'Node scheduling + scene-graph model are pure TS; a real generation model or renderer is an out-of-process backend plugged by type.',
  testCoverage: 'Topological node scheduling + cycle rejection, backend resolution, and 3D scene-graph render order + draw-call estimate.',
  integratesWith: ['MCP Engine', 'Swarm Engine', 'P07 Browser Runtime (3D viz)'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'node-graph-layers-scheduled',
    unit: 'layers',
    detail: 'ComfyUI node graph modeled as a clean-room data scheduler (GPL never imported); Three.js scene graph produces deterministic render order.',
  },
  author: 'Created by Tabrej',
};

export function runP09BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const graph = scheduleNodeGraph([
    { nodeId: 'load', type: 'loader', params: {}, inputs: [] },
    { nodeId: 'prompt', type: 'sampler', params: { steps: 20 }, inputs: [{ nodeId: 'load', socket: 'out' }] },
    { nodeId: 'upscale', type: 'transform', params: {}, inputs: [{ nodeId: 'prompt', socket: 'img' }] },
    { nodeId: 'save', type: 'export', params: { fmt: 'png' }, inputs: [{ nodeId: 'upscale', socket: 'out' }] },
  ]);
  const scene = buildSceneGraph([
    { objectId: 'root', kind: 'group', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, children: ['m1', 'l1'] },
    { objectId: 'm1', kind: 'mesh', transform: { position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, children: [], material: 'standard' },
    { objectId: 'l1', kind: 'light', transform: { position: [0, 5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, children: [] },
  ]);
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: graph.layers.length,
    metric: 'node-graph-layers-scheduled',
    unit: 'layers',
    detail: `Scheduled a 4-node generation graph across ${graph.layers.length} topological layer(s) (parallel groups: ${graph.layers.map((l) => l.join(',')).join(' | ')}); 3D scene of ${scene.objectCount} objects -> ${scene.drawCallEstimate} draw call(s), render order [${scene.renderOrder.join(', ')}].`,
  };
}
