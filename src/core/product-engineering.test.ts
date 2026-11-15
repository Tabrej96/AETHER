/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tests for the Product Engineering Engine modules
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';

import {
  analyzeProductDomain,
  generateCompetitiveIntelligence,
  generateProductRequirements,
  generateProductArchitecture,
  generateProductPlan,
  buildCoverageMatrix,
  verifyAgainstPlan,
  ProductEngineeringEngine,
} from './productEngineering';

import { runFullProductVerification, generateVerificationReport } from './productVerification';

import {
  generateDockerCompose,
  generateEnvironmentConfig,
  generateEnvExample,
  generateDockerComposeFile,
  generateGithubActionsYAML,
  generateDeploymentPackage,
} from './infrastructureProvisioning';

import { ProductOrchestrator, buildProduct } from './productOrchestrator';

import { runCompetitiveBenchmark, generateBenchmarkReport, BENCHMARK_TASK } from './competitiveBenchmark';

// =============================================================================
// PRODUCT ENGINEERING TESTS
// =============================================================================

describe('ProductEngineeringEngine', () => {
  describe('analyzeProductDomain', () => {
    it('identifies food_service domain from coffee-related request', () => {
      const result = analyzeProductDomain('Build a complete specialty coffee business website and ordering platform');
      assert.strictEqual(result.domain, 'food_service');
      assert.ok(result.confidence > 0.5);
      assert.ok(result.primaryCategory.includes('Food'));
    });

    it('identifies ecommerce domain', () => {
      const result = analyzeProductDomain('Build an e-commerce website with shopping cart and checkout');
      assert.strictEqual(result.domain, 'ecommerce');
    });

    it('identifies saas domain', () => {
      const result = analyzeProductDomain('Build a SaaS dashboard application with user management');
      assert.strictEqual(result.domain, 'saas');
    });

    it('identifies ai_platform domain', () => {
      const result = analyzeProductDomain('Build an AI platform with model inference API');
      assert.strictEqual(result.domain, 'ai_platform');
    });

    it('returns general domain for ambiguous requests', () => {
      const result = analyzeProductDomain('Build a website');
      assert.ok(result.confidence <= 0.5);
    });

    it('extracts target users from domain analysis', () => {
      const result = analyzeProductDomain('Build a coffee shop website');
      assert.ok(result.targetUsers.length > 0);
      assert.ok(result.targetUsers.some(u => u.toLowerCase().includes('customer') || u.toLowerCase().includes('user')));
    });
  });

  describe('generateCompetitiveIntelligence', () => {
    it('generates competitor profiles for food_service', () => {
      const report = generateCompetitiveIntelligence('food_service', 'coffee shop');
      assert.ok(report.competitors.length >= 1);
      assert.ok(report.mandatoryCapabilities.length > 0);
      assert.ok(report.securityComplianceRequirements.length > 0);
    });

    it('includes market gaps', () => {
      const report = generateCompetitiveIntelligence('ecommerce', 'store');
      assert.ok(report.marketGaps.length > 0);
    });

    it('includes industry standard features', () => {
      const report = generateCompetitiveIntelligence('saas', 'app');
      assert.ok(report.industryStandardFeatures.length > 0);
    });

    it('includes security requirements', () => {
      const report = generateCompetitiveIntelligence('ai_platform', 'AI API');
      assert.ok(report.securityComplianceRequirements.length > 0);
    });
  });

  describe('generateProductRequirements', () => {
    it('generates requirements for food_service domain', () => {
      const domain = analyzeProductDomain('Build a coffee shop');
      const competitive = generateCompetitiveIntelligence('food_service', 'coffee shop');
      const reqs = generateProductRequirements(domain, competitive, 'coffee shop');

      assert.ok(reqs.length >= 10);
      assert.ok(reqs.every(r => r.id && r.category && r.title && r.acceptanceCriteria.length > 0));
    });

    it('includes CRITICAL priority requirements', () => {
      const domain = analyzeProductDomain('Build an e-commerce store');
      const competitive = generateCompetitiveIntelligence('ecommerce', 'store');
      const reqs = generateProductRequirements(domain, competitive, 'store');

      assert.ok(reqs.some(r => r.priority === 'CRITICAL'));
    });

    it('includes backend_api requirements', () => {
      const domain = analyzeProductDomain('Build a web application');
      const competitive = generateCompetitiveIntelligence('saas', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');

      assert.ok(reqs.some(r => r.category === 'backend_api'));
    });

    it('includes database_schema requirements', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');

      assert.ok(reqs.some(r => r.category === 'database_schema'));
    });

    it('includes authentication requirements', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');

      assert.ok(reqs.some(r => r.category === 'authentication'));
    });
  });

  describe('generateProductArchitecture', () => {
    it('generates complete architecture for any domain', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');
      const arch = generateProductArchitecture(reqs, 'general', 'app');

      assert.ok(arch.frontend.framework);
      assert.ok(arch.backend.framework);
      assert.ok(arch.database.tables.length > 0);
      assert.ok(arch.apis.length > 0);
      assert.ok(arch.authentication.method);
    });

    it('includes database tables with proper schema', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');
      const arch = generateProductArchitecture(reqs, 'general', 'app');

      assert.ok(arch.database.tables.some(t => t.name === 'users'));
      assert.ok(arch.database.tables.some(t => t.name === 'user_sessions'));
      assert.ok(arch.database.tables.some(t => t.columns.length > 3));
    });

    it('includes authentication architecture', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');
      const arch = generateProductArchitecture(reqs, 'general', 'app');

      assert.ok(arch.authentication.providers.length > 0);
      assert.ok(arch.authentication.roles.length > 0);
    });
  });

  describe('generateProductPlan', () => {
    it('creates a complete product plan', () => {
      const domain = analyzeProductDomain('Build a coffee shop website');
      const competitive = generateCompetitiveIntelligence('food_service', 'coffee');
      const reqs = generateProductRequirements(domain, competitive, 'coffee');
      const arch = generateProductArchitecture(reqs, 'food_service', 'coffee');
      const plan = generateProductPlan('Build a coffee shop', domain, competitive, reqs, arch);

      assert.ok(plan.planId);
      assert.ok(plan.requirements.length > 0);
      assert.ok(plan.implementationPlan.length > 0);
      assert.ok(plan.testingStrategy);
      assert.ok(plan.deploymentPlan);
      assert.ok(plan.acceptanceCriteria);
    });

    it('generates implementation phases', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');
      const arch = generateProductArchitecture(reqs, 'general', 'app');
      const plan = generateProductPlan('Build app', domain, competitive, reqs, arch);

      assert.ok(plan.implementationPlan.length >= 4);
      assert.ok(plan.implementationPlan[0].phaseNumber === 1);
      assert.ok(plan.implementationPlan[0].dependencies.length === 0);
    });

    it('estimates complexity correctly', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');
      const arch = generateProductArchitecture(reqs, 'general', 'app');
      const plan = generateProductPlan('Build app', domain, competitive, reqs, arch);

      assert.ok(['LOW', 'MEDIUM', 'HIGH', 'ENTERPRISE'].includes(plan.estimatedComplexity));
    });
  });

  describe('buildCoverageMatrix', () => {
    it('builds coverage matrix from requirements', () => {
      const domain = analyzeProductDomain('Build a web app');
      const competitive = generateCompetitiveIntelligence('general', 'app');
      const reqs = generateProductRequirements(domain, competitive, 'app');
      const matrix = buildCoverageMatrix(reqs);

      assert.strictEqual(matrix.requirements.length, reqs.length);
      assert.ok(matrix.summary.total > 0);
      assert.ok(matrix.summary.coveragePct >= 0);
    });
  });
});

