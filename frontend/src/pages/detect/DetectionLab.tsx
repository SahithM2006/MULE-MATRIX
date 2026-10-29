import React, { useEffect, useState } from 'react';
import {
  Cpu,
  AlertTriangle,
  ShieldAlert,
  Network,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Search,
  Lock,
  GitBranch,
  BarChart3,
  Sliders,
  Scale
} from 'lucide-react';
import { api } from '../../api/client';
import { AccountDossier, AlertSignal } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';
import { ContextualGuidancePanel } from '../../components/ContextualGuidancePanel';

export const DetectionLab: React.FC = () => {
  const {
    selectedAccountId,
    setSelectedAccountId,
    selectedTokenId,
    traceToken,
    openCase,
    setSelectedCaseId,
    navigateToModule,
    setMilestoneCompleted
  } = useInvestigation();
  const [accountId, setAccountId] = useState(selectedAccountId || 'ACC_HERO_MULE_L2_CONVERGE');
  const [dossier, setDossier] = useState<AccountDossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingCase, setCreatingCase] = useState(false);

  // Expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sliding: true,
    features: true,
    rules: true,
    iforest: true,
    graphsage: true,
    louvain: true
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadDossier = async (accIdToLoad: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAccountDossier(accIdToLoad);
      setDossier(data);
      setMilestoneCompleted('dossierInspected', {
        riskScore: data.aggregate_risk_score,
        alertReason: data.primary_reason
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load account detection dossier.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCaseFromDossier = async () => {
    if (!dossier) return;
    setCreatingCase(true);
    try {
      const alertIds = (dossier.active_alerts || []).map((a) => a.alert_id);
      const newCase = await api.createCase({
        title: `Mule Investigation - ${dossier.account.account_id} (${dossier.severity})`,
        severity: dossier.severity,
        suspect_account_id: dossier.account.account_id,
        initial_note: `Multi-engine forensic detection score ${dossier.aggregate_risk_score.toFixed(1)}/100. Primary verdict: ${dossier.primary_reason}. Isolation Forest: ${dossier.isolation_forest?.anomaly_score?.toFixed(3) || 'N/A'}. GraphSAGE: ${dossier.graphsage?.status || 'N/A'}.`,
        alert_ids: alertIds
      });
      setSelectedCaseId(newCase.case_id);
      setMilestoneCompleted('caseCreated', {
        caseNumber: newCase.case_number,
        riskScore: dossier.aggregate_risk_score
      });
      openCase(newCase.case_id);
    } catch (err: any) {
      alert(`Case creation failed: ${err.message}`);
    } finally {
      setCreatingCase(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) {
      setAccountId(selectedAccountId);
      loadDossier(selectedAccountId);
    } else {
      loadDossier(accountId);
    }
  }, [selectedAccountId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountId.trim()) {
      setSelectedAccountId(accountId.trim());
      loadDossier(accountId.trim());
    }
  };

  // SVG Gauge calculations
  const riskScore = dossier?.aggregate_risk_score || 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;
  const gaugeColor = riskScore >= 80 ? 'var(--alert-critical)' : riskScore >= 50 ? 'var(--accent-gold)' : 'var(--alert-success)';

  return (
    <div className="threat-stream-page">
      {/* Stream Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <Cpu size={13} />
            <span>STAGE 03 // MULTI-ENGINE DETECTION DOSSIER</span>
          </div>
          <h2>Detection Lab & Unified Threat Synthesis</h2>
          <p className="stream-description">
            Algorithmic deep-dive combining high-velocity temporal sliding windows, 11-dimensional graph topology features, Isolation Forest anomaly trees, and inductive GraphSAGE GNN embeddings.
          </p>
        </div>

        <div className="stream-controls">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <div className="search-input-wrap">
              <Search size={13} className="search-icon" />
              <input
                type="text"
                className="filter-input"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="e.g. ACC_HERO_MULE_L2_CONVERGE"
                style={{ width: '270px' }}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ height: '32px' }}>
              Inspect Dossier
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="state-loading">
          <div className="state-loading-spinner" />
          <p style={{ fontSize: '11px' }}>Executing multi-engine detection synthesis across ledger records...</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Persistent Contextual Investigation Guidance */}
      <ContextualGuidancePanel />

      {dossier && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Executive Unified Risk Dossier HUD */}
          <div
            className="hud-panel"
            style={{
              borderLeft: `4px solid ${gaugeColor}`,
              padding: '20px 24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              {/* Target Metadata */}
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="tech-tag gold" style={{ fontSize: '9px' }}>INVESTIGATION TARGET</span>
                  <span className="tech-tag" style={{ fontSize: '9px' }}>ROUTING: {dossier.account.account_number}</span>
                </div>
                <h2 className="font-mono tabular-nums" style={{ fontSize: '22px', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {dossier.account.account_id}
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>Classification: <strong style={{ color: 'var(--text-primary)' }}>{dossier.account.account_type?.toUpperCase()}</strong></span>
                  <span>•</span>
                  <span>KYC Baseline: <strong className="font-mono" style={{ color: 'var(--accent-gold)' }}>{(dossier.account.kyc_risk_score * 100).toFixed(0)}%</strong></span>
                  <span>•</span>
                  <span>
                    Community:{' '}
                    <button
                      type="button"
                      className="font-mono"
                      style={{
                        background: 'rgba(0, 210, 255, 0.1)',
                        border: '1px solid rgba(0, 210, 255, 0.3)',
                        borderRadius: '2px',
                        color: '#00D2FF',
                        padding: '1px 6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        transition: 'all 0.15s ease'
                      }}
                      onClick={() => {
                        setSelectedAccountId(dossier.account.account_id);
                        navigateToModule('TRACE', 'attack-graph');
                      }}
                      title="Inspect Community in Attack Graph"
                    >
                      Cluster #{dossier.louvain_community?.community_id ?? 1} ↗
                    </button>
                  </span>
                </div>
              </div>

              {/* Radial Composite Score Dial */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="90" height="90" viewBox="0 0 90 90">
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      fill="transparent"
                      stroke="rgba(117, 150, 200, 0.15)"
                      strokeWidth="6"
                    />
                    <circle
                      cx="45"
                      cy="45"
                      r={radius}
                      fill="transparent"
                      stroke={gaugeColor}
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 45 45)"
                      style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', textAlign: 'center' }}>
                    <div className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {riskScore.toFixed(0)}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      /100
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className={`badge ${dossier.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                    {dossier.severity} THREAT
                  </span>
                  <span className="font-mono text-muted" style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="radar-dot" style={{ width: '6px', height: '6px' }} />
                    TRIAGED & SCORED
                  </span>
                </div>
              </div>
            </div>

            {/* Plain-English Forensic Verdict */}
            <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--bg-obsidian)', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(117, 150, 200, 0.16)' }}>
              <span className="detail-label" style={{ display: 'block', color: 'var(--accent-gold)', marginBottom: '3px', fontSize: '9px' }}>
                FORENSIC INVESTIGATIVE VERDICT
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                {dossier.primary_reason}
              </p>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(117, 150, 200, 0.12)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Cpu size={12} color="var(--steel-blue)" />
                <span>
                  <strong>Investigative Signal Principle:</strong> An elevated anomaly score or triggered rule is an indicator for human forensic review, not autonomous proof of guilt. Multiple corroborating signals support case referral.
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={handleCreateCaseFromDossier}
                disabled={creatingCase || !dossier}
                style={{ background: 'linear-gradient(135deg, var(--accent-gold) 0%, #A8863A 100%)', color: '#000', fontWeight: 700 }}
              >
                <ShieldAlert size={13} />
                <span>{creatingCase ? 'Creating Case...' : 'Create Incident Case from Evidence →'}</span>
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedAccountId(dossier.account.account_id);
                  navigateToModule('TRACE', 'attack-graph');
                }}
              >
                <Network size={13} />
                <span>Trace in Attack Graph</span>
              </button>

              <button
                className="btn-action"
                onClick={() => {
                  if (selectedTokenId) {
                    traceToken(selectedTokenId);
                  } else {
                    navigateToModule('TRACE', 'token-forensics');
                  }
                }}
              >
                <Lock size={12} />
                <span>Verify Token Lineage</span>
              </button>
            </div>
          </div>

          {/* Contributing Multi-Signal Breakdown Table */}
          <div className="hud-panel" style={{ padding: '16px 20px' }}>
            <div className="card-header">
              <span className="card-title">
                <BarChart3 size={13} color="var(--accent-gold)" />
                CONTRIBUTING ALGORITHM WEIGHT MATRIX
              </span>
              <span className="table-count font-mono">{(dossier.signals || []).length} active signals</span>
            </div>

            <div className="table-wrap">
              <table className="stream-table">
                <thead>
                  <tr>
                    <th>SIGNAL / ENGINE</th>
                    <th>DETECTION ENGINE</th>
                    <th style={{ width: '220px' }}>CONTRIBUTION WEIGHT</th>
                    <th>TRIGGERED FORENSIC RATIONALE</th>
                  </tr>
                </thead>
                <tbody>
                  {(dossier.signals || []).map((sig: AlertSignal, idx: number) => {
                    const pct = Math.min(100, Math.max(0, sig.contribution_weight * 100));
                    const staggerClass = idx < 6 ? `stagger-${idx + 1}` : '';
                    return (
                      <tr key={idx} className={`stagger-in ${staggerClass}`}>
                        <td className="font-mono text-cyan" style={{ fontWeight: 600 }}>
                          {sig.rule_or_model}
                        </td>
                        <td>
                          <span className="badge badge-info">{sig.rule_or_model.startsWith('RULE') ? 'HEURISTIC RULE' : 'ANOMALY / ML ENGINE'}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                              <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{pct.toFixed(1)}%</span>
                              <span style={{ color: 'var(--text-muted)' }}>score: {sig.normalized_score.toFixed(0)}</span>
                            </div>
                            <div className="score-track">
                              <div
                                className="score-fill"
                                style={{
                                  width: `${pct}%`,
                                  background: sig.normalized_score >= 80 ? 'var(--alert-critical)' : 'linear-gradient(90deg, var(--steel-blue), var(--accent-gold))'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{sig.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Algorithm Technical Workspaces (2x2 Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* 1. Sliding Window Analyzer */}
            {(() => {
              const win10m = dossier.sliding_window_analysis?.['10_min'] || Object.values(dossier.sliding_window_analysis || {})[0];
              return (
                <div className="hud-panel" style={{ padding: '16px 20px' }}>
                  <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection('sliding')}>
                    <span className="card-title">
                      <Activity size={13} color="var(--accent-gold)" />
                      1. SLIDING-WINDOW VELOCITY ANALYSIS (10-MIN)
                    </span>
                    {expandedSections.sliding ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </div>

                  {expandedSections.sliding && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div className="detail-field">
                        <span className="detail-label">10-MIN BURST ACTIVITY</span>
                        <span className="font-mono detail-value tabular-nums text-cyan">
                          {win10m?.burst_score ? win10m.burst_score.toFixed(1) : (win10m?.tx_count || 0)} txs
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">RAPID PASS-THROUGH</span>
                        <span className={`badge ${win10m?.rapid_passthrough_detected ? 'badge-critical' : 'badge-low'}`}>
                          {win10m?.rapid_passthrough_detected ? 'DETECTED' : 'NORMAL'}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">MEDIAN DWELL DELTA</span>
                        <span className="font-mono detail-value tabular-nums">
                          {win10m?.median_passthrough_delay_seconds
                            ? `${(win10m.median_passthrough_delay_seconds / 60).toFixed(1)} mins`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">PASS-THROUGH CONVERGENCE</span>
                        <span className="font-mono detail-value tabular-nums" style={{ color: 'var(--accent-gold)' }}>
                          {((win10m?.passthrough_ratio || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 2. Graph Neural Network (GraphSAGE) */}
            <div className="hud-panel" style={{ padding: '16px 20px' }}>
              <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection('graphsage')}>
                <span className="card-title">
                  <Cpu size={13} color="var(--alert-critical)" />
                  8. GRAPHSAGE INDUCTIVE GNN CLASSIFIER
                </span>
                {expandedSections.graphsage ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>

              {expandedSections.graphsage && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div className="detail-field">
                    <span className="detail-label">KERNEL STATUS</span>
                    <span className={`badge ${dossier.graphsage?.status === 'READY' ? 'badge-low' : 'badge-info'}`}>
                      {dossier.graphsage?.status || 'AWAITING_TRAINING'}
                    </span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">MULE RING PROBABILITY</span>
                    <span className="font-mono detail-value tabular-nums text-cyan" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {dossier.graphsage?.mule_probability !== null && dossier.graphsage?.mule_probability !== undefined
                        ? `${(dossier.graphsage.mule_probability * 100).toFixed(1)}%`
                        : 'NOT_TRAINED'}
                    </span>
                  </div>
                  <div className="detail-field" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">MODEL TOPOLOGY</span>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Version: {dossier.graphsage?.model_version || 'GraphSAGE-v1'} | Validation F1: {dossier.graphsage?.validation_f1 ? (dossier.graphsage.validation_f1 * 100).toFixed(1) + '%' : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Isolation Forest Perturbations */}
            <div className="hud-panel" style={{ padding: '16px 20px' }}>
              <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection('iforest')}>
                <span className="card-title">
                  <ShieldAlert size={13} color="var(--alert-high)" />
                  6. ISOLATION FOREST ANOMALIES
                </span>
                {expandedSections.iforest ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>

              {expandedSections.iforest && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="text-muted" style={{ fontSize: '11px' }}>Normalized Anomaly Score:</span>
                    <span className="font-mono tabular-nums" style={{ fontWeight: 700, color: 'var(--alert-high)' }}>
                      {dossier.isolation_forest?.anomaly_score?.toFixed(3) || '0.000'}
                    </span>
                  </div>

                  <span className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>FEATURE DEVIATION VS COHORT MEDIAN</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(dossier.isolation_forest?.top_contributing_features || []).map((feat, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', background: 'var(--bg-obsidian)', padding: '5px 8px', borderRadius: '2px' }}>
                        <span className="font-mono text-cyan">{feat.feature_name}</span>
                        <span className="font-mono tabular-nums text-muted">
                          val: {feat.account_value.toFixed(1)} (med: {feat.reference_median.toFixed(1)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Tabular Graph Feature Metrics */}
            <div className="hud-panel" style={{ padding: '16px 20px' }}>
              <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => toggleSection('features')}>
                <span className="card-title">
                  <Layers size={13} color="var(--steel-blue)" />
                  4. TABULAR GRAPH TOPOLOGY (11 FEATURES)
                </span>
                {expandedSections.features ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </div>

              {expandedSections.features && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11px' }}>
                  <div className="detail-field">
                    <span className="detail-label">IN-DEGREE</span>
                    <span className="font-mono detail-value tabular-nums">{dossier.graph_features?.in_degree ?? 0}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">OUT-DEGREE</span>
                    <span className="font-mono detail-value tabular-nums">{dossier.graph_features?.out_degree ?? 0}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">DEGREE RATIO</span>
                    <span className="font-mono detail-value tabular-nums">{(dossier.graph_features?.degree_ratio ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">INFLOW VOLUME</span>
                    <span className="font-mono detail-value tabular-nums">₹{(((dossier.graph_features?.weighted_inflow ?? 0)) / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">OUTFLOW VOLUME</span>
                    <span className="font-mono detail-value tabular-nums">₹{(((dossier.graph_features?.weighted_outflow ?? 0)) / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="detail-field">
                    <span className="detail-label">CLUSTERING</span>
                    <span className="font-mono detail-value tabular-nums">{(dossier.graph_features?.clustering_coefficient ?? 0).toFixed(3)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
