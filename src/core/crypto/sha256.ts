/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 03: Genuine Cryptographic Primitives
 * (src/core/crypto/sha256.ts)
 *
 * Wraps node:crypto SHA-256 (FIPS 180-4). Anything claiming "sha256:" must
 * come from this module. The legacy FNV-style hash in continuityEngine.ts is
 * non-cryptographic and is documented as superseded by this module — it is
 * NEVER labelled SHA-256.
 */

import { createHash } from 'node:crypto';

/** Genuine SHA-256 hex digest (32 bytes = 64 hex chars). */
export function sha256Hex(input: string | Uint8Array | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/** SHA-256 with the `sha256:` prefix used by AETHER content-addressing. */
export function sha256Tagged(input: string | Uint8Array | Buffer): string {
  return `sha256:${sha256Hex(input)}`;
}

/**
 * Deterministic canonical JSON: object keys sorted lexicographically, arrays
 * order-preserving. Produces the unique byte string a Merkle leaf hashes, so
 * identical logical state always yields an identical hash.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean') return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalJson(v)).join(',')}]`;
  }
  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`;
  }
  return JSON.stringify(String(value));
}

export interface Sha256SelfTestResult {
  passed: boolean;
  vectorsChecked: number;
  failures: string[];
}

/**
 * Self-test against NIST-published SHA-256 vectors. This is what allows us to
 * honestly claim "genuine SHA-256" — the digest is verified against known
 * answers, not merely asserted.
 */
export function verifySha256AgainstKnownVectors(): Sha256SelfTestResult {
  // FIPS 180-4 / NIST-published test vectors (SHA-256 section):
  //  - "" and "abc" are the canonical one-block examples;
  //  - "abc…q" (56 chars) and "a"×80 are the canonical multi-block examples.
  const vectors: Array<[string, string]> = [
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    [
      'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq',
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    ],
    ['a'.repeat(80), '0f45e858fbc4176cdf4e411f88281edefc390ae5afe7df0f44cd9297f0a64580'],
  ];
  const failures: string[] = [];
  for (const [input, expected] of vectors) {
    const actual = sha256Hex(input);
    if (actual !== expected) failures.push(`vector ${JSON.stringify(input.slice(0, 12))}: expected ${expected}, got ${actual}`);
  }
  return { passed: failures.length === 0, vectorsChecked: vectors.length, failures };
}
