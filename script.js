const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('[data-nav]');
const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('.sr-only').textContent = 'Open navigation';
  nav.classList.remove('open');
  document.body.classList.remove('menu-open');
};

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.querySelector('.sr-only').textContent = isOpen ? 'Open navigation' : 'Close navigation';
  nav.classList.toggle('open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

navLinks.forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 24), { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sections = [...document.querySelectorAll('main section[id]')];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-30% 0px -60% 0px' });
sections.forEach((section) => sectionObserver.observe(section));

const animateCount = (element) => {
  const target = Number(element.dataset.count);
  const suffix = element.dataset.suffix || '';
  if (reduceMotion || target <= 10) {
    element.textContent = `${target}${suffix}`;
    return;
  }
  const duration = 1100;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${Math.round(target * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      countObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.8 });
document.querySelectorAll('[data-count]').forEach((counter) => countObserver.observe(counter));

document.querySelector('[data-year]').textContent = new Date().getFullYear();

const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
  const status = carousel.querySelector('[data-carousel-status]');
  let currentSlide = 0;

  const showSlide = (nextIndex, announce = true) => {
    currentSlide = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const isActive = index === currentSlide;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.querySelectorAll('a, button').forEach((control) => {
        if (isActive) control.removeAttribute('tabindex');
        else control.setAttribute('tabindex', '-1');
      });
    });
    dots.forEach((dot, index) => {
      const isActive = index === currentSlide;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-selected', String(isActive));
    });
    status.textContent = `Episode ${currentSlide + 1} of ${slides.length}`;
    if (announce) carousel.dataset.currentSlide = String(currentSlide + 1);
  };

  carousel.querySelector('[data-carousel-prev]').addEventListener('click', () => showSlide(currentSlide - 1));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => showSlide(currentSlide + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => showSlide(Number(dot.dataset.carouselDot))));
  carousel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showSlide(currentSlide - 1);
    if (event.key === 'ArrowRight') showSlide(currentSlide + 1);
  });
  showSlide(0, false);
}
