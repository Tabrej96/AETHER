/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 06: SECURITY CONTROLS (executable, not just scanners)
 * (src/core/security/securityControls.ts)
 *
 * Static pattern scanning is SUPPLEMENTAL. This module implements the real
 * boundaries the threat model requires:
 *   - spotlighting of untrusted content (repo files, web pages, MCP payloads),
 *   - a local-tool-manifest guard for MCP (no untrusted tool may register),
 *   - an egress policy (which hosts a shell command may touch),
 *   - an integrity-chained audit log (every gate decision is recorded with a
 *     SHA-256 hash chain so tampering is detectable).
 */

import fs from 'node:fs';
import path from 'node:path';
import { sha256Hex } from '../crypto/sha256';
import {
  scanSecurityAndTrustBoundaries,
  SecurityScanReport,
} from '../securityEngine';

// -----------------------------------------------------------------------------
// 1. Untrusted-content spotlighting
// -----------------------------------------------------------------------------
export interface SpotlightResult {
  report: SecurityScanReport;
  /**
   * The untrusted content with every detected injection directive quarantined
   * inline (via the engine's redaction) so it can never reach a model as live
   * instructions. This is the text that MUST be handed to a model — never
   * the raw untrusted string.
   */
  quarantined: string;
  threatCount: number;
}

/** Scan untrusted text (repo file, web page, MCP tool description) and quarantine threats. */
export function spotlightUntrustedContent(untrusted: string, spdx?: string): SpotlightResult {
  const report = scanSecurityAndTrustBoundaries({
    untrustedContent: untrusted,
    proposedCommand: '',
    agentRole: 'READ_ONLY_REVIEWER',
    requestedTool: 'READ_FILE',
    spdxLicense: spdx,
  });
  return {
    report,
    // The engine already redacts injection directives inline — hand that
    // redacted text (wrapped in an untrusted-data spotlight tag), not the raw
    // string, to any downstream consumer.
    quarantined: report.spotlightedPromptPreview,
    threatCount: report.threats.length,
  };
}

// -----------------------------------------------------------------------------
// 2. MCP tool manifest guard (untrusted tool registration is impossible)
// -----------------------------------------------------------------------------
export interface McpGuardOptions {
  /** the authoritative local tool names (from AETHER_MCP_TOOLS) */
  trustedToolNames: string[];
}

export function assertTrustedMcpTool(toolName: string, opts: McpGuardOptions): { allowed: boolean; reason: string } {
  if (opts.trustedToolNames.includes(toolName)) return { allowed: true, reason: 'tool is in the local manifest' };
  return { allowed: false, reason: `tool "${toolName}" is not in the trusted local manifest; untrusted tool registration is rejected` };
}

// -----------------------------------------------------------------------------
// 3. Network egress policy for shell commands
// -----------------------------------------------------------------------------
export interface EgressDecision {
  allowed: boolean;
  reason: string;
}

/**
 * Decide whether a shell command may run, given an operator egress allowlist
 * of hosts. A command that is only allowed when it cannot reach the network
 * (e.g. offline builds) is rejected if it references any non-allowlisted host.
 */
export function extractCommandHosts(command: string): string[] {
  const found = new Set<string>();
  // 1) URL tokens anywhere in the command: scheme://host[/path] -> host
  for (const m of command.matchAll(/[a-z][a-z0-9+.-]*:\/\/([a-z0-9.-]+)/gi)) {
    found.add(m[1].toLowerCase());
  }
  // 2) Bare domain tokens (not a path, not a flag, not an option assignment)
  for (const t of command.split(/\s+/)) {
    if (t.includes('//')) continue; // URL, handled above
    const bare = t.replace(/^['"=]|[';,]$/g, '');
    if (bare.includes('.') && !bare.startsWith('-') && !bare.startsWith('/') && !bare.includes('/')) {
      // host-like: label(.label)* with a TLD of 2+ alpha, excluding obvious
      // file extensions so "node server.js" is not mistaken for a host.
      const KNOWN_FILE_EXT =
        /^(?:js|jsx|ts|tsx|mjs|cjs|py|sh|bash|rb|go|rs|java|json|md|sql|yml|yaml|toml|txt|lock|zip|png|jpg|jpeg|svg|gif|html|css|wasm|ini|cfg|conf|log|map|node|tsbuildinfo)$/i;
      const ext = bare.split('.').pop()!.toLowerCase();
      if (
        /^[a-z0-9]+(?:\.[a-z0-9]+)*\.[a-z]{2,}$/i.test(bare) &&
        !/^\d+\.\d+\.\d+\.\d+$/.test(bare) &&
        !KNOWN_FILE_EXT.test(ext)
      ) {
        found.add(bare.toLowerCase());
      }
    }
  }
  return [...found];
}

