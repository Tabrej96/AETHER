/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Cookie & Auth Management (src/core/browser/authManager.ts)
 *
 * Cookie persistence, session token management, login flow automation,
 * and authentication state detection.
 *
 * SECURITY: Cookies are stored in isolated session directories.
 * Credentials are never logged or persisted in plain text outside the session dir.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { BrowserBackend } from './browserEngine';
import { DomInteractor } from './domInteractor';
import { NavigationManager } from './navigationManager';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CredentialStore {
  /** Encrypted credential blob. */
  encrypted: string;
  /** Salt used for encryption. */
  salt: string;
  /** Algorithm identifier. */
  algorithm: string;
}

export interface AuthState {
  /** Whether the user is authenticated. */
  authenticated: boolean;
  /** Auth mechanism detected. */
  mechanism: 'cookie' | 'localStorage' | 'sessionStorage' | 'oauth' | 'unknown';
  /** Username or identifier if available. */
  username?: string;
  /** Expiry timestamp (ISO-8601) if detectable. */
  expiresAtIso?: string;
  /** Raw auth cookies (names only, not values). */
  authCookieNames: string[];
}

export interface LoginCredentials {
  /** Login URL. */
  url: string;
  /** CSS selector for the username/email field. */
  usernameSelector: string;
  /** CSS selector for the password field. */
  passwordSelector: string;
  /** CSS selector for the submit button. */
  submitSelector: string;
  /** Optional selector for a "remember me" checkbox. */
  rememberMeSelector?: string;
  /** Whether to check "remember me". */
  rememberMe?: boolean;
  /** Post-login URL to verify (optional). */
  postLoginUrlPattern?: string;
}

export interface SavedSession {
  /** Domain these cookies belong to. */
  domain: string;
  /** When the session was saved. */
  savedAtIso: string;
  /** Cookie data. */
  cookies: Record<string, string>[];
  /** Optional encrypted credential reference. */
  credentialRef?: string;
}

// ─── Auth Manager ─────────────────────────────────────────────────────────────

export class AuthManager {
  private readonly backend: BrowserBackend;
  private readonly sessionId: string;
  private readonly sessionDir: string;
  private readonly cookiesFile: string;

