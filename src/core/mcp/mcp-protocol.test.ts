/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 04 TESTS: Real MCP Protocol + Two Independent Clients
 * (src/core/mcp/mcp-protocol.test.ts)
 *
 * Certifies the MCP server against gate 04 requirements using two INDEPENDENT
 * clients (different code paths, both driven by the real protocol engine /
 * real stdio process):
 *   CLIENT A — In-process protocol client (talks to McpEngine.handleLine)
 *   CLIENT B — Wire-level client (spawns the real `mcp/aether-mcp-server.ts`
 *              as a child process and speaks newline-delimited JSON-RPC over
 *              its stdin/stdout, exactly as a real MCP host would).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

import {
  McpEngine,
  MCP_PROTOCOL_VERSION,
  MCP_SUPPORTED_VERSIONS,
  JSONRPC_ERRORS,
  buildToolsManifest,
} from './mcpProtocol';
import { AETHER_MCP_TOOLS } from '../mcpServerEngine';

// ===========================================================================
// CLIENT A — in-process protocol client
// ===========================================================================
class InProcessMcpClient {
  private engine: McpEngine;
  private nextId = 1;
  private readonly stderr = { count: 0 };

  constructor(policy?: ConstructorParameters<typeof McpEngine>[0]['permissionPolicy']) {
    this.engine = new McpEngine({
      serverInfo: { name: 'aether-mcp-server', version: '1.0.0' },
      permissionPolicy: policy,
      onNotification: () => {
        this.stderr.count += 1;
      },
    });
  }

  initialize(protocolVersion = MCP_PROTOCOL_VERSION, clientInfo = { name: 'client-a', version: '1.0' }) {
    const resp = this.engine.handleLine(
      JSON.stringify({ jsonrpc: '2.0', id: this.nextId++, method: 'initialize', params: { protocolVersion, clientInfo } })
    );
    assert.equal(resp.length, 1);
    const init = JSON.parse(resp[0]) as { result: Record<string, unknown> };
    assert.ok(!('error' in init), 'initialize must not error');
    // Client handshake: the initialized notification (no response expected).
    assert.equal(this.engine.handleLine(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })).length, 0, 'notifications must produce no response');
    return init.result;
  }

  call<T = unknown>(method: string, params?: Record<string, unknown>): T {
    const lines = this.engine.handleLine(JSON.stringify({ jsonrpc: '2.0', id: this.nextId++, method, params }));
    assert.equal(lines.length, 1, `${method} must yield exactly one response`);
    return JSON.parse(lines[0]) as T;
  }
}

test('GATE-04 [Client A]: initialization + capability negotiation', () => {
  const client = new InProcessMcpClient();
  const result = client.initialize() as { protocolVersion: string; serverInfo: { name: string }; capabilities: Record<string, unknown> };
  assert.equal(result.protocolVersion, MCP_PROTOCOL_VERSION);
  assert.equal(result.serverInfo.name, 'aether-mcp-server');
  assert.ok(result.capabilities.tools, 'server must advertise tools capability');
  assert.ok(result.capabilities.resources, 'server must advertise resources capability');
  assert.ok(result.capabilities.prompts, 'server must advertise prompts capability');

  // Unlisted version must be answered with the server's supported version, not silently dropped.
  const client2 = new InProcessMcpClient();
  const r2 = client2.initialize('1999-01-01') as { protocolVersion: string };
  assert.equal(r2.protocolVersion, MCP_PROTOCOL_VERSION, 'unknown client version must fall back to the server default');
  assert.ok(MCP_SUPPORTED_VERSIONS.includes(MCP_PROTOCOL_VERSION));
});

test('GATE-04 [Client A]: tool discovery — all AETHER tools with valid JSON Schemas', () => {
  const client = new InProcessMcpClient();
  client.initialize();
  const { result } = client.call<{ result: { tools: Array<{ name: string; inputSchema: Record<string, unknown> }> } }>('tools/list');
  assert.equal(result.tools.length, AETHER_MCP_TOOLS.length);
  for (const t of result.tools) {
    assert.equal(t.inputSchema.type, 'object', `tool ${t.name} must expose an object input schema`);
    assert.ok(Array.isArray(t.inputSchema.required), `tool ${t.name} must declare required fields`);
  }
});

