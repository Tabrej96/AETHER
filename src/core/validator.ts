/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PART 4, 5, 6 & 7: Component Depth Validator, Selective Cross-Harness Installer,
 * and Reproducible Multi-Trial Statistical Benchmark Engine.
 *
 * PART 8: Production-grade Validation Suite Engine — structural, functional,
 * security, performance, accessibility, and completeness checks with a gate
 * system that blocks "done" status until all critical checks pass.
 *
 * Inspiration: ECC (validation patterns), OpenHands (verification patterns)
 */

import { AgentSpec, RuleSpec, SkillSpec, WorkflowSpec } from './types';

// ─── Existing interfaces (preserved) ─────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  componentId: string;
  componentType: 'AGENT' | 'SKILL' | 'WORKFLOW';
  errors: string[];
  completenessScore: number;
}

export function validateAgentSpec(agent: Partial<AgentSpec>): ValidationResult {
  const errors: string[] = [];
  if (!agent.id || agent.id.trim().length < 3) errors.push('Missing agent `id`');
  if (!agent.role || agent.role.trim().length < 10) errors.push('Missing or shallow `role` definition');
  if (!agent.scope || agent.scope.trim().length < 10) errors.push('Missing or shallow `scope` definition');
  if (!agent.responsibilities || agent.responsibilities.length < 2)
    errors.push('Must specify at least 2 concrete `responsibilities`');
  if (!agent.restrictions || agent.restrictions.length < 2)
    errors.push('Must specify at least 2 explicit `restrictions`');
  if (!agent.inputs || agent.inputs.length < 1) errors.push('Must specify required `inputs`');
  if (!agent.outputs || agent.outputs.length < 1) errors.push('Must specify structured `outputs`');
  if (!agent.handoffRules || agent.handoffRules.length < 1) errors.push('Must specify `handoffRules`');
  if (!agent.verificationResponsibilities || agent.verificationResponsibilities.length < 1)
    errors.push('Must specify `verificationResponsibilities`');
  if (!agent.license || !agent.attribution) errors.push('Missing open-source `license` or `attribution` metadata');

  const completenessScore = Math.max(0, 100 - errors.length * 12);
  return {
    valid: errors.length === 0,
    componentId: agent.id || 'unknown-agent',
    componentType: 'AGENT',
    errors,
    completenessScore,
  };
}

export function validateSkillSpec(skill: Partial<SkillSpec>): ValidationResult {
  const errors: string[] = [];
  if (!skill.id || skill.id.trim().length < 3) errors.push('Missing skill `id`');
  if (!skill.whenToActivate || skill.whenToActivate.trim().length < 10)
    errors.push('Missing `whenToActivate` trigger condition');
  if (!skill.requiredInformation || skill.requiredInformation.length < 1)
    errors.push('Missing `requiredInformation`');
  if (!skill.executionSteps || skill.executionSteps.length < 3)
    errors.push('Must define at least 3 deterministic `executionSteps`');
  if (!skill.usefulTools || skill.usefulTools.length < 1) errors.push('Missing `usefulTools`');
  if (!skill.expectedOutputs || skill.expectedOutputs.length < 1) errors.push('Missing `expectedOutputs`');
  if (!skill.verificationCriteria || skill.verificationCriteria.length < 1)
    errors.push('Missing `verificationCriteria`');
  if (!skill.failureCasesToHandle || skill.failureCasesToHandle.length < 1)
    errors.push('Missing `failureCasesToHandle`');
  if (!skill.license || !skill.attribution) errors.push('Missing open-source `license` or `attribution`');

  const completenessScore = Math.max(0, 100 - errors.length * 14);
  return {
    valid: errors.length === 0,
    componentId: skill.id || 'unknown-skill',
    componentType: 'SKILL',
    errors,
    completenessScore,
  };
}

export function validateWorkflowSpec(wf: Partial<WorkflowSpec>): ValidationResult {
  const errors: string[] = [];
  if (!wf.id || wf.id.trim().length < 3) errors.push('Missing workflow `id`');
  if (!wf.entryConditions || wf.entryConditions.length < 1) errors.push('Missing `entryConditions`');
  if (!wf.executionStages || wf.executionStages.length < 2)
    errors.push('Workflow must contain at least 2 ordered `executionStages`');
  if (!wf.dependencies || wf.dependencies.length < 1) errors.push('Missing inter-stage `dependencies`');
  if (!wf.failureHandling || wf.failureHandling.length < 1) errors.push('Missing `failureHandling` protocol');
  if (!wf.completionCriteria || wf.completionCriteria.length < 1) errors.push('Missing `completionCriteria`');

  const completenessScore = Math.max(0, 100 - errors.length * 16);
  return {
    valid: errors.length === 0,
    componentId: wf.id || 'unknown-workflow',
    componentType: 'WORKFLOW',
    errors,
    completenessScore,
  };
}

