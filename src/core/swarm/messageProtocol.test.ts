/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Message Protocol Tests
 *
 * Run via: npx tsx --test src/core/swarm/messageProtocol.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMessage,
  createRequest,
  createResponse,
  createBroadcast,
  createDirective,
  createHeartbeat,
  createErrorMessage,
  serializeMessage,
  deserializeMessage,
  createMessageRouter,
  validateMessage,
  isExpired,
  matchesRecipient,
  type SwarmMessage,
  type RequestMessage,
  type ResponseMessage,
  type BroadcastMessage,
  type DirectiveMessage,
  type HeartbeatMessage,
  type ErrorMessage,
} from './messageProtocol';

// ============================================================
// 1. Message Creation
// ============================================================

test('MessageProtocol: createMessage creates a valid message', () => {
  const msg = createMessage('agent-1', ['agent-2'], 'request', {
    summary: 'Hello',
    payload: { key: 'value' },
    attachments: [],
  });

  assert.strictEqual(msg.header.from, 'agent-1');
  assert.deepStrictEqual(msg.header.to, ['agent-2']);
  assert.strictEqual(msg.header.type, 'request');
  assert.strictEqual(msg.body.summary, 'Hello');
  assert.strictEqual(msg.body.payload.key, 'value');
  assert.ok(msg.header.id.length > 0);
  assert.ok(msg.header.timestamp > 0);
});

