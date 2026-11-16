/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Harness Installer — tests that each target produces clean, target-native
 * files and that the MCP wiring + owned-files manifest are present.
 * Run via: npx tsx --test src/core/harnessInstaller.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { buildHarnessInstall, writeInstall } from './harnessInstaller';

describe('buildHarnessInstall', () => {
  it('codex target writes AGENTS.md + .codex/agents + config + .mcp.json', () => {
    const res = buildHarnessInstall({ target: 'codex', includeMcp: true, projectName: 'demo' });
    const paths = res.files.map(f => f.path);
    assert.ok(paths.includes('AGENTS.md'));
    assert.ok(paths.includes('.codex/config.toml'));
    assert.ok(paths.includes('.codex/agents/explorer.toml'));
    assert.ok(paths.includes('.codex/agents/planner.toml'));
    assert.ok(paths.includes('.codex/agents/reviewer.toml'));
    assert.ok(paths.includes('.mcp.json'));
    // ownedFiles mirrors files
    assert.deepEqual(res.ownedFiles.sort(), [...res.files.map(f => f.path)].sort());
  });

  it('claude-code target writes a core agent roster + AGENTS.md', () => {
    const res = buildHarnessInstall({ target: 'claude-code', includeMcp: true });
    const agentFiles = res.files.filter(f => f.path.startsWith('.claude/agents/'));
    assert.ok(agentFiles.length >= 8, `expected >= 8 agent files, got ${agentFiles.length}`);
    assert.ok(res.files.some(f => f.path === 'AGENTS.md'));
    assert.ok(res.files.some(f => f.path === '.mcp.json'));
  });

  it('cursor target writes .cursor/rules + .cursor/mcp.json (no root .mcp.json)', () => {
    const res = buildHarnessInstall({ target: 'cursor', includeMcp: true });
    assert.ok(res.files.some(f => f.path === '.cursor/rules/aether.mdc'));
    assert.ok(res.files.some(f => f.path === '.cursor/mcp.json'));
    assert.ok(!res.files.some(f => f.path === '.mcp.json'), 'cursor should not write root .mcp.json');
  });

  it('omits all MCP files when includeMcp=false', () => {
    for (const target of ['codex', 'kimi', 'opencode'] as const) {
      const res = buildHarnessInstall({ target, includeMcp: false });
      assert.ok(
        !res.files.some(f => f.path.endsWith('mcp.json')),
        `${target} should have no mcp.json when includeMcp=false`
      );
    }
  });

  it('all-harnesses writes files for every target, deduplicated .mcp.json', () => {
    const res = buildHarnessInstall({ target: 'all-harnesses', includeMcp: true });
    assert.ok(res.files.some(f => f.path === '.codex/config.toml'));
    assert.ok(res.files.some(f => f.path === '.cursor/rules/aether.mdc'));
    assert.ok(res.files.some(f => f.path === '.kimi/README.md'));
    const mcpCount = res.files.filter(f => f.path === '.mcp.json').length;
    assert.equal(mcpCount, 1, 'root .mcp.json must appear exactly once');
  });

  it('MCP wiring is valid JSON pointing at the 8-tool AETHER server', () => {
    const res = buildHarnessInstall({ target: 'codex', includeMcp: true });
    const mcp = res.files.find(f => f.path === '.mcp.json')!;
    const parsed = JSON.parse(mcp.content);
    assert.ok(parsed.mcpServers.aether.command);
    assert.ok(JSON.stringify(parsed.mcpServers.aether.args).includes('aether-mcp-server'));
  });
});

describe('writeInstall', () => {
  it('writes all files + an owned-files manifest into a temp dir', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-harness-'));
    try {
      const res = buildHarnessInstall({ target: 'codex', includeMcp: true, projectName: 'tmp-demo' });
      const written = writeInstall(tmp, res);
      for (const f of res.files) {
        assert.ok(fs.existsSync(path.join(tmp, f.path)), `missing ${f.path}`);
      }
      const manifest = JSON.parse(fs.readFileSync(path.join(tmp, '.aether', 'owned-files.json'), 'utf8'));
      assert.ok(manifest.ownedFiles.includes('AGENTS.md'));
      assert.ok(Array.isArray(written) && written.length > 0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
