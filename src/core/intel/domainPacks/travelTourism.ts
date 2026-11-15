/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Travel Tourism Domain Pack
 *
 * Complete travel booking and tourism management platform — from search to trip and beyond.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForTravel(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'ota-marketplace',
      description: 'Online Travel Agency platform aggregating flights, hotels, car rentals, and activities. Revenue from commission on bookings and advertising.',
      pricingExamples: ['Flight booking 3-7% commission', 'Hotel booking 15-20% commission', 'Package deals 10-15% commission', 'Advertising $500-5,000/month per partner'],
    },
    {
      modelType: 'tour-operator-platform',
      description: 'Curated tour and experience platform connecting travelers with local tour operators, guides, and unique experiences.',
      pricingExamples: ['Tour booking 15-25% commission', 'Experience booking 20-30% commission', 'Tour operator subscription $49/month', 'Curator subscription $199/month'],
    },
    {
      modelType: 'destination-management',
      description: 'Corporate and group travel management platform for business trips, incentive travel, and event travel coordination.',
      pricingExamples: ['Corporate subscription $99/month per account', 'Per-booking management fee $25-50', 'Group travel markup 10-15%', 'Duty of care monitoring $5/traveler/trip'],
    },
  ];
}

function revenueStreamsForTravel(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Booking Commissions',
      description: 'Primary revenue from commissions on hotel, flight, tour, and activity bookings made through the platform.',
      pricingModel: 'percentage-of-booking',
      examples: ['Hotel booking 15-20% commission', 'Flight booking 3-7% commission', 'Tour booking 15-25% commission'],
    },
    {
      name: 'Package Pricing',
      description: 'Revenue from bundled travel packages (flight + hotel + activities) sold at a markup over component costs.',
      pricingModel: 'markup on package cost',
      examples: ['Vacation package markup 10-15%', 'Honeymoon package markup 20%', 'Group tour package markup 12%'],
    },
    {
      name: 'Tour & Activity Fees',
      description: 'Direct fees for curated experiences, tours, and activities booked through the platform.',
      pricingModel: 'per-booking commission',
      examples: ['City tour $50 booking with 20% fee', 'Cooking class $80 booking with 25% fee', 'Adventure activity $120 booking with 15% fee'],
    },
    {
      name: 'Cancellation & Change Fees',
      description: 'Revenue from cancellation fees, change fees, and no-show penalties applied per booking terms.',
      pricingModel: 'per-transaction fee',
      examples: ['Cancellation fee $25-50', 'Change fee $30 + fare difference', 'No-show penalty 50% of booking value'],
    },
    {
      name: 'Travel Insurance',
      description: 'Commission from travel insurance sold alongside bookings, plus white-label insurance products.',
      pricingModel: 'per-policy commission',
      examples: ['Trip cancellation insurance $29-79/policy', 'Platform commission 20-30% of premium', 'White-label insurance $15/insured/month'],
    },
    {
      name: 'Advertising',
      description: 'Revenue from destination marketing organizations, hotels, airlines, and travel brands advertising on the platform.',
      pricingModel: 'cpm or cpc',
      examples: ['Destination banner $5,000/month', 'Hotel sponsored listing $500/month', 'Email newsletter $3,000/edition'],
    },
  ];
}

