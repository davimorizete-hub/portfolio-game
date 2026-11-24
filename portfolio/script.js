const colors = [
  { name: 'Vermelho', value: '#ff4d4d' },
  { name: 'Azul', value: '#4d7cff' },
  { name: 'Amarelo', value: '#f2d13d' },
  { name: 'Verde', value: '#4dcf7d' },
  { name: 'Laranja', value: '#ff9d45' },
  { name: 'Roxo', value: '#b56dff' }
];

const gameCatalog = {
  1: {
    title: 'Jogo 1',
    description: 'Este é um jogo do Roblox baseado em Geometry Dash.',
    url: 'https://www.roblox.com/pt/games/109733024584426/Runner',
  },
  2: {
    title: 'Jogo 2',
    description: 'Este é o meu primeiro jogo do Roblox em que você precisa tocar em um cilindro brilhante.',
    url: 'https://www.roblox.com/pt/games/127204104262462/Touch-the-white-cylinder',
  },
  3: {
    title: 'Jogo 3',
    description: 'Este é um jogo do Scratch em que você precisa criar objetos para passar.',
    url: 'https://scratch.mit.edu/projects/1073900111',
    embedUrl: 'https://scratch.mit.edu/projects/1073900111/embed',
  },
};

const PENCIL_COUNT = 18;
const MINIMUM_SAME_COLOR = 3;
const GAME_WIDTH = 900;
const GAME_HEIGHT = 620;
const FLOOR_Y = 540;
const GRAVITY = 0.25;
const BUCKET_COUNT = colors.length;

const appState = {
  pencils: [],
  buckets: [],
  draggingPencilId: null,
  correctCount: 0,
  won: false,
};

let pencilLayer = document.getElementById('pencilLayer');
let bucketLayer = document.getElementById('bucketLayer');
const lapisQuantidade = document.getElementById('lapis-quantidade');
const lapisCorretos = document.getElementById('lapis-corretos');
const winOverlay = document.getElementById('winOverlay');
const gameSelectionPanel = document.getElementById('gameSelectionPanel');
const gameDetailPanel = document.getElementById('gameDetailPanel');
const detailTitle = document.getElementById('detailTitle');
const detailDescription = document.getElementById('detailDescription');
const enterGameButton = document.getElementById('enterGameButton');
const backGameButton = document.getElementById('backGameButton');

let selectedGame = null;

function ensureGameLayers() {
  const gameArea = document.getElementById('gameArea');

  if (!gameArea) {
    return;
  }

  if (!pencilLayer) {
    pencilLayer = document.createElement('div');
    pencilLayer.id = 'pencilLayer';
    pencilLayer.className = 'pencil-layer';
    gameArea.appendChild(pencilLayer);
  }

  if (!bucketLayer) {
    bucketLayer = document.createElement('div');
    bucketLayer.id = 'bucketLayer';
    bucketLayer.className = 'bucket-layer';
    gameArea.insertBefore(bucketLayer, pencilLayer);
  }
}

function createBuckets() {
  ensureGameLayers();

  if (!bucketLayer) {
    return;
  }

  const bucketDefinitions = colors.map((color, index) => ({
    id: index + 1,
    color,
    position: index,
  }));

  bucketDefinitions.forEach(({ id, color }) => {
    const bucket = document.createElement('div');
    bucket.className = 'bucket';
    bucket.dataset.bucketId = String(id);
    bucket.dataset.colorName = color.name;
    bucket.style.background = `linear-gradient(180deg, ${color.value}, ${color.value}cc)`;
    bucket.style.borderColor = `${color.value}aa`;

    const label = document.createElement('span');
    label.className = 'bucket-label';
    label.textContent = color.name;
    bucket.appendChild(label);

    bucketLayer.appendChild(bucket);

    appState.buckets.push({
      id,
      name: color.name,
      colorKey: id,
      x: 0,
      y: 0,
      width: 180,
      height: 94,
      element: bucket,
    });
  });

  positionBuckets();
}

