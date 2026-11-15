/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Video Game Platform / Launcher Domain Pack
 *
 * Digital game distribution platform with game library management, storefront,
 * social features, achievements, friends system, matchmaking, modding support,
 * and community tools. Covers game publishing, live operations, anti-cheat,
 * and player engagement.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';
// ── Pack Interface ───────────────────────────────────────────────────────────


// ── DomainModel Interface ────────────────────────────────────────────────────


// ── DomainPack Constant ───────────────────────────────────────────────────────

export const GAMING_PACK: DomainPack = {
  domain: 'gaming',
  name: 'Video Game Platform / Launcher',
  description:
    'Digital game distribution platform with game library management, storefront discovery, social features, achievements, friends system, matchmaking, modding support, and community tools. Supports game publishing with live operations, anti-cheat infrastructure, cross-play, and seasonal events.',

  catalog: {
    categories: ['Games', 'DLC', 'Achievements', 'Friends', 'Matchmaking', 'Modding'],
    features: [
      'game-library', 'store', 'discovery', 'wishlist', 'reviews', 'ratings',
      'achievements', 'trophies', 'leaderboards', 'friends', 'groups', 'chat',
      'matchmaking', 'voice-chat', 'cloud-saves', 'mod-support', 'workshop', 'news',
      'events', 'season-pass', 'gifting', 'trading', 'marketplace', 'streaming', 'remote-play',
    ],
  },

  fulfillment: {
    modes: ['download', 'streaming', 'physical'],
    features: [
      'auto-updates', 'cloud-saves', 'cross-play', 'mod-support',
      'download-management', 'patch-management', 'cross-save', 'family-sharing',
      'refund-system', 'preload', 'beta-access', 'early-access',
    ],
  },

  customer: {
    features: [
      'game-library', 'social', 'achievements', 'friends', 'wishlist', 'reviews',
      'profile', 'settings', 'cloud-saves', 'mods', 'chat', 'groups', 'notifications',
      'gifting', 'trading', 'marketplace', 'remote-play', 'broadcasting',
    ],
  },

  operations: {
    features: [
      'game-publishing', 'live-ops', 'anti-cheat', 'matchmaking', 'community-management',
      'moderation', 'customer-support', 'analytics', 'store-curation', 'featured-placements',
      'sales-management', 'regional-pricing', 'age-verification', 'content-review',
      'streamer-partnerships', 'eSports-integration',
    ],
  },

  experience: {
    features: [
      'social-gaming', 'cross-save', 'customization', 'seasonal-events', 'daily-rewards',
      'battle-pass', 'community-hub', 'workshop-browser', 'streamer-integration',
      'party-system', 'activity-feed', 'recommendation-engine', 'gifting-experience',
      'collection-showcase', 'achievement-hunting',
    ],
  },

  components: {
    public: ['store', 'discover', 'news', 'support', 'community'],
    customer: ['library', 'social', 'profile', 'achievements', 'friends', 'settings'],
    admin: ['dashboard', 'game-mgmt', 'reports', 'settings', 'users', 'billing'],
    staff: ['support', 'operations', 'moderation', 'anti-cheat', 'community-management'],
  },

  businessRules: {
    matchmaking: [
      'Skill-based matchmaking (SBMM) using ELO/MMR system with 10 placement matches for new players.',
      'Party size penalty: larger parties matched against similarly-sized parties or higher-skilled opponents.',
      'Cross-region matchmaking allowed with ping tolerance up to 150ms.',
      'Queue timeout: 5-minute soft timeout (expands skill range), 10-minute hard timeout.',
      'Ranked seasons: 3-month seasons with rank reset between seasons.',
      'Rank tiers: Bronze, Silver, Gold, Platinum, Diamond, Master, Grandmaster.',
      'Smurf detection: accounts showing rapid MMR gain flagged for review.',
    ],
    achievements: [
      'Achievements unlockable during gameplay with server-side validation for competitive achievements.',
      'Achievement rarity: common (80%+), uncommon (50-79%), rare (20-49%), epic (5-19%), legendary (<5%).',
      'Points system: each achievement awards platform points toward level progression.',
      'Multi-step achievements track progress (e.g., "Win 100 matches").',
      'Timed achievements: limited-time achievements for seasonal events.',
      'Achievement sync: cloud-synced across devices with conflict resolution (latest wins).',
    ],
    refunds: [
      'Refund window: 14 days from purchase for games played less than 2 hours total.',
      'DLC refund: 14 days from purchase if never used/consumed in-game.',
      'In-game purchases: non-refundable unless item is defective or not as described.',
      'Refund limits: maximum 5 refunds per account per rolling 30-day period.',
      'Refund processing: 3-5 business days to original payment method.',
      'Pre-ordered games: refundable at any time before release; post-release subject to standard 2-hour rule.',
      'Gift purchases: refunds go to purchaser; gift revoked upon refund.',
    ],
    ageRating: [
      'Age ratings enforced at storefront and runtime per region (ESRB, PEGI, USK, ACB, CERO).',
      'M-rated games require age verification at purchase. AO/X18+ games not available on platform.',
      'Age verification: credit card check, government ID upload, or parent account linkage.',
      'Regional rating overrides: most restrictive rating applies globally for account billing region.',
      'Parental controls: account-level restrictions for family accounts with PIN-gated overrides.',
    ],
    regionLock: [
      'Game availability varies by region due to licensing agreements.',
      'Region determined by account creation country and payment method billing address.',
      'Region-locked games hidden from browse and search in restricted regions.',
      'Travel mode: temporary region change allowed once per 90 days with limited store access.',
      'VPN detection: accounts accessing from VPN in different region flagged for review.',
      'Regional pricing: prices adjusted per purchasing power parity per territory.',
    ],
    modPolicy: [
      'Mod support: game developers opt-in to workshop/mod support per title.',
      'Allowed mods: cosmetic, gameplay tweaks, quality-of-life improvements, total conversions.',
      'Prohibited mods: cheats, hacks, exploits, malware, copyrighted content, NSFW content.',
      'Mod rating: all workshop items community-rated; flagged items go to moderation queue.',
      'Mod monetisation: allowed for total conversions with developer agreement; tips/donations always allowed.',
      'Developer tools: SDKs and documentation provided for supported titles.',
    ],
  },

  design: {
    layout: [
      'Immersive dark theme optimized for extended gaming sessions',
      'Card-grid layout for game library and storefront browse',
      'Overlay HUD elements for in-game launcher features',
      'Responsive sidebar navigation with quick-access game tiles',
      'Community-focused layout with activity feeds and friend presence',
      'Streamer-friendly overlay mode for broadcasting',
    ],
    color: [
      'Gaming dark palette: deep charcoal backgrounds (#0F0F12, #16171D)',
      'Neon accent colors: electric cyan (#00E5FF), neon purple (#7B2FFF), vibrant green (#00FF88)',
      'Accent gradients for call-to-action buttons and premium features',
      'High contrast white text for readability on dark backgrounds',
      'Subtle transparency and blur effects for overlay UI elements',
      'Team/faction colors as customisable CSS variables for community features',
    ],
    typography: [
      'Game title bold: heavy-weight display font for game names in library and store',
      'Body readable: 14px sans-serif for descriptions, reviews, and community content',
      'Monospace for stats, achievements, and technical information',
      'Condensed headers for data-dense inventory and leaderboard views',
      'Customisable font scaling for accessibility',
      'Tabular figures for numerical stats (KDA, hours played, prices)',
    ],
    interaction: [
      'Hover preview: game screenshots and trailers play on hover in store',
      'Quick install: one-click install from browse with progress indicator',
      'Auto-update: background download and install with restart notification',
      'Party overlay: in-game party management with voice chat integration',
      'Overlay HUD: shift-tab in-game for friends list, chat, and browser',
      'Controller support: full navigation via gamepad for store and library',
      'Quick switch: alt-tab equivalent for in-game overlay',
    ],
    accessibility: [
      'Subtitle options: customisable size, color, background, font, and text shadow',
      'Colorblind mode: alternative color palettes for colorblind users (protanopia, deuteranopia, tritanopia)',
      'Full keyboard navigation: all UI elements reachable via keyboard shortcuts',
      'Screen reader support: ARIA labels for all interactive elements',
      'High contrast mode: increased contrast for UI elements overlaying games',
      'Text-to-speech for chat messages and notifications',
      'Adjustable UI scale for in-game overlay elements',
      'Remappable controls for all launcher and overlay functions',
    ],
  },

  security: {
    auth:
      'Platform account with 2FA and parental controls. Email/password authentication with bcrypt (cost 12). Optional TOTP-based 2FA. Parental controls: family-linked accounts with age-based restrictions, spending limits, and playtime limits. OAuth integration for cross-platform identity. Session management with device authorization and concurrent session limits. Account recovery via email with 24-hour hold on sensitive changes.',

    data:
      'Encrypted saves, anti-cheat kernel mode. Game save data encrypted at rest with per-user keys. Cloud save synchronization with conflict resolution (last-write-wins with user notification). Anti-cheat operates in kernel mode with minimal data collection — only game-related memory regions scanned. Player PII (email, name, country) encrypted at rest (AES-256). Payment data handled by payment processor tokens (no raw card data stored).',

    compliance: [
      'COPPA: Children under 13 require parental account linkage with consent. Child accounts restricted to E-rated content. No behavioural advertising. Playtime limits configurable by parents.',
      'GDPR: Right to access/export all personal data. Right to erasure with cascade deletion. Consent management for EU users. DPA with anti-cheat, payment, and analytics sub-processors.',
      'ESRB: Age rating enforcement at storefront and runtime. Mature content purchase requires age verification. Regional rating boards applied per territory.',
      'Privacy Shield / SCCs: Adequate safeguards for cross-border data transfers per GDPR requirements.',
    ],
  },

  testing: {
    unit: [
      'Matchmaking queue: skill tier assignment, party size penalty calculation, timeout handling',
      'Achievement unlocking: server-side validation, rarity classification, progress tracking',
      'Refund eligibility: purchase date check, play time validation, refund limit enforcement',
      'Age rating enforcement: content filtering by region and account age',
      'Cloud save conflict resolution: last-write-wins with conflict detection',
      'Anti-cheat detection: cheat pattern matching, false positive minimisation',
      'Moderation queue: content flagging, severity classification, auto-action thresholds',
      'Regional pricing: correct currency conversion and regional price application',
    ],
    integration: [
      'Purchase -> download -> install -> first launch -> cloud save sync -> achievement unlock flow',
      'Friend invite -> accept -> party formation -> game launch -> cross-play session',
      'Mod subscribe -> dependency check -> download -> install -> launch with mods -> update detection',
      'Anti-cheat detection -> report generation -> review queue -> action enforcement -> appeal process',
      'Season pass purchase -> tier progression -> reward unlock -> expiry handling',
      'Cross-save: cloud upload -> conflict resolution -> download on different platform -> state consistency',
      'Parental control: child account creation -> spending limit -> purchase attempt -> approval flow -> notification',
      'Refund request: eligibility check -> refund processing -> license revocation -> notification',
    ],
    e2e: [
      'New user signup -> browse store -> purchase game -> download -> install -> launch -> earn achievement -> share to friends -> receive gift',
      'Player joins party -> invites friends -> launches game -> cross-play session -> saves progress -> disconnects -> reconnects -> resumes from cloud save',
      'Anti-cheat scenario: player flagged -> match reviewed -> temporary suspension -> appeal submitted -> review committee -> ban or unban',
    ],
  },
};