function userRoleMatrixForTravel(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'traveler',
      roleName: 'Traveler',
      description: 'End user searching for and booking travel — flights, hotels, tours, and activities.',
      permissions: ['search-travel', 'create-booking', 'manage-itinerary', 'write-reviews', 'access-insurance', 'save-preferences'],
      features: ['search', 'booking', 'itinerary', 'reviews', 'wishlist', 'insurance', 'trip-reminders'],
      constraints: ['cancellation per fare rules', 'passport/visa info self-provided', 'review requires verified booking'],
    },
    {
      roleId: 'tour-operator',
      roleName: 'Tour Operator',
      description: 'Local operator offering tours, activities, and experiences to travelers through the platform.',
      permissions: ['create-tours', 'manage-availability', 'process-bookings', 'update-listings', 'respond-to-reviews'],
      features: ['tour-management', 'booking-dashboard', 'calendar', 'reviews', 'analytics'],
      constraints: ['tours must meet platform quality standards', 'cancellation policy disclosed', 'availability real-time updated'],
    },
    {
      roleId: 'hotel-partner',
      roleName: 'Hotel Partner',
      description: 'Hotel or accommodation provider listing rooms and managing bookings through the platform.',
      permissions: ['manage-inventory', 'set-pricing', 'process-bookings', 'respond-to-reviews', 'access-analytics'],
      features: ['room-management', 'pricing-tools', 'booking-engine', 'reviews', 'analytics'],
      constraints: ['inventory synced in real-time', 'pricing per rate agreement', 'cancellation policy per room type'],
    },
    {
      roleId: 'agent',
      roleName: 'Travel Agent',
      description: 'Professional travel agent booking and managing travel for corporate or individual clients.',
      permissions: ['search-travel', 'book-for-clients', 'manage-corporate-accounts', 'access-corporate-rates', 'generate-reports'],
      features: ['search', 'booking-engine', 'corporate-dashboard', 'client-management', 'reporting'],
      constraints: ['corporate rates require approval', 'client data privacy per GDPR', 'booking modifications require client notification'],
    },
    {
      roleId: 'guide',
      roleName: 'Tour Guide',
      description: 'Local guide leading tours and experiences. Manages tour schedules, group management, and safety.',
      permissions: ['manage-tour-schedule', 'confirm-bookings', 'mark-attendance', 'report-issues'],
      features: ['schedule', 'group-management', 'check-in', 'safety-checklist', 'earnings'],
      constraints: ['certification per local requirements', 'group size per license', 'safety protocols mandatory'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing partners, travelers, bookings, billing, and platform configuration.',
      permissions: ['*'],
      features: ['dashboard', 'partner-management', 'booking-management', 'billing', 'reports', 'compliance'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'partner data isolated'],
    },
  ];
}

function operationalWorkflowsForTravel(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'search-to-book',
      name: 'Search to Book',
      description: 'Traveler searches for options, compares results, selects booking, enters traveler details, and confirms payment.',
      steps: ['search-entry', 'results-filtering', 'results-display', 'option-selection', 'traveler-details', 'passenger-info', 'payment-processing', 'booking-confirmed', 'confirmation-email', 'itinerary-created'],
      entities: ['search-query', 'search-result', 'booking', 'passenger', 'payment', 'itinerary'],
      triggers: ['search-performed', 'booking-confirmed', 'payment-completed', 'ticket-issued'],
    },
    {
      workflowId: 'booking-to-trip',
      name: 'Booking to Trip',
      description: 'Booking confirmed, itinerary assembled, pre-trip notifications sent, check-in/boarding completed, trip experienced, and post-trip follow-up.',
      steps: ['booking-confirmed', 'itinerary-assembled', 'pre-trip-notifications', 'check-in-available', 'check-in-completed', 'boarding', 'trip-in-progress', 'trip-completed', 'post-trip-review-invite', 'review-submitted'],
      entities: ['booking', 'itinerary', 'check-in', 'boarding-pass', 'review'],
      triggers: ['booking-confirmed', 'check-in-opens', 'trip-completed', 'review-submitted'],
    },
    {
      workflowId: 'review-to-reputation',
      name: 'Review to Reputation',
      description: 'Post-trip review submitted, verified against booking, moderated for quality, published, and aggregated into partner ratings.',
      steps: ['review-invite-sent', 'review-drafted', 'review-submitted', 'booking-verification', 'moderation-check', 'review-published', 'rating-aggregated', 'partner-notified'],
      entities: ['review', 'rating', 'booking', 'partner-profile'],
      triggers: ['review-invite', 'review-submitted', 'review-published', 'rating-updated'],
    },
    {
      workflowId: 'issue-to-resolution',
      name: 'Issue to Resolution',
      description: 'Traveler reports an issue (cancellation, no-show, quality problem), platform investigates, resolution offered, and case closed.',
      steps: ['issue-reported', 'issue-categorized', 'partner-notified', 'investigation-started', 'evidence-collected', 'resolution-determined', 'resolution-offered', 'traveler-response', 'case-closed'],
      entities: ['issue', 'investigation', 'resolution', 'refund', 'case'],
      triggers: ['issue-reported', 'resolution-offered', 'case-closed'],
    },
  ];
}

