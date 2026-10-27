import React from 'react';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext';
import { Header } from './components/Header';
import { ThreatLifecycleDeck } from './components/ThreatLifecycleDeck';
import { InvestigationProgressPanel } from './components/InvestigationProgressPanel';
import { InvestigationWalkthroughModal } from './components/InvestigationWalkthroughModal';
import { Footer } from './components/Footer';
import { WelcomeModal } from './components/tour/WelcomeModal';
import { GuidedTourOverlay } from './components/tour/GuidedTourOverlay';
import { TourCompletedModal } from './components/tour/TourCompletedModal';
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
      // 1. OBSERVE
      case 'sentinel':
        return <SentinelCommand />;
      case 'threat-stream':
        return <ThreatStream />;

      // 2. TRACE
      case 'attack-graph':
        return <AttackGraph />;
      case 'token-forensics':
        return <TokenForensics />;

      // 3. DETECT
      case 'detection-lab':
        return <DetectionLab />;
      case 'model-observatory':
        return <ModelObservatory />;

      // 4. RESPOND
      case 'incident-response':
        return <IncidentResponse />;
      case 'evidence-vault':
        return <EvidenceVault />;
      case 'audit-ledger':
        return <AuditLedger />;

      // 5. TOOLS / UTILITIES
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
  const {
    isWelcomeModalOpen,
    isTourActive,
    currentTourStep,
    tourStepStatus,
    tourError,
    isTourCompletedModalOpen,
    startGuidedTour,
    skipTour,
    exploreOnMyOwn,
    replayGuidedTour,
    nextTourStep,
    prevTourStep,
    exitTour,
    closeTourCompletedModal
  } = useInvestigation();

  return (
    <div className="app-layout">
      <LivingCyberBackground />
      <Header />
      <ThreatLifecycleDeck />
      <InvestigationProgressPanel />
      <MainContent />
      <Footer />
      <InvestigationWalkthroughModal />

      {/* Interactive Guided Product Tour Components */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onStartTour={startGuidedTour}
        onSkipTour={skipTour}
        onExploreOnMyOwn={exploreOnMyOwn}
      />
      <GuidedTourOverlay
        currentStep={currentTourStep}
        isTourActive={isTourActive}
        stepStatus={tourStepStatus}
        tourError={tourError}
        onNext={nextTourStep}
        onBack={prevTourStep}
        onSkipTour={skipTour}
        onExitTour={exitTour}
      />
      <TourCompletedModal
        isOpen={isTourCompletedModalOpen}
        onFinishTour={closeTourCompletedModal}
        onReplayTour={replayGuidedTour}
        onExploreApplication={closeTourCompletedModal}
      />
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
