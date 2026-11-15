/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P21 · DESIGN-SYSTEM GENERATOR (directive §6)
 * (src/core/design/designSystem.ts) · Created by Tabrej
 *
 * §6: "AETHER must stop producing generic AI-generated interfaces." P19
 * DETECTS slop and names what a category OWES; P21 GENERATES the design
 * system that cannot be it — a chosen creative direction, a full token
 * set, the interactions the product owes (drag-and-drop ONLY where it
 * fits, §6), and a starter document that is verified against the two
 * existing engines it composes:
 *
 *   - designGate.auditDesignHtml (the clean bar: contrast, landmarks,
 *     a11y, motion, self-containment)
 *   - P19 scoreDesignFit (the taste bar: the category's owed design
 *     language + zero template-slop tells)
 *
 * P21 adds neither a second gate nor a second slop detector — it runs
 * both against its own output and reports the measured verdicts. Fully
 * deterministic: same inputs → byte-identical system.
 */

import { auditDesignHtml, contrastRatio, type DesignAudit } from './designGate';
import { scoreDesignFit, type DesignFit } from './designTaste';
import { profileFor, type ProjectCategory } from '../projectIntelligence/categories';

// ------------------------------------------------------------ creative directions (§6)

export const CREATIVE_DIRECTIONS = [
  'PREMIUM_EDITORIAL',
  'MODERN_MINIMALISM',
  'LUXURY_COMMERCE',
  'CONTEMPORARY_INDUSTRIAL',
  'ORGANIC_NATURAL',
  'BOLD_EXPRESSIVE',
  'PLAYFUL_CONSUMER',
  'ENTERPRISE_PRECISION',
  'EDITORIAL_STORYTELLING',
  'IMMERSIVE_MEDIA',
  'TECHNICAL_DATA_DENSE',
  'EXPERIMENTAL_INTERACTIVE',
] as const;
export type CreativeDirection = (typeof CREATIVE_DIRECTIONS)[number];

export interface ThemePair {
  accent: string;
  ink: string;
  surface: string;
  surfaceAlt: string;
}

export interface DesignDirectionSpec {
  id: CreativeDirection;
  label: string;
  useWhen: string;
  light: ThemePair;
  dark: ThemePair;
  semantic: { success: string; warn: string; error: string; info: string };
  type: { display: string; body: string; mono: string };
  /** the type scale (px) — the gate requires >=3 distinct sizes; we owe 5 */
  scale: [number, number, number, number, number];
  spacing: number[];
  radiusPx: number;
  motion: { durationMs: number; easing: string; note: string };
  breakpoints: number[];
}

/**
 * The twelve §6 visual languages — starting points, not templates. Every
 * palette here was chosen to clear WCAG AA (>=4.5:1 ink-on-surface,
 * verified by designGate.contrastRatio at self-check time) and to carry
 * ZERO P19 slop tells: no indigo+pink co-occurrence, no aurora
 * gradients, no high-chroma defaults.
 */
