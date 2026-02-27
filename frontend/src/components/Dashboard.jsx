import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { CONTRACTS } from "../config";
import { formatTokens, formatDuration, formatAddress } from "../utils";

export default function Dashboard() {
  const { account, provider, contracts, network } = useWeb3();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contracts.token || !contracts.governor || !contracts.treasury || !account) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [
          balance,
          votes,
          delegate,
          totalSupply,
          treasuryBalance,
          votingDelay,
          votingPeriod,
          threshold,
          timelockDelay,
          clock,
        ] = await Promise.all([
          contracts.token.balanceOf(account),
          contracts.token.getVotes(account),
          contracts.token.delegates(account),
          contracts.token.totalSupply(),
          provider.getBalance(CONTRACTS.treasury),
          contracts.governor.votingDelay(),
          contracts.governor.votingPeriod(),
          contracts.governor.proposalThreshold(),
          contracts.treasury.getMinDelay(),
          contracts.governor.clock(),
        ]);

        const quorum = await contracts.governor.quorum(clock - 1n);

        if (!cancelled) {
          setData({
            balance,
            votes,
            delegate,
            totalSupply,
            treasuryBalance,
            votingDelay,
            votingPeriod,
            threshold,
            timelockDelay,
            quorum,
          });
        }
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [account, provider, contracts]);

  if (!account) {
    return (
      <div className="empty-state">
        <h2>Welcome to AEGIS DAO</h2>
        <p>Connect your wallet to view the governance dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="empty-state">Unable to load data. Check contract addresses.</div>;
  }

  const currency = network?.currency || "ETH";
  const selfDelegated =
    data.delegate && data.delegate.toLowerCase() === account.toLowerCase();
  const notDelegated =
    data.delegate === ethers.ZeroAddress;

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Your Balance</div>
          <div className="stat-value">{formatTokens(data.balance)}</div>
          <div className="stat-sub">AEGIS</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Voting Power</div>
          <div className="stat-value">{formatTokens(data.votes)}</div>
          <div className="stat-sub">
            {notDelegated
              ? "Not delegated"
              : selfDelegated
              ? "Self-delegated"
              : `Delegated to ${formatAddress(data.delegate)}`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Treasury Balance</div>
          <div className="stat-value">{formatTokens(data.treasuryBalance)}</div>
          <div className="stat-sub">{currency}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Supply</div>
          <div className="stat-value">{formatTokens(data.totalSupply)}</div>
          <div className="stat-sub">AEGIS</div>
        </div>
      </div>

      <h3>Governance Parameters</h3>
      <div className="params-grid">
        <div className="param">
          <span className="param-label">Voting Delay</span>
          <span className="param-value">{formatDuration(data.votingDelay)}</span>
        </div>
        <div className="param">
          <span className="param-label">Voting Period</span>
          <span className="param-value">{formatDuration(data.votingPeriod)}</span>
        </div>
        <div className="param">
          <span className="param-label">Quorum</span>
          <span className="param-value">{formatTokens(data.quorum)} AEGIS</span>
        </div>
        <div className="param">
          <span className="param-label">Proposal Threshold</span>
          <span className="param-value">{formatTokens(data.threshold)} AEGIS</span>
        </div>
        <div className="param">
          <span className="param-label">Timelock Delay</span>
          <span className="param-value">{formatDuration(data.timelockDelay)}</span>
        </div>
      </div>
    </div>
  );
}
