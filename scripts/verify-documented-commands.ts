#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 11: DOCUMENTED-COMMAND MACHINE VERIFICATION
 * (scripts/verify-documented-commands.ts)
 *
 * "Every documented command must be machine-verified to run." This script:
 *   1. Collects the canonical command set AETHER documents (README + docs/
 *      + install.sh usage), with the sandboxed temp-dir targets in place of
 *      `--write .` so a verification run never mutates the operator's files.
 *   2. Executes each command, capturing exit code + first output lines.
 *   3. Writes release-evidence/gate11-docs.txt with per-command results.
 *
 * A command FAILS the gate if it exits non-zero or throws. Network-dependent
 * commands (the live provider check) are classified honestly: they PASS as
 * "reporting an honest UNAVAILABLE/MEASURED terminal state", never as
 * fabricated successes.
 *
 * Run: npx tsx scripts/verify-documented-commands.ts
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'release-evidence', 'gate11-docs.txt');
const TSX = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const NODE = process.execPath;

interface DocCommand {
  id: string;
  documentedIn: string;
  description: string;
  argv: string[];
  cwd?: string;
  /** commands whose honest terminal state includes UNAVAILABLE_* are still passing */
  honestTerminal?: boolean;
}

const lines: string[] = [];
const log = (s: string) => lines.push(s);
const say = (s: string) => console.log(s);

