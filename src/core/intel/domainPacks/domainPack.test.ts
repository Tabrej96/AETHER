/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Domain Pack Tests
 *
 * Validates that all registered domain packs meet minimum requirements for
 * benchmark generation: required fields, minimum features, business rules,
 * security, testing, and design specifications.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  DOMAIN_PACKS,
  getPack,
  hasPack,
  getAllPackIds,
  getAllPacks,
  getPackSummaries,
  validatePack,
} from './index.js';
import { COFFEE_SHOP_PACK } from './coffeeShop.js';
import { ECOMMERCE_PACK } from './ecommerce.js';
import { SAAS_PACK } from './saas.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Collect all feature strings from a domain pack across all sections.
 * Handles the different shapes of coffee_shop, ecommerce, and saas packs.
 */
function collectFeatures(pack: Record<string, unknown>): string[] {
  const features: string[] = [];

  // ── Coffee shop sections ──────────────────────────────────────────────
  const fulfillment = pack.fulfillment as Record<string, unknown> | undefined;
  if (fulfillment && Array.isArray(fulfillment.features)) {
    features.push(...(fulfillment.features as string[]));
  }

  const operations = pack.operations as Record<string, unknown> | undefined;
  if (operations && Array.isArray(operations.features)) {
    features.push(...(operations.features as string[]));
  }

  const experience = pack.experience as Record<string, unknown> | undefined;
  if (experience && Array.isArray(experience.features)) {
    features.push(...(experience.features as string[]));
  }

  // ── Catalog features (coffee_shop and ecommerce) ──────────────────────
  const catalog = pack.catalog as Record<string, unknown> | undefined;
  if (catalog) {
    if (Array.isArray(catalog.features)) features.push(...(catalog.features as string[]));
    if (Array.isArray(catalog.variantTypes)) features.push(...(catalog.variantTypes as string[]));
    if (Array.isArray(catalog.filterDimensions)) features.push(...(catalog.filterDimensions as string[]));
  }

  // ── Customer features (coffee_shop and ecommerce) ─────────────────────
  const customer = pack.customer as Record<string, unknown> | undefined;
  if (customer && Array.isArray(customer.features)) {
    features.push(...(customer.features as string[]));
  }

  // ── Ecommerce-specific sections ───────────────────────────────────────
  const cart = pack.cart as Record<string, unknown> | undefined;
  if (cart && Array.isArray(cart.features)) features.push(...(cart.features as string[]));

  const checkout = pack.checkout as Record<string, unknown> | undefined;
  if (checkout && Array.isArray(checkout.features)) features.push(...(checkout.features as string[]));

  const orders = pack.orders as Record<string, unknown> | undefined;
  if (orders && Array.isArray(orders.features)) features.push(...(orders.features as string[]));

  const recommendations = pack.recommendations as Record<string, unknown> | undefined;
  if (recommendations && Array.isArray(recommendations.algorithms)) {
    features.push(...(recommendations.algorithms as string[]));
  }

  // ── Components (coffee_shop and ecommerce) ────────────────────────────
  const components = pack.components as Record<string, string[]> | undefined;
  if (components) {
    for (const group of ['public', 'customer', 'admin', 'staff'] as const) {
      if (Array.isArray(components[group])) {
        features.push(...components[group]);
      }
    }
  }

  // ── SaaS-specific sections ────────────────────────────────────────────
  const plans = pack.plans as Array<{ id: string; features: string[] }> | undefined;
  if (Array.isArray(plans)) {
    for (const plan of plans) {
      features.push(`plan:${plan.id}`);
      features.push(...plan.features);
    }
  }

  const roles = pack.roles as { roles: Array<{ name: string }>; features: string[] } | undefined;
  if (roles) {
    features.push(...roles.roles.map((r) => `role:${r.name}`));
    features.push(...roles.features);
  }

  const billing = pack.billing as { features: string[] } | undefined;
  if (billing && Array.isArray(billing.features)) features.push(...billing.features);

  const notifications = pack.notifications as { channels: string[]; triggers: string[] } | undefined;
  if (notifications) {
    features.push(...notifications.channels);
    features.push(...notifications.triggers);
  }

  const activityLog = pack.activityLog as { events: string[] } | undefined;
  if (activityLog && Array.isArray(activityLog.events)) features.push(...activityLog.events);

  const files = pack.files as { features: string[] } | undefined;
  if (files && Array.isArray(files.features)) features.push(...files.features);

  const realtime = pack.realtime as { features: string[] } | undefined;
  if (realtime && Array.isArray(realtime.features)) features.push(...realtime.features);

  const projects = pack.projects as { features: string[] } | undefined;
  if (projects && Array.isArray(projects.features)) features.push(...projects.features);

  const tasks = pack.tasks as { features: string[] } | undefined;
  if (tasks && Array.isArray(tasks.features)) features.push(...tasks.features);

  return features;
}

