/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Multi-Harness Installer
 *
 * Writes clean, target-native configuration into a project directory instead of
 * a single manifest blob. Each supported harness gets the files it actually
 * discovers, so a fresh `aether install --target <harness>` produces a usable
 * setup rather than a `.aether/manifest.json` that the harness ignores.
 *
 * Supported harnesses:
 *   claude-code  -> .claude/agents/*.md + AGENTS.md + .mcp.json
 *   codex        -> AGENTS.md + .codex/agents/*.toml + .mcp.json
 *   cursor       -> .cursor/rules/aether.mdc + .cursor/mcp.json
 *   opencode     -> AGENTS.md + .opencode/mcp.json
 *   kimi         -> AGENTS.md + .kimi/README.md + .mcp.json
 *   all-harnesses-> every target-native file above
 *
 * The generated files are self-contained: they embed the AETHER engineering
 * conventions, the 8-tool MCP wiring, and a curated core-agent roster, so the
 * target project does not need the full AETHER repo checked out to use them.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { HarnessTarget } from './validator';

// =============================================================================
// SHARED CONTENT (embedded so installs are self-contained)
// =============================================================================

const MCP_CONFIG = {
  mcpServers: {
    aether: {
      command: 'npx',
      args: ['tsx', 'mcp/aether-mcp-server.ts'],
      author: 'Tabrej',
      license: 'Apache-2.0',
    },
  },
};

/** The 8 AETHER MCP tools, referenced by harness instruction files. */
const MCP_TOOL_LIST = `  - aether_skill_router      : lazy-activate the right AETHER skill for a task
  - aether_context_slice     : token-budgeted, AST-aware context window
  - aether_blast_radius      : pre-change impact analysis (callers, API, DB)
  - aether_swarm_scheduler   : dependency-ordered multi-agent task plan
  - aether_adversarial_gate  : hostile falsification before work is accepted
  - aether_security_spotlighter : secret/injection/trust-boundary scan
  - aether_continuity_checkpoint : zero-loss resume checkpoint
  - aether_component_score_refine : deterministic component quality scoring`;

/** A curated core-agent roster (a professional subset, not the full 96). */
const CORE_AGENTS = [
  { id: 'system-architect', role: 'System Architect', brief: 'Owns the target architecture, module boundaries, and requirement-to-task traceability.' },
  { id: 'backend-engineer', role: 'Backend Engineer', brief: 'Real, integration-complete backend: routes, services, DB access, business rules. No mocks in production paths.' },
  { id: 'frontend-engineer', role: 'Frontend Engineer', brief: 'Production UI: pages, state, interactions, responsive + accessible. Every visible control does something real.' },
  { id: 'database-architect', role: 'Database Architect', brief: 'Schema, migrations, indexes, and consistency. Expand/contract migrations, not destructive ones.' },
  { id: 'security-engineer', role: 'Security Engineer', brief: 'AuthN/Z, input validation, injection defense, secrets handling, and OWASP Top-10 coverage.' },
  { id: 'testing-engineer', role: 'Testing Engineer', brief: 'Unit, integration, and end-to-end tests that lock in behavior and catch regressions.' },
  { id: 'devops-engineer', role: 'DevOps Engineer', brief: 'CI/CD, deployment, observability, and production readiness.' },
  { id: 'product-researcher', role: 'Product Researcher', brief: 'Industry + competitor research that drives the requirement set, not a disconnected report.' },
] as const;

// =============================================================================
// PER-HARNESS FILE GENERATORS
// =============================================================================

interface InstallContext {
  target: HarnessTarget;
  projectName?: string;
  includeMcp: boolean;
}

function mcpWiringContent(): string {
  return JSON.stringify(MCP_CONFIG, null, 2) + '\n';
}

