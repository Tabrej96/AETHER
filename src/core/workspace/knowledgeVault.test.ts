/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Knowledge Vault Tests
 * (src/core/workspace/knowledgeVault.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KnowledgeVault,
  extractWikiLinks,
  extractTags,
} from './knowledgeVault';

// ─── Wiki-link and tag extraction ────────────────────────────────────────────

test('extractWikiLinks finds wiki-links', () => {
  const text = 'See [[Project Alpha]] and [[Design Doc]] for details.';
  const links = extractWikiLinks(text);
  assert.deepStrictEqual(links, ['Project Alpha', 'Design Doc']);
});

test('extractWikiLinks returns empty for no links', () => {
  const text = 'Plain text without links.';
  assert.deepStrictEqual(extractWikiLinks(text), []);
});

test('extractWikiLinks handles empty string', () => {
  assert.deepStrictEqual(extractWikiLinks(''), []);
});

test('extractTags finds tags', () => {
  const text = 'Working on #architecture and #design today.';
  const tags = extractTags(text);
  assert.deepStrictEqual(tags, ['architecture', 'design']);
});

test('extractTags deduplicates tags', () => {
  const text = '#architecture is key. Architecture matters.';
  const tags = extractTags(text);
  assert.strictEqual(tags.length, 1);
  assert.strictEqual(tags[0], 'architecture');
});

test('extractTags returns empty for no tags', () => {
  const text = 'Plain text without tags.';
  assert.deepStrictEqual(extractTags(text), []);
});

test('extractTags handles compound tags', () => {
  const text = 'Topics: #ai-ml and #project-alpha';
  const tags = extractTags(text);
  assert.ok(tags.includes('ai-ml'), 'includes ai-ml');
  assert.ok(tags.includes('project-alpha'), 'includes project-alpha');
});

// ─── KnowledgeVault CRUD ─────────────────────────────────────────────────────

test('creates a note', () => {
  const vault = new KnowledgeVault();
  const note = vault.createNote({
    title: 'Alpha',
    content: 'Content about [[Beta]].',
  });

  assert.ok(note.id.startsWith('note_'), 'note id has prefix');
  assert.strictEqual(note.title, 'Alpha');
  assert.deepStrictEqual(note.tags, []);
  assert.deepStrictEqual(note.wikiLinks, ['Beta']);
});

test('creates note with tags', () => {
  const vault = new KnowledgeVault();
  const note = vault.createNote({
    title: 'Architecture',
    content: 'System design.',
    tags: ['architecture', 'design'],
  });

  assert.deepStrictEqual(note.tags, ['architecture', 'design']);
});

test('getNote retrieves by id', () => {
  const vault = new KnowledgeVault();
  const note = vault.createNote({ title: 'A', content: 'Content.' });
  const retrieved = vault.getNote(note.id);

  assert.strictEqual(retrieved?.id, note.id);
});

test('getNoteByTitle retrieves by title', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'My Note', content: 'Content.' });
  const retrieved = vault.getNoteByTitle('My Note');

  assert.ok(retrieved !== undefined, 'note found by title');
  assert.strictEqual(retrieved!.title, 'My Note');
});

test('getNoteByTitle is case-insensitive', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'My Note', content: 'Content.' });
  const retrieved = vault.getNoteByTitle('my note');

  assert.ok(retrieved !== undefined, 'found case-insensitive');
});

test('getNoteByTitle returns undefined for missing title', () => {
  const vault = new KnowledgeVault();
  assert.strictEqual(vault.getNoteByTitle('Nonexistent'), undefined);
});

// ─── Update ──────────────────────────────────────────────────────────────────

test('updateNote modifies content and re-extracts links', () => {
  const vault = new KnowledgeVault();
  const note = vault.createNote({ title: 'A', content: 'Plain.' });
  const updated = vault.updateNote(note.id, { content: 'See [[Beta]].' });

  assert.ok(updated !== undefined);
  assert.deepStrictEqual(updated!.wikiLinks, ['Beta']);
});

test('updateNote merges explicit tags with extracted tags', () => {
  const vault = new KnowledgeVault();
  const note = vault.createNote({
    title: 'A',
    content: '#design system',
    tags: ['architecture'],
  });

  // Update with explicit tags (content stays the same so extracted tags remain)
  const updated = vault.updateNote(note.id, { tags: ['priority'] });
  assert.ok(updated !== undefined, 'update returned result');
  assert.ok(updated!.tags.includes('design'), 'preserves extracted tag');
  assert.ok(updated!.tags.includes('priority'), 'includes explicit tag');
});

test('updateNote returns undefined for nonexistent id', () => {
  const vault = new KnowledgeVault();
  assert.strictEqual(vault.updateNote('nonexistent', { content: 'x' }), undefined);
});

// ─── Delete ──────────────────────────────────────────────────────────────────

test('deleteNote removes a note', () => {
  const vault = new KnowledgeVault();
  const note = vault.createNote({ title: 'A', content: 'Content.' });
  const result = vault.deleteNote(note.id);

  assert.strictEqual(result, true);
  assert.strictEqual(vault.getNote(note.id), undefined);
});

