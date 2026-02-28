import { useCallback, useEffect, useState } from 'react';
import { formatUnits, parseUnits } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

export function useToken() {
  const { contracts, readContracts, account, subscribe } = useWeb3();
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    decimals: 18,
    totalSupply: '0',
    balance: '0',
    votingPower: '0',
    delegate: null,
  });
  const [loading, setLoading] = useState(true);

  const c = contracts || readContracts;

  const refresh = useCallback(async () => {
    if (!c?.token) { setLoading(false); return; }

    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        c.token.name(),
        c.token.symbol(),
        c.token.decimals(),
        c.token.totalSupply(),
      ]);

      let balance = 0n;
      let votingPower = 0n;
      let delegate = null;

      if (account) {
        [balance, votingPower, delegate] = await Promise.all([
          c.token.balanceOf(account),
          c.token.getVotes(account),
          c.token.delegates(account),
        ]);
      }

      setTokenData({
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply: formatUnits(totalSupply, decimals),
        balance: formatUnits(balance, decimals),
        votingPower: formatUnits(votingPower, decimals),
        delegate: delegate === '0x0000000000000000000000000000000000000000' ? null : delegate,
      });
    } catch (err) {
      console.error('Failed to fetch token data:', err);
    } finally {
      setLoading(false);
    }
  }, [c, account]);

  useEffect(() => { refresh(); }, [refresh]);

  // Auto-refresh on contract events
  useEffect(() => {
    if (!subscribe) return;
    return subscribe('refresh:token', refresh);
  }, [subscribe, refresh]);

  const transfer = useCallback(async (to, amount) => {
    if (!contracts?.token) throw new Error('Wallet not connected');
    const tx = await contracts.token.transfer(to, parseUnits(amount, tokenData.decimals));
    await tx.wait();
    await refresh();
    return tx;
  }, [contracts, tokenData.decimals, refresh]);

  const approve = useCallback(async (spender, amount) => {
    if (!contracts?.token) throw new Error('Wallet not connected');
    const tx = await contracts.token.approve(spender, parseUnits(amount, tokenData.decimals));
    await tx.wait();
    return tx;
  }, [contracts, tokenData.decimals]);

  const delegateTo = useCallback(async (delegatee) => {
    if (!contracts?.token) throw new Error('Wallet not connected');
    const tx = await contracts.token.delegate(delegatee);
    await tx.wait();
    await refresh();
    return tx;
  }, [contracts, refresh]);

  const getAllowance = useCallback(async (owner, spender) => {
    if (!c?.token) return '0';
    const allowance = await c.token.allowance(owner, spender);
    return formatUnits(allowance, tokenData.decimals);
  }, [c, tokenData.decimals]);

  const getVotesAt = useCallback(async (address, blockNumber) => {
    if (!c?.token) return '0';
    const votes = await c.token.getPastVotes(address, blockNumber);
    return formatUnits(votes, tokenData.decimals);
  }, [c, tokenData.decimals]);

  return {
    ...tokenData,
    loading,
    refresh,
    transfer,
    approve,
    delegateTo,
    getAllowance,
    getVotesAt,
  };
}
