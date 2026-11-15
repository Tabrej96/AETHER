/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Extension Registry Tests
 * (src/core/workspace/extensionRegistry.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ExtensionRegistry,
  satisfiesVersion,
  parseVersion,
  compareVersion,
} from './extensionRegistry';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeManifest(overrides: {
  pluginId?: string;
  version?: string;
  capabilities?: string[];
  dependencies?: Record<string, string>;
} = {}): PluginManifest {
  const id = overrides.pluginId ?? `plugin_${Math.random().toString(36).slice(2, 8)}`;
  return {
    pluginId: id,
    name: 'Test Plugin',
    description: 'A test plugin',
    version: overrides.version ?? '1.0.0',
    license: 'MIT',
    author: 'Test',
    requiredPermissions: [],
    dependencies: overrides.dependencies ?? {},
    capabilities: overrides.capabilities ?? ['capability-a'],
    tags: ['test'],
    entryPoint: 'index.js',
  } as never;
}

// ─── Registration ────────────────────────────────────────────────────────────

test('registers and retrieves a plugin', () => {
  const registry = new ExtensionRegistry();
  const plugin = registry.register(makeManifest({ pluginId: 'plugin-1' }));

  assert.strictEqual(plugin.pluginId, 'plugin-1');
  assert.strictEqual(plugin.enabled, true);
  assert.strictEqual(plugin.healthStatus, 'healthy');

  const retrieved = registry.get('plugin-1');
  assert.strictEqual(retrieved?.pluginId, 'plugin-1');
});

test('replaces plugin on re-registration', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'p', version: '1.0.0' }));
  registry.register(makeManifest({ pluginId: 'p', version: '2.0.0' }));

  const retrieved = registry.get('p');
  assert.strictEqual(retrieved!.version, '2.0.0');
});

test('unregister removes a plugin', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'p-1' }));
  const result = registry.unregister('p-1');
  assert.strictEqual(result, true);
  assert.strictEqual(registry.get('p-1'), undefined);
});

test('unregister returns false for missing plugin', () => {
  const registry = new ExtensionRegistry();
  assert.strictEqual(registry.unregister('nonexistent'), false);
});

test('list returns all plugins', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'a' }));
  registry.register(makeManifest({ pluginId: 'b' }));

  const all = registry.list();
  assert.strictEqual(all.length, 2);
});

test('listEnabled returns only enabled plugins', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'a' }));
  const pluginB = registry.register(makeManifest({ pluginId: 'b' }));
  registry.setEnabled('b', false);

  const enabled = registry.listEnabled();
  assert.strictEqual(enabled.length, 1);
  assert.strictEqual(enabled[0].pluginId, 'a');
});

// ─── Discovery ───────────────────────────────────────────────────────────────

test('findByCapability finds plugins', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'a', capabilities: ['search'] }));
  registry.register(makeManifest({ pluginId: 'b', capabilities: ['search'] }));
  registry.register(makeManifest({ pluginId: 'c', capabilities: ['render'] }));

  const found = registry.findByCapability('search');
  assert.strictEqual(found.length, 2);
});

test('findByTag finds plugins', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'a' }));
  registry.register(makeManifest({ pluginId: 'b' }));

  // Manually tag by re-registering with different tags
  // (the test manifest uses ['test'] as default tag)
  const found = registry.findByTag('test');
  assert.strictEqual(found.length, 2);
});

test('findByPermission finds plugins with permission', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'a' }));
  registry.register({
    ...makeManifest({ pluginId: 'b' }),
    requiredPermissions: ['fs:read', 'net:egress'],
  });

  const found = registry.findByPermission('fs:read');
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].pluginId, 'b');
});

test('search by text ranks name matches highest', () => {
  const registry = new ExtensionRegistry();
  registry.register({ ...makeManifest({ pluginId: 'search-1' }), name: 'JSON Parser' });
  registry.register({ ...makeManifest({ pluginId: 'search-2' }), name: 'Image Resizer' });

  const found = registry.search({ text: 'json' });
  assert.ok(found.length > 0);
  assert.strictEqual(found[0].plugin.pluginId, 'search-1');
});

