const CELLS_TOTAL = 25;
const MAX_ATTEMPTS = 5;
const RECHARGE_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

let revealedCells = new Set();
let prizePositions = [];
let winCount = 0;
let totalPrizeValue = 0;
let sessionSeconds = 0;

// --- Sistema de créditos diarios ---
function getCredits() {
  const data = JSON.parse(localStorage.getItem("dailyCredits"));
  const now = Date.now();

  if (!data || now - data.timestamp >= RECHARGE_INTERVAL) {
    const newData = { credits: MAX_ATTEMPTS, timestamp: now };
    localStorage.setItem("dailyCredits", JSON.stringify(newData));
    return MAX_ATTEMPTS;
  }

  return data.credits;
}

function updateCredits(value) {
  const data = JSON.parse(localStorage.getItem("dailyCredits")) || { credits: MAX_ATTEMPTS, timestamp: Date.now() };
  data.credits = value;
  localStorage.setItem("dailyCredits", JSON.stringify(data));
}

// --- Inicializar juego ---
function initializeGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  revealedCells.clear();
  prizePositions = placePrizes();

  for (let i = 0; i < CELLS_TOTAL; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', handleCellClick);
    grid.appendChild(cell);
  }

  document.getElementById('attempts').textContent = getCredits();
  document.getElementById('prize-info').textContent = '';
}

// --- Colocar premios aleatorios ---
function placePrizes() {
  let positions = [];
  while (positions.length < 3) {
    const pos = Math.floor(Math.random() * CELLS_TOTAL);
    if (!positions.includes(pos)) positions.push(pos);
  }
  return positions;
}

// --- Click en casillero ---
function handleCellClick(event) {
  const credits = getCredits();
  if (credits <= 0) return;

  const cell = event.target;
  const index = parseInt(cell.dataset.index);
  if (revealedCells.has(index)) return;

  revealedCells.add(index);
  cell.classList.add('revealed');
  updateCredits(credits - 1);
  document.getElementById('attempts').textContent = getCredits();

  if (prizePositions.includes(index)) {
    setTimeout(() => awardPrize(cell, index), 800);
  }

  if (getCredits() === 0) {
    setTimeout(() => revealAllPrizes(), 1000);
  }
}

// --- Premios con peso ---
function getPrizeByIndex(index) {
  const prizeList = [
    { token: 'USDT', min: 50, max: 100 },
    { token: 'USDC', min: 20, max: 60 },
    { token: 'WLD', min: 1, max: 10 }
  ];
  return prizeList[index];
}

// --- Entregar premio ---
function awardPrize(cell, index) {
  const prize = getPrizeByIndex(prizePositions.indexOf(index));
  const amount = (Math.random() * (prize.max - prize.min) + prize.min).toFixed(2);
  const txId = "0x" + [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  cell.classList.add('mine');
  cell.innerHTML = `
    <div style="position:absolute;top:-35px;background:#000;padding:4px 8px;border:2px solid gold;border-radius:8px;color:#00ff96;font-weight:bold;box-shadow:0 0 10px gold;">
      ${amount} ${prize.token}
    </div>
  `;

  document.getElementById('prize-info').innerHTML = `
    <div class="prize-animation" style="font-size: 1.2em;">
      🎉 <strong>${amount} ${prize.token}</strong> ganados<br>
      <small>TX ID: ${txId}...</small><br><br>
      <div class="casino-alert">🚀 ¡Conecta tu wallet Metamask para reclamar tu premio ahora!</div>
    </div>
  `;

  document.getElementById("winSound").play();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  updateStats(amount);
}

// --- Revelar todos los premios no acertados ---
function revealAllPrizes() {
  prizePositions.forEach((pos, idx) => {
    const cell = document.querySelector(`.cell[data-index="${pos}"]`);
    if (!cell.classList.contains('mine')) {
      const prize = getPrizeByIndex(idx);
      const amount = (Math.random() * (prize.max - prize.min) + prize.min).toFixed(2);
      cell.classList.add('mine');
      cell.innerHTML = `
        <div style="position:absolute;top:-35px;background:#000;padding:4px 8px;border:2px solid #888;border-radius:8px;color:#aaa;font-weight:bold;">
          ${amount} ${prize.token}
        </div>
      `;
    }
  });

  if (!document.querySelector('.mine')) {
    document.getElementById('prize-info').innerHTML = `
      <div class="casino-alert">😢 No encontraste premios esta vez. ¡Intenta mañana!</div>
    `;
  }
}

// --- Reiniciar juego ---
function resetGame() {
  initializeGrid();
}

// --- Estadísticas ---
function updateStats(prizeValue) {
  winCount++;
  totalPrizeValue += parseFloat(prizeValue);
  document.getElementById("wins").textContent = winCount;
  document.getElementById("totalValue").textContent = totalPrizeValue.toFixed(2);
}

setInterval(() => {
  sessionSeconds++;
  const minutes = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
  const seconds = String(sessionSeconds % 60).padStart(2, '0');
  document.getElementById("sessionTime").textContent = `${minutes}:${seconds}`;
}, 1000);

// --- Inicializar al cargar ---
initializeGrid();
