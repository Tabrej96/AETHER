/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fitness & Wellness Domain Pack
 *
 * Complete fitness and wellness platform — from member onboarding to workout tracking and wellness coaching.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForFitnessWellness(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'membership-gym',
      description: 'Traditional gym and fitness center with tiered membership plans, personal training add-ons, and group class packages. Members access physical facilities, equipment, and scheduled classes.',
      pricingExamples: ['$29/month basic membership', '$49/month premium (includes classes)', '$99/month family plan', '$75/hour personal training', '$15 per drop-in class'],
    },
    {
      modelType: 'online-fitness-platform',
      description: 'Digital fitness platform offering live and on-demand workout classes, personal training via video call, nutrition coaching, and progress tracking. Accessible from any device.',
      pricingExamples: ['$19.99/month basic (on-demand)', '$39.99/month premium (live classes)', '$14.99/month annual billing discount', '$29.99/month personal training add-on', '$49.99/month family plan (4 members)'],
    },
    {
      modelType: 'corporate-wellness-program',
      description: 'B2B wellness platform for employee health and fitness. Includes virtual classes, wellness challenges, health screenings, and aggregate health analytics for HR departments.',
      pricingExamples: ['$12/employee/month basic', '$25/employee/month premium', '$5,000/year implementation fee', '$3/employee/month wellness challenges', 'Custom pricing for 500+ employees'],
    },
  ];
}

function revenueStreamsForFitnessWellness(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Membership Subscriptions',
      description: 'Recurring monthly or annual membership fees for gym access, online platform access, or both.',
      pricingModel: 'per-member-per-month',
      examples: ['$29/month basic', '$49/month premium', '$19.99/month online', '$99/month family'],
    },
    {
      name: 'Personal Training Sessions',
      description: 'One-on-one training sessions with certified personal trainers, in-person or virtual.',
      pricingModel: 'per-session or package',
      examples: ['$75/session individual', '$55/session 10-pack', '$45/session 20-pack', '$120/60-minute session premium trainer'],
    },
    {
      name: 'Group Class Packages',
      description: 'Pay-per-class or class package purchases for yoga, spin, HIIT, pilates, and other group fitness classes.',
      pricingModel: 'per-class or package',
      examples: ['$15 drop-in class', '$99 10-class pack', '$199 unlimited monthly', '$12/class corporate package'],
    },
    {
      name: 'Corporate Wellness Contracts',
      description: 'B2B contracts for employee wellness programs including virtual classes, challenges, and health analytics.',
      pricingModel: 'per-employee-per-month',
      examples: ['$12/employee/month', '$25/employee/month premium', '$5,000/year implementation', 'Custom 500+ employee pricing'],
    },
    {
      name: 'Nutrition & Wellness Coaching',
      description: 'Subscription or session-based nutrition coaching, meal planning, and wellness consulting.',
      pricingModel: 'subscription or per-session',
      examples: ['$49/month nutrition coaching', '$85/nutrition consultation', '$29/month meal plan subscription', '$150 wellness assessment'],
    },
    {
      name: 'Merchandise & Retail',
      description: 'Sale of fitness apparel, supplements, equipment, and branded merchandise through the platform.',
      pricingModel: 'per-unit markup',
      examples: ['30-50% markup on apparel', '15-25% markup on supplements', '$19.99 branded water bottle', '$49.99 resistance band set'],
    },
  ];
}

