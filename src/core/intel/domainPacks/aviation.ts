/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Aviation Domain Pack
 *
 * Complete aviation management platform — from flight booking to operations and maintenance.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Shared Type Definitions ────────────────────────────────────────────────────


// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForAviation(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'airline-operations',
      description: 'Full-service airline operating scheduled and charter flights with revenue from passenger tickets, cargo, and ancillary services.',
      pricingExamples: ['Domestic economy $150-400', 'International economy $500-1,500', 'Business class $1,000-5,000', 'Cargo $2-5/kg', 'Ancillary (baggage, seats) $30-150/item'],
    },
    {
      modelType: 'private-jet-charter',
      description: 'On-demand private jet charter service for executive and luxury travel with hourly pricing and membership programs.',
      pricingExamples: ['Light jet $3,000-5,000/hour', 'Midsize jet $5,000-8,000/hour', 'Heavy jet $10,000-18,000/hour', 'Membership $50,000/year deposit', 'Empty leg deals 30-50% off'],
    },
    {
      modelType: 'aviation-training',
      description: 'Flight training school and pilot certification programs with simulators, ground school, and flight hours.',
      pricingExamples: ['Private pilot license $10,000-15,000', 'Instrument rating $5,000-8,000', 'Commercial license $30,000-50,000', 'Simulator session $150-300/hour', 'Discovery flight $199'],
    },
  ];
}

function revenueStreamsForAviation(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Ticket Sales',
      description: 'Revenue from passenger ticket sales for scheduled flights.',
      pricingModel: 'per-passenger',
      examples: ['Domestic economy $150-400', 'International economy $500-1,500', 'Business class $1,000-5,000', 'First class $3,000-10,000'],
    },
    {
      name: 'Charter Pricing',
      description: 'Revenue from private jet charter bookings by the hour.',
      pricingModel: 'per-hour',
      examples: ['Light jet $3,000-5,000/hour', 'Midsize jet $5,000-8,000/hour', 'Heavy jet $10,000-18,000/hour', 'Helicopter charter $1,500-3,000/hour'],
    },
    {
      name: 'Airport Fees',
      description: 'Revenue from airport operations — landing fees, gate fees, parking, and terminal services.',
      pricingModel: 'per-operation',
      examples: ['Landing fee $500-5,000 per flight', 'Gate fee $1,000-3,000 per departure', 'Parking $50-200/hour', 'Passenger facility charge $4.50/ticket'],
    },
    {
      name: 'Training Courses',
      description: 'Revenue from flight training, pilot certification, and aviation education programs.',
      pricingModel: 'per-course or per-hour',
      examples: ['Private pilot license $10,000-15,000', 'Instrument rating $5,000-8,000', 'Simulator session $150-300/hour', 'Ground school $500-1,000'],
    },
    {
      name: 'Maintenance Services',
      description: 'Revenue from aircraft maintenance, repair, and overhaul (MRO) services.',
      pricingModel: 'per-service-hour',
      examples: ['Routine inspection $2,000-5,000', 'Engine overhaul $50,000-200,000', 'Avionics upgrade $10,000-50,000', 'A-check $15,000-30,000'],
    },
  ];
}

