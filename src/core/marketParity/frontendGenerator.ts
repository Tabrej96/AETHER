/**
 * AETHER Market-Parity Engine — Frontend Specification Generator
 *
 * Generates COMPLETE frontend specifications: pages, components, layouts,
 * design system, routing, and state management for any industry.
 */

import type { FrontendComponent, Industry, CompetitorFeature } from './types';

function generateDesignSystem(industry: Industry): { name: string; description: string; features: string[]; tokens: Record<string, unknown> } {
  return {
    name: 'AetherDesignSystem',
    description: 'Semantic design token system with 3-tier hierarchy (Primitive → Semantic → Component)',
    features: [
      'Fluid typography with clamp() for responsive scaling',
      'Dark mode & high-contrast daylight mode (WCAG 2.2 AA/AAA)',
      'Spring-physics micro-interactions (stiffness: 300, damping: 28)',
      'Shared-element transitions between routes',
      'Optimistic UI mutations with rollback',
      'Zero CLS: aspect-ratio containers, BlurHash, deterministic skeletons',
      'RTL support with logical CSS properties',
      'prefers-reduced-motion: reduce support',
      'Focus-visible rings and keyboard navigation',
      'ARIA live regions for dynamic content',
    ],
    tokens: {
      typography: {
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        monoFontFamily: '"JetBrains Mono", "Fira Code", monospace',
        scale: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '1.5rem', '2xl': '2rem', '3xl': '3rem' },
        lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
        fontWeight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
      },
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a5f' },
        success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
        warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
        danger: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626' },
        neutral: { 0: '#ffffff', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617' },
      },
      spacing: { 0: '0', 1: '0.25rem', 2: '0.5rem', 3: '0.75rem', 4: '1rem', 5: '1.25rem', 6: '1.5rem', 8: '2rem', 10: '2.5rem', 12: '3rem', 16: '4rem' },
      borderRadius: { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', full: '9999px' },
      shadows: { sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)' },
      motion: { spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', easeOut: 'cubic-bezier(0, 0, 0.2, 1)', easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)', fast: '150ms', normal: '300ms', slow: '500ms' },
    },
  };
}

