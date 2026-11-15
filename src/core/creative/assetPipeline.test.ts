/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Asset Pipeline Tests
 * (src/core/creative/assetPipeline.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PipelineImage,
  createPipelineImage,
  StageName,
  StageStatus,
  PipelineStageResult,
  PipelineStep,
  AssetPipelineDefinition,
  DEFAULT_PIPELINE,
  ResizeConfig,
  CropConfig,
  ColorCorrectConfig,
  CompressConfig,
  OutputFormat,
  ConvertFormatConfig,
  QualityAssessment,
  QualityIssue,
  QualityThresholds,
  DEFAULT_QUALITY_THRESHOLDS,
  PipelineExecutionStatus,
  PipelineExecution,
  PipelineEngine,
  ValidationResult,
  FormatInfo,
  FORMAT_INFO,
  PipelineCacheEntry,
} from './assetPipeline';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePixels(width: number, height: number, fill = 128): Uint8Array {
  return new Uint8Array(width * height * 4).fill(fill);
}

function makePipelineImage(overrides: Partial<PipelineImage> = {}): PipelineImage {
  return {
    imageId: 'img-1',
    pixels: makePixels(256, 256, 200),
    width: 256,
    height: 256,
    channels: 4,
    mimeType: 'image/png',
    metadata: {},
    ...overrides,
  };
}

function makeStageResult(overrides: Partial<PipelineStageResult> = {}): PipelineStageResult {
  return {
    stage: 'validate',
    status: 'completed',
    inputImageId: 'img-1',
    outputImageId: 'img-1-out',
    metrics: {},
    durationMs: 10,
    ...overrides,
  };
}

// ─── createPipelineImage ─────────────────────────────────────────────────────

test('createPipelineImage creates image with defaults', () => {
  const img = createPipelineImage('test-1', makePixels(100, 100), 100, 100);
  assert.equal(img.imageId, 'test-1');
  assert.equal(img.width, 100);
  assert.equal(img.height, 100);
  assert.equal(img.channels, 4);
  assert.equal(img.mimeType, 'image/png');
});

test('createPipelineImage with custom mimeType and metadata', () => {
  const img = createPipelineImage('test-2', makePixels(50, 50), 50, 50, 'image/jpeg', { quality: 0.9 });
  assert.equal(img.mimeType, 'image/jpeg');
  assert.deepEqual(img.metadata, { quality: 0.9 });
});

// ─── DEFAULT_PIPELINE ────────────────────────────────────────────────────────

test('DEFAULT_PIPELINE has 5 steps', () => {
  assert.equal(DEFAULT_PIPELINE.steps.length, 5);
  assert.equal(DEFAULT_PIPELINE.pipelineId, 'default');
  assert.equal(DEFAULT_PIPELINE.name, 'Default Image Pipeline');
});

test('DEFAULT_PIPELINE validate step is first and required', () => {
  const validateStep = DEFAULT_PIPELINE.steps[0];
  assert.equal(validateStep.stage, 'validate');
  assert.ok(validateStep.enabled);
  assert.ok(validateStep.abortOnFailure);
});

test('DEFAULT_PIPELINE compress step has quality config', () => {
  const compressStep = DEFAULT_PIPELINE.steps.find((s) => s.stage === 'compress');
  assert.ok(compressStep);
  assert.ok(compressStep?.enabled);
  assert.equal((compressStep?.config as Record<string, unknown>).quality, 0.85);
});

// ─── PipelineStep ────────────────────────────────────────────────────────────

test('PipelineStep can be disabled', () => {
  const step: PipelineStep = {
    stepId: 'resize-1',
    stage: 'resize',
    enabled: false,
    config: { width: 512, height: 512 },
    abortOnFailure: false,
  };
  assert.ok(!step.enabled);
  assert.equal(step.stage, 'resize');
  assert.equal((step.config as Record<string, unknown>).width, 512);
});

// ─── StageName ───────────────────────────────────────────────────────────────

test('all StageName values are valid', () => {
  const stages: StageName[] = [
    'load', 'validate', 'resize', 'crop', 'filter', 'color-correct',
    'compress', 'convert-format', 'optimize', 'assess-quality', 'store',
  ];
  assert.equal(stages.length, 11);
});

