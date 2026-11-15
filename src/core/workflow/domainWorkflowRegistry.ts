/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Domain Workflow Registry
 * (src/core/workflow/domainWorkflowRegistry.ts)
 *
 * Provides domain-specific workflow templates, adaptive workflow selection,
 * and failure recovery patterns. Integrates with AETHER's workflow engine
 * and condition evaluator for domain-aware execution.
 *
 * Credits:
 *   ECC (https://github.com/affaan-m/ECC) — domain decomposition and
 *   adaptive workflow selection patterns.
 *
 *   Superpowers (https://github.com/obra/superpowers) — failure recovery
 *   and retry pattern concepts inspired the recovery strategies below.
 */

import type {
  Workflow, WorkflowStep, RetryPolicy, ExecutionStatus,
  RegisteredWorkflow, WorkflowTrigger,
} from './workflowEngine';
import { WorkflowRegistry } from './workflowRegistry';

// ---------------------------------------------------------------------------
// Domain workflow types
// ---------------------------------------------------------------------------

/** A domain-specific workflow template. */
export interface DomainWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  domain: string;
  version: string;
  /** Steps defining the workflow */
  steps: DomainWorkflowStep[];
  /** Triggers that activate this workflow */
  triggers: WorkflowTrigger[];
  /** Tags for discovery */
  tags?: string[];
  /** Minimum success rate threshold to use this template */
  minConfidence?: number;
}

/** A workflow step with domain-specific metadata. */
export interface DomainWorkflowStep extends Omit<WorkflowStep, 'retryPolicy'> {
  /** Domain-specific description */
  domainDescription?: string;
  /** Failure recovery strategy for this step */
  recoveryStrategy?: RecoveryStrategy;
}

/** Recovery strategy for a failed workflow step. */
export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'skip' | 'escalate';
  /** Max recovery attempts */
  maxAttempts: number;
  /** Backoff in ms between attempts */
  backoffMs?: number;
  /** Step id to use as fallback (when type === 'fallback') */
  fallbackStepId?: string;
  /** Human role to escalate to (when type === 'escalate') */
  escalateTo?: string;
}

/** Adaptive selection result. */
export interface WorkflowSelectionResult {
  template: DomainWorkflowTemplate;
  confidence: number;
  reason: string;
  /** Adapted steps after context-specific adjustments */
  adaptedSteps: WorkflowStep[];
}

/** Workflow execution metrics per domain. */
export interface DomainWorkflowMetrics {
  domain: string;
  templateId: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  lastExecutedAt: string;
  successRate: number;
}

// ---------------------------------------------------------------------------
// Pre-built domain workflow templates
// ---------------------------------------------------------------------------

/**
 * Create a retry policy for a domain workflow step.
 */
function retryPolicy(maxAttempts: number, backoffMs: number): RetryPolicy {
  return { maxAttempts, backoffMs, strategy: 'exponential', retryableErrors: ['TIMEOUT', 'NETWORK_ERROR'] };
}

/**
 * Create a workflow step with recovery strategy.
 */
function makeStep(
  id: string,
  name: string,
  type: WorkflowStep['type'],
  target: string,
  dependsOn: string[] = [],
  recoveryStrategy?: RecoveryStrategy
): DomainWorkflowStep {
  return {
    id,
    name,
    type,
    execution: { target },
    dependsOn,
    retryPolicy: recoveryStrategy ? retryPolicy(recoveryStrategy.maxAttempts, recoveryStrategy.backoffMs ?? 1000) : undefined,
    timeoutMs: type === 'task' ? 30_000 : 60_000,
    onFailure: recoveryStrategy?.type === 'fallback' ? 'fallback' : recoveryStrategy?.type === 'skip' ? 'skip' : 'retry',
    fallbackStep: recoveryStrategy?.fallbackStepId,
    recoveryStrategy,
    domainDescription: name,
  };
}

