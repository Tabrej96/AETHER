/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Hook Engine — Domain-Specific Hook Presets
 * (src/core/hooks/domainHookPresets.ts)
 *
 * Provides pre-built hook conditions for common AETHER domains
 * (coffeeShop, ecommerce, saas, booking, logistics). These presets
 * can be applied when registering hooks to enable domain-aware
 * conditional dispatch.
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain decomposition and
 *   business-rule conditions inspired these preset definitions.
 *
 *   Superpowers (https://github.com/obra/superpowers) — the composable
 *   condition-group model is inspired by Superpowers' rule chaining.
 */

import type {
  Hook, HookCondition, HookHandler, HookContext, HookResult,
  DomainHookPreset, DomainHookDefinition,
} from './hookEngine';
import { DEFAULT_HOOK_ENGINE_CONFIG } from './hookEngine';

// ---------------------------------------------------------------------------
// Hook handler factories
// ---------------------------------------------------------------------------

/**
 * Create a stub logging handler for preset hooks.
 */
function createLoggingHandler(hookId: string, actionDescription: string): HookHandler {
  return async (context: HookContext): Promise<HookResult> => {
    const blocked = (context.data as Record<string, unknown>)['blocked'] === true;
    if (blocked) {
      return { action: 'block', message: `[${hookId}] Blocked due to prior signal` };
    }
    return {
      action: 'continue',
      message: `[${hookId}] Executed: ${actionDescription}`,
    };
  };
}

/**
 * Create a security scan handler for pre_prompt_submit hooks.
 */
function createSecurityScanHandler(hookId: string): HookHandler {
  return async (context: HookContext): Promise<HookResult> => {
    const prompt = String(context.data['prompt'] ?? context.data['text'] ?? '');
    const injectionPatterns = [
      /ignore\s+(all\s+)?previous\s+instructions/i,
      /you\s+are\s+now/i,
      /system\s+prompt/i,
      /override/i,
    ];
    for (const pattern of injectionPatterns) {
      if (pattern.test(prompt)) {
        return {
          action: 'block',
          message: `[${hookId}] Potential prompt injection detected`,
        };
      }
    }
    return { action: 'continue', message: `[${hookId}] Security scan passed` };
  };
}

/**
 * Create a data sanitization handler for post_tool_use hooks.
 */
function createSanitizeHandler(hookId: string): HookHandler {
  return async (context: HookContext): Promise<HookResult> => {
    const modified = { ...context.data };
    // Redact common secret patterns in output data
    const secretKeys = ['password', 'secret', 'token', 'apiKey', 'api_key'];
    for (const key of secretKeys) {
      if (key in modified && typeof modified[key] === 'string') {
        modified[key] = '[REDACTED]';
      }
    }
    return {
      action: 'modify',
      modifiedData: modified,
      message: `[${hookId}] Sanitized sensitive fields`,
    };
  };
}

/**
 * Create a lease verification handler for pre_tool_use hooks.
 */
function createLeaseHandler(hookId: string, toolMatcher: string): HookHandler {
  return async (context: HookContext): Promise<HookResult> => {
    const toolName = String(context.data['toolName'] ?? context.data['tool'] ?? '');
    const leaseKey = `lease_${toolName}`;
    const hasLease = (context.data[leaseKey] as boolean) === true;

    if (!hasLease) {
      return {
        action: 'block',
        message: `[${hookId}] No active lease for ${toolName}`,
      };
    }
    return { action: 'continue', message: `[${hookId}] Lease verified for ${toolName}` };
  };
}

// ---------------------------------------------------------------------------
// Domain-specific hook presets
// ---------------------------------------------------------------------------

export const COFFEE_SHOP_HOOK_PRESET: DomainHookPreset = {
  domain: 'coffeeShop',
  name: 'Coffee Shop Hook Presets',
  hooks: [
    {
      id: 'cofi-pre-prompt-scan',
      name: 'Coffee Shop Pre-Prompt Scan',
      description: 'Scan for injection in coffee shop context',
      events: ['pre_prompt_submit'],
      priority: 10,
      conditions: [
        { field: 'projectId', operator: 'equals', value: 'coffee-shop' },
      ],
      tags: ['coffeeShop', 'security'],
      handler: createSecurityScanHandler('cofi-pre-prompt-scan'),
    },
    {
      id: 'cofi-order-validation',
      name: 'Coffee Shop Order Validation',
      description: 'Validate order before skill execution',
      events: ['pre_skill_execute'],
      priority: 20,
      conditions: [
        { field: 'domain', operator: 'equals', value: 'coffeeShop' },
        { field: 'skillId', operator: 'contains', value: 'order' },
      ],
      handler: async (ctx: HookContext): Promise<HookResult> => {
        const orderItems = (ctx.data['orderItems'] as unknown[]) ?? [];
        if (orderItems.length === 0) {
          return { action: 'block', message: '[cofi-order-validation] Order has no items' };
        }
        return { action: 'continue', message: '[cofi-order-validation] Order validated' };
      },
    },
  ],
};

export const ECOMMERCE_HOOK_PRESET: DomainHookPreset = {
  domain: 'ecommerce',
  name: 'E-Commerce Hook Presets',
  hooks: [
    {
      id: 'ecom-pre-prompt-scan',
      name: 'E-Commerce Pre-Prompt Scan',
      description: 'Scan for injection in ecommerce context',
      events: ['pre_prompt_submit'],
      priority: 10,
      conditions: [
        { field: 'projectId', operator: 'equals', value: 'ecommerce' },
      ],
      tags: ['ecommerce', 'security'],
      handler: createSecurityScanHandler('ecom-pre-prompt-scan'),
    },
    {
      id: 'ecom-inventory-check',
      name: 'E-Commerce Inventory Check',
      description: 'Verify inventory availability before checkout',
      events: ['pre_skill_execute'],
      priority: 30,
      conditions: [
        { field: 'domain', operator: 'equals', value: 'ecommerce' },
        { field: 'skillId', operator: 'regex', value: 'checkout|order|cart' },
      ],
      handler: async (ctx: HookContext): Promise<HookResult> => {
        const stock = Number(ctx.data['stockQuantity'] ?? -1);
        const requested = Number(ctx.data['requestedQuantity'] ?? 1);
        if (stock >= 0 && stock < requested) {
          return { action: 'block', message: '[ecom-inventory-check] Insufficient stock' };
        }
        return { action: 'continue', message: '[ecom-inventory-check] Inventory OK' };
      },
    },
    {
      id: 'ecom-post-edit-sanitize',
      name: 'E-Commerce Post-Edit Sanitize',
      description: 'Sanitize sensitive fields after tool use',
      events: ['post_tool_use'],
      priority: 25,
      conditions: [
        { field: 'projectId', operator: 'equals', value: 'ecommerce' },
      ],
      handler: createSanitizeHandler('ecom-post-edit-sanitize'),
    },
  ],
};

export const SAAS_HOOK_PRESET: DomainHookPreset = {
  domain: 'saas',
  name: 'SaaS Hook Presets',
  hooks: [
    {
      id: 'saas-pre-prompt-scan',
      name: 'SaaS Pre-Prompt Scan',
      description: 'Scan for injection in SaaS context',
      events: ['pre_prompt_submit'],
      priority: 10,
      conditions: [
        { field: 'projectId', operator: 'equals', value: 'saas' },
      ],
      tags: ['saas', 'security'],
      handler: createSecurityScanHandler('saas-pre-prompt-scan'),
    },
    {
      id: 'saas-quota-check',
      name: 'SaaS Quota Check',
      description: 'Check plan quota before resource-intensive operations',
      events: ['pre_skill_execute'],
      priority: 20,
      conditions: [
        { field: 'domain', operator: 'equals', value: 'saas' },
        { field: 'currentUsage', operator: 'greater_than', value: 0 },
      ],
      handler: async (ctx: HookContext): Promise<HookResult> => {
        const usage = Number(ctx.data['currentUsage'] ?? 0);
        const quota = Number(ctx.data['planQuota'] ?? 100);
        if (usage >= quota) {
          return { action: 'block', message: '[saas-quota-check] Plan quota exceeded' };
        }
        return { action: 'continue', message: `[saas-quota-check] Quota OK (${usage}/${quota})` };
      },
    },
  ],
};

export const BOOKING_HOOK_PRESET: DomainHookPreset = {
  domain: 'booking',
  name: 'Booking Hook Presets',
  hooks: [
    {
      id: 'book-pre-prompt-scan',
      name: 'Booking Pre-Prompt Scan',
      description: 'Scan for injection in booking context',
      events: ['pre_prompt_submit'],
      priority: 10,
      conditions: [
        { field: 'projectId', operator: 'equals', value: 'booking' },
      ],
      tags: ['booking', 'security'],
      handler: createSecurityScanHandler('book-pre-prompt-scan'),
    },
    {
      id: 'book-slot-validation',
      name: 'Booking Slot Validation',
      description: 'Verify time slot availability before booking',
      events: ['pre_skill_execute'],
      priority: 20,
      conditions: [
        { field: 'domain', operator: 'equals', value: 'booking' },
      ],
      handler: async (ctx: HookContext): Promise<HookResult> => {
        const available = ctx.data['slotAvailable'] === true;
        if (!available) {
          return { action: 'block', message: '[book-slot-validation] Time slot not available' };
        }
        return { action: 'continue', message: '[book-slot-validation] Slot available' };
      },
    },
  ],
};

export const LOGISTICS_HOOK_PRESET: DomainHookPreset = {
  domain: 'logistics',
  name: 'Logistics Hook Presets',
  hooks: [
    {
      id: 'log-pre-prompt-scan',
      name: 'Logistics Pre-Prompt Scan',
      description: 'Scan for injection in logistics context',
      events: ['pre_prompt_submit'],
      priority: 10,
      conditions: [
        { field: 'projectId', operator: 'equals', value: 'logistics' },
      ],
      tags: ['logistics', 'security'],
      handler: createSecurityScanHandler('log-pre-prompt-scan'),
    },
    {
      id: 'log-address-validation',
      name: 'Logistics Address Validation',
      description: 'Verify address before dispatch',
      events: ['pre_skill_execute'],
      priority: 20,
      conditions: [
        { field: 'domain', operator: 'equals', value: 'logistics' },
        { field: 'hasValidAddress', operator: 'not_equals', value: true },
      ],
      handler: async (ctx: HookContext): Promise<HookResult> => {
        return { action: 'block', message: '[log-address-validation] Invalid or missing address' };
      },
    },
  ],
};

/**
 * All built-in domain hook presets.
 */
export const ALL_DOMAIN_HOOK_PRESETS: DomainHookPreset[] = [
  COFFEE_SHOP_HOOK_PRESET,
  ECOMMERCE_HOOK_PRESET,
  SAAS_HOOK_PRESET,
  BOOKING_HOOK_PRESET,
  LOGISTICS_HOOK_PRESET,
];

/**
 * Get hook presets for a specific domain.
 */
export function getHookPresetsForDomain(domain: string): DomainHookPreset[] {
  return ALL_DOMAIN_HOOK_PRESETS.filter(p => p.domain === domain);
}

/**
 * Load all domain presets into a hook registry as Hook definitions.
 */
export function loadDomainPresets(
  domain: string,
  baseProjectId: string
): Hook[] {
  const presets = getHookPresetsForDomain(domain);
  const hooks: Hook[] = [];

  for (const preset of presets) {
    for (const def of preset.hooks) {
      hooks.push({
        id: def.id,
        name: def.name,
        description: def.description,
        version: '1.0.0',
        events: def.events,
        handler: def.handler,
        priority: def.priority,
        enabled: true,
        conditions: def.conditions,
        tags: def.tags,
        metadata: {
          source: 'domain-preset',
          domain,
          preset: preset.name,
        },
      });
    }
  }

  return hooks;
}

/**
 * Create a domain-specific pre-execution hook chain:
 * security scan -> domain validation -> sanitization.
 */
export function createDomainHookChain(domain: string): Hook[] {
  const chain: Hook[] = [];

  // 1. Security scan (pre_prompt_submit)
  const securityHandler = createSecurityScanHandler(`${domain}-security-scan`);
  chain.push({
    id: `${domain}-security-scan`,
    name: `${domain} Security Scan`,
    description: `Pre-prompt security scan for ${domain}`,
    version: '1.0.0',
    events: ['pre_prompt_submit'],
    handler: securityHandler,
    priority: 10,
    enabled: true,
    conditions: [{ field: 'domain', operator: 'equals', value: domain }],
    tags: [domain, 'security'],
    chainAfter: [],
    domain: [domain],
  });

  // 2. Domain validation (pre_skill_execute)
  const validateHandler: HookHandler = async (ctx: HookContext): Promise<HookResult> => {
    const skillDomain = String(ctx.data['domain'] ?? '');
    if (skillDomain !== domain) {
      return { action: 'continue', message: `[${domain}-validate] Not ${domain} domain, skipping` };
    }
    return { action: 'continue', message: `[${domain}-validate] Domain validation passed` };
  };
  chain.push({
    id: `${domain}-domain-validate`,
    name: `${domain} Domain Validation`,
    description: `Validates operations within ${domain}`,
    version: '1.0.0',
    events: ['pre_skill_execute'],
    handler: validateHandler,
    priority: 20,
    enabled: true,
    conditions: [{ field: 'domain', operator: 'equals', value: domain }],
    tags: [domain, 'validation'],
    chainAfter: [`${domain}-security-scan`],
    domain: [domain],
  });

  // 3. Post-execution sanitization (post_tool_use)
  chain.push({
    id: `${domain}-post-sanitize`,
    name: `${domain} Post-Execution Sanitize`,
    description: `Sanitizes outputs after ${domain} tool use`,
    version: '1.0.0',
    events: ['post_tool_use'],
    handler: createSanitizeHandler(`${domain}-post-sanitize`),
    priority: 30,
    enabled: true,
    conditions: [{ field: 'domain', operator: 'equals', value: domain }],
    tags: [domain, 'sanitization'],
    chainAfter: [`${domain}-domain-validate`],
    domain: [domain],
  });

  return chain;
}
