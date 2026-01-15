const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=".repeat(60));
  console.log("AEGIS DAO - Deployment Script");
  console.log("Autonomous Economic Generation & Integration System");
  console.log("=".repeat(60));

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);

  console.log("\n[1/5] Deployer Information");
  console.log("-".repeat(40));
  console.log("Address:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "MATIC");
  console.log("Network:", hre.network.name);

  // Configuration
  const TIMELOCK_DELAY = process.env.TIMELOCK_DELAY || 86400; // 1 day default
  console.log("\n[2/5] Configuration");
  console.log("-".repeat(40));
  console.log("Timelock Delay:", TIMELOCK_DELAY, "seconds");

  // Deploy AEGIS Token
  console.log("\n[3/5] Deploying AEGISToken...");
  console.log("-".repeat(40));
  const AEGISToken = await hre.ethers.getContractFactory("AEGISToken");
  const token = await AEGISToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("AEGISToken deployed to:", tokenAddress);

  // Deploy Treasury (TimelockController)
  console.log("\n[4/5] Deploying AEGISTreasury (Timelock)...");
  console.log("-".repeat(40));

  // Initially, deployer is admin; will be revoked after setup
  const AEGISTreasury = await hre.ethers.getContractFactory("AEGISTreasury");
  const treasury = await AEGISTreasury.deploy(
    TIMELOCK_DELAY,
    [], // proposers - will add governor after deployment
    [], // executors - will add governor after deployment
    deployer.address // temporary admin
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log("AEGISTreasury deployed to:", treasuryAddress);

  // Deploy Governor
  console.log("\n[5/5] Deploying AEGISGovernor...");
  console.log("-".repeat(40));
  const AEGISGovernor = await hre.ethers.getContractFactory("AEGISGovernor");
  const governor = await AEGISGovernor.deploy(tokenAddress, treasuryAddress);
  await governor.waitForDeployment();
  const governorAddress = await governor.getAddress();
  console.log("AEGISGovernor deployed to:", governorAddress);

  // Setup roles on Treasury
  console.log("\n[+] Configuring Treasury Roles...");
  console.log("-".repeat(40));

  const PROPOSER_ROLE = await treasury.PROPOSER_ROLE();
  const EXECUTOR_ROLE = await treasury.EXECUTOR_ROLE();
  const ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();

  // Grant proposer role to governor
  await treasury.grantRole(PROPOSER_ROLE, governorAddress);
  console.log("Granted PROPOSER_ROLE to Governor");

  // Grant executor role to governor (or address(0) for anyone)
  await treasury.grantRole(EXECUTOR_ROLE, governorAddress);
  console.log("Granted EXECUTOR_ROLE to Governor");

  // Optionally: Allow anyone to execute after delay
  // await treasury.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);

  // Revoke admin role from deployer (governance is now fully decentralized)
  await treasury.revokeRole(ADMIN_ROLE, deployer.address);
  console.log("Revoked ADMIN_ROLE from deployer");
  console.log("Treasury is now fully governed by AEGIS DAO");

  // Delegate voting power to self (deployer can now vote)
  console.log("\n[+] Delegating voting power...");
  await token.delegate(deployer.address);
  console.log("Deployer delegated voting power to self");

  // Verify deployment
  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));

  const totalSupply = await token.totalSupply();
  const deployerBalance = await token.balanceOf(deployer.address);
  const votingDelay = await governor.votingDelay();
  const votingPeriod = await governor.votingPeriod();

  console.log("\nContracts:");
  console.log("  AEGISToken:", tokenAddress);
  console.log("  AEGISTreasury:", treasuryAddress);
  console.log("  AEGISGovernor:", governorAddress);

  console.log("\nToken Info:");
  console.log("  Total Supply:", hre.ethers.formatEther(totalSupply), "AEGIS");
  console.log("  Deployer Balance:", hre.ethers.formatEther(deployerBalance), "AEGIS");

  console.log("\nGovernance Parameters:");
  console.log("  Voting Delay:", votingDelay.toString(), "blocks (~1 day)");
  console.log("  Voting Period:", votingPeriod.toString(), "blocks (~1 week)");
  console.log("  Quorum: 4% of total supply");
  console.log("  Timelock Delay:", TIMELOCK_DELAY, "seconds");

  // Save deployment info
  const deployment = {
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      AEGISToken: tokenAddress,
      AEGISTreasury: treasuryAddress,
      AEGISGovernor: governorAddress,
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    configuration: {
      timelockDelay: TIMELOCK_DELAY,
      votingDelay: votingDelay.toString(),
      votingPeriod: votingPeriod.toString(),
      quorumPercent: 4,
    },
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deployment, null, 2)
  );
  console.log("\nDeployment saved to:", `deployments/${filename}`);

  console.log("\n" + "=".repeat(60));
  console.log("DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));

  console.log("\nNext Steps:");
  console.log("1. Verify contracts on Polygonscan: npm run verify:amoy");
  console.log("2. Distribute tokens to initial DAO members");
  console.log("3. Create your first governance proposal");
  console.log("4. Fund the treasury with operational capital");

  return deployment;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\nDeployment failed:", error);
    process.exit(1);
  });