/** Coffee Shop: Order Fulfillment */
const COFFEE_SHOP_ORDER_WORKFLOW: DomainWorkflowTemplate = {
  id: 'cofi-order-fulfillment',
  name: 'Coffee Shop Order Fulfillment',
  description: 'Complete order lifecycle: validate order, process payment, prepare, serve',
  domain: 'coffeeShop',
  version: '1.0.0',
  triggers: [{ type: 'intent', config: { intent: 'place_order' } }],
  tags: ['coffeeShop', 'order', 'fulfillment'],
  steps: [
    makeStep('validate-order', 'Validate Order', 'task', 'cofi.validateOrder', [], { type: 'retry', maxAttempts: 3, backoffMs: 500 }),
    makeStep('check-inventory', 'Check Inventory', 'task', 'cofi.checkInventory', ['validate-order'], { type: 'retry', maxAttempts: 2, backoffMs: 1000 }),
    makeStep('process-payment', 'Process Payment', 'task', 'cofi.processPayment', ['check-inventory'], { type: 'fallback', maxAttempts: 2, backoffMs: 2000, fallbackStepId: 'mark-cash' }),
    makeStep('mark-cash', 'Mark as Cash Payment', 'task', 'cofi.markCash', ['process-payment']),
    makeStep('prepare-order', 'Prepare Order', 'task', 'cofi.prepareOrder', ['process-payment'], { type: 'retry', maxAttempts: 3, backoffMs: 3000 }),
    makeStep('serve-order', 'Serve Order', 'task', 'cofi.serveOrder', ['prepare-order'], { type: 'escalate', maxAttempts: 1, escalateTo: 'barista' }),
    makeStep('send-receipt', 'Send Receipt', 'task', 'cofi.sendReceipt', ['serve-order'], { type: 'skip', maxAttempts: 1 }),
  ],
};

/** Coffee Shop: Inventory Management */
const COFFEE_SHOP_INVENTORY_WORKFLOW: DomainWorkflowTemplate = {
  id: 'cofi-inventory-management',
  name: 'Coffee Shop Inventory Management',
  description: 'Check stock levels, reorder low items, update catalog',
  domain: 'coffeeShop',
  version: '1.0.0',
  triggers: [{ type: 'schedule', config: { cron: '0 6 * * *' } }],
  tags: ['coffeeShop', 'inventory'],
  steps: [
    makeStep('scan-stock', 'Scan Stock Levels', 'task', 'cofi.scanStock', [], { type: 'retry', maxAttempts: 2, backoffMs: 1000 }),
    makeStep('detect-low', 'Detect Low Stock', 'task', 'cofi.detectLow', ['scan-stock']),
    makeStep('reorder', 'Auto Reorder', 'task', 'cofi.autoReorder', ['detect-low'], { type: 'skip', maxAttempts: 1 }),
    makeStep('update-catalog', 'Update Catalog', 'task', 'cofi.updateCatalog', ['reorder'], { type: 'retry', maxAttempts: 2, backoffMs: 500 }),
  ],
};

/** E-Commerce: Purchase Flow */
const ECOMMERCE_PURCHASE_WORKFLOW: DomainWorkflowTemplate = {
  id: 'ecom-purchase-flow',
  name: 'E-Commerce Purchase Flow',
  description: 'Complete purchase: validate cart, checkout, process payment, confirm',
  domain: 'ecommerce',
  version: '1.0.0',
  triggers: [{ type: 'intent', config: { intent: 'checkout' } }],
  tags: ['ecommerce', 'purchase', 'checkout'],
  steps: [
    makeStep('validate-cart', 'Validate Cart', 'task', 'ecom.validateCart', [], { type: 'retry', maxAttempts: 2, backoffMs: 500 }),
    makeStep('apply-discounts', 'Apply Discounts', 'task', 'ecom.applyDiscounts', ['validate-cart'], { type: 'skip', maxAttempts: 1 }),
    makeStep('checkout', 'Checkout', 'task', 'ecom.checkout', ['apply-discounts'], { type: 'retry', maxAttempts: 3, backoffMs: 1000 }),
    makeStep('process-payment', 'Process Payment', 'task', 'ecom.processPayment', ['checkout'], { type: 'fallback', maxAttempts: 2, backoffMs: 2000, fallbackStepId: 'alternative-payment' }),
    makeStep('alternative-payment', 'Alternative Payment', 'task', 'ecom.altPayment', ['process-payment']),
    makeStep('create-order', 'Create Order', 'task', 'ecom.createOrder', ['process-payment'], { type: 'retry', maxAttempts: 3, backoffMs: 500 }),
    makeStep('send-confirmation', 'Send Confirmation', 'task', 'ecom.sendConfirmation', ['create-order'], { type: 'skip', maxAttempts: 1 }),
  ],
};

