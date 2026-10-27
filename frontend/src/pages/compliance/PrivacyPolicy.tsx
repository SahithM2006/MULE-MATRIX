import React from 'react';
import { ShieldCheck, Lock, AlertCircle, FileText } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="threat-stream-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <Lock size={14} />
            <span>LEGAL & COMPLIANCE</span>
          </div>
          <h2>Privacy and Synthetic Data Policy</h2>
          <p className="stream-description">
            Information handling, cryptographic audit standards, and synthetic privacy boundaries for MULE MATRIX.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <AlertCircle size={20} color="#C6A45A" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
            1. Synthetic Non-Production Data Statement
          </h3>
        </div>
        <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.9rem' }}>
          MULE MATRIX is an advanced cybersecurity and financial threat-intelligence research prototype. All entity identifiers, bank account numbers, transaction hashes, token serials, and individual names appearing in this software are entirely synthetic and procedurally generated. No actual banking data, personal identifiable information (PII), or real-world consumer records are processed, stored, or transmitted by this application.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <ShieldCheck size={20} color="#10B981" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
            2. Cryptographic Audit Logging
          </h3>
        </div>
        <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.9rem' }}>
          All investigative actions conducted within this interface (including case creation, evidence exports, and parameter modifications) are recorded in an append-only, tamper-evident audit ledger chained with SHA-256 hashes. These records serve exclusively to demonstrate forensic integrity and chain-of-custody verification workflows.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <FileText size={20} color="#7596C8" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
            3. Local Storage and Data Persistence
          </h3>
        </div>
        <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.9rem' }}>
          Data is persisted locally in an SQLite database using Write-Ahead Logging (WAL) mode within your deployment environment. No telemetry, user analytics, or session fingerprints are transmitted to external cloud servers or third-party tracking services.
        </p>
      </div>
    </div>
  );
};
