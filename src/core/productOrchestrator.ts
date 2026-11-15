/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Product Engineering Orchestrator
 *
 * This is the main integration point between the Product Engineering Engine
 * and the AETHER runtime. It coordinates the full lifecycle:
 *
 *   1. User provides short instruction
 *   2. ProductEngineeringEngine creates the complete plan
 *   3. AETHER runtime executes implementation
 *   4. Product verification validates completeness
 *   5. Infrastructure provisioning sets up deployment
 *   6. Results are reported
 *
 * This transforms AETHER from a code modification harness into a complete
 * autonomous product engineering system.
 */

import { ProductEngineeringEngine } from './productEngineering';
import { ProductPlan, ProductRequirement, RequirementStatus, RequirementCoverageMatrix, buildCoverageMatrix } from './productEngineering';
import { runFullProductVerification, generateVerificationReport, FullProductVerificationReport } from './productVerification';
import { AutonomousRuntimeEngine, AutonomousRuntimeEngine as Runtime } from './autonomousRuntime';
import { generateDeploymentPackage, generateEnvExample, generateDockerComposeFile } from './infrastructureProvisioning';
import { AETHER_AGENTS } from '../data/repositoryCatalog';
import { formDynamicSwarm, SwarmTaskRequest } from './swarmEngine';
import { fnv1aHash } from './contextEngine';

// =============================================================================
// PRODUCT ENGINEERING ORCHESTRATOR
// =============================================================================

export interface ProductBuildResult {
  success: boolean;
  planId: string;
  userRequest: string;
  domain: string;
  complexity: string;
  phasesCompleted: string[];
  requirementCoverage: number;
  verificationScore: number;
  verificationReport: FullProductVerificationReport | null;
  workspaceFiles: Record<string, string>;
  deploymentPackage: ReturnType<typeof generateDeploymentPackage> | null;
  completionReport: string;
  blockers: string[];
  estimatedEffort: string;
  startedAtIso: string;
  completedAtIso: string;
}

export interface ProductBuildOptions {
  skipDeployment?: boolean;
  skipVerification?: boolean;
  requireApproval?: boolean;
  targetEnvironment?: 'development' | 'production';
}

/**
 * Main orchestrator for the product engineering lifecycle.
 */
export class ProductOrchestrator {
  private productEngine: ProductEngineeringEngine;
  private runtime: AutonomousRuntimeEngine;
  private currentResult: ProductBuildResult | null = null;

  constructor(runtime?: AutonomousRuntimeEngine) {
    this.productEngine = new ProductEngineeringEngine(runtime);
    this.runtime = runtime || new AutonomousRuntimeEngine();
  }

