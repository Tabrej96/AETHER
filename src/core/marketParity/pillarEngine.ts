export enum Pillar {
  AuthAndIdentity = 1,
  StaffVendorPortals = 2,
  BackendDatabase = 3,
  ApiGovernance = 4,
  FrontendArchitecture = 5,
  CategoriesDiscovery = 6,
  MonetaryTaxPayment = 7,
  SubscriptionBilling = 8,
  OrderStateMachines = 9,
  ReorderTracking = 10,
  InventoryManagement = 11,
  ShippingFulfillment = 12,
  RefundsReturns = 13,
  PromotionsLoyalty = 14,
  AnalyticsNotifications = 15,
  AuditCompliance = 16,
  AICapabilities = 17,
  VerificationSuites = 18,
  I18nAccessibility = 19,
}

export const PILLAR_NAMES: Record<Pillar, string> = {
  [Pillar.AuthAndIdentity]: 'Real Customer Authentication, Identity Lifecycle & Account Architecture',
  [Pillar.StaffVendorPortals]: 'Staff, Vendor & Administrator Portals with Granular RBAC & ABAC',
  [Pillar.BackendDatabase]: 'Complete Backend & Database Architecture',
  [Pillar.ApiGovernance]: 'Future-Proof Development, API Governance & Defense-in-Depth Security',
  [Pillar.FrontendArchitecture]: 'Frontend Architecture, Motion Design, Product Storytelling & Rich Detail Systems',
  [Pillar.CategoriesDiscovery]: 'Categories, Taxonomies, Discovery, Faceted Filtering, Wishlists & Verified Reviews',
  [Pillar.MonetaryTaxPayment]: 'Integer-Cent Monetary Architecture, Multi-Currency, Tax Engines & Payment Orchestration',
  [Pillar.SubscriptionBilling]: 'Subscription Lifecycle, Recurring Billing & Compliant Cancellation Engine',
  [Pillar.OrderStateMachines]: 'Explicit Order State Machines, Idempotent Server-Side Creation & Transaction-Safe Checkout',
  [Pillar.ReorderTracking]: 'Reorder, Real-Time Order Tracking, Status Portals, Booking & Appointment Engines',
  [Pillar.InventoryManagement]: 'Multi-Warehouse Inventory Management, Variant ATP, Reservation TTLs & Supplier Procurement',
  [Pillar.ShippingFulfillment]: 'Shipping, Fulfillment, Split-Order Routing & Last-Mile Logistics',
  [Pillar.RefundsReturns]: 'Refunds, Returns (RMA), Exchanges & Programmable Policy Enforcement',
  [Pillar.PromotionsLoyalty]: 'Promotions, Coupon Rule Engine, Tiered Loyalty & Customer Retention',
  [Pillar.AnalyticsNotifications]: 'Real-Time Analytics, BI Dashboards & Multi-Channel Automated Notifications',
  [Pillar.AuditCompliance]: 'Cryptographically Verifiable Audit History & Compliance Logging',
  [Pillar.AICapabilities]: 'Native AI Capabilities, RAG Copilots, Semantic Search & Guardrailed Agentic Workflows',
  [Pillar.VerificationSuites]: 'Real Integration, Contract, Chaos & End-to-End (E2E) Verification Suites',
  [Pillar.I18nAccessibility]: 'Internationalization (i18n), Accessibility (a11y), SEO & Edge Performance',
};

