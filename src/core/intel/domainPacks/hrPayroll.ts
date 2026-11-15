/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * HR & Payroll Management Domain Pack
 *
 * Complete HR and payroll platform — from hire to retire with full payroll processing.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 */

// ── Local Type Definitions ───────────────────────────────────────────────────

import type { DomainPack, DomainModel, TechnicalArchitectureDef, RegulatoryComplianceEntry } from './domainPackTypes.js';











// ── Business Intelligence Helpers ──────────────────────────────────────────────

function businessModelVariantsForHRPayroll(): DomainPack['businessModelVariants'] {
  return [
    {
      modelType: 'hr-saas-platform',
      description: 'Full-suite HR platform covering employee records, time tracking, performance management, and payroll processing.',
      pricingExamples: ['Core $4/employee/month', 'Plus $6/employee/month', 'Premium $8/employee/month', 'Enterprise custom pricing', 'Payroll add-on $2/employee/month'],
    },
    {
      modelType: 'payroll-processing-service',
      description: 'Dedicated payroll processing with tax filing, compliance, and direct deposit.',
      pricingExamples: ['Basic $2/employee/payroll run', 'Standard $4/employee/run', 'Premium $6/employee/run', 'Per-payroll $40-100 base fee'],
    },
    {
      modelType: 'benefits-administration',
      description: 'Benefits enrollment, administration, and carrier management platform.',
      pricingExamples: ['Per employee $3-5/month', 'PEPM (per employee per month) $2-4', 'Implementation $5,000-15,000', 'Carrier integration $500-2,000 per carrier'],
    },
  ];
}

function revenueStreamsForHRPayroll(): DomainPack['revenueStreams'] {
  return [
    {
      name: 'SaaS Subscription',
      description: 'Recurring subscription revenue from HR platform usage per employee per month.',
      pricingModel: 'per-employee-per-month',
      examples: ['Core $4/employee/month', 'Plus $6/employee/month', 'Premium $8/employee/month', 'Enterprise custom'],
    },
    {
      name: 'Payroll Processing',
      description: 'Revenue from payroll processing, tax filing, and compliance services.',
      pricingModel: 'per-employee-per-payroll-run',
      examples: ['Basic $2/employee/run', 'Standard $4/employee/run', 'Per-payroll base fee $40-100', 'Off-cycle payroll $10/employee'],
    },
    {
      name: 'Benefits Administration',
      description: 'Revenue from benefits enrollment management and carrier integration.',
      pricingModel: 'per-employee-per-month',
      examples: ['Benefits module $3-5/employee/month', 'Open enrollment management $500-2,000 one-time', 'Carrier API integration setup $500-2,000'],
    },
    {
      name: 'Recruiting Fees',
      description: 'Revenue from recruiting platform, job postings, and placement fees.',
      pricingModel: 'per-requisition or placement',
      examples: ['Job posting $99-299/posting', 'ATS subscription $100-500/month', 'Contingency placement 15-25% of first year salary', 'RPO $500-2,000/requisition'],
    },
    {
      name: 'Time Tracking',
      description: 'Revenue from employee time tracking, scheduling, and labor analytics.',
      pricingModel: 'per-employee-per-month',
      examples: ['Time tracking $2-3/employee/month', 'Scheduling $3-4/employee/month', 'Labor analytics $1-2/employee/month'],
    },
  ];
}

