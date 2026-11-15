/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Tests
 *
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { MemoryEngine } from './memoryEngine';
import { MemoryStore } from './memoryStore';
import { MemoryIndex } from './memoryIndex';
import { MemorySearcher } from './memorySearch';
import { MemoryConsolidator } from './memoryConsolidation';
import { MemoryLearner } from './memoryLearning';
import { MemoryPrivacy } from './memoryPrivacy';

const TEST_DIR = './test-memory-temp';

function makeEngine(project = 'test-project', session = 's1', agent = 'test-agent'): MemoryEngine {
  if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
  return new MemoryEngine({ project, session, agent, storeDir: TEST_DIR, enableConsolidation: false, enableLearning: false });
}

describe('MemoryEngine', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
  });
  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('stores and recalls a memory', () => {
    const engine = makeEngine();
    const stored = engine.storeMemory('fact', 'language', 'TypeScript', { tags: ['code'] });
    assert.strictEqual(stored.key, 'language');
    assert.strictEqual(stored.type, 'fact');
    const recalled = engine.recall({ key: 'language' });
    assert.strictEqual(recalled.length, 1);
    assert.deepStrictEqual(recalled[0].value, 'TypeScript');
  });

  it('queries by type', () => {
    const engine = makeEngine();
    engine.storeMemory('fact', 'f1', 'v1');
    engine.storeMemory('decision', 'd1', 'v2');
    engine.storeMemory('fact', 'f2', 'v3');
    const facts = engine.recall({ type: 'fact' });
    assert.strictEqual(facts.length, 2);
  });

  it('queries by tags', () => {
    const engine = makeEngine();
    engine.storeMemory('fact', 'f1', 'v1', { tags: ['code'] });
    engine.storeMemory('fact', 'f2', 'v2', { tags: ['design'] });
    engine.storeMemory('fact', 'f3', 'v3', { tags: ['code', 'important'] });
    const results = engine.recall({ tags: ['code'] });
    assert.strictEqual(results.length, 2);
  });

  it('queries by project', () => {
    const engine = makeEngine();
    makeEngine('proj-a', 's1', 'a1').storeMemory('fact', 'f1', 'v1');
    makeEngine('proj-b', 's1', 'a1').storeMemory('fact', 'f2', 'v2');
    const engineA = makeEngine('proj-a', 's1', 'a1');
    const results = engineA.recall({ project: 'proj-a' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].key, 'f1');
  });

  it('queries by since date', () => {
    const engine = makeEngine();
    engine.storeMemory('fact', 'f1', 'v1');
    const cutoff = new Date(Date.now() - 1000);
    engine.storeMemory('fact', 'f2', 'v2');
    const results = engine.recall({ since: cutoff });
    assert.ok(results.length >= 1);
  });

  it('queries by minConfidence', () => {
    const engine = makeEngine();
    engine.storeMemory('fact', 'f1', 'v1', { confidence: 0.9 });
    engine.storeMemory('fact', 'f2', 'v2', { confidence: 0.3 });
    const results = engine.recall({ minConfidence: 0.5 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].key, 'f1');
  });

  it('queries by limit', () => {
    const engine = makeEngine();
    for (let i = 0; i < 10; i++) {
      engine.storeMemory('fact', `f${i}`, `v${i}`);
    }
    const results = engine.recall({ limit: 3 });
    assert.strictEqual(results.length, 3);
  });

  it('updates a memory', () => {
    const engine = makeEngine();
    engine.storeMemory('fact', 'language', 'TypeScript');
    const updated = engine.update('language', 'JavaScript');
    assert.strictEqual(updated?.value, 'JavaScript');
    const recalled = engine.recall({ key: 'language' });
    assert.deepStrictEqual(recalled[0].value, 'JavaScript');
  });

  it('forgets a memory', () => {
    const engine = makeEngine();
    engine.storeMemory('fact', 'language', 'TypeScript');
    const result = engine.forget('language');
    assert.strictEqual(result, true);
    const recalled = engine.recall({ key: 'language' });
    assert.strictEqual(recalled.length, 0);
  });

  it('forgets nonexistent memory returns false', () => {
    const engine = makeEngine();
    const result = engine.forget('nonexistent');
    assert.strictEqual(result, false);
  });

  it('returns stats', () => {
    const engine = makeEngine();
    engine.storeMemory('fact', 'f1', 'v1');
    engine.storeMemory('decision', 'd1', 'v2');
    const stats = engine.getStats();
    assert.strictEqual(stats.totalMemories, 2);
    assert.strictEqual(stats.byType.fact, 1);
    assert.strictEqual(stats.byType.decision, 1);
  });

  it('persists across sessions', () => {
    const engine1 = makeEngine();
    engine1.storeMemory('fact', 'persistent', 'yes');
    // Create new engine instance pointing to same dir
    const engine2 = makeEngine();
    const recalled = engine2.recall({ key: 'persistent' });
    assert.strictEqual(recalled.length, 1);
    assert.deepStrictEqual(recalled[0].value, 'yes');
  });
});

