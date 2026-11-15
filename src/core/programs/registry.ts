/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — NINE PROGRAM INTEGRATION REGISTRY & LIFECYCLE MANAGER
 * (src/core/programs/registry.ts)
 *
 * The single place that records every external capability with:
 *   provider · capability · repository origin · version · license ·
 *   dependencies · execution method · security profile · resource
 *   requirements · test coverage · benchmark results.
 *
 * Every capability tracks the full controlled lifecycle:
 *   DISCOVER -> INSTALL -> VALIDATE -> REGISTER -> EXECUTE -> MONITOR ->
 *   UPDATE -> REMOVE
 *
 * A capability is registered as EXECUTE only when its program's integration
 * test has been run and reported success; otherwise it stays at REGISTER.
 */

import {
  CAPABILITY_LIFECYCLE,
  CapabilityBenchmarkEvidence,
  CapabilityLifecycleState,
  ProgramCapability,
  ProgramIntegrationResult,
} from './types';
import { P01_CAPABILITY, runP01BenchmarkEvidence } from './p01DevelopmentIntelligence';
import { P02_CAPABILITY, runP02BenchmarkEvidence } from './p02ReverseIntelligence';
import { P03_CAPABILITY, runP03BenchmarkEvidence } from './p03AutonomousExecution';
import { P04_CAPABILITY, runP04BenchmarkEvidence } from './p04MultiAgentOrchestration';
import { P05_CAPABILITY, runP05BenchmarkEvidence } from './p05BrowserIntelligence';
import { P06_CAPABILITY, runP06BenchmarkEvidence } from './p06VisualComputerIntelligence';
import { P07_CAPABILITY, runP07BenchmarkEvidence } from './p07BrowserRuntime';
import { P08_CAPABILITY, runP08BenchmarkEvidence } from './p08WorkspaceKnowledge';
import { P09_CAPABILITY, runP09BenchmarkEvidence } from './p09CreativeVisualIntelligence';
import { P10_CAPABILITY, runP10BenchmarkEvidence } from './p10DeepExecutionIntelligence';
import { P11_CAPABILITY, runP11BenchmarkEvidence } from './p11FullstackEngineeringIntelligence';
import { P12_CAPABILITY, runP12BenchmarkEvidence } from './p12ProjectIntelligence';
import { P13_CAPABILITY, runP13BenchmarkEvidence } from './p13BusinessLogicIntelligence';
import { P14_CAPABILITY, runP14BenchmarkEvidence } from './p14QualityIntelligence';
import { P15_CAPABILITY, runP15BenchmarkEvidence } from './p15EvolutionEngine';
import { P16_CAPABILITY, runP16BenchmarkEvidence } from './p16CalculationEngine';
import { P17_CAPABILITY, runP17BenchmarkEvidence } from './p17WorkflowPatterns';
import { P18_CAPABILITY, runP18BenchmarkEvidence } from './p18HumanWorkflow';
import { P19_CAPABILITY, runP19BenchmarkEvidence } from './p19DesignTaste';
import { P20_CAPABILITY, runP20BenchmarkEvidence } from './p20OrchestrationPlanner';
import { P21_CAPABILITY, runP21BenchmarkEvidence } from './p21DesignSystem';

export interface RegisteredCapability extends ProgramCapability {
  registeredAtIso: string;
  lastMeasuredAtIso: string;
  integrationResult?: ProgramIntegrationResult;
}

export interface UpstreamProvenance {
  repository: string; // canonical URL, verified against the clone's origin remote
  recordedHeadSha: string;
  version: string; // git describe (tag if present, else short SHA)
  license: string; // verified from the repo's own LICENSE file
  recordedOnIso: string;
  isolationMode: 'CONCEPT_REIMPLEMENTATION' | 'OUT_OF_PROCESS_ONLY' | 'REGISTRY_MODEL_ONLY';
  note: string;
}

/**
 * GATE 05: upstream provenance ledger. Every capability's origin repository was
 * shallow-cloned and inspected; the SHA below is the recorded HEAD at
 * inspection time, and the license was read from the repository's own license
 * file (not assumed). Copyleft projects are recorded as OUT_OF_PROCESS_ONLY.
 */
