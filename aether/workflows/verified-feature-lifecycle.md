---
id: verified-feature-lifecycle
name: Zero-Regression Verified Feature & Adversarial Gate Workflow
version: 2.0.0
license: Apache-2.0
attribution: "AETHER Core Workflow — advances affaan-m/ECC TDD workflow (MIT) with Predictive Blast Radius & Adversarial Gate"
---

# Workflow: Zero-Regression Verified Feature Lifecycle (`verified-feature-lifecycle`)

## 1. Entry Conditions
- Repository working tree is clean or has an active Zero-Loss Continuity checkpoint (`continuityEngine`).
- Task specification has been scanned by `securityEngine` with zero prompt-injection blocks.

## 2. Execution Stages
1. **Stage 1 — Neural Context & Blast-Radius Modeling (`systems-architect-prime`)**: Slice context to `< 25%` token capacity, identify affected AST symbols, and compute `TargetedVerificationPlan`.
2. **Stage 2 — Red-Green Contract Locking (`tdd-verification-engineer`)**: Author or update deterministic unit/integration tests covering target behavior and predicted blast-radius edge cases. Verify tests fail for the expected reason before implementation.
3. **Stage 3 — Leased Swarm Implementation (`domain-implementer-*`)**: Acquire exclusive file-write leases via `swarmEngine`, implement minimal changes satisfying contracts, and run local typecheck + unit tests.
4. **Stage 4 — Independent Adversarial Falsification (`adversarial-code-breaker` & `adversarial-security-attacker`)**: Execute hostile review attempting to break concurrency, boundary conditions, auth boundaries, and algorithmic complexity.
5. **Stage 5 — Provenance Memory Commit & Continuity Checkpoint (`memory-curator`)**: Record verified patterns or falsified hypotheses into `memoryEngine` with file SHA-256 hashes and emit final verification ledger.

## 3. Dependencies
- Stage 2 requires `BlastRadiusReport` from Stage 1.
- Stage 3 requires failing test verification from Stage 2 and exclusive file-lease acquisition.
- Stage 4 requires all tests in Stage 3 passing (`exitCode === 0`).
- Stage 5 requires zero unresolved `CRITICAL` or `HIGH` adversarial findings from Stage 4.

## 4. Failure Handling
- **Test Failure in Stage 3**: Transition immediately to Autonomous Debugging Protocol (`debugEngine`), capping retries at 3 hypothesis cycles before restoring last green Merkle checkpoint.
- **Adversarial Block in Stage 4**: Return concrete counterexample test to Stage 3 engineer (max 2 refinement rounds).
- **Session Interruption / Context Limit**: Persist atomic Merkle checkpoint via `continuityEngine` and generate 400-token resume brief.

## 5. Completion Criteria
- All targeted unit and integration tests pass (`100%` pass rate).
- Zero regressions on `PASS_TO_PASS` baseline test suite.
- Zero `CRITICAL`/`HIGH` findings from `adversarialEngine` and `securityEngine`.
- Merkle continuity checkpoint committed with SHA-256 verification state.
