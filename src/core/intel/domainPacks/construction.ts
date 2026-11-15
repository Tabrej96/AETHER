/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Construction Domain Pack
 *
 * Complete construction project management platform — from bid to build to handover.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForConstruction(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'general-contracting',
      description: 'Full-service general contracting firm managing end-to-end construction projects for commercial and residential clients. Revenue from project-based billing, change orders, and material markup.',
      pricingExamples: ['Residential renovation $50-150/sqft', 'Commercial buildout $200-400/sqft', 'Project management fee 15-25% of construction cost', 'Change order markup 10-20%'],
    },
    {
      modelType: 'subcontractor-marketplace',
      description: 'Platform connecting general contractors with vetted subcontractors (electricians, plumbers, carpenters, HVAC). Handles matching, scheduling, payments, and insurance verification.',
      pricingExamples: ['Contractor subscription $99/month', '5% fee on subcontractor payments', 'Verified subcontractor premium $29/month', 'Insurance verification service $49/check'],
    },
    {
      modelType: 'construction-management-saas',
      description: 'Software platform for construction project management — scheduling, document management, RFIs, submittals, cost tracking, and BIM collaboration.',
      pricingExamples: ['Starter $49/user/month', 'Professional $129/user/month', 'Enterprise $299/user/month (custom)', 'BIM viewer add-on $25/user/month'],
    },
  ];
}

function revenueStreamsForConstruction(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'Project Billing',
      description: 'Primary revenue from construction project contracts — lump sum, cost-plus, or time-and-materials.',
      pricingModel: 'project-based',
      examples: ['Residential renovation $50-150/sqft', 'Commercial buildout $200-400/sqft', 'Cost-plus 15% fee', 'Time-and-materials $85/hour labor'],
    },
    {
      name: 'Change Orders',
      description: 'Additional revenue from scope changes requested by clients during construction.',
      pricingModel: 'per-change-order',
      examples: ['Design change $500-2,000', 'Material upgrade markup 10-20%', 'Added work billed at labor + 15%'],
    },
    {
      name: 'Software Subscription',
      description: 'Recurring revenue from construction management SaaS platform.',
      pricingModel: 'per-user-per-month',
      examples: ['Starter $49/user/month', 'Professional $129/user/month', 'Enterprise custom pricing'],
    },
    {
      name: 'Equipment Rental',
      description: 'Revenue from renting construction equipment to subcontractors and smaller contractors.',
      pricingModel: 'daily/weekly/monthly',
      examples: ['Excavator $500/day', 'Scaffolding $50/week per section', 'Power tools $25/day'],
    },
    {
      name: 'Material Sales',
      description: 'Markup on construction materials purchased and supplied as part of project packages.',
      pricingModel: 'markup on cost',
      examples: ['Lumber markup 15%', 'Drywall markup 20%', 'Fixtures markup 25-40%'],
    },
  ];
}

