import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { CONTRACTS } from "../config";

export default function CreateProposal({ onCreated }) {
  const { account, contracts, network } = useWeb3();
  const [type, setType] = useState("native");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currency = network?.currency || "ETH";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!ethers.isAddress(recipient)) {
      setError("Invalid recipient address");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setSubmitting(true);
    try {
      let targets, values, calldatas;

      if (type === "native") {
        // Transfer native currency from treasury
        targets = [recipient];
        values = [ethers.parseEther(amount)];
        calldatas = ["0x"];
      } else {
        // Transfer AEGIS tokens from treasury
        const iface = new ethers.Interface([
          "function transfer(address to, uint256 amount) returns (bool)",
        ]);
        targets = [CONTRACTS.token];
        values = [0n];
        calldatas = [iface.encodeFunctionData("transfer", [recipient, ethers.parseEther(amount)])];
      }

      const tx = await contracts.governor.propose(
        targets,
        values,
        calldatas,
        description
      );
      await tx.wait();

      // Reset form
      setRecipient("");
      setAmount("");
      setDescription("");
      if (onCreated) onCreated();
    } catch (err) {
      console.error("Proposal creation failed:", err);
      setError(err?.info?.error?.message || err.reason || "Transaction failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!account) {
    return (
      <div className="empty-state">
        <p>Connect your wallet to create proposals.</p>
      </div>
    );
  }

  return (
    <div className="create-proposal">
      <h2>Create Proposal</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Transfer Type</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${type === "native" ? "active" : ""}`}
              onClick={() => setType("native")}
            >
              {currency}
            </button>
            <button
              type="button"
              className={`toggle-btn ${type === "token" ? "active" : ""}`}
              onClick={() => setType("token")}
            >
              AEGIS
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="recipient">Recipient Address</label>
          <input
            id="recipient"
            type="text"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">
            Amount ({type === "native" ? currency : "AEGIS"})
          </label>
          <input
            id="amount"
            type="number"
            step="any"
            min="0"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Proposal Description</label>
          <textarea
            id="description"
            rows="3"
            placeholder="Describe the purpose of this proposal..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Create Proposal"}
        </button>
      </form>
    </div>
  );
}