export function checkEgressPolicy(command: string, allowedHosts: string[]): EgressDecision {
  const hosts = extractCommandHosts(command);
  for (const bare of hosts) {
    if (bare === 'localhost' || bare.startsWith('127.0.0.')) continue;
    const ok = allowedHosts.some((h) => bare === h || bare.endsWith('.' + h));
    if (!ok) {
      return { allowed: false, reason: `command references host "${bare}" which is not in the egress allowlist [${allowedHosts.join(', ')}]` };
    }
  }
  return { allowed: true, reason: hosts.length > 0 ? `all ${hosts.length} host reference(s) allowlisted` : 'no external host referenced' };
}

// -----------------------------------------------------------------------------
// 4. Integrity-chained audit log (append-only, tamper-evident)
// -----------------------------------------------------------------------------
export interface AuditEntry {
  seq: number;
  atIso: string;
  actor: string;
  action: string;
  target: string;
  verdict: 'ALLOWED' | 'DENIED' | 'RECORDED';
  detail?: string;
  /** SHA-256 over (prev.hash || entry body) — forms an integrity chain. */
  hash: string;
}

export class AuditLog {
  private readonly file: string;
  private lastHash = '';

  constructor(dir: string, private readonly actor = 'aether-security') {
    this.file = path.join(dir, 'security-audit.jsonl');
  }

  record(action: string, target: string, verdict: AuditEntry['verdict'], detail?: string): AuditEntry {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    let seq = 0;
    let prev = this.lastHash;
    if (fs.existsSync(this.file)) {
      const lines = fs.readFileSync(this.file, 'utf8').split('\n').filter((l) => l.trim());
      if (lines.length > 0) {
        const last = JSON.parse(lines[lines.length - 1]) as AuditEntry;
        seq = last.seq + 1;
        prev = last.hash;
      }
    }
    const base = { seq, atIso: new Date().toISOString(), actor: this.actor, action, target, verdict, detail };
    const hash = sha256Hex(sha256Hex(prev) + sha256Hex(JSON.stringify(base)));
    this.lastHash = hash;
    const entry = { ...base, hash };
    fs.appendFileSync(this.file, JSON.stringify(entry) + '\n');
    return entry;
  }

  /** Verify the hash chain is intact. A tampered entry breaks the chain. */
  verifyIntegrity(): { ok: boolean; entries: number; brokenAtSeq: number | null } {
    if (!fs.existsSync(this.file)) return { ok: true, entries: 0, brokenAtSeq: null };
    const lines = fs.readFileSync(this.file, 'utf8').split('\n').filter((l) => l.trim());
    let prev = '';
    for (let i = 0; i < lines.length; i++) {
      const e = JSON.parse(lines[i]) as AuditEntry & { hash: string };
      const recompute = sha256Hex(sha256Hex(prev) + sha256Hex(JSON.stringify({ seq: e.seq, atIso: e.atIso, actor: e.actor, action: e.action, target: e.target, verdict: e.verdict, detail: e.detail })));
      if (recompute !== e.hash) return { ok: false, entries: lines.length, brokenAtSeq: e.seq };
      prev = e.hash;
    }
    return { ok: true, entries: lines.length, brokenAtSeq: null };
  }
}