describe('MemoryStore', () => {
  beforeEach(() => {
    if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
  });
  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('saves and loads memories', () => {
    const store = new MemoryStore(TEST_DIR, 'project-a');
    const mem = {
      id: 'mem-f1',
      type: 'fact' as const,
      key: 'f1',
      value: 'hello',
      metadata: { project: 'project-a', session: 's1', agent: 'a1', confidence: 1, source: 'test', verified: true, accessLevel: 'internal' as const },
      provenance: { source: 'test', method: 'explicit' as const, evidence: [] },
      tags: [],
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessedAt: new Date(),
      accessCount: 0,
    };
    store.save(mem);
    const loaded = store.loadAll();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].key, 'f1');
  });

  it('compacts deleted records', () => {
    const store = new MemoryStore(TEST_DIR, 'project-b');
    store.save({
      id: 'mem-a', type: 'fact', key: 'a', value: 1,
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] }, tags: [], status: 'active',
      createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
    });
    store.save({
      id: 'mem-b', type: 'fact', key: 'b', value: 2,
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] }, tags: [], status: 'active',
      createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
    });
    store.softDelete('mem-a');
    const result = store.compact();
    assert.ok(result.recordsAfter <= result.recordsBefore);
    const loaded = store.loadAll();
    assert.ok(loaded.every((m) => m.id !== 'mem-a'));
  });

  it('backups and restores', () => {
    const store = new MemoryStore(TEST_DIR, 'project-c');
    store.save({
      id: 'mem-x', type: 'fact', key: 'x', value: 'backup-me',
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] }, tags: [], status: 'active',
      createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
    });
    const backupPath = `${TEST_DIR}/backup.json`;
    store.backup(backupPath);
    store.deleteAll();
    store.restore(backupPath);
    const loaded = store.loadAll();
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].key, 'x');
  });
});

describe('MemoryIndex', () => {
  let index: MemoryIndex;

  beforeEach(() => {
    index = new MemoryIndex();
  });

  it('indexes and queries by type', () => {
    index.add({
      id: 'm1', type: 'fact', key: 'k1', value: 'v1',
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] }, tags: [],
      status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
    });
    const results = index.query({ type: 'fact' });
    assert.strictEqual(results.length, 1);
  });

  it('removes entries', () => {
    index.add({
      id: 'm1', type: 'fact', key: 'k1', value: 'v1',
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] }, tags: [],
      status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
    });
    index.remove('m1');
    assert.strictEqual(index.query({ type: 'fact' }).length, 0);
  });

  it('queries by multiple tags', () => {
    index.add({
      id: 'm1', type: 'fact', key: 'k1', value: 'v1', tags: ['code', 'important'],
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] },
      status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
    });
    const results = index.query({ tags: ['code', 'important'] });
    assert.strictEqual(results.length, 1);
  });

  it('updates entries', () => {
    index.add({
      id: 'm1', type: 'fact', key: 'k1', value: 'v1',
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] }, tags: [],
      status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
    });
    index.update({
      id: 'm1', type: 'fact', key: 'k1', value: 'v2',
      metadata: { project: 'p', session: 's', agent: 'a', confidence: 0.9, source: 't', verified: true, accessLevel: 'internal' },
      provenance: { source: 't', method: 'explicit', evidence: [] }, tags: ['updated'],
      status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 1,
    });
    const results = index.query({ type: 'fact' });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].value, 'v2');
  });
});

