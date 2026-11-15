/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Event Management Domain Pack
 *
 * Complete event planning and management platform — from event creation to attendee check-in and post-event analytics.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';


















// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForEventManagement(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'event-ticketing-platform',
      description: 'Self-service platform for event creators to create, promote, and sell tickets for events. Handles ticketing, registration, check-in, and basic event management.',
      pricingExamples: ['2% + $0.79 per ticket sold (basic)', '0.5% + $0.25 per ticket sold (premium)', '$49/month organizer subscription', '$199/month enterprise with custom branding', 'Free for free events'],
    },
    {
      modelType: 'event-planning-services',
      description: 'Full-service event planning agency platform managing end-to-end event production for corporate, social, and nonprofit clients.',
      pricingExamples: ['15-20% of event budget as planning fee', '$5,000 minimum corporate event', '$2,500 minimum social event', '$1,500/day event coordinator', 'Venue sourcing fee 10% of contract value'],
    },
    {
      modelType: 'venue-management-platform',
      description: 'Platform for venue owners to list, manage bookings, and operate their event spaces. Includes booking engine, calendar management, and venue operations.',
      pricingExamples: ['$99/month per venue listing', '5% booking fee on venue rentals', '$49/month venue management tools', '$199/month premium analytics', 'Custom pricing for venue chains'],
    },
  ];
}

function revenueStreamsForEventManagement(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Ticketing Fees',
      description: 'Platform fees collected on ticket sales — percentage plus fixed fee per ticket.',
      pricingModel: 'percentage-plus-fixed-per-ticket',
      examples: ['2% + $0.79/ticket basic', '0.5% + $0.25/ticket premium', 'Free for free events', 'Custom enterprise pricing'],
    },
    {
      name: 'Organizer Subscriptions',
      description: 'Monthly subscription fees from event organizers for premium features, custom branding, and analytics.',
      pricingModel: 'per-month-per-organizer',
      examples: ['$49/month basic organizer', '$149/month professional', '$299/month enterprise', '$99/month per additional organizer seat'],
    },
    {
      name: 'Service Fees (Event Planning)',
      description: 'Planning and coordination fees for full-service event management.',
      pricingModel: 'percentage-of-budget or flat-fee',
      examples: ['15-20% of event budget', '$5,000 minimum corporate', '$2,500 minimum social event', '$1,500/day coordinator'],
    },
    {
      name: 'Venue Booking Commission',
      description: 'Commission on venue bookings made through the platform.',
      pricingModel: 'percentage-of-booking-value',
      examples: ['10% venue sourcing fee', '5% platform booking fee', '$199/month venue listing fee'],
    },
    {
      name: 'Add-On Services',
      description: 'Additional services sold through the platform: streaming, access control, F&B ordering, merchandise printing.',
      pricingModel: 'per-unit or subscription',
      examples: ['$199 virtual event streaming', '$299 access control system', '$0.50 per F&B order processed', '$49/month merchandise integration'],
    },
    {
      name: 'Sponsorship Marketplace',
      description: 'Commission on sponsorship deals brokered through the platform matching sponsors with events.',
      pricingModel: 'percentage-of-sponsorship-deal',
      examples: ['10% commission on sponsorship', '$99/month sponsor listing', '$499/month premium sponsor matching'],
    },
  ];
}

function userRoleMatrixForEventManagement(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'attendee',
      roleName: 'Attendee',
      description: 'Individual who registers for and attends events. Browses events, purchases tickets, checks in, and provides feedback.',
      permissions: ['browse-events', 'purchase-tickets', 'manage-tickets', 'check-in', 'provide-feedback', 'view-schedule'],
      features: ['event-browse', 'ticket-purchase', 'ticket-wallet', 'event-schedule', 'check-in-qr', 'feedback-form', 'networking'],
      constraints: ['can only access own tickets and events', 'ticket transfer limited to event policy', 'refund subject to event refund policy', 'check-in only valid on event date'],
    },
    {
      roleId: 'organizer',
      roleName: 'Event Organizer',
      description: 'Individual or organization creating and managing events. Configures event details, manages tickets, views analytics, and communicates with attendees.',
      permissions: ['create-events', 'manage-tickets', 'view-analytics', 'send-communications', 'manage-schedule', 'process-refunds'],
      features: ['event-builder', 'ticket-management', 'attendee-management', 'analytics-dashboard', 'email-campaigns', 'check-in-tools'],
      constraints: ['platform fees apply to ticket sales', 'refund policy must comply with local laws', 'payouts subject to verification', 'content must comply with community guidelines'],
    },
    {
      roleId: 'venue-owner',
      roleName: 'Venue Owner',
      description: 'Owner or manager of an event venue listing their space, managing bookings, and coordinating with event organizers.',
      permissions: ['manage-venue', 'set-availability', 'process-bookings', 'view-reports', 'manage-pricing'],
      features: ['venue-listing', 'calendar-management', 'booking-management', 'pricing-control', 'venue-analytics', 'vendor-management'],
      constraints: ['venue must pass safety inspection', 'pricing subject to platform commission', 'cancellation policy enforced', 'capacity limits strictly enforced'],
    },
    {
      roleId: 'vendor',
      roleName: 'Vendor',
      description: 'Service provider offering catering, AV, decoration, photography, and other event services.',
      permissions: ['manage-services', 'accept-bookings', 'manage-portfolio', 'view-calendar', 'send-invoices'],
      features: ['service-listings', 'booking-management', 'portfolio', 'calendar', 'invoicing', 'vendor-ratings'],
      constraints: ['certifications and insurance verified', 'platform commission on bookings', 'service quality monitored via ratings', 'cancellation policy enforced'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Platform administrator managing users, events, venues, disputes, and platform configuration.',
      permissions: ['manage-users', 'moderate-content', 'resolve-disputes', 'view-platform-analytics', 'configure-platform', 'process-refunds'],
      features: ['admin-dashboard', 'user-management', 'content-moderation', 'dispute-resolution', 'platform-analytics', 'financial-reports'],
      constraints: ['all moderation actions logged', 'refunds above $500 require secondary approval', 'user data access for moderation only', 'platform terms enforcement'],
    },
    {
      roleId: 'staff',
      roleName: 'Event Staff',
      description: 'On-site event personnel including check-in staff, ushers, security, and event coordinators.',
      permissions: ['check-in-attendees', 'view-event-schedule', 'report-issues', 'scan-tickets', 'assist-attendees'],
      features: ['check-in-app', 'event-schedule', 'attendee-lookup', 'issue-reporting', 'qr-scanner', 'announcements'],
      constraints: ['event-specific access only', 'data access limited to assigned event', 'PII redacted in attendee lists', 'check-in actions logged'],
    },
  ];
}

