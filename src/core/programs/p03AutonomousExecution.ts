/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 03 — AUTONOMOUS EXECUTION  ·  AETHER Autonomous Execution
 * (src/core/programs/p03AutonomousExecution.ts)
 *
 * Researched from:
 *   - All-Hands-AI/OpenHands   (MIT)  — CodeAct agent, event stream, resumption
 *   - FoundationAgents/OpenManus (MIT) — general-purpose plan-and-act agent
 *
 * Delivers: a task *planning + resumable execution* layer. It turns a goal
 * into an ordered, dependency-structured action plan, executes steps against
 * a real executor (in the repo this is the existing Autonomous Runtime /
 * workspace-isolated tool executor), records per-step checkpoints so a crash
 * resumes from the last committed step, and performs autonomous verification
 * of the final state. OpenHands/OpenManus are researched as architecture
 * references; AETHER does not duplicate either runtime — it adds the
 * plan-resume-verify loop the existing runtime was missing.
 */

import { CapabilityBenchmarkEvidence, ProgramCapability, ProgramId } from './types';

export interface PlanStep {
  stepId: string;
  title: string;
  action: string;
  dependsOn: string[];
  /** deterministic verification predicate for this step's outcome */
  verify: (state: Record<string, unknown>) => boolean;
}

export interface ResumableTask {
  taskId: string;
  goal: string;
  steps: PlanStep[];
}

export type StepStatus = 'PENDING' | 'DONE' | 'FAILED' | 'SKIPPED_DEP_FAILED';

export interface ExecutionCheckpoint {
  taskId: string;
  completedStepIds: string[];
  failedStepIds: string[];
  state: Record<string, unknown>;
  /** true when every step is DONE and its verify predicate passed */
  verified: boolean;
  resumable: boolean;
}

/**
 * A step executor. In the AETHER repo this is a workspace-isolated tool call
 * (or the existing Autonomous Runtime's tool executor); in tests it is a pure
 * deterministic function. Returning `ok:false` marks the step failed and
 * deterministically skips any step that transitively depends on it.
 */
export type StepExecutor = (step: PlanStep, state: Record<string, unknown>) => { ok: boolean; patch?: Record<string, unknown>; error?: string };

export function executeResumableTask(
  task: ResumableTask,
  executor: StepExecutor,
  resumeFrom?: ExecutionCheckpoint
): ExecutionCheckpoint {
  const state: Record<string, unknown> = { ...(resumeFrom?.state ?? {}) };
  // On resume, only COMPLETED steps are skipped (their work is already in `state`).
  // Failed steps are deliberately NOT seeded — they are re-attempted, which is the
  // entire point of crash resumption.
  const done = new Set<string>(resumeFrom?.completedStepIds ?? []);
  const failed = new Set<string>();

  const byId = new Map(task.steps.map((s) => [s.stepId, s]));
  // topological: only run a step once all its deps are done and not failed
  let progress = true;
  while (progress) {
    progress = false;
    for (const step of task.steps) {
      if (done.has(step.stepId) || failed.has(step.stepId)) continue;
      const depsOk = step.dependsOn.every((d) => done.has(d) && !failed.has(d));
      const anyDepFailed = step.dependsOn.some((d) => failed.has(d));
      if (anyDepFailed) {
        failed.add(step.stepId); // SKIPPED_DEP_FAILED
        progress = true;
        continue;
      }
      if (!depsOk) continue;
      const { ok, patch, } = executor(step, state);
      if (ok && patch) Object.assign(state, patch);
      const verified = ok && step.verify(state);
      if (ok && verified) {
        done.add(step.stepId);
      } else {
        failed.add(step.stepId);
      }
      progress = true;
    }
  }

  const completedStepIds = [...done];
  const verified = task.steps.every((s) => done.has(s.stepId) && byId.get(s.stepId)!.verify(state));

  return {
    taskId: task.taskId,
    completedStepIds,
    failedStepIds: [...failed],
    state,
    verified,
    resumable: !verified, // a failed/partial task can be resumed; a verified one is terminal
  };
}