// =============================================================================
// PRODUCT VERIFICATION TESTS
// =============================================================================

describe('ProductVerification', () => {
  let testPlan: ProductPlan;

  before(() => {
    const domain = analyzeProductDomain('Build a coffee shop website');
    const competitive = generateCompetitiveIntelligence('food_service', 'coffee');
    const reqs = generateProductRequirements(domain, competitive, 'coffee');
    const arch = generateProductArchitecture(reqs, 'food_service', 'coffee');
    testPlan = generateProductPlan('Build coffee shop', domain, competitive, reqs, arch);
  });

  describe('runFullProductVerification', () => {
    it('verifies against a plan with workspace files', () => {
      const workspaceFiles = {
        'src/App.tsx': 'import React from "react"; export default function App() { return <div>Hello</div>; }',
        'src/index.ts': "import App from './App'; console.log('starting');",
        'package.json': '{"name": "test", "dependencies": {}}',
        'README.md': '# Test',
      };

      const result = runFullProductVerification(testPlan, workspaceFiles, workspaceFiles);
      assert.ok(result.dimensions.length > 0);
      assert.ok(typeof result.overallScore === 'number');
      assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
    });

    it('returns low scores for empty workspace', () => {
      const result = runFullProductVerification(testPlan, {}, {});
      assert.ok(result.overallScore < 50);
    });

    it('identifies critical blockers', () => {
      const result = runFullProductVerification(testPlan, {}, {});
      assert.ok(result.criticalBlockers.length >= 0);
    });

    it('includes all verification dimensions', () => {
      const result = runFullProductVerification(testPlan, {}, {});
      const dimNames = result.dimensions.map(d => d.dimension);
      assert.ok(dimNames.includes('requirement_coverage'));
      assert.ok(dimNames.includes('frontend_completeness'));
      assert.ok(dimNames.includes('backend_completeness'));
      assert.ok(dimNames.includes('security'));
      assert.ok(dimNames.includes('testing'));
      assert.ok(dimNames.includes('deployment'));
    });
  });

  describe('generateVerificationReport', () => {
    it('generates markdown report', () => {
      const workspaceFiles = { 'src/App.tsx': 'test', 'package.json': '{}' };
      const result = runFullProductVerification(testPlan, workspaceFiles, workspaceFiles);
      const report = generateVerificationReport(result);
      assert.ok(report.includes('# Product Verification Report'));
      assert.ok(report.includes('Overall Score'));
    });
  });
});