/** E-Commerce: Inventory Sync */
const ECOMMERCE_INVENTORY_SYNC_WORKFLOW: DomainWorkflowTemplate = {
  id: 'ecom-inventory-sync',
  name: 'E-Commerce Inventory Sync',
  description: 'Sync inventory across channels after sale',
  domain: 'ecommerce',
  version: '1.0.0',
  triggers: [{ type: 'event', config: { event: 'order.completed' } }],
  tags: ['ecommerce', 'inventory'],
  steps: [
    makeStep('update-stock', 'Update Stock', 'task', 'ecom.updateStock', [], { type: 'retry', maxAttempts: 3, backoffMs: 1000 }),
    makeStep('sync-channels', 'Sync Channels', 'task', 'ecom.syncChannels', ['update-stock'], { type: 'retry', maxAttempts: 2, backoffMs: 2000 }),
    makeStep('notify-low', 'Notify Low Stock', 'task', 'ecom.notifyLowStock', ['sync-channels'], { type: 'skip', maxAttempts: 1 }),
  ],
};

/** SaaS: User Onboarding */
const SAAS_ONBOARDING_WORKFLOW: DomainWorkflowTemplate = {
  id: 'saas-user-onboarding',
  name: 'SaaS User Onboarding',
  description: 'New user: create account, assign plan, provision resources',
  domain: 'saas',
  version: '1.0.0',
  triggers: [{ type: 'event', config: { event: 'user.signup' } }],
  tags: ['saas', 'onboarding'],
  steps: [
    makeStep('create-account', 'Create Account', 'task', 'saas.createAccount', [], { type: 'retry', maxAttempts: 2, backoffMs: 1000 }),
    makeStep('assign-plan', 'Assign Plan', 'task', 'saas.assignPlan', ['create-account'], { type: 'retry', maxAttempts: 2, backoffMs: 500 }),
    makeStep('provision-workspace', 'Provision Workspace', 'task', 'saas.provisionWorkspace', ['assign-plan'], { type: 'retry', maxAttempts: 3, backoffMs: 2000 }),
    makeStep('send-welcome', 'Send Welcome', 'task', 'saas.sendWelcome', ['provision-workspace'], { type: 'skip', maxAttempts: 1 }),
    makeStep('setup-billing', 'Setup Billing', 'task', 'saas.setupBilling', ['provision-workspace'], { type: 'fallback', maxAttempts: 1, fallbackStepId: 'free-tier' }),
    makeStep('free-tier', 'Apply Free Tier', 'task', 'saas.applyFreeTier', ['setup-billing']),
  ],
};

/** SaaS: Billing Cycle */
const SAAS_BILLING_WORKFLOW: DomainWorkflowTemplate = {
  id: 'saas-billing-cycle',
  name: 'SaaS Billing Cycle',
  description: 'Process billing: meter usage, generate invoice, process payment',
  domain: 'saas',
  version: '1.0.0',
  triggers: [{ type: 'schedule', config: { cron: '0 0 1 * *' } }],
  tags: ['saas', 'billing'],
  steps: [
    makeStep('meter-usage', 'Meter Usage', 'task', 'saas.meterUsage', [], { type: 'retry', maxAttempts: 3, backoffMs: 1000 }),
    makeStep('generate-invoice', 'Generate Invoice', 'task', 'saas.generateInvoice', ['meter-usage'], { type: 'retry', maxAttempts: 2, backoffMs: 500 }),
    makeStep('process-payment', 'Process Payment', 'task', 'saas.processPayment', ['generate-invoice'], { type: 'fallback', maxAttempts: 2, backoffMs: 2000, fallbackStepId: 'mark-overdue' }),
    makeStep('mark-overdue', 'Mark as Overdue', 'task', 'saas.markOverdue', ['process-payment']),
    makeStep('send-receipt', 'Send Receipt', 'task', 'saas.sendReceipt', ['process-payment'], { type: 'skip', maxAttempts: 1 }),
  ],
};

