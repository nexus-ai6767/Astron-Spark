/* ASTRON fx3 — premium layer. No libraries. Safe to remove: delete the fx3 <link>/<script> lines. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  const root = document.documentElement;

  /* ---------- accent theme (persisted) ---------- */
  const ACCENTS = ['blue', 'violet', 'emerald', 'amber'];
  function setAccent(name) {
    if (!ACCENTS.includes(name)) name = 'blue';
    if (name === 'blue') root.removeAttribute('data-accent'); else root.setAttribute('data-accent', name);
    store.set('astron-accent', name);
  }
  setAccent(store.get('astron-accent') || 'blue');

  /* ---------- aurora + grain ---------- */
  const aur = document.createElement('div');
  aur.className = 'fx3-aurora'; aur.setAttribute('aria-hidden', 'true');
  aur.innerHTML = '<i></i><i></i><i></i>';
  document.body.prepend(aur);
  const grain = document.createElement('div');
  grain.className = 'fx3-grain'; grain.setAttribute('aria-hidden', 'true');
  document.body.append(grain);

  /* ---------- cursor-lit borders ---------- */
  if (fine && !reduce) {
    let raf = 0, tgt = null, ex = 0, ey = 0;
    document.addEventListener('pointermove', e => {
      const el = e.target.closest && e.target.closest('.card,.price-card');
      if (!el) return;
      tgt = el; ex = e.clientX; ey = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = tgt.getBoundingClientRect();
        tgt.style.setProperty('--gx', (ex - r.left) + 'px');
        tgt.style.setProperty('--gy', (ey - r.top) + 'px');
      });
    }, { passive: true });
  }

  /* ---------- section dock ---------- */
  const SECTIONS = [['top', 'Home'], ['capabilities', 'Features'], ['interface', 'Interface'], ['architecture', 'How it works'],
    ['command-playground', 'Command lab'], ['setup', 'Setup'], ['pricing', 'Pricing'], ['downloads', 'Downloads'], ['faq', 'FAQ']]
    .filter(([id]) => document.getElementById(id));
  if (SECTIONS.length > 3) {
    const dock = document.createElement('nav');
    dock.className = 'fx3-dock'; dock.setAttribute('aria-label', 'Page sections');
    dock.innerHTML = SECTIONS.map(([id, name]) => `<a href="#${id}" data-id="${id}" aria-label="${name}"><span>${name}</span></a>`).join('');
    document.body.append(dock);
    const links = new Map($$('a', dock).map(a => [a.dataset.id, a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.remove('on'));
        links.get(en.target.id)?.classList.add('on');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(([id]) => io.observe(document.getElementById(id)));
  }

  /* ---------- footer wordmark ---------- */
  const foot = $('.footer');
  if (foot) { const m = document.createElement('div'); m.className = 'fx3-mark'; m.setAttribute('aria-hidden', 'true'); m.textContent = 'ASTRON'; foot.append(m); }

  /* ---------- command palette (Ctrl/Cmd+K or "/") ---------- */
  const go = id => () => { const t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); };
  const cmds = [
    ...SECTIONS.map(([id, name]) => ({ t: 'Go to ' + name, k: 'Navigate', run: go(id) })),
    { t: 'Docs & release notes', k: 'Page', run: () => { location.href = 'docs.html'; } },
    { t: 'Open the ASTRON assistant', k: 'Action', run: () => { const b = $('#astron-assistant-launch'); if (b) b.click(); } },
    { t: 'Accent: Electric blue', k: 'Theme', run: () => setAccent('blue') },
    { t: 'Accent: Violet', k: 'Theme', run: () => setAccent('violet') },
    { t: 'Accent: Emerald', k: 'Theme', run: () => setAccent('emerald') },
    { t: 'Accent: Amber', k: 'Theme', run: () => setAccent('amber') },
    { t: 'Back to top', k: 'Navigate', run: () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }) }
  ];
  const pal = document.createElement('div');
  pal.className = 'fx3-pal'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Command palette');
  pal.innerHTML = '<div class="fx3-pal-box"><input type="text" placeholder="Jump to a section, switch accent…" aria-label="Search commands" autocomplete="off" spellcheck="false"><ul role="listbox"></ul><footer><span>↑↓ navigate</span><span>↵ run</span><span>esc close</span></footer></div>';
  document.body.append(pal);
  const inp = $('input', pal), list = $('ul', pal);
  let shown = [], sel = 0, lastFocus = null;
  function render() {
    const q = inp.value.toLowerCase().split(/\s+/).filter(Boolean);
    shown = cmds.filter(c => q.every(w => (c.t + ' ' + c.k).toLowerCase().includes(w)));
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length
      ? shown.map((c, i) => `<li role="option" data-i="${i}" class="${i === sel ? 'sel' : ''}"><i></i>${c.t}<small>${c.k}</small></li>`).join('')
      : '<li style="cursor:default">No matches</li>';
  }
  function open() { lastFocus = document.activeElement; inp.value = ''; sel = 0; render(); pal.classList.add('open'); inp.focus(); }
  function close() { pal.classList.remove('open'); lastFocus && lastFocus.focus && lastFocus.focus(); }
  function run(i) { const c = shown[i]; if (!c) return; close(); setTimeout(c.run, 30); }
  inp.addEventListener('input', () => { sel = 0; render(); });
  list.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) run(+li.dataset.i); });
  pal.addEventListener('mousedown', e => { if (e.target === pal) close(); });
  pal.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, shown.length); render(); $('li.sel', list)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(1, shown.length); render(); $('li.sel', list)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    else if (e.key === 'Tab') { e.preventDefault(); inp.focus(); }       // keep focus inside the dialog
  });
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '') || document.activeElement?.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); pal.classList.contains('open') ? close() : open(); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
  });
  if (fine) {
    const hint = document.createElement('button');
    hint.type = 'button'; hint.className = 'fx3-hint'; hint.setAttribute('aria-label', 'Open command palette');
    hint.innerHTML = 'Quick jump <kbd>Ctrl K</kbd>';
    hint.addEventListener('click', open);
    document.body.append(hint);
  }
})();