function userRoleMatrixForHRPayroll(): DomainPack['userRoleMatrix'] {
  return [
    {
      roleId: 'employee',
      roleName: 'Employee',
      description: 'Individual worker accessing personal HR information, time tracking, benefits, and payslips.',
      permissions: ['view-self-profile', 'update-self-profile', 'submit-time', 'request-time-off', 'view-payslips', 'access-benefits'],
      features: ['employee-portal', 'time-clock', 'pto-request', 'payslip-viewer', 'benefits-enrollment', 'directory'],
      constraints: ['can only access own data', 'time submission deadline per pay period', 'PTO balance cannot go negative without approval'],
    },
    {
      roleId: 'manager',
      roleName: 'Manager',
      description: 'Team supervisor managing direct reports — approving time off, viewing team schedules, performance reviews.',
      permissions: ['view-team', 'approve-time-off', 'edit-team-schedule', 'conduct-reviews', 'view-team-payroll', 'initiate-hiring'],
      features: ['team-dashboard', 'pto-approval', 'schedule-management', 'performance-reviews', 'reporting', 'requisition-creation'],
      constraints: ['can only access direct reports data', 'budget limits per department', 'approval chain per company policy'],
    },
    {
      roleId: 'hr-admin',
      roleName: 'HR Admin',
      description: 'Human resources professional managing employee records, policies, compliance, and HR operations.',
      permissions: ['manage-employees', 'manage-policies', 'handle-grievances', 'manage-enrollment', 'generate-hr-reports', 'access-all-records'],
      features: ['employee-management', 'policy-management', 'enrollment-management', 'hr-reports', 'compliance-tools', 'document-management'],
      constraints: ['employee data access per privacy policy', 'actions logged in audit trail', 'termination requires approval'],
    },
    {
      roleId: 'payroll-specialist',
      roleName: 'Payroll Specialist',
      description: 'Payroll professional processing payroll runs, tax calculations, and compliance.',
      permissions: ['run-payroll', 'view-payroll-data', 'process-taxes', 'issue-checks', 'process-garnishments', 'generate-payroll-reports'],
      features: ['payroll-processing', 'tax-calculation', 'direct-deposit', 'w-4-management', 'garnishment-processing', 'payroll-reports'],
      constraints: ['payroll must balance to the penny', 'tax filing deadlines enforced', 'all changes require manager approval', 'dual-approval for large adjustments'],
    },
    {
      roleId: 'recruiter',
      roleName: 'Recruiter',
      description: 'Talent acquisition professional managing job postings, candidates, interviews, and offers.',
      permissions: ['create-jobs', 'manage-candidates', 'schedule-interviews', 'create-offers', 'track-pipeline', 'report-hiring'],
      features: ['job-board', 'candidate-tracking', 'interview-scheduling', 'offer-management', 'pipeline-dashboard', 'reporting'],
      constraints: ['offer requires HR and budget approval', 'candidate data retained per EEOC requirements', 'interview feedback required before next stage'],
    },
    {
      roleId: 'admin',
      roleName: 'Platform Admin',
      description: 'Full system administrator managing organization, users, settings, billing, and compliance.',
      permissions: ['*'],
      features: ['dashboard', 'organization-management', 'user-management', 'billing', 'settings', 'compliance', 'audit-logs'],
      constraints: ['all actions logged in audit trail', 'sensitive operations require MFA', 'financial data access restricted'],
    },
  ];
}

function operationalWorkflowsForHRPayroll(): DomainPack['operationalWorkflows'] {
  return [
    {
      workflowId: 'hire-to-retire',
      name: 'Hire to Retire',
      description: 'Complete employee lifecycle: requisition, hiring, onboarding, employment, performance, and offboarding.',
      steps: ['requisition-created', 'requisition-approved', 'job-posted', 'candidates-sourced', 'interviews-conducted', 'offer-created', 'offer-approved', 'candidate-accepted', 'background-check', 'onboarding-started', 'equipment-assigned', 'training-completed', 'employment-active', 'performance-reviews', 'promotion-considered', 'offboarding-initiated', 'exit-interview', 'final-payroll', 'benefits-terminated', 'records-archived'],
      entities: ['job-requisition', 'candidate', 'employee', 'performance-review', 'termination'],
      triggers: ['requisition-created', 'offer-accepted', 'employment-started', 'review-completed', 'termination-initiated'],
    },
    {
      workflowId: 'payroll-to-pay',
      name: 'Payroll to Pay',
      description: 'Payroll period begins, hours collected, adjustments processed, taxes calculated, pay run executed, and funds deposited.',
      steps: ['pay-period-opens', 'time-submitted', 'time-approved', 'adjustments-entered', 'garnishments-processed', 'tax-calculated', 'pay-run-previewed', 'pay-run-approved', 'pay-run-processed', 'direct-deposit-sent', 'payslips-distributed'],
      entities: ['time-entry', 'payroll-run', 'tax-calculation', 'payslip', 'direct-deposit'],
      triggers: ['pay-period-closes', 'pay-run-approved', 'deposit-sent', 'payslips-distributed'],
    },
    {
      workflowId: 'expense-to-reimburse',
      name: 'Expense to Reimburse',
      description: 'Employee submits expense, manager approves, finance reviews, reimbursement processed, and funds deposited.',
      steps: ['expense-submitted', 'receipts-uploaded', 'manager-approved', 'policy-checked', 'finance-reviewed', 'reimbursement-approved', 'funds-sent', 'notification-sent'],
      entities: ['expense-report', 'receipt', 'approval', 'reimbursement'],
      triggers: ['expense-submitted', 'manager-approved', 'reimbursement-processed'],
    },
    {
      workflowId: 'requisition-to-onboard',
      name: 'Requisition to Onboard',
      description: 'Manager creates hiring requisition, HR reviews, job posted, candidates sourced, interviewed, offered, accepted, and onboarded.',
      steps: ['requisition-created', 'manager-approved', 'hr-reviewed', 'job-posted', 'candidates-sourced', 'interviews-scheduled', 'interviews-conducted', 'offer-created', 'offer-approved', 'offer-sent', 'candidate-accepts', 'background-check', 'pre-boarding', 'first-day', 'training-completed'],
      entities: ['job-requisition', 'job-posting', 'candidate', 'offer', 'employee', 'onboarding-plan'],
      triggers: ['requisition-approved', 'job-posted', 'offer-sent', 'onboarding-started'],
    },
  ];
}

