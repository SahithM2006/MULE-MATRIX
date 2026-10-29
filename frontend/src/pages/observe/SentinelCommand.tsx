import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Activity,
  Layers,
  Lock,
  Zap,
  TrendingUp,
  Cpu,
  ChevronDown,
  ChevronUp,
  FileText,
  Target,
  ExternalLink,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';
import { api } from '../../api/client';
import { SentinelSummary, GraphDataResponse, TransactionEnriched, GraphNode } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';
import { ContextualGuidancePanel } from '../../components/ContextualGuidancePanel';

// Animated Number Counter Component
const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string; decimals?: number }> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0
}) => {
  const [displayVal, setDisplayVal] = useState<number>(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(start + (value - start) * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayVal(value);
      }
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <span>
      {prefix}
      {decimals > 0 ? displayVal.toFixed(decimals) : Math.round(displayVal).toLocaleString()}
      {suffix}
    </span>
  );
};

export const SentinelCommand: React.FC = () => {
  const {
    investigateAccount,
    navigateToModule,
    setSelectedAccountId,
    setSelectedTxId,
    setSelectedAlertId,
    setMilestoneCompleted
  } = useInvestigation();

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const [summary, setSummary] = useState<SentinelSummary | null>(null);
  const [graphData, setGraphData] = useState<GraphDataResponse | null>(null);
  const [recentTxs, setRecentTxs] = useState<TransactionEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Graph filter mode & active inspected node
  const [graphFilter, setGraphFilter] = useState<'ALL' | 'SUSPECTS' | 'CASHOUT'>('ALL');
  const [inspectedNode, setInspectedNode] = useState<GraphNode | null>(null);

  // Expanded alert state
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  // Progressive disclosure: architecture briefing
  const [showTechOverview, setShowTechOverview] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, graph, txs] = await Promise.all([
        api.getSentinelSummary(),
        api.getGraph({ focus_account_id: 'ACC_HERO_MULE_L2_CONVERGE', depth: 2, limit_nodes: 50 }),
        api.getThreatStream({ limit: 8, min_risk: 50, sort_by: 'risk_desc' })
      ]);
      setSummary(sum);
      setGraphData(graph);
      setRecentTxs(txs);

      // Auto-expand the first alert for quick scanning
      if (sum.recent_alerts && sum.recent_alerts.length > 0) {
        setExpandedAlertId(sum.recent_alerts[0].alert_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend Sentinel telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initialize and update Centerpiece Graph Canvas
  useEffect(() => {
    if (!graphContainerRef.current || !graphData) return;

    // Filter nodes based on graphFilter
    let filteredNodes = graphData.nodes;
    if (graphFilter === 'SUSPECTS') {
      filteredNodes = graphData.nodes.filter(
        (n) => n.account_type === 'mule_suspect' || (n.aggregate_risk_score && n.aggregate_risk_score >= 50)
      );
    } else if (graphFilter === 'CASHOUT') {
      filteredNodes = graphData.nodes.filter((n) => n.account_type === 'cashout' || n.id.includes('CASHOUT'));
    }

    const nodeIds = new Set(filteredNodes.map((n) => n.id));

    const visNodes = filteredNodes.map((n) => {
      const isHero = n.is_hero_suspect;
      const risk = n.aggregate_risk_score || 0;
      const isInspected = inspectedNode?.id === n.id;

      let bg = '#111722';
      let border = '#2A3444';

      if (n.account_type === 'cashout' || risk >= 80) {
        bg = isInspected ? '#4A1C20' : '#2A1719';
        border = '#E05252';
      } else if (n.account_type === 'mule_suspect' || risk >= 50) {
        bg = isInspected ? '#4A3B18' : '#2C2315';
        border = '#C6A45A';
      } else if (n.id.includes('VICTIM')) {
        bg = isInspected ? '#223450' : '#182438';
        border = '#7596C8';
      }

      return {
        id: n.id,
        label: n.id.replace('ACC_HERO_', '').replace('ACC_', ''),
        title: `${n.id} (${n.account_type || 'standard'})\nRisk: ${risk.toFixed(1)}/100`,
        shape: 'box',
        size: isInspected ? 26 : isHero ? 22 : 18,
        color: {
          background: bg,
          border: isInspected ? '#FFFFFF' : border,
          highlight: { background: '#C6A45A', border: '#FFFFFF' }
        },
        font: {
          color: '#E8EDF5',
          face: 'JetBrains Mono, monospace',
          size: 11,
          bold: isHero || isInspected
        },
        borderWidth: isInspected ? 2.8 : isHero ? 2.2 : 1.2,
        shadow: (isHero || isInspected) ? { enabled: true, color: 'rgba(198, 164, 90, 0.45)', size: 10 } : false
      };
    });

    const visEdges = graphData.edges
      .filter((e) => nodeIds.has(e.from_node) && nodeIds.has(e.to_node))
      .slice(0, 65)
      .map((e) => ({
        id: e.id,
        from: e.from_node,
        to: e.to_node,
        arrows: { to: { enabled: true, scaleFactor: 0.75 } },
        color: {
          color: e.highlighted ? '#C6A45A' : 'rgba(117, 150, 200, 0.22)',
          highlight: '#C6A45A'
        },
        width: e.highlighted ? 2.4 : 1,
        smooth: { enabled: true, type: 'curvedCW', roundness: 0.12 }
      }));

    const data: any = { nodes: new DataSet(visNodes), edges: new DataSet(visEdges) };
    const options = {
      physics: {
        stabilization: { iterations: 100 },
        barnesHut: { gravitationalConstant: -2600, springLength: 100, springConstant: 0.04 }
      },
      interaction: { hover: true, zoomView: true, dragView: true }
    };

    const network = new Network(graphContainerRef.current, data, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const found = graphData.nodes.find((n) => n.id === clickedId) || null;
        setInspectedNode(found);
        setSelectedAccountId(clickedId);

        // Smooth camera pan to focused entity
        network.focus(clickedId, {
          scale: 1.15,
          animation: { duration: 500, easingFunction: 'easeInOutQuad' }
        });
      } else {
        setInspectedNode(null);
      }
    });

    return () => {
      network.destroy();
    };
  }, [graphData, graphFilter, inspectedNode?.id]);

  // Handle selecting an alert
  const handleSelectAlert = (alt: any) => {
    setSelectedAccountId(alt.account_id);
    setSelectedAlertId(alt.alert_id);
    if (alt.transaction_id) {
      setSelectedTxId(alt.transaction_id);
    }
    setMilestoneCompleted('alertSelected', {
      alertReason: alt.primary_reason,
      riskScore: alt.risk_score
    });
  };

  return (
    <div className="threat-stream-page sentinel-page-container">
      {/* Cinematic Command-Centre Hero Header */}
      <div className="stream-header" style={{ padding: '8px 0 16px 0', borderBottom: '1px solid rgba(117, 150, 200, 0.12)' }}>
        <div className="stream-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="tech-tag critical" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
              <span className="radar-dot critical" style={{ marginRight: '4px' }} />
              DEFCON 2 // SURVEILLANCE RADAR ACTIVE
            </span>
            <span className="tech-tag font-mono" style={{ fontSize: '10px', color: 'var(--steel-blue)' }}>
              STAGE 01 // SENTINEL COMMAND
            </span>
          </div>

          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: '6px 0 4px 0', background: 'linear-gradient(135deg, #E8EDF5 0%, #C6A45A 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Sentinel Command & Threat Surveillance
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--accent-gold)', margin: '4px 0 6px 0', fontWeight: 600, letterSpacing: '0.02em' }}>
            Investigate suspicious financial activity by tracing transaction flows, examining detection evidence, and preserving case records.
          </p>

          <p className="stream-description" style={{ fontSize: '13px', lineHeight: 1.5, maxWidth: '820px', color: 'var(--text-secondary)' }}>
            Central intelligence focal point synthesizing multi-hop mule layering, high-velocity fund pooling, and simulated e-Rupee token transfers into real-time actionable alerts.
          </p>
        </div>

        {/* Prominent Hero Action Controls */}
        <div className="stream-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={() => navigateToModule('OBSERVE', 'threat-stream')}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderRadius: 'var(--radius-sm)'
            }}
            title="Investigate existing suspicious activity from real alerts or transactions in the dataset"
          >
            <ShieldAlert size={15} />
            <span>Investigate Existing Activity</span>
            <ArrowRight size={13} />
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigateToModule('TOOLS', 'simulator')}
            style={{ fontSize: '12px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Simulate synthetic financial mule scenarios (Optional test bed)"
          >
            <Sliders size={13} color="var(--accent-gold)" />
            <span>Scenario Simulator</span>
          </button>

          <button
            className="btn-secondary"
            onClick={() => setShowTechOverview(!showTechOverview)}
            style={{ fontSize: '12px', padding: '8px 12px' }}
            title="Toggle Technical Overview & Architecture Briefing"
          >
            <FileText size={13} color="var(--steel-blue)" />
            <span>Technical Specs</span>
            {showTechOverview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button
            className="btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{ fontSize: '12px', padding: '8px 12px' }}
            title="Refresh Sentinel Feeds"
          >
            <Activity size={13} className={loading ? 'spinning' : ''} />
            <span>Sync</span>
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

      {/* Progressive Disclosure: Technical Overview Panel */}
      {showTechOverview && (
        <div
          className="hud-panel stagger-in"
          style={{
            padding: '20px 24px',
            marginBottom: '8px',
            background: 'rgba(17, 23, 34, 0.95)',
            border: '1px solid rgba(198, 164, 90, 0.35)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <span className="tech-tag gold" style={{ fontSize: '10px' }}>ARCHITECTURE BRIEFING</span>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                Multi-Engine Cybernetic AML Detection Pipeline & Token Provenance Specification
              </h3>
            </div>
            <button
              onClick={() => setShowTechOverview(false)}
              className="btn-action"
              style={{ padding: '3px 8px', fontSize: '11px' }}
            >
              Close Briefing ✕
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <div style={{ background: 'var(--bg-obsidian)', padding: '14px 16px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: 'var(--accent-gold)', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                1. Temporal Sliding Windows
              </strong>
              Evaluates burst frequency and pass-through dwell times (median holding delay &lt; 10 mins). Triggers rapid transit alarms when inflow-to-outflow volume ratio exceeds 90%.
            </div>
            <div style={{ background: 'var(--bg-obsidian)', padding: '14px 16px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: '#00D2FF', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                2. 11-D Graph Topology & Louvain
              </strong>
              Computes degree ratios, local clustering coefficients, weighted flow centrality, and community modularity to identify tightly coupled circular mule rings and converging funnels.
            </div>
            <div style={{ background: 'var(--bg-obsidian)', padding: '14px 16px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <strong style={{ color: '#10B981', display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                3. Multi-Engine ML & Cryptographic Lineage
              </strong>
              Synthesizes Isolation Forest anomaly scores and 2-layer inductive GraphSAGE GNN probabilities into an explainable 0–100 score, verified against RFC 8785 canonical JSON hash chains.
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Command-Centre Operational Telemetry HUD */}
      <div
        className="hud-panel active-sweep-border"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px',
          background: 'rgba(42, 52, 68, 0.45)',
          overflow: 'hidden',
          borderRadius: 'var(--radius-sm)'
        }}
      >
        {/* Section 1: Active Mule Networks */}
        <div
          className="clickable-card"
          onClick={() => {
            setSelectedAccountId('ACC_HERO_MULE_L2_CONVERGE');
            navigateToModule('TRACE', 'attack-graph');
          }}
          title="Click to inspect active suspicious rings in Attack Graph"
          style={{
            background: 'var(--bg-deep-charcoal)',
            padding: '22px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-tag critical" style={{ fontSize: '11px', letterSpacing: '0.06em' }}>
              COORDINATED RING DETECTIONS
            </span>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-gold)' }}>
              PRIMARY THREAT ↗
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
            <span className="font-mono tabular-nums" style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-gold)', lineHeight: 1 }}>
              {summary ? (
                <AnimatedCounter value={summary.suspicious_networks_count} />
              ) : (
                '--'
              )}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Active Mule Clusters
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>Target: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>ACC_HERO_MULE_L2</strong></span>
            <span>•</span>
            <span style={{ color: 'var(--accent-gold)' }}>Pivot to Graph →</span>
          </div>
        </div>

        {/* Section 2: Flagged Exposure & Simulated Volume */}
        <div
          className="clickable-card"
          onClick={() => navigateToModule('OBSERVE', 'threat-stream')}
          title="Click to inspect full flagged transactions in Threat Stream"
          style={{
            background: 'var(--bg-deep-charcoal)',
            padding: '22px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-tag gold" style={{ fontSize: '11px' }}>
              EXPOSURE RADAR
            </span>
            <span className="font-mono" style={{ fontSize: '11px', color: '#00D2FF' }}>
              {summary ? (
                <AnimatedCounter value={summary.flagged_transactions_count} suffix=" FLAGGED TRANSITS" />
              ) : (
                '...'
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
            <span className="font-mono tabular-nums" style={{ fontSize: '36px', fontWeight: 800, color: '#00D2FF', lineHeight: 1 }}>
              {summary ? (
                <AnimatedCounter value={summary.total_e_inr_volume / 10000000} prefix="₹" suffix=" Cr" decimals={2} />
              ) : (
                '--'
              )}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Simulated Transit Volume
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>Exit Vectors: <strong className="font-mono" style={{ color: 'var(--alert-critical)' }}>{summary ? summary.potential_cashout_count : '--'} Off-Ramps</strong></span>
            <span>•</span>
            <span style={{ color: '#00D2FF' }}>Inspect live ledger →</span>
          </div>
        </div>

        {/* Section 3: Lineage Cryptographic Assurance */}
        <div
          className="clickable-card"
          onClick={() => navigateToModule('TRACE', 'token-forensics')}
          title="Click to verify SHA-256 chain of custody in Token Forensics"
          style={{
            background: 'var(--bg-deep-charcoal)',
            padding: '22px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="tech-tag" style={{ color: 'var(--alert-success)', borderColor: 'rgba(16, 185, 129, 0.3)', fontSize: '11px' }}>
              <Lock size={11} />
              <span>CHAIN OF CUSTODY</span>
            </span>
            <span className="radar-dot" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
            <span className="font-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
              {summary ? summary.lineage_integrity_status : 'VERIFYING'}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.45, marginTop: '2px' }}>
            Continuous parent-child SHA-256 verification. <span style={{ color: '#10B981' }}>Verify token chain →</span>
          </div>
        </div>
      </div>

      {/* Main Centerpiece Workspace: Active Topology + Priority Threat Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1.25fr)', gap: '18px' }}>
        {/* Left: Centerpiece Transaction Network Graph */}
        <div
          className="hud-panel hud-corner-brackets"
          style={{ display: 'flex', flexDirection: 'column', height: '560px', padding: '16px 20px' }}
        >
          <div className="card-header" style={{ marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <span className="card-title" style={{ fontSize: '13.5px', fontWeight: 700 }}>
              <Layers size={15} color="var(--accent-gold)" />
              ACTIVE TRANSACTION TOPOLOGY (HERO SUBGRAPH)
            </span>

            {/* Interactive Graph Filter Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', background: 'rgba(8, 10, 15, 0.7)', borderRadius: 'var(--radius-xs)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  className={`btn-action ${graphFilter === 'ALL' ? 'btn-gold' : ''}`}
                  onClick={() => setGraphFilter('ALL')}
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  All Nodes
                </button>
                <button
                  type="button"
                  className={`btn-action ${graphFilter === 'SUSPECTS' ? 'btn-gold' : ''}`}
                  onClick={() => setGraphFilter('SUSPECTS')}
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  Mule Hubs
                </button>
                <button
                  type="button"
                  className={`btn-action ${graphFilter === 'CASHOUT' ? 'btn-gold' : ''}`}
                  onClick={() => setGraphFilter('CASHOUT')}
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  Cash-Out
                </button>
              </div>

              <button
                className="btn-action"
                onClick={() => networkRef.current?.fit()}
                title="Fit Canvas to Viewport"
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                <Maximize2 size={12} />
                <span>Fit</span>
              </button>
              <button
                className="btn-action btn-gold"
                onClick={() => navigateToModule('TRACE', 'attack-graph')}
                style={{ fontSize: '11px', padding: '3px 10px' }}
              >
                Full Workspace →
              </button>
            </div>
          </div>

          <div className="cyber-radial-grid" style={{ flex: 1, position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(117, 150, 200, 0.15)' }}>
            {loading && (
              <div className="state-loading" style={{ height: '100%' }}>
                <div className="state-loading-spinner" />
                <p style={{ fontSize: '12px' }}>Streaming transaction network topology...</p>
              </div>
            )}
            <div ref={graphContainerRef} style={{ width: '100%', height: '100%', opacity: loading ? 0 : 1 }} />

            {/* Interactive Slide-Out Node Inspector Drawer */}
            {inspectedNode && (
              <div
                className="hud-panel stagger-in"
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '280px',
                  background: 'rgba(17, 23, 34, 0.96)',
                  border: '1px solid var(--accent-gold)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
                  padding: '14px',
                  borderRadius: 'var(--radius-xs)',
                  zIndex: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="tech-tag gold" style={{ fontSize: '9px' }}>INSPECTED ENTITY</span>
                  <button
                    onClick={() => setInspectedNode(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="font-mono tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {inspectedNode.id}
                </div>

                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <span>Type: <strong style={{ color: 'var(--accent-gold)' }}>{inspectedNode.account_type || 'standard'}</strong></span>
                  <span>•</span>
                  <span>Risk: <strong style={{ color: (inspectedNode.aggregate_risk_score || 0) >= 80 ? 'var(--alert-critical)' : 'var(--accent-gold)' }}>{(inspectedNode.aggregate_risk_score || 0).toFixed(0)}/100</strong></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    className="btn-action btn-gold"
                    onClick={() => {
                      setSelectedAccountId(inspectedNode.id);
                      navigateToModule('TRACE', 'attack-graph');
                    }}
                    style={{ justifyContent: 'center', fontSize: '11px', padding: '4px' }}
                  >
                    Trace in Attack Graph ↗
                  </button>
                  <button
                    className="btn-action"
                    onClick={() => {
                      investigateAccount(inspectedNode.id);
                    }}
                    style={{ justifyContent: 'center', fontSize: '11px', padding: '4px' }}
                  >
                    Inspect in Detection Lab ↗
                  </button>
                </div>
              </div>
            )}

            {/* Visual Node Legend HUD Overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                background: 'rgba(8, 10, 15, 0.94)',
                backdropFilter: 'blur(6px)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid rgba(117, 150, 200, 0.25)',
                fontSize: '11px',
                display: 'flex',
                gap: '14px',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: '#2A1719', border: '1px solid #E05252', borderRadius: '2px' }} />
                <span>Cash-Out</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: '#2C2315', border: '1px solid #C6A45A', borderRadius: '2px' }} />
                <span>Mule Hub</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: '#182438', border: '1px solid #7596C8', borderRadius: '2px' }} />
                <span>Victim</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', background: '#111722', border: '1px solid #2A3444', borderRadius: '2px' }} />
                <span>Standard</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Priority Threat Queue (Tour Step 1 Target) */}
        <div
          data-tour="sentinel-alerts"
          className="hud-panel"
          style={{ display: 'flex', flexDirection: 'column', height: '560px', padding: '16px 20px' }}
        >
          <div className="card-header" style={{ marginBottom: '10px' }}>
            <span className="card-title" style={{ fontSize: '13.5px', fontWeight: 700 }}>
              <ShieldAlert size={15} color="var(--alert-critical)" />
              PRIORITY THREAT QUEUE
            </span>
            <button
              className="btn-action"
              onClick={() => navigateToModule('RESPOND', 'incident-response')}
              style={{ fontSize: '11px' }}
            >
              Cases ({summary?.recent_alerts.length || 0}) ↗
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '2px' }}>
            {summary?.recent_alerts.map((alt, idx) => {
              const isFirst = idx === 0;
              const isExpanded = expandedAlertId === alt.alert_id;

              return (
                <div
                  key={alt.alert_id}
                  onClick={() => setExpandedAlertId(isExpanded ? null : alt.alert_id)}
                  style={{
                    background: isExpanded ? 'rgba(28, 36, 52, 0.96)' : 'rgba(21, 27, 39, 0.95)',
                    border: `1px solid ${isExpanded ? 'var(--accent-gold)' : 'rgba(117, 150, 200, 0.18)'}`,
                    borderLeft: `4px solid ${alt.risk_score >= 80 ? 'var(--alert-critical)' : 'var(--accent-gold)'}`,
                    borderRadius: 'var(--radius-xs)',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {alt.account_id}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge ${alt.risk_score >= 80 ? 'badge-critical' : 'badge-high'}`} style={{ fontSize: '11px' }}>
                        {alt.risk_score.toFixed(1)} / 100
                      </span>
                      {isExpanded ? <ChevronUp size={13} color="var(--accent-gold)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
                    </div>
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {alt.primary_reason}
                  </p>

                  {/* Expandable Investigation Preview */}
                  {isExpanded && (
                    <div className="stagger-in" style={{ marginTop: '6px', paddingTop: '8px', borderTop: '1px solid rgba(117, 150, 200, 0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>Alert: <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{alt.alert_id}</strong></span>
                        <span>{new Date(alt.created_at).toLocaleTimeString()} UTC</span>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className="btn-action"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAccountId(alt.account_id);
                            if (alt.transaction_id) setSelectedTxId(alt.transaction_id);
                            navigateToModule('OBSERVE', 'threat-stream');
                          }}
                          title="Inspect in Threat Stream"
                        >
                          Stream ↗
                        </button>

                        <button
                          className="btn-action"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAccountId(alt.account_id);
                            navigateToModule('TRACE', 'attack-graph');
                          }}
                          title="View Topology in Attack Graph"
                        >
                          Topology ↗
                        </button>

                        <button
                          className="btn-action"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            investigateAccount(alt.account_id);
                          }}
                          title="Open Account in Detection Lab"
                        >
                          Dossier ↗
                        </button>

                        <button
                          className="btn-action btn-gold"
                          style={{ fontSize: '11px', padding: '4px 12px', fontWeight: 700 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAlert(alt);
                            investigateAccount(alt.account_id);
                          }}
                          title="Investigate this Alert"
                        >
                          <span>Investigate Alert →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {(!summary || summary.recent_alerts.length === 0) && !loading && (
              <div className="state-empty" style={{ padding: '30px 20px' }}>
                <p style={{ fontSize: '13px' }}>No active alerts recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Telemetry Region: Chronological Transaction Stream Table */}
      <div className="hud-panel" style={{ padding: '20px 24px' }}>
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <span className="card-title" style={{ fontSize: '13.5px', fontWeight: 700 }}>
            <TrendingUp size={15} color="var(--steel-blue)" />
            LIVE FLAGGED TRANSITS CHRONOLOGY
          </span>
          <button
            className="btn-action"
            onClick={() => navigateToModule('OBSERVE', 'threat-stream')}
            style={{ fontSize: '11px' }}
          >
            Open Complete Stream ↗
          </button>
        </div>

        <div className="table-wrap">
          <table className="stream-table">
            <thead>
              <tr>
                <th>TRANSACTION ID</th>
                <th>TIMESTAMP (UTC)</th>
                <th>SOURCE ACCOUNT</th>
                <th>DESTINATION ACCOUNT</th>
                <th>TRANSIT AMOUNT</th>
                <th>DETECTION SIGNALS</th>
                <th>SEVERITY</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {recentTxs.map((tx, idx) => (
                <tr key={tx.transaction_id} className={`stagger-in stagger-${Math.min(idx + 1, 6)}`}>
                  <td className="font-mono text-muted" style={{ fontSize: '11.5px' }}>
                    {tx.transaction_id}
                  </td>
                  <td className="font-mono tabular-nums" style={{ fontSize: '11.5px' }}>
                    {tx.timestamp.replace('T', ' ').substring(0, 19)}
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600, fontSize: '12px' }}>
                    {tx.source_account_id}
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600, fontSize: '12px' }}>
                    {tx.destination_account_id}
                  </td>
                  <td className="font-mono tabular-nums" style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '12.5px' }}>
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td style={{ maxWidth: '320px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {tx.signals.join(', ') || 'Normal P2P Transit'}
                  </td>
                  <td>
                    <span className={`badge ${tx.severity === 'CRITICAL' ? 'badge-critical' : tx.severity === 'HIGH' ? 'badge-high' : 'badge-low'}`} style={{ fontSize: '11px' }}>
                      {tx.severity || 'LOW'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-action"
                        onClick={() => investigateAccount(tx.source_account_id)}
                        title="Inspect Account in Detection Lab"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        Inspect
                      </button>
                      <button
                        className="btn-action btn-gold"
                        onClick={() => {
                          setSelectedAccountId(tx.source_account_id);
                          navigateToModule('TRACE', 'attack-graph');
                        }}
                        title="Trace in Attack Graph"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        Graph →
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
