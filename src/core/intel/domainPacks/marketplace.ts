/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Multi-Vendor Marketplace Domain Pack
 *
 * Complete multi-vendor marketplace platform covering product catalog with categories
 * and recommendations, vendor onboarding and management, commission tracking, dispute
 * resolution, shopping cart, checkout, order management, buyer and seller protection,
 * reviews and ratings, moderation, and analytics dashboards.
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

export const MARKETPLACE_PACK: DomainPack = {
  domain: 'marketplace',
  name: 'Multi-Vendor Marketplace',
  description:
    'Complete multi-vendor marketplace platform covering product catalog with categories and recommendations, vendor onboarding and management, commission tracking, dispute resolution, shopping cart, checkout, order management, buyer and seller protection, reviews and ratings, moderation, and analytics dashboards.',

  // ── Catalog ────────────────────────────────────────────────────────────────
  catalog: {
    categories: [
      'Products',
      'Categories',
      'Deals',
      'Brands',
      'Reviews',
      'Recommendations',
    ],
    features: [
      'product-listings',
      'category-hierarchy',
      'brand-profiles',
      'product-variants',
      'search',
      'faceted-filters',
      'price-comparison',
      'review-ratings',
      'recommendation-engine',
      'personalized-feed',
      'deal-aggregation',
      'flash-sales',
      'wishlist',
      'price-history',
      'image-gallery',
      'video-uploads',
      'bulk-import',
      'seo-optimization',
      'tagging',
    ],
  },

  // ── Fulfillment ────────────────────────────────────────────────────────────
  fulfillment: {
    modes: ['vendor-fulfillment', 'platform-fulfillment', 'dropshipping'],
    features: [
      'vendor-management',
      'commission-tracking',
      'dispute-resolution',
      'shipping-integration',
    ],
  },

  // ── Customer Features ──────────────────────────────────────────────────────
  customer: {
    features: [
      'vendor-profiles',
      'product-reviews',
      'wishlist',
      'comparison',
      'buyer-protection',
    ],
  },

  // ── Operations Features ────────────────────────────────────────────────────
  operations: {
    features: [
      'vendor-onboarding',
      'commission-management',
      'dispute-resolution',
      'analytics-dashboard',
      'moderation',
    ],
  },

  // ── Experience Features ────────────────────────────────────────────────────
  experience: {
    features: [
      'personalized-feed',
      'smart-search',
      'price-alerts',
      'social-proof',
    ],
  },

  // ── Components ─────────────────────────────────────────────────────────────
  components: {
    public: ['marketplace', 'search', 'deals'],
    customer: ['account', 'orders', 'reviews', 'wishlist'],
    admin: ['dashboard', 'vendor-mgmt', 'reports', 'settings', 'moderation'],
    staff: ['support', 'operations', 'vendor-success'],
  },

  // ── Business Rules ─────────────────────────────────────────────────────────
  businessRules: {
    commissions: [
      'Commission rate per product category: Electronics 8%, Clothing 12%, Home & Garden 10%, Handmade 5%, Digital 15%. Tiered commission for high-volume vendors (1,000+ orders/month): discount 1-2% on standard rate. Minimum commission threshold of $0.10 per transaction. Commission calculated at order fulfillment, not at order placement. Refunded orders reverse commission payout. Chargebacks deducted from vendor balance with 15-day dispute window. Payout schedule: weekly for vendors with $500+ balance, monthly otherwise. Payout hold period of 14 days after delivery for new vendors (risk mitigation).',
    ],

    vendors: [
      'Vendor application requires business name, tax ID/EIN, bank account, and product samples for approval. Approval SLA: 48 hours for standard categories, 72 hours for regulated products. Vendor tier levels: New (0-30 days), Standard (30+ days, <5% dispute rate), Preferred (90+ days, <2% dispute rate, 4.5+ rating), Elite (365+ days, <1% dispute rate, 4.8+ rating). Each tier unlocks lower commission rates, priority support, and promotional opportunities. Vendor performance score: 40% order fulfillment rate, 30% dispute rate, 20% rating, 10% response time. Deactivation after 60 days of inactivity with 30-day warning.',
    ],

    disputes: [
      'Buyer can open dispute within 30 days of delivery for: item not received, item not as described, item damaged, counterfeit product, wrong item received. Vendor response required within 48 hours. Automatic escalation to platform mediation if unresolved within 5 business days. Evidence required: photos, screenshots, communication logs. Refund options: full refund, partial refund, return for replacement. Vendor dispute rate tracked: >15% triggers account review, >25% results in suspension. Buyer protection guarantee: full refund for eligible disputes up to $500 per transaction. Fraudulent disputes result in buyer account restriction.',
    ],

    products: [
      'Product listings must include: title (max 200 chars), description (min 50 chars), at least one image (min 800x800), price, shipping weight/dimensions, category. Prohibited items: counterfeit goods, weapons, drugs, hazardous materials, stolen property. Listings reviewed by moderation within 24 hours of submission. Listing quality score affects search ranking. Duplicate listings penalized in search. Price accuracy: price changes limited to 10% per week for active listings. Out-of-stock items auto-paused after 7 days. Reviews require verified purchase badge. Review manipulation (incentivized reviews, fake accounts) results in listing removal and vendor penalty.',
    ],

    payments: [
      'Payment processing via Stripe Connect for vendor payouts. Buyer pays platform; platform holds funds until delivery confirmation + 14-day hold. Standard payout: weekly Wednesday for balances over $500. Express payout: next business day for 1.5% fee. Payment methods: credit/debit cards (Visa, MC, Amex, Discover), PayPal, Apple Pay, Google Pay, Buy Now Pay Later (Klarna, Affirm). Currency support: USD, EUR, GBP, CAD, AUD with real-time conversion. Refund initiated by buyer: full amount returned, commission reversed. Refund initiated by vendor: vendor covers processing fee. Chargeback fee: $15 per incident charged to vendor account. Failed payouts retry for 3 cycles before holding in escrow.',
    ],

    moderation: [
      'Automated moderation: AI-powered content scanning for prohibited items, fake reviews, scam patterns. Manual review queue for flagged listings and escalated disputes. Content categories: prohibited items, misleading claims, trademark infringement, adult content, hate speech. Moderation actions: approve, reject, request changes, escalate, ban vendor. Repeat violators face escalating penalties: warning → 7-day suspension → 30-day suspension → permanent ban. Appeals process for moderation decisions with 72-hour review SLA. Seller rating minimums: 3.0 stars required to list new products. Community flagging: users can report listings, reviews, and profiles for review.',
    ],
  },

  // ── Design Principles ───────────────────────────────────────────────────────
  design: {
    layout: [
      'grid-catalog',
      'infinite-scroll',
      'comparison-table',
    ],
    color: [
      'trustworthy-blue',
      'action-orange',
    ],
    typography: [
      'product-cards',
      'price-highlight',
    ],
    interaction: [
      'quick-view',
      'add-to-cart-animation',
    ],
    accessibility: [
      'keyboard-nav',
      'alt-text',
    ],
  },

  // ── Security Requirements ──────────────────────────────────────────────────
  security: {
    auth:
      'Multi-role: buyer, vendor, admin with OAuth. Buyers authenticate via email/password and OAuth (Google, Apple, Facebook). Vendors authenticate via email/password with mandatory MFA. Admin accounts require SSO and hardware token (U2F). Role-based access: Buyer (browse, purchase, review), Vendor (list, manage, fulfill), Admin (moderate, configure, support). Session tokens rotated every 15 minutes. Rate limiting on all auth endpoints. Account lockout after 5 failed login attempts (30-minute cooldown).',

    data:
      'PII encrypted, payment data isolated. Buyer PII: name, email, shipping/billing addresses, phone. Vendor PII: business name, tax ID, bank account details, contact information. Payment data handled exclusively by Stripe Connect — AETHER never stores raw card data. Product images and descriptions stored with CDN delivery. Order data with full line items, pricing, shipping, and fulfillment status. Communication messages between buyers and vendors stored with 90-day retention. All data encrypted at rest (AES-256) with TLS 1.3 in transit.',

    compliance: [
      'PCI DSS',
      'GDPR',
      'Consumer Protection',
    ],
  },

  // ── Testing Requirements ───────────────────────────────────────────────────
  testing: {
    unit: [
      'Commission calculation per category rate with tiered discount application',
      'Vendor performance score computation from fulfillment, dispute, rating, and response metrics',
      'Search ranking algorithm with relevance scoring and personalization weights',
      'Review helpfulness scoring and verified purchase badge assignment',
      'Dispute eligibility validation: window, order status, previous dispute history',
      'Payout amount calculation with hold period, refunds, and chargebacks applied',
      'Price change limit enforcement: maximum 10% weekly change for active listings',
      'Product moderation rule engine: prohibited item detection with category mapping',
    ],
    integration: [
      'Vendor onboarding → document verification → store setup → first product listing → first sale → first payout',
      'Buyer search → filter → product view → add to cart → checkout → order placement → vendor notification → fulfillment → delivery → review',
      'Vendor lists product → moderation review → approval → searchable → buyer purchases → commission calculated → payout after hold period',
      'Buyer opens dispute → vendor responds → platform mediation → resolution → refund/payout adjusted → ratings updated',
      'Flash sale activation → deal displayed → buyer purchases → inventory tracked → sale ends → analytics recorded',
      'Admin moderates flagged listing → violation confirmed → listing removed → vendor notified → appeal period → final action',
      'Multi-vendor cart: items from different vendors → split checkout → separate orders → independent tracking → combined delivery estimation',
    ],
    e2e: [
      'New buyer registers → browses categories → searches for product → reads reviews → adds to cart → applies coupon → completes checkout → receives order → leaves review → earns loyalty points',
      'New vendor applies → submits documents → gets approved → creates store → lists products → receives first order → fulfills → gets paid → views analytics → optimizes listings',
      'Buyer reports suspicious listing → moderation reviews → confirms violation → removes listing → bans vendor → notifies affected buyers → processes refunds',
    ],
  },
};

