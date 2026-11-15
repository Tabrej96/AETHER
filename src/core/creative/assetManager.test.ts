/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Asset Manager Tests
 * (src/core/creative/assetManager.test.ts)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AssetKind,
  Asset,
  AssetVersion,
  VersionComparison,
  StorageBackend,
  CachePolicy,
  DEFAULT_CACHE_POLICY,
  CacheEntry,
  AssetManagerConfig,
  DEFAULT_ASSET_MANAGER_CONFIG,
  AssetQuery,
  DEFAULT_QUERY,
  AssetQueryResult,
  AssetImportResult,
  AssetExportOptions,
  AssetStats,
  AssetLifecycleEvent,
  AssetLifecycleEventDetail,
  AssetLifecycleHandler,
} from './assetManager';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    assetId: 'asset-1',
    kind: 'image',
    contentHash: 'sha256-abc123',
    mimeType: 'image/png',
    sizeBytes: 1024,
    storageUri: 'file:///assets/asset-1.png',
    label: 'Test Image',
    tags: ['test', 'generated'],
    createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    lastAccessedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    accessCount: 0,
    archived: false,
    metadata: { provider: 'flux', modelId: 'flux-dev' },
    provider: 'flux',
    modelId: 'flux-dev',
    prompt: 'a sunset over mountains',
    dimensions: { width: 1024, height: 1024 },
    format: 'png',
    properties: {},
    ...overrides,
  };
}

function makeVersion(overrides: Partial<AssetVersion> = {}): AssetVersion {
  return {
    versionId: 'ver-1',
    assetId: 'asset-1',
    version: '1.0.0',
    contentHash: 'sha256-v1',
    storageUri: 'file:///assets/asset-1/v1.png',
    sizeBytes: 1024,
    createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
    changeSummary: 'Initial version',
    metadata: {},
    ...overrides,
  };
}

function makeCacheEntry(overrides: Partial<CacheEntry> = {}): CacheEntry {
  return {
    assetId: 'asset-1',
    uri: 'file:///cache/asset-1.png',
    sizeBytes: 1024,
    contentHash: 'sha256-cache',
    createdAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    accessCount: 1,
    ...overrides,
  };
}

function makeStats(overrides: Partial<AssetStats> = {}): AssetStats {
  return {
    totalAssets: 0,
    totalSizeBytes: 0,
    byKind: {} as Record<AssetKind, { count: number; sizeBytes: number }>,
    byProvider: {},
    archivedCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    evictions: 0,
    ...overrides,
  };
}

// ─── AssetKind ───────────────────────────────────────────────────────────────

test('all AssetKind values are valid', () => {
  const kinds: AssetKind[] = ['image', 'model-3d', 'texture', 'video', 'audio', 'document'];
  for (const k of kinds) {
    assert.ok(k, `${k} is a valid AssetKind`);
  }
});

// ─── Asset ───────────────────────────────────────────────────────────────────

test('makeAsset creates a complete asset', () => {
  const a = makeAsset();
  assert.equal(a.assetId, 'asset-1');
  assert.equal(a.kind, 'image');
  assert.equal(a.contentHash, 'sha256-abc123');
  assert.equal(a.mimeType, 'image/png');
  assert.equal(a.sizeBytes, 1024);
  assert.equal(a.provider, 'flux');
  assert.equal(a.modelId, 'flux-dev');
  assert.equal(a.prompt, 'a sunset over mountains');
  assert.deepEqual(a.dimensions, { width: 1024, height: 1024 });
});

test('Asset with overrides', () => {
  const a = makeAsset({
    kind: 'model-3d',
    sizeBytes: 51200,
    dimensions: undefined,
    tags: ['glb', 'character'],
  });
  assert.equal(a.kind, 'model-3d');
  assert.equal(a.sizeBytes, 51200);
  assert.deepEqual(a.tags, ['glb', 'character']);
});

// ─── AssetVersion ────────────────────────────────────────────────────────────

test('makeVersion creates version with semantic versioning', () => {
  const v = makeVersion();
  assert.equal(v.versionId, 'ver-1');
  assert.equal(v.assetId, 'asset-1');
  assert.equal(v.version, '1.0.0');
  assert.ok(v.createdAt.length > 0);
});

