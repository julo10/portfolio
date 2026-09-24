document.querySelector(".menu-button")?.addEventListener("click", () => {
  const nav = document.querySelector(".site-header nav");
  const btn = document.querySelector(".menu-button");
  if (!nav) return;

  nav.classList.toggle("open");
  const isOpen = nav.classList.contains("open");
  btn.textContent = isOpen ? "-" : "+";
  btn.classList.toggle("is-close", isOpen);
});

document.querySelectorAll(".site-header nav a").forEach((link) => {
  link.addEventListener("click", () => {
    const nav = document.querySelector(".site-header nav");
    const btn = document.querySelector(".menu-button");
    nav?.classList.remove("open");

    if (btn) {
      btn.textContent = "+";
      btn.classList.remove("is-close");
    }
  });
});


// Play or pause project videos based on visibility.
const scrollVideos = document.querySelectorAll(".scroll-video");

if (scrollVideos.length) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;

        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay may be blocked by the browser.
          });
        } else {
          video.pause();
        }
      });
    },
    {
      threshold: 0.4,
    }
  );

  scrollVideos.forEach((video) => videoObserver.observe(video));
}


// Show or hide the additional projects.
const moreButton = document.getElementById("more-projects-button");

if (moreButton) {
  moreButton.addEventListener("click", () => {
    const hiddenProjects = document.querySelectorAll(".hidden-project");
    const isExpanded = moreButton.dataset.expanded === "true";

    hiddenProjects.forEach((project) => {
      project.style.display = isExpanded ? "none" : "block";
    });

    moreButton.dataset.expanded = isExpanded ? "false" : "true";
    moreButton.textContent = isExpanded
      ? "More Projects +"
      : "Less Projects −";
  });
}


// Carousel interactions.
const carousels = document.querySelectorAll(".project-images");