function operationalWorkflowsForEventManagement(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'create-to-promote',
      name: 'Create to Promote',
      description: 'Event creator designs event, configures tickets, sets up registration, and launches promotional campaigns.',
      steps: ['event-concept', 'event-creation', 'venue-selection', 'ticket-configuration', 'schedule-building', 'branding-design', 'marketing-setup', 'campaign-launch', 'early-bird-monitoring'],
      entities: ['event', 'venue', 'ticket-type', 'schedule-session', 'campaign', 'promotion'],
      triggers: ['event-created', 'tickets-published', 'campaign-launched', 'early-bird-ended'],
    },
    {
      workflowId: 'register-to-attend',
      name: 'Register to Attend',
      description: 'Attendee discovers event, registers, receives tickets, checks in at venue, and participates.',
      steps: ['event-discovery', 'ticket-selection', 'registration', 'payment', 'ticket-delivery', 'pre-event-reminders', 'venue-directions', 'qr-check-in', 'event-participation', 'session-attendance'],
      entities: ['event', 'ticket', 'attendee', 'registration', 'check-in', 'session'],
      triggers: ['registration-complete', 'payment-confirmed', 'ticket-sent', 'check-in-complete'],
    },
    {
      workflowId: 'vendor-to-service',
      name: 'Vendor to Service',
      description: 'Vendor discovers event opportunity, submits proposal, gets booked, delivers service, and receives payment.',
      steps: ['event-listing-browse', 'proposal-submission', 'organizer-review', 'booking-confirmation', 'pre-event-coordination', 'service-delivery', 'quality-confirmation', 'invoice-generation', 'payment-receipt'],
      entities: ['event', 'vendor', 'proposal', 'booking', 'service-order', 'invoice', 'payment'],
      triggers: ['proposal-submitted', 'booking-confirmed', 'service-complete', 'invoice-sent', 'payment-received'],
    },
    {
      workflowId: 'feedback-to-improve',
      name: 'Feedback to Improve',
      description: 'Post-event feedback collected from attendees, analyzed, insights generated, and improvements applied to future events.',
      steps: ['post-event-survey', 'feedback-collection', 'sentiment-analysis', 'insight-generation', 'report-creation', 'improvement-planning', 'follow-up-communication', 'next-event-application'],
      entities: ['event', 'survey', 'feedback', 'insight', 'report', 'improvement'],
      triggers: ['event-ended', 'survey-sent', 'feedback-received', 'report-generated'],
    },
  ];
}

function stateMachinesForEventManagement(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Event',
      states: ['draft', 'published', 'open-for-registration', 'sold-out', 'in-progress', 'completed', 'cancelled', 'postponed'],
      transitions: { draft: ['published'], published: ['open-for-registration'], 'open-for-registration': ['in-progress'], 'in-progress': ['completed'], cancelled: ['postponed'], postponed: ['published'] },
      initialState: 'draft',
      terminalStates: ['completed', 'cancelled'],
    },
    {
      entityName: 'Ticket',
      states: ['reserved', 'purchased', 'transferred', 'checked-in', 'refunded', 'expired'],
      transitions: { reserved: ['purchased'], purchased: ['transferred'], 'checked-in': ['archived'], refunded: ['archived'], expired: ['archived'] },
      initialState: 'reserved',
      terminalStates: ['archived'],
    },
    {
      entityName: 'Registration',
      states: ['draft', 'pending-payment', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'no-show'],
      transitions: { draft: ['pending-payment'], 'pending-payment': ['confirmed'], confirmed: ['attended'], waitlisted: ['confirmed'] },
      initialState: 'draft',
      terminalStates: ['attended', 'no-show', 'cancelled'],
    },
  ];
}

function edgeCasesForEventManagement(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Event Cancellation (Organizer-Initiated)',
      description: 'Event organizer cancels an event days or hours before the scheduled date, leaving hundreds or thousands of ticket holders without their expected experience.',
      handling: 'Automatic notification cascade: email, SMS, and push notification to all registered attendees. Refund initiated automatically per platform refund policy. Attendee retention survey offered. Venue and vendor cancellation procedures triggered automatically.',
      recovery: 'Full or partial refunds processed within 3-5 business days. Attendees offered priority access to organiser\'s next event. Venue rescheduling attempted if possible. Vendor contracts reviewed for cancellation terms. Organizer platform standing updated; repeat cancellations trigger review or suspension.',
    },
    {
      scenario: 'Overcapacity at Venue (Fire Code)',
      description: 'More attendees show up than the venue\'s fire-code maximum capacity, creating a serious safety liability.',
      handling: 'Real-time headcount via check-in system compared against fire-code capacity. When at 90% capacity, platform alerts event staff. At capacity, registration closed, waitlist activated. Turned-away attendees offered: (1) live stream access if available, (2) refund, (3) priority for next event.',
      recovery: 'Post-event: compliance report generated documenting capacity management. If overcapacity occurred, incident report filed with venue owner. Future events: tighter capacity buffers, improved check-in speed (mobile + express lanes). Legal review of liability if incident occurred.',
    },
    {
      scenario: 'Speaker / Performer Cancellation',
      description: 'A keynote speaker, headlining performer, or critical event participant cancels with little or no notice, potentially making the event unviable.',
      handling: 'Speaker\'s sessions automatically flagged in schedule. Backup speakers identified and contacted. Session replaced with panel discussion, Q&A, or networking activity. Attendees notified of schedule change via app and venue screens.',
      recovery: 'If no suitable replacement: partial refund option offered for affected ticket tier. Event content repositioned. Speaker contract reviewed for cancellation clauses and penalties. Future events: speaker backup contracts and higher cancellation insurance.',
    },
    {
      scenario: 'Technical Failure During Event',
      description: 'Critical AV failure, internet outage, streaming platform crash, or registration system failure during an active event.',
      handling: 'Event tech team notified immediately. Backup systems activated (backup streaming encoder, offline registration mode, printed check-in lists). Venue announcements made for in-person attendees. Virtual attendees notified via email, social media, and status page.',
      recovery: 'Post-event: technical incident report generated. Service credits issued for affected attendees or organizers. Vendors reviewed for performance. Streaming platform SLA review. Future events: redundant systems, backup internet connections, offline contingency plans.',
    },
    {
      scenario: 'Security Incident at Event',
      description: 'Unauthorized access, altercation, medical emergency, or other security concern during an event requiring immediate response.',
      handling: 'Security team notified via dedicated incident channel in staff app. Emergency services called if needed. Affected areas secured. Attendee notification via venue PA, app push, and SMS if mass evacuation needed. Incident logged with timestamp, location, and response actions.',
      recovery: 'Post-incident: full incident report compiled with timeline and actions taken. Medical or security follow-up as required. Insurance claim initiated if applicable. Review of security protocols and staffing levels for future events. Communication to affected attendees with appropriate follow-up.',
    },
  ];
}

