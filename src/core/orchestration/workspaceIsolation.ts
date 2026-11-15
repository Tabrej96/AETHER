/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * WORKSPACE ISOLATION  ·  AETHER Autonomous Execution
 * (src/core/orchestration/workspaceIsolation.ts)
 *
 * Provides sandboxed filesystem operations, process isolation,
 * resource limits, and cleanup on completion or failure.
 *
 * Inspiration: All-Hands-AI/OpenHands (workspace isolation, sandbox patterns)
 *              FoundationAgents/OpenManus (sandboxed execution)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync, execSync } from 'node:child_process';

// =====================================================================
// TYPES
// =====================================================================

export type ResourceLimitType = 'CPU_PERCENT' | 'MEMORY_MB' | 'DISK_MB' | 'PROCESS_COUNT' | 'FILE_DESCRIPTORS' | 'EXECUTION_TIME_MS';

export interface ResourceLimits {
  cpuPercent: number;
  memoryMb: number;
  diskMb: number;
  processCount: number;
  fileDescriptors: number;
  executionTimeMs: number;
}

export interface IsolationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metrics: {
    cpuTimeMs: number;
    memoryPeakMb: number;
    diskUsedMb: number;
    wallClockMs: number;
  };
  cleanupPerformed: boolean;
}

export type CleanupPolicy = 'ON_SUCCESS' | 'ON_FAILURE' | 'ON_BOTH' | 'MANUAL';

export type FileOperation = 'read' | 'write' | 'create' | 'delete' | 'list' | 'copy' | 'move';

export interface SandboxedFileOperation {
  operation: FileOperation;
  sourcePath?: string;
  targetPath?: string;
  content?: string;
}

export interface WorkspaceIsolationOptions {
  sandboxRoot: string;
  resourceLimits: ResourceLimits;
  cleanupPolicy: CleanupPolicy;
  maxWorkspaceAgeMs: number;
  autoCleanupIntervalMs: number;
}

// =====================================================================
// WORKSPACE ISOLATION
// =====================================================================

export class WorkspaceIsolation {
  private readonly options: Required<WorkspaceIsolationOptions>;
  private readonly workspaces: Map<string, { createdAt: string; active: boolean }> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private resourceUsage: Map<string, { cpuMs: number; memoryMb: number; diskMb: number }> = new Map();

  constructor(options: WorkspaceIsolationOptions) {
    this.options = {
      sandboxRoot: options.sandboxRoot,
      resourceLimits: {
        cpuPercent: options.resourceLimits.cpuPercent,
        memoryMb: options.resourceLimits.memoryMb,
        diskMb: options.resourceLimits.diskMb,
        processCount: options.resourceLimits.processCount,
        fileDescriptors: options.resourceLimits.fileDescriptors,
        executionTimeMs: options.resourceLimits.executionTimeMs,
      },
      cleanupPolicy: options.cleanupPolicy,
      maxWorkspaceAgeMs: options.maxWorkspaceAgeMs,
      autoCleanupIntervalMs: options.autoCleanupIntervalMs,
    };

    this.ensureSandboxRoot();
    this.startAutoCleanup();
  }

