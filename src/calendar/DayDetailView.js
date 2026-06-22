import * as THREE from "three";
import { hourHasNotesInDay, getDayById } from "./calendarState.js";

// The day view is a CYLINDER ("prism") you look into: a curved wall (the day's
// panorama) wraps ~290° around, with the 24 hour tiles curved along the inside by
// time-of-day → angle. The ~70° opening faces the camera (which frames the day from
// ~6.2 units in front), so you peer into the day's tube and the hours arc away from
// you around the wall.
const RADIUS = 3.7;          // wall radius (camera sits ~6.2 in front → looks into the opening)
const WALL_H = 4.9;          // wall height
const OPENING = Math.PI * (70 / 180);          // ~70° gap facing the camera
const ARC = Math.PI * 2 - OPENING;             // wall covers the rest (~290°)
const RING_Y = 0.1;          // hours band vertical center
const RING_GAP = 0.5;        // vertical spacing between the two hour rings
const TILE_W = 0.98, TILE_H = 0.62;

/**
 * Zoomed-in 3D day, wrapped into a cylinder. Notes read from CalendarState only.
 */
export class DayDetailView {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "DayDetailView";
    this.group.visible = false;
    scene.add(this.group);

    this.hourMeshes = new Map();
    this._selectedHour = "0";
    this._hoveredHour = null;
    this._dayId = null;
    this._state = null;