test('deleteNote returns false for nonexistent id', () => {
  const vault = new KnowledgeVault();
  assert.strictEqual(vault.deleteNote('nonexistent'), false);
});

// ─── Search ──────────────────────────────────────────────────────────────────

test('search by text finds matching notes', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'Architecture Doc', content: 'System architecture overview.' });
  vault.createNote({ title: 'Design Guide', content: 'UI design principles.' });

  const results = vault.search({ text: 'architecture' });
  assert.ok(results.length > 0, 'found results');
  assert.strictEqual(results[0].note.title, 'Architecture Doc');
});

test('search by title finds matching notes', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'API Reference', content: 'Endpoints.' });

  const results = vault.search({ title: 'API' });
  assert.strictEqual(results[0].note.title, 'API Reference');
});

test('search by tags finds matching notes', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'A', content: 'Content.', tags: ['architecture'] });
  vault.createNote({ title: 'B', content: 'Content.', tags: ['design'] });

  const results = vault.search({ tags: ['architecture'] });
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].note.title, 'A');
});

test('search respects limit', () => {
  const vault = new KnowledgeVault();
  for (let i = 0; i < 5; i++) {
    vault.createNote({ title: `Note ${i}`, content: 'Shared content.' });
  }

  const results = vault.search({ text: 'Shared', limit: 2 });
  assert.strictEqual(results.length, 2);
});

test('search returns empty for no matches', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'A', content: 'Content.' });
  const results = vault.search({ text: 'nonexistent' });
  assert.strictEqual(results.length, 0);
});

// ─── Links and backlinks ─────────────────────────────────────────────────────

test('getLinks returns wiki-links', () => {
  const vault = new KnowledgeVault();
  const a = vault.createNote({ title: 'A', content: 'See [[B]].' });
  const b = vault.createNote({ title: 'B', content: 'Content.' });

  const links = vault.getLinks(a.id);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].type, 'wiki');
  assert.strictEqual(links[0].to, b.id);
});

test('getLinks returns tag co-occurrence links', () => {
  const vault = new KnowledgeVault();
  const a = vault.createNote({ title: 'A', content: '#design note.', tags: ['design'] });
  vault.createNote({ title: 'B', content: '#design system.', tags: ['design'] });

  const links = vault.getLinks(a.id);
  const tagLinks = links.filter((l) => l.type === 'tag');
  assert.ok(tagLinks.length > 0, 'has tag links');
});

test('getBacklinks returns notes linking to this note', () => {
  const vault = new KnowledgeVault();
  const b = vault.createNote({ title: 'B', content: 'Content.' });
  vault.createNote({ title: 'A', content: 'See [[B]].' });

  const backlinks = vault.getBacklinks(b.id);
  assert.strictEqual(backlinks.length, 1);
  assert.strictEqual(backlinks[0].title, 'A');
});

test('getBacklinks returns empty for isolated note', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'Orphan', content: 'No links.' });

  const backlinks = vault.getBacklinks(vault.listNotes()[0].id);
  assert.strictEqual(backlinks.length, 0);
});

// ─── Stats ───────────────────────────────────────────────────────────────────

test('getStats returns correct counts', () => {
  const vault = new KnowledgeVault();
  const a = vault.createNote({ title: 'A', content: 'See [[B]].', tags: ['design'] });
  const b = vault.createNote({ title: 'B', content: 'Content.', tags: ['design'] });
  const orphanNote = vault.createNote({ title: 'Orphan', content: 'Isolated.', tags: [] });

  const stats = vault.getStats();
  assert.strictEqual(stats.totalNotes, 3);
  assert.ok(stats.totalLinks > 0, 'has links');
  assert.ok(stats.totalTags > 0, 'has tags');
  assert.ok(stats.orphanNotes.includes(orphanNote.id), 'orphan identified');
});

test('getStats builds tag cloud', () => {
  const vault = new KnowledgeVault();
  vault.createNote({ title: 'A', content: 'Content.', tags: ['design', 'ui'] });
  vault.createNote({ title: 'B', content: 'Content.', tags: ['design', 'ux'] });

  const stats = vault.getStats();
  const designTag = stats.tagCloud.find((t) => t.tag === 'design');
  assert.ok(designTag !== undefined, 'design tag in cloud');
  assert.strictEqual(designTag!.count, 2, 'design appears on 2 notes');
});

test('getStats identifies most linked notes', () => {
  const vault = new KnowledgeVault();
  const a = vault.createNote({ title: 'A', content: '[[B]] and [[B]] and [[B]].' });
  vault.createNote({ title: 'B', content: 'Content.' });

  const stats = vault.getStats();
  assert.ok(stats.mostLinked.length > 0, 'has mostLinked entries');
});

// ─── Initialization ──────────────────────────────────────────────────────────

test('vault initializes with notes', () => {
  const initial = [
    { id: 'n1', title: 'Alpha', content: 'Content.', tags: [], wikiLinks: [], createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    { id: 'n2', title: 'Beta', content: 'See [[Alpha]].', tags: [], wikiLinks: ['Alpha'], createdAt: '2024-01-02', updatedAt: '2024-01-02' },
  ];
  const vault = new KnowledgeVault(initial);
  const stats = vault.getStats();
  assert.strictEqual(stats.totalNotes, 2);
});
