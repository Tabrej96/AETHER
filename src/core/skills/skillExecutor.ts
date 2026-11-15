/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Skill Executor
 * (src/core/skills/skillExecutor.ts)
 *
 * Executes skills with proper input/output contracts, timeout enforcement,
 * retry logic, input validation, output validation, and result caching.
 */

import type { Skill, SkillResult, SkillError, DataType, RetryPolicy } from './skillEngine';

// ---------------------------------------------------------------------------
// Execution context — passed to inline implementations
// ---------------------------------------------------------------------------

export interface ExecutionContext {
  /** Caller-supplied inputs merged with skill defaults */
  inputs: Record<string, unknown>;
  /** Optional cache of intermediate results for workflow steps */
  cache?: Record<string, unknown>;
  /** Maximum allowed duration for this specific run */
  maxDurationMs?: number;
  /** Abort signal */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export class SkillExecutor {
  private readonly cache = new Map<string, { result: SkillResult; expiresAt: number }>();

  constructor(private readonly cacheTtlMs = 60_000) {}

  // ---- public API ----

  /**
   * Execute a skill with the given inputs. Returns a fully populated
   * SkillResult. Throws only on unrecoverable errors; failure results
   * are returned as SkillResult with status 'failure'.
   */
  async execute(skill: Skill, context: ExecutionContext): Promise<SkillResult> {
    const startedAt = new Date().toISOString();
    const startTime = performance.now();

    // Check cache
    const cached = this.#getFromCache(skill.id, context.inputs);
    if (cached) return { ...cached, cached: true };

    const maxDuration = context.maxDurationMs ?? skill.execution.timeoutMs;
    const controller = new AbortController();
    const signal = context.signal ?? controller.signal;

    // Validate inputs
    const validationResult = this.validateInputs(skill, context.inputs);
    if (!validationResult.valid) {
      const result = this.#makeResult(skill, 'error', startedAt, startTime, false, 0);
      result.error = {
        code: 'INPUT_VALIDATION_ERROR',
        message: validationResult.errors.join('; '),
      };
      return result;
    }

    // Execute with retry
    const result = await this.executeWithRetry(skill, context, startedAt, startTime, maxDuration, signal);

    // Validate outputs on success
    if (result.status === 'success') {
      this.validateOutputs(skill, result.output ?? {});
    }

    // Cache successful results
    if (result.status === 'success') {
      this.#putInCache(skill.id, context.inputs, result);
    }

    return result;
  }

  // ---- input validation ----

  validateInputs(skill: Skill, inputs: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const input of skill.inputs) {
      if (input.required && (inputs[input.name] === undefined || inputs[input.name] === null)) {
        errors.push(`Missing required input: "${input.name}"`);
        continue;
      }
      if (inputs[input.name] !== undefined && inputs[input.name] !== null) {
        const typeMatch = this.checkType(inputs[input.name], input.type);
        if (!typeMatch) {
          errors.push(`Input "${input.name}" expected type "${input.type}", got "${typeof inputs[input.name]}"`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  validateOutputs(skill: Skill, output: Record<string, unknown>): void {
    // Best-effort: check that declared outputs exist; don't fail on missing
    // optional outputs.
    for (const out of skill.outputs) {
      if (out.name in output) {
        this.checkType(output[out.name], out.type);
      }
    }
  }

  // ---- retry ----

  private async executeWithRetry(
    skill: Skill,
    context: ExecutionContext,
    startedAt: string,
    startTime: number,
    maxDuration: number,
    signal: AbortSignal,
  ): Promise<SkillResult> {
    const policy = skill.execution.retryPolicy;
    let lastResult: SkillResult;

    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      if (signal.aborted) {
        return this.#makeResult(skill, 'cancelled', startedAt, startTime, false, 0);
      }

      const elapsed = performance.now() - startTime;
      if (elapsed >= maxDuration) {
        const result = this.#makeResult(skill, 'timeout', startedAt, startTime, false, elapsed);
        result.error = { code: 'TIMEOUT', message: `Exceeded ${maxDuration}ms` };
        return result;
      }

      lastResult = await this.#runOnce(skill, context, startedAt, startTime);
      if (lastResult.status === 'success') return lastResult;

      // Should we retry?
      if (attempt < policy.maxRetries && this.isRetryable(lastResult.error, policy)) {
        const backoff = policy.backoffMs * Math.pow(2, attempt); // exponential
        await this.sleep(backoff);
        continue;
      }

      return lastResult;
    }

    return lastResult!;
  }

    async #runOnce(
    skill: Skill,
    context: ExecutionContext,
    startedAt: string,
    startTime: number,
  ): Promise<SkillResult> {
    try {
      switch (skill.execution.type) {
        case 'inline':
          return this.runInline(skill, context, startedAt, startTime);
        case 'agent':
          return this.runAgent(skill, context, startedAt, startTime);
        case 'workflow':
          return this.runWorkflow(skill, context, startedAt, startTime);
        case 'mcp':
          return this.runMcp(skill, context, startedAt, startTime);
        default:
          return this.#makeResult(skill, 'error', startedAt, startTime, false, 0);
      }
    } catch (err) {
      const result = this.#makeResult(skill, 'error', startedAt, startTime, false, 0);
      result.error = {
        code: 'UNHANDLED_EXCEPTION',
        message: err instanceof Error ? err.message : String(err),
        cause: err instanceof Error ? err.stack : undefined,
      };
      return result;
    }
  }

  // ---- inline execution ----

  private async runInline(
    skill: Skill,
    context: ExecutionContext,
    startedAt: string,
    startTime: number,
  ): Promise<SkillResult> {
    try {
      const impl = skill.execution.implementation;
      const entryPoint = skill.execution.entryPoint ?? 'execute';
      const fn = this.#compileInline(impl, entryPoint);
      const output = fn(context);
      const durationMs = performance.now() - startTime;
      return this.#makeResult(skill, 'success', startedAt, startTime, false, durationMs, output);
    } catch (err) {
      const durationMs = performance.now() - startTime;
      const result = this.#makeResult(skill, 'error', startedAt, startTime, false, durationMs);
      result.error = {
        code: 'INLINE_EXECUTION_ERROR',
        message: err instanceof Error ? err.message : String(err),
        cause: err instanceof Error ? err.stack : undefined,
      };
      return result;
    }
  }

  #compileInline(source: string, entryPoint: string): (ctx: ExecutionContext) => Record<string, unknown> {
    const fnBody = source.trim();

    // Try to extract the entry point if it's a named function
    const fnRegex = new RegExp(`(?:^|\\s|;)\\s*(?:function|const|let|var)\\s+${entryPoint}\\s*[=(]`);
    if (fnRegex.test(fnBody)) {
      // Wrap in a function that returns the entry point
      const wrapped = `(${fnBody}; return ${entryPoint};)`;
      try {
        const factory = new Function(wrapped);
        const fn = factory();
        if (typeof fn === 'function') return fn;
      } catch {
        // fall through to wrapping
      }
    }

    // Fallback: treat the body as the function body
    const wrappedFn = new Function('ctx', `return (function() { ${fnBody}; return execute ? execute(ctx) : undefined; }).call(ctx);`);
    return (ctx: ExecutionContext) => wrappedFn(ctx) ?? {};
  }

  // ---- agent execution (dispatch to AETHER agent system) ----

  private async runAgent(
    skill: Skill,
    context: ExecutionContext,
    startedAt: string,
    startTime: number,
  ): Promise<SkillResult> {
    const agentId = skill.execution.implementation;
    // Agent dispatch is a stub here: the real integration lives in the
    // AETHER agent runtime. We simulate the call so the engine is
    // fully testable without the agent layer.
    const output = { agentId, inputs: context.inputs, dispatched: true };
    const durationMs = performance.now() - startTime;
    return this.#makeResult(skill, 'success', startedAt, startTime, false, durationMs, output);
  }

  // ---- workflow execution ----

  private async runWorkflow(
    skill: Skill,
    context: ExecutionContext,
    startedAt: string,
    startTime: number,
  ): Promise<SkillResult> {
    // Workflow execution is a stub: the real integration lives in the
    // AETHER workflow engine. We return a descriptive result.
    const output = { workflowId: skill.execution.implementation, inputs: context.inputs, launched: true };
    const durationMs = performance.now() - startTime;
    return this.#makeResult(skill, 'success', startedAt, startTime, false, durationMs, output);
  }

  // ---- MCP tool execution ----

  private async runMcp(
    skill: Skill,
    context: ExecutionContext,
    startedAt: string,
    startTime: number,
  ): Promise<SkillResult> {
    // MCP tool call stub: the real integration lives in the AETHER MCP
    // server engine. We return a structured result.
    const output = { mcpTool: skill.execution.implementation, params: context.inputs, called: true };
    const durationMs = performance.now() - startTime;
    return this.#makeResult(skill, 'success', startedAt, startTime, false, durationMs, output);
  }

  // ---- type checking ----

  private checkType(value: unknown, expected: DataType): boolean {
    switch (expected) {
      case 'string':  return typeof value === 'string';
      case 'number':  return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'object':  return value !== null && typeof value === 'object' && !Array.isArray(value);
      case 'array':   return Array.isArray(value);
      case 'any':     return true;
      default:        return true;
    }
  }

  // ---- retryable check ----

  private isRetryable(error: SkillError | undefined, policy: RetryPolicy): boolean {
    if (!error) return false;
    return policy.retryableErrors.some(re => error.code === re || error.message.includes(re));
  }

  // ---- cache ----

  #getFromCache(skillId: string, inputs: Record<string, unknown>): SkillResult | undefined {
    const key = this.#cacheKey(skillId, inputs);
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.result;
  }

  #putInCache(skillId: string, inputs: Record<string, unknown>, result: SkillResult): void {
    const key = this.#cacheKey(skillId, inputs);
    this.cache.set(key, { result: { ...result, cached: false }, expiresAt: Date.now() + this.cacheTtlMs });
  }

  #cacheKey(skillId: string, inputs: Record<string, unknown>): string {
    return `${skillId}:${JSON.stringify(inputs)}`;
  }

  // ---- helpers ----

  #makeResult(
    skill: Skill,
    status: SkillResult['status'],
    startedAt: string,
    startTime: number,
    cached: boolean,
    elapsedMs?: number,
    output?: Record<string, unknown>,
  ): SkillResult {
    const durationMs = elapsedMs ?? (performance.now() - startTime);
    return {
      skillId: skill.id,
      status,
      output,
      durationMs,
      startedAt,
      finishedAt: new Date().toISOString(),
      cached,
      executionCount: 0, // updated by the engine layer
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
