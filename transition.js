/**
 * Marginalia — Page Transition
 * transition.js  ·  Badge bounce + vertical strip cascade
 *
 * Flow (fresh load):
 *   Strips cover viewport → badges bounce up & fill sequentially
 *   → all badges done → strips drop downward (staggered L→R) → page revealed
 *
 * Flow (via transition / new page):
 *   Strips cover viewport → immediately drop → page revealed (no badge phase)
 *
 * Flow (link click):
 *   Strips snap above → cascade down to cover → navigate
 */
(function () {
  'use strict';

  var overlay   = document.getElementById('pageTransition');
  if (!overlay) return;

  var badges    = Array.from(overlay.querySelectorAll('.pt-badge'));
  var badgeWrap = overlay.querySelector('.pt-badges');

  var BADGE_STAGGER = 170;   /* ms between each badge activation      */
  var BADGE_ANIM    = 680;   /* badge animation duration (ms)         */
  var BADGE_TAIL    = 140;   /* extra pause after last badge (ms)     */
  var STRIP_COVER   = 620;   /* ms after strip-in starts → navigate  */

  /* ── Did we arrive via our own transition? ── */
  var viaTransition = sessionStorage.getItem('pt-active') === '1';
  sessionStorage.removeItem('pt-active');

  /* ══════════════════════════════════════════
     REVEAL SEQUENCE
  ══════════════════════════════════════════ */
  if (viaTransition) {
    /* Skip badge phase — drop strips immediately */
    if (badgeWrap) badgeWrap.style.opacity = '0';
    requestAnimationFrame(function () {
      overlay.classList.add('is-out');
    });

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
      overlay.classList.add('is-out');
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
    sessionStorage.setItem('pt-active', '1');
    setTimeout(function () {
      window.location.href = href;
    }, STRIP_COVER);
  });

})();
