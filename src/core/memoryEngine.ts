/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SYSTEM 5 & 8: Deep Engineering Memory & Self-Improving Knowledge (memoryEngine.ts)
 * 7-layer provenance store, file-hash staleness detection, confidence decay,
 * and Quarantine-First Continuous Learning promotion gate.
 */

import { MemoryLayer, MemoryRecord } from './types';

export interface CandidatePatternPromotion {
  candidateId: string;
  title: string;
  statement: string;
  verifiedTaskPassCount: number;
  adversarialBlockerCount: number;
  regressionCount: number;
}

export interface PromotionDecision {
  promoted: boolean;
  targetLayer: MemoryLayer;
  newState: MemoryRecord['verificationState'];
  computedConfidence: number;
  reason: string;
}

/**
 * Audits existing memory records against current repository file hashes.
 * Automatically downgrades memories whose bound files were refactored since verification.
 */
export function auditMemoryProvenance(
  memories: MemoryRecord[],
  currentFileHashes: Record<string, string>
): MemoryRecord[] {
  return memories.map((mem) => {
    const hashChanged = mem.boundFilePaths.some(
      (path) => currentFileHashes[path] && currentFileHashes[path] !== mem.boundFileHash
    );

    if (hashChanged && mem.verificationState === 'VERIFIED') {
      return {
        ...mem,
        verificationState: 'STALE_REVALIDATION_REQUIRED',
        confidence: Number((mem.confidence * 0.55).toFixed(2)),
        version: mem.version + 1,
      };
    }
    return mem;
  });
}

/**
 * SYSTEM 8: Controlled Continuous Learning Promotion Gate.
 * Unlike ECC's continuous-learning-v2 which promotes "instincts" based on observation frequency,
 * AETHER requires >= 3 deterministic test passes, 0 adversarial blockers, and 0 regressions.
 */
export function evaluatePatternPromotion(candidate: CandidatePatternPromotion): PromotionDecision {
  const { verifiedTaskPassCount, adversarialBlockerCount, regressionCount } = candidate;

  if (adversarialBlockerCount > 0 || regressionCount > 0) {
    return {
      promoted: false,
      targetLayer: 'FAILURE_MEMORY',
      newState: 'FALSIFIED',
      computedConfidence: 0.95,
      reason: `Rejected fromReusable Patterns and recorded in FAILURE_MEMORY: caused ${adversarialBlockerCount} adversarial blocker(s) and ${regressionCount} regression(s).`,
    };
  }

  if (verifiedTaskPassCount < 3) {
    return {
      promoted: false,
      targetLayer: 'SESSION_MEMORY',
      newState: 'QUARANTINED_CANDIDATE',
      computedConfidence: Number((0.4 + verifiedTaskPassCount * 0.15).toFixed(2)),
      reason: `Remains in quarantine (${verifiedTaskPassCount}/3 verified task passes completed). AETHER requires 3 independent verified passes before promoting to official Reusable Patterns.`,
    };
  }

  const computedConfidence = Number(Math.min(0.99, 0.82 + verifiedTaskPassCount * 0.03).toFixed(2));
  return {
    promoted: true,
    targetLayer: 'REUSABLE_PATTERNS',
    newState: 'VERIFIED',
    computedConfidence,
    reason: `Promoted to official REUSABLE_PATTERNS library: verified across ${verifiedTaskPassCount} independent tasks with 0 regressions and 0 adversarial blockers.`,
  };
}
