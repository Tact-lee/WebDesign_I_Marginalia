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
  //                                                                              offsetX  offsetY  ← px 단위, 양수=오른쪽/아래, 음수=왼쪽/위
  '新宿区': { id: 'shinjuku',    nameEn: 'Shinjuku',            nameJp: '新宿',        count: '6 works',  offsetX:   0, offsetY:   0, href: 'shinjuku.html' },
  '渋谷区': { id: 'shibuya',     nameEn: 'Shibuya',             nameJp: '渋谷',        count: '6 works',  offsetX:   0, offsetY:   0, href: 'shibuya.html' },
  '港区':   { id: 'omotesando',  nameEn: 'Minato',              nameJp: '港区',        count: '21 works', offsetX:   0, offsetY:   0, href: 'district.html',
    subDistricts: [
      { nameEn: 'Omotesando', href: 'district.html' },
      { nameEn: 'Harajuku',   href: 'harajuku.html' },
      { nameEn: 'Aoyama',     href: 'aoyama.html'   },
      { nameEn: 'Roppongi',   href: 'roppongi.html' },
    ],
  },
  '台東区': { id: 'ueno',        nameEn: 'Ueno',                nameJp: '上野',        count: '3 works',  offsetX:   0, offsetY:   0, href: 'ueno.html' },
  '中央区': { id: 'ginza',       nameEn: 'Ginza',               nameJp: '銀座',        count: '11 works', offsetX:   0, offsetY:   0, href: 'ginza.html' },
  '豊島区': { id: 'ikebukuro',   nameEn: 'Ikebukuro',           nameJp: '池袋',        count: '3 works',  offsetX:   0, offsetY:   0, href: 'ikebukuro.html' },
};

// ── DOM ────────────────────────────────────────────────────────────────────

const wrapper   = document.getElementById('mapWrapper');
const canvas    = document.getElementById('mapCanvas');
const tooltip   = document.getElementById('mapTooltip');
const labelsEl  = document.getElementById('districtLabels');
const coordsEl  = document.getElementById('mapCoords');

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
  const ext   = 16;
  const step  = 0.3;   // ~16px — matches hero grid density
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
      if (cfg.subDistricts) {
        el.classList.add('district-label--minato');
        const subsDiv = document.createElement('div');
        subsDiv.className = 'district-label__subs';
        cfg.subDistricts.forEach(sub => {
          const a = document.createElement('a');
          a.className = 'district-label__sub';
          a.textContent = sub.nameEn;
          a.href = sub.href;
          a.addEventListener('click', e => e.stopPropagation());
          subsDiv.appendChild(a);
        });
        el.appendChild(subsDiv);
      }
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

function toDMS(deg, posDir, negDir) {
  const d = Math.floor(Math.abs(deg));
  const m = Math.floor((Math.abs(deg) - d) * 60);
  const s = Math.round(((Math.abs(deg) - d) * 60 - m) * 60);
  const dir = deg >= 0 ? posDir : negDir;
  return `${d}°${String(m).padStart(2,'0')}′${String(s).padStart(2,'0')}″${dir}`;
}

const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const _groundHit   = new THREE.Vector3();

// 클릭 시 district.html?id=... 으로 이동
wrapper.addEventListener('click', e => {
  const rect = wrapper.getBoundingClientRect();
  const cx = ((e.clientX - rect.left) / rect.width)  * 2 - 1;
  const cy = ((e.clientY - rect.top)  / rect.height) * 2 - 1;
  mouse3.set(cx, -cy);
  raycaster.setFromCamera(mouse3, camera);
  const hits = raycaster.intersectObjects(wardMeshes, false);
  if (hits.length > 0) {
    const wardName = hits[0].object.parent?.userData?.wardName;
    const cfg = HIGHLIGHT_WARDS[wardName];
    if (cfg) window.location.href = cfg.href || `district.html?id=${cfg.id}`;
  }
});

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

  // Update coordinate display
  if (coordsEl) {
    raycaster.ray.intersectPlane(_groundPlane, _groundHit);
    const lon = LON_MIN + (_groundHit.x / MAP_W + 0.5) * (LON_MAX - LON_MIN);
    const lat = LAT_MIN + (_groundHit.y / MAP_H + 0.5) * (LAT_MAX - LAT_MIN);
    if (lon >= LON_MIN - 0.1 && lon <= LON_MAX + 0.1) {
      coordsEl.textContent = `${toDMS(lat,'N','S')}  ${toDMS(lon,'E','W')}`;
    }
  }
});

wrapper.addEventListener('mouseleave', () => {
  mouseNorm = { x: 0, y: 0 };
  setHover(null);
  if (coordsEl) coordsEl.textContent = '—';
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
      x,
      y,
      state.z + SLAB_REST * 1.5 + 0.1
    );
    const isHovered = hoveredWard === wardName;
    const isFaded   = hoveredWard && !isHovered;

    el.style.left    = (pos.left + (isHovered ? (cfg.offsetX ?? 0) : 0)) + 'px';
    el.style.top     = (pos.top  + (isHovered ? (cfg.offsetY ?? 0) : 0)) + 'px';
    el.style.opacity = isFaded ? '0.35' : '1';

    /* Minato sub-district split */
    if (el.classList.contains('district-label--minato')) {
      if (isHovered) {
        el.classList.add('is-hovered');
      } else {
        el.classList.remove('is-hovered');
      }
    }

    const enEl = el.querySelector('.district-label__en');
    const jpEl = el.querySelector('.district-label__jp');
    if (enEl) {
      enEl.style.fontSize = isHovered ? '13px' : '';
      enEl.style.color    = isHovered ? '#ffffff' : '';
    }
    if (jpEl) {
      jpEl.style.fontSize = isHovered ? '11px' : '';
      jpEl.style.color    = isHovered ? 'rgba(255,255,255,0.7)' : '';
    }
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

/* ─── Legend hover → 맵 hover 연동 ─────────────────────────────── */

// legend data-district → GeoJSON 구명 (HIGHLIGHT_WARDS 키)
// 오모테산도·아오야마·하라주쿠·롯폰기는 모두 港区/渋谷区 구역을 강조
const LEGEND_TO_WARD = {
  shinjuku:   '新宿区',
  shibuya:    '渋谷区',
  omotesando: '港区',
  harajuku:   '港区',
  aoyama:     '港区',
  roppongi:   '港区',
  ueno:       '台東区',
  ginza:      '中央区',
  ikebukuro:  '豊島区',
};

document.querySelectorAll('.legend-item').forEach(item => {
  const wardName = LEGEND_TO_WARD[item.dataset.district];
  if (!wardName) return;

  item.style.cursor = 'pointer';

  item.addEventListener('mouseenter', () => setHover(wardName));
  item.addEventListener('mouseleave', () => setHover(null));

  // 클릭 시 해당 페이지로 이동 (data-href가 있는 경우)
  const href = item.dataset.href;
  if (href) {
    item.addEventListener('click', () => { window.location.href = href; });
  }
});