/** Booking: Reservation Flow */
const BOOKING_RESERVATION_WORKFLOW: DomainWorkflowTemplate = {
  id: 'book-reservation-flow',
  name: 'Booking Reservation Flow',
  description: 'Check availability, create reservation, send confirmation',
  domain: 'booking',
  version: '1.0.0',
  triggers: [{ type: 'intent', config: { intent: 'make_reservation' } }],
  tags: ['booking', 'reservation'],
  steps: [
    makeStep('check-availability', 'Check Availability', 'task', 'book.checkAvailability', [], { type: 'retry', maxAttempts: 2, backoffMs: 1000 }),
    makeStep('create-reservation', 'Create Reservation', 'task', 'book.createReservation', ['check-availability'], { type: 'fallback', maxAttempts: 2, backoffMs: 500, fallbackStepId: 'waitlist' }),
    makeStep('waitlist', 'Add to Waitlist', 'task', 'book.addToWaitlist', ['create-reservation']),
    makeStep('send-confirmation', 'Send Confirmation', 'task', 'book.sendConfirmation', ['create-reservation'], { type: 'skip', maxAttempts: 1 }),
    makeStep('send-reminder', 'Send Reminder', 'task', 'book.sendReminder', ['send-confirmation'], { type: 'skip', maxAttempts: 1 }),
  ],
};

/** Logistics: Shipment Flow */
const LOGISTICS_SHIPMENT_WORKFLOW: DomainWorkflowTemplate = {
  id: 'log-shipment-flow',
  name: 'Logistics Shipment Flow',
  description: 'Create shipment, assign carrier, generate label, dispatch',
  domain: 'logistics',
  version: '1.0.0',
  triggers: [{ type: 'intent', config: { intent: 'ship_package' } }],
  tags: ['logistics', 'shipment'],
  steps: [
    makeStep('validate-address', 'Validate Address', 'task', 'log.validateAddress', [], { type: 'retry', maxAttempts: 2, backoffMs: 1000 }),
    makeStep('create-shipment', 'Create Shipment', 'task', 'log.createShipment', ['validate-address'], { type: 'retry', maxAttempts: 2, backoffMs: 500 }),
    makeStep('assign-carrier', 'Assign Carrier', 'task', 'log.assignCarrier', ['create-shipment'], { type: 'fallback', maxAttempts: 2, backoffMs: 1000, fallbackStepId: 'default-carrier' }),
    makeStep('default-carrier', 'Default Carrier', 'task', 'log.defaultCarrier', ['assign-carrier']),
    makeStep('generate-label', 'Generate Label', 'task', 'log.generateLabel', ['assign-carrier'], { type: 'retry', maxAttempts: 3, backoffMs: 2000 }),
    makeStep('dispatch', 'Dispatch', 'task', 'log.dispatch', ['generate-label'], { type: 'escalate', maxAttempts: 1, escalateTo: 'dispatch_manager' }),
  ],
};

/** All built-in domain workflow templates. */
export const ALL_DOMAIN_WORKFLOW_TEMPLATES: DomainWorkflowTemplate[] = [
  COFFEE_SHOP_ORDER_WORKFLOW,
  COFFEE_SHOP_INVENTORY_WORKFLOW,
  ECOMMERCE_PURCHASE_WORKFLOW,
  ECOMMERCE_INVENTORY_SYNC_WORKFLOW,
  SAAS_ONBOARDING_WORKFLOW,
  SAAS_BILLING_WORKFLOW,
  BOOKING_RESERVATION_WORKFLOW,
  LOGISTICS_SHIPMENT_WORKFLOW,
];

/**
 * Get workflow templates for a specific domain.
 */
