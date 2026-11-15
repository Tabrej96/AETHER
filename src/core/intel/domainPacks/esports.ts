/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Esports Tournament Platform Domain Pack
 *
 * Competitive gaming tournament platform with bracket management, live scoring,
 * team management, anti-cheat integration, prize distribution, and spectator
 * streaming. Covers the full tournament lifecycle from registration to prize payout.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';
// ── Pack Interface ───────────────────────────────────────────────────────────


// ── DomainModel Interface ────────────────────────────────────────────────────


// ── DomainPack Constant ───────────────────────────────────────────────────────

export const ESPORTS_PACK: DomainPack = {
  domain: 'esports',
  name: 'Esports Tournament Platform',
  description:
    'Competitive gaming tournament platform with automated bracket generation, live match scoring, team management, anti-cheat integration, prize distribution, and spectator streaming. Supports online, hybrid, and in-person tournament formats with comprehensive admin tools.',

  catalog: {
    categories: ['Tournaments', 'Teams', 'Matches', 'Leaderboards', 'Schedules', 'Prizes'],
    features: [
      'tournament-browse', 'tournament-registration', 'team-management', 'match-scheduling',
      'bracket-view', 'live-scoring', 'leaderboards', 'player-profiles', 'prize-tracking',
      'match-history', 'statistics', 'replay-hosting', 'stream-integration', 'anti-cheat-reports',
      'tournament-calendar', 'notifications', 'social-sharing', 'team-invites', 'roster-management', 'dispute-system',
    ],
  },

  fulfillment: {
    modes: ['online', 'hybrid', 'in-person'],
    features: [
      'tournament-brackets', 'match-scheduling', 'live-scoring', 'prize-distribution',
      'registration-management', 'check-in-system', 'venue-management', 'stream-scheduling',
      'referee-assignment', 'result-verification', 'anti-cheat-integration', 'spectator-access',
    ],
  },

  customer: {
    features: [
      'tournament-browse', 'team-management', 'match-tracking', 'leaderboards', 'profile',
      'registration', 'schedule-view', 'live-scoring', 'chat', 'replay-viewer',
      'achievements', 'friend-system', 'notifications', 'tournament-history', 'prize-claims',
    ],
  },

  operations: {
    features: [
      'tournament-management', 'referee-tools', 'anti-cheat', 'streaming-integration',
      'prize-management', 'bracket-automation', 'schedule-coordination', 'venue-management',
      'result-validation', 'dispute-resolution', 'roster-audit', 'compliance-reporting',
      'broadcast-production', 'community-moderation',
    ],
  },

  experience: {
    features: [
      'live-spectator-mode', 'real-time-stats', 'social-features', 'highlight-reels',
      'multi-view-stream', 'live-commentary', 'predictions', 'fan-engagement',
      'tournament-recap', 'season-progression', 'cross-platform-watch', 'vr-spectator',
    ],
  },

  components: {
    public: ['tournaments', 'leaderboards', 'news', 'schedule', 'streams'],
    customer: ['profile', 'team', 'matches', 'settings', 'tournaments', 'history'],
    admin: ['dashboard', 'tournament-mgmt', 'reports', 'settings', 'users', 'billing'],
    staff: ['refereeing', 'operations', 'support', 'broadcast', 'anti-cheat-review'],
  },

  businessRules: {
    tournamentFormat: [
      'Single elimination: best-of-1 or best-of-3 per match, losers immediately eliminated.',
      'Double elimination: winners and losers brackets, grand finals with bracket reset option.',
      'Round-robin: all teams play each other, top N advance.',
      'Swiss format: pair teams by win record, fixed number of rounds.',
      'Format is immutable once tournament starts.',
      'Seeding based on team ranking, previous performance, or random draw.',
    ],
    matchRules: [
      'Match format: best-of-1 (qualifiers), best-of-3 (main bracket), best-of-5 (grand finals) — configurable per tournament.',
      'Side selection: higher seed picks first side in best-of-1; alternating in best-of-3/5.',
      'Pause rules: each team allowed 2 tactical pauses per map (60s each), technical pauses unlimited.',
      'Disconnect policy: player has 10 minutes to reconnect; team may continue with substitute or forfeit.',
      'Spectator delay: 2-minute delay for competitive integrity in online tournaments.',
      'Overtime rules: sudden death with configurable overtime limit per game title.',
    ],
    eligibility: [
      'Player eligibility: minimum age 16 for online, 18 for in-person with prize pools over $1,000.',
      'Team eligibility: minimum roster size (3-5 players depending on title), all players verified.',
      'Registration deadline: 24 hours before tournament start — late registration at organiser discretion.',
      'Regional restrictions: some tournaments limited to specific regions (NA, EU, APAC, SA).',
      'Professional player restrictions: pro players excluded from amateur/open tournaments.',
      'Account standing: players with active suspensions or bans are ineligible.',
      'Team roster lock: rosters locked at tournament start; changes require organiser approval.',
    ],
    antiCheat: [
      'Mandatory anti-cheat client for all competitive matches. Kernel-mode on Windows, system-level on macOS.',
      'Automated detection: memory scanning, process injection detection, input replay verification.',
      'Manual review: suspicious matches flagged for human review by anti-cheat team.',
      'Penalty escalation: first offense — match forfeiture; second — tournament DQ; third — platform ban.',
      'Appeal process: players may appeal within 48 hours with evidence.',
      'Tournament organiser may request additional measures (facecam, screen share, LAN-only).',
    ],
    prizeDistribution: [
      'Prize pool distribution documented before tournament start — immutable after registration closes.',
      'Standard split: 1st place 50%, 2nd place 30%, 3rd place 20% (3-place) or tiered for larger brackets.',
      'Team prize: pool divided equally among starting roster players.',
      'Prize payment: within 30 days of tournament completion.',
      'Tax documentation: W-9/W-8BEN required before payout for US/international players.',
      'Unclaimed prizes: forfeited after 90 days with notification.',
      'Disqualified players forfeit entire prize share.',
    ],
    disqualification: [
      'Auto-disqualification: no-show for match (15-minute grace period), failure to submit anti-cheat verification.',
      'Organiser DQ: rule violation, collusion, match fixing, toxic behavior during tournament.',
      'DQ appeals: 48-hour window with evidence submission to tournament committee.',
      'DQ consequences: prize forfeiture, tournament result nullification, suspension from future tournaments.',
      'Team DQ: entire team disqualified; individual DQ: player removed, team may substitute if roster allows.',
    ],
  },

  design: {
    layout: [
      'Data-dense scoreboard layout optimized for live match viewing',
      'Live-first design — live events get priority layout treatment',
      'Replay-focus viewer with frame-by-frame controls and multi-angle support',
      'Tournament bracket visualization with interactive navigation',
      'Responsive layout for desktop, tablet, and mobile spectator views',
      'Picture-in-picture mode for watching multiple matches simultaneously',
    ],
    color: [
      'Gaming neon palette: electric blue (#00D4FF), hot pink (#FF006E), neon green (#39FF14) accents',
      'Dark background base (#0D0D0F, #141419) for reduced eye strain during long viewing sessions',
      'Team colors displayed as configurable brand colors with CSS custom properties',
      'High-contrast score overlays (white text with subtle shadow) for readability on video',
      'Red accent for alerts and disqualification notifications',
      'Green accent for live indicators and active match states',
    ],
    typography: [
      'Score-highlight: ultra-bold condensed font for match scores (64-96px on desktop)',
      'Team name bold: heavy weight for team identification in brackets and scoreboard',
      'Monospace for timer, score, and statistical displays for precise alignment',
      'Body readable: 14-16px sans-serif for descriptions, rules, and news articles',
      'Condensed headers for data-dense tables and leaderboard displays',
      'Tabular figures for all numerical data (scores, rankings, prize amounts)',
    ],
    interaction: [
      'Live update with smooth transitions when scores change (no jarring jumps)',
      'Replay controls: play/pause, scrub, speed control (0.25x-4x), frame-by-frame',
      'Bracket navigation: click-through bracket tree with animated path highlighting',
      'Keyboard shortcuts for spectator mode: space (play/pause), arrow keys (seek), number keys (camera angles)',
      'Real-time stat updates with animated counters for KDA, damage, objectives',
      'Spectator vote/highlight system for tournament clips',
      'Multi-view: drag-and-drop layout for watching 2-4 streams simultaneously',
    ],
    accessibility: [
      'Full keyboard navigation: tab through all interactive elements',
      'Screen reader announcements for match state changes, scores, and bracket updates',
      'Live region (ARIA live) for real-time score updates in spectator mode',
      'High contrast mode for scoreboard and bracket visualizations',
      'Colorblind-safe palette for team differentiation (not reliant on red/green alone)',
      'Skip navigation links and landmark regions for screen reader users',
      'Captions and transcripts for tournament commentary streams',
    ],
  },

  security: {
    auth:
      'Tournament organiser + player + spectator roles with separate permission sets. Organisers have full tournament management access. Players authenticate via email/password with anti-cheat client binding. Spectators access public streams without authentication. MFA optional for players, required for organisers. Team ownership verified through invite/accept flow with email confirmation.',

    data:
      'Anti-cheat data isolated, encrypted logs. Match data (player actions, game state) stored per match with integrity verification (hash chain). Anti-cheat reports stored in isolated database with role-based access. Player PII (name, email, country) encrypted at rest. Payment data for prize distribution stored via secure payment processor tokens. Replay files stored with access controls. Match results cryptographically signed to prevent tampering.',

    compliance: [
      'GDPR: Player data export/erasure, consent management for EU participants, DPA with sub-processors',
      'COPPA: Minimum age enforcement (16+), parental consent for youth tournaments (13-15)',
      'ESL Integrity Standards: Fair play enforcement, anti-corruption measures, drug testing compliance',
      'Tax Compliance: Prize payout tax documentation (W-9, W-8BEN) collection and reporting',
      'Local Gaming Laws: Prize-based tournaments comply with local gaming and prize regulations per territory',
    ],
  },

  testing: {
    unit: [
      'Bracket generation algorithm: single elimination, double elimination, round-robin, Swiss formats',
      'Match result validation: score parsing, winner determination, tiebreaker application',
      'Prize distribution calculation: percentage splits, team roster count, tax withholding',
      'Eligibility check: age verification, account standing, regional restriction, roster lock',
      'Anti-cheat report scoring: severity classification, evidence aggregation',
      'Leaderboard ranking: ELO calculation, win-rate computation, season reset',
      'Schedule conflict detection: overlapping matches for same team/player',
      'Roster validation: minimum player count, verified accounts, suspension checks',
    ],
    integration: [
      'Tournament creation -> registration period -> team registration -> roster lock -> bracket generation -> match scheduling',
      'Player registration -> eligibility check -> team join -> match check-in -> gameplay -> result submission -> score validation',
      'Live match: score update -> bracket propagation -> leaderboard update -> spectator notification -> replay upload',
      'Anti-cheat flag -> report creation -> organiser review -> disqualification decision -> prize redistribution',
      'Tournament completion -> prize calculation -> tax documentation -> payout processing -> winner notification',
      'Spectator stream: live event start -> geo-verification -> stream delivery -> chat moderation -> view count aggregation',
      'Team management: invite -> acceptance -> roster configuration -> substitute addition -> roster lock',
      'Dispute submission -> organiser review -> evidence collection -> ruling -> appeal period -> final decision',
    ],
    e2e: [
      'Organiser creates tournament -> teams register -> brackets auto-generated -> matches played live with scoring -> winner crowned -> prizes distributed',
      'Player discovers tournament -> registers team -> plays through bracket -> streams match -> chat with spectators -> receives prize payout',
      'Anti-cheat scenario: flagged player -> match review -> disqualification -> bracket update -> prize redistribution -> appeal process',
    ],
  },
};

