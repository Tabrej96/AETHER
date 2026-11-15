/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROJECT EXPANSION ENGINE
 * (src/core/projectExpansionEngine.ts) · Created by Tabrej
 *
 * Takes a one-line user prompt and expands it into a complete, market-competitive
 * project specification. No shortcuts. Every industry gets requirements based on
 * real market leaders.
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckKind = 'file-exists' | 'code-pattern' | 'functionality' | 'integration';

export interface Industry {
  id: string;
  name: string;
  keywords: string[];
  marketLeaders: string[];
  complianceRequirements: string[];
  techStack: string[];
}

export interface Requirement {
  id: string;
  description: string;
}

export interface Pillar {
  id: string;
  name: string;
  description: string;
  requirements: Requirement[];
  agent: string;
  dependencies: string[];
}

export interface Competitor {
  name: string;
  url: string;
  features: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface Criterion {
  id: string;
  description: string;
  check: CheckKind;
  target: string;
}

export interface TechStackChoice {
  category: string;
  selection: string;
  rationale: string;
}

export interface ArchitectureLayer {
  name: string;
  responsibilities: string[];
}

export interface ExpandedProject {
  id: string;
  prompt: string;
  industry: Industry;
  pillars: Pillar[];
  competitors: Competitor[];
  acceptanceCriteria: Criterion[];
  architecture: ArchitectureLayer[];
  techStack: TechStackChoice[];
}

// ---------------------------------------------------------------------------
// Industry catalog — keyword → industry mapping with real market context
// ---------------------------------------------------------------------------

const INDUSTRIES: Industry[] = [
  {
    id: 'saas',
    name: 'SaaS / Subscription Platform',
    keywords: ['SaaS', 'subscription', 'tenant', 'workspace', 'seat', 'plan', 'renewal', 'usage-based', 'metering', 'SaaS app', 'billing platform', 'SaaS dashboard'],
    marketLeaders: ['Stripe', 'Slack', 'Notion', 'Linear', 'HubSpot'],
    complianceRequirements: ['GDPR', 'SOC 2 Type II', 'PCI DSS (if payments)', 'CCPA'],
    techStack: ['Next.js / React', 'PostgreSQL', 'Redis', 'Stripe', 'Resend', 'Vercel'],
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce / Retail',
    keywords: ['shop', 'store', 'product', 'inventory', 'coupon', 'promotion', 'shipping', 'cart', 'checkout', 'variant', 'SKU', 'e-commerce', 'online store', 'retail'],
    marketLeaders: ['Shopify', 'Amazon', 'WooCommerce', 'BigCommerce', 'Magento'],
    complianceRequirements: ['PCI DSS', 'GDPR', 'CCPA', 'Tax compliance (sales tax / VAT)'],
    techStack: ['Next.js / Nuxt', 'PostgreSQL', 'Redis', 'Stripe', 'Algolia', 'AWS S3/Cloudflare'],
  },
  {
    id: 'marketplace',
    name: 'Marketplace / Platform',
    keywords: ['marketplace', 'seller', 'commission', 'listing', 'bid', 'payout', 'vendor', 'dispute', 'escrow', 'platform'],
    marketLeaders: ['eBay', 'Etsy', 'Airbnb', 'Upwork', 'Fiverr'],
    complianceRequirements: ['GDPR', 'KYC/AML', 'PCI DSS', 'Tax reporting (1099/109K)'],
    techStack: ['Next.js', 'PostgreSQL', 'Redis', 'Stripe Connect', 'Elasticsearch', 'AWS SES'],
  },
  {
    id: 'fintech',
    name: 'Fintech / Financial Services',
    keywords: ['fintech', 'payment', 'billing', 'ledger', 'accounting', 'loan', 'EMI', 'credit', 'refund', 'settlement', 'invoice', 'treasury', 'reconciliation', 'wallet', 'banking', 'finance'],
    marketLeaders: ['Stripe', 'PayPal', 'Plaid', 'Razorpay', ' Wise'],
    complianceRequirements: ['PCI DSS Level 1', 'SOC 2 Type II', 'AML/KYC', 'GDPR', 'PSD2 (EU)', 'Local banking regulations'],
    techStack: ['Node.js / Go', 'PostgreSQL', 'Redis', 'Kafka', 'Vault', 'AWS/GCP'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare / MedTech',
    keywords: ['health', 'patient', 'clinical', 'appointment', 'medical', 'diagnosis', 'EMR', 'HIPAA', 'prescription', 'treatment', 'telehealth', 'healthcare'],
    marketLeaders: ['Epic Systems', 'Cerner', 'Teladoc', 'Amwell', 'Babylon Health'],
    complianceRequirements: ['HIPAA (US)', 'GDPR', 'HITRUST', 'FHIR standards', '21 CFR Part 11'],
    techStack: ['React / Angular', 'PostgreSQL', 'FHIR server', 'AWS/GCP healthcare APIs', 'Terraform'],
  },
  {
    id: 'social',
    name: 'Social / Community Platform',
    keywords: ['social', 'community', 'feed', 'follow', 'like', 'post', 'comment', 'share', 'social network', 'messaging'],
    marketLeaders: ['Twitter/X', 'Discord', 'Reddit', 'LinkedIn', 'Instagram'],
    complianceRequirements: ['GDPR', 'COPPA', 'DMCA', 'Local content moderation laws'],
    techStack: ['Next.js / React Native', 'PostgreSQL', 'Redis', 'Elasticsearch', 'AWS S3', 'Kafka'],
  },
  {
    id: 'education',
    name: 'Education / EdTech',
    keywords: ['education', 'course', 'learning', 'student', 'teacher', 'classroom', 'LMS', 'quiz', 'exam', 'curriculum', 'edtech'],
    marketLeaders: ['Coursera', 'Udemy', 'Khan Academy', 'Canvas', 'Moodle'],
    complianceRequirements: ['GDPR', 'COPPA', 'FERPA', 'Section 508 (accessibility)'],
    techStack: ['Next.js', 'PostgreSQL', 'AWS S3 (video)', 'Redis', 'Vercel/Netlify'],
  },
  {
    id: 'productivity',
    name: 'Productivity / Project Management',
    keywords: ['productivity', 'task', 'kanban', 'project', 'Gantt', 'workload', 'sprint', 'milestone', 'swimlane', 'subtask', 'backlog', 'project management'],
    marketLeaders: ['Notion', 'Asana', 'Jira', 'Monday.com', 'ClickUp'],
    complianceRequirements: ['GDPR', 'SOC 2 Type II', 'SSO (SAML/OIDC)'],
    techStack: ['Next.js', 'PostgreSQL', 'Redis', 'Liveblocks/Pusher', 'Vercel'],
  },
  {
    id: 'devtools',
    name: 'Developer Tools / Infrastructure',
    keywords: ['developer tool', 'CLI', 'IDE', 'command palette', 'code review', 'monospace', 'log', 'diagnostic', 'CI/CD', 'deployment', 'developer'],
    marketLeaders: ['GitHub', 'GitLab', 'Vercel', 'Linear', 'Supabase'],
    complianceRequirements: ['SOC 2 Type II', 'GDPR', 'SLAs', 'Open source licenses'],
    techStack: ['Go / Rust / TypeScript', 'PostgreSQL', 'Redis', 'gRPC', 'Docker/K8s'],
  },
  {
    id: 'ai',
    name: 'AI / Machine Learning Platform',
    keywords: ['AI', 'LLM', 'prompt', 'inference', 'token', 'embedding', 'RAG', 'model', 'agent', 'chatbot', 'completion', 'machine learning'],
    marketLeaders: ['OpenAI', 'Anthropic', 'LangChain', 'Hugging Face', 'Pinecone'],
    complianceRequirements: ['GDPR', 'AI Act (EU)', 'Data privacy', 'Model governance'],
    techStack: ['Python/FastAPI', 'PostgreSQL', 'Pinecone/Weaviate', 'Redis', 'OpenAI/Anthropic API'],
  },
  {
    id: 'crm',
    name: 'CRM / Sales Automation',
    keywords: ['CRM', 'lead', 'deal', 'pipeline', 'contact', 'chance', 'sales', 'opportunity', 'sales automation'],
    marketLeaders: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Freshsales'],
    complianceRequirements: ['GDPR', 'SOC 2 Type II', 'CAN-SPAM', 'Data residency'],
    techStack: ['React/Angular', 'PostgreSQL', 'Redis', 'Elasticsearch', 'SendGrid'],
  },
  {
    id: 'media',
    name: 'Media / Streaming / Content',
    keywords: ['stream', 'video', 'audio', 'playlist', 'transcode', 'HLS', 'playback', 'watch history', 'genre', 'media', 'streaming'],
    marketLeaders: ['Netflix', 'YouTube', 'Spotify', 'Twitch', 'Vimeo'],
    complianceRequirements: ['GDPR', 'COPPA', 'Content licensing', 'DMCA', 'Local broadcast laws'],
    techStack: ['Next.js/React', 'PostgreSQL', 'AWS CloudFront/Mux', 'FFmpeg', 'Redis'],
  },
  {
    id: 'iot',
    name: 'IoT / Connected Devices',
    keywords: ['IoT', 'sensor', 'device', 'connected', 'telemetry', 'edge', 'firmware', 'MQTT', 'smart device'],
    marketLeaders: ['AWS IoT', 'Azure IoT', 'Google Cloud IoT', 'Particle', 'Tuya'],
    complianceRequirements: ['GDPR', 'CE/FCC certification', 'Data privacy', 'Industry-specific safety'],
    techStack: ['Go/Rust', 'TimescaleDB/InfluxDB', 'MQTT', 'Kafka', 'AWS IoT Core'],
  },
  {
    id: 'blockchain',
    name: 'Blockchain / Web3',
    keywords: ['blockchain', 'crypto', 'web3', 'NFT', 'smart contract', 'DeFi', 'token', 'dApp', 'wallet'],
    marketLeaders: ['Ethereum', 'Solana', 'Polygon', 'Chainlink', 'OpenSea'],
    complianceRequirements: ['AML/KYC', 'MiCA (EU)', 'Local crypto regulations', 'SEC guidelines'],
    techStack: ['Solidity/Rust', 'PostgreSQL', 'Ethers.js', 'IPFS', 'The Graph'],
  },
  {
    id: 'realestate',
    name: 'Real Estate / Property',
    keywords: ['real estate', 'property', 'listing', 'rent', 'lease', 'mortgage', 'agent', 'property management', 'REIT'],
    marketLeaders: ['Zillow', 'Redfin', 'Realtor.com', 'Apartments.com', 'LoopNet'],
    complianceRequirements: ['GDPR', 'Fair Housing laws', 'Local property regulations', 'AML for large transactions'],
    techStack: ['Next.js/React', 'PostgreSQL', 'Elasticsearch', 'Mapbox/Google Maps', 'Redis'],
  },
  {
    id: 'logistics',
    name: 'Logistics / Supply Chain',
    keywords: ['logistics', 'supply chain', 'shipping', 'tracking', 'fulfillment', 'warehouse', 'inventory', 'delivery', 'freight'],
    marketLeaders: ['Flexport', 'ShipBob', 'Freightos', 'FourKites', 'Project44'],
    complianceRequirements: ['GDPR', 'ISO 28000', 'Customs regulations', 'DOT regulations'],
    techStack: ['Node.js/Go', 'PostgreSQL', 'Redis', 'Kafka', 'PostGIS', 'AWS/GCP'],
  },
  {
    id: 'hr',
    name: 'HR / People Operations',
    keywords: ['HR', 'human resources', 'recruiting', 'talent', 'payroll', 'benefits', 'onboarding', 'performance', 'ATS'],
    marketLeaders: ['Workday', 'BambooHR', 'Greenhouse', 'Lever', 'Rippling'],
    complianceRequirements: ['GDPR', 'EEOC', 'FLSA', 'Local labor laws', 'Data privacy'],
    techStack: ['React/Angular', 'PostgreSQL', 'Elasticsearch', 'Auth0/Keycloak', 'SendGrid'],
  },
  {
    id: 'travel',
    name: 'Travel / Hospitality',
    keywords: ['travel', 'hotel', 'booking', 'flight', 'reservation', 'itinerary', 'vacation', 'hospitality', 'rental'],
    marketLeaders: ['Booking.com', 'Airbnb', 'Expedia', 'TripAdvisor', 'Marriott'],
    complianceRequirements: ['GDPR', 'PCI DSS', 'Travel regulations', 'Local tourism laws'],
    techStack: ['Next.js/React', 'PostgreSQL', 'Redis', 'Elasticsearch', 'Mapbox', 'AWS/GCP'],
  },
  {
    id: 'food',
    name: 'Food / Restaurant / QSR',
    keywords: ['restaurant', 'food', 'menu', 'ordering', 'kitchen', 'POS', 'delivery', 'QSR', 'dining', 'reservation'],
    marketLeaders: ['Toast', 'DoorDash', 'Uber Eats', 'OpenTable', 'Resy'],
    complianceRequirements: ['PCI DSS', 'Food safety regulations', 'GDPR', 'Local health codes'],
    techStack: ['React Native/Flutter', 'PostgreSQL', 'Redis', 'Stripe', 'Mapbox', 'AWS/GCP'],
  },
];

// ---------------------------------------------------------------------------
// Pillar templates per industry — 19 pillars, each with requirements + agent
// ---------------------------------------------------------------------------

interface PillarTemplate {
  name: string;
  description: string;
  requirements: string[];
  agent: string;
  dependencies: string[];
}

function pillarsForIndustry(industry: Industry): PillarTemplate[] {
  const templates: Record<string, PillarTemplate[]> = {
    saas: [
      { name: 'Tenant Architecture', description: 'Multi-tenant data isolation and workspace management', requirements: ['Tenant-scoped database schema', 'Row-level security policies', 'Workspace onboarding flow', 'Tenant-aware middleware'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Authentication & Authorization', description: 'Secure user identity with role-based access', requirements: ['OAuth 2.0 / OIDC integration', 'SSO (SAML) support', 'Role-based permissions', 'MFA enforcement'], agent: 'p11-fullstack', dependencies: ['Tenant Architecture'] },
      { name: 'Subscription Billing Engine', description: 'Recurring billing, invoicing, and payment processing', requirements: ['Subscription lifecycle management', 'Proration logic', 'Invoice generation', 'Payment retry/dunning'], agent: 'p13-business-logic', dependencies: ['Authentication & Authorization'] },
      { name: 'Usage Metering System', description: 'Track and enforce usage limits per tenant', requirements: ['Event-based metering', 'Usage aggregation', 'Overage detection', 'Billing period resets'], agent: 'p13-business-logic', dependencies: ['Subscription Billing Engine'] },
      { name: 'Admin Dashboard', description: 'Platform administration and tenant management', requirements: ['Tenant list and search', 'Usage analytics', 'Support ticket system', 'System health monitoring'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'API Layer', description: 'RESTful/GraphQL API with versioning', requirements: ['OpenAPI documentation', 'Rate limiting', 'API versioning', 'Webhook support'], agent: 'p11-fullstack', dependencies: ['Tenant Architecture'] },
      { name: 'Email & Notification System', description: 'Transactional and notification emails', requirements: ['Email templates', 'In-app notifications', 'Delivery tracking', 'Unsubscribe management'], agent: 'p11-fullstack', dependencies: ['API Layer'] },
      { name: 'Integration Hub', description: 'Third-party integrations and webhooks', requirements: ['OAuth app integrations', 'Webhook delivery with retries', 'Integration marketplace', 'API key management'], agent: 'p11-fullstack', dependencies: ['API Layer'] },
      { name: 'Security & Compliance', description: 'Security controls and audit logging', requirements: ['SOC 2 controls', 'Audit log immutability', 'Data encryption at rest', 'Incident response plan'], agent: 'security-suite', dependencies: ['Authentication & Authorization'] },
      { name: 'Onboarding Flow', description: 'New tenant onboarding experience', requirements: ['Signup wizard', 'Team invitation', 'Initial workspace setup', 'First-value guidance'], agent: 'p11-fullstack', dependencies: ['Admin Dashboard'] },
      { name: 'Analytics & Insights', description: 'Usage analytics and business intelligence', requirements: ['Usage dashboards', 'Revenue metrics', 'Churn prediction', 'Custom reporting'], agent: 'p11-fullstack', dependencies: ['Usage Metering System'] },
      { name: 'File Storage Service', description: 'Secure file upload and storage', requirements: ['S3-compatible storage', 'Virus scanning', 'CDN delivery', 'Storage quota enforcement'], agent: 'p11-fullstack', dependencies: ['API Layer'] },
      { name: 'Background Job Processing', description: 'Async task processing and scheduling', requirements: ['Job queue management', 'Retry with exponential backoff', 'Scheduled jobs', 'Dead letter queue'], agent: 'p11-fullstack', dependencies: ['API Layer'] },
      { name: 'Support & Help Center', description: 'Customer support infrastructure', requirements: ['Ticketing system', 'Knowledge base', 'Live chat integration', 'Customer satisfaction surveys'], agent: 'p11-fullstack', dependencies: ['Email & Notification System'] },
      { name: 'Mobile Experience', description: 'Mobile-responsive or native mobile app', requirements: ['Responsive design', 'Mobile app (PWA or native)', 'Push notifications', 'Offline capability'], agent: 'p11-fullstack', dependencies: ['Admin Dashboard'] },
      { name: 'Performance & Monitoring', description: 'Application monitoring and performance', requirements: ['APM integration', 'Error tracking', 'Performance budgets', 'Uptime monitoring'], agent: 'p11-fullstack', dependencies: ['Security & Compliance'] },
      { name: 'Disaster Recovery', description: 'Backup and recovery systems', requirements: ['Automated backups', 'Point-in-time recovery', 'Cross-region replication', 'Recovery testing'], agent: 'p11-fullstack', dependencies: ['Background Job Processing'] },
      { name: 'Testing Infrastructure', description: 'Comprehensive testing setup', requirements: ['Unit test suite (80%+ coverage)', 'Integration tests', 'E2E tests', 'Load testing'], agent: 'p14-quality', dependencies: ['API Layer'] },
      { name: 'Documentation & Developer Experience', description: 'API docs and developer onboarding', requirements: ['OpenAPI/Swagger docs', 'SDK generation', 'Getting started guides', 'Changelog automation'], agent: 'p14-quality', dependencies: ['API Layer'] },
    ],
    ecommerce: [
      { name: 'Product Catalog', description: 'Product management and categorization', requirements: ['Product CRUD operations', 'Category hierarchy', 'Product variants (size/color)', 'Product search and filtering'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Inventory Management', description: 'Stock tracking and reservation', requirements: ['Real-time stock tracking', 'Reservation system', 'Low-stock alerts', 'Multi-warehouse support'], agent: 'p13-business-logic', dependencies: ['Product Catalog'] },
      { name: 'Shopping Cart', description: 'Cart management and persistence', requirements: ['Add/remove/update cart', 'Persistent cart (logged out)', 'Cart expiry handling', 'Cart merging on login'], agent: 'p11-fullstack', dependencies: ['Product Catalog'] },
      { name: 'Checkout Flow', description: 'Multi-step checkout process', requirements: ['Guest checkout', 'Address management', 'Order review', 'Place order with idempotency'], agent: 'p11-fullstack', dependencies: ['Shopping Cart'] },
      { name: 'Payment Processing', description: 'Secure payment integration', requirements: ['Multiple payment gateways', 'Payment retry logic', 'Refund processing', 'Payment reconciliation'], agent: 'p13-business-logic', dependencies: ['Checkout Flow'] },
      { name: 'Order Management System', description: 'Order lifecycle and tracking', requirements: ['Order state machine', 'Order history', 'Order modification', 'Bulk order operations'], agent: 'p13-business-logic', dependencies: ['Payment Processing'] },
      { name: 'Customer Accounts', description: 'User profiles and account management', requirements: ['Profile management', 'Address book', 'Order history view', 'Wishlist'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'Authentication & Authorization', description: 'Customer and admin auth', requirements: ['Email/password auth', 'OAuth social login', 'Password reset', 'Role-based admin access'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Search & Discovery', description: 'Product search and recommendations', requirements: ['Full-text search', 'Faceted filtering', 'Sorting options', 'Search suggestions'], agent: 'p11-fullstack', dependencies: ['Product Catalog'] },
      { name: 'Promotions Engine', description: 'Discounts, coupons, and promotions', requirements: ['Coupon code validation', 'Percentage/fixed discounts', 'Stacking rules', 'Promotion scheduling'], agent: 'p13-business-logic', dependencies: ['Shopping Cart'] },
      { name: 'Shipping & Fulfillment', description: 'Shipping calculation and tracking', requirements: ['Shipping rate calculation', 'Carrier integration', 'Tracking number updates', 'Shipping label generation'], agent: 'p13-business-logic', dependencies: ['Order Management System'] },
      { name: 'Returns & Refunds', description: 'Return processing and refund workflow', requirements: ['Return request flow', 'Refund authorization', 'Restock logic', 'Return reason analytics'], agent: 'p13-business-logic', dependencies: ['Order Management System'] },
      { name: 'Admin Dashboard', description: 'Store management interface', requirements: ['Product management UI', 'Order management', 'Customer management', 'Reporting dashboard'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'Email & Notifications', description: 'Transactional communications', requirements: ['Order confirmation emails', 'Shipping notifications', 'Abandoned cart recovery', 'Promotional emails'], agent: 'p11-fullstack', dependencies: ['Order Management System'] },
      { name: 'Analytics & Reporting', description: 'Sales and customer analytics', requirements: ['Sales dashboards', 'Customer analytics', 'Inventory reports', 'Conversion tracking'], agent: 'p11-fullstack', dependencies: ['Admin Dashboard'] },
      { name: 'Multi-channel Support', description: 'Sell on multiple platforms', requirements: ['Channel inventory sync', 'Order aggregation', 'Centralized catalog', 'Channel-specific pricing'], agent: 'p11-fullstack', dependencies: ['Product Catalog'] },
      { name: 'SEO & Marketing', description: 'Search engine optimization', requirements: ['SEO-friendly URLs', 'Meta tag management', 'Schema.org markup', 'Sitemap generation'], agent: 'p11-fullstack', dependencies: ['Product Catalog'] },
      { name: 'Performance & Caching', description: 'Performance optimization', requirements: ['Image optimization', 'CDN integration', 'Cache strategies', 'Database query optimization'], agent: 'p11-fullstack', dependencies: ['Search & Discovery'] },
      { name: 'Testing & QA', description: 'Quality assurance', requirements: ['Unit tests', 'Integration tests', 'E2E checkout tests', 'Performance tests'], agent: 'p14-quality', dependencies: ['Admin Dashboard'] },
    ],
    marketplace: [
      { name: 'Multi-tenant Architecture', description: 'Seller and buyer isolation', requirements: ['Separate seller workspaces', 'Commission tracking', 'Seller onboarding', 'Role-based access'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Listing Management', description: 'Product listing creation and management', requirements: ['Listing CRUD', 'Listing templates', 'Bulk listing operations', 'Listing moderation'], agent: 'p11-fullstack', dependencies: ['Multi-tenant Architecture'] },
      { name: 'Search & Discovery', description: 'Marketplace-wide search', requirements: ['Full-text search', 'Faceted filtering', 'Seller-specific search', 'Recommendation engine'], agent: 'p11-fullstack', dependencies: ['Listing Management'] },
      { name: 'Cart & Checkout', description: 'Multi-seller checkout flow', requirements: ['Multi-seller cart', 'Split payments', 'Order consolidation', 'Checkout idempotency'], agent: 'p11-fullstack', dependencies: ['Search & Discovery'] },
      { name: 'Payment & Commission', description: 'Payment splitting and commission', requirements: ['Commission calculation', 'Seller payouts', 'Payment reconciliation', 'Dispute handling'], agent: 'p13-business-logic', dependencies: ['Cart & Checkout'] },
      { name: 'Order Management', description: 'Cross-seller order coordination', requirements: ['Order state machine', 'Multi-seller tracking', 'Order cancellation', 'Refund coordination'], agent: 'p13-business-logic', dependencies: ['Payment & Commission'] },
      { name: 'Messaging System', description: 'Buyer-seller communication', requirements: ['Real-time chat', 'Message history', 'Attachment support', 'Spam filtering'], agent: 'p11-fullstack', dependencies: ['Multi-tenant Architecture'] },
      { name: 'Reviews & Ratings', description: 'Trust and review system', requirements: ['Star ratings', 'Review moderation', 'Verified purchase badge', 'Review helpfulness voting'], agent: 'p11-fullstack', dependencies: ['Order Management'] },
      { name: 'Dispute Resolution', description: 'Buyer-seller dispute handling', requirements: ['Dispute filing', 'Evidence submission', 'Mediation workflow', 'Resolution tracking'], agent: 'p13-business-logic', dependencies: ['Reviews & Ratings'] },
      { name: 'Seller Dashboard', description: 'Seller-facing management tools', requirements: ['Sales analytics', 'Inventory management', 'Payout history', 'Performance metrics'], agent: 'p11-fullstack', dependencies: ['Multi-tenant Architecture'] },
      { name: 'Buyer Dashboard', description: 'Buyer-facing account tools', requirements: ['Order history', 'Wishlist', 'Saved searches', 'Return tracking'], agent: 'p11-fullstack', dependencies: ['Multi-tenant Architecture'] },
      { name: 'Authentication & Authorization', description: 'Multi-role auth system', requirements: ['Buyer/seller/admin roles', 'OAuth integration', 'Email verification', 'Account security'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Commission & Payout Engine', description: 'Financial settlement system', requirements: ['Commission rules', 'Payout scheduling', 'Tax documentation', 'Payout reconciliation'], agent: 'p13-business-logic', dependencies: ['Payment & Commission'] },
      { name: 'Notification System', description: 'Multi-party notifications', requirements: ['Order notifications', 'Message alerts', 'Promotional emails', 'Push notifications'], agent: 'p11-fullstack', dependencies: ['Messaging System'] },
      { name: 'Admin & Moderation', description: 'Platform-level administration', requirements: ['User management', 'Content moderation', 'Dispute resolution', 'Platform analytics'], agent: 'p11-fullstack', dependencies: ['Dispute Resolution'] },
      { name: 'Analytics Platform', description: 'Marketplace analytics', requirements: ['GMV tracking', 'Seller performance', 'Category analytics', 'Fraud detection'], agent: 'p11-fullstack', dependencies: ['Admin & Moderation'] },
      { name: 'API & Integrations', description: 'Public API for sellers', requirements: ['REST API', 'Webhook support', 'SDK for popular languages', 'Rate limiting'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'Security & Compliance', description: 'Platform security', requirements: ['KYC/AML checks', 'Fraud detection', 'Data encryption', 'Audit logging'], agent: 'security-suite', dependencies: ['Commission & Payout Engine'] },
      { name: 'Testing Suite', description: 'Comprehensive testing', requirements: ['Unit tests', 'Integration tests', 'E2E marketplace flows', 'Load tests'], agent: 'p14-quality', dependencies: ['Admin & Moderation'] },
    ],
    fintech: [
      { name: 'Ledger Core', description: 'Double-entry bookkeeping system', requirements: ['Immutable ledger entries', 'Chart of accounts', 'Journal entries', 'Trial balance'], agent: 'p13-business-logic', dependencies: [] },
      { name: 'Authentication & Authorization', description: 'Financial-grade auth', requirements: ['MFA enforcement', 'Biometric auth', 'Session management', 'Device trust'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Payment Processing', description: 'Payment initiation and settlement', requirements: ['Multiple PSP integration', 'Payment orchestration', 'Settlement reconciliation', 'Idempotent operations'], agent: 'p13-business-logic', dependencies: ['Ledger Core'] },
      { name: 'Wallet System', description: 'Digital wallet functionality', requirements: ['Wallet creation', 'Balance management', 'Transaction history', 'Wallet freezing'], agent: 'p13-business-logic', dependencies: ['Payment Processing'] },
      { name: 'KYC/AML Compliance', description: 'Know-your-customer verification', requirements: ['Identity verification', 'AML screening', 'Document upload', 'Compliance checks'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'Transaction Engine', description: 'Core transaction processing', requirements: ['Atomic transactions', 'Idempotency keys', 'Rollback handling', 'Event sourcing'], agent: 'p13-business-logic', dependencies: ['Wallet System'] },
      { name: 'Risk & Fraud Detection', description: 'Real-time fraud prevention', requirements: ['Behavioral analysis', 'Transaction limits', 'Velocity checks', 'Alert system'], agent: 'p11-fullstack', dependencies: ['Transaction Engine'] },
      { name: 'Reporting & Statements', description: 'Financial reporting', requirements: ['Account statements', 'Transaction reports', 'Tax documents', 'Export capabilities'], agent: 'p11-fullstack', dependencies: ['Ledger Core'] },
      { name: 'Notification System', description: 'Transaction alerts', requirements: ['Push notifications', 'Email alerts', 'SMS alerts', 'In-app notifications'], agent: 'p11-fullstack', dependencies: ['Transaction Engine'] },
      { name: 'Admin Dashboard', description: 'Operations and compliance dashboard', requirements: ['Transaction monitoring', 'User management', 'Compliance reporting', 'System health'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'Audit & Compliance', description: 'Regulatory compliance', requirements: ['Audit trail', 'Compliance reports', 'Regulatory filings', 'Data retention'], agent: 'security-suite', dependencies: ['Ledger Core'] },
      { name: 'Integration Layer', description: 'Banking and external integrations', requirements: ['PSP integrations', 'Banking APIs', 'Webhook callbacks', 'SDK support'], agent: 'p11-fullstack', dependencies: ['Transaction Engine'] },
      { name: 'Security Infrastructure', description: 'Financial-grade security', requirements: ['Encryption at rest/transit', 'HSM integration', 'Secret rotation', 'Penetration testing'], agent: 'security-suite', dependencies: ['Authentication & Authorization'] },
      { name: 'Mobile Banking', description: 'Mobile money experience', requirements: ['Mobile app', 'Biometric auth', 'Mobile deposits', 'Branch finder'], agent: 'p11-fullstack', dependencies: ['Wallet System'] },
      { name: 'Lending Engine', description: 'Loan origination and management', requirements: ['Credit scoring', 'Loan application', 'Disbursement', 'EMI calculation'], agent: 'p13-business-logic', dependencies: ['Transaction Engine'] },
      { name: 'Data Pipeline', description: 'Financial data processing', requirements: ['Real-time processing', 'Batch reconciliation', 'Data lake', 'ETL pipelines'], agent: 'p11-fullstack', dependencies: ['Reporting & Statements'] },
      { name: 'API Gateway', description: 'External API access', requirements: ['Open Banking APIs', 'Rate limiting', 'API key management', 'Webhook subscriptions'], agent: 'p11-fullstack', dependencies: ['Integration Layer'] },
      { name: 'Testing Suite', description: 'Financial correctness testing', requirements: ['Property-based tests', 'Reconciliation tests', 'Security tests', 'Compliance tests'], agent: 'p14-quality', dependencies: ['Transaction Engine'] },
      { name: 'Disaster Recovery', description: 'Business continuity', requirements: ['Multi-region backup', 'RTO/RPO targets', 'Failover automation', 'Data integrity checks'], agent: 'p11-fullstack', dependencies: ['Security Infrastructure'] },
    ],
    healthcare: [
      { name: 'Patient Management', description: 'Patient identity and records', requirements: ['Patient registration', 'Identity verification', 'Medical history', 'Consent management'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Authentication & Authorization', description: 'HIPAA-compliant access control', requirements: ['Role-based access', 'Minimum necessary access', 'Session timeouts', 'Access logging'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Appointment Scheduling', description: 'Appointment booking and management', requirements: ['Calendar integration', 'Slot management', 'Reminders', 'Waitlist'], agent: 'p13-business-logic', dependencies: ['Patient Management'] },
      { name: 'Clinical Documentation', description: 'Electronic health records', requirements: ['EHR creation', 'FHIR compatibility', 'Clinical notes', 'Document templates'], agent: 'p11-fullstack', dependencies: ['Patient Management'] },
      { name: 'Prescription Management', description: 'Medication tracking', requirements: ['Prescription creation', 'Drug interaction checks', 'Refill requests', 'Pharmacy integration'], agent: 'p13-business-logic', dependencies: ['Clinical Documentation'] },
      { name: 'Billing & Insurance', description: 'Medical billing', requirements: ['Insurance verification', 'Claim submission', 'Payment processing', 'EOB generation'], agent: 'p13-business-logic', dependencies: ['Appointment Scheduling'] },
      { name: 'Telehealth Platform', description: 'Virtual consultations', requirements: ['Video consultation', 'Screen sharing', 'Virtual waiting room', 'Consultation recording'], agent: 'p11-fullstack', dependencies: ['Appointment Scheduling'] },
      { name: 'Lab & Diagnostics', description: 'Lab result management', requirements: ['Test ordering', 'Result reporting', 'Normal range flags', 'Trend analysis'], agent: 'p11-fullstack', dependencies: ['Clinical Documentation'] },
      { name: 'Reporting & Analytics', description: 'Healthcare analytics', requirements: ['Patient outcomes', 'Provider performance', 'Population health', 'Quality metrics'], agent: 'p11-fullstack', dependencies: ['Clinical Documentation'] },
      { name: 'Patient Portal', description: 'Patient self-service', requirements: ['View records', 'Request appointments', 'Message providers', 'Pay bills'], agent: 'p11-fullstack', dependencies: ['Patient Management'] },
      { name: 'Provider Dashboard', description: 'Clinical staff interface', requirements: ['Patient list', 'Clinical notes', 'Order entry', 'Schedule view'], agent: 'p11-fullstack', dependencies: ['Clinical Documentation'] },
      { name: 'Notification System', description: 'Healthcare communications', requirements: ['Appointment reminders', 'Lab result alerts', 'Medication reminders', 'Secure messaging'], agent: 'p11-fullstack', dependencies: ['Appointment Scheduling'] },
      { name: 'Security & Compliance', description: 'HIPAA compliance', requirements: ['Access controls', 'Audit logging', 'Encryption', 'BAA agreements'], agent: 'security-suite', dependencies: ['Authentication & Authorization'] },
      { name: 'Data Exchange', description: 'Interoperability', requirements: ['HL7 integration', 'FHIR API', 'Health information exchange', 'Referral management'], agent: 'p11-fullstack', dependencies: ['Clinical Documentation'] },
      { name: 'Mobile Health', description: 'Mobile patient experience', requirements: ['Mobile app', 'Health tracking', 'Medication reminders', 'Telehealth access'], agent: 'p11-fullstack', dependencies: ['Patient Portal'] },
      { name: 'Inventory & Supply', description: 'Medical supply management', requirements: ['Inventory tracking', 'Expiration alerts', 'Vendor management', 'Usage reporting'], agent: 'p13-business-logic', dependencies: ['Lab & Diagnostics'] },
      { name: 'Quality & Safety', description: 'Quality assurance', requirements: ['Incident reporting', 'Root cause analysis', 'Quality metrics', 'Accreditation tracking'], agent: 'p14-quality', dependencies: ['Reporting & Analytics'] },
      { name: 'Integration Layer', description: 'Third-party integrations', requirements: ['EHR integration', 'Lab system integration', 'Pharmacy integration', 'Insurance APIs'], agent: 'p11-fullstack', dependencies: ['Data Exchange'] },
      { name: 'Testing & Validation', description: 'Healthcare QA', requirements: ['Clinical workflow tests', 'HIPAA compliance tests', 'Interoperability tests', 'Usability testing'], agent: 'p14-quality', dependencies: ['Quality & Safety'] },
    ],
    social: [
      { name: 'User Identity & Profiles', description: 'User accounts and profiles', requirements: ['User registration', 'Profile management', 'Avatar/cover images', 'Bio and links'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Authentication System', description: 'Secure authentication', requirements: ['Email/password', 'OAuth providers', '2FA support', 'Account recovery'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Feed Engine', description: 'Content feed generation', requirements: ['Timeline algorithm', 'Content ranking', 'Real-time updates', 'Feed caching'], agent: 'p11-fullstack', dependencies: ['User Identity & Profiles'] },
      { name: 'Content Creation', description: 'Post and media creation', requirements: ['Text posts', 'Media upload', 'Rich text editor', 'Draft saving'], agent: 'p11-fullstack', dependencies: ['User Identity & Profiles'] },
      { name: 'Social Graph', description: 'Follow and connection system', requirements: ['Follow/unfollow', 'Follower lists', 'Blocking', 'Muting'], agent: 'p13-business-logic', dependencies: ['User Identity & Profiles'] },
      { name: 'Engagement Features', description: 'Likes, comments, shares', requirements: ['Like/unlike', 'Commenting', 'Sharing', 'Bookmarks'], agent: 'p13-business-logic', dependencies: ['Feed Engine'] },
      { name: 'Messaging System', description: 'Direct messaging', requirements: ['1-on-1 chat', 'Group chats', 'Message persistence', 'Read receipts'], agent: 'p11-fullstack', dependencies: ['Social Graph'] },
      { name: 'Notification Engine', description: 'Activity notifications', requirements: ['Push notifications', 'Email notifications', 'In-app alerts', 'Notification preferences'], agent: 'p11-fullstack', dependencies: ['Engagement Features'] },
      { name: 'Content Moderation', description: 'Safety and moderation', requirements: ['Auto-moderation', 'User reporting', 'Admin review', 'Shadow banning'], agent: 'security-suite', dependencies: ['Content Creation'] },
      { name: 'Media Storage', description: 'Asset management', requirements: ['Image/video upload', 'CDN delivery', 'Format conversion', 'Storage quotas'], agent: 'p11-fullstack', dependencies: ['Content Creation'] },
      { name: 'Search & Discovery', description: 'Content and user search', requirements: ['Full-text search', 'User search', 'Trending topics', 'Recommendations'], agent: 'p11-fullstack', dependencies: ['Feed Engine'] },
      { name: 'Analytics Dashboard', description: 'User and content analytics', requirements: ['Engagement metrics', 'Growth tracking', 'Content performance', 'User segmentation'], agent: 'p11-fullstack', dependencies: ['Feed Engine'] },
      { name: 'Admin & Trust Safety', description: 'Platform administration', requirements: ['User management', 'Content moderation', 'Ban management', 'Trust metrics'], agent: 'p11-fullstack', dependencies: ['Content Moderation'] },
      { name: 'API Layer', description: 'Public/private APIs', requirements: ['REST API', 'GraphQL API', 'Rate limiting', 'API keys'], agent: 'p11-fullstack', dependencies: ['Authentication System'] },
      { name: 'Mobile Experience', description: 'Mobile-first experience', requirements: ['Responsive design', 'Mobile app', 'Push notifications', 'Offline mode'], agent: 'p11-fullstack', dependencies: ['Feed Engine'] },
      { name: 'Privacy Controls', description: 'User privacy settings', requirements: ['Privacy settings', 'Data export', 'Account deletion', 'Consent management'], agent: 'security-suite', dependencies: ['Authentication System'] },
      { name: 'Real-time Infrastructure', description: 'Live updates and presence', requirements: ['WebSocket connections', 'Presence indicators', 'Live typing', 'Real-time feed updates'], agent: 'p11-fullstack', dependencies: ['Feed Engine'] },
      { name: 'Performance & CDN', description: 'Performance optimization', requirements: ['Image optimization', 'CDN setup', 'Lazy loading', 'Caching strategies'], agent: 'p11-fullstack', dependencies: ['Media Storage'] },
      { name: 'Testing Suite', description: 'Quality assurance', requirements: ['Unit tests', 'Integration tests', 'E2E social flows', 'Load tests'], agent: 'p14-quality', dependencies: ['API Layer'] },
    ],
    default: [
      { name: 'Core Architecture', description: 'Project foundation and structure', requirements: ['Project setup', 'Dependency management', 'Build configuration', 'Development environment'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Authentication & Authorization', description: 'User identity and access control', requirements: ['User registration', 'Login/logout', 'Password reset', 'Role-based access'], agent: 'p11-fullstack', dependencies: [] },
      { name: 'Data Models', description: 'Database schema and models', requirements: ['Entity definitions', 'Relationships', 'Migrations', 'Seed data'], agent: 'p11-fullstack', dependencies: ['Core Architecture'] },
      { name: 'API Layer', description: 'Backend API endpoints', requirements: ['RESTful endpoints', 'Input validation', 'Error handling', 'API versioning'], agent: 'p11-fullstack', dependencies: ['Core Architecture'] },
      { name: 'Business Logic', description: 'Core application logic', requirements: ['Service layer', 'Domain logic', 'State management', 'Event handling'], agent: 'p13-business-logic', dependencies: ['Data Models'] },
      { name: 'Frontend UI', description: 'User interface components', requirements: ['Component library', 'Responsive design', 'State management', 'Routing'], agent: 'p11-fullstack', dependencies: ['API Layer'] },
      { name: 'User Experience', description: 'UX patterns and flows', requirements: ['User onboarding', 'Error states', 'Loading states', 'Empty states'], agent: 'p11-fullstack', dependencies: ['Frontend UI'] },
      { name: 'Search & Filtering', description: 'Data search capabilities', requirements: ['Full-text search', 'Advanced filters', 'Sort options', 'Search suggestions'], agent: 'p11-fullstack', dependencies: ['Data Models'] },
      { name: 'Notification System', description: 'User notifications', requirements: ['Email notifications', 'Push notifications', 'In-app alerts', 'Notification preferences'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'File Management', description: 'File upload and storage', requirements: ['Upload endpoints', 'File validation', 'Storage backend', 'CDN delivery'], agent: 'p11-fullstack', dependencies: ['API Layer'] },
      { name: 'Admin Interface', description: 'Administration tools', requirements: ['Dashboard', 'User management', 'Content moderation', 'System settings'], agent: 'p11-fullstack', dependencies: ['Authentication & Authorization'] },
      { name: 'Reporting & Analytics', description: 'Data analytics and reporting', requirements: ['Usage metrics', 'Performance dashboards', 'Export capabilities', 'Scheduled reports'], agent: 'p11-fullstack', dependencies: ['Data Models'] },
      { name: 'Integration Layer', description: 'Third-party integrations', requirements: ['External APIs', 'Webhooks', 'SDK support', 'Integration docs'], agent: 'p11-fullstack', dependencies: ['API Layer'] },
      { name: 'Security Controls', description: 'Security implementation', requirements: ['Input sanitization', 'Rate limiting', 'CORS configuration', 'Security headers'], agent: 'security-suite', dependencies: ['Authentication & Authorization'] },
      { name: 'Performance Optimization', description: 'Application performance', requirements: ['Caching strategy', 'Database optimization', 'Image optimization', 'Bundle optimization'], agent: 'p11-fullstack', dependencies: ['Frontend UI'] },
      { name: 'Testing Infrastructure', description: 'Quality assurance', requirements: ['Unit tests', 'Integration tests', 'E2E tests', 'CI/CD pipeline'], agent: 'p14-quality', dependencies: ['Business Logic'] },
      { name: 'Deployment & DevOps', description: 'Deployment infrastructure', requirements: ['Container setup', 'CI/CD pipeline', 'Environment config', 'Monitoring'], agent: 'p11-fullstack', dependencies: ['Testing Infrastructure'] },
      { name: 'Documentation', description: 'Project documentation', requirements: ['README', 'API docs', 'Developer guide', 'Architecture diagrams'], agent: 'p14-quality', dependencies: ['API Layer'] },
      { name: 'Monitoring & Observability', description: 'System monitoring', requirements: ['Application metrics', 'Error tracking', 'Log aggregation', 'Alerting'], agent: 'p11-fullstack', dependencies: ['Deployment & DevOps'] },
    ],
  };

  // Map industry id to template, fallback to default
  return templates[industry.id] || templates['default'];
}

// ---------------------------------------------------------------------------
// Competitor data per industry
// ---------------------------------------------------------------------------

interface CompetitorTemplate {
  name: string;
  url: string;
  features: string[];
  strengths: string[];
  weaknesses: string[];
}

function competitorsForIndustry(industry: Industry): CompetitorTemplate[] {
  const data: Record<string, CompetitorTemplate[]> = {
    saas: [
      { name: 'Stripe', url: 'https://stripe.com', features: ['Payment processing', 'Subscription billing', 'Developer-first API', 'Global payments'], strengths: ['Best-in-class API', '99.99% uptime', 'Global coverage'], weaknesses: ['Premium pricing', 'Limited customization'] },
      { name: 'Slack', url: 'https://slack.com', features: ['Team messaging', 'Integrations', 'File sharing', 'Workflow automation'], strengths: ['Strong integrations', 'User-friendly', 'Enterprise features'], weaknesses: ['High cost at scale', 'Feature bloat'] },
      { name: 'Notion', url: 'https://notion.so', features: ['All-in-one workspace', 'Databases', 'Collaboration', 'Templates'], strengths: ['Flexible', 'Beautiful UX', 'Strong free tier'], weaknesses: ['Slow with large datasets', 'Offline limited'] },
    ],
    ecommerce: [
      { name: 'Shopify', url: 'https://shopify.com', features: ['Store builder', 'Payment processing', 'Inventory management', 'Multi-channel selling'], strengths: ['Easy setup', 'Huge app ecosystem', 'Reliable'], weaknesses: ['Transaction fees', 'Limited customization', 'Expensive at scale'] },
      { name: 'WooCommerce', url: 'https://woocommerce.com', features: ['WordPress-based', 'Flexible', 'Open source', 'Huge plugin ecosystem'], strengths: ['Open source', 'Highly customizable', 'No transaction fees'], weaknesses: ['Requires WordPress', 'Performance issues', 'Maintenance burden'] },
      { name: 'BigCommerce', url: 'https://bigcommerce.com', features: ['Enterprise features', 'Multi-channel', 'API-first', 'Headless commerce'], strengths: ['Enterprise-ready', 'No transaction fees', 'Strong API'], weaknesses: ['Higher pricing', 'Smaller app ecosystem'] },
    ],
    marketplace: [
      { name: 'eBay', url: 'https://ebay.com', features: ['Auction model', 'Global marketplace', 'Seller tools', 'Buyer protection'], strengths: ['Massive user base', 'Trusted brand', 'Global reach'], weaknesses: ['Fee structure', 'Competition', 'Quality inconsistency'] },
      { name: 'Etsy', url: 'https://etsy.com', features: ['Handmade focus', 'Seller shops', 'Personalization', 'Community'], strengths: ['Niche market', 'Strong community', 'Brand recognition'], weaknesses: ['Limited scale', 'Fee structure', 'Counterfeit issues'] },
      { name: 'Airbnb', url: 'https://airbnb.com', features: ['Property listings', 'Booking system', 'Reviews', 'Host tools'], strengths: ['Strong brand', 'Great UX', 'Trust system'], weaknesses: ['Regulatory challenges', 'High fees', 'Quality control'] },
    ],
    fintech: [
      { name: 'Stripe', url: 'https://stripe.com', features: ['Payment processing', 'Billing', 'Connect', 'Treasury'], strengths: ['Developer-first', 'Global', 'Reliable'], weaknesses: ['Premium pricing', 'US-centric initially'] },
      { name: 'PayPal', url: 'https://paypal.com', features: ['Digital wallet', 'Payment processing', 'Merchant tools', 'Buyer protection'], strengths: ['Massive adoption', 'Trust', 'Global'], weaknesses: ['Complex API', 'Poor developer experience', 'Frozen accounts'] },
      { name: 'Plaid', url: 'https://plaid.com', features: ['Bank connections', 'Account verification', 'Transaction data', 'Identity verification'], strengths: ['Wide bank support', 'Reliable', 'Compliant'], weaknesses: ['Expensive', 'Limited to supported banks'] },
    ],
    healthcare: [
      { name: 'Epic Systems', url: 'https://epic.com', features: ['EHR system', 'Patient portal', 'Billing', 'Analytics'], strengths: ['Comprehensive', 'Interoperable', 'Trusted'], weaknesses: ['Expensive', 'Complex implementation', 'US-focused'] },
      { name: 'Cerner', url: 'https://cerner.com', features: ['EHR', 'Revenue cycle', 'Patient engagement', 'Analytics'], strengths: ['Enterprise features', 'Global presence', 'Integration'], weaknesses: ['Legacy UI', 'High cost', 'Implementation time'] },
      { name: 'Teladoc', url: 'https://teladochealth.com', features: ['Telehealth', 'Virtual care', 'Remote monitoring', 'Chronic care'], strengths: ['Telehealth leader', 'Insurance coverage', 'Global'], weaknesses: ['Cost', 'Limited to video', 'Tech issues'] },
    ],
    social: [
      { name: 'Twitter/X', url: 'https://x.com', features: ['Microblogging', 'Real-time feed', 'Spaces', 'Communities'], strengths: ['Real-time', 'Public discourse', 'API'], weaknesses: ['Content moderation', 'Advertiser issues', 'Instability'] },
      { name: 'Discord', url: 'https://discord.com', features: ['Communities', 'Voice/video', 'Bots', 'Server roles'], strengths: ['Community focus', 'Rich features', 'Free tier'], weaknesses: ['Discovery', 'Moderation at scale', 'Competition'] },
      { name: 'Reddit', url: 'https://reddit.com', features: ['Subreddits', 'Voting', 'AMA', 'Community moderation'], strengths: ['Strong communities', 'Content depth', 'Anonymous'], weaknesses: ['Moderation challenges', 'Interface changes', 'API controversy'] },
    ],
    education: [
      { name: 'Coursera', url: 'https://coursera.org', features: ['Online courses', 'Certificates', 'University partnerships', 'Skills training'], strengths: ['Brand trust', 'Quality content', 'Credentials'], weaknesses: ['Expensive', 'Limited interactivity', 'Pacing'] },
      { name: 'Udemy', url: 'https://udemy.com', features: ['Course marketplace', 'Video courses', 'Q&A', 'Certificates'], strengths: ['Large catalog', 'Affordable', 'Frequent sales'], weaknesses: ['Quality varies', 'No structured path', 'Outdated content'] },
      { name: 'Canvas', url: 'https://instructure.com/canvas', features: ['LMS', 'Assignments', 'Grading', 'Collaboration'], strengths: ['Open standards', 'Institution-grade', 'Integrations'], weaknesses: ['Complex', 'Enterprise pricing', 'Learning curve'] },
    ],
    productivity: [
      { name: 'Notion', url: 'https://notion.so', features: ['All-in-one workspace', 'Databases', 'Collaboration', 'Templates'], strengths: ['Flexible', 'Beautiful', 'Free tier'], weaknesses: ['Offline limited', 'Slow at scale', 'No native desktop'] },
      { name: 'Asana', url: 'https://asana.com', features: ['Task management', 'Timeline', 'Workflows', 'Reporting'], strengths: ['Clean UX', 'Integrations', 'Mobile app'], weaknesses: ['Expensive', 'Complex for small teams', 'Learning curve'] },
      { name: 'Jira', url: 'https://atlassian.com/software/jira', features: ['Issue tracking', 'Agile boards', 'Roadmaps', 'Integrations'], strengths: ['Highly configurable', 'Dev-focused', 'Integrations'], weaknesses: ['Complex', 'Expensive', 'Slow'] },
    ],
    devtools: [
      { name: 'GitHub', url: 'https://github.com', features: ['Git hosting', 'CI/CD', 'Code review', 'Actions'], strengths: ['Network effect', 'Excellent CI', 'Open source'], weaknesses: ['Copilot pricing', 'Complex pricing', 'Centralized'] },
      { name: 'Vercel', url: 'https://vercel.com', features: ['Frontend deployment', 'Edge functions', 'Preview deploys', 'Analytics'], strengths: ['Fast deploys', 'Great DX', 'Edge network'], weaknesses: ['Expensive at scale', 'Vendor lock-in', 'Limited backend'] },
      { name: 'Supabase', url: 'https://supabase.com', features: ['PostgreSQL', 'Auth', 'Realtime', 'Edge functions'], strengths: ['Open source', 'PostgreSQL', 'Great DX'], weaknesses: ['Scaling', 'Support', 'Feature gaps vs Firebase'] },
    ],
    ai: [
      { name: 'OpenAI', url: 'https://openai.com', features: ['GPT models', 'DALL-E', 'Whisper', 'API'], strengths: ['Leading models', 'Easy API', 'Documentation'], weaknesses: ['Cost', 'Privacy concerns', 'Competition'] },
      { name: 'LangChain', url: 'https://langchain.com', features: ['LLM orchestration', 'Agents', 'Memory', 'Tools'], strengths: ['Flexible', 'Huge ecosystem', 'Multi-provider'], weaknesses: ['Complex', 'Version instability', 'Abstraction leaks'] },
      { name: 'Pinecone', url: 'https://pinecone.io', features: ['Vector database', 'Hybrid search', 'Metadata filtering', 'Serverless'], strengths: ['Fast', 'Scalable', 'Easy setup'], weaknesses: ['Cost at scale', 'Limited customization', 'Vendor lock-in'] },
    ],
    default: [
      { name: 'Competitor A', url: 'https://example.com/a', features: ['Core features', 'User management', 'Reporting'], strengths: ['Established brand', 'Large user base'], weaknesses: ['Legacy codebase', 'High pricing'] },
      { name: 'Competitor B', url: 'https://example.com/b', features: ['Modern UI', 'API access', 'Integrations'], strengths: ['Modern stack', 'Good UX'], weaknesses: ['Limited features', 'Small team'] },
      { name: 'Competitor C', url: 'https://example.com/c', features: ['Enterprise features', 'Customization', 'Support'], strengths: ['Enterprise-grade', 'Customizable'], weaknesses: ['Expensive', 'Complex setup'] },
    ],
  };

  return data[industry.id] || data['default'];
}

// ---------------------------------------------------------------------------
// Acceptance criteria generator
// ---------------------------------------------------------------------------

function generateCriteria(pillar: Pillar): Criterion[] {
  const criteria: Criterion[] = [];
  let idCounter = 1;

  for (const req of pillar.requirements) {
    const reqLower = req.description.toLowerCase();

    // File existence criteria
    if (reqLower.includes('dashboard') || reqLower.includes('portal') || reqLower.includes('interface')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - UI file exists in src/`,
        check: 'file-exists',
        target: `src/**/${pillar.id}/**/*.tsx`,
      });
    }

    if (reqLower.includes('API') || reqLower.includes('endpoint') || reqLower.includes('REST')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - API endpoint exists and is routed`,
        check: 'file-exists',
        target: `src/api/**/${pillar.id}/**/*.ts`,
      });
    }

    if (reqLower.includes('model') || reqLower.includes('schema') || reqLower.includes('entity')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Data model is defined`,
        check: 'file-exists',
        target: `src/models/**/${pillar.id}/**/*.ts`,
      });
    }

    // Code pattern criteria
    if (reqLower.includes('auth') || reqLower.includes('security') || reqLower.includes('permission')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Authentication/authorization pattern implemented`,
        check: 'code-pattern',
        target: `guard/auth.*|middleware/auth.*|requireAuth|hasRole|verifyToken`,
      });
    }

    if (reqLower.includes('encrypt') || reqLower.includes('secure') || reqLower.includes('compliance')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Security controls in place`,
        check: 'code-pattern',
        target: `encrypt|hash|bcrypt|argon2|encryptionAtRest|TLS|cors`,
      });
    }

    if (reqLower.includes('test') || reqLower.includes('coverage')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Test coverage implemented`,
        check: 'code-pattern',
        target: `describe\\(|it\\(|test\\(|expect\\(|vitest|jest`,
      });
    }

    if (reqLower.includes('API') || reqLower.includes('validation')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Input validation present`,
        check: 'code-pattern',
        target: `zod|joi|yup|validate|validator|sanitize`,
      });
    }

    // Functionality criteria
    if (reqLower.includes('CRUD') || reqLower.includes('create') || reqLower.includes('manage')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - CRUD operations functional`,
        check: 'functionality',
        target: `${pillar.id}:create,${pillar.id}:read,${pillar.id}:update,${pillar.id}:delete`,
      });
    }

    if (reqLower.includes('notification') || reqLower.includes('email') || reqLower.includes('alert')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Notification delivery verified`,
        check: 'functionality',
        target: `${pillar.id}:notification_delivery,${pillar.id}:preferences`,
      });
    }

    if (reqLower.includes('search') || reqLower.includes('filter')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Search functionality works`,
        check: 'functionality',
        target: `${pillar.id}:search_query,${pillar.id}:filter_apply`,
      });
    }

    if (reqLower.includes('report') || reqLower.includes('analytic')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Reporting/analytics generates correctly`,
        check: 'functionality',
        target: `${pillar.id}:report_generation,${pillar.id}:data_accuracy`,
      });
    }

    if (reqLower.includes('payment') || reqLower.includes('billing') || reqLower.includes('transaction')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Financial operations are accurate and idempotent`,
        check: 'functionality',
        target: `${pillar.id}:idempotency,${pillar.id}:amount_accuracy`,
      });
    }

    if (reqLower.includes('integration') || reqLower.includes('webhook') || reqLower.includes('API')) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Integration works end-to-end`,
        check: 'integration',
        target: `${pillar.id}:external_api,${pillar.id}:webhook_delivery`,
      });
    }

    // Default integration check if none added
    if (idCounter === 1) {
      criteria.push({
        id: `AC-${pillar.id}-${idCounter++}`,
        description: `${req} - Implementation is complete and functional`,
        check: 'functionality',
        target: `${pillar.id}:feature_complete`,
      });
    }
  }

  // Ensure at least one criterion per pillar
  if (criteria.length === 0) {
    criteria.push({
      id: `AC-${pillar.id}-${idCounter}`,
      description: `${pillar.name} pillar is implemented`,
      check: 'file-exists',
      target: `src/**/${pillar.id}/**/*.ts`,
    });
  }

  return criteria;
}

// ---------------------------------------------------------------------------
// Architecture generator
// ---------------------------------------------------------------------------

function generateArchitecture(industry: Industry): ArchitectureLayer[] {
  const baseArchitecture: ArchitectureLayer[] = [
    { name: 'Presentation Layer', responsibilities: ['UI components', 'Routing', 'State management', 'Responsive design'] },
    { name: 'API Gateway', responsibilities: ['Request routing', 'Authentication', 'Rate limiting', 'API versioning'] },
    { name: 'Business Logic Layer', responsibilities: ['Service orchestration', 'Domain logic', 'State machines', 'Event handling'] },
    { name: 'Data Access Layer', responsibilities: ['Repository pattern', 'Query optimization', 'Connection pooling', 'Transaction management'] },
    { name: 'Infrastructure Layer', responsibilities: ['Database', 'Cache', 'Message queue', 'Object storage'] },
  ];

  if (industry.id === 'fintech' || industry.id === 'marketplace') {
    baseArchitecture.splice(3, 0, { name: 'Financial Core', responsibilities: ['Ledger management', 'Transaction processing', 'Settlement', 'Audit trail'] });
  }

  if (industry.id === 'healthcare') {
    baseArchitecture.splice(3, 0, { name: 'Clinical Layer', responsibilities: ['FHIR compliance', 'Clinical workflows', 'Patient records', 'Consent management'] });
  }

  baseArchitecture.push(
    { name: 'Security Layer', responsibilities: ['Encryption', 'Access control', 'Audit logging', 'Compliance'] },
    { name: 'Observability Layer', responsibilities: ['Metrics', 'Logging', 'Tracing', 'Alerting'] }
  );

  return baseArchitecture;
}

// ---------------------------------------------------------------------------
// Tech stack generator
// ---------------------------------------------------------------------------

function generateTechStack(industry: Industry): TechStackChoice[] {
  const baseStack: TechStackChoice[] = [
    { category: 'Frontend', selection: 'Next.js 14+ with TypeScript', rationale: 'React Server Components for performance, App Router for navigation, TypeScript for type safety' },
    { category: 'Backend', selection: industry.id === 'iot' ? 'Go with Fiber' : industry.id === 'devtools' ? 'Rust with Axum' : 'Node.js with Fastify', rationale: 'High performance, low overhead, excellent ecosystem for the domain' },
    { category: 'Database', selection: 'PostgreSQL 16+', rationale: 'ACID compliance, JSON support, excellent for complex queries, proven at scale' },
    { category: 'Cache', selection: 'Redis 7+', rationale: 'In-memory caching, session storage, pub/sub for real-time features' },
    { category: 'Authentication', selection: 'Auth0 / Clerk / Better Auth', rationale: 'Enterprise-grade auth with SSO, MFA, and compliance features' },
    { category: 'Storage', selection: 'AWS S3 / Cloudflare R2', rationale: 'Scalable object storage with CDN integration and cost efficiency' },
    { category: 'Monitoring', selection: 'Datadog / Grafana + Prometheus', rationale: 'Full observability stack for metrics, logs, and traces' },
  ];

  if (industry.id === 'ai') {
    baseStack.push({ category: 'AI/ML', selection: 'LangChain + OpenAI/Anthropic API', rationale: 'Flexible LLM orchestration with provider abstraction' });
    baseStack.push({ category: 'Vector Store', selection: 'Pinecone / Weaviate', rationale: 'Managed vector database for RAG applications' });
  }

  if (industry.id === 'ecommerce' || industry.id === 'marketplace') {
    baseStack.push({ category: 'Search', selection: 'Algolia / Elasticsearch', rationale: 'Fast, relevant search with faceting and typo tolerance' });
  }

  if (industry.id === 'fintech' || industry.id === 'marketplace') {
    baseStack.push({ category: 'Payments', selection: 'Stripe / Razorpay', rationale: 'Compliant payment processing with global coverage' });
  }

  if (industry.id === 'iot') {
    baseStack.push({ category: 'IoT Platform', selection: 'AWS IoT Core / Eclipse Mosquitto', rationale: 'MQTT broker with device management and rules engine' });
    baseStack.push({ category: 'Time Series DB', selection: 'TimescaleDB / InfluxDB', rationale: 'Optimized for time-series telemetry data' });
  }

  if (industry.id === 'healthcare') {
    baseStack.push({ category: 'FHIR Server', selection: 'HAPI FHIR / Google Cloud Healthcare API', rationale: 'HL7 FHIR-compliant data exchange for healthcare interoperability' });
  }

  if (industry.id === 'social' || industry.id === 'media') {
    baseStack.push({ category: 'Real-time', selection: 'Liveblocks / Pusher / Ably', rationale: 'Managed real-time infrastructure for live updates' });
  }

  return baseStack;
}

// ---------------------------------------------------------------------------
// Industry detection
// ---------------------------------------------------------------------------

export function detectIndustry(prompt: string): Industry {
  const promptLower = prompt.toLowerCase();
  let bestMatch: { industry: Industry; score: number } | null = null;

  for (const industry of INDUSTRIES) {
    let score = 0;
    for (const keyword of industry.keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // Multi-word matches score higher
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { industry, score };
    }
  }

  return bestMatch?.industry || {
    id: 'generic',
    name: 'Generic Application',
    keywords: [],
    marketLeaders: ['Industry leaders not specified'],
    complianceRequirements: ['GDPR', 'Local regulations'],
    techStack: ['React', 'Node.js', 'PostgreSQL'],
  };
}

// ---------------------------------------------------------------------------
// Competitor research
// ---------------------------------------------------------------------------

export function researchCompetitors(industry: Industry): Competitor[] {
  const templates = competitorsForIndustry(industry);
  return templates.map(t => ({
    name: t.name,
    url: t.url,
    features: t.features,
    strengths: t.strengths,
    weaknesses: t.weaknesses,
  }));
}

// ---------------------------------------------------------------------------
// Pillar generation
// ---------------------------------------------------------------------------

export function generatePillars(industry: Industry): Pillar[] {
  const templates = pillarsForIndustry(industry);
  return templates.map((template, index) => ({
    id: `P${String(index + 1).padStart(2, '0')}`,
    name: template.name,
    description: template.description,
    requirements: template.requirements.map((desc, reqIndex) => ({
      id: `${template.name.toUpperCase().replace(/\s+/g, '_')}_REQ_${String(reqIndex + 1).padStart(2, '0')}`,
      description: desc,
    })),
    agent: template.agent,
    dependencies: template.dependencies.map(dep => {
      const depIndex = templates.findIndex(t => t.name === dep);
      return depIndex >= 0 ? `P${String(depIndex + 1).padStart(2, '0')}` : '';
    }).filter(Boolean),
  }));
}

// ---------------------------------------------------------------------------
// Acceptance criteria generation
// ---------------------------------------------------------------------------

export function generateAcceptanceCriteria(pillar: Pillar): Criterion[] {
  return generateCriteria(pillar);
}

// ---------------------------------------------------------------------------
// Main expansion function
// ---------------------------------------------------------------------------

export async function expand(prompt: string): Promise<ExpandedProject> {
  const industry = detectIndustry(prompt);
  const pillars = generatePillars(industry);
  const competitors = researchCompetitors(industry);
  const acceptanceCriteria: Criterion[] = [];
  const architecture = generateArchitecture(industry);
  const techStack = generateTechStack(industry);

  for (const pillar of pillars) {
    acceptanceCriteria.push(...generateAcceptanceCriteria(pillar));
  }

  return {
    id: generateProjectId(prompt),
    prompt,
    industry,
    pillars,
    competitors,
    acceptanceCriteria,
    architecture,
    techStack,
  };
}

// ---------------------------------------------------------------------------
// Utility: generate a deterministic project ID
// ---------------------------------------------------------------------------

function generateProjectId(prompt: string): string {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(w => w.length >= 3)
    .slice(0, 5);

  const slug = words.join('-');
  const timestamp = Date.now().toString(36).toUpperCase();
  return `PROJ-${slug}-${timestamp}`;
}

// ---------------------------------------------------------------------------
// File persistence
// ---------------------------------------------------------------------------

const EXPANSION_DIR = path.join(process.cwd(), 'expansions');

export function saveExpansion(project: ExpandedProject): string {
  if (!fs.existsSync(EXPANSION_DIR)) {
    fs.mkdirSync(EXPANSION_DIR, { recursive: true });
  }

  const filePath = path.join(EXPANSION_DIR, `${project.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
  return filePath;
}

export function loadExpansion(projectId: string): ExpandedProject | null {
  const filePath = path.join(EXPANSION_DIR, `${projectId}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as ExpandedProject;
}

export function listExpansions(): string[] {
  if (!fs.existsSync(EXPANSION_DIR)) {
    return [];
  }
  return fs.readdirSync(EXPANSION_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}
