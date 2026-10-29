import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TOUR_STEPS, TourStepConfig } from '../components/tour/tourConfig';

export type ThreatStage = 'OBSERVE' | 'TRACE' | 'DETECT' | 'RESPOND' | 'TOOLS';

export type ThreatModule =
  | 'sentinel'
  | 'threat-stream'
  | 'attack-graph'
  | 'token-forensics'
  | 'detection-lab'
  | 'model-observatory'
  | 'incident-response'
  | 'evidence-vault'
  | 'audit-ledger'
  | 'simulator'
  | 'replay'
  | 'health'
  | 'privacy'
  | 'terms';

export interface InvestigationMilestones {
  alertSelected: boolean;        // Stage 1: Observed alert or tx
  bfsTraced: boolean;            // Stage 2: BFS executed and path analyzed
  lineageVerified: boolean;      // Stage 3: SHA-256 chain verified
  dossierInspected: boolean;     // Stage 4: Multi-engine dossier reviewed
  caseCreated: boolean;          // Stage 5: Incident case initiated
  evidenceExported: boolean;     // Stage 6: Sealed dossier exported & audited
}

export interface InvestigationEvidence {
  alertReason?: string;
  riskScore?: number;
  bfsPathCount?: number;
  lineageValid?: boolean;
  caseNumber?: string;
  exportSealHash?: string;
}

export interface GuidedStageConfig {
  stageNumber: number;
  id: string;
  title: string;
  actionName: string;
  description: string;
  threatStage: ThreatStage;
  defaultModule: ThreatModule;
  milestoneKey: keyof InvestigationMilestones;
}

export const GUIDED_STAGES: GuidedStageConfig[] = [
  {
    stageNumber: 1,
    id: 'OBSERVE',
    title: 'Observe & Triage',
    actionName: 'Select Suspicious Alert or Transaction',
    description: 'Surveillance radar and live feed triaging high-risk mule ring anomalies.',
    threatStage: 'OBSERVE',
    defaultModule: 'sentinel',
    milestoneKey: 'alertSelected'
  },
  {
    stageNumber: 2,
    id: 'TRACE',
    title: 'Trace Topology & BFS',
    actionName: 'Traverse Account Network & Chronological Path',
    description: 'Reconstruct monotonic money dispersal paths across the transaction graph.',
    threatStage: 'TRACE',
    defaultModule: 'attack-graph',
    milestoneKey: 'bfsTraced'
  },
  {
    stageNumber: 3,
    id: 'VERIFY',
    title: 'Verify Lineage Integrity',
    actionName: 'Verify Cryptographic SHA-256 Token Chain',
    description: 'Establish post-recording immutability across parent-child e-Rupee token splits.',
    threatStage: 'TRACE',
    defaultModule: 'token-forensics',
    milestoneKey: 'lineageVerified'
  },
  {
    stageNumber: 4,
    id: 'DETECT',
    title: 'Detect & Synthesize Evidence',
    actionName: 'Inspect Account Detection Dossier',
    description: 'Synthesize 11-D graph topology, Isolation Forest trees, and GraphSAGE embeddings.',
    threatStage: 'DETECT',
    defaultModule: 'detection-lab',
    milestoneKey: 'dossierInspected'
  },
  {
    stageNumber: 5,
    id: 'RESPOND',
    title: 'Respond & Open Case',
    actionName: 'Create Incident Case & simulated review',
    description: 'Initiate formal triage, record investigation notes, and apply simulated review.',
    threatStage: 'RESPOND',
    defaultModule: 'incident-response',
    milestoneKey: 'caseCreated'
  },
  {
    stageNumber: 6,
    id: 'PRESERVE',
    title: 'Preserve & Audit Evidence',
    actionName: 'Export Sealed Dossier & Review Audit Log',
    description: 'Generate SHA-256 sealed court-ready export package and verify append-only ledger.',
    threatStage: 'RESPOND',
    defaultModule: 'evidence-vault',
    milestoneKey: 'evidenceExported'
  }
];

const LOCAL_STORAGE_KEY = 'mule_matrix_investigation_state';
const TOUR_SEEN_KEY = 'mule_matrix_tour_seen';
const TOUR_PREFERENCE_KEY = 'mule_matrix_tour_preference';

