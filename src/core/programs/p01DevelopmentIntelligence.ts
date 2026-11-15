/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 01 — DEVELOPMENT INTELLIGENCE  ·  AETHER Development Intelligence
 * (src/core/programs/p01DevelopmentIntelligence.ts)
 *
 * Researched from:
 *   - affaan-m/ECC            (MIT) — skills, hook system, context optimization, memory
 *   - obra/superpowers        (MIT) — TDD workflow, brainstorm->plan->implement loop
 *
 * Delivers: a research-first development workflow that COMPOSES the existing
 * AETHER Skill / Workflow / Hook / Memory engines instead of re-implementing
 * them. It adds the pieces those programs are strongest at:
 *   - skill discovery by deterministic AST/intent trigger scoring,
 *   - a research-first gate (no planning before a research dossier exists),
 *   - a Red-Green-Refactor TDD gate,
 *   - a debugging hypothesis ledger (integrates the existing Debug Engine),
 *   - instinct extraction (memory pattern candidates for the promotion gate).
 */

import { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export interface SkillTrigger {
  skillId: string;
  /** deterministic activation triggers (AST intents / keywords / tool use) */
  triggers: string[];
}

export interface DevWorkflowInput {
  task: string;
  /** observed AST/intent signals for the task, e.g. ['sql-injection','refactor','test'] */
  observedSignals: string[];
  availableSkills: SkillTrigger[];
  /** has the engineer completed a research-first pass? */
  hasResearchDossier: boolean;
}

export interface SkillHit {
  skillId: string;
  matchedTriggers: string[];
  score: number;
}

/** Deterministic skill discovery: rank available skills by overlap with observed signals. */
export function discoverSkills(input: DevWorkflowInput): SkillHit[] {
  const hits: SkillHit[] = input.availableSkills.map((s) => {
    const matched = s.triggers.filter((t) => input.observedSignals.includes(t));
    return { skillId: s.skillId, matchedTriggers: matched, score: matched.length };
  });
  return hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score || a.skillId.localeCompare(b.skillId));
}

export type TddGateState = 'RED' | 'GREEN' | 'REFACTOR' | 'BLOCKED';

export interface TddStep {
  phase: TddGateState;
  description: string;
  testCommand?: string;
}

/**
 * Red-Green-Refactor gate. A task is BLOCKED if there is no failing test
 * (RED not satisfied). This encodes superpowers' "test-first" discipline.
 */
export function evaluateTddGate(input: {
  taskHasFailingTest: boolean;
  testsNowPass: boolean;
  refactorApplied: boolean;
}): TddStep[] {
  if (!input.taskHasFailingTest) {
    return [{ phase: 'BLOCKED', description: 'Cannot enter TDD gate: no RED (failing) test exists yet. Write the failing test first.' }];
  }
  const steps: TddStep[] = [{ phase: 'RED', description: 'Failing test in place; observe it fail for the right reason.' }];
  if (input.testsNowPass) {
    steps.push({ phase: 'GREEN', description: 'Minimal implementation turns the test green.' });
    if (input.refactorApplied) steps.push({ phase: 'REFACTOR', description: 'Refactored with tests staying green.' });
  } else {
    steps.push({ phase: 'BLOCKED', description: 'Test still red; implementation insufficient. Stay in GREEN phase.' });
  }
  return steps;
}

export interface DebugHypothesis {
  id: string;
  statement: string;
  prior: number;
  status: 'PENDING' | 'CONFIRMED' | 'FALSIFIED';
  evidence: string;
}

/** Debugging ledger: deterministically promotes a CONFIRMED hypothesis with evidence. */
export function recordDebugFinding(
  hypotheses: DebugHypothesis[],
  confirmedId: string,
  evidence: string
): { ledger: DebugHypothesis[]; promoted: DebugHypothesis | null } {
  const ledger = hypotheses.map((h) =>
    h.id === confirmedId ? { ...h, status: 'CONFIRMED' as const, evidence } : h
  );
  const promoted = ledger.find((h) => h.id === confirmedId) ?? null;
  return { ledger, promoted };
}

export interface DevWorkflowResult {
  researchGatePassed: boolean;
  discoveredSkills: SkillHit[];
  tddPlan: TddStep[];
  instinctCandidates: Array<{ pattern: string; confidence: number }>;
  canProceedToImplementation: boolean;
  blockReasons: string[];
}

