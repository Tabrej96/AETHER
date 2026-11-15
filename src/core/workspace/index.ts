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
 * Inspired by:
 *   - HeyPuter/puter      (AGPL-3.0; browser-workspace concept researched only)
 *   - obsidianmd/obsidian-releases (public plugin-registry model)
 *
 * AETHER-native: clean-room implementation; no copied code.
 */

// Workspace Engine
export {
  WorkspaceEngine,
  type Workspace,
  type WorkspaceFile,
  type WorkspaceContext,
  type WorkspaceConfig,
  type WorkspaceTemplate,
  type TemplateFile,
  PROJECT_TEMPLATES,
} from './workspaceEngine';

// Knowledge Vault
export {
  KnowledgeVault,
  extractWikiLinks,
  extractTags,
  type VaultNote,
  type VaultLink,
  type VaultSearchResult,
  type VaultStats,
} from './knowledgeVault';

// Extension Registry
export {
  ExtensionRegistry,
  type PluginManifest,
  type RegisteredPlugin,
  type PluginDependencyGraph,
  type PluginSearchResult,
  type VersionConflict,
  satisfiesVersion,
  parseVersion,
  compareVersion,
} from './extensionRegistry';

// File Organizer
export {
  FileOrganizer,
  type ProjectStructureTemplate,
  type FilePlacement,
  type ImportPathMapping,
  type ProjectStructure,
  type ProjectType,
  STRUCTURE_TEMPLATES,
} from './fileOrganizer';

// Knowledge Graph
export {
  KnowledgeGraphData,
  buildGraphFromNotes,
  extractEntities,
  bfs,
  shortestPath,
  findClusters,
  exportForVisualization,
  inferRelationships,
  type GraphNode,
  type GraphEdge,
  type TraversalResult,
  type ClusterResult,
} from './knowledgeGraph';

// Integration Points
export {
  WorkspaceIntegrationPoints,
  MCPToolRegistry,
  MCPToolRegistration,
  ExternalServiceConnector,
  WebhookHandler,
  WebhookSubscription,
  WebhookPayload,
  GitStatus,
  GitCommitResult,
  MCPToolCall,
  MCPToolResult,
  ExternalServiceCall,
  ServiceCallResult,
  IntegrationPoint,
  WorkspaceIntegrationState,
} from './integrationPoints';
export type { ExternalServiceConfig } from './integrationPoints';
