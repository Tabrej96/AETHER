/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Maritime Domain Pack
 *
 * Complete maritime and shipping logistics platform — from cargo booking to port delivery.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForMaritime(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'container-shipping',
      description: 'Ocean freight carrier operating container vessels on major trade lanes. Revenue from container freight charges and port fees.',
      pricingExamples: ['40ft container $2,000-5,000 (Asia-US)', '20ft container $1,000-2,500', 'Fuel surcharge $200-500 per container', 'Port fees $100-300 per container'],
    },
    {
      modelType: 'port-operations',
      description: 'Port terminal operator managing cargo loading/unloading, storage, and vessel berthing.',
      pricingExamples: ['Terminal handling $100-300 per container', 'Berthing fee $500-2,000 per vessel', 'Storage $5-15 per container per day', 'Crane operations $200-500 per move'],
    },
    {
      modelType: 'freight-forwarding',
      description: 'Freight forwarding and logistics coordinating end-to-end shipping with customs brokerage.',
      pricingExamples: ['Freight forwarding $50-200 per shipment', 'Customs brokerage $50-150 per entry', 'Insurance $0.50-2.00 per $100 value', 'Door delivery $100-500 per shipment'],
    },
  ];
}

function revenueStreamsForMaritime(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Freight Charges',
      description: 'Primary revenue from ocean freight shipping per container or weight.',
      pricingModel: 'per-container or per-ton',
      examples: ['40ft container $2,000-5,000', '20ft container $1,000-2,500', 'Bulk cargo $5-15/ton', 'LCL $50-200/cubic meter'],
    },
    {
      name: 'Port Fees',
      description: 'Revenue from vessel berthing, cargo handling, and terminal operations.',
      pricingModel: 'per-vessel or per-container',
      examples: ['Berthing fee $500-2,000', 'Terminal handling $100-300/container', 'Pilotage $200-1,000', 'Towage $300-800'],
    },
    {
      name: 'Charter Rates',
      description: 'Revenue from vessel chartering — time charter, voyage charter, or bareboat.',
      pricingModel: 'per-day or per-voyage',
      examples: ['Time charter $10,000-50,000/day', 'Voyage charter $500,000-2,000,000', 'Bareboat $15,000-80,000/day'],
    },
    {
      name: 'Customs Brokerage',
      description: 'Revenue from customs clearance services including duties, taxes, and documentation.',
      pricingModel: 'per-shipment',
      examples: ['Entry filing $50-150', 'Duty payment processing $25-75', 'Bonded warehouse $100-500/month', 'Consultation $150-300/hour'],
    },
    {
      name: 'Insurance Premiums',
      description: 'Revenue from cargo and vessel insurance premiums.',
      pricingModel: 'percentage-of-cargo-value',
      examples: ['Cargo insurance 0.5-2% of value', 'Hull insurance 1-3% of vessel value', 'P&I club dues per vessel', 'War risk premium 0.1-0.5%'],
    },
  ];
}

