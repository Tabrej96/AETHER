/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — COMPARISON TASKS (ECC vs AETHER vs raw model, and friends)
 * (src/core/comparison/tasks.ts)
 *
 * Three self-contained build tasks, each demanding a REAL, DEMO-ABLE artifact:
 *   - Cofi shop  -> one index.html that RENDERS (storefront + cart + colors)
 *   - Dashboard  -> one index.html that RENDERS (charts + stats + colors)
 *   - Backend    -> one server.js that RUNS (real HTTP endpoints, live-tested)
 *
 * Every arm is run against the SAME spec, in its own scratch dir, seeded ONLY
 * from the task text (no session data). Results are measured:
 *   - functional assertions run against the produced module
 *   - a Chrome/Edge headless render (screenshot + extracted color palette)
 *   - for the backend: real HTTP requests to a running server (status + body)
 */

import { fnv1aHash } from '../contextEngine';

export type ComparisonTaskId = 'cofi-shop' | 'dashboard' | 'backend';

export interface ComparisonVerifierResult {
  passed: boolean;
  assertionsRun: number;
  failures: string[];
}

export interface ComparisonTask {
  id: ComparisonTaskId;
  kind: 'FRONTEND' | 'BACKEND';
  /** the operator's words, verbatim — the task each harness is asked to do */
  spec: string;
  /** precise build instructions handed to every arm (identical for all) */
  buildBrief: string;
  /** the file the arm must produce */
  targetFile: string;
  /** starting (broken/empty) file tree — fresh, isolated */
  startingFiles: Record<string, string>;
  /** structural + functional invariants run on the produced file */
  verifyProducedFile: (file: string) => ComparisonVerifierResult;
  /** verified reference solution (AETHER's deterministic floor) */
  referenceModule: string;
  referenceTokens: number;
  /** frontend tasks: what the rendered page must show */
  mustShow?: string[];
  /** backend tasks: live HTTP probes (run against a started server) */
  apiProbes?: Array<{ name: string; method: 'GET' | 'POST'; path: string; body?: string; expect: string }>;
}

// ============================================================================
// Task A — "Build me a Cofi shop Website"
// ============================================================================
const COFI_BRIEF =
  'Build me a Cofi shop website: a single self-contained index.html (inline <style> + <script>, no external files or CDNs) ' +
  'that renders a coffee shop storefront: a header with the shop name "Cofi", a product grid of at least 4 coffee items (name + price), ' +
  'a shopping cart panel where clicking a product adds it (with a quantity) and the cart shows line items + a live total price, ' +
  'and a distinct, tasteful color palette you choose (declare it in CSS with at least one hex color, avoid a plain unstyled document). ' +
  'Use semantic HTML + aria-labels. Write ONLY the file contents as one JSON object {"ok":true,"result":"<full index.html>","reasoning":"<one line>"}.';