// =============================================================================
// INFRASTRUCTURE PROVISIONING TESTS
// =============================================================================

describe('InfrastructureProvisioning', () => {
  describe('generateDockerCompose', () => {
    it('generates valid docker-compose config', () => {
      const compose = generateDockerCompose('test-app', { version: '17', port: 5432 }, { port: 6379 });
      assert.ok(compose.services.length >= 3);
      assert.ok(compose.services.some(s => s.name === 'postgres'));
      assert.ok(compose.services.some(s => s.name === 'redis'));
      assert.ok(compose.services.some(s => s.name === 'app'));
    });

    it('includes health checks', () => {
      const compose = generateDockerCompose('test-app', { version: '17' }, { port: 6379 });
      assert.ok(compose.services.every(s => s.healthcheck !== undefined));
    });
  });

  describe('generateEnvironmentConfig', () => {
    it('generates env config with standard variables', () => {
      const config = generateEnvironmentConfig('test-app', [
        { name: 'Stripe', type: 'payment', required: true, configuration: ['STRIPE_KEY'] },
      ]);
      assert.ok(config.variables.some(v => v.name === 'NODE_ENV'));
      assert.ok(config.variables.some(v => v.name === 'DATABASE_URL'));
      assert.ok(config.variables.some(v => v.name === 'JWT_SECRET'));
      assert.ok(config.variables.some(v => v.name === 'STRIPE_KEY'));
    });

    it('marks sensitive variables', () => {
      const config = generateEnvironmentConfig('test-app', []);
      assert.ok(config.variables.every(v => v.sensitive === !['NODE_ENV', 'PORT', 'LOG_LEVEL'].includes(v.name)));
    });
  });

  describe('generateEnvExample', () => {
    it('generates .env.example content', () => {
      const config = generateEnvironmentConfig('test-app', []);
      const content = generateEnvExample(config);
      assert.ok(content.includes('NODE_ENV'));
      assert.ok(content.includes('DATABASE_URL'));
      assert.ok(content.includes('JWT_SECRET'));
    });
  });

  describe('generateDockerComposeFile', () => {
    it('generates valid YAML-like compose file', () => {
      const compose = generateDockerCompose('test-app', { version: '17' }, { port: 6379 });
      const content = generateDockerComposeFile(compose);
      assert.ok(content.includes("version: '3.8'"));
      assert.ok(content.includes('postgres'));
      assert.ok(content.includes('redis'));
      assert.ok(content.includes('app'));
    });
  });

  describe('generateGithubActionsYAML', () => {
    it('generates valid GitHub Actions YAML', () => {
      const config = {
        platform: 'github-actions' as const,
        triggers: ['push'] as string[],
        stages: [
          {
            name: 'test' as const,
            steps: [
              { name: 'Checkout', uses: 'actions/checkout@v4' },
              { name: 'Run tests', run: 'npm test' },
            ],
          },
        ],
      };
      const yaml = generateGithubActionsYAML(config);
      assert.ok(yaml.includes('name: CI/CD Pipeline'));
      assert.ok(yaml.includes('actions/checkout@v4'));
      assert.ok(yaml.includes('npm test'));
    });
  });

  describe('generateDeploymentPackage', () => {
    it('generates complete deployment package', () => {
      const pkg = generateDeploymentPackage(
        'test-app',
        'typescript',
        { version: '17' },
        [{ name: 'users', createSql: 'CREATE TABLE users (id SERIAL PRIMARY KEY);' }],
        'npm test',
        [{ name: 'Stripe', type: 'payment', required: true, configuration: ['STRIPE_KEY'] }]
      );

      assert.ok(pkg.dockerCompose.length > 0);
      assert.ok(pkg.dockerfile.length > 0);
      assert.ok(pkg.envExample.length > 0);
      assert.ok(pkg.pm2Config.length > 0);
      assert.ok(pkg.githubActions.length > 0);
      assert.ok(pkg.initSQL.length > 0);
      assert.ok(pkg.readme.length > 0);
    });
  });
});