function claudeAgentsDirContent(ctx: InstallContext): Record<string, string> {
  const files: Record<string, string> = {};
  for (const a of CORE_AGENTS) {
    files[`.claude/agents/${a.id}.md`] = [
      `---`,
      `name: ${a.id}`,
      `description: ${a.role} — ${a.brief}`,
      `---`,
      ``,
      `You are AETHER's ${a.role} agent.`,
      ``,
      `## Responsibility`,
      a.brief,
      ``,
      `## Rules`,
      `1. Work only inside the scope AETHER assigns you; do not redefine project scope to make work look complete.`,
      `2. Never mark a requirement complete without the AETHER verification gate (adversarial + security + coverage).`,
      `3. Prefer real, tested functionality over mock data. If a real dependency needs credentials, wire the integration and document exactly what is missing.`,
      `4. Run the blast-radius check before mutating shared symbols.`,
      ``,
      `## Tools`,
      `Use the AETHER MCP tools where they help; AETHER independently verifies results.`,
      ``,
    ].join('\n');
  }
  // Root instruction file Claude Code discovers.
  files['AGENTS.md'] = renderClaudeInstructions(ctx);
  return files;
}

function renderClaudeInstructions(ctx: InstallContext): string {
  return [
    `# AETHER`,
    ``,
    `Autonomous AI product-engineering harness for ${ctx.projectName ?? 'this project'}. One short brief in; a`,
    `complete, independently-verified, production-prepared product out. The model executes; AETHER`,
    `owns the engineering process and the definition of "done".`,
    ``,
    `## Engineering authority`,
    `- AETHER maintains the requirement set, architecture, task graph, and acceptance criteria.`,
    `- The model must not shrink scope to look finished. Unmet requirements are sent back for work.`,
    `- "Done" is declared only after the adversarial gate, security spotlighter, and requirement-coverage check pass.`,
    ``,
    `## Core agents`,
    ...CORE_AGENTS.map(a => `- ${a.id} — ${a.role}: ${a.brief}`),
    ``,
    ...(ctx.includeMcp
      ? [
          `## AETHER MCP tools`,
          MCP_TOOL_LIST,
          ``,
        ]
      : []),
    `## Workflow`,
    `1. Understand the brief -> 2. Research the industry -> 3. Plan the complete product ->`,
    `4. Architecture & infrastructure -> 5. Full implementation -> 6. Independent verification ->`,
    `7. Production preparation. Fix loops run until acceptance criteria are met or a real external blocker is hit.`,
    ``,
  ].join('\n');
}

function codexFiles(ctx: InstallContext): Record<string, string> {
  const files: Record<string, string> = {};
  files['AGENTS.md'] = [
    `# AETHER for Codex`,
    ``,
    `AETHER drives the engineering process; Codex is the execution environment.`,
    ``,
    `## Rules`,
    `- AETHER owns requirements, architecture, and the definition of done. Do not shrink scope to look complete.`,
    `- Mark work done only after AETHER's adversarial gate + security spotlighter + requirement-coverage pass.`,
    `- Prefer real, tested functionality over mocks; document any credential-gated integration instead of faking it.`,
    ``,
    `## Core agents`,
    ...CORE_AGENTS.map(a => `- ${a.id} — ${a.role}: ${a.brief}`),
    ``,
    ...(ctx.includeMcp
      ? [`## AETHER MCP tools`, MCP_TOOL_LIST, '']
      : []),
  ].join('\n');

  // Native Codex subagent definitions.
  files['.codex/agents/explorer.toml'] = `model = "sonnet"\nmodel_reasoning_effort = "medium"\nsandbox_mode = "read-only"\n\ndeveloper_instructions = """\nAETHER read-only explorer. Trace the real execution path, cite files and symbols,\nand surface what already exists before proposing changes. Use targeted search; do not edit.\n"""\n`;
  files['.codex/agents/planner.toml'] = `model = "opus"\nmodel_reasoning_effort = "high"\nsandbox_mode = "read-only"\n\ndeveloper_instructions = """\nAETHER product planner. Turn a short brief into a complete, traceable plan: research,\nrequirement inventory, architecture, requirement-to-task matrix, and acceptance criteria.\nNever shrink scope — AETHER verifies completeness independently.\n"""\n`;
  files['.codex/agents/reviewer.toml'] = `model = "opus"\nmodel_reasoning_effort = "high"\nsandbox_mode = "read-only"\n\ndeveloper_instructions = """\nAETHER independent reviewer. Prioritize correctness, security, regressions, and missing\ntests. Lead with a reproducer; run the adversarial gate and security spotlighter so the\nverdict is tool-backed, not just read-back.\n"""\n`;
  files['.codex/config.toml'] = [
    `persistent_instructions = "Follow AETHER rules (.codex/AGENTS.md). AETHER verifies completion — do not mark done without the verification gate."`,
    ``,
    `[features]`,
    `multi_agent = true`,
    ``,
    `[agents]`,
    `max_threads = 6`,
    `max_depth = 1`,
    ``,
    `[agents.explorer]`,
    `description = "Read-only codebase explorer."`,
    `config_file = "agents/explorer.toml"`,
    ``,
    `[agents.planner]`,
    `description = "Product & architecture planner."`,
    `config_file = "agents/planner.toml"`,
    ``,
    `[agents.reviewer]`,
    `description = "Correctness / security / missing-test reviewer."`,
    `config_file = "agents/reviewer.toml"`,
    ``,
  ].join('\n');
  return files;
}

