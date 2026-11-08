/* ASTRON — v2 effects: pinned "How it works" (the hero core now lives in core.js so it loads first) */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;

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