// ── DomainModel Constant ───────────────────────────────────────────────────────

export const GAMING_DOMAIN: DomainModel = {
  id: 'gaming',
  domain: 'gaming',
  name: 'Video Game Platform / Launcher',
  label: 'Game Platform',
  category: 'gaming',
  description: GAMING_PACK.description,

  userRoles: [
    {
      id: 'player', name: 'Player',
      typicalFeatures: ['game-library', 'social', 'achievements', 'friends', 'cloud-saves', 'matchmaking'],
      permissions: ['games.purchase', 'games.download', 'games.play', 'social.interact', 'achievements.view', 'cloud-save.manage'],
    },
    {
      id: 'creator', name: 'Mod Creator',
      typicalFeatures: ['mod-support', 'workshop', 'community', 'monetization'],
      permissions: ['mods.publish', 'mods.update', 'workshop.manage', 'earnings.view'],
    },
    {
      id: 'admin', name: 'Platform Admin',
      typicalFeatures: ['game-mgmt', 'reports', 'settings', 'users', 'billing'],
      permissions: ['games.manage', 'users.manage', 'content.moderate', 'reports.view', 'settings.edit', 'billing.manage'],
    },
    {
      id: 'moderator', name: 'Community Moderator',
      typicalFeatures: ['moderation', 'support', 'community-management'],
      permissions: ['content.review', 'users.warn', 'users.ban', 'reports.resolve', 'chat.moderate'],
    },
  ],
  role: 'player',

  standardFeatures: [
    { category: 'essential', name: 'Game Library Management', description: 'Organise and launch installed games with library view and filtering', priority: 'essential' },
    { category: 'essential', name: 'Game Storefront', description: 'Browse, discover, and purchase games with recommendations', priority: 'essential' },
    { category: 'essential', name: 'Achievements System', description: 'Track and display player achievements with progression', priority: 'essential' },
    { category: 'essential', name: 'Friends and Social', description: 'Friends list, chat, presence, and activity feed', priority: 'essential' },
    { category: 'essential', name: 'Cloud Saves', description: 'Cross-device save sync with conflict resolution', priority: 'essential' },
    { category: 'essential', name: 'Auto-Updates', description: 'Automatic game and client updates with scheduling', priority: 'essential' },
    { category: 'expected', name: 'Matchmaking', description: 'Skill-based matchmaking with party and queue management', priority: 'expected' },
    { category: 'expected', name: 'Mod Support and Workshop', description: 'Community mod browsing, subscription, and installation', priority: 'expected' },
    { category: 'expected', name: 'Cross-Play', description: 'Cross-platform multiplayer with unified matchmaking', priority: 'expected' },
    { category: 'expected', name: 'Anti-Cheat', description: 'Kernel-mode anti-cheat with automated detection', priority: 'expected' },
    { category: 'expected', name: 'Refund System', description: '14-day refund window with play time limit', priority: 'expected' },
    { category: 'expected', name: 'Cross-Save', description: 'Save sync across platforms and devices', priority: 'expected' },
    { category: 'differentiating', name: 'Remote Play', description: 'Stream games from host PC to other devices', priority: 'differentiating' },
    { category: 'differentiating', name: 'In-Game Overlay', description: 'Overlay HUD for friends, chat, browser, and guides', priority: 'differentiating' },
    { category: 'differentiating', name: 'Season Pass and Events', description: 'Battle pass system with seasonal content and rewards', priority: 'differentiating' },
    { category: 'differentiating', name: 'Community Hub', description: 'Guides, artwork, videos, and discussions per game', priority: 'differentiating' },
    { category: 'differentiating', name: 'Gifting and Trading', description: 'Gift games to friends and trade in-game items', priority: 'differentiating' },
    { category: 'differentiating', name: 'Broadcasting Integration', description: 'Built-in streaming to Twitch, YouTube, and custom RTMP', priority: 'differentiating' },
  ],

  businessModels: [
    {
      modelType: 'Digital Distribution',
      revenueStreams: ['game-sales', 'dlc-sales', 'season-pass-sales', 'in-game-purchases', 'currency-packs'],
      costStructure: ['bandwidth', 'storage', 'payment-processing', 'customer-support', 'platform-development'],
      pricingStrategy: ['standard-pricing', 'regional-pricing', 'sales-and-discounts', 'bundle-pricing'],
    },
    {
      modelType: 'Subscription',
      revenueStreams: ['monthly-subscriptions', 'annual-subscriptions', 'family-plans'],
      costStructure: ['content-licensing', 'platform-development', 'cloud-save-infrastructure', 'customer-support'],
      pricingStrategy: ['freemium', 'tiered-subscription', 'family-sharing'],
    },
    {
      modelType: 'Creator Economy',
      revenueStreams: ['mod-sales', 'tip-commissions', 'creator-revenue-share'],
      costStructure: ['workshop-platform', 'payment-processing', 'moderation', 'creator-support'],
      pricingStrategy: ['revenue-share', 'tip-based', 'freemium-with-extras'],
    },
  ],

  technicalPatterns: [
    { category: 'distribution', name: 'P2P + CDN Hybrid Delivery', description: 'Peer-to-peer download acceleration with CDN fallback', rationale: 'Reduces bandwidth costs for popular content' },
    { category: 'security', name: 'Kernel-Mode Anti-Cheat', description: 'Low-level system monitoring with behavioural analysis', rationale: 'Detects sophisticated cheating methods' },
    { category: 'real-time', name: 'WebSocket Matchmaking', description: 'Real-time queue management and party coordination', rationale: 'Low-latency matchmaking experience' },
    { category: 'cloud', name: 'Cloud Save Sync', description: 'Encrypted cloud storage with conflict resolution and delta sync', rationale: 'Cross-device save continuity' },
    { category: 'integration', name: 'In-Game Overlay', description: 'DirectX/Vulkan overlay injection for in-game features', rationale: 'Seamless social experience without alt-tabbing' },
    { category: 'streaming', name: 'Low-Latency Game Streaming', description: 'H.265 encoding with sub-50ms streaming latency', rationale: 'Playable cloud and remote play experience' },
  ],

  operationalLifecycle: [
    { id: 'publishing', name: 'Game Publishing', description: 'Submission, review, store listing creation, and publishing' },
    { id: 'pre-launch', name: 'Pre-Launch', description: 'Wishlist promotion, pre-order setup, and marketing campaigns' },
    { id: 'launch', name: 'Launch Day', description: 'Release coordination, server scaling, and monitoring' },
    { id: 'live-ops', name: 'Live Operations', description: 'Updates, events, DLC releases, and community engagement' },
    { id: 'maintenance', name: 'Maintenance', description: 'Patch deployment, anti-cheat updates, and server maintenance' },
    { id: 'sunset', name: 'Game Sunset', description: 'End-of-life, refund period, and archival' },
  ],

  designPrinciples: [
    { name: 'Gaming-First Dark Theme', description: 'Dark backgrounds designed for extended play sessions with neon accent highlights' },
    { name: 'Library-First Layout', description: 'Game library as primary view with quick-access tiles and metadata' },
    { name: 'Social Integration', description: 'Friends, chat, and party management accessible without leaving the game' },
    { name: 'Performance Transparency', description: 'Download speeds, install sizes, and system requirements clearly displayed' },
    { name: 'Accessibility by Default', description: 'Colorblind modes, subtitle options, and remappable controls for all games' },
  ],

  securityConsiderations: [
    { category: 'auth', name: '2FA Enforcement', description: 'TOTP-based 2FA with backup codes for account protection', severity: 'high' },
    { category: 'data', name: 'Anti-Cheat Kernel Mode', description: 'Kernel-mode anti-cheat with minimal data collection', severity: 'critical' },
    { category: 'data', name: 'Cloud Save Encryption', description: 'End-to-end encrypted cloud saves with per-user keys', severity: 'high' },
    { category: 'compliance', name: 'Age Verification', description: 'Age gate at purchase and runtime for mature content', severity: 'high' },
    { category: 'auth', name: 'Parental Controls', description: 'Family account management with spending and playtime limits', severity: 'medium' },
    { category: 'data', name: 'VAC Ban Data', description: 'Cheat detection data stored securely with appeal process', severity: 'high' },
  ],

  regulations: [
    {
      name: 'COPPA',
      requirements: [
        'Parental consent for accounts under 13',
        'Child accounts restricted to E-rated content',
        'No behavioural advertising for child accounts',
        'Playtime limits for child accounts',
      ],
    },
    {
      name: 'GDPR',
      requirements: [
        'Right to access and export all personal data',
        'Right to erasure with cascade deletion',
        'Consent management for EU users',
        'DPA with anti-cheat and payment sub-processors',
      ],
    },
    {
      name: 'ESRB / Regional Rating Boards',
      requirements: [
        'Age rating enforcement at storefront and runtime',
        'Mature content purchase age verification',
        'Regional rating compliance (PEGI, USK, ACB, CERO)',
      ],
    },
    {
      name: 'Consumer Protection Laws',
      requirements: [
        'Refund rights per jurisdiction (EU 14-day cooling-off, Australia ACL)',
        'Clear display of microtransaction odds where required',
        'Loot box disclosure per regional regulations',
      ],
    },
  ],

  testingRequirements: [
    { category: 'unit', name: 'Matchmaking Algorithm', description: 'Correct skill tier assignment and queue expansion', priority: 'high' },
    { category: 'unit', name: 'Achievement System', description: 'Unlock validation, rarity calculation, and progress tracking', priority: 'medium' },
    { category: 'unit', name: 'Refund Eligibility', description: 'Play time and date window validation', priority: 'high' },
    { category: 'unit', name: 'Cloud Save Sync', description: 'Conflict detection and resolution logic', priority: 'high' },
    { category: 'integration', name: 'Purchase to Launch Flow', description: 'Store purchase through to first game launch', priority: 'high' },
    { category: 'integration', name: 'Cross-Save Sync', description: 'Save upload -> cloud storage -> download on different platform', priority: 'medium' },
    { category: 'integration', name: 'Anti-Cheat Pipeline', description: 'Detection -> report -> review -> action flow', priority: 'high' },
    { category: 'e2e', name: 'New User Journey', description: 'Signup -> browse store -> purchase game -> download -> install -> play -> earn achievement -> share', priority: 'high' },
    { category: 'e2e', name: 'Social Gaming Session', description: 'Friend invite -> party formation -> game launch -> cross-play session -> cloud save sync', priority: 'medium' },
  ],

  workflows: [
    { id: 'game-publish', name: 'Game Publishing Workflow', steps: ['submission', 'review', 'store-listing', 'testing', 'publish', 'post-launch-support'], entities: ['game', 'dlc', 'store-listing', 'update'] },
    { id: 'matchmaking', name: 'Matchmaking Flow', steps: ['queue-join', 'skill-evaluation', 'party-matching', 'game-server-allocation', 'match-start', 'result-reporting'], entities: ['player', 'party', 'match', 'game-server'] },
    { id: 'live-ops', name: 'Live Operations Event', steps: ['event-planning', 'content-build', 'patch-deployment', 'event-launch', 'monitoring', 'event-conclusion'], entities: ['event', 'season-pass', 'reward', 'player-progress'] },
    { id: 'anti-cheat', name: 'Anti-Cheat Action Flow', steps: ['detection', 'report-creation', 'human-review', 'action-decision', 'appeal-period', 'final-enforcement'], entities: ['player', 'detection', 'report', 'appeal'] },
  ],

  entities: [
    { name: 'Game', description: 'Primary game product with metadata, DLC, and system requirements', invariants: ['must have store listing before publication', 'must have valid age rating per target region', 'DLC linked to base game'] },
    { name: 'Player', description: 'User account with library, profile, and social connections', invariants: ['unique username per platform', 'age verified for mature content purchases', 'linked to payment method for purchases'] },
    { name: 'Achievement', description: 'Unlockable accomplishment with rarity and points', invariants: ['unique per game', 'server-side validation for competitive achievements', 'progress persisted to cloud save'] },
    { name: 'CloudSave', description: 'Encrypted save file stored per user per game', invariants: ['encrypted at rest', 'conflict resolved deterministically', 'retained per user preference settings'] },
    { name: 'Match', description: 'Multiplayer game session with participants and results', invariants: ['valid participant list', 'anti-cheat report generated post-match', 'result submitted by authoritative source'] },
    { name: 'Mod', description: 'Community-created content for supported games', invariants: ['approved by moderation queue before publication', 'compatible with current game version', 'developer can remove at any time'] },
  ],

  invariants: [
    'Game cannot be launched without valid license (purchased or in free trial)',
    'Cloud save upload must complete before allowing offline play to continue',
    'Achievement unlock requires server-side validation for online games',
    'Anti-cheat detection does not auto-ban — requires human review for severe actions',
    'Refund processing revokes game license after refund approval',
    'Age-restricted purchases blocked for accounts below minimum age',
    'Cross-play session validates all participants have compatible game versions',
    'Mod installation does not modify base game files without user consent',
  ],

  constraints: [
    'Refund window 14 days with 2-hour play time limit',
    'Anti-cheat required for all competitive multiplayer games',
    'Cloud save sync requires online connection (last known good cached locally)',
    'Cross-play requires all participants to have compatible game version',
    'Mods restricted to games with developer opt-in',
    'Parental controls cannot be overridden by child account',
    'Season pass rewards must be claimable throughout active season',
  ],

  financialFlows: [
    { name: 'game-sale', direction: 'in', trigger: 'game or DLC purchase completion' },
    { name: 'refund', direction: 'out', trigger: 'approved refund request processing' },
    { name: 'developer-revenue', direction: 'out', trigger: 'revenue share distribution per developer agreement' },
    { name: 'bandwidth-cost', direction: 'out', trigger: 'download and streaming bandwidth usage' },
    { name: 'anti-cheat-cost', direction: 'out', trigger: 'anti-cheat licensing and infrastructure' },
    { name: 'creator-tip', direction: 'in', trigger: 'community tip to mod creator via platform' },
  ],

  successMetrics: [
    'Monthly Active Users (MAU)',
    'Daily Active Users (DAU) / MAU Ratio',
    'Average Games Owned per User',
    'Store Conversion Rate (browse to purchase)',
    'Average Play Time per User per Day',
    'Achievement Completion Rate',
    'Cloud Save Success Rate',
    'Matchmaking Queue Time (<30s target)',
    'Anti-Cheat Detection Rate',
    'Refund Rate (target <2%)',
    'Customer Support Resolution Time',
    'User Satisfaction Score (CSAT)',
  ],

  analytics: {
    tracked: [
      'purchase-behavior', 'game-play-time', 'feature-usage', 'store-browsing',
      'search-queries', 'wishlist-behavior', 'social-interactions', 'matchmaking-times',
      'achievement-progression', 'mod-usage', 'refund-patterns', 'anti-cheat-events',
    ],
    dashboards: [
      'Store Performance Dashboard',
      'Player Engagement Dashboard',
      'Revenue Dashboard',
      'Anti-Cheat Dashboard',
      'Community Health Dashboard',
      'Live Operations Dashboard',
    ],
  },

  securityRequirements: [
    'Kernel-mode anti-cheat with driver signing and secure boot verification',
    'Cloud save encryption at rest (AES-256) and in transit (TLS 1.3)',
    'Payment data never stored on platform (tokenised via payment processor)',
    '2FA enforcement with backup codes and recovery options',
    'Parental control PIN hashing and secure storage',
    'Anti-cheat data isolated and access-controlled',
    'Account takeover detection via anomaly monitoring',
    'Game file integrity verification at launch',
  ],

  regulatory: [
    { regulation: 'COPPA', applies: true, notes: 'Child account restrictions, parental consent, no behavioural ads' },
    { regulation: 'GDPR', applies: true, notes: 'Data export/erasure, consent management, DPA requirements' },
    { regulation: 'ESRB', applies: true, notes: 'Age rating enforcement, mature content purchase verification' },
    { regulation: 'Consumer Protection Laws', applies: true, notes: 'Refund rights, loot box disclosure, microtransaction regulations' },
  ],
};
