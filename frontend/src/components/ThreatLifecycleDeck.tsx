import React from 'react';
import { Eye, Network, Cpu, ShieldAlert, Sliders, ChevronRight, CornerDownRight } from 'lucide-react';
import { useInvestigation, ThreatStage, ThreatModule } from '../context/InvestigationContext';

export const ThreatLifecycleDeck: React.FC = () => {
  const { activeStage, activeModule, navigateToModule } = useInvestigation();

  const stages: { stage: ThreatStage; step: string; label: string; icon: React.ReactNode; defaultModule: ThreatModule }[] = [
    { stage: 'OBSERVE', step: '01', label: 'OBSERVE', icon: <Eye size={13} />, defaultModule: 'sentinel' },
    { stage: 'TRACE', step: '02', label: 'TRACE', icon: <Network size={13} />, defaultModule: 'attack-graph' },
    { stage: 'DETECT', step: '03', label: 'DETECT', icon: <Cpu size={13} />, defaultModule: 'detection-lab' },
    { stage: 'RESPOND', step: '04', label: 'RESPOND', icon: <ShieldAlert size={13} />, defaultModule: 'incident-response' },
    { stage: 'TOOLS', step: 'SYS', label: 'UTILITIES', icon: <Sliders size={13} />, defaultModule: 'simulator' }
  ];

  const stageModules: Record<ThreatStage, { id: ThreatModule; label: string; tag?: string }[]> = {
    OBSERVE: [
      { id: 'sentinel', label: 'Sentinel Command', tag: 'SURVEILLANCE' },
      { id: 'threat-stream', label: 'Threat Stream', tag: 'LIVE FEED' }
    ],
    TRACE: [
      { id: 'attack-graph', label: 'Attack Graph', tag: 'TOPOLOGY' },
      { id: 'token-forensics', label: 'Token Forensics', tag: 'LINEAGE' }
    ],
    DETECT: [
      { id: 'detection-lab', label: 'Detection Lab', tag: 'MULTI-ENGINE' },
      { id: 'model-observatory', label: 'Model Observatory', tag: 'BENCHMARKS' }
    ],
    RESPOND: [
      { id: 'incident-response', label: 'Incident Response', tag: 'TRIAGE' },
      { id: 'evidence-vault', label: 'Evidence Vault', tag: 'CHAIN OF CUSTODY' },
      { id: 'audit-ledger', label: 'Audit Ledger', tag: 'IMMUTABLE' }
    ],
    TOOLS: [
      { id: 'simulator', label: 'Scenario Simulator', tag: 'SYNTHESIS' },
      { id: 'replay', label: 'Hero Replay', tag: '9-STAGE' },
      { id: 'health', label: 'System Health', tag: 'DIAGNOSTICS' }
    ]
  };

  return (
    <div className="lifecycle-nav-wrapper">
      {/* Connected 4-Stage Horizontal Threat Lifecycle Pipeline */}
      <nav className="command-deck" aria-label="Threat Lifecycle Navigation">
        <div className="stages-bar">
          {stages.map((s, idx) => (
            <div key={s.stage} className="stage-pipeline-item">
              <button
                className={`stage-tab ${activeStage === s.stage ? 'active' : ''}`}
                onClick={() => navigateToModule(s.stage, s.defaultModule)}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9px',
                    color: activeStage === s.stage ? 'var(--accent-gold)' : 'var(--text-muted)',
                    marginRight: '2px'
                  }}
                >
                  {s.step}
                </span>
                {s.icon}
                <span>{s.label}</span>
              </button>
              {idx < stages.length - 1 && (
                <div className="stage-chevron">
                  <ChevronRight size={13} />
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Connected Submodule Navigation Bar */}
      <div className="modules-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)', marginRight: '8px' }}>
          <CornerDownRight size={11} color="var(--steel-blue)" />
          <span style={{ color: 'var(--steel-blue)', fontWeight: 600 }}>{activeStage} DECK:</span>
        </div>
        {stageModules[activeStage]?.map((m) => (
          <button
            key={m.id}
            className={`module-btn ${activeModule === m.id ? 'active' : ''}`}
            onClick={() => navigateToModule(activeStage, m.id)}
          >
            <span>{m.label}</span>
            {m.tag && (
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  color: activeModule === m.id ? 'var(--accent-gold)' : 'var(--text-muted)',
                  background: activeModule === m.id ? 'rgba(198, 164, 90, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  padding: '1px 4px',
                  borderRadius: '2px'
                }}
              >
                {m.tag}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
