/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Swarm Team Hierarchy
 *
 * Manager/worker patterns, delegation chains, escalation paths, and
 * team composition for hierarchical agent organizations.
 *
 * Architectural inspiration: AutoGen's nested agent group chat (archived reference).
 * AETHER-native implementation with explicit hierarchy and delegation.
 *
 * Usage:
 *   import {
 *     createTeamHierarchy,
 *     type TeamHierarchy,
 *     type TeamNode,
 *     type DelegationChain,
 *     type EscalationPath,
 *   } from './core/swarm/teamHierarchy';
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AgentRole = 'manager' | 'worker' | 'coordinator' | 'specialist';

export interface TeamNode {
  /** Unique agent id */
  agentId: string;
  /** Agent name */
  name: string;
  /** Role in the hierarchy */
  role: AgentRole;
  /** Parent agent id (undefined = root) */
  parentId?: string;
  /** Child agent ids */
  childIds: string[];
  /** Capabilities this agent provides */
  capabilities: string[];
  /** Maximum number of direct reports */
  maxDirectReports: number;
  /** Whether this agent can delegate */
  canDelegate: boolean;
  /** Escalation path (ordered agent ids, starting with this agent) */
  escalationPath: string[];
  /** Status */
  status: 'active' | 'busy' | 'offline';
}

export interface DelegationRequest {
  /** Request id */
  requestId: string;
  /** From agent id */
  fromAgentId: string;
  /** Task description */
  taskDescription: string;
  /** Required capabilities */
  requiredCapabilities: string[];
  /** Priority */
  priority: number;
  /** Max delegation depth */
  maxDepth: number;
  /** Current depth in delegation chain */
  currentDepth: number;
}

export interface DelegationResult {
  /** Whether delegation was successful */
  delegated: boolean;
  /** Agent id that accepted the delegation */
  delegatedTo?: string;
  /** Delegation chain used */
  chain: string[];
  /** Reason if delegation failed */
  reason?: string;
}

export interface TeamHierarchy {
  /** Add a team node */
  addNode(node: TeamNode): void;

  /** Remove a node */
  removeNode(agentId: string): boolean;

  /** Get a node */
  getNode(agentId: string): TeamNode | undefined;

  /** Get direct reports of an agent */
  getDirectReports(agentId: string): TeamNode[];

  /** Get the full subtree under an agent */
  getSubtree(agentId: string): TeamNode[];

  /** Get the manager of an agent */
  getManager(agentId: string): TeamNode | undefined;

  /** Delegate a task from one agent to another */
  delegate(request: DelegationRequest): DelegationResult;

  /** Find the best agent for a set of capabilities */
  findBestAgent(requiredCapabilities: string[]): TeamNode | undefined;

  /** Get the escalation path for an agent */
  getEscalationPath(agentId: string): string[];

  /** Escalate a task up the hierarchy */
  escalate(agentId: string, reason: string): string | undefined;

  /** Get all active managers */
  getActiveManagers(): TeamNode[];

  /** Get all leaf workers */
  getLeafWorkers(): TeamNode[];

  /** Check if adding a direct report would exceed capacity */
  canAddDirectReport(managerId: string): boolean;

  /** Validate the hierarchy (no cycles, valid parents) */
  validate(): { valid: boolean; errors: string[] };

  /** Get all nodes */
  getAllNodes(): TeamNode[];

