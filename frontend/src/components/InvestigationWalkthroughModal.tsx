import React from 'react';
import {
  X,
  Compass,
  ArrowRight,
  Eye,
  Network,
  Lock,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

export const InvestigationWalkthroughModal: React.FC = () => {
  const { isWalkthroughOpen, closeWalkthrough, startGuidedInvestigation } = useInvestigation();

  if (!isWalkthroughOpen) return null;

  const pillars = [
    {
      num: '01',
      title: 'OBSERVE',
      tagline: 'Surveillance & Threat Stream',
      icon: <Eye size={18} color="#00D2FF" />,
      color: '#00D2FF',
      description:
        'Continuously monitors transaction telemetry to identify anomalous spikes, rapid pass-through transit velocities, and high-risk mule ring alerts.'
    },
    {
      num: '02',
      title: 'TRACE',
      tagline: 'Topology & Chronological BFS',
      icon: <Network size={18} color="#C6A45A" />,
      color: '#C6A45A',
      description:
        'Reconstructs multi-hop financial movements on interactive graph canvases with time-constrained monotonic Breadth-First Search (BFS).'
    },
    {
      num: '03',
      title: 'VERIFY',
      tagline: 'Cryptographic SHA-256 Lineage',
      icon: <Lock size={18} color="#10B981" />,
      color: '#10B981',
      description:
        'Verifies mathematical hash-chaining and post-recording immutability across parent-child simulated e-Rupee token transfers.'
    },
    {
      num: '04',
      title: 'DETECT',
      tagline: 'Multi-Engine Synthesis Dossier',
      icon: <Cpu size={18} color="#7596C8" />,
      color: '#7596C8',
      description:
        'Synthesizes sliding-window velocities, 11-D graph topology features, Isolation Forest anomaly trees, and inductive GraphSAGE GNN embeddings into an explainable 0–100 risk score.'
    },
    {
      num: '05',
      title: 'RESPOND',
      tagline: 'Incident Triage & simulated review',
      icon: <ShieldAlert size={18} color="#E05252" />,
      color: '#E05252',
      description:
        'Initiates incident response cases, records investigation audit notes, and flags accounts for simulated pre-conversion review before terminal cash-out.'
    },
    {
      num: '06',
      title: 'PRESERVE EVIDENCE',
      tagline: 'Court-Ready Package & Chained Audit',
      icon: <ShieldCheck size={18} color="#A78BFA" />,
      color: '#A78BFA',
      description:
        'Exports tamper-evident JSON evidence packages with SHA-256 digital seals and records every analyst mutation in an immutable append-only audit ledger.'
    }
  ];

  const handleStartHeroInvestigation = () => {
    startGuidedInvestigation({
      alertId: 'ALT_ACC_HERO_MULE_L2_CONVERGE',
      accountId: 'ACC_HERO_MULE_L2_CONVERGE',
      txId: 'TX_HERO_005',
      tokenId: 'TOKR_HERO_500K_GENESIS'
    });
    closeWalkthrough();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(8, 10, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={closeWalkthrough}
    >
      <div
        style={{
          background: 'var(--bg-deep-charcoal)',
          border: '1px solid var(--accent-gold)',
          borderRadius: 'var(--radius-sm)',
          maxWidth: '960px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(198, 164, 90, 0.2)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(117, 150, 200, 0.16)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="tech-tag gold" style={{ fontSize: '10px' }}>
                <Compass size={11} />
                <span>MISSION BRIEFING</span>
              </span>
              <span className="font-mono text-muted" style={{ fontSize: '11px' }}>
                ANALYST WORKSTATION ARCHITECTURE
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              End-to-End Investigation Flow
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Mule Matrix unifies threat intelligence, topological graph analysis, cryptographic verification, and case management into a single connected workflow.
            </p>
          </div>

          <button
            onClick={closeWalkthrough}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Close Briefing"
          >
            <X size={20} />
          </button>
        </div>

        {/* 6 Pillars Grid */}
        <div
          style={{
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px'
          }}
        >
          {pillars.map((p) => (
            <div
              key={p.num}
              style={{
                background: 'rgba(21, 27, 39, 0.8)',
                border: '1px solid rgba(117, 150, 200, 0.16)',
                borderLeft: `3px solid ${p.color}`,
                borderRadius: 'var(--radius-xs)',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {p.icon}
                  </div>
                  <div>
                    <span className="font-mono" style={{ fontSize: '10px', color: p.color, fontWeight: 700 }}>
                      PILLAR {p.num} // {p.title}
                    </span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.tagline}
                    </div>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Distinction Banner: Live vs Synthetic Simulator */}
        <div
          style={{
            margin: '0 24px 20px 24px',
            padding: '12px 16px',
            background: 'rgba(198, 164, 90, 0.08)',
            border: '1px solid rgba(198, 164, 90, 0.25)',
            borderRadius: 'var(--radius-xs)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '11px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={16} color="var(--accent-gold)" />
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>Analyst Guidance:</strong> The 6-Stage Guided Flow represents active, real-data forensic investigations. The <em>Scenario Simulator</em> and <em>Investigation Replay</em> under Utilities are reserved for demonstration and synthetic pipeline stress-testing.
            </span>
          </div>
        </div>

        {/* Footer CTAs */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(117, 150, 200, 0.16)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Academic Prototype Disclaimer: All transactions & token movements are simulated for AML/CFT research.
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={closeWalkthrough} style={{ fontSize: '12px' }}>
              Dismiss
            </button>
            <button className="btn-primary" onClick={handleStartHeroInvestigation} style={{ fontSize: '12px' }}>
              <Play size={13} />
              <span>Launch Seeded Hero Investigation</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