function userRoleMatrixForConstruction(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'project-manager',
      roleName: 'Project Manager',
      description: 'Oversees construction projects from planning to handover. Manages schedule, budget, subcontractors, and client communication.',
      permissions: ['create-projects', 'manage-schedule', 'approve-change-orders', 'manage-subcontractors', 'view-budget', 'communicate-with-client'],
      features: ['project-dashboard', 'schedule-management', 'budget-tracking', 'rfi-management', 'document-management', 'subcontractor-coordination'],
      constraints: ['cannot approve payments above authorized limit', 'cannot modify company-level settings', 'project data access limited to assigned projects'],
    },
    {
      roleId: 'subcontractor',
      roleName: 'Subcontractor',
      description: 'Trade specialist (electrical, plumbing, HVAC, carpentry) contracted for specific project phases.',
      permissions: ['view-assigned-tasks', 'update-task-status', 'submit-timesheets', 'upload-work-photos', 'request-materials'],
      features: ['task-board', 'timesheet', 'photo-upload', 'material-request', 'schedule-view'],
      constraints: ['cannot access project financials', 'cannot modify other trade assignments', 'work verified by site supervisor before payment'],
    },
    {
      roleId: 'architect',
      roleName: 'Architect / Designer',
      description: 'Design professional creating plans, reviewing submittals, and conducting design oversight throughout construction.',
      permissions: ['view-plans', 'review-submittals', 'comment-on-rfis', 'approve-design-changes', 'upload-drawings'],
      features: ['bim-viewer', 'drawing-management', 'rfi-review', 'submittal-review', 'design-collaboration'],
      constraints: ['cannot modify schedule or budget', 'design approval required before construction proceeds', 'all changes logged in revision history'],
    },
    {
      roleId: 'inspector',
      roleName: 'Building Inspector',
      description: 'Code enforcement officer or third-party inspector verifying compliance with building codes and safety standards.',
      permissions: ['schedule-inspections', 'view-inspection-items', 'approve-inspections', 'flag-violations', 'issue-permit-conditions'],
      features: ['inspection-checklist', 'code-reference', 'violation-tracking', 'permit-management'],
      constraints: ['inspector role cannot be self-assigned', 'inspection results immutable once submitted', 'violation notices require official signature'],
    },
    {
      roleId: 'client',
      roleName: 'Client / Owner',
      description: 'Project owner or representative tracking progress, approving milestones, and communicating with the project team.',
      permissions: ['view-project-status', 'approve-milestones', 'communicate-with-pm', 'review-change-orders', 'view-documents'],
      features: ['project-viewer', 'milestone-approval', 'document-access', 'progress-timeline', 'budget-overview'],
      constraints: ['cannot modify construction details', 'cannot communicate directly with subcontractors', 'change requests must go through PM'],
    },
    {
      roleId: 'worker',
      roleName: 'Field Worker',
      description: 'On-site construction laborer executing assigned tasks under subcontractor or supervisor direction.',
      permissions: ['view-assigned-tasks', 'update-task-progress', 'log-hours', 'safety-reporting', 'access-drawings'],
      features: ['mobile-task-view', 'timesheet', 'safety-checklist', 'drawing-viewer'],
      constraints: ['cannot access financial data', 'cannot modify project schedule', 'timesheet must be approved by supervisor'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing companies, users, billing, and platform configuration.',
      permissions: ['*'],
      features: ['dashboard', 'company-management', 'user-management', 'billing', 'reports', 'compliance'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'company data isolation enforced'],
    },
  ];
}

function operationalWorkflowsForConstruction(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'bid-to-award',
      name: 'Bid to Award',
      description: 'Client requests bid, contractor prepares proposal, bid submitted, client evaluates, and contract awarded.',
      steps: ['client-request', 'site-assessment', 'proposal-preparation', 'cost-estimation', 'bid-submission', 'client-review', 'clarifications', 'award-decision', 'contract-execution'],
      entities: ['project', 'bid', 'proposal', 'contract', 'estimate'],
      triggers: ['rfp-received', 'proposal-ready', 'bid-submitted', 'contract-signed'],
    },
    {
      workflowId: 'plan-to-permit',
      name: 'Plan to Permit',
      description: 'Architectural plans created, engineering reviews completed, permit applications submitted, reviewed by authority, and permit issued.',
      steps: ['design-creation', 'engineering-review', 'permit-application', 'plan-submission', 'authority-review', 'revisions-if-needed', 'inspection-scheduling', 'permit-issued'],
      entities: ['plan', 'permit', 'submittal', 'rfi', 'inspection'],
      triggers: ['plans-completed', 'submission-ready', 'review-complete', 'permit-approved'],
    },
    {
      workflowId: 'build-to-handover',
      name: 'Build to Handover',
      description: 'Construction execution with quality inspections, progress tracking, punch list completion, and final handover to client.',
      steps: ['mobilization', 'foundation', 'framing', 'rough-ins', 'inspections', 'finishing', 'punch-list', 'final-inspection', 'closeout-documents', 'handover'],
      entities: ['task', 'inspection', 'punch-item', 'document', 'milestone'],
      triggers: ['phase-complete', 'inspection-scheduled', 'punch-list-created', 'handover-approved'],
    },
    {
      workflowId: 'change-order-to-approval',
      name: 'Change Order to Approval',
      description: 'Change request identified, impact analysis performed, client notified, proposal prepared, and change order approved.',
      steps: ['change-identified', 'impact-analysis', 'client-notification', 'proposal-preparation', 'client-review', 'negotiation', 'approval', 'implementation'],
      entities: ['change-order', 'impact-analysis', 'proposal', 'approval', 'task-update'],
      triggers: ['change-requested', 'impact-complete', 'client-notified', 'change-approved'],
    },
  ];
}

