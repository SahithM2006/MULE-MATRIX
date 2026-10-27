import React from 'react';
import { ShieldAlert, CheckCircle2, FileCheck } from 'lucide-react';

export const TermsOfUse: React.FC = () => {
  return (
    <div className="threat-stream-page" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="stream-header">
        <div className="stream-title-group">
          <div className="stream-badge">
            <FileCheck size={14} />
            <span>TERMS OF EVALUATION</span>
          </div>
          <h2>Terms of Use and Research Evaluation</h2>
          <p className="stream-description">
            Operational boundaries, security disclaimers, and terms governing the use of MULE MATRIX.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <ShieldAlert size={20} color="#E05252" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
            1. Authorized Evaluation Scope
          </h3>
        </div>
        <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.9rem' }}>
          MULE MATRIX is provided strictly for technical evaluation, educational demonstrations, and cybersecurity research. It is designed to demonstrate multi-engine graph analytics, cryptographic token lineage tracking, and inductive GraphSAGE machine learning for detecting synthetic financial mule patterns.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <CheckCircle2 size={20} color="#10B981" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
            2. Intellectual Property and Open Research
          </h3>
        </div>
        <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.9rem' }}>
          The graph neural network algorithms, sliding-window temporal analyzers, and hash chaining implementations reflect established academic literature (including Hamilton et al., 2017) and open technical specifications. Use in commercial production environments requires independent compliance validation and enterprise key management.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <FileCheck size={20} color="#7596C8" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
            3. Disclaimer of Operational Warranty
          </h3>
        </div>
        <p style={{ color: '#94A3B8', lineHeight: 1.6, fontSize: '0.9rem' }}>
          The software is provided on an AS-IS basis without warranties of any kind. Synthetic benchmark metrics (such as Precision, Recall, and F1 scores) reflect controlled synthetic scenarios and must be calibrated on verified ground truth prior to deployment in real-world anti-money-laundering (AML) operations.
        </p>
      </div>
    </div>
  );
};
