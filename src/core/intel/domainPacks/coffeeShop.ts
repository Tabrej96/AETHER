/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Coffee Shop Domain Pack
 *
 * Complete specialty coffee business domain model — from bean to cup to customer retention.
 * Designed to power benchmark generators producing domain-appropriate full-stack applications.
 *
 * Inspiration: ECC (domain decomposition), OpenHands (task patterns), Puter (workspace patterns)
 */


import type {  } from './domainPackTypes.js';

export interface FeatureSpec {
  name: string;
  description: string;
  required: boolean;
  dependencies?: string[];
}


export interface FulfillmentModeSpec {
  name: string;
  description: string;
  estimatedTime: string;
  available: boolean;
}


export interface CustomerFeaturesSpec {
  features: string[];
}

export interface OperationsFeaturesSpec {
  features: string[];
}

export interface ExperienceFeaturesSpec {
  features: string[];
}

export interface ComponentSpec {
  name: string;
  description: string;
}







export const COFFEE_SHOP_PACK: DomainPack = {
  domain: 'coffee_shop',
  name: 'Specialty Coffee Shop',
  description:
    'Complete specialty coffee business — from bean to cup to customer retention. Covers product catalog with drink customization, fulfillment via pickup and delivery, customer loyalty programs, operational inventory management, and rich brand storytelling through origin stories and tasting notes.',

  // ── Catalog ──────────────────────────────────────────────────────────────
  catalog: {
    categories: ['Espresso', 'Filter Coffee', 'Cold Brew', 'Beans', 'Bakery', 'Merchandise'],
    features: [
      'badges',
      'dietary-filters',
      'search',
      'customizations',
      'availability',
      'batch-codes',
      'popularity-sorting',
      'price-sorting',
      'seasonal-filtering',
      'origin-filtering',
    ],
    categoryDetails: [
      {
        name: 'Espresso',
        description: 'Concentrated coffee drinks made with high-pressure extraction',
        subcategories: ['Espresso Shot', 'Americano', 'Macchiato', 'Latte', 'Cappuccino', 'Flat White', 'Mocha', 'Affogato'],
      },
      {
        name: 'Filter Coffee',
        description: 'Gravity-brewed single-origin and blend pour-overs',
        subcategories: ['V60', 'Chemex', 'Aeropress', 'French Press', 'Kalita Wave', 'Siphon'],
      },
      {
        name: 'Cold Brew',
        description: 'Slow-steeped cold coffee and nitrogen-infused options',
        subcategories: ['Classic Cold Brew', 'Nitro Cold Brew', 'Cold Drip', 'Iced Latte', 'Iced Americano', 'Flash Chill'],
      },
      {
        name: 'Beans',
        description: 'Retail bags of single-origin and blended roasted coffee',
        subcategories: ['Single Origin', 'Blend', 'Decaf', 'Micro-Lot', 'Seasonal Release', 'Subscription Box'],
      },
      {
        name: 'Bakery',
        description: 'Fresh-baked pastries, breads, and snacks',
        subcategories: ['Pastries', 'Muffins', 'Sourdough', 'Cookies', 'Croissants', 'Vegan Options'],
      },
      {
        name: 'Merchandise',
        description: 'Branded drinkware and accessories',
        subcategories: ['Mugs', 'Travel Tumblers', 'Pour-Over Kits', 'Grinders', 'T-Shirts', 'Gift Cards'],
      },
    ],
  },

  // ── Fulfillment ──────────────────────────────────────────────────────────
  fulfillment: {
    modes: [
      { name: 'pickup', description: 'In-store order pickup', estimatedTime: '15 minutes', available: true },
      { name: 'delivery', description: 'Local delivery to customer address', estimatedTime: '30-60 minutes', available: true },
    ],
    features: [
      'address-collection',
      'pickup-windows',
      'delivery-zones',
      'free-threshold',
      'fees',
    ],
  },

  // ── Customer Experience ──────────────────────────────────────────────────
  customer: {
    features: [
      'accounts',
      'order-history',
      'wishlist',
      'reviews',
      'loyalty',
      'subscriptions',
      'memberships',
    ],
  },

  // ── Business Operations ──────────────────────────────────────────────────
  operations: {
    features: [
      'inventory',
      'stock-movements',
      'order-management',
      'staff-accounts',
      'admin-dashboard',
      'promotions',
      'coupons',
    ],
  },

  // ── Brand Experience ─────────────────────────────────────────────────────
  experience: {
    features: [
      'brew-guides',
      'roasting-philosophy',
      'origin-stories',
      'tasting-notes',
      'batch-traceability',
    ],
  },

  // ── Required Components ──────────────────────────────────────────────────
  components: {
    public: [
      'homepage',
      'menu',
      'product-detail',
      'cart',
      'checkout',
      'store-info',
      'contact',
    ],
    customer: [
      'account',
      'profile',
      'orders',
      'wishlist',
      'membership',
      'subscriptions',
    ],
    admin: [
      'dashboard',
      'products',
      'orders',
      'inventory',
      'customers',
      'promotions',
      'reports',
    ],
    staff: [
      'order-display',
      'status-updates',
      'inventory-check',
    ],
  },

  // ── Business Rules ───────────────────────────────────────────────────────
  businessRules: {
    pricing:
      'Per-product base pricing with variant deltas (size, milk type, shot count) and per-customization surcharges (extra shot +1.00, alternative milk +0.75, flavored syrup +0.50). Bundle discounts for pastry + drink combos. Loyalty members receive 10% off all orders.',

    tax:
      'GST at 5% for India (IGST for interstate, CGST+SGST for intrastate). Sales tax computed per US state (rates 0%–10.25%). VAT at standard EU country rate (typically 19–27%). Tax applied after discounts, before delivery fees. Rounding to nearest cent.',

    fulfillment:
      'Pickup orders ready in 15 minutes during business hours. Delivery orders dispatched within 30–60 minutes depending on zone. Order cutoff 15 minutes before closing. Peak-hour surcharge of $2.00 during 7–9 AM and 12–2 PM windows.',

    loyalty:
      'Earn 10 points per dollar spent. Bronze tier (0–200 pts): no discount. Silver tier (200–500 pts): 5% discount on all orders. Gold tier (500+ pts): 10% discount + free monthly drink on birthday. Points expire after 12 months of inactivity.',

    promotions:
      'Percentage-off coupons (e.g., 20% off first order), fixed-amount coupons (e.g., $5 off orders over $25), free shipping/delivery on orders above threshold ($30), BOGO on bakery items, seasonal drink launches with limited-time pricing, referral bonus: $5 credit for each friend who places first order.',
  },

  // ── Design Principles ────────────────────────────────────────────────────
  design: {
    palette:
      'Warm, artisanal palette: cream/parchment backgrounds (#F5F0E8), espresso brown (#2C1810), caramel accent (#C8963E), dark chocolate (#3E2723), latte foam white (#FFF8F0). Muted sage green (#7D8B6F) for sustainability cues. Single bold accent color for CTAs.',

    typography:
      'Editorial serif for brand headlines (e.g., Playfair Display or similar). Clean geometric sans for body text and UI elements (e.g., Inter or DM Sans). Generous line height (1.6+) for readability. Bold weight contrast between display and body. Monospace for batch codes and order numbers.',

    imagery:
      'Hero photography featuring bean close-ups, pour-over and latte art shots, roasting drum process imagery, barista hands crafting drinks. Warm color grading. Lifestyle shots of customers in the cafe. Origin landscape photography for single-origin product pages. Consistent aspect ratios (4:3 for products, 16:9 for hero).',

    interactions:
      'Staggered reveal animations for menu items on scroll. Smooth 300ms transitions for cart add/remove with tactile scale feedback. Hover states revealing customization options on product cards. Progress indicator during checkout steps. Toast notifications for order confirmation. Pull-to-refresh on mobile menu.',
  },

  // ── Security Requirements ────────────────────────────────────────────────
  security: {
    auth:
      'Three-tier role system: Customer (order, review, manage account), Staff (view orders, update status, check inventory), Admin (full access: products, orders, inventory, customers, promotions, reports, staff management). JWT-based session tokens with 24h expiry. Refresh tokens with 7d expiry. Password hashing with bcrypt (cost factor 12).',

    data:
      'Order history with full line-item detail. Payment information tokenized via payment processor (no card data stored). Customer PII: name, email, phone, delivery address. Loyalty point balances. Subscription preferences and history. Review content and ratings.',

    compliance: [
      'PCI-DSS compliance for all payment processing — card data never touches AETHER infrastructure.',
      'GDPR compliance for EU customers — right to erasure, data portability, consent management for marketing communications.',
      'CCPA compliance for California residents — opt-out of data sale, disclosure of data collection.',
      'Local food safety labeling regulations for allergen and dietary information display.',
    ],
  },

  // ── Testing Requirements ─────────────────────────────────────────────────
  testing: {
    unit: [
      'Cart subtotal calculation with variant deltas and customization surcharges',
      'Tax computation per jurisdiction (GST, US sales tax, EU VAT) with correct rounding',
      'Discount/coupon logic: percentage vs fixed, stacking rules, minimum order thresholds',
      'Loyalty points accrual and tier calculation on purchase',
      'Inventory stock deduction and back-in-stock threshold alerts',
      'Delivery fee calculation by zone and order value',
      'Peak-hour surcharge detection based on current time',
    ],
    integration: [
      'Cart → checkout → order creation flow with stock reservation',
      'Customer account creation → email verification → first order flow',
      'Promotion code validation → discount application → order total recalculation',
      'Loyalty point award after order payment confirmation',
      'Staff order status update → customer notification → inventory adjustment',
      'Subscription order generation → payment processing → fulfillment queue',
    ],
    e2e: [
      'Browse menu → customize drink → add to cart → checkout → order confirmation',
      'New customer registration → browse → order → rate → earn loyalty points',
      'Staff login → view pending orders → mark as preparing → mark as ready → notify customer',
      'Admin login → add product → set pricing → publish → verify on public menu',
      'Customer applies coupon at checkout → verify discount → complete order → verify coupon consumed',
    ],
  },
};
