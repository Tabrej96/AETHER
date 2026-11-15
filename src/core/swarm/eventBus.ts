/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Event Bus
 *
 * Pub/sub event system for inter-agent communication with routing, filtering,
 * dead letter handling, and event persistence for debugging.
 *
 * Architectural inspiration: AutoGen's AgentChat event model (archived reference).
 * AETHER-native implementation using modern TypeScript patterns.
 */

import fs from 'node:fs/promises';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EventCategory =
  | 'agent'
  | 'task'
  | 'message'
  | 'conversation'
  | 'execution'
  | 'system'
  | 'failure';

export interface SwarmEvent {
  id: string;
  category: EventCategory;
  name: string;
  timestamp: number;
  sourceAgentId?: string;
  targetAgentId?: string;
  payload: Record<string, unknown>;
  correlationId?: string;
  deliveryAttempts: number;
}

export interface EventFilter {
  agentId?: string;
  namePrefix?: string;
  category?: EventCategory;
  correlationId?: string;
}

export interface EventSubscription {
  id: string;
  eventName: string;
  handler: (event: SwarmEvent) => void | Promise<void>;
  filter?: EventFilter;
  priority: number;
  enabled: boolean;
  handledCount: number;
}

export interface DeadLetter {
  event: SwarmEvent;
  reason: string;
  quarantinedAt: number;
  error?: string;
}

export interface EventBusConfig {
  maxHistorySize: number;
  maxDeliveryAttempts: number;
  enablePersistence: boolean;
  persistencePath?: string;
  handlerTimeoutMs: number;
  debug: boolean;
}

export interface EventBusStats {
  totalPublished: number;
  totalDelivered: number;
  totalFiltered: number;
  totalDeadLettered: number;
  activeSubscriptions: number;
  historySize: number;
  eventsByCategory: Record<EventCategory, number>;
}

export interface EventBus {
  publish(name: string, payload: Record<string, unknown>, opts?: {
    sourceAgentId?: string;
    targetAgentId?: string;
    correlationId?: string;
  }): void;
  subscribe(
    eventName: string,
    handler: (event: SwarmEvent) => void | Promise<void>,
    opts?: { filter?: EventFilter; priority?: number }
  ): EventSubscription;
  unsubscribe(subscriptionId: string): boolean;
  getHistory(): SwarmEvent[];
  getDeadLetters(): DeadLetter[];
  retryDeadLetter(eventId: string): boolean;
  clearDeadLetters(): void;
  getStats(): EventBusStats;
  persistEvents(): Promise<void>;
  loadPersistedEvents(): Promise<SwarmEvent[]>;
  reset(): void;
  shutdown(): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateSubId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function matchesFilter(event: SwarmEvent, filter?: EventFilter): boolean {
  if (!filter) return true;

  if (filter.agentId && event.sourceAgentId !== filter.agentId && event.targetAgentId !== filter.agentId) {
    return false;
  }
  if (filter.namePrefix && !event.name.startsWith(filter.namePrefix)) {
    return false;
  }
  if (filter.category && event.category !== filter.category) {
    return false;
  }
  if (filter.correlationId && event.correlationId !== filter.correlationId) {
    return false;
  }

  return true;
}

function eventMatchesPattern(eventName: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === eventName) return true;

  // Support wildcard patterns like "agent.*" or "task.*"
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return eventName.startsWith(prefix + '.');
  }

  return false;
}

function extractCategory(eventName: string): EventCategory {
  const prefix = eventName.split('.')[0];
  const map: Record<string, EventCategory> = {
    agent: 'agent',
    task: 'task',
    msg: 'message',
    conversation: 'conversation',
    exec: 'execution',
    system: 'system',
    failure: 'failure',
  };
  return map[prefix] ?? 'system';
}

// ---------------------------------------------------------------------------
// Main implementation
// ---------------------------------------------------------------------------

export interface EventBusInternalState {
  subscriptions: Map<string, EventSubscription>;
  history: SwarmEvent[];
  deadLetters: DeadLetter[];
  totalPublished: number;
  totalDelivered: number;
  totalFiltered: number;
}

const DEFAULT_CONFIG: EventBusConfig = {
  maxHistorySize: 1000,
  maxDeliveryAttempts: 1,
  enablePersistence: true,
  handlerTimeoutMs: 5000,
  debug: false,
};

