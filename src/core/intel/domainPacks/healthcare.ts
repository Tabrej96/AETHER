/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Healthcare Management Domain Pack
 *
 * Complete healthcare management platform covering appointment scheduling, electronic
 * medical records, prescription management, lab results integration, billing and
 * insurance, telehealth, patient portal, staff management, compliance reporting,
 * wait-time notifications, care reminders, health tracking, and clinical workflows.
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

export const HEALTHCARE_PACK: DomainPack = {
  domain: 'healthcare',
  name: 'Healthcare Management',
  description:
    'Complete healthcare management platform covering appointment scheduling, electronic medical records, prescription management, lab results integration, billing and insurance, telehealth, patient portal, staff management, compliance reporting, wait-time notifications, care reminders, health tracking, and clinical workflows.',

  // ── Catalog ────────────────────────────────────────────────────────────────
  catalog: {
    categories: [
      'Appointments',
      'Medical Records',
      'Prescriptions',
      'Lab Results',
      'Billing',
      'Telehealth',
    ],
    features: [
      'appointment-scheduling',
      'provider-search',
      'insurance-verification',
      'patient-intake',
      'medical-history',
      'vital-signs',
      'diagnosis-codes',
      'treatment-plans',
      'prescription-management',
      'medication-interaction',
      'lab-order-entry',
      'result-review',
      'imaging-integration',
      'billing-codes',
      'claim-submission',
      'payment-processing',
      'telehealth-sessions',
      'patient-portal',
      'care-coordination',
      'clinical-dashboard',
    ],
  },

  // ── Fulfillment ────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['in-person', 'telehealth', 'home-visit', 'emergency'],
    features: [
      'appointment-scheduling',
      'prescription-management',
      'lab-integration',
      'insurance-verification',
    ],
  },

  // ── Customer Features ──────────────────────────────────────────────────────
  customer: {
    features: [
      'patient-portal',
      'appointment-booking',
      'records-access',
      'prescription-refills',
      'secure-messaging',
    ],
  },

  // ── Operations Features ────────────────────────────────────────────────────
  operations: {
    features: [
      'scheduling',
      'billing',
      'insurance-claims',
      'compliance-reporting',
      'staff-management',
    ],
  },

  // ── Experience Features ────────────────────────────────────────────────────
  experience: {
    features: [
      'wait-time-notifications',
      'care-reminders',
      'health-tracking',
      'telehealth-integration',
    ],
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {
    public: ['find-provider', 'insurance', 'patient-education'],
    customer: ['portal', 'appointments', 'records', 'billing'],
    admin: ['dashboard', 'user-mgmt', 'reports', 'compliance', 'billing'],
    staff: ['schedule', 'patients', 'records', 'prescriptions'],
  },

  // ── Business Rules ─────────────────────────────────────────────────────────
  businessRules: {
    appointments: [
      'Appointment types: Routine (15-30 min), Follow-up (10-15 min), New Patient (45-60 min), Procedure (varies), Emergency (immediate). Booking rules: 2-week advance maximum for routine, same-day for urgent, PCP referral required for specialist visits. Cancellation policy: 24-hour notice required, no-show fee $50 for first offense, $100 for repeat. Waitlist enabled when fully booked with auto-notification on cancellation. Insurance verification required before first visit. Telehealth appointments eligible for same conditions as in-person per provider discretion. Appointment reminders: SMS 24h before, email 48h before.',
    ],

    medicalRecords: [
      'Electronic Health Record (EHR) with full patient history, diagnoses, treatments, medications, allergies, and immunizations. Records segmented by access level: patient (own records), provider (assigned patients), admin (org-wide with audit). Record locking during active documentation to prevent concurrent edits. Audit trail logs all record access with user ID, timestamp, and action. Records immutable once signed by provider — amendments via addendum with reason. Data retention: 7 years after last encounter or per state requirement (10 years for minors). Patient data export in FHIR R4 format. Interoperability with HIEs via HL7 and FHIR APIs. De-identified data available for research with IRB approval.',
    ],

    prescriptions: [
      'e-Prescribing via NCPDP SCRIPT standard with real-time formulary checking. Controlled substances (Schedule II-V) require DEA registration and follow state-specific limits. Refill rules: 2 days before depletion alert sent, maximum 90-day supply for chronic medications, 30-day for controlled substances. Drug interaction checking against current medications and allergies. Prior authorization workflow for non-formulary medications. Medication history synced from state PDMP (Prescription Drug Monitoring Program) where available. Prescription status: Active, Filled, Pending, Cancelled, Expired. Discontinuation requires documented clinical reason. Pharmacy selection with preferred network prioritization.',
    ],

    billing: [
      'Billing codes mapped to CPT, ICD-10, and HCPCS standards. Insurance verification at scheduling with real-time eligibility checks. Claim submission via ANSI 837P standard. Claim scrubbing before submission to reduce rejections. Payment posting: insurance EOB auto-matched to claims, patient responsibility calculated and billed. Denial management with reason codes and appeal workflow. Patient statements generated monthly with itemized charges. Payment plans available for balances over $500 with 0% APR for 12 months. Write-offs require supervisor approval with documented reason. Days in A/R target: <45 days. Clean claim rate target: >95%.',
    ],

    compliance: [
      'HIPAA compliance: access controls, audit logging, encryption, BAA with all sub-processors. HITECH: breach notification within 60 days, security rule enforcement. 21st Century Cures: interoperability with APIs, information blocking prevention. GDPR: EU patient data processing with consent management. SOC 2 Type II readiness for cloud infrastructure. Annual risk assessment documented with remediation plan. Security incident response with 72-hour notification. Business Associate Agreements (BAA) in place with all vendors handling PHI. Minimum Necessary Standard enforced for all PHI access. Breach notification procedure: internal investigation, affected patient notification, HHS reporting for 500+ affected.',
    ],

    clinical: [
      'Clinical decision support (CDS) alerts for drug interactions, allergy warnings, duplicate therapies, and guideline-based care recommendations. Smart orders with pre-configured order sets for common conditions. Order sets include medication doses, lab panels, imaging protocols per evidence-based guidelines. Clinical pathways for chronic conditions (diabetes, hypertension, COPD) with milestone tracking. Vital signs trended over time with graph visualization and abnormal flagging. Lab result critical values auto-escalated to responsible provider. Referral management with specialist matching and care coordination. Multidisciplinary team notes for complex cases with role-based visibility. Patient safety alerts: fall risk, allergy, isolation precautions displayed prominently.',
    ],
  },

  // ── Design Principles ───────────────────────────────────────────────────────
  design: {
    layout: [
      'clean-clinical',
      'high-contrast',
      'accessibility-first',
    ],
    color: [
      'calm-blues',
      'alert-red',
    ],
    typography: [
      'readable-body',
      'clear-headers',
    ],
    interaction: [
      'quick-schedule',
      'form-validation',
    ],
    accessibility: [
      'WCAG-2.1-AAA',
      'screen-reader',
      'keyboard-nav',
    ],
  },

  // ── Security Requirements ──────────────────────────────────────────────────
  security: {
    auth:
      'MFA with role-based clinical access. MFA mandatory for all clinical staff (TOTP, SMS, or push notification). Role-based access: Patient (own records, appointments, messaging), Provider (assigned patients, documentation, orders), Nurse (vitals, medication administration, care notes), Admin (user management, billing, reports, compliance). Break-glass access for emergencies with mandatory post-access documentation. Session timeout: 15 minutes for clinical terminals, 30 minutes for patient portal. All access to PHI logged with user ID, timestamp, and patient ID. Delegation of access allowed with time-limited scope.',

    data:
      'E2E encrypted, HIPAA compliant audit trail. All Protected Health Information (PHI) encrypted at rest (AES-256) and in transit (TLS 1.3). PHI includes: demographics, medical history, diagnoses, treatments, medications, lab results, imaging, billing. Audit trail captures: who accessed what, when, from where, and what action was taken. Data loss prevention (DLP) monitoring for unauthorized PHI transfers. Database access restricted to application layer — no direct DB access. Data residency configurable per jurisdiction. Backup encryption with separate key management. PHI retention per state and federal regulations with automated archival and secure deletion.',

    compliance: [
      'HIPAA',
      'HITECH',
      '21st Century Cures',
      'GDPR',
    ],
  },

  // ── Testing Requirements ───────────────────────────────────────────────────
  testing: {
    unit: [
      'Insurance eligibility check: real-time verification with payer response parsing',
      'Appointment slot availability: conflict detection across providers and rooms',
      'Claim amount calculation: CPT codes with modifiers, ICD-10 diagnosis pairing',
      'Drug interaction check: current medications against new prescription',
      'Lab result normal range evaluation: age/gender/units-aware flagging',
      'Authorization expiry check: prior auth remaining days and renewal alert',
      'Copay calculation: plan-specific with deductible tracking and out-of-pocket max',
      'Clinical alert trigger: CDS rule evaluation against patient conditions and medications',
      'Referral status tracking: pending, approved, used, expired lifecycle',
    ],
    integration: [
      'Appointment booking → insurance verification → appointment confirmation → reminder → check-in → visit → documentation → billing → claim submission',
      'Prescription order → drug interaction check → formulary verification → e-prescribing → pharmacy notification → refill tracking',
      'Lab order entry → specimen collection → lab processing → result import → provider notification → result display to patient → follow-up scheduling',
      'Patient registration → insurance verification → visit → documentation → coding → claim generation → payer submission → EOB processing → patient billing',
      'Telehealth session → connection → documentation → prescription if needed → follow-up appointment scheduling',
      'Provider schedules patient → accesses records → documents visit → orders labs → reviews results → modifies treatment plan → sends to patient portal',
    ],
    e2e: [
      'New patient registration → insurance verification → appointment scheduling → telehealth visit → prescription → lab order → results review → follow-up appointment → billing',
      'Returning patient → books appointment → check-in → vital signs recorded → provider exam → diagnosis → treatment plan → prescription → visit summary → billing',
      'Complex care: specialist referral → coordination → multiple visits → care team notes → treatment plan updates → patient portal notifications → outcome tracking',
    ],
  },
};

