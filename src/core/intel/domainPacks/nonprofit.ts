/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Nonprofit Domain Pack
 *
 * Complete nonprofit/charity management platform — from campaign creation to impact reporting.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForNonprofit(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'donation-platform',
      description: 'Platform enabling individuals to donate to causes with transparent impact tracking. Includes recurring donations, campaign pages, and donor engagement.',
      pricingExamples: ['Platform fee 2.5% + payment processing', 'Premium tier $199/month', 'Enterprise custom pricing', 'Zero-fee option for 501(c)(3) eligible orgs'],
    },
    {
      modelType: 'grant-management',
      description: 'Software for nonprofits to manage grant applications, track reporting requirements, and maintain donor relationships.',
      pricingExamples: ['Starter $49/month', 'Professional $149/month', 'Enterprise $499/month', 'Grant management add-on $50/month'],
    },
    {
      modelType: 'fundraising-events',
      description: 'Event fundraising platform for galas, charity runs, auctions, and peer-to-peer campaigns.',
      pricingExamples: ['Event ticket fee 3%', 'Platform subscription $99/month', 'Peer-to-peer campaign fee 4%', 'Custom event setup $500'],
    },
  ];
}

function revenueStreamsForNonprofit(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Donations',
      description: 'Revenue from individual and corporate donations processed through the platform.',
      pricingModel: 'platform-fee-percentage',
      examples: ['Platform fee 2.5%', 'Zero fee for 501(c)(3)', 'Payment processing 2.9% + $0.30'],
    },
    {
      name: 'Grant Funding',
      description: 'Revenue from foundation and government grants received by the nonprofit organization.',
      pricingModel: 'grant-amount',
      examples: ['Foundation grant $10,000-100,000', 'Government grant $50,000-500,000', 'Corporate CSR grant $5,000-50,000'],
    },
    {
      name: 'Membership Fees',
      description: 'Recurring membership dues from supporters who want ongoing engagement.',
      pricingModel: 'per-member-per-month',
      examples: ['Individual membership $10/month', 'Family membership $25/month', 'Student membership $5/month', 'Lifetime membership $500'],
    },
    {
      name: 'Event Ticket Sales',
      description: 'Revenue from fundraising events — galas, charity runs, auctions, and community events.',
      pricingModel: 'per-ticket',
      examples: ['Gala ticket $150-500', 'Charity run $35-75', 'Community event $25-100', 'VIP experience $200'],
    },
    {
      name: 'Corporate Sponsorships',
      description: 'Revenue from corporate sponsors providing financial support in exchange for branding and recognition.',
      pricingModel: 'per-sponsorship',
      examples: ['Title sponsor $25,000', 'Gold sponsor $10,000', 'Silver sponsor $5,000', 'Bronze sponsor $2,500'],
    },
    {
      name: 'Merchandise Sales',
      description: 'Revenue from branded merchandise sold to supporters — apparel, accessories, and awareness products.',
      pricingModel: 'per-unit markup',
      examples: ['T-shirt $25', 'Tote bag $20', 'Wristband $5', 'Donation mug $15'],
    },
  ];
}