function userRoleMatrixForFitnessWellness(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'member',
      roleName: 'Member',
      description: 'Individual who has joined the fitness center or online platform. Accesses classes, tracks workouts, and manages membership.',
      permissions: ['book-classes', 'view-workout-history', 'track-progress', 'manage-membership', 'purchase-sessions', 'view-trainer-profiles'],
      features: ['class-schedule', 'workout-tracking', 'progress-dashboard', 'membership-management', 'nutrition-logging', 'goal-setting'],
      constraints: ['cannot access other member data', 'cannot modify class schedule', 'cancellation requires 24h notice for refund', 'membership auto-renews unless cancelled 7 days before'],
    },
    {
      roleId: 'trainer',
      roleName: 'Personal Trainer',
      description: 'Certified fitness professional providing one-on-one training, creating workout plans, and tracking client progress.',
      permissions: ['create-workout-plans', 'view-client-progress', 'book-training-sessions', 'log-workouts', 'provide-feedback'],
      features: ['client-management', 'workout-builder', 'progress-tracking', 'session-scheduling', 'nutrition-advice'],
      constraints: ['certification must be current and verified', 'cannot modify member personal data', 'client data access limited to own clients', 'session notes must maintain professional boundaries'],
    },
    {
      roleId: 'instructor',
      roleName: 'Group Fitness Instructor',
      description: 'Certified instructor leading group fitness classes (yoga, spin, HIIT, etc.) both in-person and virtual.',
      permissions: ['manage-classes', 'view-class-rosters', 'log-class-attendance', 'create-class-playlists'],
      features: ['class-management', 'attendance-tracking', 'music-playlist', 'class-feedback-review'],
      constraints: ['certification required per class type', 'class capacity enforced', 'cancellation requires 4h notice', 'class content must align with platform standards'],
    },
    {
      roleId: 'admin',
      roleName: 'Studio Admin',
      description: 'Facility or platform administrator managing memberships, scheduling, billing, and staff.',
      permissions: ['manage-members', 'manage-staff', 'configure-classes', 'view-reports', 'manage-billing', 'handle-disputes'],
      features: ['member-management', 'staff-scheduling', 'billing-dashboard', 'reporting', 'facility-management'],
      constraints: ['cannot access member health data', 'refunds require manager approval above $100', 'all member data changes logged', 'GDPR compliance for data deletion requests'],
    },
    {
      roleId: 'corporate-client',
      roleName: 'Corporate Wellness Manager',
      description: 'HR or wellness manager at a corporate client company managing employee wellness program enrollment and reporting.',
      permissions: ['view-employee-data', 'manage-challenges', 'view-aggregate-reports', 'configure-wellness-programs'],
      features: ['employee-dashboard', 'wellness-challenges', 'aggregate-reporting', 'program-customization'],
      constraints: ['cannot access individual employee health data without consent', 'aggregate reports only for benchmarking', 'employee opt-in required for participation', 'data retention per corporate agreement'],
    },
  ];
}

function operationalWorkflowsForFitnessWellness(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'signup-to-onboard',
      name: 'Signup to Onboard',
      description: 'New member discovers platform, selects membership plan, completes registration, and gets onboarded with initial assessment.',
      steps: ['discover-platform', 'select-membership', 'complete-registration', 'payment-setup', 'fitness-assessment', 'goal-setting', 'onboarding-tour', 'first-class-booking'],
      entities: ['member', 'membership', 'assessment', 'goal', 'class-booking'],
      triggers: ['signup-completed', 'payment-confirmed', 'assessment-completed'],
    },
    {
      workflowId: 'book-to-attend',
      name: 'Book to Attend (Class)',
      description: 'Member browses class schedule, books a spot, receives reminder, attends class, and provides feedback.',
      steps: ['browse-schedule', 'select-class', 'book-spot', 'confirmation-email', 'reminder-notification', 'check-in', 'class-participation', 'post-class-feedback'],
      entities: ['class', 'booking', 'member', 'attendance-record', 'feedback'],
      triggers: ['booking-made', '24h-before-class', 'check-in-complete'],
    },
    {
      workflowId: 'assessment-to-plan',
      name: 'Assessment to Plan',
      description: 'New or existing member completes fitness assessment, trainer reviews results, creates personalized workout plan, and tracks progress.',
      steps: ['schedule-assessment', 'complete-assessment', 'trainer-review', 'plan-creation', 'plan-delivery', 'weekly-check-ins', 'progress-review', 'plan-adjustment'],
      entities: ['member', 'assessment', 'workout-plan', 'progress-entry', 'trainer'],
      triggers: ['assessment-completed', 'plan-approved', 'weekly-progress-due'],
    },
    {
      workflowId: 'feedback-to-adjust',
      name: 'Feedback to Adjust',
      description: 'Member provides feedback on workout, class, or trainer. Feedback analyzed, improvements made, and member notified.',
      steps: ['feedback-prompt', 'feedback-submission', 'sentiment-analysis', 'action-item-creation', 'plan-adjustment', 'member-notification', 'follow-up-survey'],
      entities: ['feedback', 'workout-plan', 'class', 'member', 'action-item'],
      triggers: ['class-completed', 'feedback-submitted', 'low-sentiment-detected'],
    },
  ];
}