// ── DomainModel Adapter ──────────────────────────────────────────────────────


function rolesForHealthcare(): DomainModel['userRoles'] {
  return [
    { id: 'patient', name: 'Patient', typicalFeatures: ['patient-portal', 'appointment-booking', 'records-access', 'prescription-refills'], permissions: ['view-own', 'book-appointments', 'message-provider', 'request-refills'] },
    { id: 'provider', name: 'Provider', typicalFeatures: ['schedule', 'patients', 'records', 'prescriptions'], permissions: ['view-assigned', 'document', 'order', 'prescribe', 'message'] },
    { id: 'nurse', name: 'Nurse', typicalFeatures: ['patients', 'vitals', 'medication'], permissions: ['view-assigned', 'record-vitals', 'administer', 'document'] },
    { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'reports', 'compliance', 'billing'], permissions: ['*', 'manage-users', 'view-billing', 'run-reports'] },
  ];
}

function featuresForHealthcare(): DomainModel['standardFeatures'] {
  const all: DomainModel['standardFeatures'] = [];
  const pushGroup = (label: string, priority: string, features: string[]) => {
    for (const f of features) {
      all.push({ category: label, name: f, description: '', priority });
    }
  };
  pushGroup('catalog', 'essential', HEALTHCARE_PACK.catalog.features);
  pushGroup('fulfillment', 'expected', HEALTHCARE_PACK.fulfillment.features);
  pushGroup('customer', 'expected', HEALTHCARE_PACK.customer.features);
  pushGroup('operations', 'essential', HEALTHCARE_PACK.operations.features);
  pushGroup('experience', 'differentiating', HEALTHCARE_PACK.experience.features);
  for (const [group, items] of Object.entries(HEALTHCARE_PACK.components)) {
    if (Array.isArray(items)) pushGroup(`components:${group}`, 'essential', items);
  }
  for (const [rule] of Object.entries(HEALTHCARE_PACK.businessRules)) {
    all.push({ category: 'business', name: rule, description: '', priority: 'essential' });
  }
  return all;
}

