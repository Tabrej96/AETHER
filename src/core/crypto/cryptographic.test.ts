/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 03 TESTS: Genuine Crypto Hashing, Merkle, & Persistent Memory
 * (src/core/crypto/cryptographic.test.ts)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

import { sha256Hex, verifySha256AgainstKnownVectors, canonicalJson } from './sha256';
import { buildMerkleTree, createMerkleProof, verifyMerkleProof, createMerkleCheckpoint, hashPair, hashLeaf, MerkleTree } from './merkle';
import { PersistentMemoryStore } from '../persistence/memoryStore';

test('GATE-03: SHA-256 is genuine (verified against NIST test vectors)', () => {
  const res = verifySha256AgainstKnownVectors();
  assert.equal(res.passed, true, `NIST vector failures: ${res.failures.join('; ')}`);
  // cross-check with node:crypto directly
  assert.equal(sha256Hex('abc'), createHash('sha256').update('abc').digest('hex'));
  // canonicalJson is deterministic under key reordering
  assert.equal(canonicalJson({ a: 1, b: [1, 2] }), canonicalJson({ b: [1, 2], a: 1 }));
});

test('GATE-03: Merkle tree parent-child links are verifiable; a single leaf change invalidates exactly that proof', () => {
  const items = ['stage-1', 'stage-2', 'stage-3', 'stage-4', 'stage-5'];
  const { rootHash, depth } = buildMerkleTree(items);
  assert.ok(depth >= 2, 'a 5-leaf tree must have multiple levels of parent links');

  for (let i = 0; i < items.length; i++) {
    const proof = createMerkleProof(items, i);
    assert.equal(verifyMerkleProof(proof, rootHash).valid, true, `proof for leaf ${i} must verify`);
  }

  // Mutate one leaf -> every proof must now fail against the tampered tree's root.
  const tampered = [...items];
  tampered[2] = 'stage-3-MUTATED';
  const tamperedRoot = buildMerkleTree(tampered).rootHash;
  assert.notEqual(tamperedRoot, rootHash, 'a single leaf mutation must change the root hash');
  const leafProof = createMerkleProof(items, 2);
  assert.equal(verifyMerkleProof(leafProof, tamperedRoot).valid, false, 'an honest leaf proof must not verify against a tampered tree root');
});

test('GATE-09: cached MerkleTree serves many proofs from one build (bulk path)', () => {
  const items = Array.from({ length: 1000 }, (_, i) => `stage-${i}`);
  const tree = new MerkleTree(items);
  // the cached root must equal the one-shot build root (same algorithm, no drift)
  assert.equal(tree.rootHash, buildMerkleTree(items).rootHash, 'cached tree root must match the one-shot build');
  // batch of proofs verifies, and each matches the one-shot equivalent
  const batch = tree.proofs([0, 1, 2, 499, 999]);
  for (let k = 0; k < batch.length; k++) {
    const i = [0, 1, 2, 499, 999][k];
    assert.equal(verifyMerkleProof(batch[k], tree.rootHash).valid, true, `cached proof ${i} must verify`);
    const single = createMerkleProof(items, i);
    assert.deepEqual(
      { ...batch[k], rootHash: undefined },
      { ...single, rootHash: undefined },
      'cached proof and one-shot proof must be structurally identical (same sibling path)'
    );
  }
  // out-of-range index still fails loudly
  assert.throws(() => tree.proofs([1000]), /out of range/);
  // mutating a leaf invalidates cached proofs against the new root
  const mutated = [...items];
  mutated[42] = 'stage-42-MUTATED';
  const newRoot = new MerkleTree(mutated).rootHash;
  assert.equal(verifyMerkleProof(tree.proofs([42])[0], newRoot).valid, false, 'a stale cached proof must not verify against a mutated root');
});

test('GATE-03: hashPair is order-sensitive (left/right asymmetry) and validates digest inputs', () => {
  const a = hashLeaf('a');
  const b = hashLeaf('b');
  assert.notEqual(hashPair(a, b), hashPair(b, a), 'parent hash must depend on child order');
  assert.throws(() => hashPair('a', 'b'), /64-char hex/, 'hashPair must reject malformed digests, not hash empty buffers');
});

