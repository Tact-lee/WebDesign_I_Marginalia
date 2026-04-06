/**
 * Marginalia — District Detail Page
 * harajuku.js
 *
 * 역할: 히어로 우측 2D 캔버스 맵 (渋谷区 GeoJSON + 건물 파티클)
 */

const BUILDINGS = [
  {
    num:       '01',
    nameEn:    'With Harajuku',
    tag:       'Mixed-use · 2020',
    lat:       35.6718,
    lon:       139.7027,
    intensity: 0.95,
  },
  {
    num:       '02',
    nameEn:    'Think of Things',
    tag:       'Retail / Café · 2017',
    lat:       35.6671,
    lon:       139.7096,
    intensity: 0.75,
  },
  {
    num:       '03',
    nameEn:    'Gyre Omotesando',
    tag:       'Mixed-use · 2007',
    lat:       35.6679,
    lon:       139.7109,
    intensity: 0.85,
  },
  {
    num:       '04',
    nameEn:    'Ragtag Harajuku',
    tag:       'Retail · 2003',
    lat:       35.6660,
    lon:       139.7102,
    intensity: 0.70,
  },
];

const VIEW = {
  lonMin: 139.690,
  lonMax: 139.726,
  latMin: 35.656,
  latMax: 35.680,
};

const LAT_COS = Math.cos(35.7 * Math.PI / 180);

/* ================================================================
   Canvas 2D 맵
   ================================================================ */

const wrapper  = document.getElementById('dMapWrapper');
const canvas   = document.getElementById('dMapCanvas');
const ctx      = canvas.getContext('2d');
const labelEl  = document.getElementById('dMapLabel');
const labelName = document.getElementById('dMapLabelName');
const labelYear = document.getElementById('dMapLabelYear');

const dpr = Math.min(window.devicePixelRatio || 1, 2);
let W = 0, H = 0;
let hoveredIdx = -1;

let _scale = 1, _offX = 0, _offY = 0;

function computeProjection() {
  const lonSpan = (VIEW.lonMax - VIEW.lonMin) * LAT_COS;
  const latSpan = VIEW.latMax - VIEW.latMin;
  const scaleX  = W / lonSpan;
  const scaleY  = H / latSpan;
  _scale = Math.min(scaleX, scaleY);
  _offX = (W - lonSpan * _scale) / 2;
  _offY = (H - latSpan * _scale) / 2;
}

function toXY(lon, lat) {
  const x = _offX + (lon - VIEW.lonMin) * LAT_COS * _scale;
  const y = _offY + (VIEW.latMax - lat) * _scale;
  return [x, y];
}

function setup() {
  W = wrapper.clientWidth  || 600;
  H = wrapper.clientHeight || 640;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  computeProjection();
}

