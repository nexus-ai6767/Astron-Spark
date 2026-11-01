/* ASTRON — site behaviour (no dependencies) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OWNER_EMAIL = 'jyotipatil9476@gmail.com';

  /* ---------- footer year ---------- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- scroll: progress bar, nav state, active link ---------- */
  const bar = $('#scroll-progress'), nav = $('#nav');
  const links = $$('.navlinks a');
  const targets = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  let ticking = false;
  function onScroll() {
    const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    if (nav) nav.classList.toggle('scrolled', y > 24);
    let cur = '';
    targets.forEach(s => { if (s.getBoundingClientRect().top <= innerHeight * 0.35) cur = '#' + s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === cur));
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- mobile navigation ---------- */
  const toggle = $('.nav-toggle'), panel = $('#mobile-nav');
  function setMenu(open) {
    if (!toggle || !panel) return;
    panel.hidden = !open;
    nav.classList.toggle('menu-open', open);
    document.body.classList.toggle('mobile-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  }
  if (toggle) toggle.addEventListener('click', () => setMenu(panel.hidden));
  if (panel) panel.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  addEventListener('resize', () => { if (innerWidth > 900) setMenu(false); });

  /* ---------- scroll reveal (with stagger) ---------- */
  $$('[data-stagger]').forEach(g => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', (i * 0.08) + 's')));
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else revealEls.forEach(el => el.classList.add('visible'));

  /* ---------- card spotlight ---------- */
  $$('.spot').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- starfield ---------- */
  (function stars() {
    const cv = $('#stars'); if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    let w, h, dpr, list = [];
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.width = innerWidth * dpr; h = cv.height = innerHeight * dpr;
      const n = Math.round((innerWidth * innerHeight) / 9000);
      list = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.2 + 0.25) * dpr,
        a: Math.random() * 0.7 + 0.2, s: Math.random() * 0.02 + 0.004, p: Math.random() * 6.28
      }));
    }
    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      for (const s of list) {
        const a = reduced ? s.a : s.a * (0.6 + 0.4 * Math.sin(t * s.s + s.p));
        ctx.fillStyle = 'rgba(190,215,255,' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      if (!reduced) requestAnimationFrame(draw);
    }
    size(); requestAnimationFrame(draw);
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); if (reduced) draw(0); }, 200); });
  })();


  /* ---------- interface screenshot viewer ---------- */
  (function viewer() {
    const root = $('#viewer'); if (!root) return;
    const shots = [
      { src: 'astron-hud.webp', w: 1600, h: 826, title: 'ASTRON — operator core',
        alt: 'ASTRON operator core: orb, voice and vision controls, system status and resource telemetry',
        points: [['Talk or type', 'Voice and vision controls on the left, a command bar at the bottom.'], ['Live status', 'Core AI, voice, vision, Ollama and mission mode at a glance.'], ['Real telemetry', 'CPU and RAM load history sampled from your own machine.']] },
      { src: 'astron-neural-web.webp', w: 1600, h: 900, title: 'ASTRON — neural web',
        alt: 'ASTRON neural web: a read-only 3D knowledge graph of 126 nodes with search and gesture controls',
        points: [['Explore your knowledge', 'A 3D graph of your local data — search, filter and re-scan on demand.'], ['Read-only by design', 'The index is for browsing; nothing is changed or sent anywhere.'], ['Hands-free navigation', 'Optional gestures: move to pan, spread thumb and index to zoom.']] }
    ];
    const tabs = $$('.viewer-tabs button', root), img = $('#shotImg'), title = $('#shotTitle'), list = $('#shotPoints');
    let cur = 0;
    function show(i) {
      if (i === cur) return; cur = i; const s = shots[i];
      tabs.forEach((t, k) => t.setAttribute('aria-selected', String(k === i)));
      img.classList.add('swap');
      setTimeout(() => { img.src = s.src; img.alt = s.alt; img.width = s.w; img.height = s.h; title.textContent = s.title; img.classList.remove('swap'); }, 180);
      list.innerHTML = s.points.map(p => '<li><b>' + p[0] + '</b>' + p[1] + '</li>').join('');
    }
    tabs.forEach((t, i) => t.addEventListener('click', () => show(i)));
    const lb = $('#lightbox'), lbImg = $('#lightboxImg');
    function open() { lbImg.src = img.src; lbImg.alt = img.alt; lb.hidden = false; document.body.style.overflow = 'hidden'; }
    function close() { lb.hidden = true; document.body.style.overflow = ''; }
    $('#shotOpen').addEventListener('click', open);
    lb.addEventListener('click', close);
    addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) close(); });
  })();

  /* ---------- translation helper (i18n.js replaces this when loaded) ---------- */
  const T = (k, v) => (window.ASTRON_T ? window.ASTRON_T(k, v) : String(k).replace(/\{(\w+)\}/g, (_, n) => (v && v[n] != null ? v[n] : '')));
  const SITE = window.ASTRON_SITE || {};

  /* ---------- sound (WebAudio, nothing to download) ---------- */
  const Sound = (function () {
    let ctx = null, on = true;
    try { on = localStorage.getItem('astron-sound') !== 'off'; } catch (_) {}
    function get() {
      if (!ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (_) { return null; } }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    function tone(freq, start, dur, gain, type) {
      const c = get(); if (!c || !on) return;
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + start;
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    return {
      get on() { return on; },
      set(v) { on = v; try { localStorage.setItem('astron-sound', v ? 'on' : 'off'); } catch (_) {} },
      unlock() { get(); },
      tick() { tone(1500 + Math.random() * 500, 0, 0.03, 0.018, 'square'); },
      step() { tone(520, 0, 0.09, 0.05, 'triangle'); },
      chime() { tone(660, 0, 0.16, 0.06, 'sine'); tone(880, 0.1, 0.18, 0.06, 'sine'); tone(1320, 0.2, 0.3, 0.05, 'sine'); },
      error() { tone(220, 0, 0.18, 0.07, 'sawtooth'); tone(165, 0.14, 0.26, 0.07, 'sawtooth'); }
    };
  })();

  /* ---------- command lab (simulation only, typed responses + sound) ---------- */
  (function commandLab() {
    const input = $('#commandLabInput'), run = $('#commandLabRun'), lab = $('.command-lab'), out = $('#commandLabOutput');
    const sr = $('#commandLabSr'), snd = $('#soundToggle');
    const nodes = $$('#commandPipeline .pipeline-node');
    if (!input || !run || !lab || !out || nodes.length !== 4) return;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    function syncSnd() {
      if (!snd) return;
      snd.setAttribute('aria-pressed', String(Sound.on));
      const l = snd.querySelector('span'); if (l) l.textContent = T(Sound.on ? 'Sound on' : 'Sound off');
    }
    if (snd) snd.addEventListener('click', () => { Sound.set(!Sound.on); syncSnd(); if (Sound.on) { Sound.unlock(); Sound.step(); } });
    syncSnd();
    document.addEventListener('astron:lang', syncSnd);

    function setNode(i, status) {
      nodes.forEach((n, k) => {
        n.classList.toggle('active', k === i);
        const s = n.querySelector('small'); if (s) s.textContent = T(k === i ? status : (k < i ? 'COMPLETE' : 'STANDBY'));
      });
    }

    const t0 = { v: 0 };
    const stamp = () => '[' + ((performance.now() - t0.v) / 1000).toFixed(2) + 's]';
    function addLine(cls) {
      const d = document.createElement('div'); d.className = 'log-line' + (cls ? ' ' + cls : '');
      out.appendChild(d); out.scrollTop = out.scrollHeight; return d;
    }
    async function type(el, text, speed, withSound) {
      if (reduced) { el.textContent = text; return; }
      el.classList.add('type-cursor');
      let n = 0;
      for (const ch of text) {
        el.textContent += ch; n++;
        if (withSound && n % 3 === 0 && ch.trim()) Sound.tick();
        out.scrollTop = out.scrollHeight;
        await sleep(speed + (ch === ' ' ? 4 : 0) + (/[.,—]/.test(ch) ? 90 : 0));
      }
      el.classList.remove('type-cursor');
    }
    async function logLine(text, cls, speed, withSound) {
      const d = addLine(cls);
      const ts = document.createElement('span'); ts.className = 'ts'; ts.textContent = stamp(); d.appendChild(ts);
      const body = document.createElement('span'); d.appendChild(body);
      await type(body, text, speed == null ? 12 : speed, withSound);
      return d;
    }

    const clean = s => s.replace(/\s+/g, ' ').trim();
    function intent(raw) {
      const c = clean(raw), x = c.toLowerCase();
      let m;
      if (/\b(time|samay)\b/.test(x)) return { id: 'time', action: 'Reading the system clock', reply: T('It is {t}.', { t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }) };
      if (/\b(date|day|today)\b/.test(x)) return { id: 'date', action: 'Reading the system clock', reply: T('Today is {d}.', { d: new Date().toLocaleDateString(document.documentElement.lang === 'hi' ? 'hi-IN' : undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }) };
      if (x.includes('youtube')) return { id: 'open', action: 'Launching browser → youtube.com', reply: T('Opening YouTube.') };
      if ((m = x.match(/(?:search|google|look up|find)(?: the web)?(?: for)? (.+)/))) { const q = clean(c.slice(c.toLowerCase().indexOf(m[1]))); return { id: 'search', action: 'Building a search query', reply: T('Searching the web for “{q}”.', { q }) }; }
      if (/\bnote\b/.test(x)) return { id: 'note', action: 'Creating a new note', reply: T('Note created. What would you like to write?') };
      if (/\b(remember|memory)\b/.test(x)) return { id: 'memory', action: 'Writing to persistent memory', reply: T('Saved to memory. I will remember this next session.') };
      if (/\b(status|health|systems?)\b/.test(x)) return { id: 'status', action: 'Polling modules', reply: T('Voice, vision, memory and local AI all report ready.') };
      if (/\bgestures?\b/.test(x)) return { id: 'gesture', action: 'Starting camera + hand tracking', reply: T('Gesture control enabled. Move your hand to steer the cursor.') };
      if (/\b(hello|hi|hey|namaste)\b/.test(x)) return { id: 'hello', action: 'Wake word matched', reply: T('Hello. ASTRON is online and listening.') };
      if (/\b(help|what can you do)\b/.test(x)) return { id: 'help', action: 'Listing capabilities', reply: T('I can open apps, search the web, take notes, remember things and control your PC by voice or gesture.') };
      if ((m = x.match(/^open (.+)/))) return { id: 'open', action: 'Launching ' + clean(m[1]), reply: T('Opening {app}.', { app: clean(c.slice(5)) }) };
      return { id: 'unknown', action: 'Asking the local model', reply: T('Understood. Passing “{c}” to the local model for a reply.', { c: c.length > 60 ? c.slice(0, 57) + '…' : c }) };
    }

    let busy = false;
    async function exec(raw) {
      const cmd = clean(raw || ''); if (!cmd || busy) return;
      busy = true; lab.classList.add('running'); run.disabled = true; input.value = cmd;
      Sound.unlock(); t0.v = performance.now();
      out.textContent = ''; if (sr) sr.textContent = '';
      const it = intent(cmd);
      try {
        const head = addLine('head'); head.textContent = 'ASTRON // ' + T('PROCESSING');
        setNode(0, 'RECEIVED'); Sound.step();
        await logLine(T('input') + '  › ' + cmd, 'dim', 8, false); await sleep(reduced ? 0 : 220);
        setNode(1, 'ANALYSING'); Sound.step();
        await logLine(T('intent') + '  › ' + it.id.toUpperCase() + '  (' + T('confidence') + ' ' + (0.88 + (cmd.length % 9) / 100).toFixed(2) + ')', '', 10, true); await sleep(reduced ? 0 : 260);
        setNode(2, 'EXECUTING'); Sound.step();
        await logLine(T('action') + '  › ' + T(it.action), '', 10, true); await sleep(reduced ? 0 : 320);
        setNode(3, 'COMPLETE');
        await logLine(T('status') + '  › OK', 'ok', 14, false);
        const rep = addLine('reply'); await type(rep, it.reply, 22, true);
        Sound.chime();
        if (sr) sr.textContent = it.reply;
      } catch (e) { Sound.error(); console.error(e); }
      lab.classList.remove('running'); run.disabled = false; busy = false;
    }
    run.addEventListener('click', () => exec(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') exec(input.value); });
    $$('.command-presets button[data-command]').forEach(b => b.addEventListener('click', () => exec(b.dataset.command)));
  })();

  /* ---------- live proof: GitHub stars + Android downloads (hidden if unavailable) ---------- */
  (function proof() {
    const repo = SITE.repo; if (!repo || !window.fetch) return;
    const stars = $('#proofStars'), dl = $('#proofDl'); if (!stars && !dl) return;
    const fmt = n => n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n);
    function apply(d) {
      if (stars && d.stars > 0) { $('b', stars).textContent = fmt(d.stars); stars.hidden = false; }
      if (dl && d.downloads > 0) { $('b', dl).textContent = fmt(d.downloads); dl.hidden = false; }
    }
    try { const c = JSON.parse(sessionStorage.getItem('astron-proof') || 'null'); if (c && Date.now() - c.t < 600000) { apply(c.d); return; } } catch (_) {}
    Promise.all([
      fetch('https://api.github.com/repos/' + repo).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.github.com/repos/' + repo + '/releases').then(r => r.ok ? r.json() : null).catch(() => null)
    ]).then(([r, rel]) => {
      const d = { stars: r && r.stargazers_count || 0, downloads: 0 };
      if (Array.isArray(rel)) rel.forEach(x => (x.assets || []).forEach(a => { if (/\.apk$/i.test(a.name)) d.downloads += a.download_count || 0; }));
      try { sessionStorage.setItem('astron-proof', JSON.stringify({ t: Date.now(), d })); } catch (_) {}
      apply(d);
    });
  })();

  /* ---------- copy SHA-256 ---------- */
  $$('[data-copy-sha]').forEach(b => b.addEventListener('click', async () => {
    const code = b.parentElement.querySelector('[data-sha]'); if (!code) return;
    const label = b.textContent;
    try { await navigator.clipboard.writeText(code.textContent.trim()); b.textContent = T('Copied ✓'); }
    catch (_) { const r = document.createRange(); r.selectNodeContents(code); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = T('Press Ctrl+C'); }
    setTimeout(() => (b.textContent = label), 1800);
  }));

  /* ---------- android screenshots (swap concept mockups for real images) ---------- */
  (function phones() {
    const shots = SITE.androidScreens; if (!Array.isArray(shots) || !shots.length) return;
    $$('.aphone .screen[data-screen]').forEach((sc, i) => {
      if (!shots[i]) return;
      const img = new Image(); img.src = shots[i]; img.alt = 'ASTRON Android app screen ' + (i + 1); img.loading = 'lazy'; img.decoding = 'async';
      sc.textContent = ''; sc.appendChild(img);
      sc.closest('.aphone').removeAttribute('aria-hidden');
    });
    const cap = $('#phonesCap'); if (cap) cap.textContent = T('Screens from the ASTRON Android app.');
  })();

  /* ---------- real testimonials (section stays hidden until some exist) ---------- */
  (function voices() {
    const list = SITE.testimonials, sec = $('#voices'), grid = $('#voicesGrid');
    if (!Array.isArray(list) || !list.length || !sec || !grid) return;
    list.slice(0, 6).forEach(t => {
      if (!t || !t.quote || !t.name) return;
      const f = document.createElement('figure'); f.className = 'card reveal visible'; f.style.margin = '0';
      const q = document.createElement('blockquote'); q.style.cssText = 'margin:0 0 16px;font-size:17px;line-height:1.6'; q.textContent = '“' + t.quote + '”';
      const c = document.createElement('figcaption'); c.style.cssText = 'color:var(--muted);font-size:14px'; c.textContent = t.name + (t.role ? ' · ' + t.role : '');
      f.append(q, c); grid.appendChild(f);
    });
    if (grid.children.length) sec.hidden = false;
  })();

  /* ---------- pre-flight compatibility check ---------- */
  (function preflight() {
    const btn = $('#compatRun'); if (!btn) return;
    const el = id => document.getElementById(id);
    const os = el('checkOs'), ram = el('checkRam'), mic = el('checkMic'), br = el('checkBrowser');
    const score = el('compatScore'), ring = el('scoreRing'), msg = el('compatMessage'), dbg = el('compatDebug');
    function check() {
      try {
        const ua = navigator.userAgent || '';
        const win = /Windows NT/i.test(ua);
        const cores = Number(navigator.hardwareConcurrency || 0);
        const mem = Number(navigator.deviceMemory || 0);
        const micApi = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        const secure = window.isSecureContext === true;
        const name = /Edg\//i.test(ua) ? 'Edge' : /Chrome\//i.test(ua) ? 'Chrome' : /Firefox\//i.test(ua) ? 'Firefox' : /Safari\//i.test(ua) ? 'Safari' : 'Browser';
        os.textContent = win ? 'Pass — Windows' : 'Info — non-Windows';
        ram.textContent = (cores ? 'Pass — ' + cores + ' CPU threads' : 'Info — CPU API limited') + (mem ? ' · ' + mem + ' GB hint' : '');
        mic.textContent = micApi ? (secure ? 'Pass — mic API available' : 'Info — HTTPS required') : 'Info — mic API unavailable';
        br.textContent = 'Pass — ' + name;
        const pts = (win ? 30 : 10) + (cores >= 4 ? 20 : cores ? 15 : 10) + (mem >= 4 ? 20 : mem ? 15 : 10) + (micApi && secure ? 20 : 10) + (name !== 'Browser' ? 10 : 5);
        const pct = Math.max(0, Math.min(100, pts));
        score.textContent = pct + '%'; ring.style.setProperty('--p', pct);
        msg.textContent = T('Pre-flight complete — browser readiness checked. ASTRON still needs the PC release dependencies and Ollama.');
        dbg.textContent = 'Last check ' + new Date().toLocaleTimeString();
      } catch (e) {
        score.textContent = '--'; msg.textContent = 'Check error — please try again.'; console.error(e);
      }
    }
    btn.addEventListener('click', check);
    check();
  })();

  /* ---------- copy UPI id ---------- */
  const copy = $('#copyUpi');
  if (copy) copy.addEventListener('click', async () => {
    const id = ($('#upiId') || {}).textContent || '';
    try { await navigator.clipboard.writeText(id.trim()); copy.textContent = 'Copied ✓'; }
    catch (_) { copy.textContent = 'Press Ctrl+C to copy'; const r = document.createRange(); r.selectNodeContents($('#upiId')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    setTimeout(() => (copy.textContent = 'Copy UPI ID'), 2000);
  });

  /* ---------- custom build form (opens email client) ---------- */
  const contact = $('#contactForm');
  if (contact) contact.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#name').value, email = $('#email').value, message = $('#message').value;
    const subject = encodeURIComponent('ASTRON Custom Build Request');
    const body = encodeURIComponent('Name: ' + name + '\n\nEmail: ' + email + '\n\nASTRON Requirements:\n' + message);
    location.href = 'mailto:' + OWNER_EMAIL + '?subject=' + subject + '&body=' + body;
  });

  /* ---------- manual payment client (talks to server.js /api) ---------- */
  (function payments() {
    const API = window.ASTRON_PAYMENT_API || '/api';
    const submit = $('#proPaymentForm'), statusForm = $('#proOrderStatusForm');
    async function request(path, data) {
      const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({ error: 'Unexpected server response' }));
      if (!r.ok) throw new Error(j.error || 'Request failed');
      return j;
    }
    const say = (el, m, s) => { el.textContent = m; el.dataset.state = s || ''; };
    if (submit) submit.addEventListener('submit', async e => {
      e.preventDefault();
      const b = submit.querySelector('button[type=submit]'), s = $('#proPaymentStatus'), f = new FormData(submit);
      b.disabled = true; say(s, 'Submitting securely…');
      try {
        const j = await request('/orders', { buyerName: f.get('buyerName'), email: f.get('email'), payerName: f.get('payerName'), utr: f.get('utr'), amountConfirmed: f.get('amountConfirmed') === 'on' });
        $('#proOrderId').value = j.orderId; $('#proStatusEmail').value = f.get('email');
        say(s, 'Submitted. Save order reference ' + j.orderId + '. Your download stays locked while payment is reviewed.', 'success');
      } catch (err) { say(s, err.message, 'error'); } finally { b.disabled = false; }
    });
    if (statusForm) statusForm.addEventListener('submit', async e => {
      e.preventDefault();
      const b = statusForm.querySelector('button[type=submit]'), s = $('#proOrderStatus'), f = new FormData(statusForm);
      b.disabled = true; say(s, 'Checking order…');
      const old = statusForm.querySelector('.dl-link'); if (old) old.remove();
      try {
        const j = await request('/orders/status', { orderId: f.get('orderId'), email: f.get('email') });
        if (j.status === 'approved' && j.downloadUrl) {
          say(s, 'Payment approved. Your secure download is ready.', 'success');
          const a = document.createElement('a'); a.href = j.downloadUrl; a.className = 'btn btn-primary dl-link'; a.textContent = 'Download ASTRON Pro (Windows ZIP)';
          s.insertAdjacentElement('afterend', a);
        } else if (j.status === 'rejected') say(s, 'This submission was not approved. Contact support with your order reference.', 'error');
        else say(s, 'Payment is awaiting manual verification. Download is still locked.');
      } catch (err) { say(s, err.message, 'error'); } finally { b.disabled = false; }
    });
  })();
})();
