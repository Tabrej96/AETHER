/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Automotive Domain Pack
 *
 * Complete automotive dealership and service management platform — from lead to sale and beyond.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForAutomotive(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'vehicle-sales',
      description: 'Traditional automotive dealership model — new and used vehicle sales with financing, trade-ins, and add-on products.',
      pricingExamples: ['New vehicle markup 2-5% MSRP', 'Used vehicle markup 8-15% acquisition cost', 'Financing markup 1-2% over bank rate', 'Extended warranty 20-40% of expected claims'],
    },
    {
      modelType: 'service-center',
      description: 'Dealership service center handling maintenance, repairs, warranty work, and recalls with certified technicians.',
      pricingExamples: ['Oil change $49.99', 'Brake pad replacement $299-599', 'Diagnostic fee $129 (waived with repair)', 'Labor rate $120-180/hour'],
    },
    {
      modelType: 'subscription-vehicle-access',
      description: 'Vehicle subscription platform — monthly fee covers vehicle, insurance, maintenance, and roadside assistance with flexibility to swap.',
      pricingExamples: ['Compact subscription $499/month', 'SUV subscription $799/month', 'Luxury subscription $1,499/month', 'Swap fee $99', 'Insurance included', 'Maintenance included'],
    },
  ];
}

function revenueStreamsForAutomotive(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Vehicle Sales',
      description: 'Revenue from new and used vehicle sales with markup over cost.',
      pricingModel: 'markup-per-vehicle',
      examples: ['New vehicle 2-5% MSRP', 'Used vehicle 8-15% acquisition cost', 'Trade-in markup 10-20% below retail'],
    },
    {
      name: 'Service Labor & Parts',
      description: 'Revenue from vehicle service — labor hours and parts markup.',
      pricingModel: 'hourly-labor plus parts-markup',
      examples: ['Labor $120-180/hour', 'Parts markup 30-50%', 'Diagnostic fee $129', 'Oil change $49.99'],
    },
    {
      name: 'Extended Warranties',
      description: 'Profit from selling extended warranty and protection plans.',
      pricingModel: 'per-vehicle',
      examples: ['Powertrain warranty $1,500-3,000', 'Bumper-to-bumper $2,000-4,000', 'Roadside assistance $299/year'],
    },
    {
      name: 'Parts Sales',
      description: 'Standalone parts sales for DIY customers and other repair shops.',
      pricingModel: 'markup-on-cost',
      examples: ['OEM parts 30-50% markup', 'Aftermarket parts 20-35% markup', 'Tires 15-25% markup'],
    },
    {
      name: 'Subscription Access',
      description: 'Vehicle subscription revenue with bundled insurance and maintenance.',
      pricingModel: 'monthly-subscription',
      examples: ['Compact $499/month', 'SUV $799/month', 'Luxury $1,499/month'],
    },
  ];
}