function positionBuckets() {
  const gameArea = document.getElementById('gameArea');
  if (!gameArea) return;

  const gameAreaRect = gameArea.getBoundingClientRect();
  const bucketWidth = 110;
  const bucketHeight = 96;
  const gap = 18;
  const totalWidth = bucketWidth * colors.length + gap * (colors.length - 1);
  const startX = Math.max(30, (gameAreaRect.width - totalWidth) / 2 - 290);
  const startY = gameAreaRect.height - bucketHeight - 26;

  appState.buckets.forEach((bucketData, index) => {
    bucketData.x = startX + index * (bucketWidth + gap);
    bucketData.y = startY;
    bucketData.width = bucketWidth;
    bucketData.height = bucketHeight;
    bucketData.element.style.left = `${bucketData.x}px`;
    bucketData.element.style.top = `${bucketData.y}px`;
    bucketData.element.style.width = `${bucketData.width}px`;
    bucketData.element.style.height = `${bucketData.height}px`;
  });
}

function createPencils() {
  ensureGameLayers();

  if (!pencilLayer) {
    return;
  }

  appState.pencils = [];

  const totalColors = colors.length;
  const pencilsPerColor = Math.floor(PENCIL_COUNT / totalColors);
  const remainder = PENCIL_COUNT % totalColors;
  const colorOrder = [];

  for (let colorIndex = 0; colorIndex < totalColors; colorIndex += 1) {
    const count = pencilsPerColor + (colorIndex < remainder ? 1 : 0);
    for (let i = 0; i < count; i += 1) {
      colorOrder.push(colorIndex + 1);
    }
  }

  shuffle(colorOrder);

  for (let index = 0; index < colorOrder.length; index += 1) {
    const colorIndex = colorOrder[index] - 1;
    const pencil = document.createElement('div');
    pencil.className = 'pencil';
    pencil.dataset.pencilId = String(index);
    pencil.dataset.colorId = String(colorIndex + 1);
    pencil.style.background = `linear-gradient(90deg, ${colors[colorIndex].value}, ${colors[colorIndex].value}cc)`;
    pencil.style.borderColor = `${colors[colorIndex].value}aa`;

    const x = 120 + (index % 6) * 120 + Math.random() * 30;
    const y = 30 + Math.floor(index / 6) * 30;

    const pencilData = {
      id: index,
      colorId: colorIndex + 1,
      colorName: colors[colorIndex].name,
      x,
      y,
      width: 110,
      height: 15,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0,
      dragging: false,
      inBucket: false,
      bucketId: null,
      element: pencil,
    };

    pencil.style.left = `${x}px`;
    pencil.style.top = `${y}px`;
    pencil.style.transform = 'rotate(0deg)';
    pencilLayer.appendChild(pencil);

    appState.pencils.push(pencilData);
    attachPencilEvents(pencil, pencilData);
  }

  lapisQuantidade.textContent = String(appState.pencils.length);
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

function attachPencilEvents(pencil, pencilData) {
  pencil.addEventListener('pointerdown', (event) => {
    if (appState.won) return;
    if (pencilData.inBucket) return;

    appState.draggingPencilId = pencilData.id;
    pencilData.dragging = true;
    pencil.classList.add('dragging');
    pencil.setPointerCapture(event.pointerId);
    pencil.style.zIndex = '20';
  });

  pencil.addEventListener('pointermove', (event) => {
    if (appState.draggingPencilId !== pencilData.id || !pencilData.dragging) return;

    const areaRect = pencilLayer.getBoundingClientRect();
    const x = Math.max(20, Math.min(GAME_WIDTH - pencilData.width - 20, event.clientX - areaRect.left - pencilData.width / 2));
    const y = Math.max(20, Math.min(GAME_HEIGHT - pencilData.height - 20, event.clientY - areaRect.top - pencilData.height / 2));

    pencilData.x = x;
    pencilData.y = y;
    pencilData.vx = 0;
    pencilData.vy = 0;
    updatePencilPosition(pencilData);
  });

  pencil.addEventListener('pointerup', (event) => handlePencilDrop(pencilData, event));
  pencil.addEventListener('pointercancel', (event) => handlePencilDrop(pencilData, event));
  pencil.addEventListener('pointerleave', (event) => {
    if (appState.draggingPencilId === pencilData.id && pencilData.dragging) {
      handlePencilDrop(pencilData, event);
    }
  });
}

function updatePencilPosition(pencilData) {
  pencilData.element.style.left = `${pencilData.x}px`;
  pencilData.element.style.top = `${pencilData.y}px`;
  pencilData.element.style.transform = `rotate(${Math.atan2(pencilData.vy, pencilData.vx || 0.1) * 40}deg)`;
}

function handlePencilDrop(pencilData, event) {
  if (!pencilData.dragging) return;

  pencilData.dragging = false;
  pencilData.element.classList.remove('dragging');
  pencilData.element.style.zIndex = '1';
  appState.draggingPencilId = null;

  const bucketMatch = findBucketForPencil(pencilData, event);

  if (bucketMatch) {
    const bucket = appState.buckets.find((item) => item.id === bucketMatch.id);
    pencilData.inBucket = true;
    pencilData.bucketId = bucket.id;
    pencilData.vx = 0;
    pencilData.vy = 0;
    pencilData.x = bucket.x + bucket.width / 2 - pencilData.width / 2 + 4;
    pencilData.y = bucket.y + bucket.height - 24;
    updatePencilPosition(pencilData);
    evaluateWinState();
    return;
  }

  pencilData.vx = (Math.random() - 0.5) * 2;
  pencilData.vy = 0.5;
}

function findBucketForPencil(pencilData, event) {
  if (!event) return null;

  const pointerX = event.clientX;
  const pointerY = event.clientY;

  return appState.buckets.find((bucket) => {
    const rect = bucket.element.getBoundingClientRect();
    const insideX = pointerX >= rect.left && pointerX <= rect.right;
    const insideY = pointerY >= rect.top && pointerY <= rect.bottom;
    const sameColor = bucket.colorKey === pencilData.colorId;

    const bucketCenterX = rect.left + rect.width / 2;
    const bucketCenterY = rect.top + rect.height * 0.72;
    const nearCenterX = Math.abs(pointerX - bucketCenterX) <= rect.width * 0.45;
    const nearCenterY = Math.abs(pointerY - bucketCenterY) <= rect.height * 0.42;

    return insideX && insideY && sameColor && nearCenterX && nearCenterY;
  });
}

function evaluateWinState() {
  const correctPencils = appState.pencils.filter((p) => p.inBucket && p.bucketId === p.colorId);
  appState.correctCount = correctPencils.length;
  lapisCorretos.textContent = String(appState.correctCount);

  if (correctPencils.length === PENCIL_COUNT) {
    appState.won = true;
    winOverlay.classList.remove('hidden');
  }
}

function updatePencils() {
  for (const pencilData of appState.pencils) {
    if (pencilData.dragging || pencilData.inBucket) continue;

    pencilData.vy += GRAVITY;
    pencilData.x += pencilData.vx;
    pencilData.y += pencilData.vy;

    if (pencilData.x <= 0 || pencilData.x >= GAME_WIDTH - pencilData.width) {
      pencilData.x = Math.max(0, Math.min(GAME_WIDTH - pencilData.width, pencilData.x));
      pencilData.vx *= -0.7;
    }

    if (pencilData.y >= FLOOR_Y - pencilData.height) {
      pencilData.y = FLOOR_Y - pencilData.height;
      pencilData.vy *= -0.2;
      pencilData.vx *= 0.96;

      if (Math.abs(pencilData.vy) < 0.12) {
        pencilData.vy = 0;
      }
    }

    updatePencilPosition(pencilData);
  }
}

function showGameSelection() {
  gameSelectionPanel.classList.remove('hidden');
  gameDetailPanel.classList.add('hidden');
  selectedGame = null;
}

function showGameDetail(gameKey) {
  const game = gameCatalog[gameKey];
  if (!game) {
    return;
  }

  selectedGame = gameKey;
  detailTitle.textContent = game.title;
  detailDescription.textContent = game.description;
  gameSelectionPanel.classList.add('hidden');
  gameDetailPanel.classList.remove('hidden');
}

function attachGameButtons() {
  document.querySelectorAll('.game-button').forEach((button) => {
    button.addEventListener('click', () => {
      showGameDetail(button.dataset.game);
    });
  });

  backGameButton.addEventListener('click', () => {
    showGameSelection();
  });

  enterGameButton.addEventListener('click', () => {
    if (!selectedGame) {
      return;
    }

    const game = gameCatalog[selectedGame];
    if (!game) {
      return;
    }

    window.open(game.url, '_blank', 'noopener,noreferrer');
  });
}

function initializeGame() {
  ensureGameLayers();
  createBuckets();
  createPencils();
  attachGameButtons();
  showGameSelection();

  function loop() {
    updatePencils();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  positionBuckets();
  appState.pencils.forEach((pencil) => {
    if (pencil.inBucket) {
      pencil.x = Math.min(pencil.x, GAME_WIDTH - pencil.width - 20);
      pencil.y = Math.min(pencil.y, FLOOR_Y - pencil.height);
      updatePencilPosition(pencil);
    }
  });
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}
