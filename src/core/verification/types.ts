/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Verification Engine - Core Type Definitions
 *
 * This is THE CORE CONTROL LAYER. The AI NEVER decides when work is done.
 * AETHER's verification engine does. Every check inspects ACTUAL files,
 * ACTUAL code patterns, ACTUAL tests, and ACTUAL running functionality.
 */

// ─── Severity & Category Enums ──────────────────────────────────────────────

export type CheckCategory =
  | 'file'
  | 'code'
  | 'feature'
  | 'integration'
  | 'test'
  | 'security'
  | 'performance'
  | 'ui'
  | 'accessibility';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type VerificationMethod =
  | 'file-exists'
  | 'code-pattern'
  | 'test-pass'
  | 'api-response'
  | 'ui-element'
  | 'integration-test';

export type SystemType =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'auth'
  | 'payment'
  | 'notification'
  | 'storage'
  | 'cache'
  | 'queue'
  | 'monitoring';

export type CapabilityClassification =
  | 'Equivalent'
  | 'Improved'
  | 'Fundamentally Redesigned'
  | 'New Capability';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface VerificationCheck {
  id: string;
  category: CheckCategory;
  description: string;
  severity: Severity;
  check: () => Promise<VerificationResult>;
}

export interface VerificationResult {
  checkId: string;
  passed: boolean;
  evidence: string;
  screenshot?: string;
  actualValue?: string;
  expectedValue?: string;
  timestamp: string;
}

export interface FeatureRequirement {
  pillar: number;
  pillarName: string;
  feature: string;
  description: string;
  verificationMethod: VerificationMethod;
  expectedPattern?: string;
  competitorSource?: string;
}

export interface SystemRequirement {
  name: string;
  type: SystemType;
  components: string[];
}

export interface CompetitorFeature {
  competitor: string;
  feature: string;
  category: string;
  implementation: string;
}

export interface ProjectSpec {
  industry: string;
  requiredFeatures: FeatureRequirement[];
  requiredFiles: string[];
  requiredTests: string[];
  requiredSystems: SystemRequirement[];
  competitorBenchmarks: CompetitorFeature[];
  completenessThreshold: number;
}

export interface VerificationReport {
  projectId: string;
  timestamp: string;
  overallPassed: boolean;
  completeness: number;
  checks: VerificationResult[];
  missingFeatures: FeatureRequirement[];
  missingFiles: string[];
  failedTests: string[];
  recommendations: string[];
}

// ─── Extended types used by the engine ──────────────────────────────────────

export interface CheckExecutionContext {
  projectRoot: string;
  projectId: string;
  spec: ProjectSpec;
  fs: FileSystemProbe;
  codeAnalyzer: CodeAnalyzer;
  testRunner: TestRunner;
  browserRunner: BrowserRunner;
}

// ─── Probe interfaces (pluggable implementations) ───────────────────────────

export interface FileSystemProbe {
  exists(filePath: string): Promise<boolean>;
  read(filePath: string): Promise<string>;
  glob(pattern: string): Promise<string[]>;
  stat(filePath: string): Promise<{ size: number; mtime: number } | null>;
}

export interface CodeAnalyzer {
  fileContainsPattern(filePath: string, pattern: RegExp): Promise<boolean>;
  getExports(filePath: string): Promise<string[]>;
  getImports(filePath: string): Promise<string[]>;
  countLines(filePath: string): Promise<number>;
}

export interface TestRunner {
  runTests(testPattern: string): Promise<{ passed: number; failed: number; output: string }>;
  runSpecificTest(testPath: string): Promise<{ passed: boolean; output: string }>;
}

export interface BrowserRunner {
  launch(): Promise<void>;
  navigate(url: string): Promise<void>;
  elementExists(selector: string): Promise<boolean>;
  takeScreenshot(name: string): Promise<string>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  getText(selector: string): Promise<string>;
  close(): Promise<void>;
}

// ─── Industry identifiers ───────────────────────────────────────────────────

export type IndustryType =
  | 'ecommerce'
  | 'food-beverage'
  | 'healthcare'
  | 'ai-platform'
  | 'booking'
  | 'fintech'
  | 'education'
  | 'entertainment'
  | 'logistics'
  | 'hospitality'
  | 'real-estate'
  | 'automotive';
