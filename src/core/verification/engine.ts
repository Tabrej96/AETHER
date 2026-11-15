/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Verification Engine - Main Orchestration Engine
 *
 * THIS IS THE CORE CONTROL LAYER. The AI NEVER decides when work is done.
 * AETHER's verification engine does.
 *
 * Process:
 * 1. Take a ProjectSpec
 * 2. Run all checks in order (critical first)
 * 3. Generate a VerificationReport
 * 4. NEVER return "passed" unless 100% of critical checks pass
 * 5. Block completion if any critical check fails
 */

import { randomUUID } from 'node:crypto';

import type {
  VerificationCheck,
  VerificationResult,
  VerificationReport,
  ProjectSpec,
  CheckExecutionContext,
  FileSystemProbe,
  CodeAnalyzer,
  TestRunner,
  BrowserRunner,
} from './types.js';

import { createAllFeatureChecks } from './checks/featureChecks.js';
import { createAllIntegrationChecks } from './checks/integrationChecks.js';
import { createAllSecurityChecks } from './checks/securityChecks.js';
import { createAllPerformanceChecks } from './checks/performanceChecks.js';

// ─── Default FileSystem Probe ───────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

export class DefaultFileSystemProbe implements FileSystemProbe {
  constructor(private readonly root: string) {}

  async exists(filePath: string): Promise<boolean> {
    try { return fs.existsSync(filePath); } catch { return false; }
  }

  async read(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }

  async glob(pattern: string): Promise<string[]> {
    try {
      const resolved = pattern.startsWith(this.root) ? pattern : path.join(this.root, pattern);
      return glob.sync(resolved, { cwd: this.root, absolute: true });
    } catch {
      return [];
    }
  }

  async stat(filePath: string): Promise<{ size: number; mtime: number } | null> {
    try {
      const s = fs.statSync(filePath);
      return { size: s.size, mtime: s.mtime.getTime() };
    } catch { return null; }
  }
}

// ─── Default Code Analyzer ──────────────────────────────────────────────────

export class DefaultCodeAnalyzer implements CodeAnalyzer {
  constructor(private readonly fs: FileSystemProbe) {}

  async fileContainsPattern(filePath: string, pattern: RegExp): Promise<boolean> {
    try {
      if (!(await this.fs.exists(filePath))) return false;
      const content = await this.fs.read(filePath);
      return pattern.test(content);
    } catch { return false; }
  }

  async getExports(_filePath: string): Promise<string[]> {
    // Simplified - would parse with TypeScript compiler API in production
    return [];
  }

  async getImports(_filePath: string): Promise<string[]> {
    return [];
  }

  async countLines(filePath: string): Promise<number> {
    try {
      if (!(await this.fs.exists(filePath))) return 0;
      const content = await this.fs.read(filePath);
      return content.split('\n').length;
    } catch { return 0; }
  }
}

// ─── Default Test Runner ────────────────────────────────────────────────────

export class DefaultTestRunner implements TestRunner {
  constructor(private readonly root: string) {}

  async runTests(testPattern: string): Promise<{ passed: number; failed: number; output: string }> {
    return { passed: 0, failed: 0, output: `Test pattern "${testPattern}" - run not implemented in default runner` };
  }

  async runSpecificTest(testPath: string): Promise<{ passed: boolean; output: string }> {
    return { passed: false, output: `Test "${testPath}" - run not implemented` };
  }
}

// ─── Mock Browser Runner ────────────────────────────────────────────────────

export class MockBrowserRunner implements BrowserRunner {
  async launch(): Promise<void> {}
  async navigate(_url: string): Promise<void> {}
  async elementExists(_selector: string): Promise<boolean> { return false; }
  async takeScreenshot(_name: string): Promise<string> { return ''; }
  async click(_selector: string): Promise<void> {}
  async type(_selector: string, _text: string): Promise<void> {}
  async getText(_selector: string): Promise<string> { return ''; }
  async getUrl(): Promise<string> { return ''; }
  async isVisible(_selector: string): Promise<boolean> { return false; }
  async waitForSelector(_selector: string, _timeoutMs?: number): Promise<boolean> { return false; }
  async selectOption(_selector: string, _value: string): Promise<void> {}
  async close(): Promise<void> {}
}

// ─── Verification Engine ────────────────────────────────────────────────────

export interface EngineOptions {
  projectRoot: string;
  projectId: string;
  skipE2E?: boolean;
  skipPerformance?: boolean;
  skipBrowser?: boolean;
  customChecks?: VerificationCheck[];
}

export class VerificationEngine {
  private readonly context: CheckExecutionContext;

  constructor(opts: EngineOptions) {
    const fsProbe = new DefaultFileSystemProbe(opts.projectRoot);
    const codeAnalyzer = new DefaultCodeAnalyzer(fsProbe);
    const testRunner = new DefaultTestRunner(opts.projectRoot);
    const browserRunner = opts.skipBrowser ? new MockBrowserRunner() : new MockBrowserRunner();

    this.context = {
      projectRoot: opts.projectRoot,
      projectId: opts.projectId,
      spec: null as any,
      fs: fsProbe,
      codeAnalyzer,
      testRunner,
      browserRunner,
    };
  }

