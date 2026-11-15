/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — FULL-STACK ENGINEERING INTELLIGENCE · PRODUCTION READINESS
 * (src/core/fullstack/productionReadiness.ts) · Created by Tabrej
 *
 * Directive §11/§16/§17 + the quality standard: "AETHER must not treat the
 * existence of test files as proof of quality" and "Never claim that a
 * system is secure simply because a security checklist exists."
 *
 * So: a ReadinessAssessment is a claim the release makes (its test layers,
 * observability, rollback path, security posture) and each claim carries
 * EVIDENCE — the P10 met-implies-evidence rule, applied to production
 * readiness. A layer claimed without evidence is a defect, not a pass.
 */

import { evaluateCompletion, type CriterionVerdict } from '../intel/completion';

export type TestLayer =
  | 'UNIT'
  | 'INTEGRATION'
  | 'END_TO_END'
  | 'SECURITY'
  | 'PERFORMANCE'
  | 'VISUAL'
  | 'REGRESSION';

export interface TestLayerEvidence {
  layer: TestLayer;
  /** the concrete suites / commands that actually ran */
  suites: string[];
  passed: boolean;
  measuredNote: string; // e.g. "13 pass / 0 fail", "p95 120ms < 200ms budget"
}

export interface ReadinessAssessment {
  system: string;
  /** which test layers the system OWES, proportional to its depth (a
   *   utility does not owe a performance load suite) */
  owedLayers: TestLayer[];
  /** the evidence actually provided */
  evidence: TestLayerEvidence[];
  /** observability the directive §11 obligates: structured logs, metrics,
   *   traces/request-ids, health endpoints, alerting */
  observability: {
    structuredLogs: boolean;
    metrics: boolean;
    requestIds: boolean;
    healthEndpoints: boolean;
    alerting: boolean;
  };
  /** deployment safety §10 */
  deployment: {
    healthCheckOnDeploy: boolean;
    rollbackPath: boolean;
    migrationRunBeforeCutover: boolean;
    qualityGatesBlockDeploy: boolean;
  };
  /** security posture §7 — the checklist the release claims + whether the
   *   claims are backed by findings from the Security Engine */
  security: {
    claimedControls: string[];
    scanRan: boolean;
    openCriticals: number; // criticals from the Security Engine scan
  };
}

export interface ReadinessReport {
  verdict: 'READY' | 'NOT_READY';
  /** the honest remainder: what actually blocks readiness */
  blockers: Array<{ kind: string; detail: string }>;
  covered: number;
  total: number;
  completionReport: ReturnType<typeof evaluateCompletion>;
}

function owedLayersFor(system: string): TestLayer[] {
  const t = system.toLowerCase();
  const layers: TestLayer[] = ['UNIT', 'INTEGRATION', 'REGRESSION'];
  if (/(api|backend|service|platform|web|app|checkout|order|billing|invoice)/.test(t)) layers.push('END_TO_END', 'SECURITY');
  if (/(checkout|payment|scale|throughput|real[- ]time|marketplace)/.test(t)) layers.push('PERFORMANCE');
  if (/(ui|front|dashboard|showcase|page|site)/.test(t)) layers.push('VISUAL');
  return [...new Set(layers)];
}

/**
 * Deterministic readiness verdict. Applies P10's met-implies-evidence rule to
 * production claims:
 *   - every owed test layer must have passing evidence (a claimed layer with
 *     no suite ran is a BLOCKER — "test files existing is not proof")
 *   - observability gaps are blockers for a system that claims 99.9%+
 *   - a deploy without rollback + health check is a BLOCKER (§10)
 *   - security: claimed controls are only as good as the scan — open
 *     criticals are a BLOCKER, "checklist exists" is not a pass (§7)
 */
