import { useWeb3 } from "../context/Web3Context";
import { formatAddress } from "../utils";

export default function Header() {
  const { account, network, supported, connect, disconnect, error } = useWeb3();

  return (
    <header className="header">
      <div className="header-brand">
        <h1>AEGIS DAO</h1>
        <span className="header-subtitle">Autonomous Economic Generation & Integration System</span>
      </div>
      <div className="header-actions">
        {network && (
          <span className={`network-badge ${supported ? "" : "network-unsupported"}`}>
            {supported ? network.name : "Unsupported Network"}
          </span>
        )}
        {account ? (
          <button className="btn btn-outline" onClick={disconnect}>
            {formatAddress(account)}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={connect}>
            Connect Wallet
          </button>
        )}
      </div>
      {error && <div className="header-error">{error}</div>}
    </header>
  );
}
