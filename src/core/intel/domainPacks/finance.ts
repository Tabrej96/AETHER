/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Financial Services / Fintech Domain Pack
 *
 * Complete financial services platform covering account management, fund transfers,
 * investment products, loans, cards, insurance, fraud detection, compliance reporting,
 * audit trails, multi-currency support, real-time notifications, financial insights,
 * goal tracking, and AI-powered financial advisory.
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

export const FINANCE_PACK: DomainPack = {
  domain: 'finance',
  name: 'Financial Services / Fintech',
  description:
    'Complete financial services platform covering account management, fund transfers, investment products, loans, cards, insurance, fraud detection, compliance reporting, audit trails, multi-currency support, real-time notifications, financial insights, goal tracking, and AI-powered financial advisory.',

  // ── Catalog ────────────────────────────────────────────────────────────────
  catalog: {
    categories: [
      'Accounts',
      'Transfers',
      'Investments',
      'Loans',
      'Cards',
      'Insurance',
    ],
    features: [
      'checking-accounts',
      'savings-accounts',
      'multi-currency',
      'internal-transfers',
      'external-transfers',
      'wire-transfers',
      'stock-trading',
      'mutual-funds',
      'etf-trading',
      'retirement-accounts',
      'crypto-trading',
      'personal-loans',
      'mortgages',
      'auto-loans',
      'credit-cards',
      'debit-cards',
      'virtual-cards',
      'life-insurance',
      'health-insurance',
      'property-insurance',
    ],
  },

  // ── Fulfillment ────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['instant', 'ACH', 'wire', 'check'],
    features: [
      'fraud-detection',
      'compliance-reporting',
      'audit-trails',
      'multi-currency',
    ],
  },

  // ── Customer Features ──────────────────────────────────────────────────────
  customer: {
    features: [
      'account-dashboard',
      'transactions',
      'transfers',
      'investments',
      'statements',
    ],
  },

  // ── Operations Features ────────────────────────────────────────────────────
  operations: {
    features: [
      'fraud-monitoring',
      'compliance',
      'reporting',
      'risk-assessment',
      'customer-verification',
    ],
  },

  // ── Experience Features ────────────────────────────────────────────────────
  experience: {
    features: [
      'real-time-notifications',
      'financial-insights',
      'goal-tracking',
      'ai-advisor',
    ],
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {
    public: ['landing', 'rates', 'resources'],
    customer: ['dashboard', 'accounts', 'transfers', 'settings'],
    admin: ['dashboard', 'user-mgmt', 'compliance', 'reports', 'risk'],
    staff: ['support', 'operations', 'verification'],
  },

  // ── Business Rules ─────────────────────────────────────────────────────────
  businessRules: {
    accounts: [
      'Account types: Personal Checking, Personal Savings, Business Checking, Business Savings, Joint Accounts, Trust Accounts. Minimum balance requirements per account type with monthly maintenance fees for non-compliance. Interest calculation: daily balance method with monthly compounding for savings. Account opening requires KYC/AML verification: government-issued ID, proof of address, SSN/Tax ID. Account closure: 3-day notice period, outstanding transactions must settle, remaining balance issued as check. Dormant accounts (no activity for 12 months) flagged with notification. FDIC insured up to $250,000 per depositor per bank. Account statements generated monthly with transaction detail and YTD summary.',
    ],

    transfers: [
      'Internal transfers (between own accounts): instant processing, no fees, 24/7 availability. ACH transfers: 1-3 business days, $0 fee for standard, $5 for expedited (next-day). Wire transfers: same-day domestic ($25 outgoing, $0 incoming), 1-2 days international ($45 outgoing, $0 incoming). Transfer limits: daily $10,000 standard, $50,000 with enhanced verification, $500,000 for Premier customers. International transfers: currency conversion at mid-market rate + 0.5% markup, SWIFT messaging, regulatory reporting for transfers over $10,000. Recurring transfers: daily, weekly, monthly with calendar-based scheduling. Transfer holds: 1-5 business days for new accounts (>7 days old) and large deposits (>$10,000).',
    ],

    investments: [
      'Investment products: individual stocks, ETFs, mutual funds, bonds, options, crypto. Trading hours: US equities 9:30 AM - 4:00 PM ET, extended hours 4:00 AM - 8:00 PM ET for qualified accounts. Crypto: 24/7 trading with $1,000 daily limit for unverified, $100,000 for verified accounts. Commission-free trading for US stocks and ETFs, $0.99 per options contract, 0.25% spread for crypto. Margin: 50% minimum equity requirement, margin call at 35%, forced liquidation at 25%. Day trading: Pattern Day Trader rule ($25,000 minimum equity for 3+ day trades in 5 days). Tax reporting: 1099-B for US accounts, annual cost basis tracking. Risk disclosure required for options, margin, and crypto trading.',
    ],

    loans: [
      'Loan products: Personal ($1,000-$50,000, 6-60 months), Auto ($5,000-$100,000, 24-84 months), Mortgage ($50,000-$2,000,000, 10-30 years). Interest rates: Personal (7.99%-35.99% APR based on credit), Auto (4.49%-18.99% APR), Mortgage (5.25%-8.75% APR based on rate type and credit). Credit requirements: minimum 580 FICO for personal, 620 for auto, 640 for mortgage. Pre-approval available for mortgages with soft credit pull. Origination fees: personal (1-6%), auto ($0-$500), mortgage (0.5-1% of loan amount). Prepayment penalty: none for personal and auto, none for mortgage after 3 years. Late payment fee: 5% of payment after 15-day grace period. Default: 90 days past due triggers collection process and credit reporting.',
    ],

    fraud: [
      'Real-time fraud monitoring using ML models scoring every transaction on 40+ signals. Transaction flags: amount deviation, location anomaly, velocity checks, device fingerprint, behavioral biometrics. Risk scoring: 0-100 scale with thresholds: 0-30 (auto-approve), 31-70 (step-up auth), 71-100 (auto-decline + review). Step-up auth: SMS OTP, push notification, security questions, biometric verification. Fraud cases reviewed within 2 hours during business hours, 4 hours after hours. Provisional credit issued within 1 business day for confirmed fraud. Chargeback management: customer dispute accepted with documentation, merchant notification within 24 hours. Account freeze: temporary hold on suspicious activity with customer notification. Blacklist: compromised cards/accounts flagged with permanent or time-based restriction. AML monitoring: SAR filing for transactions over $10,000 or suspicious patterns.',
    ],

    cards: [
      'Card types: Standard Debit, Premium Debit, Standard Credit, Premium Credit (1.5% cashback), Business Credit. Physical cards: 5-7 business days shipping, $0 replacement. Virtual cards: instant issuance, 16-digit number, single-use or recurring. Card limits: Debit ($2,500/day, $500 ATM), Standard Credit ($5,000), Premium Credit ($25,000), Business (custom). PIN-based debit: 4-6 digit PIN required for ATM and PIN transactions. Contactless payments: Apple Pay, Google Pay, Samsung Pay with tokenization. Fraud liability: $0 for reported unauthorized charges within 2 business days, $50 within 60 days, full amount after 60 days. Card freeze/unfreeze via app instantly. Replacement cards: expedited 2-day available ($15 fee). Annual fees: Standard Debit ($0), Premium Debit ($4.99/month), Standard Credit ($0), Premium Credit ($95/year waived with $6,000 spend).',
    ],
  },

  // ── Design Principles ───────────────────────────────────────────────────────
  design: {
    layout: [
      'data-dense',
      'transaction-focused',
      'clear-hierarchy',
    ],
    color: [
      'trust-blue',
      'alert-red',
      'positive-green',
    ],
    typography: [
      'monospace-amounts',
      'clear-labels',
    ],
    interaction: [
      'quick-transfer',
      'biometric-auth',
    ],
    accessibility: [
      'high-contrast',
      'screen-reader',
    ],
  },

  // ── Security Requirements ──────────────────────────────────────────────────
  security: {
    auth:
      'MFA, biometric, hardware token support. Authentication tiers: Standard (password + MFA), Enhanced (biometric + MFA), Maximum (hardware token + biometric + MFA). Biometric: fingerprint, Face ID, voice recognition. Hardware token: YubiKey, FIDO2 security keys. Session management: 15-minute idle timeout, 8-hour absolute timeout, concurrent session limit (5 devices). Device registration with push notification approval for new devices. Login alerts for new devices/locations. Password requirements: 12+ characters, complexity, no common passwords, 90-day rotation for admin. Account lockout after 5 failed attempts with 15-minute cooldown. Password reset via verified email/SMS with 1-hour token expiry.',

    data:
      'AES-256 encrypted, SOC2 Type II. Financial data: account balances, transaction history, investment positions, loan details, card information. PII: name, address, SSN, date of birth, income, employment. Transaction data: amounts, timestamps, merchant info, location, device. Encryption: AES-256 at rest, TLS 1.3 in transit, field-level encryption for SSN and account numbers. Data retention: transaction history 7 years, audit logs 7 years, application logs 90 days. Backup encryption with separate key management. Penetration testing quarterly, vulnerability scanning monthly. Intrusion detection and prevention systems (IDS/IPS) with 24/7 monitoring. SOC 2 Type II audited annually with public report.',

    compliance: [
      'PCI DSS',
      'SOX',
      'KYC/AML',
      'GDPR',
      'PSD2',
    ],
  },

  // ── Testing Requirements ───────────────────────────────────────────────────
  testing: {
    unit: [
      'Account balance calculation with pending and settled transactions',
      'Transfer limit validation: daily, weekly, monthly caps per account type',
      'Currency conversion with correct exchange rates and markup application',
      'Interest calculation: daily balance method with monthly compounding',
      'Fraud score calculation from transaction features with threshold classification',
      'Loan amortization schedule generation: correct principal/interest split over term',
      'Credit score impact estimation for loan applications',
      'Transaction categorization ML model accuracy',
      'KYC document validation: format, expiry, and completeness checks',
    ],
    integration: [
      'Account opening → KYC verification → initial deposit → account active → first transaction',
      'Internal transfer → balance update → notification → transaction record → daily reconciliation',
      'External ACH transfer → initiation → processing → completion → balance update → notification',
      'Wire transfer → compliance check → SWIFT message → correspondent bank → beneficiary credit',
      'Loan application → credit check → underwriting → approval → funding → first payment due',
      'Card transaction → fraud check → authorization → settlement → posting → statement update',
      'Investment trade → order routing → execution → confirmation → portfolio update → tax lot tracking',
      'Fraud alert → case creation → investigation → resolution → customer notification → account action',
    ],
    e2e: [
      'Customer onboarding → KYC → account creation → initial deposit → debit card request → first purchase → transaction categorization → balance update',
      'International wire: customer initiates → compliance review → currency conversion → SWIFT dispatch → correspondent processing → beneficiary receives → notification to both parties',
      'Loan journey: application → credit check → document upload → underwriting review → approval → e-signature → funding → first EMI → amortization tracking',
      'Investment flow: customer browses stocks → places order → fraud check → execution → confirmation → portfolio update → dividend tracking → tax reporting',
    ],
  },
};

