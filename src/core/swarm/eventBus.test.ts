/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Event Bus Tests
 *
 * Run via: npx tsx --test src/core/swarm/eventBus.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus, type SwarmEvent, type EventSubscription } from './eventBus';

// ---------- Helpers ----------

let bus: ReturnType<typeof createEventBus>;

test.beforeEach(() => {
  bus = createEventBus({ maxHistorySize: 100, debug: false });
});

// ============================================================
// 1. Publishing & Subscription
// ============================================================

test('EventBus: subscribe receives matching events', () => {
  let received: SwarmEvent | undefined;
  bus.subscribe('agent.spawn', (event) => {
    received = event;
  });

  bus.publish('agent.spawn', { agentId: 'a1' }, { sourceAgentId: 'a1' });
  assert.ok(received, 'Event should be received');
  assert.strictEqual(received!.name, 'agent.spawn');
});

test('EventBus: non-matching events are not received', () => {
  let received = false;
  bus.subscribe('agent.spawn', () => {
    received = true;
  });

  bus.publish('task.completed', { taskId: 't1' });
  assert.strictEqual(received, false);
});

test('EventBus: unsubscribe removes subscription', () => {
  let received = false;
  const sub = bus.subscribe('task.completed', () => {
    received = true;
  });

  bus.unsubscribe(sub.id);
  bus.publish('task.completed', { taskId: 't1' });
  assert.strictEqual(received, false);
});

test('EventBus: unsubscribe returns false for nonexistent id', () => {
  assert.strictEqual(bus.unsubscribe('nonexistent'), false);
});

// ============================================================
// 2. Event History
// ============================================================

test('EventBus: getHistory returns published events', () => {
  bus.publish('task.completed', { taskId: 't1' });
  bus.publish('agent.spawn', { agentId: 'a1' });

  const history = bus.getHistory();
  assert.strictEqual(history.length, 2);
  assert.strictEqual(history[0]!.name, 'task.completed');
  assert.strictEqual(history[1]!.name, 'agent.spawn');
});

test('EventBus: history respects maxHistorySize', () => {
  const smallBus = createEventBus({ maxHistorySize: 5, debug: false });
  for (let i = 0; i < 10; i++) {
    smallBus.publish(`event.${i}`, { index: i });
  }

  const history = smallBus.getHistory();
  assert.strictEqual(history.length, 5);
  assert.strictEqual(history[0]!.name, 'event.5');
});

// ============================================================
// 3. Wildcard Matching
// ============================================================

test('EventBus: wildcard * matches all events', () => {
  let count = 0;
  bus.subscribe('*', () => { count++; });

  bus.publish('task.completed', {});
  bus.publish('agent.spawn', {});
  bus.publish('any.thing', {});

  assert.strictEqual(count, 3);
});

test('EventBus: prefix wildcard matches sub-events', () => {
  let receivedNames: string[] = [];
  bus.subscribe('agent.*', (event) => {
    receivedNames.push(event.name);
  });

  bus.publish('agent.spawn', {});
  bus.publish('agent.stop', {});
  bus.publish('task.completed', {});

  assert.deepStrictEqual(receivedNames, ['agent.spawn', 'agent.stop']);
});

// ============================================================
// 4. Event Filtering
// ============================================================

test('EventBus: filter by agentId (source)', () => {
  let receivedCount = 0;
  bus.subscribe(
    'task.completed',
    () => { receivedCount++; },
    { filter: { agentId: 'agent-1' } }
  );

  bus.publish('task.completed', { taskId: 't1' }, { sourceAgentId: 'agent-1' });
  bus.publish('task.completed', { taskId: 't2' }, { sourceAgentId: 'agent-2' });
  bus.publish('task.completed', { taskId: 't3' }, { targetAgentId: 'agent-1' });

  assert.strictEqual(receivedCount, 2);
});

test('EventBus: filter by namePrefix', () => {
  let receivedNames: string[] = [];
  bus.subscribe(
    'agent.*',
    (event) => { receivedNames.push(event.name); },
    { filter: { namePrefix: 'agent.sp' } }
  );

  bus.publish('agent.spawn', {});
  bus.publish('agent.stop', {});
  bus.publish('task.completed', {});

  assert.deepStrictEqual(receivedNames, ['agent.spawn']);
});

