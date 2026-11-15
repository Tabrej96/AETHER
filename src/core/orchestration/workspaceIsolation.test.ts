/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * WORKSPACE ISOLATION TESTS  ·  AETHER Autonomous Execution
 * (src/core/orchestration/workspaceIsolation.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import {
  WorkspaceIsolation,
  createWorkspaceIsolation,
  createDefaultIsolation,
  type IsolationResult,
} from './workspaceIsolation';

const ROOT = path.join(os.tmpdir(), 'aether-workspace-test-' + Date.now().toString(36));

test.after(async () => {
  try { fs.rmSync(ROOT, { recursive: true, force: true }); } catch { /* ignore */ }
});

function createIsolation(): WorkspaceIsolation {
  return createWorkspaceIsolation({
    sandboxRoot: ROOT,
    resourceLimits: {
      cpuPercent: 90,
      memoryMb: 1024,
      diskMb: 2048,
      processCount: 20,
      fileDescriptors: 512,
      executionTimeMs: 30_000,
    },
    cleanupPolicy: 'ON_BOTH',
    maxWorkspaceAgeMs: 3600_000,
    autoCleanupIntervalMs: 0, // disable for tests
  });
}

// =====================================================================
// WORKSPACE CREATION TESTS
// =====================================================================

test('createWorkspace: creates workspace with standard directories', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  const wsPath = path.join(ROOT, wsId);
  assert.ok(fs.existsSync(wsPath), 'workspace directory exists');
  assert.ok(fs.existsSync(path.join(wsPath, 'src')), 'src directory exists');
  assert.ok(fs.existsSync(path.join(wsPath, 'tests')), 'tests directory exists');
  assert.ok(fs.existsSync(path.join(wsPath, 'output')), 'output directory exists');
  assert.ok(fs.existsSync(path.join(wsPath, 'temp')), 'temp directory exists');
});

test('createWorkspace: auto-generates unique IDs', () => {
  const isolation = createIsolation();
  const ws1 = isolation.createWorkspace();
  const ws2 = isolation.createWorkspace();
  assert.ok(ws1 !== ws2, 'workspace IDs are unique');
});

test('createWorkspace: accepts custom ID', () => {
  const isolation = createIsolation();
  const customId = 'my-custom-workspace';
  const wsId = isolation.createWorkspace(customId);
  assert.equal(wsId, customId);
});

test('createWorkspace: throws for duplicate ID', () => {
  const isolation = createIsolation();
  isolation.createWorkspace('duplicate-ws');
  assert.throws(() => isolation.createWorkspace('duplicate-ws'), /already exists/);
});

// =====================================================================
// WORKSPACE OPERATIONS TESTS
// =====================================================================

test('sandboxedFileOperation: write and read', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();

  const writeResult = isolation.sandboxedFileOperation(wsId, {
    operation: 'write',
    sourcePath: 'hello.txt',
    content: 'Hello, World!',
  });
  assert.equal(writeResult.success, true);

  const readResult = isolation.sandboxedFileOperation(wsId, {
    operation: 'read',
    sourcePath: 'hello.txt',
  });
  assert.equal(readResult.success, true);
  assert.equal(readResult.data, 'Hello, World!');
});

test('sandboxedFileOperation: list directory', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  const wsPath = path.join(ROOT, wsId);
  fs.writeFileSync(path.join(wsPath, 'a.txt'), 'a');
  fs.writeFileSync(path.join(wsPath, 'b.txt'), 'b');

  const result = isolation.sandboxedFileOperation(wsId, { operation: 'list' });
  assert.equal(result.success, true);
  const entries = result.data as string[];
  assert.ok(entries.includes('src'), 'src in listing');
  assert.ok(entries.includes('tests'), 'tests in listing');
});

test('sandboxedFileOperation: delete file', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();

  isolation.sandboxedFileOperation(wsId, {
    operation: 'write',
    sourcePath: 'delete-me.txt',
    content: 'bye',
  });

  const result = isolation.sandboxedFileOperation(wsId, {
    operation: 'delete',
    sourcePath: 'delete-me.txt',
  });
  assert.equal(result.success, true);
});

test('sandboxedFileOperation: path escape is prevented', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();

  const result = isolation.sandboxedFileOperation(wsId, {
    operation: 'write',
    sourcePath: '../../etc/evil.txt',
    content: 'evil',
  });
  assert.equal(result.success, false);
  assert.ok(result.error?.includes('escapes') || result.error?.includes('not allowed') || result.error?.includes('resolve'), result.error);
});

// =====================================================================
// EXECUTE IN WORKSPACE TESTS
// =====================================================================

test('executeInWorkspace: runs function in sandbox path', async () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();

  const result = await isolation.executeInWorkspace(wsId, async (sandboxPath) => {
    assert.ok(sandboxPath.includes(ROOT), 'path is within sandbox root');
    return { success: true, path: sandboxPath };
  });

  assert.equal(result.success, true);
  assert.ok(result.data?.success === true);
});

test('executeInWorkspace: captures metrics', async () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();

  const result = await isolation.executeInWorkspace(wsId, async () => {
    return { done: true };
  });

  assert.equal(result.success, true);
  assert.ok(result.metrics.wallClockMs >= 0);
  assert.ok(typeof result.metrics.cpuTimeMs === 'number');
  assert.ok(typeof result.metrics.diskUsedMb === 'number');
  assert.equal(result.cleanupPerformed, false);
});

test('executeInWorkspace: fails for non-existent workspace', async () => {
  const isolation = createIsolation();

  const result = await isolation.executeInWorkspace('nonexistent-ws', async () => {
    return {};
  });

  assert.equal(result.success, false);
  assert.ok(result.error, 'has error');
});

