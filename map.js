/**
 * Marginalia — Tokyo District Map (GeoJSON-based)
 * Three.js implementation
 *
 * 6 highlighted districts: Shinjuku, Shibuya, Omotesando+Aoyama (港区),
 *                          Ueno, Ginza, Ikebukuro
 * 23 wards total as background context
 *
 * Interactions:
 *  - Mouse move → whole map tilts (perspective)
 *  - Hover highlighted district → rises on Z + scales 1.5x
 */

import * as THREE from 'three';

// ── Constants ──────────────────────────────────────────────────────────────

const BG      = 0xf2f0eb;
const INK     = 0x1a1a18;
const FILL_BG = 0xe0ddd6;   // background wards
const FILL_HI = 0xc8c4bb;   // highlighted wards (resting)
const FILL_HO = 0x1a1a18;   // hovered

const SLAB_REST = 0.05;
const SLAB_ELEV = 1.4;
const SCALE_HOV = 1.5;
const TILT_MAX  = 0.16;

// Map ward name → district config
const HIGHLIGHT_WARDS = {
  '新宿区': { id: 'shinjuku',    nameEn: 'Shinjuku',         nameJp: '新宿',   count: '24 works' },
  '渋谷区': { id: 'shibuya',     nameEn: 'Shibuya',          nameJp: '渋谷',   count: '21 works' },
  '港区':   { id: 'omotesando',  nameEn: 'Omotesando / Aoyama', nameJp: '表参道・青山', count: '28 works' },
  '台東区': { id: 'ueno',        nameEn: 'Ueno',             nameJp: '上野',   count: '17 works' },
  '中央区': { id: 'ginza',       nameEn: 'Ginza',            nameJp: '銀座',   count: '19 works' },
  '豊島区': { id: 'ikebukuro',   nameEn: 'Ikebukuro',        nameJp: '池袋',   count: '18 works' },
};

// ── DOM ────────────────────────────────────────────────────────────────────

const wrapper   = document.getElementById('mapWrapper');
const canvas    = document.getElementById('mapCanvas');
const tooltip   = document.getElementById('mapTooltip');
const labelsEl  = document.getElementById('districtLabels');

// ── Renderer ───────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(BG);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
camera.position.set(0, 0, 18);

const ambient  = new THREE.AmbientLight(0xffffff, 0.85);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(4, 8, 10);
scene.add(ambient, dirLight);

// ── Projection ─────────────────────────────────────────────────────────────
// Tokyo 23-ku bounding box (approx)
// lon: 139.56 – 139.92   lat: 35.52 – 35.82

const LON_MIN = 139.56, LON_MAX = 139.92;
const LAT_MIN = 35.52,  LAT_MAX = 35.82;
const MAP_W   = 11;   // Three.js units wide
const MAP_H   = MAP_W * ((LAT_MAX - LAT_MIN) / (LON_MAX - LON_MIN));

function project([lon, lat]) {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN) - 0.5) * MAP_W;
  const y = ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN) - 0.5) * MAP_H;
  return [x, y];
}

// ── Shape Builder ──────────────────────────────────────────────────────────

function ringToShape(ring) {
  const shape = new THREE.Shape();
  const [x0, y0] = project(ring[0]);
  shape.moveTo(x0, y0);
  for (let i = 1; i < ring.length; i++) {
    const [x, y] = project(ring[i]);
    shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function buildShapes(geometry) {
  const shapes = [];
  if (geometry.type === 'Polygon') {
    const outer = ringToShape(geometry.coordinates[0]);
    // holes
    for (let h = 1; h < geometry.coordinates.length; h++) {
      const hole = new THREE.Path();
      const [hx0, hy0] = project(geometry.coordinates[h][0]);
      hole.moveTo(hx0, hy0);
      for (let i = 1; i < geometry.coordinates[h].length; i++) {
        const [hx, hy] = project(geometry.coordinates[h][i]);
        hole.lineTo(hx, hy);
      }
      hole.closePath();
      outer.holes.push(hole);
    }
    shapes.push(outer);
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of geometry.coordinates) {
      const outer = ringToShape(poly[0]);
      for (let h = 1; h < poly.length; h++) {
        const hole = new THREE.Path();
        const [hx0, hy0] = project(poly[h][0]);
        hole.moveTo(hx0, hy0);
        for (let i = 1; i < poly[h].length; i++) {
          const [hx, hy] = project(poly[h][i]);
          hole.lineTo(hx, hy);
        }
        hole.closePath();
        outer.holes.push(hole);
      }
      shapes.push(outer);
    }
  }
  return shapes;
}

// ── Grid Overlay ───────────────────────────────────────────────────────────

function makeGrid() {
  const group = new THREE.Group();
  const mat   = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.08 });
  const ext   = 8;
  const step  = 0.6;
  for (let x = -ext; x <= ext; x += step) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -ext, 0.001), new THREE.Vector3(x, ext, 0.001)
    ]);
    group.add(new THREE.Line(g, mat));
  }
  for (let y = -ext; y <= ext; y += step) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-ext, y, 0.001), new THREE.Vector3(ext, y, 0.001)
    ]);
    group.add(new THREE.Line(g, mat));
  }
  return group;
}

