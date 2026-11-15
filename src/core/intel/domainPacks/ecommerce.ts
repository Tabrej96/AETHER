/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * E-Commerce Domain Pack
 *
 * General-purpose e-commerce platform domain model. Covers product catalog with variants
 * and recommendations, shopping cart with calculations and discounts, checkout with address
 * and shipping, order lifecycle with tracking and returns, customer accounts, and full admin
 * capabilities for product and order management.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */

export interface EcommerceCatalogSpec {
  categories: string[];
  features: string[];
  categoryDetails?: CategorySpec[];
  variantTypes: string[];
  filterDimensions: string[];
}

export interface CartFeatureSpec {
  features: string[];
  supportsGuestCheckout: boolean;
}

export interface CheckoutFeatureSpec {
  features: string[];
  steps: string[];
  guestCheckout: boolean;
}

export interface OrderLifecycleSpec {
  states: string[];
  transitions: Record<string, string[]>;
  features: string[];
  returnWindowDays: number;
}

export interface CustomerAccountSpec {
  features: string[];
  addressBook: boolean;
  orderHistory: boolean;
  wishlist: boolean;
  reviews: boolean;
}

export interface AdminFeatureSpec {
  features: string[];
}

export interface RecommendationSpec {
  algorithms: string[];
  contexts: string[];
}

export interface DomainPack {
  domain: string;
  name: string;
  description: string;

  catalog: EcommerceCatalogSpec;
  cart: CartFeatureSpec;
  checkout: CheckoutFeatureSpec;
  orders: OrderLifecycleSpec;
  customer: CustomerAccountSpec;
  admin: AdminFeatureSpec;
  recommendations: RecommendationSpec;

  components: {
    public: string[];
    customer: string[];
    admin: string[];
    staff: string[];
  };
  fulfillment: {
    features: string[];
  };
  operations: {
    features: string[];
  };
  experience: {
    features: string[];
  };

  businessRules: BusinessRulesSpec;
  design: DesignSpec;
  security: SecuritySpec;
  testing: TestingSpec;
}

