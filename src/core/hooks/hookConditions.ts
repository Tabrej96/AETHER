/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Hook Condition Evaluator
 * Evaluates whether a hook should fire based on context, project, and session filters
 */

import type { HookCondition, HookContext, ConditionOperator } from './hookEngine';

/**
 * Evaluate a single condition against the context data
 */
function evaluateCondition(condition: HookCondition, context: HookContext): boolean {
  // Special handling for context-level fields that aren't in data
  let fieldValue: unknown;
  if (condition.field === 'event') {
    fieldValue = context.event;
  } else if (condition.field === 'sessionId') {
    fieldValue = context.sessionId;
  } else if (condition.field === 'projectId') {
    fieldValue = context.projectId;
  } else if (condition.field === 'timestamp') {
    fieldValue = context.timestamp;
  } else {
    fieldValue = getNestedValue(context.data, condition.field);
  }

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;

    case 'not_equals':
      return fieldValue !== condition.value;

    case 'contains': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return fieldValue.includes(condition.value);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((v) => String(v) === String(condition.value));
      }
      return false;
    }

    case 'not_contains': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        return !fieldValue.includes(condition.value);
      }
      if (Array.isArray(fieldValue)) {
        return !fieldValue.some((v) => String(v) === String(condition.value));
      }
      return true;
    }

    case 'regex': {
      if (typeof fieldValue === 'string' && typeof condition.value === 'string') {
        try {
          const regex = new RegExp(condition.value);
          return regex.test(fieldValue);
        } catch {
          return false;
        }
      }
      return false;
    }

    case 'in': {
      const options = Array.isArray(condition.value) ? condition.value : [condition.value];
      return options.some((v) => v === fieldValue);
    }

    case 'not_in': {
      const options = Array.isArray(condition.value) ? condition.value : [condition.value];
      return !options.some((v) => v === fieldValue);
    }

    case 'greater_than':
      return typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue > condition.value;

    case 'less_than':
      return typeof fieldValue === 'number' &&
        typeof condition.value === 'number' &&
        fieldValue < condition.value;

    default:
      return true;
  }
}

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

/**
 * Evaluate all conditions for a hook against the context.
 * Returns true if the hook should execute (all conditions pass).
 */
export function evaluateConditions(
  conditions: HookCondition[] | undefined,
  context: HookContext
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) => evaluateCondition(condition, context));
}

/**
 * Create common condition sets for event filtering
 */
export function createEventCondition(event: string): HookCondition {
  return {
    field: 'event',
    operator: 'equals',
    value: event,
  };
}

export function createProjectCondition(projectId: string): HookCondition {
  return {
    field: 'projectId',
    operator: 'equals',
    value: projectId,
  };
}

export function createSessionCondition(sessionId: string): HookCondition {
  return {
    field: 'sessionId',
    operator: 'equals',
    value: sessionId,
  };
}

/**
 * Check if a hook's conditions match the current context.
 * This is the primary entry point for condition evaluation.
 */
export function shouldHookExecute(
  conditions: HookCondition[] | undefined,
  context: HookContext
): boolean {
  return evaluateConditions(conditions, context);
}
