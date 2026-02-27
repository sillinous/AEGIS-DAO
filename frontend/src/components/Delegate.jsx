import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { formatAddress, formatTokens } from "../utils";

export default function Delegate() {
  const { account, contracts } = useWeb3();
  const [currentDelegate, setCurrentDelegate] = useState(null);
  const [votes, setVotes] = useState(null);
  const [balance, setBalance] = useState(null);
  const [delegateTo, setDelegateTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contracts.token || !account) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [del, v, bal] = await Promise.all([
          contracts.token.delegates(account),
          contracts.token.getVotes(account),
          contracts.token.balanceOf(account),
        ]);
        if (!cancelled) {
          setCurrentDelegate(del);
          setVotes(v);
          setBalance(bal);
        }
      } catch (err) {
        console.error("Failed to load delegation info:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [account, contracts.token]);

  async function handleDelegate(address) {
    setError("");
    setSubmitting(true);
    try {
      const tx = await contracts.token.delegate(address);
      await tx.wait();
      // Refresh state
      const [del, v] = await Promise.all([
        contracts.token.delegates(account),
        contracts.token.getVotes(account),
      ]);
      setCurrentDelegate(del);
      setVotes(v);
      setDelegateTo("");
    } catch (err) {
      console.error("Delegation failed:", err);
      setError(err?.info?.error?.message || err.reason || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ethers.isAddress(delegateTo)) {
      setError("Invalid address");
      return;
    }
    await handleDelegate(delegateTo);
  }

  if (!account) {
    return (
      <div className="empty-state">
        <p>Connect your wallet to manage delegation.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading delegation info...</div>;
  }

  const notDelegated = currentDelegate === ethers.ZeroAddress;
  const selfDelegated = currentDelegate?.toLowerCase() === account.toLowerCase();

  return (
    <div className="delegate-page">
      <h2>Delegate Voting Power</h2>

      <div className="delegate-info">
        <div className="stat-card">
          <div className="stat-label">Your Balance</div>
          <div className="stat-value">{formatTokens(balance)}</div>
          <div className="stat-sub">AEGIS</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Voting Power</div>
          <div className="stat-value">{formatTokens(votes)}</div>
          <div className="stat-sub">AEGIS</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current Delegate</div>
          <div className="stat-value" style={{ fontSize: "1rem" }}>
            {notDelegated
              ? "None"
              : selfDelegated
              ? "Self"
              : formatAddress(currentDelegate)}
          </div>
          <div className="stat-sub">
            {notDelegated
              ? "Delegate to activate voting power"
              : selfDelegated
              ? "You vote for yourself"
              : currentDelegate}
          </div>
        </div>
      </div>

      {notDelegated && (
        <div className="delegate-warning">
          Your tokens have no voting power until delegated. Delegate to yourself to
          activate your own voting power, or delegate to another address.
        </div>
      )}

      <div className="delegate-actions">
        <button
          className="btn btn-primary btn-block"
          onClick={() => handleDelegate(account)}
          disabled={submitting || selfDelegated}
        >
          {selfDelegated ? "Already Self-Delegated" : "Delegate to Self"}
        </button>
      </div>

      <div className="delegate-divider">
        <span>or delegate to another address</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="delegateAddress">Delegate Address</label>
          <input
            id="delegateAddress"
            type="text"
            placeholder="0x..."
            value={delegateTo}
            onChange={(e) => setDelegateTo(e.target.value)}
            required
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-outline btn-block"
          disabled={submitting}
        >
          {submitting ? "Delegating..." : "Delegate"}
        </button>
      </form>
    </div>
  );
}
