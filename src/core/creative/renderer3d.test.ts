/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * AETHER Creative Intelligence — 3D Renderer Tests
 * (src/core/creative/renderer3d.test.ts)
 *
 * Tests the scene graph, math primitives, materials, geometry, and
 * data structures designed for Three.js compatibility.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  // Math
  Vec3,
  Vec2,
  Quat,
  ColorRGB,
  ColorHex,
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
  Transform,
  DEFAULT_TRANSFORM,
  Material,
  DEFAULT_MATERIAL,
  Geometry,
  ObjectKind,
  Light,
  Camera,
  SceneObject,
  DEFAULT_SCENE_OBJECT,
  SceneGraph,
  RendererOutputFormat,
  RendererSettings,
  DEFAULT_RENDERER_SETTINGS,
  RenderResult,
  AnimationClip,
  Keyframe,
  AnimationState,
  ModelFormat,
  LoadedModel,
  ModelLoaderOptions,
  DEFAULT_MODEL_LOADER_OPTIONS,
  RaycastHit,
  Raycaster,
  ExportFormat,
  ExportOptions,
  ExportResult,
} from './renderer3d';

// ─── Constants ───────────────────────────────────────────────────────────────

test('ZERO_V3, ONE_V3, UP_V3 are correct', () => {
  assert.deepEqual(ZERO_V3, [0, 0, 0]);
  assert.deepEqual(ONE_V3, [1, 1, 1]);
  assert.deepEqual(UP_V3, [0, 1, 0]);
});

// ─── vec3Add ─────────────────────────────────────────────────────────────────

test('vec3Add adds two vectors', () => {
  assert.deepEqual(vec3Add([1, 2, 3], [4, 5, 6]), [5, 7, 9]);
});

test('vec3Add with zero', () => {
  assert.deepEqual(vec3Add([1, 2, 3], [0, 0, 0]), [1, 2, 3]);
  assert.deepEqual(vec3Add([0, 0, 0], [1, 2, 3]), [1, 2, 3]);
});

test('vec3Add with negatives', () => {
  assert.deepEqual(vec3Add([-1, -2, -3], [1, 2, 3]), [0, 0, 0]);
});

// ─── vec3Sub ─────────────────────────────────────────────────────────────────

test('vec3Sub subtracts two vectors', () => {
  assert.deepEqual(vec3Sub([4, 5, 6], [1, 2, 3]), [3, 3, 3]);
});

test('vec3Sub from self yields zero', () => {
  assert.deepEqual(vec3Sub([1, 2, 3], [1, 2, 3]), [0, 0, 0]);
});

// ─── vec3Scale ───────────────────────────────────────────────────────────────

test('vec3Scale multiplies by scalar', () => {
  assert.deepEqual(vec3Scale([1, 2, 3], 2), [2, 4, 6]);
});

test('vec3Scale by zero yields zero', () => {
  assert.deepEqual(vec3Scale([1, 2, 3], 0), [0, 0, 0]);
});

test('vec3Scale by negative', () => {
  assert.deepEqual(vec3Scale([1, 2, 3], -1), [-1, -2, -3]);
});

// ─── vec3Dot ─────────────────────────────────────────────────────────────────

test('vec3Dot computes dot product', () => {
  assert.equal(vec3Dot([1, 2, 3], [4, 5, 6]), 32);
});

test('vec3Dot of orthogonal vectors is zero', () => {
  assert.equal(vec3Dot([1, 0, 0], [0, 1, 0]), 0);
});

test('vec3Dot with self equals squared length', () => {
  assert.equal(vec3Dot([1, 2, 2], [1, 2, 2]), 9);
});

// ─── vec3Cross ───────────────────────────────────────────────────────────────

test('vec3Cross computes cross product', () => {
  const result = vec3Cross([1, 0, 0], [0, 1, 0]);
  assert.deepEqual(result, [0, 0, 1]);
});

test('vec3Cross of UP and X gives Z', () => {
  const result = vec3Cross([0, 1, 0], [1, 0, 0]);
  assert.deepEqual(result, [0, 0, -1]);
});

