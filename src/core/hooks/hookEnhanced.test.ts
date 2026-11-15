/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Hook Engine — Enhanced Hook Tests
 * (src/core/hooks/hookEnhanced.test.ts)
 *
 * Tests for domain-specific hooks, hook chaining, and enhanced
 * registry features.
 *
 * Run via: npx tsx --test src/core/hooks/hookEnhanced.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerHook,
  unregisterHook,
  getAllHooks,
  getHookById,
  getHookStats,
  registerDomainPreset,
  registerMultipleDomainPresets,
  findHooksByDomain,
  findHooksByTag,
  getAvailableDomainPresets,
  getHookChain,
  registerHookChain,
  validateHookChain,
  registerDomainHookPreset,
} from './hookRegistry';
import { dispatch, type DispatcherConfig } from './hookDispatcher';
import {
  DEFAULT_HOOK_ENGINE_CONFIG,
  type Hook,
  type HookEvent,
  type HookResult,
  type DomainHookPreset,
} from './hookEngine';
import {
  COFFEE_SHOP_HOOK_PRESET,
  ECOMMERCE_HOOK_PRESET,
  ALL_DOMAIN_HOOK_PRESETS,
  createDomainHookChain,
} from './domainHookPresets';

// ---- Helpers ----

function makeHook(overrides: Partial<Hook> = {}): Hook {
  return {
    id: `hook-${Math.random().toString(36).slice(2, 8)}`,
    name: 'Test Hook',
    description: 'A test hook',
    version: '1.0.0',
    events: ['pre_tool_use'],
    handler: async (): Promise<HookResult> => ({ action: 'continue' }),
    priority: 50,
    enabled: true,
    ...overrides,
  };
}

function makeContext(event: HookEvent = 'pre_tool_use') {
  return {
    event,
    timestamp: new Date(),
    sessionId: 'session-1',
    projectId: 'project-1',
    data: {},
  };
}

const DEFAULT_DISPATCHER_CONFIG: DispatcherConfig = {
  defaultTimeoutMs: 5000,
  maxConcurrentHooks: 10,
};

// ============================================================
// Domain-specific registration
// ============================================================

describe('Domain Hook Presets', () => {
  it('registers coffee shop preset', () => {
    const registry = new Map();
    const count = registerDomainPreset(registry, 'coffeeShop');
    assert.ok(count >= 1);
    assert.ok(registry.size >= 1);
  });

  it('registers ecommerce preset', () => {
    const registry = new Map();
    const count = registerDomainPreset(registry, 'ecommerce');
    assert.ok(count >= 1);
  });

  it('registers saas preset', () => {
    const registry = new Map();
    const count = registerDomainPreset(registry, 'saas');
    assert.ok(count >= 1);
  });

  it('registers booking preset', () => {
    const registry = new Map();
    const count = registerDomainPreset(registry, 'booking');
    assert.ok(count >= 1);
  });

  it('registers logistics preset', () => {
    const registry = new Map();
    const count = registerDomainPreset(registry, 'logistics');
    assert.ok(count >= 1);
  });

  it('registerMultipleDomainPresets works', () => {
    const registry = new Map();
    const results = registerMultipleDomainPresets(registry, ['coffeeShop', 'ecommerce']);
    assert.ok(results.coffeeShop >= 1);
    assert.ok(results.ecommerce >= 1);
  });

  it('findHooksByDomain finds hooks', () => {
    const registry = new Map();
    registerHook(registry, makeHook({ id: 'd1', domain: ['coffeeShop'], events: ['pre_tool_use'] }));
    registerHook(registry, makeHook({ id: 'd2', domain: ['ecommerce'], events: ['pre_tool_use'] }));

    const cofiHooks = findHooksByDomain(registry, 'coffeeShop');
    assert.ok(cofiHooks.some(h => h.id === 'd1'));
    assert.ok(!cofiHooks.some(h => h.id === 'd2'));
  });

  it('findHooksByTag finds hooks', () => {
    const registry = new Map();
    registerHook(registry, makeHook({ id: 't1', tags: ['security', 'coffeeShop'], events: ['pre_tool_use'] }));
    registerHook(registry, makeHook({ id: 't2', tags: ['validation'], events: ['pre_tool_use'] }));

    const securityHooks = findHooksByTag(registry, 'security');
    assert.ok(securityHooks.some(h => h.id === 't1'));
    assert.ok(!securityHooks.some(h => h.id === 't2'));
  });

  it('getAvailableDomainPresets returns all presets', () => {
    const presets = getAvailableDomainPresets();
    assert.ok(presets.length >= 5);
    const domains = presets.map(p => p.domain);
    assert.ok(domains.includes('coffeeShop'));
    assert.ok(domains.includes('ecommerce'));
    assert.ok(domains.includes('saas'));
    assert.ok(domains.includes('booking'));
    assert.ok(domains.includes('logistics'));
  });
});

// ============================================================
// Hook chaining
// ============================================================

