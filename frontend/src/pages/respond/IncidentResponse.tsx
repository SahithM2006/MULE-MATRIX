import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Clock,
  FileText,
  CheckCircle,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  User,
  AlertTriangle,
  Cpu,
  Network,
  Lock,
  Flag,
  Share2
} from 'lucide-react';
import { api } from '../../api/client';
import { Case, CaseCreate } from '../../types';
import { useInvestigation } from '../../context/InvestigationContext';

export const IncidentResponse: React.FC = () => {
  const {
    selectedCaseId,
    setSelectedCaseId,
    investigateAccount,
    selectedAccountId,
    setSelectedAccountId,
    selectedTokenId,
    traceToken,
    navigateToModule,
    goToGuidedStage,
    setMilestoneCompleted,
    isTourActive,
    currentTourStep,
    setTourStepStatus
  } = useInvestigation();
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Case Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState(selectedAccountId ? `Investigation - ${selectedAccountId}` : '');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newSuspect, setNewSuspect] = useState(selectedAccountId || 'ACC_HERO_MULE_L2_CONVERGE');
  const [newNote, setNewNote] = useState('');

  // Update Case
  const [noteInput, setNoteInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const caseList = await api.getCases();
      setCases(caseList);

      if (caseList.length > 0) {
        const found = caseList.find((c) => c.case_id === selectedCaseId) || caseList[0];
        setActiveCase(found);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load incident response cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      setNewSuspect(selectedAccountId);
      if (!newTitle) {
        setNewTitle(`Investigation - ${selectedAccountId}`);
      }
    }
  }, [selectedAccountId]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSuspect.trim()) return;

    if (isTourActive && currentTourStep === 7) {
      setTourStepStatus('action_in_progress');
    }

    try {
      const created = await api.createCase({
        title: newTitle.trim(),
        severity: newSeverity,
        suspect_account_id: newSuspect.trim(),
        initial_note: newNote.trim() || undefined,
        alert_ids: []
      });
      setCases([created, ...cases]);
      setActiveCase(created);
      setSelectedCaseId(created.case_id);
      setShowCreateModal(false);
      setNewTitle('');
      setNewNote('');
      if (isTourActive && currentTourStep === 7) {
        setTourStepStatus('action_completed');
      }
    } catch (err: any) {
      if (isTourActive && currentTourStep === 7) {
        setTourStepStatus('error', err.message);
      }
      alert(`Failed to create case: ${err.message}`);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeCase) return;
    try {
      const updated = await api.updateCase(activeCase.case_id, {
        status: newStatus,
        assigned_analyst: activeCase.assigned_analyst || 'Lead Investigator',
        author: 'Lead Investigator'
      });
      setActiveCase(updated);
      setCases(cases.map((c) => (c.case_id === updated.case_id ? updated : c)));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAnalystChange = async (newAnalyst: string) => {
    if (!activeCase) return;
    try {
      const updated = await api.updateCase(activeCase.case_id, {
        assigned_analyst: newAnalyst,
        author: 'Supervisor'
      });
      setActiveCase(updated);
      setCases(cases.map((c) => (c.case_id === updated.case_id ? updated : c)));
    } catch (err: any) {
      alert(`Analyst assignment failed: ${err.message}`);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !noteInput.trim()) return;
    try {
      const updated = await api.updateCase(activeCase.case_id, {
        new_note: noteInput.trim(),
        author: activeCase.assigned_analyst || 'Investigator'
      });
      setActiveCase(updated);
      setCases(cases.map((c) => (c.case_id === updated.case_id ? updated : c)));
      setNoteInput('');
    } catch (err: any) {
      alert(`Failed to add note: ${err.message}`);
    }
  };

  // Simulated Pre-Conversion Review Workflow
  const handlePreConversionReview = async () => {
    if (!activeCase) return;
    try {
      const updated = await api.updateCase(activeCase.case_id, {
        status: 'UNDER_REVIEW',
        new_note: '[SIMULATED PRE-CONVERSION REVIEW] Flagged transfer flow for simulated pre-conversion review prior to cash-out endpoint. (Note: Academic prototype simulation - no real funds blocked).',
        author: 'Fraud Risk Automation'
      });
      setActiveCase(updated);
      setCases(cases.map((c) => (c.case_id === updated.case_id ? updated : c)));
      alert('Simulated Pre-Conversion Review Flag Recorded in Case Dossier and Audit Ledger.\n\nNote: In compliance with prototype constraints, this simulated review flags the flow without freezing genuine currency.');
    } catch (err: any) {
      alert(`Pre-conversion review error: ${err.message}`);
    }
  };

  const statuses = ['NEW', 'INVESTIGATING', 'UNDER_REVIEW', 'ESCALATED', 'CLOSED'];

  return (
    <div className="threat-stream-page">
      {/* Stream Header */}
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <ShieldAlert size={13} />
            <span>STAGE 04 // CASE DISPATCH & FORENSIC RESOLUTION</span>
          </div>
          <h2>Incident Response & Case Management</h2>
          <p className="stream-description">
            Structured forensic case management workstation coordinating investigator triage, evidence collation, cross-screen entity pivot, and simulated pre-conversion review enforcement.
          </p>
        </div>

        <div className="stream-controls">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)} data-tour="initiate-case-btn">
            <Plus size={13} />
            <span>Initiate New Case</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Two-Column Case Management Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Left Column: Case Portfolio List */}
        <div className="hud-panel" data-tour="case-portfolio" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="card-header" style={{ marginBottom: '4px' }}>
            <span className="card-title">
              <Flag size={13} color="var(--accent-gold)" />
              INVESTIGATION PORTFOLIO
            </span>
            <span className="table-count font-mono">{cases.length} cases active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '680px', overflowY: 'auto' }}>
            {cases.map((c) => {
              const isSelected = activeCase?.case_id === c.case_id;
              return (
                <div
                  key={c.case_id}
                  onClick={() => {
                    setActiveCase(c);
                    setSelectedCaseId(c.case_id);
                  }}
                  style={{
                    backgroundColor: isSelected ? 'rgba(198, 164, 90, 0.12)' : 'rgba(21, 27, 39, 0.8)',
                    border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'rgba(117, 150, 200, 0.16)'}`,
                    borderLeft: `3px solid ${isSelected ? 'var(--accent-gold)' : c.severity === 'CRITICAL' ? 'var(--alert-critical)' : 'rgba(117, 150, 200, 0.3)'}`,
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span className="font-mono tabular-nums" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {c.case_number}
                    </span>
                    <span className={`badge ${c.status === 'CLOSED' ? 'badge-low' : c.status === 'ESCALATED' ? 'badge-critical' : 'badge-high'}`}>
                      {c.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {c.title}
                  </div>

                  <div className="font-mono text-muted" style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Target: {c.suspect_account_id.replace('ACC_HERO_', '')}</span>
                    <span>{c.assigned_analyst || 'Unassigned'}</span>
                  </div>
                </div>
              );
            })}

            {cases.length === 0 && !loading && (
              <div className="state-empty" style={{ padding: '30px' }}>
                <p style={{ fontSize: '11px' }}>No active cases found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Case Dossier & Collaboration Timeline */}
        {activeCase ? (
          <div className="hud-panel" data-tour="case-dossier" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Dossier Header & Lifecycle Stepper */}
            <div style={{ borderBottom: '1px solid rgba(117, 150, 200, 0.16)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="tech-tag gold" style={{ fontSize: '9px' }}>{activeCase.case_number}</span>
                    <span className="tech-tag" style={{ fontSize: '9px' }}>SEVERITY: {activeCase.severity}</span>
                  </div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    {activeCase.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Suspect: <strong style={{ color: 'var(--text-primary)' }}>{activeCase.suspect_account_id}</strong>
                    </span>

                    {/* Quick Cross-Screen Action Buttons */}
                    <div style={{ display: 'inline-flex', gap: '6px', marginLeft: '4px' }}>
                      <button
                        className="btn-action"
                        onClick={() => investigateAccount(activeCase.suspect_account_id)}
                        title="Open Account in Detection Lab"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        <Cpu size={10} />
                        <span>Inspect Dossier</span>
                      </button>
                      <button
                        className="btn-action"
                        onClick={() => {
                          setSelectedAccountId(activeCase.suspect_account_id);
                          navigateToModule('TRACE', 'attack-graph');
                        }}
                        title="View Suspect in Attack Graph"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        <Network size={10} />
                        <span>Attack Graph</span>
                      </button>
                      <button
                        className="btn-action btn-gold"
                        onClick={() => {
                          traceToken('TOKR_HERO_500K_GENESIS');
                          navigateToModule('TRACE', 'token-forensics');
                        }}
                        title="Trace Token Lineage"
                        style={{ fontSize: '10px', padding: '2px 8px' }}
                      >
                        <Lock size={10} />
                        <span>Lineage</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status & Analyst Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={activeCase.assigned_analyst || 'Unassigned'}
                    onChange={(e) => handleAnalystChange(e.target.value)}
                    className="filter-select"
                    style={{ height: '32px' }}
                    title="Assign Investigator"
                  >
                    <option value="Unassigned">Assign: Unassigned</option>
                    <option value="Lead Investigator">Assign: Lead Investigator</option>
                    <option value="Senior Fraud Analyst">Assign: Senior Fraud Analyst</option>
                    <option value="AML Compliance Officer">Assign: AML Compliance Officer</option>
                    <option value="Cyber Threat Specialist">Assign: Cyber Threat Specialist</option>
                  </select>

                  <select
                    value={activeCase.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="filter-select"
                    style={{ height: '32px' }}
                  >
                    <option value="NEW">Status: NEW</option>
                    <option value="INVESTIGATING">Status: INVESTIGATING</option>
                    <option value="UNDER_REVIEW">Status: UNDER_REVIEW</option>
                    <option value="ESCALATED">Status: ESCALATED</option>
                    <option value="CLOSED">Status: CLOSED</option>
                  </select>

                  <button
                    className="btn-action btn-gold"
                    onClick={handlePreConversionReview}
                    title="Simulate Pre-Conversion Review Flag"
                    style={{ height: '32px', padding: '0 10px' }}
                  >
                    <AlertOctagon size={13} />
                    <span>Pre-Conversion Review</span>
                  </button>

                  <button
                    className="btn-primary"
                    onClick={() => {
                      setSelectedCaseId(activeCase.case_id);
                      goToGuidedStage(6);
                    }}
                    title="Export sealed case evidence package in Evidence Vault"
                    style={{ height: '32px', padding: '0 12px' }}
                  >
                    <FileText size={13} />
                    <span>Export Evidence Vault →</span>
                  </button>
                </div>
              </div>

              {/* Connected Case Status Stepper */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', overflowX: 'auto' }}>
                {statuses.map((st, i) => {
                  const isCurrent = activeCase.status === st;
                  return (
                    <React.Fragment key={st}>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        style={{
                          background: isCurrent ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.03)',
                          color: isCurrent ? '#080A0F' : 'var(--text-muted)',
                          border: `1px solid ${isCurrent ? 'var(--accent-gold)' : 'rgba(117, 150, 200, 0.2)'}`,
                          padding: '4px 10px',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: isCurrent ? 700 : 500,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          boxShadow: isCurrent ? '0 0 12px rgba(198, 164, 90, 0.35)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        0{i + 1}. {st}
                      </button>
                      {i < statuses.length - 1 && (
                        <ArrowRight size={11} color="rgba(117, 150, 200, 0.3)" style={{ flexShrink: 0 }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Forensic Notes Section */}
            <div>
              <div className="card-header" style={{ marginBottom: '10px' }}>
                <span className="card-title">
                  <FileText size={13} color="var(--accent-gold)" />
                  FORENSIC AUDIT NOTES ({activeCase.notes.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {activeCase.notes.map((n, idx) => (
                  <div
                    key={idx}
                    className="stagger-in"
                    style={{
                      background: 'var(--bg-obsidian)',
                      border: '1px solid rgba(117, 150, 200, 0.16)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '10px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                        {n.author}
                      </span>
                      <span className="font-mono tabular-nums text-muted" style={{ fontSize: '10px' }}>
                        {new Date(n.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Append forensic observation or compliance finding..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="filter-input"
                  style={{ flex: 1, height: '34px' }}
                />
                <button type="submit" className="btn-secondary" style={{ height: '34px' }}>
                  Commit Note
                </button>
              </form>
            </div>

            {/* Investigation Action Timeline */}
            <div>
              <div className="card-header" style={{ marginBottom: '10px' }}>
                <span className="card-title">
                  <Clock size={13} color="var(--steel-blue)" />
                  INVESTIGATION DISPATCH TIMELINE
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '2px solid rgba(117, 150, 200, 0.2)' }}>
                {activeCase.timeline.map((ev, idx) => {
                  const staggerClass = idx < 6 ? `stagger-${idx + 1}` : '';
                  return (
                    <div key={idx} className={`stagger-in ${staggerClass}`} style={{ position: 'relative', paddingLeft: '14px' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '-15px',
                          top: '5px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--accent-gold)',
                          border: '2px solid var(--bg-deep-charcoal)'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span className="font-mono tabular-nums text-muted" style={{ fontSize: '10px' }}>
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 5px' }}>
                          {ev.action}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          by {ev.actor}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-primary)', margin: 0 }}>
                        {ev.details}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="hud-panel state-empty">
            <p>Select or create a case to inspect the investigation record.</p>
          </div>
        )}
      </div>

      {/* Initiate New Case Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card hud-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '14px' }}>INITIATE INVESTIGATION CASE</h3>
              <button className="btn-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateCase}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>CASE TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suspected Convergence Mule Ring"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>SUSPECT ACCOUNT ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ACC_HERO_MULE_L2_CONVERGE"
                    value={newSuspect}
                    onChange={(e) => setNewSuspect(e.target.value)}
                    className="filter-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>SEVERITY LEVEL</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value)}
                    className="filter-select"
                    style={{ width: '100%' }}
                  >
                    <option value="CRITICAL">CRITICAL (Immediate Cashout Risk)</option>
                    <option value="HIGH">HIGH (Layered Transfer Cascade)</option>
                    <option value="MEDIUM">MEDIUM (Anomalous Velocity)</option>
                    <option value="LOW">LOW (Informational Review)</option>
                  </select>
                </div>

                <div>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>INITIAL FORENSIC NOTE</label>
                  <textarea
                    rows={3}
                    placeholder="Describe suspicious topology, counterparty relations, and rationale..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="filter-input"
                    style={{ width: '100%', height: '70px', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-primary" data-tour="create-case-submit-btn">
                  Create Case Dossier
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
