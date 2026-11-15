/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Productivity Domain Pack
 *
 * Productivity and task management platform for teams and individuals. Covers project
 * organization, task tracking with dependencies, document collaboration, team
 * communication, goal setting, and workflow automation with offline and real-time
 * sync capabilities.
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
      { id: 'member', name: 'Member', typicalFeatures: pack.customer.features, permissions: ['read', 'write'] },
      { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'reports'], permissions: ['admin'] },
      { id: 'support', name: 'Support', typicalFeatures: ['support', 'operations'], permissions: ['read', 'support'] },
    ],
    role: 'user',
    standardFeatures: allFeatures.length > 0 ? allFeatures : [{ category: 'core', name: 'core', description: 'Core product', priority: 'essential' }],
    businessModels: [{ modelType: pack.domain, revenueStreams: ['subscription', 'enterprise-license', 'professional-services'], costStructure: ['infrastructure', 'engineering', 'support', 'sales'], pricingStrategy: ['freemium', 'per-seat', 'enterprise'] }],
    technicalPatterns: [
      { category: 'sync', name: 'Real-time Collaboration', description: 'Operational transform for concurrent document editing' },
      { category: 'offline', name: 'Offline-First Architecture', description: 'Local storage with background sync on reconnection' },
      { category: 'integration', name: 'Plugin System', description: 'Extensible integration framework with sandboxed execution' },
    ],
    operationalLifecycle: [
      { id: 'onboard', name: 'Onboard', description: 'User signs up and creates workspace' },
      { id: 'create', name: 'Create', description: 'User creates projects and tasks' },
      { id: 'collaborate', name: 'Collaborate', description: 'Team members work together in real-time' },
      { id: 'track', name: 'Track', description: 'Progress monitoring and reporting' },
      { id: 'optimize', name: 'Optimize', description: 'Workflow automation and process improvement' },
    ],
    designPrinciples: [
      { name: 'Workspace-First', description: 'Primary interface is the user workspace with sidebar navigation' },
      { name: 'Keyboard-First', description: 'Power user keyboard shortcuts and command palette' },
      { name: 'Minimal UI', description: 'Clean, uncluttered interface that stays out of the way' },
    ],
    securityConsiderations: [
      { category: 'auth', name: 'SSO + Workspace Permissions', description: 'Enterprise SSO with workspace-level RBAC', severity: 'high' },
      { category: 'data', name: 'E2E Encryption', description: 'End-to-end encrypted data with SOC2 compliance', severity: 'high' },
      { category: 'compliance', name: 'Regulatory Standards', description: 'GDPR, SOC 2, and ISO 27001 compliance', severity: 'medium' },
    ],
    regulations: [
      { name: 'GDPR', requirements: ['Data portability', 'Right to erasure', 'Consent management', 'Breach notification within 72 hours'] },
      { name: 'SOC 2', requirements: ['Annual penetration testing', 'Access control reviews', 'Incident response plan', 'Change management'] },
      { name: 'ISO 27001', requirements: ['Information security management', 'Risk assessment', 'Continuous improvement', 'Supplier security'] },
    ],
    testingRequirements: [
      { category: 'unit', name: 'Dependency Graph', description: 'Cycle detection and resolution in task dependencies', priority: 'high' },
      { category: 'unit', name: 'Permission Matrix', description: 'Each role against each resource action', priority: 'high' },
      { category: 'unit', name: 'Notification Dedup', description: 'Smart grouping and deduplication logic', priority: 'medium' },
      { category: 'integration', name: 'Real-time Sync', description: 'Task creation → notification → sync → mobile push → read receipt', priority: 'high' },
      { category: 'integration', name: 'Document Collab', description: 'Edit → OT → conflict resolution → version save → notification', priority: 'high' },
      { category: 'integration', name: 'Workspace Invite', description: 'Invite → email → acceptance → role → first project creation', priority: 'high' },
      { category: 'e2e', name: 'Team Collaboration', description: 'Sign up → workspace → invite team → create project → tasks with dependencies → complete → review dashboard', priority: 'high' },
      { category: 'e2e', name: 'SSO Provisioning', description: 'SSO login → IdP assertion → provisioning → role assignment → permissions enforced', priority: 'high' },
    ],
    workflows: [
      { id: 'project-creation', name: 'Project Creation', steps: ['create-project', 'set-settings', 'invite-members', 'create-initial-tasks', 'set-deadlines'], entities: ['Project', 'Task', 'Member'] },
      { id: 'task-lifecycle', name: 'Task Lifecycle', steps: ['create-task', 'assign', 'set-dependencies', 'work-on', 'complete', 'review'], entities: ['Task', 'Dependency', 'Comment'] },
      { id: 'collaboration', name: 'Real-time Collaboration', steps: ['user-edits', 'broadcast-change', 'apply-transform', 'resolve-conflicts', 'update-versions'], entities: ['Document', 'Edit', 'Version'] },
      { id: 'automation', name: 'Automation Trigger', steps: ['detect-trigger', 'evaluate-conditions', 'execute-actions', 'log-results', 'notify-stakeholders'], entities: ['Automation', 'Trigger', 'Action'] },
    ],
    entities: [
      { name: 'Project', description: 'Top-level organizational container for tasks', invariants: ['has at least one member', 'name is unique within workspace'] },
      { name: 'Task', description: 'Individual work item with status and assignment', invariants: ['belongs to exactly one project', 'status transitions are ordered'] },
      { name: 'Document', description: 'Collaborative document with version history', invariants: ['has creator', 'version monotonically increases'] },
      { name: 'Workspace', description: 'Top-level tenant container', invariants: ['has owner', 'unique name per account'] },
    ],
    invariants: [
      'A task cannot be completed if blockers are incomplete',
      'Circular dependency detection prevents invalid task graphs',
      'Workspace data isolated at database query level',
      'Private projects visible only to explicitly added members',
      'Deleted projects soft-delete for 30 days before permanent removal',
      'Shared project access is real-time, not copied',
    ],
    constraints: [
      'Maximum 1000 tasks per project (soft limit)',
      'Maximum 100MB per file attachment',
      'Maximum 50 members per workspace on free tier',
      'API rate limit: 100 requests per minute per user',
    ],
    financialFlows: [
      { name: 'subscription-revenue', direction: 'in', trigger: 'monthly-billing-cycle' },
      { name: 'plan-upgrade', direction: 'in', trigger: 'plan-change' },
      { name: 'infrastructure-cost', direction: 'out', trigger: 'monthly-usage' },
      { name: 'support-cost', direction: 'out', trigger: 'support-ticket' },
    ],
    successMetrics: [
      'daily-active-users',
      'task-completion-rate',
      'collaboration-frequency',
      'time-to-first-task',
      'workspace-retention',
      'feature-adoption-rate',
      'api-usage-growth',
    ],
    analytics: {
      tracked: ['usage-metrics', 'performance-metrics', 'feature-adoption', 'error-rates', 'collaboration-patterns'],
      dashboards: ['overview', 'team-performance', 'usage-trends', 'financial'],
    },
    securityRequirements: [
      'SSO with SAML/OIDC support',
      'Workspace-level RBAC with custom roles',
      'E2E encryption for sensitive data',
      'Audit logging for all data access',
      'Data residency options available',
    ],
    regulatory: [
      { regulation: 'GDPR', applies: true, notes: 'Data export and deletion endpoints provided' },
      { regulation: 'SOC 2', applies: true, notes: 'Annual audit with penetration testing' },
      { regulation: 'ISO 27001', applies: true, notes: 'Information security management system certified' },
    ],
  };
}

