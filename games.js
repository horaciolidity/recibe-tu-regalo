
const CELLS_TOTAL = 25;
const MAX_ATTEMPTS = 6;
const RECHARGE_INTERVAL = 60 * 60 * 1000; // 1 hora


let revealedCells = new Set();
let prizePositions = [];
let winCount = 0;
let totalPrizeValue = 0;
let sessionSeconds = 0;
let earnedTokens = {}; // { USDT: 100.23, WLD: 3.5, ... }

function getCreditsData() {
  return JSON.parse(localStorage.getItem("dailyCredits"));
}

function getCredits() {
  const data = getCreditsData();
  const now = Date.now();
  if (!data || now - data.timestamp >= RECHARGE_INTERVAL) {
    const newData = { credits: MAX_ATTEMPTS, timestamp: now };
    localStorage.setItem("dailyCredits", JSON.stringify(newData));
    return MAX_ATTEMPTS;
  }
  return data.credits;
}

function updateCredits(value) {
  const data = getCreditsData() || { credits: MAX_ATTEMPTS, timestamp: Date.now() };
  data.credits = value;
  localStorage.setItem("dailyCredits", JSON.stringify(data));
}

function initializeGrid() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  revealedCells.clear();
  prizePositions = placePrizes();
  document.getElementById('prize-info').textContent = '';
  document.getElementById('countdown').textContent = '';
  document.getElementById('attempts').textContent = getCredits();
  document.getElementById('detailed-tokens').innerHTML = getDetailedSummary();

  for (let i = 0; i < CELLS_TOTAL; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('click', handleCellClick);
    grid.appendChild(cell);
  }
}

function placePrizes() {
  let positions = [];
  while (positions.length < 3) {
    const pos = Math.floor(Math.random() * CELLS_TOTAL);
    if (!positions.includes(pos)) positions.push(pos);
  }
  return positions;
}

function handleCellClick(event) {
  const credits = getCredits();
  if (credits <= 0) {
    showCountdown();
    return;
  }

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

function getPrizeByIndex(index) {
  const prizeList = [
    { token: 'USDT', min: 0.50, max: 7.88 },
    { token: 'USDC', min: 1, max: 11.66 },
    { token: 'WLD', min: 0.1, max: 1.77 }
  ];
  return prizeList[index];
}

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

  // Guardar tokens ganados
  if (!earnedTokens[prize.token]) earnedTokens[prize.token] = 0;
  earnedTokens[prize.token] += parseFloat(amount);

  // Mostrar mensaje
  document.getElementById('prize-info').innerHTML = `
    🎉 Ganaste <strong>${amount} ${prize.token}</strong><br>
    <small>TX ID: ${txId}...</small><br><br>
    🔗 <strong>Conecta tu wallet (MetaMask) para reclamar tus tokens.</strong>
  `;

  document.getElementById('detailed-tokens').innerHTML = getDetailedSummary();

  const audio = document.getElementById("winSound");
  if (audio) audio.play();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  updateStats(amount);
}

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
}

function resetGame() {
  // Resetear créditos de prueba
  localStorage.setItem("dailyCredits", JSON.stringify({ credits: MAX_ATTEMPTS, timestamp: Date.now() }));
  initializeGrid();
}

function updateStats(prizeValue) {
  winCount++;
  totalPrizeValue += parseFloat(prizeValue);
  document.getElementById("wins").textContent = winCount;
  document.getElementById("totalValue").textContent = totalPrizeValue.toFixed(2);
}

function getDetailedSummary() {
  if (Object.keys(earnedTokens).length === 0)
    return '🎁 Aún no ganaste premios.<br><br>🦊 Conecta MetaMask para poder reclamar cuando ganes.';

  let resumen = '<strong>📦 Detalle de premios obtenidos:</strong><br>';
  for (const token in earnedTokens) {
    resumen += `• ${token}: ${earnedTokens[token].toFixed(2)}<br>`;
  }
  resumen += '<br>🔗 <strong>Conecta tu wallet (MetaMask) para reclamar estos tokens.</strong>';
  return resumen;
}
function copyLink() {
  const input = document.getElementById("refLink");
  input.select();
  input.setSelectionRange(0, 99999); // For mobile
  document.execCommand("copy");

  // Reproduce sonido
  const sound = document.getElementById("copySound");
  sound.play();

  // Feedback visual
  alert("¡Enlace copiado al cosmos!");
}

function showPopup(id) {
      const popup = document.getElementById(id);
      popup.style.display = 'block';

      setTimeout(() => {
        if (popup.style.display === 'block') {
          popup.style.display = 'none';
        }
      }, 5000); // Cerrar automáticamente a los 5s
    }

    function closePopup(id) {
      document.getElementById(id).style.display = 'none';
    }

    // Mostrar popups en diferentes momentos
    window.addEventListener("load", () => {
      showPopup('popup1');
      setTimeout(() => showPopup('popup2'), 10000);
      setTimeout(() => showPopup('popup3'), 20000);
    });
 function closeBanner() {
      document.getElementById("picassoBanner").style.display = "none";
    }

    // Mostrar banner a los 30 segundos
    window.addEventListener("load", () => {
      setTimeout(() => {
        const banner = document.getElementById("picassoBanner");
        banner.style.display = "block";

        // Ocultar automáticamente después de 30 segundos
        setTimeout(() => {
          if (banner.style.display === "block") {
            banner.style.display = "none";
          }
        }, 30000);
      }, 30000);
    });




function showCountdown() {
  const data = getCreditsData();
  if (!data) return;
  const now = Date.now();
  const timeLeft = RECHARGE_INTERVAL - (now - data.timestamp);
  if (timeLeft <= 0) return;
  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const el = document.getElementById('countdown');
  if (el) el.textContent = `⏳ Tiempo para nuevos intentos: ${hours}h ${minutes}m ${seconds}s`;
}

// Actualiza tiempo de sesión (esto ya estaba bien)
setInterval(() => {
  sessionSeconds++;
  const el = document.getElementById("sessionTime");
  if (el) {
    const minutes = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
    const seconds = String(sessionSeconds % 60).padStart(2, '0');
    el.textContent = `${minutes}:${seconds}`;
  }
}, 1000);

// ✅ Actualiza el countdown cada segundo
setInterval(showCountdown, 1000);

// Iniciar juego
initializeGrid();


