/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Jewellery Domain Pack
 *
 * Luxury jewellery e-commerce platform with 3D product configurator, virtual try-on
 * AR experience, diamond certification tracking, custom engraving, and comprehensive
 * material provenance chain. Covers the full lifecycle from browsing to production
 * quality inspection.
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
      { id: 'customer', name: 'Customer', typicalFeatures: pack.customer.features, permissions: ['read', 'write', 'purchase'] },
      { id: 'artisan', name: 'Artisan', typicalFeatures: pack.operations.features, permissions: ['read', 'write', 'produce'] },
      { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'product-mgmt', 'orders'], permissions: ['admin'] },
    ],
    role: 'user',
    standardFeatures: allFeatures.length > 0 ? allFeatures : [{ category: 'core', name: 'core', description: 'Core product', priority: 'essential' }],
    businessModels: [{ modelType: pack.domain, revenueStreams: ['direct-sales', 'custom-orders', 'engraving-services', 'certification-fees'], costStructure: ['materials', 'craftsmanship', 'certification', 'marketing', 'platform'], pricingStrategy: ['premium', 'custom-quote', 'material-based', 'craftsmanship-tiered'] }],
    technicalPatterns: [
      { category: '3d', name: 'Real-time 3D Rendering', description: 'WebGL-based 3D product configurator with material PBR' },
      { category: 'ar', name: 'Augmented Reality Try-On', description: 'ARKit/ARCore-based virtual jewelry try-on' },
      { category: 'blockchain', name: 'Provenance Ledger', description: 'Blockchain-based diamond and material provenance tracking' },
    ],
    operationalLifecycle: [
      { id: 'discover', name: 'Discover', description: 'Customer browses gallery and configures products' },
      { id: 'customize', name: 'Customize', description: '3D configurator and virtual try-on experience' },
      { id: 'order', name: 'Order', description: 'Custom order placement with deposit payment' },
      { id: 'produce', name: 'Produce', description: 'Artisan production and quality inspection' },
      { id: 'deliver', name: 'Deliver', description: 'Certified delivery with provenance documentation' },
    ],
    designPrinciples: [
      { name: 'Product Showcase', description: 'Luxury-first product presentation with full-screen imagery' },
      { name: 'Configurator-Fullscreen', description: '3D configurator as primary interaction surface' },
      { name: 'Luxury Minimal', description: 'Clean, understated design that lets products shine' },
    ],
    securityConsiderations: [
      { category: 'auth', name: 'Multi-role Authentication', description: 'Customer + artisan + admin roles with OAuth', severity: 'high' },
      { category: 'data', name: 'Transaction Encryption', description: 'Encrypted transactions with diamond provenance chain', severity: 'critical' },
      { category: 'compliance', name: 'Jewelry Compliance', description: 'PCI DSS, Kimberley Process, and GDPR compliance', severity: 'high' },
    ],
    regulations: [
      { name: 'PCI DSS', requirements: ['Card data encryption', 'Secure transmission', 'Regular security scans', 'Access control'] },
      { name: 'Kimberley Process', requirements: ['Conflict-free diamond certification', 'Chain of custody documentation', 'Origin tracking'] },
      { name: 'GDPR', requirements: ['Data minimization', 'Right to erasure', 'Consent management', 'Breach notification'] },
    ],
    testingRequirements: [
      { category: 'unit', name: '3D Configurator', description: 'Material property updates and rendering correctness', priority: 'high' },
      { category: 'unit', name: 'Certificate Verification', description: 'Lab database lookup and validation', priority: 'high' },
      { category: 'unit', name: 'Ring Size Conversion', description: 'US/UK/EU/JP standard conversion accuracy', priority: 'medium' },
      { category: 'integration', name: 'Config to Purchase', description: 'Configurator → 3D preview → cart → checkout → order → production queue → quality inspection → shipping', priority: 'high' },
      { category: 'integration', name: 'Diamond Provenance', description: 'Source → certificate import → inventory → customer view → sale → provenance document → delivery', priority: 'high' },
      { category: 'integration', name: 'Custom Order Flow', description: 'Select diamond → choose setting → engraving → review → confirm → production → quality → shipment', priority: 'high' },
      { category: 'e2e', name: 'Purchase Journey', description: 'Browse rings → 3D configure → virtual try-on → wishlist → appointment → purchase → certified delivery with provenance', priority: 'high' },
      { category: 'e2e', name: 'Custom Order Journey', description: 'Select diamond → choose setting → add engraving → review design → confirm → track production → quality photos → delivery with certificates', priority: 'high' },
    ],
    workflows: [
      { id: 'browse-configure', name: 'Browse and Configure', steps: ['browse-catalog', 'select-product', 'open-configurator', 'customize-materials', 'preview-in-ar', 'save-design'], entities: ['Product', 'Configuration', 'Design'] },
      { id: 'custom-order', name: 'Custom Order', steps: ['select-diamond', 'choose-setting', 'add-engraving', 'review-design', 'confirm-order', 'process-deposit'], entities: ['Diamond', 'Setting', 'Engraving', 'CustomOrder'] },
      { id: 'production', name: 'Production', steps: ['assign-artisan', 'craft-piece', 'quality-inspection', 'certification', 'photography', 'package'], entities: ['ProductionOrder', 'Artisan', 'QualityCheck', 'Certificate'] },
      { id: 'provenance', name: 'Provenance Tracking', steps: ['source-material', 'record-origin', 'certify-authenticity', 'link-to-product', 'deliver-documentation'], entities: ['MaterialSource', 'ProvenanceRecord', 'Certificate'] },
    ],
    entities: [
      { name: 'Product', description: 'Jewelry product with configurable attributes', invariants: ['has at least one material', 'certificate linked if diamond', 'unique SKU'] },
      { name: 'Diamond', description: 'Certified diamond with grading details', invariants: ['valid certificate number', 'Kimberley Process compliant', 'graded by recognized lab'] },
      { name: 'CustomOrder', description: 'Custom jewelry order with specifications', invariants: ['50% deposit received', 'design approved', 'has ETA'] },
      { name: 'Certificate', description: 'Grading or authenticity certificate', invariants: ['issued by recognized lab', 'linked to specific piece', 'verifiable'] },
    ],
    invariants: [
      'Every diamond must have a valid GIA, AGS, or IGI certificate before listing',
      'Custom orders require 50% deposit before production begins',
      'Ring size conversion must follow US, UK, EU, and JP standards',
      'Engraving limited to 20 characters per line, maximum 3 lines',
      'All precious metals sourced from certified refiners with chain-of-custody',
      'In-stock items returnable within 30 days; custom and engraved items are non-returnable',
    ],
    constraints: [
      'Maximum engraving: 20 characters per line, 3 lines max',
      'Custom order production: minimum 2 weeks lead time',
      'Ring resizing within 2 sizes; beyond requires remake',
      'International returns: customer responsible for shipping',
    ],
    financialFlows: [
      { name: 'product-sale', direction: 'in', trigger: 'order-confirmed' },
      { name: 'custom-order-deposit', direction: 'in', trigger: 'custom-order-placed' },
      { name: 'balance-payment', direction: 'in', trigger: 'production-complete' },
      { name: 'material-cost', direction: 'out', trigger: 'material-sourced' },
      { name: 'artisan-payment', direction: 'out', trigger: 'quality-passed' },
    ],
    successMetrics: [
      'conversion-rate',
      'average-order-value',
      'custom-order-percentage',
      'return-rate',
      'certification-accuracy',
      'production-lead-time',
      'customer-satisfaction',
      'virtual-tryon-engagement',
    ],
    analytics: {
      tracked: ['product-views', 'configurator-usage', 'tryon-engagement', 'conversion-funnel', 'material-popularity'],
      dashboards: ['sales', 'production', 'quality', 'customer', 'certification'],
    },
    securityRequirements: [
      'Customer and artisan role separation with OAuth',
      'Encrypted transaction processing',
      'Diamond provenance chain stored as immutable records',
      '3D Secure for purchase authorization',
      'Certificate data validated against issuing lab APIs',
    ],
    regulatory: [
      { regulation: 'PCI DSS', applies: true, notes: 'Payment processing compliance' },
      { regulation: 'Kimberley Process', applies: true, notes: 'Conflict-free diamond certification required' },
      { regulation: 'GDPR', applies: true, notes: 'Customer data protection and right to erasure' },
    ],
  };
}

