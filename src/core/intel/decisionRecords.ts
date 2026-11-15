/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — DEEP INTELLIGENCE DIRECTIVE · DECISION RECORDS
 * (src/core/intel/decisionRecords.ts) · Created by Tabrej
 *
 * Directive 7: "concise, auditable decision summaries for important
 * decisions. Each: what / requirements / alternatives / selected /
 * justification / risks / assumptions / verification method. Do not expose
 * private internal chain-of-thought. For calculations, actual formulas and
 * reproducible results; for external rules, sources and dates."
 *
 * So: a DecisionRecord is a closed, machine-renderable type. renderDecision
 * Markdown is deterministic and contains ONLY public conclusions + evidence —
 * never a raw reasoning trace.
 */

export interface DecisionRecord {
  id: string;
  /** what needs to be decided (short noun phrase) */
  decision: string;
  /** the relevant requirements that constrain it */
  requirements: string[];
  /** alternatives considered, with one-line why-rejected (chosen gets justification) */
  alternatives: Array<{ name: string; verdict: 'SELECTED' | 'REJECTED'; reason: string }>;
  selected: string;
  justification: string;
  risks: string[];
  assumptions: string[];
  /** how the decision was / will be verified (command, test, measurement) */
  verificationMethod: string;
  /** calculations: the ACTUAL formula + a reproducible worked value */
  formula?: { expression: string; workedExample: string };
  /** external rules: source + effective date, never bare */
  externalRuleSources?: Array<{ rule: string; source: string; effectiveOnIso: string }>;
}

/** validate the record is complete enough to be auditable */
export function validateDecisionRecord(d: DecisionRecord): string[] {
  const problems: string[] = [];
  if (!d.decision.trim()) problems.push('decision statement missing');
  if (!d.alternatives.length) problems.push('no alternatives considered');
  if (!d.alternatives.some((a) => a.verdict === 'SELECTED')) problems.push('no alternative marked SELECTED');
  if (!d.verificationMethod.trim()) problems.push('verification method missing');
  if (d.formula && !d.formula.workedExample) problems.push('formula present without a worked example');
  for (const s of d.externalRuleSources ?? []) {
    if (!s.source.trim() || !s.effectiveOnIso.trim()) problems.push(`external rule '${s.rule}' lacks source or effective date`);
  }
  return problems;
}

/** deterministic Markdown rendering — audit output, not chain-of-thought */
export function renderDecisionMarkdown(d: DecisionRecord): string {
  const L: string[] = [];
  L.push(`### Decision ${d.id}: ${d.decision}`);
  L.push('');
  L.push(`**Requirements:** ${d.requirements.join(' · ') || '(none recorded)'}`);
  L.push('');
  L.push('| Alternative | Verdict | Reason |');
  L.push('| :-- | :-- | :-- |');
  for (const a of d.alternatives) L.push(`| ${a.name} | **${a.verdict}** | ${a.reason} |`);
  L.push('');
  L.push(`**Selected:** ${d.selected}`);
  L.push(`**Why:** ${d.justification}`);
  if (d.risks.length) L.push(`**Risks / trade-offs:** ${d.risks.join(' · ')}`);
  if (d.assumptions.length) L.push(`**Assumptions:** ${d.assumptions.join(' · ')}`);
  L.push(`**Verification:** ${d.verificationMethod}`);
  if (d.formula) {
    L.push(`**Formula:** \`${d.formula.expression}\``);
    L.push(`Worked: ${d.formula.workedExample}`);
  }
  if (d.externalRuleSources?.length) {
    L.push('| External rule | Source | Effective |');
    L.push('| :-- | :-- | :-- |');
    for (const s of d.externalRuleSources) L.push(`| ${s.rule} | ${s.source} | ${s.effectiveOnIso} |`);
  }
  L.push('');
  return L.join('\n');
}
