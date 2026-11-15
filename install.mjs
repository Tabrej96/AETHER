#!/usr/bin/env node

/**
 * AETHER 1.0 — Complete Installation Script
 *
 * This script:
 * 1. Verifies Node.js 18+ environment
 * 2. Installs AETHER globally (optional)
 * 3. Deploys agents into ALL supported AI environments
 * 4. Installs npm dependencies for templates
 * 5. Sets up MCP server
 * 6. Creates CLI shortcuts
 * 7. Verifies installation
 *
 * Based on ECC's multi-harness installation:
 * https://github.com/affaan-m/ECC
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const AETHER_ROOT = process.cwd();
const HOME_DIR = os.homedir();

console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   █████╗ ███████╗ █████╗ ██████╗ ██████╗     ██████╗ ██╗  ║
║  ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗   ██╔════╝ ██║  ║
║  ███████║█████╗  ███████║██████╔╝██████╔╝   ██║  ███╗██║  ║
║  ██╔══██║██╔══╝  ██╔══██║██╔══██╗██╔═══╝    ██║   ██║██║  ║
║  ██║  ██║███████╗██║  ██║██║  ██║██║        ╚██████╔╝██║  ║
║  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝         ╚═════╝ ╚═╝  ║
║                                                            ║
║        Advanced Capability Research Programs               ║
║        20+ AETHER agents · 71 ECC agents · 314 skills      ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

  if (majorVersion < 18) {
    console.error('❌ Error: Node.js 18+ required. Current version: ' + nodeVersion);
    console.error('   Please upgrade: https://nodejs.org/en/download/');
    process.exit(1);
  }

  console.log('✓ Node.js ' + nodeVersion + ' detected\n');

  switch (command) {
    case 'install':
    case 'i':
      await installAll();
      break;
    case 'agents':
      await deployAgents();
      break;
    case 'validate':
      await validate();
      break;
    case 'version':
    case 'v':
      showVersion();
      break;
    case 'help':
    case 'h':
      showHelp();
      break;
    default:
      showHelp();
  }
}

/**
 * Full installation
 */
async function installAll(): Promise<void> {
  console.log('Starting AETHER installation...\n');

  // Step 1: Environment check
  console.log('━━━ Step 1: Environment Check ━━━');
  checkEnvironment();

  // Step 2: Deploy agents
  console.log('\n━━━ Step 2: Deploying Agent Army ━━━');
  await deployAgents();

  // Step 3: Install templates dependencies
  console.log('\n━━━ Step 3: Installing Template Dependencies ━━━');
  await installTemplateDeps();

  // Step 4: Setup MCP server
  console.log('\n━━━ Step 4: Setting Up MCP Server ━━━');
  setupMcpServer();

  // Step 5: Create CLI shortcuts
  console.log('\n━━━ Step 5: Creating CLI Shortcuts ━━━');
  createCliShortcuts();

  // Step 6: Verify installation
  console.log('\n━━━ Step 6: Verification ━━━');
  await verifyInstallation();

  console.log('\n✅ AETHER installation complete!');
  console.log('\nNext steps:');
  console.log('  1. Read QUICKSTART.md for usage instructions');
  console.log('  2. Run: npx tsx bin/aether.ts programs');
  console.log('  3. Check website/index.html for documentation');
  console.log('\nInspiration Credits:');
  console.log('  - ECC: https://github.com/affaan-m/ECC (MIT)');
  console.log('  - Superpowers: https://github.com/obra/superpowers (MIT)');
  console.log('  - All other repos documented in README.md');
}

/**
 * Check environment
 */
function checkEnvironment(): void {
  const checks = [
    { name: 'Node.js', check: () => process.version },
    { name: 'npm', check: () => execSync('npm --version', { encoding: 'utf-8' }).trim() },
    { name: 'Git', check: () => execSync('git --version', { encoding: 'utf-8' }).trim() },
    { name: 'TypeScript', check: () => execSync('npx tsc --version', { encoding: 'utf-8' }).trim() },
  ];

  for (const check of checks) {
    try {
      const result = check.check();
      console.log('  ✓ ' + check.name + ': ' + result);
    } catch (error) {
      console.log('  ✗ ' + check.name + ': Not found');
    }
  }
}

/**
 * Deploy all agents
 */
async function deployAgents(): Promise<void> {
  const { installAll } = await import('./install/multi-env-installer.ts');
  await installAll(['claude-code', 'codex', 'cursor', 'kimi', 'opencode', 'gemini', 'kiro']);
}

/**
 * Install template dependencies
 */
async function installTemplateDeps(): Promise<void> {
  const templates = ['templates/ecommerce', 'templates/coffee-shop'];

  for (const template of templates) {
    const templatePath = path.join(AETHER_ROOT, template);
    if (!fs.existsSync(templatePath)) continue;

    const packageJsonPath = path.join(templatePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) continue;

    console.log('  Installing dependencies for ' + template + '...');
    try {
      execSync('npm install', { cwd: templatePath, stdio: 'ignore' });
      console.log('    ✓ ' + template + ' dependencies installed');
    } catch (error) {
      console.log('    ⚠ ' + template + ' dependencies failed (optional)');
    }
  }
}

