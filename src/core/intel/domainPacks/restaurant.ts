/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Restaurant Management Domain Pack
 *
 * Complete restaurant management platform covering menu items with customization and
 * modifiers, table management with floor plans, reservation system, order lifecycle
 * from POS to kitchen to fulfillment, inventory management, staff scheduling, customer
 * loyalty programs, and kitchen display systems.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';
// ── Shared Spec Interfaces ───────────────────────────────────────────────────



export interface CustomerFeaturesSpec {
  features: string[];
}

export interface OperationsFeaturesSpec {
  features: string[];
}

export interface ExperienceFeaturesSpec {
  features: string[];
}







// ── DomainPack Constant ──────────────────────────────────────────────────────

export const RESTAURANT_PACK: DomainPack = {
  domain: 'restaurant',
  name: 'Restaurant Management',
  description:
    'Complete restaurant management platform covering menu items with customization and modifiers, table management with floor plans, reservation system, order lifecycle from POS to kitchen to fulfillment, inventory management, staff scheduling, customer loyalty programs, and kitchen display systems.',

  // ── Catalog ────────────────────────────────────────────────────────────────
  catalog: {
    categories: [
      'Menu Items',
      'Tables',
      'Reservations',
      'Orders',
      'Staff',
      'Inventory',
    ],
    features: [
      'menu-categories',
      'item-variants',
      'modifiers',
      'dietary-tags',
      'allergen-info',
      'pricing-tiers',
      'combo-deals',
      'seasonal-items',
      'search',
      'recommendations',
      'floor-plan',
      'table-types',
      'reservation-holds',
      'waitlist',
      'split-billing',
      'course-timing',
      'staff-roles',
      'shift-schedules',
    ],
  },

  // ── Fulfillment ────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['dine-in', 'takeout', 'delivery', 'curbside'],
    features: [
      'table-management',
      'reservation-system',
      'kitchen-display',
      'order-routing',
    ],
  },

  // ── Customer Features ──────────────────────────────────────────────────────
  customer: {
    features: [
      'menu-browsing',
      'reservations',
      'order-tracking',
      'loyalty-points',
      'preferences',
    ],
  },

  // ── Operations Features ────────────────────────────────────────────────────
  operations: {
    features: [
      'kitchen-ops',
      'inventory-tracking',
      'staff-scheduling',
      'vendor-management',
      'waste-tracking',
    ],
  },

  // ── Experience Features ────────────────────────────────────────────────────
  experience: {
    features: [
      'real-time-order-status',
      'personalized-recommendations',
      'ambiance-control',
      'wait-time-prediction',
    ],
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {
    public: ['menu', 'reservations', 'locations'],
    customer: ['profile', 'orders', 'reviews'],
    admin: ['dashboard', 'menu-mgmt', 'reports', 'staff'],
    staff: ['kitchen', 'pos', 'tables'],
  },

  // ── Business Rules ─────────────────────────────────────────────────────────
  businessRules: {
    reservations: [
      'Reservations accepted from 30 days in advance to 15 minutes before opening. Table hold time is 15 minutes past reservation time before automatic release. Large parties (8+) require credit card guarantee. No-shows exceeding 2 instances result in reservation block for 30 days. Special requests (dietary, celebrations, seating) noted and communicated to kitchen. Online reservations confirmed via SMS/email. Floor plan auto-assigns tables based on party size and section preferences.',
    ],

    orders: [
      'Order status lifecycle: Pending → Confirmed → In Kitchen → Ready → Served → Completed (dine-in) or Pending → Confirmed → In Kitchen → Ready → Picked Up/Delivered → Completed (takeout/delivery). Orders can be modified by wait staff until "In Kitchen" status. Kitchen display shows orders sorted by timestamp and priority. Course timing coordinated for multi-course tables. Split checks supported with item-level assignment. Gratuity auto-calculated for parties of 6 or more (18%). Voided items require manager PIN and reason code.',
    ],

    pricing: [
      'Menu pricing with cost-based margins (target 65-75% food cost). Combo deals priced at discount vs individual items. Happy hour pricing active during defined time windows. Loyalty members receive 5-10% discount on all orders. Staff meals at 50% off during shifts. Gratuity auto-added for parties of 6+ (18%). Senior/student discounts verified at POS. Third-party delivery platforms priced 15-20% higher to cover commission fees. Tax calculated on food (reduced rate) and alcohol (full rate) where applicable.',
    ],

    inventory: [
      'Daily stock counts for high-velocity items (produce, dairy, meat). Periodic counts for dry goods (weekly) and beverages (weekly). Par levels set per item with automatic reorder triggers. FIFO for perishable goods with first-expiry-first-out for dated items. Vendor-managed inventory for key suppliers with automated reorder. Waste tracking records all spoilage with cause codes (preparation, expiration, over-production). Inventory value tracked for COGS calculation and financial reporting. Yield percentages calculated per recipe for cost optimization.',
    ],

    staff: [
      'Staff schedules created 2 weeks in advance with manager approval. Minimum 8 hours rest between shifts. Maximum 6 consecutive days without a day off. Overtime requires prior authorization. No-shows and late arrivals logged in attendance record. Tip pooling for bussers and food runners per local labor laws. Staff roles: Server, Bartender, Cook, Prep Cook, Busser, Host, Manager. Each role has defined responsibilities and required certifications (e.g., food handler permit, responsible alcohol service).',
    ],

    kitchen: [
      'Kitchen Display System (KDS) shows incoming orders sorted by time and table. Course timing coordinated: appetizers within 10 min, mains within 25 min of order. Priority bumping for large parties and VIP guests. Station routing: grill, fry, garde manger, dessert, bar. Prep tickets printed for complex dishes. 86 alerts when ingredients run low. Allergen flags highlighted prominently on KDS. Quality checks by expeditor before plating. Average ticket time monitored and displayed. Rush alerts notify all stations during peak periods.',
    ],
  },

  // ── Design Principles ───────────────────────────────────────────────────────
  design: {
    layout: [
      'mobile-first',
      'high-contrast-menu',
      'touch-friendly',
    ],
    color: [
      'warm-palate',
      'brand-colors',
    ],
    typography: [
      'readable-menu',
      'clear-pricing',
    ],
    interaction: [
      'quick-reorder',
      'favorites',
    ],
    accessibility: [
      'alt-text',
      'voice-order',
    ],
  },

  // ── Security Requirements ──────────────────────────────────────────────────
  security: {
    auth:
      'POS-integrated with staff PIN codes. Staff PIN codes unique per employee with role-based access levels. Manager override codes for voids, discounts, and refunds. Session timeout after 2 minutes of inactivity on POS terminals. Cash drawer access requires authentication. Kitchen display is read-only for kitchen staff. Admin access requires separate credentials with audit logging. Third-party delivery integration uses OAuth tokens with limited scopes.',

    data:
      'PCI DSS compliant payment handling. Customer PII: name, phone, email, dietary preferences, reservation history. Order data with line items, modifiers, and timing. Payment information tokenized via payment processor — no card data stored locally. Staff data: schedules, tip records, performance metrics. Inventory data: stock levels, vendor contracts, cost records. Kitchen efficiency metrics and order timing data. All data encrypted at rest with TLS in transit.',

    compliance: [
      'PCI DSS',
      'Health Department',
      'GDPR',
    ],
  },

  // ── Testing Requirements ───────────────────────────────────────────────────
  testing: {
    unit: [
      'Reservation conflict detection: overlapping table assignments prevented',
      'Order total calculation with modifiers, combos, taxes, and gratuity',
      'Table turnover time calculation from seat to clear',
      'Inventory deduction per recipe: ingredient quantities and waste factor',
      'Loyalty points accrual and redemption validation',
      'Tip splitting calculation based on role percentages',
      'Shift labor cost calculation from schedule and time entries',
      'Allergen cross-contamination warning in menu item matching',
    ],
    integration: [
      'Customer reservation → table assignment → seating → order creation → kitchen display → order completion',
      'Server POS entry → kitchen display → course timing → order completion → bill generation',
      'Inventory depletion alert → automatic reorder → vendor confirmation → goods receipt',
      'Customer loyalty check → discount application → points accrual after payment',
      'Manager override for void → reason logged → inventory adjusted → report updated',
      'Online order → kitchen queue → preparation → driver dispatch → customer notification',
      'Staff schedule creation → time clock → attendance record → payroll export',
    ],
    e2e: [
      'Customer views menu → makes reservation → arrives → is seated → orders with modifiers → receives meal → pays → leaves review',
      'Manager creates daily special → uploads to POS → servers sell → inventory adjusted → end-of-day report generated',
      'Peak dinner rush: multiple tables seated → orders flood KDS → kitchen prioritizes → expeditor coordinates → all orders served within timing targets',
    ],
  },
};