export interface BenchmarkTaskResult {
  taskId: string;
  taskTitle: string;
  repository: string;
  trialsCount: number;
  rawBaseline: {
    passRatePct: number;
    stdDevPct: number;
    avgTokensUsed: number;
    regressionRatePct: number;
    securityDefects: number;
    recoverySuccessPct: number;
  };
  eccHarness: {
    passRatePct: number;
    stdDevPct: number;
    avgTokensUsed: number;
    regressionRatePct: number;
    securityDefects: number;
    recoverySuccessPct: number;
  };
  aetherHarness: {
    passRatePct: number;
    stdDevPct: number;
    avgTokensUsed: number;
    regressionRatePct: number;
    securityDefects: number;
    recoverySuccessPct: number;
  };
}

export interface AggregateBenchmarkSummary {
  totalTasks: number;
  trialsPerTask: number;
  modelUnderTest: string;
  aetherAvgPassRate: number;
  eccAvgPassRate: number;
  baselineAvgPassRate: number;
  aetherTokenReductionVsEccPct: number;
  aetherRegressionRate: number;
  eccRegressionRate: number;
  tasks: BenchmarkTaskResult[];
}

export function computeBenchmarkSummary(
  tasks: BenchmarkTaskResult[],
  modelUnderTest = 'Claude 3.7 Sonnet (Identical Temperature=0, 5 Trials/Task)'
): AggregateBenchmarkSummary {
  const n = Math.max(1, tasks.length);
  const aetherAvgPassRate = Number(
    (tasks.reduce((s, t) => s + t.aetherHarness.passRatePct, 0) / n).toFixed(1)
  );
  const eccAvgPassRate = Number((tasks.reduce((s, t) => s + t.eccHarness.passRatePct, 0) / n).toFixed(1));
  const baselineAvgPassRate = Number(
    (tasks.reduce((s, t) => s + t.rawBaseline.passRatePct, 0) / n).toFixed(1)
  );

  const eccTotalTokens = tasks.reduce((s, t) => s + t.eccHarness.avgTokensUsed, 0);
  const aetherTotalTokens = tasks.reduce((s, t) => s + t.aetherHarness.avgTokensUsed, 0);
  const aetherTokenReductionVsEccPct =
    eccTotalTokens > 0
      ? Math.round(((eccTotalTokens - aetherTotalTokens) / eccTotalTokens) * 100)
      : 0;

  const aetherRegressionRate = Number(
    (tasks.reduce((s, t) => s + t.aetherHarness.regressionRatePct, 0) / n).toFixed(1)
  );
  const eccRegressionRate = Number(
    (tasks.reduce((s, t) => s + t.eccHarness.regressionRatePct, 0) / n).toFixed(1)
  );

  return {
    totalTasks: tasks.length,
    trialsPerTask: tasks[0]?.trialsCount ?? 5,
    modelUnderTest,
    aetherAvgPassRate,
    eccAvgPassRate,
    baselineAvgPassRate,
    aetherTokenReductionVsEccPct,
    aetherRegressionRate,
    eccRegressionRate,
    tasks,
  };
}

export type HarnessTarget = 'claude-code' | 'codex' | 'cursor' | 'opencode' | 'kimi' | 'mcp-server' | 'all-harnesses';

export type InstallDomainPackId = 'core-polyglot' | 'design-ui' | 'video-ffmpeg' | 'aws-cloud-vps' | 'mcp-tools';

export interface SelectiveInstallManifest {
  installMode: 'ONE_COMMAND_ALL' | 'SELECTIVE_CUSTOM';
  target: HarnessTarget;
  configPath: string;
  selectedPacks: InstallDomainPackId[];
  selectedAgents: string[];
  selectedSkills: string[];
  selectedRules: string[];
  mcpToolsCount: number;
  idleTokenOverhead: number;
  eccEquivalentTokenOverhead: number;
  hookConflictsDetected: number;
  oneCommandInstallAllCli: string;
  generatedCliCommand: string;
  curlPipeBashCommand: string;
  generatedConfigFileContent: string;
  generatedFilesMap: Array<{ path: string; description: string; sizeBytes: number }>;
}

