/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Real Estate Domain Pack
 *
 * Complete real estate platform — from property listing to closing and property management.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForRealEstate(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'property-listing-marketplace',
      description: 'Zillow/Realtor.com-style platform connecting buyers, sellers, and renters with property listings. Revenue from listing fees, lead generation, and advertising.',
      pricingExamples: ['Basic listing free', 'Premium listing $99.95/month', 'Agent subscription $29/month per zip code', 'Lead generation $2-5/lead'],
    },
    {
      modelType: 'property-management-saas',
      description: 'Software for property managers handling tenant screening, lease management, maintenance requests, and rent collection.',
      pricingExamples: ['Starter $50/month per unit', 'Professional $80/month per unit', 'Enterprise custom pricing', 'Onboarding fee $500 per property'],
    },
    {
      modelType: 'real-estate-transaction-platform',
      description: 'End-to-end transaction management platform for agents and brokerages with CRM, document management, e-signature, and commission tracking.',
      pricingExamples: ['Agent $69/month', 'Team $199/month', 'Brokerage $499/month', 'Transaction fee 0.5% per closed deal'],
    },
  ];
}

function revenueStreamsForRealEstate(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Listing Fees',
      description: 'Revenue from property listing services ranging from basic free listings to premium featured placements.',
      pricingModel: 'per-listing or subscription',
      examples: ['Basic listing free', 'Premium listing $99.95/month', 'Featured listing $299.95/30 days'],
    },
    {
      name: 'Commission on Sale/Rent',
      description: 'Transaction fees or commission split on successful property sales or rental placements.',
      pricingModel: 'percentage-of-transaction',
      examples: ['Rental placement 50-100% of one month rent', 'Sale transaction 0.5-1% platform fee', 'Premium buyer agent fee $2-5/lead'],
    },
    {
      name: 'Property Management Fees',
      description: 'Recurring fees from property management software subscriptions.',
      pricingModel: 'per-unit-per-month',
      examples: ['$50-80/month per unit', 'Vacancy fee waived during vacancy', 'Setup fee $500 per property'],
    },
    {
      name: 'Premium Subscriptions',
      description: 'Subscription revenue from enhanced listing features, market reports, and lead access.',
      pricingModel: 'monthly/annual subscription',
      examples: ['Agent subscription $29/month', 'Market analytics $49/month', 'Lead access $99/month'],
    },
    {
      name: 'Advertising & Sponsorship',
      description: 'Revenue from mortgage lenders, moving companies, and home service advertisers.',
      pricingModel: 'cpm or cpc',
      examples: ['Mortgage lender banner $5,000/month', 'CPC advertising $1.50/click', 'Sponsored listing $500/month'],
    },
  ];
}

function userRoleMatrixForRealEstate(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'buyer',
      roleName: 'Buyer',
      description: 'Individual or family searching for properties to purchase. Browses listings, saves favorites, requests showings, and makes offers.',
      permissions: ['browse-listings', 'save-favorites', 'request-showing', 'make-offers', 'save-searches'],
      features: ['property-search', 'saved-homes', 'showing-requests', 'offer-management', 'mortgage-calculator', 'neighborhood-info'],
      constraints: ['cannot create listings', 'offer submission verified by agent', 'contact info shared only with consent'],
    },
    {
      roleId: 'seller',
      roleName: 'Seller',
      description: 'Property owner listing their property for sale or rent. Manages listing, reviews offers, and coordinates closing.',
      permissions: ['create-listings', 'manage-showings', 'review-offers', 'accept-offers', 'manage-documents'],
      features: ['listing-management', 'showing-schedule', 'offer-review', 'document-center', 'market-analysis'],
      constraints: ['listing must pass verification', 'price changes logged', 'offer counter limited to 3 rounds per platform rules'],
    },
    {
      roleId: 'agent',
      roleName: 'Real Estate Agent',
      description: 'Licensed real estate professional managing buyer/seller relationships, listings, showings, and transactions.',
      permissions: ['create-listings', 'manage-clients', 'schedule-showings', 'submit-offers', 'manage-transactions', 'access-mls'],
      features: ['crm', 'listing-tools', 'showing-management', 'transaction-tracking', 'commission-tracking', 'market-reports'],
      constraints: ['license must be active and verified', 'commission agreements per brokerage rules', 'client data private per state law'],
    },
    {
      roleId: 'property-manager',
      roleName: 'Property Manager',
      description: 'Professional managing rental properties — tenant screening, lease management, maintenance, and rent collection.',
      permissions: ['manage-properties', 'screen-tenants', 'manage-leases', 'process-maintenance', 'collect-rent', 'evict-per-legal-process'],
      features: ['property-dashboard', 'tenant-database', 'lease-management', 'maintenance-tracking', 'rent-collection', 'accounting'],
      constraints: ['background check consent required', 'eviction per local law', 'security deposit handling per state law', 'rent increases per lease terms'],
    },
    {
      roleId: 'tenant',
      roleName: 'Tenant',
      description: 'Individual renting a property. Pays rent, submits maintenance requests, and communicates with property manager.',
      permissions: ['view-own-lease', 'submit-maintenance', 'pay-rent', 'communicate-with-pm', 'view-payment-history'],
      features: ['lease-view', 'rent-payment', 'maintenance-requests', 'document-access', 'message-center'],
      constraints: ['cannot modify lease terms', 'maintenance response time per SLA', 'rent payment deadline per lease'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing properties, users, agents, billing, and platform configuration.',
      permissions: ['*'],
      features: ['dashboard', 'property-management', 'user-management', 'agent-verification', 'billing', 'reports', 'compliance'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'license verification required for agents'],
    },
  ];
}

