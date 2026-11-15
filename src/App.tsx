/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { OverviewResearchView } from './components/OverviewResearchView';
import { IntelligenceLabView } from './components/IntelligenceLabView';
import { RepositoryExplorerView } from './components/RepositoryExplorerView';
import { BenchmarkSuiteView } from './components/BenchmarkSuiteView';
import { SelectiveInstallerView } from './components/SelectiveInstallerView';
import { runComponentAuditAndRefinementLoop } from './core/liveBenchmarkRunner';
import { runImplementationAudit } from './core/auditEngine';

type ActiveTab = 'overview' | 'intelligence' | 'repository' | 'benchmarks' | 'installer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [auditBanner, setAuditBanner] = useState<string | null>(null);

  const handleRunFullRepositoryAudit = () => {
    const audit = runImplementationAudit();
    const report = runComponentAuditAndRefinementLoop(true);
    setAuditBanner(
      `AETHER 2.0 Audit & Invariant Branch Verification Complete: ${audit.v2FullyImplementedCount}/${audit.totalModulesAudited} Core Modules Fully Implemented · ${report.agentsCount} Agents, ${report.skillsCount} Skills, ${report.workflowsCount} Workflows & 15 Ecosystem Adapters · Branch-Verified Score: ${report.cycle2MeanScore}/100 (${report.passRateCycle2Pct}% Pass in ${report.executionDurationMs}ms).`
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract (frontend-design Section 2) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('overview');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0"
        >
          AETHER 2.0
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'overview'
                ? 'text-slate-900 dark:text-slate-50 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            2.0 Platform &amp; Runtime
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('benchmarks')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'benchmarks'
                ? 'text-slate-900 dark:text-slate-50 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            Genuine Benchmarks
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('repository')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'repository'
                ? 'text-slate-900 dark:text-slate-50 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            711-Component Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('intelligence')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'intelligence'
                ? 'text-slate-900 dark:text-slate-50 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            10x Intelligence
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('installer')}
            className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
              activeTab === 'installer'
                ? 'text-slate-900 dark:text-slate-50 underline underline-offset-8 decoration-2'
                : ''
            }`}
          >
            One-Command Installer
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleRunFullRepositoryAudit}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
          >
            Audit, Verify &amp; Refine All 711
          </button>
        </div>
      </header>

      {/* Optional Validation Audit Banner */}
      {auditBanner && (
        <div
          role="status"
          className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-4 text-xs font-mono text-emerald-900 dark:text-emerald-200"
        >
          <span>{auditBanner}</span>
          <button
            type="button"
            onClick={() => setAuditBanner(null)}
            className="underline hover:no-underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {activeTab === 'overview' && <OverviewResearchView onNavigateTab={setActiveTab} />}
        {activeTab === 'intelligence' && <IntelligenceLabView />}
        {activeTab === 'repository' && <RepositoryExplorerView />}
        {activeTab === 'benchmarks' && <BenchmarkSuiteView />}
        {activeTab === 'installer' && <SelectiveInstallerView />}
      </main>

      {/* Clean Editorial Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 px-6 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            AETHER 2.0 Universal AI Execution Platform · Created by Tabrej · 117 Agents · 540 Skills · 54 Workflows · 15 Ecosystem Adapters · 8-Tool MCP Server · Apache-2.0
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('benchmarks')}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Genuine Benchmark Suite
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('installer')}
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              One-Command &amp; Selective Installer
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
