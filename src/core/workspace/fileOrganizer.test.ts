/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — File Organization Tests
 * (src/core/workspace/fileOrganizer.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FileOrganizer,
  STRUCTURE_TEMPLATES,
} from './fileOrganizer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOrganizer() {
  return new FileOrganizer();
}

// ─── Template discovery ──────────────────────────────────────────────────────

test('listTemplates returns all templates', () => {
  const organizer = makeOrganizer();
  const templates = organizer.listTemplates();

  assert.ok(templates.length >= 5, 'has multiple templates');
  const names = templates.map((t) => t.projectType);
  assert.ok(names.includes('general'));
  assert.ok(names.includes('ecommerce'));
  assert.ok(names.includes('saas'));
  assert.ok(names.includes('ai_assistant'));
  assert.ok(names.includes('developer_tools'));
});

test('getTemplate returns specific template', () => {
  const organizer = makeOrganizer();
  const template = organizer.getTemplate('finance');

  assert.strictEqual(template.projectType, 'finance');
  assert.ok(template.folders.includes('src/accounts'));
});

test('getTemplate returns general for unknown type', () => {
  const organizer = makeOrganizer();
  const template = organizer.getTemplate('nonexistent');

  assert.strictEqual(template.projectType, 'general');
});

// ─── Structure generation ────────────────────────────────────────────────────

test('generateStructure creates project structure', () => {
  const organizer = makeOrganizer();
  const structure = organizer.generateStructure({
    projectType: 'saas',
    rootPath: '/projects/my-saas',
  });

  assert.strictEqual(structure.projectType, 'saas');
  assert.strictEqual(structure.rootPath, '/projects/my-saas');
  assert.ok(structure.folders.length > 0, 'has folders');
  assert.ok(structure.files.length > 0, 'has files');
});

test('generateStructure includes conventions', () => {
  const organizer = makeOrganizer();
  const structure = organizer.generateStructure({
    projectType: 'ecommerce',
    rootPath: '/projects/shop',
  });

  assert.ok(structure.conventions.length > 0, 'has conventions');
  assert.ok(structure.conventions.some((c) => c.includes('products')), 'includes products convention');
});

test('generateStructure generates import aliases', () => {
  const organizer = makeOrganizer();
  const structure = organizer.generateStructure({
    projectType: 'ai_assistant',
    rootPath: '/projects/bot',
  });

  assert.ok(structure.importAliases.length > 0, 'has import aliases');
  assert.ok(structure.importAliases.some((a) => a.type === 'alias'), 'has alias type mappings');
});

// ─── Smart file placement ────────────────────────────────────────────────────

test('suggestPlacement places test files in tests/', () => {
  const organizer = makeOrganizer();
  const suggestions = organizer.suggestPlacement('src/utils/helper.test.ts', 'general');

  const best = suggestions[0];
  assert.ok(best.suggestedPath.includes('tests'), 'placed in tests/');
  assert.ok(best.confidence > 0.8, 'high confidence');
});

test('suggestPlacement places config files in config/', () => {
  const organizer = makeOrganizer();
  const suggestions = organizer.suggestPlacement('config/app.yaml', 'general');

  const best = suggestions[0];
  assert.ok(best.suggestedPath.includes('config'), 'placed in config/');
});

test('suggestPlacement places README in docs/', () => {
  const organizer = makeOrganizer();
  const suggestions = organizer.suggestPlacement('README.md', 'general');

  const best = suggestions[0];
  assert.ok(best.suggestedPath.includes('docs'), 'placed in docs/');
});

test('suggestPlacement places agent files in agents/', () => {
  const organizer = makeOrganizer();
  const suggestions = organizer.suggestPlacement('src/agents/orchestrator.ts', 'ai_assistant');

  const best = suggestions[0];
  assert.ok(best.suggestedPath.includes('agents'), 'placed in agents/');
});

test('suggestPlacement places product files in products/', () => {
  const organizer = makeOrganizer();
  const suggestions = organizer.suggestPlacement('src/products/item.ts', 'ecommerce');

  const best = suggestions[0];
  assert.ok(best.suggestedPath.includes('products'), 'placed in products/');
});

