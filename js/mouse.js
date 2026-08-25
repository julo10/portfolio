const cursor = document.getElementById("cursor");

if (cursor) {

  const cursorImage = cursor.querySelector("img");

const basePath = window.location.pathname.includes("/projects/")
  ? "../images/"
  : "images/";

const normalSVG = basePath + "kiss.svg";
const dragSVG = basePath + "kiss_drag.svg";

  // =========================================
  // SETTINGS
  // =========================================

  const TRAIL_COUNT = 10;

  // Main cursor
  const CURSOR_SMOOTHING = 0.25;

  // Trail
  const TRAIL_SMOOTHING = 0.26;

  // Trail starts at this size and gradually becomes smaller
  const TRAIL_START_SIZE = 34;
  const TRAIL_END_SIZE = 10;

  // Trail starts visible and gradually disappears
  const TRAIL_START_OPACITY = 0.30;
  const TRAIL_END_OPACITY = 0;

  // =========================================
  // CURSOR STATE
  // =========================================

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  let cursorX = mouseX;
  let cursorY = mouseY;

  let isDragging = false;

  // =========================================
  // CREATE TRAIL
  // =========================================

  const trail = [];

  for (let i = 0; i < TRAIL_COUNT; i++) {

    const element = document.createElement("div");

    element.className = "cursor-trail";

    const image = document.createElement("img");

    image.src = normalSVG;
    image.alt = "";

    element.appendChild(image);
    document.body.appendChild(element);

    /*
     * Progress:
     * 0 = first trail element
     * 1 = last trail element
     */

    const progress = i / (TRAIL_COUNT - 1);

    /*
     * Size gets smaller toward the end.
     */

    const size =
      TRAIL_START_SIZE +
      (TRAIL_END_SIZE - TRAIL_START_SIZE) * progress;

    /*
     * Opacity gets lower toward the end.
     */

    const opacity =
      TRAIL_START_OPACITY +
      (TRAIL_END_OPACITY - TRAIL_START_OPACITY) * progress;

    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.opacity = opacity;

    trail.push({
      element,
      x: mouseX,
      y: mouseY,

      /*
       * Later trail elements move slightly slower.
       * This creates a smoother, longer tail.
       */

      smoothing:
        TRAIL_SMOOTHING -
        progress * 0.07
    });
  }

  // =========================================
  // MOUSE POSITION
  // =========================================

  document.addEventListener("mousemove", (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;

  });

  // =========================================
  // MAIN CURSOR + TRAIL
  // =========================================

  function animateCursor() {

    /*
     * Smooth main cursor
     */

    cursorX +=
      (mouseX - cursorX) *
      CURSOR_SMOOTHING;

    cursorY +=
      (mouseY - cursorY) *
      CURSOR_SMOOTHING;

    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;


    // =========================================
    // TRAIL
    // =========================================

    let previousX = cursorX;
    let previousY = cursorY;

    trail.forEach((item) => {

      item.x +=
        (previousX - item.x) *
        item.smoothing;

      item.y +=
        (previousY - item.y) *
        item.smoothing;

      item.element.style.left = `${item.x}px`;
      item.element.style.top = `${item.y}px`;

      previousX = item.x;
      previousY = item.y;

    });

    requestAnimationFrame(animateCursor);
  }

  animateCursor();


  // =========================================
  // CLICK ANIMATION
  // =========================================

  document.addEventListener("mousedown", () => {

    cursor.classList.remove("clicked");

    // Force animation restart
    void cursor.offsetWidth;

    cursor.classList.add("clicked");

  });


  // =========================================
  // REMOVE CLICK STATE
  // =========================================

  cursor.addEventListener("animationend", () => {

    cursor.classList.remove("clicked");

  });


  // =========================================
  // CAROUSEL DRAG
  // =========================================

  const carousels =
    document.querySelectorAll(".project-images");


  carousels.forEach((carousel) => {

    carousel.addEventListener("pointermove", () => {

      if (
        carousel.classList.contains("is-dragging") &&
        !isDragging
      ) {

        isDragging = true;

        cursorImage.src = dragSVG;

      }

    });


    carousel.addEventListener("pointerup", () => {

      isDragging = false;

      cursorImage.src = normalSVG;

    });


    carousel.addEventListener("pointercancel", () => {

      isDragging = false;

      cursorImage.src = normalSVG;

    });


    carousel.addEventListener("mouseleave", () => {

      if (isDragging) {

        isDragging = false;

        cursorImage.src = normalSVG;

      }

    });

  });

}