function cursorFiles(ctx: InstallContext): Record<string, string> {
  const files: Record<string, string> = {};
  files['.cursor/rules/aether.mdc'] = [
    `---`,
    `description: AETHER autonomous product-engineering rules`,
    `globs: **/*`,
    `alwaysApply: true`,
    `---`,
    ``,
    `AETHER drives the engineering process; this harness is the execution environment.`,
    ``,
    `## Rules`,
    `- AETHER owns requirements, architecture, and the definition of done; never shrink scope to look complete.`,
    `- Mark work done only after AETHER's adversarial gate + security spotlighter + requirement-coverage pass.`,
    `- Prefer real, tested functionality over mocks; document credential-gated integrations instead of faking them.`,
    ``,
    `## Core agents`,
    ...CORE_AGENTS.map(a => `- ${a.id} — ${a.role}: ${a.brief}`),
    ``,
  ].join('\n');
  if (ctx.includeMcp) {
    files['.cursor/mcp.json'] = mcpWiringContent();
  }
  return files;
}

function opencodeFiles(ctx: InstallContext): Record<string, string> {
  const files: Record<string, string> = {};
  files['AGENTS.md'] = [
    `# AETHER for OpenCode`,
    ``,
    `AETHER drives the engineering process; OpenCode is the execution environment.`,
    ``,
    `## Rules`,
    `- AETHER owns requirements, architecture, and the definition of done; never shrink scope to look complete.`,
    `- Mark work done only after AETHER's adversarial gate + security spotlighter + requirement-coverage pass.`,
    `- Prefer real, tested functionality over mocks.`,
    ``,
    `## Core agents`,
    ...CORE_AGENTS.map(a => `- ${a.id} — ${a.role}: ${a.brief}`),
    ``,
  ].join('\n');
  if (ctx.includeMcp) {
    files['.opencode/mcp.json'] = mcpWiringContent();
  }
  return files;
}

function kimiFiles(ctx: InstallContext): Record<string, string> {
  const files: Record<string, string> = {};
  files['AGENTS.md'] = [
    `# AETHER for Kimi Code`,
    ``,
    `AETHER drives the engineering process; Kimi Code is the execution environment.`,
    ``,
    `## Rules`,
    `- AETHER owns requirements, architecture, and the definition of done; never shrink scope to look complete.`,
    `- Mark work done only after AETHER's adversarial gate + security spotlighter + requirement-coverage pass.`,
    `- Prefer real, tested functionality over mocks.`,
    ``,
    `## Core agents`,
    ...CORE_AGENTS.map(a => `- ${a.id} — ${a.role}: ${a.brief}`),
    ``,
  ].join('\n');
  files['.kimi/README.md'] = `# AETHER for Kimi Code\n\nSee AGENTS.md. Kimi Code reuses the shared AETHER agent/skill/MCP definitions.\n`;
  if (ctx.includeMcp) {
    files['.mcp.json'] = mcpWiringContent();
  }
  return files;
}

// =============================================================================
// PUBLIC API
// =============================================================================

export interface GeneratedHarnessFile {
  /** path relative to the target project root */
  path: string;
  content: string;
  description: string;
}

export interface InstallResult {
  target: HarnessTarget;
  /** all files that should be written (harness-native, clean) */
  files: GeneratedHarnessFile[];
  /** files AETHER owns, for scoped uninstall */
  ownedFiles: string[];
  /** human-readable summary lines */
  summary: string[];
}