// The canonical documented command set (README "Commands" + docs/INSTALLATION
// + docs/PROVIDERS + docs/MCP). Targets that write are redirected to a temp
// dir so verification is side-effect-free.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-doc-verify-'));
const commands: DocCommand[] = [
  {
    id: 'aether validate',
    documentedIn: 'README.md · docs/INSTALLATION.md',
    description: 'validates all 711 components + open-source license boundaries',
    argv: [NODE, TSX, 'bin/aether.ts', 'validate'],
  },
  {
    id: 'aether refine',
    documentedIn: 'README.md · docs/CHANGELOG.md',
    description: 'runs the self-improvement refinement loop',
    argv: [NODE, TSX, 'bin/aether.ts', 'refine'],
  },
  {
    id: 'aether benchmark',
    documentedIn: 'README.md · docs/CHANGELOG.md',
    description: 'runs the genuine reproducible benchmark suite (offline)',
    argv: [NODE, TSX, 'bin/aether.ts', 'benchmark'],
  },
  {
    id: 'aether runtime',
    documentedIn: 'README.md · docs/TROUBLESHOOTING.md',
    description: 'autonomous runtime session lifecycle',
    argv: [NODE, TSX, 'bin/aether.ts', 'runtime'],
  },
  {
    id: 'aether mcp',
    documentedIn: 'README.md · docs/MCP.md',
    description: 'verifies the 8-tool MCP server with a live call per tool',
    argv: [NODE, TSX, 'bin/aether.ts', 'mcp'],
  },
  {
    id: 'aether ecosystems',
    documentedIn: 'README.md · docs/AGENTS.md',
    description: '15 external ecosystem adapter contract checks',
    argv: [NODE, TSX, 'bin/aether.ts', 'ecosystems'],
  },
  {
    id: 'aether programs',
    documentedIn: 'README.md · docs/CHANGELOG.md',
    description: 'nine-program integration registry + provenance audit',
    argv: [NODE, TSX, 'bin/aether.ts', 'programs'],
  },
  {
    id: 'aether audit',
    documentedIn: 'README.md · docs/TROUBLESHOOTING.md',
    description: 'implementation-level audit',
    argv: [NODE, TSX, 'bin/aether.ts', 'audit'],
  },
  {
    id: 'aether universal',
    documentedIn: 'README.md · docs/UNIVERSAL_BENCHMARK_FORMAT.md',
    description: '5 real-format benchmark adapters + honest status matrix',
    argv: [NODE, TSX, 'bin/aether.ts', 'universal'],
  },
  {
    id: 'aether deep',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_DEEP_INTELLIGENCE_DIRECTIVE.md · website/deep.html',
    description: 'P10 live demo: exact GST invoice + tamper guard (headless form, no browser)',
    argv: [NODE, TSX, 'bin/aether.ts', 'deep', '--no-browser'],
  },
  {
    id: 'aether fullstack',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_FULLSTACK_DIRECTIVE.md · website/fullstack.html',
    description: 'P11 live demo: architecture + API contract + data/reliability/tenancy review + readiness gate',
    argv: [NODE, TSX, 'bin/aether.ts', 'fullstack'],
  },
  {
    id: 'aether strategy',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P12 live demo: multi-label classification + effort policy + PROJECT_STRATEGY.md',
    argv: [NODE, TSX, 'bin/aether.ts', 'strategy', 'Build a multi-tenant SaaS billing platform with GST invoicing and a 3D product configurator'],
  },
  {
    id: 'aether business',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P13 live demo: domain model + state machines + edge cases + possibilities + metric discipline',
    argv: [NODE, TSX, 'bin/aether.ts', 'business', 'Build a multi-tenant SaaS billing platform with checkout, subscriptions, and refunds'],
  },
  {
    id: 'aether panel',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P14 live demo: the nine-reviewer independent quality panel verdict on a plan + artifact',
    argv: [NODE, TSX, 'bin/aether.ts', 'panel', 'Build a multi-tenant SaaS billing platform with checkout, subscriptions, and refunds'],
  },
  {
    id: 'aether evolve',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P15 live demo: the §11 regression suite + a measured promote/hold/reject demonstration',
    argv: [NODE, TSX, 'bin/aether.ts', 'evolve'],
  },
  {
    id: 'aether calc',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P16 live demo: paise-exact EMI, proration, refund, settlement (BigInt + one rounding boundary each)',
    argv: [NODE, TSX, 'bin/aether.ts', 'calc'],
  },
  {
    id: 'aether wf',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P17 live demo: approval maker/checker gate, double-entry reconciliation, idempotent period settlement',
    argv: [NODE, TSX, 'bin/aether.ts', 'wf'],
  },
  {
    id: 'aether hufit',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P18 live demo: the human-centered workflow audit over a six-hop HIGH-urgency design',
    argv: [NODE, TSX, 'bin/aether.ts', 'hufit'],
  },
  {
    id: 'aether design',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P19 live demo: the design-taste layer — category design language + template-slop detector, the P-S2 nameable delta',
    argv: [NODE, TSX, 'bin/aether.ts', 'design'],
  },
  {
    id: 'aether plan',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P20 live demo: the orchestration plan for the directive example prompts (mode, team, waves, requirement tiers, stop condition)',
    argv: [NODE, TSX, 'bin/aether.ts', 'plan'],
  },
  {
    id: 'aether design-system',
    documentedIn: 'README.md · QUICKSTART.md · docs/AETHER_SUPREME_EVOLUTION_DIRECTIVE.md · website/evolution.html',
    description: 'P21 live demo: the §6 design-system generator — the 28/28 category acceptance matrix (gate + P19 taste + owed interactions, zero slop)',
    argv: [NODE, TSX, 'bin/aether.ts', 'design-system'],
  },
  {
    id: 'aether-mcp-server --list-tools',
    documentedIn: 'docs/MCP.md',
    description: 'MCP server CLI verification path (non-protocol)',
    argv: [NODE, TSX, 'mcp/aether-mcp-server.ts', '--list-tools'],
  },
  {
    id: 'aether install --all (sandboxed)',
    documentedIn: 'README.md · docs/INSTALLATION.md · install.sh',
    description: 'one-command install of all 711 components + MCP (redirected to temp dir)',
    argv: [NODE, TSX, 'bin/aether.ts', 'install', '--all', '--target', 'all-harnesses', '--mcp', '--write', tmp],
  },
  {
    id: 'aether install selective (sandboxed)',
    documentedIn: 'README.md · docs/INSTALLATION.md',
    description: 'selective pack install to cursor (redirected to temp dir)',
    argv: [NODE, TSX, 'bin/aether.ts', 'install', '--target', 'cursor', '--packs', 'aws-cloud-vps,design-ui', '--mcp', '--write', tmp],
  },
  {
    id: 'aether uninstall (sandboxed)',
    documentedIn: 'docs/INSTALLATION.md · docs/CHANGELOG.md · docs/TROUBLESHOOTING.md',
    description: 'manifest-scoped uninstall of exactly the files install wrote',
    argv: [NODE, TSX, 'bin/aether.ts', 'uninstall', '--write', tmp],
  },
  {
    id: 'live provider check',
    documentedIn: 'docs/PROVIDERS.md · docs/CONFIGURATION.md · .env.example',
    description: 'GATE-01 live end-to-end check — honest terminal state (MEASURED or UNAVAILABLE_*)',
    argv: [NODE, TSX, 'src/core/providers/live-provider.test.ts'],
    honestTerminal: true,
  },
  {
    id: 'npx tsx scripts/certify-benchmarks.ts',
    documentedIn: 'docs/PROVIDERS.md · docs/TROUBLESHOOTING.md · release-evidence',
    description: 'benchmark certification pipeline (repeated trials + re-verification)',
    argv: [NODE, TSX, 'scripts/certify-benchmarks.ts'],
  },
  {
    id: 'npx tsx scripts/generate-sbom.ts',
    documentedIn: 'docs/CHANGELOG.md · docs/SBOM.md',
    description: 'regenerates the SBOM from package-lock.json',
    argv: [NODE, TSX, 'scripts/generate-sbom.ts'],
  },
];

