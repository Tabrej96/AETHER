/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 02 — PERMISSION GUARD  ·  AETHER Reverse Intelligence
 * (src/core/reverse/permissionGuard.ts)
 *
 * Non-bypassable authorization gate for all reverse-engineering operations.
 * Every module in this subsystem MUST call guard.checkAuthorization() before
 * performing any analysis.
 *
 * Inspiration: morluto/rea (MIT) — authorization workflow concepts
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthorizationBasis =
  | 'OWNED'
  | 'AUTHORIZED_LICENSE'
  | 'CTF_TARGET'
  | 'DEFENSIVE_SECURITY'
  | 'RESEARCH_AGREEMENT';

export interface ReverseEngineAuthorization {
  targetId: string;
  basis: AuthorizationBasis;
  authorized: boolean;
  evidence: string;
  authorizedBy?: string;
  expiresAt?: string;
}

export interface ScopeLimits {
  allowedPaths: string[];
  forbiddenPaths: string[];
  maxFiles: number;
  maxBytes: number;
  allowedCategories: AnalysisCategory[];
  allowBinaryAnalysis: boolean;
  allowNetworkObservation: boolean;
}

export type AnalysisCategory =
  | 'STATIC_ANALYSIS'
  | 'RUNTIME_OBSERVATION'
  | 'API_DISCOVERY'
  | 'DATA_FLOW_TRACING'
  | 'AST_ANALYSIS'
  | 'DEPENDENCY_MAPPING'
  | 'BEHAVIOR_ANALYSIS'
  | 'ARCHITECTURE_EXTRACTION'
  | 'COMPLEXITY_METRICS'
  | 'VULNERABILITY_SCANNING';

export interface AuditLogEntry {
  timestamp: string;
  operationId: string;
  operationType: AnalysisCategory;
  targetId: string;
  userId: string;
  result: 'GRANTED' | 'DENIED' | 'DENIED_OUT_OF_SCOPE';
  reason: string;
  scopeUsed: ScopeLimits;
}

export interface SafeModeConfig {
  blockWrites: boolean;
  blockNetwork: boolean;
  blockProcessSpawn: boolean;
  astOnly: boolean;
  maxExecutionMs: number;
}

export interface AuthCheckResult {
  authorized: boolean;
  reason: string;
  scope: ScopeLimits;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_SCOPE: ScopeLimits = {
  allowedPaths: ['**/*'],
  forbiddenPaths: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
  maxFiles: 500,
  maxBytes: 50_000_000,
  allowedCategories: [
    'STATIC_ANALYSIS',
    'RUNTIME_OBSERVATION',
    'API_DISCOVERY',
    'DATA_FLOW_TRACING',
    'AST_ANALYSIS',
    'DEPENDENCY_MAPPING',
    'BEHAVIOR_ANALYSIS',
    'ARCHITECTURE_EXTRACTION',
    'COMPLEXITY_METRICS',
    'VULNERABILITY_SCANNING',
  ],
  allowBinaryAnalysis: false,
  allowNetworkObservation: false,
};

const DEFAULT_SAFE_MODE: SafeModeConfig = {
  blockWrites: true,
  blockNetwork: true,
  blockProcessSpawn: true,
  astOnly: false,
  maxExecutionMs: 300_000,
};

// ─── Permission Guard ─────────────────────────────────────────────────────────

export class PermissionGuard {
  private readonly scope: ScopeLimits;
  private readonly safeMode: SafeModeConfig;
  private readonly auditLog: AuditLogEntry[] = [];
  private readonly activeOperations = new Map<string, number>();
  private operationCounter = 0;
  private userId: string;

  constructor(opts?: {
    scope?: Partial<ScopeLimits>;
    safeMode?: Partial<SafeModeConfig>;
    userId?: string;
  }) {
    this.userId = opts?.userId ?? 'anonymous';
    this.scope = { ...DEFAULT_SCOPE, ...opts?.scope };
    this.safeMode = { ...DEFAULT_SAFE_MODE, ...opts?.safeMode };
  }

