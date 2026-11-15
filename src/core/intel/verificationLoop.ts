/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Development Intelligence — Verification Loop
 * (src/core/intel/verificationLoop.ts)
 *
 * Self-verification after code generation, automated test suggestion,
 * and domain-specific quality gates.
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — quality gate patterns.
 *   Superpowers (https://github.com/obra/superpowers) — self-verification concepts.
 */

import type { DomainPack } from './domainPacks/domainPackTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VerificationResult {
  checkId: string;
  name: string;
  category: VerificationCategory;
  passed: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  details?: Record<string, unknown>;
  suggestion?: string;
  domain?: string;
}

export type VerificationCategory =
  | 'syntax'
  | 'types'
  | 'security'
  | 'performance'
  | 'correctness'
  | 'style'
  | 'domain'
  | 'test';

export interface VerificationReport {
  checks: VerificationResult[];
  passed: boolean;
  summary: { total: number; errors: number; warnings: number; info: number };
  durationMs: number;
  domain?: string;
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  domain: string;
  checks: string[];
  blocking: boolean;
  minPassRate: number;
}

export interface TestSuggestion {
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'e2e';
  code?: string;
  priority: 'high' | 'medium' | 'low';
  domain?: string;
}

// Pattern definition interface (moved outside function to avoid scope issues)
interface PatternDef {
  pattern: RegExp;
  description: string;
}

// ---------------------------------------------------------------------------
// Built-in verification checks
// ---------------------------------------------------------------------------

