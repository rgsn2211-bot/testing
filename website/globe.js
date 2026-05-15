(function () {
  'use strict';

  const GLOBE_RADIUS = 220;
  const STAR_COUNT   = 2000;

  const BAHRAIN = { name: 'BAHRAIN', lat: 26.23, lng: 50.59 };

  const ORIGINS = [
    { name: 'ETHIOPIA',  lat:  9.1,  lng:  40.5  },
    { name: 'COLOMBIA',  lat:  4.6,  lng: -74.3  },
    { name: 'BRAZIL',    lat: -14.2, lng: -51.9  },
    { name: 'YEMEN',     lat:  15.6, lng:  48.5  },
    { name: 'GUATEMALA', lat:  15.8, lng: -90.2  },
  ];

  /* ── coordinate helper ──────────────────────────────── */
  function latLngToVec3(lat, lng, r) {
    const phi   = (90 - lat)  * Math.PI / 180;
    const theta = (lng + 180) * Math.PI / 180;
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  /* ── canvas sprite label ────────────────────────────── */
  function makeLabel(text, isDestination) {
    const W = 300, H = 52;
    const canvas = document.createElement('canvas');
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const color    = isDestination ? '#FFFFFF' : '#C8A96E';
    const fontSize = isDestination ? 15 : 12;

    /* subtle backing pill */
    ctx.fillStyle = isDestination
      ? 'rgba(255,255,255,0.10)'
      : 'rgba(200,169,110,0.08)';
    ctx.beginPath();
    ctx.roundRect(W * 0.15, H * 0.22, W * 0.7, H * 0.56, 4);
    ctx.fill();

    /* text */
    ctx.font      = `600 ${fontSize}px Inter, Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    /* letter-spacing polyfill */
    const letters  = text.split('');
    const spacing  = fontSize * 0.22;
    const totalW   = letters.length * (fontSize * 0.62 + spacing);
    let   cx       = W / 2 - totalW / 2 + (fontSize * 0.31);
    for (const ch of letters) {
      ctx.fillText(ch, cx, H / 2);
      cx += ctx.measureText(ch).width + spacing;
    }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({
      map:        tex,
      transparent: true,
      depthTest:  true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(isDestination ? 72 : 60, isDestination ? 13 : 11, 1);
    return sprite;
  }

  /* ── main ───────────────────────────────────────────── */
  async function initGlobe() {
    const canvas = document.getElementById('globe-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 3000);

    const isMobile = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.set(0, 0, isMobile ? 540 : 680);

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── stars ─────────────────────────────────────────── */
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r   = 1200 + Math.random() * 400;
      const phi = Math.acos(2 * Math.random() - 1);
      const th  = Math.random() * 2 * Math.PI;
      starPos[i*3]   = r * Math.sin(phi) * Math.cos(th);
      starPos[i*3+1] = r * Math.sin(phi) * Math.sin(th);
      starPos[i*3+2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 1.0, transparent: true, opacity: 0.5
    })));

    /* ── base sphere (dark ocean) ───────────────────────── */
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 0.995, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x0D1B2E })
    ));

    /* ── atmosphere glow ────────────────────────────────── */
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.14, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x1E3A5F, transparent: true,
        opacity: 0.20, side: THREE.BackSide
      })
    ));

    /* ── globe group (world map + markers + arcs) ───────── */
    const globeGroup  = new THREE.Group();
    const markerGroup = new THREE.Group();
    const arcGroup    = new THREE.Group();
    scene.add(globeGroup, markerGroup, arcGroup);

    /* ── load world map outlines ───────────────────────── */
    const outlineMat = new THREE.LineBasicMaterial({
      color: 0x2A5080, transparent: true, opacity: 0.65
    });

    try {
      const res   = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
      const world = await res.json();

      const { scale, translate } = world.transform;

      world.arcs.forEach(rawArc => {
        let x = 0, y = 0;
        const pts = [];
        for (const [dx, dy] of rawArc) {
          x += dx; y += dy;
          const lng = x * scale[0] + translate[0];
          const lat = y * scale[1] + translate[1];
          pts.push(latLngToVec3(lat, lng, GLOBE_RADIUS));
        }
        if (pts.length < 2) return;
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        globeGroup.add(new THREE.Line(geo, outlineMat));
      });

    } catch (e) {
      /* fallback dot grid if CDN unavailable */
      const dotPos = [];
      for (let row = 0; row < 160; row++) {
        const lat  = -90 + row * (180/160);
        const cols = Math.max(1, Math.round(160 * 2 * Math.cos(Math.abs(lat) * Math.PI/180)));
        for (let col = 0; col < cols; col++) {
          const v = latLngToVec3(lat, -180 + col*(360/cols), GLOBE_RADIUS);
          dotPos.push(v.x, v.y, v.z);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(dotPos, 3));
      globeGroup.add(new THREE.Points(g, new THREE.PointsMaterial({
        color: 0x2D527E, size: 1.5, transparent: true, opacity: 0.5
      })));
    }

    /* ── origin markers + labels ───────────────────────── */
    ORIGINS.forEach(o => {
      const pos = latLngToVec3(o.lat, o.lng, GLOBE_RADIUS + 2);

      /* outer pulse ring */
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3.5, 6.5, 20),
        new THREE.MeshBasicMaterial({
          color: 0xC8A96E, side: THREE.DoubleSide,
          transparent: true, opacity: 0.9
        })
      );
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      ring.userData = { pulse: Math.random() * Math.PI * 2 };
      markerGroup.add(ring);

      /* centre dot */
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(2.5, 12),
        new THREE.MeshBasicMaterial({ color: 0xC8A96E, side: THREE.DoubleSide })
      );
      dot.position.copy(pos);
      dot.lookAt(0, 0, 0);
      markerGroup.add(dot);

      /* label sprite */
      const label    = makeLabel(o.name, false);
      const labelPos = latLngToVec3(o.lat, o.lng, GLOBE_RADIUS + 28);
      label.position.copy(labelPos);
      markerGroup.add(label);
    });

    /* ── Bahrain destination marker + label ─────────────── */
    const brPos  = latLngToVec3(BAHRAIN.lat, BAHRAIN.lng, GLOBE_RADIUS + 2);

    const brRingOuter = new THREE.Mesh(
      new THREE.RingGeometry(9, 14, 32),
      new THREE.MeshBasicMaterial({
        color: 0xFFFFFF, side: THREE.DoubleSide,
        transparent: true, opacity: 0.55
      })
    );
    brRingOuter.position.copy(brPos);
    brRingOuter.lookAt(0, 0, 0);
    brRingOuter.userData = { pulse: 0, isBahrain: true, outer: true };
    markerGroup.add(brRingOuter);

    const brRingInner = new THREE.Mesh(
      new THREE.RingGeometry(5, 9, 24),
      new THREE.MeshBasicMaterial({
        color: 0xFFFFFF, side: THREE.DoubleSide,
        transparent: true, opacity: 0.9
      })
    );
    brRingInner.position.copy(brPos);
    brRingInner.lookAt(0, 0, 0);
    brRingInner.userData = { pulse: 0, isBahrain: true };
    markerGroup.add(brRingInner);

    const brDot = new THREE.Mesh(
      new THREE.CircleGeometry(3.5, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide })
    );
    brDot.position.copy(brPos);
    brDot.lookAt(0, 0, 0);
    markerGroup.add(brDot);

    const brLabel    = makeLabel(BAHRAIN.name, true);
    const brLabelPos = latLngToVec3(BAHRAIN.lat, BAHRAIN.lng, GLOBE_RADIUS + 30);
    brLabel.position.copy(brLabelPos);
    markerGroup.add(brLabel);

    /* ── arc lines: each origin → Bahrain ───────────────── */
    const arcLines       = [];
    const bahrainSurface = latLngToVec3(BAHRAIN.lat, BAHRAIN.lng, GLOBE_RADIUS + 5);

    ORIGINS.forEach((o, idx) => {
      const start   = latLngToVec3(o.lat, o.lng, GLOBE_RADIUS + 5);
      const end     = bahrainSurface.clone();

      /* elevate midpoint above globe surface */
      const mid     = start.clone().add(end).multiplyScalar(0.5);
      const elevate = 1.45 + start.distanceTo(end) / (GLOBE_RADIUS * 2.2);
      mid.normalize().multiplyScalar(GLOBE_RADIUS * elevate);

      const curve  = new THREE.QuadraticBezierCurve3(start, mid, end);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
      const arcMat = new THREE.LineBasicMaterial({
        color: 0xC8A96E, transparent: true, opacity: 0
      });
      const line = new THREE.Line(arcGeo, arcMat);
      arcGroup.add(line);

      arcLines.push({
        line,
        phase: (idx / ORIGINS.length) * Math.PI * 2,
        speed: 0.38 + Math.random() * 0.18,
      });
    });

    /* ── drag / touch ───────────────────────────────────── */
    let isDragging = false;
    let prevMouse  = { x: 0, y: 0 };
    let rotVel     = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', e => {
      isDragging = true;
      prevMouse  = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      rotVel.x  = (e.clientY - prevMouse.y) * 0.003;
      rotVel.y  = (e.clientX - prevMouse.x) * 0.003;
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
      rotVel.x  = (e.touches[0].clientY - prevMouse.y) * 0.003;
      rotVel.y  = (e.touches[0].clientX - prevMouse.x) * 0.003;
      prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    canvas.addEventListener('touchend', () => { isDragging = false; });

    let mouseNorm = { x: 0, y: 0 };
    window.addEventListener('mousemove', e => {
      mouseNorm.x = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseNorm.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    /* ── animation loop ─────────────────────────────────── */
    /* face Bahrain on load: rotY = PI/2 - theta where theta = (lng+180)*PI/180 */
    const INIT_ROT_Y = Math.PI / 2 - (BAHRAIN.lng + 180) * Math.PI / 180;
    let rotY = INIT_ROT_Y, rotX = 0, elapsed = 0, spinDelay = 1.6;
    const clock = new THREE.Clock();

    function syncAll(ry, rx) {
      globeGroup.rotation.y  = markerGroup.rotation.y  = arcGroup.rotation.y  = ry;
      globeGroup.rotation.x  = markerGroup.rotation.x  = arcGroup.rotation.x  = rx;
    }

    function animate() {
      requestAnimationFrame(animate);
      const dt = clock.getDelta();
      elapsed += dt;

      if (!isDragging) { rotVel.y *= 0.97; rotVel.x *= 0.97; }
      if (spinDelay > 0) spinDelay -= dt;
      rotY += (spinDelay <= 0 ? 0.0012 : 0) + rotVel.y;
      rotX  = Math.max(-0.5, Math.min(0.5, rotX + rotVel.x));
      syncAll(rotY, rotX);

      /* camera parallax */
      camera.position.x += (mouseNorm.x * 28 - camera.position.x) * 0.04;
      camera.position.y += (-mouseNorm.y * 18 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      /* pulse rings */
      markerGroup.children.forEach(child => {
        if (!child.userData || child.userData.pulse === undefined) return;

        if (child.userData.isBahrain) {
          child.userData.pulse += dt * 2.0;
          const t = Math.abs(Math.sin(child.userData.pulse));
          if (child.userData.outer) {
            child.scale.setScalar(1 + 0.8 * t);
            child.material.opacity = 0.55 * (1 - t);
          } else {
            child.scale.setScalar(1 + 0.4 * t);
            child.material.opacity = 0.65 + 0.35 * t;
          }
        } else {
          child.userData.pulse += dt * 1.5;
          const t = Math.sin(child.userData.pulse);
          child.scale.setScalar(1 + 0.3 * t);
          child.material.opacity = 0.55 + 0.45 * t;
        }
      });

      /* arc opacity pulse */
      arcLines.forEach(a => {
        a.line.material.opacity =
          ((Math.sin(elapsed * a.speed + a.phase) + 1) * 0.5) * 0.78;
      });

      renderer.render(scene, camera);
    }

    animate();
  }

  if (typeof THREE !== 'undefined') initGlobe();
  else window.addEventListener('load', initGlobe);
})();
