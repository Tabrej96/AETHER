/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Generation Backend Abstraction
 * (src/core/creative/generationBackend.ts)
 *
 * Interface-first design for AI image generation backends.
 * Supports multiple providers (Stable Diffusion, DALL-E, etc.) with
 * model management and generation pipeline orchestration.
 *
 * Inspired by ComfyUI's modular backend architecture (GPL-3.0, studied
 * as out-of-process reference — AETHER implementation is clean-room).
 */

// ─── Core Types ──────────────────────────────────────────────────────────────

export type ProviderType = 'stable-diffusion' | 'dall-e' | 'midjourney' | 'flux' | 'custom';

export interface ModelSpec {
  modelId: string;
  displayName: string;
  provider: ProviderType;
  version: string;
  /** Input modalities */
  acceptsText: boolean;
  acceptsImage: boolean;
  /** Output modalities */
  outputsImage: boolean;
  outputsText: boolean;
  /** Capability flags */
  supportsInpainting: boolean;
  supportsOutpainting: boolean;
  supportsControlNet: boolean;
  supportsLoRA: boolean;
  supportsNegativePrompt: boolean;
  supportsSeed: boolean;
  /** Resource requirements */
  minVRAMMB: number;
  estimatedLatencyMs: number;
  costPerGeneration?: number;
  /** Metadata */
  description?: string;
  tags: string[];
}

export interface GenerationParameters {
  /** Text prompt describing the desired output */
  prompt: string;
  /** Text prompt describing what to exclude */
  negativePrompt?: string;
  /** Generation seed for reproducibility */
  seed?: number;
  /** Number of images to generate in one call */
  batchSize: number;
  /** Output dimensions in pixels */
  width: number;
  height: number;
  /** Classifier-free guidance scale */
  cfgScale: number;
  /** Number of denoising/inference steps */
  steps: number;
  /** Sampler algorithm identifier */
  sampler: string;
  /** Scheduling strategy */
  scheduler: 'normal' | 'karras' | 'exponential' | 'polyexponential' | 'sgm_uniform';
  /** Strength for img2img (0–1) */
  strength?: number;
  /** Denoising start (0–1) for control */
  denoisingStart?: number;
  /** Denoising end (0–1) for control */
  denoisingEnd?: number;
  /** Clip skip value */
  clipSkip?: number;
  /** Custom provider-specific parameters */
  extra: Record<string, unknown>;
}

export const DEFAULT_GENERATION_PARAMS: GenerationParameters = {
  prompt: '',
  batchSize: 1,
  width: 1024,
  height: 1024,
  cfgScale: 7.0,
  steps: 20,
  sampler: 'euler',
  scheduler: 'normal',
  extra: {},
};

export interface GeneratedImage {
  /** Unique identifier for this generated output */
  imageId: string;
  /** Base64-encoded image data (or data URI) */
  data: string;
  /** MIME type of the image */
  mimeType: string;
  /** Actual generation dimensions */
  width: number;
  height: number;
  /** Generation metadata */
  seed: number;
  prompt: string;
  negativePrompt?: string;
  /** Timestamp of generation (ISO 8601) */
  generatedAt: string;
  /** Provider that generated this image */
  provider: ProviderType;
  /** Model used */
  modelId: string;
  /** Generation parameters used */
  parameters: GenerationParameters;
  /** Provider-specific metadata (e.g., NSFW flag) */
  metadata: Record<string, unknown>;
  /** Generation duration in milliseconds */
  latencyMs: number;
}

export interface GenerationResult {
  /** Success flag */
  success: boolean;
  /** Generated images (empty on failure) */
  images: GeneratedImage[];
  /** Error message (present on failure) */
  error?: string;
  /** Provider error code (if any) */
  errorCode?: string;
  /** Total generation time in milliseconds */
  totalTimeMs: number;
  /** Provider that handled the request */
  providerUsed: ProviderType;
  /** Model that was actually used */
  modelUsed: string;
}

// ─── Provider Contract ───────────────────────────────────────────────────────

export interface GenerationProvider {
  /** Unique provider identifier */
  readonly providerType: ProviderType;
  /** Human-readable display name */
  readonly displayName: string;
  /** Whether this provider is currently available */
  readonly isAvailable: boolean;
  /** Reason provider is unavailable (if not available) */
  readonly unavailabilityReason?: string;

