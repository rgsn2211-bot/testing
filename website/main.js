(function () {
  'use strict';

  /* ── Loader ─────────────────────────────────────────── */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => {
        const hc = document.querySelector('.hero-content');
        if (hc) hc.classList.add('visible');
        loader.style.display = 'none';
      }, 650);
    }, 2000);
  });

  /* ── Scroll reveal ──────────────────────────────────── */
  const revealEls = document.querySelectorAll(
    '.section-label,.section-title,.section-desc,.delivery-card,' +
    '.location-detail,.map-wrap,.menu-cta,.hero-cta-group,.origin-card'
  );
  revealEls.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => entry.target.classList.add('visible'), idx * 90);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => obs.observe(el));

  /* ── Smooth anchor scrolling ────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY,
        behavior: 'smooth'
      });
    });
  });

  /* ── Header fade on scroll ──────────────────────────── */
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.style.background     = window.scrollY > 60 ? 'rgba(21,43,71,0.72)' : 'transparent';
    header.style.backdropFilter = window.scrollY > 60 ? 'blur(12px)' : 'none';
    header.style.transition     = 'background 0.4s, backdrop-filter 0.4s';
  }, { passive: true });

  /* ── Journey rail: progress dots + active card ──────── */
  const rail     = document.getElementById('journeyRail');
  const progress = document.getElementById('journeyProgress');
  if (rail && progress) {
    const cards = Array.from(rail.querySelectorAll('.origin-card'));
    const dots  = Array.from(progress.querySelectorAll('.dot'));

    function setActive(i) {
      dots.forEach((d, j)  => d.classList.toggle('active', j === i));
      cards.forEach((c, j) => c.classList.toggle('is-active', j === i));
    }

    /* Use IntersectionObserver to detect which card is centred in the rail */
    const cardObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.6) {
          const idx = cards.indexOf(e.target);
          if (idx >= 0) setActive(idx);
        }
      });
    }, { root: rail, threshold: [0.6, 0.8] });

    cards.forEach(c => cardObs.observe(c));

    /* Tap a progress dot to scroll to that card */
    dots.forEach((d, i) => {
      d.addEventListener('click', () => {
        cards[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
      });
      d.style.cursor = 'pointer';
    });
  }

})();
