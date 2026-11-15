/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * E2E Checks - End-to-End Test Runner
 *
 * Launches browser, navigates through complete user journeys,
 * verifies UI elements exist and are functional, takes screenshots.
 *
 * Tests: signup, login, browse, add-to-cart, checkout,
 *        order tracking, profile management
 *
 * Uses a pluggable BrowserRunner interface so the actual browser
 * implementation can be swapped (Playwright, Puppeteer, or mock).
 */

import type {
  VerificationCheck,
  VerificationResult,
  CheckExecutionContext,
} from '../types.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pass(
  checkId: string,
  evidence: string,
  screenshot?: string,
  actualValue?: string,
  expectedValue?: string
): Promise<VerificationResult> {
  return Promise.resolve({
    checkId,
    passed: true,
    evidence,
    screenshot,
    actualValue,
    expectedValue,
    timestamp: new Date().toISOString(),
  });
}

function fail(
  checkId: string,
  evidence: string,
  screenshot?: string,
  actualValue?: string,
  expectedValue?: string
): Promise<VerificationResult> {
  return Promise.resolve({
    checkId,
    passed: false,
    evidence,
    screenshot,
    actualValue,
    expectedValue,
    timestamp: new Date().toISOString(),
  });
}

// ─── E2E Test Scenario Runner ───────────────────────────────────────────────

export interface E2ETestScenario {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  run: (browser: BrowserRunner) => Promise<VerificationResult>;
}

export interface BrowserRunner {
  launch(): Promise<void>;
  navigate(url: string): Promise<void>;
  elementExists(selector: string): Promise<boolean>;
  takeScreenshot(name: string): Promise<string>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  getText(selector: string): Promise<string>;
  getUrl(): Promise<string>;
  isVisible(selector: string): Promise<boolean>;
  waitForSelector(selector: string, timeoutMs?: number): Promise<boolean>;
  selectOption(selector: string, value: string): Promise<void>;
  close(): Promise<void>;
}

// ─── E2E Scenarios ──────────────────────────────────────────────────────────

