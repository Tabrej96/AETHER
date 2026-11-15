/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PROGRAM 03 — TASK PLANNER  ·  AETHER Autonomous Execution
 * (src/core/orchestration/taskPlanner.ts)
 *
 * Decomposes high-level goals into executable steps with dependency graphs,
 * resource requirement estimation, and failure recovery planning.
 *
 * Inspiration: All-Hands-AI/OpenHands (task decomposition patterns)
 *              FoundationAgents/OpenManus (plan-and-act architecture)
 */

import crypto from 'node:crypto';

// =====================================================================
// TYPES
// =====================================================================

export type TaskStepStatus = 'PENDING' | 'READY' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'RECOVERING';

export type TaskComplexity = 'TRIVIAL' | 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'CRITICAL';

export type ResourceType = 'CPU' | 'MEMORY' | 'DISK' | 'NETWORK' | 'TOKEN_BUDGET' | 'TIME_BUDGET';

export interface ResourceRequirement {
  resource: ResourceType;
  amount: number;
  unit: string;
  justification: string;
}

export interface RecoveryStrategy {
  strategyId: string;
  triggerCondition: string;
  maxRetries: number;
  backoffMs: number;
  fallbackAction: string;
  escalateAfterRetries: boolean;
}

export interface TaskStep {
  stepId: string;
  title: string;
  description: string;
  action: string;
  dependsOn: string[];
  estimatedDurationMs: number;
  resourceRequirements: ResourceRequirement[];
  recoveryStrategies: RecoveryStrategy[];
  verificationCriteria: string[];
  metadata: Record<string, unknown>;
}

export interface DependencyGraph {
  nodes: string[];
  edges: [string, string][];
  levels: string[][];
  criticalPath: string[];
}

export interface ExecutionPlanResult {
  planId: string;
  goal: string;
  complexity: TaskComplexity;
  steps: TaskStep[];
  dependencyGraph: DependencyGraph;
  totalEstimatedDurationMs: number;
  resourceSummary: ResourceRequirement[];
  recoveryStrategies: RecoveryStrategy[];
  parallelGroups: number[][];
  metadata: Record<string, unknown>;
}

export interface TaskPlannerOptions {
  maxSteps?: number;
  defaultRetries?: number;
  defaultBackoffMs?: number;
  defaultTokenBudget?: number;
  defaultTimeBudgetMs?: number;
}

// =====================================================================
// TASK PLANNER
// =====================================================================

export class TaskPlanner {
  private readonly options: Required<TaskPlannerOptions>;

  constructor(options: TaskPlannerOptions = {}) {
    this.options = {
      maxSteps: options.maxSteps ?? 50,
      defaultRetries: options.defaultRetries ?? 3,
      defaultBackoffMs: options.defaultBackoffMs ?? 1000,
      defaultTokenBudget: options.defaultTokenBudget ?? 100_000,
      defaultTimeBudgetMs: options.defaultTimeBudgetMs ?? 300_000,
    };
  }

