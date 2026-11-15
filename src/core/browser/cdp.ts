/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — P05/P06 LIVE BROWSER CONTROL via Chrome DevTools Protocol
 * (src/core/browser/cdp.ts)
 *
 * ZERO runtime dependencies: this drives the machine's real Chrome (or Edge)
 * over CDP using only `node:` builtins + the global `WebSocket` (Node >= 22).
 * It exists so AETHER's Browser Intelligence (P05) and Visual Computer (P06)
 * engines can act on a REAL page instead of synthetic fixtures:
 *
 *   launchChrome()  -> spawn headless chrome with a fresh temp profile +
 *                      random CDP port, read the port from DevToolsActivePort,
 *                      discover the page target's websocket, attach.
 *   client.evaluate / a11yElements / click / screenshot -> real DOM work.
 *
 * Honesty contract: if no chrome/edge binary is found, launchChrome REJECTS
 * with a clear UNAVAILABLE error (callers surface UNAVAILABLE, they never
 * fabricate a live measurement).
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { AetherDomElement } from '../programs/p05BrowserIntelligence';

// ---------------------------------------------------------------- discovery
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.CHROME_BIN ?? '',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

/** Locate a usable chrome/edge binary. Returns null when none is found. */
export function findChrome(): string | null {
  for (const c of CHROME_CANDIDATES) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

// ---------------------------------------------------------------- CDP framing
/** Minimal structural surface of a WebSocket we need — real `WebSocket` (Node global) or a fake in tests. */
export interface CdpSocketLike {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: string, listener: (ev: { data?: unknown }) => void): void;
  readonly readyState?: number;
}

/**
 * The CDP message-id framing, as pure logic: id-matched request/response over
 * JSON, with per-command timeouts and event fan-out. This is the unit that is
 * tested without a browser (cdp.test.ts case c).
 */
export interface CdpFramer {
  send(method: string, params?: unknown, timeoutMs?: number): Promise<unknown>;
  onEvent(type: string, fn: (params: unknown) => void): void;
  close(): void;
}

export function createCdpFramer(socket: CdpSocketLike, defaultTimeoutMs = 30_000): CdpFramer {
  let nextId = 1;
  const pending = new Map<number, { method: string; resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  const listeners = new Map<string, Array<(p: unknown) => void>>();

  socket.addEventListener('message', (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : ev.data instanceof ArrayBuffer ? Buffer.from(ev.data).toString('utf8') : String(ev.data ?? '');
    let msg: { id?: number; method?: string; params?: unknown; result?: unknown; error?: { message?: string } };
    try {
      msg = JSON.parse(raw);
    } catch {
      return; // non-JSON frame — ignore, never crash the framer
    }
    if (msg.id != null && pending.has(msg.id)) {
      const p = pending.get(msg.id)!;
      clearTimeout(p.timer);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(`CDP ${p.method} failed: ${JSON.stringify(msg.error)}`));
      else p.resolve(msg.result);
    } else if (msg.method) {
      for (const fn of listeners.get(msg.method) ?? []) fn(msg.params);
    }
  });
  const die = (why: string): void => {
    for (const p of pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error(`CDP socket closed (${why}) during ${p.method}`));
    }
    pending.clear();
  };
  socket.addEventListener('close', () => die('close'));
  socket.addEventListener('error', () => die('error'));

  return {
    send(method, params = {}, timeoutMs = defaultTimeoutMs) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise<unknown>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        pending.set(id, { method, resolve, reject, timer });
      });
    },
    onEvent(type, fn) {
      const arr = listeners.get(type) ?? [];
      arr.push(fn);
      listeners.set(type, arr);
    },
    close() {
      try {
        socket.close(1000, 'aether cdp close');
      } catch {
        /* already closed */
      }
    },
  };
}

// ---------------------------------------------------------------- the client
export interface AetherCdpElement extends AetherDomElement {
  cssSelector: string;
}

