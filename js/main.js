document.querySelector('.menu-button')?.addEventListener('click', () => {
  const nav = document.querySelector('.site-header nav');
  const btn = document.querySelector('.menu-button');
  if (!nav) return;

  nav.classList.toggle('open');
  const isOpen = nav.classList.contains('open');
  btn.textContent = isOpen ? '-' : '+';
  btn.classList.toggle('is-close', isOpen);
});

document.querySelectorAll('.site-header nav a').forEach(link => {
  link.addEventListener('click', () => {
    const nav = document.querySelector('.site-header nav');
    const btn = document.querySelector('.menu-button');
    nav.classList.remove('open');
    btn.textContent = '+';
    btn.classList.remove('is-close');
  });
});

// Play/pause project videos on scroll visibility
const scrollVideos = document.querySelectorAll('.scroll-video');

if (scrollVideos.length) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // autoplay can be blocked in some browsers; fail silently
          });
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: 0.4, // video is ~40% visible before it starts playing
    }
  );

  scrollVideos.forEach((video) => videoObserver.observe(video));
}

// Make the button "More Projects" reveal hidden projects
const moreButton = document.getElementById("more-projects-button");

if (moreButton) {
  moreButton.addEventListener("click", () => {
    const hiddenProjects = document.querySelectorAll(".hidden-project");

    const isExpanded = moreButton.dataset.expanded === "true";

    hiddenProjects.forEach(project => {
      project.style.display = isExpanded ? "none" : "block";
    });

    moreButton.dataset.expanded = isExpanded ? "false" : "true";

    moreButton.textContent = isExpanded
      ? "More Projects +"
      : "Less Projects −";
  });
}

  /* ==================================================================================================================== */

const carousels = document.querySelectorAll(".project-images");

