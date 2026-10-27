import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Zap,
  HelpCircle
} from 'lucide-react';
import { TOUR_STEPS, TourStepConfig } from './tourConfig';
import { useInvestigation } from '../../context/InvestigationContext';

interface GuidedTourOverlayProps {
  currentStep: number;
  isTourActive: boolean;
  stepStatus: 'idle' | 'waiting_action' | 'action_in_progress' | 'action_completed' | 'error';
  tourError: string | null;
  onNext: () => void;
  onBack: () => void;
  onSkipTour: () => void;
  onExitTour: () => void;
  onRetryAction?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const GuidedTourOverlay: React.FC<GuidedTourOverlayProps> = ({
  currentStep,
  isTourActive,
  stepStatus,
  tourError,
  onNext,
  onBack,
  onSkipTour,
  onExitTour,
  onRetryAction
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [targetElementFound, setTargetElementFound] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(true);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 120, left: 120 });
  const [arrowSide, setArrowSide] = useState<'top' | 'bottom' | 'left' | 'right' | 'none'>('top');
  const cardRef = useRef<HTMLDivElement>(null);

  const stepConfig: TourStepConfig = TOUR_STEPS[currentStep - 1] || TOUR_STEPS[0];

  // Helper to locate target element and calculate positions
  const updateTargetPosition = useCallback(() => {
    if (!isTourActive) return;

    let el = document.querySelector(stepConfig.targetSelector) as HTMLElement | null;
    if (!el && stepConfig.fallbackSelector) {
      el = document.querySelector(stepConfig.fallbackSelector) as HTMLElement | null;
    }

    if (el) {
      const rect = el.getBoundingClientRect();
      // Ensure element has non-zero size
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
        setTargetElementFound(true);
        setIsSearching(false);

        // Scroll into view if needed
        const isInViewport =
          rect.top >= 50 &&
          rect.bottom <= window.innerHeight - 50 &&
          rect.left >= 20 &&
          rect.right <= window.innerWidth - 20;

        if (!isInViewport) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        // Calculate Popover Position
        const cardWidth = 460;
        const cardHeight = cardRef.current?.offsetHeight || 380;
        const padding = 16;
        const margin = 14;

        let computedTop = 0;
        let computedLeft = 0;
        let computedArrow: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'top';

        // Check preferred position and available viewport space
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const spaceRight = window.innerWidth - rect.right;
        const spaceLeft = rect.left;

        if (stepConfig.preferredPosition === 'left' && spaceLeft > cardWidth + margin + padding) {
          computedTop = Math.max(padding, Math.min(rect.top - 20, window.innerHeight - cardHeight - padding));
          computedLeft = rect.left - cardWidth - margin;
          computedArrow = 'right';
        } else if (stepConfig.preferredPosition === 'right' && spaceRight > cardWidth + margin + padding) {
          computedTop = Math.max(padding, Math.min(rect.top - 20, window.innerHeight - cardHeight - padding));
          computedLeft = rect.right + margin;
          computedArrow = 'left';
        } else if (spaceBelow >= cardHeight + margin + padding || spaceBelow >= spaceAbove) {
          // Place below target
          computedTop = rect.bottom + margin;
          computedLeft = Math.max(padding, Math.min(rect.left, window.innerWidth - cardWidth - padding));
          computedArrow = 'top';
        } else if (spaceAbove >= cardHeight + margin + padding) {
          // Place above target
          computedTop = rect.top - cardHeight - margin;
          computedLeft = Math.max(padding, Math.min(rect.left, window.innerWidth - cardWidth - padding));
          computedArrow = 'bottom';
        } else {
          // Centered fallback
          computedTop = Math.max(padding, (window.innerHeight - cardHeight) / 2);
          computedLeft = Math.max(padding, (window.innerWidth - cardWidth) / 2);
          computedArrow = 'none';
        }

        setPopoverPos({ top: computedTop, left: computedLeft });
        setArrowSide(computedArrow);
        return true;
      }
    }

    setTargetElementFound(false);
    return false;
  }, [isTourActive, stepConfig]);

  // Repeatedly check for element until destination page renders
  useEffect(() => {
    if (!isTourActive) return;

    setIsSearching(true);
    setTargetRect(null);

    let attempts = 0;
    const maxAttempts = 30; // 3 seconds total

    const interval = setInterval(() => {
      attempts++;
      const found = updateTargetPosition();
      if (found || attempts >= maxAttempts) {
        clearInterval(interval);
        setIsSearching(false);
      }
    }, 100);

    const handleResize = () => {
      updateTargetPosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [currentStep, isTourActive, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExitTour();
      } else if (e.key === 'ArrowRight' && !stepConfig.requiresAction) {
        onNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 1) {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, currentStep, stepConfig.requiresAction, onNext, onBack, onExitTour]);

  if (!isTourActive) return null;

  const progressPercent = ((currentStep) / 10) * 100;

  return (
    <div className="guided-tour-layer" style={{ zIndex: 9998 }}>
      {/* SVG Mask Spotlight Cutout */}
      <svg
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9998
        }}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* White covers all (opaque in mask) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the spotlight area around target (transparent in mask) */}
            {targetRect && (
              <rect
                x={Math.max(0, targetRect.left - 6)}
                y={Math.max(0, targetRect.top - 6)}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="6"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Dimmed backdrop covering full viewport using the mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="#080A0F"
          fillOpacity="0.75"
          mask="url(#spotlight-mask)"
          style={{ transition: 'all 0.25s ease' }}
        />
      </svg>

      {/* Pulsing Highlight Box around target element */}
      {targetRect && (
        <div
          className="spotlight-frame"
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: '6px',
            border: '2px solid #C6A45A',
            boxShadow: '0 0 0 1px rgba(198, 164, 90, 0.4), 0 0 24px rgba(198, 164, 90, 0.35)',
            pointerEvents: 'none',
            zIndex: 9999,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      )}

      {/* Floating Instruction Card (Coach Mark) */}
      <div
        ref={cardRef}
        className="tour-coach-mark"
        style={{
          position: 'fixed',
          top: targetElementFound ? `${popoverPos.top}px` : 'calc(50% - 200px)',
          left: targetElementFound ? `${popoverPos.left}px` : 'calc(50% - 230px)',
          width: '460px',
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: '#111722',
          border: '1px solid #C6A45A',
          borderRadius: '6px',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.9), 0 0 25px rgba(198, 164, 90, 0.2)',
          zIndex: 10001,
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'tourFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar Top Rule */}
        <div style={{ height: '3px', background: 'rgba(117, 150, 200, 0.15)', width: '100%', position: 'relative' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'linear-gradient(90deg, #7596C8 0%, #C6A45A 100%)',
              transition: 'width 0.3s ease-out'
            }}
          />
        </div>

        {/* Card Header */}
        <div
          style={{
            padding: '14px 18px',
            background: 'linear-gradient(180deg, rgba(21, 27, 39, 0.95) 0%, rgba(17, 23, 34, 0.98) 100%)',
            borderBottom: '1px solid rgba(117, 150, 200, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                fontWeight: 700,
                color: '#C6A45A',
                background: 'rgba(198, 164, 90, 0.12)',
                border: '1px solid #C6A45A',
                padding: '2px 7px',
                borderRadius: '2px',
                letterSpacing: '0.04em'
              }}
            >
              STEP {currentStep} OF 10
            </span>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#7596C8',
                fontWeight: 600
              }}
            >
              {stepConfig.badge}
            </span>
          </div>

          <button
            onClick={onExitTour}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Exit Walkthrough"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Step Title & Current Location */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#E8EDF5', margin: 0 }}>
              {stepConfig.title}
            </h3>
            <div style={{ fontSize: '11.5px', color: '#7596C8', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
              Current Route: {stepConfig.pageName}
            </div>
          </div>

          {/* Primary Instruction */}
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(8, 10, 15, 0.75)',
              border: '1px solid rgba(198, 164, 90, 0.25)',
              borderLeft: '3px solid #C6A45A',
              borderRadius: '3px'
            }}
          >
            <p style={{ fontSize: '13px', color: '#E8EDF5', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
              {stepConfig.instruction}
            </p>
          </div>

          {/* Target Explanation */}
          <div style={{ fontSize: '12px', color: '#9BA8BA', lineHeight: 1.5 }}>
            <strong style={{ color: '#E8EDF5' }}>What to look for: </strong>
            {stepConfig.targetExplanation}
          </div>

          {/* Why this matters (Rationale) */}
          <div style={{ fontSize: '11.5px', color: '#64748B', lineHeight: 1.45, fontStyle: 'italic' }}>
            <span style={{ color: '#C6A45A', fontStyle: 'normal', fontWeight: 600 }}>Forensic Context: </span>
            {stepConfig.rationale}
          </div>

          {/* Action Requirement / Status Indicator */}
          {stepConfig.requiresAction && (
            <div
              style={{
                marginTop: '4px',
                padding: '10px 14px',
                borderRadius: '3px',
                background:
                  stepStatus === 'action_completed'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : stepStatus === 'error'
                    ? 'rgba(224, 82, 82, 0.12)'
                    : 'rgba(198, 164, 90, 0.12)',
                border: `1px solid ${
                  stepStatus === 'action_completed'
                    ? '#10B981'
                    : stepStatus === 'error'
                    ? '#E05252'
                    : '#C6A45A'
                }`,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
                {stepStatus === 'action_completed' ? (
                  <>
                    <CheckCircle2 size={15} color="#10B981" />
                    <span style={{ color: '#10B981' }}>Backend Action Verified Successfully</span>
                  </>
                ) : stepStatus === 'action_in_progress' ? (
                  <>
                    <div className="radar-dot" style={{ width: '8px', height: '8px' }} />
                    <span style={{ color: '#C6A45A' }}>Processing action on backend...</span>
                  </>
                ) : stepStatus === 'error' ? (
                  <>
                    <AlertTriangle size={15} color="#E05252" />
                    <span style={{ color: '#E05252' }}>Backend Error: {tourError || 'Action failed'}</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} color="#C6A45A" />
                    <span style={{ color: '#C6A45A' }}>Action Required: {stepConfig.actionLabel}</span>
                  </>
                )}
              </div>

              {stepStatus === 'idle' || stepStatus === 'waiting_action' ? (
                <span style={{ fontSize: '11px', color: '#CBD5E1' }}>
                  {stepConfig.actionHint || 'Click the highlighted button in the workspace to proceed.'}
                </span>
              ) : stepStatus === 'error' ? (
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {onRetryAction && (
                    <button
                      className="btn-action"
                      onClick={onRetryAction}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      <RotateCcw size={11} />
                      <span>Retry Action</span>
                    </button>
                  )}
                  <button
                    className="btn-action"
                    onClick={onNext}
                    style={{ fontSize: '11px', padding: '3px 8px', color: '#9BA8BA' }}
                  >
                    Skip Step
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Fallback Notice if Target Not Yet Found */}
          {!targetElementFound && !isSearching && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(117, 150, 200, 0.08)',
                border: '1px solid rgba(117, 150, 200, 0.2)',
                borderRadius: '3px',
                fontSize: '11px',
                color: '#7596C8'
              }}
            >
              Destination view is ready. If target element is not highlighted, click 'Next' to continue or switch tabs.
            </div>
          )}
        </div>

        {/* Card Footer Controls */}
        <div
          style={{
            padding: '12px 18px',
            background: '#0D111A',
            borderTop: '1px solid rgba(117, 150, 200, 0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          {/* Left: Back & Skip Tour */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onBack}
              disabled={currentStep <= 1}
              style={{
                background: 'transparent',
                color: currentStep <= 1 ? '#475569' : '#9BA8BA',
                border: '1px solid rgba(117, 150, 200, 0.18)',
                borderRadius: '3px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: currentStep <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>

            <button
              onClick={onSkipTour}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              Skip Tour
            </button>
          </div>

          {/* Right: Next / Got it */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {stepConfig.requiresAction && stepStatus !== 'action_completed' && (
              <button
                onClick={onNext}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7596C8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  padding: '4px 6px'
                }}
                title="Skip this action"
              >
                Skip Step
              </button>
            )}

            <button
              onClick={onNext}
              style={{
                background: 'linear-gradient(135deg, #C6A45A 0%, #A8863A 100%)',
                color: '#080A0F',
                border: 'none',
                borderRadius: '3px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(198, 164, 90, 0.3)'
              }}
            >
              <span>{currentStep === 10 ? 'Finish Tour' : 'Got it / Next'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
