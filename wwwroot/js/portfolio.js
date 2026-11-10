(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // Fundo animado
  function initBackground() {
    const canvas = $('#bg-canvas');
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;

    const COLORS = ['62,207,142', '62,207,142', '34,160,107', '136,146,164'];
    const LINK_DIST = 150;
    const POINTER_DIST = 190;
    const pointer = { x: -9999, y: -9999 };
    let width = 0, height = 0, nodes = [], frame = 0;
    let dim = 1;

    const makeNode = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.36,
      vy: (Math.random() - 0.5) * 0.36,
      r: 1 + Math.random() * 1.6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dim = width < 700 ? 0.55 : 1;
      const target = Math.max(18, Math.min(105, Math.round((width * height) / 15000)));
      while (nodes.length < target) nodes.push(makeNode());
      nodes.length = target;
      if (reduceMotion.matches) draw(false);
    }

    function draw(move) {
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        if (move) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20) n.x = width + 20; else if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20; else if (n.y > height + 20) n.y = -20;
        }
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            ctx.strokeStyle = `rgba(${a.color},${(1 - dist / LINK_DIST) * 0.24 * dim})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (pd < POINTER_DIST) {
          ctx.strokeStyle = `rgba(${a.color},${(1 - pd / POINTER_DIST) * 0.6})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }

        ctx.fillStyle = `rgba(${a.color},${0.8 * dim})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop() {
      draw(true);
      frame = requestAnimationFrame(loop);
    }

    function start() {
      cancelAnimationFrame(frame);
      if (reduceMotion.matches) draw(false);
      else frame = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });
    reduceMotion.addEventListener('change', start);

    resize();
    start();
  }

  // Carrossel das fotos de perfil
  function initCarousel() {
    const root = $('[data-carousel]');
    if (!root) return;
    const slides = $$('.avatar-img', root);
    const dotsWrap = $('.avatar-dots', root);
    if (slides.length < 2 || !dotsWrap) return;

    const INTERVAL = 4500;
    let index = 0, timer = 0;

    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'avatar-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Mostrar foto ${i + 1} de ${slides.length}`);
      dot.addEventListener('click', () => { go(i); play(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function go(next) {
      next = (next + slides.length) % slides.length;
      if (next === index) return;
      slides[index].classList.remove('is-active');
      dots[index].classList.remove('is-active');
      index = next;
      slides[index].classList.add('is-active');
      dots[index].classList.add('is-active');
    }

    function pause() { clearInterval(timer); }
    function play() {
      pause();
      if (!reduceMotion.matches && !document.hidden) timer = setInterval(() => go(index + 1), INTERVAL);
    }

    root.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') pause(); });
    root.addEventListener('pointerleave', play);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', play);
    document.addEventListener('visibilitychange', play);

    let startX = null;
    root.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    root.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) { go(index + (dx < 0 ? 1 : -1)); play(); }
    });
    root.addEventListener('pointercancel', () => { startX = null; });

    play();
  }

  // Efeito de digitação no cargo
  function initTyped() {
    const el = $('[data-typed]');
    if (!el || reduceMotion.matches) return;
    const words = el.dataset.typed.split('|').map((w) => w.trim()).filter(Boolean);
    if (words.length < 2) return;

    let word = 0, char = words[0].length, deleting = true;
    el.setAttribute('aria-label', words.join(', '));

    function tick() {
      const current = words[word];
      char += deleting ? -1 : 1;
      el.textContent = current.slice(0, char);

      let delay = deleting ? 32 : 62;
      if (!deleting && char === current.length) { deleting = true; delay = 2100; }
      else if (deleting && char === 0) { deleting = false; word = (word + 1) % words.length; delay = 320; }
      setTimeout(tick, delay);
    }
    setTimeout(tick, 2400);
  }

  // Entrada das seções + contadores
  function initReveal() {
    const items = $$('.reveal');
    $$('[data-stagger]').forEach((group) => {
      [...group.children].forEach((child, i) => child.style.setProperty('--d', `${i * 80}ms`));
    });

    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => observer.observe(el));

    const counters = $$('[data-count]');
    if (reduceMotion.matches) return;
    const counterObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        countUp(entry.target);
        counterObserver.unobserve(entry.target);
      }
    }, { threshold: 0.6 });
    counters.forEach((el) => counterObserver.observe(el));
  }

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const format = (v) => prefix + v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    const duration = 1500;
    const t0 = performance.now();

    function step(now) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Navegação
  function initNav() {
    const nav = $('.nav');
    const progress = $('.progress');
    const toggle = $('.nav-toggle');
    const links = $$('.nav-links a');
    if (!nav) return;

    let ticking = false;
    function onScroll() {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', String(open));
    }
    if (toggle) toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) setOpen(false); });

    if (!('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((a) => a.classList.remove('is-active'));
        const link = byId.get(entry.target.id);
        if (link) link.classList.add('is-active');
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  // Brilho que segue o mouse nos cards
  function initSpotlight() {
    $$('.card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  // Galeria do TCC (lightbox)
  function initLightbox() {
    const dialog = $('#lightbox');
    const shots = $$('.shot');
    if (!dialog || !shots.length || typeof dialog.showModal !== 'function') return;

    const img = $('img', dialog);
    const caption = $('figcaption', dialog);
    let current = 0;

    function show(i) {
      current = (i + shots.length) % shots.length;
      const shot = shots[current];
      img.src = shot.dataset.full;
      img.alt = $('img', shot).alt;
      caption.textContent = `${$('span', shot).textContent.trim()} (${current + 1}/${shots.length})`;
    }

    shots.forEach((shot, i) => shot.addEventListener('click', () => { show(i); dialog.showModal(); }));
    $('[data-prev]', dialog).addEventListener('click', () => show(current - 1));
    $('[data-next]', dialog).addEventListener('click', () => show(current + 1));
    $('[data-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  initBackground();
  initCarousel();
  initTyped();
  initReveal();
  initNav();
  initSpotlight();
  initLightbox();
})();
