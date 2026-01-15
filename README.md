# AEGIS DAO

**Autonomous Economic Generation & Integration System**

A decentralized autonomous organization (DAO) for autonomous economic operations, built on Polygon using OpenZeppelin's battle-tested governance contracts.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AEGIS DAO                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │ AEGISToken  │───▶│AEGISGovernor│───▶│AEGISTreasury│ │
│  │   (ERC20)   │    │ (Governor)  │    │ (Timelock)  │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│        │                   │                  │        │
│        ▼                   ▼                  ▼        │
│   Voting Power        Proposals          Execution     │
│   Delegation          Voting             Delay         │
│                       Quorum             Security      │
│                                                        │
└────────────────────────────────────────────────────────┘
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
```

### Deploy to Testnet

1. Get Mumbai testnet MATIC from [Polygon Faucet](https://faucet.polygon.technology/)

2. Configure `.env`:
   ```
   PRIVATE_KEY=your_private_key
   MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
   ```

3. Deploy:
   ```bash
   npm run deploy:mumbai
   ```

4. Verify contracts (optional):
   ```bash
   npm run verify:mumbai
   ```

## Commands

```bash
npm run compile        # Compile contracts
npm test               # Run test suite
npm run test:coverage  # Run tests with coverage
npm run deploy:local   # Deploy to local Hardhat node
npm run deploy:mumbai  # Deploy to Polygon Mumbai
npm run deploy:polygon # Deploy to Polygon Mainnet
npm run verify:mumbai  # Verify contracts on Polygonscan
npm run node           # Start local Hardhat node
npm run clean          # Clean build artifacts
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
│   ├── AEGISToken.sol      # Governance token
│   ├── AEGISGovernor.sol   # DAO governance
│   └── AEGISTreasury.sol   # Timelock treasury
├── scripts/
│   ├── deploy.js           # Deployment script
│   └── verify.js           # Contract verification
├── test/
│   └── AEGIS.test.js       # Test suite
├── deployments/            # Deployment records (gitignored)
├── hardhat.config.js
├── package.json
└── .env.example
```

## Networks

| Network | Chain ID | Explorer |
|---------|----------|----------|
| Polygon Mainnet | 137 | [polygonscan.com](https://polygonscan.com) |
| Mumbai Testnet | 80001 | [mumbai.polygonscan.com](https://mumbai.polygonscan.com) |

## Next Steps After Deployment

1. **Distribute Tokens**: Send AEGIS to initial DAO members
2. **Fund Treasury**: Transfer operational funds to treasury contract
3. **Create First Proposal**: Test the governance system
4. **Implement Revenue Strategies**: Per the AgenticProtocolsForAutonomousRevenue roadmap

## License

MIT

---

Built for autonomous economic systems.
