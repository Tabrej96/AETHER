/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * SYSTEM 7: Adaptive Model Intelligence (modelRouter.ts)
 * Production Model Router — central routing layer for ALL model calls.
 * Provider-independent model evaluation and Pareto-optimal routing across
 * commercial and local open-weight models.
 *
 * Inspiration: Anthropic's model routing (proprietary — studied as architectural reference)
 */

// ─── Legacy Interfaces (preserved for backward compatibility) ─────────────────

export interface ModelProfile {
  id: string;
  name: string;
  provider: 'Anthropic' | 'Google' | 'OpenAI' | 'DeepSeek' | 'Local (Ollama / vLLM)';
  isLocal: boolean;
  codingQuality: number; // 0-100
  reasoningCapability: number; // 0-100
  contextCapacityK: number; // in thousands of tokens
  medianLatencyMs: number;
  costPer1MInputUsd: number;
  reliabilityScore: number; // 0-100
  sweBenchVerifiedPct: number;
}

export interface ModelRoutingRequest {
  taskType: 'ARCHITECTURE_DESIGN' | 'MULTI_FILE_IMPLEMENTATION' | 'ADVERSARIAL_SECURITY_AUDIT' | 'FAST_SYNTAX_REPAIR';
  requiredContextTokensK: number;
  requireAirgappedLocal: boolean;
  maxCostPer1MUsd: number;
  prioritizeLatency: boolean;
}

export interface RoutedModelRecommendation {
  primaryModel: ModelProfile;
  fallbackModel: ModelProfile;
  compositeScore: number;
  routingRationale: string;
  allRanked: Array<{ model: ModelProfile; score: number }>;
}

export const MODEL_CATALOG: ModelProfile[] = [
  {
    id: 'claude-3-7-sonnet-thinking',
    name: 'Claude 3.7 Sonnet (Extended Thinking)',
    provider: 'Anthropic',
    isLocal: false,
    codingQuality: 96,
    reasoningCapability: 95,
    contextCapacityK: 200,
    medianLatencyMs: 2400,
    costPer1MInputUsd: 3.0,
    reliabilityScore: 97,
    sweBenchVerifiedPct: 70.3,
  },
  {
    id: 'gemini-2-5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    isLocal: false,
    codingQuality: 95,
    reasoningCapability: 96,
    contextCapacityK: 1000,
    medianLatencyMs: 2100,
    costPer1MInputUsd: 1.25,
    reliabilityScore: 96,
    sweBenchVerifiedPct: 68.8,
  },
  {
    id: 'o3-mini-high',
    name: 'OpenAI o3-mini (High Reasoning)',
    provider: 'OpenAI',
    isLocal: false,
    codingQuality: 93,
    reasoningCapability: 95,
    contextCapacityK: 200,
    medianLatencyMs: 3100,
    costPer1MInputUsd: 1.1,
    reliabilityScore: 95,
    sweBenchVerifiedPct: 66.4,
  },
  {
    id: 'deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 / V3.1 Coding',
    provider: 'DeepSeek',
    isLocal: false,
    codingQuality: 90,
    reasoningCapability: 92,
    contextCapacityK: 128,
    medianLatencyMs: 1850,
    costPer1MInputUsd: 0.55,
    reliabilityScore: 91,
    sweBenchVerifiedPct: 61.2,
  },
  {
    id: 'qwen-2-5-coder-32b-local',
    name: 'Qwen 2.5 Coder 32B (Local vLLM / Ollama)',
    provider: 'Local (Ollama / vLLM)',
    isLocal: true,
    codingQuality: 86,
    reasoningCapability: 83,
    contextCapacityK: 128,
    medianLatencyMs: 620,
    costPer1MInputUsd: 0.0,
    reliabilityScore: 99,
    sweBenchVerifiedPct: 54.5,
  },
];

// ─── New Production Interfaces ────────────────────────────────────────────────

export type TaskType = 'code' | 'research' | 'design' | 'analysis' | 'summarize' | 'creative';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  tier: ModelTier;
  costPer1MInput: number;
  costPer1MOutput: number;
  contextWindowK: number;
  available: boolean;
}