function userRoleMatrixForAutomotive(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'customer',
      roleName: 'Customer',
      description: 'Vehicle buyer or service customer. Browses inventory, schedules service, tracks repairs, and manages purchases.',
      permissions: ['browse-inventory', 'schedule-service', 'track-repairs', 'view-history', 'manage-trade-in', 'apply-financing'],
      features: ['vehicle-search', 'service-booking', 'repair-tracking', 'purchase-history', 'trade-in-appraisal', 'financing-application'],
      constraints: ['cannot modify pricing', 'trade-in appraisal requires physical inspection', 'financing subject to credit approval'],
    },
    {
      roleId: 'salesperson',
      roleName: 'Salesperson',
      description: 'Vehicle sales professional managing leads, test drives, negotiations, and sale closing.',
      permissions: ['manage-leads', 'schedule-test-drives', 'create-deals', 'negotiate-pricing', 'access-inventory'],
      features: ['lead-management', 'test-drive-scheduler', 'deal-desking', 'inventory-access', 'commission-dashboard'],
      constraints: ['pricing within manager approval limits', 'all deals logged in DMS', 'commission tracked per vehicle sold'],
    },
    {
      roleId: 'service-advisor',
      roleName: 'Service Advisor',
      description: 'Front-of-house service staff coordinating customer service appointments, estimates, and communication.',
      permissions: ['create-work-orders', 'generate-estimates', 'schedule-appointments', 'communicate-with-customers', 'approve-standard-repairs'],
      features: ['appointment-scheduler', 'work-order-creation', 'estimate-generator', 'customer-communication', 'service-history'],
      constraints: ['estimate required before work begins', 'approval required for repairs over $500', 'all work logged in DMS'],
    },
    {
      roleId: 'technician',
      roleName: 'Technician',
      description: 'Certified automotive technician performing diagnostics, repairs, and maintenance.',
      permissions: ['view-work-orders', 'update-repair-status', 'order-parts', 'document-repairs', 'flag-recalls'],
      features: ['work-order-viewer', 'repair-documentation', 'parts-ordering', 'recall-notifications', 'time-tracking'],
      constraints: ['repairs require diagnostic completion', 'parts ordered through approved suppliers', 'recall work follows manufacturer procedures'],
    },
    {
      roleId: 'parts-manager',
      roleName: 'Parts Manager',
      description: 'Manages parts inventory, ordering, pricing, and supplier relationships.',
      permissions: ['manage-inventory', 'set-pricing', 'order-parts', 'manage-suppliers', 'generate-reports'],
      features: ['inventory-management', 'parts-catalog', 'pricing-tools', 'supplier-management', 'reports'],
      constraints: ['inventory levels per par levels', 'pricing within market guidelines', 'returns per supplier agreement'],
    },
    {
      roleId: 'admin',
      roleName: 'Dealership Admin',
      description: 'Full system administrator managing dealership operations, users, billing, and reporting.',
      permissions: ['*'],
      features: ['dashboard', 'user-management', 'inventory', 'billing', 'reports', 'compliance', 'settings'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'financial data access restricted'],
    },
  ];
}

function operationalWorkflowsForAutomotive(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'lead-to-sale',
      name: 'Lead to Sale',
      description: 'Lead captured, qualified, test drive scheduled, vehicle selected, deal negotiated, financing arranged, and sale completed.',
      steps: ['lead-captured', 'lead-qualified', 'appointment-scheduled', 'test-drive-completed', 'vehicle-selected', 'deal-negotiated', 'trade-in-appraised', 'financing-arranged', 'paperwork-completed', 'sale-completed', 'vehicle-delivered'],
      entities: ['lead', 'customer', 'vehicle', 'deal', 'trade-in', 'financing', 'paperwork'],
      triggers: ['lead-captured', 'test-drive-scheduled', 'deal-negotiated', 'sale-closed'],
    },
    {
      workflowId: 'service-request-to-completion',
      name: 'Service Request to Completion',
      description: 'Customer requests service, vehicle drop-off, diagnosis performed, estimate provided, work authorized, repairs completed, and vehicle returned.',
      steps: ['appointment-scheduled', 'vehicle-drop-off', 'diagnostic-performed', 'estimate-provided', 'customer-approval', 'work-completed', 'quality-check', 'notification-sent', 'vehicle-pickup', 'payment-collected'],
      entities: ['appointment', 'vehicle', 'work-order', 'estimate', 'repair', 'payment'],
      triggers: ['appointment-created', 'estimate-approved', 'work-complete', 'vehicle-ready'],
    },
    {
      workflowId: 'parts-order-to-install',
      name: 'Parts Order to Install',
      description: 'Part needed for repair, ordered from supplier, received and inspected, installed by technician, and billed.',
      steps: ['part-needed', 'part-ordered', 'supplier-confirmed', 'part-received', 'quality-check', 'installed', 'billed-to-work-order'],
      entities: ['part-order', 'part', 'work-order', 'invoice'],
      triggers: ['part-ordered', 'part-received', 'part-installed'],
    },
    {
      workflowId: 'trade-in-to-resale',
      name: 'Trade-In to Resale',
      description: 'Trade-in received, appraised, reconditioned, priced, listed, and sold to new customer.',
      steps: ['trade-in-received', 'appraisal-completed', 'reconditioning-scheduled', 'reconditioning-completed', 'pricing-set', 'listed', 'inspection-passed', 'sold-to-customer'],
      entities: ['trade-in', 'appraisal', 'reconditioning', 'used-vehicle-listing', 'sale'],
      triggers: ['trade-in-appraised', 'reconditioning-done', 'vehicle-sold'],
    },
  ];
}

