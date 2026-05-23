/**
 * Marginalia — Page Transition
 * transition.js  ·  Badge bounce + vertical strip cascade
 */
(function () {
  'use strict';

  var overlay = document.getElementById('pageTransition');
  if (!overlay) return;

  var badges    = Array.from(overlay.querySelectorAll('.pt-badge'));
  var badgeWrap = overlay.querySelector('.pt-badges');

  var BADGE_STAGGER = 170;
  var BADGE_ANIM    = 680;
  var BADGE_TAIL    = 140;
  var STRIP_COVER   = 620;

  /* ── sessionStorage (private mode safe) ── */
  var viaTransition = false;
  try {
    viaTransition = sessionStorage.getItem('pt-active') === '1';
    sessionStorage.removeItem('pt-active');
  } catch (e) {}

  /* ── revealPage — called exactly once ── */
  var revealed = false;
  function revealPage() {
    if (revealed) return;
    revealed = true;
    overlay.classList.add('is-out');
  }

  /* ── Hard fallback: force reveal after 5s no matter what ── */
  var hardFallback = setTimeout(revealPage, 5000);

  /* ══════════════════════════════════════════
     REVEAL SEQUENCE
  ══════════════════════════════════════════ */
  if (viaTransition) {
    /* Skip badge phase — hide badges and drop strips.
       Use setTimeout(60) instead of a single rAF so the browser
       has time to commit the initial translateY(0) state before
       we add is-out; otherwise the CSS transition may not play. */
    if (badgeWrap) badgeWrap.style.opacity = '0';
    setTimeout(function () {
      revealPage();
      clearTimeout(hardFallback);
    }, 60);

  } else {
    /* Phase 1 — animate each badge with a stagger */
    badges.forEach(function (b, i) {
      setTimeout(function () {
        b.classList.add('is-active');
      }, i * BADGE_STAGGER);
    });

    /* Phase 2 — drop strips once all badges are done */
    var dropAt = (badges.length - 1) * BADGE_STAGGER + BADGE_ANIM + BADGE_TAIL;
    setTimeout(function () {
      revealPage();
      clearTimeout(hardFallback);
    }, dropAt);
  }

  /* ══════════════════════════════════════════
     INTERCEPT INTERNAL LINKS
  ══════════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');

    /* skip: anchors, external URLs, mailto/tel, new-tab */
    if (
      !href                          ||
      href.charAt(0) === '#'         ||
      href.indexOf('http')   === 0   ||
      href.indexOf('//')     === 0   ||
      href.indexOf('mailto') === 0   ||
      href.indexOf('tel')    === 0   ||
      link.target === '_blank'
    ) return;

    e.preventDefault();

    /* 1. Snap strips above viewport (no animation) */
    overlay.classList.remove('is-out', 'is-in');
    overlay.classList.add('is-reset');

    /* 2. Force reflow so browser registers translateY(-105%) */
    overlay.getBoundingClientRect();

    /* 3. Cascade strips down to cover screen */
    overlay.classList.remove('is-reset');
    overlay.classList.add('is-in');

    /* 4. Navigate after curtain fully covers */
    try { sessionStorage.setItem('pt-active', '1'); } catch (e) {}
    setTimeout(function () {
      window.location.href = href;
    }, STRIP_COVER);
  });

}());
