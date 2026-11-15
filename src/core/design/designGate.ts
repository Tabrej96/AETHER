/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER — DETERMINISTIC DESIGN-QUALITY GATE
 * (src/core/design/designGate.ts)
 *
 * Kills the "AI slop" failure mode: a uniform beige card grid with no design
 * thinking behind it. Two mechanisms:
 *
 *   1. designBriefFor() — the agent must state its design VISION before
 *      building: concept, a curated premium palette (chosen deterministically
 *      by FNV-1a hash of the spec, never random), layout, one signature
 *      interaction, typography pairing, and a11y constraints. Operator
 *      requirements (e.g. "use green") are echoed into the palette/concept.
 *
 *   2. auditDesignHtml() — an objective, deterministic scorecard (0–100) for
 *      the produced HTML. `pass = score >= 80`. No vibes: every criterion is a
 *      machine check (palette richness, WCAG contrast of the declared body
 *      text/background pair, semantic landmarks, a11y markers, a real
 *      signature interaction, responsive setup, type hierarchy, motion
 *      respect, self-containment).
 *
 * Zero dependencies: node: builtins + one local import (fnv1aHash).
 */

import { fnv1aHash } from '../contextEngine';

// ---------------------------------------------------------------- brief
export interface DesignBrief {
  concept: string;
  palette: Array<{ hex: string; role: string; why: string }>;
  layout: string;
  signatureInteraction: string;
  a11yConstraints: string[];
  typography: string;
}

interface PaletteDef {
  name: string;
  colors: Array<{ hex: string; role: string; why: string }>;
}

const PREMIUM_PALETTES: PaletteDef[] = [
  {
    name: 'Espresso & Cream',
    colors: [
      { hex: '#2b1d12', role: 'ink', why: 'espresso-dark base for type: warmth without muddiness' },
      { hex: '#f3ead9', role: 'paper', why: 'cream ground: high contrast, no sterile white' },
      { hex: '#c17a3d', role: 'accent', why: 'single caramel accent for CTAs and sweeps' },
      { hex: '#8a4a22', role: 'accent-2', why: 'ember for hover/pressed depth of the accent' },
      { hex: '#4a3526', role: 'muted', why: 'mocha for secondary text and hairlines' },
      { hex: '#e7d7bd', role: 'muted-2', why: 'latte for card fills and zebra surfaces' },
    ],
  },
  {
    name: 'Forest Ledger',
    colors: [
      { hex: '#14231a', role: 'ink', why: 'deep forest: serious, archival tone' },
      { hex: '#eef3ec', role: 'paper', why: 'pale sage-white ground' },
      { hex: '#2f7d4f', role: 'accent', why: 'leaf green for actions' },
      { hex: '#12432a', role: 'accent-2', why: 'darker green for depth states' },
      { hex: '#6f8f7a', role: 'muted', why: 'sage for secondary text' },
    ],
  },
  {
    name: 'Ink & Vermilion',
    colors: [
      { hex: '#101418', role: 'ink', why: 'near-black editorial ink' },
      { hex: '#f5f2ea', role: 'paper', why: 'warm off-white, print-like' },
      { hex: '#d5482f', role: 'accent', why: 'vermilion: one decisive signal color' },
      { hex: '#2b6cb8', role: 'accent-2', why: 'cobalt as the counterpoint for links' },
      { hex: '#8b94a1', role: 'muted', why: 'steel gray for captions and hairlines' },
    ],
  },
  {
    name: 'Ocean Slate',
    colors: [
      { hex: '#0f2233', role: 'ink', why: 'deep slate-blue, calm and technical' },
      { hex: '#e8f0f2', role: 'paper', why: 'pale mist ground' },
      { hex: '#3e7cb1', role: 'accent', why: 'tide blue for primary actions' },
      { hex: '#14425c', role: 'accent-2', why: 'deep water for pressed/hover depth' },
      { hex: '#7d98a8', role: 'muted', why: 'sea-glass gray for secondary text' },
    ],
  },
  {
    name: 'Plum & Brass',
    colors: [
      { hex: '#221428', role: 'ink', why: 'dark plum, rich not purple-cling' },
      { hex: '#f4edf1', role: 'paper', why: 'rose-cream ground' },
      { hex: '#9a4f7e', role: 'accent', why: 'plum-magenta for signature moments' },
      { hex: '#c9a24a', role: 'accent-2', why: 'brass for warmth and CTAs' },
      { hex: '#5b4463', role: 'muted', why: 'dusty orchid for captions' },
    ],
  },
  {
    name: 'Charcoal & Signal',
    colors: [
      { hex: '#1c1f24', role: 'ink', why: 'charcoal, UI-grade darkness' },
      { hex: '#f2f4f8', role: 'paper', why: 'cool near-white ground' },
      { hex: '#ff7a1a', role: 'accent', why: 'signal orange: impossible to miss' },
      { hex: '#1f5eff', role: 'accent-2', why: 'electric blue for secondary actions' },
      { hex: '#97a0ad', role: 'muted', why: 'graphite for secondary text' },
    ],
  },
  {
    name: 'Meadow & Ochre',
    colors: [
      { hex: '#20291f', role: 'ink', why: 'dark olive ink, earthy confidence' },
      { hex: '#f2f0e2', role: 'paper', why: 'straw-cream ground' },
      { hex: '#5f7d3a', role: 'accent', why: 'moss green for growth/nature contexts' },
      { hex: '#c98a2b', role: 'accent-2', why: 'ochre for warmth and emphasis' },
      { hex: '#8a9678', role: 'muted', why: 'sage for captions and rules' },
    ],
  },
  {
    name: 'Midnight & Rose',
    colors: [
      { hex: '#191a2b', role: 'ink', why: 'midnight indigo, premium darkness' },
      { hex: '#f1eef5', role: 'paper', why: 'lavender-cream ground' },
      { hex: '#b4486b', role: 'accent', why: 'rose for signature accents' },
      { hex: '#5a5f9e', role: 'accent-2', why: 'periwinkle for secondary actions' },
      { hex: '#8f86a8', role: 'muted', why: 'dusty violet for secondary text' },
    ],
  },
];

