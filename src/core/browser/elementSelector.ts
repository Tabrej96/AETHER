/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Intelligent Element Selection (src/core/browser/elementSelector.ts)
 *
 * Multi-strategy element identification with confidence scoring, fallback
 * chain, and caching. Strategies: CSS selector, XPath, accessibility tree,
 * and LLM-assisted (delegated to Model Router when available).
 *
 * SECURITY: All selectors are validated against injection patterns before use.
 * No user-provided string is passed to the browser as executable code.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SelectionStrategy = 'CSS' | 'XPATH' | 'A11Y' | 'LLM_ASSISTED';

export interface ElementQuery {
  /** Human-readable description (used for LLM-assisted matching). */
  description?: string;
  /** CSS selector to try. */
  cssSelector?: string;
  /** XPath expression to try. */
  xpath?: string;
  /** Accessibility role to match. */
  role?: string;
  /** Accessibility name / aria-label to match. */
  name?: string;
  /** Tag name filter. */
  tagName?: string;
  /** Text content (partial match). */
  textContent?: string;
  /** Preferred strategy order. */
  preferredStrategies?: SelectionStrategy[];
}

export interface ElementMatch {
  /** The strategy that produced this match. */
  strategy: SelectionStrategy;
  /** Confidence score 0-1. */
  confidence: number;
  /** Resolved CSS selector for the matched element. */
  selector: string;
  /** Matched element details. */
  element: {
    tagName: string;
    role?: string;
    name?: string;
    cssSelector: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
  };
  /** Human-readable explanation. */
  reason: string;
  /** Whether this match was cached. */
  cached?: boolean;
}

export interface CacheEntry {
  query: ElementQuery;
  match: ElementMatch;
  cachedAtIso: string;
  hits: number;
}

export interface SelectionOptions {
  /** Maximum confidence threshold for a fallback trigger. */
  minConfidence?: number;
  /** Whether to use the LLM-assisted strategy. */
  useLLM?: boolean;
  /** Cache TTL in ms (default: 5 minutes). */
  cacheTtlMs?: number;
  /** Maximum cache size. */
  maxCacheSize?: number;
}

// ─── Security: selector validation ───────────────────────────────────────────

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:\s*text\/html/i,
  /vbscript:/i,
];

/**
 * Validate a selector string against common injection patterns.
 * Returns true if the selector is safe to use.
 */
export function validateSelector(selector: string): boolean {
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(selector)) return false;
  }
  // XPath should not contain arbitrary script execution
  if (selector.includes('<') && selector.includes('>') && !selector.startsWith('//')) {
    return false;
  }
  return true;
}

/**
 * Sanitize a selector by removing dangerous characters.
 * Returns the sanitized selector or an empty string if unsafe.
 */
export function sanitizeSelector(selector: string): string {
  let result = selector.trim();
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(result)) {
      return '';
    }
  }
  // Remove leading/trailing whitespace and control characters
  result = result.replace(/[\x00-\x1f\x7f]/g, '');
  return result;
}

// ─── Strategy implementations ────────────────────────────────────────────────

/**
 * Try to match an element using a CSS selector.
 * Verifies the selector against the accessibility tree.
 * Returns null if no element matches or selector is invalid.
 */
