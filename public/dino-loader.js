/**
 * Boot-loader 3D dino — renders the Meshy raptor ("official pose" static export)
 * into the boot loader, fading in over the lightweight CSS cuboid dino. Only
 * imported when the model is already cached (see index.html boot loader), so it
 * never adds startup latency. Uses the app's importmap (`three`).
 *
 * Splotch fix: ALL textures are awaited before the dino is revealed (the earlier
 * version revealed on FBX-ready, so on a phone the dino flashed in with half-loaded
 * maps). Material uses base + normal + combined metallic-roughness (ORM) + emissive.
 *
 * Any failure here is swallowed by the caller; the CSS dino stays as fallback.
 */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const DINO = "/models/dino/";
let started = false;

export async function mountDinoLoader(stage) {
  if (started || !stage) return;
  started = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const W = 300, H = 210;
  const canvas = document.createElement("canvas");
  canvas.className = "dino3d-canvas";
  canvas.style.cssText =
    "position:absolute;left:50%;top:50%;width:" + W + "px;height:" + H +
    "px;transform:translate(-50%,-58%);opacity:0;transition:opacity .6s ease;pointer-events:none;";
  stage.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const rig = new THREE.Group();          // spun for the turn-around
  scene.add(rig);
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xcfeeff, 0x2a3344, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 6, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x66e0c8, 1.4); rim.position.set(-4, 2, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1.3); fill.position.set(0, 1.5, 6); scene.add(fill); // camera-side fill

  const tl = new THREE.TextureLoader().setPath(DINO);
  const loadTex = (f, srgb) => tl.loadAsync(f).then((t) => {
    t.flipY = false; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
  });

  let model = null;
  try {
    // Wait for the FBX AND every texture before showing anything (no half-painted flash).
    const [fbx, base, nrm, orm, emit] = await Promise.all([
      new FBXLoader().loadAsync(DINO + "dino2.fbx"),
      loadTex("dino2-basecolor.png", true),
      loadTex("dino2-normal.png", false),
      loadTex("dino2-orm.png", false),
      loadTex("dino2-emit.png", true)
    ]);
    if (!canvas.isConnected) { renderer.dispose(); return; }

    const mat = new THREE.MeshStandardMaterial({
      map: base, normalMap: nrm,
      roughnessMap: orm, metalnessMap: orm, roughness: 1, metalness: 1, // glTF ORM: G=rough, B=metal
      emissiveMap: emit, emissive: 0xffffff, emissiveIntensity: 1
    });
    fbx.traverse((o) => { if (o.isMesh) o.material = mat; });

    // auto-fit: longest dimension ~2.4 units, dropped onto y=0
    const s = 2.4 / (Math.max(...new THREE.Box3().setFromObject(fbx).getSize(new THREE.Vector3()).toArray()) || 1);
    fbx.scale.setScalar(s);
    const b = new THREE.Box3().setFromObject(fbx);
    const c = b.getCenter(new THREE.Vector3());
    fbx.position.x -= c.x; fbx.position.z -= c.z; fbx.position.y -= b.min.y;
    rig.add(fbx);
    model = fbx;

    const sph = new THREE.Box3().setFromObject(fbx).getBoundingSphere(new THREE.Sphere());
    const dist = (sph.radius / Math.sin((camera.fov * Math.PI / 180) / 2)) * 1.12;
    camera.position.set(dist * 0.42, sph.center.y + sph.radius * 0.35, dist * 0.92);
    camera.lookAt(0, sph.center.y, 0);

    // reveal: textures are fully loaded now, so no splotchy flash
    canvas.style.opacity = "1";
    const css = stage.querySelector(".dino3d-walk");
    if (css) { css.style.transition = "opacity .5s ease"; css.style.opacity = "0"; }
  } catch (e) {
    renderer.dispose();
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    return; // caller keeps the CSS dino
  }

  const clock = new THREE.Clock();
  (function loop() {
    if (!canvas.isConnected) { renderer.dispose(); return; }
    requestAnimationFrame(loop);
    const dt = clock.getDelta();
    if (!reduce && model) {
      rig.rotation.y += dt * 0.55;                 // slow turn-around so all sides show
      rig.position.y = Math.sin(clock.elapsedTime * 2.2) * 0.04; // gentle idle bob
    }
    renderer.render(scene, camera);
  })();
}