function stateMachinesForAutomotive(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Vehicle',
      states: ['inventory', 'reserved', 'sold', 'in-transit', 'service', 'trade-in', 'reconditioning', 'ready-for-sale', 'scrapped'],
      transitions: { inventory: ['reserved', 'service', 'trade-in', 'scrapped'], reserved: ['inventory', 'sold'], 'in-transit': ['inventory'], 'trade-in': ['reconditioning'], reconditioning: ['ready-for-sale'], 'ready-for-sale': ['inventory', 'sold'], service: ['ready-for-sale'] },
      initialState: 'inventory',
      terminalStates: ['sold', 'scrapped'],
    },
    {
      entityName: 'ServiceOrder',
      states: ['scheduled', 'checked-in', 'diagnosing', 'estimate-pending', 'estimate-approved', 'in-progress', 'quality-check', 'ready-for-pickup', 'completed', 'cancelled'],
      transitions: { scheduled: ['checked-in'], 'checked-in': ['diagnosing'], diagnosing: ['estimate-pending'], 'estimate-pending': ['estimate-approved', 'cancelled'], 'estimate-approved': ['in-progress'], 'in-progress': ['quality-check'], 'quality-check': ['ready-for-pickup'], 'ready-for-pickup': ['completed'] },
      initialState: 'scheduled',
      terminalStates: ['completed', 'cancelled'],
    },
    {
      entityName: 'SalesLead',
      states: ['new', 'contacted', 'qualified', 'appointment-set', 'test-drive-done', 'negotiating', 'contracted', 'delivered', 'lost', 'cold'],
      transitions: { new: ['contacted', 'lost'], contacted: ['qualified', 'lost'], qualified: ['appointment-set', 'lost'], 'appointment-set': ['test-drive-done'], 'test-drive-done': ['negotiating'], negotiating: ['contracted'], contracted: ['delivered'], 'lost': ['cold'] },
      initialState: 'new',
      terminalStates: ['delivered', 'lost'],
    },
    {
      entityName: 'Part',
      states: ['available', 'reserved', 'ordered', 'in-transit', 'received', 'installed', 'returned', 'backordered'],
      transitions: { available: ['reserved', 'ordered', 'backordered'], reserved: ['available', 'installed'], ordered: ['in-transit'], 'in-transit': ['received'], received: ['installed'], installed: ['returned'], backordered: ['available'] },
      initialState: 'available',
      terminalStates: ['installed', 'returned'],
    },
  ];
}

function edgeCasesForAutomotive(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Recall Management',
      description: 'Manufacturer issues safety recall for vehicle already sold or in inventory requiring immediate action.',
      handling: 'NHTSA recall API integration triggers automatic alerts. Inventory vehicles flagged and removed from sales floor. Sold vehicle owner contacted directly with recall details. Service bay reserved for recall work. Manufacturer reimbursement process initiated.',
      recovery: 'Recall repair scheduled with customer. Temporary transportation provided if vehicle unsafe to drive. Recall completion tracked and reported to NHTSA. Manufacturer reimbursement processed. Customer satisfaction follow-up.',
    },
    {
      scenario: 'Warranty Dispute',
      description: 'Customer claims warranty coverage for repair that dealership denies as not covered or out of warranty.',
      handling: 'Warranty coverage verified against VIN, warranty terms, and mileage. Customer notified of specific denial reason with documentation. Manufacturer warranty claim submitted if applicable. Alternative repair options presented with pricing. Customer signature obtained on denial acknowledgment.',
      recovery: 'If warranty claim approved: work completed under warranty, customer notified. If denied: written explanation provided with appeal process. Complaint logged for review by management. Alternative financing offered for out-of-warranty repair. Customer relationship maintained.',
    },
    {
      scenario: 'Service Overrun',
      description: 'Vehicle repair takes longer than estimated due to additional damage found during disassembly.',
      handling: 'Additional damage photographed and documented. Updated estimate generated with additional work items. Customer contacted immediately with explanation. Additional authorization required before proceeding. Service advisor provides timeline update.',
      recovery: 'If customer approves: work continues with updated estimate. Timeline communicated to customer. If customer declines: vehicle reassembled to original state, customer informed. Additional damage documented for possible future service. Loaner vehicle arranged if available.',
    },
    {
      scenario: 'Financing Fall-Through',
      description: 'Customer financing falls through after vehicle delivery or during the sale process.',
      handling: 'Financing status monitored via lender portal. If denied: customer notified immediately. Alternative financing sources contacted. Vehicle pickup held until financing secured. Trade-in vehicle not yet sold held in pending status.',
      recovery: 'If alternative financing found: sale proceeds with new lender, terms updated. If no financing: vehicle returned, trade-in returned. Restocking fee waived if within 3 days of delivery. Customer credit counseling resources provided.',
    },
  ];
}