function userRoleMatrixForNonprofit(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'donor',
      roleName: 'Donor',
      description: 'Individual or organization making donations to causes. Tracks impact, manages recurring donations, and receives communications.',
      permissions: ['make-donations', 'manage-recurring', 'view-impact', 'update-profile', 'opt-in-communications'],
      features: ['donation-form', 'impact-dashboard', 'receipt-management', 'donation-history', 'cause-discovery', 'tax-receipts'],
      constraints: ['donations non-refundable per platform policy', 'tax receipt issued for $250+', 'communication preferences respected'],
    },
    {
      roleId: 'volunteer',
      roleName: 'Volunteer',
      description: 'Community member offering time and skills. Signs up for assignments, tracks hours, and receives recognition.',
      permissions: ['view-opportunities', 'sign-up-for-tasks', 'log-hours', 'update-availability', 'view-training'],
      features: ['opportunity-browse', 'signup', 'schedule', 'hours-tracking', 'training-center', 'recognition-badges'],
      constraints: ['background check required for certain roles', 'minimum age 16 unaccompanied', 'cancellation 48h before assignment'],
    },
    {
      roleId: 'staff-member',
      roleName: 'Staff Member',
      description: 'Nonprofit employee managing programs, donor relations, volunteer coordination, and reporting.',
      permissions: ['manage-campaigns', 'coordinate-volunteers', 'process-donations', 'generate-reports', 'manage-communications'],
      features: ['campaign-management', 'volunteer-coordination', 'donor-crm', 'reporting', 'email-tools', 'grant-tracking'],
      constraints: ['donor data access limited to assigned relationships', 'financial actions dual-verified', 'campaign spending within approved budget'],
    },
    {
      roleId: 'grant-applicant',
      roleName: 'Grant Applicant',
      description: 'Nonprofit staff member applying for grants. Prepares applications, manages deadlines, and tracks reporting.',
      permissions: ['create-applications', 'manage-documents', 'submit-reports', 'track-deadlines', 'view-status'],
      features: ['application-builder', 'document-upload', 'report-generator', 'deadline-tracker', 'budget-template'],
      constraints: ['applications require director approval before submission', 'reporting deadlines hard stop', 'budget alignment required'],
    },
    {
      roleId: 'beneficiary',
      roleName: 'Beneficiary',
      description: 'Individual or community receiving services or aid from the nonprofit organization.',
      permissions: ['access-services', 'update-profile', 'request-assistance', 'view-services-available'],
      features: ['service-request', 'program-enrollment', 'resource-library', 'appointment-booking', 'community-forum'],
      constraints: ['services per eligibility criteria', 'personal data shared only with consent', 'case information private'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing organizations, users, campaigns, billing, and platform configuration.',
      permissions: ['*'],
      features: ['dashboard', 'organization-management', 'user-management', 'campaign-management', 'billing', 'reports', 'compliance'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', '501(c)(3) verification required for nonprofits'],
    },
  ];
}

function operationalWorkflowsForNonprofit(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'donate-to-impact',
      name: 'Donate to Impact',
      description: 'Donor discovers cause, makes donation, receives confirmation, and receives impact report on fund usage.',
      steps: ['cause-discovery', 'donation-selection', 'donor-details', 'payment-processing', 'donation-confirmed', 'tax-receipt-sent', 'funds-allocated', 'impact-report-sent'],
      entities: ['donor', 'campaign', 'donation', 'payment', 'impact-report'],
      triggers: ['donation-completed', 'funds-allocated', 'impact-reported'],
    },
    {
      workflowId: 'volunteer-to-assignment',
      name: 'Volunteer to Assignment',
      description: 'Volunteer discovers opportunities, signs up, completes training, checks in, and logs hours.',
      steps: ['opportunity-browse', 'sign-up', 'background-check', 'training-completed', 'assignment-check-in', 'volunteering', 'hours-logged', 'recognition-awarded'],
      entities: ['volunteer', 'opportunity', 'background-check', 'training', 'hours-log', 'recognition'],
      triggers: ['opportunity-available', 'sign-up-complete', 'training-complete', 'hours-logged'],
    },
    {
      workflowId: 'grant-apply-to-disburse',
      name: 'Grant Apply to Disburse',
      description: 'Nonprofit identifies grant opportunity, prepares application, submits, receives notification, and manages disbursement and reporting.',
      steps: ['opportunity-found', 'application-preparation', 'director-approval', 'submission', 'under-review', 'notification-received', 'agreement-signed', 'disbursement-received', 'funds-deployed', 'report-submitted'],
      entities: ['grant-opportunity', 'application', 'agreement', 'disbursement', 'report'],
      triggers: ['deadline-approaching', 'application-submitted', 'grant-awarded', 'disbursement-received', 'report-due'],
    },
    {
      workflowId: 'campaign-to-goal',
      name: 'Campaign to Goal',
      description: 'Campaign created, promoted, donations received, progress tracked, goal reached or extended, and impact reported.',
      steps: ['campaign-created', 'promotion-launched', 'donations-received', 'progress-tracked', 'milestone-reached', 'goal-reached', 'funds-deployed', 'impact-reported'],
      entities: ['campaign', 'donation', 'milestone', 'impact-report'],
      triggers: ['campaign-launched', 'milestone-reached', 'goal-met', 'impact-complete'],
    },
  ];
}