function userRoleMatrixForMaritime(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'shipper',
      roleName: 'Shipper',
      description: 'Manufacturer or exporter booking cargo shipping, preparing documentation, and tracking shipments.',
      permissions: ['book-shipments', 'prepare-documents', 'track-cargo', 'file-claims', 'view-rates'],
      features: ['shipment-booking', 'tracking', 'document-management', 'rate-calculator', 'claims'],
      constraints: ['dangerous goods require special handling', 'documents must be complete before loading', 'claims within time limits'],
    },
    {
      roleId: 'consignee',
      roleName: 'Consignee',
      description: 'Receiver of cargo at destination port. Manages customs clearance and delivery coordination.',
      permissions: ['view-shipments', 'customs-clearance', 'arrange-delivery', 'pay-charges', 'report-issues'],
      features: ['shipment-tracking', 'customs-portal', 'delivery-coordination', 'document-access', 'payment'],
      constraints: ['must provide import documentation', 'duties and taxes payable on arrival', 'demurrage charges after free time'],
    },
    {
      roleId: 'captain',
      roleName: 'Captain',
      description: 'Vessel master responsible for navigation, crew safety, cargo security, and regulatory compliance.',
      permissions: ['view-route', 'update-vessel-status', 'report-incidents', 'manage-cargo-securing', 'file-manifests'],
      features: ['navigation-tools', 'weather-briefing', 'crew-management', 'cargo-manifest', 'incident-reporting'],
      constraints: ['must follow approved route', 'cargo securing per IMO regulations', 'incident reporting within regulatory timeframe'],
    },
    {
      roleId: 'port-agent',
      roleName: 'Port Agent',
      description: 'Local representative managing vessel port call, berthing, documentation, and local coordination.',
      permissions: ['manage-port-call', 'coordinate-pilotage', 'process-documents', 'arrange-services', 'communicate-with-authorities'],
      features: ['port-call-management', 'berth-scheduling', 'document-processing', 'service-coordination', 'authority-liaison'],
      constraints: ['berth availability confirmed 24h before arrival', 'customs and immigration notification required', 'port regulations must be followed'],
    },
    {
      roleId: 'customs-broker',
      roleName: 'Customs Broker',
      description: 'Licensed professional handling customs clearance, duty payment, and regulatory compliance.',
      permissions: ['file-entries', 'pay-duties', 'classify-goods', 'request-release', 'communicate-with-customs'],
      features: ['entry-filing', 'duty-calculation', 'classification-database', 'document-generation', 'authority-portal'],
      constraints: ['must hold valid broker license', 'entries must be accurate and complete', 'HS code classification required for all goods'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing shipments, vessels, ports, users, billing, and compliance.',
      permissions: ['*'],
      features: ['dashboard', 'shipment-management', 'vessel-tracking', 'port-management', 'billing', 'reports', 'compliance'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'regulatory compliance mandatory'],
    },
  ];
}

function operationalWorkflowsForMaritime(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'book-to-sail',
      name: 'Book to Sail',
      description: 'Shipper books cargo space, prepares documentation, cargo loaded, vessel departs, and sailing begins.',
      steps: ['rate-inquiry', 'booking-created', 'space-confirmed', 'documentation-prepared', 'customs-export', 'cargo-delivered-to-port', 'loading-completed', 'manifest-filed', 'vessel-departs', 'sailing-notified'],
      entities: ['booking', 'shipping-order', 'bill-of-lading', 'manifest', 'shipment'],
      triggers: ['booking-confirmed', 'space-confirmed', 'cargo-loaded', 'vessel-departed'],
    },
    {
      workflowId: 'port-call-to-departure',
      name: 'Port Call to Departure',
      description: 'Vessel arrives at port, pilot boards, berth assigned, cargo loaded/unloaded, port documents processed, and vessel departs.',
      steps: ['eta-notified', 'arrival-announced', 'pilot-dispatched', 'berth-assigned', 'tie-up-completed', 'cargo-operations', 'documents-processed', 'customs-clearance', 'pilot-disembarked', 'vessel-departs'],
      entities: ['vessel', 'port-call', 'cargo-operation', 'document', 'berth'],
      triggers: ['vessel-arrived', 'berth-assigned', 'cargo-complete', 'vessel-departed'],
    },
    {
      workflowId: 'customs-to-clearance',
      name: 'Customs to Clearance',
      description: 'Shipment arrives at destination, customs entry filed, duties calculated and paid, inspection performed, and cargo released.',
      steps: ['arrival-notice', 'entry-prepared', 'entry-filed', 'classification-determined', 'duties-calculated', 'duties-paid', 'inspection-requested', 'inspection-completed', 'cargo-released', 'delivery-arranged'],
      entities: ['shipment', 'customs-entry', 'duty-payment', 'inspection', 'release-order'],
      triggers: ['arrival-notice', 'entry-filed', 'duties-paid', 'cargo-released'],
    },
    {
      workflowId: 'cargo-to-delivery',
      name: 'Cargo to Delivery',
      description: 'Cargo released from port, transported to destination, delivered to consignee, and confirmed.',
      steps: ['cargo-released', 'pickup-arranged', 'transit', 'customs-clearance', 'last-mile-delivery', 'proof-of-delivery', 'consignee-confirmed'],
      entities: ['cargo', 'shipment', 'delivery', 'proof-of-delivery'],
      triggers: ['cargo-released', 'in-transit', 'delivered', 'confirmed'],
    },
  ];
}

