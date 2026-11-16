/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AgentRegistry — regression tests.
 *
 * Guards against the two historical bugs this class had:
 *   1. `extractCapabilities` called `String.matchAll` with a non-global
 *      regex, which threw a TypeError and crashed registry construction.
 *   2. ECC agents were loaded from a dead `.ecc-scout` git submodule instead
 *      of the vendored `.claude/agents/ecc/` directory, so `ecc/…` ids in
 *      the deployment plan never resolved.
 * Run via: npx tsx --test src/core/agentRegistry.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { AgentRegistry } from './agentRegistry';

// Resolve the repo root regardless of where the test is launched from.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('AgentRegistry', () => {
  it('constructs without throwing (no matchAll-on-non-global crash)', () => {
    assert.doesNotThrow(() => new AgentRegistry(REPO_ROOT));
  });

  it('loads the vendored ECC agents under ecc/… ids', () => {
    const reg = new AgentRegistry(REPO_ROOT);
    const stats = reg.getStats();
    assert.ok(stats.ecc >= 50, `expected >= 50 vendored ECC agents, got ${stats.ecc}`);
    const sample = reg.getAgent('ecc/code-reviewer');
    assert.ok(sample, 'ecc/code-reviewer should be registered');
  });

  it('loads native AETHER agents', () => {
    const reg = new AgentRegistry(REPO_ROOT);
    assert.ok(reg.getAgent('backend-engineer'), 'backend-engineer should be registered');
    assert.ok(reg.getAgent('database-architect'), 'database-architect should be registered');
  });

  it('resolves every deployment-plan agent reference', () => {
    const reg = new AgentRegistry(REPO_ROOT);
    const plan = reg.generateDeploymentPlan(['P1', 'P2', 'P3', 'P9', 'P10', 'P11']);
    const unresolved = plan.filter(p => !reg.getAgent(p.agentId) && p.agentId !== 'general-engineer');
    // Known agent refs (P9/P10/P12) use ecc/… ids that must now resolve.
    const eccRefs = plan.filter(p => p.agentId.startsWith('ecc/'));
    const unresolvedEcc = eccRefs.filter(p => !reg.getAgent(p.agentId));
    assert.deepEqual(unresolvedEcc, [], `unresolved ecc agent refs: ${unresolvedEcc.map(p => p.agentId).join(', ')}`);
    assert.ok(unresolved.length === 0 || unresolved.every(p => p.agentId === 'general-engineer'));
  });
});