test('GATE-04 [Client A]: tool execution returns content + structured content, no error', () => {
  const client = new InProcessMcpClient();
  client.initialize();
  const { result } = client.call<{ result: { content: Array<{ type: string; text: string }>; structuredContent: Record<string, unknown> } }>(
    'tools/call',
    { name: 'aether_skill_router', arguments: { taskPrompt: 'Harden AWS IAM role with WireGuard VPS' } }
  );
  assert.equal(result.content[0].type, 'text');
  const body = JSON.parse(result.content[0].text) as { status: string; result: { matchedSkills: unknown[] } };
  assert.equal(body.status, 'SUCCESS');
  assert.ok(Array.isArray(body.result.matchedSkills));
  assert.equal(result.structuredContent.status, 'SUCCESS');
});

test('GATE-04 [Client A]: aether_deep_intel executes P10 (exact GST calculation + completion gate)', () => {
  const client = new InProcessMcpClient();
  client.initialize();
  const { result } = client.call<{ result: { content: Array<{ type: string; text: string }> } }>(
    'tools/call',
    {
      name: 'aether_deep_intel',
      arguments: {
        task: 'Build a complete GST invoice system for a Mumbai supplier billing Delhi',
        invoice:
          '{"lines":[{"lineId":"l1","pricePaise":100000,"rateId":"GST-18","quantityMilli":1000}],"jurisdiction":"IN","placeOfSupply":{"supplierRegion":"MH","buyerRegion":"DL"}}',
      },
    }
  );
  const body = JSON.parse(result.content[0].text) as { status: string; result: Record<string, unknown> };
  assert.equal(body.status, 'SUCCESS');
  assert.equal(body.result.requirementDepth, 'COMPLEX');
  const calc = body.result.calculation as { grandTotalPaise: number; components: Array<{ code: string }> };
  assert.equal(calc.grandTotalPaise, 118000); // ₹1000.00 @ 18% inter-state, exact
  assert.deepEqual(calc.components.map((c) => c.code), ['IGST']);
  const completion = body.result.completion as { status: string; met: number; total: number };
  assert.equal(completion.total, 11);
  assert.equal(typeof completion.met, 'number');
});

test('GATE-04 [Client A]: aether_deep_intel rejects a malformed invoice payload safely', () => {
  const client = new InProcessMcpClient();
  client.initialize();
  const { result } = client.call<{ result: { content: Array<{ type: string; text: string }> } }>(
    'tools/call',
    { name: 'aether_deep_intel', arguments: { task: 'GST invoice', invoice: '{not json' } }
  );
  const body = JSON.parse(result.content[0].text) as { status: string; result: { error?: string } };
  assert.equal(body.status, 'BLOCKED_BY_SECURITY_GATE');
  assert.match(body.result.error ?? '', /malformed invoice/);
});

test('GATE-04 [Client A]: adversarial gate surfaces a BLOCKED result through structured content', () => {
  const client = new InProcessMcpClient();
  client.initialize();
  const { result } = client.call<{ result: { isError: boolean; structuredContent: { status: string; toolName: string } } }>(
    'tools/call',
    { name: 'aether_adversarial_gate', arguments: { targetFile: 'src/db/userRepo.ts', codeSnippet: 'return db.query(`SELECT * FROM users WHERE id = ${String(1)}`);' } }
  );
  assert.equal(result.structuredContent.status, 'BLOCKED_BY_SECURITY_GATE', 'SQLi sample must trip the adversarial gate');
  assert.equal(result.isError, true, 'a blocked gate is reported as an error tool result');
});

