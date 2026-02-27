export const NETWORKS = {
  31337: {
    name: "Localhost",
    currency: "ETH",
    explorer: "",
    rpc: "http://127.0.0.1:8545",
  },
  80002: {
    name: "Polygon Amoy",
    currency: "POL",
    explorer: "https://amoy.polygonscan.com",
    rpc: "https://rpc-amoy.polygon.technology",
  },
  137: {
    name: "Polygon",
    currency: "POL",
    explorer: "https://polygonscan.com",
    rpc: "https://polygon-rpc.com",
  },
};

export const CONTRACTS = {
  token: import.meta.env.VITE_TOKEN_ADDRESS || "",
  governor: import.meta.env.VITE_GOVERNOR_ADDRESS || "",
  treasury: import.meta.env.VITE_TREASURY_ADDRESS || "",
};

export const SUPPORTED_CHAIN_IDS = Object.keys(NETWORKS).map(Number);