function stateMachinesForConstruction(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Project',
      states: ['planning', 'bidding', 'permitted', 'active', 'on-hold', 'closeout', 'completed', 'cancelled'],
      transitions: { planning: ['bidding', 'cancelled'], bidding: ['permitted', 'cancelled'], permitted: ['active'], active: ['on-hold', 'closeout'], 'on-hold': ['active'], closeout: ['completed'] },
      initialState: 'planning',
      terminalStates: ['completed', 'cancelled'],
    },
    {
      entityName: 'Permit',
      states: ['not-applied', 'submitted', 'under-review', 'revisions-required', 'approved', 'expired', 'withdrawn'],
      transitions: { 'not-applied': ['submitted', 'withdrawn'], submitted: ['under-review'], 'under-review': ['revisions-required', 'approved'], 'revisions-required': ['submitted'], approved: ['expired'] },
      initialState: 'not-applied',
      terminalStates: ['approved', 'expired', 'withdrawn'],
    },
    {
      entityName: 'ChangeOrder',
      states: ['draft', 'submitted', 'under-review', 'approved', 'rejected', 'in-progress', 'completed', 'cancelled'],
      transitions: { draft: ['submitted'], submitted: ['under-review', 'cancelled'], 'under-review': ['approved', 'rejected'], approved: ['in-progress'], 'in-progress': ['completed'] },
      initialState: 'draft',
      terminalStates: ['completed', 'rejected', 'cancelled'],
    },
    {
      entityName: 'Inspection',
      states: ['scheduled', 'in-progress', 'passed', 'failed', 're-inspection-required', 'cancelled'],
      transitions: { scheduled: ['in-progress', 'cancelled'], 'in-progress': ['passed', 'failed'], failed: ['re-inspection-required'], 're-inspection-required': ['in-progress'] },
      initialState: 'scheduled',
      terminalStates: ['passed', 'cancelled'],
    },
  ];
}

function edgeCasesForConstruction(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Severe Weather Delay',
      description: 'Hurricane, flood, extreme cold, or wildfire halts construction for days or weeks, delaying critical path activities.',
      handling: 'Project schedule automatically recalculated with float analysis. Critical path items flagged for rescheduling. Client notification with revised timeline. Weather-force-majeure clause evaluated for contract protection. Daily weather log maintained.',
      recovery: 'Recovery plan with compressed schedule options (crashing, fast-tracking). Resource reallocation to non-affected activities. Client approval for schedule extension and any associated cost adjustments. Post-weather safety inspection before work resumes.',
    },
    {
      scenario: 'Building Code Violation',
      description: 'Inspection fails due to code violation discovered during construction, requiring rework of completed work.',
      handling: 'Violation documented with inspector notes and photographic evidence. Rework scope defined and cost estimated. Schedule impact calculated. Client and architect notified. Correction plan submitted for approval. Work area marked and access controlled.',
      recovery: 'Rework executed and re-inspection scheduled. Cost and schedule impact documented for potential change order. Lessons learned captured to prevent recurrence. Code reference added to project knowledge base.',
    },
    {
      scenario: 'Budget Overrun',
      description: 'Project costs exceed budget due to unforeseen conditions, material price changes, or scope creep.',
      handling: 'Budget variance analysis triggered when actual exceeds 80% of budgeted amount. Root cause identified (unforeseen site condition, material cost increase, change orders). Client notified per contract notification requirements. Cost-saving alternatives evaluated.',
      recovery: 'Change order process initiated for additional funding. Value engineering options presented to client. Non-critical scope items deferred with client approval. Budget forecast updated with revised completion estimate.',
    },
    {
      scenario: 'Safety Incident on Site',
      description: 'Worker injury, near-miss, or safety violation occurs on the construction site requiring immediate response.',
      handling: 'Work stops in affected area. Injured party receives first aid/medical attention. OSHA 300 log entry created. Incident photographed and documented. Regulatory notification if severity threshold met. Site safety officer investigates root cause. Work resumes only after safety conditions verified.',
      recovery: 'Corrective actions implemented and verified. Additional safety training for relevant workers. Insurance claim filed. Root cause analysis documented. Safety protocols updated to prevent recurrence. Regulatory reporting completed within required timeframe.',
    },
  ];
}

