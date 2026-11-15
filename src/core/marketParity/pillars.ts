/**
 * AETHER Market-Parity Engine — 19 Universal Production Engineering Pillars
 *
 * Every industry specification is mapped against all 19 pillars.
 * No feature can be missed — if Amazon has it, AETHER generates it.
 */

import type { PillarRequirement } from './types';

export const PILLARS: PillarRequirement[] = [
  {
    pillarId: 1,
    pillarName: 'Real Customer Authentication & Identity',
    features: [
      'FIDO2/WebAuthn passkey registration and assertion (navigator.credentials.create/get)',
      'OAuth 2.0/OIDC federation with PKCE (Google, Apple, GitHub, Microsoft, SAML 2.0)',
      'Email & phone OTP verification (HMAC-SHA256 hashed, 5-min TTL, 3-attempt limit)',
      'Adaptive MFA: TOTP authenticator, SMS/Voice fallback, risk-triggered step-up auth',
      'Dual-token rotation: short-lived RS256 JWT access tokens + opaque refresh tokens',
      'Refresh token family & reuse detection — token replay invalidates entire family',
      'Active device & session management portal (User-Agent parsing, GeoIP, revoke controls)',
      'Anonymous-to-authenticated cart deep-merge on sign-in',
      'Multi-address book with geospatial pinning (lat/lng for hyperlocal routing)',
      'GDPR/DPDP/CCPA data export & soft-delete account deactivation with 14-day grace',
    ],
    implementation: `
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    email_verified_at TIMESTAMPTZ,
    phone_e164 VARCHAR(20) UNIQUE,
    phone_verified_at TIMESTAMPTZ,
    password_hash TEXT,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret_encrypted BYTEA,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED','DELETED')),
    risk_score SMALLINT NOT NULL DEFAULT 0,
    preferred_locale VARCHAR(10) NOT NULL DEFAULT 'en-US',
    preferred_currency CHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE user_passkeys (
    credential_id BYTEA PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    public_key_cose BYTEA NOT NULL,
    sign_count BIGINT NOT NULL DEFAULT 0,
    aaguid UUID,
    transports TEXT[],
    device_name VARCHAR(120),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_family_id UUID NOT NULL,
    refresh_token_hash CHAR(64) NOT NULL UNIQUE,
    ip_address INET NOT NULL,
    user_agent TEXT NOT NULL,
    geo_country CHAR(2),
    geo_city VARCHAR(100),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(80),
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country CHAR(2) NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 2,
    pillarName: 'RBAC & Multi-Portal Authorization',
    features: [
      'Hierarchical RBAC/ABAC permission matrix (domain:resource:action:scope grammar)',
      'Multi-portal topology: Super-Admin, Merchant/Vendor, Operations/KDS, Support',
      'Maker-checker (four-eyes) approval workflows for high-risk mutations',
      'Break-glass audited impersonation with time-boxed 15-min sessions',
      'Resource-action-scope permission enforcement at API middleware and DB RLS layer',
      'Staff invitation & role assignment with email verification',
      'Vendor/merchant onboarding with document verification and payout setup',
      'Audit trail for all permission changes and role escalations',
    ],
    implementation: `
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    parent_role_id UUID REFERENCES roles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, slug)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    domain VARCHAR(64) NOT NULL,
    resource VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    scope VARCHAR(255) NOT NULL DEFAULT 'own',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, slug)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id, tenant_id)
);

CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    action_type VARCHAR(120) NOT NULL,
    entity_id UUID NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    approver_id UUID REFERENCES users(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED')),
    request_data JSONB NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    ticket_ref_id VARCHAR(64),
    is_read_only BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 3,
    pillarName: 'Integer-Cent Monetary & Tax Computation',
    features: [
      'All monetary values stored as BIGINT integer cents with ISO 4217 currency code',
      'Zero-decimal (JPY/KRW) and three-decimal (BHD/KWD) currency awareness',
      'Largest-remainder penny allocation — sum of line discounts equals exact cart discount',
      'Jurisdiction-aware tax engine (GST/VAT/Nexus with CGST+SGST/IGST split)',
      'Tax-inclusive vs tax-exclusive checkout calculation',
      'HSN/SAC product tax codes and B2B GSTIN input tax credit validation',
      'US destination-based state/county/city/special-district tax rates',
      'EU VAT MOSS/OSS reverse-charge B2B validation (VIES)',
      'Payment intent state machine (REQUIRES_PAYMENT_METHOD → CAPTURED → REFUNDED/DISPUTED)',
      'Double-entry immutable financial ledger (SUM(debits) = SUM(credits))',
      'Sub-cent micro-unit accounting (nano_dollars per 1M tokens for AI platforms)',
    ],
    implementation: `
CREATE TABLE currencies (
    code CHAR(3) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    symbol VARCHAR(10),
    exponent SMALLINT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    jurisdiction_type VARCHAR(32) NOT NULL
        CHECK (jurisdiction_type IN ('COUNTRY','STATE','COUNTY','CITY','SPECIAL','POSTAL')),
    jurisdiction_code VARCHAR(64) NOT NULL,
    tax_code VARCHAR(64) NOT NULL,
    rate_bps INTEGER NOT NULL CHECK (rate_bps BETWEEN 0 AND 10000),
    is_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, jurisdiction_code, tax_code, effective_from)
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    transaction_group_id UUID NOT NULL,
    entry_type VARCHAR(16) NOT NULL CHECK (entry_type IN ('DEBIT','CREDIT')),
    account_code VARCHAR(32) NOT NULL,
    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    reference_type VARCHAR(64),
    reference_id UUID,
    description TEXT,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    gateway VARCHAR(32) NOT NULL,
    gateway_intent_id VARCHAR(255),
    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'REQUIRES_PAYMENT_METHOD'
        CHECK (status IN ('REQUIRES_PAYMENT_METHOD','REQUIRES_CONFIRMATION',
                          'REQUIRES_ACTION','AUTHORIZED','CAPTURED',
                          'PARTIALLY_REFUNDED','REFUNDED','DISPUTED','CANCELED')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 4,
    pillarName: 'Product Catalog & Variant Management',
    features: [
      'Hierarchical category DAG with closure-table and poly-hierarchy support',
      'Product variants with dynamic attribute matrices (size, color, roast, grind)',
      'Real-time price/stock/URL state updates on variant selection without page reload',
      'Brand management, attribute schemas per category, SEO-canonical breadcrumbs',
      'Bulk CSV/XLSX import/export for merchants',
      'Product media gallery with progressive images, BlurHash/LQIP placeholders',
      'Product status workflow (DRAFT → ACTIVE → ARCHIVED)',
      'Subscription-eligible product flags and discount basis points',
      'Compare drawer (up to 4 items) with differential attribute highlighting',
      'Provenance storytelling (origin maps, sustainability timelines, spec sheets)',
    ],
    implementation: `
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    parent_id UUID REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    attribute_schema JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, slug)
);