function stateMachinesForFitnessWellness(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Membership',
      states: ['prospect', 'trial', 'active', 'paused', 'cancelled', 'expired', 'renewed'],
      transitions: { prospect: 'trial', active: 'cancelled', paused: 'active', cancelled: 'expired', expired: 'renewed', trial: 'cancelled' },
      initialState: 'prospect',
      terminalStates: ['expired'],
    },
    {
      entityName: 'ClassBooking',
      states: ['draft', 'booked', 'waitlisted', 'checked-in', 'attended', 'no-show', 'cancelled', 'completed'],
      transitions: { draft: 'cancelled', booked: 'cancelled', waitlisted: 'booked', 'checked-in': 'attended', attended: 'completed', 'no-show': 'completed' },
      initialState: 'draft',
      terminalStates: ['completed', 'cancelled'],
    },
    {
      entityName: 'WorkoutPlan',
      states: ['draft', 'review', 'active', 'completed', 'paused', 'archived'],
      transitions: { draft: 'review', review: 'draft', active: 'paused', paused: 'active', completed: 'archived' },
      initialState: 'draft',
      terminalStates: ['archived'],
    },
  ];
}

function edgeCasesForFitnessWellness(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Injury During Class or Training Session',
      description: 'A member sustains an injury during a group fitness class or personal training session, potentially requiring immediate medical attention and liability review.',
      handling: 'Staff trained in first aid response. Incident immediately reported in platform with timestamp, location, and nature of injury. Class or session stopped. Emergency services called if needed. Member\'s emergency contact notified. Trainer/instructor incident report filed.',
      recovery: 'Medical documentation collected. Liability waiver reviewed. Platform incident reviewed for safety improvements. Member offered modified workout plan. If facility-related, insurance claim initiated. Root cause analysis: equipment malfunction, improper instruction, or member pre-existing condition.',
    },
    {
      scenario: 'Instructor/Trainer Cancellation',
      description: 'A scheduled class or personal training session is cancelled by the instructor or trainer with insufficient notice, leaving members booked and waiting.',
      handling: 'Members automatically notified via app, SMS, and email. Waitlisted members offered open spots in alternative classes. Trainer cancellation tracked for performance review. Minimum 4-hour notice policy enforced with escalating disciplinary action for repeat offenses.',
      recovery: 'Members offered: (1) credit for a future class, (2) booking in an equivalent alternative class within 48 hours, (3) refund if no suitable alternative. Trainer receives attendance credit for cancelled session if due to emergency. Repeat cancellations trigger retraining or schedule review.',
    },
    {
      scenario: 'Equipment Malfunction During Class',
      description: 'Key equipment (treadmill, spin bike, weights, AV system for online class) malfunctions during an active session.',
      handling: 'Instructor immediately addresses the issue, pivots to bodyweight or alternative exercises. Equipment flagged in maintenance system. Session continues with modified exercises. Online classes: tech support notified, stream continues on backup.',
      recovery: 'Equipment repair scheduled or replacement ordered. Class rating may be adjusted. Members who experienced significant disruption offered class credit. Maintenance log updated. If recurring issue, equipment replacement considered.',
    },
    {
      scenario: 'Class Overbooking or Capacity Issue',
      description: 'More members show up for a class than the room or online platform can accommodate, or the online streaming platform reaches concurrent user limits.',
      handling: 'Real-time capacity monitoring in booking system. If overbooked: members notified in order of booking, offered next available class with priority. Online: stream quality degrades gracefully, load balancer distributes across CDN nodes.',
      recovery: 'Overbooked members: immediate notification with alternative class options and priority booking. Studio expansion considered if consistently at capacity. Online: additional stream instances spun up. Capacity limits reviewed and adjusted based on demand data.',
    },
  ];
}