export type TourStepStatus = 'idle' | 'waiting_action' | 'action_in_progress' | 'action_completed' | 'error';

interface InvestigationContextType {
  activeStage: ThreatStage;
  activeModule: ThreatModule;
  selectedAlertId: string | null;
  selectedAccountId: string | null;
  selectedTxId: string | null;
  selectedTokenId: string | null;
  selectedCaseId: string | null;
  selectedScenarioId: string | null;
  scenarioSeed: number | null;
  isGuidedMode: boolean;
  guidedStageIndex: number; // 1 to 6
  milestones: InvestigationMilestones;
  evidence: InvestigationEvidence;
  isWalkthroughOpen: boolean;

  // New Guided Product Tour State
  isWelcomeModalOpen: boolean;
  isTourActive: boolean;
  currentTourStep: number; // 1 to 10
  tourStepStatus: TourStepStatus;
  tourError: string | null;
  isTourCompletedModalOpen: boolean;
  tourGeneratedData: { accountId?: string; txId?: string; alertId?: string; scenarioType?: string } | null;

  setActiveStage: (stage: ThreatStage) => void;
  setActiveModule: (module: ThreatModule) => void;
  setSelectedAlertId: (id: string | null) => void;
  setSelectedAccountId: (id: string | null) => void;
  setSelectedTxId: (id: string | null) => void;
  setSelectedTokenId: (id: string | null) => void;
  setSelectedCaseId: (id: string | null) => void;
  setSelectedScenarioId: (id: string | null) => void;
  setScenarioSeed: (seed: number | null) => void;
  navigateToModule: (stage: ThreatStage, module: ThreatModule) => void;
  investigateAccount: (accountId: string) => void;
  traceAccountInGraph: (accountId: string, txId?: string | null) => void;
  setInvestigationTarget: (params: {
    accountId: string;
    txId?: string | null;
    tokenId?: string | null;
    alertId?: string | null;
    scenarioId?: string | null;
  }) => void;
  traceToken: (tokenId: string) => void;
  openCase: (caseId: string) => void;

  // Guided Investigation Workflow actions
  startGuidedInvestigation: (seedParams?: {
    alertId?: string;
    accountId?: string;
    txId?: string;
    tokenId?: string;
  }) => void;
  goToGuidedStage: (stageNumber: number) => void;
  advanceToNextGuidedStage: () => void;
  setMilestoneCompleted: (key: keyof InvestigationMilestones, evidenceUpdates?: Partial<InvestigationEvidence>) => void;
  resetInvestigationSession: () => void;
  toggleGuidedMode: () => void;
  openWalkthrough: () => void;
  closeWalkthrough: () => void;

  // New Guided Product Tour Actions
  openWelcomeModal: () => void;
  closeWelcomeModal: () => void;
  startGuidedTour: () => void;
  skipTour: () => void;
  exploreOnMyOwn: () => void;
  replayGuidedTour: () => void;
  goToTourStep: (step: number) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  exitTour: () => void;
  completeTour: () => void;
  closeTourCompletedModal: () => void;
  setTourStepStatus: (status: TourStepStatus, error?: string | null) => void;
  recordTourGeneratedData: (data: { accountId?: string; txId?: string; alertId?: string; scenarioType?: string }) => void;
}