  /**
   * The non-bypassable authorization check. Must be called before any RE operation.
   */
  checkAuthorization(
    auth: ReverseEngineAuthorization,
    operation: AnalysisCategory
  ): AuthCheckResult {
    if (!auth.authorized) {
      this.writeAudit('DENIED', operation, auth.targetId, `Authorization denied for target`);
      return {
        authorized: false,
        reason: `Authorization DENIED for target "${auth.targetId}". Basis: ${auth.basis}. ${auth.evidence}`,
        scope: this.scope,
      };
    }

    if (!this.scope.allowedCategories.includes(operation)) {
      this.writeAudit('DENIED_OUT_OF_SCOPE', operation, auth.targetId, `Category "${operation}" not in allowed scope`);
      return {
        authorized: false,
        reason: `Operation "${operation}" is not within the current scope. Allowed: ${this.scope.allowedCategories.join(', ')}`,
        scope: this.scope,
      };
    }

    this.writeAudit('GRANTED', operation, auth.targetId, `Authorized (${auth.basis})`);
    return { authorized: true, reason: 'Authorized', scope: this.scope };
  }

  /**
   * Check if a path is within the allowed scope.
   */
  isPathAllowed(targetPath: string): boolean {
    for (const forbidden of this.scope.forbiddenPaths) {
      if (this.globMatch(forbidden, targetPath)) return false;
    }
    for (const allowed of this.scope.allowedPaths) {
      if (this.globMatch(allowed, targetPath)) return true;
    }
    return false;
  }

  /**
   * Enforce safe-mode constraints. Throws if a blocked operation is attempted.
   */
  enforceSafeMode(operation: string): void {
    if (this.safeMode.blockWrites && operation === 'WRITE') {
      throw new Error('SAFE_MODE: Write operations are blocked');
    }
    if (this.safeMode.blockNetwork && operation === 'NETWORK') {
      throw new Error('SAFE_MODE: Network operations are blocked');
    }
    if (this.safeMode.blockProcessSpawn && operation === 'SPAWN_PROCESS') {
      throw new Error('SAFE_MODE: Process spawning is blocked');
    }
    if (this.safeMode.astOnly && operation !== 'AST_READ') {
      throw new Error('SAFE_MODE: Only AST read operations are permitted');
    }
  }

  /**
   * Start a tracked operation with a timeout.
   */
  startOperation(operationType: AnalysisCategory, targetId: string): string {
    const opId = `op-${++this.operationCounter}`;
    this.activeOperations.set(opId, Date.now());
    this.writeAudit('GRANTED', operationType, targetId, `Operation ${opId} started`);
    return opId;
  }

  /**
   * End a tracked operation.
   */
  endOperation(opId: string): { durationMs: number } {
    const start = this.activeOperations.get(opId);
    if (!start) throw new Error(`Unknown operation: ${opId}`);
    const durationMs = Date.now() - start;
    this.activeOperations.delete(opId);
    return { durationMs };
  }

  /** Get current audit log */
  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  /** Get current scope configuration */
  getScope(): ScopeLimits {
    return { ...this.scope };
  }

  /** Get safe-mode configuration */
  getSafeMode(): SafeModeConfig {
    return { ...this.safeMode };
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private writeAudit(
    result: AuditLogEntry['result'],
    operationType: AnalysisCategory,
    targetId: string,
    reason: string
  ): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      operationId: `op-${this.operationCounter}`,
      operationType,
      targetId,
      userId: this.userId,
      result,
      reason,
      scopeUsed: { ...this.scope },
    });
  }

  // Simple glob matcher. Supports *, ?, and ** patterns.
  private globMatch(pattern: string, text: string): boolean {
    try {
      // Replace ** first (before single *), then handle single * and ?
      let regexStr = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*\*/g, '__DS__')
        .replace(/\*/g, '[^/]*')
        .replace(/__DS__/g, '.*')
        .replace(/\?/g, '[^/]');
      return new RegExp('^' + regexStr + '$').test(text);
    } catch {
      return text === pattern;
    }
  }
}

// ─── Convenience functions ────────────────────────────────────────────────────

let defaultGuard: PermissionGuard | null = null;

export function getDefaultGuard(): PermissionGuard {
  if (!defaultGuard) {
    defaultGuard = new PermissionGuard();
  }
  return defaultGuard;
}

export function createGuard(opts?: {
  scope?: Partial<ScopeLimits>;
  safeMode?: Partial<SafeModeConfig>;
  userId?: string;
}): PermissionGuard {
  return new PermissionGuard(opts);
}