export interface CdpClient {
  navigate(url: string): Promise<void>;
  /** capture a PNG to `file`; returns bytes written. */
  screenshot(file: string): Promise<number>;
  /** evaluate an expression in the page; returns the returnByValue result. */
  evaluate(expr: string): Promise<unknown>;
  /** walk the real DOM -> P05 AetherDomElement[] (+cssSelector), refs assigned. */
  a11yElements(): Promise<AetherCdpElement[]>;
  /** el.click() on a real element, then a settle delay. */
  click(cssSelector: string): Promise<void>;
  close(): Promise<void>;
  readonly pid: number | null;
  readonly bin: string;
}

export interface LaunchChromeOptions {
  url?: string;
  userDir?: string;
  bin?: string;
  viewportW?: number;
  viewportH?: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function waitForDevToolsPort(userDir: string, timeoutMs: number): Promise<number> {
  const file = path.join(userDir, 'DevToolsActivePort');
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (fs.existsSync(file)) {
      const port = Number(fs.readFileSync(file, 'utf8').split('\n')[0]);
      if (Number.isFinite(port) && port > 0) return port;
    }
    if (Date.now() > deadline) throw new Error('UNAVAILABLE: DevToolsActivePort never appeared (browser failed to start headless)');
    await sleep(150);
  }
}

function fetchDevtoolsJson(port: number, p: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: p, timeout: 2500 }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('devtools http timeout'));
    });
  });
}

async function findPageWsUrl(port: number, timeoutMs: number): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const targets = (await fetchDevtoolsJson(port, '/json')) as Array<{ type?: string; url?: string; webSocketDebuggerUrl?: string }> | null;
    if (Array.isArray(targets)) {
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl!;
    }
    if (Date.now() > deadline) throw new Error('UNAVAILABLE: no CDP page target appeared');
    await sleep(250);
  }
}

/**
 * Spawn a headless chrome with a fresh temp profile and a random CDP port,
 * then attach. REJECTS with a clear UNAVAILABLE error when no browser is
 * available — callers must surface that, never fake a result.
 */