function stateMachinesForNonprofit(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Donation',
      states: ['pending', 'processing', 'completed', 'allocated', 'refunded', 'disputed'],
      transitions: { pending: ['processing'], processing: ['completed', 'failed'], allocated: ['refunded'] },
      initialState: 'pending',
      terminalStates: ['refunded', 'disputed'],
    },
    {
      entityName: 'Campaign',
      states: ['draft', 'active', 'paused', 'goal-reached', 'extended', 'completed', 'cancelled'],
      transitions: { draft: ['active'], active: ['paused', 'goal-reached', 'extended'], 'goal-reached': ['completed'], extended: ['goal-reached'] },
      initialState: 'draft',
      terminalStates: ['completed', 'cancelled'],
    },
    {
      entityName: 'VolunteerAssignment',
      states: ['open', 'filled', 'confirmed', 'checked-in', 'completed', 'cancelled', 'no-show'],
      transitions: { open: ['filled'], filled: ['confirmed'], confirmed: ['checked-in'], 'checked-in': ['completed'] },
      initialState: 'open',
      terminalStates: ['completed', 'cancelled', 'no-show'],
    },
    {
      entityName: 'Grant',
      states: ['draft', 'submitted', 'under-review', 'approved', 'agreement', 'disbursed', 'reporting', 'completed', 'rejected', 'withdrawn'],
      transitions: { draft: ['submitted'], submitted: ['under-review'], 'under-review': ['approved'], approved: ['agreement'], agreement: ['disbursed'], disbursed: ['reporting'], reporting: ['completed'] },
      initialState: 'draft',
      terminalStates: ['completed', 'rejected', 'withdrawn'],
    },
  ];
}

function edgeCasesForNonprofit(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Duplicate Donation Detection',
      description: 'Same donor accidentally submits multiple donations in rapid succession (double-click, payment retry) resulting in duplicate charges.',
      handling: 'Idempotent donation processing with donation request ID. Duplicate detection within 5-minute window: if same donor, same amount, same campaign, flagged as potential duplicate. Second donation held pending manual review. Donor notified via email.',
      recovery: 'If confirmed duplicate: automatic refund issued to original payment method within 24 hours. Donor notified with apology and explanation. Duplicate detection rules refined. Refund logged in financial records. Donor experience preserved with welcome-back gesture (e.g., impact report).',
    },
    {
      scenario: 'Fraudulent Campaign or Donation',
      description: 'Fraudulent campaign created by imposter or fraudulent donation made with stolen payment method.',
      handling: 'Automated fraud detection: unusual donation patterns, mismatched billing info, velocity checks. Campaign flagged for review within 1 hour of detection. Payment processor notified of potential fraud. Campaign frozen pending verification.',
      recovery: 'If confirmed fraudulent: campaign removed, donor accounts suspended, refunds issued, law enforcement notified if threshold met. Donor communications sent about fraud prevention. Enhanced verification implemented (phone verification for new accounts). Platform security reviewed.',
    },
    {
      scenario: 'Volunteer No-Show to Critical Assignment',
      description: 'Volunteer fails to show for a critical assignment (disaster relief, medical camp, community event) where their presence was essential.',
      handling: '24-hour reminder sent to volunteer. 2-hour confirmation request. If no response: backup volunteer automatically notified. Assignment coordinator alerted. Critical assignment coverage checked before event start.',
      recovery: 'Assignment covered by backup volunteer or staff. No-show logged in volunteer record. After 2 no-shows: 30-day signup restriction imposed. Volunteer contacted for reason and re-engagement. Assignment coverage procedures reviewed.',
    },
    {
      scenario: 'Grant Misuse Detection',
      description: 'Grant funds used for purposes outside the approved grant scope or funds misallocated between programs.',
      handling: 'Quarterly financial review flagged unusual spending pattern. Grant agreement terms checked against actual expenses. Audit trail reviewed for fund flow. Finance director notified. Corrective action plan requested.',
      recovery: 'If confirmed misuse: grant agreement amendment or funds clawback initiated. Corrective action plan required within 30 days. Enhanced reporting frequency imposed. Foundation notified per agreement terms. Internal controls strengthened.',
    },
  ];
}