function userRoleMatrixForAviation(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'passenger',
      roleName: 'Passenger',
      description: 'Traveler booking flights, managing reservations, checking in, and accessing boarding passes.',
      permissions: ['search-flights', 'create-booking', 'check-in', 'manage-seat', 'access-boarding-pass', 'request-changes'],
      features: ['flight-search', 'booking-management', 'check-in', 'seat-selection', 'boarding-pass', 'trip-management'],
      constraints: ['cancellation per fare rules', 'check-in opens 24h before departure', 'ID verification at security'],
    },
    {
      roleId: 'pilot',
      roleName: 'Pilot',
      description: 'Licensed aircraft operator managing flight assignments, pre-flight checks, and flight documentation.',
      permissions: ['view-assignments', 'perform-pre-flight', 'update-flight-status', 'file-reports', 'request-maintenance'],
      features: ['flight-assignments', 'pre-flight-checklist', 'weather-briefing', 'flight-plans', 'maintenance-requests', 'logbook'],
      constraints: ['license must be current and rated for aircraft type', 'flight time limits per duty regulations', 'pre-flight checklist mandatory before departure'],
    },
    {
      roleId: 'dispatcher',
      roleName: 'Dispatcher',
      description: 'Operations staff coordinating flight plans, weather monitoring, crew scheduling, and flight following.',
      permissions: ['create-flight-plans', 'monitor-weather', 'coordinate-crew', 'manage-gate-assignments', 'send-flight-updates'],
      features: ['flight-planning', 'weather-monitoring', 'crew-scheduling', 'gate-management', 'delay-management'],
      constraints: ['flight plan filed before departure', 'weather minimums per aircraft type', 'crew rest requirements enforced'],
    },
    {
      roleId: 'gate-agent',
      roleName: 'Gate Agent',
      description: 'Airport staff managing check-in, boarding, gate operations, and passenger assistance.',
      permissions: ['process-check-in', 'manage-boarding', 'handle-upgrades', 'assist-passengers', 'report-delays'],
      features: ['check-in-system', 'boarding-control', 'gate-display', 'passenger-assistance', 'delay-notifications'],
      constraints: ['ID verification required', 'boarding closes 15 min before departure', 'standby priority per fare class'],
    },
    {
      roleId: 'maintenance-crew',
      roleName: 'Maintenance Crew',
      description: 'Certified aircraft maintenance technicians performing inspections, repairs, and scheduled maintenance.',
      permissions: ['view-maintenance-schedule', 'log-work', 'request-parts', 'flag-recalls', 'certify-airworthiness'],
      features: ['maintenance-schedule', 'work-orders', 'parts-request', 'inspection-checklist', 'logbook-entry'],
      constraints: ['A&P license required for certified work', 'maintenance per manufacturer manuals', 'airworthiness certification before return to service'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing operations, users, aircraft, scheduling, and billing.',
      permissions: ['*'],
      features: ['dashboard', 'flight-management', 'crew-management', 'aircraft-management', 'billing', 'compliance', 'reports'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'regulatory compliance mandatory'],
    },
  ];
}

function operationalWorkflowsForAviation(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'search-to-book',
      name: 'Search to Book (Flight)',
      description: 'Passenger searches for flights, compares options, selects flight, enters passenger details, and confirms booking.',
      steps: ['search-flights', 'select-dates', 'compare-options', 'select-flight', 'passenger-details', 'seat-selection', 'add-ancillaries', 'payment', 'booking-confirmed', 'e-ticket-issued'],
      entities: ['search-query', 'booking', 'passenger', 'payment', 'ticket'],
      triggers: ['search-performed', 'booking-confirmed', 'ticket-issued', 'check-in-opens'],
    },
    {
      workflowId: 'check-in-to-board',
      name: 'Check-In to Board',
      description: 'Online check-in opens, passenger checks in, boarding pass issued, airport security, gate arrival, boarding, and departure.',
      steps: ['check-in-opens', 'online-check-in', 'boarding-pass-issued', 'airport-arrival', 'security-screening', 'gate-arrival', 'boarding-groups', 'boarding-complete', 'departure'],
      entities: ['check-in', 'boarding-pass', 'passenger', 'flight', 'gate'],
      triggers: ['check-in-opens', 'check-in-complete', 'boarding-starts', 'departure'],
    },
    {
      workflowId: 'flight-to-landing',
      name: 'Flight to Landing',
      description: 'Flight planning, crew briefing, pre-flight checks, takeoff, en-route monitoring, and landing.',
      steps: ['flight-assigned', 'weather-briefing', 'flight-plan-filed', 'pre-flight-check', 'pushback', 'takeoff', 'en-route-monitoring', 'approach', 'landing', 'shutdown'],
      entities: ['flight-plan', 'aircraft', 'crew', 'weather-report', 'maintenance-entry'],
      triggers: ['flight-assigned', 'pre-flight-complete', 'takeoff', 'landing', 'maintenance-due'],
    },
    {
      workflowId: 'maintenance-to-cleared',
      name: 'Maintenance to Cleared',
      description: 'Maintenance due, aircraft grounded, inspection performed, parts replaced, quality check, and airworthiness certification.',
      steps: ['maintenance-due', 'aircraft-grounded', 'inspection-performed', 'parts-identified', 'parts-ordered', 'parts-installed', 'functional-test', 'quality-check', 'airworthiness-certified', 'return-to-service'],
      entities: ['maintenance-request', 'inspection', 'parts-order', 'work-order', 'certification'],
      triggers: ['maintenance-due', 'inspection-complete', 'parts-received', 'airworthiness-certified'],
    },
  ];
}