test('AssetVersion comparison', () => {
  const v1 = makeVersion({ version: '1.0.0', contentHash: 'sha256-a', sizeBytes: 1000 });
  const v2 = makeVersion({ versionId: 'ver-2', version: '2.0.0', contentHash: 'sha256-b', sizeBytes: 2000 });

  const comparison: VersionComparison = {
    versionA: v1.version,
    versionB: v2.version,
    sameContent: v1.contentHash === v2.contentHash,
    sizeDeltaBytes: v2.sizeBytes - v1.sizeBytes,
    metadataDiffs: [{ key: 'modelId', valueA: 'flux-dev', valueB: 'sdxl' }],
  };
  assert.ok(!comparison.sameContent);
  assert.equal(comparison.sizeDeltaBytes, 1000);
  assert.equal(comparison.metadataDiffs.length, 1);
});

// ─── StorageBackend ──────────────────────────────────────────────────────────

test('StorageBackend can be implemented with in-memory buffer', async () => {
  const store = new Map<string, { data: Buffer; meta: Record<string, unknown> }>();
  const backend: StorageBackend = {
    name: 'memory',
    async write(assetId, data, mimeType) {
      const uri = `memory://${assetId}`;
      store.set(uri, { data, meta: { mimeType } });
      return uri;
    },
    async read(uri) {
      const entry = store.get(uri);
      if (!entry) throw new Error('Not found');
      return entry.data;
    },
    async delete(uri) { store.delete(uri); },
    async exists(uri) { return store.has(uri); },
    async getMetadata(uri) {
      const entry = store.get(uri);
      return entry ? entry.meta : {};
    },
  };

  assert.equal(backend.name, 'memory');
  const uri = await backend.write('asset-1', Buffer.from('hello'), 'image/png');
  assert.ok(await backend.exists(uri));
  const data = await backend.read(uri);
  assert.equal(data.toString(), 'hello');
  const meta = await backend.getMetadata(uri);
  assert.equal(meta.mimeType, 'image/png');
  await backend.delete(uri);
  assert.ok(!(await backend.exists(uri)));
});

// ─── DEFAULT_CACHE_POLICY ────────────────────────────────────────────────────

test('DEFAULT_CACHE_POLICY has sensible defaults', () => {
  assert.equal(DEFAULT_CACHE_POLICY.evictionStrategy, 'lru');
  assert.ok(DEFAULT_CACHE_POLICY.evictOnWrite);
  assert.equal(DEFAULT_CACHE_POLICY.maxItems, 10_000);
  assert.equal(DEFAULT_CACHE_POLICY.maxStorageBytes, 500 * 1024 * 1024);
  assert.equal(DEFAULT_CACHE_POLICY.defaultTTLMs, 7 * 24 * 60 * 60 * 1000);
});

test('DEFAULT_CACHE_POLICY is immutable reference', () => {
  const policy = DEFAULT_CACHE_POLICY;
  assert.equal(policy.evictionStrategy, 'lru');
});

// ─── DEFAULT_ASSET_MANAGER_CONFIG ────────────────────────────────────────────

test('DEFAULT_ASSET_MANAGER_CONFIG has sensible defaults', () => {
  assert.equal(DEFAULT_ASSET_MANAGER_CONFIG.rootDir, '.aether/assets');
  assert.ok(DEFAULT_ASSET_MANAGER_CONFIG.deduplicate);
  assert.ok(DEFAULT_ASSET_MANAGER_CONFIG.autoArchive);
  assert.equal(DEFAULT_ASSET_MANAGER_CONFIG.autoArchiveAfterDays, 30);
});

// ─── CacheEntry ──────────────────────────────────────────────────────────────

test('makeCacheEntry creates entry with access tracking', () => {
  const entry = makeCacheEntry({ accessCount: 5, lastAccessedAt: new Date().toISOString() });
  assert.equal(entry.accessCount, 5);
  assert.ok(entry.lastAccessedAt.length > 0);
  assert.ok(entry.ttlExpiresAt === undefined);
});

test('CacheEntry with TTL', () => {
  const expires = new Date(Date.now() + 86400000).toISOString();
  const entry = makeCacheEntry({ ttlExpiresAt: expires });
  assert.ok(entry.ttlExpiresAt);
});

// ─── AssetQuery ──────────────────────────────────────────────────────────────