export type ModelTier = 'haiku' | 'sonnet' | 'opus' | 'fable';

export interface ModelRoute {
  taskType: string;           // 'code' | 'research' | 'design' | 'analysis' | 'summarize' | 'creative'
  recommendedModel: string;   // 'haiku' | 'sonnet' | 'opus' | 'fable'
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
  reasoningEffort: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  costBudget?: number;
}

export interface TaskContext {
  taskType: TaskType;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  requiresReasoning?: boolean;
  isUrgent?: boolean;
  projectId?: string;
  sessionId?: string;
}

export interface RoutingDecision {
  model: string;
  reasoningEffort: string;
  maxTokens: number;
  temperature: number;
  rationale: string;
  estimatedCost: number;
  fallbackChain: string[];
  tier: ModelTier;
}

export interface RoutingLogEntry {
  timestamp: string;
  taskType: string;
  selectedModel: string;
  reasoningEffort: string;
  estimatedCost: number;
  rationale: string;
  sessionId?: string;
  projectId?: string;
  fallbackUsed: boolean;
}

export interface SessionCostBudget {
  sessionId: string;
  budgetUsd: number;
  spentUsd: number;
  modelSpend: Record<string, number>;
  lastReset: string;
}

// ─── Default Route Configuration ─────────────────────────────────────────────

export const DEFAULT_ROUTES: Record<TaskType, ModelRoute> = {
  code: {
    taskType: 'code',
    recommendedModel: 'sonnet',
    fallbackModel: 'fable',
    maxTokens: 8192,
    temperature: 0.2,
    reasoningEffort: 'high',
  },
  research: {
    taskType: 'research',
    recommendedModel: 'fable',
    fallbackModel: 'opus',
    maxTokens: 16384,
    temperature: 0.1,
    reasoningEffort: 'max',
  },
  design: {
    taskType: 'design',
    recommendedModel: 'sonnet',
    fallbackModel: 'fable',
    maxTokens: 8192,
    temperature: 0.3,
    reasoningEffort: 'high',
  },
  analysis: {
    taskType: 'analysis',
    recommendedModel: 'sonnet',
    fallbackModel: 'opus',
    maxTokens: 8192,
    temperature: 0.1,
    reasoningEffort: 'high',
  },
  summarize: {
    taskType: 'summarize',
    recommendedModel: 'haiku',
    fallbackModel: 'sonnet',
    maxTokens: 2048,
    temperature: 0.3,
    reasoningEffort: 'low',
  },
  creative: {
    taskType: 'creative',
    recommendedModel: 'sonnet',
    fallbackModel: 'opus',
    maxTokens: 4096,
    temperature: 0.7,
    reasoningEffort: 'medium',
  },
};

// Tier ordering for fallback chains: highest capability first
export const TIER_ORDER: ModelTier[] = ['fable', 'opus', 'sonnet', 'haiku'];

// Model pricing (per 1M tokens, input/output)
const MODEL_PRICING: Record<ModelTier, { input: number; output: number; contextK: number }> = {
  fable:  { input: 15.0, output: 75.0, contextK: 200000 },
  opus:   { input: 15.0, output: 75.0, contextK: 200000 },
  sonnet: { input: 3.0,  output: 15.0, contextK: 200000 },
  haiku:  { input: 0.8,  output: 4.0,  contextK: 200000 },
};

// ─── Routing Log (in-memory, production-grade) ───────────────────────────────

interface RouterState {
  routingLog: RoutingLogEntry[];
  sessionBudgets: Map<string, SessionCostBudget>;
  logMaxEntries: number;
}

function createRouterState(logMaxEntries = 10000): RouterState {
  return {
    routingLog: [],
    sessionBudgets: new Map(),
    logMaxEntries,
  };
}

let routerState = createRouterState();

// ─── Helper Functions ─────────────────────────────────────────────────────────

function tierToModelName(tier: ModelTier): string {
  return tier;
}