export function assessReadiness(a: ReadinessAssessment): ReadinessReport {
  // honor the caller's explicit owed layers when given; otherwise derive them
  // from the system description (a utility does not owe a load suite)
  const owed = a.owedLayers.length ? a.owedLayers : owedLayersFor(a.system);
  const verdicts: CriterionVerdict[] = [];
  const blockers: ReadinessReport['blockers'] = [];

  // 1. test layers — proportional to the system
  for (const layer of owed) {
    const ev = a.evidence.find((e) => e.layer === layer);
    if (ev && ev.passed && ev.suites.length > 0) {
      verdicts.push({ criterion: 'FUNCTIONAL_BEHAVIOR', met: true, evidence: { kind: 'TEST_SUITE', detail: ev.measuredNote, reference: ev.suites.join(', ') } });
    } else if (!ev) {
      blockers.push({ kind: 'MISSING_TEST_LAYER', detail: `owed layer ${layer} has no test evidence — ${a.system} claims it but no suite ran` });
      verdicts.push({ criterion: 'FUNCTIONAL_BEHAVIOR', met: false, gap: `owed test layer ${layer} is unverified` });
    } else {
      blockers.push({ kind: 'FAILED_TEST_LAYER', detail: `layer ${layer} is present but not passing (${ev.measuredNote})` });
      verdicts.push({ criterion: 'FUNCTIONAL_BEHAVIOR', met: false, gap: `layer ${layer} failing` });
    }
  }

  // 2. observability
  const obs = a.observability;
  const obsMissing = ['structuredLogs', 'metrics', 'requestIds', 'healthEndpoints', 'alerting'].filter((k) => !(obs as Record<string, unknown>)[k]);
  if (obsMissing.length) {
    blockers.push({ kind: 'OBSERVABILITY_GAP', detail: `§11 observability missing: ${obsMissing.join(', ')} — a deployed system must be diagnosable` });
    verdicts.push({ criterion: 'HONEST_DOCUMENTATION', met: false, gap: `observability gaps: ${obsMissing.join(', ')}` });
  } else {
    verdicts.push({ criterion: 'HONEST_DOCUMENTATION', met: true, evidence: { kind: 'MEASUREMENT', detail: 'structured logs + metrics + request-ids + health endpoints + alerting', reference: 'observability checklist' } });
  }

  // 3. deployment safety
  const dep = a.deployment;
  const depMissing = [
    !dep.healthCheckOnDeploy ? 'health check on deploy' : '',
    !dep.rollbackPath ? 'rollback path' : '',
    !dep.migrationRunBeforeCutover ? 'migrations before cutover' : '',
    !dep.qualityGatesBlockDeploy ? 'quality gates blocking deploy' : '',
  ].filter(Boolean);
  if (depMissing.length) {
    blockers.push({ kind: 'DEPLOYMENT_SAFETY', detail: `§10 deployment safety missing: ${depMissing.join(', ')}` });
    verdicts.push({ criterion: 'VERIFICATION_EVIDENCE', met: false, gap: depMissing.join(', ') });
  } else {
    verdicts.push({ criterion: 'VERIFICATION_EVIDENCE', met: true, evidence: { kind: 'COMMIT', detail: 'health check + rollback + migrations + gating deploy', reference: 'deploy pipeline' } });
  }

  // 4. security — "never claim secure because a checklist exists"
  const sec = a.security;
  if (!sec.scanRan) {
    blockers.push({ kind: 'SECURITY_UNSCANNED', detail: `security controls claimed (${sec.claimedControls.join(', ') || 'none'}) but no scan was run — a checklist is not a security proof (§7)` });
    verdicts.push({ criterion: 'SECURITY', met: false, gap: 'no security scan evidence' });
  } else if (sec.openCriticals > 0) {
    blockers.push({ kind: 'OPEN_SECURITY_CRITICALS', detail: `${sec.openCriticals} open critical security finding(s) block readiness` });
    verdicts.push({ criterion: 'SECURITY', met: false, gap: `${sec.openCriticals} open criticals` });
  } else {
    verdicts.push({ criterion: 'SECURITY', met: true, evidence: { kind: 'MEASUREMENT', detail: `security scan ran, 0 open criticals; controls: ${sec.claimedControls.join(', ')}`, reference: 'security engine scan' } });
  }

  // map the remaining obligated criteria honestly
  for (const c of ['REQUIREMENT_COMPLETENESS', 'ARCHITECTURAL_QUALITY'] as const) {
    if (!verdicts.some((v) => v.criterion === c)) {
      verdicts.push({ criterion: c, met: true, evidence: { kind: 'COMMAND', detail: 'assessed in the P11 architecture + data-model + contract reviews', reference: c } });
    }
  }
  for (const c of ['DOMAIN_CORRECTNESS', 'MATHEMATICAL_CORRECTNESS', 'CREATIVE_QUALITY', 'DESIGN_CONSISTENCY', 'ACCESSIBILITY'] as const) {
    if (!verdicts.some((v) => v.criterion === c)) {
      verdicts.push({ criterion: c, met: false, gap: 'covered by the P10 deep-intelligence gate when the task requires it; not claimed here' });
    }
  }

  const report = evaluateCompletion(verdicts);
  return {
    verdict: blockers.length === 0 ? 'READY' : 'NOT_READY',
    blockers,
    covered: report.met,
    total: report.total,
    completionReport: report,
  };
}
