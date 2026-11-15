/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TERMINAL EXECUTION ENGINE  ·  AETHER Autonomous Execution
 * (src/core/orchestration/terminalExecutor.ts)
 *
 * Safe command execution in an isolated workspace with output capture,
 * error detection, and timeout management.
 *
 * Inspiration: All-Hands-AI/OpenHands (safe shell execution, sandbox patterns)
 *              FoundationAgents/OpenManus (tool execution framework)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

// =====================================================================
// TYPES
// =====================================================================

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'CANCELLED' | 'BLOCKED';

export interface ExecutionResult {
  status: ExecutionStatus;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  command: string;
  workingDirectory: string;
  startedAt: string;
  finishedAt: string;
  error?: string;
}

export type OutputParser = (stdout: string, stderr: string) => Record<string, unknown>;

export interface TerminalExecutorOptions {
  /** Root directory for sandboxed execution */
  sandboxRoot: string;
  /** Wall-clock timeout in ms */
  timeoutMs: number;
  /** Max output capture per stream */
  maxOutputBytes: number;
  /** Allowed commands (base names) — empty = no shell execution allowed */
  allowedCommands: string[];
  /** Environment variables to inject */
  env?: Record<string, string>;
  /** Stream stdout/stderr live to this callback */
  outputCallback?: (stream: 'stdout' | 'stderr', chunk: string) => void;
}

// =====================================================================
// TERMINAL EXECUTOR
// =====================================================================

export class TerminalExecutor {
  private readonly options: Required<TerminalExecutorOptions>;
  private activeProcesses: Map<string, { child: ReturnType<typeof spawn>; timer: NodeJS.Timeout }> =
    new Map();
  private executionCounter = 0;

  constructor(options: TerminalExecutorOptions) {
    this.options = {
      sandboxRoot: options.sandboxRoot,
      timeoutMs: options.timeoutMs,
      maxOutputBytes: options.maxOutputBytes,
      allowedCommands: options.allowedCommands,
      env: options.env ?? {},
      outputCallback: options.outputCallback ?? (() => {}),
    };

    this.ensureSandboxRoot();
  }