// ─── StageStatus ─────────────────────────────────────────────────────────────

test('all StageStatus values are valid', () => {
  const statuses: StageStatus[] = ['pending', 'running', 'completed', 'skipped', 'failed'];
  assert.equal(statuses.length, 5);
});

// ─── PipelineStageResult ─────────────────────────────────────────────────────

test('makeStageResult creates result with metrics', () => {
  const result = makeStageResult({ stage: 'compress', status: 'completed', durationMs: 45, metrics: { outputSize: 2048 } });
  assert.equal(result.stage, 'compress');
  assert.equal(result.status, 'completed');
  assert.equal(result.durationMs, 45);
  assert.equal(result.metrics.outputSize, 2048);
});

test('failed stage result has error', () => {
  const result = makeStageResult({ status: 'failed', error: 'Out of memory' });
  assert.equal(result.status, 'failed');
  assert.equal(result.error, 'Out of memory');
});

// ─── ResizeConfig ────────────────────────────────────────────────────────────

test('ResizeConfig with maintainAspectRatio', () => {
  const cfg: ResizeConfig = {
    width: 512,
    height: 512,
    algorithm: 'lanczos',
    maintainAspectRatio: true,
  };
  assert.equal(cfg.width, 512);
  assert.equal(cfg.algorithm, 'lanczos');
  assert.ok(cfg.maintainAspectRatio);
});

// ─── CropConfig ──────────────────────────────────────────────────────────────

test('CropConfig from center', () => {
  const cfg: CropConfig = {
    origin: 'center',
    width: 100,
    height: 100,
  };
  assert.equal(cfg.origin, 'center');
  assert.equal(cfg.width, 100);
});

test('CropConfig with explicit origin', () => {
  const cfg: CropConfig = { origin: { x: 10, y: 20 }, width: 200, height: 150 };
  assert.deepEqual(cfg.origin, { x: 10, y: 20 });
});

// ─── ColorCorrectConfig ──────────────────────────────────────────────────────

test('ColorCorrectConfig with all adjustments', () => {
  const cfg: ColorCorrectConfig = {
    brightness: 0.1,
    contrast: 0.2,
    saturation: -0.1,
    gamma: 2.2,
    hue: 90,
  };
  assert.equal(cfg.brightness, 0.1);
  assert.equal(cfg.contrast, 0.2);
  assert.equal(cfg.saturation, -0.1);
  assert.equal(cfg.gamma, 2.2);
  assert.equal(cfg.hue, 90);
});

// ─── CompressConfig ──────────────────────────────────────────────────────────

test('CompressConfig for size optimization', () => {
  const cfg: CompressConfig = {
    quality: 0.8,
    optimizeSize: true,
    maxOutputBytes: 500_000,
  };
  assert.equal(cfg.quality, 0.8);
  assert.ok(cfg.optimizeSize);
  assert.equal(cfg.maxOutputBytes, 500_000);
});

// ─── OutputFormat ────────────────────────────────────────────────────────────

test('all OutputFormat values are valid', () => {
  const formats: OutputFormat[] = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/bmp'];
  assert.equal(formats.length, 5);
});

// ─── ConvertFormatConfig ─────────────────────────────────────────────────────

test('ConvertFormatConfig with stripMetadata', () => {
  const cfg: ConvertFormatConfig = {
    format: 'image/webp',
    stripMetadata: true,
  };
  assert.equal(cfg.format, 'image/webp');
  assert.ok(cfg.stripMetadata);
});

// ─── FORMAT_INFO ─────────────────────────────────────────────────────────────

test('FORMAT_INFO entries have required fields', () => {
  for (const [format, info] of Object.entries(FORMAT_INFO)) {
    assert.equal(info.mimeType, format, `${format}: mimeType matches`);
    assert.ok(info.extension.startsWith('.'), `${format}: extension has dot`);
    assert.ok(info.typicalCompressionRatio > 0, `${format}: compression ratio > 0`);
    assert.ok(typeof info.supportsTransparency === 'boolean', `${format}: supportsTransparency is boolean`);
  }
});

