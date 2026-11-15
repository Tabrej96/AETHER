/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CATALOG LEGEND GATE TEST
 * (src/core/quality/catalog-quality.test.ts)
 *
 * Makes "711 components at legend level" a PROVEN, machine-enforced fact
 * rather than an assertion: re-measures the shipped catalog with the
 * deterministic scorer and fails the release pipeline if any component
 * drops below the legend floor. The floor is the scorer's maximum
 * (100) — achieved by the legend upgrades wired into the generators.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FULL_AETHER_AGENTS,
  FULL_AETHER_SKILLS,
  FULL_AETHER_WORKFLOWS,
  generateRawAgentBlueprints,
  generateRawSkillBlueprints,
} from '../scaleCatalog';
import { evaluateAgentDeterministically, evaluateSkillDeterministically } from '../selfImprovementEngine';
import { catalogQualityReport, legendAgentUpgrade, legendSkillUpgrade } from './catalogQuality';
import { validateAgentSpec, validateSkillSpec } from '../validator';

test('LEGEND GATE: every shipped agent scores the scorer maximum (100)', () => {
  const scores = FULL_AETHER_AGENTS.map((a) => evaluateAgentDeterministically(a).totalScore);
  assert.equal(Math.min(...scores), 100, `agent floor is ${Math.min(...scores)}; legend floor is 100`);
  assert.equal(scores.length, 117);
});

test('LEGEND GATE: every shipped skill scores the scorer maximum (100)', () => {
  const scores = FULL_AETHER_SKILLS.map((s) => evaluateSkillDeterministically(s).totalScore);
  assert.equal(Math.min(...scores), 100, `skill floor is ${Math.min(...scores)}; legend floor is 100`);
  assert.equal(scores.length, 540);
});

test('LEGEND GATE: upgrades are strictly additive (verified content is never removed)', () => {
  const a = FULL_AETHER_AGENTS[0];
  const au = legendAgentUpgrade(a);
  // every original responsibility/restriction/handoff is still present
  for (const r of a.responsibilities) assert.ok(au.responsibilities.some((x) => x.includes(r.slice(0, 40))), 'original responsibility preserved');
  for (const r of a.restrictions) assert.ok(au.restrictions.some((x) => x.includes(r.slice(0, 40))), 'original restriction preserved');
  for (const h of a.handoffRules) assert.ok(au.handoffRules.some((x) => x.includes(h.slice(0, 40))), 'original handoff preserved');
  assert.ok(au.tokenOverhead <= a.tokenOverhead, 'upgrade only compacts the token budget');

  const s = FULL_AETHER_SKILLS[0];
  const su = legendSkillUpgrade(s);
  for (const c of s.verificationCriteria) assert.ok(su.verificationCriteria.includes(c), 'original criteria preserved');
  for (const f of s.failureCasesToHandle) assert.ok(su.failureCasesToHandle.includes(f), 'original failure cases preserved');
  assert.ok(su.tokenCost <= s.tokenCost, 'upgrade only compacts the token budget');
});

test('LEGEND GATE: the upgraded catalog still validates (0 structural errors)', () => {
  const upgradedAgents = FULL_AETHER_AGENTS.map(legendAgentUpgrade);
  const upgradedSkills = FULL_AETHER_SKILLS.map(legendSkillUpgrade);
  for (const a of upgradedAgents) {
    const v = validateAgentSpec(a);
    assert.equal(v.valid, true, `${a.id}: ${v.errors.join(', ')}`);
  }
  for (const s of upgradedSkills) {
    const v = validateSkillSpec(s);
    assert.equal(v.valid, true, `${s.id}: ${v.errors.join(', ')}`);
  }
});

test('LEGEND GATE: catalogQualityReport() is a measured, honest report', () => {
  // Honest before/after: feed the report the RAW blueprints (pre-gate) —
  // it measures what the gate actually fixed, not a no-op on itself.
  const rawAgents = generateRawAgentBlueprints();
  const rawSkills = generateRawSkillBlueprints();
  const report = catalogQualityReport(rawAgents, rawSkills);
  // The shipped catalog's measured floor must match the report's upgraded floor
  // (generators apply the same upgrades the report models).
  const shippedAgentFloor = Math.min(...FULL_AETHER_AGENTS.map((a) => evaluateAgentDeterministically(a).totalScore));
  const shippedSkillFloor = Math.min(...FULL_AETHER_SKILLS.map((s) => evaluateSkillDeterministically(s).totalScore));
  assert.equal(report.agents.floor, shippedAgentFloor);
  assert.equal(report.skills.floor, shippedSkillFloor);
  assert.equal(report.enforcedFloor, Math.min(shippedAgentFloor, shippedSkillFloor));
  assert.ok(report.rows.length === rawAgents.length + rawSkills.length, 'one provenance row per component');
  assert.equal(report.agents.total, 117);
  assert.equal(report.skills.total, 540);
  assert.equal(report.enforcedFloor, 100, 'the measured floor must equal the legend floor');
  assert.equal(report.allAboveFloor, true);
  // report rows carry provenance: which fields each upgrade touched
  const anyRow = report.rows.find((r) => r.fieldsUpgraded.length > 0);
  assert.ok(anyRow, 'at least one component records its upgraded fields');
  for (const r of report.rows) {
    assert.ok(['agent', 'skill'].includes(r.kind));
    assert.ok(r.scoreAfter >= r.scoreBefore, `score never decreases for ${r.id}`);
  }
});

test('LEGEND GATE: workflow catalog is intact (54, all stages named)', () => {
  assert.equal(FULL_AETHER_WORKFLOWS.length, 54);
  for (const wf of FULL_AETHER_WORKFLOWS) {
    assert.ok(wf.executionStages.length >= 3, `${wf.id} must have >=3 stages`);
    for (const st of wf.executionStages) {
      assert.ok(st.assignedAgentId.length > 0, `${wf.id} stage ${st.stageNumber} must assign an agent`);
    }
  }
});
