/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Domain Skill Composer
 * (src/core/skills/domainSkillComposer.ts)
 *
 * Composes skill chains based on domain patterns, learned instincts,
 * and cross-domain capability mapping. Builds on the base SkillComposer
 * with domain intelligence from ECC-inspired decomposition patterns.
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain decomposition and
 *   skill affinity patterns inspired the domain-aware composition logic.
 *
 *   Superpowers (https://github.com/obra/superpowers) — instinct-based
 *   skill chaining and pattern-reuse concepts inspired the InstinctComposer.
 */

import type {
  Skill, SkillQuery, Workflow, WorkflowStep, DataFlow,
  ComposeResult, ComposeError, ExecutionPlan,
} from './skillEngine';
import { SkillComposer } from './skillComposer';
import { SkillRegistry } from './skillRegistry';
import { SkillLearning, RecommendedChain, InstinctMatchContext } from './skillLearning';

// ---------------------------------------------------------------------------
// Domain skill composer types
// ---------------------------------------------------------------------------

/** A domain-specific skill composition request. */
export interface DomainComposeRequest {
  /** Target domain(s) for the composition */
  domains: string[];
  /** Desired capability or intent hint */
  capability?: string;
  /** Maximum number of steps in the composed chain */
  maxSteps?: number;
  /** Whether to prefer learned instincts over pattern-based chains */
  preferInstincts?: boolean;
}

/** A composed skill chain with domain metadata. */
export interface DomainComposeResult extends ComposeResult {
  domain: string[];
  source: 'instinct' | 'pattern' | 'combination' | 'manual';
  confidence: number;
}

/** Pre-built domain skill templates. */
export interface DomainSkillTemplate {
  id: string;
  name: string;
  description: string;
  domain: string[];
  /** Ordered list of skill IDs that form this template */
  skillIds: string[];
  /** Which inputs the template accepts */
  inputs: { name: string; type: string; required: boolean }[];
  /** Which outputs the template produces */
  outputs: { name: string; type: string; description: string }[];
  /** Conditions under which this template is appropriate */
  conditions: { field: string; operator: string; value: unknown }[];
}

// ---------------------------------------------------------------------------
// Domain-specific skill templates (ECC-inspired)
// ---------------------------------------------------------------------------

export const DOMAIN_SKILL_TEMPLATES: DomainSkillTemplate[] = [
  // Coffee Shop
  {
    id: 'cofi-order-fulfillment',
    name: 'Coffee Shop Order Fulfillment',
    description: 'Complete order lifecycle: take order, process payment, fulfill',
    domain: ['coffeeShop'],
    skillIds: ['cofi-take-order', 'cofi-process-payment', 'cofi-fulfill-order'],
    inputs: [
      { name: 'customerId', type: 'string', required: true },
      { name: 'orderItems', type: 'array', required: true },
    ],
    outputs: [
      { name: 'orderId', type: 'string', description: 'Created order ID' },
      { name: 'receipt', type: 'object', description: 'Order receipt' },
    ],
    conditions: [
      { field: 'orderItems', operator: 'greater_than', value: 0 },
    ],
  },
  {
    id: 'cofi-inventory-management',
    name: 'Coffee Shop Inventory Management',
    description: 'Check stock, reorder low items, update catalog',
    domain: ['coffeeShop'],
    skillIds: ['cofi-check-stock', 'cofi-reorder-low', 'cofi-update-catalog'],
    inputs: [
      { name: 'inventoryThreshold', type: 'number', required: false },
    ],
    outputs: [
      { name: 'reorderList', type: 'array', description: 'Items needing reorder' },
    ],
    conditions: [],
  },
  // E-Commerce
  {
    id: 'ecom-purchase-flow',
    name: 'E-Commerce Purchase Flow',
    description: 'Complete purchase: cart -> checkout -> payment -> confirmation',
    domain: ['ecommerce'],
    skillIds: ['ecom-validate-cart', 'ecom-checkout', 'ecom-process-payment', 'ecom-send-confirmation'],
    inputs: [
      { name: 'cartId', type: 'string', required: true },
      { name: 'customerId', type: 'string', required: true },
    ],
    outputs: [
      { name: 'orderId', type: 'string', description: 'Created order' },
      { name: 'confirmationCode', type: 'string', description: 'Confirmation code' },
    ],
    conditions: [
      { field: 'cartItems', operator: 'greater_than', value: 0 },
    ],
  },
  {
    id: 'ecom-inventory-sync',
    name: 'E-Commerce Inventory Sync',
    description: 'Sync inventory across channels after sale',
    domain: ['ecommerce'],
    skillIds: ['ecom-update-stock', 'ecom-sync-channels', 'ecom-notify-low-stock'],
    inputs: [
      { name: 'orderId', type: 'string', required: true },
    ],
    outputs: [
      { name: 'syncStatus', type: 'string', description: 'Sync result' },
    ],
    conditions: [],
  },
  // SaaS
  {
    id: 'saas-user-onboarding',
    name: 'SaaS User Onboarding',
    description: 'New user: create account, assign plan, send welcome',
    domain: ['saas'],
    skillIds: ['saas-create-account', 'saas-assign-plan', 'saas-send-welcome', 'saas-provision-resources'],
    inputs: [
      { name: 'email', type: 'string', required: true },
      { name: 'planId', type: 'string', required: true },
      { name: 'teamId', type: 'string', required: true },
    ],
    outputs: [
      { name: 'userId', type: 'string', description: 'Created user ID' },
      { name: 'workspaceUrl', type: 'string', description: 'Workspace URL' },
    ],
    conditions: [],
  },
  {
    id: 'saas-billing-cycle',
    name: 'SaaS Billing Cycle',
    description: 'Process monthly billing: usage metering, invoicing, payment',
    domain: ['saas'],
    skillIds: ['saas-meter-usage', 'saas-generate-invoice', 'saas-process-payment', 'saas-send-receipt'],
    inputs: [
      { name: 'accountId', type: 'string', required: true },
      { name: 'billingPeriod', type: 'string', required: true },
    ],
    outputs: [
      { name: 'invoiceId', type: 'string', description: 'Generated invoice' },
      { name: 'paymentStatus', type: 'string', description: 'Payment result' },
    ],
    conditions: [],
  },
  // Booking
  {
    id: 'book-reservation-flow',
    name: 'Booking Reservation Flow',
    description: 'Check availability, create reservation, send confirmation',
    domain: ['booking'],
    skillIds: ['book-check-availability', 'book-create-reservation', 'book-send-confirmation'],
    inputs: [
      { name: 'date', type: 'string', required: true },
      { name: 'time', type: 'string', required: true },
      { name: 'partySize', type: 'number', required: true },
    ],
    outputs: [
      { name: 'reservationId', type: 'string', description: 'Reservation ID' },
      { name: 'confirmationCode', type: 'string', description: 'Confirmation code' },
    ],
    conditions: [
      { field: 'partySize', operator: 'greater_than', value: 0 },
    ],
  },
  // Logistics
  {
    id: 'log-shipment-flow',
    name: 'Logistics Shipment Flow',
    description: 'Create shipment, assign carrier, generate label, dispatch',
    domain: ['logistics'],
    skillIds: ['log-create-shipment', 'log-assign-carrier', 'log-generate-label', 'log-dispatch'],
    inputs: [
      { name: 'packageId', type: 'string', required: true },
      { name: 'destination', type: 'string', required: true },
    ],
    outputs: [
      { name: 'trackingNumber', type: 'string', description: 'Tracking number' },
      { name: 'labelUrl', type: 'string', description: 'Shipping label URL' },
    ],
    conditions: [],
  },
];

/**
 * Get templates for a specific domain.
 */
export function getTemplatesForDomain(domain: string): DomainSkillTemplate[] {
  return DOMAIN_SKILL_TEMPLATES.filter(t => t.domain.includes(domain));
}

/**
 * Get all templates matching any of the given domains.
 */
export function getTemplatesForDomains(domains: string[]): DomainSkillTemplate[] {
  const domainSet = new Set(domains);
  return DOMAIN_SKILL_TEMPLATES.filter(t => t.domain.some(d => domainSet.has(d)));
}

// ---------------------------------------------------------------------------
// Domain Skill Composer
// ---------------------------------------------------------------------------

export class DomainSkillComposer {
  private baseComposer: SkillComposer;
  private learning?: SkillLearning;

  constructor(private registry: SkillRegistry, learning?: SkillLearning) {
    this.baseComposer = new SkillComposer(registry);
    this.learning = learning;
  }

  /**
   * Set the learning engine for instinct-based composition.
   */
  setLearning(learning: SkillLearning): void {
    this.learning = learning;
  }

  /**
   * Compose a skill chain for a specific domain, using:
   * 1. Domain templates (highest priority)
   * 2. Learned instincts (if available)
   * 3. Pattern-based chains
   * 4. Combination scoring (fallback)
   */
  composeForDomain(request: DomainComposeRequest): DomainComposeResult[] {
    const results: DomainComposeResult[] = [];
    const preferInstincts = request.preferInstincts ?? false;
    const maxSteps = request.maxSteps ?? 6;

    // 1. Try domain templates first
    const templates = getTemplatesForDomains(request.domains);
    for (const template of templates) {
      if (template.skillIds.length > maxSteps) continue;
      const composed = this.baseComposer.compose(
        template.skillIds,
        template.id,
        template.description
      );
      results.push({
        ...composed,
        domain: template.domain,
        source: 'manual',
        confidence: composed.valid ? 0.9 : 0,
      });
    }

    // 2. Try learned instincts
    if (this.learning) {
      const context: InstinctMatchContext = {
        domain: request.domains,
        availableSkillIds: this.registry.listAll().map(s => s.id),
        inputHints: request.capability ? { capability: request.capability } : undefined,
      };
      const instinctResults = this.learning.matchInstincts(context);
      for (const instinct of instinctResults.slice(0, 5)) {
        if (instinct.skillIds.length > maxSteps) continue;
        const composed = this.baseComposer.compose(
          instinct.skillIds,
          `instinct-${instinct.skillIds.join('-')}`,
          `Instinct: ${instinct.reason}`
        );
        if (composed.valid) {
          results.push({
            ...composed,
            domain: request.domains,
            source: 'instinct',
            confidence: instinct.confidence,
          });
        }
      }
    }

    // 3. Try pattern-based chains
    if (this.learning && !preferInstincts) {
      const patterns = this.learning.getPatterns();
      for (const pattern of patterns) {
        if (!pattern.domain.some(d => request.domains.includes(d))) continue;
        if (pattern.skillIds.length > maxSteps) continue;
        const composed = this.baseComposer.compose(
          pattern.skillIds,
          `pattern-${pattern.id}`,
          `Pattern: ${pattern.id} (${(pattern.successRate * 100).toFixed(0)}% success)`
        );
        if (composed.valid) {
          results.push({
            ...composed,
            domain: pattern.domain,
            source: 'pattern',
            confidence: pattern.confidence * pattern.successRate,
          });
        }
      }
    }

    // 4. Fall back to combination scoring
    for (const domain of request.domains) {
      const domainSkills = this.registry.findByDomain(domain);
      if (domainSkills.length < 2) continue;
      const query: SkillQuery = { domain, maxResults: 6 };
      const skills = this.registry.find(query);
      for (let i = 0; i < skills.length; i++) {
        for (let j = i + 1; j < skills.length; j++) {
          const composed = this.baseComposer.compose(
            [skills[i].id, skills[j].id],
            `combo-${domain}-${skills[i].id}-${skills[j].id}`,
            `Combination in ${domain}`
          );
          if (composed.valid) {
            const ma = this.registry.getMetrics(skills[i].id);
            const mb = this.registry.getMetrics(skills[j].id);
            const combinedSuccess = ((ma?.successRate ?? 1) + (mb?.successRate ?? 1)) / 2;
            results.push({
              ...composed,
              domain: [domain],
              source: 'combination',
              confidence: combinedSuccess * 0.7,
            });
          }
        }
      }
    }

    // Deduplicate and sort by confidence
    const seen = new Set<string>();
    const unique = results.filter(r => {
      const key = r.workflow?.id ?? r.suggestions?.map(s => s.skillId).join(',') ?? Math.random().toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => b.confidence - a.confidence);
    return unique;
  }

  /**
   * Compose a skill chain and return a workflow definition.
   */
  composeToWorkflow(request: DomainComposeRequest, name: string, description: string): DomainComposeResult | null {
    const results = this.composeForDomain(request);
    if (results.length === 0 || !results[0].workflow) return null;

    const best = results[0];
    return {
      ...best,
      workflow: best.workflow!,
    };
  }

  /**
   * Find the best skill chain for a given domain capability.
   */
  recommendForCapability(domain: string, capability: string): DomainComposeResult[] {
    const results = this.composeForDomain({
      domains: [domain],
      capability,
      preferInstincts: true,
    });

    // Filter to chains that include at least one skill with the capability
    return results.filter(r => {
      if (!r.workflow) return false;
      return r.workflow.steps.some(step => {
        const skill = this.registry.get(step.skillId);
        return skill?.capabilities.includes(capability);
      });
    });
  }
}
