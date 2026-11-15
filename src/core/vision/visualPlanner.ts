/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Visual Planner (visualPlanner.ts)
 *
 * Program 06 of the AETHER 1.0 Nine-Program Capability Research Platform.
 *
 * Multi-step visual task planning, screen state tracking, action sequencing,
 * and error recovery from visual feedback.
 *
 * Inspired by:
 *   - Skyvern-AI/skyvern   (AGPL-3.0, out-of-process reference only) — task planning
 *   - microsoft/OmniParser  (Apache-2.0) — visual state tracking
 *
 * AETHER-native: no Skyvern or OmniParser imports. All logic is self-contained.
 */

import type { DetectedUIElement, PerceivedScreen } from './perceptionEngine';
import type { ElementRole } from './perceptionEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlannedActionType = 'click' | 'type' | 'scroll' | 'drag' | 'wait' | 'screenshot' | 'abort';

export interface PlannedAction {
  actionId: string;
  type: PlannedActionType;
  /** human-readable description of what this action does */
  description: string;
  /** target elementId, or null for non-element actions (wait, scroll) */
  targetElementId?: string;
  /** screen coordinate (pixel) */
  coordinate?: { x: number; y: number };
  /** for type actions: the text to type */
  text?: string;
  /** for scroll actions: direction + amount */
  scroll?: { direction: 'up' | 'down' | 'left' | 'right'; amount: number };
  /** for drag actions: start + end */
  drag?: { start: { x: number; y: number }; end: { x: number; y: number } };
  /** for wait: milliseconds */
  waitMs?: number;
  /** precondition: must be true before this action is safe */
  precondition?: string;
  /** expected post-condition */
  postcondition?: string;
}

export interface TaskPlan {
  planId: string;
  goal: string;
  /** ordered sequence of actions to execute */
  steps: PlannedAction[];
  /** index of the next step to execute */
  currentStepIndex: number;
  /** overall status */
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'aborted';
  /** screen state snapshots keyed by step index */
  screenStates: Map<number, { stateHash: string; timestamp: number }>;
  /** errors encountered during execution */
  errors: Array<{ stepIndex: number; message: string; recoverable: boolean }>;
  /** max steps before giving up */
  maxSteps: number;
}

export interface PlannerOptions {
  maxSteps?: number;
  /** how many steps to look ahead for planning */
  lookAhead?: number;
  /** whether to include screenshot verification steps */
  includeVerificationSteps?: boolean;
}

const DEFAULT_OPTIONS: Required<PlannerOptions> = {
  maxSteps: 20,
  lookAhead: 3,
  includeVerificationSteps: true,
};

// ─── Screen State Tracker ─────────────────────────────────────────────────────

export interface ScreenState {
  stateHash: string;
  elements: DetectedUIElement[];
  timestamp: number;
  previousStateHash?: string;
}

export class ScreenStateTracker {
  private history: ScreenState[] = [];

  record(state: Omit<ScreenState, 'previousStateHash'>): void {
    const prev = this.history[this.history.length - 1];
    this.history.push({ ...state, previousStateHash: prev?.stateHash });
  }

  current(): ScreenState | undefined {
    return this.history[this.history.length - 1];
  }

  hasChanged(newHash: string): boolean {
    const cur = this.current();
    return cur ? cur.stateHash !== newHash : true;
  }

  /** detect a stall: N consecutive states with the same hash */
  detectStall(minStaleSteps = 3): boolean {
    if (this.history.length < minStaleSteps) return false;
    const tail = this.history.slice(-minStaleSteps);
    const lastHash = tail[0].stateHash;
    return tail.every((s) => s.stateHash === lastHash);
  }

  /** rollback to a previous known-good state */
  rollbackTo(hash: string): ScreenState | undefined {
    const target = [...this.history].reverse().find((s) => s.stateHash === hash);
    if (target) {
      this.history = this.history.filter((s) => s.timestamp <= target.timestamp);
    }
    return this.current();
  }

  history(): readonly ScreenState[] {
    return this.history;
  }

  clear(): void {
    this.history = [];
  }
}

// ─── Planning Engine ──────────────────────────────────────────────────────────

let _planCounter = 0;
function nextPlanId(): string {
  return `plan-${++_planCounter}`;
}

/**
 * Plan a sequence of actions to achieve a goal, starting from the current
 * perceived screen.  The planner produces a deterministic action sequence
 * grounded in the detected elements — it never hallucinates elements that
 * are not in the perceived screen.
 */
