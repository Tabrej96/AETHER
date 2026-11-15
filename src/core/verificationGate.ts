/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER VerificationGate — Independent Requirement Enforcement
 * (src/core/verificationGate.ts) · Created by Tabrej
 *
 * This gate NEVER trusts the AI's self-assessment. It independently
 * verifies EVERY requirement by inspecting actual files on disk.
 *
 * Ten checks are run, each weighted equally. Only a score of 10/10
 * (all ten checks passed) yields a passing gate.
 */

import fs from 'node:fs';
import path from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A single requirement the project must satisfy. */
export interface Requirement {
  id: string;
  description: string;
  /** optional glob-style hint for which files are relevant */
  filePattern?: string;
  /** one of the ten check categories this requirement belongs to */
  category: RequirementCategory;
  /** minimum expected artifact count for the check to pass (0 = any non-zero) */
  minCount?: number;
}

export type RequirementCategory =
  | 'critical'
  | 'pillar'
  | 'tech-stack'
  | 'deployment'
  | 'test-coverage'
  | 'security'
  | 'database'
  | 'integration'
  | 'documentation'
  | 'demo-clean';

/** Outcome of verifying one requirement. */
export interface VerificationCheck {
  requirementId: string;
  passed: boolean;
  evidence: string;
  foundCount?: number;
  expectedCount?: number;
  filesInspected: string[];
  /** human-readable gap when the check fails */
  gap?: string;
}

/** Summary returned by the gate. */
export interface VerificationReport {
  projectPath: string;
  timestamp: string;
  score: number;          // 0–10, only 10/10 passes
  passed: boolean;
  checks: VerificationCheck[];
  failures: string[];
  warnings: string[];
}

// ─── File utilities ───────────────────────────────────────────────────────────

/** Recursively list every file (not directory) under dir. */
export function getAllFiles(dir: string): string[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const results: string[] = [];
  const walk = (current: string): void => {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        // skip hidden dirs and common non-source dirs
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'release-evidence' || entry.name === 'coverage') continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          results.push(full);
        }
      }
    } catch {
      // permission errors — skip silently
    }
  };
  walk(dir);
  return results;
}

/** Collect files whose path matches at least one of the requirement's patterns. */
export function findRelevantFiles(projectPath: string, req: Requirement): string[] {
  if (!fs.existsSync(projectPath)) return [];
  const patterns = req.filePattern
    ? [req.filePattern]
    : _defaultPatternsForCategory(req.category);

  const all = getAllFiles(projectPath);
  const matched = new Set<string>();
  for (const file of all) {
    const rel = path.relative(projectPath, file).replace(/\\/g, '/');
    for (const pat of patterns) {
      if (_globMatch(rel, pat)) {
        matched.add(file);
        break;
      }
    }
  }
  return [...matched];
}

// ─── Per-file completeness ───────────────────────────────────────────────────

/** Return true if the file looks "complete" relative to the requirement. */
export function isFileComplete(filePath: string, req: Requirement): boolean {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;

  // Read first 200 lines — that is enough to detect scaffolds and stubs.
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const head = lines.slice(0, 200).join('\n');
  const codeLines = lines.filter((l) => {
    const t = l.trim();
    if (t.length === 0) return false;
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return false;
    return true;
  }).length;
  const hasSubstance = codeLines >= 2;

  // Detect scaffold/stub/demo markers
  const stubSignals =
    /TODO|FIXME|STUB|not implemented|coming soon|placeholder/i.test(head) &&
    !/description.*TODO|FIXME as a known issue/i.test(head);

  // Detect demo-artifact markers (only checked for demo-clean category)
  const demoSignals = /demo|sample|showcase|fake|mock-?data|dummy/i.test(head);

  if (req.category === 'demo-clean') return !demoSignals && !stubSignals;
  return !stubSignals && hasSubstance;
}

// ─── Main verification ────────────────────────────────────────────────────────

export async function verify(projectPath: string, requirements: Requirement[]): Promise<VerificationReport> {
  const timestamp = new Date().toISOString();

  // Resolve absolute path (strip trailing separators)
  const resolved = path.resolve(projectPath);

  const checks: VerificationCheck[] = [];
  const failures: string[] = [];
  const warnings: string[] = [];

  for (const req of requirements) {
    const check = await verifyRequirement(resolved, req);
    checks.push(check);
    if (!check.passed) {
      failures.push(`[${req.id}] ${req.description}${check.gap ? ` — ${check.gap}` : ''}`);
    }
    if (check.foundCount !== undefined && check.expectedCount !== undefined && check.foundCount < check.expectedCount) {
      warnings.push(`[${req.id}] expected ≥ ${check.expectedCount}, found ${check.foundCount}`);
    }
  }

  // Score = number of passed checks (0-10)
  const passedCount = checks.filter((c) => c.passed).length;
  const score = passedCount;

  return {
    projectPath: resolved,
    timestamp,
    score,
    passed: score === 10,
    checks,
    failures,
    warnings,
  };
}