function integrationsForNonprofit(): DomainPack['integrations'] {
  return [
    {
      name: 'Payment Processor',
      type: 'payment',
      description: 'Stripe, PayPal, or similar for donation processing with support for recurring donations and tax receipts.',
      required: true,
      configuration: 'Recurring donation billing with customizable frequency. Tax receipt generation for donations over $250. Receipt delivery via email and donor portal. PCI compliant donation form. Platform fee calculation per donation.',
    },
    {
      name: 'CRM Integration',
      type: 'crm',
      description: 'Salesforce Nonprofit Success Pack, HubSpot, or Bloomerang for donor relationship management.',
      required: false,
      configuration: 'Bidirectional sync: donor profiles, donation history, engagement tracking. Constituent record management. Campaign ROI tracking. Major donor identification and stewardship workflows.',
    },
    {
      name: 'Email Marketing',
      type: 'marketing',
      description: 'Mailchimp, SendGrid, or Constant Contact for donor newsletters, campaign updates, and event invitations.',
      required: false,
      configuration: 'Automated donation confirmation emails. Monthly impact newsletters. Event invitation campaigns. A/B testing for fundraising campaigns. Unsubscribe management per CAN-SPAM.',
    },
    {
      name: 'Accounting Software',
      type: 'financial',
      description: 'QuickBooks, Xero, or Sage Intacct for nonprofit accounting with fund accounting.',
      required: false,
      configuration: 'Fund accounting with restricted/unrestricted fund tracking. Donation categorization. Grant compliance reporting. P&L by program and fund. Audit-ready financial statements.',
    },
    {
      name: 'Volunteer Background Check',
      type: 'verification',
      description: 'Background check integration for volunteer screening, particularly for roles working with vulnerable populations.',
      required: false,
      configuration: 'API for criminal background, sex offender registry, and reference checks. Consent capture per FCRA. Result storage with retention policy. Expiration tracking and renewal reminders.',
    },
    {
      name: 'Event Management',
      type: 'events',
      description: 'Eventbrite, Cvent, or custom event platform for fundraising events with ticketing and check-in.',
      required: false,
      configuration: 'Event creation with ticket types and pricing. Attendee registration and check-in. Sponsorship management. Fundraising thermometer display. Silent auction functionality.',
    },
  ];
}

function technicalArchitectureForNonprofit(): TechnicalArchitectureDef {
  return {
    patterns: ['Event-driven donation processing with idempotency', 'Impact tracking and reporting with aggregation pipelines', 'Donor segmentation and personalization engine', 'Grant lifecycle management with compliance tracking', 'Volunteer scheduling with capacity management'],
    infrastructure: ['PostgreSQL for donor, donation, and campaign data', 'S3-compatible storage for documents and impact photos', 'Redis for donation cache and campaign progress', 'Elasticsearch for donor search and campaign discovery', 'SendGrid or similar for email delivery', 'Stripe or similar for payment processing'],
    dataFlow: 'Donor discovers campaign → makes donation → payment processed → donation recorded → funds allocated to program → impact tracked → donor receives receipt and impact update → campaign progress updated → nonprofit generates reports for stakeholders → grant applications prepared with impact data.',
    scalability: 'Donation spikes during campaigns handled via Redis caching and database connection pooling. Email delivery via SendGrid with rate limiting. Impact reporting computed in batches during off-peak hours. Campaign progress bars updated in real-time via WebSocket. Grant reporting generated on-demand with pre-aggregated data.',
  };
}