/**
 * Collect all business rule keys from a domain pack.
 */
function collectBusinessRuleKeys(pack: Record<string, unknown>): string[] {
  return Object.keys((pack.businessRules as Record<string, string>) || {});
}

// ── Registry Tests ─────────────────────────────────────────────────────────

describe('Domain Pack Registry', () => {
  it('should have exactly 3 registered domain packs', () => {
    assert.strictEqual(Object.keys(DOMAIN_PACKS).length, 3);
  });

  it('should register coffee_shop, ecommerce, and saas', () => {
    assert.ok('coffee_shop' in DOMAIN_PACKS);
    assert.ok('ecommerce' in DOMAIN_PACKS);
    assert.ok('saas' in DOMAIN_PACKS);
  });

  it('getAllPackIds should return all 3 domain IDs', () => {
    const ids = getAllPackIds();
    assert.strictEqual(ids.length, 3);
    assert.ok(ids.includes('coffee_shop'));
    assert.ok(ids.includes('ecommerce'));
    assert.ok(ids.includes('saas'));
  });

  it('getAllPacks should return 3 packs', () => {
    assert.strictEqual(getAllPacks().length, 3);
  });

  it('getPack should retrieve each registered pack by domain string', () => {
    assert.strictEqual(getPack('coffee_shop').domain, 'coffee_shop');
    assert.strictEqual(getPack('ecommerce').domain, 'ecommerce');
    assert.strictEqual(getPack('saas').domain, 'saas');
  });

  it('getPack should throw for unknown domain', () => {
    assert.throws(() => getPack('nonexistent'), /Unknown domain pack/);
  });

  it('hasPack should return true for registered, false for unknown', () => {
    assert.strictEqual(hasPack('coffee_shop'), true);
    assert.strictEqual(hasPack('nonexistent'), false);
  });

  it('getPackSummaries should return 3 summaries', () => {
    const summaries = getPackSummaries();
    assert.strictEqual(summaries.length, 3);
    for (const s of summaries) {
      assert.ok(s.domain.length > 0);
      assert.ok(s.name.length > 0);
      assert.ok(s.description.length > 0);
    }
  });
});

// ── Universal Requirements Tests ───────────────────────────────────────────

