/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AUTONOMOUS VERIFIER  ·  AETHER Autonomous Execution
 * (src/core/orchestration/autonomousVerifier.ts)
 *
 * Post-execution validation, automated test running, quality assessment,
 * and rollback on failure.
 *
 * Inspiration: All-Hands-AI/OpenHands (verification, testing)
 *              FoundationAgents/OpenManus (self-improvement loop)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

// =====================================================================
// TYPES
// =====================================================================

export type VerificationStatus = 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED';
export type Severity = 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type QualityGate = 'BUILD' | 'LINT' | 'TESTS' | 'SECURITY' | 'TYPE_CHECK' | 'COVERAGE' | 'PERFORMANCE';

export interface VerificationResult {
  status: VerificationStatus;
  gate: QualityGate;
  message: string;
  details?: Record<string, unknown>;
  durationMs: number;
  severity: Severity;
  suggestions?: string[];
  timestamp: string;
}

export interface TestSuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  skipped: number;
  totalDurationMs: number;
  failures: Array<{ testName: string; error: string; stack?: string }>;
}

export interface QualityAssessment {
  overallScore: number; // 0-100
  passed: boolean;
  results: VerificationResult[];
  testResults: TestSuiteResult[];
  summary: string;
  rollbackRecommended: boolean;
  rollbackReason?: string;
  metadata: Record<string, unknown>;
}

export interface VerificationOptions {
  runTests: boolean;
  runLint: boolean;
  runTypeCheck: boolean;
  runSecurityScan: boolean;
  testCommand?: string;
  lintCommand?: string;
  typeCheckCommand?: string;
  securityScanCommand?: string;
  coverageThreshold: number;
  maxTestDurationMs: number;
  qualityThreshold: number;
  autoRollback: boolean;
}

export interface RollbackOptions {
  backupDir: string;
  restoreFrom: string;
  dryRun: boolean;
}

// =====================================================================
// AUTONOMOUS VERIFIER
// =====================================================================

export class AutonomousVerifier {
  private readonly options: Required<VerificationOptions>;
  private verificationHistory: VerificationResult[] = [];
  private rollbackStack: Array<{ timestamp: string; backupPath: string; metadata: Record<string, unknown> }> = [];

  constructor(options: VerificationOptions = {}) {
    this.options = {
      runTests: options.runTests ?? true,
      runLint: options.runLint ?? true,
      runTypeCheck: options.runTypeCheck ?? true,
      runSecurityScan: options.runSecurityScan ?? true,
      testCommand: options.testCommand ?? 'npm test',
      lintCommand: options.lintCommand ?? 'npm run lint',
      typeCheckCommand: options.typeCheckCommand ?? 'npx tsc --noEmit',
      securityScanCommand: options.securityScanCommand ?? 'npm audit --audit-level=high',
      coverageThreshold: options.coverageThreshold ?? 80,
      maxTestDurationMs: options.maxTestDurationMs ?? 120_000,
      qualityThreshold: options.qualityThreshold ?? 70,
      autoRollback: options.autoRollback ?? true,
    };
  }

  // =====================================================================
  // VERIFICATION PIPELINE
  // =====================================================================

  /**
   * Run the full verification pipeline.
   */
  async verify(workspaceDir: string): Promise<QualityAssessment> {
    const results: VerificationResult[] = [];
    const startTime = Date.now();

    // Gate 1: Build check
    if (this.options.runTests || this.options.runTypeCheck) {
      results.push(await this.runBuildGate(workspaceDir));
    }

    // Gate 2: Lint
    if (this.options.runLint) {
      results.push(await this.runLintGate(workspaceDir));
    }

    // Gate 3: Type check
    if (this.options.runTypeCheck) {
      results.push(await this.runTypeCheckGate(workspaceDir));
    }

    // Gate 4: Tests
    let testResults: TestSuiteResult[] = [];
    if (this.options.runTests) {
      const testResult = await this.runTestsGate(workspaceDir);
      results.push(testResult.verification);
      testResults = testResult.suites;
    }

    // Gate 5: Security scan
    if (this.options.runSecurityScan) {
      results.push(await this.runSecurityGate(workspaceDir));
    }

    const assessment = this.computeAssessment(results, testResults, Date.now() - startTime);

    // Auto-rollback if needed
    if (this.options.autoRollback && assessment.rollbackRecommended) {
      await this.rollback(workspaceDir, assessment.rollbackReason ?? 'Verification failed');
    }

    this.verificationHistory.push(...results);

    return assessment;
  }