// ── DomainModel Adapter ──────────────────────────────────────────────────────


function rolesForFinance(): DomainModel['userRoles'] {
  return [
    { id: 'customer', name: 'Customer', typicalFeatures: ['account-dashboard', 'transactions', 'transfers', 'investments'], permissions: ['view-own', 'transfer', 'trade', 'apply-loan'] },
    { id: 'support', name: 'Support Agent', typicalFeatures: ['support', 'operations', 'verification'], permissions: ['view-tickets', 'assist-customers', 'verify-identity'] },
    { id: 'compliance', name: 'Compliance Officer', typicalFeatures: ['compliance', 'reports', 'risk'], permissions: ['view-transactions', 'file-sar', 'run-reports', 'audit-access'] },
    { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'user-mgmt', 'compliance', 'reports', 'risk'], permissions: ['*', 'configure-system', 'manage-risk', 'approve-exceptions'] },
  ];
}

function featuresForFinance(): DomainModel['standardFeatures'] {
  const all: DomainModel['standardFeatures'] = [];
  const pushGroup = (label: string, priority: string, features: string[]) => {
    for (const f of features) {
      all.push({ category: label, name: f, description: '', priority });
    }
  };
  pushGroup('catalog', 'essential', FINANCE_PACK.catalog.features);
  pushGroup('fulfillment', 'expected', FINANCE_PACK.fulfillment.features);
  pushGroup('customer', 'expected', FINANCE_PACK.customer.features);
  pushGroup('operations', 'essential', FINANCE_PACK.operations.features);
  pushGroup('experience', 'differentiating', FINANCE_PACK.experience.features);
  for (const [group, items] of Object.entries(FINANCE_PACK.components)) {
    if (Array.isArray(items)) pushGroup(`components:${group}`, 'essential', items);
  }
  for (const [rule] of Object.entries(FINANCE_PACK.businessRules)) {
    all.push({ category: 'business', name: rule, description: '', priority: 'essential' });
  }
  return all;
}

