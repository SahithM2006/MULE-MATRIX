import React from 'react';
import './App.css';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { InvestigationContextBar } from './components/InvestigationContextBar';
import { Footer } from './components/Footer';
import { LivingCyberBackground } from './components/background/LivingCyberBackground';

// Pages
import { SentinelCommand } from './pages/observe/SentinelCommand';
import { ThreatStream } from './pages/observe/ThreatStream';
import { AttackGraph } from './pages/trace/AttackGraph';
import { TokenForensics } from './pages/trace/TokenForensics';
import { DetectionLab } from './pages/detect/DetectionLab';
import { ModelObservatory } from './pages/detect/ModelObservatory';
import { IncidentResponse } from './pages/respond/IncidentResponse';
import { EvidenceVault } from './pages/respond/EvidenceVault';
import { AuditLedger } from './pages/respond/AuditLedger';
import { ScenarioSimulator } from './pages/tools/ScenarioSimulator';
import { InvestigationReplay } from './pages/tools/InvestigationReplay';
import { SystemHealth } from './pages/tools/SystemHealth';
import { PrivacyPolicy } from './pages/compliance/PrivacyPolicy';
import { TermsOfUse } from './pages/compliance/TermsOfUse';

const MainContent: React.FC = () => {
  const { activeModule } = useInvestigation();

  const renderModule = () => {
    switch (activeModule) {
      // 01. OBSERVE
      case 'sentinel':
        return <SentinelCommand />;
      case 'threat-stream':
        return <ThreatStream />;

      // 02. TRACE
      case 'attack-graph':
        return <AttackGraph />;
      case 'token-forensics':
        return <TokenForensics />;

      // 03. DETECT
      case 'detection-lab':
        return <DetectionLab />;
      case 'model-observatory':
        return <ModelObservatory />;

      // 04. RESPOND
      case 'incident-response':
        return <IncidentResponse />;
      case 'evidence-vault':
        return <EvidenceVault />;
      case 'audit-ledger':
        return <AuditLedger />;

      // UTILITIES & LAB
      case 'simulator':
        return <ScenarioSimulator />;
      case 'replay':
        return <InvestigationReplay />;
      case 'health':
        return <SystemHealth />;

      // COMPLIANCE
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfUse />;

      default:
        return <SentinelCommand />;
    }
  };

  return (
    <main className="main-content-area" role="main">
      <div key={activeModule} className="page-route-transition">
        {renderModule()}
      </div>
    </main>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="app-shell-root">
      <LivingCyberBackground />
      <Header />
      <div className="workstation-body-container">
        <Sidebar />
        <div className="workstation-workspace-area">
          <InvestigationContextBar />
          <MainContent />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <InvestigationProvider>
      <AppContent />
    </InvestigationProvider>
  );
};

export default App;