// ── Load & Build Map ───────────────────────────────────────────────────────

const tiltGroup = new THREE.Group();
scene.add(tiltGroup);
tiltGroup.add(makeGrid());

const wardMeshes    = [];   // all clickable highlight meshes
const meshByWard    = {};   // wardName → mesh group
const centroidByWard = {};  // wardName → {x,y}

function computeCentroid(shapes) {
  let sx = 0, sy = 0, count = 0;
  for (const shape of shapes) {
    for (const pt of shape.getPoints(4)) {
      sx += pt.x; sy += pt.y; count++;
    }
  }
  return { x: sx / count, y: sy / count };
}

fetch('tokyo_wards.geojson')
  .then(r => r.json())
  .then(geojson => {

    // Group features by ward name
    const byWard = {};
    for (const ft of geojson.features) {
      const name = ft.properties.name;
      if (!byWard[name]) byWard[name] = [];
      byWard[name].push(ft.geometry);
    }

    const extOpts = { depth: SLAB_REST, bevelEnabled: false };
    const extOptsHi = { depth: SLAB_REST * 1.5, bevelEnabled: false };

    for (const [wardName, geometries] of Object.entries(byWard)) {
      const isHighlight = wardName in HIGHLIGHT_WARDS;
      const allShapes = geometries.flatMap(buildShapes);
      if (allShapes.length === 0) continue;

      const centroid = computeCentroid(allShapes);
      centroidByWard[wardName] = centroid;

      const group = new THREE.Group();

      for (const shape of allShapes) {
        const geo = new THREE.ExtrudeGeometry(shape, isHighlight ? extOptsHi : extOpts);

        const matFace = new THREE.MeshLambertMaterial({
          color: isHighlight ? FILL_HI : FILL_BG,
        });
        const matSide = new THREE.MeshLambertMaterial({
          color: isHighlight ? 0x888880 : 0xc0bdb6,
        });
        const mesh = new THREE.Mesh(geo, [matFace, matSide]);

        // Outline
        const edges   = new THREE.EdgesGeometry(geo);
        const lineMat = new THREE.LineBasicMaterial({
          color: INK,
          transparent: true,
          opacity: isHighlight ? 0.55 : 0.20,
        });
        mesh.add(new THREE.LineSegments(edges, lineMat));
        group.add(mesh);

        if (isHighlight) wardMeshes.push(mesh);
      }

      group.userData.wardName   = wardName;
      group.userData.isHighlight = isHighlight;
      tiltGroup.add(group);
      meshByWard[wardName] = group;
    }

    // Build HTML labels for highlighted wards
    for (const [wardName, cfg] of Object.entries(HIGHLIGHT_WARDS)) {
      const el = document.createElement('div');
      el.className = 'district-label';
      el.id = `label-${cfg.id}`;
      el.innerHTML = `<span class="district-label__en">${cfg.nameEn}</span><span class="district-label__jp">${cfg.nameJp}</span>`;
      labelsEl.appendChild(el);
    }

    // Update legend dots
    document.querySelectorAll('.legend-item').forEach(item => {
      const id = item.dataset.district;
      const cfg = Object.values(HIGHLIGHT_WARDS).find(c => c.id === id);
      if (cfg) {
        item.querySelector('.legend-count').textContent = cfg.nameJp;
      }
    });

  });

// ── Interaction State ──────────────────────────────────────────────────────

let mouseNorm   = { x: 0, y: 0 };
let hoveredWard = null;

const raycaster = new THREE.Raycaster();
const mouse3    = new THREE.Vector2();

const tiltTarget  = { rx: 0, ry: 0 };
const tiltCurrent = { rx: 0, ry: 0 };

// Per-ward animation state
const wardState = {};
for (const wardName of Object.keys(HIGHLIGHT_WARDS)) {
  wardState[wardName] = { z: 0, scale: 1, zT: 0, scaleT: 1 };
}