const COFI_REFERENCE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Cofi — Coffee Shop</title>
<style>
  :root { --ink:#2b2118; --paper:#f6efe6; --accent:#8a5a2b; --accent-2:#3d2c1e; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:Georgia,serif; background:var(--paper); color:var(--ink); }
  header { background:var(--accent-2); color:var(--paper); padding:22px 28px; }
  header h1 { margin:0; letter-spacing:.06em; }
  .shop { display:grid; grid-template-columns:2fr 1fr; gap:22px; padding:22px 28px; }
  .products { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
  .product { background:#fff; border:1px solid #e4d8c6; border-radius:10px; padding:14px; }
  .product h3 { margin:0 0 6px; }
  .product button { background:var(--accent); color:#fff; border:0; border-radius:6px; padding:6px 10px; cursor:pointer; }
  .cart { background:#fff; border:1px solid #e4d8c6; border-radius:10px; padding:14px; }
  .cart h2 { margin:0 0 10px; font-size:18px; }
  .line { display:flex; justify-content:space-between; font-size:14px; padding:4px 0; }
  .total { font-weight:bold; border-top:2px solid var(--accent-2); margin-top:8px; padding-top:8px; }
</style>
</head>
<body>
<header><h1>Cofi — Specialty Coffee</h1></header>
<main class="shop">
  <section class="products" aria-label="coffee products" id="products"></section>
  <aside class="cart" aria-label="shopping cart">
    <h2>Your Cart</h2>
    <div id="cart-lines"><p class="empty">Your cart is empty.</p></div>
    <p class="line total"><span>Total</span><span id="cart-total">$0.00</span></p>
  </aside>
</main>
<script>
const CATALOG = [
  { id:"espresso", name:"Cofi Espresso", price:4.00 },
  { id:"latte",    name:"Cofi Latte",    price:5.50 },
  { id:"mocha",    name:"Cofi Mocha",     price:6.00 },
  { id:"coldbrew", name:"Cofi Cold Brew", price:5.00 }
];
let cart = {};
function money(n){ return "$" + n.toFixed(2); }
function add(productId){
  const p = CATALOG.find(c=>c.id===productId);
  if(!p) return;
  cart[productId] = (cart[productId]||0) + 1;
  render();
}
function render(){
  document.getElementById("products").innerHTML = CATALOG.map(c=>
    '<div class="product"><h3>'+c.name+'</h3><p>'+money(c.price)+'</p>'+
    '<button aria-label="add '+c.name+' to cart" onclick="add(\\''+c.id+'\\')">Add to cart</button></div>').join("");
  const lines = Object.entries(cart);
  document.getElementById("cart-lines").innerHTML = lines.length
    ? lines.map(([id,q])=>{ const p=CATALOG.find(c=>c.id===id);
        return '<div class="line"><span>'+p.name+' × '+q+'</span><span>'+money(p.price*q)+'</span></div>'; }).join("")
    : '<p class="empty">Your cart is empty.</p>';
  const total = lines.reduce((s,[id,q])=> s + CATALOG.find(c=>c.id===id).price*q, 0);
  document.getElementById("cart-total").textContent = money(total);
}
render();
</script>
</body>
</html>
`;

// ============================================================================
// Task B — "Build me a Dashboard"
// ============================================================================
const DASH_BRIEF =
  'Build me a sales dashboard: a single self-contained index.html (inline <style> + <script>, no external files or CDNs) ' +
  'that renders a Cofi coffee sales dashboard: a KPI row (total sales, orders, average order value computed from an embedded sample dataset of at least 12 records), ' +
  'a bar chart drawn with pure CSS (no chart libraries) showing sales by day of week, and a small data table of the top products. ' +
  'Choose your own color palette (declare hex colors in CSS) and use semantic HTML + aria-labels. ' +
  'Write ONLY the file contents as one JSON object {"ok":true,"result":"<full index.html>","reasoning":"<one line>"}.';

const DASH_REFERENCE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Cofi — Sales Dashboard</title>
<style>
  :root { --bg:#0f1420; --card:#1a2233; --ink:#e8edf7; --mut:#9aa7c0; --bar:#5b8cff; --bar2:#7ef0c0; }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.5 system-ui,Segoe UI,sans-serif; background:var(--bg); color:var(--ink); padding:26px; }
  h1 { margin:0 0 18px; font-size:22px; }
  .kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
  .kpi { background:var(--card); border:1px solid #26314a; border-radius:10px; padding:16px; }
  .kpi .v { font-size:26px; font-weight:700; color:var(--bar2); }
  .kpi .l { color:var(--mut); font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
  .grid { display:grid; grid-template-columns:1.4fr 1fr; gap:14px; }
  .card { background:var(--card); border:1px solid #26314a; border-radius:10px; padding:16px; }
  .bars { display:flex; align-items:flex-end; gap:10px; height:180px; padding-top:10px; }
  .col { flex:1; text-align:center; color:var(--mut); font-size:11px; }
  .col .b { background:var(--bar); border-radius:5px 5px 0 0; margin-bottom:6px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th,td { text-align:left; padding:7px 8px; border-bottom:1px solid #26314a; }
</style>
</head>
<body>
<h1>Cofi Sales Dashboard</h1>
<section class="kpis" aria-label="key metrics">
  <div class="kpi"><div class="v" id="k-total">—</div><div class="l">Total sales</div></div>
  <div class="kpi"><div class="v" id="k-orders">—</div><div class="l">Orders</div></div>
  <div class="kpi"><div class="v" id="k-avg">—</div><div class="l">Avg order</div></div>
</section>
<div class="grid">
  <section class="card" aria-label="sales by day"><h2>Sales by day</h2><div class="bars" id="bars"></div></section>
  <section class="card" aria-label="top products"><h2>Top products</h2><table id="top"><thead><tr><th>Product</th><th>Sold</th></tr></thead><tbody></tbody></table></section>
</div>
<script>
const DATA = [
  {day:"Mon",product:"Espresso",qty:42,price:4.0},{day:"Mon",product:"Latte",qty:31,price:5.5},
  {day:"Tue",product:"Espresso",qty:48,price:4.0},{day:"Tue",product:"Cold Brew",qty:22,price:5.0},
  {day:"Wed",product:"Latte",qty:55,price:5.5},{day:"Wed",product:"Mocha",qty:19,price:6.0},
  {day:"Thu",product:"Espresso",qty:61,price:4.0},{day:"Thu",product:"Latte",qty:40,price:5.5},
  {day:"Fri",product:"Cold Brew",qty:73,price:5.0},{day:"Fri",product:"Espresso",qty:58,price:4.0},
  {day:"Sat",product:"Mocha",qty:64,price:6.0},{day:"Sat",product:"Latte",qty:80,price:5.5},
  {day:"Sun",product:"Cold Brew",qty:45,price:5.0},{day:"Sun",product:"Espresso",qty:37,price:4.0}
];
const total = DATA.reduce((s,r)=>s+r.qty*r.price,0);
const orders = DATA.reduce((s,r)=>s+r.qty,0);
document.getElementById("k-total").textContent = "$"+total.toFixed(2);
document.getElementById("k-orders").textContent = orders;
document.getElementById("k-avg").textContent = "$"+(total/orders).toFixed(2);
const byDay = {};
for (const r of DATA) byDay[r.day]=(byDay[r.day]||0)+r.qty*r.price;
const max = Math.max(...Object.values(byDay));
document.getElementById("bars").innerHTML = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>
  '<div class="col"><div class="b" style="height:'+Math.round((byDay[d]||0)/max*100)+'%"></div>'+d+'</div>').join("");
const byProd = {};
for (const r of DATA) byProd[r.product]=(byProd[r.product]||0)+r.qty;
document.querySelector("#top tbody").innerHTML = Object.entries(byProd).sort((a,b)=>b[1]-a[1])
  .slice(0,4).map(([n,q])=>'<tr><td>'+n+'</td><td>'+q+'</td></tr>').join("");
</script>
</body>
</html>
`;

// ============================================================================
// Task C — "Build a Complete Backend"
// ============================================================================
const BACKEND_BRIEF =
  'Build a complete backend for the Cofi shop: a single self-contained server.js using ONLY Node built-ins (no npm packages) ' +
  'that starts an HTTP server on process.env.PORT (default 3000) with an in-memory data store and these endpoints: ' +
  'GET /health -> 200 JSON {status:"ok"}; POST /orders -> validates a JSON body {customerId,itemId,qty} (missing fields, qty<1, ' +
  'or any SQL-injection text like "1\' OR 1=1" must be rejected with 400 JSON {error:...}; valid order -> 201 JSON {orderId}); ' +
  'GET /orders/:id -> 200 with the order, 404 JSON {error:"not found"} if missing; GET /users/:id -> 200 JSON {id,name} from an in-memory users store, ' +
  'using safe parameterized lookups (never interpolate user input into commands). ' +
  'Write ONLY the file contents as one JSON object {"ok":true,"result":"<full server.js>","reasoning":"<one line>"}.';

const BACKEND_REFERENCE = `// Cofi backend — Node built-ins only, in-memory store, safe handlers.
const http = require('http');
const USERS = { u1: { id: 'u1', name: 'Ava' }, u2: { id: 'u2', name: 'Noah' } };
let orders = [];
let nextOrderId = 1;
const INJECTION = /('|--|\\/\\*|\\*\\/|UNION|DROP|INSERT|DELETE|EXEC)/i;
function safe(s){ return typeof s === 'string' && !INJECTION.test(s) && s.length < 200; }
const server = http.createServer((req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
  if (req.method === 'GET' && req.url === '/health') return send(200, { status: 'ok' });
  if (req.method === 'POST' && req.url === '/orders') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let o;
      try { o = JSON.parse(body || '{}'); } catch { return send(400, { error: 'invalid json' }); }
      if (!safe(o.customerId) || !safe(o.itemId)) return send(400, { error: 'invalid customer or item' });
      if (typeof o.qty !== 'number' || o.qty < 1) return send(400, { error: 'qty must be >= 1' });
      const order = { orderId: nextOrderId++, customerId: o.customerId, itemId: o.itemId, qty: o.qty, status: 'created' };
      orders.push(order);
      return send(201, { orderId: order.orderId });
    });
    return;
  }
  const mo = req.url && req.url.match(/^\\/orders\\/(\\w+)$/);
  if (req.method === 'GET' && mo) {
    const found = orders.find((x) => String(x.orderId) === mo[1]);
    return found ? send(200, found) : send(404, { error: 'not found' });
  }
  const mu = req.url && req.url.match(/^\\/users\\/(\\w+)$/);
  if (req.method === 'GET' && mu) {
    const u = USERS[mu[1]];
    return u ? send(200, u) : send(404, { error: 'not found' });
  }
  send(404, { error: 'unknown route' });
});
const port = process.env.PORT || 3000;
server.listen(port, () => console.log('cofi backend on :' + port));
module.exports = { server, users: USERS };
`;

// ============================================================================
// task table
// ============================================================================
const COFI_SHOP: ComparisonTask = {
  id: 'cofi-shop',
  kind: 'FRONTEND',
  spec: 'Build me a Cofi shop Website',
  buildBrief: COFI_BRIEF,
  targetFile: 'index.html',
  startingFiles: {},
  referenceModule: COFI_REFERENCE,
  referenceTokens: Math.ceil(COFI_REFERENCE.length / 4),
  mustShow: ['Cofi', 'cart'],
  verifyProducedFile: (f) => {
    const failures: string[] = [];
    let run = 0;
    const ok = (c: boolean, m: string) => {
      run += 1;
      if (!c) failures.push(m);
    };
    ok(/<html/i.test(f) && /<\/html>/i.test(f), 'must be a complete HTML document');
    ok(f.includes('<style') || f.includes('background') || /color/i.test(f), 'must define a visual color palette (CSS)');
    ok(/product/i.test(f) && (f.match(/<button|add/i) || []).length > 0, 'must show products with an add-to-cart action');
    ok(/cart/i.test(f) && /total/i.test(f), 'must render a cart with a total price');
    ok(/aria-label/i.test(f), 'must use accessibility (aria-label)');
    ok(/\$|money|price/i.test(f), 'must display prices');
    return { passed: failures.length === 0, assertionsRun: run, failures };
  },
};

const DASHBOARD: ComparisonTask = {
  id: 'dashboard',
  kind: 'FRONTEND',
  spec: 'Build me a Dashboard',
  buildBrief: DASH_BRIEF,
  targetFile: 'index.html',
  startingFiles: {},
  referenceModule: DASH_REFERENCE,
  referenceTokens: Math.ceil(DASH_REFERENCE.length / 4),
  mustShow: ['Sales', 'bar'],
  verifyProducedFile: (f) => {
    const failures: string[] = [];
    let run = 0;
    const ok = (c: boolean, m: string) => {
      run += 1;
      if (!c) failures.push(m);
    };
    ok(/<html/i.test(f) && /<\/html>/i.test(f), 'must be a complete HTML document');
    ok(/<style|background|color/i.test(f), 'must define a visual color palette (CSS)');
    ok(/total/i.test(f) && (/avg|average/i.test(f)), 'must show total + average KPIs');
    ok(/<div|<span/i.test(f) && /(height|%|px)/i.test(f), 'must draw a bar chart (CSS bars with heights)');
    ok(/<table|<tr/i.test(f), 'must include a data table');
    ok(/\b\d/.test(f) && (f.match(/\bqty\b|\borders?\b|\bdata\b/i) || []).length > 0, 'must compute from a dataset (numbers present)');
    ok(/aria-label/i.test(f), 'must use accessibility (aria-label)');
    return { passed: failures.length === 0, assertionsRun: run, failures };
  },
};

const BACKEND: ComparisonTask = {
  id: 'backend',
  kind: 'BACKEND',
  spec: 'Build a Complete Backend',
  buildBrief: BACKEND_BRIEF,
  targetFile: 'server.js',
  startingFiles: {},
  referenceModule: BACKEND_REFERENCE,
  referenceTokens: Math.ceil(BACKEND_REFERENCE.length / 4),
  apiProbes: [
    { name: 'GET /health', method: 'GET', path: '/health', expect: '200' },
    { name: 'POST /orders valid -> 201', method: 'POST', path: '/orders', body: JSON.stringify({ customerId: 'u1', itemId: 'latte', qty: 2 }), expect: '201' },
    { name: 'POST /orders injection -> 400', method: 'POST', path: '/orders', body: JSON.stringify({ customerId: "1' OR 1=1", itemId: 'x', qty: 1 }), expect: '400' },
    { name: 'GET /users/u1 -> 200', method: 'GET', path: '/users/u1', expect: '200' },
    { name: 'GET /orders/999 -> 404', method: 'GET', path: '/orders/999', expect: '404' },
  ],
  verifyProducedFile: (f) => {
    // structural pre-checks; the real proof is the live API probe in the runner.
    const failures: string[] = [];
    let run = 0;
    const ok = (c: boolean, m: string) => {
      run += 1;
      if (!c) failures.push(m);
    };
    ok(/createServer|http/i.test(f), 'must start a real HTTP server');
    ok(/orders/i.test(f), 'must implement /orders');
    ok(/users/i.test(f), 'must implement /users');
    ok(/health/i.test(f), 'must implement /health');
    ok(/PORT/i.test(f), 'must respect process.env.PORT');
    return { passed: failures.length === 0, assertionsRun: run, failures };
  },
};

export const COMPARISON_TASKS: ComparisonTask[] = [COFI_SHOP, DASHBOARD, BACKEND];

export function getComparisonTask(id: ComparisonTaskId): ComparisonTask {
  return COMPARISON_TASKS.find((t) => t.id === id)!;
}

export function comparisonInstanceHash(task: ComparisonTask): string {
  return fnv1aHash(task.id + task.buildBrief).slice(0, 8);
}
