/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER CLI — Graphify Command Group
 *
 * Graphify inspiration credit:
 *   Graphify — Knowledge Graph for AI Engineering Context
 *   https://github.com/Graphify-Labs/graphify
 *
 * This module integrates the Graphify knowledge graph as a first-class
 * command group in the AETHER CLI. It provides:
 *   - Command routing for `aether graphify <subcommand>`
 *   - Auto-save hooks that persist context after each generation
 *   - Startup resume prompt when an interrupted session is detected
 *   - Integration with the existing bin/aether.ts CLI entry point
 */

import fs from 'node:fs';
import path from 'node:path';

import type { GraphifyStatus, ResumeInfo, CodePatternNode } from '../core/graphify';
import {
  GraphifyIntegration,
  createGraphifyIntegration,
  type GraphifyProjectConfig,
} from '../core/graphify';
import { ContextManager, createContextManager, type ContextManagerConfig } from '../core/memory/contextManager';
import { MemoryPersistence, getMemoryPersistence } from '../core/graphify/memoryPersistence';

// ──────────────────────────────────────────────
// Public API (consumed by bin/aether.ts)
// ──────────────────────────────────────────────

export interface GraphifyCommandContext {
  integration: GraphifyIntegration;
  contextManager: ContextManager;
  persistence: MemoryPersistence;
}

export interface GraphifyRouterOptions {
  projectId?: string;
  projectName?: string;
  rootPath?: string;
  autoSaveInterval?: number;
  maxContextTokens?: number;
}

/**
 * Entry point for the `aether graphify` command group.
 * Called from bin/aether.ts when the first CLI arg is "graphify".
 */
export async function routeGraphifyCommand(
  args: string[],
  options: GraphifyRouterOptions = {}
): Promise<void> {
  const subCommand = args[0] ?? 'status';
  const remainingArgs = args.slice(1);

  // Resolve project info
  const projectId = options.projectId ?? inferProjectId();
  const projectName = options.projectName ?? 'AETHER Project';
  const rootPath = options.rootPath ?? process.cwd();

  // Create integration
  const integration = createGraphifyIntegration({
    projectId,
    projectName,
    rootPath,
    autoSaveInterval: options.autoSaveInterval ?? 5,
  });

  // Create context manager
  const contextManager = createContextManager({
    projectId,
    projectName,
    rootPath,
    maxTokens: options.maxContextTokens ?? 128_000,
    autoSaveEvery: options.autoSaveInterval ?? 5,
  });

  const persistence = getMemoryPersistence({ projectId });

  switch (subCommand) {
    case 'status':
      await handleStatus(integration, false);
      break;
    case 'resume':
      await handleResume(integration, remainingArgs);
      break;
    case 'export':
      await handleExport(integration, remainingArgs);
      break;
    case 'clear':
      await handleClear(integration);
      break;
    case 'init':
      await handleInit(integration);
      break;
    case 'context':
      await handleContext(contextManager, remainingArgs);
      break;
    case 'patterns':
      await handlePatterns(integration, remainingArgs);
      break;
    case 'help':
    case '--help':
    case '-h':
      printGraphifyHelp();
      break;
    default:
      console.error(`Unknown graphify sub-command: ${subCommand}`);
      printGraphifyHelp();
      process.exit(1);
  }
}

// ──────────────────────────────────────────────
// Command Handlers
// ──────────────────────────────────────────────

