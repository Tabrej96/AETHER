/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Developer Tools Domain Pack
 *
 * Developer tools and DevOps platform for modern software teams. Covers source code
 * repositories, CI/CD pipelines, infrastructure monitoring, secrets management,
 * deployment orchestration, environment management, and observability with
 * multi-mode deployment (SaaS, self-hosted, hybrid, air-gapped).
 */


import type {  } from './domainPackTypes.js';
// ── Local Type Definitions ───────────────────────────────────────────────────



export interface CustomerFeaturesSpec {
  features: string[];
}

export interface OperationsFeaturesSpec {
  features: string[];
}

export interface ExperienceFeaturesSpec {
  features: string[];
}








// ── Adapter ──────────────────────────────────────────────────────────────────

function toDomainModel(pack: DomainPack): DomainModel {
  const allFeatures: DomainModel['standardFeatures'] = [];

  if (pack.catalog?.features?.length) {
    for (const f of pack.catalog.features) {
      allFeatures.push({ category: 'catalog', name: f, description: '', priority: 'essential' });
    }
  }
  if (pack.fulfillment?.features?.length) {
    for (const f of pack.fulfillment.features) {
      allFeatures.push({ category: 'fulfillment', name: f, description: '', priority: 'expected' });
    }
  }
  if (pack.customer?.features?.length) {
    for (const f of pack.customer.features) {
      allFeatures.push({ category: 'customer', name: f, description: '', priority: 'expected' });
    }
  }
  if (pack.operations?.features?.length) {
    for (const f of pack.operations.features) {
      allFeatures.push({ category: 'operations', name: f, description: '', priority: 'essential' });
    }
  }
  if (pack.experience?.features?.length) {
    for (const f of pack.experience.features) {
      allFeatures.push({ category: 'experience', name: f, description: '', priority: 'differentiating' });
    }
  }
  if (pack.components) {
    for (const [group, items] of Object.entries(pack.components)) {
      for (const n of items) {
        allFeatures.push({ category: 'components', name: `${group}:${n}`, description: '', priority: 'essential' });
      }
    }
  }
  for (const [k, v] of Object.entries(pack.businessRules)) {
    allFeatures.push({ category: 'business', name: k, description: v, priority: 'essential' });
  }

  return {
    id: pack.domain,
    domain: pack.domain,
    name: pack.name,
    label: pack.name,
    category: pack.catalog.categories[0] ?? 'general',
    description: pack.description,
    userRoles: [
      { id: 'developer', name: 'Developer', typicalFeatures: pack.customer.features, permissions: ['read', 'write', 'deploy'] },
      { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'settings'], permissions: ['admin'] },
      { id: 'ops', name: 'Operations', typicalFeatures: pack.operations.features, permissions: ['read', 'write', 'incident'] },
    ],
    role: 'user',
    standardFeatures: allFeatures.length > 0 ? allFeatures : [{ category: 'core', name: 'core', description: 'Core product', priority: 'essential' }],
    businessModels: [{ modelType: pack.domain, revenueStreams: ['subscription', 'enterprise', 'professional-services'], costStructure: ['infrastructure', 'engineering', 'support', 'security'], pricingStrategy: ['per-user', 'usage-based', 'enterprise-negotiated'] }],
    technicalPatterns: [
      { category: 'ci-cd', name: 'Pipeline Orchestration', description: 'DAG-based CI/CD pipeline with conditional stages' },
      { category: 'iac', name: 'Infrastructure as Code', description: 'Terraform/Pulumi-based infrastructure provisioning' },
      { category: 'observability', name: 'Three Pillars of Observability', description: 'Metrics, logs, and traces unified in single platform' },
    ],
    operationalLifecycle: [
      { id: 'develop', name: 'Develop', description: 'Write code and commit to repository' },
      { id: 'build', name: 'Build', description: 'CI pipeline runs tests and builds artifacts' },
      { id: 'deploy', name: 'Deploy', description: 'CD pipeline deploys to target environment' },
      { id: 'operate', name: 'Operate', description: 'Application runs in production with monitoring' },
      { id: 'respond', name: 'Respond', description: 'Incident detection, response, and resolution' },
    ],
    designPrinciples: [
      { name: 'Terminal-First', description: 'CLI interface as primary interaction method' },
      { name: 'Code-Focused', description: 'Developer-centric interface with syntax highlighting' },
      { name: 'Modular Dashboard', description: 'Customizable dashboard panels for different workflows' },
    ],
    securityConsiderations: [
      { category: 'auth', name: 'SSH Keys and OAuth', description: 'SSH key and OAuth-based authentication with fine-grained RBAC', severity: 'critical' },
      { category: 'data', name: 'Secrets Management', description: 'Encrypted secrets with audit logging and rotation', severity: 'critical' },
      { category: 'compliance', name: 'Enterprise Compliance', description: 'SOC 2, ISO 27001, and FedRAMP compliance', severity: 'high' },
    ],
    regulations: [
      { name: 'SOC 2', requirements: ['Access control reviews', 'Penetration testing', 'Incident response plan', 'Change management'] },
      { name: 'ISO 27001', requirements: ['Information security management', 'Risk assessment', 'Continuous improvement'] },
      { name: 'FedRAMP', requirements: ['Government cloud security requirements', 'Continuous monitoring', 'Authorization packages'] },
      { name: 'GDPR', requirements: ['Data minimization', 'Right to erasure', 'Breach notification within 72 hours'] },
    ],
    testingRequirements: [
      { category: 'unit', name: 'Pipeline Parser', description: 'YAML syntax validation and circular dependency detection', priority: 'high' },
      { category: 'unit', name: 'Secret Masking', description: 'Secrets redacted in logs and pipeline output', priority: 'critical' },
      { category: 'unit', name: 'Access Control Matrix', description: 'Each role against each repository action', priority: 'high' },
      { category: 'integration', name: 'CI/CD Pipeline', description: 'Git push → webhook → CI → build → test → deploy → health check → notify', priority: 'high' },
      { category: 'integration', name: 'Secret Rotation', description: 'Rotation → update references → restart services → verify health → archive', priority: 'high' },
      { category: 'integration', name: 'Incident Response', description: 'Incident → page on-call → war room → runbook → status page → resolution', priority: 'high' },
      { category: 'e2e', name: 'Full Deployment', description: 'Commit → CI builds and tests → reviewer approves → deploy to staging → tests pass → production deploy → monitoring confirms', priority: 'high' },
      { category: 'e2e', name: 'Security Alert', description: 'Alert detected → vulnerability scan → team notified → patch PR → CI validates → deploy → post-scan confirms fix', priority: 'high' },
    ],
    workflows: [
      { id: 'ci-pipeline', name: 'CI Pipeline', steps: ['code-push', 'lint', 'unit-tests', 'build', 'integration-tests', 'artifact-publish'], entities: ['Commit', 'Build', 'TestResult'] },
      { id: 'cd-pipeline', name: 'CD Pipeline', steps: ['approval', 'deploy-staging', 'smoke-tests', 'approve-production', 'deploy-production', 'health-check'], entities: ['Deployment', 'Environment', 'Release'] },
      { id: 'incident-response', name: 'Incident Response', steps: ['detect', 'classify-severity', 'page-oncall', 'war-room', 'runbook-execution', 'resolve', 'postmortem'], entities: ['Incident', 'Alert', 'Runbook'] },
      { id: 'secret-rotation', name: 'Secret Rotation', steps: ['schedule', 'generate-new', 'update-services', 'verify-health', 'archive-old', 'audit-log'], entities: ['Secret', 'Service', 'AuditLog'] },
    ],
    entities: [
      { name: 'Repository', description: 'Git repository with branch protection and access controls', invariants: ['unique name per workspace', 'at least one branch', 'access control enforced'] },
      { name: 'Pipeline', description: 'CI/CD pipeline defined as code with stages and conditions', invariants: ['valid YAML syntax', 'no circular dependencies', 'at least one stage'] },
      { name: 'Environment', description: 'Deployment target (staging, production, etc.)', invariants: ['unique name', 'has deployment target', 'protected by approval rules'] },
      { name: 'Secret', description: 'Encrypted credential with access tracking', invariants: ['encrypted at rest', 'access logged', 'rotation schedule defined'] },
    ],
    invariants: [
      'Main branch protected: requires review, passing CI, no merge conflicts',
      'Force-push disabled on protected branches',
      'Production deployments require approval from designated approvers',
      'All secrets rotated every 90 days for production',
      'Inactive access (90+ days) automatically revoked',
      'Failed pipelines retry with exponential backoff before alerting',
    ],
    constraints: [
      'Repository storage: 5GB soft limit at 4GB with warning',
      'CI minutes: 500/month free, then $0.002/minute',
      'Concurrent pipelines limited by plan tier',
      'Build artifact retention: 30 days free, 90 days paid',
      'Max compute per job: 4 vCPU, 16GB RAM',
    ],
    financialFlows: [
      { name: 'subscription-revenue', direction: 'in', trigger: 'monthly-billing-cycle' },
      { name: 'ci-minutes-charge', direction: 'in', trigger: 'overage-usage' },
      { name: 'infrastructure-cost', direction: 'out', trigger: 'cloud-usage' },
      { name: 'support-cost', direction: 'out', trigger: 'support-ticket' },
    ],
    successMetrics: [
      'pipeline-success-rate',
      'mean-time-to-deploy',
      'mean-time-to-recovery',
      'deployment-frequency',
      'change-failure-rate',
      'test-coverage',
      'secret-rotation-compliance',
      'access-review-completion',
    ],
    analytics: {
      tracked: ['pipeline-metrics', 'deployment-frequency', 'error-rates', 'resource-usage', 'security-events'],
      dashboards: ['pipeline', 'deployment', 'security', 'cost', 'incident'],
    },
    securityRequirements: [
      'SSH key authentication with biometric verification',
      'Fine-grained RBAC at repository, branch, and environment levels',
      'Envelope encryption for secrets with customer-managed keys',
      'Complete audit trail for all infrastructure changes',
      'Annual penetration testing and bug bounty program',
    ],
    regulatory: [
      { regulation: 'SOC 2', applies: true, notes: 'Annual audit with access control reviews' },
      { regulation: 'ISO 27001', applies: true, notes: 'Information security management certified' },
      { regulation: 'FedRAMP', applies: true, notes: 'Government cloud security authorization' },
      { regulation: 'GDPR', applies: true, notes: 'Data processing agreement and breach notification' },
    ],
  };
}