function stateMachinesForTravel(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Booking',
      states: ['search', 'reserved', 'confirmed', 'ticketed', 'checked-in', 'completed', 'cancelled', 'no-show', 'refunded'],
      transitions: { search: ['reserved'], reserved: ['confirmed', 'cancelled'], confirmed: ['ticketed', 'cancelled'], ticketed: ['checked-in', 'no-show'], 'checked-in': ['completed'], completed: ['refunded'], cancelled: ['refunded'] },
      initialState: 'search',
      terminalStates: ['completed', 'cancelled', 'no-show', 'refunded'],
    },
    {
      entityName: 'Itinerary',
      states: ['planning', 'draft', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      transitions: { planning: ['draft'], draft: ['confirmed', 'cancelled'], 'in-progress': ['completed'], confirmed: ['cancelled'] },
      initialState: 'planning',
      terminalStates: ['completed', 'cancelled'],
    },
    {
      entityName: 'Review',
      states: ['pending', 'submitted', 'verified', 'moderated', 'published', 'flagged', 'removed'],
      transitions: { pending: ['submitted'], submitted: ['verified'], verified: ['moderated'], moderated: ['published', 'flagged'], flagged: ['published', 'removed'] },
      initialState: 'pending',
      terminalStates: ['published', 'removed'],
    },
    {
      entityName: 'SupportTicket',
      states: ['open', 'investigating', 'awaiting-partner', 'resolution-proposed', 'resolved', 'escalated', 'closed'],
      transitions: { open: ['investigating', 'escalated'], investigating: ['awaiting-partner', 'resolution-proposed'], 'awaiting-partner': ['investigating'], 'resolution-proposed': ['resolved'], escalated: ['investigating'], resolved: ['closed'] },
      initialState: 'open',
      terminalStates: ['closed'],
    },
  ];
}

function edgeCasesForTravel(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Natural Disaster / Force Majeure',
      description: 'Hurricane, earthquake, volcanic eruption, or pandemic affects travel plans — flights cancelled, hotels closed, tours unavailable.',
      handling: 'Automated travel alert system notifies all affected travelers within 1 hour of official advisory. Platform rebooking options presented: alternative flights, nearby accommodations, full refund. Partner cancellation waivers activated. Emergency assistance hotline activated.',
      recovery: 'Full refund processed for affected bookings within 48 hours. Travel insurance claims expedited for affected travelers. Alternative destination suggestions based on safety. Post-disaster partner reintegration with enhanced safety verification. Force majeure documentation stored for legal compliance.',
    },
    {
      scenario: 'Flight Overbooking',
      description: 'Airlines overbook flights and deny boarding to confirmed ticketed passengers, causing missed connections and trip disruption.',
      handling: 'Passenger notified via app/SMS of overbooking situation before airport arrival. Alternative flight options presented with comparison. Compensation options per DOT regulations displayed (voucher, miles, cash). Missed connection rebooking handled automatically. Partner hotel offered if overnight stay required.',
      recovery: 'If passenger accepts compensation: voucher or cash issued, rebooking confirmed, baggage tracked to new flight. If passenger insists: complaint filed with airline and DOT. Travel insurance claim initiated for additional losses. Customer satisfaction survey and loyalty gesture.',
    },
    {
      scenario: 'Visa Denial',
      description: 'Traveler visa application denied after booking non-refundable flights, hotels, and tours.',
      handling: 'Visa requirement warning displayed at booking for destination requiring visas. Booking confirmation includes cancellation policy. Visa denial documentation requested for refund eligibility. Travel insurance claim initiated automatically with visa denial as reason. Alternative non-visa destinations suggested.',
      recovery: 'If travel insurance covers visa denial: full claim processed. If not: cancellation per fare rules, partial refund negotiated with partners. Future bookings include enhanced visa guidance. Travel document verification added to pre-booking checklist.',
    },
    {
      scenario: 'Lost Luggage',
      description: 'Checked luggage lost or significantly delayed during connecting flights, leaving traveler without belongings.',
      handling: 'Airline baggage claim filed automatically using platform booking data. Luggage tracking integration with airline systems. Emergency essentials provided via partner (toiletries, clothing voucher). Travel insurance claim filed. Luggage location updates sent via app notification.',
      recovery: 'If luggage found within 24h: delivery arranged to current location. If luggage delayed 48h+: interim expense claim processed. If luggage lost: airline compensation claim, insurance claim, replacement shopping allowance. Luggage service integration for replacement items at destination.',
    },
  ];
}

