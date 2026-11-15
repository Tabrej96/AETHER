/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Skill Registry
 * (src/core/skills/skillRegistry.ts)
 *
 * Central store for all registered skills. Supports registration,
 * discovery by domain/capability/tag, dependency resolution, version
 * management, and health checks.
 */

import type {
  Skill, SkillQuery, SkillMetrics, DataType, RetryPolicy,
  SkillInput, SkillOutput, SkillTest, SkillMetadata, SkillSecurity,
} from './skillEngine';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface RegisteredSkill {
  spec: Skill;
  metrics: SkillMetrics;
  /** dependency graph adjacency list */
  dependents: string[];
  healthStatus: 'healthy' | 'degraded' | 'failed';
  registeredAt: string;
  lastAccessedAt: string;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class SkillRegistry {
  #skills = new Map<string, RegisteredSkill>();
  #byDomain = new Map<string, Set<string>>();
  #byCapability = new Map<string, Set<string>>();
  #byTag = new Map<string, Set<string>>();
  #initialized = false;

  constructor() {
    this.#initialized = true;
  }

  // ---- lifecycle ----

  /** Register a new skill; replaces any existing entry with the same id. */
  register(skill: Skill): void {
    this.validate(skill);

    // If replacing, remove old entry and clean reverse-deps
    if (this.#skills.has(skill.id)) {
      this.#unregisterIndex(skill.id);
    }

    // Register reverse dependency links: for each dep, add this skill as a dependent
    for (const dep of skill.dependencies) {
      const depEntry = this.#skills.get(dep);
      if (depEntry && !depEntry.dependents.includes(skill.id)) {
        depEntry.dependents.push(skill.id);
      }
    }

    const now = new Date().toISOString();
    const registered: RegisteredSkill = {
      spec: skill,
      metrics: emptyMetrics(skill.id),
      dependents: [],
      healthStatus: 'healthy',
      registeredAt: now,
      lastAccessedAt: now,
    };

    this.#skills.set(skill.id, registered);
    this.#index(skill);
  }

  /** Unregister a skill by id. */
  unregister(skillId: string): boolean {
    if (!this.#skills.has(skillId)) return false;
    this.#unregisterIndex(skillId);
    this.#skills.delete(skillId);
    return true;
  }

  /** Retrieve a skill by id. Returns undefined if not found. */
  get(skillId: string): Skill | undefined {
    const entry = this.#skills.get(skillId);
    if (entry) entry.lastAccessedAt = new Date().toISOString();
    return entry?.spec;
  }

  /** All registered skill ids. */
  listIds(): string[] {
    return Array.from(this.#skills.keys());
  }

  /** All registered skills. */
  listAll(): Skill[] {
    return Array.from(this.#skills.values()).map(e => e.spec);
  }

  // ---- discovery ----

  /** Find skills matching the query. Free-text search across name + description. */
  find(query: SkillQuery): Skill[] {
    let candidates: string[];

    if (query.capability) {
      candidates = this.#byCapability.get(query.capability) ? [...this.#byCapability.get(query.capability)!] : [];
    } else if (query.domain) {
      candidates = this.#byDomain.get(query.domain) ? [...this.#byDomain.get(query.domain)!] : [];
    } else if (query.tag) {
      candidates = this.#byTag.get(query.tag) ? [...this.#byTag.get(query.tag)!] : [];
    } else if (query.text) {
      candidates = this.freeTextSearch(query.text);
    } else {
      candidates = this.listIds();
    }

    if (query.dependency) {
      candidates = candidates.filter(id => {
        const entry = this.#skills.get(id);
        return entry?.spec.dependencies.includes(query.dependency!);
      });
    }

    const max = query.maxResults ?? 50;
    return candidates.slice(0, max).map(id => this.#skills.get(id)!.spec);
  }

  /** Skills that provide a given capability. */
  findByCapability(capability: string): Skill[] {
    return this.find({ capability });
  }

  /** Skills in a given domain. */
  findByDomain(domain: string): Skill[] {
    return this.find({ domain });
  }

  /** Skills tagged with a given tag. */
  findByTag(tag: string): Skill[] {
    return this.find({ tag });
  }

  freeTextSearch(text: string): string[] {
    const lower = text.toLowerCase();
    const results: { id: string; score: number }[] = [];
    for (const [id, entry] of this.#skills) {
      const s = entry.spec;
      let score = 0;
      if (s.name.toLowerCase().includes(lower)) score += 10;
      if (s.description.toLowerCase().includes(lower)) score += 5;
      if (s.domain.some(d => d.toLowerCase().includes(lower))) score += 3;
      if (s.capabilities.some(c => c.toLowerCase().includes(lower))) score += 4;
      if (s.metadata.tags.some(t => t.toLowerCase().includes(lower))) score += 2;
      if (score > 0) results.push({ id, score });
    }
    results.sort((a, b) => b.score - a.score);
    return results.map(r => r.id);
  }

  // ---- dependency resolution ----

  /**
   * Return a topologically sorted list of skill ids required by `skillId`,
   * including transitive dependencies. The skill itself is last.
   */
  resolveDependencies(skillId: string): string[] {
    if (!this.#skills.has(skillId)) return [];

    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const spec = this.get(id);
      if (!spec) return;
      for (const dep of spec.dependencies) {
        visit(dep);
      }
      order.push(id);
    };

    visit(skillId);
    return order;
  }

  /** Check whether all dependencies of `skillId` are registered. */
  hasDependencies(skillId: string): boolean {
    const spec = this.get(skillId);
    if (!spec) return false;
    return spec.dependencies.every(dep => this.#skills.has(dep));
  }

  /** Return skills that depend on `skillId` (reverse index). */
  getDependents(skillId: string): Skill[] {
    const entry = this.#skills.get(skillId);
    if (!entry) return [];
    return entry.dependents.map(id => this.get(id)).filter((s): s is Skill => s !== undefined);
  }

  // ---- metrics ----

  updateMetrics(skillId: string, patch: Partial<SkillMetrics>): void {
    const entry = this.#skills.get(skillId);
    if (!entry) return;
    entry.metrics = { ...entry.metrics, ...patch };
  }

  getMetrics(skillId: string): SkillMetrics | undefined {
    return this.#skills.get(skillId)?.metrics;
  }

  // ---- health ----

  setHealthStatus(skillId: string, status: 'healthy' | 'degraded' | 'failed'): void {
    const entry = this.#skills.get(skillId);
    if (entry) entry.healthStatus = status;
  }

  getHealthStatus(skillId: string): 'healthy' | 'degraded' | 'failed' | undefined {
    return this.#skills.get(skillId)?.healthStatus;
  }

  /** Skills whose health is not 'healthy'. */
  getUnhealthySkills(): Skill[] {
    return Array.from(this.#skills.values())
      .filter(e => e.healthStatus !== 'healthy')
      .map(e => e.spec);
  }

  // ---- versioning helpers ----

  /** Check if a newer version of the skill exists. */
  hasNewerVersion(skillId: string, currentVersion: string): boolean {
    const entry = this.#skills.get(skillId);
    if (!entry) return false;
    return semverCompare(entry.spec.version, currentVersion) > 0;
  }

  /** Count of registered skills. */
  get size(): number {
    return this.#skills.size;
  }

  /** True if registry contains a skill id. */
  has(skillId: string): boolean {
    return this.#skills.has(skillId);
  }

  // ---- internal indexing ----

  #index(skill: Skill): void {
    this.#skills.set(skill.id, {
      spec: skill,
      metrics: emptyMetrics(skill.id),
      dependents: [],
      healthStatus: 'healthy',
      registeredAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
    });

    for (const d of skill.domain) {
      this.#addSet(this.#byDomain, d, skill.id);
    }
    for (const c of skill.capabilities) {
      this.#addSet(this.#byCapability, c, skill.id);
    }
    for (const t of skill.metadata.tags) {
      this.#addSet(this.#byTag, t, skill.id);
    }
  }

  #unregisterIndex(skillId: string): boolean {
    const entry = this.#skills.get(skillId);
    if (!entry) return false;
    for (const d of entry.spec.domain) this.#removeSet(this.#byDomain, d, skillId);
    for (const c of entry.spec.capabilities) this.#removeSet(this.#byCapability, c, skillId);
    for (const t of entry.spec.metadata.tags) this.#removeSet(this.#byTag, t, skillId);
    return true;
  }

  #addSet(map: Map<string, Set<string>>, key: string, id: string): void {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(id);
  }

  #removeSet(map: Map<string, Set<string>>, key: string, id: string): void {
    const set = map.get(key);
    if (set) {
      set.delete(id);
      if (set.size === 0) map.delete(key);
    }
  }

  // ---- validation ----

  private validate(skill: Skill): void {
    if (!skill.id || skill.id.trim().length === 0) {
      throw new Error('Skill.id is required and must be non-empty');
    }
    if (!skill.name || skill.name.trim().length === 0) {
      throw new Error(`Skill "${skill.id}": name is required`);
    }
    if (!skill.version || !/^\d+\.\d+\.\d+$/.test(skill.version)) {
      throw new Error(`Skill "${skill.id}": version must be semver (e.g. 1.0.0)`);
    }
    if (skill.domain.length === 0) {
      throw new Error(`Skill "${skill.id}": at least one domain is required`);
    }
    if (skill.capabilities.length === 0) {
      throw new Error(`Skill "${skill.id}": at least one capability is required`);
    }
    if (skill.tests.length === 0) {
      throw new Error(`Skill "${skill.id}": at least one test is required`);
    }
    if (skill.execution.type === 'inline' && skill.execution.implementation.trim().length === 0) {
      throw new Error(`Skill "${skill.id}": inline execution requires non-empty implementation`);
    }
    // Validate all inputs have valid types
    for (const input of skill.inputs) {
      if (!isDataType(input.type)) {
        throw new Error(`Skill "${skill.id}": input "${input.name}" has invalid type "${input.type}"`);
      }
    }
    for (const output of skill.outputs) {
      if (!isDataType(output.type)) {
        throw new Error(`Skill "${skill.id}": output "${output.name}" has invalid type "${output.type}"`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyMetrics(skillId: string): SkillMetrics {
  return {
    skillId,
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
    timeoutCount: 0,
    avgDurationMs: 0,
    p95DurationMs: 0,
    lastExecutedAt: '',
    successRate: 0,
    errorBreakdown: {},
    dailyHistory: [],
  };
}

function isDataType(t: unknown): t is DataType {
  return typeof t === 'string' &&
    ['string', 'number', 'boolean', 'object', 'array', 'any'].includes(t);
}

/**
 * Compare two semver strings. Returns -1/0/1 like Array.sort comparator.
 */
function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