CREATE TABLE category_closure (
    ancestor_id UUID NOT NULL REFERENCES categories(id),
    descendant_id UUID NOT NULL REFERENCES categories(id),
    depth INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ancestor_id, descendant_id)
);

CREATE TABLE catalog_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    slug VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    storytelling_markdown TEXT,
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_name VARCHAR(200),
    tax_code VARCHAR(64) NOT NULL,
    return_policy_id UUID,
    attributes_schema JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED')),
    avg_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, slug)
);

CREATE TABLE catalog_skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
    sku_code VARCHAR(120) NOT NULL,
    upc_ean VARCHAR(32),
    variant_options JSONB NOT NULL DEFAULT '{}',
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    list_price_cents BIGINT NOT NULL CHECK (list_price_cents >= 0),
    sale_price_cents BIGINT NOT NULL CHECK (sale_price_cents >= 0 AND sale_price_cents <= list_price_cents),
    cost_price_cents BIGINT NOT NULL CHECK (cost_price_cents >= 0),
    weight_grams INTEGER NOT NULL DEFAULT 0,
    dimensions_mm JSONB,
    is_subscription_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_discount_bps INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (tenant_id, sku_code)
);

CREATE TABLE product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
    sku_id UUID REFERENCES catalog_skus(id) ON DELETE CASCADE,
    media_type VARCHAR(16) NOT NULL
        CHECK (media_type IN ('IMAGE','VIDEO','360','MODEL_3D','DOCUMENT')),
    url TEXT NOT NULL,
    blurhash VARCHAR(64),
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 5,
    pillarName: 'Advanced Search, Filter & Discovery',
    features: [
      'Typo-tolerant hybrid search: BM25 + Levenshtein + prefix autocomplete + synonym rings',
      'Dense vector semantic embeddings (pgvector HNSW) for natural language queries',
      'Faceted filtering: disjunctive within-facet (OR), conjunctive across-facet (AND)',
      'URL-synchronized filter state with live document counts per facet option',
      'Real-time search suggestions / autocomplete dropdown',
      'Saved searches with price-drop & back-in-stock alerts',
      'Recently viewed products and browse-history personalization',
      'Trending, featured, and curated discovery carousels',
      'SEO-optimized search result pages with canonical URLs and structured data',
    ],
    implementation: `
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    query_text VARCHAR(500) NOT NULL,
    result_count INTEGER NOT NULL DEFAULT 0,
    clicked_sku_ids UUID[] DEFAULT '{}',
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(128),
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    name VARCHAR(120),
    query_text VARCHAR(500) NOT NULL,
    filters JSONB DEFAULT '{}',
    alert_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    last_alerted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_embeddings (
    sku_id UUID PRIMARY KEY REFERENCES catalog_skus(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    embedding vector(1536),
    search_text TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_embeddings_vector
    ON product_embeddings USING hnsw (embedding vector_cosine_ops);
`,
  },
  {
    pillarId: 6,
    pillarName: 'Cart, Wishlist & Saved Items',
    features: [
      'Guest cart with localStorage persistence tied to session fingerprint',
      'Authenticated cart merge on sign-in (deep-merge without overwriting saved items)',
      'Real-time cart price recalculation on variant/promo changes',
      'Cart price-change diff banners ("decreased from $X to $Y")',
      'Persistent "Save for Later" list preserving variant choices',
      'Multi-list wishlists (private/shared-link/public) with collaborator edit permissions',
      'Gift registries with purchased vs desired quantity tracking',
      'Group order / shared cart with labeled items and host lock-and-pay',
      'Move-to-wishlist and move-to-cart without losing variant selections',
      'Cart abandonment recovery with email/SMS push notifications',
    ],
    implementation: `
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(128),
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    subtotal_cents BIGINT NOT NULL DEFAULT 0,
    discount_total_cents BIGINT NOT NULL DEFAULT 0,
    shipping_total_cents BIGINT NOT NULL DEFAULT 0,
    tax_total_cents BIGINT NOT NULL DEFAULT 0,
    grand_total_cents BIGINT NOT NULL DEFAULT 0,
    promo_code VARCHAR(64),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES catalog_skus(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    selected_modifiers JSONB DEFAULT '{}',
    unit_price_cents BIGINT NOT NULL,
    line_total_cents BIGINT NOT NULL,
    is_saved_for_later BOOLEAN NOT NULL DEFAULT FALSE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, sku_id, selected_modifiers)
);

CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    visibility VARCHAR(16) NOT NULL DEFAULT 'PRIVATE'
        CHECK (visibility IN ('PRIVATE','SHARED_LINK','PUBLIC')),
    share_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES catalog_skus(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (wishlist_id, sku_id)
);
`,
  },
  {
    pillarId: 7,
    pillarName: 'Promotions, Loyalty & Retention',
    features: [
      'Combinatorial coupon engine: percentage, fixed, BOGO, tiered volume, free-shipping threshold',
      'Stacking & priority precedence matrix (exclusivity groups, application order)',
      'Promo code generation with usage limits, date windows, and segment targeting',
      'Points-and-tiers loyalty ledger with pending-to-active vesting tied to return window',
      'Rolling tier qualification (365-day spend/transaction thresholds)',
      'Double-sided referral links with anti-self-referral fraud checks',
      'Peer-to-peer gift card / gift-a-drink workflows',
      'Promotional campaign builder with A/B testing support',
      'Win-back and re-engagement triggered campaigns',
      'Loyalty point reversal on returns and cancellations',
    ],
    implementation: `
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(64) UNIQUE,
    type VARCHAR(32) NOT NULL CHECK (type IN ('PERCENTAGE','FIXED_CART','FIXED_SKU','BOGO','FREE_SHIPPING','TIERED')),
    value_cents BIGINT,
    value_bps INTEGER,
    max_discount_cents BIGINT,
    min_cart_cents BIGINT DEFAULT 0,
    free_shipping_threshold_cents BIGINT,
    exclusivity_group VARCHAR(64),
    application_order INTEGER NOT NULL DEFAULT 0,
    usage_limit_total INTEGER,
    usage_limit_per_user INTEGER DEFAULT 1,
    used_count INTEGER NOT NULL DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,
    segment_rules JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE promotion_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    min_qty INTEGER NOT NULL,
    discount_bps INTEGER NOT NULL,
    PRIMARY KEY (promotion_id, min_qty)
);

CREATE TABLE loyalty_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    current_tier VARCHAR(32) NOT NULL DEFAULT 'MEMBER',
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    pending_points INTEGER NOT NULL DEFAULT 0,
    available_points INTEGER NOT NULL DEFAULT 0,
    tier_progress NUMERIC(5,2) NOT NULL DEFAULT 0,
    current_period_spend_cents BIGINT NOT NULL DEFAULT 0,
    current_period_transactions INTEGER NOT NULL DEFAULT 0,
    tier_qualified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, tenant_id)
);

CREATE TABLE loyalty_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(64) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    min_spend_cents BIGINT NOT NULL DEFAULT 0,
    min_transactions INTEGER NOT NULL DEFAULT 0,
    points_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    benefits JSONB DEFAULT '{}',
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, slug)
);

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loyalty_account_id UUID NOT NULL REFERENCES loyalty_accounts(id),
    type VARCHAR(32) NOT NULL CHECK (type IN ('EARN','BURN','BONUS','REVERSAL','EXPIRY')),
    points INTEGER NOT NULL,
    order_id UUID,
    description VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    referrer_id UUID NOT NULL REFERENCES users(id),
    code VARCHAR(32) NOT NULL UNIQUE,
    reward_type VARCHAR(32) NOT NULL,
    reward_value_cents BIGINT NOT NULL,
    max_uses INTEGER NOT NULL DEFAULT 10,
    used_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 8,
    pillarName: 'Reviews, Ratings & User Feedback',
    features: [
      'Cryptographically verified purchase badge (order ledger check before allowing review)',
      'Multi-dimensional sub-ratings (fit, durability, flavor profile, etc.)',
      'Customer photo/video UGC uploads with automated moderation pipeline',
      'Helpfulness voting (upvotes/downvotes) with Wilson-score confidence sorting',
      'Merchant official responses to reviews',
      'Review edit/delete window with version history',
      'Q&A community section with best-answer pinning',
      'Review flagging and admin moderation queue',
      'Aggated rating badges displayed on catalog cards and search results',
    ],
    implementation: `
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
    sku_id UUID REFERENCES catalog_skus(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    body TEXT,
    sub_ratings JSONB DEFAULT '{}',
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_upvotes INTEGER NOT NULL DEFAULT 0,
    helpful_downvotes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','APPROVED','REJECTED','FLAGGED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id, order_id, sku_id)
);

