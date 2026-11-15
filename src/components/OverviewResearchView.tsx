/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 2.0 Universal AI Execution Platform Overview:
 * - Priority 1: Implementation-Level Audit Matrix (v1.0 Honest Findings vs. v2.0 Upgrades)
 * - Priority 4: Live Autonomous Runtime Console (Lifecycle, Exclusive Write Leases, Human Approval Gates, Crash Recovery)
 * - Priority 5: 15 External Capability Ecosystem Adapters (OpenHands, ECC, Superpowers, Playwright, Agent Browser, Browser Use, Skyvern, OmniParser, Lightpanda, AutoGen, OpenManus, ComfyUI, Three.js, Puter, REA)
 * - Priority 7: Dynamic Agent & Multi-Skill Composition + MCP Server Inspector
 * Created by Tabrej & AETHER Open-Source Contributors.
 */

import React, { useMemo, useState } from 'react';
import {
  AETHER_AGENTS,
  AETHER_SKILLS,
  AETHER_WORKFLOWS,
  LANGUAGE_ECOSYSTEMS,
  OPEN_SOURCE_CREDITS,
} from '../data/repositoryCatalog';
import { runComponentAuditAndRefinementLoop } from '../core/liveBenchmarkRunner';
import { AETHER_MCP_TOOLS, executeMcpToolCall } from '../core/mcpServerEngine';
import { runImplementationAudit } from '../core/auditEngine';
import { AutonomousRuntimeEngine, AutonomousSessionState } from '../core/autonomousRuntime';
import {
  EcosystemId,
  EXTERNAL_ECOSYSTEM_ADAPTERS,
  executeEcosystemAdapter,
} from '../core/ecosystemAdapters';
import { REPRODUCIBLE_TEST_REPOSITORIES } from '../core/realBenchmarkEngine';
import { defaultEcosystemRegistry } from '../core/ecosystemRegistry';

interface OverviewResearchViewProps {
  onNavigateTab: (tab: 'overview' | 'intelligence' | 'repository' | 'benchmarks' | 'installer') => void;
}

const QUICK_INSTALL_MODES = [
  {
    id: 'all',
    label: 'One-Command Install All (711 Components + 15 Adapters + MCP)',
    command: 'curl -fsSL https://raw.githubusercontent.com/Tabrej96/anythingwithaether/main/install.sh | bash -s -- --all',
    localCli: 'npx tsx bin/aether.ts install --all --target all-harnesses --mcp --write .',
    note: 'Installs all 117 Agents, 540 Lazy-Indexed Skills, 54 Workflows, 15 Ecosystem Adapters & 8-Tool MCP Server.',
  },
  {
    id: 'selective',
    label: 'One-Command Selective Domain Pack Install',
    command:
      'curl -fsSL https://raw.githubusercontent.com/Tabrej96/anythingwithaether/main/install.sh | bash -s -- --target claude-code --packs aws-cloud-vps,design-ui,video-ffmpeg --mcp',
    localCli:
      'npx tsx bin/aether.ts install --target claude-code --packs aws-cloud-vps,design-ui,video-ffmpeg --mcp --write .',
    note: 'Installs only selected domain packs (e.g., AWS/VPS + Design + Video + MCP Server) into Claude Code, Cursor, Codex, or OpenCode.',
  },
];