function businessModelsForHealthcare(): DomainModel['businessModels'] {
  return [
    { modelType: 'healthcare-practice', revenueStreams: ['insurance-billing', 'self-pay', 'telehealth-fees', 'ancillary-services'], costStructure: ['staff', 'facility', 'equipment', 'supplies', 'malpractice-insurance'], pricingStrategy: ['fee-for-service', 'capitation', 'bundled-payments'] },
  ];
}

function technicalPatternsForHealthcare(): DomainModel['technicalPatterns'] {
  return [
    { category: 'standard', name: 'HL7 / FHIR', description: 'Health Level 7 messaging and FHIR R4 APIs for interoperability', rationale: 'Required for EHR integration, lab systems, and HIEs' },
    { category: 'standard', name: 'NCPDP SCRIPT', description: 'e-Prescribing standard for pharmacy communication', rationale: 'Required for electronic prescription transmission' },
    { category: 'data', name: 'Audit Logging', description: 'Comprehensive PHI access audit trail with tamper-evident storage', rationale: 'HIPAA requirement for all PHI access' },
    { category: 'integration', name: 'Telehealth SDK', description: 'WebRTC-based video consultation with screen sharing and recording', rationale: 'Core patient-provider communication channel' },
  ];
}

function operationalLifecycleForHealthcare(): DomainModel['operationalLifecycle'] {
  return [
    { id: 'register', name: 'Register', description: 'Patient registration, insurance verification, intake forms' },
    { id: 'schedule', name: 'Schedule', description: 'Appointment scheduling, reminders, check-in' },
    { id: 'visit', name: 'Visit', description: 'Clinical encounter, documentation, orders, prescriptions' },
    { id: 'follow-up', name: 'Follow-up', description: 'Results review, care coordination, follow-up appointments' },
    { id: 'bill', name: 'Bill', description: 'Coding, claim submission, payment posting, patient billing' },
  ];
}

