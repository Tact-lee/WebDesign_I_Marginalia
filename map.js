/**
 * Marginalia — Tokyo District Map
 * Three.js implementation
 *
 * Interactions:
 *  - Mouse move  → whole map tilts (perspective tilt)
 *  - Hover district → rises on Z-axis + scales 1.5x
 */

import * as THREE from 'three';

// ── Constants ──────────────────────────────────────────────────────────────

const BG    = 0xf2f0eb;
const INK   = 0x1a1a18;
const INK_L = 0xd8d5ce;   // light fill for non-hovered districts
const INK_H = 0x1a1a18;   // hovered district fill

const CANVAS_W = () => wrapper.clientWidth;
const CANVAS_H = 560;

// District data — approximate normalized XY positions in a 10×8 grid (Tokyo layout)
// and rough polygon shapes. Coordinates are in [-5..5] × [-4..4] space.
const DISTRICTS = [
  {
    id: 'ikebukuro',
    nameEn: 'Ikebukuro',
    nameJp: '池袋',
    count: '18 works',
    // Upper-left cluster
    shape: [
      [-4.2, 2.8], [-2.6, 2.8], [-2.6, 1.2], [-3.2, 0.6], [-4.2, 0.6]
    ],
    cx: -3.4, cy: 1.8,
  },
  {
    id: 'shinjuku',
    nameEn: 'Shinjuku',
    nameJp: '新宿',
    count: '24 works',
    shape: [
      [-2.4, 1.4], [-0.8, 1.4], [-0.8, -0.2], [-1.6, -0.8], [-2.8, -0.2], [-2.8, 0.6]
    ],
    cx: -1.8, cy: 0.4,
  },
  {
    id: 'shibuya',
    nameEn: 'Shibuya',
    nameJp: '渋谷',
    count: '21 works',
    shape: [
      [-1.6, -1.0], [-0.2, -1.0], [-0.2, -2.4], [-1.0, -2.8], [-2.0, -2.0]
    ],
    cx: -1.0, cy: -1.8,
  },
  {
    id: 'omotesando',
    nameEn: 'Omotesando',
    nameJp: '表参道',
    count: '16 works',
    shape: [
      [-0.0, -0.4], [1.4, -0.4], [1.6, -1.6], [0.4, -2.2], [-0.4, -1.4]
    ],
    cx: 0.7, cy: -1.2,
  },
  {
    id: 'aoyama',
    nameEn: 'Aoyama',
    nameJp: '青山',
    count: '12 works',
    shape: [
      [1.6, -0.2], [3.0, -0.2], [3.2, -1.4], [1.8, -1.8], [1.2, -0.8]
    ],
    cx: 2.2, cy: -0.9,
  },
  {
    id: 'ginza',
    nameEn: 'Ginza',
    nameJp: '銀座',
    count: '19 works',
    shape: [
      [2.0, -1.8], [3.6, -1.8], [3.8, -3.2], [2.6, -3.6], [1.8, -2.6]
    ],
    cx: 2.8, cy: -2.6,
  },
  {
    id: 'ueno',
    nameEn: 'Ueno',
    nameJp: '上野',
    count: '17 works',
    shape: [
      [0.2, 1.8], [2.0, 1.8], [2.2, 0.4], [1.0, -0.2], [0.0, 0.4]
    ],
    cx: 1.1, cy: 0.9,
  },
];

// ── Setup ──────────────────────────────────────────────────────────────────

const wrapper = document.getElementById('mapWrapper');
const canvas  = document.getElementById('mapCanvas');
const tooltip = document.getElementById('mapTooltip');
const labelsEl = document.getElementById('districtLabels');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(BG);

const scene  = new THREE.Scene();
const aspect = CANVAS_W() / CANVAS_H;
const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
camera.position.set(0, 0, 14);

// Ambient + directional light for subtle shading
const ambient = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(3, 6, 8);
scene.add(dirLight);

// ── Build Geometry ─────────────────────────────────────────────────────────

// We extrude each district polygon into a flat slab (thin box)
const SLAB_H  = 0.04;   // resting height
const SLAB_EL = 1.2;    // elevated height when hovered
const SCALE_H = 1.5;    // XY scale when hovered