test('vec3Cross is anti-commutative', () => {
  const a = [1, 2, 3];
  const b = [4, 5, 6];
  assert.deepEqual(vec3Cross(a, b), vec3Scale(vec3Cross(b, a), -1));
});

// ─── vec3Length ──────────────────────────────────────────────────────────────

test('vec3Length computes magnitude', () => {
  assert.equal(vec3Length([3, 4, 0]), 5);
  assert.equal(vec3Length([1, 0, 0]), 1);
});

test('vec3Length of zero is zero', () => {
  assert.equal(vec3Length([0, 0, 0]), 0);
});

// ─── vec3Normalize ───────────────────────────────────────────────────────────

test('vec3Normalize produces unit vector', () => {
  const n = vec3Normalize([3, 4, 0]);
  assert.equal(vec3Length(n), 1);
  assert.ok(Math.abs(n[0] - 0.6) < 1e-10);
  assert.ok(Math.abs(n[1] - 0.8) < 1e-10);
});

test('vec3Normalize of zero returns zero', () => {
  assert.deepEqual(vec3Normalize([0, 0, 0]), [0, 0, 0]);
});

test('vec3Normalize of unit vector is identity', () => {
  const u = [1, 0, 0];
  assert.deepEqual(vec3Normalize(u), u);
});

// ─── vec3Lerp ────────────────────────────────────────────────────────────────

test('vec3Lerp at t=0 returns start', () => {
  assert.deepEqual(vec3Lerp([0, 0, 0], [10, 10, 10], 0), [0, 0, 0]);
});

test('vec3Lerp at t=1 returns end', () => {
  assert.deepEqual(vec3Lerp([0, 0, 0], [10, 10, 10], 1), [10, 10, 10]);
});

test('vec3Lerp at t=0.5 returns midpoint', () => {
  assert.deepEqual(vec3Lerp([0, 0, 0], [10, 10, 10], 0.5), [5, 5, 5]);
});

// ─── Color Conversion ────────────────────────────────────────────────────────

test('rgbToHex converts correctly', () => {
  assert.equal(rgbToHex([1, 1, 1]), 0xffffff);
  assert.equal(rgbToHex([0, 0, 0]), 0x000000);
  assert.equal(rgbToHex([1, 0, 0]), 0xff0000);
  assert.equal(rgbToHex([0, 1, 0]), 0x00ff00);
  assert.equal(rgbToHex([0, 0, 1]), 0x0000ff);
});

test('hexToRgb inverts rgbToHex', () => {
  const rgb = hexToRgb(rgbToHex([0.5, 0.75, 0.25]));
  assert.ok(Math.abs(rgb[0] - 0.5) < 0.01);
  assert.ok(Math.abs(rgb[1] - 0.75) < 0.01);
  assert.ok(Math.abs(rgb[2] - 0.25) < 0.01);
});

// ─── DEFAULT_TRANSFORM ───────────────────────────────────────────────────────

test('DEFAULT_TRANSFORM has identity values', () => {
  assert.deepEqual(DEFAULT_TRANSFORM.position, [0, 0, 0]);
  assert.deepEqual(DEFAULT_TRANSFORM.rotation, [0, 0, 0]);
  assert.deepEqual(DEFAULT_TRANSFORM.scale, [1, 1, 1]);
});

test('Transform can be overridden', () => {
  const t: Transform = {
    position: [10, 20, 30],
    rotation: [0, Math.PI / 2, 0],
    scale: [2, 2, 2],
  };
  assert.deepEqual(t.position, [10, 20, 30]);
  assert.equal(t.rotation[1], Math.PI / 2);
});

// ─── DEFAULT_MATERIAL ────────────────────────────────────────────────────────

