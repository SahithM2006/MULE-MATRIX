import { ThreatStage, ThreatModule } from '../../context/InvestigationContext';

export interface TourStepConfig {
  stepNumber: number;
  stage: ThreatStage;
  module: ThreatModule;
  title: string;
  badge: string;
  targetSelector: string;
  fallbackSelector?: string;
  pageName: string;
  pageDescription: string;
  instruction: string;
  targetExplanation: string;
  rationale: string;
  nextStagePreview: string;
  requiresAction: boolean;
  actionLabel?: string;
  actionHint?: string;
  preferredPosition?: 'bottom' | 'top' | 'left' | 'right';
}

export const TOUR_STEPS: TourStepConfig[] = [
  // STEP 1 — OBSERVE: Sentinel Command
  {
    stepNumber: 1,
    stage: 'OBSERVE',
    module: 'sentinel',
    title: 'Observe Suspicious Activity',
    badge: 'OBSERVE // SENTINEL COMMAND',
    targetSelector: '[data-tour="sentinel-first-alert"]',
    fallbackSelector: '[data-tour="sentinel-alerts"]',
    pageName: 'Sentinel Command',
    pageDescription: 'Sentinel Command gives you an overview of suspicious activity, flagged transactions, and potential cash-out accounts across the network.',
    instruction: 'Start here. Sentinel Command gives you an overview of suspicious activity, flagged transactions, and potential cash-out accounts.',
    targetExplanation: 'Review the high-priority alert queue on the right. Each alert details the suspect account, composite risk score, and primary trigger reason.',
    rationale: 'An alert is an indicator for investigation, not proof that an account is guilty. It serves as the starting point for deep forensic analysis.',
    nextStagePreview: 'Next, we will open Scenario Simulator to generate a controlled synthetic transaction scenario.',
    requiresAction: false,
    actionLabel: 'Select Alert to Investigate',
    preferredPosition: 'left'
  },

  // STEP 2 — UTILITIES: Scenario Simulator
  {
    stepNumber: 2,
    stage: 'TOOLS',
    module: 'simulator',
    title: 'Generate Synthetic Scenario',
    badge: 'UTILITIES // SCENARIO SIMULATOR',
    targetSelector: '[data-tour="simulator-run-btn"]',
    fallbackSelector: '[data-tour="simulator-archetypes"]',
    pageName: 'Scenario Simulator',
    pageDescription: 'Scenario Simulator generates controlled, reproducible synthetic transaction topologies to safely stress-test detection rules and models.',
    instruction: 'Now generate a controlled synthetic transaction scenario. This allows you to see how suspicious financial activity enters the system and how the investigation tools respond.',
    targetExplanation: 'Select an available archetype (such as Smurfing, Rapid Pass-Through, or Connected Mule Ring) and click "Simulate Scenario" to start the simulation.',
    rationale: 'The user must explicitly start the simulation. Do not silently modify the database or generate scenarios merely because the tour started. Generated records are strictly labeled as synthetic.',
    nextStagePreview: 'Next, we will inspect the resulting alerts and transactions created by this simulation.',
    requiresAction: true,
    actionLabel: 'Simulate Scenario',
    actionHint: 'Click the "Simulate Scenario" button below to initiate generation on the backend.',
    preferredPosition: 'bottom'
  },

  // STEP 3 — OBSERVE: Inspect the resulting activity
  {
    stepNumber: 3,
    stage: 'OBSERVE',
    module: 'threat-stream',
    title: 'Inspect Resulting Activity',
    badge: 'OBSERVE // THREAT STREAM',
    targetSelector: '[data-tour="threat-stream-first-row"]',
    fallbackSelector: '[data-tour="threat-stream-table"]',
    pageName: 'Threat Stream & Telemetry Feed',
    pageDescription: 'Threat Stream displays transaction feeds with timestamp ordering, velocity indicators, and severity tags.',
    instruction: 'The scenario has generated transaction activity. Examine the resulting alerts and transactions to identify the account or transfer that needs investigation.',
    targetExplanation: 'Inspect this generated transaction record. Examine its account identifiers, transit amount, timestamp, and active detection signals.',
    rationale: 'Reviewing raw telemetry helps confirm where funds entered and which intermediate account serves as the pass-through aggregation hub.',
    nextStagePreview: 'Next, we will trace the topological flow of funds in the Attack Graph using Breadth-First Search.',
    requiresAction: false,
    actionLabel: 'Inspect Transaction',
    preferredPosition: 'bottom'
  },

  // STEP 4 — TRACE: Attack Graph
  {
    stepNumber: 4,
    stage: 'TRACE',
    module: 'attack-graph',
    title: 'Trace Topology & BFS Path',
    badge: 'TRACE // ATTACK GRAPH',
    targetSelector: '[data-tour="trace-bfs-btn"]',
    fallbackSelector: '[data-tour="graph-canvas"]',
    pageName: 'Attack Graph & Network Topology',
    pageDescription: 'Attack Graph reconstructs multi-hop financial movements on interactive canvases using time-constrained Breadth-First Search (BFS).',
    instruction: 'Now follow the movement of funds through connected accounts. The graph shows transaction relationships and helps reconstruct possible money-flow paths.',
    targetExplanation: 'Click "Trace Monotonic BFS" to launch an algorithmic path search starting from the focused account.',
    rationale: 'In plain English: BFS searches for valid money-flow paths that respect transaction timestamp ordering (funds must be received before they can be disbursed) and stay within the hop limit.',
    nextStagePreview: 'Next, we will inspect the token\'s recorded lineage and verify cryptographic integrity.',
    requiresAction: true,
    actionLabel: 'Trace Monotonic BFS',
    actionHint: 'Click "Trace Monotonic BFS" to illuminate chronological transaction paths on the canvas.',
    preferredPosition: 'bottom'
  },

  // STEP 5 — TRACE: Token Forensics
  {
    stepNumber: 5,
    stage: 'TRACE',
    module: 'token-forensics',
    title: 'Verify Token Lineage Integrity',
    badge: 'TRACE // TOKEN FORENSICS',
    targetSelector: '[data-tour="verify-chain-btn"]',
    fallbackSelector: '[data-tour="token-history"]',
    pageName: 'Token Forensics & Lineage',
    pageDescription: 'Token Forensics tracks digital token splits, parent-child parentage, and immutable SHA-256 hash chaining.',
    instruction: 'Next, inspect the token\'s recorded lineage and verify the integrity of its transaction history.',
    targetExplanation: 'Review the chronological parent-child token blocks, and click "Verify Cryptographic Chain" to validate mathematical hash integrity.',
    rationale: 'Cryptographic integrity checks whether recorded links are mathematically consistent; it does not establish whether the transaction itself is legitimate.',
    nextStagePreview: 'Next, we will inspect the multi-engine evidence synthesis in Detection Lab.',
    requiresAction: true,
    actionLabel: 'Verify Cryptographic Chain',
    actionHint: 'Click "Verify Cryptographic Chain" to recalculate SHA-256 hashes across all recorded hops.',
    preferredPosition: 'bottom'
  },

  // STEP 6 — DETECT: Detection Lab
  {
    stepNumber: 6,
    stage: 'DETECT',
    module: 'detection-lab',
    title: 'Synthesize Multi-Engine Detection',
    badge: 'DETECT // DETECTION LAB',
    targetSelector: '[data-tour="detection-dossier"]',
    fallbackSelector: '[data-tour="algorithm-matrix"]',
    pageName: 'Detection Lab',
    pageDescription: 'Detection Lab synthesizes sliding-window velocities, 11-D graph features, Isolation Forest anomaly trees, and GraphSAGE neural predictions.',
    instruction: 'Now examine the evidence gathered by the detection engines. Review the risk score, triggered rules, temporal activity, graph features, anomaly analysis, community information, and GraphSAGE status where available.',
    targetExplanation: 'Inspect the composite risk score dial (0–100), forensic verdict, and contributing algorithm weight matrix.',
    rationale: 'Multiple independent signals support an investigation; no single score automatically proves criminal activity. Real returned values reflect actual backend engines.',
    nextStagePreview: 'Next, we will initiate an investigation case in Incident Response.',
    requiresAction: false,
    actionLabel: 'Review Dossier Evidence',
    preferredPosition: 'bottom'
  },

  // STEP 7 — RESPOND: Incident Response
  {
    stepNumber: 7,
    stage: 'RESPOND',
    module: 'incident-response',
    title: 'Create Investigation Case',
    badge: 'RESPOND // INCIDENT RESPONSE',
    targetSelector: '[data-tour="initiate-case-btn"]',
    fallbackSelector: '[data-tour="case-portfolio"]',
    pageName: 'Incident Response & Triage',
    pageDescription: 'Incident Response provides structured case tracking, note collation, investigator assignments, and simulated pre-conversion review.',
    instruction: 'If the findings warrant further review, create an investigation case and record the reasons, related accounts, transactions, and evidence.',
    targetExplanation: 'Click "Initiate New Case" (or review the active case) to record the investigative workflow with prefilled evidence.',
    rationale: 'The case records the investigative workflow and audit notes; it does not establish guilt or execute a real financial restriction.',
    nextStagePreview: 'Next, we will preserve the case evidence in Evidence Vault.',
    requiresAction: true,
    actionLabel: 'Initiate New Case',
    actionHint: 'Click "Initiate New Case" or confirm case creation to record the case on the backend.',
    preferredPosition: 'bottom'
  },

  // STEP 8 — RESPOND: Evidence Vault
  {
    stepNumber: 8,
    stage: 'RESPOND',
    module: 'evidence-vault',
    title: 'Preserve Sealed Case Evidence',
    badge: 'RESPOND // EVIDENCE VAULT',
    targetSelector: '[data-tour="evidence-export-btn"]',
    fallbackSelector: '[data-tour="evidence-catalog"]',
    pageName: 'Cryptographic Evidence Vault',
    pageDescription: 'Evidence Vault preserves tamper-evident investigation packages with canonical JSON serialization and digital forensic seals.',
    instruction: 'Preserve the evidence collected during this investigation. Review the case dossier and its associated transactions, token lineage, and integrity information.',
    targetExplanation: 'Locate your case or token artifact in the registry and click "Export" to generate a cryptographically sealed package.',
    rationale: 'Generating an export produces an RFC 8785 canonical JSON artifact with a SHA-256 digital seal. Confirm success only after backend confirmation.',
    nextStagePreview: 'Next, we will inspect the append-only audit trail in Audit Ledger.',
    requiresAction: true,
    actionLabel: 'Export Evidence Package',
    actionHint: 'Click "Export" on the case row to generate and view the sealed dossier package.',
    preferredPosition: 'bottom'
  },

  // STEP 9 — RESPOND: Audit Ledger
  {
    stepNumber: 9,
    stage: 'RESPOND',
    module: 'audit-ledger',
    title: 'Verify Tamper-Evident Audit Ledger',
    badge: 'RESPOND // AUDIT LEDGER',
    targetSelector: '[data-tour="audit-ledger-table"]',
    fallbackSelector: '[data-tour="hash-chain"]',
    pageName: 'Audit Ledger',
    pageDescription: 'The Audit Ledger maintains an immutable chronicle of analyst mutations, case creations, and evidence exports using chained hashes.',
    instruction: 'The audit ledger records relevant actions performed during the investigation. Check the corresponding events and verify the integrity of the recorded hash chain.',
    targetExplanation: 'Review the audit log entries for your case creation and export actions. Note how each event links to the previous block\'s SHA-256 hash.',
    rationale: 'The ledger records application actions; it provides cryptographic proof of the audit trail without claiming events exist unless recorded.',
    nextStagePreview: 'Finally, let\'s explore supporting utilities and complete the walkthrough.',
    requiresAction: false,
    actionLabel: 'Verify Chained Ledger',
    preferredPosition: 'bottom'
  },

  // STEP 10 — UTILITIES: Explore Additional Tools
  {
    stepNumber: 10,
    stage: 'TOOLS',
    module: 'replay',
    title: 'Explore Additional Utilities',
    badge: 'UTILITIES // SUPPORTING TOOLS',
    targetSelector: '[data-tour="replay-controls"]',
    fallbackSelector: '[data-tour="utilities-overview"]',
    pageName: 'Hero Scenario Replay & Utilities',
    pageDescription: 'Supporting tools provide chronological re-enactment, empirical benchmark evaluation, and system diagnostics.',
    instruction: 'Explore the remaining supporting tools:\n• Investigation Replay: watch the prepared synthetic scenario unfold chronologically.\n• Model Observatory: examine the results of the available benchmark evaluation.\n• System Health: inspect database, engine, and model availability.\nThese are supporting tools, not mandatory steps in every investigation.',
    targetExplanation: 'Step through the 9-stage progression in Investigation Replay or switch to Model Observatory to review benchmark F1 scores.',
    rationale: 'These diagnostic tools allow analysts to audit model accuracy and trace complex attack lifecycles in controlled environments.',
    nextStagePreview: 'Click "Finish Walkthrough" to complete the guided tour.',
    requiresAction: false,
    actionLabel: 'Complete Walkthrough',
    preferredPosition: 'bottom'
  }
];
