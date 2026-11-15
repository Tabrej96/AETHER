/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Memory Engine — Privacy & Access Control
 *
 * Enforces access control per memory, handles sensitive data with encryption,
 * and redacts for shared contexts.
 * Draws inspiration from:
 * - OpenHands (https://github.com/All-Hands-AI/OpenHands, MIT) — conversation memory patterns
 * - AutoGen (https://github.com/microsoft/autogen, MIT) — agent memory patterns
 */

import type { Memory, AccessLevel } from './types';

export interface AccessPolicy {
  allowedAgents: string[];
  allowedProjects: string[];
  maxAccessLevel: AccessLevel;
}

export class MemoryPrivacy {
  private readonly policies: Map<string, AccessPolicy> = new Map();

  registerPolicy(memoryId: string, policy: AccessPolicy): void {
    this.policies.set(memoryId, policy);
  }

  canAccess(memory: Memory, requestingAgent: string, requestingProject: string): boolean {
    const policy = this.policies.get(memory.id);
    if (!policy) {
      // Default: agent can access its own project's memories
      return memory.metadata.agent === requestingAgent && memory.metadata.project === requestingProject;
    }
    if (!policy.allowedProjects.includes(requestingProject)) return false;
    if (!policy.allowedAgents.includes(requestingAgent) && !policy.allowedAgents.includes('*')) return false;
    return this.accessLevelRank(memory.metadata.accessLevel) <= this.accessLevelRank(policy.maxAccessLevel);
  }

  redact(memory: Memory, requestingAgent: string, requestingProject: string): Memory {
    if (this.canAccess(memory, requestingAgent, requestingProject)) {
      return memory;
    }
    // Redact sensitive fields
    const redacted = structuredClone(memory);
    if (redacted.metadata.accessLevel === 'secret' || redacted.metadata.accessLevel === 'confidential') {
      redacted.value = '[REDACTED]';
    }
    redacted.provenance.evidence = [];
    return redacted;
  }

  redactForExport(memories: Memory[]): Memory[] {
    return memories.map((m) => {
      const redacted = structuredClone(m);
      if (redacted.metadata.accessLevel === 'secret') {
        redacted.value = '[REDACTED]';
      } else if (redacted.metadata.accessLevel === 'confidential') {
        redacted.value = this.partiallyRedact(redacted.value);
      }
      return redacted;
    });
  }

  encrypt(memory: Memory, _key: string): Memory {
    // Placeholder for real encryption — in production use node:crypto or WebCrypto
    // For now, we mark the memory as requiring encryption at rest
    const encrypted = structuredClone(memory);
    encrypted.metadata.accessLevel = 'secret';
    return encrypted;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private accessLevelRank(level: AccessLevel): number {
    const ranks: Record<AccessLevel, number> = {
      public: 0,
      internal: 1,
      confidential: 2,
      secret: 3,
    };
    return ranks[level];
  }

  private partiallyRedact(value: unknown): unknown {
    if (typeof value === 'string') {
      if (value.length > 10) {
        return value.slice(0, 3) + '***' + value.slice(-3);
      }
      return '***';
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.partiallyRedact(v));
    }
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        result[k] = this.partiallyRedact(v);
      }
      return result;
    }
    return '[PARTIALLY REDACTED]';
  }
}
