/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SaaS Domain Pack
 *
 * Multi-tenant SaaS application domain model. Covers organization-level multi-tenancy
 * with team roles and permissions, project and task management, billing with plans and quotas,
 * notifications, activity logging, file attachments with auth, and realtime collaboration.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type { BusinessRulesSpec, DesignSpec, SecuritySpec, TestingSpec } from './domainPackTypes.js';
export interface PlanSpec {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  quotas: Record<string, number>;
  seats: number;
  stripePriceId?: string;
}

export interface PermissionSpec {
  name: string;
  description: string;
}

export interface RoleSpec {
  name: string;
  description: string;
  permissions: string[];
}

export interface TeamSpec {
  roles: RoleSpec[];
  features: string[];
}

export interface ProjectSpec {
  features: string[];
}

export interface TaskSpec {
  features: string[];
}

export interface BillingSpec {
  features: string[];
  paymentProviders: string[];
}

export interface NotificationSpec {
  channels: string[];
  triggers: string[];
}

export interface ActivitySpec {
  events: string[];
  retentionDays: number;
}

export interface FileAttachmentSpec {
  maxSizeMB: number;
  allowedTypes: string[];
  features: string[];
}

export interface RealtimeSpec {
  features: string[];
}


export const SAAS_PACK: DomainPack = {
  domain: 'saas',
  name: 'Multi-Tenant SaaS Platform',
  description:
    'Complete multi-tenant SaaS application with organization isolation, team-based roles and permissions, project and task management, billing with usage quotas, notifications, activity logging, authenticated file attachments, and realtime collaboration features.',

  // ── Plans & Billing ──────────────────────────────────────────────────────
  plans: [
    {
      id: 'free',
      name: 'Free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ['basic-tasks', 'up-to-3-projects', '1-gb-storage', 'email-support', 'basic-reporting'],
      quotas: { projects: 3, tasks: 100, storageGB: 1, teamMembers: 3, integrations: 1, apiCallsPerMonth: 10000 },
      seats: 3,
    },
    {
      id: 'pro',
      name: 'Pro',
      monthlyPrice: 12,
      yearlyPrice: 120,
      features: ['unlimited-tasks', 'unlimited-projects', '100-gb-storage', 'priority-support', 'advanced-reporting', 'custom-fields', 'automations', 'integrations'],
      quotas: { projects: -1, tasks: -1, storageGB: 100, teamMembers: 20, integrations: 10, apiCallsPerMonth: 100000 },
      seats: 20,
    },
    {
      id: 'business',
      name: 'Business',
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: ['everything-in-pro', 'unlimited-storage', 'dedicated-support', 'sso', 'audit-logs', 'advanced-automations', 'custom-branding', 'sla', 'api-access'],
      quotas: { projects: -1, tasks: -1, storageGB: -1, teamMembers: 100, integrations: 50, apiCallsPerMonth: 1000000 },
      seats: 100,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ['everything-in-business', 'unlimited-everything', 'dedicated-success-manager', 'custom-sla', 'self-hosted-option', 'sso-saml', 'advanced-security', 'custom-integrations', 'white-label'],
      quotas: { projects: -1, tasks: -1, storageGB: -1, teamMembers: -1, integrations: -1, apiCallsPerMonth: -1 },
      seats: -1,
    },
  ],

  // ── Roles & Permissions ──────────────────────────────────────────────────
  roles: {
    roles: [
      {
        name: 'Owner',
        description: 'Full organization control including billing and member management',
        permissions: ['*'],
      },
      {
        name: 'Admin',
        description: 'Manage team members, projects, and organization settings',
        permissions: [
          'projects.create', 'projects.edit', 'projects.delete',
          'members.invite', 'members.remove', 'members.edit-role',
          'settings.edit', 'billing.view', 'integrations.manage',
          'reports.view', 'audit-logs.view',
        ],
      },
      {
        name: 'Member',
        description: 'Standard team member with project access',
        permissions: [
          'projects.view', 'projects.edit-own', 'tasks.create', 'tasks.edit-own',
          'tasks.delete-own', 'comments.create', 'files.upload', 'files.view',
        ],
      },
      {
        name: 'Guest',
        description: 'Limited read-only access to assigned items',
        permissions: [
          'projects.view-assigned', 'tasks.view-assigned', 'comments.view',
        ],
      },
    ],
    features: ['custom-roles', 'permission-inheritance', 'role-templates', 'audit-logging'],
  },
  permissions: [
    { name: 'projects.create', description: 'Create new projects within the organization' },
    { name: 'projects.edit', description: 'Edit any project in the organization' },
    { name: 'projects.delete', description: 'Delete projects from the organization' },
    { name: 'members.invite', description: 'Send invitations to join the organization' },
    { name: 'members.remove', description: 'Remove members from the organization' },
    { name: 'billing.view', description: 'View and manage billing information' },
    { name: 'settings.edit', description: 'Edit organization settings' },
    { name: 'reports.view', description: 'View organization reports and analytics' },
    { name: 'audit-logs.view', description: 'Access security and activity audit logs' },
    { name: 'integrations.manage', description: 'Configure third-party integrations' },
  ],

  // ── Projects ─────────────────────────────────────────────────────────────
  projects: {
    features: ['create', 'archive', 'duplicate', 'templates', 'custom-fields', 'status-tracking', 'due-dates', 'labels', 'description', 'attachments', 'comments', 'activity-log'],
  },

  // ── Tasks ────────────────────────────────────────────────────────────────
  tasks: {
    features: ['create', 'assign', 'status', 'priority', 'due-dates', 'subtasks', 'dependencies', 'labels', 'comments', 'attachments', 'time-tracking', 'recurring', 'templates'],
  },

  // ── Billing ──────────────────────────────────────────────────────────────
  billing: {
    features: ['subscriptions', 'plan-upgrades', 'plan-downgrades', 'seat-based-pricing', 'usage-tracking', 'invoices', 'payment-methods', 'billing-portal', 'proration', 'trial-management', 'overage-charges'],
    paymentProviders: ['stripe', 'paypal', 'razorpay', 'bank-transfer'],
  },

  // ── Notifications ────────────────────────────────────────────────────────
  notifications: {
    channels: ['email', 'in-app', 'push', 'webhook', 'sms'],
    triggers: [
      'task-assigned', 'task-completed', 'comment-added', 'project-invited',
      'deadline-approaching', 'mention', 'status-changed', 'billing-event',
      'team-member-joined', 'system-maintenance',
    ],
  },

  // ── Activity Log ─────────────────────────────────────────────────────────
  activityLog: {
    events: [
      'user.login', 'user.logout', 'project.created', 'project.updated', 'project.deleted', 'project.archived',
      'task.created', 'task.updated', 'task.deleted', 'task.status-changed',
      'member.invited', 'member.joined', 'member.removed',
      'file.uploaded', 'file.deleted',
      'settings.changed', 'billing.updated',
      'integration.connected', 'integration.disconnected',
      'permission.changed',
    ],
    retentionDays: 365,
  },

  // ── Files ────────────────────────────────────────────────────────────────
  files: {
    maxSizeMB: 100,
    allowedTypes: ['image/*', 'application/pdf', 'text/*', 'video/*', 'audio/*'],
    features: ['upload', 'download', 'preview', 'versioning', 'auth-check', 'virus-scan', 'thumbnail-generation', 'share-link'],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: {
    pricing:
      'Tiered subscription plans with per-seat pricing on Business and Enterprise tiers. Annual billing receives 2 months free (17% discount). Overage charges: Pro tier at $0.10 per task over quota, $0.50/GB over storage quota. Seat pricing: Business $29/seat/month billed annually, $35/seat/month billed monthly. Enterprise: custom pricing with negotiated SLA. Proration on mid-cycle plan changes: upgrade effective immediately, downgrade at period end. 14-day free trial on Pro and Business plans (no credit card required).',

    quotas:
      'Hard quota enforcement: task creation blocked when at limit with upgrade prompt. Storage soft limit at 90% with warning email. API rate limits: Free 10K/month, Pro 100K/month, Business 1M/month (Enterprise unlimited). Rate limiting: sliding window algorithm, 100 req/min per user, 1000 req/min per organization. Quota counters reset at start of billing period. Overage grace period: 5% above quota for 7 days before hard block. Enterprise plans have configurable quotas via admin API.',

    tenancy:
      'Complete data isolation between organizations at the database query level. Row-level security (RLS) enforced on all queries — no cross-tenant data leakage possible. Organization-scoped all database queries via tenant_id. Shared infrastructure, isolated data. Schema-per-tenant option available for Enterprise self-hosted deployments. Tenant identification via JWT sub-claim or API key org_id. All background jobs filtered by tenant context.',

    seats:
      'Seat counting: active members with logged-in sessions within last 30 days. Inactive members (no login >30 days) excluded from seat count for billing. Guests count as seats on Free plan (limited to 3). Overflow guests on Pro/Business counted at 50% rate. Owner seat is always free. Seat reduction allowed only at renewal period. Seats can be reassigned without creating new invitations. Bulk seat management via CSV import for Enterprise.',

    notifications:
      'In-app notifications for task assignments, comments, mentions, and deadline reminders. Email digests configurable per user (instant, daily digest, weekly digest). Push notifications for mobile apps. Webhook delivery for integration events with retry logic (3 retries, exponential backoff). Notification preferences per channel per event type. Read/unread state tracked per user. Notification badges on nav items. Email unsubscribe links for compliance. Notification history log.',
  },

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    palette:
      'Clean, professional palette: white backgrounds (#FFFFFF), light gray panels (#F9FAFB), slate text (#111827), subtle borders (#E5E7EB). Primary brand color (configurable — default Indigo #4F46E5). Success (#10B981), Warning (#F59E0B), Error (#EF4444), Info (#3B82F6). Dark mode support with adjusted contrast ratios. Data-dense but not cluttered.',

    typography:
      'System font stack for maximum performance and native feel (Inter, -apple-system, Segoe UI). Consistent scale: 12px captions, 14px body, 16px lead, 20px section headers, 28px page titles. Tabular figures for numerical data. Monospace for code, IDs, and API keys. Clear visual hierarchy using weight (400/500/600/700) and size, not color. Line height 1.5 for body text, 1.3 for headings.',

    imagery:
      'Minimal iconography via consistent icon set (Lucide or Heroicons). Team avatars with fallback initials. Empty state illustrations for no-data scenarios. Subtle gradient accents in hero sections. Chart and graph colors following accessible palette. Logo placement in sidebar and login pages. No decorative photography — functional graphics only. Consistent 1:1 avatar sizing, 16:16 icon grid.',

    interactions:
      'Keyboard shortcuts for power users (Cmd+K command palette). Instant search across projects, tasks, and members. Drag-and-drop task status changes. Inline editing for task titles and descriptions. Bulk action checkboxes with action bar. Collapsible sidebar with project tree navigation. Toast notifications for async operations. Modal dialogs for confirmations. Optimistic UI updates with rollback on failure. Live status indicators (green dot = online, gray = offline). Real-time comment streaming without page refresh.',
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth:
      'JWT-based authentication with access tokens (15m expiry) and refresh tokens (7d expiry, rotating). Organization isolation via tenant_id in all queries. Role-based access control (RBAC) with four default roles: Owner, Admin, Member, Guest. Custom role support for Enterprise. SAML SSO for Business and Enterprise plans. MFA enforcement option at organization level. Password policy: minimum 8 characters, complexity requirements, 90-day rotation for admins. Session invalidation on role change or org removal.',

    data:
      'Organization data: projects, tasks, comments, files, activity logs. Member data: profile, preferences, notification settings. Authentication data: email, password hash, MFA secrets, OAuth tokens. Billing data: plan, seats, invoices, payment method tokens. Integration data: OAuth tokens, webhook URLs, API keys. File content with access-controlled download URLs. All PII encrypted at rest (AES-256).',

    compliance: [
      'SOC 2 Type II — annual audit with penetration testing, access control reviews, incident response plan.',
      'GDPR compliance — data processing agreement, right to erasure/export, consent management, breach notification within 72 hours.',
      'CCPA compliance — data disclosure at request, opt-out of data sale, non-discrimination for privacy exercise.',
      'HIPAA BAA available on Enterprise plan for healthcare organizations.',
      'Data residency option for Enterprise — EU, US, APAC data centers.',
      'Annual penetration testing and bug bounty program.',
    ],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Quota enforcement: block task creation at limit, allow with upgrade',
      'Seat counting: active vs inactive members, overflow calculation',
      'Proration calculation for mid-cycle plan changes',
      'Role permission check: each role can/cannot access specific endpoints',
      'Activity log event generation and filtering by actor/resource/date',
      'Notification routing: correct channel per user preference, correct trigger mapping',
      'File upload validation: size limits, type checking, virus scanning flag',
      'Rate limiter: sliding window count, per-user and per-org limits',
      'API key authentication and scope validation',
      'Trial period detection and expiration handling',
      'Overage charge calculation per plan tier',
    ],
    integration: [
      'User signup → org creation → first project → invite team member flow',
      'Admin upgrade plan → billing portal → Stripe checkout → entitlement update → feature unlock',
      'Task assignment → notification delivery → email → in-app → real-time WebSocket',
      'File upload → virus scan → storage → thumbnail generation → access-control check → share link',
      'Realtime collaboration: multiple users editing task → conflict resolution → activity log entries',
      'SSO login → SAML assertion → user provisioning → role assignment → org access',
      'Integration webhook: external event → webhook delivery → retry on failure → dead-letter queue',
      'Billing webhook: Stripe payment succeeded → subscription updated → features unlocked → invoice emailed',
    ],
    e2e: [
      'Owner signup → create workspace → invite admin → admin adds members → members collaborate on projects → real-time task updates visible to all',
      'Admin configures SSO → member logs in via corporate IdP → automatic provisioning → assigned to correct team → correct permissions enforced',
      'Pro trial → exhaust quota → upgrade prompt → upgrade to Business → quota reset → continue working',
      'Member initiates task → assigns to teammate → teammate notified → completes task → real-time status update → auto-assign next task via automation',
      'Org admin exports activity log → receives JSON → processes for compliance → purges old data per retention policy',
    ],
  },

  // ── UI Components (for code generation) ──────────────────────────────────
  components: {
    public: ['landing', 'pricing', 'docs', 'api-reference', 'changelog'],
    customer: ['dashboard', 'projects', 'tasks', 'settings', 'billing', 'team', 'notifications', 'files'],
    admin: ['admin-dashboard', 'org-management', 'billing-management', 'support', 'analytics', 'audit-logs', 'integrations'],
  },

  // ── Realtime Features ─────────────────────────────────────────────────────
  realtime: {
    features: ['task-updates', 'notifications', 'activity-feed', 'collaborative-editing', 'typing-indicators', 'presence'],
  },
};