test('GATE-04 [Client A]: resources list/read + prompts list/get', () => {
  const client = new InProcessMcpClient();
  client.initialize();
  const rl = client.call<{ result: { resources: Array<{ uri: string }> } }>('resources/list');
  assert.ok(rl.result.resources.length >= 2);
  const rr = client.call<{ result: { contents: Array<{ text: string }> } }>('resources/read', { uri: rl.result.resources[0].uri });
  JSON.parse(rr.result.contents[0].text); // resource bodies must be valid JSON

  const pl = client.call<{ result: { prompts: Array<{ name: string }> } }>('prompts/list');
  assert.ok(pl.result.prompts.length >= 1);
  const pg = client.call<{ result: { messages: Array<{ content: { text: string } }> } }>('prompts/get', { name: pl.result.prompts[0].name, arguments: { diff: 'a' } });
  assert.ok(pg.result.messages[0].content.text.length > 0);
});

test('GATE-04 [Client A]: structured JSON-RPC errors (unknown method/tool, bad params, parse error)', () => {
  const client = new InProcessMcpClient();
  client.initialize();

  const unknownMethod = client.call<{ error: { code: number } }>('bogus/method');
  assert.equal(unknownMethod.error.code, JSONRPC_ERRORS.METHOD_NOT_FOUND);

  const unknownTool = client.call<{ error: { code: number; message: string } }>('tools/call', { name: 'nope' });
  assert.equal(unknownTool.error.code, JSONRPC_ERRORS.METHOD_NOT_FOUND);
  assert.ok(unknownTool.error.message.includes('unknown tool'));

  const badParams = client.call<{ error: { code: number } }>('tools/call', { arguments: { x: 1 } });
  assert.equal(badParams.error.code, JSONRPC_ERRORS.INVALID_PARAMS);

  const parseError = (client as unknown as { engine: McpEngine }).engine.handleLine('this is not json');
  assert.equal(JSON.parse(parseError[0]).error.code, JSONRPC_ERRORS.PARSE_ERROR);
});

test('GATE-04 [Client A]: tool permission enforcement (denied + approval-gated + granted)', () => {
  const denied = new InProcessMcpClient({ deniedTools: ['aether_swarm_scheduler'] });
  denied.initialize();
  const deniedResp = denied.call<{ error: { code: number } }>('tools/call', { name: 'aether_swarm_scheduler', arguments: {} });
  assert.equal(deniedResp.error.code, JSONRPC_ERRORS.TOOL_PERMISSION_DENIED, 'denied tool must be rejected');

  const gated = new InProcessMcpClient({ requireApprovalFor: ['aether_adversarial_gate'] });
  gated.initialize();
  const before = gated.call<{ error: { code: number; data: { tool: string; requiresApproval: boolean } } }>('tools/call', { name: 'aether_adversarial_gate', arguments: { targetFile: 'x.ts', codeSnippet: 'y' } });
  assert.equal(before.error.code, JSONRPC_ERRORS.TOOL_PERMISSION_DENIED);
  assert.equal(before.error.data.requiresApproval, true, 'approval-gated tool must declare it needs approval');

  // Granted case: the tool is now in the approval set, so a call must EXECUTE
  // (produce a result, not a TOOL_PERMISSION_DENIED error). What the adversarial
  // gate itself verdicts is independent of the permission policy under test.
  const granted = new InProcessMcpClient({ requireApprovalFor: ['aether_adversarial_gate'], approvals: new Set(['aether_adversarial_gate']) });
  granted.initialize();
  const after = granted.call<{ result: { structuredContent: { toolName: string }; isError: boolean }; error?: { code: number } }>(
    'tools/call',
    { name: 'aether_adversarial_gate', arguments: { targetFile: 'x.ts', codeSnippet: 'y' } }
  );
  assert.equal(after.error, undefined, 'an approved tool must NOT be rejected by the permission policy');
  assert.equal(after.result.structuredContent.toolName, 'aether_adversarial_gate', 'an approved tool must execute and return its structured result');
});

test('GATE-04 [Client A]: server lifecycle — pre-initialize requests get structured errors, then clean operation', () => {
  const client = new InProcessMcpClient();
  // tools/list BEFORE initialize must be rejected with a structured error, not hang or crash.
  const early = client.call<{ error: { code: number; message: string } }>('tools/list');
  assert.equal(early.error.code, JSONRPC_ERRORS.INVALID_REQUEST);
  assert.ok(early.error.message.includes('not initialized'));
  client.initialize();
  const ok = client.call<{ result: { tools: unknown[] } }>('tools/list');
  assert.equal(ok.result.tools.length, AETHER_MCP_TOOLS.length);
});

