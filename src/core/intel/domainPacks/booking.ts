/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Booking Domain Pack
 *
 * Online and in-person booking and scheduling platform for service-based businesses.
 * Covers calendar management, provider availability, time slot allocation,
 * waitlist handling, reminders, and flexible rescheduling with multi-channel support.
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
      { id: 'customer', name: 'Customer', typicalFeatures: pack.customer.features, permissions: ['read', 'write'] },
      { id: 'provider', name: 'Provider', typicalFeatures: pack.operations.features, permissions: ['read', 'write', 'schedule'] },
      { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'reports'], permissions: ['admin'] },
    ],
    role: 'user',
    standardFeatures: allFeatures.length > 0 ? allFeatures : [{ category: 'core', name: 'core', description: 'Core product', priority: 'essential' }],
    businessModels: [{ modelType: pack.domain, revenueStreams: ['booking-fees', 'subscription', 'cancellation-fees'], costStructure: ['provider-payouts', 'infrastructure', 'support', 'marketing'], pricingStrategy: ['per-booking', 'subscription', 'freemium'] }],
    technicalPatterns: [
      { category: 'integration', name: 'Calendar Sync', description: 'Google Calendar and Outlook bidirectional sync' },
      { category: 'architecture', name: 'Real-time Availability', description: 'WebSocket-based live slot updates' },
      { category: 'data', name: 'Time Zone Handling', description: 'Automatic timezone conversion and DST handling' },
    ],
    operationalLifecycle: [
      { id: 'browse', name: 'Browse', description: 'Customer discovers available services' },
      { id: 'book', name: 'Book', description: 'Customer selects time slot and confirms booking' },
      { id: 'remind', name: 'Remind', description: 'Automated reminders sent before appointment' },
      { id: 'attend', name: 'Attend', description: 'Service delivery at scheduled time' },
      { id: 'review', name: 'Review', description: 'Post-service review and feedback' },
    ],
    designPrinciples: [
      { name: 'Calendar-First', description: 'Primary interface centered on calendar and time slot selection' },
      { name: 'Quick Booking', description: 'Minimal steps from browse to confirmed booking' },
      { name: 'Calm Design', description: 'Low-stress color palette and clear time readability' },
    ],
    securityConsiderations: [
      { category: 'auth', name: 'Multi-role Authentication', description: 'Customer, provider, and admin roles', severity: 'high' },
      { category: 'data', name: 'PII Protection', description: 'Encrypted personal information and calendar data', severity: 'high' },
      { category: 'compliance', name: 'Payment Compliance', description: 'PCI DSS compliant payment processing', severity: 'high' },
    ],
    regulations: [
      { name: 'GDPR', requirements: ['Data minimization', 'Right to erasure', 'Consent management', 'Breach notification'] },
      { name: 'CCPA', requirements: ['Data disclosure at request', 'Opt-out of data sale', 'Non-discrimination'] },
      { name: 'PCI DSS', requirements: ['Card data encryption', 'Secure transmission', 'Regular security scans'] },
    ],
    testingRequirements: [
      { category: 'unit', name: 'Cancellation Fee Calc', description: 'Correct fee based on timing threshold', priority: 'high' },
      { category: 'unit', name: 'Waitlist Priority', description: 'VIP placement and FIFO ordering', priority: 'medium' },
      { category: 'unit', name: 'Timezone Conversion', description: 'DST handling and cross-timezone display', priority: 'high' },
      { category: 'integration', name: 'Booking Flow', description: 'Customer books → calendar check → provider notification → reminder → payment', priority: 'high' },
      { category: 'integration', name: 'Cancellation Flow', description: 'Provider cancels → waitlist auto-fill → customer notification → rebooking', priority: 'high' },
      { category: 'integration', name: 'Calendar Sync', description: 'Google/Outlook sync → import availability → conflict detection', priority: 'medium' },
      { category: 'e2e', name: 'Full Booking Journey', description: 'Browse → select provider → pick time → book → confirm → attend → review', priority: 'high' },
      { category: 'e2e', name: 'Waitlist Flow', description: 'No slot available → join waitlist → slot opens → notification → auto-book or pass', priority: 'medium' },
    ],
    workflows: [
      { id: 'booking', name: 'Booking Workflow', steps: ['browse-services', 'select-provider', 'choose-time', 'confirm-details', 'process-payment', 'send-confirmation'], entities: ['Booking', 'Service', 'Provider', 'TimeSlot'] },
      { id: 'reminder', name: 'Reminder Workflow', steps: ['check-upcoming', 'select-channel', 'send-reminder', 'track-response', 'trigger-followup'], entities: ['Booking', 'Notification', 'Reminder'] },
      { id: 'cancellation', name: 'Cancellation Workflow', steps: ['detect-cancel', 'check-policy', 'calculate-fee', 'process-refund', 'notify-parties', 'release-slot'], entities: ['Booking', 'Refund', 'Slot'] },
      { id: 'checkin', name: 'Check-in Workflow', steps: ['arrival-detect', 'confirm-identity', 'mark-attended', 'update-status', 'trigger-service'], entities: ['Booking', 'CheckIn', 'Provider'] },
    ],
    entities: [
      { name: 'Booking', description: 'Core booking entity linking customer, service, provider, and time', invariants: ['exactly one provider', 'time slot must be available', 'cancellation policy enforced'] },
      { name: 'Service', description: 'Serviceable offering with duration, price, and requirements', invariants: ['positive duration', 'price defined', 'provider assigned'] },
      { name: 'TimeSlot', description: 'Available time window for a service', invariants: ['no overlaps per provider', 'within availability hours'] },
      { name: 'Provider', description: 'Service provider with schedule and capacity', invariants: ['defined working hours', 'max concurrent bookings'] },
    ],
    invariants: [
      'A time slot cannot be double-booked for the same provider',
      'Cancellation fees enforced based on notice period',
      'Buffer time enforced between consecutive appointments',
      'No-show detection triggered after grace period expires',
      'Waitlist order preserved with VIP priority override',
      'Recurring bookings validated for entire series at creation time',
    ],
    constraints: [
      'Maximum advance booking: 90 days',
      'Minimum notice for booking: 1 hour',
      'Maximum group size per booking: configurable per service',
      'Cancellation cutoff: 24 hours before appointment',
    ],
    financialFlows: [
      { name: 'booking-payment', direction: 'in', trigger: 'booking-confirmation' },
      { name: 'provider-payout', direction: 'out', trigger: 'service-completion' },
      { name: 'cancellation-fee', direction: 'in', trigger: 'late-cancellation' },
      { name: 'refund', direction: 'out', trigger: 'cancellation-approved' },
    ],
    successMetrics: [
      'booking-conversion-rate',
      'cancellation-rate',
      'no-show-rate',
      'average-booking-value',
      'provider-utilization-rate',
      'customer-satisfaction-score',
      'time-to-book',
    ],
    analytics: {
      tracked: ['booking-volume', 'cancellation-patterns', 'provider-performance', 'peak-hours', 'service-popularity'],
      dashboards: ['operations', 'provider', 'customer-facing', 'financial'],
    },
    securityRequirements: [
      'Customer and provider role separation',
      'Encrypted PII and payment data',
      'PCI DSS compliant payment processing',
      'Calendar data access-controlled sharing',
      'Audit logging for booking modifications',
    ],
    regulatory: [
      { regulation: 'GDPR', applies: true, notes: 'Customer data export and deletion endpoints' },
      { regulation: 'CCPA', applies: true, notes: 'Data disclosure and opt-out handling' },
      { regulation: 'PCI DSS', applies: true, notes: 'Payment tokenization via compliant processor' },
    ],
  };
}