function integrationsForFitnessWellness(): DomainPack['integrations'] {
  return [
    {
      name: 'Wearable Device APIs',
      type: 'iot',
      description: 'Integration with Fitbit, Apple Health, Garmin, Whoop, and other wearable devices for workout data sync and health metric tracking.',
      required: false,
      configuration: 'OAuth 2.0 authentication per device provider. Bi-directional sync: workout data from device to platform, workout plans from platform to device. Heart rate, steps, sleep, and workout data normalized to platform schema. Real-time heart rate display during live classes.',
    },
    {
      name: 'Payment Processing',
      type: 'financial',
      description: 'Stripe or equivalent for membership billing, class purchases, personal training payments, and merchandise sales.',
      required: true,
      configuration: 'Stripe subscriptions for recurring membership billing. One-time payments for class packs and merchandise. Proration for mid-cycle membership changes. Failed payment retry logic (3 attempts over 7 days). Automatic cancellation on final failed payment. Tax calculation per jurisdiction.',
    },
    {
      name: 'Video Streaming Platform',
      type: 'infrastructure',
      description: 'Live and on-demand video streaming for online fitness classes with low latency and high quality.',
      required: false,
      configuration: 'HLS/DASH streaming via CDN. Live streaming via RTMP ingest. Adaptive bitrate for varying connection speeds. Virtual camera integration for instructor feeds. Chat and reaction overlay for live classes. VOD library with categories and search.',
    },
    {
      name: 'Booking & Calendar System',
      type: 'productivity',
      description: 'Class schedule management, booking engine, and instructor scheduling with conflict detection.',
      required: true,
      configuration: 'Recurring class schedule with instructor assignment. Member booking with capacity enforcement. Waitlist management with auto-promotion. Calendar sync (Google, Outlook, iCal). SMS and email reminders 2h before class. Attendance check-in via QR code or NFC.',
    },
    {
      name: 'Health Data Aggregation',
      type: 'data',
      description: 'Apple HealthKit and Google Fit integration for comprehensive health metric aggregation beyond single wearables.',
      required: false,
      configuration: 'HealthKit/Google Fit SDK integration with user consent. Aggregate steps, active energy, workouts, sleep, heart rate. Privacy-first: data processed on-device where possible. Member controls data sharing granularity. De-identified aggregate data for wellness insights.',
    },
    {
      name: 'CRM & Marketing Automation',
      type: 'service',
      description: 'Member engagement, retention campaigns, and referral tracking through marketing automation.',
      required: false,
      configuration: 'Member lifecycle triggers: welcome series, re-engagement for inactive members, milestone celebrations. Referral tracking with reward automation. Email and SMS campaigns per member segment. A/B testing for campaign effectiveness.',
    },
  ];
}

function technicalArchitectureForFitnessWellness(): TechnicalArchitectureDef {
  return {
    patterns: ['Real-time class capacity management with optimistic locking', 'Video streaming with adaptive bitrate and CDN distribution', 'Wearable data aggregation and normalization layer', 'Recommendation engine for workout and class suggestions', 'Event-driven notifications for class reminders and engagement'],
    infrastructure: ['PostgreSQL for member data, bookings, and billing', 'Redis for session management, class capacity cache, and real-time features', 'S3-compatible storage for workout videos and class recordings', 'Media server (e.g., Mux, AWS IVS) for live streaming and VOD', 'Elasticsearch for class and workout search', 'Kafka for event streaming (check-ins, bookings, wearable data)'],
    dataFlow: 'Member browses class schedule → booking engine checks capacity (Redis cache) → booking confirmed (PostgreSQL) → reminder notification 2h before (Kafka event → push notification) → member checks in → attendance logged → wearable data syncs → workout data stored → progress dashboard updated → feedback collected after class.',
    scalability: 'Class booking handled via optimistic locking to prevent overbooking. Video streaming scales via CDN with edge caching. Wearable data ingestion via Kafka partitions per device type. Dashboard queries served from read replicas. Peak class booking times (morning/evening) handled with auto-scaling.',
  };
}