// ── DomainModel Adapter ──────────────────────────────────────────────────────


function rolesForRestaurant(): DomainModel['userRoles'] {
  return [
    { id: 'customer', name: 'Customer', typicalFeatures: ['menu-browsing', 'reservations', 'order-tracking', 'loyalty-points'], permissions: ['view-menu', 'make-reservation', 'place-orders', 'view-history'] },
    { id: 'server', name: 'Server', typicalFeatures: ['pos', 'tables', 'orders'], permissions: ['take-orders', 'process-payment', 'view-tables'] },
    { id: 'kitchen', name: 'Kitchen Staff', typicalFeatures: ['kitchen'], permissions: ['view-orders', 'update-status', 'view-recipes'] },
    { id: 'manager', name: 'Manager', typicalFeatures: ['dashboard', 'menu-mgmt', 'reports', 'staff'], permissions: ['*', 'approve-voids', 'manage-staff', 'view-reports'] },
  ];
}

function featuresForRestaurant(): DomainModel['standardFeatures'] {
  const all: DomainModel['standardFeatures'] = [];
  const pushGroup = (label: string, priority: string, features: string[]) => {
    for (const f of features) {
      all.push({ category: label, name: f, description: '', priority });
    }
  };
  pushGroup('catalog', 'essential', RESTAURANT_PACK.catalog.features);
  pushGroup('fulfillment', 'expected', RESTAURANT_PACK.fulfillment.features);
  pushGroup('customer', 'expected', RESTAURANT_PACK.customer.features);
  pushGroup('operations', 'essential', RESTAURANT_PACK.operations.features);
  pushGroup('experience', 'differentiating', RESTAURANT_PACK.experience.features);
  for (const [group, items] of Object.entries(RESTAURANT_PACK.components)) {
    if (Array.isArray(items)) pushGroup(`components:${group}`, 'essential', items);
  }
  for (const [rule] of Object.entries(RESTAURANT_PACK.businessRules)) {
    all.push({ category: 'business', name: rule, description: '', priority: 'essential' });
  }
  return all;
}