const defaultMilestones: InvestigationMilestones = {
  alertSelected: false,
  bfsTraced: false,
  lineageVerified: false,
  dossierInspected: false,
  caseCreated: false,
  evidenceExported: false
};

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load persisted state if available
  const [activeStage, setActiveStage] = useState<ThreatStage>('OBSERVE');
  const [activeModule, setActiveModule] = useState<ThreatModule>('sentinel');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>('ACC_HERO_MULE_L2_CONVERGE');
  const [selectedTxId, setSelectedTxId] = useState<string | null>('TX_HERO_005');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>('TOKR_HERO_500K_GENESIS');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [scenarioSeed, setScenarioSeed] = useState<number | null>(null);

  // Guided workflow stepper mode (collapsed by default to eliminate clutter)
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(false);
  const [guidedStageIndex, setGuidedStageIndex] = useState<number>(1);
  const [milestones, setMilestones] = useState<InvestigationMilestones>(defaultMilestones);
  const [evidence, setEvidence] = useState<InvestigationEvidence>({});
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState<boolean>(false);

  // Tour disabled per product requirement: no forced modal, no tour coach marks
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(false);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [currentTourStep, setCurrentTourStep] = useState<number>(1);
  const [tourStepStatus, setTourStepStatusState] = useState<TourStepStatus>('idle');
  const [tourError, setTourError] = useState<string | null>(null);
  const [isTourCompletedModalOpen, setIsTourCompletedModalOpen] = useState<boolean>(false);
  const [tourGeneratedData, setTourGeneratedData] = useState<{
    accountId?: string;
    txId?: string;
    alertId?: string;
    scenarioType?: string;
  } | null>(null);

  // Initialize from localStorage on mount (no tour popups)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedAccountId) setSelectedAccountId(parsed.selectedAccountId);
        if (parsed.selectedTxId) setSelectedTxId(parsed.selectedTxId);
        if (parsed.selectedTokenId !== undefined) setSelectedTokenId(parsed.selectedTokenId);
        if (parsed.selectedCaseId) setSelectedCaseId(parsed.selectedCaseId);
        if (parsed.selectedAlertId) setSelectedAlertId(parsed.selectedAlertId);
        if (parsed.selectedScenarioId) setSelectedScenarioId(parsed.selectedScenarioId);
        if (parsed.scenarioSeed) setScenarioSeed(parsed.scenarioSeed);
        if (typeof parsed.guidedStageIndex === 'number') setGuidedStageIndex(parsed.guidedStageIndex);
        if (typeof parsed.isGuidedMode === 'boolean') setIsGuidedMode(parsed.isGuidedMode);
        if (parsed.milestones) setMilestones(parsed.milestones);
        if (parsed.evidence) setEvidence(parsed.evidence);
        if (parsed.activeStage) setActiveStage(parsed.activeStage);
        if (parsed.activeModule) setActiveModule(parsed.activeModule);
      }
    } catch {
      // Fallback to initial defaults
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    try {
      const stateToPersist = {
        selectedAccountId,
        selectedTxId,
        selectedTokenId,
        selectedCaseId,
        selectedAlertId,
        selectedScenarioId,
        scenarioSeed,
        guidedStageIndex,
        isGuidedMode,
        milestones,
        evidence,
        activeStage,
        activeModule
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch {
      // Storage unavailable
    }
  }, [
    selectedAccountId,
    selectedTxId,
    selectedTokenId,
    selectedCaseId,
    selectedAlertId,
    selectedScenarioId,
    scenarioSeed,
    guidedStageIndex,
    isGuidedMode,
    milestones,
    evidence,
    activeStage,
    activeModule
  ]);

  const navigateToModule = (stage: ThreatStage, module: ThreatModule) => {
    setActiveStage(stage);
    setActiveModule(module);
  };

  const investigateAccount = (accountId: string) => {
    setSelectedAccountId(accountId);
    if (!accountId.includes('HERO') && selectedTokenId && selectedTokenId.includes('HERO')) {
      setSelectedTokenId(null);
    }
    setActiveStage('DETECT');
    setActiveModule('detection-lab');
    if (isGuidedMode && guidedStageIndex < 4) {
      setGuidedStageIndex(4);
    }
  };

  const traceAccountInGraph = (accountId: string, txId?: string | null) => {
    setSelectedAccountId(accountId);
    if (txId) setSelectedTxId(txId);
    if (!accountId.includes('HERO') && selectedTokenId && selectedTokenId.includes('HERO')) {
      setSelectedTokenId(null);
    }
    setActiveStage('TRACE');
    setActiveModule('attack-graph');
    if (isGuidedMode && guidedStageIndex < 2) {
      setGuidedStageIndex(2);
    }
  };

  const setInvestigationTarget = (params: {
    accountId: string;
    txId?: string | null;
    tokenId?: string | null;
    alertId?: string | null;
    scenarioId?: string | null;
  }) => {
    setSelectedAccountId(params.accountId);
    if (params.txId !== undefined) setSelectedTxId(params.txId);
    if (params.tokenId !== undefined) setSelectedTokenId(params.tokenId);
    if (params.alertId !== undefined) setSelectedAlertId(params.alertId);
    if (params.scenarioId !== undefined) setSelectedScenarioId(params.scenarioId);
  };

  const traceToken = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setActiveStage('TRACE');
    setActiveModule('token-forensics');
    if (isGuidedMode && guidedStageIndex < 3) {
      setGuidedStageIndex(3);
    }
  };

  const openCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveStage('RESPOND');
    setActiveModule('incident-response');
    if (isGuidedMode && guidedStageIndex < 5) {
      setGuidedStageIndex(5);
    }
  };

  const startGuidedInvestigation = (seedParams?: {
    alertId?: string;
    accountId?: string;
    txId?: string;
    tokenId?: string;
  }) => {
    setIsGuidedMode(true);
    setGuidedStageIndex(1);

    const alertId = seedParams?.alertId || 'ALT_ACC_HERO_MULE_L2_CONVERGE';
    const accId = seedParams?.accountId || 'ACC_HERO_MULE_L2_CONVERGE';
    const txId = seedParams?.txId || 'TX_HERO_005';
    const tokId = seedParams?.tokenId || 'TOKR_HERO_500K_GENESIS';

    setSelectedAlertId(alertId);
    setSelectedAccountId(accId);
    setSelectedTxId(txId);
    setSelectedTokenId(tokId);

    setMilestones((prev) => ({
      ...prev,
      alertSelected: true
    }));

    setEvidence((prev) => ({
      ...prev,
      alertReason: 'Coordinated Fan-In Smurfing to Pass-Through Hub'
    }));

    setActiveStage('OBSERVE');
    setActiveModule('sentinel');
  };

  const goToGuidedStage = (stageNumber: number) => {
    const stageCfg = GUIDED_STAGES.find((s) => s.stageNumber === stageNumber);
    if (!stageCfg) return;
    setGuidedStageIndex(stageNumber);
    setActiveStage(stageCfg.threatStage);
    setActiveModule(stageCfg.defaultModule);
  };

  const advanceToNextGuidedStage = () => {
    const nextIdx = Math.min(guidedStageIndex + 1, 6);
    goToGuidedStage(nextIdx);
  };

  const setMilestoneCompleted = (
    key: keyof InvestigationMilestones,
    evidenceUpdates?: Partial<InvestigationEvidence>
  ) => {
    setMilestones((prev) => ({ ...prev, [key]: true }));
    if (evidenceUpdates) {
      setEvidence((prev) => ({ ...prev, ...evidenceUpdates }));
    }
  };

  const resetInvestigationSession = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setSelectedAlertId('ALT_ACC_HERO_MULE_L2_CONVERGE');
    setSelectedAccountId('ACC_HERO_MULE_L2_CONVERGE');
    setSelectedTxId('TX_HERO_005');
    setSelectedTokenId('TOKR_HERO_500K_GENESIS');
    setSelectedCaseId(null);
    setGuidedStageIndex(1);
    setMilestones(defaultMilestones);
    setEvidence({});
    setActiveStage('OBSERVE');
    setActiveModule('sentinel');
  };

  const toggleGuidedMode = () => {
    setIsGuidedMode((prev) => !prev);
  };

  const openWalkthrough = () => setIsWalkthroughOpen(true);
  const closeWalkthrough = () => setIsWalkthroughOpen(false);

  // New Guided Product Tour Functions
  const openWelcomeModal = () => setIsWelcomeModalOpen(true);
  const closeWelcomeModal = () => setIsWelcomeModalOpen(false);

  const startGuidedTour = () => {
    try {
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
      localStorage.setItem(TOUR_PREFERENCE_KEY, 'tour');
    } catch {
      // ignore
    }
    setIsWelcomeModalOpen(false);
    setIsTourCompletedModalOpen(false);
    setIsTourActive(true);
    setCurrentTourStep(1);
    setTourStepStatusState('idle');
    setTourError(null);
    // Auto navigate to Step 1: Sentinel Command
    const step1 = TOUR_STEPS[0];
    setActiveStage(step1.stage);
    setActiveModule(step1.module);
  };

  const skipTour = () => {
    try {
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
      localStorage.setItem(TOUR_PREFERENCE_KEY, 'skipped');
    } catch {
      // ignore
    }
    setIsWelcomeModalOpen(false);
    setIsTourActive(false);
  };

  const exploreOnMyOwn = () => {
    try {
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
      localStorage.setItem(TOUR_PREFERENCE_KEY, 'explored');
    } catch {
      // ignore
    }
    setIsWelcomeModalOpen(false);
    setIsTourActive(false);
  };

  const replayGuidedTour = () => {
    setIsTourCompletedModalOpen(false);
    setIsTourActive(true);
    setCurrentTourStep(1);
    setTourStepStatusState('idle');
    setTourError(null);
    const step1 = TOUR_STEPS[0];
    setActiveStage(step1.stage);
    setActiveModule(step1.module);
  };

  const goToTourStep = (stepNumber: number) => {
    const stepCfg = TOUR_STEPS.find((s) => s.stepNumber === stepNumber);
    if (!stepCfg) return;
    setCurrentTourStep(stepNumber);
    setTourStepStatusState('idle');
    setTourError(null);
    setActiveStage(stepCfg.stage);
    setActiveModule(stepCfg.module);
  };

  const nextTourStep = () => {
    if (currentTourStep >= 10) {
      completeTour();
      return;
    }
    const nextStepNum = currentTourStep + 1;
    const nextCfg = TOUR_STEPS[nextStepNum - 1];
    if (nextCfg) {
      setCurrentTourStep(nextStepNum);
      setTourStepStatusState('idle');
      setTourError(null);
      setActiveStage(nextCfg.stage);
      setActiveModule(nextCfg.module);
    }
  };

  const prevTourStep = () => {
    if (currentTourStep <= 1) return;
    const prevStepNum = currentTourStep - 1;
    const prevCfg = TOUR_STEPS[prevStepNum - 1];
    if (prevCfg) {
      setCurrentTourStep(prevStepNum);
      setTourStepStatusState('idle');
      setTourError(null);
      setActiveStage(prevCfg.stage);
      setActiveModule(prevCfg.module);
    }
  };

  const exitTour = () => {
    setIsTourActive(false);
  };

  const completeTour = () => {
    setIsTourActive(false);
    setIsTourCompletedModalOpen(true);
    try {
      localStorage.setItem(TOUR_SEEN_KEY, 'true');
      localStorage.setItem(TOUR_PREFERENCE_KEY, 'completed');
    } catch {
      // ignore
    }
  };

  const closeTourCompletedModal = () => {
    setIsTourCompletedModalOpen(false);
  };

  const setTourStepStatus = (status: TourStepStatus, err?: string | null) => {
    setTourStepStatusState(status);
    if (err !== undefined) setTourError(err);
  };

  const recordTourGeneratedData = (data: { accountId?: string; txId?: string; alertId?: string; scenarioType?: string }) => {
    setTourGeneratedData(data);
    if (data.accountId) {
      setSelectedAccountId(data.accountId);
    }
    if (data.txId) {
      setSelectedTxId(data.txId);
    }
    if (data.alertId) {
      setSelectedAlertId(data.alertId);
    }
  };

  return (
    <InvestigationContext.Provider
      value={{
        activeStage,
        activeModule,
        selectedAlertId,
        selectedAccountId,
        selectedTxId,
        selectedTokenId,
        selectedCaseId,
        selectedScenarioId,
        scenarioSeed,
        isGuidedMode,
        guidedStageIndex,
        milestones,
        evidence,
        isWalkthroughOpen,
        isWelcomeModalOpen,
        isTourActive,
        currentTourStep,
        tourStepStatus,
        tourError,
        isTourCompletedModalOpen,
        tourGeneratedData,
        setActiveStage,
        setActiveModule,
        setSelectedAlertId,
        setSelectedAccountId,
        setSelectedTxId,
        setSelectedTokenId,
        setSelectedCaseId,
        setSelectedScenarioId,
        setScenarioSeed,
        navigateToModule,
        investigateAccount,
        traceAccountInGraph,
        setInvestigationTarget,
        traceToken,
        openCase,
        startGuidedInvestigation,
        goToGuidedStage,
        advanceToNextGuidedStage,
        setMilestoneCompleted,
        resetInvestigationSession,
        toggleGuidedMode,
        openWalkthrough,
        closeWalkthrough,
        openWelcomeModal,
        closeWelcomeModal,
        startGuidedTour,
        skipTour,
        exploreOnMyOwn,
        replayGuidedTour,
        goToTourStep,
        nextTourStep,
        prevTourStep,
        exitTour,
        completeTour,
        closeTourCompletedModal,
        setTourStepStatus,
        recordTourGeneratedData
      }}
    >
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = () => {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};