function stateMachinesForMaritime(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Shipment',
      states: ['booking', 'confirmed', 'cargo-loaded', 'in-transit', 'port-arrival', 'customs', 'cleared', 'delivered', 'cancelled', 'disputed'],
      transitions: { booking: ['confirmed', 'cancelled'], confirmed: ['cargo-loaded', 'cancelled'], 'cargo-loaded': ['in-transit'], 'in-transit': ['port-arrival'], 'port-arrival': ['customs'], customs: ['cleared'], cleared: ['delivered'], delivered: ['disputed'] },
      initialState: 'booking',
      terminalStates: ['delivered', 'cancelled', 'disputed'],
    },
    {
      entityName: 'Vessel',
      states: ['at-sea', 'approaching-port', 'at-anchor', 'berthed', 'loading', 'departing', 'in-port', 'maintenance'],
      transitions: { 'at-sea': ['approaching-port', 'in-port'], 'approaching-port': ['at-anchor'], 'at-anchor': ['berthed'], berthed: ['loading'], loading: ['departing'], departing: ['at-sea'], 'in-port': ['maintenance'], maintenance: ['at-sea'] },
      initialState: 'at-sea',
      terminalStates: [],
    },
    {
      entityName: 'Container',
      states: ['empty', 'stuffed', 'sealed', 'at-port', 'loaded-on-vessel', 'in-transit', 'discharged', 'at-destination-port', 'customs-inspection', 'released', 'delivered', 'empty-returned'],
      transitions: { empty: ['stuffed'], stuffed: ['sealed'], sealed: ['at-port'], 'at-port': ['loaded-on-vessel'], 'loaded-on-vessel': ['in-transit'], 'in-transit': ['discharged'], discharged: ['at-destination-port'], 'at-destination-port': ['customs-inspection'], 'customs-inspection': ['released'], released: ['delivered'], delivered: ['empty-returned'], 'empty-returned': ['empty'] },
      initialState: 'empty',
      terminalStates: [],
    },
    {
      entityName: 'CustomsEntry',
      states: ['draft', 'submitted', 'under-review', 'classified', 'duties-assessed', 'paid', 'inspected', 'released', 'rejected'],
      transitions: { draft: ['submitted'], submitted: ['under-review', 'rejected'], 'under-review': ['classified'], classified: ['duties-assessed'], 'duties-assessed': ['paid'], paid: ['inspected'], inspected: ['released'] },
      initialState: 'draft',
      terminalStates: ['released', 'rejected'],
    },
  ];
}

function edgeCasesForMaritime(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Port Congestion / Delay',
      description: 'Vessel cannot berth due to port congestion, labor strikes, or extreme weather, causing cascading delays across the supply chain.',
      handling: 'Port agent notified of ETA changes. Vessel placed at anchor or redirected to alternate port. Consignees notified of revised arrival. Demurrage clock paused for force majeure. Charter party provisions reviewed for laytime claims. Alternative routing evaluated.',
      recovery: 'If berth becomes available: vessel proceeds to berth, operations accelerated. If alternate port: transshipment arranged, additional costs documented. Contractual claims per charter party. Schedule recalculated for downstream ports.',
    },
    {
      scenario: 'Cargo Damage / Loss',
      description: 'Container damaged during loading, storm at sea, or improper handling. Cargo water-damaged, crushed, or completely lost.',
      handling: 'Damage photographed and documented on vessel. Marine surveyor arranged at discharge port. Bill of lading endorsed with damage notation. Cargo insurance claim initiated. Consignee notified with photos and estimated extent.',
      recovery: 'Surveyor assessment determines cause and liability. Insurance claim filed with survey report. Partial or total loss settlement processed. Salvage options evaluated. Consignee provided with replacement timeline or settlement. Vessel and handling equipment inspected.',
    },
    {
      scenario: 'Customs Seizure',
      description: 'Customs authorities seize cargo at destination port due to documentation errors, prohibited goods, or duty evasion.',
      handling: 'Customs broker immediately notified of seizure notice. Seizure documentation obtained from authorities. Shipper and consignee notified. Legal counsel engaged if needed. All documentation reviewed for accuracy.',
      recovery: 'If documentation error: corrected documents submitted for re-release. If prohibited goods: re-export or destruction arranged. If duty dispute: appeal filed with customs tribunal. Insurance claim for seized goods. Process documented for future prevention.',
    },
  ];
}