// ── DomainModel Adapter ──────────────────────────────────────────────────────


function rolesForMarketplace(): DomainModel['userRoles'] {
  return [
    { id: 'buyer', name: 'Buyer', typicalFeatures: ['vendor-profiles', 'product-reviews', 'wishlist', 'comparison'], permissions: ['browse', 'purchase', 'review', 'dispute'] },
    { id: 'vendor', name: 'Vendor', typicalFeatures: ['product-listings', 'order-management', 'vendor-analytics'], permissions: ['list-products', 'manage-orders', 'view-payouts', 'respond-reviews'] },
    { id: 'admin', name: 'Admin', typicalFeatures: ['dashboard', 'vendor-mgmt', 'reports', 'settings', 'moderation'], permissions: ['*'] },
    { id: 'staff', name: 'Support Staff', typicalFeatures: ['support', 'operations', 'vendor-success'], permissions: ['view-tickets', 'resolve-disputes', 'contact-vendors'] },
  ];
}

function featuresForMarketplace(): DomainModel['standardFeatures'] {
  const all: DomainModel['standardFeatures'] = [];
  const pushGroup = (label: string, priority: string, features: string[]) => {
    for (const f of features) {
      all.push({ category: label, name: f, description: '', priority });
    }
  };
  pushGroup('catalog', 'essential', MARKETPLACE_PACK.catalog.features);
  pushGroup('fulfillment', 'expected', MARKETPLACE_PACK.fulfillment.features);
  pushGroup('customer', 'expected', MARKETPLACE_PACK.customer.features);
  pushGroup('operations', 'essential', MARKETPLACE_PACK.operations.features);
  pushGroup('experience', 'differentiating', MARKETPLACE_PACK.experience.features);
  for (const [group, items] of Object.entries(MARKETPLACE_PACK.components)) {
    if (Array.isArray(items)) pushGroup(`components:${group}`, 'essential', items);
  }
  for (const [rule] of Object.entries(MARKETPLACE_PACK.businessRules)) {
    all.push({ category: 'business', name: rule, description: '', priority: 'essential' });
  }
  return all;
}