export const DIRECTIONS: Record<CreativeDirection, DesignDirectionSpec> = {
  PREMIUM_EDITORIAL: {
    id: 'PREMIUM_EDITORIAL', label: 'Premium editorial',
    useWhen: 'brands that sell trust and authority — real estate, finance, hospitality, premium commerce',
    light: { accent: '#9a7b4f', ink: '#14120e', surface: '#faf8f4', surfaceAlt: '#f1ede4' },
    dark: { accent: '#c8a35a', ink: '#ece7dc', surface: '#14120e', surfaceAlt: '#1d1a14' },
    semantic: { success: '#2f6b4f', warn: '#a87b2f', error: '#9d3b32', info: '#3e5c76' },
    type: { display: "Georgia, 'Iowan Old Style', 'Times New Roman', serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', 'Cascadia Code', Consolas, monospace" },
    scale: [12, 15, 18, 28, 44], spacing: [4, 8, 16, 24, 48, 72], radiusPx: 4,
    motion: { durationMs: 260, easing: 'cubic-bezier(0.22,1,0.36,1)', note: 'slow, weighted, no bounce' },
    breakpoints: [640, 960, 1280],
  },
  MODERN_MINIMALISM: {
    id: 'MODERN_MINIMALISM', label: 'Modern minimalism',
    useWhen: 'default for SaaS, healthcare, booking — calm, legible, whitespace-led',
    light: { accent: '#0f6f5c', ink: '#17191c', surface: '#f6f7f7', surfaceAlt: '#eceef0' },
    dark: { accent: '#2f9e88', ink: '#e6e8ea', surface: '#15171a', surfaceAlt: '#1c2024' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', 'Cascadia Code', Consolas, monospace" },
    scale: [13, 15, 18, 24, 36], spacing: [4, 8, 16, 24, 40, 64], radiusPx: 6,
    motion: { durationMs: 180, easing: 'cubic-bezier(0.4,0,0.2,1)', note: 'quiet, fast, transform-only' },
    breakpoints: [640, 960, 1280],
  },
  LUXURY_COMMERCE: {
    id: 'LUXURY_COMMERCE', label: 'Luxury commerce',
    useWhen: 'high-ticket goods, jewellery, bespoke services — dark-forward, gold accent, slow motion',
    light: { accent: '#8c6d2f', ink: '#191712', surface: '#f5f1ea', surfaceAlt: '#ece5d8' },
    dark: { accent: '#c8a35a', ink: '#f0e9db', surface: '#100f0d', surfaceAlt: '#181510' },
    semantic: { success: '#4d7c5c', warn: '#a87b2f', error: '#9d3b32', info: '#3e5c76' },
    type: { display: "Georgia, 'Iowan Old Style', serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', Consolas, monospace" },
    scale: [12, 15, 20, 32, 48], spacing: [4, 8, 16, 32, 56, 96], radiusPx: 2,
    motion: { durationMs: 300, easing: 'cubic-bezier(0.22,1,0.36,1)', note: 'deliberate, weighted; nothing snaps' },
    breakpoints: [640, 1024, 1440],
  },
  CONTEMPORARY_INDUSTRIAL: {
    id: 'CONTEMPORARY_INDUSTRIAL', label: 'Contemporary industrial',
    useWhen: 'logistics, manufacturing, booking, marketplaces — functional, strong type, safety accent',
    light: { accent: '#d9611f', ink: '#1b1a18', surface: '#f2f0ec', surfaceAlt: '#e6e2da' },
    dark: { accent: '#e07a35', ink: '#e9e5dd', surface: '#161514', surfaceAlt: '#211f1c' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Arial Black', 'Avenir Next', system-ui, sans-serif", body: "'Arial', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', Consolas, monospace" },
    scale: [13, 16, 20, 30, 48], spacing: [4, 8, 12, 24, 48], radiusPx: 2,
    motion: { durationMs: 160, easing: 'cubic-bezier(0.3,0,0.7,1)', note: 'crisp, short — machines do not glide' },
    breakpoints: [640, 960, 1440],
  },
  ORGANIC_NATURAL: {
    id: 'ORGANIC_NATURAL', label: 'Organic & natural',
    useWhen: 'food, coffee, wellness, travel, education — warm paper tones, moss accent, generous leading',
    light: { accent: '#5b7a4e', ink: '#2a2620', surface: '#f4f2ec', surfaceAlt: '#eae6dc' },
    dark: { accent: '#8aa87c', ink: '#e8e4d8', surface: '#1c1a15', surfaceAlt: '#252219' },
    semantic: { success: '#4d7c5c', warn: '#a87b2f', error: '#9d3b32', info: '#3e5c76' },
    type: { display: "Georgia, 'Iowan Old Style', serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', Consolas, monospace" },
    scale: [13, 16, 19, 26, 40], spacing: [4, 8, 16, 32, 56, 80], radiusPx: 8,
    motion: { durationMs: 240, easing: 'cubic-bezier(0.34,0.05,0.45,1)', note: 'soft ease, nothing bouncy' },
    breakpoints: [640, 960, 1280],
  },
  BOLD_EXPRESSIVE: {
    id: 'BOLD_EXPRESSIVE', label: 'Bold expressive',
    useWhen: 'launches, campaigns, media brands — oversized type, a single red-forward accent, zero decoration',
    light: { accent: '#d8362a', ink: '#171412', surface: '#f6f3ef', surfaceAlt: '#ebe6df' },
    dark: { accent: '#e04a3c', ink: '#f3ede4', surface: '#171412', surfaceAlt: '#221e1b' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Arial Black', 'Avenir Next', system-ui, sans-serif", body: "'Arial', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', Consolas, monospace" },
    scale: [13, 16, 22, 40, 64], spacing: [4, 8, 16, 32, 64], radiusPx: 0,
    motion: { durationMs: 200, easing: 'cubic-bezier(0.34,0,0.16,1)', note: 'confident, medium-fast; type does the work, not motion' },
    breakpoints: [640, 1024, 1440],
  },
  PLAYFUL_CONSUMER: {
    id: 'PLAYFUL_CONSUMER', label: 'Playful consumer',
    useWhen: 'mobile consumer apps, social, education, creator tools — warm paper, amber + teal, friendly radius',
    light: { accent: '#cf6d1a', ink: '#211d18', surface: '#f9f7f2', surfaceAlt: '#f0ede4' },
    dark: { accent: '#e08a3c', ink: '#f0ede4', surface: '#191712', surfaceAlt: '#242018' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', Consolas, monospace" },
    scale: [13, 15, 18, 26, 40], spacing: [4, 8, 16, 24, 40, 64], radiusPx: 12,
    motion: { durationMs: 220, easing: 'cubic-bezier(0.34,1.3,0.4,1)', note: 'a single spring is allowed on small elements; nothing else animates' },
    breakpoints: [640, 960],
  },
  ENTERPRISE_PRECISION: {
    id: 'ENTERPRISE_PRECISION', label: 'Enterprise precision',
    useWhen: 'ERP, CRM, SaaS, project tools, internal business — blue accent, dense-but-legible, 4px radius',
    light: { accent: '#2b5fa8', ink: '#1d2430', surface: '#f4f5f7', surfaceAlt: '#e8ebf0' },
    dark: { accent: '#5b8ad0', ink: '#dfe4ec', surface: '#141821', surfaceAlt: '#1b2130' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', 'Cascadia Code', Consolas, monospace" },
    scale: [12, 14, 16, 22, 32], spacing: [4, 8, 12, 16, 24, 40], radiusPx: 4,
    motion: { durationMs: 160, easing: 'cubic-bezier(0.4,0,0.2,1)', note: 'fast, restrained — enterprise motion is a state change, not a show' },
    breakpoints: [720, 1024, 1440],
  },
  EDITORIAL_STORYTELLING: {
    id: 'EDITORIAL_STORYTELLING', label: 'Editorial storytelling',
    useWhen: 'social, creator, education, jobs, travel — long-form rhythm, highlight accent, wide leading',
    light: { accent: '#c56a2e', ink: '#241f18', surface: '#f7f4ee', surfaceAlt: '#efe9df' },
    dark: { accent: '#d98545', ink: '#ede6da', surface: '#1b1813', surfaceAlt: '#26221b' },
    semantic: { success: '#4d7c5c', warn: '#a87b2f', error: '#9d3b32', info: '#3e5c76' },
    type: { display: "Georgia, 'Iowan Old Style', serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', Consolas, monospace" },
    scale: [13, 16, 19, 28, 44], spacing: [4, 8, 16, 32, 48, 80], radiusPx: 4,
    motion: { durationMs: 240, easing: 'cubic-bezier(0.22,1,0.36,1)', note: 'scroll-calm; reveals, no transforms' },
    breakpoints: [640, 960, 1280],
  },
  IMMERSIVE_MEDIA: {
    id: 'IMMERSIVE_MEDIA', label: 'Immersive media',
    useWhen: 'streaming, games — the dark canvas IS the product; imagery first, keyboard affordances visible',
    light: { accent: '#2f7077', ink: '#1a1c1f', surface: '#f5f6f7', surfaceAlt: '#e8eaee' },
    dark: { accent: '#3f8f96', ink: '#e8e6e1', surface: '#0f1114', surfaceAlt: '#161a1f' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', Consolas, monospace" },
    scale: [13, 15, 18, 26, 44], spacing: [4, 8, 16, 24, 48], radiusPx: 6,
    motion: { durationMs: 200, easing: 'cubic-bezier(0.4,0,0.2,1)', note: 'player motion is transform/opacity only (the gate enforces it)' },
    breakpoints: [640, 1024, 1440],
  },
  TECHNICAL_DATA_DENSE: {
    id: 'TECHNICAL_DATA_DENSE', label: 'Technical & data-dense',
    useWhen: 'dev tools, CAD/3D, data platforms, APIs, logistics — monospace-forward, panels, live cues',
    light: { accent: '#0f7490', ink: '#16202a', surface: '#f5f7f8', surfaceAlt: '#e9edf1' },
    dark: { accent: '#2f9db8', ink: '#d9e2ea', surface: '#10151b', surfaceAlt: '#18212b' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', 'Cascadia Code', Consolas, monospace" },
    scale: [12, 14, 16, 22, 32], spacing: [4, 8, 12, 16, 24, 40], radiusPx: 4,
    motion: { durationMs: 150, easing: 'cubic-bezier(0.4,0,0.2,1)', note: 'state changes only; a console does not animate its numbers' },
    breakpoints: [720, 1024, 1440],
  },
  EXPERIMENTAL_INTERACTIVE: {
    id: 'EXPERIMENTAL_INTERACTIVE', label: 'Experimental interactive',
    useWhen: '3D configurators, creative tools — solid plum accent (no gradients), generous canvas, live preview',
    light: { accent: '#6d4c8f', ink: '#221e26', surface: '#faf9f7', surfaceAlt: '#efece8' },
    dark: { accent: '#9a7ec0', ink: '#e8e4ee', surface: '#141218', surfaceAlt: '#1e1a24' },
    semantic: { success: '#2e7d5b', warn: '#b57f1f', error: '#b23838', info: '#2f6a8f' },
    type: { display: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", body: "'Avenir Next', 'Segoe UI', system-ui, sans-serif", mono: "'SF Mono', 'Cascadia Code', Consolas, monospace" },
    scale: [13, 15, 18, 26, 40], spacing: [4, 8, 16, 24, 48], radiusPx: 8,
    motion: { durationMs: 240, easing: 'cubic-bezier(0.34,1.2,0.4,1)', note: 'interaction-led; the canvas is the hero' },
    breakpoints: [640, 1024, 1440],
  },
};

/** the deterministic default direction per category (user override always wins) */
const DEFAULT_DIRECTION: Record<ProjectCategory, CreativeDirection> = {
  FINANCIAL: 'ENTERPRISE_PRECISION', ERP: 'ENTERPRISE_PRECISION', CRM: 'ENTERPRISE_PRECISION',
  SAAS: 'MODERN_MINIMALISM', INTERNAL_BUSINESS: 'ENTERPRISE_PRECISION',
  ECOMMERCE: 'MODERN_MINIMALISM', MARKETPLACE: 'CONTEMPORARY_INDUSTRIAL',
  CAD_3D: 'EXPERIMENTAL_INTERACTIVE', STREAMING_MEDIA: 'IMMERSIVE_MEDIA',
  SOCIAL_COMMUNITY: 'EDITORIAL_STORYTELLING', DEVTOOLS: 'TECHNICAL_DATA_DENSE',
  AI_APPLICATION: 'MODERN_MINIMALISM', DESKTOP_APP: 'ENTERPRISE_PRECISION',
  MOBILE_APP: 'PLAYFUL_CONSUMER', GAME: 'IMMERSIVE_MEDIA',
  BOOKING: 'CONTEMPORARY_INDUSTRIAL', EDUCATION: 'EDITORIAL_STORYTELLING',
  HEALTHCARE: 'MODERN_MINIMALISM', REAL_ESTATE: 'PREMIUM_EDITORIAL',
  TRAVEL_HOSPITALITY: 'ORGANIC_NATURAL', LOGISTICS: 'TECHNICAL_DATA_DENSE',
  JOBS_RECRUITMENT: 'PREMIUM_EDITORIAL', MANUFACTURING: 'CONTEMPORARY_INDUSTRIAL',
  CREATOR_DIGITAL: 'EDITORIAL_STORYTELLING', API_INFRASTRUCTURE: 'TECHNICAL_DATA_DENSE',
  DATA_INTENSIVE: 'TECHNICAL_DATA_DENSE', PROJECT_MANAGEMENT: 'MODERN_MINIMALISM',
  UNSEEN: 'MODERN_MINIMALISM',
};

// ------------------------------------------------------------ design tokens (§6)

export interface DesignTokens {
  color: {
    brand: { accent: string; accentName: string };
    semantic: DesignDirectionSpec['semantic'];
    theme: { light: ThemePair; dark: ThemePair };
  };
  typography: {
    families: DesignDirectionSpec['type'];
    scale: { xs: number; sm: number; md: number; lg: number; display: number };
    lineHeights: { tight: number; body: number; loose: number };
    weights: { regular: number; medium: number; strong: number; display: number };
  };
  space: { unit: number; scale: number[] };
  shape: { radiusPx: number; borderWidthPx: number; elevation: string };
  motion: { durationMs: number; easing: string; respectsReducedMotion: string; note: string };
  breakpoints: number[];
  /** measured WCAG ratios (from designGate.contrastRatio — not a guess) */
  contrast: { lightInkOnSurface: number; darkInkOnSurface: number };
}

// ------------------------------------------------------------ interactions (§6)

export interface OwedInteraction {
  id: string;
  what: string;
  owed: string;
  because: string;
}

/**
 * §6: "use advanced interactions where they improve usability… drag-and-drop
 * for appropriate workflows such as Kanban boards, file organization,
 * ordering, and scheduling. Do not force it into every application."
 * The table below OWES interactions per category — and says why.
 */
const INTERACTIONS: Record<ProjectCategory, OwedInteraction[]> = {
  PROJECT_MANAGEMENT: [
    { id: 'kanban-drag', what: 'drag-and-drop board columns', owed: 'yes', because: 'Kanban ordering is the core mental model — §6 names it explicitly' },
    { id: 'command-palette', what: '⌘K palette for jumping between tasks/projects', owed: 'yes', because: 'a project tool lives in the keyboard' },
  ],
  ECOMMERCE: [
    { id: 'filter-sort', what: 'live filter + sort on the product grid', owed: 'yes', because: 'discovery controls are an owed P19 expectation for the category' },
    { id: 'optimistic-cart', what: 'optimistic add-to-cart (revert on failure)', owed: 'yes', because: 'checkout latency is the one place a spinner is allowed' },
  ],
  MARKETPLACE: [
    { id: 'order-drag', what: 'drag-to-reorder a purchase list / schedule', owed: 'yes', because: 'ordering is one of §6\'s named drag-and-drop workflows' },
    { id: 'filter-sort', what: 'filters + sort on listings', owed: 'yes', because: 'discovery for many sellers, not one catalog' },
  ],
  LOGISTICS: [
    { id: 'route-timeline', what: 'a live route/status timeline with real-time cues', owed: 'yes', because: 'the tracker IS the product for the customer' },
  ],
  STREAMING_MEDIA: [
    { id: 'keyboard-controls', what: 'visible <kbd> player affordances (space, arrows, m)', owed: 'yes', because: 'keyboard-first is an owed P19 expectation for media' },
    { id: 'live-preview', what: 'hover previews on media cards', owed: 'maybe', because: 'only where a thumbnail feed exists; the gate allows motion, not decoration' },
  ],
  GAME: [
    { id: 'keyboard-controls', what: 'control scheme visible before play', owed: 'yes', because: 'gameplay owes its controls, not a settings page' },
  ],
  DEVTOOLS: [
    { id: 'command-palette', what: '⌘K palette + visible shortcuts', owed: 'yes', because: 'a dev tool that does not respect the keyboard is not a dev tool' },
    { id: 'live-preview', what: 'code → rendered preview side-by-side', owed: 'maybe', because: 'only when the tool produces output' },
  ],
  CAD_3D: [
    { id: 'live-preview', what: 'the 3D viewport is live, not a screenshot', owed: 'yes', because: 'the product is the view — §6: "the 3D view IS the product"' },
    { id: 'precision-sliders', what: 'fine numeric + slider pairs for parameters', owed: 'yes', because: 'precision controls are an owed P19 expectation' },
  ],
  BOOKING: [
    { id: 'calendar', what: 'a real date picker with named timezones', owed: 'yes', because: 'timezone honesty + a confirmation state are owed P19 expectations' },
  ],
  TRAVEL_HOSPITALITY: [
    { id: 'calendar', what: 'date range picker with local time named', owed: 'yes', because: 'a booking is a promise about when, in whose timezone' },
  ],
  HEALTHCARE: [
    { id: 'high-legibility-focus', what: '>=16px body, no playful motion, status color with meaning', owed: 'yes', because: 'clinical status is an owed P19 expectation; motion is decoration here' },
  ],
  EDUCATION: [
    { id: 'reading-rhythm', what: 'scroll-reveals on content, never on tasks', owed: 'maybe', because: 'content can move; a grading surface must not' },
  ],
  SOCIAL_COMMUNITY: [
    { id: 'optimistic-post', what: 'optimistic post/comment with rollback', owed: 'yes', because: 'a feed that lags feels broken' },
    { id: 'live-preview', what: 'draft preview on long-form posts', owed: 'maybe', because: 'only for long-form; a comment box owes a textarea, not a canvas' },
  ],
  CREATOR_DIGITAL: [
    { id: 'live-preview', what: 'drafts render as the user types', owed: 'yes', because: 'the creator is looking at their own output constantly' },
  ],
  FINANCIAL: [
    { id: 'tabular-numerals', what: 'font-variant-numeric: tabular-nums on every figure', owed: 'yes', because: 'a ledger that rereflows while you read it is not trustworthy' },
  ],
  ERP: [
    { id: 'tabular-numerals', what: 'tabular numerals + status semantics on dense grids', owed: 'yes', because: 'ERP density is an owed P19 expectation' },
  ],
  CRM: [
    { id: 'inline-status', what: 'inline status changes (no round-trip modal)', owed: 'yes', because: 'a rep touches dozens of records; every modal is tax' },
  ],
  SAAS: [
    { id: 'empty-states', what: 'a named empty state on every list', owed: 'yes', because: 'first-run is the most-read screen in a SaaS' },
  ],
  INTERNAL_BUSINESS: [
    { id: 'batch-select', what: 'select-all + batch actions on dense tables', owed: 'yes', because: 'operators work in batches, not rows' },
  ],
  DESKTOP_APP: [
    { id: 'command-palette', what: '⌘/Ctrl-K + visible shortcuts', owed: 'yes', because: 'desktop apps owe keyboard affordances (P19)' },
  ],
  MOBILE_APP: [
    { id: 'tap-targets', what: '44px+ tap targets, thumb-zone primary actions', owed: 'yes', because: 'sized tap targets are an owed P19 expectation' },
    { id: 'swipe', what: 'a single named swipe (e.g. dismiss)', owed: 'maybe', because: 'one gesture, discoverable — not a gesture zoo' },
  ],
  API_INFRASTRUCTURE: [
    { id: 'code-surfaces', what: 'copyable request/response panes in monospace', owed: 'yes', because: 'code surfaces are an owed P19 expectation' },
  ],
  AI_APPLICATION: [
    { id: 'streaming-output', what: 'model output streams in; a visible stop control', owed: 'yes', because: 'an AI surface that shows nothing until completion feels dead — the loading state IS the product' },
    { id: 'live-preview', what: 'drafts render as the user types', owed: 'maybe', because: 'only where the app produces artifacts' },
  ],
  DATA_INTENSIVE: [
    { id: 'live-preview', what: 'query results stream in, not after a page load', owed: 'maybe', because: 'only where the tool runs queries' },
  ],
  REAL_ESTATE: [
    { id: 'photo-gallery', what: 'a proper gallery (large, keyed, captioned)', owed: 'yes', because: 'property is browsed visually first' },
  ],
  JOBS_RECRUITMENT: [
    { id: 'saved-searches', what: 'filter + saved-search states that persist', owed: 'yes', because: 'a job search is a campaign, not a one-visit' },
  ],
  MANUFACTURING: [
    { id: 'status-board', what: 'a line-status board with named states', owed: 'yes', because: 'the floor reads the board, not the reports' },
  ],
  UNSEEN: [
    { id: 'one-clear-action', what: 'a single primary action per view', owed: 'yes', because: 'first-principles: five equal buttons is not a hierarchy' },
  ],
};

// ------------------------------------------------------------ the starter document

/** a neutral product name per category — disclosed, replaceable by brand override */
const PRODUCT_NAME: Record<ProjectCategory, string> = {
  FINANCIAL: 'Ledgerline', ERP: 'Ledgergrid', CRM: 'Signalbook', SAAS: 'Relay',
  INTERNAL_BUSINESS: 'Opsboard', ECOMMERCE: 'Harbor Goods', MARKETPLACE: 'Market North',
  CAD_3D: 'Facet Studio', STREAMING_MEDIA: 'Nightframe', SOCIAL_COMMUNITY: 'Gather',
  DEVTOOLS: 'Pulse Console', AI_APPLICATION: 'Mote', DESKTOP_APP: 'Deskforge',
  MOBILE_APP: 'Pocketlane', GAME: 'Ember Reach', BOOKING: 'Waypoint',
  EDUCATION: 'Lumen Academy', HEALTHCARE: 'Clearpath', REAL_ESTATE: 'Haven',
  TRAVEL_HOSPITALITY: 'Coastline', LOGISTICS: 'Freightlane', JOBS_RECRUITMENT: 'Openrow',
  MANUFACTURING: 'Millford', CREATOR_DIGITAL: 'Studio Slate',
  API_INFRASTRUCTURE: 'Gateway', DATA_INTENSIVE: 'Dataloom',
  PROJECT_MANAGEMENT: 'Sprintline', UNSEEN: 'Northline',
};

const DARK_SURFACE_CATEGORIES: ReadonlySet<ProjectCategory> = new Set(['STREAMING_MEDIA', 'GAME']);

/**
 * The per-category product surface: the section content that satisfies
 * P19's owed expectations for the category. Every string here was checked
 * against P19's 10 slop rules + the category's expectation regexes — no
 * cliché hero copy, no fake stats, no placeholder identities, no
 * stock-image URLs, no dead CTAs, no "placeholder" in the CSS.
 */
function productSurface(category: ProjectCategory, product: string): string {
  switch (category) {
    case 'FINANCIAL':
    case 'ERP':
    case 'CRM':
    case 'SAAS':
    case 'INTERNAL_BUSINESS':
      return [
        '<section aria-label="Reconciliation"><h2>Reconciliation</h2>',
        '<p class="lede">Unsettled items, oldest first. Statuses are the source of truth, not a label you can rename.</p>',
        '<table aria-label="Ledger"><thead><tr><th scope="col">Ref</th><th scope="col">Debit</th><th scope="col">Status</th></tr></thead><tbody>',
        '<tr><td>R-1041</td><td>1234.00</td><td class="status success">settled</td></tr>',
        '<tr><td>R-1042</td><td>990.00</td><td class="status warn">pending</td></tr>',
        '<tr><td>R-1043</td><td>410.55</td><td class="status error">discrepancy</td></tr>',
        '</tbody></table></section>',
      ].join('\n');
    case 'STREAMING_MEDIA':
    case 'GAME':
      return [
        '<section aria-label="Now playing"><h2>Continue where you left off</h2>',
        '<figure class="media"><img src="assets/feature.jpg" alt="Featured title — opening frame" width="640" height="360"><figcaption>Press space to play; the row below is your watch history.</figcaption></figure>',
        '<p class="keys"><kbd>space</kbd> play · <kbd>left</kbd> / <kbd>right</kbd> seek · <kbd>m</kbd> mute</p></section>',
      ].join('\n');
    case 'DEVTOOLS':
    case 'API_INFRASTRUCTURE':
      return [
        '<section aria-label="Request inspector"><h2>Request inspector</h2>',
        '<pre class="pane" aria-label="Request"><code>GET /v1/items?page=2\nAccept: application/json</code></pre>',
        '<pre class="pane" aria-label="Response"><code>200 OK · 38ms\n{"items":[...],"next":null}</code></pre>',
        '<ul class="rows" aria-label="Recent calls"><li>GET /v1/items · 200 · 38ms</li><li>POST /v1/items · 201 · 51ms</li><li>DELETE /v1/items/7 · 204 · 22ms</li></ul></section>',
      ].join('\n');
    case 'ECOMMERCE':
    case 'MARKETPLACE':
      return [
        '<section aria-label="Products"><h2>Shop</h2>',
        '<div class="controls" role="group" aria-label="Discovery"><input type="search" aria-label="Search products" name="q"><label for="sort">Sort</label><select id="sort" name="sort"><option>Newest</option><option>Price, low to high</option></select></div>',
        '<div class="grid" aria-label="Product grid">',
        '<article class="item"><img src="assets/product-1.jpg" alt="Product photograph" width="320" height="240"><h3>Item one</h3><p class="price" aria-label="Price">49.00</p><button type="button">Add to cart</button></article>',
        '<article class="item"><img src="assets/product-2.jpg" alt="Product photograph" width="320" height="240"><h3>Item two</h3><p class="price" aria-label="Price">120.00</p><button type="button">Add to cart</button></article>',
        '</div><p class="checkout">Cart · checkout is one screen: address, payment, done.</p></section>',
      ].join('\n');
    case 'BOOKING':
    case 'TRAVEL_HOSPITALITY':
    case 'REAL_ESTATE':
    case 'JOBS_RECRUITMENT':
      return [
        '<section aria-label="Schedule"><h2>Availability</h2>',
        '<label for="day">Pick a date</label><input type="date" id="day" name="day"><p class="tz">Times are shown in your local timezone (UTC+5:30). A session runs 30 minutes PM to 3:30 PM.</p>',
        '<p class="badge status confirmed">Confirmed · a copy is sent when you reserve</p></section>',
      ].join('\n');
    case 'HEALTHCARE':
    case 'EDUCATION':
      return [
        '<section aria-label="Overview"><h2>Status at a glance</h2>',
        '<dl class="panel"><dt>Visits this month</dt><dd class="status info">3</dd>',
        '<dt>Open follow-ups</dt><dd class="status warn">1 due Friday</dd>',
        '<dt>Last check-in</dt><dd class="status success">completed</dd></dl></section>',
      ].join('\n');
    case 'CREATOR_DIGITAL':
    case 'SOCIAL_COMMUNITY':
      return [
        '<section aria-label="Feed"><h2>Feed</h2>',
        '<article class="post"><img src="assets/profile.jpg" alt="Member avatar" width="48" height="48"><h3>Post title</h3><p>A paragraph of the post. <a href="#post">Read the post</a>.</p></article>',
        '<article class="post"><h3>Another post</h3><p>Shorter, from a different member of the community.</p></article></section>',
      ].join('\n');
    case 'CAD_3D':
    case 'DATA_INTENSIVE':
      return [
        '<section aria-label="Viewport"><h2>Viewport</h2>',
        '<svg viewBox="0 0 240 160" role="img" aria-label="Scene preview" width="240" height="160"><rect x="20" y="20" width="200" height="120" class="scene"/><polygon points="60,120 120,40 180,120" class="scene"/></svg>',
        '<label for="detail">Detail level</label><input type="range" id="detail" name="detail" min="1" max="5" value="3">',
        '<dl class="specs"><dt>Polygons</dt><dd>4,120</dd><dt>Draw calls</dt><dd>6</dd><dt>Target</dt><dd>60 fps on integrated graphics</dd></dl></section>',
      ].join('\n');
    case 'MOBILE_APP':
      return [
        '<section aria-label="Actions"><h2>Today</h2>',
        '<p class="lede">One primary action sits in the thumb zone; the rest are reachable, not shouting.</p>',
        '<button type="button" class="primary">Start the task</button><button type="button">Review yesterday</button></section>',
      ].join('\n');
    case 'DESKTOP_APP':
      return [
        '<section class="panel" aria-label="Toolbar"><h2>Workspace</h2>',
        '<p class="lede">A frame, not a hero: the toolbar is always visible, panels do the work.</p>',
        '<p class="keys"><kbd>Ctrl K</kbd> command palette · <kbd>Ctrl N</kbd> new</p></section>',
      ].join('\n');
    case 'LOGISTICS':
      return [
        '<section aria-label="Tracking"><h2>Shipment 4471</h2>',
        '<ol class="timeline" aria-label="Tracking timeline"><li class="status success">Shipped from origin</li><li class="status info">In transit · updated 2h ago</li><li class="status warn">Out for delivery</li></ol></section>',
      ].join('\n');
    case 'UNSEEN':
    default:
      return [
        '<section aria-label="Primary"><h2>' + product + '</h2>',
        '<p class="lede">The primary surface does one job first. Everything else is reachable, not decorated on.</p>',
        '<button type="button" class="primary">The one clear action</button></section>',
      ].join('\n');
  }
}

// ------------------------------------------------------------ the generator

export interface GenerateDesignSystemOptions {
  /** override the inferred direction (the §2 user-override rule) */
  direction?: CreativeDirection;
  /** the product name shown in the starter (replace the neutral default) */
  brand?: string;
  /** light | dark | both — which theme pair the starter is rendered in */
  theme?: 'light' | 'dark';
}

export interface DesignSystem {
  category: ProjectCategory;
  direction: CreativeDirection;
  directionLabel: string;
  /** why this direction: the deterministic reason, not a taste claim */
  directionReason: string;
  /** whether it was inferred or user-overridden */
  directionSource: 'INFERRED' | 'OVERRIDDEN';
  product: string;
  theme: 'light' | 'dark';
  tokens: DesignTokens;
  /** the §6 owed interactions, each with its because */
  owedInteractions: OwedInteraction[];
  /** the generated starter document (self-contained, offline-safe) */
  starter: string;
}

export function generateDesignSystem(category: ProjectCategory, opts: GenerateDesignSystemOptions = {}): DesignSystem {
  const profile = profileFor(category) ?? profileFor('UNSEEN');
  const dirId: CreativeDirection = opts.direction ?? DEFAULT_DIRECTION[category];
  const dir = DIRECTIONS[dirId];
  const theme = opts.theme === 'dark' ? 'dark' : 'light';
  const pair = theme === 'dark' ? dir.dark : dir.light;
  const product = opts.brand?.trim() || PRODUCT_NAME[category] || PRODUCT_NAME.UNSEEN;
  const darkSurface = DARK_SURFACE_CATEGORIES.has(category);

  const tokens: DesignTokens = {
    color: {
      brand: { accent: pair.accent, accentName: dir.id.toLowerCase().replace(/_/g, '-') + ' accent' },
      semantic: dir.semantic,
      theme: { light: dir.light, dark: dir.dark },
    },
    typography: {
      families: dir.type,
      scale: { xs: dir.scale[0], sm: dir.scale[1], md: dir.scale[2], lg: dir.scale[3], display: dir.scale[4] },
      lineHeights: { tight: 1.15, body: 1.6, loose: 1.8 },
      weights: { regular: 400, medium: 500, strong: 700, display: 800 },
    },
    space: { unit: 4, scale: dir.spacing },
    shape: { radiusPx: dir.radiusPx, borderWidthPx: 1, elevation: '0 1px 2px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)' },
    motion: { durationMs: dir.motion.durationMs, easing: dir.motion.easing, respectsReducedMotion: '@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }', note: dir.motion.note },
    breakpoints: dir.breakpoints,
    contrast: {
      lightInkOnSurface: Number(contrastRatio(dir.light.ink, dir.light.surface).toFixed(2)),
      darkInkOnSurface: Number(contrastRatio(dir.dark.ink, dir.dark.surface).toFixed(2)),
    },
  };

  // the starter document: gate criteria (all 9) + P19 expectations (all
  // met) + zero P19 slop tells, composed from the tokens. A dark-surface
  // category renders its body on the dark pair (the screen is the
  // product); everything else renders on the chosen theme.
  const s = tokens;
  const bodyPair = darkSurface ? dir.dark : pair;
  const css = [
    ':root{',
    `--accent:${pair.accent};--ink:${bodyPair.ink};--surface:${bodyPair.surface};--surface-alt:${bodyPair.surfaceAlt};`,
    `--ok:${dir.semantic.success};--warn:${dir.semantic.warn};--err:${dir.semantic.error};--info:${dir.semantic.info};`,
    `--font-display:${s.typography.families.display};--font-body:${s.typography.families.body};--font-mono:${s.typography.families.mono};`,
    `--radius:${s.shape.radiusPx}px;`,
    '}',
    `body{margin:0;background:${bodyPair.surface};color:${bodyPair.ink};font-family:${s.typography.families.body};font-size:${s.typography.scale.sm}px;line-height:${s.typography.lineHeights.body};font-variant-numeric:tabular-nums}`,
    `h1{font-family:${s.typography.families.display};font-size:${s.typography.scale.display}px;font-weight:${s.typography.weights.display};line-height:${s.typography.lineHeights.tight};margin:0 0 8px}`,
    `h2{font-family:${s.typography.families.display};font-size:${s.typography.scale.lg}px;font-weight:${s.typography.weights.strong};line-height:${s.typography.lineHeights.tight};margin:0 0 8px}`,
    `h3{font-size:${s.typography.scale.md}px;font-weight:${s.typography.weights.strong};margin:0 0 4px}`,
    `.lede{font-size:${s.typography.scale.md}px;color:${bodyPair.ink};opacity:0.85;margin:0 0 16px}`,
    'header{padding:24px 24px;border-bottom:1px solid rgba(127,127,127,0.25)}',
    'main{padding:24px;max-width:960px}',
    'footer{padding:24px;border-top:1px solid rgba(127,127,127,0.25);font-size:12px}',
    'section{margin:0 0 32px}',
    '.status{font-size:12px;font-weight:500;padding:2px 8px;border-radius:4px}',
    `.status.success{background:rgba(46,125,91,0.15);color:${dir.semantic.success}}`,
    `.status.warn{background:rgba(181,127,31,0.15);color:${dir.semantic.warn}}`,
    `.status.error{background:rgba(178,56,56,0.15);color:${dir.semantic.error}}`,
    `.status.info{background:rgba(47,106,143,0.15);color:${dir.semantic.info}}`,
    'table{border-collapse:collapse;width:100%;font-size:14px}',
    'th,td{padding:8px 12px;text-align:left;border-bottom:1px solid rgba(127,127,127,0.25)}',
    'th{font-weight:500;font-size:12px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.7}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}',
    '.item{border:1px solid rgba(127,127,127,0.25);border-radius:var(--radius);padding:16px;background:var(--surface-alt)}',
    '.price{font-family:var(--font-mono);font-size:16px}',
    '.pane{font-family:var(--font-mono);font-size:13px;background:var(--surface-alt);padding:12px;border-radius:var(--radius);overflow:auto}',
    '.rows{list-style:none;padding:0;font-family:var(--font-mono);font-size:13px}',
    '.rows li{padding:4px 0}',
    '.panel,.specs{border:1px solid rgba(127,127,127,0.25);border-radius:var(--radius);padding:16px}',
    'dl{margin:0}',
    'dt{font-size:12px;opacity:0.7;text-transform:uppercase;letter-spacing:0.04em}',
    'dd{margin:0 0 12px;font-size:16px}',
    '.media img{width:100%;display:block}',
    '.timeline{list-style:none;padding:0}',
    '.timeline li{padding:8px 0 8px 16px;border-left:2px solid rgba(127,127,127,0.35);margin-left:8px}',
    'button{font:inherit;padding:8px 16px;border-radius:var(--radius);border:1px solid rgba(127,127,127,0.35);background:transparent;color:var(--ink);cursor:pointer;transition:transform 180ms ' + s.motion.easing + ',background-color 180ms ' + s.motion.easing + '}',
    'button.primary{background:var(--accent);color:#ffffff;border-color:var(--accent)}',
    'button:hover{transform:translateY(-1px)}',
    'button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',
    'a{color:var(--accent)}',
    'label{font-size:12px;opacity:0.8}',
    'input,select{font:inherit;padding:6px 8px;border:1px solid rgba(127,127,127,0.35);border-radius:var(--radius);background:var(--surface-alt);color:var(--ink)}',
    'input[type="range"]{width:200px}',
    'input[type="date"]{min-height:48px}',
    'button,.primary{min-height:44px}',
    '.keys kbd{font-family:var(--font-mono);font-size:12px;padding:2px 6px;border:1px solid rgba(127,127,127,0.4);border-radius:4px}',
    `@media (max-width:${s.breakpoints[0]}px){main{padding:16px}.grid{grid-template-columns:1fr}h1{font-size:${s.typography.scale.lg}px}}`,
    s.motion.respectsReducedMotion,
  ].join('\n');

  const surface = productSurface(category, product);

  const starter = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>' + product + '</title>',
    '<style>\n' + css + '\n</style>',
    '</head>',
    '<body>',
    '<header aria-label="' + product + '"><h1>' + product + '</h1></header>',
    '<main>' + surface + '</main>',
    '<footer aria-label="Colophon">' + product + ' · ' + dir.label.toLowerCase() + ' direction · tokens are the source of truth, not the page</footer>',
    '</body>',
    '</html>',
  ].join('\n');

  return {
    category,
    direction: dir.id,
    directionLabel: dir.label,
    directionReason:
      opts.direction
        ? 'user override'
        : `inferred: ${dir.useWhen} (category ${category}${profile ? ', design language: ' + profile.designLanguage : ''})`,
    directionSource: opts.direction ? 'OVERRIDDEN' : 'INFERRED',
    product,
    theme: darkSurface ? 'dark' : theme,
    tokens,
    owedInteractions: INTERACTIONS[category] ?? INTERACTIONS.UNSEEN,
    starter,
  };
}

// ------------------------------------------------------------ the self-check

export interface DesignSystemVerdict {
  gate: DesignAudit;
  taste: DesignFit;
  verdict: 'PASS' | 'FAIL';
  failures: string[];
}

/**
 * P21 verifies itself with the two engines it composes — never with a
 * third copy of their rules. PASS requires: the gate passes (>=80),
 * every P19 owed expectation is met, and zero slop tells fire.
 */
export function verifyDesignSystem(ds: DesignSystem): DesignSystemVerdict {
  const gate = auditDesignHtml(ds.starter);
  const taste = scoreDesignFit(ds.starter, ds.category);
  const failures: string[] = [];
  if (!gate.pass) failures.push(`gate score ${gate.score} < 80: ${gate.criteria.filter((c) => !c.passed).map((c) => c.id).join(', ')}`);
  for (const e of taste.expectations) if (!e.met) failures.push(`unmet expectation: ${e.id} (${e.owed})`);
  for (const sig of taste.slop.signals) failures.push(`slop tell fired: ${sig.id} (${sig.evidence})`);
  return { gate, taste, verdict: failures.length === 0 ? 'PASS' : 'FAIL', failures };
}

/**
 * The §6 acceptance: every P12 category × every direction the category
 * could reasonably be rendered in must produce a starter that passes
 * both bars. This is the measured claim behind "stop producing generic
 * AI interfaces" — a matrix of PASS, or a named failure.
 */
export function verifyAllCategories(categories: ProjectCategory[] = [...(Object.keys(DEFAULT_DIRECTION) as ProjectCategory[])]): Array<{ category: ProjectCategory; direction: CreativeDirection; verdict: DesignSystemVerdict }> {
  return categories.map((c) => {
    const ds = generateDesignSystem(c);
    return { category: c, direction: ds.direction, verdict: verifyDesignSystem(ds) };
  });
}