  /**
   * Set the spec before running checks
   */
  setSpec(spec: ProjectSpec): void {
    this.context.spec = spec;
  }

  /**
   * Run all verification checks and produce a report
   */
  async verify(spec: ProjectSpec): Promise<VerificationReport> {
    this.context.spec = spec;
    const allChecks: VerificationCheck[] = [];

    // Feature checks (19 pillars)
    allChecks.push(...createAllFeatureChecks(this.context));

    // Integration checks
    allChecks.push(...createAllIntegrationChecks(this.context));

    // Security checks
    allChecks.push(...createAllSecurityChecks(this.context));

    // Performance checks (unless skipped)
    if (!this.context.spec) {
      // will be set below
    }
    const perfChecks = createAllPerformanceChecks(this.context);
    allChecks.push(...perfChecks);

    // Sort: critical first, then high, medium, low
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allChecks.sort((a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4));

    // Run all checks
    const checks: VerificationResult[] = [];
    const failedCritical: string[] = [];
    const failedHigh: string[] = [];
    const missingFeatures: typeof spec.requiredFeatures = [];
    const missingFiles: string[] = [];
    const failedTests: string[] = [];
    const recommendations: string[] = [];

    for (const check of allChecks) {
      try {
        const result = await check.check();
        checks.push(result);
        if (!result.passed) {
          if (check.severity === 'critical') failedCritical.push(check.id);
          else if (check.severity === 'high') failedHigh.push(check.id);
          recommendations.push(`[${check.severity.toUpperCase()}] ${check.id}: ${check.description} - ${result.evidence}`);
        }
      } catch (err) {
        const errorResult = {
          checkId: check.id,
          passed: false,
          evidence: `Check threw error: ${err instanceof Error ? err.message : String(err)}`,
          timestamp: new Date().toISOString(),
        };
        checks.push(errorResult);
        failedCritical.push(check.id);
        recommendations.push(`[CRITICAL] ${check.id}: Check threw error`);
      }
    }

    // Check required files
    for (const file of spec.requiredFiles) {
      const exists = await this.context.fs.exists(path.join(this.context.projectRoot, file));
      if (!exists) missingFiles.push(file);
    }

    // Check required tests
    for (const test of spec.requiredTests) {
      const exists = await this.context.fs.exists(path.join(this.context.projectRoot, test));
      if (!exists) failedTests.push(test);
    }

    // Calculate completeness
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.passed).length;
    const completeness = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    // CRITICAL: Any critical failure means overall failure
    const overallPassed = failedCritical.length === 0 && completeness >= spec.completenessThreshold;

    const report: VerificationReport = {
      projectId: this.context.projectId,
      timestamp: new Date().toISOString(),
      overallPassed,
      completeness,
      checks,
      missingFeatures,
      missingFiles,
      failedTests,
      recommendations,
    };

    return report;
  }

  /**
   * Quick check - verify only critical checks pass
   */
  async quickVerify(spec: ProjectSpec): Promise<{ passed: boolean; criticalFailures: string[] }> {
    const criticalChecks = createAllFeatureChecks(this.context).filter(c => c.severity === 'critical');
    const criticalIntegration = createAllIntegrationChecks(this.context).filter(c => c.severity === 'critical');
    const criticalSecurity = createAllSecurityChecks(this.context).filter(c => c.severity === 'critical');

    const allCritical = [...criticalChecks, ...criticalIntegration, ...criticalSecurity];
    const failures: string[] = [];

    for (const check of allCritical) {
      try {
        const result = await check.check();
        if (!result.passed) failures.push(`${check.id}: ${check.description}`);
      } catch {
        failures.push(`${check.id}: Check threw error`);
      }
    }

    return { passed: failures.length === 0, criticalFailures: failures };
  }
}

// ─── Convenience Functions ──────────────────────────────────────────────────

export async function verifyProject(
  projectRoot: string,
  projectId: string,
  spec: ProjectSpec,
  opts?: Partial<EngineOptions>
): Promise<VerificationReport> {
  const engine = new VerificationEngine({
    projectRoot,
    projectId,
    ...opts,
  });
  return engine.verify(spec);
}

export function isComplete(report: VerificationReport): boolean {
  return report.overallPassed;
}

export function createContext(
  projectRoot: string,
  projectId: string
): CheckExecutionContext {
  const fsProbe = new DefaultFileSystemProbe(projectRoot);
  const codeAnalyzer = new DefaultCodeAnalyzer(fsProbe);
  const testRunner = new DefaultTestRunner(projectRoot);
  const browserRunner = new MockBrowserRunner();

  return {
    projectRoot,
    projectId,
    spec: null as any,
    fs: fsProbe,
    codeAnalyzer,
    testRunner,
    browserRunner,
  };
}