function regulatoryComplianceForNonprofit(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: '501(c)(3) Tax-Exempt Requirements',
      jurisdiction: 'United States (IRS)',
      requirements: ['Annual Form 990 filing', 'Political activity prohibition', 'Private benefit restrictions', 'Unrelated business income tax (UBIT)', 'Public charity status maintenance'],
      impact: 'Platform generates Form 990 data exports. Campaign spending tracked per program vs administrative ratio requirements. Political activity flags for any advocacy communications. UBIT calculation for unrelated revenue streams.',
    },
    {
      regulation: 'Donor Privacy (CAN-SPAM / state laws)',
      jurisdiction: 'United States',
      requirements: ['Physical address in all communications', 'Clear unsubscribe mechanism', 'Donor anonymity options', 'Data sharing restrictions', 'Fundraising solicitation registration per state'],
      impact: 'Email templates include required footer with physical address and unsubscribe link. Donor anonymity levels configurable. Data sharing agreements with partners for fundraising. State fundraising registration tracked per state.',
    },
    {
      regulation: 'FCRA (Background Checks)',
      jurisdiction: 'United States',
      requirements: ['Written consent for background checks', 'Adverse action notice for disqualifying results', 'Report retention limits', 'Disclosure of reporting purpose'],
      impact: 'Volunteer background check workflow includes FCRA-compliant consent capture. Adverse action process documented and automated. Background check reports stored with retention policy enforcement.',
    },
    {
      regulation: 'Grant Reporting Requirements',
      jurisdiction: 'Per-grantor',
      requirements: ['Program-specific financial reporting', 'Outcome measurement documentation', 'Site visit preparation', 'Budget reconciliation', 'Expense documentation'],
      impact: 'Grant reporting module generates funder-required reports. Expense tracking per grant line item. Outcome measurement data collection. Automated reminders for reporting deadlines.',
    },
  ];
}

