/**
 * cover.js
 * Scroll-driven "fan out" effect for cover artwork thumbnails.
 *
 * Usage:
 *   <script src="js/cover.js"></script>
 *   initCoverScatter('.project-covers .cover-preview');
 *
 * On the landing page this runs automatically for `.cover-preview`
 * (small, subtle version). On the covers project page you can call
 * initCoverScatter again with a different selector/options object
 * for a bigger, more extended version of the same effect.
 */

function initCoverScatter(selector, options = {}) {
  const containers = document.querySelectorAll(selector);
  if (!containers.length) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const isSmallScreen = window.matchMedia('(max-width: 600px)').matches;

  // Default target transforms per image, at full scroll progress (1).
  // x/y are % relative to the image's own size, r is rotation in deg.
  // Alternates left/right so the fan opens outward from the middle.
  const defaultTargets = [
    { x: -170, y: -8,  r: -9 },
    { x: -70,  y: 12,  r: -4 },
    { x: 0,    y: -22, r: 2  },
    { x: 80,   y: 14,  r: 6  },
    { x: 170,  y: -6,  r: 11 },
  ];

  const targets = options.targets || defaultTargets;
  const scale = isSmallScreen ? (options.mobileScale ?? 0.45) : (options.scale ?? 1);

  containers.forEach((container) => {
    const images = Array.from(container.querySelectorAll('img'));
    if (!images.length) return;

    if (prefersReducedMotion) {
      // Leave images in their static, stacked CSS position — no motion.
      return;
    }

    let ticking = false;
    let inView = false;

    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    // 0 -> section just entering the bottom of the viewport
    // 1 -> section has fully passed the top of the viewport
    function getProgress() {
      const rect = container.closest('.project') || container;
      const box = rect.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = (vh - box.top) / (vh + box.height);
      return clamp(raw, 0, 1);
    }

    // Ease the raw scroll progress so the fan opens with a bit of
    // acceleration in the middle rather than linearly.
    function ease(t) {
      return t * t * (3 - 2 * t); // smoothstep
    }

    function render() {
      ticking = false;
      const progress = ease(getProgress());

      images.forEach((img, i) => {
        const t = targets[i % targets.length];
        const x = t.x * progress * scale;
        const y = t.y * progress * scale;
        const r = t.r * progress * scale;
        img.style.transform = `translate(${x}%, ${y}%) rotate(${r}deg)`;
      });
    }

    function onScroll() {
      if (!inView || ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    }

    // Only listen to scroll while the section is anywhere near the
    // viewport — cheap when the user is elsewhere on a long page.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;
          if (inView) {
            render();
            window.addEventListener('scroll', onScroll, { passive: true });
          } else {
            window.removeEventListener('scroll', onScroll);
          }
        });
      },
      { rootMargin: '20% 0px 20% 0px' }
    );

    observer.observe(container.closest('.project') || container);

    // Re-render on resize (orientation change, devtools resize, etc.)
    window.addEventListener('resize', () => {
      if (inView) render();
    });

    // Set an initial frame in case the section is already in view on load.
    render();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCoverScatter('.cover-fan:not(.cover-fan--lg)');
});