test('EventBus: filter by category', () => {
  let receivedCount = 0;
  bus.subscribe(
    '*',
    () => { receivedCount++; },
    { filter: { category: 'task' } }
  );

  bus.publish('task.completed', {});
  bus.publish('agent.spawn', {});
  bus.publish('task.failed', {});

  assert.strictEqual(receivedCount, 2);
});

test('EventBus: filter by correlationId', () => {
  let receivedCount = 0;
  bus.subscribe(
    '*',
    () => { receivedCount++; },
    { filter: { correlationId: 'corr-123' } }
  );

  bus.publish('task.completed', {}, { correlationId: 'corr-123' });
  bus.publish('task.completed', {}, { correlationId: 'corr-456' });
  bus.publish('task.completed', {}, { correlationId: 'corr-123' });

  assert.strictEqual(receivedCount, 2);
});

// ============================================================
// 5. Priority Ordering
// ============================================================

test('EventBus: handlers run in priority order (higher first)', () => {
  const order: string[] = [];
  bus.subscribe('task.completed', () => { order.push('low'); }, { priority: 10 });
  bus.subscribe('task.completed', () => { order.push('high'); }, { priority: 100 });
  bus.subscribe('task.completed', () => { order.push('mid'); }, { priority: 50 });

  bus.publish('task.completed', {});

  assert.deepStrictEqual(order, ['high', 'mid', 'low']);
});

// ============================================================
// 6. Dead Letter Queue
// ============================================================

test('EventBus: failed sync handlers move to dead letter', () => {
  bus.subscribe('task.completed', () => {
    throw new Error('Always fails');
  });

  bus.publish('task.completed', {});

  assert.ok(bus.getDeadLetters().length > 0);
  assert.strictEqual(bus.getDeadLetters()[0]!.reason, 'Max delivery attempts exceeded');
});

test('EventBus: getDeadLetters returns all dead letters', () => {
  bus.subscribe('task.completed', () => { throw new Error('Fail'); });
  bus.publish('task.completed', {});

  const deadLetters = bus.getDeadLetters();
  assert.ok(deadLetters.length > 0);
  assert.strictEqual(deadLetters[0]!.reason, 'Max delivery attempts exceeded');
});

test('EventBus: clearDeadLetters empties the queue', () => {
  bus.subscribe('task.completed', () => { throw new Error('Fail'); });
  bus.publish('task.completed', {});

  bus.clearDeadLetters();
  assert.strictEqual(bus.getDeadLetters().length, 0);
});

test('EventBus: retryDeadLetter resets and re-delivers', () => {
  let callCount = 0;
  bus.subscribe('task.completed', () => {
    callCount++;
    if (callCount < 2) throw new Error('Fail');
  });

  bus.publish('task.completed', {});
  assert.ok(bus.getDeadLetters().length > 0);

  const eventId = bus.getDeadLetters()[0]!.event.id;
  const result = bus.retryDeadLetter(eventId);
  assert.strictEqual(result, true);

  // After retry (2nd delivery attempt), the handler succeeds
  assert.strictEqual(callCount, 2);
});

test('EventBus: retryDeadLetter returns false for nonexistent id', () => {
  assert.strictEqual(bus.retryDeadLetter('nonexistent'), false);
});

// ============================================================
// 7. Stats
// ============================================================

test('EventBus: getStats reports accurate counts', () => {
  bus.subscribe('task.completed', () => {});
  bus.subscribe('agent.spawn', () => {});

  bus.publish('task.completed', {});
  bus.publish('agent.spawn', {});
  bus.publish('agent.stop', {});

  const stats = bus.getStats();
  assert.strictEqual(stats.totalPublished, 3);
  assert.strictEqual(stats.totalDelivered, 2);
  assert.strictEqual(stats.activeSubscriptions, 2);
  assert.strictEqual(stats.historySize, 3);
  assert.strictEqual(stats.totalFiltered, 1);
});

test('EventBus: stats track events by category', () => {
  bus.publish('agent.spawn', {});
  bus.publish('agent.stop', {});
  bus.publish('task.completed', {});
  bus.publish('task.failed', {});

  const stats = bus.getStats();
  assert.strictEqual(stats.eventsByCategory.agent, 2);
  assert.strictEqual(stats.eventsByCategory.task, 2);
});

// ============================================================
// 8. Persistence
// ============================================================