CREATE TABLE review_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    media_type VARCHAR(16) NOT NULL CHECK (media_type IN ('IMAGE','VIDEO')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    moderation_status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_votes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    vote_type VARCHAR(8) NOT NULL CHECK (vote_type IN ('UP','DOWN')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, review_id)
);

CREATE TABLE qa_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES catalog_products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    question TEXT NOT NULL,
    answer TEXT,
    answered_by UUID REFERENCES users(id),
    is_best_answer BOOLEAN NOT NULL DEFAULT FALSE,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);
`,
  },
  {
    pillarId: 9,
    pillarName: 'Order FSM, Idempotency & Transaction-Safe Checkout',
    features: [
      'Canonical order FSM: DRAFT → PENDING_PAYMENT → PAYMENT_AUTHORIZED → CONFIRMED → ALLOCATED → PICKING → PACKED → SHIPPED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED → COMPLETED',
      'Exception branches: EXPIRED, PAYMENT_FAILED, CANCELLED_BY_CUSTOMER/MERCHANT, DELIVERY_EXCEPTION, RTO_INITIATED, RETURN_REQUESTED → RETURN_APPROVED → RETURN_RECEIVED → REFUNDED',
      'Mandatory Idempotency-Key protocol on all order creation endpoints',
      '100% server-side price & promo recomputation (never trust client-submitted prices)',
      'SERIALIZABLE transaction with deterministic lock ordering for inventory',
      'Order immutable snapshots (prices, addresses, tax breakdown at time of order)',
      'Order number generation with tenant-prefixed unique sequence',
      'Split-shipment fulfillment (single order across multiple warehouses)',
      'BOM/recipe depletion for bundles and kits',
      'Order status transition audit logging with actor and reason code',
    ],
    implementation: `
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_number VARCHAR(40) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id),
    currency CHAR(3) NOT NULL,
    subtotal_cents BIGINT NOT NULL CHECK (subtotal_cents >= 0),
    discount_total_cents BIGINT NOT NULL DEFAULT 0 CHECK (discount_total_cents >= 0),
    shipping_total_cents BIGINT NOT NULL DEFAULT 0 CHECK (shipping_total_cents >= 0),
    tax_total_cents BIGINT NOT NULL DEFAULT 0 CHECK (tax_total_cents >= 0),
    tip_cents BIGINT NOT NULL DEFAULT 0 CHECK (tip_cents >= 0),
    grand_total_cents BIGINT NOT NULL CHECK (grand_total_cents >= 0),
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_intent_id UUID REFERENCES payment_intents(id),
    shipping_address_snapshot JSONB NOT NULL,
    billing_address_snapshot JSONB NOT NULL,
    tax_breakdown_snapshot JSONB NOT NULL DEFAULT '[]',
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT order_total_integrity CHECK (
        grand_total_cents = subtotal_cents - discount_total_cents
            + shipping_total_cents + tax_total_cents + tip_cents
    )
);

