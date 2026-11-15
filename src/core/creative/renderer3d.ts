/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — 3D Rendering Frontend
 * (src/core/creative/renderer3d.ts)
 *
 * Scene management, camera, lighting, materials, model loading and
 * manipulation — designed to produce data structures compatible with
 * Three.js (without importing Three.js directly, keeping AETHER
 * lightweight).
 *
 * Inspired by mrdoob/three.js (MIT) — scene graph, transform hierarchy,
 * material system, and renderer state model.
 */

// ─── Math Primitives ─────────────────────────────────────────────────────────

export type Vec3 = [number, number, number];
export type Vec2 = [number, number];
export type Quat = [number, number, number, number]; // [x, y, z, w]
export type ColorRGB = [number, number, number]; // 0–1 range
export type ColorHex = number;

export const ZERO_V3: Vec3 = [0, 0, 0];
export const ONE_V3: Vec3 = [1, 1, 1];
export const UP_V3: Vec3 = [0, 1, 0];

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vec3Scale(v: Vec3, s: number): Vec3 {
  return [v[0] * s, v[1] * s, v[2] * s];
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function vec3Length(v: Vec3): number {
  return Math.sqrt(vec3Dot(v, v));
}

export function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len === 0) return [0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function rgbToHex([r, g, b]: ColorRGB): ColorHex {
  return ((Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255)) >>> 0;
}

export function hexToRgb(hex: ColorHex): ColorRGB {
  return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255];
}

// ─── Transform ───────────────────────────────────────────────────────────────

export interface Transform {
  position: Vec3;
  rotation: Vec3; // Euler angles in radians
  scale: Vec3;
}

export const DEFAULT_TRANSFORM: Transform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
};

// ─── Material ────────────────────────────────────────────────────────────────

export type MaterialType = 'standard' | 'phong' | 'lambert' | 'basic' | 'physical';

export interface Material {
  materialId: string;
  type: MaterialType;
  /** Base color (sRGB, 0–1) */
  color: ColorRGB;
  /** Opacity (0–1) */
  opacity: number;
  /** Whether the material is transparent */
  transparent: boolean;
  /** Whether to render both sides */
  doubleSided: boolean;
  /** Flat shading */
  flatShading: boolean;
  /** Wireframe render */
  wireframe: boolean;
  /** Physical material properties */
  roughness?: number;
  metalness?: number;
  /** Phong/Lambert properties */
  specular?: ColorRGB;
  shininess?: number;
  /** Emissive color */
  emissive?: ColorRGB;
  emissiveIntensity?: number;
  /** Normal map factor */
  normalScale?: number;
  /** Alpha map factor */
  alphaMap?: string;
  /** Ambient occlusion factor */
  aoMap?: string;
  aoMapIntensity?: number;
}

export const DEFAULT_MATERIAL: Material = {
  materialId: '',
  type: 'standard',
  color: [1, 1, 1],
  opacity: 1,
  transparent: false,
  doubleSided: false,
  flatShading: false,
  wireframe: false,
  roughness: 0.5,
  metalness: 0.0,
};

// ─── Geometry ────────────────────────────────────────────────────────────────

export type GeometryType = 'box' | 'sphere' | 'plane' | 'cylinder' | 'cone' | 'torus' | 'custom';

export interface Geometry {
  geometryId: string;
  type: GeometryType;
  /** Bounding box */
  boundingBox: { min: Vec3; max: Vec3 };
  /** Parameters used to construct the geometry */
  parameters: Record<string, unknown>;
  /** Vertex count */
  vertexCount: number;
  /** Triangle count */
  triangleCount: number;
  /** Custom vertex data (if type === 'custom') */
  vertices?: Float32Array;
  indices?: Uint32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
}

// ─── Scene Object ────────────────────────────────────────────────────────────

export type ObjectKind = 'mesh' | 'light' | 'camera' | 'group' | 'helper';