export const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  [Pillar.AuthAndIdentity]:
    'Production customer identity systems balancing zero-friction onboarding with defense-in-depth security: passkeys (FIDO2/WebAuthn), OAuth2/OIDC federation, email/phone OTP, adaptive MFA, dual-token rotation with refresh token family reuse detection, active device management portal, and complete customer account self-service including anonymous-to-authenticated cart merge.',
  [Pillar.StaffVendorPortals]:
    'Dedicated operational portals with hierarchical RBAC/ABAC: Super-Admin console, Merchant/Vendor portal, Fulfillment/KDS operations portal, Customer Support workbench. Resource-Action-Scope permission matrix, maker-checker (four-eyes) approval workflows, and break-glass audited impersonation.',
  [Pillar.BackendDatabase]:
    'Disciplined relational and event-driven backend architecture: PostgreSQL 16+ with strict 3NF modeling and JSONB for polymorphic attributes, Row-Level Security (RLS) for multi-tenancy, transactional outbox pattern, read replicas, Redis caching, and CDC to search index (Elasticsearch/OpenSearch/Typesense) and vector store (pgvector).',
  [Pillar.ApiGovernance]:
    'Strict schema validation with contract-first APIs (Zod/TypeBox/Pydantic), token-bucket and sliding-window rate limiting, webhook HMAC-SHA256 signature verification, zero-trust secrets with field-level envelope encryption (AES-256-GCM + KMS), and mandatory security headers (HSTS, CSP, CORS allowlists).',
  [Pillar.FrontendArchitecture]:
    'Bespoke high-craft UIs: three-tier semantic design tokens, spring-physics micro-interactions, shared-element transitions, zero CLS with explicit aspect-ratio containers and BlurHash/LQIP, multi-angle/3D product inspection, dynamic variant matrices, comparison drawers, and provenance storytelling.',
  [Pillar.CategoriesDiscovery]:
    'Discovery engines scaling from boutique collections to multi-million SKU catalogs: DAG/closure-table category trees, typo-tolerant hybrid search (BM25 + dense vector), disjunctive/conjunctive faceted filtering with live counts, multi-list wishlists/registries, verified purchase review badges, multi-dimensional sub-ratings, and community Q&A.',
  [Pillar.MonetaryTaxPayment]:
    'Strict integer-cent (minor unit) arithmetic with BIGINT storage, zero-decimal/three-decimal currency awareness, largest-remainder penny allocation, jurisdiction-aware tax engines (GST/VAT/Nexus), tax-inclusive/exclusive calculation, multi-gateway payment orchestration with state machine, and double-entry immutable financial ledger.',
  [Pillar.SubscriptionBilling]:
    'Complete subscription state engine: flexible billing cadences (weekly/annual/seat-based/metered), mid-cycle exact proration, smart dunning with automated retry schedules, FTC click-to-cancel compliance with skip/swap/pause controls, and retention flows with exit-survey telemetry.',
  [Pillar.OrderStateMachines]:
    'Database-enforced FSM for orders: DRAFT -> PENDING_PAYMENT -> AUTHORIZED -> CONFIRMED -> ALLOCATED -> PICKING -> PACKED -> SHIPPED -> DELIVERED -> COMPLETED with exception branches. Mandatory Idempotency-Key protocol, 100% server-side price re-computation, and SERIALIZABLE transaction isolation with deterministic lock ordering.',
  [Pillar.ReorderTracking]:
    'One-click reorder with smart substitution, real-time geospatial courier tracking via WebSockets/SSE, authenticated/guest status lookup with tokenized magic links, and conflict-free time-slot booking using PostgreSQL TSTZRANGE exclusion constraints with buffer times and no-show protection.',
  [Pillar.InventoryManagement]:
    'Variant-level ATP (Available-to-Promise) ledger with four-bucket counters (on_hand, reserved, committed, damaged_quarantined), TTL-bound cart reservations, automatic sweeper release, Bill of Materials depletion, vendor master with lead-time tracking, reorder point automation, and 3-way purchase order matching.',
  [Pillar.ShippingFulfillment]:
    'Multi-node order routing (Haversine distance, stock completeness, SLA), dimensional weight calculation, live multi-carrier rate shopping, pick-pack-ship with wave picking, barcode scan verification, ZPL/PDF label generation, and carrier webhook ingestion for status tracking.',
  [Pillar.RefundsReturns]:
    'Programmable policy rule engine with return window days, time-decay cancellation fees, condition requirements. Self-service RMA/exchange portal with instant size exchange, store credit, or original payment method refund. Automated credit note generation with tax and loyalty point reversal.',
  [Pillar.PromotionsLoyalty]:
    'Combinatorial promotion engine (percentage/fixed/BOGO/volume-break/free-shipping/bank-discount) with stacking precedence matrix. Points-and-tiers loyalty ledger with rolling qualification, referral anti-fraud checks, and gift loop workflows.',
  [Pillar.AnalyticsNotifications]:
    'Executive BI dashboards (GMV, NRR, AOV, CAC/LTV, cohort retention). Event-driven omnichannel notification engine (email/SMS/WhatsApp/push/in-app) with locale-aware templates, channel preferences, quiet-hours, and delivery receipt tracking.',
  [Pillar.AuditCompliance]:
    'Append-only hash-chained audit ledger with SHA-256 chaining, actor classification (USER/ADMIN/SYSTEM/API_KEY/AI_AGENT), database-level immutability triggers, and compliance coverage for SOC 2 Type II, ISO 27001, HIPAA, PCI-DSS.',
  [Pillar.AICapabilities]:
    'Domain-grounded RAG copilot with inline citations (hybrid BM25 + vector + cross-encoder), tool-calling action agents with HITL confirmation gates, prompt-injection classification, PII redaction before external model calls, structured JSON Schema output enforcement, semantic caching, model fallback routing, and per-tenant token budget metering.',
  [Pillar.VerificationSuites]:
    'Zero-mock database integration tests (Testcontainers), concurrency/race-condition torture tests (50+ parallel checkout attempts), Playwright full-browser E2E journeys covering complete user lifecycle, and automated axe-core WCAG 2.2 accessibility assertions.',
  [Pillar.I18nAccessibility]:
    'Full ICU MessageFormat localization with pluralization/gender rules, RTL support via logical CSS properties, WCAG 2.2 AA/AAA keyboard navigation with roving tabindex, ARIA live regions, SSR/ISR for technical SEO, JSON-LD structured data, and strict Core Web Vitals budgets (LCP < 1.8s, INP < 100ms, CLS = 0.00).',
};