function operationalWorkflowsForRealEstate(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'list-to-sale',
      name: 'List to Sale',
      description: 'Property listed, marketed, showings conducted, offers received and negotiated, contract signed, inspection completed, and sale closed.',
      steps: ['listing-creation', 'photo-shoot', 'listing-published', 'showing-coordination', 'offer-received', 'offer-negotiation', 'contract-signed', 'escrow-opened', 'inspection-completed', 'appraisal-approved', 'loan-approved', 'closing', 'sale-recorded'],
      entities: ['listing', 'showing', 'offer', 'contract', 'escrow', 'inspection', 'closing'],
      triggers: ['listing-created', 'showing-scheduled', 'offer-submitted', 'contract-signed', 'escrow-opened', 'closed'],
    },
    {
      workflowId: 'application-to-lease',
      name: 'Application to Lease',
      description: 'Tenant applies for rental, background check performed, lease drafted and signed, unit inspected, and keys handed over.',
      steps: ['application-received', 'background-check', 'credit-check', 'income-verification', 'lease-drafted', 'lease-signed', 'security-deposit-collected', 'unit-inspection', 'move-in-documented', 'keys-handed-over'],
      entities: ['application', 'background-check', 'lease', 'security-deposit', 'move-in-report'],
      triggers: ['application-submitted', 'screening-complete', 'lease-signed', 'keys-handed'],
    },
    {
      workflowId: 'maintenance-request-to-resolution',
      name: 'Maintenance Request to Resolution',
      description: 'Tenant submits maintenance request, property manager triages, contractor dispatched, work completed, and quality verified.',
      steps: ['request-submitted', 'triage-and-categorization', 'contractor-assigned', 'contractor-dispatched', 'work-completed', 'quality-inspection', 'tenant-notified', 'request-closed'],
      entities: ['maintenance-request', 'work-order', 'contractor', 'invoice', 'completion-report'],
      triggers: ['request-submitted', 'contractor-dispatched', 'work-completed', 'tenant-approved'],
    },
    {
      workflowId: 'inspection-to-close',
      name: 'Inspection to Close',
      description: 'Property inspection scheduled and conducted, issues identified, repairs negotiated, re-inspection, and closing approved.',
      steps: ['inspection-requested', 'inspector-assigned', 'inspection-conducted', 'report-generated', 'issues-identified', 'repair-negotiation', 'repairs-completed', 're-inspection', 'report-finalized', 'closing-approved'],
      entities: ['inspection', 'report', 'repair-item', 'closing-disclosure'],
      triggers: ['inspection-scheduled', 'inspection-complete', 'repairs-agreed', 'closing-approved'],
    },
  ];
}