async function handleStatus(integration: GraphifyIntegration, json = false): Promise<void> {
  const status = await integration.getStatus();
  const persistence = getMemoryPersistence({ projectId: inferProjectId() });
  const { nodes } = await persistence.load();
  const totalKeys = nodes.size;

  if (json) {
    console.log(JSON.stringify({ ...status, memoryStats: { totalKeys } }, null, 2));
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

async function handleResume(integration: GraphifyIntegration, args: string[]): Promise<void> {
  const jsonOutput = args.includes('--json');

  const resumeInfo = await integration.findResumeInfo();

  if (!resumeInfo) {
    if (jsonOutput) {
      console.log(JSON.stringify({ resumed: false, reason: 'No interrupted sessions found' }));
    } else {
      console.log('No interrupted sessions found. Nothing to resume.');
    }
    return;
  }

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          resumed: true,
          sessionId: resumeInfo.sessionId,
          lastOperation: resumeInfo.lastOperation,
          contextCount: resumeInfo.availableContexts.length,
        },
        null,
        2
      )
    );
  } else {
    console.log('=== Resumable Session Found ===');
    console.log(`Session ID:   ${resumeInfo.sessionId}`);
    console.log(`Interrupted:  ${resumeInfo.interrupted}`);
    console.log(`Last Context: ${resumeInfo.lastContextId ?? 'none'}`);
    console.log(`Last Prompt:  ${resumeInfo.lastOperation ?? 'none'}`);
    console.log('');

    if (resumeInfo.availableContexts.length > 0) {
      console.log('Recent contexts:');
      for (const ctx of resumeInfo.availableContexts.slice(-10)) {
        const preview = ctx.userPrompt.slice(0, 80);
        console.log(
          `  [${ctx.timestamp}] ${preview}${ctx.userPrompt.length > 80 ? '...' : ''}`
        );
      }
    }

    console.log('');
    console.log('To resume, restore the session state from the persisted memory store.');
    console.log(`  Session: ${resumeInfo.sessionId}`);
  }
}

async function handleExport(integration: GraphifyIntegration, args: string[]): Promise<void> {
  const outputFlag = args.indexOf('--output');
  const outputPath = outputFlag >= 0 && outputFlag + 1 < args.length ? args[outputFlag + 1] : null;

  const exportData = await integration.exportProject();
  const json = JSON.stringify(exportData, null, 2);

  if (outputPath) {
    const resolved = resolvePath(outputPath);
    ensureDir(path.dirname(resolved));
    fs.writeFileSync(resolved, json, 'utf-8');
    console.log(`Graph exported to: ${resolved}`);
    console.log(`  Nodes:      ${exportData.nodes.length}`);
    console.log(`  Relations:  ${exportData.relationships.length}`);
  } else {
    console.log(json);
  }
}

async function handleClear(integration: GraphifyIntegration): Promise<void> {
  console.log('Clearing project context from Graphify...');
  await integration.clearProject();
  console.log('Project context cleared.');
}

async function handleInit(integration: GraphifyIntegration): Promise<void> {
  const projectId = inferProjectId();
  console.log(`Initializing Graphify for project: ${projectId}`);
  await integration.initialize();
  console.log('Graphify initialized successfully.');
}

async function handleContext(
  contextManager: ContextManager,
  args: string[]
): Promise<void> {
  const sub = args[0];

  switch (sub) {
    case 'status':
    case undefined: {
      const status = contextManager.getStatus();
      console.log('=== Context Window ===');
      console.log(`Messages:  ${status.messageCount}`);
      console.log(`Tokens:    ${status.totalTokens} / ${status.maxTokens}`);
      console.log(`Usage:     ${status.usedPercent}%`);
      if (status.oldestMessageAge) {
        console.log(`Oldest:    ${status.oldestMessageAge}`);
      }
      break;
    }
    case 'clear':
      contextManager.clearWindow();
      console.log('Context window cleared.');
      break;
    case 'interrupt':
      contextManager.markInterrupted();
      console.log('Session marked as interrupted. Use `aether graphify resume` to resume later.');
      break;
    default:
      console.log(`Unknown context sub-command: ${sub}`);
      break;
  }
}

async function handlePatterns(
  integration: GraphifyIntegration,
  _args: string[]
): Promise<void> {
  const result = await integration.exportProject();

  const patterns = result.nodes.filter((n): n is CodePatternNode => n.type === 'CodePattern');

  console.log('=== Code Patterns ===');
  if (patterns.length === 0) {
    console.log('No code patterns stored yet.');
    return;
  }

  for (const p of patterns) {
    const category = (p as unknown as { category?: string }).category ?? 'unknown';
    const name = (p as unknown as { name?: string }).name ?? 'unnamed';
    console.log(`  [${category}] ${name}`);
  }
}

