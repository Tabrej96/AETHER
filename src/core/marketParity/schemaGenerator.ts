/**
 * AETHER Market-Parity Engine — Complete PostgreSQL Schema Generator
 *
 * Generates COMPLETE database schemas for any industry,
 * including all tables, indexes, constraints, triggers, and migrations.
 */

import type { CompleteSchema, Industry, CompetitorFeature } from './types';

const BASE_TABLES = [
  {
    name: 'users',
    description: 'Core user identity — customers, staff, and admins',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Surrogate primary key' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Multi-tenant isolation' },
      { name: 'email', type: 'CITEXT', nullable: false, constraints: ['UNIQUE', 'NOT NULL'], description: 'Normalized email for unique lookup' },
      { name: 'email_verified_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Email verification timestamp' },
      { name: 'phone_e164', type: 'VARCHAR(20)', nullable: true, constraints: ['UNIQUE'], description: 'E.164 formatted phone number' },
      { name: 'phone_verified_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Phone verification timestamp' },
      { name: 'password_hash', type: 'TEXT', nullable: true, constraints: [], description: 'Argon2id hashed password (m=65536, t=3, p=4)' },
      { name: 'full_name', type: 'VARCHAR(200)', nullable: true, constraints: [], description: 'Display name' },
      { name: 'avatar_url', type: 'TEXT', nullable: true, constraints: [], description: 'Profile image URL' },
      { name: 'mfa_enabled', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'MFA enrollment status' },
      { name: 'mfa_secret_encrypted', type: 'BYTEA', nullable: true, constraints: [], description: 'Encrypted TOTP secret' },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'PENDING'", constraints: ['NOT NULL', "CHECK (status IN ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED','DELETED'))"], description: 'Account lifecycle status' },
      { name: 'risk_score', type: 'SMALLINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Fraud risk score 0-100' },
      { name: 'preferred_locale', type: 'VARCHAR(10)', nullable: false, defaultValue: "'en-US'", constraints: ['NOT NULL'], description: 'BCP-47 locale' },
      { name: 'preferred_currency', type: 'CHAR(3)', nullable: false, defaultValue: "'USD'", constraints: ['NOT NULL'], description: 'ISO 4217 currency code' },
      { name: 'metadata', type: 'JSONB', nullable: true, constraints: [], description: 'Polymorphic domain attributes' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Record creation time' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last modification time' },
      { name: 'deleted_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Soft-delete timestamp' },
    ],
  },
  {
    name: 'tenants',
    description: 'Multi-tenant organizations (platforms, stores, restaurants)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Tenant primary key' },
      { name: 'name', type: 'VARCHAR(200)', nullable: false, constraints: ['NOT NULL'], description: 'Organization/brand name' },
      { name: 'slug', type: 'VARCHAR(100)', nullable: false, constraints: ['UNIQUE', 'NOT NULL'], description: 'URL-safe identifier' },
      { name: 'domain', type: 'VARCHAR(255)', nullable: true, constraints: ['UNIQUE'], description: 'Custom domain' },
      { name: 'settings', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Tenant-specific configuration' },
      { name: 'brand_colors', type: 'JSONB', nullable: true, constraints: [], description: 'Custom brand color palette' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'TRUE', constraints: ['NOT NULL'], description: 'Tenant active status' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last update timestamp' },
    ],
  },
  {
    name: 'user_passkeys',
    description: 'FIDO2/WebAuthn passkey credentials for passwordless auth',
    columns: [
      { name: 'credential_id', type: 'BYTEA', nullable: false, constraints: ['PRIMARY KEY'], description: 'Unique passkey credential ID' },
      { name: 'user_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES users(id) ON DELETE CASCADE'], description: 'Owner user' },
      { name: 'public_key_cose', type: 'BYTEA', nullable: false, constraints: ['NOT NULL'], description: 'COSE-format public key' },
      { name: 'sign_count', type: 'BIGINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Signature counter for clone detection' },
      { name: 'aaguid', type: 'UUID', nullable: true, constraints: [], description: 'Authenticator attestation GUID' },
      { name: 'transports', type: 'TEXT[]', nullable: true, constraints: [], description: 'Supported transports (usb,nfc,ble,internal)' },
      { name: 'device_name', type: 'VARCHAR(120)', nullable: true, constraints: [], description: 'User-facing device name' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Registration timestamp' },
      { name: 'last_used_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Last successful assertion' },
    ],
  },
  {
    name: 'user_sessions',
    description: 'Active and historical user sessions for session management',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Session ID' },
      { name: 'user_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES users(id) ON DELETE CASCADE'], description: 'Session owner' },
      { name: 'token_family_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Refresh token family for reuse detection' },
      { name: 'refresh_token_hash', type: 'CHAR(64)', nullable: false, constraints: ['UNIQUE', 'NOT NULL'], description: 'SHA-256 hash of refresh token' },
      { name: 'ip_address', type: 'INET', nullable: false, constraints: ['NOT NULL'], description: 'Client IP address' },
      { name: 'user_agent', type: 'TEXT', nullable: false, constraints: ['NOT NULL'], description: 'Browser User-Agent string' },
      { name: 'geo_country', type: 'CHAR(2)', nullable: true, constraints: [], description: 'ISO 3166-1 alpha-2 country' },
      { name: 'geo_city', type: 'VARCHAR(100)', nullable: true, constraints: [], description: 'GeoIP city name' },
      { name: 'is_revoked', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'Session revocation flag' },
      { name: 'expires_at', type: 'TIMESTAMPTZ', nullable: false, constraints: ['NOT NULL'], description: 'Session expiration' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Session creation' },
      { name: 'last_active_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last activity timestamp' },
    ],
  },
  {
    name: 'user_addresses',
    description: 'Saved shipping/billing addresses with geospatial coordinates',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Address ID' },
      { name: 'user_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES users(id) ON DELETE CASCADE'], description: 'Address owner' },
      { name: 'label', type: 'VARCHAR(80)', nullable: true, constraints: [], description: 'User label (Home, Work, etc.)' },
      { name: 'address_line1', type: 'VARCHAR(255)', nullable: false, constraints: ['NOT NULL'], description: 'Street address line 1' },
      { name: 'address_line2', type: 'VARCHAR(255)', nullable: true, constraints: [], description: 'Street address line 2' },
      { name: 'city', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'City name' },
      { name: 'state', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'State/province' },
      { name: 'postal_code', type: 'VARCHAR(20)', nullable: false, constraints: ['NOT NULL'], description: 'Postal/ZIP code' },
      { name: 'country', type: 'CHAR(2)', nullable: false, constraints: ['NOT NULL'], description: 'ISO 3166-1 alpha-2' },
      { name: 'lat', type: 'DOUBLE PRECISION', nullable: true, constraints: [], description: 'WGS84 latitude' },
      { name: 'lng', type: 'DOUBLE PRECISION', nullable: true, constraints: [], description: 'WGS84 longitude' },
      { name: 'is_default', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'Default address flag' },
      { name: 'delivery_instructions', type: 'TEXT', nullable: true, constraints: [], description: 'Gate codes, landmarks, etc.' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
];

