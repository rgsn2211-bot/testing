(function () {
  'use strict';

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

  const revealEls = document.querySelectorAll(
    '.section-label,.section-title,.section-desc,.delivery-card,.location-detail,.map-wrap,.menu-viewer,.hero-cta-group'
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

  const menuFrame = document.getElementById('menuFrame');
  const menuFallback = document.getElementById('menuFallback');
  if (menuFrame && menuFallback) {
    function showFallback() { menuFrame.style.display='none'; menuFallback.style.display='flex'; }
    menuFrame.addEventListener('error', showFallback);
    menuFrame.addEventListener('load', () => {
      try { if (!menuFrame.contentDocument||menuFrame.contentDocument.body.childElementCount===0) showFallback(); } catch(e){}
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
      const t = document.querySelector(this.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
    });
  });

  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.style.background     = window.scrollY > 60 ? 'rgba(21,43,71,0.72)' : 'transparent';
    header.style.backdropFilter = window.scrollY > 60 ? 'blur(12px)' : 'none';
    header.style.transition     = 'background 0.4s, backdrop-filter 0.4s';
  }, { passive: true });
})();
