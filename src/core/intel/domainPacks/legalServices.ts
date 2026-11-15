/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Legal Services Domain Pack
 *
 * Complete legal practice management platform — from client intake to case resolution.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForLegalServices(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'hourly-billing-saas',
      description: 'Traditional law firm SaaS platform enabling time tracking, billing, document management, and client communication. Attorneys track billable hours, generate invoices, and manage matter workflows.',
      pricingExamples: ['$50/user/month solo plan', '$99/user/month firm plan', '$200/month custom integrations', '$500/year per attorney enterprise'],
    },
    {
      modelType: 'flat-fee-legal-marketplace',
      description: 'Online marketplace connecting consumers and small businesses with pre-priced legal services — contract review, incorporation, trademark filing, etc.',
      pricingExamples: ['$199 flat-fee contract review', '$499 business incorporation', '$99/month legal subscription', '10-15% platform commission on engagements'],
    },
    {
      modelType: 'subscription-compliance-tool',
      description: 'SaaS product providing ongoing legal compliance monitoring, document automation, and regulatory alerting for businesses.',
      pricingExamples: ['$99/month compliance monitoring', '$49/month document templates', '$299/month premium compliance suite', 'Per-user overage at $25/user/month'],
    },
  ];
}

function revenueStreamsForLegalServices(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Hourly Billing & Invoicing',
      description: 'Revenue generated from attorney time tracked and billed to clients at hourly rates through the platform.',
      pricingModel: 'hourly-rate-per-attorney',
      examples: ['$350/hour senior attorney', '$225/hour associate', '$175/hour paralegal time', 'Minimum 0.1 hour increments'],
    },
    {
      name: 'Flat-Fee Marketplace Commission',
      description: 'Platform commission on pre-priced legal services transacted through the marketplace.',
      pricingModel: 'percentage-of-transaction',
      examples: ['15% on flat-fee engagements', '$29/month attorney listing fee', '10% on document automation sales'],
    },
    {
      name: 'Subscription SaaS Fees',
      description: 'Recurring subscription revenue from law firms and legal departments using the practice management platform.',
      pricingModel: 'per-user-per-month',
      examples: ['$50/user/month solo attorney', '$99/user/month firm', '$200/month enterprise base'],
    },
    {
      name: 'Court Filing Fees',
      description: 'Processing fees collected for electronic court filing services integrated with the platform.',
      pricingModel: 'per-filing',
      examples: ['$5 per standard filing', '$15 per expedited filing', 'State court fees passed through + $3 processing'],
    },
    {
      name: 'Document Automation',
      description: 'Revenue from automated document generation, template licensing, and e-signature integration.',
      pricingModel: 'subscription plus per-document',
      examples: ['$49/month template access', '$2 per generated document', '$99/month unlimited documents'],
    },
  ];
}

function userRoleMatrixForLegalServices(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'attorney',
      roleName: 'Attorney',
      description: 'Licensed legal professional managing cases, drafting documents, billing clients, and appearing in court.',
      permissions: ['manage-cases', 'create-documents', 'bill-hours', 'file-court-documents', 'access-research-db', 'view-client-data'],
      features: ['case-management', 'document-drafting', 'time-tracking', 'billing', 'legal-research', 'court-filing'],
      constraints: ['bar license verified and current', 'conflict-of-interest check before case acceptance', 'client-attorney privilege applies to all communications', 'billing must comply with jurisdiction fee rules'],
    },
    {
      roleId: 'paralegal',
      roleName: 'Paralegal',
      description: 'Legal support professional assisting attorneys with document preparation, research, and case organization.',
      permissions: ['create-documents', 'edit-cases', 'conduct-research', 'file-documents', 'track-time'],
      features: ['document-management', 'legal-research', 'time-tracking', 'case-organization'],
      constraints: ['supervised by licensed attorney', 'cannot provide legal advice', 'cannot appear in court', 'billing at paralegal rate only'],
    },
    {
      roleId: 'client',
      roleName: 'Client',
      description: 'Individual or business receiving legal services. Accesses case updates, documents, and billing information.',
      permissions: ['view-own-cases', 'upload-documents', 'view-invoices', 'message-attorney', 'make-payments'],
      features: ['client-portal', 'case-status', 'document-access', 'invoice-payment', 'secure-messaging'],
      constraints: ['can only access own cases', 'cannot modify attorney work product', 'document access logged for privilege', 'payment required before document release on billing matters'],
    },
    {
      roleId: 'admin',
      roleName: 'Firm Administrator',
      description: 'Administrative user managing firm settings, user accounts, billing configuration, and compliance reporting.',
      permissions: ['manage-users', 'configure-billing', 'generate-reports', 'manage-templates', 'view-all-cases'],
      features: ['user-management', 'billing-configuration', 'reporting', 'template-management', 'compliance-dashboard'],
      constraints: ['cannot access privileged case communications', 'all configuration changes logged', 'MFA required for admin access', 'data export restricted to anonymized views'],
    },
    {
      roleId: 'billing',
      roleName: 'Billing Specialist',
      description: 'Financial specialist managing invoicing, payment processing, trust accounting, and billing compliance.',
      permissions: ['generate-invoices', 'process-payments', 'manage-trust-accounts', 'view-billing-data', 'send-reminders'],
      features: ['invoice-generation', 'payment-processing', 'trust-accounting', 'billing-reports', 'collection-management'],
      constraints: ['trust account compliance per IOLTA rules', 'client funds segregation required', 'billing entries must reference specific tasks', 'write-offs require attorney approval'],
    },
  ];
}

