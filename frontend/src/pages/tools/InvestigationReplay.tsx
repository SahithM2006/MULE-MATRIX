import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Eye,
  Network,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../../api/client';
import { HeroReplayStep } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';

export const InvestigationReplay: React.FC = () => {
  const { investigateAccount, traceToken, navigateToModule } = useInvestigation();
  const [steps, setSteps] = useState<HeroReplayStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(3000); // ms per step
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getHeroReplay();
        setSteps(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch hero scenario replay.');
      } finally {
        setLoading(false);
      }
    };
    fetchSteps();
  }, []);

  // Automatic playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && steps.length > 0) {
      timer = setTimeout(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIdx, steps.length, playbackSpeed]);

  const currentStep = steps[currentStepIdx];

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentStepIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentStepIdx((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
  };

  return (
    <div className="threat-stream-page">
      {/* Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <Play size={14} />
            <span>HERO SCENARIO INVESTIGATION REPLAY</span>
          </div>
          <h2>Chronological Attack and Detection Walkthrough</h2>
          <p className="stream-description">
            Interactive 9-step forensic progression from victim phishing compromise, through structured mule layering, to algorithmic detection and incident response case dispatch.
          </p>
        </div>

        <div className="stream-controls">
          <div data-tour="replay-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              className="btn-secondary"
              onClick={handleReset}
              title="Reset to Step 1"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button
              className="btn-secondary"
              onClick={handlePrev}
              disabled={currentStepIdx === 0}
            >
              <SkipBack size={14} />
              <span>Prev</span>
            </button>
            <button
              className="btn-primary"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              className="btn-secondary"
              onClick={handleNext}
              disabled={currentStepIdx >= steps.length - 1}
            >
              <span>Next</span>
              <SkipForward size={14} />
            </button>
          </div>

          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="filter-select"
          >
            <option value={1500}>Speed: Fast (1.5s)</option>
            <option value={3000}>Speed: Normal (3.0s)</option>
            <option value={5000}>Speed: Slow (5.0s)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-state">Loading investigation replay sequence...</div>
      ) : (
        <>
          {/* Stepper Navigation Strip with Progress Bar */}
          <div className="replay-stepper-wrap" style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '3px',
                width: `${steps.length > 1 ? (currentStepIdx / (steps.length - 1)) * 100 : 0}%`,
                background: 'linear-gradient(90deg, var(--steel-blue), var(--accent-gold))',
                transition: 'width 0.4s ease-out',
                zIndex: 2,
                boxShadow: '0 0 8px var(--accent-gold)'
              }}
            />
            <div className="replay-stepper">
              {steps.map((st, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;
                return (
                  <button
                    key={st.step_number}
                    className={`step-bubble-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIdx(idx);
                    }}
                  >
                    <div className="step-circle">
                      {isCompleted ? <CheckCircle2 size={13} /> : st.step_number}
                    </div>
                    <span className="step-label">Step {st.step_number}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {currentStep && (
            <div className="replay-main-grid stagger-in">
              {/* Left Column: Active Step Details */}
              <div className="hud-panel replay-card-active active-sweep-border" data-tour="utilities-overview" style={{ padding: '20px 24px' }}>
                <div className="card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.9rem', padding: '0.35rem 0.65rem' }}>
                      STEP {currentStep.step_number} OF {steps.length}
                    </span>
                    <span className="card-title" style={{ fontSize: '1.15rem' }}>
                      {currentStep.title}
                    </span>
                  </div>
                  {currentStep.alert_triggered && (
                    <span className="badge badge-critical" style={{ fontSize: '0.8rem' }}>
                      {currentStep.alert_triggered}
                    </span>
                  )}
                </div>

                <div className="replay-timestamp-bar">
                  <Clock size={13} color="#7596C8" />
                  <span className="font-mono text-muted">
                    Execution Timestamp: {currentStep.timestamp.replace('T', ' ')}
                  </span>
                </div>

                <div className="replay-flow-visual">
                  <div className="flow-node">
                    <span className="node-type">SOURCE ACCOUNT</span>
                    <span className="node-id font-mono">{currentStep.source_account}</span>
                  </div>

                  <div className="flow-arrow">
                    <ArrowRight size={22} color="#C6A45A" />
                    <span className="flow-amount font-mono">
                      {currentStep.amount > 0 ? `₹${currentStep.amount.toLocaleString()}` : currentStep.tx_type.toUpperCase()}
                    </span>
                  </div>

                  <div className="flow-node">
                    <span className="node-type">DESTINATION ACCOUNT</span>
                    <span className="node-id font-mono">{currentStep.destination_account}</span>
                  </div>
                </div>

                <div className="replay-explanation-box">
                  <span className="explanation-title">FORENSIC EVENT EXPLANATION</span>
                  <p className="explanation-text">{currentStep.explanation}</p>
                </div>

                <div className="replay-detection-box">
                  <span className="explanation-title">ENGINE DETECTION EVENTS</span>
                  <div className="detection-tags-wrap">
                    {currentStep.detection_events.map((ev, i) => (
                      <span key={i} className="detection-tag font-mono">
                        <ShieldAlert size={12} color="#E05252" />
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="replay-actions-bar">
                  {currentStep.source_account.startsWith('ACC_') && (
                    <button
                      className="btn-action"
                      onClick={() => investigateAccount(currentStep.source_account)}
                    >
                      <Cpu size={12} />
                      <span>Inspect Source ({currentStep.source_account})</span>
                    </button>
                  )}
                  {currentStep.destination_account.startsWith('ACC_') && (
                    <button
                      className="btn-action"
                      onClick={() => investigateAccount(currentStep.destination_account)}
                    >
                      <Cpu size={12} />
                      <span>Inspect Target ({currentStep.destination_account})</span>
                    </button>
                  )}
                  <button
                    className="btn-action btn-gold"
                    onClick={() => {
                      traceToken('TOKR_HERO_500K_GENESIS');
                      navigateToModule('TRACE', 'token-forensics');
                    }}
                  >
                    <Network size={12} />
                    <span>View Token Provenance Chain</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Hero Architecture Overview */}
              <div className="card replay-card-side">
                <div className="card-header">
                  <span className="card-title">HERO ATTACK ARCHITECTURE</span>
                </div>

                <div className="architecture-step-list">
                  <div className={`arch-step-item ${currentStepIdx <= 1 ? 'current' : currentStepIdx > 1 ? 'passed' : ''}`}>
                    <div className="arch-dot" />
                    <div className="arch-content">
                      <span className="arch-title">Stage 1: Phishing Compromise & Fan-Out</span>
                      <span className="arch-desc font-mono">ACC_HERO_VICTIM_001 splits ₹500,000 to Mule L1_A & L1_B</span>
                    </div>
                  </div>

                  <div className={`arch-step-item ${currentStepIdx >= 2 && currentStepIdx <= 3 ? 'current' : currentStepIdx > 3 ? 'passed' : ''}`}>
                    <div className="arch-dot" />
                    <div className="arch-content">
                      <span className="arch-title">Stage 2: Rapid Pass-Through Layering</span>
                      <span className="arch-desc font-mono">Mules forward 99% of funds to ACC_HERO_MULE_L2_CONVERGE</span>
                    </div>
                  </div>

                  <div className={`arch-step-item ${currentStepIdx === 4 ? 'current' : currentStepIdx > 4 ? 'passed' : ''}`}>
                    <div className="arch-dot" />
                    <div className="arch-content">
                      <span className="arch-title">Stage 3: Terminal Cash-Out Outflow</span>
                      <span className="arch-desc font-mono">Hub initiates ₹490,000 cashout to ACC_HERO_CASHOUT_DEST_999</span>
                    </div>
                  </div>

                  <div className={`arch-step-item ${currentStepIdx >= 5 && currentStepIdx <= 7 ? 'current' : currentStepIdx > 7 ? 'passed' : ''}`}>
                    <div className="arch-dot" />
                    <div className="arch-content">
                      <span className="arch-title">Stage 4: Multi-Engine Algorithmic Detection</span>
                      <span className="arch-desc font-mono">SHA-256 chain verified + BFS path mapped + GraphSAGE inference</span>
                    </div>
                  </div>

                  <div className={`arch-step-item ${currentStepIdx === 8 ? 'current' : ''}`}>
                    <div className="arch-dot" />
                    <div className="arch-content">
                      <span className="arch-title">Stage 5: Incident Escalation & Response</span>
                      <span className="arch-desc font-mono">Risk Engine computes 94.0 score, creating verifiable Case Dossier</span>
                    </div>
                  </div>
                </div>

                <div className="hero-verification-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>DETERMINISTIC VERIFICATION</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0, lineHeight: 1.4 }}>
                    This end-to-end hero progression is fully seeded and reproducible in the local SQLite WAL database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