CREATE TABLE order_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES catalog_skus(id),
    sku_snapshot JSONB NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    selected_modifiers JSONB DEFAULT '{}',
    unit_price_cents BIGINT NOT NULL,
    discount_cents BIGINT NOT NULL DEFAULT 0,
    tax_cents BIGINT NOT NULL DEFAULT 0,
    line_total_cents BIGINT NOT NULL,
    allocated_warehouse_id UUID,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(40),
    to_status VARCHAR(40) NOT NULL,
    actor_type VARCHAR(16) NOT NULL CHECK (actor_type IN ('SYSTEM','USER','ADMIN','WEBHOOK','COURIER'),
    actor_id UUID,
    reason_code VARCHAR(64),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE idempotency_keys (
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL,
    request_method VARCHAR(16) NOT NULL,
    request_path VARCHAR(255) NOT NULL,
    request_hash CHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS'
        CHECK (status IN ('IN_PROGRESS','COMPLETED','FAILED')),
    http_status_code SMALLINT,
    response_body JSONB,
    locked_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, user_id, idempotency_key)
);
`,
  },
  {
    pillarId: 10,
    pillarName: 'Real-Time Tracking, Reorder & Booking Engine',
    features: [
      'One-click reorder with deterministic SKU resolution and price-change badges',
      'Real-time geospatial courier tracking via WebSocket/SSE telemetry',
      'Authenticated and guest order status lookup (order number + email/phone + postal)',
      'Split-shipment tracking with carrier link generation',
      'Time-slot capacity reservation with PostgreSQL TSTZRANGE exclusion constraints',
      'Conflict-free double-booking prevention at database level',
      'Configurable prep/turnaround buffers between appointments',
      'Timezone-normalized IANA display for all booking times',
      'Automated waitlist promotion when slots open',
      'Credit card hold/deposit capture for no-show protection',
    ],
    implementation: `
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    booking_window TSTZRANGE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'HOLD'
        CHECK (status IN ('HOLD','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW')),
    party_size INTEGER,
    deposit_cents BIGINT NOT NULL DEFAULT 0,
    deposit_payment_intent_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    EXCLUDE USING gist (resource_id WITH =, booking_window WITH &&)
        WHERE (status IN ('HOLD','CONFIRMED','CHECKED_IN'))
);

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(64) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    buffer_minutes INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_tracking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(64) NOT NULL,
    carrier VARCHAR(64),
    tracking_number VARCHAR(128),
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE courier_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID,
    courier_name VARCHAR(120),
    courier_phone VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'ASSIGNED',
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);
`,
  },
  {
    pillarId: 11,
    pillarName: 'Multi-Warehouse Inventory ATP & Reservation',
    features: [
      'Variant-level 4-bucket ATP ledger: on_hand, reserved, committed, damaged_quarantined',
      'Inventory reservation with strict TTL expiry (auto-release sweeper every 15s)',
      'ATP = OnHand - (Reserved + Committed + SafetyStock) + IncomingAllocated',
      'BOM/recipe depletion for bundles, kits, and food/beverage items',
      'Supplier master with MOQ, lead-time, wholesale cost tiers, payment terms',
      'Reorder point automation with auto-drafted Purchase Orders',
      '3-way matching: PO vs Goods Receipt Note vs Supplier Invoice',
      'Lot/batch number tracking and FEFO (First Expired, First Out)',
      'Multi-warehouse order routing (Haversine distance, stock completeness, SLA)',
      'Inventory adjustments with audit trail and reason codes',
    ],
    implementation: `
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(32) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'PHYSICAL'
        CHECK (type IN ('PHYSICAL','VIRTUAL','DARK_STORE','KITCHEN','STORE')),
    address JSONB NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    contact_phone VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, code)
);