// ── Productivity Pack ─────────────────────────────────────────────────────────

export const PRODUCTIVITY_PACK: DomainPack = {
  domain: 'productivity',
  name: 'Productivity & Task Management Platform',
  description:
    'Productivity and task management platform for teams and individuals. Covers project organization, task tracking with dependencies, document collaboration, team communication, goal setting, and workflow automation with offline and real-time sync capabilities.',

  // ── Catalog ─────────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Projects', 'Tasks', 'Documents', 'Teams', 'Goals', 'Automations'],
    features: [
      'project-management',
      'task-tracking',
      'subtasks',
      'task-dependencies',
      'document-collaboration',
      'real-time-editing',
      'team-chat',
      'file-sharing',
      'goal-tracking',
      'workflow-automation',
      'calendar-integration',
      'time-tracking',
      'reporting-dashboards',
      'search-filtering',
      'template-library',
      'third-party-integrations',
      'offline-mode',
      'mobile-app',
      'notification-center',
      'kanban-boards',
    ],
  },

  // ── Fulfillment ─────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['cloud', 'self-hosted', 'desktop', 'mobile'],
    features: [
      'real-time-collab',
      'offline-mode',
      'integrations',
      'automation',
      'api-access',
      'webhook-support',
      'plugin-system',
      'data-export',
    ],
  },

  // ── Customer Features ───────────────────────────────────────────────────────
  customer: {
    features: [
      'project-dashboard',
      'task-management',
      'docs',
      'calendar',
      'team-chat',
      'goal-tracking',
      'time-tracking',
      'reporting',
      'notifications',
      'integrations',
    ],
  },

  // ── Operations Features ─────────────────────────────────────────────────────
  operations: {
    features: [
      'user-management',
      'billing',
      'integrations',
      'automation-engine',
      'support',
      'workspace-ops',
      'usage-monitoring',
      'data-migration',
    ],
  },

  // ── Experience Features ─────────────────────────────────────────────────────
  experience: {
    features: [
      'keyboard-shortcuts',
      'templates',
      'notifications',
      'progress-tracking',
      'quick-actions',
      'command-palette',
      'recent-items',
      'custom-views',
    ],
  },

  // ── Components ──────────────────────────────────────────────────────────────
  components: {
    public: ['landing', 'features', 'pricing', 'docs', 'changelog'],
    customer: ['workspace', 'projects', 'tasks', 'settings', 'team', 'integrations'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'settings', 'billing', 'audit'],
    staff: ['support', 'operations', 'engineering-tools'],
  },

  // ── Business Rules ──────────────────────────────────────────────────────────
  businessRules: {
    taskDependencies: 'Tasks with blockers cannot be marked complete. Circular dependency detection prevents invalid graphs. Dependency chains shown in Gantt-style timeline. Breaking dependency requires escalation approval. Parallel tasks allowed; critical path highlighted.',
    permissions: 'Workspace-level role inheritance: owner > admin > member > guest. Private projects visible only to explicitly added members. Guest users view assigned tasks but cannot edit. Admin can reassign ownership but cannot remove workspace owner. Permission changes logged in audit trail.',
    notifications: 'Smart notification grouping: multiple updates within 5 minutes batched. Do-not-disturb periods suppress per user preference. Digest mode (daily/weekly) consolidates. Push notifications for mobile with action buttons. In-app notification center with read/unread state.',
    integrations: 'Third-party integrations require OAuth2 or API key. Integration permissions scoped to least privilege. Webhook endpoints must use HTTPS with signature verification. Integration data sync runs on 15-minute polling or webhook push. Failed integrations retry with exponential backoff (3 attempts).',
    dataRetention: 'Deleted projects soft-delete for 30 days. Task history retained indefinitely within project. File attachments counted toward workspace storage quota. Audit logs retained for 7 years per SOC 2. GDPR right-to-erasure processed within 30 days. Export in JSON, CSV, PDF.',
    sharingRules: 'Shared projects inherit sharer role minimum. External sharing requires invite link with expiry (7/30/90 days). Link sharing restricted to view-only. Data from shared projects not copied — access is real-time. Revoking access removes shared data from recipient within 24 hours.',
  },

  // ── Design ──────────────────────────────────────────────────────────────────
  design: {
    layout: ['workspace-first', 'split-pane', 'minimal-ui', 'sidebar-nav'],
    color: ['neutral-light', 'accent-color', 'status-green-red', 'subtle-borders'],
    typography: ['readable-body', 'monospace-code', 'clear-headings', 'compact-table'],
    interaction: ['keyboard-first', 'drag-drop', 'inline-edit', 'command-palette'],
    accessibility: ['keyboard-nav', 'screen-reader', 'high-contrast', 'focus-management'],
  },

  // ── Security ────────────────────────────────────────────────────────────────
  security: {
    auth: 'SSO + workspace-level permissions. SAML SSO for enterprise with JIT provisioning. Workspace-level RBAC with custom roles. MFA enforcement option per workspace. API keys for integrations with scoped permissions. Session management with idle timeout.',
    data: 'E2E encrypted at rest (AES-256) and in transit (TLS 1.3). SOC2 compliant with annual penetration testing. Document versioning with change tracking. Audit logs for all data access. Backup every 6 hours with 30-day retention. Geographic data residency options.',
    compliance: ['GDPR', 'SOC 2', 'ISO 27001'],
  },

  // ── Testing ─────────────────────────────────────────────────────────────────
  testing: {
    unit: [
      'Task dependency graph: cycle detection and resolution',
      'Permission check matrix: each role against each resource action',
      'Notification deduplication and grouping logic',
      'Storage quota enforcement and overage handling',
      'Webhook delivery with retry and exponential backoff',
      'Recurring task instance generation with date math',
    ],
    integration: [
      'Task creation → notification → real-time sync → mobile push → read receipt',
      'Document edit → OT → conflict resolution → version save → change notification',
      'Integration webhook → event processing → task update → notification → audit log',
      'Workspace invite → email delivery → acceptance → role assignment → first project',
    ],
    e2e: [
      'User signs up → creates workspace → invites team → creates project → adds tasks with dependencies → marks complete → reviews progress dashboard',
      'Admin configures SSO → team logs in via IdP → auto-provisioned → correct roles → permissions enforced',
    ],
  },
};

// ── Productivity Domain Model ─────────────────────────────────────────────────

export const PRODUCTIVITY_DOMAIN: DomainModel = toDomainModel(PRODUCTIVITY_PACK);