function integrationsForAutomotive(): DomainPack['integrations'] {
  return [
    {
      name: 'DMS (Dealer Management System)',
      type: 'operations',
      description: 'Integration with Reynolds & Reynolds, CDK, or Dealertrack for core dealership operations.',
      required: true,
      configuration: 'API integration for vehicle inventory, customer records, service history, and parts inventory. Real-time sync between platform and DMS. Vehicle VIN parsing and lookup. Deal and contract data exchange.',
    },
    {
      name: 'Parts Catalog',
      type: 'inventory',
      description: 'OEM parts catalog integration for accurate part lookup, pricing, and availability.',
      required: false,
      configuration: 'API integration with OEM parts catalogs (ACES/IES). VIN-based part lookup with fitment verification. Real-time pricing and availability. Supersession chain awareness.',
    },
    {
      name: 'Financing Providers',
      type: 'financial',
      description: 'Integration with banks, credit unions, and captive finance companies for loan processing.',
      required: false,
      configuration: 'Credit application API submission. Real-time rate and term comparison. Contract generation per lender format. Funding status tracking. Buy rate and sell rate management.',
    },
    {
      name: 'NHTSA Recall API',
      type: 'government',
      description: 'National Highway Traffic Safety Administration recall database integration.',
      required: true,
      configuration: 'VIN-based recall lookup. Open recall alerts for inventory and sold vehicles. Campaign and remedy information. Completion tracking and reporting to NHTSA.',
    },
    {
      name: 'Service Scheduling',
      type: 'operations',
      description: 'Online service appointment scheduling with bay and technician availability.',
      required: true,
      configuration: 'Bay capacity management by service type. Technician skill-based assignment. Appointment reminder notifications. Waitlist management for cancellations.',
    },
    {
      name: 'Credit Bureau',
      type: 'financial',
      description: 'Credit check integration for financing pre-qualification and lease applications.',
      required: false,
      configuration: 'Soft pull for pre-qualification. Hard pull with customer authorization. Credit score display with approval probability. Adverse action notices per FCRA.',
    },
  ];
}

function technicalArchitectureForAutomotive(): TechnicalArchitectureDef {
  return {
    patterns: ['DMS-centric architecture with real-time inventory sync', 'Event-driven service workflow with bay management', 'CRM integration for lead lifecycle management', 'Parts availability optimization with supplier APIs', 'Mobile-first for service bay and showroom tablets'],
    infrastructure: ['PostgreSQL for customer, vehicle, and service data', 'Elasticsearch for vehicle search and parts lookup', 'S3-compatible storage for vehicle photos and documents', 'Redis for session cache and real-time inventory', 'REST APIs for DMS integration', 'CDN for vehicle image delivery'],
    dataFlow: 'Lead captured from website or walk-in → CRM record created → vehicle inventory queried → test drive scheduled → deal negotiated → financing submitted → credit checked → deal completed → vehicle delivered → DMS updated → parts inventory adjusted → service history created. Service: appointment scheduled → vehicle checked in → diagnosis performed → estimate generated → customer approval → work completed → payment collected → vehicle returned.',
    scalability: 'Vehicle search optimized via Elasticsearch with faceted filtering. DMS sync handles batch updates during off-peak. Service bay scheduling optimized via Redis for real-time availability. Image delivery via CDN with responsive sizing. Lead routing optimized for fastest response time.',
  };
}