function businessModelsForMarketplace(): DomainModel['businessModels'] {
  return [
    { modelType: 'commission-marketplace', revenueStreams: ['sales-commission', 'listing-fees', 'promoted-listings', 'payment-processing-fees'], costStructure: ['hosting', 'payment-processing', 'support', 'moderation', 'marketing'], pricingStrategy: ['category-based-commission', 'tiered-commission', 'transaction-fees'] },
  ];
}

function technicalPatternsForMarketplace(): DomainModel['technicalPatterns'] {
  return [
    { category: 'architecture', name: 'Multi-tenant Data Isolation', description: 'Vendor data logically isolated per vendor with shared catalog infrastructure', rationale: 'Scalable vendor onboarding without data leakage between sellers' },
    { category: 'search', name: 'Elasticsearch / Algolia', description: 'Full-text search with faceted filtering, typo tolerance, and personalization', rationale: 'Marketplace discovery depends on fast, relevant search across millions of products' },
    { category: 'integration', name: 'Payment Orchestration', description: 'Stripe Connect for multi-party payouts with split payments and hold logic', rationale: 'Automated commission calculation and vendor payouts at scale' },
    { category: 'data', name: 'Event Sourcing', description: 'Order events, dispute events, and review events stored as immutable event log', rationale: 'Audit trail for disputes, chargebacks, and regulatory compliance' },
  ];
}

