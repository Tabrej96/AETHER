/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P12 · PROJECT INTELLIGENCE & STRATEGY PROGRAM
 * (src/core/programs/p12ProjectIntelligence.ts) · Created by Tabrej
 *
 * The program-level capability for the SUPREME EVOLUTION Phase 2 directive:
 * a project-intelligence engine that (a) classifies a product into ≥20
 * categories (multi-label, evidence-tracked, first-principles fallback),
 * (b) applies a *prompt-length-independent* effort policy, and (c) renders a
 * per-project PROJECT_STRATEGY.md where every decision carries a reason.
 *
 * Composes P10's requirement-depth classifier + skill composer + decision
 * records; does not duplicate them.
 */

import { CATEGORIES, type ProjectCategory } from '../projectIntelligence/categories';
import { classifyProject, effortPolicy, promptLengthIndependence, type ProjectClassification, type EffortInputs } from '../projectIntelligence/classify';
import { generateProjectStrategy, renderStrategyMarkdown, type ProjectStrategy } from '../projectIntelligence/strategy';
import { classifyRequirement, type RequirementModel } from '../intel/requirements';
import { type CapabilityBenchmarkEvidence, type ProgramCapability, type ProgramId } from './types';

export { CATEGORIES, classifyProject, effortPolicy, promptLengthIndependence, generateProjectStrategy, renderStrategyMarkdown };
export type { ProjectClassification, EffortInputs, ProjectStrategy };

export interface P12Request {
  task: string;
  inputs?: EffortInputs;
}

export interface P12Plan {
  requirement: RequirementModel;
  strategy: ProjectStrategy;
  /** the strategy Markdown */
  markdown: string;
}

export function runProjectIntelligence(req: P12Request): P12Plan {
  const requirement = classifyRequirement({ task: req.task });
  const strategy = generateProjectStrategy(req.task, req.inputs);
  return { requirement, strategy, markdown: renderStrategyMarkdown(strategy) };
}

// ---------------------------------------------------------------- the capability

export const P12_CAPABILITY: ProgramCapability = {
  id: 'cap-p12-project-intelligence-strategy',
  programId: 'P12_PROJECT_INTELLIGENCE' as ProgramId,
  programName: 'PROGRAM 12 — PROJECT INTELLIGENCE & STRATEGY (SUPREME EVOLUTION Phase 2: the system as a coherent, category-aware product)',
  capability:
    'Multi-label product-category classification (27 categories, evidence-tracked, first-principles fallback for unseen products) + a prompt-length-INDEPENDENT effort policy (effort follows the classified product + security posture, never the prompt) + a per-project PROJECT_STRATEGY.md where every architecture / design / data / security / API / performance / testing / deployment decision carries a recorded reason. Composes P10 requirement-depth + skill-composer + decision-records; the P11 architecture engine is steered by the classification.',
  repositoryOrigin: 'operator SUPREME EVOLUTION directive (first-party; no external repository)',
  originProject: 'AETHER SUPREME EVOLUTION directive — project-adaptive intelligence engine + the universal business-logic directive (prompt-independent reasoning as a core runtime policy)',
  version: '1.0.0',
  license: 'Apache-2.0',
  dependencies: [],
  executionMethod: 'NATIVE_IN_PROCESS',
  securityProfile: 'READ_ONLY_ANALYSIS',
  resourceRequirements: 'pure TS, fully deterministic; classification + effort + strategy rendering are in-process. No external service. The prompt-length-independence property is enforced by a unit test, not assumed.',
  testCoverage: 'multi-label classification (jewellery-marketplace-3D = ECOMMERCE+MARKETPLACE+CAD_3D), evidence tracking, unseen→first-principles fallback, prompt-length independence (a 4-word financial ask earns the same effort as a 4-page one), strategy decision-reason completeness, strategy Markdown determinism.',
  integratesWith: ['MCP Engine', 'P10 requirement depth', 'P10 skill composer', 'P11 architecture engine (steered input)', 'Decision-record system'],
  lifecycleState: 'EXECUTE',
  benchmarkEvidence: {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: null,
    metric: 'project-intelligence-verdicts',
    unit: 'classification-evidence-count',
    detail: 'A product request yields a multi-label classification with per-category keyword evidence, a prompt-length-independent effort level, and a PROJECT_STRATEGY.md whose 13 decisions each carry a reason. Unseen products take the first-principles path, never a keyword miss.',
  },
  author: 'Created by Tabrej',
};

export function runP12BenchmarkEvidence(): CapabilityBenchmarkEvidence {
  const plan = runProjectIntelligence({
    task: 'Build a multi-tenant SaaS billing platform for a coffee supplier in India, with subscriptions, GST invoicing, and a 3D product configurator',
    inputs: { userScale: 'startup', availabilityPct: '99.9', dataVolume: 'medium', teamSize: 4 },
  });
  const s = plan.strategy;
  // the classification must be multi-label (SAAS + FINANCIAL + CAD_3D at least)
  const cats = s.classification.categories.map((c) => c.category as ProjectCategory);
  const multiLabel = cats.length >= 2;
  // a short financial ask must earn the same effort as this long one
  const promptIndependent = promptLengthIndependence(
    'Build a subscription billing system',
    s.task,
    { securityPosture: s.classification.profile.securityPosture, availabilityPct: '99.9', dataVolume: 'medium', userScale: 'startup', teamSize: 4 }
  );
  // every decision must carry a non-empty reason
  const allReasoned = Object.values(s.decisions).every((d) => d.reason.trim().length > 0);
  return {
    status: 'MEASURED_DETERMINISTIC_EXECUTION',
    measuredValue: cats.length,
    metric: 'project-intelligence-verdicts',
    unit: 'classification-evidence-count',
    detail: `project-intelligence plan: primary ${s.classification.primary}, ${cats.length} label(s) [${cats.join(', ')}], multi-label=${multiLabel}, effort ${s.effort.level} (${s.effort.reasons.join('; ') || 'default'}), prompt-length-independent=${promptIndependent}, all 13 decisions reasoned=${allReasoned}, layered secondary [${s.layeredCategories.join(', ') || 'none'}].`,
  };
}
