/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROJECT EXPANSION ENGINE TESTS
 * (src/core/projectExpansionEngine.test.ts) · Created by Tabrej
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  expand,
  detectIndustry,
  generatePillars,
  researchCompetitors,
  generateAcceptanceCriteria,
  saveExpansion,
  loadExpansion,
  listExpansions,
} from './projectExpansionEngine';

describe('ProjectExpansionEngine', () => {
  describe('detectIndustry', () => {
    it('detects SaaS from subscription keywords', () => {
      const industry = detectIndustry('Build a SaaS subscription billing platform');
      assert.equal(industry.id, 'saas');
      assert.ok(industry.name.length > 0);
      assert.ok(industry.marketLeaders.length >= 3);
    });

    it('detects e-commerce from shopping keywords', () => {
      const industry = detectIndustry('Create an online store with shopping cart and checkout');
      assert.equal(industry.id, 'ecommerce');
    });

    it('detects fintech from payment keywords', () => {
      const industry = detectIndustry('Build a payment processing and wallet system');
      assert.equal(industry.id, 'fintech');
    });

    it('detects healthcare from medical keywords', () => {
      const industry = detectIndustry('Create a patient management and EMR system');
      assert.equal(industry.id, 'healthcare');
    });

    it('returns generic industry for unknown prompt', () => {
      const industry = detectIndustry('Build something completely new');
      assert.equal(industry.id, 'generic');
      assert.ok(industry.name.includes('Generic'));
    });

    it('includes compliance requirements', () => {
      const industry = detectIndustry('Build a SaaS platform');
      assert.ok(industry.complianceRequirements.length > 0);
    });

    it('includes tech stack', () => {
      const industry = detectIndustry('Build a SaaS platform');
      assert.ok(industry.techStack.length > 0);
    });
  });

  describe('generatePillars', () => {
    it('generates exactly 19 pillars', () => {
      const industry = detectIndustry('SaaS subscription platform');
      const pillars = generatePillars(industry);
      assert.equal(pillars.length, 19);
    });

    it('each pillar has required fields', () => {
      const industry = detectIndustry('E-commerce platform');
      const pillars = generatePillars(industry);

      for (const pillar of pillars) {
        assert.ok(pillar.id, `Pillar missing id: ${JSON.stringify(pillar)}`);
        assert.ok(pillar.name, `Pillar ${pillar.id} missing name`);
        assert.ok(pillar.description, `Pillar ${pillar.id} missing description`);
        assert.ok(Array.isArray(pillar.requirements), `Pillar ${pillar.id} requirements not array`);
        assert.ok(pillar.agent, `Pillar ${pillar.id} missing agent`);
        assert.ok(Array.isArray(pillar.dependencies), `Pillar ${pillar.id} dependencies not array`);
      }
    });

    it('each pillar has at least one requirement', () => {
      const industry = detectIndustry('Fintech payment system');
      const pillars = generatePillars(industry);

      for (const pillar of pillars) {
        assert.ok(pillar.requirements.length > 0, `Pillar ${pillar.id} has no requirements`);
      }
    });

    it('first pillar has no dependencies', () => {
      const industry = detectIndustry('Social media platform');
      const pillars = generatePillars(industry);
      assert.equal(pillars[0].dependencies.length, 0);
    });

    it('pillar IDs are sequential', () => {
      const industry = detectIndustry('Education platform');
      const pillars = generatePillars(industry);

      for (let i = 0; i < pillars.length; i++) {
        const expectedId = `P${String(i + 1).padStart(2, '0')}`;
        assert.equal(pillars[i].id, expectedId);
      }
    });
  });

  describe('researchCompetitors', () => {
    it('returns 3-5 competitors for known industry', () => {
      const industry = detectIndustry('SaaS platform');
      const competitors = researchCompetitors(industry);
      assert.ok(competitors.length >= 3, 'Should have at least 3 competitors');
      assert.ok(competitors.length <= 5, 'Should have at most 5 competitors');
    });

    it('each competitor has required fields', () => {
      const industry = detectIndustry('E-commerce platform');
      const competitors = researchCompetitors(industry);

      for (const competitor of competitors) {
        assert.ok(competitor.name, 'Competitor missing name');
        assert.ok(competitor.url, `Competitor ${competitor.name} missing url`);
        assert.ok(Array.isArray(competitor.features), `Competitor ${competitor.name} features not array`);
        assert.ok(Array.isArray(competitor.strengths), `Competitor ${competitor.name} strengths not array`);
        assert.ok(Array.isArray(competitor.weaknesses), `Competitor ${competitor.name} weaknesses not array`);
      }
    });

    it('competitors have features and SWOT analysis', () => {
      const industry = detectIndustry('Fintech platform');
      const competitors = researchCompetitors(industry);

      for (const competitor of competitors) {
        assert.ok(competitor.features.length > 0, `${competitor.name} has no features`);
        assert.ok(competitor.strengths.length > 0, `${competitor.name} has no strengths`);
        assert.ok(competitor.weaknesses.length > 0, `${competitor.name} has no weaknesses`);
      }
    });
  });

  describe('generateAcceptanceCriteria', () => {
    it('generates criteria for a pillar', () => {
      const industry = detectIndustry('SaaS platform');
      const pillars = generatePillars(industry);
      const criteria = generateAcceptanceCriteria(pillars[0]);

      assert.ok(Array.isArray(criteria));
    });

    it('each criterion has required fields', () => {
      const industry = detectIndustry('Healthcare platform');
      const pillars = generatePillars(industry);
      const criteria = generateAcceptanceCriteria(pillars[0]);

      for (const criterion of criteria) {
        assert.ok(criterion.id, 'Criterion missing id');
        assert.ok(criterion.description, 'Criterion missing description');
        assert.ok(['file-exists', 'code-pattern', 'functionality', 'integration'].includes(criterion.check),
          `Invalid check type: ${criterion.check}`);
        assert.ok(criterion.target, 'Criterion missing target');
      }
    });

    it('generates multiple criteria per pillar', () => {
      const industry = detectIndustry('Social media platform');
      const pillars = generatePillars(industry);
      const criteria = generateAcceptanceCriteria(pillars[1]);

      assert.ok(criteria.length >= 1, 'Should have at least 1 criterion');
    });
  });

  describe('expand', () => {
    it('expands a prompt to a complete project spec', async () => {
      const project = await expand('Build a SaaS subscription platform');

      assert.ok(project.id, 'Project missing id');
      assert.equal(project.prompt, 'Build a SaaS subscription platform');
      assert.ok(project.industry.id, 'Project missing industry');
      assert.equal(project.pillars.length, 19, 'Project should have 19 pillars');
      assert.ok(project.competitors.length >= 3, 'Project should have at least 3 competitors');
      assert.ok(project.acceptanceCriteria.length > 0, 'Project should have acceptance criteria');
      assert.ok(project.architecture.length > 0, 'Project should have architecture layers');
      assert.ok(project.techStack.length > 0, 'Project should have tech stack');
    });

    it('generates unique project IDs', async () => {
      const project1 = await expand('Build a SaaS platform');
      const project2 = await expand('Build a SaaS platform');

      assert.notEqual(project1.id, project2.id, 'Project IDs should be unique');
    });

    it('includes industry-specific pillars', async () => {
      const ecommerce = await expand('Build an e-commerce store');
      const social = await expand('Build a social network');

      assert.equal(ecommerce.pillars.length, 19);
      assert.equal(social.pillars.length, 19);
      assert.notDeepEqual(ecommerce.pillars[0].name, social.pillars[0].name);
    });

    it('includes competitive analysis', async () => {
      const project = await expand('Build a fintech payment system');
      assert.ok(project.competitors.length > 0);
      for (const competitor of project.competitors) {
        assert.ok(competitor.features.length > 0);
        assert.ok(competitor.strengths.length > 0);
        assert.ok(competitor.weaknesses.length > 0);
      }
    });

    it('includes architecture layers', async () => {
      const project = await expand('Build a SaaS platform');
      assert.ok(project.architecture.length > 0);
      for (const layer of project.architecture) {
        assert.ok(layer.name);
        assert.ok(Array.isArray(layer.responsibilities));
      }
    });

    it('includes tech stack', async () => {
      const project = await expand('Build a SaaS platform');
      assert.ok(project.techStack.length > 0);
      for (const choice of project.techStack) {
        assert.ok(choice.category);
        assert.ok(choice.selection);
        assert.ok(choice.rationale);
      }
    });
  });

  describe('persistence', () => {
    it('saves and loads expansion', async () => {
      const project = await expand('Build a test platform');
      const filePath = saveExpansion(project);
      assert.ok(filePath.endsWith('.json'));

      const loaded = loadExpansion(project.id);
      assert.ok(loaded, 'Loaded project should exist');
      assert.equal(loaded!.id, project.id);
      assert.equal(loaded!.prompt, project.prompt);
      assert.equal(loaded!.pillars.length, 19);
    });

    it('returns null for non-existent expansion', () => {
      const loaded = loadExpansion('NON_EXISTENT_ID');
      assert.equal(loaded, null);
    });

    it('lists saved expansions', async () => {
      const project = await expand('Build a listable platform');
      saveExpansion(project);

      const expansions = listExpansions();
      assert.ok(Array.isArray(expansions));
      assert.ok(expansions.includes(project.id));
    });
  });
});