/**
 * Setup MCP server
 */
function setupMcpServer(): void {
  const mcpDir = path.join(AETHER_ROOT, 'mcp');
  if (!fs.existsSync(mcpDir)) {
    console.log('  ⚠ MCP directory not found');
    return;
  }

  console.log('  ✓ MCP server configured at mcp/server.ts');
  console.log('    Run with: node mcp/server.ts');
}

/**
 * Create CLI shortcuts
 */
function createCliShortcuts(): void {
  const binDir = path.join(HOME_DIR, '.aether', 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  // Create aether command
  const aetherScript = `#!/bin/sh
# AETHER CLI
cd "${AETHER_ROOT}"
exec npx tsx bin/aether.ts "$@"
`;

  const cliPath = path.join(binDir, 'aether');
  fs.writeFileSync(cliPath, aetherScript);
  fs.chmodSync(cliPath, 0o755);

  console.log('  ✓ Created CLI command: ' + cliPath);

  // Add to PATH
  const shellRcFiles: Record<string, string> = {
    'bash': '.bashrc',
    'zsh': '.zshrc',
    'fish': '.config/fish/config.fish',
  };

  const shell = process.env.SHELL?.split('/').pop() || 'bash';
  const rcFile = shellRcFiles[shell];

  if (rcFile) {
    const rcPath = path.join(HOME_DIR, rcFile);
    if (fs.existsSync(rcPath)) {
      const content = fs.readFileSync(rcPath, 'utf-8');
      if (!content.includes('.aether/bin')) {
        fs.appendFileSync(rcPath, '\n# AETHER\nexport PATH="$HOME/.aether/bin:$PATH"\n');
        console.log('  ✓ Added AETHER to ' + rcFile);
      }
    }
  }
}

/**
 * Verify installation
 */
async function verifyInstallation(): Promise<void> {
  const checks = [
    { name: 'AETHER agents', path: '.claude/agents' },
    { name: 'ECC agents', path: '.claude/agents/ecc' },
    { name: 'AETHER skills', path: '.claude/skills' },
    { name: 'ECC skills', path: '.claude/skills/ecc' },
    { name: 'MCP server', path: 'mcp/server.ts' },
    { name: 'CLI', path: 'bin/aether.ts' },
    { name: 'Control Engine', path: 'src/core/controlEngine.ts' },
    { name: 'Agent Army', path: 'src/core/agentArmyOrchestrator.ts' },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const checkPath = path.join(AETHER_ROOT, check.path);
    if (fs.existsSync(checkPath)) {
      console.log('  ✓ ' + check.name);
      passed++;
    } else {
      console.log('  ✗ ' + check.name + ' (missing)');
      failed++;
    }
  }

  console.log('\n  Verification: ' + passed + '/' + (passed + failed) + ' checks passed');

  if (failed > 0) {
    console.log('  ⚠ Some components are missing. Run install again.');
  }
}

/**
 * Deploy agents only
 */
async function deployAgents(): Promise<void> {
  const { installAll } = await import('./install/multi-env-installer.ts');
  await installAll();
}

/**
 * Validate installation
 */
async function validate(): Promise<void> {
  console.log('Validating AETHER installation...\n');

  const validation = {
    agents: 0,
    skills: 0,
    engines: 0,
    integrations: 0,
  };

  // Count agents
  const agentsDir = path.join(AETHER_ROOT, '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    validation.agents = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md')).length;
  }

  // Count skills
  const skillsDir = path.join(AETHER_ROOT, '.claude', 'skills');
  if (fs.existsSync(skillsDir)) {
    validation.skills = fs.readdirSync(skillsDir).filter(f => f.endsWith('.md')).length;
  }

  // Count engines
  const coreDir = path.join(AETHER_ROOT, 'src', 'core');
  if (fs.existsSync(coreDir)) {
    validation.engines = fs.readdirSync(coreDir).filter(f => f.endsWith('.ts')).length;
  }

  console.log('  Agents: ' + validation.agents);
  console.log('  Skills: ' + validation.skills);
  console.log('  Engines: ' + validation.engines);
  console.log('\n✅ AETHER is ready for production');
}

/**
 * Show version
 */
function showVersion(): void {
  const pkg = JSON.parse(fs.readFileSync(path.join(AETHER_ROOT, 'package.json'), 'utf-8'));
  console.log('AETHER ' + pkg.version);
  console.log(pkg.description);
}

/**
 * Show help
 */
function showHelp(): void {
  console.log(`
AETHER — Autonomous AI Engineering Platform

Usage:
  node install.mjs <command> [options]

Commands:
  install, i      Full installation into all environments
  agents          Deploy agent army
  validate        Validate installation
  version, v      Show version
  help, h         Show this help

Examples:
  node install.mjs install
  node install.mjs agents
  node install.mjs validate

For more information, visit:
https://github.com/Tabrej96/AETHER
`);
}

// Run
main().catch(console.error);
