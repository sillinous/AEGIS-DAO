import { useState } from "react";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import Proposals from "./components/Proposals";
import CreateProposal from "./components/CreateProposal";
import Delegate from "./components/Delegate";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "proposals", label: "Proposals" },
  { id: "create", label: "Create" },
  { id: "delegate", label: "Delegate" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="app">
      <Header />
      <nav className="tab-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="main">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "proposals" && <Proposals />}
        {activeTab === "create" && (
          <CreateProposal onCreated={() => setActiveTab("proposals")} />
        )}
        {activeTab === "delegate" && <Delegate />}
      </main>
    </div>
  );
}