function integrationsForTravel(): DomainPack['integrations'] {
  return [
    {
      name: 'GDS (Global Distribution System)',
      type: 'inventory',
      description: 'Amadeus, Sabre, or Travelport integration for real-time flight, hotel, and car rental inventory and pricing.',
      required: true,
      configuration: 'API credentials with GDS provider. Real-time availability and pricing queries. Booking confirmation and cancellation. PNR (Passenger Name Record) management. Commission tracking per GDS rules.',
    },
    {
      name: 'Payment Gateway',
      type: 'payment',
      description: 'Multi-currency payment processing with fraud detection, chargeback management, and PCI compliance.',
      required: true,
      configuration: 'Multi-currency Stripe or Adyen integration. Dynamic currency conversion. 3D Secure 2 authentication. Fraud detection with velocity checks. Split payments for marketplace commissions. Refund automation.',
    },
    {
      name: 'Airline APIs',
      type: 'inventory',
      description: 'Direct airline API integrations for NDC (New Distribution Capability) content and enhanced booking capabilities.',
      required: false,
      configuration: 'NDC API integration with major carriers. Ancillary service booking (seats, baggage, meals). Real-time flight status. Boarding pass generation. Seat map integration.',
    },
    {
      name: 'Hotel PMS (Property Management System)',
      type: 'inventory',
      description: 'Direct integration with hotel property management systems for real-time room availability and rate verification.',
      required: false,
      configuration: 'API connection to major hotel chains PMS. Real-time room availability push. Rate parity verification. Key card integration. Housekeeping status sync.',
    },
    {
      name: 'Travel Insurance',
      type: 'insurance',
      description: 'Integration with travel insurance providers for trip cancellation, medical, and baggage insurance.',
      required: false,
      configuration: 'Insurance quote API during booking flow. Policy generation and issuance. Claims filing integration. Coverage verification for visa requirements.',
    },
    {
      name: 'Visa & Documentation',
      type: 'government',
      description: 'Visa requirement checking and documentation verification for international travel.',
      required: false,
      configuration: 'Passport country and destination lookup. Visa requirement API (IATA). ETIAS/ESTA application integration. Document expiration warnings. Health requirement checks (vaccines).',
    },
  ];
}

function technicalArchitectureForTravel(): TechnicalArchitectureDef {
  return {
    patterns: ['Distributed booking engine with optimistic concurrency for seat/room inventory', 'Event-driven inventory updates via message queue', 'CQRS for search read optimization vs booking write consistency', 'Idempotent booking API for retry safety', 'Multi-currency pricing with real-time exchange rates'],
    infrastructure: ['PostgreSQL for booking and customer data with strong consistency', 'Redis for inventory caching and seat/room availability', 'S3-compatible storage for booking documents and tickets', 'Elasticsearch for travel search and recommendation', 'Kafka for inventory sync events across partners', 'CDN for static travel content and images'],
    dataFlow: 'Traveler searches → query distributed across GDS, airline APIs, hotel PMS → results aggregated and ranked → traveler selects → real-time inventory hold (optimistic) → passenger details collected → payment processed → booking confirmed → inventory committed → ticket/voucher generated → itinerary assembled → pre-trip notifications triggered → check-in opens → boarding pass issued → trip completed → review solicited → rating aggregated.',
    scalability: 'Search scaled horizontally via Elasticsearch with caching layers. Inventory holds managed via Redis with TTL-based expiry. Booking writes use database-level locking for consistency. Multi-currency calculations cached with 15-minute refresh. GDS rate-limited with circuit breakers for resilience.',
  };
}