function stateMachinesForHRPayroll(): DomainPack['stateMachines'] {
  return [
    {
      entityName: 'Employee',
      states: ['pre-onboarding', 'onboarding', 'active', 'on-leave', 'notice-period', 'terminated', 'archived'],
      transitions: { 'pre-onboarding': ['onboarding'], onboarding: ['active'], active: ['on-leave', 'notice-period', 'terminated'], 'on-leave': ['active'], 'notice-period': ['terminated'], terminated: ['archived'] },
      initialState: 'pre-onboarding',
      terminalStates: ['archived'],
    },
    {
      entityName: 'PayrollRun',
      states: ['open', 'hours-collected', 'adjustments-entered', 'previewed', 'approved', 'processing', 'completed', 'failed', 'reversed'],
      transitions: { open: ['hours-collected'], 'hours-collected': ['adjustments-entered'], 'adjustments-entered': ['previewed'], previewed: ['approved'], approved: ['processing'], processing: ['completed', 'failed'], completed: ['reversed'] },
      initialState: 'open',
      terminalStates: ['completed', 'failed'],
    },
    {
      entityName: 'LeaveRequest',
      states: ['draft', 'submitted', 'manager-review', 'hr-review', 'approved', 'denied', 'active', 'completed', 'cancelled'],
      transitions: { draft: ['submitted'], submitted: ['manager-review', 'denied', 'cancelled'], 'manager-review': ['hr-review'], 'hr-review': ['approved', 'denied'], approved: ['active', 'cancelled'], active: ['completed'] },
      initialState: 'draft',
      terminalStates: ['completed', 'denied', 'cancelled'],
    },
    {
      entityName: 'JobRequisition',
      states: ['draft', 'submitted', 'manager-approved', 'hr-approved', 'posted', 'screening', 'interviewing', 'offer-stage', 'filled', 'cancelled', 'expired'],
      transitions: { draft: ['submitted'], submitted: ['manager-approved', 'cancelled'], 'manager-approved': ['hr-approved'], 'hr-approved': ['posted'], posted: ['screening', 'cancelled', 'expired'], screening: ['interviewing'], interviewing: ['offer-stage', 'cancelled'], 'offer-stage': ['filled'] },
      initialState: 'draft',
      terminalStates: ['filled', 'cancelled', 'expired'],
    },
  ];
}

function edgeCasesForHRPayroll(): DomainPack['edgeCases'] {
  return [
    {
      scenario: 'Off-Cycle Payroll Run',
      description: 'Employee termination or special payment requires payroll run outside the normal bi-weekly or monthly cycle.',
      handling: 'Off-cycle payroll initiated by HR Admin with reason code. Separate payroll run created with only affected employees. Taxes calculated per state rules for off-cycle. Direct deposit initiated within 24-48 hours. Regular payroll unaffected.',
      recovery: 'If off-cycle payment fails: employee notified, manual check option offered, retry scheduled. Year-to-date totals reconciled. W-2/1099 updates verified. Off-cycle runs tracked separately per audit requirements.',
    },
    {
      scenario: 'Multi-State Tax Compliance',
      description: 'Employee works in different states on different days requiring accurate state tax withholding and unemployment insurance calculations.',
      handling: 'Work location tracked per day via time clock or timesheet. State income tax calculated per work location. SUI (state unemployment insurance) rate per state applied. Reciprocal agreements checked for neighboring states. Year-end W-2 per state breakdown generated.',
      recovery: 'If state tax error detected: amended returns filed with affected states. Employee notified of correction. Additional tax or refund calculated. Quarterly tax reports amended. Process reviewed to prevent recurrence. Multi-state accuracy validated.',
    },
    {
      scenario: 'Garnishment Processing',
      description: 'Court-ordered wage garnishment for child support, tax levy, or creditor judgment requiring accurate deduction limits.',
      handling: 'Garnishment order received and entered into system. Maximum deduction calculated per federal (25% of disposable income) and state limits. Multiple garnishments prioritized (federal tax > state tax > child support > creditor). Deduction applied to each payroll run until satisfied. Employer fee added per state rules.',
      recovery: 'If garnishment satisfied: deduction stopped, employee and agency notified, order archived. If employee disputes: documentation collected, legal counsel consulted, response filed with court. Payroll run rebalanced for error.',
    },
  ];
}