function stateMachinesForRealEstate(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Listing',
      states: ['draft', 'pending-review', 'active', 'under-contract', 'pending', 'closed', 'expired', 'withdrawn', 'sold'],
      transitions: { draft: ['pending-review'], 'pending-review': ['active'], active: ['under-contract', 'expired', 'withdrawn'], 'under-contract': ['pending', 'active'], pending: ['closed', 'active'] },
      initialState: 'draft',
      terminalStates: ['closed', 'sold', 'expired', 'withdrawn'],
    },
    {
      entityName: 'Offer',
      states: ['draft', 'submitted', 'viewed', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn'],
      transitions: { draft: ['submitted'], submitted: ['viewed', 'expired', 'withdrawn'], viewed: ['countered', 'accepted', 'rejected'], countered: ['accepted', 'rejected'] },
      initialState: 'draft',
      terminalStates: ['accepted', 'rejected', 'expired', 'withdrawn'],
    },
    {
      entityName: 'Lease',
      states: ['application', 'screening', 'approved', 'lease-draft', 'signed', 'active', 'notice-given', 'expired', 'terminated'],
      transitions: { application: ['screening'], screening: ['approved'], approved: ['lease-draft'], 'lease-draft': ['signed'], signed: ['active'], active: ['notice-given', 'terminated'], 'notice-given': ['expired'] },
      initialState: 'application',
      terminalStates: ['expired', 'terminated'],
    },
    {
      entityName: 'MaintenanceRequest',
      states: ['submitted', 'triaged', 'assigned', 'in-progress', 'completed', 'tenant-review', 'closed', 'cancelled'],
      transitions: { submitted: ['triaged', 'cancelled'], triaged: ['assigned'], assigned: ['in-progress', 'cancelled'], 'in-progress': ['completed'], completed: ['tenant-review'], 'tenant-review': ['closed'] },
      initialState: 'submitted',
      terminalStates: ['closed', 'cancelled'],
    },
  ];
}

function edgeCasesForRealEstate(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Inspection Failure',
      description: 'Home inspection reveals major structural issues, electrical hazards, or pest infestation not disclosed by seller.',
      handling: 'Inspection report generated with detailed findings and photos. Repair estimates obtained from contractors. Buyer notified with options: negotiate repair credits, request repairs before closing, or walk away per contract contingency. Seller notified of issues with response deadline.',
      recovery: 'If buyer walks away: escrow returned, contract terminated per contingency clause. If repairs negotiated: repair addendum added to contract, escrow held until completion. If price renegotiation: amended purchase agreement executed. If hidden defect discovered post-close: legal counsel consulted for potential disclosure violation claim.',
    },
    {
      scenario: 'Financing Fall-Through',
      description: 'Buyer financing falls through at closing — loan denied, appraisal comes in low, or buyer loses job before closing.',
      handling: 'Financing contingency clause reviewed. Buyer notified immediately with cure period (typically 3-7 days). Alternative financing options explored (second lender, bridge loan, cash-out refinance). Seller notified per contract terms. Escrow process continues during cure period.',
      recovery: 'If buyer obtains alternative financing: closing rescheduled, all parties notified. If financing cannot be secured: buyer forfeits earnest money deposit (per contract terms), property relisted. Seller compensation from deposit negotiated. Platform facilitates re-listing with historical offer data.',
    },
    {
      scenario: 'Tenant Dispute / Non-Payment',
      description: 'Tenant fails to pay rent, violates lease terms, or disputes maintenance responsibilities with property manager.',
      handling: 'Late notice sent per state requirements (typically 3-5 days). Payment plan offered if tenant communicates. Lease violation documented with photos and records. Eviction process initiated per local law if unresolved. Security deposit accounting prepared.',
      recovery: 'If payment received: late fee applied, account current. If payment plan: agreement drafted with payment schedule. If eviction: legal counsel engaged, court filing prepared, tenant screened for future rentals. Property re-leased with updated screening criteria.',
    },
    {
      scenario: 'Property Damage Between Contract and Closing',
      description: 'Property damaged by fire, flood, or vandalism between contract signing and closing date.',
      handling: 'Buyer notified immediately. Insurance claim status checked. Property condition documented with photos. Contract reviewed for risk-of-loss clause. Walk-through inspection rescheduled. Closing may be delayed or cancelled.',
      recovery: 'If damage repairable: repair cost negotiated as credit or escrow holdback. If seller repairs before closing: contractor verified, re-inspection completed. If damage exceeds repair feasibility: contract terminated per risk-of-loss clause, earnest money returned to buyer, property relisted with damage disclosure.',
    },
  ];
}