function operationalWorkflowsForLegalServices(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'intake-to-engagement',
      name: 'Intake to Engagement',
      description: 'Prospective client submits inquiry, firm conducts conflict check, engagement letter sent, retainer collected, and matter opened.',
      steps: ['client-inquiry', 'conflict-check', 'consultation-scheduling', 'engagement-letter', 'retainer-collection', 'matter-creation', 'attorney-assignment', 'client-onboarding'],
      entities: ['client', 'matter', 'conflict-check', 'engagement-letter', 'retainer', 'time-entry'],
      triggers: ['new-inquiry', 'conflict-cleared', 'engagement-signed', 'retainer-received'],
    },
    {
      workflowId: 'research-to-brief',
      name: 'Research to Brief',
      description: 'Attorney identifies legal research need, conducts research using databases, drafts brief or memo, undergoes review, and files or delivers.',
      steps: ['research-request', 'database-search', 'source-review', 'brief-drafting', 'peer-review', 'partner-approval', 'finalization', 'filing-or-delivery'],
      entities: ['matter', 'research-request', 'brief', 'document', 'citation', 'filing'],
      triggers: ['research-needed', 'draft-complete', 'review-approved', 'filing-deadline'],
    },
    {
      workflowId: 'filing-to-court',
      name: 'Filing to Court',
      description: 'Document prepared, reviewed for compliance, e-filed with court, confirmation received, and served to opposing parties.',
      steps: ['document-preparation', 'compliance-check', 'e-filing', 'court-confirmation', 'service-of-process', 'proof-of-service-filed', 'calendar-update'],
      entities: ['document', 'court-case', 'filing', 'proof-of-service', 'calendar-event'],
      triggers: ['filing-ready', 'deadline-approaching', 'filing-accepted', 'service-complete'],
    },
    {
      workflowId: 'billing-to-collection',
      name: 'Billing to Collection',
      description: 'Time entries consolidated, invoice generated, sent to client, payment processed or follow-up initiated for overdue accounts.',
      steps: ['time-entry-review', 'invoice-generation', 'invoice-sent', 'payment-received', 'payment-applied', 'trust-account-reconciliation', 'overdue-follow-up', 'collection-action'],
      entities: ['time-entry', 'invoice', 'payment', 'trust-account', 'matter'],
      triggers: ['billing-cycle', 'invoice-approved', 'payment-due', 'payment-overdue', 'payment-received'],
    },
  ];
}

function stateMachinesForLegalServices(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Case',
      states: ['intake', 'open', 'active', 'pending-court', 'settlement-negotiation', 'closed-won', 'closed-lost', 'closed-settled', 'archived'],
      transitions: { intake: ['open'], open: ['active'], active: ['pending-court'], 'pending-court': ['closed-won'], 'settlement-negotiation': ['closed-settled'], 'closed-won': ['archived'], 'closed-lost': ['archived'], 'closed-settled': ['archived'] },
      initialState: 'intake',
      terminalStates: ['archived'],
    },
    {
      entityName: 'Document',
      states: ['draft', 'in-review', 'approved', 'filed', 'served', 'executed', 'archived'],
      transitions: { draft: ['in-review', 'approved'], 'in-review': ['approved', 'draft'], approved: ['filed'], filed: ['served'], served: ['executed'], executed: ['archived'] },
      initialState: 'draft',
      terminalStates: ['archived'],
    },
    {
      entityName: 'Invoice',
      states: ['draft', 'sent', 'viewed', 'partial-payment', 'paid', 'overdue', 'disputed', 'written-off', 'in-collections'],
      transitions: { draft: ['sent'], sent: ['viewed'], viewed: ['paid', 'overdue'], overdue: ['paid', 'disputed'], disputed: ['paid'] },
      initialState: 'draft',
      terminalStates: ['archived'],
    },
  ];
}

function edgeCasesForLegalServices(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Conflict of Interest Discovery',
      description: 'After accepting a new client, a conflict of interest is discovered with an existing client — same adverse party, shared confidential information, or personal relationship.',
      handling: 'Automated conflict check runs against all firm clients and matters at intake using name, company, and subject matter matching. If a potential conflict surfaces after acceptance, the matter is immediately flagged and the responsible attorney notified. No work commences on the conflicted matter until cleared.',
      recovery: 'Conflict cleared by informed consent from both clients (if permitted by bar rules) or matter declined with refund of any retainer. Conflict record added to firm-wide conflict database. If conflict cannot be waived, matter referred to outside counsel with client consent.',
    },
    {
      scenario: 'Statute of Limitations Deadline',
      description: 'A critical filing deadline approaches or has passed without action, potentially barring the client\'s claim permanently.',
      handling: 'Calendar system flags all deadlines with escalating alerts: 30 days (warning), 14 days (urgent), 7 days (critical), 1 day (emergency). If deadline is missed, immediate escalation to senior partner. Automatic "tolling" documentation initiated where applicable.',
      recovery: 'Emergency motion for extension filed if jurisdiction permits. Client notified immediately of the situation and potential consequences. Malpractice insurance notified if applicable. Post-mortem analysis to prevent recurrence — calendar review process audited.',
    },
    {
      scenario: 'Discovery Dispute / Document Production Failure',
      description: 'Opposing party objects to discovery requests, or the firm fails to produce required documents within the court-ordered deadline.',
      handling: 'Discovery deadlines tracked with same urgency as SOL. Document review status monitored per matter. If dispute arises, meet-and-confer process initiated automatically with opposing counsel logged. If production deadline missed, immediate notification to supervising attorney.',
      recovery: 'Motion to compel filed if opposing party fails to respond. Protective order requested if production would violate privilege. Firm\'s own production failure: immediate corrective production, notification to court and opposing counsel, sanctions risk assessment, and malpractice insurance review.',
    },
    {
      scenario: 'Client Trust Account (IOLTA) Violation',
      description: 'Client funds in the trust (IOLTA) account are accidentally commingled with firm operating funds, or a withdrawal is made in error.',
      handling: 'Trust account reconciliation runs daily. Any discrepancy triggers immediate alert to billing specialist and managing partner. Transaction rollback attempted if within same banking day. If commingling confirmed, all affected client accounts audited.',
      recovery: 'Affected funds restored from firm operating account. Corrective entries made in trust ledger. State bar notified if required by jurisdiction rules. Accounting firm engaged for independent audit. New dual-control procedures implemented for trust account transactions.',
    },
    {
      scenario: 'Client Confidentiality Breach',
      description: 'Case documents, client information, or privileged communications are inadvertently disclosed to unauthorized parties — wrong recipient email, lost device, or cloud misconfiguration.',
      handling: 'Immediate incident response: access to affected systems restricted, communication channels audited. Breach notification procedures initiated per jurisdiction requirements and firm policy. Client notified within required timeframe (typically per state bar rules).',
      recovery: 'Forensic review of what was disclosed and to whom. Corrective actions: email recall attempted, access revoked, data scrubbed if possible. Clients offered support (credit monitoring if PII involved). Firm updates security procedures. Mandatory security training for affected staff. Bar notification if required.',
    },
  ];
}