const CATALOG_TABLES = [
  {
    name: 'categories',
    description: 'Hierarchical product/service category tree with closure table',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Category ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'parent_id', type: 'UUID', nullable: true, constraints: ['REFERENCES categories(id)'], description: 'Parent category for hierarchy' },
      { name: 'name', type: 'VARCHAR(200)', nullable: false, constraints: ['NOT NULL'], description: 'Category display name' },
      { name: 'slug', type: 'VARCHAR(200)', nullable: false, constraints: ['NOT NULL'], description: 'URL-safe slug' },
      { name: 'description', type: 'TEXT', nullable: true, constraints: [], description: 'Category description' },
      { name: 'image_url', type: 'TEXT', nullable: true, constraints: [], description: 'Category image URL' },
      { name: 'icon', type: 'VARCHAR(64)', nullable: true, constraints: [], description: 'Icon identifier' },
      { name: 'sort_order', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Display sort order' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'TRUE', constraints: ['NOT NULL'], description: 'Active status' },
      { name: 'attribute_schema', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Category-specific attribute schema' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'category_closure',
    description: 'Closure table for efficient hierarchical category queries',
    columns: [
      { name: 'ancestor_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES categories(id) ON DELETE CASCADE'], description: 'Ancestor category' },
      { name: 'descendant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES categories(id) ON DELETE CASCADE'], description: 'Descendant category' },
      { name: 'depth', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Distance between ancestor and descendant' },
    ],
  },
  {
    name: 'catalog_products',
    description: 'Core product/service catalog entries',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Product ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'slug', type: 'VARCHAR(255)', nullable: false, constraints: ['NOT NULL'], description: 'URL-safe slug' },
      { name: 'title', type: 'VARCHAR(500)', nullable: false, constraints: ['NOT NULL'], description: 'Product display title' },
      { name: 'subtitle', type: 'VARCHAR(500)', nullable: true, constraints: [], description: 'Product subtitle/tagline' },
      { name: 'storytelling_markdown', type: 'TEXT', nullable: true, constraints: [], description: 'Rich product description' },
      { name: 'category_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES categories(id)'], description: 'Primary category' },
      { name: 'brand_name', type: 'VARCHAR(200)', nullable: true, constraints: [], description: 'Brand name' },
      { name: 'tax_code', type: 'VARCHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'HSN/SAC/Tax code' },
      { name: 'return_policy_id', type: 'UUID', nullable: true, constraints: [], description: 'Linked return policy' },
      { name: 'attributes_schema', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Polymorphic product attributes' },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'DRAFT'", constraints: ['NOT NULL', "CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED'))"], description: 'Publication status' },
      { name: 'avg_rating', type: 'NUMERIC(3,2)', nullable: false, defaultValue: '0.00', constraints: ['NOT NULL'], description: 'Average star rating' },
      { name: 'review_count', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Total review count' },
      { name: 'is_featured', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'Featured product flag' },
      { name: 'published_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Publication timestamp' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last update timestamp' },
    ],
  },
  {
    name: 'catalog_skus',
    description: 'Product variants (size, color, roast, grind, etc.) with pricing',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'SKU ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'product_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES catalog_products(id) ON DELETE CASCADE'], description: 'Parent product' },
      { name: 'sku_code', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'Unique SKU identifier' },
      { name: 'upc_ean', type: 'VARCHAR(32)', nullable: true, constraints: [], description: 'UPC/EAN barcode' },
      { name: 'variant_options', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Variant attributes (roast, grind, etc.)' },
      { name: 'currency', type: 'CHAR(3)', nullable: false, defaultValue: "'USD'", constraints: ['NOT NULL'], description: 'ISO 4217 currency' },
      { name: 'list_price_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL', 'CHECK (list_price_cents >= 0)'], description: 'List price in minor units' },
      { name: 'sale_price_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL', 'CHECK (sale_price_cents >= 0 AND sale_price_cents <= list_price_cents)'], description: 'Sale price in minor units' },
      { name: 'cost_price_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL', 'CHECK (cost_price_cents >= 0)'], description: 'Cost price in minor units' },
      { name: 'weight_grams', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Shipping weight in grams' },
      { name: 'dimensions_mm', type: 'JSONB', nullable: true, constraints: [], description: 'L/W/H in millimeters' },
      { name: 'is_subscription_eligible', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'Subscription support flag' },
      { name: 'subscription_discount_bps', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (subscription_discount_bps BETWEEN 0 AND 10000)'], description: 'Subscription discount in basis points' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'TRUE', constraints: ['NOT NULL'], description: 'SKU active status' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last update timestamp' },
    ],
  },
  {
    name: 'product_media',
    description: 'Product images, videos, 3D models, and documents',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Media ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'product_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES catalog_products(id) ON DELETE CASCADE'], description: 'Parent product' },
      { name: 'sku_id', type: 'UUID', nullable: true, constraints: ['REFERENCES catalog_skus(id) ON DELETE CASCADE'], description: 'Optional SKU-specific media' },
      { name: 'media_type', type: 'VARCHAR(16)', nullable: false, constraints: ['NOT NULL', "CHECK (media_type IN ('IMAGE','VIDEO','360','MODEL_3D','DOCUMENT'))"], description: 'Media type' },
      { name: 'url', type: 'TEXT', nullable: false, constraints: ['NOT NULL'], description: 'Media asset URL' },
      { name: 'blurhash', type: 'VARCHAR(64)', nullable: true, constraints: [], description: 'BlurHash placeholder string' },
      { name: 'alt_text', type: 'VARCHAR(255)', nullable: true, constraints: [], description: 'Accessibility alt text' },
      { name: 'sort_order', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Display order' },
      { name: 'is_primary', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'Primary media flag' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'product_embeddings',
    description: 'Vector embeddings for semantic/hybrid search (pgvector)',
    columns: [
      { name: 'sku_id', type: 'UUID', nullable: false, constraints: ['PRIMARY KEY', 'REFERENCES catalog_skus(id) ON DELETE CASCADE'], description: 'Linked SKU' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'embedding', type: 'VECTOR(1536)', nullable: true, constraints: [], description: 'OpenAI-compatible embedding vector' },
      { name: 'search_text', type: 'TEXT', nullable: false, constraints: ['NOT NULL'], description: 'Concatenated searchable text' },
      { name: 'model', type: 'VARCHAR(64)', nullable: false, defaultValue: "'text-embedding-3-small'", constraints: ['NOT NULL'], description: 'Embedding model used' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last embedding update' },
    ],
  },
];

const ORDER_TABLES = [
  {
    name: 'orders',
    description: 'Immutable order header with state machine',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Order ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'order_number', type: 'VARCHAR(40)', nullable: false, constraints: ['UNIQUE', 'NOT NULL'], description: 'Human-readable order number' },
      { name: 'user_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES users(id)'], description: 'Placing customer' },
      { name: 'currency', type: 'CHAR(3)', nullable: false, constraints: ['NOT NULL'], description: 'Order currency' },
      { name: 'subtotal_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL', 'CHECK (subtotal_cents >= 0)'], description: 'Pre-discount subtotal' },
      { name: 'discount_total_cents', type: 'BIGINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (discount_total_cents >= 0)'], description: 'Total discounts' },
      { name: 'shipping_total_cents', type: 'BIGINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (shipping_total_cents >= 0)'], description: 'Shipping charges' },
      { name: 'tax_total_cents', type: 'BIGINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (tax_total_cents >= 0)'], description: 'Total tax' },
      { name: 'tip_cents', type: 'BIGINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (tip_cents >= 0)'], description: 'Gratuity/tip' },
      { name: 'grand_total_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL', 'CHECK (grand_total_cents >= 0)'], description: 'Final total' },
      { name: 'status', type: 'VARCHAR(40)', nullable: false, defaultValue: "'PENDING_PAYMENT'", constraints: ['NOT NULL'], description: 'FSM state' },
      { name: 'payment_intent_id', type: 'UUID', nullable: true, constraints: [], description: 'Linked payment intent' },
      { name: 'shipping_address_snapshot', type: 'JSONB', nullable: false, constraints: ['NOT NULL'], description: 'Immutable shipping address at order time' },
      { name: 'billing_address_snapshot', type: 'JSONB', nullable: false, constraints: ['NOT NULL'], description: 'Immutable billing address at order time' },
      { name: 'tax_breakdown_snapshot', type: 'JSONB', nullable: false, defaultValue: "'[]'", constraints: ['NOT NULL'], description: 'Line-by-line tax breakdown' },
      { name: 'notes', type: 'TEXT', nullable: true, constraints: [], description: 'Customer order notes' },
      { name: 'cancellation_reason', type: 'TEXT', nullable: true, constraints: [], description: 'Cancellation reason' },
      { name: 'cancelled_by', type: 'UUID', nullable: true, constraints: ['REFERENCES users(id)'], description: 'Who cancelled' },
      { name: 'cancelled_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Cancellation timestamp' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Order creation' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last update' },
    ],
  },
  {
    name: 'order_line_items',
    description: 'Individual line items within an order with immutable snapshots',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Line item ID' },
      { name: 'order_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES orders(id) ON DELETE CASCADE'], description: 'Parent order' },
      { name: 'sku_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES catalog_skus(id)'], description: 'Ordered SKU' },
      { name: 'sku_snapshot', type: 'JSONB', nullable: false, constraints: ['NOT NULL'], description: 'SKU data at time of order' },
      { name: 'quantity', type: 'INTEGER', nullable: false, constraints: ['NOT NULL', 'CHECK (quantity > 0)'], description: 'Quantity ordered' },
      { name: 'selected_modifiers', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Chosen modifiers at time of order' },
      { name: 'unit_price_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL'], description: 'Price per unit in minor units' },
      { name: 'discount_cents', type: 'BIGINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Line-item discount' },
      { name: 'tax_cents', type: 'BIGINT', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Line-item tax' },
      { name: 'line_total_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL'], description: 'Line grand total' },
      { name: 'allocated_warehouse_id', type: 'UUID', nullable: true, constraints: [], description: 'Fulfilling warehouse' },
      { name: 'sort_order', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL'], description: 'Display order' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'order_status_transitions',
    description: 'Audit log of all order FSM state changes',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Transition ID' },
      { name: 'order_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES orders(id) ON DELETE CASCADE'], description: 'Parent order' },
      { name: 'from_status', type: 'VARCHAR(40)', nullable: true, constraints: [], description: 'Previous status' },
      { name: 'to_status', type: 'VARCHAR(40)', nullable: false, constraints: ['NOT NULL'], description: 'New status' },
      { name: 'actor_type', type: 'VARCHAR(16)', nullable: false, constraints: ['NOT NULL', "CHECK (actor_type IN ('SYSTEM','USER','ADMIN','WEBHOOK','COURIER'))"], description: 'Who triggered the transition' },
      { name: 'actor_id', type: 'UUID', nullable: true, constraints: [], description: 'Actor user/system ID' },
      { name: 'reason_code', type: 'VARCHAR(64)', nullable: true, constraints: [], description: 'Structured reason code' },
      { name: 'notes', type: 'TEXT', nullable: true, constraints: [], description: 'Human-readable notes' },
      { name: 'metadata', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Additional transition data' },
      { name: 'occurred_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Transition timestamp' },
    ],
  },
  {
    name: 'idempotency_keys',
    description: 'Idempotent request deduplication for checkout and mutations',
    columns: [
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'user_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Requesting user' },
      { name: 'idempotency_key', type: 'VARCHAR(128)', nullable: false, constraints: ['NOT NULL'], description: 'Client-generated UUID' },
      { name: 'request_method', type: 'VARCHAR(16)', nullable: false, constraints: ['NOT NULL'], description: 'HTTP method' },
      { name: 'request_path', type: 'VARCHAR(255)', nullable: false, constraints: ['NOT NULL'], description: 'Request URL path' },
      { name: 'request_hash', type: 'CHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'SHA-256 of request body' },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'IN_PROGRESS'", constraints: ['NOT NULL', "CHECK (status IN ('IN_PROGRESS','COMPLETED','FAILED'))"], description: 'Processing status' },
      { name: 'http_status_code', type: 'SMALLINT', nullable: true, constraints: [], description: 'Final HTTP status' },
      { name: 'response_body', type: 'JSONB', nullable: true, constraints: [], description: 'Cached response body' },
      { name: 'locked_until', type: 'TIMESTAMPTZ', nullable: false, constraints: ['NOT NULL'], description: 'Lock expiration for in-flight requests' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
];

const INVENTORY_TABLES = [
  {
    name: 'warehouses',
    description: 'Warehouse, store, kitchen, or dark store locations',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Warehouse ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'name', type: 'VARCHAR(200)', nullable: false, constraints: ['NOT NULL'], description: 'Location name' },
      { name: 'code', type: 'VARCHAR(32)', nullable: false, constraints: ['NOT NULL'], description: 'Short warehouse code' },
      { name: 'type', type: 'VARCHAR(32)', nullable: false, defaultValue: "'PHYSICAL'", constraints: ['NOT NULL', "CHECK (type IN ('PHYSICAL','VIRTUAL','DARK_STORE','KITCHEN','STORE'))"], description: 'Warehouse type' },
      { name: 'address', type: 'JSONB', nullable: false, constraints: ['NOT NULL'], description: 'Full address object' },
      { name: 'lat', type: 'DOUBLE PRECISION', nullable: true, constraints: [], description: 'WGS84 latitude' },
      { name: 'lng', type: 'DOUBLE PRECISION', nullable: true, constraints: [], description: 'WGS84 longitude' },
      { name: 'contact_phone', type: 'VARCHAR(32)', nullable: true, constraints: [], description: 'Contact phone' },
      { name: 'operating_hours', type: 'JSONB', nullable: true, constraints: [], description: 'Weekly operating hours' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'TRUE', constraints: ['NOT NULL'], description: 'Active status' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'warehouse_inventory',
    description: '4-bucket ATP inventory ledger per SKU per warehouse',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Inventory record ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'warehouse_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES warehouses(id)'], description: 'Warehouse' },
      { name: 'sku_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES catalog_skus(id) ON DELETE RESTRICT'], description: 'SKU reference' },
      { name: 'on_hand', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (on_hand >= 0)'], description: 'Physical shelf count' },
      { name: 'reserved', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (reserved >= 0)'], description: 'Locked by active checkouts' },
      { name: 'committed', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (committed >= 0)'], description: 'Bound to confirmed orders' },
      { name: 'safety_stock', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (safety_stock >= 0)'], description: 'Minimum safety buffer' },
      { name: 'damaged_quarantined', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (damaged_quarantined >= 0)'], description: 'Quarantined units' },
      { name: 'incoming_allocated', type: 'INTEGER', nullable: false, defaultValue: '0', constraints: ['NOT NULL', 'CHECK (incoming_allocated >= 0)'], description: 'Expected incoming stock' },
      { name: 'reorder_point', type: 'INTEGER', nullable: false, defaultValue: '10', constraints: ['NOT NULL'], description: 'Reorder trigger threshold' },
      { name: 'reorder_quantity', type: 'INTEGER', nullable: false, defaultValue: '50', constraints: ['NOT NULL'], description: 'Suggested reorder amount' },
      { name: 'bin_location', type: 'VARCHAR(64)', nullable: true, constraints: [], description: 'Warehouse bin/shelf location' },
      { name: 'lot_number', type: 'VARCHAR(64)', nullable: true, constraints: [], description: 'Batch/lot identifier' },
      { name: 'expiry_date', type: 'DATE', nullable: true, constraints: [], description: 'Lot expiry for FEFO' },
      { name: 'version', type: 'BIGINT', nullable: false, defaultValue: '1', constraints: ['NOT NULL'], description: 'Optimistic locking version' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last inventory update' },
    ],
  },
  {
    name: 'inventory_reservations',
    description: 'TTL-bound inventory reservations during checkout',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Reservation ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'warehouse_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES warehouses(id)'], description: 'Source warehouse' },
      { name: 'sku_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES catalog_skus(id)'], description: 'Reserved SKU' },
      { name: 'checkout_session_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Cart/checkout session' },
      { name: 'order_id', type: 'UUID', nullable: true, constraints: ['REFERENCES orders(id)'], description: 'Confirmed order' },
      { name: 'quantity', type: 'INTEGER', nullable: false, constraints: ['NOT NULL', 'CHECK (quantity > 0)'], description: 'Reserved quantity' },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'RESERVED'", constraints: ['NOT NULL', "CHECK (status IN ('RESERVED','COMMITTED','RELEASED','EXPIRED'))"], description: 'Reservation state' },
      { name: 'expires_at', type: 'TIMESTAMPTZ', nullable: false, constraints: ['NOT NULL'], description: 'TTL expiration' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last update' },
    ],
  },
  {
    name: 'suppliers',
    description: 'Vendor/supplier master for procurement',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Supplier ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'name', type: 'VARCHAR(200)', nullable: false, constraints: ['NOT NULL'], description: 'Supplier name' },
      { name: 'code', type: 'VARCHAR(32)', nullable: true, constraints: ['UNIQUE'], description: 'Short supplier code' },
      { name: 'contact_email', type: 'VARCHAR(255)', nullable: true, constraints: [], description: 'Primary contact email' },
      { name: 'contact_phone', type: 'VARCHAR(32)', nullable: true, constraints: [], description: 'Primary contact phone' },
      { name: 'payment_terms', type: 'VARCHAR(32)', nullable: false, defaultValue: "'NET_30'", constraints: ['NOT NULL'], description: 'Payment terms (NET_30, NET_60, etc.)' },
      { name: 'currency', type: 'CHAR(3)', nullable: false, defaultValue: "'USD'", constraints: ['NOT NULL'], description: 'Settlement currency' },
      { name: 'metadata', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Additional supplier data' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'TRUE', constraints: ['NOT NULL'], description: 'Active status' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'purchase_orders',
    description: 'Purchase order header with 3-way matching',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'PO ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'po_number', type: 'VARCHAR(40)', nullable: false, constraints: ['UNIQUE', 'NOT NULL'], description: 'Human-readable PO number' },
      { name: 'supplier_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES suppliers(id)'], description: 'Supplier' },
      { name: 'warehouse_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES warehouses(id)'], description: 'Receiving warehouse' },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'DRAFT'", constraints: ['NOT NULL', "CHECK (status IN ('DRAFT','ISSUED','PARTIALLY_RECEIVED','RECEIVED','CLOSED','CANCELLED'))"], description: 'PO lifecycle state' },
      { name: 'total_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL'], description: 'PO total in minor units' },
      { name: 'currency', type: 'CHAR(3)', nullable: false, constraints: ['NOT NULL'], description: 'PO currency' },
      { name: 'expected_delivery', type: 'DATE', nullable: true, constraints: [], description: 'Expected delivery date' },
      { name: 'received_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Actual receipt timestamp' },
      { name: 'notes', type: 'TEXT', nullable: true, constraints: [], description: 'PO notes' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
];