// Convert our normalized coords to Three.js Shape
function makeShape(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

// Draw-blueprint cross-hatch lines inside each district
function makeHatchLines(pts, spacing = 0.22) {
  const group = new THREE.Group();
  // bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const mat = new THREE.LineBasicMaterial({ color: INK_L, transparent: true, opacity: 0.5 });
  // horizontal lines clipped by bounding box (simple approach)
  for (let y = minY + spacing * 0.5; y < maxY; y += spacing) {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(minX, y, SLAB_H + 0.002),
      new THREE.Vector3(maxX, y, SLAB_H + 0.002),
    ]);
    group.add(new THREE.Line(geo, mat));
  }
  return group;
}

// Grid overlay (architectural drawing feel)
function makeGridOverlay() {
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: INK_L, transparent: true, opacity: 0.25 });
  const ext = 6;
  const step = 0.5;
  for (let x = -ext; x <= ext; x += step) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, -ext, 0.001),
      new THREE.Vector3(x,  ext, 0.001),
    ]);
    group.add(new THREE.Line(g, mat));
  }
  for (let y = -ext; y <= ext; y += step) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-ext, y, 0.001),
      new THREE.Vector3( ext, y, 0.001),
    ]);
    group.add(new THREE.Line(g, mat));
  }
  return group;
}

scene.add(makeGridOverlay());

// District meshes
const districtMeshes = [];
const meshByDistrict = {};

DISTRICTS.forEach((d, i) => {
  const shape = makeShape(d.shape);
  const extrudeSettings = { depth: SLAB_H, bevelEnabled: false };
  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);

  // Face material (top)
  const matFace = new THREE.MeshLambertMaterial({ color: INK_L });
  // Edge/side material
  const matSide = new THREE.MeshLambertMaterial({ color: INK });

  const mesh = new THREE.Mesh(geo, [matFace, matSide]);
  mesh.userData = { districtId: d.id, index: i, ...d };
  mesh.position.z = 0;

  // Outline — use EdgesGeometry for crisp architectural lines
  const edges = new THREE.EdgesGeometry(geo);
  const lineMat = new THREE.LineBasicMaterial({ color: INK, linewidth: 2 });
  const outline = new THREE.LineSegments(edges, lineMat);
  mesh.add(outline);

  scene.add(mesh);
  districtMeshes.push(mesh);
  meshByDistrict[d.id] = mesh;
});

// ── Label Overlay (HTML over canvas) ──────────────────────────────────────

function project3DtoCSS(x3d, y3d, z3d) {
  const vec = new THREE.Vector3(x3d, y3d, z3d);
  vec.project(camera);
  const cw = CANVAS_W(), ch = CANVAS_H;
  return {
    left: ((vec.x + 1) / 2) * cw,
    top:  ((-vec.y + 1) / 2) * ch,
  };
}

// Create label elements
DISTRICTS.forEach(d => {
  const el = document.createElement('div');
  el.className = 'district-label';
  el.id = `label-${d.id}`;
  el.innerHTML = `<span class="district-label__en">${d.nameEn}</span><span class="district-label__jp">${d.nameJp}</span>`;
  labelsEl.appendChild(el);
});

function updateLabels() {
  DISTRICTS.forEach(d => {
    const el = document.getElementById(`label-${d.id}`);
    if (!el) return;
    const mesh = meshByDistrict[d.id];
    const wz = mesh.position.z + SLAB_H + 0.05;
    const pos = project3DtoCSS(d.cx, d.cy, wz);
    el.style.left = pos.left + 'px';
    el.style.top  = pos.top  + 'px';
  });
}

// ── Interaction State ──────────────────────────────────────────────────────

let mouseNorm = { x: 0, y: 0 };   // −1..1
let hoveredId = null;
const raycaster = new THREE.Raycaster();
const mouse3    = new THREE.Vector2();

// Tilt group — all districts live here so we can tilt as one
const tiltGroup = new THREE.Group();
districtMeshes.forEach(m => {
  scene.remove(m);
  tiltGroup.add(m);
});
scene.add(tiltGroup);

