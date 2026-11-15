/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Generation Backend Tests
 * (src/core/creative/generationBackend.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ProviderType,
  ModelSpec,
  GenerationParameters,
  DEFAULT_GENERATION_PARAMS,
  GeneratedImage,
  GenerationResult,
  GenerationProvider,
  ProviderConfig,
  GenerationBackendConfig,
  DEFAULT_BACKEND_CONFIG,
  ModelSelectionCriteria,
  ModelSelection,
  GenerationEventType,
  GenerationEvent,
  PipelineNode,
  GenerationPipeline,
} from './generationBackend';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeParams(overrides: Partial<GenerationParameters> = {}): GenerationParameters {
  return { ...DEFAULT_GENERATION_PARAMS, prompt: 'test', ...overrides };
}

function makeModel(overrides: Partial<ModelSpec> = {}): ModelSpec {
  return {
    modelId: 'test-model',
    displayName: 'Test Model',
    provider: 'stable-diffusion',
    version: '1.0',
    acceptsText: true,
    acceptsImage: false,
    outputsImage: true,
    outputsText: false,
    supportsInpainting: false,
    supportsOutpainting: false,
    supportsControlNet: false,
    supportsLoRA: false,
    supportsNegativePrompt: true,
    supportsSeed: true,
    minVRAMMB: 4000,
    estimatedLatencyMs: 2000,
    costPerGeneration: 0.05,
    description: 'A test model',
    tags: ['test'],
    ...overrides,
  };
}

function makeGeneratedImage(overrides: Partial<GeneratedImage> = {}): GeneratedImage {
  return {
    imageId: 'img-1',
    data: 'base64data',
    mimeType: 'image/png',
    width: 512,
    height: 512,
    seed: 42,
    prompt: 'a test',
    generatedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    provider: 'stable-diffusion',
    modelId: 'test-model',
    parameters: makeParams(),
    metadata: {},
    latencyMs: 1500,
    ...overrides,
  };
}

// ─── Default Parameters ──────────────────────────────────────────────────────

test('DEFAULT_GENERATION_PARAMS has sensible defaults', () => {
  assert.equal(DEFAULT_GENERATION_PARAMS.batchSize, 1);
  assert.equal(DEFAULT_GENERATION_PARAMS.width, 1024);
  assert.equal(DEFAULT_GENERATION_PARAMS.height, 1024);
  assert.equal(DEFAULT_GENERATION_PARAMS.cfgScale, 7.0);
  assert.equal(DEFAULT_GENERATION_PARAMS.steps, 20);
  assert.equal(DEFAULT_GENERATION_PARAMS.sampler, 'euler');
  assert.equal(DEFAULT_GENERATION_PARAMS.scheduler, 'normal');
  assert.deepEqual(DEFAULT_GENERATION_PARAMS.extra, {});
});

test('makeParams merges overrides correctly', () => {
  const p = makeParams({ width: 512, height: 512, seed: 123 });
  assert.equal(p.width, 512);
  assert.equal(p.height, 512);
  assert.equal(p.seed, 123);
  assert.equal(p.batchSize, 1); // default preserved
  assert.equal(p.steps, 20); // default preserved
});

// ─── ModelSpec ───────────────────────────────────────────────────────────────

test('makeModel creates a model with required fields', () => {
  const m = makeModel();
  assert.equal(m.modelId, 'test-model');
  assert.equal(m.provider, 'stable-diffusion');
  assert.equal(m.acceptsText, true);
  assert.equal(m.outputsImage, true);
  assert.equal(m.minVRAMMB, 4000);
});

test('makeModel can override provider and capabilities', () => {
  const m = makeModel({ provider: 'flux', supportsInpainting: true, minVRAMMB: 8000 });
  assert.equal(m.provider, 'flux');
  assert.equal(m.supportsInpainting, true);
  assert.equal(m.minVRAMMB, 8000);
});

// ─── GeneratedImage ──────────────────────────────────────────────────────────

test('makeGeneratedImage creates valid image', () => {
  const img = makeGeneratedImage();
  assert.equal(img.imageId, 'img-1');
  assert.equal(img.width, 512);
  assert.equal(img.height, 512);
  assert.equal(img.seed, 42);
  assert.equal(img.provider, 'stable-diffusion');
  assert.ok(img.generatedAt.length > 0);
});