export function getTemplatesForDomain(domain: string): DomainWorkflowTemplate[] {
  return ALL_DOMAIN_WORKFLOW_TEMPLATES.filter(t => t.domain === domain);
}

/**
 * Get workflow templates matching any of the given domains.
 */
export function getTemplatesForDomains(domains: string[]): DomainWorkflowTemplate[] {
  const domainSet = new Set(domains);
  return ALL_DOMAIN_WORKFLOW_TEMPLATES.filter(t => domainSet.has(t.domain));
}

// ---------------------------------------------------------------------------
// Domain Workflow Registry
// ---------------------------------------------------------------------------

export class DomainWorkflowRegistry {
  private registry: WorkflowRegistry;
  /** Track domain-specific metrics */
  private metrics: Map<string, DomainWorkflowMetrics> = new Map();

  constructor(registry: WorkflowRegistry) {
    this.registry = registry;
  }

  /**
   * Register all built-in templates for a domain.
   */
  registerDomainTemplates(domain: string): number {
    const templates = getTemplatesForDomain(domain);
    let registered = 0;
    for (const template of templates) {
      try {
        const workflow = this.templateToWorkflow(template);
        this.registry.register(workflow);
        this.metrics.set(template.id, {
          domain: template.domain,
          templateId: template.id,
          executionCount: 0,
          successCount: 0,
          failureCount: 0,
          avgDurationMs: 0,
          lastExecutedAt: new Date(0).toISOString(),
          successRate: 0,
        });
        registered++;
      } catch {
        // Already registered or invalid — skip
      }
    }
    return registered;
  }

  /**
   * Register all built-in templates for multiple domains.
   */
  registerMultipleDomainTemplates(domains: string[]): Record<string, number> {
    const results: Record<string, number> = {};
    for (const domain of domains) {
      results[domain] = this.registerDomainTemplates(domain);
    }
    return results;
  }

  /**
   * Convert a domain template to a full Workflow definition.
   */
  templateToWorkflow(template: DomainWorkflowTemplate): Workflow {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      version: template.version,
      steps: template.steps as unknown as WorkflowStep[],
      triggers: template.triggers,
      metadata: {
        domain: template.domain,
        tags: template.tags,
        source: 'domain-template',
      },
    };
  }

  /**
   * Select the best workflow template for a given domain and intent.
   * Uses metrics to prefer templates with high success rates.
   */
  selectWorkflow(domain: string, intent?: string): WorkflowSelectionResult | null {
    const templates = getTemplatesForDomain(domain);
    if (templates.length === 0) return null;

    let best: DomainWorkflowTemplate | null = null;
    let bestScore = -1;
    let bestReason = '';

    for (const template of templates) {
      // Intent matching: check if trigger config aligns with the intent
      if (intent) {
        const hasMatchingTrigger = template.triggers.some(t => {
          const cfg = t.config as Record<string, unknown>;
          return cfg.intent === intent || cfg.event === intent;
        });
        if (!hasMatchingTrigger && template.tags?.some(tag => tag.toLowerCase().includes(intent.toLowerCase()))) {
          // Tag match
        } else if (!hasMatchingTrigger) {
          continue;
        }
      }

      // Score based on metrics
      const m = this.metrics.get(template.id);
      let score = 0.5; // Base score for untrained templates
      let reason = 'No execution history';

      if (m && m.executionCount > 0) {
        score = m.successRate;
        reason = `${m.successRate >= 0.9 ? 'High' : m.successRate >= 0.7 ? 'Moderate' : 'Low'} success rate (${(m.successRate * 100).toFixed(0)}%) over ${m.executionCount} executions`;
      } else {
        reason = 'Template selected (no execution history)';
      }

      if (score > bestScore) {
        bestScore = score;
        best = template;
        bestReason = reason;
      }
    }

    if (!best) return null;

    const adaptedSteps = this.adaptStepsToContext(best.steps);

    return {
      template: best,
      confidence: bestScore,
      reason: bestReason,
      adaptedSteps,
    };
  }

  /**
   * Adapt template steps based on recorded metrics (e.g., skip consistently-failing steps).
   */
  private adaptStepsToContext(steps: DomainWorkflowStep[]): WorkflowStep[] {
    return steps.map(step => ({
      ...step,
      // Remove recoveryStrategy from the WorkflowStep (not part of the interface)
      // but keep retryPolicy and onFailure settings
      retryPolicy: step.recoveryStrategy
        ? { maxAttempts: step.recoveryStrategy.maxAttempts, backoffMs: step.recoveryStrategy.backoffMs ?? 1000, retryableErrors: ['TIMEOUT', 'NETWORK_ERROR'] }
        : step.retryPolicy,
      onFailure: step.recoveryStrategy
        ? (step.recoveryStrategy.type === 'fallback' ? 'fallback' : step.recoveryStrategy.type === 'skip' ? 'skip' : 'retry')
        : step.onFailure ?? 'retry',
      fallbackStep: step.recoveryStrategy?.fallbackStepId,
    }));
  }

  /**
   * Record execution metrics for a domain workflow.
   */
  recordExecution(templateId: string, success: boolean, durationMs: number): void {
    const existing = this.metrics.get(templateId);
    if (!existing) return;

    existing.executionCount++;
    existing.successCount += success ? 1 : 0;
    existing.failureCount += success ? 0 : 1;
    existing.lastExecutedAt = new Date().toISOString();

    // Rolling average
    const prevAvg = existing.avgDurationMs;
    const n = existing.executionCount;
    existing.avgDurationMs = (prevAvg * (n - 1) + durationMs) / n;
    existing.successRate = existing.successCount / existing.executionCount;

    this.metrics.set(templateId, existing);
  }

  /**
   * Get metrics for a specific template.
   */
  getMetrics(templateId: string): DomainWorkflowMetrics | undefined {
    return this.metrics.get(templateId);
  }

  /**
   * Get all domain workflow metrics.
   */
  getAllMetrics(): DomainWorkflowMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get the underlying workflow registry.
   */
  getRegistry(): WorkflowRegistry {
    return this.registry;
  }
}

