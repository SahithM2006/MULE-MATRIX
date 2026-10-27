import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ArrowRight,
  Activity,
  AlertTriangle,
  RefreshCw,
  Network,
  Lock,
  Check,
  ShieldAlert,
  Zap,
  Clock,
  Eye,
  Sliders,
  X,
  Share2
} from 'lucide-react';
import { api } from '../../api/client';
import { TransactionEnriched } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';

export const ThreatStream: React.FC = () => {
  const {
    investigateAccount,
    traceToken,
    selectedTxId,
    setSelectedTxId,
    selectedAccountId,
    setSelectedAccountId,
    setSelectedTokenId,
    navigateToModule,
    goToGuidedStage,
    setMilestoneCompleted
  } = useInvestigation();

  const [transactions, setTransactions] = useState<TransactionEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [page, setPage] = useState(1);
  const [accountId, setAccountId] = useState(selectedAccountId || '');
  const [minAmount, setMinAmount] = useState<string>('');
  const [minRisk, setMinRisk] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('timestamp_desc');
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Selected Transaction for Detailed Flow Inspection
  const [inspectedTx, setInspectedTx] = useState<TransactionEnriched | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getThreatStream({
        page,
        limit: 35,
        account_id: accountId.trim() || undefined,
        min_amount: minAmount ? parseFloat(minAmount) : undefined,
        min_risk: minRisk ? parseFloat(minRisk) : undefined,
        sort_by: sortBy
      });
      setTransactions(data);

      // If selectedTxId is set, inspect it
      if (selectedTxId) {
        const found = data.find((t) => t.transaction_id === selectedTxId);
        if (found) setInspectedTx(found);
      } else if (data.length > 0 && !inspectedTx) {
        setInspectedTx(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load threat stream ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId && !accountId) {
      setAccountId(selectedAccountId);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadTransactions();
  }, [page, sortBy]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTransactions();
  };

  const handlePreset = (type: 'ALL' | 'CRITICAL' | 'HIGH_VALUE') => {
    setPage(1);
    if (type === 'ALL') {
      setAccountId('');
      setMinAmount('');
      setMinRisk('');
      setSortBy('timestamp_desc');
    } else if (type === 'CRITICAL') {
      setMinRisk('80');
      setMinAmount('');
    } else if (type === 'HIGH_VALUE') {
      setMinAmount('50000');
      setMinRisk('');
    }
    setTimeout(loadTransactions, 50);
  };

  const handleSelectRow = (tx: TransactionEnriched) => {
    setSelectedTxId(tx.transaction_id);
    setSelectedAccountId(tx.source_account_id);
    if (tx.token_lineage_id) {
      setSelectedTokenId(tx.token_lineage_id);
    }
    setInspectedTx(tx);
  };

  // KPI Calculations
  const criticalCount = transactions.filter((t) => t.severity === 'CRITICAL').length;
  const totalVolume = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  return (
    <div className="threat-stream-page">
      {/* Stream Header */}
      <div className="stream-header" style={{ padding: '8px 0 16px 0', borderBottom: '1px solid rgba(117, 150, 200, 0.12)' }}>
        <div className="stream-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="tech-tag" style={{ color: 'var(--accent-gold)', borderColor: 'rgba(198, 164, 90, 0.3)' }}>
              <Activity size={11} />
              <span>STAGE 01 // SURVEILLANCE LEDGER</span>
            </span>
            <span className="tech-tag font-mono" style={{ fontSize: '10px' }}>
              REAL-TIME TRANSACTION STREAM
            </span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 4px 0', background: 'linear-gradient(135deg, #E8EDF5 0%, #7596C8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Threat Stream & Transaction Flow Radar
          </h1>

          <p className="stream-description" style={{ fontSize: '14px', lineHeight: 1.6, maxWidth: '820px' }}>
            Interactive transactional ledger recording peer-to-peer transfers, rapid pass-through forwardings, structuring fan-ins, and terminal cash-out conversions.
          </p>
        </div>

        <div className="stream-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn-secondary" onClick={loadTransactions} disabled={loading} style={{ fontSize: '12px', padding: '8px 14px' }}>
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
            <span>Refresh Ledger</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Ribbon */}
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
        <div style={{ background: 'var(--bg-deep-charcoal)', padding: '16px 20px' }}>
          <span className="detail-label" style={{ fontSize: '10px', color: 'var(--steel-blue)', display: 'block', marginBottom: '4px' }}>
            MONITORED TRANSITS (CURRENT PAGE)
          </span>
          <div className="font-mono tabular-nums" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {transactions.length} Records
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Continuous ingestion buffer</span>
        </div>

        <div style={{ background: 'var(--bg-deep-charcoal)', padding: '16px 20px' }}>
          <span className="detail-label" style={{ fontSize: '10px', color: 'var(--alert-critical)', display: 'block', marginBottom: '4px' }}>
            CRITICAL THREAT TRANSITS
          </span>
          <div className="font-mono tabular-nums" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--alert-critical)' }}>
            {criticalCount} Flagged
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Risk index &gt;= 80/100 threshold</span>
        </div>

        <div style={{ background: 'var(--bg-deep-charcoal)', padding: '16px 20px' }}>
          <span className="detail-label" style={{ fontSize: '10px', color: 'var(--accent-gold)', display: 'block', marginBottom: '4px' }}>
            SIMULATED E-RUPEE TRANSIT FLOW
          </span>
          <div className="font-mono tabular-nums" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-gold)' }}>
            ₹{totalVolume.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total page volume evaluated</span>
        </div>
      </div>

      {/* Interactive Selected Transaction Flow Inspector Drawer */}
      {inspectedTx && (
        <div
          className="hud-panel hud-corner-brackets stagger-in"
          style={{
            padding: '18px 22px',
            background: 'linear-gradient(180deg, rgba(21, 27, 39, 0.98) 0%, rgba(17, 23, 34, 0.98) 100%)',
            border: '1px solid var(--accent-gold)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="tech-tag gold" style={{ fontSize: '10px' }}>INSPECTED TRANSACTION FLOW</span>
              <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {inspectedTx.transaction_id}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${inspectedTx.severity === 'CRITICAL' ? 'badge-critical' : inspectedTx.severity === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                {inspectedTx.severity} // RISK {inspectedTx.risk_score?.toFixed(1) || '0.0'}/100
              </span>
              <button
                onClick={() => setInspectedTx(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Visual Directed Flow Diagram */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '14px 20px',
              background: 'rgba(8, 10, 15, 0.85)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid rgba(117, 150, 200, 0.16)',
              marginBottom: '12px',
              flexWrap: 'wrap'
            }}
          >
            {/* Source Account */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <span className="detail-label" style={{ fontSize: '9px', display: 'block', marginBottom: '2px' }}>
                SOURCE DEBTOR ACCOUNT
              </span>
              <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {inspectedTx.source_account_id}
              </div>
              <button
                className="btn-action"
                style={{ marginTop: '6px', fontSize: '10px', padding: '2px 6px' }}
                onClick={() => investigateAccount(inspectedTx.source_account_id)}
              >
                Inspect Dossier ↗
              </button>
            </div>

            {/* Transfer Direction & Amount Arrow */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '160px' }}>
              <span className="font-mono tabular-nums" style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-gold)' }}>
                ₹{inspectedTx.amount.toLocaleString()}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--steel-blue)', margin: '4px 0' }}>
                <span style={{ height: '2px', width: '40px', background: 'var(--steel-blue)' }} />
                <ArrowRight size={14} color="var(--accent-gold)" />
                <span style={{ height: '2px', width: '40px', background: 'var(--steel-blue)' }} />
              </div>
              <span className="tech-tag" style={{ fontSize: '9px' }}>
                {inspectedTx.tx_type}
              </span>
            </div>

            {/* Destination Account */}
            <div style={{ flex: 1, minWidth: '180px', textAlign: 'right' }}>
              <span className="detail-label" style={{ fontSize: '9px', display: 'block', marginBottom: '2px' }}>
                DESTINATION CREDITOR ACCOUNT
              </span>
              <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {inspectedTx.destination_account_id}
              </div>
              <button
                className="btn-action"
                style={{ marginTop: '6px', fontSize: '10px', padding: '2px 6px' }}
                onClick={() => investigateAccount(inspectedTx.destination_account_id)}
              >
                Inspect Dossier ↗
              </button>
            </div>
          </div>

          {/* Quick Pivot Actions Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Signals:</span>
              {(inspectedTx.signals || []).map((sig, i) => (
                <span key={i} className="tech-tag critical" style={{ fontSize: '9px' }}>
                  {sig}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn-action btn-gold"
                onClick={() => {
                  setSelectedAccountId(inspectedTx.source_account_id);
                  setSelectedTxId(inspectedTx.transaction_id);
                  if (inspectedTx.token_lineage_id) setSelectedTokenId(inspectedTx.token_lineage_id);
                  setMilestoneCompleted('alertSelected', {
                    alertReason: inspectedTx.signals.join(', ') || 'Selected in Threat Stream',
                    riskScore: inspectedTx.risk_score || undefined
                  });
                  goToGuidedStage(2);
                }}
                style={{ fontSize: '11px', padding: '4px 10px', fontWeight: 700 }}
              >
                <Network size={12} />
                <span>Trace in Attack Graph →</span>
              </button>

              <button
                className="btn-action"
                onClick={() => {
                  const tok = inspectedTx.token_lineage_id || 'TOKR_HERO_500K_GENESIS';
                  setSelectedAccountId(inspectedTx.source_account_id);
                  setSelectedTxId(inspectedTx.transaction_id);
                  setSelectedTokenId(tok);
                  traceToken(tok);
                }}
                style={{ fontSize: '11px', padding: '4px 10px' }}
              >
                <Lock size={12} />
                <span>Verify Token Provenance ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Sorting Control Bar */}
      <div className="hud-panel" style={{ padding: '14px 18px' }}>
        <form onSubmit={handleFilterSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="search-input-wrap">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Filter Account ID (e.g. ACC_HERO...)"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="filter-input"
              style={{ width: '240px' }}
            />
          </div>

          <input
            type="number"
            placeholder="Min Amount (₹)"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="filter-input"
            style={{ width: '130px' }}
          />

          <input
            type="number"
            placeholder="Min Risk (0-100)"
            value={minRisk}
            onChange={(e) => setMinRisk(e.target.value)}
            className="filter-input"
            style={{ width: '130px' }}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
            style={{ width: '170px' }}
          >
            <option value="timestamp_desc">Newest First (UTC)</option>
            <option value="timestamp_asc">Oldest First (UTC)</option>
            <option value="risk_desc">Highest Risk First</option>
            <option value="amount_desc">Largest Amount First</option>
          </select>

          <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
            <Filter size={12} />
            <span>Apply</span>
          </button>

          {/* Quick Filter Presets */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
            <button
              type="button"
              className="btn-action"
              onClick={() => handlePreset('ALL')}
              style={{ fontSize: '11px', padding: '3px 8px' }}
            >
              All
            </button>
            <button
              type="button"
              className="btn-action"
              onClick={() => handlePreset('CRITICAL')}
              style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--alert-critical)' }}
            >
              Critical Risk
            </button>
            <button
              type="button"
              className="btn-action"
              onClick={() => handlePreset('HIGH_VALUE')}
              style={{ fontSize: '11px', padding: '3px 8px', color: 'var(--accent-gold)' }}
            >
              &gt; ₹50K
            </button>
          </div>
        </form>
      </div>

      {/* Main Streaming Table */}
      <div data-tour="threat-stream-table" className="hud-panel" style={{ padding: '16px 20px' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <span className="card-title" style={{ fontSize: '13.5px', fontWeight: 700 }}>
            <Activity size={14} color="var(--steel-blue)" />
            GLOBAL TRANSACTION CHRONICLE
          </span>
          <span className="table-count font-mono">{transactions.length} records matching</span>
        </div>

        {loading ? (
          <div style={{ padding: '24px 0' }}>
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="state-empty" style={{ padding: '40px' }}>
            <p style={{ fontSize: '13px' }}>No transactions match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="stream-table">
              <thead>
                <tr>
                  <th>TRANSACTION ID</th>
                  <th>TIMESTAMP (UTC)</th>
                  <th>SOURCE ACCOUNT</th>
                  <th>DESTINATION ACCOUNT</th>
                  <th>AMOUNT</th>
                  <th>TYPE</th>
                  <th>RISK</th>
                  <th>SEVERITY</th>
                  <th>SIGNALS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => {
                  const isSelected = inspectedTx?.transaction_id === tx.transaction_id;
                  const isCopied = copiedTxId === tx.transaction_id;
                  const staggerClass = idx < 6 ? `stagger-${idx + 1}` : '';

                  return (
                    <tr
                      key={tx.transaction_id}
                      data-tour={idx === 0 ? 'threat-stream-first-row' : undefined}
                      className={`stagger-in ${staggerClass}`}
                      onClick={() => handleSelectRow(tx)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(198, 164, 90, 0.14)' : undefined,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <td className="font-mono text-muted" style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 400 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {isSelected && <Check size={11} color="var(--accent-gold)" />}
                          <span>{tx.transaction_id}</span>
                          <button
                            type="button"
                            className={`copy-pill ${isCopied ? 'copied-success' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(tx.transaction_id);
                              setCopiedTxId(tx.transaction_id);
                              setTimeout(() => setCopiedTxId(null), 1500);
                            }}
                            title="Copy Transaction ID"
                          >
                            {isCopied ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </td>

                      <td className="font-mono tabular-nums" style={{ fontSize: '11px' }}>
                        {tx.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>

                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {tx.source_account_id}
                      </td>

                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {tx.destination_account_id}
                      </td>

                      <td className="font-mono tabular-nums" style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '12px' }}>
                        ₹{tx.amount.toLocaleString()}
                      </td>

                      <td>
                        <span className="badge badge-info" style={{ fontSize: '9px' }}>
                          {tx.tx_type}
                        </span>
                      </td>

                      <td className="font-mono tabular-nums" style={{ fontWeight: 600 }}>
                        {tx.risk_score !== null && tx.risk_score !== undefined
                          ? `${tx.risk_score.toFixed(1)}/100`
                          : '0.0/100'}
                      </td>

                      <td>
                        <span className={`badge ${tx.severity === 'CRITICAL' ? 'badge-critical' : tx.severity === 'HIGH' ? 'badge-high' : 'badge-low'}`}>
                          {tx.severity || 'LOW'}
                        </span>
                      </td>

                      <td style={{ maxWidth: '240px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {tx.signals.join(', ') || 'Normal Transfer'}
                      </td>

                      <td>
                        <div className="row-action-wrap" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button
                            className="btn-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAccountId(tx.source_account_id);
                              setSelectedTxId(tx.transaction_id);
                              investigateAccount(tx.source_account_id);
                            }}
                            title="Inspect Source Account in Detection Lab"
                          >
                            Inspect
                          </button>

                          <button
                            className="btn-action btn-gold"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRow(tx);
                              goToGuidedStage(2);
                            }}
                            title="Open Source Account & Tx in Attack Graph"
                          >
                            <Network size={10} />
                            <span>Graph →</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
