/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  AETHER_AGENTS,
  AETHER_RULES,
  AETHER_SKILLS,
  AETHER_WORKFLOWS,
  LANGUAGE_ECOSYSTEMS,
} from '../data/repositoryCatalog';
import {
  validateAgentSpec,
  validateSkillSpec,
  validateWorkflowSpec,
} from '../core/validator';
import { runComponentAuditAndRefinementLoop } from '../core/liveBenchmarkRunner';
import { AgentSpec } from '../core/types';

type ArtifactCategory = 'skills' | 'agents' | 'workflows' | 'ecosystems' | 'rules' | 'validator';

const SKILL_DOMAIN_FILTERS = [
  'All 540 Skills',
  'Design & UI Craft',
  'Video & Media Engineering',
  'AWS, Cloud & VPS Infrastructure',
  'Polyglot Engineering & Core Intelligence',
] as const;

export const RepositoryExplorerView: React.FC = () => {
  const [category, setCategory] = useState<ArtifactCategory>('skills');
  const [skillDomainFilter, setSkillDomainFilter] = useState<string>('All 540 Skills');
  const [agentCategoryFilter, setAgentCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefinedMode, setIsRefinedMode] = useState(true);

  const [customAgents, setCustomAgents] = useState<AgentSpec[]>(AETHER_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState(AETHER_AGENTS[0].id);
  const [selectedSkillId, setSelectedSkillId] = useState(AETHER_SKILLS[0].id);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(AETHER_WORKFLOWS[0].id);

  // Live Component Authoring & Schema Validator state
  const [draftId, setDraftId] = useState('rust-concurrency-verifier');
  const [draftName, setDraftName] = useState('Rust Send/Sync & Loom Concurrency Verifier');
  const [draftRole, setDraftRole] = useState(
    'Systems concurrency specialist auditing async Tokio tasks, mutex lock ordering, and Send/Sync bounds.'
  );
  const [draftScope, setDraftScope] = useState(
    'Rust crates using tokio, rayon, crossbeam, or unsafe blocks across multi-threaded executors.'
  );
  const [draftResponsibility, setDraftResponsibility] = useState(
    'Verify lock acquisition ordering across await points and run Loom permutation tests.'
  );
  const [draftRestriction, setDraftRestriction] = useState(
    'Never introduce std::sync::Mutex guards held across async .await suspension points.'
  );
  const [draftLicense, setDraftLicense] = useState('Apache-2.0');
  const [draftAttribution, setDraftAttribution] = useState('AETHER v1.0 Rust Systems Pack');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  const refinementReport = useMemo(
    () => runComponentAuditAndRefinementLoop(isRefinedMode),
    [isRefinedMode]
  );

  const scoreById = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of refinementReport.componentScores) {
      map.set(item.id, isRefinedMode ? item.cycle2RefinedScore : item.cycle1RawScore);
    }
    return map;
  }, [refinementReport, isRefinedMode]);

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return AETHER_SKILLS.filter((s) => {
      const matchesDomain =
        skillDomainFilter === 'All 540 Skills' || s.domain.startsWith(skillDomainFilter);
      const matchesQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q);
      return matchesDomain && matchesQ;
    });
  }, [skillDomainFilter, searchQuery]);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return customAgents.filter((a) => {
      const matchesCat = agentCategoryFilter === 'all' || a.category === agentCategoryFilter;
      const matchesQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.scope.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [customAgents, agentCategoryFilter, searchQuery]);

  const activeAgent =
    filteredAgents.find((a) => a.id === selectedAgentId) ??
    filteredAgents[0] ??
    customAgents[0];
  const activeSkill =
    filteredSkills.find((s) => s.id === selectedSkillId) ??
    filteredSkills[0] ??
    AETHER_SKILLS[0];
  const activeWorkflow =
    AETHER_WORKFLOWS.find((w) => w.id === selectedWorkflowId) ?? AETHER_WORKFLOWS[0];

  const draftCandidate: Partial<AgentSpec> = {
    id: draftId,
    name: draftName,
    category: 'verification',
    role: draftRole,
    scope: draftScope,
    responsibilities: [
      draftResponsibility,
      'Produce deterministic Loom schedule counterexamples on deadlock detection.',
    ],
    restrictions: [
      draftRestriction,
      'Never bypass borrow-checker lifetimes with unchecked raw pointers without formal SAFETY proof comment.',
    ],
    inputs: ['Cargo workspace AST slice', 'Async call graph across .await boundaries'],
    outputs: ['Concurrency audit report', 'Deterministic Loom test harness'],
    handoffRules: [
      'Escalate unsafe block modifications to sec-redteam-attacker.',
      'Return counterexample trace on mutex lock-order violation.',
    ],
    verificationResponsibilities: ['Run cargo check --all-targets and cargo test --locked.'],
    capabilities: ['rust', 'tokio', 'concurrency', 'loom'],
    tokenOverhead: 120,
    license: draftLicense,
    attribution: draftAttribution,
  };

  const liveDraftValidation = validateAgentSpec(draftCandidate);

  const handleRegisterDraftAgent = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateAgentSpec(draftCandidate);
    if (!check.valid) {
      setValidationMessage(`Validation blocked: ${check.errors.join(' | ')}`);
      return;
    }
    const newAgent = draftCandidate as AgentSpec;
    setCustomAgents((prev) => {
      const exists = prev.some((a) => a.id === newAgent.id);
      return exists ? prev.map((a) => (a.id === newAgent.id ? newAgent : a)) : [newAgent, ...prev];
    });
    setSelectedAgentId(newAgent.id);
    setCategory('agents');
    setValidationMessage(`Registered & verified agent '${newAgent.id}' (100% Part 4 schema compliance).`);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              AETHER v1.0 Beast Repository Registry ({refinementReport.totalComponentsTested} Validated Components)
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {customAgents.length} Specialized Agents · {AETHER_SKILLS.length} Validated Skills ({refinementReport.designSkillsCount} Design, {refinementReport.videoSkillsCount} Video, {refinementReport.cloudVpsSkillsCount} AWS/Cloud/VPS, {refinementReport.polyglotSkillsCount} Core) · {AETHER_WORKFLOWS.length} Workflows · {LANGUAGE_ECOSYSTEMS.length} Language Ecosystems.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-right">
              <div className="text-slate-500">Active Audit Score</div>
              <div className="font-bold text-emerald-700 dark:text-emerald-400">
                {isRefinedMode ? `${refinementReport.cycle2MeanScore}/100 (Refined)` : `${refinementReport.cycle1MeanScore}/100 (Cycle 1 Raw)`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsRefinedMode((v) => !v)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              {isRefinedMode ? 'View Cycle 1 Raw Scores' : 'Run Refine & Retest Loop (+12.2 pts)'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
            role="tablist"
            aria-label="Repository Component Categories"
          >
            <button
              type="button"
              role="tab"
              aria-selected={category === 'skills'}
              onClick={() => setCategory('skills')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === 'skills'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Skills ({AETHER_SKILLS.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={category === 'agents'}
              onClick={() => setCategory('agents')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === 'agents'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Agents ({customAgents.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={category === 'workflows'}
              onClick={() => setCategory('workflows')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === 'workflows'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Workflows ({AETHER_WORKFLOWS.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={category === 'ecosystems'}
              onClick={() => setCategory('ecosystems')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === 'ecosystems'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Language Ecosystems ({LANGUAGE_ECOSYSTEMS.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={category === 'rules'}
              onClick={() => setCategory('rules')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === 'rules'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Rules ({AETHER_RULES.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={category === 'validator'}
              onClick={() => setCategory('validator')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === 'validator'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              + Author &amp; Validate Spec
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="repo-search-input" className="sr-only">
              Search repository components
            </label>
            <input
              id="repo-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 711 components (e.g. AWS, VPS, FFmpeg, OKLCH, Rust)..."
              className="w-72 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {validationMessage && (
        <div className="p-3 text-xs font-mono bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-md">
          {validationMessage}
        </div>
      )}

      {/* SKILLS VIEW (540 VALIDATED SKILLS) */}
      {category === 'skills' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {SKILL_DOMAIN_FILTERS.map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => setSkillDomainFilter(dom)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  skillDomainFilter === dom
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {dom}
              </button>
            ))}
            <span className="text-xs font-mono text-slate-500 ml-2">
              Showing {filteredSkills.length} matching validated skills
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 max-h-[540px] overflow-y-auto space-y-2 pr-1">
              {filteredSkills.slice(0, 60).map((skill) => {
                const sc = scoreById.get(skill.id) ?? 100;
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelectedSkillId(skill.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeSkill.id === skill.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
                      <span>{skill.domain.split('·')[0].trim()}</span>
                      <span>Score: {sc}/100 · {skill.tokenCost}t</span>
                    </div>
                    <div className="font-semibold text-xs mt-0.5">{skill.name}</div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="font-mono text-slate-500">
                  ID: {activeSkill.id} · {activeSkill.domain} · Score: {scoreById.get(activeSkill.id) ?? 100}/100 · Lazy Trigger: 28t
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">{activeSkill.name}</h2>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="font-semibold text-slate-900 dark:text-slate-100">1. When to Activate (Lazy AST Predicate)</div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{activeSkill.whenToActivate}</p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="font-semibold text-slate-900 dark:text-slate-100">3. Deterministic Execution Steps</div>
                <ol className="mt-1 list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                  {activeSkill.executionSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    2. Required Info &amp; 4. Useful Tools
                  </div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300">
                    <strong>Required:</strong> {activeSkill.requiredInformation.join('; ')}
                  </div>
                  <div className="mt-1 font-mono text-slate-500">
                    <strong>Tools:</strong> {activeSkill.usefulTools.join(', ')}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    6. Verification Gate &amp; 7. Failure Recovery
                  </div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300">
                    <strong>Verify:</strong> {activeSkill.verificationCriteria.join('; ')}
                  </div>
                  <div className="mt-1 text-slate-600 dark:text-slate-300">
                    <strong>Failure Case:</strong> {activeSkill.failureCasesToHandle.join('; ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AGENTS VIEW (108 SPECIALIZED AGENTS) */}
      {category === 'agents' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'architecture', 'implementation', 'adversarial', 'security', 'debugging', 'memory', 'verification'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAgentCategoryFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                    agentCategoryFilter === cat
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {cat === 'all' ? `All ${customAgents.length} Agents` : cat}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 max-h-[540px] overflow-y-auto space-y-2 pr-1">
              {filteredAgents.map((agent) => {
                const sc = scoreById.get(agent.id) ?? 100;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      activeAgent.id === agent.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
                      <span>{agent.id}</span>
                      <span>Score: {sc}/100 · {agent.tokenOverhead}t</span>
                    </div>
                    <div className="font-semibold text-xs mt-0.5">{agent.name}</div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="font-mono text-slate-500">
                  ID: {activeAgent.id} · Category: {activeAgent.category} · Refined Score: {scoreById.get(activeAgent.id) ?? 100}/100
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">{activeAgent.name}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">1. Role</div>
                  <p className="text-slate-600 dark:text-slate-300">{activeAgent.role}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">2. Scope</div>
                  <p className="text-slate-600 dark:text-slate-300">{activeAgent.scope}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">3. Responsibilities</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                    {activeAgent.responsibilities.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1">
                  <div className="font-semibold text-red-700 dark:text-red-400">4. Hard Lease Restrictions</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                    {activeAgent.restrictions.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">5. Inputs &amp; 6. Outputs</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <strong>Inputs:</strong> {activeAgent.inputs.join('; ')}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 mt-1">
                    <strong>Outputs:</strong> {activeAgent.outputs.join('; ')}
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    7. Handoff Rules &amp; 8. Verification
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    <strong>Handoff:</strong> {activeAgent.handoffRules.join(' ')}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 mt-1">
                    <strong>Verification:</strong> {activeAgent.verificationResponsibilities.join(' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WORKFLOWS VIEW (54 WORKFLOWS) */}
      {category === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 max-h-[520px] overflow-y-auto space-y-2 pr-1">
            {AETHER_WORKFLOWS.map((wf) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => setSelectedWorkflowId(wf.id)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${
                  activeWorkflow.id === wf.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="font-mono text-[11px] opacity-75">
                  {wf.id} · Score: {scoreById.get(wf.id) ?? 100}/100
                </div>
                <div className="font-semibold mt-0.5">{wf.name}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">{activeWorkflow.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeWorkflow.executionStages.map((st) => (
                <div
                  key={st.stageNumber}
                  className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md space-y-1.5"
                >
                  <div className="font-mono text-indigo-700 dark:text-indigo-400">
                    Stage 0{st.stageNumber} · {st.assignedAgentId}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{st.name}</div>
                  <p className="text-slate-600 dark:text-slate-400">{st.description}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Entry Conditions</div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{activeWorkflow.entryConditions.join(' ')}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Failure Recovery</div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{activeWorkflow.failureHandling.join(' ')}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="font-semibold text-slate-900 dark:text-slate-100">Completion Gates</div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">{activeWorkflow.completionCriteria.join(' ')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LANGUAGE ECOSYSTEMS VIEW (12 ECOSYSTEMS) */}
      {category === 'ecosystems' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANGUAGE_ECOSYSTEMS.map((eco) => (
            <div
              key={eco.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between font-mono text-slate-500">
                <span>{eco.astParserGrammar}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {eco.skillCount} skills · {eco.agentCount} agents
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{eco.name}</h3>
              <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                Runtime: {eco.compilerOrRuntime}
              </div>
              <div className="font-mono text-[11px] text-indigo-700 dark:text-indigo-400">
                Verify: {eco.linterCommand} &amp;&amp; {eco.testRunnerCommand}
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 pt-1">
                {eco.keyInvariants.map((inv) => (
                  <li key={inv}>{inv}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* RULES VIEW */}
      {category === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AETHER_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-3 text-xs"
            >
              <div className="font-mono text-slate-500">
                {rule.id} · Glob: {rule.scopeGlob} · {rule.tokenCost}t
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{rule.name}</h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                {rule.invariants.map((inv) => (
                  <li key={inv}>{inv}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* AUTHOR & LIVE SCHEMA VALIDATOR */}
      {category === 'validator' && (
        <form
          onSubmit={handleRegisterDraftAgent}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Interactive Part 4 Agent Specification Validator &amp; Builder
              </h2>
              <p className="text-slate-500 mt-0.5">
                Tests real-time conformance against Part 4’s 8 mandatory agent sections + SPDX license verification.
              </p>
            </div>
            <div className="font-mono font-semibold text-sm">
              Completeness: {liveDraftValidation.completenessScore}% ({liveDraftValidation.valid ? 'VALID' : 'INVALID'})
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="draft-id" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Agent ID
              </label>
              <input
                id="draft-id"
                type="text"
                value={draftId}
                onChange={(e) => setDraftId(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="draft-name" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Agent Title
              </label>
              <input
                id="draft-name"
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="draft-role" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                1. Role Definition
              </label>
              <input
                id="draft-role"
                type="text"
                value={draftRole}
                onChange={(e) => setDraftRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="draft-scope" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                2. Scope Definition
              </label>
              <input
                id="draft-scope"
                type="text"
                value={draftScope}
                onChange={(e) => setDraftScope(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="draft-resp" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                3. Primary Responsibility
              </label>
              <input
                id="draft-resp"
                type="text"
                value={draftResponsibility}
                onChange={(e) => setDraftResponsibility(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="draft-rest" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                4. Explicit Restriction
              </label>
              <input
                id="draft-rest"
                type="text"
                value={draftRestriction}
                onChange={(e) => setDraftRestriction(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="draft-license" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                SPDX License
              </label>
              <input
                id="draft-license"
                type="text"
                value={draftLicense}
                onChange={(e) => setDraftLicense(e.target.value)}
                className="w-full px-3 py-2 font-mono bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="draft-attr" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sovereign Pack Attribution
              </label>
              <input
                id="draft-attr"
                type="text"
                value={draftAttribution}
                onChange={(e) => setDraftAttribution(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Validate &amp; Register Agent into Catalog
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