export function generateFrontendComponents(_industry: Industry, _features: CompetitorFeature[]): FrontendComponent[] {
  const ds = generateDesignSystem(_industry);

  return [
    // ─── Layout Shells ───────────────────────────────────────────────────────
    {
      name: 'AppShell',
      type: 'layout',
      description: 'Root layout with header, sidebar navigation, and footer',
      dependencies: ['react-router-dom', '@tanstack/react-query', 'zustand'],
      features: ['Responsive sidebar navigation', 'Collapsible header with search', 'Breadcrumb trail', 'User menu with session management', 'Mobile hamburger menu', 'Theme toggle (light/dark)', 'Notification bell with unread badge'],
    },
    {
      name: 'PublicLayout',
      type: 'layout',
      description: 'Public-facing layout (landing pages, SEO-optimized)',
      dependencies: ['react-router-dom', '@tanstack/react-query'],
      features: ['SSR/SSG-ready', 'SEO meta tags and JSON-LD', 'Minimal header with logo + nav', 'Footer with links and trust badges', 'Cookie consent banner', 'Progressive Web App manifest'],
    },
    {
      name: 'CustomerPortalLayout',
      type: 'layout',
      description: 'Authenticated customer dashboard layout',
      dependencies: ['@tanstack/react-query', 'zustand'],
      features: ['Sidebar nav with order/reviews/wishlist links', 'Recently viewed sidebar', 'Quick reorder widget', 'Loyalty points display', 'Mobile bottom tab bar'],
    },
    {
      name: 'MerchantPortalLayout',
      type: 'layout',
      description: 'Merchant/vendor dashboard with KPI cards',
      dependencies: ['@tanstack/react-query', 'recharts'],
      features: ['Sales KPIs (GMV, orders, AOV)', 'Inventory health indicators', 'Order management table', 'Payout timeline', 'Performance charts'],
    },
    {
      name: 'AdminConsoleLayout',
      type: 'layout',
      description: 'Super-admin platform governance console',
      dependencies: ['@tanstack/react-query', 'recharts', '@tanstack/react-table'],
      features: ['Platform-wide metrics', 'Tenant management table', 'RBAC user/role assignment', 'Audit log viewer', 'Feature flag management', 'System health monitoring'],
    },
    {
      name: 'OperationsPortalLayout',
      type: 'layout',
      description: 'Warehouse/Kitchen operations portal (touch-optimized, high-contrast)',
      dependencies: ['@tanstack/react-query', 'zustand'],
      features: ['Large touch targets (min 48px)', 'High-contrast color scheme', 'KDS ticket queue', 'Wave picking list', 'Scanner input handler', 'Offline mode with sync', 'Audio alerts for new tickets'],
    },

    // ─── Authentication Pages ────────────────────────────────────────────────
    {
      name: 'LoginPage',
      type: 'page',
      description: 'Multi-modal login: email/password, passkey, OAuth providers',
      dependencies: ['@simplewebauthn/browser', 'react-oauth2-pkce'],
      features: ['Email/password form with validation', 'Passkey "Sign in with Face ID/Touch ID" button', 'OAuth provider buttons (Google, Apple, GitHub)', 'Password reset link', 'MFA challenge screen', 'Remember device checkbox', 'Social proof / trust indicators'],
    },
    {
      name: 'RegisterPage',
      type: 'page',
      description: 'Multi-step registration with OTP verification',
      dependencies: ['react-hook-form', 'zod'],
      features: ['Step 1: Email + password', 'Step 2: OTP verification', 'Step 3: Profile details', 'Step 4: Passkey enrollment offer', 'Terms of service acceptance', 'Guest cart merge prompt'],
    },
    {
      name: 'PasskeySetupPage',
      type: 'page',
      description: 'Passkey registration and management',
      dependencies: ['@simplewebauthn/browser'],
      features: ['Create new passkey button', 'Device name input', 'Existing passkey list with delete', 'Fallback password option'],
    },

    // ─── Core Shopping Pages ─────────────────────────────────────────────────
    {
      name: 'HomePage',
      type: 'page',
      description: 'Curated homepage with discovery carousels and personalization',
      dependencies: ['@tanstack/react-query', 'framer-motion'],
      features: ['Hero banner with video background', 'Featured categories grid', '"New Arrivals" carousel', 'Personalized "For You" section', 'Trending now carousel', 'Newsletter signup', 'Trust badges and social proof'],
    },
    {
      name: 'CategoryPage',
      type: 'page',
      description: 'Category landing page with subcategories and featured products',
      dependencies: ['@tanstack/react-query'],
      features: ['Category breadcrumbs', 'Subcategory cards', 'Featured products grid', 'Category description with rich media', 'Filter sidebar integration', 'Sort controls'],
    },
    {
      name: 'ProductListingPage',
      type: 'page',
      description: 'Product grid with faceted filtering, sorting, and pagination',
      dependencies: ['@tanstack/react-query', '@tanstack/react-virtual'],
      features: ['URL-synchronized filter state', 'Faceted sidebar (brand, price, rating, in_stock)', 'Sort dropdown (price, rating, newest)', 'View toggle (grid/list)', 'Virtualized infinite scroll', 'Active filter chips', 'Result count and share'],
    },
    {
      name: 'ProductDetailPage',
      type: 'page',
      description: 'Full product page with media gallery, variants, reviews, and add-to-cart',
      dependencies: ['@tanstack/react-query', 'framer-motion'],
      features: ['Progressive image gallery with zoom loupe', 'Variant selector (color, size, etc.) with URL sync', 'Real-time price and stock badge update', 'Add to cart with quantity stepper', 'Breadcrumb navigation', 'Sticky add-to-cart on mobile', '"Frequently Bought Together" widget', 'Product description tabs (overview, specs, shipping)', 'Review section with filter/sort', 'Q&A section', 'JSON-LD structured data'],
    },
    {
      name: 'CartPage',
      type: 'page',
      description: 'Shopping cart with line items, promo code, and checkout CTA',
      dependencies: ['@tanstack/react-query', 'framer-motion'],
      features: ['Line item cards with image, title, variant, price', 'Quantity stepper with real-time total recalculation', 'Remove and save-for-later actions', 'Promo code input with validation', 'Order summary sidebar (subtotal, discount, shipping estimate, tax, grand total)', 'Price-change diff banners', '"Continue Shopping" link', 'Trust badges near checkout button', 'Abandoned cart recovery consent'],
    },
    {
      name: 'CheckoutPage',
      type: 'page',
      description: 'Multi-step checkout with address, shipping, payment, and review',
      dependencies: ['@tanstack/react-query', '@stripe/react-stripe-js'],
      features: ['Step indicator (Shipping → Payment → Review)', 'Address selection/creation with autocomplete', 'Shipping method selection with rates', 'Payment element (card, Apple Pay, Google Pay, BNPL)', 'Promo code redemption', 'Order summary sidebar', 'SSL/security trust indicators', 'Guest checkout option', 'CLS = 0 guaranteed'],
    },
    {
      name: 'OrderConfirmationPage',
      type: 'page',
      description: 'Post-purchase confirmation with order summary and tracking CTA',
      dependencies: ['@tanstack/react-query'],
      features: ['Order number and status display', 'Estimated delivery date', 'Payment confirmation', 'Items ordered summary', 'Shipping address confirmation', 'Add to calendar for delivery', 'Email receipt display', 'Continue shopping suggestions'],
    },
    {
      name: 'OrderHistoryPage',
      type: 'page',
      description: 'Customer order history with status filters and reorder',
      dependencies: ['@tanstack/react-query', '@tanstack/react-table'],
      features: ['Order cards with status badges', 'Filter by status (all, pending, shipped, delivered)', 'Expandable order detail', 'Track package button', 'Buy again / reorder button', 'Return/request support button', 'Invoice download', 'Pagination'],
    },

    // ─── Wishlist & Saved Items ──────────────────────────────────────────────
    {
      name: 'WishlistPage',
      type: 'page',
      description: 'Multi-list wishlist management',
      dependencies: ['@tanstack/react-query'],
      features: ['List selector tabs', 'Add to cart from wishlist', 'Move to cart / remove', 'Price drop alerts', 'Share wishlist link', 'Gift registry mode (purchased/desired)'],
    },

    // ─── Reviews & Community ─────────────────────────────────────────────────
    {
      name: 'ReviewFormPage',
      type: 'page',
      description: 'Multi-step review submission with media upload',
      dependencies: ['react-dropzone', '@tanstack/react-query'],
      features: ['Star rating with sub-ratings', 'Title and body textarea', 'Photo/video upload with drag-drop', 'Moderation status badge', 'Anonymous review option', 'Verified purchase indicator'],
    },
    {
      name: 'QAPage',
      type: 'page',
      description: 'Product Q&A community section',
      dependencies: ['@tanstack/react-query'],
      features: ['Ask a question form', 'Answer list with upvotes', 'Best answer pinning', 'Sort by helpful/recent', 'Merchant answer badge'],
    },

    // ─── Account Management Pages ────────────────────────────────────────────
    {
      name: 'AccountDashboardPage',
      type: 'page',
      description: 'Unified customer account dashboard',
      dependencies: ['@tanstack/react-query', 'recharts'],
      features: ['Order summary cards', 'Recently ordered items', 'Saved addresses management', 'Payment methods list', 'Loyalty points balance and tier', 'Notification preferences', 'Account settings links'],
    },
    {
      name: 'ProfileSettingsPage',
      type: 'page',
      description: 'Profile, security, and preference settings',
      dependencies: ['react-hook-form', 'zod'],
      features: ['Personal info editor', 'Password change', 'MFA enrollment/management', 'Passkey management', 'Email/phone change with OTP', 'Language and currency preferences', 'Communication preferences'],
    },
    {
      name: 'SessionsManagementPage',
      type: 'page',
      description: 'Active session management with revoke controls',
      dependencies: ['@tanstack/react-query'],
      features: ['Device list with icons (desktop/mobile/tablet)', 'GeoIP location display', 'Last active timestamp', 'One-click "Revoke Session"', '"Sign out of all other devices" button', 'Current session highlighted'],
    },

    // ─── Shared Components ───────────────────────────────────────────────────
    {
      name: 'ProductCard',
      type: 'component',
      description: 'Product catalog card with image, title, price, rating, and quick-add',
      dependencies: ['framer-motion'],
      features: ['Progressive image with BlurHash placeholder', 'Price display with sale badge', 'Star rating display', 'Quick add-to-cart button', 'Save to wishlist heart icon', 'Hover zoom effect', 'Aspect-ratio container for zero CLS'],
    },
    {
      name: 'SearchBar',
      type: 'component',
      description: 'Global search with autocomplete and recent searches',
      dependencies: ['@tanstack/react-query', 'fuse.js'],
      features: ['Debounced input (200ms)', 'Autocomplete dropdown with product/category results', 'Recent searches', 'Trending searches', 'Keyboard navigation (Arrow keys + Enter)', 'Clear button', 'Mobile: expands to full-width overlay'],
    },
    {
      name: 'FacetedFilterSidebar',
      type: 'component',
      description: 'Collapsible faceted filter panel with live counts',
      dependencies: ['@tanstack/react-query'],
      features: ['Category tree with counts', 'Price range slider (integer-cents aware)', 'Brand multi-select checkboxes', 'Rating star filter', 'In-stock only toggle', 'URL-synchronized filter state', 'Clear all filters button', 'Mobile: bottom sheet drawer'],
    },
    {
      name: 'CartDrawer',
      type: 'component',
      description: 'Slide-out cart drawer with mini cart items and checkout CTA',
      dependencies: ['framer-motion', '@tanstack/react-query'],
      features: ['Slide animation from right', 'Cart item list with images', 'Quantity adjustment', 'Subtotal display', 'View cart and Checkout buttons', 'Free shipping progress bar', 'Empty state with product suggestions'],
    },
    {
      name: 'NotificationCenter',
      type: 'component',
      description: 'In-app notification dropdown and full center page',
      dependencies: ['@tanstack/react-query'],
      features: ['Unread count badge', 'Grouped by time (Today, Yesterday, Earlier)', 'Read/unread state', 'Mark all as read', 'Notification type icons (order, promotion, system)', 'ARIA live region for new notifications'],
    },
    {
      name: 'StarRating',
      type: 'component',
      description: 'Interactive star rating with half-star support',
      dependencies: [],
      features: ['1-5 star display and input', 'Half-star precision', 'Rating count display', 'Read-only and interactive modes', 'Hover preview', 'Accessible ARIA labels'],
    },
    {
      name: 'ImageGallery',
      type: 'component',
      description: 'Progressive image gallery with zoom, 360, and 3D model viewer',
      dependencies: ['yet-another-react-lightbox'],
      features: ['Main image with navigation arrows', 'Thumbnail strip', 'Pinch-to-zoom loupe', '360-degree turntable viewer', '3D model viewer (Three.js/GLTF)', 'Video playback support', 'LQIP/BlurHash placeholder', 'Keyboard navigation'],
    },
    {
      name: 'VariantSelector',
      type: 'component',
      description: 'Dynamic variant selector with real-time attribute updates',
      dependencies: ['framer-motion'],
      features: ['Color swatches, size buttons, dropdown selects', 'Disabled state for unavailable variants', 'Real-time price and stock update', 'URL query parameter sync', 'Animated transition on change', 'Accessibility: keyboard navigable'],
    },
    {
      name: 'OrderTrackingMap',
      type: 'component',
      description: 'Real-time order tracking with map and timeline',
      dependencies: ['@turf/turf', 'framer-motion'],
      features: ['WebSocket live position updates', 'Smooth coordinate interpolation', 'Route polyline drawing', '5-stage animated status bar', 'Courier contact button', 'Estimated delivery countdown', 'Static fallback for offline'],
    },
    {
      name: 'BookingCalendar',
      type: 'component',
      description: 'Time-slot booking calendar with availability matrix',
      dependencies: ['react-big-calendar', '@tanstack/react-query'],
      features: ['Month/week/day view toggle', 'Available slot highlighting', 'Selected slot confirmation', 'Timezone display (IANA)', 'Buffer time visualization', 'Waitlist join option', 'Deposit amount display'],
    },
    {
      name: 'ModifierTree',
      type: 'component',
      description: 'Nested product modifier selector (drinks, food customizations)',
      dependencies: ['framer-motion'],
      features: ['Grouped modifiers (milk, size, extras)', 'Min/max cardinality enforcement', 'Per-modifier price adjustment', 'Real-time calorie/caffeine/allergen display', 'Fractional quantities (Light/Regular/Extra)', 'Visual selection states (radio/checkbox/stepper)'],
    },
    {
      name: 'ReviewCard',
      type: 'component',
      description: 'Individual review display with media, voting, and merchant response',
      dependencies: [],
      features: ['Star rating + sub-ratings', 'Review body with markdown', 'Customer photo/video strip', 'Verified purchase badge', 'Helpful upvote/downvote buttons', 'Merchant response section', 'Review date and variant info'],
    },
    {
      name: 'ChatWidget',
      type: 'component',
      description: 'AI copilot chat widget with inline citations',
      dependencies: ['@tanstack/react-query'],
      features: ['Floating chat bubble', 'Message history with markdown', 'Citation cards with hover preview', 'Tool call approval cards (HITL)', 'Typing indicator', 'Suggested follow-up questions', 'Context-aware (order, product)'],
    },
    {
      name: 'LoadingSkeleton',
      type: 'component',
      description: 'Deterministic skeleton loaders matching exact final DOM geometry',
      dependencies: [],
      features: ['Aspect-ratio matching', 'Shimmer animation', 'Variants: product card, list item, text block', 'Respects prefers-reduced-motion', 'Zero CLS guarantee'],
    },
    {
      name: 'ToastNotification',
      type: 'component',
      description: 'Toast notification system with queue and auto-dismiss',
      dependencies: ['framer-motion'],
      features: ['Stacking animations', 'Auto-dismiss with progress bar', 'Action buttons (undo, view)', 'Success/warning/error/info variants', 'ARIA live region', 'Keyboard dismiss (Escape)'],
    },
    {
      name: 'PriceDisplay',
      type: 'component',
      description: 'Intelligent price display with currency formatting and animations',
      dependencies: [],
      features: ['Integer-cent safe formatting (handles JPY 0-decimal, BHD 3-decimal)', 'Currency symbol positioning', 'Strikethrough for sale prices', 'Animated price change transitions', 'Localized formatting (Intl.NumberFormat)', 'Tax-inclusive/exclusive display mode'],
    },
    {
      name: 'Footer',
      type: 'component',
      description: 'Site footer with links, trust signals, and compliance',
      dependencies: [],
      features: ['Multi-column link grid', 'Social media icons', 'Payment method icons', 'Trust badges and certifications', 'Newsletter signup', 'Language/currency selector', 'GDPR consent links', 'Copyright and legal links'],
    },
    {
      name: 'AccessibilityProvider',
      type: 'component',
      description: 'A11y context provider with focus management and skip links',
      dependencies: ['@radix-ui/react-focus-guards', '@radix-ui/react-visually-hidden'],
      features: ['Skip to content link', 'Focus trap for modals', 'Focus restoration on modal close', 'Live region announcements', 'Keyboard shortcut registry', 'High contrast mode detection'],
    },
  ];
}