export const PILLAR_REQUIREMENTS: Record<Pillar, string[]> = {
  [Pillar.AuthAndIdentity]: [
    'Multi-modal authentication: passkeys (FIDO2/WebAuthn), OAuth2/OIDC, email/phone OTP',
    'Dual-token rotation architecture with refresh token family reuse detection',
    'Active device & session management portal with GeoIP and one-click revocation',
    'Anonymous-to-authenticated cart and state merge algorithm',
    'Multi-address book with geospatial pinning',
    'GDPR/DPDP/CCPA data export and account lifecycle (14-day grace, cryptographic PII anonymization)',
  ],
  [Pillar.StaffVendorPortals]: [
    'Super-Admin governance console with feature flags and fee schedules',
    'Merchant/Vendor portal with bulk catalog import/export and payout reports',
    'Fulfillment/KDS portal with barcode scanning and label generation',
    'Customer Support workbench with RMA controls and secure impersonation',
    'Hierarchical RBAC + ABAC with Resource-Action-Scope permissions',
    'Maker-checker (four-eyes) approval workflows for high-risk mutations',
  ],
  [Pillar.BackendDatabase]: [
    'PostgreSQL 16+ with 3NF modeling and indexed JSONB columns',
    'Row-Level Security (RLS) policies enforcing tenant isolation',
    'Transactional outbox pattern for domain events',
    'Read replicas with write-through/cache-aside Redis caching',
    'Change Data Capture to Elasticsearch/Typesense and pgvector',
    'Database migration system (e.g., Prisma, Drizzle, or raw SQL migrations)',
  ],
  [Pillar.ApiGovernance]: [
    'Strict runtime schema validation with Zod/TypeBox/Pydantic (additionalProperties: false)',
    'Multi-tier token-bucket/sliding-window rate limiting with Retry-After headers',
    'Webhook HMAC-SHA256 signature verification with timestamp tolerance',
    'Field-level envelope encryption (AES-256-GCM) with KMS-wrapped DEKs',
    'Mandatory security headers: HSTS, nonce-based CSP, Permissions-Policy',
    'CORS allowlist with strict origin validation',
  ],
  [Pillar.FrontendArchitecture]: [
    'Three-tier semantic design tokens with WCAG 2.2 AA/AAA contrast compliance',
    'Spring-physics micro-interactions with prefers-reduced-motion respect',
    'Zero CLS with explicit aspect-ratio containers and BlurHash/LQIP placeholders',
    'Multi-angle image galleries, 360-degree turntables, WebGL/GLTF 3D viewers',
    'Dynamic variant/specification matrix with URL query state sync',
    'Comparison drawer with provenance storytelling and downloadable spec sheets',
  ],
  [Pillar.CategoriesDiscovery]: [
    'DAG/closure-table category trees with poly-hierarchy support',
    'Typo-tolerant hybrid search: BM25 + dense vector (pgvector HNSW)',
    'Disjunctive/conjunctive faceted filtering with live document counts',
    'Multi-list wishlists/registries with collaboration and visibility controls',
    'Cryptographically verified purchase review badges',
    'Multi-dimensional sub-ratings with Wilson-score confidence sorting',
  ],
  [Pillar.MonetaryTaxPayment]: [
    'All monetary values stored as BIGINT integer cents with ISO 4217 currency code',
    'Currency metadata with minor-unit exponent (0/2/3 decimal awareness)',
    'Largest-remainder penny allocation for prorated discounts/taxes',
    'Tax-inclusive and tax-exclusive calculation modes',
    'HSN/SAC/Product Tax codes with split GST and VAT MOSS/OSS support',
    'Payment intent state machine and double-entry immutable ledger',
  ],
  [Pillar.SubscriptionBilling]: [
    'Flexible billing cadences: weekly, monthly, annual, seat-based, metered',
    'Mid-cycle upgrade/downgrade with to-the-second proration',
    'Smart dunning: automated retry schedules with backup payment failover',
    'FTC click-to-cancel: skip next, swap SKU, snooze/pause, cancel controls',
    'Pending-to-active point vesting tied to return window expiration',
    'Rolling tier qualification with automated progression thresholds',
  ],
  [Pillar.OrderStateMachines]: [
    'Database-enforced FSM with transition guards and actor/timestamp/reason recording',
    'Full state lifecycle: DRAFT through COMPLETED with exception branches',
    'Mandatory Idempotency-Key protocol with request hash matching',
    '100% server-side price and promotion re-computation',
    'SERIALIZABLE/REPEATABLE READ transactions with deterministic lock ordering',
    'Idempotency key table with IN_PROGRESS/COMPLETED/FAILED status',
  ],
  [Pillar.ReorderTracking]: [
    'Deterministic reorder resolution with live catalog state comparison',
    'Automated substitute recommendations for out-of-stock/discontinued items',
    'WebSocket/SSE live geospatial courier tracking with interpolation',
    'Authenticated and guest order status lookup with tokenized magic links',
    'PostgreSQL TSTZRANGE exclusion constraints for conflict-free booking',
    'Configurable buffers, timezone-normalized IANA display, waitlist promotion',
  ],
  [Pillar.InventoryManagement]: [
    'Variant-level ATP ledger: on_hand, reserved, committed, damaged_quarantined',
    'ATP formula: OnHand - (Reserved + Committed + SafetyStock) + IncomingAllocated',
    'TTL-bound inventory reservations with automatic sweeper release',
    'Bill of Materials (BOM) and recipe depletion for bundles/kits',
    'Vendor master with MOQ, wholesale tiers, payment terms, lead-time tracking',
    'Reorder point automation and 3-way PO/GRN/Invoice matching',
  ],
  [Pillar.ShippingFulfillment]: [
    'Multi-node routing: warehouse proximity, stock completeness, SLA optimization',
    'Dimensional weight calculation with multi-carrier rate tables',
    'Serviceability matrix with Hazmat, Cold-Chain, and COD eligibility',
    'Wave picking with aisle/bin coordinate sorting',
    'Barcode scan verification (UPC/EAN/GS1-128)',
    'ZPL/PDF shipping label generation and carrier webhook ingestion',
  ],
  [Pillar.RefundsReturns]: [
    'Programmable policy engine: return_window_days, cancellation fee schedules, condition requirements',
    'Self-service RMA portal with reason codes and evidence upload',
    'Instant size/variant exchange, store credit, or payment method refund options',
    'Automated credit note generation with proportional tax reversal',
    'Loyalty point adjustment on approved returns/refunds',
    'Return window validation against delivered_at timestamp',
  ],
  [Pillar.PromotionsLoyalty]: [
    'Combinatorial coupon engine: percentage (with cap), fixed, BOGO, volume-break, bank-discount',
    'Stacking precedence matrix with exclusivity_group rules',
    'Points-and-tiers loyalty ledger with earn/burn configuration',
    'Rolling tier qualification (365-day spend/transaction thresholds)',
    'Anti-self-referral fraud checks (IP, device fingerprint, card hash, address similarity)',
    'Peer-to-peer gift loop with unique voucher codes and expiry',
  ],
  [Pillar.AnalyticsNotifications]: [
    'Executive BI dashboards: GMV, NRR, AOV, CAC/LTV, cohort retention heatmaps',
    'SKU-level sell-through velocity and cart conversion funnel',
    'Event-driven notification engine across email/SMS/WhatsApp/push/in-app',
    'Locale-aware templates with user channel preference toggles',
    'Quiet-hours scheduling and bounce/complaint suppression',
    'Delivery receipt tracking per notification channel',
  ],
  [Pillar.AuditCompliance]: [
    'Append-only hash-chained audit ledger (SHA-256 prev_hash || payload)',
    'Actor classification: USER, ADMIN, SYSTEM, API_KEY, AI_AGENT',
    'before_state/after_state JSONB with sensitive PII redacted',
    'Database BEFORE UPDATE OR DELETE trigger raising exception',
    'Compliance coverage for SOC 2 Type II, ISO 27001, HIPAA, PCI-DSS',
    'Immutable record_hash and prev_hash for cryptographic chain validation',
  ],
  [Pillar.AICapabilities]: [
    'Domain-grounded RAG with hybrid BM25 + vector + cross-encoder reranking',
    'Tool-calling action agents with HITL confirmation for mutating operations',
    'Prompt-injection classification and PII redaction before external model calls',
    'Structured JSON Schema output enforcement and semantic response caching',
    'Model fallback routing with per-tenant token budget metering',
    'Cost/latency governance with nano-unit accounting',
  ],
  [Pillar.VerificationSuites]: [
    'Zero-mock integration tests via Testcontainers (PostgreSQL, Redis)',
    'Concurrency torture tests: 50+ parallel checkouts proving exactly-1-sell invariant',
    'Playwright E2E: anonymous browse -> registration -> checkout -> fulfillment -> RMA',
    'Integer-cent rounding invariant tests across 10,000 random carts',
    'Idempotency tests: 5 concurrent requests with same key create exactly 1 order',
    'Automated axe-core WCAG 2.2: 0 critical/serious violations',
  ],
  [Pillar.I18nAccessibility]: [
    'ICU MessageFormat pluralization/gender rules for all user-facing strings',
    'RTL support via logical CSS properties (margin-inline-start, padding-inline-end)',
    'WCAG 2.2 AA/AAA: keyboard navigation, ARIA live regions, roving tabindex, focus-visible',
    'SSR/ISR for technical SEO with JSON-LD structured data (Product, AggregateRating, Offer)',
    'Core Web Vitals budgets: LCP < 1.8s, INP < 100ms, CLS = 0.00',
    'Dynamic XML sitemaps, OpenGraph social cards, locale-specific date/number formatting',
  ],
};