export interface Light {
  kind: 'light';
  /** Light type */
  lightType: 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere';
  color: ColorRGB;
  intensity: number;
  /** For point/spot lights: range in world units */
  range?: number;
  /** For spot lights: cone angle in radians */
  angle?: number;
  /** For spot lights: penumbra (0–1) */
  penumbra?: number;
  /** Casts shadows */
  castShadow: boolean;
  /** Shadow map resolution */
  shadowMapSize?: number;
  /** Shadow bias */
  shadowBias?: number;
  /** Position (for non-ambient lights) */
  position?: Vec3;
  /** Target direction (for directional/spot) */
  target?: Vec3;
}

export interface Camera {
  kind: 'camera';
  /** Camera projection type */
  projection: 'perspective' | 'orthographic';
  /** Field of view in radians (perspective) */
  fov?: number;
  /** Near clipping plane */
  near: number;
  /** Far clipping plane */
  far: number;
  /** Aspect ratio (width/height) */
  aspect: number;
  /** Orthographic frustum size */
  frustumSize?: number;
  /** Camera position */
  position: Vec3;
  /** Look-at target */
  target: Vec3;
  /** Up vector */
  up: Vec3;
}

export interface SceneObject {
  objectId: string;
  kind: ObjectKind;
  /** Display name */
  name: string;
  /** Local transform */
  transform: Transform;
  /** Child object IDs */
  children: string[];
  /** Parent object ID (null for root objects) */
  parentId: string | null;
  /** Whether visible */
  visible: boolean;
  /** Whether casts shadows */
  castShadow: boolean;
  /** Whether receives shadows */
  receiveShadow: boolean;
  /** Render order (lower = earlier) */
  renderOrder: number;
  /** Tags */
  tags: string[];
  /** Kind-specific data */
  light?: Light;
  camera?: Camera;
  /** For meshes: geometry + material refs */
  geometryId?: string;
  materialId?: string;
  /** Custom properties */
  properties: Record<string, unknown>;
}

export const DEFAULT_SCENE_OBJECT: Omit<SceneObject, 'objectId' | 'name' | 'kind'> = {
  transform: { ...DEFAULT_TRANSFORM },
  children: [],
  parentId: null,
  visible: true,
  castShadow: false,
  receiveShadow: true,
  renderOrder: 0,
  tags: [],
  properties: {},
};

// ─── Scene Graph ─────────────────────────────────────────────────────────────