// Animation targets
const tiltTarget = { rx: 0, ry: 0 };
const tiltCurrent = { rx: 0, ry: 0 };

// Per-district animation state
const districtState = {};
DISTRICTS.forEach(d => {
  districtState[d.id] = { z: 0, scale: 1, zTarget: 0, scaleTarget: 1 };
});

// ── Event Handlers ─────────────────────────────────────────────────────────

wrapper.addEventListener('mousemove', e => {
  const rect = wrapper.getBoundingClientRect();
  mouseNorm.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  mouseNorm.y = ((e.clientY - rect.top)  / rect.height) * 2 - 1;

  // Raycasting for hover
  mouse3.set(mouseNorm.x, -mouseNorm.y);
  raycaster.setFromCamera(mouse3, camera);
  const hits = raycaster.intersectObjects(districtMeshes, false);

  const newHovered = hits.length > 0 ? hits[0].object.userData.districtId : null;

  if (newHovered !== hoveredId) {
    // Restore previous
    if (hoveredId) {
      districtState[hoveredId].zTarget     = 0;
      districtState[hoveredId].scaleTarget = 1;
      const prevMesh = meshByDistrict[hoveredId];
      prevMesh.material[0] && (prevMesh.material[0].color.setHex(INK_L));
      document.getElementById(`label-${hoveredId}`)?.style.setProperty('opacity', '1');
    }

    hoveredId = newHovered;

    if (hoveredId) {
      districtState[hoveredId].zTarget     = SLAB_EL;
      districtState[hoveredId].scaleTarget = SCALE_H;
      const hMesh = meshByDistrict[hoveredId];
      hMesh.material[0] && (hMesh.material[0].color.setHex(INK_H));

      // Tooltip
      const d = DISTRICTS.find(x => x.id === hoveredId);
      tooltip.querySelector('.map-tooltip__name').textContent  = d.nameEn + ' ' + d.nameJp;
      tooltip.querySelector('.map-tooltip__count').textContent = d.count;
      tooltip.classList.add('visible');
    } else {
      tooltip.classList.remove('visible');
    }
  }
});

wrapper.addEventListener('mouseleave', () => {
  mouseNorm = { x: 0, y: 0 };
  if (hoveredId) {
    districtState[hoveredId].zTarget     = 0;
    districtState[hoveredId].scaleTarget = 1;
    const m = meshByDistrict[hoveredId];
    m.material[0] && (m.material[0].color.setHex(INK_L));
  }
  hoveredId = null;
  tooltip.classList.remove('visible');
});

// ── Resize ─────────────────────────────────────────────────────────────────

function onResize() {
  const w = CANVAS_W(), h = CANVAS_H;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);
onResize();

// ── Animate ────────────────────────────────────────────────────────────────

const TILT_MAX = 0.18;  // radians
const LERP_TILT = 0.06;
const LERP_DISTRICT = 0.08;

function lerp(a, b, t) { return a + (b - a) * t; }

function animate() {
  requestAnimationFrame(animate);

  // Tilt group toward mouse
  tiltTarget.rx = -mouseNorm.y * TILT_MAX;
  tiltTarget.ry =  mouseNorm.x * TILT_MAX;

  tiltCurrent.rx = lerp(tiltCurrent.rx, tiltTarget.rx, LERP_TILT);
  tiltCurrent.ry = lerp(tiltCurrent.ry, tiltTarget.ry, LERP_TILT);

  tiltGroup.rotation.x = tiltCurrent.rx;
  tiltGroup.rotation.y = tiltCurrent.ry;

  // Per-district Z + scale animation
  DISTRICTS.forEach(d => {
    const state = districtState[d.id];
    state.z     = lerp(state.z,     state.zTarget,     LERP_DISTRICT);
    state.scale = lerp(state.scale, state.scaleTarget, LERP_DISTRICT);

    const mesh = meshByDistrict[d.id];
    mesh.position.z = state.z;
    mesh.scale.set(state.scale, state.scale, 1);
    // keep pivot at district center
    mesh.position.x = d.cx * (1 - state.scale);
    mesh.position.y = d.cy * (1 - state.scale);
  });

  updateLabels();
  renderer.render(scene, camera);
}

animate();
