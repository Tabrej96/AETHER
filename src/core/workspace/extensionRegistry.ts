/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Program 08 · Extension Discovery & Plugin Registry
 * (src/core/workspace/extensionRegistry.ts)
 *
 * Plugin/skill discovery system with version management, dependency
 * resolution, and capability registration. Inspired by the Obsidian
 * plugin-registry model and Puter's app-store concepts.
 *
 * AETHER-native: clean-room implementation; no copied code.
 */

import { randomUUID } from 'node:crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PluginManifest {
  pluginId: string;
  name: string;
  description: string;
  version: string;
  license: string;
  author: string;
  homepage?: string;
  repository?: string;
  requiredPermissions: string[];
  dependencies: Record<string, string>; // name -> version range
  capabilities: string[];
  tags: string[];
  entryPoint: string;
  minAetherVersion?: string;
  maxAetherVersion?: string;
}

export interface RegisteredPlugin extends PluginManifest {
  registeredAt: string;
  lastUpdatedAt: string;
  enabled: boolean;
  healthStatus: 'healthy' | 'degraded' | 'failed';
  usageCount: number;
}

export interface PluginDependencyGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string; constraint: string }>;
  cycles: string[][];
  installOrder: string[];
}

export interface PluginSearchResult {
  plugin: RegisteredPlugin;
  matchScore: number;
  matchedFields: string[];
}

export interface VersionConflict {
  pluginId: string;
  required: string;
  available: string;
  resolution: 'upgrade' | 'downgrade' | 'incompatible';
}

// ─── SemVer helpers ──────────────────────────────────────────────────────────

