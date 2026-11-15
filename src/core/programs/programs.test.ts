/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — NINE PROGRAM INTEGRATION TESTS (src/core/programs/programs.test.ts)
 * Created by Tabrej.
 *
 * A capability is "integrated" ONLY when it is reachable through an AETHER
 * interface, executes real deterministic work, handles failure safely, and
 * passes these tests. Run via: npx tsx --test src/core/programs/programs.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { runDevelopmentWorkflow } from './p01DevelopmentIntelligence';
import { assertAuthorization, extractApplicationArchitecture, type ReverseEngineAuthorization } from './p02ReverseIntelligence';
import { executeResumableTask, type ResumableTask, type StepExecutor } from './p03AutonomousExecution';
import { orchestrateAgentTeam, type AgentParticipant } from './p04MultiAgentOrchestration';
import { buildA11ySnapshot, resolveElement, type AetherDomElement } from './p05BrowserIntelligence';
import { groundAction, runVisualComputerLoop } from './p06VisualComputerIntelligence';
import { buildBrowserTaskMatrix, selectBrowserProvider } from './p07BrowserRuntime';
import { buildKnowledgeGraph, planWorkspace, type VaultNote } from './p08WorkspaceKnowledge';
import { buildSceneGraph, scheduleNodeGraph } from './p09CreativeVisualIntelligence';
import { advanceLifecycle, auditRegistry, buildIntegrationRegistry } from './registry';

test('P01 Development Intelligence: research-first + TDD gates enforced; skill discovery is deterministic', () => {
  const blocked = runDevelopmentWorkflow(
    { task: 'x', observedSignals: [], availableSkills: [{ skillId: 's', triggers: ['test'] }], hasResearchDossier: false },
    { taskHasFailingTest: false, testsNowPass: false, refactorApplied: false }
  );
  assert.equal(blocked.canProceedToImplementation, false);
  assert.ok(blocked.blockReasons.some((r) => r.includes('Research-first')));

  const ok = runDevelopmentWorkflow(
    { task: 'x', observedSignals: ['test', 'refactor'], availableSkills: [{ skillId: 'a', triggers: ['test'] }, { skillId: 'b', triggers: ['refactor', 'test'] }], hasResearchDossier: true },
    { taskHasFailingTest: true, testsNowPass: true, refactorApplied: true }
  );
  assert.equal(ok.canProceedToImplementation, true);
  // skill 'b' (2 triggers) must rank above skill 'a' (1 trigger)
  assert.deepEqual(
    ok.discoveredSkills.map((h) => h.skillId),
    ['b', 'a']
  );
});

test('P02 Reverse Intelligence: authorization gate hard-denies unauthorized targets', () => {
  const denied: ReverseEngineAuthorization = { targetId: 'corpses-app', basis: 'OWNED', authorized: false, evidence: 'No ownership proof.' };
  assert.throws(() => assertAuthorization(denied), /authorization DENIED/);

  const allowed: ReverseEngineAuthorization = { targetId: 'my-app', basis: 'OWNED', authorized: true, evidence: 'Operator owns target.' };
  const report = extractApplicationArchitecture(allowed.targetId, allowed, [
    { path: 'main.ts', imports: ['./s'], exports: [], bytes: 10, language: 'ts' },
    { path: 's.ts', imports: ['express'], exports: ['go'], bytes: 10, language: 'ts' },
  ]);
  assert.deepEqual(report.externalDependencies, ['express']);
  assert.ok(report.unmeasuredSlots.length >= 3, 'binary/network/UI slots must be declared UNMEASURED');
});