function businessModelsForRestaurant(): DomainModel['businessModels'] {
  return [
    { modelType: 'full-service-restaurant', revenueStreams: ['food-sales', 'beverage-sales', 'catering', 'merchandise'], costStructure: ['food-costs', 'labor', 'rent', 'utilities', 'equipment'], pricingStrategy: ['menu-pricing', 'dynamic-pricing', 'event-pricing'] },
  ];
}

function technicalPatternsForRestaurant(): DomainModel['technicalPatterns'] {
  return [
    { category: 'integration', name: 'POS Integration', description: 'Hardware POS terminals, receipt printers, cash drawers', rationale: 'Core transaction processing requires reliable POS integration' },
    { category: 'integration', name: 'Kitchen Display System', description: 'Real-time order routing to kitchen screens and printers', rationale: 'Orders must reach kitchen instantly with clear formatting' },
    { category: 'data', name: 'Real-time Sync', description: 'WebSocket-based real-time updates for order status, table status', rationale: 'Multi-staff coordination requires instant visibility' },
    { category: 'integration', name: 'Third-party Delivery APIs', description: 'Uber Eats, DoorDash, Grubhub order ingestion and status sync', rationale: 'Delivery platform orders must integrate seamlessly with kitchen workflow' },
  ];
}

function operationalLifecycleForRestaurant(): DomainModel['operationalLifecycle'] {
  return [
    { id: 'prep', name: 'Prep', description: 'Ingredient preparation, station setup, pre-service checks' },
    { id: 'service', name: 'Service', description: 'Seating, ordering, kitchen preparation, serving, payment' },
    { id: 'close', name: 'Close', description: 'End-of-day reconciliation, inventory count, cleaning, reporting' },
  ];
}