export function parseVersion(v: string): [number, number, number] {
  const parts = v.replace(/^v/, '').split('.').map((p) => parseInt(p.split('-')[0], 10) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

export function compareVersion(a: string, b: string): number {
  const [amaj, amin, apatch] = parseVersion(a);
  const [bmaj, bmin, bpatch] = parseVersion(b);
  if (amaj !== bmaj) return amaj - bmaj;
  if (amin !== bmin) return amin - bmin;
  return apatch - bpatch;
}

export function satisfiesVersion(actual: string, range: string): boolean {
  if (range === '*' || range === 'latest' || range === '') return true;
  if (range.startsWith('>=')) return compareVersion(actual, range.slice(2)) >= 0;
  if (range.startsWith('>')) return compareVersion(actual, range.slice(1)) > 0;
  if (range.startsWith('<=')) return compareVersion(actual, range.slice(2)) <= 0;
  if (range.startsWith('<')) return compareVersion(actual, range.slice(1)) < 0;
  if (range.startsWith('~')) {
    // ~1.2.3 means >=1.2.3 <1.3.0
    const base = range.slice(1);
    const [maj, min] = parseVersion(base);
    const actualParsed = parseVersion(actual);
    return actualParsed[0] === maj && actualParsed[1] === min && actualParsed[2] >= parseVersion(base)[2];
  }
  if (range.startsWith('^')) {
    // ^1.2.3 means >=1.2.3 <2.0.0
    const base = range.slice(1);
    const [maj] = parseVersion(base);
    const actualParsed = parseVersion(actual);
    return actualParsed[0] === maj && compareVersion(actual, base) >= 0;
  }
  // Exact match
  return actual === range;
}

// ─── Extension Registry ──────────────────────────────────────────────────────

export class ExtensionRegistry {
  private readonly plugins: Map<string, RegisteredPlugin> = new Map();
  private readonly byCapability: Map<string, Set<string>> = new Map();
  private readonly byTag: Map<string, Set<string>> = new Map();
  private readonly byPermission: Map<string, Set<string>> = new Map();

  // ─── Registration ──────────────────────────────────────────────────────────

  register(manifest: PluginManifest): RegisteredPlugin {
    const now = new Date().toISOString();
    const registered: RegisteredPlugin = {
      ...manifest,
      registeredAt: now,
      lastUpdatedAt: now,
      enabled: true,
      healthStatus: 'healthy',
      usageCount: 0,
    };

    this.plugins.set(manifest.pluginId, registered);

    // Index by capability
    for (const cap of manifest.capabilities) {
      let set = this.byCapability.get(cap);
      if (!set) { set = new Set(); this.byCapability.set(cap, set); }
      set.add(manifest.pluginId);
    }

    // Index by tag
    for (const tag of manifest.tags) {
      let set = this.byTag.get(tag);
      if (!set) { set = new Set(); this.byTag.set(tag, set); }
      set.add(manifest.pluginId);
    }

    // Index by permission
    for (const perm of manifest.requiredPermissions) {
      let set = this.byPermission.get(perm);
      if (!set) { set = new Set(); this.byPermission.set(perm, set); }
      set.add(manifest.pluginId);
    }

    return registered;
  }

  unregister(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    // Remove from indexes
    for (const cap of plugin.capabilities) {
      this.byCapability.get(cap)?.delete(pluginId);
    }
    for (const tag of plugin.tags) {
      this.byTag.get(tag)?.delete(pluginId);
    }
    for (const perm of plugin.requiredPermissions) {
      this.byPermission.get(perm)?.delete(pluginId);
    }

    this.plugins.delete(pluginId);
    return true;
  }

  get(pluginId: string): RegisteredPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  // ─── Discovery ─────────────────────────────────────────────────────────────

  list(): RegisteredPlugin[] {
    return [...this.plugins.values()];
  }

  listEnabled(): RegisteredPlugin[] {
    return [...this.plugins.values()].filter((p) => p.enabled);
  }

  findByCapability(capability: string): RegisteredPlugin[] {
    const ids = this.byCapability.get(capability);
    if (!ids) return [];
    return [...ids].map((id) => this.plugins.get(id)!).filter(Boolean);
  }

  findByTag(tag: string): RegisteredPlugin[] {
    const ids = this.byTag.get(tag);
    if (!ids) return [];
    return [...ids].map((id) => this.plugins.get(id)!).filter(Boolean);
  }

  findByPermission(permission: string): RegisteredPlugin[] {
    const ids = this.byPermission.get(permission);
    if (!ids) return [];
    return [...ids].map((id) => this.plugins.get(id)!).filter(Boolean);
  }

  search(query: {
    text?: string;
    tags?: string[];
    capabilities?: string[];
    license?: string;
  }): PluginSearchResult[] {
    const results: PluginSearchResult[] = [];

    for (const plugin of this.plugins.values()) {
      let score = 0;
      const matchedFields: string[] = [];

      // Text search
      if (query.text) {
        const text = query.text.toLowerCase();
        if (plugin.name.toLowerCase().includes(text)) { score += 10; matchedFields.push('name'); }
        if (plugin.description.toLowerCase().includes(text)) { score += 5; matchedFields.push('description'); }
        if (plugin.pluginId.toLowerCase().includes(text)) { score += 5; matchedFields.push('id'); }
        for (const tag of plugin.tags) {
          if (tag.toLowerCase().includes(text)) { score += 2; matchedFields.push('tags'); break; }
        }
      }

      // Tag filter
      if (query.tags && query.tags.length > 0) {
        const matchCount = query.tags.filter((t) => plugin.tags.includes(t)).length;
        score += matchCount * 3;
        if (matchCount > 0) matchedFields.push('tags');
      }

      // Capability filter
      if (query.capabilities && query.capabilities.length > 0) {
        const matchCount = query.capabilities.filter((c) => plugin.capabilities.includes(c)).length;
        score += matchCount * 4;
        if (matchCount > 0) matchedFields.push('capabilities');
      }

      // License filter
      if (query.license) {
        if (plugin.license === query.license || query.license === 'permissive' && !plugin.license.startsWith('GPL') && !plugin.license.startsWith('AGPL') && !plugin.license.startsWith('SSPL')) {
          score += 3;
          matchedFields.push('license');
        }
      }

      if (score > 0) {
        results.push({ plugin, matchScore: score, matchedFields });
      }
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  // ─── Version management ────────────────────────────────────────────────────

  checkVersionCompatibility(pluginId: string, aetherVersion: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    if (plugin.minAetherVersion && compareVersion(aetherVersion, plugin.minAetherVersion) < 0) {
      return false;
    }
    if (plugin.maxAetherVersion && compareVersion(aetherVersion, plugin.maxAetherVersion) > 0) {
      return false;
    }
    return true;
  }

  resolveVersions(pluginIds: string[]): VersionConflict[] {
    const conflicts: VersionConflict[] = [];
    const seenDeps = new Map<string, string>(); // dep name -> resolved version

    for (const id of pluginIds) {
      const plugin = this.plugins.get(id);
      if (!plugin) continue;

      for (const [depName, versionRange] of Object.entries(plugin.dependencies)) {
        const existing = seenDeps.get(depName);
        if (existing && existing !== versionRange) {
          const direction = compareVersion(versionRange, existing) > 0 ? 'upgrade' : 'downgrade';
          conflicts.push({
            pluginId: depName,
            required: versionRange,
            available: existing,
            resolution: direction,
          });
        }
        seenDeps.set(depName, versionRange);
      }
    }

    return conflicts;
  }

  // ─── Dependency resolution ─────────────────────────────────────────────────

  buildDependencyGraph(pluginIds: string[]): PluginDependencyGraph {
    const nodes: string[] = [];
    const edges: PluginDependencyGraph['edges'] = [];
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      visited.add(id);
      stack.push(id);

      const plugin = this.plugins.get(id);
      if (plugin) {
        nodes.push(id);
        for (const [depName, constraint] of Object.entries(plugin.dependencies)) {
          // depName must be installed before id: edge depName -> id
          edges.push({ from: depName, to: id, constraint });
          visit(depName);
        }
      }

      stack.pop();
    };

    for (const id of pluginIds) {
      visit(id);
    }

    // Detect cycles (simple DFS)
    const cycles: string[][] = [];
    const visitedCycle = new Set<string>();
    const recStack: string[] = [];

    const detectCycles = (id: string): void => {
      if (visitedCycle.has(id)) return;
      visitedCycle.add(id);
      recStack.push(id);

      const plugin = this.plugins.get(id);
      if (plugin) {
        for (const depName of Object.keys(plugin.dependencies)) {
          if (recStack.includes(depName)) {
            const cycleStart = recStack.indexOf(depName);
            cycles.push([...recStack.slice(cycleStart), depName]);
          } else {
            detectCycles(depName);
          }
        }
      }

      recStack.pop();
    }

    for (const id of nodes) {
      detectCycles(id);
    }

    // Topological sort (Kahn's algorithm)
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const n of nodes) {
      inDegree.set(n, 0);
      adj.set(n, []);
    }

    for (const edge of edges) {
      // edge: from=depName, to=id  (depName must come before id)
      // adj maps node -> nodes that depend on it (dependents)
      const dependents = adj.get(edge.from) ?? [];
      dependents.push(edge.to);
      adj.set(edge.from, dependents);
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    }

    const queue: string[] = [];
    for (const [node, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(node);
    }

    const installOrder: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      installOrder.push(node);
      for (const neighbor of adj.get(node) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    return { nodes, edges, cycles, installOrder };
  }

  // ─── Usage tracking ────────────────────────────────────────────────────────

  recordUsage(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.usageCount += 1;
      plugin.lastUpdatedAt = new Date().toISOString();
    }
  }

  setEnabled(pluginId: string, enabled: boolean): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    plugin.enabled = enabled;
    plugin.lastUpdatedAt = new Date().toISOString();
    return true;
  }
}