function regulatoryComplianceForAutomotive(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'NHTSA Safety Regulations',
      jurisdiction: 'United States',
      requirements: ['Recall management and completion tracking', 'Safety defect reporting', 'Vehicle identification number (VIN) compliance', 'Odometer disclosure requirements', 'Safety equipment verification'],
      impact: 'Platform integrates with NHTSA recall database for automatic alerts. Odometer disclosure tracked per sale. Safety inspection scheduling and tracking. Recall completion reported to NHTSA.',
    },
    {
      regulation: 'Lemon Law',
      jurisdiction: 'Per-state',
      requirements: ['New vehicle defect reporting', 'Repair attempt documentation', 'Buyback and replacement procedures', 'Warranty disclosure', 'Used vehicle disclosure requirements'],
      impact: 'Service history tracked per VIN for lemon law claims. Repair attempt documentation maintained. Warranty terms and disclosure tracked. Used vehicle condition reports generated with disclosure forms.',
    },
    {
      regulation: 'FCRA (Credit Reporting)',
      jurisdiction: 'United States',
      requirements: ['Written consent for credit inquiries', 'Adverse action notices for denied financing', 'Credit score disclosure', 'Report retention limits'],
      impact: 'Credit check workflow includes FCRA-compliant consent capture. Adverse action notices generated automatically. Credit reports stored with retention limits. Pre-qualification uses soft pull.',
    },
    {
      regulation: 'Consumer Finance Disclosure',
      jurisdiction: 'United States',
      requirements: ['Truth in Lending Act (TILA) disclosures', 'Annual Percentage Rate (APR) disclosure', 'Total cost of financing disclosure', 'Right of rescission period'],
      impact: 'Financing documents generated with TILA-compliant disclosures. APR and total cost clearly displayed. Contract review period tracked. Electronic signature with consent documented.',
    },
  ];
}