test('MessageProtocol: createMessage applies defaults', () => {
  const msg = createMessage('agent-1', ['agent-2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  });

  assert.strictEqual(msg.header.priority, 'normal');
  assert.strictEqual(msg.header.ttlMs, 0);
  assert.deepStrictEqual(msg.header.headers, {});
});

test('MessageProtocol: createMessage includes optional fields', () => {
  const msg = createMessage('agent-1', ['agent-2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  }, {
    correlationId: 'corr-1',
    priority: 'high',
    ttlMs: 5000,
  });

  assert.strictEqual(msg.header.correlationId, 'corr-1');
  assert.strictEqual(msg.header.priority, 'high');
  assert.strictEqual(msg.header.ttlMs, 5000);
});

// ============================================================
// 2. Request Messages
// ============================================================

test('MessageProtocol: createRequest creates a request message', () => {
  const req = createRequest('agent-1', 'agent-2', 'analyze', { file: 'test.ts' }, {
    summary: 'Analyze this file',
    timeoutMs: 10000,
  });

  assert.strictEqual(req.header.type, 'request');
  assert.strictEqual(req.header.from, 'agent-1');
  assert.deepStrictEqual(req.header.to, ['agent-2']);
  assert.strictEqual(req.body.payload.action, 'analyze');
  assert.strictEqual(req.body.payload.parameters.file, 'test.ts');
  assert.strictEqual(req.body.payload.timeoutMs, 10000);
});

test('MessageProtocol: createRequest has correct correlationId chain', () => {
  const req = createRequest('agent-1', 'agent-2', 'doWork', {}, { correlationId: 'chain-1' });
  assert.strictEqual(req.header.correlationId, 'chain-1');
});

// ============================================================
// 3. Response Messages
// ============================================================

test('MessageProtocol: createResponse creates a response message', () => {
  const res = createResponse('agent-2', 'agent-1', 'msg-123', 'ok', {
    data: { result: 'success' },
    summary: 'Work complete',
  });

  assert.strictEqual(res.header.type, 'response');
  assert.strictEqual(res.header.inReplyTo, 'msg-123');
  assert.strictEqual(res.body.payload.status, 'ok');
  assert.strictEqual(res.body.payload.data?.result, 'success');
});

test('MessageProtocol: createResponse supports error status', () => {
  const res = createResponse('agent-2', 'agent-1', 'msg-123', 'error', {
    error: 'Something went wrong',
  });

  assert.strictEqual(res.body.payload.status, 'error');
  assert.strictEqual(res.body.payload.error, 'Something went wrong');
});

// ============================================================
// 4. Broadcast Messages
// ============================================================

test('MessageProtocol: createBroadcast creates a broadcast message', () => {
  const bcast = createBroadcast('manager-1', 'status-update', { status: 'running' }, {
    excludedAgents: ['agent-3'],
    priority: 'high',
  });

  assert.strictEqual(bcast.header.type, 'broadcast');
  assert.strictEqual(bcast.body.payload.topic, 'status-update');
  assert.deepStrictEqual(bcast.body.payload.excludedAgents, ['agent-3']);
  assert.strictEqual(bcast.header.to.length, 0);
  assert.strictEqual(bcast.header.priority, 'high');
});

// ============================================================
// 5. Directive Messages
// ============================================================

test('MessageProtocol: createDirective creates a directive message', () => {
  const dir = createDirective('manager-1', ['worker-1', 'worker-2'], 'executeTask', { taskId: 't1' }, {
    summary: 'Execute the task',
    requiresAck: true,
  });

  assert.strictEqual(dir.header.type, 'directive');
  assert.deepStrictEqual(dir.header.to, ['worker-1', 'worker-2']);
  assert.strictEqual(dir.body.payload.command, 'executeTask');
  assert.deepStrictEqual(dir.body.payload.targetAgentIds, ['worker-1', 'worker-2']);
  assert.strictEqual(dir.body.payload.requiresAck, true);
});

// ============================================================
// 6. Heartbeat Messages
// ============================================================

test('MessageProtocol: createHeartbeat creates a heartbeat message', () => {
  const hb = createHeartbeat('agent-1', 'healthy', 0.5, 3);

  assert.strictEqual(hb.header.type, 'heartbeat');
  assert.strictEqual(hb.body.payload.status, 'healthy');
  assert.strictEqual(hb.body.payload.load, 0.5);
  assert.strictEqual(hb.body.payload.activeTasks, 3);
});

// ============================================================
// 7. Error Messages
// ============================================================

test('MessageProtocol: createErrorMessage creates an error message', () => {
  const err = createErrorMessage('agent-1', ['manager-1'], 'TASK_FAILED', 'Task timed out', {
    stackTrace: 'Error: timeout\n  at ...',
    recoverable: false,
    priority: 'critical',
  });

  assert.strictEqual(err.header.type, 'error');
  assert.strictEqual(err.body.payload.errorCode, 'TASK_FAILED');
  assert.strictEqual(err.body.payload.errorMessage, 'Task timed out');
  assert.strictEqual(err.body.payload.stackTrace, 'Error: timeout\n  at ...');
  assert.strictEqual(err.body.payload.recoverable, false);
  assert.strictEqual(err.header.priority, 'critical');
});

test('MessageProtocol: createErrorMessage defaults recoverable to true', () => {
  const err = createErrorMessage('agent-1', ['manager-1'], 'ERR', 'msg');
  assert.strictEqual(err.body.payload.recoverable, true);
});

// ============================================================
// 8. Serialization
// ============================================================

test('MessageProtocol: serializeMessage produces valid JSON', () => {
  const msg = createMessage('a1', ['a2'], 'request', {
    summary: 'Test',
    payload: { key: 'val' },
    attachments: [],
  });

  const envelope = serializeMessage(msg);
  assert.strictEqual(envelope.format, 'json');
  assert.ok(envelope.checksum !== undefined);
  assert.ok(envelope.checksum!.length > 0);

  const parsed = JSON.parse(envelope.data);
  assert.strictEqual(parsed.header.from, 'a1');
});

test('MessageProtocol: deserializeMessage reconstructs the message', () => {
  const msg = createMessage('a1', ['a2'], 'request', {
    summary: 'Test',
    payload: { data: 42 },
    attachments: [],
  });

  const envelope = serializeMessage(msg);
  const restored = deserializeMessage(envelope);

  assert.strictEqual(restored.header.id, msg.header.id);
  assert.strictEqual(restored.body.payload.data, 42);
  assert.strictEqual(restored.header.type, 'request');
});

test('MessageProtocol: deserializeMessage rejects unsupported format', () => {
  assert.throws(
    () => deserializeMessage({ data: '{}', format: 'binary' as 'json' }),
    /Unsupported serialization format/
  );
});

// ============================================================
// 9. Validation
// ============================================================

test('MessageProtocol: validateMessage accepts valid messages', () => {
  const msg = createMessage('a1', ['a2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  });

  assert.strictEqual(validateMessage(msg), true);
});

test('MessageProtocol: validateMessage rejects invalid messages', () => {
  assert.strictEqual(validateMessage(null), false);
  assert.strictEqual(validateMessage({}), false);
  assert.strictEqual(validateMessage({ header: {} }), false);
  assert.strictEqual(validateMessage({ header: { id: '1', from: 'a', to: ['b'], type: 'x', timestamp: 1 } }), false);
});

// ============================================================
// 10. Expiry
// ============================================================

test('MessageProtocol: isExpired returns false for no TTL', () => {
  const msg = createMessage('a1', ['a2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  });

  assert.strictEqual(isExpired(msg), false);
});

test('MessageProtocol: isExpired returns true for expired messages', () => {
  const msg = createMessage('a1', ['a2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  }, { ttlMs: 100 });

  // Simulate passage of time
  const now = Date.now();
  (msg as SwarmMessage & { header: { timestamp: number; ttlMs: number } }).header.timestamp = now - 200;

  assert.strictEqual(isExpired(msg as SwarmMessage), true);
});

test('MessageProtocol: isExpired returns false for non-expired messages', () => {
  const msg = createMessage('a1', ['a2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  }, { ttlMs: 10000 });

  assert.strictEqual(isExpired(msg), false);
});

// ============================================================
// 11. Recipient Matching
// ============================================================

test('MessageProtocol: matchesRecipient returns true for broadcast', () => {
  const msg = createMessage('a1', [], 'broadcast', {
    summary: 'Broadcast',
    payload: {},
    attachments: [],
  });

  assert.strictEqual(matchesRecipient(msg, 'any-agent'), true);
});

test('MessageProtocol: matchesRecipient checks to array', () => {
  const msg = createMessage('a1', ['agent-1', 'agent-2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  });

  assert.strictEqual(matchesRecipient(msg, 'agent-1'), true);
  assert.strictEqual(matchesRecipient(msg, 'agent-2'), true);
  assert.strictEqual(matchesRecipient(msg, 'agent-3'), false);
});

// ============================================================
// 12. Message Router
// ============================================================

test('MessageProtocol: router delivers to registered handler', async () => {
  const router = createMessageRouter();
  let received: SwarmMessage | undefined;

  router.registerHandler('agent-2', async (msg) => {
    received = msg;
  });

  const msg = createMessage('agent-1', ['agent-2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  });

  const result = await router.route(msg);
  assert.strictEqual(result.delivered, true);
  assert.strictEqual(result.targetAgentId, 'agent-2');
  assert.ok(received !== undefined);
  assert.strictEqual(received!.header.id, msg.header.id);
});

test('MessageProtocol: router returns not found for unregistered agent', async () => {
  const router = createMessageRouter();
  const msg = createMessage('agent-1', ['unknown-agent'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  });

  const result = await router.route(msg);
  assert.strictEqual(result.delivered, false);
  assert.strictEqual(result.error, 'No handler registered for agent');
});

test('MessageProtocol: router handles broadcast', async () => {
  const router = createMessageRouter();
  const msg = createMessage('a1', [], 'broadcast', {
    summary: 'Broadcast',
    payload: {},
    attachments: [],
  });

  const result = await router.route(msg);
  assert.strictEqual(result.delivered, true);
  assert.strictEqual(result.targetAgentId, 'broadcast');
});

test('MessageProtocol: router handles TTL expiry', async () => {
  const router = createMessageRouter();
  const msg = createMessage('a1', ['a2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  }, { ttlMs: 100 });

  // Simulate expired message
  const msgWithTimestamp = msg as SwarmMessage & { header: { timestamp: number } };
  msgWithTimestamp.header.timestamp = Date.now() - 200;

  const result = await router.route(msgWithTimestamp);
  assert.strictEqual(result.delivered, false);
  assert.strictEqual(result.error, 'Message TTL expired');
});

test('MessageProtocol: router unregister handler', () => {
  const router = createMessageRouter();
  router.registerHandler('agent-1', async () => {});
  assert.strictEqual(router.unregisterHandler('agent-1'), true);
  assert.strictEqual(router.unregisterHandler('agent-1'), false);
});

test('MessageProtocol: router propagates handler errors', async () => {
  const router = createMessageRouter();
  router.registerHandler('agent-2', async () => {
    throw new Error('Handler crashed');
  });

  const msg = createMessage('agent-1', ['agent-2'], 'request', {
    summary: 'Test',
    payload: {},
    attachments: [],
  });

  const result = await router.route(msg);
  assert.strictEqual(result.delivered, false);
  assert.strictEqual(result.error, 'Handler crashed');
});
