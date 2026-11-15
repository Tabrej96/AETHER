/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Skill Engine — Public API
 * (src/core/skills/index.ts)
 *
 * One-stop import for the entire skill engine:
 *   import { SkillRegistry, SkillComposer, SkillExecutor, SkillMetricsCollector, SkillLearning } from './skills';
 */

export { SkillRegistry } from './skillRegistry';
export { SkillComposer } from './skillComposer';
export { SkillExecutor } from './skillExecutor';
export { SkillMetricsCollector } from './skillMetrics';
export { SkillLearning } from './skillLearning';

// Re-export all interfaces from skillEngine so consumers have one import
export {
  // Core
  type Skill,
  type SkillInput,
  type SkillOutput,
  type SkillExecution,
  type RetryPolicy,
  type SkillSecurity,
  type SkillTest,
  type SkillMetadata,
  type DataType,
  type ExecutionType,
  // Results
  type SkillResult,
  type SkillError,
  // Workflow
  type Workflow,
  type WorkflowStep,
  type DataFlow,
  // Metrics
  type SkillMetrics,
  type DailyMetrics,
  type ResourceSnapshot,
  // Learning
  type SkillSuggestion,
  type SkillCombination,
  // Composer
  type ComposeResult,
  type ComposeError,
  type ExecutionPlan,
  // Executor
  type ExecutionContext,
  // Query
  type SkillQuery,
} from './skillEngine';
