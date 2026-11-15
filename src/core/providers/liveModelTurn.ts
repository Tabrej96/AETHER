/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — LIVE MODEL TURN (Genuine Autonomous Reasoning)
 * (src/core/providers/liveModelTurn.ts)
 *
 * The upgrade the external review asked for: instead of selecting a
 * pre-recorded patch from a fixture repository, this module sends the
 * REAL objective + AST graph + workspace contents to a live model provider
 * (via the existing ModelProviderClient chain) and lets the MODEL's output
 * determine the proposed file mutations.
 *
 * Safety — the model is never trusted blindly:
 *   1. Model output is a structured JSON plan (jsonMode), parsed defensively.
 *   2. Every proposed mutation is confined to the workspace path set
 *      (no `..` escapes, no writes outside the isolated tree).
 *   3. The proposed tree is run through the repository's deterministic
 *      invariant verifier AND the security scanner BEFORE anything is
 *      applied.
 *   4. Only when the model's plan passes BOTH does it replace the
 *      deterministic fallback. Otherwise the verified deterministic patch
 *      is used and the result is labeled DETERMINISTIC_FALLBACK — the
 *      `reasoningSource` field is honest, never silently "measured".
 *   5. Token counts are provider-reported when the provider supplies them,
 *      classified 'provider-reported', else 'estimated' — never mixed.
 */

import { ModelProviderClient, type CompletionResult, fitContextWindow, estimateTokens } from './providerClient';
import { scanSecurityAndTrustBoundaries } from '../securityEngine';
import type { ReproducibleTestRepository } from '../realBenchmarkEngine';
import type { RepoFileNode } from '../types';

export type ReasoningSource =
  | 'LIVE_MODEL_VERIFIED' // a live model proposed the mutations AND they passed both gates
  | 'DETERMINISTIC_FALLBACK'; // live path unavailable/unverified -> the known-correct patch

export interface LiveModelTurnRequest {
  client: ModelProviderClient;
  objective: string;
  repoSpec: ReproducibleTestRepository;
  workspaceFiles: Record<string, string>;
  astGraph?: RepoFileNode[];
  temperature?: number;
  maxOutputTokens?: number;
}

export interface LiveModelTurnOutcome {
  reasoningSource: ReasoningSource;
  liveCallSucceeded: boolean;
  providerId?: string;
  model?: string;
  promptTokens: number;
  completionTokens: number;
  usageSource: 'provider-reported' | 'estimated';
  latencyMs: number;
  costUsd: number;
  /** The mutations to apply — model's (when verified) or the deterministic fallback. */
  proposedFileMutations: Array<{ filePath: string; updatedContent: string; requiresHumanGate: boolean }>;
  verification: {
    preAppliedInvariantsPassed: boolean;
    securityScansPassed: boolean;
    detail: string;
  };
  fallbackReason?: string;
}

const PLAN_SYSTEM_PROMPT = [
  'You are the code-implementer agent inside AETHER, an open-source engineering harness.',
  'You receive a task objective, the target repository layout, an AST symbol graph, and the current file contents.',
  'Respond with ONLY a JSON object (no prose, no markdown fences) of the exact shape:',
  '{"reasoning": string, "mutations": [{"filePath": string, "content": string}]}',
  'Rules: mutate only files that already exist in the workspace; keep the change minimal and correct;',
  'never introduce secrets, eval, dynamic code execution, or exfiltration; keep public API signatures intact.',
].join(' ');

function buildUserPrompt(req: LiveModelTurnRequest): string {
  const { repoSpec, workspaceFiles, astGraph } = req;
  const astView = (astGraph ?? [])
    .map((n) => `${n.path} [${n.language}] exports=[${n.exports.join(', ')}] imports=[${n.imports.join(', ')}]`)
    .join('\n');
  const files = Object.entries(workspaceFiles)
    .map(([p, c]) => `--- ${p} ---\n${c}`)
    .join('\n\n');
  return [
    `OBJECTIVE: ${req.objective}`,
    `REPOSITORY: ${repoSpec.repoId} — ${repoSpec.taskSpecification}`,
    `TARGET FILE: ${repoSpec.targetFile} (mutated symbol: ${repoSpec.mutatedSymbol})`,
    `AST SYMBOL GRAPH:\n${astView || '(none parsed)'}`,
    `CURRENT WORKSPACE FILES:\n${files}`,
  ].join('\n\n');
}

