/* ═══════════════════════════════════════════════════════════
   RUSH SPECIALTY COFFEE — THREE.JS GLOBE
   Dot-matrix globe with coffee-origin arc lines
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const GLOBE_RADIUS = 220;
  const STAR_COUNT   = 2200;
  const DOT_ROWS     = 180;

  /* Coffee-origin coordinates [lat, lng] */
  /* Bahrain — destination for all arcs */
  const BAHRAIN = { lat: 26.23, lng: 50.59 };

  const ORIGINS = [
    { name: 'Ethiopia',    lat:  9.1, lng:  40.5, color: 0xC8A96E },
    { name: 'Colombia',    lat:  4.6, lng: -74.3, color: 0xC8A96E },
    { name: 'Brazil',      lat:-14.2, lng: -51.9, color: 0xC8A96E },
    { name: 'Yemen',       lat: 15.6, lng:  48.5, color: 0xC8A96E },
    { name: 'Guatemala',   lat: 15.8, lng: -90.2, color: 0xC8A96E },
    { name: 'Indonesia',   lat: -6.2, lng: 106.8, color: 0xC8A96E },
  ];

  /* ── helpers ────────────────────────────────────────── */
  function latLngToVec3(lat, lng, r) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = (lng + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ── main ───────────────────────────────────────────── */
  function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    /* Scene */
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(42, 1, 0.1, 3000);
    camera.position.set(0, 0, 680);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha:     true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    function resize() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── Stars ─────────────────────────────────────────── */
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r   = 1200 + Math.random() * 400;
      const phi = Math.acos(2 * Math.random() - 1);
      const th  = Math.random() * 2 * Math.PI;
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(th);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(th);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat  = new THREE.PointsMaterial({ color: 0xffffff, size: 1.1, transparent: true, opacity: 0.55 });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ── Globe dots ────────────────────────────────────── */
    const dotPositions = [];
    for (let row = 0; row < DOT_ROWS; row++) {
      const lat     = -90 + row * (180 / DOT_ROWS);
      const circumf = Math.cos(Math.abs(lat) * Math.PI / 180);
      const dotCols = Math.max(1, Math.round(DOT_ROWS * 2 * circumf));
      for (let col = 0; col < dotCols; col++) {
        const lng = -180 + col * (360 / dotCols);
        const v   = latLngToVec3(lat, lng, GLOBE_RADIUS);
        dotPositions.push(v.x, v.y, v.z);
      }
    }
    const globeGeo = new THREE.BufferGeometry();
    globeGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    const globeMat = new THREE.PointsMaterial({
      color:       0x4A7FBF,
      size:        2.0,
      transparent: true,
      opacity:     0.55,
      sizeAttenuation: true,
    });
    const globeDots = new THREE.Points(globeGeo, globeMat);
    scene.add(globeDots);

    /* Atmospheric glow — large translucent sphere */
    const glowGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color:       0x1E3A5F,
      transparent: true,
      opacity:     0.22,
      side:        THREE.BackSide,
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    /* Inner sphere (dark, to occlude back-side dots) */
    const innerGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 0.99, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x152B47 });
    scene.add(new THREE.Mesh(innerGeo, innerMat));

    /* ── Origin markers ────────────────────────────────── */
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);

    ORIGINS.forEach(o => {
      const pos = latLngToVec3(o.lat, o.lng, GLOBE_RADIUS + 2);

      /* Pulse ring */
      const ringGeo = new THREE.RingGeometry(4, 7, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color:       o.color,
        side:        THREE.DoubleSide,
        transparent: true,
        opacity:     0.85,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { pulse: Math.random() * Math.PI * 2 };
      markerGroup.add(ring);

      /* Dot centre */
      const dotGeo = new THREE.CircleGeometry(3, 12);
      const dotMat = new THREE.MeshBasicMaterial({ color: o.color, side: THREE.DoubleSide });
      const dot    = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(pos);
      dot.lookAt(0, 0, 0);
      markerGroup.add(dot);
    });

    /* ── Bahrain marker (destination) ─────────────────── */
    const bahrainPos = latLngToVec3(BAHRAIN.lat, BAHRAIN.lng, GLOBE_RADIUS + 2);
    const brRing = new THREE.Mesh(
      new THREE.RingGeometry(5, 9, 24),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
    );
    brRing.position.copy(bahrainPos);
    brRing.lookAt(0, 0, 0);
    brRing.userData = { pulse: 0, isBahrain: true };
    markerGroup.add(brRing);

    const brDot = new THREE.Mesh(
      new THREE.CircleGeometry(4, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide })
    );
    brDot.position.copy(bahrainPos);
    brDot.lookAt(0, 0, 0);
    markerGroup.add(brDot);

    /* ── Arc lines: origins → Bahrain ─────────────────── */
    const arcGroup  = new THREE.Group();
    scene.add(arcGroup);
    const arcLines  = [];

    const bahrainSurface = latLngToVec3(BAHRAIN.lat, BAHRAIN.lng, GLOBE_RADIUS + 5);

    ORIGINS.forEach((o, idx) => {
      const start = latLngToVec3(o.lat, o.lng, GLOBE_RADIUS + 5);
      const end   = bahrainSurface.clone();

      /* Midpoint elevated above the sphere surface for a nice arc */
      const mid = start.clone().add(end).multiplyScalar(0.5);
      const elevate = 1.5 + start.distanceTo(end) / (GLOBE_RADIUS * 2);
      mid.normalize().multiplyScalar(GLOBE_RADIUS * elevate);

      const curve  = new THREE.QuadraticBezierCurve3(start, mid, end);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
      const arcMat = new THREE.LineBasicMaterial({ color: 0xC8A96E, transparent: true, opacity: 0 });
      const line   = new THREE.Line(arcGeo, arcMat);
      arcGroup.add(line);

      arcLines.push({
        line,
        phase: (idx / ORIGINS.length) * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.2,
      });
    });

    /* ── Mouse drag rotation ───────────────────────────── */
    let isDragging   = false;
    let prevMouse    = { x: 0, y: 0 };
    let rotVelocity  = { x: 0, y: 0 };
    let targetRot    = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', e => {
      isDragging = true;
      prevMouse  = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotVelocity.x = dy * 0.003;
      rotVelocity.y = dx * 0.003;
      prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouse  = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', e => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouse.x;
      const dy = e.touches[0].clientY - prevMouse.y;
      rotVelocity.x = dy * 0.003;
      rotVelocity.y = dx * 0.003;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    canvas.addEventListener('touchend', () => { isDragging = false; });

    /* ── Mouse parallax ────────────────────────────────── */
    let mouseNorm = { x: 0, y: 0 };
    window.addEventListener('mousemove', e => {
      mouseNorm.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseNorm.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    /* ── Animation loop ────────────────────────────────── */
    let elapsed = 0;
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      elapsed += dt;

      /* Auto-rotate + drag */
      if (!isDragging) {
        rotVelocity.y *= 0.97;
        rotVelocity.x *= 0.97;
        globeDots.rotation.y += 0.0018 + rotVelocity.y;
        globeDots.rotation.x += rotVelocity.x;
        markerGroup.rotation.y = globeDots.rotation.y;
        markerGroup.rotation.x = globeDots.rotation.x;
        arcGroup.rotation.y    = globeDots.rotation.y;
        arcGroup.rotation.x    = globeDots.rotation.x;
      } else {
        globeDots.rotation.y   += rotVelocity.y;
        globeDots.rotation.x   += rotVelocity.x;
        markerGroup.rotation.y  = globeDots.rotation.y;
        markerGroup.rotation.x  = globeDots.rotation.x;
        arcGroup.rotation.y     = globeDots.rotation.y;
        arcGroup.rotation.x     = globeDots.rotation.x;
      }

      /* Camera parallax */
      camera.position.x += (mouseNorm.x * 30 - camera.position.x) * 0.04;
      camera.position.y += (-mouseNorm.y * 20 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      /* Pulse markers */
      markerGroup.children.forEach(child => {
        if (child.userData && child.userData.pulse !== undefined) {
          child.userData.pulse += dt * (child.userData.isBahrain ? 2.2 : 1.4);
          const s = child.userData.isBahrain
            ? 1 + 0.6 * Math.abs(Math.sin(child.userData.pulse))
            : 1 + 0.35 * Math.sin(child.userData.pulse);
          child.scale.setScalar(s);
          child.material.opacity = child.userData.isBahrain
            ? 0.6 + 0.4 * Math.abs(Math.sin(child.userData.pulse))
            : 0.5 + 0.5 * Math.sin(child.userData.pulse);
        }
      });

      /* Animate arcs */
      arcLines.forEach(arc => {
        const t = (Math.sin(elapsed * arc.speed + arc.phase) + 1) * 0.5;
        arc.line.material.opacity = t * 0.6;
      });

      renderer.render(scene, camera);
    }

    animate();
  }

  /* Wait for Three.js to load then init */
  if (typeof THREE !== 'undefined') {
    initGlobe();
  } else {
    window.addEventListener('load', initGlobe);
  }
})();
