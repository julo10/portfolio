(() => {
  const hero = document.querySelector('.intro.particle-hero');
  const canvas = document.getElementById('particle-canvas');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const header = document.querySelector('.site-header');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LIGHT_DOTS = [210, 210, 210];
  const DARK_DOTS = [112, 112, 112];
  const BLACK = [106, 255, 106], GREY = [210, 210, 210];
  const INK = [17, 17, 17];
  const pointer = { x: -1000, y: -1000, active: false, pressed: false };
  let width = 0, height = 0, dpr = 1, particles = [], raf = 0, lastTime = 0;
  let targetProgress = 0, visualProgress = 0;
  const spacing = () => window.innerWidth < 700 ? 36 : 38;
  const dotRadius = 17;

  function resize() {
    const rect = hero.getBoundingClientRect();
    width = rect.width;
    /* Extend the particle field to the real end of the page.
       Do not use document.scrollHeight here: the tall canvas itself contributes
       to scrollHeight and can create a growing blank area after the footer. */
    const footer = document.querySelector('footer');
    const pageBottom = footer
      ? footer.getBoundingClientRect().bottom + (window.scrollY || window.pageYOffset || 0)
      : hero.offsetHeight;
    height = Math.max(hero.offsetHeight, Math.ceil(pageBottom));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = '100%';
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createParticles();
    render();
  }

  function createParticles() {
    particles = [];
    const gap = spacing();
    for (let y = -gap / 2; y < height + gap; y += gap) {
      for (let x = -gap / 2; x < width + gap; x += gap) {
        const ox = x + (Math.random() - .5) * 5;
        const oy = y + (Math.random() - .5) * 5;
        particles.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0,
          r: dotRadius, alpha: .78 + Math.random() * .22,
          fallFactor: 1.75 + Math.random() * 3 });
      }
    }
  }

  function updateScroll() {
    const rect = hero.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.toggle('intro-scrolled', scrollY > Math.min(90, hero.offsetHeight * 0.12));
    targetProgress = Math.max(0, Math.min(1, -rect.top / Math.max(1, hero.offsetHeight * .9)));
    if (reducedMotion) { visualProgress = targetProgress; render(); }
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = event.clientX >= rect.left && event.clientX <= rect.right &&
      event.clientY >= rect.top && event.clientY <= rect.bottom;
  }
  window.addEventListener('pointermove', updatePointer, { passive: true });
  window.addEventListener('pointerdown', event => { updatePointer(event); pointer.pressed = true; }, { passive: true });
  window.addEventListener('pointerup', () => { pointer.pressed = false; }, { passive: true });
  window.addEventListener('blur', () => { pointer.active = false; pointer.pressed = false; });
  window.addEventListener('scroll', updateScroll, { passive: true });

  function mixColor(from, to, amount) {
    const c = from.map((v, i) => Math.round(v + (to[i] - v) * amount));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  function updateBackground(progress) {
    const bg = mixColor(BLACK, GREY, progress);
    document.body.style.backgroundColor = bg;
    hero.style.backgroundColor = bg;
    if (header) {
      header.style.backgroundColor = bg;
      header.style.color = mixColor(LIGHT_DOTS, INK, progress);
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const progress = visualProgress;
    const influenceRadius = pointer.pressed ? 62 : 100;
    updateBackground(progress);
    const dotColor = mixColor(LIGHT_DOTS, DARK_DOTS, progress);
    /* Let the dots fall through the transition, then fade them completely away. */
    const dotFade = Math.pow(Math.max(0, 1 - progress), .35);

    for (const p of particles) {
      const targetX = p.ox;
      /* Dots drift downward with scroll, continuing beyond the intro. */
      const targetY = p.oy + progress * (hero.offsetHeight * .95) * p.fallFactor;
      if (!reducedMotion) {
        p.vx += (targetX - p.x) * .065;
        p.vy += (targetY - p.y) * 0.005;
        p.vy += progress * 0.06 * p.fallFactor;
        if (pointer.active && progress < .98) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const distance = Math.hypot(dx, dy) || .001;
          if (distance < influenceRadius) {
            const force = (1 - distance / influenceRadius) * (pointer.pressed ? 2.4 : 1.5);
            p.vx += (dx / distance) * force * 0.45;
            p.vy += ((dy / distance) * force + 0.5);
          }
        }
        p.vx *= .84;
        p.vy *= .94;
        p.x += p.vx;
        p.y += p.vy;
      } else {
        p.x = targetX;
        p.y = targetY;
      }

      if (p.y < -50 || p.y > height + 80 || p.x < -50 || p.x > width + 50) continue;
      ctx.globalAlpha = p.alpha * dotFade;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function animate(time) {
    raf = requestAnimationFrame(animate);
    const dt = Math.min((time - (lastTime || time)) / 16.67, 2);
    lastTime = time;
    const smoothing = 1 - Math.pow(.9, dt);
    visualProgress += (targetProgress - visualProgress) * smoothing;
    if (Math.abs(targetProgress - visualProgress) < .001) visualProgress = targetProgress;
    render();
  }

  resize();
  updateScroll();
  if (!reducedMotion) raf = requestAnimationFrame(animate);
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    lastTime = 0;
    if (!reducedMotion) raf = requestAnimationFrame(animate);
  }, { passive: true });
  /* Re-measure if project content expands or fonts/images change page height. */
  window.addEventListener('load', resize, { once: true });
})();