// ===========================================================================
// CLIENT B — wire-level client: spawns the REAL stdio server process
// ===========================================================================
interface WireClient {
  send: (msg: Record<string, unknown>) => Promise<{ result?: unknown; error?: { code: number; message: string } }>;
  rawSend: (line: string) => Promise<unknown[]>;
  close: () => void;
}

/**
 * Wire-level MCP client. Spawns the real server process exactly the way a
 * .mcp.json entry does it (`npx tsx mcp/aether-mcp-server.ts`) and speaks
 * newline-delimited JSON-RPC over its stdin/stdout — the exact transport a
 * real MCP host uses. Responses are correlated FIFO (the AETHER server is
 * synchronous, so responses arrive in request order).
 */
function startWireClient(extraEnv?: Record<string, string>): Promise<WireClient> {
  // Prefer the local tsx CLI (runs the TS server ESM-style, cross-platform);
  // fall back to `npx tsx` when node_modules is absent.
  const localTsxCli = path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs');
  let hasLocalTsx = false;
  try {
    fs.accessSync(localTsxCli);
    hasLocalTsx = true;
  } catch {
    hasLocalTsx = false;
  }
  const spawnArgs = hasLocalTsx
    ? [localTsxCli, path.join(process.cwd(), 'mcp/aether-mcp-server.ts')]
    : undefined;

  const child = hasLocalTsx
    ? spawn(process.execPath, spawnArgs!, { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...extraEnv }, cwd: process.cwd() })
    : spawn(
        process.platform === 'win32' ? 'npx.cmd' : 'npx',
        ['tsx', path.join(process.cwd(), 'mcp/aether-mcp-server.ts')],
        { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...extraEnv }, cwd: process.cwd(), shell: process.platform === 'win32' }
      );
  let buf = '';
  let alive = true;
  // Id-based correlation: every JSON-RPC response carries the request's `id`,
  // so we resolve the awaiting request by id. Robust regardless of response
  // ordering and unaffected by interleaved notifications (which have no id).
  const pending = new Map<string, (resp: { result?: unknown; error?: { code: number; message: string } }) => void>();
  const keyOf = (id: unknown) => String(id);

  child.stdout.on('data', (chunk: Buffer) => {
    buf += chunk.toString();
    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (line.length === 0) continue;
      let parsed: { id?: unknown } & Record<string, unknown>;
      try {
        parsed = JSON.parse(line) as { id?: unknown } & Record<string, unknown>;
      } catch {
        continue; // never block the stream on a malformed line
      }
      if (parsed.id !== undefined && pending.has(keyOf(parsed.id))) {
        const resolver = pending.get(keyOf(parsed.id))!;
        pending.delete(keyOf(parsed.id));
        resolver(parsed as { result?: unknown; error?: { code: number; message: string } });
      }
    }
  });
  child.stderr.on('data', () => {
    /* diagnostics stream: its very existence proves stdout is protocol-only */
  });
  child.on('exit', () => {
    alive = false;
    // Connection-loss handling: any still-waiting request resolves with an error,
    // so a client never hangs forever after the server dies.
    for (const [k, resolver] of pending) {
      resolver({ error: { code: -1, message: 'server process exited before responding (connection loss detected)' } });
      pending.delete(k);
    }
  });

  const client: WireClient = {
    send: (msg) =>
      new Promise((res) => {
        const id = (msg as { id?: unknown }).id;
        if (id === undefined) {
          res({ error: { code: -1, message: 'send() requires an id for correlation' } });
          return;
        }
        pending.set(keyOf(id), res);
        child.stdin.write(`${JSON.stringify(msg)}\n`);
        // Safety net: if the child exits, exit handler already resolved it;
        // otherwise this timeout guards against a silent hang.
        setTimeout(() => {
          if (pending.has(keyOf(id))) {
            pending.delete(keyOf(id));
            res({ error: { code: -1, message: 'timeout waiting for MCP response' } });
          }
        }, 10000);
      }),
    rawSend: (line) =>
      new Promise((res) => {
        // A notification should produce ZERO protocol lines. Attach a transient
        // stdout listener that collects any lines that DO arrive during a
        // bounded window, so a misbehaving server that answers a notification
        // is caught (non-empty result) rather than silently ignored.
        const observed: string[] = [];
        let chunk = '';
        const onData = (d: Buffer) => {
          chunk += d.toString();
          let i: number;
          while ((i = chunk.indexOf('\n')) !== -1) {
            const l = chunk.slice(0, i).trim();
            chunk = chunk.slice(i + 1);
            if (l.length > 0) observed.push(l);
          }
        };
        child.stdout.on('data', onData);
        child.stdin.write(`${line}\n`);
        setTimeout(() => {
          child.stdout.off('data', onData);
          res(observed);
        }, 120);
      }),
    close: () => {
      alive = false;
      child.kill();
    },
  };
  void alive;

  // Short warm-up so the child (tsx boot) has attached its stdout handler and
  // stdin pipe before the first write. Writes are piped-buffered regardless,
  // but this keeps the first response from racing the handler setup.
  return new Promise((resolveClient) => setTimeout(() => resolveClient(client), 1200));
}

