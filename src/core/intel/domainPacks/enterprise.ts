/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Enterprise Domain Pack
 *
 * Enterprise Resource Planning (ERP) system integrating finance, human resources,
 * supply chain, customer relationship management, project management, and advanced
 * analytics. Supports multi-entity operations, global tax compliance, and
 * comprehensive audit trails for regulated industries.
 */


import type { Regulation } from './domainPackTypes.js';
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
      { id: 'employee', name: 'Employee', typicalFeatures: pack.customer.features, permissions: ['read', 'write'] },
      { id: 'manager', name: 'Manager', typicalFeatures: pack.operations.features, permissions: ['read', 'write', 'approve'] },
      { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'compliance'], permissions: ['admin'] },
    ],
    role: 'user',
    standardFeatures: allFeatures.length > 0 ? allFeatures : [{ category: 'core', name: 'core', description: 'Core product', priority: 'essential' }],
    businessModels: [{ modelType: pack.domain, revenueStreams: ['enterprise-license', 'implementation-fees', 'support-contracts'], costStructure: ['engineering', 'implementation', 'support', 'compliance'], pricingStrategy: ['perpetual-license', 'subscription', 'module-based'] }],
    technicalPatterns: [
      { category: 'architecture', name: 'Modular Monolith', description: 'Domain-driven modular architecture with bounded contexts' },
      { category: 'data', name: 'Multi-Entity Data Isolation', description: 'Row-level security and entity-based data segregation' },
      { category: 'reporting', name: 'OLAP Cubes', description: 'Pre-computed aggregations for fast financial reporting' },
    ],
    operationalLifecycle: [
      { id: 'implement', name: 'Implement', description: 'System configuration and data migration' },
      { id: 'operate', name: 'Operate', description: 'Day-to-day business process execution' },
      { id: 'report', name: 'Report', description: 'Financial and operational reporting' },
      { id: 'audit', name: 'Audit', description: 'Compliance audit and trail review' },
      { id: 'optimize', name: 'Optimize', description: 'Process improvement and system optimization' },
    ],
    designPrinciples: [
      { name: 'Modular Dashboard', description: 'Configurable dashboard with modular widget system' },
      { name: 'Data Dense', description: 'Information-rich displays optimized for power users' },
      { name: 'Report Focused', description: 'Reporting and analytics as first-class citizen' },
    ],
    securityConsiderations: [
      { category: 'auth', name: 'Enterprise SSO with RBAC and SOD', description: 'SAML SSO with role-based access and separation of duties', severity: 'critical' },
      { category: 'data', name: 'Field-Level Encryption', description: 'Encrypted at rest with field-level encryption for PII', severity: 'critical' },
      { category: 'compliance', name: 'Multi-Regulation Compliance', description: 'SOX, GDPR, ISO 27001, and HIPAA-ready', severity: 'high' },
    ],
    regulations: [
      { name: 'SOX', requirements: ['Financial reporting controls', 'Access control reviews', 'Change management documentation', 'Annual audit'] },
      { name: 'GDPR', requirements: ['Data processing records', 'Right to erasure', 'Consent management', '72-hour breach notification'] },
      { name: 'ISO 27001', requirements: ['ISMS implementation', 'Risk assessment', 'Continuous improvement', 'Supplier security assessment'] },
      { name: 'HIPAA', requirements: ['PHI protection', 'Access controls', 'Audit controls', 'Transmission security'] },
    ],
    testingRequirements: [
      { category: 'unit', name: 'Chart of Accounts', description: 'Account combination validation and rollup calculation', priority: 'high' },
      { category: 'unit', name: 'Approval Chain', description: 'Threshold-based routing and delegation logic', priority: 'high' },
      { category: 'unit', name: 'Budget Control', description: 'Soft/hard enforcement and override handling', priority: 'high' },
      { category: 'integration', name: 'Procurement Flow', description: 'PO → approval → goods receipt → invoice → payment → GL posting', priority: 'high' },
      { category: 'integration', name: 'Payroll Processing', description: 'Payroll run → tax calc → bank file → payment → GL posting → report', priority: 'high' },
      { category: 'integration', name: 'Sales Order Flow', description: 'Order → inventory reservation → shipment → invoicing → AR posting', priority: 'high' },
      { category: 'e2e', name: 'Procurement to GL', description: 'Create PO → manager approves → goods received → invoice matched → payment scheduled → GL updated → financial statements reflect', priority: 'high' },
      { category: 'e2e', name: 'Multi-Entity Consolidation', description: 'Subsidiary books → intercompany eliminations → consolidation → statutory statements → regulatory filing', priority: 'high' },
    ],
    workflows: [
      { id: 'procurement', name: 'Procurement Workflow', steps: ['create-po', 'route-approval', 'receive-goods', 'match-invoice', 'process-payment', 'post-to-gl'], entities: ['PurchaseOrder', 'GoodsReceipt', 'Invoice'] },
      { id: 'order-to-cash', name: 'Order to Cash', steps: ['create-order', 'check-credit', 'reserve-inventory', 'fulfill-order', 'send-invoice', 'receive-payment'], entities: ['SalesOrder', 'Shipment', 'Invoice'] },
      { id: 'record-to-report', name: 'Record to Report', steps: ['record-transaction', 'post-to-gl', 'reconcile', 'consolidate', 'generate-statements', 'audit-review'], entities: ['JournalEntry', 'Ledger', 'FinancialStatement'] },
      { id: 'hire-to-retire', name: 'Hire to Retire', steps: ['post-job', 'interview', 'offer', 'onboard', 'manage', 'offboard'], entities: ['Employee', 'PayrollRecord', 'Benefits'] },
    ],
    entities: [
      { name: 'GeneralLedger', description: 'Master chart of accounts with double-entry bookkeeping', invariants: ['always balanced (debits = credits)', 'period-closing enforced', 'immutable after posting'] },
      { name: 'Invoice', description: 'Financial invoice with line items and tax', invariants: ['positive amounts', 'matches purchase order', 'tax calculated correctly'] },
      { name: 'Employee', description: 'HR employee record with compensation and benefits', invariants: ['unique employee ID', 'valid employment dates', 'manager assigned'] },
      { name: 'CostCenter', description: 'Cost allocation unit for budgeting and reporting', invariants: ['hierarchical structure', 'budget defined', 'active during fiscal period'] },
    ],
    invariants: [
      'All financial transactions must have balanced debits and credits',
      'Chart of accounts combinations validated on entry',
      'Budgetary control enforced at configured thresholds',
      'Closed fiscal periods locked against modification',
      'Approval hierarchy enforced before transaction posting',
      'Intercompany transactions require matching entries in both entities',
    ],
    constraints: [
      'Fiscal period cannot be closed with unposted transactions',
      'Budget override requires CFO approval above 10% variance',
      'Payroll processing locked during approved run window',
      'Invoice cannot exceed approved purchase order amount',
    ],
    financialFlows: [
      { name: 'accounts-receivable', direction: 'in', trigger: 'invoice-issued' },
      { name: 'accounts-payable', direction: 'out', trigger: 'invoice-received' },
      { name: 'payroll', direction: 'out', trigger: 'payroll-run' },
      { name: 'tax-payment', direction: 'out', trigger: 'tax-filing' },
    ],
    successMetrics: [
      'monthly-close-time',
      'invoice-processing-time',
      'budget-variance',
      'audit-findings-count',
      'procurement-cycle-time',
      'employee-onboarding-time',
      'system-uptime',
      'data-quality-score',
    ],
    analytics: {
      tracked: ['financial-metrics', 'operational-kpis', 'budget-variance', 'procurement-metrics', 'hr-metrics'],
      dashboards: ['financial', 'operational', 'executive', 'compliance', 'departmental'],
    },
    securityRequirements: [
      'Enterprise SSO with SAML 2.0 and OIDC',
      'Role-based access with separation of duties',
      'Field-level encryption for sensitive PII',
      'Complete audit trail for financial transactions',
      'Data masking in non-production environments',
    ],
    regulatory: [
      { regulation: 'SOX', applies: true, notes: 'Financial controls and audit trail' },
      { regulation: 'GDPR', applies: true, notes: 'Employee and customer data protection' },
      { regulation: 'ISO 27001', applies: true, notes: 'Information security management' },
      { regulation: 'HIPAA', applies: true, notes: 'PHI protection for healthcare modules' },
    ],
  };
}

