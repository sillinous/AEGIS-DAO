import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import {
  formatAddress,
  formatTokens,
  formatTimestamp,
  getProposalState,
  descriptionHash,
} from "../utils";

export default function Proposals() {
  const { account, contracts, provider } = useWeb3();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txPending, setTxPending] = useState(null);

  const loadProposals = useCallback(async () => {
    if (!contracts.governor || !provider) return;
    setLoading(true);
    try {
      // Query ProposalCreated events from deployment block
      const filter = contracts.governor.filters.ProposalCreated();
      const events = await contracts.governor.queryFilter(filter, 0, "latest");

      const items = await Promise.all(
        events.map(async (event) => {
          const {
            proposalId,
            proposer,
            targets,
            values,
            calldatas,
            voteStart,
            voteEnd,
            description,
          } = event.args;

          const [state, votes, hasVoted] = await Promise.all([
            contracts.governor.state(proposalId),
            contracts.governor.proposalVotes(proposalId).catch(() => [0n, 0n, 0n]),
            account
              ? contracts.governor.hasVoted(proposalId, account).catch(() => false)
              : false,
          ]);

          return {
            id: proposalId,
            proposer,
            targets: [...targets],
            values: [...values],
            calldatas: [...calldatas],
            voteStart: Number(voteStart),
            voteEnd: Number(voteEnd),
            description,
            state: Number(state),
            againstVotes: votes[0],
            forVotes: votes[1],
            abstainVotes: votes[2],
            hasVoted,
          };
        })
      );

      setProposals(items.reverse());
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoading(false);
    }
  }, [contracts.governor, provider, account]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  async function handleVote(proposal, support) {
    if (!contracts.governor) return;
    setTxPending(proposal.id.toString());
    try {
      const tx = await contracts.governor.castVote(proposal.id, support);
      await tx.wait();
      await loadProposals();
    } catch (err) {
      console.error("Vote failed:", err);
      alert(err?.info?.error?.message || err.reason || "Vote transaction failed");
    } finally {
      setTxPending(null);
    }
  }

  async function handleQueue(proposal) {
    if (!contracts.governor) return;
    setTxPending(proposal.id.toString());
    try {
      const hash = descriptionHash(proposal.description);
      const tx = await contracts.governor.queue(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        hash
      );
      await tx.wait();
      await loadProposals();
    } catch (err) {
      console.error("Queue failed:", err);
      alert(err?.info?.error?.message || err.reason || "Queue transaction failed");
    } finally {
      setTxPending(null);
    }
  }

  async function handleExecute(proposal) {
    if (!contracts.governor) return;
    setTxPending(proposal.id.toString());
    try {
      const hash = descriptionHash(proposal.description);
      const tx = await contracts.governor.execute(
        proposal.targets,
        proposal.values,
        proposal.calldatas,
        hash
      );
      await tx.wait();
      await loadProposals();
    } catch (err) {
      console.error("Execute failed:", err);
      alert(err?.info?.error?.message || err.reason || "Execute transaction failed");
    } finally {
      setTxPending(null);
    }
  }

  if (!account) {
    return (
      <div className="empty-state">
        <p>Connect your wallet to view proposals.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading proposals...</div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="empty-state">
        <h3>No Proposals Yet</h3>
        <p>Create the first governance proposal to get started.</p>
      </div>
    );
  }

  return (
    <div className="proposals">
      <h2>Proposals ({proposals.length})</h2>
      {proposals.map((p) => {
        const stateInfo = getProposalState(p.state);
        const isPending = txPending === p.id.toString();
        const totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        const forPct = totalVotes > 0n ? Number((p.forVotes * 100n) / totalVotes) : 0;
        const againstPct = totalVotes > 0n ? Number((p.againstVotes * 100n) / totalVotes) : 0;

        return (
          <div key={p.id.toString()} className="proposal-card">
            <div className="proposal-header">
              <span className="proposal-state" style={{ background: stateInfo.color }}>
                {stateInfo.label}
              </span>
              <span className="proposal-proposer">
                by {formatAddress(p.proposer)}
              </span>
            </div>

            <p className="proposal-description">{p.description}</p>

            <div className="proposal-votes">
              <div className="vote-bar">
                <div
                  className="vote-bar-for"
                  style={{ width: `${forPct}%` }}
                />
                <div
                  className="vote-bar-against"
                  style={{ width: `${againstPct}%` }}
                />
              </div>
              <div className="vote-counts">
                <span className="vote-for">For: {formatTokens(p.forVotes)}</span>
                <span className="vote-against">Against: {formatTokens(p.againstVotes)}</span>
                <span className="vote-abstain">Abstain: {formatTokens(p.abstainVotes)}</span>
              </div>
            </div>

            <div className="proposal-timing">
              <span>Voting starts: {formatTimestamp(p.voteStart)}</span>
              <span>Voting ends: {formatTimestamp(p.voteEnd)}</span>
            </div>

            <div className="proposal-actions">
              {p.state === 1 && !p.hasVoted && (
                <>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleVote(p, 1)}
                    disabled={isPending}
                  >
                    Vote For
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleVote(p, 0)}
                    disabled={isPending}
                  >
                    Vote Against
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleVote(p, 2)}
                    disabled={isPending}
                  >
                    Abstain
                  </button>
                </>
              )}
              {p.state === 1 && p.hasVoted && (
                <span className="voted-badge">You have voted</span>
              )}
              {p.state === 4 && (
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => handleQueue(p)}
                  disabled={isPending}
                >
                  Queue for Execution
                </button>
              )}
              {p.state === 5 && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExecute(p)}
                  disabled={isPending}
                >
                  Execute
                </button>
              )}
              {isPending && <span className="tx-pending">Transaction pending...</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
