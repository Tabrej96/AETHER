/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Program 08 · Knowledge Vault
 * (src/core/workspace/knowledgeVault.ts)
 *
 * Markdown-based knowledge storage with wiki-links, tags, bidirectional
 * linking, and search/retrieval. Designed for AETHER-native use; inspired
 * by the Obsidian vault model and Puter's document-storage concepts.
 *
 * AETHER-native: clean-room implementation; no copied code.
 */

import { randomUUID } from 'node:crypto';

// ─── Core types ──────────────────────────────────────────────────────────────

export interface VaultNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  wikiLinks: string[]; // resolved note ids
  createdAt: string;
  updatedAt: string;
  source?: string;
}

export interface VaultLink {
  from: string; // note id
  to: string;   // note id (resolved)
  type: 'wiki' | 'tag' | 'reference';
}

export interface VaultSearchResult {
  note: VaultNote;
  score: number;
  matchedFields: string[];
}

export interface VaultStats {
  totalNotes: number;
  totalLinks: number;
  totalTags: number;
  orphanNotes: string[];
  mostLinkedNotes: Array<{ id: string; title: string; linkCount: number }>;
  tagCloud: Array<{ tag: string; count: number }>;
}

// ─── Wiki-link parser ────────────────────────────────────────────────────────

const WIKI_LINK_RE = /\[\[([^\]]+)\]\]/g;
const TAG_RE = /#([a-zA-Z][a-zA-Z0-9_/-]*)/g;

