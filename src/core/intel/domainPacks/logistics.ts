/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Logistics Domain Pack
 *
 * End-to-end logistics and supply chain management platform covering shipment tracking,
 * warehouse management, route optimization, fleet dispatch, customs compliance,
 * and last-mile delivery coordination across carriers and partners.
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
      { id: 'carrier', name: 'Carrier', typicalFeatures: pack.operations.features, permissions: ['read', 'write', 'dispatch'] },
      { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'reports'], permissions: ['admin'] },
    ],
    role: 'user',
    standardFeatures: allFeatures.length > 0 ? allFeatures : [{ category: 'core', name: 'core', description: 'Core product', priority: 'essential' }],
    businessModels: [{ modelType: pack.domain, revenueStreams: ['shipping-fees', 'carrier-commission', 'subscription'], costStructure: ['fleet', 'warehouse', 'carrier-payouts', 'technology'], pricingStrategy: ['per-shipment', 'subscription', 'volume-discounts'] }],
    technicalPatterns: [
      { category: 'integration', name: 'Carrier API Integration', description: 'Standardized carrier API abstraction layer' },
      { category: 'data', name: 'Real-time GPS Tracking', description: 'WebSocket-based location streaming' },
      { category: 'architecture', name: 'Event-driven Architecture', description: 'Shipment state machine with event sourcing' },
    ],
    operationalLifecycle: [
      { id: 'booking', name: 'Booking', description: 'Customer creates shipment booking' },
      { id: 'dispatch', name: 'Dispatch', description: 'Route assignment and carrier selection' },
      { id: 'transit', name: 'Transit', description: 'Active shipment tracking and monitoring' },
      { id: 'delivery', name: 'Delivery', description: 'Final delivery confirmation and proof' },
      { id: 'post', name: 'Post-Delivery', description: 'Returns, claims, and review' },
    ],
    designPrinciples: [
      { name: 'Map-First', description: 'Primary interface centered on map visualization' },
      { name: 'Status Clarity', description: 'Clear, color-coded shipment status indicators' },
      { name: 'Mobile-Ready', description: 'Full functionality on mobile devices' },
    ],
    securityConsiderations: [
      { category: 'auth', name: 'Multi-role Authentication', description: 'Carrier, shipper, and admin roles with distinct access', severity: 'high' },
      { category: 'data', name: 'Tracking Data Encryption', description: 'All tracking data encrypted at rest and in transit', severity: 'high' },
      { category: 'compliance', name: 'Regulatory Compliance', description: 'GDPR, IATA, and customs regulations adherence', severity: 'medium' },
    ],
    regulations: [
      { name: 'GDPR', requirements: ['Data minimization', 'Right to erasure', 'Consent management', '72-hour breach notification'] },
      { name: 'IATA', requirements: ['Hazardous materials handling', 'Air shipment documentation', 'Security declarations'] },
      { name: 'Customs Regulations', requirements: ['HS code classification', 'Commercial invoices', 'Electronic export filing for high-value shipments'] },
    ],
    testingRequirements: [
      { category: 'unit', name: 'Route Optimization', description: 'Verify shortest path within constraints', priority: 'high' },
      { category: 'unit', name: 'Tracking Validation', description: 'Format checks and carrier lookup', priority: 'high' },
      { category: 'unit', name: 'Customs Duty Calc', description: 'HS code mapping and country-specific rates', priority: 'medium' },
      { category: 'integration', name: 'Booking to Label', description: 'Booking → label → carrier API → tracking activation', priority: 'high' },
      { category: 'integration', name: 'Warehouse Scan Flow', description: 'Scan → inventory update → status → notification', priority: 'high' },
      { category: 'integration', name: 'GPS to ETA', description: 'GPS tracking → ETA recalculation → customer notification', priority: 'high' },
      { category: 'e2e', name: 'Full Shipment Journey', description: 'Book → scan → pickup → track → deliver → review', priority: 'high' },
      { category: 'e2e', name: 'International Shipment', description: 'Customs filing → duty payment → clearance → delivery → docs', priority: 'medium' },
    ],
    workflows: [
      { id: 'shipment-creation', name: 'Shipment Creation', steps: ['customer-enters-details', 'validate-address', 'calculate-rates', 'generate-label', 'assign-carrier'], entities: ['Shipment', 'Address', 'Label'] },
      { id: 'tracking', name: 'Shipment Tracking', steps: ['activate-tracking', 'poll-carrier-api', 'update-status', 'trigger-notifications', 'calculate-eta'], entities: ['Shipment', 'TrackingEvent', 'Notification'] },
      { id: 'dispatch', name: 'Dispatch Workflow', steps: ['collect-pending', 'optimize-routes', 'assign-drivers', 'notify-carriers', 'monitor-progress'], entities: ['Shipment', 'Route', 'Driver'] },
      { id: 'delivery', name: 'Delivery Confirmation', steps: ['arrive-destination', 'obtain-proof', 'update-status', 'notify-customer', 'archive-record'], entities: ['Shipment', 'ProofOfDelivery', 'Customer'] },
    ],
    entities: [
      { name: 'Shipment', description: 'Core shipment entity with tracking lifecycle', invariants: ['exactly one tracking number', 'status transitions are ordered', 'cannot be deleted after dispatch'] },
      { name: 'Carrier', description: 'Shipping carrier partner with rates and SLA', invariants: ['valid carrier credentials', 'active contract status'] },
      { name: 'Address', description: 'Origin or destination address', invariants: ['validated format', 'country code present'] },
      { name: 'Label', description: 'Shipping label with tracking barcode', invariants: ['carrier format compliance', 'unique label ID'] },
    ],
    invariants: [
      'Tracking number must be unique across all carriers',
      'Shipment status follows ordered lifecycle: pending → booked → dispatched → in-transit → out-for-delivery → delivered',
      'Customs declarations required for all international shipments',
      'Hazardous materials must have IATA certification before booking',
      'Insurance required for declared values above platform threshold',
      'Delivery time windows enforced at carrier SLA level',
    ],
    constraints: [
      'Maximum package weight enforced per carrier agreement',
      'Prohibited items list enforced at booking time',
      'Same-day delivery available only within service radius',
      'International shipments require valid HS code classification',
    ],
    financialFlows: [
      { name: 'shipping-fee', direction: 'in', trigger: 'shipment-delivery' },
      { name: 'carrier-payout', direction: 'out', trigger: 'delivery-confirmation' },
      { name: 'insurance-premium', direction: 'in', trigger: 'insurance-purchase' },
      { name: 'customs-duty', direction: 'out', trigger: 'customs-clearance' },
    ],
    successMetrics: [
      'on-time-delivery-rate',
      'average-transit-time',
      'shipment-tracking-accuracy',
      'customer-satisfaction-score',
      'cost-per-shipment',
      'carrier-sla-compliance',
      'claim-rate',
    ],
    analytics: {
      tracked: ['shipment-volume', 'delivery-performance', 'carrier-ratings', 'route-efficiency', 'carbon-emissions'],
      dashboards: ['operations', 'financial', 'carrier-performance', 'customer-facing-tracking'],
    },
    securityRequirements: [
      'Multi-role authentication with carrier/shipper/admin separation',
      'Encrypted tracking data at rest and in transit',
      'API key rotation every 90 days',
      'PII redaction in carrier data exchange',
      'Audit logging for all tracking data access',
    ],
    regulatory: [
      { regulation: 'GDPR', applies: true, notes: 'Tracking data retained per regulatory requirements then anonymized' },
      { regulation: 'IATA', applies: true, notes: 'Hazardous materials handling certification required' },
      { regulation: 'Kimberley Process', applies: false, notes: 'Not applicable to general logistics' },
      { regulation: 'Customs Regulations', applies: true, notes: 'Electronic export filing for shipments >$2500' },
    ],
  };
}

