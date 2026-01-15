const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("AEGIS DAO - Contract Verification");
  console.log("=".repeat(50));

  // Find most recent deployment for this network
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const files = fs.readdirSync(deploymentsDir)
    .filter(f => f.startsWith(hre.network.name) && f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.error("No deployment found for network:", hre.network.name);
    console.error("Run deployment first: npm run deploy:" + hre.network.name);
    process.exit(1);
  }

  const deploymentFile = path.join(deploymentsDir, files[0]);
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("Using deployment:", files[0]);
  console.log("Contracts to verify:");
  console.log("  Token:", deployment.contracts.AEGISToken);
  console.log("  Treasury:", deployment.contracts.AEGISTreasury);
  console.log("  Governor:", deployment.contracts.AEGISGovernor);

  // Verify Token
  console.log("\n[1/3] Verifying AEGISToken...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.AEGISToken,
      constructorArguments: [],
    });
    console.log("AEGISToken verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("AEGISToken already verified");
    } else {
      console.error("Failed to verify AEGISToken:", error.message);
    }
  }

  // Verify Treasury
  console.log("\n[2/3] Verifying AEGISTreasury...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.AEGISTreasury,
      constructorArguments: [
        parseInt(deployment.configuration.timelockDelay),
        [],
        [],
        deployment.deployer,
      ],
    });
    console.log("AEGISTreasury verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("AEGISTreasury already verified");
    } else {
      console.error("Failed to verify AEGISTreasury:", error.message);
    }
  }

  // Verify Governor
  console.log("\n[3/3] Verifying AEGISGovernor...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.AEGISGovernor,
      constructorArguments: [
        deployment.contracts.AEGISToken,
        deployment.contracts.AEGISTreasury,
      ],
    });
    console.log("AEGISGovernor verified!");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("AEGISGovernor already verified");
    } else {
      console.error("Failed to verify AEGISGovernor:", error.message);
    }
  }

  console.log("\nVerification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