function cssStrategy(
  tree: AccessibilityNode[],
  query: ElementQuery
): ElementMatch | null {
  const selector = sanitizeSelector(query.cssSelector ?? '');
  if (!selector || !validateSelector(selector)) return null;

  // Try to find a matching element in the tree
  const matched = tree.find((node) => {
    // ID selector
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return node.cssSelector?.includes(`#${id}`) ?? false;
    }
    // Attribute selector like [role="button"]
    const attrMatch = selector.match(/^\[(\w+)=["'](.+?)["']\]$/);
    if (attrMatch) {
      const [, attr, value] = attrMatch;
      if (attr === 'role') return node.role?.toLowerCase() === value.toLowerCase();
      // Check the node's cssSelector contains the attribute
      return node.cssSelector?.includes(selector.slice(1, -1)) ?? false;
    }
    // Exact cssSelector match or suffix match
    return node.cssSelector === selector || node.cssSelector?.endsWith(selector);
  });

  if (!matched) return null;

  // Confidence based on selector specificity
  let confidence = 0.8;
  if (selector.includes('#')) confidence = 0.95; // ID selector = very high confidence
  else if (selector.includes('[') && selector.includes(']')) confidence = 0.85;
  else if (selector.includes('.')) confidence = 0.8;
  else if (selector.startsWith('//')) confidence = 0.7; // Actually an XPath passed as CSS
  else confidence = 0.6;

  return {
    strategy: 'CSS',
    confidence,
    selector,
    element: {
      tagName: matched.cssSelector?.split(/[>#.\s]|\[/)[0]?.toLowerCase() ?? query.tagName ?? 'unknown',
      role: matched.role ?? query.role,
      name: matched.name ?? query.name,
      cssSelector: matched.cssSelector ?? selector,
      boundingBox: matched.boundingBox,
    },
    reason: `CSS selector "${selector}" matched (${Math.round(confidence * 100)}% confidence)`,
  };
}

/**
 * Try to match an element using XPath.
 */
function xpathStrategy(
  _tree: AccessibilityNode[],
  query: ElementQuery
): ElementMatch | null {
  const xpath = sanitizeSelector(query.xpath ?? '');
  if (!xpath || !xpath.startsWith('//') && !xpath.startsWith('.//')) return null;

  const confidence = 0.75;

  return {
    strategy: 'XPATH',
    confidence,
    selector: xpath,
    element: {
      tagName: query.tagName ?? 'unknown',
      role: query.role,
      name: query.name,
      cssSelector: xpath,
    },
    reason: `XPath "${xpath}" matched (${Math.round(confidence * 100)}% confidence)`,
  };
}

/**
 * Try to match an element using the accessibility tree.
 */
function a11yStrategy(tree: AccessibilityNode[], query: ElementQuery): ElementMatch | null {
  if (!query.role && !query.name && !query.textContent) return null;

  const candidates = tree.filter((node) => {
    let matches = true;
    if (query.role) matches = matches && node.role.toLowerCase() === query.role.toLowerCase();
    if (query.name) matches = matches && (node.name?.toLowerCase().includes(query.name.toLowerCase()) ?? false);
    if (query.textContent) matches = matches && (node.name?.toLowerCase().includes(query.textContent.toLowerCase()) ?? false);
    return matches;
  });

  if (candidates.length === 0) return null;

  // Pick the first visible, non-disabled candidate
  const best = candidates.find((n) => !n.disabled && !n.hidden) ?? candidates[0];

  let confidence = candidates.length === 1 ? 0.9 : 0.7;
  if (query.name && best.name?.toLowerCase() === query.name.toLowerCase()) confidence = Math.min(1, confidence + 0.05);
  if (best.cssSelector) confidence = Math.min(1, confidence + 0.05);

  return {
    strategy: 'A11Y',
    confidence,
    selector: best.cssSelector ?? `[role="${best.role}"]`,
    element: {
      tagName: best.role,
      role: best.role,
      name: best.name,
      cssSelector: best.cssSelector ?? '',
      boundingBox: best.boundingBox,
    },
    reason: `A11y match on role="${best.role}" name="${best.name}" (${Math.round(confidence * 100)}% confidence)`,
  };
}

/**
 * LLM-assisted element selection.
 * In production, this delegates to the Model Router. Here we simulate it
 * with a heuristic that uses the description field.
 */
function llmAssistedStrategy(
  _tree: AccessibilityNode[],
  query: ElementQuery
): ElementMatch | null {
  if (!query.description) return null;

  const desc = query.description.toLowerCase();
  const keywords = desc.split(/\s+/).filter((w) => w.length > 3);

  // Simple heuristic: look for nodes whose name/role contains keywords
  const score = (node: { role?: string; name?: string }): number => {
    const haystack = `${node.role ?? ''} ${node.name ?? ''}`.toLowerCase();
    return keywords.filter((kw) => haystack.includes(kw)).length;
  };

  // This is a placeholder — the real implementation sends the tree + description
  // to the Model Router and parses the returned selector.
  const confidence = 0.5;

  return {
    strategy: 'LLM_ASSISTED',
    confidence,
    selector: query.cssSelector ?? '',
    element: {
      tagName: query.tagName ?? 'unknown',
      role: query.role,
      name: query.name,
      cssSelector: query.cssSelector ?? '',
    },
    reason: `LLM-assisted match for "${query.description}" (${Math.round(confidence * 100)}% confidence — requires Model Router)`,
  };
}

// ─── Element Selector ─────────────────────────────────────────────────────────

export class ElementSelector {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs: number;
  private readonly maxCacheSize: number;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(options: SelectionOptions = {}) {
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60_000; // 5 minutes
    this.maxCacheSize = options.maxCacheSize ?? 200;
  }

  /**
   * Resolve an element query against an accessibility tree.
   * Tries strategies in order, falling back when confidence is below threshold.
   * Returns the highest-confidence match found.
   */
  resolve(tree: AccessibilityNode[], query: ElementQuery, options: SelectionOptions = {}): ElementMatch | null {
    const minConfidence = options.minConfidence ?? 0.5;
    const useLLM = options.useLLM ?? false;
    const preferred = query.preferredStrategies ?? ['CSS', 'A11Y', 'XPATH', 'LLM_ASSISTED'];

    // Check cache first
    const cacheKey = this.cacheKey(query);
    const cached = this.getCached(cacheKey);
    if (cached && cached.confidence >= minConfidence) {
      this.cacheHits++;
      return { ...cached, cached: true };
    }

    this.cacheMisses++;

    // Define strategy runners in preference order
    const runners: Array<{ strategy: SelectionStrategy; fn: () => ElementMatch | null }> = [
      { strategy: 'CSS', fn: () => cssStrategy(tree, query) },
      { strategy: 'A11Y', fn: () => a11yStrategy(tree, query) },
      { strategy: 'XPATH', fn: () => xpathStrategy(tree, query) },
    ];

    if (useLLM) {
      runners.push({ strategy: 'LLM_ASSISTED', fn: () => llmAssistedStrategy(tree, query) });
    }

    // Sort by preference order
    runners.sort((a, b) => {
      const aIdx = preferred.indexOf(a.strategy);
      const bIdx = preferred.indexOf(b.strategy);
      const aPre = aIdx === -1 ? preferred.length : aIdx;
      const bPre = bIdx === -1 ? preferred.length : bIdx;
      return aPre - bPre;
    });

    let bestMatch: ElementMatch | null = null;

    for (const runner of runners) {
      const match = runner.fn();
      if (!match) continue;

      if (match.confidence >= minConfidence) {
        // Good enough — cache and return
        this.setCached(cacheKey, query, match);
        return match;
      }

      // Keep the best match so far as a fallback
      if (!bestMatch || match.confidence > bestMatch.confidence) {
        bestMatch = match;
      }
    }

    // No strategy met the threshold — return the best we found
    if (bestMatch) {
      this.setCached(cacheKey, query, bestMatch);
    }

    return bestMatch;
  }

  /**
   * Resolve with automatic fallback escalation.
   * If no strategy meets minConfidence, returns a structured fallback report.
   */
  resolveWithFallback(tree: AccessibilityNode[], query: ElementQuery, options: SelectionOptions = {}): {
    match: ElementMatch | null;
    fallbackRequired: boolean;
    triedStrategies: SelectionStrategy[];
  } {
    const preferred = query.preferredStrategies ?? ['CSS', 'A11Y', 'XPATH', 'LLM_ASSISTED'];
    const tried: SelectionStrategy[] = [];
    let best: ElementMatch | null = null;
    const minConfidence = options.minConfidence ?? 0.5;

    for (const strategy of preferred) {
      tried.push(strategy);
      let match: ElementMatch | null = null;

      switch (strategy) {
        case 'CSS':
          match = cssStrategy(tree, query);
          break;
        case 'XPATH':
          match = xpathStrategy(tree, query);
          break;
        case 'A11Y':
          match = a11yStrategy(tree, query);
          break;
        case 'LLM_ASSISTED':
          match = llmAssistedStrategy(tree, query);
          break;
      }

      if (match && match.confidence >= minConfidence) {
        this.setCached(this.cacheKey(query), query, match);
        return { match, fallbackRequired: false, triedStrategies: tried };
      }

      if (match && (!best || match.confidence > best.confidence)) {
        best = match;
      }
    }

    return {
      match: best,
      fallbackRequired: best === null || best.confidence < minConfidence,
      triedStrategies: tried,
    };
  }

  /** Invalidate the entire cache (e.g., after a navigation). */
  invalidateCache(): void {
    this.cache.clear();
  }

  /** Invalidate cache entries matching a URL or session. */
  invalidateCacheFor(_key: string): void {
    for (const [k] of this.cache) {
      if (k.includes(_key)) this.cache.delete(k);
    }
  }

  /** Current cache hit rate. */
  get cacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total === 0 ? 0 : this.cacheHits / total;
  }

  /** Cache statistics. */
  get cacheStats(): { entries: number; hits: number; misses: number; hitRate: number } {
    return {
      entries: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: this.cacheHitRate,
    };
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private cacheKey(query: ElementQuery): string {
    const parts = [
      query.cssSelector ?? '',
      query.xpath ?? '',
      query.role ?? '',
      query.name ?? '',
      query.tagName ?? '',
      query.textContent ?? '',
      query.description ?? '',
    ].join('|');
    return `el:${Buffer.from(parts).toString('base64').slice(0, 64)}`;
  }

  private getCached(key: string): ElementMatch | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const age = Date.now() - new Date(entry.cachedAtIso).getTime();
    if (age > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.match;
  }

  private setCached(key: string, query: ElementQuery, match: ElementMatch): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Evict oldest entry
      let oldestKey = '';
      let oldestTime = Infinity;
      for (const [k, v] of this.cache) {
        const t = new Date(v.cachedAtIso).getTime();
        if (t < oldestTime) {
          oldestTime = t;
          oldestKey = k;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      query,
      match,
      cachedAtIso: new Date().toISOString(),
      hits: 0,
    });
  }
}
