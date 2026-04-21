/**
 * Marginalia — District Detail Page
 * shinjuku.js
 */

const BUILDINGS = [
  { num: '01', nameEn: 'NTT Docomo Yoyogi Building', tag: 'Commercial · 2000', lat: 35.6874, lon: 139.7028, intensity: 0.85 },
  { num: '02', nameEn: 'Tokyo Kabukicho Tower', tag: 'Mixed Use · 2023', lat: 35.6954, lon: 139.7038, intensity: 1.0 },
  { num: '03', nameEn: 'Odakyu Department Store', tag: 'Commercial · 1967', lat: 35.6898, lon: 139.7004, intensity: 0.6 },
  { num: '04', nameEn: 'Mode Cocoon Tower', tag: 'Education · 2008', lat: 35.6858, lon: 139.6963, intensity: 0.75 },
  { num: '05', nameEn: 'SOMPO Japan Head Office', tag: 'Office · 1976', lat: 35.6907, lon: 139.7001, intensity: 0.65 },
  { num: '06', nameEn: 'Tokyo Metropolitan Government Building', tag: 'Government · 1991', lat: 35.6896, lon: 139.6922, intensity: 0.9 },
];

const VIEW = {
  lonMin: 139.682,
  lonMax: 139.715,
  latMin: 35.680,
  latMax: 35.705,
};

const LAT_COS = Math.cos(35.69 * Math.PI / 180);

const wrapper   = document.getElementById('dMapWrapper');
const canvas    = document.getElementById('dMapCanvas');
const ctx       = canvas.getContext('2d');
const labelEl   = document.getElementById('dMapLabel');
const labelName = document.getElementById('dMapLabelName');
const labelYear = document.getElementById('dMapLabelYear');

const dpr = Math.min(window.devicePixelRatio || 1, 2);
let W = 0, H = 0, hoveredIdx = -1;
let _scale = 1, _offX = 0, _offY = 0;

function computeProjection() {
  const lonSpan = (VIEW.lonMax - VIEW.lonMin) * LAT_COS;
  const latSpan = VIEW.latMax - VIEW.latMin;
  _scale = Math.min(W / lonSpan, H / latSpan);
  _offX = (W - lonSpan * _scale) / 2;
  _offY = (H - latSpan * _scale) / 2;
}

function toXY(lon, lat) {
  return [_offX + (lon - VIEW.lonMin) * LAT_COS * _scale, _offY + (VIEW.latMax - lat) * _scale];
}

function setup() {
  W = wrapper.clientWidth || 600; H = wrapper.clientHeight || 640;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); computeProjection();
}

function drawBackground() { ctx.fillStyle = '#f2f0eb'; ctx.fillRect(0, 0, W, H); }

