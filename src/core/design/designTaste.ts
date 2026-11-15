/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P19 · DESIGN-TASTE LAYER
 * (src/core/design/designTaste.ts) · Created by Tabrej
 *
 * Roadmap P-S2 (directive Phases 4–5): product-type design languages
 * (enterprise density / media imagery / dev-tool monospace / e-commerce
 * photography / booking clarity, …) + a *template-slop detector*
 * (random gradients, every-section-card, fake data, empty buttons).
 *
 * This EXTENDS designGate.ts, it does not replace it: `designGate.ts`
 * answers "is this a real design brief / does this HTML pass the
 * objective quality bar?" — P19 answers two questions on top:
 *
 *   1. Is this design the RIGHT KIND of design for the product?
 *      (a FINANCIAL app that reads like a fashion magazine is
 *      technically clean but wrong; a booking tool with a 3-panel
 *      gradient hero is slop even if it scores high on palette
 *      richness)
 *   2. Is this "AI template slop"? (the beige-card + aurora-gradient
 *      + "10,000+ users" artifact everyone ships)
 *
 * Both are deterministic, every finding is nameable, and the delta
 * between a deliberately-generic artifact and a category-appropriate
 * one is readable off the scorecard — the roadmap's acceptance test.
 */

import type { ProjectCategory } from '../projectIntelligence/categories';
import { profileFor } from '../projectIntelligence/categories';

// ------------------------------------------------------------------ template slop

export interface SlopSignal {
  id: string;
  /** what was observed, with the offending snippet */
  evidence: string;
  /** points deducted from the design-fit score */
  weight: number;
}

const SLOP_RULES: Array<{ id: string; weight: number; test: (h: string) => string | null }> = [
  {
    id: 'aurora-gradient-blob',
    weight: 12,
    test: (h) => {
      const m = h.match(/(?:background|background-image)\s*:\s*(conic|radial|linear)-gradient\([^)]{10,}/i);
      return m ? m[0].slice(0, 80) : null;
    },
  },
  {
    id: 'default-indigo-pink',
    weight: 10,
    // the "AI default" palette: a Tailwind indigo AND a pink in the same
    // artifact is the most-recognizable AI-slop tell
    test: (h) => {
      const low = h.toLowerCase();
      const hasIndigo = /#6366f1|#4f46e5|indigo/.test(low);
      const hasPink = /#ec4899|#f472b6|#ff49f2|pink/.test(low);
      return hasIndigo && hasPink ? 'indigo + pink co-occur' : null;
    },
  },
  {
    id: 'glassmorphism-everywhere',
    weight: 8,
    test: (h) => {
      const n = (h.match(/backdrop-filter/g) ?? []).length;
      return n >= 3 ? `${n} backdrop-filter layers` : null;
    },
  },
  {
    id: 'every-section-card',
    weight: 10,
    // 4+ independent card-ish containers: the "card for everything" tell
    // (a layout where every section is its own rounded card)
    test: (h) => {
      const rounded = (h.match(/rounded-(2xl|xl)|border-radius:\s*(1[0-9]|[2-9]\d)px/gi) ?? []).length;
      const cardLike = (h.match(/class="[^"]*\bcard\b|class="[^"]*rounded/gi) ?? []).length;
      return cardLike >= 4 ? `${cardLike} card containers` : rounded >= 8 ? `${rounded} rounded surfaces` : null;
    },
  },
  {
    id: 'fake-big-stats',
    weight: 12,
    // unsourced "10,000+ users / 99.9% / 10x faster" hero numbers
    test: (h) => {
      const m = h.match(/\b\d{2,3},\d{3}\+\s*\w{0,14}|\b99\.9\+?%\s*\w{0,14}|\b10x\b\s*\w{0,14}/i);
      return m ? m[0].trim() : null;
    },
  },
  {
    id: 'lorem-ipsum',
    weight: 15,
    test: (h) => /lorem ipsum/i.test(h) ? 'Lorem ipsum present' : null,
  },
  {
    id: 'placeholder-identities',
    weight: 8,
    test: (h) => {
      // word-bounded Foo: "Foo" / "Foo Bar" are placeholder identities;
      // "footer" is the semantic landmark designGate REQUIRES — the
      // unbounded original fired on it and P21's empirical run caught it.
      const m = h.match(/John Doe|Jane Doe|Acme (?:Inc|Corp)|\bFoo(?:\s*Bar)?\b|\bDoe\b/i);
      return m ? m[0] : null;
    },
  },
  {
    id: 'empty-or-dead-cta',
    weight: 10,
    // a button with no text, or a link to "#" with a generic label
    test: (h) => {
      const empty = h.match(/<button[^>]*>\s*<\/button>/i);
      const dead = h.match(/<a\s+href="#"[^>]*>\s*(Learn More|Read More|Get Started|Sign Up|Click Here)\s*<\/a>/i);
      if (empty) return 'empty <button>';
      if (dead) return `href="#" CTA: ${dead[0].replace(/\s+/g, ' ').slice(0, 60)}`;
      return null;
    },
  },
  {
    id: 'generic-hero-copy',
    weight: 8,
    test: (h) => {
      const low = h.toLowerCase();
      const tells = ['the future of', 'seamlessly', 'empower', 'unleash', 'elevate your', 'reimagine', 'next-generation'];
      const hits = tells.filter((t) => low.includes(t));
      return hits.length >= 2 ? `cliché hero copy: ${hits.join(', ')}` : null;
    },
  },
  {
    id: 'stock-or-placeholder-images',
    weight: 6,
    test: (h) => {
      const m = h.match(/picsum\.ph|placeholder\.(com|png)|unsplash\.com|via\.placeholder/i);
      return m ? m[0] : null;
    },
  },
];