export function createTaskPlan(
  goal: string,
  initialScreen: PerceivedScreen,
  options: PlannerOptions = {},
): TaskPlan {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const steps = generatePlanSteps(goal, initialScreen, opts);
  const plan: TaskPlan = {
    planId: nextPlanId(),
    goal,
    steps,
    currentStepIndex: 0,
    status: 'pending',
    screenStates: new Map(),
    errors: [],
    maxSteps: opts.maxSteps,
  };
  plan.screenStates.set(0, { stateHash: initialScreen.stateHash, timestamp: Date.now() });
  return plan;
}

/**
 * Generate a deterministic action sequence from a goal string + screen.
 * This is the "reasoning" step: analyze available elements and produce
 * actionable steps.
 */
function generatePlanSteps(goal: string, screen: PerceivedScreen, opts: Required<PlannerOptions>): PlannedAction[] {
  const steps: PlannedAction[] = [];
  const goalLower = goal.toLowerCase();
  const elements = screen.elements;

  // Action keyword mapping → element selection rules.
  const actionRules: Array<{
    keywords: string[];
    requiredRole?: ElementRole;
    actionType: PlannedActionType;
    description: (el: typeof elements[0]) => string;
  }> = [
    {
      keywords: ['click', 'press', 'tap', 'select'],
      description: (el) => `Click "${el.label}" (${el.role})`,
      actionType: 'click',
    },
    {
      keywords: ['type', 'enter', 'fill', 'input', 'write'],
      description: (el) => `Type into "${el.label}" (${el.role})`,
      actionType: 'type',
    },
    {
      keywords: ['submit', 'send', 'save', 'confirm'],
      requiredRole: 'button',
      description: (el) => `Submit via "${el.label}"`,
      actionType: 'click',
    },
    {
      keywords: ['login', 'sign in', 'authenticate'],
      description: (el) => `Click "${el.label}"`,
      actionType: 'click',
    },
    {
      keywords: ['scroll', 'scroll down', 'scroll up'],
      description: () => `Scroll down to reveal more content`,
      actionType: 'scroll',
    },
    {
      keywords: ['search', 'find', 'look for'],
      description: (el) => `Click search element "${el.label}"`,
      actionType: 'click',
    },
    {
      keywords: ['wait', 'pause', 'loading'],
      description: () => `Wait for page to settle`,
      actionType: 'wait',
    },
  ];

  // Find the matching rule.
  const matchedRule = actionRules.find((r) => r.keywords.some((k) => goalLower.includes(k)));

  if (matchedRule) {
    // Find the best element for this action.
    const candidates = matchedRule.requiredRole
      ? elements.filter((e) => e.role === matchedRule.requiredRole)
      : elements;

    if (candidates.length > 0) {
      const best = candidates.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
      const step: PlannedAction = {
        actionId: `step-${steps.length + 1}`,
        type: matchedRule.actionType,
        description: matchedRule.description(best),
        targetElementId: best.elementId,
        coordinate: { x: best.bbox.x + best.bbox.width / 2, y: best.bbox.y + best.bbox.height / 2 },
        postcondition: `Screen state changes after ${matchedRule.actionType} on "${best.label}"`,
      };
      if (matchedRule.actionType === 'type') {
        step.text = ''; // caller fills this in
        step.description = `Type into "${best.label}" (${best.role})`;
      }
      if (matchedRule.actionType === 'scroll') {
        step.scroll = { direction: 'down', amount: 300 };
        step.coordinate = undefined;
      }
      if (matchedRule.actionType === 'wait') {
        step.waitMs = 1000;
        step.targetElementId = undefined;
        step.coordinate = undefined;
      }
      steps.push(step);

      // Add a verification step if enabled.
      if (opts.includeVerificationSteps && steps.length < opts.maxSteps) {
        steps.push({
          actionId: `step-${steps.length + 1}`,
          type: 'screenshot',
          description: 'Verify screen state changed after action',
          postcondition: 'stateHash differs from pre-action state',
        });
      }
    } else {
      // No matching element found — plan a generic recovery.
      steps.push({
        actionId: `step-${steps.length + 1}`,
        type: 'screenshot',
        description: `Cannot find element for "${goal}" — capture current state for review`,
      });
      steps.push({
        actionId: `step-${steps.length + 1}`,
        type: 'abort',
        description: `No element matches goal "${goal}"`,
      });
    }
  } else {
    // No keyword matched — produce a generic plan.
    steps.push({
      actionId: `step-${steps.length + 1}`,
      type: 'screenshot',
      description: `Capture current screen for goal "${goal}"`,
    });
    if (elements.length > 0) {
      const best = elements.reduce((a, b) => (a.confidence >= b.confidence ? a : b));
      steps.push({
        actionId: `step-${steps.length + 1}`,
        type: 'click',
        description: `Click highest-confidence element "${best.label}" (${best.role})`,
        targetElementId: best.elementId,
        coordinate: { x: best.bbox.x + best.bbox.width / 2, y: best.bbox.y + best.bbox.height / 2 },
      });
    }
  }

  // Safety: cap at maxSteps.
  return steps.slice(0, opts.maxSteps);
}

