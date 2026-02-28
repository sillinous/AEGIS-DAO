import { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useToken } from '../hooks/useToken';
import { formatTokenAmount, shortenAddress, getExplorerUrl } from '../utils/format';
import TransactionStatus from '../components/common/TransactionStatus';

export default function Token() {
  const { account, network } = useWeb3();
  const token = useToken();

  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  const resetTx = () => { setTxStatus(null); setTxHash(null); setTxError(null); };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">AEGIS Token</h2>
        <p className="text-gray-400 mt-1">Manage your {token.symbol} tokens, delegation, and approvals</p>
      </div>

      {/* Token overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="stat-label">Token Name</p>
          <p className="text-lg font-semibold text-white">{token.name || 'AEGIS Token'}</p>
          <p className="text-xs text-gray-500 mt-1">{token.symbol}</p>
        </div>
        <div className="card">
          <p className="stat-label">Total Supply</p>
          <p className="stat-value">{formatTokenAmount(token.totalSupply)}</p>
          <p className="text-xs text-gray-500 mt-1">{token.decimals} decimals</p>
        </div>
        <div className="card border-aegis-500/10">
          <p className="stat-label">Your Balance</p>
          <p className="stat-value text-aegis-400">
            {account ? formatTokenAmount(token.balance) : '--'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{token.symbol}</p>
        </div>
        <div className="card border-aegis-500/10">
          <p className="stat-label">Your Voting Power</p>
          <p className="stat-value text-aegis-400">
            {account ? formatTokenAmount(token.votingPower) : '--'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {token.delegate === account
              ? 'Self-delegated'
              : token.delegate
                ? `Delegated to ${shortenAddress(token.delegate)}`
                : 'Not delegated'}
          </p>
        </div>
      </div>

      {!account ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">Connect your wallet to manage tokens</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transfer */}
          <TransferSection token={token} setTxStatus={setTxStatus} setTxHash={setTxHash} setTxError={setTxError} />

          {/* Delegate */}
          <DelegateSection token={token} account={account} setTxStatus={setTxStatus} setTxHash={setTxHash} setTxError={setTxError} />

          {/* Approve */}
          <ApproveSection token={token} setTxStatus={setTxStatus} setTxHash={setTxHash} setTxError={setTxError} />

          {/* Check Allowance */}
          <AllowanceSection token={token} account={account} />
        </div>
      )}

      <TransactionStatus status={txStatus} hash={txHash} error={txError} onClose={resetTx} />
    </div>
  );
}

function TransferSection({ token, setTxStatus, setTxHash, setTxError }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTxStatus('pending');
    try {
      const tx = await token.transfer(to, amount);
      setTxHash(tx.hash);
      setTxStatus('success');
      setTo('');
      setAmount('');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Transfer Tokens</h3>
      <p className="text-sm text-gray-400 mb-4">Send {token.symbol} tokens to another address.</p>
      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="label">Recipient Address</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            className="input-field font-mono text-sm"
            required
          />
        </div>
        <div>
          <label className="label">Amount</label>
          <div className="relative">
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input-field pr-20"
              required
            />
            <button
              type="button"
              onClick={() => setAmount(token.balance)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-aegis-400 hover:text-aegis-300 px-2 py-1"
            >
              MAX
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Balance: {formatTokenAmount(token.balance)} {token.symbol}</p>
        </div>
        <button type="submit" className="btn-primary w-full">Transfer</button>
      </form>
    </div>
  );
}

function DelegateSection({ token, account, setTxStatus, setTxHash, setTxError }) {
  const [delegatee, setDelegatee] = useState('');

  const handleDelegate = async (e) => {
    e.preventDefault();
    setTxStatus('pending');
    try {
      const tx = await token.delegateTo(delegatee);
      setTxHash(tx.hash);
      setTxStatus('success');
      setDelegatee('');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  const handleSelfDelegate = async () => {
    setTxStatus('pending');
    try {
      const tx = await token.delegateTo(account);
      setTxHash(tx.hash);
      setTxStatus('success');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Delegate Voting Power</h3>
      <p className="text-sm text-gray-400 mb-4">
        Delegate your voting power to yourself or another address. You must delegate to participate in governance.
      </p>

      {token.delegate && (
        <div className="mb-4 p-3 rounded-lg bg-gray-800 border border-gray-700">
          <p className="text-xs text-gray-400">Currently delegated to</p>
          <p className="text-sm font-mono text-gray-200 mt-0.5">
            {token.delegate === account ? 'Self (you)' : shortenAddress(token.delegate, 8)}
          </p>
        </div>
      )}

      {(!token.delegate || token.delegate !== account) && (
        <button onClick={handleSelfDelegate} className="btn-success w-full mb-4">
          Delegate to Self
        </button>
      )}

      <form onSubmit={handleDelegate} className="space-y-4">
        <div>
          <label className="label">Delegate to Address</label>
          <input
            type="text"
            value={delegatee}
            onChange={(e) => setDelegatee(e.target.value)}
            placeholder="0x... (or delegate to another member)"
            className="input-field font-mono text-sm"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">Delegate</button>
      </form>
    </div>
  );
}

function ApproveSection({ token, setTxStatus, setTxHash, setTxError }) {
  const [spender, setSpender] = useState('');
  const [amount, setAmount] = useState('');

  const handleApprove = async (e) => {
    e.preventDefault();
    setTxStatus('pending');
    try {
      const tx = await token.approve(spender, amount);
      setTxHash(tx.hash);
      setTxStatus('success');
      setSpender('');
      setAmount('');
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Approve Spender</h3>
      <p className="text-sm text-gray-400 mb-4">Allow a contract or address to spend your {token.symbol} tokens.</p>
      <form onSubmit={handleApprove} className="space-y-4">
        <div>
          <label className="label">Spender Address</label>
          <input
            type="text"
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            placeholder="0x..."
            className="input-field font-mono text-sm"
            required
          />
        </div>
        <div>
          <label className="label">Amount to Approve</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input-field"
            required
          />
        </div>
        <button type="submit" className="btn-primary w-full">Approve</button>
      </form>
    </div>
  );
}

function AllowanceSection({ token, account }) {
  const [owner, setOwner] = useState('');
  const [spender, setSpender] = useState('');
  const [allowance, setAllowance] = useState(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setChecking(true);
    try {
      const result = await token.getAllowance(owner || account, spender);
      setAllowance(result);
    } catch (err) {
      setAllowance('Error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-white mb-4">Check Allowance</h3>
      <p className="text-sm text-gray-400 mb-4">Check how many tokens a spender is allowed to use.</p>
      <form onSubmit={handleCheck} className="space-y-4">
        <div>
          <label className="label">Owner Address (default: yours)</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder={account ? shortenAddress(account, 8) : '0x...'}
            className="input-field font-mono text-sm"
          />
        </div>
        <div>
          <label className="label">Spender Address</label>
          <input
            type="text"
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            placeholder="0x..."
            className="input-field font-mono text-sm"
            required
          />
        </div>
        <button type="submit" disabled={checking} className="btn-secondary w-full">
          {checking ? 'Checking...' : 'Check Allowance'}
        </button>
        {allowance !== null && (
          <div className="p-3 rounded-lg bg-gray-800 border border-gray-700">
            <p className="text-xs text-gray-400">Allowance</p>
            <p className="text-lg font-semibold text-white">{formatTokenAmount(allowance)} {token.symbol}</p>
          </div>
        )}
      </form>
    </div>
  );
}