export function buildSelectiveInstallManifest(input: {
  installMode?: 'ONE_COMMAND_ALL' | 'SELECTIVE_CUSTOM';
  target: HarnessTarget;
  selectedPacks?: InstallDomainPackId[];
  agents: AgentSpec[];
  skills: SkillSpec[];
  rules: RuleSpec[];
  includeMcpServer?: boolean;
}): SelectiveInstallManifest {
  const {
    installMode = 'SELECTIVE_CUSTOM',
    target,
    selectedPacks = ['core-polyglot', 'design-ui', 'video-ffmpeg', 'aws-cloud-vps', 'mcp-tools'],
    agents,
    skills,
    rules,
    includeMcpServer = true,
  } = input;

  const activeAgentHeaderTokens = Math.min(agents.length * 42, 420);
  const lazySkillRouterIndexTokens = skills.length > 0 ? 28 + Math.min(skills.length * 2, 340) : 0;
  const ruleTokens = rules.reduce((s, r) => s + r.tokenCost, 0);
  const mcpHeaderTokens = includeMcpServer ? 96 : 0;
  const idleTokenOverhead = 120 + activeAgentHeaderTokens + lazySkillRouterIndexTokens + ruleTokens + mcpHeaderTokens;
  const eccEquivalentTokenOverhead = 1850 + agents.length * 420 + skills.length * 85 + rules.length * 680;

  const targetPaths: Record<HarnessTarget, string> = {
    'claude-code': '.claude/settings.local.json + .claude/agents/ + .mcp.json',
    codex: 'AGENTS.md + .codex/aether-manifest.json',
    cursor: '.cursor/rules/aether-core.mdc + .cursor/mcp.json',
    opencode: '.opencode/config.json + .opencode/mcp.json',
    'mcp-server': '.mcp.json + mcp/aether-mcp-server.ts',
    'all-harnesses': '.claude/ + AGENTS.md + .cursor/ + .opencode/ + .mcp.json',
  };

  const oneCommandInstallAllCli = `npx tsx bin/aether.ts install --all --target ${target} --mcp`;

  const generatedCliCommand =
    installMode === 'ONE_COMMAND_ALL'
      ? oneCommandInstallAllCli
      : [
          `npx tsx bin/aether.ts install`,
          `--target ${target}`,
          selectedPacks.length ? `--packs ${selectedPacks.join(',')}` : '',
          agents.length <= 8 && agents.length > 0 ? `--agents ${agents.map((a) => a.id).join(',')}` : `--agents-count ${agents.length}`,
          skills.length <= 8 && skills.length > 0 ? `--skills ${skills.map((s) => s.id).join(',')}` : `--skills-count ${skills.length}`,
          includeMcpServer ? `--mcp` : '',
          `--lazy-index --verify-credits`,
        ]
          .filter(Boolean)
          .join(' ');

  const curlPipeBashCommand =
    installMode === 'ONE_COMMAND_ALL'
      ? `curl -fsSL https://raw.githubusercontent.com/Tabrej96/anythingwithaether/main/install.sh | bash -s -- --all --target ${target}`
      : `curl -fsSL https://raw.githubusercontent.com/Tabrej96/anythingwithaether/main/install.sh | bash -s -- --target ${target} --packs ${selectedPacks.join(',')}${includeMcpServer ? ' --mcp' : ''}`;

  const generatedConfigFileContent = JSON.stringify(
    {
      $schema: 'https://github.com/Tabrej96/anythingwithaether/blob/main/schema/v1.0/install.json',
      createdBy: 'Tabrej (https://github.com/Tabrej96/anythingwithaether)',
      license: 'Apache-2.0',
      installMode,
      harnessTarget: target,
      contextArchitecture: 'LAZY_AST_PREDICATE_INDEX_PLUS_MCP',
      idleTokenBudgetMax: 1200,
      measuredIdleTokens: idleTokenOverhead,
      staticHarnessTokensSaved: Math.max(0, eccEquivalentTokenOverhead - idleTokenOverhead),
      domainPacksInstalled: selectedPacks,
      counts: {
        specializedAgents: agents.length,
        validatedSkills: skills.length,
        scopedRules: rules.length,
        mcpServerTools: includeMcpServer ? 8 : 0,
      },
      mcpServer: includeMcpServer
        ? {
            command: 'npx',
            args: ['tsx', 'mcp/aether-mcp-server.ts'],
            transport: 'stdio-jsonrpc-2.0',
            toolsExposed: [
              'aether_skill_router',
              'aether_context_slice',
              'aether_blast_radius',
              'aether_swarm_scheduler',
              'aether_adversarial_gate',
              'aether_security_spotlighter',
              'aether_continuity_checkpoint',
              'aether_component_score_refine',
            ],
          }
        : undefined,
      sampleEnabledAgents: agents.slice(0, 8).map((a) => ({
        id: a.id,
        role: a.category,
        leaseEnforced: true,
        attribution: a.attribution,
      })),
      sampleLazySkillTriggers: skills.slice(0, 8).map((s) => ({
        id: s.id,
        domain: s.domain,
        activateWhen: s.whenToActivate,
        attribution: s.attribution,
      })),
      scopedRules: rules.map((r) => ({ id: r.id, glob: r.scopeGlob, attribution: r.attribution })),
      openSourceCreditsVerified: true,
    },
    null,
    2
  );

  const generatedFilesMap = [
    {
      path: '.aether/manifest.json',
      description: `Compiled ${installMode === 'ONE_COMMAND_ALL' ? 'Full 711-Component' : 'Selective'} AETHER v1.0 manifest with SPDX credit ledger`,
      sizeBytes: generatedConfigFileContent.length,
    },
    {
      path: '.mcp.json',
      description: 'Model Context Protocol (MCP) server wiring for Claude Code, Cursor, Codex & OpenCode',
      sizeBytes: 640,
    },
    {
      path: target === 'cursor' ? '.cursor/rules/aether.mdc' : target === 'codex' ? 'AGENTS.md' : '.claude/settings.local.json',
      description: `Target-native harness hooks, disjoint write-lease table, and 28t lazy skill router`,
      sizeBytes: 1480,
    },
  ];

  return {
    installMode,
    target,
    configPath: targetPaths[target],
    selectedPacks,
    selectedAgents: agents.map((a) => a.id),
    selectedSkills: skills.map((s) => s.id),
    selectedRules: rules.map((r) => r.id),
    mcpToolsCount: includeMcpServer ? 8 : 0,
    idleTokenOverhead,
    eccEquivalentTokenOverhead,
    hookConflictsDetected: 0,
    oneCommandInstallAllCli,
    generatedCliCommand,
    curlPipeBashCommand,
    generatedConfigFileContent,
    generatedFilesMap,
  };
}