/* ---------- "In motion": rotating voice demo line (decorative) ---------- */
(() => {
  const say = document.getElementById('bSay'), done = document.getElementById('bDo');
  if (!say || !done) return;
  [...document.querySelectorAll('.b-wave i')].forEach((el, i) => el.style.setProperty('--n', i));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { done.classList.add('on'); return; }
  const lines = [['“Hey Astron, open my notes.”', '✓ Notes opened'], ['“Hey Astron, what’s on my screen?”', '✓ Describing the scene'],
    ['“Hey Astron, remember I prefer dark mode.”', '✓ Saved to local memory'], ['“Hey Astron, search the web for Ollama.”', '✓ Browser opened']];
  let li = 0, ci = 0, timer = 0, visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: .1 }).observe(say);
  function type() {
    if (!visible) { timer = setTimeout(type, 600); return; }
    const [txt, res] = lines[li];
    if (ci === 0) done.classList.remove('on');
    ci++; say.textContent = txt.slice(0, ci);
    if (ci < txt.length) timer = setTimeout(type, 38);
    else { done.textContent = res; done.classList.add('on'); ci = 0; li = (li + 1) % lines.length; timer = setTimeout(type, 2600); }
  }
  type();
})();


/* ---------- pause bento animations while off-screen (battery / scroll smoothness) ---------- */
(() => {
  const cards = [...document.querySelectorAll('.bento-card')];
  if (!cards.length || !('IntersectionObserver' in window)) { cards.forEach(c => c.classList.add('live')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('live', e.isIntersecting)), { rootMargin: '80px' });
  cards.forEach(c => io.observe(c));
})();
