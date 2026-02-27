import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useToken } from '../hooks/useToken';
import { useGovernor } from '../hooks/useGovernor';
import { useTreasury } from '../hooks/useTreasury';
import { formatNumber, formatTokenAmount, blocksToTime, formatDuration, shortenAddress } from '../utils/format';
import { PROPOSAL_STATES, GOVERNANCE } from '../constants/config';

export default function Dashboard() {
  const { account, network } = useWeb3();
  const token = useToken();
  const governor = useGovernor();
  const treasury = useTreasury();

  const activeProposals = governor.proposals.filter((p) => p.state === 1);
  const totalProposals = governor.proposals.length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400 mt-1">Overview of the AEGIS DAO ecosystem</p>
      </div>

      {/* Wallet prompt */}
      {!account && (
        <div className="card border-aegis-500/20 bg-gradient-to-r from-aegis-900/20 to-gray-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-aegis-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-aegis-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Connect your wallet</h3>
              <p className="text-sm text-gray-400">
                Connect a wallet to view your AEGIS token balance, voting power, and participate in governance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="stat-label">Total Supply</p>
          <p className="stat-value">{formatTokenAmount(token.totalSupply)}</p>
          <p className="text-xs text-gray-500 mt-1">{token.symbol}</p>
        </div>

        <div className="card">
          <p className="stat-label">Treasury Balance</p>
          <p className="stat-value">{formatTokenAmount(treasury.balance, 4)}</p>
          <p className="text-xs text-gray-500 mt-1">{network?.currency?.symbol || 'ETH'}</p>
        </div>

        <div className="card">
          <p className="stat-label">Total Proposals</p>
          <p className="stat-value">{totalProposals}</p>
          <p className="text-xs text-gray-500 mt-1">{activeProposals.length} active</p>
        </div>

        <div className="card">
          <p className="stat-label">Quorum Required</p>
          <p className="stat-value">{GOVERNANCE.QUORUM_PERCENT}%</p>
          <p className="text-xs text-gray-500 mt-1">{formatTokenAmount(governor.quorum)} {token.symbol}</p>
        </div>
      </div>

      {/* Your position (if connected) */}
      {account && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card border-aegis-500/10">
            <p className="stat-label">Your Balance</p>
            <p className="stat-value text-aegis-400">{formatTokenAmount(token.balance)}</p>
            <p className="text-xs text-gray-500 mt-1">{token.symbol}</p>
          </div>

          <div className="card border-aegis-500/10">
            <p className="stat-label">Your Voting Power</p>
            <p className="stat-value text-aegis-400">{formatTokenAmount(token.votingPower)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {token.delegate ? `Delegated to ${shortenAddress(token.delegate)}` : 'Not delegated'}
            </p>
          </div>

          <div className="card border-aegis-500/10">
            <p className="stat-label">Delegation Status</p>
            <p className="stat-value text-sm mt-1">
              {token.delegate === account ? (
                <span className="text-green-400">Self-delegated</span>
              ) : token.delegate ? (
                <span className="text-blue-400">Delegated</span>
              ) : (
                <span className="text-yellow-400">Not Active</span>
              )}
            </p>
            {!token.delegate && (
              <Link to="/token" className="text-xs text-aegis-400 hover:text-aegis-300 mt-1 inline-block">
                Delegate now to vote
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Governance parameters */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Governance Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="stat-label">Voting Delay</p>
            <p className="text-lg font-semibold text-white">
              {blocksToTime(governor.votingDelay || GOVERNANCE.VOTING_DELAY_BLOCKS)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{governor.votingDelay || GOVERNANCE.VOTING_DELAY_BLOCKS} blocks</p>
          </div>
          <div className="card">
            <p className="stat-label">Voting Period</p>
            <p className="text-lg font-semibold text-white">
              {blocksToTime(governor.votingPeriod || GOVERNANCE.VOTING_PERIOD_BLOCKS)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{governor.votingPeriod || GOVERNANCE.VOTING_PERIOD_BLOCKS} blocks</p>
          </div>
          <div className="card">
            <p className="stat-label">Proposal Threshold</p>
            <p className="text-lg font-semibold text-white">
              {Number(governor.proposalThreshold) === 0 ? 'None' : formatTokenAmount(governor.proposalThreshold)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Anyone can propose</p>
          </div>
          <div className="card">
            <p className="stat-label">Timelock Delay</p>
            <p className="text-lg font-semibold text-white">
              {formatDuration(treasury.minDelay || GOVERNANCE.TIMELOCK_DELAY_SECONDS)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{treasury.minDelay || GOVERNANCE.TIMELOCK_DELAY_SECONDS}s</p>
          </div>
        </div>
      </div>

      {/* Recent proposals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Proposals</h3>
          <Link to="/governance" className="text-sm text-aegis-400 hover:text-aegis-300">
            View all
          </Link>
        </div>

        {governor.proposals.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-gray-400">No proposals yet</p>
            <Link to="/governance" className="text-sm text-aegis-400 hover:text-aegis-300 mt-2 inline-block">
              Create the first proposal
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {governor.proposals.slice(0, 5).map((proposal) => {
              const stateInfo = PROPOSAL_STATES[proposal.state] || PROPOSAL_STATES[0];
              const title = proposal.description.split('\n')[0].replace(/^#+\s*/, '').trim() || 'Untitled';
              const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
              const forPct = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0;

              return (
                <Link
                  key={proposal.id}
                  to={`/governance/proposal/${proposal.id}`}
                  className="card-hover block"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stateInfo.bg} ${stateInfo.color} ${stateInfo.border} border`}>
                          {stateInfo.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          by {shortenAddress(proposal.proposer)}
                        </span>
                      </div>
                      <h4 className="font-medium text-white truncate">{title}</h4>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-green-400">{forPct}% For</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Governance flow info */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Governance Workflow</h3>
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-center text-xs">
            {[
              { step: 'Propose', desc: 'Submit action' },
              { step: 'Delay', desc: blocksToTime(GOVERNANCE.VOTING_DELAY_BLOCKS) },
              { step: 'Vote', desc: blocksToTime(GOVERNANCE.VOTING_PERIOD_BLOCKS) },
              { step: 'Quorum', desc: `${GOVERNANCE.QUORUM_PERCENT}% required` },
              { step: 'Queue', desc: 'To timelock' },
              { step: 'Wait', desc: formatDuration(GOVERNANCE.TIMELOCK_DELAY_SECONDS) },
              { step: 'Execute', desc: 'Action runs' },
            ].map((item, i) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-aegis-600/20 border border-aegis-500/30 flex items-center justify-center text-aegis-400 font-bold mb-1">
                  {i + 1}
                </div>
                <p className="font-medium text-gray-200">{item.step}</p>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