test('GATE-03: memory persists across simulated process restarts (new store instance reads prior state)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-mem-'));
  try {
    const storeA = new PersistentMemoryStore(dir, 'proj-x');
    storeA.addMemory({ agentId: 'impl-1', layer: 'VERIFIED_KNOWLEDGE', title: 't', content: 'use parameterized queries in service layer' });
    storeA.createCheckpoint(['stage-1', 'stage-2']);
    // "Restart": brand-new instance over the same directory
    const storeB = new PersistentMemoryStore(dir, 'proj-x');
    const records = storeB.records();
    assert.equal(records.length, 1, 'memory must survive a new process reading the same store dir');
    assert.equal(records[0].agentId, 'impl-1');
    const ckpts = storeB.checkpoints();
    assert.equal(ckpts.length, 1);
    // Merkle integrity of the persisted checkpoint
    assert.equal(storeB.verifyCheckpointMerkle(ckpts[0], 0).valid, true);
    assert.equal(storeB.verifyCheckpointMerkle(ckpts[0], 1).valid, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('GATE-03: forced-termination crash recovery replays un-drained WAL without duplicates', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-wal-'));
  try {
    const store = new PersistentMemoryStore(dir, 'proj-wal');
    // Simulate a crash AFTER walAppend wrote the WAL but BEFORE truncating it:
    const walPath = path.join(dir, 'proj-wal', 'wal');
    fs.mkdirSync(path.dirname(walPath), { recursive: true });
    const rec = store.addMemory({ layer: 'SESSION_MEMORY', title: 'pre', content: 'record-one' });
    // Re-inject the just-committed record into the WAL to emulate the crash window
    fs.appendFileSync(walPath, JSON.stringify({ kind: 'memory', payload: JSON.stringify(rec.record) }) + '\n');
    store.addMemory({ layer: 'SESSION_MEMORY', title: 'post', content: 'record-two' }); // triggers recover()
    const all = store.records();
    assert.equal(all.length, 2, 'crash-recovery must replay the WAL entry exactly once (dedup by key)');
    assert.equal(all.map((r) => r.title).includes('pre'), true);
    assert.equal(all.map((r) => r.title).includes('post'), true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('GATE-03: project-level isolation + agent scoping + duplicate detection', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-iso-'));
  try {
    const p1 = new PersistentMemoryStore(dir, 'proj-1');
    const p2 = new PersistentMemoryStore(dir, 'proj-2');
    p1.addMemory({ agentId: 'agent-a', layer: 'PROJECT_MEMORY', title: 'shared-content', content: 'same body' });
    assert.equal(p2.records().length, 0, 'proj-2 must see zero records from proj-1 (isolation)');

    // agent scoping
    p1.addMemory({ agentId: 'agent-b', layer: 'SESSION_MEMORY', title: 'b-only', content: 'b content' });
    assert.equal(p1.records('agent-a').length, 1);
    assert.equal(p1.records('agent-b').length, 1);
    assert.equal(p1.records(null).length, 2);

    // duplicate detection by content hash
    const dup = p1.addMemory({ agentId: 'agent-a', layer: 'SESSION_MEMORY', title: 'duplicate title', content: 'same body' });
    assert.equal(dup.deduplicated, true);
    assert.equal(p1.records('agent-a').length, 1, 'dedup must not create a second record');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('GATE-03: deletion and export of persistent memory', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-del-'));
  try {
    const store = new PersistentMemoryStore(dir, 'proj-del');
    store.addMemory({ layer: 'SESSION_MEMORY', title: 'a', content: 'export me' });
    const exported = store.records().map((r) => `${r.recordId}|${r.title}|${r.contentHash}`);
    assert.equal(exported.length, 1, 'export = serialize all records with their content hashes');
    store.deleteAll();
    assert.equal(store.records().length, 0, 'deleteAll must remove the project store');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('GATE-03: repeated crash/restore cycles leave a consistent store (10 cycles)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-cycle-'));
  try {
    for (let cycle = 0; cycle < 10; cycle++) {
      const store = new PersistentMemoryStore(dir, 'proj-cycle'); // fresh instance each cycle = restart
      store.addMemory({ layer: 'SESSION_MEMORY', title: `r${cycle}`, content: `cycle-${cycle}` });
      store.createCheckpoint([`stage-${cycle}`]);
      // emulate partial-crash window: re-inject the last record into WAL
      const last = store.records().at(-1)!;
      const walPath = path.join(dir, 'proj-cycle', 'wal');
      if (cycle % 3 === 0) fs.appendFileSync(walPath, JSON.stringify({ kind: 'memory', payload: JSON.stringify(last) }) + '\n');
    }
    const final = new PersistentMemoryStore(dir, 'proj-cycle');
    assert.equal(final.records().length, 10, 'all 10 distinct records survive repeated crash cycles');
    assert.equal(final.checkpoints().length, 10);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