  /**
   * Decompose a high-level goal into executable steps.
   *
   * The planner analyzes the goal text and produces a structured set of steps
   * covering the full lifecycle: research, design, implement, verify, deploy.
   */
  decomposeGoal(goal: string): TaskStep[] {
    const lowerGoal = goal.toLowerCase();
    const steps: TaskStep[] = [];
    let stepCounter = 0;

    const addStep = (
      title: string,
      description: string,
      action: string,
      deps: string[],
      estimatedMs: number,
      verifications: string[],
      resources: ResourceRequirement[] = [],
      recovery: RecoveryStrategy[] = []
    ): TaskStep => {
      const stepId = `step-${String(++stepCounter).padStart(3, '0')}`;
      return {
        stepId,
        title,
        description,
        action,
        dependsOn: deps,
        estimatedDurationMs: estimatedMs,
        resourceRequirements: resources,
        recoveryStrategies: recovery,
        verificationCriteria: verifications,
        metadata: {},
      };
    };

    // Phase 1: Research / Analysis
    const isResearchTask = /\b(research|analyze|investigate|study|review|audit|assess|explore)\b/.test(lowerGoal);
    const isDesignTask = /\b(design|architect|plan|blueprint|model)\b/.test(lowerGoal);
    const isImplementTask = /\b(build|create|implement|develop|code|write|construct|make)\b/.test(lowerGoal);
    const isTestTask = /\b(test|verify|validate|check|qa)\b/.test(lowerGoal);
    const isDeployTask = /\b(deploy|release|ship|launch|publish)\b/.test(lowerGoal);
    const isFixTask = /\b(fix|repair|debug|resolve|patch|hotfix)\b/.test(lowerGoal);
    const isRefactorTask = /\b(refactor|cleanup|clean up|reorganize|modernize|improve)\b/.test(lowerGoal);
    const isSecurityTask = /\b(secur|harden|pentest|vulnerability|compliance)\b/.test(lowerGoal);

    // Always start with intent analysis
    const intentStep = addStep(
      'Analyze Intent',
      'Parse the goal, identify constraints, and scope the work',
      'analyze_intent',
      [],
      2_000,
      ['Goal parsed successfully', 'Constraints identified', 'Scope defined'],
      [
        {
          resource: 'TOKEN_BUDGET',
          amount: 5_000,
          unit: 'tokens',
          justification: 'Goal analysis and constraint extraction',
        },
        {
          resource: 'TIME_BUDGET',
          amount: 10_000,
          unit: 'ms',
          justification: 'Intent analysis must complete quickly',
        },
      ]
    );
    steps.push(intentStep);

    let lastStepId = intentStep.stepId;

    // Research phase
    if (isResearchTask || isImplementTask) {
      const researchStep = addStep(
        'Research & Gather Context',
        'Gather relevant context, documentation, and existing solutions',
        'research',
        [lastStepId],
        15_000,
        ['Sources identified', 'Relevant patterns found', 'Context assembled'],
        [
          {
            resource: 'TOKEN_BUDGET',
            amount: 20_000,
            unit: 'tokens',
            justification: 'Research requires significant context',
          },
          {
            resource: 'NETWORK',
            amount: 1,
            unit: 'requests',
            justification: 'Fetch documentation and references',
          },
        ],
        [
          {
            strategyId: `retry-${crypto.randomUUID().slice(0, 8)}`,
            triggerCondition: 'Network timeout or source unavailable',
            maxRetries: this.options.defaultRetries,
            backoffMs: this.options.defaultBackoffMs * 2,
            fallbackAction: 'Use cached context and continue with limited information',
            escalateAfterRetries: true,
          },
        ]
      );
      steps.push(researchStep);
      lastStepId = researchStep.stepId;
    }

    // Design phase
    if (isDesignTask || isImplementTask || isRefactorTask || isSecurityTask) {
      const designStep = addStep(
        'Design Solution',
        'Create the implementation plan, architecture, and interfaces',
        'design',
        [lastStepId],
        20_000,
        ['Design documented', 'Interfaces defined', 'Architecture approved'],
        [
          {
            resource: 'TOKEN_BUDGET',
            amount: 15_000,
            unit: 'tokens',
            justification: 'Design documentation generation',
          },
          {
            resource: 'CPU',
            amount: 2,
            unit: 'cores',
            justification: 'Design analysis and validation',
          },
        ]
      );
      steps.push(designStep);
      lastStepId = designStep.stepId;
    }

    // Implementation phase
    if (isImplementTask || isFixTask || isRefactorTask) {
      const implStep = addStep(
        'Implement Solution',
        'Write code, create files, and implement the designed solution',
        'implement',
        [lastStepId],
        60_000,
        ['Code written', 'Files created', 'Syntax valid'],
        [
          {
            resource: 'CPU',
            amount: 4,
            unit: 'cores',
            justification: 'Parallel file generation',
          },
          {
            resource: 'MEMORY',
            amount: 512,
            unit: 'MB',
            justification: 'AST parsing and code generation',
          },
          {
            resource: 'DISK',
            amount: 50,
            unit: 'MB',
            justification: 'Generated files storage',
          },
          {
            resource: 'TOKEN_BUDGET',
            amount: 50_000,
            unit: 'tokens',
            justification: 'Code generation and review',
          },
        ],
        [
          {
            strategyId: `retry-impl-${crypto.randomUUID().slice(0, 8)}`,
            triggerCondition: 'Implementation failed verification',
            maxRetries: this.options.defaultRetries,
            backoffMs: this.options.defaultBackoffMs * 3,
            fallbackAction: 'Rollback to design phase and regenerate',
            escalateAfterRetries: true,
          },
          {
            strategyId: `rollback-${crypto.randomUUID().slice(0, 8)}`,
            triggerCondition: 'Critical implementation error',
            maxRetries: 1,
            backoffMs: 0,
            fallbackAction: 'Rollback all changes and notify operator',
            escalateAfterRetries: false,
          },
        ]
      );
      steps.push(implStep);
      lastStepId = implStep.stepId;
    }

    // Security phase
    if (isSecurityTask) {
      const securityStep = addStep(
        'Security Validation',
        'Run security scans, validate against security rules, and check for vulnerabilities',
        'security_validate',
        [lastStepId],
        30_000,
        ['Security scan passed', 'No critical vulnerabilities', 'Compliance verified'],
        [
          {
            resource: 'CPU',
            amount: 2,
            unit: 'cores',
            justification: 'Security scanning',
          },
          {
            resource: 'MEMORY',
            amount: 256,
            unit: 'MB',
            justification: 'Vulnerability database',
          },
        ]
      );
      steps.push(securityStep);
      lastStepId = securityStep.stepId;
    }

    // Test phase
    if (isTestTask || isImplementTask || isFixTask || isRefactorTask) {
      const testStep = addStep(
        'Verification & Testing',
        'Run tests, verify functionality, and validate quality',
        'verify',
        [lastStepId],
        45_000,
        ['All tests pass', 'Quality gates met', 'No regressions detected'],
        [
          {
            resource: 'CPU',
            amount: 4,
            unit: 'cores',
            justification: 'Parallel test execution',
          },
          {
            resource: 'MEMORY',
            amount: 512,
            unit: 'MB',
            justification: 'Test runner memory',
          },
          {
            resource: 'TIME_BUDGET',
            amount: this.options.defaultTimeBudgetMs,
            unit: 'ms',
            justification: 'Full test suite execution',
          },
        ],
        [
          {
            strategyId: `retry-test-${crypto.randomUUID().slice(0, 8)}`,
            triggerCondition: 'Tests failing',
            maxRetries: 2,
            backoffMs: this.options.defaultBackoffMs * 2,
            fallbackAction: 'Analyze test failures, fix, and re-run',
            escalateAfterRetries: true,
          },
        ]
      );
      steps.push(testStep);
      lastStepId = testStep.stepId;
    }

    // Deploy phase
    if (isDeployTask) {
      const deployStep = addStep(
        'Deploy',
        'Execute deployment with rollback capability',
        'deploy',
        [lastStepId],
        30_000,
        ['Deployment successful', 'Health check passed', 'Rollback tested'],
        [
          {
            resource: 'NETWORK',
            amount: 1,
            unit: 'connection',
            justification: 'Deployment target access',
          },
          {
            resource: 'CPU',
            amount: 2,
            unit: 'cores',
            justification: 'Build and packaging',
          },
        ],
        [
          {
            strategyId: `rollback-deploy-${crypto.randomUUID().slice(0, 8)}`,
            triggerCondition: 'Deployment failure or health check failure',
            maxRetries: 1,
            backoffMs: 5_000,
            fallbackAction: 'Rollback to previous version',
            escalateAfterRetries: false,
          },
        ]
      );
      steps.push(deployStep);
      lastStepId = deployStep.stepId;
    }

    // Documentation phase for implementation tasks
    if (isImplementTask && steps.length > 0) {
      const docStep = addStep(
        'Documentation',
        'Update documentation, add comments, and record decisions',
        'document',
        [lastStepId],
        15_000,
        ['Documentation updated', 'Comments added', 'Decisions recorded'],
        [
          {
            resource: 'TOKEN_BUDGET',
            amount: 10_000,
            unit: 'tokens',
            justification: 'Documentation generation',
          },
        ]
      );
      steps.push(docStep);
      lastStepId = docStep.stepId;
    }

    return steps.slice(0, this.options.maxSteps);
  }

