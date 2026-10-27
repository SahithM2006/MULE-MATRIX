import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Search, FileText, Link as LinkIcon, Lock, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { api } from '../../api/client';
import { useInvestigation } from '../../context/InvestigationContext';

interface EvidenceItem {
  evidence_type: 'LINEAGE_CHAIN' | 'CASE_DOSSIER';
  reference_id: string;
  description: string;
  timestamp_range: string;
  status: string;
}

export const EvidenceVault: React.FC = () => {
  const {
    selectedCaseId,
    setSelectedCaseId,
    traceToken,
    openCase,
    navigateToModule,
    setMilestoneCompleted,
    isTourActive,
    currentTourStep,
    setTourStepStatus
  } = useInvestigation();
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(selectedCaseId || '');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedExport, setSelectedExport] = useState<any | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getEvidenceVault();
      setEvidenceItems(res.evidence_items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load evidence vault catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, []);

  useEffect(() => {
    if (selectedCaseId && !searchQuery) {
      setSearchQuery(selectedCaseId);
    }
  }, [selectedCaseId]);

  const handleExportCase = async (caseId: string) => {
    try {
      setExportLoading(true);
      setExportError(null);
      if (isTourActive && currentTourStep === 8) {
        setTourStepStatus('action_in_progress');
      }
      const dossier = await api.exportCasePackage(caseId);
      setSelectedExport(dossier);
      setMilestoneCompleted('evidenceExported', {
        exportSealHash: dossier.integrity_seal_sha256,
        caseNumber: dossier.case_record?.case_number
      });
      if (isTourActive && currentTourStep === 8) {
        setTourStepStatus('action_completed');
      }
    } catch (err: any) {
      if (isTourActive && currentTourStep === 8) {
        setTourStepStatus('error', err.message);
      }
      setExportError(err.message || 'Failed to export case dossier.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportLineage = async (tokenId: string) => {
    try {
      setExportLoading(true);
      setExportError(null);
      if (isTourActive && currentTourStep === 8) {
        setTourStepStatus('action_in_progress');
      }
      const dossier = await api.exportLineagePackage(tokenId);
      setSelectedExport(dossier);
      setMilestoneCompleted('evidenceExported', {
        exportSealHash: dossier.integrity_seal_sha256
      });
      if (isTourActive && currentTourStep === 8) {
        setTourStepStatus('action_completed');
      }
    } catch (err: any) {
      if (isTourActive && currentTourStep === 8) {
        setTourStepStatus('error', err.message);
      }
      setExportError(err.message || 'Failed to export token provenance chain.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDownloadJson = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  const handleCopyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const filteredItems = evidenceItems.filter((item) => {
    const matchesType = typeFilter === 'ALL' || item.evidence_type === typeFilter;
    const matchesSearch =
      searchQuery === '' ||
      item.reference_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="threat-stream-page">
      {/* Header / Command Controls */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <Lock size={14} />
            <span>CRYPTOGRAPHIC EVIDENCE VAULT</span>
          </div>
          <h2>Immutable Forensic Artifacts and Case Dossiers</h2>
          <p className="stream-description">
            Cryptographically sealed investigation records, token provenance ledgers, and court-admissible forensic export packages.
          </p>
        </div>

        <div className="stream-controls">
          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Filter by token ID or Case ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="ALL">All Evidence Types</option>
            <option value="LINEAGE_CHAIN">Token Provenance Chains</option>
            <option value="CASE_DOSSIER">Incident Case Dossiers</option>
          </select>

          <button className="btn-secondary" onClick={fetchEvidence}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Strip - Interactive Filters */}
      <div className="vault-kpi-grid">
        <div
          className={`hud-panel clickable-card ${typeFilter === 'ALL' ? 'active-sweep-border' : ''}`}
          onClick={() => setTypeFilter('ALL')}
          style={{ padding: '14px 18px', cursor: 'pointer' }}
          title="Click to view all sealed artifacts"
        >
          <span className="kpi-label">TOTAL SEALED ARTIFACTS</span>
          <span className="kpi-value font-mono tabular-nums">{evidenceItems.length}</span>
          <span className="kpi-sub">All artifacts hashed with SHA-256</span>
        </div>
        <div
          className={`hud-panel clickable-card ${typeFilter === 'LINEAGE_CHAIN' ? 'active-sweep-border' : ''}`}
          onClick={() => setTypeFilter('LINEAGE_CHAIN')}
          style={{ padding: '14px 18px', cursor: 'pointer' }}
          title="Click to filter by Token Provenance Chains"
        >
          <span className="kpi-label">TOKEN PROVENANCE CHAINS</span>
          <span className="kpi-value font-mono tabular-nums gold">
            {evidenceItems.filter((i) => i.evidence_type === 'LINEAGE_CHAIN').length}
          </span>
          <span className="kpi-sub">Strict backward/forward hash integrity</span>
        </div>
        <div
          className={`hud-panel clickable-card ${typeFilter === 'CASE_DOSSIER' ? 'active-sweep-border' : ''}`}
          onClick={() => setTypeFilter('CASE_DOSSIER')}
          style={{ padding: '14px 18px', cursor: 'pointer' }}
          title="Click to filter by Incident Case Dossiers"
        >
          <span className="kpi-label">CASE DOSSIERS</span>
          <span className="kpi-value font-mono tabular-nums cyan">
            {evidenceItems.filter((i) => i.evidence_type === 'CASE_DOSSIER').length}
          </span>
          <span className="kpi-sub">Exportable with digital cryptographic seal</span>
        </div>
        <div className="hud-panel" style={{ padding: '14px 18px' }}>
          <span className="kpi-label">IMMUTABILITY STANDARD</span>
          <span className="kpi-value font-mono" style={{ color: '#10B981', fontSize: '18px' }}>CANONICAL</span>
          <span className="kpi-sub">RFC 8785 deterministic serialization</span>
        </div>
      </div>

      {/* Main Evidence Catalog Table */}
      <div className="hud-panel" data-tour="evidence-catalog" style={{ padding: '16px 20px' }}>
        <div className="card-header">
          <span className="card-title">FORENSIC ARTIFACT REGISTRY</span>
          <span className="table-count">{filteredItems.length} records matching</span>
        </div>

        {loading ? (
          <div className="loading-state">Loading evidence vault records...</div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={36} style={{ color: '#4A5568', marginBottom: '0.75rem' }} />
            <p>No evidence artifacts matched the specified filter criteria.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="stream-table">
              <thead>
                <tr>
                  <th>TYPE</th>
                  <th>IDENTIFIER</th>
                  <th>DESCRIPTION</th>
                  <th>RECORD RANGE / CREATION</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => {
                  const staggerClass = idx < 6 ? `stagger-${idx + 1}` : '';
                  return (
                    <tr key={`${item.reference_id}-${idx}`} className={`stagger-in ${staggerClass}`}>
                    <td>
                      <span className={`badge ${item.evidence_type === 'LINEAGE_CHAIN' ? 'badge-gold' : 'badge-low'}`}>
                        {item.evidence_type === 'LINEAGE_CHAIN' ? 'TOKEN CHAIN' : 'CASE DOSSIER'}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontWeight: 600 }}>
                      {item.reference_id}
                    </td>
                    <td style={{ maxWidth: '340px' }}>{item.description}</td>
                    <td className="font-mono text-muted" style={{ fontSize: '0.8rem' }}>
                      {item.timestamp_range}
                    </td>
                    <td>
                      <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <CheckCircle2 size={12} color="#10B981" />
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {item.evidence_type === 'LINEAGE_CHAIN' ? (
                          <>
                            <button
                              className="btn-action"
                              onClick={() => traceToken(item.reference_id)}
                              title="Inspect in Token Forensics"
                            >
                              <Eye size={12} />
                              <span>Inspect</span>
                            </button>
                            <button
                              className="btn-action btn-gold"
                              data-tour="evidence-export-btn"
                              onClick={() => handleExportLineage(item.reference_id)}
                              title="Export Cryptographic Lineage Package"
                            >
                              <Download size={12} />
                              <span>Export</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-action"
                              onClick={() => openCase(item.reference_id)}
                              title="Open in Incident Response"
                            >
                              <FileText size={12} />
                              <span>View Case</span>
                            </button>
                            <button
                              className="btn-action btn-gold"
                              data-tour="evidence-export-btn"
                              onClick={() => handleExportCase(item.reference_id)}
                              title="Export Cryptographic Package"
                            >
                              <Download size={12} />
                              <span>Export</span>
                            </button>
                          </>
                        )}
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

      {/* Export Modal / Viewer */}
      {selectedExport && (
        <div className="modal-backdrop" onClick={() => setSelectedExport(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={20} color="#C6A45A" />
                <h3 style={{ margin: 0 }}>EVIDENCE DOSSIER PACKAGE</h3>
              </div>
              <button className="btn-close" onClick={() => setSelectedExport(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="integrity-seal-banner">
                <div className="seal-icon-box">
                  <Lock size={22} color="#10B981" />
                </div>
                <div className="seal-text-box">
                  <span className="seal-title">DIGITAL FORENSIC SEAL (SHA-256)</span>
                  <span className="seal-hash font-mono">{selectedExport.integrity_seal_sha256}</span>
                  <span className="seal-meta">
                    Exported at {selectedExport.exported_at} | System Version {selectedExport.version}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                {selectedExport.dossier_type === 'MULE_MATRIX_TOKEN_PROVENANCE_PACKAGE' ? (
                  <>
                    <div className="detail-field">
                      <span className="detail-label">TOKEN IDENTIFIER</span>
                      <span className="detail-value font-mono">{selectedExport.token_id}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">VERIFIED HOPS</span>
                      <span className="detail-value text-cyan">{selectedExport.total_hops} sequence events</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">HASH INTEGRITY</span>
                      <span className="detail-value" style={{ color: '#10B981' }}>{selectedExport.verification_status}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">TAMPER-FREE RECORD</span>
                      <span className="detail-value">{selectedExport.is_tamper_free ? 'YES (SHA-256 Valid)' : 'COMPROMISED'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-field">
                      <span className="detail-label">CASE NUMBER</span>
                      <span className="detail-value">{selectedExport.case_record?.case_number}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">SUSPECT ACCOUNT</span>
                      <span className="detail-value font-mono">{selectedExport.case_record?.suspect_account_id}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">LINKED ALERTS</span>
                      <span className="detail-value">{selectedExport.associated_alerts?.length || 0} alerts included</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">LINEAGE RECEIPTS</span>
                      <span className="detail-value">{selectedExport.verified_lineage_events?.length || 0} events verified</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginTop: '1rem' }}>
                <span className="detail-label">CANONICAL JSON PAYLOAD PREVIEW</span>
                <pre className="json-preview-box">
                  {JSON.stringify(selectedExport, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleCopyJson(selectedExport)}
              >
                <span>{copiedPayload ? '✓ Copied to Clipboard!' : 'Copy JSON Payload'}</span>
              </button>
              <button
                className="btn-primary"
                onClick={() =>
                  handleDownloadJson(
                    selectedExport,
                    `mule_matrix_${selectedExport.dossier_type === 'MULE_MATRIX_TOKEN_PROVENANCE_PACKAGE' ? (selectedExport.token_id || 'lineage') : (selectedExport.case_record?.case_number || 'dossier')}.json`
                  )
                }
              >
                <Download size={14} />
                <span>Download Dossier</span>
              </button>
              <button
                className="btn-action btn-gold"
                onClick={() => {
                  setSelectedExport(null);
                  navigateToModule('RESPOND', 'audit-ledger');
                }}
                title="Inspect Chained Hash in Tamper-Evident Audit Ledger"
              >
                <ShieldCheck size={14} />
                <span>View Audit Ledger Chain →</span>
              </button>
              <button className="btn-secondary" onClick={() => setSelectedExport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {exportLoading && (
        <div className="modal-backdrop">
          <div className="loading-state" style={{ background: '#111722', padding: '2rem', borderRadius: '8px' }}>
            Generating cryptographic case evidence dossier package...
          </div>
        </div>
      )}

      {exportError && (
        <div className="error-banner" style={{ marginTop: '1rem' }}>
          <AlertTriangle size={16} />
          <span>{exportError}</span>
        </div>
      )}
    </div>
  );
};
