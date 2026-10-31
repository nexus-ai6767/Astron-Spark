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

  /* ---------- command lab (simulation only) ---------- */
  (function commandLab() {
    const input = $('#commandLabInput'), run = $('#commandLabRun'), lab = $('.command-lab'), out = $('#commandLabOutput');
    const nodes = $$('#commandPipeline .pipeline-node');
    if (!input || !run || !lab || !out || nodes.length !== 4) return;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const esc = v => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    function setNode(i, status) {
      nodes.forEach((n, k) => {
        n.classList.toggle('active', k === i);
        const s = n.querySelector('small'); if (s) s.textContent = k === i ? status : (k < i ? 'COMPLETE' : 'STANDBY');
      });
    }
    function reply(c) {
      const x = c.toLowerCase();
      if (x.includes('youtube')) return 'Opening YouTube…';
      if (x.includes('search')) return 'Web search intent ready.';
      if (x.includes('note')) return 'Note action queued.';
      if (x.includes('remember') || x.includes('memory')) return 'Memory update intent detected.';
      if (x.includes('status')) return 'All visible ASTRON systems report READY.';
      if (x.includes('gesture')) return 'Gesture control module enabled.';
      return 'Command understood. Action pipeline complete.';
    }
    let busy = false;
    async function exec(raw) {
      const cmd = (raw || '').trim(); if (!cmd || busy) return;
      busy = true; lab.classList.add('running'); run.disabled = true; input.value = cmd;
      out.innerHTML = 'ASTRON // PROCESSING<br><span>Command received: ' + esc(cmd) + '</span>';
      setNode(0, 'RECEIVED'); await sleep(420);
      setNode(1, 'ANALYSING'); out.innerHTML = 'ASTRON // BRAIN<br><span>Intent detected from command input.</span>'; await sleep(520);
      setNode(2, 'EXECUTING'); out.innerHTML = 'ASTRON // ACTION<br><span>Simulating the requested action pipeline…</span>'; await sleep(620);
      setNode(3, 'COMPLETE'); out.innerHTML = 'ASTRON // COMPLETE<br><span>' + esc(reply(cmd)) + '</span>';
      lab.classList.remove('running'); run.disabled = false; busy = false;
    }
    run.addEventListener('click', () => exec(input.value));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') exec(input.value); });
    $$('.command-presets button[data-command]').forEach(b => b.addEventListener('click', () => exec(b.dataset.command)));
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
        msg.textContent = 'Pre-flight complete — browser readiness checked. ASTRON still needs the PC release dependencies and Ollama.';
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
