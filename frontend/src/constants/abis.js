// ABI definitions for AEGIS DAO contracts
// Derived from OpenZeppelin v5.x contracts used by the Solidity source

export const TOKEN_ABI = [
  // ERC20 core
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',

  // ERC20Votes
  'function delegate(address delegatee)',
  'function delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s)',
  'function delegates(address account) view returns (address)',
  'function getVotes(address account) view returns (uint256)',
  'function getPastVotes(address account, uint256 timepoint) view returns (uint256)',
  'function getPastTotalSupply(uint256 timepoint) view returns (uint256)',

  // ERC20Permit
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',

  // Custom
  'function INITIAL_SUPPLY() view returns (uint256)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate)',
  'event DelegateVotesChanged(address indexed delegate, uint256 previousVotes, uint256 newVotes)',
];

export const GOVERNOR_ABI = [
  // Core Governor
  'function name() view returns (string)',
  'function version() view returns (string)',
  'function votingDelay() view returns (uint256)',
  'function votingPeriod() view returns (uint256)',
  'function proposalThreshold() view returns (uint256)',
  'function quorum(uint256 timepoint) view returns (uint256)',
  'function clock() view returns (uint48)',
  'function CLOCK_MODE() view returns (string)',

  // Proposal lifecycle
  'function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)',
  'function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)',
  'function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)',
  'function cancel(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)',
  'function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) view returns (uint256)',

  // Proposal queries
  'function state(uint256 proposalId) view returns (uint8)',
  'function proposalSnapshot(uint256 proposalId) view returns (uint256)',
  'function proposalDeadline(uint256 proposalId) view returns (uint256)',
  'function proposalProposer(uint256 proposalId) view returns (address)',
  'function proposalEta(uint256 proposalId) view returns (uint256)',
  'function proposalNeedsQueuing(uint256 proposalId) view returns (bool)',

  // Voting
  'function castVote(uint256 proposalId, uint8 support) returns (uint256)',
  'function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)',
  'function castVoteBySig(uint256 proposalId, uint8 support, address voter, bytes signature) returns (uint256)',
  'function hasVoted(uint256 proposalId, address account) view returns (bool)',

  // GovernorCountingSimple
  'function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)',
  'function COUNTING_MODE() view returns (string)',

  // GovernorTimelockControl
  'function timelock() view returns (address)',

  // Events
  'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)',
  'event ProposalQueued(uint256 proposalId, uint256 etaSeconds)',
  'event ProposalExecuted(uint256 proposalId)',
  'event ProposalCanceled(uint256 proposalId)',
  'event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)',
];

export const TREASURY_ABI = [
  // TimelockController
  'function getMinDelay() view returns (uint256)',
  'function isOperation(bytes32 id) view returns (bool)',
  'function isOperationPending(bytes32 id) view returns (bool)',
  'function isOperationReady(bytes32 id) view returns (bool)',
  'function isOperationDone(bytes32 id) view returns (bool)',
  'function getOperationState(bytes32 id) view returns (uint8)',
  'function hashOperation(address target, uint256 value, bytes data, bytes32 predecessor, bytes32 salt) view returns (bytes32)',
  'function hashOperationBatch(address[] targets, uint256[] values, bytes[] payloads, bytes32 predecessor, bytes32 salt) view returns (bytes32)',

  // AccessControl
  'function PROPOSER_ROLE() view returns (bytes32)',
  'function EXECUTOR_ROLE() view returns (bytes32)',
  'function CANCELLER_ROLE() view returns (bytes32)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getRoleAdmin(bytes32 role) view returns (bytes32)',

  // Events
  'event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)',
  'event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data)',
  'event Cancelled(bytes32 indexed id)',
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
];
