// Network and contract configuration for AEGIS DAO

export const NETWORKS = {
  // Polygon Mainnet
  137: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    currency: { name: 'POL', symbol: 'POL', decimals: 18 },
    contracts: {
      token: '',
      governor: '',
      treasury: '',
    },
  },
  // Polygon Amoy Testnet
  80002: {
    name: 'Polygon Amoy',
    chainId: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    blockExplorer: 'https://amoy.polygonscan.com',
    currency: { name: 'POL', symbol: 'POL', decimals: 18 },
    contracts: {
      token: '',
      governor: '',
      treasury: '',
    },
  },
  // Hardhat Local
  31337: {
    name: 'Localhost',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    currency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    contracts: {
      token: '',
      governor: '',
      treasury: '',
    },
  },
};

export const SUPPORTED_CHAIN_IDS = Object.keys(NETWORKS).map(Number);

export const DEFAULT_CHAIN_ID = 80002;

// Governance constants matching the smart contract parameters
export const GOVERNANCE = {
  VOTING_DELAY_BLOCKS: 7200,
  VOTING_PERIOD_BLOCKS: 50400,
  QUORUM_PERCENT: 4,
  PROPOSAL_THRESHOLD: 0,
  TIMELOCK_DELAY_SECONDS: 86400,
  BLOCK_TIME_SECONDS: 12,
};

// Proposal states from Governor.sol
export const PROPOSAL_STATES = {
  0: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  1: { label: 'Active', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' },
  2: { label: 'Canceled', color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30' },
  3: { label: 'Defeated', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
  4: { label: 'Succeeded', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
  5: { label: 'Queued', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/30' },
  6: { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  7: { label: 'Executed', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
};

export const VOTE_TYPES = {
  AGAINST: 0,
  FOR: 1,
  ABSTAIN: 2,
};
