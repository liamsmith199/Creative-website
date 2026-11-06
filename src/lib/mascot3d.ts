import {
  ACESFilmicToneMapping, Box3, Color, DirectionalLight, Group, HemisphereLight, MathUtils, Mesh, PCFShadowMap,
  PerspectiveCamera, PlaneGeometry, PMREMGenerator, Scene, ShadowMaterial, SRGBColorSpace, Vector3, WebGLRenderer,
} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * The confirmed Mission 2 model, presented in the hero. Loaded lazily so the
 * page paints before three.js arrives. It renders only while something moves
 * (a drag, damping, the entrance or the idle sway), so a still hero costs
 * nothing per frame.
 */

/** The parts of model-manifest.json this presentation reads. */
export type Manifest = {
  schemaVersion: string;
  modelName: string;
  camera?: {position: number[]; target: number[]; fovDegrees: number};
  scene?: {lighting?: string; lightIntensity?: number; shadows?: boolean};
};

export type View = 'reset' | 'front' | 'side' | 'back';

export type Mascot = {
  /** Call once per animation frame with seconds since the last one. */
  tick: (dt: number, now: number) => void;
  rotate: (dYaw: number, dPitch: number) => void;
  zoom: (steps: number) => void;
  view: (v: View) => void;
  interacted: () => void;
  resize: () => void;
  dispose: () => void;
};

// Same rigs as the studio, so "Studio" lighting in the manifest looks the same here.
const RIGS: Record<string, {key: string; keyPower: number; keyDir: [number, number, number]; fill: string; fillPower: number; sky: string; ground: string; ambient: number; env: number}> = {
  studio: {key: '#ffffff', keyPower: 2.1, keyDir: [3, 6, 4], fill: '#dfeaff', fillPower: 0.7, sky: '#ffffff', ground: '#c9d4cf', ambient: 0.7, env: 0.55},
  daylight: {key: '#fff4dc', keyPower: 2.8, keyDir: [5, 8, 2], fill: '#bcd8ff', fillPower: 0.6, sky: '#cfe8ff', ground: '#b9c7a8', ambient: 0.8, env: 0.5},
  sunset: {key: '#ffb074', keyPower: 2.8, keyDir: [6, 2.6, 3], fill: '#8d7dff', fillPower: 0.75, sky: '#ffc9a3', ground: '#6a4a63', ambient: 0.55, env: 0.35},
  gallery: {key: '#fff8ee', keyPower: 3.2, keyDir: [1.5, 8, 2.5], fill: '#ffffff', fillPower: 0.25, sky: '#d8d8d8', ground: '#55504c', ambient: 0.35, env: 0.3},
  night: {key: '#a9c4ff', keyPower: 2.1, keyDir: [-4, 6, 3], fill: '#57e0c0', fillPower: 0.7, sky: '#32405e', ground: '#10141f', ambient: 0.5, env: 0.22},
};

