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
    'picture/Marronnier_Gate_Ginza_04.png',
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

    /* ─ Shinjuku (shinjuku.html) ─ */
    {
      name: 'NTT Docomo Yoyogi Building',
      district: 'Shinjuku',
      architect: 'Michael Graves / NTT Facilities',
      year: '2000',
      href: 'shinjuku.html#building-01',
      images: [
        'picture/NTT_Docomo_Tower_01.png',
        'picture/NTT_Docomo_Tower_02.png',
        'picture/NTT_Docomo_Tower_03.png',
        'picture/NTT_Docomo_Tower_04.png',
      ],
    },
    {
      name: 'Tokyo Kabukicho Tower',
      district: 'Shinjuku',
      architect: 'Kohn Pedersen Fox',
      year: '2023',
      href: 'shinjuku.html#building-02',
      images: [
        'picture/Tokyo_Kabukicho_Tower_01.png',
        'picture/Tokyo_Kabukicho_Tower_02.png',
        'picture/Tokyo_Kabukicho_Tower_03.png',
        'picture/Tokyo_Kabukicho_Tower_04.png',
        'picture/Tokyo_Kabukicho_Tower_05.png',
        'picture/Tokyo_Kabukicho_Tower_06.png',
        'picture/Tokyo_Kabukicho_Tower_07.png',
        'picture/Tokyo_Kabukicho_Tower_08.png',
      ],
    },
    {
      name: 'Odakyu Department Store',
      district: 'Shinjuku',
      architect: 'Murano & Mori',
      year: '1967',
      href: 'shinjuku.html#building-03',
      images: [
        'picture/Odakyu_Department_Store_01.png',
        'picture/Odakyu_Department_Store_02.png',
        'picture/Odakyu_Department_Store_03.png',
        'picture/Odakyu_Department_Store_04.png',
        'picture/Odakyu_Department_Store_05.png',
      ],
    },
    {
      name: 'Mode Gakuen Cocoon Tower',
      district: 'Shinjuku',
      architect: 'Tange Associates',
      year: '2008',
      href: 'shinjuku.html#building-04',
      images: [
        'picture/Mode_Cocoon_Tower_01.png',
        'picture/Mode_Cocoon_Tower_02.png',
        'picture/Mode_Cocoon_Tower_03.png',
        'picture/Mode_Cocoon_Tower_04.png',
        'picture/Mode_Cocoon_Tower_05.png',
        'picture/Mode_Cocoon_Tower_06.png',
        'picture/Mode_Cocoon_Tower_07.png',
        'picture/Mode_Cocoon_Tower_08.png',
      ],
    },
    {
      name: 'SOMPO Japan Head Office',
      district: 'Shinjuku',
      architect: 'Maekawa Kunio',
      year: '1976',
      href: 'shinjuku.html#building-05',
      images: [
        'picture/SOMPO_Japan_Head_Office_01.png',
        'picture/SOMPO_Japan_Head_Office_02.png',
        'picture/SOMPO_Japan_Head_Office_03.png',
      ],
    },
    {
      name: 'Tokyo Metropolitan Government Building',
      district: 'Shinjuku',
      architect: 'Kenzo Tange',
      year: '1991',
      href: 'shinjuku.html#building-06',
      images: [
        'picture/Tokyo_Metropolitan_Government_Building_01.png',
        'picture/Tokyo_Metropolitan_Government_Building_02.png',
        'picture/Tokyo_Metropolitan_Government_Building_03.png',
        'picture/Tokyo_Metropolitan_Government_Building_04.png',
        'picture/Tokyo_Metropolitan_Government_Building_05.png',
        'picture/Tokyo_Metropolitan_Government_Building_06.png',
        'picture/Tokyo_Metropolitan_Government_Building_07.png',
        'picture/Tokyo_Metropolitan_Government_Building_08.png',
        'picture/Tokyo_Metropolitan_Government_Building_09.png',
        'picture/Tokyo_Metropolitan_Government_Building_10.png',
        'picture/Tokyo_Metropolitan_Government_Building_11.png',
        'picture/Tokyo_Metropolitan_Government_Building_12.png',
      ],
    },

    /* ─ Shibuya (shibuya.html) ─ */
    {
      name: 'Miyashita Park',
      district: 'Shibuya',
      architect: 'Nikken Sekkei',
      year: '2020',
      href: 'shibuya.html#building-01',
      images: [
        'picture/Miyashita_Park_01.png',
        'picture/Miyashita_Park_02.png',
        'picture/Miyashita_Park_03.png',
        'picture/Miyashita_Park_04.png',
        'picture/Miyashita_Park_05.png',
        'picture/Miyashita_Park_06.png',
        'picture/Miyashita_Park_07.png',
        'picture/Miyashita_Park_08.png',
        'picture/Miyashita_Park_09.png',
        'picture/Miyashita_Park_10.png',
        'picture/Miyashita_Park_11.png',
      ],
    },
    {
      name: 'Jingu-dori Park Toilet',
      district: 'Shibuya',
      architect: 'Tadao Ando',
      year: '2020',
      href: 'shibuya.html#building-02',
      images: [
        'picture/Jingu_dori_Park_Toilet_01.png',
        'picture/Jingu_dori_Park_Toilet_02.png',
        'picture/Jingu_dori_Park_Toilet_03.png',
        'picture/Jingu_dori_Park_Toilet_04.png',
        'picture/Jingu_dori_Park_Toilet_05.png',
        'picture/Jingu_dori_Park_Toilet_06.png',
      ],
    },
    {
      name: 'Casa Jingumae',
      district: 'Shibuya',
      architect: 'Tadao Ando',
      year: '2007',
      href: 'shibuya.html#building-03',
      images: [
        'picture/Casa_Jingumae_01.png',
        'picture/Casa_Jingumae_02.png',
      ],
    },
    {
      name: 'Sia Aoyama Building',
      district: 'Shibuya',
      architect: 'Jun Aoki',
      year: '2003',
      href: 'shibuya.html#building-04',
      images: [
        'picture/Sia_Aoyama Building_01.png',
        'picture/Sia_Aoyama Building_02.png',
        'picture/Sia_Aoyama Building_03.png',
        'picture/Sia_Aoyama Building_04.png',
        'picture/Sia_Aoyama Building_05.png',
        'picture/Sia_Aoyama Building_06.png',
        'picture/Sia_Aoyama Building_07.png',
        'picture/Sia_Aoyama Building_08.png',
      ],
    },
    {
      name: 'United Nations University',
      district: 'Shibuya',
      architect: 'Marcel Breuer',
      year: '1992',
      href: 'shibuya.html#building-05',
      images: [
        'picture/United_Nations University_01.png',
        'picture/United_Nations University_02.png',
        'picture/United_Nations University_03.png',
      ],
    },
    {
      name: 'Tokyo Metro Shibuya Station',
      district: 'Shibuya',
      architect: 'Tadao Ando',
      year: '2008',
      href: 'shibuya.html#building-06',
      images: [
        'picture/Tokyo_Metro_Shibuya_Station_01.png',
        'picture/Tokyo_Metro_Shibuya_Station_02.png',
        'picture/Tokyo_Metro_Shibuya_Station_03.png',
        'picture/Tokyo_Metro_Shibuya_Station_04.png',
        'picture/Tokyo_Metro_Shibuya_Station_05.png',
        'picture/Tokyo_Metro_Shibuya_Station_06.png',
        'picture/Tokyo_Metro_Shibuya_Station_07.png',
        'picture/Tokyo_Metro_Shibuya_Station_08.png',
      ],
    },

    /* ─ Ueno (ueno.html) ─ */
    {
      name: 'National Museum of Western Art Tokyo',
      district: 'Ueno',
      architect: 'Le Corbusier',
      year: '1959',
      href: 'ueno.html#building-01',
      images: [
        'picture/National_Museum_of_Western_Art_Tokyo_01.png',
        'picture/National_Museum_of_Western_Art_Tokyo_02.png',
        'picture/National_Museum_of_Western_Art_Tokyo_03.png',
        'picture/National_Museum_of_Western_Art_Tokyo_04.png',
        'picture/National_Museum_of_Western_Art_Tokyo_05.png',
        'picture/National_Museum_of_Western_Art_Tokyo_06.png',
        'picture/National_Museum_of_Western_Art_Tokyo_07.png',
        'picture/National_Museum_of_Western_Art_Tokyo_08.png',
        'picture/National_Museum_of_Western_Art_Tokyo_09.png',
        'picture/National_Museum_of_Western_Art_Tokyo_10.png',
        'picture/National_Museum_of_Western_Art_Tokyo_11.png',
        'picture/National_Museum_of_Western_Art_Tokyo_12.png',
        'picture/National_Museum_of_Western_Art_Tokyo_13.png',
        'picture/National_Museum_of_Western_Art_Tokyo_14.png',
        'picture/National_Museum_of_Western_Art_Tokyo_15.png',
        'picture/National_Museum_of_Western_Art_Tokyo_16.png',
      ],
    },
    {
      name: 'Tokyo Bunka Kaikan',
      district: 'Ueno',
      architect: 'Kunio Maekawa',
      year: '1961',
      href: 'ueno.html#building-02',
      images: [
        'picture/Tokyo_Bunka_Kaikan_01.png',
        'picture/Tokyo_Bunka_Kaikan_02.png',
        'picture/Tokyo_Bunka_Kaikan_03.png',
        'picture/Tokyo_Bunka_Kaikan_04.png',
        'picture/Tokyo_Bunka_Kaikan_05.png',
        'picture/Tokyo_Bunka_Kaikan_06.png',
        'picture/Tokyo_Bunka_Kaikan_07.png',
      ],
    },
    {
      name: 'Gallery of Horyuji Treasures',
      district: 'Ueno',
      architect: 'Yoshio Taniguchi',
      year: '1999',
      href: 'ueno.html#building-03',
      images: [
        'picture/The_Gallery_of_Horyuji_Treasures_01.png',
        'picture/The_Gallery_of_Horyuji_Treasures_02.png',
        'picture/The_Gallery_of_Horyuji_Treasures_03.png',
        'picture/The_Gallery_of_Horyuji_Treasures_04.png',
        'picture/The_Gallery_of_Horyuji_Treasures_05.png',
        'picture/The_Gallery_of_Horyuji_Treasures_06.png',
        'picture/The_Gallery_of_Horyuji_Treasures_07.png',
        'picture/The_Gallery_of_Horyuji_Treasures_08.png',
        'picture/The_Gallery_of_Horyuji_Treasures_09.png',
        'picture/The_Gallery_of_Horyuji_Treasures_10.png',
        'picture/The_Gallery_of_Horyuji_Treasures_11.png',
        'picture/The_Gallery_of_Horyuji_Treasures_12.png',
        'picture/The_Gallery_of_Horyuji_Treasures_13.png',
        'picture/The_Gallery_of_Horyuji_Treasures_14.png',
      ],
    },

    /* ─ Ikebukuro (ikebukuro.html) ─ */
    {
      name: 'Jiyu Gakuen Girls School',
      district: 'Ikebukuro',
      architect: 'Frank Lloyd Wright',
      year: '1921',
      href: 'ikebukuro.html#building-01',
      images: [
        'picture/Jiyu_Gakuen_Myonichikan_01.png',
        'picture/Jiyu_Gakuen_Myonichikan_02.png',
        'picture/Jiyu_Gakuen_Myonichikan_03.png',
        'picture/Jiyu_Gakuen_Myonichikan_04.png',
        'picture/Jiyu_Gakuen_Myonichikan_05.png',
        'picture/Jiyu_Gakuen_Myonichikan_06.png',
        'picture/Jiyu_Gakuen_Myonichikan_07.png',
        'picture/Jiyu_Gakuen_Myonichikan_08.png',
        'picture/Jiyu_Gakuen_Myonichikan_09.png',
        'picture/Jiyu_Gakuen_Myonichikan_10.png',
        'picture/Jiyu_Gakuen_Myonichikan_11.png',
      ],
    },
    {
      name: 'Minami Ikebukuro Park',
      district: 'Ikebukuro',
      architect: 'Kengo Kuma',
      year: '2016',
      href: 'ikebukuro.html#building-02',
      images: [
        'picture/Minami_Ikebukuro_Park_01.png',
        'picture/Minami_Ikebukuro_Park_02.png',
        'picture/Minami_Ikebukuro_Park_03.png',
        'picture/Minami_Ikebukuro_Park_04.png',
        'picture/Minami_Ikebukuro_Park_05.png',
      ],
    },
    {
      name: 'Toshima City Hall',
      district: 'Ikebukuro',
      architect: 'Kengo Kuma',
      year: '2015',
      href: 'ikebukuro.html#building-03',
      images: [
        'picture/Toshima_City_Hall_01.png',
        'picture/Toshima_City_Hall_02.png',
        'picture/Toshima_City_Hall_03.png',
        'picture/Toshima_City_Hall_04.png',
        'picture/Toshima_City_Hall_05.png',
        'picture/Toshima_City_Hall_06.png',
        'picture/Toshima_City_Hall_07.png',
        'picture/Toshima_City_Hall_08.png',
        'picture/Toshima_City_Hall_09.png',
      ],
    },

    /* ─ Ginza (ginza.html) ─ */
    {
      name: 'Kitte Marunouchi & JP Tower',
      district: 'Ginza',
      architect: 'Kengo Kuma',
      year: '2013',
      href: 'ginza.html#building-01',
      images: [
        'picture/Kitte_Marunouchi_01.png',
        'picture/Kitte_Marunouchi_02.png',
        'picture/Kitte_Marunouchi_03.png',
        'picture/Kitte_Marunouchi_04.png',
        'picture/Kitte_Marunouchi_05.png',
        'picture/Kitte_Marunouchi_06.png',
        'picture/Kitte_Marunouchi_07.png',
        'picture/Kitte_Marunouchi_08.png',
        'picture/Kitte_Marunouchi_09.png',
      ],
    },
    {
      name: 'Apple Marunouchi Store',
      district: 'Ginza',
      architect: 'Foster + Partners',
      year: '2019',
      href: 'ginza.html#building-02',
      images: [
        'picture/Apple Marunouchi Store_01.png',
        'picture/Apple Marunouchi Store_02.png',
        'picture/Apple Marunouchi Store_03.png',
        'picture/Apple Marunouchi Store_04.png',
        'picture/Apple Marunouchi Store_05.png',
      ],
    },
    {
      name: 'Tokyo International Forum',
      district: 'Ginza',
      architect: 'Rafael Viñoly',
      year: '1996',
      href: 'ginza.html#building-03',
      images: [
        'picture/Tokyo_International_Forum_01.png',
        'picture/Tokyo_International_Forum_02.png',
        'picture/Tokyo_International_Forum_03.png',
        'picture/Tokyo_International_Forum_04.png',
        'picture/Tokyo_International_Forum_05.png',
        'picture/Tokyo_International_Forum_06.png',
        'picture/Tokyo_International_Forum_07.png',
        'picture/Tokyo_International_Forum_08.png',
        'picture/Tokyo_International_Forum_09.png',
        'picture/Tokyo_International_Forum_10.png',
        'picture/Tokyo_International_Forum_11.png',
        'picture/Tokyo_International_Forum_12.png',
        'picture/Tokyo_International_Forum_13.png',
        'picture/Tokyo_International_Forum_14.png',
        'picture/Tokyo_International_Forum_15.png',
        'picture/Tokyo_International_Forum_16.png',
      ],
    },
    {
      name: 'Marronnier Gate Ginza / Uniqlo Tokyo',
      district: 'Ginza',
      architect: 'Herzog & de Meuron',
      year: '2020',
      href: 'ginza.html#building-04',
      images: [
        'picture/Marronnier_Gate_Ginza_01.png',
        'picture/Marronnier_Gate_Ginza_02.png',
        'picture/Marronnier_Gate_Ginza_03.png',
        'picture/Marronnier_Gate_Ginza_04.png',
        'picture/Marronnier_Gate_Ginza_05.png',
        'picture/Marronnier_Gate_Ginza_06.png',
        'picture/Marronnier_Gate_Ginza_07.png',
        'picture/Marronnier_Gate_Ginza_08.png',
        'picture/Marronnier_Gate_Ginza_09.png',
        'picture/Marronnier_Gate_Ginza_10.png',
        'picture/Marronnier_Gate_Ginza_11.png',
      ],
    },
    {
      name: 'Mikimoto II Ginza',
      district: 'Ginza',
      architect: 'Toyo Ito',
      year: '2005',
      href: 'ginza.html#building-05',
      images: [
        'picture/Mikimoto_II_Ginza_01.png',
        'picture/Mikimoto_II_Ginza_02.png',
        'picture/Mikimoto_II_Ginza_03.png',
        'picture/Mikimoto_II_Ginza_04.png',
        'picture/Mikimoto_II_Ginza_05.png',
        'picture/Mikimoto_II_Ginza_06.png',
        'picture/Mikimoto_II_Ginza_07.png',
        'picture/Mikimoto_II_Ginza_08.png',
      ],
    },
    {
      name: 'Loro Piana Flagship Ginza',
      district: 'Ginza',
      architect: 'Jun Aoki',
      year: '2019',
      href: 'ginza.html#building-06',
      images: [
        'picture/Loro_Piana_Flagship_Ginza_01.png',
        'picture/Loro_Piana_Flagship_Ginza_02.png',
        'picture/Loro_Piana_Flagship_Ginza_03.png',
        'picture/Loro_Piana_Flagship_Ginza_04.png',
        'picture/Loro_Piana_Flagship_Ginza_05.png',
        'picture/Loro_Piana_Flagship_Ginza_06.png',
      ],
    },
    {
      name: 'Maison Hermès Ginza',
      district: 'Ginza',
      architect: 'Renzo Piano',
      year: '2001',
      href: 'ginza.html#building-07',
      images: [
        'picture/Maison_Hermes_Ginza_01.png',
        'picture/Maison_Hermes_Ginza_02.png',
        'picture/Maison_Hermes_Ginza_03.png',
        'picture/Maison_Hermes_Ginza_04.png',
        'picture/Maison_Hermes_Ginza_05.png',
        'picture/Maison_Hermes_Ginza_06.png',
      ],
    },
    {
      name: 'Ginza Six',
      district: 'Ginza',
      architect: 'Yoshio Taniguchi',
      year: '2017',
      href: 'ginza.html#building-08',
      images: [
        'picture/Ginza_Six_01.png',
        'picture/Ginza_Six_02.png',
        'picture/Ginza_Six_03.png',
        'picture/Ginza_Six_04.png',
        'picture/Ginza_Six_05.png',
        'picture/Ginza_Six_06.png',
        'picture/Ginza_Six_07.png',
      ],
    },
    {
      name: 'Apple Store Ginza / Hulic Ginza 8',
      district: 'Ginza',
      architect: 'Kengo Kuma',
      year: '2022',
      href: 'ginza.html#building-09',
      images: [
        'picture/Apple_Store_Ginza_01.png',
        'picture/Apple_Store_Ginza_02.png',
        'picture/Apple_Store_Ginza_03.png',
        'picture/Apple_Store_Ginza_04.png',
        'picture/Apple_Store_Ginza_05.png',
        'picture/Apple_Store_Ginza_06.png',
      ],
    },
    {
      name: 'Ginza Takagi Building',
      district: 'Ginza',
      architect: 'Tetsuo Yamaji',
      year: '2023',
      href: 'ginza.html#building-10',
      images: [
        'picture/Ginza_Takagi_Building_01.png',
        'picture/Ginza_Takagi_Building_02.png',
        'picture/Ginza_Takagi_Building_03.png',
        'picture/Ginza_Takagi_Building_04.png',
        'picture/Ginza_Takagi_Building_05.png',
        'picture/Ginza_Takagi_Building_06.png',
        'picture/Ginza_Takagi_Building_07.png',
      ],
    },
    {
      name: 'Ginza Innit / Jo Nagasaki',
      district: 'Ginza',
      architect: 'Jo Nagasaki',
      year: '2021',
      href: 'ginza.html#building-11',
      images: [
        'picture/Ginza_Innit_01.png',
        'picture/Ginza_innit_02.png',
        'picture/Ginza_Innit_03.png',
        'picture/Ginza_Innit_04.png',
        'picture/Ginza_Innit_05.png',
        'picture/Ginza_Innit_06.png',
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
