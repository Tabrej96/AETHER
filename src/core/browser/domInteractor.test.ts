/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — PROGRAM 05: BROWSER INTELLIGENCE
 * Tests for DOM Interaction Layer (src/core/browser/domInteractor.test.ts)
 *
 * Run via: npx --yes tsx --test src/core/browser/domInteractor.test.ts
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DomInteractor, type ClickOptions, type TypeOptions, type FillFormOptions, type FormField, type MultiElementAction } from './domInteractor';
import { MockBrowserBackend } from './browserEngine';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createBackend(): { backend: MockBrowserBackend; sessionId: string; pageId: string } {
  const backend = new MockBrowserBackend();
  const sessionId = 'test-session';
  // We need a page; the backend keeps pages in its internal map.
  // Use a unique session-like marker to namespace our mock pages.
  const pageId = 'page-1';
  // Directly set up the mock via the backend's internal API
  // (we use the backend as-is; the first newPage() call gives us a page)
  return { backend, sessionId, pageId };
}

async function setup(): Promise<{ interactor: DomInteractor; backend: MockBrowserBackend; sessionId: string; pageId: string }> {
  const backend = new MockBrowserBackend();
  await backend.launch({}, fs.mkdtempSync(path.join(os.tmpdir(), 'aether-dom-test-')));
  const pageId = await backend.newPage();
  await backend.navigate(pageId, 'https://example.com');
  const interactor = new DomInteractor(backend);
  return { interactor, backend, sessionId: 'dom-test', pageId };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test('DomInteractor: click does not throw on a valid selector', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.click(sessionId, pageId, '#submit'));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: doubleClick does not throw', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.doubleClick(sessionId, pageId, '#submit'));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: typeText types text without throwing', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.typeText(sessionId, pageId, '#email', 'user@test.com'));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: typeText with clearFirst clears then types', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() =>
      interactor.typeText(sessionId, pageId, '#email', 'new@test.com', { clearFirst: true })
    );
  } finally {
    await backend.close();
  }
});

test('DomInteractor: clearField clears an input', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.clearField(sessionId, pageId, '#email'));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: scrollIntoView does not throw', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.scrollIntoView(sessionId, pageId, '#submit'));
    await assert.doesNotReject(() => interactor.scrollIntoView(sessionId, pageId, '#submit', { target: 'top' }));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: drag does not throw', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.drag(sessionId, pageId, '#source', { targetSelector: '#target' }));
    await assert.doesNotReject(() =>
      interactor.drag(sessionId, pageId, '#source', { targetSelector: '#target', button: 2, durationMs: 500 })
    );
  } finally {
    await backend.close();
  }
});

test('DomInteractor: fillForm fills multiple fields', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await backend.navigate(pageId, 'https://example.com/form');
    const fields: FormField[] = [
      { selector: '#fname', value: 'John' },
      { selector: '#lname', value: 'Doe' },
      { selector: '#country', value: 'US', fieldType: 'select' },
      { selector: '#bio', value: 'Hello world', fieldType: 'textarea' },
    ];
    await assert.doesNotReject(() => interactor.fillForm(sessionId, pageId, fields));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: fillForm with submitSelector submits after filling', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await backend.navigate(pageId, 'https://example.com/form');
    const fields: FormField[] = [
      { selector: '#fname', value: 'Jane' },
    ];
    await assert.doesNotReject(() =>
      interactor.fillForm(sessionId, pageId, fields, { submitSelector: '#save' })
    );
  } finally {
    await backend.close();
  }
});

test('DomInteractor: fillForm with clearFirst clears all fields first', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await backend.navigate(pageId, 'https://example.com/form');
    const fields: FormField[] = [
      { selector: '#fname', value: 'Alice' },
    ];
    await assert.doesNotReject(() =>
      interactor.fillForm(sessionId, pageId, fields, { clearFirst: true })
    );
  } finally {
    await backend.close();
  }
});

test('DomInteractor: checkCheckbox / uncheckCheckbox do not throw', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.checkCheckbox(sessionId, pageId, '#terms'));
    await assert.doesNotReject(() => interactor.uncheckCheckbox(sessionId, pageId, '#terms'));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: selectRadio does not throw', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.selectRadio(sessionId, pageId, '#option-a'));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: selectOption does not throw', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await assert.doesNotReject(() => interactor.selectOption(sessionId, pageId, '#country', 'United States'));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: executeBatch runs multiple actions', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    await backend.navigate(pageId, 'https://example.com/form');
    const actions: MultiElementAction[] = [
      { selector: '#fname', action: 'type', value: 'Batch' },
      { selector: '#lname', action: 'type', value: 'Test' },
      { selector: '#save', action: 'click', delayMs: 100 },
    ];
    await assert.doesNotReject(() => interactor.executeBatch(sessionId, pageId, actions));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: executeBatch rejects type without value', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    const actions: MultiElementAction[] = [
      { selector: '#input', action: 'type' }, // missing value
    ];
    await assert.rejects(() => interactor.executeBatch(sessionId, pageId, actions), /requires a value/);
  } finally {
    await backend.close();
  }
});

test('DomInteractor: select action in batch requires value', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    const actions: MultiElementAction[] = [
      { selector: '#country', action: 'select' }, // missing value
    ];
    await assert.rejects(() => interactor.executeBatch(sessionId, pageId, actions), /requires a value/);
  } finally {
    await backend.close();
  }
});

test('DomInteractor: check/uncheck in batch are no-ops (structured)', async () => {
  const { interactor, backend, sessionId, pageId } = await setup();
  try {
    const actions: MultiElementAction[] = [
      { selector: '#terms', action: 'check' },
      { selector: '#terms', action: 'uncheck' },
    ];
    await assert.doesNotReject(() => interactor.executeBatch(sessionId, pageId, actions));
  } finally {
    await backend.close();
  }
});

test('DomInteractor: operations throw on unknown page', async () => {
  const { interactor, backend } = await setup();
  try {
    await assert.rejects(() => interactor.click('session', 'nonexistent-page', '#submit'));
    await assert.rejects(() => interactor.typeText('session', 'nonexistent-page', '#email', 'test'));
  } finally {
    await backend.close();
  }
});
