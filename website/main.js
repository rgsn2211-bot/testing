/* ═══════════════════════════════════════════════════════════
   RUSH SPECIALTY COFFEE — MAIN JS
   Loader, scroll reveal, menu fallback detection
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Loader ─────────────────────────────────────────── */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (!loader) return;

    setTimeout(() => {
      loader.classList.add('hidden');
      /* Show hero content after loader fades */
      setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) heroContent.classList.add('visible');
        loader.style.display = 'none';
      }, 650);
    }, 2000);
  });

  /* ── Scroll reveal ──────────────────────────────────── */
  const revealEls = document.querySelectorAll(
    '.section-label, .section-title, .section-desc, ' +
    '.delivery-card, .location-detail, .map-wrap, ' +
    '.menu-viewer, .hero-cta-group'
  );

  revealEls.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          /* Stagger siblings */
          const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
          const idx = siblings.indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, idx * 90);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── Menu PDF fallback ──────────────────────────────── */
  const menuFrame    = document.getElementById('menuFrame');
  const menuFallback = document.getElementById('menuFallback');

  if (menuFrame && menuFallback) {
    menuFrame.addEventListener('error', showFallback);
    menuFrame.addEventListener('load', () => {
      try {
        /* If iframe loaded but PDF is missing, contentDocument may be empty */
        const doc = menuFrame.contentDocument;
        if (!doc || doc.body.childElementCount === 0) showFallback();
      } catch (e) {
        /* Cross-origin — PDF served from CDN, probably fine */
      }
    });

    function showFallback() {
      menuFrame.style.display = 'none';
      menuFallback.style.display = 'flex';
    }
  }

  /* ── Smooth anchor scrolling (offset for fixed header) */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 0;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── Header fade on scroll ──────────────────────────── */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.style.background = window.scrollY > 60
      ? 'rgba(21,43,71,0.72)'
      : 'transparent';
    header.style.backdropFilter = window.scrollY > 60 ? 'blur(12px)' : 'none';
    header.style.transition = 'background 0.4s, backdrop-filter 0.4s';
  }, { passive: true });

})();
