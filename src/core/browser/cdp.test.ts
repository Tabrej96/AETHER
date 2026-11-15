/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — LIVE BROWSER CONTROL TESTS (zero-dep CDP client + demo)
 * (src/core/browser/cdp.test.ts)
 *
 * - (a) launch + navigate + evaluate + a11yElements + screenshot + click +
 *   close against a real local page (SKIPPED with a clear log when no
 *   chrome/edge binary is on this machine)
 * - (b) bogus binary -> UNAVAILABLE rejection
 * - (c) the CDP message-id framing as pure logic on a fake socket (no browser)
 *
 * Run via: npx --yes tsx --test src/core/browser/cdp.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { findChrome, launchChrome, createCdpFramer, type CdpSocketLike } from './cdp';
import { runLiveBrowserDemo } from './liveBrowserDemo';

function tmpHtml(body: string): string {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aether-cdp-')), 'page.html');
  fs.writeFileSync(f, `<!doctype html><html><head><title>t</title></head><body>${body}</body></html>`, 'utf8');
  return f;
}

const HAS_BROWSER = findChrome() != null;

test('(a) CDP: launch chrome, drive a real page, capture + click + close', { timeout: 60_000 }, async () => {
  if (!HAS_BROWSER) {
    console.log('SKIP: no chrome/edge binary on this machine — live CDP case not runnable here');
    return;
  }
  const page = tmpHtml(
    `<section aria-label="menu"><button type="button" id="add-btn" data-name="Espresso">Add to cart</button></section><input id="q" name="q" type="text"><h1>Hi</h1>`
  );
  const outShot = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aether-cdp-shot-')), 'shot.png');
  const client = await launchChrome({ url: 'about:blank' });
  try {
    // navigate to the local page (pathToFileURL encodes spaces + drive letter)
    await client.navigate(pathToFileURL(page).href);
    assert.equal(await client.evaluate('document.title'), 't', 'evaluate sees our page');
    // a11y tree includes our button + input + heading, with real bboxes
    const els = await client.a11yElements();
    assert.ok(els.length >= 3, `expected >=3 a11y elements, got ${els.length}`);
    assert.ok(els.some((e) => e.role === 'button' && e.id === 'add-btn'), 'add button in tree');
    assert.ok(els.some((e) => e.role === 'textbox' && e.id === 'q'), 'input in tree');
    assert.ok(els.every((e) => e.boundingBox.width > 0 && e.boundingBox.height > 0), 'all elements have a real bbox');
    assert.ok(els.every((e) => e.cssSelector && e.cssSelector.length > 0), 'every element has a css selector');
    // click the button, observe a mutation on the real page
    await client.evaluate(`document.getElementById("add-btn").addEventListener("click", () => { window.__clicked = true; });`);
    await client.click('#add-btn');
    assert.equal(await client.evaluate('window.__clicked'), true, 'click mutated page state');
    // screenshot: a real PNG, non-trivial size
    const bytes = await client.screenshot(outShot);
    assert.ok(bytes > 5000, `screenshot too small: ${bytes}`);
    assert.equal(fs.readFileSync(outShot).slice(1, 4).toString('utf8'), 'PNG', 'magic bytes say PNG');
  } finally {
    await client.close();
  }
});

test('(b) bogus chrome binary rejects with a clear UNAVAILABLE reason', async () => {
  const bogus = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aether-cdp-bogus-')), 'nope.exe');
  await assert.rejects(
    () => launchChrome({ bin: bogus }),
    /UNAVAILABLE/i,
    'must reject UNAVAILABLE for a missing binary'
  );
});

test('(c) CDP message-id framing: out-of-order responses resolve the right promises', async () => {
  const sent: Array<{ id?: number; method?: string }> = [];
  let msgHandler: ((ev: { data?: unknown }) => void) | null = null;
  const socket: CdpSocketLike = {
    send: (data: string) => {
      sent.push(JSON.parse(data));
    },
    close: () => {
      /* no-op */
    },
    addEventListener: (type, fn) => {
      if (type === 'message') msgHandler = fn as (ev: { data?: unknown }) => void;
    },
    readyState: 1,
  };
  assert.equal(sent.length, 0, 'clean start');
  const framer = createCdpFramer(socket, 1000);
  // capture AFTER createCdpFramer registered the listener; the cast resets
  // control-flow analysis (assignments inside the closure aren't tracked, so
  // TS otherwise narrows this to `null` → the truthy branch becomes `never`)
  const mh = msgHandler as ((ev: { data?: unknown }) => void) | null;
  if (!mh) throw new Error('framer did not register a message handler');

  const p1 = framer.send('Runtime.enable');
  const p2 = framer.send('Page.navigate', { url: 'about:blank' });
  assert.equal(sent.length, 2, 'exactly two frames sent');
  assert.notEqual(sent[0].id, sent[1].id, 'request ids are unique');

  // deliver p2's success first (out of order), then p1's error
  mh!({ data: JSON.stringify({ id: sent[1].id, result: { ok: true } }) });
  assert.deepEqual(await p2, { ok: true }, 'p2 resolved with p2 payload');
  mh!({ data: JSON.stringify({ id: sent[0].id, error: { message: 'boom' } }) });
  await assert.rejects(() => p1, /boom/i, 'p1 rejected with its error');

  // event fan-out: a method frame reaches only its listeners
  let got = 0;
  framer.onEvent('Runtime.consoleAPICalled', () => (got += 1));
  mh!({ data: JSON.stringify({ method: 'Runtime.consoleAPICalled', params: { type: 'log' } }) });
  assert.equal(got, 1, 'event delivered to its listener');
});

test('(c2) CDP framer: a per-command timeout rejects the pending promise', async () => {
  const socket: CdpSocketLike = {
    send: () => {
      /* never answer */
    },
    close: () => {
      /* no-op */
    },
    addEventListener: () => {
      /* no-op */
    },
  };
  const framer = createCdpFramer(socket, 40);
  await assert.rejects(() => framer.send('Page.navigate', {}, 60), /timed out/i, 'silent socket -> timeout');
});

test('(d) live demo end-to-end (measures when a browser exists, else UNAVAILABLE)', { timeout: 120_000 }, async () => {
  const report = await runLiveBrowserDemo();
  if (HAS_BROWSER) {
    assert.equal(report.status, 'MEASURED_LIVE_BROWSER_CONTROL', `browser demo should measure; got: ${report.reason}`);
    assert.ok(report.a11yElementCount > 0, 'real a11y elements pulled from the page');
    assert.ok(report.stateChangeVerified, 'the add-to-cart click changed the cart state');
    assert.ok(report.snapshotSavingsPct >= 0 && report.snapshotSavingsPct <= 100, 'savings pct in range');
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'release-evidence/browser-demo/before.png')), 'before png written');
    assert.ok(fs.existsSync(path.resolve(process.cwd(), 'release-evidence/browser-demo/after.png')), 'after png written');
  } else {
    assert.equal(report.status, 'UNAVAILABLE_NO_BROWSER');
    assert.ok(report.reason && /UNAVAILABLE/i.test(report.reason), 'UNAVAILABLE carries a reason, not fabricated numbers');
  }
});