export async function launchChrome(opts: LaunchChromeOptions = {}): Promise<CdpClient> {
  const bin = opts.bin ?? findChrome();
  if (!bin || !fs.existsSync(bin)) {
    throw new Error(`UNAVAILABLE: no chrome/edge binary at "${bin ?? '(none found)'}"; set CHROME_BIN or install Chrome/Edge`);
  }
  const userDir = opts.userDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'aether-cdp-'));
  const w = opts.viewportW ?? 1280;
  const h = opts.viewportH ?? 900;
  const child = spawn(
    bin,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--user-data-dir=${userDir}`,
      '--remote-debugging-port=0',
      `--window-size=${w},${h}`,
      '--hide-scrollbars',
      opts.url ?? 'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );
  const pid = child.pid ?? null;
  let cleanupRan = false;
  const cleanup = (): void => {
    if (cleanupRan) return;
    cleanupRan = true;
    if (pid != null && process.platform === 'win32') {
      try {
        spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
      } catch {
        /* fall through */
      }
    }
    try {
      child.kill();
    } catch {
      /* already dead */
    }
    try {
      fs.rmSync(userDir, { recursive: true, force: true });
    } catch {
      /* temp dir best-effort */
    }
  };
  try {
    const port = await waitForDevToolsPort(userDir, 20_000);
    const wsUrl = await findPageWsUrl(port, 20_000);
    const socket = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener('open', () => resolve());
      socket.addEventListener('error', () => reject(new Error('UNAVAILABLE: CDP websocket connect failed')));
      setTimeout(() => reject(new Error('UNAVAILABLE: CDP websocket open timeout')), 10_000);
    });
    const framer = createCdpFramer(socket);
    await framer.send('Page.enable');
    await framer.send('Runtime.enable');

    const client: CdpClient = {
      pid,
      bin,
      async navigate(url: string) {
        await framer.send('Page.navigate', { url });
        // poll for a settled document (deterministic, no event races)
        for (let i = 0; i < 50; i++) {
          const rs = await this.evaluate('document.readyState') as string;
          if (rs === 'complete') return;
          await sleep(200);
        }
      },
      async screenshot(file: string) {
        const r = (await framer.send('Page.captureScreenshot', { format: 'png' })) as { data?: string };
        const buf = Buffer.from(r?.data ?? '', 'base64');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
        return buf.length;
      },
      async evaluate(expr: string) {
        const r = (await framer.send('Runtime.evaluate', {
          expression: expr,
          returnByValue: true,
          awaitPromise: true,
        })) as { result?: { value?: unknown }; exceptionDetails?: { description?: string } };
        if (r?.exceptionDetails) throw new Error(`page evaluate threw: ${r.exceptionDetails.description ?? 'unknown'}`);
        return r?.result?.value;
      },
      async a11yElements() {
        // A single page-side walk -> P05 AetherDomElement[] (boundingBox form).
        const expr = `(() => {
          const nodes = Array.from(document.querySelectorAll('button, input, img, a, h1, h2, h3, [role]'));
          const out = [];
          for (const el of nodes) {
            const r = el.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) continue;
            const tag = el.tagName.toLowerCase();
            const implicit = {
              button: 'button', a: 'link', h1: 'heading', h2: 'heading', h3: 'heading',
              img: 'img', select: 'combobox', textarea: 'textbox',
              input: el.type === 'checkbox' ? 'checkbox' : (el.type === 'radio' ? 'radio' : 'textbox')
            }[tag] || '';
            const role = el.getAttribute('role') || implicit || '';
            const text = ['button', 'a', 'h1', 'h2', 'h3'].includes(tag) ? (el.textContent || '').trim().slice(0, 80) : '';
            let css = '';
            if (el.id) { css = '#' + el.id; }
            else {
              let p = el; const parts = [];
              while (p && p.tagName && p.tagName.toLowerCase() !== 'body' && p.tagName.toLowerCase() !== 'html') {
                let part = p.tagName.toLowerCase();
                const sibs = p.parentElement ? Array.from(p.parentElement.children).filter((c) => c.tagName === p.tagName) : [p];
                if (sibs.length > 1) part += ':nth-of-type(' + (sibs.indexOf(p) + 1) + ')';
                parts.unshift(part);
                p = p.parentElement;
              }
              css = parts.join('>');
            }
            out.push({
              tag,
              id: el.id || undefined,
              name: el.getAttribute('name') || el.getAttribute('data-name') || undefined,
              role: role || undefined,
              ariaLabel: el.getAttribute('aria-label') || undefined,
              text: text || undefined,
              boundingBox: {
                x: Math.round(r.x), y: Math.round(r.y),
                width: Math.round(r.width), height: Math.round(r.height)
              },
              cssSelector: css
            });
          }
          return out;
        })()`;
        const els = (await this.evaluate(expr)) as Array<Omit<AetherCdpElement, 'ref'>>;
        return (Array.isArray(els) ? els : []).map((e, i) => ({ ...e, ref: `e${i + 1}` }));
      },
      async click(cssSelector: string) {
        const found = await this.evaluate(
          `(() => { const el = document.querySelector(${JSON.stringify(cssSelector)}); if (!el) return false; el.click(); return true; })()`
        );
        if (found !== true) throw new Error(`click failed: no element matches "${cssSelector}"`);
        await sleep(300); // let the page's handlers + reflow settle
      },
      async close() {
        framer.close();
        try {
          socket.close(1000);
        } catch {
          /* already closed */
        }
        cleanup();
      },
    };
    return client;
  } catch (e) {
    cleanup();
    const msg = e instanceof Error ? e.message : String(e);
    if (/UNAVAILABLE/i.test(msg)) throw e;
    throw new Error(`UNAVAILABLE: browser launch/attach failed — ${msg}`);
  }
}

/** convenience: convert a local html path to a file:// URL (forward slashes). */
export function localHtmlUrl(p: string): string {
  return pathToFileURL(p).href;
}
