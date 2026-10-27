import React, { useEffect, useState } from 'react';
import { Search, Terminal, UserCheck, Shield, Activity, Compass, Clock, Target } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { api } from '../api/client';
import { SystemHealthResponse } from '../types';

export const Header: React.FC = () => {
  const { investigateAccount, replayGuidedTour, selectedAccountId, navigateToModule } = useInvestigation();
  const [searchInput, setSearchInput] = useState('');
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setUtcTime(d.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      investigateAccount(searchInput.trim());
      setSearchInput('');
    }
  };

  const isHealthy = health?.overall_status === 'HEALTHY' || health?.overall_status === 'OPERATIONAL';

  return (
    <header className="app-header">
      {/* Brand Identity with Custom Geometric Cyber Shield */}
      <div className="brand-section">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer Cyber Shield Boundary */}
            <path
              d="M14 2L4 6.5V13C4 19.5 8.3 25.1 14 26.5C19.7 25.1 24 19.5 24 13V6.5L14 2Z"
              fill="#111722"
              stroke="#C6A45A"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            {/* Inner Directed Graph Nodes */}
            <circle cx="14" cy="9" r="2" fill="#C6A45A" />
            <circle cx="9" cy="16" r="1.8" fill="#7596C8" />
            <circle cx="19" cy="16" r="1.8" fill="#7596C8" />
            <circle cx="14" cy="21" r="1.6" fill="#E05252" />
            {/* Interconnecting Trace Lines */}
            <line x1="14" y1="9" x2="9" y2="16" stroke="#C6A45A" strokeWidth="1.1" strokeDasharray="1.5 1.5" />
            <line x1="14" y1="9" x2="19" y2="16" stroke="#C6A45A" strokeWidth="1.1" strokeDasharray="1.5 1.5" />
            <line x1="9" y1="16" x2="14" y2="21" stroke="#7596C8" strokeWidth="1.1" />
            <line x1="19" y1="16" x2="14" y2="21" stroke="#7596C8" strokeWidth="1.1" />
          </svg>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="brand-title" style={{ letterSpacing: '0.08em' }}>MULE MATRIX</span>
            <span className="tech-tag gold" style={{ fontSize: '9px', padding: '1px 5px' }}>
              v2.4 SEC-OPS
            </span>
          </div>
          <div className="brand-tagline">
            CYBERNETIC AML & DIGITAL FORENSICS WORKSTATION
          </div>
        </div>

        <div className="tech-tag" style={{ borderLeft: '2px solid var(--accent-gold)', marginLeft: '6px' }}>
          <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>SIMULATION</span>
          <span style={{ color: 'var(--text-muted)' }}>//</span>
          <span>HERO ACTIVE</span>
        </div>
      </div>

      {/* Global Actions: Command Search, Live Telemetry, Analyst Profile */}
      <div className="header-actions">
        {/* Global Account Search */}
        <form onSubmit={handleSearch} className="search-input-wrap">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            placeholder="Search Account ID (e.g. ACC_HERO...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="cyber-input"
            style={{ width: '270px', paddingRight: '56px' }}
          />
          <span
            style={{
              position: 'absolute',
              right: '8px',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '1px 5px',
              borderRadius: '2px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              pointerEvents: 'none'
            }}
          >
            Ctrl K
          </span>
        </form>

        {/* Active Target Pivot Indicator (when target is selected) */}
        {selectedAccountId && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(198, 164, 90, 0.12)',
              border: '1px solid rgba(198, 164, 90, 0.45)',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)'
            }}
          >
            <Target size={11} color="var(--accent-gold)" />
            <span style={{ color: 'var(--accent-gold)', fontSize: '9px', fontWeight: 700 }}>TARGET:</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedAccountId.replace('ACC_HERO_', '')}</span>
            <button
              type="button"
              onClick={() => navigateToModule('TRACE', 'attack-graph')}
              style={{ background: 'none', border: 'none', color: '#00D2FF', cursor: 'pointer', fontSize: '10px', textDecoration: 'underline', padding: 0 }}
              title="Trace in Attack Graph"
            >
              Graph ↗
            </button>
            <button
              type="button"
              onClick={() => navigateToModule('DETECT', 'detection-lab')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '10px', textDecoration: 'underline', padding: 0 }}
              title="Inspect Detection Dossier"
            >
              Lab ↗
            </button>
          </div>
        )}

        {/* Live Clock & Backend Telemetry Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(21, 27, 39, 0.8)',
            border: '1px solid rgba(117, 150, 200, 0.15)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <span className={`radar-dot ${isHealthy ? '' : 'critical'}`} />
          <span style={{ color: isHealthy ? '#10B981' : '#E05252', fontWeight: 600, fontSize: '10px', letterSpacing: '0.04em' }}>
            {health ? (isHealthy ? 'SYS-OP' : 'SYS-DEGRADED') : 'CONNECTING'}
          </span>
          <span style={{ color: 'rgba(117, 150, 200, 0.4)' }}>|</span>
          <span style={{ color: 'var(--steel-blue)', fontSize: '10px' }}>
            {utcTime || 'UTC'}
          </span>
        </div>

        {/* Replay Guided Tour CTA */}
        <button
          className="btn-action btn-gold tour-header-replay-btn"
          onClick={replayGuidedTour}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            padding: '4px 10px',
            height: '28px',
            border: '1px solid var(--accent-gold)'
          }}
          title="Replay the 10-step interactive guided walkthrough"
        >
          <Compass size={12} color="var(--accent-gold)" />
          <span>Replay Guided Tour</span>
        </button>

        {/* Analyst Clearance Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(17, 23, 34, 0.9)',
            border: '1px solid var(--border-subtle)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-xs)'
          }}
        >
          <UserCheck size={12} color="var(--steel-blue)" />
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
            LEAD_SEC_01 <span style={{ color: 'var(--accent-gold)' }}>[L3]</span>
          </span>
        </div>
      </div>
    </header>
  );
};
