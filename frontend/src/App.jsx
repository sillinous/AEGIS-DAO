import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Governance from './pages/Governance';
import Token from './pages/Token';
import Treasury from './pages/Treasury';
import ProposalDetail from './pages/ProposalDetail';
import Members from './pages/Members';
import Activity from './pages/Activity';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/governance" element={<Governance />} />
              <Route path="/governance/proposal/:proposalId" element={<ProposalDetail />} />
              <Route path="/token" element={<Token />} />
              <Route path="/treasury" element={<Treasury />} />
              <Route path="/members" element={<Members />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