function designPrinciplesForRestaurant(): DomainModel['designPrinciples'] {
  const principles: DomainModel['designPrinciples'] = [];
  const layout: Record<string, string> = {
    'mobile-first': 'Primary interface designed for mobile POS tablets used by servers on the floor',
    'high-contrast-menu': 'Menu items displayed with high contrast for readability in varied lighting',
    'touch-friendly': 'Large touch targets optimized for quick input during busy service periods',
  };
  const color: Record<string, string> = {
    'warm-palate': 'Warm tones (terracotta, cream, amber) reflecting the dining ambiance',
    'brand-colors': 'Restaurant brand colors as primary with neutral backgrounds',
  };
  const typography: Record<string, string> = {
    'readable-menu': 'Highly readable menu typography with clear section hierarchy and item descriptions',
    'clear-pricing': 'Prices prominently displayed with consistent formatting and currency symbols',
  };
  const interaction: Record<string, string> = {
    'quick-reorder': 'One-tap reorder of previous orders for returning customers',
    'favorites': 'Save favorite orders and dietary preferences for faster ordering',
  };
  const accessibility: Record<string, string> = {
    'alt-text': 'Descriptive alt text for all menu item images and restaurant photography',
    'voice-order': 'Voice ordering support for hands-free kitchen communication',
  };
  for (const [k, v] of Object.entries(layout)) principles.push({ name: `Layout: ${k}`, description: v });
  for (const [k, v] of Object.entries(color)) principles.push({ name: `Color: ${k}`, description: v });
  for (const [k, v] of Object.entries(typography)) principles.push({ name: `Typography: ${k}`, description: v });
  for (const [k, v] of Object.entries(interaction)) principles.push({ name: `Interaction: ${k}`, description: v });
  for (const [k, v] of Object.entries(accessibility)) principles.push({ name: `Accessibility: ${k}`, description: v });
  return principles;
}

function securityConsiderationsForRestaurant(): DomainModel['securityConsiderations'] {
  return [
    { category: 'auth', name: 'POS-integrated with staff PIN codes', description: RESTAURANT_PACK.security.auth, severity: 'high' },
    { category: 'data', name: 'PCI DSS compliant payment handling', description: RESTAURANT_PACK.security.data, severity: 'high' },
    { category: 'compliance', name: 'PCI DSS', description: 'Payment card data protection and processing standards', severity: 'high' },
    { category: 'compliance', name: 'Health Department', description: 'Food safety, temperature logging, and hygiene compliance', severity: 'high' },
    { category: 'compliance', name: 'GDPR', description: 'Customer data protection for EU diners', severity: 'medium' },
  ];
}

function regulationsForRestaurant(): DomainModel['regulations'] {
  return [
    { name: 'PCI DSS', requirements: ['Card data encryption', 'Secure payment processing', 'Regular security scans', 'Access control for payment systems'] },
    { name: 'Health Department', requirements: ['Food temperature monitoring', 'Allergen labeling', 'Employee health certificates', 'Sanitation logs'] },
    { name: 'GDPR', requirements: ['Customer data consent', 'Right to erasure', 'Data portability', 'Privacy notices'] },
  ];
}