function regulatoryComplianceForTravel(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'DOT Air Travel Regulations',
      jurisdiction: 'United States',
      requirements: ['Transparent fare display with all fees and taxes', 'On-time performance disclosure', 'Bumping compensation rules', 'Refund eligibility disclosure', 'Accessibility requirements for disabled travelers'],
      impact: 'Fare display must include all mandatory fees. Cancellation and refund policies clearly stated per DOT rules. Overbooking compensation automated per DOT requirements. Accessibility filters and options for travelers with disabilities.',
    },
    {
      regulation: 'EU Package Travel Directive',
      jurisdiction: 'European Union',
      requirements: ['Package travel protection (insolvency fund)', 'Pre-contractual information disclosure', 'Right to transfer booking', 'Price change limitations', 'Cooling-off period for package bookings'],
      impact: 'Package bookings include insolvency protection disclosure. Pre-contractual information generated automatically per directive requirements. Price change notifications with 14-day advance warning. Transfer of booking feature with platform support.',
    },
    {
      regulation: 'GDPR',
      jurisdiction: 'European Union',
      requirements: ['Consent for marketing communications', 'Right to erasure of personal data', 'Data portability for booking history', 'Cookie consent for tracking', 'DPA with sub-processors'],
      impact: 'Booking data export in standard format. Personal data deletion after retention period expires. Marketing consent managed per traveler. Cookie consent banner for EU visitors.',
    },
    {
      regulation: 'Consumer Protection',
      jurisdiction: 'Per-country',
      requirements: ['Clear cancellation and refund policies', 'Contact information disclosure', 'Complaint handling procedures', 'Alternative dispute resolution', 'Price transparency'],
      impact: 'Cancellation policies displayed before booking confirmation. Complaint submission and tracking system. Response SLA per jurisdiction. Price breakdown including all taxes and fees.',
    },
  ];
}

