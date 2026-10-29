import React, { useEffect, useRef, useState } from 'react';
import { Network, DataSet } from 'vis-network/standalone';
import {
  Network as NetworkIcon,
  Search,
  Maximize2,
  ShieldAlert,
  Cpu,
  ArrowRight,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  AlertTriangle,
  Lock,
  Compass,
  Zap,
  Filter,
  Eye,
  GitBranch,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { api } from '../../api/client';
import { GraphDataResponse, GraphNode, BFSResponse } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';
import { ContextualGuidancePanel } from '../../components/ContextualGuidancePanel';

export const AttackGraph: React.FC = () => {
  const {
    selectedAccountId,
    setSelectedAccountId,
    selectedTokenId,
    setSelectedTokenId,
    setSelectedTxId,
    investigateAccount,
    traceToken,
    navigateToModule,
    goToGuidedStage,
    setMilestoneCompleted
  } = useInvestigation();
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  const [graphData, setGraphData] = useState<GraphDataResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & controls
  const [focusAcc, setFocusAcc] = useState(selectedAccountId || 'ACC_HERO_MULE_L2_CONVERGE');
  const [depth, setDepth] = useState(2);
  const [timeFilterHours, setTimeFilterHours] = useState<number>(0); // 0 = all history
  const [bfsDirection, setBfsDirection] = useState<'combined' | 'forward' | 'backward'>('combined');
  const [bfsResults, setBfsResults] = useState<BFSResponse | null>(null);
  const [activePathIdx, setActivePathIdx] = useState<number | null>(null);
  const [isTracingBfs, setIsTracingBfs] = useState(false);
  const [showTechnicalFeatures, setShowTechnicalFeatures] = useState(true);
  const [communityMode, setCommunityMode] = useState(false);

  const loadGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGraph({
        focus_account_id: focusAcc.trim() || undefined,
        depth,
        limit_nodes: 95
      });
      setGraphData(data);

      if (data.nodes.length > 0) {
        const found = data.nodes.find((n) => n.id === focusAcc) || data.nodes[0];
        setSelectedNode(found);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attack graph topology.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [depth]);

  // Update selected node when global context changes
  useEffect(() => {
    if (selectedAccountId && graphData) {
      const found = graphData.nodes.find((n) => n.id === selectedAccountId);
      if (found) {
        setSelectedNode(found);
        setFocusAcc(selectedAccountId);
      }
    }
  }, [selectedAccountId, graphData]);

  // Render Vis-Network Canvas with Signature Cyber Styling & Dimming
  useEffect(() => {
    if (!graphContainerRef.current || !graphData) return;

    // Active path accounts & transactions
    const activePath = activePathIdx !== null && bfsResults?.paths[activePathIdx]
      ? bfsResults.paths[activePathIdx]
      : null;

    const pathAccountSet = new Set<string>();
    const pathTxSet = new Set<string>();
    const hasPathFilter = activePath !== null;

    if (activePath) {
      activePath.accounts_in_path.forEach((a) => pathAccountSet.add(a));
      activePath.hops.forEach((h) => pathTxSet.add(h.transaction_id));
    } else if (bfsResults?.paths) {
      bfsResults.paths.forEach((p) => {
        p.accounts_in_path.forEach((a) => pathAccountSet.add(a));
        p.hops.forEach((h) => pathTxSet.add(h.transaction_id));
      });
    }

    const visNodes = graphData.nodes.map((n) => {
      const isSelected = selectedNode?.id === n.id;
      const isHero = n.is_hero_suspect;
      const isOnPath = pathAccountSet.has(n.id);
      const isDimmed = hasPathFilter && !isOnPath;
      const risk = n.aggregate_risk_score || 0;

      let bg = '#111722';
      let border = '#2A3444';

      const communityColors = ['#00D2FF', '#C6A45A', '#A855F7', '#10B981', '#F97316', '#EC4899'];
      if (communityMode && n.community_id) {
        const cColor = communityColors[(n.community_id - 1) % communityColors.length] || '#00D2FF';
        bg = isDimmed ? 'rgba(21, 27, 39, 0.4)' : `${cColor}22`;
        border = isDimmed ? `${cColor}55` : cColor;
      } else if (isOnPath) {
        bg = '#3D2F0A';
        border = '#FFD700';
      } else if (n.account_type === 'cashout' || risk >= 80) {
        bg = isDimmed ? '#181214' : '#2A1719';
        border = isDimmed ? '#522525' : '#E05252';
      } else if (n.account_type === 'mule_suspect' || risk >= 50) {
        bg = isDimmed ? '#1C1812' : '#2C2315';
        border = isDimmed ? '#665123' : '#C6A45A';
      } else if (n.id.includes('VICTIM')) {
        bg = isDimmed ? '#121922' : '#182438';
        border = isDimmed ? '#334863' : '#7596C8';
      }

      return {
        id: n.id,
        label: n.id.replace('ACC_HERO_', '').replace('ACC_', ''),
        title: `${n.id} (${n.account_type})\nRisk: ${risk.toFixed(1)}/100\nDegree: In ${n.in_degree} / Out ${n.out_degree}`,
        shape: 'box',
        size: isSelected ? 26 : isHero ? 22 : 18,
        color: {
          background: bg,
          border: isSelected ? '#FFFFFF' : border,
          highlight: { background: '#C6A45A', border: '#FFFFFF' }
        },
        font: {
          color: isDimmed ? '#64748B' : '#E8EDF5',
          face: 'JetBrains Mono, monospace',
          size: 11,
          bold: isHero || isSelected
        },
        borderWidth: isSelected ? 3 : isHero ? 2.2 : 1.2,
        shadow: (isHero || isSelected || isOnPath) ? { enabled: true, color: 'rgba(198, 164, 90, 0.5)', size: 10 } : false
      };
    });

    const now = new Date().getTime();
    const visEdges = graphData.edges
      .filter((e) => {
        if (timeFilterHours <= 0) return true;
        const txTime = new Date(e.timestamp).getTime();
        return (now - txTime) <= timeFilterHours * 3600 * 1000;
      })
      .map((e) => {
        const isTxOnPath = pathTxSet.has(e.transaction_id);
        const isDimmed = hasPathFilter && !isTxOnPath;

        let edgeColor = 'rgba(117, 150, 200, 0.28)';
        let edgeWidth = 1.2;

        if (isTxOnPath) {
          edgeColor = '#FFD700';
          edgeWidth = 3;
        } else if (e.highlighted) {
          edgeColor = '#C6A45A';
          edgeWidth = 2.2;
        } else if (isDimmed) {
          edgeColor = 'rgba(42, 52, 68, 0.15)';
          edgeWidth = 0.8;
        }

        return {
          id: e.id,
          from: e.from_node,
          to: e.to_node,
          arrows: { to: { enabled: true, scaleFactor: isTxOnPath ? 1.0 : 0.75 } },
          color: { color: edgeColor, highlight: '#C6A45A' },
          width: edgeWidth,
          smooth: { enabled: true, type: 'curvedCW', roundness: 0.12 },
          font: { color: isTxOnPath ? '#FFD700' : 'transparent', size: 9, face: 'JetBrains Mono' },
          label: isTxOnPath ? `₹${e.amount.toLocaleString()}` : undefined
        };
      });

    const data: any = { nodes: new DataSet(visNodes), edges: new DataSet(visEdges) };
    const options = {
      physics: {
        stabilization: { iterations: 120 },
        barnesHut: { gravitationalConstant: -2800, springLength: 95, springConstant: 0.04 }
      },
      interaction: { hover: true, zoomView: true, dragView: true }
    };

    const network = new Network(graphContainerRef.current, data, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const found = graphData.nodes.find((n) => n.id === clickedId);
        if (found) {
          setSelectedNode(found);
          setSelectedAccountId(found.id);
        }
      }
    });

    return () => {
      network.destroy();
    };
  }, [graphData, selectedNode?.id, activePathIdx, bfsResults, timeFilterHours, communityMode]);

  const handleTraceBFS = async (directionOverride?: 'combined' | 'forward' | 'backward') => {
    if (!selectedNode) return;
    const dir = directionOverride || bfsDirection;
    setIsTracingBfs(true);
    setActivePathIdx(null);
    try {
      const res = await api.traceBFS({
        seed_account_id: selectedNode.id,
        max_hops: 4,
        time_window_seconds: 7200,
        direction: dir
      });
      setBfsResults(res);
      if (res.paths.length > 0) {
        setActivePathIdx(0);
        const firstHop = res.paths[0].hops[0];
        if (firstHop) {
          setSelectedTxId(firstHop.transaction_id);
        }
        setMilestoneCompleted('bfsTraced', {
          bfsPathCount: res.total_paths,
          riskScore: selectedNode.aggregate_risk_score || undefined
        });
      }
    } catch (err: any) {
      alert(`BFS trace error: ${err.message}`);
    } finally {
      setIsTracingBfs(false);
    }
  };

  const renderStopReasonBadge = (reason?: string) => {
    switch (reason) {
      case 'OFF_RAMP_REACHED':
        return (
          <span className="badge badge-critical" style={{ fontSize: '9px', padding: '1px 5px' }}>
            OFF-RAMP REACHED
          </span>
        );
      case 'MAX_HOPS_REACHED':
        return (
          <span className="badge badge-high" style={{ fontSize: '9px', padding: '1px 5px' }}>
            MAX HOPS (4)
          </span>
        );
      case 'LOOKBACK_OR_LOOKAHEAD_WINDOW_EXCEEDED':
        return (
          <span className="badge" style={{ fontSize: '9px', padding: '1px 5px', background: 'rgba(117, 150, 200, 0.15)', color: 'var(--steel-blue)', border: '1px solid rgba(117, 150, 200, 0.3)' }}>
            WINDOW EXCEEDED
          </span>
        );
      case 'NO_ELIGIBLE_INCOMING_OR_OUTGOING_TRANSACTIONS':
      default:
        return (
          <span className="badge" style={{ fontSize: '9px', padding: '1px 5px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
            TERMINAL NODE
          </span>
        );
    }
  };

  return (
    <div className="threat-stream-page">
      {/* REGION A: INVESTIGATION TARGET & COMMAND ACTIONS */}
      <div className="hud-panel" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Target Identifiers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'rgba(198, 164, 90, 0.12)',
                  border: '1px solid var(--accent-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Compass size={18} color="var(--accent-gold)" />
              </div>
              <div>
                <span className="detail-label" style={{ display: 'block', fontSize: '9px', letterSpacing: '0.06em' }}>
                  TARGET NODE FOCUS
                </span>
                <span className="font-mono tabular-nums" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedNode?.id || 'NO SELECTION'}
                </span>
              </div>
            </div>

            <div style={{ height: '28px', width: '1px', background: 'rgba(117, 150, 200, 0.2)' }} />

            <div>
              <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>ROLE CLASSIFICATION</span>
              <span className="badge badge-info" style={{ marginTop: '2px' }}>
                {selectedNode?.account_type?.toUpperCase() || 'STANDARD'}
              </span>
            </div>

            <div>
              <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>AGGREGATE RISK</span>
              <span
                className={`badge ${
                  (selectedNode?.aggregate_risk_score || 0) >= 80
                    ? 'badge-critical'
                    : (selectedNode?.aggregate_risk_score || 0) >= 50
                    ? 'badge-high'
                    : 'badge-low'
                }`}
                style={{ marginTop: '2px' }}
              >
                {(selectedNode?.aggregate_risk_score || 0).toFixed(1)} / 100
              </span>
            </div>

            <div>
              <span className="detail-label" style={{ display: 'block', fontSize: '9px' }}>TOPOLOGICAL COMMUNITY</span>
              <span className="font-mono" style={{ fontSize: '12px', color: '#00D2FF' }}>
                Cluster #{selectedNode?.community_id || 1}
              </span>
            </div>
          </div>

          {/* Action Buttons with Cross-Screen Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Direction Selector Group */}
            <div style={{ display: 'flex', background: 'var(--bg-obsidian)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
              <button
                type="button"
                className={`btn-action ${bfsDirection === 'combined' ? 'btn-gold' : ''}`}
                onClick={() => {
                  setBfsDirection('combined');
                  handleTraceBFS('combined');
                }}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title="Trace both origin funds and downstream cashout off-ramps"
              >
                <GitBranch size={11} style={{ marginRight: '4px' }} />
                <span>Combined</span>
              </button>
              <button
                type="button"
                className={`btn-action ${bfsDirection === 'backward' ? 'btn-gold' : ''}`}
                onClick={() => {
                  setBfsDirection('backward');
                  handleTraceBFS('backward');
                }}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title="Trace backward to origin victim accounts"
              >
                <ArrowDownLeft size={11} style={{ marginRight: '4px' }} />
                <span>Backward (Origins)</span>
              </button>
              <button
                type="button"
                className={`btn-action ${bfsDirection === 'forward' ? 'btn-gold' : ''}`}
                onClick={() => {
                  setBfsDirection('forward');
                  handleTraceBFS('forward');
                }}
                style={{ fontSize: '11px', padding: '4px 8px' }}
                title="Trace forward to off-ramp exit accounts"
              >
                <ArrowUpRight size={11} style={{ marginRight: '4px' }} />
                <span>Forward (Exits)</span>
              </button>
            </div>

            <button
              className="btn-primary"
              onClick={() => handleTraceBFS()}
              disabled={isTracingBfs || !selectedNode}
              style={{ padding: '6px 14px' }}
            >
              <Zap size={13} />
              <span>{isTracingBfs ? 'Tracing Flow...' : 'Run BFS Trace'}</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => {
                if (selectedNode) {
                  investigateAccount(selectedNode.id);
                }
              }}
              disabled={!selectedNode}
              title="Inspect 8-engine evidence dossier in Detection Lab"
            >
              <Cpu size={13} />
              <span>Review in Lab →</span>
            </button>
          </div>
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

      {/* REGION B: SIGNATURE IMMERSIVE GRAPH WORKSPACE */}
      <div className="hud-panel hud-corner-brackets" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Floating Command Bar */}
        <div
          style={{
            padding: '10px 18px',
            background: 'linear-gradient(180deg, rgba(21, 27, 39, 0.95) 0%, rgba(17, 23, 34, 0.98) 100%)',
            borderBottom: '1px solid rgba(117, 150, 200, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="search-input-wrap">
              <Search size={13} className="search-icon" />
              <input
                type="text"
                placeholder="Search Account ID..."
                className="filter-input"
                value={focusAcc}
                onChange={(e) => setFocusAcc(e.target.value)}
                style={{ width: '230px' }}
              />
            </div>
            <button className="btn-secondary" onClick={loadGraph} style={{ height: '32px' }}>
              Center Node
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Time Filtering */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={12} color="var(--steel-blue)" />
              <select
                value={timeFilterHours}
                onChange={(e) => setTimeFilterHours(Number(e.target.value))}
                className="filter-select"
                style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
              >
                <option value={0}>Time: All Records</option>
                <option value={24}>Time: Past 24h</option>
                <option value={6}>Time: Past 6h</option>
                <option value={1}>Time: Past 1h Burst</option>
              </select>
            </div>

            {/* Depth Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Depth:</span>
              {[1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  className={`module-btn ${depth === d ? 'active' : ''}`}
                  onClick={() => setDepth(d)}
                  style={{ padding: '2px 9px', height: '26px' }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Louvain Community Highlight Toggle */}
            <button
              className={`module-btn ${communityMode ? 'active' : ''}`}
              onClick={() => setCommunityMode(!communityMode)}
              title="Color nodes by topological Louvain community modularity"
              style={{ height: '28px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Layers size={12} color={communityMode ? 'var(--accent-gold)' : 'var(--text-muted)'} />
              <span>Louvain Clusters: {communityMode ? 'ON' : 'OFF'}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <button
                className="btn-action"
                onClick={() => {
                  if (networkRef.current) {
                    const scale = networkRef.current.getScale();
                    networkRef.current.moveTo({ scale: scale * 1.3, animation: { duration: 250, easingFunction: 'easeInOutQuad' } });
                  }
                }}
                title="Zoom In"
                style={{ height: '28px', padding: '0 8px', fontSize: '13px', fontWeight: 700 }}
              >
                +
              </button>
              <button
                className="btn-action"
                onClick={() => {
                  if (networkRef.current) {
                    const scale = networkRef.current.getScale();
                    networkRef.current.moveTo({ scale: scale * 0.75, animation: { duration: 250, easingFunction: 'easeInOutQuad' } });
                  }
                }}
                title="Zoom Out"
                style={{ height: '28px', padding: '0 8px', fontSize: '13px', fontWeight: 700 }}
              >
                −
              </button>
              <button
                className="btn-action"
                onClick={() => networkRef.current?.fit({ animation: { duration: 350, easingFunction: 'easeInOutQuad' } })}
                title="Fit graph to view"
                style={{ height: '28px' }}
              >
                <Maximize2 size={12} />
                <span>Fit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Visualizer with Deep Blueprint Grid */}
        <div className="cyber-grid-canvas" style={{ height: '620px', position: 'relative' }}>
          {loading && (
            <div className="state-loading" style={{ height: '100%' }}>
              <div className="state-loading-spinner" />
              <p style={{ fontSize: '11px' }}>Synthesizing multi-hop attack graph topology...</p>
            </div>
          )}

          <div ref={graphContainerRef} style={{ width: '100%', height: '100%', opacity: loading ? 0 : 1 }} />

          {/* Graph Legend HUD Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: 'rgba(8, 10, 15, 0.92)',
              backdropFilter: 'blur(4px)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(117, 150, 200, 0.25)',
              fontSize: '10px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#2A1719', border: '1px solid #E05252', borderRadius: '1px' }} />
              <span>Terminal Cash-Out</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#2C2315', border: '1px solid #C6A45A', borderRadius: '1px' }} />
              <span>Mule Intermediary</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '8px', height: '8px', background: '#182438', border: '1px solid #7596C8', borderRadius: '1px' }} />
              <span>Victim Account</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '12px', height: '2px', background: '#FFD700' }} />
              <span>Active BFS Path</span>
            </span>
          </div>
        </div>
      </div>

      {/* REGION C: CONTEXTUAL ENTITY INSPECTOR & CHRONOLOGICAL TRACE */}
      {selectedNode && (
        <div className="stagger-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Sub-Panel 1: Entity Metrics & Graph Features */}
          <div className="hud-panel" style={{ padding: '16px 20px' }}>
            <div className="card-header">
              <span className="card-title">
                <Activity size={13} color="var(--accent-gold)" />
                ENTITY TOPOLOGICAL METRICS
              </span>
              <button
                className="btn-action"
                onClick={() => setShowTechnicalFeatures(!showTechnicalFeatures)}
              >
                {showTechnicalFeatures ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                <span>{showTechnicalFeatures ? 'Collapse' : 'Expand'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
              <div className="detail-field">
                <span className="detail-label">KYC RISK BASELINE</span>
                <span className="font-mono detail-value tabular-nums">
                  {(selectedNode.kyc_risk_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">IN-DEGREE (FAN-IN)</span>
                <span className="font-mono detail-value tabular-nums text-cyan">
                  {selectedNode.in_degree} vectors
                </span>
              </div>
              <div className="detail-field">
                <span className="detail-label">OUT-DEGREE (FAN-OUT)</span>
                <span className="font-mono detail-value tabular-nums" style={{ color: 'var(--accent-gold)' }}>
                  {selectedNode.out_degree} vectors
                </span>
              </div>
            </div>

            {showTechnicalFeatures && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', borderTop: '1px solid rgba(117, 150, 200, 0.15)', paddingTop: '10px' }}>
                <div className="detail-field">
                  <span className="detail-label">DEGREE RATIO</span>
                  <span className="font-mono detail-value tabular-nums">
                    {((selectedNode.in_degree + 1) / (selectedNode.out_degree + 1)).toFixed(2)}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">TOTAL CHURN COUNT</span>
                  <span className="font-mono detail-value tabular-nums">
                    {selectedNode.in_degree + selectedNode.out_degree} txs
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">COMMUNITY CLUSTER</span>
                  <span className="font-mono detail-value tabular-nums">
                    #{selectedNode.community_id || 1}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sub-Panel 2: Discovered Temporal BFS Paths */}
          <div className="hud-panel" style={{ padding: '16px 20px' }}>
            <div className="card-header">
              <span className="card-title">
                <Clock size={13} color="var(--steel-blue)" />
                DISCOVERED MONOTONIC BFS PATHS
              </span>
              <span className="table-count font-mono">
                {bfsResults ? `${bfsResults.total_paths} paths traced` : 'Awaiting BFS run'}
              </span>
            </div>

            {bfsResults ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {bfsResults.paths.map((p, idx) => {
                  const isActive = activePathIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setActivePathIdx(isActive ? null : idx)}
                      style={{
                        background: isActive ? 'rgba(198, 164, 90, 0.15)' : 'rgba(21, 27, 39, 0.9)',
                        border: isActive ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                        padding: '9px 12px',
                        borderRadius: 'var(--radius-xs)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Click to highlight this exact flow path on the canvas"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: isActive ? 'var(--accent-gold)' : 'var(--steel-blue)' }}>
                            Route #{idx + 1} ({p.hops.length} hops) {isActive && '★ ILLUMINATED'}
                          </span>
                          {renderStopReasonBadge(p.stop_reason)}
                        </div>
                        <span className="font-mono tabular-nums" style={{ fontSize: '11px', color: 'var(--accent-gold)' }}>
                          ₹{p.total_amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {p.accounts_in_path.join(' → ')}
                      </div>
                      <div className="text-muted" style={{ fontSize: '10px', marginTop: '3px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Traversal: {p.duration_seconds.toFixed(0)}s | {p.direction?.toUpperCase() || 'TRACE'}</span>
                        <span style={{ color: 'var(--steel-blue)' }}>Click to highlight on canvas</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="state-empty" style={{ padding: '24px 10px' }}>
                <p style={{ fontSize: '11px' }}>
                  Click "Run BFS Trace" above to illuminate time-constrained money laundering dispersal trees.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