  /**
   * Execute a command in the sandbox.
   */
  async execute(command: string, workingDir?: string): Promise<ExecutionResult> {
    const execId = `exec-${String(++this.executionCounter).padStart(5, '0')}`;
    const startedAt = new Date().toISOString();
    const cwd = workingDir
      ? this.resolveSandboxPath(workingDir)
      : this.options.sandboxRoot;

    // Ensure working directory exists
    this.ensureDirectory(cwd);

    // Parse command
    const { baseCommand, args, blocked } = this.parseCommand(command);
    if (blocked) {
      return {
        status: 'BLOCKED',
        exitCode: -1,
        stdout: '',
        stderr: `Command blocked by policy: ${command}`,
        durationMs: 0,
        timedOut: false,
        command,
        workingDirectory: cwd,
        startedAt,
        finishedAt: new Date().toISOString(),
        error: 'Command not in allowlist',
      };
    }

    // Execute
    const startTime = Date.now();
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    let timedOut = false;

    return new Promise((resolve) => {
      const child = spawn(baseCommand, args, {
        cwd,
        env: this.buildEnv(),
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: this.options.timeoutMs,
        killSignal: 'SIGTERM',
      });

      this.activeProcesses.set(execId, { child, timer: setTimeout(() => this.handleTimeout(execId), this.options.timeoutMs) });

      const maxBytes = this.options.maxOutputBytes;

      child.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        if (stdoutChunks.join('').length + chunk.length <= maxBytes) {
          stdoutChunks.push(chunk);
        }
        this.options.outputCallback('stdout', chunk);
      });

      child.stderr.on('data', (data: Buffer) => {
        const chunk = data.toString();
        if (stderrChunks.join('').length + chunk.length <= maxBytes) {
          stderrChunks.push(chunk);
        }
        this.options.outputCallback('stderr', chunk);
      });

      child.on('error', (err) => {
        this.cleanupProcess(execId);
        resolve({
          status: 'FAILED',
          exitCode: null,
          stdout: stdoutChunks.join(''),
          stderr: stderrChunks.join(''),
          durationMs: Date.now() - startTime,
          timedOut: false,
          command,
          workingDirectory: cwd,
          startedAt,
          finishedAt: new Date().toISOString(),
          error: err.message,
        });
      });

      child.on('close', (code) => {
        this.cleanupProcess(execId);
        const durationMs = Date.now() - startTime;
        const exitCode = code ?? null;
        const status = timedOut
          ? 'TIMED_OUT'
          : exitCode === 0
            ? 'SUCCEEDED'
            : 'FAILED';

        resolve({
          status,
          exitCode,
          stdout: stdoutChunks.join(''),
          stderr: stderrChunks.join(''),
          durationMs,
          timedOut,
          command,
          workingDirectory: cwd,
          startedAt,
          finishedAt: new Date().toISOString(),
        });
      });
    });
  }

  /**
   * Execute synchronously (for simple, fast commands).
   */
  executeSync(command: string, workingDir?: string): ExecutionResult {
    const startedAt = new Date().toISOString();
    const cwd = workingDir
      ? this.resolveSandboxPath(workingDir)
      : this.options.sandboxRoot;

    this.ensureDirectory(cwd);

    const { baseCommand, args, blocked } = this.parseCommand(command);
    if (blocked) {
      return {
        status: 'BLOCKED',
        exitCode: -1,
        stdout: '',
        stderr: `Command blocked by policy: ${command}`,
        durationMs: 0,
        timedOut: false,
        command,
        workingDirectory: cwd,
        startedAt,
        finishedAt: new Date().toISOString(),
        error: 'Command not in allowlist',
      };
    }

    const startTime = Date.now();
    const maxBytes = this.options.maxOutputBytes;
    const result = spawnSync(baseCommand, args, {
      cwd,
      env: this.buildEnv(),
      encoding: 'utf-8',
      timeout: this.options.timeoutMs,
      killSignal: 'SIGTERM',
      maxBuffer: maxBytes * 2,
    });

    const durationMs = Date.now() - startTime;
    const timedOut = result.error?.name === 'SpawnSyncError' && result.error.message.includes('timeout');
    const status = timedOut
      ? 'TIMED_OUT'
      : result.status === 0
        ? 'SUCCEEDED'
        : 'FAILED';

    return {
      status,
      exitCode: result.status ?? null,
      stdout: typeof result.stdout === 'string' ? result.stdout.slice(0, maxBytes) : '',
      stderr: typeof result.stderr === 'string' ? result.stderr.slice(0, maxBytes) : '',
      durationMs,
      timedOut,
      command,
      workingDirectory: cwd,
      startedAt,
      finishedAt: new Date().toISOString(),
      error: timedOut ? 'Command timed out' : result.error?.message,
    };
  }

  /**
   * Execute and parse output with a custom parser.
   */
  async executeAndParse(command: string, parser: OutputParser, workingDir?: string): Promise<Record<string, unknown>> {
    const result = await this.execute(command, workingDir);
    return parser(result.stdout, result.stderr);
  }

  /**
   * Cancel a running execution by ID.
   */
  cancel(execId: string): boolean {
    const entry = this.activeProcesses.get(execId);
    if (!entry) return false;

    entry.child.kill('SIGTERM');
    clearTimeout(entry.timer);
    this.activeProcesses.delete(execId);
    return true;
  }

  /**
   * Cancel all active executions.
   */
  cancelAll(): void {
    for (const [execId] of this.activeProcesses) {
      this.cancel(execId);
    }
  }

  /**
   * Check if a command is allowed.
   */
  isCommandAllowed(command: string): boolean {
    const { baseCommand } = this.parseCommand(command);
    return this.options.allowedCommands.length === 0
      ? false
      : this.options.allowedCommands.includes(baseCommand);
  }

  /**
   * Get active execution count.
   */
  getActiveCount(): number {
    return this.activeProcesses.size;
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  private parseCommand(command: string): { baseCommand: string; args: string[]; blocked: boolean } {
    const trimmed = command.trim();
    const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [trimmed];
    const baseCommand = parts[0]?.replace(/"/g, '') ?? '';
    const args = parts.slice(1).map((a) => a.replace(/"/g, ''));

    const blocked = this.options.allowedCommands.length > 0 && !this.options.allowedCommands.includes(baseCommand);
    return { baseCommand, args, blocked };
  }

  private buildEnv(): Record<string, string> {
    const env: Record<string, string> = {
      ...process.env,
      ...this.options.env,
      PATH: process.env.PATH ?? '',
      HOME: os.homedir(),
    };
    return env;
  }

  private resolveSandboxPath(inputPath: string): string {
    const resolved = path.resolve(this.options.sandboxRoot, inputPath);
    const sandboxReal = fs.realpathSync(this.options.sandboxRoot);
    const resolvedReal = fs.realpathSync(resolved);
    if (!resolvedReal.startsWith(sandboxReal)) {
      throw new Error(`Path escapes sandbox: ${inputPath}`);
    }
    return resolvedReal;
  }

  private ensureSandboxRoot(): void {
    if (!fs.existsSync(this.options.sandboxRoot)) {
      fs.mkdirSync(this.options.sandboxRoot, { recursive: true });
    }
  }

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private handleTimeout(execId: string): void {
    const entry = this.activeProcesses.get(execId);
    if (!entry) return;

    entry.child.kill('SIGTERM');
    clearTimeout(entry.timer);
    this.activeProcesses.delete(execId);
  }

  private cleanupProcess(execId: string): void {
    const entry = this.activeProcesses.get(execId);
    if (entry) {
      clearTimeout(entry.timer);
      this.activeProcesses.delete(execId);
    }
  }
}

// =====================================================================
// CONVENIENCE FUNCTIONS
// =====================================================================

export function createTerminalExecutor(options: TerminalExecutorOptions): TerminalExecutor {
  return new TerminalExecutor(options);
}

export function runCommand(
  command: string,
  sandboxRoot: string,
  timeoutMs = 30_000
): Promise<ExecutionResult> {
  const executor = new TerminalExecutor({
    sandboxRoot,
    timeoutMs,
    maxOutputBytes: 1024 * 1024,
    allowedCommands: ['node', 'npx', 'npm', 'tsx', 'tsc', 'echo', 'cat', 'ls', 'dir', 'pwd', 'git', 'python', 'python3'],
  });
  return executor.execute(command);
}

export function runCommandSync(
  command: string,
  sandboxRoot: string,
  timeoutMs = 30_000
): ExecutionResult {
  const executor = new TerminalExecutor({
    sandboxRoot,
    timeoutMs,
    maxOutputBytes: 1024 * 1024,
    allowedCommands: ['node', 'npx', 'npm', 'tsx', 'tsc', 'echo', 'cat', 'ls', 'dir', 'pwd', 'git', 'python', 'python3'],
  });
  return executor.executeSync(command);
}