function drawBackground() {
  ctx.fillStyle = '#f2f0eb';
  ctx.fillRect(0, 0, W, H);
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(26,26,24,0.08)';
  ctx.lineWidth   = 0.5;
  const step = 16;
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawPolyRing(ring) {
  ring.forEach(([lon, lat], i) => {
    const [x, y] = toXY(lon, lat);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function drawWardLabel(name, lon, lat) {
  const [x, y] = toXY(lon, lat);
  ctx.save();
  ctx.font         = '500 10px "Syne", sans-serif';
  ctx.letterSpacing = '0.10em';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = 'rgba(26,26,24,0.45)';
  ctx.fillText(name.toUpperCase(), x, y);
  ctx.restore();
}

function drawWard(geojson) {
  /* 1단계: 전체 23구 — 옅은 색 */
  geojson.features.forEach(f => {
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
    polys.forEach(poly => {
      ctx.beginPath();
      drawPolyRing(poly[0]);
      ctx.fillStyle   = 'rgba(26,26,24,0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(26,26,24,0.12)';
      ctx.lineWidth   = 0.6;
      ctx.stroke();
    });
  });

  /* 2단계: 渋谷区(시부야구) — 진한 색으로 강조 */
  const shibuya = geojson.features.filter(f => f.properties.name === '渋谷区');
  shibuya.forEach(f => {
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
    polys.forEach(poly => {
      ctx.beginPath();
      drawPolyRing(poly[0]);
      ctx.fillStyle   = 'rgba(26,26,24,0.18)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(26,26,24,0.55)';
      ctx.lineWidth   = 1.2;
      ctx.stroke();
    });
  });

  /* 3단계: 港区(미나토구) — 약간 강조 */
  const minato = geojson.features.filter(f => f.properties.name === '港区');
  minato.forEach(f => {
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
    polys.forEach(poly => {
      ctx.beginPath();
      drawPolyRing(poly[0]);
      ctx.fillStyle   = 'rgba(26,26,24,0.10)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(26,26,24,0.35)';
      ctx.lineWidth   = 1.0;
      ctx.stroke();
    });
  });

  drawWardLabel('Shibuya', 139.703, 35.666);
  drawWardLabel('Minato',  139.718, 35.659);
}

function drawParticles() {
  BUILDINGS.forEach((b, i) => {
    const [x, y] = toXY(b.lon, b.lat);
    const isHovered = (i === hoveredIdx);

    const base   = 7 + b.intensity * 9;
    const size   = isHovered ? base * 1.6 : base;

    const v = isHovered
      ? 242
      : Math.round(180 - b.intensity * 154);

    if (isHovered) {
      ctx.fillStyle = 'rgba(26,26,24,0.10)';
      ctx.fillRect(x - size - 6, y - size - 6, size * 2 + 12, size * 2 + 12);
    }

    if (isHovered) {
      ctx.fillStyle = '#1a1a18';
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = '#f2f0eb';
      ctx.fillRect(x - size + 2, y - size + 2, size * 2 - 4, size * 2 - 4);
    } else {
      ctx.fillStyle = `rgb(${v},${v-2},${v-7})`;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    ctx.strokeStyle = 'rgba(26,26,24,0.55)';
    ctx.lineWidth   = isHovered ? 1.2 : 0.75;
    ctx.strokeRect(x - size + 0.5, y - size + 0.5, size * 2 - 1, size * 2 - 1);

    const textColor = isHovered ? '#1a1a18' : '#f2f0eb';
    ctx.fillStyle    = textColor;
    ctx.font         = `bold ${isHovered ? 9 : 8}px "Space Mono"`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.num, x, y);
  });
}

function render(geojson) {
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawGrid();
  if (geojson) drawWard(geojson);
  drawParticles();
}

/* ─── 마우스 인터랙션 ─────────────────────────────────────────── */

let cachedGeoJSON = null;

wrapper.addEventListener('mousemove', e => {
  const rect = wrapper.getBoundingClientRect();
  const mx   = (e.clientX - rect.left);
  const my   = (e.clientY - rect.top);

  let found = -1;
  BUILDINGS.forEach((b, i) => {
    const [px, py] = toXY(b.lon, b.lat);
    const size = 7 + b.intensity * 9 + 4;
    if (Math.abs(mx - px) < size && Math.abs(my - py) < size) {
      found = i;
    }
  });

  if (found !== hoveredIdx) {
    hoveredIdx = found;
    render(cachedGeoJSON);

    if (found >= 0) {
      const b = BUILDINGS[found];
      labelName.textContent = b.nameEn;
      labelYear.textContent = b.tag;
      labelEl.classList.add('visible');
    } else {
      labelEl.classList.remove('visible');
    }
  }
});

wrapper.addEventListener('mouseleave', () => {
  hoveredIdx = -1;
  labelEl.classList.remove('visible');
  render(cachedGeoJSON);
});

window.addEventListener('resize', () => {
  requestAnimationFrame(() => {
    setup();
    render(cachedGeoJSON);
  });
});

/* ─── nav 스크롤 ─────────────────────────────────────────────── */

const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (nav) {
    nav.style.borderBottomColor = window.scrollY > 40
      ? 'rgba(26,26,24,0.25)'
      : 'rgba(26,26,24,0.15)';
  }
}, { passive: true });

/* ─── 초기화 ─────────────────────────────────────────────────── */

requestAnimationFrame(() => {
  setup();
  render(null);

  fetch('tokyo_wards.geojson')
    .then(r => r.json())
    .then(geojson => {
      cachedGeoJSON = geojson;
      render(cachedGeoJSON);
    })
    .catch(() => {});
});
