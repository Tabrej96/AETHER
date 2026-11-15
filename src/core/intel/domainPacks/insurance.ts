/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Insurance Management Platform Domain Pack
 *
 * Complete insurance platform — from quote to claim settlement with full policy administration.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForInsurance(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'direct-to-consumer-insurance',
      description: 'Digital-first insurance provider selling policies directly to consumers online — auto, home, renters, and life insurance with instant quotes.',
      pricingExamples: ['Auto liability $500-1,500/year', 'Full coverage auto $1,000-3,000/year', 'Homeowners $800-2,000/year', 'Renters $150-300/year', 'Term life $200-800/year'],
    },
    {
      modelType: 'insurance-broker-platform',
      description: 'Broker platform comparing multiple carriers, managing client relationships, and facilitating policy placement.',
      pricingExamples: ['Commission 10-15% of premium', 'Broker fee $50-200 per policy', 'Renewal commission 5-10%', 'Placing broker fee $25-75'],
    },
    {
      modelType: 'insurtech-saas',
      description: 'SaaS platform for insurance carriers — policy administration, claims processing, and rating engine.',
      pricingExamples: ['Per-policy admin fee $5-15/year', 'Platform license $50,000-500,000/year', 'Claims processing per claim $25-100', 'Implementation $100,000-500,000'],
    },
  ];
}

function revenueStreamsForInsurance(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Premium Payments',
      description: 'Primary revenue from insurance policy premium payments — monthly or annual.',
      pricingModel: 'per-policy-per-period',
      examples: ['Auto liability $500-1,500/year', 'Full coverage auto $1,000-3,000/year', 'Homeowners $800-2,000/year', 'Renters $150-300/year'],
    },
    {
      name: 'Policy Fees',
      description: 'Revenue from policy issuance fees, endorsement fees, and administrative charges.',
      pricingModel: 'per-policy',
      examples: ['Issuance fee $25-75', 'Endorsement fee $15-50', 'Cancellation fee $25-50', 'Reinstatement fee $50-100'],
    },
    {
      name: 'Commission on Sold Policies',
      description: 'Revenue from commissions on policies sold through agents or brokers.',
      pricingModel: 'percentage-of-premium',
      examples: ['New policy commission 10-15%', 'Renewal commission 5-10%', 'Captive agent commission 15-20%', 'Independent agent commission 10-15%'],
    },
    {
      name: 'Investment Income',
      description: 'Revenue from investment of policyholder reserves and premiums (float).',
      pricingModel: 'return-on-investment',
      examples: ['Bond portfolio yield 3-5%', 'Equity portfolio return 5-10%', 'Real estate income 4-7%', 'Alternative investments 8-15%'],
    },
    {
      name: 'Claims Administration Fees',
      description: 'Revenue from claims processing services — TPAs, adjusting, and settlement.',
      pricingModel: 'per-claim or per-hour',
      examples: ['TPA fee per claim $50-200', 'Adjuster hourly $75-150', 'Catastrophe adjusting fee per claim $100-300', 'Subrogation fee 10-20% recovered'],
    },
  ];
}