function designPrinciplesForHealthcare(): DomainModel['designPrinciples'] {
  const principles: DomainModel['designPrinciples'] = [];
  const layout: Record<string, string> = {
    'clean-clinical': 'Clean, uncluttered interface that reduces cognitive load in high-stakes clinical settings',
    'high-contrast': 'High contrast ratios for readability under varied clinical lighting conditions',
    'accessibility-first': 'All features accessible without a mouse, with screen reader compatibility',
  };
  const color: Record<string, string> = {
    'calm-blues': 'Calming blue tones for normal status and primary actions in clinical setting',
    'alert-red': 'High-visibility red for critical alerts, abnormal values, and emergency actions',
  };
  const typography: Record<string, string> = {
    'readable-body': 'Large, readable body text (14-16px minimum) with clear letter spacing',
    'clear-headers': 'Bold, unambiguous section headers for rapid clinical navigation',
  };
  const interaction: Record<string, string> = {
    'quick-schedule': 'Fast appointment scheduling with intelligent slot suggestions and conflict prevention',
    'form-validation': 'Real-time form validation with clear error messages and required field indicators',
  };
  const accessibility: Record<string, string> = {
    'WCAG-2.1-AAA': 'WCAG 2.1 AAA compliance for all patient-facing and clinical interfaces',
    'screen-reader': 'Full screen reader support with ARIA labels and live regions for dynamic content',
    'keyboard-nav': 'Complete keyboard-only navigation for all clinical workflows',
  };
  for (const [k, v] of Object.entries(layout)) principles.push({ name: `Layout: ${k}`, description: v });
  for (const [k, v] of Object.entries(color)) principles.push({ name: `Color: ${k}`, description: v });
  for (const [k, v] of Object.entries(typography)) principles.push({ name: `Typography: ${k}`, description: v });
  for (const [k, v] of Object.entries(interaction)) principles.push({ name: `Interaction: ${k}`, description: v });
  for (const [k, v] of Object.entries(accessibility)) principles.push({ name: `Accessibility: ${k}`, description: v });
  return principles;
}

function securityConsiderationsForHealthcare(): DomainModel['securityConsiderations'] {
  return [
    { category: 'auth', name: 'MFA with role-based clinical access', description: HEALTHCARE_PACK.security.auth, severity: 'critical' },
    { category: 'data', name: 'E2E encrypted, HIPAA compliant audit trail', description: HEALTHCARE_PACK.security.data, severity: 'critical' },
    { category: 'compliance', name: 'HIPAA', description: 'Health Insurance Portability and Accountability Act — PHI protection mandatory', severity: 'critical' },
    { category: 'compliance', name: 'HITECH', description: 'Health Information Technology for Economic and Clinical Health — breach notification and security rules', severity: 'high' },
    { category: 'compliance', name: '21st Century Cures', description: 'Interoperability, information blocking prevention, and patient access', severity: 'high' },
    { category: 'compliance', name: 'GDPR', description: 'EU patient data protection with special category data handling', severity: 'high' },
  ];
}

function regulationsForHealthcare(): DomainModel['regulations'] {
  return [
    { name: 'HIPAA', requirements: ['PHI access controls', 'Audit logging', 'Breach notification', 'BAA with vendors', 'Minimum necessary standard'] },
    { name: 'HITECH', requirements: ['Breach notification within 60 days', 'Security risk assessment', 'Encryption requirements'] },
    { name: '21st Century Cures', requirements: ['Information blocking prevention', 'API access for patients', 'Interoperability standards'] },
    { name: 'GDPR', requirements: ['Special category data consent', 'Right to erasure', 'Data portability', 'DPA with processors'] },
  ];
}