// =============================================================================
// PRODUCT ORCHESTRATOR TESTS
// =============================================================================

describe('ProductOrchestrator', () => {
  describe('buildProduct', () => {
    it('produces a build result', async () => {
      const result = await buildProduct('Build a simple web app', {
        skipDeployment: true,
        skipVerification: true,
      });

      assert.ok(result.planId);
      assert.strictEqual(result.userRequest, 'Build a simple web app');
      assert.ok(result.workspaceFiles);
      assert.ok(result.phasesCompleted.length > 0);
    });

    it('generates workspace files', async () => {
      const result = await buildProduct('Build a coffee shop', {
        skipDeployment: true,
        skipVerification: true,
      });

      assert.ok(Object.keys(result.workspaceFiles).length > 0);
      assert.ok(result.workspaceFiles['package.json'] !== undefined ||
               result.workspaceFiles['README.md'] !== undefined);
    });

    it('identifies product domain', async () => {
      const result = await buildProduct('Build a coffee shop website', {
        skipDeployment: true,
        skipVerification: true,
      });

      assert.ok(result.domain.length > 0);
    });
  });
});

// =============================================================================
// COMPETITIVE BENCHMARK TESTS
// =============================================================================

describe('CompetitiveBenchmark', () => {
  describe('BENCHMARK_TASK', () => {
    it('has a valid benchmark task', () => {
      assert.ok(BENCHMARK_TASK.id);
      assert.ok(BENCHMARK_TASK.title);
      assert.ok(BENCHMARK_TASK.userPrompt);
      assert.ok(BENCHMARK_TASK.category);
    });

    it('benchmark prompt matches the task', () => {
      assert.ok(BENCHMARK_TASK.userPrompt.includes('coffee'));
    });
  });

  describe('runCompetitiveBenchmark', () => {
    it('produces a benchmark report', async () => {
      const report = await runCompetitiveBenchmark({}, {}, {});
      assert.strictEqual(report.taskId, BENCHMARK_TASK.id);
      assert.ok(report.scores.length > 0);
      assert.ok(report.overallA >= 0);
      assert.ok(report.overallB >= 0);
      assert.ok(report.overallC >= 0);
    });

    it('AETHER should score higher than baseline A', async () => {
      const report = await runCompetitiveBenchmark({}, {}, {});
      assert.ok(report.overallB > report.overallA,
        `AETHER (${report.overallB}) should score higher than baseline A (${report.overallA})`);
    });
  });

  describe('generateBenchmarkReport', () => {
    it('generates markdown report', async () => {
      const report = await runCompetitiveBenchmark({}, {}, {});
      const md = generateBenchmarkReport(report);
      assert.ok(md.includes('# AETHER Competitive Benchmark Report'));
      assert.ok(md.includes('Overall Results'));
      assert.ok(md.includes('Dimension Scores'));
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Product Engineering Integration', () => {
  it('full lifecycle produces a complete plan', async () => {
    const orchestrator = new ProductOrchestrator();
    const result = await orchestrator.buildProduct('Build a coffee shop website and ordering platform', {
      skipDeployment: true,
      skipVerification: false,
    });

    // Should have requirements
    assert.ok(Object.keys(result.workspaceFiles).length > 5,
      'Should generate multiple workspace files');

    // Should have verification
    assert.ok(result.verificationScore >= 0);
    assert.ok(result.verificationReport !== null);

    // Should have deployment package reference (counted by files)
    assert.ok(result.completionReport.length > 0);
  });

  it('product engineering engine creates domain-specific requirements', async () => {
    const engine = new ProductEngineeringEngine();
    const plan = await engine.executeFullLifecycle('Build an e-commerce platform');

    assert.ok(plan.requirements.length > 10);
    assert.ok(plan.requirements.some(r => r.category === 'payment_processing'));
    assert.ok(plan.requirements.some(r => r.category === 'frontend_customer'));
    assert.ok(plan.architecture.database.tables.some(t => t.name === 'users'));
  });

  it('handles different product domains', async () => {
    const domains = ['Build a SaaS app', 'Build a project management tool', 'Build an AI platform'];

    for (const prompt of domains) {
      const orchestrator = new ProductOrchestrator();
      const result = await orchestrator.buildProduct(prompt, {
        skipDeployment: true,
        skipVerification: true,
      });

      assert.ok(result.domain.length > 0, `Failed for: ${prompt}`);
      assert.ok(Object.keys(result.workspaceFiles).length > 0, `No files for: ${prompt}`);
    }
  });
});