CREATE TABLE warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    sku_id UUID NOT NULL REFERENCES catalog_skus(id) ON DELETE RESTRICT,
    on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    committed INTEGER NOT NULL DEFAULT 0 CHECK (committed >= 0),
    safety_stock INTEGER NOT NULL DEFAULT 0 CHECK (safety_stock >= 0),
    damaged_quarantined INTEGER NOT NULL DEFAULT 0 CHECK (damaged_quarantined >= 0),
    incoming_allocated INTEGER NOT NULL DEFAULT 0 CHECK (incoming_allocated >= 0),
    reorder_point INTEGER NOT NULL DEFAULT 10,
    reorder_quantity INTEGER NOT NULL DEFAULT 50,
    bin_location VARCHAR(64),
    lot_number VARCHAR(64),
    expiry_date DATE,
    version BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_stock_allocation CHECK (on_hand >= reserved + committed),
    UNIQUE (warehouse_id, sku_id)
);

CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    sku_id UUID NOT NULL REFERENCES catalog_skus(id),
    checkout_session_id UUID NOT NULL,
    order_id UUID REFERENCES orders(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'RESERVED'
        CHECK (status IN ('RESERVED','COMMITTED','RELEASED','EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(32),
    payment_terms VARCHAR(32) DEFAULT 'NET_30',
    currency CHAR(3) NOT NULL DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    po_number VARCHAR(40) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT','ISSUED','PARTIALLY_RECEIVED','RECEIVED','CLOSED','CANCELLED')),
    total_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    expected_delivery DATE,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    sku_id UUID NOT NULL REFERENCES catalog_skus(id),
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    unit_cost_cents BIGINT NOT NULL,
    lot_number VARCHAR(64),
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 12,
    pillarName: 'Shipping, Fulfillment & Last-Mile Logistics',
    features: [
      'Multi-node order routing (proximity, stock completeness, SLA optimization)',
      'Dimensional weight & live carrier rate shopping (FedEx, UPS, DHL, USPS, Delhivery, BlueDart)',
      'Serviceability matrix (pincode, Hazmat, Cold-Chain, Cash-on-Delivery eligibility)',
      'Pick-pack-ship wave lists sorted by warehouse aisle/bin coordinates',
      'Barcode scan verification (UPC/EAN/GS1-128)',
      'Shipping label generation (ZPL/PDF thermal printing)',
      'Carrier webhook ingestion (IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, NDR_EXCEPTION)',
      'Split-shipment tracking with individual carrier links per package',
      'Return-to-origin (RTO) tracking and reconciliation',
      'Commercial invoice and HSN customs declaration generation',
    ],
    implementation: `
CREATE TABLE shipping_carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(32) NOT NULL UNIQUE,
    api_endpoint TEXT,
    api_key_encrypted BYTEA,
    supports_cod BOOLEAN NOT NULL DEFAULT FALSE,
    supports_tracking BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    carrier_id UUID NOT NULL REFERENCES shipping_carriers(id),
    service_level VARCHAR(64) NOT NULL,
    weight_grams_min INTEGER NOT NULL,
    weight_grams_max INTEGER NOT NULL,
    distance_zone VARCHAR(32) NOT NULL,
    rate_cents BIGINT NOT NULL,
    estimated_days_min INTEGER NOT NULL,
    estimated_days_max INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fulfillment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','ALLOCATED','PICKING','PACKED','SHIPPED','DELIVERED','CANCELLED')),
    carrier_id UUID REFERENCES shipping_carriers(id),
    tracking_number VARCHAR(128),
    shipping_label_url TEXT,
    weight_grams INTEGER,
    dimensional_weight_grams INTEGER,
    shipping_cents BIGINT NOT NULL DEFAULT 0,
    picked_by UUID REFERENCES users(id),
    packed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    shipped_at TIMESTAMPTZ
);

CREATE TABLE shipment_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fulfillment_order_id UUID NOT NULL REFERENCES fulfillment_orders(id) ON DELETE CASCADE,
    carrier_code VARCHAR(32) NOT NULL,
    tracking_number VARCHAR(128) NOT NULL,
    current_status VARCHAR(64) NOT NULL,
    current_location JSONB,
    raw_payload JSONB,
    last_webhook_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 13,
    pillarName: 'Returns, Refunds & RMA',
    features: [
      'Programmable policy rule engine per product category (return_window_days, condition requirements)',
      'Time-decay cancellation fee schedules (Airbnb-style Flexible/Moderate/Limited/Firm/Strict)',
      'Self-service RMA portal with structured reason codes and photo evidence upload',
      'Instant size/variant exchange (zero-dollar replacement on carrier drop-off scan)',
      'Instant store credit / wallet refund on approval',
      'Original payment method refund with idempotent gateway calls',
      'Automatic accounting credit note generation',
      'Proportional tax and loyalty points reversal on refunds',
      'Partial return support with prorated line-item calculation',
      'QC inspection workflow (RETURN_RECEIVED → QC_PASSED → REFUND_PROCESSED)',
    ],
    implementation: `
CREATE TABLE return_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    applies_to VARCHAR(32) NOT NULL DEFAULT 'ALL_PRODUCTS'
        CHECK (applies_to IN ('ALL_PRODUCTS','CATEGORY','PRODUCT','SKU')),
    category_id UUID,
    product_id UUID,
    sku_id UUID,
    return_window_days INTEGER NOT NULL DEFAULT 30,
    replacement_only BOOLEAN NOT NULL DEFAULT FALSE,
    restocking_fee_bps INTEGER NOT NULL DEFAULT 0 CHECK (restocking_fee_bps BETWEEN 0 AND 10000),
    condition_requirements TEXT[] DEFAULT '{}',
    refund_method VARCHAR(32) NOT NULL DEFAULT 'ORIGINAL_PAYMENT'
        CHECK (refund_method IN ('ORIGINAL_PAYMENT','STORE_CREDIT','EXCHANGE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, applies_to, category_id, product_id, sku_id)
);

CREATE TABLE rma_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id UUID NOT NULL REFERENCES users(id),
    reason_code VARCHAR(64) NOT NULL,
    description TEXT,
    evidence_media_urls TEXT[] DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED'
        CHECK (status IN ('REQUESTED','APPROVED','REJECTED','RETURN_RECEIVED','QC_PASSED','QC_FAILED','REFUNDED','EXCHANGED')),
    resolution_type VARCHAR(32) NOT NULL DEFAULT 'REFUND'
        CHECK (resolution_type IN ('REFUND','STORE_CREDIT','EXCHANGE')),
    refund_amount_cents BIGINT,
    restocking_fee_cents BIGINT NOT NULL DEFAULT 0,
    return_label_url TEXT,
    return_carrier VARCHAR(64),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE rma_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_request_id UUID NOT NULL REFERENCES rma_requests(id) ON DELETE CASCADE,
    order_line_item_id UUID NOT NULL REFERENCES order_line_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_refund_cents BIGINT NOT NULL,
    tax_refund_cents BIGINT NOT NULL,
    total_refund_cents BIGINT NOT NULL,
    exchange_sku_id UUID REFERENCES catalog_skus(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    rma_request_id UUID REFERENCES rma_requests(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    amount_cents BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('REFUND','STORE_CREDIT','EXCHANGE')),
    status VARCHAR(32) NOT NULL DEFAULT 'ISSUED'
        CHECK (status IN ('ISSUED','PROCESSING','COMPLETED','FAILED')),
    gateway_refund_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
`,
  },
  {
    pillarId: 14,
    pillarName: 'Analytics, Observability & Audit Logs',
    features: [
      'Executive BI dashboards: GMV, Net Revenue, AOV, CAC/LTV, Cohort Retention heatmaps',
      'Pre-aggregated OLAP materialized views for sub-second query performance',
      'Cart conversion funnel with drop-off stage analytics',
      'SKU-level sell-through velocity and inventory aging reports',
      'Real-time anomaly alerting (spike detection, fraud flags)',
      'Immutable hash-chained append-only audit logs with SHA-256 prev_hash linkage',
      'Database-level immutability trigger (BEFORE UPDATE/DELETE raises exception)',
      'OpenTelemetry distributed trace integration',
      'W3C Trace Context request_id propagation across all services',
      'Compliance export: SOC 2, ISO 27001, HIPAA audit-ready log extraction',
    ],
    implementation: `
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    event_name VARCHAR(120) NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(128),
    properties JSONB DEFAULT '{}',
    revenue_cents BIGINT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE MATERIALIZED VIEW mv_daily_gmv AS
SELECT
    tenant_id,
    DATE(occurred_at) as day,
    COUNT(DISTINCT user_id) as unique_customers,
    COUNT(*) as total_orders,
    SUM(revenue_cents) as gross_revenue_cents,
    AVG(revenue_cents) as avg_order_value_cents,
    COUNT(DISTINCT session_id) as unique_sessions
FROM analytics_events
WHERE event_type = 'order_completed'
GROUP BY tenant_id, DATE(occurred_at);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_type VARCHAR(32) NOT NULL,
    actor_id UUID,
    impersonator_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(128) NOT NULL,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    prev_hash CHAR(64) NOT NULL,
    record_hash CHAR(64) NOT NULL,
    reason_code VARCHAR(64)
);

CREATE INDEX idx_audit_logs_tenant_occurred ON audit_logs(tenant_id, occurred_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(tenant_id, entity_type, entity_id);
`,
  },
  {
    pillarId: 15,
    pillarName: 'Notification Infrastructure',
    features: [
      'Omnichannel notification engine: Email, SMS, WhatsApp, Web Push, Mobile Push (APNs/FCM)',
      'Event-driven triggers from transactional outbox (OrderCreated, PaymentCaptured, etc.)',
      'Locale-aware Handlebars/MDX email templates with AMP support',
      'User-level channel preference toggles with mandatory override for security alerts',
      'Quiet-hours scheduling and timezone-aware delivery windows',
      'Bounce/complaint suppression lists and delivery receipt tracking',
      'In-app notification center with read/unread state and grouping',
      'Transactional receipt emails with branded HTML and plain-text fallback',
      'Webhook notifications for order status changes, inventory alerts, and payout events',
      'Notification preference center per channel per notification type',
    ],
    implementation: `
CREATE TABLE notification_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_type VARCHAR(16) NOT NULL
        CHECK (channel_type IN ('EMAIL','SMS','WHATSAPP','WEB_PUSH','IN_APP','MOBILE_PUSH')),
    address VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id, channel_type, address)
);

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(120) NOT NULL,
    channel_type VARCHAR(16) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    subject_template TEXT,
    body_template TEXT NOT NULL,
    locale VARCHAR(10) NOT NULL DEFAULT 'en-US',
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, event_type, channel_type, locale)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_type VARCHAR(16) NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status VARCHAR(16) NOT NULL DEFAULT 'QUEUED'
        CHECK (status IN ('QUEUED','SENDING','SENT','DELIVERED','FAILED','BOUNCED','SUPPRESSED')),
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    event_type VARCHAR(120) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, tenant_id, event_type)
);
`,
  },
  {
    pillarId: 16,
    pillarName: 'AI Features & Personalization',
    features: [
      'Domain-grounded RAG copilot with inline citations and RBAC metadata pre-filtering',
      'Tool-calling action agents with human-in-the-loop confirmation for mutating operations',
      'Prompt-injection classification and PII redaction before external model calls',
      'Structured JSON Schema output enforcement for deterministic AI responses',
      'Semantic response caching to reduce token costs and latency',
      'Multi-provider model failover routing (OpenAI, Anthropic, open-weights)',
      'Per-tenant token budget metering and spend caps',
      'AI-powered product recommendations (collaborative filtering + content-based)',
      'Automated review sentiment analysis and summary generation',
      'Generative product description and marketing copy with brand voice profiles',
      'AI chatbot for customer support with order/return context awareness',
      'Embeddings store (pgvector) for semantic search and RAG retrieval',
    ],
    implementation: `
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(128) NOT NULL,
    agent_type VARCHAR(64) NOT NULL,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('USER','ASSISTANT','SYSTEM','TOOL')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    tool_calls JSONB DEFAULT '[]',
    tool_results JSONB DEFAULT '[]',
    tokens_input INTEGER,
    tokens_output INTEGER,
    model VARCHAR(64),
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id UUID NOT NULL,
    embedding vector(1536),
    content_hash CHAR(64) NOT NULL,
    model VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, entity_type, entity_id, model)
);

