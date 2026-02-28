import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatUnits } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useGovernor } from '../hooks/useGovernor';
import { useToken } from '../hooks/useToken';
import { PROPOSAL_STATES, VOTE_TYPES, GOVERNANCE } from '../constants/config';
import { shortenAddress, formatTokenAmount, blocksToTime, formatDuration, getExplorerUrl } from '../utils/format';
import TransactionStatus from '../components/common/TransactionStatus';

export default function ProposalDetail() {
  const { proposalId } = useParams();
  const { account, provider, network } = useWeb3();
  const governor = useGovernor();
  const token = useToken();
  const [currentBlock, setCurrentBlock] = useState(0);

  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);
  const resetTx = () => { setTxStatus(null); setTxHash(null); setTxError(null); };

  // Get current block for countdown calculations
  useEffect(() => {
    if (!provider) return;
    const update = async () => {
      try {
        setCurrentBlock(await provider.getBlockNumber());
      } catch { /* ignore */ }
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, [provider]);

  const proposal = useMemo(
    () => governor.proposals.find((p) => p.id === proposalId),
    [governor.proposals, proposalId]
  );

  if (!proposal) {
    return (
      <div className="space-y-4">
        <Link to="/governance" className="text-sm text-aegis-400 hover:text-aegis-300 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Governance
        </Link>
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg">Proposal not found</p>
          <p className="text-gray-500 text-sm mt-1">
            This proposal may not exist or events haven't been indexed yet.
          </p>
        </div>
      </div>
    );
  }

  const stateInfo = PROPOSAL_STATES[proposal.state] || PROPOSAL_STATES[0];
  const lines = proposal.description.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim() || 'Untitled Proposal';
  const body = lines.slice(1).join('\n').trim();

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPct = totalVotes > 0n ? Number((proposal.forVotes * 10000n) / totalVotes) / 100 : 0;
  const againstPct = totalVotes > 0n ? Number((proposal.againstVotes * 10000n) / totalVotes) / 100 : 0;
  const abstainPct = totalVotes > 0n ? Number((proposal.abstainVotes * 10000n) / totalVotes) / 100 : 0;

  // Timeline calculations
  const blocksUntilVoteStart = Math.max(0, proposal.voteStart - currentBlock);
  const blocksUntilVoteEnd = Math.max(0, proposal.voteEnd - currentBlock);
  const isVotingActive = proposal.state === 1;
  const isSucceeded = proposal.state === 4;
  const isQueued = proposal.state === 5;
  const isExecutable = isQueued && proposal.eta > 0 && Date.now() / 1000 >= proposal.eta;

  return (
    <div className="space-y-6">
      <Link to="/governance" className="text-sm text-aegis-400 hover:text-aegis-300 flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Governance
      </Link>

      {/* Proposal header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border ${stateInfo.bg} ${stateInfo.color} ${stateInfo.border}`}>
                {stateInfo.label}
              </span>
              {proposal.hasVoted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                  You voted
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            Proposed by{' '}
            {network?.blockExplorer ? (
              <a
                href={getExplorerUrl(network.blockExplorer, 'address', proposal.proposer)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-aegis-400 hover:text-aegis-300 font-mono"
              >
                {shortenAddress(proposal.proposer)}
              </a>
            ) : (
              <span className="font-mono">{shortenAddress(proposal.proposer)}</span>
            )}
          </span>
          <span>&middot;</span>
          <span>{proposal.targets.length} action{proposal.targets.length !== 1 ? 's' : ''}</span>
        </div>

        {body && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-gray-300 whitespace-pre-wrap">{body}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <TimelineItem
            label="Created"
            value={`Block ${proposal.blockNumber}`}
            active={proposal.state === 0}
            completed={proposal.state >= 1}
          />
          <TimelineItem
            label="Voting Starts"
            value={proposal.state === 0
              ? `In ${blocksToTime(blocksUntilVoteStart)}`
              : `Block ${proposal.voteStart}`}
            active={proposal.state === 0}
            completed={proposal.state >= 1}
          />
          <TimelineItem
            label="Voting Ends"
            value={isVotingActive
              ? `In ${blocksToTime(blocksUntilVoteEnd)}`
              : `Block ${proposal.voteEnd}`}
            active={isVotingActive}
            completed={proposal.state >= 2}
          />
          <TimelineItem
            label="Execution"
            value={
              proposal.state === 7 ? 'Executed'
              : isQueued && proposal.eta > 0 ? `ETA: ${formatDuration(Math.max(0, proposal.eta - Date.now() / 1000))}`
              : isQueued ? 'Queued'
              : 'Pending'
            }
            active={isQueued}
            completed={proposal.state === 7}
          />
        </div>
      </div>

      {/* Voting results */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Votes</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-green-400/5 border border-green-400/10">
            <p className="text-xs text-green-400 mb-1">For</p>
            <p className="text-xl font-bold text-green-400">
              {formatTokenAmount(formatUnits(proposal.forVotes, 18))}
            </p>
            <p className="text-xs text-gray-500">{forPct.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-red-400/5 border border-red-400/10">
            <p className="text-xs text-red-400 mb-1">Against</p>
            <p className="text-xl font-bold text-red-400">
              {formatTokenAmount(formatUnits(proposal.againstVotes, 18))}
            </p>
            <p className="text-xs text-gray-500">{againstPct.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-400/5 border border-gray-400/10">
            <p className="text-xs text-gray-400 mb-1">Abstain</p>
            <p className="text-xl font-bold text-gray-400">
              {formatTokenAmount(formatUnits(proposal.abstainVotes, 18))}
            </p>
            <p className="text-xs text-gray-500">{abstainPct.toFixed(1)}%</p>
          </div>
        </div>

        {/* Vote progress bar */}
        <div className="h-3 rounded-full bg-gray-800 overflow-hidden flex mb-2">
          <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${forPct}%` }} />
          <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${againstPct}%` }} />
          <div className="bg-gray-500 h-full transition-all duration-500" style={{ width: `${abstainPct}%` }} />
        </div>
        <p className="text-xs text-gray-500">
          Total: {formatTokenAmount(formatUnits(totalVotes, 18))} {token.symbol}
          {governor.quorum && ` / Quorum: ${formatTokenAmount(governor.quorum)} needed`}
        </p>
      </div>

      {/* Cast vote (if active and connected) */}
      {isVotingActive && account && !proposal.hasVoted && (
        <VoteSection
          proposal={proposal}
          governor={governor}
          token={token}
          setTxStatus={setTxStatus}
          setTxHash={setTxHash}
          setTxError={setTxError}
        />
      )}

      {/* Lifecycle actions */}
      {account && (
        <LifecycleActions
          proposal={proposal}
          governor={governor}
          isSucceeded={isSucceeded}
          isQueued={isQueued}
          isExecutable={isExecutable}
          setTxStatus={setTxStatus}
          setTxHash={setTxHash}
          setTxError={setTxError}
        />
      )}

      {/* Proposal actions/calldata */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
        <div className="space-y-3">
          {proposal.targets.map((target, i) => (
            <div key={i} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Action {i + 1}</span>
                {network?.blockExplorer && (
                  <a
                    href={getExplorerUrl(network.blockExplorer, 'address', target)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-aegis-400 hover:text-aegis-300"
                  >
                    View target
                  </a>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-gray-500">Target: </span>
                  <span className="font-mono text-gray-300">{shortenAddress(target, 8)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Value: </span>
                  <span className="text-gray-300">{proposal.values[i]?.toString() || '0'} wei</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-500">Calldata: </span>
                  <span className="font-mono text-gray-300 text-xs break-all">
                    {proposal.calldatas[i]?.toString() || '0x'}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proposal ID */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-3">Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Proposal ID</span>
            <span className="font-mono text-gray-300 text-xs max-w-xs truncate">{proposal.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Snapshot Block</span>
            <span className="text-gray-300">{proposal.snapshot}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Deadline Block</span>
            <span className="text-gray-300">{proposal.deadline}</span>
          </div>
          {proposal.eta > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Execution ETA</span>
              <span className="text-gray-300">{new Date(proposal.eta * 1000).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <TransactionStatus status={txStatus} hash={txHash} error={txError} onClose={resetTx} />
    </div>
  );
}

function TimelineItem({ label, value, active, completed }) {
  return (
    <div className={`p-3 rounded-lg border ${
      active
        ? 'bg-aegis-600/10 border-aegis-500/30'
        : completed
          ? 'bg-green-400/5 border-green-400/10'
          : 'bg-gray-800/50 border-gray-700/50'
    }`}>
      <p className={`text-xs mb-1 ${
        active ? 'text-aegis-400' : completed ? 'text-green-400' : 'text-gray-500'
      }`}>
        {label}
      </p>
      <p className={`text-sm font-medium ${
        active ? 'text-aegis-300' : completed ? 'text-gray-300' : 'text-gray-500'
      }`}>
        {value}
      </p>
    </div>
  );
}

function VoteSection({ proposal, governor, token, setTxStatus, setTxHash, setTxError }) {
  const [voteType, setVoteType] = useState(null);
  const [reason, setReason] = useState('');

  const handleVote = async () => {
    if (voteType === null) return;
    setTxStatus('pending');
    try {
      let tx;
      if (reason.trim()) {
        tx = await governor.castVoteWithReason(proposal.id, voteType, reason);
      } else {
        tx = await governor.castVote(proposal.id, voteType);
      }
      setTxHash(tx.hash);
      setTxStatus('success');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  return (
    <div className="card border-blue-500/20">
      <h3 className="text-lg font-semibold text-white mb-2">Cast Your Vote</h3>
      <p className="text-sm text-gray-400 mb-4">
        Your voting power: {formatTokenAmount(token.votingPower)} {token.symbol}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => setVoteType(VOTE_TYPES.FOR)}
          className={`p-3 rounded-lg border text-center transition-all ${
            voteType === VOTE_TYPES.FOR
              ? 'bg-green-400/15 border-green-400/40 text-green-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-green-400/20'
          }`}
        >
          <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
          </svg>
          <span className="text-sm font-medium">For</span>
        </button>
        <button
          onClick={() => setVoteType(VOTE_TYPES.AGAINST)}
          className={`p-3 rounded-lg border text-center transition-all ${
            voteType === VOTE_TYPES.AGAINST
              ? 'bg-red-400/15 border-red-400/40 text-red-400'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-red-400/20'
          }`}
        >
          <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 001.302-4.665c0-1.194-.232-2.333-.654-3.375zM14.25 9h-2.25M5.604 6.5a12 12 0 00-.521-3.507C4.777 2.175 3.901 1.658 3.013 1.658h-.908c-.445 0-.72.498-.523.898.097.197.187.397.27.602M5.604 6.5H5m.604 0a8.96 8.96 0 01-.999 4.125m.999-4.125a8.958 8.958 0 001.302 4.665c.245.404-.028.96-.5.96H4.167c-.832 0-1.612-.453-1.918-1.227A11.97 11.97 0 011.418 6.875c0-1.22.182-2.396.521-3.507C2.247 2.518 3.124 2 4.013 2h.908c.392 0 .651.385.575.75" transform="rotate(180 12 12)" />
          </svg>
          <span className="text-sm font-medium">Against</span>
        </button>
        <button
          onClick={() => setVoteType(VOTE_TYPES.ABSTAIN)}
          className={`p-3 rounded-lg border text-center transition-all ${
            voteType === VOTE_TYPES.ABSTAIN
              ? 'bg-gray-400/15 border-gray-400/40 text-gray-300'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
          }`}
        >
          <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Abstain</span>
        </button>
      </div>

      <div className="mb-4">
        <label className="label">Reason (optional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you voting this way?"
          className="input-field min-h-[80px] resize-y"
        />
      </div>

      <button
        onClick={handleVote}
        disabled={voteType === null}
        className="btn-primary w-full"
      >
        {voteType === null
          ? 'Select a vote'
          : `Vote ${voteType === 0 ? 'Against' : voteType === 1 ? 'For' : 'Abstain'}`
        }
      </button>
    </div>
  );
}

function LifecycleActions({ proposal, governor, isSucceeded, isQueued, isExecutable, setTxStatus, setTxHash, setTxError }) {
  const handleQueue = async () => {
    setTxStatus('pending');
    try {
      const tx = await governor.queueProposal(
        proposal.targets, proposal.values, proposal.calldatas, proposal.description
      );
      setTxHash(tx.hash);
      setTxStatus('success');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  const handleExecute = async () => {
    setTxStatus('pending');
    try {
      const tx = await governor.executeProposal(
        proposal.targets, proposal.values, proposal.calldatas, proposal.description
      );
      setTxHash(tx.hash);
      setTxStatus('success');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  const handleCancel = async () => {
    setTxStatus('pending');
    try {
      const tx = await governor.cancelProposal(
        proposal.targets, proposal.values, proposal.calldatas, proposal.description
      );
      setTxHash(tx.hash);
      setTxStatus('success');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  if (!isSucceeded && !isQueued && proposal.state !== 0) return null;

  return (
    <div className="card border-purple-500/20">
      <h3 className="text-lg font-semibold text-white mb-4">Proposal Actions</h3>
      <div className="flex flex-wrap gap-3">
        {isSucceeded && (
          <button onClick={handleQueue} className="btn-primary">
            Queue for Execution
          </button>
        )}
        {isQueued && (
          <button
            onClick={handleExecute}
            disabled={!isExecutable}
            className="btn-success"
          >
            {isExecutable ? 'Execute Proposal' : 'Waiting for Timelock...'}
          </button>
        )}
        {(proposal.state === 0 || proposal.state === 1) && (
          <button onClick={handleCancel} className="btn-danger">
            Cancel Proposal
          </button>
        )}
      </div>
      {isQueued && !isExecutable && proposal.eta > 0 && (
        <p className="text-sm text-gray-400 mt-3">
          Executable after: {new Date(proposal.eta * 1000).toLocaleString()}
          {' '}({formatDuration(Math.max(0, proposal.eta - Date.now() / 1000))} remaining)
        </p>
      )}
    </div>
  );
}
