/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Product Engineering Engine — Infrastructure Provisioning Engine
 *
 * This module provides infrastructure setup and configuration capabilities,
 * enabling AETHER to provision and configure actual infrastructure components
 * needed by the products it builds.
 *
 * Supported infrastructure:
 *   - PostgreSQL database setup and migrations
 *   - Redis cache configuration
 *   - Environment configuration generation
 *   - Docker/Docker Compose setup
 *   - Process manager configuration
 *   - CI/CD pipeline generation
 */

// =============================================================================
// INFRASTRUCTURE SPECIFICATIONS
// =============================================================================

export interface DatabaseProvisionConfig {
  type: 'postgresql' | 'mysql' | 'sqlite';
  version: string;
  databaseName: string;
  username: string;
  password: string;
  host: string;
  port: number;
  ssl: boolean;
  poolSize: number;
  migrationsPath: string;
  seedData: boolean;
}

export interface RedisProvisionConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttlDefaults: Record<string, number>;
}

export interface DockerComposeConfig {
  services: DockerService[];
  volumes: DockerVolume[];
  networks: DockerNetwork[];
  environment: Record<string, string>;
}

export interface DockerService {
  name: string;
  image: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  dependsOn?: string[];
  healthcheck?: DockerHealthcheck;
  restart: string;
}

export interface DockerHealthcheck {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
}

export interface DockerVolume {
  name: string;
  driver: string;
}

export interface DockerNetwork {
  name: string;
  driver: string;
}

export interface EnvironmentConfig {
  variables: EnvVariable[];
  secrets: EnvSecret[];
  examples: Record<string, string>;
}

export interface EnvVariable {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  sensitive: boolean;
}

export interface EnvSecret {
  name: string;
  description: string;
  howToGenerate: string;
  required: boolean;
}

export interface ProcessManagerConfig {
  type: 'pm2' | 'systemd' | 'docker' | 'forever';
  appName: string;
  script: string;
  instances: number;
  maxMemoryRestart: string;
  environment: Record<string, string>;
  logPath: string;
}

export interface CICDConfig {
  platform: 'github-actions' | 'gitlab-ci' | 'circleci';
  stages: CIStage[];
  triggers: string[];
}

export interface CIStage {
  name: string;
  steps: CIStep[];
}

export interface CIStep {
  name: string;
  run: string;
  uses?: string;
  with?: Record<string, string>;
  env?: Record<string, string>;
}

// =============================================================================
// PROVISIONING FUNCTIONS
// =============================================================================

/**
 * Generate Docker Compose configuration for the application.
 */
export function generateDockerCompose(
  projectName: string,
  dbConfig: Partial<DatabaseProvisionConfig>,
  redisConfig: Partial<RedisProvisionConfig>
): DockerComposeConfig {
  const services: DockerService[] = [
    {
      name: 'postgres',
      image: `postgres:${dbConfig.version || '17-alpine'}`,
      ports: [`${dbConfig.port || 5432}:5432`],
      environment: {
        POSTGRES_DB: dbConfig.databaseName || `${projectName}_db`,
        POSTGRES_USER: dbConfig.username || 'app',
        POSTGRES_PASSWORD: dbConfig.password || 'changeme_in_production',
      },
      volumes: ['postgres_data:/var/lib/postgresql/data', './scripts/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql'],
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}'],
        interval: '5s',
        timeout: '5s',
        retries: 5,
      },
      restart: 'unless-stopped',
    },
    {
      name: 'redis',
      image: 'redis:7-alpine',
      ports: [`${redisConfig.port || 6379}:6379`],
      environment: redisConfig.password ? { REDIS_PASSWORD: redisConfig.password } : {},
      volumes: ['redis_data:/data'],
      healthcheck: {
        test: ['CMD', 'redis-cli', 'ping'],
        interval: '5s',
        timeout: '3s',
        retries: 5,
      },
      restart: 'unless-stopped',
    },
    {
      name: 'app',
      image: `${projectName}:latest`,
      ports: ['3000:3000'],
      environment: {
        NODE_ENV: 'development',
        DATABASE_URL: `postgresql://${dbConfig.username || 'app'}:${dbConfig.password || 'changeme_in_production'}@postgres:5432/${dbConfig.databaseName || `${projectName}_db`}?schema=public`,
        REDIS_URL: `redis://${redisConfig.password ? `:${redisConfig.password}@` : ''}redis:${redisConfig.port || 6379}/0`,
      },
      volumes: ['./src:/app/src', './logs:/app/logs'],
      dependsOn: ['postgres', 'redis'],
      restart: 'unless-stopped',
      healthcheck: {
        test: ['CMD-SHELL', 'node -e "require(\'http\').get(\'http://localhost:3000/health\', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"'],
        interval: '10s',
        timeout: '5s',
        retries: 3,
        startPeriod: '30s',
      },
    },
  ];

  return {
    services,
    volumes: [
      { name: 'postgres_data', driver: 'local' },
      { name: 'redis_data', driver: 'local' },
    ],
    networks: [
      { name: `${projectName}_network`, driver: 'bridge' },
    ],
    environment: {
      PROJECT_NAME: projectName,
    },
  };
}

