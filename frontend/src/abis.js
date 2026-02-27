export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function getVotes(address account) view returns (uint256)",
  "function delegates(address account) view returns (address)",
  "function delegate(address delegatee)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function clock() view returns (uint48)",
];

export const GOVERNOR_ABI = [
  "function name() view returns (string)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function quorum(uint256 timepoint) view returns (uint256)",
  "function clock() view returns (uint48)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalProposer(uint256 proposalId) view returns (address)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) view returns (uint256)",
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "function cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)",
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
];

export const TREASURY_ABI = [
  "function getMinDelay() view returns (uint256)",
];
