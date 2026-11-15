/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — PERMISSION GUARD TESTS  ·  AETHER Reverse Intelligence
 * (src/core/reverse/permissionGuard.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AnalysisCategory,
  AuthCheckResult,
  PermissionGuard,
  ReverseEngineAuthorization,
  SafeModeConfig,
  ScopeLimits,
  createGuard,
  getDefaultGuard,
} from './permissionGuard';

// Reset singleton between tests
function freshGuard(opts?: Parameters<typeof createGuard>[0]) {
  return createGuard(opts);
}

// ─── Authorization ────────────────────────────────────────────────────────────

test('GRANTED: authorized=true with valid basis', () => {
  const guard = freshGuard();
  const auth: ReverseEngineAuthorization = {
    targetId: 'my-app',
    basis: 'OWNED',
    authorized: true,
    evidence: 'I own this machine.',
  };
  const result = guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
  assert.strictEqual(result.authorized, true);
  assert.strictEqual(result.reason, 'Authorized');
});

test('DENIED: authorized=false blocks everything', () => {
  const guard = freshGuard();
  const auth: ReverseEngineAuthorization = {
    targetId: 'other-app',
    basis: 'OWNED',
    authorized: false,
    evidence: 'Not my code.',
  };
  const result = guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
  assert.strictEqual(result.authorized, false);
  assert.match(result.reason, /DENIED/);
});

test('DENIED_OUT_OF_SCOPE: category not in allowed list', () => {
  const guard = freshGuard({
    scope: { allowedCategories: ['STATIC_ANALYSIS', 'AST_ANALYSIS'] },
  });
  const auth: ReverseEngineAuthorization = {
    targetId: 'my-app',
    basis: 'OWNED',
    authorized: true,
    evidence: 'Owned.',
  };
  const result = guard.checkAuthorization(auth, 'NETWORK_CAPTURE');
  assert.strictEqual(result.authorized, false);
  assert.match(result.reason, /not within the current scope/);
});

test('GRANTED: all default categories are allowed', () => {
  const guard = freshGuard();
  const auth: ReverseEngineAuthorization = {
    targetId: 'my-app',
    basis: 'OWNED',
    authorized: true,
    evidence: 'Owned.',
  };
  const categories: AnalysisCategory[] = [
    'STATIC_ANALYSIS',
    'AST_ANALYSIS',
    'DEPENDENCY_MAPPING',
    'ARCHITECTURE_EXTRACTION',
    'COMPLEXITY_METRICS',
    'API_DISCOVERY',
    'RUNTIME_OBSERVATION',
    'VULNERABILITY_SCANNING',
  ];
  for (const cat of categories) {
    const result = guard.checkAuthorization(auth, cat);
    assert.strictEqual(
      result.authorized,
      true,
      `Category ${cat} should be allowed by default`
    );
  }
});

// ─── Scope ────────────────────────────────────────────────────────────────────

test('isPathAllowed: matching allowed path returns true', () => {
  const guard = freshGuard({
    scope: { allowedPaths: ['src/**', 'lib/**'] },
  });
  assert.strictEqual(guard.isPathAllowed('src/core/reverse/foo.ts'), true);
  assert.strictEqual(guard.isPathAllowed('lib/bar.js'), true);
});

test('isPathAllowed: forbidden path blocks even if not in allowedPaths', () => {
  const guard = freshGuard({
    scope: {
      allowedPaths: ['src/**', 'lib/**'],
      forbiddenPaths: ['**/node_modules/**', '**/secret/**'],
    },
  });
  assert.strictEqual(guard.isPathAllowed('node_modules/express/index.js'), false);
  assert.strictEqual(guard.isPathAllowed('src/node_modules/foo.js'), false);
  assert.strictEqual(guard.isPathAllowed('src/secret/data.ts'), false);
  assert.strictEqual(guard.isPathAllowed('src/core/reverse/foo.ts'), true);
});

test('isPathAllowed: path not in allowedPaths returns false', () => {
  const guard = freshGuard({
    scope: { allowedPaths: ['src/**'] },
  });
  assert.strictEqual(guard.isPathAllowed('vendor/other/bar.ts'), false);
});

// ─── Safe Mode ────────────────────────────────────────────────────────────────

test('safeMode: blockWrites throws on WRITE', () => {
  const guard = freshGuard({
    safeMode: { blockWrites: true, blockNetwork: true, blockProcessSpawn: true, astOnly: false, maxExecutionMs: 60000 },
  });
  assert.throws(() => guard.enforceSafeMode('WRITE'), /SAFE_MODE.*Write operations/);
});

test('safeMode: blockNetwork throws on NETWORK', () => {
  const guard = freshGuard({
    safeMode: { blockWrites: true, blockNetwork: true, blockProcessSpawn: true, astOnly: false, maxExecutionMs: 60000 },
  });
  assert.throws(() => guard.enforceSafeMode('NETWORK'), /SAFE_MODE.*Network operations/);
});