// ─── ProviderType ────────────────────────────────────────────────────────────

test('all ProviderType values are valid', () => {
  const validProviders: ProviderType[] = [
    'stable-diffusion',
    'dall-e',
    'midjourney',
    'flux',
    'custom',
  ];
  for (const p of validProviders) {
    assert.ok(p, `${p} should be a valid ProviderType`);
  }
});

// ─── GenerationProvider Interface ────────────────────────────────────────────

test('a GenerationProvider can be implemented and invoked', async () => {
  const provider: GenerationProvider = {
    providerType: 'custom',
    displayName: 'Test Provider',
    isAvailable: true,
    async initialize() {},
    async listModels() {
      return [makeModel()];
    },
    async generate(params) {
      return {
        success: true,
        images: [makeGeneratedImage({ seed: params.seed ?? 0 })],
        totalTimeMs: 100,
        providerUsed: 'custom',
        modelUsed: 'test-model',
      };
    },
    async healthCheck() {
      return true;
    },
    async dispose() {},
  };

  assert.equal(provider.providerType, 'custom');
  assert.ok(provider.isAvailable);

  const result = await provider.generate(makeParams({ seed: 99 }));
  assert.ok(result.success);
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].seed, 99);
});

test('unavailable provider reports unavailabilityReason', async () => {
  const provider: GenerationProvider = {
    providerType: 'dall-e',
    displayName: 'Unavailable Provider',
    isAvailable: false,
    unavailabilityReason: 'API key not configured',
    async initialize() {},
    async listModels() { return []; },
    async generate() { throw new Error('Provider not available'); },
    async healthCheck() { return false; },
    async dispose() {},
  };

  assert.ok(!provider.isAvailable);
  assert.equal(provider.unavailabilityReason, 'API key not configured');
});

test('provider.healthCheck returns false when unavailable', async () => {
  const provider: GenerationProvider = {
    providerType: 'flux',
    displayName: 'Test Flux',
    isAvailable: false,
    async initialize() {},
    async listModels() { return []; },
    async generate() { throw new Error('down'); },
    async healthCheck() { return false; },
    async dispose() {},
  };
  assert.ok(!(await provider.healthCheck()));
});

// ─── DEFAULT_BACKEND_CONFIG ──────────────────────────────────────────────────

test('DEFAULT_BACKEND_CONFIG has sensible defaults', () => {
  assert.equal(DEFAULT_BACKEND_CONFIG.defaultProvider, 'stable-diffusion');
  assert.equal(DEFAULT_BACKEND_CONFIG.maxRetries, 3);
  assert.equal(DEFAULT_BACKEND_CONFIG.retryDelayMs, 1000);
  assert.equal(DEFAULT_BACKEND_CONFIG.modelPolicy, 'balanced');
  assert.ok(DEFAULT_BACKEND_CONFIG.enableFallback);
  assert.deepEqual(DEFAULT_BACKEND_CONFIG.providers, []);
});

test('ProviderConfig allows priority ordering', () => {
  const configs: ProviderConfig[] = [
    { providerType: 'flux', displayName: 'Flux', config: {}, priority: 1, enabled: true },
    { providerType: 'stable-diffusion', displayName: 'SD', config: {}, priority: 2, enabled: true },
    { providerType: 'dall-e', displayName: 'DALL-E', config: {}, priority: 3, enabled: false },
  ];
  assert.equal(configs[0].priority, 1);
  assert.ok(configs[0].enabled);
  assert.ok(!configs[2].enabled);
});

// ─── Model Selection ─────────────────────────────────────────────────────────

test('ModelSelectionCriteria accepts all capability filters', () => {
  const criteria: ModelSelectionCriteria = {
    preferredProvider: 'flux',
    minQuality: 80,
    maxLatencyMs: 5000,
    maxCost: 0.10,
    requiredCapabilities: ['inpainting', 'lora', 'seed'],
    requiredTags: ['fast'],
    excludeModels: ['old-model'],
  };
  assert.equal(criteria.preferredProvider, 'flux');
  assert.equal(criteria.minQuality, 80);
  assert.deepEqual(criteria.requiredCapabilities, ['inpainting', 'lora', 'seed']);
});