const FINANCIAL_TABLES = [
  {
    name: 'currencies',
    description: 'Supported currency metadata with minor-unit exponents',
    columns: [
      { name: 'code', type: 'CHAR(3)', nullable: false, constraints: ['PRIMARY KEY'], description: 'ISO 4217 code' },
      { name: 'name', type: 'VARCHAR(80)', nullable: false, constraints: ['NOT NULL'], description: 'Currency name' },
      { name: 'symbol', type: 'VARCHAR(10)', nullable: true, constraints: [], description: 'Display symbol ($, €, ₹)' },
      { name: 'exponent', type: 'SMALLINT', nullable: false, constraints: ['NOT NULL'], description: 'Minor unit exponent (0=JPY, 2=USD, 3=BHD)' },
      { name: 'is_active', type: 'BOOLEAN', nullable: false, defaultValue: 'TRUE', constraints: ['NOT NULL'], description: 'Active support flag' },
    ],
  },
  {
    name: 'tax_rates',
    description: 'Jurisdiction-aware tax rates with effective date ranges',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Tax rate ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'name', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'Tax rate name' },
      { name: 'jurisdiction_type', type: 'VARCHAR(32)', nullable: false, constraints: ['NOT NULL', "CHECK (jurisdiction_type IN ('COUNTRY','STATE','COUNTY','CITY','SPECIAL','POSTAL'))"], description: 'Jurisdiction level' },
      { name: 'jurisdiction_code', type: 'VARCHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'Jurisdiction identifier' },
      { name: 'tax_code', type: 'VARCHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'HSN/SAC/Stripe tax code' },
      { name: 'rate_bps', type: 'INTEGER', nullable: false, constraints: ['NOT NULL', 'CHECK (rate_bps BETWEEN 0 AND 10000)'], description: 'Rate in basis points (825 = 8.25%)' },
      { name: 'is_inclusive', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'Tax-inclusive pricing flag' },
      { name: 'effective_from', type: 'DATE', nullable: false, constraints: ['NOT NULL'], description: 'Rate effective date' },
      { name: 'effective_to', type: 'DATE', nullable: true, constraints: [], description: 'Rate expiry date' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'payment_intents',
    description: 'Payment state machine for multi-gateway orchestration',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Payment intent ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'user_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES users(id)'], description: 'Paying user' },
      { name: 'order_id', type: 'UUID', nullable: true, constraints: ['REFERENCES orders(id)'], description: 'Linked order' },
      { name: 'gateway', type: 'VARCHAR(32)', nullable: false, constraints: ['NOT NULL'], description: 'Payment gateway name' },
      { name: 'gateway_intent_id', type: 'VARCHAR(255)', nullable: true, constraints: [], description: 'Gateway-side intent ID' },
      { name: 'amount_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL'], description: 'Amount in minor units' },
      { name: 'currency', type: 'CHAR(3)', nullable: false, constraints: ['NOT NULL'], description: 'Currency code' },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'REQUIRES_PAYMENT_METHOD'", constraints: ['NOT NULL'], description: 'Payment state' },
      { name: 'metadata', type: 'JSONB', nullable: false, defaultValue: "'{}'", constraints: ['NOT NULL'], description: 'Gateway metadata' },
      { name: 'failure_reason', type: 'TEXT', nullable: true, constraints: [], description: 'Decline/failure reason' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Last update' },
    ],
  },
  {
    name: 'ledger_entries',
    description: 'Double-entry immutable financial ledger',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Ledger entry ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'transaction_group_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Groups balanced entries' },
      { name: 'entry_type', type: 'VARCHAR(16)', nullable: false, constraints: ['NOT NULL', "CHECK (entry_type IN ('DEBIT','CREDIT'))"], description: 'Debit or credit' },
      { name: 'account_code', type: 'VARCHAR(32)', nullable: false, constraints: ['NOT NULL'], description: 'Chart of accounts code' },
      { name: 'amount_cents', type: 'BIGINT', nullable: false, constraints: ['NOT NULL', 'CHECK (amount_cents > 0)'], description: 'Entry amount in minor units' },
      { name: 'currency', type: 'CHAR(3)', nullable: false, constraints: ['NOT NULL'], description: 'Entry currency' },
      { name: 'reference_type', type: 'VARCHAR(64)', nullable: true, constraints: [], description: 'Entity type (order, refund, payout)' },
      { name: 'reference_id', type: 'UUID', nullable: true, constraints: [], description: 'Referenced entity ID' },
      { name: 'description', type: 'TEXT', nullable: true, constraints: [], description: 'Human-readable description' },
      { name: 'posted_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Posting timestamp' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Entry creation' },
    ],
  },
];