function integrationsForLegalServices(): DomainPack['integrations'] {
  return [
    {
      name: 'Court Filing APIs',
      type: 'api',
      description: 'Electronic filing integration with federal, state, and local court systems for document submission and retrieval.',
      required: true,
      configuration: 'REST/XML API integration per jurisdiction. E-filing standards (e.g., NCSC/EFM). Automated form validation before submission. Filing confirmation and docket number retrieval. Integration with court calendaring for deadline tracking.',
    },
    {
      name: 'Legal Research Databases',
      type: 'data',
      description: 'Integration with Westlaw, LexisNexis, or other legal research platforms for case law, statutes, and secondary sources.',
      required: false,
      configuration: 'API or proxy authentication with research provider. Citation extraction and linking. Research history tracking per matter. Cost tracking per research session. Custom search templates per practice area.',
    },
    {
      name: 'E-Signature Platform',
      type: 'service',
      description: 'DocuSign, Adobe Sign, or equivalent for electronic signature on engagement letters, contracts, and court filings.',
      required: false,
      configuration: 'OAuth integration with e-signature provider. Template-based signing workflows. Signature status tracking. Audit trail with IP, timestamp, and signer identity. Retry logic for unsigned documents.',
    },
    {
      name: 'Accounting Software',
      type: 'service',
      description: 'QuickBooks, NetSuite, or similar for financial management, trust accounting, and billing synchronization.',
      required: false,
      configuration: 'Bi-directional sync: invoices from legal platform to accounting, trust account balances reconciled. Chart of accounts mapping per jurisdiction IOLTA requirements. Trust transaction audit trail export.',
    },
    {
      name: 'Payment Processing',
      type: 'financial',
      description: 'Client payment processing for invoices, retainers, and trust account funding.',
      required: true,
      configuration: 'Stripe Connect or similar for client payments. Trust account escrow for retainers. Payment plans for large invoices. Automated payment reminders. Credit card on file with client authorization. Trust-to-operating transfers with dual approval.',
    },
    {
      name: 'Calendar & Scheduling',
      type: 'productivity',
      description: 'Court deadline tracking, deposition scheduling, and calendar integration with Outlook or Google Calendar.',
      required: false,
      configuration: 'Court rule-based deadline calculation (e.g., service + 30 days). Deposition scheduling with all-party coordination. Outlook/Google Calendar sync. SMS and email reminders for critical dates. Holiday and court-closure calendar per jurisdiction.',
    },
  ];
}

function technicalArchitectureForLegalServices(): TechnicalArchitectureDef {
  return {
    patterns: ['Document versioning with immutable audit trail', 'Role-based access control with privilege isolation', 'Event sourcing for matter and case history', 'Secure document rendering with redaction support', 'Workflow automation for matter lifecycle'],
    infrastructure: ['PostgreSQL for structured matter, billing, and client data', 'S3-compatible storage for documents with encryption at rest', 'Elasticsearch for full-text legal document search', 'Redis for session management and document caching', 'Kafka for event streaming (document changes, billing events)', 'Vault for secrets management and encryption keys'],
    dataFlow: 'Client submits inquiry → matter created with conflict check → attorney assigned → documents created and versioned in S3 with metadata in PostgreSQL → time entries recorded → billing cycle generates invoices → payment processed → documents filed with court via API → calendar deadlines synced. All document access and modifications logged in immutable audit trail.',
    scalability: 'Document storage scales via S3-compatible object storage with lifecycle policies. Search scales with Elasticsearch cluster. Matter and billing queries handled via read replicas. Court filing APIs rate-limited with retry queue. Document rendering offloaded to separate worker pool.',
  };
}

function regulatoryComplianceForLegalServices(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'Attorney-Client Privilege',
      jurisdiction: 'United States (all states)',
      requirements: ['All case communications encrypted and access-controlled', 'Privileged documents marked and protected from discovery in firm\'s own litigation', 'Audit trail of all document access for privilege log', 'Client data segregation per matter'],
      impact: 'Platform must implement strict access controls, encrypted storage, and comprehensive audit logging to maintain privilege. Any breach of privilege could result in sanctions and malpractice liability.',
    },
    {
      regulation: 'IOLTA Trust Accounting Rules',
      jurisdiction: 'Per state bar',
      requirements: ['Client funds segregated from firm operating funds', 'Monthly trust account reconciliation', 'Three-way reconciliation (bank, ledger, individual client balances)', 'Prompt notification and remittance of earned funds', 'Annual audit report submission'],
      impact: 'Trust account module must enforce strict transaction rules: deposits, withdrawals, and transfers with dual authorization. Reconciliation reports generated monthly. Audit-ready export of all trust transactions.',
    },
    {
      regulation: 'Bar Association Advertising & Solicitation Rules',
      jurisdiction: 'Per state bar',
      requirements: ['Attorney advertising disclosures', 'No false or misleading claims', 'Referral fee disclosures', 'Specialization claim substantiation'],
      impact: 'Marketplace listings and attorney profiles must comply with state-specific advertising rules. Automated compliance checks on attorney claims and certifications.',
    },
    {
      regulation: 'E-Discovery Rules (FRCP / State Equivalents)',
      jurisdiction: 'Federal / State Courts',
      requirements: ['Document preservation (litigation hold)', 'Metadata preservation during export', 'Native format production capability', 'Privilege log generation', 'Defensible search methodology'],
      impact: 'Document management must preserve metadata, support litigation holds, and enable defensible document production. Search algorithms and processing steps logged for court scrutiny.',
    },
    {
      regulation: 'Data Privacy (GDPR / State Privacy Laws)',
      jurisdiction: 'EU / California / Other',
      requirements: ['Client data right to access and deletion', 'Data processing consent records', 'Data retention schedules', 'Breach notification procedures', 'Cross-border transfer restrictions'],
      impact: 'Client data management must support data subject requests (DSR), consent tracking, and retention policies. Breach notification workflows automated.',
    },
  ];
}