// ── Logistics Pack ────────────────────────────────────────────────────────────

export const LOGISTICS_PACK: DomainPack = {
  domain: 'logistics',
  name: 'Logistics & Supply Chain Management',
  description:
    'End-to-end logistics and supply chain management platform covering shipment tracking, warehouse management, route optimization, fleet dispatch, customs compliance, and last-mile delivery coordination across carriers and partners.',

  // ── Catalog ─────────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Shipments', 'Tracking', 'Warehouses', 'Routes', 'Inventory', 'Partners'],
    features: [
      'shipment-tracking',
      'real-time-gps',
      'warehouse-management',
      'route-optimization',
      'inventory-management',
      'carrier-integration',
      'customs-clearance',
      'last-mile-delivery',
      'bulk-shipping',
      'proof-of-delivery',
      'automated-routing',
      'temperature-monitoring',
      'hazardous-handling',
      'fleet-dispatch',
      'partner-management',
      'supply-chain-visibility',
      'shipment-analytics',
      'carbon-footprint-tracking',
    ],
  },

  // ── Fulfillment ─────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['standard', 'express', 'same-day', 'international'],
    features: [
      'route-optimization',
      'real-time-tracking',
      'warehouse-management',
      'last-mile',
      'customs-brokerage',
      'carrier-selection',
      'fleet-dispatch',
      'proof-of-delivery',
    ],
  },

  // ── Customer Features ───────────────────────────────────────────────────────
  customer: {
    features: [
      'tracking',
      'shipment-history',
      'address-book',
      'notifications',
      'bulk-shipping',
      'rate-comparison',
      'schedule-pickup',
      'shipment-templates',
    ],
  },

  // ── Operations Features ─────────────────────────────────────────────────────
  operations: {
    features: [
      'dispatch',
      'fleet-management',
      'warehouse-ops',
      'vendor-coordination',
      'customs',
      'inventory-tracking',
      'quality-control',
      'partner-routing',
    ],
  },

  // ── Experience Features ─────────────────────────────────────────────────────
  experience: {
    features: [
      'real-time-tracking',
      'predictive-eta',
      'automated-updates',
      'carbon-tracking',
      'mobile-scanning',
      'voice-commands',
      'offline-mode',
      'custom-notifications',
    ],
  },

  // ── Components ──────────────────────────────────────────────────────────────
  components: {
    public: ['tracking', 'rates', 'locations', 'help-center', 'carrier-lookup'],
    customer: ['dashboard', 'shipments', 'addresses', 'settings', 'billing', 'notifications'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'partners', 'compliance', 'billing'],
    staff: ['dispatch', 'fleet', 'warehouse', 'scanner', 'routes'],
  },

  // ── Business Rules ──────────────────────────────────────────────────────────
  businessRules: {
    routing: 'Routes optimized using multi-constraint algorithm: distance, delivery windows, vehicle capacity, carrier rates. Manual override allowed for dispatchers. Recalculated on traffic changes.',
    customs: 'All international shipments require HS code classification, commercial invoice, and declared value. Restricted/prohibited items enforced at booking. Electronic export filing for shipments >$2,500.',
    hazardous: 'Hazardous materials require IATA/IMDG certification and UN classification. SDS upload mandatory. Specialized carrier selection. Real-time temperature monitoring for controlled shipments.',
    insurance: 'Shipments above $500 require enhanced coverage. Carrier liability limited to declared value. Claim workflow on delivery with damage evidence. Premium calculated on value, category, destination risk.',
    timeWindows: 'Customer-selected delivery windows: morning, afternoon, evening, exact-time. Missed windows trigger reschedule and notification. Same-day/express have narrower windows with higher rates.',
    liability: 'Carrier liability capped at declared value unless enhanced insurance. Damage must be reported within 14 days. Lost shipment investigation after 7 days past ETA. Force majeure documented.',
    packaging: 'Carrier-specific packaging requirements enforced: weight limits, dimension ratios, material specs. Fragile items require double-boxing. Oversized items flagged for special routing.',
  },

  // ── Design ──────────────────────────────────────────────────────────────────
  design: {
    layout: ['map-first', 'tracking-focused', 'mobile-friendly', 'dashboard-summary'],
    color: ['logistics-blue', 'status-green-red', 'neutral-gray', 'alert-orange'],
    typography: ['tracking-number-bold', 'clear-status', 'body-readable', 'code-mono'],
    interaction: ['map-interaction', 'quick-ship', 'drag-route', 'scan-input'],
    accessibility: ['keyboard-nav', 'screen-reader', 'high-contrast', 'focus-indicator'],
  },

  // ── Security ────────────────────────────────────────────────────────────────
  security: {
    auth: 'Carrier + shipper + admin roles. Carrier accounts use OAuth2 + API keys. Shipper accounts via email/password with MFA. Admins have full access with SSO. API key rotation every 90 days.',
    data: 'Encrypted tracking data at rest (AES-256) and in transit (TLS 1.3). GDPR compliant with data minimization and right to erasure. PII redacted in carrier data exchange.',
    compliance: ['GDPR', 'IATA', 'Customs regulations', 'C-TPAT', 'ISO 28001'],
  },

  // ── Testing ─────────────────────────────────────────────────────────────────
  testing: {
    unit: [
      'Route optimization algorithm: shortest path within constraints',
      'Tracking number validation: format checks and carrier lookup',
      'Customs duty calculation: HS code mapping and country rates',
      'Address validation: normalization and carrier compatibility',
      'Insurance premium calculation: risk score and declared value formula',
      'Time window conflict detection: overlapping delivery slots',
    ],
    integration: [
      'Booking → label → carrier API → tracking activation flow',
      'Warehouse scan → inventory update → status → customer notification',
      'Customs declaration → government API → duty payment → release',
      'GPS tracking → ETA recalculation → notification → exception handling',
      'Fleet dispatch → route assignment → driver notification → delivery confirmation',
    ],
    e2e: [
      'Customer books → warehouse scan → carrier pickup → real-time tracking → delivery confirmation → customer review',
      'International shipment → customs filing → duty payment → clearance → last-mile → documentation archive',
    ],
  },
};

// ── Logistics Domain Model ────────────────────────────────────────────────────

export const LOGISTICS_DOMAIN: DomainModel = toDomainModel(LOGISTICS_PACK);
