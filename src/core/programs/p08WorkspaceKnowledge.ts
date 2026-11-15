/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 08 — WORKSPACE AND KNOWLEDGE ECOSYSTEM  ·  AETHER Workspace & Knowledge Engine
 * (src/core/programs/p08WorkspaceKnowledge.ts)
 *
 * Researched from:
 *   - HeyPuter/puter                  (Puter.js is AGPL-3.0; researched out-of-process)
 *   - obsidianmd/obsidian-releases    (public registry / ecosystem of Obsidian plugins)
 *
 * NOTE (as required by the program brief): obsidian-releases does NOT contain
 * the proprietary Obsidian application source. Study its public extension registry
 * and ecosystem concepts only.
 *
 * Delivers:
 *   - src/core/workspace/workspaceEngine.ts    — Project workspace management
 *   - src/core/workspace/knowledgeVault.ts     — Markdown knowledge storage
 *   - src/core/workspace/extensionRegistry.ts  — Plugin/skill discovery system
 *   - src/core/workspace/fileOrganizer.ts      — Smart file placement
 *   - src/core/workspace/knowledgeGraph.ts     — Graph traversal and querying
 *   - src/core/workspace/integrationPoints.ts  — Git/MCP/Service/Webhook integration
 */

import {
  WorkspaceEngine,
  KnowledgeVault,
  ExtensionRegistry,
  FileOrganizer,
  KnowledgeGraphData,
  buildGraphFromNotes,
  findClusters,
  exportForVisualization,
  extractEntities,
  bfs,
  shortestPath,
  inferRelationships,
  WorkspaceIntegrationPoints,
} from '../workspace';
import type { VaultNote } from '../workspace/knowledgeVault';
import type { PluginManifest } from '../workspace/extensionRegistry';
import type { RegisteredPlugin } from '../workspace/extensionRegistry';
import type { ProjectType } from '../workspace/fileOrganizer';
import type { WorkspaceConfig } from '../workspace/workspaceEngine';

export const P08_CAPABILITY: ProgramCapability = {
  id: 'cap-p08-workspace-knowledge-engine',
  programId: 'P08_WORKSPACE_KNOWLEDGE' as ProgramId,
  programName: 'PROGRAM 08 — WORKSPACE AND KNOWLEDGE ECOSYSTEM',
  capability: 'Markdown knowledge vault → knowledge graph (wiki-links + tag clusters) + deterministic workspace organization + permission/license-audited plugin discovery + file organization intelligence + graph traversal + Git/MCP/service/webhook integration',
  repositoryOrigin: 'https://github.com/obsidianmd/obsidian-releases',
  originProject: 'HeyPuter/puter (out-of-process AGPL reference) + obsidianmd/obsidian-releases (public registry model)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'APPROVAL_GATED_WRITES',
  resourceRequirements: 'Deterministic graph construction; plugin registry access is read-only and permission-audited.',
  testCoverage: '161 tests across 6 modules: workspace engine, knowledge vault, extension registry, file organizer, knowledge graph, integration points.',
  integratesWith: ['Memory Engine', 'MCP Engine', 'Skill Engine', 'Workflow Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'graph-edges-reconstructed',
    unit: 'edges',
    detail: 'Obsidian-vault-style knowledge graph reconstructed from a synthetic vault; Puter studied out-of-process only (AGPL).',
  },
  author: 'Created by Tabrej',
};

export function runP08BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const vault = new KnowledgeVault();
  const a = vault.createNote({ title: 'Architecture', content: 'See [[Design]] and [[API]].', tags: ['architecture'] });
  const b = vault.createNote({ title: 'Design', content: 'See [[Architecture]].', tags: ['architecture', 'design'] });
  const c = vault.createNote({ title: 'API', content: 'See [[Architecture]].', tags: ['api'] });
  const d = vault.createNote({ title: 'Isolated', content: 'No links here.', tags: [] });
  const notes = vault.listNotes();

  const graph = buildGraphFromNotes(notes);
  const engine = new WorkspaceEngine();
  const ws = engine.create({ name: 'Benchmark', domain: 'general' });
  const organizer = new FileOrganizer();
  const structure = organizer.generateStructure({ projectType: 'saas', rootPath: '/bench' });

  const registry = new ExtensionRegistry();
  registry.register({
    pluginId: 'p-dataloom',
    name: 'Dataloom Charts',
    version: '1.2.0',
    license: 'MIT',
    author: 'bench',
    requiredPermissions: ['fs:read'],
    dependencies: {},
    capabilities: ['charts'],
    tags: ['productivity'],
    entryPoint: 'index.js',
  });
  const found = registry.findByCapability('charts');

  const clusters = findClusters(graph);
  const viz = exportForVisualization(graph);
  const entities = extractEntities('Project Alpha uses the Design System.');

  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: graph.edges.length,
    metric: 'graph-edges-reconstructed',
    unit: 'edges',
    detail: `Graph of ${graph.nodes.length} notes yielded ${graph.edges.length} edges; orphans=${graph.stats.orphanNodes.length}; ${clusters.length} cluster(s) found; workspace with ${structure.folders.length} folders created; ${found.length} plugin(s) discovered; ${entities.length} entities extracted from text; visualization-ready export has ${viz.nodes.length} nodes and ${viz.links.length} links.`,
  };
}