test('search by tags filters plugins', () => {
  const registry = new ExtensionRegistry();
  registry.register({ ...makeManifest({ pluginId: 'a' }), tags: ['productivity'] });
  registry.register({ ...makeManifest({ pluginId: 'b' }), tags: ['fun'] });

  const found = registry.search({ tags: ['productivity'] });
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].plugin.pluginId, 'a');
});

test('search by capabilities filters plugins', () => {
  const registry = new ExtensionRegistry();
  registry.register({ ...makeManifest({ pluginId: 'a' }), capabilities: ['render'] });
  registry.register({ ...makeManifest({ pluginId: 'b' }), capabilities: ['parse'] });

  const found = registry.search({ capabilities: ['parse'] });
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].plugin.pluginId, 'b');
});

test('search by license filters plugins', () => {
  const registry = new ExtensionRegistry();
  registry.register({ ...makeManifest({ pluginId: 'a' }), license: 'MIT' });
  registry.register({ ...makeManifest({ pluginId: 'b' }), license: 'AGPL-3.0' });

  const found = registry.search({ license: 'permissive' });
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].plugin.pluginId, 'a');
});

test('search returns empty for no matches', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'a' }));
  const found = registry.search({ text: 'nonexistent' });
  assert.strictEqual(found.length, 0);
});

// ─── Version management ──────────────────────────────────────────────────────

test('checkVersionCompatibility accepts compatible versions', () => {
  const registry = new ExtensionRegistry();
  registry.register({
    ...makeManifest({ pluginId: 'p' }),
    minAetherVersion: '1.0.0',
    maxAetherVersion: '2.0.0',
  });

  assert.strictEqual(registry.checkVersionCompatibility('p', '1.5.0'), true);
});

test('checkVersionCompatibility rejects too old aether version', () => {
  const registry = new ExtensionRegistry();
  registry.register({
    ...makeManifest({ pluginId: 'p' }),
    minAetherVersion: '2.0.0',
  });

  assert.strictEqual(registry.checkVersionCompatibility('p', '1.0.0'), false);
});

test('checkVersionCompatibility rejects too new aether version', () => {
  const registry = new ExtensionRegistry();
  registry.register({
    ...makeManifest({ pluginId: 'p' }),
    maxAetherVersion: '2.0.0',
  });

  assert.strictEqual(registry.checkVersionCompatibility('p', '3.0.0'), false);
});

test('resolveVersions detects conflicts', () => {
  const registry = new ExtensionRegistry();
  registry.register({
    ...makeManifest({ pluginId: 'app' }),
    dependencies: { lib: '^2.0.0' },
  });
  registry.register({
    ...makeManifest({ pluginId: 'lib' }),
    dependencies: {},
  });

  // Manually add a conflicting dep
  registry.register({
    ...makeManifest({ pluginId: 'plugin-b' }),
    dependencies: { lib: '^1.0.0' },
  });

  const conflicts = registry.resolveVersions(['app', 'plugin-b']);
  assert.ok(conflicts.length > 0, 'has conflicts');
});

// ─── Dependency resolution ───────────────────────────────────────────────────

test('buildDependencyGraph builds correct graph', () => {
  const registry = new ExtensionRegistry();
  registry.register({ ...makeManifest({ pluginId: 'root' }), dependencies: {} });
  registry.register({ ...makeManifest({ pluginId: 'app' }), dependencies: { root: '^1.0.0' } });

  const graph = registry.buildDependencyGraph(['app']);
  assert.ok(graph.nodes.includes('app'), 'includes app');
  assert.ok(graph.nodes.includes('root'), 'includes root');
  // Edge: depName (root) -> id (app), meaning root must be installed before app
  assert.ok(graph.edges.some((e) => e.from === 'root' && e.to === 'app'), 'has edge root->app');
});

test('buildDependencyGraph detects cycles', () => {
  const registry = new ExtensionRegistry();
  registry.register({ ...makeManifest({ pluginId: 'a' }), dependencies: { b: '*' } });
  registry.register({ ...makeManifest({ pluginId: 'b' }), dependencies: { a: '*' } });

  const graph = registry.buildDependencyGraph(['a']);
  assert.ok(graph.cycles.length > 0, 'detects cycle');
});

