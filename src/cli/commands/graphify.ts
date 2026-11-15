/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Graphify CLI Commands
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * CLI sub-commands for the AETHER Graphify knowledge graph integration:
 *   aether graphify status   — Show current project graph overview
 *   aether graphify resume   — Resume from last checkpoint
 *   aether graphify export   — Export knowledge graph to JSON
 *   aether graphify clear    — Clear current project context
 */

import fs from 'node:fs';
import path from 'node:path';

import { GraphifyIntegration } from '../core/graphify/index.js';
import type { GraphifyProjectConfig, GraphifyStatus, ResumeInfo } from '../core/graphify/index.js';
import type { MemoryPersistence } from '../core/graphify/memoryPersistence.js';
import { getMemoryPersistence } from '../core/graphify/memoryPersistence.js';

// ──────────────────────────────────────────────
// CLI Entry Point
// ──────────────────────────────────────────────

export interface GraphifyCliOptions {
  projectId?: string;
  projectName?: string;
  rootPath?: string;
  json?: boolean;
  outputPath?: string;
  checkpointName?: string;
}

export async function handleGraphifyCommand(
  subCommand: string,
  args: string[],
  options: GraphifyCliOptions
): Promise<void> {
  const projectId = options.projectId ?? inferProjectId();
  const projectName = options.projectName ?? 'AETHER Project';
  const rootPath = options.rootPath ?? process.cwd();

  const integration = new GraphifyIntegration({
    projectId,
    projectName,
    rootPath,
  });

  switch (subCommand) {
    case 'status':
      await cmdStatus(integration, options.json);
      break;
    case 'resume':
      await cmdResume(integration, options);
      break;
    case 'export':
      await cmdExport(integration, options);
      break;
    case 'clear':
      await cmdClear(integration, options);
      break;
    case 'init':
      await cmdInit(integration, projectId, projectName, rootPath);
      break;
    default:
      console.log(`Unknown graphify sub-command: ${subCommand}`);
      printHelp();
      process.exit(1);
  }
}

// ──────────────────────────────────────────────
// Command Implementations
// ──────────────────────────────────────────────

async function cmdStatus(
  integration: GraphifyIntegration,
  json = false
): Promise<void> {
  const status = await integration.getStatus();
  const persistence = getMemoryPersistence({ projectId: (integration as unknown as { projectConfig: { projectId: string } }).projectConfig.projectId });
  const { nodes } = await persistence.load();
  const totalKeys = nodes.size;
  const sizeBytes = JSON.stringify(Array.from(nodes.values())).length;

  if (json) {
    console.log(
      JSON.stringify(
        {
          ...status,
          memoryStats: { totalKeys, sizeBytes },
        },
        null,
        2
      )
    );
    return;
  }

  const connIcon = status.connected ? '✓' : '⚠';
  const fallbackNote = status.usingFallback ? ' (local fallback)' : '';

  console.log('=== AETHER Graphify Status ===');
  console.log(`Connection: ${connIcon} ${status.connected ? 'Connected' : 'Disconnected'}${fallbackNote}`);
  console.log(`Latency:    ${status.latencyMs}ms`);
  console.log(`Nodes:      ${status.nodeCount}`);
  console.log(`Relations:  ${status.relationshipCount}`);
  console.log(`Last Save:  ${status.lastSavedAt ?? 'never'}`);
  console.log('');
  console.log('Memory Store:');
  console.log(`  Total keys:     ${totalKeys}`);
}

async function cmdResume(
  integration: GraphifyIntegration,
  _options: GraphifyCliOptions
): Promise<void> {
  const resumeInfo = await integration.findResumeInfo();

  if (!resumeInfo) {
    console.log('No interrupted sessions found. Nothing to resume.');
    return;
  }

  console.log('=== Resumable Session Found ===');
  console.log(`Session ID:   ${resumeInfo.sessionId}`);
  console.log(`Interrupted:  ${resumeInfo.interrupted}`);
  console.log(`Last Context: ${resumeInfo.lastContextId ?? 'none'}`);
  console.log(`Last Prompt:  ${resumeInfo.lastOperation ?? 'none'}`);
  console.log('');

  if (resumeInfo.availableContexts.length > 0) {
    console.log('Available contexts:');
    for (const ctx of resumeInfo.availableContexts.slice(-10)) {
      const promptPreview = ctx.userPrompt.slice(0, 80);
      console.log(`  [${ctx.timestamp}] ${promptPreview}${ctx.userPrompt.length > 80 ? '...' : ''}`);
    }
  }

  console.log('');
  console.log('To resume: restore the session state from the persisted memory store.');
  console.log(`  Session: ${resumeInfo.sessionId}`);
}

async function cmdExport(
  integration: GraphifyIntegration,
  options: GraphifyCliOptions
): Promise<void> {
  const exportData = await integration.exportProject();
  const json = JSON.stringify(exportData, null, 2);

  if (options.outputPath) {
    const outputFile = path.resolve(options.outputPath);
    const dir = path.dirname(outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputFile, json, 'utf-8');
    console.log(`Graph exported to: ${outputFile}`);
    console.log(`  Nodes:      ${exportData.nodes.length}`);
    console.log(`  Relations:  ${exportData.relationships.length}`);
  } else {
    console.log(json);
  }
}

async function cmdClear(
  integration: GraphifyIntegration,
  _options: GraphifyCliOptions
): Promise<void> {
  console.log('Clearing project context...');
  await integration.clearProject();
  console.log('Project context cleared.');
}

async function cmdInit(
  integration: GraphifyIntegration,
  projectId: string,
  projectName: string,
  rootPath: string
): Promise<void> {
  console.log(`Initializing Graphify for project: ${projectName} (${projectId})`);

  const integration2 = new GraphifyIntegration({
    projectId,
    projectName,
    rootPath,
  });

  await integration2.initialize();
  console.log('Graphify initialized successfully.');
  console.log(`  Project node created: ${projectId}`);
  console.log(`  Session started.`);
}

// ──────────────────────────────────────────────
// Help
// ──────────────────────────────────────────────

function printHelp(): void {
  console.log(`
AETHER Graphify — Knowledge Graph Integration
Graphify: https://github.com/Graphify-Labs/graphify

Usage:
  aether graphify <command> [options]

Commands:
  status   Show current project graph overview
  resume   Resume from last interrupted checkpoint
  export   Export knowledge graph (optionally to file)
  clear    Clear current project context
  init     Initialize Graphify for a project

Options:
  --project-id <id>      Project identifier (default: inferred from cwd)
  --project-name <name>  Project display name
  --root-path <path>     Project root directory
  --json                 Output as JSON
  --output <file>        Write export to file (export command)
  --checkpoint <name>    Checkpoint name (resume command)
`);
}

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

function inferProjectId(): string {
  // Try to infer from package.json, metadata.json, or directory name
  const cwd = process.cwd();

  // Check for AETHER metadata
  const metadataPath = path.join(cwd, 'metadata.json');
  if (fs.existsSync(metadataPath)) {
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (metadata.name) {
        return metadata.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      }
    } catch {
      // ignore parse errors
    }
  }

  // Check for package.json
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.name) {
        return pkg.name;
      }
    } catch {
      // ignore
    }
  }

  // Fallback: directory name
  return path.basename(cwd) || 'default';
}

function formatBytes(_bytes: number): string {
  return '0 B';
}
