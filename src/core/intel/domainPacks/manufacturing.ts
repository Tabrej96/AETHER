/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Manufacturing / Factory Management Domain Pack
 *
 * Comprehensive manufacturing domain model covering product catalog with BOMs and
 * specifications, work order lifecycle with routing and scheduling, inventory management
 * with multi-warehouse support, equipment maintenance, quality control, procurement,
 * and supply chain tracking.
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

export const MANUFACTURING_PACK: DomainPack = {
  domain: 'manufacturing',
  name: 'Manufacturing / Factory Management',
  description:
    'Complete manufacturing and factory management platform covering product catalogs with BOMs and specifications, work order lifecycle with routing and scheduling, inventory management with multi-warehouse support, equipment maintenance, quality control, procurement, and supply chain tracking.',

  // ── Catalog ────────────────────────────────────────────────────────────────
  catalog: {
    categories: [
      'Products',
      'Work Orders',
      'Inventory',
      'Equipment',
      'Quality',
      'Procurement',
    ],
    features: [
      'bom-management',
      'variant-support',
      'specification-templates',
      'routing-definitions',
      'search',
      'filtering',
      'batch-tracking',
      'serial-numbers',
      'quality-standards',
      'compliance-certifications',
      'supplier-ratings',
      'procurement-quotes',
      'equipment-registry',
      'maintenance-schedules',
      'inventory-multi-location',
      'demand-forecasting',
      'production-scheduling',
      'cost-tracking',
      'traceability',
    ],
  },

  // ── Fulfillment ────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['pickup', 'delivery', 'direct-shipment'],
    features: [
      'order-tracking',
      'schedule-optimization',
      'inventory-replenishment',
    ],
  },

  // ── Customer Features ──────────────────────────────────────────────────────
  customer: {
    features: [
      'order-tracking',
      'invoice-download',
      'support-tickets',
      'bulk-ordering',
      'custom-specs',
    ],
  },

  // ── Operations Features ────────────────────────────────────────────────────
  operations: {
    features: [
      'BOM-management',
      'work-order-tracking',
      'equipment-maintenance',
      'quality-control',
      'shift-management',
      'supply-chain',
    ],
  },

  // ── Experience Features ────────────────────────────────────────────────────
  experience: {
    features: [
      'real-time-dashboard',
      'predictive-maintenance',
      'yield-optimization',
      'waste-reduction',
    ],
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {
    public: ['landing', 'products', 'quote-request'],
    customer: ['portal', 'order-history', 'support'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'settings'],
    staff: ['work-orders', 'inventory', 'quality'],
  },

  // ── Business Rules ─────────────────────────────────────────────────────────
  businessRules: {
    workOrders: [
      'Work orders are created from approved sales orders or demand forecasts. Each work order defines a product, quantity, start date, and routing steps. Status lifecycle: Draft → Released → In Progress → Quality Check → Completed → Closed. Work orders cannot be deleted once released; cancelled work orders require supervisor approval. Material reservations are created upon release and consumed at each routing step. Completed quantities are recorded and compared against planned quantities for yield analysis. Work order priority can be manually overridden by a supervisor.',
    ],

    inventory: [
      'Multi-location inventory tracking with real-time stock levels per warehouse. Reorder points trigger automatic purchase requisitions. FIFO (First In, First Out) for perishable and time-sensitive materials. FEFO (First Expiry, First Out) for materials with expiration dates. Cycle counts performed on a rotating schedule per ABC classification. Inventory holds prevent allocation of quarantined stock. Stock transfers between warehouses require dual authorization and generate transfer orders. Negative stock is blocked; all consumption must have a reservation or stock on hand.',
    ],

    quality: [
      'Quality checkpoints defined per routing step. Incoming materials inspected against supplier certificates and specifications. In-process inspections at defined stages with pass/fail criteria. Final inspection before shipment with full traceability record. Non-conforming items generate NCR (Non-Conformance Report) requiring corrective action. Inspection results stored with work order, lot, and operator IDs. Statistical Process Control (SPC) charts generated for key metrics. Customer returns undergo root-cause analysis and generate CAPA (Corrective and Preventive Action) records.',
    ],

    procurement: [
      'Purchase requisitions approved by department head and budget owner. Purchase orders issued only after requisition approval and vendor selection. Three-way matching: PO, goods receipt, and vendor invoice must align before payment. Vendor performance scored on delivery timeliness, quality rate, and price competitiveness. Preferred vendor list maintained with periodic review. Emergency procurement allowed with post-approval within 48 hours. Contract management tracks renewal dates, SLAs, and negotiated pricing. Purchase order modifications require re-approval if total changes exceed 10%.',
    ],

    equipment: [
      'Equipment registry tracks all production machinery with serial number, installation date, and maintenance history. Preventive maintenance schedules generated based on manufacturer recommendations and runtime hours. Maintenance work orders created automatically from schedule triggers. Equipment downtime logged with cause code and repair duration. Mean Time Between Failures (MTBF) and Mean Time To Repair (MTTR) tracked per equipment. Calibration certificates tracked with expiry alerts. Critical equipment requires redundant scheduling to avoid production bottlenecks.',
    ],

    compliance: [
      'All production batches must have complete traceability: raw material lot numbers, operator IDs, machine IDs, timestamps, and quality inspection results. Records retained for minimum 7 years or per regulatory requirement (e.g., FDA 21 CFR Part 11 for pharma/food). ISO 9001 quality management system requirements enforced. OSHA safety standards for workplace operations and equipment guarding. Change management process for product, process, and equipment modifications. Audit trail logs all data changes with user ID, timestamp, and before/after values. Data exports for regulatory submissions formatted per agency requirements.',
    ],
  },

  // ── Design Principles ───────────────────────────────────────────────────────
  design: {
    layout: [
      'responsive-dashboard',
      'data-dense',
      'print-friendly',
    ],
    color: [
      'industrial-neutral',
      'status-green-red',
    ],
    typography: [
      'monospace-data',
      'clear-labels',
    ],
    interaction: [
      'inline-edit',
      'bulk-actions',
    ],
    accessibility: [
      'keyboard-nav',
      'screen-reader',
    ],
  },

  // ── Security Requirements ──────────────────────────────────────────────────
  security: {
    auth:
      'Role-based access with shift-level permissions. Operators have read-only or limited write access to assigned workstations. Supervisors can approve work orders and override priorities. Admins manage equipment, BOMs, and quality standards. Engineers can modify routings and process parameters. All role assignments require manager approval. Session timeout after 30 minutes of inactivity on production floor terminals. MFA required for admin and engineer accounts.',

    data:
      'Encrypted at rest with audit logging. All production data, BOMs, quality records, and financial data encrypted using AES-256. Comprehensive audit trail records every data modification with user identity, timestamp, and change details. Data retention per regulatory requirements with automated archival after retention period. Backup encryption with key rotation every 90 days. Network segmentation between production floor terminals and administrative systems. API access requires certificate-based authentication for third-party integrations.',

    compliance: [
      'ISO 9001',
      'OSHA',
      'GDPR',
    ],
  },

  // ── Testing Requirements ───────────────────────────────────────────────────
  testing: {
    unit: [
      'BOM cost rollup calculation across multi-level assemblies',
      'Work order material reservation and consumption logic',
      'Inventory stock balance reconciliation after transactions',
      'Quality inspection pass/fail threshold evaluation',
      'Maintenance schedule trigger based on runtime hours or calendar days',
      'Purchase order three-way matching algorithm',
      'Equipment MTBF/MTTR calculation from downtime logs',
      'Shift handover report generation with open work orders',
    ],
    integration: [
      'Sales order → work order creation → material reservation → routing execution',
      'Vendor PO creation → goods receipt → quality inspection → inventory receipt',
      'Equipment maintenance trigger → work order → labor/parts tracking → completion',
      'Production reporting → quality check → NCR generation → CAPA workflow',
      'Inventory below reorder point → auto requisition → approval → PO to vendor',
      'Multi-warehouse stock transfer → transfer order → in-transit tracking → receipt',
      'Batch traceability: raw material lot → production lot → finished goods lot → customer shipment',
    ],
    e2e: [
      'New product definition → BOM creation → routing setup → first work order → quality approval → production release',
      'Full procurement cycle: requisition → approval → PO → goods receipt → inspection → invoice matching → payment',
    ],
  },
};

