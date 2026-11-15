# AETHER 1.0 — Changelog

Created by Tabrej · License: Apache-2.0

## 1.0.0 — First Release (2026-11-12)

**Nine advanced capability research programs + Program 10 hardening.**

### Added
- **Nine capability programs** (`src/core/programs/`) — Development
  Intelligence, Reverse Intelligence, Autonomous Execution, Multi-Agent
  Orchestration, Browser Intelligence, Visual Computer Engine, Browser
  Runtime, Workspace & Knowledge, Creative Intelligence — each with an
  integration registry (`DISCOVER → INSTALL → VALIDATE → REGISTER → EXECUTE →
  MONITOR → UPDATE → REMOVE` lifecycle) recording provider, license,
  provenance, execution method, and benchmark evidence.
- **117 agents / 540 skills / 54 workflows** (711 validated components) with
  a 5-rubric quality scorer and open-source credit + license boundary
  tracking (Apache-2.0 / MIT / BSD-3 clauses verified).
- **8-tool MCP server** over stdio JSON-RPC 2.0, verified against two
  independent clients.
- **Real model infrastructure** (`src/core/providers/`) — vendor-agnostic
  HTTPS client, streaming, full-jitter backoff honoring `Retry-After`,
  health monitoring, fallback chains, cost reporting, error-sentinel
  detection. Live end-to-end check reports `MEASURED` or an honest
  `UNAVAILABLE_*` state — never a mock.
- **Real autonomous execution** (`src/core/runtime/`) — persistent task
  queue with crash-recovery WAL, exclusive file leases, genuine unified
  diffs, Merkle-checkpointed memory.
- **Genuine crypto** (`src/core/crypto/`) — NIST-vector-verified SHA-256
  (FIPS 180-4 via `node:crypto`) and a cached `MerkleTree` (O(log n)
  proofs after a one-time O(n log n) build).
- **Ten release gates** with machine-verifiable evidence under
  `release-evidence/` — GATE 01 (providers) through GATE 12 (final
  certification), including repeated-trial benchmark certification with
  independent re-verification, a pre-declared-budget performance stress,
  and a packaging/distribution verification (fresh install simulation,
  offline bundle proof, uninstall round-trip, tarball scoping).

### Changed
- Bin entry points are now compiled, self-contained ESM bundles
  (`dist/bins/`) built by `prepare`; `bin` fields point at them. The
  published tarball ships ~8 files (~150 KB) instead of the whole repo.
- The installer writes `.aether/owned-files.json`; a new `aether
  uninstall` command removes **exactly** those files (path-containment
  guarded; operator files untouched).

### Fixed
- Merkle bulk-proof bottleneck: 100 proofs over 10k leaves went from
  3,954 ms (per-proof level rebuild) to ~58 ms (cached tree).
- Security Engine now detects inline event-handler XSS
  (`onerror`/`onload`) and browser credential harvesting
  (`document.cookie`/`localStorage`/`sessionStorage`) in a single
  detection path.

### Verified
- 88+ unit/integration tests, flake-free under double-run (GATE 07),
  ≥80 % combined-coverage gate on the six critical core modules.
- Every documented command machine-verified by
  `npx tsx scripts/verify-documented-commands.ts`.

Full per-gate evidence: `release-evidence/gate01-providers.txt` …
`release-evidence/gate12-certification.txt`.