test('ModelSelection records rationale', () => {
  const selection: ModelSelection = {
    model: makeModel(),
    provider: 'flux',
    score: 95,
    rationale: 'Highest quality score meeting latency requirement',
  };
  assert.equal(selection.score, 95);
  assert.ok(selection.rationale.length > 0);
});

// ─── Generation Result ───────────────────────────────────────────────────────

test('GenerationResult with success=true contains images', () => {
  const result: GenerationResult = {
    success: true,
    images: [makeGeneratedImage(), makeGeneratedImage()],
    totalTimeMs: 2500,
    providerUsed: 'flux',
    modelUsed: 'flux-dev',
  };
  assert.ok(result.success);
  assert.equal(result.images.length, 2);
  assert.equal(result.providerUsed, 'flux');
});

test('GenerationResult with success=false contains error', () => {
  const result: GenerationResult = {
    success: false,
    images: [],
    error: 'Rate limit exceeded',
    errorCode: 'RATE_LIMIT',
    totalTimeMs: 100,
    providerUsed: 'dall-e',
    modelUsed: 'dall-e-3',
  };
  assert.ok(!result.success);
  assert.equal(result.error, 'Rate limit exceeded');
  assert.equal(result.errorCode, 'RATE_LIMIT');
});

// ─── Pipeline Node ───────────────────────────────────────────────────────────

test('PipelineNode describes a generation step', () => {
  const node: PipelineNode = {
    nodeId: 'txt2img-1',
    nodeType: 'text-to-image',
    provider: 'flux',
    modelId: 'flux-dev',
    parameters: makeParams(),
    inputSource: 'external',
    externalInput: 'https://example.com/ref.png',
  };
  assert.equal(node.nodeType, 'text-to-image');
  assert.equal(node.inputSource, 'external');
});

// ─── GenerationPipeline ──────────────────────────────────────────────────────

test('GenerationPipeline captures execution order and validation state', () => {
  const pipeline: GenerationPipeline = {
    pipelineId: 'pipe-1',
    name: 'Test Pipeline',
    description: 'A simple pipeline',
    nodes: [],
    executionOrder: ['load', 'generate', 'save'],
    validated: true,
    validationErrors: [],
  };
  assert.equal(pipeline.pipelineId, 'pipe-1');
  assert.ok(pipeline.validated);
  assert.deepEqual(pipeline.validationErrors, []);
});

test('GenerationPipeline with validation errors', () => {
  const pipeline: GenerationPipeline = {
    pipelineId: 'pipe-2',
    name: 'Broken Pipeline',
    description: 'Has errors',
    nodes: [],
    executionOrder: [],
    validated: false,
    validationErrors: ['Node "upscale" has missing input', 'Cycle detected at node "save"'],
  };
  assert.ok(!pipeline.validated);
  assert.equal(pipeline.validationErrors.length, 2);
});

// ─── Generation Event ────────────────────────────────────────────────────────

test('GenerationEvent carries all required fields', () => {
  const event: GenerationEvent = {
    type: 'generation:success',
    timestamp: new Date('2025-01-01T00:00:00Z').toISOString(),
    provider: 'flux',
    modelId: 'flux-dev',
    generationId: 'gen-1',
    latencyMs: 2500,
    detail: { steps: 20, seed: 42 },
  };
  assert.equal(event.type, 'generation:success');
  assert.equal(event.provider, 'flux');
  assert.equal(event.latencyMs, 2500);
  assert.deepEqual(event.detail, { steps: 20, seed: 42 });
});

// ─── Backend Config Override ─────────────────────────────────────────────────

test('custom backend config overrides defaults', () => {
  const config: GenerationBackendConfig = {
    ...DEFAULT_BACKEND_CONFIG,
    defaultProvider: 'dall-e',
    maxRetries: 5,
    modelPolicy: 'prefer-quality',
  };
  assert.equal(config.defaultProvider, 'dall-e');
  assert.equal(config.maxRetries, 5);
  assert.equal(config.modelPolicy, 'prefer-quality');
  assert.ok(config.enableFallback); // preserved from defaults
});
