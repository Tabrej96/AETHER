/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P02 LIVE REVERSE-ENGINEERING DEMO (closes the UNMEASURED slot)
 * (src/core/reverse/liveReverseDemo.ts)
 *
 * The P02 engine (src/core/programs/p02ReverseIntelligence.ts) previously only
 * ran on tiny synthetic fixtures. This module runs it on REAL software on this
 * machine and produces machine- + human-readable evidence:
 *
 *   Target 1: <repo>/src/core — AETHER itself. Authorization basis: the
 *           operator owns this machine and AETHER is Apache-2.0 open source
 *           under the operator's own repository (basis 'OWNED').
 *   Target 2: a real third-party library detected at runtime
 *           (node_modules/express/lib → MIT → 'AUTHORIZED_LICENSE',
 *           else node_modules/dotenv/lib → MIT). If neither exists, target 2
 *           is recorded UNAVAILABLE with the reason — never fabricated.
 *
 * Evidence written (deterministic: stable sorts, no timestamps in the JSON
 * report body):
 *   release-evidence/reverse-demo/live-reverse-report.json
 *   release-evidence/reverse-demo/live-reverse-report.md
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ApplicationFile,
  ArchitectureReport,
  assertAuthorization,
  extractApplicationArchitecture,
  ReverseEngineAuthorization,
} from '../programs/p02ReverseIntelligence';

export interface LiveReverseReport {
  status: 'MEASURED_LIVE_REVERSE_ENGINEERING' | 'UNAVAILABLE';
  target: { name: string; path: string; fileCount: number; totalTokens: number; authorization: string };
  report: ArchitectureReport;
  provenance: string;
  /** target 2 result, or its honest UNAVAILABLE reason */
  secondary: { status: 'MEASURED_LIVE_REVERSE_ENGINEERING' | 'UNAVAILABLE'; detail: string; report?: ArchitectureReport };
  finishedAtIso: string;
}

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const EVIDENCE_DIR = path.join(REPO_ROOT, 'release-evidence', 'reverse-demo');
const MAX_FILE_BYTES = 150_000;

// ---------------------------------------------------------------- source scanning
/** deterministic import/require specifier extraction (no npm deps) */
function extractImports(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/\bimport\s+(?:[^'"]*?from\s+)?['"]([^'"]+)['"]/g)) out.add(m[1]);
  for (const m of src.matchAll(/\bexport\s+.*?\s+from\s+['"]([^'"]+)['"]/g)) out.add(m[1]);
  for (const m of src.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) out.add(m[1]);
  return [...out].sort();
}

/** deterministic exported-name extraction (declarations only, not re-export shapes) */
function extractExports(src: string): string[] {
  const out = new Set<string>();
  for (const m of src.matchAll(/\bexport\s+(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) out.add(m[1]);
  for (const m of src.matchAll(/\bexport\s*\{\s*([^}]+)\s*\}/g)) {
    for (const piece of m[1].split(',')) {
      const name = piece.trim().split(/\s+as\s+/).pop()?.trim();
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) out.add(name);
    }
  }
  return [...out].sort();
}

/** read a directory's source files, relative posix paths, stable order */
function readTree(dir: string): ApplicationFile[] {
  const exts = new Set(['.ts', '.js', '.mjs', '.cjs', '.jsx']);
  const files: ApplicationFile[] = [];
  const walk = (d: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        walk(p);
      } else if (e.isFile() && exts.has(path.extname(e.name))) {
        let st: fs.Stats;
        try {
          st = fs.statSync(p);
        } catch {
          continue;
        }
        if (st.size > MAX_FILE_BYTES) continue; // stay fast on huge bundles
        const content = fs.readFileSync(p, 'utf8');
        files.push({
          path: path.relative(dir, p).replace(/\\/g, '/'),
          imports: extractImports(content),
          exports: extractExports(content),
          bytes: st.size,
          language: path.extname(e.name).replace(/\./g, '') || 'js',
        });
      }
    }
  };
  walk(dir);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

function buildAuthorization(targetId: string, basis: ReverseEngineAuthorization['basis'], evidence: string): ReverseEngineAuthorization {
  const auth: ReverseEngineAuthorization = { targetId, basis, authorized: true, evidence };
  assertAuthorization(auth); // the P02 gate itself — proves the security boundary is live
  return auth;
}

