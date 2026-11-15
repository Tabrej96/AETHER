/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Computer-Use Task Loop (computerUseLoop.ts)
 *
 * Program 06 of the AETHER 1.0 Nine-Program Capability Research Platform.
 *
 * The complete perception -> reasoning -> action -> verification cycle.
 * State machine for task execution with timeout and safety limits.
 *
 * Inspired by:
 *   - Skyvern-AI/skyvern   (AGPL-3.0, out-of-process reference only) — task loop
 *   - microsoft/OmniParser  (Apache-2.0) — visual state management
 *
 * AETHER-native: no OmniParser or Skyvern imports. All logic is self-contained.
 */

import type { PerceivedScreen } from './perceptionEngine';
import type { ElementRole, PerceptionConfig } from './perceptionEngine';
import type { GroundingIntent, GroundingResult, groundIntent } from './visualGrounding';
import type {
  PlannedAction,
  TaskPlan,
  PlannerOptions,
  ScreenState,
  ScreenStateTracker,
  createTaskPlan,
  recoverFromError,
} from './visualPlanner';
import type {
  CoordinateAction,
  ActionResult,
  clickOnElement,
  executeAction,
  safetyCheck,
} from './coordinateAction';
import { DEFAULT_SAFETY_GATE } from './coordinateAction';
import type {
  ErrorAnalysisReport,
  DetectedError,
  analyzeScreenState,
  detectErrors,
  summarizeErrors,
} from './errorRecognizer';

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoopState =
  | 'idle'
  | 'perceiving'
  | 'reasoning'
  | 'acting'
  | 'verifying'
  | 'recovering'
  | 'completed'
  | 'failed'
  | 'aborted'
  | 'timeout';

export interface ComputerUseTask {
  taskId: string;
  goal: string;
  /** initial screen (when starting from an already-perceived screen) */
  initialScreen?: PerceivedScreen;
  /** how the loop should perceive screens — injected by the host system */
  perceptionFn?: () => Promise<PerceivedScreen>;
}

export interface LoopStepResult {
  step: number;
  state: LoopState;
  perception: PerceivedScreen;
  planStep?: PlannedAction;
  actionResult?: ActionResult;
  errorAnalysis?: ErrorAnalysisReport;
  /** reasoning for this step */
  reasoning: string;
  /** whether the goal was achieved at this step */
  goalAchieved: boolean;
}

export interface LoopExecutionResult {
  taskId: string;
  goal: string;
  /** final state */
  finalState: LoopState;
  steps: LoopStepResult[];
  /** total number of steps executed */
  totalSteps: number;
  /** whether the goal was achieved */
  success: boolean;
  /** errors encountered */
  errors: DetectedError[];
  /** overall time spent (ms) */
  elapsedMs: number;
  /** final screen */
  finalScreen: PerceivedScreen | null;
  /** reason for failure/abort */
  failureReason?: string;
}

export interface LoopOptions {
  /** maximum number of loop iterations before giving up */
  maxSteps?: number;
  /** timeout for the entire task in ms */
  timeoutMs?: number;
  /** safety gate for action verification */
  safetyGate?: typeof DEFAULT_SAFETY_GATE;
  perceptionConfig?: PerceptionConfig;
  plannerOptions?: PlannerOptions;
  /** ground confidence floor */
  confidenceFloor?: number;
  /** whether to auto-recover from errors */
  autoRecover?: boolean;
  /** max consecutive errors before aborting */
  maxConsecutiveErrors?: number;
}

const DEFAULT_LOOP_OPTIONS: Required<LoopOptions> = {
  maxSteps: 15,
  timeoutMs: 120_000,
  safetyGate: DEFAULT_SAFETY_GATE,
  perceptionConfig: { minConfidence: 0.3, iouDedupThreshold: 0.6, enableHeuristicClassification: true },
  plannerOptions: { maxSteps: 20, lookAhead: 3, includeVerificationSteps: true },
  confidenceFloor: 0.4,
  autoRecover: true,
  maxConsecutiveErrors: 3,
};

// ─── Computer-Use Loop Engine ─────────────────────────────────────────────────

export interface ComputerUseLoop {
  currentState: LoopState;
  start(task: ComputerUseTask): Promise<LoopExecutionResult>;
  perceiveScreen(): Promise<PerceivedScreen | null>;
  getCurrentScreen(): PerceivedScreen | null;
}