  /** Initialize the provider with configuration */
  initialize(config: Record<string, unknown>): Promise<void>;

  /** List available models from this provider */
  listModels(): Promise<ModelSpec[]>;

  /** Generate image(s) from the given parameters */
  generate(parameters: GenerationParameters): Promise<GenerationResult>;

  /** Health check — verify provider connectivity */
  healthCheck(): Promise<boolean>;

  /** Dispose of resources held by this provider */
  dispose(): Promise<void>;
}

// ─── Provider Registration ───────────────────────────────────────────────────

export interface ProviderConfig {
  providerType: ProviderType;
  displayName: string;
  config: Record<string, unknown>;
  priority: number; // lower = higher priority for fallback
  enabled: boolean;
}

// ─── Backend Orchestrator ────────────────────────────────────────────────────

export interface GenerationBackendConfig {
  providers: ProviderConfig[];
  /** Default provider type when none specified */
  defaultProvider: ProviderType;
  /** Max retries on transient failure */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelayMs: number;
  /** Model selection policy */
  modelPolicy: 'prefer-speed' | 'prefer-quality' | 'balanced';
  /** Whether to fall back to alternative providers on failure */
  enableFallback: boolean;
}

export const DEFAULT_BACKEND_CONFIG: GenerationBackendConfig = {
  providers: [],
  defaultProvider: 'stable-diffusion',
  maxRetries: 3,
  retryDelayMs: 1000,
  modelPolicy: 'balanced',
  enableFallback: true,
};

export interface GenerationBackendStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageLatencyMs: number;
  providerUsageCount: Map<ProviderType, number>;
  modelUsageCount: Map<string, number>;
}

// ─── Model Selection ─────────────────────────────────────────────────────────

export interface ModelSelectionCriteria {
  /** Preferred provider type */
  preferredProvider?: ProviderType;
  /** Minimum quality score (0–100) */
  minQuality?: number;
  /** Maximum latency in milliseconds */
  maxLatencyMs?: number;
  /** Maximum cost per generation */
  maxCost?: number;
  /** Required capabilities */
  requiredCapabilities: Array<
    'inpainting' | 'outpainting' | 'controlnet' | 'lora' | 'negative-prompt' | 'seed'
  >;
  /** Tag filters */
  requiredTags: string[];
  /** Excluded model IDs */
  excludeModels: string[];
}

export interface ModelSelection {
  model: ModelSpec;
  provider: ProviderType;
  score: number;
  rationale: string;
}

// ─── Pipeline Events ─────────────────────────────────────────────────────────

export type GenerationEventType =
  | 'provider:registered'
  | 'provider:unregistered'
  | 'provider:available'
  | 'provider:unavailable'
  | 'generation:start'
  | 'generation:success'
  | 'generation:failure'
  | 'model:selected'
  | 'fallback:triggered';

export interface GenerationEvent {
  type: GenerationEventType;
  timestamp: string;
  provider?: ProviderType;
  modelId?: string;
  generationId?: string;
  latencyMs?: number;
  error?: string;
  detail?: Record<string, unknown>;
}

export type GenerationEventHandler = (event: GenerationEvent) => void;

// ─── Pipeline Node (for composing generation chains) ─────────────────────────

export interface PipelineNode {
  nodeId: string;
  nodeType: 'text-to-image' | 'image-to-image' | 'upscale' | 'inpaint' | 'outpaint' | 'filter' | 'merge' | 'output';
  provider: ProviderType;
  modelId: string;
  parameters: GenerationParameters;
  /** Input source: 'previous' | 'external' | specific node output id */
  inputSource: 'previous' | 'external';
  /** External input URL/data (when inputSource === 'external') */
  externalInput?: string;
}

export interface GenerationPipeline {
  pipelineId: string;
  name: string;
  description: string;
  nodes: PipelineNode[];
  /** Execution order (resolved topologically) */
  executionOrder: string[];
  /** Whether the pipeline has been validated */
  validated: boolean;
  /** Validation errors (if any) */
  validationErrors: string[];
}
