/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER v1.0 One-Command Install All & Selective Multi-Harness Installer
 * Created by Tabrej & AETHER Open-Source Contributors
 */

import React, { useMemo, useState } from 'react';
import {
  AETHER_AGENTS,
  AETHER_RULES,
  AETHER_SKILLS,
} from '../data/repositoryCatalog';
import {
  buildSelectiveInstallManifest,
  HarnessTarget,
  InstallDomainPackId,
} from '../core/validator';

const HARNESS_TARGETS: Array<{ id: HarnessTarget; label: string; description: string }> = [
  {
    id: 'all-harnesses',
    label: 'Universal All-Harnesses Bundle',
    description: 'Installs .claude/, AGENTS.md, .cursor/rules/, .opencode/, and .mcp.json together',
  },
  {
    id: 'claude-code',
    label: 'Claude Code (.claude/)',
    description: 'Generates .claude/settings.local.json + lazy-indexed subagents & MCP server wiring',
  },
  {
    id: 'codex',
    label: 'OpenAI Codex (AGENTS.md)',
    description: 'Compiles hierarchical AGENTS.md + .codex/aether-manifest.json with scoped rules',
  },
  {
    id: 'cursor',
    label: 'Cursor (.cursor/rules/)',
    description: 'Generates glob-activated .mdc rule slices + local AETHER MCP server wiring',
  },
  {
    id: 'opencode',
    label: 'OpenCode (.opencode/)',
    description: 'Configures provider-independent model routing and AST context slicing hooks',
  },
  {
    id: 'mcp-server',
    label: 'Standalone MCP Server (.mcp.json)',
    description: 'Exposes all 8 AETHER MCP tools over JSON-RPC stdio transport to any MCP client',
  },
];

const DOMAIN_PACKS: Array<{
  id: InstallDomainPackId;
  title: string;
  countBadge: string;
  description: string;
  credits: string;
}> = [
  {
    id: 'core-polyglot',
    title: 'Polyglot Core, Database & Security Pack',
    countBadge: '332 Skills · 78 Agents',
    description: 'TypeScript, Python, Rust, Go, Java/Kotlin, C++23, C#, Swift, Postgres, OAuth PKCE & Red-Team gates.',
    credits: 'Credits: Tree-sitter, PostgreSQL, Rust Tokio, Astral Ruff, OWASP',
  },
  {
    id: 'design-ui',
    title: 'Design Systems, OKLCH & 3D WebGL Craft Pack',
    countBadge: '105 Skills · 14 Agents',
    description: 'OKLCH color science, WCAG AAA / APCA contrast, Swiss grids, CSS subgrid, Three.js, D3 & Motion.',
    credits: 'Credits: Björn Ottosson OKLab, W3C APCA, Three.js, D3.js, Tailwind Labs',
  },
  {
    id: 'aws-cloud-vps',
    title: 'AWS Cloud-Native & Bare-Metal VPS Hardening Pack',
    countBadge: '85 Skills · 17 Agents',
    description: 'AWS IAM boundaries, EKS Karpenter, Aurora, Hetzner/DO VPS, WireGuard mesh, Caddy HTTP/3 & Patroni HA.',
    credits: 'Credits: OpenTofu, AWS CDK, CNCF Cilium, WireGuard, Caddy, Netfilter',
  },
  {
    id: 'video-ffmpeg',
    title: 'Programmatic Video Editing, FFmpeg & Remotion Pack',
    countBadge: '18 Skills · 8 Agents',
    description: 'FFmpeg xfade PTS sync, EBU R128 -14 LUFS loudness, Whisper ASS subtitles, Remotion & SVT-AV1.',
    credits: 'Credits: FFmpeg Project, Remotion, OpenAI Whisper.cpp, EBU R128, SVT-AV1',
  },
  {
    id: 'mcp-tools',
    title: 'AETHER 8-Tool Model Context Protocol (MCP) Server',
    countBadge: '8 JSON-RPC Tools',
    description: 'Live AST PageRank slicing, Hop-2 blast radius, 28t skill router, adversarial gate & Merkle checkpoints.',
    credits: 'Credits: Anthropic MCP Specification (MIT) & Tabrej',
  },
];

