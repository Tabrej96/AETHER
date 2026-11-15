/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Social Network Platform Domain Pack
 *
 * Social networking platform with user profiles, content feeds, stories, groups,
 * events, messaging, and real-time notifications. Covers content moderation,
 * recommendation engine, trust and safety, growth features, and advertising tools.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';
// ── Pack Interface ───────────────────────────────────────────────────────────


// ── DomainModel Interface ────────────────────────────────────────────────────


// ── DomainPack Constant ───────────────────────────────────────────────────────

export const SOCIAL_PACK: DomainPack = {
  domain: 'social',
  name: 'Social Network Platform',
  description:
    'Social networking platform with user profiles, content feeds, stories, groups, events, messaging, and real-time notifications. Covers content moderation with AI-assisted tools, recommendation engine, trust and safety operations, growth features, and advertising tools.',

  catalog: {
    categories: ['Profiles', 'Posts', 'Stories', 'Groups', 'Events', 'Messages'],
    features: [
      'user-profiles', 'custom-profiles', 'friend-system', 'follow-system', 'feed',
      'stories', 'posts', 'photos', 'videos', 'reels', 'live-streaming', 'groups',
      'events', 'messaging', 'notifications', 'search', 'explore', 'bookmarks',
      'collections', 'verified-badges', 'business-profiles', 'pages', 'marketplace',
      'dating', 'communities',
    ],
  },

  fulfillment: {
    modes: ['feed', 'story', 'live', 'group'],
    features: [
      'real-time-feed', 'content-discovery', 'notifications', 'moderation',
      'algorithmic-feed', 'chronological-feed', 'stories-auto-play', 'live-streaming',
      'group-management', 'event-management', 'messaging-e2e', 'push-notifications',
      'email-notifications', 'content-publishing', 'media-upload', 'tagging',
      'mentions', 'hashtags', 'trending',
    ],
  },

  customer: {
    features: [
      'profile', 'feed', 'messaging', 'groups', 'events', 'stories',
      'photos', 'videos', 'live-streaming', 'notifications', 'search', 'explore',
      'bookmarks', 'settings', 'privacy', 'verified-badge', 'creator-tools', 'shopping',
    ],
  },

  operations: {
    features: [
      'content-moderation', 'recommendation-engine', 'trust-safety', 'growth', 'ads',
      'moderation-queue', 'appeals-system', 'reporting-tools', 'impersonation-detection',
      'spam-detection', 'bot-detection', 'abuse-detection', 'creator-support',
      'policy-enforcement', 'community-guidelines', 'age-verification',
      'identity-verification', 'crisis-response',
    ],
  },

  experience: {
    features: [
      'personalized-feed', 'real-time-notifications', 'social-graph', 'content-creation',
      'stories-creation', 'live-interaction', 'group-features', 'event-rsvp',
      'reactions', 'comments', 'sharing', 'collaborative-playlists',
      'creator-monetization', 'badges', 'leaderboards', 'memories',
      'year-in-review', 'close-friends',
    ],
  },

  components: {
    public: ['landing', 'features', 'about', 'help', 'status'],
    customer: ['home', 'profile', 'messages', 'settings', 'explore', 'notifications'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'safety', 'settings', 'moderation'],
    staff: ['moderation', 'support', 'operations', 'trust-safety', 'creator-support'],
  },

  businessRules: {
    contentPolicy: [
      'Community guidelines enforced with AI-assisted moderation and human review.',
      'Prohibited content: harassment, hate speech, violence, illegal activity, non-consensual content, spam, misinformation.',
      'Enforcement tiers: warning, content removal, temporary suspension (7/30/90 days), permanent ban.',
      'Appeal process: 30-day appeal window with human review.',
      'Repeat violator policy: escalating penalties for repeated offences (3 strikes).',
      'Regional variations: content policy adapted per local laws and cultural norms.',
      'Automated enforcement: AI classifiers flag content for review (not auto-remove without human review for borderline cases).',
    ],
    privacySettings: [
      'Granular privacy controls per content type and audience.',
      'Profile visibility: public, friends-only, private (approved followers only).',
      'Post visibility: public, friends, custom list, only-me.',
      'Story visibility: all friends, close friends only, specific list.',
      'Default for new users: public profile, friends-only posts (configurable by region).',
      'Search visibility: opt-out of search engine indexing.',
      'Contact import: phone/email contacts imported only with explicit user consent.',
      'Data download: full data export available in JSON format per GDPR.',
    ],
    followRules: [
      'Follow model: users may follow any public account without approval.',
      'Follower limits: maximum 7,500 follow actions per day (anti-spam).',
      'Verified accounts: blue badge requires identity verification and notability.',
      'Block: blocked user cannot see your content, tag you, or message you.',
      'Mute: muted user content hidden from feed without notification.',
      'Close friends: exclusive story circle with separate audience.',
      'Block bypass prevention: accounts creating new accounts to circumvent block detected via device fingerprinting.',
    ],
    reporting: [
      'Multi-category reporting system with priority-based triage.',
      'Report categories: spam, harassment, hate speech, violence, self-harm, false information, nudity, impersonation, underage user.',
      'Priority levels: critical (1-hour response), high (4-hour), medium (24-hour), low (72-hour).',
      'Anonymous reporting: reporter identity protected from reported user.',
      'False report tracking: repeated false reports may limit reporting ability.',
      'Law enforcement: emergency escalation for imminent harm with 24/7 on-call team.',
    ],
    ageRestriction: [
      'Account-level age verification at signup.',
      'Minimum age: 13 with parental consent (COPPA), 16 with parental consent (GDPR-K), 18 unrestricted.',
      'Under-13 accounts: restricted to age-appropriate content, no behavioural advertising, limited data collection.',
      'Age gating: adult content requires age 18 verification.',
      'Age re-verification: triggered on jurisdiction change or account flagging.',
      'Parental controls: parent accounts can supervise minor accounts with activity reports.',
    ],
    dataExport: [
      'User data export available in multiple formats (JSON, CSV).',
      'Export scope: profile data, posts, comments, messages, photos, videos, likes, follows, settings, search history.',
      'Export processing: available within 72 hours for standard accounts; 30 days for large accounts.',
      'Deletion cascade: account deletion removes all content, severs all connections, purges data within 30 days.',
      'Machine learning: user data never used for model training without explicit opt-in.',
      'Backup retention: deleted data purged from backups within 90 days.',
    ],
  },

  design: {
    layout: [
      'Feed-first layout with content as primary focus',
      'Card-based post presentation with consistent spacing',
      'Bottom navigation bar for mobile thumb accessibility',
      'Responsive sidebar navigation for desktop',
      'Story rail at top of feed for quick access',
      'Compose modal with rich media support',
    ],
    color: [
      'Brand primary color: configurable per instance (default: electric blue #1DA1F2)',
      'Neutral backgrounds: white (#FFFFFF) for light mode, dark gray (#15202B) for dark mode',
      'Text hierarchy: near-black (#0F1419) for primary, medium gray (#536471) for secondary',
      'Action colors: green (#17BF63) for success, red (#E0245E) for errors/danger',
      'Subtle borders (#EBEEF0) for card separation',
      'Reduced saturation UI chrome to keep focus on user-generated content',
    ],
    typography: [
      'Feed readable: 15px sans-serif for post content with 1.5 line height',
      'Caption clear: 15px for post captions, auto-expands on tap/click',
      'Username bold: 15px bold for display names, 13px medium gray for @handles',
      'Navigation labels: 12px medium for bottom nav with icons',
      'Headings: 20px bold for section headers, 17px for card titles',
      'Monospace for usernames, URLs, and technical information',
    ],
    interaction: [
      'Infinite scroll feed with progressive loading and skeleton placeholders',
      'Quick react: double-tap to like, long-press for reaction picker',
      'Pull-to-refresh on mobile feed',
      'Swipe between stories with tap-to-advance and hold-to-pause',
      'Infinite scroll for comments with lazy loading',
      'Drag-to-reorder media in compose',
      'Keyboard shortcuts: N (new post), J/K (navigate feed), R (reply), L (like)',
    ],
    accessibility: [
      'Alt text for all images with auto-suggestion and user-editable descriptions',
      'Screen reader support: ARIA labels for all interactive elements',
      'Keyboard navigation: full feed navigation without mouse',
      'High contrast mode for UI elements',
      'Reduced motion option: disables auto-play videos and animations',
      'Focus indicators clearly visible on all interactive elements',
      'Text scaling up to 200% without layout breakage',
    ],
  },

  security: {
    auth:
      'Email/phone + SSO with privacy controls. Email/phone signup with verification code. OAuth 2.0 SSO: Google, Apple, Microsoft, LINE. MFA optional with TOTP and SMS backup codes. Session management with access token (2h) and refresh token (30d) with device tracking. Login notifications sent for new device logins. Account recovery via email with 24-hour hold on sensitive changes.',

    data:
      'Encrypted DMs, selective sharing. Direct messages end-to-end encrypted (Signal Protocol) with optional secret chat (disappearing messages). All data encrypted at rest (AES-256) and in transit (TLS 1.3). Selective sharing: granular controls per content type. Data minimisation: only essential data collected per feature. Search data anonymised after 30 days. Location data optional with explicit consent.',

    compliance: [
      'GDPR: Right to access/export all personal data. Right to erasure with 30-day purge. Cookie consent for EU users. DPA with sub-processors (cloud, analytics, ads).',
      'COPPA: Minimum age 13. Under-13 accounts require verifiable parental consent. Child accounts restricted. No behavioural advertising for child accounts.',
      'DSA: Terms of service transparency. Content moderation policy published. Illicit content removal within 24 hours. Risk assessment for systemic risks. Advertising transparency.',
    ],
  },

  testing: {
    unit: [
      'Privacy settings enforcement: each setting correctly gates content visibility',
      'Content classifier: correct classification across all policy categories with confidence scores',
      'Follow/unfollow: relationship state machine with correct notifications',
      'Rate limiter: follow, post, and message rate limits per user tier',
      'Notification deduplication: duplicate notifications merged correctly',
      'Story expiry: stories correctly removed after 24 hours',
      'Block enforcement: blocked user cannot view, tag, or message',
      'Age gate: correct content filtering based on account age and verified status',
      'Search indexer: content indexed respecting user privacy settings',
    ],
    integration: [
      'Post creation -> content moderation -> feed distribution -> notification to followers',
      'User signup -> email verification -> profile creation -> first post -> friend suggestions',
      'Message send -> E2E encryption -> delivery -> read receipt -> push notification',
      'Content report -> triage -> moderation review -> action enforcement -> reporter notification',
      'Story upload -> 24-hour visibility -> auto-expiry -> notification to close friends',
      'Event creation -> invitation -> RSVP -> reminder -> event day -> photo sharing',
      'Group creation -> member invitation -> post moderation -> member management -> group dissolution',
      'Data export request -> data collection -> format generation -> download link -> notification',
    ],
    e2e: [
      'New user signup -> profile setup -> first post -> receive engagement -> explore feed -> follow accounts -> messaging -> event creation',
      'Content creation: post with photo/video -> tag friends -> share to story -> receive likes/comments -> share to external platform -> analytics view',
      'Trust and safety: user reports content -> moderation review -> content removed -> reporter notified -> repeat offender penalised -> appeal process',
    ],
  },
};