export const UPSTREAM_PROVENANCE: UpstreamProvenance[] = [
  { repository: 'https://github.com/affaan-m/ECC', recordedHeadSha: 'd2ef2680594f9a17526a6e1a2e18b3d242c5d17b', version: 'd2ef268', license: 'MIT', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'skill trigger catalog + hook dedup concepts re-implemented clean-room in P01.' },
  { repository: 'https://github.com/obra/superpowers', recordedHeadSha: '22f0b463e7a5e579904dd6211a520321035526f7', version: 'v7.0.2', license: 'MIT', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'brainstorm→plan→TDD discipline behind P01 gates.' },
  { repository: 'https://github.com/morluto/rea', recordedHeadSha: '5eef239dfd774331d622aaa4762f42fa632121ab', version: '5eef239', license: 'MIT', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'read-only analysis + authorization posture for P02.' },
  { repository: 'https://github.com/All-Hands-AI/OpenHands', recordedHeadSha: 'c26bda84cdc998eeeb99f5052c6aff666fe4aada', version: 'c26bda8', license: 'MIT', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'event-stream resumption re-implemented at step granularity in P03.' },
  { repository: 'https://github.com/FoundationAgents/OpenManus', recordedHeadSha: '3309bf4e416fb1c74b008f3e86494439a31bad53', version: '3309bf4', license: 'MIT', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'plan-and-act loop reference for P03.' },
  { repository: 'https://github.com/microsoft/autogen', recordedHeadSha: 'd07c667a3239ea4ab7af62a53b0f4ff205a1f23d', version: 'd07c667', license: 'MIT (code, LICENSE-CODE) / CC-BY-4.0 (docs)', recordedOnIso: '2026-11-12', isolationMode: 'OUT_OF_PROCESS_ONLY', note: 'ARCHIVED (successor: microsoft/agent-framework). P04 extracts event-bus/group-chat patterns; no dependency.' },
  { repository: 'https://github.com/browser-use/browser-use', recordedHeadSha: '7fdd63c03fd342aab4fe44507c77c3221ffd43c6', version: '7fdd63c', license: 'MIT', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'bounding-box grounding + per-action verification concepts for P05/P06.' },
  { repository: 'https://github.com/vercel-labs/agent-browser', recordedHeadSha: 'f88c40b7ed7c2344af54b804b440b11169f98906', version: 'f88c40b', license: 'Apache-2.0', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'compact [ref] a11y snapshot model for P05.' },
  { repository: 'https://github.com/Skyvern-AI/skyvern', recordedHeadSha: 'a9c7305d8175c78f3bf37b07f7cdc7cbeb3c51f4', version: 'a9c7305', license: 'AGPL-3.0', recordedOnIso: '2026-11-12', isolationMode: 'OUT_OF_PROCESS_ONLY', note: 'AGPL: never linked into the Apache-2.0 core; P06 loop is a clean-room reimplementation.' },
  { repository: 'https://github.com/microsoft/OmniParser', recordedHeadSha: '354021201345a96178360b28733573e27269f2de', version: '3540212', license: 'CC-BY-4.0 (paper/dataset license)', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'GUI element grounding concept re-implemented clean-room in P06.' },
  { repository: 'https://github.com/lightpanda-io/browser', recordedHeadSha: '16ff86bc75ccc20ee90d1f78e1f90eba863e4d9e', version: '16ff86b', license: 'AGPL-3.0-only', recordedOnIso: '2026-11-12', isolationMode: 'OUT_OF_PROCESS_ONLY', note: 'AGPL: out-of-process CDP provider only, never a drop-in; P07 flags capability gaps.' },
  { repository: 'https://github.com/microsoft/playwright', recordedHeadSha: 'bac1f9f67e9cff2a8e7ecbac25d56ec3bb1d15c6', version: 'bac1f9f', license: 'Apache-2.0', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: 'cross-browser provider model behind P07 provider abstraction.' },
  { repository: 'https://github.com/HeyPuter/puter', recordedHeadSha: '33988ac84c5e92fe7578885d6d195c3ddded1303', version: '33988ac', license: 'AGPL-3.0-only', recordedOnIso: '2026-11-12', isolationMode: 'OUT_OF_PROCESS_ONLY', note: 'AGPL: browser-workspace concept only; P08 workspace planning is clean-room.' },
  { repository: 'https://github.com/obsidianmd/obsidian-releases', recordedHeadSha: '5e4864596a3d8b2cd033653297297d619e389d84', version: '5e48645', license: 'registry data (no app source)', recordedOnIso: '2026-11-12', isolationMode: 'REGISTRY_MODEL_ONLY', note: 'public plugin/theme registry model only; no proprietary app source is involved.' },
  { repository: 'https://github.com/Comfy-Org/ComfyUI', recordedHeadSha: 'c5751c81abe131202eea9e4c66d000589013dd0b', version: 'c5751c8', license: 'GPL-3.0', recordedOnIso: '2026-11-12', isolationMode: 'OUT_OF_PROCESS_ONLY', note: 'GPL: P09 node scheduler is a clean-room data model; ComfyUI plugs in out-of-process only.' },
  { repository: 'https://github.com/mrdoob/three.js', recordedHeadSha: '5ec3113785ff183027f320335b1907a4be6bcd0a', version: '5ec3113', license: 'MIT', recordedOnIso: '2026-11-12', isolationMode: 'CONCEPT_REIMPLEMENTATION', note: '3D scene-graph model behind P09 frontend model.' },
];

