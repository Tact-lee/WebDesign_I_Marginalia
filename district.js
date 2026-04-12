/**
 * Marginalia — District Detail Page
 * district.js
 *
 * 역할: 히어로 우측 2D 캔버스 맵 (港区 GeoJSON + 건물 파티클)
 */

/* ================================================================
   건물 좌표 데이터
   lat / lon: Google Maps 좌표
   intensity: 파티클 크기/명도 (0.0 ~ 1.0)
   ================================================================ */
const BUILDINGS = [
  {
    num:       '01',
    nameEn:    'Yoyogi National Gymnasium',
    tag:       'Sports / Cultural · 1964',
    lat:       35.6742,
    lon:       139.7074,
    intensity: 1.0,
  },
  {
    num:       '02',
    nameEn:    'Dior Omotesando',
    tag:       'Retail · 2004',
    lat:       35.6698,
    lon:       139.7115,
    intensity: 0.8,
  },
  {
    num:       '03',
    nameEn:    'Omotesando Hills',
    tag:       'Mixed-use · 2006',
    lat:       35.6680,
    lon:       139.7130,
    intensity: 0.9,
  },
  {
    num:       '04',
    nameEn:    'Bottega Veneta Omotesando',
    tag:       'Retail · 2003',
    lat:       35.6690,
    lon:       139.7148,
    intensity: 0.75,
  },
  {
    num:       '05',
    nameEn:    'Prada Aoyama',
    tag:       'Retail · 2003',
    lat:       35.6658,
    lon:       139.7138,
    intensity: 0.95,
  },
  {
    num:       '06',
    nameEn:    'Spiral',
    tag:       'Cultural · 1985',
    lat:       35.6643,
    lon:       139.7158,
    intensity: 0.7,
  },
];

/* ================================================================
   뷰 범위 (오모테산도 일대)
   조정 방법: LON/LAT의 MIN~MAX 값을 바꾸면 지도 줌/위치 변경
   ================================================================ */
/* 건축물 중심 확대 뷰 — 파티클이 겹치지 않을 만큼 확대 */
const VIEW = {
  lonMin: 139.700,
  lonMax: 139.722,
  latMin: 35.659,
  latMax: 35.679,
};

/* 위도 보정 계수 — 도쿄 위도 35.7° 기준
   경도 1° ≈ cos(35.7°) × 111km ≈ 89.8km
   위도 1° ≈ 111km
   → 경도 범위를 이 비율로 보정해야 비율이 맞음 */
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

/* 좌표 → 픽셀 변환 (위도 보정 적용)
   경도 범위와 위도 범위를 실제 거리 비율로 맞춘 뒤
   캔버스 중앙에 letterbox 방식으로 배치 */
let _scale = 1, _offX = 0, _offY = 0;