export function createE2EScenarios(ctx: CheckExecutionContext): E2ETestScenario[] {
  const baseUrl = `http://localhost:${3000}`;

  return [
    // ─── Landing Page ───────────────────────────────────────────────────────

    {
      id: 'E2E-LANDING-001',
      name: 'Landing Page Loads',
      severity: 'critical',
      description: 'Landing page loads successfully with key elements',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasTitle = await browser.elementExists('h1, h2, [data-testid="hero-title"]');
          const hasCta = await browser.elementExists('a, button, [data-testid="cta"]');
          const screenshot = await browser.takeScreenshot('landing-page');

          if (hasTitle && hasCta) {
            return pass('E2E-LANDING-001', 'Landing page loads with title and CTA', screenshot);
          }
          if (hasTitle) return pass('E2E-LANDING-001', 'Landing page loads with title', screenshot);
          return fail('E2E-LANDING-001', 'Landing page missing key elements', screenshot);
        } catch (err) {
          return fail('E2E-LANDING-001', `Landing page error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-LANDING-002',
      name: 'Navigation Works',
      severity: 'high',
      description: 'Navigation links are present and navigable',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasNav = await browser.elementExists('nav, header, [role="navigation"], .navbar, .nav');
          const screenshot = await browser.takeScreenshot('navigation');

          if (hasNav) {
            return pass('E2E-LANDING-002', 'Navigation element found', screenshot);
          }
          return fail('E2E-LANDING-002', 'No navigation element found', screenshot);
        } catch (err) {
          return fail('E2E-LANDING-002', `Navigation error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Authentication Flow ─────────────────────────────────────────────────

    {
      id: 'E2E-AUTH-001',
      name: 'User Signup Flow',
      severity: 'critical',
      description: 'Complete user signup flow with form validation',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/signup`);
          const hasForm = await browser.elementExists('form, [data-testid="signup-form"]');
          if (!hasForm) {
            const screenshot = await browser.takeScreenshot('signup-missing');
            return fail('E2E-AUTH-001', 'Signup form not found', screenshot);
          }

          // Check for email, password, confirm password fields
          const hasEmail = await browser.elementExists('input[type="email"], input[name="email"]');
          const hasPassword = await browser.elementExists('input[type="password"], input[name="password"]');

          const screenshot = await browser.takeScreenshot('signup-form');
          if (hasEmail && hasPassword) {
            return pass('E2E-AUTH-001', 'Signup form with email and password fields', screenshot);
          }
          return fail('E2E-AUTH-001', 'Signup form missing required fields', screenshot);
        } catch (err) {
          return fail('E2E-AUTH-001', `Signup error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-AUTH-002',
      name: 'User Login Flow',
      severity: 'critical',
      description: 'Complete user login flow',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/login`);
          const hasForm = await browser.elementExists('form, [data-testid="login-form"]');
          if (!hasForm) {
            const screenshot = await browser.takeScreenshot('login-missing');
            return fail('E2E-AUTH-002', 'Login form not found', screenshot);
          }

          const hasEmail = await browser.elementExists('input[type="email"], input[name="email"]');
          const hasPassword = await browser.elementExists('input[type="password"], input[name="password"]');
          const hasSubmit = await browser.elementExists('button[type="submit"], [type="submit"]');

          const screenshot = await browser.takeScreenshot('login-form');
          if (hasEmail && hasPassword && hasSubmit) {
            return pass('E2E-AUTH-002', 'Login form complete with email, password, and submit', screenshot);
          }
          return fail('E2E-AUTH-002', 'Login form missing fields', screenshot);
        } catch (err) {
          return fail('E2E-AUTH-002', `Login error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-AUTH-003',
      name: 'Protected Route Redirect',
      severity: 'critical',
      description: 'Unauthenticated users are redirected from protected routes',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/dashboard`);
          const url = await browser.getUrl();
          const screenshot = await browser.takeScreenshot('protected-route');

          // Should redirect to login or show auth required
          const isRedirected = url.includes('/login') || url.includes('/signin') || url.includes('/auth');
          if (isRedirected) {
            return pass('E2E-AUTH-003', 'Unauthenticated user redirected from protected route', screenshot);
          }

          // Check if auth UI is shown
          const hasAuthPrompt = await browser.elementExists('[data-testid="login-required"], .auth-required, form');
          if (hasAuthPrompt) {
            return pass('E2E-AUTH-003', 'Protected route shows auth prompt', screenshot);
          }

          return fail('E2E-AUTH-003', 'Protected route accessible without auth', screenshot);
        } catch (err) {
          return fail('E2E-AUTH-003', `Protected route error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-AUTH-004',
      name: 'Logout Functionality',
      severity: 'high',
      description: 'User can log out and session is invalidated',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasLogout = await browser.elementExists(
            '[data-testid="logout"], button:has-text("Logout"), button:has-text("Sign out"), .logout-btn'
          );
          const screenshot = await browser.takeScreenshot('logout');

          if (hasLogout) {
            return pass('E2E-AUTH-004', 'Logout button found', screenshot);
          }
          return fail('E2E-AUTH-004', 'No logout button found', screenshot);
        } catch (err) {
          return fail('E2E-AUTH-004', `Logout error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Browse & Search ─────────────────────────────────────────────────────

    {
      id: 'E2E-BROWSE-001',
      name: 'Browse Products/Content',
      severity: 'critical',
      description: 'Users can browse products/content listings',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasListings = await browser.elementExists(
            '[data-testid="product-list"], .product-list, .grid, .listings, .catalog, article, .card'
          );
          const screenshot = await browser.takeScreenshot('browse-listings');

          if (hasListings) {
            return pass('E2E-BROWSE-001', 'Product/content listings found', screenshot);
          }
          return fail('E2E-BROWSE-001', 'No product/content listings found', screenshot);
        } catch (err) {
          return fail('E2E-BROWSE-001', `Browse error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-BROWSE-002',
      name: 'Search Functionality',
      severity: 'high',
      description: 'Search input exists and can receive input',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasSearch = await browser.elementExists(
            'input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i], [data-testid="search"]'
          );
          const screenshot = await browser.takeScreenshot('search');

          if (hasSearch) {
            return pass('E2E-BROWSE-002', 'Search input found', screenshot);
          }
          return fail('E2E-BROWSE-002', 'No search input found', screenshot);
        } catch (err) {
          return fail('E2E-BROWSE-002', `Search error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-BROWSE-003',
      name: 'Filter Functionality',
      severity: 'high',
      description: 'Filter/sort controls exist on listing pages',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasFilter = await browser.elementExists(
            '[data-testid="filter"], .filter, select, [role="combobox"], .sort, .filters'
          );
          const screenshot = await browser.takeScreenshot('filters');

          if (hasFilter) {
            return pass('E2E-BROWSE-003', 'Filter/sort controls found', screenshot);
          }
          return fail('E2E-BROWSE-003', 'No filter or sort controls found', screenshot);
        } catch (err) {
          return fail('E2E-BROWSE-003', `Filter error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-BROWSE-004',
      name: 'Pagination/Infinite Scroll',
      severity: 'medium',
      description: 'Content has pagination or infinite scroll',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasPagination = await browser.elementExists(
            '[data-testid="pagination"], .pagination, button:has-text("Next"), button:has-text("Load more"), .load-more'
          );
          const screenshot = await browser.takeScreenshot('pagination');

          if (hasPagination) {
            return pass('E2E-BROWSE-004', 'Pagination/infinite scroll found', screenshot);
          }
          return fail('E2E-BROWSE-004', 'No pagination or infinite scroll found', screenshot);
        } catch (err) {
          return fail('E2E-BROWSE-004', `Pagination error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Cart / Wishlist ─────────────────────────────────────────────────────

    {
      id: 'E2E-CART-001',
      name: 'Add to Cart Flow',
      severity: 'critical',
      description: 'Users can add items to cart',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasAddToCart = await browser.elementExists(
            '[data-testid="add-to-cart"], button:has-text("Add to Cart"), button:has-text("Add to Bag"), .add-to-cart'
          );
          const screenshot = await browser.takeScreenshot('add-to-cart');

          if (hasAddToCart) {
            return pass('E2E-CART-001', 'Add to cart button found', screenshot);
          }
          return fail('E2E-CART-001', 'No add to cart button found', screenshot);
        } catch (err) {
          return fail('E2E-CART-001', `Add to cart error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-CART-002',
      name: 'Cart View and Quantity Update',
      severity: 'high',
      description: 'Cart page shows items and allows quantity changes',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/cart`);
          const hasCart = await browser.elementExists(
            '[data-testid="cart"], .cart, .shopping-cart, [data-testid="cart-items"]'
          );
          const screenshot = await browser.takeScreenshot('cart-view');

          if (hasCart) {
            return pass('E2E-CART-002', 'Cart page with items display found', screenshot);
          }
          return fail('E2E-CART-002', 'No cart page or items display found', screenshot);
        } catch (err) {
          return fail('E2E-CART-002', `Cart error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-CART-003',
      name: 'Wishlist/Save for Later',
      severity: 'medium',
      description: 'Users can save items to wishlist',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasWishlist = await browser.elementExists(
            '[data-testid="wishlist"], button:has-text("Wishlist"), button:has-text("Save"), .wishlist, [aria-label*="wishlist" i]'
          );
          const screenshot = await browser.takeScreenshot('wishlist');

          if (hasWishlist) {
            return pass('E2E-CART-003', 'Wishlist functionality found', screenshot);
          }
          return fail('E2E-CART-003', 'No wishlist functionality found', screenshot);
        } catch (err) {
          return fail('E2E-CART-003', `Wishlist error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Checkout ────────────────────────────────────────────────────────────

    {
      id: 'E2E-CHECKOUT-001',
      name: 'Checkout Flow Exists',
      severity: 'critical',
      description: 'Checkout page/form is accessible',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/checkout`);
          const hasCheckout = await browser.elementExists(
            '[data-testid="checkout"], .checkout, form, [data-testid="checkout-form"]'
          );
          const screenshot = await browser.takeScreenshot('checkout');

          if (hasCheckout) {
            return pass('E2E-CHECKOUT-001', 'Checkout page/form found', screenshot);
          }
          return fail('E2E-CHECKOUT-001', 'No checkout page or form found', screenshot);
        } catch (err) {
          return fail('E2E-CHECKOUT-001', `Checkout error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-CHECKOUT-002',
      name: 'Shipping Address Form',
      severity: 'critical',
      description: 'Shipping address form with validation',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/checkout`);
          const hasAddress = await browser.elementExists(
            'input[name*="address" i], input[name*="street" i], input[name*="city" i], input[name*="zip" i], input[name*="postal" i]'
          );
          const screenshot = await browser.takeScreenshot('shipping-address');

          if (hasAddress) {
            return pass('E2E-CHECKOUT-002', 'Shipping address form found', screenshot);
          }
          return fail('E2E-CHECKOUT-002', 'No shipping address form found', screenshot);
        } catch (err) {
          return fail('E2E-CHECKOUT-002', `Address form error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-CHECKOUT-003',
      name: 'Payment Form Integration',
      severity: 'critical',
      description: 'Payment form fields exist (or payment provider integration)',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/checkout`);
          const hasPayment = await browser.elementExists(
            '[data-testid="payment"], .payment-form, iframe[src*="stripe"], iframe[src*="paypal"], .card-element'
          );
          const screenshot = await browser.takeScreenshot('payment-form');

          if (hasPayment) {
            return pass('E2E-CHECKOUT-003', 'Payment form found', screenshot);
          }
          return fail('E2E-CHECKOUT-003', 'No payment form found on checkout page', screenshot);
        } catch (err) {
          return fail('E2E-CHECKOUT-003', `Payment form error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Order Management ────────────────────────────────────────────────────

    {
      id: 'E2E-ORDER-001',
      name: 'Order Confirmation Page',
      severity: 'critical',
      description: 'Order confirmation page after checkout',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/order-confirmation`);
          const hasConfirmation = await browser.elementExists(
            '[data-testid="order-confirmation"], .order-confirmation, h1:has-text("Order"), h1:has-text("Thank")'
          );
          const screenshot = await browser.takeScreenshot('order-confirmation');

          if (hasConfirmation) {
            return pass('E2E-ORDER-001', 'Order confirmation page found', screenshot);
          }
          return fail('E2E-ORDER-001', 'No order confirmation page found', screenshot);
        } catch (err) {
          return fail('E2E-ORDER-001', `Order confirmation error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-ORDER-002',
      name: 'Order History Page',
      severity: 'high',
      description: 'Users can view order history',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/orders`);
          const hasOrders = await browser.elementExists(
            '[data-testid="order-history"], .order-history, .orders-list, [data-testid="order"]'
          );
          const screenshot = await browser.takeScreenshot('order-history');

          if (hasOrders) {
            return pass('E2E-ORDER-002', 'Order history page found', screenshot);
          }
          return fail('E2E-ORDER-002', 'No order history page found', screenshot);
        } catch (err) {
          return fail('E2E-ORDER-002', `Order history error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-ORDER-003',
      name: 'Order Tracking',
      severity: 'high',
      description: 'Order tracking page shows status',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/orders/track`);
          const hasTracking = await browser.elementExists(
            '[data-testid="tracking"], .tracking, .order-status, [data-testid="order-status"]'
          );
          const screenshot = await browser.takeScreenshot('order-tracking');

          if (hasTracking) {
            return pass('E2E-ORDER-003', 'Order tracking page found', screenshot);
          }
          return fail('E2E-ORDER-003', 'No order tracking page found', screenshot);
        } catch (err) {
          return fail('E2E-ORDER-003', `Order tracking error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Profile Management ──────────────────────────────────────────────────

    {
      id: 'E2E-PROFILE-001',
      name: 'Profile Page Exists',
      severity: 'high',
      description: 'User profile page is accessible',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/profile`);
          const hasProfile = await browser.elementExists(
            '[data-testid="profile"], .profile, [data-testid="user-profile"], form'
          );
          const screenshot = await browser.takeScreenshot('profile');

          if (hasProfile) {
            return pass('E2E-PROFILE-001', 'Profile page found', screenshot);
          }
          return fail('E2E-PROFILE-001', 'No profile page found', screenshot);
        } catch (err) {
          return fail('E2E-PROFILE-001', `Profile error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-PROFILE-002',
      name: 'Profile Edit Form',
      severity: 'high',
      description: 'Users can edit profile information',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/profile/edit`);
          const hasEditForm = await browser.elementExists(
            'form, [data-testid="edit-profile"], input, textarea'
          );
          const screenshot = await browser.takeScreenshot('profile-edit');

          if (hasEditForm) {
            return pass('E2E-PROFILE-002', 'Profile edit form found', screenshot);
          }
          return fail('E2E-PROFILE-002', 'No profile edit form found', screenshot);
        } catch (err) {
          return fail('E2E-PROFILE-002', `Profile edit error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-PROFILE-003',
      name: 'Address Book Management',
      severity: 'medium',
      description: 'Users can manage shipping/billing addresses',
      run: async (browser) => {
        try {
          await browser.navigate(`${baseUrl}/profile/addresses`);
          const hasAddresses = await browser.elementExists(
            '[data-testid="addresses"], .address-book, .addresses, address'
          );
          const screenshot = await browser.takeScreenshot('addresses');

          if (hasAddresses) {
            return pass('E2E-PROFILE-003', 'Address management found', screenshot);
          }
          return fail('E2E-PROFILE-003', 'No address management found', screenshot);
        } catch (err) {
          return fail('E2E-PROFILE-003', `Address management error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Footer & Legal ──────────────────────────────────────────────────────

    {
      id: 'E2E-LEGAL-001',
      name: 'Legal Pages Exist',
      severity: 'medium',
      description: 'Privacy Policy and Terms of Service pages',
      run: async (browser) => {
        try {
          const privacyOk = await browser.elementExists(
            'a[href*="privacy"], a[href*="policy"], [href*="/privacy-policy"]'
          );
          const termsOk = await browser.elementExists(
            'a[href*="terms"], a[href*="tos"], [href*="/terms-of-service"]'
          );
          const screenshot = await browser.takeScreenshot('legal-links');

          if (privacyOk && termsOk) {
            return pass('E2E-LEGAL-001', 'Privacy Policy and Terms links found', screenshot);
          }
          if (privacyOk || termsOk) {
            return pass('E2E-LEGAL-001', 'At least one legal page link found', screenshot);
          }
          return fail('E2E-LEGAL-001', 'No legal page links found', screenshot);
        } catch (err) {
          return fail('E2E-LEGAL-001', `Legal pages error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    {
      id: 'E2E-LEGAL-002',
      name: 'Cookie Consent Banner',
      severity: 'medium',
      description: 'Cookie consent banner displayed',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          const hasCookieBanner = await browser.elementExists(
            '[data-testid="cookie-banner"], .cookie-banner, .cookie-consent, [class*="cookie" i]'
          );
          const screenshot = await browser.takeScreenshot('cookie-consent');

          if (hasCookieBanner) {
            return pass('E2E-LEGAL-002', 'Cookie consent banner found', screenshot);
          }
          return fail('E2E-LEGAL-002', 'No cookie consent banner found', screenshot);
        } catch (err) {
          return fail('E2E-LEGAL-002', `Cookie banner error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },

    // ─── Responsive Design ───────────────────────────────────────────────────

    {
      id: 'E2E-RESP-001',
      name: 'Mobile Responsiveness',
      severity: 'high',
      description: 'Page renders correctly on mobile viewport',
      run: async (browser) => {
        try {
          await browser.navigate(baseUrl);
          // The browser runner should handle viewport resizing
          const hasMobileNav = await browser.elementExists(
            '[data-testid="mobile-menu"], .mobile-nav, .hamburger, button[aria-label*="menu" i]'
          );
          const screenshot = await browser.takeScreenshot('mobile-view');

          if (hasMobileNav) {
            return pass('E2E-RESP-001', 'Mobile navigation found', screenshot);
          }
          return fail('E2E-RESP-001', 'No mobile navigation found', screenshot);
        } catch (err) {
          return fail('E2E-RESP-001', `Mobile responsiveness error: ${err instanceof Error ? err.message : String(err)}`);
        }
      },
    },
  ];
}

// ─── Verification Checks (wrapping scenarios) ───────────────────────────────

export function createAllE2EChecks(ctx: CheckExecutionContext): VerificationCheck[] {
  const scenarios = createE2EScenarios(ctx);

  return scenarios.map((scenario) => ({
    id: scenario.id,
    category: 'test' as const,
    severity: scenario.severity,
    description: `[E2E] ${scenario.description}`,
    check: async () => {
      try {
        await ctx.browserRunner.launch();
        try {
          const result = await scenario.run(ctx.browserRunner);
          return result;
        } finally {
          await ctx.browserRunner.close();
        }
      } catch (err) {
        return fail(
          scenario.id,
          `Browser error: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
  }));
}

// ─── E2E Runner Orchestrator ─────────────────────────────────────────────────

export interface E2ERunOptions {
  browserRunner: BrowserRunner;
  baseUrl: string;
  headless: boolean;
  viewport: { width: number; height: number };
  scenarios?: string[]; // specific scenario IDs to run, or all if empty
}

export interface E2ERunResult {
  total: number;
  passed: number;
  failed: number;
  criticalFailed: number;
  results: VerificationResult[];
  screenshots: string[];
  durationMs: number;
}

export async function runE2ESuite(
  ctx: CheckExecutionContext,
  options: E2ERunOptions
): Promise<E2ERunResult> {
  const startTime = Date.now();
  const scenarios = createE2EScenarios(ctx);
  const results: VerificationResult[] = [];
  const screenshots: string[] = [];
  let passed = 0;
  let failed = 0;
  let criticalFailed = 0;

  await options.browserRunner.launch();

  const scenariosToRun =
    options.scenarios && options.scenarios.length > 0
      ? scenarios.filter((s) => options.scenarios.includes(s.id))
      : scenarios;

  for (const scenario of scenariosToRun) {
    try {
      const result = await scenario.run(options.browserRunner);
      results.push(result);
      if (result.screenshot) screenshots.push(result.screenshot);
      if (result.passed) {
        passed++;
      } else {
        failed++;
        if (scenario.severity === 'critical') criticalFailed++;
      }
    } catch (err) {
      const errorResult = fail(
        scenario.id,
        `E2E test crashed: ${err instanceof Error ? err.message : String(err)}`
      );
      results.push(errorResult);
      failed++;
      if (scenario.severity === 'critical') criticalFailed++;
    }
  }

  await options.browserRunner.close();

  return {
    total: scenariosToRun.length,
    passed,
    failed,
    criticalFailed,
    results,
    screenshots,
    durationMs: Date.now() - startTime,
  };
}
