const workLinks = Array.from(document.querySelectorAll('.work-card'));
const gallery = document.querySelector('.gallery');
const title = gallery.querySelector('h2');
const galleryImage = gallery.querySelector('img');
const count = gallery.querySelector('.gallery-count');
const original = gallery.querySelector('.gallery-original');
let currentIndex = 0;

function renderWork(index) {
  currentIndex = (index + workLinks.length) % workLinks.length;
  const link = workLinks[currentIndex];
  title.textContent = link.querySelector('.work-title').textContent;
  galleryImage.alt = link.querySelector('img').alt;
  galleryImage.src = link.href;
  original.hidden = !link.dataset.original;
  if (link.dataset.original) original.href = link.dataset.original;
  else original.removeAttribute('href');
  count.textContent = `${currentIndex + 1} из ${workLinks.length}`;
}

workLinks.forEach((link, index) => {
  link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !gallery.showModal) return;
    event.preventDefault();
    renderWork(index);
    gallery.showModal();
  });
});

gallery.querySelectorAll('[data-direction]').forEach((button) => {
  button.addEventListener('click', () => renderWork(currentIndex + Number(button.dataset.direction)));
});

gallery.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    renderWork(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});

gallery.addEventListener('click', (event) => {
  if (event.target !== gallery) return;
  const bounds = gallery.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    gallery.close();
  }
});

const worksTrack = document.querySelector('#works-track');
const worksControls = document.querySelector('.works-controls');
const [previousWork, nextWork] = worksControls.querySelectorAll('button');

function updateWorksControls() {
  const end = worksTrack.scrollWidth - worksTrack.clientWidth;
  previousWork.setAttribute('aria-disabled', String(worksTrack.scrollLeft <= 1));
  nextWork.setAttribute('aria-disabled', String(worksTrack.scrollLeft >= end - 1));
}

worksControls.addEventListener('click', event => {
  const button = event.target.closest('[data-works-direction]');
  if (!button || button.getAttribute('aria-disabled') === 'true') return;
  const [first, second] = workLinks;
  const distance = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
  worksTrack.scrollBy({
    left: Number(button.dataset.worksDirection) * distance,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  });
});

worksTrack.addEventListener('scroll', updateWorksControls, { passive: true });
new ResizeObserver(updateWorksControls).observe(worksTrack);
worksControls.hidden = false;
updateWorksControls();
