/**
 * Boot-loader 3D dino — renders the Meshy raptor (walk animation) into the
 * boot loader, fading in over the lightweight CSS cuboid dino. Only imported
 * when the model is already cached (see index.html boot loader), so it never
 * adds startup latency. Uses the app's importmap (`three`) — the same engine
 * the app loads, so it's warm in the browser cache by the time this runs.
 *
 * Any failure here is swallowed by the caller; the CSS dino stays as fallback.
 */
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

const DINO = "/models/dino/";
let started = false;

export function mountDinoLoader(stage) {
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
  const base = tl.load("dino-basecolor.png"); base.colorSpace = THREE.SRGBColorSpace; base.flipY = false;
  const nrm = tl.load("dino-normal.png"); nrm.flipY = false;
  const rgh = tl.load("dino-roughness.png"); rgh.flipY = false;
  const met = tl.load("dino-metallic.png"); met.flipY = false;

  let mixer = null;
  const clock = new THREE.Clock();
  let revealed = false;

  new FBXLoader().load(DINO + "dino-walk.fbx", (fbx) => {
    const box0 = new THREE.Box3().setFromObject(fbx);
    const size0 = box0.getSize(new THREE.Vector3());
    const s = 2.4 / (Math.max(size0.x, size0.y, size0.z) || 1);
    fbx.scale.setScalar(s);
    let b = new THREE.Box3().setFromObject(fbx);
    let c = b.getCenter(new THREE.Vector3());
    fbx.position.x -= c.x; fbx.position.z -= c.z; fbx.position.y -= b.min.y;

    const mat = new THREE.MeshStandardMaterial({
      map: base, normalMap: nrm, roughnessMap: rgh, metalnessMap: met, metalness: 1, roughness: 1
    });
    fbx.traverse((o) => { if (o.isMesh) o.material = mat; });
    rig.add(fbx);

    if (fbx.animations.length) {
      mixer = new THREE.AnimationMixer(fbx);
      mixer.clipAction(fbx.animations[0]).play();
    }

    const sph = new THREE.Box3().setFromObject(fbx).getBoundingSphere(new THREE.Sphere());
    const dist = (sph.radius / Math.sin((camera.fov * Math.PI / 180) / 2)) * 1.12;
    camera.position.set(dist * 0.42, sph.center.y + sph.radius * 0.35, dist * 0.92);
    camera.lookAt(0, sph.center.y, 0);
  }, undefined, () => { /* missing-texture warnings are harmless; ignore */ });

  (function loop() {
    if (!canvas.isConnected) {            // boot loader removed → tear down
      renderer.dispose();
      return;
    }
    requestAnimationFrame(loop);
    const dt = clock.getDelta();
    if (mixer) {
      mixer.update(reduce ? 0 : dt);
      if (!revealed) {                    // first textured frame → swap CSS dino for 3D
        revealed = true;
        canvas.style.opacity = "1";
        const css = stage.querySelector(".dino3d-walk");
        if (css) { css.style.transition = "opacity .5s ease"; css.style.opacity = "0"; }
      }
    }
    if (!reduce) rig.rotation.y += dt * 0.55;   // slow turn-around so all sides show
    renderer.render(scene, camera);
  })();
}