function integrationsForMaritime(): DomainPack['integrations'] {
  return [
    {
      name: 'Port Management Systems',
      type: 'operations',
      description: 'Port operating system (TOS) integration for berth scheduling, cargo operations, and vessel tracking.',
      required: true,
      configuration: 'API for berth request and confirmation. Cargo operation reporting (load/discharge). Vessel ETA updates. Port fee calculation. Gate and terminal operations coordination.',
    },
    {
      name: 'Customs APIs',
      type: 'government',
      description: 'Automated customs filing (ACE, ABI) for import/export declarations.',
      required: false,
      configuration: 'Electronic manifest filing. Entry creation and modification. Duty payment processing. Release request and tracking. CBP/ICE coordination for holds.',
    },
    {
      name: 'Vessel Tracking (AIS)',
      type: 'tracking',
      description: 'Automatic Identification System integration for real-time vessel position and movement.',
      required: true,
      configuration: 'AIS data feed from satellite and terrestrial receivers. Vessel position updated every 3-10 minutes. Route tracking with geofencing. ETA calculation based on current position and speed. Historical track replay.',
    },
    {
      name: 'Container Tracking (IoT)',
      type: 'tracking',
      description: 'IoT sensors on containers for location, temperature, humidity, and shock monitoring.',
      required: false,
      configuration: 'GPS and cellular/Iridium connectivity for global coverage. Temperature and humidity sensors for reefer containers. Shock sensors for fragile cargo. Battery life monitoring. Geofence alerts for route deviation.',
    },
    {
      name: 'EDI for Shipping Documents',
      type: 'document',
      description: 'Electronic Data Interchange for standard shipping documents (B/L, manifest, customs).',
      required: true,
      configuration: 'EDIFACT or XML EDI formats. Bill of lading transmission. Manifest filing. Container event messages (load, discharge, gate-in, gate-out). Partner EDI connectivity.',
    },
    {
      name: 'Insurance Platform',
      type: 'insurance',
      description: 'Cargo and hull insurance management with claim filing.',
      required: false,
      configuration: 'Cargo insurance quotes per shipment value and route. Policy issuance. Claim filing with supporting documents. Premium calculation per cargo type and risk level.',
    },
  ];
}

function technicalArchitectureForMaritime(): TechnicalArchitectureDef {
  return {
    patterns: ['Event-driven shipment tracking with EDI message processing', 'Geospatial vessel tracking with real-time AIS data', 'Container IoT data ingestion and alerting', 'EDI document processing for customs and shipping', 'Multi-currency and multi-language support for international trade'],
    infrastructure: ['PostgreSQL for shipment, vessel, and port data', 'TimescaleDB or InfluxDB for AIS tracking data', 'S3-compatible storage for shipping documents', 'Redis for real-time vessel position cache', 'MQ broker for EDI message processing', 'Mapbox or similar for vessel mapping'],
    dataFlow: 'Shipper books shipment → container stuffed and sealed → vessel loading at port → AIS tracking transmitted → vessel sails → arrival at destination port → customs entry filed → duties paid → inspection → cargo released → last-mile delivery → proof of delivery. Container IoT sensors transmit location, temperature, and condition data throughout journey.',
    scalability: 'AIS data handled via time-series database with downsampling. Vessel tracking queries optimized with geospatial indexes. EDI messages processed via message queue with retry logic. Container IoT data filtered for alert-worthy events. Multi-port operations handled via partitioned databases.',
  };
}

