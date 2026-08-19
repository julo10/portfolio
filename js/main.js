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
