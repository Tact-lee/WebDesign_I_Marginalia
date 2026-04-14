/**
 * Marginalia — Bento Gallery
 *
 * 모든 건물 실사 이미지를 CSS columns 마소니 그리드로 렌더링.
 * 호버 시 지역·건축가·년도 오버레이, 클릭 시 해당 건물 페이지로 이동.
 */

(function () {
  'use strict';

  /* ── 도면/설계도 제외 목록 ──────────────────────────────────────── */
  const DIAGRAM_IMAGES = new Set([
    'picture/YOYOGI_NATIONAL _GYMNASIUM_04.png',
    'picture/Omotesando_Hills_04.png',
    'picture/prada_aoyama_06.png',
    'picture/RAGTAG_HARAJUKU_04.png',
    'picture/ ITOCHU_Headquarter_Bldg_04.png',
    'picture/he_National_Art_Center_09.png',
  ]);

  /* ── 건물 데이터 ────────────────────────────────────────────────── */
  const BUILDINGS = [
    /* ─ Omotesando (district.html) ─ */
    {
      name: 'Yoyogi National Gymnasium',
      district: 'Harajuku',
      architect: 'Kenzo Tange',
      year: '1964',
      href: 'district.html#building-01',
      images: [
        'picture/YOYOGI_NATIONAL _GYMNASIUM_01.png',
        'picture/YOYOGI_NATIONAL _GYMNASIUM_02.png',
        'picture/YOYOGI_NATIONAL _GYMNASIUM_03.png',
        'picture/YOYOGI_NATIONAL _GYMNASIUM_04.png',
        'picture/YOYOGI_NATIONAL _GYMNASIUM_05.png',
        'picture/YOYOGI_NATIONAL _GYMNASIUM_06.png',
        'picture/YOYOGI_NATIONAL _GYMNASIUM_07.png',
        'picture/YOYOGI_NATIONAL _GYMNASIUM_08.png',
      ],
    },
    {
      name: 'Dior Omotesando',
      district: 'Omotesando',
      architect: 'SANAA',
      year: '2004',
      href: 'district.html#building-02',
      images: [
        'picture/DIOR_OMOTESANDO_01.png',
        'picture/DIOR_OMOTESANDO_02.png',
        'picture/DIOR_OMOTESANDO_03.png',
        'picture/DIOR_OMOTESANDO_04.png',
        'picture/DIOR_OMOTESANDO_05.png',
        'picture/DIOR_OMOTESANDO_06.png',
        'picture/DIOR_OMOTESANDO_07.png',
        'picture/DIOR_OMOTESANDO_08.png',
      ],
    },
    {
      name: 'Omotesando Hills',
      district: 'Omotesando',
      architect: 'Tadao Ando',
      year: '2006',
      href: 'district.html#building-03',
      images: [
        'picture/Omotesando_Hills_01.png',
        'picture/Omotesando_Hills_02.png',
        'picture/Omotesando_Hills_03.png',
        'picture/Omotesando_Hills_04.png',
        'picture/Omotesando_Hills_05.png',
        'picture/Omotesando_Hills_06.png',
        'picture/Omotesando_Hills_07.png',
        'picture/Omotesando_Hills_08.png',
      ],
    },
    {
      name: 'Bottega Veneta Omotesando',
      district: 'Omotesando',
      architect: 'Toyo Ito',
      year: '2003',
      href: 'district.html#building-04',
      images: [
        'picture/Bottega_Veneta_01.png',
        'picture/Bottega_Veneta_02.png',
        'picture/Bottega_Veneta_03.png',
        'picture/Bottega_Veneta_04.png',
        'picture/Bottega_Veneta_05.png',
        'picture/Bottega_Veneta_06.png',
        'picture/Bottega_Veneta_07.png',
      ],
    },
    {
      name: 'Prada Aoyama',
      district: 'Omotesando',
      architect: 'Herzog & de Meuron',
      year: '2003',
      href: 'district.html#building-05',
      images: [
        'picture/prada_aoyama_01.png',
        'picture/prada_aoyama_02.png',
        'picture/prada_aoyama_03.png',
        'picture/prada_aoyama_04.png',
        'picture/prada_aoyama_05.png',
        'picture/prada_aoyama_06.png',
      ],
    },
    {
      name: 'Spiral',
      district: 'Omotesando',
      architect: 'Fumihiko Maki',
      year: '1985',
      href: 'district.html#building-06',
      images: [
        'picture/spiral_01.png',
        'picture/spiral_02.png',
        'picture/spiral_03.png',
        'picture/spiral_04.png',
        'picture/spiral_05.png',
      ],
    },

    /* ─ Harajuku (harajuku.html) ─ */
    {
      name: 'With Harajuku',
      district: 'Harajuku',
      architect: 'Toyo Ito',
      year: '2020',
      href: 'harajuku.html#building-01',
      images: [
        'picture/WITH_HARAJUKU_01.png',
        'picture/WITH_HARAJUKU_02.png',
        'picture/WITH_HARAJUKU_03.png',
        'picture/WITH_HARAJUKU_04.png',
        'picture/WITH_HARAJUKU_05.png',
        'picture/WITH_HARAJUKU_06.png',
      ],
    },
    {
      name: 'Think of Things',
      district: 'Harajuku',
      architect: 'Kokuyo Design Group',
      year: '2017',
      href: 'harajuku.html#building-02',
      images: [
        'picture/THINK_OF_THINGS_01.png',
        'picture/THINK_OF_THINGS_02.png',
        'picture/THINK_OF_THINGS_03.png',
        'picture/THINK_OF_THINGS_04.png',
        'picture/THINK_OF_THINGS_05.png',
        'picture/THINK_OF_THINGS_06.png',
      ],
    },
    {
      name: 'Gyre Omotesando',
      district: 'Harajuku',
      architect: 'MVRDV',
      year: '2007',
      href: 'harajuku.html#building-03',
      images: [
        'picture/GYRE_OMOTESANDO_01.png',
        'picture/GYRE_OMOTESANDO_02.png',
        'picture/GYRE_OMOTESANDO_03.png',
        'picture/GYRE_OMOTESANDO_04.png',
        'picture/GYRE_OMOTESANDO_05.png',
        'picture/GYRE_OMOTESANDO_06.png',
        'picture/GYRE_OMOTESANDO_07.png',
      ],
    },
    {
      name: 'Ragtag Harajuku',
      district: 'Harajuku',
      architect: 'Kazuyo Sejima',
      year: '2003',
      href: 'harajuku.html#building-04',
      images: [
        'picture/RAGTAG_HARAJUKU_01.png',
        'picture/RAGTAG_HARAJUKU_02.png',
        'picture/RAGTAG_HARAJUKU_03.png',
        'picture/RAGTAG_HARAJUKU_04.png',
        'picture/RAGTAG_HARAJUKU_05.png',
        'picture/RAGTAG_HARAJUKU_06.png',
        'picture/RAGTAG_HARAJUKU_07.png',
        'picture/RAGTAG_HARAJUKU_08.png',
      ],
    },

    /* ─ Aoyama (aoyama.html) ─ */
    {
      name: 'From 1st Building',
      district: 'Aoyama',
      architect: 'Kazumasa Yamashita',
      year: '1975',
      href: 'aoyama.html#building-01',
      images: [
        'picture/From_1st_building_01.png',
        'picture/From_1st_building_02.png',
        'picture/From_1st_building_03.png',
        'picture/From_1st_building_04.png',
        'picture/From_1st_building_05.png',
      ],
    },
    {
      name: 'La Collezione',
      district: 'Aoyama',
      architect: 'Tadao Ando',
      year: '1989',
      href: 'aoyama.html#building-02',
      images: [
        'picture/La_Collezione_01.png',
        'picture/La_Collezione_02.png',
        'picture/La_Collezione_03.png',
        'picture/La_Collezione_04.png',
        'picture/La_Collezione_05.png',
      ],
    },
    {
      name: 'Doria Minami Aoyama',
      district: 'Aoyama',
      architect: 'Kengo Kuma',
      year: '1991',
      href: 'aoyama.html#building-03',
      images: [
        'picture/Doric_Minami_Aoyama_01.png',
        'picture/Doric_Minami_Aoyama_02.png',
        'picture/Doric_Minami_Aoyama_03.png',
        'picture/Doric_Minami_Aoyama_04.png',
      ],
    },
    {
      name: 'ITOCHU Headquarters',
      district: 'Aoyama',
      architect: 'Nikken Sekkei',
      year: '2002',
      href: 'aoyama.html#building-04',
      images: [
        'picture/ ITOCHU_Headquarter_Bldg_01.png',
        'picture/ ITOCHU_Headquarter_Bldg_02.png',
        'picture/ ITOCHU_Headquarter_Bldg_03.png',
        'picture/ ITOCHU_Headquarter_Bldg_04.png',
      ],
    },
    {
      name: 'Honda Aoyama Welcome Plaza',
      district: 'Aoyama',
      architect: 'Honda / Nikken Sekkei',
      year: '2003',
      href: 'aoyama.html#building-05',
      images: [
        'picture/Honda_Aoyama_Building_01.png',
        'picture/Honda_Aoyama_Building_02.png',
        'picture/Honda_Aoyama_Building_03.png',
        'picture/Honda_Aoyama_Building_04.png',
        'picture/Honda_Aoyama_Building_05.png',
        'picture/Honda_Aoyama_Building_06.png',
      ],
    },

    /* ─ Roppongi (roppongi.html) ─ */
    {
      name: 'The National Art Center, Tokyo',
      district: 'Roppongi',
      architect: 'Kisho Kurokawa',
      year: '2007',
      href: 'roppongi.html#building-01',
      images: [
        'picture/he_National_Art_Center_01.png',
        'picture/he_National_Art_Center_02.png',
        'picture/he_National_Art_Center_03.png',
        'picture/he_National_Art_Center_04.png',
        'picture/he_National_Art_Center_05.png',
        'picture/he_National_Art_Center_06.png',
        'picture/he_National_Art_Center_07.png',
        'picture/he_National_Art_Center_08.png',
        'picture/he_National_Art_Center_09.png',
      ],
    },
  ];

  /* ── 이미지 목록 펼치기 (도면 제외) ────────────────────────────── */
  const allImages = [];
  BUILDINGS.forEach(b => {
    b.images.forEach(src => {
      if (DIAGRAM_IMAGES.has(src)) return;
      allImages.push({
        src,
        name:      b.name,
        district:  b.district,
        architect: b.architect,
        year:      b.year,
        href:      b.href,
      });
    });
  });

  /* ── Fisher-Yates 셔플 ──────────────────────────────────────────── */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── DOM 생성 ────────────────────────────────────────────────────── */
  const grid = document.getElementById('bentoGrid');
  if (!grid) return;

  shuffle(allImages).forEach(item => {
    const el = document.createElement('div');
    el.className = 'bento-item';
    el.innerHTML = `
      <img src="${item.src}" alt="${item.name}" />
      <div class="bento-item__overlay">
        <span class="bento-item__district">${item.district} · ${item.year}</span>
        <span class="bento-item__name">${item.name}</span>
        <span class="bento-item__meta">${item.architect}</span>
      </div>
    `;
    el.addEventListener('click', () => { window.location.href = item.href; });
    grid.appendChild(el);
  });

  /* ── nav 스크롤 효과 ─────────────────────────────────────────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.borderBottomColor = window.scrollY > 40
        ? 'rgba(26,26,24,0.25)'
        : 'rgba(26,26,24,0.15)';
    }, { passive: true });
  }

})();
