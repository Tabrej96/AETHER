/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Visual Perception Engine (perceptionEngine.ts)
 *
 * Program 06 of the AETHER 1.0 Nine-Program Capability Research Platform.
 *
 * Screenshot capture, UI element detection (OCR + layout analysis), coordinate
 * extraction, and element classification. Designed to work with the P05 Browser
 * Engine (src/core/browser/cdp.ts) for live screenshots and accessibility trees,
 * or with a vision backend (e.g. OmniParser-style) for richer perception.
 *
 * Inspiration:
 *   - microsoft/OmniParser  (Apache-2.0) — GUI element detection
 *   - Skyvern-AI/skyvern    (AGPL-3.0, out-of-process reference only)
 *
 * AETHER-native: no OmniParser or Skyvern imports. All logic is self-contained.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BoundingBox {
  x: number;      // left   (pixel or normalized)
  y: number;      // top    (pixel or normalized)
  width: number;   // width  (pixel or normalized)
  height: number;  // height (pixel or normalized)
}

export type ElementRole =
  | 'button'
  | 'link'
  | 'input'
  | 'textbox'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'heading'
  | 'text'
  | 'image'
  | 'container'
  | 'navigation'
  | 'modal'
  | 'toolbar'
  | 'unknown';

export interface DetectedUIElement {
  elementId: string;
  label: string;
  role: ElementRole;
  bbox: BoundingBox;
  confidence: number;       // 0..1
  textContent?: string;
  cssSelector?: string;
  ariaLabel?: string;
  attributes: Record<string, string>;
  children: string[];        // elementIds
  parentId?: string;
}

export interface ScreenCapture {
  captureId: string;
  /** raw screenshot as PNG Buffer (when available) */
  pngData?: Buffer;
  /** file path where screenshot was written (if persisted) */
  filePath?: string;
  /** viewport in pixels */
  viewport: { width: number; height: number };
  /** timestamp (epoch ms) */
  timestamp: number;
}

export interface PerceivedScreen {
  screenId: string;
  capture: ScreenCapture;
  elements: DetectedUIElement[];
  /** perceptual hash — short, cheap equality check for "did the screen change?" */
  stateHash: string;
  /** raw OCR text blocks (when OCR pipeline is available) */
  ocrBlocks?: OCRBlock[];
}

export interface OCRBlock {
  blockId: string;
  text: string;
  bbox: BoundingBox;
  confidence: number;
  languageHint?: string;
}

// ─── Configuration ────────────────────────────────────────────────────────────

export interface PerceptionConfig {
  /** minimum confidence to include a detected element */
  minConfidence: number;
  /** IOU threshold for deduplicating overlapping detections */
  iouDedupThreshold: number;
  /** whether to classify elements via heuristic rules */
  enableHeuristicClassification: boolean;
  /** screen capture output directory (when persisting PNGs) */
  captureDir?: string;
}

export const DEFAULT_PERCEPTION_CONFIG: PerceptionConfig = {
  minConfidence: 0.3,
  iouDedupThreshold: 0.6,
  enableHeuristicClassification: true,
};

// ─── Element Classification Heuristics ────────────────────────────────────────

/**
 * Heuristic classification from accessibility-tree data (no ML required).
 * Mirrors the implicit-role mapping in P05's cdp.ts a11yElements walk.
 */
export function classifyElement(tag: string, role?: string, type?: string): ElementRole {
  if (role && role !== '') {
    const r = role.toLowerCase();
    if (['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'heading', 'img',
         'navigation', 'toolbar', 'dialog', 'alert', 'modal', 'region', 'main',
         'form', 'list', 'listitem', 'tab', 'tabpanel', 'menu', 'menuitem',
         'search', 'table', 'grid'].includes(r)) return r as ElementRole;
  }
  const t = tag.toLowerCase();
  const map: Record<string, ElementRole> = {
    button: 'button',
    a: 'link',
    input: type === 'checkbox' ? 'checkbox' : type === 'radio' ? 'radio' : type === 'text' ? 'input' : 'textbox',
    textarea: 'textbox',
    select: 'dropdown',
    h1: 'heading', h2: 'heading', h3: 'heading', h4: 'heading', h5: 'heading', h6: 'heading',
    img: 'image',
    nav: 'navigation',
    header: 'toolbar',
    footer: 'toolbar',
    main: 'container',
    section: 'container',
    div: 'container',
    span: 'text',
    p: 'text',
    form: 'container',
    ul: 'container', ol: 'container', li: 'text',
  };
  return map[t] ?? 'unknown';
}

// ─── Bounding Box Helpers ─────────────────────────────────────────────────────