function integrationsForConstruction(): DomainPack['integrations'] {
  return [
    {
      name: 'BIM Software',
      type: 'design',
      description: 'Building Information Modeling integration with Revit, ArchiCAD, or Navisworks for 3D model collaboration and clash detection.',
      required: false,
      configuration: 'IFC file format support. Model upload and versioning. 3D viewer embedded in platform. Clash detection results import. Model-to-field comparison during construction.',
    },
    {
      name: 'Permit Management Systems',
      type: 'government',
      description: 'Integration with local building department permit systems for application submission and status tracking.',
      required: false,
      configuration: 'API connection to jurisdiction permit portal. Automated form filling from project data. Status polling for permit approval. Inspection scheduling integration. Document generation for permit packages.',
    },
    {
      name: 'Accounting Software',
      type: 'financial',
      description: 'QuickBooks, Sage, or similar accounting integration for project costing, invoicing, and financial reporting.',
      required: false,
      configuration: 'Bidirectional sync: project costs pushed to accounting, payment status pulled back. Chart of accounts mapping per project. WIP (work-in-progress) reporting integration. Invoice generation from approved change orders.',
    },
    {
      name: 'Time Tracking',
      type: 'operations',
      description: 'Mobile time tracking for field workers and subcontractors with GPS verification and task association.',
      required: false,
      configuration: 'Mobile app with clock in/out by project and task. GPS geofencing for site verification. Timesheet approval workflow. Integration with payroll and project costing.',
    },
    {
      name: 'Document Management',
      type: 'operations',
      description: 'Centralized document storage for plans, specifications, contracts, submittals, and RFIs with version control.',
      required: true,
      configuration: 'Document upload with auto-categorization. Revision tracking with redline comparison. RFI workflow with automatic routing. OCR for searchable plan documents. Revision cloud tracking on drawings.',
    },
    {
      name: 'Payment Processing',
      type: 'financial',
      description: 'Online payment processing for progress billing, change orders, and material purchases.',
      required: true,
      configuration: 'Stripe integration for progress billing. Retainage calculation and release. Payment schedule linked to milestone completion. Automated payment reminders. Application for payment (AIA G702) generation.',
    },
  ];
}

function technicalArchitectureForConstruction(): TechnicalArchitectureDef {
  return {
    patterns: ['Mobile-first for field workers with progressive web app', 'Document-centric architecture with version control', 'Real-time collaboration for BIM and document review', 'Event-driven change order and RFI workflows', 'Offline-first for field data entry with sync'],
    infrastructure: ['PostgreSQL for project, cost, and schedule data', 'S3-compatible storage for documents, drawings, and photos', 'Elasticsearch for document and RFI search', 'Redis for real-time collaboration state', 'Mobile-optimized API with PWA support', 'CDN for large drawing and BIM model delivery'],
    dataFlow: 'Project created by PM → schedule and budget set → plans uploaded to document storage → subcontractors notified via push → daily logs submitted from mobile → RFIs created and routed → BIM models synced for clash detection → inspections scheduled → progress photos uploaded → change orders processed → milestone billing generated → client approval → payment processed → project closeout documents assembled.',
    scalability: 'Large document sets handled via chunked upload and thumbnail generation. BIM models delivered via CDN with progressive loading. Real-time collaboration via WebSocket with operational transform for document annotations. Mobile sync optimized for low-bandwidth field conditions. Database partitioned by project for multi-tenant isolation.',
  };
}

function regulatoryComplianceForConstruction(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'OSHA Safety Standards',
      jurisdiction: 'United States',
      requirements: ['Incident reporting within 8 hours for fatalities, 24 hours for hospitalizations', 'Safety data sheets (SDS) for all hazardous materials on site', 'Fall protection plans for work above 6 feet', 'Personal protective equipment (PPE) documentation', 'Regular safety training records'],
      impact: 'Platform must support safety incident logging with OSHA 300/300A forms. SDS library with mobile access on site. Safety training tracking with expiration alerts. Incident investigation workflows with root cause analysis.',
    },
    {
      regulation: 'Building Codes (IBC/IRC)',
      jurisdiction: 'Per-jurisdiction',
      requirements: ['Code reference integration for inspectors and designers', 'Inspection checklists aligned with local amendments', 'Permit application automation per jurisdiction', 'Violation tracking and correction management', 'Certificate of occupancy workflow'],
      impact: 'Configurable code libraries per jurisdiction. Inspection checklists dynamically generated based on project type and local amendments. Violation tracking linked to specific code sections with correction tracking.',
    },
    {
      regulation: 'EPA Lead and Asbestos Regulations',
      jurisdiction: 'United States',
      requirements: ['Lead-based paint disclosure for pre-1978 structures', 'Asbestos survey requirements for renovation', 'Contaminated material handling procedures', 'Disposal manifest tracking', 'Worker exposure monitoring'],
      impact: 'Pre-construction hazard assessment workflow. Lead/asbestos testing result tracking. Abatement plan documentation. Disposal manifest generation and tracking. Worker exposure monitoring log.',
    },
    {
      regulation: 'State Contractor Licensing',
      jurisdiction: 'Per-state',
      requirements: ['Contractor license verification', 'Bond and insurance certificate tracking', 'License renewal alerts', 'Classification-specific work authorization'],
      impact: 'Subcontractor onboarding includes license verification. License status monitored with renewal alerts. Work authorization validated against license classification.',
    },
  ];
}