// ---------------------------------------------------------------------------
// Built-in quality gates per domain
// ---------------------------------------------------------------------------

export const QUALITY_GATES: Record<string, { id: string; name: string; description: string; domain: string; checks: string[]; blocking: boolean; minPassRate: number }[]> = {
  coffeeShop: [
    {
      id: 'cofi-order-gate',
      name: 'Coffee Shop Order Gate',
      description: 'Quality gate for coffee shop order-related code',
      domain: 'coffeeShop',
      checks: ['syntax-basic', 'security-common', 'domain-coffeeShop'],
      blocking: true,
      minPassRate: 0.8,
    },
  ],
  ecommerce: [
    {
      id: 'ecom-payment-gate',
      name: 'E-Commerce Payment Gate',
      description: 'Quality gate for payment-related code',
      domain: 'ecommerce',
      checks: ['syntax-basic', 'security-common', 'performance-common'],
      blocking: true,
      minPassRate: 0.9,
    },
  ],
  saas: [
    {
      id: 'saas-auth-gate',
      name: 'SaaS Auth Gate',
      description: 'Quality gate for authentication code',
      domain: 'saas',
      checks: ['syntax-basic', 'security-common', 'domain-saas'],
      blocking: true,
      minPassRate: 0.85,
    },
  ],
  booking: [
    {
      id: 'book-reservation-gate',
      name: 'Booking Reservation Gate',
      description: 'Quality gate for reservation code',
      domain: 'booking',
      checks: ['syntax-basic', 'security-common'],
      blocking: true,
      minPassRate: 0.8,
    },
  ],
  logistics: [
    {
      id: 'log-shipment-gate',
      name: 'Logistics Shipment Gate',
      description: 'Quality gate for shipment code',
      domain: 'logistics',
      checks: ['syntax-basic', 'security-common', 'domain-logistics'],
      blocking: true,
      minPassRate: 0.8,
    },
  ],
};

/**
 * Get quality gates for a specific domain.
 */
export function getQualityGatesForDomain(domain: string): typeof QUALITY_GATES[string] {
  return QUALITY_GATES[domain] ?? [];
}