function integrationsForRealEstate(): DomainPack['integrations'] {
  return [
    {
      name: 'MLS (Multiple Listing Service)',
      type: 'data',
      description: 'Integration with local MLS databases for property listing data, comparable sales, and market statistics.',
      required: false,
      configuration: 'RETS or RESO Web API integration. Listing import with automatic field mapping. Photo and virtual tour sync. Sold data and comparable sales (comps) integration. Agent license verification per MLS rules.',
    },
    {
      name: 'Title Company',
      type: 'transaction',
      description: 'Integration with title companies for title search, insurance, and closing coordination.',
      required: false,
      configuration: 'Title order API for automated escrow initiation. Document generation for title commitment. Closing coordination with e-signature. Recording fee calculation per county.',
    },
    {
      name: 'Payment Processing',
      type: 'financial',
      description: 'Payment processing for application fees, security deposits, rent collection, and closing costs.',
      required: true,
      configuration: 'ACH for rent and large deposits. Credit card for application fees. Escrow integration for closing funds. Automated recurring rent collection with late fee triggers. Security deposit escrow tracking.',
    },
    {
      name: 'Background Check & Credit',
      type: 'verification',
      description: 'Tenant screening services for background checks, credit reports, eviction history, and income verification.',
      required: false,
      configuration: 'API integration with screening providers (TransUnion SmartMove, CoreLogic). FCRA-compliant consent capture. Report generation and storage. Adverse action workflow for disqualifying results.',
    },
    {
      name: 'E-Signature Platform',
      type: 'document',
      description: 'DocuSign or HelloSign for lease agreements, purchase contracts, disclosures, and closing documents.',
      required: false,
      configuration: 'Template-based document generation per property type and jurisdiction. Signature routing with reminders. Audit trail for all signed documents. Integration with document management system.',
    },
    {
      name: 'Mortgage & Lending',
      type: 'financial',
      description: 'Mortgage lender integration for pre-approval, loan application, and rate comparison.',
      required: false,
      configuration: 'Loan application API integration. Rate comparison display. Pre-approval verification. Closing cost estimator. Mortgage insurance calculation.',
    },
  ];
}

function technicalArchitectureForRealEstate(): TechnicalArchitectureDef {
  return {
    patterns: ['Geospatial-first architecture for property mapping', 'Event-driven listing updates and price changes', 'Full-text search with faceted filtering for property search', 'Document management with version control for contracts', 'Real-time notification for offer and showing events'],
    infrastructure: ['PostgreSQL + PostGIS for geospatial property data', 'Elasticsearch for property search with geo-distance queries', 'S3-compatible storage for property photos and documents', 'Redis for session cache and real-time notifications', 'Kafka for listing update events and MLS sync', 'Mapbox or Google Maps API for property mapping'],
    dataFlow: 'Property listed by agent → MLS sync via RETS API → listing indexed in Elasticsearch → property photos uploaded to S3 → buyer searches with geo-filters → matching results displayed with map pins → showing requested → agent notified → showing completed → offer submitted → offer event published → contract drafted via e-signature → escrow opened with title company → inspection scheduled → closing coordinated → sale recorded → tax records updated.',
    scalability: 'Property search optimized with Elasticsearch sharding and geo-distance indexing. Photo delivery via CDN with responsive image sizes. MLS sync batched for large market areas. Real-time notifications via WebSocket with fan-out for high-traffic listings. Database partitioned by geography for regional scaling.',
  };
}