function businessRulesForTravel(): string[] {
  return [
    'Inventory hold: 15-minute hold on selected flight/hotel without payment. Hold released if payment not completed.',
    'Cancellation policy: free cancellation up to 48h before departure for flights, up to 72h for hotels. Cancellation fee 50% within 24h.',
    'Refund processing: completed within 14 business days of cancellation request. Refund issued to original payment method.',
    'Multi-currency: prices displayed in user-selected currency. Exchange rates updated every 15 minutes. Actual charge in booking currency.',
    'Age-based pricing: children under 2 lap infants free, 2-11 child fares, 12+ adult fares. Senior discounts where applicable.',
    'Travel insurance: offered at checkout for all bookings. Insurance non-refundable once policy issued.',
    'No-show policy: missed flight or hotel check-in results in forfeiture of booking value unless travel insurance covers it.',
  ];
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const TRAVEL_TOURISM_PACK: DomainPack = {
  domain: 'travelTourism',
  name: 'Travel Booking & Tourism',
  description: 'Complete travel booking and tourism management platform — from search to trip and beyond. Covers multi-channel booking (flights, hotels, tours, activities), itinerary management, travel insurance, destination discovery, review system, and compliance with travel regulations including DOT and EU package travel directives.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Flights', 'Hotels & Stays', 'Tours & Activities', 'Car Rentals', 'Travel Insurance', 'Destinations'],
    features: [
      'flexible-dates',
      'multi-city',
      'price-alerts',
      'flexible-cancellation',
      'travel-insurance',
      'visa-info',
      'weather-forecast',
      'travel-advisories',
      'loyalty-points',
      'group-booking',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['e-ticket', 'mobile-boarding-pass', 'hotel-key-card', 'voucher', 'curbside-checkin'],
    features: [
      'e-ticket-delivery',
      'mobile-boarding',
      'hotel-checkin',
      'travel-document',
      'baggage-tracking',
      'seat-selection',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'search-engine',
      'price-comparison',
      'itinerary-builder',
      'trip-organizer',
      'reviews',
      'wishlist',
      'travel-documents',
      'trip-reminders',
      'offline-access',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'booking-management',
      'partner-management',
      'pricing-engine',
      'fraud-detection',
      'customer-support',
      'cancellation-processing',
      'refund-management',
      'commission-tracking',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'destination-guides',
      'travel-stories',
      'photo-galleries',
      'local-culture',
      'itinerary-inspiration',
      'travel-tips',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'search-engine',
      'destination-guides',
      'deals-page',
      'travel-inspiration',
      'contact',
      'about',
    ],
    customer: [
      'dashboard',
      'my-bookings',
      'itinerary',
      'wishlist',
      'reviews',
      'documents',
      'profile',
    ],
    admin: [
      'dashboard',
      'booking-management',
      'partner-management',
      'pricing',
      'fraud-monitoring',
      'reports',
      'compliance',
    ],
    staff: [
      'customer-support',
      'booking-modification',
      'cancellation-processing',
      'refund-approval',
      'partner-communication',
      'issue-resolution',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForTravel() as unknown as BusinessRulesSpec,

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Immersive hero with destination imagery and prominent search bar',
      'Card-based results with photo-first layout and price prominence',
      'Timeline-based itinerary view with day-by-day breakdown',
      'Mobile-first with swipeable destination cards',
      'Split view: map on one side, results on the other',
      'Clean checkout flow with progress indicator and trust signals',
    ],
    color: [
      'Ocean blue (#0077B6) for trust and travel association',
      'Sunset coral (#FF6B6B) for warmth and adventure',
      'Tropical teal (#2EC4B6) for nature and eco-travel',
      'Sand and cream backgrounds for readability',
      'Green (#06D6A0) for eco-friendly and sustainable options',
      'High-contrast alert colors for travel advisories',
      'Gradient overlays on destination photography',
    ],
    typography: [
      'Playful display font for destination headings',
      'Clean sans-serif (Inter) for body and UI',
      'Large price typography for booking cards',
      'Clear hierarchy: destination → dates → price → details',
      'Responsive sizing from mobile to desktop',
      'Icon-enhanced labels for amenity display',
    ],
    interaction: [
      'Interactive map with destination pins and price bubbles',
      'Date picker with flexible calendar and price calendar view',
      'Swipeable destination cards with "heart to save"',
      'Itinerary timeline with expandable day details',
      'Drag-to-reorder itinerary stops',
      'Push notifications for price drops and trip reminders',
      'Offline itinerary access with cached documents',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance for all interfaces',
      'Screen reader support for itinerary and booking details',
      'Keyboard navigation for search and booking flows',
      'Alternative text for all destination imagery',
      'High contrast mode for outdoor use',
      'Multi-language support for international travelers',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Traveler (bookings, reviews, wishlist), Tour Operator (tour management), Hotel Partner (inventory management), Agent (corporate booking), Guide (tour operations), Admin (platform management). OAuth + JWT with 8h expiry. Refresh tokens with 30d. MFA for admin and financial operations. Passport/ID data encrypted separately.',
    data: 'Travel data includes passport information, payment details, booking history, preferences, and personal identification. Passport data AES-256 encrypted with separate key management. PCI DSS Level 1 compliance for payments. GDPR compliance for EU travelers. Travel documents stored with access audit.',
    compliance: ['GDPR for EU traveler data', 'PCI DSS for payment processing', 'DOT air travel regulations', 'EU Package Travel Directive', 'Travel insurance regulations', 'Visa and passport data protection', 'Consumer protection laws per jurisdiction'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Inventory hold TTL expiration and release',
      'Multi-currency price conversion with exchange rate caching',
      'Cancellation fee calculation based on timing',
      'Commission split calculation per partner type',
      'Age-based pricing: infant, child, adult fares',
      'Refund amount calculation after cancellation fee',
      'Travel insurance eligibility check',
      'Fare class availability validation',
    ],
    integration: [
      'Search → GDS query → result aggregation → display → selection → booking',
      'Booking confirmation → ticket issuance → itinerary assembly → email/SMS notification',
      'Cancellation request → partner notification → refund processing → confirmation',
      'Payment processing → booking confirmation → partner payout → commission tracking',
      'Trip completion → review invitation → review submission → rating aggregation',
      'Issue report → partner notification → investigation → resolution → traveler notification',
    ],
    e2e: [
      'Flight search → compare → book → receive e-ticket → check-in → board → review',
      'Hotel search → book → pre-arrival notification → check-in → stay → review',
      'Tour booking → pre-tour reminder → attend → review → rating update',
      'Issue resolution: lost luggage → claim → compensation → satisfaction survey',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForTravel(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForTravel(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForTravel(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForTravel(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForTravel(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForTravel(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForTravel(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForTravel(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForTravel(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const TRAVEL_TOURISM_DOMAIN: DomainModel = {
  id: TRAVEL_TOURISM_PACK.domain,
  domain: TRAVEL_TOURISM_PACK.domain,
  name: TRAVEL_TOURISM_PACK.name,
  label: TRAVEL_TOURISM_PACK.name,
  category: 'travel',
  description: TRAVEL_TOURISM_PACK.description,
  userRoles: [
    { id: 'traveler', name: 'Traveler', typicalFeatures: ['search', 'booking', 'itinerary', 'reviews'], permissions: ['search-travel', 'create-booking', 'manage-itinerary', 'write-reviews'] },
    { id: 'tour-operator', name: 'Tour Operator', typicalFeatures: ['tour-management', 'booking-dashboard', 'calendar'], permissions: ['create-tours', 'manage-availability', 'process-bookings'] },
    { id: 'hotel-partner', name: 'Hotel Partner', typicalFeatures: ['room-management', 'pricing-tools', 'booking-engine'], permissions: ['manage-inventory', 'set-pricing', 'process-bookings'] },
    { id: 'agent', name: 'Travel Agent', typicalFeatures: ['search', 'booking-engine', 'corporate-dashboard'], permissions: ['search-travel', 'book-for-clients', 'manage-corporate-accounts'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'partner-management', 'booking-management', 'billing'], permissions: ['*'] },
  ],
  role: 'traveler',
  standardFeatures: [],
  businessModels: [
    { modelType: 'ota-marketplace', revenueStreams: ['booking-commissions', 'package-markup', 'advertising', 'insurance-commission'], costStructure: ['gds-fees', 'payment-processing', 'engineering', 'marketing', 'customer-support'], pricingStrategy: ['commission-percentage', 'cpm-advertising', 'freemium'] },
    { modelType: 'tour-operator-platform', revenueStreams: ['tour-commission', 'experience-fees', 'operator-subscriptions'], costStructure: ['platform-development', 'guide-verification', 'insurance', 'marketing'], pricingStrategy: ['commission-15-25%', 'subscription-operator', 'curator-fee'] },
    { modelType: 'corporate-travel', revenueStreams: ['subscription', 'booking-fees', 'duty-of-care', 'reporting'], costStructure: ['enterprise-support', 'compliance', 'integration', 'engineering'], pricingStrategy: ['per-traveler-per-month', 'per-booking-fee', 'enterprise-custom'] },
  ],
  technicalPatterns: [
    { category: 'inventory', name: 'Optimistic Concurrency for Bookings', description: 'Seat/room inventory held with optimistic locking and TTL-based release', rationale: 'High-concurrency booking requires non-blocking inventory management' },
    { category: 'integration', name: 'GDS Aggregation Layer', description: 'Unified API layer abstracting Amadeus/Sabre/Travelport differences', rationale: 'Multiple GDS providers require normalized data model' },
    { category: 'pricing', name: 'Multi-Currency Pricing Engine', description: 'Real-time exchange rate updates with currency conversion and display', rationale: 'International travelers need prices in their local currency' },
    { category: 'notification', name: 'Pre-Trip Notification Orchestrator', description: 'Automated notifications for check-in, boarding, visa, and weather', rationale: 'Time-sensitive travel events require reliable multi-channel alerts' },
  ],
  operationalLifecycle: [
    { id: 'search', name: 'Search', description: 'Traveler searches and compares travel options' },
    { id: 'book', name: 'Book', description: 'Booking confirmed with payment and confirmation' },
    { id: 'prepare', name: 'Prepare', description: 'Pre-trip notifications, documents, and check-in' },
    { id: 'travel', name: 'Travel', description: 'Trip execution with real-time support' },
    { id: 'review', name: 'Review', description: 'Post-trip review and rating aggregation' },
  ],
  designPrinciples: [
    { name: 'Immersive Discovery', description: 'Stunning destination imagery with interactive exploration' },
    { name: 'Trust Through Transparency', description: 'All-in pricing with fee breakdown, clear cancellation terms' },
    { name: 'Mobile-First Booking', description: 'Full booking flow optimized for mobile with saved trips offline' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Passport data encryption', description: 'Separate encryption for travel document data', severity: 'critical' },
    { category: 'data', name: 'PCI DSS compliance', description: 'Payment card data handled by certified provider', severity: 'critical' },
    { category: 'compliance', name: 'GDPR for EU travelers', description: 'Consent, erasure, and data portability', severity: 'high' },
    { category: 'compliance', name: 'DOT regulations', description: 'Air travel consumer protection', severity: 'medium' },
  ],
  regulations: [
    { name: 'DOT Air Travel', requirements: ['Transparent pricing', 'Refund eligibility', 'Overbooking compensation'] },
    { name: 'EU Package Travel', requirements: ['Insolvency protection', 'Pre-contract info', 'Cooling-off period'] },
    { name: 'GDPR', requirements: ['Consent management', 'Right to erasure', 'Data portability'] },
    { name: 'Consumer Protection', requirements: ['Cancellation policies', 'Complaint handling', 'Price transparency'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Inventory hold TTL', description: 'Hold release after 15-minute expiry', priority: 'high' },
    { category: 'unit', name: 'Multi-currency conversion', description: 'Real-time exchange rate calculation', priority: 'high' },
    { category: 'integration', name: 'GDS booking flow', description: 'Search → hold → confirm → ticket', priority: 'high' },
    { category: 'e2e', name: 'Flight booking journey', description: 'Search → book → e-ticket → check-in → board', priority: 'medium' },
  ],
  workflows: [
    { id: 'search-to-book', name: 'Search to Book', steps: ['search', 'filter', 'compare', 'select', 'details', 'payment', 'confirm', 'itinerary'], entities: ['search-query', 'booking', 'passenger', 'payment'] },
    { id: 'booking-to-trip', name: 'Booking to Trip', steps: ['confirmed', 'itinerary', 'notifications', 'check-in', 'boarding', 'trip', 'review'], entities: ['booking', 'itinerary', 'check-in', 'review'] },
    { id: 'issue-resolution', name: 'Issue Resolution', steps: ['report', 'categorize', 'investigate', 'resolve', 'close'], entities: ['issue', 'investigation', 'resolution'] },
  ],
  entities: [
    { name: 'Booking', description: 'Travel booking with passengers, itinerary, and payment', invariants: ['inventory held before payment', 'cancellation per fare rules'] },
    { name: 'Itinerary', description: 'Assembled travel plan with all segments and documents', invariants: ['all bookings confirmed', 'documents generated'] },
    { name: 'Review', description: 'Post-trip review with rating and verified booking', invariants: ['requires verified booking', 'moderated before publication'] },
  ],
  invariants: ['inventory held before payment confirmation', 'cancellation enforced per fare rules', 'passport data encrypted separately', 'booking confirmation required before ticket issuance'],
  constraints: ['inventory hold 15 minutes', 'free cancellation 48h before flight, 72h before hotel', 'no-show forfeits booking value', 'travel insurance non-refundable'],
  financialFlows: [
    { name: 'booking-commission', direction: 'in', trigger: 'booking-completed' },
    { name: 'cancellation-fee', direction: 'in', trigger: 'booking-cancelled' },
    { name: 'partner-payout', direction: 'out', trigger: 'booking-completed-or-cancelled' },
    { name: 'refund', direction: 'out', trigger: 'refund-approved' },
    { name: 'insurance-commission', direction: 'in', trigger: 'insurance-purchased' },
  ],
  successMetrics: ['booking-conversion-rate', 'average-order-value', 'cancellation-rate', 'customer-satisfaction-score', 'review-volume', 'partner-retention-rate', 'search-to-booking-time'],
  analytics: { tracked: ['searches', 'bookings', 'revenue', 'popular-destinations', 'cancellation-reasons', 'partner-performance'], dashboards: ['booking-dashboard', 'revenue', 'partner-performance', 'customer-support'] },
  securityRequirements: ['jwt-auth', 'pci-compliance', 'passport-encryption', 'fraud-detection', 'gdpr-compliance', 'travel-document-protection'],
  regulatory: [
    { regulation: 'DOT Air Travel', applies: true, notes: 'Consumer protection for air bookings' },
    { regulation: 'EU Package Travel', applies: true, notes: 'Package holiday protection' },
    { regulation: 'GDPR', applies: true, notes: 'EU traveler data protection' },
    { regulation: 'Consumer Protection', applies: true, notes: 'Per-jurisdiction travel regulations' },
  ],
};
