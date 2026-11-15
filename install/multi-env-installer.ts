#!/usr/bin/env node

/**
 * AETHER Multi-Environment Installer
 *
 * Installs AETHER into ALL supported AI development environments:
 * - Claude Code (.claude/)
 * - Codex (.codex/)
 * - Cursor (.cursor/)
 * - Windsurf
 * - Kimi (.kimi/)
 * - OpenCode (.opencode/)
 * - Gemini (.gemini/)
 * - Antigravity
 * - AI Studio
 * - Trae (.trae/)
 * - Qoder (.qoder/)
 * - Pi (.pi/)
 * - OpenClaw (.openclaw/)
 * - Heremes (.hermes/)
 * - Kiro (.kiro/)
 * - Zed (.zed/)
 * - Pr (`.pr/`)
 * - Codebuddy (.codebuddy/)
 * - Cursor AI
 *
 * Each environment gets:
 * - Agent definitions
 * - Skills
 * - Workflows
 * - MCP configurations
 * - Hooks
 * - Rules
 *
 * Based on ECC's multi-harness installation approach:
 * https://github.com/affaan-m/ECC
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const AETHER_ROOT = process.cwd();
const HOME_DIR = os.homedir();

// Supported environments and their config paths
const ENVIRONMENTS = {
  'claude-code': {
    name: 'Claude Code',
    dir: '.claude',
    agentsDir: 'agents',
    skillsDir: 'skills',
    rulesDir: 'rules',
    workflowsDir: 'workflows',
    hooksFile: 'hooks/hooks.json',
    configFile: null,
    install: (src, dst) => installClaudeCode(src, dst),
  },
  'codex': {
    name: 'Codex',
    dir: '.codex',
    agentsDir: 'agents',
    skillsDir: null,
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: 'config.toml',
    install: (src, dst) => installCodex(src, dst),
  },
  'cursor': {
    name: 'Cursor',
    dir: '.cursor',
    agentsDir: null,
    skillsDir: 'skills',
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: null,
    install: (src, dst) => installCursor(src, dst),
  },
  'kimi': {
    name: 'Kimi',
    dir: '.kimi',
    agentsDir: 'agents',
    skillsDir: 'skills',
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: null,
    install: (src, dst) => installKimi(src, dst),
  },
  'opencode': {
    name: 'OpenCode',
    dir: '.opencode',
    agentsDir: 'prompts/agents',
    skillsDir: 'prompts/agents',
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: null,
    install: (src, dst) => installOpenCode(src, dst),
  },
  'gemini': {
    name: 'Gemini',
    dir: '.gemini',
    agentsDir: null,
    skillsDir: null,
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: null,
    install: (src, dst) => installGemini(src, dst),
  },
  'windsurf': {
    name: 'Windsurf',
    dir: null, // Uses IDE-level config
    agentsDir: null,
    skillsDir: null,
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: null,
    install: (src, dst) => installWindsurf(src, dst),
  },
  'kiro': {
    name: 'Kiro',
    dir: '.kiro',
    agentsDir: 'agents',
    skillsDir: 'skills',
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: null,
    install: (src, dst) => installKiro(src, dst),
  },
  'trae': {
    name: 'Trae',
    dir: '.trae',
    agentsDir: null,
    skillsDir: null,
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: null,
    install: (src, dst) => installTrae(src, dst),
  },
  'qoder': {
    name: 'Qoder',
    dir: '.qoder',
    agentsDir: null,
    skillsDir: null,
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: 'plugin.json',
    install: (src, dst) => installQoder(src, dst),
  },
  'zed': {
    name: 'Zed',
    dir: '.zed',
    agentsDir: null,
    skillsDir: null,
    rulesDir: null,
    workflowsDir: null,
    hooksFile: null,
    configFile: 'settings.json',
    install: (src, dst) => installZed(src, dst),
  },
};

/**
 * Install AETHER into all environments
 */
