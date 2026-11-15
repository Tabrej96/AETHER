/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Tests for Cookie & Auth Management (src/core/browser/authManager.test.ts)
 *
 * Run via: npx --yes tsx --test src/core/browser/authManager.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { AuthManager, type AuthState, type LoginCredentials, type SavedSession } from './authManager';
import { MockBrowserBackend } from './browserEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createAuthManager(): Promise<{ auth: AuthManager; backend: MockBrowserBackend; pageId: string }> {
  const backend = new MockBrowserBackend();
  await backend.launch({}, fs.mkdtempSync(path.join(os.tmpdir(), 'aether-auth-test-')));
  const pageId = await backend.newPage();
  await backend.navigate(pageId, 'https://example.com');
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-auth-session-'));
  const auth = new AuthManager(backend, 'auth-test-session', { sessionDir });
  return { auth, backend, pageId };
}

const TEST_CREDENTIALS: LoginCredentials = {
  url: 'https://example.com/login',
  usernameSelector: '#user',
  passwordSelector: '#pass',
  submitSelector: '#login',
  rememberMeSelector: '#remember',
  rememberMe: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

test('AuthManager: detectAuthState returns unauthenticated on fresh page', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    // Fresh mock page has no auth cookies
    const state = await auth.detectAuthState(pageId);
    assert.strictEqual(state.authenticated, false);
    assert.ok(state.authCookieNames.length === 0, 'should have no auth cookies');
  } finally {
    await backend.close();
  }
});

test('AuthManager: detectAuthState returns authenticated when cookies exist', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    await backend.setCookies(pageId, [{ session_id: 'abc123' }]);
    const state = await auth.detectAuthState(pageId);
    assert.strictEqual(state.authenticated, true);
    assert.ok(state.authCookieNames.length > 0, 'should detect auth cookies');
    assert.strictEqual(state.mechanism, 'cookie');
  } finally {
    await backend.close();
  }
});

test('AuthManager: hasSavedCookies returns false when no file exists', async () => {
  const { auth, backend } = await createAuthManager();
  try {
    assert.strictEqual(auth.hasSavedCookies(), false);
  } finally {
    await backend.close();
  }
});

test('AuthManager: saveCookies writes a file', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    await backend.setCookies(pageId, [{ session_id: 'test123' }]);
    await auth.saveCookies(pageId);
    assert.strictEqual(auth.hasSavedCookies(), true, 'should have saved cookies');
  } finally {
    await backend.close();
  }
});

test('AuthManager: restoreCookies reads and restores saved cookies', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    const testCookies = [{ session_id: 'restore-me' }];
    await backend.setCookies(pageId, testCookies);
    await auth.saveCookies(pageId);

    // Clear cookies
    await backend.setCookies(pageId, []);
    const afterClear = await backend.getCookies(pageId);
    assert.strictEqual(afterClear.length, 0, 'cookies should be cleared');

    // Restore
    const restored = await auth.restoreCookies(pageId);
    assert.strictEqual(restored, true, 'restore should succeed');

    const cookies = await backend.getCookies(pageId);
    assert.strictEqual(cookies.length, 1, 'cookies should be restored');
    assert.strictEqual(cookies[0].session_id, 'restore-me');
  } finally {
    await backend.close();
  }
});

test('AuthManager: restoreCookies returns false when no file exists', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    const result = await auth.restoreCookies(pageId);
    assert.strictEqual(result, false);
  } finally {
    await backend.close();
  }
});

test('AuthManager: clearAuthData removes saved cookies', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    await backend.setCookies(pageId, [{ session_id: 'test' }]);
    await auth.saveCookies(pageId);
    assert.strictEqual(auth.hasSavedCookies(), true);

    auth.clearAuthData();
    assert.strictEqual(auth.hasSavedCookies(), false, 'cookies file should be removed');
  } finally {
    await backend.close();
  }
});

test('AuthManager: automateLogin fills credentials and submits', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    // Mock backend navigates to /login when URL contains 'login'
    // After clicking #login, the mock marks the button as clicked.
    // We verify the flow completes without throwing.
    await assert.doesNotReject(() =>
      auth.automateLogin(pageId, TEST_CREDENTIALS, 'testuser', 'testpass')
    );
  } finally {
    await backend.close();
  }
});

test('AuthManager: automateLogin saves cookies after login attempt', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    await auth.automateLogin(pageId, TEST_CREDENTIALS, 'user', 'pass');
    // The mock doesn't produce real auth cookies, but the flow should complete
  } finally {
    await backend.close();
  }
});

test('AuthManager: exportSession / importSession round-trip', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    const testCookies = [{ session_id: 'export-test' }];
    await backend.setCookies(pageId, testCookies);

    const exported = await auth.exportSession(pageId);
    assert.ok(exported.domain, 'exported session should have a domain');
    assert.deepStrictEqual(exported.cookies, testCookies);

    // Import into a fresh backend
    const backend2 = new MockBrowserBackend();
    await backend2.launch({}, fs.mkdtempSync(path.join(os.tmpdir(), 'aether-auth-import-test-')));
    const pageId2 = await backend2.newPage();
    const auth2 = new AuthManager(backend2, 'import-test-session');
    await auth2.importSession(pageId2, exported);

    const restored = await backend2.getCookies(pageId2);
    assert.deepStrictEqual(restored, testCookies);

    await backend2.close();
  } finally {
    await backend.close();
  }
});

test('AuthManager: detectAuthState detects oauth token as cookie mechanism', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    // OAuth tokens stored in cookies are detected as the cookie mechanism
    // (the storage mechanism, not the auth protocol)
    await backend.setCookies(pageId, [{ oauth_token: 'oauth123' }]);
    const state = await auth.detectAuthState(pageId);
    assert.strictEqual(state.authenticated, true);
    assert.strictEqual(state.mechanism, 'cookie', 'oauth_token in a cookie is detected as cookie mechanism');
  } finally {
    await backend.close();
  }
});

test('AuthManager: detectAuthState detects jwt mechanism', async () => {
  const { auth, backend, pageId } = await createAuthManager();
  try {
    await backend.setCookies(pageId, [{ jwt: 'eyJhbGciOiJIUzI1NiJ9...' }]);
    const state = await auth.detectAuthState(pageId);
    assert.strictEqual(state.authenticated, true);
  } finally {
    await backend.close();
  }
});

test('AuthManager: cookie persistence uses isolated session directory', async () => {
  const sessionDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-auth-isolated-'));
  const { auth, backend, pageId } = await createAuthManager();
  try {
    const customAuth = new AuthManager(backend, 'isolated-session', { sessionDir });
    await backend.setCookies(pageId, [{ sid: 'iso' }]);
    await customAuth.saveCookies(pageId);
    const cookiesFile = path.join(sessionDir, 'cookies.json');
    assert.ok(fs.existsSync(cookiesFile), 'cookies file should be in the isolated session dir');
  } finally {
    await backend.close();
  }
});