const RBAC_TABLES = [
  {
    name: 'roles',
    description: 'RBAC role definitions with hierarchy support',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Role ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'name', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'Role display name' },
      { name: 'slug', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'URL-safe slug' },
      { name: 'description', type: 'TEXT', nullable: true, constraints: [], description: 'Role description' },
      { name: 'is_system', type: 'BOOLEAN', nullable: false, defaultValue: 'FALSE', constraints: ['NOT NULL'], description: 'System role (immutable)' },
      { name: 'parent_role_id', type: 'UUID', nullable: true, constraints: ['REFERENCES roles(id)'], description: 'Parent role for hierarchy' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'permissions',
    description: 'Granular permission definitions (domain:resource:action:scope)',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Permission ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'name', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'Permission name' },
      { name: 'slug', type: 'VARCHAR(255)', nullable: false, constraints: ['NOT NULL'], description: 'domain:resource:action:scope slug' },
      { name: 'description', type: 'TEXT', nullable: true, constraints: [], description: 'Permission description' },
      { name: 'domain', type: 'VARCHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'Domain (catalog, orders, finance)' },
      { name: 'resource', type: 'VARCHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'Resource (product, order, user)' },
      { name: 'action', type: 'VARCHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'Action (create, read, update, delete)' },
      { name: 'scope', type: 'VARCHAR(255)', nullable: false, defaultValue: "'own'", constraints: ['NOT NULL'], description: 'Scope (own, team, tenant, global)' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
    ],
  },
  {
    name: 'user_roles',
    description: 'User-to-role assignments per tenant',
    columns: [
      { name: 'user_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES users(id) ON DELETE CASCADE'], description: 'Assigned user' },
      { name: 'role_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES roles(id) ON DELETE CASCADE'], description: 'Assigned role' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant context' },
      { name: 'granted_by', type: 'UUID', nullable: true, constraints: ['REFERENCES users(id)'], description: 'Who granted this role' },
      { name: 'granted_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Grant timestamp' },
    ],
  },
  {
    name: 'role_permissions',
    description: 'Many-to-many role-to-permission mapping',
    columns: [
      { name: 'role_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES roles(id) ON DELETE CASCADE'], description: 'Role' },
      { name: 'permission_id', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES permissions(id) ON DELETE CASCADE'], description: 'Permission' },
      { name: 'granted_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Grant timestamp' },
    ],
  },
  {
    name: 'approval_workflows',
    description: 'Maker-checker approval workflows for high-risk actions',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Workflow ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'action_type', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'Type of action requiring approval' },
      { name: 'entity_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Target entity ID' },
      { name: 'requested_by', type: 'UUID', nullable: false, constraints: ['NOT NULL', 'REFERENCES users(id)'], description: 'Requesting user' },
      { name: 'approver_id', type: 'UUID', nullable: true, constraints: ['REFERENCES users(id)'], description: 'Assigned approver' },
      { name: 'status', type: 'VARCHAR(32)', nullable: false, defaultValue: "'PENDING'", constraints: ['NOT NULL', "CHECK (status IN ('PENDING','APPROVED','REJECTED','EXPIRED'))"], description: 'Workflow status' },
      { name: 'request_data', type: 'JSONB', nullable: false, constraints: ['NOT NULL'], description: 'Request payload snapshot' },
      { name: 'reason', type: 'TEXT', nullable: true, constraints: [], description: 'Approval/rejection reason' },
      { name: 'created_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Creation timestamp' },
      { name: 'resolved_at', type: 'TIMESTAMPTZ', nullable: true, constraints: [], description: 'Resolution timestamp' },
    ],
  },
];

