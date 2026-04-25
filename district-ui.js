/**
 * Marginalia — District UI
 * district-ui.js  ·  Side Indicator · Image Lightbox
 */
(function () {
  'use strict';

  var buildings = Array.from(document.querySelectorAll('article.d-building'));

  /* ══════════════════════════════════════════
     1. SIDE INDICATOR
  ══════════════════════════════════════════ */
  if (buildings.length > 1) {
    var sidenav = document.createElement('nav');
    sidenav.className = 'd-side-nav';
    sidenav.setAttribute('aria-label', 'Building navigation');

    var navItems = buildings.map(function (b, i) {
      var numEl   = b.querySelector('.d-building__num');
      var label   = numEl ? numEl.textContent.trim() : String(i + 1).padStart(2, '0');
      var titleEl = b.querySelector('.d-building__title');
      var title   = titleEl ? titleEl.textContent.trim() : '';

      var btn = document.createElement('button');
      btn.className = 'd-side-nav__item';
      btn.setAttribute('aria-label', 'Jump to building ' + label + (title ? ' ' + title : ''));
      btn.innerHTML =
        '<span class="d-side-nav__num">' + label + '</span>' +
        '<div class="d-side-nav__tick"></div>';

      btn.addEventListener('click', function () {
        b.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      sidenav.appendChild(btn);
      return btn;
    });

    document.body.appendChild(sidenav);

    /* show when first building enters viewport */
    var showObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) sidenav.classList.add('is-visible');
      });
    }, { threshold: 0.01 });
    buildings.forEach(function (b) { showObs.observe(b); });

    /* hide when footer appears */
    var footer = document.querySelector('.footer');
    if (footer) {
      var hideObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          sidenav.style.opacity = e.isIntersecting ? '0' : '';
        });
      }, { threshold: 0.1 });
      hideObs.observe(footer);
    }

    /* active building tracking */
    var activeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var idx = buildings.indexOf(e.target);
        if (idx < 0) return;
        navItems.forEach(function (it) { it.classList.remove('is-active'); });
        navItems[idx].classList.add('is-active');
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    buildings.forEach(function (b) { activeObs.observe(b); });
    navItems[0].classList.add('is-active');
  }


  /* ══════════════════════════════════════════
     2. IMAGE LIGHTBOX  (per-building pool)
  ══════════════════════════════════════════ */
  var lb = document.createElement('div');
  lb.className = 'd-lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.innerHTML = [
    '<button class="d-lb__close" id="lbClose">Close &times;</button>',
    '<div class="d-lb__img-wrap">',
    '  <img class="d-lb__img" id="lbImg" src="" alt="" />',
    '</div>',
    '<div class="d-lb__bar">',
    '  <button class="d-lb__btn" id="lbPrev">&#8592; Prev</button>',
    '  <span class="d-lb__count" id="lbCount"></span>',
    '  <button class="d-lb__btn" id="lbNext">Next &#8594;</button>',
    '</div>'
  ].join('');
  document.body.appendChild(lb);

  var lbImg     = document.getElementById('lbImg');
  var lbCount   = document.getElementById('lbCount');
  var lbPrev    = document.getElementById('lbPrev');
  var lbNext    = document.getElementById('lbNext');
  var lbClose   = document.getElementById('lbClose');

  var pool = [];
  var cur  = 0;

  function openLb(imgs, idx) {
    pool = imgs;
    cur  = idx;
    renderLb(false);
    lb.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLb() {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(function () { lbImg.src = ''; }, 350);
  }

  function renderLb(fade) {
    var imgEl = pool[cur];
    if (fade) {
      lbImg.classList.add('is-fading');
      setTimeout(function () {
        lbImg.src = imgEl.src;
        lbImg.alt = imgEl.alt;
        lbImg.onload = function () { lbImg.classList.remove('is-fading'); };
        if (lbImg.complete) lbImg.classList.remove('is-fading');
      }, 160);
    } else {
      lbImg.src = imgEl.src;
      lbImg.alt = imgEl.alt;
    }
    lbCount.textContent = (cur + 1) + ' ∕ ' + pool.length;
    lbPrev.disabled = cur === 0;
    lbNext.disabled = cur === pool.length - 1;
  }

  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', function () { if (cur > 0) { cur--; renderLb(true); } });
  lbNext.addEventListener('click', function () { if (cur < pool.length - 1) { cur++; renderLb(true); } });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape')      closeLb();
    if (e.key === 'ArrowLeft'  && cur > 0)             { cur--; renderLb(true); }
    if (e.key === 'ArrowRight' && cur < pool.length-1) { cur++; renderLb(true); }
  });

  /* bind images — each building gets its own pool */
  var IMG_SEL =
    '.d-building__seg-img img, ' +
    '.d-building__gallery-item img, ' +
    '.d-building__diagram img';

  buildings.forEach(function (building) {
    var imgs = Array.from(building.querySelectorAll(IMG_SEL));
    if (!imgs.length) return;
    imgs.forEach(function (img, i) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        openLb(imgs, i);
      });
    });
  });

})();