// ── DomainModel Adapter ──────────────────────────────────────────────────────


function rolesForManufacturing(): DomainModel['userRoles'] {
  return [
    { id: 'operator', name: 'Operator', typicalFeatures: ['work-orders', 'inventory', 'quality'], permissions: ['view', 'update-own', 'scan'] },
    { id: 'supervisor', name: 'Supervisor', typicalFeatures: ['work-orders', 'inventory', 'quality', 'reports'], permissions: ['view', 'approve', 'override', 'assign'] },
    { id: 'engineer', name: 'Engineer', typicalFeatures: ['BOM-management', 'equipment-maintenance', 'routing'], permissions: ['view', 'edit', 'configure', 'release'] },
    { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'reports', 'settings'], permissions: ['*'] },
    { id: 'customer', name: 'Customer', typicalFeatures: ['portal', 'order-history', 'support', 'custom-specs'], permissions: ['view-own', 'create-support', 'download'] },
  ];
}

function featuresForManufacturing(): DomainModel['standardFeatures'] {
  const all: DomainModel['standardFeatures'] = [];
  const pushGroup = (label: string, priority: string, features: string[]) => {
    for (const f of features) {
      all.push({ category: label, name: f, description: '', priority });
    }
  };
  pushGroup('catalog', 'essential', MANUFACTURING_PACK.catalog.features);
  pushGroup('fulfillment', 'expected', MANUFACTURING_PACK.fulfillment.features);
  pushGroup('customer', 'expected', MANUFACTURING_PACK.customer.features);
  pushGroup('operations', 'essential', MANUFACTURING_PACK.operations.features);
  pushGroup('experience', 'differentiating', MANUFACTURING_PACK.experience.features);
  for (const [group, items] of Object.entries(MANUFACTURING_PACK.components)) {
    if (Array.isArray(items)) pushGroup(`components:${group}`, 'essential', items);
  }
  for (const [rule] of Object.entries(MANUFACTURING_PACK.businessRules)) {
    all.push({ category: 'business', name: rule, description: '', priority: 'essential' });
  }
  return all;
}