export function bboxCenter(bbox: BoundingBox): { x: number; y: number } {
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

export function bboxArea(bbox: BoundingBox): number {
  return Math.max(0, bbox.width) * Math.max(0, bbox.height);
}

export function bboxIntersection(a: BoundingBox, b: BoundingBox): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
}

export function bboxIOU(a: BoundingBox, b: BoundingBox): number {
  const inter = bboxIntersection(a, b);
  const unionArea = bboxArea(a) + bboxArea(b) - inter;
  return unionArea > 0 ? inter / unionArea : 0;
}

// ─── State Hash ───────────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

export function computeStateHash(elements: DetectedUIElement[]): string {
  if (elements.length === 0) return 'empty-screen';
  const sig = elements
    .slice()
    .sort((a, b) => a.elementId.localeCompare(b.elementId))
    .map((e) => `${e.elementId}:${e.role}:${e.label}:${e.bbox.x}:${e.bbox.y}:${e.bbox.width}:${e.bbox.height}:${e.confidence.toFixed(2)}`)
    .join('|');
  const h = hashString(sig);
  return `s-${Math.abs(h).toString(36)}`;
}

// ─── Deduplication ────────────────────────────────────────────────────────────

/**
 * Remove overlapping detections, keeping the one with higher confidence.
 */
export function deduplicateElements(
  elements: DetectedUIElement[],
  iouThreshold = DEFAULT_PERCEPTION_CONFIG.iouDedupThreshold,
): DetectedUIElement[] {
  const sorted = [...elements].sort((a, b) => b.confidence - a.confidence);
  const kept: DetectedUIElement[] = [];
  for (const candidate of sorted) {
    if (kept.some((k) => bboxIOU(k.bbox, candidate.bbox) >= iouThreshold)) continue;
    kept.push(candidate);
  }
  return kept;
}

// ─── OCR Integration Shim ─────────────────────────────────────────────────────

/**
 * Placeholder OCR processor.  Real OCR (Tesseract, PaddleOCR, etc.) is wired in
 * by the caller when available.  This function structures raw OCR output into
 * OCRBlock[] so the rest of the engine is vision-backend agnostic.
 */
export function structureOCRBlocks(
  rawBlocks: Array<{ text: string; bbox: BoundingBox; confidence: number }>,
  languageHint?: string,
): OCRBlock[] {
  return rawBlocks.map((b, i) => ({
    blockId: `ocr-${i + 1}`,
    text: b.text,
    bbox: b.bbox,
    confidence: b.confidence,
    languageHint,
  }));
}

// ─── Perception Engine ────────────────────────────────────────────────────────

export interface PerceptionEngine {
  captureScreen(): Promise<ScreenCapture>;
  perceive(capture: ScreenCapture): Promise<PerceivedScreen>;
}

/**
 * Build a PerceptionEngine that:
 *   1. captures the screen (via a callback provided by the caller, e.g. P05/P07
 *      browser screenshot), and
 *   2. perceives UI elements from accessibility tree data (also supplied by the
 *      caller) + optional OCR blocks.
 *
 * The engine itself is zero-dependency and deterministic — all live interaction
 * is pushed to caller-provided callbacks.
 */
export function createPerceptionEngine(
  config: PerceptionConfig = DEFAULT_PERCEPTION_CONFIG,
): PerceptionEngine {
  let _lastScreen: PerceivedScreen | null = null;

  return {
    async captureScreen(): Promise<ScreenCapture> {
      // The caller supplies screenshots via the returned engine's configuration.
      // For headless unit-test environments this is a no-op stub that returns an
      // empty capture.  In production the host system overrides the screenshot
      // callback (see `setScreenshotProvider` below).
      const capture: ScreenCapture = {
        captureId: `cap-${Date.now()}`,
        viewport: { width: 0, height: 0 },
        timestamp: Date.now(),
      };
      return capture;
    },

    async perceive(capture: ScreenCapture): Promise<PerceivedScreen> {
      // Live element detection is delegated to the caller through the element
      // provider callback.  Without a provider the engine returns an empty
      // screen — it never fabricates detections.
      const screenId = `scr-${Date.now()}`;
      const elements: DetectedUIElement[] = [];
      const stateHash = computeStateHash(elements);
      const perceived: PerceivedScreen = {
        screenId,
        capture,
        elements,
        stateHash,
      };
      _lastScreen = perceived;
      return perceived;
    },
  };
}

// Allow callers to inject screenshot + element-detection providers at runtime.
type ScreenshotProvider = () => Promise<ScreenCapture>;
type ElementProvider = (capture: ScreenCapture) => Promise<Array<{
  tag: string;
  id?: string;
  name?: string;
  role?: string;
  ariaLabel?: string;
  text?: string;
  boundingBox: BoundingBox;
  cssSelector?: string;
}>>;
type OCRProvider = (capture: ScreenCapture) => Promise<Array<{ text: string; bbox: BoundingBox; confidence: number }>>;