function businessModelsForFinance(): DomainModel['businessModels'] {
  return [
    { modelType: 'digital-bank', revenueStreams: ['interchange-fees', 'loan-interest', 'investment-fees', 'subscription-fees', 'foreign-exchange-spread'], costStructure: ['compliance', 'technology', 'customer-acquisition', 'operations', 'fraud-losses'], pricingStrategy: ['freemium-banking', 'tiered-subscription', 'transaction-fees'] },
  ];
}

function technicalPatternsForFinance(): DomainModel['technicalPatterns'] {
  return [
    { category: 'architecture', name: 'Event Sourcing with CQRS', description: 'All financial events stored as immutable event log with separate read models', rationale: 'Audit trail, reconciliation, and fraud investigation require complete event history' },
    { category: 'data', name: 'Dual-write Ledger', description: 'Double-entry bookkeeping with real-time balance computation', rationale: 'Financial accuracy requires double-entry with reconciliation' },
    { category: 'integration', name: 'Real-time Payment Rails', description: 'Integration with Fedwire, CHIPS, SWIFT, ACH, and real-time payment networks', rationale: 'Multi-modal settlement with real-time status tracking' },
    { category: 'ml', name: 'Fraud Detection ML Pipeline', description: 'Real-time scoring with online learning and model versioning', rationale: 'Fraud patterns evolve rapidly; models must retrain continuously' },
  ];
}