export const PILLAR_TEST_CASES: Record<Pillar, string[]> = {
  [Pillar.AuthAndIdentity]: [
    'E2E-AUTH-01: Guest cart merges 100% into authenticated cart on login',
    'Replaying rotated refresh token invalidates entire token family (401)',
    'Passkey registration and assertion ceremony with FIDO2',
    'OTP HMAC-SHA256 hashed storage with 5-min TTL, max 3 attempts',
    'Session portal shows all devices with User-Agent parsing and GeoIP',
    'Account deactivation: 14-day grace, then cryptographic PII anonymization',
  ],
  [Pillar.StaffVendorPortals]: [
    'RBAC-02: Non-admin requests to /admin/* return 403 under RLS',
    'Maker-checker: refunds > threshold require second principal approval',
    'Break-glass impersonation: 15-min time-boxed session with audit banner',
    'Resource-Action-Scope permission: catalog:product:publish:store_id enforced',
    'Portal isolation: merchant cannot access another tenant\'s catalog',
  ],
  [Pillar.BackendDatabase]: [
    'Schema migration: zero-downtime deployment with rollback',
    'RLS: cross-tenant query returns 0 rows under PostgreSQL RLS',
    'Outbox: domain event published within 1s of transaction commit',
    'CDC: search index sync within 5s of catalog mutation',
    'Connection pool: 100+ concurrent queries without exhaustion',
    'pgvector HNSW: <50ms ANN search on 1M embeddings',
  ],
  [Pillar.ApiGovernance]: [
    'API-04: Unknown fields rejected (additionalProperties: false)',
    'Rate limit: 429 returned after threshold with Retry-After header',
    'Webhook: replayed event with altered timestamp rejected',
    'Secrets: PII encrypted at app layer, searchable via blind-index HMAC',
    'CORS: requests from non-allowlisted origins blocked (403)',
  ],
  [Pillar.FrontendArchitecture]: [
    'CLS = 0.00 on catalog browse, checkout, and dashboard views',
    'Design tokens: dark/light mode toggle preserves all contrast ratios (>= 4.5:1)',
    '3D viewer: GLTF model loads and rotates with touch/mouse/pen input',
    'Variant selector: URL query, gallery, SKU, price, stock all update atomically',
    'Comparison drawer: 4 items side-by-side with diff highlighting',
    'prefers-reduced-motion: all animations disabled when set',
  ],
  [Pillar.CategoriesDiscovery]: [
    'Search: "quiet espresso grinder apartment" returns relevant results even without "apartment" in title',
    'Faceted filter: Brand=Fellow OR Baratza AND Price=$150-$400 AND Rating>=4',
    'Poly-hierarchy: product in "Outdoor Gear" AND "Father\'s Day Gifts"',
    'Wishlist: PRIVATE/SHARED_LINK/PUBLIC visibility with collaborator invites',
    'Review: only verified purchasers (DELIVERED order status) get badge',
    'Wilson-score sorts reviews by confidence, not just raw helpfulness count',
  ],
  [Pillar.MonetaryTaxPayment]: [
    'INT-MATH-03: SUM(line_refund_cents) === order_refund_cents across 10,000 carts',
    'Zero-decimal JPY: ¥5,000 stored as 5000, not 500000',
    'Largest-remainder: discount prorated across items with zero rounding drift',
    'Tax-inclusive EU: shelf price €10 extracts exact VAT at checkout',
    'Split GST India: CGST + SGST for intra-state, IGST for inter-state',
    'Ledger: SUM(debits) - SUM(credits) = 0 per transaction group (DB constraint)',
  ],
  [Pillar.SubscriptionBilling]: [
    'Proration: upgrade mid-cycle credits unused time, charges remaining fraction to-second exact',
    'Dunning: retry at +1, +3, +5, +7 days with card-updater hooks',
    'FTC cancel: skip/swap/snooze/cancel reachable in 2 clicks',
    'Points vesting: pending points activate only after return window expires',
    'Tier rollover: 365-day rolling spend automatically upgrades/downgrades tier',
  ],
  [Pillar.OrderStateMachines]: [
    'INT-IDEM-05: 5 concurrent POST with same Idempotency-Key create exactly 1 order',
    'FSM-07: DRAFT -> PENDING_PAYMENT -> PAYMENT_AUTHORIZED -> CONFIRMED enforced',
    'Illegal transition: CONFIRMED -> SHIPPED (skipping ALLOCATED/PICKING/PACKED) rejected',
    'Server re-computes price: client-submitted $9.99 ignored, DB catalog price used',
    'SERIALIZABLE: parallel checkouts for sku with on_hand=1 yield exactly 1 success',
  ],
  [Pillar.ReorderTracking]: [
    'Reorder: available SKUs added to cart, discontinued items show substitute',
    'Price change: "Increased by $1.50 since last order" badge displayed',
    'WebSocket: courier position updates within 500ms, interpolated smoothly',
    'Guest tracking: Order# + Email + Postal Code lookup without auth',
    'Booking: overlapping TSTZRANGE for same resource rejected by GiST constraint',
    'Waitlist: cancelled slot offered to waitlisted patient within 10 seconds',
  ],
  [Pillar.InventoryManagement]: [
    'ATP = OnHand - (Reserved + Committed + SafetyStock) + IncomingAllocated',
    'Check constraint: on_hand >= reserved + committed always holds',
    'Reservation TTL: unpaid RESERVED rows expire within 15s and restore ATP',
    'BOM: ordering "Latte" atomically reserves matcha + oat milk + cup',
    'ROP: PO auto-created when ATP <= ReorderPoint',
    '3-way match: PO = GRN = Supplier Invoice or discrepancy flagged',
  ],
  [Pillar.ShippingFulfillment]: [
    'Routing: single-shipment preferred over split when stock complete at one node',
    'Dimensional weight: L*W*H/DIM_DIVISOR compared to actual weight',
    'Wave pick: items sorted by warehouse aisle/bin for optimal pick path',
    'Barcode: GS1-128 scan verifies SKU before packing',
    'Carrier webhook: IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED all update status',
  ],
  [Pillar.RefundsReturns]: [
    'E2E-RMA-08: return past return_window_days rejected at API boundary',
    'Partial return: prorated cents + tax reversed, loyalty points adjusted',
    'Policy engine: apparel 30 days, electronics 7 days replacement-only, perishable non-returnable',
    'Exchange: zero-dollar replacement order placed on carrier drop-off scan',
    'Credit note: automatically generated with proportional tax reversal',
  ],
  [Pillar.PromotionsLoyalty]: [
    'Stacking: line-item markdown first, order-coupon second, points redemption third',
    'Percentage discount: 15% off up to $1,000 cap applied correctly',
    'Points vesting: pending points become active only after return window closes',
    'Tier qualification: 25 transactions in 365 days triggers Plus Gold',
    'Referral: same IP + device + card + address = self-referral blocked',
  ],
  [Pillar.AnalyticsNotifications]: [
    'GMV dashboard: accurate within 1 hour of transaction commit',
    'Notification: email sent within 5 minutes of order confirmation',
    'Quiet hours: notifications suppressed 10PM-8AM per user preference',
    'Channel preference: transactional receipts override user quiet hours',
    'Cohort retention: 30/60/90-day curves computed from first-purchase cohort',
  ],
  [Pillar.AuditCompliance]: [
    'INT-AUDIT-09: UPDATE audit_logs raises DB trigger exception',
    'Hash chain: SHA-256(prev_hash || payload) validates across entire history',
    'Actor types: USER, ADMIN, SYSTEM, API_KEY, AI_AGENT all classified',
    'PII redaction: SSN masked in before_state/after_state JSONB',
    'Request ID: W3C Trace Context propagated to all log entries',
  ],
  [Pillar.AICapabilities]: [
    'RAG: hybrid BM25 + vector retrieval with cross-encoder reranking',
    'Agent: mutating tool (issue_refund) requires user confirmation before execution',
    'Prompt injection: classification blocks jailbreak prompts before model call',
    'PII redaction: SSN/email/phone masked before external API transmission',
    'JSON Schema: LLM output 100% conformant to specified schema',
    'Token budget: per-tenant metering with alert at 80% and hard stop at 100%',
  ],
  [Pillar.VerificationSuites]: [
    'INT-CONC-04: 50 parallel checkouts for sku on_hand=1 yield 1 success, 49 OutOfStock',
    'E2E-A11Y-10: full checkout via keyboard with 0 axe-core critical/serious violations',
    'Integration: schema migration runs against Testcontainers PostgreSQL',
    'Idempotency: 5 identical requests with same key = 1 DB order + 1 PaymentIntent',
    'TTL-06: expired reservations released within 15 seconds',
    'Race condition: no negative stock after concurrent reservation sweeps',
  ],
  [Pillar.I18nAccessibility]: [
    'RTL: Arabic/Hebrew layout mirrors correctly with logical CSS',
    'ICU: plural rules applied for Russian/Polish/Arabic count-dependent messages',
    'Keyboard: Tab + Arrow roving tabindex through interactive elements',
    'Live regions: aria-live="polite" for cart updates and order status changes',
    'Core Web Vitals: LCP < 1.8s, INP < 100ms, CLS = 0.00 on mobile 3G',
    'SEO: JSON-LD Product schema with AggregateRating and Offer markup',
  ],
};