function businessModelsForManufacturing(): DomainModel['businessModels'] {
  return [
    { modelType: 'make-to-order', revenueStreams: ['product-sales', 'custom-manufacturing', 'bulk-contracts'], costStructure: ['raw-materials', 'labor', 'equipment-depreciation', 'energy', 'logistics'], pricingStrategy: ['cost-plus', 'value-based', 'contract-pricing'] },
  ];
}

function technicalPatternsForManufacturing(): DomainModel['technicalPatterns'] {
  return [
    { category: 'integration', name: 'ERP Integration', description: 'Bidirectional sync with ERP systems (SAP, Oracle, NetSuite)', rationale: 'Manufacturing operations depend on ERP for financials, procurement, and master data' },
    { category: 'data', name: 'Time-Series Database', description: 'Production metrics, equipment sensor data, quality measurements', rationale: 'High-volume time-series data from IoT sensors and production equipment' },
    { category: 'integration', name: 'IoT / SCADA Integration', description: 'Equipment sensor data, PLC communication, SCADA dashboards', rationale: 'Real-time equipment monitoring and predictive maintenance' },
    { category: 'architecture', name: 'Event-Driven Architecture', description: 'Production events trigger work order updates, notifications, and reporting', rationale: 'Decouple production systems for resilience and scalability' },
  ];
}