// ── DomainModel Constant ───────────────────────────────────────────────────────

export const ESPORTS_DOMAIN: DomainModel = {
  id: 'esports',
  domain: 'esports',
  name: 'Esports Tournament Platform',
  label: 'Tournament Platform',
  category: 'gaming',
  description: ESPORTS_PACK.description,

  userRoles: [
    {
      id: 'player', name: 'Player',
      typicalFeatures: ['tournament-browse', 'team-management', 'match-tracking', 'leaderboards', 'profile'],
      permissions: ['tournament.register', 'team.manage', 'match.play', 'leaderboard.view', 'profile.edit'],
    },
    {
      id: 'organiser', name: 'Tournament Organiser',
      typicalFeatures: ['tournament-management', 'bracket-generation', 'prize-management', 'reports', 'settings'],
      permissions: ['tournament.create', 'tournament.edit', 'bracket.manage', 'prize.manage', 'results.verify', 'dispute.resolve'],
    },
    {
      id: 'referee', name: 'Referee',
      typicalFeatures: ['refereeing', 'match-oversight', 'dispute-resolution', 'anti-cheat-review'],
      permissions: ['match.monitor', 'dispute.review', 'result.confirm', 'player.disqualify', 'anti-cheat.review'],
    },
    {
      id: 'spectator', name: 'Spectator',
      typicalFeatures: ['live-spectator-mode', 'real-time-stats', 'social-features', 'highlight-reels'],
      permissions: ['stream.watch', 'chat.participate', 'leaderboard.view', 'replay.watch'],
    },
  ],
  role: 'player',

  standardFeatures: [
    { category: 'essential', name: 'Tournament Bracket System', description: 'Automated single/double elimination, round-robin, and Swiss bracket generation', priority: 'essential', dependencies: ['registration', 'team-management'] },
    { category: 'essential', name: 'Match Scheduling', description: 'Automated match scheduling with timezone support and notifications', priority: 'essential' },
    { category: 'essential', name: 'Live Scoring', description: 'Real-time match score tracking with result validation', priority: 'essential' },
    { category: 'essential', name: 'Team Management', description: 'Roster creation, substitution, and team hierarchy management', priority: 'essential' },
    { category: 'essential', name: 'Leaderboards', description: 'Player and team ranking with ELO and win-rate computation', priority: 'essential' },
    { category: 'expected', name: 'Anti-Cheat Integration', description: 'Kernel-mode anti-cheat with automated detection and manual review', priority: 'expected' },
    { category: 'expected', name: 'Prize Distribution', description: 'Automated prize pool calculation and payout processing', priority: 'expected' },
    { category: 'expected', name: 'Spectator Streaming', description: 'Live stream integration with multi-view and replay support', priority: 'expected' },
    { category: 'expected', name: 'Live Stats', description: 'Real-time player and team statistics during matches', priority: 'expected' },
    { category: 'expected', name: 'Dispute Resolution', description: 'Player dispute submission with organiser review workflow', priority: 'expected' },
    { category: 'differentiating', name: 'Replay System', description: 'Frame-by-frame replay with multi-angle and annotation support', priority: 'differentiating' },
    { category: 'differentiating', name: 'Highlight Reels', description: 'AI-generated highlight clips from tournament matches', priority: 'differentiating', dependencies: ['replay-system'] },
    { category: 'differentiating', name: 'VR Spectator Mode', description: 'Virtual reality live spectator experience for major tournaments', priority: 'differentiating' },
    { category: 'differentiating', name: 'Predictions', description: 'Fan prediction system with leaderboard and rewards', priority: 'differentiating' },
    { category: 'differentiating', name: 'Multi-View Streaming', description: 'Watch multiple match streams simultaneously in configurable layout', priority: 'differentiating' },
  ],

  businessModels: [
    {
      modelType: 'Tournament Platform Fees',
      revenueStreams: ['tournament-entry-fees', 'platform-commission', 'sponsorships', 'advertising'],
      costStructure: ['platform-infrastructure', 'streaming-bandwidth', 'anti-cheat-licensing', 'customer-support', 'prize-pool-funding'],
      pricingStrategy: ['freemium', 'entry-fee', 'sponsored'],
    },
    {
      modelType: 'Organiser SaaS',
      revenueStreams: ['subscription-tiers', 'premium-features', 'white-label'],
      costStructure: ['platform-development', 'hosting', 'support', 'anti-cheat', 'streaming-integration'],
      pricingStrategy: ['tiered-subscription', 'usage-based', 'white-label-premium'],
    },
    {
      modelType: 'Prize-Sponsored',
      revenueStreams: ['sponsor-funding', 'brand-partnerships', 'media-rights'],
      costStructure: ['platform-infrastructure', 'operations', 'prize-funding', 'marketing'],
      pricingStrategy: ['sponsored-free-entry', 'premium-spectator'],
    },
  ],

  technicalPatterns: [
    { category: 'real-time', name: 'WebSocket Live Updates', description: 'WebSocket connections for real-time score and bracket updates', rationale: 'Sub-second latency critical for live spectator experience' },
    { category: 'real-time', name: 'Event Sourcing for Match State', description: 'Append-only event log for match state with snapshot replay', rationale: 'Audit trail for match results and dispute resolution' },
    { category: 'ai', name: 'Anti-Cheat Client', description: 'Kernel-mode anti-cheat with behavior analysis and machine learning', rationale: 'Prevent cheating in competitive matches' },
    { category: 'streaming', name: 'Low-Latency Streaming', description: 'RTMP/HLS ingestion with sub-10-second broadcast delay', rationale: 'Near-real-time spectator experience for live matches' },
    { category: 'data', name: 'Real-time Bracket Engine', description: 'Graph-based bracket state machine with live propagation', rationale: 'Instant bracket updates across all connected clients' },
    { category: 'integration', name: 'Game API Integration', description: 'Native API integration with supported game titles for data ingestion', rationale: 'Automated match data collection without manual entry' },
  ],

  operationalLifecycle: [
    { id: 'setup', name: 'Tournament Setup', description: 'Organiser configures format, rules, prize pool, and registration settings' },
    { id: 'registration', name: 'Registration and Check-in', description: 'Teams register, rosters confirmed, eligibility verified' },
    { id: 'bracket-generation', name: 'Bracket Generation', description: 'Seeding, bracket creation, and match scheduling' },
    { id: 'live-play', name: 'Live Match Play', description: 'Matches played with live scoring, anti-cheat monitoring, and spectator streaming' },
    { id: 'results', name: 'Result Validation', description: 'Match results verified, disputes resolved, bracket updated' },
    { id: 'conclusion', name: 'Tournament Conclusion', description: 'Final standings, prize distribution, and post-tournament analytics' },
  ],

  designPrinciples: [
    { name: 'Data-Dense Live Experience', description: 'Scoreboards and stats prioritize information density for competitive viewers' },
    { name: 'Immediate Feedback', description: 'Score changes, bracket updates, and events propagate instantly to all viewers' },
    { name: 'Spectator-First', description: 'Viewing experience optimized for audience — players and organisers are secondary' },
    { name: 'Competitive Integrity', description: 'Design supports fair play verification — replay, anti-cheat status, and audit trails visible to authorised users' },
    { name: 'Multi-Platform Support', description: 'Seamless experience across desktop, mobile, tablet, and smart TV devices' },
  ],

  securityConsiderations: [
    { category: 'auth', name: 'Role-Based Access', description: 'Separate permission sets for organisers, players, referees, and spectators', severity: 'high' },
    { category: 'data', name: 'Anti-Cheat Isolation', description: 'Anti-cheat data stored in isolated database with restricted access', severity: 'critical' },
    { category: 'data', name: 'Match Data Integrity', description: 'Cryptographic signing of match results to prevent tampering', severity: 'high' },
    { category: 'compliance', name: 'Age Verification', description: 'Minimum age enforcement per tournament category', severity: 'high' },
    { category: 'auth', name: 'Anti-Cheat Client Security', description: 'Kernel-mode anti-cheat requires secure boot and driver signing', severity: 'critical' },
    { category: 'compliance', name: 'Prize Payout Compliance', description: 'Tax documentation and regulatory compliance for prize distribution', severity: 'medium' },
  ],

  regulations: [
    {
      name: 'GDPR',
      requirements: [
        'Player data export and erasure rights',
        'Consent management for EU tournament participants',
        'DPA with anti-cheat and streaming sub-processors',
        'Data residency considerations for international tournaments',
      ],
    },
    {
      name: 'COPPA',
      requirements: [
        'Minimum age 16 for competitive play',
        'Parental consent for youth tournaments (13-15)',
        'Limited data collection for minor participants',
      ],
    },
    {
      name: 'Esports Integrity Standards',
      requirements: [
        'Anti-cheat enforcement documented and auditable',
        'Match fixing detection and reporting',
        'Player welfare and fair play policies',
      ],
    },
    {
      name: 'Prize and Gaming Regulations',
      requirements: [
        'Prize pool compliance with local gaming laws per territory',
        'Tax withholding and reporting for prize distributions',
        'Age restrictions for prize-eligible tournaments',
      ],
    },
  ],

  testingRequirements: [
    { category: 'unit', name: 'Bracket Generation', description: 'Correct bracket output for all supported tournament formats', priority: 'high' },
    { category: 'unit', name: 'Prize Distribution', description: 'Accurate prize calculation and split per rules', priority: 'high' },
    { category: 'unit', name: 'Eligibility Validation', description: 'Age, region, and roster eligibility checks', priority: 'high' },
    { category: 'unit', name: 'Leaderboard Calculation', description: 'Correct ELO and ranking computation', priority: 'medium' },
    { category: 'integration', name: 'Full Tournament Flow', description: 'Creation -> registration -> play -> scoring -> results', priority: 'high' },
    { category: 'integration', name: 'Anti-Cheat Integration', description: 'Flag -> review -> action workflow', priority: 'high' },
    { category: 'integration', name: 'Live Streaming Pipeline', description: 'Match start -> stream ingest -> geo-verification -> broadcast -> recording', priority: 'medium' },
    { category: 'e2e', name: 'End-to-End Tournament', description: 'Organiser creates tournament -> teams register -> matches played live -> winner crowned -> prizes distributed', priority: 'high' },
    { category: 'e2e', name: 'Spectator Experience', description: 'Discover tournament -> watch live stream -> interact via chat -> view highlights -> follow favorite team', priority: 'medium' },
  ],

  workflows: [
    { id: 'tournament-setup', name: 'Tournament Setup', steps: ['create-tournament', 'configure-format', 'set-prize-pool', 'define-rules', 'open-registration'], entities: ['tournament', 'format', 'prize-pool', 'rule-set'] },
    { id: 'match-live', name: 'Live Match Execution', steps: ['check-in', 'side-selection', 'game-play', 'score-submission', 'result-validation', 'bracket-update'], entities: ['match', 'team', 'score', 'anti-cheat-report'] },
    { id: 'prize-payout', name: 'Prize Distribution', steps: ['tournament-completion', 'standings-verification', 'tax-documentation', 'payout-calculation', 'payment-processing', 'confirmation'], entities: ['prize-pool', 'winner', 'payout', 'tax-form'] },
    { id: 'dispute-resolution', name: 'Dispute Resolution', steps: ['dispute-filing', 'evidence-collection', 'referee-review', 'ruling', 'appeal-period', 'final-decision'], entities: ['dispute', 'match', 'evidence', 'ruling'] },
  ],

  entities: [
    { name: 'Tournament', description: 'Competitive event with format, rules, and prize pool', invariants: ['format is immutable after registration closes', 'prize pool documented before registration'] },
    { name: 'Team', description: 'Group of players competing together', invariants: ['roster size within min/max bounds', 'all players verified and eligible', 'roster locked at tournament start'] },
    { name: 'Match', description: 'Individual competitive encounter between teams', invariants: ['has defined participants', 'anti-cheat report generated post-match'] },
    { name: 'Bracket', description: 'Tournament bracket structure with match progression', invariants: ['bracket structure consistent with tournament format', 'matches scheduled without team conflicts'] },
    { name: 'PrizePool', description: 'Tournament prize distribution configuration', invariants: ['distribution percentages sum to 100%', 'payout recipients match roster at tournament start'] },
  ],

  invariants: [
    'Tournament format cannot be changed after registration closes',
    'Bracket state is atomically updated',
    'Anti-cheat flag does not auto-disqualify — requires human review',
    'Prize distribution cannot exceed prize pool amount',
    'Disqualified players forfeit entire prize share',
    'Match result requires verification from organiser or anti-cheat system',
    'Spectator stream delay must be at least 2 minutes',
  ],

  constraints: [
    'Matches require minimum 2 verified participants',
    'Tournament registration closes 24 hours before first match',
    'Anti-cheat client required for all competitive matches',
    'Prize payout within 30 days of tournament completion',
    'Dispute appeals within 48 hours of ruling',
    'Player minimum age 16 (18 for high-prize tournaments)',
  ],

  financialFlows: [
    { name: 'entry-fees', direction: 'in', trigger: 'team registration payment' },
    { name: 'prize-payout', direction: 'out', trigger: 'tournament completion and winner verification' },
    { name: 'platform-commission', direction: 'in', trigger: 'percentage of prize pool or entry fees' },
    { name: 'sponsorship-revenue', direction: 'in', trigger: 'sponsor agreement and campaign delivery' },
    { name: 'streaming-cost', direction: 'out', trigger: 'live streaming bandwidth and infrastructure usage' },
    { name: 'anti-cheat-licensing', direction: 'out', trigger: 'per-tournament anti-cheat licensing fee' },
  ],

  successMetrics: [
    'Tournaments Hosted per Month',
    'Total Unique Players per Month',
    'Average Tournament Completion Rate',
    'Match Completion Rate (>98%)',
    'Average Spectator Count per Tournament',
    'Prize Pool Distribution Timeliness (<30 days)',
    'Anti-Cheat Detection Rate',
    'Dispute Resolution Time (<72 hours)',
    'Player Retention Rate (monthly)',
    'Stream Uptime (>99.5%)',
    'Registration to Check-in Conversion Rate',
    'User Satisfaction Score (CSAT)',
  ],

  analytics: {
    tracked: [
      'tournament-registrations', 'match-completion', 'viewer-count', 'stream-health',
      'player-retention', 'engagement-duration', 'bracket-navigation', 'chat-activity',
      'replay-views', 'prize-distribution-timing',
    ],
    dashboards: [
      'Tournament Operations Dashboard',
      'Live Match Monitor Dashboard',
      'Spectator Analytics Dashboard',
      'Prize Distribution Dashboard',
      'Anti-Cheat Reports Dashboard',
      'Player Retention Dashboard',
    ],
  },

  securityRequirements: [
    'Anti-cheat data isolation and encryption at rest',
    'Match result cryptographic signing',
    'Role-based access with organiser approval for sensitive operations',
    'Device fingerprinting for player authentication',
    'Spectator stream geo-blocking where required by licensing',
    'Prize payout identity verification (KYC where required)',
    'Anti-cheat client integrity verification',
    'Dispute evidence preservation with audit trail',
  ],

  regulatory: [
    { regulation: 'GDPR', applies: true, notes: 'Player data rights, consent management, cross-border data transfer' },
    { regulation: 'COPPA', applies: true, notes: 'Age verification and parental consent for youth tournaments' },
    { regulation: 'ESL Integrity Standards', applies: true, notes: 'Anti-cheat enforcement, match-fixing prevention, fair play' },
    { regulation: 'Local Gaming Laws', applies: true, notes: 'Prize tournament compliance per territory' },
  ],
};