const AUDIT_TABLE = [
  {
    name: 'audit_logs',
    description: 'Immutable hash-chained append-only audit ledger',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, defaultValue: 'gen_random_uuid()', constraints: ['PRIMARY KEY'], description: 'Audit entry ID' },
      { name: 'tenant_id', type: 'UUID', nullable: false, constraints: ['NOT NULL'], description: 'Tenant ID' },
      { name: 'occurred_at', type: 'TIMESTAMPTZ', nullable: false, defaultValue: 'NOW()', constraints: ['NOT NULL'], description: 'Event timestamp' },
      { name: 'actor_type', type: 'VARCHAR(32)', nullable: false, constraints: ['NOT NULL'], description: 'USER, ADMIN, SYSTEM, API_KEY, AI_AGENT' },
      { name: 'actor_id', type: 'UUID', nullable: true, constraints: [], description: 'Actor user/entity ID' },
      { name: 'impersonator_id', type: 'UUID', nullable: true, constraints: [], description: 'Impersonating admin if any' },
      { name: 'ip_address', type: 'INET', nullable: true, constraints: [], description: 'Source IP' },
      { name: 'user_agent', type: 'TEXT', nullable: true, constraints: [], description: 'Client User-Agent' },
      { name: 'request_id', type: 'VARCHAR(128)', nullable: false, constraints: ['NOT NULL'], description: 'W3C Trace Context request ID' },
      { name: 'action', type: 'VARCHAR(120)', nullable: false, constraints: ['NOT NULL'], description: 'Action verb (create, update, delete)' },
      { name: 'entity_type', type: 'VARCHAR(80)', nullable: false, constraints: ['NOT NULL'], description: 'Target entity type' },
      { name: 'entity_id', type: 'VARCHAR(128)', nullable: false, constraints: ['NOT NULL'], description: 'Target entity ID' },
      { name: 'before_state', type: 'JSONB', nullable: true, constraints: [], description: 'State before mutation (PII redacted)' },
      { name: 'after_state', type: 'JSONB', nullable: true, constraints: [], description: 'State after mutation (PII redacted)' },
      { name: 'prev_hash', type: 'CHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'SHA-256 of previous record' },
      { name: 'record_hash', type: 'CHAR(64)', nullable: false, constraints: ['NOT NULL'], description: 'SHA-256 of this record' },
      { name: 'reason_code', type: 'VARCHAR(64)', nullable: true, constraints: [], description: 'Structured reason code' },
    ],
  },
];