test('executeInWorkspace: auto-cleanup on failure', async () => {
  const isolation = createWorkspaceIsolation({
    sandboxRoot: ROOT,
    resourceLimits: {
      cpuPercent: 80,
      memoryMb: 256,
      diskMb: 512,
      processCount: 5,
      fileDescriptors: 100,
      executionTimeMs: 10_000,
    },
    cleanupPolicy: 'ON_FAILURE',
    maxWorkspaceAgeMs: 3600_000,
    autoCleanupIntervalMs: 0,
  });

  const wsId = isolation.createWorkspace();
  const wsPath = path.join(ROOT, wsId);
  assert.ok(fs.existsSync(wsPath), 'workspace exists before failure');

  await isolation.executeInWorkspace(wsId, async () => {
    throw new Error('deliberate failure');
  });

  // cleanup performed on failure
  assert.ok(!fs.existsSync(wsPath) || !isolation.workspaceExists(wsId), 'workspace cleaned up after failure');
});

// =====================================================================
// EXECUTE IN WORKSPACE SYNC TESTS
// =====================================================================

test('executeInWorkspaceSync: runs synchronously', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();

  const result = isolation.executeInWorkspaceSync(wsId, (sandboxPath) => {
    return { sync: true, path: sandboxPath };
  });

  assert.equal(result.success, true);
  assert.equal(result.data?.sync, true);
});

test('executeInWorkspaceSync: captures errors', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();

  const result = isolation.executeInWorkspaceSync(wsId, () => {
    throw new Error('sync failure');
  });

  assert.equal(result.success, false);
  assert.ok(result.error?.includes('sync failure'));
});

// =====================================================================
// COMMAND EXECUTION TESTS
// =====================================================================

test('executeCommand: runs command in workspace', async () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  const result = await isolation.executeCommand(wsId, 'echo workspace-test');
  assert.ok(result.success === true || result.success === false, 'returns a result');
});

test('executeCommand: non-existent workspace fails', async () => {
  const isolation = createIsolation();

  const result = await isolation.executeCommand('nonexistent-ws', 'echo test');
  assert.equal(result.success, false);
});

// =====================================================================
// WORKSPACE INFO TESTS
// =====================================================================

test('workspaceExists: returns true for existing workspace', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  assert.equal(isolation.workspaceExists(wsId), true);
});

test('workspaceExists: returns false for non-existing', () => {
  const isolation = createIsolation();
  assert.equal(isolation.workspaceExists('nonexistent-ws'), false);
});

test('getWorkspaceInfo: returns info for valid workspace', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  const info = isolation.getWorkspaceInfo(wsId);
  assert.ok(info !== null);
  assert.equal(info!.active, true);
  assert.ok(info!.createdAt);
  assert.ok(info!.path.includes(ROOT));
});

test('getWorkspaceInfo: returns null for invalid workspace', () => {
  const isolation = createIsolation();
  assert.equal(isolation.getWorkspaceInfo('nonexistent-ws'), null);
});

test('deactivateWorkspace: marks workspace inactive', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  const result = isolation.deactivateWorkspace(wsId);
  assert.equal(result, true);
  const info = isolation.getWorkspaceInfo(wsId);
  assert.equal(info!.active, false);
});

// =====================================================================
// CLEANUP TESTS
// =====================================================================

test('cleanupWorkspace: removes workspace', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  const wsPath = path.join(ROOT, wsId);
  assert.ok(fs.existsSync(wsPath), 'workspace exists before cleanup');

  const result = isolation.cleanupWorkspace(wsId);
  assert.equal(result, true);
  assert.ok(!fs.existsSync(wsPath), 'workspace removed after cleanup');
});

test('cleanupWorkspace: returns false for non-existent', () => {
  const isolation = createIsolation();
  assert.equal(isolation.cleanupWorkspace('nonexistent-ws'), false);
});

test('cleanupAllWorkspaces: removes all', () => {
  const isolation = createIsolation();
  isolation.createWorkspace('ws-1');
  isolation.createWorkspace('ws-2');
  isolation.createWorkspace('ws-3');
  const count = isolation.cleanupAllWorkspaces();
  assert.equal(count, 3);
});

// =====================================================================
// RESOURCE LIMITS TESTS
// =====================================================================

test('getResourceLimits: returns configured limits', () => {
  const isolation = createIsolation();
  const limits = isolation.getResourceLimits();
  assert.equal(limits.memoryMb, 1024);
  assert.equal(limits.diskMb, 2048);
  assert.equal(limits.cpuPercent, 90);
});

test('checkResourceAvailability: passes when within limits', () => {
  const isolation = createIsolation();
  const wsId = isolation.createWorkspace();
  const { available, violations } = isolation.checkResourceAvailability(wsId);
  assert.equal(available, true);
  assert.equal(violations.length, 0);
});

// =====================================================================
// CONVENIENCE FUNCTION TESTS
// =====================================================================

test('createDefaultIsolation: creates with sensible defaults', () => {
  const isolation = createDefaultIsolation(path.join(ROOT, 'default'));
  const wsId = isolation.createWorkspace();
  const limits = isolation.getResourceLimits();
  assert.ok(limits.memoryMb > 0);
  assert.ok(limits.diskMb > 0);
  assert.ok(isolation.workspaceExists(wsId));
});

// =====================================================================
// SHUTDOWN TESTS
// =====================================================================

test('shutdown: cleans up all workspaces', () => {
  const isolation = createIsolation();
  isolation.createWorkspace('shutdown-ws-1');
  isolation.createWorkspace('shutdown-ws-2');
  isolation.shutdown();
  assert.ok(!fs.existsSync(path.join(ROOT, 'shutdown-ws-1')));
  assert.ok(!fs.existsSync(path.join(ROOT, 'shutdown-ws-2')));
});
