const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("AEGIS DAO", function () {
  let token, treasury, governor;
  let deployer, voter1, voter2, recipient;
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens
  const TIMELOCK_DELAY = 86400; // 1 day
  const VOTING_DELAY = 86400; // 1 day in seconds (timestamp mode)
  const VOTING_PERIOD = 604800; // 1 week in seconds (timestamp mode)
  const PROPOSAL_THRESHOLD = ethers.parseEther("1000"); // 1,000 AEGIS

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

    it("should use timestamp-based clock mode", async function () {
      expect(await token.CLOCK_MODE()).to.equal("mode=timestamp");
      const block = await ethers.provider.getBlock("latest");
      expect(await token.clock()).to.equal(block.timestamp);
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

    it("should reject unauthorized direct operations", async function () {
      await expect(
        treasury.connect(voter1).schedule(
          recipient.address,
          ethers.parseEther("1"),
          "0x",
          ethers.ZeroHash,
          ethers.id("unauthorized-salt"),
          TIMELOCK_DELAY
        )
      ).to.be.revertedWithCustomError(treasury, "AccessControlUnauthorizedAccount");
    });
  });

  describe("AEGISGovernor", function () {
    it("should have correct governance parameters", async function () {
      expect(await governor.votingDelay()).to.equal(BigInt(VOTING_DELAY));
      expect(await governor.votingPeriod()).to.equal(BigInt(VOTING_PERIOD));
      expect(await governor.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
    });

    it("should use timestamp-based clock mode", async function () {
      expect(await governor.CLOCK_MODE()).to.equal("mode=timestamp");
      const block = await ethers.provider.getBlock("latest");
      expect(await governor.clock()).to.equal(block.timestamp);
    });

    it("should calculate quorum correctly", async function () {
      const block = await ethers.provider.getBlock("latest");
      // Mine a block so the timestamp is in the past
      await mine(1);
      const quorum = await governor.quorum(block.timestamp);
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

    it("should reject proposals from accounts below threshold", async function () {
      const tokenAddress = await token.getAddress();
      const transferCalldata = token.interface.encodeFunctionData("transfer", [
        recipient.address,
        ethers.parseEther("100"),
      ]);

      // voter2 has 0 tokens, threshold is 1000
      await expect(
        governor.connect(voter2).propose(
          [tokenAddress],
          [0],
          [transferCalldata],
          "Should fail - no tokens"
        )
      ).to.be.revertedWithCustomError(governor, "GovernorInsufficientProposerVotes");
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

      // Wait for voting delay (1 day in seconds)
      await time.increase(VOTING_DELAY + 1);
      expect(await governor.state(proposalId)).to.equal(1); // Active

      // Cast votes
      await governor.castVote(proposalId, 1); // For
      await governor.connect(voter1).castVote(proposalId, 1); // For

      // Wait for voting period to end (1 week in seconds)
      await time.increase(VOTING_PERIOD + 1);
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
      await time.increase(VOTING_DELAY + 1);

      // No one votes

      // Wait for voting period
      await time.increase(VOTING_PERIOD + 1);

      // Should be Defeated due to no votes meeting quorum
      expect(await governor.state(proposalId)).to.equal(3); // Defeated
    });

    it("should defeat proposals with majority Against votes", async function () {
      const tokenAddress = await token.getAddress();
      const transferCalldata = token.interface.encodeFunctionData("transfer", [
        recipient.address,
        ethers.parseEther("100"),
      ]);

      const proposeTx = await governor.propose(
        [tokenAddress],
        [0],
        [transferCalldata],
        "Controversial proposal"
      );

      const receipt = await proposeTx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      );
      proposalId = event.args.proposalId;

      // Wait for voting delay
      await time.increase(VOTING_DELAY + 1);

      // Deployer votes Against (850k tokens), voter1 votes For (50k tokens)
      await governor.castVote(proposalId, 0); // Against
      await governor.connect(voter1).castVote(proposalId, 1); // For

      // Wait for voting period
      await time.increase(VOTING_PERIOD + 1);

      // Should be Defeated - Against has majority even though quorum was met
      expect(await governor.state(proposalId)).to.equal(3); // Defeated
    });

    it("should allow proposer to cancel a pending proposal", async function () {
      const tokenAddress = await token.getAddress();
      const transferCalldata = token.interface.encodeFunctionData("transfer", [
        recipient.address,
        ethers.parseEther("100"),
      ]);

      const description = "Proposal to be cancelled";
      const proposeTx = await governor.propose(
        [tokenAddress],
        [0],
        [transferCalldata],
        description
      );

      const receipt = await proposeTx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "ProposalCreated"
      );
      proposalId = event.args.proposalId;

      // Proposal is Pending
      expect(await governor.state(proposalId)).to.equal(0); // Pending

      // Proposer (deployer) cancels
      const descriptionHash = ethers.id(description);
      await governor.cancel(
        [tokenAddress],
        [0],
        [transferCalldata],
        descriptionHash
      );

      // Should now be Canceled
      expect(await governor.state(proposalId)).to.equal(2); // Canceled
    });
  });
});