function userRoleMatrixForInsurance(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'policyholder',
      roleName: 'Policyholder',
      description: 'Insurance customer holding one or more policies. Manages coverage, files claims, makes payments, and accesses policy documents.',
      permissions: ['view-policies', 'make-payments', 'file-claims', 'update-contact', 'view-claims', 'request-endorsements'],
      features: ['policy-dashboard', 'payment-center', 'claim-filing', 'document-access', 'coverage-details', 'id-cards'],
      constraints: ['can only access own policies', 'claim must be filed within policy terms', 'premium payment due per billing schedule', 'coverage limits per policy terms'],
    },
    {
      roleId: 'agent',
      roleName: 'Agent',
      description: 'Licensed insurance agent selling policies, servicing accounts, and managing customer relationships.',
      permissions: ['create-quotes', 'submit-applications', 'manage-clients', 'process-endorsements', 'view-commissions'],
      features: ['quote-generator', 'application-tools', 'client-management', 'commission-tracking', 'policy-illustration'],
      constraints: ['must hold valid license per state', 'commission per agency agreement', 'client data per privacy regulations', 'quotes valid for time period'],
    },
    {
      roleId: 'underwriter',
      roleName: 'Underwriter',
      description: 'Risk assessment professional evaluating applications, setting rates, and determining coverage terms.',
      permissions: ['review-applications', 'set-rates', 'approve-policies', 'decline-risks', 'request-info', 'set-limits'],
      features: ['application-review', 'risk-assessment', 'rate-making', 'policy-approval', 'underwriting-guidelines'],
      constraints: ['must follow underwriting guidelines', 'approval authority per line and limit', 'admitted vs surplus lines rules', 'regulatory filing requirements'],
    },
    {
      roleId: 'claims-adjuster',
      roleName: 'Claims Adjuster',
      description: 'Claims professional investigating claims, assessing damages, negotiating settlements, and authorizing payments.',
      permissions: ['review-claims', 'investigate', 'assess-damages', 'negotiate-settlements', 'authorize-payments', 'assign-adjusters'],
      features: ['claim-intake', 'investigation-tools', 'damage-assessment', 'settlement-calculator', 'payment-authorization', 'subrogation'],
      constraints: ['settlement within policy limits', 'must investigate before settling', 'authority limits per claim type', 'regulatory timelines for acknowledgment'],
    },
    {
      roleId: 'broker',
      roleName: 'Broker',
      description: 'Insurance broker representing the insured, comparing carriers, and negotiating terms on behalf of clients.',
      permissions: ['compare-carriers', 'request-quotes', 'negotiate-terms', 'place-policies', 'manage-clients', 'view-commissions'],
      features: ['carrier-comparison', 'client-dashboard', 'policy-placement', 'commission-tracking', 'renewal-management'],
      constraints: ['fiduciary duty to client', 'disclosure of compensation', 'carrier appointments required', 'client consent for placements'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing policies, claims, users, reporting, billing, and compliance.',
      permissions: ['*'],
      features: ['dashboard', 'policy-management', 'claims-management', 'user-management', 'billing', 'reporting', 'compliance', 'settings'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'financial data access restricted', 'regulatory compliance mandatory'],
    },
  ];
}

function operationalWorkflowsForInsurance(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'quote-to-bind',
      name: 'Quote to Bind',
      description: 'Customer requests quote, application completed, risk assessed, underwriter approves, policy issued, and bound.',
      steps: ['quote-requested', 'application-started', 'information-collected', 'quote-generated', 'quote-presented', 'application-submitted', 'risk-assessed', 'underwriting-review', 'underwriter-approves', 'policy-issued', 'first-premium-paid', 'policy-bound'],
      entities: ['quote', 'application', 'policy', 'endorsement'],
      triggers: ['quote-requested', 'application-submitted', 'underwriter-approved', 'policy-bound'],
    },
    {
      workflowId: 'claim-to-settle',
      name: 'Claim to Settle',
      description: 'Claim filed, acknowledged, investigated, damages assessed, liability determined, settlement offered, and payment issued.',
      steps: ['claim-filed', 'claim-acknowledged', 'investigation-started', 'evidence-collected', 'liability-determined', 'damages-assessed', 'settlement-calculated', 'settlement-offered', 'negotiation', 'settlement-agreed', 'payment-issued', 'claim-closed'],
      entities: ['claim', 'investigation', 'settlement', 'payment'],
      triggers: ['claim-filed', 'investigation-complete', 'settlement-agreed', 'payment-issued'],
    },
    {
      workflowId: 'renewal-to-lapse',
      name: 'Renewal to Lapse',
      description: 'Renewal notice sent, customer reviews, payment received, policy renewed, or lapses if not renewed.',
      steps: ['renewal-notice-sent', 'customer-reviews', 'questions-answered', 'renewal-quote-provided', 'payment-received', 'policy-renewed', 'new-documents-issued', 'confirmation-sent'],
      entities: ['renewal', 'policy', 'payment'],
      triggers: ['renewal-notice-sent', 'payment-received', 'policy-renewed', 'policy-lapsed'],
    },
    {
      workflowId: 'underwrite-to-issue',
      name: 'Underwrite to Issue',
      description: 'Application received, risk data gathered, underwriting review, policy terms set, issued, and delivered.',
      steps: ['application-received', 'data-verified', 'risk-scored', 'underwriter-review', 'decision-made', 'policy-created', 'premium-calculated', 'endorsements-added', 'documents-generated', 'policy-issued', 'client-notified'],
      entities: ['application', 'policy', 'endorsement'],
      triggers: ['application-received', 'underwriter-approved', 'policy-issued'],
    },
  ];
}