function regulatoryComplianceForRealEstate(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'Fair Housing Act',
      jurisdiction: 'United States (federal)',
      requirements: ['No discrimination based on race, color, religion, sex, handicap, familial status, national origin', 'Advertising must not indicate preference or limitation', 'Reasonable accommodation for disabled persons', 'Accessibility requirements for multifamily housing built after 1990'],
      impact: 'Platform must enforce non-discriminatory search and listing practices. Automated screening for discriminatory language in listings and communications. Accessibility filters for ADA-compliant properties. Audit logging for all user interactions for compliance review.',
    },
    {
      regulation: 'Real Estate Licensing Laws',
      jurisdiction: 'Per-state',
      requirements: ['Agent license verification and active status checking', 'License number display on all communications', 'Supervision requirements for unlicensed assistants', 'Continuing education tracking', 'Disciplinary action tracking'],
      impact: 'Agent onboarding requires license verification. License status monitored with expiration alerts. Supervision chains documented for unlicensed staff. Platform liability insurance for brokerage services.',
    },
    {
      regulation: 'RESPA (Real Estate Settlement Procedures Act)',
      jurisdiction: 'United States (federal)',
      requirements: ['Affiliated business arrangement disclosures', 'Kickback prohibition for referral fees', 'HUD-1 Settlement Statement for certain transactions', 'Escrow account disclosure', 'Servicing disclosure statement'],
      impact: 'Referral fee relationships must be disclosed. No compensation for referrals to settlement service providers. Document generation for RESPA-required disclosures. Escrow account tracking and reconciliation.',
    },
    {
      regulation: 'GDPR / Privacy Regulations',
      jurisdiction: 'EU / Various',
      requirements: ['Tenant and buyer data subject access requests', 'Right to erasure for personal data', 'Consent for marketing communications', 'Data retention and deletion schedules', 'Breach notification procedures'],
      impact: 'Data export and deletion workflows for personal information. Consent management for marketing. Automated data retention enforcement. 72-hour breach notification workflow for EU data.',
    },
  ];
}