function integrationsForHRPayroll(): DomainPack['integrations'] {
  return [
    {
      name: 'Payroll Tax Filing',
      type: 'compliance',
      description: 'Automatic payroll tax calculation, withholding, and filing with federal and state agencies.',
      required: true,
      configuration: 'Federal (IRS) and state tax tables updated quarterly. Social Security, Medicare, FUTA calculation. State unemployment tax (SUTA) calculation. Quarterly 941 filing. Annual W-2/1099 generation and filing.',
    },
    {
      name: 'Benefits Providers',
      type: 'benefits',
      description: 'Health insurance, 401(k), and other benefits carrier integrations.',
      required: false,
      configuration: 'Carrier enrollment feeds for new hires and changes. Premium deduction calculation. COBRA administration. 401(k) contribution transmission. Open enrollment support with carrier portals.',
    },
    {
      name: 'Background Check',
      type: 'verification',
      description: 'Pre-employment background check and verification services.',
      required: false,
      configuration: 'API for criminal background, employment verification, education verification. FCRA-compliant consent capture. Adverse action workflow. Results storage with retention policy.',
    },
    {
      name: 'Time Tracking',
      type: 'operations',
      description: 'Employee time clock, timesheet, and scheduling integration.',
      required: true,
      configuration: 'Clock in/out via mobile app or kiosk. Timesheet submission and approval. Overtime calculation (FLSA). PTO and leave accrual tracking. Schedule management with notifications.',
    },
    {
      name: 'HRIS (Human Resource Information System)',
      type: 'data',
      description: 'Integration with existing HR systems for employee data synchronization.',
      required: false,
      configuration: 'Employee master data sync. Organizational chart updates. Performance review data. Training records. Offboarding data capture.',
    },
    {
      name: 'Accounting Software',
      type: 'financial',
      description: 'General ledger posting for payroll expenses and liabilities.',
      required: false,
      configuration: 'Payroll journal entry to GL per cost center. Labor distribution. Tax liability accruals. Direct deposit reconciliation. Benefits expense allocation.',
    },
  ];
}

function technicalArchitectureForHRPayroll(): TechnicalArchitectureDef {
  return {
    patterns: ['Multi-entity payroll with configurable tax rules per jurisdiction', 'Event-driven payroll processing with approval workflows', 'Time entry aggregation with overtime calculation', 'Benefits enrollment with open enrollment periods', 'Compliance reporting with configurable templates'],
    infrastructure: ['PostgreSQL for employee, payroll, and benefits data', 'Redis for time clock cache and session management', 'S3-compatible storage for pay slips and documents', 'Queue for payroll processing with retry logic', 'Elasticsearch for employee directory search', 'Audit logging with tamper-evident storage'],
    dataFlow: 'Employee submits time → manager approves → payroll specialist processes → taxes calculated per jurisdiction → payroll run previewed → approved → direct deposit initiated → payslips distributed → tax filings submitted → year-end forms generated. Benefits: enrollment period → employee selects → HR approves → carrier notified → payroll deductions configured.',
    scalability: 'Payroll processing batched during designated windows. Tax tables cached with quarterly refresh. Time clock operations handled via Redis with high availability. Employee directory search via Elasticsearch. Pay slip PDFs generated in parallel during batch processing.',
  };
}

function regulatoryComplianceForHRPayroll(): RegulatoryComplianceEntry[] {
  return [
    {
      regulation: 'FLSA (Fair Labor Standards Act)',
      jurisdiction: 'United States',
      requirements: ['Minimum wage compliance', 'Overtime calculation (1.5x over 40 hours)', 'Child labor restrictions', 'Record keeping for 3 years', 'Exempt vs non-exempt classification'],
      impact: 'Overtime calculation engine per FLSA rules. Employee classification tracking. Time records maintained per requirements. Wage compliance alerts. Exemption criteria validation.',
    },
    {
      regulation: 'FMLA (Family and Medical Leave Act)',
      jurisdiction: 'United States',
      requirements: ['12 weeks unpaid leave eligibility', 'Job protection during leave', 'Health benefit continuation', 'Intermittent leave tracking', 'Return to work documentation'],
      impact: 'FMLA eligibility calculation based on tenure and hours worked. Leave tracking with intermittent leave support. Benefits continuation tracking. Return-to-work documentation workflow.',
    },
    {
      regulation: 'EEOC (Equal Employment Opportunity)',
      jurisdiction: 'United States',
      requirements: ['Non-discrimination in hiring and employment', 'Reasonable accommodation', 'Harassment prevention', 'Record keeping for EEO-1 reporting', 'Adverse impact monitoring'],
      impact: 'Demographic data collection per EEO-1 requirements. Adverse impact analysis reports. Reasonable accommodation tracking. Harassment complaint documentation. Data retention per EEOC requirements.',
    },
    {
      regulation: 'IRS Tax Withholding / State Labor Laws',
      jurisdiction: 'United States',
      requirements: ['Federal income tax withholding', 'FICA (Social Security + Medicare)', 'State income tax withholding', 'State disability insurance', 'Multi-state compliance'],
      impact: 'Federal and state tax tables maintained and updated. Multi-state withholding calculation. Tax form generation (W-2, 1099). Quarterly tax filing automation. Year-end reconciliation.',
    },
  ];
}