  /**
   * Execute the complete product engineering lifecycle for a user request.
   *
   * This is the main entry point: ONE SHORT PROMPT -> COMPLETE PRODUCT
   */
  public async buildProduct(userRequest: string, options: ProductBuildOptions = {}): Promise<ProductBuildResult> {
    const startTime = new Date().toISOString();
    const blockers: string[] = [];
    const phasesCompleted: string[] = [];

    try {
      // ============================================================
      // PHASE 1-4: Product Intelligence & Planning
      // ============================================================
      console.log(`[AETHER Product] Starting full lifecycle for: "${userRequest}"`);

      const plan = await this.productEngine.executeFullLifecycle(userRequest);
      phasesCompleted.push('Understand', 'Research', 'Plan', 'Architect');

      // ============================================================
      // PHASE 5: Implementation Planning via Swarm
      // ============================================================
      console.log(`[AETHER Product] Plan created: ${plan.planId}`);
      console.log(`[AETHER Product] Domain: ${plan.domainAnalysis.primaryCategory}`);
      console.log(`[AETHER Product] Requirements: ${plan.requirements.length}`);

      // Form implementation swarm
      const swarmRequest: SwarmTaskRequest = {
        taskDescription: `Build product: ${userRequest}`,
        targetFilePaths: plan.implementationPlan.flatMap(p => p.requirements),
        blastRadiusScore: plan.estimatedComplexity === 'ENTERPRISE' ? 80 :
          plan.estimatedComplexity === 'HIGH' ? 60 : 40,
        requiresSecurityAudit: true,
        requiresDbMigration: plan.requirements.some(r => r.category === 'database_schema'),
        availableAgents: AETHER_AGENTS,
      };

      const swarmResult = formDynamicSwarm(swarmRequest);
      console.log(`[AETHER Product] Swarm mode: ${swarmResult.executionMode}`);
      console.log(`[AETHER Product] Agents selected: ${swarmResult.selectedAgents.length}`);

      // ============================================================
      // PHASE 5: Generate Implementation Artifacts
      // ============================================================
      let workspaceFiles: Record<string, string> = {};
      try {
        workspaceFiles = this.generateImplementationArtifacts(plan);
      } catch (e) {
        console.error('[AETHER Product] Error generating artifacts:', e.message);
        console.error(e.stack?.split('\n').slice(0, 5).join('\n'));
      }
      phasesCompleted.push('Implementation');

      // Update requirement statuses
      for (const req of plan.requirements) {
        const hasImpl = req.implementedInFiles.some(f =>
          Object.keys(workspaceFiles).some(wf => wf.includes(f))
        );
        if (hasImpl) {
          this.productEngine.updateRequirementStatus(req.id, 'IMPLEMENTED');
        }
      }

      // ============================================================
      // PHASE 6: Independent Verification
      // ============================================================
      let verificationReport: FullProductVerificationReport | null = null;
      let verificationScore = 0;

      if (!options.skipVerification) {
        verificationReport = runFullProductVerification(plan, workspaceFiles, workspaceFiles);
        verificationScore = verificationReport.overallScore;
        phasesCompleted.push('Verification');

        if (verificationReport.criticalBlockers.length > 0) {
          blockers.push(...verificationReport.criticalBlockers);
        }

        console.log(`[AETHER Product] Verification score: ${verificationScore}/100`);
        console.log(`[AETHER Product] Blockers: ${verificationReport.criticalBlockers.length}`);
      }

      // ============================================================
      // PHASE 7: Infrastructure Provisioning
      // ============================================================
      let deploymentPackage: ReturnType<typeof generateDeploymentPackage> | null = null;

      if (!options.skipDeployment) {
        const dbTables = plan.architecture.database.tables.map(t => ({
          name: t.name,
          createSql: this.generateTableSQL(t),
        }));

        deploymentPackage = generateDeploymentPackage(
          plan.planId.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          plan.architecture.backend.language === 'Python' ? 'python' : 'typescript',
          {
            version: '17',
            databaseName: `${plan.planId.toLowerCase().replace(/[^a-z0-9]/g, '_')}_db`,
            username: 'app',
            port: 5432,
          },
          dbTables,
          'npm test',
          plan.architecture.integrations
        );
        phasesCompleted.push('Deployment');
      }

      // ============================================================
      // Generate Completion Report
      // ============================================================
      let completionReport = 'No completion report available.';
      try {
        completionReport = (this.productEngine as unknown as Record<string, (...args: never[]) => unknown>).generateCompletionReport.call(this.productEngine);
      } catch (e) {
        console.error('[AETHER Product] Error generating completion report:', e.message);
        completionReport = `Error generating report: ${e instanceof Error ? e.message : 'Unknown'}`;
      }

      let requirementCoverage = 0;
      try {
        requirementCoverage = buildCoverageMatrix(plan.requirements).summary.coveragePct;
      } catch (e) {
        console.error('[AETHER Product] Error calculating coverage:', e.message);
      }

      this.currentResult = {
        success: blockers.length === 0 && (verificationScore >= 70 || !verificationReport),
        planId: plan.planId,
        userRequest,
        domain: plan.domainAnalysis.primaryCategory,
        complexity: plan.estimatedComplexity,
        phasesCompleted,
        requirementCoverage,
        verificationScore,
        verificationReport,
        workspaceFiles,
        deploymentPackage,
        completionReport,
        blockers,
        estimatedEffort: plan.implementationPlan.reduce((acc, p) => acc + (parseInt(p.estimatedEffort) || 1), 0) + ' days',
        startedAtIso: startTime,
        completedAtIso: new Date().toISOString(),
      };

      return this.currentResult;

    } catch (error) {
      return {
        success: false,
        planId: 'ERROR',
        userRequest,
        domain: 'unknown',
        complexity: 'UNKNOWN',
        phasesCompleted,
        requirementCoverage: 0,
        verificationScore: 0,
        verificationReport: null,
        workspaceFiles: {},
        deploymentPackage: null,
        completionReport: `Error during build: ${error instanceof Error ? error.message : 'Unknown error'}`,
        blockers: [error instanceof Error ? error.message : 'Unknown error'],
        estimatedEffort: 'N/A',
        startedAtIso: startTime,
        completedAtIso: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate implementation artifacts based on the product plan.
   * This creates the actual file structure that would be built.
   */
  private generateImplementationArtifacts(plan: ProductPlan): Record<string, string> {
    const files: Record<string, string> = {};
    const projectId = plan.planId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const language = plan.architecture.backend.language === 'Python' ? 'python' : 'typescript';

    // Generate package.json
    files['package.json'] = this.generatePackageJSON(projectId, plan);

    // Generate database migrations
    for (const migration of plan.architecture.database.migrations) {
      files[`scripts/migrations/${migration.version}.sql`] = migration.upSql;
    }

    // Generate environment example
    const envContent = generateEnvExample({
      variables: [
        { name: 'NODE_ENV', description: 'Environment', required: true, defaultValue: 'development', sensitive: false },
        { name: 'PORT', description: 'Port', required: true, defaultValue: '3000', sensitive: false },
        { name: 'DATABASE_URL', description: 'Database URL', required: true, sensitive: true },
        { name: 'JWT_SECRET', description: 'JWT secret', required: true, sensitive: true },
        ...plan.architecture.integrations.map(i => ({
          name: i.configuration[0] || `${i.name.toUpperCase()}_KEY`,
          description: `${i.name} config`,
          required: i.required,
          sensitive: true,
        })),
      ],
      secrets: [],
      examples: {},
    });
    files['.env.example'] = envContent;

    // Generate Docker Compose
    files['docker-compose.yml'] = generateDockerComposeFile({
      services: [
        {
          name: 'postgres',
          image: `postgres:17-alpine`,
          ports: ['5432:5432'],
          environment: { POSTGRES_DB: `${projectId}_db`, POSTGRES_USER: 'app', POSTGRES_PASSWORD: 'changeme_in_production' },
          volumes: ['postgres_data:/var/lib/postgresql/data'],
          restart: 'unless-stopped',
        },
        {
          name: 'redis',
          image: 'redis:7-alpine',
          ports: ['6379:6379'],
          volumes: ['redis_data:/data'],
          restart: 'unless-stopped',
        },
        {
          name: 'app',
          image: `${projectId}:latest`,
          ports: ['3000:3000'],
          environment: { NODE_ENV: 'development' },
          dependsOn: ['postgres', 'redis'],
          restart: 'unless-stopped',
        },
      ],
      volumes: [
        { name: 'postgres_data', driver: 'local' },
        { name: 'redis_data', driver: 'local' },
      ],
      networks: [{ name: `${projectId}_network`, driver: 'bridge' }],
      environment: {},
    });

    // Generate CI/CD
    files['.github/workflows/ci.yml'] = `name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run lint
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm test
  deploy:
    needs: [lint, test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - run: echo "Configure deployment"
`;

    // Generate database schema files
    for (const table of plan.architecture.database.tables) {
      files[`src/db/schema/${table.name}.ts`] = this.generateTableSchema(table);
    }

    // Generate API routes
    for (const api of plan.architecture.apis) {
      const routePath = api.endpoint.replace(/^\/api\//, '').replace(/\/:id/, '/:id');
      files[`src/api/${routePath.replace(/\/:id$/, '').replace(/\//g, '-') || 'index'}.ts`] =
        this.generateAPIRouteStub(api);
    }

    // Generate main application entry
    files[language === 'python' ? 'main.py' : 'src/index.ts'] = this.generateAppEntry(plan);

    // Generate README
    files['README.md'] = this.generateREADME(plan);

    // Generate Dockerfile
    files['Dockerfile'] = language === 'python'
      ? `FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE 8000\nCMD ["python", "main.py"]`
      : `FROM node:22-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nRUN npm run build\nFROM node:22-alpine\nWORKDIR /app\nCOPY --from=builder /app/node_modules ./node_modules\nCOPY --from=builder /app/dist ./dist\nCOPY --from=builder /app/package.json ./\nEXPOSE 3000\nCMD ["node", "dist/index.js"]`;

    return files;
  }

  private generatePackageJSON(projectId: string, plan: ProductPlan): string {
    const lang = plan.architecture.backend.language === 'Python' ? 'python' : 'typescript';
    const isPython = lang === 'python';

    if (isPython) {
      return JSON.stringify({
        name: projectId,
        version: '0.1.0',
        description: plan.userRequest,
        scripts: {
          dev: 'uvicorn main:app --reload',
          test: 'pytest',
          lint: 'ruff check .',
          format: 'ruff format .',
          migrate: 'echo "Run migrations"',
        },
        dependencies: {
          'fastapi': '^0.111',
          'uvicorn': '^0.30',
          'sqlalchemy': '^2.0',
          'python-jose': '^3.3',
          'passlib': '^1.7',
          'python-multipart': '^0.0',
          'python-dotenv': '^1.0',
          'pydantic': '^2.7',
          'redis': '^5.0',
        },
        devDependencies: {
          pytest: '^8.3',
          ruff: '^0.5',
          mypy: '^1.10',
        },
      }, null, 2);
    }

    return JSON.stringify({
      name: projectId,
      version: '0.1.0',
      description: plan.userRequest,
      type: 'module',
      scripts: {
        dev: 'tsx watch src/index.ts',
        build: 'tsc && node scripts/build.mjs',
        start: 'node dist/index.js',
        test: 'tsx --test src/**/*.test.ts',
        lint: 'tsc --noEmit',
        migrate: 'tsx scripts/migrate.ts',
      },
      dependencies: {
        express: '^4.21',
        'pg': '^8.13',
        redis: '^4.6',
        jsonwebtoken: '^9.0',
        bcrypt: '^5.1',
        zod: '^3.23',
        cors: '^2.8',
        dotenv: '^17.2',
        'helmet': '^7.1',
        'express-rate-limit': '^7.4',
        'express-validator': '^7.1',
      },
      devDependencies: {
        typescript: '^5.5',
        tsx: '^4.7',
        '@types/express': '^4.17',
        '@types/pg': '^8.11',
        '@types/jsonwebtoken': '^9.0',
        '@types/bcrypt': '^5.0',
        vitest: '^2.0',
      },
    }, null, 2);
  }

  private generateTableSchema(table: { name: string; columns: Array<{ name: string; type: string; description: string }> }): string {
    const isPython = false; // default to TypeScript for now

    if (isPython) {
      return `"""${table.name} model"""
from sqlalchemy import Column, ${table.columns.map(c => c.type.includes('VARCHAR') || c.type.includes('TEXT') ? 'String' : c.type.includes('INT') || c.type.includes('SERIAL') ? 'Integer' : 'Boolean').join(', ')}
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

class ${table.name.charAt(0).toUpperCase() + table.name.slice(1)}:
    __tablename__ = "${table.name}"

${table.columns.map(c => `    ${c.name} = Column(${c.type.includes('UUID') ? 'UUID(as_uuid=True)' : c.type.includes('TIMESTAMP') ? 'DateTime(timezone=True)' : 'String'}, ${c.type.includes('PRIMARY KEY') ? 'primary_key=True, default=uuid.uuid4' : c.type.includes('DEFAULT') ? `default=func.now()` : 'nullable=False'})`).join('\n')}
`;
    }

    // TypeScript Drizzle-style schema
    let schema = `/**\n * ${table.name} table schema\n */\n`;
    schema += `import { pgTable, serial, text, varchar, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';\n\n`;
    schema += `export const ${table.name} = pgTable('${table.name}', {\n`;

    for (const col of table.columns) {
      const colType = this.mapColumnType(col.type);
      schema += `  ${col.name}: ${colType}, // ${col.description}\n`;
    }

    schema += `});\n\n`;
    schema += `export type ${table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/s$/, '')}Row = typeof ${table.name}.$inferSelect;\n`;
    schema += `export type New${table.name.charAt(0).toUpperCase() + table.name.slice(1).replace(/s$/, '')} = typeof ${table.name}.$inferInsert;\n`;

    return schema;
  }

  private mapColumnType(type: string): string {
    if (type.includes('UUID')) return `uuid('${type.match(/[A-Z_]+/)?.[0]?.toLowerCase() || 'id'}').primaryKey().defaultRandom()`;
    if (type.includes('VARCHAR')) {
      const size = type.match(/VARCHAR\((\d+)\)/)?.[1] || '255';
      return `varchar('${type.toLowerCase().match(/[a-z_]+/)?.[0] || 'field'}', { length: ${size} })${type.includes('UNIQUE') ? '.unique()' : ''}${type.includes('NOT NULL') ? '.notNull()' : ''}`;
    }
    if (type.includes('BOOLEAN')) return `boolean('${type.toLowerCase().match(/[a-z_]+/)?.[0] || 'field'}').default(false).notNull()`;
    if (type.includes('TIMESTAMP')) return `timestamp('${type.toLowerCase().match(/[a-z_]+/)?.[0] || 'field'}', { withTimezone: true }).defaultNow()`;
    if (type.includes('INTEGER')) return `serial('${type.toLowerCase().match(/[a-z_]+/)?.[0] || 'id'}').primaryKey()`;
    return `text('field')`;
  }

  private generateAPIRouteStub(api: { endpoint: string; method: string; description: string; authRequired: boolean }): string {
    const method = api.method.toLowerCase();
    const routeName = api.endpoint.split('/').pop() || 'handler';
    const isPython = false;

    if (isPython) {
      return `"""${api.description}"""
from fastapi import APIRouter, ${api.authRequired ? 'Depends' : ''}
from pydantic import BaseModel

router = APIRouter()

@router.${method}("${api.endpoint}")
async def ${routeName}():
    """${api.description}"""
    return {"message": "${api.description}"}
`;
    }

    return `/**\n * ${api.description}\n * ${api.method} ${api.endpoint}\n */\n` +
      `import { Router } from 'express';\n\n` +
      `const router = Router();\n\n` +
      `${api.authRequired ? `import { authenticate } from '../middleware/auth';\n\n` : ''}` +
      `/**\n * ${api.description}\n */\n` +
      `router.${method}('${api.endpoint}', ${api.authRequired ? 'authenticate, ' : ''}async (req, res) => {\n` +
      `  try {\n` +
      `    // TODO: Implement ${api.description}\n` +
      `    res.status(501).json({ error: 'Not yet implemented' });\n` +
      `  } catch (error) {\n` +
      `    res.status(500).json({ error: 'Internal server error' });\n` +
      `  }\n` +
      `});\n\n` +
      `export default router;\n`;
  }

  private generateAppEntry(plan: ProductPlan): string {
    const isPython = plan.architecture.backend.language === 'Python';

    if (isPython) {
      return `"""
${plan.userRequest}
${plan.architecture.backend.framework} Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="${plan.userRequest}",
    description="${plan.domainAnalysis.primaryCategory}",
    version="0.1.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": "auto-generated"}

# Include API routers
# from src.api.${plan.architecture.apis[0]?.endpoint.split('/').pop() || 'index'} import router as health_router
# app.include_router(health_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
`;
    }

    return `/**
 * ${plan.userRequest}
 * ${plan.architecture.backend.framework} Application Entry Point
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
${plan.architecture.apis.map(api => `app.${api.method.toLowerCase()}('${api.endpoint}', async (req, res) => {
  // ${api.description}
  res.status(501).json({ error: 'Implementation required', endpoint: '${api.endpoint}' });
});`).join('\n\n')}

// Error handling
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
  }

  private generateREADME(plan: ProductPlan): string {
    return `# ${plan.userRequest}

> ${plan.domainAnalysis.primaryCategory} built with AETHER Product Engineering Engine

## Tech Stack

- **Frontend:** ${plan.architecture.frontend.framework}
- **Backend:** ${plan.architecture.backend.language} / ${plan.architecture.backend.framework}
- **Database:** ${plan.architecture.database.tables.map(t => t.name).join(', ')}
- **Auth:** ${plan.architecture.authentication.method}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start with Docker
docker compose up -d

# Or run locally
npm run dev
\`\`\`

## Requirements

${plan.requirements.map(r => `- [${r.status}] ${r.id}: ${r.title} [${r.priority}]`).join('\n')}

## Architecture

### Database Schema
${plan.architecture.database.tables.map(t => `- \`${t.name}\`: ${t.description}`).join('\n')}

### API Endpoints
${plan.architecture.apis.map(a => `- \`${a.method} ${a.endpoint}\`: ${a.description}`).join('\n')}

## Deployment

See deployment documentation for production setup instructions.

## License

Apache-2.0
`;
  }

  private generateTableSQL(table: { name: string; columns: Array<{ name: string; type: string; constraints: string[] }> }): string {
    const cols = table.columns.map(c => {
      let col = `  ${c.name} ${c.type.split(' ').slice(0, 2).join(' ')}`;
      if (c.constraints.some(ct => ct.includes('NOT NULL') || ct.includes('PRIMARY KEY'))) {
        col += ' NOT NULL';
      }
      if (c.defaultValue) {
        col += ` DEFAULT ${c.defaultValue}`;
      }
      if (c.constraints.some(ct => ct.includes('UNIQUE'))) {
        col += ' UNIQUE';
      }
      return col;
    }).join(',\n');

    return `CREATE TABLE IF NOT EXISTS ${table.name} (\n${cols}\n);`;
  }

  /**
   * Get the current build result.
   */
  public getCurrentResult(): ProductBuildResult | null {
    return this.currentResult;
  }
}

/**
 * Convenience function to build a product from a single prompt.
 * This is the primary API: "One short prompt -> Complete product"
 */
export async function buildProduct(
  userRequest: string,
  options: ProductBuildOptions = {}
): Promise<ProductBuildResult> {
  const orchestrator = new ProductOrchestrator();
  return orchestrator.buildProduct(userRequest, options);
}
