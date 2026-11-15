/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — run the deterministic design audit on the award-level showcase
 * (scripts/run-design-audit.ts)
 *
 * Writes machine evidence to release-evidence/design/:
 *   design-audit.json  — the audit score + every criterion (the "no slop" proof)
 *   cofi-shop-award.png — a real headless-browser screenshot of the showcase page
 *
 * Zero dependencies: the screenshot uses chrome --headless directly (no CDP
 * needed for a static render), and the audit comes from src/core/design/designGate.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'release-evidence', 'design');

async function main(): Promise<void> {
  fs.mkdirSync(OUT, { recursive: true });

  // 1) the award-level showcase page + its design brief
  let showcasePath: string;
  let auditFn: (html: string) => { score: number; pass: boolean; criteria: Array<{ id: string; passed: boolean; score: number; detail: string }> };
  let briefFn: ((spec: string) => unknown) | undefined;
  try {
    const gate = await import('../src/core/design/designGate');
    auditFn = gate.auditDesignHtml;
    showcasePath = gate.premiumReferenceShowcasePath ? gate.premiumReferenceShowcasePath() : path.join(ROOT, 'src/core/design/showcase/cofi-shop-award.html');
    briefFn = gate.designBriefFor;
  } catch (e) {
    showcasePath = path.join(ROOT, 'src/core/design/showcase/cofi-shop-award.html');
    auditFn = null as never;
  }

  const html = fs.existsSync(showcasePath) ? fs.readFileSync(showcasePath, 'utf8') : '';
  if (!auditFn || !html) {
    console.log('UNAVAILABLE: src/core/design/designGate.ts or the showcase page is missing yet — nothing written, nothing faked.');
    process.exit(0);
  }

  const audit = auditFn(html);
  const brief = fs.existsSync(path.join(path.dirname(showcasePath), 'cofi-shop-design-brief.json'))
    ? JSON.parse(fs.readFileSync(path.join(path.dirname(showcasePath), 'cofi-shop-design-brief.json'), 'utf8'))
    : null;

  const evidence = {
    generatedAtIso: new Date().toISOString(),
    target: path.relative(ROOT, showcasePath),
    status: audit.pass ? 'MEASURED_DESIGN_AUDIT_PASS' : 'MEASURED_DESIGN_AUDIT_FAIL',
    score: audit.score,
    pass: audit.pass,
    criteria: audit.criteria,
    designBrief: brief,
  };
  fs.writeFileSync(path.join(OUT, 'design-audit.json'), JSON.stringify(evidence, null, 2), 'utf8');
  console.log(`Design audit: ${audit.score}/100 ${audit.pass ? '(PASS — award floor ≥80)' : '(FAIL)'} on ${path.relative(ROOT, showcasePath)}`);
  for (const c of audit.criteria) console.log(`  [${c.passed ? '✓' : '✗'}] ${c.id} (${c.score}) — ${c.detail}`);

  // 2) real screenshot via headless chrome (static render only — no CDP needed)
  const shot = path.join(OUT, 'cofi-shop-award.png');
  const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    .map((c) => (fs.existsSync(c) ? c : null))
    .find(Boolean);
  if (chrome) {
    const r = spawnSync(
      chrome,
      ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1280,1600', `--screenshot=${shot}`, '--virtual-time-budget=4000', `file://${showcasePath.replace(/\\/g, '/')}`],
      { stdio: 'pipe', timeout: 60_000 }
    );
    if (r.status === 0 && fs.existsSync(shot)) {
      console.log(`Screenshot: ${path.relative(ROOT, shot)} (${fs.statSync(shot).size} bytes)`);
    } else {
      console.log(`Screenshot UNAVAILABLE: chrome exit=${r.status} ${String(r.stderr?.slice(0, 160) ?? '')}`);
    }
  } else {
    console.log('Screenshot UNAVAILABLE: no chrome/edge found on this machine.');
  }
}

main();
