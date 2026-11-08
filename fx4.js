/* ASTRON fx4 — comparison helper, sticky mobile bar, demo video. Vanilla JS. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SITE = window.ASTRON_SITE || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const os = document.documentElement.dataset.os || 'other';

  /* Android users: point the main "get" links at the Android section */
  if (os === 'android') {
    $$('.hero-actions a[href="#pricing"].btn-primary').forEach(a => { a.setAttribute('href', '#astron-android-download'); });
  }

  /* ---------- "Which should I pick?" ---------- */
  (function picker() {
    const root = $('#picker'); if (!root) return;
    const btns = $$('[data-pick]', root), cards = $$('[data-result]', root);
    const cols = $$('.cmp-table [data-col]');
    const cardFor = { core: 0, starter: 1, pro: 2 };
    const priceCards = $$('.pricing-grid .price-card');
    function pick(k) {
      btns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.pick === k)));
      cards.forEach(c => { c.hidden = c.dataset.result !== k; });
      cols.forEach(c => c.classList.toggle('hl', c.dataset.col === k));
      priceCards.forEach((c, i) => c.classList.toggle('picked', cardFor[k] === i));
    }
    btns.forEach(b => b.addEventListener('click', () => pick(b.dataset.pick)));
    // arrow-key navigation for the radio group
    root.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) return;
      const i = btns.indexOf(document.activeElement); if (i < 0) return;
      e.preventDefault();
      const n = btns[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : btns.length - 1)) % btns.length];
      n.focus(); n.click();
    });
    // sensible starting hint based on the device
    if (os === 'android') pick('android');
  })();

  /* ---------- sticky mobile "Get ASTRON" bar ---------- */
  (function getbar() {
    const bar = $('#getbar'); if (!bar) return;
    const btn = $('#getbarBtn'), x = $('.getbar-x', bar), hero = $('#top');
    if (os === 'android') btn.setAttribute('href', '#astron-android-download');
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('astron-getbar-x') === '1'; } catch (e) {}
    const mq = matchMedia('(max-width:760px)');
    let heroGone = false; const busy = new Set();
    function render() {
      const menu = document.body.classList.contains('mobile-menu-open');
      const panel = $('#astron-assistant-panel'), chat = panel && !panel.hidden;
      const on = mq.matches && !dismissed && heroGone && busy.size === 0 && !menu && !chat;
      bar.classList.toggle('show', on);
      document.body.classList.toggle('getbar-on', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      bar.inert = !on;
    }
    if ('IntersectionObserver' in window) {
      if (hero) new IntersectionObserver(es => { heroGone = !es[0].isIntersecting && es[0].boundingClientRect.bottom < 0; render(); }, { threshold: 0 }).observe(hero);
      ['pricing', 'downloads', 'astron-android-download', 'jarvis-pro-payment', 'download'].forEach(id => {
        const el = document.getElementById(id); if (!el) return;
        new IntersectionObserver(es => { es[0].isIntersecting ? busy.add(id) : busy.delete(id); render(); }, { rootMargin: '-20% 0px -20% 0px' }).observe(el);
      });
      const ft = $('footer'); if (ft) new IntersectionObserver(es => { es[0].isIntersecting ? busy.add('footer') : busy.delete('footer'); render(); }).observe(ft);
    }
    x.addEventListener('click', () => { dismissed = true; try { sessionStorage.setItem('astron-getbar-x', '1'); } catch (e) {} render(); });
    mq.addEventListener ? mq.addEventListener('change', render) : mq.addListener(render);
    new MutationObserver(render).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const panel = $('#astron-assistant-panel'); if (panel) new MutationObserver(render).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
    bar.inert = true; bar.setAttribute('aria-hidden', 'true');
    render();
  })();

  /* ---------- demo video: appears only when site-config.js has a real file ---------- */
  (function demo() {
    const cfg = SITE.demoVideo, sec = $('#demo'), frame = $('#demoFrame');
    if (!cfg || !(cfg.mp4 || cfg.webm) || !sec || !frame) return;
    const v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.setAttribute('aria-label', cfg.label || 'Screen recording of ASTRON running');
    if (cfg.poster) v.poster = cfg.poster;
    frame.appendChild(v);
    const cap = $('#demoCaption'); if (cap && cfg.caption) cap.textContent = cfg.caption;
    const tgl = document.createElement('button'); tgl.type = 'button'; tgl.className = 'demo-toggle'; tgl.setAttribute('aria-label', 'Play or pause the demo video'); frame.appendChild(tgl);
    const saver = navigator.connection && navigator.connection.saveData;
    const allowAuto = !reduced && !saver;
    let loaded = false, userPaused = !allowAuto;
    const paint = () => { tgl.textContent = v.paused ? '▶' : '❚❚'; };
    function load() {
      if (loaded) return; loaded = true;
      [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(([k, t]) => { if (cfg[k]) { const s = document.createElement('source'); s.src = cfg[k]; s.type = t; v.appendChild(s); } });
      v.load();
    }
    const play = () => { load(); const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    tgl.addEventListener('click', () => { if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); } });
    v.addEventListener('play', paint); v.addEventListener('pause', paint); paint();
    sec.hidden = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        const on = es[0].isIntersecting;
        if (on && !userPaused) play(); else if (!on && !v.paused) v.pause();
      }, { threshold: .35 }).observe(frame);
    } else if (allowAuto) play();
  })();
})();