test('buildDependencyGraph produces valid install order (acyclic)', () => {
  const registry = new ExtensionRegistry();
  registry.register({ ...makeManifest({ pluginId: 'lib' }), dependencies: {} });
  registry.register({ ...makeManifest({ pluginId: 'mid' }), dependencies: { lib: '*' } });
  registry.register({ ...makeManifest({ pluginId: 'app' }), dependencies: { mid: '*' } });

  const graph = registry.buildDependencyGraph(['app']);
  assert.ok(graph.installOrder.length > 0, 'has install order');
  const libIdx = graph.installOrder.indexOf('lib');
  const midIdx = graph.installOrder.indexOf('mid');
  const appIdx = graph.installOrder.indexOf('app');
  assert.ok(libIdx < midIdx, 'lib before mid');
  assert.ok(midIdx < appIdx, 'mid before app');
});

// ─── Usage tracking ──────────────────────────────────────────────────────────

test('recordUsage increments count', () => {
  const registry = new ExtensionRegistry();
  const plugin = registry.register(makeManifest({ pluginId: 'p' }));
  registry.recordUsage('p');
  registry.recordUsage('p');

  const updated = registry.get('p');
  assert.strictEqual(updated!.usageCount, 2);
});

test('setEnabled toggles enabled state', () => {
  const registry = new ExtensionRegistry();
  registry.register(makeManifest({ pluginId: 'p' }));
  registry.setEnabled('p', false);

  const plugin = registry.get('p');
  assert.strictEqual(plugin!.enabled, false);

  registry.setEnabled('p', true);
  assert.strictEqual(registry.get('p')!.enabled, true);
});

// ─── SemVer helpers ──────────────────────────────────────────────────────────

test('parseVersion parses version strings', () => {
  assert.deepStrictEqual(parseVersion('1.2.3'), [1, 2, 3]);
  assert.deepStrictEqual(parseVersion('v2.0.0'), [2, 0, 0]);
  assert.deepStrictEqual(parseVersion('1.0'), [1, 0, 0]);
});

test('compareVersion compares correctly', () => {
  assert.ok(compareVersion('1.0.0', '2.0.0') < 0);
  assert.ok(compareVersion('2.0.0', '1.0.0') > 0);
  assert.strictEqual(compareVersion('1.0.0', '1.0.0'), 0);
});

test('satisfiesVersion handles exact match', () => {
  assert.strictEqual(satisfiesVersion('1.2.3', '1.2.3'), true);
  assert.strictEqual(satisfiesVersion('1.2.3', '1.2.4'), false);
});

test('satisfiesVersion handles range operators', () => {
  assert.strictEqual(satisfiesVersion('1.5.0', '>=1.0.0'), true);
  assert.strictEqual(satisfiesVersion('0.9.0', '>=1.0.0'), false);
  assert.strictEqual(satisfiesVersion('1.5.0', '>1.0.0'), true);
  assert.strictEqual(satisfiesVersion('1.0.0', '>1.0.0'), false);
  assert.strictEqual(satisfiesVersion('1.2.3', '<=2.0.0'), true);
  assert.strictEqual(satisfiesVersion('2.0.0', '<2.0.0'), false);
});

test('satisfiesVersion handles caret range', () => {
  assert.strictEqual(satisfiesVersion('1.5.0', '^1.0.0'), true);
  assert.strictEqual(satisfiesVersion('1.9.9', '^1.0.0'), true);
  assert.strictEqual(satisfiesVersion('2.0.0', '^1.0.0'), false);
});

test('satisfiesVersion handles tilde range', () => {
  assert.strictEqual(satisfiesVersion('1.2.5', '~1.2.3'), true);
  assert.strictEqual(satisfiesVersion('1.2.3', '~1.2.3'), true);
  assert.strictEqual(satisfiesVersion('1.3.0', '~1.2.3'), false);
});

test('satisfiesVersion handles wildcard', () => {
  assert.strictEqual(satisfiesVersion('any', '*'), true);
  assert.strictEqual(satisfiesVersion('any', 'latest'), true);
});
