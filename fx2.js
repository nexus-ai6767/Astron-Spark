/* ASTRON — v2 effects: 3D neural core (canvas, no libraries) + pinned "How it works" */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- ASTRON neural core v3 (plain canvas, additive glow, no libraries) ---------- */
  (function core() {
    const art = $('.hero-art'); if (!art) return;
    const cv = document.createElement('canvas'); cv.className = 'hero-core'; cv.setAttribute('aria-hidden', 'true'); art.appendChild(cv);
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const mobile = innerWidth < 700, TAU = Math.PI * 2, PHI = (1 + Math.sqrt(5)) / 2, GA = Math.PI * (3 - Math.sqrt(5));

    /* palette follows the site accent colour (blue / violet / emerald / amber) */
    let C1 = [79, 209, 255], C2 = [47, 123, 255], C3 = [139, 123, 255];
    const hex = s => { const m = /^#([0-9a-f]{6})$/i.exec((s || '').trim()); return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : null; };
    const readPalette = () => { const cs = getComputedStyle(document.documentElement); C1 = hex(cs.getPropertyValue('--cyan')) || C1; C2 = hex(cs.getPropertyValue('--blue')) || C2; C3 = hex(cs.getPropertyValue('--violet')) || C3; };
    const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
    const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k | 0, a[1] + (b[1] - a[1]) * k | 0, a[2] + (b[2] - a[2]) * k | 0];

    /* pre-rendered glow sprites (rebuilt only when the accent colour changes) */
    let atm = null, nuc = null, palKey = '';
    function sprite(stops) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return c; }
    function buildSprites() {
      const k = C1 + '|' + C2 + '|' + C3; if (k === palKey) return; palKey = k;
      atm = sprite([[0, rgba(C1, .3)], [.16, rgba(C1, .2)], [.38, rgba(C2, .11)], [.7, rgba(C3, .045)], [1, rgba(C2, 0)]]);
      nuc = sprite([[0, 'rgba(255,255,255,1)'], [.055, rgba(mix(C1, [255, 255, 255], .6), .95)], [.16, rgba(C1, .55)], [.32, rgba(C2, .2)], [1, rgba(C2, 0)]]);
    }

    /* geometry */
    const N = mobile ? 300 : 600;
    const shell = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = GA * i;
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r, s: Math.random() * TAU, k: Math.random() };
    });
    const iv = []; [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]]
      .forEach(v => { const l = Math.hypot(v[0], v[1], v[2]); iv.push([v[0] / l, v[1] / l, v[2] / l]); });
    const ie = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) if (Math.hypot(iv[i][0] - iv[j][0], iv[i][1] - iv[j][1], iv[i][2] - iv[j][2]) < 1.1) ie.push([i, j]);
    const sparks = Array.from({ length: mobile ? 22 : 54 }, () => ({ a: Math.random() * TAU, b: .3 + Math.random() * 2.5, R: 1.15 + Math.random() * 1.1, v: (Math.random() * .6 + .2) * (Math.random() < .5 ? -1 : 1), s: Math.random() * TAU }));
    const rings = [{ tilt: .35, spd: .9, k: 0 }, { tilt: 1.15, spd: -.7, k: 1 }, { tilt: 1.9, spd: .55, k: 2 }];
    const arcs = Array.from({ length: mobile ? 3 : 7 }, () => newArc(Math.random()));
    function newArc(t0) {
      let a, b, d; do { a = shell[Math.random() * N | 0]; b = shell[Math.random() * N | 0]; d = Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))); } while (d < .9 || d > 2.3);
      return { a, b, d, t: t0, v: .12 + Math.random() * .16, c: Math.random() };
    }

    /* state */
    let W, H, D, ry = 0, rx = .3, tx = 0, ty = 0, vis = true, energy = .2, burst = 0, pal = 0, t0 = performance.now(), last = t0;
    function size() { D = Math.min(devicePixelRatio || 1, 1.35); W = cv.width = Math.max(1, cv.clientWidth * D); H = cv.height = Math.max(1, cv.clientHeight * D); if (reduced) draw(2.4); }
    addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });

    /* react to the typed voice demo in the hero: typing = listening, reply = burst */
    const demo = $('.hero-type');
    if (demo && 'MutationObserver' in window) {
      const q = $('q', demo), ok = $('em', demo);
      if (q) new MutationObserver(() => { energy = Math.min(1, energy + .2); }).observe(q, { childList: true, characterData: true, subtree: true });
      if (ok) new MutationObserver(() => { if (ok.classList.contains('on')) burst = 1; }).observe(ok, { attributes: true, attributeFilter: ['class'] });
    }

    function proj(x, y, z, ay, ax, R, cx, cy) {
      const cr = Math.cos(ay), sr = Math.sin(ay), c2 = Math.cos(ax), s2 = Math.sin(ax);
      const X = x * cr + z * sr; let Z = -x * sr + z * cr; const Y = y * c2 - Z * s2; Z = y * s2 + Z * c2;
      const f = 3 / (3 + Z);
      return { x: cx + X * R * f, y: cy + Y * R * f, z: Z, f };
    }

    function draw(t) {
      const cx = W * .5, cy = H * .5, e = energy, b = burst;
      const R = Math.min(W, H) * .24 * (1 + Math.sin(t * 2) * .015 + b * .04);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const nx = cx + tx * R * .12, ny = cy + ty * R * .12;

      /* 1. atmosphere */
      const ar = R * 2.3; ctx.drawImage(atm, nx - ar, ny - ar, ar * 2, ar * 2);
      if (b > .02) { ctx.globalAlpha = Math.min(1, b * .5); ctx.drawImage(atm, nx - ar, ny - ar, ar * 2, ar * 2); ctx.globalAlpha = 1; }

      /* 2. HUD ring: ticks, rotating segments, dashed inner ring */
      const hr = R * 2.02;
      ctx.lineWidth = 1 * D; ctx.strokeStyle = rgba(C1, .16); ctx.beginPath(); ctx.arc(cx, cy, hr, 0, TAU); ctx.stroke();
      const nt = mobile ? 72 : 120; ctx.strokeStyle = rgba(C1, .34); ctx.beginPath();
      for (let i = 0; i < nt; i++) {
        const a = i / nt * TAU + t * .04, len = (i % 10 === 0 ? 11 : i % 5 === 0 ? 6.5 : 3.5) * D;
        ctx.moveTo(cx + Math.cos(a) * (hr - len), cy + Math.sin(a) * (hr - len)); ctx.lineTo(cx + Math.cos(a) * hr, cy + Math.sin(a) * hr);
      }
      ctx.stroke();
      ctx.lineWidth = 2.4 * D; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const a = -t * .22 + i * TAU / 3; ctx.strokeStyle = rgba(i === 1 ? C3 : C1, .55); ctx.beginPath(); ctx.arc(cx, cy, hr + 9 * D, a, a + .5); ctx.stroke(); }
      ctx.lineCap = 'butt'; ctx.lineWidth = 1.2 * D; ctx.strokeStyle = rgba(C3, .3); ctx.setLineDash([2 * D, 11 * D]); ctx.lineDashOffset = -t * 14 * D;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.82, 0, TAU); ctx.stroke(); ctx.setLineDash([]);

      /* 3. voice waveform ring (energy follows the typed demo) */
      const nb = mobile ? 72 : 132; ctx.lineWidth = 2 * D; ctx.lineCap = 'round';
      for (let i = 0; i < nb; i++) {
        const a = i / nb * TAU + t * .08;
        const w = .35 + .65 * Math.abs(Math.sin(i * .37 + t * 3.1) * Math.sin(i * .11 - t * 2.2) + Math.sin(i * .83 + t * 4.3) * .35);
        const amp = (.03 + .2 * e + .32 * b) * R * w, r0 = R * 1.6;
        ctx.strokeStyle = rgba(mix(C1, C3, i / nb), .22 + .6 * Math.min(1, amp / (R * .3)));
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r0 - amp * .35), cy + Math.sin(a) * (r0 - amp * .35)); ctx.lineTo(cx + Math.cos(a) * (r0 + amp), cy + Math.sin(a) * (r0 + amp)); ctx.stroke();
      }
      ctx.lineCap = 'butt';

      /* shell: project once */
      const sp = shell.map(p => ({ p, q: proj(p.x, p.y, p.z, ry, rx, R, cx, cy) }));
      const scanY = Math.sin(t * .6);
      const dot = o => {
        const p = o.p, q = o.q, front = q.z < 0, rim = 1 - Math.min(1, Math.abs(q.z)), tw = .6 + .4 * Math.sin(t * 2.3 + p.s);
        const scan = Math.abs(p.y - scanY) < .06 ? 1 : 0;
        const a = (front ? .2 + .6 * Math.pow(rim, 1.4) : .08 + .2 * rim) * tw + scan * .6;
        const col = scan ? C1 : mix(C2, C1, front ? .35 + rim * .65 : .1);
        ctx.fillStyle = rgba(col, Math.min(1, a));
        ctx.beginPath(); ctx.arc(q.x, q.y, ((front ? 1.5 : 1) + rim * 1.1 + scan * 1.6 + (p.k > .96 ? 1.2 : 0)) * D * q.f, 0, TAU); ctx.fill();
      };

      /* 4. back half of shell + back arcs of the crystal */
      sp.forEach(o => { if (o.q.z >= 0) dot(o); });

      /* 5. plasma nucleus */
      const rn = R * .5 * (1 + Math.sin(t * 2.6) * .05 + b * .14 + e * .06);
      ctx.drawImage(nuc, nx - rn * 2.2, ny - rn * 2.2, rn * 4.4, rn * 4.4);
      const nr = mobile ? 5 : 9;
      for (let i = 0; i < nr; i++) {
        const a = t * .14 * (i % 2 ? -1 : 1) + i / nr * TAU, L = R * (.95 + .35 * Math.sin(t * 1.3 + i * 1.7) + b * .5);
        ctx.strokeStyle = rgba(C1, .09 + b * .1); ctx.lineWidth = (3 + (i % 3) * 1.6) * D; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + Math.cos(a) * L, ny + Math.sin(a) * L); ctx.stroke();
        ctx.strokeStyle = rgba(C1, .2 + b * .2); ctx.lineWidth = 1 * D; ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + Math.cos(a) * L * .7, ny + Math.sin(a) * L * .7); ctx.stroke();
      }

      /* 6. inner crystal (icosahedron) counter-rotating */
      const cy2 = -ry * 1.7 + .6, cx2 = rx * .6 + Math.sin(t * .3) * .3, Rc = R * .66;
      const pv = iv.map(v => proj(v[0], v[1], v[2], cy2, cx2, Rc, nx, ny));
      ctx.lineWidth = 1.3 * D;
      ie.forEach(([i, j]) => {
        const a = pv[i], c = pv[j], dep = (a.z + c.z) / 2, al = .22 + .5 * (1 - (dep + 1) / 2);
        ctx.strokeStyle = rgba(mix(C1, [255, 255, 255], .35), al); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke();
      });
      pv.forEach(p => { ctx.fillStyle = rgba([255, 255, 255], .5 + .4 * (1 - (p.z + 1) / 2)); ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 * D * p.f, 0, TAU); ctx.fill(); });

      /* 7. front half of shell (glassy rim glow) */
      sp.forEach(o => { if (o.q.z < 0) dot(o); });

      /* 8. energy arcs travelling across the surface */
      arcs.forEach(A => {
        const pts = [], seg = 26;
        for (let i = 0; i <= seg; i++) {
          const u = i / seg, s1 = Math.sin((1 - u) * A.d) / Math.sin(A.d), s2 = Math.sin(u * A.d) / Math.sin(A.d);
          let x = A.a.x * s1 + A.b.x * s2, y = A.a.y * s1 + A.b.y * s2, z = A.a.z * s1 + A.b.z * s2; const lift = 1 + .2 * Math.sin(Math.PI * u);
          pts.push(proj(x * lift, y * lift, z * lift, ry, rx, R, cx, cy));
        }
        ctx.lineWidth = 1 * D; ctx.strokeStyle = rgba(C1, .14); ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke();
        const h = Math.min(seg, A.t * seg | 0);
        for (let j = 0; j < 8; j++) { const k = h - j; if (k < 0) break; const q = pts[k]; ctx.fillStyle = rgba(mix(C1, C3, A.c), (1 - j / 8) * .9); ctx.beginPath(); ctx.arc(q.x, q.y, (3.2 - j * .3) * D * q.f, 0, TAU); ctx.fill(); }
      });

      /* 9. orbital rings with comet trails */
      rings.forEach(rg => {
        const ct = Math.cos(rg.tilt), st = Math.sin(rg.tilt), RR = 1.36, col = rg.k === 1 ? C3 : rg.k === 2 ? C2 : C1;
        const at = a => proj(Math.cos(a) * RR, Math.sin(a) * RR * st, Math.sin(a) * RR * ct, ry * .6, rx, R, cx, cy);
        ctx.lineWidth = 1.1 * D; ctx.strokeStyle = rgba(col, .3); ctx.beginPath();
        for (let i = 0; i <= 96; i++) { const q = at(i / 96 * TAU); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }
        ctx.stroke();
        for (let m = 0; m < 2; m++) {
          const a0 = t * rg.spd + rg.k * 2 + m * Math.PI, dir = Math.sign(rg.spd);
          for (let j = 0; j < 20; j++) { const q = at(a0 - dir * j * .055); ctx.fillStyle = rgba(col, (1 - j / 20) * .85); ctx.beginPath(); ctx.arc(q.x, q.y, (3.8 - j * .15) * D * q.f, 0, TAU); ctx.fill(); }
          const q = at(a0); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(q.x, q.y, 2 * D * q.f, 0, TAU); ctx.fill();
        }
      });

      /* 10. floating sparks */
      sparks.forEach(s => {
        const a = s.a + t * s.v * .3, q = proj(Math.cos(a) * Math.sin(s.b) * s.R, Math.cos(s.b) * s.R * .85, Math.sin(a) * Math.sin(s.b) * s.R, ry * .5, rx, R, cx, cy);
        ctx.fillStyle = rgba([200, 238, 255], .2 + .55 * Math.abs(Math.sin(t * 1.6 + s.s))); ctx.beginPath(); ctx.arc(q.x, q.y, 1.5 * D * q.f, 0, TAU); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    function frame(now) {
      if (!vis) return;
      const dt = Math.min(.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
      ry += (.0042 + tx * .005) * dt * 60; rx += ((.3 + ty * .7) - rx) * .04;
      energy += (.2 - energy) * Math.min(1, dt * 1.4); burst = Math.max(0, burst - dt * .9);
      arcs.forEach((A, i) => { A.t += A.v * dt; if (A.t > 1.15) arcs[i] = newArc(0); });
      if ((pal++ % 90) === 0) { readPalette(); buildSprites(); }
      draw(t); requestAnimationFrame(frame);
    }
    readPalette(); buildSprites(); size(); addEventListener('resize', size);
    if (reduced) return;
    new IntersectionObserver(es => { const was = vis; vis = es[0].isIntersecting; if (vis && !was) { last = performance.now(); requestAnimationFrame(frame); } }).observe(cv);
    requestAnimationFrame(frame);
  })();

  /* ---------- pinned, scroll-driven "How it works" ---------- */
  (function pinned() {
    const sec = $('#architecture'); if (!sec || reduced) return;
    const flow = $('.flow', sec), container = $('.container', sec); if (!flow) return;
    const nodes = $$('.flow-node', flow), arrows = $$('.flow-arrow', flow);
    const hud = document.createElement('div'); hud.className = 'pin-hud';
    hud.innerHTML = '<div class="pin-bar"><b></b></div><p class="pin-cap" aria-live="polite"></p><p class="pin-hint">Keep scrolling</p>';
    container.appendChild(hud);
    const cap = $('.pin-cap', hud), hint = $('.pin-hint', hud);
    const caps = [
      '<strong>You speak, type or gesture.</strong> ASTRON picks up your wake word, keyboard input, camera and hand signals.',
      '<strong>The local brain decides.</strong> Your model works out intent, checks memory and routes the command, all on your machine.',
      '<strong>It acts.</strong> Apps open, notes save, the browser moves, and the result is spoken back to you.'
    ];
    let on = false, cur = -1;
    const mq = matchMedia('(min-width:901px)');
    function apply() {
      on = mq.matches; sec.classList.toggle('pin', on);
      if (!on) nodes.forEach(n => n.classList.remove('live', 'dim'));
      cur = -1; update();
    }
    function update() {
      if (!on) return;
      const r = sec.getBoundingClientRect(), total = r.height - innerHeight;
      const p = Math.min(Math.max(-r.top / total, 0), 1);
      hud.style.setProperty('--pp', p.toFixed(3));
      const step = p < .34 ? 0 : p < .67 ? 1 : 2;
      if (step !== cur) {
        cur = step;
        nodes.forEach((n, i) => { n.classList.toggle('live', i === step); n.classList.toggle('dim', i !== step); });
        arrows.forEach((a, i) => a.classList.toggle('lit', i < step));
        cap.style.opacity = 0; setTimeout(() => { cap.innerHTML = caps[step]; cap.style.opacity = 1; }, 160);
        hint.style.opacity = step === 2 ? 0 : 1;
      }
    }
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    let t = false;
    addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(() => { update(); t = false; }); } }, { passive: true });
    addEventListener('resize', update);
    // nodes are .reveal: make sure the pinned ones are visible straight away
    nodes.forEach(n => n.classList.add('visible'));
    apply();
  })();
})();