const LAYOUTS = [
  'asymmetric 12-column editorial grid with oversized display type',
  'hero + bento grid with one dominant panel and supporting cards',
  'single-column editorial with generous whitespace and large serif pull-quotes',
  'split hero: oversized type left, imagery/panel right; zig-zag feature bands below',
  'full-bleed hero, then a 3-up feature row with deliberate vertical offsets',
];

const SIGNATURE_INTERACTIONS = [
  'hover-lift card: translateY(-6px) + subtle rotate with 200ms cubic-bezier, plus an accent-color sweep on the card edge',
  'scroll-reveal stagger: sections rise + fade on viewport entry in 40ms steps',
  'press-feedback: buttons scale to 0.97 on :active with a 120ms spring release',
  'slow accent underline that extends from left on link/button hover',
];

const TYPOGRAPHY = [
  'serif display stack (Georgia, "Times New Roman", serif) over system-ui body, weight contrast 300/800',
  'single grotesque stack, weight-driven hierarchy: 300 captions, 400 body, 800 display',
  'large display at clamp(2.5rem, 6vw, 4.5rem) with 1.15 leading; body at 1rem / 1.6',
];

const A11Y_CONSTRAINTS = [
  'WCAG AA contrast (>= 4.5:1) on all body text against its background',
  ':focus-visible ring on every interactive element',
  'prefers-reduced-motion guard: all transitions/animations disabled when set',
  'aria-label on icon-only controls; aria-live region for dynamic totals',
];