export function checkSyntax(code: string, _language = 'typescript'): VerificationResult {
  if (!code || code.trim().length === 0) {
    return {
      checkId: 'syntax-empty',
      name: 'Non-empty code',
      category: 'syntax',
      passed: false,
      severity: 'error',
      message: 'Generated code is empty',
      suggestion: 'Ensure the code generator produces non-empty output',
    };
  }

  const issues: string[] = [];
  const openParens = (code.match(/\(/g) ?? []).length;
  const closeParens = (code.match(/\)/g) ?? []).length;
  const openBraces = (code.match(/\{/g) ?? []).length;
  const closeBraces = (code.match(/\}/g) ?? []).length;
  const openBrackets = (code.match(/\[/g) ?? []).length;
  const closeBrackets = (code.match(/\]/g) ?? []).length;

  if (openParens !== closeParens) issues.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
  if (openBraces !== closeBraces) issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  if (openBrackets !== closeBrackets) issues.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);

  const singleQuotes = (code.match(/'/g) ?? []).length;
  const doubleQuotes = (code.match(/"/g) ?? []).length;
  const backtickQuotes = (code.match(/`/g) ?? []).length;
  if (singleQuotes % 2 !== 0) issues.push('Unmatched single quotes');
  if (doubleQuotes % 2 !== 0) issues.push('Unmatched double quotes');
  if (backtickQuotes % 2 !== 0) issues.push('Unmatched template literals');

  return {
    checkId: 'syntax-basic',
    name: 'Basic Syntax Check',
    category: 'syntax',
    passed: issues.length === 0,
    severity: issues.length > 0 ? 'error' : 'info',
    message: issues.length === 0 ? 'Basic syntax looks correct' : issues.join('; '),
    suggestion: issues.length > 0 ? 'Fix unbalanced delimiters in generated code' : undefined,
  };
}

export function checkSecurity(code: string): VerificationResult {
  const issues: string[] = [];

  const patterns: PatternDef[] = [
    { pattern: new RegExp('eval\\s*\\(', 'i'), description: 'Use of eval() is dangerous' },
    { pattern: new RegExp('innerHTML\\s*=', 'i'), description: 'Direct innerHTML assignment can cause XSS' },
    { pattern: new RegExp('document\\.write', 'i'), description: 'document.write is deprecated and dangerous' },
    { pattern: new RegExp('password\\s*=\\s*[\'"]', 'i'), description: 'Hardcoded password detected' },
    { pattern: new RegExp('secret\\s*=\\s*[\'"]', 'i'), description: 'Hardcoded secret detected' },
    { pattern: new RegExp('api[_-]?key\\s*=\\s*[\'"]', 'i'), description: 'Hardcoded API key detected' },
    { pattern: new RegExp('new\\s+Function\\s*\\(', 'i'), description: 'new Function() is similar to eval()' },
    { pattern: new RegExp('setTimeout\\s*\\(\\s*[^,]*\\s*,', 'i'), description: 'setTimeout with string argument uses eval' },
  ];

  for (const { pattern, description } of patterns) {
    if (pattern.test(code)) {
      issues.push(description);
    }
  }

  return {
    checkId: 'security-common',
    name: 'Security Pattern Check',
    category: 'security',
    passed: issues.length === 0,
    severity: issues.length > 0 ? 'error' : 'info',
    message: issues.length === 0 ? 'No common security anti-patterns detected' : issues.join('; '),
    suggestion: issues.length > 0 ? 'Remove or refactor flagged security anti-patterns' : undefined,
  };
}

export function checkPerformance(code: string): VerificationResult {
  const issues: string[] = [];

  if (new RegExp('for\\s*\\(.*\\)\\s*\\{[^}]*\\.(find|query|get|fetch)', 'i').test(code)) {
    issues.push('Potential N+1 query pattern: database calls inside loops');
  }
  if (/await.*\.forEach/i.test(code)) {
    issues.push('Using forEach with await (use for...of instead)');
  }
  if (/JSON\.parse\s*\(\s*JSON\.stringify/i.test(code)) {
    issues.push('Inefficient deep clone (JSON.parse/stringify) — consider structuredClone');
  }

  return {
    checkId: 'performance-common',
    name: 'Performance Pattern Check',
    category: 'performance',
    passed: issues.length === 0,
    severity: issues.length > 0 ? 'warning' : 'info',
    message: issues.length === 0 ? 'No obvious performance anti-patterns detected' : issues.join('; '),
    suggestion: issues.length > 0 ? 'Review flagged patterns for performance improvements' : undefined,
  };
}

export function checkStyle(code: string): VerificationResult {
  const issues: string[] = [];
  const lines = code.split('\n');

  const hasTabs = lines.some(l => l.includes('\t'));
  const hasSpaces = lines.some(l => l.startsWith('  ') || l.startsWith('    '));
  if (hasTabs && hasSpaces) issues.push('Mixed indentation (tabs and spaces)');

  const longLines = lines.filter(l => l.length > 120);
  if (longLines.length > 0) issues.push(`${longLines.length} lines exceed 120 characters`);

  const trailingWs = lines.filter(l => /\s$/.test(l));
  if (trailingWs.length > 0) issues.push(`${trailingWs.length} lines have trailing whitespace`);

  return {
    checkId: 'style-basic',
    name: 'Style Check',
    category: 'style',
    passed: issues.length === 0,
    severity: issues.length > 0 ? 'warning' : 'info',
    message: issues.length === 0 ? 'Style looks clean' : issues.join('; '),
    suggestion: issues.length > 0 ? 'Fix style issues for consistency' : undefined,
  };
}

export function checkDomainRules(code: string, domainPack: DomainPack): VerificationResult {
  const issues: string[] = [];
  const domain = domainPack.domain;

  if (domainPack.security.auth) {
    if (!/auth|authenticate|login|session/i.test(code) && domainPack.security.auth !== 'none') {
      issues.push(`Domain "${domain}" requires auth (${domainPack.security.auth})`);
    }
  }

  for (const compliance of domainPack.security.compliance) {
    const keyword = compliance.toLowerCase().replace(/[^a-z]/g, '');
    if (!new RegExp(keyword.slice(0, Math.min(3, keyword.length)), 'i').test(code)) {
      issues.push(`Compliance requirement "${compliance}" may not be addressed`);
    }
  }

  return {
    checkId: `domain-${domain}`,
    name: `Domain Rules: ${domain}`,
    category: 'domain',
    passed: issues.length === 0,
    severity: issues.length > 0 ? 'warning' : 'info',
    message: issues.length === 0 ? `Domain rules for "${domain}" appear satisfied` : issues.join('; '),
    domain,
    suggestion: issues.length > 0 ? `Address ${domain} domain-specific requirements` : undefined,
  };
}

export function suggestTests(code: string, domain?: string): TestSuggestion[] {
  const suggestions: TestSuggestion[] = [];

  const functionMatches = code.matchAll(/(?:function\s+(\w+)|(?:async\s+)?(?:const|let|var)\s+(\w+)\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*=>)/g);
  for (const match of functionMatches) {
    const fnName = match[1] || match[2];
    if (!fnName || fnName.startsWith('_')) continue;
    suggestions.push({
      name: `test_${fnName}`,
      description: `Test the ${fnName} function with various inputs`,
      type: 'unit',
      priority: 'high',
      domain,
      code: `test('${fnName} returns expected output', async () => {\n  const result = await ${fnName}(/* test inputs */);\n  assert.ok(result !== undefined);\n});`,
    });
  }

  const classMatches = code.matchAll(/class\s+(\w+)/g);
  for (const match of classMatches) {
    suggestions.push({
      name: `test_${match[1]}`,
      description: `Test the ${match[1]} class instantiation and methods`,
      type: 'unit',
      priority: 'high',
      domain,
      code: `test('${match[1]} instantiation', async () => {\n  const instance = new ${match[1]}();\n  assert.ok(instance !== null);\n});`,
    });
  }

  if (/fetch|axios|http|database|db\.|prisma|mongoose/i.test(code)) {
    suggestions.push({
      name: 'integration_api_test',
      description: 'Integration test for external API/database interactions',
      type: 'integration',
      priority: 'high',
      domain,
    });
  }

  if (/route|handler|express|fastify|next|api\//i.test(code)) {
    suggestions.push({
      name: 'e2e_endpoint_test',
      description: 'End-to-end test for user-facing API endpoints',
      type: 'e2e',
      priority: 'medium',
      domain,
    });
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Verification Loop
// ---------------------------------------------------------------------------

export interface VerificationLoopConfig {
  domains?: string[];
  includeStyle?: boolean;
  includePerformance?: boolean;
  suggestTests?: boolean;
  minPassRate?: number;
}

const DEFAULT_LOOP_CONFIG: VerificationLoopConfig = {
  includeStyle: true,
  includePerformance: true,
  suggestTests: true,
  minPassRate: 0.8,
};

export class VerificationLoop {
  private config: VerificationLoopConfig;
  private domainPacks: Map<string, DomainPack> = new Map();

  constructor(config: VerificationLoopConfig = {}) {
    this.config = { ...DEFAULT_LOOP_CONFIG, ...config };
  }

  registerDomainPack(pack: DomainPack): void {
    this.domainPacks.set(pack.domain, pack);
  }

  registerDomainPacks(packs: DomainPack[]): void {
    for (const pack of packs) {
      this.registerDomainPack(pack);
    }
  }

  verify(code: string, options: { language?: string; domain?: string } = {}): VerificationReport {
    const start = performance.now();
    const checks: VerificationResult[] = [];
    const domains = this.config.domains ?? (options.domain ? [options.domain] : []);

    checks.push(checkSyntax(code, options.language));
    checks.push(checkSecurity(code));
    if (this.config.includePerformance) checks.push(checkPerformance(code));
    if (this.config.includeStyle) checks.push(checkStyle(code));

    for (const domain of domains) {
      const pack = this.domainPacks.get(domain);
      if (pack) {
        checks.push(checkDomainRules(code, pack));
      } else {
        checks.push({
          checkId: `domain-generic-${domain}`,
          name: `Domain Check: ${domain}`,
          category: 'domain',
          passed: true,
          severity: 'info',
          message: `No domain pack loaded for "${domain}" — skipping domain-specific checks`,
          domain,
        });
      }
    }

    const durationMs = performance.now() - start;
    const errors = checks.filter(c => !c.passed && c.severity === 'error').length;
    const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length;
    const info = checks.filter(c => c.passed || c.severity === 'info').length;
    const passed = errors === 0 && warnings === 0;

    return {
      checks,
      passed,
      summary: { total: checks.length, errors, warnings, info },
      durationMs,
      domain: options.domain,
    };
  }

  verifyFailures(code: string, options: { language?: string; domain?: string } = {}): VerificationResult[] {
    const report = this.verify(code, options);
    return report.checks.filter(c => !c.passed);
  }

  verifyWithGate(code: string, gate: QualityGate, options: { language?: string } = {}): { passed: boolean; report: VerificationReport } {
    const report = this.verify(code, options);
    const relevantChecks = report.checks.filter(c => gate.checks.includes(c.checkId) || gate.domain === options.domain);
    const passedChecks = relevantChecks.filter(c => c.passed).length;
    const passRate = relevantChecks.length > 0 ? passedChecks / relevantChecks.length : 1;
    const passed = passRate >= gate.minPassRate;
    return { passed, report };
  }

  generateTestSuggestions(code: string, domain?: string): TestSuggestion[] {
    if (!this.config.suggestTests) return [];
    return suggestTests(code, domain);
  }

  verifyAndSuggest(code: string, options: { language?: string; domain?: string } = {}): { report: VerificationReport; testSuggestions: TestSuggestion[] } {
    const report = this.verify(code, options);
    const testSuggestions = this.generateTestSuggestions(code, options.domain);
    return { report, testSuggestions };
  }

  reset(): void {
    this.domainPacks.clear();
    this.config = { ...DEFAULT_LOOP_CONFIG };
  }
}

// ---------------------------------------------------------------------------
// Built-in quality gates per domain
// ---------------------------------------------------------------------------

export interface DomainQualityGate {
  id: string;
  name: string;
  description: string;
  domain: string;
  checks: string[];
  blocking: boolean;
  minPassRate: number;
}

export const QUALITY_GATES: Record<string, DomainQualityGate[]> = {
  coffeeShop: [
    {
      id: 'cofi-order-gate',
      name: 'Coffee Shop Order Gate',
      description: 'Quality gate for coffee shop order-related code',
      domain: 'coffeeShop',
      checks: ['syntax-basic', 'security-common', 'domain-coffeeShop'],
      blocking: true,
      minPassRate: 0.8,
    },
  ],
  ecommerce: [
    {
      id: 'ecom-payment-gate',
      name: 'E-Commerce Payment Gate',
      description: 'Quality gate for payment-related code',
      domain: 'ecommerce',
      checks: ['syntax-basic', 'security-common', 'performance-common'],
      blocking: true,
      minPassRate: 0.9,
    },
  ],
  saas: [
    {
      id: 'saas-auth-gate',
      name: 'SaaS Auth Gate',
      description: 'Quality gate for authentication code',
      domain: 'saas',
      checks: ['syntax-basic', 'security-common', 'domain-saas'],
      blocking: true,
      minPassRate: 0.85,
    },
  ],
  booking: [
    {
      id: 'book-reservation-gate',
      name: 'Booking Reservation Gate',
      description: 'Quality gate for reservation code',
      domain: 'booking',
      checks: ['syntax-basic', 'security-common'],
      blocking: true,
      minPassRate: 0.8,
    },
  ],
  logistics: [
    {
      id: 'log-shipment-gate',
      name: 'Logistics Shipment Gate',
      description: 'Quality gate for shipment code',
      domain: 'logistics',
      checks: ['syntax-basic', 'security-common', 'domain-logistics'],
      blocking: true,
      minPassRate: 0.8,
    },
  ],
};

export function getQualityGatesForDomain(domain: string): DomainQualityGate[] {
  return QUALITY_GATES[domain] ?? [];
}
