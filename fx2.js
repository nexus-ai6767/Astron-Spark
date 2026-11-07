/* ASTRON — v2 effects: 3D neural core (canvas, no libraries) + pinned "How it works" */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- 3D particle core over the hero art ---------- */
  (function core() {
    const art = $('.hero-art'); if (!art || reduced) return;
    const cv = document.createElement('canvas'); cv.className = 'hero-core'; art.appendChild(cv);
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const mobile = innerWidth < 700, N = mobile ? 260 : 520;
    const pts = [];
    const ga = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {                       // fibonacci sphere
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, s: Math.random() * 6.28 });
    }
    const rings = [{ tilt: .35, spd: .9, c: '79,209,255' }, { tilt: 1.15, spd: -.7, c: '139,123,255' }, { tilt: 1.9, spd: .5, c: '90,162,255' }];
    let W, H, D, ry = 0, rx = .25, tx = 0, ty = 0, vis = true, t0 = performance.now();
    function size() { D = Math.min(devicePixelRatio || 1, 1.6); W = cv.width = cv.clientWidth * D; H = cv.height = cv.clientHeight * D; }
    size(); addEventListener('resize', size);
    addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5); ty = (e.clientY / innerHeight - .5); }, { passive: true });
    new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) frame(performance.now()); }).observe(cv);
    function proj(x, y, z, R, cx, cy) {
      const cr = Math.cos(ry), sr = Math.sin(ry), cx2 = Math.cos(rx), sx = Math.sin(rx);
      let X = x * cr + z * sr, Z = -x * sr + z * cr, Y = y * cx2 - Z * sx; Z = y * sx + Z * cx2;
      const f = 2.6 / (2.6 + Z);
      return { x: cx + X * R * f, y: cy + Y * R * f, z: Z, f };
    }
    function frame(now) {
      if (!vis) return;
      const t = (now - t0) / 1000;
      ry += .0035 + tx * .004; rx += ((.25 + ty * .6) - rx) * .04;
      const pulse = 1 + Math.sin(t * 2.1) * .018 + Math.max(0, Math.sin(t * .55)) * Math.max(0, Math.sin(t * 9)) * .03;
      ctx.clearRect(0, 0, W, H);
      const cx = W * .5, cy = H * .36, R = Math.min(W, H) * .27 * pulse;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
      g.addColorStop(0, 'rgba(79,209,255,.22)'); g.addColorStop(.5, 'rgba(47,123,255,.08)'); g.addColorStop(1, 'rgba(47,123,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sphere points
      for (const p of pts) {
        const q = proj(p.x, p.y, p.z, R, cx, cy), a = (.18 + .82 * (1 - (q.z + 1) / 2)) * (.65 + .35 * Math.sin(t * 2 + p.s));
        ctx.fillStyle = 'rgba(' + (q.z < 0 ? '130,225,255' : '90,150,255') + ',' + a.toFixed(3) + ')';
        const r = (q.z < 0 ? 1.9 : 1.2) * D * q.f;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.283); ctx.fill();
      }
      // orbit rings with travelling beads
      rings.forEach((rg, k) => {
        ctx.lineWidth = 1 * D; ctx.strokeStyle = 'rgba(' + rg.c + ',.28)'; ctx.beginPath();
        const ct = Math.cos(rg.tilt), st = Math.sin(rg.tilt), RR = 1.32;
        for (let i = 0; i <= 90; i++) {
          const a = i / 90 * 6.283, x = Math.cos(a) * RR, y0 = Math.sin(a) * RR;
          const q = proj(x, y0 * st, y0 * ct, R, cx, cy);
          i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
        }
        ctx.stroke();
        const a = t * rg.spd + k * 2, x = Math.cos(a) * 1.32, y0 = Math.sin(a) * 1.32;
        const b = proj(x, y0 * st, y0 * ct, R, cx, cy);
        ctx.fillStyle = 'rgb(' + rg.c + ')'; ctx.shadowColor = 'rgb(' + rg.c + ')'; ctx.shadowBlur = 16 * D;
        ctx.beginPath(); ctx.arc(b.x, b.y, 3.4 * D * b.f, 0, 6.283); ctx.fill(); ctx.shadowBlur = 0;
      });
      requestAnimationFrame(frame);
    }
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
