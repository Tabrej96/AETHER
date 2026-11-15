/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 10 — GATE 07-A: UNIT TESTS for the diff/snapshot primitives
 * (src/core/runtime/diff.test.ts)
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { unifiedDiff, renderUnifiedDiff, snapshotDir, diffSnapshots } from './diff';

/** Apply a unified diff to the original text; used as the round-trip oracle. */
function apply(aText: string, d: ReturnType<typeof unifiedDiff>): string {
  const A = aText === '' ? [] : aText.split('\n');
  const out: string[] = [];
  let p = 0;
  for (const h of d.hunks) {
    while (p < h.oldStart - 1) {
      out.push(A[p]);
      p++;
    }
    for (const l of h.lines.slice(1)) {
      if (l.startsWith(' ')) {
        out.push(l.slice(1));
        p++;
      } else if (l.startsWith('-')) p++;
      else out.push(l.slice(1));
    }
  }
  while (p < A.length) {
    out.push(A[p]);
    p++;
  }
  return out.join('\n');
}

test('GATE-07-A: diff of identical texts has no hunks and zero counts', () => {
  const d = unifiedDiff('same\nsame\n', 'same\nsame\n');
  assert.equal(d.hunks.length, 0);
  assert.equal(d.additions, 0);
  assert.equal(d.deletions, 0);
  assert.equal(renderUnifiedDiff(d), '', 'an identical diff renders as empty text');
});

test('GATE-07-A: single-hunk modify round-trips', () => {
  const a = ['a', 'b', 'c', 'd'].join('\n');
  const b = ['a', 'B', 'c', 'd'].join('\n');
  const d = unifiedDiff(a, b);
  assert.equal(d.additions, 1);
  assert.equal(d.deletions, 1);
  assert.equal(apply(a, d), b);
  const rendered = renderUnifiedDiff(d);
  assert.match(rendered, /--- a\/file/);
  assert.match(rendered, /\+\+\+ b\/file/);
  assert.match(rendered, /@@ -/);
  assert.match(rendered, /-b/);
  assert.match(rendered, /\+B/);
});

test('GATE-07-A: three far-apart changes produce three independent hunks', () => {
  const a = Array.from({ length: 60 }, (_, i) => `L${i}`).join('\n');
  const lines = a.split('\n');
  lines[2] = 'X2';
  lines[30] = 'X30';
  lines[57] = 'X57';
  const b = lines.join('\n');
  const d = unifiedDiff(a, b);
  assert.equal(d.hunks.length, 3, 'three far-apart changes must produce three hunks');
  assert.equal(apply(a, d), b, 'the round-trip must reproduce the target with all three hunks');
  assert.equal(d.additions, 3);
  assert.equal(d.deletions, 3);
});

test('GATE-07-A: insert-only and delete-only changes round-trip', () => {
  const a = ['1', '2', '3'].join('\n');
  const inserted = unifiedDiff(a, '1\nNEW\n2\n3');
  assert.equal(apply(a, inserted), '1\nNEW\n2\n3');
  const deleted = unifiedDiff('1\n2\n3', '1\n3');
  assert.equal(apply('1\n2\n3', deleted), '1\n3');
});

test('GATE-07-A: large-input fallback stays a valid (non-minimal) diff', () => {
  // 4500 x 4500 = 20.25M cells > LCS_CELL_LIMIT (16M) -> bounded fallback.
  const a = Array.from({ length: 4500 }, (_, i) => `o${i}`).join('\n');
  const b = Array.from({ length: 4500 }, (_, i) => `n${i}`).join('\n');
  const d = unifiedDiff(a, b);
  assert.equal(d.additions, 4500);
  assert.equal(d.deletions, 4500);
  assert.equal(apply(a, d), b, 'even the fallback must round-trip exactly');
});

test('GATE-07-A: snapshotDir + diffSnapshots track real file changes on disk', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aether-snap-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'a.txt'), 'one');
    fs.writeFileSync(path.join(dir, 'src', 'b.txt'), 'two');
    fs.mkdirSync(path.join(dir, 'node_modules', 'junk'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules', 'junk', 'x'), 'ignored');

    const before = snapshotDir(dir);
    assert.equal(before['src/a.txt'].length, 64, 'hashes must be genuine 64-char SHA-256 hex');
    assert.equal(Object.keys(before).length, 2, 'node_modules must be excluded from the snapshot');

    fs.writeFileSync(path.join(dir, 'src', 'a.txt'), 'one-CHANGED');
    fs.writeFileSync(path.join(dir, 'src', 'c.txt'), 'new file');
    fs.rmSync(path.join(dir, 'src', 'b.txt'));

    const after = snapshotDir(dir);
    const delta = diffSnapshots(before, after);
    assert.deepEqual(delta.changed, ['src/a.txt']);
    assert.deepEqual(delta.added, ['src/c.txt']);
    assert.deepEqual(delta.removed, ['src/b.txt']);
    assert.equal(delta.identical, false);
    assert.equal(diffSnapshots(before, snapshotDir(dir)).identical, false);
    assert.equal(diffSnapshots(before, before).identical, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
