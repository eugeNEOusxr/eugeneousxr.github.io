// src/calendar/CylinderBackdrop.js
// Wraps the 3D calendar inside an open-ended cylinder ("prism") whose inner wall
// shows a panorama (a day/background image, or a procedural cosmic sky). Replaces
// the flat nebula skybox with an enclosing tube you stand inside, plus a soft
// floor for grounding. The wall is unfogged so it reads as the environment, while
// the scene's fog still fades the calendar content into the distance.
import * as THREE from "three";

/** Wide panorama: cosmic vertical gradient + a horizon glow band + a star field. */
function makePanoramaTexture() {
  const c = document.createElement("canvas");
  c.width = 2048; c.height = 1024;
  const ctx = c.getContext("2d");

  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0.00, "#04060f");
  g.addColorStop(0.40, "#0c1430");
  g.addColorStop(0.56, "#1b2c58");   // horizon
  g.addColorStop(0.62, "#0e1838");
  g.addColorStop(1.00, "#04050a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);

  // horizon glow band
  const hg = ctx.createLinearGradient(0, c.height * 0.50, 0, c.height * 0.64);
  hg.addColorStop(0, "rgba(110,170,255,0)");
  hg.addColorStop(0.5, "rgba(130,185,255,0.20)");
  hg.addColorStop(1, "rgba(110,170,255,0)");
  ctx.fillStyle = hg;
  ctx.fillRect(0, c.height * 0.50, c.width, c.height * 0.14);

  // stars, concentrated in the upper half (sky) — brighter so they actually read
  for (let i = 0; i < 620; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height * 0.55;
    const r = 0.5 + Math.random() * 1.7;
    const a = 0.35 + Math.random() * 0.6;
    if (Math.random() < 0.08) { // a few bright stars with a soft glow
      const gl = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      gl.addColorStop(0, "rgba(220,230,255,0.9)");
      gl.addColorStop(1, "rgba(220,230,255,0)");
      ctx.fillStyle = gl;
      ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(210, 222, 255, ${a})`;
    ctx.fill();
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/**
 * @param {{ texture?: THREE.Texture, radius?: number, height?: number,
 *           segments?: number, repeatX?: number }} [opts]
 * @returns {THREE.Group} group with .setTexture(tex) + .setRepeat(n)
 */
export function createCylinderBackdrop(opts = {}) {
  const radius = opts.radius ?? 74;     // > controls.maxDistance (60) so the camera stays inside
  const height = opts.height ?? 120;
  const segments = opts.segments ?? 60; // raise → smooth cylinder; lower (8–12) → faceted prism
  const repeatX = opts.repeatX ?? 1;

  const group = new THREE.Group();
  group.name = "cylinder-backdrop";

  const tex = opts.texture || makePanoramaTexture();
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, 1);

  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments, 1, true), // open-ended tube
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  wall.name = "cyl-wall";
  wall.renderOrder = -10; // draw behind everything
  group.add(wall);

  // soft floor: a dark disc with a faint central glow, so the world feels grounded
  const fc = document.createElement("canvas");
  fc.width = fc.height = 512;
  const fx = fc.getContext("2d");
  const fg = fx.createRadialGradient(256, 256, 0, 256, 256, 256);
  fg.addColorStop(0, "#14203f");
  fg.addColorStop(0.5, "#0a1020");
  fg.addColorStop(1, "#04060c");
  fx.fillStyle = fg;
  fx.fillRect(0, 0, 512, 512);
  const floorTex = new THREE.CanvasTexture(fc);
  floorTex.colorSpace = THREE.SRGBColorSpace;

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(radius, segments),
    new THREE.MeshBasicMaterial({ map: floorTex, side: THREE.DoubleSide, fog: false, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -height / 2 + 0.4;
  floor.name = "cyl-floor";
  floor.renderOrder = -9;
  group.add(floor);

  /** Swap the wall image (e.g. to the open day's background). */
  group.setTexture = (texture) => {
    if (!texture) return;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.set(group._repeatX ?? repeatX, 1);
    const old = wall.material.map;
    wall.material.map = texture;
    wall.material.needsUpdate = true;
    if (old && old !== texture) old.dispose?.();
  };
  group.setRepeat = (n) => { group._repeatX = n; wall.material.map?.repeat.set(n, 1); };

  return group;
}