function businessRulesForHRPayroll(): string[] {
  return [
    'Time entry: timesheets due 2 business days before pay date. Manager approval required before payroll processing.',
    'Overtime: non-exempt employees paid 1.5x for hours over 8/day or 40/week per FLSA. Double time per state law where applicable.',
    'PTO accrual: employees accrue PTO per pay period. Maximum balance per policy. Negative balance requires manager approval.',
    'Payroll deadlines: payroll must be submitted by Tuesday 5 PM for Friday pay date. Late submission results in next pay cycle.',
    'Tax withholding: calculated per federal and state tables. SUTA rate per state experience rating. New hire reporting within 20 days.',
    'Benefits: open enrollment November 1-30. Qualifying life events processed within 30 days of event. COBRA offered within 14 days of qualifying event.',
    'Off-cycle payroll: maximum 2 per month per employee. $25 processing fee per employee. Requires VP approval.',
    'Garnishments: maximum 25% of disposable income per federal limit. Priority order: federal tax, state tax, child support, creditor. Employer fee $1-5 per garnishment.',
  ];
}

// ── DomainPack Constant ──────────────────────────────────────────────────────

export const HR_PAYROLL_PACK: DomainPack = {
  domain: 'hrPayroll',
  name: 'HR & Payroll Management',
  description: 'Complete HR and payroll management platform — from hire to retire with full payroll processing. Covers employee records and self-service, time tracking and scheduling, payroll processing with multi-state tax compliance, benefits administration, recruiting and ATS, performance management, leave management, and compliance with FLSA, FMLA, EEOC, IRS, and state labor regulations.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Employee Records', 'Time & Attendance', 'Payroll', 'Benefits', 'Recruiting', 'Performance'],
    features: [
      'employee-self-service',
      'time-tracking',
      'payroll-processing',
      'benefits-enrollment',
      'recruiting-ats',
      'performance-reviews',
      'leave-management',
      'expense-management',
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['direct-deposit', 'paper-check', 'benefits-enrollment', 'onboarding', 'offboarding'],
    features: [
      'direct-deposit',
      'pay-stubs',
      'tax-documents',
      'benefits-cards',
      'onboarding-kits',
      'termination-package',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'employee-portal',
      'time-clock',
      'pto-request',
      'payslip-viewer',
      'benefits-dashboard',
      'directory',
      'performance-feedback',
      'training-center',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'employee-management',
      'time-tracking',
      'payroll-processing',
      'tax-compliance',
      'benefits-administration',
      'recruiting',
      'reporting',
      'compliance-tools',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'onboarding-journey',
      'company-culture',
      'recognition-programs',
      'learning-platform',
      'career-pathways',
      'employee-communications',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'careers',
      'job-listings',
      'application-form',
      'benefits-info',
      'company-culture',
      'contact-hr',
    ],
    customer: [
      'dashboard',
      'profile',
      'time-clock',
      'pto-management',
      'payslips',
      'benefits',
      'directory',
      'training',
    ],
    admin: [
      'dashboard',
      'employee-management',
      'payroll',
      'benefits',
      'recruiting',
      'reporting',
      'compliance',
      'settings',
    ],
    staff: [
      'payroll-processing',
      'time-approval',
      'employee-records',
      'benefits-enrollment',
      'recruiting-pipeline',
      'report-builder',
      'compliance-checker',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: businessRulesForHRPayroll() as unknown as BusinessRulesSpec,

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    layout: [
      'Clean, professional HR dashboard with employee metrics at a glance',
      'Card-based employee directory with search and filters',
      'Time clock with large, touch-friendly buttons for quick clock-in/out',
      'Tabbed payroll interface with preview, approve, and process steps',
      'Onboarding wizard with step-by-step progress indicator',
      'Mobile-first for employee self-service and time entry',
    ],
    color: [
      'Professional navy (#1A237E) for trust and authority',
      'HR blue (#1565C0) for primary actions and navigation',
      'Success green (#2E7D32) for approved status and completed items',
      'Warning amber (#F57C00) for pending and review status',
      'Error red (#C62828) for denied and compliance issues',
      'Light gray (#F5F5F5) backgrounds for content areas',
      'White cards for data clarity',
    ],
    typography: [
      'Clean sans-serif (Inter) for all text and UI',
      'Bold for employee names and key metrics',
      'Monospace for employee IDs and reference numbers',
      'Clear hierarchy for pay stub and tax documents',
      'High legibility for time clock and mobile screens',
    ],
    interaction: [
      'One-tap time clock with location verification',
      'PTO request with calendar picker and balance display',
      'Pay slip with drill-down to line items',
      'Onboarding checklist with progress tracking',
      'Performance review form with save-as-draft',
      'Benefits enrollment comparison tool',
      'Push notification for pay day and PTO approval',
    ],
    accessibility: [
      'WCAG 2.1 AA compliance',
      'Screen reader support for all employee self-service pages',
      'Keyboard navigation for payroll and time entry',
      'High contrast mode for low-vision employees',
      'Multi-language support for diverse workforce',
      'Form validation with clear error messages',
    ],
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth: 'Multi-role system: Employee (self-service, time entry), Manager (team oversight, approvals), HR Admin (employee management, policy), Payroll Specialist (payroll processing), Recruiter (hiring pipeline), Admin (full platform). JWT with 8h expiry. Refresh tokens with 30d. MFA for payroll and HR admin operations. Session timeout for sensitive pages. Principle of least privilege enforced — employees only see own data, managers see direct reports.',
    data: 'Employee data includes PII, SSN, salary, bank accounts, and benefits enrollment. Payroll data includes wages, taxes, and garnishments. Time data includes clock in/out and PTO usage. Performance data includes reviews and ratings. Background check data for candidates. All data encrypted at rest. Access controlled per role and reporting structure. Audit logging for all sensitive data access.',
    compliance: ['FLSA wage and hour regulations', 'FMLA leave administration', 'EEOC non-discrimination and reporting', 'IRS tax withholding and reporting', 'State labor laws per jurisdiction', 'GDPR for EU employees', 'Background check (FCRA) compliance', 'Benefits regulations (ERISA, HIPAA)'],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Overtime calculation per FLSA (1.5x over 40 hours, 8 hours/day)',
      'Payroll tax calculation per federal and state tables',
      'PTO accrual per employee tenure and policy',
      'Garnishment calculation within 25% disposable income limit',
      'Benefits premium deduction calculation',
      'Multi-state tax withholding calculation',
      'FMLA eligibility determination',
      'EEO-1 demographic reporting aggregation',
    ],
    integration: [
      'Time entry → approval → payroll processing → tax calculation → direct deposit',
      'Employee hired → background check → onboarding → payroll setup → benefits enrollment',
      'Leave requested → manager approval → HR approval → payroll adjustment → return-to-work',
      'Expense submitted → manager approval → finance review → reimbursement → GL posting',
      'Job requisition → posting → candidate sourcing → interview → offer → background check → hire',
    ],
    e2e: [
      'Employee journey: clock in → submit time → manager approves → payroll processed → payslip received → direct deposit',
      'Hiring journey: manager creates requisition → HR approves → posted → interviewed → offered → accepted → background check → onboarded',
      'Benefits journey: open enrollment → employee selects → manager approves → carrier notified → payroll deductions configured',
    ],
  },

  // ── Business Intelligence: Business Model Variants ──────────────────────
  businessModelVariants: businessModelVariantsForHRPayroll(),

  // ── Business Intelligence: Revenue Streams ──────────────────────────────
  revenueStreams: revenueStreamsForHRPayroll(),

  // ── Business Intelligence: User Role Matrix ─────────────────────────────
  userRoleMatrix: userRoleMatrixForHRPayroll(),

  // ── Business Intelligence: Operational Workflows ─────────────────────────
  operationalWorkflows: operationalWorkflowsForHRPayroll(),

  // ── Business Intelligence: State Machines ───────────────────────────────
  stateMachines: stateMachinesForHRPayroll(),

  // ── Business Intelligence: Edge Cases ───────────────────────────────────
  edgeCases: edgeCasesForHRPayroll(),

  // ── Business Intelligence: Integrations ─────────────────────────────────
  integrations: integrationsForHRPayroll(),

  // ── Business Intelligence: Technical Architecture ───────────────────────
  technicalArchitecture: technicalArchitectureForHRPayroll(),

  // ── Business Intelligence: Regulatory Compliance ─────────────────────────
  regulatoryCompliance: regulatoryComplianceForHRPayroll(),
};

