import { useCallback, useEffect, useState } from 'react';
import { formatEther, parseEther } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export function useTreasury() {
  const { contracts, readContracts, provider, network, signer, subscribe } = useWeb3();
  const [treasuryData, setTreasuryData] = useState({
    balance: '0',
    minDelay: 0,
    proposerRole: null,
    executorRole: null,
    adminRole: null,
  });
  const [loading, setLoading] = useState(true);

  const c = contracts || readContracts;

  const refresh = useCallback(async () => {
    if (!c?.treasury || !provider || !network?.contracts?.treasury) {
      setLoading(false);
      return;
    }

    try {
      const [balance, minDelay, proposerRole, executorRole, adminRole] = await Promise.all([
        provider.getBalance(network.contracts.treasury),
        c.treasury.getMinDelay(),
        c.treasury.PROPOSER_ROLE(),
        c.treasury.EXECUTOR_ROLE(),
        c.treasury.DEFAULT_ADMIN_ROLE(),
      ]);

      setTreasuryData({
        balance: formatEther(balance),
        minDelay: Number(minDelay),
        proposerRole,
        executorRole,
        adminRole,
      });
    } catch (err) {
      console.error('Failed to fetch treasury data:', err);
    } finally {
      setLoading(false);
    }
  }, [c, provider, network]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh on contract events
  useEffect(() => {
    if (!subscribe) return;
    return subscribe('refresh:treasury', refresh);
  }, [subscribe, refresh]);

  const deposit = useCallback(async (amount) => {
    if (!signer || !network?.contracts?.treasury) throw new Error('Wallet not connected');
    const tx = await signer.sendTransaction({
      to: network.contracts.treasury,
      value: parseEther(amount),
    });
    await tx.wait();
    await refresh();
    return tx;
  }, [signer, network, refresh]);

  const checkRole = useCallback(async (role, address) => {
    if (!c?.treasury) return false;
    return c.treasury.hasRole(role, address);
  }, [c]);

  const checkOperation = useCallback(async (operationId) => {
    if (!c?.treasury) return null;
    const [isPending, isReady, isDone] = await Promise.all([
      c.treasury.isOperationPending(operationId),
      c.treasury.isOperationReady(operationId),
      c.treasury.isOperationDone(operationId),
    ]);
    return { isPending, isReady, isDone };
  }, [c]);

  const getOperationState = useCallback(async (operationId) => {
    if (!c?.treasury) return null;
    return Number(await c.treasury.getOperationState(operationId));
  }, [c]);

  return {
    ...treasuryData,
    loading,
    refresh,
    deposit,
    checkRole,
    checkOperation,
    getOperationState,
  };
}