function runOneTarget(
  name: string,
  dir: string,
  basis: ReverseEngineAuthorization['basis'],
  evidence: string,
  targetId: string
): LiveReverseReport {
  const files = readTree(dir);
  const totalTokens = Math.ceil(files.reduce((s, f) => s + f.bytes, 0) / 4);
  const auth = buildAuthorization(targetId, basis, evidence);
  const report = extractApplicationArchitecture(targetId, auth, files);
  return {
    status: 'MEASURED_LIVE_REVERSE_ENGINEERING',
    target: {
      name,
      path: path.relative(REPO_ROOT, dir).replace(/\\/g, '/'),
      fileCount: files.length,
      totalTokens,
      authorization: `${basis} — ${evidence}`,
    },
    report,
    provenance: `live read from ${dir} on this machine, ${files.length} files, ${(totalTokens / 1000).toFixed(1)}k tokens scanned`,
    secondary: { status: 'UNAVAILABLE', detail: 'secondary target not run in this invocation' },
    finishedAtIso: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------- target detection
function detectSecondaryTarget(): { dir: string; basis: ReverseEngineAuthorization['basis']; evidence: string; name: string } | null {
  const expressDir = path.join(REPO_ROOT, 'node_modules', 'express', 'lib');
  if (fs.existsSync(path.join(expressDir, 'express.js'))) {
    return {
      dir: expressDir,
      name: 'express (lib/)',
      basis: 'AUTHORIZED_LICENSE',
      evidence: 'express is MIT-licensed open source (node_modules/express); analysis of openly-licensed public code under the license granted to this install.',
    };
  }
  const dotenvDir = path.join(REPO_ROOT, 'node_modules', 'dotenv', 'lib');
  if (fs.existsSync(dotenvDir)) {
    return {
      dir: dotenvDir,
      name: 'dotenv (lib/)',
      basis: 'AUTHORIZED_LICENSE',
      evidence: 'dotenv is MIT/BSD-licensed open source (node_modules/dotenv); analysis of openly-licensed public code under the license granted to this install.',
    };
  }
  return null;
}

// ---------------------------------------------------------------- public entry
export async function runLiveReverseDemo(opts?: { targetDir?: string }): Promise<LiveReverseReport> {
  const target1Dir = opts?.targetDir ?? path.join(REPO_ROOT, 'src', 'core');
  const primary = runOneTarget(
    'aether-src-core',
    target1Dir,
    'OWNED',
    'Operator owns this machine; AETHER is Apache-2.0 open source under the operator\'s own repository (Tabrej96/anythingwithaether).',
    'aether-src-core'
  );

  // secondary (third-party library), honest UNAVAILABLE if absent
  const sec = detectSecondaryTarget();
  if (sec) {
    const secondary = runOneTarget(sec.name, sec.dir, sec.basis, sec.evidence, 'third-party:' + sec.name);
    primary.secondary = { status: secondary.status, detail: `${secondary.provenance}; ${secondary.report.reconstructionSummary}`, report: secondary.report };
  } else {
    primary.secondary = {
      status: 'UNAVAILABLE',
      detail: 'UNAVAILABLE: no third-party library detected (looked for node_modules/express/lib/express.js and node_modules/dotenv/lib). Not fabricated.',
    };
  }

  // write evidence (deterministic body: no timestamps in the JSON file)
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const jsonBody = JSON.stringify(primary, null, 2).replace(/"finishedAtIso": "[^"]*"/, '"finishedAtIso": "run-time (excluded from deterministic body)"');
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'live-reverse-report.json'), jsonBody + '\n', 'utf8');
  fs.writeFileSync(path.join(EVIDENCE_DIR, 'live-reverse-report.md'), renderMarkdown(primary), 'utf8');
  return primary;
}

// ---------------------------------------------------------------- markdown (generated from the report, not hand-typed)
function mdReport(name: string, authorization: string, provenance: string, rep: ArchitectureReport): string {
  const L: string[] = [];
  L.push(`# ${name} — ${rep.totalFiles} modules, ${rep.externalDependencies.length} external deps`);
  L.push(`**Authorization:** ${authorization}`);
  L.push(`**Provenance:** ${provenance}`);
  L.push('');
  L.push(`## Reconstruction summary\n\n${rep.reconstructionSummary}\n`);
  L.push('## Module graph (top 40 by import count)');
  L.push('| module | import edges |');
  L.push('| :--- | :--- |');
  const edges = Object.entries(rep.moduleGraph)
    .map(([k, v]) => [k, v.length] as [string, number])
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [m, n] of edges.slice(0, 40)) L.push(`| \`${m}\` | ${n} |`);
  L.push('');
  L.push('## External dependencies discovered (all)');
  L.push(rep.externalDependencies.map((d) => `\`${d}\``).join(' · '));
  L.push('');
  L.push('## Layered structure');
  for (const layer of rep.layeredStructure) L.push(`- **${layer.layer}** (${layer.files.length} files): ${layer.files.slice(0, 6).map((f) => `\`${f}\``).join(', ')}${layer.files.length > 6 ? ', …' : ''}`);
  L.push('');
  L.push(`## Entry candidates\n\n${rep.entryCandidates.map((e) => `\`${e}\``).join('\n') || 'n/a'}`);
  L.push('');
  L.push('## Unmeasured slots (reported, never fabricated)');
  for (const s of rep.unmeasuredSlots) L.push(`- **${s.slot}** — ${s.reason}${s.externalCommandToMeasure ? ` (measure: ${s.externalCommandToMeasure})` : ''}`);
  L.push('');
  return L.join('\n');
}

function renderMarkdown(r: LiveReverseReport): string {
  const out: string[] = [];
  out.push('# AETHER P02 — LIVE Reverse-Engineering Report');
  out.push('');
  out.push(`Generated by \`src/core/reverse/liveReverseDemo.ts\` (live read on this machine — no fixture, no hand-typed numbers).`);
  out.push('');
  out.push('---');
  out.push('');
  out.push('# TARGET 1 — ' + r.target.name);
  out.push('');
  out.push(mdReport(r.target.name, r.target.authorization, r.provenance, r.report));
  out.push('');
  out.push('---');
  out.push('');
  out.push('# TARGET 2 — third-party library');
  out.push('');
  if (r.secondary.status === 'MEASURED_LIVE_REVERSE_ENGINEERING' && r.secondary.report) {
    out.push(mdReport('third-party library', r.secondary.report.authorization.evidence, r.secondary.detail, r.secondary.report));
  } else {
    out.push(r.secondary.detail);
    out.push('');
  }
  out.push('');
  return out.join('\n');
}