function regulatoryComplianceForFitnessWellness(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'HIPAA (Health Information Privacy)',
      jurisdiction: 'United States',
      requirements: ['Protected health information (PHI) encryption', 'Access controls for health data', 'Business associate agreements with service providers', 'Breach notification procedures', 'Member consent for data collection'],
      impact: 'Health data from wearables, fitness assessments, and nutrition logs must be treated as PHI. Encryption at rest and in transit. Access strictly controlled. Members must consent to health data collection and processing.',
    },
    {
      regulation: 'GDPR (EU Data Protection)',
      jurisdiction: 'European Union',
      requirements: ['Member data right to access and deletion', 'Consent management for marketing communications', 'Data processing records', 'Cross-border transfer restrictions', 'Data retention schedules'],
      impact: 'Member data management must support GDPR data subject requests. Consent tracking for marketing. Data retention policies enforced. EU member data stored in EU-compliant data centers.',
    },
    {
      regulation: 'Facility Safety & Liability',
      jurisdiction: 'Per state/country',
      requirements: ['Equipment safety inspections', 'Incident reporting procedures', 'Liability waiver management', 'Staff first aid/CPR certification tracking', 'Emergency procedures documented'],
      impact: 'Platform must support equipment inspection scheduling, incident reporting, and waiver management. Staff certification tracking with expiry alerts. Emergency contact information stored and accessible.',
    },
    {
      regulation: 'Payment Card Industry (PCI DSS)',
      jurisdiction: 'Global',
      requirements: ['Cardholder data encryption', 'Secure payment processing', 'Regular security audits', 'Vulnerability management', 'Access control for payment systems'],
      impact: 'Payment processing must be PCI compliant. Card data never stored on platform servers. Tokenization via Stripe or equivalent. Regular penetration testing.',
    },
    {
      regulation: 'Consumer Protection & Auto-Renewal',
      jurisdiction: 'Per state/country',
      requirements: ['Clear membership terms and auto-renewal disclosure', 'Easy cancellation process', 'Refund policy transparency', 'No negative option billing without clear consent'],
      impact: 'Membership terms clearly displayed at signup. One-click cancellation in member portal. Auto-renewal reminders 7 days before charge. Refund policy prominently stated.',
    },
  ];
}

