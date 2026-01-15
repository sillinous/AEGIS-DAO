const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("AEGIS DAO", function () {
  let token, treasury, governor;
  let deployer, voter1, voter2, recipient;
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const TIMELOCK_DELAY = 86400; // 1 day

  beforeEach(async function () {
    [deployer, voter1, voter2, recipient] = await ethers.getSigners();

    // Deploy Token
    const AEGISToken = await ethers.getContractFactory("AEGISToken");
    token = await AEGISToken.deploy();
    await token.waitForDeployment();

    // Deploy Treasury
    const AEGISTreasury = await ethers.getContractFactory("AEGISTreasury");
    treasury = await AEGISTreasury.deploy(
      TIMELOCK_DELAY,
      [],
      [],
      deployer.address
    );
    await treasury.waitForDeployment();

    // Deploy Governor
    const AEGISGovernor = await ethers.getContractFactory("AEGISGovernor");
    governor = await AEGISGovernor.deploy(
      await token.getAddress(),
      await treasury.getAddress()
    );
    await governor.waitForDeployment();

    // Setup roles
    const PROPOSER_ROLE = await treasury.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await treasury.EXECUTOR_ROLE();
    await treasury.grantRole(PROPOSER_ROLE, await governor.getAddress());
    await treasury.grantRole(EXECUTOR_ROLE, await governor.getAddress());

    // Delegate voting power
    await token.delegate(deployer.address);
  });

  describe("AEGISToken", function () {
    it("should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("AEGIS Token");
      expect(await token.symbol()).to.equal("AEGIS");
    });

    it("should mint initial supply to deployer", async function () {
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await token.balanceOf(deployer.address)).to.equal(INITIAL_SUPPLY);
    });

    it("should support voting", async function () {
      // After delegation, deployer should have voting power
      const votes = await token.getVotes(deployer.address);
      expect(votes).to.equal(INITIAL_SUPPLY);
    });

    it("should transfer voting power on delegation", async function () {
      // Transfer tokens to voter1
      await token.transfer(voter1.address, ethers.parseEther("100000"));

      // Voter1 has no voting power yet
      expect(await token.getVotes(voter1.address)).to.equal(0);

      // After delegation, voter1 gets voting power
      await token.connect(voter1).delegate(voter1.address);
      expect(await token.getVotes(voter1.address)).to.equal(
        ethers.parseEther("100000")
      );
    });
  });

  describe("AEGISTreasury", function () {
    it("should have correct timelock delay", async function () {
      expect(await treasury.getMinDelay()).to.equal(TIMELOCK_DELAY);
    });

    it("should accept ETH deposits", async function () {
      const treasuryAddress = await treasury.getAddress();
      const amount = ethers.parseEther("1");

      await deployer.sendTransaction({
        to: treasuryAddress,
        value: amount,
      });

      expect(await ethers.provider.getBalance(treasuryAddress)).to.equal(amount);
    });

    it("should have governor as proposer", async function () {
      const PROPOSER_ROLE = await treasury.PROPOSER_ROLE();
      expect(
        await treasury.hasRole(PROPOSER_ROLE, await governor.getAddress())
      ).to.be.true;
    });
  });

  describe("AEGISGovernor", function () {
    it("should have correct governance parameters", async function () {
      expect(await governor.votingDelay()).to.equal(7200n);
      expect(await governor.votingPeriod()).to.equal(50400n);
      expect(await governor.proposalThreshold()).to.equal(0n);
    });

    it("should calculate quorum correctly", async function () {
      const blockNumber = await ethers.provider.getBlockNumber();
      // Mine a block to ensure checkpoint exists
      await mine(1);
      const quorum = await governor.quorum(blockNumber);
      // 4% of 1M = 40,000 tokens
      expect(quorum).to.equal(ethers.parseEther("40000"));
    });

    it("should allow creating proposals", async function () {
      const treasuryAddress = await treasury.getAddress();
      const transferCalldata = token.interface.encodeFunctionData("transfer", [
        recipient.address,
        ethers.parseEther("1000"),
      ]);

      // First transfer some tokens to treasury
      await token.transfer(treasuryAddress, ethers.parseEther("10000"));

      const tx = await governor.propose(
        [await token.getAddress()],
        [0],
        [transferCalldata],
        "Proposal #1: Transfer 1000 AEGIS to recipient"
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      );
      expect(event).to.not.be.undefined;
    });
  });

  describe("Governance Flow", function () {
    let proposalId;
    const proposalDescription = "Proposal #1: Transfer tokens from treasury";

    beforeEach(async function () {
      // Setup: Transfer tokens to treasury and distribute to voters
      const treasuryAddress = await treasury.getAddress();
      await token.transfer(treasuryAddress, ethers.parseEther("100000"));
      await token.transfer(voter1.address, ethers.parseEther("50000"));
      await token.connect(voter1).delegate(voter1.address);

      // Mine a block to record checkpoints
      await mine(1);
    });

    it("should execute full governance cycle", async function () {
      const treasuryAddress = await treasury.getAddress();
      const tokenAddress = await token.getAddress();

      // Create proposal
      const transferAmount = ethers.parseEther("1000");
      const transferCalldata = token.interface.encodeFunctionData("transfer", [
        recipient.address,
        transferAmount,
      ]);

      const proposeTx = await governor.propose(
        [tokenAddress],
        [0],
        [transferCalldata],
        proposalDescription
      );

      const proposeReceipt = await proposeTx.wait();
      const proposeEvent = proposeReceipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      );
      proposalId = proposeEvent.args.proposalId;

      // Check initial state
      expect(await governor.state(proposalId)).to.equal(0); // Pending

      // Wait for voting delay
      await mine(7201);
      expect(await governor.state(proposalId)).to.equal(1); // Active

      // Cast votes
      await governor.castVote(proposalId, 1); // For
      await governor.connect(voter1).castVote(proposalId, 1); // For

      // Wait for voting period to end
      await mine(50401);
      expect(await governor.state(proposalId)).to.equal(4); // Succeeded

      // Queue proposal
      const descriptionHash = ethers.id(proposalDescription);
      await governor.queue(
        [tokenAddress],
        [0],
        [transferCalldata],
        descriptionHash
      );
      expect(await governor.state(proposalId)).to.equal(5); // Queued

      // Wait for timelock delay
      await time.increase(TIMELOCK_DELAY + 1);

      // Execute proposal
      const recipientBalanceBefore = await token.balanceOf(recipient.address);
      await governor.execute(
        [tokenAddress],
        [0],
        [transferCalldata],
        descriptionHash
      );

      expect(await governor.state(proposalId)).to.equal(7); // Executed

      // Verify transfer occurred
      const recipientBalanceAfter = await token.balanceOf(recipient.address);
      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
        transferAmount
      );
    });

    it("should reject proposals that don't meet quorum", async function () {
      // Deployer only has ~850k tokens after transfers
      // Quorum is 4% = 40k, so we need to make sure only voter2 votes (who has 0)

      const tokenAddress = await token.getAddress();
      const transferCalldata = token.interface.encodeFunctionData("transfer", [
        recipient.address,
        ethers.parseEther("100"),
      ]);

      const proposeTx = await governor.propose(
        [tokenAddress],
        [0],
        [transferCalldata],
        "Low turnout proposal"
      );

      const receipt = await proposeTx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      );
      proposalId = event.args.proposalId;

      // Wait for voting delay
      await mine(7201);

      // Only voter2 votes (who has no tokens/voting power)
      await token.connect(voter2).delegate(voter2.address);
      await mine(1);

      // Voter2 has 0 voting power - skip vote or vote with 0 power
      // Actually let's just not vote at all

      // Wait for voting period
      await mine(50401);

      // Should be Defeated due to no votes meeting quorum
      expect(await governor.state(proposalId)).to.equal(3); // Defeated
    });
  });
});