// ── Enterprise Pack ───────────────────────────────────────────────────────────

export const ENTERPRISE_PACK: DomainPack = {
  domain: 'enterprise',
  name: 'Enterprise Resource Planning (ERP)',
  description:
    'Enterprise Resource Planning (ERP) system integrating finance, human resources, supply chain, customer relationship management, project management, and advanced analytics. Supports multi-entity operations, global tax compliance, and comprehensive audit trails for regulated industries.',

  // ── Catalog ─────────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Finance', 'HR', 'Supply Chain', 'CRM', 'Projects', 'Analytics'],
    features: [
      'general-ledger',
      'accounts-payable',
      'accounts-receivable',
      'payroll-management',
      'inventory-control',
      'procurement',
      'order-management',
      'customer-relationship',
      'project-accounting',
      'budget-planning',
      'financial-reporting',
      'tax-management',
      'multi-currency',
      'fixed-assets',
      'expense-management',
      'workflow-automation',
      'business-intelligence',
      'compliance-reporting',
      'supply-chain-visibility',
      'vendor-management',
    ],
  },

  // ── Fulfillment ─────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['cloud', 'on-premise', 'hybrid', 'edge'],
    features: [
      'multi-entity',
      'global-tax',
      'compliance-reporting',
      'integration-hub',
      'data-migration',
      'custom-modules',
      'multi-language',
      'audit-export',
    ],
  },

  // ── Customer Features ───────────────────────────────────────────────────────
  customer: {
    features: [
      'dashboard',
      'finance',
      'hr',
      'projects',
      'reports',
      'settings',
      'procurement',
      'inventory',
      'crm',
      'analytics',
    ],
  },

  // ── Operations Features ─────────────────────────────────────────────────────
  operations: {
    features: [
      'master-data',
      'process-automation',
      'compliance',
      'integration',
      'change-management',
      'data-quality',
      'system-health',
      'release-management',
    ],
  },

  // ── Experience Features ─────────────────────────────────────────────────────
  experience: {
    features: [
      'role-based-views',
      'smart-forms',
      'workflow-automation',
      'predictive-insights',
      'bulk-operations',
      'inline-edit',
      'custom-dashboards',
      'guided-setup',
    ],
  },

  // ── Components ──────────────────────────────────────────────────────────────
  components: {
    public: ['landing', 'solutions', 'resources', 'case-studies', 'demo'],
    customer: ['workspace', 'modules', 'reports', 'settings', 'integrations', 'dashboard'],
    admin: ['dashboard', 'user-mgmt', 'compliance', 'settings', 'integrations', 'audit'],
    staff: ['operations', 'support', 'implementation', 'training', 'deployment'],
  },

  // ── Business Rules ──────────────────────────────────────────────────────────
  businessRules: {
    chartOfAccounts: 'Multi-level chart of accounts with configurable structures per entity. Segment reporting for cost centers, departments, and projects. Account combinations validated on entry. Parent-child rollup automatic. Chart versioning for fiscal year changes.',
    approvalHierarchy: 'Multi-level approval chains configurable per transaction type and amount threshold. Approval delegation during absences with expiry. Dual-approval (four-eyes) for amounts above limit. Emergency approval with mandatory post-facto review.',
    fiscalCalendars: 'Multiple fiscal calendars per legal entity. Types: standard 12-month, 4-4-5 retail, 13-period, custom. Fiscal year can differ from calendar year. Period closing with defined cutoffs. Adjusting entries during open period. Closed periods locked with admin override.',
    costCenters: 'Cost centers allocated via direct assignment, percentage split, or driver-based. Intercompany cost transfers tracked with due-to/due-from. Budgetary control with override approval. Cost center hierarchy with rollup. Project-specific cost centers for job costing.',
    budgetControls: 'Budget defined at entity, cost center, department, and project levels. Soft controls (warnings) at 80% and 95%. Hard controls (blocks) at 100%. Budget revisions require CFO approval above 10% variance. Budget carry-forward configurable. Encumbrance accounting tracks committed spend.',
    auditTrail: 'Complete audit trail for all financial transactions with immutable log. Change tracking: who changed what, when, from what previous value. Document versioning with full history. Cross-reference linking for related transactions. Exportable in compliance formats (XBRL, CSV).',
  },

  // ── Design ──────────────────────────────────────────────────────────────────
  design: {
    layout: ['modular-dashboard', 'data-dense', 'report-focused', 'sidebar-navigation'],
    color: ['corporate-neutral', 'status-indicators', 'brand-accent', 'alert-color'],
    typography: ['form-readable', 'table-dense', 'clear-labels', 'financial-precise'],
    interaction: ['bulk-operations', 'inline-edit', 'quick-filters', 'drill-down'],
    accessibility: ['keyboard-nav', 'screen-reader', 'WCAG-2.1', 'high-contrast'],
  },

  // ── Security ────────────────────────────────────────────────────────────────
  security: {
    auth: 'Enterprise SSO with RBAC and SOD. SAML 2.0 and OIDC SSO support. RBAC with separation of duties (SoD) for financial transactions. MFA required for finance and admin roles. Session management with idle timeout. API auth via OAuth2 client credentials.',
    data: 'Encrypted at rest (AES-256) with field-level encryption for sensitive fields (SSN, bank account). Data masking in non-production. TLS 1.3 for data in transit. Field-level audit for PII access. Secure data deletion with cryptographic erasure.',
    compliance: ['SOX', 'GDPR', 'ISO 27001', 'HIPAA-ready'],
  },

  // ── Testing ─────────────────────────────────────────────────────────────────
  testing: {
    unit: [
      'Chart of accounts: combination validation and rollup',
      'Approval chain: threshold-based routing and delegation',
      'Budget control: soft/hard enforcement and override handling',
      'Multi-currency conversion: rate sourcing and revaluation',
      'Tax calculation: jurisdiction rules and exemption handling',
      'Cost allocation: driver-based and intercompany transfers',
    ],
    integration: [
      'Purchase order → approval → goods receipt → invoice → payment → GL posting',
      'Payroll → tax calculation → bank file → payment → GL posting → compliance report',
      'Sales order → inventory reservation → shipment → invoicing → AR posting → statement',
      'Budget → approval → forecast → variance report → threshold alert',
    ],
    e2e: [
      'Procurement creates PO → manager approves → goods received → invoice matched → payment scheduled → GL updated → financial statements reflect transaction',
      'Multi-entity consolidation: subsidiary books → intercompany eliminations → group consolidation → statutory statements → regulatory filing',
    ],
  },
};

// ── Enterprise Domain Model ───────────────────────────────────────────────────

export const ENTERPRISE_DOMAIN: DomainModel = toDomainModel(ENTERPRISE_PACK);
