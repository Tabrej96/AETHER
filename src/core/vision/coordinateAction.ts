/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Visual Computer Engine — Coordinate-Based Action (coordinateAction.ts)
 *
 * Program 06 of the AETHER 1.0 Nine-Program Capability Research Platform.
 *
 * Coordinate-based interactions: click, type, scroll, pan, drag-and-drop.
 * Operates on pixel coordinates normalized or absolute, delegating actual
 * DOM manipulation to the browser engine (P05/P07).
 *
 * Inspired by:
 *   - Skyvern-AI/skyvern   (AGPL-3.0, out-of-process reference only) — coordinate actions
 *   - microsoft/OmniParser  (Apache-2.0) — coordinate grounding
 *
 * AETHER-native: no OmniParser or Skyvern imports. All logic is self-contained.
 */

import type { BoundingBox } from './perceptionEngine';
import type { ElementRole } from './perceptionEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coordinate {
  x: number;
  y: number;
}

export interface ClickAction {
  type: 'click';
  coordinate: Coordinate;
  button?: 'left' | 'right' | 'middle';
  clickCount?: 1 | 2;
}

export interface TypeAction {
  type: 'type';
  coordinate?: Coordinate;
  text: string;
  /** press Enter after typing */
  submit?: boolean;
  /** clear the field before typing */
  clear?: boolean;
}

export interface ScrollAction {
  type: 'scroll';
  coordinate?: Coordinate;
  direction: 'up' | 'down' | 'left' | 'right';
  amount: number;          // pixels
  scrollBy?: 'pixel' | 'page';
}

export interface DragAction {
  type: 'drag';
  start: Coordinate;
  end: Coordinate;
  /** hold duration in ms before releasing */
  holdDurationMs?: number;
}

export interface WaitAction {
  type: 'wait';
  durationMs: number;
  /** reason for waiting */
  reason?: string;
}

export interface PanAction {
  type: 'pan';
  start: Coordinate;
  end: Coordinate;
  /** hold duration */
  holdDurationMs?: number;
}

export type CoordinateAction =
  | ClickAction
  | TypeAction
  | ScrollAction
  | DragAction
  | WaitAction
  | PanAction;

export interface ActionResult {
  success: boolean;
  action: CoordinateAction;
  /** whether the action was actually executed (not blocked by safety gate) */
  executed: boolean;
  /** screen state hash before action */
  stateBefore: string;
  /** screen state hash after action */
  stateAfter?: string;
  /** error message if failed */
  error?: string;
  /** timestamp */
  timestamp: number;
}

// ─── Coordinate Utilities ─────────────────────────────────────────────────────

/**
 * Convert normalized [0,1] coordinates to pixel coordinates.
 */
export function normalizedToPixel(
  coord: Coordinate,
  viewport: { width: number; height: number },
): Coordinate {
  return {
    x: Math.round(coord.x * viewport.width),
    y: Math.round(coord.y * viewport.height),
  };
}

/**
 * Convert pixel coordinates to normalized [0,1].
 */
export function pixelToNormalized(
  coord: Coordinate,
  viewport: { width: number; height: number },
): Coordinate {
  return {
    x: coord.x / viewport.width,
    y: coord.y / viewport.height,
  };
}

/**
 * Clamp a coordinate to viewport bounds.
 */
export function clampCoordinate(coord: Coordinate, viewport: { width: number; height: number }): Coordinate {
  return {
    x: Math.max(0, Math.min(coord.x, viewport.width)),
    y: Math.max(0, Math.min(coord.y, viewport.height)),
  };
}

/**
 * Get the center of a bounding box as pixel coordinates.
 */