export async function verifyRequirement(projectPath: string, req: Requirement): Promise<VerificationCheck> {
  const files = findRelevantFiles(projectPath, req);

  if (files.length === 0) {
    return {
      requirementId: req.id,
      passed: false,
      evidence: 'No matching files found.',
      filesInspected: [],
      gap: `No files matching requirement "${req.description}" were found in ${projectPath}.`,
    };
  }

  // Check completeness of each matched file
  const completeFiles = files.filter((f) => isFileComplete(f, req));
  const incompleteFiles = files.filter((f) => !isFileComplete(f, req));

  // Category-specific logic
  let passed: boolean;
  let evidence: string;
  let gap: string | undefined;
  const expected = req.minCount ?? 1;

  switch (req.category) {
    case 'critical':
    case 'pillar':
    case 'tech-stack':
    case 'deployment':
    case 'test-coverage':
    case 'security':
    case 'database':
    case 'integration':
    case 'documentation': {
      passed = completeFiles.length >= expected;
      evidence = `Found ${files.length} file(s), ${completeFiles.length} complete. Expected ≥ ${expected}.`;
      if (!passed) {
        gap = `Only ${completeFiles.length} of ≥ ${expected} required complete file(s) found. ${incompleteFiles.length} file(s) are incomplete or stubs.`;
      }
      break;
    }
    case 'demo-clean': {
      // Pass only when NO demo artifacts exist
      passed = incompleteFiles.length === 0 && completeFiles.length > 0;
      evidence = `Scanned ${files.length} file(s); ${incompleteFiles.length} demo/stub artifact(s) detected.`;
      if (!passed) {
        gap = incompleteFiles.length > 0
          ? `${incompleteFiles.length} file(s) appear to be demo artifacts or stubs.`
          : 'No files found to inspect.';
      }
      break;
    }
    default:
      passed = completeFiles.length >= expected;
      evidence = `Found ${files.length} file(s), ${completeFiles.length} complete.`;
  }

  return {
    requirementId: req.id,
    passed,
    evidence,
    foundCount: files.length,
    expectedCount: expected,
    filesInspected: files,
    gap,
  };
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/** Map a category to default file globs when the requirement supplies none. */
function _defaultPatternsForCategory(cat: RequirementCategory): string[] {
  switch (cat) {
    case 'critical':
      return ['**/*.{ts,js,py,go,rs}'];
    case 'pillar':
      return ['**/src/**/*.{ts,js}'];
    case 'tech-stack':
      return ['package.json', '**/tsconfig.json', '**/pom.xml', '**/build.gradle', '**/Cargo.toml', '**/go.mod'];
    case 'deployment':
      return ['**/Dockerfile', '**/docker-compose*.{yml,yaml}', '**/.env.example', '**/deploy.{ts,js,yml,yaml}', '**/Procfile', '**/vercel.json', '**/netlify.toml'];
    case 'test-coverage':
      return ['**/*.{test,spec}.{ts,js,py,go,rs}', '**/__tests__/**', '**/tests/**'];
    case 'security':
      return ['**/security*.{ts,js}', '**/*auth*.{ts,js}', '**/.env.example', '**/middleware/**', '**/guard*.{ts,js}'];
    case 'database':
      return ['**/migrations/**', '**/*schema*.{ts,js,sql}', '**/*migration*.{ts,js,sql}', '**/prisma/schema.prisma', '**/knexfile.{js,ts}', '**/entity/**'];
    case 'integration':
      return ['**/integrations/**', '**/api/**', '**/services/**', '**/adapters/**', '**/providers/**'];
    case 'documentation':
      return ['**/README.md', '**/docs/**', '**/CHANGELOG.md', '**/API.md'];
    case 'demo-clean':
      return ['**/*.{ts,js,tsx,jsx,py}'];
    default:
      return ['**/*'];
  }
}

/** Minimal glob-to-regex converter (supports * and **). */
function _globMatch(filePath: string, pattern: string): boolean {
  // normalise separators
  const normalized = pattern.replace(/\\/g, '/');
  const regexStr = '^' + normalized
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/<<<DOUBLESTAR>>>/g, '.*')
    + '$';
  const re = new RegExp(regexStr);
  return re.test(filePath);
}

// ─── Default requirement sets ─────────────────────────────────────────────────

/**
 * Build the canonical 10-check requirement set for a project.
 * Call this to get the standard checks, then pass them to `verify()`.
 */
export function defaultRequirements(): Requirement[] {
  const r = (id: string, description: string, category: RequirementCategory, filePattern?: string, minCount?: number): Requirement => ({
    id, description, category, filePattern, minCount,
  });

  return [
    r('C01', 'Critical requirements implemented — core source files exist and are non-empty', 'critical', '**/*.{ts,js,py}', 1),
    r('P01', 'All pillars have coverage — source files cover the major pillars of the system', 'pillar', '**/src/**/*.{ts,js}', 5),
    r('T01', 'Tech stack completeness — package.json or equivalent build manifest present', 'tech-stack', 'package.json'),
    r('D01', 'Deployment readiness — Dockerfile or deploy config present', 'deployment'),
    r('X01', 'Test coverage — at least one test/spec file exists', 'test-coverage', '**/*.{test,spec}.{ts,js,py}', 1),
    r('S01', 'Security baseline — security/auth/gate module present', 'security'),
    r('B01', 'Database schema — migration or schema file present', 'database'),
    r('I01', 'Real integrations — integrations/adapters/providers directory has code', 'integration', '**/integrations/**', 1),
    r('M01', 'Documentation exists — README or docs directory present', 'documentation', 'README.md'),
    r('E01', 'No demo artifacts in production — source files contain no demo/sample/fake stubs', 'demo-clean'),
  ];
}