function testingRequirementsForHealthcare(): DomainModel['testingRequirements'] {
  const all: DomainModel['testingRequirements'] = [];
  for (const t of HEALTHCARE_PACK.testing.unit) all.push({ category: 'unit', name: t, description: '', priority: 'high' });
  for (const t of HEALTHCARE_PACK.testing.integration) all.push({ category: 'integration', name: t, description: '', priority: 'high' });
  for (const t of HEALTHCARE_PACK.testing.e2e) all.push({ category: 'e2e', name: t, description: '', priority: 'medium' });
  return all;
}

export const HEALTHCARE_DOMAIN: DomainModel = {
  id: HEALTHCARE_PACK.domain,
  domain: HEALTHCARE_PACK.domain,
  name: HEALTHCARE_PACK.name,
  label: HEALTHCARE_PACK.name,
  category: 'healthcare',
  description: HEALTHCARE_PACK.description,
  userRoles: rolesForHealthcare(),
  role: 'provider',
  standardFeatures: featuresForHealthcare(),
  businessModels: businessModelsForHealthcare(),
  technicalPatterns: technicalPatternsForHealthcare(),
  operationalLifecycle: operationalLifecycleForHealthcare(),
  designPrinciples: designPrinciplesForHealthcare(),
  securityConsiderations: securityConsiderationsForHealthcare(),
  regulations: regulationsForHealthcare(),
  testingRequirements: testingRequirementsForHealthcare(),
  workflows: [
    { id: 'appointment', name: 'Appointment Flow', steps: ['request', 'verify-insurance', 'confirm', 'check-in', 'visit', 'document', 'bill'], entities: ['appointment', 'patient', 'provider'] },
    { id: 'prescription', name: 'Prescription Flow', steps: ['order', 'check-interactions', 'verify-formulary', 'e-prescribe', 'pharmacy', 'refill'], entities: ['prescription', 'medication', 'pharmacy'] },
    { id: 'billing', name: 'Billing Flow', steps: ['document', 'code', 'scrub', 'submit-claim', 'receive-EOB', 'post-payment', 'bill-patient'], entities: ['claim', 'insurance', 'payment'] },
  ],
  entities: [
    { name: 'Patient', description: 'Individual receiving care with demographic, medical, and insurance data', invariants: ['must have unique identifier', 'consent required for data sharing', 'demographics must be verified'] },
    { name: 'Appointment', description: 'Scheduled clinical encounter with provider, time, and type', invariants: ['provider must be available', 'insurance must be verified', 'no double-booking'] },
    { name: 'Medical Record', description: 'Comprehensive patient health record including diagnoses, treatments, and history', invariants: ['provider must authenticate documentation', 'access must be audited', 'amendments require addendum'] },
  ],
  invariants: ['PHI access must be audited', 'prescriptions require provider authentication', 'insurance verification before first visit', 'lab results require provider review before patient access'],
  constraints: ['only assigned provider can document', 'prescription requires active patient-provider relationship', 'billing requires coded encounter', 'audit log cannot be modified'],
  financialFlows: [
    { name: 'insurance-payment', direction: 'in', trigger: 'claim-adjudication' },
    { name: 'patient-payment', direction: 'in', trigger: 'patient-statement' },
    { name: 'provider-compensation', direction: 'out', trigger: 'payroll-cycle' },
    { name: 'pharmacy-cost', direction: 'out', trigger: 'prescription-fulfillment' },
  ],
  successMetrics: ['patient-wait-time', 'claim-clean-rate', 'days-in-ar', 'patient-satisfaction', 'provider-utilization', 'appointment-show-rate'],
  analytics: { tracked: ['appointments', 'lab-results', 'prescriptions', 'billing', 'patient-outcomes'], dashboards: ['clinical', 'billing', 'scheduling', 'compliance'] },
  securityRequirements: ['mfa', 'phi-encryption', 'hipaa-audit-logging', 'role-based-access', 'breach-notification'],
  regulatory: [
    { regulation: 'HIPAA', applies: true, notes: 'Mandatory PHI protection and audit requirements' },
    { regulation: 'HITECH', applies: true, notes: 'Breach notification and security rule enforcement' },
    { regulation: '21st Century Cures', applies: true, notes: 'Interoperability and patient access' },
    { regulation: 'GDPR', applies: true, notes: 'EU patient data as special category' },
  ],
};
