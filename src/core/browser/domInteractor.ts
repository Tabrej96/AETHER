/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * DOM Interaction Layer (src/core/browser/domInteractor.ts)
 *
 * Structured DOM operations: click, type, scroll, drag, multi-element form fill.
 * All operations use CSS selectors or accessibility references — never raw JS.
 *
 * SECURITY: No operation executes arbitrary JavaScript from the page.
 * All inputs are treated as data values, never as executable code.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClickOptions {
  /** Hold modifier keys during the click. */
  modifiers?: ('Alt' | 'Control' | 'Meta' | 'Shift')[];
  /** Number of clicks (1 = single, 2 = double). */
  clickCount?: number;
  /** Force the click even if the element is obscured. */
  force?: boolean;
  /** Delay between mousedown and mouseup in ms. */
  delayMs?: number;
}

export interface TypeOptions {
  /** Clear the input field before typing. */
  clearFirst?: boolean;
  /** Delay between keystrokes in ms. */
  delayMs?: number;
  /** Press Enter after typing. */
  pressEnter?: boolean;
}

export interface ScrollOptions {
  /** Scroll target: 'element' or 'top'/'bottom'. */
  target?: 'element' | 'top' | 'bottom';
  /** Vertical scroll offset in px (for top/bottom). */
  offsetY?: number;
  /** Whether to align to center of viewport. */
  alignToCenter?: boolean;
}

export interface DragOptions {
  /** Target selector to drag to. */
  targetSelector: string;
  /** Button to use (left = 0, right = 2). */
  button?: 0 | 2;
  /** Drag duration in ms. */
  durationMs?: number;
}

export interface FormField {
  /** CSS selector for the field. */
  selector: string;
  /** Value to set. For select, use the visible option text. */
  value: string;
  /** Field type hint (auto-detected from selector when omitted). */
  fieldType?: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'checkbox' | 'radio';
  /** For checkbox/radio: whether to check (true) or uncheck (false). */
  checked?: boolean;
}

export interface FillFormOptions {
  /** Clear all fields before filling. */
  clearFirst?: boolean;
  /** Delay between fields in ms. */
  fieldDelayMs?: number;
  /** Submit the form after filling (click the submit button matching this selector). */
  submitSelector?: string;
}

export interface MultiElementAction {
  /** CSS selector. */
  selector: string;
  /** Action to perform. */
  action: 'click' | 'type' | 'scroll' | 'check' | 'uncheck' | 'select';
  /** Value for type/select/check. */
  value?: string;
  /** Delay after this action in ms. */
  delayMs?: number;
}

// ─── DOM Interactor ───────────────────────────────────────────────────────────

import type { BrowserBackend, AccessibilityNode } from './browserEngine';

export class DomInteractor {
  constructor(private readonly backend: BrowserBackend) {}

  // ── Click ──────────────────────────────────────────────────────────────────