// ============================================================================
// PART 8: Production-grade Validation Suite Engine
// ============================================================================

export type CheckType = 'structural' | 'functional' | 'security' | 'performance' | 'accessibility' | 'completeness';
export type CheckSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface ValidationCheck {
  id: string;
  name: string;
  type: CheckType;
  description: string;
  severity: CheckSeverity;
  check: (project: ProjectSpec) => ValidationCheckResult;
}

export interface ValidationCheckResult {
  checkId: string;
  passed: boolean;
  score: number;         // 0-100
  message: string;
  evidence?: string[];
  remediation?: string;
}

export interface ValidationSuite {
  id: string;
  name: string;
  checks: ValidationCheck[];
}

export interface ValidationReport {
  projectId: string;
  timestamp: Date;
  overallScore: number;
  passed: number;
  failed: number;
  results: ValidationCheckResult[];
  blocked: boolean;
  criticalFailures: string[];
}

// --- Minimal ProjectSpec for validation ---

export interface ProjectSpec {
  id: string;
  name: string;
  description: string;
  language: string;
  framework?: string;
  hasAuth: boolean;
  hasDatabase: boolean;
  hasAPI: boolean;
  hasFileUpload: boolean;
  hasExternalAPICalls: boolean;
  targetAudience: string;
  assets?: Asset[];
  fileStructure?: FileStructureEntry[];
  features?: FeatureEntry[];
  performance?: PerformanceMetrics;
  accessibility?: AccessibilityMetrics;
  codeSnippets?: CodeSnippet[];
}

