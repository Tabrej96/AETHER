/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 04: Model Context Protocol engine (JSON-RPC 2.0)
 * (src/core/mcp/mcpProtocol.ts)
 *
 * A real, dependency-free MCP server engine speaking the Model Context Protocol
 * over newline-delimited JSON-RPC 2.0 (the stdio transport):
 *   - initialize / capability negotiation (tools, resources, prompts),
 *   - notifications/initialized, tools/list, tools/call,
 *   - resources/list, resources/read, prompts/list, prompts/get, ping,
 *   - structured JSON-RPC errors (-32700, -32600, -32601, -32602),
 *   - tool permission enforcement (configurable per-tool gate),
 *   - server lifecycle (must initialize before calls; clean close).
 *
 * A CLI that prints JSON is NOT an MCP server; this module is the protocol
 * itself, and is certified against independent clients in mcp-protocol.test.ts.
 */

import { AETHER_MCP_TOOLS, executeMcpToolCall, McpToolSchema } from '../mcpServerEngine';

export const MCP_PROTOCOL_VERSION = '2025-06-18';
export const MCP_SUPPORTED_VERSIONS: readonly string[] = [MCP_PROTOCOL_VERSION, '2024-11-05'];

export const JSONRPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  /** MCP-specific application error: a tool exists but is blocked by policy. */
  TOOL_PERMISSION_DENIED: -32001,
} as const;

export interface JsonRpcRequest {
  jsonrpc?: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: string | number | null; result: unknown }
  | { jsonrpc: '2.0'; id: string | number | null; error: { code: number; message: string; data?: unknown } };

export interface ToolPermissionPolicy {
  /** tools the operator has explicitly denied; any call to these is rejected with TOOL_PERMISSION_DENIED */
  deniedTools?: string[];
  /** if true, tools/call requires a prior explicit approval token (per tool id) */
  requireApprovalFor?: string[];
  approvals?: Set<string>;
}

export interface McpSessionState {
  initialized: boolean;
  negotiatedVersion: string | null;
  clientInfo?: { name?: string; version?: string };
}

export interface McpEngineOptions {
  serverInfo: { name: string; version: string; author?: string; license?: string };
  permissionPolicy?: ToolPermissionPolicy;
  /** hook for notifications (no response sent) */
  onNotification?: (method: string, params: Record<string, unknown>) => void;
}

