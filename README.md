# AEGIS DAO

**Autonomous Economic Generation & Integration System**

A decentralized autonomous organization (DAO) for autonomous economic operations, built on Polygon using OpenZeppelin's battle-tested governance contracts.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          AEGIS DAO                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    Frontend (React + Vite)                     │  │
│  │  Dashboard │ Governance │ Token │ Treasury │ Proposal Detail  │  │
│  └──────┬─────────────┬─────────────┬────────────────────────────┘  │
│         │             │             │                                │
│         ▼             ▼             ▼                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│  │ AEGISToken  │─│AEGISGovernor│─│AEGISTreasury│                   │
│  │   (ERC20)   │ │ (Governor)  │ │ (Timelock)  │                   │
│  └─────────────┘ └─────────────┘ └─────────────┘                   │
│        │                │                │                           │
│        ▼                ▼                ▼                           │
│   Voting Power     Proposals        Execution                       │
│   Delegation       Voting           Delay                           │
│                    Quorum           Security                        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Contracts

| Contract | Description |
|----------|-------------|
| `AEGISToken.sol` | ERC20 governance token with voting (ERC20Votes) |
| `AEGISGovernor.sol` | OpenZeppelin Governor with timelock integration |
| `AEGISTreasury.sol` | TimelockController for secure fund management |

## Governance Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| Voting Delay | 7,200 blocks | ~1 day before voting starts |
| Voting Period | 50,400 blocks | ~1 week to cast votes |
| Quorum | 4% | Minimum participation required |
| Proposal Threshold | 0 | Anyone can create proposals |
| Timelock Delay | 86,400 seconds | 1 day delay before execution |

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Clone and install
cd AEGIS-DAO
npm install

# Configure environment
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### Local Development

```bash
# Start local node
npm run node

# Deploy locally (in another terminal)
npm run deploy:local

# Run tests
npm test

# Start the frontend (in another terminal)
npm run frontend:install
npm run frontend:dev
```

### Deploy to Testnet

