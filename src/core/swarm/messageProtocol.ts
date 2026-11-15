/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Message Protocol
 *
 * Structured message format for agent-to-agent communication supporting
 * request/response patterns, broadcast, targeted messaging, and serialization.
 *
 * Architectural inspiration: AutoGen's AgentChat message format (archived reference).
 * AETHER-native implementation with structured types and serialization support.
 *
 * Usage:
 *   import {
 *     createMessage,
 *     createRequest,
 *     createResponse,
 *     createBroadcast,
 *     serializeMessage,
 *     deserializeMessage,
 *     type SwarmMessage,
 *     type MessageEnvelope,
 *   } from './core/swarm/messageProtocol';
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MessageType =
  | 'request'
  | 'response'
  | 'broadcast'
  | 'directive'
  | 'heartbeat'
  | 'status'
  | 'error';

export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

export interface MessageHeader {
  /** Unique message id */
  id: string;
  /** Sender agent id */
  from: string;
  /** Recipient agent id(s) — empty for broadcast */
  to: string[];
  /** Message type */
  type: MessageType;
  /** Priority level */
  priority: MessagePriority;
  /** Unix timestamp (ms) */
  timestamp: number;
  /** Correlation id for request/response chains */
  correlationId?: string;
  /** Reply-to message id (for responses) */
  inReplyTo?: string;
  /** Custom headers */
  headers: Record<string, string>;
  /** Time-to-live in ms (0 = no expiry) */
  ttlMs: number;
}

export interface MessageBody {
  /** Human-readable summary */
  summary: string;
  /** Structured payload */
  payload: Record<string, unknown>;
  /** Attached file references */
  attachments: string[];
}

export interface SwarmMessage {
  /** Message header */
  header: MessageHeader;
  /** Message body */
  body: MessageBody;
}

export interface RequestMessage extends SwarmMessage {
  header: MessageHeader & { type: 'request' };
  body: MessageBody & {
    payload: Record<string, unknown> & {
      action: string;
      parameters: Record<string, unknown>;
      timeoutMs: number;
    };
  };
}

export interface ResponseMessage extends SwarmMessage {
  header: MessageHeader & { type: 'response' };
  body: MessageBody & {
    payload: Record<string, unknown> & {
      status: 'ok' | 'error' | 'timeout';
      data?: Record<string, unknown>;
      error?: string;
    };
  };
}

export interface BroadcastMessage extends SwarmMessage {
  header: MessageHeader & { type: 'broadcast' };
  body: MessageBody & {
    payload: Record<string, unknown> & {
      topic: string;
      excludedAgents: string[];
    };
  };
}

export interface DirectiveMessage extends SwarmMessage {
  header: MessageHeader & { type: 'directive' };
  body: MessageBody & {
    payload: Record<string, unknown> & {
      command: string;
      targetAgentIds: string[];
      parameters: Record<string, unknown>;
      requiresAck: boolean;
    };
  };
}

export interface HeartbeatMessage extends SwarmMessage {
  header: MessageHeader & { type: 'heartbeat' };
  body: MessageBody & {
    payload: Record<string, unknown> & {
      status: 'healthy' | 'degraded' | 'unhealthy';
      load: number;
      activeTasks: number;
    };
  };
}

export interface StatusMessage extends SwarmMessage {
  header: MessageHeader & { type: 'status' };
  body: MessageBody & {
    payload: Record<string, unknown> & {
      state: string;
      progress: number;
      estimatedCompletionMs?: number;
    };
  };
}

export interface ErrorMessage extends SwarmMessage {
  header: MessageHeader & { type: 'error' };
  body: MessageBody & {
    payload: Record<string, unknown> & {
      errorCode: string;
      errorMessage: string;
      stackTrace?: string;
      recoverable: boolean;
    };
  };
}

export interface MessageEnvelope {
  /** Serialized message bytes */
  data: string;
  /** Serialization format */
  format: 'json';
  /** Checksum for integrity verification */
  checksum?: string;
}