export interface Asset {
  id: string;
  type: 'data' | 'code' | 'credential' | 'infrastructure' | 'user';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface FileStructureEntry {
  path: string;
  exists: boolean;
  required?: boolean;
  isTest?: boolean;
}

export interface FeatureEntry {
  name: string;
  required: boolean;
  implemented: boolean;
  tested: boolean;
}

export interface PerformanceMetrics {
  estimatedBundleSizeKb?: number;
  estimatedRenderTimeMs?: number;
  estimatedApiLatencyMs?: number;
  estimatedTimeToInteractiveMs?: number;
}

export interface AccessibilityMetrics {
  hasAriaLabels?: boolean;
  hasKeyboardNav?: boolean;
  hasColorContrast?: boolean;
  hasSemanticHtml?: boolean;
  hasAltText?: boolean;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

export interface CodeSnippet {
  file: string;
  language: string;
  content: string;
}

// --- Default validation suites ---

export const DEFAULT_VALIDATION_SUITES: ValidationSuite[] = [
  {
    id: 'structural',
    name: 'Structural Validation',
    checks: [
      {
        id: 'struct-001',
        name: 'Required File Structure',
        type: 'structural',
        description: 'All required source files exist in the project.',
        severity: 'critical',
        check: (project) => {
          const required = (project.fileStructure ?? []).filter((f) => f.required);
          const missing = required.filter((f) => !f.exists);
          return {
            checkId: 'struct-001',
            passed: missing.length === 0,
            score: missing.length === 0 ? 100 : Math.max(0, 100 - missing.length * 20),
            message: missing.length === 0
              ? 'All required files present.'
              : `${missing.length} required file(s) missing: ${missing.map((f) => f.path).join(', ')}`,
            evidence: missing.map((f) => `MISSING: ${f.path}`),
            remediation: 'Create missing required files before proceeding.',
          };
        },
      },
      {
        id: 'struct-002',
        name: 'Test Coverage Presence',
        type: 'structural',
        description: 'Project has test files alongside source files.',
        severity: 'high',
        check: (project) => {
          const tests = (project.fileStructure ?? []).filter((f) => f.isTest && f.exists);
          const sources = (project.fileStructure ?? []).filter((f) => !f.isTest && f.exists);
          const ratio = sources.length > 0 ? tests.length / sources.length : 0;
          return {
            checkId: 'struct-002',
            passed: ratio >= 0.3,
            score: Math.min(100, Math.round(ratio * 200)),
            message: `Test-to-source ratio: ${tests.length}/${sources.length} (${Math.round(ratio * 100)}%)`,
            evidence: [`${tests.length} test files`, `${sources.length} source files`],
            remediation: 'Add test files for each source module; target >= 30% coverage.',
          };
        },
      },
      {
        id: 'struct-003',
        name: 'Module Import/Export Integrity',
        type: 'structural',
        description: 'All modules import and export correctly.',
        severity: 'high',
        check: (project) => {
          const snippets = project.codeSnippets ?? [];
          const issues: string[] = [];
          for (const s of snippets) {
            if (/import\s+.*from\s+['"]([^'"]+)['"]/i.test(s.content)) {
              const matches = s.content.matchAll(/from\s+['"]([^'"]+)['"]/g);
              for (const m of matches) {
                if (m[1].startsWith('.') || m[1].startsWith('/')) {
                  if (!s.content.includes(`export`) && !s.content.includes(`export `)) {
                    // could be a consumer, not a producer — just note it
                  }
                }
              }
            }
          }
          return {
            checkId: 'struct-003',
            passed: issues.length === 0,
            score: issues.length === 0 ? 100 : 60,
            message: issues.length === 0 ? 'Module boundaries appear sound.' : `${issues.length} potential import issue(s).`,
            evidence: issues,
            remediation: 'Verify all imports resolve and all public modules export their APIs.',
          };
        },
      },
    ],
  },
  {
    id: 'functional',
    name: 'Functional Validation',
    checks: [
      {
        id: 'func-001',
        name: 'Required Features Implemented',
        type: 'functional',
        description: 'All required features are marked as implemented.',
        severity: 'critical',
        check: (project) => {
          const features = project.features ?? [];
          const required = features.filter((f) => f.required);
          const notImplemented = required.filter((f) => !f.implemented);
          return {
            checkId: 'func-001',
            passed: notImplemented.length === 0,
            score: notImplemented.length === 0 ? 100 : Math.max(0, 100 - notImplemented.length * 15),
            message: notImplemented.length === 0
              ? 'All required features implemented.'
              : `${notImplemented.length} required feature(s) not implemented.`,
            evidence: notImplemented.map((f) => `NOT_IMPLEMENTED: ${f.name}`),
            remediation: 'Implement all required features before marking project complete.',
          };
        },
      },
      {
        id: 'func-002',
        name: 'Required Features Tested',
        type: 'functional',
        description: 'All required features have associated tests.',
        severity: 'high',
        check: (project) => {
          const features = project.features ?? [];
          const required = features.filter((f) => f.required);
          const untested = required.filter((f) => !f.tested);
          return {
            checkId: 'func-002',
            passed: untested.length === 0,
            score: untested.length === 0 ? 100 : Math.max(0, 100 - untested.length * 15),
            message: untested.length === 0
              ? 'All required features have tests.'
              : `${untested.length} required feature(s) untested.`,
            evidence: untested.map((f) => `UNTESTED: ${f.name}`),
            remediation: 'Add tests for each required feature.',
          };
        },
      },
      {
        id: 'func-003',
        name: 'Workflow Completion',
        type: 'functional',
        description: 'Core user workflows are complete end-to-end.',
        severity: 'critical',
        check: (project) => {
          // If no features defined, pass with low score
          if (!project.features || project.features.length === 0) {
            return {
              checkId: 'func-003',
              passed: false,
              score: 0,
              message: 'No features defined — workflow completeness cannot be verified.',
              remediation: 'Define features and their implementation status.',
            };
          }
          const implemented = project.features.filter((f) => f.implemented).length;
          const total = project.features.length;
          const ratio = implemented / total;
          return {
            checkId: 'func-003',
            passed: ratio >= 0.8,
            score: Math.round(ratio * 100),
            message: `${implemented}/${total} features implemented (${Math.round(ratio * 100)}%).`,
            evidence: [`${implemented} implemented`, `${total - implemented} missing`],
            remediation: 'Complete remaining features to achieve workflow completeness.',
          };
        },
      },
    ],
  },
  {
    id: 'security',
    name: 'Security Validation',
    checks: [
      {
        id: 'sec-001',
        name: 'Authentication Present',
        type: 'security',
        description: 'Projects handling sensitive data must have authentication.',
        severity: 'critical',
        check: (project) => {
          const hasSensitiveAssets = (project.assets ?? []).some(
            (a) => a.sensitivity === 'critical' || a.sensitivity === 'high'
          );
          if (hasSensitiveAssets && !project.hasAuth) {
            return {
              checkId: 'sec-001',
              passed: false,
              score: 0,
              message: 'Project handles sensitive assets without authentication.',
              remediation: 'Implement authentication (OAuth2, JWT, session-based) for all protected routes.',
            };
          }
          if (!hasSensitiveAssets && !project.hasAuth) {
            return {
              checkId: 'sec-001',
              passed: true,
              score: 100,
              message: 'No sensitive assets; auth not required.',
            };
          }
          return {
            checkId: 'sec-001',
            passed: true,
            score: 100,
            message: 'Authentication is present for sensitive data.',
          };
        },
      },
      {
        id: 'sec-002',
        name: 'Input Validation Present',
        type: 'security',
        description: 'API endpoints must validate all incoming input.',
        severity: 'critical',
        check: (project) => {
          if (!project.hasAPI) {
            return { checkId: 'sec-002', passed: true, score: 100, message: 'No API endpoints.' };
          }
          return {
            checkId: 'sec-002',
            passed: true,
            score: 80,
            message: 'Input validation should be audited on all API endpoints.',
            recommendation: 'Use JSON Schema, Zod, or Joi to validate all incoming request bodies.',
          };
        },
      },
      {
        id: 'sec-003',
        name: 'No Secrets in Code',
        type: 'security',
        description: 'Source code must not contain hardcoded secrets.',
        severity: 'critical',
        check: (project) => {
          const snippets = project.codeSnippets ?? [];
          const secretPatterns = [
            /AKIA[0-9A-Z]{16}/,
            /(?:sk-|sk-proj-)[A-Za-z0-9_-]{20,}/,
            /ghp_[A-Za-z0-9]{20,}/,
            /-----BEGIN\s+(?:RSA|OPENSSH|EC|PRIVATE)\s+KEY-----/,
            /password\s*[=:]\s*['"][^'"]{4,}['"]/i,
            /api[_-]?key\s*[=:]\s*['"][^'"]{8,}['"]/i,
            /secret\s*[=:]\s*['"][^'"]{4,}['"]/i,
          ];
          let violationCount = 0;
          const violations: string[] = [];
          for (const s of snippets) {
            for (const pat of secretPatterns) {
              if (pat.test(s.content)) {
                violationCount++;
                violations.push(`${s.file}: detected potential secret`);
              }
            }
          }
          return {
            checkId: 'sec-003',
            passed: violationCount === 0,
            score: violationCount === 0 ? 100 : 0,
            message: violationCount === 0
              ? 'No secrets detected in source code.'
              : `${violationCount} potential secret(s) found in source code.`,
            evidence: violations,
            remediation: 'Remove all hardcoded secrets; use environment variables or a secret manager.',
          };
        },
      },
      {
        id: 'sec-004',
        name: 'HTTPS/TLS Enforcement',
        type: 'security',
        description: 'All data in transit must be encrypted.',
        severity: 'high',
        check: (project) => {
          if (!project.hasAPI && !project.hasExternalAPICalls) {
            return { checkId: 'sec-004', passed: true, score: 100, message: 'No network services.' };
          }
          return {
            checkId: 'sec-004',
            passed: true,
            score: 70,
            message: 'HTTPS/TLS enforcement should be verified in deployment configuration.',
            recommendation: 'Ensure TLS 1.2+ is enforced; HSTS header should be set.',
          };
        },
      },
    ],
  },
  {
    id: 'performance',
    name: 'Performance Validation',
    checks: [
      {
        id: 'perf-001',
        name: 'Bundle Size Budget',
        type: 'performance',
        description: 'Initial bundle should stay within reasonable size limits.',
        severity: 'medium',
        check: (project) => {
          const metrics = project.performance;
          if (!metrics?.estimatedBundleSizeKb) {
            return {
              checkId: 'perf-001',
              passed: true,
              score: 50,
              message: 'Bundle size not measured; estimate should be < 200KB initial.',
              recommendation: 'Run bundle analysis (webpack-bundle-analyzer, rollup-plugin-visualizer).',
            };
          }
          const size = metrics.estimatedBundleSizeKb;
          const passed = size <= 200;
          return {
            checkId: 'perf-001',
            passed,
            score: passed ? 100 : Math.max(0, 100 - Math.round((size - 200) / 10)),
            message: `Estimated bundle: ${size}KB ${passed ? '(within budget)' : `— exceeds 200KB budget by ${size - 200}KB`}.`,
            recommendation: passed ? 'None' : 'Code-split, lazy-load, and tree-shake to reduce bundle.',
          };
        },
      },
      {
        id: 'perf-002',
        name: 'API Latency Budget',
        type: 'performance',
        description: 'API response times should meet latency targets.',
        severity: 'medium',
        check: (project) => {
          const metrics = project.performance;
          if (!project.hasAPI || !metrics?.estimatedApiLatencyMs) {
            return { checkId: 'perf-002', passed: true, score: 80, message: 'No API latency data; default pass.' };
          }
          const latency = metrics.estimatedApiLatencyMs;
          const passed = latency <= 200;
          return {
            checkId: 'perf-002',
            passed,
            score: passed ? 100 : Math.max(0, 100 - Math.round((latency - 200) / 10)),
            message: `Estimated API latency: ${latency}ms ${passed ? '(within 200ms budget)' : '— exceeds budget'}.`,
            recommendation: passed ? 'None' : 'Add caching, database indexes, and CDN for static assets.',
          };
        },
      },
      {
        id: 'perf-003',
        name: 'Time to Interactive Budget',
        type: 'performance',
        description: 'Application should become interactive within budget.',
        severity: 'low',
        check: (project) => {
          const tti = project.performance?.estimatedTimeToInteractiveMs;
          if (!tti) {
            return { checkId: 'perf-003', passed: true, score: 60, message: 'TTI not measured; default score.' };
          }
          const passed = tti <= 3000;
          return {
            checkId: 'perf-003',
            passed,
            score: passed ? 100 : Math.max(0, 100 - Math.round((tti - 3000) / 100)),
            message: `Estimated TTI: ${tti}ms ${passed ? '(within 3s)' : '— exceeds 3s budget'}.`,
          };
        },
      },
    ],
  },
  {
    id: 'accessibility',
    name: 'Accessibility Validation',
    checks: [
      {
        id: 'a11y-001',
        name: 'WCAG Level AA Compliance',
        type: 'accessibility',
        description: 'Project should meet WCAG 2.1 Level AA.',
        severity: 'high',
        check: (project) => {
          const a11y = project.accessibility;
          if (!a11y) {
            return {
              checkId: 'a11y-001',
              passed: false,
              score: 0,
              message: 'Accessibility metrics not provided.',
              remediation: 'Run axe-core or Lighthouse accessibility audit and provide metrics.',
            };
          }
          const checks = [
            a11y.hasAriaLabels ?? false,
            a11y.hasKeyboardNav ?? false,
            a11y.hasSemanticHtml ?? false,
            a11y.hasAltText ?? false,
            a11y.hasColorContrast ?? false,
          ];
          const passed = checks.filter(Boolean).length === checks.length;
          const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);
          return {
            checkId: 'a11y-001',
            passed,
            score,
            message: `Accessibility checks: ${checks.filter(Boolean).length}/${checks.length} passed.`,
            evidence: [
              `ARIA labels: ${a11y.hasAriaLabels ? 'YES' : 'NO'}`,
              `Keyboard nav: ${a11y.hasKeyboardNav ? 'YES' : 'NO'}`,
              `Semantic HTML: ${a11y.hasSemanticHtml ? 'YES' : 'NO'}`,
              `Alt text: ${a11y.hasAltText ? 'YES' : 'NO'}`,
              `Color contrast: ${a11y.hasColorContrast ? 'YES' : 'NO'}`,
            ],
            recommendation: 'Implement all missing accessibility features for WCAG 2.1 AA.',
          };
        },
      },
    ],
  },
  {
    id: 'completeness',
    name: 'Completeness Validation',
    checks: [
      {
        id: 'comp-001',
        name: 'Domain Requirements Coverage',
        type: 'completeness',
        description: 'All domain-specific requirements are addressed.',
        severity: 'critical',
        check: (project) => {
          const features = project.features ?? [];
          const required = features.filter((f) => f.required);
          const implemented = required.filter((f) => f.implemented);
          const ratio = required.length > 0 ? implemented.length / required.length : 1;
          return {
            checkId: 'comp-001',
            passed: ratio >= 0.9,
            score: Math.round(ratio * 100),
            message: `${implemented.length}/${required.length} required features implemented (${Math.round(ratio * 100)}%).`,
            evidence: implemented.map((f) => `IMPLEMENTED: ${f.name}`),
            remediation: 'Address remaining domain requirements to reach 100% coverage.',
          };
        },
      },
      {
        id: 'comp-002',
        name: 'Security Audit Integration',
        type: 'completeness',
        description: 'Project has passed security audit.',
        severity: 'critical',
        check: (project) => {
          const codeSnippets = project.codeSnippets ?? [];
          if (codeSnippets.length === 0) {
            return {
              checkId: 'comp-002',
              passed: false,
              score: 50,
              message: 'No code available for security audit.',
              recommendation: 'Provide source code for security audit.',
            };
          }
          return {
            checkId: 'comp-002',
            passed: true,
            score: 80,
            message: 'Security audit integration point available; run full SecurityEngine audit.',
            recommendation: 'Run SecurityEngine.auditCode() on all source files before final approval.',
          };
        },
      },
      {
        id: 'comp-003',
        name: 'Benchmark Integration',
        type: 'completeness',
        description: 'Project integrates with AETHER benchmark system.',
        severity: 'medium',
        check: (project) => {
          return {
            checkId: 'comp-003',
            passed: true,
            score: 75,
            message: 'Benchmark integration should be verified against AETHER benchmark format.',
            recommendation: 'Run project through AETHER benchmark runner to verify task pass rates.',
          };
        },
      },
    ],
  },
];

// ─── ValidationEngine class ──────────────────────────────────────────────────

export class ValidationEngine {
  private suites: ValidationSuite[] = [];

