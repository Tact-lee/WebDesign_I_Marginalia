/**
 * Marginalia — Gallery Filter + Reveal
 */

(function () {
  'use strict';

  // ── Filter buttons ──────────────────────────────────────────────────────
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards      = document.querySelectorAll('.masonry-grid .card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.type === filter;
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        if (match) {
          card.style.opacity   = '1';
          card.style.transform = '';
          card.style.pointerEvents = '';
        } else {
          card.style.opacity   = '0';
          card.style.transform = 'translateY(8px)';
          card.style.pointerEvents = 'none';
        }
      });
    });
  });

  // ── Scroll reveal ───────────────────────────────────────────────────────
  const revealCards = document.querySelectorAll('.card');

  revealCards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = `opacity 0.6s ease ${i * 0.06}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealCards.forEach(card => observer.observe(card));

  // ── Nav scroll effect ───────────────────────────────────────────────────
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.borderBottomColor = 'rgba(26,26,24,0.25)';
    } else {
      nav.style.borderBottomColor = 'rgba(26,26,24,0.15)';
    }
  }, { passive: true });

})();
