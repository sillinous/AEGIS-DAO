import { useWeb3 } from '../../contexts/Web3Context';
import { shortenAddress } from '../../utils/format';

export default function ConnectWallet() {
  const { account, connect, disconnect, isConnecting, error } = useWeb3();

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-mono text-gray-300">
            {shortenAddress(account)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="btn-secondary text-sm py-2 px-3"
          title="Disconnect wallet"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-400 max-w-48 truncate">{error}</span>
      )}
      <button
        onClick={connect}
        disabled={isConnecting}
        className="btn-primary text-sm"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </button>
    </div>
  );
}