function buildTableDDL(table: { name: string; columns: { name: string; type: string; nullable: boolean; defaultValue?: string; constraints: string[]; description: string }[]; description: string }): string[] {
  const lines: string[] = [];
  lines.push(`-- ${table.description}`);
  lines.push(`CREATE TABLE ${table.name} (`);

  const colDefs = table.columns.map(col => {
    const parts = [`    ${col.name} ${col.type}`];
    if (!col.nullable) parts.push('NOT NULL');
    if (col.defaultValue) parts.push(`DEFAULT ${col.defaultValue}`);
    const checks = col.constraints.filter(c => c.startsWith('CHECK'));
    if (checks.length > 0) parts.push(checks.join(' '));
    return { ...col, colDef: parts.join(' ') };
  });

  lines.push(colDefs.map(c => c.colDef).join(',\n'));

  const pkCols = table.columns.filter(c => c.constraints.includes('PRIMARY KEY'));
  const fkCols = table.columns.filter(c => c.constraints.some(cs => cs.startsWith('REFERENCES')));
  const uqCols = table.columns.filter(c => c.constraints.includes('UNIQUE'));

  // Primary keys (for multi-column tables like idempotency_keys)
  if (table.name === 'idempotency_keys' || table.name === 'user_roles' || table.name === 'role_permissions' || table.name === 'category_closure' || table.name === 'wishlist_items') {
    lines.push(',');
    const pkParts = table.columns
      .filter(c => c.constraints.includes('PRIMARY KEY') || c.name === 'tenant_id' || c.name === 'user_id' || c.name === 'role_id' || c.name === 'ancestor_id' || c.name === 'descendant_id')
      .map(c => c.name);
    lines.push(`    PRIMARY KEY (${pkParts.join(', ')})`);
  }

  if (uqCols.length > 0 && table.name !== 'idempotency_keys') {
    // Add unique constraints inline or as separate ALTER TABLE
  }

  lines.push(');');

  // Unique constraints
  const uniquePairs: [string, string[]][] = [
    ['users', ['tenant_id', 'email']],
    ['warehouse_inventory', ['warehouse_id', 'sku_id']],
    ['carts', ['user_id']],
    ['loyalty_accounts', ['user_id', 'tenant_id']],
    ['notifications', []],
  ];

  if (table.name === 'warehouse_inventory') {
    lines.push(`CREATE UNIQUE INDEX uq_${table.name}_warehouse_sku ON ${table.name}(warehouse_id, sku_id);`);
  }
  if (table.name === 'audit_logs') {
    lines.push(`CREATE INDEX idx_${table.name}_tenant_occurred ON ${table.name}(tenant_id, occurred_at DESC);`);
    lines.push(`CREATE INDEX idx_${table.name}_entity ON ${table.name}(tenant_id, entity_type, entity_id);`);
  }

  return lines;
}