describe('Universal Domain Pack Requirements', () => {
  const packs = [
    { pack: COFFEE_SHOP_PACK, domain: 'coffee_shop' },
    { pack: ECOMMERCE_PACK, domain: 'ecommerce' },
    { pack: SAAS_PACK, domain: 'saas' },
  ];

  for (const { pack, domain } of packs) {
    describe(`${domain} — Universal Checks`, () => {
      it('should have domain, name, and substantial description', () => {
        assert.ok(typeof pack.domain === 'string' && pack.domain.length > 0);
        assert.ok(typeof pack.name === 'string' && pack.name.length > 0);
        assert.ok(typeof pack.description === 'string' && pack.description.length > 50);
      });

      it('should have at least 3 catalog categories (if catalog exists)', () => {
        if ('catalog' in pack && pack.catalog) {
          assert.ok(
            Array.isArray(pack.catalog.categories) && pack.catalog.categories.length >= 3,
            `Need >= 3 categories, got ${pack.catalog.categories.length}`
          );
        }
      });

      it('should have businessRules with at least 5 substantive entries', () => {
        const ruleKeys = collectBusinessRuleKeys(pack);
        assert.ok(ruleKeys.length >= 5, `Need >= 5 rules, got ${ruleKeys.length}`);
        for (const key of ruleKeys) {
          const val = (pack.businessRules as Record<string, string>)[key];
          assert.ok(typeof val === 'string' && val.length > 20, `Rule "${key}" must be substantive`);
        }
      });

      it('should have security requirements with compliance', () => {
        assert.ok(typeof pack.security.auth === 'string' && pack.security.auth.length > 20);
        assert.ok(typeof pack.security.data === 'string' && pack.security.data.length > 20);
        assert.ok(
          Array.isArray(pack.security.compliance) && pack.security.compliance.length >= 1,
          'Must have >= 1 compliance requirement'
        );
      });

      it('should have testing requirements for unit, integration, and e2e', () => {
        for (const type of ['unit', 'integration', 'e2e'] as const) {
          const tests = (pack.testing as Record<string, string[]>)[type];
          assert.ok(
            Array.isArray(tests) && tests.length >= 1,
            `testing.${type} must have >= 1 test case`
          );
        }
      });

      it('should have all 4 design principles', () => {
        for (const key of ['palette', 'typography', 'imagery', 'interactions']) {
          const val = (pack.design as Record<string, string>)[key];
          assert.ok(typeof val === 'string' && val.length > 20, `design.${key} required`);
        }
      });

      it('should have at least 10 features across all sections', () => {
        const features = collectFeatures(pack as Record<string, unknown>);
        assert.ok(
          features.length >= 10,
          `${domain} needs >= 10 features, got ${features.length}: ${features.join(', ')}`
        );
      });
    });
  }
});

// ── Coffee Shop Specifics ──────────────────────────────────────────────────

describe('Coffee Shop Pack Specifics', () => {
  it('should have 6 product categories including Espresso and Beans', () => {
    assert.strictEqual(COFFEE_SHOP_PACK.catalog.categories.length, 6);
    assert.ok(COFFEE_SHOP_PACK.catalog.categories.includes('Espresso'));
    assert.ok(COFFEE_SHOP_PACK.catalog.categories.includes('Beans'));
  });

  it('should have pickup and delivery fulfillment modes with estimated times', () => {
    const modeNames = COFFEE_SHOP_PACK.fulfillment.modes.map((m) => m.name);
    assert.ok(modeNames.includes('pickup'));
    assert.ok(modeNames.includes('delivery'));
    for (const mode of COFFEE_SHOP_PACK.fulfillment.modes) {
      assert.ok(typeof mode.estimatedTime === 'string' && mode.estimatedTime.length > 0);
    }
  });

  it('should have category details with subcategories for every category', () => {
    assert.ok(COFFEE_SHOP_PACK.catalog.categoryDetails);
    assert.strictEqual(
      COFFEE_SHOP_PACK.catalog.categoryDetails.length,
      COFFEE_SHOP_PACK.catalog.categories.length
    );
    for (const detail of COFFEE_SHOP_PACK.catalog.categoryDetails) {
      assert.ok(
        detail.subcategories && detail.subcategories.length >= 2,
        `Category "${detail.name}" needs >= 2 subcategories`
      );
    }
  });

  it('should have loyalty, promotions, fulfillment, pricing, and tax business rules', () => {
    assert.ok('loyalty' in COFFEE_SHOP_PACK.businessRules);
    assert.ok('promotions' in COFFEE_SHOP_PACK.businessRules);
    assert.ok('fulfillment' in COFFEE_SHOP_PACK.businessRules);
    assert.ok('pricing' in COFFEE_SHOP_PACK.businessRules);
    assert.ok('tax' in COFFEE_SHOP_PACK.businessRules);
  });

  it('should have PCI-DSS and GDPR in compliance requirements', () => {
    const compliance = COFFEE_SHOP_PACK.security.compliance.join(' ').toLowerCase();
    assert.ok(compliance.includes('pci'), 'PCI-DSS missing');
    assert.ok(compliance.includes('gdpr'), 'GDPR missing');
  });

  it('should have all 4 component groups with non-empty entries', () => {
    for (const group of ['public', 'customer', 'admin', 'staff']) {
      const components = (COFFEE_SHOP_PACK.components as Record<string, string[]>)[group];
      assert.ok(Array.isArray(components) && components.length >= 1, `${group} group empty`);
      for (const comp of components) {
        assert.ok(typeof comp === 'string' && comp.length > 0);
      }
    }
  });
});