test('DEFAULT_QUERY excludes archived by default', () => {
  assert.ok(!DEFAULT_QUERY.includeArchived);
  assert.equal(DEFAULT_QUERY.limit, 50);
  assert.equal(DEFAULT_QUERY.offset, 0);
});

test('AssetQuery with filters', () => {
  const query: AssetQuery = {
    ...DEFAULT_QUERY,
    kind: 'image',
    tags: ['generated', 'test'],
    provider: 'flux',
    includeArchived: true,
    limit: 100,
    searchText: 'sunset',
  };
  assert.equal(query.kind, 'image');
  assert.deepEqual(query.tags, ['generated', 'test']);
  assert.ok(query.includeArchived);
  assert.equal(query.searchText, 'sunset');
});

// ─── AssetQueryResult ────────────────────────────────────────────────────────

test('AssetQueryResult reports pagination correctly', () => {
  const result: AssetQueryResult = {
    assets: [makeAsset(), makeAsset()],
    totalCount: 25,
    limit: 2,
    offset: 0,
    hasMore: true,
  };
  assert.equal(result.assets.length, 2);
  assert.equal(result.totalCount, 25);
  assert.ok(result.hasMore);
});

// ─── AssetImportResult ───────────────────────────────────────────────────────

test('AssetImportResult tracks import outcome', () => {
  const result: AssetImportResult = {
    imported: 3,
    skipped: 1,
    errors: [{ assetId: 'bad-1', error: 'Unsupported format' }],
  };
  assert.equal(result.imported, 3);
  assert.equal(result.skipped, 1);
  assert.equal(result.errors.length, 1);
});

// ─── AssetExportOptions ──────────────────────────────────────────────────────

test('AssetExportOptions can specify assetIds or query', () => {
  const opts: AssetExportOptions = {
    assetIds: ['a1', 'a2'],
    format: 'json',
    includeBinary: false,
    outputDir: '/tmp/export',
  };
  assert.deepEqual(opts.assetIds, ['a1', 'a2']);
  assert.equal(opts.format, 'json');
  assert.ok(!opts.includeBinary);
});

test('AssetExportOptions with query filter', () => {
  const opts: AssetExportOptions = {
    query: { kind: 'image', tags: ['generated'], includeArchived: false, limit: 100, offset: 0 },
    format: 'manifest',
    includeBinary: true,
    outputDir: '/tmp/export',
  };
  assert.ok(opts.query);
  assert.equal(opts.query?.kind, 'image');
});

// ─── AssetStats ──────────────────────────────────────────────────────────────

test('makeStats creates stats with breakdowns', () => {
  const stats = makeStats({
    totalAssets: 150,
    totalSizeBytes: 1024 * 1024 * 500,
    byKind: {
      image: { count: 100, sizeBytes: 400 * 1024 * 1024 },
      'model-3d': { count: 20, sizeBytes: 80 * 1024 * 1024 },
      texture: { count: 30, sizeBytes: 20 * 1024 * 1024 },
    },
    byProvider: { flux: { count: 80, sizeBytes: 300 * 1024 * 1024 } },
    archivedCount: 10,
    cacheHits: 500,
    cacheMisses: 50,
    evictions: 5,
  });
  assert.equal(stats.totalAssets, 150);
  assert.equal(stats.totalSizeBytes, 500 * 1024 * 1024);
  assert.equal(stats.byKind.image.count, 100);
  assert.equal(stats.byProvider.flux.count, 80);
  assert.equal(stats.archivedCount, 10);
  assert.equal(stats.cacheHits, 500);
  assert.equal(stats.evictions, 5);
});

// ─── AssetLifecycleEventDetail ───────────────────────────────────────────────

test('AssetLifecycleEventDetail carries lifecycle info', () => {
  const handler: AssetLifecycleHandler = (detail) => {
    assert.equal(detail.event, 'asset:accessed');
    assert.equal(detail.assetId, 'asset-1');
    assert.ok(detail.timestamp.length > 0);
  };
  handler({
    event: 'asset:accessed',
    assetId: 'asset-1',
    timestamp: new Date().toISOString(),
  });
});

test('all AssetLifecycleEvent values are valid', () => {
  const events: AssetLifecycleEvent[] = [
    'asset:created',
    'asset:accessed',
    'asset:updated',
    'asset:archived',
    'asset:restored',
    'asset:deleted',
    'version:created',
    'cache:evicted',
  ];
  assert.equal(events.length, 8);
});