/** the slop rules, exported so a UI/test can list exactly which tells are detected */
export const SLOP_RULES_EXPORT = SLOP_RULES;

/** every detected slop signal; the slop score is the capped sum of their weights */
export function detectTemplateSlop(html: string): { signals: SlopSignal[]; slopPenalty: number; maxSlopPenalty: number } {
  const signals: SlopSignal[] = [];
  let pen = 0;
  let max = 0;
  for (const r of SLOP_RULES) {
    max += r.weight;
    const ev = r.test(html);
    if (ev) {
      signals.push({ id: r.id, evidence: ev, weight: r.weight });
      pen += r.weight;
    }
  }
  return { signals, slopPenalty: pen, maxSlopPenalty: max };
}

// ------------------------------------------------------------------ design-language expectations

export interface Expectation {
  id: string;
  /** what the category's design language owes, in human words */
  owed: string;
  /** the deterministic check that proves it */
  met: boolean;
}

export interface DesignFit {
  category: string;
  designLanguage: string; // the P12 profile's own words, when known
  expectations: Expectation[];
  metCount: number;
  slop: ReturnType<typeof detectTemplateSlop>;
  /** 0–100: expectations met + no slop = high; each unmet expectation and
   *  each slop signal is named on the scorecard, so the delta is readable */
  score: number;
}

/**
 * The product-type design languages (roadmap P-S2): which MEASURABLE
 * expectations each category owes. A FINANCIAL app owes density +
 * tabular numerals + status color, not imagery; MEDIA owes a dark,
 * image-led, keyboard-first surface; DEVTOOLS owe monospace; ECOMMERCE
 * owes product imagery + filters + checkout clarity; BOOKING owes
 * calendar + timezone honesty + confirmation states.
 */