// ─── Error Recovery ───────────────────────────────────────────────────────────

export interface RecoveryAction {
  /** the recovery action to take */
  action: PlannedAction;
  /** what error state this addresses */
  addresses: string;
  /** whether this is a fallback (less reliable) recovery */
  isFallback: boolean;
}

const ERROR_SIGNATURES: Array<{ match: RegExp; recovery: Omit<RecoveryAction, 'action'> }> = [
  { match: /stall|no change|timeout/i, recovery: { addresses: 'stall', isFallback: false } },
  { match: /not found|missing|nonexistent/i, recovery: { addresses: 'missing element', isFallback: false } },
  { match: /error|failed|exception/i, recovery: { addresses: 'error state', isFallback: false } },
  { match: /captcha|verify you are human/i, recovery: { addresses: 'captcha', isFallback: true } },
  { match: /modal|dialog|popup/i, recovery: { addresses: 'modal/dialog', isFallback: false } },
];

/**
 * Given an error message from a failed plan step, produce a recovery action.
 */
export function recoverFromError(errorMessage: string, screen: PerceivedScreen): RecoveryAction {
  const matched = ERROR_SIGNATURES.find((e) => e.match.test(errorMessage));
  if (matched) {
    // Look for a dismiss/close button in the screen elements.
    const dismissBtn = screen.elements.find(
      (e) => e.role === 'button' && /close|dismiss|cancel|ok|got it|accept/i.test(e.label),
    );
    const target = dismissBtn ?? screen.elements.reduce((a, b) => (a.confidence >= b.confidence ? a : b), screen.elements[0]);
    if (!target && screen.elements.length > 0) {
      const anyTarget = screen.elements[0];
      return {
        action: {
          actionId: `recovery-${Date.now()}`,
          type: 'click',
          description: `Dismiss error via "${anyTarget.label}"`,
          targetElementId: anyTarget.elementId,
          coordinate: { x: anyTarget.bbox.x + anyTarget.bbox.width / 2, y: anyTarget.bbox.y + anyTarget.bbox.height / 2 },
        },
        ...matched.recovery,
      };
    }
    if (target) {
      return {
        action: {
          actionId: `recovery-${Date.now()}`,
          type: 'click',
          description: `Dismiss error via "${target.label}"`,
          targetElementId: target.elementId,
          coordinate: { x: target.bbox.x + target.bbox.width / 2, y: target.bbox.y + target.bbox.height / 2 },
        },
        ...matched.recovery,
      };
    }
  }

  // Generic fallback: scroll down and retry.
  return {
    action: {
      actionId: `recovery-${Date.now()}`,
      type: 'scroll',
      description: 'Scroll down as generic recovery',
      scroll: { direction: 'down', amount: 200 },
    },
    addresses: 'generic fallback',
    isFallback: true,
  };
}

// ─── Planner Utilities ────────────────────────────────────────────────────────

/**
 * Mark a plan step as completed and advance to the next step.
 */
export function advancePlan(plan: TaskPlan, success: boolean): TaskPlan {
  if (plan.status === 'completed' || plan.status === 'aborted') return plan;

  if (!success) {
    plan.status = 'failed';
    return plan;
  }

  plan.currentStepIndex++;
  if (plan.currentStepIndex >= plan.steps.length) {
    plan.status = 'completed';
  } else {
    plan.status = 'in_progress';
  }
  return plan;
}

/**
 * Record an error in the plan and optionally attempt recovery.
 */
export function recordPlanError(plan: TaskPlan, stepIndex: number, message: string, recoverable = true): TaskPlan {
  plan.errors.push({ stepIndex, message, recoverable });
  if (!recoverable) {
    plan.status = 'aborted';
  }
  return plan;
}

/**
 * Get the current step to execute from a plan.
 */
export function currentStep(plan: TaskPlan): PlannedAction | undefined {
  return plan.steps[plan.currentStepIndex];
}

/**
 * Whether the plan has more steps to execute.
 */
export function hasMoreSteps(plan: TaskPlan): boolean {
  return plan.currentStepIndex < plan.steps.length && plan.status !== 'completed' && plan.status !== 'aborted';
}