/**
 * Generate environment variable configuration.
 */
export function generateEnvironmentConfig(
  projectName: string,
  integrations: Array<{ name: string; type: string; required: boolean; configuration: string[] }>
): EnvironmentConfig {
  const variables: EnvVariable[] = [
    { name: 'NODE_ENV', description: 'Application environment', required: true, defaultValue: 'development', sensitive: false },
    { name: 'PORT', description: 'Application port', required: true, defaultValue: '3000', sensitive: false },
    { name: 'DATABASE_URL', description: 'PostgreSQL connection string', required: true, sensitive: true },
    { name: 'REDIS_URL', description: 'Redis connection string', required: false, sensitive: true },
    { name: 'JWT_SECRET', description: 'JWT signing secret', required: true, sensitive: true },
    { name: 'JWT_REFRESH_SECRET', description: 'JWT refresh token secret', required: true, sensitive: true },
    { name: 'BCRYPT_ROUNDS', description: 'Password hashing rounds', required: false, defaultValue: '12', sensitive: true },
    { name: 'RATE_LIMIT_WINDOW_MS', description: 'Rate limiting window in ms', required: false, defaultValue: '60000', sensitive: true },
    { name: 'RATE_LIMIT_MAX', description: 'Max requests per window', required: false, defaultValue: '100', sensitive: true },
    { name: 'LOG_LEVEL', description: 'Logging level', required: false, defaultValue: 'info', sensitive: false },
    { name: 'CORS_ORIGIN', description: 'Allowed CORS origins', required: false, defaultValue: 'http://localhost:3000', sensitive: true },
  ];

  const secrets: EnvSecret[] = [
    { name: 'JWT_SECRET', description: 'Generate with: openssl rand -base64 64', howToGenerate: 'openssl rand -base64 64', required: true },
    { name: 'JWT_REFRESH_SECRET', description: 'Generate with: openssl rand -base64 64', howToGenerate: 'openssl rand -base64 64', required: true },
  ];

  for (const integration of integrations) {
    for (const config of integration.configuration) {
      if (!variables.some(v => v.name === config)) {
        variables.push({
          name: config,
          description: `${integration.name} configuration`,
          required: integration.required,
          sensitive: true,
        });
      }
    }
  }

  const examples: Record<string, string> = {};
  for (const v of variables) {
    if (v.defaultValue) {
      examples[v.name] = v.defaultValue;
    }
  }

  return { variables, secrets, examples };
}

/**
 * Generate .env.example file content.
 */
