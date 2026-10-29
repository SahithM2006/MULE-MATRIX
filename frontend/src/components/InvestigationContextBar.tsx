import React, { useState } from 'react';
import {
  Crosshair,
  Copy,
  Check,
  X,
  ExternalLink,
  Network,
  Cpu,
  ShieldAlert,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

export const InvestigationContextBar: React.FC = () => {
  const {
    selectedAccountId,
    selectedTxId,
    selectedTokenId,
    selectedCaseId,
    selectedScenarioId,
    resetInvestigationSession,
    investigateAccount,
    navigateToModule
  } = useInvestigation();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleClearContext = () => {
    resetInvestigationSession();
  };

  const handleLoadHero = () => {
    investigateAccount('ACC_HERO_MULE_L2_CONVERGE');
  };

  return (
    <div className="investigation-context-strip" role="region" aria-label="Investigation Target Context">
      {selectedAccountId ? (
        <div className="context-strip-active">
          {/* Active Target Header Badge */}
          <div className="target-anchor-group">
            <span className="target-ping-dot" />
            <Crosshair size={13} className="text-gold" />
            <span className="target-label">ACTIVE INVESTIGATION TARGET</span>
          </div>

          {/* Persistent Key Identifiers */}
          <div className="target-identifiers-wrap">
            {/* Account ID */}
            <div className="identifier-chip account-chip">
              <span className="chip-key">SUSPECT ACC:</span>
              <span className="chip-val font-mono">{selectedAccountId}</span>
              <button
                type="button"
                className="chip-copy-btn"
                onClick={() => handleCopy(selectedAccountId, 'acc')}
                title="Copy Account ID"
                aria-label="Copy Account ID"
              >
                {copiedKey === 'acc' ? <Check size={11} color="var(--alert-success)" /> : <Copy size={11} />}
              </button>
            </div>

            {/* Transaction ID if set */}
            {selectedTxId && (
              <div className="identifier-chip tx-chip">
                <span className="chip-key">TX:</span>
                <span className="chip-val font-mono">{selectedTxId}</span>
                <button
                  type="button"
                  className="chip-copy-btn"
                  onClick={() => handleCopy(selectedTxId, 'tx')}
                  title="Copy Transaction ID"
                >
                  {copiedKey === 'tx' ? <Check size={11} color="var(--alert-success)" /> : <Copy size={11} />}
                </button>
              </div>
            )}

            {/* Token ID if set */}
            {selectedTokenId && (
              <div className="identifier-chip token-chip">
                <span className="chip-key">TOKEN:</span>
                <span className="chip-val font-mono">{selectedTokenId}</span>
              </div>
            )}

            {/* Case ID if set */}
            {selectedCaseId && (
              <div className="identifier-chip case-chip">
                <span className="chip-key">CASE:</span>
                <span className="chip-val font-mono">{selectedCaseId}</span>
              </div>
            )}

            {/* Scenario if active */}
            {selectedScenarioId && (
              <div className="identifier-chip scenario-chip">
                <span className="chip-key">SCENARIO:</span>
                <span className="chip-val">{selectedScenarioId.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>

          {/* Quick Investigation Pivot Actions */}
          <div className="context-action-pivots">
            <button
              type="button"
              className="pivot-btn"
              onClick={() => navigateToModule('TRACE', 'attack-graph')}
              title="Trace money flow in Attack Graph"
            >
              <Network size={12} />
              <span>Trace Graph</span>
            </button>

            <button
              type="button"
              className="pivot-btn"
              onClick={() => navigateToModule('DETECT', 'detection-lab')}
              title="Examine 8-engine risk signals in Detection Lab"
            >
              <Cpu size={12} />
              <span>Analyze Lab</span>
            </button>

            <button
              type="button"
              className="pivot-btn"
              onClick={() => navigateToModule('RESPOND', 'incident-response')}
              title="Manage incident case in Incident Response"
            >
              <ShieldAlert size={12} />
              <span>{selectedCaseId ? 'View Case' : 'Open Case'}</span>
            </button>

            <button
              type="button"
              className="pivot-btn clear-btn"
              onClick={handleClearContext}
              title="Clear active investigation selection"
              aria-label="Clear active investigation selection"
            >
              <X size={12} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="context-strip-idle">
          <div className="idle-indicator">
            <span className="idle-dot" />
            <span className="idle-text">
              No suspect account pinned. Select an alert from Sentinel Command or Threat Stream to anchor your investigation.
            </span>
          </div>

          <div className="idle-actions">
            <button type="button" className="idle-quick-load" onClick={handleLoadHero}>
              <Crosshair size={11} />
              <span>Anchor Hero Suspect (ACC_HERO_MULE_L2_CONVERGE)</span>
            </button>
            <button
              type="button"
              className="idle-browse-stream"
              onClick={() => navigateToModule('OBSERVE', 'threat-stream')}
            >
              <span>Browse Live Feed</span>
              <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

