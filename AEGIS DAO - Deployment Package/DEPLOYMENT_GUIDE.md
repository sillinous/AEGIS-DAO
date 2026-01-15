# 🎯 AEGIS DEPLOYMENT GUIDE - Step by Step

## PHASE 1: PREPARATION (5 minutes)

### Step 1: Download Package
✓ You have the AEGIS-Deploy folder

### Step 2: Navigate to Directory
```bash
cd AEGIS-Deploy
```

### Step 3: Install Dependencies
```bash
npm install
```

Expected output: Installation of Hardhat, OpenZeppelin, and tooling

---

## PHASE 2: CONFIGURATION (3 minutes)

### Step 4: Set Up Environment
```bash
cp .env.example .env
```

### Step 5: Add Your Private Key
Edit `.env` file:
```
PRIVATE_KEY=0x_your_private_key_here
```

⚠️ **IMPORTANT**: 
- Use a TEST wallet for Mumbai
- Never use your main wallet's private key
- Never commit .env to git

### Step 6: Get Test MATIC
1. Visit: https://faucet.polygon.technology/
2. Select "Mumbai" network
3. Enter your wallet address
4. Click "Submit"
5. Wait ~1 minute for MATIC to arrive

Verify you have MATIC:
- Check your wallet on Mumbai network
- Should see ~0.5 MATIC or more

---

## PHASE 3: COMPILATION (2 minutes)

### Step 7: Compile Contracts
```bash
npm run compile
```

Expected output:
```
Compiled 2 Solidity files successfully
```

If errors occur:
- Check Node.js version (v16+ required)
- Run `npm install` again
- Check Solidity versions in contracts

---

## PHASE 4: DEPLOYMENT (5 minutes)

### Step 8: Deploy to Mumbai
```bash
npm run deploy:mumbai
```

Expected output:
```
🚀 Starting AEGIS Deployment to Mumbai Testnet...

📍 Deploying from: 0x...
💰 Balance: ... wei

📜 Deploying AEGISToken...
✅ AEGISToken deployed to: 0x...

📜 Deploying AEGISGovernor...
✅ AEGISGovernor deployed to: 0x...

✅ Deployment complete!
```

### Step 9: Save Contract Addresses
Copy both addresses to a secure location:
- **AEGISToken**: 0x...
- **AEGISGovernor**: 0x...

---

## PHASE 5: VERIFICATION (10 minutes)

### Step 10: Check Deployment on PolygonScan
1. Visit: https://mumbai.polygonscan.com/
2. Paste your Token address
3. Verify:
   - ✓ Contract exists
   - ✓ Has code (not just address)
   - ✓ Shows token details

### Step 11: Add Token to MetaMask
1. Open MetaMask
2. Switch to Mumbai network
3. Click "Import Token"
4. Paste AEGISToken address
5. Should show "AEGIS" with 1,000,000 balance

### Step 12: Test Token Transfer (Optional)
```bash
# In Hardhat console
npx hardhat console --network mumbai
> const token = await ethers.getContractAt("AEGISToken", "YOUR_TOKEN_ADDRESS")
> await token.transfer("RECIPIENT_ADDRESS", ethers.parseEther("100"))
```

---

## PHASE 6: GOVERNANCE SETUP (Optional)

### Step 13: Delegate Voting Power
Before creating proposals, you need voting power:

```bash
npx hardhat console --network mumbai
> const token = await ethers.getContractAt("AEGISToken", "YOUR_TOKEN_ADDRESS")
> await token.delegate("YOUR_ADDRESS")
```

Wait 1 block for delegation to take effect.

### Step 14: Create Test Proposal
```bash
> const governor = await ethers.getContractAt("AEGISGovernor", "YOUR_GOVERNOR_ADDRESS")
> const proposal = await governor.propose(
    ["0x0000000000000000000000000000000000000000"],
    [0],
    ["0x"],
    "Test Proposal: Verify Governance"
  )
```

---

## 🎯 SUCCESS CRITERIA

You've successfully deployed AEGIS if:
- [x] Both contracts deployed without errors
- [x] Token shows in PolygonScan
- [x] Token appears in MetaMask
- [x] You can delegate voting power
- [x] (Optional) You can create proposals

---

## 🚀 NEXT STEPS

### Immediate (Next 24 hours):
1. **Treasury Setup**: Deploy Safe multisig
2. **Token Distribution**: Send tokens to team/community
3. **First Proposal**: Create governance test

### Short-term (Next week):
1. **Revenue Integration**: Connect DeFi strategies
2. **Agent Setup**: Deploy first autonomous agents
3. **Monitoring**: Set up treasury tracking

### Medium-term (Next month):
1. **Scale Testing**: Multi-agent coordination
2. **Revenue Validation**: Verify autonomous income
3. **Mainnet Planning**: Prepare for production

---

## 🆘 COMMON ISSUES

**"Insufficient funds"**
```bash
# Get more test MATIC from faucet
# Wait a few minutes and try again
```

**"Nonce too high"**
```bash
# Reset MetaMask account:
# Settings → Advanced → Reset Account
```

**"Contract not found"**
```bash
# Wait 30 seconds for block confirmation
# Check transaction hash on PolygonScan
```

**"Compilation error"**
```bash
# Clean and reinstall:
rm -rf node_modules artifacts cache
npm install
npm run compile
```

---

## 📞 SUPPORT

If you encounter issues:
1. Check error message carefully
2. Search Hardhat documentation
3. Verify Mumbai network is operational
4. Review deployment transaction on PolygonScan

---

**You're ready to deploy! Execute the commands in order and watch AEGIS come to life. 🛡️**