CREATE TABLE ai_token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    conversation_id UUID REFERENCES ai_conversations(id),
    model VARCHAR(64) NOT NULL,
    tokens_prompt INTEGER NOT NULL,
    tokens_completion INTEGER NOT NULL,
    tokens_cached INTEGER NOT NULL DEFAULT 0,
    cost_nano_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recommendation_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    context_type VARCHAR(64) NOT NULL,
    context_id UUID NOT NULL,
    recommended_sku_ids UUID[] NOT NULL,
    algorithm VARCHAR(64) NOT NULL,
    scores JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`,
  },
  {
    pillarId: 17,
    pillarName: 'Frontend UX & Design System',
    features: [
      'Semantic design tokens (primitive → semantic → component, 3-tier hierarchy)',
      'Dark mode and high-contrast daylight mode with WCAG 2.2 AA/AAA compliance',
      'Spring-physics micro-interactions (stiffness: 300, damping: 28)',
      'Layout-projection shared-element transitions between catalog cards and detail views',
      'Optimistic UI mutations with instant rollback on network failure',
      'prefers-reduced-motion: reduce full support',
      'Zero CLS: explicit aspect-ratio containers, BlurHash/LQIP, deterministic skeleton loaders',
      'Multi-angle progressive image gallery with pinch-to-zoom loupe inspection',
      'Interactive 3D model viewer (WebGL/GLTF) and AR QuickLook/SceneViewer integration',
      'Dynamic variant selection with URL query state synchronization',
      'Full keyboard navigation (Tab, Arrow roving tabindex, Escape focus restoration)',
      'ARIA live regions (aria-live="polite") for dynamic cart/status updates',
    ],
    implementation: `