export function extractWikiLinks(text: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  // Reset lastIndex
  const re = new RegExp(WIKI_LINK_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

export function extractTags(text: string): string[] {
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(TAG_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    const tag = match[1].trim().toLowerCase();
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

// ─── Knowledge Vault ─────────────────────────────────────────────────────────

function explicitTags(tags: string[] | undefined): string[] {
  return (tags ?? []).map((t) => t.toLowerCase());
}

function mergeTags(explicit: string[], extracted: string[]): string[] {
  const set = new Set(explicit);
  for (const t of extracted) set.add(t);
  return [...set];
}

export class KnowledgeVault {
  private notes: Map<string, VaultNote> = new Map();
  private byTitle: Map<string, string> = new Map(); // lower-case title -> note id
  private byTag: Map<string, Set<string>> = new Map();

  constructor(initialNotes: VaultNote[] = []) {
    for (const note of initialNotes) {
      this.indexNote(note);
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  createNote(input: {
    title: string;
    content: string;
    source?: string;
    tags?: string[];
  }): VaultNote {
    const id = `note_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const now = new Date().toISOString();
    const wikiLinks = extractWikiLinks(input.content);
    const tags = (input.tags ?? extractTags(input.content)).map((t) => t.toLowerCase());

    const note: VaultNote = {
      id,
      title: input.title,
      content: input.content,
      tags,
      wikiLinks,
      createdAt: now,
      updatedAt: now,
      source: input.source,
    };

    this.indexNote(note);
    return note;
  }

  getNote(id: string): VaultNote | undefined {
    return this.notes.get(id);
  }

  getNoteByTitle(title: string): VaultNote | undefined {
    const id = this.byTitle.get(title.toLowerCase().trim());
    return id ? this.notes.get(id) : undefined;
  }

  updateNote(id: string, updates: Partial<Pick<VaultNote, 'content' | 'tags' | 'title'>>): VaultNote | undefined {
    const existing = this.notes.get(id);
    if (!existing) return undefined;

    // Remove old indexes
    this.removeIndexes(existing);

    const updated: VaultNote = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Re-extract wiki-links and tags if content changed
    if (updates.content !== undefined) {
      updated.wikiLinks = extractWikiLinks(updated.content);
      updated.tags = mergeTags(explicitTags(updates.tags), extractTags(updated.content));
    } else if (updates.tags) {
      // Content unchanged but tags were explicitly provided: merge with extracted tags from current content
      updated.tags = mergeTags(explicitTags(updates.tags), extractTags(existing.content));
    }

    this.indexNote(updated);
    return updated;
  }

  deleteNote(id: string): boolean {
    const note = this.notes.get(id);
    if (!note) return false;
    this.removeIndexes(note);
    this.notes.delete(id);
    this.byTitle.delete(note.title.toLowerCase().trim());
    return true;
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  search(query: {
    text?: string;
    tags?: string[];
    title?: string;
    limit?: number;
  }): VaultSearchResult[] {
    const results: VaultSearchResult[] = [];

    for (const note of this.notes.values()) {
      const score = this.scoreNote(note, query);
      if (score > 0) {
        results.push({ note, score, matchedFields: this.getMatchedFields(note, query) });
      }
    }

    results.sort((a, b) => b.score - a.score);
    const limit = query.limit ?? results.length;
    return results.slice(0, limit);
  }

  // ─── Link analysis ─────────────────────────────────────────────────────────

  getLinks(noteId: string): VaultLink[] {
    const note = this.notes.get(noteId);
    if (!note) return [];

    const links: VaultLink[] = [];

    // Wiki-links
    for (const target of note.wikiLinks) {
      const targetId = this.resolveWikiLink(target);
      if (targetId) {
        links.push({ from: noteId, to: targetId, type: 'wiki' });
      }
    }

    // Tag co-occurrence links
    for (const tag of note.tags) {
      const related = this.byTag.get(tag);
      if (related) {
        for (const otherId of related) {
          if (otherId !== noteId) {
            links.push({ from: noteId, to: otherId, type: 'tag' });
          }
        }
      }
    }

    return links;
  }

  resolveWikiLink(title: string): string | undefined {
    return this.byTitle.get(title.toLowerCase().trim());
  }

  // ─── Backlinks ─────────────────────────────────────────────────────────────

  getBacklinks(noteId: string): Array<{ from: string; title: string }> {
    const backlinks: Array<{ from: string; title: string }> = [];

    for (const [id, note] of this.notes.entries()) {
      if (id !== noteId && note.wikiLinks.some((wl) => {
        const resolved = this.resolveWikiLink(wl);
        return resolved === noteId;
      })) {
        backlinks.push({ from: id, title: note.title });
      }
    }

    return backlinks;
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  getStats(): VaultStats {
    const noteIds = [...this.notes.keys()];
    const totalNotes = noteIds.length;
    const totalTags = this.byTag.size;

    // Count total wiki-link edges
    let totalLinks = 0;
    const linkCounts = new Map<string, number>();
    for (const id of noteIds) {
      const links = this.getLinks(id);
      totalLinks += links.length;
      linkCounts.set(id, links.length);
    }

    // Orphan notes: no links in or out
    const orphans = noteIds.filter((id) => {
      const hasOutbound = (this.notes.get(id)?.wikiLinks.length ?? 0) > 0;
      const hasInbound = [...this.notes.values()].some((n) =>
        n.wikiLinks.some((wl) => this.resolveWikiLink(wl) === id)
      );
      return !hasOutbound && !hasInbound;
    });

    // Most linked
    const mostLinked = [...linkCounts.entries()]
      .map(([id, count]) => ({ id, title: this.notes.get(id)!.title, linkCount: count }))
      .sort((a, b) => b.linkCount - a.linkCount)
      .slice(0, 10);

    // Tag cloud
    const tagCloud = [...this.byTag.entries()]
      .map(([tag, ids]) => ({ tag, count: ids.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);

    return { totalNotes, totalLinks, totalTags, orphanNotes: orphans, mostLinked, tagCloud };
  }

  listNotes(): VaultNote[] {
    return [...this.notes.values()];
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private indexNote(note: VaultNote): void {
    this.notes.set(note.id, note);
    this.byTitle.set(note.title.toLowerCase().trim(), note.id);

    for (const tag of note.tags) {
      let set = this.byTag.get(tag);
      if (!set) {
        set = new Set();
        this.byTag.set(tag, set);
      }
      set.add(note.id);
    }
  }

  private removeIndexes(note: VaultNote): void {
    this.byTitle.delete(note.title.toLowerCase().trim());
    for (const tag of note.tags) {
      this.byTag.get(tag)?.delete(note.id);
    }
  }

  private scoreNote(note: VaultNote, query: { text?: string; tags?: string[]; title?: string }): number {
    let score = 0;

    if (query.title) {
      const titleLower = note.title.toLowerCase();
      const q = query.title.toLowerCase();
      if (titleLower.includes(q)) score += 10;
      if (titleLower === q) score += 5;
    }

    if (query.tags && query.tags.length > 0) {
      const noteTags = new Set(note.tags);
      const matchCount = query.tags.filter((t) => noteTags.has(t.toLowerCase())).length;
      score += matchCount * 3;
    }

    if (query.text) {
      const text = query.text.toLowerCase();
      const content = note.content.toLowerCase();
      const title = note.title.toLowerCase();
      if (title.includes(text)) score += 5;
      if (content.includes(text)) score += 2;
      // Simple term frequency bonus
      const words = text.split(/\s+/).filter((w) => w.length > 2);
      for (const word of words) {
        const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = (content.match(regex) ?? []).length;
        score += matches * 0.5;
      }
    }

    return score;
  }

  private getMatchedFields(note: VaultNote, query: { text?: string; tags?: string[]; title?: string }): string[] {
    const fields: string[] = [];
    if (query.title && note.title.toLowerCase().includes(query.title.toLowerCase())) {
      fields.push('title');
    }
    if (query.tags && query.tags.some((t) => note.tags.includes(t.toLowerCase()))) {
      fields.push('tags');
    }
    if (query.text) {
      if (note.title.toLowerCase().includes(query.text.toLowerCase())) fields.push('title');
      if (note.content.toLowerCase().includes(query.text.toLowerCase())) fields.push('content');
      if (note.tags.some((t) => query.text!.toLowerCase().includes(t.toLowerCase()))) fields.push('tags');
    }
    return fields;
  }
}
