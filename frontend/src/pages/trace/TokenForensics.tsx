import React, { useEffect, useState } from 'react';
import {
  GitCommit,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Lock,
  ArrowRight,
  Fingerprint,
  Link2,
  FileCheck2,
  Share2,
  Info
} from 'lucide-react';
import { api } from '../../api/client';
import { LineageEvent, LineageVerifyResponse, TamperTestResponse } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';
import { ContextualGuidancePanel } from '../../components/ContextualGuidancePanel';

export const TokenForensics: React.FC = () => {
  const {
    selectedTokenId,
    selectedAccountId,
    investigateAccount,
    setMilestoneCompleted,
    navigateToModule
  } = useInvestigation();
  const [tokenId, setTokenId] = useState(selectedTokenId || '');
  const [events, setEvents] = useState<LineageEvent[]>([]);
  const [verifyResult, setVerifyResult] = useState<LineageVerifyResponse | null>(null);
  const [tamperResult, setTamperResult] = useState<TamperTestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);

  const loadLineage = async () => {
    if (!tokenId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setVerifyResult(null);
    setTamperResult(null);
    try {
      const data = await api.getLineage(tokenId);
      setEvents(data);
    } catch (err: any) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTokenId !== undefined) {
      setTokenId(selectedTokenId || '');
    }
  }, [selectedTokenId]);

  useEffect(() => {
    loadLineage();
  }, [tokenId]);

  const handleVerifyChain = async () => {
    if (!tokenId) return;
    setVerifying(true);
    try {
      const res = await api.verifyLineage(tokenId);
      setVerifyResult(res);
      if (res.valid) {
        setMilestoneCompleted('lineageVerified', {
          lineageValid: true
        });
      }
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleRunTamperTest = async () => {
    setTampering(true);
    try {
      const res = await api.runTamperTest(tokenId, 2);
      setTamperResult(res);
    } catch (err: any) {
      alert(`Tamper test error: ${err.message}`);
    } finally {
      setTampering(false);
    }
  };

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className="threat-stream-page">
      {/* Stream Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <Lock size={13} />
            <span>STAGE 02 // CRYPTOGRAPHIC TOKEN PROVENANCE</span>
          </div>
          <h2>Token Forensics & Hash-Chain Verification</h2>
          <p className="stream-description">
            Forensic cryptographic verification station establishing post-recording immutability and continuous parent-child SHA-256 hash chaining across simulated e-Rupee token transfers.
          </p>
        </div>

        <div className="stream-controls">
          <button className="btn-primary" onClick={handleVerifyChain} disabled={verifying || !tokenId}>
            <ShieldCheck size={13} className={verifying ? 'spinning' : ''} />
            <span>{verifying ? 'Recalculating Hashes...' : 'Verify Cryptographic Chain'}</span>
          </button>
          <button className="btn-secondary" onClick={handleRunTamperTest} disabled={tampering || !tokenId}>
            <AlertOctagon size={13} color="var(--alert-critical)" className={tampering ? 'spinning' : ''} />
            <span>{tampering ? 'Simulating Tamper...' : 'Run Tamper Test'}</span>
          </button>
        </div>
      </div>

      {/* Persistent Contextual Investigation Guidance */}
      <ContextualGuidancePanel />

      {!tokenId && (
        <div
          className="hud-panel"
          style={{
            padding: '20px 24px',
            borderLeft: '4px solid var(--steel-blue)',
            background: 'rgba(21, 27, 39, 0.95)',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Info size={18} color="var(--steel-blue)" />
            <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
              No Token Lineage Reference for Selected Entity
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '780px' }}>
            The active account {selectedAccountId ? `(${selectedAccountId})` : ''} does not involve simulated e-Rupee tokenized transfers. Token lineage and parent-child split records are maintained specifically for tokenized e-INR flows (such as the predefined Hero scenario). For standard account-to-account transfers, forensic evidence is evaluated via 11-D graph topology and algorithmic detection models.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={() => {
                if (selectedAccountId) {
                  investigateAccount(selectedAccountId);
                } else {
                  navigateToModule('DETECT', 'detection-lab');
                }
              }}
            >
              <span>Review Detection Evidence in Detection Lab →</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => setTokenId('TOKR_HERO_500K_GENESIS')}
            >
              <span>Inspect Predefined Hero Token Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* Target Token Genesis & Cryptographic Seal Banner */}
      <div className="hud-panel active-sweep-border" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(198, 164, 90, 0.12)',
                border: '1px solid var(--accent-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Fingerprint size={20} color="var(--accent-gold)" />
            </div>
            <div>
              <span className="detail-label" style={{ display: 'block', fontSize: '9px', letterSpacing: '0.06em' }}>
                GENESIS TOKEN IDENTIFIER
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="font-mono tabular-nums" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {tokenId}
                </span>
                <button
                  type="button"
                  className={`copy-pill ${copiedHash === tokenId ? 'copied-success' : ''}`}
                  onClick={() => handleCopy(tokenId)}
                >
                  {copiedHash === tokenId ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>GENESIS SUPPLY</span>
              <span className="font-mono tabular-nums" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                ₹50,00,000.00 e-INR
              </span>
            </div>

            <div>
              <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>CHAIN DEPTH</span>
              <span className="font-mono tabular-nums text-cyan" style={{ fontSize: '13px' }}>
                {events.length} Verified Hops
              </span>
            </div>

            <div>
              <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>INTEGRITY SPECIFICATION</span>
              <span className="tech-tag" style={{ marginTop: '2px' }}>
                RFC 8785 CANONICAL JSON + SHA-256
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {verifyResult && (
        <div
          className="hud-panel stagger-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            padding: '14px 18px',
            background: verifyResult.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(224, 82, 82, 0.12)',
            border: `1px solid ${verifyResult.valid ? '#10B981' : '#E05252'}`,
            color: verifyResult.valid ? '#10B981' : '#E05252'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {verifyResult.valid ? <CheckCircle2 size={22} /> : <AlertOctagon size={22} />}
            <div>
              <div style={{ fontWeight: 700, letterSpacing: '0.04em', fontSize: '13px' }}>
                {verifyResult.valid ? 'CRYPTOGRAPHIC LINEAGE CHAIN VERIFIED // ZERO TAMPERING' : 'CHAIN COMPROMISE DETECTED // HASH MISMATCH'}
              </div>
              <div style={{ fontSize: '11px', marginTop: '3px', color: 'var(--text-primary)' }}>
                {verifyResult.message}
              </div>
            </div>
          </div>

          {verifyResult.valid && (
            <button
              className="btn-primary"
              style={{ flexShrink: 0 }}
              onClick={() => {
                investigateAccount(selectedAccountId || 'ACC_HERO_MULE_L2_CONVERGE');
              }}
            >
              <span>Inspect Account Dossier</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* Forensic Scope Explanation */}
      <div style={{ padding: '10px 14px', background: 'rgba(8, 10, 15, 0.75)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(117, 150, 200, 0.16)', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Lock size={13} color="var(--accent-gold)" />
        <span>
          <strong>Forensic Scope Principle:</strong> Cryptographic integrity verification mathematically confirms that recorded parent-child hash links are unbroken and immutable post-issuance; it does <em>not</em> establish whether the underlying financial transaction was legally authorized or fraudulent.
        </span>
      </div>

      {/* Non-Destructive Tamper Simulation Banner */}
      {tamperResult && (
        <div
          className="hud-panel stagger-in"
          style={{
            padding: '14px 18px',
            background: 'rgba(224, 82, 82, 0.12)',
            border: '1px solid var(--alert-critical)',
            borderLeft: '4px solid var(--alert-critical)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: 'var(--alert-critical)', letterSpacing: '0.05em' }}>
            <AlertOctagon size={16} />
            <span>NON-DESTRUCTIVE TAMPER TEST REPORT (IN-MEMORY CLONE)</span>
          </div>
          <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-primary)' }}>
            {tamperResult.message}
          </div>
          <div className="font-mono tabular-nums" style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)' }}>
            Tampered Event: <strong style={{ color: 'var(--alert-critical)' }}>{tamperResult.tampered_event_id}</strong> | Mutated Value: ₹{tamperResult.original_amount.toLocaleString()} → <strong style={{ color: 'var(--alert-critical)' }}>₹{tamperResult.tampered_amount.toLocaleString()}</strong> | Broken Link: {tamperResult.broken_link_reported}
          </div>
        </div>
      )}

      {/* Directed Transfer Sequence Visualizer */}
      <div className="hud-panel" style={{ padding: '16px 20px' }}>
        <div className="card-header">
          <span className="card-title">
            <Share2 size={13} color="var(--accent-gold)" />
            DIRECTED PROVENANCE TRANSFER GRAPH
          </span>
          <span className="table-count font-mono">{events.length} sequential blocks</span>
        </div>

        {/* Horizontal Visual Pipeline Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', padding: '12px 0 16px 0' }}>
          {events.map((evt, idx) => {
            const isTampered = tamperResult?.tampered_event_id === evt.event_id;
            return (
              <React.Fragment key={evt.event_id}>
                <div
                  className="clickable-card"
                  style={{
                    background: isTampered ? 'rgba(224, 82, 82, 0.15)' : 'rgba(21, 27, 39, 0.95)',
                    border: isTampered ? '1px solid var(--alert-critical)' : '1px solid rgba(117, 150, 200, 0.2)',
                    borderRadius: 'var(--radius-xs)',
                    padding: '8px 12px',
                    minWidth: '180px',
                    flexShrink: 0
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span className={`tech-tag ${isTampered ? 'critical' : 'gold'}`} style={{ fontSize: '9px' }}>
                      HOP #{evt.sequence_index} {isTampered && '(!)'}
                    </span>
                    <span className="font-mono tabular-nums" style={{ fontSize: '11px', color: isTampered ? 'var(--alert-critical)' : 'var(--accent-gold)', fontWeight: 600 }}>
                      ₹{evt.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {evt.source_account_id.replace('ACC_HERO_', '')} → {evt.destination_account_id.replace('ACC_HERO_', '')}
                  </div>
                </div>
                {idx < events.length - 1 && (
                  <ArrowRight size={14} color={isTampered ? 'var(--alert-critical)' : 'var(--accent-gold)'} style={{ flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Chronological Cryptographic Ledger Block Sequence */}
      <div className="hud-panel" style={{ padding: '16px 20px' }}>
        <div className="card-header">
          <span className="card-title">
            <Link2 size={13} color="var(--steel-blue)" />
            CRYPTOGRAPHIC LEDGER BLOCK CHRONOLOGY
          </span>
          <span className="table-count font-mono">Immutable Audit Chain</span>
        </div>

        {loading ? (
          <div style={{ padding: '16px 0' }}>
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : events.length === 0 ? (
          <div className="state-empty">
            <p style={{ fontSize: '11px' }}>No lineage records found for token {tokenId}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {events.map((evt, idx) => {
              const isTampered = tamperResult?.tampered_event_id === evt.event_id;
              const staggerClass = idx < 6 ? `stagger-${idx + 1}` : '';
              return (
                <div
                  key={evt.event_id}
                  className={`stagger-in ${staggerClass}`}
                  style={{
                    background: isTampered ? 'rgba(42, 23, 25, 0.95)' : 'rgba(21, 27, 39, 0.95)',
                    border: isTampered ? '1px solid var(--alert-critical)' : '1px solid rgba(117, 150, 200, 0.16)',
                    borderLeft: `4px solid ${isTampered ? 'var(--alert-critical)' : 'var(--accent-gold)'}`,
                    borderRadius: 'var(--radius-xs)',
                    padding: '12px 16px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${isTampered ? 'badge-critical' : 'badge-gold'}`}>
                        BLOCK #{evt.sequence_index} {isTampered && 'TAMPER TARGET'}
                      </span>
                      <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {evt.event_id}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-muted" style={{ fontSize: '10px' }}>
                      {evt.timestamp.replace('T', ' ').substring(0, 19)} UTC
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px', marginBottom: '10px' }}>
                    <div>
                      <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>DEBIT ACCOUNT</span>
                      <button
                        className="font-mono"
                        style={{ background: 'none', border: 'none', color: 'var(--steel-blue)', cursor: 'pointer', padding: 0, fontSize: '11px' }}
                        onClick={() => investigateAccount(evt.source_account_id)}
                        title="Inspect Source Account"
                      >
                        {evt.source_account_id}
                      </button>
                    </div>

                    <div>
                      <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>CREDIT ACCOUNT</span>
                      <button
                        className="font-mono"
                        style={{ background: 'none', border: 'none', color: 'var(--steel-blue)', cursor: 'pointer', padding: 0, fontSize: '11px' }}
                        onClick={() => investigateAccount(evt.destination_account_id)}
                        title="Inspect Destination Account"
                      >
                        {evt.destination_account_id}
                      </button>
                    </div>

                    <div>
                      <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>SETTLEMENT VOLUME</span>
                      <span className="font-mono tabular-nums" style={{ fontWeight: 600, color: isTampered ? 'var(--alert-critical)' : 'var(--accent-gold)', fontSize: '12px' }}>
                        ₹{evt.amount.toLocaleString()} e-INR
                      </span>
                    </div>
                  </div>

                  {/* Hashes in Mono Container */}
                  <div style={{ background: 'var(--bg-obsidian)', padding: '8px 12px', borderRadius: 'var(--radius-xs)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid rgba(42, 52, 68, 0.4)' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="text-muted font-mono" style={{ width: '90px', flexShrink: 0, fontSize: '10px' }}>PREV HASH:</span>
                      <span className="font-mono text-muted" style={{ wordBreak: 'break-all', fontSize: '10px', flex: 1 }}>
                        {evt.prev_hash}
                      </span>
                      <button
                        type="button"
                        className={`copy-pill ${copiedHash === evt.prev_hash ? 'copied-success' : ''}`}
                        onClick={() => handleCopy(evt.prev_hash)}
                      >
                        {copiedHash === evt.prev_hash ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span className="text-muted font-mono" style={{ width: '90px', flexShrink: 0, fontSize: '10px' }}>CURR HASH:</span>
                      <span className="font-mono text-cyan" style={{ wordBreak: 'break-all', fontSize: '10px', flex: 1 }}>
                        {evt.current_hash}
                      </span>
                      <button
                        type="button"
                        className={`copy-pill ${copiedHash === evt.current_hash ? 'copied-success' : ''}`}
                        onClick={() => handleCopy(evt.current_hash)}
                      >
                        {copiedHash === evt.current_hash ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
