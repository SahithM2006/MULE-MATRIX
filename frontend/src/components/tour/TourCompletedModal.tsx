import React from 'react';
import { CheckCircle2, RotateCcw, ArrowRight, Compass, ShieldCheck, X } from 'lucide-react';

interface TourCompletedModalProps {
  isOpen: boolean;
  onFinishTour: () => void;
  onReplayTour: () => void;
  onExploreApplication: () => void;
}

export const TourCompletedModal: React.FC<TourCompletedModalProps> = ({
  isOpen,
  onFinishTour,
  onReplayTour,
  onExploreApplication
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="tour-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-completed-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 10, 15, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onFinishTour}
    >
      <div
        className="welcome-card"
        style={{
          backgroundColor: '#111722',
          border: '1px solid #10B981',
          borderRadius: '6px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(16, 185, 129, 0.22)',
          overflow: 'hidden',
          animation: 'tourFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.18) 0%, rgba(198, 164, 90, 0.12) 100%)',
            borderBottom: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={18} color="#10B981" />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#10B981',
                  display: 'block'
                }}
              >
                WALKTHROUGH COMPLETED
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: '#7596C8',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                10 OF 10 STAGES CONCLUDED
              </span>
            </div>
          </div>

          <button
            onClick={onFinishTour}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>
          <h2
            id="tour-completed-title"
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#E8EDF5',
              letterSpacing: '-0.01em',
              marginBottom: '10px'
            }}
          >
            You've completed the MULE MATRIX walkthrough.
          </h2>

          <p
            style={{
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: '#9BA8BA',
              marginBottom: '20px'
            }}
          >
            You have learned the basic path from observing suspicious activity to tracing transactions, reviewing detection evidence, managing a case, and preserving the audit trail.
          </p>

          {/* Core Pipeline Reconstructed */}
          <div
            style={{
              background: 'rgba(8, 10, 15, 0.7)',
              border: '1px solid rgba(117, 150, 200, 0.15)',
              borderRadius: '4px',
              padding: '14px 16px',
              marginBottom: '24px',
              fontSize: '12px',
              color: '#CBD5E1',
              lineHeight: 1.55
            }}
          >
            <div style={{ fontWeight: 600, color: '#C6A45A', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#C6A45A" />
              <span>Core Investigation Pipeline Learned:</span>
            </div>
            <ol style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11.5px', color: '#9BA8BA' }}>
              <li><strong>Sentinel Command & Scenario Simulator:</strong> Surface anomalies & stress-test topologies.</li>
              <li><strong>Attack Graph & Token Forensics:</strong> Trace monotonic BFS money flows & verify SHA-256 lineage.</li>
              <li><strong>Detection Lab:</strong> Synthesize multi-engine scores (Isolation Forest, Louvain, GraphSAGE).</li>
              <li><strong>Incident Response, Evidence Vault & Audit Ledger:</strong> Document cases, seal packages, audit trail.</li>
            </ol>
          </div>

          {/* Three Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={onFinishTour}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#080A0F',
                border: 'none',
                borderRadius: '4px',
                padding: '12px 18px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle2 size={15} />
              <span>Finish Tour</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
              <button
                onClick={onReplayTour}
                style={{
                  background: 'rgba(21, 27, 39, 0.9)',
                  color: '#C6A45A',
                  border: '1px solid rgba(198, 164, 90, 0.3)',
                  borderRadius: '4px',
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={13} />
                <span>Replay Tour</span>
              </button>

              <button
                onClick={onExploreApplication}
                style={{
                  background: 'rgba(21, 27, 39, 0.9)',
                  color: '#7596C8',
                  border: '1px solid rgba(117, 150, 200, 0.25)',
                  borderRadius: '4px',
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Explore the Application</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 24px',
            background: '#0D111A',
            borderTop: '1px solid rgba(117, 150, 200, 0.12)',
            fontSize: '11px',
            color: '#64748B'
          }}
        >
          <span>Note: Walkthrough completion demonstrates workstation features; real AML investigations require empirical verification.</span>
        </div>
      </div>
    </div>
  );
};