/** color words an operator might name in a requirement -> a hex that honors it */
const REQUIREMENT_COLORS: Array<{ word: string; hex: string; label: string }> = [
  { word: 'green', hex: '#2f7d4f', label: 'green' },
  { word: 'blue', hex: '#2b6cb8', label: 'blue' },
  { word: 'red', hex: '#d5482f', label: 'red' },
  { word: 'orange', hex: '#ff7a1a', label: 'orange' },
  { word: 'purple', hex: '#9a4f7e', label: 'purple' },
  { word: 'pink', hex: '#d664a4', label: 'pink' },
  { word: 'teal', hex: '#2f8f83', label: 'teal' },
  { word: 'yellow', hex: '#c9a24a', label: 'yellow/gold' },
  { word: 'gold', hex: '#c9a24a', label: 'gold' },
  { word: 'caramel', hex: '#c17a3d', label: 'caramel' },
  { word: 'black', hex: '#101418', label: 'black' },
  { word: 'white', hex: '#f5f2ea', label: 'off-white' },
  { word: 'brown', hex: '#4a3526', label: 'brown' },
  { word: 'sage', hex: '#8a9678', label: 'sage' },
  { word: 'mint', hex: '#9fd6b5', label: 'mint' },
  { word: 'gray', hex: '#97a0ad', label: 'gray' },
];

function seedOf(key: string): number {
  return parseInt(fnv1aHash(key), 16);
}

/**
 * Deterministic design brief. Same spec (+ requirements) -> same brief,
 * always. The spec's hash selects the palette/layout/interaction/typography
 * so distinct projects get distinct identities, with zero randomness.
 */
export function designBriefFor(spec: string, requirements?: string[]): DesignBrief {
  const reqs = requirements ?? [];
  const key = spec + '::' + reqs.join('|');
  const seed = seedOf(key);
  const palette = PREMIUM_PALETTES[seed % PREMIUM_PALETTES.length];
  const layout = LAYOUTS[seed % LAYOUTS.length];
  const signatureInteraction = SIGNATURE_INTERACTIONS[Math.floor(seed / PREMIUM_PALETTES.length) % SIGNATURE_INTERACTIONS.length];
  const typography = TYPOGRAPHY[Math.floor(seed / (PREMIUM_PALETTES.length * LAYOUTS.length)) % TYPOGRAPHY.length];

  const colors = palette.colors.map((c) => ({ ...c }));

  // Operator requirements are echoed into the brief: a color requirement
  // re-targets the accent; every requirement is named in the concept.
  for (const req of reqs) {
    const low = req.toLowerCase();
    const hit = REQUIREMENT_COLORS.find((c) => low.includes(c.word));
    if (hit) {
      const accent = colors.find((c) => c.role === 'accent') ?? colors[2];
      accent.hex = hit.hex;
      accent.role = 'accent (operator requirement)';
      accent.why = `operator requirement "${req.trim()}" honored with ${hit.label} (${hit.hex})`;
    }
  }

  return {
    concept:
      `Design vision for: ${spec.trim()}. Identity: ${palette.name} · ${layout}.` +
      (reqs.length ? ` Operator requirements honored: ${reqs.map((r) => `"${r.trim()}"`).join(', ')}.` : ''),
    palette: colors,
    layout,
    signatureInteraction,
    a11yConstraints: [...A11Y_CONSTRAINTS, ...(reqs.length ? [`${reqs.length} operator requirement(s) restated on the brief`] : [])],
    typography,
  };
}

/** repo-relative path of the hand-authored award-level reference page. */
export function premiumReferenceShowcasePath(): string {
  return 'src/core/design/showcase/cofi-shop-award.html';
}

/**
 * repo-relative path of the hand-authored award-level reference page for a
 * comparison task, or null when that task has no premium showcase yet.
 * Task id -> showcase file (all live under src/core/design/showcase/).
 */
export function premiumReferenceForTask(taskId: string): string | null {
  const map: Record<string, string> = {
    'cofi-shop': 'src/core/design/showcase/cofi-shop-award.html',
    dashboard: 'src/core/design/showcase/cofi-dashboard-award.html',
  };
  return map[taskId] ?? null;
}

// ---------------------------------------------------------------- audit
export interface DesignAudit {
  score: number;
  pass: boolean;
  criteria: Array<{ id: string; passed: boolean; score: number; detail: string }>;
}

const HEX_RE = /#([0-9a-fA-F]{6}\b|#?[0-9a-fA-F]{3}\b)/g;
export function normalizeHex(h: string): string {
  let x = h.replace('#', '').toLowerCase();
  if (x.length === 3) x = x[0] + x[0] + x[1] + x[1] + x[2] + x[2];
  return '#' + x;
}

