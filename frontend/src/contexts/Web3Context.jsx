import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

  const network = chainId ? NETWORKS[chainId] : null;
  const isSupported = chainId ? SUPPORTED_CHAIN_IDS.includes(chainId) : false;

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
      // Chain not added - try to add it
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
        // Refresh signer
        if (provider) {
          provider.getSigner().then(setSigner);
        }
      }
    };

    const handleChainChanged = (hexChainId) => {
      const newChainId = parseInt(hexChainId, 16);
      setChainId(newChainId);
      // Refresh provider and signer
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
    connect,
    disconnect,
    switchNetwork,
    formatEther,
    formatUnits,
  }), [provider, signer, account, chainId, network, isSupported, isConnecting, error, contracts, readContracts, connect, disconnect, switchNetwork]);

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
