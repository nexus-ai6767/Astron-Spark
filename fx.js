/* ASTRON — motion & polish layer. Pure vanilla JS, no dependencies. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const root = document.documentElement;

  /* ---------- 1. boot sequence (once per session) ---------- */
  let seen = false;
  try { seen = sessionStorage.getItem('astron-boot') === '1'; } catch (e) {}
  let bootDelay = 0;
  if (!reduced && !seen && $('.hero') && (window.ASTRON_SITE || {}).bootScreen === true) {   // opt-in: set bootScreen: true in site-config.js
    const b = document.createElement('div');
    b.id = 'fx-boot'; b.setAttribute('aria-hidden', 'true');
    b.innerHTML = '<div class="boot-core"><i></i><i></i><i></i><b></b></div><div class="boot-word">ASTRON</div><div class="boot-line"></div><div class="boot-status">INITIALISING CORE</div>';
    document.body.appendChild(b);
    const st = $('.boot-status', b);
    const msgs = ['LOADING VOICE MODULE', 'LINKING LOCAL AI', 'SYSTEM ONLINE'];
    msgs.forEach((m, i) => setTimeout(() => { st.textContent = m; }, 180 + i * 230));
    bootDelay = 1.0;
    setTimeout(() => b.classList.add('done'), 900);
    setTimeout(() => b.remove(), 1700);
    b.addEventListener('click', () => { b.classList.add('done'); });
    try { sessionStorage.setItem('astron-boot', '1'); } catch (e) {}
  }
  root.style.setProperty('--boot-delay', bootDelay + 's');

  /* ---------- 2. hero headline: word-by-word entrance ---------- */
  (function splitHero() {
    const h1 = $('.hero h1'); if (!h1 || reduced) return;
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--wi', i++); s.textContent = p; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          // keep the gradient span intact but animate it as one word group
          if (n.classList.contains('grad')) { n.classList.add('w'); n.style.setProperty('--wi', i++); }
          else walk(n);
        }
      });
    };
    walk(h1);
  })();

  /* ---------- 3. interactive neural background ---------- */
  (function neural() {
    const host = $('.bg-fx'); if (!host || reduced) return;
    const cv = document.createElement('canvas'); cv.id = 'neural'; host.appendChild(cv);
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let w, h, dpr, pts = [], mx = -999, my = -999, running = true;
    const mobile = innerWidth < 700;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 1.6);
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
      const n = Math.min(mobile ? 38 : 80, Math.round(innerWidth * innerHeight / 16000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35 * dpr, vy: (Math.random() - .5) * .35 * dpr }));
    }
    size();
    addEventListener('resize', size);
    addEventListener('pointermove', e => { mx = e.clientX * dpr; my = e.clientY * dpr; }, { passive: true });
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) loop(); });
    const maxD = 150 * (mobile ? 1 : 1.1);
    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const D = maxD * dpr;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dm = Math.hypot(p.x - mx, p.y - my);
        if (dm < D * 1.4) { p.x += (p.x - mx) / dm * .5; p.y += (p.y - my) / dm * .5; }
        ctx.fillStyle = dm < D * 1.4 ? 'rgba(79,209,255,.95)' : 'rgba(120,170,255,.55)';
        ctx.beginPath(); ctx.arc(p.x, p.y, (dm < D * 1.4 ? 2.2 : 1.4) * dpr, 0, 6.283); ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < D) {
            const near = Math.hypot((p.x + q.x) / 2 - mx, (p.y + q.y) / 2 - my) < D * 1.6;
            ctx.strokeStyle = near ? 'rgba(79,209,255,' + (1 - d / D) * .55 + ')' : 'rgba(90,140,255,' + (1 - d / D) * .16 + ')';
            ctx.lineWidth = near ? 1.1 * dpr : .7 * dpr;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
  })();

  /* ---------- 4. cursor glow + dot ---------- */
  if (fine && !reduced) {
    const glow = document.createElement('div'); glow.className = 'fx-cursor';
    const dot = document.createElement('div'); dot.className = 'fx-cursor-dot';
    document.body.append(glow, dot);
    let tx = innerWidth / 2, ty = innerHeight / 2, gx = tx, gy = ty;
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; root.classList.add('fx-on');
      dot.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
    }, { passive: true });
    document.addEventListener('pointerleave', () => root.classList.remove('fx-on'));
    (function tick() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px)'; requestAnimationFrame(tick); })();
    document.addEventListener('pointerover', e => dot.classList.toggle('hot', !!e.target.closest('a,button,input,textarea,.card,.price-card,[role=tab]')));
  }

  /* ---------- 5. nav sliding pill ---------- */
  (function pill() {
    const nl = $('.navlinks'); if (!nl) return;
    const p = document.createElement('i'); p.className = 'nav-pill'; nl.prepend(p);
    const place = a => {
      if (!a) { p.style.opacity = 0; return; }
      p.style.opacity = 1; p.style.width = a.offsetWidth + 'px'; p.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    };
    const cur = () => $('.navlinks a.active', nl);
    $$('a', nl).forEach(a => { a.addEventListener('pointerenter', () => place(a)); });
    nl.addEventListener('pointerleave', () => place(cur()));
    new MutationObserver(() => place(cur())).observe(nl, { attributes: true, subtree: true, attributeFilter: ['class'] });
    addEventListener('resize', () => place(cur()));
    setTimeout(() => place(cur()), 300);
  })();

  /* ---------- 6. hero: parallax tilt of robot + typed voice commands ---------- */
  (function hero() {
    const art = $('.hero-art'), hero = $('.hero');
    if (art && hero && fine && !reduced) {
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        art.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
        art.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
        art.style.setProperty('--px', (x * 18).toFixed(1) + 'px');
        art.style.setProperty('--py', (y * 12).toFixed(1) + 'px');
      });
      hero.addEventListener('pointerleave', () => ['--ry', '--rx', '--px', '--py'].forEach(k => art.style.removeProperty(k)));
    }
    const copy = $('.hero-copy'), actions = $('.hero-actions');
    if (copy && actions && !$('.hero-type')) {
      const box = document.createElement('div'); box.className = 'hero-type'; box.setAttribute('aria-hidden', 'true');
      box.innerHTML = '<span class="mic"><svg viewBox="0 0 24 24"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/></svg></span><q></q><em></em>';
      copy.appendChild(box);
      const q = $('q', box), ok = $('em', box);
      const lines = [['Hey Astron, open YouTube', '✓ app launched'], ['Take a note: call the vendor at five', '✓ note saved'], ['What’s my system status?', '✓ all modules ready'], ['Remember I prefer dark mode', '✓ stored locally'], ['Enable hand gestures', '✓ camera tracking on']];
      let li = 0;
      const wait = ms => new Promise(r => setTimeout(r, ms));
      (async function run() {
        if (reduced) { q.textContent = lines[0][0]; return; }
        await wait(bootDelay * 1000 + 1200);
        for (;;) {
          const [t, r] = lines[li++ % lines.length];
          ok.classList.remove('on'); ok.textContent = r;
          for (let i = 1; i <= t.length; i++) { q.textContent = t.slice(0, i); await wait(38 + Math.random() * 40); }
          await wait(350); ok.classList.add('on'); await wait(2200);
          for (let i = t.length; i >= 0; i -= 2) { q.textContent = t.slice(0, Math.max(i, 0)); await wait(14); }
          await wait(250);
        }
      })();
    }
    const h = $('.hero');
    if (h && !$('.scroll-cue')) { const c = document.createElement('div'); c.className = 'scroll-cue'; c.setAttribute('aria-hidden', 'true'); h.appendChild(c); }
  })();

  /* ---------- 7. marquee between hero and showcase ---------- */
  (function marquee() {
    const sc = $('#showcase'); if (!sc) return;
    const words = ['Voice-first', 'Local AI', 'Computer vision', 'Gesture control', 'Persistent memory', 'Automation', 'Private by design', 'Windows & Android', 'Ollama ready', 'Hindi & English'];
    const m = document.createElement('div'); m.className = 'marquee'; m.setAttribute('aria-hidden', 'true');
    const set = words.map(w => '<span>' + w + '</span>').join('');
    m.innerHTML = '<div class="marquee-track">' + set + set + '</div>';
    sc.parentNode.insertBefore(m, sc);
  })();

  /* ---------- 8. tilt on cards / pricing / flow ---------- */
  if (fine && !reduced) {
    $$('.card, .price-card, .flow-node').forEach(el => {
      let raf = 0;
      el.addEventListener('pointermove', e => {
        if (!el.classList.contains('visible')) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          el.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
          el.style.setProperty('--rx', (-y * 9).toFixed(2) + 'deg');
          el.classList.add('tilting');
        });
      });
      el.addEventListener('pointerleave', () => { cancelAnimationFrame(raf); el.classList.remove('tilting'); });
    });
    // showcase laptop follows the pointer
    const stage = $('.stage');
    if (stage) {
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        stage.style.setProperty('--sry', (-6 + x * 12).toFixed(2) + 'deg');
        stage.style.setProperty('--srx', (2 - y * 8).toFixed(2) + 'deg');
      });
      stage.addEventListener('pointerleave', () => { stage.style.removeProperty('--sry'); stage.style.removeProperty('--srx'); });
    }
  }

  /* ---------- 9. magnetic buttons + ripple ---------- */
  $$('.btn').forEach(b => {
    if (fine && !reduced && (b.classList.contains('btn-lg') || b.classList.contains('nav-cta'))) {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    }
    b.addEventListener('click', e => {
      if (reduced) return;
      const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height);
      const rp = document.createElement('span'); rp.className = 'ripple';
      rp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.style.overflow = 'hidden'; b.appendChild(rp); setTimeout(() => rp.remove(), 650);
    });
  });

  /* ---------- 10. count-up on any numeric text in the stat strip / prices ---------- */
  (function counters() {
    if (reduced || !('IntersectionObserver' in window)) return;
    $$('.price').forEach(el => {
      const m = el.firstChild && el.firstChild.nodeType === 3 && el.firstChild.textContent.match(/₹\s*(\d+)/);
      if (!m) return;
      const target = +m[1]; if (target < 10) return;
      const node = el.firstChild, tail = node.textContent.replace(m[0], '');
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return; io.disconnect();
        const t0 = performance.now(), dur = 1300;
        (function step(t) {
          const k = Math.min((t - t0) / dur, 1), v = Math.round(target * (1 - Math.pow(1 - k, 3)));
          node.textContent = '₹' + v + tail; if (k < 1) requestAnimationFrame(step);
        })(t0);
      }), { threshold: .6 });
      io.observe(el);
    });
  })();

  /* ---------- 11. wave bars get individual rhythm ---------- */
  $$('.wave i').forEach((b, i) => b.style.setProperty('--k', i % 7));

  /* ---------- 12. background parallax on scroll ---------- */
  (function par() {
    if (reduced) return;
    const a1 = $('.a1'), a2 = $('.a2'), art = $('.hero-art');
    let t = false;
    addEventListener('scroll', () => {
      if (t) return; t = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        if (a1) a1.style.transform = 'translate3d(0,' + (y * -.12).toFixed(1) + 'px,0)';
        if (a2) a2.style.transform = 'translate3d(0,' + (y * .1).toFixed(1) + 'px,0)';
        if (art && y < innerHeight * 1.2) art.style.translate = '0 ' + (y * .12).toFixed(1) + 'px';
        t = false;
      });
    }, { passive: true });
  })();

  /* ---------- 13. back-to-top with progress ring ---------- */
  (function top() {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'to-top'; b.setAttribute('aria-label', 'Back to top');
    b.innerHTML = '<svg class="ring" viewBox="0 0 46 46"><circle cx="23" cy="23" r="21"/></svg><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    document.body.appendChild(b);
    b.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
    let t = false;
    const upd = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      b.style.setProperty('--sp', max > 0 ? (scrollY / max).toFixed(3) : 0);
      b.classList.toggle('show', scrollY > 700); t = false;
    };
    addEventListener('scroll', () => { if (!t) { t = true; requestAnimationFrame(upd); } }, { passive: true });
  })();
})();