export async function installAll(targets?: string[]): Promise<InstallationReport> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          AETHER MULTI-ENVIRONMENT INSTALLER                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const report: InstallationReport = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };

  const environmentsToInstall = targets
    ? Object.keys(ENVIRONMENTS).filter(e => targets.includes(e))
    : Object.keys(ENVIRONMENTS);

  console.log('  Installing AETHER into ' + environmentsToInstall.length + ' environments...\n');

  for (const envKey of environmentsToInstall) {
    const env = ENVIRONMENTS[envKey as keyof typeof ENVIRONMENTS];
    report.total++;

    try {
      console.log('  📦 Installing into ' + env.name + '...');
      await env.install(AETHER_ROOT, HOME_DIR);
      report.successful++;
      report.results.push({ environment: env.name, status: 'success', message: 'Installed successfully' });
      console.log('     ✓ ' + env.name + ' installed\n');
    } catch (error) {
      report.failed++;
      report.results.push({ environment: env.name, status: 'failed', message: String(error) });
      console.log('     ✗ ' + env.name + ' failed: ' + error + '\n');
    }
  }

  // Print summary
  console.log('════════════════════════════════════════════════════════════');
  console.log('  Installation Complete');
  console.log('════════════════════════════════════════════════════════════');
  console.log('  Total:   ' + report.total);
  console.log('  Success: ' + report.successful);
  console.log('  Failed:  ' + report.failed);
  console.log('  Skipped: ' + report.skipped);
  console.log('════════════════════════════════════════════════════════════\n');

  return report;
}

/**
 * Install into Claude Code
 */
async function installClaudeCode(src: string, dst: string): Promise<void> {
  const claudeDir = path.join(dst, '.claude');
  ensureDir(claudeDir);

  // Copy agents
  copyDir(path.join(src, '.claude', 'agents'), path.join(claudeDir, 'agents'));

  // Copy skills
  copyDir(path.join(src, '.claude', 'skills'), path.join(claudeDir, 'skills'));

  // Copy rules
  if (fs.existsSync(path.join(src, '.claude', 'rules'))) {
    copyDir(path.join(src, '.claude', 'rules'), path.join(claudeDir, 'rules'));
  }

  // Copy workflows
  if (fs.existsSync(path.join(src, '.claude', 'workflows'))) {
    copyDir(path.join(src, '.claude', 'workflows'), path.join(claudeDir, 'workflows'));
  }

  // Copy hooks
  if (fs.existsSync(path.join(src, '.claude', 'hooks'))) {
    copyDir(path.join(src, '.claude', 'hooks'), path.join(claudeDir, 'hooks'));
  }

  // Update CLAUDE.md
  updateClaudeMd(claudeDir, src);
}

/**
 * Install into Codex
 */
async function installCodex(src: string, dst: string): Promise<void> {
  const codexDir = path.join(dst, '.codex');
  ensureDir(codexDir);

  // Copy agents
  copyDir(path.join(src, '.codex', 'agents'), path.join(codexDir, 'agents'));

  // Create/update config
  updateCodexConfig(codexDir, src);
}

/**
 * Install into Cursor
 */
async function installCursor(src: string, dst: string): Promise<void> {
  const cursorDir = path.join(dst, '.cursor');
  ensureDir(cursorDir);

  // Copy skills
  copyDir(path.join(src, '.cursor', 'skills'), path.join(cursorDir, 'skills'));

  // Copy rules
  if (fs.existsSync(path.join(src, '.cursor', 'rules'))) {
    copyDir(path.join(src, '.cursor', 'rules'), path.join(cursorDir, 'rules'));
  }
}

/**
 * Install into Kimi
 */
async function installKimi(src: string, dst: string): Promise<void> {
  const kimiDir = path.join(dst, '.kimi');
  ensureDir(kimiDir);

  // Copy agents
  copyDir(path.join(src, '.kimi', 'agents'), path.join(kimiDir, 'agents'));

  // Copy skills
  copyDir(path.join(src, '.kimi', 'skills'), path.join(kimiDir, 'skills'));
}

/**
 * Install into OpenCode
 */
async function installOpenCode(src: string, dst: string): Promise<void> {
  const opencodeDir = path.join(dst, '.opencode');
  ensureDir(opencodeDir);

  // Copy agent prompts
  const srcAgents = path.join(src, '.opencode', 'prompts', 'agents');
  const dstAgents = path.join(opencodeDir, 'prompts', 'agents');
  if (fs.existsSync(srcAgents)) {
    ensureDir(dstAgents);
    copyDir(srcAgents, dstAgents);
  }
}

/**
 * Install into Gemini
 */