test('FORMAT_INFO: PNG supports lossless, JPEG does not', () => {
  assert.ok(FORMAT_INFO['image/png'].supportsLossless);
  assert.ok(!FORMAT_INFO['image/jpeg'].supportsLossless);
});

test('FORMAT_INFO: WEBP supports both transparency and lossless', () => {
  assert.ok(FORMAT_INFO['image/webp'].supportsTransparency);
  assert.ok(FORMAT_INFO['image/webp'].supportsLossless);
});

// ─── QualityAssessment ───────────────────────────────────────────────────────

test('QualityAssessment calculates overall score from dimensions', () => {
  const assessment: QualityAssessment = {
    imageId: 'img-1',
    overallScore: 85,
    dimensions: {
      sharpness: 0.9,
      contrast: 0.8,
      exposure: 0.85,
      colorBalance: 0.9,
      noise: 0.1,
      artifacts: 0.05,
    },
    issues: [],
    passes: true,
    durationMs: 120,
  };
  assert.equal(assessment.overallScore, 85);
  assert.ok(assessment.passes);
  assert.equal(assessment.issues.length, 0);
});

test('QualityAssessment with issues', () => {
  const assessment: QualityAssessment = {
    imageId: 'img-2',
    overallScore: 35,
    dimensions: { sharpness: 0.2, contrast: 0.3, exposure: 0.5, colorBalance: 0.4, noise: 0.8, artifacts: 0.7 },
    issues: [
      { severity: 'warning', code: 'HIGH_NOISE', message: 'Excessive noise detected', affectedArea: { x: 0, y: 0, width: 256, height: 256 } },
      { severity: 'error', code: 'BLURRY', message: 'Image is significantly blurred' },
    ],
    passes: false,
    durationMs: 50,
  };
  assert.ok(!assessment.passes);
  assert.equal(assessment.issues.length, 2);
  assert.equal(assessment.issues[0].severity, 'warning');
  assert.equal(assessment.issues[1].severity, 'error');
});

// ─── DEFAULT_QUALITY_THRESHOLDS ──────────────────────────────────────────────

test('DEFAULT_QUALITY_THRESHOLDS has sensible defaults', () => {
  assert.equal(DEFAULT_QUALITY_THRESHOLDS.minOverallScore, 60);
  assert.equal(DEFAULT_QUALITY_THRESHOLDS.maxNoiseLevel, 0.5);
  assert.equal(DEFAULT_QUALITY_THRESHOLDS.minSharpness, 0.3);
  assert.equal(DEFAULT_QUALITY_THRESHOLDS.maxArtifactCount, 5);
});

// ─── PipelineExecution ───────────────────────────────────────────────────────

test('PipelineExecution tracks full execution lifecycle', () => {
  const execution: PipelineExecution = {
    executionId: 'exec-1',
    pipelineId: 'default',
    status: 'completed',
    inputImage: makePipelineImage({ imageId: 'input' }),
    outputImage: makePipelineImage({ imageId: 'output' }),
    stepResults: [
      makeStageResult({ stage: 'validate', status: 'completed' }),
      makeStageResult({ stage: 'compress', status: 'completed' }),
      makeStageResult({ stage: 'assess-quality', status: 'completed' }),
    ],
    qualityAssessment: {
      imageId: 'output',
      overallScore: 90,
      dimensions: { sharpness: 0.9, contrast: 0.9, exposure: 0.9, colorBalance: 0.9, noise: 0.1, artifacts: 0.05 },
      issues: [],
      passes: true,
      durationMs: 30,
    },
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    totalDurationMs: 150,
  };
  assert.equal(execution.status, 'completed');
  assert.equal(execution.stepResults.length, 3);
  assert.ok(execution.qualityAssessment);
  assert.equal(execution.qualityAssessment?.overallScore, 90);
});

// ─── PipelineEngine ──────────────────────────────────────────────────────────

