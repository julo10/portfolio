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

  // Has the user actually interacted with the screen?
  let hasPointerMoved = false;


  // =========================================
  // MOBILE INITIAL STATE
  // =========================================

  /*
   * On touch devices there is no mouse cursor.
   * Therefore the kiss should not sit permanently
   * in the middle of the screen before interaction.
   */

  if (window.matchMedia("(pointer: coarse)").matches) {
    cursor.style.opacity = "0";

    document.querySelectorAll(".cursor-trail").forEach((element) => {
      element.style.opacity = "0";
    });
  }


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
  // POINTER POSITION
  // =========================================

  document.addEventListener("pointermove", (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;

    hasPointerMoved = true;

    /*
     * Show cursor after first interaction.
     */

    cursor.style.opacity = "1";

    /*
     * Restore trail opacity.
     */

    trail.forEach((item, index) => {

      const progress = index / (TRAIL_COUNT - 1);

      const opacity =
        TRAIL_START_OPACITY +
        (TRAIL_END_OPACITY - TRAIL_START_OPACITY) * progress;

      item.element.style.opacity = opacity;

    });

  });


  // =========================================
  // TOUCH POSITION
  // =========================================

  /*
   * Some mobile browsers may not continuously
   * dispatch pointermove during certain touch
   * interactions, so also listen directly to touchmove.
   */

  document.addEventListener("touchmove", (e) => {

    if (!e.touches.length) return;

    const touch = e.touches[0];

    mouseX = touch.clientX;
    mouseY = touch.clientY;

    hasPointerMoved = true;

    cursor.style.opacity = "1";

    trail.forEach((item, index) => {

      const progress = index / (TRAIL_COUNT - 1);

      const opacity =
        TRAIL_START_OPACITY +
        (TRAIL_END_OPACITY - TRAIL_START_OPACITY) * progress;

      item.element.style.opacity = opacity;

    });

  }, { passive: true });


  // =========================================
  // TOUCH START
  // =========================================

  document.addEventListener("touchstart", (e) => {

    if (!e.touches.length) return;

    const touch = e.touches[0];

    mouseX = touch.clientX;
    mouseY = touch.clientY;

    hasPointerMoved = true;

    cursor.style.opacity = "1";

    trail.forEach((item, index) => {

      const progress = index / (TRAIL_COUNT - 1);

      const opacity =
        TRAIL_START_OPACITY +
        (TRAIL_END_OPACITY - TRAIL_START_OPACITY) * progress;

      item.element.style.opacity = opacity;

    });

  }, { passive: true });

function hideTouchCursor() {
  cursor.style.opacity = "0";
  trail.forEach((item) => {
    item.element.style.opacity = "0";
  });
}

document.addEventListener("touchend", hideTouchCursor, { passive: true });
document.addEventListener("touchcancel", hideTouchCursor, { passive: true });

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


    /*
     * Only move the cursor once the user
     * has actually interacted with the screen.
     */

    if (hasPointerMoved) {

      cursor.style.left = `${cursorX}px`;
      cursor.style.top = `${cursorY}px`;

    }


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
  // CLICK / TOUCH ANIMATION
  // =========================================

  document.addEventListener("mousedown", () => {

    cursor.classList.remove("clicked");

    // Force animation restart
    void cursor.offsetWidth;

    cursor.classList.add("clicked");

  });


  document.addEventListener("touchstart", () => {

    cursor.classList.remove("clicked");

    // Force animation restart
    void cursor.offsetWidth;

    cursor.classList.add("clicked");

  }, { passive: true });


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

    carousel.addEventListener("pointermove", (e) => {

      /*
       * Keep cursor position synchronized with
       * the carousel while interacting with it.
       */

      mouseX = e.clientX;
      mouseY = e.clientY;

      hasPointerMoved = true;

      cursor.style.opacity = "1";


      if (
        carousel.classList.contains("is-dragging") &&
        !isDragging
      ) {

        isDragging = true;

        cursorImage.src = dragSVG;

      }

    });


    carousel.addEventListener("pointerdown", (e) => {

      mouseX = e.clientX;
      mouseY = e.clientY;

      hasPointerMoved = true;

      cursor.style.opacity = "1";

    });


    carousel.addEventListener("pointerup", (e) => {

      mouseX = e.clientX;
      mouseY = e.clientY;

      isDragging = false;

      cursorImage.src = normalSVG;

    });


    carousel.addEventListener("pointercancel", (e) => {

      mouseX = e.clientX;
      mouseY = e.clientY;

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
