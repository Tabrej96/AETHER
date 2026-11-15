/**
 * AETHER Market-Parity Engine -- Complete REST API Specification Generator
 *
 * Generates OpenAPI 3.0-compatible endpoint specifications for any industry.
 * Every endpoint includes: auth requirements, rate limits, request/response schemas.
 */

import type { ApiEndpoint, Industry, CompetitorFeature } from './types';

function basePath(industry: Industry): string {
  const paths: Partial<Record<Industry, string>> = {
    'healthcare': '/api/v1/clinical',
    'ai-platform': '/api/v1/ai',
    'logistics': '/api/v1/logistics',
    'booking': '/api/v1/booking',
    'gaming': '/api/v1/gaming',
    'social': '/api/v1/social',
  };
  return paths[industry] || '/api/v1';
}

type SchemaValue = Record<string, string | number | boolean | string[] | null>;

function sv(obj: SchemaValue): SchemaValue { return obj; }

export function generateApiEndpoints(_industry: Industry, _features: CompetitorFeature[]): ApiEndpoint[] {
  const bp = '/api/v1';

  return [
    // --- Authentication & Identity (Pillar 1) -------------------------------
    {
      method: 'POST', path: `${bp}/auth/register`,
      description: 'Register new customer account',
      requestSchema: sv({ email: 'string', password: 'string', name: 'string', phone: 'string?' }),
      responseSchema: sv({ id: 'string', email: 'string', token: 'string', refresh_token: 'string' }),
      authRequired: false,
    },
    {
      method: 'POST', path: `${bp}/auth/login`,
      description: 'Authenticate with email/password',
      requestSchema: sv({ email: 'string', password: 'string', mfa_code: 'string?' }),
      responseSchema: sv({ id: 'string', token: 'string', refresh_token: 'string', expires_in: 'number' }),
      authRequired: false,
    },
    {
      method: 'POST', path: `${bp}/auth/oauth/{provider}`,
      description: 'OAuth2/OIDC social login (Google, Apple, etc.)',
      requestSchema: sv({ code: 'string', state: 'string' }),
      responseSchema: sv({ id: 'string', token: 'string', refresh_token: 'string', is_new: 'boolean' }),
      authRequired: false,
    },
    {
      method: 'POST', path: `${bp}/auth/passkey/register`,
      description: 'Register FIDO2/WebAuthn passkey',
      requestSchema: sv({ credential: 'PublicKeyCredential' }),
      responseSchema: sv({ credential_id: 'string', created_at: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/auth/passkey/assert`,
      description: 'FIDO2 passkey authentication assertion',
      requestSchema: sv({ credential: 'PublicKeyCredential' }),
      responseSchema: sv({ token: 'string', refresh_token: 'string' }),
      authRequired: false,
    },
    {
      method: 'POST', path: `${bp}/auth/refresh`,
      description: 'Refresh access token',
      requestSchema: sv({ refresh_token: 'string' }),
      responseSchema: sv({ token: 'string', refresh_token: 'string', expires_in: 'number' }),
      authRequired: false,
    },
    {
      method: 'POST', path: `${bp}/auth/logout`,
      description: 'Revoke refresh token and logout',
      requestSchema: sv({ refresh_token: 'string' }),
      responseSchema: sv({ success: 'boolean' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/auth/otp/send`,
      description: 'Send email/phone OTP for verification',
      requestSchema: sv({ channel: 'enum(email,sms)', destination: 'string' }),
      responseSchema: sv({ sent: 'boolean', expires_in: 'number', masked_destination: 'string' }),
      authRequired: false,
    },
    {
      method: 'POST', path: `${bp}/auth/otp/verify`,
      description: 'Verify OTP code',
      requestSchema: sv({ channel: 'enum(email,sms)', destination: 'string', code: 'string' }),
      responseSchema: sv({ verified: 'boolean' }),
      authRequired: false,
    },
    {
      method: 'GET', path: `${bp}/auth/sessions`,
      description: 'List active sessions with device info',
      requestSchema: sv({}),
      responseSchema: sv({ sessions: 'Session[]' }),
      authRequired: true,
    },
    {
      method: 'DELETE', path: `${bp}/auth/sessions/{session_id}`,
      description: 'Revoke a specific session',
      requestSchema: sv({}),
      responseSchema: sv({ success: 'boolean' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/auth/devices/register`,
      description: 'Register current device for push notifications',
      requestSchema: sv({ device_token: 'string', platform: 'enum(ios,android,web)', user_agent: 'string?' }),
      responseSchema: sv({ device_id: 'string' }),
      authRequired: true,
    },

    // --- Account Management (Pillar 1) ------------------------------------
    {
      method: 'GET', path: `${bp}/account/profile`,
      description: 'Get current user profile',
      requestSchema: sv({}),
      responseSchema: sv({ id: 'string', email: 'string', full_name: 'string', avatar_url: 'string | null', preferred_locale: 'string', preferred_currency: 'string', mfa_enabled: 'boolean', status: 'string' }),
      authRequired: true,
    },
    {
      method: 'PATCH', path: `${bp}/account/profile`,
      description: 'Update user profile',
      requestSchema: sv({ full_name: 'string?', avatar_url: 'string?', preferred_locale: 'string?', preferred_currency: 'string?' }),
      responseSchema: sv({ id: 'string', email: 'string', full_name: 'string', updated_at: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/account/addresses`,
      description: 'List saved addresses',
      requestSchema: sv({}),
      responseSchema: sv({ addresses: 'Address[]' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/account/addresses`,
      description: 'Add new address',
      requestSchema: sv({ label: 'string?', address_line1: 'string', address_line2: 'string?', city: 'string', state: 'string', postal_code: 'string', country: 'string', lat: 'number?', lng: 'number?', delivery_instructions: 'string?' }),
      responseSchema: sv({ id: 'string', label: 'string' }),
      authRequired: true,
    },
    {
      method: 'PATCH', path: `${bp}/account/addresses/{address_id}`,
      description: 'Update address',
      requestSchema: sv({ label: 'string?', address_line1: 'string?', city: 'string?', state: 'string?', postal_code: 'string?', lat: 'number?', lng: 'number?' }),
      responseSchema: sv({ id: 'string', label: 'string' }),
      authRequired: true,
    },
    {
      method: 'DELETE', path: `${bp}/account/addresses/{address_id}`,
      description: 'Delete address',
      requestSchema: sv({}),
      responseSchema: sv({ message: 'string' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/account/data-export`,
      description: 'GDPR/DPDP/CCPA data export (encrypted archive)',
      requestSchema: sv({}),
      responseSchema: sv({ export_id: 'uuid', download_url: 'string', expires_at: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/account/deactivate`,
      description: 'Soft-deactivate account (14-day grace period)',
      requestSchema: sv({ password: 'string', reason: 'string?' }),
      responseSchema: sv({ message: 'string', reactivate_until: 'timestamp' }),
      authRequired: true,
    },

    // --- Catalog & Categories (Pillar 4) -----------------------------------
    {
      method: 'GET', path: `${bp}/categories`,
      description: 'List category tree (closure-table DAG)',
      requestSchema: sv({}),
      responseSchema: sv({ categories: 'CategoryNode[]' }),
      authRequired: false,
    },
    {
      method: 'GET', path: `${bp}/categories/{slug}/products`,
      description: 'Products in category with pagination',
      requestSchema: sv({ page: 'number?', limit: 'number?', sort: 'string?' }),
      responseSchema: sv({ products: 'Product[]', total: 'number', page: 'number' }),
      authRequired: false,
    },
    {
      method: 'GET', path: `${bp}/products`,
      description: 'Full-text search with faceted filters',
      requestSchema: sv({ q: 'string?', filters: 'json?', page: 'number?', limit: 'number?', sort: 'string?' }),
      responseSchema: sv({ products: 'Product[]', facets: 'FacetResult[]', total: 'number' }),
      authRequired: false,
    },
    {
      method: 'GET', path: `${bp}/products/{slug_or_id}`,
      description: 'Product detail with variants, reviews, Q&A',
      requestSchema: sv({}),
      responseSchema: sv({ product: 'ProductDetail', variants: 'Variant[]', reviews_summary: 'ReviewSummary', qa: 'QAItem[]', related: 'Product[]' }),
      authRequired: false,
    },
    {
      method: 'GET', path: `${bp}/products/{id}/compare`,
      description: 'Side-by-side comparison with other products',
      requestSchema: sv({ compare_with: 'string[]' }),
      responseSchema: sv({ products: 'Product[]', diff: 'ComparisonDiff' }),
      authRequired: false,
    },

    // --- Shopping Cart (Pillar 5) ------------------------------------------
    {
      method: 'GET', path: `${bp}/cart`,
      description: 'Get current cart (merged guest+auth)',
      requestSchema: sv({}),
      responseSchema: sv({ id: 'string', items: 'CartItem[]', subtotal_cents: 'number', tax_cents: 'number', discount_cents: 'number', grand_total_cents: 'number', available_promotions: 'Promotion[]' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/cart/items`,
      description: 'Add item to cart with variant selection',
      requestSchema: sv({ sku_id: 'string', quantity: 'number', idempotency_key: 'string' }),
      responseSchema: sv({ id: 'string', cart: 'Cart' }),
      authRequired: true,
    },
    {
      method: 'PATCH', path: `${bp}/cart/items/{item_id}`,
      description: 'Update cart item quantity',
      requestSchema: sv({ quantity: 'number' }),
      responseSchema: sv({ id: 'string', cart: 'Cart' }),
      authRequired: true,
    },
    {
      method: 'DELETE', path: `${bp}/cart/items/{item_id}`,
      description: 'Remove item from cart',
      requestSchema: sv({}),
      responseSchema: sv({ id: 'string', cart: 'Cart' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/cart/merge`,
      description: 'Merge guest cart into authenticated cart on login',
      requestSchema: sv({ guest_cart_id: 'string' }),
      responseSchema: sv({ id: 'string', merged: 'boolean', items_added: 'number' }),
      authRequired: true,
    },

    // --- Wishlist & Saved Items (Pillar 5) ---------------------------------
    {
      method: 'GET', path: `${bp}/wishlists`,
      description: 'List user wishlists',
      requestSchema: sv({}),
      responseSchema: sv({ wishlists: 'Wishlist[]' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/wishlists`,
      description: 'Create wishlist',
      requestSchema: sv({ name: 'string', visibility: 'enum(private,shared,public)' }),
      responseSchema: sv({ id: 'string', name: 'string', visibility: 'string' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/wishlists/{id}/items`,
      description: 'Add product to wishlist',
      requestSchema: sv({ product_id: 'string', sku_id: 'string?', note: 'string?' }),
      responseSchema: sv({ id: 'string' }),
      authRequired: true,
    },

    // --- Checkout & Orders (Pillar 7) --------------------------------------
    {
      method: 'POST', path: `${bp}/checkout/initiate`,
      description: 'Create order draft with idempotency guarantee',
      requestSchema: sv({ address_id: 'string', shipping_method_id: 'string', idempotency_key: 'string' }),
      responseSchema: sv({ order_id: 'string', status: 'string', total_cents: 'number', expires_at: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/checkout/{order_id}/payment`,
      description: 'Initiate payment via selected gateway',
      requestSchema: sv({ payment_method_id: 'string', gateway: 'string', save_payment: 'boolean' }),
      responseSchema: sv({ payment_intent_id: 'string', status: 'string', next_action: 'string' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/checkout/{order_id}/confirm`,
      description: 'Confirm order after successful payment',
      requestSchema: sv({ idempotency_key: 'string' }),
      responseSchema: sv({ order_id: 'string', status: 'string', order_number: 'string', estimated_delivery: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/orders`,
      description: 'List user orders with status filters',
      requestSchema: sv({ status: 'string?', page: 'number?', limit: 'number?' }),
      responseSchema: sv({ orders: 'Order[]', total: 'number' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/orders/{order_id}`,
      description: 'Order detail with line items and timeline',
      requestSchema: sv({}),
      responseSchema: sv({ order: 'OrderDetail', timeline: 'OrderEvent[]', shipment: 'ShipmentDetail' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/orders/{order_id}/cancel`,
      description: 'Cancel order (checks cancellation policy)',
      requestSchema: sv({ reason: 'string' }),
      responseSchema: sv({ order_id: 'string', status: 'string', refund_amount_cents: 'number' }),
      authRequired: true,
    },

    // --- Promotions & Loyalty (Pillar 8) -----------------------------------
    {
      method: 'POST', path: `${bp}/cart/promotions/apply`,
      description: 'Apply promotion code to cart',
      requestSchema: sv({ code: 'string' }),
      responseSchema: sv({ applied: 'boolean', promotion: 'Promotion', new_total_cents: 'number' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/loyalty/balance`,
      description: 'Get loyalty points balance and tier',
      requestSchema: sv({}),
      responseSchema: sv({ points_balance: 'number', tier: 'string', points_to_next_tier: 'number', expiring_soon: 'number' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/loyalty/redeem`,
      description: 'Redeem loyalty points for discount',
      requestSchema: sv({ points: 'number' }),
      responseSchema: sv({ discount_cents: 'number', remaining_balance: 'number' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/loyalty/history`,
      description: 'Loyalty points transaction history',
      requestSchema: sv({ page: 'number?', limit: 'number?' }),
      responseSchema: sv({ transactions: 'LoyaltyTransaction[]', total: 'number' }),
      authRequired: true,
    },

    // --- Reviews & Ratings (Pillar 8) --------------------------------------
    {
      method: 'GET', path: `${bp}/products/{product_id}/reviews`,
      description: 'Product reviews with filters and sorting',
      requestSchema: sv({ page: 'number?', limit: 'number?', sort: 'enum(helpful,recent,rating)?', filter_rating: 'number?', has_media: 'boolean?' }),
      responseSchema: sv({ reviews: 'Review[]', summary: 'ReviewSummary', total: 'number' }),
      authRequired: false,
    },
    {
      method: 'POST', path: `${bp}/products/{product_id}/reviews`,
      description: 'Submit verified purchase review',
      requestSchema: sv({ rating: 'number', title: 'string', body: 'string', media_urls: 'string[]?', sku_id: 'string?' }),
      responseSchema: sv({ id: 'string', status: 'string' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/reviews/{review_id}/helpful`,
      description: 'Mark review as helpful',
      requestSchema: sv({}),
      responseSchema: sv({ helpful_count: 'number' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/products/{product_id}/qa`,
      description: 'Ask a question about the product',
      requestSchema: sv({ question: 'string' }),
      responseSchema: sv({ id: 'string', question: 'string', status: 'string' }),
      authRequired: true,
    },

    // --- Inventory & ATP (Pillar 9) ----------------------------------------
    {
      method: 'GET', path: `${bp}/products/{id}/inventory`,
      description: 'ATP (Available-to-Promise) for all variants',
      requestSchema: sv({}),
      responseSchema: sv({ skus: 'ATPDetail[]', last_computed: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/inventory/reserve`,
      description: 'Reserve inventory for cart (TTL-bound)',
      requestSchema: sv({ sku_id: 'string', quantity: 'number', cart_id: 'string', ttl_seconds: 'number?' }),
      responseSchema: sv({ reservation_id: 'string', expires_at: 'timestamp', atp_cents: 'number' }),
      authRequired: true,
    },
    {
      method: 'DELETE', path: `${bp}/inventory/reserve/{reservation_id}`,
      description: 'Release inventory reservation',
      requestSchema: sv({}),
      responseSchema: sv({ released: 'boolean' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/inventory/bom/deplete`,
      description: 'Deplete Bill-of-Materials for bundle/kit',
      requestSchema: sv({ bundle_sku_id: 'string', quantity: 'number', order_id: 'string' }),
      responseSchema: sv({ depletions: 'BOMDepletion[]' }),
      authRequired: true,
    },

    // --- Shipping & Tracking (Pillar 10) -----------------------------------
    {
      method: 'POST', path: `${bp}/shipping/rates`,
      description: 'Multi-carrier rate shopping',
      requestSchema: sv({ items: 'CartItem[]', destination: 'Address', service_type: 'enum(standard,express,same_day)?' }),
      responseSchema: sv({ rates: 'ShippingRate[]', recommended: 'ShippingRate' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/shipping/label`,
      description: 'Generate shipping label (ZPL/PDF)',
      requestSchema: sv({ order_id: 'string', carrier: 'string', service_code: 'string' }),
      responseSchema: sv({ label_url: 'string', tracking_number: 'string', format: 'string' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/orders/{order_id}/tracking`,
      description: 'Real-time courier tracking with WebSocket fallback',
      requestSchema: sv({}),
      responseSchema: sv({ tracking: 'ShipmentDetail', events: 'TrackingEvent[]' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/tracking/{tracking_number}`,
      description: 'Guest order tracking (no auth required)',
      requestSchema: sv({ email: 'string', postal_code: 'string' }),
      responseSchema: sv({ tracking: 'ShipmentDetail' }),
      authRequired: false,
    },

    // --- Returns & RMA (Pillar 11) -----------------------------------------
    {
      method: 'POST', path: `${bp}/returns/initiate`,
      description: 'Initiate return/RMA with policy validation',
      requestSchema: sv({ order_id: 'string', items: 'ReturnItemRequest[]', return_method: 'enum(refund,exchange,store_credit)' }),
      responseSchema: sv({ rma_id: 'string', status: 'string', return_label_url: 'string', estimated_refund_cents: 'number' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/returns/{rma_id}/dropoff`,
      description: 'Scan return at carrier dropoff (triggers refund)',
      requestSchema: sv({ tracking_number: 'string', carrier: 'string', condition_photos: 'string[]?' }),
      responseSchema: sv({ rma_id: 'string', status: 'string', refund_cents: 'number' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/returns`,
      description: 'List user returns',
      requestSchema: sv({ status: 'string?', page: 'number?', limit: 'number?' }),
      responseSchema: sv({ returns: 'RMA[]', total: 'number' }),
      authRequired: true,
    },

    // --- Notifications (Pillar 12) -----------------------------------------
    {
      method: 'GET', path: `${bp}/notifications`,
      description: 'Get notification center feed',
      requestSchema: sv({}),
      responseSchema: sv({ notifications: 'Notification[]', unread_count: 'number' }),
      authRequired: true,
    },
    {
      method: 'PATCH', path: `${bp}/notifications/{id}/read`,
      description: 'Mark notification as read',
      requestSchema: sv({}),
      responseSchema: sv({ success: 'boolean' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/notifications/preferences`,
      description: 'Update notification channel preferences',
      requestSchema: sv({ email: 'boolean', sms: 'boolean', push: 'boolean', whatsapp: 'boolean', quiet_hours_start: 'string?', quiet_hours_end: 'string?' }),
      responseSchema: sv({ preferences: 'NotificationPreference' }),
      authRequired: true,
    },

    // --- Customer Support (Pillar 2) ---------------------------------------
    {
      method: 'GET', path: `${bp}/support/tickets`,
      description: 'Customer support ticket listing',
      requestSchema: sv({ status: 'string?', priority: 'string?', page: 'number?', limit: 'number?' }),
      responseSchema: sv({ tickets: 'SupportTicket[]', total: 'number' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/support/tickets`,
      description: 'Create support ticket',
      requestSchema: sv({ subject: 'string', body: 'string', category: 'string', order_id: 'string?', attachments: 'string[]?' }),
      responseSchema: sv({ ticket_id: 'string', status: 'string', created_at: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/support/tickets/{ticket_id}/reply`,
      description: 'Add reply to support ticket',
      requestSchema: sv({ body: 'string', internal: 'boolean', attachments: 'string[]?' }),
      responseSchema: sv({ id: 'string', body: 'string', created_at: 'timestamp' }),
      authRequired: true,
    },

    // --- Merchant / Vendor Portal (Pillar 2) -------------------------------
    {
      method: 'GET', path: `${bp}/merchant/orders`,
      description: 'Merchant order listing with status filters',
      requestSchema: sv({ status: 'string?', date_from: 'string?', date_to: 'string?', page: 'number?', limit: 'number?' }),
      responseSchema: sv({ orders: 'MerchantOrder[]', total: 'number' }),
      authRequired: true,
    },
    {
      method: 'PATCH', path: `${bp}/merchant/orders/{order_id}/status`,
      description: 'Update order status (FSM transition)',
      requestSchema: sv({ to_status: 'string', notes: 'string?' }),
      responseSchema: sv({ id: 'string', status: 'string', transition: 'TransitionDetail' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/merchant/catalog`,
      description: 'Merchant product catalog management',
      requestSchema: sv({}),
      responseSchema: sv({ products: 'ProductSummary[]', total: 'number' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/merchant/catalog/bulk-import`,
      description: 'Bulk CSV import of products and SKUs',
      requestSchema: sv({ csv_url: 'string', update_existing: 'boolean' }),
      responseSchema: sv({ import_id: 'string', status: 'string', total_rows: 'number' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/merchant/payouts`,
      description: 'Merchant payout history and settlement reports',
      requestSchema: sv({}),
      responseSchema: sv({ payouts: 'Payout[]', available_balance_cents: 'number' }),
      authRequired: true,
    },

    // --- Subscription Billing (Pillar 8) -----------------------------------
    {
      method: 'GET', path: `${bp}/subscriptions`,
      description: 'List user subscriptions',
      requestSchema: sv({}),
      responseSchema: sv({ subscriptions: 'Subscription[]' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/subscriptions`,
      description: 'Create subscription for plan',
      requestSchema: sv({ plan_id: 'string', payment_method_id: 'string' }),
      responseSchema: sv({ subscription_id: 'string', status: 'string', current_period_end: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/subscriptions/{id}/cancel`,
      description: 'Cancel subscription (FTC click-to-cancel)',
      requestSchema: sv({ reason: 'string?', feedback: 'string?' }),
      responseSchema: sv({ subscription_id: 'string', cancel_at_period_end: 'boolean', access_until: 'timestamp' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/subscription/plans`,
      description: 'List available subscription plans',
      requestSchema: sv({}),
      responseSchema: sv({ plans: 'SubscriptionPlan[]' }),
      authRequired: false,
    },

    // --- Analytics (Pillar 13) ---------------------------------------------
    {
      method: 'GET', path: `${bp}/analytics/dashboard`,
      description: 'Executive dashboard: GMV, AOV, conversion funnel',
      requestSchema: sv({}),
      responseSchema: sv({ gmv: 'number', net_revenue: 'number', aov: 'number', orders_count: 'number', conversion_rate: 'number', period: 'string' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/analytics/cohort`,
      description: 'Cohort retention heatmap data',
      requestSchema: sv({}),
      responseSchema: sv({ cohorts: 'CohortData[]' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/analytics/sku-velocity`,
      description: 'SKU-level sell-through velocity report',
      requestSchema: sv({}),
      responseSchema: sv({ items: 'SKUVelocity[]' }),
      authRequired: true,
    },

    // --- Audit & Compliance (Pillar 14) ------------------------------------
    {
      method: 'GET', path: `${bp}/audit/logs`,
      description: 'Query immutable audit logs (SOC 2, ISO 27001)',
      requestSchema: sv({ entity_type: 'string?', entity_id: 'string?', actor_id: 'string?', from: 'string?', to: 'string?', page: 'number?', limit: 'number?' }),
      responseSchema: sv({ logs: 'AuditLog[]', total: 'number' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/audit/verify-chain`,
      description: 'Verify integrity of hash chain across audit log range',
      requestSchema: sv({ from_id: 'string?', to_id: 'string?' }),
      responseSchema: sv({ valid: 'boolean', chain_length: 'number', first_hash: 'string', last_hash: 'string' }),
      authRequired: true,
    },

    // --- Webhook Management -----------------------------------------------
    {
      method: 'GET', path: `${bp}/webhooks/endpoints`,
      description: 'List configured webhook endpoints',
      requestSchema: sv({}),
      responseSchema: sv({ endpoints: 'WebhookEndpoint[]' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/webhooks/endpoints`,
      description: 'Register new webhook endpoint',
      requestSchema: sv({ url: 'string', events: 'string[]', secret: 'string' }),
      responseSchema: sv({ id: 'string', url: 'string', events: 'string[]' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/webhooks/deliveries/{endpoint_id}`,
      description: 'Get webhook delivery history with retry status',
      requestSchema: sv({}),
      responseSchema: sv({ deliveries: 'WebhookDelivery[]' }),
      authRequired: true,
    },

    // --- Finance (Pillar 6) ------------------------------------------------
    {
      method: 'GET', path: `${bp}/payments/methods`,
      description: 'List saved payment methods',
      requestSchema: sv({}),
      responseSchema: sv({ methods: 'PaymentMethod[]' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/payments/methods`,
      description: 'Add payment method',
      requestSchema: sv({ gateway: 'string', payment_method_token: 'string', set_default: 'boolean' }),
      responseSchema: sv({ id: 'string', brand: 'string', last4: 'string' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/payments/intent`,
      description: 'Create payment intent for checkout',
      requestSchema: sv({ order_id: 'string', amount_cents: 'number', currency: 'string', gateway: 'string', capture_method: 'enum(automatic,manual)?' }),
      responseSchema: sv({ intent_id: 'string', status: 'string', client_secret: 'string', next_action: 'json?' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/payments/transactions`,
      description: 'Payment transaction history',
      requestSchema: sv({ page: 'number?', limit: 'number?', status: 'string?' }),
      responseSchema: sv({ transactions: 'PaymentTransaction[]', total: 'number' }),
      authRequired: true,
    },
    {
      method: 'GET', path: `${bp}/payments/invoices`,
      description: 'List invoices',
      requestSchema: sv({}),
      responseSchema: sv({ invoices: 'Invoice[]', total: 'number' }),
      authRequired: true,
    },
    {
      method: 'POST', path: `${bp}/payments/refund`,
      description: 'Issue refund with maker-checker approval',
      requestSchema: sv({ payment_intent_id: 'string', amount_cents: 'number', reason: 'string' }),
      responseSchema: sv({ refund_id: 'string', status: 'string' }),
      authRequired: true,
    },

    // --- Healthcare-Specific (Pillar 3) -------------------------------------
    ...(_industry === 'healthcare' ? [
      {
        method: 'GET', path: `${bp}/clinical/appointments`,
        description: 'Available appointment slots with visit-type durations',
        requestSchema: sv({ provider_id: 'string?', specialty: 'string?', date_from: 'string?', date_to: 'string?', visit_type: 'string?' }),
        responseSchema: sv({ slots: 'AppointmentSlot[]' }),
        authRequired: false,
      },
      {
        method: 'POST', path: `${bp}/clinical/appointments`,
        description: 'Book appointment with insurance verification',
        requestSchema: sv({ provider_id: 'string', slot_id: 'string', visit_type: 'string', insurance_card_image: 'string?' }),
        responseSchema: sv({ appointment_id: 'string', status: 'string', copay_estimate_cents: 'number', confirmation_code: 'string' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/clinical/telemedicine/join`,
        description: 'Join telemedicine video consultation',
        requestSchema: sv({ appointment_id: 'string' }),
        responseSchema: sv({ session_url: 'string', waiting_room_position: 'number', estimated_wait_seconds: 'number' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/clinical/soap-notes`,
        description: 'Save SOAP clinical note',
        requestSchema: sv({ appointment_id: 'string', subjective: 'string', objective: 'string', assessment: 'string', plan: 'string', icd10_codes: 'string[]', cpt_codes: 'string[]' }),
        responseSchema: sv({ note_id: 'string', created_at: 'timestamp' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/clinical/prescriptions`,
        description: 'Issue e-prescription with drug-interaction check',
        requestSchema: sv({ patient_id: 'string', medications: 'MedicationRequest[]' }),
        responseSchema: sv({ prescription_id: 'string', status: 'string', interactions: 'DrugInteraction[]' }),
        authRequired: true,
      },
      {
        method: 'GET', path: `${bp}/clinical/records/{patient_id}`,
        description: 'Longitudinal health record with FHIR R4',
        requestSchema: sv({}),
        responseSchema: sv({ patient: 'FHIRPatient', observations: 'FHIRObservation[]', medications: 'FHIRMedication[]', immunizations: 'FHIRImmunization[]' }),
        authRequired: true,
      },
    ] : []),

    // --- AI Platform-Specific (Pillar 17) -----------------------------------
    ...(_industry === 'ai-platform' ? [
      {
        method: 'POST', path: `${bp}/ai/completions`,
        description: 'LLM streaming completion with model fallback',
        requestSchema: sv({ model: 'string', messages: 'Message[]', temperature: 'number?', max_tokens: 'number?', tools: 'ToolDef[]?', stream: 'boolean' }),
        responseSchema: sv({ id: 'string', choices: 'CompletionChoice[]', usage: 'TokenUsage', model: 'string' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/ai/embeddings`,
        description: 'Generate text embeddings',
        requestSchema: sv({ model: 'string', input: 'string | string[]' }),
        responseSchema: sv({ model: 'string', data: 'Embedding[]', usage: 'TokenUsage' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/ai/fine-tunes`,
        description: 'Create fine-tuning job (SFT/DPO)',
        requestSchema: sv({ model: 'string', training_file_id: 'string', method: 'enum(SFT,DPO,RLHF)', hyperparameters: 'json?' }),
        responseSchema: sv({ id: 'string', model: 'string', status: 'string', fine_tuned_model: 'string | null', trained_tokens: 'number | null' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/ai/evals`,
        description: 'Run evaluation suite against fine-tuned model',
        requestSchema: sv({ model: 'string', eval_suite_id: 'string', dataset_id: 'string?' }),
        responseSchema: sv({ id: 'string', status: 'string', results: 'EvalResult[]' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/ai/assistants`,
        description: 'Create AI assistant with tool definitions',
        requestSchema: sv({ name: 'string', instructions: 'string', tools: 'ToolDef[]', model: 'string' }),
        responseSchema: sv({ id: 'string', name: 'string', model: 'string', tools: 'ToolDef[]', created_at: 'string' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/ai/assistants/{id}/threads`,
        description: 'Create conversation thread for assistant',
        requestSchema: sv({ initial_message: 'string?', metadata: 'json?' }),
        responseSchema: sv({ id: 'string', assistant_id: 'string', created_at: 'string' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/ai/assistants/{id}/threads/{thread_id}/messages`,
        description: 'Send message to assistant thread with streaming',
        requestSchema: sv({ content: 'string', attachments: 'string[]?' }),
        responseSchema: sv({ id: 'string', role: 'string', content: 'string', run_id: 'string' }),
        authRequired: true,
      },
      {
        method: 'POST', path: `${bp}/ai/chat/{conversation_id}/tools/confirm`,
        description: 'Confirm human-in-the-loop tool execution',
        requestSchema: sv({ tool_call_id: 'string', approved: 'boolean', edited_params: 'json?' }),
        responseSchema: sv({ result: 'json' }),
        authRequired: true,
      },
      {
        method: 'GET', path: `${bp}/ai/usage`,
        description: 'Token usage and cost analytics per tenant/user',
        requestSchema: sv({ period: 'string?', model: 'string?' }),
        responseSchema: sv({ total_tokens: 'number', total_cost_nano_cents: 'number', by_model: 'UsageByModel[]', by_day: 'UsageByDay[]' }),
        authRequired: true,
      },
    ] : []),
  ];
}

// Helper types for documentation purposes
export interface ReturnItemRequest {
  sku_id: string;
  quantity: number;
  reason: string;
}