function runOne(c: DocCommand): { pass: boolean; code: number; note: string } {
  const r = spawnSync(c.argv[0], c.argv.slice(1), {
    cwd: c.cwd ?? ROOT,
    encoding: 'utf8',
    timeout: 300_000,
    env: process.env,
  });
  const code = r.status ?? -1;
  const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
  if (code === 0) {
    return { pass: true, code, note: out.split('\n').filter(Boolean).slice(0, 2).join(' | ').slice(0, 160) };
  }
  // Honest-terminal commands: a non-zero exit is NOT a gate failure when the
  // documented contract is "report MEASURED or UNAVAILABLE, never fabricate".
  if (c.honestTerminal && /UNAVAILABLE|MEASURED/.test(out)) {
    return { pass: true, code, note: `honest terminal state (${out.split('\n').filter((l) => /UNAVAILABLE|MEASURED/.test(l)).slice(0, 2).join(' | ').slice(0, 140)})` };
  }
  return { pass: false, code, note: out.split('\n').slice(-6).join(' | ').slice(0, 200) };
}

// ---------------------------------------------------------------------------
log('# GATE 11 EVIDENCE — DOCUMENTS & OPEN-SOURCE READINESS (Program 10)');
log(`Platform: ${process.platform} ${os.release()} · Node ${process.version}`);
log('Command: npx tsx scripts/verify-documented-commands.ts');
log('');

// --- 1. Required-doc presence check
const requiredDocs = [
  'README.md',
  'LICENSE',
  'docs/INSTALLATION.md',
  'docs/CONFIGURATION.md',
  'docs/PROVIDERS.md',
  'docs/AGENTS.md',
  'docs/SKILLS.md',
  'docs/MCP.md',
  'docs/TROUBLESHOOTING.md',
  'docs/CHANGELOG.md',
  'docs/SBOM.md',
  'docs/SBOM.json',
  'docs/AETHER_LICENSE_AND_PROVENANCE.md',
  'docs/AETHER_SECURITY_THREAT_MODEL.md',
  'docs/UNIVERSAL_BENCHMARK_FORMAT.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'NOTICE.md',
  'ROADMAP.md',
];
log('## Required-document presence');
let missingDocs: string[] = [];
for (const d of requiredDocs) {
  const ok = fs.existsSync(path.join(ROOT, d));
  if (!ok) missingDocs.push(d);
  log(`  [${ok ? 'PRESENT' : 'MISSING'}] ${d}`);
}
log('');

// --- 2. Command verification
log(`## Documented-command machine verification (${commands.length} commands, sandboxed writes to ${path.relative(ROOT, tmp) || tmp})`);
log('');
log('| Command | Documented in | Exit | Result |');
log('| :--- | :--- | :--- | :--- |');
let failures: DocCommand[] = [];
for (const c of commands) {
  const r = runOne(c);
  if (!r.pass) failures.push(c);
  const status = r.pass ? 'PASS' : 'FAIL';
  log(`| \`${c.id}\` | ${c.documentedIn} | ${r.code} | ${status}${r.pass ? '' : ' — ' + r.note} |`);
  say(`[${status}] ${c.id} (exit ${r.code})${r.pass ? '' : ': ' + r.note}`);
}
log('');

// --- 3. Verdict
log('## Verdict');
const docOk = missingDocs.length === 0;
const cmdOk = failures.length === 0;
if (docOk && cmdOk) {
  log('PASS — all required documents present; every documented command was machine-verified to run (sandboxed writes; honest terminal states honored).');
} else {
  if (!docOk) log(`FAIL — ${missingDocs.length} required document(s) missing: ${missingDocs.join(', ')}`);
  if (!cmdOk) log(`FAIL — ${failures.length} documented command(s) failed: ${failures.map((f) => f.id).join(', ')}`);
}

fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
say(`\nWrote ${path.relative(ROOT, OUT)}`);
process.exit(docOk && cmdOk ? 0 : 1);
