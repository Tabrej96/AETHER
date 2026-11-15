/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Workflow Registry
 * (src/core/workflow/workflowRegistry.ts) · Created by Tabrej
 *
 * Central registry for AETHER workflows. Supports registration, discovery
 * by trigger type / domain / name, version management, and health checking.
 *
 * Integrates with AETHER's security engine for trust-boundary validation
 * of workflow definitions.
 */

import { randomUUID } from 'node:crypto';
import type { Workflow, RegisteredWorkflow, WorkflowTrigger } from './workflowEngine';

const HASH_ALGO = 'sha256';

/** Simple rolling hash of the workflow definition for change detection. */
function definitionHash(wf: Workflow): string {
  const canonical = JSON.stringify({
    id: wf.id,
    version: wf.version,
    steps: wf.steps.map((s) => ({
      id: s.id,
      type: s.type,
      execution: s.execution,
      dependsOn: s.dependsOn,
      condition: s.condition,
      onFailure: s.onFailure,
      timeoutMs: s.timeoutMs,
    })),
    triggers: wf.triggers.map((t) => t.type),
  });
  // Use SubtleCrypto when available, fall back to a deterministic string hash.
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    return crypto.subtle.digestSync
      ? crypto.subtle.digestSync(HASH_ALGO, encoder.encode(canonical)).toString()
      : simpleHash(canonical);
  }
  return simpleHash(canonical);
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return `hash-${Math.abs(h).toString(16)}`;
}

export interface RegistryOptions {
  /** Called when a workflow is registered for trust-boundary validation. */
  onRegister?: (workflow: Workflow) => void;
}

export class WorkflowRegistry {
  private workflows: Map<string, RegisteredWorkflow> = new Map();
  private byTrigger: Map<string, Set<string>> = new Map();   // triggerType -> workflowIds
  private byDomain: Map<string, Set<string>> = new Map();    // domain -> workflowIds
  private byName: Map<string, string> = new Map();           // name -> workflowId
  private options: RegistryOptions;

  constructor(options: RegistryOptions = {}) {
    this.options = options;
  }

  /** Register a workflow. Throws if id or name already exists with a different definition. */
  register(wf: Workflow): RegisteredWorkflow {
    if (this.workflows.has(wf.id)) {
      const existing = this.workflows.get(wf.id)!;
      if (existing.definitionHash === definitionHash(wf)) {
        // Identical definition re-registered — no-op, return existing.
        return existing;
      }
      throw new Error(`Workflow id "${wf.id}" is already registered with a different definition`);
    }
    if (this.byName.has(wf.name)) {
      throw new Error(`Workflow name "${wf.name}" is already registered`);
    }

    const registered: RegisteredWorkflow = {
      workflow: wf,
      registeredAt: new Date(),
      health: 'healthy',
      definitionHash: definitionHash(wf),
      enabled: true,
    };

    this.workflows.set(wf.id, registered);
    this.byName.set(wf.name, wf.id);

    // Index by trigger types.
    for (const trigger of wf.triggers) {
      const key = trigger.type;
      if (!this.byTrigger.has(key)) this.byTrigger.set(key, new Set());
      this.byTrigger.get(key)!.add(wf.id);
    }

    // Index by domain.
    const domain = wf.metadata.domain ?? '__default';
    if (!this.byDomain.has(domain)) this.byDomain.set(domain, new Set());
    this.byDomain.get(domain)!.add(wf.id);

    this.options.onRegister?.(wf);

    return registered;
  }

  /** Unregister a workflow by id. */
  unregister(workflowId: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;

    this.workflows.delete(workflowId);
    this.byName.delete(wf.workflow.name);

    for (const set of this.byTrigger.values()) set.delete(workflowId);
    const domain = wf.workflow.metadata.domain ?? '__default';
    this.byDomain.get(domain)?.delete(workflowId);

    return true;
  }

  /** Retrieve a registered workflow by id. */
  get(workflowId: string): RegisteredWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /** Find by exact name. */
  getByName(name: string): Workflow | undefined {
    const id = this.byName.get(name);
    return id ? this.workflows.get(id)?.workflow : undefined;
  }

  /** Discover workflows by trigger type. */
  findByTrigger(triggerType: WorkflowTrigger['type']): Workflow[] {
    const ids = this.byTrigger.get(triggerType);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.workflows.get(id))
      .filter((r): r is RegisteredWorkflow => r !== undefined && r.enabled)
      .map((r) => r.workflow);
  }

  /** Discover workflows by domain. */
  findByDomain(domain: string): Workflow[] {
    const ids = this.byDomain.get(domain);
    if (!ids) return [];
    return Array.from(ids)
      .map((id) => this.workflows.get(id))
      .filter((r): r is RegisteredWorkflow => r !== undefined && r.enabled)
      .map((r) => r.workflow);
  }

  /** List all registered workflows. */
  listAll(): Workflow[] {
    return Array.from(this.workflows.values())
      .filter((r) => r.enabled)
      .map((r) => r.workflow);
  }

  /** List all workflows including disabled ones. */
  listAllIncludingDisabled(): RegisteredWorkflow[] {
    return Array.from(this.workflows.values());
  }

  /** Enable or disable a workflow. */
  setEnabled(workflowId: string, enabled: boolean): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    wf.enabled = enabled;
    return true;
  }

  /** Update the health of a workflow. */
  updateHealth(workflowId: string, health: RegisteredWorkflow['health'], reason?: string): boolean {
    const wf = this.workflows.get(workflowId);
    if (!wf) return false;
    wf.health = health;
    wf.healthReason = reason;
    return true;
  }

  /** Check health of all registered workflows.
   *  A workflow is degraded if its definition hash doesn't match the registered hash
   *  (external modification detected). */
  healthCheck(): Record<string, RegisteredWorkflow['health']> {
    const report: Record<string, RegisteredWorkflow['health']> = {};
    for (const [id, wf] of this.workflows) {
      const currentHash = definitionHash(wf.workflow);
      if (currentHash !== wf.definitionHash) {
        wf.health = 'degraded';
        wf.healthReason = 'Definition hash mismatch — workflow may have been modified externally';
        report[id] = 'degraded';
      } else {
        wf.health = 'healthy';
        wf.healthReason = undefined;
        report[id] = 'healthy';
      }
    }
    return report;
  }

  /** Get total count of registered workflows. */
  get count(): number {
    return this.workflows.size;
  }
}