// ── Jewellery Pack ────────────────────────────────────────────────────────────

export const JEWELLERY_PACK: DomainPack = {
  domain: 'jewellery',
  name: 'Jewellery E-Commerce & 3D Configurator',
  description:
    'Luxury jewellery e-commerce platform with 3D product configurator, virtual try-on AR experience, diamond certification tracking, custom engraving, and comprehensive material provenance chain. Covers the full lifecycle from browsing to production quality inspection.',

  // ── Catalog ─────────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Custom', 'Engraving'],
    features: [
      '3d-product-configurator',
      'virtual-tryon',
      'diamond-certification',
      'custom-design',
      'engraving-service',
      'size-guide',
      'material-provenance',
      'ring-sizer',
      'necklace-length-selector',
      'earring-pair-matcher',
      'bracelet-sizing',
      'metal-type-selector',
      'gemstone-selection',
      'setting-style-options',
      'budget-calculator',
      'comparison-tool',
      'wishlist',
      'gift-packaging',
      'certificate-verification',
      'care-guides',
    ],
  },

  // ── Fulfillment ─────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['in-stock', 'custom-made', '3d-print', 'engraving'],
    features: [
      '3d-configurator',
      'virtual-tryon',
      'sizing-guide',
      'certification',
      'custom-production',
      'quality-inspection',
      'diamond-sourcing',
      'engraving',
    ],
  },

  // ── Customer Features ───────────────────────────────────────────────────────
  customer: {
    features: [
      '3d-configurator',
      'virtual-tryon',
      'wishlist',
      'certification-viewer',
      'size-guide',
      'order-tracking',
      'reviews',
      'appointment-booking',
    ],
  },

  // ── Operations Features ─────────────────────────────────────────────────────
  operations: {
    features: [
      'order-management',
      'custom-production',
      'quality-inspection',
      'diamond-sourcing',
      'certification',
      'supply-chain',
      'craftsmanship',
      'inventory',
    ],
  },

  // ── Experience Features ─────────────────────────────────────────────────────
  experience: {
    features: [
      '3d-customization',
      'augmented-reality',
      'size-prediction',
      'craftsmanship-storytelling',
      '360-degree-view',
      'material-comparison',
      'design-inspiration',
      'personal-stylist',
    ],
  },

  // ── Components ──────────────────────────────────────────────────────────────
  components: {
    public: ['gallery', 'configurator', 'about', 'craftsmanship', 'certifications'],
    customer: ['account', 'orders', 'wishlist', 'configurator', 'appointments', 'settings'],
    admin: ['dashboard', 'product-mgmt', 'orders', 'reports', 'certifications', 'partners'],
    staff: ['production', 'quality', 'support', 'craftsmanship', 'sourcing'],
  },

  // ── Business Rules ──────────────────────────────────────────────────────────
  businessRules: {
    diamondCertification: 'Every diamond must have a valid GIA, AGS, or IGI certificate before listing. Certificate number verified against issuing lab database. Diamond grading details (cut, color, clarity, carat) displayed on product page. Conflict-free certification required — Kimberley Process compliance verified. Lab-grown diamonds clearly labeled with separate category.',
    customOrders: 'Custom orders require 50% deposit before production begins. Production timeline estimated and communicated at order confirmation. Design changes allowed within 48 hours of order placement; changes after that incur revision fees. Custom orders non-returnable except for defects. Production progress updates sent weekly via email. Final approval required before shipping.',
    sizingStandards: 'Ring sizing follows US, UK, EU, and JP standards with automatic conversion. Sizing chart provided in MM, inch, and numerical formats. Ring sizer tool available for at-home measurement. Resizing service offered for purchased items within 1 year. Resizing beyond 2 sizes requires remaking. Bracelet sizing uses wrist measurement with adjustable link options.',
    engravingRules: 'Engraving limited to 20 characters per line, maximum 3 lines. Prohibited characters: profanity, trademarks, special symbols. Font selection limited to approved engraving fonts. Engraving preview shown before confirmation. Engraving is permanent and non-refundable. Rush engraving (same-day) available with surcharge. Hand-engraving vs laser engraving selected at checkout.',
    returnsPolicy: 'In-stock items returnable within 30 days in original condition with certificate. Custom and engraved items non-returnable. Exchange offered for sizing issues within 60 days. Return shipping prepaid label included. Refund processed to original payment method within 10 business days. Items showing wear, damage, or missing certificates not accepted. International returns customer-responsible for shipping.',
    materialProvenance: 'All precious metals sourced from certified refiners with chain-of-custody documentation. Gold and platinum marked with karat/stamp on receipt. Silver stamped with .925 or equivalent. Conflict-free diamond sourcing per Kimberley Process Certification Scheme. Material origin documented and auditable per piece. Recycled metal content disclosed per product. Supplier audits conducted annually.',
  },

  // ── Design ──────────────────────────────────────────────────────────────────
  design: {
    layout: ['product-showcase', 'configurator-fullscreen', 'luxury-minimal', 'story-telling'],
    color: ['gold-accent', 'black-white', 'luxury-neutral', 'subtle-metallic'],
    typography: ['luxury-serif', 'clean-sans', 'elegant-headings', 'refined-body'],
    interaction: ['3d-rotate', 'material-select', 'zoom-inspect', 'swipe-gallery'],
    accessibility: ['keyboard-nav', 'screen-reader', 'high-contrast', 'focus-indicator'],
  },

  // ── Security ────────────────────────────────────────────────────────────────
  security: {
    auth: 'Customer + artisan + admin roles with OAuth. Customer accounts via email/password with OAuth options (Google, Apple). Artisan portal for production staff with MFA. Admin access via SSO with audit logging. Purchase authorization via 3D Secure. Session management with secure HTTP-only cookies.',
    data: 'Encrypted transactions at rest and in transit. Diamond provenance chain stored as immutable audit records. PII (addresses, payment info) encrypted with AES-256. Certificate data validated against issuing lab APIs. Transaction receipts digitally signed.',
    compliance: ['PCI DSS', 'Kimberley Process', 'GDPR'],
  },

  // ── Testing ─────────────────────────────────────────────────────────────────
  testing: {
    unit: [
      '3D configurator: material property updates and rendering correctness',
      'Diamond certificate verification: lab database lookup and validation',
      'Ring size conversion: US/UK/EU/JP standard conversion accuracy',
      'Engraving character validation: length, font, and prohibited content checks',
      'Provenance chain: material sourcing record integrity and audit trail',
      'Price calculation: metal weight, gemstone carat, and setting complexity formula',
    ],
    integration: [
      'Configurator → 3D preview → add to cart → checkout → order → production queue → quality inspection → shipping',
      'Diamond source → certificate import → inventory listing → customer view → sale → provenance document → delivery',
      'Custom order → deposit payment → design review → production scheduling → quality check → customer approval → shipment',
    ],
    e2e: [
      'Customer browses rings → configures 3D model → virtual try-on → adds to wishlist → books appointment → purchases → receives certified item with provenance documentation',
      'Custom engagement ring → selects diamond → chooses setting → adds engraving → reviews design → confirms order → tracks production → receives quality inspection photos → delivery with certificates',
    ],
  },
};

// ── Jewellery Domain Model ────────────────────────────────────────────────────

export const JEWELLERY_DOMAIN: DomainModel = toDomainModel(JEWELLERY_PACK);
