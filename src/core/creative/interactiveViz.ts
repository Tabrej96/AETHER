/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Interactive Visualization
 * (src/core/creative/interactiveViz.ts)
 *
 * 3D scene viewer, interactive controls, animation system, and export
 * capabilities (GLB, GLTF, etc.). Works with the data structures
 * produced by renderer3d.ts — designed for compatibility with Three.js
 * consumers (no direct Three.js import, lightweight AETHER-native).
 *
 * Inspired by mrdoob/three.js (MIT) — viewer patterns, controls,
 * and animation mixer concepts.
 */

// ─── Viewer ──────────────────────────────────────────────────────────────────

export type ViewerMode = 'orbit' | 'fly' | 'first-person' | 'pan';

export interface ViewerState {
  /** Viewer-unique identifier */
  viewerId: string;
  /** Active scene ID */
  sceneId: string;
  /** Viewer mode */
  mode: ViewerMode;
  /** Camera state */
  camera: CameraState;
  /** Whether the viewer is active */
  active: boolean;
  /** Whether animations are playing */
  isPlaying: boolean;
  /** Current time in seconds */
  currentTime: number;
  /** Selected object IDs */
  selectedObjectIds: string[];
  /** Viewer metadata */
  metadata: Record<string, unknown>;
  /** Last update timestamp */
  updatedAt: string;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  /** Vertical FOV in radians */
  fov: number;
  near: number;
  far: number;
  zoom: number;
}

// ─── Controls ────────────────────────────────────────────────────────────────

export type ControlAction =
  | 'rotate-left'
  | 'rotate-right'
  | 'rotate-up'
  | 'rotate-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'
  | 'reset-camera'
  | 'select-object'
  | 'focus-object'
  | 'toggle-wireframe'
  | 'toggle-grid'
  | 'toggle-axes'
  | 'toggle-skeleton'
  | 'frame-all'
  | 'frame-selected';

export interface ControlBinding {
  /** Input key or button */
  input: string;
  /** Control action to trigger */
  action: ControlAction;
  /** Modifier keys required */
  modifiers?: ('shift' | 'ctrl' | 'alt' | 'meta')[];
  /** Action parameters */
  params?: Record<string, unknown>;
}

export interface ControlState {
  /** Whether orbit is active */
  orbiting: boolean;
  /** Whether panning is active */
  panning: boolean;
  /** Whether zooming is active */
  zooming: boolean;
  /** Mouse position (normalized -1 to 1) */
  mousePosition: [number, number];
  /** Previous mouse position */
  previousMousePosition: [number, number];
  /** Mouse buttons held */
  buttons: boolean[];
  /** Whether grid is visible */
  showGrid: boolean;
  /** Whether axes helper is visible */
  showAxes: boolean;
  /** Whether wireframe mode is on */
  wireframeMode: boolean;
  /** Whether skeleton mode is on */
  skeletonMode: boolean;
}

// ─── Animation System ────────────────────────────────────────────────────────

export type AnimationEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'loop'
  | 'complete'
  | 'interrupt';

export interface AnimationEvent {
  type: AnimationEventType;
  clipId: string;
  timestamp: number;
  objectId?: string;
  detail?: Record<string, unknown>;
}

export interface AnimationMixer {
  mixerId: string;
  /** Target object ID */
  objectId: string;
  /** Active clips */
  activeClips: Array<{
    clipId: string;
    actionState: 'running' | 'paused' | 'stopped';
    weight: number;
    time: number;
    direction: 1 | -1;
    loopCount: number;
  }>;
  /** Whether the mixer is enabled */
  enabled: boolean;
  /** Time scale (1 = normal speed) */
  timeScale: number;
}

export interface AnimationSystem {
  /** All registered mixers */
  mixers: Map<string, AnimationMixer>;
  /** Whether global playback is active */
  isPlaying: boolean;
  /** Global time scale */
  timeScale: number;
  /** Registered event listeners */
  eventListeners: Array<(event: AnimationEvent) => void>;
}

// ─── Selection ───────────────────────────────────────────────────────────────

export type SelectionMode = 'single' | 'multi' | 'toggle';

export interface SelectionState {
  /** Selected object IDs (in order) */
  selectedIds: string[];
  /** Selection mode */
  mode: SelectionMode;
  /** Hovered object ID */
  hoveredId: string | null;
  /** Selection box (if box select is active) */
  selectionBox?: { start: [number, number]; end: [number, number] };
}

// ─── Scene Viewer ────────────────────────────────────────────────────────────