    this._buildBackdrop();
  }

  // φ (measured from +z, going CCW) for column 0..11 — spans the wall arc, leaving
  // the opening centered on +z (toward the camera). 24 hours = 2 rings of 12.
  _colPhi(col) { return OPENING / 2 + ((col + 0.5) / 12) * ARC; }

  _buildBackdrop() {
    // Curved wall — the day's panorama. Gap centered on +z so the camera looks in.
    // CylinderGeometry's theta starts at +x; offset so the ARC leaves the +z opening.
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(RADIUS, RADIUS, WALL_H, 64, 1, true, Math.PI / 2 + OPENING / 2, ARC),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false })
    );
    wall.material.map = this._wallTexture();
    wall.renderOrder = -5;
    wall.name = "day-cyl-wall";
    this.group.add(wall);
    this.wall = wall;

    // Soft floor + ceiling rings to close the tube a little.
    const capMat = new THREE.MeshBasicMaterial({ color: 0x070b18, side: THREE.DoubleSide, fog: false, depthWrite: false, transparent: true, opacity: 0.9 });
    const floor = new THREE.Mesh(new THREE.RingGeometry(0, RADIUS, 48, 1, Math.PI / 2 + OPENING / 2, ARC), capMat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = -WALL_H / 2 + 0.02; floor.renderOrder = -6;
    this.group.add(floor);

    // Date banner floating above the opening, facing the camera.
    const titleMat = new THREE.MeshBasicMaterial({ map: this._labelTexture("Select a time", 480, 64, 30), transparent: true, depthTest: false });
    this.titlePlane = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.62), titleMat);
    this.titlePlane.position.set(0, WALL_H / 2 - 0.25, RADIUS * 0.55);
    this.titlePlane.renderOrder = 5;
    this.group.add(this.titlePlane);
  }

  /** Wide cosmic panorama for the inner wall: gradient + horizon glow + hour ticks. */
  _wallTexture() {
    const c = document.createElement("canvas");
    c.width = 2048; c.height = 512;
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0.00, "#070d20");
    g.addColorStop(0.45, "#122047");
    g.addColorStop(0.60, "#1c356b"); // horizon
    g.addColorStop(0.62, "#142a55");
    g.addColorStop(1.00, "#05070f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
    // horizon glow
    const hg = ctx.createLinearGradient(0, c.height * 0.52, 0, c.height * 0.66);
    hg.addColorStop(0, "rgba(120,175,255,0)");
    hg.addColorStop(0.5, "rgba(140,190,255,0.18)");
    hg.addColorStop(1, "rgba(120,175,255,0)");
    ctx.fillStyle = hg; ctx.fillRect(0, c.height * 0.52, c.width, c.height * 0.14);
    // faint vertical hour ticks (24 across the arc)
    ctx.strokeStyle = "rgba(150,180,235,0.12)"; ctx.lineWidth = 2;
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * c.width;
      ctx.beginPath(); ctx.moveTo(x, c.height * 0.30); ctx.lineTo(x, c.height * 0.72); ctx.stroke();
    }
    // stars up top
    for (let i = 0; i < 240; i++) {
      const x = Math.random() * c.width, y = Math.random() * c.height * 0.42;
      const r = 0.5 + Math.random() * 1.3, a = 0.3 + Math.random() * 0.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(205,220,255,${a})`; ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  _labelTexture(text, w, h, fontSize) {
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 8;
    ctx.fillText(text, w / 2, h / 2);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * @param {string} dayId
   * @param {import("./calendarState.js").CalendarState} state
   * @param {THREE.Vector3} worldAnchor
   * @param {string} dayLabel
   */
  show(dayId, state, worldAnchor, dayLabel) {
    this._dayId = dayId;
    this._state = state;
    this.group.visible = true;
    this.group.position.copy(worldAnchor);
    this.group.position.z += 0.5;

    this._updateTitleTexture(dayLabel);
    this._rebuildHourSlots();
    this.setSelectedHour(this._selectedHour);
  }

  hide() {
    this.group.visible = false;
    this._clearHourSlots();
    this._dayId = null;
  }

  /** World-space center of the cylinder for camera framing. */
  getAttentionWorldCenter() {
    return this.group.localToWorld(new THREE.Vector3(0, RING_Y, 0));
  }

  _updateTitleTexture(label) {
    const old = this.titlePlane.material.map;
    old?.dispose();
    this.titlePlane.material.map = this._labelTexture(label, 520, 64, 30);
    this.titlePlane.material.needsUpdate = true;
  }

  _rebuildHourSlots() {
    this._clearHourSlots();
    const day = this._state && this._dayId ? getDayById(this._state, this._dayId) : null;
    const r = RADIUS - 0.12;
    for (let h = 0; h < 24; h++) {
      const hasNote = day ? hourHasNotesInDay(day, h) : false;
      const col = h % 12;
      const upper = h < 12;                 // 0–11 upper ring (AM), 12–23 lower ring (PM)
      const phi = this._colPhi(col);
      const x = -r * Math.sin(phi);
      const z = r * Math.cos(phi);
      const y = RING_Y + (upper ? RING_GAP : -RING_GAP);
      const mesh = this._createHourMesh(h, hasNote);
      mesh.position.set(x, y, z);
      mesh.lookAt(0, y, 0);                  // face the cylinder axis (inward → camera)
      mesh.userData.hour = String(h);
      this.group.add(mesh);
      this.hourMeshes.set(String(h), mesh);
    }
  }

  _createHourMesh(hour, hasNote) {
    const label = `${String(hour).padStart(2, "0")}:00`;
    const canvas = document.createElement("canvas");
    canvas.width = 160; canvas.height = 100;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e293b";
    roundRect(ctx, 4, 4, 152, 92, 12); ctx.fill();
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 2;
    roundRect(ctx, 4, 4, 152, 92, 12); ctx.stroke();
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, 80, 50);
    if (hasNote) {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath(); ctx.arc(140, 18, 7, 0, Math.PI * 2); ctx.fill();
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({
      map, roughness: 0.45, metalness: 0.1, emissive: 0x000000, emissiveIntensity: 0,
      transparent: true, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(TILE_W, TILE_H), mat);
    mesh.userData.isHourSlot = true;
    return mesh;
  }

  setSelectedHour(hour) {
    this._selectedHour = hour;
    this._applyHourVisuals(this._hoveredHour);
  }

  setHoveredHour(hour) {
    this._hoveredHour = hour;
    this._applyHourVisuals(hour);
  }

  _applyHourVisuals(hoveredHour) {
    this.hourMeshes.forEach((mesh, h) => {
      const selected = h === this._selectedHour;
      const hovered = hoveredHour != null && h === hoveredHour && !selected;
      const mat = mesh.material;
      if (selected) {
        mat.emissive.set(0x1d4ed8); mat.emissiveIntensity = 0.7; mesh.scale.set(1.22, 1.22, 1);
      } else if (hovered) {
        mat.emissive.set(0xfbbf24); mat.emissiveIntensity = 0.55; mesh.scale.set(1.12, 1.12, 1);
      } else {
        mat.emissive.set(0x000000); mat.emissiveIntensity = 0; mesh.scale.set(1, 1, 1);
      }
    });
  }

  /** Brief glow when navigating from a notification. */
  pulseHour(hour) {
    const mesh = this.hourMeshes.get(String(hour));
    if (!mesh) return;
    const mat = mesh.material;
    const base = 0.7;
    let step = 0;
    const id = setInterval(() => {
      step += 1;
      mat.emissiveIntensity = base + (step % 2 === 0 ? 0.35 : 0);
      if (step >= 6) { clearInterval(id); mat.emissiveIntensity = base; }
    }, 180);
  }

  refreshHourIndicators() {
    if (!this._dayId || !this._state) return;
    this._rebuildHourSlots();
    this.setSelectedHour(this._selectedHour);
  }

  getHourMeshes() {
    return Array.from(this.hourMeshes.values());
  }

  getHourFromObject(object) {
    let cur = object;
    while (cur) {
      if (cur.userData?.hour != null) return String(cur.userData.hour);
      cur = cur.parent;
    }
    return null;
  }

  _clearHourSlots() {
    this.hourMeshes.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
      this.group.remove(mesh);
    });
    this.hourMeshes.clear();
  }

  dispose() {
    this.hide();
    this.scene.remove(this.group);
    this.wall?.geometry.dispose();
    this.wall?.material.map?.dispose();
    this.wall?.material.dispose();
    this.titlePlane.geometry.dispose();
    this.titlePlane.material.map?.dispose();
    this.titlePlane.material.dispose();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