describe('MemorySearcher', () => {
  let searcher: MemorySearcher;

  beforeEach(() => {
    searcher = new MemorySearcher();
  });

  it('scores relevant memories higher', () => {
    const memories: Array<{
      id: string; type: 'fact'; key: string; value: unknown;
      metadata: { project: string; session: string; agent: string; confidence: number; source: string; verified: boolean; accessLevel: string };
      provenance: { source: string; method: string; evidence: string[] };
      tags: string[]; status: string; createdAt: Date; updatedAt: Date; accessedAt: Date; accessCount: number;
    }> = [
      {
        id: 'm1', type: 'fact', key: 'typescript-config', value: 'tsconfig settings',
        metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
        provenance: { source: 't', method: 'explicit', evidence: [] }, tags: ['code'],
        status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 5,
      },
      {
        id: 'm2', type: 'fact', key: 'deploy-config', value: 'deployment pipeline',
        metadata: { project: 'p', session: 's', agent: 'a', confidence: 0.5, source: 't', verified: false, accessLevel: 'internal' },
        provenance: { source: 't', method: 'inferred', evidence: [] }, tags: ['ops'],
        status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0,
      },
    ];
    const score1 = searcher.relevanceScore('typescript config', memories[0]);
    const score2 = searcher.relevanceScore('typescript config', memories[1]);
    assert.ok(score1 > score2, 'typescript memory should score higher than deploy memory');
  });

  it('searches and returns ranked results', () => {
    const memories = [
      { id: 'm1', type: 'fact', key: 'typescript', value: 'tsconfig', tags: ['code'],
        metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
        provenance: { source: 't', method: 'explicit', evidence: [] },
        status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0 },
      { id: 'm2', type: 'fact', key: 'python', value: 'pytest setup', tags: ['testing'],
        metadata: { project: 'p', session: 's', agent: 'a', confidence: 1, source: 't', verified: true, accessLevel: 'internal' },
        provenance: { source: 't', method: 'explicit', evidence: [] },
        status: 'active', createdAt: new Date(), updatedAt: new Date(), accessedAt: new Date(), accessCount: 0 },
    ] as any[];
    const results = searcher.search('typescript', memories);
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].id, 'm1');
  });
});

describe('MemoryConsolidator', () => {
  let consolidator: MemoryConsolidator;
  let store: { loadAll: () => any[]; save: (m: any) => void };
  let index: { add: (m: any) => void; update: (m: any) => void; remove: (id: string) => void };

  beforeEach(() => {
    if (!existsSync(TEST_DIR)) mkdirSync(TEST_DIR, { recursive: true });
    store = {
      loadAll: () => [] as any[],
      save: () => {},
    };
    index = { add: () => {}, update: () => {}, remove: () => {} };
    consolidator = new MemoryConsolidator(store, index);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('consolidates without errors on empty store', () => {
    const result = consolidator.consolidate();
    assert.strictEqual(result.summarized, 0);
    assert.strictEqual(result.archived, 0);
    assert.strictEqual(result.deleted, 0);
  });
});

describe('MemoryLearner', () => {
  it('records outcomes and identifies patterns', () => {
    const recallResults: any[] = [];
    const learner = new MemoryLearner({
      recall: () => recallResults,
      storeMemory: (type, key, value) => ({ type, key, value }),
    });

    learner.recordOutcome({
      taskId: 't1',
      success: true,
      durationMs: 100,
      strategy: 'iterative',
      timestamp: new Date(),
    });
    learner.recordOutcome({
      taskId: 't2',
      success: true,
      durationMs: 200,
      strategy: 'iterative',
      timestamp: new Date(),
    });

    const stats = learner.getStats();
    assert.strictEqual(stats.strategiesIdentified, 0);
  });
});

describe('MemoryPrivacy', () => {
  let privacy: MemoryPrivacy;

  beforeEach(() => {
    privacy = new MemoryPrivacy();
  });

  it('denies access by default for foreign agent', () => {
    const memory: any = {
      id: 'm1',
      metadata: { agent: 'agent-a', project: 'project-a', accessLevel: 'internal' },
    };
    assert.strictEqual(privacy.canAccess(memory, 'agent-b', 'project-a'), false);
  });

  it('allows access for matching agent and project', () => {
    const memory: any = {
      id: 'm1',
      metadata: { agent: 'agent-a', project: 'project-a', accessLevel: 'internal' },
    };
    assert.strictEqual(privacy.canAccess(memory, 'agent-a', 'project-a'), true);
  });

  it('redacts secret memories', () => {
    const memory: any = {
      id: 'm1',
      key: 'secret-key',
      value: 'super-secret-value',
      metadata: { agent: 'agent-a', project: 'project-a', accessLevel: 'secret' },
      provenance: { source: 'test', method: 'explicit', evidence: ['proof'] },
      tags: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      accessedAt: new Date(),
      accessCount: 0,
    };
    const redacted = privacy.redact(memory, 'agent-b', 'project-a');
    assert.strictEqual(redacted.value, '[REDACTED]');
    assert.strictEqual(redacted.provenance.evidence.length, 0);
  });

  it('redacts confidential memories partially', () => {
    const memory: any = {
      id: 'm1',
      key: 'conf-key',
      value: 'confidential-data-here',
      metadata: { agent: 'agent-a', project: 'project-a', accessLevel: 'confidential' },
      provenance: { source: 'test', method: 'explicit', evidence: [] },
      tags: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      accessedAt: new Date(),
      accessCount: 0,
    };
    const exported = privacy.redactForExport([memory]);
    assert.ok((exported[0].value as string).includes('***'));
  });
});