export function createEventBus(config: Partial<EventBusConfig> = {}): EventBus {
  const merged: EventBusConfig = { ...DEFAULT_CONFIG, ...config };
  const state: EventBusInternalState = {
    subscriptions: new Map(),
    history: [],
    deadLetters: [],
    totalPublished: 0,
    totalDelivered: 0,
    totalFiltered: 0,
  };

  function addToHistory(event: SwarmEvent): void {
    state.history.push(event);
    while (state.history.length > merged.maxHistorySize) {
      state.history.shift();
    }
  }

  function deliverToHandlerSync(sub: EventSubscription, event: SwarmEvent): void {
    try {
      const result = sub.handler(event);
      if (result && typeof result.catch === 'function') {
        // Async handler — catch errors but don't await
        result.catch(() => {
          // Silently handle async errors for sync delivery model
        });
      }
      sub.handledCount++;
      state.totalDelivered++;
    } catch (err) {
      event.deliveryAttempts++;
      if (event.deliveryAttempts >= merged.maxDeliveryAttempts) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        state.deadLetters.push({
          event,
          reason: 'Max delivery attempts exceeded',
          quarantinedAt: Date.now(),
          error: errorMessage,
        });
      }
    }
  }

  function publishToSubscribers(name: string, event: SwarmEvent): void {
    const matching = Array.from(state.subscriptions.values())
      .filter((sub) => sub.enabled && eventMatchesPattern(name, sub.eventName))
      .sort((a, b) => b.priority - a.priority);

    if (matching.length === 0) {
      state.totalFiltered++;
      return;
    }

    for (const sub of matching) {
      if (matchesFilter(event, sub.filter)) {
        deliverToHandlerSync(sub, event);
      } else {
        state.totalFiltered++;
      }
    }
  }

  const bus: EventBus = {
    publish(name, payload, opts = {}): void {
      const event: SwarmEvent = {
        id: generateId(),
        category: extractCategory(name),
        name,
        timestamp: Date.now(),
        sourceAgentId: opts.sourceAgentId,
        targetAgentId: opts.targetAgentId,
        payload,
        correlationId: opts.correlationId,
        deliveryAttempts: 0,
      };

      state.totalPublished++;
      addToHistory(event);
      publishToSubscribers(name, event);
    },

    subscribe(eventName, handler, opts = {}): EventSubscription {
      const sub: EventSubscription = {
        id: generateSubId(),
        eventName,
        handler,
        filter: opts.filter,
        priority: opts.priority ?? 0,
        enabled: true,
        handledCount: 0,
      };
      state.subscriptions.set(sub.id, sub);
      return sub;
    },

    unsubscribe(subscriptionId: string): boolean {
      return state.subscriptions.delete(subscriptionId);
    },

    getHistory(): SwarmEvent[] {
      return [...state.history];
    },

    getDeadLetters(): DeadLetter[] {
      return [...state.deadLetters];
    },

    retryDeadLetter(eventId: string): boolean {
      const dlIndex = state.deadLetters.findIndex((dl) => dl.event.id === eventId);
      if (dlIndex === -1) return false;

      const dl = state.deadLetters[dlIndex]!;
      dl.event.deliveryAttempts = 0;
      state.deadLetters.splice(dlIndex, 1);
      publishToSubscribers(dl.event.name, dl.event);
      return true;
    },

    clearDeadLetters(): void {
      state.deadLetters = [];
    },

    getStats(): EventBusStats {
      const eventsByCategory: Record<EventCategory, number> = {
        agent: 0,
        task: 0,
        message: 0,
        conversation: 0,
        execution: 0,
        system: 0,
        failure: 0,
      };
      for (const event of state.history) {
        eventsByCategory[event.category]++;
      }

      return {
        totalPublished: state.totalPublished,
        totalDelivered: state.totalDelivered,
        totalFiltered: state.totalFiltered,
        totalDeadLettered: state.deadLetters.length,
        activeSubscriptions: Array.from(state.subscriptions.values()).filter((s) => s.enabled).length,
        historySize: state.history.length,
        eventsByCategory,
      };
    },

    async persistEvents(): Promise<void> {
      if (!merged.enablePersistence || !merged.persistencePath) return;

      try {
        const data = {
          schemaVersion: '1.0.0',
          persistedAt: new Date().toISOString(),
          events: state.history,
          deadLetters: state.deadLetters,
        };

        await fs.mkdir(merged.persistencePath, { recursive: true });
        await fs.writeFile(`${merged.persistencePath}/events.json`, JSON.stringify(data, null, 2), 'utf-8');
      } catch {
        // Silently handle persistence errors
      }
    },

    async loadPersistedEvents(): Promise<SwarmEvent[]> {
      if (!merged.persistencePath) return [];

      try {
        const content = await fs.readFile(`${merged.persistencePath}/events.json`, 'utf-8');
        const data = JSON.parse(content);
        if (Array.isArray(data.events)) {
          state.history = data.events;
          if (Array.isArray(data.deadLetters)) {
            state.deadLetters = data.deadLetters;
          }
          return state.history;
        }
      } catch {
        // File doesn't exist yet
      }
      return [];
    },

    reset(): void {
      state.subscriptions.clear();
      state.history = [];
      state.deadLetters = [];
      state.totalPublished = 0;
      state.totalDelivered = 0;
      state.totalFiltered = 0;
    },

    shutdown(): void {
      if (merged.enablePersistence) {
        void bus.persistEvents();
      }
      state.subscriptions.clear();
    },
  };

  return bus;
}