function stateMachinesForInsurance(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Policy',
      states: ['quote', 'applied', 'underwriting', 'pending-approval', 'approved', 'bound', 'active', 'lapsed', 'cancelled', 'renewed', 'expired'],
      transitions: { quote: ['applied'], applied: ['underwriting'], underwriting: ['pending-approval'], 'pending-approval': ['approved', 'declined'], approved: ['bound'], bound: ['active'], active: ['renewed', 'lapsed', 'cancelled'], renewed: ['active'], lapsed: ['reinstated'], cancelled: ['closed'] },
      initialState: 'quote',
      terminalStates: ['expired', 'cancelled'],
    },
    {
      entityName: 'Claim',
      states: ['filed', 'acknowledged', 'investigating', 'damage-assessment', 'liability-determined', 'settlement-negotiation', 'settlement-approved', 'payment-pending', 'paid', 'denied', 'closed', 'reopened'],
      transitions: { filed: ['acknowledged'], acknowledged: ['investigating'], investigating: ['damage-assessment'], 'damage-assessment': ['liability-determined'], 'liability-determined': ['settlement-negotiation'], 'settlement-negotiation': ['settlement-approved', 'denied'], 'settlement-approved': ['payment-pending'], 'payment-pending': ['paid'], paid: ['closed', 'denied'], denied: ['reopened'], closed: ['reopened'] },
      initialState: 'filed',
      terminalStates: ['closed'],
    },
    {
      entityName: 'Quote',
      states: ['requested', 'in-progress', 'generated', 'presented', 'accepted', 'expired', 'converted'],
      transitions: { requested: ['in-progress'], 'in-progress': ['generated'], generated: ['presented'], presented: ['accepted', 'expired'], accepted: ['converted'] },
      initialState: 'requested',
      terminalStates: ['converted', 'expired'],
    },
    {
      entityName: 'Endorsement',
      states: ['requested', 'underwriting-review', 'approved', 'issued', 'effective', 'declined', 'expired'],
      transitions: { requested: ['underwriting-review'], 'underwriting-review': ['approved', 'declined'], approved: ['issued'], issued: ['effective'], effective: ['expired'] },
      initialState: 'requested',
      terminalStates: ['effective', 'declined', 'expired'],
    },
  ];
}

function edgeCasesForInsurance(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Catastrophic Event (Hurricane, Wildfire, Earthquake)',
      description: 'Large-scale natural disaster triggers thousands of simultaneous claims — property damage, business interruption, and evacuations.',
      handling: 'Catastrophe response team activated. Rapid claims intake deployed (mobile adjusters, photo-based triage). Prioritization by severity and customer value. Reserve funds established for expected losses. Special claims unit created for event. Communication plan activated with updates to affected policyholders.',
      recovery: 'Claims triaged by severity. High-value and severe claims handled by senior adjusters. Volume managed via photo-based preliminary assessments. Catastrophe reserve funds released per actuarial projections. Independent adjusting firms contracted for overflow. Post-event analytics for reserve adequacy.',
    },
    {
      scenario: 'Fraudulent Claim Detected',
      description: 'Claim flagged by fraud detection system for potential fraud — staged accident, inflated damages, or false injury.',
      handling: 'Fraud alert triggered by rules engine. Claim suspended from normal processing. Special investigation unit (SIU) notified. Policyholder contacted for additional documentation. Claim analyzed against fraud indicators. Legal counsel consulted if criminal fraud suspected.',
      recovery: 'If fraud confirmed: claim denied with explanation, policyholder notified, referral to authorities. If unconfirmed: claim returned to normal processing with explanation of delay. Fraud database updated. SIU findings documented for potential prosecution. Premium impact assessed if fraudulent history.',
    },
    {
      scenario: 'Coverage Dispute',
      description: 'Claim denied due to coverage exclusion or policy interpretation dispute between insurer and policyholder.',
      handling: 'Denial letter issued with specific policy language cited. Policyholder notification with appeal rights. Appeal period set per state regulations. Additional documentation requested from policyholder. Internal review by senior claims manager. Independent appraisal offered for value disputes.',
      recovery: 'If appeal successful: denial reversed, claim processed for payment. If appeal denied: final denial letter with explanation of external review rights. State insurance department notified if required. Potential litigation with legal representation. Settlement negotiation if warranted.',
    },
  ];
}