1. Get Amoy testnet POL from [Polygon Faucet](https://faucet.polygon.technology/)

2. Configure `.env`:
   ```
   PRIVATE_KEY=your_private_key
   AMOY_RPC_URL=https://rpc-amoy.polygon.technology
   ```

3. Deploy:
   ```bash
   npm run deploy:amoy
   ```

4. Verify contracts (optional):
   ```bash
   npm run verify:amoy
   ```

## Commands

```bash
npm run compile        # Compile contracts
npm test               # Run test suite
npm run test:coverage  # Run tests with coverage
npm run deploy:local   # Deploy to local Hardhat node
npm run deploy:amoy    # Deploy to Polygon Amoy testnet
npm run deploy:polygon # Deploy to Polygon Mainnet
npm run verify:amoy    # Verify contracts on Polygonscan
npm run node           # Start local Hardhat node
npm run clean          # Clean build artifacts
npm run frontend:dev   # Start frontend dev server
npm run frontend:build # Build frontend for production
```

## Governance Workflow

```
1. PROPOSE
   └── Token holder creates proposal with targets, values, calldatas

2. VOTING DELAY (1 day)
   └── Community reviews proposal

3. VOTING PERIOD (1 week)
   └── Token holders cast votes (For/Against/Abstain)

4. QUORUM CHECK
   └── Proposal passes if quorum met (4%) and majority votes For

5. QUEUE
   └── Successful proposal queued in Timelock

6. TIMELOCK DELAY (1 day)
   └── Security delay - users can exit if they disagree

7. EXECUTE
   └── Anyone can execute after timelock delay
```

## Security Features

- **Timelock Controller**: All actions have a mandatory delay
- **Quorum Requirement**: Prevents minority takeover
- **OpenZeppelin Base**: Battle-tested, audited contracts
- **No Admin Keys**: After deployment, only governance controls the DAO

## Project Structure

```
AEGIS-DAO/
├── contracts/
│   ├── AEGISToken.sol         # Governance token (ERC20 + Votes)
│   ├── AEGISGovernor.sol      # DAO governance (proposals, voting)
│   └── AEGISTreasury.sol      # Timelock treasury
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── layout/        # Header, Sidebar
│   │   │   ├── common/        # ConnectWallet, NetworkBadge, TransactionStatus
│   │   │   └── ...
│   │   ├── constants/         # ABIs, network config, governance params
│   │   ├── contexts/          # Web3Context (wallet, contracts, provider)
│   │   ├── hooks/             # useToken, useGovernor, useTreasury
│   │   ├── pages/             # Dashboard, Token, Governance, Treasury, ProposalDetail
│   │   ├── utils/             # Formatting helpers
│   │   ├── App.jsx            # Root component with routing
│   │   └── main.jsx           # Entry point
│   ├── package.json
│   └── vite.config.js
├── scripts/
│   ├── deploy.js              # Deployment script
│   └── verify.js              # Contract verification
├── test/
│   └── AEGIS.test.js          # Test suite
├── deployments/               # Deployment records (gitignored)
├── hardhat.config.js
├── package.json
└── .env.example
```

## Frontend

The frontend is a React SPA (Vite + Tailwind CSS) that provides a complete interface for all DAO operations.

### Pages

| Page | Path | Features |
|------|------|----------|
| Dashboard | `/` | DAO stats, your position, governance parameters, recent proposals, workflow guide |
| Governance | `/governance` | Proposal list with state filters, create new proposals (token transfer or custom calldata) |
| Proposal Detail | `/governance/proposal/:id` | Full proposal view: timeline, vote breakdown, cast vote (For/Against/Abstain with reason), queue, execute, cancel |
| Token | `/token` | Balance overview, transfer tokens, delegate voting power, approve spenders, check allowances |
| Treasury | `/treasury` | Treasury balance, deposit funds, check roles (PROPOSER/EXECUTOR/ADMIN), check operation status |

### Contract Integration

Every public function from all three smart contracts is accessible through the frontend:

**AEGISToken**: `balanceOf`, `transfer`, `approve`, `allowance`, `delegate`, `delegates`, `getVotes`, `getPastVotes`, `totalSupply`, `name`, `symbol`, `decimals`

**AEGISGovernor**: `propose`, `castVote`, `castVoteWithReason`, `queue`, `execute`, `cancel`, `state`, `proposalVotes`, `proposalSnapshot`, `proposalDeadline`, `proposalProposer`, `proposalEta`, `hasVoted`, `votingDelay`, `votingPeriod`, `proposalThreshold`, `quorum`

**AEGISTreasury**: `getMinDelay`, `hasRole`, `PROPOSER_ROLE`, `EXECUTOR_ROLE`, `DEFAULT_ADMIN_ROLE`, `isOperationPending`, `isOperationReady`, `isOperationDone`, `getOperationState`, `receive()` (deposit)

### Configuration

After deploying contracts, update the contract addresses in `frontend/src/constants/config.js`:

```js
// In NETWORKS[chainId].contracts
contracts: {
  token: '0x...deployed-token-address',
  governor: '0x...deployed-governor-address',
  treasury: '0x...deployed-treasury-address',
}
```

## Networks

| Network | Chain ID | Explorer |
|---------|----------|----------|
| Polygon Mainnet | 137 | [polygonscan.com](https://polygonscan.com) |
| Amoy Testnet | 80002 | [amoy.polygonscan.com](https://amoy.polygonscan.com) |

## Next Steps After Deployment

1. **Update Frontend Config**: Set contract addresses in `frontend/src/constants/config.js`
2. **Launch Frontend**: Run `npm run frontend:dev` to start the UI
3. **Distribute Tokens**: Send AEGIS to initial DAO members via the Token page
4. **Fund Treasury**: Deposit operational funds via the Treasury page
5. **Create First Proposal**: Test governance through the Governance page
6. **Implement Revenue Strategies**: Per the AgenticProtocolsForAutonomousRevenue roadmap

## License

MIT

---

Built for autonomous economic systems.