export function createComputerUseLoop(
  options: LoopOptions = {},
): ComputerUseLoop {
  const opts = { ...DEFAULT_LOOP_OPTIONS, ...options };
  let currentState: LoopState = 'idle';
  let currentScreen: PerceivedScreen | null = null;
  const previousStateHashes: string[] = [];
  const errorHistory: ErrorAnalysisReport[] = [];
  const errors: Array<{ message: string; stepIndex: number }> = [];
  let startTime = 0;
  let consecutiveErrors = 0;

  return {
    currentState,

    async start(task: ComputerUseTask): Promise<LoopExecutionResult> {
      startTime = Date.now();
      currentState = 'idle';
      currentScreen = task.initialScreen ?? null;
      previousStateHashes.length = 0;
      errorHistory.length = 0;
      errors.length = 0;
      consecutiveErrors = 0;

      const result: LoopExecutionResult = {
        taskId: task.taskId,
        goal: task.goal,
        finalState: 'idle',
        steps: [],
        totalSteps: 0,
        success: false,
        errors: [],
        elapsedMs: 0,
        finalScreen: null,
      };

      // Step 0: perceive initial screen.
      if (!currentScreen && task.perceptionFn) {
        currentScreen = await task.perceptionFn();
      }
      if (!currentScreen) {
        currentState = 'failed';
        result.finalState = 'failed';
        result.failureReason = 'No perception function provided and no initial screen given.';
        result.elapsedMs = Date.now() - startTime;
        result.finalScreen = currentScreen;
        return result;
      }
      previousStateHashes.push(currentScreen.stateHash);

      // Main loop.
      for (let step = 0; step < opts.maxSteps; step++) {
        // Check timeout.
        if (Date.now() - startTime > opts.timeoutMs) {
          currentState = 'timeout';
          result.finalState = 'timeout';
          result.failureReason = `Task timed out after ${opts.timeoutMs}ms.`;
          result.elapsedMs = Date.now() - startTime;
          result.finalScreen = currentScreen;
          return result;
        }

        // -- REASONING: create a plan from the current screen and goal.
        const plan = createTaskPlan(task.goal, currentScreen, opts.plannerOptions);
        const planStep = plan.steps[plan.currentStepIndex];

        if (!planStep || planStep.type === 'abort') {
          currentState = 'failed';
          result.finalState = 'failed';
          result.failureReason = `No actionable plan step for goal "${task.goal}".`;
          result.elapsedMs = Date.now() - startTime;
          result.finalScreen = currentScreen;
          return result;
        }

        // -- ACTING: execute the planned action.
        let actionResult: ActionResult;
        if (planStep.type === 'screenshot') {
          // Verification-only step: just re-perceive.
          currentScreen = task.perceptionFn ? await task.perceptionFn() : currentScreen;
          previousStateHashes.push(currentScreen.stateHash);
          continue;
        }

        // Build and execute the coordinate action.
        const coordAction = buildCoordinateAction(planStep);
        const safety = safetyCheck(coordAction, opts.safetyGate);
        if (!safety.safe) {
          currentState = 'aborted';
          result.finalState = 'aborted';
          result.failureReason = `Safety gate blocked action: ${safety.reason}`;
          result.elapsedMs = Date.now() - startTime;
          result.finalScreen = currentScreen;
          return result;
        }

        actionResult = await executeAction(coordAction);
        const stateBefore = currentScreen.stateHash;

        // -- VERIFYING: re-perceive and check for errors + state change.
        currentScreen = task.perceptionFn ? await task.perceptionFn() : currentScreen;
        const stateAfter = currentScreen.stateHash;
        const stateChanged = stateAfter !== stateBefore;
        previousStateHashes.push(stateAfter);

        const errorReport = analyzeScreenState(currentScreen, previousStateHashes);
        errorHistory.push(errorReport);

        // CAPTCHA check.
        const captcha = detectErrors(currentScreen).find((e) => e.errorType === 'captcha');
        if (captcha) {
          currentState = 'aborted';
          result.finalState = 'aborted';
          result.failureReason = `CAPTCHA detected — requires human intervention.`;
          result.elapsedMs = Date.now() - startTime;
          result.finalScreen = currentScreen;
          result.steps.push({
            step,
            state: 'aborted',
            perception: currentScreen,
            planStep,
            actionResult,
            errorAnalysis: errorReport,
            reasoning: `CAPTCHA detected: ${captcha.description}`,
            goalAchieved: false,
          });
          result.totalSteps = step + 1;
          result.errors = detectErrors(currentScreen);
          return result;
        }

        // Escalation check.
        if (errorReport.recommendedAction === 'escalate') {
          currentState = 'aborted';
          result.finalState = 'aborted';
          result.failureReason = `Escalation required: ${summarizeErrors(errorReport)}`;
          result.elapsedMs = Date.now() - startTime;
          result.finalScreen = currentScreen;
          result.steps.push({
            step,
            state: 'aborted',
            perception: currentScreen,
            planStep,
            actionResult,
            errorAnalysis: errorReport,
            reasoning: `Escalation required: ${summarizeErrors(errorReport)}`,
            goalAchieved: false,
          });
          result.totalSteps = step + 1;
          result.errors = detectErrors(currentScreen);
          return result;
        }

        // Recovery.
        if (!actionResult.success || !stateChanged) {
          if (errorReport.recommendedAction === 'recover' && opts.autoRecover) {
            const recovery = recoverFromError(
              errors[errors.length - 1]?.message || 'action failed',
              currentScreen,
            );
            const recSafety = safetyCheck(recovery.action, opts.safetyGate);
            if (recSafety.safe) {
              const recResult = await executeAction(recovery.action);
              currentScreen = task.perceptionFn ? await task.perceptionFn() : currentScreen;
              previousStateHashes.push(currentScreen.stateHash);
              errors.push({ message: `Recovery action ${recovery.action.type} executed`, stepIndex: step });
              consecutiveErrors++;
              continue;
            }
          }

          errors.push({ message: actionResult.error || 'State did not change after action.', stepIndex: step });
          consecutiveErrors++;

          result.steps.push({
            step,
            state: 'failed',
            perception: currentScreen,
            planStep,
            actionResult,
            errorAnalysis: errorReport,
            reasoning: `Action failed or state unchanged: ${actionResult.error || 'no state change'}`,
            goalAchieved: false,
          });
          result.totalSteps = step + 1;
          continue;
        }

        // Success: state changed and no escalation.
        const goalAchieved = errorReport.recommendedAction !== 'retry';
        consecutiveErrors = 0;

        result.steps.push({
          step,
          state: 'completed',
          perception: currentScreen,
          planStep,
          actionResult,
          errorAnalysis: errorReport,
          reasoning: goalAchieved
            ? `Action succeeded and state changed.`
            : `Action succeeded but retry recommended.`,
          goalAchieved,
        });
        result.totalSteps = step + 1;
        result.errors = detectErrors(currentScreen);

        if (goalAchieved) {
          result.success = true;
          result.finalState = 'completed';
          result.elapsedMs = Date.now() - startTime;
          result.finalScreen = currentScreen;
          return result;
        }

        // Check consecutive error limit.
        if (consecutiveErrors >= opts.maxConsecutiveErrors) {
          currentState = 'aborted';
          result.finalState = 'aborted';
          result.failureReason = `Too many consecutive errors (${consecutiveErrors}).`;
          result.elapsedMs = Date.now() - startTime;
          result.finalScreen = currentScreen;
          return result;
        }
      }

      // Exhausted max steps.
      currentState = 'failed';
      result.finalState = 'failed';
      result.failureReason = `Exhausted ${opts.maxSteps} steps without achieving the goal.`;
      result.elapsedMs = Date.now() - startTime;
      result.finalScreen = currentScreen;
      return result;
    },

    async perceiveScreen(): Promise<PerceivedScreen | null> {
      return currentScreen;
    },

    getCurrentScreen(): PerceivedScreen | null {
      return currentScreen;
    },
  };
}

