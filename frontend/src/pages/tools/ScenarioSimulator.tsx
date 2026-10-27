import React, { useState } from 'react';
import {
  Sliders,
  Play,
  RotateCw,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Network
} from 'lucide-react';
import { api } from '../../api/client';
import { useInvestigation } from '../../context/InvestigationContext';

interface ScenarioArchetype {
  id: string;
  name: string;
  category: 'SUSPICIOUS' | 'LEGITIMATE';
  description: string;
  topologicalPattern: string;
  expectedRules: string[];
  riskBand: 'CRITICAL' | 'HIGH' | 'LOW';
}

export const ScenarioSimulator: React.FC = () => {
  const {
    navigateToModule,
    investigateAccount,
    setSelectedAccountId,
    setTourStepStatus,
    recordTourGeneratedData,
    isTourActive,
    currentTourStep
  } = useInvestigation();
  const [selectedScenario, setSelectedScenario] = useState<string>('smurfing');
  const [seed, setSeed] = useState<number>(101);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pipelineRunning, setPipelineRunning] = useState<boolean>(false);
  const [pipelineResult, setPipelineResult] = useState<{ status: string; accounts_evaluated: number; alerts_generated: number } | null>(null);

  const archetypes: ScenarioArchetype[] = [
    {
      id: 'smurfing',
      name: 'Smurfing / Structured Fan-In',
      category: 'SUSPICIOUS',
      description: 'Multiple low-value deposits below statutory reporting limits (e.g. ₹48,000) from distinct sources into a single aggregator account within a narrow window.',
      topologicalPattern: 'High In-Degree Fan-In Tree (N:1) with rapid consolidated outflow',
      expectedRules: ['RULE_SMURFING_FANIN', 'RULE_BURST_VELOCITY'],
      riskBand: 'CRITICAL'
    },
    {
      id: 'rapid_passthrough',
      name: 'Rapid Pass-Through Forwarding',
      category: 'SUSPICIOUS',
      description: 'Intermediate mule accounts receive substantial inflow and disburse >90% of the funds within 10 minutes to downstream hops.',
      topologicalPattern: 'Linear hop chain (1:1) with ultra-low holding time delta',
      expectedRules: ['RULE_RAPID_PASSTHROUGH', 'RULE_MULE_HOP_POSITION'],
      riskBand: 'HIGH'
    },
    {
      id: 'layering',
      name: 'Multi-Hop Layering Cascade',
      category: 'SUSPICIOUS',
      description: 'Complex multi-tier distribution routing funds across 4 to 6 intermediary accounts to dilute graph attribution and break simple proximity heuristics.',
      topologicalPattern: 'Deep directed acyclic graph (DAG) with intermediary fan-outs and fan-ins',
      expectedRules: ['RULE_MULE_HOP_POSITION', 'RULE_RAPID_PASSTHROUGH'],
      riskBand: 'HIGH'
    },
    {
      id: 'mule_ring',
      name: 'Dense Connected Mule Ring',
      category: 'SUSPICIOUS',
      description: 'A tightly coupled community of 6 to 12 synthetic accounts continuously transferring funds in cycles to manufacture legitimate transactional history.',
      topologicalPattern: 'High clustering coefficient, cyclic loops, Louvain modularity hotspot',
      expectedRules: ['RULE_BURST_VELOCITY', 'LOUVAIN_HIGH_DENSITY'],
      riskBand: 'CRITICAL'
    },
    {
      id: 'merchant_fanin',
      name: 'Legitimate E-Commerce Merchant',
      category: 'LEGITIMATE',
      description: 'Verified merchant account receiving legitimate high-volume customer checkouts with low refund outflow and high account tenure.',
      topologicalPattern: 'High In-Degree (M:1) with normal holding period and low velocity bursts',
      expectedRules: ['BENCHMARK_NEGATIVE_CONTROL'],
      riskBand: 'LOW'
    },
    {
      id: 'payroll_fanout',
      name: 'Corporate Payroll Disbursement',
      category: 'LEGITIMATE',
      description: 'Corporate payroll entity executing simultaneous scheduled disbursements to verified employee accounts on fixed bi-weekly schedules.',
      topologicalPattern: 'Star topology Fan-Out (1:M) with periodic schedule and low churn',
      expectedRules: ['BENCHMARK_NEGATIVE_CONTROL'],
      riskBand: 'LOW'
    }
  ];

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      setError(null);
      if (isTourActive && currentTourStep === 2) {
        setTourStepStatus('action_in_progress');
      }
      const res = await api.simulateScenario(selectedScenario, seed);
      setSimulationResult(res);

      if (res.accounts_generated && res.accounts_generated.length > 0) {
        const topAccount = res.accounts_generated[0];
        setSelectedAccountId(topAccount);
        recordTourGeneratedData({
          accountId: topAccount,
          scenarioType: res.scenario_type,
          alertId: res.alerts_triggered?.[0]?.alert_id
        });
      }

      if (isTourActive && currentTourStep === 2) {
        setTourStepStatus('action_completed');
      }
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed.');
      if (isTourActive && currentTourStep === 2) {
        setTourStepStatus('error', err.message || 'Simulation execution failed.');
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleRunPipeline = async () => {
    try {
      setPipelineRunning(true);
      setError(null);
      const res = await api.runPipeline();
      setPipelineResult(res);
    } catch (err: any) {
      setError(err.message || 'Pipeline evaluation run failed.');
    } finally {
      setPipelineRunning(false);
    }
  };

  const activeArchetype = archetypes.find((a) => a.id === selectedScenario);

  return (
    <div className="threat-stream-page">
      {/* Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <Sliders size={13} />
            <span>SYNTHETIC SCENARIO SIMULATOR</span>
          </div>
          <h2>Fraud Archetype Generation and Validation Lab</h2>
          <p className="stream-description">
            Generate controlled, deterministic synthetic financial topologies to stress-test sliding windows, graph heuristics, and GraphSAGE neural inductive classification.
          </p>
        </div>

        <div className="stream-controls">
          <button
            className="btn-primary"
            onClick={handleRunPipeline}
            disabled={pipelineRunning}
          >
            <Zap size={13} />
            <span>{pipelineRunning ? 'Evaluating Pipeline...' : 'Run Global Pipeline'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {pipelineResult && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--alert-success-dim)',
            border: '1px solid var(--alert-success)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--alert-success)',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} />
            <span>
              Pipeline completed: <strong>{pipelineResult.accounts_evaluated}</strong> accounts evaluated, <strong>{pipelineResult.alerts_generated}</strong> high-risk alerts generated.
            </span>
          </div>
          <button
            className="btn-action"
            onClick={() => navigateToModule('RESPOND', 'incident-response')}
            style={{ color: '#10B981', borderColor: '#10B981' }}
          >
            Inspect Alerts
          </button>
        </div>
      )}

      {/* Simulator Control Panel */}
      <div className="hud-panel" style={{ padding: '16px 20px' }}>
        <div className="card-header">
          <span className="card-title">SIMULATION GENERATOR CONFIGURATION</span>
          <span className="table-count font-mono">Deterministic PRNG Parameters</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) auto', gap: '12px', alignItems: 'flex-end', padding: '4px 0 8px 0' }}>
          <div>
            <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>
              SCENARIO ARCHETYPE
            </label>
            <select
              data-tour="simulator-archetypes"
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="filter-select"
              style={{ width: '100%' }}
            >
              {archetypes.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.category}] {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>
              RANDOM GENERATOR SEED (DETERMINISTIC)
            </label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="filter-input"
              style={{ width: '100%' }}
            />
          </div>

          <button
            data-tour="simulate-btn"
            className="btn-primary"
            onClick={handleSimulate}
            disabled={simulating}
            style={{ minWidth: '160px', justifyContent: 'center' }}
          >
            <Play size={13} />
            <span>{simulating ? 'Generating...' : 'Simulate Scenario'}</span>
          </button>
        </div>

        {/* Real-Time Synthesis Scanner Animation */}
        {simulating && (
          <div className="stagger-in" style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(8, 10, 15, 0.95)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--accent-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '12px', fontWeight: 600 }}>
              <RotateCw size={13} className="spinning" />
              <span>SYNTHESIZING FRAUD TOPOLOGY // RUNNING ISOLATION FOREST & GRAPHSAGE PIPELINE...</span>
            </div>
            <div className="score-track" style={{ height: '4px', marginTop: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #7596C8, #C6A45A, #E05252)' }} />
            </div>
          </div>
        )}

        {activeArchetype && (
          <div style={{ marginTop: '10px', padding: '12px 14px', background: 'var(--bg-obsidian)', borderRadius: '3px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                {activeArchetype.name}
              </span>
              <span className={`badge ${activeArchetype.riskBand === 'CRITICAL' ? 'badge-critical' : activeArchetype.riskBand === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                {activeArchetype.riskBand} RISK PROFILE
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 8px 0', lineHeight: 1.4 }}>
              {activeArchetype.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '11px' }}>
              <div>
                <span className="text-muted">Topological Signature: </span>
                <span className="font-mono text-cyan">{activeArchetype.topologicalPattern}</span>
              </div>
              <div>
                <span className="text-muted">Expected Rule Triggers: </span>
                <span className="font-mono" style={{ color: 'var(--accent-gold)' }}>
                  {activeArchetype.expectedRules.join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid of All Archetypes */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">SYNTHETIC FRAUD TOPOLOGY CATALOG</span>
          <span className="table-count">{archetypes.length} archetypes registered</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', marginTop: '6px' }}>
          {archetypes.map((arch) => {
            const isSelected = arch.id === selectedScenario;
            return (
              <div
                key={arch.id}
                className={`kpi-card clickable-card ${isSelected ? 'active-sweep-border' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--accent-gold-dim)' : 'var(--bg-deep-charcoal)',
                  textAlign: 'left'
                }}
                onClick={() => setSelectedScenario(arch.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className={`badge ${arch.category === 'SUSPICIOUS' ? 'badge-high' : 'badge-low'}`}>
                    {arch.category}
                  </span>
                  <span className="font-mono text-muted" style={{ fontSize: '11px' }}>
                    {arch.id}
                  </span>
                </div>

                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', marginBottom: '4px' }}>
                  {arch.name}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: '0 0 10px 0', lineHeight: 1.35, minHeight: '45px' }}>
                  {arch.description}
                </p>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-muted" style={{ fontSize: '10px' }}>Signature:</span>
                  <span className="font-mono text-cyan" style={{ fontSize: '10px' }}>
                    {arch.topologicalPattern.substring(0, 28)}...
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Result Output */}
      {simulationResult && (
        <div data-tour="simulation-receipt" className="card stagger-in">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={15} color="#10B981" />
              <span className="card-title">SIMULATION & PIPELINE DETECTION RECEIPT</span>
            </div>
            <span className="badge badge-low">STATUS: {simulationResult.status}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <div className="detail-field">
              <span className="detail-label">GENERATED ARCHETYPE</span>
              <span className="detail-value font-mono">{simulationResult.scenario_type}</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">ACCOUNTS GENERATED</span>
              <span className="detail-value font-mono text-cyan">{simulationResult.accounts_generated?.length || 0} entities</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">TRANSACTIONS SYNTHESIZED</span>
              <span className="detail-value font-mono" style={{ color: 'var(--accent-gold)' }}>{simulationResult.transactions_count || 0} transfers</span>
            </div>
            <div className="detail-field">
              <span className="detail-label">PIPELINE ALERTS FIRED</span>
              <span className="detail-value font-mono" style={{ color: (simulationResult.alerts_triggered?.length || 0) > 0 ? 'var(--alert-critical)' : 'var(--alert-success)' }}>
                {simulationResult.alerts_triggered?.length || 0} alerts
              </span>
            </div>
          </div>

          {/* Triggered Alerts Sub-Section */}
          {simulationResult.alerts_triggered && simulationResult.alerts_triggered.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <span className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>
                AUTOMATED PIPELINE DETECTION ALERTS ({simulationResult.alerts_triggered.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {simulationResult.alerts_triggered.map((alt: any) => (
                  <div
                    key={alt.alert_id}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '3px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-mono" style={{ fontWeight: 600, fontSize: '11px', color: 'var(--text-primary)' }}>
                          {alt.account_id}
                        </span>
                        <span className={`badge ${alt.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>
                          {alt.severity} ({alt.risk_score.toFixed(1)}/100)
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        {alt.primary_reason}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-action"
                        onClick={() => investigateAccount(alt.account_id)}
                        title="Open in Detection Lab"
                      >
                        Inspect Dossier
                      </button>
                      <button
                        className="btn-action"
                        onClick={() => {
                          setSelectedAccountId(alt.account_id);
                          navigateToModule('TRACE', 'attack-graph');
                        }}
                        title="View in Attack Graph"
                      >
                        <Network size={11} />
                        <span>Graph</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Accounts Chip List */}
          {simulationResult.accounts_generated && (
            <div style={{ marginBottom: '14px' }}>
              <span className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>
                GENERATED SCENARIO ENTITIES (CLICK TO INVESTIGATE)
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {simulationResult.accounts_generated.map((accId: string) => (
                  <button
                    key={accId}
                    className="btn-action"
                    onClick={() => investigateAccount(accId)}
                    style={{ fontSize: '10px', padding: '2px 8px' }}
                    title="Inspect in Detection Lab"
                  >
                    {accId}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <button
              className="btn-primary"
              onClick={() => {
                if (simulationResult.accounts_generated?.[0]) {
                  setSelectedAccountId(simulationResult.accounts_generated[0]);
                }
                navigateToModule('TRACE', 'attack-graph');
              }}
            >
              <Network size={13} />
              <span>Inspect in Attack Graph</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigateToModule('OBSERVE', 'threat-stream')}
            >
              View in Threat Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