describe('Hook Chaining', () => {
  it('getHookChain returns the chain', () => {
    const registry = new Map();
    registerHookChain(registry, [
      makeHook({ id: 'h1', priority: 100 }),
      makeHook({ id: 'h2', priority: 50 }),
      makeHook({ id: 'h3', priority: 10 }),
    ]);

    const chain = getHookChain(registry, 'h1');
    assert.ok(chain.includes('h1'));
  });

  it('registerHookChain sets chainAfter links', () => {
    const registry = new Map();
    registerHookChain(registry, [
      makeHook({ id: 'chain-a', priority: 100 }),
      makeHook({ id: 'chain-b', priority: 50 }),
    ]);

    const entry = registry.get('chain-a');
    assert.ok(entry !== undefined);
    assert.ok(entry!.definition.chainAfter !== undefined);
  });

  it('validateHookChain returns valid for non-circular', () => {
    const registry = new Map();
    registerHookChain(registry, [
      makeHook({ id: 'v1', priority: 100 }),
      makeHook({ id: 'v2', priority: 50 }),
    ]);

    const result = validateHookChain(registry, 'v1');
    assert.strictEqual(result.valid, true);
  });

  it('dispatcher follows chainAfter links', async () => {
    const registry = new Map();
    const ran: string[] = [];
    registerHook(registry, makeHook({
      id: 'chain-root',
      priority: 100,
      events: ['pre_tool_use'],
      handler: async (): Promise<HookResult> => {
        ran.push('chain-root');
        return { action: 'continue' };
      },
      chainAfter: ['chain-follow'],
    }));
    registerHook(registry, makeHook({
      id: 'chain-follow',
      priority: 50,
      events: ['pre_tool_use'],
      handler: async (): Promise<HookResult> => {
        ran.push('chain-follow');
        return { action: 'continue' };
      },
    }));

    const result = await dispatch(registry, 'pre_tool_use', makeContext('pre_tool_use'), DEFAULT_DISPATCHER_CONFIG);
    assert.ok(ran.includes('chain-root'));
    assert.ok(ran.includes('chain-follow'));
  });

  it('createDomainHookChain creates a 3-hook chain', () => {
    const chain = createDomainHookChain('coffeeShop');
    assert.strictEqual(chain.length, 3);
    assert.ok(chain.every(h => h.domain?.includes('coffeeShop')));
  });

  it('domain hook chain has security scan, validation, sanitization', () => {
    const chain = createDomainHookChain('ecommerce');
    const events = chain.map(h => h.events[0]);
    assert.ok(events.includes('pre_prompt_submit'));
    assert.ok(events.includes('pre_skill_execute'));
    assert.ok(events.includes('post_tool_use'));
  });
});

// ============================================================
// Domain hook preset details
// ============================================================

describe('Domain Hook Preset Details', () => {
  it('coffee shop preset has security scan hook', () => {
    assert.ok(COFFEE_SHOP_HOOK_PRESET.hooks.some(h => h.events.includes('pre_prompt_submit')));
  });

  it('coffee shop preset has order validation', () => {
    assert.ok(COFFEE_SHOP_HOOK_PRESET.hooks.some(h =>
      h.events.includes('pre_skill_execute') && h.conditions.some(c => c.field === 'skillId')
    ));
  });

  it('ecommerce preset has inventory check', () => {
    assert.ok(ECOMMERCE_HOOK_PRESET.hooks.some(h =>
      h.conditions.some(c => c.field === 'domain' && c.value === 'ecommerce')
    ));
  });

  it('all presets have valid handlers', () => {
    for (const preset of ALL_DOMAIN_HOOK_PRESETS) {
      for (const def of preset.hooks) {
        assert.ok(typeof def.handler === 'function', `Handler missing in ${def.id}`);
      }
    }
  });
});

// ============================================================
// Hook dispatch with domain conditions
// ============================================================

describe('Hook Dispatch with Domain Conditions', () => {
  it('dispatcher respects domain conditions', async () => {
    const registry = new Map();
    registerHook(registry, makeHook({
      id: 'cofi-hook',
      priority: 100,
      events: ['pre_tool_use'],
      conditions: [{ field: 'domain', operator: 'equals', value: 'coffeeShop' }],
      handler: async (): Promise<HookResult> => ({ action: 'continue', message: 'cofi-ran' }),
    }));

    // Domain matches
    const matchResult = await dispatch(registry, 'pre_tool_use',
      { ...makeContext(), data: { domain: 'coffeeShop' } },
      DEFAULT_DISPATCHER_CONFIG
    );
    assert.strictEqual(matchResult.executedHooks.length, 1);

    // Domain does not match
    const noMatchResult = await dispatch(registry, 'pre_tool_use',
      { ...makeContext(), data: { domain: 'ecommerce' } },
      DEFAULT_DISPATCHER_CONFIG
    );
    assert.strictEqual(noMatchResult.executedHooks.length, 0);
  });

  it('registerDomainHookPreset registers hooks from preset', () => {
    const registry = new Map();
    const count = registerDomainHookPreset(registry, COFFEE_SHOP_HOOK_PRESET);
    assert.ok(count >= 1);
    assert.ok(registry.size >= 1);
  });
});
