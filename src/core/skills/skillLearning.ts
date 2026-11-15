/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Skill Learning & Instinct Extraction
 * (src/core/skills/skillLearning.ts)
 *
 * Enhanced with ECC-inspired pattern extraction and Superpowers-inspired
 * instinct-based skill chaining. Tracks which skills succeed/fail per domain,
 * extracts reusable patterns from successful executions, auto-composes skill
 * chains based on domain, and records skill effectiveness metrics.
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain decomposition patterns,
 *   skill affinity detection, and cross-domain capability mapping inspired
 *   the combination scoring and domain-learning algorithms.
 *
 *   Superpowers (https://github.com/obra/superpowers) — the instinct-extraction
 *   and pattern-reuse concepts inspired the InstinctCache and
 *   ExecutionPattern interfaces below.
 */

import type {
  Skill, SkillResult, SkillMetrics, SkillSuggestion, SkillCombination,
  SkillQuery, Workflow, SkillInput, SkillOutput,
} from './skillEngine';

// ---------------------------------------------------------------------------
// New types for instinct extraction and pattern learning
// ---------------------------------------------------------------------------

/** A reusable pattern extracted from successful skill executions. */
export interface ExecutionPattern {
  id: string;
  /** Which skill sequence this pattern describes */
  skillIds: string[];
  /** Domain(s) this pattern applies to */
  domain: string[];
  /** Number of times this exact sequence succeeded */
  occurrenceCount: number;
  /** Rolling success rate for this pattern */
  successRate: number;
  /** Average execution duration (ms) */
  avgDurationMs: number;
  /** Input-output signature that makes this pattern reusable */
  ioSignature: Record<string, string>;
  /** Confidence in this pattern (0..1) based on sample size */
  confidence: number;
  /** When this pattern was first observed */
  firstObserved: string;
  /** When this pattern was last observed */
  lastObserved: string;
}

/** A learned "instinct" — a named skill chain the system has high confidence in. */
export interface SkillInstinct {
  id: string;
  name: string;
  description: string;
  /** Ordered skill chain */
  skillIds: string[];
  domain: string[];
  /** Conditions that must hold for this instinct to fire */
  triggerConditions: InstinctTrigger[];
  /** Estimated success rate based on observed executions */
  successRate: number;
  /** Number of times this instinct was applied */
  applicationCount: number;
  lastAppliedAt?: string;
  createdAt: string;
}

/** Conditions that trigger a skill instinct. */
export interface InstinctTrigger {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'regex';
  value: unknown;
}

/** Execution context for instinct matching. */
export interface InstinctMatchContext {
  domain: string[];
  availableSkillIds: string[];
  inputHints?: Record<string, unknown>;
}

/** A recommended skill chain derived from learning. */
export interface RecommendedChain {
  skillIds: string[];
  reason: string;
  confidence: number;
  source: 'instinct' | 'pattern' | 'combination';
}

/** Outcome recorded per domain per skill execution. */
export interface DomainSkillOutcome {
  skillId: string;
  domain: string;
  status: SkillResult['status'];
  durationMs: number;
  timestamp: string;
}

/** Cross-domain transfer insight. */
export interface DomainTransferInsight {
  fromDomain: string;
  toDomain: string;
  /** Skill(s) that perform well in both domains */
  sharedSkillIds: string[];
  /** Confidence that the skill will work in the target domain */
  transferConfidence: number;
  reason: string;
}

// ---------------------------------------------------------------------------
// Extended learning report
// ---------------------------------------------------------------------------

export interface LearningReport {
  suggestions: SkillSuggestion[];
  combinations: SkillCombination[];
  riskSkills: { skillId: string; reason: string }[];
  overallHealth: { healthy: number; degraded: number; failed: number };
  /** Extracted execution patterns */
  patterns: ExecutionPattern[];
  /** Learned instincts */
  instincts: SkillInstinct[];
  /** Domain transfer insights */
  transferInsights: DomainTransferInsight[];
}

// ---------------------------------------------------------------------------
// Skill Learning Engine
// ---------------------------------------------------------------------------

export class SkillLearning {
  private readonly minSampleSize = 5;
  private readonly patterns: Map<string, ExecutionPattern> = new Map();
  private readonly instincts: Map<string, SkillInstinct> = new Map();
  private readonly domainOutcomes: Map<string, DomainSkillOutcome[]> = new Map();
  private readonly maxPatterns = 200;

  // ---- Pattern extraction (Superpowers-inspired) ----

  /**
   * Record a skill execution for pattern learning.
   * Call this after every skill execution to build the instinct cache.
   */
  recordExecution(outcome: DomainSkillOutcome): void {
    for (const domain of (outcome.domain && outcome.domain.length > 0 ? outcome.domain : ['__unknown__'])) {
      const key = domain;
      const list = this.domainOutcomes.get(key) ?? [];
      list.push(outcome);
      this.domainOutcomes.set(key, list);
    }
  }

  /**
   * Extract reusable execution patterns from recorded outcomes.
   * Looks for repeated skill sequences that succeeded.
   */
  extractPatterns(): ExecutionPattern[] {
    const patternMap = new Map<string, { occurrences: DomainSkillOutcome[] }>();

    for (const [, outcomes] of this.domainOutcomes) {
      // Slide a window of size 2..4 over the skill sequence
      const skillSequence = outcomes.map(o => o.skillId);
      for (let windowSize = 2; windowSize <= Math.min(4, skillSequence.length); windowSize++) {
        for (let i = 0; i <= skillSequence.length - windowSize; i++) {
          const window = skillSequence.slice(i, i + windowSize);
          const key = window.join('->');
          const existing = patternMap.get(key) ?? { occurrences: [] };
          existing.occurrences.push(...outcomes.slice(i, i + windowSize));
          patternMap.set(key, existing);
        }
      }
    }

    const patterns: ExecutionPattern[] = [];
    for (const [key, { occurrences }] of patternMap) {
      const skillIds = key.split('->');
      const successes = occurrences.filter(o => o.status === 'success');
      if (successes.length < this.minSampleSize) continue;

      const avgDuration = successes.reduce((s, o) => s + o.durationMs, 0) / successes.length;
      const domains = [...new Set(occurrences.map(o => o.domain))];
      const confidence = Math.min(1, successes.length / 50);

      // Build IO signature from the first and last skill
      const ioSignature: Record<string, string> = {};
      if (skillIds.length >= 2) {
        ioSignature[`${skillIds[0]}.out`] = skillIds[1];
        ioSignature[`${skillIds[skillIds.length - 2]}.out`] = skillIds[skillIds.length - 1];
      }

      const pattern: ExecutionPattern = {
        id: `pattern-${key}`,
        skillIds,
        domain: domains,
        occurrenceCount: successes.length,
        successRate: successes.length / occurrences.length,
        avgDurationMs: avgDuration,
        ioSignature,
        confidence,
        firstObserved: occurrences[0]?.timestamp ?? new Date().toISOString(),
        lastObserved: occurrences[occurrences.length - 1]?.timestamp ?? new Date().toISOString(),
      };

      patterns.push(pattern);
      if (this.patterns.size < this.maxPatterns) {
        this.patterns.set(key, pattern);
      }
    }

    patterns.sort((a, b) => b.confidence - a.confidence);
    return patterns.slice(0, this.maxPatterns);
  }

  /**
   * Get all extracted patterns.
   */
  getPatterns(): ExecutionPattern[] {
    return Array.from(this.patterns.values()).sort((a, b) => b.confidence - a.confidence);
  }

  // ---- Instinct management (Superpowers-inspired) ----

  /**
   * Register a named instinct — a high-confidence skill chain.
   */
  registerInstinct(instinct: SkillInstinct): void {
    this.instincts.set(instinct.id, instinct);
  }

  /**
   * Match an instinct against a context.
   */
  matchInstincts(context: InstinctMatchContext): RecommendedChain[] {
    const results: RecommendedChain[] = [];

    for (const instinct of this.instincts.values()) {
      // Domain overlap
      const domainMatch = instinct.domain.some(d => context.domain.includes(d));
      if (!domainMatch && instinct.domain.length > 0) continue;

      // All skills in the instinct must be available
      const available = instinct.skillIds.filter(id => context.availableSkillIds.includes(id));
      if (available.length !== instinct.skillIds.length) continue;

      // Check trigger conditions
      for (const trigger of instinct.triggerConditions) {
        const value = context.inputHints?.[trigger.field];
        let matched = false;
        switch (trigger.operator) {
          case 'equals':
            matched = value === trigger.value;
            break;
          case 'contains':
            matched = typeof value === 'string' && typeof trigger.value === 'string' && value.includes(trigger.value);
            break;
          case 'in':
            matched = Array.isArray(trigger.value) && trigger.value.includes(value);
            break;
          case 'regex':
            matched = typeof value === 'string' && typeof trigger.value === 'string' &&
              new RegExp(trigger.value).test(value);
            break;
        }
        if (!matched) break;
      }

      results.push({
        skillIds: instinct.skillIds,
        reason: `Instinct: ${instinct.name}`,
        confidence: instinct.successRate,
        source: 'instinct',
      });
    }

    results.sort((a, b) => b.confidence - a.confidence);
    return results;
  }

  /**
   * Get all registered instincts.
   */
  getInstincts(): SkillInstinct[] {
    return Array.from(this.instincts.values());
  }

  // ---- Domain-aware recommendation ----

  /**
   * Recommend a skill chain for a given domain by combining pattern matching,
   * instinct matching, and combination scoring.
   */
  recommendChain(
    domain: string[],
    registry: {
      get: (id: string) => Skill | undefined;
      findByDomain: (d: string) => Skill[];
      findByCapability: (c: string) => Skill[];
    }
  ): RecommendedChain[] {
    const availableIds = registry.listAll ? registry.listAll().map(s => s.id) : [];
    const context: InstinctMatchContext = { domain, availableSkillIds: availableIds };

    // 1. Match instincts
    const instinctResults = this.matchInstincts(context);

    // 2. Match patterns
    const patternResults: RecommendedChain[] = [];
    const patterns = this.getPatterns();
    for (const pattern of patterns) {
      if (!pattern.domain.some(d => domain.includes(d))) continue;
      if (!pattern.skillIds.every(id => availableIds.includes(id))) continue;
      patternResults.push({
        skillIds: pattern.skillIds,
        reason: `Pattern: ${pattern.id} (${(pattern.successRate * 100).toFixed(0)}% success)`,
        confidence: pattern.confidence * pattern.successRate,
        source: 'pattern',
      });
    }
    patternResults.sort((a, b) => b.confidence - a.confidence);

    // 3. Fall back to combination scoring from existing skills
    const comboResults: RecommendedChain[] = [];
    const domainSkills = domain.flatMap(d => registry.findByDomain(d));
    for (let i = 0; i < domainSkills.length; i++) {
      for (let j = i + 1; j < domainSkills.length; j++) {
        const a = domainSkills[i], b = domainSkills[j];
        const sharedDomain = a.domain.some(d => b.domain.includes(d));
        const sharedCap = a.capabilities.some(c => b.capabilities.includes(c));
        if (!sharedDomain && !sharedCap) continue;
        const ma = registry.getMetrics?.(a.id);
        const mb = registry.getMetrics?.(b.id);
        const combinedSuccess = ((ma?.successRate ?? 1) + (mb?.successRate ?? 1)) / 2;
        comboResults.push({
          skillIds: [a.id, b.id],
          reason: `Complementary skills in ${domain.join(',')}`,
          confidence: combinedSuccess * 0.8,
          source: 'combination',
        });
      }
    }
    comboResults.sort((a, b) => b.confidence - a.confidence);

    // Merge, de-duplicate by skillIds set, and return top 10
    const seen = new Set<string>();
    const merged: RecommendedChain[] = [];
    for (const r of [...instinctResults, ...patternResults, ...comboResults]) {
      const key = r.skillIds.sort().join('->');
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(r);
      }
    }
    return merged.slice(0, 10);
  }

  // ---- Domain transfer insights (ECC-inspired) ----

  /**
   * Detect which skills work well across multiple domains (cross-domain transfer).
   * Inspired by ECC's cross-domain capability mapping.
   */
  detectDomainTransfers(): DomainTransferInsight[] {
    const insights: DomainTransferInsight[] = [];
    const domainSkillScores = new Map<string, Map<string, { successRate: number; count: number }>>();

    // Aggregate skill performance per domain
    for (const [domain, outcomes] of this.domainOutcomes) {
      for (const outcome of outcomes) {
        const scores = domainSkillScores.get(outcome.skillId) ?? new Map();
        const existing = scores.get(domain) ?? { successRate: 0, count: 0 };
        const newCount = existing.count + 1;
        const newSuccess = ((existing.successRate * existing.count) + (outcome.status === 'success' ? 1 : 0)) / newCount;
        scores.set(domain, { successRate: newSuccess, count: newCount });
        domainSkillScores.set(outcome.skillId, scores);
      }
    }

    // Find skills that perform well in multiple domains
    const domains = [...this.domainOutcomes.keys()];
    for (let i = 0; i < domains.length; i++) {
      for (let j = i + 1; j < domains.length; j++) {
        const d1 = domains[i], d2 = domains[j];
        const sharedSkills: string[] = [];

        for (const [skillId, scores] of domainSkillScores) {
          const s1 = scores.get(d1);
          const s2 = scores.get(d2);
          if (s1 && s2 && s1.count >= this.minSampleSize && s2.count >= this.minSampleSize
            && s1.successRate >= 0.8 && s2.successRate >= 0.8) {
            sharedSkills.push(skillId);
          }
        }

        if (sharedSkills.length > 0) {
          const avgConfidence = sharedSkills.reduce((sum, id) => {
            const s = domainSkillScores.get(id)?.get(d2)?.successRate ?? 0;
            return sum + s;
          }, 0) / sharedSkills.length;
          insights.push({
            fromDomain: d1,
            toDomain: d2,
            sharedSkillIds: sharedSkills.slice(0, 5),
            transferConfidence: avgConfidence,
            reason: `${sharedSkills.length} skills achieve ≥80% success in both ${d1} and ${d2}`,
          });
        }
      }
    }

    insights.sort((a, b) => b.transferConfidence - a.transferConfidence);
    return insights;
  }

  // ---- Original analysis methods (enhanced) ----

  /**
   * Analyze all registered skills and produce actionable suggestions,
   * extracted patterns, and domain transfer insights.
   */
  analyze(
    registry: {
      get: (id: string) => Skill | undefined;
      listAll: () => Skill[];
      getMetrics: (id: string) => SkillMetrics | undefined;
      findByDomain: (d: string) => Skill[];
    }
  ): LearningReport {
    const skills = registry.listAll();
    const suggestions: SkillSuggestion[] = [];
    const combinations: SkillCombination[] = [];
    const riskSkills: { skillId: string; reason: string }[] = [];
    let healthy = 0, degraded = 0, failed = 0;

    for (const skill of skills) {
      const metrics = registry.getMetrics(skill.id);
      if (!metrics || metrics.executionCount === 0) {
        healthy++;
        continue;
      }

      // Health classification
      if (metrics.successRate >= 0.95) healthy++;
      else if (metrics.successRate >= 0.8) degraded++;
      else {
        failed++;
        riskSkills.push({ skillId: skill.id, reason: `Success rate ${(metrics.successRate * 100).toFixed(1)}%` });
      }

      suggestions.push(...this.#generateSuggestions(skill, metrics));
    }

    // Detect successful combinations
    const comboResults = this.detectCombinations(skills, registry);
    combinations.push(...comboResults);

    // Extract patterns and detect domain transfers
    const patterns = this.extractPatterns();
    const transferInsights = this.detectDomainTransfers();

    return {
      suggestions,
      combinations,
      riskSkills,
      overallHealth: { healthy, degraded, failed },
      patterns,
      instincts: this.getInstincts(),
      transferInsights,
    };
  }

  /**
   * Generate improvement suggestions for a single skill.
   */
  #generateSuggestions(skill: Skill, m: SkillMetrics): SkillSuggestion[] {
    const suggestions: SkillSuggestion[] = [];

    // Low success rate
    if (m.executionCount >= this.minSampleSize && m.successRate < 0.8) {
      suggestions.push({
        skillId: skill.id,
        type: 'improvement',
        reason: `Success rate is ${(m.successRate * 100).toFixed(1)}% — below threshold.`,
        confidence: 0.9,
        action: `Review error patterns in errorBreakdown and add handling for: ${Object.keys(m.errorBreakdown).join(', ')}`,
      });
    }

    // Retire candidate: long history, never used recently
    if (m.executionCount >= 20 && m.lastExecutedAt) {
      const lastRun = new Date(m.lastExecutedAt).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - lastRun > thirtyDays) {
        suggestions.push({
          skillId: skill.id,
          type: 'retire',
          reason: `Not executed in >30 days after ${m.executionCount} runs.`,
          confidence: 0.7,
          action: 'Consider archiving or marking deprecated.',
        });
      }
    }

    // Timeout candidate
    if (m.timeoutCount > 0 && m.executionCount >= this.minSampleSize) {
      const timeoutRate = m.timeoutCount / m.executionCount;
      if (timeoutRate > 0.1) {
        suggestions.push({
          skillId: skill.id,
          type: 'improvement',
          reason: `${(timeoutRate * 100).toFixed(1)}% of executions time out.`,
          confidence: 0.85,
          action: 'Consider increasing timeoutMs or optimizing the implementation.',
        });
      }
    }

    // High p95 vs avg — variance issue
    if (m.p95DurationMs > m.avgDurationMs * 3 && m.executionCount >= this.minSampleSize) {
      suggestions.push({
        skillId: skill.id,
        type: 'improvement',
        reason: `p95 (${m.p95DurationMs.toFixed(0)}ms) is >3x avg (${m.avgDurationMs.toFixed(0)}ms).`,
        confidence: 0.7,
        action: 'Investigate outlier cases; consider async decomposition or caching.',
      });
    }

    // Promote candidate: consistently high success, low latency
    if (m.executionCount >= 10 && m.successRate >= 0.98 && m.avgDurationMs < 500) {
      suggestions.push({
        skillId: skill.id,
        type: 'promote',
        reason: `High performance (${(m.successRate * 100).toFixed(0)}% success, ${m.avgDurationMs.toFixed(0)}ms avg).`,
        confidence: 0.8,
        action: 'Consider promoting to a default/recommended skill in its domain.',
      });
    }

    return suggestions;
  }

  /**
   * Detect skill pairs or chains that co-occur and have good success rates.
   */
  detectCombinations(
    skills: Skill[],
    registry: { getMetrics: (id: string) => SkillMetrics | undefined }
  ): SkillCombination[] {
    const combos: SkillCombination[] = [];

    for (let i = 0; i < skills.length; i++) {
      for (let j = i + 1; j < skills.length; j++) {
        const a = skills[i], b = skills[j];
        const sharedDomain = a.domain.some(d => b.domain.includes(d));
        const sharedCap = a.capabilities.some(c => b.capabilities.includes(c));
        if (!sharedDomain && !sharedCap) continue;

        const ma = registry.getMetrics(a.id);
        const mb = registry.getMetrics(b.id);
        const combinedSuccess = ((ma?.successRate ?? 1) + (mb?.successRate ?? 1)) / 2;
        const combinedDuration = ((ma?.avgDurationMs ?? 0) + (mb?.avgDurationMs ?? 0)) / 2;

        combos.push({
          skillIds: [a.id, b.id],
          successRate: combinedSuccess,
          avgDurationMs: combinedDuration,
          coOccurrenceCount: (ma?.executionCount ?? 0) + (mb?.executionCount ?? 0),
        });
      }
    }

    combos.sort((a, b) => b.successRate - a.successRate);
    return combos.slice(0, 20);
  }

  /**
   * Detect which skills are failing most often.
   */
  detectFailingSkills(skills: Skill[], registry: { getMetrics: (id: string) => SkillMetrics | undefined }): Skill[] {
    return skills.filter(skill => {
      const m = registry.getMetrics(skill.id);
      if (!m || m.executionCount < this.minSampleSize) return false;
      return m.successRate < 0.8;
    });
  }

  /**
   * Compute an overall health summary string.
   */
  summarizeHealth(health: LearningReport['overallHealth']): string {
    const total = health.healthy + health.degraded + health.failed;
    if (total === 0) return 'No skills registered.';
    const pct = (n: number) => ((n / total) * 100).toFixed(1);
    return `${pct(health.healthy)}% healthy, ${pct(health.degraded)}% degraded, ${pct(health.failed)}% failed (${total} total)`;
  }

  // ---- Helper: record domain skill outcome from a SkillResult ----

  /**
   * Convenience: convert a SkillResult + domain list into a DomainSkillOutcome
   * and record it for pattern learning.
   */
  recordSkillResult(skillId: string, domains: string[], result: SkillResult): void {
    this.recordExecution({
      skillId,
      domain: domains.length > 0 ? domains[0] : '__unknown__',
      status: result.status,
      durationMs: result.durationMs,
      timestamp: result.startedAt,
    });
  }
}
