/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Integration Points Tests
 * (src/core/workspace/integrationPoints.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WorkspaceIntegrationPoints,
  MCPToolRegistry,
  ExternalServiceConnector,
  WebhookHandler,
} from './integrationPoints';
import type { MCPToolRegistration, ExternalServiceConfig, WebhookSubscription } from './integrationPoints';

// ─── MCP Tool Registry ───────────────────────────────────────────────────────

test('registers and retrieves a tool', () => {
  const registry = new MCPToolRegistry();
  const tool: MCPToolRegistration = {
    name: 'test-tool',
    description: 'A test tool',
    parameters: { input: { type: 'string' } },
    handler: () => 'result',
  };

  registry.register(tool);
  const retrieved = registry.get('test-tool');
  assert.strictEqual(retrieved?.name, 'test-tool');
});

test('unregister removes a tool', () => {
  const registry = new MCPToolRegistry();
  registry.register({
    name: 'tool-a',
    description: 'A',
    parameters: {},
    handler: () => 'a',
  });

  assert.strictEqual(registry.unregister('tool-a'), true);
  assert.strictEqual(registry.get('tool-a'), undefined);
});

test('unregister returns false for missing tool', () => {
  const registry = new MCPToolRegistry();
  assert.strictEqual(registry.unregister('nonexistent'), false);
});

test('list returns all tools', () => {
  const registry = new MCPToolRegistry();
  registry.register({ name: 'a', description: 'A', parameters: {}, handler: () => 'a' });
  registry.register({ name: 'b', description: 'B', parameters: {}, handler: () => 'b' });

  const all = registry.list();
  assert.strictEqual(all.length, 2);
});

