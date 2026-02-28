import { useCallback, useEffect, useState } from 'react';
import { formatUnits } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useToken } from '../hooks/useToken';
import { shortenAddress, formatTokenAmount, getExplorerUrl } from '../utils/format';
import { PROPOSAL_STATES } from '../constants/config';
import { TableRowSkeleton } from '../components/common/Skeleton';

const EVENT_TYPES = {
  Transfer: { label: 'Transfer', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  DelegateChanged: { label: 'Delegation', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  ProposalCreated: { label: 'Proposal', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  VoteCast: { label: 'Vote', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
  ProposalQueued: { label: 'Queued', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  ProposalExecuted: { label: 'Executed', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
};

const VOTE_LABELS = { 0: 'Against', 1: 'For', 2: 'Abstain' };

export default function Activity() {
  const { contracts, readContracts, provider, network, subscribe } = useWeb3();
  const token = useToken();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const c = contracts || readContracts;

  const fetchEvents = useCallback(async () => {
    if (!c || !provider) { setLoading(false); return; }

    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 50000);

      const [transfers, delegations, proposals, votes, queued, executed] = await Promise.all([
        c.token.queryFilter(c.token.filters.Transfer(), fromBlock).catch(() => []),
        c.token.queryFilter(c.token.filters.DelegateChanged(), fromBlock).catch(() => []),
        c.governor.queryFilter(c.governor.filters.ProposalCreated(), fromBlock).catch(() => []),
        c.governor.queryFilter(c.governor.filters.VoteCast(), fromBlock).catch(() => []),
        c.governor.queryFilter(c.governor.filters.ProposalQueued(), fromBlock).catch(() => []),
        c.governor.queryFilter(c.governor.filters.ProposalExecuted(), fromBlock).catch(() => []),
      ]);

      const allEvents = [
        ...transfers.map((e) => ({
          type: 'Transfer',
          from: e.args[0],
          to: e.args[1],
          value: e.args[2],
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...delegations.map((e) => ({
          type: 'DelegateChanged',
          delegator: e.args[0],
          fromDelegate: e.args[1],
          toDelegate: e.args[2],
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...proposals.map((e) => ({
          type: 'ProposalCreated',
          proposalId: e.args[0]?.toString(),
          proposer: e.args[1],
          description: e.args[8],
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...votes.map((e) => ({
          type: 'VoteCast',
          voter: e.args[0],
          proposalId: e.args[1]?.toString(),
          support: Number(e.args[2]),
          weight: e.args[3],
          reason: e.args[4],
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...queued.map((e) => ({
          type: 'ProposalQueued',
          proposalId: e.args[0]?.toString(),
          eta: Number(e.args[1]),
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
        ...executed.map((e) => ({
          type: 'ProposalExecuted',
          proposalId: e.args[0]?.toString(),
          blockNumber: e.blockNumber,
          txHash: e.transactionHash,
        })),
      ];

      allEvents.sort((a, b) => b.blockNumber - a.blockNumber);
      setEvents(allEvents);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  }, [c, provider]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Auto-refresh on any event
  useEffect(() => {
    if (!subscribe) return;
    const unsub1 = subscribe('refresh:token', fetchEvents);
    const unsub2 = subscribe('refresh:governor', fetchEvents);
    return () => { unsub1(); unsub2(); };
  }, [subscribe, fetchEvents]);

  const filteredEvents = filter === 'all'
    ? events
    : events.filter((e) => e.type === filter);

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Transfers', value: 'Transfer' },
    { label: 'Delegations', value: 'DelegateChanged' },
    { label: 'Proposals', value: 'ProposalCreated' },
    { label: 'Votes', value: 'VoteCast' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Activity</h2>
        <p className="text-gray-400 mt-1">Recent on-chain events for AEGIS DAO</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              filter === f.value
                ? 'bg-aegis-600/20 text-aegis-400 border border-aegis-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-60">
              {f.value === 'all' ? events.length : events.filter((e) => e.type === f.value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-800">
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={3} />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-400">No events found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredEvents.slice(0, 50).map((event, i) => (
              <EventRow key={`${event.txHash}-${i}`} event={event} token={token} network={network} />
            ))}
          </div>
        )}
      </div>

      {filteredEvents.length > 50 && (
        <p className="text-center text-sm text-gray-500">
          Showing 50 of {filteredEvents.length} events
        </p>
      )}
    </div>
  );
}

function EventRow({ event, token, network }) {
  const info = EVENT_TYPES[event.type] || EVENT_TYPES.Transfer;

  const renderDetails = () => {
    switch (event.type) {
      case 'Transfer':
        return (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-gray-300">{shortenAddress(event.from)}</span>
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            <span className="font-mono text-gray-300">{shortenAddress(event.to)}</span>
            <span className="text-aegis-400 font-medium ml-2">
              {formatTokenAmount(formatUnits(event.value, 18))} {token.symbol}
            </span>
          </div>
        );
      case 'DelegateChanged':
        return (
          <div className="text-sm">
            <span className="font-mono text-gray-300">{shortenAddress(event.delegator)}</span>
            <span className="text-gray-500"> delegated to </span>
            <span className="font-mono text-purple-400">{shortenAddress(event.toDelegate)}</span>
          </div>
        );
      case 'ProposalCreated': {
        const title = event.description?.split('\n')[0]?.replace(/^#+\s*/, '').trim() || 'Untitled';
        return (
          <div className="text-sm">
            <span className="text-gray-300">{title.slice(0, 60)}{title.length > 60 ? '...' : ''}</span>
            <span className="text-gray-500"> by </span>
            <span className="font-mono text-gray-400">{shortenAddress(event.proposer)}</span>
          </div>
        );
      }
      case 'VoteCast':
        return (
          <div className="text-sm">
            <span className="font-mono text-gray-300">{shortenAddress(event.voter)}</span>
            <span className="text-gray-500"> voted </span>
            <span className={event.support === 1 ? 'text-green-400' : event.support === 0 ? 'text-red-400' : 'text-gray-400'}>
              {VOTE_LABELS[event.support] || 'Unknown'}
            </span>
            <span className="text-gray-500"> with </span>
            <span className="text-aegis-400">{formatTokenAmount(formatUnits(event.weight, 18))}</span>
          </div>
        );
      case 'ProposalQueued':
        return (
          <div className="text-sm text-gray-300">
            Proposal queued for execution
          </div>
        );
      case 'ProposalExecuted':
        return (
          <div className="text-sm text-emerald-400">
            Proposal executed successfully
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/30 transition-colors">
      <span className={`text-xs px-2 py-0.5 rounded-full border ${info.bg} ${info.color} ${info.border} flex-shrink-0`}>
        {info.label}
      </span>
      <div className="flex-1 min-w-0">
        {renderDetails()}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
        <span>Block {event.blockNumber}</span>
        {event.txHash && network?.blockExplorer && (
          <a
            href={getExplorerUrl(network.blockExplorer, 'tx', event.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aegis-400 hover:text-aegis-300"
          >
            Tx
          </a>
        )}
      </div>
    </div>
  );
}
