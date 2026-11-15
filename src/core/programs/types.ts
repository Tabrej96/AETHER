/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — NINE ADVANCED CAPABILITY RESEARCH PROGRAMS
 * Shared program contracts (src/core/programs/types.ts)
 * Created by Tabrej.
 *
 * These are the stable integration contracts through which all nine research
 * programs plug into the existing AETHER engines (Skill, Workflow, Hook,
 * Memory, Swarm, MCP, Model Router, Continuity, Security, Validation).
 *
 * A capability is "integrated" in AETHER ONLY when it:
 *   1. is reachable through an AETHER interface (engine export or MCP tool),
 *   2. executes real, deterministic work (not a downloaded-but-inert blob),
 *   3. handles failure safely (no fabricated results; explicit UNMEASURED),
 *   4. passes its integration test.
 */

export type ProgramId =
  | 'P01_DEVELOPMENT_INTELLIGENCE'
  | 'P02_REVERSE_INTELLIGENCE'
  | 'P03_AUTONOMOUS_EXECUTION'
  | 'P04_MULTI_AGENT_ORCHESTRATION'
  | 'P05_BROWSER_INTELLIGENCE'
  | 'P06_VISUAL_COMPUTER_INTELLIGENCE'
  | 'P07_BROWSER_RUNTIME'
  | 'P08_WORKSPACE_KNOWLEDGE'
  | 'P09_CREATIVE_VISUAL_INTELLIGENCE'
  | 'P10_DEEP_EXECUTION_INTELLIGENCE'
  | 'P11_FULLSTACK_ENGINEERING_INTELLIGENCE'
  | 'P12_PROJECT_INTELLIGENCE'
  | 'P13_BUSINESS_LOGIC_INTELLIGENCE'
  | 'P14_INDEPENDENT_QUALITY_INTELLIGENCE'
  | 'P15_CONTROLLED_EVOLUTION_ENGINE'
  | 'P16_UNIVERSAL_CALCULATION_ENGINE'
  | 'P17_BUSINESS_WORKFLOW_PATTERNS'
  | 'P18_HUMAN_CENTERED_WORKFLOW_INTELLIGENCE'
  | 'P19_DESIGN_TASTE_LAYER'
  | 'P20_ORCHESTRATION_PLANNER'
  | 'P21_DESIGN_SYSTEM_GENERATOR';

/**
 * The controlled lifecycle every external capability must traverse.
 * A capability that merely has "files downloaded" sits at DISCOVER only and
 * is NOT counted as integrated.
 */
export type CapabilityLifecycleState =
  | 'DISCOVER'
  | 'INSTALL'
  | 'VALIDATE'
  | 'REGISTER'
  | 'EXECUTE'
  | 'MONITOR'
  | 'UPDATE'
  | 'REMOVE';

export const CAPABILITY_LIFECYCLE: readonly CapabilityLifecycleState[] = [
  'DISCOVER',
  'INSTALL',
  'VALIDATE',
  'REGISTER',
  'EXECUTE',
  'MONITOR',
  'UPDATE',
  'REMOVE',
] as const;

export type ExecutionMethod =
  | 'NATIVE_IN_PROCESS' // permissive license, pure TS/WASM, safe to run inside AETHER
  | 'OUT_OF_PROCESS_HTTP' // AGPL/GPL/BSL server or foreign-runtime tool
  | 'OUT_OF_PROCESS_CDP' // Chromium DevTools Protocol browser backend
  | 'EXTERNAL_CLI'; // user-installed binary or interpreter

export type SecurityProfile =
  | 'READ_ONLY_ANALYSIS'
  | 'AUTHORIZED_TARGET_ONLY' // reverse-engineering gate: only user-owned / authorized software
  | 'WORKSPACE_ISOLATED' // sandboxed file + process isolation
  | 'NETWORK_EGRESS_CONTROLLED'
  | 'APPROVAL_GATED_WRITES';

/** Evidence a capability's benchmark is real and not fabricated. */
export type BenchmarkEvidenceStatus =
  | 'MEASURED_DETERMINISTIC_EXECUTION'
  | 'MEASURED_WALL_CLOCK_EXECUTION'
  | 'UNMEASURED_REQUIRES_EXTERNAL_BACKEND'
  | 'UNMEASURED_REQUIRES_LLM_ENDPOINT'
  | 'NOT_APPLICABLE';

export interface CapabilityBenchmarkEvidence {
  status: BenchmarkEvidenceStatus;
  /** measured number, or null when UNMEASURED_* (never fabricated) */
  measuredValue: number | null;
  metric: string;
  unit: string;
  detail: string;
  /** The exact command / setup required to produce a real measurement, when unmeasured */
  externalCommandToMeasure?: string;
}

/**
 * A single AETHER-native capability produced by one of the nine research
 * programs. Each carries full provenance so the integration registry can
 * record where it came from, how it is isolated, and how to verify it.
 */
export interface ProgramCapability {
  id: string;
  programId: ProgramId;
  programName: string;
  capability: string;
  /** canonical upstream repository the capability was researched from */
  repositoryOrigin: string;
  originProject: string;
  version: string;
  license: string;
  dependencies: string[];
  executionMethod: ExecutionMethod;
  securityProfile: SecurityProfile;
  resourceRequirements: string;
  testCoverage: string;
  /** which existing AETHER engine this capability plugs into */
  integratesWith: string[];
  lifecycleState: CapabilityLifecycleState;
  benchmarkEvidence: CapabilityBenchmarkEvidence;
  author: string;
}

export interface ProgramDefinition {
  programId: ProgramId;
  programName: string;
  objective: string;
  researchedRepositories: Array<{ url: string; owner: string; license: string }>;
  summary: string;
}

export interface ProgramIntegrationResult {
  programId: ProgramId;
  executed: boolean;
  success: boolean;
  capabilityId: string;
  evidence: CapabilityBenchmarkEvidence;
  log: string[];
  /** AETHER engine(s) that were exercised during the integration test */
  enginesTouched: string[];
}
