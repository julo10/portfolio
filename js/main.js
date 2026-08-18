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