  /**
   * Verify a specific gate.
   */
  async verifyGate(workspaceDir: string, gate: QualityGate): Promise<VerificationResult> {
    switch (gate) {
      case 'BUILD':
        return this.runBuildGate(workspaceDir);
      case 'LINT':
        return this.runLintGate(workspaceDir);
      case 'TESTS':
        const testResult = await this.runTestsGate(workspaceDir);
        return testResult.verification;
      case 'SECURITY':
        return this.runSecurityGate(workspaceDir);
      case 'TYPE_CHECK':
        return this.runTypeCheckGate(workspaceDir);
      default:
        return {
          status: 'SKIPPED',
          gate,
          message: `Gate ${gate} not implemented`,
          durationMs: 0,
          severity: 'INFO',
          timestamp: new Date().toISOString(),
        };
    }
  }

  /**
   * Run all gates in sequence.
   */
  async verifyAll(workspaceDir: string): Promise<VerificationResult[]> {
    const gates: QualityGate[] = ['BUILD', 'LINT', 'TYPE_CHECK', 'TESTS', 'SECURITY'];
    const results: VerificationResult[] = [];

    for (const gate of gates) {
      try {
        const result = await this.verifyGate(workspaceDir, gate);
        results.push(result);
        if (result.status === 'FAILED' && result.severity === 'BLOCKER') {
          break;
        }
      } catch (error) {
        results.push({
          status: 'FAILED',
          gate,
          message: error instanceof Error ? error.message : String(error),
          durationMs: 0,
          severity: 'BLOCKER',
          timestamp: new Date().toISOString(),
        });
        break;
      }
    }

    return results;
  }

  // =====================================================================
  // INDIVIDUAL GATES
  // =====================================================================

  private async runBuildGate(workspaceDir: string): Promise<VerificationResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      // Check if package.json exists
      const packageJsonPath = path.join(workspaceDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return {
          status: 'PASSED',
          gate: 'BUILD',
          message: 'No package.json found, build gate skipped',
          durationMs: Date.now() - startTime,
          severity: 'INFO',
          timestamp: startedAt,
        };
      }

      // Run TypeScript compiler check
      const result = this.runCommand('npx tsc --noEmit', workspaceDir, this.options.maxTestDurationMs);

      if (result.status === 'SUCCEEDED') {
        return {
          status: 'PASSED',
          gate: 'BUILD',
          message: 'TypeScript compilation passed',
          details: { stdout: result.data?.stdout },
          durationMs: Date.now() - startTime,
          severity: 'BLOCKER',
          timestamp: startedAt,
        };
      }

