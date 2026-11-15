/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — Interactive Visualization Tests
 * (src/core/creative/interactiveViz.test.ts)
 *
 * Tests for 3D scene viewer, interactive controls, animation system,
 * and export capabilities.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ViewerMode,
  ViewerState,
  CameraState,
  ControlAction,
  ControlBinding,
  ControlState,
  InputEventType,
  InputEvent,
  ControlsEngine,
  SelectionMode,
  SelectionState,
  SceneViewer,
  AnimationEventType,
  AnimationEvent,
  AnimationMixer,
  AnimationSystem,
  ExportFormat,
  ExportOptions,
  ExportResult,
  SceneSerializationOptions,
  SerializedScene,
  CaptureOptions,
  CaptureResult,
} from './interactiveViz';
import { DEFAULT_TRANSFORM, SceneObject, DEFAULT_SCENE_OBJECT, DEFAULT_RENDERER_SETTINGS, SceneGraph, DEFAULT_MATERIAL } from './renderer3d';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCameraState(overrides: Partial<CameraState> = {}): CameraState {
  return {
    position: [0, 5, 10],
    target: [0, 0, 0],
    up: [0, 1, 0],
    fov: 1.05,
    near: 0.1,
    far: 1000,
    zoom: 1,
    ...overrides,
  };
}