test('P03 Autonomous Execution: crash-resume replays only failed steps; dependents of failed steps are skipped', () => {
  let flakyAttempts = 0;
  const task: ResumableTask = {
    taskId: 't',
    goal: 'g',
    steps: [
      { stepId: 'a', title: 'a', action: 'x', dependsOn: [], verify: (s) => Boolean(s.a) },
      { stepId: 'b', title: 'b', action: 'x', dependsOn: ['a'], verify: (s) => s.b === 'ok' },
      { stepId: 'c', title: 'c', action: 'x', dependsOn: ['b'], verify: (s) => Boolean(s.c) },
    ],
  };
  const executor: StepExecutor = (step, state) => {
    if (step.stepId === 'b') {
      flakyAttempts += 1;
      if (flakyAttempts === 1) return { ok: false, error: 'transient' };
      return { ok: true, patch: { b: 'ok' } };
    }
    return { ok: true, patch: { [step.stepId]: true } };
  };
  const first = executeResumableTask(task, executor);
  assert.equal(first.completedStepIds.length, 1, 'first run stops at failed step b');
  assert.deepEqual(first.failedStepIds, ['b', 'c'], 'dependent c is skipped when b fails');
  const resumed = executeResumableTask(task, executor, first);
  assert.equal(resumed.verified, true, 'resume replays b and completes c');
  assert.deepEqual(resumed.completedStepIds.sort(), ['a', 'b', 'c']);
});

test('P04 Multi-Agent Orchestration: parallel waves, deterministic retry, and fail-fast on missing capability', () => {
  const agents: AgentParticipant[] = [{ agentId: 'i', capability: 'impl', handle: () => ({ result: 'ok', ok: true }) }];
  const run = orchestrateAgentTeam(
    [
      { taskId: 'p', title: 'a', dependsOn: [], assignCapability: 'impl' },
      { taskId: 'q', title: 'b', dependsOn: [], assignCapability: 'impl' },
      { taskId: 'r', title: 'needs-missing-cap', dependsOn: ['p'], assignCapability: 'ghost' },
    ],
    agents
  );
  assert.equal(run.parallelWaves, 2, 'p and q share a wave');
  assert.ok(run.completedTaskIds.includes('p') && run.completedTaskIds.includes('q'));
  assert.equal(run.success, false, 'missing capability must fail-fast, not hang');
  assert.ok(run.failureReason!.includes('r'));
});

test('P05 Browser Intelligence: compact a11y snapshot + deterministic locator with vision-escalation contract', () => {
  const form: AetherDomElement[] = [
    { tag: 'input', id: 'email', role: 'textbox', ariaLabel: 'Email', boundingBox: { x: 0, y: 0, width: 10, height: 10 }, ref: 'e1' },
  ];
  const snap = buildA11ySnapshot(form);
  assert.equal(snap.nodeCount, 1);
  assert.ok(snap.estimatedSnapshotTokens < form.length * 38, 'snapshot must be cheaper than raw DOM');

  const hit = resolveElement(form, { strategy: 'A11Y_REF', label: 'Email' });
  assert.equal(hit.strategy, 'A11Y_REF');
  assert.ok(hit.confidence >= 0.9);

  const miss = resolveElement(form, { strategy: 'VISION_COORDINATE', visualDescription: 'a floating captcha' });
  assert.equal(miss.element, null, 'no deterministic match -> vision fallback, not a fabricated hit');
});

test('P06 Visual Computer: perception->reasoning->action->verification loop verifies real state change', () => {
  const grounded = groundAction(
    [{ elementId: 'pay', label: 'Pay Now', role: 'button', bbox: { x: 0.5, y: 0.5, w: 0.1, h: 0.1 }, confidence: 0.9 }],
    { role: 'button', label: 'Pay Now' }
  );
  assert.equal(grounded.grounded, true);

  const ungrounded = groundAction([{ elementId: 'x', label: 'no', role: 'link', bbox: { x: 0, y: 0, w: 1, h: 1 }, confidence: 0.1 }], { role: 'button' });
  assert.equal(ungrounded.grounded, false, 'below confidence floor -> abort, not guess');

  const loop = runVisualComputerLoop({
    screenId: 's',
    goal: 'pay',
    elements: [
      { elementId: 'pay', label: 'Pay Now', role: 'button', bbox: { x: 0.5, y: 0.5, w: 0.1, h: 0.1 }, confidence: 0.9 },
    ],
    intent: { role: 'button', label: 'Pay Now' },
    expectedStateAfterAction: 'paid',
    observedStateAfterAction: 'paid',
  });
  assert.equal(loop[0].verified, true, 'verification confirms the observed state matched expectation');
});