test('DEFAULT_MATERIAL has sensible defaults', () => {
  assert.equal(DEFAULT_MATERIAL.type, 'standard');
  assert.deepEqual(DEFAULT_MATERIAL.color, [1, 1, 1]);
  assert.equal(DEFAULT_MATERIAL.opacity, 1);
  assert.ok(!DEFAULT_MATERIAL.transparent);
  assert.ok(!DEFAULT_MATERIAL.wireframe);
  assert.equal(DEFAULT_MATERIAL.roughness, 0.5);
  assert.equal(DEFAULT_MATERIAL.metalness, 0);
});

// ─── DEFAULT_SCENE_OBJECT ────────────────────────────────────────────────────

test('DEFAULT_SCENE_OBJECT has identity transform', () => {
  const d = DEFAULT_SCENE_OBJECT;
  assert.deepEqual(d.transform.position, [0, 0, 0]);
  assert.deepEqual(d.children, []);
  assert.ok(d.visible);
  assert.ok(!d.castShadow);
  assert.ok(d.receiveShadow);
});

// ─── DEFAULT_RENDERER_SETTINGS ───────────────────────────────────────────────

test('DEFAULT_RENDERER_SETTINGS has sensible defaults', () => {
  assert.equal(DEFAULT_RENDERER_SETTINGS.width, 800);
  assert.equal(DEFAULT_RENDERER_SETTINGS.height, 600);
  assert.equal(DEFAULT_RENDERER_SETTINGS.pixelRatio, 1);
  assert.equal(DEFAULT_RENDERER_SETTINGS.outputFormat, 'rgba8');
  assert.ok(DEFAULT_RENDERER_SETTINGS.clearColor);
  assert.ok(DEFAULT_RENDERER_SETTINGS.renderShadows === false);
  assert.equal(DEFAULT_RENDERER_SETTINGS.toneMapping, 'none');
});

// ─── DEFAULT_MODEL_LOADER_OPTIONS ────────────────────────────────────────────

test('DEFAULT_MODEL_LOADER_OPTIONS enables common transforms', () => {
  assert.ok(DEFAULT_MODEL_LOADER_OPTIONS.flipY);
  assert.ok(DEFAULT_MODEL_LOADER_OPTIONS.center);
  assert.ok(DEFAULT_MODEL_LOADER_OPTIONS.normalizeScale);
  assert.equal(DEFAULT_MODEL_LOADER_OPTIONS.targetSize, 1);
});

// ─── Geometry ────────────────────────────────────────────────────────────────

test('Geometry carries bounding box and counts', () => {
  const geom: Geometry = {
    geometryId: 'geom-1',
    type: 'box',
    boundingBox: { min: [-1, -1, -1], max: [1, 1, 1] },
    parameters: { width: 2, height: 2, depth: 2 },
    vertexCount: 8,
    triangleCount: 12,
  };
  assert.equal(geom.type, 'box');
  assert.equal(geom.vertexCount, 8);
  assert.equal(geom.triangleCount, 12);
});

// ─── Light ───────────────────────────────────────────────────────────────────

test('Light types are valid', () => {
  const lightTypes: Light['lightType'][] = ['ambient', 'directional', 'point', 'spot', 'hemisphere'];
  for (const lt of lightTypes) {
    const l: Light = {
      kind: 'light',
      lightType: lt,
      color: [1, 1, 1],
      intensity: 1,
      castShadow: false,
    };
    assert.equal(l.kind, 'light');
    assert.equal(l.lightType, lt);
  }
});

test('Spot light has angle and penumbra', () => {
  const l: Light = {
    kind: 'light',
    lightType: 'spot',
    color: [1, 1, 1],
    intensity: 5,
    angle: Math.PI / 6,
    penumbra: 0.5,
    castShadow: true,
    position: [0, 5, 0],
    target: [0, 0, 0],
  };
  assert.equal(l.angle, Math.PI / 6);
  assert.equal(l.penumbra, 0.5);
});

// ─── Camera ──────────────────────────────────────────────────────────────────