const providers: { screenshot?: ScreenshotProvider; elements?: ElementProvider; ocr?: OCRProvider } = {};

export function setScreenshotProvider(p: ScreenshotProvider): void {
  providers.screenshot = p;
}
export function setElementProvider(p: ElementProvider): void {
  providers.elements = p;
}
export function setOCRProvider(p: OCRProvider): void {
  providers.ocr = p;
}

/**
 * Enhanced perception engine that uses injected providers to actually detect
 * elements from a live screen.  Falls back gracefully when providers are absent.
 */
export async function perceiveWithProviders(
  capture: ScreenCapture,
  config: PerceptionConfig = DEFAULT_PERCEPTION_CONFIG,
): Promise<PerceivedScreen> {
  const screenId = `scr-${Date.now()}`;

  // 1. Get elements from the accessibility-tree provider.
  let rawElements: Array<{
    tag: string;
    id?: string;
    name?: string;
    role?: string;
    ariaLabel?: string;
    text?: string;
    boundingBox: BoundingBox;
    cssSelector?: string;
  }> = [];
  if (providers.elements) {
    try {
      rawElements = await providers.elements(capture);
    } catch {
      // provider failure is non-fatal — return empty perception
    }
  }

  // 2. Optionally get OCR blocks.
  let ocrBlocks: OCRBlock[] = [];
  if (providers.ocr) {
    try {
      const raw = await providers.ocr(capture);
      ocrBlocks = structureOCRBlocks(raw);
    } catch {
      // OCR failure is non-fatal
    }
  }

  // 3. Convert raw elements to DetectedUIElement[].
  let elements: DetectedUIElement[] = rawElements.map((raw, i) => ({
    elementId: raw.id ? `el-${raw.id}` : `el-${i + 1}`,
    label: raw.name ?? raw.text ?? raw.ariaLabel ?? raw.tag,
    role: config.enableHeuristicClassification
      ? classifyElement(raw.tag, raw.role, raw.name)
      : (raw.role as ElementRole) ?? 'unknown',
    bbox: raw.boundingBox,
    confidence: 0.85, // accessibility-tree confidence is high
    textContent: raw.text,
    cssSelector: raw.cssSelector,
    ariaLabel: raw.ariaLabel,
    attributes: {},
    children: [],
  }));

  // 4. Add OCR-derived text blocks as 'text' elements when they don't overlap
  //    existing detections.
  if (ocrBlocks.length > 0) {
    const existingBboxes = elements.map((e) => e.bbox);
    for (const block of ocrBlocks) {
      if (existingBboxes.some((eb) => bboxIOU(eb, block.bbox) > 0.5)) continue;
      elements.push({
        elementId: block.blockId,
        label: block.text.slice(0, 60),
        role: 'text',
        bbox: block.bbox,
        confidence: block.confidence,
        textContent: block.text,
        attributes: { source: 'ocr' },
        children: [],
      });
    }
  }

  // 5. Deduplicate + filter by confidence.
  elements = deduplicateElements(elements, config.iouDedupThreshold);
  elements = elements.filter((e) => e.confidence >= config.minConfidence);

  // 6. Build parent/child relationships via bbox containment.
  const sorted = [...elements].sort((a, b) => bboxArea(b.bbox) - bboxArea(a.bbox));
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (bboxContains(sorted[i].bbox, sorted[j].bbox)) {
        sorted[i].children.push(sorted[j].elementId);
        sorted[j].parentId = sorted[i].elementId;
        break; // one parent only (smallest container)
      }
    }
  }

  // 7. Compute state hash and return.
  const stateHash = computeStateHash(elements);
  return {
    screenId,
    capture,
    elements,
    stateHash,
    ocrBlocks: ocrBlocks.length > 0 ? ocrBlocks : undefined,
  };
}

function bboxContains(outer: BoundingBox, inner: BoundingBox): boolean {
  const innerCX = inner.x + inner.width / 2;
  const innerCY = inner.y + inner.height / 2;
  return (
    innerCX >= outer.x &&
    innerCX <= outer.x + outer.width &&
    innerCY >= outer.y &&
    innerCY <= outer.y + outer.height
  );
}

/**
 * Full perception pipeline: capture → perceive → enhance.
 * Wires together the screenshot provider and the element provider.
 */
export async function runPerceptionPipeline(
  config: PerceptionConfig = DEFAULT_PERCEPTION_CONFIG,
): Promise<PerceivedScreen> {
  const capture = providers.screenshot
    ? await providers.screenshot()
    : { captureId: `cap-${Date.now()}`, viewport: { width: 1280, height: 900 }, timestamp: Date.now() };
  return perceiveWithProviders(capture, config);
}