  constructor(
    backend: BrowserBackend,
    sessionId: string,
    options: { sessionDir?: string } = {}
  ) {
    this.backend = backend;
    this.sessionId = sessionId;
    this.sessionDir = options.sessionDir ?? path.join(os.tmpdir(), 'aether-auth', sessionId);
    this.cookiesFile = path.join(this.sessionDir, 'cookies.json');
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  /**
   * Save current cookies to disk (encrypted with a session-specific key).
   */
  async saveCookies(pageId: string): Promise<void> {
    const cookies = await this.backend.getCookies(pageId);
    const encrypted = this.encrypt(JSON.stringify(cookies));
    fs.writeFileSync(this.cookiesFile, JSON.stringify({ encrypted, salt: this.getSalt() }), 'utf8');
  }

  /**
   * Load and restore cookies from disk.
   */
  async restoreCookies(pageId: string): Promise<boolean> {
    if (!fs.existsSync(this.cookiesFile)) return false;

    try {
      const data = JSON.parse(fs.readFileSync(this.cookiesFile, 'utf8')) as { encrypted: string; salt: string };
      const decrypted = this.decrypt(data.encrypted, data.salt);
      const cookies = JSON.parse(decrypted) as Record<string, string>[];
      await this.backend.setCookies(pageId, cookies);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if saved cookies exist for this session.
   */
  hasSavedCookies(): boolean {
    return fs.existsSync(this.cookiesFile);
  }

  /**
   * Clear all saved auth data for this session.
   */
  clearAuthData(): void {
    if (fs.existsSync(this.sessionDir)) {
      fs.rmSync(this.sessionDir, { recursive: true, force: true });
    }
  }

  /**
   * Detect the current authentication state.
   */
  async detectAuthState(pageId: string): Promise<AuthState> {
    const cookies = await this.backend.getCookies(pageId);
    const authCookieNames = cookies
      .filter((c) => {
        const name = Object.keys(c)[0]?.toLowerCase() ?? '';
        return ['session', 'sessid', 'auth', 'token', 'jwt', 'access_token', 'id_token', 'logged_in'].some((pattern) =>
          name.includes(pattern)
        );
      })
      .map((c) => Object.keys(c)[0]);

    // Determine mechanism
    let mechanism: AuthState['mechanism'] = 'unknown';
    if (authCookieNames.length > 0) mechanism = 'cookie';
    else if (cookies.some((c) => Object.keys(c)[0]?.toLowerCase().includes('localstorage'))) mechanism = 'localStorage';
    else if (cookies.some((c) => Object.keys(c)[0]?.toLowerCase().includes('session'))) mechanism = 'sessionStorage';
    else if (cookies.some((c) => Object.keys(c)[0]?.toLowerCase().includes('oauth'))) mechanism = 'oauth';

    const authenticated = authCookieNames.length > 0 || mechanism !== 'unknown';

    return {
      authenticated,
      mechanism,
      authCookieNames,
    };
  }

  /**
   * Automate a login flow.
   * SECURITY: credentials are passed as function arguments (never stored in logs).
   */
  async automateLogin(pageId: string, credentials: LoginCredentials, username: string, password: string): Promise<AuthState> {
    // Navigate to login page
    const nav = new NavigationManager(this.backend, this.sessionId, pageId);
    await nav.navigate(credentials.url);

    // Fill in credentials
    const interactor = new DomInteractor(this.backend);
    await interactor.typeText(this.sessionId, pageId, credentials.usernameSelector, username, { clearFirst: true });
    await interactor.typeText(this.sessionId, pageId, credentials.passwordSelector, password, { clearFirst: false });

    if (credentials.rememberMeSelector && credentials.rememberMe) {
      await interactor.checkCheckbox(this.sessionId, pageId, credentials.rememberMeSelector);
    }

    // Submit the form
    await interactor.click(this.sessionId, pageId, credentials.submitSelector);

    // Wait for navigation
    await this.delay(2000);

    // Verify login succeeded
    const authState = await this.detectAuthState(pageId);
    if (!authState.authenticated) {
      throw new Error('Login automation failed: no auth state detected after submission');
    }

    // Save cookies for reuse
    await this.saveCookies(pageId);

    return authState;
  }

  /**
   * Export session data for reuse in a different session.
   */
  async exportSession(pageId: string): Promise<SavedSession> {
    const cookies = await this.backend.getCookies(pageId);
    // Extract domain from the first cookie
    const domain = cookies[0]?.domain ?? 'unknown';
    return {
      domain,
      savedAtIso: new Date().toISOString(),
      cookies,
    };
  }

  /**
   * Import a previously exported session.
   */
  async importSession(pageId: string, session: SavedSession): Promise<void> {
    await this.backend.setCookies(pageId, session.cookies);
    await this.saveCookies(pageId);
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private getSalt(): string {
    return this.sessionId.slice(0, 16);
  }

  private encrypt(plaintext: string): string {
    // SECURITY: This is a session-scoped obfuscation, NOT strong encryption.
    // For real credential storage, use the OS keychain or a secrets manager.
    const key = crypto.scryptSync(this.getSalt(), 'aether-salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([iv, cipher.update(plaintext, 'utf8'), cipher.final()]);
    return encrypted.toString('base64');
  }

  private decrypt(encryptedBase64: string, _salt: string): string {
    const key = crypto.scryptSync(this.getSalt(), 'aether-salt', 32);
    const buf = Buffer.from(encryptedBase64, 'base64');
    const iv = buf.subarray(0, 16);
    const data = buf.subarray(16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