export function bboxCenter(bbox: BoundingBox): Coordinate {
  return { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}

/**
 * Check if a coordinate falls within a bounding box.
 */
export function isInBbox(coord: Coordinate, bbox: BoundingBox): boolean {
  return (
    coord.x >= bbox.x &&
    coord.x <= bbox.x + bbox.width &&
    coord.y >= bbox.y &&
    coord.y <= bbox.y + bbox.height
  );
}

// ─── Coordinate Action Engine ─────────────────────────────────────────────────

export interface ActionExecutor {
  click(coord: Coordinate, button?: 'left' | 'right' | 'middle', clickCount?: number): Promise<void>;
  type(coord: Coordinate | undefined, text: string, submit?: boolean, clear?: boolean): Promise<void>;
  scroll(coord: Coordinate | undefined, direction: 'up' | 'down' | 'left' | 'right', amount: number): Promise<void>;
  drag(start: Coordinate, end: Coordinate, holdDurationMs?: number): Promise<void>;
  pan(start: Coordinate, end: Coordinate, holdDurationMs?: number): Promise<void>;
  getCurrentStateHash(): Promise<string>;
  getViewport(): Promise<{ width: number; height: number }>;
}

/**
 * Default no-op executor.  Used in tests or when no real executor is attached.
 * The host system (P05/P07) provides the real executor.
 */
export function createNoOpExecutor(): ActionExecutor {
  let stateHash = 'noop-initial';
  return {
    async click() { stateHash = `noop-click-${Date.now()}`; },
    async type() { stateHash = `noop-type-${Date.now()}`; },
    async scroll() { stateHash = `noop-scroll-${Date.now()}`; },
    async drag() { stateHash = `noop-drag-${Date.now()}`; },
    async pan() { stateHash = `noop-pan-${Date.now()}`; },
    async getCurrentStateHash() { return stateHash; },
    async getViewport() { return { width: 1280, height: 900 }; },
  };
}

let _executor: ActionExecutor = createNoOpExecutor();

export function setActionExecutor(executor: ActionExecutor): void {
  _executor = executor;
}

export function getActionExecutor(): ActionExecutor {
  return _executor;
}

/**
 * Execute a coordinate-based action.  This is the main entry point.
 * Returns the result including pre/post state hashes for verification.
 */
export async function executeAction(action: CoordinateAction): Promise<ActionResult> {
  const stateBefore = await _executor.getCurrentStateHash();
  const timestamp = Date.now();

  try {
    switch (action.type) {
      case 'click': {
        await _executor.click(
          action.coordinate ?? { x: 0, y: 0 },
          action.button,
          action.clickCount,
        );
        break;
      }
      case 'type': {
        await _executor.type(action.coordinate, action.text, action.submit, action.clear);
        break;
      }
      case 'scroll': {
        await _executor.scroll(action.coordinate, action.direction, action.amount);
        break;
      }
      case 'drag': {
        await _executor.drag(action.start, action.end, action.holdDurationMs);
        break;
      }
      case 'pan': {
        await _executor.pan(action.start, action.end, action.holdDurationMs);
        break;
      }
      case 'wait': {
        await new Promise((r) => setTimeout(r, action.durationMs));
        break;
      }
    }

    const stateAfter = await _executor.getCurrentStateHash();
    return {
      success: true,
      action,
      executed: true,
      stateBefore,
      stateAfter,
      timestamp,
    };
  } catch (err) {
    return {
      success: false,
      action,
      executed: false,
      stateBefore,
      timestamp,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Execute a sequence of coordinate actions, stopping on first failure.
 * Returns results for each action.
 */
export async function executeActionSequence(actions: CoordinateAction[]): Promise<ActionResult[]> {
  const results: ActionResult[] = [];
  for (const action of actions) {
    const result = await executeAction(action);
    results.push(result);
    if (!result.success) break;
  }
  return results;
}

// ─── Safety Gate ──────────────────────────────────────────────────────────────

export interface SafetyGate {
  /** check if an action is safe to execute */
  check(action: CoordinateAction): { safe: boolean; reason?: string };
  /** whether destructive operations are allowed */
  allowDestructive: boolean;
}

export const DEFAULT_SAFETY_GATE: SafetyGate = {
  allowDestructive: false,

  check(action) {
    if (!this.allowDestructive && isDestructiveAction(action)) {
      return { safe: false, reason: 'Destructive action blocked — set allowDestructive=true to override.' };
    }
    return { safe: true };
  },
};

function isDestructiveAction(action: CoordinateAction): boolean {
  // Right-click and drag actions are considered potentially destructive.
  if (action.type === 'click' && (action as ClickAction).button === 'right') return true;
  if (action.type === 'drag') return true;
  if (action.type === 'pan') return true;
  return false;
}

/**
 * Run a safety check on an action before executing it.
 */
export function safetyCheck(action: CoordinateAction, gate: SafetyGate = DEFAULT_SAFETY_GATE): { safe: boolean; reason?: string } {
  return gate.check(action);
}

// ─── Coordinate Action Builder Helpers ────────────────────────────────────────

/**
 * Build a click action at a given coordinate (or element center).
 */
export function clickAt(coord: Coordinate, button: ClickAction['button'] = 'left', clickCount = 1): ClickAction {
  return { type: 'click', coordinate: coord, button, clickCount };
}

/**
 * Build a click action at the center of a bounding box.
 */
export function clickOnElement(bbox: BoundingBox, button: ClickAction['button'] = 'left', clickCount = 1): ClickAction {
  return { type: 'click', coordinate: bboxCenter(bbox), button, clickCount };
}

/**
 * Build a type action.
 */
export function typeAt(coord: Coordinate | undefined, text: string, opts: { submit?: boolean; clear?: boolean } = {}): TypeAction {
  return { type: 'type', coordinate: coord, text, submit: opts.submit, clear: opts.clear };
}

/**
 * Build a scroll action.
 */
export function scrollBy(direction: ScrollAction['direction'], amount: number, coord?: Coordinate): ScrollAction {
  return { type: 'scroll', coordinate: coord, direction, amount };
}

/**
 * Build a drag action.
 */
export function drag(from: Coordinate, to: Coordinate, holdMs?: number): DragAction {
  return { type: 'drag', start: from, end: to, holdDurationMs: holdMs };
}

/**
 * Build a wait action.
 */
export function waitFor(durationMs: number, reason?: string): WaitAction {
  return { type: 'wait', durationMs, reason };
}