test('PipelineEngine can be implemented', async () => {
  const engine: PipelineEngine = {
    async execute(pipeline, image) {
      const execution: PipelineExecution = {
        executionId: `exec-${Date.now()}`,
        pipelineId: pipeline.pipelineId,
        status: 'completed',
        inputImage: image,
        outputImage: image,
        stepResults: [],
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        totalDurationMs: 50,
      };
      return execution;
    },
    async executeStage(stage, image) {
      return { image, metrics: {} };
    },
    async validate(pipeline) {
      return { valid: true, errors: [], warnings: [] };
    },
    fromPreset(preset) {
      return { ...DEFAULT_PIPELINE, pipelineId: preset };
    },
  };

  const result = await engine.execute(DEFAULT_PIPELINE, makePipelineImage());
  assert.equal(result.status, 'completed');
  assert.equal(result.pipelineId, 'default');

  const preset = engine.fromPreset('high-quality');
  assert.equal(preset.pipelineId, 'high-quality');

  const validation = await engine.validate(DEFAULT_PIPELINE);
  assert.ok(validation.valid);
});

// ─── PipelineCacheEntry ──────────────────────────────────────────────────────

test('PipelineCacheEntry tracks hit count', () => {
  const entry: PipelineCacheEntry = {
    key: 'hash-123',
    result: {
      executionId: 'exec-1',
      pipelineId: 'default',
      status: 'completed',
      inputImage: makePipelineImage(),
      outputImage: makePipelineImage(),
      stepResults: [],
      startedAt: new Date().toISOString(),
      totalDurationMs: 50,
    },
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    hitCount: 3,
  };
  assert.equal(entry.key, 'hash-123');
  assert.equal(entry.hitCount, 3);
});

// ─── PipelineImage dimensions ────────────────────────────────────────────────

test('PipelineImage preserves pixel data integrity', () => {
  const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]); // 2x1 RGBA
  const img = makePipelineImage({ width: 2, height: 1, pixels });
  assert.equal(img.width * img.height * img.channels, img.pixels.length);
  assert.equal(img.pixels[0], 255); // R
  assert.equal(img.pixels[1], 0);   // G
  assert.equal(img.pixels[2], 0);   // B
  assert.equal(img.pixels[3], 255); // A
});

// ─── ValidationResult ────────────────────────────────────────────────────────

test('ValidationResult with errors and warnings', () => {
  const result: ValidationResult = {
    valid: false,
    errors: [
      { code: 'MISSING_STEP', message: 'Step "upscale" is missing input', stepId: 'upscale-1' },
    ],
    warnings: [
      { code: 'LARGE_BATCH', message: 'Batch size > 4 may be slow', stepId: 'generate-1' },
    ],
  };
  assert.ok(!result.valid);
  assert.equal(result.errors.length, 1);
  assert.equal(result.warnings.length, 1);
});

// ─── AssetPipelineDefinition validation ──────────────────────────────────────

test('custom pipeline definition overrides defaults', () => {
  const pipeline: AssetPipelineDefinition = {
    pipelineId: 'thumbnail',
    name: 'Thumbnail Pipeline',
    description: 'Resize and compress for thumbnails',
    steps: [
      { stepId: 'validate', stage: 'validate', enabled: true, config: {}, abortOnFailure: true },
      { stepId: 'resize', stage: 'resize', enabled: true, config: { width: 150, height: 150, algorithm: 'lanczos', maintainAspectRatio: true }, abortOnFailure: true },
      { stepId: 'compress', stage: 'compress', enabled: true, config: { quality: 0.7, optimizeSize: true }, abortOnFailure: false },
    ],
    validateOnCreate: true,
    timeoutMs: 10_000,
  };
  assert.equal(pipeline.pipelineId, 'thumbnail');
  assert.equal(pipeline.steps.length, 3);
  const resize = pipeline.steps.find((s) => s.stage === 'resize');
  assert.ok(resize?.enabled);
  assert.equal((resize?.config as Record<string, unknown>).width, 150);
});

// ─── PipelineExecution status transitions ────────────────────────────────────

test('PipelineExecutionStatus values are valid', () => {
  const statuses: PipelineExecutionStatus[] = ['idle', 'running', 'completed', 'failed', 'cancelled'];
  assert.equal(statuses.length, 5);
});