carousels.forEach((carousel) => {
  let isDragging = false;
  let hasDragged = false;
  let startX = 0;
  let startScrollLeft = 0;
  let animationFrame = null;

  const DRAG_THRESHOLD = 6;


  // Blur images according to how much of each image is visible.
  function updateImageBlur() {
    const carouselRect = carousel.getBoundingClientRect();
    const viewportLeft = carouselRect.left;
    const viewportRight = carouselRect.right;
    const images = carousel.querySelectorAll("img, video");

    images.forEach((image) => {
      const rect = image.getBoundingClientRect();
      const imageWidth = rect.width;

      if (imageWidth <= 0) return;

      const visibleLeft = Math.max(rect.left, viewportLeft);
      const visibleRight = Math.min(rect.right, viewportRight);
      const visibleWidth = Math.max(0, visibleRight - visibleLeft);
      const visibility = visibleWidth / imageWidth;

      if (visibility >= 0.999) {
        image.style.filter = "blur(0px)";
        return;
      }

      if (visibility <= 0) {
        image.style.filter = "blur(14px)";
        return;
      }

      const blurProgress = Math.pow(1 - visibility, 1.4);
      image.style.filter = `blur(${blurProgress * 14}px)`;
    });
  }


  function requestBlurUpdate() {
    if (animationFrame) return;

    animationFrame = requestAnimationFrame(() => {
      updateImageBlur();
      animationFrame = null;
    });
  }


  // Drag the carousel with the mouse or pointer.
  carousel.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
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
    startX = event.clientX;
    startScrollLeft = carousel.scrollLeft;

    carousel.classList.add("is-dragging");
    carousel.setPointerCapture(event.pointerId);
    event.preventDefault();
  });


  carousel.addEventListener("pointermove", (event) => {
    if (!isDragging) return;

    const distance = event.clientX - startX;

    if (Math.abs(distance) > DRAG_THRESHOLD) {
      hasDragged = true;
    }

    if (!hasDragged) return;

    carousel.scrollLeft = startScrollLeft - distance * 1.2;
    requestBlurUpdate();
    event.preventDefault();
  });


  function stopDragging(event) {
    if (!isDragging) return;

    isDragging = false;
    carousel.classList.remove("is-dragging");

    if (
      event.pointerId !== undefined &&
      carousel.hasPointerCapture(event.pointerId)
    ) {
      carousel.releasePointerCapture(event.pointerId);
    }

    requestBlurUpdate();
  }

  carousel.addEventListener("pointerup", stopDragging);
  carousel.addEventListener("pointercancel", stopDragging);


  // Prevent a drag from opening the project link.
  carousel.addEventListener("click", (event) => {
    if (!hasDragged) return;

    event.preventDefault();
    event.stopPropagation();
    hasDragged = false;
  });


  carousel.addEventListener("scroll", requestBlurUpdate, {
    passive: true,
  });

  window.addEventListener("resize", requestBlurUpdate);

  carousel.querySelectorAll("img").forEach((image) => {
    if (image.complete) {
      requestBlurUpdate();
    }

    image.addEventListener("load", requestBlurUpdate);
  });


  // Automatically advance the carousel.
  let autoScrollTimer;
  let autoScrollAnimation;
  let isAutoScrolling = false;

  const AUTO_DELAY = 4000;
  const AUTO_DURATION = 1800;

  function startAutoScroll() {
    clearTimeout(autoScrollTimer);

    autoScrollTimer = setTimeout(() => {
      if (isDragging) {
        startAutoScroll();
        return;
      }

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScroll - 2) {
        carousel.scrollTo({
          left: 0,
          behavior: "smooth",
        });

        requestBlurUpdate();
        startAutoScroll();
        return;
      }

      const startPosition = carousel.scrollLeft;
      const targetPosition = Math.min(
        startPosition + carousel.clientWidth * 0.33,
        maxScroll
      );
      const distance = targetPosition - startPosition;
      const startTime = performance.now();

      isAutoScrolling = true;

      function animateAutoScroll(currentTime) {
        if (isDragging) {
          isAutoScrolling = false;
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / AUTO_DURATION, 1);

        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        carousel.scrollLeft = startPosition + distance * eased;
        requestBlurUpdate();

        if (progress < 1) {
          autoScrollAnimation = requestAnimationFrame(animateAutoScroll);
        } else {
          isAutoScrolling = false;
          startAutoScroll();
        }
      }

      autoScrollAnimation = requestAnimationFrame(animateAutoScroll);
    }, AUTO_DELAY);
  }


  // Respond to vertical scrolling anywhere on the page.
  window.addEventListener(
    "wheel",
    (event) => {
      // Leave horizontal trackpad scrolling alone.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const viewportCenter = window.innerHeight / 2;

      // Choose the visible carousel closest to the screen center.
      const activeCarousel = [...carousels]
        .filter((item) => {
          const rect = item.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        })
        .sort((a, b) => {
          const rectA = a.getBoundingClientRect();
          const rectB = b.getBoundingClientRect();
          const centerA = (rectA.top + rectA.bottom) / 2;
          const centerB = (rectB.top + rectB.bottom) / 2;

          return (
            Math.abs(centerA - viewportCenter) -
            Math.abs(centerB - viewportCenter)
          );
        })[0];

      if (activeCarousel !== carousel) return;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll <= 0) return;

      // Let the page scroll normally when the carousel reaches either end.
      if (
        (event.deltaY > 0 && carousel.scrollLeft >= maxScroll) ||
        (event.deltaY < 0 && carousel.scrollLeft <= 0)
      ) {
        return;
      }


      // Pause autoplay while the user scrolls, then restart its timer.
      clearTimeout(autoScrollTimer);

      if (autoScrollAnimation) {
        cancelAnimationFrame(autoScrollAnimation);
        autoScrollAnimation = null;
      }

      isAutoScrolling = false;

      
     const targetScroll = Math.max(
      0,
      Math.min(maxScroll, carousel.scrollLeft + event.deltaY * 1.5)
    );

    carousel.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });

    requestBlurUpdate();
    startAutoScroll();  
    
    },
    { passive: false }
  );


  requestBlurUpdate();
  startAutoScroll();
});
