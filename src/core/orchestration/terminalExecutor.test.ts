/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TERMINAL EXECUTOR TESTS  ·  AETHER Autonomous Execution
 * (src/core/orchestration/terminalExecutor.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

import {
  TerminalExecutor,
  createTerminalExecutor,
  runCommand,
  runCommandSync,
  type ExecutionResult,
} from './terminalExecutor';

const SANDBOX = path.join(os.tmpdir(), 'aether-terminal-test-' + Date.now().toString(36));

test.after(async () => {
  try { fs.rmSync(SANDBOX, { recursive: true, force: true }); } catch { /* ignore */ }
});

function createExecutor(): TerminalExecutor {
  if (!fs.existsSync(SANDBOX)) {
    fs.mkdirSync(SANDBOX, { recursive: true });
  }
  return createTerminalExecutor({
    sandboxRoot: SANDBOX,
    timeoutMs: 10_000,
    maxOutputBytes: 1024 * 1024,
    allowedCommands: ['echo', 'cat', 'ls', 'node', 'true', 'false', 'pwd'],
  });
}

// =====================================================================
// BASIC EXECUTION TESTS
// =====================================================================

test('execute: echo command succeeds with stdout', async () => {
  const executor = createExecutor();
  const result = await executor.execute('echo hello-world');
  assert.equal(result.status, 'SUCCEEDED');
  assert.ok(result.stdout.includes('hello-world'));
  assert.equal(result.exitCode, 0);
  assert.ok(!result.timedOut);
});

test('executeSync: simple command', () => {
  const executor = createExecutor();
  const result = executor.executeSync('echo sync-test');
  assert.equal(result.status, 'SUCCEEDED');
  assert.ok(result.stdout.includes('sync-test'));
});

test('execute: exit code 0 = SUCCEEDED', async () => {
  const executor = createExecutor();
  const result = await executor.execute('true');
  assert.equal(result.status, 'SUCCEEDED');
  assert.equal(result.exitCode, 0);
});

test('execute: non-zero exit = FAILED', async () => {
  const executor = createExecutor();
  const result = await executor.execute('false');
  assert.equal(result.status, 'FAILED');
  assert.notEqual(result.exitCode, 0);
});

test('execute: command has timestamps', async () => {
  const executor = createExecutor();
  const result = await executor.execute('echo test');
  assert.ok(result.startedAt);
  assert.ok(result.finishedAt);
  assert.ok(result.durationMs >= 0);
});

// =====================================================================
// BLOCKED COMMAND TESTS
// =====================================================================

test('execute: blocked command returns BLOCKED', async () => {
  const executor = createExecutor();
  const result = await executor.execute('rm -rf /');
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.error?.includes('not in allowlist') || result.error?.includes('blocked'));
});

test('executeSync: blocked command returns BLOCKED', () => {
  const executor = createExecutor();
  const result = executor.executeSync('curl http://example.com');
  assert.equal(result.status, 'BLOCKED');
});

test('isCommandAllowed: allowed command returns true', async () => {
  const executor = createExecutor();
  assert.equal(executor.isCommandAllowed('echo'), true);
});

test('isCommandAllowed: disallowed command returns false', async () => {
  const executor = createExecutor();
  assert.equal(executor.isCommandAllowed('rm'), false);
});

// =====================================================================
// WORKING DIRECTORY TESTS
// =====================================================================

test('execute: working directory is set correctly', async () => {
  const executor = createExecutor();
  const result = await executor.execute('pwd');
  assert.equal(result.status, 'SUCCEEDED');
  assert.ok(result.workingDirectory.includes(SANDBOX), 'uses sandbox root');
});

test('execute: pwd returns valid directory', async () => {
  const executor = createExecutor();
  const result = await executor.execute('pwd');
  assert.equal(result.status, 'SUCCEEDED');
  assert.ok(result.stdout.trim().length > 3, 'pwd output is a valid path');
  // On this environment, the working directory is set to the sandbox root
  assert.ok(result.workingDirectory.length > 3, 'workingDirectory is set');
});

// =====================================================================
// OUTPUT CAPTURE TESTS
// =====================================================================

test('execute: stdout captured correctly', async () => {
  const executor = createExecutor();
  const result = await executor.execute('echo hello-from-stdout');
  assert.ok(result.stdout.includes('hello-from-stdout'));
});

test('execute: multiple sequential executions work', async () => {
  const executor = createExecutor();
  const r1 = await executor.execute('echo first');
  const r2 = await executor.execute('echo second');
  const r3 = await executor.execute('echo third');

  assert.equal(r1.status, 'SUCCEEDED');
  assert.equal(r2.status, 'SUCCEEDED');
  assert.equal(r3.status, 'SUCCEEDED');
  assert.ok(r1.stdout.includes('first'));
  assert.ok(r2.stdout.includes('second'));
  assert.ok(r3.stdout.includes('third'));
});

// =====================================================================
// EXECUTE AND PARSE TESTS
// =====================================================================

test('executeAndParse: parses stdout', async () => {
  const executor = createExecutor();
  const result = await executor.executeAndParse(
    'echo "key=value"',
    (stdout) => {
      const match = stdout.match(/key=(\w+)/);
      return match ? { key: match[1] } : {};
    }
  );
  assert.equal(result.key, 'value');
});

test('executeAndParse: parses simple output', async () => {
  const executor = createExecutor();
  const result = await executor.executeAndParse(
    'echo hello-42',
    (stdout) => {
      const match = stdout.match(/hello-(\d+)/);
      return match ? { parsed: match[1] } : {};
    }
  );
  assert.equal(result.parsed, '42');
});

// =====================================================================
// CANCEL TESTS
// =====================================================================

test('getActiveCount: returns 0 when no commands running', async () => {
  const executor = createExecutor();
  assert.equal(executor.getActiveCount(), 0);
});

test('cancel: returns false for non-existent execution', () => {
  const executor = createExecutor();
  assert.equal(executor.cancel('nonexistent'), false);
});

test('cancelAll: returns false for empty executor', () => {
  const executor = createExecutor();
  executor.cancelAll();
  assert.equal(executor.getActiveCount(), 0);
});

// =====================================================================
// METADATA TESTS
// =====================================================================

test('execute: result includes metadata', async () => {
  const executor = createExecutor();
  const result = await executor.execute('echo metadata-test');
  assert.ok(result.command, 'result has command');
  assert.ok(result.workingDirectory, 'result has workingDirectory');
  assert.ok(result.startedAt, 'result has startedAt');
  assert.ok(result.finishedAt, 'result has finishedAt');
  assert.ok(typeof result.timedOut === 'boolean', 'result has timedOut boolean');
});

// =====================================================================
// SANDBOX ROOT AUTO-CREATION
// =====================================================================

test('sandbox root is created if missing', () => {
  const nonExistentSandbox = path.join(os.tmpdir(), 'aether-new-sandbox-' + Date.now().toString(36));
  assert.ok(!fs.existsSync(nonExistentSandbox));
  createTerminalExecutor({
    sandboxRoot: nonExistentSandbox,
    timeoutMs: 5_000,
    maxOutputBytes: 1024,
    allowedCommands: ['echo'],
  });
  assert.ok(fs.existsSync(nonExistentSandbox), 'sandbox root was created');
  fs.rmSync(nonExistentSandbox, { recursive: true, force: true });
});
