import React from 'react';
import { ArrowRight, MapPin, Info, Zap } from 'lucide-react';
import { useInvestigation, ThreatModule } from '../context/InvestigationContext';

export interface GuidanceConfig {
  youAreHere: string;
  whyThisMatters: string;
  nextAction: string;
  nextModule?: ThreatModule;
  nextStage?: 'OBSERVE' | 'TRACE' | 'DETECT' | 'RESPOND' | 'TOOLS';
}

const PAGE_GUIDANCE: Partial<Record<ThreatModule, GuidanceConfig>> = {
  sentinel: {
    youAreHere: 'OBSERVE — Identify suspicious activity',
    whyThisMatters: 'This is where investigations begin. Alerts flag accounts exhibiting high-risk patterns. Select an alert or transaction to establish your investigation target.',
    nextAction: 'Select an alert or transaction, then trace it in Attack Graph',
    nextModule: 'attack-graph',
    nextStage: 'TRACE'
  },
  'threat-stream': {
    youAreHere: 'OBSERVE — Review live transaction feed',
    whyThisMatters: 'The threat stream surfaces high-risk transactions in real time. Use it to find the specific transaction you want to trace or investigate.',
    nextAction: 'Select a transaction and trace its account in Attack Graph',
    nextModule: 'attack-graph',
    nextStage: 'TRACE'
  },
  'attack-graph': {
    youAreHere: 'TRACE — Reconstruct fund movement',
    whyThisMatters: 'Trace the selected account\'s connected transactions to understand where funds came from and where they moved next. BFS reveals chronological money dispersal paths.',
    nextAction: 'Run BFS trace, then review detection evidence in Detection Lab',
    nextModule: 'detection-lab',
    nextStage: 'DETECT'
  },
  'token-forensics': {
    youAreHere: 'TRACE — Verify token lineage integrity',
    whyThisMatters: 'Where token lineage records exist, this page verifies the SHA-256 chain proving records were not altered after creation. If no lineage exists for the current account, that is noted explicitly.',
    nextAction: 'Review the verification result, then examine detection evidence',
    nextModule: 'detection-lab',
    nextStage: 'DETECT'
  },
  'detection-lab': {
    youAreHere: 'DETECT — Examine the evidence',
    whyThisMatters: 'This page shows why the selected account appears suspicious. Eight algorithmic engines contribute risk signals. Review which signals fired, which were normal, and what the overall risk assessment is.',
    nextAction: 'If findings warrant action, create an incident case',
    nextModule: 'incident-response',
    nextStage: 'RESPOND'
  },
  'model-observatory': {
    youAreHere: 'DETECT — Evaluate detection model performance',
    whyThisMatters: 'The Model Observatory assesses detection accuracy across test data. Use it to understand model reliability — it is a separate evaluation tool, not a required investigation step.',
    nextAction: 'Return to Detection Lab to review a specific account\'s evidence',
    nextModule: 'detection-lab',
    nextStage: 'DETECT'
  },
  'incident-response': {
    youAreHere: 'RESPOND — Record the investigation',
    whyThisMatters: 'Create a formal case record linking the suspect account, transaction, and supporting evidence. The case number persists across Evidence Vault and Audit Ledger.',
    nextAction: 'After creating the case, inspect and export the evidence dossier',
    nextModule: 'evidence-vault',
    nextStage: 'RESPOND'
  },
  'evidence-vault': {
    youAreHere: 'RESPOND — Inspect and export evidence',
    whyThisMatters: 'The Evidence Vault compiles the case dossier and verifies which evidence was available — including whether token lineage receipts were found and validated.',
    nextAction: 'Check the Audit Ledger for recorded case events and export records',
    nextModule: 'audit-ledger',
    nextStage: 'RESPOND'
  },
  'audit-ledger': {
    youAreHere: 'RESPOND — Review recorded audit events',
    whyThisMatters: 'The Audit Ledger is the append-only record of investigation actions, case creation, and evidence exports. It confirms what actually happened during this investigation.',
    nextAction: 'Investigation complete. Start a new investigation from Sentinel Command.',
    nextModule: 'sentinel',
    nextStage: 'OBSERVE'
  },
  simulator: {
    youAreHere: 'TOOLS — Generate a synthetic scenario',
    whyThisMatters: 'The Scenario Simulator creates controlled test data for demonstrating the investigation workflow. After generating a scenario, use the returned account and transaction IDs to begin a real investigation.',
    nextAction: 'Generate a scenario, then investigate it starting from Sentinel Command',
    nextModule: 'sentinel',
    nextStage: 'OBSERVE'
  }
};