function parseModelPlan(content: string): { reasoning: string; mutations: Array<{ filePath: string; content: string }> } {
  let s = content.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('model output is not a JSON object');
  const obj = JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>;
  const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning : '';
  const raw = Array.isArray(obj.mutations) ? obj.mutations : [];
  const mutations = raw
    .filter((m): m is { filePath: string; content: string } => {
      const x = m as { filePath?: unknown; content?: unknown };
      return typeof x.filePath === 'string' && typeof x.content === 'string';
    })
    .map((m) => ({ filePath: m.filePath, content: m.content }));
  return { reasoning, mutations };
}

function isWorkspaceConfined(workspaceFiles: Record<string, string>, filePath: string): boolean {
  if (typeof filePath !== 'string' || filePath.length === 0) return false;
  if (filePath.includes('\0')) return false;
  const norm = filePath.replace(/\\/g, '/');
  if (norm.startsWith('/') || /^[a-zA-Z]:/.test(norm)) return false; // absolute / drive paths
  const parts = norm.split('/');
  if (parts.some((p) => p === '..')) return false;
  if (!Object.keys(workspaceFiles).includes(norm)) return false; // must be an existing workspace file
  return true;
}

export async function executeLiveModelTurn(req: LiveModelTurnRequest): Promise<LiveModelTurnOutcome> {
  const { client, repoSpec, workspaceFiles } = req;
  const userPromptText = buildUserPrompt(req);
  const deterministicMutations = deterministicFallbackMutations(repoSpec, workspaceFiles);
  const fallbackDetail = {
    preAppliedInvariantsPassed: true,
    securityScansPassed: true,
    detail: 'deterministic patch (verified fallback)',
  };

  const fallbackOutcome = (liveCallSucceeded: boolean, fallbackReason: string): LiveModelTurnOutcome => ({
    reasoningSource: 'DETERMINISTIC_FALLBACK',
    liveCallSucceeded,
    promptTokens: estimateTokens(userPromptText),
    completionTokens: 0,
    usageSource: 'estimated',
    latencyMs: 0,
    costUsd: 0,
    proposedFileMutations: deterministicMutations,
    verification: fallbackDetail,
    fallbackReason,
  });

  let completion: CompletionResult;
  try {
    const fitted = fitContextWindow(
      [
        { role: 'system' as const, content: PLAN_SYSTEM_PROMPT },
        { role: 'user' as const, content: userPromptText },
      ],
      60_000
    );
    completion = await client.complete({
      messages: fitted.messages,
      jsonMode: true,
      temperature: req.temperature ?? 0,
      maxOutputTokens: req.maxOutputTokens ?? 4000,
    });
  } catch (e) {
    return fallbackOutcome(false, `live provider unavailable: ${String((e as Error).message ?? e).slice(0, 160)}`);
  }

  const usageSource: 'provider-reported' | 'estimated' = completion.usage.source;
  const metrics = {
    providerId: completion.providerId,
    model: completion.model,
    promptTokens: usageSource === 'provider-reported' ? completion.usage.inputTokens : estimateTokens(userPromptText),
    completionTokens: usageSource === 'provider-reported' ? completion.usage.outputTokens : 0,
    usageSource,
    latencyMs: Math.round(completion.latencyMs),
    costUsd: completion.costUsd,
  };

  if (completion.errorSentinel || completion.finalStatus !== 200) {
    const o = fallbackOutcome(false, `provider HTTP ${completion.finalStatus}${completion.errorSentinel ? ' error-sentinel' : ''}`);
    return { ...o, ...metrics, latencyMs: metrics.latencyMs, costUsd: metrics.costUsd, promptTokens: metrics.promptTokens, completionTokens: metrics.completionTokens, usageSource };
  }

  let plan: { reasoning: string; mutations: Array<{ filePath: string; content: string }> };
  try {
    plan = parseModelPlan(completion.content);
  } catch (e) {
    console.log('[DEBUG] Model output length:', completion.content.length);
    console.log('[DEBUG] Model output first 500 chars:\n', completion.content.slice(0, 500));
    const o = fallbackOutcome(false, `model output unparseable: ${String((e as Error).message ?? e).slice(0, 160)}`);
    return { ...o, ...metrics };
  }

  // --- confinement + pre-verification BEFORE applying anything -------------
  const confined = plan.mutations.filter((m) => isWorkspaceConfined(workspaceFiles, m.filePath));
  if (confined.length < plan.mutations.length) {
    const o = fallbackOutcome(false, `model proposed ${plan.mutations.length - confined.length} non-workspace path(s); refused`);
    return { ...o, ...metrics };
  }

  const scratch: Record<string, string> = { ...workspaceFiles };
  for (const m of confined) scratch[m.filePath] = m.content;

  const invariants = repoSpec.verifyGeneratedTree(scratch);
  let securityOk = true;
  for (const m of confined) {
    const scan = scanSecurityAndTrustBoundaries({
      untrustedContent: m.content,
      proposedCommand: `write_file ${m.filePath}`,
      agentRole: 'LEASED_IMPLEMENTER',
      requestedTool: 'WRITE_FILE',
      spdxLicense: 'Apache-2.0',
    });
    if (!scan.passedSecurityGate) securityOk = false;
  }

  if (invariants.passed && securityOk && confined.length > 0) {
    return {
      reasoningSource: 'LIVE_MODEL_VERIFIED',
      liveCallSucceeded: true,
      ...metrics,
      proposedFileMutations: confined.map((m) => ({
        filePath: m.filePath,
        updatedContent: m.content,
        requiresHumanGate: repoSpec.domain !== 'BROWSER_DOM_AUTOMATION',
      })),
      verification: {
        preAppliedInvariantsPassed: invariants.passed,
        securityScansPassed: securityOk,
        detail: `live model plan passed ${invariants.assertionsRun} invariants + ${confined.length} security scan(s)`,
      },
    };
  }

  return {
    reasoningSource: 'DETERMINISTIC_FALLBACK',
    liveCallSucceeded: true,
    ...metrics,
    proposedFileMutations: deterministicMutations,
    verification: {
      preAppliedInvariantsPassed: invariants.passed,
      securityScansPassed: securityOk,
      detail: invariants.passed
        ? 'security scan failed on model plan; used deterministic patch'
        : `model plan failed ${invariants.failures.length} invariant(s); used deterministic patch`,
    },
    fallbackReason: invariants.passed ? 'security gate' : `invariants: ${invariants.failures.slice(0, 3).join('; ')}`,
  };
}

// -- helpers -------------------------------------------------------------
function deterministicFallbackMutations(
  repoSpec: ReproducibleTestRepository,
  workspaceFiles: Record<string, string>
): Array<{ filePath: string; updatedContent: string; requiresHumanGate: boolean }> {
  const out: Array<{ filePath: string; updatedContent: string; requiresHumanGate: boolean }> = [];
  if (workspaceFiles[repoSpec.targetFile] !== repoSpec.remediatedVerifiedPatch) {
    out.push({
      filePath: repoSpec.targetFile,
      updatedContent: repoSpec.remediatedVerifiedPatch,
      requiresHumanGate: repoSpec.domain !== 'BROWSER_DOM_AUTOMATION',
    });
  }
  return out;
}

export { deterministicFallbackMutations as fallbackMutationsForRepository };