export interface MessageRouter {
  /** Route a message to its destination */
  route(message: SwarmMessage): Promise<MessageDeliveryResult>;
  /** Register a delivery handler */
  registerHandler(agentId: string, handler: (message: SwarmMessage) => Promise<void>): void;
  /** Unregister a delivery handler */
  unregisterHandler(agentId: string): boolean;
}

export interface MessageDeliveryResult {
  /** Whether delivery was successful */
  delivered: boolean;
  /** Target agent id */
  targetAgentId: string;
  /** Error message if delivery failed */
  error?: string;
  /** Delivery timestamp */
  deliveredAt?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createMessage(
  from: string,
  to: string[],
  type: MessageType,
  body: MessageBody,
  opts: {
    priority?: MessagePriority;
    correlationId?: string;
    inReplyTo?: string;
    headers?: Record<string, string>;
    ttlMs?: number;
  } = {}
): SwarmMessage {
  return {
    header: {
      id: generateId(),
      from,
      to,
      type,
      priority: opts.priority ?? 'normal',
      timestamp: Date.now(),
      correlationId: opts.correlationId,
      inReplyTo: opts.inReplyTo,
      headers: opts.headers ?? {},
      ttlMs: opts.ttlMs ?? 0,
    },
    body,
  };
}

export function createRequest(
  from: string,
  to: string,
  action: string,
  parameters: Record<string, unknown>,
  opts: {
    summary?: string;
    timeoutMs?: number;
    priority?: MessagePriority;
    correlationId?: string;
  } = {}
): RequestMessage {
  const message = createMessage(from, [to], 'request', {
    summary: opts.summary ?? `Request: ${action}`,
    payload: { action, parameters, timeoutMs: opts.timeoutMs ?? 30000 },
    attachments: [],
  }, { priority: opts.priority, correlationId: opts.correlationId });

  return message as RequestMessage;
}

export function createResponse(
  from: string,
  to: string,
  inReplyTo: string,
  status: 'ok' | 'error' | 'timeout',
  opts: {
    data?: Record<string, unknown>;
    error?: string;
    summary?: string;
    priority?: MessagePriority;
  } = {}
): ResponseMessage {
  const message = createMessage(from, [to], 'response', {
    summary: opts.summary ?? `Response to ${inReplyTo}`,
    payload: { status, data: opts.data, error: opts.error },
    attachments: [],
  }, { priority: opts.priority, inReplyTo });

  return message as ResponseMessage;
}

export function createBroadcast(
  from: string,
  topic: string,
  payload: Record<string, unknown>,
  opts: {
    excludedAgents?: string[];
    summary?: string;
    priority?: MessagePriority;
  } = {}
): BroadcastMessage {
  const message = createMessage(from, [], 'broadcast', {
    summary: opts.summary ?? `Broadcast: ${topic}`,
    payload: { topic, excludedAgents: opts.excludedAgents ?? [] },
    attachments: [],
  }, { priority: opts.priority });

  return message as BroadcastMessage;
}

export function createDirective(
  from: string,
  targetAgentIds: string[],
  command: string,
  parameters: Record<string, unknown>,
  opts: {
    summary?: string;
    requiresAck?: boolean;
    priority?: MessagePriority;
  } = {}
): DirectiveMessage {
  const message = createMessage(from, targetAgentIds, 'directive', {
    summary: opts.summary ?? `Directive: ${command}`,
    payload: { command, targetAgentIds, parameters, requiresAck: opts.requiresAck ?? false },
    attachments: [],
  }, { priority: opts.priority });

  return message as DirectiveMessage;
}

export function createHeartbeat(
  from: string,
  status: 'healthy' | 'degraded' | 'unhealthy',
  load: number,
  activeTasks: number
): HeartbeatMessage {
  const message = createMessage(from, [], 'heartbeat', {
    summary: `Heartbeat: ${status}`,
    payload: { status, load, activeTasks },
    attachments: [],
  });

  return message as HeartbeatMessage;
}

export function createErrorMessage(
  from: string,
  to: string[],
  errorCode: string,
  errorMessage: string,
  opts: {
    stackTrace?: string;
    recoverable?: boolean;
    inReplyTo?: string;
    priority?: MessagePriority;
  } = {}
): ErrorMessage {
  const message = createMessage(from, to, 'error', {
    summary: `Error: ${errorCode}`,
    payload: {
      errorCode,
      errorMessage,
      stackTrace: opts.stackTrace,
      recoverable: opts.recoverable ?? true,
    },
    attachments: [],
  }, { priority: opts.priority ?? 'high', inReplyTo: opts.inReplyTo });

  return message as ErrorMessage;
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

export function serializeMessage(message: SwarmMessage): MessageEnvelope {
  const data = JSON.stringify(message);
  return {
    data,
    format: 'json',
    checksum: Buffer.from(data).toString('base64').slice(0, 16),
  };
}

export function deserializeMessage(envelope: MessageEnvelope): SwarmMessage {
  if (envelope.format !== 'json') {
    throw new Error(`Unsupported serialization format: ${envelope.format}`);
  }
  const parsed = JSON.parse(envelope.data) as SwarmMessage;
  return parsed;
}

// ---------------------------------------------------------------------------
// Router (in-memory, for single-process coordination)
// ---------------------------------------------------------------------------

interface HandlerEntry {
  handler: (message: SwarmMessage) => Promise<void>;
}

export function createMessageRouter(): MessageRouter {
  const handlers = new Map<string, HandlerEntry>();

  return {
    async route(message: SwarmMessage): Promise<MessageDeliveryResult> {
      // Check TTL
      if (message.header.ttlMs > 0) {
        const elapsed = Date.now() - message.header.timestamp;
        if (elapsed > message.header.ttlMs) {
          return {
            delivered: false,
            targetAgentId: message.header.to[0] ?? 'unknown',
            error: 'Message TTL expired',
          };
        }
      }

      const results: MessageDeliveryResult[] = [];
      for (const targetId of message.header.to) {
        const entry = handlers.get(targetId);
        if (!entry) {
          results.push({
            delivered: false,
            targetAgentId: targetId,
            error: 'No handler registered for agent',
          });
          continue;
        }

        try {
          await entry.handler(message);
          results.push({
            delivered: true,
            targetAgentId: targetId,
            deliveredAt: Date.now(),
          });
        } catch (err) {
          results.push({
            delivered: false,
            targetAgentId: targetId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // If no specific targets, return a default result
      if (message.header.to.length === 0) {
        return {
          delivered: true,
          targetAgentId: 'broadcast',
          deliveredAt: Date.now(),
        };
      }

      const failed = results.filter((r) => !r.delivered);
      return failed.length === 0 ? results[0]! : failed[0]!;
    },

    registerHandler(agentId: string, handler: (message: SwarmMessage) => Promise<void>): void {
      handlers.set(agentId, { handler });
    },

    unregisterHandler(agentId: string): boolean {
      return handlers.delete(agentId);
    },
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateMessage(message: unknown): message is SwarmMessage {
  if (typeof message !== 'object' || message === null) return false;
  const m = message as Record<string, unknown>;

  if (typeof m.header !== 'object' || m.header === null) return false;
  const h = m.header as Record<string, unknown>;

  if (typeof h.id !== 'string') return false;
  if (typeof h.from !== 'string') return false;
  if (!Array.isArray(h.to)) return false;
  if (typeof h.type !== 'string') return false;
  if (typeof h.timestamp !== 'number') return false;

  if (typeof m.body !== 'object' || m.body === null) return false;
  const b = m.body as Record<string, unknown>;
  if (typeof b.summary !== 'string') return false;
  if (typeof b.payload !== 'object' || b.payload === null) return false;

  return true;
}

export function isExpired(message: SwarmMessage): boolean {
  if (message.header.ttlMs <= 0) return false;
  return Date.now() - message.header.timestamp > message.header.ttlMs;
}

export function matchesRecipient(message: SwarmMessage, agentId: string): boolean {
  if (message.header.to.length === 0) return true; // Broadcast
  return message.header.to.includes(agentId);
}