test('suggestPlacement defaults to source for unmatched files', () => {
  const organizer = makeOrganizer();
  const suggestions = organizer.suggestPlacement('src/random.ts', 'general');

  const best = suggestions[0];
  assert.ok(best.suggestedPath.includes('src/'), 'placed in src/');
  assert.strictEqual(best.confidence, 0.5, 'low confidence for default');
});

test('suggestPlacement returns sorted by confidence', () => {
  const organizer = makeOrganizer();
  const suggestions = organizer.suggestPlacement('src/utils/helper.test.ts', 'general');

  for (let i = 1; i < suggestions.length; i++) {
    assert.ok(suggestions[i - 1].confidence >= suggestions[i].confidence, 'sorted descending');
  }
});

// ─── Import path management ──────────────────────────────────────────────────

test('generateImportAliases creates aliases for non-test folders', () => {
  const organizer = makeOrganizer();
  const aliases = organizer.generateImportAliases('/projects/my-saas', STRUCTURE_TEMPLATES.saas);

  assert.ok(aliases.length > 0, 'has aliases');
  assert.ok(aliases.some((a) => a.type === 'alias'), 'has alias type');
});

test('generateImportAliases does not include tests/docs aliases', () => {
  const organizer = makeOrganizer();
  const aliases = organizer.generateImportAliases('/proj', STRUCTURE_TEMPLATES.general);

  assert.ok(!aliases.some((a) => a.from.includes('tests')), 'no tests alias');
  assert.ok(!aliases.some((a) => a.from.includes('docs')), 'no docs alias');
});

test('resolveImportPath resolves alias paths', () => {
  const organizer = makeOrganizer();
  const aliases = [{ from: '@utils', to: '/proj/src/utils', type: 'alias' as const }];

  const result = organizer.resolveImportPath(
    '/proj/src/index.ts',
    '/proj/src/utils/helper.ts',
    aliases
  );

  assert.strictEqual(result, '@utils/helper.ts');
});

// ─── Convention validation ───────────────────────────────────────────────────

test('validateAgainstConventions checks src/ convention', () => {
  const organizer = makeOrganizer();
  const results = organizer.validateAgainstConventions('src/index.ts', 'general');

  const srcConvention = results.find((r) => r.convention.includes('src/'));
  assert.ok(srcConvention !== undefined, 'has src/ convention check');
  assert.strictEqual(srcConvention!.passed, true);
});

test('validateAgainstConventions flags files outside src/', () => {
  const organizer = makeOrganizer();
  const results = organizer.validateAgainstConventions('lib/helper.ts', 'general');

  const srcConvention = results.find((r) => r.convention.includes('src/'));
  assert.ok(srcConvention !== undefined);
  assert.strictEqual(srcConvention!.passed, false);
});

test('validateAgainstConventions returns results for all conventions', () => {
  const organizer = makeOrganizer();
  const template = STRUCTURE_TEMPLATES.general;
  const results = organizer.validateAgainstConventions('src/foo.ts', 'general');

  assert.strictEqual(results.length, template.conventions.length, 'one result per convention');
});

// ─── Template structure validation ──────────────────────────────────────────

test('all templates have required fields', () => {
  for (const [name, template] of Object.entries(STRUCTURE_TEMPLATES)) {
    assert.ok(template.name.length > 0, `${name} has name`);
    assert.ok(template.description.length > 0, `${name} has description`);
    assert.ok(template.folders.length > 0, `${name} has folders`);
    assert.ok(template.conventions.length > 0, `${name} has conventions`);
    assert.ok(Array.isArray(template.entryFiles), `${name} has entryFiles`);
    assert.ok(template.testPattern.length > 0, `${name} has testPattern`);
    assert.ok(template.importPattern.length > 0, `${name} has importPattern`);
  }
});

test('all templates have src/ folder', () => {
  for (const [name, template] of Object.entries(STRUCTURE_TEMPLATES)) {
    assert.ok(template.folders.some((f) => f.startsWith('src/') || f === 'src'),
      `${name} has src/ folder`);
  }
});

test('all templates have tests folder', () => {
  for (const [name, template] of Object.entries(STRUCTURE_TEMPLATES)) {
    assert.ok(template.folders.some((f) => f.startsWith('tests') || f.includes('test')),
      `${name} has tests folder`);
  }
});