export interface IntegrationRegistry {
  schemaVersion: string;
  generatedAtIso: string;
  createdCreditedTo: string;
  capabilities: RegisteredCapability[];
  lifecycleStates: Record<string, CapabilityLifecycleState>;
  upstreamProvenance: UpstreamProvenance[];
}

type EvidenceRunner = (args?: unknown[]) => CapabilityBenchmarkEvidence;

export const PROGRAM_CAPABILITIES: ProgramCapability[] = [
  P01_CAPABILITY,
  P02_CAPABILITY,
  P03_CAPABILITY,
  P04_CAPABILITY,
  P05_CAPABILITY,
  P06_CAPABILITY,
  P07_CAPABILITY,
  P08_CAPABILITY,
  P09_CAPABILITY,
  P10_CAPABILITY,
  P11_CAPABILITY,
  P12_CAPABILITY,
  P13_CAPABILITY,
  P14_CAPABILITY,
  P15_CAPABILITY,
  P16_CAPABILITY,
  P17_CAPABILITY,
  P18_CAPABILITY,
  P19_CAPABILITY,
  P20_CAPABILITY,
  P21_CAPABILITY,
];

const EVIDENCE_RUNNERS: Record<string, EvidenceRunner> = {
  'cap-p01-development-intelligence-workflow': () => runP01BenchmarkEvidence(),
  'cap-p02-reverse-intelligence-subsystem': () => runP02BenchmarkEvidence(),
  'cap-p03-resumable-autonomous-execution': () => runP03BenchmarkEvidence(),
  'cap-p04-distributed-agent-orchestration': () => runP04BenchmarkEvidence(),
  'cap-p05-unified-browser-engine': () => runP05BenchmarkEvidence(),
  'cap-p06-visual-computer-loop': () => runP06BenchmarkEvidence(),
  'cap-p07-browser-runtime-provider-abstraction': () => runP07BenchmarkEvidence(),
  'cap-p08-workspace-knowledge-engine': () => runP08BenchmarkEvidence(),
  'cap-p09-creative-intelligence': () => runP09BenchmarkEvidence(),
  'cap-p10-deep-execution-intelligence': () => runP10BenchmarkEvidence(),
  'cap-p11-fullstack-engineering-intelligence': () => runP11BenchmarkEvidence(),
  'cap-p12-project-intelligence-strategy': () => runP12BenchmarkEvidence(),
  'cap-p13-business-logic-intelligence': () => runP13BenchmarkEvidence(),
  'cap-p14-independent-quality-intelligence': () => runP14BenchmarkEvidence(),
  'cap-p15-controlled-evolution-engine': () => runP15BenchmarkEvidence(),
  'cap-p16-universal-calculation-engine': () => runP16BenchmarkEvidence(),
  'cap-p17-business-workflow-patterns': () => runP17BenchmarkEvidence(),
  'cap-p18-human-centered-workflow-intelligence': () => runP18BenchmarkEvidence(),
  'cap-p19-design-taste-layer': () => runP19BenchmarkEvidence(),
  'cap-p20-orchestration-planner': () => runP20BenchmarkEvidence(),
  'cap-p21-design-system-generator': () => runP21BenchmarkEvidence(),
};

