/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Asset Manager
 * (src/core/creative/assetManager.ts)
 *
 * Manages generated visual assets with storage, metadata tracking,
 * version management, and cache management.
 */

// ─── Asset Types ─────────────────────────────────────────────────────────────

export type AssetKind = 'image' | 'model-3d' | 'texture' | 'video' | 'audio' | 'document';

export interface Asset {
  assetId: string;
  kind: AssetKind;
  /** Stable content hash (SHA-256) for dedup and integrity */
  contentHash: string;
  /** MIME type */
  mimeType: string;
  /** Size in bytes */
  sizeBytes: number;
  /** Storage location (path or URI) */
  storageUri: string;
  /** Human-readable label */
  label: string;
  /** Free-form tags */
  tags: string[];
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last access timestamp (ISO 8601) */
  lastAccessedAt: string;
  /** Number of times accessed */
  accessCount: number;
  /** Whether this asset is archived */
  archived: boolean;
  /** Metadata key-value pairs */
  metadata: Record<string, unknown>;
  /** Provider that generated this asset */
  provider?: string;
  /** Model used */
  modelId?: string;
  /** Generation prompt */
  prompt?: string;
  /** Dimensions for image/video assets */
  dimensions?: { width: number; height: number };
  /** Format for image/video assets */
  format?: string;
  /** Custom properties */
  properties: Record<string, unknown>;
}

// ─── Versioning ──────────────────────────────────────────────────────────────

export interface AssetVersion {
  versionId: string;
  assetId: string;
  version: string;
  contentHash: string;
  storageUri: string;
  sizeBytes: number;
  createdAt: string;
  changeSummary: string;
  metadata: Record<string, unknown>;
}

export interface VersionComparison {
  versionA: string;
  versionB: string;
  sameContent: boolean;
  sizeDeltaBytes: number;
  metadataDiffs: Array<{ key: string; valueA: unknown; valueB: unknown }>;
}

// ─── Storage Backend ─────────────────────────────────────────────────────────

export interface StorageBackend {
  readonly name: string;
  /** Write a buffer, return the storage URI */
  write(assetId: string, data: Buffer, mimeType: string): Promise<string>;
  /** Read data from storage URI */
  read(uri: string): Promise<Buffer>;
  /** Delete data at storage URI */
  delete(uri: string): Promise<void>;
  /** Check if a URI exists */
  exists(uri: string): Promise<boolean>;
  /** Get metadata for a stored item */
  getMetadata(uri: string): Promise<Record<string, unknown>>;
}

// ─── Cache Management ────────────────────────────────────────────────────────

export interface CachePolicy {
  /** Maximum total storage in bytes */
  maxStorageBytes: number;
  /** Maximum number of items */
  maxItems: number;
  /** Eviction strategy */
  evictionStrategy: 'lru' | 'lfu' | 'fifo' | 'ttl';
  /** Default TTL in milliseconds (for ttl strategy) */
  defaultTTLMs: number;
  /** Whether to evict on write when full */
  evictOnWrite: boolean;
}

export const DEFAULT_CACHE_POLICY: CachePolicy = {
  maxStorageBytes: 500 * 1024 * 1024, // 500 MB
  maxItems: 10_000,
  evictionStrategy: 'lru',
  defaultTTLMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  evictOnWrite: true,
};

export interface CacheEntry {
  assetId: string;
  uri: string;
  sizeBytes: number;
  contentHash: string;
  createdAt: string;
  lastAccessedAt: string;
  accessCount: number;
  ttlExpiresAt?: string;
}

// ─── Asset Manager Configuration ─────────────────────────────────────────────

export interface AssetManagerConfig {
  /** Root storage directory */
  rootDir: string;
  /** Storage backend to use */
  storage: StorageBackend;
  /** Cache policy */
  cache: CachePolicy;
  /** Whether to deduplicate by content hash */
  deduplicate: boolean;
  /** Whether to auto-archive old assets */
  autoArchive: boolean;
  /** Auto-archive threshold in days */
  autoArchiveAfterDays: number;
}

export const DEFAULT_ASSET_MANAGER_CONFIG: AssetManagerConfig = {
  rootDir: '.aether/assets',
  storage: { name: 'local-fs', write: async () => '', read: async () => Buffer.alloc(0), delete: async () => {}, exists: async () => false, getMetadata: async () => ({}) },
  cache: DEFAULT_CACHE_POLICY,
  deduplicate: true,
  autoArchive: true,
  autoArchiveAfterDays: 30,
};

// ─── Query / Search ──────────────────────────────────────────────────────────

export interface AssetQuery {
  /** Filter by asset kind */
  kind?: AssetKind;
  /** Filter by tags (AND logic) */
  tags?: string[];
  /** Filter by provider */
  provider?: string;
  /** Filter by model ID */
  modelId?: string;
  /** Filter by date range */
  dateRange?: { from: string; to: string };
  /** Filter by minimum size */
  minSizeBytes?: number;
  /** Filter by maximum size */
  maxSizeBytes?: number;
  /** Filter by content hash */
  contentHash?: string;
  /** Full-text search in labels and metadata */
  searchText?: string;
  /** Include archived assets */
  includeArchived: boolean;
  /** Maximum results */
  limit: number;
  /** Offset for pagination */
  offset: number;
}

export const DEFAULT_QUERY: AssetQuery = {
  includeArchived: false,
  limit: 50,
  offset: 0,
};

export interface AssetQueryResult {
  assets: Asset[];
  totalCount: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ─── Import / Export ─────────────────────────────────────────────────────────

export interface AssetImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ assetId: string; error: string }>;
}

export interface AssetExportOptions {
  /** Which asset IDs to export */
  assetIds?: string[];
  /** Query to filter assets for export */
  query?: Partial<AssetQuery>;
  /** Export format */
  format: 'json' | 'manifest';
  /** Whether to include binary data */
  includeBinary: boolean;
  /** Output directory */
  outputDir: string;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface AssetStats {
  totalAssets: number;
  totalSizeBytes: number;
  byKind: Record<AssetKind, { count: number; sizeBytes: number }>;
  byProvider: Record<string, { count: number; sizeBytes: number }>;
  archivedCount: number;
  cacheHits: number;
  cacheMisses: number;
  evictions: number;
}

// ─── Lifecycle Hooks ─────────────────────────────────────────────────────────

export type AssetLifecycleEvent =
  | 'asset:created'
  | 'asset:accessed'
  | 'asset:updated'
  | 'asset:archived'
  | 'asset:restored'
  | 'asset:deleted'
  | 'version:created'
  | 'cache:evicted';

export interface AssetLifecycleEventDetail {
  event: AssetLifecycleEvent;
  assetId: string;
  timestamp: string;
  detail?: Record<string, unknown>;
}

export type AssetLifecycleHandler = (detail: AssetLifecycleEventDetail) => void;
