/**
 * Marginalia — Mobile Nav (Hamburger)
 * nav.js
 */
(function () {
  'use strict';

  var hamburger  = document.getElementById('navHamburger');
  var mobileMenu = document.getElementById('navMobileMenu');
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    hamburger.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  /* 링크 클릭 시 닫기 */
  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  /* 언어 버튼 클릭 시 닫기 */
  mobileMenu.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', closeMenu);
  });

  /* ESC 키 닫기 */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
}());