const DESCRIPTIONS: Record<string, string> = {
  'AGENTS.md': 'Project instruction file discovered by the harness',
  '.mcp.json': 'MCP server wiring (8 AETHER tools)',
  '.codex/config.toml': 'Codex multi-agent + MCP configuration',
  '.codex/agents/explorer.toml': 'Codex read-only explorer subagent',
  '.codex/agents/planner.toml': 'Codex product planner subagent',
  '.codex/agents/reviewer.toml': 'Codex independent reviewer subagent',
  '.cursor/rules/aether.mdc': 'Cursor project rules',
  '.cursor/mcp.json': 'Cursor MCP server wiring',
  '.opencode/mcp.json': 'OpenCode MCP server wiring',
  '.kimi/README.md': 'Kimi Code discovery notes',
};

function describe(p: string): string {
  if (p.startsWith('.claude/agents/')) return `Claude Code agent: ${path.basename(p, '.md')}`;
  return DESCRIPTIONS[p] ?? 'AETHER harness file';
}

/**
 * Compute the clean, target-native files for a harness install.
 * Pure (no I/O) so it is unit-testable; see {@link writeInstall} to persist.
 */
export function buildHarnessInstall(input: {
  target: HarnessTarget;
  projectName?: string;
  includeMcp?: boolean;
}): InstallResult {
  const ctx: InstallContext = {
    target: input.target,
    projectName: input.projectName,
    includeMcp: input.includeMcp ?? true,
  };

  // Build the per-harness file map. claude-code and all-harnesses write the
  // .claude/ agent tree; every harness that benefits from MCP also gets .mcp.json.
  const fileMap: Record<string, string> = {};

  const add = (m: Record<string, string>) => {
    for (const [k, v] of Object.entries(m)) fileMap[k] = v;
  };

  switch (input.target) {
    case 'claude-code':
      add(claudeAgentsDirContent(ctx));
      if (ctx.includeMcp) fileMap['.mcp.json'] = mcpWiringContent();
      break;
    case 'codex':
      add(codexFiles(ctx));
      if (ctx.includeMcp) fileMap['.mcp.json'] = mcpWiringContent();
      break;
    case 'cursor':
      add(cursorFiles(ctx));
      break;
    case 'opencode':
      add(opencodeFiles(ctx));
      break;
    case 'kimi':
      add(kimiFiles(ctx));
      break;
    case 'mcp-server':
      if (ctx.includeMcp) fileMap['.mcp.json'] = mcpWiringContent();
      break;
    case 'all-harnesses':
      add(claudeAgentsDirContent(ctx));
      add(codexFiles(ctx));
      add(cursorFiles(ctx));
      add(opencodeFiles(ctx));
      add(kimiFiles(ctx));
      // Deduplicate .mcp.json across harnesses (kimiFiles already adds it).
      if (ctx.includeMcp) fileMap['.mcp.json'] = mcpWiringContent();
      break;
    default:
      break;
  }

  const files: GeneratedHarnessFile[] = Object.entries(fileMap).map(([p, content]) => ({
    path: p,
    content,
    description: describe(p),
  }));

  return {
    target: input.target,
    files,
    ownedFiles: files.map(f => f.path),
    summary: files.map(f => `  - ${f.path}  (${f.description})`),
  };
}

/**
 * Write a harness install into a directory. Creates parent dirs, writes each
 * file, and records the owned-files manifest for scoped uninstall.
 * Returns the owned file list.
 */
export function writeInstall(outDir: string, result: InstallResult): string[] {
  const out = path.resolve(outDir);
  for (const f of result.files) {
    const full = path.join(out, f.path);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, f.content, 'utf8');
  }

  // Owned-files manifest (AETHER-only, so uninstall is scoped and safe).
  const manifestDir = path.join(out, '.aether');
  fs.mkdirSync(manifestDir, { recursive: true });
  fs.writeFileSync(
    path.join(manifestDir, 'owned-files.json'),
    JSON.stringify({ ownedFiles: result.ownedFiles, target: result.target, installedAtIso: new Date().toISOString() }, null, 2),
    'utf8'
  );

  return result.ownedFiles;
}
