/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Core Type Definitions for the AETHER 100x AI Engineering Harness
 */

export type CapabilityClassification =
  | 'Equivalent'
  | 'Improved'
  | 'Fundamentally Redesigned'
  | 'New Capability';

export interface CompetitiveComparisonItem {
  id: string;
  domain: string;
  eccCapability: string;
  eccLimitation: string;
  aetherApproach: string;
  classification: CapabilityClassification;
  measuredImpact: string;
  systemModule: string;
}

export interface RepoFileNode {
  path: string;
  language: 'typescript' | 'python' | 'go' | 'rust' | 'sql' | 'json' | 'markdown';
  tokens: number;
  exports: string[];
  imports: string[];
  coChangePaths: string[];
  isTest?: boolean;
  isGenerated?: boolean;
  isPublicApi?: boolean;
  hasDbSchema?: boolean;
  lastModifiedHash: string;
  contentPreview: string;
}

export type ContextCompressionTier = 'FULL_SOURCE' | 'SIGNATURE_SKELETON' | 'SUMMARY_HEADER' | 'EVICTED';

export interface RankedContextFile {
  path: string;
  relevanceScore: number;
  compressionTier: ContextCompressionTier;
  originalTokens: number;
  allocatedTokens: number;
  reason: string;
}

export interface ContextSliceResult {
  taskComplexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  budgetTokens: number;
  usedTokens: number;
  rawTotalTokens: number;
  tokenSavingsPercent: number;
  rankedFiles: RankedContextFile[];
  missingContextWarnings: string[];
  preventedPollutions: string[];
  preservedDecisions: string[];
}

export interface AgentSpec {
  id: string;
  name: string;
  category: 'architecture' | 'implementation' | 'adversarial' | 'debugging' | 'security' | 'memory' | 'verification';
  role: string;
  scope: string;
  responsibilities: string[];
  restrictions: string[];
  inputs: string[];
  outputs: string[];
  handoffRules: string[];
  verificationResponsibilities: string[];
  capabilities: string[];
  tokenOverhead: number;
  license: string;
  attribution: string;
}

export interface SkillSpec {
  id: string;
  name: string;
  domain: string;
  whenToActivate: string;
  requiredInformation: string[];
  executionSteps: string[];
  usefulTools: string[];
  expectedOutputs: string[];
  verificationCriteria: string[];
  failureCasesToHandle: string[];
  tokenCost: number;
  license: string;
  attribution: string;
}

export interface WorkflowStage {
  stageNumber: number;
  name: string;
  assignedAgentId: string;
  description: string;
  requiredOutputs: string[];
}

export interface WorkflowSpec {
  id: string;
  name: string;
  entryConditions: string[];
  executionStages: WorkflowStage[];
  dependencies: string[];
  failureHandling: string[];
  completionCriteria: string[];
  license: string;
  attribution: string;
}

export interface RuleSpec {
  id: string;
  name: string;
  scopeGlob: string;
  category: 'language' | 'architecture' | 'security' | 'performance';
  invariants: string[];
  autofixCommand?: string;
  tokenCost: number;
  license: string;
  attribution: string;
}

export interface SwarmTaskNode {
  taskId: string;
  title: string;
  assignedAgentId: string;
  assignedAgentName: string;
  dependsOn: string[];
  exclusiveFileLeases: string[];
  parallelGroup: number;
  verificationGate: string;
}

export interface SwarmFormationResult {
  taskComplexityIndex: number;
  executionMode: 'SINGLE_AGENT_FAST_PATH' | 'DYAD_IMPLEMENTATION_AND_CRITIC' | 'DAG_SWARM_TOPOLOGY';
  rationale: string;
  selectedAgents: AgentSpec[];
  dagNodes: SwarmTaskNode[];
  conflictLocksGuaranteed: boolean;
  consensusProtocol: string;
}

export interface BlastRadiusNode {
  path: string;
  hopDistance: number;
  impactType: 'DIRECT_MUTATION' | 'SIGNATURE_CALLER' | 'API_CONTRACT_CONSUMER' | 'DB_SCHEMA_DEPENDENT' | 'TEST_TARGET';
  riskScore: number;
  affectedSymbols: string[];
}

export interface PredictiveImpactResult {
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  affectedNodes: BlastRadiusNode[];
  apiContractBreakRisk: boolean;
  dbMigrationRequired: boolean;
  targetedVerificationPlan: string[];
}

export type ChallengerRole =
  | 'Architecture Challenger'
  | 'Code Breaker'
  | 'Security Attacker'
  | 'Performance Critic'
  | 'Regression Investigator'
  | 'Independent Reviewer';

export interface AdversarialFinding {
  challenger: ChallengerRole;
  severity: 'BLOCKER' | 'HIGH' | 'MEDIUM' | 'PASS';
  category: string;
  claim: string;
  counterexampleOrReproducer: string;
  remediationRequired: string;
}

export interface AdversarialAuditResult {
  passedGate: boolean;
  blockerCount: number;
  highCount: number;
  findings: AdversarialFinding[];
  consensusVerdict: string;
}

export type MemoryLayer =
  | 'SESSION_MEMORY'
  | 'PROJECT_MEMORY'
  | 'ARCHITECTURAL_MEMORY'
  | 'OPERATIONAL_MEMORY'
  | 'VERIFIED_KNOWLEDGE'
  | 'FAILURE_MEMORY'
  | 'REUSABLE_PATTERNS';

export type VerificationState = 'VERIFIED' | 'QUARANTINED_CANDIDATE' | 'STALE_REVALIDATION_REQUIRED' | 'FALSIFIED';

export interface MemoryRecord {
  id: string;
  layer: MemoryLayer;
  title: string;
  statement: string;
  provenanceTask: string;
  boundFilePaths: string[];
  boundFileHash: string;
  confidence: number;
  relevanceScore: number;
  timestampIso: string;
  verificationState: VerificationState;
  version: number;
  successfulApplications: number;
}