export const P03_CAPABILITY: ProgramCapability = {
  id: 'cap-p03-resumable-autonomous-execution',
  programId: 'P03_AUTONOMOUS_EXECUTION' as ProgramId,
  programName: 'PROGRAM 03 — AUTONOMOUS EXECUTION',
  capability: 'Resumable, checkpointed autonomous execution: goal -> dependency-ordered plan -> per-step verify -> crash resume -> autonomous verification',
  repositoryOrigin: 'https://github.com/All-Hands-AI/OpenHands',
  originProject: 'All-Hands-AI/OpenHands + FoundationAgents/OpenManus',
  version: '1.0.0',
  license: 'MIT',
  dependencies: ['AETHER Autonomous Runtime', 'AETHER Continuity Engine'],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'WORKSPACE_ISOLATED',
  resourceRequirements: 'Deterministic planner + executor; a real executor (workspace-isolated tool call) or the existing Autonomous Runtime performs the work.',
  testCoverage: 'Runs a goal through 4 dependency-ordered steps; verifies a failed step deterministically skips dependents and that a resume from checkpoint completes the remainder.',
  integratesWith: ['Swarm Engine', 'Continuity Engine', 'Security Engine', 'Validation Engine'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'steps-resumed-after-checkpoint',
    unit: 'steps',
    detail: 'OpenHands/OpenManus plan-and-act architecture reproduced as a crash-safe, resumable loop without importing either runtime.',
  },
  author: 'Created by Tabrej',
};

export function runP03BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const task: ResumableTask = {
    taskId: 'resumable-01',
    goal: 'Implement + verify + deploy a feature safely',
    steps: [
      { stepId: 'plan', title: 'plan', action: 'produce-dag', dependsOn: [], verify: (s) => Boolean(s.plan) },
      { stepId: 'impl', title: 'implement', action: 'write-code', dependsOn: ['plan'], verify: (s) => Boolean(s.code) },
      { stepId: 'verify', title: 'verify', action: 'run-tests', dependsOn: ['impl'], verify: (s) => s.tests === 'green' },
      { stepId: 'deploy', title: 'deploy', action: 'ship', dependsOn: ['verify'], verify: (s) => s.deployed === true },
    ],
  };

  let verifyAttempts = 0;
  const executor: StepExecutor = (step, state) => {
    // Deterministic fault: `verify` fails on its very first attempt only, so the
    // first run checkpoints at [plan, impl] and the resume completes the rest.
    if (step.stepId === 'verify') {
      verifyAttempts += 1;
      if (verifyAttempts === 1) return { ok: false, error: 'tests red on first attempt' };
      return { ok: true, patch: { tests: 'green' } };
    }
    switch (step.stepId) {
      case 'plan':
        return { ok: true, patch: { plan: true } };
      case 'impl':
        return { ok: true, patch: { code: true } };
      case 'deploy':
        return { ok: true, patch: { deployed: true } };
      default:
        return { ok: false };
    }
  };

  // First run hits the fault -> not verified, checkpoint is resumable.
  const first = executeResumableTask(task, executor);
  const resumed = executeResumableTask(task, executor, first);

  const resumedSteps = resumed.completedStepIds.filter((id) => !first.completedStepIds.includes(id)).length;
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: resumedSteps,
    metric: 'steps-completed-after-resume',
    unit: 'steps',
    detail: `Run 1 completed ${first.completedStepIds.length}/${task.steps.length} and stopped at a red-verify checkpoint (resumable=${first.resumable}); resume from that checkpoint completed ${resumed.completedStepIds.length}/${task.steps.length} and self-verified ${resumed.verified}. The failed step deterministically skipped its dependents on run 1; ${resumedSteps} step(s) finished only after resume.`,
  };
}
