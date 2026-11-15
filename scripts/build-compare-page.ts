/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — build the ECC-vs-AETHER comparison showcase page
 * (scripts/build-compare-page.ts)
 *
 * Regenerates website/compare.html from release-evidence/comparison/comparison-report.json
 * + the real produced samples + screenshots. Data is inlined so the page works
 * from file:// and GitHub Pages. Run `npx tsx bin/aether.ts compare` first.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, 'release-evidence', 'comparison');
const REPORT = path.join(OUTDIR, 'comparison-report.json');
const SAMPLES = path.join(OUTDIR, 'samples');
const OUT = path.join(ROOT, 'website', 'compare.html');

if (!fs.existsSync(REPORT)) {
  console.error('comparison-report.json not found — run: npx tsx bin/aether.ts compare');
  process.exit(1);
}

interface Arm {
  arm: string;
  armName: string;
  armClass: string;
  status: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costNote: string;
  wallClockMs: number;
  modelCalls: number;
  contextLoadedTokens: number;
  contextDetail: string;
  agentsSpawned: number;
  parallelWaves: number;
  totalToolCalls: number;
  retriesExecuted: number;
  functionalAssertionsPassed: number;
  functionalAssertionsRun: number;
  sampleFile: string;
  sampleBytes: number;
  screenshot: string;
  colorPalette: string[];
  apiProbeResults: Array<{ probe: string; expected: string; got: string; ok: boolean; body: string }>;
  designBrief?: { concept: string; palette: string[]; layout: string; signatureInteraction: string } | null;
  designAuditScore?: number | null;
  designAuditPass?: boolean | null;
  verificationDetail: string;
  note: string;
  code: string;
}

interface Report {
  generatedAtIso: string;
  provider: { model: string; pricingBasis: string; pricingInPerMUsd: number; pricingOutPerMUsd: number };
  tasks: Array<{ task: string; spec: string; buildBrief: string; kind: string; arms: Arm[]; unmeasuredExternalHarnesses: Array<{ harness: string; commandThatWouldMeasure: string }> }>;
  summary: {
    armsMeasured: number;
    totalModelCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
    totalWallClockMs: number;
    aetherPassRate: string;
    rawPassRate: string;
    eccPassRate: string;
  };
}

const report = JSON.parse(fs.readFileSync(REPORT, 'utf-8')) as Report;
const codeFor = (task: string, arm: string, kind: string): string => {
  const ext = kind === 'BACKEND' ? 'js' : 'html';
  try {
    return fs.readFileSync(path.join(SAMPLES, task, `${arm}.${ext}`), 'utf-8');
  } catch {
    return '';
  }
};

// embed the real code + resolve screenshot paths.
// The page lives at website/compare.html, so every image it references must
// be page-relative or it 404s (both locally and on GitHub Pages): copy the
// screenshots into website/assets/evidence/ and point at the new location.
// The data files (samples, shots) are the source of truth, copied verbatim.
const EVIDENCE_DIR = path.join(ROOT, 'website', 'assets', 'evidence');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
const embedScreenshot = (screenshot: string): string => {
  const abs = path.join(OUTDIR, screenshot);
  if (!fs.existsSync(abs)) return '';
  const target = path.join(EVIDENCE_DIR, path.basename(abs));
  fs.copyFileSync(abs, target);
  return `assets/evidence/${path.basename(abs)}`;
};
for (const t of report.tasks) {
  for (const a of t.arms) {
    if (a.armClass.startsWith('UNAVAILABLE')) continue;
    a.code = codeFor(t.task, a.arm, t.kind);
    a.screenshot = a.screenshot ? embedScreenshot(a.screenshot) : '';
  }
}

