import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserProvider, Contract, formatEther, formatUnits } from 'ethers';
import { TOKEN_ABI, GOVERNOR_ABI, TREASURY_ABI } from '../constants/abis';
import { NETWORKS, SUPPORTED_CHAIN_IDS } from '../constants/config';

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [blockNumber, setBlockNumber] = useState(0);

  // Event bus for real-time updates
  const listenersRef = useRef(new Map());

  const network = chainId ? NETWORKS[chainId] : null;
  const isSupported = chainId ? SUPPORTED_CHAIN_IDS.includes(chainId) : false;

  // Subscribe to internal event bus
  const subscribe = useCallback((eventName, callback) => {
    const listeners = listenersRef.current;
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(callback);
    return () => listeners.get(eventName)?.delete(callback);
  }, []);

  const emit = useCallback((eventName, data) => {
    const callbacks = listenersRef.current.get(eventName);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }, []);

  // Contract instances
  const contracts = useMemo(() => {
    if (!signer || !network?.contracts?.token) return null;
    const { token, governor, treasury } = network.contracts;
    if (!token || !governor || !treasury) return null;

    return {
      token: new Contract(token, TOKEN_ABI, signer),
      governor: new Contract(governor, GOVERNOR_ABI, signer),
      treasury: new Contract(treasury, TREASURY_ABI, signer),
    };
  }, [signer, network]);

  // Read-only contract instances (for when wallet is not connected)
  const readContracts = useMemo(() => {
    if (!provider || !network?.contracts?.token) return null;
    const { token, governor, treasury } = network.contracts;
    if (!token || !governor || !treasury) return null;

    return {
      token: new Contract(token, TOKEN_ABI, provider),
      governor: new Contract(governor, GOVERNOR_ABI, provider),
      treasury: new Contract(treasury, TREASURY_ABI, provider),
    };
  }, [provider, network]);

  // Real-time event listeners on contracts
  useEffect(() => {
    const c = contracts || readContracts;
    if (!c) return;

    const cleanups = [];

    const onTransfer = (from, to, value, event) => {
      emit('Transfer', { from, to, value, event });
      emit('refresh:token', {});
    };
    c.token.on('Transfer', onTransfer);
    cleanups.push(() => c.token.off('Transfer', onTransfer));

    const onDelegateChanged = (delegator, fromDelegate, toDelegate, event) => {
      emit('DelegateChanged', { delegator, fromDelegate, toDelegate, event });
      emit('refresh:token', {});
    };
    c.token.on('DelegateChanged', onDelegateChanged);
    cleanups.push(() => c.token.off('DelegateChanged', onDelegateChanged));

    const onProposalCreated = (...args) => {
      emit('ProposalCreated', args);
      emit('refresh:governor', {});
    };
    c.governor.on('ProposalCreated', onProposalCreated);
    cleanups.push(() => c.governor.off('ProposalCreated', onProposalCreated));

    const onVoteCast = (voter, proposalId, support, weight, reason, event) => {
      emit('VoteCast', { voter, proposalId, support, weight, reason, event });
      emit('refresh:governor', {});
    };
    c.governor.on('VoteCast', onVoteCast);
    cleanups.push(() => c.governor.off('VoteCast', onVoteCast));

    const onProposalQueued = (proposalId, etaSeconds, event) => {
      emit('ProposalQueued', { proposalId, etaSeconds, event });
      emit('refresh:governor', {});
    };
    c.governor.on('ProposalQueued', onProposalQueued);
    cleanups.push(() => c.governor.off('ProposalQueued', onProposalQueued));

    const onProposalExecuted = (proposalId, event) => {
      emit('ProposalExecuted', { proposalId, event });
      emit('refresh:governor', {});
      emit('refresh:treasury', {});
    };
    c.governor.on('ProposalExecuted', onProposalExecuted);
    cleanups.push(() => c.governor.off('ProposalExecuted', onProposalExecuted));

    return () => cleanups.forEach((fn) => fn());
  }, [contracts, readContracts, emit]);

  // Track block number
  useEffect(() => {
    if (!provider) return;
    const onBlock = (num) => {
      setBlockNumber(num);
      emit('block', num);
    };
    provider.on('block', onBlock);
    provider.getBlockNumber().then(setBlockNumber).catch(() => {});
    return () => provider.off('block', onBlock);
  }, [provider, emit]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('No wallet detected. Please install MetaMask.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const network = await browserProvider.getNetwork();
      const currentSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(currentSigner);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) return;

    const hexChainId = '0x' + targetChainId.toString(16);
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (err) {
      if (err.code === 4902) {
        const net = NETWORKS[targetChainId];
        if (!net) return;
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: hexChainId,
            chainName: net.name,
            rpcUrls: [net.rpcUrl],
            blockExplorerUrls: net.blockExplorer ? [net.blockExplorer] : [],
            nativeCurrency: net.currency,
          }],
        });
      }
    }
  }, []);

  // Listen for wallet events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        if (provider) {
          provider.getSigner().then(setSigner);
        }
      }
    };

    const handleChainChanged = (hexChainId) => {
      const newChainId = parseInt(hexChainId, 16);
      setChainId(newChainId);
      const browserProvider = new BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      browserProvider.getSigner().then(setSigner);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        if (accounts.length > 0) connect();
      });
    }
  }, [connect]);

  const value = useMemo(() => ({
    provider,
    signer,
    account,
    chainId,
    network,
    isSupported,
    isConnecting,
    error,
    contracts,
    readContracts,
    blockNumber,
    connect,
    disconnect,
    switchNetwork,
    subscribe,
    emit,
    formatEther,
    formatUnits,
  }), [provider, signer, account, chainId, network, isSupported, isConnecting, error, contracts, readContracts, blockNumber, connect, disconnect, switchNetwork, subscribe, emit]);

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider');
  return ctx;
}