function stateMachinesForAviation(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Flight',
      states: ['scheduled', 'boarding', 'departed', 'in-air', 'landed', 'cancelled', 'diverted', 'completed'],
      transitions: { scheduled: ['boarding', 'cancelled'], boarding: ['departed'], departed: ['in-air'], 'in-air': ['landed', 'diverted'], diverted: ['landed'], landed: ['completed'] },
      initialState: 'scheduled',
      terminalStates: ['completed', 'cancelled'],
    },
    {
      entityName: 'Booking',
      states: ['search', 'reserved', 'confirmed', 'ticketed', 'checked-in', 'flown', 'cancelled', 'refunded', 'no-show'],
      transitions: { search: ['reserved'], reserved: ['confirmed', 'cancelled'], confirmed: ['ticketed', 'cancelled'], ticketed: ['checked-in', 'no-show'], 'checked-in': ['flown'] },
      initialState: 'search',
      terminalStates: ['flown', 'cancelled', 'refunded', 'no-show'],
    },
    {
      entityName: 'Aircraft',
      states: ['active', 'scheduled-maintenance', 'a-check', 'c-check', 'd-check', 'grounded', 'retired'],
      transitions: { active: ['scheduled-maintenance', 'c-check', 'd-check', 'grounded'], 'scheduled-maintenance': ['a-check', 'grounded'], 'a-check': ['active'], 'c-check': ['active'], 'd-check': ['active'] },
      initialState: 'active',
      terminalStates: ['retired'],
    },
    {
      entityName: 'CrewMember',
      states: ['available', 'assigned', 'pre-flight', 'in-flight', 'post-flight', 'rest-period', 'unavailable'],
      transitions: { available: ['assigned', 'unavailable'], assigned: ['pre-flight'], 'pre-flight': ['in-flight'], 'in-flight': ['post-flight'], 'post-flight': ['rest-period'], 'rest-period': ['available'] },
      initialState: 'available',
      terminalStates: [],
    },
  ];
}

function edgeCasesForAviation(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Flight Diversion Due to Weather',
      description: 'Severe weather at destination forces flight to divert to alternate airport. Passengers stranded, connections missed, crew duty time limits approaching.',
      handling: 'Dispatcher selects alternate airport within fuel range. Captain makes final diversion decision. Passengers notified via app and PA. Connecting passengers identified and rebooked. Crew duty time tracked for mandatory rest. Ground handling arranged at alternate airport.',
      recovery: 'If weather clears: fuel added, passengers boarded, departure resumed. If overnight: hotel and meal vouchers arranged. Rebooking on next available flight. Crew rest enforced per regulations. Passenger compensation per EC261 or DOT rules. Post-diversion report filed with airline operations.',
    },
    {
      scenario: 'Security Alert',
      description: 'Security threat detected on board or at airport requiring immediate response — unruly passenger, suspicious item, or security breach.',
      handling: 'Crew trained in threat assessment and response. Unruly passenger managed per crew procedures. Ground alerted for law enforcement coordination. Flight may be diverted if threat is onboard. Passenger manifest shared with authorities.',
      recovery: 'If diverted: law enforcement meets aircraft. Threat assessment completed. Aircraft security cleared before resuming operations. Passenger and crew deplaned if necessary. Incident report filed with TSA/DHS. Aircraft inspected before return to service.',
    },
    {
      scenario: 'Medical Emergency Onboard',
      description: 'Passenger or crew member experiences medical emergency during flight requiring immediate attention or diversion.',
      handling: 'Crew trained in first aid and emergency procedures. Medical kit deployed. If available: medical professional among passengers consulted. Pilot assesses need for diversion to nearest suitable airport. ATC notified of priority handling. Ground medical services arranged at diversion airport.',
      recovery: 'If diversion: emergency services at airport. Passenger transferred to medical facility. Flight resumes after security clearance. Medical incident logged. Emergency oxygen and kit restocked. Aircraft sanitized if bodily fluids involved.',
    },
  ];
}