// ── DomainModel Constant ───────────────────────────────────────────────────────

export const SOCIAL_DOMAIN: DomainModel = {
  id: 'social',
  domain: 'social',
  name: 'Social Network Platform',
  label: 'Social Network',
  category: 'social',
  description: SOCIAL_PACK.description,

  userRoles: [
    {
      id: 'user', name: 'User',
      typicalFeatures: ['profile', 'feed', 'messaging', 'groups', 'events', 'stories'],
      permissions: ['profile.read', 'profile.edit', 'posts.create', 'posts.delete', 'messages.send', 'groups.join', 'events.create'],
    },
    {
      id: 'creator', name: 'Creator',
      typicalFeatures: ['profile', 'feed', 'creator-tools', 'analytics', 'monetization'],
      permissions: ['posts.create', 'stories.create', 'live-stream', 'analytics.view', 'monetization.manage'],
    },
    {
      id: 'admin', name: 'Platform Admin',
      typicalFeatures: ['dashboard', 'user-mgmt', 'reports', 'safety', 'settings'],
      permissions: ['users.manage', 'content.moderate', 'reports.view', 'safety.configure', 'settings.edit', 'ads.manage'],
    },
    {
      id: 'moderator', name: 'Trust and Safety Moderator',
      typicalFeatures: ['moderation', 'support', 'operations', 'trust-safety'],
      permissions: ['content.review', 'users.suspend', 'reports.resolve', 'policy.enforce', 'appeals.review'],
    },
  ],
  role: 'user',

  standardFeatures: [
    { category: 'essential', name: 'User Profiles', description: 'Customisable profiles with bio, photos, and activity history', priority: 'essential' },
    { category: 'essential', name: 'Content Feed', description: 'Personalised content feed with algorithmic and chronological options', priority: 'essential' },
    { category: 'essential', name: 'Direct Messaging', description: 'Real-time 1:1 and group messaging with E2E encryption', priority: 'essential' },
    { category: 'essential', name: 'Follow System', description: 'Follow/unfollow with privacy controls and notification settings', priority: 'essential' },
    { category: 'essential', name: 'Content Creation', description: 'Post creation with photos, videos, and rich media', priority: 'essential' },
    { category: 'expected', name: 'Stories', description: '24-hour ephemeral content with creative tools', priority: 'expected' },
    { category: 'expected', name: 'Groups', description: 'User-created communities with moderation tools', priority: 'expected' },
    { category: 'expected', name: 'Events', description: 'Event creation, RSVP, and calendar integration', priority: 'expected' },
    { category: 'expected', name: 'Notifications', description: 'Real-time notifications with granular controls', priority: 'expected' },
    { category: 'expected', name: 'Content Moderation', description: 'AI-assisted moderation with human review and appeals', priority: 'expected' },
    { category: 'differentiating', name: 'Social Graph Recommendations', description: 'AI-driven people and content discovery', priority: 'differentiating' },
    { category: 'differentiating', name: 'Creator Monetization', description: 'Subscriptions, tips, and brand partnership tools', priority: 'differentiating' },
    { category: 'differentiating', name: 'Close Friends', description: 'Private story circle for intimate sharing', priority: 'differentiating' },
    { category: 'differentiating', name: 'Live Streaming', description: 'Real-time live video with chat and reactions', priority: 'differentiating' },
    { category: 'differentiating', name: 'Advertising Platform', description: 'Self-service ad creation with targeting and analytics', priority: 'differentiating' },
  ],

  businessModels: [
    {
      modelType: 'Advertising',
      revenueStreams: ['display-ads', 'video-ads', 'sponsored-content', 'brand-partnerships'],
      costStructure: ['infrastructure', 'moderation', 'ai-ml', 'content-delivery', 'customer-support'],
      pricingStrategy: ['cpm', 'cpc', 'cpa', 'brand-deals'],
    },
    {
      modelType: 'Subscription',
      revenueStreams: ['premium-subscriptions', 'verified-badges', 'creator-subscriptions'],
      costStructure: ['platform-development', 'content-delivery', 'customer-support', 'creator-support'],
      pricingStrategy: ['freemium', 'tiered-subscription', 'creator-monetization'],
    },
    {
      modelType: 'Commerce',
      revenueStreams: ['marketplace-commissions', 'shopping-integration', 'creator-shop'],
      costStructure: ['payment-processing', 'fulfillment-integration', 'dispute-resolution'],
      pricingStrategy: ['commission', 'listing-fee', 'subscription-for-sellers'],
    },
  ],

  technicalPatterns: [
    { category: 'real-time', name: 'WebSocket Notification Delivery', description: 'Real-time push notifications via WebSocket with fallback to FCM/APNS', rationale: 'Sub-second notification delivery critical for engagement' },
    { category: 'data', name: 'Social Graph Store', description: 'Graph database for follow relationships and content recommendations', rationale: 'Efficient traversal of social connections for feed ranking' },
    { category: 'ai', name: 'Content Moderation Pipeline', description: 'Multi-classifier AI moderation with human review queue', rationale: 'Scale moderation to millions of posts while maintaining quality' },
    { category: 'ai', name: 'Feed Ranking Algorithm', description: 'Multi-objective ranking: engagement, diversity, recency, and safety', rationale: 'Personalised feed that balances relevance and user well-being' },
    { category: 'messaging', name: 'E2E Encrypted Messaging', description: 'Signal Protocol implementation for secret conversations', rationale: 'User privacy for sensitive communications' },
    { category: 'storage', name: 'Media CDN', description: 'Geo-distributed media storage with adaptive quality', rationale: 'Fast media loading globally with bandwidth optimisation' },
  ],

  operationalLifecycle: [
    { id: 'onboarding', name: 'User Onboarding', description: 'Signup, verification, profile setup, and initial connections' },
    { id: 'engagement', name: 'Active Engagement', description: 'Feed consumption, content creation, social interaction' },
    { id: 'growth', name: 'Growth and Discovery', description: 'Follow suggestions, content recommendations, viral amplification' },
    { id: 'monetization', name: 'Monetisation', description: 'Ad targeting, creator monetisation, commerce transactions' },
    { id: 'moderation', name: 'Trust and Safety', description: 'Content moderation, user protection, crisis response' },
  ],

  designPrinciples: [
    { name: 'Content-First', description: 'User-generated content takes maximum screen space; UI chrome minimised' },
    { name: 'Infinite Flow', description: 'Feed designed for endless scrolling with smooth loading transitions' },
    { name: 'Mobile Native', description: 'Designed for mobile-first with desktop as enhanced experience' },
    { name: 'Instant Feedback', description: 'Like, react, and share actions provide immediate visual feedback' },
    { name: 'Privacy Conscious', description: 'Privacy settings prominently placed; default to most restrictive where safe' },
  ],

  securityConsiderations: [
    { category: 'auth', name: 'Account Verification', description: 'Email/phone verification with optional government ID for sensitive features', severity: 'high' },
    { category: 'data', name: 'E2E Message Encryption', description: 'Signal Protocol for secret conversations with forward secrecy', severity: 'critical' },
    { category: 'data', name: 'DM Data Protection', description: 'Direct messages encrypted at rest with selective sharing controls', severity: 'high' },
    { category: 'compliance', name: 'Content Moderation Compliance', description: '24-hour illicit content removal per DSA requirements', severity: 'high' },
    { category: 'auth', name: 'Impersonation Detection', description: 'Automated detection of impersonator accounts with review queue', severity: 'medium' },
    { category: 'data', name: 'Search Data Privacy', description: 'Search queries anonymised after 30 days per user preference', severity: 'medium' },
  ],

  regulations: [
    {
      name: 'GDPR',
      requirements: [
        'Right to access and export all personal data',
        'Right to erasure with complete content removal',
        'Cookie consent for EU users',
        'DPA with sub-processors (cloud, analytics, ads)',
      ],
    },
    {
      name: 'COPPA',
      requirements: [
        'Minimum age 13 with parental consent for under-13',
        'Child accounts restricted to age-appropriate content',
        'No behavioural advertising for child accounts',
        'Limited data collection from minors',
      ],
    },
    {
      name: 'DSA (Digital Services Act)',
      requirements: [
        'Terms of service transparency and accessibility',
        'Content moderation policy published and updated',
        'Illicit content removal within 24 hours of notice',
        'Risk assessment for systemic risks',
        'Advertising transparency (sponsor identity and targeting criteria)',
        'Data access for vetted researchers',
      ],
    },
  ],

  testingRequirements: [
    { category: 'unit', name: 'Privacy Settings Matrix', description: 'Every privacy setting correctly gates content visibility', priority: 'high' },
    { category: 'unit', name: 'Content Classifier Accuracy', description: 'Policy violation detection across all categories with confidence scores', priority: 'high' },
    { category: 'unit', name: 'Follow Graph Consistency', description: 'Follow/unfollow state machine correctness', priority: 'medium' },
    { category: 'unit', name: 'Notification Deduplication', description: 'Duplicate notifications correctly merged', priority: 'medium' },
    { category: 'integration', name: 'Post to Moderation to Feed', description: 'Full post lifecycle from creation to feed distribution', priority: 'high' },
    { category: 'integration', name: 'E2E Messaging Flow', description: 'Message send -> encryption -> delivery -> read receipt', priority: 'high' },
    { category: 'integration', name: 'Content Report to Action', description: 'Report -> triage -> review -> enforcement -> notification', priority: 'high' },
    { category: 'e2e', name: 'New User Journey', description: 'Signup -> profile -> first post -> engagement -> follow -> message -> event creation', priority: 'high' },
    { category: 'e2e', name: 'Trust and Safety Flow', description: 'Report content -> review -> action -> appeal -> final decision -> community notification', priority: 'medium' },
  ],

  workflows: [
    { id: 'content-lifecycle', name: 'Content Lifecycle', steps: ['creation', 'moderation-scan', 'distribution', 'engagement', 'archival'], entities: ['post', 'story', 'comment', 'moderation-flag'] },
    { id: 'user-onboarding', name: 'User Onboarding', steps: ['signup', 'verification', 'profile-setup', 'friend-suggestions', 'first-post'], entities: ['user', 'profile', 'verification', 'connection'] },
    { id: 'trust-safety', name: 'Trust and Safety Review', steps: ['report-receipt', 'triage', 'content-review', 'action-decision', 'enforcement', 'appeal-handling'], entities: ['report', 'content', 'reviewer', 'moderation-action'] },
    { id: 'feed-ranking', name: 'Feed Ranking Pipeline', steps: ['candidate-generation', 'feature-extraction', 'model-scoring', 'diversity-filtering', 'safety-filter', 'ranking', 'serving'], entities: ['post', 'user-context', 'ranking-model', 'feed'] },
  ],

  entities: [
    { name: 'User', description: 'Platform account with profile, preferences, and social graph', invariants: ['unique username per platform', 'age verified for content access', 'linked to verified contact method'] },
    { name: 'Post', description: 'User-generated content with media, text, and engagement metrics', invariants: ['belongs to one user', 'respects poster privacy settings', 'moderation status tracked'] },
    { name: 'Conversation', description: 'Direct message thread between users', invariants: ['encrypted end-to-end', 'participants cannot be added without consent', 'deletion cascades to all participants'] },
    { name: 'Group', description: 'User-created community with members and posts', invariants: ['has at least one admin', 'content moderated per group rules', 'membership configurable'] },
    { name: 'Event', description: 'Scheduled social event with RSVP and attendees', invariants: ['has defined date/time', 'creator is attendee by default', 'capacity limits enforced for physical events'] },
  ],

  invariants: [
    'Blocked user cannot see, tag, or message the blocking user',
    'E2E encrypted messages cannot be read by platform (except with user consent)',
    'Content removal cascades to all shares and references',
    'Age-restricted content hidden from users below minimum age',
    'Follow limits enforced per user to prevent spam (7,500/day)',
    'Story expiry enforced at 24 hours regardless of engagement',
    'Reported content preserved for review (not deleted before action)',
    'Data export includes all user-generated content within 72 hours',
  ],

  constraints: [
    'Minimum account age 13 (16 in EU, 18 for adult features)',
    'Post character limit: 500 characters (configurable per instance)',
    'Story duration: 24 hours maximum',
    'Group member limit: 500,000 per group',
    'Message rate limit: 1 message/second per user',
    'Follow limit: 7,500 follow actions per day',
    'Report response: critical within 1 hour, high within 4 hours',
    'Illicit content removal: 24 hours per DSA',
  ],

  financialFlows: [
    { name: 'ad-revenue', direction: 'in', trigger: 'ad impression or click billing' },
    { name: 'subscription-revenue', direction: 'in', trigger: 'premium subscription payment' },
    { name: 'creator-revenue', direction: 'in', trigger: 'creator subscription or tip transaction' },
    { name: 'moderation-cost', direction: 'out', trigger: 'content moderation infrastructure and review staff' },
    { name: 'infrastructure-cost', direction: 'out', trigger: 'compute, storage, and CDN bandwidth' },
    { name: 'safety-cost', direction: 'out', trigger: 'trust and safety team and AI moderation tools' },
  ],

  successMetrics: [
    'Daily Active Users (DAU)',
    'Monthly Active Users (MAU)',
    'DAU / MAU Ratio',
    'Average Session Duration',
    'Posts per User per Day',
    'Engagement Rate (likes + comments + shares / impressions)',
    'Retention Rate (D1, D7, D30)',
    'Content Moderation Response Time',
    'Report Resolution Time',
    'User Satisfaction Score (CSAT)',
    'Creator Monetisation Rate',
    'Ad Revenue per User',
  ],

  analytics: {
    tracked: [
      'feed-engagement', 'post-performance', 'story-views', 'message-volume',
      'notification-ctr', 'search-queries', 'group-activity', 'event-rsvp',
      'creator-metrics', 'moderation-queue-depth', 'report-volume', 'user-growth',
    ],
    dashboards: [
      'User Growth Dashboard',
      'Engagement Dashboard',
      'Content Moderation Dashboard',
      'Trust and Safety Dashboard',
      'Creator Economy Dashboard',
      'Advertising Revenue Dashboard',
    ],
  },

  securityRequirements: [
    'E2E encryption for direct messages (Signal Protocol)',
    'All data encrypted at rest (AES-256) and in transit (TLS 1.3)',
    'MFA enforcement for admin and creator accounts',
    'Impersonation detection with automated flagging',
    'Rate limiting on follow, post, and message actions',
    'Content moderation with human review for borderline cases',
    'Audit logging for all admin and moderation actions',
    'Age verification with parental consent for minors',
  ],

  regulatory: [
    { regulation: 'GDPR', applies: true, notes: 'Data export/erasure, consent management, cookie consent, DPA' },
    { regulation: 'COPPA', applies: true, notes: 'Child account restrictions, parental consent, no behavioural ads' },
    { regulation: 'DSA', applies: true, notes: '24-hour illicit content removal, transparency reporting, risk assessment' },
  ],
};