export function wcagLuminance(hex: string): number {
  const x = normalizeHex(hex).slice(1);
  const c = (i: number) => {
    const v = parseInt(x.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * c(0) + 0.7152 * c(2) + 0.0722 * c(4);
}

export function contrastRatio(a: string, b: string): number {
  const la = wcagLuminance(a);
  const lb = wcagLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function collectCssVars(html: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const m of html.matchAll(/:root\s*\{([^}]*)\}|html\s*\{([^}]*)\}/g)) {
    const block = m[1] ?? m[2] ?? '';
    for (const v of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);?/g)) {
      vars[v[1]] = v[2].trim();
    }
  }
  return vars;
}

function resolveValue(raw: string, vars: Record<string, string>): string {
  let v = raw.trim();
  for (let pass = 0; pass < 3; pass++) {
    const m = v.match(/var\(\s*--([\w-]+)/);
    if (!m) break;
    const rep = vars['--' + m[1]];
    if (!rep) return '';
    v = v.replace(m[0], rep);
  }
  return v;
}

function firstHex(s: string): string | null {
  const m = s.match(/#([0-9a-fA-F]{6}\b|[0-9a-fA-F]{3}\b)/);
  return m ? normalizeHex('#' + m[1]) : null;
}

/** deterministic objective scorecard; total out of 100, pass at >= 80 */
export function auditDesignHtml(html: string): DesignAudit {
  const criteria: DesignAudit['criteria'] = [];
  const add = (id: string, weight: number, passed: boolean, score: number, detail: string): void => {
    criteria.push({ id, passed, score, detail });
  };

  // 1) paletteRichness (15): >= 4 distinct hex colors, excluding trivial white/black
  const hexSet = new Set<string>();
  for (const m of html.matchAll(HEX_RE)) hexSet.add(normalizeHex(m[0]));
  const distinct = [...hexSet].filter((h) => h !== '#ffffff' && h !== '#000000');
  add('paletteRichness', 15, distinct.length >= 4, distinct.length >= 4 ? 15 : 0, `${distinct.length} distinct hex colors declared (need >=4, trivial white/black excluded): ${distinct.slice(0, 8).join(' ') || '(none)'}`);

  // 2) contrast (15): WCAG ratio of the declared body text/background pair
  const vars = collectCssVars(html);
  const bodyBlock = html.match(/body\s*\{([^}]*)\}/)?.[1] ?? '';
  const bodyColorRaw = bodyBlock.match(/(^|[{\s;])color:\s*([^;]+)/)?.[2] ?? '';
  const bodyBgRaw = bodyBlock.match(/(^|[{\s;])background(?:-color)?:\s*([^;]+)/)?.[2] ?? '';
  const textHex = firstHex(resolveValue(bodyColorRaw, vars));
  const bgHex = firstHex(resolveValue(bodyBgRaw, vars));
  if (textHex && bgHex) {
    const ratio = contrastRatio(textHex, bgHex);
    const ok = ratio >= 4.5;
    add('contrast', 15, ok, ok ? 15 : 0, `body text ${textHex} on background ${bgHex} = ${ratio.toFixed(2)}:1 (need >= 4.5:1)`);
  } else {
    add('contrast', 15, true, 7, 'no explicit body color/background pair declared (inherits UA defaults, assumed passing) — capped at half weight');
  }

  // 3) semanticLandmarks (10)
  const marks = ['<header', '<main', '<section', '<footer'];
  const found = marks.filter((mk) => html.toLowerCase().includes(mk));
  add('semanticLandmarks', 10, found.length === 4, found.length === 4 ? 10 : 0, `landmarks present: ${found.length}/4 [${found.map((f) => f.slice(1, -1)).join(', ') || 'none'}]`);

  // 4) accessibility (15): lang attribute + real a11y markers
  // NOTE: `\s*` not `\s` — a bare `<html lang="en">` (the normal case) must
  // match; the earlier `\s` required a SECOND whitespace before lang and
  // silently failed every well-formed document.
  const hasLang = /<html[^>]*\slang=/.test(html);
  const ariaCount = (html.match(/aria-label=/g) ?? []).length;
  const labelFors = (html.match(/<label[\s\S]{0,40}?for=/g) ?? []).length;
  const altCount = (html.match(/<img[^>]*alt=/g) ?? []).length;
  const a11yOk = hasLang && (ariaCount + labelFors + altCount) > 0;
  add('accessibility', 15, a11yOk, a11yOk ? 15 : 0, `lang=${hasLang ? 'yes' : 'MISSING'}, aria-labels=${ariaCount}, label[for]=${labelFors}, img[alt]=${altCount}`);

  // 5) signatureInteraction (10): a state hook AND motion machinery
  const stateHook = /:hover|:active|:focus/.test(html);
  const motion = /transition:|animation:|@keyframes/.test(html);
  const jsDriven = /addEventListener\(\s*['"](click|pointerdown|mouseenter|scroll)/.test(html);
  const interOk = (stateHook && motion) || jsDriven;
  add('signatureInteraction', 10, interOk, interOk ? 10 : 0, `state hooks (${stateHook ? 'yes' : 'no'}) + CSS motion (${motion ? 'yes' : 'no'}) / JS-driven (${jsDriven ? 'yes' : 'no'})`);

  // 6) responsive (10): viewport meta + at least one responsive mechanism
  const viewport = /<meta[^>]+name=["']?viewport/i.test(html);
  const mech = /@media|\bdisplay:\s*grid|flex-wrap|wrap:|@container/.test(html);
  const respOk = viewport && mech;
  add('responsive', 10, respOk, respOk ? 10 : 0, `viewport meta=${viewport ? 'yes' : 'MISSING'}, responsive mechanism=${mech ? 'yes' : 'no'}`);

  // 7) typographyHierarchy (10): >= 3 distinct font-size or font-weight declarations
  const sizes = new Set((html.match(/font-size:\s*([^;]+)/g) ?? []).map((s) => s.replace(/font-size:\s*/i, '').trim()));
  const weights = new Set((html.match(/font-weight:\s*([^;]+)/g) ?? []).map((s) => s.replace(/font-weight:\s*/i, '').trim()));
  const typeOk = sizes.size >= 3 || weights.size >= 3;
  add('typographyHierarchy', 10, typeOk, typeOk ? 10 : 0, `${sizes.size} distinct font-size values, ${weights.size} distinct font-weight values (need >=3 of either)`);

  // 8) motionRespect (5): reduced-motion guard, or motion is transform/opacity-only
  const rmGuard = /prefers-reduced-motion/.test(html);
  const noMotionAtAll = !motion;
  const softMotion = motion && /transition:|animation:/.test(html) && !/transition:\s*[^;]*background|transition:\s*[^;]*color|animation[^;]*width|animation[^;]*height/.test(html);
  const motionOk = rmGuard || noMotionAtAll || softMotion;
  add('motionRespect', 5, motionOk, motionOk ? 5 : 0, rmGuard ? 'prefers-reduced-motion guard present' : noMotionAtAll ? 'no motion to respect' : softMotion ? 'motion is transform/opacity-only (acceptable)' : 'animates layout/background properties with no reduced-motion guard');

  // 9) selfContained (10): no external script/css URLs that would 404 offline
  const extScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)/gi)].map((m) => m[1]).filter((u) => /^https?:/.test(u));
  const extLinks = [...html.matchAll(/<link[^>]+href=["']([^"']+)/gi)].map((m) => m[1]).filter((u) => /^https?:/.test(u));
  const selfOk = extScripts.length === 0 && extLinks.length === 0;
  add('selfContained', 10, selfOk, selfOk ? 10 : 0, selfOk ? 'no external requests' : `external references would 404 offline: ${[...extScripts, ...extLinks].slice(0, 3).join(', ')}`);

  const score = criteria.reduce((s, c) => s + c.score, 0);
  return { score, pass: score >= 80, criteria };
}