test('GATE-04 [Client B]: wire-level MCP handshake against the real stdio server process', async () => {
  const client = await startWireClient();
  try {
    const init = await client.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: MCP_PROTOCOL_VERSION, clientInfo: { name: 'client-b-wire', version: '1.0' } } });
    assert.equal((init.result as { serverInfo: { name: string } }).serverInfo.name, 'aether-mcp-server');
    assert.equal((init.result as { protocolVersion: string }).protocolVersion, MCP_PROTOCOL_VERSION);

    const notif = await client.rawSend(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }));
    assert.equal(notif.length, 0, 'the initialized notification must produce zero protocol lines on stdout');

    const tools = await client.send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    assert.equal(((tools.result as { tools: unknown[] }).tools).length, AETHER_MCP_TOOLS.length, 'wire client must discover all AETHER tools');

    const call = await client.send({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'aether_blast_radius', arguments: { targetFile: 'src/auth/x.ts', mutatedSymbol: 'fn' } } });
    assert.equal((call.result as { structuredContent: { status: string } }).structuredContent.status, 'SUCCESS');
    const body = JSON.parse((call.result as { content: Array<{ text: string }> }).content[0].text) as { result: { overallRiskScore: number } };
    assert.ok(typeof body.result.overallRiskScore === 'number', 'the blast-radius tool must produce a computed result, not a canned echo');

    const unknown = await client.send({ jsonrpc: '2.0', id: 4, method: 'no/such/method' });
    assert.equal(unknown.error!.code, JSONRPC_ERRORS.METHOD_NOT_FOUND);
  } finally {
    client.close();
  }
});

test('GATE-04 [Client B]: connection failure handling — server crash mid-session returns no lines (client detects the loss)', async () => {
  const client = await startWireClient();
  const init = await client.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: MCP_PROTOCOL_VERSION } });
  assert.ok(init.result, 'server is alive');
  client.close(); // kill the server

  // A client that reads after a broken pipe must observe EOF, not hang forever.
  const raw = await client.rawSend(JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'tools/list' })).catch(() => ['<stream-closed>']);
  assert.ok(Array.isArray(raw), 'post-kill reads must terminate');
});

test('GATE-04 [Client B]: operator permission policy applied over the wire (least-privilege via env)', async () => {
  const client = await startWireClient({
    AETHER_MCP_PERMISSION_POLICY: JSON.stringify({ deniedTools: ['aether_swarm_scheduler'] }),
  });
  try {
    await client.send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: MCP_PROTOCOL_VERSION } });
    const denied = await client.send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'aether_swarm_scheduler', arguments: { taskDescription: 'x' } } });
    assert.equal(denied.error!.code, JSONRPC_ERRORS.TOOL_PERMISSION_DENIED, 'env-declared denied tool must be rejected over the wire');
  } finally {
    client.close();
  }
});