export function getEvidenceRunner(id: string): EvidenceRunner | undefined {
  return EVIDENCE_RUNNERS[id];
}

/**
 * Build the live registry. For each capability it runs the program's
 * integration evidence (EXECUTE stage) and promotes the lifecycle state to
 * EXECUTE only when the run succeeded; unmeasured/external-backend caps
 * remain at REGISTER with an explicit UNMEASURED benchmark slot.
 */
export function buildIntegrationRegistry(): IntegrationRegistry {
  const nowIso = new Date().toISOString();
  const lifecycleStates: Record<string, CapabilityLifecycleState> = {};
  const capabilities: RegisteredCapability[] = [];

  for (const cap of PROGRAM_CAPABILITIES) {
    const runner = EVIDENCE_RUNNERS[cap.id];
    const evidence = runner ? runner() : cap.benchmarkEvidence;

    const integrated =
      evidence.status === 'MEASURED_DETERMINISTIC_EXECUTION' || evidence.status === 'MEASURED_WALL_CLOCK_EXECUTION';

    const state: CapabilityLifecycleState = integrated ? 'EXECUTE' : cap.lifecycleState;
    lifecycleStates[cap.id] = state;

    capabilities.push({
      ...cap,
      benchmarkEvidence: evidence,
      lifecycleState: state,
      registeredAtIso: nowIso,
      lastMeasuredAtIso: nowIso,
      integrationResult: {
        programId: cap.programId,
        executed: true,
        success: integrated,
        capabilityId: cap.id,
        evidence,
        log: [evidence.detail],
        enginesTouched: cap.integratesWith,
      },
    });
  }

  return {
    schemaVersion: '1.0.0',
    generatedAtIso: nowIso,
    createdCreditedTo: 'Tabrej (https://github.com/Tabrej96)',
    capabilities,
    lifecycleStates,
    upstreamProvenance: UPSTREAM_PROVENANCE,
  };
}

/**
 * Advance a capability to a later lifecycle stage. Only forward movement along
 * CAPABILITY_LIFECYCLE is allowed; jumping past EXECUTE without a measured
 * evidence run is rejected (you cannot MONITOR a capability that never ran).
 */
export function advanceLifecycle(
  current: CapabilityLifecycleState,
  target: CapabilityLifecycleState,
  options: { measured?: boolean } = {}
): { allowed: boolean; next: CapabilityLifecycleState; reason: string } {
  const ci = CAPABILITY_LIFECYCLE.indexOf(current);
  const ti = CAPABILITY_LIFECYCLE.indexOf(target);
  if (ti <= ci) {
    return { allowed: false, next: current, reason: `Lifecycle only advances forward (${current} -> ${target} not forward).` };
  }
  if (ti > CAPABILITY_LIFECYCLE.indexOf('EXECUTE') && !options.measured) {
    return {
      allowed: false,
      next: current,
      reason: `Cannot advance past EXECUTE to ${target} without a measured execution (no benchmark evidence).`,
    };
  }
  return { allowed: true, next: target, reason: `Advanced ${current} -> ${target}.` };
}

/**
 * Validate the whole registry: all program capabilities with full provenance.
 * There are 21: nine upstream-research programs (P01–P09) plus P10–P21 —
 * first-party operator / SUPREME EVOLUTION directives (their
 * `repositoryOrigin` is the directive itself, not a URL — that is correct,
 * not a gap).
 */
export function auditRegistry(registry: IntegrationRegistry): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (registry.capabilities.length !== 21) errors.push(`Expected 21 program capabilities, found ${registry.capabilities.length}`);
  const required: Array<keyof ProgramCapability> = [
    'id',
    'repositoryOrigin',
    'originProject',
    'version',
    'license',
    'dependencies',
    'executionMethod',
    'securityProfile',
    'resourceRequirements',
    'testCoverage',
    'integratesWith',
    'benchmarkEvidence',
    'author',
  ];
  for (const cap of registry.capabilities) {
    for (const field of required) {
      if (cap[field] === undefined || cap[field] === null || cap[field] === '') {
        errors.push(`Capability ${cap.id} missing required field ${String(field)}`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}