test('safeMode: blockProcessSpawn throws on SPAWN_PROCESS', () => {
  const guard = freshGuard({
    safeMode: { blockWrites: true, blockNetwork: true, blockProcessSpawn: true, astOnly: false, maxExecutionMs: 60000 },
  });
  assert.throws(() => guard.enforceSafeMode('SPAWN_PROCESS'), /SAFE_MODE.*Process spawning/);
});

test('safeMode: astOnly blocks non-AST_READ operations', () => {
  const guard = freshGuard({
    safeMode: { blockWrites: true, blockNetwork: true, blockProcessSpawn: true, astOnly: true, maxExecutionMs: 60000 },
  });
  assert.throws(() => guard.enforceSafeMode('FILE_READ'), /SAFE_MODE.*AST read/);
  assert.doesNotThrow(() => guard.enforceSafeMode('AST_READ'));
});

test('safeMode: non-blocked operations pass through', () => {
  const guard = freshGuard({
    safeMode: { blockWrites: true, blockNetwork: true, blockProcessSpawn: true, astOnly: false, maxExecutionMs: 60000 },
  });
  assert.doesNotThrow(() => guard.enforceSafeMode('AST_READ'));
  assert.doesNotThrow(() => guard.enforceSafeMode('FILE_READ'));
  assert.doesNotThrow(() => guard.enforceSafeMode('COMPUTE_SCORE'));
});

// ─── Operation tracking ───────────────────────────────────────────────────────

test('startOperation / endOperation: tracks duration', () => {
  const guard = freshGuard();
  const auth: ReverseEngineAuthorization = {
    targetId: 'my-app',
    basis: 'OWNED',
    authorized: true,
    evidence: 'Owned.',
  };
  guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
  const opId = guard.startOperation('STATIC_ANALYSIS', 'my-app');
  assert.strictEqual(typeof opId, 'string');
  assert.ok(opId.startsWith('op-'));
  const { durationMs } = guard.endOperation(opId);
  assert.ok(durationMs >= 0);
  assert.ok(durationMs < 1000, 'should complete within a second');
});

test('endOperation: unknown operation throws', () => {
  const guard = freshGuard();
  assert.throws(() => guard.endOperation('op-nonexistent'), /Unknown operation/);
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

test('audit log records authorization checks', () => {
  const guard = freshGuard();
  const auth: ReverseEngineAuthorization = {
    targetId: 'my-app',
    basis: 'OWNED',
    authorized: true,
    evidence: 'Owned.',
  };
  guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
  const entries = guard.getAuditLog();
  assert.ok(entries.length >= 1);
  const last = entries[entries.length - 1];
  assert.strictEqual(last.targetId, 'my-app');
  assert.strictEqual(last.operationType, 'STATIC_ANALYSIS');
  assert.strictEqual(last.result, 'GRANTED');
});

test('audit log records denials', () => {
  const guard = freshGuard();
  const auth: ReverseEngineAuthorization = {
    targetId: 'other-app',
    basis: 'OWNED',
    authorized: false,
    evidence: 'Not owned.',
  };
  guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
  const entries = guard.getAuditLog();
  assert.ok(entries.length >= 1);
  assert.strictEqual(entries[entries.length - 1].result, 'DENIED');
});

test('audit log is a copy — mutations do not affect guard', () => {
  const guard = freshGuard();
  const log = guard.getAuditLog();
  log.push({ timestamp: 'fake', operationId: 'fake', operationType: 'STATIC_ANALYSIS', targetId: 'fake', userId: 'fake', result: 'GRANTED', reason: 'fake', scopeUsed: guard.getScope() });
  assert.strictEqual(guard.getAuditLog().length, 0, 'guard audit log should not be affected');
});

// ─── Scope limits ─────────────────────────────────────────────────────────────

test('getScope returns config copy', () => {
  const guard = freshGuard({
    scope: { maxFiles: 42, maxBytes: 1234 },
  });
  const scope = guard.getScope();
  assert.strictEqual(scope.maxFiles, 42);
  assert.strictEqual(scope.maxBytes, 1234);
  scope.maxFiles = 999;
  assert.strictEqual(guard.getScope().maxFiles, 42, 'modifying copy should not affect guard');
});

test('getSafeMode returns config copy', () => {
  const guard = freshGuard({
    safeMode: { maxExecutionMs: 5000 },
  });
  const sm = guard.getSafeMode();
  assert.strictEqual(sm.maxExecutionMs, 5000);
});

// ─── Custom user ID ───────────────────────────────────────────────────────────

test('userId is recorded in audit log', () => {
  const guard = freshGuard({ userId: 'researcher-42' });
  const auth: ReverseEngineAuthorization = {
    targetId: 'my-app',
    basis: 'OWNED',
    authorized: true,
    evidence: 'Owned.',
  };
  guard.checkAuthorization(auth, 'STATIC_ANALYSIS');
  const entries = guard.getAuditLog();
  assert.strictEqual(entries[entries.length - 1].userId, 'researcher-42');
});

// ─── Singleton ────────────────────────────────────────────────────────────────

test('getDefaultGuard returns a singleton instance', () => {
  const g1 = getDefaultGuard();
  const g2 = getDefaultGuard();
  assert.strictEqual(g1, g2);
});