function operationalLifecycleForFinance(): DomainModel['operationalLifecycle'] {
  return [
    { id: 'onboard', name: 'Onboard', description: 'Customer acquisition, KYC/AML verification, account opening' },
    { id: 'transact', name: 'Transact', description: 'Deposits, transfers, payments, investments, card usage' },
    { id: 'monitor', name: 'Monitor', description: 'Fraud detection, compliance screening, risk assessment' },
    { id: 'settle', name: 'Settle', description: 'Reconciliation, reporting, regulatory filings' },
    { id: 'support', name: 'Support', description: 'Dispute resolution, customer service, account maintenance' },
  ];
}

function designPrinciplesForFinance(): DomainModel['designPrinciples'] {
  const principles: DomainModel['designPrinciples'] = [];
  const layout: Record<string, string> = {
    'data-dense': 'High information density for financial overviews with organized sections and collapsible panels',
    'transaction-focused': 'Transaction list prioritized with quick filters and search for rapid account review',
    'clear-hierarchy': 'Clear visual hierarchy: balances prominent, actions accessible, details expandable',
  };
  const color: Record<string, string> = {
    'trust-blue': 'Deep blue conveying security, stability, and institutional trust',
    'alert-red': 'High-visibility red for overdrafts, failed transactions, and critical alerts',
    'positive-green': 'Green for deposits, gains, positive balances, and successful actions',
  };
  const typography: Record<string, string> = {
    'monospace-amounts': 'Tabular monospace for all monetary values ensuring alignment and readability',
    'clear-labels': 'Unambiguous labels for all financial actions with confirmation dialogs for irreversible actions',
  };
  const interaction: Record<string, string> = {
    'quick-transfer': 'One-tap transfers to frequent recipients with biometric confirmation',
    'biometric-auth': 'Biometric authentication (fingerprint, Face ID) for transactions and settings changes',
  };
  const accessibility: Record<string, string> = {
    'high-contrast': 'High contrast mode available for visually impaired users',
    'screen-reader': 'Full screen reader support with ARIA live regions for balance and transaction updates',
  };
  for (const [k, v] of Object.entries(layout)) principles.push({ name: `Layout: ${k}`, description: v });
  for (const [k, v] of Object.entries(color)) principles.push({ name: `Color: ${k}`, description: v });
  for (const [k, v] of Object.entries(typography)) principles.push({ name: `Typography: ${k}`, description: v });
  for (const [k, v] of Object.entries(interaction)) principles.push({ name: `Interaction: ${k}`, description: v });
  for (const [k, v] of Object.entries(accessibility)) principles.push({ name: `Accessibility: ${k}`, description: v });
  return principles;
}