function integrationsForEventManagement(): DomainPack['integrations'] {
  return [
    {
      name: 'Payment Processing',
      type: 'financial',
      description: 'Stripe, PayPal, or equivalent for ticket sales, vendor payments, and refund processing.',
      required: true,
      configuration: 'Stripe Connect for marketplace payouts to organizers and vendors. Ticket purchase flow with saved payment methods. Refund processing within 3-5 business days. Payout schedules configurable per organizer. Tax calculation per ticket jurisdiction.',
    },
    {
      name: 'Venue Booking Systems',
      type: 'service',
      description: 'Integration with venue management systems for real-time availability, capacity checks, and booking confirmation.',
      required: false,
      configuration: 'Two-way calendar sync with venue booking system. Real-time availability API. Capacity enforcement at registration. Venue layout integration for seating charts. Contract generation upon booking.',
    },
    {
    name: 'Live Streaming Platform',
      type: 'infrastructure',
      description: 'Integration with streaming platforms for hybrid and virtual events with real-time engagement features.',
      required: false,
      configuration: 'RTMP stream ingestion for event broadcast. Virtual event platform with breakout rooms, Q&A, polls, and networking. Recording auto-saved to cloud. Streaming analytics (viewer count, engagement).',
    },
    {
      name: 'Access Control Systems',
      type: 'hardware',
      description: 'Integration with physical access control, turnstile, and RFID/NFC check-in systems at venues.',
      required: false,
      configuration: 'QR code and NFC ticket validation at entry gates. Real-time attendee count vs. capacity. VIP and staff access zone mapping. Badge printing integration. Emergency egress reporting.',
    },
    {
      name: 'Email & SMS Notifications',
      type: 'communication',
      description: 'Transactional and marketing communication for event reminders, updates, and attendee engagement.',
      required: true,
      configuration: 'SendGrid or equivalent for email. Twilio for SMS. Event reminder schedule: 1 week, 1 day, 1 hour before. Schedule change notifications. Post-event thank you and feedback request. Marketing opt-in management.',
    },
    {
      name: 'Analytics & Business Intelligence',
      type: 'data',
      description: 'Event analytics, attendee behavior tracking, and business intelligence dashboards for organizers.',
      required: false,
      configuration: 'Attendee journey tracking: discovery → registration → attendance → engagement → feedback. Sales funnel analytics. Ticket sales velocity. Attendee demographic analysis. Post-event ROI calculation for organizers.',
    },
  ];
}

function technicalArchitectureForEventManagement(): TechnicalArchitectureDef {
  return {
    patterns: ['Ticket inventory with optimistic locking for high-demand events', 'Real-time attendee count vs. capacity enforcement', 'Event-driven notification system for reminders and updates', 'CDN-based asset delivery for event media and virtual streaming', 'Queue-based registration processing for flash sales'],
    infrastructure: ['PostgreSQL for event data, registrations, and orders', 'Redis for ticket inventory caching and rate limiting', 'S3-compatible storage for event media (images, videos, recordings)', 'Kafka for event notifications and registration events', 'Elasticsearch for event search and discovery', 'CloudFront/CDN for event page and media delivery'],
    dataFlow: 'Organizer creates event → event published → attendee discovers via search → ticket reserved (Redis) → payment processed → ticket confirmed (PostgreSQL) → reminder notifications scheduled (Kafka) → attendee checks in (QR scan) → attendance logged → post-event survey sent → feedback collected → analytics updated.',
    scalability: 'High-demand event registration handled via Redis-backed ticket inventory with queue-based processing. Virtual event streaming via CDN with edge caching. Search via Elasticsearch with synonym and suggestion support. Registration bursts handled with auto-scaling API servers.',
  };
}

function regulatoryComplianceForEventManagement(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'Fire Code & Occupancy Regulations',
      jurisdiction: 'Local (per venue)',
      requirements: ['Maximum occupancy enforcement', 'Emergency egress planning', 'Fire safety equipment verification', 'Capacity monitoring during event', 'Incident reporting'],
      impact: 'Platform must enforce fire-code capacity limits at registration. Real-time headcount vs. capacity monitoring. Emergency procedures documented and accessible to event staff. Venue capacity certificates stored and verified.',
    },
    {
      regulation: 'ADA Compliance',
      jurisdiction: 'United States',
      requirements: ['Accessible venue verification', 'Accommodation request handling', 'Accessible seating allocation', 'Communication accessibility (ASL, captioning)', 'Accessible registration and ticketing'],
      impact: 'Venue accessibility information displayed to attendees. Accommodation request workflow for events. Accessible seating allocation system. Captioning available for virtual events. Accessible event materials.',
    },
    {
      regulation: 'Alcohol Beverage Licensing',
      jurisdiction: 'Per state/country',
      requirements: ['Age verification at entry', 'Designated server certification', 'Alcohol service hour limits', 'Intoxicated patron refusal procedures', 'Incident reporting for alcohol-related issues'],
      impact: 'Age verification at check-in for events serving alcohol. Server certification tracking for event staff. Alcohol service hours enforced per license. Incident reporting for alcohol-related issues.',
    },
    {
      regulation: 'Mass Gathering Permits',
      jurisdiction: 'Local (per municipality)',
      requirements: ['Permit application and approval', 'Security plan submission', 'Emergency services coordination', 'Noise ordinance compliance', 'Waste management plan'],
      impact: 'Event creation workflow includes permit verification step. Permit expiration tracked with alerts. Event information shared with local emergency services. Noise and hours restrictions configured per venue.',
    },
    {
      regulation: 'Consumer Protection & Refund Rights',
      jurisdiction: 'Per state/country',
      requirements: ['Clear refund policy disclosure', 'Timely refund processing', 'No deceptive pricing', 'Event cancellation notification', 'Consumer complaint handling'],
      impact: 'Refund policy prominently displayed at ticket purchase. Automated refund processing within required timeframe. Event cancellation notifications sent to all registered attendees. Consumer complaint tracking and resolution.',
    },
    {
      regulation: 'GDPR & Data Privacy',
      jurisdiction: 'EU / Global',
      requirements: ['Attendee data consent management', 'Right to erasure requests', 'Data portability', 'Breach notification', 'Data retention schedules'],
      impact: 'Consent management for attendee data collection and marketing. Data subject request (DSR) workflows. Attendee data export and deletion tools. Breach notification automation. Data retention policies enforced.',
    },
  ];
}

