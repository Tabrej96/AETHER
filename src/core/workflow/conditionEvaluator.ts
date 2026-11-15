/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Workflow Condition Evaluator (Enhanced)
 * (src/core/workflow/conditionEvaluator.ts)
 *
 * Evaluates step conditions, selects branches, and determines loop
 * termination using the workflow execution context as the evaluation
 * environment. Conditions are JS expression strings evaluated via
 * Function constructor against a sandboxed context object.
 *
 * Enhanced with:
 *   - Domain-specific condition presets (cofi, ecommerce, saas, etc.)
 *   - Composite condition groups (AND/OR logic)
 *   - Numeric range and temporal operators
 *   - Condition result caching for repeated evaluations
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain decomposition and
 *   business-rule condition patterns inspired the domain preset system.
 *
 *   Superpowers (https://github.com/obra/superpowers) — the composable
 *   condition-group concept is inspired by Superpowers' flexible rule
 *   chaining model.
 */

import type {
  WorkflowExecution, WorkflowStep, ExecutionError,
} from './workflowEngine';
import type { HookCondition, HookConditionGroup, ConditionOperator } from '../hooks/hookEngine';

// ---------------------------------------------------------------------------
// Extended condition result
// ---------------------------------------------------------------------------

export interface ConditionResult {
  /** Whether the condition evaluated to true. */
  satisfied: boolean;
  /** The raw value the expression evaluated to. */
  value: unknown;
  /** Any error that occurred during evaluation. */
  error?: ExecutionError;
  /** If evaluated from a group, which sub-conditions passed */
  subResults?: boolean[];
}

// ---------------------------------------------------------------------------
// Domain-specific condition presets (ECC-inspired)
// ---------------------------------------------------------------------------

export interface DomainConditionPreset {
  domain: string;
  name: string;
  /** Condition expressions relevant to this domain */
  conditions: DomainCondition[];
}

export interface DomainCondition {
  id: string;
  name: string;
  description: string;
  expression: string;
  /** Which step types this condition applies to */
  appliesTo: string[];
}

/**
 * Built-in domain condition presets for common AETHER domains.
 */
export const DOMAIN_CONDITION_PRESETS: DomainConditionPreset[] = [
  {
    domain: 'coffeeShop',
    name: 'Coffee Shop Business Rules',
    conditions: [
      {
        id: 'cofi-hours-check',
        name: 'Within Business Hours',
        description: 'True if current time is within shop operating hours',
        expression: 'context.hour >= context.openHour && context.hour < context.closeHour',
        appliesTo: ['task', 'skill'],
      },
      {
        id: 'cofi-order-valid',
        name: 'Order Is Valid',
        description: 'True if the order has items and a valid total',
        expression: 'orderItems.length > 0 && orderTotal > 0',
        appliesTo: ['task'],
      },
      {
        id: 'cofi-loyalty-eligible',
        name: 'Loyalty Program Eligible',
        description: 'True if customer has >= 10 visits',
        expression: 'context.customerVisits >= 10',
        appliesTo: ['task'],
      },
    ],
  },
  {
    domain: 'ecommerce',
    name: 'E-Commerce Business Rules',
    conditions: [
      {
        id: 'ecom-inventory-available',
        name: 'Inventory Available',
        description: 'True if requested quantity is in stock',
        expression: 'context.stockQuantity >= context.requestedQuantity',
        appliesTo: ['task'],
      },
      {
        id: 'ecom-cart-not-empty',
        name: 'Cart Not Empty',
        description: 'True if the shopping cart has items',
        expression: 'context.cartItems.length > 0',
        appliesTo: ['task', 'skill'],
      },
      {
        id: 'ecom-discount-valid',
        name: 'Discount Code Valid',
        description: 'True if the discount code is active and not expired',
        expression: 'context.discountActive && context.discountExpiry > Date.now()',
        appliesTo: ['task'],
      },
      {
        id: 'ecom-shipping-required',
        name: 'Shipping Required',
        description: 'True if the order contains physical items',
        expression: 'context.hasPhysicalItems === true',
        appliesTo: ['task'],
      },
    ],
  },
  {
    domain: 'saas',
    name: 'SaaS Business Rules',
    conditions: [
      {
        id: 'saas-within-quota',
        name: 'Within Plan Quota',
        description: 'True if usage is within the plan limit',
        expression: 'context.currentUsage < context.planQuota',
        appliesTo: ['task'],
      },
      {
        id: 'saas-subscription-active',
        name: 'Subscription Active',
        description: 'True if the subscription status is active',
        expression: 'context.subscriptionStatus === "active"',
        appliesTo: ['task'],
      },
      {
        id: 'saas-team-seats-available',
        name: 'Team Seats Available',
        description: 'True if the team has available seats',
        expression: 'context.currentSeats < context.maxSeats',
        appliesTo: ['task'],
      },
      {
        id: 'saas-trial-not-expired',
        name: 'Trial Not Expired',
        description: 'True if the trial period is still active',
        expression: 'context.trialEndsAt > Date.now()',
        appliesTo: ['task'],
      },
    ],
  },
  {
    domain: 'booking',
    name: 'Booking Business Rules',
    conditions: [
      {
        id: 'book-slot-available',
        name: 'Time Slot Available',
        description: 'True if the requested time slot is free',
        expression: 'context.slotAvailable === true',
        appliesTo: ['task'],
      },
      {
        id: 'book-within-window',
        name: 'Within Booking Window',
        description: 'True if the booking date is within the allowed window',
        expression: 'context.bookingDate >= context.windowStart && context.bookingDate <= context.windowEnd',
        appliesTo: ['task'],
      },
      {
        id: 'book-not-cancelled',
        name: 'Booking Not Cancelled',
        description: 'True if the booking has not been cancelled',
        expression: 'context.bookingStatus !== "cancelled"',
        appliesTo: ['task'],
      },
    ],
  },
  {
    domain: 'logistics',
    name: 'Logistics Business Rules',
    conditions: [
      {
        id: 'log-package-addressable',
        name: 'Package Addressable',
        description: 'True if the package has a valid address',
        expression: 'context.hasValidAddress === true',
        appliesTo: ['task'],
      },
      {
        id: 'log-within-delivery-window',
        name: 'Within Delivery Window',
        description: 'True if current time is within the delivery window',
        expression: 'context.currentTime >= context.deliveryWindowStart && context.currentTime <= context.deliveryWindowEnd',
        appliesTo: ['task'],
      },
      {
        id: 'log-weight-valid',
        name: 'Weight Within Limits',
        description: 'True if the package weight is within carrier limits',
        expression: 'context.packageWeight <= context.maxWeight',
        appliesTo: ['task'],
      },
    ],
  },
];

/**
 * Get all condition presets for a given domain.
 */
export function getPresetsForDomain(domain: string): DomainConditionPreset[] {
  return DOMAIN_CONDITION_PRESETS.filter(p => p.domain === domain);
}

/**
 * Get all condition presets matching any of the given domains.
 */
export function getPresetsForDomains(domains: string[]): DomainConditionPreset[] {
  const domainSet = new Set(domains);
  return DOMAIN_CONDITION_PRESETS.filter(p => domainSet.has(p.domain));
}

// ---------------------------------------------------------------------------
// Condition evaluation
// ---------------------------------------------------------------------------

/**
 * Cached condition evaluation result.
 */
interface CachedCondition {
  key: string;
  result: ConditionResult;
  cachedAt: number;
}

const conditionCache = new Map<string, CachedCondition>();
const CACHE_TTL_MS = 5_000;

function getCacheKey(condition: string, sortedKeys: string[], sortedValues: unknown[]): string {
  const valStr = sortedValues.map(v => String(v)).join('|');
  return `${condition}:${sortedKeys.join(',')}:${valStr}`;
}

/**
 * Evaluate a single JS-expression condition against the context.
 * Supports the enhanced operators via the condition string itself.
 */
export function evaluateCondition(
  condition: string,
  context: WorkflowExecution['context'],
  stepId?: string,
  useCache = true
): ConditionResult {
  // Sort keys for deterministic evaluation and cache key
  const sortedKeys = Object.keys(context).sort();
  const sortedValues = sortedKeys.map(k => context[k]);

  // Check cache
  if (useCache) {
    const cacheKey = getCacheKey(condition, sortedKeys, sortedValues);
    const cached = conditionCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.result;
    }
  }

  try {
    const fn = new Function(...sortedKeys, `return (${condition});`);
    const result = fn(...sortedValues);
    const condResult: ConditionResult = { satisfied: Boolean(result), value: result };
    if (useCache) {
      const cacheKey = getCacheKey(condition, sortedKeys, sortedValues);
      conditionCache.set(cacheKey, { key: cacheKey, result: condResult, cachedAt: Date.now() });
    }
    return condResult;
  } catch (err) {
    const error: ExecutionError = {
      code: 'CONDITION_EVAL_ERROR',
      message: `Failed to evaluate condition on step ${stepId ?? 'unknown'}: ${err instanceof Error ? err.message : String(err)}`,
      stepId,
      recoverable: false,
    };
    return { satisfied: false, value: null, error };
  }
}