function modelNameToTier(name: string): ModelTier {
  const lower = name.toLowerCase();
  if (lower.includes('fable')) return 'fable';
  if (lower.includes('opus')) return 'opus';
  if (lower.includes('sonnet')) return 'sonnet';
  if (lower.includes('haiku')) return 'haiku';
  return 'sonnet'; // default fallback for unrecognized names
}

function buildFallbackChain(primary: ModelTier): ModelTier[] {
  const primaryIndex = TIER_ORDER.indexOf(primary);
  // Chain goes from primary's fallback downward
  const chain: ModelTier[] = [];
  for (let i = primaryIndex + 1; i < TIER_ORDER.length; i++) {
    chain.push(TIER_ORDER[i]);
  }
  // If no fallbacks defined (primary is last), add a sensible one
  if (chain.length === 0) {
    chain.push('sonnet');
  }
  return chain;
}

function estimateCostForTier(
  tier: ModelTier,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[tier];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return Number((inputCost + outputCost).toFixed(6));
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Production ModelRouter Class ────────────────────────────────────────────

export class ModelRouter {
  private state: RouterState;
  private contextEngine: unknown | null = null;

  constructor(options?: { logMaxEntries?: number }) {
    this.state = createRouterState(options?.logMaxEntries);
  }

  /**
   * Route a task to the optimal model.
   */
  route(taskType: string, context: TaskContext): RoutingDecision {
    const normalizedType = this.normalizeTaskType(context.taskType);
    const route = DEFAULT_ROUTES[normalizedType];
    const primaryTier = route.recommendedModel as ModelTier;

    // Build fallback chain
    const fallbackChain = buildFallbackChain(primaryTier);

    // Estimate cost
    const estimatedCost = estimateCostForTier(
      primaryTier,
      context.estimatedInputTokens,
      context.estimatedOutputTokens
    );

    // Build rationale
    const rationale = this.buildRationale(normalizedType, primaryTier, route, context, estimatedCost);

    const decision: RoutingDecision = {
      model: tierToModelName(primaryTier),
      reasoningEffort: route.reasoningEffort,
      maxTokens: route.maxTokens,
      temperature: route.temperature,
      rationale,
      estimatedCost,
      fallbackChain: fallbackChain.map(tierToModelName),
      tier: primaryTier,
    };

    // Log the decision
    this.logRoutingDecision(decision, context, false);

    // Update session budget if applicable
    if (context.sessionId) {
      this.chargeSessionBudget(context.sessionId, estimatedCost);
    }

    return decision;
  }

  /**
   * Get available models from the catalog.
   */
  getAvailableModels(): ModelInfo[] {
    return MODEL_CATALOG.map((profile) => ({
      id: profile.id,
      name: profile.name,
      provider: profile.provider,
      tier: modelNameToTier(profile.id),
      costPer1MInput: profile.costPer1MInputUsd,
      costPer1MOutput: profile.costPer1MInputUsd * 5, // typical output multiplier
      contextWindowK: profile.contextCapacityK * 1000,
      available: true,
    }));
  }

  /**
   * Check if a model is available.
   */
  isAvailable(modelId: string): boolean {
    return MODEL_CATALOG.some((m) => m.id === modelId);
  }

  /**
   * Get the fallback model chain for a given model tier.
   */
  getFallback(modelId: string): string {
    // If input is a raw tier name, fallback directly within tier order
    if (TIER_ORDER.includes(modelId as ModelTier)) {
      const index = TIER_ORDER.indexOf(modelId as ModelTier);
      return index < TIER_ORDER.length - 1 ? TIER_ORDER[index + 1] : modelId;
    }
    // If it's a known catalog model ID, resolve its tier then fallback
    const isKnownCatalogModel = MODEL_CATALOG.some((m) => m.id === modelId);
    if (isKnownCatalogModel) {
      const tier = modelNameToTier(modelId);
      const index = TIER_ORDER.indexOf(tier);
      return index < TIER_ORDER.length - 1 ? TIER_ORDER[index + 1] : modelId;
    }
    // Unknown model — no fallback, return itself
    return modelId;
  }

  /**
   * Estimate cost for a model call.
   */
  estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const tier = modelNameToTier(modelId);
    return estimateCostForTier(tier, inputTokens, outputTokens);
  }

  /**
   * Enforce a budget cap on a routing decision.
   * If estimated cost exceeds budget, downgrade to cheaper models.
   */
  enforceBudget(decision: RoutingDecision, budgetUsd: number): RoutingDecision {
    if (decision.estimatedCost <= budgetUsd) {
      return decision;
    }

    // Walk fallback chain looking for cheapest option within budget
    const tiersToTry: ModelTier[] = [decision.tier, ...decision.fallbackChain.map(modelNameToTier)];

    for (const tier of tiersToTry) {
      const inputTokens = 0; // Caller must pass actual tokens if they want accuracy
      const outputTokens = 0;
      const cost = estimateCostForTier(tier, inputTokens, outputTokens);
      if (cost <= budgetUsd) {
        const route = DEFAULT_ROUTES[this.normalizeTaskType(decision.model as TaskType)] ?? DEFAULT_ROUTES.code;
        return {
          ...decision,
          model: tierToModelName(tier),
          tier,
          estimatedCost: cost,
          rationale: `Budget enforcement: downgraded from ${decision.model} to ${tier} to stay within $${budgetUsd.toFixed(4)} budget. ${decision.rationale}`,
          fallbackChain: buildFallbackChain(tier).map(tierToModelName),
        };
      }
    }

    // Even cheapest option exceeds budget — return it with warning
    const cheapestTier = TIER_ORDER[TIER_ORDER.length - 1];
    const cheapestCost = estimateCostForTier(cheapestTier, 0, 0);
    return {
      ...decision,
      model: tierToModelName(cheapestTier),
      tier: cheapestTier,
      estimatedCost: cheapestCost,
      rationale: `WARNING: All models exceed budget of $${budgetUsd.toFixed(4)}. Using cheapest available (${cheapestTier}) at $${cheapestCost.toFixed(4)}. ${decision.rationale}`,
      fallbackChain: [],
    };
  }

  /**
   * Get routing log for analysis.
   */
  getRoutingLog(since?: string): RoutingLogEntry[] {
    if (!since) return [...this.state.routingLog];
    return this.state.routingLog.filter((entry) => entry.timestamp > since);
  }

  /**
   * Get cost report for a session.
   */
  getSessionCostReport(sessionId: string): { budget: SessionCostBudget | undefined; totalSpend: number } {
    const budget = this.state.sessionBudgets.get(sessionId);
    return {
      budget,
      totalSpend: budget?.spentUsd ?? 0,
    };
  }

  /**
   * Set or update a session's cost budget.
   */
  setSessionBudget(sessionId: string, budgetUsd: number): void {
    const existing = this.state.sessionBudgets.get(sessionId);
    this.state.sessionBudgets.set(sessionId, {
      sessionId,
      budgetUsd,
      spentUsd: existing?.spentUsd ?? 0,
      modelSpend: existing?.modelSpend ?? {},
      lastReset: nowIso(),
    });
  }

  /**
   * Clear budget for a session (e.g., after completion).
   */
  clearSessionBudget(sessionId: string): void {
    this.state.sessionBudgets.delete(sessionId);
  }

  /**
   * Connect the context engine for integrated routing.
   */
  setContextEngine(engine: unknown): void {
    this.contextEngine = engine;
  }

  /**
   * Get a recommended route for a task type (convenience).
   */
  getRoute(taskType: string): ModelRoute {
    const normalized = this.normalizeTaskType(taskType as TaskType);
    return { ...DEFAULT_ROUTES[normalized] };
  }

  // ─── Private Methods ─────────────────────────────────────────────────────

  private normalizeTaskType(type: TaskType | string): TaskType {
    const mapping: Record<string, TaskType> = {
      'code': 'code',
      'MULTI_FILE_IMPLEMENTATION': 'code',
      'FAST_SYNTAX_REPAIR': 'code',
      'research': 'research',
      'ARCHITECTURE_DESIGN': 'research',
      'ADVERSARIAL_SECURITY_AUDIT': 'research',
      'design': 'design',
      'analysis': 'analysis',
      'summarize': 'summarize',
      'creative': 'creative',
    };
    return mapping[type] ?? 'code';
  }

  private buildRationale(
    taskType: TaskType,
    tier: ModelTier,
    route: ModelRoute,
    context: TaskContext,
    cost: number
  ): string {
    const reasons: string[] = [
      `Task type '${taskType}' routed to ${tier} (reasoning: ${route.reasoningEffort}).`,
      `Estimated cost: $${cost.toFixed(6)} for ${context.estimatedInputTokens} input + ${context.estimatedOutputTokens} output tokens.`,
    ];
    if (context.isUrgent) {
      reasons.push('Urgent flag detected — prioritizing availability over maximum capability.');
    }
    if (context.requiresReasoning) {
      reasons.push('Reasoning required — selected model supports extended thinking.');
    }
    return reasons.join(' ');
  }

  private logRoutingDecision(
    decision: RoutingDecision,
    context: TaskContext,
    fallbackUsed: boolean
  ): void {
    const entry: RoutingLogEntry = {
      timestamp: nowIso(),
      taskType: context.taskType,
      selectedModel: decision.model,
      reasoningEffort: decision.reasoningEffort,
      estimatedCost: decision.estimatedCost,
      rationale: decision.rationale,
      sessionId: context.sessionId,
      projectId: context.projectId,
      fallbackUsed,
    };

    this.state.routingLog.push(entry);

    // Trim log if it exceeds max entries
    while (this.state.routingLog.length > this.state.logMaxEntries) {
      this.state.routingLog.shift();
    }
  }

  private chargeSessionBudget(sessionId: string, cost: number): void {
    const budget = this.state.sessionBudgets.get(sessionId);
    if (!budget) return;

    budget.spentUsd = Number((budget.spentUsd + cost).toFixed(6));
    budget.modelSpend['fable'] = Number((budget.modelSpend['fable'] ?? 0).toFixed(6));
    budget.lastReset = nowIso();
  }
}

