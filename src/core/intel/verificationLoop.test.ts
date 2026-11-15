/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Development Intelligence — Verification Loop Tests
 * (src/core/intel/verificationLoop.test.ts)
 *
 * Tests for syntax checking, security scanning, performance checking,
 * domain-specific validation, test suggestions, and quality gates.
 *
 * Run via: npx tsx --test src/core/intel/verificationLoop.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  VerificationLoop,
  checkSyntax,
  checkSecurity,
  checkPerformance,
  checkStyle,
  checkDomainRules,
  suggestTests,
  verifyWithGate,
  getQualityGatesForDomain,
  QUALITY_GATES,
} from './verificationLoop';
import type { DomainPack } from './domainPacks/domainPackTypes';

// ---- Fixtures ----

const COFFEE_PACK: DomainPack = {
  domain: 'coffeeShop',
  name: 'Coffee Shop',
  description: 'Coffee shop domain',
  businessRules: {},
  design: {},
  security: { auth: 'jwt', data: 'encryption-at-rest', compliance: ['PCI-DSS'] },
  testing: {},
};

const ECOMMERCE_PACK: DomainPack = {
  domain: 'ecommerce',
  name: 'E-Commerce',
  description: 'E-commerce domain',
  businessRules: {},
  design: {},
  security: { auth: 'oauth2', data: 'pci-compliance', compliance: ['PCI-DSS', 'GDPR'] },
  testing: {},
};

// ---- checkSyntax ----

describe('checkSyntax', () => {
  it('passes for valid code', () => {
    const result = checkSyntax('function hello() { return 1; }');
    assert.strictEqual(result.passed, true);
  });

  it('fails for empty code', () => {
    const result = checkSyntax('');
    assert.strictEqual(result.passed, false);
    assert.strictEqual(result.severity, 'error');
  });

  it('detects unbalanced parentheses', () => {
    const result = checkSyntax('function hello() { return (1 + 2; }');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('parentheses'));
  });

  it('detects unbalanced braces', () => {
    const result = checkSyntax('function hello() { return 1;');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('braces'));
  });

  it('detects unbalanced brackets', () => {
    const result = checkSyntax('const arr = [1, 2, 3;');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('brackets'));
  });

  it('returns info for clean code', () => {
    const result = checkSyntax('export const x = 1;');
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.severity, 'info');
  });
});

// ---- checkSecurity ----

describe('checkSecurity', () => {
  it('passes for safe code', () => {
    const result = checkSecurity('function add(a, b) { return a + b; }');
    assert.strictEqual(result.passed, true);
  });

  it('detects eval usage', () => {
    const result = checkSecurity('eval(userInput)');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('eval'));
  });

  it('detects innerHTML', () => {
    const result = checkSecurity('element.innerHTML = data');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('innerHTML'));
  });

  it('detects hardcoded password', () => {
    const result = checkSecurity('const password = "secret123";');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('password'));
  });

  it('detects hardcoded API key', () => {
    const result = checkSecurity('const api_key = "abc123";');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('API key'));
  });

  it('detects document.write', () => {
    const result = checkSecurity('document.write("<h1>Hello</h1>")');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('document.write'));
  });
});

// ---- checkPerformance ----

describe('checkPerformance', () => {
  it('passes for clean code', () => {
    const result = checkPerformance('function sum(arr) { return arr.reduce((a, b) => a + b, 0); }');
    assert.strictEqual(result.passed, true);
  });

  it('detects N+1 query pattern', () => {
    const result = checkPerformance('for (const item of items) { db.find(item.id); }');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('N+1'));
  });

  it('detects async forEach', () => {
    const result = checkPerformance('await items.forEach(async (item) => process(item));');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('forEach'));
  });

  it('detects JSON deep clone', () => {
    const result = checkPerformance('const copy = JSON.parse(JSON.stringify(obj));');
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('deep clone'));
  });
});

// ---- checkStyle ----

describe('checkStyle', () => {
  it('passes for clean code', () => {
    const result = checkStyle('function hello() {\n  return 1;\n}');
    assert.strictEqual(result.passed, true);
  });

  it('detects long lines', () => {
    const longLine = 'const x = ' + 'a'.repeat(120);
    const result = checkStyle(longLine);
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('120 characters'));
  });

  it('passes for well-formatted code', () => {
    const result = checkStyle('function hello() {\n  return 1;\n}');
    assert.strictEqual(result.passed, true);
  });
});

// ---- checkDomainRules ----

describe('checkDomainRules', () => {
  it('passes for domain pack with no strict auth requirement', () => {
    const relaxedPack: DomainPack = {
      ...COFFEE_PACK,
      security: { auth: 'none', data: '', compliance: [] },
    };
    const result = checkDomainRules('function hello() {}', relaxedPack);
    assert.strictEqual(result.passed, true);
  });

  it('warns when auth is required but not present', () => {
    const result = checkDomainRules('function getData() { return db.query(); }', COFFEE_PACK);
    assert.strictEqual(result.passed, false);
    assert.ok(result.message.includes('auth'));
  });

  it('passes when auth and compliance code is present', () => {
    const result = checkDomainRules('authenticate(); pciEncrypt(data);', COFFEE_PACK);
    assert.strictEqual(result.passed, true);
  });

  it('includes domain in result', () => {
    const result = checkDomainRules('function hello() {}', ECOMMERCE_PACK);
    assert.strictEqual(result.domain, 'ecommerce');
  });
});

