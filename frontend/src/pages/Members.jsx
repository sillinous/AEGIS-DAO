import { useCallback, useEffect, useState } from 'react';
import { formatUnits } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useToken } from '../hooks/useToken';
import { shortenAddress, formatTokenAmount, getExplorerUrl } from '../utils/format';
import { TableRowSkeleton } from '../components/common/Skeleton';

export default function Members() {
  const { contracts, readContracts, provider, network, account } = useWeb3();
  const token = useToken();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const c = contracts || readContracts;

  const fetchMembers = useCallback(async () => {
    if (!c?.token || !provider) { setLoading(false); return; }

    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100000);

      // Get unique addresses from Transfer events
      const transferEvents = await c.token.queryFilter(c.token.filters.Transfer(), fromBlock);
      const addressSet = new Set();

      transferEvents.forEach((e) => {
        const from = e.args[0];
        const to = e.args[1];
        if (from !== '0x0000000000000000000000000000000000000000') addressSet.add(from);
        if (to !== '0x0000000000000000000000000000000000000000') addressSet.add(to);
      });

      // Also get delegate events
      const delegateEvents = await c.token.queryFilter(c.token.filters.DelegateChanged(), fromBlock);
      delegateEvents.forEach((e) => {
        addressSet.add(e.args[0]); // delegator
      });

      const addresses = Array.from(addressSet);

      // Fetch balance and voting power for each
      const memberData = await Promise.all(
        addresses.map(async (addr) => {
          const [balance, votingPower, delegate] = await Promise.all([
            c.token.balanceOf(addr),
            c.token.getVotes(addr),
            c.token.delegates(addr).catch(() => null),
          ]);

          return {
            address: addr,
            balance,
            votingPower,
            delegate: delegate === '0x0000000000000000000000000000000000000000' ? null : delegate,
          };
        })
      );

      // Filter out zero balance and sort by voting power
      const active = memberData
        .filter((m) => m.balance > 0n || m.votingPower > 0n)
        .sort((a, b) => {
          if (b.votingPower > a.votingPower) return 1;
          if (b.votingPower < a.votingPower) return -1;
          if (b.balance > a.balance) return 1;
          if (b.balance < a.balance) return -1;
          return 0;
        });

      setMembers(active);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }, [c, provider]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const totalVotingPower = members.reduce((sum, m) => sum + m.votingPower, 0n);
  const totalBalance = members.reduce((sum, m) => sum + m.balance, 0n);
  const delegatedCount = members.filter((m) => m.delegate).length;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Members & Delegates</h2>
        <p className="text-gray-400 mt-1">Token holders and voting power distribution</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="stat-label">Total Members</p>
          <p className="stat-value">{members.length}</p>
          <p className="text-xs text-gray-500 mt-1">Unique holders</p>
        </div>
        <div className="card">
          <p className="stat-label">Delegated</p>
          <p className="stat-value">{delegatedCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {members.length > 0 ? Math.round((delegatedCount / members.length) * 100) : 0}% of holders
          </p>
        </div>
        <div className="card">
          <p className="stat-label">Active Voting Power</p>
          <p className="stat-value">{formatTokenAmount(formatUnits(totalVotingPower, 18))}</p>
          <p className="text-xs text-gray-500 mt-1">{token.symbol}</p>
        </div>
        <div className="card">
          <p className="stat-label">Total Held</p>
          <p className="stat-value">{formatTokenAmount(formatUnits(totalBalance, 18))}</p>
          <p className="text-xs text-gray-500 mt-1">{token.symbol}</p>
        </div>
      </div>

      {/* Voting power distribution */}
      {members.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Voting Power Distribution</h3>
          <div className="space-y-3">
            {members.slice(0, 10).map((m, i) => {
              const pct = totalVotingPower > 0n
                ? Number((m.votingPower * 10000n) / totalVotingPower) / 100
                : 0;
              const isYou = account?.toLowerCase() === m.address.toLowerCase();

              return (
                <div key={m.address} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-6 text-right">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-300">
                        {shortenAddress(m.address, 6)}
                      </span>
                      {isYou && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-aegis-600/20 text-aegis-400 border border-aegis-500/30">
                          You
                        </span>
                      )}
                      {m.delegate && m.delegate.toLowerCase() === m.address.toLowerCase() && (
                        <span className="text-xs text-green-400">Self-delegated</span>
                      )}
                      {m.delegate && m.delegate.toLowerCase() !== m.address.toLowerCase() && (
                        <span className="text-xs text-gray-500">
                          Delegates to {shortenAddress(m.delegate)}
                        </span>
                      )}
                    </div>
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-aegis-600 to-aegis-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 0.5)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 w-28">
                    <p className="text-sm font-medium text-white">
                      {formatTokenAmount(formatUnits(m.votingPower, 18))}
                    </p>
                    <p className="text-xs text-gray-500">{pct.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h3 className="text-lg font-semibold text-white">All Members</h3>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-800">
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={4} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No token holders found</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-4 px-6 py-3 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800 bg-gray-900/50">
              <span className="w-8">#</span>
              <span className="flex-1">Address</span>
              <span className="w-32 text-right">Balance</span>
              <span className="w-32 text-right">Voting Power</span>
              <span className="w-40 text-right">Delegation</span>
            </div>
            <div className="divide-y divide-gray-800">
              {members.map((m, i) => {
                const isYou = account?.toLowerCase() === m.address.toLowerCase();
                return (
                  <div
                    key={m.address}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-800/30 transition-colors ${
                      isYou ? 'bg-aegis-600/5' : ''
                    }`}
                  >
                    <span className="text-xs text-gray-500 w-8">{i + 1}</span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-300 truncate">
                        {shortenAddress(m.address, 6)}
                      </span>
                      {isYou && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-aegis-600/20 text-aegis-400 border border-aegis-500/30 flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <span className="w-32 text-right text-sm text-gray-300">
                      {formatTokenAmount(formatUnits(m.balance, 18))}
                    </span>
                    <span className="w-32 text-right text-sm font-medium text-white">
                      {formatTokenAmount(formatUnits(m.votingPower, 18))}
                    </span>
                    <span className="w-40 text-right text-xs">
                      {m.delegate ? (
                        m.delegate.toLowerCase() === m.address.toLowerCase() ? (
                          <span className="text-green-400">Self-delegated</span>
                        ) : (
                          <span className="text-gray-400 font-mono">{shortenAddress(m.delegate)}</span>
                        )
                      ) : (
                        <span className="text-yellow-400">Not delegated</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