// Design Token System (CSS Custom Properties)
:root {
  /* Primitive Palette */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a5f;

  /* Semantic Surfaces */
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-elevated: #ffffff;

  /* Typography Scale (fluid clamp) */
  --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
  --text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(0.9rem, 0.85rem + 0.25vw, 1rem);
  --text-lg: clamp(1.1rem, 1rem + 0.5vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2rem);

  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Motion */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}

/* Dark Mode */
[data-theme="dark"] {
  --color-surface-primary: #0f172a;
  --color-surface-secondary: #1e293b;
  --color-surface-elevated: #1e293b;
}
`,
  },
  {
    pillarId: 18,
    pillarName: 'Testing Infrastructure & E2E Suite',
    features: [
      'Testcontainers-based ephemeral PostgreSQL/Redis for integration tests',
      'Concurrency torture test: 50 parallel checkouts on on_hand=1 → exactly 1 succeeds',
      'Idempotency verification: 5 concurrent requests with same Idempotency-Key → 1 order',
      'Integer-cent rounding invariant test across 10,000 randomized carts',
      'RBAC permission boundary tests (cross-tenant data access returns 403/404)',
      'FSM state transition validation (illegal transitions return 422)',
      'Playwright E2E: anonymous browse → register → login → cart merge → checkout',
      'Playwright E2E: staff portal → order fulfillment → shipment → tracking',
      'Playwright E2E: customer RMA → admin refund settlement',
      'axe-core WCAG 2.2 automated accessibility assertions (0 critical/serious violations)',
      'Load tests: 1000 concurrent catalog search and 100 concurrent checkouts',
    ],
    implementation: `
