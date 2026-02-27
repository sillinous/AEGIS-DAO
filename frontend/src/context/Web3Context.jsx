import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS, NETWORKS, SUPPORTED_CHAIN_IDS } from "../config";
import { TOKEN_ABI, GOVERNOR_ABI, TREASURY_ABI } from "../abis";

const Web3Context = createContext(null);

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({ token: null, governor: null, treasury: null });
  const [error, setError] = useState(null);

  const network = chainId ? NETWORKS[chainId] : null;
  const supported = chainId ? SUPPORTED_CHAIN_IDS.includes(chainId) : true;

  const initContracts = useCallback((signerOrProvider) => {
    if (!CONTRACTS.token || !CONTRACTS.governor || !CONTRACTS.treasury) {
      setError("Contract addresses not configured. Set them in .env");
      return;
    }
    setContracts({
      token: new ethers.Contract(CONTRACTS.token, TOKEN_ABI, signerOrProvider),
      governor: new ethers.Contract(CONTRACTS.governor, GOVERNOR_ABI, signerOrProvider),
      treasury: new ethers.Contract(CONTRACTS.treasury, TREASURY_ABI, signerOrProvider),
    });
    setError(null);
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("No wallet detected. Please install MetaMask.");
      return;
    }
    try {
      setError(null);
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();
      const signer = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(signer);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      initContracts(signer);
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
    }
  }, [initContracts]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setContracts({ token: null, governor: null, treasury: null });
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        // Reinitialize with new account
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        browserProvider.getSigner().then((s) => {
          setSigner(s);
          initContracts(s);
        });
      }
    };

    const handleChainChanged = (chainIdHex) => {
      setChainId(Number(chainIdHex));
      // Reinitialize provider on chain change
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      browserProvider.getSigner().then((s) => {
        setSigner(s);
        initContracts(s);
      });
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [disconnect, initContracts]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        network,
        supported,
        provider,
        signer,
        contracts,
        error,
        connect,
        disconnect,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within Web3Provider");
  return context;
}