// ── E-Commerce Specifics ───────────────────────────────────────────────────

describe('E-Commerce Pack Specifics', () => {
  it('should have at least 6 product categories', () => {
    assert.ok(ECOMMERCE_PACK.catalog.categories.length >= 6);
  });

  it('should have variantTypes and filterDimensions', () => {
    assert.ok(
      Array.isArray(ECOMMERCE_PACK.catalog.variantTypes) && ECOMMERCE_PACK.catalog.variantTypes.length >= 3,
      'Need >= 3 variant types'
    );
    assert.ok(
      Array.isArray(ECOMMERCE_PACK.catalog.filterDimensions) && ECOMMERCE_PACK.catalog.filterDimensions.length >= 5,
      'Need >= 5 filter dimensions'
    );
  });

  it('should have cart, checkout, and orders sections', () => {
    assert.ok('cart' in ECOMMERCE_PACK, 'Missing cart section');
    assert.ok('checkout' in ECOMMERCE_PACK, 'Missing checkout section');
    assert.ok('orders' in ECOMMERCE_PACK, 'Missing orders section');
  });

  it('orders should have at least 5 states with transitions and 30-day return window', () => {
    assert.ok(Array.isArray(ECOMMERCE_PACK.orders.states) && ECOMMERCE_PACK.orders.states.length >= 5);
    assert.ok(typeof ECOMMERCE_PACK.orders.transitions === 'object');
    assert.ok(ECOMMERCE_PACK.orders.returnWindowDays >= 30);
  });

  it('should support guest checkout in both cart and checkout', () => {
    assert.strictEqual(ECOMMERCE_PACK.cart.supportsGuestCheckout, true);
    assert.strictEqual(ECOMMERCE_PACK.checkout.guestCheckout, true);
  });

  it('recommendations should have >= 3 algorithms and >= 3 contexts', () => {
    assert.ok(
      Array.isArray(ECOMMERCE_PACK.recommendations.algorithms) &&
        ECOMMERCE_PACK.recommendations.algorithms.length >= 3
    );
    assert.ok(
      Array.isArray(ECOMMERCE_PACK.recommendations.contexts) &&
        ECOMMERCE_PACK.recommendations.contexts.length >= 3
    );
  });

  it('should have pricing, tax, shipping, and returns in business rules', () => {
    assert.ok('pricing' in ECOMMERCE_PACK.businessRules);
    assert.ok('tax' in ECOMMERCE_PACK.businessRules);
    assert.ok('shipping' in ECOMMERCE_PACK.businessRules);
    assert.ok('returns' in ECOMMERCE_PACK.businessRules);
  });

  it('should have PCI-DSS and GDPR compliance', () => {
    const compliance = ECOMMERCE_PACK.security.compliance.join(' ').toLowerCase();
    assert.ok(compliance.includes('pci'), 'PCI-DSS missing');
    assert.ok(compliance.includes('gdpr'), 'GDPR missing');
  });

  it('admin should have >= 8 features including product and order management', () => {
    assert.ok(ECOMMERCE_PACK.admin.features.length >= 8);
    assert.ok(ECOMMERCE_PACK.admin.features.includes('product-management'));
    assert.ok(ECOMMERCE_PACK.admin.features.includes('order-management'));
  });
});

// ── SaaS Specifics ─────────────────────────────────────────────────────────