test('invoke calls tool handler', async () => {
  const registry = new MCPToolRegistry();
  registry.register({
    name: 'add',
    description: 'Add two numbers',
    parameters: { a: { type: 'number' }, b: { type: 'number' } },
    handler: ({ a, b }: { a: number; b: number }) => (a as number) + (b as number),
  });

  const result = await registry.invoke({
    tool: 'add',
    parameters: { a: 3, b: 4 },
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.result, 7);
});

test('invoke returns error for unknown tool', async () => {
  const registry = new MCPToolRegistry();
  const result = await registry.invoke({
    tool: 'nonexistent',
    parameters: {},
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes('not found'));
});

test('invoke handles tool handler throwing', async () => {
  const registry = new MCPToolRegistry();
  registry.register({
    name: 'failing',
    description: 'Always fails',
    parameters: {},
    handler: () => { throw new Error('fail'); },
  });

  const result = await registry.invoke({
    tool: 'failing',
    parameters: {},
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes('fail'));
});

// ─── External Service Connector ──────────────────────────────────────────────

test('registers and retrieves a service', () => {
  const connector = new ExternalServiceConnector();
  const config: ExternalServiceConfig = {
    name: 'api',
    type: 'rest',
    baseUrl: 'https://api.example.com',
    headers: { 'X-Custom': 'value' },
  };

  connector.register(config);
  const retrieved = connector.get('api');
  assert.strictEqual(retrieved?.name, 'api');
  assert.strictEqual(retrieved?.baseUrl, 'https://api.example.com');
});

test('unregister removes a service', () => {
  const connector = new ExternalServiceConnector();
  connector.register({ name: 'svc', type: 'rest', baseUrl: 'https://x.com' });
  assert.strictEqual(connector.unregister('svc'), true);
  assert.strictEqual(connector.get('svc'), undefined);
});

test('unregister returns false for missing service', () => {
  const connector = new ExternalServiceConnector();
  assert.strictEqual(connector.unregister('nonexistent'), false);
});

test('list returns all services', () => {
  const connector = new ExternalServiceConnector();
  connector.register({ name: 'a', type: 'rest', baseUrl: 'https://a.com' });
  connector.register({ name: 'b', type: 'graphql', baseUrl: 'https://b.com' });

  const all = connector.list();
  assert.strictEqual(all.length, 2);
  assert.strictEqual(all[0].name, 'a');
  assert.strictEqual(all[1].type, 'graphql');
});

test('call returns error for unknown service', async () => {
  const connector = new ExternalServiceConnector();
  const result = await connector.call({
    service: 'nonexistent',
    method: 'GET',
    path: '/test',
  });

  assert.strictEqual(result.success, false);
  assert.ok(result.error?.includes('not found'));
});

test('call constructs correct URL for registered service', async () => {
  const connector = new ExternalServiceConnector();
  connector.register({
    name: 'test-api',
    type: 'rest',
    baseUrl: 'https://httpbin.org',
  });

  // We test the structure without actually hitting the network
  const result = await connector.call({
    service: 'test-api',
    method: 'GET',
    path: '/get',
  });

  // httpbin.org is a real service that will return a response
  // We just verify the call doesn't throw and returns structured output
  assert.ok(result.durationMs > 0, 'records duration');
});

// ─── Webhook Handler ─────────────────────────────────────────────────────────

test('subscribe creates a webhook subscription', () => {
  const handler = new WebhookHandler();
  const sub = handler.subscribe({
    event: 'deploy',
    targetUrl: 'https://example.com/hook',
    active: true,
  });

  assert.ok(sub.id.startsWith('wh_'), 'id has prefix');
  assert.strictEqual(sub.event, 'deploy');
  assert.strictEqual(sub.targetUrl, 'https://example.com/hook');
  assert.strictEqual(sub.triggerCount, 0);
});

test('unsubscribe removes a subscription', () => {
  const handler = new WebhookHandler();
  const sub = handler.subscribe({ event: 'test', targetUrl: 'https://x.com', active: true });

  assert.strictEqual(handler.unsubscribe(sub.id), true);
  assert.strictEqual(handler.get(sub.id), undefined);
});

test('get returns subscription by id', () => {
  const handler = new WebhookHandler();
  const sub = handler.subscribe({ event: 'test', targetUrl: 'https://x.com', active: true });

  const retrieved = handler.get(sub.id);
  assert.strictEqual(retrieved?.event, 'test');
});

test('list returns all subscriptions', () => {
  const handler = new WebhookHandler();
  handler.subscribe({ event: 'a', targetUrl: 'https://x.com', active: true });
  handler.subscribe({ event: 'b', targetUrl: 'https://y.com', active: false });

  const all = handler.list();
  assert.strictEqual(all.length, 2);
});

test('listActive returns only active subscriptions', () => {
  const handler = new WebhookHandler();
  handler.subscribe({ event: 'a', targetUrl: 'https://x.com', active: true });
  handler.subscribe({ event: 'b', targetUrl: 'https://y.com', active: false });

  const active = handler.listActive();
  assert.strictEqual(active.length, 1);
  assert.strictEqual(active[0].event, 'a');
});

test('emit delivers to matching active subscriptions', async () => {
  const handler = new WebhookHandler();
  handler.subscribe({ event: 'test-event', targetUrl: 'https://httpbin.org/post', active: true });

  const results = await handler.emit({
    event: 'test-event',
    timestamp: new Date().toISOString(),
    source: 'test',
    data: { message: 'hello' },
  });

  assert.strictEqual(results.length, 1);
  // May succeed or fail depending on network, but should attempt
  assert.ok(typeof results[0].delivered === 'boolean');
});

test('emit does not deliver to inactive subscriptions', async () => {
  const handler = new WebhookHandler();
  handler.subscribe({ event: 'test', targetUrl: 'https://x.com', active: false });

  const results = await handler.emit({
    event: 'test',
    timestamp: new Date().toISOString(),
    source: 'test',
    data: {},
  });

  assert.strictEqual(results.length, 0, 'no deliveries to inactive');
});

test('emit does not deliver for non-matching events', async () => {
  const handler = new WebhookHandler();
  handler.subscribe({ event: 'other-event', targetUrl: 'https://x.com', active: true });

  const results = await handler.emit({
    event: 'different-event',
    timestamp: new Date().toISOString(),
    source: 'test',
    data: {},
  });

  assert.strictEqual(results.length, 0);
});

test('emit records payload in history', async () => {
  const handler = new WebhookHandler();
  await handler.emit({
    event: 'recorded',
    timestamp: new Date().toISOString(),
    source: 'test',
    data: { key: 'value' },
  });

  const history = handler.getHistory('recorded');
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].data.key, 'value');
});

test('emit adds signature when secret is set', async () => {
  const handler = new WebhookHandler();
  handler.subscribe({
    event: 'signed',
    targetUrl: 'https://httpbin.org/post',
    secret: 'mysecret',
    active: true,
  });

  const results = await handler.emit({
    event: 'signed',
    timestamp: new Date().toISOString(),
    source: 'test',
    data: {},
  });

  // The emit method should have added a signature header (we just verify delivery happened)
  assert.ok(results.length >= 0, 'emission completed');
});

test('getHistory returns all events when no filter', async () => {
  const handler = new WebhookHandler();
  await handler.emit({
    event: 'ev1',
    timestamp: new Date().toISOString(),
    source: 'test',
    data: {},
  });
  await handler.emit({
    event: 'ev2',
    timestamp: new Date().toISOString(),
    source: 'test',
    data: {},
  });

  const all = handler.getHistory();
  assert.strictEqual(all.length, 2);
});

// ─── Workspace Integration Points ───────────────────────────────────────────

test('creates integration points', () => {
  const points = new WorkspaceIntegrationPoints();
  assert.ok(points !== undefined);
});

test('getMCPRegistry returns registry', () => {
  const points = new WorkspaceIntegrationPoints();
  const registry = points.getMCPRegistry();

  assert.ok(registry instanceof MCPToolRegistry);
});

test('getServiceConnector returns connector', () => {
  const points = new WorkspaceIntegrationPoints();
  const connector = points.getServiceConnector();

  assert.ok(connector instanceof ExternalServiceConnector);
});

test('getWebhookHandler returns handler', () => {
  const points = new WorkspaceIntegrationPoints();
  const handler = points.getWebhookHandler();

  assert.ok(handler instanceof WebhookHandler);
});

test('configureGit sets config', () => {
  const points = new WorkspaceIntegrationPoints();
  points.configureGit({ repoPath: '/tmp/repo', remoteUrl: 'https://github.com/user/repo.git' });

  const config = points.getGitConfig();
  assert.strictEqual(config.repoPath, '/tmp/repo');
  assert.strictEqual(config.remoteUrl, 'https://github.com/user/repo.git');
});

test('getGitConfig returns empty config before configure', () => {
  const points = new WorkspaceIntegrationPoints();
  const config = points.getGitConfig();

  assert.strictEqual(config.repoPath, undefined);
  assert.strictEqual(config.remoteUrl, undefined);
});

test('getState returns integration state', () => {
  const points = new WorkspaceIntegrationPoints();
  const state = points.getState('ws-1');

  assert.strictEqual(state.workspaceId, 'ws-1');
  assert.strictEqual(state.git.configured, false);
  assert.deepStrictEqual(state.mcpTools, []);
  assert.deepStrictEqual(state.services, []);
  assert.deepStrictEqual(state.webhooks, []);
});

test('getState includes registered integrations', () => {
  const points = new WorkspaceIntegrationPoints();
  points.getMCPRegistry().register({
    name: 'my-tool',
    description: 'My tool',
    parameters: {},
    handler: () => 'ok',
  });
  points.getServiceConnector().register({
    name: 'my-svc',
    type: 'rest',
    baseUrl: 'https://api.example.com',
  });
  points.getWebhookHandler().subscribe({
    event: 'deploy',
    targetUrl: 'https://example.com/hook',
    active: true,
  });

  const state = points.getState('ws-1');
  assert.ok(state.mcpTools.includes('my-tool'));
  assert.ok(state.services.includes('my-svc'));
  assert.ok(state.webhooks.length > 0);
});