function integrationsForAviation(): DomainPack['integrations'] {
  return [
    {
      name: 'GDS (Amadeus/Sabre/Travelport)',
      type: 'distribution',
      description: 'Global Distribution System for flight inventory, pricing, and booking.',
      required: true,
      configuration: 'API credentials with GDS provider. Real-time availability and pricing. Booking confirmation and PNR management. Commission tracking per GDS rules.',
    },
    {
      name: 'ATC Systems',
      type: 'operations',
      description: 'Air Traffic Control integration for flight plans, clearances, and airspace management.',
      required: false,
      configuration: 'Flight plan submission via ICAO format. NOTAM (Notice to Air Mission) retrieval. Weather data integration. Route optimization with ATC constraints.',
    },
    {
      name: 'Maintenance Tracking',
      type: 'operations',
      description: 'Aircraft maintenance tracking per FAA/EASA regulations with A&P certification logging.',
      required: true,
      configuration: 'A-check, B-check, C-check, D-check scheduling per manufacturer intervals. Component life tracking with serial numbers. Airworthiness directive tracking. Maintenance release documentation.',
    },
    {
      name: 'Crew Scheduling',
      type: 'operations',
      description: 'Crew pairings, duty time tracking, and rest period management per FAA/EASA regulations.',
      required: true,
      configuration: 'Crew pairing optimization with aircraft and route. Duty time limits enforced per regulations (FAR 117). Rest period minimums. Qualification tracking per aircraft type.',
    },
    {
      name: 'Payment Processing',
      type: 'payment',
      description: 'Multi-currency payment processing for ticket sales and ancillary services.',
      required: true,
      configuration: 'IATA BSP settlement for travel agencies. Credit card processing with fraud detection. Refund automation per fare rules. Ancillary charge collection.',
    },
    {
      name: 'Weather Data',
      type: 'data',
      description: 'METAR, TAF, SIGMET, and convective weather data for flight planning.',
      required: true,
      configuration: 'Real-time weather data feeds. Turbulence and icing reports. Volcanic ash advisory. Wind and temperature aloft data for flight planning.',
    },
  ];
}

function technicalArchitectureForAviation(): TechnicalArchitectureDef {
  return {
    patterns: ['Real-time flight status updates via WebSocket', 'Crew pairing optimization with constraint solver', 'Seat inventory management with fare class rules', 'Event-driven maintenance scheduling', 'Distributed flight plan computation'],
    infrastructure: ['PostgreSQL for bookings, flight schedules, and crew data', 'Redis for seat inventory cache and real-time flight status', 'Kafka for flight status events and notifications', 'S3-compatible storage for flight documents and logs', 'GraphQL for flexible flight search queries', 'CDN for passenger-facing content'],
    dataFlow: 'Passenger searches flights → availability queried across aircraft and routes → pricing computed by fare rules → booking confirmed → seat allocated → check-in 24h before → boarding pass generated → flight departs → real-time status updates via WebSocket → flight completes → crew rest enforced → aircraft maintenance scheduled → feedback collected.',
    scalability: 'Flight search scaled horizontally with fare rule caching. Seat inventory managed via Redis with atomic operations. Real-time flight status via WebSocket with fan-out. Maintenance scheduling batched during overnight hours. Crew pairing computed offline with optimization engine.',
  };
}

