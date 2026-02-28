/**
 * Standalone deploy script using solc npm package directly.
 * Bypasses Hardhat's compiler download when network is unavailable.
 * Usage: node scripts/deploy-local.js
 */

const solc = require('solc');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'http://127.0.0.1:8545';
// Hardhat's default Account #0
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TIMELOCK_DELAY = 86400;

function findImports(importPath) {
  const candidates = [
    path.join(__dirname, '..', 'node_modules', importPath),
    path.join(__dirname, '..', importPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return { contents: fs.readFileSync(candidate, 'utf8') };
    }
  }
  return { error: `File not found: ${importPath}` };
}

function compile() {
  console.log('[1/6] Compiling contracts...');

  const sources = {};
  const contractsDir = path.join(__dirname, '..', 'contracts');
  for (const file of fs.readdirSync(contractsDir)) {
    if (file.endsWith('.sol')) {
      sources[`contracts/${file}`] = {
        content: fs.readFileSync(path.join(contractsDir, file), 'utf8'),
      };
    }
  }

  const input = {
    language: 'Solidity',
    sources,
    settings: {
      evmVersion: 'cancun',
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': { '*': ['abi', 'evm.bytecode.object'] },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    const errors = output.errors.filter((e) => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach((e) => console.error(e.formattedMessage));
      process.exit(1);
    }
    // Print warnings
    output.errors
      .filter((e) => e.severity === 'warning')
      .forEach((w) => console.warn('Warning:', w.message));
  }

  console.log('   Compiled successfully');
  return output.contracts;
}

async function main() {
  console.log('='.repeat(60));
  console.log('AEGIS DAO - Local Deployment (standalone compiler)');
  console.log('='.repeat(60));

  const compiled = compile();

  // Extract contract artifacts
  const getArtifact = (file, name) => {
    const contract = compiled[file][name];
    return {
      abi: contract.abi,
      bytecode: '0x' + contract.evm.bytecode.object,
    };
  };

  const tokenArtifact = getArtifact('contracts/AEGISToken.sol', 'AEGISToken');
  const treasuryArtifact = getArtifact('contracts/AEGISTreasury.sol', 'AEGISTreasury');
  const governorArtifact = getArtifact('contracts/AEGISGovernor.sol', 'AEGISGovernor');

  // Save ABIs for the frontend
  const abisDir = path.join(__dirname, '..', 'frontend', 'src', 'constants', 'generated');
  fs.mkdirSync(abisDir, { recursive: true });
  fs.writeFileSync(path.join(abisDir, 'AEGISToken.json'), JSON.stringify(tokenArtifact.abi, null, 2));
  fs.writeFileSync(path.join(abisDir, 'AEGISGovernor.json'), JSON.stringify(governorArtifact.abi, null, 2));
  fs.writeFileSync(path.join(abisDir, 'AEGISTreasury.json'), JSON.stringify(treasuryArtifact.abi, null, 2));
  console.log('   ABIs saved to frontend/src/constants/generated/');

  // Connect to local node
  console.log('\n[2/6] Connecting to local node...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
  const balance = await provider.getBalance(deployer.address);
  console.log('   Deployer:', deployer.address);
  console.log('   Balance:', ethers.formatEther(balance), 'ETH');

  // Track nonce manually to avoid auto-mining race conditions
  let nonce = await provider.getTransactionCount(deployer.address);

  async function deployContract(name, abi, bytecode, args = []) {
    console.log(`   Deploying ${name}... (nonce: ${nonce})`);
    const factory = new ethers.ContractFactory(abi, bytecode, deployer);
    const contract = await factory.deploy(...args, { nonce: nonce++ });
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`   ${name}: ${addr}`);
    return contract;
  }

  // Deploy AEGISToken
  console.log('\n[3/6] Deploying AEGISToken...');
  const token = await deployContract('AEGISToken', tokenArtifact.abi, tokenArtifact.bytecode);
  const tokenAddress = await token.getAddress();

  // Deploy AEGISTreasury
  console.log('\n[4/6] Deploying AEGISTreasury...');
  const treasury = await deployContract('AEGISTreasury', treasuryArtifact.abi, treasuryArtifact.bytecode, [
    TIMELOCK_DELAY, [], [], deployer.address,
  ]);
  const treasuryAddress = await treasury.getAddress();

  // Deploy AEGISGovernor
  console.log('\n[5/6] Deploying AEGISGovernor...');
  const governor = await deployContract('AEGISGovernor', governorArtifact.abi, governorArtifact.bytecode, [
    tokenAddress, treasuryAddress,
  ]);
  const governorAddress = await governor.getAddress();

  // Helper: send a transaction with explicit nonce
  async function sendTx(label, fn) {
    const tx = await fn({ nonce: nonce++ });
    await tx.wait();
    console.log(`   ${label}`);
  }

  // Configure roles
  console.log('\n[6/6] Configuring treasury roles...');
  const PROPOSER_ROLE = await treasury.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await treasury.EXECUTOR_ROLE();
  const ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();

  await sendTx('Granted PROPOSER_ROLE to Governor', (o) => treasury.grantRole(PROPOSER_ROLE, governorAddress, o));
  await sendTx('Granted EXECUTOR_ROLE to Governor', (o) => treasury.grantRole(EXECUTOR_ROLE, governorAddress, o));
  await sendTx('Revoked ADMIN_ROLE from deployer', (o) => treasury.revokeRole(ADMIN_ROLE, deployer.address, o));
  await sendTx('Delegated voting power to deployer', (o) => token.delegate(deployer.address, o));

  // Save deployment info
  const deployment = {
    network: 'localhost',
    chainId: '31337',
    contracts: {
      AEGISToken: tokenAddress,
      AEGISTreasury: treasuryAddress,
      AEGISGovernor: governorAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    configuration: {
      timelockDelay: TIMELOCK_DELAY,
      votingDelay: '7200',
      votingPeriod: '50400',
      quorumPercent: 4,
    },
  };

  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });
  const filename = `localhost-${Date.now()}.json`;
  fs.writeFileSync(path.join(deploymentsDir, filename), JSON.stringify(deployment, null, 2));

  // Update frontend config with addresses
  const configPath = path.join(__dirname, '..', 'frontend', 'src', 'constants', 'config.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  // Update localhost contracts
  const localhostRegex = /(31337:[\s\S]*?contracts:\s*\{)\s*\n\s*token:\s*'[^']*',\s*\n\s*governor:\s*'[^']*',\s*\n\s*treasury:\s*'[^']*',/;
  configContent = configContent.replace(
    localhostRegex,
    `$1\n      token: '${tokenAddress}',\n      governor: '${governorAddress}',\n      treasury: '${treasuryAddress}',`
  );
  fs.writeFileSync(configPath, configContent);

  console.log('\n' + '='.repeat(60));
  console.log('DEPLOYMENT COMPLETE');
  console.log('='.repeat(60));
  console.log('\nContracts:');
  console.log('  AEGISToken:   ', tokenAddress);
  console.log('  AEGISTreasury:', treasuryAddress);
  console.log('  AEGISGovernor:', governorAddress);
  console.log('\nToken Info:');
  console.log('  Total Supply:', ethers.formatEther(await token.totalSupply()), 'AEGIS');
  console.log('  Deployer Balance:', ethers.formatEther(await token.balanceOf(deployer.address)), 'AEGIS');
  console.log('\nDeployment saved to:', `deployments/${filename}`);
  console.log('Frontend config updated with contract addresses');
  console.log('\nNext: Run `npm run frontend:dev` to start the UI');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nDeployment failed:', err);
    process.exit(1);
  });