export function generateEnvExample(config: EnvironmentConfig): string {
  let content = '# =============================================\n';
  content += `# ${config.variables[0]?.name || 'Environment'} Configuration\n`;
  content += `# Generated by AETHER\n`;
  content += '# =============================================\n\n';
  content += '# Application\n';
  content += 'NODE_ENV=development\n';
  content += 'PORT=3000\n\n';

  content += '# Database\n';
  content += 'DATABASE_URL=postgresql://app:changeme_in_production@localhost:5432/myapp_db?schema=public\n\n';

  content += '# Cache\n';
  content += 'REDIS_URL=redis://localhost:6379/0\n\n';

  content += '# Authentication\n';
  content += 'JWT_SECRET=replace_with_secure_random_string\n';
  content += 'JWT_REFRESH_SECRET=replace_with_another_secure_random_string\n';
  content += 'BCRYPT_ROUNDS=12\n\n';

  content += '# Rate Limiting\n';
  content += 'RATE_LIMIT_WINDOW_MS=60000\n';
  content += 'RATE_LIMIT_MAX=100\n\n';

  content += '# Logging\n';
  content += 'LOG_LEVEL=info\n\n';

  content += '# CORS\n';
  content += 'CORS_ORIGIN=http://localhost:3000\n';

  return content;
}

/**
 * Generate Docker Compose file content.
 */
export function generateDockerComposeFile(compose: DockerComposeConfig): string {
  let content = `version: '3.8'\n\n`;
  content += 'services:\n';

  for (const service of compose.services) {
    content += `  ${service.name}:\n`;
    content += `    image: ${service.image}\n`;
    if (service.ports && service.ports.length > 0) {
      content += `    ports:\n`;
      for (const port of service.ports) {
        content += `      - "${port}"\n`;
      }
    }
    if (service.environment && Object.keys(service.environment).length > 0) {
      content += `    environment:\n`;
      for (const [key, value] of Object.entries(service.environment)) {
        content += `      ${key}: ${value}\n`;
      }
    }
    if (service.volumes && service.volumes.length > 0) {
      content += `    volumes:\n`;
      for (const vol of service.volumes) {
        content += `      - ${vol}\n`;
      }
    }
    if (service.dependsOn && service.dependsOn.length > 0) {
      content += `    depends_on:\n`;
      for (const dep of service.dependsOn) {
        content += `      - ${dep}\n`;
      }
    }
    if (service.healthcheck) {
      content += `    healthcheck:\n`;
      content += `      test: [${service.healthcheck.test.map(t => `"${t}"`).join(', ')}]\n`;
      content += `      interval: ${service.healthcheck.interval}\n`;
      content += `      timeout: ${service.healthcheck.timeout}\n`;
      content += `      retries: ${service.healthcheck.retries}\n`;
    }
    content += `    restart: ${service.restart}\n\n`;
  }

  if (compose.volumes && compose.volumes.length > 0) {
    content += 'volumes:\n';
    for (const vol of compose.volumes) {
      content += `  ${vol.name}:\n    driver: ${vol.driver}\n`;
    }
    content += '\n';
  }

  if (compose.networks && compose.networks.length > 0) {
    content += 'networks:\n';
    for (const net of compose.networks) {
      content += `  ${net.name}:\n    driver: ${net.driver}\n`;
    }
  }

  return content;
}

/**
 * Generate PM2 ecosystem config.
 */