export interface SceneGraph {
  /** Unique scene identifier */
  sceneId: string;
  /** Display name */
  name: string;
  /** Scene description */
  description: string;
  /** All objects keyed by ID */
  objects: Map<string, SceneObject>;
  /** Root object IDs (those with parentId === null) */
  rootIds: string[];
  /** All geometries keyed by ID */
  geometries: Map<string, Geometry>;
  /** All materials keyed by ID */
  materials: Map<string, Material>;
  /** Environment settings */
  environment?: {
    background?: { color: ColorRGB; opacity: number };
    fog?: { color: ColorRGB; near: number; far: number };
    toneMapping?: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
    exposure?: number;
  };
  /** Metadata */
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─── Renderer State ──────────────────────────────────────────────────────────

export type RendererOutputFormat = 'rgba8' | 'rgb8' | 'rgba16f' | 'rgb16f' | 'depth';

export interface RendererSettings {
  /** Render width in pixels */
  width: number;
  /** Render height in pixels */
  height: number;
  /** Pixel aspect ratio */
  pixelRatio: number;
  /** Output format */
  outputFormat: RendererOutputFormat;
  /** Whether to clear the color buffer */
  clearColor: boolean;
  /** Background clear color */
  backgroundColor: ColorRGB;
  /** Whether to clear the depth buffer */
  clearDepth: boolean;
  /** Whether to render shadows */
  renderShadows: boolean;
  /** Shadow map type */
  shadowMapType: 'basic' | 'pcf' | 'pcfsoft';
  /** Tone mapping */
  toneMapping: 'none' | 'linear' | 'reinhard' | 'cineon' | 'aces';
  /** Exposure */
  exposure: number;
  /** Whether to use physically correct lighting */
  physicallyCorrectLights: boolean;
  /** Whether to sort objects by render order */
  sortObjects: boolean;
  /** Whether to frustum cull */
  frustumCulling: boolean;
}

export const DEFAULT_RENDERER_SETTINGS: RendererSettings = {
  width: 800,
  height: 600,
  pixelRatio: 1,
  outputFormat: 'rgba8',
  clearColor: true,
  backgroundColor: [0, 0, 0],
  clearDepth: true,
  renderShadows: false,
  shadowMapType: 'pcfsoft',
  toneMapping: 'none',
  exposure: 1,
  physicallyCorrectLights: true,
  sortObjects: true,
  frustumCulling: true,
};

export interface RenderResult {
  /** Render dimensions */
  width: number;
  height: number;
  /** Raw pixel data (RGBA8) */
  pixels: Uint8Array;
  /** MIME type */
  mimeType: string;
  /** Render duration in milliseconds */
  renderTimeMs: number;
  /** Number of draw calls */
  drawCalls: number;
  /** Number of triangles rendered */
  triangles: number;
  /** Number of points/lines rendered */
  primitives: number;
  /** Frame info */
  frameInfo: Record<string, unknown>;
}

// ─── Animation ───────────────────────────────────────────────────────────────

export interface AnimationClip {
  clipId: string;
  name: string;
  /** Duration in seconds */
  duration: number;
  /** Target object ID */
  targetObjectId: string;
  /** Keyframes */
  keyframes: Keyframe[];
  /** Whether to loop */
  loop: boolean;
  /** Number of loops (Infinity for infinite) */
  loopCount: number;
  /** Playback speed */
  speed: number;
}

export interface Keyframe {
  time: number; // seconds
  properties: {
    position?: Vec3;
    rotation?: Vec3;
    scale?: Vec3;
    [key: string]: unknown;
  };
  interpolation: 'linear' | 'smooth' | 'step' | 'bezier';
}

export interface AnimationState {
  clipId: string;
  isPlaying: boolean;
  currentTime: number;
  direction: 'forward' | 'backward';
  weight: number;
  speed: number;
}

// ─── Model Loader ────────────────────────────────────────────────────────────

export type ModelFormat = 'glb' | 'gltf' | 'obj' | 'fbx' | 'stl' | 'ply';

export interface LoadedModel {
  modelId: string;
  format: ModelFormat;
  /** Source URI or data */
  source: string;
  /** Extracted scene objects */
  objects: SceneObject[];
  /** Extracted geometries */
  geometries: Geometry[];
  /** Extracted materials */
  materials: Material[];
  /** Parse errors/warnings */
  parseErrors: string[];
  /** File size in bytes */
  fileSizeBytes: number;
}

export interface ModelLoaderOptions {
  /** Whether to flip Y axis (GLB/GLTF convention) */
  flipY: boolean;
  /** Whether to center the model at origin */
  center: boolean;
  /** Whether to normalize scale to fit in unit cube */
  normalizeScale: boolean;
  /** Target scale (if normalizeScale) */
  targetSize?: number;
}

export const DEFAULT_MODEL_LOADER_OPTIONS: ModelLoaderOptions = {
  flipY: true,
  center: true,
  normalizeScale: true,
  targetSize: 1,
};

// ─── Raycaster ───────────────────────────────────────────────────────────────

export interface RaycastHit {
  objectId: string;
  distance: number;
  point: Vec3;
  normal: Vec3;
  faceIndex: number;
  uv?: Vec2;
}

export interface Raycaster {
  /** Set the ray origin */
  setOrigin(origin: Vec3): void;
  /** Set the ray direction */
  setDirection(direction: Vec3): void;
  /** Intersect against objects in the scene */
  intersectObjects(objectIds: string[], scene: SceneGraph): RaycastHit[];
}

// ─── Exporter ────────────────────────────────────────────────────────────────

export type ExportFormat = 'glb' | 'gltf' | 'obj' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  /** Whether to embed binary data (for GLB) */
  embedBinary: boolean;
  /** Whether to include animations */
  includeAnimations: boolean;
  /** Whether to include only selected objects */
  onlySelected?: string[];
  /** Transform format for OBJ */
  coordinateSystem?: 'right-handed' | 'left-handed';
}

export interface ExportResult {
  format: ExportFormat;
  /** Serialized scene data */
  data: string | ArrayBuffer;
  /** File extension */
  extension: string;
  /** Size in bytes */
  sizeBytes: number;
  /** Warnings during export */
  warnings: string[];
}