function integrationsForInsurance(): DomainPack['integrations'] {
  return [
    {
      name: 'Credit Bureau',
      type: 'data',
      description: 'Credit score and history for underwriting and rating.',
      required: false,
      configuration: 'Soft pull for quotes, hard pull for applications. FICO score integration. Credit history retrieval. Compliance with FCRA for permissible purposes.',
    },
    {
      name: 'Claims Management',
      type: 'operations',
      description: 'Claims processing platform with investigation, assessment, and settlement workflows.',
      required: true,
      configuration: 'Claim intake via multiple channels. Assignment to adjusters. Investigation tools with evidence management. Settlement calculator with policy limits. Payment processing per approved settlements.',
    },
    {
      name: 'Payment Processing',
      type: 'payment',
      description: 'Premium payment processing with multiple payment methods and billing.',
      required: true,
      configuration: 'Recurring billing for premiums. Direct debit authorization. Payment failure handling with grace period. Refund processing. Reconciliation to general ledger.',
    },
    {
      name: 'Regulatory Reporting',
      type: 'compliance',
      description: 'Automated regulatory reporting to state insurance departments and NAIC.',
      required: true,
      configuration: 'NAIC annual statement generation. State-specific regulatory filings. Premium tax reporting. Market conduct data. Complaint reporting per state requirements.',
    },
    {
      name: 'Rating Engine',
      type: 'operations',
      description: 'Insurance rating engine with actuarial tables and pricing rules.',
      required: true,
      configuration: 'Actuarial rating factors per line of business. Geographic rating factors. Discount and surcharge calculations. Minimum premium enforcement. Regulatory filing of rates.',
    },
    {
      name: 'Background Check',
      type: 'verification',
      description: 'Background and MVR checks for underwriting auto insurance.',
      required: false,
      configuration: 'Motor vehicle record (MVR) retrieval. CLUE (Comprehensive Loss Underwriting Exchange) report. Claims history verification. Prior carrier verification.',
    },
  ];
}

function technicalArchitectureForInsurance(): TechnicalArchitectureDef {
  return {
    patterns: ['Event-driven claims processing with investigation workflows', 'Real-time rating engine with actuarial factors', 'Policy administration with endorsement versioning', 'Fraud detection via rules engine and ML', 'Regulatory reporting with configurable templates'],
    infrastructure: ['PostgreSQL for policies, claims, and customer data', 'Redis for rate cache and session management', 'S3-compatible storage for claim documents and photos', 'Kafka for claim events and notifications', 'Elasticsearch for policy search and fraud detection', 'GraphDB for policy relationship mapping'],
    dataFlow: 'Quote request → risk data collected → rating engine calculates premium → quote generated → customer accepts → application processed → underwriting review → policy issued → premiums billed → claim filed → investigation → assessment → settlement → payment. Endorsement: policyholder requests change → underwriting reviews → endorsement issued → premium adjusted.',
    scalability: 'Rate engine cached via Redis with TTL. Claims intake handled via queue with priority processing. Document storage on S3 with lifecycle management. Reporting handled via batch processing with data warehouse. Fraud detection rules evaluated in real-time with ML model inference.',
  };
}