function regulatoryComplianceForMaritime(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'SOLAS (Safety of Life at Sea)',
      jurisdiction: 'Global (IMO)',
      requirements: ['Life-saving equipment requirements', 'Fire protection systems', 'Stability and load line compliance', 'GMDSS communication equipment', 'Safety management system (SMS)'],
      impact: 'Vessel safety equipment tracked and certified. Load planning validated against stability calculations. GMDSS communication monitoring. Safety drills and training records maintained.',
    },
    {
      regulation: 'MARPOL (Marine Pollution)',
      jurisdiction: 'Global (IMO)',
      requirements: ['Oil pollution prevention', 'Sewage and garbage management', 'Air pollution (SOx, NOx)', 'Ballast water management', 'Polar code compliance'],
      impact: 'Ballast water reporting and management. Garbage record books maintained. Fuel consumption and emission tracking. Oil record books for all vessels. Polar code compliance for arctic routes.',
    },
    {
      regulation: 'ISPS Code (Maritime Security)',
      jurisdiction: 'Global (IMO)',
      requirements: ['Ship security plans', 'Port facility security', 'Access control systems', 'Cargo securing verification', 'Security alert systems'],
      impact: 'Ship security plan maintained and audited. Access control to port facilities. Cargo securing verified before departure. Security alert procedures documented and drilled.',
    },
    {
      regulation: 'Customs Regulations',
      jurisdiction: 'Per-country',
      requirements: ['Import/export declarations', 'HS code classification', 'Duty and tax payment', 'Restricted/prohibited goods', 'Trade compliance and sanctions'],
      impact: 'Electronic manifest filing. HS code database integration. Duty calculation per country schedules. Sanctions screening for all parties. Restricted goods flagging.',
    },
  ];
}

