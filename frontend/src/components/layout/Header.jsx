import { useWeb3 } from '../../contexts/Web3Context';
import { shortenAddress } from '../../utils/format';
import { NETWORKS, SUPPORTED_CHAIN_IDS } from '../../constants/config';
import ConnectWallet from '../common/ConnectWallet';
import NetworkBadge from '../common/NetworkBadge';

export default function Header() {
  const { account, chainId, isSupported } = useWeb3();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 100 100" className="w-8 h-8">
              <defs>
                <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6366f1' }} />
                  <stop offset="100%" style={{ stopColor: '#818cf8' }} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" fill="none" stroke="url(#hg)" strokeWidth="4" />
              <path d="M50 15 L75 75 H25 Z" fill="none" stroke="url(#hg)" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="50" cy="50" r="12" fill="url(#hg)" opacity="0.8" />
            </svg>
            <h1 className="text-xl font-bold bg-gradient-to-r from-aegis-400 to-aegis-300 bg-clip-text text-transparent">
              AEGIS DAO
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {account && <NetworkBadge />}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