function operationalLifecycleForMarketplace(): DomainModel['operationalLifecycle'] {
  return [
    { id: 'onboard', name: 'Vendor Onboarding', description: 'Application, verification, store setup, first listing' },
    { id: 'list', name: 'List & Sell', description: 'Product listing, buyer discovery, order placement' },
    { id: 'fulfill', name: 'Fulfill', description: 'Order processing, shipping, delivery confirmation' },
    { id: 'settle', name: 'Settle', description: 'Commission calculation, payout, dispute resolution' },
    { id: 'grow', name: 'Grow', description: 'Analytics review, optimization, vendor tier progression' },
  ];
}

function designPrinciplesForMarketplace(): DomainModel['designPrinciples'] {
  const principles: DomainModel['designPrinciples'] = [];
  const layout: Record<string, string> = {
    'grid-catalog': 'Responsive product grid with adjustable columns per viewport and density preference',
    'infinite-scroll': 'Continuous product feed with lazy loading and scroll-based pagination',
    'comparison-table': 'Side-by-side product comparison with key attributes and pricing',
  };
  const color: Record<string, string> = {
    'trustworthy-blue': 'Primary brand blue conveying trust, security, and professionalism',
    'action-orange': 'High-contrast orange for CTAs (Add to Cart, Buy Now) to drive conversion',
  };
  const typography: Record<string, string> = {
    'product-cards': 'Card-based product display with consistent image, title, price, and rating layout',
    'price-highlight': 'Prominent price display with sale price strikethrough for discounts',
  };
  const interaction: Record<string, string> = {
    'quick-view': 'Quick view modal for product details without leaving the catalog page',
    'add-to-cart-animation': 'Animated cart feedback with item count, price update, and fly-to-cart animation',
  };
  const accessibility: Record<string, string> = {
    'keyboard-nav': 'Full keyboard navigation for search, filters, and product interaction',
    'alt-text': 'Comprehensive alt text for all product images with descriptive context',
  };
  for (const [k, v] of Object.entries(layout)) principles.push({ name: `Layout: ${k}`, description: v });
  for (const [k, v] of Object.entries(color)) principles.push({ name: `Color: ${k}`, description: v });
  for (const [k, v] of Object.entries(typography)) principles.push({ name: `Typography: ${k}`, description: v });
  for (const [k, v] of Object.entries(interaction)) principles.push({ name: `Interaction: ${k}`, description: v });
  for (const [k, v] of Object.entries(accessibility)) principles.push({ name: `Accessibility: ${k}`, description: v });
  return principles;
}

function securityConsiderationsForMarketplace(): DomainModel['securityConsiderations'] {
  return [
    { category: 'auth', name: 'Multi-role: buyer, vendor, admin with OAuth', description: MARKETPLACE_PACK.security.auth, severity: 'high' },
    { category: 'data', name: 'PII encrypted, payment data isolated', description: MARKETPLACE_PACK.security.data, severity: 'high' },
    { category: 'compliance', name: 'PCI DSS', description: 'Payment card data handled by certified processor (Stripe Connect)', severity: 'high' },
    { category: 'compliance', name: 'GDPR', description: 'Buyer and vendor data protection with consent management', severity: 'high' },
    { category: 'compliance', name: 'Consumer Protection', description: 'Buyer protection policies, refund rights, and transparent vendor disclosure', severity: 'medium' },
  ];
}

function regulationsForMarketplace(): DomainModel['regulations'] {
  return [
    { name: 'PCI DSS', requirements: ['Payment data isolation', 'Secure processing via Stripe', 'Regular security audits', 'Tokenization of card data'] },
    { name: 'GDPR', requirements: ['Buyer consent for marketing', 'Right to data erasure', 'Vendor data processing agreements', 'Breach notification within 72h'] },
    { name: 'Consumer Protection', requirements: ['Clear return policies', 'Buyer protection guarantee', 'Vendor disclosure requirements', 'Dispute resolution process'] },
  ];
}