/**
 * Convert a PlannedAction into a CoordinateAction for execution.
 */
function buildCoordinateAction(planStep: PlannedAction): CoordinateAction {
  switch (planStep.type) {
    case 'click':
      return clickOnElement(
        planStep.coordinate
          ? { x: planStep.coordinate.x, y: planStep.coordinate.y, width: 10, height: 10 }
          : { x: 0, y: 0, width: 10, height: 10 },
      );
    case 'type':
      return { type: 'type', coordinate: planStep.coordinate, text: planStep.text ?? '', submit: true };
    case 'scroll':
      return { type: 'scroll', coordinate: planStep.coordinate, direction: 'down', amount: planStep.scroll?.amount ?? 300 };
    case 'drag':
      return {
        type: 'drag',
        start: planStep.drag?.start ?? { x: 0, y: 0 },
        end: planStep.drag?.end ?? { x: 0, y: 0 },
      };
    case 'pan':
      return {
        type: 'pan',
        start: planStep.coordinate ?? { x: 0, y: 0 },
        end: { x: 0, y: 0 },
      };
    case 'wait':
      return { type: 'wait', durationMs: planStep.waitMs ?? 1000 };
    case 'screenshot':
      return { type: 'wait', durationMs: 0, reason: 'screenshot verification' };
    case 'abort':
      return { type: 'wait', durationMs: 0, reason: 'abort' };
    default:
      return { type: 'wait', durationMs: 0 };
  }
}