  /**
   * Create a new isolated workspace.
   */
  createWorkspace(workspaceId?: string): string {
    const id = workspaceId ?? `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const workspacePath = path.join(this.options.sandboxRoot, id);

    if (fs.existsSync(workspacePath)) {
      throw new Error(`Workspace already exists: ${id}`);
    }

    fs.mkdirSync(workspacePath, { recursive: true });

    // Create standard directories
    const subdirs = ['src', 'tests', 'output', 'temp'];
    for (const dir of subdirs) {
      fs.mkdirSync(path.join(workspacePath, dir), { recursive: true });
    }

    this.workspaces.set(id, {
      createdAt: new Date().toISOString(),
      active: true,
    });

    this.resourceUsage.set(id, { cpuMs: 0, memoryMb: 0, diskMb: 0 });

    return id;
  }

  /**
   * Execute an operation within an isolated workspace.
   */
  async executeInWorkspace<T>(
    workspaceId: string,
    operation: (sandboxPath: string) => Promise<T>,
    timeoutMs?: number
  ): Promise<IsolationResult<T>> {
    const sandboxPath = this.getWorkspacePath(workspaceId);
    const startTime = Date.now();
    const startCpu = process.cpuUsage();

    const timeout = timeoutMs ?? this.options.resourceLimits.executionTimeMs;

    try {
      // Check workspace exists and is active
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace || !workspace.active) {
        return {
          success: false,
          error: `Workspace ${workspaceId} does not exist or is inactive`,
          metrics: { cpuTimeMs: 0, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: 0 },
          cleanupPerformed: false,
        };
      }

      // Execute with timeout
      const result = await this.executeWithTimeout(() => operation(sandboxPath), timeout);

      const endCpu = process.cpuUsage(startCpu);
      const wallClockMs = Date.now() - startTime;
      const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;
      const diskUsedMb = this.calculateDiskUsage(sandboxPath);
      const memoryPeakMb = this.estimateMemoryUsage();

      return {
        success: true,
        data: result,
        metrics: { cpuTimeMs, memoryPeakMb, diskUsedMb, wallClockMs },
        cleanupPerformed: false,
      };
    } catch (error) {
      const endCpu = process.cpuUsage(startCpu);
      const wallClockMs = Date.now() - startTime;
      const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;
      const diskUsedMb = this.calculateDiskUsage(sandboxPath);

      const message = error instanceof Error ? error.message : String(error);

      // Auto-cleanup on failure if policy requires
      let cleanupPerformed = false;
      if (this.options.cleanupPolicy === 'ON_FAILURE' || this.options.cleanupPolicy === 'ON_BOTH') {
        cleanupPerformed = this.cleanupWorkspace(workspaceId);
      }

      return {
        success: false,
        error: message,
        metrics: { cpuTimeMs, memoryPeakMb: 0, diskUsedMb, wallClockMs },
        cleanupPerformed,
      };
    }
  }

  /**
   * Execute a synchronous operation in a workspace.
   */
  executeInWorkspaceSync<T>(
    workspaceId: string,
    operation: (sandboxPath: string) => T,
    timeoutMs?: number
  ): IsolationResult<T> {
    const sandboxPath = this.getWorkspacePath(workspaceId);
    const startTime = Date.now();
    const startCpu = process.cpuUsage();

    try {
      const workspace = this.workspaces.get(workspaceId);
      if (!workspace || !workspace.active) {
        return {
          success: false,
          error: `Workspace ${workspaceId} does not exist or is inactive`,
          metrics: { cpuTimeMs: 0, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: 0 },
          cleanupPerformed: false,
        };
      }

      const result = operation(sandboxPath);
      const endCpu = process.cpuUsage(startCpu);
      const wallClockMs = Date.now() - startTime;
      const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;
      const diskUsedMb = this.calculateDiskUsage(sandboxPath);

      return {
        success: true,
        data: result,
        metrics: { cpuTimeMs, memoryPeakMb: 0, diskUsedMb, wallClockMs },
        cleanupPerformed: false,
      };
    } catch (error) {
      const endCpu = process.cpuUsage(startCpu);
      const wallClockMs = Date.now() - startTime;
      const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;
      const message = error instanceof Error ? error.message : String(error);

      let cleanupPerformed = false;
      if (this.options.cleanupPolicy === 'ON_FAILURE' || this.options.cleanupPolicy === 'ON_BOTH') {
        cleanupPerformed = this.cleanupWorkspace(workspaceId);
      }

      return {
        success: false,
        error: message,
        metrics: { cpuTimeMs, memoryPeakMb: 0, diskUsedMb: wallClockMs > 0 ? this.calculateDiskUsage(sandboxPath) : 0, wallClockMs },
        cleanupPerformed,
      };
    }
  }

  /**
   * Perform a sandboxed filesystem operation.
   */
  sandboxedFileOperation(workspaceId: string, operation: SandboxedFileOperation): IsolationResult {
    const workspacePath = this.getWorkspacePath(workspaceId);
    const startTime = Date.now();

    try {
      switch (operation.operation) {
        case 'read': {
          if (!operation.sourcePath) throw new Error('sourcePath required for read');
          const fullPath = this.resolveWorkspacePath(workspacePath, operation.sourcePath);
          const content = fs.readFileSync(fullPath, 'utf-8');
          return {
            success: true,
            data: content,
            metrics: { cpuTimeMs: 0, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: Date.now() - startTime },
            cleanupPerformed: false,
          };
        }
        case 'write':
        case 'create': {
          if (!operation.sourcePath) throw new Error('sourcePath required for write/create');
          const fullPath = this.resolveWorkspacePath(workspacePath, operation.sourcePath);
          const content = operation.content ?? '';
          this.ensureDirectory(path.dirname(fullPath));
          fs.writeFileSync(fullPath, content, 'utf-8');
          return {
            success: true,
            data: { path: operation.sourcePath, bytesWritten: content.length },
            metrics: { cpuTimeMs: 0, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: Date.now() - startTime },
            cleanupPerformed: false,
          };
        }
        case 'delete': {
          if (!operation.sourcePath) throw new Error('sourcePath required for delete');
          const fullPath = this.resolveWorkspacePath(workspacePath, operation.sourcePath);
          if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
          return {
            success: true,
            data: { deleted: operation.sourcePath },
            metrics: { cpuTimeMs: 0, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: Date.now() - startTime },
            cleanupPerformed: false,
          };
        }
        case 'list': {
          const dirPath = operation.sourcePath
            ? this.resolveWorkspacePath(workspacePath, operation.sourcePath)
            : workspacePath;
          const entries = fs.readdirSync(dirPath);
          return {
            success: true,
            data: entries,
            metrics: { cpuTimeMs: 0, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: Date.now() - startTime },
            cleanupPerformed: false,
          };
        }
        default:
          throw new Error(`Unknown operation: ${operation.operation}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: { cpuTimeMs: 0, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: Date.now() - startTime },
        cleanupPerformed: false,
      };
    }
  }

  /**
   * Execute a command in the sandboxed workspace with resource limits.
   */
  async executeCommand(workspaceId: string, command: string, timeoutMs?: number): Promise<IsolationResult> {
    const workspacePath = this.getWorkspacePath(workspaceId);
    const startTime = Date.now();
    const timeout = timeoutMs ?? this.options.resourceLimits.executionTimeMs;

    try {
      const result = spawnSync(command, {
        cwd: workspacePath,
        encoding: 'utf-8',
        timeout,
        killSignal: 'SIGTERM',
        env: { ...process.env, HOME: os.homedir() },
      });

      const durationMs = Date.now() - startTime;
      const timedOut = result.error?.message.includes('timeout') ?? false;

      return {
        success: result.status === 0 && !timedOut,
        data: {
          stdout: result.stdout?.slice(0, 1024 * 1024),
          stderr: result.stderr?.slice(0, 1024 * 1024),
          exitCode: result.status,
        },
        error: timedOut ? 'Command timed out' : result.error?.message,
        metrics: { cpuTimeMs: durationMs, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: durationMs },
        cleanupPerformed: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: { cpuTimeMs: Date.now() - startTime, memoryPeakMb: 0, diskUsedMb: 0, wallClockMs: Date.now() - startTime },
        cleanupPerformed: false,
      };
    }
  }

  /**
   * Clean up a workspace.
   */
  cleanupWorkspace(workspaceId: string): boolean {
    const workspacePath = path.join(this.options.sandboxRoot, workspaceId);

    if (!fs.existsSync(workspacePath)) {
      return false;
    }

    try {
      fs.rmSync(workspacePath, { recursive: true, force: true });
    } catch {
      return false;
    }

    this.workspaces.delete(workspaceId);
    this.resourceUsage.delete(workspaceId);

    return true;
  }

  /**
   * Clean up all active workspaces.
   */
  cleanupAllWorkspaces(): number {
    let count = 0;
    for (const workspaceId of this.workspaces.keys()) {
      if (this.cleanupWorkspace(workspaceId)) count++;
    }
    return count;
  }

  /**
   * Check if a workspace exists.
   */
  workspaceExists(workspaceId: string): boolean {
    return fs.existsSync(this.getWorkspacePath(workspaceId));
  }

  /**
   * Get workspace info.
   */
  getWorkspaceInfo(workspaceId: string): { active: boolean; createdAt: string; path: string } | null {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return null;

    return {
      active: workspace.active,
      createdAt: workspace.createdAt,
      path: this.getWorkspacePath(workspaceId),
    };
  }

  /**
   * Deactivate a workspace (mark as inactive).
   */
  deactivateWorkspace(workspaceId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) return false;
    workspace.active = false;
    return true;
  }

  /**
   * Get resource limits.
   */
  getResourceLimits(): ResourceLimits {
    return { ...this.options.resourceLimits };
  }

  /**
   * Check resource availability for a workspace.
   */
  checkResourceAvailability(workspaceId: string): { available: boolean; violations: string[] } {
    const violations: string[] = [];
    const usage = this.resourceUsage.get(workspaceId);

    if (usage) {
      if (usage.memoryMb > this.options.resourceLimits.memoryMb) {
        violations.push(`Memory limit exceeded: ${usage.memoryMb}MB > ${this.options.resourceLimits.memoryMb}MB`);
      }
      if (usage.diskMb > this.options.resourceLimits.diskMb) {
        violations.push(`Disk limit exceeded: ${usage.diskMb}MB > ${this.options.resourceLimits.diskMb}MB`);
      }
    }

    return { available: violations.length === 0, violations };
  }

  /**
   * Shutdown and clean up the isolation environment.
   */
  shutdown(): void {
    this.stopAutoCleanup();
    this.cleanupAllWorkspaces();
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  private getWorkspacePath(workspaceId: string): string {
    return path.join(this.options.sandboxRoot, workspaceId);
  }

  private resolveWorkspacePath(workspacePath: string, relativePath: string): string {
    const fullPath = path.resolve(workspacePath, relativePath);
    const workspaceReal = fs.realpathSync(workspacePath);
    const resolvedReal = fs.realpathSync(fullPath);

    if (!resolvedReal.startsWith(workspaceReal)) {
      throw new Error(`Path escapes workspace: ${relativePath}`);
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

  private calculateDiskUsage(dirPath: string): number {
    try {
      let totalBytes = 0;

      const walk = (dir: string): void => {
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              walk(fullPath);
            } else if (entry.isFile()) {
              try {
                const stat = fs.statSync(fullPath);
                totalBytes += stat.size;
              } catch {
                // Skip unreadable files
              }
            }
          }
        } catch {
          // Skip unreadable directories
        }
      };

      walk(dirPath);
      return Math.round(totalBytes / (1024 * 1024));
    } catch {
      return 0;
    }
  }

  private estimateMemoryUsage(): number {
    try {
      const usage = process.memoryUsage();
      return Math.round((usage.heapUsed + usage.external) / (1024 * 1024));
    } catch {
      return 0;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve()
        .then(() => fn())
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private startAutoCleanup(): void {
    if (this.options.autoCleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => {
        this.performAutoCleanup();
      }, this.options.autoCleanupIntervalMs);
    }
  }

  private stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private performAutoCleanup(): void {
    const now = Date.now();
    const maxAge = this.options.maxWorkspaceAgeMs;

    for (const [workspaceId, info] of this.workspaces.entries()) {
      const createdAt = new Date(info.createdAt).getTime();
      const age = now - createdAt;

      if (age > maxAge && !info.active) {
        this.cleanupWorkspace(workspaceId);
      }
    }
  }
}

// =====================================================================
// CONVENIENCE FUNCTIONS
// =====================================================================

export function createWorkspaceIsolation(options: WorkspaceIsolationOptions): WorkspaceIsolation {
  return new WorkspaceIsolation(options);
}

export function createDefaultIsolation(sandboxRoot?: string): WorkspaceIsolation {
  const root = sandboxRoot ?? path.join(os.tmpdir(), 'aether-workspaces');
  return new WorkspaceIsolation({
    sandboxRoot: root,
    resourceLimits: {
      cpuPercent: 80,
      memoryMb: 512,
      diskMb: 1024,
      processCount: 10,
      fileDescriptors: 256,
      executionTimeMs: 60_000,
    },
    cleanupPolicy: 'ON_BOTH',
    maxWorkspaceAgeMs: 24 * 60 * 60 * 1000, // 24 hours
    autoCleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
  });
}