function regulatoryComplianceForInsurance(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'State Insurance Regulation',
      jurisdiction: 'United States (per state)',
      requirements: ['Rate filing and approval per state', 'Policy form filing', 'Producer licensing', 'Premium tax remittance', 'Market conduct compliance'],
      impact: 'Rate filing workflows per state. Policy form management with filing status. Agent licensing tracking. Premium tax calculation and remittance. Market conduct complaint tracking.',
    },
    {
      regulation: 'NAIC (National Association of Insurance Commissioners)',
      jurisdiction: 'United States',
      requirements: ['Annual statement reporting', 'Risk-based capital requirements', 'Sammie (SOMA) data submission', 'Consumer information sources', 'Model law adoption'],
      impact: 'Annual statement automation per NAIC instructions. Risk-based capital monitoring. SOMA data extraction and submission. Consumer complaint data collection and reporting.',
    },
    {
      regulation: 'HIPAA (Health Insurance)',
      jurisdiction: 'United States',
      requirements: ['Health information privacy and security', 'Minimum necessary standard', 'Individual access rights', 'Breach notification', 'Business associate agreements'],
      impact: 'PHI encryption and access controls. Minimum necessary data handling. Access request workflows. Breach notification procedures. BAA management for service providers.',
    },
    {
      regulation: 'GDPR (EU Policyholders)',
      jurisdiction: 'European Union',
      requirements: ['Data processing lawfulness', 'Right to access and erasure', 'Consent for marketing', 'Data minimization', 'Privacy by design'],
      impact: 'Consent management for EU policyholders. Data access and deletion workflows. Privacy policy per GDPR requirements. Data processing records. DPA (Data Processing Agreement) management.',
    },
  ];
}