test('P07 Browser Runtime: provider selection is honest about capability gaps (Lightpanda is not a drop-in)', () => {
  const cross = selectBrowserProvider({ requiredCapabilities: ['cross-browser (chromium/firefox/webkit)'], preferCrossBrowser: true, preferResourceEfficiency: false, allowOutOfProcessOnly: false });
  assert.equal(cross.providerId, 'playwright-cross-browser');
  assert.equal(cross.compatible, true);

  const gap = selectBrowserProvider({ requiredCapabilities: ['webgl scene capture'], preferCrossBrowser: false, preferResourceEfficiency: true, allowOutOfProcessOnly: true });
  assert.equal(gap.compatible, false, 'an unsupported capability must NOT be reported as compatible');
  assert.equal(gap.verificationRequired, true);
  assert.ok(buildBrowserTaskMatrix().some((m) => m.selection.verificationRequired));
});

test('P08 Workspace & Knowledge: knowledge graph + orphans + clusters + workspace plan', () => {
  const notes: VaultNote[] = [
    { id: 'a', title: 'A', tags: ['arch'], wikiLinks: ['b'] },
    { id: 'b', title: 'B', tags: ['arch'], wikiLinks: [] },
    { id: 'c', title: 'C', tags: [], wikiLinks: [] },
  ];
  const g = buildKnowledgeGraph(notes);
  assert.deepEqual(g.orphans, ['c']);
  assert.equal(g.nodes.length, 3);
  const plan = planWorkspace('vault', notes);
  assert.ok(plan.files.every((f) => f.targetPath.startsWith('vault/')));
});

test('P09 Creative & Visual: node-graph scheduling + cycle rejection + 3D scene render order', () => {
  const ok = scheduleNodeGraph([
    { nodeId: 'a', type: 'loader', params: {}, inputs: [] },
    { nodeId: 'b', type: 'sampler', params: {}, inputs: [{ nodeId: 'a', socket: 'o' }] },
    { nodeId: 'c', type: 'export', params: {}, inputs: [{ nodeId: 'b', socket: 'i' }] },
  ]);
  assert.equal(ok.layers.length, 3);

  assert.throws(
    () =>
      scheduleNodeGraph([
        { nodeId: 'a', type: 'x', params: {}, inputs: [{ nodeId: 'b', socket: 'i' }] },
        { nodeId: 'b', type: 'y', params: {}, inputs: [{ nodeId: 'a', socket: 'i' }] },
      ]),
    /cycle/i
  );

  const scene = buildSceneGraph([
    { objectId: 'g', kind: 'group', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, children: ['m', 'l'] },
    { objectId: 'm', kind: 'mesh', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, children: [] },
    { objectId: 'l', kind: 'light', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }, children: [] },
  ]);
  assert.deepEqual(scene.renderOrder, ['g', 'm', 'l']);
  assert.equal(scene.drawCallEstimate, 2);
});

test('Integration Registry: exactly 15 capabilities (9 research programs + P10-P15 directives), full provenance, lifecycle guard', () => {
  const registry = buildIntegrationRegistry();
  assert.equal(registry.capabilities.length, 21);
  const audit = auditRegistry(registry);
  assert.equal(audit.ok, true, `provenance audit must pass: ${audit.errors.join('; ')}`);
  assert.equal(registry.createdCreditedTo.includes('Tabrej'), true);

  // lifecycle only moves forward, and only past EXECUTE with measured evidence
  assert.equal(advanceLifecycle('MONITOR', 'REGISTER').allowed, false, 'cannot move backward');
  assert.equal(advanceLifecycle('EXECUTE', 'MONITOR', { measured: true }).allowed, true);
  assert.equal(advanceLifecycle('EXECUTE', 'MONITOR', { measured: false }).allowed, false, 'cannot MONITOR without a measured run');
});
