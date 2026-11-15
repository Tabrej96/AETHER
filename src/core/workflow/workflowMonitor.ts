/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER 1.0 — Workflow Monitor
 * (src/core/workflow/workflowMonitor.ts) · Created by Tabrej
 *
 * Real-time progress tracking, step-level metrics, failure alerting,
 * and an audit trail for workflow executions.
 */

import type {
  WorkflowExecution,
  StepResult,
  WorkflowEvent,
  WorkflowEventType,
  WorkflowEventListener,
  WorkflowMetrics,
  WorkflowAuditEntry,
} from './workflowEngine';

export interface AlertRule {
  /** Trigger the alert when a step fails with this error code. */
  errorCode?: string;
  /** Trigger the alert when a step runs longer than this (ms). */
  stepTimeoutMs?: number;
  /** Trigger the alert when total workflow elapsed exceeds this (ms). */
  workflowTimeoutMs?: number;
  /** Callback invoked when the alert fires. */
  onAlert: (message: string, data: Record<string, unknown>) => void;
}

export class WorkflowMonitor {
  private listeners: Set<WorkflowEventListener> = new Set();
  private auditTrails: Map<string, WorkflowAuditEntry[]> = new Map();
  private metrics: Map<string, WorkflowMetrics> = new Map();
  private alertRules: AlertRule[] = [];
  private stepStartTimes: Map<string, number> = new Map(); // key: "executionId:stepId"

  /** Subscribe to workflow events. Returns an unsubscribe function. */
  onEvent(listener: WorkflowEventListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  /** Register an alert rule. */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.push(rule);
  }

  /** Emit an event to all listeners. */
  emit(event: WorkflowEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Listener errors must not break monitoring.
      }
    }
  }

  /** Record the start of a step execution. */
  stepStarted(executionId: string, workflowId: string, stepId: string): void {
    const key = `${executionId}:${stepId}`;
    this.stepStartTimes.set(key, Date.now());
    this.addAuditEntry(executionId, {
      executionId,
      stepId,
      event: 'started',
      timestamp: new Date(),
    });
    this.emit({
      type: 'step:started',
      executionId,
      workflowId,
      stepId,
      timestamp: new Date(),
      data: { stepId },
    });
  }

  /** Record the completion of a step execution. */
  stepCompleted(
    executionId: string,
    workflowId: string,
    stepId: string,
    result: StepResult,
    totalSteps: number,
  ): void {
    const key = `${executionId}:${stepId}`;
    const start = this.stepStartTimes.get(key) ?? Date.now();
    const elapsed = Date.now() - start;
    this.stepStartTimes.delete(key);

    this.addAuditEntry(executionId, {
      executionId,
      stepId,
      event: result.status === 'success' ? 'completed' : result.status === 'skipped' ? 'skipped' : 'failed',
      timestamp: new Date(),
      details: { elapsedMs: elapsed, attempts: result.attempts },
    });

    const eventType: WorkflowEventType =
      result.status === 'success' ? 'step:completed'
      : result.status === 'skipped' ? 'step:skipped'
      : result.status === 'timeout' ? 'step:timeout'
      : 'step:failed';

    this.emit({
      type: eventType,
      executionId,
      workflowId,
      stepId,
      timestamp: new Date(),
      data: { elapsedMs: elapsed, attempts: result.attempts, error: result.error },
    });

    // Check alert rules for this step.
    this.checkAlertRules(executionId, workflowId, stepId, result, elapsed);
  }

  /** Record execution-level events. */
  executionEvent(type: WorkflowEventType, executionId: string, workflowId: string, stepId?: string, data: Record<string, unknown> = {}): void {
    if (type === 'execution:started' || type === 'execution:completed' || type === 'execution:failed' || type === 'execution:cancelled') {
      this.addAuditEntry(executionId, {
        executionId,
        stepId: stepId ?? '__workflow__',
        event: type.replace('execution:', '') as WorkflowAuditEntry['event'],
        timestamp: new Date(),
        details: data,
      });
    }
    this.emit({ type, executionId, workflowId, stepId, timestamp: new Date(), data });
  }

  /** Update and return current metrics for an execution. */
  getMetrics(execution: WorkflowExecution): WorkflowMetrics {
    const completedCount = execution.completedSteps.length;
    const failedCount = Object.values(execution.results).filter((r) => r.status === 'failed').length;
    const skippedCount = Object.values(execution.results).filter((r) => r.status === 'skipped').length;
    const elapsed = Date.now() - execution.startedAt.getTime();

    const stepTimings: Record<string, number> = {};
    for (const [stepId, result] of Object.entries(execution.results)) {
      if (result.completedAt) {
        stepTimings[stepId] = result.completedAt.getTime() - result.startedAt.getTime();
      }
    }

    const metrics: WorkflowMetrics = {
      executionId: execution.id,
      workflowId: execution.workflowId,
      totalSteps: execution.results ? Object.keys(execution.results).length : 0,
      completedSteps: completedCount,
      failedSteps: failedCount,
      skippedSteps: skippedCount,
      currentStep: execution.currentStep,
      elapsedMs: elapsed,
      stepTimings,
      status: execution.status,
      updatedAt: new Date(),
    };

    this.metrics.set(execution.id, metrics);
    return metrics;
  }

  /** Get the audit trail for an execution. */
  getAuditTrail(executionId: string): WorkflowAuditEntry[] {
    return this.auditTrails.get(executionId) ?? [];
  }

  /** Clear all state for an execution (call when execution ends). */
  clearExecution(executionId: string): void {
    this.auditTrails.delete(executionId);
    this.metrics.delete(executionId);
    // Clean up any remaining step start times.
    for (const key of this.stepStartTimes.keys()) {
      if (key.startsWith(`${executionId}:`)) this.stepStartTimes.delete(key);
    }
  }

  private addAuditEntry(executionId: string, entry: WorkflowAuditEntry): void {
    if (!this.auditTrails.has(executionId)) {
      this.auditTrails.set(executionId, []);
    }
    this.auditTrails.get(executionId)!.push(entry);
  }

  private checkAlertRules(
    executionId: string,
    workflowId: string,
    stepId: string,
    result: StepResult,
    elapsedMs: number,
  ): void {
    for (const rule of this.alertRules) {
      if (rule.errorCode && result.error?.code === rule.errorCode) {
        rule.onAlert(`Step ${stepId} failed with error ${rule.errorCode}`, {
          executionId, workflowId, stepId, error: result.error,
        });
      }
      if (rule.stepTimeoutMs && elapsedMs > rule.stepTimeoutMs) {
        rule.onAlert(`Step ${stepId} exceeded timeout (${elapsedMs}ms > ${rule.stepTimeoutMs}ms)`, {
          executionId, workflowId, stepId, elapsedMs,
        });
      }
    }

    // Check workflow-level timeout.
    const metrics = this.metrics.get(executionId);
    if (metrics && rule.workflowTimeoutMs && metrics.elapsedMs > rule.workflowTimeoutMs) {
      rule.onAlert(`Workflow ${workflowId} exceeded total timeout (${metrics.elapsedMs}ms > ${rule.workflowTimeoutMs}ms)`, {
        executionId, workflowId, elapsedMs: metrics.elapsedMs,
      });
    }
  }
}
