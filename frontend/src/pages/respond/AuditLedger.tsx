import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, Search, Lock, AlertTriangle, ChevronRight, Hash } from 'lucide-react';
import { api } from '../../api/client';
import { AuditEvent } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';
import { ContextualGuidancePanel } from '../../components/ContextualGuidancePanel';

export const AuditLedger: React.FC = () => {
  const { selectedCaseId, evidence } = useInvestigation();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>(selectedCaseId || '');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAuditLedger(limit);
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [limit]);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.event_id.toLowerCase().includes(q) ||
      ev.actor.toLowerCase().includes(q) ||
      ev.action.toLowerCase().includes(q) ||
      ev.target_entity_id.toLowerCase().includes(q) ||
      ev.integrity_hash.toLowerCase().includes(q)
    );
  });

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'badge-gold';
    if (action.includes('UPDATE')) return 'badge-medium';
    if (action.includes('EXPORT')) return 'badge-low';
    if (action.includes('TAMPER')) return 'badge-critical';
    return 'badge-info';
  };

  return (
    <div className="threat-stream-page">
      {/* Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <ShieldCheck size={14} />
            <span>TAMPER-EVIDENT AUDIT LEDGER</span>
          </div>
          <h2>Cryptographic Application Event Chain</h2>
          <p className="stream-description">
            Strict append-only forensic log where every user mutation, pipeline run, and export action is cryptographically chained using SHA-256 hashes.
          </p>
        </div>

        <div className="stream-controls">
          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, actor, or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>

          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="filter-select"
          >
            <option value={25}>Latest 25 Events</option>
            <option value={50}>Latest 50 Events</option>
            <option value={100}>Latest 100 Events</option>
          </select>

          <button className="btn-secondary" onClick={fetchLedger}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Persistent Contextual Investigation Guidance */}
      <ContextualGuidancePanel />

      {/* KPI Cards */}
      <div className="vault-kpi-grid">
        <div className="hud-panel clickable-card" style={{ padding: '14px 18px' }}>
          <span className="kpi-label">CHAINED EVENTS</span>
          <span className="kpi-value font-mono tabular-nums">{events.length}</span>
          <span className="kpi-sub">Retrieved from immutable audit_events table</span>
        </div>
        <div className="hud-panel clickable-card active-sweep-border" style={{ padding: '14px 18px' }}>
          <span className="kpi-label">INTEGRITY STATE</span>
          <span className="kpi-value font-mono" style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '18px' }}>
            <span className="radar-dot" />
            CONTINUOUS
          </span>
          <span className="kpi-sub">SHA-256 linked parent hashes</span>
        </div>
        <div className="hud-panel clickable-card" style={{ padding: '14px 18px' }}>
          <span className="kpi-label">GENESIS ANCHOR</span>
          <span className="kpi-value font-mono text-muted" style={{ fontSize: '0.85rem' }}>
            00000000...00000000
          </span>
          <span className="kpi-sub">64-char null hash parent</span>
        </div>
        <div className="hud-panel clickable-card" style={{ padding: '14px 18px' }}>
          <span className="kpi-label">SERIALIZATION STANDARD</span>
          <span className="kpi-value font-mono cyan" style={{ fontSize: '1rem' }}>RFC 8785 JSON</span>
          <span className="kpi-sub">Deterministic UTF-8 key ordering</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="hud-panel" style={{ padding: '16px 20px' }}>
        <div className="card-header">
          <span className="card-title">FORENSIC TRANSACTION & EVENT CHRONICLE</span>
          <span className="table-count font-mono">{filteredEvents.length} events displayed</span>
        </div>

        {loading ? (
          <div style={{ padding: '16px 0' }}>
            <div className="skeleton-row" />
            <div className="skeleton-row" />
            <div className="skeleton-row" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <Lock size={36} style={{ color: '#4A5568', marginBottom: '0.75rem' }} />
            <p>No audit events match the specified query.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="stream-table">
              <thead>
                <tr>
                  <th>EVENT ID</th>
                  <th>TIMESTAMP (UTC)</th>
                  <th>ACTOR</th>
                  <th>ACTION</th>
                  <th>TARGET ENTITY</th>
                  <th>OUTCOME</th>
                  <th>PREVIOUS AUDIT HASH</th>
                  <th>CURRENT INTEGRITY HASH</th>
                  <th>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev, idx) => {
                  const staggerClass = idx < 6 ? `stagger-${idx + 1}` : '';
                  return (
                    <tr key={ev.event_id} className={`stagger-in ${staggerClass}`}>
                      <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                        {ev.event_id}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                        {ev.timestamp.replace('T', ' ').substring(0, 19)}
                      </td>
                      <td style={{ fontWeight: 600 }}>{ev.actor}</td>
                      <td>
                        <span className={`badge ${getActionColor(ev.action)}`}>
                          {ev.action}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                        <span className="text-muted">{ev.target_entity_type}: </span>
                        {ev.target_entity_id}
                      </td>
                      <td>
                        <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle2 size={11} color="#10B981" />
                          {ev.outcome}
                        </span>
                      </td>
                      <td className="font-mono text-muted" style={{ fontSize: '0.75rem' }} title={ev.prev_audit_hash}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>{ev.prev_audit_hash.substring(0, 8)}...</span>
                          <button
                            type="button"
                            className={`copy-pill ${copiedHash === ev.prev_audit_hash ? 'copied-success' : ''}`}
                            onClick={() => handleCopy(ev.prev_audit_hash)}
                          >
                            {copiedHash === ev.prev_audit_hash ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: '#10B981' }} title={ev.integrity_hash}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={10} />
                          <span>{ev.integrity_hash.substring(0, 8)}...</span>
                          <button
                            type="button"
                            className={`copy-pill ${copiedHash === ev.integrity_hash ? 'copied-success' : ''}`}
                            onClick={() => handleCopy(ev.integrity_hash)}
                          >
                            {copiedHash === ev.integrity_hash ? '✓' : 'Copy'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn-action"
                          onClick={() => setSelectedEvent(ev)}
                          title="Inspect Event Metadata"
                        >
                          <Hash size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Event Modal */}
      {selectedEvent && (
        <div className="modal-backdrop" onClick={() => setSelectedEvent(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Lock size={20} color="#10B981" />
                <h3 style={{ margin: 0 }}>AUDIT EVENT RECEIPT</h3>
              </div>
              <button className="btn-close" onClick={() => setSelectedEvent(null)}>×</button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="detail-field">
                  <span className="detail-label">EVENT IDENTIFIER</span>
                  <span className="detail-value font-mono">{selectedEvent.event_id}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">UTC TIMESTAMP</span>
                  <span className="detail-value font-mono">{selectedEvent.timestamp}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">ACTOR</span>
                  <span className="detail-value">{selectedEvent.actor}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">ACTION</span>
                  <span className="detail-value">
                    <span className={`badge ${getActionColor(selectedEvent.action)}`}>
                      {selectedEvent.action}
                    </span>
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">TARGET ENTITY</span>
                  <span className="detail-value font-mono">
                    {selectedEvent.target_entity_type} / {selectedEvent.target_entity_id}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">OUTCOME</span>
                  <span className="detail-value">{selectedEvent.outcome}</span>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <span className="detail-label">PREVIOUS PARENT HASH</span>
                <div className="code-snippet font-mono">{selectedEvent.prev_audit_hash}</div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <span className="detail-label">CURRENT INTEGRITY HASH (SHA-256)</span>
                <div className="code-snippet font-mono" style={{ color: '#10B981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  {selectedEvent.integrity_hash}
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <span className="detail-label">EVENT DETAILS / PAYLOAD</span>
                <pre className="json-preview-box">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
