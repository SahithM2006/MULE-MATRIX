import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  Cpu,
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { useInvestigation, GUIDED_STAGES } from '../context/InvestigationContext';

export const InvestigationProgressPanel: React.FC = () => {
  const {
    isGuidedMode,
    guidedStageIndex,
    milestones,
    evidence,
    selectedAccountId,
    selectedTxId,
    selectedTokenId,
    selectedCaseId,
    goToGuidedStage,
    advanceToNextGuidedStage,
    resetInvestigationSession,
    openWalkthrough,
    toggleGuidedMode,
    investigateAccount,
    traceToken,
    openCase,
    navigateToModule,
    isTourActive
  } = useInvestigation();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = (text: string, idKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getStageStatus = (stageNum: number) => {
    const stageCfg = GUIDED_STAGES[stageNum - 1];
    const isDone = milestones[stageCfg.milestoneKey];
    if (isDone) return 'COMPLETED';
    if (stageNum === guidedStageIndex) return 'CURRENT';
    if (stageNum < guidedStageIndex) return 'COMPLETED';
    return 'PENDING';
  };

  const currentStageCfg = GUIDED_STAGES[guidedStageIndex - 1] || GUIDED_STAGES[0];

  // Calculate next logical target module & label
  const getNextAction = () => {
    switch (guidedStageIndex) {
      case 1:
        return {
          label: 'Continue to Trace (Attack Graph) →',
          action: () => goToGuidedStage(2)
        };
      case 2:
        return {
          label: 'Continue to Verify (Token Forensics) →',
          action: () => goToGuidedStage(3)
        };
      case 3:
        return {
          label: 'Continue to Detect (Detection Lab) →',
          action: () => goToGuidedStage(4)
        };
      case 4:
        return {
          label: 'Continue to Respond (Incident Response) →',
          action: () => goToGuidedStage(5)
        };
      case 5:
        return {
          label: 'Continue to Preserve (Evidence Vault) →',
          action: () => goToGuidedStage(6)
        };
      case 6:
        return {
          label: 'Review Chained Ledger (Audit Ledger) →',
          action: () => navigateToModule('RESPOND', 'audit-ledger')
        };
      default:
        return {
          label: 'Next Step →',
          action: advanceToNextGuidedStage
        };
    }
  };

  const nextAction = getNextAction();

  if (!isGuidedMode || isTourActive) {
    return null;
  }

  return (
    <div
      className="investigation-progress-container"
      style={{
        background: 'linear-gradient(180deg, rgba(17, 23, 34, 0.98) 0%, rgba(13, 17, 26, 0.98) 100%)',
        borderBottom: '1px solid rgba(198, 164, 90, 0.25)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        zIndex: 40
      }}
    >
      {/* Top Banner: Stage Header, Target Identifiers, and Command CTAs */}
      <div
        style={{
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(117, 150, 200, 0.12)'
        }}
      >
        {/* Left: Active Investigation Target Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '2px',
                background: 'rgba(198, 164, 90, 0.15)',
                border: '1px solid var(--accent-gold)',
                color: 'var(--accent-gold)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.06em'
              }}
            >
              <Compass size={12} />
              STAGE 0{guidedStageIndex} // {currentStageCfg.id}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentStageCfg.title}
            </span>
          </div>

          <div style={{ height: '18px', width: '1px', background: 'rgba(117, 150, 200, 0.2)' }} />

          {/* Active Target Entities */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            {/* Target Account */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>TARGET:</span>
              <span
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(198, 164, 90, 0.4)'
                }}
                onClick={() => selectedAccountId && investigateAccount(selectedAccountId)}
                title="Click to view dossier in Detection Lab"
              >
                {selectedAccountId || 'ACC_HERO_MULE_L2_CONVERGE'}
              </span>
              <button
                type="button"
                className={`copy-pill ${copiedId === 'acc' ? 'copied-success' : ''}`}
                onClick={() => handleCopy(selectedAccountId || 'ACC_HERO_MULE_L2_CONVERGE', 'acc')}
                title="Copy Target Account ID"
                style={{ padding: '1px 5px', fontSize: '9px' }}
              >
                {copiedId === 'acc' ? 'Copied' : 'Copy'}
              </button>
            </div>

            {/* Target Transaction */}
            {selectedTxId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>TX:</span>
                <span style={{ color: 'var(--steel-blue)' }}>{selectedTxId}</span>
              </div>
            )}

            {/* Target Token */}
            {selectedTokenId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--text-muted)' }}>TOKEN:</span>
                <span
                  style={{
                    color: 'var(--accent-gold)',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onClick={() => traceToken(selectedTokenId)}
                  title="Click to verify in Token Forensics"
                >
                  {selectedTokenId}
                </span>
              </div>
            )}

            {/* Target Case */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'var(--text-muted)' }}>CASE:</span>
              {selectedCaseId ? (
                <span
                  style={{
                    color: 'var(--alert-success)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => openCase(selectedCaseId)}
                  title="Click to view case in Incident Response"
                >
                  {evidence.caseNumber || selectedCaseId}
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending Initiation</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-action"
            onClick={openWalkthrough}
            style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
            title="Read 6-Pillar Investigation Walkthrough"
          >
            <BookOpen size={12} color="var(--steel-blue)" />
            <span>Mission Briefing</span>
          </button>

          <button
            className="btn-action"
            onClick={resetInvestigationSession}
            style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
            title="Reset session to default Hero scenario"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>

          <button
            className="btn-primary"
            onClick={nextAction.action}
            style={{ fontSize: '11px', padding: '4px 14px', height: '28px' }}
          >
            <span>{nextAction.label}</span>
          </button>

          <button
            className="btn-action"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ height: '28px', padding: '0 6px' }}
            title={isCollapsed ? 'Expand Steps' : 'Collapse Steps'}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Stepper & Evidence Tray */}
      {!isCollapsed && (
        <div style={{ padding: '10px 20px 12px 20px' }}>
          {/* 6-Stage Interactive Stepper */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px'
            }}
          >
            {GUIDED_STAGES.map((s) => {
              const status = getStageStatus(s.stageNumber);
              const isCurrent = s.stageNumber === guidedStageIndex;
              const isDone = status === 'COMPLETED';

              let borderColor = 'rgba(117, 150, 200, 0.15)';
              let bg = 'rgba(21, 27, 39, 0.6)';
              let titleColor = 'var(--text-secondary)';

              if (isDone) {
                borderColor = 'rgba(16, 185, 129, 0.35)';
                bg = 'rgba(16, 185, 129, 0.08)';
                titleColor = 'var(--text-primary)';
              } else if (isCurrent) {
                borderColor = 'var(--accent-gold)';
                bg = 'rgba(198, 164, 90, 0.12)';
                titleColor = 'var(--accent-gold)';
              }

              return (
                <div
                  key={s.stageNumber}
                  onClick={() => goToGuidedStage(s.stageNumber)}
                  style={{
                    border: `1px solid ${borderColor}`,
                    background: bg,
                    borderRadius: 'var(--radius-xs)',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                  title={`Stage ${s.stageNumber}: ${s.title}\nAction: ${s.actionName}\nClick to jump directly to this step.`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '9px',
                        color: isCurrent ? 'var(--accent-gold)' : isDone ? 'var(--alert-success)' : 'var(--text-muted)',
                        fontWeight: 700
                      }}
                    >
                      STEP 0{s.stageNumber}
                    </span>

                    {isDone ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--alert-success)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                        <CheckCircle2 size={11} />
                        <span>DONE</span>
                      </span>
                    ) : isCurrent ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--accent-gold)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                        <span className="radar-dot" style={{ width: '5px', height: '5px' }} />
                        <span>ACTIVE</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
                        PENDING
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 600, color: titleColor, lineHeight: 1.25 }}>
                    {s.title}
                  </div>

                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.actionName}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Evidence Dossier Ribbon (What has been retrieved & verified so far) */}
          <div
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              background: 'rgba(8, 10, 15, 0.65)',
              borderRadius: '2px',
              border: '1px solid rgba(117, 150, 200, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--steel-blue)', fontWeight: 600 }}>EVIDENCE RETRIEVED:</span>

              {evidence.alertReason && (
                <span className="badge badge-high" style={{ fontSize: '9px' }}>
                  Signal: {evidence.alertReason}
                </span>
              )}

              {evidence.riskScore !== undefined && (
                <span className="badge badge-critical" style={{ fontSize: '9px' }}>
                  Risk Score: {evidence.riskScore.toFixed(1)}/100
                </span>
              )}

              {evidence.bfsPathCount !== undefined && (
                <span className="badge badge-gold" style={{ fontSize: '9px' }}>
                  BFS: {evidence.bfsPathCount} paths traced
                </span>
              )}

              {evidence.lineageValid !== undefined && (
                <span className="badge badge-success" style={{ fontSize: '9px' }}>
                  SHA-256 Lineage: {evidence.lineageValid ? 'VERIFIED' : 'TAMPER DETECTED'}
                </span>
              )}

              {evidence.caseNumber && (
                <span className="badge badge-info" style={{ fontSize: '9px' }}>
                  Case: {evidence.caseNumber}
                </span>
              )}

              {evidence.exportSealHash && (
                <span className="badge badge-low" style={{ fontSize: '9px' }}>
                  Seal: {evidence.exportSealHash.substring(0, 16)}...
                </span>
              )}

              {!evidence.alertReason && !evidence.riskScore && !evidence.bfsPathCount && (
                <span style={{ color: 'var(--text-muted)' }}>
                  Awaiting analytical verification actions across the investigation stages.
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
              <span>Context: Preserved across navigation</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-gold)' }}>Click any step to switch focus</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