function securityConsiderationsForFinance(): DomainModel['securityConsiderations'] {
  return [
    { category: 'auth', name: 'MFA, biometric, hardware token support', description: FINANCE_PACK.security.auth, severity: 'critical' },
    { category: 'data', name: 'AES-256 encrypted, SOC2 Type II', description: FINANCE_PACK.security.data, severity: 'critical' },
    { category: 'compliance', name: 'PCI DSS', description: 'Payment card data protection and processing standards', severity: 'high' },
    { category: 'compliance', name: 'SOX', description: 'Sarbanes-Oxley financial reporting and internal controls', severity: 'high' },
    { category: 'compliance', name: 'KYC/AML', description: 'Know Your Customer and Anti-Money Laundering compliance', severity: 'critical' },
    { category: 'compliance', name: 'GDPR', description: 'EU customer data protection and processing', severity: 'high' },
    { category: 'compliance', name: 'PSD2', description: 'Payment Services Directive 2 for EU payment services', severity: 'high' },
  ];
}

function regulationsForFinance(): DomainModel['regulations'] {
  return [
    { name: 'PCI DSS', requirements: ['Card data encryption', 'Secure processing', 'Regular security audits', 'Tokenization'] },
    { name: 'SOX', requirements: ['Financial reporting controls', 'Audit trails', 'Segregation of duties', 'Management certification'] },
    { name: 'KYC/AML', requirements: ['Customer identification', 'Transaction monitoring', 'SAR filing', 'Sanctions screening'] },
    { name: 'GDPR', requirements: ['Consent management', 'Right to erasure', 'Data portability', 'Breach notification'] },
    { name: 'PSD2', requirements: ['Strong customer authentication', 'Open banking APIs', 'Payment initiation', 'Account information'] },
  ];
}

function testingRequirementsForFinance(): DomainModel['testingRequirements'] {
  const all: DomainModel['testingRequirements'] = [];
  for (const t of FINANCE_PACK.testing.unit) all.push({ category: 'unit', name: t, description: '', priority: 'high' });
  for (const t of FINANCE_PACK.testing.integration) all.push({ category: 'integration', name: t, description: '', priority: 'high' });
  for (const t of FINANCE_PACK.testing.e2e) all.push({ category: 'e2e', name: t, description: '', priority: 'medium' });
  return all;
}