function businessRulesForFitnessWellness(): BusinessRulesSpec {
  return {
    membership: [
      'Membership auto-renews on billing anniversary unless cancelled 7 days before. Cancellation takes effect at end of current billing period.',
      'Trial period: 7 days free access. Payment method required at signup. Trial converts to paid membership automatically unless cancelled.',
      'Membership freeze: maximum 3 months per year. Freeze request must be submitted at least 3 days before billing date. Frozen months extend membership end date.',
      'Family plan: up to 4 household members at $99/month. Primary account holder manages all members. Each member has individual login and progress tracking.',
      'Late payment: 3-day grace period after failed payment. Retry on day 4 and day 7. Account suspended after 3rd failed attempt. Reactivation requires updated payment method.',
      'Corporate members: verified by company email domain. Company receives aggregate usage reports, not individual health data.',
    ],
    classBooking: [
      'Members can book classes up to 14 days in advance. Maximum 3 bookings per day to prevent hoarding.',
      'Class cancellation: free cancellation up to 2 hours before class start. Late cancellation (within 2h) counts as attended toward monthly class limit.',
      'No-show policy: 3 consecutive no-shows results in 1-week booking restriction. 5 no-shows in a month triggers account review.',
      'Waitlist: automatic promotion if spot opens. Member has 15 minutes to accept waitlist spot before it goes to next in line.',
      'Class capacity enforced at booking. Virtual classes have separate capacity from in-person classes.',
      'Instructor cancellation: class marked as cancelled, all members notified, booking credits issued automatically.',
    ],
    personalTraining: [
      'Personal training sessions must be booked at least 24 hours in advance. Cancellation requires 24h notice for full credit.',
      'Session packages: 10-pack (10% discount), 20-pack (20% discount). Packages expire 12 months from purchase.',
      'Trainer-client matching: members can request specific trainer or be matched based on goals and trainer specialties.',
      'Session notes: trainers log session details, member progress, and next session recommendations. Members can view but not edit.',
      'Trainer certification must be current (verified annually). Expired certification disables trainer availability.',
    ],
    progressTracking: [
      'Workout data synced from wearables within 15 minutes of workout completion. Manual entry allowed for non-wearable workouts.',
      'Progress photos: members can upload progress photos. Photos are private by default. Trainer can view with member permission.',
      'Goal setting: SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound). Progress tracked against goals with milestone celebrations.',
      'Nutrition logging: optional feature requiring explicit member consent. Data used only for member\'s own coaching.',
    ],
    billing: [
      'Pro-rated billing for mid-cycle membership upgrades or downgrades. Credit applied to next billing cycle.',
      'Corporate billing: invoiced monthly per employee count. Payment terms net-30. Volume discounts for 100+ employees.',
      'Merchandise orders: shipped within 3 business days. Free shipping on orders over $75.',
      'Refunds: membership refunds prorated for unused portion. Class packs refundable within 14 days of purchase if unused. No refund on used sessions.',
    ],
  };
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const FITNESS_WELLNESS_PACK: DomainPack = {
  domain: 'fitnessWellness',
  name: 'Fitness & Wellness Platform',
  description: 'Complete fitness and wellness platform — from member onboarding to workout tracking and wellness coaching. Covers gym membership management, online fitness classes, personal training, corporate wellness programs, nutrition coaching, wearable device integration, and compliance with health data privacy regulations.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Membership Management', 'Class & Training', 'Progress Tracking', 'Nutrition & Wellness', 'Corporate Wellness', 'Retail & Merchandise'],
    features: [
      'membership-plans',
      'class-schedule',
      'personal-training',
      'workout-tracking',
      'progress-analytics',
      'nutrition-logging',
      'wearable-integration',
      'wellness-challenges',
      'online-streaming',
      'goal-setting',
      'social-community',
      'health-metrics',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['in-person-class', 'virtual-live-stream', 'on-demand-video', 'personal-training-session', 'digital-delivery'],
    features: [
      'class-capacity-management',
      'live-streaming',
      'video-on-demand',
      'session-check-in',
      'equipment-reservation',
      'nutrition-plan-delivery',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'member-dashboard',
      'class-schedule-browsing',
      'workout-history',
      'progress-charts',
      'trainer-messaging',
      'nutrition-tracking',
      'goal-dashboard',
      'community-feed',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'membership-management',
      'class-scheduling',
      'trainer-scheduling',
      'billing-engine',
      'attendance-tracking',
      'equipment-management',
      'facility-management',
      'reporting',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'motivational-ui',
      'achievement-badges',
      'social-sharing',
      'community-challenges',
      'personalized-content',
      'progress-celebration',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'class-schedule',
      'membership-plans',
      'trainer-profiles',
      'blog-wellness-tips',
      'contact',
      'join-now',
    ],
    customer: [
      'member-dashboard',
      'class-booking',
      'workout-log',
      'progress-tracker',
      'nutrition-log',
      'goal-dashboard',
      'trainer-messaging',
    ],
    admin: [
      'studio-dashboard',
      'member-management',
      'class-management',
      'trainer-scheduling',
      'billing-dashboard',
      'reports',
      'facility-management',
    ],
    staff: [
      'check-in-app',
      'class-management',
      'attendance-tracker',
      'trainer-tools',
      'equipment-check',
      'incident-reporting',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForFitnessWellness(),

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Energy-focused dashboard with workout summary hero',
      'Calendar-centric class scheduling with visual availability grid',
      'Progress visualization with charts and milestone celebrations',
      'Mobile-first design for on-the-go workout logging',
      'Split-screen for live class: video feed + workout stats overlay',
      'Dark mode option for low-light studio environments',
    ],
    color: [
      'Energetic primary: electric blue (#3B82F6) and vibrant orange (#F97316)',
      'Success green (#10B981) for completed workouts and goals met',
      'High-energy gradient accents for workout intensity zones',
      'Clean white backgrounds for readability during workout logging',
      'Alert red (#EF4444) for missed sessions and urgent notifications',
      'Soft purple (#8B5CF6) for wellness and meditation features',
    ],
    typography: [
      'Bold, energetic sans-serif (Inter or Poppins) for headers and CTAs',
      'Clean body text with generous spacing for workout readability',
      'Large, high-contrast numbers for timer and rep displays during workouts',
      'Monospace for workout timers and rep counters',
      'Playful weight variations for achievement badges and milestones',
    ],
    interaction: [
      'One-tap class booking with immediate confirmation',
      'Swipe gestures for workout navigation during live sessions',
      'Haptic feedback on rep completion in workout tracking',
      'Pull-to-refresh for class schedule updates',
      'Auto-play next workout in a series or circuit',
      'Quick-add workout entries with voice input support',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance for all interfaces',
      'Screen reader support for workout descriptions and class details',
      'High contrast mode for bright studio environments',
      'Keyboard navigation for all features (no mouse required)',
      'Closed captions and transcripts for all video content',
      'Colorblind-friendly workout intensity indicators (shape + color)',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role: Member (own data), Trainer (assigned clients), Instructor (class management), Admin (full studio), Corporate Manager (aggregate employee data). JWT with 8h expiry. Refresh tokens. MFA optional for members, required for trainers and admin. Single sign-on for corporate clients via SAML.',
    data: 'Health data from wearables, fitness assessments, and nutrition logs treated as sensitive. End-to-end encryption for health data. Member health data never shared without explicit consent. Data retention per member preference and regulatory requirements. Right-to-deletion supported.',
    compliance: ['HIPAA for health data (if applicable)', 'GDPR for EU members', 'PCI DSS for payment processing', 'Consumer protection for auto-renewal', 'Facility safety regulations'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Membership auto-renewal logic with 7-day cancellation window',
      'Class capacity enforcement with waitlist promotion',
      'No-show policy: 3 consecutive no-shows triggers restriction',
      'Trainer certification expiry detection and status update',
      'Workout plan progression rules (difficulty escalation)',
      'Commission calculation for corporate wellness billing',
      'Nutrition macro calculation from food database',
      'Refund proration for mid-cycle membership changes',
    ],
    integration: [
      'Wearable data sync → workout record creation → progress dashboard update',
      'Class booking → calendar notification → reminder → check-in → attendance logged',
      'Payment processing → membership activation → access granted → renewal billing',
      'Personal training session → workout plan delivery → progress tracking → feedback loop',
      'Corporate onboarding → employee enrollment → challenge creation → aggregate reporting',
      'Nutrition log entry → macro calculation → daily summary → weekly report',
    ],
    e2e: [
      'New member signup → trial activation → first class booking → attendance → membership conversion → regular booking pattern',
      'Personal training: assessment → plan creation → sessions → progress tracking → plan adjustment → goal achievement',
      'Corporate wellness: company signup → employee enrollment → wellness challenge → participation → aggregate reporting → renewal',
      'Instructor class management: schedule creation → member booking → class delivery → attendance → feedback → instructor rating',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForFitnessWellness(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForFitnessWellness(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForFitnessWellness(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForFitnessWellness(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForFitnessWellness(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForFitnessWellness(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForFitnessWellness(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForFitnessWellness(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForFitnessWellness(),
};