describe('SaaS Pack Specifics', () => {
  it('should have at least 3 pricing plans', () => {
    assert.ok(Array.isArray(SAAS_PACK.plans) && SAAS_PACK.plans.length >= 3);
  });

  it('should have a free tier with at least 1 project allowed', () => {
    const freePlan = SAAS_PACK.plans.find((p) => p.monthlyPrice === 0);
    assert.ok(freePlan, 'Missing free plan');
    assert.ok(freePlan.quotas.projects >= 1, 'Free plan should allow >= 1 project');
  });

  it('each plan should have quotas with projects, tasks, and storageGB', () => {
    for (const plan of SAAS_PACK.plans) {
      assert.ok(typeof plan.monthlyPrice === 'number', `${plan.id} missing monthlyPrice`);
      assert.ok('quotas' in plan, `${plan.id} missing quotas`);
      assert.ok('projects' in plan.quotas, `${plan.id} quotas missing projects`);
      assert.ok('tasks' in plan.quotas, `${plan.id} quotas missing tasks`);
      assert.ok('storageGB' in plan.quotas, `${plan.id} quotas missing storageGB`);
    }
  });

  it('should have 4 roles with at least 1 permission each', () => {
    assert.ok(SAAS_PACK.roles.roles.length >= 3);
    for (const role of SAAS_PACK.roles.roles) {
      assert.ok(
        Array.isArray(role.permissions) && role.permissions.length >= 1,
        `Role "${role.name}" needs >= 1 permission`
      );
    }
  });

  it('should have Owner, Admin, Member, and Guest roles', () => {
    const roleNames = SAAS_PACK.roles.roles.map((r) => r.name);
    assert.ok(roleNames.includes('Owner'));
    assert.ok(roleNames.includes('Admin'));
    assert.ok(roleNames.includes('Member'));
    assert.ok(roleNames.includes('Guest'));
  });

  it('billing should have >= 5 features and >= 2 payment providers including Stripe', () => {
    assert.ok(Array.isArray(SAAS_PACK.billing.features) && SAAS_PACK.billing.features.length >= 5);
    assert.ok(
      Array.isArray(SAAS_PACK.billing.paymentProviders) && SAAS_PACK.billing.paymentProviders.length >= 2
    );
    assert.ok(SAAS_PACK.billing.paymentProviders.includes('stripe'));
  });

  it('notifications should have >= 3 channels and >= 5 triggers', () => {
    assert.ok(
      Array.isArray(SAAS_PACK.notifications.channels) && SAAS_PACK.notifications.channels.length >= 3
    );
    assert.ok(
      Array.isArray(SAAS_PACK.notifications.triggers) && SAAS_PACK.notifications.triggers.length >= 5
    );
  });

  it('activityLog should have >= 5 events and >= 30 days retention', () => {
    assert.ok(Array.isArray(SAAS_PACK.activityLog.events) && SAAS_PACK.activityLog.events.length >= 5);
    assert.ok(SAAS_PACK.activityLog.retentionDays >= 30);
  });

  it('files should have size limit, allowed types, and features', () => {
    assert.ok(SAAS_PACK.files.maxSizeMB > 0);
    assert.ok(
      Array.isArray(SAAS_PACK.files.allowedTypes) && SAAS_PACK.files.allowedTypes.length >= 3
    );
    assert.ok(Array.isArray(SAAS_PACK.files.features) && SAAS_PACK.files.features.length >= 3);
  });

  it('realtime should have >= 3 features', () => {
    assert.ok(Array.isArray(SAAS_PACK.realtime.features) && SAAS_PACK.realtime.features.length >= 3);
  });

  it('should have tenancy, quotas, seats, and pricing business rules', () => {
    assert.ok('tenancy' in SAAS_PACK.businessRules, 'Missing tenancy');
    assert.ok('quotas' in SAAS_PACK.businessRules, 'Missing quotas');
    assert.ok('seats' in SAAS_PACK.businessRules, 'Missing seats');
    assert.ok('pricing' in SAAS_PACK.businessRules, 'Missing pricing');
  });

  it('security should mention RBAC and SSO/SAML', () => {
    const securityText = `${SAAS_PACK.security.auth} ${SAAS_PACK.security.compliance.join(' ')}`.toLowerCase();
    assert.ok(securityText.includes('rbac') || securityText.includes('role-based'), 'RBAC missing');
    assert.ok(securityText.includes('saml') || securityText.includes('sso'), 'SSO/SAML missing');
  });
});

// ── Validation Function Tests ──────────────────────────────────────────────