function regulatoryComplianceForAviation(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'FAA / EASA Regulations',
      jurisdiction: 'United States / Europe',
      requirements: ['Pilot certification and rating tracking', 'Aircraft airworthiness certification', 'Maintenance schedule compliance (A/B/C/D checks)', 'Crew duty time limits', 'Incident reporting', 'Safety management system'],
      impact: 'Platform enforces crew duty time limits. Maintenance scheduling per FAA/EASA intervals. Pilot and aircraft certification tracked. Incident reporting workflows. Safety management system documentation.',
    },
    {
      regulation: 'TSA Security Requirements',
      jurisdiction: 'United States',
      requirements: ['Passenger and baggage screening', 'Secure Flight passenger data submission', 'Known crewmember identification', 'Suspicious activity reporting', 'Airport security protocols'],
      impact: 'Passenger manifest submitted to Secure Flight. Crew identification verified. Security alert workflows. Airport security coordination.',
    },
    {
      regulation: 'ICAO Standards',
      jurisdiction: 'Global',
      requirements: ['Flight plan format and submission', ' NOTAM distribution', 'Aircraft registration standards', 'Safety reporting', 'Environmental standards (CORSIA)'],
      impact: 'Flight plans submitted in ICAO format. NOTAM integration for route planning. Aircraft registration tracking. Safety reporting per ICAO format.',
    },
    {
      regulation: 'EC261 / Consumer Protection',
      jurisdiction: 'European Union',
      requirements: ['Compensation for flight delays and cancellations', 'Right to reimbursement or re-routing', 'Care and assistance during delays', 'Advance notice for schedule changes'],
      impact: 'Automated delay and cancellation detection. EC261 compensation calculation and processing. Passenger notification of rights. Rebooking automation.',
    },
  ];
}