/** Derive the tool/resource/prompt manifests the server advertises. */
export function buildToolsManifest(): Array<{ name: string; title: string; description: string; inputSchema: unknown; annotations?: Record<string, unknown> }> {
  return AETHER_MCP_TOOLS.map((t) => ({
    name: t.name,
    title: t.title,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}

export function buildResourcesManifest(): Array<{ uri: string; name: string; description: string }> {
  return [
    { uri: 'aether://registry/integration', name: 'Integration Registry', description: 'Capability registry (9 research programs) with lifecycle + benchmark evidence.' },
    { uri: 'aether://registry/tools', name: 'Tool Manifest', description: `Full ${AETHER_MCP_TOOLS.length}-tool manifest with input schemas.` },
  ];
}

export function buildPromptsManifest(): Array<{ name: string; description: string; arguments?: unknown[] }> {
  return [
    {
      name: 'security-review',
      description: 'Compose the adversarial + security review prompt for a diff, using the security spotlighter tool.',
      arguments: [{ name: 'diff', required: true, description: 'The unified diff under review' }],
    },
  ];
}

/** The MCP resource/prompt bodies are deterministic in-memory payloads. */
function resourceBody(uri: string): string {
  if (uri === 'aether://registry/tools') {
    return JSON.stringify(buildToolsManifest(), null, 2);
  }
  return JSON.stringify({ note: 'Run `npx tsx scripts/generate-integration-registry.ts` to render the live registry.', toolCount: AETHER_MCP_TOOLS.length }, null, 2);
}

function promptBody(name: string, args: Record<string, unknown>): string {
  if (name === 'security-review') {
    return [
      'Review the diff below with AETHER\'s 6-challenger adversarial gate.',
      'Block on: SQLi, eval/RCE, unbounded loops, license conflicts, missing tests.',
      `DIFF:\n${String(args.diff ?? '(no diff supplied)')}`,
    ].join('\n');
  }
  return '';
}

/**
 * The protocol engine: hand a raw (newline-delimited) JSON string and get back
 * zero or more response lines (strings), ready to write to stdout. This keeps
 * the engine transport-agnostic so any two independent clients can drive it.
 */
export class McpEngine {
  private readonly state: McpSessionState = { initialized: false, negotiatedVersion: null };

  constructor(private readonly opts: McpEngineOptions) {}

  /** Handle one raw line of input. Returns response lines to emit ([] for notifications). */
  handleLine(raw: string): string[] {
    if (raw.trim().length === 0) return [];

    let msg: unknown;
    try {
      msg = JSON.parse(raw);
    } catch {
      // Malformed JSON with no id recoverable: JSON-RPC -32700.
      return [JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: JSONRPC_ERRORS.PARSE_ERROR, message: 'Parse error (malformed JSON)' } })];
    }

    const req = msg as JsonRpcRequest;
    if (typeof req !== 'object' || req === null || req.jsonrpc !== '2.0' || typeof req.method !== 'string') {
      const id = (req as { id?: unknown })?.id ?? null;
      return [JSON.stringify({ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.INVALID_REQUEST, message: 'Invalid Request (missing jsonrpc=2.0 / method)' } })];
    }

    const isNotification = req.id === undefined || req.id === null;
    const out = this.dispatch(req, isNotification);
    return out.map((o) => (typeof o === 'string' ? o : JSON.stringify(o)));
  }

  private dispatch(req: JsonRpcRequest, isNotification: boolean): Array<string | JsonRpcResponse> {
    const id = req.id ?? null;

    switch (req.method) {
      case 'initialize': {
        const params = (req.params ?? {}) as { protocolVersion?: string; clientInfo?: { name?: string; version?: string } };
        const want = params.protocolVersion;
        const negotiated: string =
          typeof want === 'string' && MCP_SUPPORTED_VERSIONS.includes(want) ? want : MCP_PROTOCOL_VERSION;
        this.state.initialized = true;
        this.state.negotiatedVersion = negotiated;
        this.state.clientInfo = params.clientInfo;
        return [{
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: negotiated,
            serverInfo: this.opts.serverInfo,
            capabilities: {
              tools: { listChanged: false },
              resources: {},
              prompts: {},
            },
            instructions: 'AETHER deterministic engineering tools. Call tools/list to discover; tool calls are read-only computations except where a tool is gated by policy.',
          },
        }];
      }

      case 'notifications/initialized':
        this.opts.onNotification?.(req.method, (req.params ?? {}) as Record<string, unknown>);
        return [];

      case 'ping':
        return [{ jsonrpc: '2.0', id, result: {} }];

      case 'tools/list':
        if (!this.state.initialized) return [this.notInitializedResponse(id)];
        return [{ jsonrpc: '2.0', id, result: { tools: buildToolsManifest(), nextCursor: null } }];

      case 'tools/call': {
        if (!this.state.initialized) return [this.notInitializedResponse(id)];
        const params = (req.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
        if (!params || typeof params.name !== 'string') {
          return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.INVALID_PARAMS, message: 'tools/call requires params.name (string)' } }];
        }
        if (!AETHER_MCP_TOOLS.some((t) => t.name === params!.name)) {
          return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.METHOD_NOT_FOUND, message: `unknown tool: ${params!.name}` } }];
        }
        // Tool permission enforcement (gate 04 requirement).
        const policy = this.opts.permissionPolicy;
        if (policy) {
          if (policy.deniedTools?.includes(params.name)) {
            return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.TOOL_PERMISSION_DENIED, message: `tool "${params.name}" is denied by operator policy`, data: { tool: params.name } } }];
          }
          if (policy.requireApprovalFor?.includes(params.name) && !(policy.approvals?.has(params.name))) {
            return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.TOOL_PERMISSION_DENIED, message: `tool "${params.name}" requires operator approval; grant via the approval channel first`, data: { tool: params.name, requiresApproval: true } } }];
          }
        }
        let result;
        try {
          result = executeMcpToolCall(params.name, params.arguments ?? {});
        } catch (err) {
          return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.INTERNAL_ERROR, message: `tool execution failed: ${(err as Error).message}` } }];
        }
        return [{
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            isError: result.status === 'BLOCKED_BY_SECURITY_GATE',
            structuredContent: { toolName: result.toolName, status: result.status },
          },
        }];
      }

      case 'resources/list':
        if (!this.state.initialized) return [this.notInitializedResponse(id)];
        return [{ jsonrpc: '2.0', id, result: { resources: buildResourcesManifest(), nextCursor: null } }];

      case 'resources/read': {
        if (!this.state.initialized) return [this.notInitializedResponse(id)];
        const uri = String(((req.params ?? {}) as { uri?: string }).uri ?? '');
        if (uri !== 'aether://registry/integration' && uri !== 'aether://registry/tools') {
          return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.INVALID_PARAMS, message: `unknown resource uri: ${uri}` } }];
        }
        return [{
          jsonrpc: '2.0',
          id,
          result: { contents: [{ uri, mimeType: 'application/json', text: resourceBody(uri) }] },
        }];
      }

      case 'prompts/list':
        if (!this.state.initialized) return [this.notInitializedResponse(id)];
        return [{ jsonrpc: '2.0', id, result: { prompts: buildPromptsManifest(), nextCursor: null } }];

      case 'prompts/get': {
        if (!this.state.initialized) return [this.notInitializedResponse(id)];
        const p = (req.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
        if (!buildPromptsManifest().some((x) => x.name === p?.name)) {
          return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.METHOD_NOT_FOUND, message: `unknown prompt: ${p?.name}` } }];
        }
        return [{
          jsonrpc: '2.0',
          id,
          result: {
            description: 'AETHER prompt template',
            messages: [{ role: 'user', content: { type: 'text', text: promptBody(p.name!, p.arguments ?? {}) } }],
          },
        }];
      }

      default:
        if (isNotification) {
          this.opts.onNotification?.(req.method, (req.params ?? {}) as Record<string, unknown>);
          return [];
        }
        return [{ jsonrpc: '2.0', id, error: { code: JSONRPC_ERRORS.METHOD_NOT_FOUND, message: `method not found: ${req.method}` } }];
    }
  }

  /** Structured error for requests issued before `initialize`. */
  private notInitializedResponse(id: string | number | null): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: JSONRPC_ERRORS.INVALID_REQUEST, message: 'MCP server not initialized: send initialize first' },
    };
  }

  get session() {
    return this.state;
  }
}
