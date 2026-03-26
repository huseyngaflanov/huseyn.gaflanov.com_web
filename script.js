const gallery = document.getElementById('gallery');
const fsView = document.getElementById('fs-view');
const fsViewImage = document.getElementById('fs-view-img');
const fsCounter = document.getElementById('fs-counter');
const fsDownload = document.getElementById('fs-download');
const fsSpinner = document.getElementById('fs-spinner');
const loading = document.getElementById('loading');

const BASE_URL = 'https://pub-b18bf20fb6ff4e5c89ebcf08c3f1d603.r2.dev';

let photos = [];
let currentIndex = 0;

async function loadPhotos() {
  try {
    const res = await fetch('/api/photos');
    photos = await res.json();

    loading.classList.add('hidden');
    gallery.innerHTML = '';

    photos.forEach((key, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.onclick = () => openFS(index);

      const img = document.createElement('img');
      img.alt = key;
      img.onload = () => img.classList.add('loaded');
      img.src = `${BASE_URL}/thumbs/${key}`;

      item.appendChild(img);
      gallery.appendChild(item);
    });
  } catch (err) {
    loading.textContent = 'Failed to load photos.';
    console.error(err);
  }
}

function openFS(index) {
  currentIndex = index;
  updateFS();
  fsView.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeFS() {
  fsView.classList.remove('open');
  fsViewImage.src = '';
  document.body.style.overflow = '';
}

function updateFS() {
  const key = photos[currentIndex];
  const url = `${BASE_URL}/originals/${key}`;

  // Show spinner, hide image while loading
  fsSpinner.classList.remove('hidden');
  fsViewImage.classList.add('fs-img-hidden');
  fsViewImage.src = '';

  // Load the image
  const tempImg = new Image();
  tempImg.onload = () => {
    fsViewImage.src = url;
    fsViewImage.classList.remove('fs-img-hidden');
    fsSpinner.classList.add('hidden');
  };
  tempImg.onerror = () => {
    fsSpinner.classList.add('hidden');
  };
  tempImg.src = url;

  fsCounter.textContent = `${currentIndex + 1} / ${photos.length}`;

  fsDownload.onclick = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = key;
    a.target = '_blank';
    a.click();
  };
}

function nextPhoto() {
  currentIndex = (currentIndex + 1) % photos.length;
  updateFS();
}

function prevPhoto() {
  currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  updateFS();
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!fsView.classList.contains('open')) return;
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'ArrowLeft') prevPhoto();
  if (e.key === 'Escape') closeFS();
});

loadPhotos();

fetch('/api/track', { method: 'GET' });
