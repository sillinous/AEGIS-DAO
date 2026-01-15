const hre = require("hardhat");

async function main() {
    console.log("🚀 Starting AEGIS Deployment to Mumbai Testnet...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("📍 Deploying from:", deployer.address);
    console.log("💰 Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

    // Deploy AEGIS Token
    console.log("📜 Deploying AEGISToken...");
    const AEGISToken = await hre.ethers.getContractFactory("AEGISToken");
    const token = await AEGISToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ AEGISToken deployed to:", tokenAddress);

    // Deploy Governor
    console.log("\n📜 Deploying AEGISGovernor...");
    const AEGISGovernor = await hre.ethers.getContractFactory("AEGISGovernor");
    const governor = await AEGISGovernor.deploy(tokenAddress);
    await governor.waitForDeployment();
    const governorAddress = await governor.getAddress();
    console.log("✅ AEGISGovernor deployed to:", governorAddress);

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const totalSupply = await token.totalSupply();
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log("Token Supply:", hre.ethers.formatEther(totalSupply), "AEGIS");
    console.log("Deployer Balance:", hre.ethers.formatEther(deployerBalance), "AEGIS");

    // Display governance parameters
    const votingDelay = await governor.votingDelay();
    const votingPeriod = await governor.votingPeriod();
    console.log("\n⚙️  Governance Parameters:");
    console.log("Voting Delay:", votingDelay.toString(), "blocks");
    console.log("Voting Period:", votingPeriod.toString(), "blocks");

    // Save deployment addresses
    const deployment = {
        network: hre.network.name,
        token: tokenAddress,
        governor: governorAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };

    console.log("\n📋 Deployment Summary:");
    console.log(JSON.stringify(deployment, null, 2));
    console.log("\n✅ Deployment complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