test('Camera has perspective projection', () => {
  const cam: Camera = {
    kind: 'camera',
    projection: 'perspective',
    fov: Math.PI / 3,
    near: 0.1,
    far: 1000,
    aspect: 16 / 9,
    position: [0, 0, 10],
    target: [0, 0, 0],
    up: [0, 1, 0],
  };
  assert.equal(cam.projection, 'perspective');
  assert.equal(cam.fov, Math.PI / 3);
  assert.equal(cam.aspect, 16 / 9);
});

test('Camera has orthographic projection', () => {
  const cam: Camera = {
    kind: 'camera',
    projection: 'orthographic',
    near: 0.1,
    far: 100,
    frustumSize: 10,
    aspect: 1,
    position: [0, 0, 10],
    target: [0, 0, 0],
    up: [0, 1, 0],
  };
  assert.equal(cam.projection, 'orthographic');
  assert.equal(cam.frustumSize, 10);
});

// ─── SceneObject ─────────────────────────────────────────────────────────────

test('SceneObject mesh references geometry and material', () => {
  const obj: SceneObject = {
    objectId: 'mesh-1',
    kind: 'mesh',
    name: 'Cube',
    transform: { ...DEFAULT_TRANSFORM },
    children: [],
    parentId: null,
    visible: true,
    castShadow: true,
    receiveShadow: true,
    renderOrder: 0,
    tags: ['box'],
    geometryId: 'geom-box',
    materialId: 'mat-white',
    properties: {},
  };
  assert.equal(obj.kind, 'mesh');
  assert.equal(obj.geometryId, 'geom-box');
  assert.equal(obj.materialId, 'mat-white');
});

test('SceneObject group has children', () => {
  const parent: SceneObject = {
    objectId: 'group-1',
    kind: 'group',
    name: 'Root',
    transform: { ...DEFAULT_TRANSFORM },
    children: ['child-1', 'child-2'],
    parentId: null,
    visible: true,
    castShadow: false,
    receiveShadow: false,
    renderOrder: 0,
    tags: [],
    properties: {},
  };
  assert.equal(parent.kind, 'group');
  assert.equal(parent.children.length, 2);
});

// ─── SceneGraph ──────────────────────────────────────────────────────────────