export function getAllPillarNames(): Pillar[] {
  return Object.values(Pillar).filter((v): v is Pillar => typeof v === 'number');
}

/** Backwards-compatible alias for validator.ts */
export function getPillarNames(): string[] {
  return getAllPillarNames().map((p) => PILLAR_NAMES[p]);
}

export function getPillarById(id: number): Pillar | undefined {
  const values = Object.values(Pillar).filter((v): v is Pillar => typeof v === 'number');
  return values.find((p) => p === id);
}

export function getPillarName(pillar: Pillar): string {
  return PILLAR_NAMES[pillar];
}

export interface PillarSpec {
  id: number;
  name: string;
  description: string;
  requirements: string[];
  testCases: string[];
  components?: string[];
  tables?: string[];
  apiEndpoints?: string[];
  e2eTests?: string[];
  frontendComponents?: string[];
}

// ─── Generator types (used by apiGenerator, frontendGenerator, testGenerator) ─

export interface ColumnSpec {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  references?: string;
}

export interface TableSpec {
  name: string;
  columns: ColumnSpec[];
  indexes: IndexSpec[];
  triggers: TriggerSpec[];
  constraints: ConstraintSpec[];
}

export interface IndexSpec {
  name: string;
  unique?: boolean;
  type?: string;
  columns: string[];
}