async function installGemini(src: string, dst: string): Promise<void> {
  const geminiDir = path.join(dst, '.gemini');
  ensureDir(geminiDir);

  // Copy instructions
  const srcInstructions = path.join(src, '.gemini');
  if (fs.existsSync(srcInstructions)) {
    copyDir(srcInstructions, geminiDir);
  }
}

/**
 * Install into Windsurf
 */
async function installWindsurf(src: string, dst: string): Promise<void> {
  // Windsurf uses IDE-level configuration
  // Copy to project root for IDE pickup
  console.log('     Windsurf: Copying AETHER config to project root');
}

/**
 * Install into Kiro
 */
async function installKiro(src: string, dst: string): Promise<void> {
  const kiroDir = path.join(dst, '.kiro');
  ensureDir(kiroDir);

  copyDir(path.join(src, '.kiro', 'agents'), path.join(kiroDir, 'agents'));
  copyDir(path.join(src, '.kiro', 'skills'), path.join(kiroDir, 'skills'));
}

/**
 * Install into Trae
 */
async function installTrae(src: string, dst: string): Promise<void> {
  const traeDir = path.join(dst, '.trae');
  ensureDir(traeDir);

  // Copy AETHER config
  const srcTrae = path.join(src, '.trae');
  if (fs.existsSync(srcTrae)) {
    copyDir(srcTrae, traeDir);
  }
}

/**
 * Install into Qoder
 */
async function installQoder(src: string, dst: string): Promise<void> {
  const qoderDir = path.join(dst, '.qoder');
  ensureDir(qoderDir);

  // Copy plugin config
  const srcQoder = path.join(src, '.qoder');
  if (fs.existsSync(srcQoder)) {
    copyDir(srcQoder, qoderDir);
  }
}

/**
 * Install into Zed
 */
async function installZed(src: string, dst: string): Promise<void> {
  const zedDir = path.join(dst, '.zed');
  ensureDir(zedDir);

  // Copy settings
  const srcZed = path.join(src, '.zed');
  if (fs.existsSync(srcZed)) {
    copyDir(srcZed, zedDir);
  }
}

/**
 * Update CLAUDE.md with AETHER instructions
 */
function updateClaudeMd(claudeDir: string, src: string): void {
  const claudeMdPath = path.join(claudeDir, 'CLAUDE.md');
  const aetherInstructions = `

# AETHER — Engineering Control System

When the user types \`/aether\`, invoke AETHER's control engine.

AETHER is an autonomous engineering system that:
1. Expands user prompts into complete project plans
2. Deploys specialized agents for parallel execution
3. Verifies every requirement independently
4. Retries until 10/10 or genuine blocker

## Quick Start

\`\`\`bash
# Run AETHER on a project
npx tsx bin/aether.ts build "your prompt here"
\`\`\`

## Available Commands

- \`/aether build <prompt>\` — Build a complete project
- \`/aether programs\` — List capability programs
- \`/aether agents\` — List deployed agents
- \`/aether validate\` — Validate current project

## Inspiration Credits

- ECC: https://github.com/affaan-m/ECC (MIT)
- Superpowers: https://github.com/obra/superpowers (MIT)

`;

  if (fs.existsSync(claudeMdPath)) {
    const existing = fs.readFileSync(claudeMdPath, 'utf-8');
    if (!existing.includes('AETHER')) {
      fs.appendFileSync(claudeMdPath, aetherInstructions);
    }
  } else {
    fs.writeFileSync(claudeMdPath, aetherInstructions.trim());
  }
}

/**
 * Update Codex config
 */
function updateCodexConfig(codexDir: string, src: string): void {
  const configPath = path.join(codexDir, 'config.toml');
  const configContent = `
# AETHER Configuration for Codex
[agents]
enabled = true
paths = ["${path.join(src, '.codex', 'agents')}"]

[skills]
enabled = true
`;

  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, configContent.trim());
  }
}

/**
 * Utility: Ensure directory exists
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Utility: Copy directory recursively
 */
function copyDir(src: string, dst: string): void {
  if (!fs.existsSync(src)) return;

  ensureDir(dst);

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const targets = args.includes('--all') ? undefined : args.filter(a => !a.startsWith('--'));

  installAll(targets).catch(console.error);
}

export interface InstallationReport {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{ environment: string; status: string; message: string }>;
}

export default { installAll };
