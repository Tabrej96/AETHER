/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CMS / Publishing Platform Domain Pack
 *
 * Content management system for digital publishing with article creation, media
 * library management, multi-language support, SEO optimisation, analytics, and
 * commenting. Covers editorial workflows, content approval pipelines, media
 * optimisation, and multi-channel distribution.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';
// ── Pack Interface ───────────────────────────────────────────────────────────


// ── DomainModel Interface ────────────────────────────────────────────────────


// ── DomainPack Constant ───────────────────────────────────────────────────────

export const MEDIA_PACK: DomainPack = {
  domain: 'media',
  name: 'CMS / Publishing Platform',
  description:
    'Content management system for digital publishing with article creation and editing, media library management, multi-language support, SEO optimisation, analytics, and commenting. Covers editorial workflows with content approval pipelines, media optimisation, scheduled publishing, and multi-channel distribution.',

  catalog: {
    categories: ['Articles', 'Media Library', 'Pages', 'SEO', 'Analytics', 'Comments'],
    features: [
      'article-editor', 'media-library', 'pages', 'seo-tools', 'analytics', 'comments',
      'multi-language', 'scheduled-publishing', 'content-templates', 'categories', 'tags',
      'search', 'rss-feeds', 'newsletter', 'authors', 'contributors', 'drafts',
      'revisions', 'version-history', 'bulk-actions', 'content-import', 'content-export',
      'sitemap-generation', 'open-graph', 'structured-data',
    ],
  },

  fulfillment: {
    modes: ['static', 'server-render', 'edge-render', 'api'],
    features: [
      'content-pipeline', 'media-optimization', 'multi-language', 'scheduled-publishing',
      'static-site-generation', 'server-side-rendering', 'edge-caching', 'cdn-distribution',
      'api-content-delivery', 'webhook-notifications', 'content-preview', 'staging-environment',
    ],
  },

  customer: {
    features: [
      'editor', 'media-library', 'preview', 'seo-tools', 'analytics', 'comments',
      'drafts', 'revisions', 'multi-language', 'templates', 'categories', 'tags',
      'authors', 'newsletter', 'search', 'sitemap', 'social-sharing', 'publishing-settings',
    ],
  },

  operations: {
    features: [
      'content-workflow', 'editorial-calendar', 'media-management', 'seo-optimization',
      'distribution', 'approval-pipeline', 'content-review', 'media-optimization',
      'cdn-management', 'analytics-aggregation', 'comment-moderation', 'user-management',
      'role-management', 'permissions', 'bulk-operations', 'content-migration',
      'backup-management', 'uptime-monitoring',
    ],
  },

  experience: {
    features: [
      'inline-editing', 'preview-modes', 'content-recommendations', 'newsletter-integration',
      'drag-drop-media', 'block-editor', 'real-time-collaboration', 'comment-threads',
      'reading-time-estimate', 'progress-indicator', 'related-content', 'author-profiles',
      'social-proof', 'reading-list', 'dark-mode',
    ],
  },

  components: {
    public: ['website', 'blog', 'search', 'article', 'category'],
    customer: ['dashboard', 'editor', 'media', 'settings', 'analytics', 'calendar'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'settings', 'workflow', 'moderation'],
    staff: ['editors', 'moderators', 'support', 'reviewers', 'publishers'],
  },

  businessRules: {
    publishingWorkflow: [
      'Content progresses through defined stages: Draft -> Review -> Edit -> Approval -> Scheduled -> Published -> Archived.',
      'Draft: accessible only to author and assigned editors.',
      'Review: content submitted for editorial review with reviewer assignment.',
      'Approval: final sign-off by editor-in-chief or designated approver.',
      'Scheduled: content queued for future publication with timezone-aware scheduling.',
      'Workflow transitions configurable per content type (articles require approval, blog posts may publish directly).',
      'Draft auto-save every 30 seconds with version history.',
      'Concurrent editing: last-write-wins with edit conflict notification.',
    ],
    contentApproval: [
      'Two-tier approval system for quality control.',
      'Tier 1 (Editorial Review): grammar, style, fact-checking by assigned editor.',
      'Tier 2 (Legal/Compliance Review): required for sensitive content and sponsored content.',
      'Approval SLA: 24 hours for standard content, 4 hours for breaking news/time-sensitive content.',
      'Auto-approval: trusted authors (verified, high approval rate) may bypass Tier 1 after 6 months.',
      'Multi-language: content approved per language version independently.',
      'Content holds: legal team may place content on hold pending review regardless of approval status.',
      'Re-publishing: previously published content requiring updates re-enters workflow at Edit stage.',
    ],
    seoRules: [
      'Required fields: title (50-60 chars), meta description (150-160 chars), URL slug, focus keyword, alt text for all images.',
      'URL structure: hierarchical slugs (/category/subcategory/article-title).',
      'Open Graph: title, description, image auto-populated, customisable per article.',
      'Structured data: JSON-LD schema.org markup auto-generated.',
      'XML sitemap: regenerated within 1 hour of any content change.',
      'Internal linking: minimum 3 internal links per 1000 words recommended.',
      'Page speed: images optimised (WebP, lazy loading), CSS/JS minified. Mobile-first design.',
    ],
    mediaLibrary: [
      'Upload limits: images up to 50MB, videos up to 2GB, documents up to 100MB.',
      'Allowed formats: JPEG, PNG, WebP, AVIF, GIF, SVG for images; MP4, WebM, MOV for video.',
      'Automatic optimisation: images compressed and converted to WebP/AVIF; video transcoded to multiple resolutions.',
      'Search: full-text search across filenames, metadata, and OCR-extracted text.',
      'CDN delivery: media served via CDN with automatic format negotiation.',
      'Responsive images: srcset generated with multiple sizes for responsive delivery.',
      'Copyright: usage tracking per media asset across published content.',
      'Bulk operations: bulk upload, bulk tagging, bulk replace.',
    ],
    commentModeration: [
      'Pre-moderation: all comments from first-time commenters held for review.',
      'Post-moderation: established commenters (5+ approved) published immediately with AI flagging.',
      'Moderation queue: flagged comments (spam, profanity, personal attacks) queued for human review within 2 hours.',
      'Threaded comments: nested replies with configurable depth limit (default: 3 levels).',
      'Voting: upvote/downvote with threshold-based hiding (default: -5 hides comment).',
      'Admin controls: pin comments, hide comments, ban commenters, edit comments for clarity.',
      'Toggle: post authors may disable comments per article.',
      'Notification: comment authors notified of replies; post authors notified of all comments.',
    ],
    accessControl: [
      'Roles: Super Admin, Admin, Editor, Author, Contributor, Reviewer, Moderator, Analyst.',
      'Permissions matrix: granular per feature (create, read, update, delete, publish, approve, manage-users, manage-settings).',
      'Role inheritance: higher roles inherit lower role permissions.',
      'Custom roles: Admin may create custom roles with specific permission sets.',
      'Content-level permissions: restrict editing to specific users or teams per content item.',
      'IP restrictions: Admin and Super Admin roles may be IP-whitelisted.',
      'Session management: idle timeout configurable (default: 8 hours), concurrent session limit (default: 3).',
      'Audit trail: all content changes logged with user, timestamp, and change diff.',
    ],
  },

  design: {
    layout: [
      'Content-first layout with maximum reading area and minimal chrome',
      'Editor-focused workspace with large text area and sidebar tools',
      'Responsive grid for published content pages',
      'Clean admin dashboard with card-based metrics',
      'Media grid with adjustable column density',
      'Full-width featured content with constrained body text',
    ],
    color: [
      'Clean white backgrounds (#FFFFFF) with subtle gray surfaces (#F7F7F8)',
      'Brand accent color (configurable: default blue #2563EB) for CTAs and links',
      'Near-black text (#1A1A1A) for body, medium gray (#6B7280) for secondary',
      'Success green (#10B981) for published status',
      'Warning amber (#F59E0B) for pending review',
      'Error red (#EF4444) for publishing errors and validation failures',
      'Subtle borders (#E5E7EB) for content separation',
    ],
    typography: [
      'Readable body: 16-18px serif or sans-serif (configurable per publication) with 1.7 line height for optimal reading comfort',
      'Clear headings: 28px H1, 22px H2, 18px H3 with clear visual hierarchy',
      'Monospace for code blocks and technical content',
      'Tabular figures for reading time estimates and word counts',
      'Serif option for long-form editorial content',
      'Sans-serif for UI elements and navigation',
    ],
    interaction: [
      'Inline editing: click-to-edit directly on published content preview',
      'Drag-and-drop media upload with visual drop zone',
      'Block-based editor with slash commands for content insertion',
      'Auto-save every 30 seconds with version snapshot',
      'Split preview: editor and live preview side by side',
      'Keyboard shortcuts: Cmd+S (save), Cmd+P (preview), Cmd+Shift+P (publish)',
      'Real-time collaboration cursors showing other editors',
      'One-click publish from editor with confirmation dialog',
    ],
    accessibility: [
      'Alt text required for all images with editor prompt',
      'Full keyboard navigation: all editor functions accessible via keyboard',
      'Screen reader support: ARIA labels for editor toolbar and media library',
      'High contrast mode for editor and published content',
      'Text scaling up to 200% without layout breakage',
      'Focus indicators visible on all interactive elements',
      'Skip navigation links for published content pages',
      'WCAG 2.1 AA compliance for all published templates',
      'Reading progress indicator for long-form content',
    ],
  },

  security: {
    auth:
      'Editor, author, admin role hierarchy with MFA enforcement. Authentication: email/password (bcrypt cost 12), OAuth (Google, Microsoft), SAML SSO (Enterprise). MFA: TOTP required for Admin and Editor roles; optional for Author and Contributor. Role hierarchy: Super Admin > Admin > Editor > Author > Contributor > Reviewer > Moderator > Analyst. Admin IP whitelisting for Super Admin and Admin access. Password policy: minimum 10 characters, breach check, 90-day rotation for admin.',

    data:
      'Encrypted media storage, access logs. All media assets encrypted at rest (AES-256) with access-controlled download URLs. Content data encrypted at rest. Access logs: all content access, edits, and publishes logged with user, timestamp, and change diff. Audit trail: immutable log of all content lifecycle events. PII in content protected per privacy settings. Export data in open formats (Markdown, JSON, CSV). Backup encryption with separate key management. Version history: all revisions retained with full diff for audit and rollback.',

    compliance: [
      'GDPR: Right to access/export all published content and author data. Right to erasure with content anonymisation. Cookie consent for analytics.',
      'COPPA: Age verification for content contributors under 13 (parental consent required). Child-safe content designation and filtering.',
      'CCPA: Do Not Sell option for California users. Data disclosure at request. Opt-out of data sharing for advertising.',
    ],
  },

  testing: {
    unit: [
      'SEO metadata validation: title length, meta description length, URL slug format',
      'Publishing workflow state machine: correct transitions per content type',
      'Approval SLA timer: 24-hour standard, 4-hour breaking news',
      'Media optimisation: image compression, WebP conversion, responsive srcset generation',
      'Permission matrix: role-based access enforcement per CRUD operation',
      'Sitemap generation: correct URL inclusion and exclusion rules',
      'Comment moderation: spam detection, profanity filter, thread depth enforcement',
      'Auto-save conflict resolution: last-write-wins with conflict notification',
      'Multi-language routing: correct locale detection and content serving',
      'Reading time estimation: word count / reading speed calculation',
    ],
    integration: [
      'Article creation -> auto-save -> editorial review -> approval -> scheduling -> publication -> SEO indexing',
      'Media upload -> optimisation pipeline -> CDN distribution -> responsive image serving',
      'Multi-language: article creation -> translation -> per-locale review -> parallel publication',
      'Comment lifecycle: submission -> pre-moderation -> AI scan -> human review -> publication -> reply -> edit -> delete',
      'Newsletter: subscriber list -> content selection -> template rendering -> send -> open/click tracking',
      'SEO pipeline: article publish -> sitemap update -> search engine notification -> index verification',
      'Content migration: source CMS -> format conversion -> media transfer -> validation -> publication',
      'Real-time collaboration: multi-editor -> conflict detection -> merge resolution -> version snapshot',
    ],
    e2e: [
      'Editor creates article -> adds media via drag-drop -> previews -> submits for review -> editor approves -> schedules -> publishes -> SEO verified -> social shared',
      'Multi-language: English article created -> translated to 5 languages -> per-language review -> simultaneous publication -> locale routing verified',
      'Comment moderation: reader posts comment -> AI flags -> moderator reviews -> approves -> author replies -> notification sent -> reader sees reply',
    ],
  },
};