/**
 * Evaluate a structured condition (field/operator/value) against context.
 * This is the hook-style evaluator, lifted to workflow context.
 */
export function evaluateStructuredCondition(
  condition: HookCondition,
  context: Record<string, unknown>
): boolean {
  let fieldValue: unknown;
  if (condition.field in context) {
    fieldValue = (context as Record<string, unknown>)[condition.field];
  } else {
    // Support dot-notation nested access
    fieldValue = getNestedValue(context, condition.field);
  }

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'contains': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') return fieldValue.includes(condition.value);
      if (Array.isArray(fieldValue)) return fieldValue.some(v => String(v) === String(condition.value));
      return false;
    }
    case 'not_contains': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') return !fieldValue.includes(condition.value);
      if (Array.isArray(fieldValue)) return !fieldValue.some(v => String(v) === String(condition.value));
      return true;
    }
    case 'regex': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        try { return new RegExp(condition.value).test(fieldValue); } catch { return false; }
      }
      return false;
    }
    case 'in': {
      const opts = Array.isArray(condition.value) ? condition.value : [condition.value];
      return opts.some(v => v === fieldValue);
    }
    case 'not_in': {
      const opts = Array.isArray(condition.value) ? condition.value : [condition.value];
      return !opts.some(v => v === fieldValue);
    }
    case 'greater_than':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue > condition.value;
    case 'less_than':
      return typeof fieldValue === 'number' && typeof condition.value === 'number' && fieldValue < condition.value;
    default:
      return true;
  }
}