export const OverviewResearchView: React.FC<OverviewResearchViewProps> = ({ onNavigateTab }) => {
  const [quickInstallMode, setQuickInstallMode] = useState<'all' | 'selective'>('all');
  const [copiedQuickCmd, setCopiedQuickCmd] = useState(false);

  // Priority 4 Autonomous Runtime state
  const [runtimeEngine] = useState(() => new AutonomousRuntimeEngine());
  const [selectedRepoId, setSelectedRepoId] = useState<string>(REPRODUCIBLE_TEST_REPOSITORIES[0].repoId);
  const [requireHumanGate, setRequireHumanGate] = useState<boolean>(true);
  const [activeSession, setActiveSession] = useState<AutonomousSessionState>(() => {
    const initialTask = runtimeEngine.enqueueTask({
      title: 'Remediate SQLi & Refresh Token Replay',
      objective: REPRODUCIBLE_TEST_REPOSITORIES[0].taskSpecification,
      priority: 95,
      repositoryId: REPRODUCIBLE_TEST_REPOSITORIES[0].repoId,
      requireHumanApprovalForWrites: false,
    });
    return runtimeEngine.executeAutonomousSession(initialTask);
  });

  // Priority 5 External Ecosystem Adapter state
  const [selectedEcosystemId, setSelectedEcosystemId] = useState<EcosystemId>('openhands');
  const [adapterObjective, setAdapterObjective] = useState<string>(
    'Verify accessible checkout button and export Merkle state trajectory'
  );

  // Priority 7 Skill Composition state
  const [skillAId, setSkillAId] = useState<string>(AETHER_SKILLS[0].id);
  const [skillBId, setSkillBId] = useState<string>(AETHER_SKILLS[1].id);
  const [composedPipelineName, setComposedPipelineName] = useState<string>(
    'Autonomous Security & Accessibility Gate Pipeline'
  );

  // MCP Inspector state
  const [selectedMcpTool, setSelectedMcpTool] = useState<string>(AETHER_MCP_TOOLS[0].name);
  const [mcpPromptInput, setMcpPromptInput] = useState<string>(
    'Harden AWS IAM least-privilege role, configure WireGuard VPS mesh, and audit OKLCH contrast'
  );

  const auditSummary = useMemo(() => runImplementationAudit(), []);
  const refinementSummary = useMemo(() => runComponentAuditAndRefinementLoop(true), []);

  const activeQuickInstall =
    QUICK_INSTALL_MODES.find((m) => m.id === quickInstallMode) || QUICK_INSTALL_MODES[0];

  const adapterExecutionResult = useMemo(
    () =>
      executeEcosystemAdapter({
        ecosystemId: selectedEcosystemId,
        action: 'execute-verified-workflow',
        targetObjective: adapterObjective,
      }),
    [selectedEcosystemId, adapterObjective]
  );

  const composedSkillResult = useMemo(
    () =>
      defaultEcosystemRegistry.composeSkills({
        compositeName: composedPipelineName,
        skillIds: [skillAId, skillBId],
      }),
    [composedPipelineName, skillAId, skillBId]
  );

  const activeToolSchema = useMemo(
    () => AETHER_MCP_TOOLS.find((t) => t.name === selectedMcpTool) || AETHER_MCP_TOOLS[0],
    [selectedMcpTool]
  );

  const mcpLiveResponse = useMemo(
    () =>
      executeMcpToolCall(activeToolSchema.name, {
        ...activeToolSchema.samplePayload,
        taskPrompt: mcpPromptInput,
      }),
    [activeToolSchema, mcpPromptInput]
  );

  const handleCopyQuickCommand = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedQuickCmd(true);
    setTimeout(() => setCopiedQuickCmd(false), 2000);
  };

  const handleSpawnAutonomousSession = () => {
    const repo =
      REPRODUCIBLE_TEST_REPOSITORIES.find((r) => r.repoId === selectedRepoId) ||
      REPRODUCIBLE_TEST_REPOSITORIES[0];
    const task = runtimeEngine.enqueueTask({
      title: repo.title,
      objective: repo.taskSpecification,
      priority: 95,
      repositoryId: repo.repoId,
      requireHumanApprovalForWrites: requireHumanGate,
    });
    const session = runtimeEngine.executeAutonomousSession(task);
    setActiveSession({ ...session });
  };

  const handleResolveApprovalGate = (approved: boolean) => {
    const pendingGate = activeSession.approvalGates.find((g) => g.status === 'PENDING');
    if (!pendingGate) return;
    const updated = runtimeEngine.resolveHumanApprovalGate(
      activeSession.sessionId,
      pendingGate.gateId,
      approved,
      approved ? 'Approved by operator in AETHER 2.0 Workbench' : 'Rejected by operator in AETHER 2.0 Workbench'
    );
    setActiveSession({ ...updated });
  };

  const handleSimulateCrashRecovery = () => {
    const recovered = runtimeEngine.simulateCrashAndRecoverSession(activeSession.sessionId);
    setActiveSession({ ...recovered });
  };

  return (
    <div className="space-y-12">
      {/* Hero Section + Instant One-Command Install Bar */}
      <section className="border-b border-slate-200 dark:border-slate-800 pb-10">
        <div className="max-w-4xl space-y-4">
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
            Created by Tabrej · Apache-2.0 Open-Source Platform · {AETHER_AGENTS.length} Agents · {AETHER_SKILLS.length} Skills · {AETHER_WORKFLOWS.length} Workflows · 15 Ecosystem Adapters · 8-Tool MCP Server
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            AETHER 2.0: The Universal AI Execution Platform
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            Evolved from AETHER v1.0 by <strong>Tabrej</strong>, AETHER 2.0 preserves all <strong>711 credited engineering specs</strong> while introducing a real <strong>Autonomous Execution Runtime</strong> (process lifecycle, exclusive file-write leases, human approval gates, Merkle crash recovery), <strong>Genuine Reproducible Benchmarking</strong> (zero fabricated competitor scores), an <strong>Invariant 10-Step Self-Improvement Engine</strong>, and <strong>15 License-Audited Ecosystem Adapters</strong>.
          </p>

          {/* Instant One-Command Install All / Selective Install Box */}
          <div className="mt-6 p-4 bg-slate-950 text-slate-100 rounded-lg border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_INSTALL_MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setQuickInstallMode(m.id as 'all' | 'selective')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      quickInstallMode === m.id
                        ? 'bg-emerald-500 text-slate-950 font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyQuickCommand(activeQuickInstall.command)}
                  className="px-3 py-1 text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded border border-slate-700 transition-colors"
                >
                  {copiedQuickCmd ? 'Copied to Clipboard' : 'Copy One-Command Install'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('installer')}
                  className="px-3 py-1 text-xs font-mono font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                >
                  Customize Selective Install →
                </button>
              </div>
            </div>

            <pre className="p-2.5 bg-slate-900/90 text-emerald-400 font-mono text-xs rounded overflow-x-auto">
              $ {activeQuickInstall.command}
            </pre>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
              <span>Local Git Clone CLI: {activeQuickInstall.localCli}</span>
              <span className="text-slate-300">{activeQuickInstall.note}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('benchmarks')}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              Inspect Genuine Reproducible Benchmarks
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('repository')}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Explore 711 Credited Components
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('intelligence')}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              10-System Intelligence Sandbox
            </button>
          </div>
        </div>

        {/* AETHER 2.0 Scale & Verification Proof Strip */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">Priority 1 Implementation Audit</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {auditSummary.v2FullyImplementedCount}/{auditSummary.totalModulesAudited} Modules
              </span>
              <span className="text-xs font-mono text-slate-500">Tier 1 Verified</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Upgraded {auditSummary.v1SimulatedOrStaticCount} simulated/static v1.0 modules to full runtime execution
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">Preserved &amp; Executable Catalog</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                117 Agents · 540 Skills
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              54 Workflows · {refinementSummary.designSkillsCount} Design · {refinementSummary.videoSkillsCount} Video · {refinementSummary.cloudVpsSkillsCount} AWS/VPS
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">External Capability Ecosystems</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                15 Adapters
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                SPDX Isolated
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              OpenHands, Playwright, Agent Browser, Skyvern, OmniParser, Lightpanda, Three.js &amp; more
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">Invariant Self-Improvement Score</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-50">
                {refinementSummary.cycle2MeanScore}/100
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                from {refinementSummary.cycle1MeanScore}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Zero scoring-rule inflation; evaluated via invariant `selfImprovementEngine.ts`
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Priority 1 — Implementation-Level Audit Ledger (v1.0 Honest Baseline vs. v2.0 Upgrade) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              01. Priority 1 Implementation-Level Audit (`src/core/auditEngine.ts`)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Every advertised capability was audited against the 6-tier classification scale to separate static catalog entries and synthetic v1.0 numbers from real executable code.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            CLI: npx tsx bin/aether.ts audit
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Module &amp; Advertised Feature</th>
                <th className="py-3 px-4">v1.0 Baseline Classification &amp; Honest Finding</th>
                <th className="py-3 px-4">AETHER 2.0 Status</th>
                <th className="py-3 px-4">AETHER 2.0 Architectural Upgrade &amp; Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {auditSummary.entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 align-top">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 max-w-xs">
                    <div>{entry.advertisedFeature}</div>
                    <div className="font-mono text-[11px] text-slate-500 mt-0.5">{entry.modulePath}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-sm">
                    <div className="font-mono font-semibold text-amber-700 dark:text-amber-400">
                      {entry.v1BaselineClassification}
                    </div>
                    <div className="mt-1">{entry.v1HonestFinding}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    {entry.v2CurrentClassification}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                    <div>{entry.v2UpgradeImplemented}</div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      Verify: {entry.verificationCommand}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Priority 4 — Real Autonomous Execution Runtime & Human Approval Gate Console */}
      <section className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              02. Priority 4 Live Autonomous Runtime Console (`src/core/autonomousRuntime.ts`)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Executes actual tasks in isolated workspace sandboxes with DAG wave scheduling, exclusive file-write leases, human approval gates, and Merkle checkpoint crash recovery.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              aria-label="Select Reproducible Repository Task"
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
            >
              {REPRODUCIBLE_TEST_REPOSITORIES.map((r) => (
                <option key={r.repoId} value={r.repoId}>
                  {r.taskId}: {r.title}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={requireHumanGate}
                onChange={(e) => setRequireHumanGate(e.target.checked)}
              />
              <span>Require Human Approval Gate</span>
            </label>

            <button
              type="button"
              onClick={handleSpawnAutonomousSession}
              className="px-3.5 py-1.5 font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded hover:bg-slate-800 transition-colors"
            >
              Execute Autonomous Session
            </button>

            <button
              type="button"
              onClick={handleSimulateCrashRecovery}
              className="px-3 py-1.5 font-mono text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded hover:bg-amber-100 transition-colors"
            >
              Simulate Crash &amp; Merkle Recovery
            </button>
          </div>
        </div>

        {/* Pending Human Approval Gate Banner */}
        {activeSession.lifecycleState === 'AWAITING_HUMAN_APPROVAL' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-mono font-bold text-amber-900 dark:text-amber-200">
                [HUMAN APPROVAL GATE PENDING] Session {activeSession.sessionId} paused before mutating isolated workspace
              </div>
              <div className="text-amber-800 dark:text-amber-300">
                {activeSession.approvalGates[0]?.operationSummary} · Target Files:{' '}
                <span className="font-mono">{activeSession.approvalGates[0]?.affectedFiles.join(', ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleResolveApprovalGate(true)}
                className="px-3 py-1.5 font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded transition-colors"
              >
                Approve Write Lease &amp; Verify
              </button>
              <button
                type="button"
                onClick={() => handleResolveApprovalGate(false)}
                className="px-3 py-1.5 font-semibold text-white bg-rose-700 hover:bg-rose-600 rounded transition-colors"
              >
                Reject &amp; Terminate
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Session ID:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{activeSession.sessionId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lifecycle State:</span>
                <span
                  className={`font-bold ${
                    activeSession.lifecycleState === 'COMPLETED'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : activeSession.lifecycleState === 'AWAITING_HUMAN_APPROVAL'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {activeSession.lifecycleState}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Verification Gate:</span>
                <span className="font-bold">
                  {activeSession.verificationPassed ? 'PASSED (All Invariants Green)' : 'PENDING / UNVERIFIED'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Merkle Checkpoint:</span>
                <span className="truncate max-w-[200px]">
                  {activeSession.checkpoints[activeSession.checkpoints.length - 1]?.merkleStateHash || 'Awaiting write'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Crash Recoveries:</span>
                <span>{activeSession.crashRecoveryCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tokens / Wall-Clock:</span>
                <span>
                  {activeSession.totalTokensConsumed}t · {activeSession.totalWallClockMs}ms
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Spawned DAG Agent Processes ({activeSession.agentProcesses.length})
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded">
                {activeSession.agentProcesses.map((proc) => (
                  <div key={proc.processId} className="p-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Wave {proc.waveIndex}: {proc.role}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {proc.agentId} · Leased: {proc.leasedFiles.join(', ') || 'read-only'}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">{proc.state}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Structured Execution &amp; Tool Call Telemetry ({activeSession.structuredLogs.length} events)
            </div>
            <pre className="p-3 bg-slate-950 text-emerald-400 rounded-md font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed">
              {activeSession.structuredLogs
                .map((l) => `[${l.phase}] (${l.lifecycleState}) ${l.agentId}: ${l.message}`)
                .join('\n')}
            </pre>
          </div>
        </div>
      </section>

      {/* Section 3: Priority 5 — 15 External Capability Ecosystem Adapters + SPDX License Boundary Inspector */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              03. Priority 5 External Capability Ecosystem Adapters (15 Integrated Ecosystems)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Native protocol bridges for OpenHands, ECC, Superpowers, Playwright, Agent Browser, Browser Use, Skyvern, OmniParser, Lightpanda, AutoGen, OpenManus, ComfyUI, Three.js, Puter, and REA. Non-permissive tools (AGPL/GPL/BSL) strictly enforce out-of-process HTTP/CDP isolation.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            CLI: npx tsx bin/aether.ts ecosystems
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {EXTERNAL_ECOSYSTEM_ADAPTERS.map((eco) => (
              <button
                key={eco.id}
                type="button"
                onClick={() => setSelectedEcosystemId(eco.id)}
                className={`p-2.5 text-left rounded border transition-colors ${
                  selectedEcosystemId === eco.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold">
                  <span>{eco.id}</span>
                  <span className="text-[10px] opacity-80">{eco.spdxLicense}</span>
                </div>
                <div className="mt-1 text-[11px] opacity-85 truncate">{eco.name}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {adapterExecutionResult.adapterName}
                </div>
                <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                  License: {adapterExecutionResult.spdxLicense} · Boundary: {adapterExecutionResult.isolationMode}
                </div>
              </div>
              <span className="font-mono text-emerald-700 dark:text-emerald-400">
                Hash: {adapterExecutionResult.verificationHash}
              </span>
            </div>

            <div>
              <label htmlFor="adapter-objective" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Objective for Protocol Translation
              </label>
              <input
                id="adapter-objective"
                type="text"
                value={adapterObjective}
                onChange={(e) => setAdapterObjective(e.target.value)}
                className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
              />
            </div>

            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Generated Protocol Payload ({adapterExecutionResult.protocolFormat})
              </div>
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded font-mono text-[11px] overflow-x-auto max-h-60">
                {adapterExecutionResult.generatedPayload}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Priority 7 — Dynamic Multi-Skill Composer & MCP Server Inspector */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 text-xs">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            04. Priority 7 Dynamic Multi-Skill Composer (`ecosystemRegistry.ts`)
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Chain multiple skills from the 540-skill catalog into a composite pipeline evaluated by the invariant scoring engine.
          </p>

          <div>
            <label htmlFor="comp-name" className="block font-semibold mb-1">
              Composite Skill Name
            </label>
            <input
              id="comp-name"
              type="text"
              value={composedPipelineName}
              onChange={(e) => setComposedPipelineName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label htmlFor="skill-a-select" className="block font-semibold mb-1">
                Stage 1 Skill
              </label>
              <select
                id="skill-a-select"
                value={skillAId}
                onChange={(e) => setSkillAId(e.target.value)}
                className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
              >
                {AETHER_SKILLS.slice(0, 20).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="skill-b-select" className="block font-semibold mb-1">
                Stage 2 Skill
              </label>
              <select
                id="skill-b-select"
                value={skillBId}
                onChange={(e) => setSkillBId(e.target.value)}
                className="w-full px-2 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
              >
                {AETHER_SKILLS.slice(1, 25).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-mono space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Composite ID:</span>
              <span className="font-bold">{composedSkillResult.compositeSkillId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Execution Chain:</span>
              <span>{composedSkillResult.executionOrder.join(' -> ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Invariant Score:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {composedSkillResult.deterministicScore}/100
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                05. Live 8-Tool Model Context Protocol (MCP) Server
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Test AETHER&apos;s JSON-RPC 2.0 MCP tools (`mcp/aether-mcp-server.ts`) in real time.
              </p>
            </div>
            <select
              aria-label="Select MCP Tool"
              value={selectedMcpTool}
              onChange={(e) => setSelectedMcpTool(e.target.value)}
              className="px-2.5 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
            >
              {AETHER_MCP_TOOLS.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mcp-prompt-input" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Live MCP Tool Task Prompt (`taskPrompt` argument)
            </label>
            <input
              id="mcp-prompt-input"
              type="text"
              value={mcpPromptInput}
              onChange={(e) => setMcpPromptInput(e.target.value)}
              className="w-full px-3 py-1.5 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded"
            />
          </div>

          <pre className="p-3 bg-slate-950 text-emerald-400 rounded font-mono text-[11px] overflow-x-auto max-h-48">
            {JSON.stringify(mcpLiveResponse, null, 2)}
          </pre>
        </div>
      </section>

      {/* Section 6: 12 Polyglot Language Ecosystems */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            06. 12 Polyglot Language Ecosystems &amp; Deterministic Toolchains
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Each language ecosystem wires dedicated AST grammars, strict compiler/linter gates, test runners, and credited skills.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="py-3 px-4">Language Ecosystem</th>
                <th className="py-3 px-4">Compiler / Runtime</th>
                <th className="py-3 px-4">Deterministic Linter &amp; Test Gate</th>
                <th className="py-3 px-4 text-right">Skills / Agents</th>
                <th className="py-3 px-4">Enforced Engineering Invariants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {LANGUAGE_ECOSYSTEMS.map((eco) => (
                <tr key={eco.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 align-top">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    <div>{eco.name}</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">{eco.astParserGrammar}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{eco.compilerOrRuntime}</td>
                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    <div>{eco.linterCommand}</div>
                    <div className="text-emerald-700 dark:text-emerald-400">{eco.testRunnerCommand}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {eco.skillCount} skills · {eco.agentCount} agents
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {eco.keyInvariants.join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 7: Open-Source Upstream Credits & Inspiration Ledger */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            07. Upstream Open-Source Credits, Standards &amp; Community Attribution Ledger
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Every skill, agent, workflow, and ecosystem adapter in AETHER 2.0 explicitly credits its upstream open-source creators.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OPEN_SOURCE_CREDITS.map((item) => (
            <div
              key={item.project}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.project}</span>
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  {item.spdxLicense} · {item.compatibilityStatus}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-500">
                Author / Maintainer: {item.author} · {item.repoUrl}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.creditedContribution}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
