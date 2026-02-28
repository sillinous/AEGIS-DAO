import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Interface, parseUnits, parseEther } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { useGovernor } from '../hooks/useGovernor';
import { useToken } from '../hooks/useToken';
import { TOKEN_ABI } from '../constants/abis';
import { PROPOSAL_STATES } from '../constants/config';
import { shortenAddress, formatTokenAmount } from '../utils/format';
import TransactionStatus from '../components/common/TransactionStatus';
import { ProposalCardSkeleton } from '../components/common/Skeleton';

const STATE_FILTERS = [
  { label: 'All', value: null },
  { label: 'Active', value: 1 },
  { label: 'Pending', value: 0 },
  { label: 'Succeeded', value: 4 },
  { label: 'Queued', value: 5 },
  { label: 'Executed', value: 7 },
  { label: 'Defeated', value: 3 },
];

export default function Governance() {
  const { account } = useWeb3();
  const governor = useGovernor();
  const token = useToken();

  const [stateFilter, setStateFilter] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  const resetTx = () => { setTxStatus(null); setTxHash(null); setTxError(null); };

  const filteredProposals = stateFilter !== null
    ? governor.proposals.filter((p) => p.state === stateFilter)
    : governor.proposals;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Governance</h2>
          <p className="text-gray-400 mt-1">{governor.proposals.length} proposals total</p>
        </div>
        {account && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary"
          >
            {showCreateForm ? 'Cancel' : 'New Proposal'}
          </button>
        )}
      </div>

      {/* Create proposal form */}
      {showCreateForm && (
        <CreateProposalForm
          governor={governor}
          token={token}
          setTxStatus={setTxStatus}
          setTxHash={setTxHash}
          setTxError={setTxError}
          onSuccess={() => setShowCreateForm(false)}
        />
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATE_FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => setStateFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
              stateFilter === f.value
                ? 'bg-aegis-600/20 text-aegis-400 border border-aegis-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
            }`}
          >
            {f.label}
            {f.value !== null && (
              <span className="ml-1.5 text-xs opacity-60">
                {governor.proposals.filter((p) => p.state === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Proposals list */}
      {governor.loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProposalCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="card text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
          </svg>
          <p className="text-gray-400 text-lg">No proposals found</p>
          <p className="text-gray-500 text-sm mt-1">
            {stateFilter !== null ? 'Try a different filter' : 'Be the first to create a proposal'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      <TransactionStatus status={txStatus} hash={txHash} error={txError} onClose={resetTx} />
    </div>
  );
}

function ProposalCard({ proposal }) {
  const stateInfo = PROPOSAL_STATES[proposal.state] || PROPOSAL_STATES[0];
  const lines = proposal.description.split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim() || 'Untitled Proposal';
  const body = lines.slice(1).join('\n').trim();

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPct = totalVotes > 0n ? Number((proposal.forVotes * 10000n) / totalVotes) / 100 : 0;
  const againstPct = totalVotes > 0n ? Number((proposal.againstVotes * 10000n) / totalVotes) / 100 : 0;
  const abstainPct = totalVotes > 0n ? Number((proposal.abstainVotes * 10000n) / totalVotes) / 100 : 0;

  return (
    <Link to={`/governance/proposal/${proposal.id}`} className="card-hover block">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${stateInfo.bg} ${stateInfo.color} ${stateInfo.border}`}>
              {stateInfo.label}
            </span>
            {proposal.hasVoted && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                Voted
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white text-lg">{title}</h3>
          {body && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{body}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Proposed by {shortenAddress(proposal.proposer)} &middot; {proposal.targets.length} action{proposal.targets.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Vote bar */}
      {totalVotes > 0n && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span className="text-green-400">For {forPct.toFixed(1)}%</span>
            <span className="text-red-400">Against {againstPct.toFixed(1)}%</span>
            <span className="text-gray-400">Abstain {abstainPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden flex">
            <div className="bg-green-500 h-full" style={{ width: `${forPct}%` }} />
            <div className="bg-red-500 h-full" style={{ width: `${againstPct}%` }} />
            <div className="bg-gray-500 h-full" style={{ width: `${abstainPct}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}

function CreateProposalForm({ governor, token, setTxStatus, setTxHash, setTxError, onSuccess }) {
  const { network } = useWeb3();
  const [description, setDescription] = useState('');
  const [proposalType, setProposalType] = useState('transfer');

  // Transfer token fields
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // ETH send fields
  const [ethRecipient, setEthRecipient] = useState('');
  const [ethAmount, setEthAmount] = useState('');

  // Custom action fields
  const [customTarget, setCustomTarget] = useState('');
  const [customValue, setCustomValue] = useState('0');
  const [customCalldata, setCustomCalldata] = useState('0x');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTxStatus('pending');

    try {
      let targets, values, calldatas;

      if (proposalType === 'transfer') {
        const tokenAddress = network?.contracts?.token;
        if (!tokenAddress) throw new Error('Token contract address not configured');
        const iface = new Interface(TOKEN_ABI);
        const calldata = iface.encodeFunctionData('transfer', [
          recipient,
          parseUnits(amount, token.decimals),
        ]);
        targets = [tokenAddress];
        values = [0n];
        calldatas = [calldata];
      } else if (proposalType === 'eth') {
        targets = [ethRecipient];
        values = [parseEther(ethAmount)];
        calldatas = ['0x'];
      } else {
        targets = [customTarget];
        values = [BigInt(customValue)];
        calldatas = [customCalldata];
      }

      const { tx } = await governor.propose(targets, values, calldatas, description);
      setTxHash(tx.hash);
      setTxStatus('success');
      onSuccess();
    } catch (err) {
      setTxError(err.reason || err.message);
      setTxStatus('error');
    }
  };

  return (
    <div className="card border-aegis-500/20 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-4">Create Proposal</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Proposal Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="# Proposal Title&#10;&#10;Describe what this proposal does and why..."
            className="input-field min-h-[120px] resize-y"
            required
          />
          <p className="text-xs text-gray-500 mt-1">First line becomes the title. Supports markdown.</p>
        </div>

        <div>
          <label className="label">Action Type</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'transfer', label: 'Token Transfer' },
              { key: 'eth', label: `Send ${network?.currency?.symbol || 'ETH'}` },
              { key: 'custom', label: 'Custom Action' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setProposalType(t.key)}
                className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm border transition-all ${
                  proposalType === t.key
                    ? 'bg-aegis-600/15 border-aegis-500/30 text-aegis-400'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {proposalType === 'transfer' && (
          <>
            <div>
              <label className="label">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="input-field font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="label">Amount ({token.symbol})</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="input-field"
                required
              />
            </div>
          </>
        )}

        {proposalType === 'eth' && (
          <>
            <div>
              <label className="label">Recipient Address</label>
              <input
                type="text"
                value={ethRecipient}
                onChange={(e) => setEthRecipient(e.target.value)}
                placeholder="0x..."
                className="input-field font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="label">Amount ({network?.currency?.symbol || 'ETH'})</label>
              <input
                type="text"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                placeholder="0.0"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Sends {network?.currency?.symbol || 'ETH'} from the treasury to the recipient.
              </p>
            </div>
          </>
        )}

        {proposalType === 'custom' && (
          <>
            <div>
              <label className="label">Target Contract Address</label>
              <input
                type="text"
                value={customTarget}
                onChange={(e) => setCustomTarget(e.target.value)}
                placeholder="0x..."
                className="input-field font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="label">Value (wei)</label>
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="0"
                className="input-field font-mono text-sm"
              />
            </div>
            <div>
              <label className="label">Calldata (hex)</label>
              <input
                type="text"
                value={customCalldata}
                onChange={(e) => setCustomCalldata(e.target.value)}
                placeholder="0x..."
                className="input-field font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">ABI-encoded function call data</p>
            </div>
          </>
        )}

        <button type="submit" className="btn-primary w-full">
          Submit Proposal
        </button>
      </form>
    </div>
  );
}