function businessRulesForMaritime(): string[] {
  return [
    'Freight charges quoted FOB (Free on Board) port of loading. Buyer arranges and pays for ocean freight.',
    'Free time at port: 3-7 days for loaded containers, 5-14 days for empty containers. Demurrage charges apply after free time expires.',
    'Bill of lading: issued after cargo loaded. Original B/L required for cargo release at destination. Express B/L available for additional fee.',
    'Dangerous goods: must be declared per IMO IMDG code. Separate stowage required. Special handling fees apply. Documentation mandatory.',
    'Container weight verification (VGM): verified gross mass required 24h before loading. Weight discrepancy may result in loading rejection.',
    'Customs clearance: entries must be filed within 15 days of arrival. Duties and taxes payable within specified timeframe per country.',
    'Insurance: cargo insured at 110% of invoice value. Claims filed within 60 days of arrival for visible damage.',
  ];
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const MARITIME_PACK: DomainPack = {
  domain: 'maritime',
  name: 'Maritime & Shipping Logistics',
  description: 'Complete maritime and shipping logistics platform — from cargo booking to port delivery and customs clearance. Covers container shipping, vessel chartering, freight forwarding, port operations, vessel tracking via AIS, container IoT monitoring, customs brokerage, and compliance with IMO, SOLAS, MARPOL, and ISPS regulations.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Container Shipping', 'Bulk Cargo', 'Port Operations', 'Freight Forwarding', 'Vessel Charter', 'Customs Brokerage'],
    features: [
      'shipment-booking',
      'container-tracking',
      'vessel-tracking',
      'customs-filing',
      'rate-calculator',
      'document-management',
      'dangerous-goods',
      'insurance',
      'trade-compliance',
      'port-directory',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['port-to-port', 'door-to-door', 'port-to-door', 'air-freight-alternative', 'charter-vessel'],
    features: [
      'container-booking',
      'cargo-tracking',
      'customs-clearance',
      'insurance',
      'warehousing',
      'last-mile-delivery',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'shipment-tracking',
      'rate-quotes',
      'document-access',
      'customs-portal',
      'delivery-tracking',
      'payment-center',
      'shipment-history',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'vessel-management',
      'port-coordination',
      'cargo-operations',
      'document-processing',
      'customs-compliance',
      'billing',
      'reporting',
      'risk-management',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'route-maps',
      'transit-time-calculator',
      'trade-lane-info',
      'port-guides',
      'regulatory-updates',
      'sustainability-reports',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'shipment-tracking',
      'rate-quotes',
      'port-directory',
      'trade-lanes',
      'contact',
      'documentation',
    ],
    customer: [
      'dashboard',
      'new-shipment',
      'tracking',
      'documents',
      'customs-portal',
      'billing',
      'shipment-history',
    ],
    admin: [
      'operations-dashboard',
      'vessel-management',
      'port-management',
      'shipment-management',
      'customs-management',
      'billing',
      'reports',
      'compliance',
    ],
    staff: [
      'shipment-coordination',
      'port-operations',
      'document-processing',
      'customs-clearance',
      'vessel-tracking',
      'issue-resolution',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForMaritime() as unknown as BusinessRulesSpec,

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Global map as hero with vessel positions and trade routes',
      'Shipment tracking timeline with port stops and transit events',
      'Document-centric interface for bills of lading and customs forms',
      'Data-dense operational dashboard with vessel and cargo status',
      'Form-heavy workflows for customs entry and shipping order creation',
      'Mobile-first for port and vessel operations',
    ],
    color: [
      'Ocean navy (#1A237E) primary for maritime brand',
      'Sea blue (#0077B6) for water and navigation',
      'Cargo green (#2E7D32) for cleared and on-schedule status',
      'Alert amber (#FF8F00) for delays and inspections',
      'Alert red (#D32F2F) for emergencies and holds',
      'Chart white (#FAFAFA) for document backgrounds',
      'Steel gray (#546E7A) for infrastructure elements',
    ],
    typography: [
      'Technical sans-serif for vessel codes and container numbers',
      'Clean sans-serif (Inter) for body and UI',
      'Monospace for tracking numbers and reference codes',
      'Bold for port and vessel names',
      'High contrast for outdoor terminal visibility',
    ],
    interaction: [
      'Interactive global map with vessel and container positions',
      'Shipment timeline with draggable event markers',
      'Document preview with annotation for customs entries',
      'Real-time AIS vessel tracking with route overlay',
      'EDI message status tracking with resend capability',
      'Push notifications for port delays and customs holds',
      'Offline mode for port operations without connectivity',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance',
      'Screen reader support for shipment tracking',
      'Keyboard navigation for document forms',
      'High contrast for outdoor port visibility',
      'Multi-language support for international trade',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Shipper (booking, tracking, documents), Consignee (customs, delivery), Captain (vessel status, manifest), Port Agent (port call, berthing), Customs Broker (filing, clearance), Admin (full platform). JWT with 8h expiry. Refresh tokens with 30d. MFA for financial and customs operations.',
    data: 'Shipment data includes cargo descriptions, values, and HS codes. Vessel data includes positions, routes, and cargo manifests. Customs data includes declarations, duties, and compliance records. Bill of lading data is legally binding. PCI DSS for payment processing. Trade compliance data protected.',
    compliance: ['IMO SOLAS safety regulations', 'MARPOL pollution prevention', 'ISPS maritime security code', 'Customs regulations per country', 'Trade sanctions compliance', 'Dangerous goods (IMDG) handling', 'Data privacy for international trade'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Freight charge calculation per container type and route',
      'Demurrage calculation based on free time expiration',
      'Duty calculation per HS code and country schedule',
      'VGM weight verification against carrier tolerance',
      'Vessel ETA calculation based on AIS position and speed',
      'Container status transition logic',
      'EDI message validation per format standards',
      'Free time calculation per port tariff',
    ],
    integration: [
      'Shipment booking → documentation → loading → vessel departure → tracking → arrival',
      'Vessel AIS → position update → ETA calculation → port notification → berth request',
      'Container IoT → position update → condition alert → geofence breach → notification',
      'Customs entry → classification → duty calculation → payment → release → delivery',
      'EDI manifest → customs filing → entry processing → cargo release',
    ],
    e2e: [
      'Shipper journey: book shipment → prepare documents → cargo loaded → track → customs → delivery',
      'Vessel journey: departure → port call → cargo operations → documentation → next port',
      'Customs journey: arrival notice → entry filing → duty payment → inspection → release',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForMaritime(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForMaritime(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForMaritime(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForMaritime(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForMaritime(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForMaritime(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForMaritime(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForMaritime(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForMaritime(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const MARITIME_DOMAIN: DomainModel = {
  id: MARITIME_PACK.domain,
  domain: MARITIME_PACK.domain,
  name: MARITIME_PACK.name,
  label: MARITIME_PACK.name,
  category: 'maritime',
  description: MARITIME_PACK.description,
  userRoles: [
    { id: 'shipper', name: 'Shipper', typicalFeatures: ['shipment-booking', 'tracking', 'document-management', 'rate-calculator'], permissions: ['book-shipments', 'prepare-documents', 'track-cargo', 'file-claims'] },
    { id: 'consignee', name: 'Consignee', typicalFeatures: ['shipment-tracking', 'customs-portal', 'delivery-coordination', 'payment'], permissions: ['view-shipments', 'customs-clearance', 'arrange-delivery', 'pay-charges'] },
    { id: 'captain', name: 'Captain', typicalFeatures: ['navigation-tools', 'weather-briefing', 'cargo-manifest', 'incident-reporting'], permissions: ['view-route', 'update-vessel-status', 'report-incidents', 'file-manifests'] },
    { id: 'port-agent', name: 'Port Agent', typicalFeatures: ['port-call-management', 'berth-scheduling', 'document-processing', 'service-coordination'], permissions: ['manage-port-call', 'coordinate-pilotage', 'process-documents', 'arrange-services'] },
    { id: 'customs-broker', name: 'Customs Broker', typicalFeatures: ['entry-filing', 'duty-calculation', 'document-generation', 'authority-portal'], permissions: ['file-entries', 'pay-duties', 'classify-goods', 'request-release'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'shipment-management', 'vessel-tracking', 'port-management'], permissions: ['*'] },
  ],
  role: 'shipper',
  standardFeatures: [],
  businessModels: [
    { modelType: 'container-shipping', revenueStreams: ['freight-charges', 'fuel-surcharges', 'port-fees', 'cargo-insurance'], costStructure: ['vessel-operations', 'fuel', 'port-fees', 'crew', 'maintenance'], pricingStrategy: ['per-feu', 'per-teu', 'spot-market', 'contract-rates'] },
    { modelType: 'port-operations', revenueStreams: ['terminal-handling', 'berthing-fees', 'storage-fees', 'crane-services'], costStructure: ['equipment', 'labor', 'infrastructure', 'maintenance'], pricingStrategy: ['per-container', 'per-vessel', 'per-day-storage'] },
    { modelType: 'freight-forwarding', revenueStreams: ['forwarding-fees', 'customs-brokerage', 'insurance-premiums', 'door-delivery'], costStructure: ['carrier-contracts', 'customs-duties', 'transportation', 'warehousing'], pricingStrategy: ['per-shipment', 'value-based', 'volume-discount'] },
  ],
  technicalPatterns: [
    { category: 'tracking', name: 'AIS Vessel Tracking', description: 'Real-time vessel position via satellite and terrestrial AIS', rationale: 'Global vessel tracking requires satellite coverage beyond terrestrial range' },
    { category: 'iot', name: 'Container IoT Monitoring', description: 'Temperature, humidity, and shock sensors for cargo condition monitoring', rationale: 'Reefer and sensitive cargo requires continuous condition monitoring' },
    { category: 'integration', name: 'EDI Document Processing', description: 'EDIFACT/XML processing for bills of lading and customs', rationale: 'Maritime trade relies on standardized EDI for efficiency' },
    { category: 'compliance', name: 'Trade Compliance Screening', description: 'Sanctions and restricted party screening for all parties', rationale: 'International trade requires compliance with trade regulations' },
  ],
  operationalLifecycle: [
    { id: 'book', name: 'Book', description: 'Shipment booked with vessel and container space reserved' },
    { id: 'load', name: 'Load', description: 'Cargo stuffed, sealed, and loaded onto vessel' },
    { id: 'sail', name: 'Sail', description: 'Vessel sails with AIS tracking throughout voyage' },
    { id: 'clear', name: 'Clear', description: 'Customs entry filed, duties paid, cargo cleared' },
    { id: 'deliver', name: 'Deliver', description: 'Cargo delivered to consignee with proof of delivery' },
  ],
  designPrinciples: [
    { name: 'Global Map Visualization', description: 'World map with vessel positions and shipment routes' },
    { name: 'Document Accuracy', description: 'Legal-grade document handling with clear audit trails' },
    { name: 'Regulatory Compliance First', description: 'IMO, customs, and trade regulations enforced in workflow' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Broker license verification', description: 'Customs broker credentials validated', severity: 'high' },
    { category: 'data', name: 'Bill of lading protection', description: 'Legal document integrity and access control', severity: 'critical' },
    { category: 'compliance', name: 'IMO regulations', description: 'Safety, security, and pollution compliance', severity: 'critical' },
    { category: 'compliance', name: 'Trade sanctions', description: 'Sanctions screening for all parties', severity: 'critical' },
  ],
  regulations: [
    { name: 'SOLAS', requirements: ['Safety equipment', 'Fire protection', 'Stability compliance', 'GMDSS'] },
    { name: 'MARPOL', requirements: ['Pollution prevention', 'Garbage management', 'Ballast water', 'Emissions'] },
    { name: 'ISPS Code', requirements: ['Ship security plans', 'Access control', 'Security alerts'] },
    { name: 'Customs', requirements: ['Import/export filings', 'Duty calculation', 'Sanctions screening'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Demurrage calculation', description: 'Free time and penalty calculation', priority: 'high' },
    { category: 'unit', name: 'Duty calculation', description: 'HS code classification and duty rates', priority: 'high' },
    { category: 'integration', name: 'Shipment lifecycle', description: 'Booking → loading → sailing → clearance → delivery', priority: 'high' },
    { category: 'e2e', name: 'Full shipping journey', description: 'Shipper → vessel → port → customs → consignee', priority: 'medium' },
  ],
  workflows: [
    { id: 'book-to-sail', name: 'Book to Sail', steps: ['rate', 'book', 'confirm', 'documents', 'customs-export', 'load', 'manifest', 'depart'], entities: ['booking', 'shipping-order', 'bill-of-lading', 'manifest'] },
    { id: 'port-call', name: 'Port Call', steps: ['eta', 'arrive', 'pilot', 'berth', 'operations', 'documents', 'depart'], entities: ['vessel', 'port-call', 'cargo-operation'] },
    { id: 'customs-clearance', name: 'Customs Clearance', steps: ['notice', 'entry', 'classify', 'duties', 'inspect', 'release', 'deliver'], entities: ['shipment', 'customs-entry', 'duty-payment'] },
  ],
  entities: [
    { name: 'Shipment', description: 'Cargo shipment with booking, container, and delivery details', invariants: ['B/L issued after loading', 'VGM required before loading'] },
    { name: 'Vessel', description: 'Vessel with route, schedule, and cargo manifest', invariants: ['airworthiness certified', 'manifest accurate before departure'] },
    { name: 'Container', description: 'Shipping container with cargo, seal, and condition', invariants: ['VGM verified', 'seal intact for entire journey'] },
  ],
  invariants: ['B/L issued only after cargo loaded', 'VGM verified before loading', 'crew rest per STCW regulations', 'customs entry required before discharge'],
  constraints: ['free time 3-7 days at port', 'demurrage after free time expires', 'VGM 24h before loading', 'duties within customs timeframe'],
  financialFlows: [
    { name: 'freight-charges', direction: 'in', trigger: 'shipment-completed' },
    { name: 'port-fees', direction: 'in', trigger: 'port-call-completed' },
    { name: 'charter-payment', direction: 'in', trigger: 'charter-period-completed' },
    { name: 'duties-paid', direction: 'out', trigger: 'customs-entry-cleared' },
    { name: 'supplier-payment', direction: 'out', trigger: 'port-services-rendered' },
  ],
  successMetrics: ['on-time-delivery-rate', 'vessel-utilization', 'port-turnaround-time', 'customs-clearance-time', 'damage-loss-ratio', 'demurrage-costs', 'container-turnaround-time'],
  analytics: { tracked: ['shipments', 'vessel-positions', 'port-congestion', 'customs-delays', 'damage-events', 'revenue'], dashboards: ['operations-dashboard', 'vessel-tracking', 'shipment-tracking', 'customs-dashboard'] },
  securityRequirements: ['jwt-auth', 'document-encryption', 'trade-sanctions-screening', 'pci-compliance', 'imo-audit-logging'],
  regulatory: [
    { regulation: 'SOLAS', applies: true, notes: 'Maritime safety compliance' },
    { regulation: 'MARPOL', applies: true, notes: 'Pollution prevention' },
    { regulation: 'ISPS', applies: true, notes: 'Maritime security' },
    { regulation: 'Customs', applies: true, notes: 'Per-country import/export' },
  ],
};
