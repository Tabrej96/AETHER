/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Program 08 · Workspace Engine Public API
 * (src/core/workspace/index.ts)
 *
 * Barrel export for the workspace engine. Consumers should import from
 * this module rather than from individual files.
 *
 * IMPORTANT: value re-exports (classes, functions, consts) and type re-exports
 * (interfaces, type aliases) are kept in SEPARATE export blocks. tsx/esbuild
 * transpile file-by-file without full type information, so a single
 * `export { ... }` that mixes a class with an interface re-exports both as
 * runtime values — and the interface-only names then crash Node's ESM loader
 * ("does not provide an export named X"). Splitting them keeps the barrel
 * safe under tsx/esbuild while remaining type-accurate under tsc.
 *
 * Inspired by:
 *   - HeyPuter/puter      (AGPL-3.0; browser-workspace concept researched only)
 *   - obsidianmd/obsidian-releases (public plugin-registry model)
 *
 * AETHER-native: clean-room implementation; no copied code.
 */

// Workspace Engine
export { WorkspaceEngine, PROJECT_TEMPLATES } from './workspaceEngine';
export type {
  Workspace,
  WorkspaceFile,
  WorkspaceContext,
  WorkspaceConfig,
  WorkspaceTemplate,
  TemplateFile,
} from './workspaceEngine';

// Knowledge Vault
export { KnowledgeVault, extractWikiLinks, extractTags } from './knowledgeVault';
export type { VaultNote, VaultLink, VaultSearchResult, VaultStats } from './knowledgeVault';

// Extension Registry
export { ExtensionRegistry, satisfiesVersion, parseVersion, compareVersion } from './extensionRegistry';
export type {
  PluginManifest,
  RegisteredPlugin,
  PluginDependencyGraph,
  PluginSearchResult,
  VersionConflict,
} from './extensionRegistry';

// File Organizer
export { FileOrganizer, STRUCTURE_TEMPLATES } from './fileOrganizer';
export type {
  ProjectStructureTemplate,
  FilePlacement,
  ImportPathMapping,
  ProjectStructure,
  ProjectType,
} from './fileOrganizer';

// Knowledge Graph
export {
  buildGraphFromNotes,
  extractEntities,
  bfs,
  shortestPath,
  findClusters,
  exportForVisualization,
  inferRelationships,
} from './knowledgeGraph';
export type {
  GraphNode,
  GraphEdge,
  KnowledgeGraphData,
  TraversalResult,
  ClusterResult,
} from './knowledgeGraph';

// Integration Points
export {
  WorkspaceIntegrationPoints,
  MCPToolRegistry,
  ExternalServiceConnector,
  WebhookHandler,
} from './integrationPoints';
export type {
  MCPToolRegistration,
  WebhookSubscription,
  WebhookPayload,
  GitStatus,
  GitCommitResult,
  MCPToolCall,
  MCPToolResult,
  ExternalServiceConfig,
  ExternalServiceCall,
  ServiceCallResult,
  IntegrationPoint,
  WorkspaceIntegrationState,
} from './integrationPoints';