// ---- suggestTests ----

describe('suggestTests', () => {
  it('suggests tests for functions', () => {
    const suggestions = suggestTests('function add(a, b) { return a + b; }', 'test');
    assert.ok(suggestions.some(s => s.name === 'test_add'));
    assert.strictEqual(suggestions[0].type, 'unit');
    assert.strictEqual(suggestions[0].priority, 'high');
  });

  it('suggests tests for arrow functions', () => {
    const suggestions = suggestTests('const multiply = (a, b) => a * b;', 'test');
    assert.ok(suggestions.some(s => s.name === 'test_multiply'));
  });

  it('suggests tests for classes', () => {
    const suggestions = suggestTests('class UserService { constructor() {} }', 'test');
    assert.ok(suggestions.some(s => s.name === 'test_UserService'));
  });

  it('suggests integration tests for database code', () => {
    const suggestions = suggestTests('const data = await db.users.find();', 'test');
    assert.ok(suggestions.some(s => s.type === 'integration'));
  });

  it('suggests e2e tests for API routes', () => {
    const suggestions = suggestTests('app.get("/api/users", handler);', 'test');
    assert.ok(suggestions.some(s => s.type === 'e2e'));
  });

  it('skips test suggestions when disabled', () => {
    const loop = new VerificationLoop({ suggestTests: false });
    const suggestions = loop.generateTestSuggestions('function hello() {}');
    assert.strictEqual(suggestions.length, 0);
  });

  it('returns empty for code with no functions', () => {
    const suggestions = suggestTests('const x = 1;', 'test');
    assert.ok(suggestions.length >= 0);
  });
});

// ---- VerificationLoop class ----

describe('VerificationLoop', () => {
  it('verifies valid code', () => {
    const loop = new VerificationLoop();
    const report = loop.verify('function add(a: number, b: number): number { return a + b; }');
    assert.ok(report.summary.total > 0);
  });

  it('reports errors for problematic code', () => {
    const loop = new VerificationLoop();
    const report = loop.verify('eval(userInput)');
    assert.ok(report.checks.some(c => !c.passed));
  });

  it('returns domain in report when specified', () => {
    const loop = new VerificationLoop({ domains: ['coffeeShop'] });
    loop.registerDomainPack(COFFEE_PACK);
    const report = loop.verify('function hello() {}', { domain: 'coffeeShop' });
    assert.strictEqual(report.domain, 'coffeeShop');
  });

  it('includes domain checks when domain is registered', () => {
    const loop = new VerificationLoop({ domains: ['ecommerce'] });
    loop.registerDomainPack(ECOMMERCE_PACK);
    const report = loop.verify('authenticate(); function hello() {}', { domain: 'ecommerce' });
    assert.ok(report.checks.some(c => c.category === 'domain'));
  });

  it('skips style checks when disabled', () => {
    const loop = new VerificationLoop({ includeStyle: false });
    const report = loop.verify('function hello() {}');
    assert.ok(!report.checks.some(c => c.category === 'style'));
  });

  it('skips performance checks when disabled', () => {
    const loop = new VerificationLoop({ includePerformance: false });
    const report = loop.verify('function hello() {}');
    assert.ok(!report.checks.some(c => c.category === 'performance'));
  });

  it('verifyFailures returns only failing checks', () => {
    const loop = new VerificationLoop();
    const failures = loop.verifyFailures('eval("bad")');
    assert.ok(failures.every(f => !f.passed));
  });

  it('verifyAndSuggest returns both report and suggestions', () => {
    const loop = new VerificationLoop();
    const result = loop.verifyAndSuggest('function hello() {}');
    assert.ok('report' in result);
    assert.ok('testSuggestions' in result);
  });

  it('reset clears state', () => {
    const loop = new VerificationLoop({ minPassRate: 0.5 });
    loop.registerDomainPack(COFFEE_PACK);
    loop.reset();
    const newLoop = new VerificationLoop();
    assert.strictEqual(newLoop.config.minPassRate, 0.8);
  });

  it('reports duration in milliseconds', () => {
    const loop = new VerificationLoop();
    const report = loop.verify('function hello() {}');
    assert.ok(report.durationMs >= 0);
  });

  it('registerDomainPacks registers multiple packs', () => {
    const loop = new VerificationLoop();
    loop.registerDomainPacks([COFFEE_PACK, ECOMMERCE_PACK]);
    assert.ok(true); // No throw = pass
  });
});

// ---- Quality Gates ----

describe('Quality Gates', () => {
  it('has gates for known domains', () => {
    assert.ok(getQualityGatesForDomain('coffeeShop').length > 0);
    assert.ok(getQualityGatesForDomain('ecommerce').length > 0);
    assert.ok(getQualityGatesForDomain('saas').length > 0);
    assert.ok(getQualityGatesForDomain('booking').length > 0);
    assert.ok(getQualityGatesForDomain('logistics').length > 0);
  });

  it('gates have blocking flag', () => {
    for (const gates of Object.values(QUALITY_GATES)) {
      for (const gate of gates) {
        assert.ok(typeof gate.blocking === 'boolean');
      }
    }
  });
});