describe('validatePack', () => {
  it('should return no errors for all 3 valid packs', () => {
    for (const pack of [COFFEE_SHOP_PACK, ECOMMERCE_PACK, SAAS_PACK]) {
      const errors = validatePack(pack);
      assert.strictEqual(
        errors.length, 0,
        `${pack.domain} should be valid, got errors: ${errors.join(', ')}`
      );
    }
  });

  it('should detect missing design field', () => {
    const broken = { ...COFFEE_SHOP_PACK } as Record<string, unknown>;
    delete broken.design;
    const errors = validatePack(broken as typeof COFFEE_SHOP_PACK);
    assert.ok(errors.some((e) => e.includes('design')));
  });

  it('should detect insufficient categories', () => {
    const broken = { ...COFFEE_SHOP_PACK, catalog: { ...COFFEE_SHOP_PACK.catalog, categories: ['Only One'] } } as typeof COFFEE_SHOP_PACK;
    const errors = validatePack(broken);
    assert.ok(errors.some((e) => e.includes('categories')));
  });

  it('should detect insufficient features', () => {
    const broken = { ...COFFEE_SHOP_PACK, catalog: { ...COFFEE_SHOP_PACK.catalog, features: ['only-one'] } } as typeof COFFEE_SHOP_PACK;
    const errors = validatePack(broken);
    assert.ok(errors.some((e) => e.includes('features')));
  });

  it('should detect missing compliance', () => {
    const broken = {
      ...COFFEE_SHOP_PACK,
      security: { ...COFFEE_SHOP_PACK.security, compliance: [] },
    } as typeof COFFEE_SHOP_PACK;
    const errors = validatePack(broken);
    assert.ok(errors.some((e) => e.includes('compliance')));
  });

  it('should detect empty unit test array', () => {
    const broken = {
      ...COFFEE_SHOP_PACK,
      testing: { unit: [], integration: ['one'], e2e: ['one'] },
    } as typeof COFFEE_SHOP_PACK;
    const errors = validatePack(broken);
    assert.ok(errors.some((e) => e.includes('unit')));
  });
});

// ── Cross-Reference Integrity ──────────────────────────────────────────────

describe('Domain Pack Cross-References', () => {
  const packs = [COFFEE_SHOP_PACK, ECOMMERCE_PACK, SAAS_PACK];

  it('all business rule values should be substantive strings', () => {
    for (const pack of packs) {
      for (const [key, value] of Object.entries(pack.businessRules)) {
        assert.ok(
          typeof value === 'string' && value.length > 20,
          `${pack.domain}.businessRules.${key} must be substantive (got "${value}")`
        );
      }
    }
  });

  it('all design principle values should be substantive strings', () => {
    for (const pack of packs) {
      for (const [key, value] of Object.entries(pack.design)) {
        assert.ok(
          typeof value === 'string' && value.length > 20,
          `${pack.domain}.design.${key} must be substantive (got "${value}")`
        );
      }
    }
  });

  it('all security auth and data descriptions should be substantive', () => {
    for (const pack of packs) {
      assert.ok(typeof pack.security.auth === 'string' && pack.security.auth.length > 20);
      assert.ok(typeof pack.security.data === 'string' && pack.security.data.length > 20);
    }
  });

  it('coffee_shop and ecommerce component names should be non-empty', () => {
    for (const pack of [COFFEE_SHOP_PACK, ECOMMERCE_PACK]) {
      const components = pack.components as { public: string[]; customer: string[]; admin: string[]; staff: string[] };
      for (const group of ['public', 'customer', 'admin', 'staff']) {
        const items = components[group];
        for (const comp of items) {
          assert.ok(typeof comp === 'string' && comp.length > 0, `Invalid component: "${comp}"`);
        }
      }
    }
  });
});

// ── Feature Density ────────────────────────────────────────────────────────

describe('Feature Density', () => {
  const minimumFeatureCount = 10;
  const richFeatureMinimum = 20;

  const packs = [
    { pack: COFFEE_SHOP_PACK, name: 'coffee_shop' },
    { pack: ECOMMERCE_PACK, name: 'ecommerce' },
    { pack: SAAS_PACK, name: 'saas' },
  ];

  for (const { pack, name } of packs) {
    it(`${name} should have at least ${minimumFeatureCount} total features`, () => {
      const features = collectFeatures(pack as Record<string, unknown>);
      assert.ok(
        features.length >= minimumFeatureCount,
        `${name} has ${features.length} features, need >= ${minimumFeatureCount}`
      );
    });

    it(`${name} should have at least ${richFeatureMinimum} features (rich domain spec)`, () => {
      const features = collectFeatures(pack as Record<string, unknown>);
      assert.ok(
        features.length >= richFeatureMinimum,
        `${name} has ${features.length} features, need >= ${richFeatureMinimum}`
      );
    });
  }
});
