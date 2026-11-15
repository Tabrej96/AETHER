/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Public API barrel export
 * (src/core/creative/index.ts)
 *
 * ComfyUI (GPL-3.0) and Three.js (MIT) are cited as inspiration sources.
 * AETHER's creative intelligence modules are clean-room implementations
 * that produce data structures compatible with Three.js consumers without
 * importing Three.js directly.
 */

// ─── Generation Backend ──────────────────────────────────────────────────────

export {
  // Types
  type ProviderType,
  type ModelSpec,
  type GenerationParameters,
  DEFAULT_GENERATION_PARAMS,
  type GeneratedImage,
  type GenerationResult,
  type GenerationProvider,
  type ProviderConfig,
  type GenerationBackendConfig,
  DEFAULT_BACKEND_CONFIG,
  type GenerationBackendStats,
  type ModelSelectionCriteria,
  type ModelSelection,
  type GenerationEventType,
  type GenerationEvent,
  type GenerationEventHandler,
  type PipelineNode,
  type GenerationPipeline,
} from './generationBackend';

// ─── Workflow Composer ───────────────────────────────────────────────────────

export {
  // Types
  type SocketDataType,
  type WorkflowSocket,
  type WorkflowEdge,
  type NodeCategory,
  type WorkflowNodeDefinition,
  type WorkflowNode,
  type WorkflowGraph,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type ExecutionStatus,
  type ExecutionContext,
  type ExecutionOptions,
  DEFAULT_EXECUTION_OPTIONS,
  type ComposerOptions,
  type ExecutionEngine,
  type NodeExecutor,
  type DependencyResolver,
  type WorkflowRegistryEntry,
  type WorkflowRegistry,
  type WorkflowSerializationFormat,
  type SerializedWorkflow,
} from './workflowComposer';

// ─── Asset Manager ───────────────────────────────────────────────────────────

export {
  // Types
  type AssetKind,
  type Asset,
  type AssetVersion,
  type VersionComparison,
  type StorageBackend,
  type CachePolicy,
  DEFAULT_CACHE_POLICY,
  type CacheEntry,
  type AssetManagerConfig,
  DEFAULT_ASSET_MANAGER_CONFIG,
  type AssetQuery,
  DEFAULT_QUERY,
  type AssetQueryResult,
  type AssetImportResult,
  type AssetExportOptions,
  type AssetStats,
  type AssetLifecycleEvent,
  type AssetLifecycleEventDetail,
  type AssetLifecycleHandler,
} from './assetManager';

// ─── 3D Renderer ─────────────────────────────────────────────────────────────

export {
  // Math
  type Vec3,
  type Vec2,
  type Quat,
  type ColorRGB,
  type ColorHex,
  ZERO_V3,
  ONE_V3,
  UP_V3,
  vec3Add,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3Length,
  vec3Normalize,
  vec3Lerp,
  rgbToHex,
  hexToRgb,
  // Types
  type Transform,
  DEFAULT_TRANSFORM,
  type Material,
  type MaterialType,
  DEFAULT_MATERIAL,
  type Geometry,
  type GeometryType,
  type ObjectKind,
  type Light,
  type Camera,
  type SceneObject,
  DEFAULT_SCENE_OBJECT,
  type SceneGraph,
  type RendererOutputFormat,
  type RendererSettings,
  DEFAULT_RENDERER_SETTINGS,
  type RenderResult,
  type AnimationClip,
  type Keyframe,
  type AnimationState,
  type ModelFormat,
  type LoadedModel,
  type ModelLoaderOptions,
  DEFAULT_MODEL_LOADER_OPTIONS,
  type RaycastHit,
  type Raycaster,
  type ExportFormat,
  type ExportOptions,
  type ExportResult,
} from './renderer3d';

// ─── Asset Pipeline ──────────────────────────────────────────────────────────

export {
  // Types
  type PipelineImage,
  createPipelineImage,
  type StageName,
  type StageStatus,
  type PipelineStageResult,
  type PipelineStep,
  type AssetPipelineDefinition,
  DEFAULT_PIPELINE,
  type ResizeConfig,
  type CropConfig,
  type ColorCorrectConfig,
  type CompressConfig,
  type OutputFormat,
  type ConvertFormatConfig,
  type QualityAssessment,
  type QualityIssue,
  type QualityThresholds,
  DEFAULT_QUALITY_THRESHOLDS,
  type PipelineExecutionStatus,
  type PipelineExecution,
  type PipelineEngine,
  type ValidationResult,
  type FormatInfo,
  FORMAT_INFO,
  type PipelineCacheEntry,
} from './assetPipeline';

// ─── Interactive Visualization ────────────────────────────────────────────────

export {
  // Types
  type ViewerMode,
  type ViewerState,
  type CameraState,
  type ControlAction,
  type ControlBinding,
  type ControlState,
  type InputEventType,
  type InputEvent,
  type ControlsEngine,
  type SelectionMode,
  type SelectionState,
  type SceneViewer,
  type AnimationEventType,
  type AnimationEvent,
  type AnimationMixer,
  type AnimationSystem,
  type ExportFormat as VizExportFormat,
  type ExportOptions as VizExportOptions,
  type ExportResult as VizExportResult,
  type SceneSerializationOptions,
  type SerializedScene,
  type CaptureOptions,
  type CaptureResult,
} from './interactiveViz';
