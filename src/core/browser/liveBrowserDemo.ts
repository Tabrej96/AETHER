/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — LIVE BROWSER CONTROL DEMO (P05 + P06, real Chrome, zero deps)
 * (src/core/browser/liveBrowserDemo.ts)
 *
 * Proof that AETHER can control a real browser on a real page:
 *   - launch headless Chrome (CDP, zero runtime deps)
 *   - open the premium Cofi shop showcase (or a caller-supplied local HTML)
 *   - pull the REAL accessibility tree, resolve a control via P05 resolveElement
 *   - measure P05 compact-a11y-snapshot token savings vs the full DOM dump
 *   - click the Add-to-cart button, capture before/after PNGs, and verify
 *     the page actually changed state (cart total non-zero / cart has items)
 *   - feed a DetectedElement array through P06 groundAction (visual grounding)
 *
 * Honesty: if no browser is found, the report status is UNAVAILABLE_NO_BROWSER
 * and callers show that — never a fabricated "live control" measurement.
 */

import fs from 'node:fs';
import path from 'node:path';

import { launchChrome, localHtmlUrl, type CdpClient } from './cdp';
import { buildA11ySnapshot, resolveElement } from '../programs/p05BrowserIntelligence';
import { groundAction, type DetectedElement } from '../programs/p06VisualComputerIntelligence';

export interface LiveBrowserDemoReport {
  status: 'MEASURED_LIVE_BROWSER_CONTROL' | 'UNAVAILABLE_NO_BROWSER';
  reason?: string;
  browser?: string;
  url?: string;
  target: string; // which html was driven (repo-relative or temp)
  a11yElementCount: number;
  p05Resolved: { strategy: string; confidence: number; cssSelector: string | null; reason: string };
  snapshotTokens: number;
  rawDomTokens: number;
  snapshotSavingsPct: number;
  screenshotBefore: string;
  screenshotAfter: string;
  stateChangeVerified: boolean;
  p06Grounding?: { intent: string; grounded: boolean; confidence: number };
  finishedAtIso: string;
}

