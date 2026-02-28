import { useWeb3 } from '../../contexts/Web3Context';
import { NETWORKS, SUPPORTED_CHAIN_IDS } from '../../constants/config';

export default function NetworkBadge() {
  const { chainId, isSupported, switchNetwork } = useWeb3();

  if (!chainId) return null;

  const network = NETWORKS[chainId];

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400 bg-red-400/10 px-2.5 py-1.5 rounded-lg border border-red-400/20">
          Unsupported Network
        </span>
        <select
          onChange={(e) => switchNetwork(Number(e.target.value))}
          className="text-xs bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-gray-300"
          defaultValue=""
        >
          <option value="" disabled>Switch to...</option>
          {SUPPORTED_CHAIN_IDS.map((id) => (
            <option key={id} value={id}>{NETWORKS[id].name}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-xs text-gray-400">
      <div className={`w-2 h-2 rounded-full ${chainId === 137 ? 'bg-purple-400' : chainId === 80002 ? 'bg-blue-400' : 'bg-yellow-400'}`} />
      {network?.name || `Chain ${chainId}`}
    </div>
  );
}