  /** Clear all nodes */
  clear(): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Main implementation
// ---------------------------------------------------------------------------

export function createTeamHierarchy(): TeamHierarchy {
  const nodes = new Map<string, TeamNode>();

  function hasCycle(startId: string, targetId: string, visited = new Set<string>()): boolean {
    // Note: startId === targetId check is handled by the caller (addNode)
    // which checks parentId !== agentId before calling this function.
    // Here we only check if targetId is reachable from startId through descendants.
    if (visited.has(startId)) return false;
    visited.add(startId);

    const node = nodes.get(startId);
    if (!node) return false;

    for (const childId of node.childIds) {
      if (childId === targetId) return true;
      if (hasCycle(childId, targetId, visited)) return true;
    }
    return false;
  }

  function collectSubtree(agentId: string, result: TeamNode[] = []): TeamNode[] {
    const node = nodes.get(agentId);
    if (!node) return result;
    result.push(node);
    for (const childId of node.childIds) {
      collectSubtree(childId, result);
    }
    return result;
  }

  function findDelegationTarget(
    capabilities: string[],
    excludeIds: Set<string>,
    depth: number
  ): TeamNode | undefined {
    let best: TeamNode | undefined;
    let bestMatchCount = 0;

    for (const [, node] of nodes) {
      if (excludeIds.has(node.agentId)) continue;
      if (node.status === 'offline') continue;

      const matchCount = capabilities.filter((c) => node.capabilities.includes(c)).length;
      if (matchCount > bestMatchCount) {
        bestMatchCount = matchCount;
        best = node;
      }
    }

    return bestMatchCount > 0 ? best : undefined;
  }

  return {
    addNode(node: TeamNode): void {
      if (nodes.has(node.agentId)) {
        throw new Error(`Agent ${node.agentId} already exists in hierarchy`);
      }

      // Validate parent exists
      if (node.parentId && !nodes.has(node.parentId)) {
        throw new Error(`Parent agent ${node.parentId} does not exist`);
      }

      // Check for cycles
      if (node.parentId && hasCycle(node.parentId, node.agentId)) {
        throw new Error(`Adding ${node.agentId} would create a cycle`);
      }

      // Update parent's child list
      if (node.parentId) {
        const parent = nodes.get(node.parentId)!;
        if (!parent.childIds.includes(node.agentId)) {
          parent.childIds.push(node.agentId);
        }
      }

      nodes.set(node.agentId, node);
    },

    removeNode(agentId: string): boolean {
      const node = nodes.get(agentId);
      if (!node) return false;

      // Remove from parent's child list
      if (node.parentId) {
        const parent = nodes.get(node.parentId);
        if (parent) {
          const idx = parent.childIds.indexOf(agentId);
          if (idx !== -1) parent.childIds.splice(idx, 1);
        }
      }

      // Remove all children (they become orphaned)
      for (const childId of [...node.childIds]) {
        nodes.delete(childId);
      }

      return nodes.delete(agentId);
    },

    getNode(agentId: string): TeamNode | undefined {
      return nodes.get(agentId);
    },

    getDirectReports(agentId: string): TeamNode[] {
      const node = nodes.get(agentId);
      if (!node) return [];
      return node.childIds.map((id) => nodes.get(id)).filter((n): n is TeamNode => n !== undefined && n.status !== 'offline');
    },

    getSubtree(agentId: string): TeamNode[] {
      return collectSubtree(agentId).filter((n) => n.status !== 'offline');
    },

    getManager(agentId: string): TeamNode | undefined {
      const node = nodes.get(agentId);
      if (!node?.parentId) return undefined;
      return nodes.get(node.parentId);
    },

    delegate(request: DelegationRequest): DelegationResult {
      const chain: string[] = [request.fromAgentId];

      // Check if the source agent can delegate
      const sourceNode = nodes.get(request.fromAgentId);
      if (!sourceNode) {
        return { delegated: false, chain, reason: `Source agent ${request.fromAgentId} not found` };
      }

      if (!sourceNode.canDelegate || request.currentDepth >= request.maxDepth) {
        return { delegated: false, chain, reason: 'Delegation depth exceeded or source cannot delegate' };
      }

      // Find the best delegatee
      const excludeIds = new Set([request.fromAgentId, ...chain]);
      const delegatee = findDelegationTarget(request.requiredCapabilities, excludeIds, request.currentDepth + 1);

      if (!delegatee) {
        return { delegated: false, chain, reason: 'No suitable agent found for delegation' };
      }

      chain.push(delegatee.agentId);

      return {
        delegated: true,
        delegatedTo: delegatee.agentId,
        chain,
      };
    },

    findBestAgent(requiredCapabilities: string[]): TeamNode | undefined {
      if (requiredCapabilities.length === 0) return undefined;
      return findDelegationTarget(requiredCapabilities, new Set(), 0);
    },

    getEscalationPath(agentId: string): string[] {
      const path: string[] = [];
      let currentId: string | undefined = agentId;

      while (currentId) {
        path.push(currentId);
        const node = nodes.get(currentId);
        if (!node?.parentId) break;
        currentId = node.parentId;
      }

      return path;
    },

    escalate(agentId: string, _reason: string): string | undefined {
      const path = this.getEscalationPath(agentId);
      if (path.length < 2) return undefined;
      return path[1]; // Return the parent (next level up)
    },

    getActiveManagers(): TeamNode[] {
      return Array.from(nodes.values()).filter((n) => n.role === 'manager' && n.status === 'active');
    },

    getLeafWorkers(): TeamNode[] {
      return Array.from(nodes.values()).filter((n) => n.role === 'worker' && n.childIds.length === 0 && n.status === 'active');
    },

    canAddDirectReport(managerId: string): boolean {
      const node = nodes.get(managerId);
      if (!node) return false;
      return node.childIds.length < node.maxDirectReports;
    },

    validate(): { valid: boolean; errors: string[] } {
      const errors: string[] = [];

      // Check all parentIds reference existing nodes
      for (const [, node] of nodes) {
        if (node.parentId && !nodes.has(node.parentId)) {
          errors.push(`Node ${node.agentId} has non-existent parent ${node.parentId}`);
        }
      }

      // Check for cycles
      for (const [id] of nodes) {
        if (hasCycle(id, id)) {
          errors.push(`Cycle detected involving node ${id}`);
        }
      }

      // Check manager capacity
      for (const [, node] of nodes) {
        if (node.role === 'manager' && node.childIds.length > node.maxDirectReports) {
          errors.push(`Manager ${node.agentId} exceeds max direct reports (${node.childIds.length}/${node.maxDirectReports})`);
        }
      }

      return { valid: errors.length === 0, errors };
    },

    getAllNodes(): TeamNode[] {
      return Array.from(nodes.values());
    },

    clear(): void {
      nodes.clear();
    },
  };
}

// ---------------------------------------------------------------------------
// Team composition helpers
// ---------------------------------------------------------------------------

export function composeTeam(
  members: { agentId: string; role: AgentRole; capabilities: string[] }[],
  opts: { maxSpan?: number } = {}
): TeamNode[] {
  const maxSpan = opts.maxSpan ?? 5;
  const team: TeamNode[] = [];
  const managers: TeamNode[] = [];
  const workers: TeamNode[] = [];

  for (const member of members) {
    const node: TeamNode = {
      agentId: member.agentId,
      name: member.agentId,
      role: member.role,
      childIds: [],
      capabilities: member.capabilities,
      maxDirectReports: maxSpan,
      canDelegate: member.role === 'manager',
      escalationPath: [],
      status: 'active',
    };
    team.push(node);
    if (member.role === 'manager' || member.role === 'coordinator') {
      managers.push(node);
    } else {
      workers.push(node);
    }
  }

  // Assign workers to managers in round-robin
  for (const manager of managers) {
    manager.maxDirectReports = maxSpan;
  }

  for (let i = 0; i < workers.length; i++) {
    const manager = managers[i % managers.length]!;
    if (manager.childIds.length < manager.maxDirectReports) {
      workers[i]!.parentId = manager.agentId;
      manager.childIds.push(workers[i]!.agentId);
    }
  }

  return team;
}