export function generatePM2Config(config: ProcessManagerConfig): string {
  return JSON.stringify({
    apps: [{
      name: config.appName,
      script: config.script,
      instances: config.instances,
      exec_mode: 'cluster',
      max_memory_restart: config.maxMemoryRestart,
      env: {
        ...config.environment,
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: `${config.logPath}/${config.appName}-error.log`,
      out_file: `${config.logPath}/${config.appName}-out.log`,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
    }],
  }, null, 2);
}

/**
 * Generate GitHub Actions CI/CD pipeline.
 */
export function generateGithubActions(
  projectName: string,
  language: string,
  testCommand: string
): CICDConfig {
  const lintCommand = language === 'python' ? 'ruff check . && ruff format --check .' :
    language === 'typescript' ? 'npx tsc --noEmit' : 'echo "No lint configured"';
  const buildCommand = language === 'python' ? 'echo "No build step"' :
    'npm run build';

  return {
    platform: 'github-actions',
    triggers: ['push', 'pull_request'],
    stages: [
      {
        name: 'lint',
        steps: [
          { name: 'Checkout', uses: 'actions/checkout@v4' },
          { name: 'Setup Node.js', uses: 'actions/setup-node@v4', with: { 'node-version': '22' } },
          { name: 'Install dependencies', run: 'npm ci' },
          { name: 'Lint', run: lintCommand },
        ],
      },
      {
        name: 'test',
        steps: [
          { name: 'Run tests', run: testCommand, env: { NODE_ENV: 'test', DATABASE_URL: 'postgresql://app:test@localhost:5432/test_db' } },
        ],
      },
      {
        name: 'build',
        steps: [
          { name: 'Build', run: buildCommand },
        ],
      },
      {
        name: 'security',
        steps: [
          { name: 'Dependency audit', run: 'npm audit --audit-level=high' },
        ],
      },
      {
        name: 'deploy',
        steps: [
          { name: 'Deploy to production', run: 'echo "Configure deployment step"' },
        ],
      },
    ],
  };
}

/**
 * Generate GitHub Actions YAML content.
 */
export function generateGithubActionsYAML(config: CICDConfig): string {
  let yaml = `name: CI/CD Pipeline\n\n`;
  yaml += `on:\n`;
  yaml += `  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\n`;
  yaml += `jobs:\n`;

  for (const stage of config.stages) {
    yaml += `  ${stage.name}:\n`;
    yaml += `    runs-on: ubuntu-latest\n`;
    if (stage.name === 'deploy') {
      yaml += `    if: github.ref == 'refs/heads/main'\n`;
    }
    yaml += `    steps:\n`;
    for (const step of stage.steps) {
      if (step.uses) {
        yaml += `      - uses: ${step.uses}\n`;
        if (step.with) {
          for (const [k, v] of Object.entries(step.with)) {
            yaml += `        with:\n          ${k}: ${v}\n`;
          }
        }
      } else {
        yaml += `      - name: ${step.name}\n`;
        if (step.env) {
          yaml += `        env:\n`;
          for (const [k, v] of Object.entries(step.env)) {
            yaml += `          ${k}: ${v}\n`;
          }
        }
        yaml += `        run: ${step.run}\n`;
      }
    }
    yaml += '\n';
  }

  return yaml;
}

/**
 * Generate database migration SQL.
 */
export function generateMigrationSQL(
  version: string,
  name: string,
  upStatements: string[],
  downStatements: string[]
): string {
  return `-- Migration: ${version}_${name}
-- Created by AETHER
-- Description: ${name}

-- ============================================
-- UP MIGRATION
-- ============================================

${upStatements.join('\n\n')}

-- ============================================
-- DOWN MIGRATION (rollback)
-- ============================================

${downStatements.join('\n\n')}

-- ============================================
-- Indexes
-- ============================================

-- Add indexes after tables are created
-- (separated for concurrent index creation in production)
`;
}

/**
 * Generate init SQL for Docker database initialization.
 */
export function generateInitSQL(tables: Array<{ name: string; createSql: string }>): string {
  let sql = '-- Database initialization script\n-- Generated by AETHER\n\n';

  for (const table of tables) {
    sql += `${table.createSql};\n\n`;
  }

  sql += '-- Insert seed data if needed\n';
  sql += '-- INSERT INTO ...;\n';

  return sql;
}

/**
 * Generate a complete deployment package specification.
 */
export interface DeploymentPackage {
  dockerCompose: string;
  dockerfile: string;
  envExample: string;
  pm2Config: string;
  githubActions: string;
  initSQL: string;
  readme: string;
}

export function generateDeploymentPackage(
  projectName: string,
  language: string,
  databaseConfig: Partial<DatabaseProvisionConfig>,
  tables: Array<{ name: string; createSql: string }>,
  testCommand: string,
  integrations: Array<{ name: string; type: string; required: boolean; configuration: string[] }>
): DeploymentPackage {
  const redisConfig: Partial<RedisProvisionConfig> = { port: 6379 };
  const compose = generateDockerCompose(projectName, databaseConfig, redisConfig);
  const envConfig = generateEnvironmentConfig(projectName, integrations);
  const ciConfig = generateGithubActions(projectName, language, testCommand);

  return {
    dockerCompose: generateDockerComposeFile(compose),
    dockerfile: generateDockerDockerfile(projectName, language),
    envExample: generateEnvExample(envConfig),
    pm2Config: generatePM2Config({
      type: 'pm2',
      appName: projectName,
      script: 'dist/index.js',
      instances: 1,
      maxMemoryRestart: '500M',
      environment: { DATABASE_URL: 'postgresql://localhost:5432/db' },
      logPath: 'logs',
    }),
    githubActions: generateGithubActionsYAML(ciConfig),
    initSQL: generateInitSQL(tables),
    readme: generateDeploymentReadme(projectName),
  };
}

function generateDockerDockerfile(projectName: string, language: string): string {
  if (language === 'python') {
    return `FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

EXPOSE 8000
CMD ["python", "main.py"]
`;
  }

  // TypeScript/Node.js
  return `FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]
`;
}

function generateDeploymentReadme(projectName: string): string {
  return `# ${projectName} - Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 22+ (for local development)
- PostgreSQL 17 (or use Docker)

## Quick Start with Docker

\`\`\`bash
# Clone and navigate
cd ${projectName}

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start all services
docker compose up -d

# Run migrations
docker compose exec app npm run migrate

# Verify health
curl http://localhost:3000/health
\`\`\`

## Local Development

\`\`\`bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start PostgreSQL (if not using Docker)
# Create database: createdb ${projectName.toLowerCase()}_db

# Run migrations
npm run migrate

# Start development server
npm run dev
\`\`\`

## Production Deployment

\`\`\`bash
# Build for production
docker compose -f docker-compose.prod.yml build

# Deploy
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.prod.yml exec app npm run migrate
\`\`\`

## Environment Variables

See \`.env.example\` for all required configuration values.

## Health Check

\`\`\`bash
curl http://localhost:3000/health
\`\`\`

Expected response:
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "checks": {
    "database": "connected",
    "redis": "connected"
  }
}
\`\`\`

## Troubleshooting

- Database connection issues: Verify DATABASE_URL in .env
- Port conflicts: Change PORT in .env
- Permission issues: Check Docker volume permissions
`;
}

/**
 * Generate Nginx reverse proxy configuration.
 */
export function generateNginxConfig(
  domain: string,
  appPort: number,
  sslEnabled: boolean
): string {
  return `server {
    listen 80;
    server_name ${domain};
    ${sslEnabled ? '' : "# Uncomment for HTTPS"}

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy to application
    location / {
        proxy_pass http://localhost:${appPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Static assets (if served directly)
    location /static/ {
        alias /app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check (bypass cache)
    location /health {
        proxy_pass http://localhost:${appPort}/health;
        access_log off;
    }
}
`;
}

/**
 * Generate systemd service file.
 */
export function generateSystemdService(
  appName: string,
  appPath: string,
  user: string
): string {
  return `[Unit]
Description=${appName} Application
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=${user}
WorkingDirectory=${appPath}
ExecStart=/usr/bin/node ${appPath}/dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=${appPath}/.env

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=${appPath}/logs ${appPath}/uploads
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictRealtime=true
RestrictNamespaces=true

# Resource limits
LimitNOFILE=65536
MemoryMax=1G

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${appName}

[Install]
WantedBy=multi-user.target
`;
}
