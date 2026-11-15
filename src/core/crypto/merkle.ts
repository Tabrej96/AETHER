/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 03: Genuine Merkle Tree with Verifiable Parent-Child Links
 * (src/core/crypto/merkle.ts)
 *
 * A real Merkle tree built on node:crypto SHA-256 (FIPS 180-4):
 *  - leaves are SHA-256 of canonical content,
 *  - each parent = SHA-256(raw left digest || raw right digest),
 *  - odd nodes are promoted verbatim (recorded in the level structure),
 *  - verification recomputes any leaf→root path and reports the mismatch.
 *
 * This supersedes the FNV-style "sha256:"-prefixed hash in continuityEngine.ts
 * for any state that must be cryptographically verifiable. The
 * checkpoint content-addressing contract is preserved: the root changes iff
 * state changes.
 */

import { canonicalJson, sha256Hex } from './sha256';

const DIGEST_RE = /^[0-9a-f]{64}$/;

export interface MerkleNode {
  hash: string; // SHA-256 hex digest
  isLeaf: boolean;
  left?: MerkleNode;
  right?: MerkleNode;
}

export interface MerkleProof {
  leafContent: string; // canonical JSON of the leaf item
  path: Array<{ side: 'left' | 'right'; siblingHash: string }>;
  leafHash: string;
  rootHash: string;
}

export interface MerkleVerifyResult {
  valid: boolean;
  mismatchedNodeHash?: string;
  mismatchReason?: string;
}

/**
 * Hash two node digests into a parent digest. Left and right order matters.
 * Both inputs MUST be 64-char lowercase hex SHA-256 digests; malformed input
 * is a programming error and is rejected loudly rather than silently hashed
 * as an empty buffer.
 */
export function hashPair(left: string, right: string): string {
  if (!DIGEST_RE.test(left) || !DIGEST_RE.test(right)) {
    throw new Error(`hashPair requires 64-char hex SHA-256 digests, got (${left.slice(0, 12)}…, ${right.slice(0, 12)}…)`);
  }
  return sha256Hex(Buffer.concat([Buffer.from(left, 'hex'), Buffer.from(right, 'hex')]));
}

/** Canonical leaf hash for a content item. */
export function hashLeaf(item: unknown): string {
  return sha256Hex(canonicalJson(item));
}

/** Build the level structure of the tree (level 0 = leaf digests). */
function buildLevels(items: unknown[]): string[][] {
  const levels: string[][] = [items.map((it) => hashLeaf(it))];
  while (levels[levels.length - 1].length > 1) {
    const lvl = levels[levels.length - 1];
    const next: string[] = [];
    for (let i = 0; i < lvl.length; i += 2) {
      // odd node is promoted verbatim (no self-duplication)
      next.push(i + 1 < lvl.length ? hashPair(lvl[i], lvl[i + 1]) : lvl[i]);
    }
    levels.push(next);
  }
  return levels;
}

export function buildMerkleTree(items: unknown[]): { root: MerkleNode; rootHash: string; depth: number } {
  const levels = buildLevels(items);
  const rootHash = levels[levels.length - 1][0];
  return {
    root: { hash: rootHash, isLeaf: levels.length === 1 },
    rootHash: items.length === 0 ? sha256Hex('') : rootHash,
    depth: levels.length - 1,
  };
}

/**
 * A Merkle tree that builds its level structure ONCE (O(n log n)) and serves
 * many inclusion proofs from the cache in O(log n) each. Use this when you
 * need many proofs for the same content set (e.g. a bulk-audit or a
 * checkpoint fan-out); the one-shot `createMerkleProof` rebuilds per call.
 */
export class MerkleTree {
  readonly items: unknown[];
  private readonly levels: string[][];
  readonly rootHash: string;

  constructor(items: unknown[]) {
    this.items = items;
    this.levels = buildLevels(items);
    this.rootHash = items.length === 0 ? sha256Hex('') : this.levels[this.levels.length - 1][0];
  }

  /** O(log n) proof for a single index, using the cached levels. */
  proof(index: number): MerkleProof {
    const proof = buildProofFromLevels(this.items, this.levels, index);
    return { ...proof, rootHash: this.rootHash };
  }

  /** k proofs in O(k log n) — no repeated tree rebuilds. */
  proofs(indices: number[]): MerkleProof[] {
    return indices.map((i) => this.proof(i));
  }
}

/** Shared proof builder over a precomputed level structure. */
function buildProofFromLevels(items: unknown[], levels: string[][], index: number): MerkleProof {
  if (index < 0 || index >= items.length) {
    throw new RangeError(`Merkle proof index ${index} out of range [0, ${items.length})`);
  }
  const leafHash = levels[0][index];
  const leafContent = canonicalJson(items[index]);
  const path: MerkleProof['path'] = [];
  let cur = leafHash;
  let idx = index;
  for (let l = 0; levels[l].length > 1; l++) {
    const lvl = levels[l];
    if (idx % 2 === 0) {
      if (idx + 1 < lvl.length) {
        path.push({ side: 'right', siblingHash: lvl[idx + 1] });
        cur = hashPair(cur, lvl[idx + 1]);
      }
    } else {
      path.push({ side: 'left', siblingHash: lvl[idx - 1] });
      cur = hashPair(lvl[idx - 1], cur);
    }
    idx = Math.floor(idx / 2);
  }
  return { leafContent, path, leafHash, rootHash: cur };
}

/**
 * Produce a Merkle inclusion proof (sibling-hash path) for the leaf at
 * `index`. Verifiable by anyone holding the root hash — this is the
 * "verifiable parent-child relationship" gate 03 requires.
 */
/**
 * One-shot proof. NOTE: this rebuilds the full level structure for a single
 * index (O(n log n) per call) — correct but not bulk-optimized. For many
 * proofs over the same content set, build a `MerkleTree` once and call
 * `proofs(indices)` (O(log n) each, amortized O(1) build).
 */
export function createMerkleProof(items: unknown[], index: number): MerkleProof {
  return buildProofFromLevels(items, buildLevels(items), index);
}

/** Recompute a leaf hash up to the root using the sibling path; compare to claimed root. */
export function verifyMerkleProof(proof: MerkleProof, claimedRootHash: string): MerkleVerifyResult {
  const leaf = sha256Hex(proof.leafContent);
  if (leaf !== proof.leafHash) {
    return { valid: false, mismatchedNodeHash: leaf, mismatchReason: 'leaf hash does not match proof.leafHash' };
  }
  let cur = leaf;
  for (const step of proof.path) {
    cur = step.side === 'right' ? hashPair(cur, step.siblingHash) : hashPair(step.siblingHash, cur);
  }
  const valid = cur === claimedRootHash;
  return valid
    ? { valid: true }
    : { valid: false, mismatchedNodeHash: cur, mismatchReason: `recomputed root ${cur} != claimed ${claimedRootHash}` };
}

/** A content-addressed checkpoint record using the genuine Merkle root. */
export interface MerkleCheckpoint {
  checkpointId: string;
  rootHash: string;
  depth: number;
  leafCount: number;
  leafContents: string[];
  createdAtIso: string;
}

export function createMerkleCheckpoint(stageLabels: string[]): MerkleCheckpoint {
  const { rootHash, depth } = buildMerkleTree(stageLabels);
  return {
    checkpointId: `ckpt-${rootHash.slice(0, 12)}`,
    rootHash,
    depth,
    leafCount: stageLabels.length,
    leafContents: stageLabels,
    createdAtIso: new Date().toISOString(),
  };
}