// ── Developer Tools Pack ──────────────────────────────────────────────────────

export const DEVELOPER_TOOLS_PACK: DomainPack = {
  domain: 'developer_tools',
  name: 'Developer Tools & DevOps Platform',
  description:
    'Developer tools and DevOps platform for modern software teams. Covers source code repositories, CI/CD pipelines, infrastructure monitoring, secrets management, deployment orchestration, environment management, and observability with multi-mode deployment (SaaS, self-hosted, hybrid, air-gapped).',

  // ── Catalog ─────────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Repositories', 'CI/CD', 'Monitoring', 'Environments', 'Secrets', 'Deployments'],
    features: [
      'git-repositories',
      'code-review',
      'ci-pipelines',
      'cd-deployments',
      'infrastructure-monitoring',
      'log-aggregation',
      'secrets-management',
      'environment-variables',
      'deployment-orchestration',
      'incident-response',
      'cost-management',
      'access-control',
      'vulnerability-scanning',
      'container-registry',
      'feature-flags',
      'rollback-management',
      'performance-profiling',
      'alert-management',
      'service-discovery',
      'api-gateway',
    ],
  },

  // ── Fulfillment ─────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['saas', 'self-hosted', 'hybrid', 'air-gapped'],
    features: [
      'pipeline-orchestration',
      'infrastructure-as-code',
      'secrets-management',
      'observability',
      'deployment-orchestration',
      'cost-tracking',
      'incident-management',
      'security-scanning',
    ],
  },

  // ── Customer Features ───────────────────────────────────────────────────────
  customer: {
    features: [
      'code-repos',
      'pipelines',
      'monitoring',
      'environments',
      'docs',
      'deployments',
      'alerts',
      'team-management',
    ],
  },

  // ── Operations Features ─────────────────────────────────────────────────────
  operations: {
    features: [
      'infrastructure',
      'security-scanning',
      'incident-response',
      'cost-management',
      'access-control',
      'compliance-audit',
      'capacity-planning',
      'disaster-recovery',
    ],
  },

  // ── Experience Features ─────────────────────────────────────────────────────
  experience: {
    features: [
      'cli-interface',
      'web-dashboard',
      'ide-integration',
      'real-time-logs',
      'terminal-ui',
      'quick-actions',
      'custom-workspaces',
      'notification-center',
    ],
  },

  // ── Components ──────────────────────────────────────────────────────────────
  components: {
    public: ['docs', 'pricing', 'status', 'changelog', 'blog'],
    customer: ['dashboard', 'repos', 'pipelines', 'settings', 'monitoring', 'environments'],
    admin: ['dashboard', 'user-mgmt', 'settings', 'audit', 'billing', 'compliance'],
    staff: ['operations', 'security', 'support', 'engineering', 'platform'],
  },

  // ── Business Rules ──────────────────────────────────────────────────────────
  businessRules: {
    branchProtection: 'Main branch protected: requires 1+ approving review, passing CI, no merge conflicts. Force-push disabled. Branch deletion requires admin approval. PRs from forks require maintainer approval before CI runs.',
    deploymentApproval: 'Production requires approval from designated approvers. Staging auto-approves after CI passes. Hotfix can bypass with senior override and mandatory post-deployment review. Approval chain configurable per environment. Auto-rollback if health checks fail within 5 min.',
    secretRotation: 'All secrets rotated every 90 days for production. Rotation coordinated with dependent services. Old secrets valid for 24-hour grace period. Automated for cloud provider credentials. Manual for third-party API keys. Rotation alerts to security team.',
    accessControl: 'Fine-grained RBAC at repository, branch, and environment levels. SSH keys required for Git; password auth disabled. API tokens scoped to specific repos and actions. Service accounts for CI/CD with least-privilege. Inactive access (90+ days) auto-revoked.',
    resourceQuotas: 'Repository storage limited to 5GB (soft at 4GB). CI minutes: 500/month free, then $0.002/min. Concurrent pipelines by plan tier. Artifact retention: 30 days free, 90 days paid. Max compute per job: 4 vCPU, 16GB RAM.',
    incidentResponse: 'P0 incidents auto-page on-call within 60 seconds. Severity levels: P0 outage, P1 degraded, P2 minor, P3 cosmetic. War room within 5 min of P0. Post-mortem within 48 hours for P0/P1. Status page and Slack communication.',
  },

  // ── Design ──────────────────────────────────────────────────────────────────
  design: {
    layout: ['terminal-first', 'code-focused', 'dashboard-modular', 'split-terminal'],
    color: ['dark-theme', 'syntax-highlight', 'status-green-red', 'subtle-accent'],
    typography: ['monospace-code', 'clear-labels', 'tabular-numbers', 'compact-ui'],
    interaction: ['cli-commands', 'inline-editing', 'keyboard-shortcuts', 'command-palette'],
    accessibility: ['terminal-nav', 'keyboard-shortcuts', 'screen-reader', 'high-contrast'],
  },

  // ── Security ────────────────────────────────────────────────────────────────
  security: {
    auth: 'SSH keys, OAuth, fine-grained RBAC. SSH key management with biometric verification. OAuth2 for third-party integrations. Fine-grained RBAC at repository, branch, and environment levels. MFA required for all human accounts. Service accounts for CI/CD with time-limited tokens.',
    data: 'Secrets encrypted at rest using envelope encryption with customer-managed keys. Audit logging for all secret and infrastructure access. Code repositories encrypted at rest. Pipeline artifacts scanned for sensitive data. Access logs retained for 7 years.',
    compliance: ['SOC 2', 'ISO 27001', 'GDPR', 'FedRAMP'],
  },

  // ── Testing ─────────────────────────────────────────────────────────────────
  testing: {
    unit: [
      'Pipeline YAML parser: syntax validation and circular dependency detection',
      'Secret masking: secrets redacted in logs and output',
      'Access control matrix: each role against each repository action',
      'Webhook payload validation and signature verification',
      'Resource quota enforcement: block pipeline at limits',
      'Deployment health check scoring and rollback trigger',
    ],
    integration: [
      'Git push → webhook → CI → build → test → deploy → health check → notification',
      'Secret rotation → update references → restart services → verify health → archive',
      'Incident creation → page on-call → war room → runbook → status page → resolution',
      'Infrastructure change → IaC plan → approval → apply → health check → audit log',
    ],
    e2e: [
      'Developer commits → CI builds and tests → reviewer approves → auto-deploys to staging → integration tests pass → production deploy → monitoring confirms health',
      'Security alert → vulnerability scan → team notification → patch PR → CI validates → deploy → post-deployment scan confirms fix',
    ],
  },
};

// ── Developer Tools Domain Model ──────────────────────────────────────────────

export const DEVELOPER_TOOLS_DOMAIN: DomainModel = toDomainModel(DEVELOPER_TOOLS_PACK);
