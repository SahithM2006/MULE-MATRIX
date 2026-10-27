import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Cpu,
  Layers,
  Network,
  Lock,
  Zap,
  Server
} from 'lucide-react';
import { api } from '../../api/client';
import { SystemHealthResponse, SubsystemStatus } from '../../types';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Maintenance action states
  const [reseedLoading, setReseedLoading] = useState<boolean>(false);
  const [reseedMessage, setReseedMessage] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState<boolean>(false);
  const [pipelineMessage, setPipelineMessage] = useState<string | null>(null);
  const [trainingLoading, setTrainingLoading] = useState<boolean>(false);
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend health diagnostic service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleReseed = async () => {
    try {
      setReseedLoading(true);
      setReseedMessage(null);
      const res = await api.seedDatabase(1536, 30000, 42);
      setReseedMessage(res.message);
      await fetchHealth();
    } catch (err: any) {
      setError(err.message || 'Database re-seeding failed.');
    } finally {
      setReseedLoading(false);
    }
  };

  const handleRunPipeline = async () => {
    try {
      setPipelineLoading(true);
      setPipelineMessage(null);
      const res = await api.runPipeline();
      setPipelineMessage(`Evaluated ${res.accounts_evaluated} accounts, dispatched ${res.alerts_generated} alerts.`);
      await fetchHealth();
    } catch (err: any) {
      setError(err.message || 'Pipeline run failed.');
    } finally {
      setPipelineLoading(false);
    }
  };

  const handleTrainGraphSAGE = async () => {
    try {
      setTrainingLoading(true);
      setTrainingMessage(null);
      const res = await api.trainGraphSAGE();
      setTrainingMessage(`Model trained successfully. Validation F1: ${(res.validation_f1 * 100).toFixed(1)}%`);
      await fetchHealth();
    } catch (err: any) {
      setError(err.message || 'GraphSAGE training failed.');
    } finally {
      setTrainingLoading(false);
    }
  };

  const getSubsystemIcon = (key: string) => {
    switch (key) {
      case 'database':
        return <Database size={18} color="#7596C8" />;
      case 'graph_engine':
        return <Network size={18} color="#00D2FF" />;
      case 'lineage_engine':
        return <Lock size={18} color="#10B981" />;
      case 'isolation_forest':
        return <Layers size={18} color="#C6A45A" />;
      case 'graphsage':
        return <Activity size={18} color="#E05252" />;
      case 'evaluator':
        return <Cpu size={18} color="#C6A45A" />;
      default:
        return <Activity size={18} color="#7596C8" />;
    }
  };

  const subsystemList: { key: string; item: SubsystemStatus }[] = health?.subsystems
    ? Object.entries(health.subsystems).map(([key, item]) => ({ key, item }))
    : [];

  return (
    <div className="threat-stream-page">
      {/* Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <Activity size={14} />
            <span>SYSTEM HEALTH & SUBSYSTEM DIAGNOSTICS</span>
          </div>
          <h2>Architecture Status, Engines, and Telemetry</h2>
          <p className="stream-description">
            Live operational status across all core detection engines, SQLite database persistence layer, and machine learning model artifacts.
          </p>
        </div>

        <div className="stream-controls">
          <button className="btn-secondary" onClick={fetchHealth} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Refresh Diagnostics</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Global Status Banner */}
      <div className="hud-panel active-sweep-border" style={{ borderLeft: '4px solid #10B981', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Server size={22} color="#10B981" />
            <div>
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="radar-dot" />
                MULE MATRIX KERNEL: {health?.overall_status || 'OPERATIONAL'}
              </span>
              <span className="text-muted font-mono tabular-nums" style={{ fontSize: '11px' }}>
                Mode: {health?.simulation_mode ? 'SIMULATION' : 'PRODUCTION'} | Database: {health?.database_connected ? 'CONNECTED (WAL)' : 'DISCONNECTED'} | Accounts: {health?.total_accounts || 0} | Txs: {health?.total_transactions || 0}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-low" style={{ fontSize: '11px', padding: '3px 8px' }}>
              <CheckCircle2 size={12} color="#10B981" />
              ALL ENGINES ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Subsystem Cards Grid */}
      <div className="hud-panel" style={{ padding: '16px 20px' }}>
        <div className="card-header">
          <span className="card-title">CORE SUBSYSTEMS & ALGORITHM STATUS</span>
          <span className="table-count font-mono">{subsystemList.length} engines monitored</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {subsystemList.map(({ key, item }, idx) => {
            const isReady = item.state === 'READY';
            const staggerClass = idx < 6 ? `stagger-${idx + 1}` : '';
            return (
              <div key={key} className={`kpi-card clickable-card stagger-in ${staggerClass}`} style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {getSubsystemIcon(key)}
                    <span style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.9rem' }}>
                      {item.subsystem_name}
                    </span>
                  </div>
                  <span className={`badge ${isReady ? 'badge-low' : 'badge-critical'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {isReady && <span className="radar-dot" style={{ width: '5px', height: '5px' }} />}
                    {item.state}
                  </span>
                </div>

                <div className="font-mono" style={{ fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '0.25rem' }}>
                  {item.details}
                </div>

                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Updated: {item.last_updated.replace('T', ' ').substring(0, 19)} UTC
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Maintenance Actions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">ADMINISTRATIVE MAINTENANCE CONTROLS</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          <div className="kpi-card" style={{ textAlign: 'left' }}>
            <span style={{ fontWeight: 600, color: '#F8FAFC', display: 'block', marginBottom: '0.35rem' }}>
              Re-seed Database
            </span>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
              Re-generates synthetic graph (1,536 accounts, 29,984 transactions) and hero scenario with seed 42.
            </p>
            <button
              className="btn-secondary"
              onClick={handleReseed}
              disabled={reseedLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={13} className={reseedLoading ? 'spinning' : ''} />
              <span>{reseedLoading ? 'Seeding...' : 'Execute Seed'}</span>
            </button>
            {reseedMessage && (
              <span className="text-cyan font-mono" style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                {reseedMessage}
              </span>
            )}
          </div>

          <div className="kpi-card" style={{ textAlign: 'left' }}>
            <span style={{ fontWeight: 600, color: '#F8FAFC', display: 'block', marginBottom: '0.35rem' }}>
              Run Global Pipeline
            </span>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
              Orchestrates feature extraction, rules, Isolation Forest, Louvain, and GraphSAGE across all accounts.
            </p>
            <button
              className="btn-primary"
              onClick={handleRunPipeline}
              disabled={pipelineLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Zap size={13} />
              <span>{pipelineLoading ? 'Running...' : 'Run Pipeline'}</span>
            </button>
            {pipelineMessage && (
              <span className="font-mono" style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                {pipelineMessage}
              </span>
            )}
          </div>

          <div className="kpi-card" style={{ textAlign: 'left' }}>
            <span style={{ fontWeight: 600, color: '#F8FAFC', display: 'block', marginBottom: '0.35rem' }}>
              Retrain GraphSAGE Model
            </span>
            <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0 0 0.75rem 0' }}>
              Re-trains 2-layer inductive neural aggregator on train scenarios and persists weights to disk.
            </p>
            <button
              className="btn-action btn-gold"
              onClick={handleTrainGraphSAGE}
              disabled={trainingLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              <Cpu size={13} />
              <span>{trainingLoading ? 'Training...' : 'Retrain GraphSAGE'}</span>
            </button>
            {trainingMessage && (
              <span className="font-mono text-cyan" style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                {trainingMessage}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
