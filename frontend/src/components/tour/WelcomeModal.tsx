import React from 'react';
import { Compass, X, ArrowRight, Shield, ShieldCheck, Play, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkipTour: () => void;
  onExploreOnMyOwn: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onStartTour,
  onSkipTour,
  onExploreOnMyOwn
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="tour-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
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
      onClick={onSkipTour}
    >
      <div
        className="welcome-card"
        style={{
          backgroundColor: '#111722',
          border: '1px solid #C6A45A',
          borderRadius: '6px',
          maxWidth: '560px',
          width: '100%',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(198, 164, 90, 0.22)',
          overflow: 'hidden',
          animation: 'tourFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cyber Shield Accent Top Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(198, 164, 90, 0.18) 0%, rgba(117, 150, 200, 0.12) 100%)',
            borderBottom: '1px solid rgba(198, 164, 90, 0.3)',
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
                background: 'rgba(198, 164, 90, 0.15)',
                border: '1px solid #C6A45A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Compass size={18} color="#C6A45A" />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#C6A45A',
                  display: 'block'
                }}
              >
                INTERACTIVE ONBOARDING
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: '#7596C8',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                PRODUCT WALKTHROUGH
              </span>
            </div>
          </div>

          <button
            onClick={onSkipTour}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '2px',
              transition: 'color 0.15s ease'
            }}
            title="Close"
            aria-label="Close welcome modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px' }}>
          <h2
            id="welcome-modal-title"
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#E8EDF5',
              letterSpacing: '-0.01em',
              marginBottom: '10px'
            }}
          >
            Welcome to MULE MATRIX
          </h2>

          <p
            style={{
              fontSize: '13.5px',
              lineHeight: 1.6,
              color: '#9BA8BA',
              marginBottom: '20px'
            }}
          >
            Learn how to investigate suspicious financial activity, trace token movements, detect potential mule networks, and preserve investigation evidence through a guided walkthrough.
          </p>

          {/* Key Lifecycle Stages Summary Strip */}
          <div
            style={{
              background: 'rgba(8, 10, 15, 0.7)',
              border: '1px solid rgba(117, 150, 200, 0.15)',
              borderRadius: '4px',
              padding: '12px 14px',
              marginBottom: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              textAlign: 'center'
            }}
          >
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#00D2FF', fontWeight: 700, display: 'block' }}>
                01. OBSERVE
              </span>
              <span style={{ fontSize: '11px', color: '#9BA8BA' }}>Alerts & Telemetry</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#C6A45A', fontWeight: 700, display: 'block' }}>
                02. TRACE
              </span>
              <span style={{ fontSize: '11px', color: '#9BA8BA' }}>Graph & Lineage</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#7596C8', fontWeight: 700, display: 'block' }}>
                03. DETECT
              </span>
              <span style={{ fontSize: '11px', color: '#9BA8BA' }}>ML Dossiers</span>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#10B981', fontWeight: 700, display: 'block' }}>
                04. RESPOND
              </span>
              <span style={{ fontSize: '11px', color: '#9BA8BA' }}>Cases & Evidence</span>
            </div>
          </div>

          {/* Three Primary Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Primary Action 1: Start Guided Tour */}
            <button
              onClick={onStartTour}
              style={{
                background: 'linear-gradient(135deg, #C6A45A 0%, #A8863A 100%)',
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
                boxShadow: '0 4px 14px rgba(198, 164, 90, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              <Play size={14} fill="#080A0F" />
              <span>Start Guided Tour</span>
              <ArrowRight size={14} />
            </button>

            {/* Actions 2 & 3: Skip Tour & Explore on My Own */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '2px' }}>
              <button
                onClick={onExploreOnMyOwn}
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
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Explore on My Own</span>
              </button>

              <button
                onClick={onSkipTour}
                style={{
                  background: 'transparent',
                  color: '#9BA8BA',
                  border: '1px solid rgba(117, 150, 200, 0.15)',
                  borderRadius: '4px',
                  padding: '9px 14px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Skip Tour</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Note */}
        <div
          style={{
            padding: '10px 24px',
            background: '#0D111A',
            borderTop: '1px solid rgba(117, 150, 200, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748B'
          }}
        >
          <span>You can replay this tour anytime from the menu.</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>v2.4 SEC-OPS</span>
        </div>
      </div>
    </div>
  );
};
