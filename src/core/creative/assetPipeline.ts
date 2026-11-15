/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Visual Asset Pipeline
 * (src/core/creative/assetPipeline.ts)
 *
 * Processes generated images through conversion, resize/crop, optimization,
 * and quality assessment. A composable pipeline where each stage is a
 * pure function that takes an image and returns a processed image or
 * a quality report.
 */

// ─── Pipeline Image Representation ───────────────────────────────────────────

export interface PipelineImage {
  /** Unique image identifier */
  imageId: string;
  /** Raw RGBA pixel data */
  pixels: Uint8Array;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Number of channels (typically 4 for RGBA) */
  channels: number;
  /** MIME type */
  mimeType: string;
  /** Metadata */
  metadata: Record<string, unknown>;
}

export function createPipelineImage(
  imageId: string,
  pixels: Uint8Array,
  width?: number,
  height?: number,
  mimeType = 'image/png',
  metadata: Record<string, unknown> = {},
): PipelineImage {
  const w = width ?? 0;
  const h = height ?? (pixels.length / 4);
  return { imageId, pixels, width: w, height: h, channels: 4, mimeType, metadata };
}

// ─── Pipeline Stage ──────────────────────────────────────────────────────────

export type StageName =
  | 'load'
  | 'validate'
  | 'resize'
  | 'crop'
  | 'filter'
  | 'color-correct'
  | 'compress'
  | 'convert-format'
  | 'optimize'
  | 'assess-quality'
  | 'store';

export type StageStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

export interface PipelineStageResult {
  stage: StageName;
  status: StageStatus;
  inputImageId: string;
  outputImageId?: string;
  error?: string;
  /** Stage-specific metrics */
  metrics: Record<string, number>;
  /** Duration in milliseconds */
  durationMs: number;
}

// ─── Pipeline Definition ─────────────────────────────────────────────────────

export interface PipelineStep {
  stepId: string;
  stage: StageName;
  /** Whether this step is enabled */
  enabled: boolean;
  /** Step-specific configuration */
  config: Record<string, unknown>;
  /** Whether failure should stop the pipeline */
  abortOnFailure: boolean;
}

export interface AssetPipelineDefinition {
  pipelineId: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  /** Whether to validate the pipeline definition */
  validateOnCreate: boolean;
  /** Global timeout in milliseconds */
  timeoutMs: number;
}

export const DEFAULT_PIPELINE: AssetPipelineDefinition = {
  pipelineId: 'default',
  name: 'Default Image Pipeline',
  description: 'Load → validate → compress → convert → quality assess',
  steps: [
    { stepId: 'validate', stage: 'validate', enabled: true, config: {}, abortOnFailure: true },
    { stepId: 'resize', stage: 'resize', enabled: false, config: {}, abortOnFailure: false },
    { stepId: 'compress', stage: 'compress', enabled: true, config: { quality: 0.85 }, abortOnFailure: false },
    { stepId: 'convert', stage: 'convert-format', enabled: true, config: { format: 'image/png' }, abortOnFailure: false },
    { stepId: 'assess', stage: 'assess-quality', enabled: true, config: {}, abortOnFailure: false },
  ],
  validateOnCreate: true,
  timeoutMs: 30_000,
};

// ─── Stage Configs ───────────────────────────────────────────────────────────

export interface ResizeConfig {
  /** Target width (0 = auto from aspect ratio) */
  width: number;
  /** Target height (0 = auto from aspect ratio) */
  height: number;
  /** Resize algorithm */
  algorithm: 'nearest' | 'bilinear' | 'bicubic' | 'lanczos';
  /** Whether to maintain aspect ratio */
  maintainAspectRatio: boolean;
}

export interface CropConfig {
  /** Crop origin: 'center' | 'top-left' | { x, y } */
  origin: 'center' | 'top-left' | { x: number; y: number };
  /** Crop width (0 = remaining width) */
  width: number;
  /** Crop height (0 = remaining height) */
  height: number;
}

export interface ColorCorrectConfig {
  /** Brightness adjustment (-1 to 1) */
  brightness?: number;
  /** Contrast adjustment (-1 to 1) */
  contrast?: number;
  /** Saturation adjustment (-1 to 1) */
  saturation?: number;
  /** Gamma correction */
  gamma?: number;
  /** Hue rotation in degrees */
  hue?: number;
}

export interface CompressConfig {
  /** Quality level (0–1) */
  quality: number;
  /** Whether to optimize for size */
  optimizeSize: boolean;
  /** Maximum output size in bytes */
  maxOutputBytes?: number;
}