function makeViewerState(overrides: Partial<ViewerState> = {}): ViewerState {
  return {
    viewerId: 'viewer-1',
    sceneId: 'scene-1',
    mode: 'orbit',
    camera: makeCameraState(),
    active: true,
    isPlaying: false,
    currentTime: 0,
    selectedObjectIds: [],
    metadata: {},
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeControlState(overrides: Partial<ControlState> = {}): ControlState {
  return {
    orbiting: false,
    panning: false,
    zooming: false,
    mousePosition: [0, 0],
    previousMousePosition: [0, 0],
    buttons: [false, false, false],
    showGrid: true,
    showAxes: true,
    wireframeMode: false,
    skeletonMode: false,
    ...overrides,
  };
}

function makeInputEvent(overrides: Partial<InputEvent> = {}): InputEvent {
  return {
    type: 'pointermove',
    ndcX: 0,
    ndcY: 0,
    screenX: 400,
    screenY: 300,
    pointerType: 'mouse',
    buttons: [0],
    modifiers: new Set(),
    timestamp: Date.now(),
    ...overrides,
  };
}

function makeAnimationMixer(overrides: Partial<AnimationMixer> = {}): AnimationMixer {
  return {
    mixerId: 'mix-1',
    objectId: 'obj-1',
    activeClips: [],
    enabled: true,
    timeScale: 1,
    ...overrides,
  };
}

function makeSceneViewer(overrides: Partial<SceneViewer> = {}): SceneViewer {
  const objects = new Map<string, SceneObject>();
  const root: SceneObject = {
    objectId: 'root',
    kind: 'group',
    name: 'Root',
    transform: { ...DEFAULT_TRANSFORM },
    children: [],
    parentId: null,
    visible: true,
    castShadow: false,
    receiveShadow: false,
    renderOrder: 0,
    tags: [],
    properties: {},
  };
  objects.set('root', root);

  const scene: SceneGraph = {
    sceneId: 'scene-1',
    name: 'Test',
    description: '',
    objects,
    rootIds: ['root'],
    geometries: new Map(),
    materials: new Map(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    viewerId: 'viewer-1',
    scene,
    camera: makeCameraState(),
    controls: makeControlState(),
    selection: { selectedIds: [], mode: 'single', hoveredId: null },
    animations: { mixers: new Map(), isPlaying: false, timeScale: 1, eventListeners: [] },
    rendererSettings: DEFAULT_RENDERER_SETTINGS,
    metadata: {},
    ...overrides,
  };
}

// ─── ViewerMode ──────────────────────────────────────────────────────────────

test('all ViewerMode values are valid', () => {
  const modes: ViewerMode[] = ['orbit', 'fly', 'first-person', 'pan'];
  assert.equal(modes.length, 4);
});

// ─── ViewerState ─────────────────────────────────────────────────────────────

test('makeViewerState creates viewer state', () => {
  const state = makeViewerState({ mode: 'fly', active: false });
  assert.equal(state.viewerId, 'viewer-1');
  assert.equal(state.mode, 'fly');
  assert.ok(!state.active);
  assert.ok(!state.isPlaying);
  assert.equal(state.currentTime, 0);
});

test('ViewerState with selected objects', () => {
  const state = makeViewerState({ selectedObjectIds: ['cube-1', 'sphere-1'] });
  assert.equal(state.selectedObjectIds.length, 2);
  assert.ok(state.selectedObjectIds.includes('cube-1'));
});

// ─── CameraState ─────────────────────────────────────────────────────────────

test('makeCameraState creates camera with defaults', () => {
  const cs = makeCameraState();
  assert.deepEqual(cs.position, [0, 5, 10]);
  assert.deepEqual(cs.target, [0, 0, 0]);
  assert.deepEqual(cs.up, [0, 1, 0]);
  assert.equal(cs.fov, 1.05);
  assert.equal(cs.zoom, 1);
});

test('CameraState can override position', () => {
  const cs = makeCameraState({ position: [0, 10, 20], zoom: 2 });
  assert.deepEqual(cs.position, [0, 10, 20]);
  assert.equal(cs.zoom, 2);
});

// ─── ControlAction ───────────────────────────────────────────────────────────

test('all ControlAction values are valid', () => {
  const actions: ControlAction[] = [
    'rotate-left', 'rotate-right', 'rotate-up', 'rotate-down',
    'zoom-in', 'zoom-out',
    'pan-left', 'pan-right', 'pan-up', 'pan-down',
    'reset-camera', 'select-object', 'focus-object',
    'toggle-wireframe', 'toggle-grid', 'toggle-axes', 'toggle-skeleton',
    'frame-all', 'frame-selected',
  ];
  assert.equal(actions.length, 19);
});

// ─── ControlBinding ──────────────────────────────────────────────────────────

test('ControlBinding maps input to action', () => {
  const binding: ControlBinding = {
    input: 'mouse-left',
    action: 'rotate-left',
    modifiers: ['shift'],
    params: { speed: 0.5 },
  };
  assert.equal(binding.input, 'mouse-left');
  assert.equal(binding.action, 'rotate-left');
  assert.deepEqual(binding.modifiers, ['shift']);
  assert.equal(binding.params?.speed, 0.5);
});

test('ControlBinding without modifiers', () => {
  const binding: ControlBinding = { input: 'wheel', action: 'zoom-in' };
  assert.ok(!binding.modifiers);
});

// ─── ControlState ────────────────────────────────────────────────────────────

test('makeControlState creates default control state', () => {
  const cs = makeControlState();
  assert.ok(!cs.orbiting);
  assert.ok(!cs.panning);
  assert.ok(cs.showGrid);
  assert.ok(cs.showAxes);
  assert.ok(!cs.wireframeMode);
});

test('ControlState with active interaction', () => {
  const cs = makeControlState({ orbiting: true, mousePosition: [0.5, -0.3], buttons: [true, false, false] });
  assert.ok(cs.orbiting);
  assert.equal(cs.mousePosition[0], 0.5);
  assert.ok(cs.buttons[0]);
  assert.ok(!cs.buttons[1]);
});

// ─── InputEventType ──────────────────────────────────────────────────────────

test('all InputEventType values are valid', () => {
  const types: InputEventType[] = ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'keydown', 'keyup', 'resize'];
  assert.equal(types.length, 7);
});

// ─── InputEvent ──────────────────────────────────────────────────────────────

test('makeInputEvent creates event with defaults', () => {
  const evt = makeInputEvent();
  assert.equal(evt.type, 'pointermove');
  assert.equal(evt.pointerType, 'mouse');
  assert.ok(evt.timestamp > 0);
});

test('InputEvent with modifiers', () => {
  const evt = makeInputEvent({
    type: 'keydown',
    modifiers: new Set(['shift', 'ctrl']),
    deltaX: 10,
    deltaY: -5,
  });
  assert.ok(evt.modifiers.has('shift'));
  assert.ok(evt.modifiers.has('ctrl'));
  assert.equal(evt.deltaX, 10);
});

// ─── ControlsEngine ──────────────────────────────────────────────────────────

test('ControlsEngine binds and unbinds controls', () => {
  const bindings = new Map<string, { action: string; modifiers?: string[] }>();
  const engine: ControlsEngine = {
    bind(input, action, modifiers) { bindings.set(input, { action, modifiers }); },
    unbind(action) {
      for (const [k, v] of bindings) {
        if (v.action === action) bindings.delete(k);
      }
    },
    handleInput() {},
    getControlState() {
      return makeControlState();
    },
    reset() { bindings.clear(); },
    loadBindings() {},
  };

  engine.bind('mouse-wheel', 'zoom-in');
  assert.equal(bindings.size, 1);
  engine.bind('mouse-wheel-shift', 'zoom-out', ['shift']);
  assert.equal(bindings.size, 2);
  engine.unbind('zoom-in');
  assert.equal(bindings.size, 1);
  engine.reset();
  assert.equal(bindings.size, 0);
});

// ─── SelectionMode ───────────────────────────────────────────────────────────

test('all SelectionMode values are valid', () => {
  const modes: SelectionMode[] = ['single', 'multi', 'toggle'];
  assert.equal(modes.length, 3);
});

// ─── SelectionState ──────────────────────────────────────────────────────────

test('SelectionState tracks selected and hovered objects', () => {
  const state: SelectionState = {
    selectedIds: ['obj-1', 'obj-2'],
    mode: 'multi',
    hoveredId: 'obj-3',
  };
  assert.equal(state.selectedIds.length, 2);
  assert.equal(state.mode, 'multi');
  assert.equal(state.hoveredId, 'obj-3');
});

// ─── AnimationEventType ──────────────────────────────────────────────────────

test('all AnimationEventType values are valid', () => {
  const types: AnimationEventType[] = ['play', 'pause', 'stop', 'loop', 'complete', 'interrupt'];
  assert.equal(types.length, 6);
});

// ─── AnimationEvent ──────────────────────────────────────────────────────────

test('AnimationEvent carries playback info', () => {
  const event: AnimationEvent = {
    type: 'complete',
    clipId: 'walk-clip',
    timestamp: 2.5,
    objectId: 'character-1',
    detail: { loopCount: 3 },
  };
  assert.equal(event.type, 'complete');
  assert.equal(event.clipId, 'walk-clip');
  assert.equal(event.timestamp, 2.5);
  assert.equal(event.objectId, 'character-1');
});

// ─── AnimationMixer ──────────────────────────────────────────────────────────

test('makeAnimationMixer creates mixer with clips', () => {
  const mixer = makeAnimationMixer({
    mixerId: 'mix-2',
    objectId: 'char-1',
    activeClips: [
      { clipId: 'walk', actionState: 'running', weight: 1.0, time: 0.5, direction: 1, loopCount: 0 },
    ],
    enabled: false,
    timeScale: 0.5,
  });
  assert.equal(mixer.mixerId, 'mix-2');
  assert.equal(mixer.activeClips.length, 1);
  assert.ok(!mixer.enabled);
  assert.equal(mixer.timeScale, 0.5);
});

// ─── AnimationSystem ─────────────────────────────────────────────────────────

test('AnimationSystem manages mixers and events', () => {
  const system: AnimationSystem = {
    mixers: new Map([['mix-1', makeAnimationMixer()]]),
    isPlaying: true,
    timeScale: 1.5,
    eventListeners: [
      (evt: AnimationEvent) => {
        assert.equal(evt.type, 'play');
      },
    ],
  };
  assert.equal(system.mixers.size, 1);
  assert.ok(system.isPlaying);
  assert.equal(system.timeScale, 1.5);
  assert.equal(system.eventListeners.length, 1);
});

// ─── SceneViewer ─────────────────────────────────────────────────────────────

test('makeSceneViewer creates viewer with scene and controls', () => {
  const viewer = makeSceneViewer({ viewerId: 'v2' });
  assert.equal(viewer.viewerId, 'v2');
  assert.ok(viewer.scene);
  assert.equal(viewer.scene.objects.size, 1);
  assert.equal(viewer.controls.showGrid, true);
});

// ─── ExportOptions ───────────────────────────────────────────────────────────

test('ExportOptions for GLB with Draco compression', () => {
  const opts: ExportOptions = {
    format: 'glb',
    embedBinary: true,
    includeAnimations: true,
    compression: 'draco',
  };
  assert.equal(opts.format, 'glb');
  assert.ok(opts.embedBinary);
  assert.equal(opts.compression, 'draco');
});

test('ExportOptions for JSON without animations', () => {
  const opts: ExportOptions = { format: 'json', embedBinary: false, includeAnimations: false };
  assert.equal(opts.format, 'json');
  assert.ok(!opts.embedBinary);
  assert.ok(!opts.includeAnimations);
});

// ─── ExportResult ────────────────────────────────────────────────────────────

test('ExportResult carries metadata', () => {
  const result: ExportResult = {
    format: 'glb',
    data: new ArrayBuffer(2048),
    mimeType: 'model/gltf-binary',
    extension: '.glb',
    sizeBytes: 2048,
    warnings: ['Draco compression not available, exported without'],
  };
  assert.equal(result.sizeBytes, 2048);
  assert.equal(result.mimeType, 'model/gltf-binary');
  assert.equal(result.warnings.length, 1);
});

// ─── SceneSerializationOptions ───────────────────────────────────────────────

test('SceneSerializationOptions with filter', () => {
  const opts: SceneSerializationOptions = {
    includeHidden: false,
    includeMetadata: true,
    filter: (obj) => obj.visible,
  };
  assert.ok(!opts.includeHidden);
  assert.ok(opts.includeMetadata);
  assert.ok(opts.filter);
});

// ─── SerializedScene ─────────────────────────────────────────────────────────

test('SerializedScene has AETHER format header', () => {
  const scene: SerializedScene = {
    format: 'aether-scene-v1',
    sceneId: 'scene-1',
    name: 'Test Scene',
    description: 'A test',
    objects: [
      {
        objectId: 'root',
        kind: 'group',
        name: 'Root',
        transform: { ...DEFAULT_TRANSFORM },
        children: [],
        visible: true,
      },
    ],
    materials: [DEFAULT_MATERIAL],
    geometries: [],
    animations: [],
    metadata: { author: 'AETHER' },
    exportedAt: new Date().toISOString(),
  };
  assert.equal(scene.format, 'aether-scene-v1');
  assert.equal(scene.objects.length, 1);
  assert.equal(scene.materials.length, 1);
  assert.ok(scene.exportedAt.length > 0);
});

// ─── CaptureOptions ──────────────────────────────────────────────────────────

test('CaptureOptions for high-res screenshot', () => {
  const opts: CaptureOptions = {
    format: 'png',
    quality: 1.0,
    scale: 2,
    premultiplyAlpha: false,
  };
  assert.equal(opts.format, 'png');
  assert.equal(opts.scale, 2);
  assert.ok(!opts.premultiplyAlpha);
});

// ─── CaptureResult ───────────────────────────────────────────────────────────

test('CaptureResult reports render stats', () => {
  const result: CaptureResult = {
    pixels: new Uint8Array(1920 * 1080 * 4),
    width: 1920,
    height: 1080,
    format: 'png',
    mimeType: 'image/png',
    sizeBytes: 1920 * 1080 * 4,
    captureTimeMs: 25,
  };
  assert.equal(result.width, 1920);
  assert.equal(result.height, 1080);
  assert.equal(result.captureTimeMs, 25);
  assert.equal(result.pixels.length, 1920 * 1080 * 4);
});

// ─── ExportFormat ────────────────────────────────────────────────────────────

test('all ExportFormat values are valid', () => {
  const formats: ExportFormat[] = ['glb', 'gltf', 'json', 'obj'];
  assert.equal(formats.length, 4);
});