// E2E-AUTH-01: Passkey Registration, Cart Merge & Session Revocation
describe('E2E-AUTH-01: Authentication & Session Lifecycle', () => {
  it('should merge guest cart into authenticated cart on sign-in', async ({ page }) => {
    await page.goto('/');
    // Add items as guest
    await page.click('[data-testid="product-card"] >> nth=0');
    await page.click('[data-testid="add-to-cart"]');
    await page.click('[data-testid="cart-badge"]');
    const guestCount = await page.textContent('[data-testid="cart-count"]');
    // Register
    await page.click('[data-testid="sign-in"]');
    await page.fill('[name="email"]', 'test@example.com');
    await page.click('[data-testid="register"]');
    // Verify cart items preserved
    const authCount = await page.textContent('[data-testid="cart-count"]');
    expect(authCount).toBe(guestCount);
  });

  it('should invalidate token family on refresh token replay', async ({ page }) => {
    // Get initial refresh token
    const refreshToken = await getRefreshToken();
    // Use it to get new access token (rotation)
    await rotateRefreshToken(refreshToken);
    // Replay old token
    const response = await replayRefreshToken(refreshToken);
    expect(response.status()).toBe(401);
  });
});

// INT-CONC-04: Parallel Checkout Inventory Race Condition
describe('INT-CONC-04: Inventory Race Condition', () => {
  it('should allow exactly 1 purchase from on_hand=1 across 50 parallel requests', async () => {
    const skuId = await createSkuWithStock(1);
    const idempotencyKey = generateUUID();
    const promises = Array.from({ length: 50 }, () =>
      checkoutWithIdempotency(skuId, 1, idempotencyKey)
    );
    const results = await Promise.allSettled(promises);
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 201');
    const failures = results.filter(r => r.status === 'fulfilled' && r.value.status === 409);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(49);
  });
});
`,
  },
  {
    pillarId: 19,
    pillarName: 'Security, Compliance & Infrastructure',
    features: [
      'HSTS preload, nonce-based CSP, X-Content-Type-Options, Permissions-Policy',
      'Strict CORS allowlist with credential-aware origins',
      'Field-level envelope encryption for PII (AES-256-GCM with KMS-wrapped DEKs)',
      'Blind-index HMAC hashes for exact-match PII lookups',
      'Webhook HMAC-SHA256 signature verification with timestamp tolerance (<=300s)',
      'Row-Level Security (RLS) policies for multi-tenant data isolation',
      'PostgreSQL RLS enforced at database level (not application-only)',
      'Token-bucket & sliding-window rate limiting (IP, user_id, API key, route sensitivity)',
      'Input sanitization against Stored XSS (HTML/Markdown sanitization)',
      'Dependency vulnerability scanning (npm audit, Snyk, Dependabot)',
      'Secrets management (Vault/AWS Secrets Manager, no secrets in code)',
      'Automated TLS certificate management (Let\'s Encrypt / ACM)',
    ],
    implementation: `
-- RLS Multi-Tenant Isolation
CREATE POLICY tenant_isolation_policy ON orders
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_policy ON catalog_products
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_policy ON warehouse_inventory
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit Log Immutability Trigger
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs are immutable — UPDATE/DELETE is forbidden';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Webhook Idempotency Table
CREATE TABLE processed_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(128) NOT NULL UNIQUE,
    source VARCHAR(64) NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate Limiting (Redis-backed)
-- Key structure: ratelimit:{tenant_id}:{route}:{window}
-- Token bucket algorithm with sliding window
`,
  },
];

export function getPillarById(id: number): PillarRequirement | undefined {
  return PILLARS.find(p => p.pillarId === id);
}

export function getAllPillarFeatures(): string[] {
  return PILLARS.flatMap(p => p.features);
}