// ── Booking Pack ──────────────────────────────────────────────────────────────

export const BOOKING_PACK: DomainPack = {
  domain: 'booking',
  name: 'Booking & Scheduling Platform',
  description:
    'Online and in-person booking and scheduling platform for service-based businesses. Covers calendar management, provider availability, time slot allocation, waitlist handling, reminders, and flexible rescheduling with multi-channel support.',

  // ── Catalog ─────────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Services', 'Providers', 'Time Slots', 'Locations', 'Resources', 'Waitlists'],
    features: [
      'calendar-management',
      'provider-scheduling',
      'time-slot-booking',
      'online-booking',
      'in-person-booking',
      'phone-booking',
      'walk-in-management',
      'waitlist-handling',
      'automated-reminders',
      'calendar-sync',
      'multi-location',
      'resource-allocations',
      'cancellation-policy',
      'booking-modifications',
      'group-bookings',
      'recurring-appointments',
      'deposit-collection',
      'availability-search',
      'provider-profiles',
      'service-catalog',
    ],
  },

  // ── Fulfillment ─────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['online', 'in-person', 'phone', 'walk-in'],
    features: [
      'calendar-sync',
      'reminders',
      'waitlist',
      'resource-optimization',
      'provider-routing',
      'buffer-time-enforcement',
      'no-show-tracking',
      'flexible-rescheduling',
    ],
  },

  // ── Customer Features ───────────────────────────────────────────────────────
  customer: {
    features: [
      'service-browsing',
      'booking',
      'calendar',
      'reminders',
      'history',
      'reviews',
      'provider-selection',
      'preferred-time-slots',
      'group-booking',
      'payment-on-file',
    ],
  },

  // ── Operations Features ─────────────────────────────────────────────────────
  operations: {
    features: [
      'schedule-management',
      'resource-allocation',
      'waitlist',
      'cancellation',
      'reporting',
      'provider-availability',
      'bulk-scheduling',
      'conflict-resolution',
    ],
  },

  // ── Experience Features ─────────────────────────────────────────────────────
  experience: {
    features: [
      'instant-booking',
      'smart-scheduling',
      'reminders',
      'flexible-rescheduling',
      'calendar-embed',
      'auto-suggestions',
      'mobile-checkin',
      'virtual-waiting-room',
    ],
  },

  // ── Components ──────────────────────────────────────────────────────────────
  components: {
    public: ['services', 'providers', 'pricing', 'locations', 'availability-search'],
    customer: ['dashboard', 'bookings', 'history', 'settings', 'reviews', 'favorites'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'settings', 'provider-management', 'billing'],
    staff: ['schedule', 'bookings', 'resources', 'waitlist', 'checkin'],
  },

  // ── Business Rules ──────────────────────────────────────────────────────────
  businessRules: {
    cancellationPolicy: 'Customers cancel free up to 24 hours before appointment. Within 24 hours: 50% fee. No-shows: full price charged. 3+ no-shows trigger booking restrictions. Provider-initiated cancellations trigger auto-rebooking and compensation credit.',
    bufferTime: '15-minute buffer between all appointments for cleaning/setup. Service-specific buffers configurable (e.g., 30 min for consultations). Buffer time billable for provider. Group bookings: 5 min per-person additional buffer.',
    resourceConflicts: 'Double-booking prevented at booking time. Resource conflicts (rooms, equipment) detected and blocked. Resolution options: alternative provider, alternative time, waitlist. Recurring bookings checked against entire series.',
    waitlistPriority: 'First-come-first-served with VIP priority (10+ completed bookings). Automatic notification on slot opening with 15-min response window. Unclaimed slots offered to next in line. Capacity configurable per service.',
    noShowPolicy: 'Automated no-show detection: not checked in within 15 min of start triggers notification. First: warning email. Second: 30-day booking restriction. Third: account review. Provider-initiated no-shows trigger customer compensation.',
    timeZoneHandling: 'All time slots displayed in customer local timezone with conversion from provider timezone. Calendar sync exports with correct timezone metadata. Recurring appointments handle DST by shifting local time. International customers see dual timezone display.',
  },

  // ── Design ──────────────────────────────────────────────────────────────────
  design: {
    layout: ['calendar-first', 'time-slot-grid', 'mobile-booking', 'provider-list'],
    color: ['calm-blue', 'success-green', 'warning-amber', 'error-red'],
    typography: ['time-readable', 'clear-dates', 'body-readable', 'mono-ids'],
    interaction: ['drag-reschedule', 'quick-book', 'swipe-time-slots', 'inline-confirm'],
    accessibility: ['keyboard-nav', 'screen-reader', 'voice-input', 'high-contrast'],
  },

  // ── Security ────────────────────────────────────────────────────────────────
  security: {
    auth: 'Customer + provider + admin roles. Customers via email/password or OAuth (Google, Apple). Providers use staff portal with MFA. Admins have full platform access with SSO. Rate limiting on login endpoints.',
    data: 'Encrypted PII at rest (AES-256) and in transit (TLS 1.3). Calendar data access-controlled. Payment info tokenized via PCI-compliant processor. Customer data export and deletion for GDPR. Audit logging on all data access.',
    compliance: ['GDPR', 'CCPA', 'PCI DSS'],
  },

  // ── Testing ─────────────────────────────────────────────────────────────────
  testing: {
    unit: [
      'Cancellation fee calculation: correct fee based on timing',
      'Waitlist priority scoring: VIP and FIFO ordering',
      'Timezone conversion: DST and cross-timezone display',
      'Buffer time enforcement: slot gap validation',
      'No-show detection: threshold timing and classification',
      'Recurring booking conflict check: entire series validation',
    ],
    integration: [
      'Customer books → calendar check → provider notification → reminder → payment',
      'Provider cancels → waitlist auto-fill → customer notification → rebooking offer',
      'Calendar sync → import availability → conflict detection → update booking slots',
      'Waitlist → slot opens → SMS notification → 15-min window → auto-book or pass',
    ],
    e2e: [
      'Customer browses → selects provider → picks time → books → confirms → attends → leaves review',
      'Provider marks unavailable → system blocks bookings → customer sees updated availability → waits for reopen',
    ],
  },
};

// ── Booking Domain Model ──────────────────────────────────────────────────────

export const BOOKING_DOMAIN: DomainModel = toDomainModel(BOOKING_PACK);