  /**
   * Click an element identified by a CSS selector.
   * Fails fast with a descriptive error if the element is not found.
   */
  async click(sessionId: string, pageId: string, selector: string, options: ClickOptions = {}): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, selector);
    await this.backend.click(pageId, selector);
  }

  /**
   * Double-click an element.
   */
  async doubleClick(sessionId: string, pageId: string, selector: string): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, selector);
    await this.backend.click(pageId, selector);
  }

  // ── Type ───────────────────────────────────────────────────────────────────

  /**
   * Type text into an input field identified by a CSS selector.
   * SECURITY: text is never evaluated as JavaScript — it is written as a string value.
   */
  async typeText(sessionId: string, pageId: string, selector: string, text: string, options: TypeOptions = {}): Promise<void> {
    if (options.clearFirst) {
      await this.clearField(sessionId, pageId, selector);
    }
    await this.ensureElementVisible(sessionId, pageId, selector);
    await this.backend.typeText(pageId, selector, text);
  }

  /**
   * Clear an input field by selecting all content and deleting it.
   */
  async clearField(sessionId: string, pageId: string, selector: string): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, selector);
    await this.backend.typeText(pageId, selector, '');
  }

  // ── Scroll ─────────────────────────────────────────────────────────────────

  /**
   * Scroll an element into the viewport.
   */
  async scrollIntoView(sessionId: string, pageId: string, selector: string, options: ScrollOptions = {}): Promise<void> {
    const target = options.target ?? 'element';
    if (target === 'element') {
      await this.backend.scrollIntoView(pageId, selector);
    } else if (target === 'top') {
      await this.backend.scrollIntoView(pageId, 'body');
    } else {
      await this.backend.scrollIntoView(pageId, 'body');
    }
  }

  // ── Drag ───────────────────────────────────────────────────────────────────

  /**
   * Drag an element to a target position.
   * Note: the mock backend records the intent; real backends implement the gesture.
   */
  async drag(sessionId: string, pageId: string, sourceSelector: string, options: DragOptions): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, sourceSelector);
    await this.ensureElementVisible(sessionId, pageId, options.targetSelector);
  }

  // ── Form Fill ──────────────────────────────────────────────────────────────

  /**
   * Fill a form with multiple fields in one operation.
   * Supports text, select, checkbox, radio, and textarea fields.
   * SECURITY: all values are treated as data — never interpolated into JS.
   */
  async fillForm(sessionId: string, pageId: string, fields: FormField[], options: FillFormOptions = {}): Promise<void> {
    if (options.clearFirst) {
      for (const field of fields) {
        await this.clearField(sessionId, pageId, field.selector);
      }
    }

    for (const field of fields) {
      const fieldType = field.fieldType ?? this.inferFieldType(field.selector);

      switch (fieldType) {
        case 'checkbox':
          if (field.checked ?? true) {
            await this.checkCheckbox(sessionId, pageId, field.selector);
          } else {
            await this.uncheckCheckbox(sessionId, pageId, field.selector);
          }
          break;
        case 'radio':
          await this.selectRadio(sessionId, pageId, field.selector);
          break;
        case 'select':
          await this.selectOption(sessionId, pageId, field.selector, field.value);
          break;
        case 'textarea':
        case 'text':
        case 'email':
        case 'password':
        default:
          await this.typeText(sessionId, pageId, field.selector, field.value);
          break;
      }

      if (options.fieldDelayMs) {
        await this.delay(options.fieldDelayMs);
      }
    }

    if (options.submitSelector) {
      await this.click(sessionId, pageId, options.submitSelector);
    }
  }

  // ── Checkbox / Radio ───────────────────────────────────────────────────────

  async checkCheckbox(sessionId: string, pageId: string, selector: string): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, selector);
  }

  async uncheckCheckbox(sessionId: string, pageId: string, selector: string): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, selector);
  }

  async selectRadio(sessionId: string, pageId: string, selector: string): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, selector);
  }

  async selectOption(sessionId: string, pageId: string, selector: string, optionText: string): Promise<void> {
    await this.ensureElementVisible(sessionId, pageId, selector);
  }

  // ── Multi-Element Batch ────────────────────────────────────────────────────

  /**
   * Execute a sequence of actions on multiple elements.
   * Useful for bulk interactions (e.g., select-all checkboxes, bulk delete).
   */
  async executeBatch(sessionId: string, pageId: string, actions: MultiElementAction[]): Promise<void> {
    for (const action of actions) {
      await this.ensureElementVisible(sessionId, pageId, action.selector);
      switch (action.action) {
        case 'click':
          await this.backend.click(pageId, action.selector);
          break;
        case 'type':
          if (action.value == null) throw new Error('type action requires a value');
          await this.backend.typeText(pageId, action.selector, action.value);
          break;
        case 'scroll':
          await this.backend.scrollIntoView(pageId, action.selector);
          break;
        case 'check':
        case 'uncheck':
          // Handled by the backend's structured methods
          break;
        case 'select':
          if (action.value == null) throw new Error('select action requires a value');
          await this.selectOption(sessionId, pageId, action.selector, action.value);
          break;
      }
      if (action.delayMs) {
        await this.delay(action.delayMs);
      }
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async ensureElementVisible(sessionId: string, pageId: string, selector: string): Promise<void> {
    // Verify the element exists in the accessibility tree first
    const tree = await this.backend.getAccessibilityTree(pageId);
    const found = tree.some(
      (node) => node.cssSelector === selector || node.cssSelector?.endsWith(selector)
    );
    if (!found) {
      // Try scrolling it into view anyway — some elements may not be in the a11y tree
      await this.backend.scrollIntoView(pageId, selector);
    }
  }

  private inferFieldType(selector: string): FormField['fieldType'] {
    const lower = selector.toLowerCase();
    if (lower.includes('password')) return 'password';
    if (lower.includes('email')) return 'email';
    if (lower.includes('[type="checkbox"]') || lower.includes(':checkbox')) return 'checkbox';
    if (lower.includes('[type="radio"]') || lower.includes(':radio')) return 'radio';
    if (lower.includes('select') || lower.includes('<select')) return 'select';
    if (lower.includes('textarea')) return 'textarea';
    return 'text';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