export interface SceneViewer {
  /** Unique viewer identifier */
  viewerId: string;
  /** Active scene graph */
  scene: import('./renderer3d').SceneGraph | null;
  /** Camera state */
  camera: CameraState;
  /** Control state */
  controls: ControlState;
  /** Selection state */
  selection: SelectionState;
  /** Animation system */
  animations: AnimationSystem;
  /** Renderer settings */
  rendererSettings: import('./renderer3d').RendererSettings;
  /** Viewer metadata */
  metadata: Record<string, unknown>;
}

// ─── Interactive Controls Engine ─────────────────────────────────────────────

export type InputEventType = 'pointerdown' | 'pointermove' | 'pointerup' | 'wheel' | 'keydown' | 'keyup' | 'resize';

export interface InputEvent {
  type: InputEventType;
  /** Normalized device coordinates (-1 to 1) */
  ndcX: number;
  ndcY: number;
  /** Screen coordinates */
  screenX: number;
  screenY: number;
  /** Delta (for wheel/move) */
  deltaX?: number;
  deltaY?: number;
  /** Pointer type */
  pointerType: 'mouse' | 'touch' | 'pen';
  /** Buttons pressed */
  buttons: number[];
  /** Modifier keys */
  modifiers: Set<string>;
  /** Timestamp */
  timestamp: number;
}

export interface ControlsEngine {
  /** Bind a control action to an input */
  bind(input: string, action: ControlAction, modifiers?: string[]): void;

  /** Unbind a control action */
  unbind(action: ControlAction): void;

  /** Process an input event */
  handleInput(event: InputEvent, viewer: SceneViewer): void;

  /** Get current control state */
  getControlState(): ControlState;

  /** Reset controls to default */
  reset(): void;

  /** Load control bindings from config */
  loadBindings(bindings: ControlBinding[]): void;
}

// ─── Export ──────────────────────────────────────────────────────────────────

export type ExportFormat = 'glb' | 'gltf' | 'json' | 'obj';

export interface ExportOptions {
  format: ExportFormat;
  /** Whether to embed binary data */
  embedBinary: boolean;
  /** Whether to include animations */
  includeAnimations: boolean;
  /** Whether to include only selected objects */
  onlySelected?: boolean;
  /** Transform coordinate system */
  coordinateSystem?: 'right-handed' | 'left-handed';
  /** Compression for GLB (draco) */
  compression?: 'none' | 'draco' | 'meshopt';
}

export interface ExportResult {
  format: ExportFormat;
  /** Serialized data */
  data: ArrayBuffer | string;
  /** MIME type */
  mimeType: string;
  /** File extension */
  extension: string;
  /** Size in bytes */
  sizeBytes: number;
  /** Export warnings */
  warnings: string[];
}

// ─── Serialization Helpers ───────────────────────────────────────────────────

export interface SceneSerializationOptions {
  /** Whether to include non-visible objects */
  includeHidden: boolean;
  /** Whether to include metadata */
  includeMetadata: boolean;
  /** Object filter function */
  filter?: (obj: import('./renderer3d').SceneObject) => boolean;
}

export interface SerializedScene {
  format: 'aether-scene-v1';
  sceneId: string;
  name: string;
  description: string;
  objects: Array<{
    objectId: string;
    kind: import('./renderer3d').ObjectKind;
    name: string;
    transform: import('./renderer3d').Transform;
    children: string[];
    light?: import('./renderer3d').Light;
    camera?: import('./renderer3d').Camera;
    geometryId?: string;
    materialId?: string;
    visible: boolean;
  }>;
  materials: import('./renderer3d').Material[];
  geometries: import('./renderer3d').Geometry[];
  animations: import('./renderer3d').AnimationClip[];
  environment?: {
    background?: { color: [number, number, number]; opacity: number };
    fog?: { color: [number, number, number]; near: number; far: number };
  };
  metadata: Record<string, unknown>;
  exportedAt: string;
}

// ─── Screenshot / Capture ────────────────────────────────────────────────────

export interface CaptureOptions {
  /** Output format */
  format: 'png' | 'jpeg' | 'webp';
  /** Quality (for jpeg/webp) */
  quality: number;
  /** Scale factor */
  scale: number;
  /** Whether to include alpha (png only) */
  premultiplyAlpha: boolean;
  /** Whether to render only the selection */
  renderSelectionOnly?: boolean;
}

export interface CaptureResult {
  /** Raw pixel data */
  pixels: Uint8Array;
  width: number;
  height: number;
  format: string;
  mimeType: string;
  sizeBytes: number;
  captureTimeMs: number;
}