// ── DomainModel Constant ───────────────────────────────────────────────────────

export const MEDIA_DOMAIN: DomainModel = {
  id: 'media',
  domain: 'media',
  name: 'CMS / Publishing Platform',
  label: 'Publishing Platform',
  category: 'media',
  description: MEDIA_PACK.description,

  userRoles: [
    {
      id: 'author', name: 'Author',
      typicalFeatures: ['editor', 'drafts', 'revisions', 'preview', 'media-library'],
      permissions: ['content.create', 'content.edit-own', 'media.upload', 'preview.view', 'comments.manage'],
    },
    {
      id: 'editor', name: 'Editor',
      typicalFeatures: ['editor', 'media', 'preview', 'seo-tools', 'analytics', 'workflow'],
      permissions: ['content.create', 'content.edit', 'content.approve', 'media.manage', 'seo.edit', 'comments.moderate', 'users.invite'],
    },
    {
      id: 'admin', name: 'Admin',
      typicalFeatures: ['dashboard', 'user-mgmt', 'reports', 'settings', 'workflow'],
      permissions: ['content.manage', 'users.manage', 'settings.edit', 'workflow.configure', 'reports.view', 'media.manage', 'comments.moderate'],
    },
    {
      id: 'moderator', name: 'Moderator',
      typicalFeatures: ['comments', 'moderation', 'support'],
      permissions: ['comments.moderate', 'content.flag', 'users.warn', 'reports.view'],
    },
  ],
  role: 'author',

  standardFeatures: [
    { category: 'essential', name: 'Article Editor', description: 'Rich text and block-based content editor with media embedding', priority: 'essential' },
    { category: 'essential', name: 'Media Library', description: 'Centralised asset management with upload, organisation, and search', priority: 'essential' },
    { category: 'essential', name: 'Publishing Workflow', description: 'Draft -> Review -> Approval -> Published pipeline', priority: 'essential' },
    { category: 'essential', name: 'SEO Tools', description: 'Meta tags, URL slugs, sitemaps, and structured data', priority: 'essential' },
    { category: 'essential', name: 'Multi-Language Support', description: 'Content translation and locale routing', priority: 'essential' },
    { category: 'expected', name: 'Analytics', description: 'Content performance, reader engagement, and traffic analytics', priority: 'expected' },
    { category: 'expected', name: 'Commenting System', description: 'Threaded comments with moderation tools', priority: 'expected' },
    { category: 'expected', name: 'Scheduled Publishing', description: 'Queue content for future publication with timezone support', priority: 'expected' },
    { category: 'expected', name: 'Content Templates', description: 'Reusable content templates for common article formats', priority: 'expected' },
    { category: 'expected', name: 'Editorial Calendar', description: 'Visual calendar for content planning and scheduling', priority: 'expected' },
    { category: 'differentiating', name: 'Inline Editing', description: 'Click-to-edit directly on published content preview', priority: 'differentiating' },
    { category: 'differentiating', name: 'Real-Time Collaboration', description: 'Multi-editor with live cursors and conflict resolution', priority: 'differentiating' },
    { category: 'differentiating', name: 'Newsletter Integration', description: 'Built-in newsletter creation and subscriber management', priority: 'differentiating' },
    { category: 'differentiating', name: 'Content Recommendations', description: 'AI-driven related content suggestions', priority: 'differentiating' },
    { category: 'differentiating', name: 'Multi-Channel Distribution', description: 'Publish to web, mobile, social, and RSS simultaneously', priority: 'differentiating' },
  ],

  businessModels: [
    {
      modelType: 'SaaS Subscription',
      revenueStreams: ['monthly-subscriptions', 'annual-subscriptions', 'enterprise-plans'],
      costStructure: ['infrastructure', 'cdn-bandwidth', 'development', 'support', 'storage'],
      pricingStrategy: ['freemium', 'tiered-subscription', 'enterprise-contract'],
    },
    {
      modelType: 'Managed Hosting',
      revenueStreams: ['hosting-fees', 'bandwidth-overage', 'premium-support'],
      costStructure: ['servers', 'cdn', 'bandwidth', 'support-staff'],
      pricingStrategy: ['usage-based', 'flat-rate', 'premium-tier'],
    },
    {
      modelType: 'Enterprise',
      revenueStreams: ['licensing', 'implementation-services', 'custom-development', 'support-contracts'],
      costStructure: ['development', 'infrastructure', 'support', 'security-compliance'],
      pricingStrategy: ['enterprise-contract', 'per-seat', 'revenue-share'],
    },
  ],

  technicalPatterns: [
    { category: 'cms', name: 'Headless CMS Architecture', description: 'Content API with separate rendering layer for multi-channel distribution', rationale: 'Serve content to web, mobile, app, and social from single source of truth' },
    { category: 'rendering', name: 'Static + SSR Hybrid', description: 'Static generation for stable content, SSR for dynamic personalised pages', rationale: 'Optimal performance with content freshness guarantees' },
    { category: 'media', name: 'Adaptive Media Pipeline', description: 'Multi-format, multi-size image/video generation on upload', rationale: 'Optimal delivery for every device and connection speed' },
    { category: 'editor', name: 'Block-Based Editor', description: 'Component-based content editor with custom block types', rationale: 'Flexible content creation with consistent styling and structured data' },
    { category: 'workflow', name: 'State Machine Workflow', description: 'Content lifecycle managed via configurable state machine', rationale: 'Auditable, reversible content lifecycle with clear approval gates' },
    { category: 'ai', name: 'Content Intelligence', description: 'AI-powered SEO suggestions, content recommendations, and readability scoring', rationale: 'Improve content quality and discoverability automatically' },
  ],

  operationalLifecycle: [
    { id: 'creation', name: 'Content Creation', description: 'Author drafts content with editor, media, and SEO tools' },
    { id: 'review', name: 'Editorial Review', description: 'Editor reviews content, requests changes, or approves' },
    { id: 'approval', name: 'Final Approval', description: 'Editor-in-chief or designated approver gives final sign-off' },
    { id: 'scheduling', name: 'Scheduling', description: 'Content queued for publication at optimal time' },
    { id: 'publication', name: 'Publication', description: 'Content published across all distribution channels' },
    { id: 'monitoring', name: 'Post-Publication', description: 'Analytics tracking, comment moderation, and content updates' },
    { id: 'archival', name: 'Archival', description: 'Outdated content archived or updated with new revision' },
  ],

  designPrinciples: [
    { name: 'Content Maximises Space', description: 'Reading area takes maximum viewport; navigation and chrome minimised' },
    { name: 'Typography-First', description: 'Beautiful typography is the primary design element — fonts, spacing, and rhythm matter most' },
    { name: 'Speed is Feature', description: 'Page load performance is a first-class feature, not an afterthought' },
    { name: 'Editor Experience', description: 'The admin editor is as carefully designed as the public-facing site' },
    { name: 'Mobile Responsive', description: 'Every page and every editor function works on mobile' },
  ],

  securityConsiderations: [
    { category: 'auth', name: 'Role-Based Access Control', description: 'Granular permissions per role with inheritance and custom roles', severity: 'high' },
    { category: 'data', name: 'Media Encryption', description: 'Encrypted media storage with access-controlled download URLs', severity: 'high' },
    { category: 'data', name: 'Content Version History', description: 'Immutable revision history with full diff for audit', severity: 'medium' },
    { category: 'compliance', name: 'Content Approval Audit Trail', description: 'All approval/rejection decisions logged with reviewer identity', severity: 'medium' },
    { category: 'auth', name: 'Admin IP Whitelisting', description: 'Admin access restricted to approved IP ranges', severity: 'high' },
    { category: 'compliance', name: 'Comment Moderation Compliance', description: 'Timely review and action on flagged content', severity: 'medium' },
  ],

  regulations: [
    {
      name: 'GDPR',
      requirements: [
        'Right to access and export all published content and author data',
        'Right to erasure with content anonymisation or removal',
        'Cookie consent for analytics tracking',
        'DPA with CDN, analytics, and email sub-processors',
      ],
    },
    {
      name: 'COPPA',
      requirements: [
        'Age verification for content contributors under 13',
        'Parental consent required for minor author accounts',
        'No collection of personal data from child authors',
        'Child-safe content designation and filtering',
      ],
    },
    {
      name: 'CCPA',
      requirements: [
        'Do Not Sell My Personal Information option',
        'Data disclosure at user request',
        'Opt-out of data sharing for advertising',
        'Non-discrimination for privacy exercise',
      ],
    },
  ],

  testingRequirements: [
    { category: 'unit', name: 'SEO Metadata Validation', description: 'Correct meta tags, structured data, and URL formatting', priority: 'high' },
    { category: 'unit', name: 'Workflow State Transitions', description: 'Correct content lifecycle transitions per content type', priority: 'high' },
    { category: 'unit', name: 'Permission Matrix', description: 'Role-based access enforcement for all CRUD operations', priority: 'high' },
    { category: 'unit', name: 'Media Optimisation Pipeline', description: 'Image compression, format conversion, and responsive srcset', priority: 'medium' },
    { category: 'integration', name: 'Full Content Pipeline', description: 'Creation -> review -> approval -> scheduling -> publication -> SEO -> distribution', priority: 'high' },
    { category: 'integration', name: 'Multi-Language Publishing', description: 'Content creation -> translation -> per-locale review -> parallel publication', priority: 'medium' },
    { category: 'integration', name: 'Comment Moderation', description: 'Submission -> AI flag -> human review -> action -> notification', priority: 'medium' },
    { category: 'e2e', name: 'Author Publishing Journey', description: 'Create article -> add media -> preview -> submit for review -> address feedback -> publish -> verify SEO -> share on social', priority: 'high' },
    { category: 'e2e', name: 'Editorial Workflow', description: 'Editor assigns review -> author submits -> editor approves -> schedules -> auto-publishes -> analytics reviewed', priority: 'medium' },
  ],

  workflows: [
    { id: 'content-pipeline', name: 'Content Publishing Pipeline', steps: ['draft', 'submit-review', 'editorial-review', 'revision', 'approval', 'schedule', 'publish', 'distribute'], entities: ['article', 'media-asset', 'revision', 'approval'] },
    { id: 'media-processing', name: 'Media Processing Pipeline', steps: ['upload', 'validation', 'optimization', 'format-conversion', 'cdn-distribution', 'responsive-srcset'], entities: ['media-asset', 'processing-job', 'cdn-endpoint'] },
    { id: 'comment-moderation', name: 'Comment Moderation Workflow', steps: ['submission', 'pre-moderation', 'ai-scan', 'human-review', 'approval', 'publication', 'reply-notification'], entities: ['comment', 'moderation-flag', 'reviewer', 'thread'] },
    { id: 'seo-optimization', name: 'SEO Optimisation Pipeline', steps: ['content-analysis', 'keyword-suggestion', 'meta-generation', 'structured-data', 'sitemap-update', 'index-notification'], entities: ['article', 'seo-meta', 'sitemap', 'structured-data'] },
  ],

  entities: [
    { name: 'Article', description: 'Primary content entity with title, body, metadata, and revision history', invariants: ['has at least one revision', 'requires title and body before submission', 'SEO metadata populated before publication'] },
    { name: 'MediaAsset', description: 'Uploaded image, video, audio, or document file', invariants: ['file size within upload limits', 'format in allowed types', 'optimised variants generated on upload'] },
    { name: 'User', description: 'Platform user with role-based permissions', invariants: ['role determines content permissions', 'at least one user has Super Admin role', 'MFA enforced for admin roles'] },
    { name: 'Comment', description: 'Reader comment on published content', invariants: ['linked to one article', 'threaded with configurable depth', 'moderation status tracked'] },
    { name: 'Workflow', description: 'Configurable content approval workflow per content type', invariants: ['has Draft and Published states', 'approval required before publication by default', 'SLA timers configurable per state'] },
  ],

  invariants: [
    'Article cannot be published without title, body, and SEO metadata',
    'Media assets optimised before serving to end users',
    'Comment thread depth enforced per content type settings',
    'Content revision history immutable once created',
    'Approval workflow cannot be bypassed for configured content types',
    'Deleted content soft-deleted with 30-day recovery window',
    'SEO sitemap regenerated within 1 hour of content changes',
    'Admin actions logged with user identity and timestamp',
  ],

  constraints: [
    'Article title: 50-200 characters',
    'Article meta description: 150-160 characters',
    'Image upload: maximum 50MB per file',
    'Video upload: maximum 2GB per file',
    'Comment nesting depth: maximum 3 levels (configurable)',
    'Scheduled content: minimum 5-minute lead time',
    'Approval SLA: 24 hours standard, 4 hours breaking news',
    'Content export: available within 72 hours for standard accounts',
  ],

  financialFlows: [
    { name: 'subscription-revenue', direction: 'in', trigger: 'monthly or annual subscription payment' },
    { name: 'hosting-fee', direction: 'in', trigger: 'monthly hosting and bandwidth billing' },
    { name: 'cdn-cost', direction: 'out', trigger: 'content delivery bandwidth and storage' },
    { name: 'storage-cost', direction: 'out', trigger: 'media asset storage and backup' },
    { name: 'support-cost', direction: 'out', trigger: 'customer support and success team' },
  ],

  successMetrics: [
    'Monthly Active Editors',
    'Articles Published per Month',
    'Average Time to Publish (draft to live)',
    'SEO Organic Traffic Growth',
    'Page Load Performance (LCP < 2s)',
    'Reader Engagement Rate (avg. time on page)',
    'Comment Moderation Response Time (<2 hours)',
    'Content Approval SLA Compliance',
    'Media Library Utilisation Rate',
    'Multi-Language Content Coverage',
    'Customer Satisfaction Score (CSAT)',
    'Platform Uptime (99.9%)',
  ],

  analytics: {
    tracked: [
      'content-publication-rate', 'editor-activity', 'workflow-transition-time',
      'page-views', 'reader-engagement', 'seo-performance', 'media-usage',
      'comment-activity', 'search-queries', 'newsletter-open-rates',
      'multi-language-distribution', 'content-shelf-life',
    ],
    dashboards: [
      'Editorial Dashboard',
      'Content Performance Dashboard',
      'SEO Analytics Dashboard',
      'Media Library Dashboard',
      'Comment Moderation Dashboard',
      'Reader Engagement Dashboard',
    ],
  },

  securityRequirements: [
    'Role-based access with inheritance and custom role support',
    'Media storage encryption at rest with signed download URLs',
    'Immutable revision history with full change diff',
    'Admin access IP whitelisting for privileged roles',
    'MFA enforcement for Editor and Admin roles',
    'Content approval audit trail with reviewer identity',
    'Comment moderation with escalation to human review',
    'Regular backup with encryption and tested restore procedures',
  ],

  regulatory: [
    { regulation: 'GDPR', applies: true, notes: 'Author data rights, consent management, cookie consent for analytics' },
    { regulation: 'COPPA', applies: true, notes: 'Child author age verification, parental consent, limited data collection' },
    { regulation: 'CCPA', applies: true, notes: 'Do Not Sell option, data disclosure, opt-out of advertising data sharing' },
  ],
};