const PITCH_MIN = -0.12;
const PITCH_MAX = 0.62;
const ZOOM_MIN = 0.42;
const ZOOM_MAX = 1.25;

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export async function createMascot(
  canvas: HTMLCanvasElement,
  opts: {
    modelUrl: string;
    manifest: Manifest;
    reduced: () => boolean;
    shadowColor: string;
    /** Extra canvas below the framed area, as a share of its height, so zooming never crops on a hard edge. */
    pad: number;
    onProgress?: (f: number) => void;
    onLost?: () => void;
  },
): Promise<Mascot> {
  const renderer = new WebGLRenderer({canvas, alpha: true, antialias: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  const shadows = opts.manifest.scene?.shadows !== false;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = env.texture;

  const gltf = await new GLTFLoader().loadAsync(opts.modelUrl, (e) => {
    if (e.total) opts.onProgress?.(e.loaded / e.total);
  });
  const model = gltf.scene;
  model.traverse((o) => {
    if ((o as Mesh).isMesh) o.castShadow = o.receiveShadow = true;
  });

  // The GLB is in metres, Y up, front facing +Z. Spin it about its own centre.
  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const pivot = new Group();
  model.position.set(-center.x, -box.min.y, -center.z);
  pivot.add(model);
  scene.add(pivot);
  const height = size.y;
  const radius = Math.max(size.x, size.z) / 2;

  const lighting = RIGS[opts.manifest.scene?.lighting ?? 'studio'] ?? RIGS.studio;
  const power = opts.manifest.scene?.lightIntensity ?? 1;
  scene.environmentIntensity = lighting.env * power;
  const key = new DirectionalLight(lighting.key, lighting.keyPower * power);
  key.position.set(...lighting.keyDir).normalize().multiplyScalar(height * 4);
  // Shadows come from a separate light almost overhead: a short contact shadow
  // that stays inside the frame from every angle, whatever the key light does.
  const caster = new DirectionalLight('#ffffff', 0.35 * power);
  caster.position.set(0.12, 1, 0.18).normalize().multiplyScalar(height * 4);
  caster.castShadow = shadows;
  caster.shadow.mapSize.set(1024, 1024);
  Object.assign(caster.shadow.camera, {left: -height, right: height, top: height, bottom: -height, near: 0.01, far: height * 10});
  caster.shadow.bias = -0.0004;
  caster.shadow.normalBias = 0.02 * height;
  const fill = new DirectionalLight(lighting.fill, lighting.fillPower * power);
  fill.position.set(-lighting.keyDir[0], height, lighting.keyDir[2] * 0.6);
  scene.add(key, key.target, caster, caster.target, fill, new HemisphereLight(lighting.sky, lighting.ground, lighting.ambient * power));

  // A soft contact shadow tinted with the brand's deep green, not grey.
  const floor = new Mesh(new PlaneGeometry(height * 8, height * 8), new ShadowMaterial({color: new Color(opts.shadowColor), opacity: 0.38}));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.visible = shadows;
  scene.add(floor);

  // Default view: the direction the student framed in Mission 2.
  const cam = opts.manifest.camera;
  const fov = cam?.fovDegrees ?? 35;
  const camera = new PerspectiveCamera(fov, 1, height / 100, height * 40);
  const dir = cam ? new Vector3(cam.position[0] - cam.target[0], cam.position[1] - cam.target[1], cam.position[2] - cam.target[2]).normalize() : new Vector3(0.3, 0.2, 1).normalize();
  const homeYaw = Math.atan2(dir.x, dir.z);
  const homePitch = MathUtils.clamp(Math.asin(dir.y), PITCH_MIN, PITCH_MAX);

  const goal = {yaw: homeYaw, pitch: homePitch, zoom: 1};
  const now = {yaw: homeYaw, pitch: homePitch, zoom: 1};
  let lastInput = -Infinity;
  let sway = 0;
  let entrance = opts.reduced() ? 1 : 0;
  let needs = true;
  let fitDist = 1;

  const fit = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    // Frame the mascot in the top part, and let the view run on below it.
    const framed = h / (1 + opts.pad);
    camera.aspect = w / framed;
    camera.setViewOffset(w, framed, 0, 0, w, h);
    camera.updateProjectionMatrix();
    // Fit the full height, and the widest it gets while turning, with a little air.
    const t = Math.tan(MathUtils.degToRad(fov) / 2);
    fitDist = Math.max((height * 0.53) / t, (radius * 1.25) / (t * camera.aspect)) + radius * 0.6;
    needs = true;
  };
  fit();

  const lost = (e: Event) => {
    e.preventDefault();
    opts.onLost?.();
  };
  canvas.addEventListener('webglcontextlost', lost);

  const place = () => {
    // Zooming in also lifts the aim from the middle of the body towards the face.
    const z = now.zoom;
    const lift = MathUtils.smoothstep(1 - z, 0, 1 - ZOOM_MIN);
    // Aiming a little above the middle drops the feet to the bottom of the frame.
    const target = new Vector3(0, MathUtils.lerp(height * 0.55, height * 0.8, lift), 0);
    const d = fitDist * z;
    const yaw = now.yaw + sway;
    camera.position.set(
      target.x + Math.sin(yaw) * Math.cos(now.pitch) * d,
      target.y + Math.sin(now.pitch) * d,
      target.z + Math.cos(yaw) * Math.cos(now.pitch) * d,
    );
    camera.lookAt(target);
  };

  const interacted = () => {
    lastInput = performance.now();
    needs = true;
  };

  return {
    tick(dt, time) {
      const k = 1 - Math.exp(-dt * 9);
      let moving = false;
      for (const key of ['yaw', 'pitch', 'zoom'] as const) {
        const diff = goal[key] - now[key];
        if (Math.abs(diff) > 1e-4) {
          now[key] += diff * k;
          moving = true;
        } else now[key] = goal[key];
      }

      // Entrance: rise, settle and turn into place once, unless motion is reduced.
      if (entrance < 1) {
        entrance = Math.min(1, entrance + dt / 1.2);
        const e = 1 - Math.pow(1 - entrance, 3);
        pivot.position.y = (1 - e) * -height * 0.08;
        pivot.scale.setScalar(0.92 + e * 0.08);
        pivot.rotation.y = (1 - e) * -0.6;
        moving = true;
      }

      // Idle sway: a slow look left and right after a few quiet seconds.
      const swayOn = !opts.reduced() && time - lastInput > 4500 && entrance >= 1;
      const target = swayOn ? Math.sin(time / 2600) * 0.24 : 0;
      const next = sway + (target - sway) * Math.min(1, dt * 1.5);
      if (Math.abs(next - sway) > 1e-5) moving = true;
      sway = next;

      if (!moving && !needs) return;
      needs = false;
      place();
      renderer.render(scene, camera);
    },
    rotate(dYaw, dPitch) {
      goal.yaw += dYaw;
      goal.pitch = MathUtils.clamp(goal.pitch + dPitch, PITCH_MIN, PITCH_MAX);
      interacted();
    },
    zoom(steps) {
      goal.zoom = MathUtils.clamp(goal.zoom * Math.pow(0.82, steps), ZOOM_MIN, ZOOM_MAX);
      interacted();
    },
    view(v) {
      // Turn the short way round, so Front never spins a full circle.
      const aim = v === 'reset' ? homeYaw : v === 'front' ? 0 : v === 'side' ? Math.PI / 2 : Math.PI;
      const turns = Math.round((goal.yaw - aim) / (Math.PI * 2));
      goal.yaw = aim + turns * Math.PI * 2;
      goal.pitch = v === 'reset' ? homePitch : 0.08;
      goal.zoom = 1;
      interacted();
    },
    interacted,
    resize: fit,
    dispose() {
      canvas.removeEventListener('webglcontextlost', lost);
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        m.geometry.dispose();
        (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mat.dispose());
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