carousels.forEach((carousel) => {
  /* =========================
     STATE
  ========================= */

  let isDragging = false;
  let hasDragged = false;

  let startX = 0;
  let startScrollLeft = 0;

  const DRAG_THRESHOLD = 6;

  let animationFrame = null;


  /* =========================
     UPDATE IMAGE BLUR
  ========================= */

  function updateImageBlur() {
    const carouselRect = carousel.getBoundingClientRect();

    const viewportLeft = carouselRect.left;
    const viewportRight = carouselRect.right;

    const images = carousel.querySelectorAll("img, video");

    images.forEach((image) => {
      const rect = image.getBoundingClientRect();

      const imageLeft = rect.left;
      const imageRight = rect.right;
      const imageWidth = rect.width;

      if (imageWidth <= 0) return;

      const visibleLeft = Math.max(
        imageLeft,
        viewportLeft
      );

      const visibleRight = Math.min(
        imageRight,
        viewportRight
      );

      const visibleWidth = Math.max(
        0,
        visibleRight - visibleLeft
      );

      const visibility = visibleWidth / imageWidth;


      /* Fully visible = completely sharp */

      if (visibility >= 0.999) {
        image.style.filter = "blur(0px)";
        return;
      }


      /* Completely outside = maximum blur */

      if (visibility <= 0) {
        image.style.filter = "blur(14px)";
        return;
      }


      /* Partially visible = progressive blur */

      const blurProgress =
        Math.pow(1 - visibility, 1.4);

      const blur =
        blurProgress * 14;

      image.style.filter =
        `blur(${blur}px)`;
    });
  }


  /* =========================
     SMOOTH BLUR UPDATES
  ========================= */

  function requestBlurUpdate() {
    if (animationFrame) return;

    animationFrame = requestAnimationFrame(() => {
      updateImageBlur();
      animationFrame = null;
    });
  }


  /* =========================
     POINTER DOWN
  ========================= */

  carousel.addEventListener("pointerdown", (e) => {

    // Only use the primary mouse button
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }

  clearTimeout(autoScrollTimer);

  if (autoScrollAnimation) {
    cancelAnimationFrame(autoScrollAnimation);
    autoScrollAnimation = null;
  }

  isAutoScrolling = false;

    isDragging = true;
    hasDragged = false;

    startX = e.clientX;
    startScrollLeft = carousel.scrollLeft;

    carousel.classList.add("is-dragging");

    // Keep receiving pointer events even outside carousel
    carousel.setPointerCapture(e.pointerId);

    e.preventDefault();
  });


  /* =========================
     POINTER MOVE
  ========================= */

  carousel.addEventListener("pointermove", (e) => {

    if (!isDragging) return;

    const distance = e.clientX - startX;


    /*
     * Only turn the interaction into a drag
     * after the pointer has moved enough.
     */

    if (Math.abs(distance) > DRAG_THRESHOLD) {
      hasDragged = true;
    }


    /*
     * If this is still just a click,
     * don't move the carousel.
     */

    if (!hasDragged) {
      return;
    }


    /*
     * Move carousel freely.
     */

    carousel.scrollLeft =
      startScrollLeft - distance * 1.2;

    requestBlurUpdate();

    e.preventDefault();
  });


  /* =========================
     STOP DRAGGING
  ========================= */

  function stopDragging(e) {

    if (!isDragging) return;

    isDragging = false;

    carousel.classList.remove("is-dragging");

    if (
      e.pointerId !== undefined &&
      carousel.hasPointerCapture(e.pointerId)
    ) {
      carousel.releasePointerCapture(e.pointerId);
    }

    requestBlurUpdate();
  }


  carousel.addEventListener(
    "pointerup",
    stopDragging
  );

  carousel.addEventListener(
    "pointercancel",
    stopDragging
  );


  /* =========================
     BLOCK CLICK AFTER DRAG
  ========================= */

  carousel.addEventListener("click", (e) => {

    /*
     * If the user actually dragged,
     * prevent the link from opening.
     */

    if (hasDragged) {

      e.preventDefault();
      e.stopPropagation();

      hasDragged = false;
    }
  });


  /* =========================
     UPDATE WHILE SCROLLING
  ========================= */

  carousel.addEventListener(
    "scroll",
    requestBlurUpdate,
    { passive: true }
  );


  /* =========================
     RESIZE
  ========================= */

  window.addEventListener(
    "resize",
    requestBlurUpdate
  );


  /* =========================
     IMAGE LOAD
  ========================= */

  carousel.querySelectorAll("img").forEach((img) => {

    if (img.complete) {
      requestBlurUpdate();
    }

    img.addEventListener(
      "load",
      requestBlurUpdate
    );
  });


  /* =========================
     INITIAL UPDATE
  ========================= */

  requestBlurUpdate();


/* =========================
   AUTOMATIC SCROLL
========================= */

let autoScrollTimer;
let autoScrollAnimation;
let isAutoScrolling = false;

const AUTO_DELAY = 4000;      // wait 4 seconds
const AUTO_DISTANCE = 1;      // pixels per frame
const AUTO_DURATION = 1800;   // 1.8 second movement


function startAutoScroll() {

  clearTimeout(autoScrollTimer);

  autoScrollTimer = setTimeout(() => {

    if (isDragging) {
      startAutoScroll();
      return;
    }

    const maxScroll =
      carousel.scrollWidth -
      carousel.clientWidth;

    /*
     * If we're already at the end,
     * return to the beginning.
     */

    if (carousel.scrollLeft >= maxScroll - 2) {

      carousel.scrollTo({
        left: 0,
        behavior: "smooth"
      });

      requestBlurUpdate();

      startAutoScroll();

      return;
    }


    /* =========================
       MOVE FORWARD
    ========================= */

    const startPosition =
      carousel.scrollLeft;

    const targetPosition =
      Math.min(
        startPosition + carousel.clientWidth * 0.33,
        maxScroll
      );

    const distance =
      targetPosition - startPosition;

    const startTime =
      performance.now();

    isAutoScrolling = true;


    function animateAutoScroll(currentTime) {

      /*
       * User started dragging.
       * Stop automatic movement.
       */

      if (isDragging) {
        isAutoScrolling = false;
        return;
      }


      const elapsed =
        currentTime - startTime;

      const progress =
        Math.min(
          elapsed / AUTO_DURATION,
          1
        );


      /*
       * Smooth ease-in-out
       */

      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 -
            Math.pow(
              -2 * progress + 2,
              2
            ) / 2;


      carousel.scrollLeft =
        startPosition +
        distance * eased;


      requestBlurUpdate();


      if (progress < 1) {

        autoScrollAnimation =
          requestAnimationFrame(
            animateAutoScroll
          );

      } else {

        isAutoScrolling = false;

        startAutoScroll();
      }
    }


    autoScrollAnimation =
      requestAnimationFrame(
        animateAutoScroll
      );

  }, AUTO_DELAY);
}


startAutoScroll();

});
