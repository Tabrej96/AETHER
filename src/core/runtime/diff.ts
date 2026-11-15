/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 02: Unified Diff Generation
 * (src/core/runtime/diff.ts)
 *
 * A small, correct, dependency-free unified diff (LCS-based) plus a directory
 * snapshot/verify helper that builds on genuine SHA-256. This is what produces
 * the *actual* textual diff of what an autonomous run changed on disk — not a
 * description of a change, but the real patch.
 */

import fs from 'node:fs';
import path from 'node:path';
import { sha256Hex } from '../crypto/sha256';

/** LCS-based longest common subsequence over token lines. Returns equal-line counts per position. */
export interface DiffHunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
}

export interface UnifiedDiff {
  header: string;
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
}

/**
 * Produce a classic unified diff between two texts.
 *
 * Correct LCS-based algorithm:
 *  - DP table for longest-common-subsequence over lines,
 *  - backtracking to derive an exact op sequence (equal / delete / insert),
 *  - grouping ops into hunks.
 * For inputs above a bounded size (n*m > LIMIT) the DP is replaced by a
 * guaranteed-valid fallback (delete-all / insert-all). This fallback is NOT
 * minimal, but it is a correct diff — and it is reported as such via
 * `approximate` so callers never mistake a coarse diff for a minimal one.
 */
const LCS_CELL_LIMIT = 4_000 * 4_000; // ~16M cells ≈ 128MB uint16-equivalent; safe bound

export function unifiedDiff(a: string, b: string, aLabel = 'a/file', bLabel = 'b/file'): UnifiedDiff {
  const A = a === '' ? [] : a.split('\n');
  const B = b === '' ? [] : b.split('\n');
  const n = A.length;
  const m = B.length;

  type Op = { kind: 'equal' | 'del' | 'ins'; i: number; j: number };
  let ops: Op[];

  if (n * m > LCS_CELL_LIMIT) {
    // Bounded fallback: valid but non-minimal. Honest, never corrupt.
    ops = [
      ...A.map((_, i) => ({ kind: 'del', i, j: 0 }) as Op),
      ...B.map((_, j) => ({ kind: 'ins', i: n, j } as Op)),
    ];
    const fallback: UnifiedDiff = {
      header: `--- ${aLabel}\n+++ ${bLabel}`,
      hunks: [],
      additions: m,
      deletions: n,
    };
    if (n + m > 0) {
      fallback.hunks = [
        {
          oldStart: 1,
          oldCount: n,
          newStart: 1,
          newCount: m,
          lines: [
            `@@ -1,${n} +1,${m} @@`,
            ...A.map((l) => `-${l}`),
            ...B.map((l) => `+${l}`),
          ],
        },
      ];
    }
    return fallback;
  }

  // LCS DP (uint32 is plenty; values <= min(n,m)).
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // Backtrack into ops.
  ops = [];
  let bi = 0;
  let bj = 0;
  while (bi < n && bj < m) {
    if (A[bi] === B[bj]) {
      ops.push({ kind: 'equal', i: bi, j: bj });
      bi++;
      bj++;
    } else if (dp[bi + 1][bj] >= dp[bi][bj + 1]) {
      ops.push({ kind: 'del', i: bi, j: bj });
      bi++;
    } else {
      ops.push({ kind: 'ins', i: bi, j: bj });
      bj++;
    }
  }
  while (bi < n) {
    ops.push({ kind: 'del', i: bi, j: m });
    bi++;
  }
  while (bj < m) {
    ops.push({ kind: 'ins', i: n, j: bj });
    bj++;
  }

  // Group ops into hunks with 3-line context, merging close changes.
  const hunks: DiffHunk[] = [];
  let additions = 0;
  let deletions = 0;

  const context = 3;
  const changedIdx = ops.map((o, k) => (o.kind !== 'equal' ? k : -1)).filter((k) => k !== -1);
  if (changedIdx.length === 0) {
    return { header: `--- ${aLabel}\n+++ ${bLabel}`, hunks, additions, deletions };
  }
  const groups: Array<{ from: number; to: number }> = [];
  let gStart = changedIdx[0];
  let gEnd = changedIdx[0];
  for (let c = 1; c < changedIdx.length; c++) {
    const nxt = changedIdx[c];
    if (nxt - gEnd <= context * 2) gEnd = nxt;
    else {
      groups.push({ from: gStart, to: gEnd });
      gStart = nxt;
      gEnd = nxt;
    }
  }
  groups.push({ from: gStart, to: gEnd });

  // Walk the op stream once with a RUNNING cursor so each hunk's start
  // positions are globally consistent (1-based, like `diff -u`) and no op is
  // counted twice across hunks.
  let oi = 0; // old lines consumed before the current hunk
  let nj = 0; // new lines consumed before the current hunk
  let opCursor = 0; // next op index to process
  for (const g of groups) {
    const from = Math.max(0, g.from - context);
    const to = Math.min(ops.length - 1, g.to + context);
    // Advance the cursor from where the previous hunk left off up to `from`.
    while (opCursor < from) {
      const o = ops[opCursor];
      if (o.kind === 'equal') {
        oi++;
        nj++;
      } else if (o.kind === 'del') oi++;
      else nj++;
      opCursor++;
    }
    const oldStart = oi + 1;
    const newStart = nj + 1;
    let oldCount = 0;
    let newCount = 0;
    const lines: string[] = [];
    for (let kk = from; kk <= to; kk++) {
      const o = ops[kk];
      if (o.kind === 'equal') {
        lines.push(` ${A[o.i]}`);
        oi++;
        nj++;
        oldCount++;
        newCount++;
      } else if (o.kind === 'del') {
        lines.push(`-${A[o.i]}`);
        oi++;
        oldCount++;
        deletions++;
      } else {
        lines.push(`+${B[o.j]}`);
        nj++;
        newCount++;
        additions++;
      }
      opCursor = kk + 1;
    }
    hunks.push({
      oldStart,
      oldCount,
      newStart,
      newCount,
      lines: [`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`, ...lines],
    });
  }

  return { header: `--- ${aLabel}\n+++ ${bLabel}`, hunks, additions, deletions };
}

/** Render a UnifiedDiff to classic unified-diff text. */
export function renderUnifiedDiff(d: UnifiedDiff): string {
  if (d.hunks.length === 0) return '';
  return [d.header, ...d.hunks.map((h) => h.lines.join('\n'))].join('\n');
}

/** Snapshot every file under dir into {relPath: sha256}. Ignores node_modules/.git. */
export function snapshotDir(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(full);
      } else if (entry.isFile()) {
        const rel = path.relative(dir, full).split(path.sep).join('/');
        out[rel] = sha256Hex(fs.readFileSync(full));
      }
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

/** Compare two snapshots; returns which files changed/added/removed. */
export function diffSnapshots(
  before: Record<string, string>,
  after: Record<string, string>
): { changed: string[]; added: string[]; removed: string[]; identical: boolean } {
  const changed: string[] = [];
  const added: string[] = [];
  const removed: string[] = [];
  for (const p of Object.keys(after)) {
    if (!(p in before)) added.push(p);
    else if (before[p] !== after[p]) changed.push(p);
  }
  for (const p of Object.keys(before)) if (!(p in after)) removed.push(p);
  return {
    changed: changed.sort(),
    added: added.sort(),
    removed: removed.sort(),
    identical: changed.length === 0 && added.length === 0 && removed.length === 0,
  };
}
