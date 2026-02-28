import { useCallback, useEffect, useState } from 'react';
import { id as hashId } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export function useGovernor() {
  const { contracts, readContracts, account, provider, subscribe } = useWeb3();
  const [govData, setGovData] = useState({
    votingDelay: 0,
    votingPeriod: 0,
    proposalThreshold: '0',
    quorum: '0',
    name: '',
  });
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const c = contracts || readContracts;

  const refresh = useCallback(async () => {
    if (!c?.governor) { setLoading(false); return; }

    try {
      let currentBlock = 0n;
      try {
        currentBlock = BigInt(await provider.getBlockNumber());
      } catch { /* ignore */ }

      const [votingDelay, votingPeriod, proposalThreshold, name] = await Promise.all([
        c.governor.votingDelay(),
        c.governor.votingPeriod(),
        c.governor.proposalThreshold(),
        c.governor.name(),
      ]);

      let quorum = 0n;
      if (currentBlock > 0n) {
        try {
          quorum = await c.governor.quorum(currentBlock - 1n);
        } catch { /* block may not be valid */ }
      }

      setGovData({
        votingDelay: Number(votingDelay),
        votingPeriod: Number(votingPeriod),
        proposalThreshold: proposalThreshold.toString(),
        quorum: quorum.toString(),
        name,
      });
    } catch (err) {
      console.error('Failed to fetch governor data:', err);
    } finally {
      setLoading(false);
    }
  }, [c, provider]);

  useEffect(() => { refresh(); }, [refresh]);

  // Fetch proposals from ProposalCreated events
  const fetchProposals = useCallback(async () => {
    if (!c?.governor || !provider) return;

    try {
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 100000);

      const filter = c.governor.filters.ProposalCreated();
      const events = await c.governor.queryFilter(filter, fromBlock);

      const enriched = await Promise.all(
        events.map(async (event) => {
          const args = event.args;
          const proposalId = args[0];

          const [state, votes, snapshot, deadline] = await Promise.all([
            c.governor.state(proposalId),
            c.governor.proposalVotes(proposalId).catch(() => [0n, 0n, 0n]),
            c.governor.proposalSnapshot(proposalId),
            c.governor.proposalDeadline(proposalId),
          ]);

          let hasVoted = false;
          if (account) {
            try {
              hasVoted = await c.governor.hasVoted(proposalId, account);
            } catch { /* ignore */ }
          }

          let eta = 0n;
          try {
            eta = await c.governor.proposalEta(proposalId);
          } catch { /* not queued yet */ }

          return {
            id: proposalId.toString(),
            proposer: args[1],
            targets: args[2],
            values: args[3],
            calldatas: args[5],
            voteStart: Number(args[6]),
            voteEnd: Number(args[7]),
            description: args[8],
            state: Number(state),
            againstVotes: votes[0],
            forVotes: votes[1],
            abstainVotes: votes[2],
            snapshot: Number(snapshot),
            deadline: Number(deadline),
            hasVoted,
            eta: Number(eta),
            blockNumber: event.blockNumber,
          };
        })
      );

      setProposals(enriched.reverse());
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
    }
  }, [c, provider, account]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  // Auto-refresh on contract events
  useEffect(() => {
    if (!subscribe) return;
    return subscribe('refresh:governor', () => {
      refresh();
      fetchProposals();
    });
  }, [subscribe, refresh, fetchProposals]);

  const propose = useCallback(async (targets, values, calldatas, description) => {
    if (!contracts?.governor) throw new Error('Wallet not connected');
    const tx = await contracts.governor.propose(targets, values, calldatas, description);
    const receipt = await tx.wait();
    await fetchProposals();
    return { tx, receipt };
  }, [contracts, fetchProposals]);

  const castVote = useCallback(async (proposalId, support) => {
    if (!contracts?.governor) throw new Error('Wallet not connected');
    const tx = await contracts.governor.castVote(proposalId, support);
    await tx.wait();
    await fetchProposals();
    return tx;
  }, [contracts, fetchProposals]);

  const castVoteWithReason = useCallback(async (proposalId, support, reason) => {
    if (!contracts?.governor) throw new Error('Wallet not connected');
    const tx = await contracts.governor.castVoteWithReason(proposalId, support, reason);
    await tx.wait();
    await fetchProposals();
    return tx;
  }, [contracts, fetchProposals]);

  const queueProposal = useCallback(async (targets, values, calldatas, description) => {
    if (!contracts?.governor) throw new Error('Wallet not connected');
    const descriptionHash = hashId(description);
    const tx = await contracts.governor.queue(targets, values, calldatas, descriptionHash);
    await tx.wait();
    await fetchProposals();
    return tx;
  }, [contracts, fetchProposals]);

  const executeProposal = useCallback(async (targets, values, calldatas, description) => {
    if (!contracts?.governor) throw new Error('Wallet not connected');
    const descriptionHash = hashId(description);
    const tx = await contracts.governor.execute(targets, values, calldatas, descriptionHash);
    await tx.wait();
    await fetchProposals();
    return tx;
  }, [contracts, fetchProposals]);

  const cancelProposal = useCallback(async (targets, values, calldatas, description) => {
    if (!contracts?.governor) throw new Error('Wallet not connected');
    const descriptionHash = hashId(description);
    const tx = await contracts.governor.cancel(targets, values, calldatas, descriptionHash);
    await tx.wait();
    await fetchProposals();
    return tx;
  }, [contracts, fetchProposals]);

  const getProposalState = useCallback(async (proposalId) => {
    if (!c?.governor) return null;
    return Number(await c.governor.state(proposalId));
  }, [c]);

  return {
    ...govData,
    proposals,
    loading,
    refresh,
    fetchProposals,
    propose,
    castVote,
    castVoteWithReason,
    queueProposal,
    executeProposal,
    cancelProposal,
    getProposalState,
  };
}
