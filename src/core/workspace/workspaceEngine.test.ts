/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Workspace Engine Tests
 * (src/core/workspace/workspaceEngine.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WorkspaceEngine,
  type WorkspaceConfig,
  PROJECT_TEMPLATES,
} from './workspaceEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEngine() {
  return new WorkspaceEngine({});
}

function makeConfig(overrides: Partial<WorkspaceConfig> = {}): WorkspaceConfig {
  return {
    name: 'Test Workspace',
    domain: 'general',
    ...overrides,
  };
}

// ─── Workspace creation ──────────────────────────────────────────────────────

test('creates a workspace with default settings', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig());

  assert.ok(ws.id.startsWith('ws_'), 'workspace id has correct prefix');
  assert.strictEqual(ws.name, 'Test Workspace');
  assert.strictEqual(ws.domain, 'general');
  assert.ok(ws.folders.length > 0, 'has folders');
  assert.ok(ws.sessionId.length > 0, 'has session id');
});

test('creates workspace with specific domain template', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig({ domain: 'ecommerce' }));

  assert.ok(ws.folders.includes('products'), 'ecommerce has products folder');
  assert.ok(ws.folders.includes('orders'), 'ecommerce has orders folder');
});

test('creates workspace with custom context', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig({ context: { key: 'value' } }));

  assert.strictEqual(ws.context.key, 'value');
});

test('get returns the created workspace', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig());
  const retrieved = engine.get(ws.id);

  assert.strictEqual(retrieved?.id, ws.id);
  assert.strictEqual(retrieved?.name, ws.name);
});

test('get returns undefined for unknown id', () => {
  const engine = makeEngine();
  assert.strictEqual(engine.get('nonexistent'), undefined);
});

// ─── Workspace listing ───────────────────────────────────────────────────────

test('list returns all created workspaces', () => {
  const engine = makeEngine();
  engine.create(makeConfig({ name: 'W1' }));
  engine.create(makeConfig({ name: 'W2' }));

  const all = engine.list();
  assert.strictEqual(all.length, 2);
});

test('list returns empty array initially', () => {
  const engine = makeEngine();
  assert.deepStrictEqual(engine.list(), []);
});

// ─── Workspace update ────────────────────────────────────────────────────────

test('update modifies workspace name', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig());
  const updated = engine.update(ws.id, { name: 'New Name' });

  assert.strictEqual(updated?.name, 'New Name');
  assert.strictEqual(updated?.updatedAt, updated?.updatedAt, 'updatedAt is a valid timestamp');
});

test('update modifies workspace context', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig({ context: { a: 1 } }));
  const updated = engine.update(ws.id, { context: { a: 1, b: 2 } });

  assert.strictEqual(updated?.context.b, 2);
});

test('update returns undefined for nonexistent id', () => {
  const engine = makeEngine();
  assert.strictEqual(engine.update('nonexistent', { name: 'x' }), undefined);
});

// ─── Workspace deletion ──────────────────────────────────────────────────────

test('delete removes a workspace', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig());
  const result = engine.delete(ws.id);

  assert.strictEqual(result, true);
  assert.strictEqual(engine.get(ws.id), undefined);
});

test('delete returns false for nonexistent id', () => {
  const engine = makeEngine();
  assert.strictEqual(engine.delete('nonexistent'), false);
});

// ─── Template discovery ──────────────────────────────────────────────────────

test('listTemplates returns all templates', () => {
  const engine = makeEngine();
  const templates = engine.listTemplates();

  assert.ok(templates.length > 0, 'has templates');
  const names = templates.map((t) => t.name);
  assert.ok(names.includes('ecommerce'), 'includes ecommerce');
  assert.ok(names.includes('ai-assistant'), 'includes ai-assistant');
});

test('getTemplate returns specific template', () => {
  const engine = makeEngine();
  const template = engine.getTemplate('saas');

  assert.strictEqual(template.domain, 'saas');
  assert.ok(template.folders.includes('features'), 'has features folder');
});

test('getTemplate returns default for unknown domain', () => {
  const engine = makeEngine();
  const template = engine.getTemplate('nonexistent');

  assert.strictEqual(template.domain, 'general');
});

// ─── Context preservation ────────────────────────────────────────────────────

test('captureContext returns context snapshot', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig());
  const ctx = engine.captureContext(ws.id);

  assert.ok(ctx !== undefined, 'context captured');
  assert.strictEqual(ctx!.workspaceId, ws.id);
  assert.strictEqual(ctx!.sessionId, ws.sessionId);
  assert.ok(ctx!.preservedAt.length > 0, 'has timestamp');
});

test('captureContext returns undefined for unknown id', () => {
  const engine = makeEngine();
  assert.strictEqual(engine.captureContext('nonexistent'), undefined);
});

test('restoreContext returns context snapshot', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig());
  const ctx = engine.restoreContext(ws.id);

  assert.ok(ctx !== undefined, 'context restored');
  assert.strictEqual(ctx!.workspaceId, ws.id);
});

// ─── Session continuity ──────────────────────────────────────────────────────

test('getSessionId returns the session id', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig());
  const sessionId = engine.getSessionId(ws.id);

  assert.strictEqual(sessionId, ws.sessionId);
});

test('getSessionId returns undefined for unknown id', () => {
  const engine = makeEngine();
  assert.strictEqual(engine.getSessionId('nonexistent'), undefined);
});

// ─── File scaffolding ────────────────────────────────────────────────────────

test('scaffoldFiles returns template files for workspace', () => {
  const engine = makeEngine();
  const ws = engine.create(makeConfig({ domain: 'developer_tools' }));
  const files = engine.scaffoldFiles(ws.id);

  assert.ok(files !== undefined, 'files scaffolded');
  assert.ok(files!.length > 0, 'has files');
  assert.ok(files!.some((f) => f.path.includes('README')), 'includes README');
});

test('scaffoldFiles returns undefined for unknown id', () => {
  const engine = makeEngine();
  assert.strictEqual(engine.scaffoldFiles('nonexistent'), undefined);
});

// ─── Project templates structure ─────────────────────────────────────────────

test('all templates have required fields', () => {
  for (const [key, template] of Object.entries(PROJECT_TEMPLATES)) {
    assert.ok(template.name.length > 0, `${key} has name`);
    assert.ok(template.domain.length > 0, `${key} has domain`);
    assert.ok(Array.isArray(template.folders), `${key} has folders`);
    assert.ok(template.folders.length > 0, `${key} has at least one folder`);
    assert.ok(Array.isArray(template.files), `${key} has files`);
    assert.ok(Array.isArray(template.conventions), `${key} has conventions`);
  }
});

test('default template has standard folders', () => {
  const template = PROJECT_TEMPLATES.general;
  assert.ok(template.folders.includes('notes') || template.folders.includes('src'), 'has standard folder');
});

// ─── Integration with Memory (mocked) ────────────────────────────────────────

test('engine stores workspace in memory when memory engine provided', async () => {
  // Mock memory engine
  const storedMemories: unknown[] = [];
  const mockMemory = {
    storeMemory: (_type: string, _key: string, value: unknown) => {
      storedMemories.push(value);
      return { id: 'test' };
    },
    recall: (_query: unknown) => [],
  };

  const engine = new WorkspaceEngine({ memory: mockMemory as never });
  const ws = engine.create(makeConfig());

  assert.strictEqual(storedMemories.length, 1, 'workspace stored in memory');
  const stored = storedMemories[0] as { id: string };
  assert.strictEqual(stored.id, ws.id, 'stored workspace has correct id');
});