/** built-in fallback page when the premium showcase isn't present */
const FALLBACK_SHOP_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Cofi — Shop</title>
<style>body{font-family:Georgia,serif;background:#f3ead9;color:#2b1d12;margin:0}
header{padding:24px;border-bottom:1px solid #e7d7bd}.menu{display:flex;gap:16px;padding:24px;flex-wrap:wrap}
.card{background:#e7d7bd;border-radius:12px;padding:18px;width:180px}
.card button{margin-top:10px;background:#c17a3d;color:#fff;border:0;border-radius:8px;padding:8px 14px;cursor:pointer}
aside{padding:24px}#cart-total{font-weight:800}</style></head>
<body>
<header><h1>Cofi <em>Shop</em></h1></header>
<section class="menu" aria-label="Coffee menu">
  <div class="card"><h3>Espresso</h3><p>$4.00</p>
    <button type="button" data-product="espresso" data-price="4.00" data-name="Espresso">Add to cart</button></div>
  <div class="card"><h3>Flat White</h3><p>$5.50</p>
    <button type="button" data-product="flatwhite" data-price="5.50" data-name="Flat White">Add to cart</button></div>
  <div class="card"><h3>Cold Brew</h3><p>$6.00</p>
    <button type="button" data-product="coldbrew" data-price="6.00" data-name="Cold Brew">Add to cart</button></div>
</section>
<aside aria-label="Shopping cart"><h2>Your cart</h2><div id="cart-lines"><p>No items yet — fix that.</p></div>
<div class="total"><span>Total</span><span id="cart-total">$0.00</span></div></aside>
<script>
(function(){var lines=document.getElementById("cart-lines"),totalEl=document.getElementById("cart-total"),cart={};
function money(n){return "$"+n.toFixed(2)}function render(){var keys=Object.keys(cart);
if(!keys.length){lines.innerHTML="<p>No items yet — fix that.</p>"}else{lines.innerHTML=keys.map(function(id){var c=cart[id];
return '<div class="line"><span>'+c.name+" × "+c.qty+'</span><span>'+money(c.price*c.qty)+'</span></div>'}).join("")}
var total=keys.reduce(function(s,id){return s+cart[id].price*cart[id].qty},0);totalEl.textContent=money(total)}
document.querySelectorAll("button[data-product]").forEach(function(b){b.addEventListener("click",function(){
var id=b.getAttribute("data-product");if(!cart[id])cart[id]={name:b.getAttribute("data-name"),price:parseFloat(b.getAttribute("data-price")),qty:0}
cart[id].qty+=1;render()})});render()})();
</script></body></html>`;

/** read the cart state from the page so a click is verifiably effective. */
async function cartState(client: CdpClient): Promise<{ empty: boolean; totalText: string }> {
  const r = await client.evaluate(`(() => {
    const total = document.getElementById("cart-total");
    const lines = document.getElementById("cart-lines");
    return { empty: !lines || /no items yet/i.test(lines.textContent || ""), totalText: total ? total.textContent : "" };
  })()`) as { empty: boolean; totalText: string };
  return r ?? { empty: true, totalText: '' };
}

export async function runLiveBrowserDemo(opts: { targetHtml?: string } = {}): Promise<LiveBrowserDemoReport> {
  const repoRoot = path.resolve(process.cwd());
  const outDir = path.join(repoRoot, 'release-evidence', 'browser-demo');
  fs.mkdirSync(outDir, { recursive: true });
  const beforePng = path.join(outDir, 'before.png');
  const afterPng = path.join(outDir, 'after.png');

  // pick the target page: caller-supplied, else the premium showcase, else a temp fallback
  let targetHtml = opts.targetHtml;
  if (!targetHtml) {
    const premium = path.join(repoRoot, 'src', 'core', 'design', 'showcase', 'cofi-shop-award.html');
    if (fs.existsSync(premium)) targetHtml = premium;
  }
  let usedFallback = false;
  if (!targetHtml || !fs.existsSync(targetHtml)) {
    targetHtml = path.join(outDir, 'fallback-shop.html');
    fs.writeFileSync(targetHtml, FALLBACK_SHOP_HTML, 'utf8');
    usedFallback = true;
  }
  const targetLabel = usedFallback ? 'built-in fallback shop (temp)' : path.relative(repoRoot, targetHtml);
  const url = localHtmlUrl(targetHtml);
  const base: LiveBrowserDemoReport = {
    status: 'UNAVAILABLE_NO_BROWSER',
    target: targetLabel,
    a11yElementCount: 0,
    p05Resolved: { strategy: '', confidence: 0, cssSelector: null, reason: 'not run (no browser)' },
    snapshotTokens: 0,
    rawDomTokens: 0,
    snapshotSavingsPct: 0,
    screenshotBefore: path.relative(repoRoot, beforePng).split(path.sep).join('/'),
    screenshotAfter: path.relative(repoRoot, afterPng).split(path.sep).join('/'),
    stateChangeVerified: false,
    finishedAtIso: new Date().toISOString(),
  };

  let client: CdpClient;
  try {
    client = await launchChrome({ url });
  } catch (e) {
    base.reason = e instanceof Error ? e.message : String(e);
    return base;
  }

  try {
    base.url = url;
    base.browser = client.bin;
    await client.navigate(url);
    await client.screenshot(beforePng); // real "before" capture

    // P05: pull the real a11y tree, resolve a control deterministically
    const els = await client.a11yElements();
    base.a11yElementCount = els.length;
    const addBtn = els.find((e) => e.role === 'button' && /add/i.test(e.text ?? ''));
    const match = resolveElement(els, {
      strategy: 'DETERMINISTIC_DOM',
      role: 'button',
      label: addBtn ? addBtn.name ?? addBtn.ariaLabel ?? undefined : undefined,
    });
    base.p05Resolved = {
      strategy: match.strategy,
      confidence: match.confidence,
      cssSelector: match.element ? ((match.element as { cssSelector?: string }).cssSelector ?? match.element.id ?? null) : null,
      reason: match.reason,
    };
    // P05 token economics on the REAL page
    const snap = buildA11ySnapshot(els);
    const domText = (await client.evaluate('document.documentElement.outerHTML.length')) as number;
    base.snapshotTokens = snap.estimatedSnapshotTokens;
    base.rawDomTokens = Math.ceil((domText || 0) / 4);
    base.snapshotSavingsPct =
      base.rawDomTokens > 0 ? Math.round(((base.rawDomTokens - base.snapshotTokens) / base.rawDomTokens) * 100) : 0;

    // capture the pre-click cart state, then click, then re-read (order matters)
    const stateBefore = await cartState(client);
    const sel = (match.element?.id ? `#${match.element.id}` : null) ?? (addBtn as { cssSelector?: string })?.cssSelector ?? 'button[data-product]';
    await client.click(sel);
    const stateAfter = await cartState(client);
    await client.screenshot(afterPng);
    base.stateChangeVerified = stateBefore.empty && !stateAfter.empty;

    // P06: map the real a11y elements to DetectedElements and ground the intent
    const detected: DetectedElement[] = els.map((e, i) => {
      const vw = 1280;
      const vh = 900;
      const cx = (e.boundingBox.x + e.boundingBox.width / 2) / vw;
      const cy = (e.boundingBox.y + e.boundingBox.height / 2) / vh;
      return {
        elementId: `d${i + 1}`,
        label: e.name ?? e.ariaLabel ?? e.text ?? e.id ?? e.tag,
        role: e.role ?? 'generic',
        bbox: { x: Math.max(0, cx - e.boundingBox.width / 2 / vw), y: Math.max(0, cy - e.boundingBox.height / 2 / vh), w: e.boundingBox.width / vw, h: e.boundingBox.height / vh },
        confidence: 0.9,
      };
    });
    const g = groundAction(detected, { role: 'button', label: 'Add' }, 0.5);
    base.p06Grounding = { intent: 'button/Add', grounded: g.grounded, confidence: g.confidence };

    base.status = 'MEASURED_LIVE_BROWSER_CONTROL';
  } finally {
    await client.close();
  }

  base.finishedAtIso = new Date().toISOString();
  fs.writeFileSync(path.join(outDir, 'live-browser-report.json'), JSON.stringify(base, null, 2), 'utf8');
  return base;
}