const s = report.summary;
const esc = (x: unknown): string => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
const byArm = (id: string) => report.tasks.map((t) => t.arms.find((a) => a.arm === id)).filter((a): a is Arm => !!a && !a.armClass.startsWith('UNAVAILABLE'));
const agg = (arms: Arm[]) => ({
  in: Math.round(arms.reduce((x, a) => x + a.inputTokens, 0) / Math.max(1, arms.length)),
  ctx: Math.round(arms.reduce((x, a) => x + a.contextLoadedTokens, 0) / Math.max(1, arms.length)),
  wall: Math.round(arms.reduce((x, a) => x + a.wallClockMs, 0) / 1000 / Math.max(1, arms.length)),
});
const A = agg(byArm('aether'));
const E = agg(byArm('ecc'));
const R = agg(byArm('raw-model'));

// Embed the measured data as a self-contained JS literal. Every `<` is
// escaped to `<`: the blob contains the FULL generated sample HTML
// (each with its own `</script>`), and a literal `</script>` inside this
// block would terminate it early and render the remaining JS as visible
// garbage. `<` is a valid JS string escape, so it round-trips exactly.
const data = JSON.stringify({ report, A, E, R }).replace(/</g, '\\u003c');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>AETHER — ECC vs AETHER vs Raw Model: real builds, measured</title>
<meta name="description" content="We gave the same three real build tasks (Cofi shop website, Dashboard, complete backend) to a bare model, to ECC (real skill markdown), and to AETHER (agentic pipeline). See the actual code, screenshots, color palettes, live API results, and real-world token cost — all measured in isolation." />
<link rel="stylesheet" href="style.css" />
<style>
.tkspec{font:500 15px/1.55 inherit;color:var(--ink);background:var(--panel-2);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.tkgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;margin-top:16px}
.tkcard{background:var(--panel-2);border:1px solid var(--line);border-radius:12px;padding:18px}
.tkcard.aether{border-color:color-mix(in srgb,var(--accent-2) 45%,var(--line))}
.tkhead{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.tkhead h3{margin:0;font-size:15px}
.tkstatus{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.04em;padding:2px 9px;border-radius:999px}
.tkstatus.PASSED{color:var(--accent-2);border:1px solid color-mix(in srgb,var(--accent-2) 40%,transparent)}
.tkstatus.FAILED{color:var(--warn);border:1px solid color-mix(in srgb,var(--warn) 40%,transparent)}
.kv{display:grid;grid-template-columns:1fr 1fr;gap:5px 12px;margin:12px 0;font-size:12.5px;color:var(--ink-dim)}
.kv b{color:var(--ink);font-weight:600}
.pal{display:flex;gap:5px;flex-wrap:wrap;margin:6px 0}
.pal span{width:26px;height:26px;border-radius:6px;border:1px solid var(--line);display:inline-block;position:relative}
.pal span i{position:absolute;top:100%;left:50%;transform:translateX(-50%);font-size:9px;color:var(--ink-dim);font-style:normal;margin-top:2px}
.apiline{font:12px/1.7 var(--mono);color:var(--ink-dim);margin:8px 0}
.apiline b{font-weight:700}
.ok{color:var(--accent-2)} .bad{color:var(--warn)}
.shot{border:1px solid var(--line);border-radius:10px;overflow:hidden;margin:12px 0;background:#fff}
.shot img{display:block;width:100%;height:auto}
.codes{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px;margin-top:18px}
.codepane{background:#0c1220;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.codepane .head{display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--panel-2);border-bottom:1px solid var(--line);font:600 12px/1 var(--mono);color:var(--ink-dim)}
.codepane pre{margin:0;padding:14px;max-height:380px;overflow:auto;font-size:12px;line-height:1.55;white-space:pre-wrap}
.copybtn{font:600 11px/1 var(--mono);color:var(--accent);background:none;border:1px solid var(--line);border-radius:6px;padding:4px 9px;cursor:pointer}
.tkbar{margin:10px 0}
.tklabel{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px}
.tklabel span{color:var(--ink-dim);font-size:12px}
.tktrack{height:12px;background:#0c1220;border:1px solid var(--line);border-radius:6px;overflow:hidden}
.tkfill{height:100%;border-radius:6px}
.tknum{font:600 12px/1 var(--mono);color:var(--ink-dim);margin-top:4px}
.tknum b{color:var(--ink)}
.tabstrip{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 16px}
.tabstrip button{font:600 14px/1.4 inherit;color:var(--ink-dim);background:var(--panel-2);border:1px solid var(--line);border-radius:8px;padding:9px 18px;cursor:pointer}
.tabstrip button.active{color:var(--ink);border-color:var(--accent);background:color-mix(in srgb,var(--accent) 14%,var(--panel-2))}
.tkpanel{display:none}
.tkpanel.show{display:block}
</style>
</head>
<body>
<header class="topbar">
  <div class="wrap">
    <div class="brand">AETHER <span class="vtag">v1.0</span></div>
    <nav>
      <a href="index.html#why">Why AETHER</a>
      <a href="programs.html">9 Programs</a>
      <a href="deep.html">P10 Deep</a>
      <a href="benchmarks.html">Benchmarks</a>
      <a href="compare.html" class="active">Compare</a>
      <a href="showcase.html">Showcase</a>
      <a href="index.html#install">Install</a>
      <a href="https://github.com/Tabrej96/anythingwithaether" target="_blank" rel="noopener" title="Open the GitHub repository"><img class="gh-mark" src="assets/github-mark.svg" alt="GitHub" style="filter: invert(1);"/><span>GitHub</span></a>
    </nav>
  </div>
</header>

<main class="wrap">
  <section class="hero">
    <h1>Same 3 real builds. 3 harnesses. <em>Measured, isolated, shown.</em></h1>
    <p class="lede">
      "Build me a Cofi shop website", "Build me a Dashboard", "Build a Complete Backend" — each given to a bare model,
      to <strong>ECC</strong> (its real skill files loaded as context, exactly its own mechanism), and to
      <strong>AETHER</strong> (live model team + verification + self-correction). Every arm ran in its own scratch
      folder with <strong>zero current-session data</strong>. Below you can see the <strong>actual code each one wrote</strong>,
      the <strong>rendered screenshot</strong> (where a browser could render it), the <strong>colors each chose</strong>,
      the <strong>live API responses</strong> the backend produced, and the <strong>real token cost</strong> at
      ${esc(report.provider.pricingBasis)} list prices for ${esc(report.provider.model)}.
    </p>
    <p class="credit">Created by <strong>Tabrej</strong> · generated ${new Date(report.generatedAtIso).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' })} · provider-reported token counts · an arm that can't run is shown UNAVAILABLE with its re-measure command, never a fake score</p>
  </section>

  <section class="card">
    <h2>Where the tokens actually go</h2>
    <p class="muted">Avg input tokens per task. ECC's mechanism is to dump its own skill markdown into context first — that's the ~${(E.in/1000).toFixed(1)}k. AETHER loads only the task + a short per-agent prompt and spends the saved context on a <strong>verify &amp; fix loop</strong>.</p>
    <div class="grid3">
      <div class="tile"><h3>AETHER · avg ${fmt(A.in)} tok input</h3><p>${byArm('aether').reduce((n,a)=>n+a.retriesExecuted,0)} self-correction retries · ${byArm('aether').filter(a=>a.status==='PASSED').length}/${byArm('aether').length} passed · ~${A.wall}s/task</p></div>
      <div class="tile"><h3>ECC · avg ${fmt(E.in)} tok input</h3><p>static skill context, single call · ${byArm('ecc').filter(a=>a.status==='PASSED').length}/${byArm('ecc').length} passed</p></div>
      <div class="tile"><h3>Raw model · avg ${fmt(R.in)} tok input</h3><p>one call, no checks · ${byArm('raw-model').filter(a=>a.status==='PASSED').length}/${byArm('raw-model').length} passed — a pass here is luck, not a guarantee</p></div>
    </div>
    <div class="tkbar"><div class="tklabel"><b>AETHER</b><span>lazy context + verification loop</span></div><div class="tktrack"><div class="tkfill" style="width:${Math.min(100,A.in/Math.max(A.in,E.in,R.in)*100)}%;background:var(--accent-2)"></div></div><div class="tknum"><b>${fmt(A.in)}</b> tok avg input</div></div>
    <div class="tkbar"><div class="tklabel"><b>ECC</b><span>static skill dump (its mechanism)</span></div><div class="tktrack"><div class="tkfill" style="width:${Math.min(100,E.in/Math.max(A.in,E.in,R.in)*100)}%;background:var(--accent)"></div></div><div class="tknum"><b>${fmt(E.in)}</b> tok avg input</div></div>
    <div class="tkbar"><div class="tklabel"><b>Raw model</b><span>spec only</span></div><div class="tktrack"><div class="tkfill" style="width:${Math.min(100,R.in/Math.max(A.in,E.in,R.in)*100)}%;background:#5a6b82"></div></div><div class="tknum"><b>${fmt(R.in)}</b> tok avg input</div></div>
  </section>

  <section class="card">
    <h2>The builds themselves — code, screenshot, colors, live API</h2>
    <div class="tabstrip" id="tabs"></div>
    <div id="panels"></div>
  </section>

  <section class="card">
    <h2>Cost, in real-world money</h2>
    <p class="muted">Priced at ${esc(report.provider.pricingBasis)}: $${report.provider.pricingInPerMUsd}/M input, $${report.provider.pricingOutPerMUsd}/M output.</p>
    <table>
      <thead><tr><th>Arm</th><th>Input tokens</th><th>Output tokens</th><th>Cost (list pricing)</th></tr></thead>
      <tbody id="costtable"></tbody>
    </table>
  </section>

  <section class="card">
    <h2>The other harnesses — recorded, not faked</h2>
    <p class="muted">OpenHands, OpenManus, AutoGen, Browser-Use and Skyvern need their own daemons. They're UNAVAILABLE here, with the exact import command that would turn them into real rows — dropping a trace into <code>fixtures/universal-benchmark/</code> fills the cell. No invented numbers.</p>
    <table><thead><tr><th>Harness</th><th>Status</th><th>Command that would measure it</th></tr></thead><tbody id="exttable"></tbody></table>
  </section>

  <section class="card">
    <h2>Re-run it yourself</h2>
<pre><code>npx tsx bin/aether.ts compare            # runs all 3 tasks x 3 arms, isolated, writes samples + screenshots
npx tsx scripts/build-compare-page.ts    # regenerates this page from the fresh numbers</code></pre>
    <p class="muted">All artifacts: <code>release-evidence/comparison/</code> · runner: <code>src/core/comparison/</code> · tasks + invariants: <code>src/core/comparison/tasks.ts</code></p>
  </section>
</main>

<footer class="wrap">
  <p>AETHER v1.0 · Created by <a href="https://github.com/Tabrej96">Tabrej</a> · Apache-2.0 ·
    <a href="https://github.com/Tabrej96/anythingwithaether" target="_blank" rel="noopener"><img src="assets/github-mark.svg" alt="" style="filter: invert(1); width:14px; vertical-align:-2px;" /> github.com/Tabrej96/anythingwithaether</a>
  </p>
</footer>

<script>
const PAGE = ${data};
const { report, A, E, R } = PAGE;
const esc = (x) => String(x ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const costOf = (a) => '$' + a.costUsd.toFixed(4);

// tabs + per-task panels (code + screenshots + palettes + live API per arm)
const tabs = document.getElementById('tabs');
const panels = document.getElementById('panels');
report.tasks.forEach((t, i) => {
  const b = document.createElement('button');
  b.textContent = t.spec;
  b.className = i === 0 ? 'active' : '';
  b.onclick = () => {
    tabs.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    panels.querySelectorAll('.tkpanel').forEach((x) => x.classList.remove('show'));
    b.classList.add('active');
    document.getElementById('tkp-' + i).classList.add('show');
  };
  tabs.appendChild(b);

  const p = document.createElement('section');
  p.className = 'tkpanel' + (i === 0 ? ' show' : '');
  p.id = 'tkp-' + i;
  p.innerHTML =
    '<div class="tkspec"><strong>Task (' + esc(t.kind) + '):</strong> ' + esc(t.buildBrief) + '</div>' +
    '<div class="tkgrid">' + t.arms.map((a) => armCard(t, a)).join('') + '</div>' +
    '<div class="codes">' + t.arms.map((a) => codePanes(t, a)).join('') + '</div>';
  panels.appendChild(p);
});

function armCard(t, a){
  if ((a.armClass||'').startsWith('UNAVAILABLE')) return '';
  const st = a.status === 'PASSED' ? 'PASSED' : 'FAILED';
  let extra = '';
  if (a.designBrief) {
    extra += '<div class="designbrief"><div style="font-size:11px;color:var(--accent-2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">design vision (stated before building)</div>' +
      '<div style="font-size:12.5px;margin-bottom:4px"><b>Idea:</b> ' + esc(a.designBrief.concept) + '</div>' +
      '<div style="font-size:12.5px"><b>Palette:</b> ' + a.designBrief.palette.map((c) => esc(c)).join(' · ') + '</div>' +
      '<div style="font-size:12.5px"><b>Layout:</b> ' + esc(a.designBrief.layout) + ' · <b>Signature:</b> ' + esc(a.designBrief.signatureInteraction) + '</div></div>';
  }
  if (a.designAuditScore != null)
    extra += '<div style="margin:6px 0;font-size:12.5px"><b>Design audit:</b> <b style="color:' + (a.designAuditPass ? 'var(--accent-2)' : 'var(--warn)') + '">' + a.designAuditScore + '/100</b> ' +
      (a.designAuditPass ? '— clears the award floor (≥80)' : '— below the award floor (≥80); premium verified floor shipped') + '</div>';
  if (a.colorPalette && a.colorPalette.length)
    extra += '<div style="margin:8px 0"><div style="font-size:11px;color:var(--ink-dim);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">colors it chose</div><div class="pal">' +
      a.colorPalette.map((c) => '<span style="background:' + c + '"></span>').join('') + '</div></div>';
  if (a.screenshot) extra += '<div class="shot"><img src="' + esc(a.screenshot) + '" alt="screenshot of the ' + esc(t.task) + ' build produced by ' + esc(a.arm) + '" loading="lazy"/></div>';
  if (a.apiProbeResults && a.apiProbeResults.length)
    extra += '<div class="apiline"><b>live API (server started, real HTTP):</b><br/>' + a.apiProbeResults.map((x) =>
      '<span class="' + (x.ok ? 'ok' : 'bad') + '">' + (x.ok ? '✓' : '✗') + '</span> ' + esc(x.probe) + ' → ' + esc(x.got) +
      (x.body ? ' ' + esc(x.body.slice(0, 60)) : '') + '</div>');
  return '<div class="tkcard ' + (a.arm === 'aether' ? 'aether' : '') + '">' +
    '<div class="tkhead"><h3>' + esc(a.armName) + '</h3><span class="tkstatus ' + st + '">' + st + '</span></div>' +
    '<div class="kv">' +
      '<span>Time:</span><b>' + fmt(a.wallClockMs / 1000) + 's</b>' +
      '<span>Model calls:</span><b>' + a.modelCalls + '</b>' +
      '<span>Agents spawned:</span><b>' + a.agentsSpawned + '</b>' +
      '<span>Swarm waves:</span><b>' + a.parallelWaves + '</b>' +
      '<span>Tool calls:</span><b>' + a.totalToolCalls + '</b>' +
      '<span>Self-corrections:</span><b>' + a.retriesExecuted + '</b>' +
      '<span>Context loaded:</span><b>' + fmt(a.contextLoadedTokens) + ' tok</b>' +
      '<span>In / Out tokens:</span><b>' + fmt(a.inputTokens) + ' / ' + fmt(a.outputTokens) + '</b>' +
      '<span>Cost (list):</span><b>' + costOf(a) + '</b>' +
      '<span>File invariants:</span><b>' + a.functionalAssertionsPassed + '/' + a.functionalAssertionsRun + '</b>' +
    '</div>' +
    extra +
    '<p style="font-size:12px;color:var(--ink-dim);margin:8px 0 0">' + esc(a.verificationDetail) + ' · ' + esc(a.note) + '</p>' +
  '</div>';
}
function codePanes(t, a){
  if ((a.armClass||'').startsWith('UNAVAILABLE') || !a.code) return '';
  const ext = t.kind === 'BACKEND' ? 'js' : 'html';
  return '<div class="codepane"><div class="head"><span>' + esc(a.arm) + '.' + ext + ' · ' + a.sampleBytes + ' bytes' +
    (a.colorPalette && a.colorPalette.length ? '' : '') + '</span><button class="copybtn" data-t="' + t.task + '" data-a="' + a.arm + '">copy</button></div>' +
    '<pre><code>' + esc(a.code) + '</code></pre></div>';
}
document.querySelectorAll('.copybtn').forEach((btn) => {
  btn.onclick = async () => {
    const t = report.tasks.find((x) => x.task === btn.dataset.t);
    const a = t.arms.find((x) => x.arm === btn.dataset.a);
    try { await navigator.clipboard.writeText(a.code); btn.textContent = 'copied'; } catch { btn.textContent = 'select+copy'; }
    setTimeout(() => (btn.textContent = 'copy'), 1400);
  };
});

// cost table
const costRows = [
  ['AETHER', A, byArm('aether')],
  ['ECC', E, byArm('ecc')],
  ['Raw model', R, byArm('raw-model')],
];
document.getElementById('costtable').innerHTML = report.tasks.flatMap((t) =>
  t.arms.filter((a) => !(a.armClass || '').startsWith('UNAVAILABLE')).map((a) =>
    '<tr><td><b>' + esc(a.arm) + '</b> · ' + esc(t.task) + '</td><td>' + fmt(a.inputTokens) + '</td><td>' + fmt(a.outputTokens) + '</td><td>' + costOf(a) + '</td></tr>'
  )
).join('') +
  '<tr><td><b>Run total</b></td><td>' + fmt(report.summary.totalInputTokens) + '</td><td>' + fmt(report.summary.totalOutputTokens) + '</td><td><b>' +
  '$' + report.summary.totalCostUsd.toFixed(4) + '</b></td></tr>';

// external harness table
const ext = report.tasks[0].unmeasuredExternalHarnesses;
document.getElementById('exttable').innerHTML = ext.map((e) =>
  '<tr><td><b>' + esc(e.harness) + '</b></td><td><span class="tkstatus FAILED">UNAVAILABLE</span></td><td><code>' + esc(e.commandThatWouldMeasure) + '</code></td></tr>'
).join('');

function byArm(id){ return report.tasks.map((t) => t.arms.find((a) => a.arm === id)).filter((a) => a && !(a.armClass || '').startsWith('UNAVAILABLE')); }
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, page, 'utf8');
console.log(`Wrote ${path.relative(ROOT, OUT)} (${fs.statSync(OUT).size} bytes)`);
console.log(`Report: ${report.summary.aetherPassRate} / ${report.summary.eccPassRate} / ${report.summary.rawPassRate} · $${report.summary.totalCostUsd.toFixed(4)} total (${report.provider.pricingBasis})`);