function setHover(wardName) {
  if (wardName === hoveredWard) return;

  // Reset previous
  if (hoveredWard) {
    wardState[hoveredWard].zT     = 0;
    wardState[hoveredWard].scaleT = 1;
    const prev = meshByWard[hoveredWard];
    if (prev) prev.traverse(o => {
      if (o.isMesh && o.material[0]) o.material[0].color.setHex(FILL_HI);
    });
  }

  hoveredWard = wardName;

  if (hoveredWard) {
    wardState[hoveredWard].zT     = SLAB_ELEV;
    wardState[hoveredWard].scaleT = SCALE_HOV;
    const cur = meshByWard[hoveredWard];
    if (cur) cur.traverse(o => {
      if (o.isMesh && o.material[0]) o.material[0].color.setHex(FILL_HO);
    });

    const cfg = HIGHLIGHT_WARDS[hoveredWard];
    tooltip.querySelector('.map-tooltip__name').textContent  = cfg.nameEn + ' · ' + cfg.nameJp;
    tooltip.querySelector('.map-tooltip__count').textContent = cfg.count;
    tooltip.classList.add('visible');
  } else {
    tooltip.classList.remove('visible');
  }
}

// ── Events ─────────────────────────────────────────────────────────────────

wrapper.addEventListener('mousemove', e => {
  const rect = wrapper.getBoundingClientRect();
  mouseNorm.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouseNorm.y = ((e.clientY - rect.top)  / rect.height) * 2 - 1;

  mouse3.set(mouseNorm.x, -mouseNorm.y);
  raycaster.setFromCamera(mouse3, camera);
  const hits = raycaster.intersectObjects(wardMeshes, false);

  if (hits.length > 0) {
    const hitGroup = hits[0].object.parent;
    setHover(hitGroup?.userData?.wardName ?? null);
  } else {
    setHover(null);
  }
});

wrapper.addEventListener('mouseleave', () => {
  mouseNorm = { x: 0, y: 0 };
  setHover(null);
});

// ── Labels ─────────────────────────────────────────────────────────────────

function project3D(x, y, z) {
  const v = new THREE.Vector3(x, y, z);
  v.applyEuler(tiltGroup.rotation);
  v.project(camera);
  return {
    left: ((v.x + 1) / 2) * wrapper.clientWidth,
    top:  ((-v.y + 1) / 2) * CANVAS_H,
  };
}

const CANVAS_H = 560;

function updateLabels() {
  for (const [wardName, cfg] of Object.entries(HIGHLIGHT_WARDS)) {
    const el = document.getElementById(`label-${cfg.id}`);
    if (!el || !centroidByWard[wardName]) continue;
    const { x, y } = centroidByWard[wardName];
    const state = wardState[wardName];
    const pos = project3D(
      x + (x - x * state.scale),
      y + (y - y * state.scale),
      state.z + SLAB_REST * 1.5 + 0.1
    );
    el.style.left    = pos.left + 'px';
    el.style.top     = pos.top  + 'px';
    el.style.opacity = hoveredWard && hoveredWard !== wardName ? '0.35' : '1';
  }
}

// ── Resize ─────────────────────────────────────────────────────────────────

function onResize() {
  const w = wrapper.clientWidth;
  renderer.setSize(w, CANVAS_H);
  camera.aspect = w / CANVAS_H;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// ── Animate ────────────────────────────────────────────────────────────────

function lerp(a, b, t) { return a + (b - a) * t; }

function animate() {
  requestAnimationFrame(animate);

  tiltTarget.rx = -mouseNorm.y * TILT_MAX;
  tiltTarget.ry =  mouseNorm.x * TILT_MAX;
  tiltCurrent.rx = lerp(tiltCurrent.rx, tiltTarget.rx, 0.06);
  tiltCurrent.ry = lerp(tiltCurrent.ry, tiltTarget.ry, 0.06);
  tiltGroup.rotation.x = tiltCurrent.rx;
  tiltGroup.rotation.y = tiltCurrent.ry;

  for (const [wardName, state] of Object.entries(wardState)) {
    state.z     = lerp(state.z,     state.zT,     0.09);
    state.scale = lerp(state.scale, state.scaleT, 0.09);

    const group = meshByWard[wardName];
    if (!group) continue;

    const c = centroidByWard[wardName];
    if (!c) continue;

    const s = state.scale;
    group.position.set(c.x * (1 - s), c.y * (1 - s), state.z);
    group.scale.set(s, s, 1);
  }

  updateLabels();
  renderer.render(scene, camera);
}

animate();