// ─── High-Level Task Execution ────────────────────────────────────────────────

/**
 * Execute a simple computer-use task: given a goal, a perception function, and
 * an action executor, run the full loop and return the result.
 *
 * This is the main entry point for consumers of the Visual Computer Engine.
 */
export async function executeComputerUseTask(
  task: ComputerUseTask,
  options: LoopOptions = {},
): Promise<LoopExecutionResult> {
  const loop = createComputerUseLoop(options);

  const enhancedTask: ComputerUseTask = {
    ...task,
    perceptionFn: async (): Promise<PerceivedScreen> => {
      if (task.perceptionFn) return task.perceptionFn();
      throw new Error('No perception function provided. The host system must supply one.');
    },
  };

  return loop.start(enhancedTask);
}

/**
 * Execute a simple "ground + click + verify" micro-loop:
 *   1. Perceive the screen.
 *   2. Ground the intent to an element.
 *   3. Click the element.
 *   4. Re-perceive and verify state changed.
 *
 * Returns the loop step result with verification info.
 */
export async function groundClickVerify(
  intent: GroundingIntent,
  perceive: () => Promise<PerceivedScreen>,
  options: { confidenceFloor?: number } = {},
): Promise<{
  grounded: boolean;
  stepResult: LoopStepResult;
  actionResult?: ActionResult;
}> {
  const confidenceFloor = options.confidenceFloor ?? 0.4;

  // Step 1: perceive.
  const screen = await perceive();
  const stateBefore = screen.stateHash;

  // Step 2: reason (ground).
  const groundingResult = groundIntent(screen.elements, intent, { confidenceFloor });

  if (!groundingResult.grounded || !groundingResult.target) {
    return {
      grounded: false,
      stepResult: {
        step: 1,
        state: 'failed',
        perception: screen,
        reasoning: groundingResult.reasoning,
        goalAchieved: false,
      },
    };
  }

  // Step 3: act.
  const action = clickOnElement(groundingResult.target.bbox);
  const safety = safetyCheck(action);
  if (!safety.safe) {
    return {
      grounded: true,
      stepResult: {
        step: 1,
        state: 'aborted',
        perception: screen,
        reasoning: `Safety gate blocked action: ${safety.reason}`,
        goalAchieved: false,
      },
    };
  }

  const actionResult = await executeAction(action);

  // Step 4: verify.
  const screenAfter = await perceive();
  const stateChanged = screenAfter.stateHash !== stateBefore;
  const errorReport = analyzeScreenState(screenAfter, [stateBefore]);

  const goalAchieved = actionResult.success && stateChanged && errorReport.recommendedAction !== 'escalate';

  return {
    grounded: true,
    actionResult,
    stepResult: {
      step: 1,
      state: goalAchieved ? 'completed' : 'failed',
      perception: screenAfter,
      planStep: {
        actionId: 'ground-click-1',
        type: 'click',
        description: `Click "${groundingResult.target.label}" (${groundingResult.target.role})`,
        targetElementId: groundingResult.target.elementId,
        coordinate: groundingResult.target.coordinate,
      },
      actionResult,
      errorAnalysis: errorReport,
      reasoning: goalAchieved
        ? `Successfully clicked "${groundingResult.target.label}" and verified state change.`
        : `Action executed but verification failed: ${summarizeErrors(errorReport)}`,
      goalAchieved,
    },
  };
}