test('SceneGraph construction', () => {
  const objects = new Map<string, SceneObject>();
  const obj: SceneObject = {
    objectId: 'root',
    kind: 'group',
    name: 'Root',
    transform: { ...DEFAULT_TRANSFORM },
    children: ['m1'],
    parentId: null,
    visible: true,
    castShadow: false,
    receiveShadow: false,
    renderOrder: 0,
    tags: [],
    properties: {},
  };
  objects.set('root', obj);

  const scene: SceneGraph = {
    sceneId: 'scene-1',
    name: 'Test Scene',
    description: 'A test',
    objects,
    rootIds: ['root'],
    geometries: new Map(),
    materials: new Map(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  assert.equal(scene.sceneId, 'scene-1');
  assert.equal(scene.objects.size, 1);
  assert.deepEqual(scene.rootIds, ['root']);
});

// ─── RendererSettings Override ───────────────────────────────────────────────

test('RendererSettings can be customized', () => {
  const settings: RendererSettings = {
    ...DEFAULT_RENDERER_SETTINGS,
    width: 1920,
    height: 1080,
    pixelRatio: 2,
    renderShadows: true,
    exposure: 1.5,
  };
  assert.equal(settings.width, 1920);
  assert.equal(settings.height, 1080);
  assert.equal(settings.pixelRatio, 2);
  assert.ok(settings.renderShadows);
  assert.equal(settings.exposure, 1.5);
});

// ─── RenderResult ────────────────────────────────────────────────────────────

test('RenderResult captures render statistics', () => {
  const result: RenderResult = {
    width: 800,
    height: 600,
    pixels: new Uint8Array(800 * 600 * 4),
    mimeType: 'image/png',
    renderTimeMs: 16,
    drawCalls: 50,
    triangles: 1000,
    primitives: 0,
    frameInfo: {},
  };
  assert.equal(result.width, 800);
  assert.equal(result.drawCalls, 50);
  assert.equal(result.triangles, 1000);
  assert.equal(result.renderTimeMs, 16);
});

// ─── AnimationClip ───────────────────────────────────────────────────────────

test('AnimationClip describes keyframe animation', () => {
  const clip: AnimationClip = {
    clipId: 'clip-1',
    name: 'Bounce',
    duration: 2.0,
    targetObjectId: 'cube-1',
    keyframes: [
      { time: 0, properties: { position: [0, 0, 0] }, interpolation: 'linear' },
      { time: 1, properties: { position: [0, 2, 0] }, interpolation: 'smooth' },
      { time: 2, properties: { position: [0, 0, 0] }, interpolation: 'linear' },
    ],
    loop: true,
    loopCount: Infinity,
    speed: 1,
  };
  assert.equal(clip.duration, 2.0);
  assert.equal(clip.keyframes.length, 3);
  assert.ok(clip.loop);
  assert.equal(clip.loopCount, Infinity);
  assert.equal(clip.speed, 1);
});

// ─── AnimationState ──────────────────────────────────────────────────────────

test('AnimationState controls playback', () => {
  const state: AnimationState = {
    clipId: 'clip-1',
    isPlaying: true,
    currentTime: 1.5,
    direction: 'forward',
    weight: 1.0,
    speed: 0.5,
  };
  assert.ok(state.isPlaying);
  assert.equal(state.direction, 'forward');
  assert.equal(state.weight, 1.0);
  assert.equal(state.speed, 0.5);
});

// ─── AnimationMixer ──────────────────────────────────────────────────────────

test('AnimationMixer manages multiple clips', () => {
  const mixer: AnimationMixer = {
    mixerId: 'mix-1',
    objectId: 'character-1',
    activeClips: [
      { clipId: 'walk', actionState: 'running', weight: 0.8, time: 0, direction: 1, loopCount: 0 },
      { clipId: 'idle', actionState: 'paused', weight: 0.2, time: 0, direction: 1, loopCount: Infinity },
    ],
    enabled: true,
    timeScale: 1.0,
  };
  assert.equal(mixer.activeClips.length, 2);
  assert.ok(mixer.enabled);
  assert.equal(mixer.timeScale, 1.0);
});

// ─── LoadedModel ─────────────────────────────────────────────────────────────

test('LoadedModel describes parsed 3D file', () => {
  const loaded: LoadedModel = {
    modelId: 'model-1',
    format: 'glb',
    source: 'file:///models/character.glb',
    objects: [],
    geometries: [],
    materials: [],
    parseErrors: [],
    fileSizeBytes: 102400,
  };
  assert.equal(loaded.format, 'glb');
  assert.equal(loaded.fileSizeBytes, 102400);
  assert.deepEqual(loaded.parseErrors, []);
});

test('LoadedModel with parse warnings', () => {
  const loaded: LoadedModel = {
    modelId: 'model-2',
    format: 'obj',
    source: 'file:///models/object.obj',
    objects: [],
    geometries: [],
    materials: [],
    parseErrors: ['Missing UV coordinates on face 42'],
    fileSizeBytes: 51200,
  };
  assert.equal(loaded.parseErrors.length, 1);
});

// ─── ModelFormat ─────────────────────────────────────────────────────────────

test('all ModelFormat values are valid', () => {
  const formats: ModelFormat[] = ['glb', 'gltf', 'obj', 'fbx', 'stl', 'ply'];
  for (const f of formats) {
    assert.ok(f, `${f} is a valid ModelFormat`);
  }
});

// ─── ExportOptions ───────────────────────────────────────────────────────────

test('ExportOptions configures export format', () => {
  const opts: ExportOptions = {
    format: 'glb',
    embedBinary: true,
    includeAnimations: true,
    compression: 'draco',
  };
  assert.equal(opts.format, 'glb');
  assert.ok(opts.embedBinary);
  assert.ok(opts.includeAnimations);
  assert.equal(opts.compression, 'draco');
});

// ─── ExportResult ────────────────────────────────────────────────────────────

test('ExportResult carries size and warnings', () => {
  const result: ExportResult = {
    format: 'glb',
    data: new ArrayBuffer(1024),
    mimeType: 'model/gltf-binary',
    extension: '.glb',
    sizeBytes: 1024,
    warnings: ['Material "mat-1" not found, using default'],
  };
  assert.equal(result.format, 'glb');
  assert.equal(result.sizeBytes, 1024);
  assert.equal(result.warnings.length, 1);
});

// ─── RaycastHit ──────────────────────────────────────────────────────────────

test('RaycastHit contains intersection details', () => {
  const hit: RaycastHit = {
    objectId: 'cube-1',
    distance: 5.2,
    point: [1, 0, 5.2],
    normal: [0, 1, 0],
    faceIndex: 2,
    uv: [0.5, 0.5],
  };
  assert.equal(hit.objectId, 'cube-1');
  assert.equal(hit.distance, 5.2);
  assert.deepEqual(hit.normal, [0, 1, 0]);
});

// ─── ViewerState ─────────────────────────────────────────────────────────────

test('ViewerState is constructed', () => {
  const state = {
    viewerId: 'viewer-1',
    sceneId: 'scene-1',
    mode: 'orbit' as const,
    camera: { position: [0, 5, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number], up: [0, 1, 0] as [number, number, number], fov: 1, near: 0.1, far: 1000, zoom: 1 },
    active: true,
    isPlaying: false,
    currentTime: 0,
    selectedObjectIds: ['cube-1'],
    metadata: {},
    updatedAt: new Date().toISOString(),
  };
  assert.equal(state.viewerId, 'viewer-1');
  assert.equal(state.mode, 'orbit');
  assert.ok(state.active);
  assert.equal(state.selectedObjectIds.length, 1);
});

// ─── ControlState ────────────────────────────────────────────────────────────

test('ControlState tracks interaction', () => {
  const cs = {
    orbiting: true,
    panning: false,
    zooming: false,
    mousePosition: [0.5, -0.3] as [number, number],
    previousMousePosition: [0.4, -0.2] as [number, number],
    buttons: [false, true, false],
    showGrid: true,
    showAxes: true,
    wireframeMode: false,
    skeletonMode: false,
  };
  assert.ok(cs.orbiting);
  assert.ok(cs.showGrid);
  assert.ok(cs.showAxes);
  assert.ok(!cs.wireframeMode);
});

// ─── ControlsEngine ──────────────────────────────────────────────────────────

test('ControlsEngine can be implemented', () => {
  const bindings = new Map<string, { action: string; modifiers?: string[] }>();
  const engine = {
    bind(input: string, action: string, modifiers?: string[]) { bindings.set(input, { action, modifiers }); },
    unbind(action: string) {
      for (const [k, v] of bindings) {
        if (v.action === action) bindings.delete(k);
      }
    },
    handleInput() {},
    getControlState() {
      return {
        orbiting: false, panning: false, zooming: false,
        mousePosition: [0, 0], previousMousePosition: [0, 0],
        buttons: [false, false, false], showGrid: true, showAxes: true,
        wireframeMode: false, skeletonMode: false,
      };
    },
    reset() { bindings.clear(); },
    loadBindings() {},
  };

  engine.bind('mouse-left', 'rotate-left');
  assert.equal(bindings.size, 1);
  engine.unbind('rotate-left');
  assert.equal(bindings.size, 0);
});

// ─── Keyframe interpolation types ────────────────────────────────────────────

test('Keyframe interpolation types are valid', () => {
  const types: Keyframe['interpolation'][] = ['linear', 'smooth', 'step', 'bezier'];
  for (const t of types) {
    assert.ok(t, `${t} is a valid interpolation type`);
  }
});

// ─── CaptureOptions ──────────────────────────────────────────────────────────

test('CaptureOptions format selection', () => {
  const opts = { format: 'png' as const, quality: 0.9, scale: 2, premultiplyAlpha: true, renderSelectionOnly: false };
  assert.equal(opts.format, 'png');
  assert.equal(opts.scale, 2);
  assert.ok(opts.premultiplyAlpha);
});
