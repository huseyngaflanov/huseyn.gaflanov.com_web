const gallery = document.getElementById('gallery');
const fsView = document.getElementById('fs-view');
const fsViewImage = document.getElementById('fs-view-img');
const fsCounter = document.getElementById('fs-counter');
const fsDownload = document.getElementById('fs-download');
const fsNewTab = document.getElementById('fs-newtab');
const fsSpinner = document.getElementById('fs-spinner');
const fsExif = document.getElementById('fs-exif');
const fsExifLoading = document.getElementById('fs-exif-loading');
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

function formatShutter(val) {
  if (!val) return null;
  if (val >= 1) return `${val}s`;
  return `1/${Math.round(1 / val)}s`;
}

function formatDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function exifRow(label, value) {
  if (!value) return '';
  return `
    <div class="fs-exif-row">
      <span class="fs-exif-label">${label}</span>
      <span class="fs-exif-value">${value}</span>
    </div>
  `;
}

async function loadExif(url) {
  // Reset panel
  fsExifLoading.style.display = 'block';
  const existing = fsExif.querySelectorAll('.fs-exif-row');
  existing.forEach(el => el.remove());

  try {
    const exifr = await import('https://cdn.jsdelivr.net/npm/exifr@7/dist/full.esm.js');
    const data = await exifr.parse(url, {
      tiff: true, exif: true, gps: false,
      pick: ['Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime',
             'ISO', 'FocalLength', 'DateTimeOriginal', 'ExposureProgram',
             'MeteringMode', 'Flash', 'WhiteBalance']
    });

    fsExifLoading.style.display = 'none';

    if (!data) {
      fsExifLoading.textContent = 'No EXIF data found.';
      fsExifLoading.style.display = 'block';
      return;
    }

    const camera = (data.Make && data.Model?.startsWith(data.Make))
      ? data.Model
      : [data.Make, data.Model].filter(Boolean).join(' ');
    const aperture = data.FNumber ? `f/${data.FNumber}` : null;
    const shutter = formatShutter(data.ExposureTime);
    const iso = data.ISO ? `ISO ${data.ISO}` : null;
    const focal = data.FocalLength ? `${data.FocalLength}mm` : null;
    const date = formatDate(data.DateTimeOriginal);

    const rows = [
      exifRow('Date', date),
      exifRow('Camera', camera),
      exifRow('Lens', data.LensModel),
      exifRow('Aperture', aperture),
      exifRow('Shutter', shutter),
      exifRow('ISO', iso),
      exifRow('Focal Length', focal),
    ].join('');

    fsExif.insertAdjacentHTML('beforeend', rows);
  } catch (err) {
    fsExifLoading.textContent = 'Could not read EXIF.';
    fsExifLoading.style.display = 'block';
    console.error(err);
  }
}

function updateFS() {
  const key = photos[currentIndex];
  const url = `${BASE_URL}/originals/${key}`;

  fsSpinner.classList.remove('hidden');
  fsViewImage.classList.add('fs-img-hidden');
  fsViewImage.src = '';

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

  // .onclick = async () => {
  //   const res = await fetch(url);
  //   const blob = await res.blob();
  //   const a = document.createElement('a');
  //   a.href = URL.createObjectURL(blob);
  //   a.download = key;
  //   a.click();
  //   URL.revokeObjectURL(a.href);
  // };

  loadExif(url);
}

function nextPhoto() {
  currentIndex = (currentIndex + 1) % photos.length;
  updateFS();
}

function prevPhoto() {
  currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  updateFS();
}

function fsInfo() {
  fsExif.classList.toggle('fs-exif-display');
}

document.addEventListener('keydown', (e) => {
  if (!fsView.classList.contains('open')) return;
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'ArrowLeft') prevPhoto();
  if (e.key === 'Escape') closeFS();
});

loadPhotos();
fetch('/api/track', { method: 'GET' });