function businessRulesForAviation(): BusinessRulesSpec {
  return {
    checkIn: [
      'Check-in opens 24 hours before departure, closes 90 minutes before domestic, 120 minutes before international.',
    ],
    crewDutyTime: [
      'Crew duty time: maximum 8 hours flight time per duty period. Extended duty up to 10 hours with rest augmentation. 10-hour minimum rest between duties.',
    ],
    maintenance: [
      'Aircraft maintenance: A-check every 400-600 flight hours, C-check every 20-24 months, D-check every 6-10 years.',
    ],
    fareRules: [
      'Fare rules: economy refundable with fee, basic economy non-refundable. Change fee $75-150 for economy, waived for premium cabins.',
    ],
    overbooking: [
      'Overbooking limit: maximum 5% over capacity for domestic, 0% for international flights per regulations.',
    ],
    baggage: [
      'Baggage allowance: 1 carry-on (22x14x9, 7kg) + 1 personal item. Checked bag 23kg standard, $35 first bag fee.',
    ],
    security: [
      'No-fly list screening: passenger name matched against government watch lists before boarding.',
    ],
  };
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const AVIATION_PACK: DomainPack = {
  domain: 'aviation',
  name: 'Aviation Management & Booking',
  description: 'Complete aviation management platform — from flight booking to operations and maintenance. Covers passenger booking and check-in, crew scheduling, flight operations, aircraft maintenance tracking, gate management, and compliance with FAA/EASA, TSA, and ICAO regulations.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Passenger Flights', 'Private Charter', 'Training', 'Maintenance', 'Cargo', 'Airport Services'],
    features: [
      'flight-search',
      'seat-selection',
      'boarding-pass',
      'online-checkin',
      'flight-status',
      'crew-scheduling',
      'maintenance-tracking',
      'cargo-booking',
      'training-courses',
      'weather-briefing',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['electronic-ticket', 'mobile-boarding', 'airport-checkin', 'curbside-checkin', 'cargo-handling'],
    features: [
      'e-ticket',
      'mobile-boarding',
      'baggage-tracking',
      'flight-updates',
      'lounge-access',
      'priority-boarding',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'flight-search',
      'booking-management',
      'check-in',
      'seat-selection',
      'boarding-pass',
      'flight-status',
      'trip-management',
      'loyalty-program',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'flight-scheduling',
      'crew-management',
      'aircraft-management',
      'maintenance-management',
      'gate-management',
      'baggage-handling',
      'fuel-management',
      'operations-control',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'destination-guides',
      'travel-tips',
      'loyalty-benefits',
      'fleet-showcase',
      'pilot-stories',
      'safety-commitment',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'flight-search',
      'flight-status',
      'check-in',
      'destinations',
      'contact',
      'careers',
    ],
    customer: [
      'dashboard',
      'my-bookings',
      'check-in',
      'boarding-pass',
      'loyalty',
      'profile',
    ],
    admin: [
      'operations-dashboard',
      'flight-management',
      'crew-management',
      'aircraft-management',
      'maintenance',
      'billing',
      'compliance',
    ],
    staff: [
      'gate-management',
      'check-in-counter',
      'boarding-control',
      'flight-status-board',
      'delay-management',
      'passenger-assistance',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForAviation(),

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Flight search as primary hero with date, origin, destination, and passenger inputs',
      'Clean departure/arrival card design with prominent times and gate numbers',
      'Mobile-first boarding pass with barcode and QR code',
      'Operations dashboard with live flight map and status grid',
      'Tabbed navigation for search, bookings, check-in, and status',
      'Real-time notification overlay for flight changes and delays',
    ],
    color: [
      'Aviation blue (#0066CC) for trust and sky association',
      'Runway gray (#607D8B) for infrastructure and operations',
      'Signal green (#4CAF50) for on-time and approved status',
      'Alert amber (#FFC107) for delays and warnings',
      'Alert red (#F44336) for cancellations and emergencies',
      'Sky gradient from light to dark blue for visual hierarchy',
      'White for boarding pass and document clarity',
    ],
    typography: [
      'Technical sans-serif for flight numbers and codes',
      'Clean sans-serif (Inter) for body and UI',
      'Bold condensed for departure/arrival times',
      'Monospace for airport codes and flight identifiers',
      'Large, high-contrast for gate and boarding information',
      'Clear status indicators with color and iconography',
    ],
    interaction: [
      'Interactive flight map with route visualization',
      'One-tap check-in with automatic seat assignment',
      'Mobile boarding pass with offline barcode storage',
      'Push notifications for gate changes and delays',
      'Real-time flight status updates on saved trips',
      'Seat map with interactive selection and aircraft configuration',
      'Flight status widget for notification center',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance',
      'Screen reader support for flight information',
      'High contrast for gate display visibility',
      'Keyboard navigation for check-in flows',
      'Alternative text for aircraft and destination imagery',
      'Multi-language support for international travelers',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Passenger (booking, check-in), Pilot (flight operations, pre-flight), Dispatcher (flight planning, monitoring), Gate Agent (check-in, boarding), Maintenance Crew (aircraft inspections), Admin (full platform). JWT with 4h expiry. Refresh tokens with 7d. MFA for crew and admin. Biometric for pilot access in some jurisdictions.',
    data: 'Passenger data includes PII, passport/ID information, travel history, and payment data. Pilot data includes certifications, flight hours, and medical records. Flight data includes plans, routes, and operational details. PCI DSS for payments. Pilot medical data HIPAA-adjacent. Flight data protected per aviation security regulations.',
    compliance: ['FAA/EASA aviation regulations', 'TSA security requirements', 'ICAO standards', 'EC261 consumer protection', 'No-fly list screening', 'Pilot duty time regulations', 'Aircraft airworthiness standards'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Crew duty time limit enforcement (FAR 117)',
      'Seat allocation with fare class rules',
      'Fare class availability and pricing rules',
      'Check-in window enforcement (24h open, 90m close)',
      'Maintenance interval calculation (A-check, C-check)',
      'Overbooking limit enforcement (5% max)',
      'EC261 compensation calculation',
      'No-fly list screening match',
    ],
    integration: [
      'Flight search → pricing → booking → e-ticket → check-in → boarding',
      'Flight plan filing → weather briefing → ATC clearance → departure → en-route → landing',
      'Maintenance due → grounding → inspection → parts → repair → certification → return-to-service',
      'Crew assignment → duty time check → briefing → flight → rest period → next assignment',
      'Passenger check-in → boarding pass → gate scan → boarding → departure confirmation',
    ],
    e2e: [
      'Passenger journey: search → book → check-in → board → flight → baggage claim',
      'Flight operations: dispatch planning → crew briefing → pre-flight → departure → landing → post-flight',
      'Maintenance cycle: due → inspect → repair → certify → return to service',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForAviation(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForAviation(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForAviation(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForAviation(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForAviation(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForAviation(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForAviation(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForAviation(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForAviation(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const AVIATION_DOMAIN: DomainModel = {
  id: AVIATION_PACK.domain,
  domain: AVIATION_PACK.domain,
  name: AVIATION_PACK.name,
  label: AVIATION_PACK.name,
  category: 'aviation',
  description: AVIATION_PACK.description,
  userRoles: [
    { id: 'passenger', name: 'Passenger', typicalFeatures: ['flight-search', 'booking-management', 'check-in', 'boarding-pass'], permissions: ['search-flights', 'create-booking', 'check-in', 'manage-seat'] },
    { id: 'pilot', name: 'Pilot', typicalFeatures: ['flight-assignments', 'pre-flight-checklist', 'weather-briefing', 'flight-plans'], permissions: ['view-assignments', 'perform-pre-flight', 'update-flight-status', 'file-reports'] },
    { id: 'dispatcher', name: 'Dispatcher', typicalFeatures: ['flight-planning', 'weather-monitoring', 'crew-scheduling', 'gate-management'], permissions: ['create-flight-plans', 'monitor-weather', 'coordinate-crew', 'manage-gates'] },
    { id: 'gate-agent', name: 'Gate Agent', typicalFeatures: ['check-in-system', 'boarding-control', 'gate-display', 'passenger-assistance'], permissions: ['process-check-in', 'manage-boarding', 'handle-upgrades', 'report-delays'] },
    { id: 'maintenance-crew', name: 'Maintenance Crew', typicalFeatures: ['maintenance-schedule', 'work-orders', 'parts-request', 'inspection-checklist'], permissions: ['view-maintenance', 'log-work', 'request-parts', 'certify-airworthiness'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'flight-management', 'crew-management', 'aircraft-management'], permissions: ['*'] },
  ],
  role: 'passenger',
  standardFeatures: [],
  businessModels: [
    { modelType: 'airline-operations', revenueStreams: ['ticket-sales', 'cargo-revenue', 'ancillary-services', 'loyalty-revenue'], costStructure: ['fuel', 'aircraft', 'crew', 'airport-fees', 'maintenance'], pricingStrategy: ['dynamic-pricing', 'fare-classes', 'ancillary-upsell'] },
    { modelType: 'private-jet-charter', revenueStreams: ['hourly-charter', 'membership-fees', 'empty-leg-sales'], costStructure: ['aircraft', 'crew', 'fuel', 'insurance', 'hangar'], pricingStrategy: ['per-hour', 'membership-deposit', 'empty-leg-discount'] },
    { modelType: 'aviation-training', revenueStreams: ['training-courses', 'simulator-time', 'certification-fees'], costStructure: ['simulators', 'instructors', 'aircraft', 'facilities'], pricingStrategy: ['per-course', 'per-hour', 'certification-fee'] },
  ],
  technicalPatterns: [
    { category: 'operations', name: 'Real-Time Flight Status', description: 'WebSocket-based live flight status updates to passengers and operations', rationale: 'Time-sensitive flight information requires immediate push delivery' },
    { category: 'inventory', name: 'Seat Inventory Management', description: 'Fare class-based seat allocation with atomic inventory operations', rationale: 'Overbooking and fare class rules require precise seat management' },
    { category: 'compliance', name: 'Crew Duty Time Tracker', description: 'Real-time enforcement of FAA/EASA duty time limits', rationale: 'Regulatory compliance for crew scheduling is mandatory' },
    { category: 'safety', name: 'Maintenance Tracking System', description: 'Automated maintenance scheduling per manufacturer intervals', rationale: 'Airworthiness requires precise maintenance tracking' },
  ],
  operationalLifecycle: [
    { id: 'search', name: 'Search', description: 'Passenger searches and selects flights' },
    { id: 'book', name: 'Book', description: 'Booking confirmed with seat allocation' },
    { id: 'prepare', name: 'Prepare', description: 'Check-in, boarding pass, and pre-flight preparations' },
    { id: 'fly', name: 'Fly', description: 'Boarding, flight execution, and landing' },
    { id: 'complete', name: 'Complete', description: 'Disembarkation and post-flight activities' },
  ],
  designPrinciples: [
    { name: 'Flight Status Clarity', description: 'Prominent departure/arrival times with real-time updates' },
    { name: 'Boarding Pass Simplicity', description: 'Clean, scannable mobile boarding pass with essential info only' },
    { name: 'Safety First', description: 'Safety information prominent, regulatory compliance visible' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Crew authentication', description: 'Biometric and MFA for pilot and crew access', severity: 'critical' },
    { category: 'data', name: 'Watch list screening', description: 'No-fly list integration per TSA requirements', severity: 'critical' },
    { category: 'compliance', name: 'FAA/EASA compliance', description: 'Maintenance, crew time, and airworthiness tracking', severity: 'critical' },
    { category: 'compliance', name: 'EC261 compensation', description: 'EU passenger rights automation', severity: 'medium' },
  ],
  regulations: [
    { name: 'FAA/EASA', requirements: ['Crew certification', 'Aircraft airworthiness', 'Maintenance intervals', 'Duty time limits'] },
    { name: 'TSA', requirements: ['Passenger screening', 'Secure Flight', 'No-fly list'] },
    { name: 'ICAO', requirements: ['Flight plan format', 'NOTAM distribution', 'Safety reporting'] },
    { name: 'EC261', requirements: ['Delay compensation', 'Re-routing rights', 'Care and assistance'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Duty time enforcement', description: 'FAA duty time limit validation', priority: 'critical' },
    { category: 'unit', name: 'Seat inventory', description: 'Fare class allocation and overbooking', priority: 'high' },
    { category: 'integration', name: 'Flight operations flow', description: 'Planning → briefing → execution → completion', priority: 'high' },
    { category: 'e2e', name: 'Passenger journey', description: 'Search → book → check-in → board → fly', priority: 'medium' },
  ],
  workflows: [
    { id: 'search-to-book', name: 'Search to Book', steps: ['search', 'compare', 'select', 'details', 'seat', 'payment', 'confirm', 'ticket'], entities: ['search', 'booking', 'passenger', 'ticket'] },
    { id: 'check-in-to-board', name: 'Check-In to Board', steps: ['check-in-open', 'check-in', 'boarding-pass', 'security', 'gate', 'board', 'depart'], entities: ['check-in', 'boarding-pass', 'flight', 'gate'] },
    { id: 'flight-to-landing', name: 'Flight to Landing', steps: ['assign', 'brief', 'pre-flight', 'takeoff', 'monitor', 'approach', 'land'], entities: ['flight-plan', 'aircraft', 'crew', 'weather'] },
  ],
  entities: [
    { name: 'Flight', description: 'Flight with route, schedule, aircraft, and crew assignment', invariants: ['crew duty time enforced', 'airworthiness certified'] },
    { name: 'Booking', description: 'Passenger booking with seat, fare class, and ticket', invariants: ['check-in window enforced', 'fare rules applied'] },
    { name: 'Aircraft', description: 'Aircraft with maintenance schedule and airworthiness status', invariants: ['maintenance intervals per manufacturer', 'airworthiness certified before service'] },
  ],
  invariants: ['crew duty time within regulatory limits', 'airworthiness certified before each flight', 'passenger screened before boarding', 'overbooking within 5% limit'],
  constraints: ['check-in 24h before, 90m before departure', 'max crew duty 8-10 hours', 'overbooking max 5%', 'maintenance intervals per manufacturer'],
  financialFlows: [
    { name: 'ticket-sale', direction: 'in', trigger: 'booking-confirmed' },
    { name: 'ancillary', direction: 'in', trigger: 'baggage-seat-extras-purchased' },
    { name: 'fuel-cost', direction: 'out', trigger: 'flight-completed' },
    { name: 'crew-pay', direction: 'out', trigger: 'flight-completed' },
    { name: 'maintenance-cost', direction: 'out', trigger: 'maintenance-completed' },
  ],
  successMetrics: ['on-time-performance', 'load-factor', 'passenger-satisfaction', 'cancellation-rate', 'delay-minutes-per-flight', 'maintenance-on-time-rate', 'crew-utilization'],
  analytics: { tracked: ['bookings', 'revenue', 'on-time-performance', 'load-factor', 'customer-satisfaction', 'maintenance-events'], dashboards: ['operations-dashboard', 'revenue-dashboard', 'crew-dashboard', 'maintenance-dashboard'] },
  securityRequirements: ['jwt-auth', 'mfa-crew', 'watchlist-screening', 'pci-compliance', 'flight-data-protection', 'audit-logging'],
  regulatory: [
    { regulation: 'FAA/EASA', applies: true, notes: 'Aviation safety and crew regulations' },
    { regulation: 'TSA', applies: true, notes: 'Security screening and no-fly list' },
    { regulation: 'ICAO', applies: true, notes: 'International flight standards' },
    { regulation: 'EC261', applies: true, notes: 'EU passenger compensation' },
  ],
};
