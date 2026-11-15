/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SYSTEM 6: Autonomous Debugging Intelligence (debugEngine.ts)
 * Enforces the 9-stage scientific debugging protocol:
 * Reproduce -> Gather Evidence -> Form Hypotheses -> Test Hypotheses ->
 * Identify Root Cause -> Minimal Fix -> Verify Fix -> Detect Regressions -> Record Knowledge.
 */

export interface DebugHypothesis {
  id: string;
  statement: string;
  priorProbability: number;
  diagnosticCommand: string;
  testOutcome: 'FALSIFIED' | 'CONFIRMED_ROOT_CAUSE' | 'UNTESTED';
  evidenceObserved: string;
}

export interface DebugProtocolReport {
  bugTitle: string;
  reproducedDeterministically: boolean;
  reproducerCommand: string;
  hypotheses: DebugHypothesis[];
  confirmedRootCause: string | null;
  minimalFixDiffLines: number;
  regressionSuitePassed: boolean;
  recordedFailureMemoryPattern: string;
  protocolValid: boolean;
  protocolViolationReason?: string;
}

export function executeScientificDebugProtocol(input: {
  bugTitle: string;
  stackTraceOrSymptom: string;
  reproducerCommand: string;
  reproducerExitCode: number; // Must be non-zero to prove reproduction before fix!
  hypotheses: DebugHypothesis[];
  minimalFixDiffLines: number;
  postFixReproducerExitCode: number;
  regressionSuitePassed: boolean;
}): DebugProtocolReport {
  const {
    bugTitle,
    reproducerCommand,
    reproducerExitCode,
    hypotheses,
    minimalFixDiffLines,
    postFixReproducerExitCode,
    regressionSuitePassed,
  } = input;

  const reproducedDeterministically = reproducerExitCode !== 0;
  if (!reproducedDeterministically) {
    return {
      bugTitle,
      reproducedDeterministically: false,
      reproducerCommand,
      hypotheses,
      confirmedRootCause: null,
      minimalFixDiffLines: 0,
      regressionSuitePassed: false,
      recordedFailureMemoryPattern: 'NONE',
      protocolValid: false,
      protocolViolationReason:
        'HARD GATE VIOLATION: Failure was not reproduced deterministically (reproducer exited 0) prior to proposing a fix.',
    };
  }

  const confirmed = hypotheses.find((h) => h.testOutcome === 'CONFIRMED_ROOT_CAUSE');
  if (!confirmed) {
    return {
      bugTitle,
      reproducedDeterministically: true,
      reproducerCommand,
      hypotheses,
      confirmedRootCause: null,
      minimalFixDiffLines,
      regressionSuitePassed: false,
      recordedFailureMemoryPattern: 'NONE',
      protocolValid: false,
      protocolViolationReason:
        'HARD GATE VIOLATION: No hypothesis was experimentally confirmed as the root cause before applying a code fix.',
    };
  }

  const fixVerified = postFixReproducerExitCode === 0 && regressionSuitePassed;

  return {
    bugTitle,
    reproducedDeterministically: true,
    reproducerCommand,
    hypotheses,
    confirmedRootCause: confirmed.statement,
    minimalFixDiffLines,
    regressionSuitePassed,
    recordedFailureMemoryPattern: `Root Cause [${confirmed.id}]: ${confirmed.statement} -> Verified via '${reproducerCommand}' (${minimalFixDiffLines}L minimal patch)`,
    protocolValid: fixVerified,
    protocolViolationReason: fixVerified
      ? undefined
      : 'Post-fix verification or PASS_TO_PASS regression suite failed.',
  };
}