function businessRulesForAutomotive(): BusinessRulesSpec {
  return {
    pricing: [
      'Vehicle pricing: new vehicles priced 2-5% above MSRP. Used vehicles priced 8-15% above acquisition cost after reconditioning.',
      'Parts markup: OEM parts 30-50% markup, aftermarket 20-35%, tires 15-25%. Pricing within market guidelines.',
      'Service hours: labor rate $120-180/hour depending on technician certification level.',
    ],
    tradeIn: [
      'Trade-in offer: initial offer within 10% of retail value. Manager authority required for offers above retail value.',
    ],
    service: [
      'Service estimate: required before work begins. Diagnostic fee $129 waived if customer proceeds with recommended repair.',
      'Recall work: performed at no cost to customer under manufacturer warranty. Recall completion tracked per NHTSA requirements.',
    ],
    warranty: [
      'Warranty: new vehicles include manufacturer warranty. Extended warranty offered at point of sale. Warranty work billed at agreed labor rate.',
    ],
    financing: [
      'Financing: markup over buy rate limited to 2% maximum per regulations. Customer informed of APR and total cost.',
    ],
  };
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const AUTOMOTIVE_PACK: DomainPack = {
  domain: 'automotive',
  name: 'Automotive Dealership & Service',
  description: 'Complete automotive dealership and service management platform — from lead to sale, service request to completion, and parts management. Covers vehicle inventory management, sales pipeline with financing and trade-ins, service center operations, parts inventory with OEM catalog integration, customer relationship management, and compliance with NHTSA, lemon law, and consumer finance regulations.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['New Vehicles', 'Used Vehicles', 'Service & Maintenance', 'Parts & Accessories', 'Financing & Trade-In', 'Subscriptions'],
    features: [
      'vehicle-search',
      'trade-in-appraisal',
      'financing-calculator',
      'service-booking',
      'repair-tracking',
      'parts-catalog',
      'recall-alerts',
      'vehicle-history',
      'warranty-info',
      'subscription-swap',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['showroom-pickup', 'home-delivery', 'service-bay', 'curbside-service', 'mail-order-parts'],
    features: [
      'test-drive-scheduling',
      'delivery-coordination',
      'service-bay-management',
      'loaner-vehicles',
      'pickup-delivery',
      'shuttle-service',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'vehicle-search',
      'trade-in-appraisal',
      'service-booking',
      'repair-status',
      'service-history',
      'financing-application',
      'appointment-reminders',
      'digital-checkin',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'inventory-management',
      'sales-pipeline',
      'service-management',
      'parts-inventory',
      'customer-crm',
      'commission-tracking',
      'reporting',
      'dms-integration',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'virtual-showroom',
      'vehicle-360-view',
      'trade-in-calculator',
      'service-tips',
      'owner-resources',
      'loyalty-program',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'vehicle-search',
      'service-center',
      'parts-store',
      'financing-calculator',
      'trade-in-appraisal',
      'contact',
    ],
    customer: [
      'dashboard',
      'vehicle-favorites',
      'service-history',
      'repair-status',
      'appointments',
      'documents',
      'profile',
    ],
    admin: [
      'dashboard',
      'inventory',
      'sales-management',
      'service-management',
      'parts-management',
      'billing',
      'reports',
    ],
    staff: [
      'lead-board',
      'deal-desking',
      'service-advisor',
      'technician-work-orders',
      'parts-lookup',
      'bay-schedule',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForAutomotive(),

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Vehicle showcase with hero imagery and quick search',
      'Card-based vehicle listings with photo gallery and key specs',
      'Split-pane service tracking: vehicle on left, status on right',
      'Tabbed navigation for new, used, service, and parts',
      'Form-based workflows for financing, trade-in, and service scheduling',
      'Mobile-optimized for showroom tablet use',
    ],
    color: [
      'Silver/metallic (#C0C0C0) for vehicle presentation',
      'Deep navy (#1A237E) for professionalism and trust',
      'Red (#D32F2F) for pricing and urgency',
      'Green (#388E3C) for approved status and savings',
      'Clean white backgrounds for vehicle photos',
      'Orange (#FF6D00) for service and warning indicators',
      'Carbon fiber texture accents for premium feel',
    ],
    typography: [
      'Bold sans-serif for vehicle pricing and key stats',
      'Clean sans-serif for body text and navigation',
      'Large display numbers for mileage and pricing',
      'Technical sans-serif for vehicle specifications',
      'High contrast for outdoor showroom visibility',
    ],
    interaction: [
      'Vehicle 360-degree photo viewer with zoom',
      'Trade-in calculator with real-time market value',
      'Financing calculator with live rate updates',
      'Service status tracker with bay location',
      'Push notifications for service completion',
      'Digital check-in kiosk mode',
      'Comparison tool for multiple vehicles',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance',
      'Screen reader support for vehicle descriptions',
      'Keyboard navigation for search and forms',
      'High contrast mode for showroom displays',
      'Alternative text for all vehicle images',
      'Video captions for vehicle walkaround videos',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Customer (vehicle search, service booking, purchase history), Salesperson (lead management, deal creation), Service Advisor (appointments, estimates), Technician (work orders, repair documentation), Parts Manager (inventory, ordering), Admin (full platform). JWT with 8h expiry. Refresh tokens with 30d. MFA for admin and financial operations.',
    data: 'Customer data includes personal information, purchase history, service records, and financial applications. Vehicle data includes VIN, specifications, and service history. Financing applications contain sensitive financial data. PCI DSS for payment processing. FCRA compliance for credit checks.',
    compliance: ['NHTSA recall management', 'Lemon law documentation', 'FCRA for credit checks', 'Consumer finance disclosure (TILA)', 'Odometer disclosure requirements', 'Privacy regulations per state'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Trade-in appraisal algorithm with market value lookup',
      'Commission calculation per vehicle sold and product',
      'Service estimate generation with labor and parts markup',
      'Parts availability check with supplier lead time',
      'Financing rate markup validation (max 2%)',
      'Recall lookup by VIN with alert generation',
      'Service bay conflict detection (double booking)',
      'Warranty coverage verification by VIN and mileage',
    ],
    integration: [
      'Lead capture → CRM → appointment → test drive → deal → financing → delivery',
      'Service appointment → check-in → diagnosis → estimate → approval → repair → completion → billing',
      'Parts order → supplier API → receipt → quality check → installation → billing',
      'Vehicle acquisition → inspection → reconditioning → pricing → inventory listing',
      'Trade-in appraisal → offer → negotiation → acceptance → resale listing',
    ],
    e2e: [
      'Vehicle purchase: search → test drive → negotiate → trade-in → finance → paperwork → delivery',
      'Service journey: appointment → drop-off → diagnosis → estimate → approval → repair → pickup → payment',
      'Parts sale: browse → find → order → pickup → installation → checkout',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForAutomotive(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForAutomotive(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForAutomotive(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForAutomotive(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForAutomotive(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForAutomotive(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForAutomotive(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForAutomotive(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForAutomotive(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const AUTOMOTIVE_DOMAIN: DomainModel = {
  id: AUTOMOTIVE_PACK.domain,
  domain: AUTOMOTIVE_PACK.domain,
  name: AUTOMOTIVE_PACK.name,
  label: AUTOMOTIVE_PACK.name,
  category: 'automotive',
  description: AUTOMOTIVE_PACK.description,
  userRoles: [
    { id: 'customer', name: 'Customer', typicalFeatures: ['vehicle-search', 'service-booking', 'repair-tracking', 'trade-in-appraisal'], permissions: ['browse-inventory', 'schedule-service', 'track-repairs', 'apply-financing'] },
    { id: 'salesperson', name: 'Salesperson', typicalFeatures: ['lead-management', 'test-drive-scheduler', 'deal-desking', 'commission-dashboard'], permissions: ['manage-leads', 'schedule-test-drives', 'create-deals', 'negotiate-pricing'] },
    { id: 'service-advisor', name: 'Service Advisor', typicalFeatures: ['appointment-scheduler', 'work-order-creation', 'estimate-generator', 'service-history'], permissions: ['create-work-orders', 'generate-estimates', 'schedule-appointments'] },
    { id: 'technician', name: 'Technician', typicalFeatures: ['work-order-viewer', 'repair-documentation', 'parts-ordering', 'recall-notifications'], permissions: ['view-work-orders', 'update-repair-status', 'order-parts', 'flag-recalls'] },
    { id: 'parts-manager', name: 'Parts Manager', typicalFeatures: ['inventory-management', 'parts-catalog', 'pricing-tools', 'supplier-management'], permissions: ['manage-inventory', 'set-pricing', 'order-parts', 'manage-suppliers'] },
    { id: 'admin', name: 'Dealership Admin', typicalFeatures: ['dashboard', 'inventory', 'sales-management', 'billing'], permissions: ['*'] },
  ],
  role: 'customer',
  standardFeatures: [],
  businessModels: [
    { modelType: 'vehicle-sales', revenueStreams: ['vehicle-sales', 'trade-in-markup', 'financing-markup', 'extended-warranties'], costStructure: ['vehicle-acquisition', 'reconditioning', 'sales-compensation', 'facility', 'advertising'], pricingStrategy: ['msrp-plus', 'market-based', 'negotiable'] },
    { modelType: 'service-center', revenueStreams: ['service-labor', 'parts-sales', 'warranty-work', 'maintenance-plans'], costStructure: ['technician-compensation', 'parts-inventory', 'equipment', 'facility'], pricingStrategy: ['labor-hourly', 'parts-markup', 'package-pricing'] },
    { modelType: 'subscription-access', revenueStreams: ['subscription-fees', 'swap-fees', 'insurance-bundles'], costStructure: ['vehicle-fleet', 'insurance', 'maintenance', 'platform'], pricingStrategy: ['monthly-subscription', 'tiered-by-vehicle-type'] },
  ],
  technicalPatterns: [
    { category: 'integration', name: 'DMS Integration', description: 'Real-time sync with Reynolds & Reynolds or CDK', rationale: 'Single source of truth for inventory, customers, and service' },
    { category: 'inventory', name: 'Vehicle Search Engine', description: 'Elasticsearch-based vehicle search with VIN, specs, and features', rationale: 'Fast faceted search across large inventory' },
    { category: 'scheduling', name: 'Bay Management System', description: 'Real-time service bay scheduling with technician skill matching', rationale: 'Maximize bay utilization while respecting skill requirements' },
    { category: 'parts', name: 'OEM Parts Catalog Integration', description: 'VIN-based parts lookup with fitment verification', rationale: 'Accurate part identification is critical for service' },
  ],
  operationalLifecycle: [
    { id: 'lead', name: 'Lead', description: 'Customer inquiry captured and qualified' },
    { id: 'sell', name: 'Sell', description: 'Vehicle demonstrated, negotiated, and sold' },
    { id: 'service', name: 'Service', description: 'Vehicle serviced, repaired, or maintained' },
    { id: 'retain', name: 'Retain', description: 'Customer retained through service and repeat sales' },
  ],
  designPrinciples: [
    { name: 'Vehicle-First Display', description: 'High-quality vehicle photography with immersive viewer' },
    { name: 'Transparent Pricing', description: 'Clear pricing with no hidden fees, finance calculator front and center' },
    { name: 'Service Convenience', description: 'Easy online scheduling with real-time bay availability' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'DMS access control', description: 'Role-based access to dealer management system', severity: 'high' },
    { category: 'data', name: 'VIN data protection', description: 'Vehicle and customer data encrypted at rest', severity: 'high' },
    { category: 'compliance', name: 'NHTSA recall tracking', description: 'Safety recall management and reporting', severity: 'medium' },
    { category: 'compliance', name: 'FCRA credit checks', description: 'Consent and adverse action for financing', severity: 'medium' },
  ],
  regulations: [
    { name: 'NHTSA', requirements: ['Recall management', 'Safety defect reporting', 'VIN compliance'] },
    { name: 'Lemon Law', requirements: ['Defect documentation', 'Buyback procedures', 'Warranty disclosure'] },
    { name: 'FCRA', requirements: ['Consent for credit', 'Adverse action notices', 'Score disclosure'] },
    { name: 'TILA', requirements: ['APR disclosure', 'Total cost disclosure', 'Right of rescission'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Commission calculation', description: 'Per-vehicle commission with product adjustments', priority: 'high' },
    { category: 'unit', name: 'Trade-in appraisal', description: 'Market value calculation with condition adjustment', priority: 'high' },
    { category: 'integration', name: 'Lead to sale flow', description: 'Lead capture → CRM → appointment → sale', priority: 'high' },
    { category: 'e2e', name: 'Service lifecycle', description: 'Appointment → check-in → repair → billing → pickup', priority: 'medium' },
  ],
  workflows: [
    { id: 'lead-to-sale', name: 'Lead to Sale', steps: ['capture', 'qualify', 'appointment', 'test-drive', 'negotiate', 'finance', 'paperwork', 'deliver'], entities: ['lead', 'customer', 'vehicle', 'deal'] },
    { id: 'service-request', name: 'Service Request', steps: ['appointment', 'check-in', 'diagnose', 'estimate', 'approve', 'repair', 'check', 'pickup', 'pay'], entities: ['appointment', 'work-order', 'estimate', 'repair'] },
    { id: 'parts-order', name: 'Parts Order', steps: ['need', 'order', 'receive', 'inspect', 'install', 'bill'], entities: ['part', 'part-order', 'work-order'] },
  ],
  entities: [
    { name: 'Vehicle', description: 'Vehicle with VIN, specs, inventory status, and service history', invariants: ['VIN unique and verifiable', 'odometer tracked per service'] },
    { name: 'ServiceOrder', description: 'Service work order with diagnosis, estimate, and repair records', invariants: ['estimate required before work', 'authorization required for over-limit'] },
    { name: 'SalesLead', description: 'Sales lead with qualification status and deal tracking', invariants: ['lead source tracked', 'all interactions logged'] },
  ],
  invariants: ['VIN unique and verifiable', 'estimate required before service', 'recall work at no customer cost', 'warranty verification per VIN and mileage'],
  constraints: ['diagnostic fee $129 waived with repair', 'service bay capacity per technician skill', 'financing markup max 2%', 'trade-in offer within 10% of retail'],
  financialFlows: [
    { name: 'vehicle-sale', direction: 'in', trigger: 'sale-completed' },
    { name: 'service-payment', direction: 'in', trigger: 'service-completed-and-paid' },
    { name: 'parts-sale', direction: 'in', trigger: 'parts-sold' },
    { name: 'warranty-claim', direction: 'in', trigger: 'warranty-work-approved' },
    { name: 'supplier-payment', direction: 'out', trigger: 'parts-invoice-approved' },
    { name: 'technician-commission', direction: 'out', trigger: 'service-completed' },
  ],
  successMetrics: ['units-sold-per-month', 'service-department-profit', 'gross-profit-per-vehicle', 'customer-satisfaction-score', 'service-pay-time', 'parts-turnover-rate', 'lead-to-sale-conversion-rate'],
  analytics: { tracked: ['sales-metrics', 'service-metrics', 'inventory-turns', 'lead-sources', 'technician-productivity', 'parts-velocity'], dashboards: ['sales-dashboard', 'service-dashboard', 'inventory-dashboard', 'financial-dashboard'] },
  securityRequirements: ['jwt-auth', 'dms-integration-security', 'pci-compliance', 'vin-data-protection', 'fcra-compliance', 'audit-logging'],
  regulatory: [
    { regulation: 'NHTSA', applies: true, notes: 'Recall tracking and safety compliance' },
    { regulation: 'Lemon Law', applies: true, notes: 'Defect documentation and buyback' },
    { regulation: 'FCRA', applies: true, notes: 'Credit check consent and adverse action' },
    { regulation: 'TILA', applies: true, notes: 'Finance disclosure requirements' },
  ],
};