export const FINANCE_DOMAIN: DomainModel = {
  id: FINANCE_PACK.domain,
  domain: FINANCE_PACK.domain,
  name: FINANCE_PACK.name,
  label: FINANCE_PACK.name,
  category: 'finance',
  description: FINANCE_PACK.description,
  userRoles: rolesForFinance(),
  role: 'customer',
  standardFeatures: featuresForFinance(),
  businessModels: businessModelsForFinance(),
  technicalPatterns: technicalPatternsForFinance(),
  operationalLifecycle: operationalLifecycleForFinance(),
  designPrinciples: designPrinciplesForFinance(),
  securityConsiderations: securityConsiderationsForFinance(),
  regulations: regulationsForFinance(),
  testingRequirements: testingRequirementsForFinance(),
  workflows: [
    { id: 'transfer', name: 'Fund Transfer', steps: ['initiate', 'verify', 'fraud-check', 'process', 'settle', 'notify'], entities: ['account', 'transfer', 'transaction'] },
    { id: 'loan', name: 'Loan Application', steps: ['apply', 'credit-check', 'underwrite', 'approve', 'fund', 'disburse'], entities: ['loan', 'application', 'credit-report'] },
    { id: 'kyc', name: 'KYC Verification', steps: ['submit-docs', 'verify-identity', 'screen-sanctions', 'assess-risk', 'activate'], entities: ['customer', 'identity-doc', 'risk-profile'] },
  ],
  entities: [
    { name: 'Account', description: 'Financial account with balance, type, and transaction history', invariants: ['balance cannot go below zero without overdraft', 'all transactions must be double-entry'] },
    { name: 'Transaction', description: 'Immutable financial event with amount, type, timestamp, and status', invariants: ['amount must be non-zero', 'debits equal credits (double-entry)', 'cannot be modified after settlement'] },
    { name: 'Card', description: 'Payment card with number, expiry, limits, and transaction authorization', invariants: ['CVV never stored', 'full number never displayed', 'requires PIN for debit transactions'] },
  ],
  invariants: ['double-entry bookkeeping: every credit has a matching debit', 'transaction immutability after settlement', 'account balance must reconcile with ledger', 'all transactions subject to fraud scoring', 'regulatory reporting for transfers over $10,000'],
  constraints: ['transfer limits per account type and verification level', 'card spending limits enforced in real-time', 'loan approval requires credit score minimum', 'AML screening mandatory before account opening'],
  financialFlows: [
    { name: 'customer-deposit', direction: 'in', trigger: 'deposit-received' },
    { name: 'customer-withdrawal', direction: 'out', trigger: 'withdrawal-processed' },
    { name: 'transfer-out', direction: 'out', trigger: 'transfer-completed' },
    { name: 'loan-disbursement', direction: 'out', trigger: 'loan-funded' },
    { name: 'loan-repayment', direction: 'in', trigger: 'emi-payment' },
  ],
  successMetrics: ['transaction-success-rate', 'fraud-detection-accuracy', 'account-opening-time', 'transfer-speed', 'customer-nps', 'regulatory-compliance-score'],
  analytics: { tracked: ['transactions', 'balances', 'fraud-events', 'compliance-alerts', 'customer-behavior'], dashboards: ['transactions', 'risk', 'compliance', 'customer'] },
  securityRequirements: ['mfa', 'biometric-auth', 'hardware-token', 'phi-encryption', 'soc2-type2', 'real-time-fraud-monitoring'],
  regulatory: [
    { regulation: 'PCI DSS', applies: true, notes: 'Card payment processing standards' },
    { regulation: 'SOX', applies: true, notes: 'Financial reporting and internal controls' },
    { regulation: 'KYC/AML', applies: true, notes: 'Customer identification and anti-money laundering' },
    { regulation: 'GDPR', applies: true, notes: 'EU customer data protection' },
    { regulation: 'PSD2', applies: true, notes: 'EU payment services directive for open banking' },
  ],
};