export interface ConstraintSpec {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  columns: string[];
  references?: string;
}

export interface TriggerSpec {
  name: string;
  event: string;
  table: string;
  function: string;
}

// ─── Generator types (used by apiGenerator, frontendGenerator, testGenerator) ─

export interface ApiEndpointSpec {
  method: string;
  path: string;
  summary: string;
  tag: string;
  authenticated: boolean;
}

export interface E2ETestSpec {
  title: string;
  description: string;
  steps: string[];
  assertions: string[];
  pillarId: number;
}

export interface FrontendComponentSpec {
  name: string;
  type: 'page' | 'component' | 'layout';
  description: string;
  props: string[];
  stateManagement: string[];
}

export interface PillarValidation {
  pillar: Pillar;
  name: string;
  satisfied: boolean;
  missingRequirements: string[];
  missingTests: string[];
}

export function validateSpec(spec: {
  pillars: PillarSpec[];
}): PillarValidation[] {
  const results: PillarValidation[] = [];
  const allPillars = getAllPillarNames();

  for (const pillar of allPillars) {
    const specPillar = spec.pillars.find((p) => p.id === pillar);
    const requirements = PILLAR_REQUIREMENTS[pillar];
    const testCases = PILLAR_TEST_CASES[pillar];

    if (!specPillar) {
      results.push({
        pillar,
        name: PILLAR_NAMES[pillar],
        satisfied: false,
        missingRequirements: requirements,
        missingTests: testCases,
      });
      continue;
    }

    const reqSet = new Set(specPillar.requirements.map((r) => r.toLowerCase()));
    const testSet = new Set(specPillar.testCases.map((t) => t.toLowerCase()));

    const missingReqs = requirements.filter((r) => !reqSet.has(r.toLowerCase()));
    const missingTests = testCases.filter((t) => !testSet.has(t.toLowerCase()));

    results.push({
      pillar,
      name: PILLAR_NAMES[pillar],
      satisfied: missingReqs.length === 0 && missingTests.length === 0,
      missingRequirements: missingReqs,
      missingTests,
    });
  }

  return results;
}
