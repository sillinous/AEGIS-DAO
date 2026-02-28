import { useWeb3 } from '../../contexts/Web3Context';
import { getExplorerUrl } from '../../utils/format';

export default function TransactionStatus({ status, hash, error, onClose }) {
  const { network } = useWeb3();

  if (!status) return null;

  const explorerUrl = hash && network?.blockExplorer
    ? getExplorerUrl(network.blockExplorer, 'tx', hash)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4">
        {status === 'pending' && (
          <div className="text-center py-4">
            <svg className="w-12 h-12 mx-auto animate-spin text-aegis-400 mb-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
            <h3 className="text-lg font-semibold text-white">Transaction Pending</h3>
            <p className="text-sm text-gray-400 mt-2">Waiting for confirmation...</p>
            {explorerUrl && (
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-aegis-400 hover:text-aegis-300 mt-3 inline-block">
                View on Explorer
              </a>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-400/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Transaction Confirmed</h3>
            {explorerUrl && (
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                className="text-sm text-aegis-400 hover:text-aegis-300 mt-2 inline-block">
                View on Explorer
              </a>
            )}
            <button onClick={onClose} className="btn-primary w-full mt-4">Close</button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-400/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Transaction Failed</h3>
            <p className="text-sm text-red-400 mt-2 break-words">
              {error || 'An unknown error occurred'}
            </p>
            <button onClick={onClose} className="btn-secondary w-full mt-4">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