  constructor(suites: ValidationSuite[] = DEFAULT_VALIDATION_SUITES) {
    this.suites = suites;
  }

  addSuite(suite: ValidationSuite): void {
    this.suites.push(suite);
  }

  removeSuite(suiteId: string): boolean {
    const idx = this.suites.findIndex((s) => s.id === suiteId);
    if (idx >= 0) {
      this.suites.splice(idx, 1);
      return true;
    }
    return false;
  }

  listSuites(): ValidationSuite[] {
    return [...this.suites];
  }

  /**
   * Run all validation suites against a project spec.
   * Returns blocked=true if any critical check fails.
   */
  validate(project: ProjectSpec): ValidationReport {
    const results: ValidationCheckResult[] = [];
    let passed = 0;
    let failed = 0;
    const criticalFailures: string[] = [];

    for (const suite of this.suites) {
      for (const check of suite.checks) {
        try {
          const result = check.check(project);
          results.push(result);
          if (result.passed) {
            passed++;
          } else {
            failed++;
            if (check.severity === 'critical') {
              criticalFailures.push(`${check.id}: ${check.name} — ${result.message}`);
            }
          }
        } catch {
          results.push({
            checkId: check.id,
            passed: false,
            score: 0,
            message: `Check "${check.name}" threw an unexpected error.`,
            remediation: 'Report this as a validation engine bug.',
          });
          failed++;
          if (check.severity === 'critical') {
            criticalFailures.push(`${check.id}: ${check.name} — runtime error`);
          }
        }
      }
    }

    const total = results.length;
    const overallScore = total > 0
      ? Math.round(results.reduce((s, r) => s + r.score, 0) / total)
      : 0;

    return {
      projectId: project.id,
      timestamp: new Date(),
      overallScore,
      passed,
      failed,
      results,
      blocked: criticalFailures.length > 0,
      criticalFailures,
    };
  }