function businessRulesForNonprofit(): string[] {
  return [
    'Donation receipt issued automatically for donations over $250 for tax purposes. Annual summary statement sent to all donors.',
    'Recurring donation: minimum $5/month. Change frequency or cancel anytime. Failed payments retried 3 times before cancellation.',
    'Campaign goal: once reached, campaign can be extended by admin. Donations accepted beyond goal with overflow to general fund.',
    'Volunteer background check: required for roles involving minors or vulnerable populations. Check valid for 2 years, then renewal required.',
    'Grant budget: expenses cannot exceed approved grant amount without amendment. Unexpended funds returned per agreement terms.',
    'Event capacity: maximum attendees per venue fire code. Waitlist automatically fills from cancellations. Ticket sales close 24h before event.',
    'Fundraising ratio: administrative costs must remain below 35% of total expenses per public charity requirements.',
  ];
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const NONPROFIT_PACK: DomainPack = {
  domain: 'nonprofit',
  name: 'Nonprofit & Charity Management',
  description: 'Complete nonprofit/charity management platform — from campaign creation to impact reporting. Covers donation processing with recurring giving, volunteer management, grant application and tracking, fundraising events, donor CRM, compliance with 501(c)(3) and donor privacy regulations, and impact measurement.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Donations', 'Volunteering', 'Grants', 'Fundraising Events', 'Impact Reporting', 'Donor Management'],
    features: [
      'recurring-donations',
      'campaign-pages',
      'peer-to-peer-fundraising',
      'grant-tracking',
      'volunteer-management',
      'impact-measurement',
      'tax-receipts',
      'donor-recognition',
      'event-fundraising',
      'corporate-sponsorships',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['online-donation', 'event-ticketing', 'in-kind-donation', 'volunteer-service', 'grant-disbursement'],
    features: [
      'recurring-giving',
      'donation-form',
      'ticketing',
      'fundraising-goals',
      'tax-receipt-generation',
      'bulk-donation-processing',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'donor-dashboard',
      'impact-reporting',
      'donation-history',
      'tax-receipts',
      'cause-discovery',
      'volunteer-signup',
      'event-registration',
      'membership-management',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'donor-crm',
      'campaign-management',
      'volunteer-coordination',
      'grant-tracking',
      'event-management',
      'reporting',
      'email-communication',
      'fund-accounting',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'storytelling',
      'impact-photos',
      'volunteer-spotlight',
      'donor-recognition-wall',
      'news-updates',
      'transparency-reports',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'campaigns',
      'donate',
      'volunteer',
      'events',
      'impact-reports',
      'about',
      'contact',
    ],
    customer: [
      'donor-dashboard',
      'donation-history',
      'impact-report',
      'tax-receipts',
      'volunteer-hours',
      'event-tickets',
    ],
    admin: [
      'dashboard',
      'campaign-management',
      'donor-management',
      'volunteer-management',
      'grant-tracking',
      'event-management',
      'financial-reports',
    ],
    staff: [
      'donation-processing',
      'volunteer-checkin',
      'event-management',
      'communication-tools',
      'report-builder',
      'fund-accounting',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForNonprofit() as unknown as BusinessRulesSpec,

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Emotionally resonant hero with cause imagery and prominent donation button',
      'Impact metric bar showing dollars raised, people helped, and progress toward goal',
      'Clean donation form with suggested amounts and impact descriptions per tier',
      'Grid layout for campaign stories with photo-first cards',
      'Transparent financial reporting section with budget breakdown',
      'Mobile-first for on-the-go giving and volunteer signup',
    ],
    color: [
      'Cause-specific palette: blue for water, green for environment, orange for hunger, purple for education',
      'Warm accent colors for CTAs and donation buttons',
      'White and light backgrounds for readability',
      'Progress bar colors matching cause theme',
      'Gold/yellow for achievement badges and recognition',
      'Trust-building gray for financial transparency sections',
    ],
    typography: [
      'Warm, approachable sans-serif (Poppins or Nunito) for headers',
      'Clean sans-serif for body and data',
      'Large, prominent donation amounts and impact numbers',
      'Emotional storytelling typography with generous line height',
      'Clear hierarchy: cause → impact → action button',
    ],
    interaction: [
      'One-tap donation with preset amounts and custom option',
      'Progress bar animation as donations are received',
      'Impact counter with real-time update on donation completion',
      'Volunteer signup with calendar picker and time slot selection',
      'Peer-to-peer fundraising page builder with preview',
      'Share buttons for social media campaign promotion',
      'Fundraising thermometer animation',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance for all pages',
      'Screen reader support for donation forms and impact reports',
      'High contrast for outdoor event visibility',
      'Keyboard navigation for all donation and signup flows',
      'Multi-language support for diverse donor base',
      'Video captions for storytelling content',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Donor (donations, impact viewing), Volunteer (opportunities, hours tracking), Staff Member (campaigns, donor relations), Grant Applicant (applications, reporting), Beneficiary (service access), Admin (full platform). JWT with 8h expiry. Refresh tokens with 30d. MFA for admin and financial operations.',
    data: 'Donor data includes personal information, donation history, and tax receipts. Volunteer data includes personal information and background check results. Beneficiary data includes service records and eligibility information. PCI DSS compliant donation processing. Donor data protected per privacy regulations.',
    compliance: ['501(c)(3) tax-exempt requirements', 'Donor privacy (CAN-SPAM, state laws)', 'FCRA for background checks', 'Grant reporting compliance per funder', 'Fundraising registration per state', 'Financial transparency requirements'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Donation idempotency: duplicate detection within 5-minute window',
      'Tax receipt generation for donations over $250',
      'Volunteer no-show threshold: 2 no-shows = 30-day restriction',
      'Campaign goal overflow: donations accepted beyond goal',
      'Grant budget enforcement: expenses cannot exceed approved amount',
      'Recurring donation retry logic (3 attempts before cancellation)',
      'Event capacity management with waitlist',
      'Fund accounting: restricted vs unrestricted fund allocation',
    ],
    integration: [
      'Donation → payment → receipt → impact allocation → report generation',
      'Volunteer signup → background check → training → assignment → hours logged',
      'Campaign creation → promotion → donations received → progress updated → goal reached',
      'Grant application → submission → notification → disbursement → reporting',
      'Email campaign → open tracking → click tracking → donation attribution',
      'Event creation → ticket sales → check-in → fundraising total → post-event report',
    ],
    e2e: [
      'Donor journey: discover cause → donate → receive receipt → view impact report',
      'Volunteer journey: browse opportunities → sign up → background check → training → assignment → hours logged',
      'Fundraising event: create event → sell tickets → check-in → fundraising → post-event report',
      'Grant lifecycle: find opportunity → prepare application → submit → notification → disbursement → report',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForNonprofit(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForNonprofit(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForNonprofit(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForNonprofit(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForNonprofit(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForNonprofit(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForNonprofit(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForNonprofit(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForNonprofit(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const NONPROFIT_DOMAIN: DomainModel = {
  id: NONPROFIT_PACK.domain,
  domain: NONPROFIT_PACK.domain,
  name: NONPROFIT_PACK.name,
  label: NONPROFIT_PACK.name,
  category: 'nonprofit',
  description: NONPROFIT_PACK.description,
  userRoles: [
    { id: 'donor', name: 'Donor', typicalFeatures: ['donation-form', 'impact-dashboard', 'donation-history', 'tax-receipts'], permissions: ['make-donations', 'manage-recurring', 'view-impact', 'update-profile'] },
    { id: 'volunteer', name: 'Volunteer', typicalFeatures: ['opportunity-browse', 'signup', 'hours-tracking', 'training-center'], permissions: ['view-opportunities', 'sign-up-for-tasks', 'log-hours', 'update-availability'] },
    { id: 'staff-member', name: 'Staff Member', typicalFeatures: ['campaign-management', 'volunteer-coordination', 'donor-crm', 'reporting'], permissions: ['manage-campaigns', 'coordinate-volunteers', 'process-donations', 'generate-reports'] },
    { id: 'grant-applicant', name: 'Grant Applicant', typicalFeatures: ['application-builder', 'document-upload', 'report-generator', 'deadline-tracker'], permissions: ['create-applications', 'manage-documents', 'submit-reports', 'track-deadlines'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'organization-management', 'campaign-management', 'billing'], permissions: ['*'] },
  ],
  role: 'donor',
  standardFeatures: [],
  businessModels: [
    { modelType: 'donation-platform', revenueStreams: ['platform-fees', 'premium-subscriptions', 'merchandise'], costStructure: ['payment-processing', 'cloud-infrastructure', 'engineering', 'customer-support'], pricingStrategy: ['percentage-fee', 'subscription-monthly', 'zero-fee-option'] },
    { modelType: 'grant-management', revenueStreams: ['subscription-fees', 'add-on-modules', 'training-services'], costStructure: ['development', 'compliance-research', 'support', 'infrastructure'], pricingStrategy: ['tiered-subscription', 'per-grant-fee', 'enterprise'] },
    { modelType: 'fundraising-events', revenueStreams: ['ticket-fees', 'platform-subscriptions', 'merchandise', 'sponsorship-matching'], costStructure: ['platform-development', 'payment-processing', 'event-tools', 'support'], pricingStrategy: ['percentage-ticket', 'subscription', 'setup-fee'] },
  ],
  technicalPatterns: [
    { category: 'payment', name: 'Idempotent Donation Processing', description: 'Duplicate-safe donation processing with request ID tracking', rationale: 'Prevents duplicate charges from payment retries and double-clicks' },
    { category: 'analytics', name: 'Impact Measurement Engine', description: 'Aggregation pipelines computing impact metrics per dollar donated', rationale: 'Transparency and accountability require precise impact quantification' },
    { category: 'email', name: 'Donor Communication Engine', description: 'Segmented email campaigns based on donation history and engagement', rationale: 'Personalized communication improves donor retention and recurring giving' },
    { category: 'reporting', name: 'Grant Compliance Reporting', description: 'Automated report generation per funder requirements with expense tracking', rationale: 'Grant compliance requires consistent, auditable reporting' },
  ],
  operationalLifecycle: [
    { id: 'discover', name: 'Discover', description: 'Donor discovers cause and organization through platform' },
    { id: 'engage', name: 'Engage', description: 'Donor makes donation, signs up for events, or volunteers' },
    { id: 'impact', name: 'Impact', description: 'Donation deployed, volunteer hours logged, impact measured' },
    { id: 'report', name: 'Report', description: 'Impact reported back to donor, compliance reports generated' },
  ],
  designPrinciples: [
    { name: 'Transparency First', description: 'Clear financial breakdowns, impact per dollar, and fund allocation visible to all' },
    { name: 'Emotional Connection', description: 'Storytelling and impact photography to build donor connection' },
    { name: 'Action-Oriented', description: 'Clear donation CTAs, easy volunteer signup, prominent sharing buttons' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Donor data protection', description: 'Donor personal and financial data encrypted', severity: 'high' },
    { category: 'compliance', name: '501(c)(3) compliance', description: 'Tax-exempt requirements tracked', severity: 'medium' },
    { category: 'compliance', name: 'Donor privacy', description: 'CAN-SPAM and state privacy laws', severity: 'high' },
    { category: 'compliance', name: 'FCRA background checks', description: 'Volunteer screening compliance', severity: 'medium' },
  ],
  regulations: [
    { name: '501(c)(3)', requirements: ['Annual Form 990', 'Political activity prohibition', 'Private benefit restrictions'] },
    { name: 'Donor Privacy', requirements: ['Unsubscribe mechanism', 'Physical address', 'Data sharing restrictions'] },
    { name: 'FCRA', requirements: ['Consent for checks', 'Adverse action notices', 'Retention limits'] },
    { name: 'Grant Reporting', requirements: ['Financial reporting', 'Outcome measurement', 'Budget reconciliation'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Donation idempotency', description: 'Duplicate detection and prevention', priority: 'high' },
    { category: 'unit', name: 'Fund accounting', description: 'Restricted vs unrestricted allocation', priority: 'high' },
    { category: 'integration', name: 'Donation to impact flow', description: 'Payment → allocation → impact report', priority: 'high' },
    { category: 'e2e', name: 'Donor journey', description: 'Discover → donate → receive receipt → view impact', priority: 'medium' },
  ],
  workflows: [
    { id: 'donate-to-impact', name: 'Donate to Impact', steps: ['discover', 'donate', 'confirm', 'allocate', 'impact'], entities: ['donor', 'campaign', 'donation', 'impact-report'] },
    { id: 'volunteer-to-assignment', name: 'Volunteer to Assignment', steps: ['browse', 'signup', 'check', 'train', 'assign', 'log'], entities: ['volunteer', 'opportunity', 'hours-log'] },
    { id: 'campaign-to-goal', name: 'Campaign to Goal', steps: ['create', 'promote', 'donate', 'track', 'reach', 'report'], entities: ['campaign', 'donation', 'milestone'] },
  ],
  entities: [
    { name: 'Donation', description: 'Donation record with amount, donor, campaign, and allocation', invariants: ['duplicate-safe processing', 'receipt for $250+'] },
    { name: 'Campaign', description: 'Fundraising campaign with goal, progress, and impact tracking', invariants: ['goal can be extended', 'donations allocated on receipt'] },
    { name: 'VolunteerAssignment', description: 'Volunteer assignment with hours logged and background check status', invariants: ['background check for vulnerable populations', 'hours verified by supervisor'] },
  ],
  invariants: ['donations processed idempotently', 'tax receipt for $250+ donations', 'volunteer background check for sensitive roles', 'campaign spending tracked per fund accounting'],
  constraints: ['minimum recurring donation $5/month', 'volunteer cancellation 48h before', 'event capacity per fire code', 'campaign goal extendable by admin', 'fundraising ratio <35% admin costs'],
  financialFlows: [
    { name: 'donation', direction: 'in', trigger: 'donation-completed' },
    { name: 'grant-funding', direction: 'in', trigger: 'grant-disbursement-received' },
    { name: 'membership-fee', direction: 'in', trigger: 'monthly-membership-payment' },
    { name: 'program-expense', direction: 'out', trigger: 'program-spending-approved' },
    { name: 'grant-disbursement', direction: 'out', trigger: 'grant-program-funded' },
  ],
  successMetrics: ['total-donations', 'donor-retention-rate', 'recurring-donor-percentage', 'volunteer-engagement-rate', 'campaign-success-rate', 'fundraising-efficiency-ratio', 'grant-success-rate'],
  analytics: { tracked: ['donations', 'donor-segments', 'campaign-performance', 'volunteer-hours', 'grant-outcomes', 'event-attendance'], dashboards: ['donor-dashboard', 'campaign-dashboard', 'volunteer-dashboard', 'financial-dashboard'] },
  securityRequirements: ['jwt-auth', 'pci-compliance', 'donor-data-encryption', 'background-check-compliance', 'audit-logging'],
  regulatory: [
    { regulation: '501(c)(3)', applies: true, notes: 'Tax-exempt compliance tracking' },
    { regulation: 'Donor Privacy', applies: true, notes: 'CAN-SPAM and state laws' },
    { regulation: 'FCRA', applies: true, notes: 'Volunteer background checks' },
    { regulation: 'Grant Reporting', applies: true, notes: 'Per-grantor requirements' },
  ],
};