function computeProjection() {
  const lonSpan = (VIEW.lonMax - VIEW.lonMin) * LAT_COS;
  const latSpan = VIEW.latMax - VIEW.latMin;
  const scaleX  = W / lonSpan;
  const scaleY  = H / latSpan;
  _scale = Math.min(scaleX, scaleY);
  /* 짧은 축을 중앙 정렬 */
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

/* ─── 그리기 ─────────────────────────────────────────────────── */

function drawBackground() {
  ctx.fillStyle = '#f2f0eb';
  ctx.fillRect(0, 0, W, H);
}

function drawGrid() {
  /* 히어로 섹션 그리드와 동일한 16px 간격 */
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

/* 폴리곤의 시각적 중심(폴리곤 포인트 평균) 계산 */
function polyCentroid(ring) {
  let sx = 0, sy = 0;
  ring.forEach(([lon, lat]) => { sx += lon; sy += lat; });
  return [sx / ring.length, sy / ring.length];
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

  /* 2단계: 港区(미나토구) — 진한 색으로 강조 */
  const minato = geojson.features.filter(f => f.properties.name === '港区');
  minato.forEach(f => {
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

  /* 3단계: 渋谷区(시부야구) — 미나토와 같이 약간 강조 */
  const shibuya = geojson.features.filter(f => f.properties.name === '渋谷区');
  shibuya.forEach(f => {
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

  /* 4단계: 구 이름 레이블 — 미나토·시부야 경계 근처에 배치 */
  /* 미나토구 레이블: 구 중심보다 시부야 쪽 경계에 가깝게 수동 배치 */
  drawWardLabel('Minato',  139.738, 35.658);
  drawWardLabel('Shibuya', 139.700, 35.657);
}

function drawParticles() {
  BUILDINGS.forEach((b, i) => {
    const [x, y] = toXY(b.lon, b.lat);
    const isHovered = (i === hoveredIdx);

    /* 파티클 크기: intensity + 호버 시 확대 */
    const base   = 7 + b.intensity * 9;
    const size   = isHovered ? base * 1.6 : base;

    /* 색: 진할수록 intensity 높음 (호버 시 bg색으로 반전) */
    const v = isHovered
      ? 242   /* #f2f0eb */
      : Math.round(180 - b.intensity * 154);  /* 180→26 */

    /* 외부 glow (호버 시) */
    if (isHovered) {
      ctx.fillStyle = 'rgba(26,26,24,0.10)';
      ctx.fillRect(x - size - 6, y - size - 6, size * 2 + 12, size * 2 + 12);
    }

    /* 사각형 파티클 */
    ctx.fillStyle = isHovered ? `rgb(${v},${v-2},${v-7})` : `rgb(${v},${v-2},${v-7})`;
    if (isHovered) {
      ctx.fillStyle = '#1a1a18';
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = '#f2f0eb';
      ctx.fillRect(x - size + 2, y - size + 2, size * 2 - 4, size * 2 - 4);
    } else {
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    /* 테두리 */
    ctx.strokeStyle = 'rgba(26,26,24,0.55)';
    ctx.lineWidth   = isHovered ? 1.2 : 0.75;
    ctx.strokeRect(x - size + 0.5, y - size + 0.5, size * 2 - 1, size * 2 - 1);

    /* 번호 */
    ctx.fillStyle    = isHovered ? '#1a1a18' : '#f2f0eb';
    ctx.font         = `bold ${isHovered ? 9 : 8}px "Space Mono"`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    /* 어두운 파티클 위에는 밝은 글씨, 밝은(호버) 파티클 위에는 어두운 글씨 */
    const textColor = isHovered ? '#1a1a18' : '#f2f0eb';
    ctx.fillStyle = textColor;
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

/* ─── 마우스 인터랙션 ───────────────────────────────────────── */

let cachedGeoJSON = null;

wrapper.addEventListener('mousemove', e => {
  const rect = wrapper.getBoundingClientRect();
  const mx   = (e.clientX - rect.left);
  const my   = (e.clientY - rect.top);

  let found = -1;
  BUILDINGS.forEach((b, i) => {
    const [px, py] = toXY(b.lon, b.lat);
    const size = 7 + b.intensity * 9 + 4; /* hit area 약간 넓게 */
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

/* ─── 리사이즈 ───────────────────────────────────────────────── */

window.addEventListener('resize', () => {
  requestAnimationFrame(() => {
    setup();
    render(cachedGeoJSON);
  });
});

/* ─── 스크롤 리빌: .js-img-reveal 요소 ──────────────────────── */

(function initReveal() {
  // 브라우저가 초기 clip-path 상태를 먼저 페인트하도록 충분히 지연
  requestAnimationFrame(() => {
    setTimeout(() => {

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.05,
        }
      );

      document.querySelectorAll('.js-img-reveal').forEach(el => {
        observer.observe(el);
      });

    }, 200); // 200ms: 레이아웃·페인트 완료 후 관찰 시작
  });
})();

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
  render(null); /* GeoJSON 로드 전에 파티클만 먼저 표시 */

  fetch('tokyo_wards.geojson')
    .then(r => r.json())
    .then(geojson => {
      cachedGeoJSON = geojson;
      render(cachedGeoJSON);
    })
    .catch(() => {
      /* GeoJSON 없어도 파티클은 표시됨 */
    });
});