// ── DomainModel Constant ──────────────────────────────────────────────────────


export const HR_PAYROLL_DOMAIN: DomainModel = {
  id: HR_PAYROLL_PACK.domain,
  domain: HR_PAYROLL_PACK.domain,
  name: HR_PAYROLL_PACK.name,
  label: HR_PAYROLL_PACK.name,
  category: 'hr',
  description: HR_PAYROLL_PACK.description,
  userRoles: [
    { id: 'employee', name: 'Employee', typicalFeatures: ['employee-portal', 'time-clock', 'pto-request', 'payslip-viewer'], permissions: ['view-self-profile', 'update-self-profile', 'submit-time', 'request-time-off'] },
    { id: 'manager', name: 'Manager', typicalFeatures: ['team-dashboard', 'pto-approval', 'schedule-management', 'performance-reviews'], permissions: ['view-team', 'approve-time-off', 'edit-team-schedule', 'conduct-reviews'] },
    { id: 'hr-admin', name: 'HR Admin', typicalFeatures: ['employee-management', 'policy-management', 'enrollment-management', 'hr-reports'], permissions: ['manage-employees', 'manage-policies', 'handle-grievances', 'manage-enrollment'] },
    { id: 'payroll-specialist', name: 'Payroll Specialist', typicalFeatures: ['payroll-processing', 'tax-calculation', 'direct-deposit', 'w-4-management'], permissions: ['run-payroll', 'view-payroll-data', 'process-taxes', 'issue-checks'] },
    { id: 'recruiter', name: 'Recruiter', typicalFeatures: ['job-board', 'candidate-tracking', 'interview-scheduling', 'offer-management'], permissions: ['create-jobs', 'manage-candidates', 'schedule-interviews', 'create-offers'] },
    { id: 'admin', name: 'Platform Admin', typicalFeatures: ['dashboard', 'organization-management', 'billing', 'compliance'], permissions: ['*'] },
  ],
  role: 'employee',
  standardFeatures: [],
  businessModels: [
    { modelType: 'hr-saas-platform', revenueStreams: ['subscription-fees', 'payroll-add-on', 'benefits-module'], costStructure: ['engineering', 'support', 'infrastructure', 'compliance'], pricingStrategy: ['per-employee-per-month', 'tiered', 'add-on-modules'] },
    { modelType: 'payroll-processing', revenueStreams: ['processing-fees', 'tax-filing', 'off-cycle-payroll'], costStructure: ['compliance-maintenance', 'bank-integration', 'support'], pricingStrategy: ['per-employee-per-run', 'base-fee'] },
    { modelType: 'benefits-administration', revenueStreams: ['pepm-fees', 'implementation', 'carrier-integration'], costStructure: ['carrier-relations', 'technology', 'support'], pricingStrategy: ['per-employee-per-month', 'setup-fee'] },
  ],
  technicalPatterns: [
    { category: 'processing', name: 'Multi-Jurisdiction Tax Engine', description: 'Configurable tax calculation per federal, state, and local rules', rationale: 'Accurate tax withholding is legally required with severe penalties for errors' },
    { category: 'compliance', name: 'Audit Trail for Payroll', description: 'Tamper-evident logging of all payroll changes and approvals', rationale: 'Payroll changes require audit trail for compliance and dispute resolution' },
    { category: 'workflow', name: 'Approval Workflow Engine', description: 'Configurable multi-level approval chains for payroll and expenses', rationale: 'Different organizations have different approval requirements' },
    { category: 'integration', name: 'Direct Deposit ACH Processing', description: 'NACHA-compliant ACH file generation for payroll deposits', rationale: 'ACH is the primary method for payroll disbursement' },
  ],
  operationalLifecycle: [
    { id: 'hire', name: 'Hire', description: 'Employee recruited, hired, and onboarded into the system' },
    { id: 'manage', name: 'Manage', description: 'Employee managed through time, performance, and development' },
    { id: 'pay', name: 'Pay', description: 'Employee paid with accurate taxes and deductions' },
    { id: 'offboard', name: 'Offboard', description: 'Employee separated with final pay and benefits termination' },
  ],
  designPrinciples: [
    { name: 'Payroll Accuracy First', description: 'Clear preview and review before any payroll run' },
    { name: 'Self-Service Simplicity', description: 'Employees can manage time, PTO, and documents independently' },
    { name: 'Compliance Transparency', description: 'Tax calculations and compliance status clearly visible' },
  ],
  securityConsiderations: [
    { category: 'auth', name: 'Role-based access', description: 'Employees see only own data; managers see direct reports', severity: 'high' },
    { category: 'data', name: 'SSN and bank account protection', description: 'Sensitive payroll data encrypted', severity: 'critical' },
    { category: 'compliance', name: 'FLSA/FMLA compliance', description: 'Wage, hour, and leave rules enforced', severity: 'high' },
    { category: 'compliance', name: 'EEOC reporting', description: 'Non-discrimination data collection and reporting', severity: 'medium' },
  ],
  regulations: [
    { name: 'FLSA', requirements: ['Overtime rules', 'Minimum wage', 'Record keeping'] },
    { name: 'FMLA', requirements: ['Leave eligibility', 'Job protection', 'Benefits continuation'] },
    { name: 'EEOC', requirements: ['Non-discrimination', 'Reasonable accommodation', 'EEO-1 reporting'] },
    { name: 'IRS', requirements: ['Tax withholding', 'W-2/1099 filing', 'Quarterly 941'] },
  ],
  testingRequirements: [
    { category: 'unit', name: 'Tax calculation', description: 'Multi-jurisdiction tax withholding accuracy', priority: 'critical' },
    { category: 'unit', name: 'Overtime calculation', description: 'FLSA overtime rules validation', priority: 'high' },
    { category: 'integration', name: 'Payroll to deposit', description: 'Processing → tax → direct deposit flow', priority: 'high' },
    { category: 'e2e', name: 'Employee lifecycle', description: 'Hire → manage → pay → offboard', priority: 'medium' },
  ],
  workflows: [
    { id: 'hire-to-retire', name: 'Hire to Retire', steps: ['requisition', 'hire', 'onboard', 'manage', 'review', 'offboard'], entities: ['requisition', 'employee', 'review', 'termination'] },
    { id: 'payroll-to-pay', name: 'Payroll to Pay', steps: ['period-open', 'time', 'adjustments', 'calc-tax', 'preview', 'approve', 'process', 'deposit'], entities: ['time-entry', 'payroll-run', 'tax', 'deposit'] },
    { id: 'expense-to-reimburse', name: 'Expense to Reimburse', steps: ['submit', 'approve', 'review', 'process', 'deposit'], entities: ['expense', 'approval', 'reimbursement'] },
  ],
  entities: [
    { name: 'Employee', description: 'Employee with personal, employment, and compensation details', invariants: ['SSN encrypted', 'manager relationship valid', 'active employment for payroll'] },
    { name: 'PayrollRun', description: 'Payroll run with time entries, adjustments, and tax calculations', invariants: ['must balance to zero', 'taxes per jurisdiction', 'approved before processing'] },
    { name: 'LeaveRequest', description: 'Leave request with approval workflow and balance check', invariants: ['balance sufficient', 'approval chain complete'] },
  ],
  invariants: ['payroll must balance to zero', 'SSN and financial data encrypted', 'FLSA overtime enforced', 'taxes per jurisdiction calculated'],
  constraints: ['time submission 2 days before pay date', 'PTO balance non-negative without approval', 'off-cycle max 2 per month', 'minimum wage per state law'],
  financialFlows: [
    { name: 'payroll-wages', direction: 'out', trigger: 'pay-run-completed' },
    { name: 'tax-withholding', direction: 'out', trigger: 'pay-run-completed' },
    { name: 'benefits-premium', direction: 'out', trigger: 'benefits-deduction' },
    { name: 'garnishments', direction: 'out', trigger: 'garnishment-order' },
    { name: 'expense-reimbursement', direction: 'out', trigger: 'reimbursement-approved' },
  ],
  successMetrics: ['payroll-accuracy-rate', 'time-to-hire', 'employee-retention-rate', 'pto-utilization', 'payroll-processing-time', 'compliance-audit-score', 'cost-per-hire'],
  analytics: { tracked: ['headcount', 'turnover', 'payroll-costs', 'time-tracking', 'pto-usage', 'diversity-metrics'], dashboards: ['hr-dashboard', 'payroll-dashboard', 'recruiting-dashboard', 'compliance-dashboard'] },
  securityRequirements: ['jwt-auth', 'role-based-access', 'data-encryption', 'audit-logging', 'mfa-sensitive-operations', 'pci-compliance-direct-deposit'],
  regulatory: [
    { regulation: 'FLSA', applies: true, notes: 'Wage and hour compliance' },
    { regulation: 'FMLA', applies: true, notes: 'Leave administration' },
    { regulation: 'EEOC', applies: true, notes: 'Non-discrimination and reporting' },
    { regulation: 'IRS Tax', applies: true, notes: 'Federal and state withholding' },
  ],
};