interface ContextualGuidancePanelProps {
  /** Override the auto-detected current module */
  module?: ThreatModule;
  /** Additional context for the "Next Action" that is specific to the page state */
  dynamicNextAction?: string;
  /** Compact single-line mode for pages with tight space */
  compact?: boolean;
}

export const ContextualGuidancePanel: React.FC<ContextualGuidancePanelProps> = ({
  module: moduleProp,
  dynamicNextAction,
  compact = false
}) => {
  const { activeModule, navigateToModule, selectedAccountId } = useInvestigation();
  const module = moduleProp ?? activeModule;
  const cfg = PAGE_GUIDANCE[module];

  if (!cfg) return null;

  const nextAction = dynamicNextAction || cfg.nextAction;

  const handleNext = () => {
    if (cfg.nextStage && cfg.nextModule) {
      navigateToModule(cfg.nextStage, cfg.nextModule);
    }
  };

  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(117, 150, 200, 0.06)',
          border: '1px solid rgba(117, 150, 200, 0.18)',
          borderRadius: 'var(--radius-xs)',
          padding: '6px 10px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ color: 'var(--accent-gold)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          ◈ {cfg.youAreHere}
        </span>
        <span style={{ color: 'rgba(117, 150, 200, 0.4)' }}>|</span>
        <span style={{ color: 'var(--text-secondary)', flex: 1, minWidth: 0 }}>
          {cfg.whyThisMatters}
        </span>
        {cfg.nextModule && (
          <>
            <span style={{ color: 'rgba(117, 150, 200, 0.4)' }}>→</span>
            <button
              type="button"
              onClick={handleNext}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--steel-blue)',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                padding: 0,
                textDecoration: 'underline',
                whiteSpace: 'nowrap'
              }}
            >
              {nextAction.split(',')[0].split(' then ')[0]} →
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(8, 10, 15, 0.75)',
        border: '1px solid rgba(117, 150, 200, 0.2)',
        borderLeft: '3px solid var(--steel-blue)',
        borderRadius: 'var(--radius-xs)',
        padding: '10px 14px',
        marginBottom: '12px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)'
      }}
    >
      {/* YOU ARE HERE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <MapPin size={11} color="var(--accent-gold)" />
        <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em' }}>
          YOU ARE HERE
        </span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{cfg.youAreHere}</span>
        {selectedAccountId && (
          <span style={{ color: 'rgba(117, 150, 200, 0.5)', marginLeft: 'auto' }}>
            TARGET: <span style={{ color: 'var(--steel-blue)' }}>{selectedAccountId}</span>
          </span>
        )}
      </div>

      {/* WHY THIS MATTERS */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', marginBottom: '6px' }}>
        <Info size={11} color="var(--steel-blue)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <span style={{ color: 'var(--steel-blue)', fontWeight: 700 }}>WHY THIS MATTERS — </span>
          {cfg.whyThisMatters}
        </span>
      </div>

      {/* NEXT RECOMMENDED ACTION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Zap size={11} color="#10B981" style={{ flexShrink: 0 }} />
        <span style={{ color: '#10B981', fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em' }}>
          NEXT ACTION —
        </span>
        <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{nextAction}</span>
        {cfg.nextModule && (
          <button
            type="button"
            onClick={handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#10B981',
              borderRadius: 'var(--radius-xs)',
              padding: '3px 8px',
              cursor: 'pointer',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            Go <ArrowRight size={9} />
          </button>
        )}
      </div>
    </div>
  );
};