export const SelectiveInstallerView: React.FC = () => {
  const [installMode, setInstallMode] = useState<'ONE_COMMAND_ALL' | 'SELECTIVE_CUSTOM'>('ONE_COMMAND_ALL');
  const [targetHarness, setTargetHarness] = useState<HarnessTarget>('all-harnesses');
  const [selectedPacks, setSelectedPacks] = useState<InstallDomainPackId[]>([
    'core-polyglot',
    'design-ui',
    'aws-cloud-vps',
    'video-ffmpeg',
    'mcp-tools',
  ]);
  const [searchFilter, setSearchFilter] = useState('');
  const [customAgentIds, setCustomAgentIds] = useState<string[]>(() => AETHER_AGENTS.slice(0, 12).map((a) => a.id));
  const [customSkillIds, setCustomSkillIds] = useState<string[]>(() => AETHER_SKILLS.slice(0, 24).map((s) => s.id));
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>(() => AETHER_RULES.map((r) => r.id));
  const [copiedBanner, setCopiedBanner] = useState<string | null>(null);

  const togglePack = (packId: InstallDomainPackId) => {
    setInstallMode('SELECTIVE_CUSTOM');
    setSelectedPacks((prev) =>
      prev.includes(packId) ? prev.filter((p) => p !== packId) : [...prev, packId]
    );
  };

  const toggleItem = (id: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setInstallMode('SELECTIVE_CUSTOM');
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const activeAgents = useMemo(() => {
    if (installMode === 'ONE_COMMAND_ALL') return AETHER_AGENTS;
    return AETHER_AGENTS.filter((a) => {
      if (customAgentIds.includes(a.id)) return true;
      if (selectedPacks.includes('design-ui') && a.id.includes('design')) return true;
      if (selectedPacks.includes('video-ffmpeg') && a.id.includes('video')) return true;
      if (selectedPacks.includes('aws-cloud-vps') && (a.id.includes('aws') || a.id.includes('vps') || a.id.includes('cloud'))) return true;
      return false;
    });
  }, [installMode, customAgentIds, selectedPacks]);

  const activeSkills = useMemo(() => {
    if (installMode === 'ONE_COMMAND_ALL') return AETHER_SKILLS;
    return AETHER_SKILLS.filter((s) => {
      if (customSkillIds.includes(s.id)) return true;
      if (selectedPacks.includes('design-ui') && s.domain.startsWith('Design & UI Craft')) return true;
      if (selectedPacks.includes('video-ffmpeg') && s.domain.startsWith('Video & Media Engineering')) return true;
      if (selectedPacks.includes('aws-cloud-vps') && s.domain.startsWith('AWS, Cloud & VPS Infrastructure')) return true;
      if (selectedPacks.includes('core-polyglot') && s.domain.startsWith('Polyglot Core')) return true;
      return false;
    });
  }, [installMode, customSkillIds, selectedPacks]);

  const manifest = useMemo(
    () =>
      buildSelectiveInstallManifest({
        installMode,
        target: targetHarness,
        selectedPacks: installMode === 'ONE_COMMAND_ALL'
          ? ['core-polyglot', 'design-ui', 'video-ffmpeg', 'aws-cloud-vps', 'mcp-tools']
          : selectedPacks,
        agents: activeAgents,
        skills: activeSkills,
        rules: AETHER_RULES.filter((r) => selectedRuleIds.includes(r.id)),
        includeMcpServer: installMode === 'ONE_COMMAND_ALL' || selectedPacks.includes('mcp-tools'),
      }),
    [installMode, targetHarness, selectedPacks, activeAgents, activeSkills, selectedRuleIds]
  );

  const copyText = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedBanner(label);
    setTimeout(() => setCopiedBanner(null), 2500);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSkillPreview = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return AETHER_SKILLS.filter((s) =>
      !q || `${s.id} ${s.name} ${s.domain} ${s.attribution}`.toLowerCase().includes(q)
    ).slice(0, 18);
  }, [searchFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="text-xs font-mono text-slate-500">
            Created by Tabrej · Universal POSIX &amp; NPX Installer (`install.sh` &amp; `bin/aether.ts`)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mt-1">
            One-Command Install All OR Selective Domain &amp; Skill Installer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Install the entire 711-component AETHER v1.0 harness + 8-tool MCP server in one command, or cherry-pick
            specific domain packs and skills with zero context window bloat.
          </p>
        </div>

        {/* Mode Switcher: Install All vs Selective */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInstallMode('ONE_COMMAND_ALL');
              setSelectedPacks(['core-polyglot', 'design-ui', 'aws-cloud-vps', 'video-ffmpeg', 'mcp-tools']);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              installMode === 'ONE_COMMAND_ALL'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            One-Command Install All (711 + MCP)
          </button>
          <button
            type="button"
            onClick={() => setInstallMode('SELECTIVE_CUSTOM')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              installMode === 'SELECTIVE_CUSTOM'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            Selective Pack &amp; Skill Install
          </button>
        </div>
      </div>

      {copiedBanner && (
        <div className="p-3 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md">
          Copied to clipboard: {copiedBanner}
        </div>
      )}

      {/* Step 1: Select Harness Target */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Step 1: Choose Target AI Coding Harness (or Universal All-Harnesses Bundle)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {HARNESS_TARGETS.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => setTargetHarness(h.id)}
              className={`p-3 text-left rounded-lg border transition-colors ${
                targetHarness === h.id
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="font-semibold text-xs">{h.label}</div>
              <div className="text-[11px] opacity-75 mt-1 leading-snug">{h.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step 2: Domain Packs & Granular Component Picker */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                Step 2: Select Domain Packs ({manifest.selectedPacks.length} / 5 Packs Active)
              </h2>
              <button
                type="button"
                onClick={() => {
                  setInstallMode('ONE_COMMAND_ALL');
                  setSelectedPacks(['core-polyglot', 'design-ui', 'aws-cloud-vps', 'video-ffmpeg', 'mcp-tools']);
                }}
                className="text-xs font-mono text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Select All 711 Components
              </button>
            </div>

            <div className="space-y-2.5">
              {DOMAIN_PACKS.map((pack) => {
                const isChecked =
                  installMode === 'ONE_COMMAND_ALL' || selectedPacks.includes(pack.id);
                return (
                  <label
                    key={pack.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePack(pack.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{pack.title}</span>
                        <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                          {pack.countBadge}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        {pack.description}
                      </p>
                      <div className="text-[11px] font-mono text-slate-500 mt-1">{pack.credits}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Granular Skill Search & Cherry-Picker */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Granular Skill &amp; Agent Cherry-Picker (with Upstream Credits)
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {manifest.selectedSkills.length} Skills · {manifest.selectedAgents.length} Agents
                </span>
              </div>
              <input
                type="search"
                aria-label="Search skills to cherry-pick"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter skills by keyword or credit (e.g. FFmpeg, OKLCH, WireGuard, AWS, Rust)..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {filteredSkillPreview.map((skill) => {
                  const checked = manifest.selectedSkills.includes(skill.id);
                  return (
                    <label
                      key={skill.id}
                      className="flex items-start gap-2.5 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(skill.id, customSkillIds, setCustomSkillIds)}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{skill.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {skill.domain} · Idle: 28t · {skill.attribution}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Scoped Rules */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                Scoped Verification Rules ({selectedRuleIds.length} / {AETHER_RULES.length})
              </div>
              {AETHER_RULES.map((rule) => (
                <label
                  key={rule.id}
                  className="flex items-start gap-2.5 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRuleIds.includes(rule.id)}
                    onChange={() => toggleItem(rule.id, selectedRuleIds, setSelectedRuleIds)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{rule.name}</div>
                    <div className="font-mono text-[11px] text-slate-500">
                      Glob: {rule.scopeGlob} · {rule.attribution}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: One-Command Terminal Commands & Downloadable Config Bundle */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-5">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="text-slate-500">AETHER Idle Context</div>
                <div className="mt-1 text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  {manifest.idleTokenOverhead} tokens
                </div>
                <div className="text-[11px] text-slate-500">28t lazy skill router</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="text-slate-500">Static Harness Cost</div>
                <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {manifest.eccEquivalentTokenOverhead.toLocaleString()} tokens
                </div>
                <div className="text-[11px] text-slate-500">Upfront markdown dump</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="text-slate-500">MCP Tools Wired</div>
                <div className="mt-1 text-lg font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-400">
                  {manifest.mcpToolsCount} Tools
                </div>
                <div className="text-[11px] text-slate-500">0 hook conflicts</div>
              </div>
            </div>

            {/* Option A: One-Liner curl | bash */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Option A: Universal One-Command Shell Install (`install.sh`)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(manifest.curlPipeBashCommand, 'Shell Install Command')}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded hover:opacity-90"
                >
                  Copy Shell One-Liner
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-emerald-400 rounded-md text-xs font-mono overflow-x-auto">
                $ {manifest.curlPipeBashCommand}
              </pre>
            </div>

            {/* Option B: Local Git Repo / NPX CLI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Option B: Local Repository CLI (`bin/aether.ts`)
                </span>
                <button
                  type="button"
                  onClick={() => copyText(`${manifest.generatedCliCommand} --write .`, 'NPX CLI Command')}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded hover:opacity-90"
                >
                  Copy CLI Command
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-indigo-300 rounded-md text-xs font-mono overflow-x-auto">
                $ {manifest.generatedCliCommand} --write .
              </pre>
            </div>

            {/* Option C: Direct Download to User Computer */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => downloadFile('aether-manifest.json', manifest.generatedConfigFileContent)}
                className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
              >
                Download Compiled `aether-manifest.json`
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    'install.sh',
                    `#!/usr/bin/env bash\n# AETHER v1.0 Installer (Created by Tabrej)\n${manifest.generatedCliCommand} --write .\n`
                  )
                }
                className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors"
              >
                Download Executable `install.sh`
              </button>
            </div>

            {/* Generated Files Map */}
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Files Written to Your Project (`{manifest.configPath}`)
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-md">
                {manifest.generatedFilesMap.map((file) => (
                  <div key={file.path} className="p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">{file.path}</div>
                      <div className="text-[11px] text-slate-500">{file.description}</div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">{file.sizeBytes} B</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Manifest Preview */}
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Compiled Manifest &amp; MCP Server Configuration Preview
              </div>
              <pre className="p-3 bg-slate-950 text-slate-200 rounded-md text-xs font-mono overflow-x-auto max-h-72">
                {manifest.generatedConfigFileContent}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