function operationalLifecycleForManufacturing(): DomainModel['operationalLifecycle'] {
  return [
    { id: 'plan', name: 'Plan', description: 'Demand forecasting, production scheduling, material planning' },
    { id: 'source', name: 'Source', description: 'Procurement, vendor management, goods receipt' },
    { id: 'make', name: 'Make', description: 'Work order execution, production, quality checks' },
    { id: 'deliver', name: 'Deliver', description: 'Packaging, shipping, customer delivery' },
    { id: 'return', name: 'Return', description: 'Customer returns, warranty claims, material recovery' },
  ];
}

function designPrinciplesForManufacturing(): DomainModel['designPrinciples'] {
  const layout: Record<string, string> = {
    'responsive-dashboard': 'Adaptive layout optimized for desktop control rooms, tablets on the shop floor, and mobile for supervisors',
    'data-dense': 'High information density with organized sections — operators need at-a-glance visibility',
    'print-friendly': 'Work order travelers, inspection checklists, and labels formatted for thermal and laser printers',
  };
  const color: Record<string, string> = {
    'industrial-neutral': 'Neutral gray tones with high-contrast elements suitable for varied lighting conditions',
    'status-green-red': 'Red/amber/green status indicators universally understood on production floor',
  };
  const typography: Record<string, string> = {
    'monospace-data': 'Monospace for part numbers, serial numbers, batch codes, and measurements',
    'clear-labels': 'Large, unambiguous labels with consistent terminology across all modules',
  };
  const interaction: Record<string, string> = {
    'inline-edit': 'Quick inline editing for work order notes, quality measurements, and inventory counts',
    'bulk-actions': 'Bulk status updates, bulk printing, bulk inventory adjustments with confirmation dialogs',
  };
  const accessibility: Record<string, string> = {
    'keyboard-nav': 'Full keyboard navigation for data entry terminals without mouse dependency',
    'screen-reader': 'Screen reader support for visually impaired operators using assistive technology',
  };
  const principles: DomainModel['designPrinciples'] = [];
  for (const [k, v] of Object.entries(layout)) principles.push({ name: `Layout: ${k}`, description: v });
  for (const [k, v] of Object.entries(color)) principles.push({ name: `Color: ${k}`, description: v });
  for (const [k, v] of Object.entries(typography)) principles.push({ name: `Typography: ${k}`, description: v });
  for (const [k, v] of Object.entries(interaction)) principles.push({ name: `Interaction: ${k}`, description: v });
  for (const [k, v] of Object.entries(accessibility)) principles.push({ name: `Accessibility: ${k}`, description: v });
  return principles;
}

function securityConsiderationsForManufacturing(): DomainModel['securityConsiderations'] {
  return [
    { category: 'auth', name: 'Role-based access with shift-level permissions', description: MANUFACTURING_PACK.security.auth, severity: 'high' },
    { category: 'data', name: 'Encrypted at rest with audit logging', description: MANUFACTURING_PACK.security.data, severity: 'high' },
    { category: 'compliance', name: 'ISO 9001', description: 'Quality management system requirements for documentation and traceability', severity: 'high' },
    { category: 'compliance', name: 'OSHA', description: 'Workplace safety standards and reporting requirements', severity: 'high' },
    { category: 'compliance', name: 'GDPR', description: 'Data protection for EU operations and customer data handling', severity: 'medium' },
  ];
}

function regulationsForManufacturing(): DomainModel['regulations'] {
  return [
    { name: 'ISO 9001', requirements: ['Quality management documentation', 'Traceability records', 'Internal audit schedule', 'Management review', 'Corrective action process'] },
    { name: 'OSHA', requirements: ['Safety incident reporting', 'Equipment guarding standards', 'Hazardous material handling', 'Employee training records'] },
    { name: 'GDPR', requirements: ['Customer data protection', 'Right to erasure', 'Data processing records', 'Breach notification within 72h'] },
  ];
}

