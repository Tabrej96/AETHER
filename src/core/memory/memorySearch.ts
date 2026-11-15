/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Semantic Search
 *
 * Provides relevance scoring and context-aware retrieval.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import type { Memory } from './types';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'through',
  'and', 'but', 'or', 'nor', 'not', 'so', 'very', 'just', 'also',
]);

export class MemorySearcher {
  relevanceScore(searchText: string, memory: Memory): number {
    const queryTerms = tokenize(searchText);
    if (queryTerms.length === 0) return 0;

    const memoryText = extractSearchableText(memory);
    const memoryTerms = tokenize(memoryText);
    const memoryTermFreq = termFrequency(memoryTerms);

    let score = 0;
    for (const term of queryTerms) {
      const termLower = term.toLowerCase();
      // Exact match in key is very high signal
      if (memory.key.toLowerCase().includes(termLower)) {
        score += 3.0;
      }
      // Tag match is high signal
      for (const tag of memory.tags) {
        if (tag.toLowerCase().includes(termLower)) {
          score += 2.0;
        }
      }
      // Content match
      if (memoryText.toLowerCase().includes(termLower)) {
        score += 1.0;
      }
      // Type-specific boost
      if (termLower === memory.type) {
        score += 0.5;
      }
      // TF contribution
      const tf = memoryTermFreq.get(termLower) ?? 0;
      score += tf * 0.3;
    }

    // Confidence normalization
    score *= (0.5 + memory.metadata.confidence * 0.5);
    // Recency decay (logarithmic, half-life ~7 days)
    const ageMs = Date.now() - memory.createdAt.getTime();
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    const recencyFactor = 1 / (1 + Math.log(ageDays + 1) * 0.15);
    score *= recencyFactor;
    // Access count boost
    score += Math.min(memory.accessCount * 0.05, 0.5);
    return score;
  }

  search(searchText: string, memories: Memory[]): Memory[] {
    const scored = memories
      .map((mem) => ({ memory: mem, score: this.relevanceScore(searchText, mem) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map(({ memory }) => memory);
  }
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^\w\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t.toLowerCase()));
}

function termFrequency(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    const key = token.toLowerCase();
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  return freq;
}

function extractSearchableText(memory: Memory): string {
  const parts: string[] = [memory.key, memory.type];
  if (typeof memory.value === 'string') parts.push(memory.value);
  else if (typeof memory.value === 'object' && memory.value !== null) {
    parts.push(JSON.stringify(memory.value));
  }
  parts.push(...memory.tags);
  if (memory.provenance.evidence.length > 0) {
    parts.push(...memory.provenance.evidence);
  }
  return parts.filter(Boolean).join(' ');
}