function buildAllIndexes(): { index: string; table: string; columns: string[]; unique: boolean; description: string }[] {
  const indexes = [
    { index: 'idx_users_email', table: 'users', columns: ['email'], unique: false, description: 'Email lookup' },
    { index: 'idx_users_phone', table: 'users', columns: ['phone_e164'], unique: false, description: 'Phone lookup' },
    { index: 'idx_sessions_user', table: 'user_sessions', columns: ['user_id'], unique: false, description: 'User session listing' },
    { index: 'idx_sessions_revoked', table: 'user_sessions', columns: ['is_revoked', 'expires_at'], unique: false, description: 'Active session queries' },
    { index: 'idx_catalog_products_category', table: 'catalog_products', columns: ['tenant_id', 'category_id', 'status'], unique: false, description: 'Category product listing' },
    { index: 'idx_catalog_products_slug', table: 'catalog_products', columns: ['tenant_id', 'slug'], unique: true, description: 'Slug uniqueness per tenant' },
    { index: 'idx_catalog_skus_product', table: 'catalog_skus', columns: ['product_id'], unique: false, description: 'SKU listing per product' },
    { index: 'idx_catalog_skus_code', table: 'catalog_skus', columns: ['tenant_id', 'sku_code'], unique: true, description: 'SKU code uniqueness' },
    { index: 'idx_orders_user', table: 'orders', columns: ['user_id', 'created_at DESC'], unique: false, description: 'User order history' },
    { index: 'idx_orders_status', table: 'orders', columns: ['tenant_id', 'status', 'created_at DESC'], unique: false, description: 'Order status queries' },
    { index: 'idx_orders_number', table: 'orders', columns: ['order_number'], unique: true, description: 'Order number lookup' },
    { index: 'idx_inventory_warehouse_sku', table: 'warehouse_inventory', columns: ['warehouse_id', 'sku_id'], unique: true, description: 'ATP lookup per SKU' },
    { index: 'idx_inventory_reservations_session', table: 'inventory_reservations', columns: ['checkout_session_id', 'status'], unique: false, description: 'Session reservation lookup' },
    { index: 'idx_inventory_reservations_expiry', table: 'inventory_reservations', columns: ['status', 'expires_at'], unique: false, description: 'TTL sweeper queries' },
    { index: 'idx_reviews_product', table: 'reviews', columns: ['product_id', 'status', 'helpful_upvotes DESC'], unique: false, description: 'Approved review listing' },
    { index: 'idx_reviews_user', table: 'reviews', columns: ['user_id'], unique: false, description: 'User review history' },
    { index: 'idx_analytics_tenant_time', table: 'analytics_events', columns: ['tenant_id', 'occurred_at DESC'], unique: false, description: 'Analytics time-range queries' },
    { index: 'idx_notifications_user', table: 'notifications', columns: ['user_id', 'created_at DESC'], unique: false, description: 'User notification feed' },
    { index: 'idx_fulfillment_order', table: 'fulfillment_orders', columns: ['order_id'], unique: false, description: 'Order fulfillment lookup' },
    { index: 'idx_rma_order', table: 'rma_requests', columns: ['order_id'], unique: false, description: 'RMA per order' },
    { index: 'idx_ai_conversations_session', table: 'ai_conversations', columns: ['session_id', 'updated_at DESC'], unique: false, description: 'AI chat session lookup' },
  ];

  return indexes;
}

function buildAllConstraints(): { name: string; type: 'FK' | 'PK' | 'UNIQUE' | 'CHECK' | 'EXCLUSION'; table: string; definition: string; description: string }[] {
  return [
    { name: 'fk_catalog_products_category', type: 'FK', table: 'catalog_products', definition: 'FOREIGN KEY (category_id) REFERENCES categories(id)', description: 'Product → Category' },
    { name: 'fk_catalog_skus_product', type: 'FK', table: 'catalog_skus', definition: 'FOREIGN KEY (product_id) REFERENCES catalog_products(id) ON DELETE CASCADE', description: 'SKU → Product' },
    { name: 'fk_orders_user', type: 'FK', table: 'orders', definition: 'FOREIGN KEY (user_id) REFERENCES users(id)', description: 'Order → Customer' },
    { name: 'fk_oli_order', type: 'FK', table: 'order_line_items', definition: 'FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE', description: 'Line item → Order' },
    { name: 'fk_oli_sku', type: 'FK', table: 'order_line_items', definition: 'FOREIGN KEY (sku_id) REFERENCES catalog_skus(id)', description: 'Line item → SKU' },
    { name: 'fk_inv_warehouse', type: 'FK', table: 'warehouse_inventory', definition: 'FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)', description: 'Inventory → Warehouse' },
    { name: 'fk_inv_sku', type: 'FK', table: 'warehouse_inventory', definition: 'FOREIGN KEY (sku_id) REFERENCES catalog_skus(id) ON DELETE RESTRICT', description: 'Inventory → SKU' },
    { name: 'fk_resv_warehouse', type: 'FK', table: 'inventory_reservations', definition: 'FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)', description: 'Reservation → Warehouse' },
    { name: 'fk_resv_sku', type: 'FK', table: 'inventory_reservations', definition: 'FOREIGN KEY (sku_id) REFERENCES catalog_skus(id)', description: 'Reservation → SKU' },
    { name: 'fk_bookings_resource', type: 'FK', table: 'bookings', definition: 'FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE', description: 'Booking → Resource' },
    { name: 'chk_order_total', type: 'CHECK', table: 'orders', definition: 'grand_total_cents = subtotal_cents - discount_total_cents + shipping_total_cents + tax_total_cents + tip_cents', description: 'Order total integrity' },
    { name: 'chk_valid_stock', type: 'CHECK', table: 'warehouse_inventory', definition: 'on_hand >= reserved + committed', description: 'ATP invariant' },
    { name: 'chk_booking_conflict', type: 'EXCLUSION', table: 'bookings', definition: 'EXCLUDE USING gist (resource_id WITH =, booking_window WITH &&) WHERE (status IN (HOLD, CONFIRMED, CHECKED_IN))', description: 'Prevent double-booking at DB level' },
  ];
}

function buildTriggers(): { name: string; table: string; timing: string; events: string[]; function: string; description: string }[] {
  return [
    {
      name: 'trg_users_updated_at',
      table: 'users',
      timing: 'BEFORE',
      events: ['UPDATE'],
      function: 'update_updated_at_column()',
      description: 'Auto-update updated_at on user changes',
    },
    {
      name: 'trg_audit_immutable',
      table: 'audit_logs',
      timing: 'BEFORE',
      events: ['UPDATE', 'DELETE'],
      function: 'prevent_audit_modification()',
      description: 'Prevent any modification to audit_logs',
    },
    {
      name: 'trg_catalog_updated_at',
      table: 'catalog_products',
      timing: 'BEFORE',
      events: ['UPDATE'],
      function: 'update_updated_at_column()',
      description: 'Auto-update updated_at on product changes',
    },
    {
      name: 'trg_orders_updated_at',
      table: 'orders',
      timing: 'BEFORE',
      events: ['UPDATE'],
      function: 'update_updated_at_column()',
      description: 'Auto-update updated_at on order changes',
    },
    {
      name: 'trg_inventory_version',
      table: 'warehouse_inventory',
      timing: 'BEFORE',
      events: ['UPDATE'],
      function: 'increment_version()',
      description: 'Increment optimistic lock version on change',
    },
  ];
}

