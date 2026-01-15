# 🛡️ AEGIS DAO - Deployment Package

**Autonomous Economic Generation & Integration System**

## 📦 Package Contents

```
AEGIS-Deploy/
├── contracts/
│   ├── AEGISToken.sol      # ERC20 governance token with voting
│   └── AEGISGovernor.sol   # Governor contract for DAO
├── scripts/
│   └── deploy.js           # Deployment script
├── hardhat.config.js       # Hardhat configuration
├── package.json            # Dependencies
├── .env.example            # Environment template
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### 3. Get Mumbai Testnet MATIC
- Visit: https://faucet.polygon.technology/
- Enter your wallet address
- Receive test MATIC

### 4. Deploy to Mumbai Testnet
```bash
npm run deploy:mumbai
```

## 🔧 Configuration

### Network Settings
- **Mumbai Testnet**: Chain ID 80001
- **Polygon Mainnet**: Chain ID 137

### Governance Parameters
- **Voting Delay**: 1 day (7200 blocks)
- **Voting Period**: 1 week (50400 blocks)
- **Quorum**: 4% of total supply
- **Proposal Threshold**: 0 (anyone can propose initially)

### Token Details
- **Name**: AEGIS Token
- **Symbol**: AEGIS
- **Initial Supply**: 1,000,000 AEGIS
- **Decimals**: 18

## 📋 Deployment Checklist

- [ ] Install Node.js dependencies
- [ ] Configure .env file with private key
- [ ] Get Mumbai testnet MATIC from faucet
- [ ] Run deployment script
- [ ] Save deployed contract addresses
- [ ] Verify contracts on Polygonscan (optional)

## 🎯 Post-Deployment

After successful deployment, you'll receive:
- **Token Contract Address**: For ERC20 interactions
- **Governor Contract Address**: For governance operations

### Next Steps:
1. **Distribute tokens** to initial DAO members
2. **Set up Safe multisig** for treasury
3. **Create first proposal** to test governance
4. **Implement revenue strategies** per Phase 1 roadmap

## 🔐 Security Notes

- Never commit your .env file
- Keep private keys secure
- Use hardware wallet for mainnet
- Test everything on Mumbai first

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Polygon Documentation](https://docs.polygon.technology/)

## ⚡ Commands Reference

```bash
# Compile contracts
npm run compile

# Deploy to Mumbai testnet
npm run deploy:mumbai

# Deploy to Polygon mainnet
npm run deploy:polygon
```

## 🆘 Troubleshooting

**Error: Insufficient funds**
- Get more Mumbai MATIC from faucet

**Error: Network connection**
- Check RPC URL in .env
- Try alternative RPC provider

**Error: Compilation failed**
- Run `npm install` again
- Check Solidity version compatibility

---

Built with 💙 for autonomous economic systems