test('EventBus: persist and load events', async () => {
  const persistBus = createEventBus({
    maxHistorySize: 100,
    enablePersistence: true,
    persistencePath: '/tmp/aether-eventbus-test',
    debug: false,
  });

  persistBus.publish('task.completed', { taskId: 't1' });
  persistBus.publish('agent.spawn', { agentId: 'a1' });

  await persistBus.persistEvents();
  const loaded = await persistBus.loadPersistedEvents();

  assert.strictEqual(loaded.length, 2);
  assert.strictEqual(loaded[0]!.name, 'task.completed');
  assert.strictEqual(loaded[1]!.name, 'agent.spawn');
});

test('EventBus: loadPersistedEvents returns empty without path', async () => {
  const result = await bus.loadPersistedEvents();
  assert.strictEqual(result.length, 0);
});

// ============================================================
// 9. Reset & Shutdown
// ============================================================

test('EventBus: reset clears all state', () => {
  bus.subscribe('task.completed', () => {});
  bus.publish('task.completed', {});

  bus.reset();

  assert.strictEqual(bus.getHistory().length, 0);
  assert.strictEqual(bus.getDeadLetters().length, 0);
  assert.strictEqual(bus.getStats().activeSubscriptions, 0);
  assert.strictEqual(bus.getStats().totalPublished, 0);
});

test('EventBus: shutdown clears subscriptions', () => {
  bus.subscribe('task.completed', () => {});
  bus.shutdown();

  assert.strictEqual(bus.getStats().activeSubscriptions, 0);
});

// ============================================================
// 10. Event Metadata
// ============================================================

test('EventBus: event includes sourceAgentId and targetAgentId', () => {
  let capturedEvent: SwarmEvent | undefined;
  bus.subscribe('task.completed', (event) => {
    capturedEvent = event;
  });

  bus.publish('task.completed', {}, { sourceAgentId: 'agent-1', targetAgentId: 'agent-2', correlationId: 'corr-1' });

  assert.ok(capturedEvent);
  assert.strictEqual(capturedEvent!.sourceAgentId, 'agent-1');
  assert.strictEqual(capturedEvent!.targetAgentId, 'agent-2');
  assert.strictEqual(capturedEvent!.correlationId, 'corr-1');
  assert.ok(capturedEvent!.timestamp > 0);
  assert.ok(capturedEvent!.id.length > 0);
});

test('EventBus: event category is extracted from name', () => {
  const categories: string[] = [];
  bus.subscribe('*', (event) => { categories.push(event.category); });

  bus.publish('agent.spawn', {});
  bus.publish('task.completed', {});
  bus.publish('msg.send', {});
  bus.publish('conversation.join', {});
  bus.publish('exec.run', {});
  bus.publish('system.init', {});
  bus.publish('failure.retry', {});

  assert.deepStrictEqual(categories, [
    'agent',
    'task',
    'message',
    'conversation',
    'execution',
    'system',
    'failure',
  ]);
});

// ============================================================
// 11. Multiple Subscribers
// ============================================================

test('EventBus: multiple subscribers all receive the event', () => {
  let count = 0;
  bus.subscribe('task.completed', () => { count++; });
  bus.subscribe('task.completed', () => { count++; });
  bus.subscribe('task.completed', () => { count++; });

  bus.publish('task.completed', {});
  assert.strictEqual(count, 3);
});

// ============================================================
// 12. Subscription Management
// ============================================================

test('EventBus: subscribe returns subscription with correct id', () => {
  const sub = bus.subscribe('task.completed', () => {});
  assert.ok(sub.id.length > 0);
  assert.strictEqual(sub.eventName, 'task.completed');
  assert.strictEqual(sub.enabled, true);
  assert.strictEqual(sub.priority, 0);
});

test('EventBus: subscription options are applied', () => {
  let received = false;
  const sub = bus.subscribe(
    'task.completed',
    () => { received = true; },
    { priority: 100, filter: { category: 'task' } }
  );

  assert.strictEqual(sub.priority, 100);
  assert.ok(sub.filter !== undefined);
  assert.strictEqual(sub.filter!.category, 'task');

  bus.publish('task.completed', {});
  assert.strictEqual(received, true);
});

// ============================================================
// 13. Async Handlers (fire-and-forget safety)
// ============================================================

test('EventBus: async handler does not block publishing', () => {
  let started = false;
  let finished = false;

  bus.subscribe('task.completed', async () => {
    started = true;
    await new Promise((resolve) => setTimeout(resolve, 100));
    finished = true;
  });

  bus.publish('task.completed', {});
  assert.strictEqual(started, true);
  // Since it's fire-and-forget, finished won't be true immediately
  assert.strictEqual(finished, false);
});