// ──────────────────────────────────────────────
// Startup Resume Prompt
// ──────────────────────────────────────────────

/**
 * Check for an interrupted session and print a resume prompt if found.
 * Call this early in the application lifecycle.
 */
export async function checkAndPromptResume(
  projectId?: string,
  projectName?: string,
  rootPath?: string
): Promise<ResumeInfo | null> {
  const resolvedProjectId = projectId ?? inferProjectId();

  const integration = createGraphifyIntegration({
    projectId: resolvedProjectId,
    projectName: projectName ?? 'AETHER Project',
    rootPath: rootPath ?? process.cwd(),
  });

  // Lazy-init: just check, don't fully initialize
  const connected = await (integration as unknown as { getGraphifyIntegration: () => { healthCheck: () => Promise<{ connected: boolean; usingFallback: boolean }> } }).getGraphifyIntegration().healthCheck();

  if (!connected.connected && !connected.usingFallback) {
    return null;
  }

  const resumeInfo = await integration.findResumeInfo();

  if (resumeInfo?.interrupted) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║  AETHER Graphify: Interrupted session detected          ║');
    console.log(`║  Last prompt: ${resumeInfo.lastOperation?.slice(0, 50) ?? 'N/A'}${' '.repeat(Math.max(0, 49 - (resumeInfo.lastOperation?.length ?? 0)))}║`);
    console.log(`║  Run \u001b[1maether graphify resume\u001b[0m${' '.repeat(Math.max(0, 35))}║`);
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');
  }

  return resumeInfo;
}

// ──────────────────────────────────────────────
// Auto-Save Hook
// ──────────────────────────────────────────────

/**
 * Auto-save hook to call after each generation operation.
 * Persists context to Graphify without blocking the caller.
 */
export function createAutoSaveHook(
  integration: GraphifyIntegration,
  contextManager: ContextManager
): () => void {
  let opCount = 0;
  const interval = (integration as unknown as { projectConfig: { autoSaveInterval: number } })
    .projectConfig.autoSaveInterval;

  return () => {
    opCount++;
    if (opCount >= interval) {
      opCount = 0;
      void contextManager.getGraphifyIntegration()
        .saveContext({
          userPrompt: '[auto-save checkpoint]',
          generatedCodeHash: null,
          handledBy: 'auto-save-hook',
          tags: ['auto-saved', 'checkpoint'],
          metadata: { operationCount: opCount },
        })
        .catch(() => {
          // Silently fail — auto-save should never block
        });
    }
  };
}

// ──────────────────────────────────────────────
// Help
// ──────────────────────────────────────────────

function printGraphifyHelp(): void {
  console.log(`
AETHER Graphify — Knowledge Graph Integration
Inspired by: https://github.com/Graphify-Labs/graphify

Usage:
  aether graphify <command> [options]

Commands:
  status       Show current project graph overview
  resume       Resume from last interrupted checkpoint
  export       Export knowledge graph (optionally to file)
  clear        Clear current project context from Graphify
  init         Initialize Graphify for the current project
  context      Manage conversation context window
  patterns     List stored code patterns

Sub-commands:
  aether graphify context status    Show context window status
  aether graphify context clear     Clear the rolling context window
  aether graphify context interrupt Mark session as interrupted

Options:
  --json              Output as JSON
  --output <file>     Write export to file (export command)
  --project-id <id>   Override project identifier
`);
}

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

function inferProjectId(): string {
  const cwd = process.cwd();

  // metadata.json
  const metaPath = path.join(cwd, 'metadata.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      if (meta.name) {
        return meta.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      }
    } catch { /* ignore */ }
  }

  // package.json
  const pkgPath = path.join(cwd, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.name) {
        return pkg.name;
      }
    } catch { /* ignore */ }
  }

  return path.basename(cwd) || 'default';
}

function resolvePath(p: string): string {
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}