function businessRulesForRealEstate(): string[] {
  return [
    'Agent license must be active and verified before listing creation. License expiration triggers account hold with 30-day grace period.',
    'Offer submission requires buyer agent verification or buyer confirmation of no representation. Direct unrepresented buyer offers flagged for legal review.',
    'Earnest money deposit: 1-3% of purchase price held in escrow. Deposit forfeited if buyer breaches without contingency.',
    'Listing price changes logged with timestamp and agent attribution. Automatic delisting if property under contract for 90+ days without activity.',
    'Rent collection: payments due on 1st of month. Late fee ($50 or 5% of rent) applied after 5-day grace period. Eviction process initiated after 14 days overdue.',
    'Tenant screening: minimum credit score 580, maximum eviction history 1 in 7 years, income 3x monthly rent. Adverse action notice sent for disqualifying factors.',
    'Fair housing compliance: all listings must use non-discriminatory language. Automated scanning for prohibited terms. Compliance training required annually.',
  ];
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const REAL_ESTATE_PACK: DomainPack = {
  domain: 'realEstate',
  name: 'Real Estate Platform',
  description: 'Complete real estate platform — from property listing to closing and property management. Covers property search with geospatial mapping, listing management, transaction coordination with offers and contracts, tenant screening and lease management, maintenance request handling, and compliance with fair housing and real estate licensing regulations.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Property Search', 'Listings', 'Transactions', 'Property Management', 'Rentals', 'Agent Services'],
    features: [
      'property-search',
      'map-view',
      'virtual-tours',
      'price-alerts',
      'favorite-listings',
      'market-analysis',
      'mortgage-calculator',
      'agent-profiles',
      'saved-searches',
      'comparables',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['self-service-tour', 'agent-guided-tour', 'digital-closing', 'in-person-closing'],
    features: [
      'showing-scheduler',
      'offer-management',
      'escrow-coordination',
      'document-signing',
      'inspection-scheduling',
      'closing-coordination',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'property-search',
      'saved-homes',
      'showings',
      'offer-tracking',
      'mortgage-calculator',
      'neighborhood-data',
      'market-reports',
      'favorites',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'listing-management',
      'crm',
      'transaction-tracking',
      'commission-management',
      'compliance-tracking',
      'document-management',
      'reporting',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'neighborhood-guides',
      'market-insights',
      'virtual-tours',
      'property-360',
      'community-features',
      'home-value-estimates',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'property-search',
      'listing-detail',
      'map-view',
      'market-insights',
      'agent-directory',
      'mortgage-calculator',
    ],
    customer: [
      'dashboard',
      'saved-searches',
      'favorites',
      'offer-tracker',
      'document-vault',
      'showing-requests',
    ],
    admin: [
      'dashboard',
      'listing-management',
      'user-management',
      'agent-verification',
      'billing',
      'compliance',
      'reports',
    ],
    staff: [
      'crm',
      'listing-editor',
      'showing-scheduler',
      'transaction-tracker',
      'document-generator',
      'commission-tracker',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForRealEstate() as unknown as BusinessRulesSpec,

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Hero search bar with map overlay as primary landing experience',
      'Photo-first property cards with key stats overlay',
      'Split-pane listing detail: photos on left, details on right',
      'Map-centric browse with fly-to-location interaction',
      'Filter panel with expandable sections for amenity selection',
      'Responsive: map-first on mobile, sidebar filters on desktop',
    ],
    color: [
      'Trust blue (#1A73E8) primary for platform branding',
      'Green (#34A853) for price reductions and positive indicators',
      'Red (#EA4335) for price increases and alerts',
      'White and light gray for clean property photo backgrounds',
      'Dark navy (#1A237E) for text and headers',
      'Gold (#F9AB00) for premium and featured listings',
      'Soft sage (#81C995) for active/sold status indicators',
    ],
    typography: [
      'Clean sans-serif (Inter or Roboto) for body text and UI',
      'Bold condensed for price and key property stats',
      'Generous whitespace around property photos',
      'Clear hierarchy: address → price → specs → description',
      'Monospace for MLS numbers and property IDs',
      'Responsive font sizing from mobile to desktop',
    ],
    interaction: [
      'Fly-to-location on map with smooth animation',
      'Heart animation when favoriting a property',
      'Saved search with email notification toggle',
      'Mortgage calculator with live-updating slider',
      'Photo gallery with swipe and zoom',
      'Virtual tour embedded viewer with 360 navigation',
      'Schedule showing with calendar integration',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance across all interfaces',
      'Screen reader support for property descriptions',
      'Keyboard navigation for search filters and map',
      'High contrast mode for property photos',
      'Alternative text for all property images',
      'Video captions for virtual tours',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Buyer (search, favorites, offers), Seller (listing management), Agent (full transaction access, MLS), Property Manager (tenant and maintenance), Tenant (lease and maintenance), Admin (platform management). OAuth + JWT with 8h expiry. Refresh tokens with 30d. MFA for agents and admin. License verification for agents.',
    data: 'Property data includes MLS listings, financial records (offers, contracts), personal information (buyers, sellers, tenants), and property details. Financial data PCI compliant. Personal data encrypted at rest (AES-256). MLS data subject to MLS usage agreements. Tenant screening data FCRA compliant.',
    compliance: ['Fair Housing Act (non-discriminatory practices)', 'State real estate licensing laws', 'RESPA (settlement procedures)', 'FCRA (tenant credit screening)', 'GDPR/CCPA (personal data privacy)', 'Local rent control regulations'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Fair housing language filter: prohibited terms detected in listings',
      'Agent license verification: active status check with expiry alert',
      'Earnest money calculation: 1-3% of purchase price with escrow tracking',
      'Commission split calculation per brokerage agreement',
      'Rent late fee: $50 or 5% after 5-day grace period',
      'Offer counter limit enforcement: maximum 3 rounds',
      'Security deposit accounting per state regulations',
      'Listing price change audit log',
    ],
    integration: [
      'Property search → MLS sync → listing display → showing request',
      'Offer submission → agent notification → negotiation → contract generation',
      'Tenant application → background check → credit check → lease generation → e-signature',
      'Maintenance request → property manager notification → contractor dispatch → completion → payment',
      'Listing creation → MLS sync → photo upload → market analysis → price recommendation',
      'Rent payment → ledger update → late fee trigger → receipt generation',
    ],
    e2e: [
      'Buyer journey: search → favorites → showing → offer → negotiation → contract → closing',
      'Seller journey: listing creation → photo upload → agent matching → offers received → acceptance → closing',
      'Property manager: tenant application → screening → lease signing → move-in → rent payment → maintenance → renewal',
      'Agent journey: lead capture → property match → showing → offer → contract → escrow → commission tracking',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForRealEstate(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForRealEstate(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForRealEstate(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForRealEstate(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForRealEstate(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForRealEstate(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForRealEstate(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForRealEstate(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForRealEstate(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const REAL_ESTATE_DOMAIN: DomainModel = {
  id: REAL_ESTATE_PACK.domain,
  domain: REAL_ESTATE_PACK.domain,
  name: REAL_ESTATE_PACK.name,
  label: REAL_ESTATE_PACK.name,
  category: 'property',
  description: REAL_ESTATE_PACK.description,
  userRoles: [
    { id: 'buyer', name: 'Buyer', typicalFeatures: ['property-search', 'saved-homes', 'showings', 'mortgage-calculator'], permissions: ['browse-listings', 'save-favorites', 'request-showing', 'make-offers'] },
    { id: 'seller', name: 'Seller', typicalFeatures: ['listing-management', 'showing-schedule', 'offer-review', 'market-analysis'], permissions: ['create-listings', 'manage-showings', 'review-offers', 'accept-offers'] },
    { id: 'agent', name: 'Agent', typicalFeatures: ['crm', 'listing-tools', 'showing-management', 'transaction-tracking'], permissions: ['create-listings', 'manage-clients', 'schedule-showings', 'submit-offers', 'manage-transactions'] },
    { id: 'property-manager', name: 'Property Manager', typicalFeatures: ['property-dashboard', 'tenant-database', 'lease-management', 'maintenance-tracking'], permissions: ['manage-properties', 'screen-tenants', 'manage-leases', 'process-maintenance'] },
    { id: 'tenant', name: 'Tenant', typicalFeatures: ['lease-view', 'rent-payment', 'maintenance-requests', 'document-access'], permissions: ['view-own-lease', 'submit-maintenance', 'pay-rent', 'communicate-with-pm'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'listing-management', 'user-management', 'billing'], permissions: ['*'] },
  ],
  role: 'buyer',
  standardFeatures: [],
  businessModels: [
    { modelType: 'property-listing-marketplace', revenueStreams: ['listing-fees', 'premium-listings', 'lead-generation', 'advertising'], costStructure: ['mls-access', 'cloud-hosting', 'engineering', 'marketing'], pricingStrategy: ['freemium', 'subscription', 'lead-based'] },
    { modelType: 'property-management-saas', revenueStreams: ['subscription-fees', 'setup-fees', 'add-on-services'], costStructure: ['development', 'customer-support', 'payment-processing', 'infrastructure'], pricingStrategy: ['per-unit-per-month', 'tiered', 'annual-discount'] },
    { modelType: 'transaction-platform', revenueStreams: ['subscription', 'transaction-fees', 'add-on-modules'], costStructure: ['engineering', 'compliance', 'sales', 'support'], pricingStrategy: ['per-agent-per-month', 'per-transaction', 'enterprise'] },
  ],
  technicalPatterns: [
    { category: 'geospatial', name: 'PostGIS Property Mapping', description: 'Geospatial indexing for property locations with geo-distance search and map visualization', rationale: 'Location-based search is the core of real estate discovery' },
    { category: 'search', name: 'Faceted Property Search', description: 'Elasticsearch with geo-filters, price range, property type, and amenity faceting', rationale: 'Buyers need rich filtering across many dimensions' },
    { category: 'document', name: 'Contract Lifecycle Management', description: 'Document generation with e-signature, version tracking, and audit trail', rationale: 'Real estate transactions generate extensive document workflows' },
    { category: 'notification', name: 'Real-Time Offer Alerts', description: 'WebSocket-based notifications for offer submissions and counter-offers', rationale: 'Time-sensitive transaction events require immediate notification' },
  ],
  operationalLifecycle: [
    { id: 'search', name: 'Search', description: 'Buyer browses listings, saves favorites, and requests showings' },
    { id: 'offer', name: 'Offer', description: 'Offer submitted, negotiated, and accepted' },
    { id: 'contract', name: 'Contract', description: 'Purchase agreement signed, escrow opened, inspections completed' },
    { id: 'close', name: 'Close', description: 'Loan approved, closing documents signed, title transferred, sale recorded' },
    { id: 'post-close', name: 'Post-Close', description: 'Property management begins or sale proceeds distributed' },
  ],
  designPrinciples: [
    { name: 'Photo-First', description: 'High-quality property photos dominate listing cards and detail pages' },
    { name: 'Map-Centric Discovery', description: 'Interactive map as primary search interface with property pins and neighborhood context' },
    { name: 'Trust Signals', description: 'License verification, reviews, and compliance badges prominently displayed for agents and listings' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Agent license verification', description: 'Active real estate license required for agent role', severity: 'high' },
    { category: 'data', name: 'Personal data protection', description: 'Buyer/seller/tenant PII encrypted at rest', severity: 'high' },
    { category: 'compliance', name: 'Fair Housing compliance', description: 'Non-discriminatory listing and search practices', severity: 'high' },
    { category: 'compliance', name: 'FCRA compliance', description: 'Tenant screening per Fair Credit Reporting Act', severity: 'medium' },
    { category: 'compliance', name: 'RESPA compliance', description: 'Settlement procedures and kickback prohibition', severity: 'medium' },
  ],
  regulations: [
    { name: 'Fair Housing Act', requirements: ['Non-discriminatory practices', 'Accessible listing filters', 'Fair advertising language'] },
    { name: 'Real Estate Licensing', requirements: ['License verification', 'Active status monitoring', 'Supervision documentation'] },
    { name: 'RESPA', requirements: ['Affiliated business disclosures', 'Kickback prohibition', 'Settlement documents'] },
    { name: 'FCRA', requirements: ['Consent for credit checks', 'Adverse action notices', 'Report retention limits'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Fair housing language filter', description: 'Prohibited terms detected in listings', priority: 'high' },
    { category: 'unit', name: 'Commission calculation', description: 'Split calculation per brokerage agreement', priority: 'high' },
    { category: 'integration', name: 'Offer to contract flow', description: 'Offer submission → negotiation → contract generation', priority: 'high' },
    { category: 'e2e', name: 'Buyer journey', description: 'Search → favorites → showing → offer → closing', priority: 'medium' },
  ],
  workflows: [
    { id: 'list-to-sale', name: 'List to Sale', steps: ['listing-creation', 'photo-shoot', 'marketing', 'showings', 'offers', 'negotiation', 'contract', 'escrow', 'closing'], entities: ['listing', 'showing', 'offer', 'contract', 'escrow'] },
    { id: 'application-to-lease', name: 'Application to Lease', steps: ['application', 'screening', 'credit-check', 'lease-draft', 'signed', 'move-in'], entities: ['application', 'background-check', 'lease', 'security-deposit'] },
    { id: 'maintenance-resolution', name: 'Maintenance Resolution', steps: ['request', 'triage', 'contractor-assign', 'dispatch', 'completion', 'review', 'close'], entities: ['maintenance-request', 'work-order', 'contractor'] },
  ],
  entities: [
    { name: 'Listing', description: 'Property listing with photos, description, price, and status', invariants: ['requires verified agent', 'price changes logged', 'MLS sync required'] },
    { name: 'Offer', description: 'Purchase offer with price, terms, and contingencies', invariants: ['counter limited to 3 rounds', 'earnest money held in escrow', 'expires per offer terms'] },
    { name: 'Lease', description: 'Rental lease agreement with terms, deposit, and tenant info', invariants: ['signed by both parties', 'security deposit held per state law', 'eviction per local process'] },
  ],
  invariants: ['agent license must be active', 'offer counters limited to 3 rounds', 'earnest money held in escrow', 'fair housing compliance enforced'],
  constraints: ['offer counter max 3 rounds', 'late rent fee $50 after 5-day grace', 'minimum credit score 580 for rental', 'earnest money 1-3% of purchase price'],
  financialFlows: [
    { name: 'listing-fee', direction: 'in', trigger: 'listing-published' },
    { name: 'commission', direction: 'in', trigger: 'sale-closed' },
    { name: 'subscription', direction: 'in', trigger: 'agent-subscription-renewed' },
    { name: 'rent-collection', direction: 'in', trigger: 'rent-payment-received' },
    { name: 'agent-commission', direction: 'out', trigger: 'sale-commission-distributed' },
    { name: 'maintenance-payment', direction: 'out', trigger: 'contractor-invoice-paid' },
  ],
  successMetrics: ['days-on-market', 'list-to-close-time', 'offer-acceptance-rate', 'tenant-occupancy-rate', 'maintenance-resolution-time', 'agent-activity-level', 'search-to-listing-conversion'],
  analytics: { tracked: ['property-views', 'search-queries', 'offer-metrics', 'market-trends', 'agent-performance', 'user-engagement'], dashboards: ['market-dashboard', 'listing-performance', 'agent-productivity', 'transaction-pipeline'] },
  securityRequirements: ['jwt-auth', 'mfa-agents', 'pci-compliance', 'fcra-compliance', 'fair-housing-audit-log', 'data-encryption'],
  regulatory: [
    { regulation: 'Fair Housing Act', applies: true, notes: 'Non-discriminatory listing and search practices' },
    { regulation: 'Real Estate Licensing', applies: true, notes: 'Agent license verification per state' },
    { regulation: 'RESPA', applies: true, notes: 'Settlement procedures and disclosure requirements' },
    { regulation: 'FCRA', applies: true, notes: 'Tenant screening compliance' },
  ],
};