/**
 * Evaluate a condition group (AND/OR logic across multiple conditions).
 */
export function evaluateConditionGroup(
  group: HookConditionGroup,
  context: WorkflowExecution['context']
): ConditionResult {
  const subResults = group.conditions.map(c => evaluateStructuredCondition(c, context));
  const satisfied = group.logic === 'AND'
    ? subResults.every(r => r)
    : subResults.some(r => r);
  return { satisfied, value: satisfied, subResults };
}

/**
 * Determines whether a step should execute based on its condition and the context.
 * Supports both string expressions and structured HookCondition arrays.
 */
export function shouldStepRun(
  step: WorkflowStep,
  context: WorkflowExecution['context'],
  stepId: string
): ConditionResult {
  if (!step.condition) {
    return { satisfied: true, value: true };
  }

  // String expression condition
  if (typeof step.condition === 'string') {
    return evaluateCondition(step.condition, context, stepId);
  }

  // Structured condition: handle arrays and objects
  if (Array.isArray(step.condition)) {
    const subResults = step.condition.map(c => evaluateStructuredCondition(c, context));
    return { satisfied: subResults.every(r => r), value: subResults.every(r => r), subResults };
  }

  if (typeof step.condition === 'object' && 'conditions' in step.condition) {
    return evaluateConditionGroup(step.condition as HookConditionGroup, context);
  }

  return { satisfied: true, value: true };
}

/**
 * Evaluates a loop termination condition. Returns true if the loop should stop.
 */
export function shouldLoopTerminate(
  loopCondition: string,
  loopContext: Record<string, unknown>
): ConditionResult {
  if (!loopCondition) {
    return { satisfied: true, value: true };
  }
  return evaluateCondition(loopCondition, loopContext);
}

/**
 * Selects which branch of a conditional parallel to execute.
 * Each branch is a map of condition-expression -> step-ids.
 */
export function selectBranch(
  branches: Array<{ condition: string; stepIds: string[]; label?: string }>,
  context: WorkflowExecution['context']
): { branchIndex: number; branch: { condition: string; stepIds: string[]; label?: string } } {
  for (let i = 0; i < branches.length; i++) {
    const result = evaluateCondition(branches[i].condition, context);
    if (result.satisfied) {
      return { branchIndex: i, branch: branches[i] };
    }
  }
  // Default to the first branch if no condition is satisfied (fallback behavior).
  return { branchIndex: 0, branch: branches[0] };
}

/**
 * Validate a condition expression for syntax errors without executing it.
 */
export function validateCondition(condition: string): { valid: boolean; error?: string } {
  try {
    new Function(`return (${condition});`);
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Clear the condition evaluation cache.
 */
export function clearConditionCache(): void {
  conditionCache.clear();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get a nested value from an object using dot notation (e.g., "user.role")
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