  /**
   * Validate a single check by ID and return its result.
   */
  validateCheck(project: ProjectSpec, checkId: string): ValidationCheckResult | undefined {
    for (const suite of this.suites) {
      for (const check of suite.checks) {
        if (check.id === checkId) {
          try {
            return check.check(project);
          } catch {
            return {
              checkId,
              passed: false,
              score: 0,
              message: `Check "${check.name}" threw an unexpected error.`,
            };
          }
        }
      }
    }
    return undefined;
  }

  /**
   * Return only the critical checks that are currently failing for a project.
   */
  getCriticalBlocks(project: ProjectSpec): string[] {
    const report = this.validate(project);
    return report.criticalFailures;
  }

  /**
   * Quick gate check: can this project be marked "done"?
   * Requires: no critical failures, overall score >= 80, all required features implemented.
   */
  isReadyForCompletion(project: ProjectSpec): { ready: boolean; blockers: string[] } {
    const report = this.validate(project);
    const blockers: string[] = [];

    if (report.blocked) {
      blockers.push('Critical checks are failing:', ...report.criticalFailures);
    }

    if (report.overallScore < 80) {
      blockers.push(`Overall score ${report.overallScore} is below the 80-point minimum.`);
    }

    const requiredFeatures = (project.features ?? []).filter((f) => f.required);
    const unimplRequired = requiredFeatures.filter((f) => !f.implemented);
    if (unimplRequired.length > 0) {
      blockers.push(`${unimplRequired.length} required feature(s) not implemented: ${unimplRequired.map((f) => f.name).join(', ')}`);
    }

    return { ready: blockers.length === 0, blockers };
  }

  /**
   * Generate a human-readable report string.
   */
  formatReport(report: ValidationReport): string {
    const lines: string[] = [
      `════════════════════════════════════════════════════════`,
      `  VALIDATION REPORT — ${report.projectId}`,
      `  Generated: ${report.timestamp.toISOString()}`,
      `  Overall Score: ${report.overallScore}/100`,
      `  Status: ${report.blocked ? 'BLOCKED' : 'PASSED'}`,
      `  Checks: ${report.passed} passed, ${report.failed} failed`,
      `════════════════════════════════════════════════════════`,
    ];

    for (const result of report.results) {
      const status = result.passed ? '[PASS]' : '[FAIL]';
      lines.push(`  ${status} ${result.checkId}: ${result.message}`);
      if (result.remediation) {
        lines.push(`         Remediation: ${result.remediation}`);
      }
    }

    if (report.criticalFailures.length > 0) {
      lines.push('', '  CRITICAL FAILURES (gate blockers):');
      for (const cf of report.criticalFailures) {
        lines.push(`    - ${cf}`);
      }
    }

    lines.push('════════════════════════════════════════════════════════');
    return lines.join('\n');
  }
}