function languageExpectations(html: string, category: ProjectCategory): Expectation[] {
  const low = html.toLowerCase();
  const has = (re: RegExp) => re.test(low);

  const base: Expectation[] = [];
  const add = (id: string, owed: string, met: boolean) => base.push({ id, owed, met });

  switch (category) {
    case 'FINANCIAL':
    case 'ERP':
    case 'CRM':
    case 'SAAS':
    case 'INTERNAL_BUSINESS': {
      add('data-density', 'dense, tabular data display (a table or tabular numerals), not hero marketing', /<table|<td|font-variant-numeric:\s*tabular-nums/.test(html) || has(/tabular-nums/));
      add('status-colors', 'precise status semantics (success/warn/error declared as named colors)', has(/success|warn|error|danger|status/));
      add('clarity-over-decor', 'clarity over decoration: no aurora gradients on a data surface', !/conic-gradient|radial-gradient/.test(html));
      add('numeric-legibility', 'tabular or mono numerals for figures', has(/tabular-nums|font-family:\s*[^;]*mono|ui-monospace/));
      break;
    }
    case 'STREAMING_MEDIA':
    case 'GAME': {
      add('dark-canvas', 'a dark primary surface (the screen is the product)', /background(-color)?\s*:\s*(#0|black|rgb\(\s*0|var\(--ink|#1)/.test(html));
      add('imagery-led', 'large imagery or video as the primary surface', /<video|<img|poster=/.test(html));
      add('keyboard-first', 'keyboard affordances (kbd or keydown handlers)', has(/<kbd|keydown|keyup/));
      break;
    }
    case 'DEVTOOLS':
    case 'API_INFRASTRUCTURE': {
      add('monospace', 'a monospace type for technical content', has(/mono|ui-monospace|courier/));
      add('code-surfaces', 'code blocks / terminal-style panes', /<pre|<code|<pre>/.test(html));
      add('density-over-whitespace', 'information density (multiple distinct panels/rows), not one hero', /class="[^"]*row|<table|<ul|<dl/.test(html));
      break;
    }
    case 'ECOMMERCE':
    case 'MARKETPLACE': {
      add('product-imagery', 'a product image grid (multiple imgs in a grid/flex)', /<img/.test(html) && /grid|flex/.test(html));
      add('price-display', 'explicit price display (currency / $ / price class)', has(/\$|₹|price|currency/));
      add('discovery-controls', 'filters or sort controls', has(/filter|sort|search/));
      add('checkout-clarity', 'a checkout/cart affordance', has(/checkout|cart|buy now|add to/));
      break;
    }
    case 'BOOKING':
    case 'TRAVEL_HOSPITALITY':
    case 'REAL_ESTATE':
    case 'JOBS_RECRUITMENT': {
      add('calendar-afford', 'a date/calendar affordance (input[type=date] or month names)', /<input[^>]*type=["']date|date-picker|calendar/.test(low) || /january|february|calendar/.test(low));
      add('timezone-honesty', 'a timezone is named or a duration is explicit', has(/tz|timezone|utc|gct|a\.m\.|p\.m\.|\bpm\b|\bam\b/));
      add('confirmation-state', 'a screenshot-able confirmation state (status/badge/confirmed)', has(/confirmed|confirmation|badge|status|reserved/));
      break;
    }
    case 'HEALTHCARE':
    case 'EDUCATION': {
      add('high-legibility', 'calm, high-legibility type (>=16px body or strong leading)', /font-size:\s*(1[6-9]|2\d)px|line-height:\s*([1-3]\.?[5-9]|2)/.test(low));
      add('clinical-status', 'meaningful status color, no playful motion', has(/success|info|warning|status/) && !/bounce|wobble|spin-infinite/.test(low));
      add('calm-palette', 'a calm palette (no 4+ high-chroma accents)', ((low.match(/#[0-9a-f]{6}/g) ?? []).filter((c) => /#[0-9a-f]{2}([a-f]{2})([ef][a-f]|[a-f][ef])/i.test(c)).length < 4));
      break;
    }
    case 'CREATOR_DIGITAL':
    case 'SOCIAL_COMMUNITY': {
      add('motion-craft', 'deliberate motion (transitions/keyframes), not a static page', /transition:|animation:|@keyframes/.test(html));
      add('profile-or-feed', 'a profile or feed structure', has(/profile|feed|post|avatar|follower/));
      add('imagery', 'user imagery', /<img/.test(html));
      break;
    }
    case 'CAD_3D':
    case 'DATA_INTENSIVE': {
      add('workspace-canvas', 'a 3D/visualization workspace (canvas or svg)', /<canvas|<svg|three|scene|viewport/.test(low));
      add('precision-controls', 'precision controls (sliders/inputs in side panels)', /<input[^>]*type=["']range|slider|<input/.test(html));
      add('spec-panels', 'technical spec panels (dl/table/dense lists)', /<dl|<table|<details/.test(html));
      break;
    }
    case 'MOBILE_APP': {
      add('tap-targets', 'sized tap targets (>=44px buttons/links)', /min-height:\s*(4[4-9]|[5-9]\d|1\d\d)px/.test(low));
      add('responsive', 'viewport + media queries', /viewport/.test(low) && /@media/.test(low));
      add('touch-motion', 'touch-friendly motion (transform-based)', /transform/.test(low));
      break;
    }
    case 'DESKTOP_APP':
      add('app-chrome', 'an app frame (header/toolbar/sidebar)', /<header|toolbar|sidebar|nav/.test(low));
      add('dense-panels', 'multiple dense panels, not a hero page', /class="[^"]*panel|<section/.test(low));
      add('keyboard-shortcuts', 'a visible keyboard shortcut affordance', has(/<kbd|shortcut|ctrl\+|⌘/));
      break;
    case 'LOGISTICS':
      add('route-tracker', 'a route/status tracker (timeline/progress)', has(/progress|timeline|tracking|status|shipped|in transit/));
      add('map-or-grid', 'a map or dense grid of shipments', /<canvas|map|<table|grid/.test(low));
      add('real-time-cue', 'a real-time / updated affordance', has(/live|updated|real-time|recent/));
      break;
    case 'UNSEEN':
    default:
      // first-principles: the obligations every product owes, named plainly
      add('a-purposeful-surface', 'the primary surface serves the product, not a generic hero', !/aurora|gradient-hero|the future of/.test(low));
      add('content-that-is-real', 'no placeholder/lorem content', !/lorem ipsum|john doe|placeholder/i.test(low));
      add('one-clear-action', 'a single primary action, not five equal buttons', (low.match(/<button|<a\s[^>]*class="[^"]*btn/g) ?? []).length <= 6);
      add('a-design-of-its-own', 'not the default indigo+pink AI template', !((low.includes('#6366f1') || low.includes('indigo')) && (low.includes('#ec4899') || low.includes('pink'))));
      break;
  }
  return base;
}

/**
 * The P19 scorecard: how well does this HTML fit the design language the
 * product's category OWES, minus what template-slop it carries. The delta
 * between a deliberately-generic artifact and a category-appropriate one is
 * readable here: unmet expectations are named, slop signals are named, and
 * both feed the 0–100 score. This EXTENDS `designGate.auditDesignHtml` —
 * run both: the gate answers "clean?" and P19 answers "right KIND + not slop?"
 */
export function scoreDesignFit(html: string, category: ProjectCategory): DesignFit {
  const profile = profileFor(category);
  const expectations = languageExpectations(html, category);
  const slop = detectTemplateSlop(html);
  const metCount = expectations.filter((e) => e.met).length;
  const owedCount = Math.max(1, expectations.length);

  // each unmet expectation costs (100 / owedCount); slop is capped so a
  // single clean expectation can't be drowned by 10 slop tells
  const expectationScore = Math.round((metCount / owedCount) * 70);
  const slopScore = Math.max(0, 30 - slop.slopPenalty);
  const score = Math.min(100, expectationScore + slopScore);

  return {
    category,
    designLanguage: profile?.designLanguage ?? 'first-principles: the product\'s own purpose, named',
    expectations,
    metCount,
    slop,
    score,
  };
}
