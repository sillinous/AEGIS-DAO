import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useTreasury } from '../hooks/useTreasury';
import { useGovernor } from '../hooks/useGovernor';
import { formatTokenAmount, formatDuration, shortenAddress, getExplorerUrl } from '../utils/format';
import TransactionStatus from '../components/common/TransactionStatus';

export default function Treasury() {
  const { account, network } = useWeb3();
  const treasury = useTreasury();
  const governor = useGovernor();

  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  const resetTx = () => { setTxStatus(null); setTxHash(null); setTxError(null); };

  const treasuryAddress = network?.contracts?.treasury;
  const explorerUrl = treasuryAddress && network?.blockExplorer
    ? getExplorerUrl(network.blockExplorer, 'address', treasuryAddress)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">Treasury</h2>
        <p className="text-gray-400 mt-1">DAO treasury managed through timelock governance</p>
      </div>

      {/* Treasury overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-aegis-500/10">
          <p className="stat-label">Treasury Balance</p>
          <p className="stat-value text-aegis-400">{formatTokenAmount(treasury.balance, 4)}</p>
          <p className="text-xs text-gray-500 mt-1">{network?.currency?.symbol || 'ETH'}</p>
        </div>
        <div className="card">
          <p className="stat-label">Timelock Delay</p>
          <p className="text-lg font-semibold text-white">{formatDuration(treasury.minDelay)}</p>
          <p className="text-xs text-gray-500 mt-1">{treasury.minDelay} seconds</p>
        </div>
        <div className="card">
          <p className="stat-label">Queued Proposals</p>
          <p className="stat-value">
            {governor.proposals.filter((p) => p.state === 5).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Awaiting execution</p>
        </div>
        <div className="card">
          <p className="stat-label">Executed Proposals</p>
          <p className="stat-value">
            {governor.proposals.filter((p) => p.state === 7).length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
      </div>

      {/* Treasury address and explorer */}
      {treasuryAddress && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-3">Treasury Contract</h3>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="text-sm font-mono text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">
              {treasuryAddress}
            </code>
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-aegis-400 hover:text-aegis-300"
              >
                View on Explorer
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit */}
        <DepositSection
          treasury={treasury}
          network={network}
          account={account}
          setTxStatus={setTxStatus}
          setTxHash={setTxHash}
          setTxError={setTxError}
        />

        {/* Role checker */}
        <RoleCheckerSection treasury={treasury} network={network} />
      </div>

      {/* Operation checker */}
      <OperationCheckerSection treasury={treasury} />

      {/* Security information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Security Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <p className="font-medium text-green-400 mb-2">Timelock Protection</p>
            <p className="text-gray-400">
              All treasury operations require a {formatDuration(treasury.minDelay)} delay
              after governance approval, giving token holders time to react.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <p className="font-medium text-blue-400 mb-2">Governance-Only Access</p>
            <p className="text-gray-400">
              Only the AEGIS Governor contract can propose treasury operations.
              No admin keys exist after deployment.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <p className="font-medium text-purple-400 mb-2">Role-Based Control</p>
            <p className="text-gray-400">
              PROPOSER, EXECUTOR, and CANCELLER roles are managed through
              OpenZeppelin's AccessControl system.
            </p>
          </div>
        </div>
      </div>

      <TransactionStatus status={txStatus} hash={txHash} error={txError} onClose={resetTx} />
    </div>
  );
}

function DepositSection({ treasury, network, account, setTxStatus, setTxHash, setTxError }) {
  const [amount, setAmount] = useState('');

  const handleDeposit = async (e) => {
    e.preventDefault();
    setTxStatus('pending');
    try {
      const tx = await treasury.deposit(amount);
      setTxHash(tx.hash);
      setTxStatus('success');
      setAmount('');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Deposit to Treasury</h3>
      <p className="text-sm text-gray-400 mb-4">
        Send {network?.currency?.symbol || 'ETH'} directly to the treasury contract.
        Anyone can deposit funds.
      </p>
      {!account ? (
        <p className="text-sm text-gray-500">Connect wallet to deposit</p>
      ) : (
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="label">Amount ({network?.currency?.symbol || 'ETH'})</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input-field"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">Deposit</button>
        </form>
      )}
    </div>
  );
}

function RoleCheckerSection({ treasury, network }) {
  const [address, setAddress] = useState('');
  const [roles, setRoles] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setChecking(true);
    try {
      const [isProposer, isExecutor, isAdmin] = await Promise.all([
        treasury.checkRole(treasury.proposerRole, address),
        treasury.checkRole(treasury.executorRole, address),
        treasury.checkRole(treasury.adminRole, address),
      ]);
      setRoles({ isProposer, isExecutor, isAdmin });
    } catch (err) {
      console.error(err);
      setRoles(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Check Roles</h3>
      <p className="text-sm text-gray-400 mb-4">
        Verify which roles an address holds on the treasury.
      </p>
      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label className="label">Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            className="input-field font-mono text-sm"
            required
          />
        </div>
        <button type="submit" disabled={checking} className="btn-secondary w-full">
          {checking ? 'Checking...' : 'Check Roles'}
        </button>
        {roles && (
          <div className="space-y-2">
            <RoleBadge label="PROPOSER" active={roles.isProposer} />
            <RoleBadge label="EXECUTOR" active={roles.isExecutor} />
            <RoleBadge label="ADMIN" active={roles.isAdmin} />
          </div>
        )}
      </form>
    </div>
  );
}

function RoleBadge({ label, active }) {
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border ${
      active
        ? 'bg-green-400/10 border-green-400/20 text-green-400'
        : 'bg-gray-800 border-gray-700 text-gray-500'
    }`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs">{active ? 'Granted' : 'Not granted'}</span>
    </div>
  );
}

function OperationCheckerSection({ treasury }) {
  const [operationId, setOperationId] = useState('');
  const [opState, setOpState] = useState(null);
  const [checking, setChecking] = useState(false);

  const OP_STATES = { 0: 'Unset', 1: 'Waiting', 2: 'Ready', 3: 'Done' };

  const handleCheck = async (e) => {
    e.preventDefault();
    setChecking(true);
    try {
      const status = await treasury.checkOperation(operationId);
      const state = await treasury.getOperationState(operationId);
      setOpState({ ...status, stateLabel: OP_STATES[state] || 'Unknown', state });
    } catch (err) {
      console.error(err);
      setOpState(null);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Check Operation Status</h3>
      <p className="text-sm text-gray-400 mb-4">
        Look up the status of a timelock operation by its ID (bytes32 hash).
      </p>
      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label className="label">Operation ID (bytes32)</label>
          <input
            type="text"
            value={operationId}
            onChange={(e) => setOperationId(e.target.value)}
            placeholder="0x..."
            className="input-field font-mono text-sm"
            required
          />
        </div>
        <button type="submit" disabled={checking} className="btn-secondary w-full">
          {checking ? 'Checking...' : 'Check Status'}
        </button>
        {opState && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-gray-800 border border-gray-700">
              <p className="text-xs text-gray-400">State</p>
              <p className="text-sm font-semibold text-white">{opState.stateLabel}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-800 border border-gray-700">
              <p className="text-xs text-gray-400">Pending</p>
              <p className="text-sm font-semibold text-white">{opState.isPending ? 'Yes' : 'No'}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-800 border border-gray-700">
              <p className="text-xs text-gray-400">Ready</p>
              <p className="text-sm font-semibold text-white">{opState.isReady ? 'Yes' : 'No'}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-800 border border-gray-700">
              <p className="text-xs text-gray-400">Done</p>
              <p className="text-sm font-semibold text-white">{opState.isDone ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