function businessRulesForEventManagement(): BusinessRulesSpec {
  return {
    ticketing: [
      'Ticket sales open at event creation or specified date. Early bird pricing available for defined period.',
      'Maximum tickets per purchase limited to 10 unless organizer overrides. Scalping prevention via rate limiting and CAPTCHA.',
      'Ticket transfer allowed up to 24 hours before event. Transfer fee $2.50 per ticket unless organizer waives.',
      'Refund window: 14 days before event = full refund. 7-13 days = 50% refund. Under 7 days = no refund unless event cancelled.',
      'Waitlist: when event sells out, attendees can join waitlist. Automatic notification and 15-minute purchase window when ticket becomes available.',
      'Promo codes: percentage or fixed-amount discounts with usage limits, date ranges, and ticket type restrictions.',
    ],
    registration: [
      'Registration requires valid email and payment (unless free event). Email verification within 24 hours or registration expires.',
      'Attendee can register for multiple events. Max 5 active registrations per attendee unless VIP status.',
      'Group registration: organizer can register multiple attendees with shared billing. Minimum 5 for group discount (15% off).',
      'Name changes on tickets allowed up to 48 hours before event. Name change fee $10 unless organizer waives.',
      'VIP registration includes expedited check-in, reserved seating, and exclusive access. Verified by organizer.',
    ],
    checkIn: [
      'QR code ticket checked in once. Re-entry allowed at organizer discretion.',
      'Express check-in for pre-verified attendees (VIP, staff, speakers) with dedicated lane.',
      'Paper ticket accepted as backup if mobile unavailable. ID required for age-restricted events.',
      'Walk-in registration allowed if capacity permits. Walk-in price may differ from advance price (+20% typical).',
      'Real-time attendance count synced to organizer dashboard within 30 seconds of check-in.',
    ],
    eventManagement: [
      'Event capacity cannot exceed venue fire-code maximum. Platform enforces at registration.',
      'Event must have at least one verified organizer with valid contact information.',
      'Event content must comply with community guidelines. Flagged events reviewed within 24 hours.',
      'Cancellation by organizer triggers automatic refund process within 3 business days.',
      'Event review period: attendees can review event within 7 days of completion.',
    ],
    vendorManagement: [
      'Vendors must provide valid business license and insurance certificate before booking.',
      'Service agreements require minimum 30-day cancellation notice. Late cancellation fee 50% of contract value.',
      'Vendor ratings: minimum 3 reviews before rating displayed. Organizer can flag inappropriate reviews.',
      'Payment to vendors released 7 days after event completion and satisfactory service confirmation.',
      'Vendor capacity limits: max 5 concurrent events per vendor unless premium tier.',
    ],
    compliance: [
      'Age-verified events (21+): attendee must verify age at registration via ID upload or third-party verification.',
      'Alcohol-served events: certified server required per local regulations. Incident reporting within 1 hour.',
      'Outdoor events: weather contingency plan required. Cancellation threshold: lightning within 5 miles, extreme weather warning.',
      'International events: visa information provided to attendees 90 days before event. Local compliance checklist generated.',
    ],
  };
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const EVENT_MANAGEMENT_PACK: DomainPack = {
  domain: 'eventManagement',
  name: 'Event Management Platform',
  description: 'Complete event planning and management platform — from event creation to attendee check-in and post-event analytics. Covers event ticketing, registration management, venue booking, vendor coordination, live streaming, access control, compliance with fire codes and ADA, and post-event analytics.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Event Creation & Management', 'Ticketing & Registration', 'Venue & Logistics', 'Attendee Experience', 'Vendor & Supplier Management', 'Analytics & Reporting'],
    features: [
      'event-builder',
      'ticket-management',
      'registration-system',
      'qr-check-in',
      'schedule-management',
      'vendor-coordination',
      'live-streaming',
      'access-control',
      'attendee-networking',
      'feedback-collection',
      'promotional-tools',
      'compliance-checking',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['in-person', 'virtual-livestream', 'hybrid', 'on-demand-recording'],
    features: [
      'ticket-delivery-email',
      'qr-code-generation',
      'mobile-ticket-wallet',
      'will-call-management',
      'badge-printing',
      'stream-access-link',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'event-discovery',
      'event-details',
      'ticket-purchase',
      'ticket-wallet',
      'event-schedule',
      'venue-map',
      'attendee-networking',
      'live-streaming',
      'post-event-content',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'event-management',
      'ticket-sales',
      'registration-tracking',
      'vendor-management',
      'check-in-operations',
      'financial-reporting',
      'compliance-monitoring',
      'staff-scheduling',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'custom-branding',
      'event-landing-pages',
      'countdown-timers',
      'social-sharing',
      'photo-gallery',
      'post-event-recap',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'event-discovery',
      'event-detail',
      'ticket-purchase',
      'venue-directory',
      'organizer-spotlight',
      'blog-event-tips',
    ],
    customer: [
      'event-dashboard',
      'ticket-wallet',
      'event-schedule',
      'check-in-qr',
      'networking',
      'feedback-form',
      'live-stream-viewer',
    ],
    admin: [
      'platform-dashboard',
      'event-moderation',
      'user-management',
      'financial-reports',
      'dispute-resolution',
      'compliance-monitoring',
    ],
    staff: [
      'check-in-app',
      'attendee-lookup',
      'event-schedule',
      'issue-reporting',
      'announcement-tools',
      'capacity-monitor',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForEventManagement(),

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Event-centric hero with date, location, and ticket CTA prominently displayed',
      'Visual schedule timeline with session filtering and personal agenda builder',
      'Venue map with interactive floor plans and session location markers',
      'Mobile-first attendee experience with offline ticket access',
      'Organizer dashboard with real-time sales and check-in analytics',
      'Networking interface with attendee profiles and interest-based matching',
    ],
    color: [
      'Event-adaptive color scheme: organizer can set primary brand color',
      'Dark backgrounds for virtual event platforms (reduces eye strain during long sessions)',
      'Bright accent colors for interactive elements (poll, Q&A, raise hand)',
      'Green for confirmed registrations, amber for waitlisted, red for sold out or cancelled',
      'High contrast for outdoor event visibility in sunlight',
      'Accessible palette with sufficient contrast ratios for colorblind attendees',
    ],
    typography: [
      'Bold, energetic headers for event titles and session names',
      'Clean body text for event descriptions and schedules',
      'Monospace for ticket numbers, QR codes, and confirmation codes',
      'Large, readable fonts for venue maps and signage design',
      'Multilingual typography support for international events',
    ],
    interaction: [
      'One-tap ticket purchase with saved payment methods',
      'Swipe through event schedule days on mobile',
      'Tap session to add to personal agenda',
      'QR scanner for express check-in (opens device camera)',
      'Pull-to-refresh for schedule updates and announcements',
      'In-app notifications for schedule changes and reminders',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance for all event interfaces',
      'Screen reader support for event details, schedule, and check-in',
      'Keyboard navigation for all attendee and organizer functions',
      'Captions and transcripts for all virtual event content',
      'High contrast mode for outdoor event visibility',
      'Font scaling up to 200% without layout breakage',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role: Attendee (event access), Organizer (event management), Venue Owner (venue management), Vendor (service delivery), Admin (platform oversight), Staff (event operations). OAuth/SSO for enterprise events. JWT for session management. MFA for organizers and admin with high-value events. Rate limiting on ticket purchase to prevent scalping.',
    data: 'Attendee data includes PII (name, email, payment), check-in timestamps, and session attendance. PCI DSS compliance for payment processing. Ticket QR codes use signed JWT to prevent forgery. Attendee data shared with organizers per consent settings. Data retention per event (typically 3-7 years for tax/legal requirements).',
    compliance: ['Fire code capacity enforcement', 'ADA accessibility compliance', 'Alcohol service regulations', 'Mass gathering permits', 'Consumer protection and refund rights', 'GDPR attendee data rights'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Ticket inventory locking for high-demand events (prevent oversell)',
      'Capacity enforcement against fire-code maximum',
      'Refund calculation based on cancellation timing and event policy',
      'Promo code validation with usage limits and date ranges',
      'Waitlist auto-promotion with notification timing',
      'Check-in QR code validation and duplicate prevention',
      'Age verification logic for 21+ events',
      'Registration expiry for unpaid reservations',
    ],
    integration: [
      'Ticket purchase → payment processing → ticket delivery → calendar invite',
      'Event creation → venue booking → capacity check → registration open',
      'Check-in scan → attendance logged → organizer dashboard updated → capacity alert if near max',
      'Event cancellation → notification cascade → automatic refund → attendee survey',
      'Vendor proposal → organizer approval → booking confirmation → service delivery → payment',
      'Post-event survey → feedback analysis → insight report → next event recommendations',
    ],
    e2e: [
      'Organizer creates event → sets tickets → promotes → attendees register → check-in → event runs → feedback collected',
      'High-demand flash sale: 10,000 tickets → capacity enforced → waitlist activated → waitlist promotions → sold out notification',
      'Hybrid event: in-person registration → virtual stream link delivered → attendee switches to virtual → analytics tracked',
      'Event cancellation: organizer cancels → all attendees notified → refunds processed → vendor cancellations → compliance report',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForEventManagement(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForEventManagement(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForEventManagement(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForEventManagement(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForEventManagement(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForEventManagement(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForEventManagement(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForEventManagement(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForEventManagement(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────



export const EVENT_MANAGEMENT_DOMAIN: DomainModel = {
  id: EVENT_MANAGEMENT_PACK.domain,
  domain: EVENT_MANAGEMENT_PACK.domain,
  name: EVENT_MANAGEMENT_PACK.name,
  label: EVENT_MANAGEMENT_PACK.name,
  category: 'eventtech',
  description: EVENT_MANAGEMENT_PACK.description,
  userRoles: [
    { id: 'attendee', name: 'Attendee', typicalFeatures: ['event-browse', 'ticket-purchase', 'ticket-wallet', 'event-schedule'], permissions: ['browse-events', 'purchase-tickets', 'manage-tickets', 'check-in', 'provide-feedback'] },
    { id: 'organizer', name: 'Event Organizer', typicalFeatures: ['event-builder', 'ticket-management', 'attendee-management', 'analytics-dashboard'], permissions: ['create-events', 'manage-tickets', 'view-analytics', 'send-communications', 'process-refunds'] },
    { id: 'venue-owner', name: 'Venue Owner', typicalFeatures: ['venue-listing', 'calendar-management', 'booking-management', 'venue-analytics'], permissions: ['manage-venue', 'set-availability', 'process-bookings', 'view-reports'] },
    { id: 'vendor', name: 'Vendor', typicalFeatures: ['service-listings', 'booking-management', 'portfolio', 'calendar'], permissions: ['manage-services', 'accept-bookings', 'view-calendar', 'send-invoices'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['admin-dashboard', 'user-management', 'content-moderation', 'platform-analytics'], permissions: ['manage-users', 'moderate-content', 'resolve-disputes', 'view-platform-analytics'] },
    { id: 'staff', name: 'Event Staff', typicalFeatures: ['check-in-app', 'attendee-lookup', 'event-schedule', 'capacity-monitor'], permissions: ['check-in-attendees', 'view-event-schedule', 'report-issues', 'scan-tickets'] },
  ],
  role: 'attendee',
  standardFeatures: [],
  businessModels: [
    { modelType: 'event-ticketing-platform', revenueStreams: ['ticketing-fees', 'organizer-subscriptions'], costStructure: ['payment-processing', 'infrastructure', 'support', 'marketing'], pricingStrategy: ['percentage-per-ticket', 'subscription-tiers', 'free-for-free-events'] },
    { modelType: 'event-planning-services', revenueStreams: ['planning-fees', 'vendor-markup'], costStructure: ['personnel', 'vendor-relations', 'venue-sourcing', 'coordination'], pricingStrategy: ['percentage-of-budget', 'flat-fee', 'daily-rate'] },
    { modelType: 'venue-management-platform', revenueStreams: ['venue-listing-fees', 'booking-commission'], costStructure: ['platform-engineering', 'venue-onboarding', 'marketing', 'customer-support'], pricingStrategy: ['per-venue-monthly', 'percentage-per-booking', 'feature-tiers'] },
  ],
  technicalPatterns: [
    { category: 'inventory', name: 'Ticket Inventory Locking', description: 'Optimistic locking for ticket sales to prevent overselling high-demand events', rationale: 'Concurrent ticket purchases must be handled safely to maintain trust and avoid overbooking' },
    { category: 'monitoring', name: 'Real-time Capacity Enforcement', description: 'Live headcount vs. fire-code capacity with automatic registration cutoff', rationale: 'Fire code compliance is non-negotiable and requires real-time enforcement' },
    { category: 'notification', name: 'Event-Driven Notifications', description: 'Multi-channel notifications for reminders, schedule changes, and emergency alerts', rationale: 'Timely communication is critical for attendee experience and safety' },
    { category: 'streaming', name: 'CDN-Based Virtual Event Delivery', description: 'Scalable video streaming for virtual and hybrid events with edge caching', rationale: 'Virtual events require reliable, high-quality streaming at scale' },
  ],
  operationalLifecycle: [
    { id: 'create', name: 'Create', description: 'Event concept, venue selection, and event setup' },
    { id: 'promote', name: 'Promote', description: 'Marketing campaigns, ticket sales, and attendee acquisition' },
    { id: 'operate', name: 'Operate', description: 'Event execution, check-in, and live operations' },
    { id: 'experience', name: 'Experience', description: 'Attendee experience during event with real-time support' },
    { id: 'analyze', name: 'Analyze', description: 'Post-event feedback, analytics, and insights for improvement' },
  ],
  designPrinciples: [
    { name: 'Event-First Design', description: 'Visual, immersive event pages with compelling imagery and clear ticket CTAs' },
    { name: 'Mobile-Check-In', description: 'QR-based mobile check-in with offline fallback and express lanes' },
    { name: 'Real-Time Updates', description: 'Live schedule updates, capacity alerts, and push notifications for changes' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Ticket forgery prevention', description: 'Signed QR codes with unique identifiers to prevent ticket duplication', severity: 'high' },
    { category: 'data', name: 'Attendee PII protection', description: 'Encryption of attendee personal and payment data', severity: 'high' },
    { category: 'compliance', name: 'Fire code capacity enforcement', description: 'Real-time headcount vs. fire-code maximum', severity: 'critical' },
    { category: 'payment', name: 'PCI DSS payment security', description: 'Secure ticket purchase processing', severity: 'medium' },
  ],
  regulations: [
    { name: 'Fire Code Occupancy', requirements: ['Maximum capacity enforcement', 'Real-time headcount', 'Emergency egress'] },
    { name: 'ADA Compliance', requirements: ['Accessible venue info', 'Accommodation requests', 'Accessible seating'] },
    { name: 'Alcohol Licensing', requirements: ['Age verification', 'Server certification', 'Service hour limits'] },
    { name: 'Mass Gathering Permits', requirements: ['Permit tracking', 'Security plans', 'Noise compliance'] },
    { name: 'Consumer Protection', requirements: ['Refund policy disclosure', 'Timely refunds', 'No deceptive pricing'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Ticket inventory locking', description: 'High-demand event oversell prevention', priority: 'critical' },
    { category: 'unit', name: 'Capacity enforcement', description: 'Fire-code maximum enforcement', priority: 'critical' },
    { category: 'integration', name: 'Check-in system', description: 'QR validation and attendance logging', priority: 'high' },
    { category: 'e2e', name: 'Create to attend', description: 'Full event lifecycle from creation to feedback', priority: 'medium' },
  ],
  workflows: [
    { id: 'create-to-promote', name: 'Create to Promote', steps: ['event-creation', 'venue-selection', 'ticket-config', 'schedule-building', 'campaign-launch'], entities: ['event', 'venue', 'ticket-type', 'campaign'] },
    { id: 'register-to-attend', name: 'Register to Attend', steps: ['discovery', 'ticket-selection', 'registration', 'payment', 'check-in', 'participation'], entities: ['event', 'ticket', 'attendee', 'registration'] },
    { id: 'vendor-to-service', name: 'Vendor to Service', steps: ['proposal', 'review', 'booking', 'coordination', 'delivery', 'payment'], entities: ['event', 'vendor', 'proposal', 'booking'] },
    { id: 'feedback-to-improve', name: 'Feedback to Improve', steps: ['survey', 'collection', 'analysis', 'insights', 'improvement-planning'], entities: ['event', 'survey', 'feedback', 'insight'] },
  ],
  entities: [
    { name: 'Event', description: 'Event entity with details, schedule, tickets, and venue', invariants: ['capacity <= fire-code maximum', 'at least one organizer', 'content policy compliance'] },
    { name: 'Ticket', description: 'Ticket with type, price, availability, and ownership', invariants: ['unique per purchase', 'check-in once only', 'transfer within policy window'] },
    { name: 'Registration', description: 'Attendee registration with payment status and attendance', invariants: ['payment confirmed before check-in (unless free)', 'max tickets per purchase enforced', 'refund policy enforced'] },
  ],
  invariants: ['event capacity <= fire-code maximum', 'ticket checked-in only once', 'registration requires payment for paid events', 'refund per published policy', 'vendor verified before booking'],
  constraints: ['max 10 tickets per purchase', 'group discount min 5 attendees', 'ticket transfer fee $2.50', 'name change fee $10', 'VIP max 20% of capacity', 'walk-in price +20%'],
  financialFlows: [
    { name: 'ticket-sale', direction: 'in', trigger: 'ticket-purchased' },
    { name: 'ticketing-fee', direction: 'in', trigger: 'ticket-sale-completed' },
    { name: 'organizer-payout', direction: 'out', trigger: 'event-completed' },
    { name: 'vendor-payment', direction: 'out', trigger: 'service-completed' },
    { name: 'refund', direction: 'out', trigger: 'refund-approved' },
  ],
  successMetrics: ['ticket-sell-through-rate', 'attendee-show-rate', 'event-nps-score', 'vendor-satisfaction', 'refund-rate', 'registration-conversion-rate', 'check-in-time'],
  analytics: { tracked: ['ticket-sales', 'registration-funnel', 'check-in-rates', 'attendee-engagement', 'vendor-performance', 'revenue-per-event'], dashboards: ['organizer-dashboard', 'event-overview', 'sales-funnel', 'attendee-insights', 'financial-summary'] },
  securityRequirements: ['qr-ticket-signing', 'rate-limiting-purchase', 'pci-dss-compliance', 'attendee-data-encryption', 'capacity-real-time-enforcement', 'age-verification'],
  regulatory: [
    { regulation: 'Fire Code Occupancy', applies: true, notes: 'Real-time capacity enforcement at registration and check-in' },
    { regulation: 'ADA Compliance', applies: true, notes: 'Accessible venue info and accommodation requests' },
    { regulation: 'Alcohol Licensing', applies: true, notes: 'Age verification for 21+ events' },
    { regulation: 'Consumer Protection', applies: true, notes: 'Clear refund policies and timely processing' },
    { regulation: 'GDPR', applies: true, notes: 'Attendee data rights and consent management' },
  ],
  businessModelVariants: [
    { modelType: 'event-ticketing-platform', description: 'Self-service event ticketing and management', pricingExamples: ['2% + $0.79/ticket', '$49/month organizer', 'Free for free events'] },
    { modelType: 'event-planning-services', description: 'Full-service event planning agency', pricingExamples: ['15-20% of event budget', '$5,000 minimum corporate', '$2,500 minimum social'] },
    { modelType: 'venue-management-platform', description: 'Venue listing and booking management', pricingExamples: ['$99/month per venue', '5% booking fee', '$49/month tools'] },
  ],
  revenueStreams: [
    { name: 'Ticketing Fees', description: 'Platform fees on ticket sales', pricingModel: 'percentage-plus-fixed', examples: ['2% + $0.79/ticket', '0.5% + $0.25/ticket premium'] },
    { name: 'Organizer Subscriptions', description: 'Monthly fees for premium features', pricingModel: 'per-month', examples: ['$49/month basic', '$149/month professional'] },
    { name: 'Service Fees', description: 'Event planning service fees', pricingModel: 'percentage-or-flat', examples: ['15-20% of budget', '$5,000 minimum'] },
    { name: 'Venue Commission', description: 'Commission on venue bookings', pricingModel: 'percentage', examples: ['10% venue sourcing', '5% platform booking'] },
    { name: 'Add-On Services', description: 'Streaming, access control, F&B', pricingModel: 'per-unit', examples: ['$199 streaming', '$299 access control'] },
    { name: 'Sponsorship Marketplace', description: 'Sponsorship deal commission', pricingModel: 'percentage', examples: ['10% commission', '$99/month sponsor listing'] },
  ],
  userRoleMatrix: [
    { roleId: 'attendee', roleName: 'Attendee', description: 'Individual attending events', permissions: ['browse-events', 'purchase-tickets', 'check-in', 'provide-feedback'], features: ['event-browse', 'ticket-purchase', 'ticket-wallet', 'event-schedule'], constraints: ['own tickets only', 'ticket transfer per policy', 'refund per policy', 'check-in only on event date'] },
    { roleId: 'organizer', roleName: 'Organizer', description: 'Event creator and manager', permissions: ['create-events', 'manage-tickets', 'view-analytics', 'send-communications', 'process-refunds'], features: ['event-builder', 'ticket-management', 'attendee-management', 'analytics-dashboard'], constraints: ['platform fees apply', 'refund policy compliance', 'content policy enforced'] },
    { roleId: 'venue-owner', roleName: 'Venue Owner', description: 'Venue space operator', permissions: ['manage-venue', 'set-availability', 'process-bookings', 'manage-pricing'], features: ['venue-listing', 'calendar-management', 'booking-management'], constraints: ['safety inspection required', 'platform commission', 'cancellation policy enforced'] },
    { roleId: 'vendor', roleName: 'Vendor', description: 'Event service provider', permissions: ['manage-services', 'accept-bookings', 'manage-portfolio', 'send-invoices'], features: ['service-listings', 'booking-management', 'portfolio'], constraints: ['certifications verified', 'platform commission', 'quality monitored via ratings'] },
    { roleId: 'admin', roleName: 'Platform Admin', description: 'Platform administrator', permissions: ['manage-users', 'moderate-content', 'resolve-disputes', 'view-platform-analytics'], features: ['admin-dashboard', 'user-management', 'content-moderation'], constraints: ['all actions logged', 'refunds >$500 need approval', 'data access for moderation only'] },
    { roleId: 'staff', roleName: 'Event Staff', description: 'On-site event personnel', permissions: ['check-in-attendees', 'view-event-schedule', 'report-issues', 'scan-tickets'], features: ['check-in-app', 'attendee-lookup', 'capacity-monitor'], constraints: ['event-specific access only', 'PII redacted', 'actions logged'] },
  ],
  operationalWorkflows: [
    { workflowId: 'create-to-promote', name: 'Create to Promote', description: 'Event creation through promotion launch', steps: ['concept', 'creation', 'venue-selection', 'ticket-config', 'schedule-building', 'marketing-setup', 'campaign-launch'], entities: ['event', 'venue', 'ticket-type', 'campaign'], triggers: ['event-created', 'tickets-published', 'campaign-launched'] },
    { workflowId: 'register-to-attend', name: 'Register to Attend', description: 'Event discovery through participation', steps: ['discovery', 'ticket-selection', 'registration', 'payment', 'ticket-delivery', 'check-in', 'participation'], entities: ['event', 'ticket', 'attendee', 'registration'], triggers: ['registration-complete', 'payment-confirmed', 'check-in-complete'] },
    { workflowId: 'vendor-to-service', name: 'Vendor to Service', description: 'Vendor proposal through service delivery', steps: ['proposal', 'review', 'booking', 'coordination', 'delivery', 'payment'], entities: ['event', 'vendor', 'proposal', 'booking'], triggers: ['proposal-submitted', 'booking-confirmed', 'service-complete'] },
    { workflowId: 'feedback-to-improve', name: 'Feedback to Improve', description: 'Post-event feedback collection and analysis', steps: ['survey', 'collection', 'sentiment-analysis', 'insights', 'planning', 'follow-up'], entities: ['event', 'survey', 'feedback', 'insight'], triggers: ['event-ended', 'survey-sent', 'feedback-received'] },
  ],
  stateMachines: [
    { entityName: 'Event', states: ['draft', 'published', 'open-for-registration', 'sold-out', 'in-progress', 'completed', 'cancelled', 'postponed'], transitions: { draft: ['published'], published: ['open-for-registration', 'cancelled'], 'open-for-registration': ['sold-out', 'in-progress'], 'in-progress': ['completed'] }, initialState: 'draft', terminalStates: ['completed', 'cancelled'] },
    { entityName: 'Ticket', states: ['reserved', 'purchased', 'transferred', 'checked-in', 'refunded', 'expired'], transitions: { reserved: ['purchased', 'expired'], purchased: ['transferred', 'checked-in', 'refunded'] }, initialState: 'reserved', terminalStates: ['refunded', 'expired'] },
    { entityName: 'Registration', states: ['draft', 'pending-payment', 'confirmed', 'waitlisted', 'cancelled', 'attended', 'no-show'], transitions: { draft: ['pending-payment'], 'pending-payment': ['confirmed'], confirmed: ['attended', 'cancelled'], waitlisted: ['confirmed'] }, initialState: 'draft', terminalStates: ['attended', 'no-show', 'cancelled'] },
  ],
  edgeCases: [
    { scenario: 'Event Cancellation', description: 'Organizer cancels event before date', handling: 'Automatic notification cascade, refund initiated', recovery: 'Full/partial refunds, priority for next event, vendor cancellation' },
    { scenario: 'Overcapacity at Venue', description: 'More attendees than fire-code maximum', handling: 'Real-time headcount monitoring, registration cutoff at 90%', recovery: 'Turned-away attendees offered stream or refund, compliance report generated' },
    { scenario: 'Speaker Cancellation', description: 'Keynote speaker cancels with little notice', handling: 'Backup speakers contacted, session replaced', recovery: 'Partial refund option, content repositioned, future backup contracts' },
    { scenario: 'Technical Failure', description: 'AV or streaming failure during event', handling: 'Backup systems activated, announcements made', recovery: 'Incident report, service credits, vendor review, redundant systems' },
  ],
  integrations: [
    { name: 'Payment Processing', type: 'financial', description: 'Ticket sales and vendor payments', required: true, configuration: 'Stripe Connect. Ticket purchase flow. Refund processing.' },
    { name: 'Venue Booking Systems', type: 'service', description: 'Real-time venue availability and booking', required: false, configuration: 'Two-way calendar sync. Capacity enforcement. Seating charts.' },
    { name: 'Live Streaming Platform', type: 'infrastructure', description: 'Virtual and hybrid event streaming', required: false, configuration: 'RTMP ingest. Virtual platform with breakout rooms. Auto-recording.' },
    { name: 'Access Control Systems', type: 'hardware', description: 'Physical check-in and RFID/NFC validation', required: false, configuration: 'QR and NFC validation. Real-time headcount. Badge printing.' },
    { name: 'Email & SMS Notifications', type: 'communication', description: 'Event reminders and updates', required: true, configuration: 'SendGrid for email, Twilio for SMS. Reminder schedule. Push notifications.' },
    { name: 'Analytics Platform', type: 'data', description: 'Event analytics and attendee behavior', required: false, configuration: 'Attendee journey tracking. Sales funnel. Post-event ROI calculation.' },
  ],
  technicalArchitecture: {
    patterns: ['Ticket inventory with optimistic locking', 'Real-time capacity enforcement', 'Event-driven notifications', 'CDN-based asset delivery', 'Queue-based registration for flash sales'],
    infrastructure: ['PostgreSQL for event data', 'Redis for ticket inventory', 'S3-compatible media storage', 'Kafka for notifications', 'Elasticsearch for event search', 'CDN for event pages'],
    dataFlow: 'Organizer creates event → published → attendee discovers → ticket reserved → payment → confirmed → reminders → check-in → attendance → post-event survey → analytics.',
    scalability: 'High-demand registration via Redis-backed inventory. Virtual streaming via CDN. Search via Elasticsearch. Auto-scaling for registration bursts.',
  },
  regulatoryCompliance: [
    { regulation: 'Fire Code Occupancy', jurisdiction: 'Local', requirements: ['Maximum capacity enforcement', 'Real-time headcount', 'Emergency egress'], impact: 'Capacity limits enforced at registration and check-in' },
    { regulation: 'ADA Compliance', jurisdiction: 'United States', requirements: ['Accessible venue info', 'Accommodation requests', 'Accessible seating'], impact: 'Accessibility info displayed, accommodation workflow' },
    { regulation: 'Alcohol Licensing', jurisdiction: 'Per state', requirements: ['Age verification', 'Server certification', 'Service hour limits'], impact: 'Age verification at check-in, server cert tracking' },
    { regulation: 'Mass Gathering Permits', jurisdiction: 'Local', requirements: ['Permit tracking', 'Security plans', 'Noise compliance'], impact: 'Permit verification in event creation workflow' },
    { regulation: 'Consumer Protection', jurisdiction: 'Per state', requirements: ['Refund policy disclosure', 'Timely refunds', 'No deceptive pricing'], impact: 'Refund policy displayed, automated refund processing' },
  ],
};