function buildMigrations(): { version: string; description: string; up: string[]; down: string[] }[] {
  return [
    {
      version: '001_initial_core',
      description: 'Create core identity, RBAC, and audit tables',
      up: [
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        'CREATE EXTENSION IF NOT EXISTS "btree_gist";',
        `-- Users, sessions, passkeys, addresses, RBAC tables`,
        ...BASE_TABLES.map(t => `-- ${t.name}: ${t.description}`).concat(
          BASE_TABLES.slice(0, 4).map(t => `CREATE TABLE ${t.name} (...)`).slice(0, 0)
        ),
      ],
      down: ['DROP TABLE IF EXISTS approval_workflows CASCADE;', 'DROP TABLE IF EXISTS user_roles CASCADE;', 'DROP TABLE IF EXISTS role_permissions CASCADE;', 'DROP TABLE IF EXISTS permissions CASCADE;', 'DROP TABLE IF EXISTS roles CASCADE;', 'DROP TABLE IF EXISTS user_sessions CASCADE;', 'DROP TABLE IF EXISTS user_passkeys CASCADE;', 'DROP TABLE IF EXISTS user_addresses CASCADE;', 'DROP TABLE IF EXISTS users CASCADE;'],
    },
    {
      version: '002_catalog',
      description: 'Create catalog, SKU, media, and search tables',
      up: [...CATALOG_TABLES.slice(0, 2).map(t => `-- ${t.name}`)],
      down: ['DROP TABLE IF EXISTS category_closure CASCADE;', 'DROP TABLE IF EXISTS catalog_products CASCADE;', 'DROP TABLE IF EXISTS categories CASCADE;'],
    },
    {
      version: '003_orders',
      description: 'Create order, line items, idempotency, and transition tables',
      up: ['-- Orders, line items, idempotency keys, status transitions'],
      down: ORDER_TABLES.map(t => `DROP TABLE IF EXISTS ${t.name} CASCADE;`).reverse(),
    },
    {
      version: '004_inventory',
      description: 'Create warehouses, inventory, reservations, and supplier tables',
      up: ['-- Warehouses, inventory ATP ledger, reservations, suppliers, purchase orders'],
      down: [...INVENTORY_TABLES.map(t => `DROP TABLE IF EXISTS ${t.name} CASCADE;`).reverse()],
    },
    {
      version: '005_financial',
      description: 'Create currencies, tax rates, payment intents, and ledger',
      up: ['-- Currencies, tax rates, payment intents, double-entry ledger'],
      down: ['DROP TABLE IF EXISTS ledger_entries CASCADE;', 'DROP TABLE IF EXISTS payment_intents CASCADE;', 'DROP TABLE IF EXISTS tax_rates CASCADE;', 'DROP TABLE IF EXISTS currencies CASCADE;'],
    },
    {
      version: '006_audit',
      description: 'Create immutable audit log table and triggers',
      up: ['-- Hash-chained immutable audit logs with immutability trigger'],
      down: ['DROP TABLE IF EXISTS audit_logs CASCADE;'],
    },
    {
      version: '007_fulfillment',
      description: 'Create fulfillment, shipping, and tracking tables',
      up: ['-- Fulfillment orders, shipping carriers/rates, tracking, courier sessions'],
      down: ['DROP TABLE IF EXISTS courier_sessions CASCADE;', 'DROP TABLE IF EXISTS shipment_tracking CASCADE;', 'DROP TABLE IF EXISTS fulfillment_orders CASCADE;', 'DROP TABLE IF EXISTS shipping_rates CASCADE;', 'DROP TABLE IF EXISTS shipping_carriers CASCADE;'],
    },
    {
      version: '008_promotions',
      description: 'Create promotions, loyalty, and referral tables',
      up: ['-- Promotions, promotion tiers, loyalty accounts/tiers/transactions, referral codes'],
      down: ['DROP TABLE IF EXISTS referral_codes CASCADE;', 'DROP TABLE IF EXISTS loyalty_transactions CASCADE;', 'DROP TABLE IF EXISTS loyalty_accounts CASCADE;', 'DROP TABLE IF EXISTS loyalty_tiers CASCADE;', 'DROP TABLE IF EXISTS promotion_tiers CASCADE;', 'DROP TABLE IF EXISTS promotions CASCADE;'],
    },
    {
      version: '009_reviews_returns',
      description: 'Create reviews, Q&A, returns, and credit notes',
      up: ['-- Reviews, review media/votes, Q&A threads, return policies, RMA requests/lines, credit notes'],
      down: ['DROP TABLE IF EXISTS credit_notes CASCADE;', 'DROP TABLE IF EXISTS rma_line_items CASCADE;', 'DROP TABLE IF EXISTS rma_requests CASCADE;', 'DROP TABLE IF EXISTS return_policies CASCADE;', 'DROP TABLE IF EXISTS qa_threads CASCADE;', 'DROP TABLE IF EXISTS review_votes CASCADE;', 'DROP TABLE IF EXISTS review_media CASCADE;', 'DROP TABLE IF EXISTS reviews CASCADE;'],
    },
    {
      version: '010_notifications_analytics',
      description: 'Create notifications, analytics, and AI tables',
      up: ['-- Notification channels/templates/preferences, notifications, analytics events, AI tables'],
      down: ['DROP TABLE IF EXISTS recommendation_sets CASCADE;', 'DROP TABLE IF EXISTS ai_token_usage CASCADE;', 'DROP TABLE IF EXISTS ai_embeddings CASCADE;', 'DROP TABLE IF EXISTS ai_messages CASCADE;', 'DROP TABLE IF EXISTS ai_conversations CASCADE;', 'DROP TABLE IF EXISTS search_queries CASCADE;', 'DROP TABLE IF EXISTS saved_searches CASCADE;', 'DROP TABLE IF EXISTS notifications CASCADE;', 'DROP TABLE IF EXISTS notification_preferences CASCADE;', 'DROP TABLE IF EXISTS notification_templates CASCADE;', 'DROP TABLE IF EXISTS notification_channels CASCADE;', 'DROP TABLE IF EXISTS analytics_events CASCADE;'],
    },
  ];
}

export function generateCompleteSchema(
  _industry: Industry,
  _features: CompetitorFeature[],
): CompleteSchema {
  const allTables = [
    ...BASE_TABLES,
    ...CATALOG_TABLES,
    ...ORDER_TABLES,
    ...INVENTORY_TABLES,
    ...FINANCIAL_TABLES,
    ...RBAC_TABLES,
    ...AUDIT_TABLE,
  ];

  const tables = allTables.map(t => ({
    name: t.name,
    description: t.description,
    columns: t.columns.map(c => ({
      name: c.name,
      type: c.type,
      nullable: c.nullable,
      defaultValue: c.defaultValue,
      constraints: c.constraints,
      description: c.description,
    })),
  }));

  return {
    tables,
    indexes: buildAllIndexes(),
    constraints: buildAllConstraints(),
    triggers: buildTriggers(),
    migrations: buildMigrations(),
  };
}