function testingRequirementsForMarketplace(): DomainModel['testingRequirements'] {
  const all: DomainModel['testingRequirements'] = [];
  for (const t of MARKETPLACE_PACK.testing.unit) all.push({ category: 'unit', name: t, description: '', priority: 'high' });
  for (const t of MARKETPLACE_PACK.testing.integration) all.push({ category: 'integration', name: t, description: '', priority: 'high' });
  for (const t of MARKETPLACE_PACK.testing.e2e) all.push({ category: 'e2e', name: t, description: '', priority: 'medium' });
  return all;
}

export const MARKETPLACE_DOMAIN: DomainModel = {
  id: MARKETPLACE_PACK.domain,
  domain: MARKETPLACE_PACK.domain,
  name: MARKETPLACE_PACK.name,
  label: MARKETPLACE_PACK.name,
  category: 'marketplace',
  description: MARKETPLACE_PACK.description,
  userRoles: rolesForMarketplace(),
  role: 'buyer',
  standardFeatures: featuresForMarketplace(),
  businessModels: businessModelsForMarketplace(),
  technicalPatterns: technicalPatternsForMarketplace(),
  operationalLifecycle: operationalLifecycleForMarketplace(),
  designPrinciples: designPrinciplesForMarketplace(),
  securityConsiderations: securityConsiderationsForMarketplace(),
  regulations: regulationsForMarketplace(),
  testingRequirements: testingRequirementsForMarketplace(),
  workflows: [
    { id: 'purchase', name: 'Purchase Flow', steps: ['browse', 'search', 'compare', 'add-to-cart', 'checkout', 'pay', 'track', 'receive', 'review'], entities: ['product', 'order', 'payment'] },
    { id: 'vendor-onboarding', name: 'Vendor Onboarding', steps: ['apply', 'verify', 'approve', 'setup-store', 'list-products'], entities: ['vendor', 'store', 'product'] },
    { id: 'dispute', name: 'Dispute Resolution', steps: ['file', 'vendor-respond', 'mediate', 'resolve', 'execute'], entities: ['dispute', 'order', 'vendor'] },
  ],
  entities: [
    { name: 'Product Listing', description: 'Vendor product with images, pricing, variants, and description', invariants: ['must have price', 'must have at least one image', 'category must be approved'] },
    { name: 'Order', description: 'Buyer order with items from one or more vendors', invariants: ['payment required before fulfillment', 'items cannot be added after submission'] },
    { name: 'Vendor', description: 'Registered seller with store profile, ratings, and payout settings', invariants: ['must have verified bank account', 'must maintain minimum rating'] },
  ],
  invariants: ['vendor commission calculated at fulfillment', 'products must be approved before public listing', 'buyer protection applies within 30 days of delivery'],
  constraints: ['vendor payout requires delivery confirmation + 14-day hold', 'listing approval within 24 hours', 'dispute resolution within 5 business days'],
  financialFlows: [
    { name: 'buyer-payment', direction: 'in', trigger: 'order-payment' },
    { name: 'vendor-payout', direction: 'out', trigger: 'delivery-confirmed-plus-hold' },
    { name: 'commission', direction: 'in', trigger: 'order-fulfillment' },
    { name: 'refund', direction: 'out', trigger: 'dispute-resolution' },
  ],
  successMetrics: ['gmv', 'commission-rate', 'vendor-retention', 'buyer-satisfaction', 'dispute-resolution-time', 'listing-approval-time'],
  analytics: { tracked: ['sales', 'vendor-performance', 'search-queries', 'conversion-rate', 'dispute-rates'], dashboards: ['sales', 'vendor', 'moderation', 'financial'] },
  securityRequirements: ['multi-role-auth', 'oauth-integration', 'payment-isolation', 'pii-encryption', 'content-moderation'],
  regulatory: [
    { regulation: 'PCI DSS', applies: true, notes: 'Payment processing via certified provider' },
    { regulation: 'GDPR', applies: true, notes: 'EU buyer and vendor data protection' },
    { regulation: 'Consumer Protection', applies: true, notes: 'Buyer rights and transparent vendor disclosure' },
  ],
};