function businessRulesForConstruction(): BusinessRulesSpec {
  return {
    bidding: [
      'Bid must include detailed scope, schedule, and cost breakdown. Lump-sum bids must specify exclusions clearly.',
      'Bid validity period is 30 days from submission unless otherwise specified. Client must accept within validity or bid expires.',
      'Bid bond requirement: 10% of bid amount for projects over $100,000. Performance bond at 100% of contract value for government projects.',
      'Subcontractor quotes must be received at least 5 business days before bid submission to allow for review and inclusion.',
      'Competitive bid analysis documented with at least 3 quotes for projects over $50,000.',
    ],
    changeOrders: [
      'Change orders exceeding $5,000 or 10% of project budget require client written approval before work proceeds.',
      'All change orders must include: description, reason, cost impact, schedule impact, and effect on other contracts.',
      'Changes affecting structural elements require architect/engineer stamped drawings before implementation.',
      'Change order markup: labor at standard rate + 15% overhead, materials at cost + 10%. Subcontractor change orders passed through without markup.',
      'Unapproved change orders ("extras") are not billable. Field directives do not constitute approval for payment.',
    ],
    scheduling: [
      'Project schedule uses critical path method (CPM). Activities on critical path have zero float.',
      'Schedule updates submitted weekly. Variance analysis triggered when activity exceeds 5% of planned duration.',
      'Milestone payments tied to schedule completion: foundation 15%, framing 20%, rough-ins 20%, finishes 25%, punch list 10%, closeout 10%.',
      'Weather days counted per contract terms (typically 5 days/year for non-extreme weather). Force majeure events processed separately.',
    ],
    payments: [
      'Progress payments submitted monthly via AIA G702 application. Retainage 10% withheld until substantial completion.',
      'Retainage released in full at final payment after all liens resolved and closeout documents submitted.',
      'Payment due within 30 days of invoice submission. Late payment interest at 1.5% per month.',
      'Subcontractor payments made within 7 days of receiving owner payment (prompt payment requirement).',
    ],
    inspections: [
      'All required inspections scheduled 48 hours in advance. Inspector notified via platform notification.',
      'Inspection checklist generated per trade and inspection type. Re-inspections scheduled within 5 business days.',
      'Failed inspections must be corrected and re-inspected at no additional inspection fee within 30 days.',
      'Certificate of occupancy issued only after all final inspections passed and closeout documents complete.',
    ],
    safety: [
      'Safety orientation required for all workers before site access. Digital orientation tracked with expiration.',
      'Toolbox talks documented weekly. Safety training hours tracked per worker.',
      'Incident reporting within required timeframe: fatalities 8 hours, hospitalizations 24 hours, lost-time 5 days.',
      'Site-specific safety plan required before mobilization. Updated when site conditions change.',
    ],
  };
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const CONSTRUCTION_PACK: DomainPack = {
  domain: 'construction',
  name: 'Construction Project Management',
  description: 'Complete construction project management platform — from bid to build to handover. Covers project bidding, permit management, BIM collaboration, scheduling with critical path method, subcontractor coordination, safety compliance, change order management, and quality inspections.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Project Management', 'Design & Planning', 'Field Operations', 'Compliance & Safety', 'Financial', 'Marketplace'],
    features: [
      'project-management',
      'bim-viewer',
      'schedule-management',
      'rfi-management',
      'subcontractor-management',
      'safety-compliance',
      'permit-tracking',
      'document-management',
      'cost-tracking',
      'inspection-management',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['self-perform', 'subcontractor', 'design-build', 'construction-management'],
    features: [
      'milestone-billing',
      'progress-tracking',
      'material-procurement',
      'equipment-rental',
      'change-order-management',
      'punch-list',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'project-dashboard',
      'progress-tracking',
      'milestone-approval',
      'document-access',
      'budget-overview',
      'communication-portal',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'scheduling',
      'cost-tracking',
      'document-management',
      'rfi-submittals',
      'safety-management',
      'quality-control',
      'subcontractor-coordination',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'project-showcase',
      'portfolio-gallery',
      'before-after-comparison',
      'virtual-tour',
      'testimonials',
      'certification-display',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'project-showcase',
      'services',
      'portfolio',
      'about',
      'contact',
      'careers',
    ],
    customer: [
      'project-dashboard',
      'milestone-viewer',
      'document-repository',
      'budget-tracker',
      'communication-panel',
      'change-order-approval',
    ],
    admin: [
      'dashboard',
      'project-management',
      'user-management',
      'billing',
      'reports',
      'compliance',
      'company-settings',
    ],
    staff: [
      'mobile-task-board',
      'timesheet',
      'photo-upload',
      'safety-checklist',
      'rfi-form',
      'document-viewer',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForConstruction(),

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Dashboard with Gantt chart as primary visualization',
      'Split-pane for document review with markups',
      'Mobile-first field worker screens with large touch targets',
      'Photo-centric progress tracking with timeline view',
      'Tabbed navigation for RFIs, submittals, and change orders',
      'Printable inspection checklists and reports',
    ],
    color: [
      'Safety orange (#FF6B35) and yellow for safety alerts and warnings',
      'Hard hat yellow (#FFC107) for construction-specific branding',
      'Steel gray (#607D8B) for structural elements',
      'Concrete gray (#9E9E9E) for neutral backgrounds',
      'Green (#4CAF50) for pass/complete status',
      'Red (#F44336) for fail/violation status',
      'High-visibility blue (#2196F3) for information and links',
    ],
    typography: [
      'Industrial sans-serif (Roboto or similar) for clarity',
      'Bold headers for trade and room labels',
      'Monospace for measurements and quantities',
      'Large print for field conditions',
      'Redline color (red) for revision marks on drawings',
      'Code-reference font for building code citations',
    ],
    interaction: [
      'Gantt chart with drag-to-reschedule tasks',
      'Document viewer with pinch-to-zoom for large drawings',
      'Photo annotation with tap-to-markup',
      'Offline mode for field data entry with auto-sync',
      'Push notifications for RFI responses and schedule changes',
      'Barcode/QR scanning for material and equipment tracking',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance for all web interfaces',
      'High contrast mode for outdoor visibility',
      'Screen reader support for document descriptions',
      'Keyboard navigation for all admin functions',
      'Voice input for hands-free field reporting',
      'Multi-language support for diverse workforce',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-tier role system: Project Manager (full project access), Subcontractor (assigned tasks only), Architect (design documents), Inspector (inspection authority), Client (read-only project view), Field Worker (limited task access), Admin (full platform). JWT with 8h expiry. Refresh tokens with 30d. MFA required for financial operations and admin.',
    data: 'Project data includes confidential designs, financial budgets, client information, worker personal data, and safety records. Documents encrypted at rest (AES-256). Financial data PCI compliant. Worker data protected per employment law. Audit trail for all document modifications.',
    compliance: ['OSHA recordkeeping and safety reporting', 'Building code compliance documentation', 'EPA lead/asbestos regulations', 'State contractor licensing verification', 'Lien waiver management', 'Davis-Bacon prevailing wage compliance'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Schedule CPM calculation and float computation',
      'Cost variance analysis: actual vs budgeted per activity',
      'Change order cost and schedule impact calculation',
      'Retainage calculation: 10% of progress payments',
      'Bid markup calculation: labor + materials + overhead + profit',
      'Milestone payment percentage verification',
      'Inspection pass/fail status transition logic',
      'RFI routing based on trade and drawing reference',
    ],
    integration: [
      'Bid creation → proposal generation → client submission flow',
      'Change order → client notification → approval → schedule update → budget adjustment',
      'RFI creation → architect notification → response → distribution → closeout',
      'Inspection scheduling → inspector notification → checklist generation → result recording',
      'Progress billing → AIA G702 generation → client invoice → payment tracking',
      'Subcontractor timesheet → project cost allocation → payment processing',
    ],
    e2e: [
      'Project creation → schedule setup → subcontractor invitation → work execution → inspection → punch list → handover',
      'RFI lifecycle: creation → routing → response → resolution → closeout with notifications',
      'Change order flow: identification → impact analysis → client approval → implementation → billing',
      'Client portal: milestone notification → document review → approval → payment release',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForConstruction(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForConstruction(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForConstruction(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForConstruction(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForConstruction(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForConstruction(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForConstruction(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForConstruction(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForConstruction(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const CONSTRUCTION_DOMAIN: DomainModel = {
  id: CONSTRUCTION_PACK.domain,
  domain: CONSTRUCTION_PACK.domain,
  name: CONSTRUCTION_PACK.name,
  label: CONSTRUCTION_PACK.name,
  category: 'construction',
  description: CONSTRUCTION_PACK.description,
  userRoles: [
    { id: 'project-manager', name: 'Project Manager', typicalFeatures: ['project-dashboard', 'schedule-management', 'budget-tracking', 'rfi-management'], permissions: ['create-projects', 'manage-schedule', 'approve-change-orders', 'manage-subcontractors'] },
    { id: 'subcontractor', name: 'Subcontractor', typicalFeatures: ['task-board', 'timesheet', 'photo-upload', 'material-request'], permissions: ['view-assigned-tasks', 'update-task-status', 'submit-timesheets'] },
    { id: 'architect', name: 'Architect', typicalFeatures: ['bim-viewer', 'drawing-management', 'rfi-review', 'submittal-review'], permissions: ['view-plans', 'review-submittals', 'comment-on-rfis', 'approve-design-changes'] },
    { id: 'inspector', name: 'Inspector', typicalFeatures: ['inspection-checklist', 'code-reference', 'violation-tracking'], permissions: ['schedule-inspections', 'view-inspection-items', 'approve-inspections', 'flag-violations'] },
    { id: 'client', name: 'Client', typicalFeatures: ['project-viewer', 'milestone-approval', 'document-access', 'progress-timeline'], permissions: ['view-project-status', 'approve-milestones', 'review-change-orders'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'project-management', 'user-management', 'billing'], permissions: ['*'] },
  ],
  role: 'project-manager',
  standardFeatures: [],
  businessModels: [
    { modelType: 'general-contracting', revenueStreams: ['project-billing', 'change-orders', 'material-markup', 'equipment-rental'], costStructure: ['labor', 'materials', 'equipment', 'subcontractors', 'insurance', 'bonding'], pricingStrategy: ['lump-sum', 'cost-plus', 'time-and-materials'] },
    { modelType: 'subcontractor-marketplace', revenueStreams: ['subscription-fees', 'transaction-fees', 'verification-services'], costStructure: ['platform-engineering', 'insurance-verification', 'payment-processing', 'customer-support'], pricingStrategy: ['subscription-monthly', 'percentage-fee', 'tiered'] },
    { modelType: 'construction-management-saas', revenueStreams: ['software-subscription', 'add-on-modules', 'training-services'], costStructure: ['development', 'cloud-infrastructure', 'support', 'sales'], pricingStrategy: ['per-user-per-month', 'tiered', 'enterprise-custom'] },
  ],
  technicalPatterns: [
    { category: 'architecture', name: 'Mobile-First Field Application', description: 'Progressive web app optimized for field conditions with offline data entry and sync', rationale: 'Field workers use tablets and phones on construction sites with unreliable connectivity' },
    { category: 'document', name: 'Document Versioning System', description: 'Full revision tracking with redline comparison and drawing overlay', rationale: 'Construction documents evolve constantly and must maintain version integrity' },
    { category: 'scheduling', name: 'Critical Path Method Engine', description: 'CPM-based project scheduling with float calculation and resource leveling', rationale: 'Construction projects require precise critical path analysis for on-time delivery' },
    { category: 'collaboration', name: 'Real-Time BIM Collaboration', description: 'Multi-user BIM model viewing with annotation and clash detection', rationale: 'Design-build collaboration requires synchronized 3D model access across disciplines' },
  ],
  operationalLifecycle: [
    { id: 'bid', name: 'Bid', description: 'Client request received, proposal prepared, bid submitted' },
    { id: 'award', name: 'Award', description: 'Contract executed, project mobilized, permits obtained' },
    { id: 'build', name: 'Build', description: 'Active construction with scheduling, inspections, and quality control' },
    { id: 'closeout', name: 'Closeout', description: 'Punch list completion, final inspection, and project handover' },
  ],
  designPrinciples: [
    { name: 'Safety-First UI', description: 'High-visibility alerts, clear safety warnings, and emergency action buttons prominently placed' },
    { name: 'Document-Centric', description: 'Large drawing and document viewers optimized for blueprint and plan review' },
    { name: 'Offline Resilience', description: 'Full offline capability for field data entry with intelligent sync when connectivity returns' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Multi-role project access', description: 'Role isolation between trades, client, and management', severity: 'high' },
    { category: 'data', name: 'Confidential design protection', description: 'Blueprints and designs encrypted at rest', severity: 'high' },
    { category: 'compliance', name: 'OSHA recordkeeping', description: 'Safety incident documentation with regulatory reporting', severity: 'medium' },
    { category: 'compliance', name: 'Lien waiver management', description: 'Payment-linked lien release tracking', severity: 'medium' },
  ],
  regulations: [
    { name: 'OSHA', requirements: ['Incident reporting', 'Safety data sheets', 'PPE documentation', 'Training records'] },
    { name: 'Building Codes', requirements: ['Code reference integration', 'Inspection checklists', 'Permit automation', 'Violation tracking'] },
    { name: 'EPA Lead/Asbestos', requirements: ['Disclosure requirements', 'Hazard assessment', 'Abatement documentation'] },
    { name: 'State Licensing', requirements: ['Contractor verification', 'Bond tracking', 'License renewal alerts'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'CPM schedule calculation', description: 'Critical path and float computation accuracy', priority: 'high' },
    { category: 'unit', name: 'Retainage calculation', description: '10% retainage tracking per progress payment', priority: 'high' },
    { category: 'integration', name: 'Change order workflow', description: 'Impact analysis → approval → schedule update', priority: 'high' },
    { category: 'e2e', name: 'Project lifecycle', description: 'Bid → permit → build → handover', priority: 'medium' },
  ],
  workflows: [
    { id: 'bid-to-award', name: 'Bid to Award', steps: ['rfp', 'site-assessment', 'proposal', 'cost-estimation', 'bid-submission', 'review', 'award', 'contract'], entities: ['project', 'bid', 'contract'] },
    { id: 'plan-to-permit', name: 'Plan to Permit', steps: ['design', 'engineering-review', 'application', 'submission', 'authority-review', 'revisions', 'permit-issued'], entities: ['plan', 'permit', 'submittal'] },
    { id: 'build-to-handover', name: 'Build to Handover', steps: ['mobilization', 'foundation', 'framing', 'rough-ins', 'finishing', 'punch-list', 'closeout', 'handover'], entities: ['task', 'inspection', 'punch-item'] },
    { id: 'change-order-approval', name: 'Change Order Approval', steps: ['change-identified', 'impact-analysis', 'client-notify', 'proposal', 'approval', 'implementation'], entities: ['change-order', 'impact-analysis'] },
  ],
  entities: [
    { name: 'Project', description: 'Construction project with schedule, budget, and participants', invariants: ['project must have approved budget', 'schedule must include critical path'] },
    { name: 'ChangeOrder', description: 'Scope change request with cost and schedule impact', invariants: ['requires approval if >$5000 or 10%', 'must include cost and schedule impact'] },
    { name: 'Permit', description: 'Building permit with inspection requirements and expiry', invariants: ['expires per jurisdiction timeline', 'all required inspections must pass for CO'] },
  ],
  invariants: ['project must have approved budget before mobilization', 'change orders require approval before work proceeds', 'inspections passed before covering work', 'retainage released only at final payment'],
  constraints: ['change order threshold $5000 or 10% of budget requires client approval', 'retainage 10% until substantial completion', 'payment due 30 days from invoice', 'subcontractor payment within 7 days of owner payment', 'safety orientation required before site access'],
  financialFlows: [
    { name: 'progress-billing', direction: 'in', trigger: 'milestone-completed-and-approved' },
    { name: 'change-order-billing', direction: 'in', trigger: 'change-order-approved' },
    { name: 'retainage-release', direction: 'in', trigger: 'final-payment-approved' },
    { name: 'subcontractor-payment', direction: 'out', trigger: 'progress-payment-received' },
    { name: 'material-purchase', direction: 'out', trigger: 'purchase-order-approved' },
  ],
  successMetrics: ['on-time-completion-rate', 'budget-variance-percentage', 'safety-incident-rate', 'inspection-pass-rate', 'change-order-frequency', 'client-satisfaction-score', 'subcontractor-retention-rate'],
  analytics: { tracked: ['schedule-variance', 'cost-variance', 'safety-incidents', 'inspection-results', 'change-orders', 'productivity'], dashboards: ['project-dashboard', 'schedule', 'budget', 'safety', 'quality'] },
  securityRequirements: ['jwt-auth', 'mfa-financial', 'document-encryption', 'role-isolation', 'audit-logging', 'pci-compliance'],
  regulatory: [
    { regulation: 'OSHA', applies: true, notes: 'Safety incident reporting and training records' },
    { regulation: 'Building Codes', applies: true, notes: 'Inspection and permit compliance' },
    { regulation: 'EPA Lead/Asbestos', applies: true, notes: 'Hazard assessment for renovations' },
    { regulation: 'State Licensing', applies: true, notes: 'Contractor license verification' },
  ],
};
