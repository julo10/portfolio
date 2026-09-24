function initCoverScatter(selector, options = {}) {
  const containers = document.querySelectorAll(selector);
  if (!containers.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const isSmallScreen = window.matchMedia("(max-width: 600px)").matches;

  const defaultTargets = [
    { x: -170, y: -8, r: -9 },
    { x: -70, y: 12, r: -4 },
    { x: 0, y: -22, r: 2 },
    { x: 80, y: 14, r: 6 },
    { x: 170, y: -6, r: 11 },
  ];

  const targets = options.targets || defaultTargets;
  const scale = isSmallScreen
    ? (options.mobileScale ?? 0.45)
    : (options.scale ?? 1);

  containers.forEach((container) => {
    const images = [...container.querySelectorAll("img")];
    if (!images.length) return;

    // Give each image a varied width and place the group close together.
    const spread = Math.min(70, 14 * (images.length - 1));
    const start = 50 - spread / 2;

    images.forEach((img, index) => {
      const position =
        images.length === 1
          ? 50
          : start + (index / (images.length - 1)) * spread;

      const minWidth = options.minImageWidth ?? 14;
      const maxWidth = options.maxImageWidth ?? 20;
      const variedWidth =
        minWidth + Math.random() * (maxWidth - minWidth);
  
      img.style.left = `${position}%`;
      img.style.width = `${variedWidth}%`;

      function fitFanToImages() {
        const motionScale = prefersReducedMotion ? 0 : scale;
        const heights = images.map((img) => img.offsetHeight);

        if (heights.some((height) => height === 0)) return;

        const tallest = Math.max(...heights);
        let spaceAbove = 0;
        let spaceBelow = 0;

        images.forEach((img, index) => {
          const target = targets[index % targets.length];
          const height = img.offsetHeight;
          const verticalMove = (target.y * motionScale) / 100 * height;

          spaceAbove = Math.max(spaceAbove, -verticalMove);
          spaceBelow = Math.max(spaceBelow, verticalMove);
        });

        images.forEach((img) => {
          img.style.top = `${spaceAbove}px`;
        });

        container.style.height =
          `${Math.ceil(spaceAbove + tallest + spaceBelow)}px`;
      }

      requestAnimationFrame(fitFanToImages);

      images.forEach((img) => {
        img.addEventListener("load", fitFanToImages);
      });

      window.addEventListener("resize", fitFanToImages);

    });

    // Dragging and full-size previews are enabled for the large project page fans.
    const isInteractive = container.classList.contains("cover-fan--lg");

    let ticking = false;
    let inView = false;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function getProgress() {
      const section = container.closest(".project") || container;
      const box = section.getBoundingClientRect();
      const raw = (window.innerHeight - box.top) /
        (window.innerHeight + box.height);

      return clamp(raw, 0, 1);
    }

    function ease(value) {
      return value * value * (3 - 2 * value);
    }

    function render() {
      ticking = false;
      const progress = prefersReducedMotion ? 0 : ease(getProgress());

      images.forEach((img, index) => {
        const target = targets[index % targets.length];

        img.style.setProperty("--scroll-x", `${target.x * progress * scale}%`);
        img.style.setProperty("--scroll-y", `${target.y * progress * scale}%`);
        img.style.setProperty("--scroll-r", `${target.r * progress * scale}deg`);
      });
    }

    function onScroll() {
      if (!inView || ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting;

          if (inView) {
            render();
            window.addEventListener("scroll", onScroll, { passive: true });
          } else {
            window.removeEventListener("scroll", onScroll);
          }
        });
      },
      { rootMargin: "20% 0px 20% 0px" }
    );

    observer.observe(container.closest(".project") || container);

    window.addEventListener("resize", render);
    render();

    if (!isInteractive) return;

    images.forEach((img) => {
      let startX = 0;
      let startY = 0;
      let dragX = 0;
      let dragY = 0;
      let moved = false;

      img.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        startX = event.clientX;
        startY = event.clientY;
        moved = false;
        img.classList.add("is-grabbed");
        img.setPointerCapture(event.pointerId);
      });

      img.addEventListener("pointermove", (event) => {
        if (!img.hasPointerCapture(event.pointerId)) return;

        const dx = event.clientX - startX;
        const dy = event.clientY - startY;

        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        if (!moved) return;

        dragX += dx;
        dragY += dy;
        startX = event.clientX;
        startY = event.clientY;

        img.style.setProperty("--drag-x", `${dragX}px`);
        img.style.setProperty("--drag-y", `${dragY}px`);
        img.style.zIndex = "20";
      });

      img.addEventListener("pointerup", (event) => {
        img.classList.remove("is-grabbed");

        if (moved) {
          event.preventDefault();
          event.stopPropagation();
          img.dataset.justDragged = "true";
          setTimeout(() => delete img.dataset.justDragged, 0);
        }
      });

      img.addEventListener("pointercancel", () => {
        img.classList.remove("is-grabbed");
      });

      img.addEventListener("click", (event) => {
        if (img.dataset.justDragged === "true") {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        openCoverPreview(img);
      });
    });
  });
}


function openCoverPreview(img) {
  let dialog = document.querySelector("#cover-preview-dialog");

  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "cover-preview-dialog";
    dialog.className = "cover-preview-dialog";
    dialog.innerHTML = `
      <button class="cover-preview-close" type="button" aria-label="Close preview">×</button>
      <img class="cover-preview-full" alt="">
    `;
    document.body.append(dialog);

    dialog.querySelector(".cover-preview-close").addEventListener("click", () => {
      dialog.close();
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  const previewImage = dialog.querySelector(".cover-preview-full");
  previewImage.src = img.currentSrc || img.src;
  previewImage.alt = img.alt;

  if (!dialog.open) dialog.showModal();
}


document.addEventListener("DOMContentLoaded", () => {
  initCoverScatter(".cover-fan:not(.cover-fan--lg)");
});