export type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/avif' | 'image/bmp';

export interface ConvertFormatConfig {
  /** Target MIME type */
  format: OutputFormat;
  /** Whether to strip metadata */
  stripMetadata: boolean;
}

// ─── Quality Assessment ──────────────────────────────────────────────────────

export interface QualityAssessment {
  imageId: string;
  /** Overall quality score (0–100) */
  overallScore: number;
  /** Per-dimension scores */
  dimensions: {
    sharpness: number;
    contrast: number;
    exposure: number;
    colorBalance: number;
    noise: number;
    artifacts: number;
  };
  /** Detected issues */
  issues: QualityIssue[];
  /** Whether the image meets quality threshold */
  passes: boolean;
  /** Assessment duration in milliseconds */
  durationMs: number;
}

export interface QualityIssue {
  severity: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  affectedArea?: { x: number; y: number; width: number; height: number };
}

export interface QualityThresholds {
  minOverallScore: number;
  maxNoiseLevel: number;
  minSharpness: number;
  maxArtifactCount: number;
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  minOverallScore: 60,
  maxNoiseLevel: 0.5,
  minSharpness: 0.3,
  maxArtifactCount: 5,
};

// ─── Pipeline Execution ──────────────────────────────────────────────────────

export type PipelineExecutionStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface PipelineExecution {
  executionId: string;
  pipelineId: string;
  status: PipelineExecutionStatus;
  /** Input image */
  inputImage: PipelineImage;
  /** Output image (null until complete) */
  outputImage: PipelineImage | null;
  /** Step results in execution order */
  stepResults: PipelineStageResult[];
  /** Final quality assessment */
  qualityAssessment?: QualityAssessment;
  /** Error message (on failure) */
  error?: string;
  startedAt: string;
  completedAt?: string;
  totalDurationMs: number;
}

// ─── Pipeline Engine ─────────────────────────────────────────────────────────

export interface PipelineEngine {
  /** Execute a pipeline on an image */
  execute(pipeline: AssetPipelineDefinition, image: PipelineImage): Promise<PipelineExecution>;

  /** Execute a single stage on an image */
  executeStage(
    stage: StageName,
    image: PipelineImage,
    config: Record<string, unknown>,
  ): Promise<{ image: PipelineImage; metrics: Record<string, number> }>;

  /** Validate a pipeline definition */
  validate(pipeline: AssetPipelineDefinition): Promise<ValidationResult>;

  /** Create a pipeline from preset */
  fromPreset(preset: 'default' | 'thumbnail' | 'web-optimized' | 'high-quality'): AssetPipelineDefinition;
}

// ─── Validation ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ code: string; message: string; stepId?: string }>;
  warnings: Array<{ code: string; message: string; stepId?: string }>;
}

// ─── Image Format Utils ──────────────────────────────────────────────────────

export interface FormatInfo {
  mimeType: OutputFormat;
  extension: string;
  supportsTransparency: boolean;
  supportsLossless: boolean;
  supportsQuality: boolean;
  typicalCompressionRatio: number; // 1 = uncompressed
}

export const FORMAT_INFO: Record<OutputFormat, FormatInfo> = {
  'image/png': { mimeType: 'image/png', extension: '.png', supportsTransparency: true, supportsLossless: true, supportsQuality: false, typicalCompressionRatio: 0.5 },
  'image/jpeg': { mimeType: 'image/jpeg', extension: '.jpg', supportsTransparency: false, supportsLossless: false, supportsQuality: true, typicalCompressionRatio: 0.15 },
  'image/webp': { mimeType: 'image/webp', extension: '.webp', supportsTransparency: true, supportsLossless: true, supportsQuality: true, typicalCompressionRatio: 0.25 },
  'image/avif': { mimeType: 'image/avif', extension: '.avif', supportsTransparency: true, supportsLossless: true, supportsQuality: true, typicalCompressionRatio: 0.1 },
  'image/bmp': { mimeType: 'image/bmp', extension: '.bmp', supportsTransparency: false, supportsLossless: true, supportsQuality: false, typicalCompressionRatio: 1.0 },
};

// ─── Cache ───────────────────────────────────────────────────────────────────

export interface PipelineCacheEntry {
  key: string; // hash of input + pipeline config + step configs
  result: PipelineExecution;
  createdAt: string;
  lastAccessedAt: string;
  hitCount: number;
}