  /**
   * Build a dependency graph from steps.
   */
  buildDependencyGraph(steps: TaskStep[]): DependencyGraph {
    const nodeMap = new Map(steps.map((s) => [s.stepId, s]));
    const nodes = steps.map((s) => s.stepId);
    const edges: [string, string][] = [];

    for (const step of steps) {
      for (const dep of step.dependsOn) {
        if (nodeMap.has(dep)) {
          edges.push([dep, step.stepId]);
        }
      }
    }

    // Compute levels (topological layers)
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node, 0);
      adjacency.set(node, []);
    }

    for (const [from, to] of edges) {
      adjacency.get(from)!.push(to);
      inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    }

    const levels: string[][] = [];
    let remaining = new Set(nodes);

    while (remaining.size > 0) {
      const currentLevel: string[] = [];
      for (const node of remaining) {
        if ((inDegree.get(node) ?? 0) === 0) {
          currentLevel.push(node);
        }
      }

      if (currentLevel.length === 0) {
        // Cycle detected — add remaining nodes to break
        for (const node of remaining) {
          currentLevel.push(node);
        }
        break;
      }

      levels.push(currentLevel);
      for (const node of currentLevel) {
        remaining.delete(node);
        for (const neighbor of adjacency.get(node) ?? []) {
          inDegree.set(neighbor, (inDegree.get(neighbor) ?? 1) - 1);
        }
      }
    }

    // Compute critical path (longest path through the DAG)
    const criticalPath = this.computeCriticalPath(steps, adjacency);

    return { nodes, edges, levels, criticalPath };
  }

  /**
   * Estimate resource requirements across all steps.
   */
  estimateResources(steps: TaskStep[]): ResourceRequirement[] {
    const totals = new Map<ResourceType, { amount: number; unit: string; justifications: string[] }>();

    for (const step of steps) {
      for (const req of step.resourceRequirements) {
        const existing = totals.get(req.resource);
        if (!existing) {
          totals.set(req.resource, { amount: req.amount, unit: req.unit, justifications: [req.justification] });
        } else {
          existing.amount += req.amount;
          existing.justifications.push(req.justification);
        }
      }
    }

    return Array.from(totals.entries()).map(([resource, data]) => ({
      resource,
      amount: data.amount,
      unit: data.unit,
      justification: data.justifications.join('; '),
    }));
  }

  /**
   * Build recovery strategies for the entire plan.
   */
  buildRecoveryStrategies(steps: TaskStep[]): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = [];
    const maxRetryCount = Math.max(...steps.map((s) => Math.max(...s.recoveryStrategies.map((r) => r.maxRetries), 0)), 0);

    if (maxRetryCount > 0) {
      strategies.push({
        strategyId: 'global-retry',
        triggerCondition: 'Any step fails its retry budget',
        maxRetries: maxRetryCount,
        backoffMs: this.options.defaultBackoffMs,
        fallbackAction: 'Checkpoint state and attempt resumption from last completed step',
        escalateAfterRetries: true,
      });
    }

    strategies.push({
      strategyId: 'global-rollback',
      triggerCondition: 'Critical failure after all retries exhausted',
      maxRetries: 0,
      backoffMs: 0,
      fallbackAction: 'Rollback all changes and notify operator',
      escalateAfterRetries: true,
    });

    return strategies;
  }

  /**
   * Classify task complexity.
   */
  classifyComplexity(steps: TaskStep[], goal: string): TaskComplexity {
    const stepCount = steps.length;
    const totalDuration = steps.reduce((sum, s) => sum + s.estimatedDurationMs, 0);
    const criticalSteps = steps.filter((s) => s.dependsOn.length > 2).length;
    const hasCriticalKeywords = /\b(critical|production|security|compliance|compliance|migration|data|money|payment)\b/.test(goal.toLowerCase());

    if (stepCount <= 2 && totalDuration < 30_000 && !hasCriticalKeywords) return 'TRIVIAL';
    if (stepCount <= 5 && totalDuration < 120_000 && !hasCriticalKeywords) return 'SIMPLE';
    if (stepCount <= 10 && totalDuration < 300_000) return 'MODERATE';
    if (stepCount <= 25 || criticalSteps > 3) return 'COMPLEX';
    return 'CRITICAL';
  }

  /**
   * Compute parallel groups (steps at the same level that can run concurrently).
   */
  computeParallelGroups(graph: DependencyGraph): number[][] {
    return graph.levels;
  }

  /**
   * Create a full execution plan from a goal.
   */
  createPlan(goal: string, options: TaskPlannerOptions = {}): ExecutionPlanResult {
    const steps = this.decomposeGoal(goal);
    if (steps.length === 0) {
      throw new Error(`Could not decompose goal into steps: ${goal}`);
    }

    const dependencyGraph = this.buildDependencyGraph(steps);
    const complexity = this.classifyComplexity(steps, goal);
    const resourceSummary = this.estimateResources(steps);
    const recoveryStrategies = this.buildRecoveryStrategies(steps);
    const parallelGroups = this.computeParallelGroups(dependencyGraph);
    const totalDuration = steps.reduce((sum, s) => sum + s.estimatedDurationMs, 0);

    return {
      planId: `plan-${crypto.randomUUID().slice(0, 12)}`,
      goal,
      complexity,
      steps,
      dependencyGraph,
      totalEstimatedDurationMs: totalDuration,
      resourceSummary,
      recoveryStrategies,
      parallelGroups,
      metadata: {
        createdAt: new Date().toISOString(),
        stepCount: steps.length,
        averageStepDuration: Math.round(totalDuration / steps.length),
      },
    };
  }

  // =====================================================================
  // PRIVATE HELPERS
  // =====================================================================

  private computeCriticalPath(steps: TaskStep[], adjacency: Map<string, string[]>): string[] {
    const nodeMap = new Map(steps.map((s) => [s.stepId, s]));
    const memo = new Map<string, { path: string[]; duration: number }>();

    const longestPath = (nodeId: string): { path: string[]; duration: number } => {
      if (memo.has(nodeId)) return memo.get(nodeId)!;

      const step = nodeMap.get(nodeId);
      if (!step) return { path: [nodeId], duration: 0 };

      const neighbors = adjacency.get(nodeId) ?? [];
      let bestPath: string[] = [nodeId];
      let bestDuration = step.estimatedDurationMs;

      for (const neighbor of neighbors) {
        const result = longestPath(neighbor);
        const candidateDuration = step.estimatedDurationMs + result.duration;
        if (candidateDuration > bestDuration) {
          bestDuration = candidateDuration;
          bestPath = [nodeId, ...result.path];
        }
      }

      memo.set(nodeId, { path: bestPath, duration: bestDuration });
      return { path: bestPath, duration: bestDuration };
    };

    const entryNodes = steps.filter((s) => s.dependsOn.length === 0);
    if (entryNodes.length === 0) return steps.map((s) => s.stepId);

    let overallBest: { path: string[]; duration: number } = { path: [], duration: 0 };
    for (const entry of entryNodes) {
      const result = longestPath(entry.stepId);
      if (result.duration > overallBest.duration) {
        overallBest = result;
      }
    }

    return overallBest.path;
  }
}

// =====================================================================
// CONVENIENCE FUNCTIONS
// =====================================================================

export function createTaskPlanner(options?: TaskPlannerOptions): TaskPlanner {
  return new TaskPlanner(options);
}

export function decomposeGoal(goal: string, options?: TaskPlannerOptions): ExecutionPlanResult {
  return createTaskPlanner(options).createPlan(goal);
}
