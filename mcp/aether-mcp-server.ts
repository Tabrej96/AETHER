#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Real Model Context Protocol (MCP) Server over stdio (GATE 04)
 * Created by Tabrej & AETHER Open-Source Contributors
 *
 * Transports:
 *   1. stdio (default, what .mcp.json clients launch): newline-delimited
 *      JSON-RPC 2.0 on stdin -> stdout. Log lines go to stderr only, so the
 *      protocol stream on stdout is never corrupted.
 *   2. CLI verification (non-protocol): `--list-tools` / `--call <tool>` for
 *      humans. These paths are NOT the protocol and are clearly labeled.
 *
 * Client wiring (.mcp.json):
 *   { "mcpServers": { "aether": { "command": "npx", "args": ["tsx", "mcp/aether-mcp-server.ts"] } } }
 */

import readline from 'node:readline';
import {
  McpEngine,
  MCP_PROTOCOL_VERSION,
  buildToolsManifest,
  ToolPermissionPolicy,
} from '../src/core/mcp/mcpProtocol';
import { executeMcpToolCall, AETHER_MCP_TOOLS } from '../src/core/mcpServerEngine';

function logErr(...args: unknown[]): void {
  // protocol output must stay on stdout; diagnostics go to stderr
  process.stderr.write(`${args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`);
}

/** Parse operator-provided permission policy from env (JSON) — least-privilege by default. */
function loadPermissionPolicy(): ToolPermissionPolicy | undefined {
  const raw = process.env.AETHER_MCP_PERMISSION_POLICY;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as {
      deniedTools?: string[];
      requireApprovalFor?: string[];
      approvedTools?: string[];
    };
    return {
      deniedTools: parsed.deniedTools,
      requireApprovalFor: parsed.requireApprovalFor,
      approvals: new Set(parsed.approvedTools ?? []),
    };
  } catch {
    logErr('[aether-mcp] WARNING: AETHER_MCP_PERMISSION_POLICY is not valid JSON; ignoring it.');
    return undefined;
  }
}

function runStdioProtocol(): void {
  const engine = new McpEngine({
    serverInfo: { name: 'aether-mcp-server', version: '1.0.0', author: 'Tabrej', license: 'Apache-2.0' },
    permissionPolicy: loadPermissionPolicy(),
    onNotification: (method) => {
      if (method !== 'notifications/initialized') logErr(`[aether-mcp] notification received: ${method}`);
    },
  });

  logErr(`[aether-mcp] AETHER MCP server starting (protocol ${MCP_PROTOCOL_VERSION}, ${buildToolsManifest().length} tools, JSON-RPC 2.0 over stdio)`);

  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  let closed = false;
  rl.on('line', (line) => {
    if (closed) return;
    for (const outLine of engine.handleLine(line)) {
      process.stdout.write(`${outLine}\n`);
    }
  });
  rl.on('close', () => {
    // Clean server-lifecycle shutdown when the client closes the pipe.
    closed = true;
    logErr('[aether-mcp] stdin closed; shutting down.');
    process.exit(0);
  });
}

function runCliVerification(args: string[]): void {
  if (args.includes('--list-tools')) {
    // HUMAN-ONLY verification path (not an MCP protocol surface).
    console.log(
      JSON.stringify(
        {
          note: 'CLI tool listing (verification only). The MCP protocol is the stdio mode of this file.',
          protocolVersion: MCP_PROTOCOL_VERSION,
          tools: buildToolsManifest().map((t) => ({ name: t.name, title: t.title, inputSchema: t.inputSchema })),
        },
        null,
        2
      )
    );
    return;
  }

  const callIdx = args.indexOf('--call');
  if (callIdx !== -1) {
    const toolName = args[callIdx + 1] || 'aether_skill_router';
    const promptIdx = args.indexOf('--prompt');
    const taskPrompt =
      promptIdx !== -1 && args[promptIdx + 1] ? args[promptIdx + 1] : 'Harden AWS IAM role and configure WireGuard VPS mesh';
    const payload: Record<string, unknown> = { ...AETHER_MCP_TOOLS.find((t) => t.name === toolName)?.samplePayload, taskPrompt };
    const response = executeMcpToolCall(toolName, payload);
    console.log(JSON.stringify(response, null, 2));
    return;
  }

  // No CLI flag: this file is being spawned as an MCP server, so run the protocol.
  runStdioProtocol();
}

{
  // The stdio protocol is the default behavior; CLI flags are opt-in.
  const cliFlags = ['--list-tools', '--call'];
  if (cliFlags.some((f) => process.argv.slice(2).includes(f))) {
    runCliVerification(process.argv.slice(2));
  } else {
    runStdioProtocol();
  }
}