export const ECOMMERCE_PACK: DomainPack = {
  domain: 'ecommerce',
  name: 'General E-Commerce Platform',
  description:
    'Full-featured e-commerce platform for selling physical and digital goods. Covers product catalog with variants and recommendations, shopping cart with calculations and discounts, multi-step checkout, order lifecycle with tracking and returns, customer account management, and comprehensive admin capabilities for product and order operations.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: [
      'Electronics',
      'Clothing & Apparel',
      'Home & Kitchen',
      'Books & Media',
      'Sports & Outdoors',
      'Beauty & Personal Care',
    ],
    features: ['variants', 'search', 'filters', 'recommendations', 'comparisons', 'reviews', 'wishlist', 'badges', 'availability', 'batch-codes'],
    categoryDetails: [
      {
        name: 'Electronics',
        description: 'Consumer electronics, gadgets, and accessories',
        subcategories: ['Smartphones', 'Laptops', 'Audio', 'Wearables', 'Cameras', 'Accessories', 'Smart Home'],
      },
      {
        name: 'Clothing & Apparel',
        description: 'Fashion for all genders and age groups',
        subcategories: ["Men's Wear", "Women's Wear", "Kids' Wear", 'Activewear', 'Footwear', 'Accessories', 'Jewelry'],
      },
      {
        name: 'Home & Kitchen',
        description: 'Home goods, furniture, and kitchen essentials',
        subcategories: ['Furniture', 'Cookware', 'Decor', 'Bedding', 'Lighting', 'Storage', 'Appliances'],
      },
      {
        name: 'Books & Media',
        description: 'Physical books, e-books, audiobooks, and media',
        subcategories: ['Fiction', 'Non-Fiction', 'Textbooks', 'Audiobooks', 'E-Books', 'Comics', 'Magazines'],
      },
      {
        name: 'Sports & Outdoors',
        description: 'Sports equipment, gear, and outdoor recreation',
        subcategories: ['Fitness Equipment', 'Camping', 'Cycling', 'Team Sports', 'Running', 'Water Sports', 'Hiking'],
      },
      {
        name: 'Beauty & Personal Care',
        description: 'Skincare, cosmetics, haircare, and personal hygiene',
        subcategories: ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Men\'s Grooming', 'Personal Hygiene', 'Tools'],
      },
    ],
    variantTypes: ['size', 'color', 'material', 'storage', 'condition', 'edition', 'bundle'],
    filterDimensions: ['price-range', 'category', 'brand', 'rating', 'availability', 'color', 'size', 'material', 'price-low-to-high', 'price-high-to-low', 'newest', 'best-selling', 'discount'],
  },

  // ── Cart ─────────────────────────────────────────────────────────────────
  cart: {
    features: ['line-items', 'quantity-adjustment', 'save-for-later', 'price-calculation', 'discount-codes', 'tax-estimation', 'shipping-estimation', 'cross-sell-suggestions'],
    supportsGuestCheckout: true,
  },

  // ── Checkout ─────────────────────────────────────────────────────────────
  checkout: {
    features: ['address-form', 'shipping-method', 'payment-method', 'order-review', 'guest-checkout', 'save-address', 'gift-options', 'invoice-request'],
    steps: ['Shipping Address', 'Shipping Method', 'Payment Method', 'Order Review', 'Confirmation'],
    guestCheckout: true,
  },

  // ── Orders ───────────────────────────────────────────────────────────────
  orders: {
    states: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'return-requested', 'returned'],
    transitions: {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'return-requested'],
      delivered: ['return-requested'],
      'return-requested': ['returned', 'delivered'],
      returned: ['refunded'],
    },
    features: ['tracking', 'history', 'cancellation', 'returns', 'refunds', 'reorder', 'invoice-download', 'review-prompt'],
    returnWindowDays: 30,
  },

  // ── Customer ─────────────────────────────────────────────────────────────
  customer: {
    features: ['accounts', 'order-history', 'address-book', 'wishlist', 'reviews', 'wishlist-sharing', 'recommendations', 'saved-payments'],
    addressBook: true,
    orderHistory: true,
    wishlist: true,
    reviews: true,
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  admin: {
    features: [
      'product-management',
      'order-management',
      'inventory',
      'customer-management',
      'promotions',
      'coupons',
      'reports',
      'shipping-settings',
      'payment-settings',
      'content-management',
      'review-moderation',
      'tax-settings',
      'bulk-operations',
    ],
  },

  components: {
    public: [
      'homepage',
      'category-page',
      'product-listing',
      'product-detail',
      'cart',
      'checkout',
      'order-confirmation',
      'account',
      'wishlist',
      'search',
    ],
    customer: ['account', 'profile', 'orders', 'wishlist', 'addresses', 'reviews', 'returns'],
    admin: [
      'dashboard',
      'products',
      'categories',
      'orders',
      'customers',
      'inventory',
      'promotions',
      'coupons',
      'reports',
      'settings',
    ],
    staff: ['order-fulfillment', 'shipping-labels', 'inventory-check'],
  },

  fulfillment: {
    features: ['address-collection', 'shipping-methods', 'delivery-tracking', 'free-threshold', 'fees', 'pickup-points'],
  },

  operations: {
    features: ['inventory', 'stock-movements', 'order-management', 'promotions', 'coupons', 'reports'],
  },

  experience: {
    features: ['product-reviews', 'size-guides', 'care-instructions', 'gift-registry', 'wishlist-sharing'],
  },

  // ── Recommendations ──────────────────────────────────────────────────────
  recommendations: {
    algorithms: ['collaborative-filtering', 'content-based', 'trending', 'frequently-bought-together', 'viewed-also-viewed', 'personalized'],
    contexts: ['homepage', 'product-page', 'cart-page', 'post-purchase', 'category-page', 'search-results'],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: {
    pricing:
      'Per-product base price with variant deltas (size premium, material cost). Tiered volume discounts for bulk purchases (5% off 5+ units, 10% off 20+ units). Dynamic pricing engine supports scheduled sales, member-exclusive pricing, and first-customer discounts. MSRP comparison display for discounted products. Price rounding to nearest cent.',

    tax:
      'US: State-level sales tax computed at checkout based on ship-to address (rates 0%–10.25%). EU: VAT at destination country rate (standard, reduced, zero-rated by product category). GST for India, Canada (HST/PST/GST by province). Digital goods taxed at customer location. Tax-exempt certificates supported for B2B orders. Tax-inclusive vs tax-exclusive display modes per region.',

    shipping:
      'Free shipping on orders above $50 (configurable threshold). Standard shipping: 5–7 business days (free over threshold). Express shipping: 2–3 business days ($9.99). Overnight shipping: next business day ($19.99). International shipping: 10–20 business days (calculated by weight/destination). Flat-rate small-item shipping ($3.99). Real-time carrier rate integration for FedEx/UPS/USPS. In-store pickup available where applicable.',

    returns:
      '30-day return window from delivery date. Products must be unused and in original packaging. Return shipping paid by customer ($5.99 deducted from refund) unless product is defective. Refund issued to original payment method within 5–10 business days after warehouse receives returned item. Store credit option available instantly. Final sale items (clearance, personalized) not eligible for return. Return authorization code required for all returns.',

    reviews:
      'Verified purchase badge required before review submission. One review per product per customer. Reviews editable within 7 days of submission. Admin moderation queue for flagged reviews (profanity, fake content, off-topic). Star ratings 1–5 with mandatory written comment for ratings below 3 stars. Review helpfulness voting. Vendor response capability. Review sorting by most helpful, most recent, and highest/lowest rating.',
  },

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    palette:
      'Clean, premium palette: white background (#FFFFFF), light gray surfaces (#F7F7F8), near-black text (#1A1A1A), primary brand color (configurable — blue #2563EB, green #059669, or custom). Subtle accent colors for sale badges (#EF4444 red), success states (#10B981 green), warning (#F59E0B amber). Minimal color palette to keep focus on product imagery.',

    typography:
      'Modern sans-serif throughout (Inter, system-ui). Clear hierarchy: bold product titles (18–24px), readable descriptions (14–16px with 1.5 line height), prominent prices (16–20px, bold). Monospace for order numbers and SKUs. Weight and size, not color, used as primary differentiator. Tabular figures for prices and counts.',

    imagery:
      'High-resolution product photos with consistent aspect ratios (1:1 for grid, 4:3 for detail). White or lifestyle background options per product. Zoom-on-hover for detail inspection. Multiple angles per product. Thumbnail strip navigation. Video support for product demos. Consistent white-background default, lifestyle shots for hero and category banners. Auto-generated placeholder images for products without photos.',

    interactions:
      'Instant search with autocomplete as user types. Animated cart count badge on add/remove. Smooth page transitions between product listing and detail. Add-to-cart with animated button feedback and optional quick-view modal. Sticky cart summary on checkout pages. Inline validation on all forms with clear error messages. Infinite scroll or pagination for product listings with skeleton loading states. Skeleton screens during initial page load.',
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth:
      'Customer authentication via email/password (bcrypt, cost 12) and OAuth (Google, Apple, Facebook). Admin and staff authentication with separate credential store and mandatory MFA. Role-based access control: Customer, Staff, Admin, Super Admin. Session management with JWT access tokens (15m expiry) and refresh tokens (7d expiry). Rate limiting on auth endpoints (5 attempts per minute per IP). Password reset via time-limited token (1h expiry) sent to verified email.',

    data:
      'Order data with full line items, pricing breakdown, shipping addresses, and payment references. Customer PII: name, email, phone, shipping/billing addresses. Payment method tokens (stored via payment processor tokens, never raw card data). Review content and metadata. Wishlist contents. Customer segmentation and behavior data. Analytics events. Inventory levels and warehouse locations.',

    compliance: [
      'PCI-DSS Level 1 compliance — all card processing handled by certified payment processor (Stripe, Braintree, etc.). AETHER never stores, transmits, or processes raw card data.',
      'GDPR compliance — cookie consent banner, privacy policy, right to access/erase/export data, data processing records, DPA with sub-processors.',
      'CCPA/CPRA compliance — "Do Not Sell My Personal Information" option, data disclosure at request, opt-out of data sharing.',
      'SOC 2 Type II readiness — audit logs for all admin actions, data encryption at rest and in transit, access control reviews.',
      'ADA/WCAG 2.1 AA compliance — accessible checkout flow, screen-reader compatible, keyboard navigation, sufficient color contrast.',
    ],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Cart subtotal calculation with variant prices, quantities, and discount stacking',
      'Tax computation per jurisdiction with correct rounding and exemption handling',
      'Shipping cost calculation by method, weight, destination, and order value',
      'Discount/coupon validation and application: percentage vs fixed, expiry, usage limits, stackability',
      'Inventory stock check and back-order detection',
      'Return eligibility: within window, product condition, final sale detection',
      'Refund amount calculation: partial refunds, restocking fees, return shipping deduction',
      'Recommendation algorithm scoring and ranking',
      'Search result relevance scoring with typo tolerance',
    ],
    integration: [
      'Browse → add to cart → apply coupon → checkout → order creation flow',
      'Guest checkout → order confirmation → account creation from guest order',
      'Customer login → view order history → initiate return → receive refund',
      'Admin product creation → inventory setup → publish → searchable on storefront',
      'Admin order fulfillment update → shipping label generation → customer notification → tracking link',
      'Promotion campaign creation → coupon generation → customer application → sales analytics',
      'Customer review submission → moderation queue → admin approval → display on product page',
      'Inventory depletion → back-order flag → restock notification → inventory update',
    ],
    e2e: [
      'New customer registration → browse products → apply filters → add to cart → checkout with new address → order confirmation',
      'Returning customer login → reorder previous purchase → apply loyalty discount → complete checkout',
      'Admin login → create product with variants → set promotional price → verify on storefront → process test order',
      'Customer initiates return → selects reason → generates return label → ships return → receives store credit → reuses credit',
      'Search product → compare with alternatives → read reviews → add to wishlist → share wishlist link → friend purchases item',
    ],
  },
};
