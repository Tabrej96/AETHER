#!/usr/bin/env node
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * GATE 10 — build the published-package entry points.
 * Bundles bin/aether.ts and mcp/aether-mcp-server.ts into dist/bins/*.mjs
 * (plain ESM, no tsx needed at runtime) so `npm install` / `npm i -g` users
 * get executable bins instead of raw TypeScript.
 *
 * Runs on `prepare`. If esbuild is not installed (e.g. a plain tarball
 * install where devDependencies are absent), it exits 0 and relies on the
 * pre-built dist/bins committed with the repo — the script NEVER fails the
 * install.
 */
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const outdir = path.resolve(process.cwd(), 'dist', 'bins');

function bundle(entry, out) {
  // The .ts entry points already begin with a shebang; esbuild preserves it
  // as the first line, so we do NOT add a banner (that would duplicate it).
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: out,
    logLevel: 'warning',
  });
  fs.chmodSync(out, 0o755);
}

let esbuildAvailable = true;
try {
  bundle(path.resolve(process.cwd(), 'bin', 'aether.ts'), path.join(outdir, 'aether.mjs'));
  bundle(path.resolve(process.cwd(), 'mcp', 'aether-mcp-server.ts'), path.join(outdir, 'aether-mcp.mjs'));
} catch (err) {
  const msg = String((err && err.message) || err);
  if (msg.includes('Cannot find module') || msg.includes('esbuild') || msg.includes('ERR_MODULE_NOT_FOUND')) {
    esbuildAvailable = false;
    console.log(`[build-bins] esbuild unavailable (${msg.split('\n')[0]}); keeping pre-built dist/bins.`);
  } else {
    throw err;
  }
}

if (esbuildAvailable) {
  console.log(`[build-bins] wrote ${path.relative(process.cwd(), path.join(outdir, 'aether.mjs'))} and ${path.relative(process.cwd(), path.join(outdir, 'aether-mcp.mjs'))}`);
}