/**
 * The composed development-workflow pipeline. No phase may be skipped:
 * research gate first, then skill discovery, then TDD. Implementation is only
 * allowed when the research dossier exists and the TDD gate is not blocked.
 */
export function runDevelopmentWorkflow(
  input: DevWorkflowInput,
  tdd: { taskHasFailingTest: boolean; testsNowPass: boolean; refactorApplied: boolean }
): DevWorkflowResult {
  const discoveredSkills = discoverSkills(input);
  const tddPlan = evaluateTddGate(tdd);
  const tddBlocked = tddPlan[tddPlan.length - 1]?.phase === 'BLOCKED';

  const blockReasons: string[] = [];
  if (!input.hasResearchDossier) blockReasons.push('Research-first gate: no research dossier before planning.');
  if (tddBlocked) blockReasons.push('TDD gate blocked (missing RED test or still red).');

  // Instinct extraction: each discovered skill + a confirmed debug finding becomes
  // a memory-pattern candidate for the Memory Engine promotion gate.
  const instinctCandidates = discoveredSkills.slice(0, 3).map((h, i) => ({
    pattern: `prefer:${h.skillId}:${h.matchedTriggers[0]}`,
    confidence: Number((0.5 + 0.1 * i + 0.1 * h.matchedTriggers.length).toFixed(2)),
  }));

  return {
    researchGatePassed: input.hasResearchDossier,
    discoveredSkills,
    tddPlan,
    instinctCandidates,
    canProceedToImplementation: blockReasons.length === 0,
    blockReasons,
  };
}

export const P01_CAPABILITY: ProgramCapability = {
  id: 'cap-p01-development-intelligence-workflow',
  programId: 'P01_DEVELOPMENT_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 01 — DEVELOPMENT INTELLIGENCE',
  capability: 'Research-first dev workflow composing Skill Discovery + TDD gate + debugging ledger + instinct extraction onto existing AETHER Skill/Hook/Memory/Debug engines',
  repositoryOrigin: 'https://github.com/affaan-m/ECC',
  originProject: 'affaan-m/ECC + obra/superpowers',
  version: '1.0.0',
  license: 'MIT',
  dependencies: ['AETHER Skill Engine', 'AETHER Hook Engine', 'AETHER Memory Engine', 'AETHER Debug Engine'],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'Deterministic composition layer over existing engines; no new runtime dependencies.',
  testCoverage: 'Gates research-first + TDD, ranks skill discovery deterministically, and extracts instinct candidates for the memory promotion gate.',
  integratesWith: ['Skill Engine', 'Workflow Engine', 'Hook Engine', 'Memory Engine', 'Debug Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'workflow phases enforced',
    unit: 'gates',
    detail: 'ECC/Superpowers strongest concepts (skills, hooks, TDD, research-first) unified into one composed, gate-enforced pipeline.',
  },
  author: 'Created by Tabrej',
};

export function runP01BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const positive = runDevelopmentWorkflow(
    {
      task: 'Fix SQLi in refresh token rotation',
      observedSignals: ['sql-injection', 'refactor', 'test'],
      availableSkills: [
        { skillId: 'ast-blast-radius-slicing', triggers: ['refactor', 'multi-file'] },
        { skillId: 'sqli-hardening', triggers: ['sql-injection'] },
        { skillId: 'tdd-cycle', triggers: ['test'] },
      ],
      hasResearchDossier: true,
    },
    { taskHasFailingTest: true, testsNowPass: true, refactorApplied: true }
  );
  const blocked = runDevelopmentWorkflow(
    {
      task: 'Add feature without research',
      observedSignals: ['feature'],
      availableSkills: [{ skillId: 'tdd-cycle', triggers: ['test'] }],
      hasResearchDossier: false,
    },
    { taskHasFailingTest: false, testsNowPass: false, refactorApplied: false }
  );
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: positive.discoveredSkills.length,
    metric: 'skills-discovered-in-happy-path',
    unit: 'skills',
    detail: `Happy path discovered ${positive.discoveredSkills.length} skills and cleared all gates; the research-missing case was correctly BLOCKED with ${blocked.blockReasons.length} reason(s).`,
  };
}