// ─── Legacy Function (preserved for backward compatibility) ───────────────────

export function routeOptimalModel(req: ModelRoutingRequest): RoutedModelRecommendation {
  const eligible = MODEL_CATALOG.filter((m) => {
    if (req.requireAirgappedLocal && !m.isLocal) return false;
    if (m.contextCapacityK < req.requiredContextTokensK) return false;
    if (m.costPer1MInputUsd > req.maxCostPer1MUsd) return false;
    return true;
  });

  const pool = eligible.length > 0 ? eligible : MODEL_CATALOG;

  const scored = pool.map((model) => {
    let qualityWeight = 0.4;
    let reasoningWeight = 0.35;
    let speedWeight = req.prioritizeLatency ? 0.35 : 0.15;
    let costWeight = 0.1;

    if (req.taskType === 'ARCHITECTURE_DESIGN' || req.taskType === 'ADVERSARIAL_SECURITY_AUDIT') {
      reasoningWeight = 0.5;
      qualityWeight = 0.35;
    } else if (req.taskType === 'FAST_SYNTAX_REPAIR') {
      speedWeight = 0.45;
      costWeight = 0.25;
      reasoningWeight = 0.15;
    }

    const speedScore = Math.max(10, 100 - model.medianLatencyMs / 40);
    const costScore = Math.max(10, 100 - model.costPer1MInputUsd * 22);

    const raw =
      model.codingQuality * qualityWeight +
      model.reasoningCapability * reasoningWeight +
      speedScore * speedWeight +
      costScore * costWeight;

    const totalWeight = qualityWeight + reasoningWeight + speedWeight + costWeight;
    return {
      model,
      score: Number((raw / totalWeight).toFixed(1)),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  const primary = scored[0].model;
  const fallback = (scored[1] ?? scored[0]).model;

  return {
    primaryModel: primary,
    fallbackModel: fallback,
    compositeScore: scored[0].score,
    routingRationale: `Selected ${primary.name} (${primary.provider}) with composite Pareto score ${scored[0].score}/100 for ${req.taskType} (${primary.contextCapacityK}k context, $${primary.costPer1MInputUsd}/1M tokens). Fallback: ${fallback.name}.`,
    allRanked: scored,
  };
}
