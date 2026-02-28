import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useToken } from '../hooks/useToken';
import { useGovernor } from '../hooks/useGovernor';
import { useTreasury } from '../hooks/useTreasury';
import { formatNumber, formatTokenAmount, blocksToTime, formatDuration, shortenAddress } from '../utils/format';
import { PROPOSAL_STATES, GOVERNANCE } from '../constants/config';
import { StatGridSkeleton } from '../components/common/Skeleton';

function AnimatedStat({ value, label, sublabel, highlight, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`card transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${highlight ? 'border-aegis-500/10' : ''}`}>
      <p className="stat-label">{label}</p>
      <p className={`stat-value ${highlight ? 'text-aegis-400' : ''}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { account, network, blockNumber } = useWeb3();
  const token = useToken();
  const governor = useGovernor();
  const treasury = useTreasury();

  const activeProposals = governor.proposals.filter((p) => p.state === 1);
  const totalProposals = governor.proposals.length;

  const isLoading = token.loading || governor.loading || treasury.loading;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400 mt-1">Overview of the AEGIS DAO ecosystem</p>
        </div>
        {blockNumber > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Block {blockNumber.toLocaleString()}
          </div>
        )}
      </div>

      {/* Wallet prompt */}
      {!account && (
        <div className="card border-aegis-500/20 bg-gradient-to-r from-aegis-900/20 to-gray-900 animate-fade-in">
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
      {isLoading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStat label="Total Supply" value={formatTokenAmount(token.totalSupply)} sublabel={token.symbol} delay={0} />
          <AnimatedStat label="Treasury Balance" value={formatTokenAmount(treasury.balance, 4)} sublabel={network?.currency?.symbol || 'ETH'} delay={75} />
          <AnimatedStat label="Total Proposals" value={totalProposals} sublabel={`${activeProposals.length} active`} delay={150} />
          <AnimatedStat label="Quorum Required" value={`${GOVERNANCE.QUORUM_PERCENT}%`} sublabel={`${formatTokenAmount(governor.quorum)} ${token.symbol}`} delay={225} />
        </div>
      )}

      {/* Your position (if connected) */}
      {account && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnimatedStat label="Your Balance" value={formatTokenAmount(token.balance)} sublabel={token.symbol} highlight delay={0} />
          <AnimatedStat label="Your Voting Power" value={formatTokenAmount(token.votingPower)} sublabel={token.delegate ? `Delegated to ${shortenAddress(token.delegate)}` : 'Not delegated'} highlight delay={75} />
          <div className="card border-aegis-500/10 animate-fade-in">
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

      {/* Quick actions */}
      {account && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/governance" className="card-hover text-center py-4">
            <svg className="w-6 h-6 mx-auto text-aegis-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <p className="text-sm font-medium text-gray-300">New Proposal</p>
          </Link>
          <Link to="/token" className="card-hover text-center py-4">
            <svg className="w-6 h-6 mx-auto text-aegis-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <p className="text-sm font-medium text-gray-300">Transfer</p>
          </Link>
          <Link to="/treasury" className="card-hover text-center py-4">
            <svg className="w-6 h-6 mx-auto text-aegis-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-300">Deposit</p>
          </Link>
          <Link to="/members" className="card-hover text-center py-4">
            <svg className="w-6 h-6 mx-auto text-aegis-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-300">Members</p>
          </Link>
        </div>
      )}

      {/* Governance parameters */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Governance Parameters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <p className="stat-label">Voting Delay</p>
            <p className="text-lg font-semibold text-white">{blocksToTime(governor.votingDelay || GOVERNANCE.VOTING_DELAY_BLOCKS)}</p>
            <p className="text-xs text-gray-500 mt-1">{governor.votingDelay || GOVERNANCE.VOTING_DELAY_BLOCKS} blocks</p>
          </div>
          <div className="card">
            <p className="stat-label">Voting Period</p>
            <p className="text-lg font-semibold text-white">{blocksToTime(governor.votingPeriod || GOVERNANCE.VOTING_PERIOD_BLOCKS)}</p>
            <p className="text-xs text-gray-500 mt-1">{governor.votingPeriod || GOVERNANCE.VOTING_PERIOD_BLOCKS} blocks</p>
          </div>
          <div className="card">
            <p className="stat-label">Proposal Threshold</p>
            <p className="text-lg font-semibold text-white">{Number(governor.proposalThreshold) === 0 ? 'None' : formatTokenAmount(governor.proposalThreshold)}</p>
            <p className="text-xs text-gray-500 mt-1">Anyone can propose</p>
          </div>
          <div className="card">
            <p className="stat-label">Timelock Delay</p>
            <p className="text-lg font-semibold text-white">{formatDuration(treasury.minDelay || GOVERNANCE.TIMELOCK_DELAY_SECONDS)}</p>
            <p className="text-xs text-gray-500 mt-1">{treasury.minDelay || GOVERNANCE.TIMELOCK_DELAY_SECONDS}s</p>
          </div>
        </div>
      </div>

      {/* Recent proposals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Proposals</h3>
          <Link to="/governance" className="text-sm text-aegis-400 hover:text-aegis-300">View all</Link>
        </div>

        {governor.proposals.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-gray-400">No proposals yet</p>
            <Link to="/governance" className="text-sm text-aegis-400 hover:text-aegis-300 mt-2 inline-block">Create the first proposal</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {governor.proposals.slice(0, 5).map((proposal) => {
              const stateInfo = PROPOSAL_STATES[proposal.state] || PROPOSAL_STATES[0];
              const title = proposal.description.split('\n')[0].replace(/^#+\s*/, '').trim() || 'Untitled';
              const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
              const forPct = totalVotes > 0n ? Number((proposal.forVotes * 100n) / totalVotes) : 0;

              return (
                <Link key={proposal.id} to={`/governance/proposal/${proposal.id}`} className="card-hover block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${stateInfo.bg} ${stateInfo.color} ${stateInfo.border} border`}>
                          {stateInfo.label}
                        </span>
                        <span className="text-xs text-gray-500">by {shortenAddress(proposal.proposer)}</span>
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