function drawGrid() {
  ctx.strokeStyle = 'rgba(26,26,24,0.08)'; ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y <= H; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawPolyRing(ring) {
  ring.forEach(([lon, lat], i) => { const [x, y] = toXY(lon, lat); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  ctx.closePath();
}

function drawWardLabel(name, lon, lat) {
  const [x, y] = toXY(lon, lat);
  ctx.save(); ctx.font = '500 10px "Syne", sans-serif'; ctx.letterSpacing = '0.10em';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(26,26,24,0.45)';
  ctx.fillText(name.toUpperCase(), x, y); ctx.restore();
}

function drawWard(geojson) {
  geojson.features.forEach(f => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    polys.forEach(poly => {
      ctx.beginPath(); drawPolyRing(poly[0]);
      ctx.fillStyle = 'rgba(26,26,24,0.04)'; ctx.fill();
      ctx.strokeStyle = 'rgba(26,26,24,0.12)'; ctx.lineWidth = 0.6; ctx.stroke();
    });
  });
  const shinjuku = geojson.features.filter(f => f.properties.name === '新宿区');
  shinjuku.forEach(f => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    polys.forEach(poly => {
      ctx.beginPath(); drawPolyRing(poly[0]);
      ctx.fillStyle = 'rgba(26,26,24,0.18)'; ctx.fill();
      ctx.strokeStyle = 'rgba(26,26,24,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    });
  });
  drawWardLabel('Shinjuku', 139.698, 35.692);
}

function drawParticles() {
  BUILDINGS.forEach((b, i) => {
    const [x, y] = toXY(b.lon, b.lat);
    const isHovered = i === hoveredIdx;
    const base = 7 + b.intensity * 9, size = isHovered ? base * 1.6 : base;
    const v = isHovered ? 242 : Math.round(180 - b.intensity * 154);
    if (isHovered) {
      ctx.fillStyle = 'rgba(26,26,24,0.10)'; ctx.fillRect(x - size - 6, y - size - 6, size * 2 + 12, size * 2 + 12);
      ctx.fillStyle = '#1a1a18'; ctx.fillRect(x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = '#f2f0eb'; ctx.fillRect(x - size + 2, y - size + 2, size * 2 - 4, size * 2 - 4);
    } else { ctx.fillStyle = `rgb(${v},${v - 2},${v - 7})`; ctx.fillRect(x - size, y - size, size * 2, size * 2); }
    ctx.strokeStyle = 'rgba(26,26,24,0.55)'; ctx.lineWidth = isHovered ? 1.2 : 0.75;
    ctx.strokeRect(x - size + 0.5, y - size + 0.5, size * 2 - 1, size * 2 - 1);
    ctx.fillStyle = isHovered ? '#1a1a18' : '#f2f0eb';
    ctx.font = `bold ${isHovered ? 9 : 8}px "Space Mono"`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.num, x, y);
  });
}

function render(geojson) { ctx.clearRect(0, 0, W, H); drawBackground(); drawGrid(); if (geojson) drawWard(geojson); drawParticles(); }

let cachedGeoJSON = null;

wrapper.addEventListener('mousemove', e => {
  const rect = wrapper.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  let found = -1;
  BUILDINGS.forEach((b, i) => { const [px, py] = toXY(b.lon, b.lat); const s = 7 + b.intensity * 9 + 4; if (Math.abs(mx - px) < s && Math.abs(my - py) < s) found = i; });
  if (found !== hoveredIdx) {
    hoveredIdx = found; render(cachedGeoJSON);
    if (found >= 0) { labelName.textContent = BUILDINGS[found].nameEn; labelYear.textContent = BUILDINGS[found].tag; labelEl.classList.add('visible'); }
    else labelEl.classList.remove('visible');
  }
});
wrapper.addEventListener('mouseleave', () => { hoveredIdx = -1; labelEl.classList.remove('visible'); render(cachedGeoJSON); });
wrapper.addEventListener('click', e => {
  const rect = wrapper.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  let clicked = -1;
  BUILDINGS.forEach((b, i) => { const [px, py] = toXY(b.lon, b.lat); const s = 7 + b.intensity * 9 + 4; if (Math.abs(mx - px) < s && Math.abs(my - py) < s) clicked = i; });
  if (clicked >= 0) { const t = document.getElementById(`building-0${clicked + 1}`); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
});
window.addEventListener('resize', () => requestAnimationFrame(() => { setup(); render(cachedGeoJSON); }));

const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => { if (nav) nav.style.borderBottomColor = window.scrollY > 40 ? 'rgba(26,26,24,0.25)' : 'rgba(26,26,24,0.15)'; }, { passive: true });

requestAnimationFrame(() => {
  setup(); render(null);
  fetch('tokyo_wards.geojson').then(r => r.json()).then(g => { cachedGeoJSON = g; render(g); }).catch(() => {});
});

(function initReveal() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const obs = new IntersectionObserver(
        entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-revealed'); obs.unobserve(e.target); } }),
        { threshold: 0.05 }
      );
      document.querySelectorAll('.js-img-reveal').forEach(el => obs.observe(el));
    }, 200);
  });
})();
