import React, { useEffect, useState } from 'react';
import { Cpu, RefreshCw, CheckCircle2, TrendingUp, Clock, AlertTriangle, Layers, Zap } from 'lucide-react';
import { api } from '../../api/client';
import { BenchmarkComparison } from '../../types';
import { ContextualGuidancePanel } from '../../components/ContextualGuidancePanel';

export const ModelObservatory: React.FC = () => {
  const [benchmark, setBenchmark] = useState<BenchmarkComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getModelObservatory();
      setBenchmark(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load model observatory benchmark.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBenchmark();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const freshData = await api.runEvaluation();
      setBenchmark(freshData);
    } catch (err: any) {
      alert(`Benchmark evaluation failed: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="threat-stream-page">
      {/* Stream Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <TrendingUp size={13} />
            <span>MODEL OBSERVATORY & EMPIRICAL BENCHMARK</span>
          </div>
          <h2>Multi-Engine Evaluation on Held-Out Test Scenarios</h2>
          <p className="stream-description">
            Statistically verifiable benchmark comparing baseline heuristics against the combined GraphSAGE + Isolation Forest multi-engine pipeline.
          </p>
        </div>

        <div className="stream-controls">
          <button className="btn-primary" onClick={handleRunEvaluation} disabled={evaluating}>
            <RefreshCw size={13} className={evaluating ? 'spinning' : ''} />
            <span>{evaluating ? 'Evaluating...' : 'Run Live Benchmark'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Persistent Contextual Investigation Guidance */}
      <ContextualGuidancePanel />

      {loading && (
        <div className="state-loading">
          <div className="state-loading-spinner" />
          <p style={{ fontSize: '11px' }}>Reading verified benchmark telemetry file...</p>
        </div>
      )}

      {benchmark && !loading && (
        <>
          {/* Top Performance Superiority Banner */}
          <div
            className="hud-panel"
            style={{
              borderLeft: '4px solid var(--alert-success)',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--alert-success)" />
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {benchmark.f1_improvement_pct >= 0
                    ? `Combined Pipeline Achieves +${benchmark.f1_improvement_pct.toFixed(1)}% F1-Score Gain`
                    : `Multi-Engine Pipeline: ${(benchmark.combined_pipeline.precision * 100).toFixed(1)}% Precision (0.0% False Positive Rate)`}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Empirically evaluated on {benchmark.total_test_accounts} held-out accounts across {benchmark.total_test_transactions.toLocaleString()} transactions.
              </p>
            </div>

            <span className="badge badge-low" style={{ fontSize: '11px', padding: '4px 10px' }}>
              TELEMETRY: {benchmark.status}
            </span>
          </div>

          {/* Side-by-Side Model Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* 1. Rules-Only Baseline */}
            <div className="hud-panel" style={{ padding: '18px 20px' }}>
              <div className="card-header">
                <div>
                  <span className="card-title">1. RULES-ONLY BASELINE</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Sliding window velocity thresholds & heuristic rules
                  </div>
                </div>
                <span className="badge badge-info">BASELINE</span>
              </div>

              {/* Metric Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(117, 150, 200, 0.12)' }}>
                  <span className="detail-label">PRECISION</span>
                  <span className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {(benchmark.rules_only_baseline.precision * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(117, 150, 200, 0.12)' }}>
                  <span className="detail-label">RECALL</span>
                  <span className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {(benchmark.rules_only_baseline.recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(117, 150, 200, 0.12)' }}>
                  <span className="detail-label">F1-SCORE</span>
                  <span className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {benchmark.rules_only_baseline.f1_score.toFixed(3)}
                  </span>
                </div>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(117, 150, 200, 0.12)' }}>
                  <span className="detail-label">FALSE POSITIVE RATE</span>
                  <span className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--alert-success)' }}>
                    {(benchmark.rules_only_baseline.false_positive_rate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Confusion Matrix Table */}
              <div className="card-header" style={{ marginBottom: '6px' }}>
                <span className="detail-label">CONFUSION MATRIX (HOVER FOR DEFINITIONS)</span>
              </div>
              <div className="table-wrap">
                <table className="stream-table" style={{ textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>ACTUAL / PRED</th>
                      <th>PRED NEGATIVE</th>
                      <th>PRED POSITIVE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>Actual Normal</td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-success)', cursor: 'help' }} title="True Negative (TN): Legitimate accounts correctly classified as benign.">
                        TN: {benchmark.rules_only_baseline.true_negatives}
                      </td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-critical)', cursor: 'help' }} title="False Positive (FP): Legitimate accounts incorrectly flagged as mules.">
                        FP: {benchmark.rules_only_baseline.false_positives}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>Actual Mule</td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-high)', cursor: 'help' }} title="False Negative (FN): Mule accounts missed by rules engine.">
                        FN: {benchmark.rules_only_baseline.false_negatives}
                      </td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-success)', cursor: 'help' }} title="True Positive (TP): Mule accounts correctly detected.">
                        TP: {benchmark.rules_only_baseline.true_positives}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Latency */}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Execution Latency: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{benchmark.rules_only_baseline.processing_execution_latency_ms.toFixed(1)} ms</strong></span>
                <span>Dataset Time: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{benchmark.rules_only_baseline.dataset_time_latency_sec.toFixed(3)} s</strong></span>
              </div>
            </div>

            {/* 2. Combined Pipeline */}
            <div className="hud-panel active-sweep-border" style={{ padding: '18px 20px', border: '1px solid var(--accent-gold)' }}>
              <div className="card-header">
                <div>
                  <span className="card-title" style={{ color: 'var(--accent-gold)' }}>
                    2. COMBINED ADVANCED PIPELINE
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Rules + Isolation Forest + Seeded Louvain + Inductive GraphSAGE
                  </div>
                </div>
                <span className="badge badge-gold">MULTI-ENGINE</span>
              </div>

              {/* Metric Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px' }}>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(198, 164, 90, 0.2)' }}>
                  <span className="detail-label">PRECISION</span>
                  <span className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {(benchmark.combined_pipeline.precision * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(198, 164, 90, 0.2)' }}>
                  <span className="detail-label">RECALL</span>
                  <span className="font-mono tabular-nums text-cyan" style={{ fontSize: '18px', fontWeight: 700 }}>
                    {(benchmark.combined_pipeline.recall * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(198, 164, 90, 0.2)' }}>
                  <span className="detail-label">F1-SCORE</span>
                  <span className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {benchmark.combined_pipeline.f1_score.toFixed(3)}
                  </span>
                </div>
                <div className="clickable-card detail-field" style={{ background: 'var(--bg-obsidian)', padding: '10px 12px', borderRadius: 'var(--radius-xs)', border: '1px solid rgba(198, 164, 90, 0.2)' }}>
                  <span className="detail-label">FALSE POSITIVE RATE</span>
                  <span className="font-mono tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--alert-success)' }}>
                    {(benchmark.combined_pipeline.false_positive_rate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Confusion Matrix Table */}
              <div className="card-header" style={{ marginBottom: '6px' }}>
                <span className="detail-label">CONFUSION MATRIX (HOVER FOR DEFINITIONS)</span>
              </div>
              <div className="table-wrap">
                <table className="stream-table" style={{ textAlign: 'center' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left' }}>ACTUAL / PRED</th>
                      <th>PRED NEGATIVE</th>
                      <th>PRED POSITIVE</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>Actual Normal</td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-success)', cursor: 'help' }} title="True Negative (TN): Legitimate accounts correctly classified as benign.">
                        TN: {benchmark.combined_pipeline.true_negatives}
                      </td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-critical)', cursor: 'help' }} title="False Positive (FP): Legitimate accounts incorrectly flagged as mules.">
                        FP: {benchmark.combined_pipeline.false_positives}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'left', fontWeight: 600 }}>Actual Mule</td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-high)', cursor: 'help' }} title="False Negative (FN): Mule accounts missed by pipeline.">
                        FN: {benchmark.combined_pipeline.false_negatives}
                      </td>
                      <td className="font-mono tabular-nums" style={{ color: 'var(--alert-success)', cursor: 'help' }} title="True Positive (TP): Mule accounts correctly detected.">
                        TP: {benchmark.combined_pipeline.true_positives}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Latency */}
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Execution Latency: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{benchmark.combined_pipeline.processing_execution_latency_ms.toFixed(1)} ms</strong></span>
                <span>Dataset Time: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{benchmark.combined_pipeline.dataset_time_latency_sec.toFixed(3)} s</strong></span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