function businessRulesForLegalServices(): BusinessRulesSpec {
  return {
    billing: [
      'Billable hours must be entered within 48 hours of work performed. Late entries flagged for partner review.',
      'Minimum billable increment is 0.1 hours (6 minutes). Entries below 0.05 hours rounded up.',
      'Invoice generated on the last business day of each month. Attorney review required before sending to client.',
      'Trust account retainer minimums set per matter type: $5,000 standard, $10,000 complex litigation, $2,000 consultation-only.',
      'Overdue invoices: gentle reminder at 15 days, firm notice at 30 days, suspension of services at 60 days, referral to collections at 90 days.',
      'Write-offs require partner approval above $500. Below $500, managing partner notification sufficient.',
    ],
    caseManagement: [
      'Conflict check required before any new matter creation. Check runs against all firm clients, matters, and adverse parties.',
      'Statute of limitations deadline entered at matter creation with automatic escalation at 30, 14, and 7 days before deadline.',
      'Client matter number (CMN) generated sequentially per year: e.g., 2024-001, 2024-002.',
      'Documents filed under seal require enhanced access controls and privilege marking.',
      'Matter cannot be closed until all invoices are paid or written off, all documents archived, and trust balance reconciled.',
    ],
    documentManagement: [
      'Documents stored with version control. Each edit creates new version; original preserved for audit.',
      'Privileged documents tagged with privilege code and excluded from standard search results for non-privileged users.',
      'Document retention per jurisdiction rules: client files retained for minimum 7 years after matter closes (varies by state).',
      'E-signature required on all engagement letters and fee agreements before work commences.',
      'Large file uploads (>100MB) processed asynchronously with email notification on completion.',
    ],
    trustAccounting: [
      'Client trust funds must be deposited within 3 business days of receipt.',
      'Earned funds transferred from trust to operating account only upon invoice payment by client.',
      'Monthly three-way reconciliation: bank statement vs. trust ledger vs. individual client balances.',
      'Negative trust balance for any client triggers immediate alert to managing partner.',
      'Interest on trust accounts (IOLTA) remitted to state bar foundation per jurisdiction rules.',
    ],
    courtFiling: [
      'Filing deadlines calculated per court rules: service date + response period + any extensions.',
      'Documents must pass automated format validation before submission to court e-filing system.',
      'Filing fees calculated per court fee schedule and added to invoice automatically.',
      'Proof of service filed within required timeframe (typically 10 days after service).',
    ],
  };
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const LEGAL_SERVICES_PACK: DomainPack = {
  domain: 'legalServices',
  name: 'Legal Practice Management',
  description: 'Complete legal practice management platform — from client intake to case resolution. Covers matter management, document drafting and versioning, time tracking and billing, court e-filing, legal research integration, trust accounting, and regulatory compliance for bar association rules, client confidentiality, and e-discovery.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Case & Matter Management', 'Document Management', 'Billing & Accounting', 'Legal Research', 'Court Filing', 'Client Portal'],
    features: [
      'matter-management',
      'document-drafting',
      'version-control',
      'time-tracking',
      'legal-billing',
      'trust-accounting',
      'court-e-filing',
      'conflict-check',
      'legal-research',
      'client-portal',
      'e-signature',
      'calendar-deadlines',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['document-delivery', 'court-e-filing', 'secure-client-portal', 'process-service-coordination'],
    features: [
      'secure-document-transmission',
      'e-filing-confirmation',
      'service-of-process-tracking',
      'redaction-support',
      'native-format-export',
      'litigation-hold',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'client-portal',
      'case-status-tracking',
      'document-access',
      'secure-messaging',
      'invoice-payment',
      'appointment-scheduling',
      'document-upload',
      'case-timeline',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'matter-management',
      'time-tracking',
      'billing-engine',
      'trust-accounting',
      'conflict-checking',
      'document-management',
      'calendar-management',
      'reporting',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'professional-branding',
      'secure-client-communication',
      'case-progress-visualization',
      'document-collaboration',
      'transparent-billing',
      'legal-research-assistant',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'attorney-profiles',
      'practice-area-pages',
      'blog-insights',
      'contact',
      'client-portal-login',
    ],
    customer: [
      'client-dashboard',
      'matter-view',
      'document-access',
      'invoice-center',
      'secure-messaging',
      'appointment-scheduler',
    ],
    admin: [
      'firm-dashboard',
      'user-management',
      'billing-configuration',
      'template-management',
      'compliance-reports',
      'trust-account-management',
    ],
    staff: [
      'matter-management',
      'document-editor',
      'time-tracker',
      'billing-workspace',
      'calendar-view',
      'legal-research-tool',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForLegalServices(),

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Document-centric layout with split-pane editor and reference panel',
      'Matter-focused navigation with case hierarchy sidebar',
      'Billing dashboard with time entry grid and invoice preview',
      'Client portal with clean, non-legal-jargon interface',
      'Responsive design for court appearances on tablets',
      'Dark mode option for long document review sessions',
    ],
    color: [
      'Professional navy (#1a365d) and charcoal (#2d3748) as primary',
      'Gold accent (#c9a84c) for premium and authority cues',
      'White and light gray for document readability',
      'Red (#e53e3e) for urgent deadlines and alerts',
      'Green (#38a169) for completed matters and positive status',
      'Low-saturation palette to reduce eye strain during long document review',
    ],
    typography: [
      'Serif font (Georgia or Merriweather) for legal documents and briefs',
      'Sans-serif (Inter) for UI elements and dashboard',
      'Monospace for citations, legal citations, and billing codes',
      'Generous line height (1.7) for document readability',
      'Clear hierarchy: statute numbers bold, section headers prominent',
      'Print-optimized styles for document export and filing',
    ],
    interaction: [
      'Keyboard shortcuts for common legal actions (Ctrl+N new matter, Ctrl+S save document)',
      'Drag-and-drop document upload with progress indicator',
      'Inline commenting on documents with @mentions for team collaboration',
      'Quick-add time entries from calendar events or matter view',
      'Auto-save with version history for all document edits',
      'Citation linking: click citation to open referenced case in research panel',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance for all interfaces',
      'Screen reader support for document structure and case navigation',
      'Keyboard navigation for all functions (no mouse required for core workflows)',
      'High contrast mode for courtroom tablet use',
      'Document text resizing without layout breakage',
      'Multilingual interface support for diverse client populations',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-tier authentication: Attorney (licensed, bar-verified), Paralegal (supervised access), Client (own matters only), Admin (firm configuration), Billing (financial data access). SSO via SAML/OIDC for firm integration. MFA mandatory for all attorney and admin accounts. Session timeout 30 minutes for high-sensitivity actions.',
    data: 'Client data includes case documents (privileged), financial records (trust accounts), personal information, and case strategy notes. End-to-end encryption for document storage and transmission. Privilege marking system with access control. Data retention per jurisdiction rules (minimum 7 years post-matter). Right-to-deletion workflows for GDPR compliance.',
    compliance: ['Attorney-client privilege protection', 'IOLTA trust accounting compliance', 'Bar association advertising rules', 'E-discovery compliance (FRCP)', 'GDPR and state privacy laws', 'Court-specific filing requirements'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Conflict check algorithm: name matching across all firm clients and adverse parties',
      'Statute of limitations deadline calculation per jurisdiction rules',
      'Invoice generation with correct time entry aggregation and billing rates',
      'Trust account three-way reconciliation logic',
      'Document version numbering and change tracking',
      'Court filing format validation per jurisdiction',
      'E-signature workflow state transitions',
      'Client matter number sequential generation',
    ],
    integration: [
      'Court e-filing API submission → confirmation → docket entry',
      'Time entry → invoice generation → payment processing → trust accounting',
      'Document creation → version control → privilege marking → client portal access',
      'Conflict check → new matter creation → attorney assignment → engagement letter',
      'Legal research API → citation insertion → document cross-reference',
      'Calendar deadline → reminder notifications → escalation on overdue',
    ],
    e2e: [
      'Client inquiry → conflict check → consultation → engagement letter → retainer → matter opened → documents drafted → filed → billed → closed',
      'Attorney time tracking → partner review → invoice → client payment → trust reconciliation → matter closure',
      'Discovery request → document review → privilege log → production to opposing counsel → filing with court',
      'Flat-fee marketplace: client selects service → payment → attorney notified → document delivered → review → completion',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForLegalServices(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForLegalServices(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForLegalServices(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForLegalServices(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForLegalServices(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForLegalServices(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForLegalServices(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForLegalServices(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForLegalServices(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const LEGAL_SERVICES_DOMAIN: DomainModel = {
  id: LEGAL_SERVICES_PACK.domain,
  domain: LEGAL_SERVICES_PACK.domain,
  name: LEGAL_SERVICES_PACK.name,
  label: LEGAL_SERVICES_PACK.name,
  category: 'legaltech',
  description: LEGAL_SERVICES_PACK.description,
  userRoles: [
    { id: 'attorney', name: 'Attorney', typicalFeatures: ['case-management', 'document-drafting', 'time-tracking', 'billing', 'legal-research'], permissions: ['manage-cases', 'create-documents', 'bill-hours', 'file-court-documents', 'access-research-db'] },
    { id: 'paralegal', name: 'Paralegal', typicalFeatures: ['document-management', 'legal-research', 'time-tracking', 'case-organization'], permissions: ['create-documents', 'edit-cases', 'conduct-research', 'track-time'] },
    { id: 'client', name: 'Client', typicalFeatures: ['client-portal', 'case-status', 'document-access', 'invoice-payment'], permissions: ['view-own-cases', 'upload-documents', 'view-invoices', 'message-attorney'] },
    { id: 'admin', name: 'Firm Administrator', typicalFeatures: ['user-management', 'billing-configuration', 'reporting', 'compliance-dashboard'], permissions: ['manage-users', 'configure-billing', 'generate-reports', 'manage-templates'] },
    { id: 'billing', name: 'Billing Specialist', typicalFeatures: ['invoice-generation', 'payment-processing', 'trust-accounting', 'billing-reports'], permissions: ['generate-invoices', 'process-payments', 'manage-trust-accounts', 'view-billing-data'] },
  ],
  role: 'attorney',
  standardFeatures: [],
  businessModels: [
    { modelType: 'hourly-billing-saas', revenueStreams: ['hourly-billing', 'subscription-fees'], costStructure: ['engineering', 'research-database-licensing', 'security-compliance', 'support'], pricingStrategy: ['hourly-rates', 'per-user-subscription', 'firm-tiered-pricing'] },
    { modelType: 'flat-fee-marketplace', revenueStreams: ['marketplace-commission', 'flat-fee-services'], costStructure: ['platform-engineering', 'attorney-network', 'marketing', 'dispute-resolution'], pricingStrategy: ['percentage-commission', 'flat-fee-listings', 'subscription'] },
    { modelType: 'compliance-subscription', revenueStreams: ['subscription-fees', 'document-automation'], costStructure: ['template-development', 'compliance-monitoring', 'cloud-infrastructure', 'updates'], pricingStrategy: ['monthly-subscription', 'per-user-overage', 'template-packs'] },
  ],
  technicalPatterns: [
    { category: 'document', name: 'Document Versioning System', description: 'Immutable document versioning with full audit trail of every change', rationale: 'Legal documents require definitive version history and change tracking for privilege and compliance' },
    { category: 'security', name: 'Privilege Isolation', description: 'Strict access controls with attorney-client privilege protection at the data layer', rationale: 'Breach of privilege has severe legal and professional consequences' },
    { category: 'workflow', name: 'Matter Lifecycle Automation', description: 'Automated matter progression with deadline tracking and task generation', rationale: 'Complex legal matters require consistent process adherence and deadline management' },
    { category: 'integration', name: 'Court E-Filing Integration', description: 'Direct integration with court filing systems across jurisdictions', rationale: 'Electronic filing is increasingly mandatory and reduces filing errors and delays' },
  ],
  operationalLifecycle: [
    { id: 'intake', name: 'Intake', description: 'Client inquiry, conflict check, consultation, and engagement' },
    { id: 'research', name: 'Research', description: 'Legal research, analysis, and strategy development' },
    { id: 'drafting', name: 'Drafting', description: 'Document creation, review, and revision' },
    { id: 'filing', name: 'Filing', description: 'Court filing, service of process, and docket management' },
    { id: 'resolution', name: 'Resolution', description: 'Settlement, judgment, or closure with final billing and archiving' },
  ],
  designPrinciples: [
    { name: 'Document-First Design', description: 'Interfaces centered around document viewing, editing, and management with professional typography' },
    { name: 'Privilege by Design', description: 'Security and access controls designed from the ground up to protect attorney-client privilege' },
    { name: 'Workflow Automation', description: 'Routine legal processes automated to reduce attorney time on administrative tasks' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Attorney identity verification', description: 'Bar license verification and continuous status monitoring', severity: 'critical' },
    { category: 'data', name: 'Privileged document protection', description: 'Encryption and access controls for attorney-client privileged documents', severity: 'critical' },
    { category: 'compliance', name: 'IOLTA trust accounting security', description: 'Dual-control trust account transactions with audit trail', severity: 'critical' },
    { category: 'audit', name: 'Immutable audit trail', description: 'All document access and modifications logged with tamper-evident records', severity: 'high' },
  ],
  regulations: [
    { name: 'Attorney-Client Privilege', requirements: ['Privileged communication protection', 'Audit trail for document access', 'Client data segregation'] },
    { name: 'IOLTA Trust Accounting', requirements: ['Funds segregation', 'Monthly reconciliation', 'State bar reporting', 'Interest remittance'] },
    { name: 'Bar Advertising Rules', requirements: ['Advertising disclosures', 'No misleading claims', 'Referral fee transparency'] },
    { name: 'E-Discovery (FRCP)', requirements: ['Litigation holds', 'Metadata preservation', 'Native format production', 'Privilege logs'] },
    { name: 'Data Privacy', requirements: ['Client data rights', 'Consent management', 'Breach notification', 'Retention schedules'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Conflict check algorithm', description: 'Name matching across all clients and adverse parties', priority: 'critical' },
    { category: 'unit', name: 'SOL deadline calculation', description: 'Statute of limitations per jurisdiction', priority: 'critical' },
    { category: 'integration', name: 'Court e-filing integration', description: 'Document submission and confirmation', priority: 'high' },
    { category: 'e2e', name: 'Intake to engagement', description: 'Full client onboarding through matter creation', priority: 'high' },
  ],
  workflows: [
    { id: 'intake-to-engagement', name: 'Intake to Engagement', steps: ['inquiry', 'conflict-check', 'consultation', 'engagement-letter', 'retainer', 'matter-creation'], entities: ['client', 'matter', 'conflict-check', 'engagement-letter'] },
    { id: 'research-to-brief', name: 'Research to Brief', steps: ['research-request', 'database-search', 'brief-drafting', 'review', 'filing-or-delivery'], entities: ['matter', 'research-request', 'brief', 'document'] },
    { id: 'filing-to-court', name: 'Filing to Court', steps: ['document-prep', 'compliance-check', 'e-filing', 'confirmation', 'service-of-process'], entities: ['document', 'court-case', 'filing', 'proof-of-service'] },
    { id: 'billing-to-collection', name: 'Billing to Collection', steps: ['time-entry-review', 'invoice-generation', 'payment', 'trust-reconciliation', 'overdue-follow-up'], entities: ['time-entry', 'invoice', 'payment', 'trust-account'] },
  ],
  entities: [
    { name: 'Matter', description: 'Legal matter or case with client, attorney, deadlines, and associated documents', invariants: ['conflict check must pass before creation', 'SOL deadline entered at creation', 'cannot close with outstanding trust balance'] },
    { name: 'Document', description: 'Legal document with version control, privilege status, and filing tracking', invariants: ['version immutable once filed', 'privilege status cannot be downgraded', 'final version always accessible'] },
    { name: 'Invoice', description: 'Billing invoice with time entries, expenses, and payment tracking', invariants: ['all billable entries must reference a matter', 'trust funds not billed until earned', 'write-offs require approval'] },
  ],
  invariants: ['conflict check passes before matter creation', 'SOL deadline tracked from matter creation', 'trust account balance reconciles monthly', 'all documents have version history', 'privileged documents access-controlled'],
  constraints: ['minimum billable increment 0.1 hours', 'time entries within 48 hours of work', 'retainer minimums per matter type', 'matter closure requires zero trust balance', 'document retention 7+ years per jurisdiction'],
  financialFlows: [
    { name: 'hourly-billing', direction: 'in', trigger: 'invoice-paid' },
    { name: 'flat-fee-payment', direction: 'in', trigger: 'engagement-signed' },
    { name: 'subscription-revenue', direction: 'in', trigger: 'monthly-subscription' },
    { name: 'trust-deposit', direction: 'in', trigger: 'client-retainer' },
    { name: 'trust-disbursement', direction: 'out', trigger: 'earned-funds-transferred' },
    { name: 'court-filing-fees', direction: 'out', trigger: 'filing-submitted' },
  ],
  successMetrics: ['matter-open-to-close-time', 'billable-hour-utilization', 'invoice-payment-rate', 'trust-account-reconciliation-accuracy', 'deadline-compliance-rate', 'client-satisfaction-score', 'document-throughput'],
  analytics: { tracked: ['billable-hours', 'matter-pipeline', 'deadline-risk', 'client-acquisition', 'revenue-per-attorney', 'document-activity'], dashboards: ['firm-overview', 'attorney-productivity', 'billing-summary', 'deadline-calendar', 'trust-account'] },
  securityRequirements: ['bar-license-verification', 'multi-factor-auth', 'document-encryption', 'privilege-isolation', 'immutable-audit-log', 'trust-account-dual-control'],
  regulatory: [
    { regulation: 'Attorney-Client Privilege', applies: true, notes: 'All case communications protected and access-controlled' },
    { regulation: 'IOLTA Trust Accounting', applies: true, notes: 'Client funds segregated and reconciled per state rules' },
    { regulation: 'Bar Association Rules', applies: true, notes: 'Advertising, solicitation, and fee rules per jurisdiction' },
    { regulation: 'E-Discovery Rules', applies: true, notes: 'FRCP compliance for document production' },
    { regulation: 'Data Privacy', applies: true, notes: 'Client data rights and breach notification' },
  ],
  businessModelVariants: [
    { modelType: 'hourly-billing-saas', description: 'Traditional law firm SaaS platform for time tracking, billing, and matter management', pricingExamples: ['$50/user/month solo', '$99/user/month firm', '$200/month enterprise'] },
    { modelType: 'flat-fee-legal-marketplace', description: 'Online marketplace for pre-priced legal services', pricingExamples: ['$199 contract review', '$499 incorporation', '15% platform commission'] },
    { modelType: 'subscription-compliance-tool', description: 'Ongoing legal compliance monitoring and document automation', pricingExamples: ['$99/month compliance', '$49/month templates', '$299/month premium'] },
  ],
  revenueStreams: [
    { name: 'Hourly Billing', description: 'Attorney time billed at hourly rates', pricingModel: 'hourly-rate', examples: ['$350/hour senior', '$225/hour associate'] },
    { name: 'Flat-Fee Commission', description: 'Platform commission on pre-priced legal services', pricingModel: 'percentage', examples: ['15% commission', '$29/month listing'] },
    { name: 'SaaS Subscription', description: 'Practice management platform subscription', pricingModel: 'per-user-per-month', examples: ['$50/user/month', '$99/user/month firm'] },
    { name: 'Court Filing Fees', description: 'Processing fees for electronic court filing', pricingModel: 'per-filing', examples: ['$5 standard', '$15 expedited'] },
    { name: 'Document Automation', description: 'Template licensing and document generation', pricingModel: 'subscription-plus-per-document', examples: ['$49/month templates', '$2 per document'] },
  ],
  userRoleMatrix: [
    { roleId: 'attorney', roleName: 'Attorney', description: 'Licensed legal professional managing cases and billing clients', permissions: ['manage-cases', 'create-documents', 'bill-hours', 'file-court-documents'], features: ['case-management', 'document-drafting', 'time-tracking', 'billing'], constraints: ['bar license verified', 'conflict check required', 'client-attorney privilege applies'] },
    { roleId: 'paralegal', roleName: 'Paralegal', description: 'Legal support professional assisting attorneys', permissions: ['create-documents', 'edit-cases', 'conduct-research', 'track-time'], features: ['document-management', 'legal-research', 'time-tracking'], constraints: ['supervised by attorney', 'cannot give legal advice'] },
    { roleId: 'client', roleName: 'Client', description: 'Individual or business receiving legal services', permissions: ['view-own-cases', 'upload-documents', 'view-invoices', 'message-attorney'], features: ['client-portal', 'case-status', 'document-access'], constraints: ['own cases only', 'cannot modify attorney work'] },
    { roleId: 'admin', roleName: 'Firm Administrator', description: 'Administrative user managing firm settings and compliance', permissions: ['manage-users', 'configure-billing', 'generate-reports', 'manage-templates'], features: ['user-management', 'billing-config', 'reporting'], constraints: ['MFA required', 'all changes logged'] },
    { roleId: 'billing', roleName: 'Billing Specialist', description: 'Financial specialist managing invoicing and trust accounting', permissions: ['generate-invoices', 'process-payments', 'manage-trust-accounts'], features: ['invoice-generation', 'payment-processing', 'trust-accounting'], constraints: ['IOLTA compliance', 'dual-approval for trust transfers'] },
  ],
  operationalWorkflows: [
    { workflowId: 'intake-to-engagement', name: 'Intake to Engagement', description: 'Client inquiry through matter creation', steps: ['inquiry', 'conflict-check', 'consultation', 'engagement-letter', 'retainer', 'matter-creation'], entities: ['client', 'matter', 'conflict-check'], triggers: ['new-inquiry', 'conflict-cleared', 'engagement-signed'] },
    { workflowId: 'research-to-brief', name: 'Research to Brief', description: 'Legal research through brief drafting and filing', steps: ['research-request', 'database-search', 'brief-drafting', 'review', 'finalization', 'filing'], entities: ['matter', 'research-request', 'brief', 'document'], triggers: ['research-needed', 'draft-complete', 'review-approved'] },
    { workflowId: 'filing-to-court', name: 'Filing to Court', description: 'Document preparation through court filing and service', steps: ['document-prep', 'compliance-check', 'e-filing', 'confirmation', 'service-of-process'], entities: ['document', 'court-case', 'filing'], triggers: ['filing-ready', 'deadline-approaching', 'filing-accepted'] },
    { workflowId: 'billing-to-collection', name: 'Billing to Collection', description: 'Time entry through payment collection', steps: ['time-entry-review', 'invoice-generation', 'payment', 'trust-reconciliation', 'overdue-follow-up'], entities: ['time-entry', 'invoice', 'payment', 'trust-account'], triggers: ['billing-cycle', 'payment-due', 'payment-overdue'] },
  ],
  stateMachines: [
    { entityName: 'Case', states: ['intake', 'open', 'active', 'pending-court', 'settlement-negotiation', 'closed-won', 'closed-lost', 'closed-settled', 'archived'], transitions: { intake: 'open', open: 'active', active: 'pending-court', 'pending-court': 'closed-won', 'settlement-negotiation': 'closed-settled' }, initialState: 'intake', terminalStates: ['archived'] },
    { entityName: 'Document', states: ['draft', 'in-review', 'approved', 'filed', 'served', 'executed', 'archived'], transitions: { draft: 'in-review', 'in-review': 'approved', approved: 'filed', filed: 'served', served: 'executed' }, initialState: 'draft', terminalStates: ['archived'] },
    { entityName: 'Invoice', states: ['draft', 'sent', 'viewed', 'partial-payment', 'paid', 'overdue', 'disputed', 'written-off'], transitions: { draft: 'sent', sent: 'viewed', viewed: 'paid', viewed: 'overdue', overdue: 'paid', overdue: 'disputed' }, initialState: 'draft', terminalStates: ['paid', 'written-off'] },
  ],
  edgeCases: [
    { scenario: 'Conflict of Interest', description: 'Conflict discovered after case acceptance', handling: 'Automated conflict check at intake; matter flagged if conflict found post-acceptance', recovery: 'Informed consent or matter declined with retainer refund' },
    { scenario: 'Statute of Limitations Deadline', description: 'Critical filing deadline approaching or missed', handling: 'Calendar alerts at 30/14/7/1 day. Emergency escalation on missed deadline', recovery: 'Extension motion filed; client notified; malpractice insurance contacted if applicable' },
    { scenario: 'Discovery Dispute', description: 'Opposing party objects to discovery or firm fails to produce', handling: 'Meet-and-conquer initiated; production tracked with deadline alerts', recovery: 'Motion to compel or protective order; corrective production with court notification' },
    { scenario: 'Trust Account Violation', description: 'Client funds commingled or misappropriated', handling: 'Daily reconciliation with discrepancy alerts; immediate investigation', recovery: 'Funds restored; state bar notified; independent audit; dual-control implemented' },
  ],
  integrations: [
    { name: 'Court Filing APIs', type: 'api', description: 'Electronic filing with federal, state, and local court systems', required: true, configuration: 'REST/XML per jurisdiction. E-filing standards. Automated validation. Confirmation retrieval.' },
    { name: 'Legal Research Databases', type: 'data', description: 'Westlaw, LexisNexis for case law and statutes', required: false, configuration: 'API or proxy auth. Citation extraction. Research history tracking. Cost tracking per session.' },
    { name: 'E-Signature Platform', type: 'service', description: 'DocuSign for engagement letters and contracts', required: false, configuration: 'OAuth integration. Template-based workflows. Audit trail with IP and timestamp.' },
    { name: 'Accounting Software', type: 'service', description: 'QuickBooks for financial management and trust accounting', required: false, configuration: 'Bi-directional sync. IOLTA-compliant chart of accounts. Trust reconciliation export.' },
    { name: 'Payment Processing', type: 'financial', description: 'Client payments for invoices and retainers', required: true, configuration: 'Stripe Connect. Trust escrow for retainers. Payment plans. Automated reminders.' },
    { name: 'Calendar & Scheduling', type: 'productivity', description: 'Court deadlines, deposition scheduling', required: false, configuration: 'Court rule-based deadline calculation. Outlook/Google sync. SMS/email reminders.' },
  ],
  technicalArchitecture: {
    patterns: ['Document versioning with immutable audit trail', 'Role-based access with privilege isolation', 'Event sourcing for matter history', 'Secure document rendering with redaction'],
    infrastructure: ['PostgreSQL for structured data', 'S3-compatible encrypted document storage', 'Elasticsearch for full-text search', 'Redis for sessions and caching', 'Vault for secrets management'],
    dataFlow: 'Client inquiry → matter creation with conflict check → attorney assignment → document drafting with versioning → time tracking → billing → payment → trust reconciliation → filing → matter closure.',
    scalability: 'Document storage via S3 with lifecycle policies. Search via Elasticsearch cluster. Read replicas for matter/billing queries. Document rendering offloaded to worker pool.',
  },
  regulatoryCompliance: [
    { regulation: 'Attorney-Client Privilege', jurisdiction: 'United States', requirements: ['Encrypted access-controlled storage', 'Privileged document marking', 'Audit trail for access'], impact: 'Strict access controls and comprehensive logging mandatory' },
    { regulation: 'IOLTA Trust Accounting', jurisdiction: 'Per state bar', requirements: ['Funds segregation', 'Monthly reconciliation', 'State bar reporting'], impact: 'Dual-control trust transactions with audit-ready reporting' },
    { regulation: 'E-Discovery Rules', jurisdiction: 'Federal/State Courts', requirements: ['Litigation holds', 'Metadata preservation', 'Native format production'], impact: 'Document management must support defensible e-discovery' },
    { regulation: 'Data Privacy', jurisdiction: 'EU/California', requirements: ['Client data rights', 'Consent records', 'Breach notification'], impact: 'DSR workflows and consent tracking automated' },
  ],
};