function testingRequirementsForManufacturing(): DomainModel['testingRequirements'] {
  const all: DomainModel['testingRequirements'] = [];
  for (const t of MANUFACTURING_PACK.testing.unit) all.push({ category: 'unit', name: t, description: '', priority: 'high' });
  for (const t of MANUFACTURING_PACK.testing.integration) all.push({ category: 'integration', name: t, description: '', priority: 'high' });
  for (const t of MANUFACTURING_PACK.testing.e2e) all.push({ category: 'e2e', name: t, description: '', priority: 'medium' });
  return all;
}

export const MANUFACTURING_DOMAIN: DomainModel = {
  id: MANUFACTURING_PACK.domain,
  domain: MANUFACTURING_PACK.domain,
  name: MANUFACTURING_PACK.name,
  label: MANUFACTURING_PACK.name,
  category: 'manufacturing',
  description: MANUFACTURING_PACK.description,
  userRoles: rolesForManufacturing(),
  role: 'operator',
  standardFeatures: featuresForManufacturing(),
  businessModels: businessModelsForManufacturing(),
  technicalPatterns: technicalPatternsForManufacturing(),
  operationalLifecycle: operationalLifecycleForManufacturing(),
  designPrinciples: designPrinciplesForManufacturing(),
  securityConsiderations: securityConsiderationsForManufacturing(),
  regulations: regulationsForManufacturing(),
  testingRequirements: testingRequirementsForManufacturing(),
  workflows: [
    { id: 'work-order', name: 'Work Order Execution', steps: ['create', 'release', 'execute', 'inspect', 'complete', 'close'], entities: ['work-order', 'product', 'equipment'] },
    { id: 'procurement', name: 'Procurement Cycle', steps: ['requisition', 'approve', 'issue-po', 'receive', 'inspect', 'match', 'pay'], entities: ['purchase-order', 'vendor', 'material'] },
    { id: 'quality', name: 'Quality Inspection', steps: ['trigger', 'inspect', 'record', 'evaluate', 'disposition', 'report'], entities: ['inspection', 'lot', 'ncr'] },
  ],
  entities: [
    { name: 'Work Order', description: 'Production instruction for a specific product quantity', invariants: ['must have approved BOM', 'materials must be reserved before release'] },
    { name: 'Bill of Materials', description: 'Hierarchical list of components and quantities required', invariants: ['component quantities must be > 0', 'circular references not allowed'] },
    { name: 'Inventory Lot', description: 'Trackable quantity of a specific material or product', invariants: ['lot numbers must be unique', 'stock cannot go negative'] },
  ],
  invariants: ['material reservations must not exceed available stock', 'quality checks required before shipment', 'BOM changes require version control and re-approval'],
  constraints: ['work orders must have approved BOMs', 'inventory cannot go negative', 'quality holds prevent shipment'],
  financialFlows: [
    { name: 'material-purchase', direction: 'out', trigger: 'purchase-order-payment' },
    { name: 'product-sale', direction: 'in', trigger: 'customer-order-fulfillment' },
    { name: 'maintenance-cost', direction: 'out', trigger: 'equipment-maintenance-completion' },
  ],
  successMetrics: ['oee', 'first-pass-yield', 'on-time-delivery-rate', 'inventory-accuracy', 'equipment-uptime'],
  analytics: { tracked: ['production-volume', 'quality-metrics', 'equipment-utilization', 'inventory-turns'], dashboards: ['production', 'quality', 'inventory', 'equipment'] },
  securityRequirements: ['role-based-access', 'shift-level-permissions', 'audit-logging', 'data-encryption-at-rest'],
  regulatory: [
    { regulation: 'ISO 9001', applies: true, notes: 'Quality management system certification required' },
    { regulation: 'OSHA', applies: true, notes: 'Workplace safety compliance mandatory' },
    { regulation: 'GDPR', applies: true, notes: 'EU data protection for customer and employee data' },
  ],
};