function businessRulesForInsurance(): string[] {
  return [
    'Quote validity: 30 days from generation date. Rate changes during validity period may require re-quoting.',
    'Premium payment: due on effective date. Grace period 10-30 days depending on state and line of business. Lapse if not received.',
    'Claim acknowledgment: must acknowledge receipt within 15 days per most state regulations. Initial response within 5 days for urgent claims.',
    'Claim settlement: must offer settlement within 40 days of proof of loss for first-party claims.',
    'Underwriting authority: underwriters have authority limits per policy type and coverage amount. Exceeds limits require senior underwriter.',
    'Policy cancellation: 10-day notice for non-payment of premium. 30-day notice for other reasons per state law.',
    'Fraud detection: claims flagged by rules engine held for SIU review. Suspicious claims reported per state regulations.',
    'Reinsurance: excess of loss treaties triggered per treaty terms. Ceded premium calculated and paid to reinsurers.',
  ];
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const INSURANCE_PACK: DomainPack = {
  domain: 'insurance',
  name: 'Insurance Management Platform',
  description: 'Complete insurance management platform — from quote to claim settlement with full policy administration. Covers policy administration with endorsement management, multi-line quoting, claims processing with fraud detection, underwriting workflows, agent and broker management, premium billing, reinsurance, and compliance with state insurance regulation, NAIC, HIPAA, and GDPR.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Auto Insurance', 'Home Insurance', 'Life Insurance', 'Health Insurance', 'Commercial Insurance', 'Claims'],
    features: [
      'quote-generation',
      'policy-administration',
      'claims-processing',
      'underwriting',
      'billing',
      'fraud-detection',
      'endorsement-management',
      'reinsurance',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['instant-issue', 'underwritten', 'claim-settlement', 'renewal', 'endorsement'],
    features: [
      'instant-quote',
      'digital-policy',
      'id-cards',
      'claim-payment',
      'renewal-notice',
      'endorsement-processing',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'quote-comparison',
      'policy-dashboard',
      'payment-center',
      'claim-filing',
      'claim-status',
      'document-access',
      'coverage-details',
      'agent-portal',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'policy-administration',
      'underwriting',
      'claims-management',
      'billing',
      'commission-management',
      'reinsurance',
      'fraud-investigation',
      'reporting',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'trust-signals',
      'coverage-guides',
      'safety-tips',
      'community-stories',
      'digital-experience',
      'mobile-app',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'quote-comparison',
      'coverage-guides',
      'claims-filing',
      'contact',
      'agent-locator',
    ],
    customer: [
      'dashboard',
      'my-policies',
      'payment-center',
      'claim-filing',
      'claim-status',
      'documents',
      'profile',
    ],
    admin: [
      'dashboard',
      'policy-management',
      'claims-management',
      'underwriting',
      'billing',
      'commission',
      'reporting',
      'compliance',
    ],
    staff: [
      'claim-intake',
      'claim-investigation',
      'settlement-tools',
      'underwriting-queue',
      'policy-issuance',
      'fraud-investigation',
      'payment-authorization',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForInsurance() as unknown as BusinessRulesSpec,

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Trust-focused design with clear security indicators and policy details',
      'Quote comparison with side-by-side coverage and pricing',
      'Claims filing wizard with photo upload and guided steps',
      'Policy dashboard with coverage details, documents, and payment status',
      'Underwriting queue with risk score visualization and action buttons',
      'Document-heavy interfaces with clear categorization and search',
    ],
    color: [
      'Trust blue (#1565C0) primary for insurance brand authority',
      'Stability green (#2E7D32) for active policies and approved claims',
      'Caution amber (#F9A825) for review and pending status',
      'Alert red (#D32F2F) for denied, expired, and claim alerts',
      'Professional navy (#0D47A1) for financial and contractual elements',
      'Clean white backgrounds for document clarity',
      'Light gray for secondary content areas',
    ],
    typography: [
      'Professional serif (Georgia) for policy documents and contracts',
      'Clean sans-serif (Inter) for UI and digital interfaces',
      'Bold for policy numbers and key financial figures',
      'Clear hierarchy for coverage details and limits',
      'High contrast for accessibility in financial data',
    ],
    interaction: [
      'Step-by-step quote wizard with progress indicator',
      'Coverage comparison table with toggle and highlight',
      'Claim filing with photo upload and GPS location capture',
      'Policy documents with e-signature integration',
      'Real-time claim status updates with timeline view',
      'Premium payment with saved payment methods',
      'Push notifications for claim status and payment reminders',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance',
      'Screen reader support for policy documents',
      'Keyboard navigation for claims and billing',
      'High contrast mode for financial clarity',
      'Multi-language support for diverse policyholders',
      'Large touch targets for mobile claims filing',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Policyholder (view policies, file claims, make payments), Agent (create quotes, manage clients), Underwriter (risk assessment, policy approval), Claims Adjuster (investigate, assess, settle), Broker (compare carriers, negotiate), Admin (full platform). JWT with 8h expiry. Refresh tokens with 30d. MFA for all staff and financial operations. Role-based access per line of business and authority level.',
    data: 'Policyholder data includes PII, health information (HIPAA), financial data, and claim history. Policy data includes coverage terms, premiums, and endorsements. Claim data includes investigation notes and settlement amounts. PHI encrypted per HIPAA. Financial data encrypted per PCI DSS. Audit logging for all policy and claim modifications.',
    compliance: ['State insurance regulation per jurisdiction', 'NAIC reporting requirements', 'HIPAA for health insurance data', 'GDPR for EU policyholders', 'Consumer protection laws', 'Anti-money laundering (AML)', 'Fraud prevention requirements'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Premium calculation per rating factors and coverage',
      'Claim reserve calculation per policy limits',
      'Underwriting score calculation',
      'Commission calculation per agent contract',
      'Endorsement premium adjustment calculation',
      'Fraud score calculation per rules engine',
      'Policy lapse date calculation per billing cycle',
      'Deductible application per claim type',
    ],
    integration: [
      'Quote → application → underwriting → policy issuance → billing',
      'Claim filed → acknowledged → investigation → settlement → payment → close',
      'Renewal notice → quote → payment → policy renewed → new documents issued',
      'Endorsement request → underwriting → issued → premium adjusted → documents generated',
      'Agent quote request → rating engine → quote generated → presented to customer',
    ],
    e2e: [
      'Quote-to-bind flow: request quote → application → underwriting → policy issued → first premium paid',
      'Claim lifecycle: file → acknowledge → investigate → assess → settle → pay → close',
      'Policy lifecycle: issue → endorsements → renewals → lapse or cancellation',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForInsurance(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForInsurance(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForInsurance(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForInsurance(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForInsurance(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForInsurance(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForInsurance(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForInsurance(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForInsurance(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const INSURANCE_DOMAIN: DomainModel = {
  id: INSURANCE_PACK.domain,
  domain: INSURANCE_PACK.domain,
  name: INSURANCE_PACK.name,
  label: INSURANCE_PACK.name,
  category: 'insurance',
  description: INSURANCE_PACK.description,
  userRoles: [
    { id: 'policyholder', name: 'Policyholder', typicalFeatures: ['policy-dashboard', 'payment-center', 'claim-filing', 'document-access'], permissions: ['view-policies', 'make-payments', 'file-claims', 'update-contact'] },
    { id: 'agent', name: 'Agent', typicalFeatures: ['quote-generator', 'application-tools', 'client-management', 'commission-tracking'], permissions: ['create-quotes', 'submit-applications', 'manage-clients', 'process-endorsements'] },
    { id: 'underwriter', name: 'Underwriter', typicalFeatures: ['application-review', 'risk-assessment', 'rate-making', 'policy-approval'], permissions: ['review-applications', 'set-rates', 'approve-policies', 'decline-risks'] },
    { id: 'claims-adjuster', name: 'Claims Adjuster', typicalFeatures: ['claim-intake', 'investigation-tools', 'damage-assessment', 'settlement-calculator'], permissions: ['review-claims', 'investigate', 'assess-damages', 'authorize-payments'] },
    { id: 'broker', name: 'Broker', typicalFeatures: ['carrier-comparison', 'client-dashboard', 'policy-placement', 'renewal-management'], permissions: ['compare-carriers', 'request-quotes', 'negotiate-terms', 'place-policies'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'policy-management', 'claims-management', 'billing'], permissions: ['*'] },
  ],
  role: 'policyholder',
  standardFeatures: [],
  businessModels: [
    { modelType: 'direct-to-consumer-insurance', revenueStreams: ['premiums', 'policy-fees', 'ancillary-services'], costStructure: ['acquisition', 'claims', 'operations', 'compliance'], pricingStrategy: ['direct', 'usage-based', 'bundled'] },
    { modelType: 'insurance-broker-platform', revenueStreams: ['commissions', 'broker-fees', 'renewal-commissions'], costStructure: ['carrier-relations', 'technology', 'staff'], pricingStrategy: ['commission-based', 'fee-for-service'] },
    { modelType: 'insurtech-saas', revenueStreams: ['platform-licensing', 'per-policy-fees', 'implementation'], costStructure: ['engineering', 'support', 'compliance'], pricingStrategy: ['per-policy', 'flat-license'] },
  ],
  technicalPatterns: [
    { category: 'rating', name: 'Real-Time Rating Engine', description: 'Instant premium calculation with actuarial factors', rationale: 'Instant quotes require sub-second rating' },
    { category: 'fraud', name: 'Fraud Detection System', description: 'Rules engine and ML for suspicious claim detection', rationale: 'Insurance fraud costs billions annually' },
    { category: 'policy', name: 'Policy Administration', description: 'Policy lifecycle with endorsement versioning', rationale: 'Policies change frequently with endorsements' },
    { category: 'claims', name: 'Claims Processing Engine', description: 'End-to-end claim workflow with investigation and settlement', rationale: 'Claims are core to insurance operations' },
  ],
  operationalLifecycle: [
    { id: 'quote', name: 'Quote', description: 'Customer receives quote with coverage and pricing' },
    { id: 'issue', name: 'Issue', description: 'Policy issued with premium and coverage details' },
    { id: 'manage', name: 'Manage', description: 'Policy active with premiums paid, endorsements processed' },
    { id: 'claim', name: 'Claim', description: 'Claim filed, investigated, and settled' },
    { id: 'renew', name: 'Renew', description: 'Policy renewed or lapsed' },
  ],
  designPrinciples: [
    { name: 'Trust and Transparency', description: 'Clear coverage terms, no hidden fees, easy to understand policies' },
    { name: 'Claims Ease', description: 'Simple, fast claims filing with clear status tracking' },
    { name: 'Financial Clarity', description: 'Premium and payment details prominently displayed' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Agent license verification', description: 'Licensed professionals only per state', severity: 'high' },
    { category: 'data', name: 'PHI protection (HIPAA)', description: 'Health insurance data encrypted', severity: 'critical' },
    { category: 'compliance', name: 'State insurance regulation', description: 'Rate filing and policy form compliance', severity: 'high' },
    { category: 'compliance', name: 'Fraud prevention', description: 'SIU investigation and reporting', severity: 'medium' },
  ],
  regulations: [
    { name: 'State Insurance', requirements: ['Rate filing', 'Policy forms', 'Producer licensing', 'Premium tax'] },
    { name: 'NAIC', requirements: ['Annual statements', 'Risk-based capital', 'SOMA reporting'] },
    { name: 'HIPAA', requirements: ['Health data privacy', 'Minimum necessary', 'Breach notification'] },
    { name: 'GDPR', requirements: ['Data subject rights', 'Consent management', 'Privacy by design'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Rating accuracy', description: 'Premium calculation per rating factors', priority: 'critical' },
    { category: 'unit', name: 'Claim reserve', description: 'Reserve calculation per policy limits', priority: 'high' },
    { category: 'integration', name: 'Quote to bind', description: 'Request → rate → issue → bill', priority: 'high' },
    { category: 'e2e', name: 'Claim lifecycle', description: 'File → investigate → settle → pay', priority: 'high' },
  ],
  workflows: [
    { id: 'quote-to-bind', name: 'Quote to Bind', steps: ['request', 'rate', 'quote', 'accept', 'underwrite', 'issue', 'bind'], entities: ['quote', 'application', 'policy'] },
    { id: 'claim-to-settle', name: 'Claim to Settle', steps: ['file', 'acknowledge', 'investigate', 'assess', 'settle', 'pay', 'close'], entities: ['claim', 'investigation', 'settlement', 'payment'] },
    { id: 'renewal', name: 'Renewal', steps: ['notice', 'review', 'quote', 'pay', 'renew'], entities: ['renewal', 'policy', 'payment'] },
  ],
  entities: [
    { name: 'Policy', description: 'Insurance policy with coverage, premium, and terms', invariants: ['premium paid for active status', 'coverage limits enforced'] },
    { name: 'Claim', description: 'Insurance claim with investigation and settlement', invariants: ['claim within policy period', 'settlement within limits'] },
    { name: 'Quote', description: 'Insurance quote with rate and coverage', invariants: ['rate per filing', 'valid within time period'] },
  ],
  invariants: ['policy premium paid for active coverage', 'claim settlement within policy limits', 'rate filing compliant per state', 'fraud detection on all claims'],
  constraints: ['quote valid 30 days', 'grace period 10-30 days', 'claim acknowledgment 15 days', 'settlement offer 40 days', 'cancellation notice 10-30 days'],
  financialFlows: [
    { name: 'premium-collected', direction: 'in', trigger: 'premium-paid' },
    { name: 'claim-payment', direction: 'out', trigger: 'claim-settled' },
    { name: 'commission-paid', direction: 'out', trigger: 'policy-sold' },
    { name: 'reinsurance-ceded', direction: 'out', trigger: 'reinsurance-treaty-excess' },
    { name: 'investment-income', direction: 'in', trigger: 'investment-return' },
  ],
  successMetrics: ['combined-ratio', 'loss-ratio', 'policy-retention', 'claim-settlement-time', 'quotes-to-binds', 'fraud-detection-rate', 'underwriting-profit'],
  analytics: { tracked: ['policies', 'premiums', 'claims', 'loss-ratio', 'combined-ratio', 'fraud-flags'], dashboards: ['underwriting-dashboard', 'claims-dashboard', 'billing-dashboard', 'actuarial-dashboard'] },
  securityRequirements: ['jwt-auth', 'phi-encryption-hipaa', 'pci-compliance', 'fraud-detection', 'audit-logging', 'regulatory-reporting'],
  regulatory: [
    { regulation: 'State Insurance', applies: true, notes: 'Rate filing and policy compliance per state' },
    { regulation: 'NAIC', applies: true, notes: 'National insurance standards and reporting' },
    { regulation: 'HIPAA', applies: true, notes: 'Health insurance data protection' },
    { regulation: 'GDPR', applies: true, notes: 'EU policyholder data rights' },
  ],
};