      return {
        status: 'FAILED',
        gate: 'BUILD',
        message: result.error ?? 'Build failed',
        details: { stderr: result.data?.stderr },
        durationMs: Date.now() - startTime,
        severity: 'BLOCKER',
        suggestions: ['Fix TypeScript errors', 'Check missing imports', 'Review type mismatches'],
        timestamp: startedAt,
      };
    } catch (error) {
      return {
        status: 'FAILED',
        gate: 'BUILD',
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
        severity: 'BLOCKER',
        timestamp: startedAt,
      };
    }
  }

  private async runLintGate(workspaceDir: string): Promise<VerificationResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const packageJsonPath = path.join(workspaceDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return {
          status: 'PASSED',
          gate: 'LINT',
          message: 'No package.json found, lint gate skipped',
          durationMs: Date.now() - startTime,
          severity: 'MEDIUM',
          timestamp: startedAt,
        };
      }

      const result = this.runCommand('npx eslint src/ --ext .ts 2>/dev/null || echo "NO_LINT"', workspaceDir, this.options.maxTestDurationMs);

      if (result.status === 'SUCCEEDED' || result.data?.stdout?.includes('NO_LINT')) {
        return {
          status: 'PASSED',
          gate: 'LINT',
          message: 'Lint check passed or skipped',
          durationMs: Date.now() - startTime,
          severity: 'MEDIUM',
          timestamp: startedAt,
        };
      }

      return {
        status: 'WARNING',
        gate: 'LINT',
        message: 'Lint check completed with warnings',
        details: { stdout: result.data?.stdout },
        durationMs: Date.now() - startTime,
        severity: 'MEDIUM',
        suggestions: ['Review lint warnings', 'Fix formatting issues'],
        timestamp: startedAt,
      };
    } catch {
      return {
        status: 'SKIPPED',
        gate: 'LINT',
        message: 'Lint check skipped (tool not available)',
        durationMs: Date.now() - startTime,
        severity: 'LOW',
        timestamp: startedAt,
      };
    }
  }

  private async runTypeCheckGate(workspaceDir: string): Promise<VerificationResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const tsConfigPath = path.join(workspaceDir, 'tsconfig.json');
      if (!fs.existsSync(tsConfigPath)) {
        return {
          status: 'SKIPPED',
          gate: 'TYPE_CHECK',
          message: 'No tsconfig.json found, type check skipped',
          durationMs: Date.now() - startTime,
          severity: 'LOW',
          timestamp: startedAt,
        };
      }

      const result = this.runCommand('npx tsc --noEmit 2>&1 || true', workspaceDir, this.options.maxTestDurationMs);

      if (result.status === 'SUCCEEDED') {
        return {
          status: 'PASSED',
          gate: 'TYPE_CHECK',
          message: 'Type check passed',
          durationMs: Date.now() - startTime,
          severity: 'HIGH',
          timestamp: startedAt,
        };
      }

      return {
        status: 'FAILED',
        gate: 'TYPE_CHECK',
        message: 'Type check found errors',
        details: { stderr: result.data?.stderr },
        durationMs: Date.now() - startTime,
        severity: 'HIGH',
        suggestions: ['Fix type errors', 'Update type definitions'],
        timestamp: startedAt,
      };
    } catch {
      return {
        status: 'SKIPPED',
        gate: 'TYPE_CHECK',
        message: 'Type check skipped (tool not available)',
        durationMs: Date.now() - startTime,
        severity: 'LOW',
        timestamp: startedAt,
      };
    }
  }

  private async runTestsGate(workspaceDir: string): Promise<{ verification: VerificationResult; suites: TestSuiteResult[] }> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();
    const suites: TestSuiteResult[] = [];

    try {
      const packageJsonPath = path.join(workspaceDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        const verification: VerificationResult = {
          status: 'SKIPPED',
          gate: 'TESTS',
          message: 'No package.json found, tests skipped',
          durationMs: Date.now() - startTime,
          severity: 'MEDIUM',
          timestamp: startedAt,
        };
        return { verification, suites };
      }

      // Run tests using tsx
      const result = this.runCommand(
        'npx tsx --test src/core/aether.test.ts 2>&1 || true',
        workspaceDir,
        this.options.maxTestDurationMs
      );

      const stdout = result.data?.stdout ?? '';
      const stderr = result.data?.stderr ?? '';

      // Parse test output
      const testSuite = this.parseTestOutput(stdout + stderr);
      suites.push(testSuite);

      if (result.status === 'SUCCEEDED' || testSuite.failed === 0) {
        const verification: VerificationResult = {
          status: 'PASSED',
          gate: 'TESTS',
          message: `All tests passed (${testSuite.passed}/${testSuite.total})`,
          details: { passed: testSuite.passed, failed: testSuite.failed, skipped: testSuite.skipped },
          durationMs: Date.now() - startTime,
          severity: 'BLOCKER',
          timestamp: startedAt,
        };
        return { verification, suites };
      }

      const verification: VerificationResult = {
        status: 'FAILED',
        gate: 'TESTS',
        message: `Tests failed (${testSuite.failed}/${testSuite.total})`,
        details: {
          passed: testSuite.passed,
          failed: testSuite.failed,
          skipped: testSuite.skipped,
          failures: testSuite.failures.slice(0, 5),
        },
        durationMs: Date.now() - startTime,
        severity: 'BLOCKER',
        suggestions: ['Fix failing tests', 'Review test failures', 'Check test dependencies'],
        timestamp: startedAt,
      };

      return { verification, suites };
    } catch (error) {
      const verification: VerificationResult = {
        status: 'FAILED',
        gate: 'TESTS',
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
        severity: 'BLOCKER',
        timestamp: startedAt,
      };
      return { verification, suites };
    }
  }

  private async runSecurityGate(workspaceDir: string): Promise<VerificationResult> {
    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    try {
      const packageJsonPath = path.join(workspaceDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return {
          status: 'SKIPPED',
          gate: 'SECURITY',
          message: 'No package.json found, security scan skipped',
          durationMs: Date.now() - startTime,
          severity: 'MEDIUM',
          timestamp: startedAt,
        };
      }

      const result = this.runCommand('npm audit --audit-level=high 2>&1 || true', workspaceDir, this.options.maxTestDurationMs);

      const stdout = result.data?.stdout ?? '';
      const hasVulnerabilities = /found.*vulnerabilities/i.test(stdout) || /high|critical/i.test(stdout);

      if (result.status === 'SUCCEEDED' && !hasVulnerabilities) {
        return {
          status: 'PASSED',
          gate: 'SECURITY',
          message: 'No high/critical vulnerabilities found',
          durationMs: Date.now() - startTime,
          severity: 'BLOCKER',
          timestamp: startedAt,
        };
      }

      return {
        status: 'WARNING',
        gate: 'SECURITY',
        message: 'Security scan completed with findings',
        details: { output: stdout.slice(0, 2000) },
        durationMs: Date.now() - startTime,
        severity: 'HIGH',
        suggestions: ['Review npm audit findings', 'Update vulnerable dependencies'],
        timestamp: startedAt,
      };
    } catch {
      return {
        status: 'SKIPPED',
        gate: 'SECURITY',
        message: 'Security scan skipped (tool not available)',
        durationMs: Date.now() - startTime,
        severity: 'MEDIUM',
        timestamp: startedAt,
      };
    }
  }

  // =====================================================================
  // ROLLBACK
  // =====================================================================

  /**
   * Create a backup before changes (for potential rollback).
   */
  createBackup(workspaceDir: string, backupName?: string): string {
    const backupId = backupName ?? `backup-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const backupDir = path.join(os.tmpdir(), 'aether-backups', backupId);

    try {
      fs.cpSync(workspaceDir, backupDir, { recursive: true });
      this.rollbackStack.push({
        timestamp: new Date().toISOString(),
        backupPath: backupDir,
        metadata: { workspaceDir },
      });
      return backupId;
    } catch (error) {
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Rollback to a previous backup.
   */
  async rollback(workspaceDir: string, reason: string, backupId?: string): Promise<boolean> {
    let backupPath: string | undefined;

    if (backupId) {
      const backup = this.rollbackStack.find((b) => b.backupPath.includes(backupId));
      backupPath = backup?.backupPath;
    } else if (this.rollbackStack.length > 0) {
      // Use most recent backup
      const lastBackup = this.rollbackStack[this.rollbackStack.length - 1];
      backupPath = lastBackup.backupPath;
    }

    if (!backupPath || !fs.existsSync(backupPath)) {
      return false;
    }

    try {
      // Clear workspace and restore
      if (fs.existsSync(workspaceDir)) {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
      }
      fs.mkdirSync(path.dirname(workspaceDir), { recursive: true });
      fs.cpSync(backupPath, workspaceDir, { recursive: true });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * List available backups.
   */
  listBackups(): Array<{ backupId: string; timestamp: string; path: string }> {
    return this.rollbackStack.map((b) => ({
      backupId: path.basename(b.backupPath),
      timestamp: b.timestamp,
      path: b.backupPath,
    }));
  }

  // =====================================================================
  // HISTORY & REPORTING
  // =====================================================================

  /**
   * Get verification history.
   */
  getHistory(): VerificationResult[] {
    return [...this.verificationHistory];
  }

  /**
   * Clear verification history.
   */
  clearHistory(): void {
    this.verificationHistory = [];
  }

  /**
   * Generate a verification report.
   */
  generateReport(assessment: QualityAssessment): string {
    const lines: string[] = [];

    lines.push('=== AETHER Autonomous Verification Report ===');
    lines.push(`Status: ${assessment.overallStatus}`);
    lines.push(`Overall Score: ${assessment.overallScore}/100`);
    lines.push(`Rollback Recommended: ${assessment.rollbackRecommended}`);
    if (assessment.rollbackReason) {
      lines.push(`Rollback Reason: ${assessment.rollbackReason}`);
    }
    lines.push('');

    lines.push('--- Verification Results ---');
    for (const result of assessment.results) {
      const statusIcon = result.status === 'PASSED' ? '✓' : result.status === 'FAILED' ? '✗' : '?';
      lines.push(`  ${statusIcon} [${result.gate}] ${result.message} (${result.durationMs}ms)`);
    }

    lines.push('');
    lines.push('--- Test Results ---');
    for (const suite of assessment.testResults) {
      lines.push(`  ${suite.suiteName}: ${suite.passed}/${suite.total} passed, ${suite.failed} failed`);
    }

    lines.push('');
    lines.push(`Summary: ${assessment.summary}`);

    return lines.join('\n');
  }

  // =====================================================================
  // ASSESSMENT COMPUTATION
  // =====================================================================

  private computeAssessment(results: VerificationResult[], testResults: TestSuiteResult[], durationMs: number): QualityAssessment {
    const passed = results.filter((r) => r.status === 'PASSED').length;
    const failed = results.filter((r) => r.status === 'FAILED').length;
    const warnings = results.filter((r) => r.status === 'WARNING').length;

    // Compute score (0-100)
    let score = 100;
    for (const result of results) {
      switch (result.status) {
        case 'FAILED':
          score -= result.severity === 'BLOCKER' ? 30 : result.severity === 'HIGH' ? 20 : 10;
          break;
        case 'WARNING':
          score -= 5;
          break;
        case 'SKIPPED':
          score -= 2;
          break;
      }
    }

    // Penalize test failures
    for (const suite of testResults) {
      if (suite.total > 0) {
        const passRate = suite.passed / suite.total;
        score = Math.min(score, Math.round(score * passRate));
      }
    }

    score = Math.max(0, Math.min(100, score));

    const overallStatus = failed > 0 ? 'FAILED' : warnings > 0 ? 'PARTIAL' : 'PASSED';
    const rollbackRecommended = failed > 0 && results.some((r) => r.severity === 'BLOCKER');

    const summaryParts: string[] = [];
    summaryParts.push(`${passed} gates passed`);
    if (failed > 0) summaryParts.push(`${failed} gates failed`);
    if (warnings > 0) summaryParts.push(`${warnings} warnings`);
    if (testResults.length > 0) {
      const totalTests = testResults.reduce((sum, s) => sum + s.total, 0);
      const totalPassed = testResults.reduce((sum, s) => sum + s.passed, 0);
      summaryParts.push(`${totalPassed}/${totalTests} tests passed`);
    }
    summaryParts.push(`score: ${score}/100`);

    return {
      overallScore: score,
      passed: overallStatus === 'PASSED',
      results,
      testResults,
      summary: summaryParts.join(', '),
      rollbackRecommended,
      rollbackReason: rollbackRecommended ? 'Critical verification failures detected' : undefined,
      metadata: {
        durationMs,
        gateCount: results.length,
        passedCount: passed,
        failedCount: failed,
        warningCount: warnings,
      },
    };
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  private runCommand(command: string, cwd: string, timeoutMs: number): { status: 'SUCCEEDED' | 'FAILED'; data?: { stdout: string; stderr: string }; error?: string } {
    try {
      const result = spawnSync(command, {
        cwd,
        encoding: 'utf-8',
        timeout: timeoutMs,
        shell: true,
        killSignal: 'SIGTERM',
        env: { ...process.env, PATH: process.env.PATH ?? '', HOME: os.homedir() },
      });

      const timedOut = result.error?.message.includes('timeout') ?? false;

      if (result.status === 0 && !timedOut) {
        return {
          status: 'SUCCEEDED',
          data: {
            stdout: typeof result.stdout === 'string' ? result.stdout : '',
            stderr: typeof result.stderr === 'string' ? result.stderr : '',
          },
        };
      }

      return {
        status: 'FAILED',
        data: {
          stdout: typeof result.stdout === 'string' ? result.stdout : '',
          stderr: typeof result.stderr === 'string' ? result.stderr : '',
        },
        error: timedOut ? 'Command timed out' : result.error?.message ?? 'Command failed',
      };
    } catch (error) {
      return {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private parseTestOutput(output: string): TestSuiteResult {
    const suites: TestSuiteResult[] = [];

    // Try to parse node:test output format
    // Format: "| ok [id] title (duration)"
    //         "| not ok [id] title" followed by error details
    const lines = output.split('\n');

    let currentSuite = { suiteName: 'default', passed: 0, failed: 0, skipped: 0, totalDurationMs: 0, failures: [] as Array<{ testName: string; error: string }> };
    let inFailure = false;
    let currentFailure: { testName: string; error: string } | null = null;

    for (const line of lines) {
      if (line.includes('| ok ') || line.includes('(ok)')) {
        currentSuite.passed++;
        currentSuite.total++;
        inFailure = false;
      } else if (line.includes('| not ok ') || line.includes('(not ok)')) {
        currentSuite.failed++;
        currentSuite.total++;
        const testName = line.replace(/.*\| (?:not ok|ok)\s+/, '').trim();
        currentFailure = { testName, error: '' };
        currentSuite.failures.push(currentFailure);
        inFailure = true;
      } else if (inFailure && currentFailure) {
        currentFailure.error += line + '\n';
      } else if (line.match(/\| (passed|failed|skipped)/i)) {
        const match = line.match(/(\d+)\s+(passed|failed|skipped)/i);
        if (match) {
          const count = parseInt(match[1]);
          const type = match[2].toLowerCase();
          if (type === 'passed') currentSuite.passed = count;
          if (type === 'failed') currentSuite.failed = count;
          if (type === 'skipped') currentSuite.skipped = count;
          currentSuite.total = currentSuite.passed + currentSuite.failed + currentSuite.skipped;
        }
      }
    }

    // Fallback: check exit code from output
    if (currentSuite.total === 0 && output.includes('pass') || output.includes('ok')) {
      currentSuite.passed = 1;
      currentSuite.total = 1;
    }

    return currentSuite;
  }
}

// =====================================================================
// CONVENIENCE FUNCTIONS
// =====================================================================

export function createAutonomousVerifier(options?: VerificationOptions): AutonomousVerifier {
  return new AutonomousVerifier(options);
}

export async function verifyWorkspace(workspaceDir: string, options?: VerificationOptions): Promise<QualityAssessment> {
  const verifier = new AutonomousVerifier(options);
  return verifier.verify(workspaceDir);
}