function testingRequirementsForRestaurant(): DomainModel['testingRequirements'] {
  const all: DomainModel['testingRequirements'] = [];
  for (const t of RESTAURANT_PACK.testing.unit) all.push({ category: 'unit', name: t, description: '', priority: 'high' });
  for (const t of RESTAURANT_PACK.testing.integration) all.push({ category: 'integration', name: t, description: '', priority: 'high' });
  for (const t of RESTAURANT_PACK.testing.e2e) all.push({ category: 'e2e', name: t, description: '', priority: 'medium' });
  return all;
}

export const RESTAURANT_DOMAIN: DomainModel = {
  id: RESTAURANT_PACK.domain,
  domain: RESTAURANT_PACK.domain,
  name: RESTAURANT_PACK.name,
  label: RESTAURANT_PACK.name,
  category: 'restaurant',
  description: RESTAURANT_PACK.description,
  userRoles: rolesForRestaurant(),
  role: 'manager',
  standardFeatures: featuresForRestaurant(),
  businessModels: businessModelsForRestaurant(),
  technicalPatterns: technicalPatternsForRestaurant(),
  operationalLifecycle: operationalLifecycleForRestaurant(),
  designPrinciples: designPrinciplesForRestaurant(),
  securityConsiderations: securityConsiderationsForRestaurant(),
  regulations: regulationsForRestaurant(),
  testingRequirements: testingRequirementsForRestaurant(),
  workflows: [
    { id: 'dine-in', name: 'Dine-in Order Flow', steps: ['seat', 'greet', 'order', 'kitchen', 'serve', 'pay'], entities: ['table', 'order', 'reservation'] },
    { id: 'reservation', name: 'Reservation Flow', steps: ['request', 'confirm', 'assign-table', 'seat', 'complete'], entities: ['reservation', 'table', 'customer'] },
    { id: 'kitchen', name: 'Kitchen Workflow', steps: ['receive-order', 'prepare', 'expedite', 'plate', 'call-out'], entities: ['order', 'station', 'menu-item'] },
  ],
  entities: [
    { name: 'Table', description: 'Dining table with seating capacity and section assignment', invariants: ['cannot seat more than capacity', 'must be cleaned before re-seating'] },
    { name: 'Order', description: 'Customer order with line items, modifiers, and status lifecycle', invariants: ['must have at least one item', 'status transitions follow defined lifecycle'] },
    { name: 'Menu Item', description: 'Dish or drink with pricing, recipe, allergens, and modifiers', invariants: ['must have price', 'allergen info required for food items'] },
  ],
  invariants: ['tables cannot exceed capacity', 'allergen items must be flagged', 'payment required before order completion for takeout/delivery'],
  constraints: ['reservation must be confirmed before seating', 'orders cannot be voided without manager PIN', 'inventory must cover recipe requirements'],
  financialFlows: [
    { name: 'order-payment', direction: 'in', trigger: 'order-completion' },
    { name: 'inventory-purchase', direction: 'out', trigger: 'vendor-invoice-payment' },
    { name: 'staff-payment', direction: 'out', trigger: 'payroll-cycle' },
  ],
  successMetrics: ['table-turnover-rate', 'average-ticket-size', 'order-accuracy', 'wait-time', 'customer-satisfaction', 'food-cost-percentage'],
  analytics: { tracked: ['sales', 'table-turns', 'menu-popularity', 'staff-performance', 'inventory-usage'], dashboards: ['sales', 'kitchen', 'inventory', 'staff'] },
  securityRequirements: ['pos-authentication', 'payment-encryption', 'access-control', 'audit-logging'],
  regulatory: [
    { regulation: 'PCI DSS', applies: true, notes: 'Payment card data must be handled by certified processor' },
    { regulation: 'Health Department', applies: true, notes: 'Food safety and temperature monitoring required' },
    { regulation: 'GDPR', applies: true, notes: 'Customer privacy for EU diners' },
  ],
};
