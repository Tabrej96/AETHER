/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER SUPREME EVOLUTION — P13 · BUSINESS METRIC DISCIPLINE
 * (src/core/businessLogic/metrics.ts) · Created by Tabrej
 *
 * Directive §8: "Never add decorative analytics without a defined business
 * purpose. For every important metric, establish: its exact definition,
 * source of truth, calculation, update frequency, time period, filters,
 * permissions, interpretation, limitations. Distinguish actual business data
 * from estimates, projections and simulations. Never fabricate analytics."
 *
 * A MetricDefinition is that discipline, made a checked object.
 * `auditMetric` rejects the decorative: a metric with no defined purpose,
 * no source of truth, or no calculation is flagged — and a dashboard that
 * claims a metric without its definition cannot pass.
 */

export interface MetricDefinition {
  name: string;
  /** the business decision it serves (a metric with none is decorative) */
  purpose: string;
  /** the exact definition, in one unambiguous sentence */
  definition: string;
  /** the table/event that is the source of truth (never a cached copy) */
  sourceOfTruth: string;
  /** the calculation, precise enough to be implemented twice and match */
  calculation: string;
  /** how often it refreshes + the window it covers */
  updateFrequency: string;
  /** who may see it (permissions) */
  permissions: string;
  /** how a human should read it */
  interpretation: string;
  /** the limits of the number (what it does NOT tell you) */
  limitations: string;
  /** actual vs estimated vs projected — the honesty flag */
  dataKind: 'ACTUAL' | 'ESTIMATE' | 'PROJECTION' | 'SIMULATION';
}

export interface MetricAuditFinding {
  severity: 'BLOCKER' | 'HIGH' | 'MEDIUM';
  kind: 'DECORATIVE_METRIC' | 'NO_SOURCE_OF_TRUTH' | 'VAGUE_DEFINITION' | 'NO_CALCULATION' | 'UNLABELED_ESTIMATE' | 'NO_LIMITATIONS';
  detail: string;
}

export interface MetricAuditReport {
  metric: string;
  findings: MetricAuditFinding[];
  sound: boolean;
}

const HEDGE_WORDS = /\b(some|many|a lot|fast|slow|good|bad|roughly|about|maybe|often|usually|seems? to|high|low)\b/i;

/**
 * §8 made machine-checkable. A metric is "sound" only when it has a purpose,
 * a source of truth, a precise (non-hedged) definition + a calculation, and
 * an honest data-kind label. An ESTIMATE/PROJECTION/SIMULATION that is not
 * labeled as such is the exact "fabricated analytics" the directive forbids.
 */
export function auditMetric(m: MetricDefinition): MetricAuditReport {
  const f: MetricAuditFinding[] = [];
  if (!m.purpose.trim()) f.push({ severity: 'HIGH', kind: 'DECORATIVE_METRIC', detail: 'a metric with no defined decision purpose is decorative analytics the directive forbids' });
  if (!m.sourceOfTruth.trim()) f.push({ severity: 'BLOCKER', kind: 'NO_SOURCE_OF_TRUTH', detail: 'no source of truth — the number cannot be recomputed or trusted' });
  if (m.definition.trim().length < 12 || HEDGE_WORDS.test(m.definition)) {
    f.push({ severity: 'MEDIUM', kind: 'VAGUE_DEFINITION', detail: 'the definition is too short or hedged to be unambiguous' });
  }
  if (!m.calculation.trim()) f.push({ severity: 'BLOCKER', kind: 'NO_CALCULATION', detail: 'no calculation — two implementers would produce different numbers' });
  if (m.dataKind !== 'ACTUAL' && !m.interpretation.toLowerCase().includes(m.dataKind.toLowerCase())) {
    f.push({ severity: 'MEDIUM', kind: 'UNLABELED_ESTIMATE', detail: `an ${m.dataKind} metric must say so in its interpretation — presenting it as actual is fabricated analytics` });
  }
  if (!m.limitations.trim()) f.push({ severity: 'MEDIUM', kind: 'NO_LIMITATIONS', detail: 'every number has limits; an undefined limitation hides them' });
  return { metric: m.name, findings: f, sound: f.length === 0 };
}

/**
 * A dashboard's metrics are sound only when every one of them is. This is
 * the gate a P11/P12 readiness check would call for a data/analytics surface.
 */
export function auditDashboard(metrics: MetricDefinition[]): { sound: string[]; unsound: string[] } {
  const sound: string[] = [];
  const unsound: string[] = [];
  for (const m of metrics) (auditMetric(m).sound ? sound : unsound).push(m.name);
  return { sound, unsound };
}
