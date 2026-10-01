const grid = document.querySelector('#videoGrid');
const count = document.querySelector('#count');
const emptyState = document.querySelector('#emptyState');
const dialog = document.querySelector('#playerDialog');
const player = document.querySelector('#player');
const playerTitle = document.querySelector('#playerTitle');
const playerMeta = document.querySelector('#playerMeta');
const closeButton = document.querySelector('#closeButton');
const fullscreenButton = document.querySelector('#fullscreenButton');

let cards = [];
let focusedIndex = 0;

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = Math.floor(seconds % 60);
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
    : `${minutes}:${String(rest).padStart(2, '0')}`;
}

function openVideo(video) {
  player.src = video.src;
  player.poster = video.poster || '';
  playerTitle.textContent = video.title;
  playerMeta.textContent = video.description || '';
  dialog.showModal();
  player.play().catch(() => {});
}

function closePlayer() {
  player.pause();
  player.removeAttribute('src');
  player.load();
  dialog.close();
  cards[focusedIndex]?.focus();
}

function createCard(video, index) {
  const card = document.createElement('button');
  card.className = 'video-card';
  card.type = 'button';
  card.dataset.index = index;
  card.innerHTML = `
    <span class="thumb"></span>
    <span class="card-copy">
      <h2></h2>
      <p></p>
    </span>`;

  const thumb = card.querySelector('.thumb');
  const title = card.querySelector('h2');
  const meta = card.querySelector('p');
  title.textContent = video.title;
  meta.textContent = video.description || 'Открыть видео';
  if (video.poster) thumb.style.backgroundImage = `url("${video.poster}")`;

  card.addEventListener('click', () => {
    focusedIndex = index;
    openVideo(video);
  });
  card.addEventListener('focus', () => {
    focusedIndex = index;
    cards.forEach(item => item.classList.remove('is-focused'));
    card.classList.add('is-focused');
  });
  return card;
}

function moveFocus(key) {
  if (!cards.length || dialog.open) return;
  const columns = Math.max(1, Math.round(grid.clientWidth / cards[0].clientWidth));
  const shifts = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns };
  if (!(key in shifts)) return;
  focusedIndex = Math.max(0, Math.min(cards.length - 1, focusedIndex + shifts[key]));
  cards[focusedIndex].focus();
  cards[focusedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadVideos() {
  try {
    const response = await fetch('videos.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Cannot load video list');
    const videos = await response.json();
    cards = videos.map(createCard);
    cards.forEach(card => grid.append(card));
    count.textContent = `${videos.length} ${videos.length === 1 ? 'видео' : 'видео'}`;
    emptyState.hidden = videos.length > 0;
    if (cards[0]) cards[0].classList.add('is-focused');
  } catch (error) {
    count.textContent = 'Ошибка загрузки';
    emptyState.hidden = false;
    console.error(error);
  }
}

closeButton.addEventListener('click', closePlayer);
fullscreenButton.addEventListener('click', async () => {
  try {
    if (player.requestFullscreen) await player.requestFullscreen();
    else if (player.webkitEnterFullscreen) player.webkitEnterFullscreen();
  } catch (_) {}
});

dialog.addEventListener('cancel', event => {
  event.preventDefault();
  closePlayer();
});

document.addEventListener('keydown', event => {
  if (dialog.open) {
    if (event.key === 'Escape' || event.key === 'Backspace') closePlayer();
    if (event.key === 'ArrowLeft') player.currentTime = Math.max(0, player.currentTime - 10);
    if (event.key === 'ArrowRight') player.currentTime = Math.min(player.duration || Infinity, player.currentTime + 10);
    if (event.key === ' ' || event.key === 'Enter') player.paused ? player.play() : player.pause();
    return;
  }
  moveFocus(event.key);
});

document.addEventListener('contextmenu', event => {
  if (event.target.closest('video')) event.preventDefault();
});

loadVideos();
