import React, { useState } from 'react';
import './Sidebar.css';
import {
  Eye,
  Activity,
  Network,
  Lock,
  Cpu,
  BarChart3,
  ShieldAlert,
  FileCheck,
  ScrollText,
  Sliders,
  PlayCircle,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { useInvestigation, ThreatStage, ThreatModule } from '../context/InvestigationContext';

interface NavItem {
  id: ThreatModule;
  stage: ThreatStage;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

interface NavSection {
  step: string;
  stage: ThreatStage;
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    step: '01',
    stage: 'OBSERVE',
    title: 'OBSERVE',
    items: [
      { id: 'sentinel', stage: 'OBSERVE', label: 'Sentinel Command', badge: 'LIVE', icon: Eye },
      { id: 'threat-stream', stage: 'OBSERVE', label: 'Threat Stream', icon: Activity },
    ],
  },
  {
    step: '02',
    stage: 'TRACE',
    title: 'TRACE',
    items: [
      { id: 'attack-graph', stage: 'TRACE', label: 'Attack Graph', badge: 'BFS', icon: Network },
      { id: 'token-forensics', stage: 'TRACE', label: 'Token Forensics', badge: 'SHA-256', icon: Lock },
    ],
  },
  {
    step: '03',
    stage: 'DETECT',
    title: 'DETECT',
    items: [
      { id: 'detection-lab', stage: 'DETECT', label: 'Detection Lab', badge: '8 ENG', icon: Cpu },
      { id: 'model-observatory', stage: 'DETECT', label: 'Model Observatory', icon: BarChart3 },
    ],
  },
  {
    step: '04',
    stage: 'RESPOND',
    title: 'RESPOND',
    items: [
      { id: 'incident-response', stage: 'RESPOND', label: 'Incident Response', icon: ShieldAlert },
      { id: 'evidence-vault', stage: 'RESPOND', label: 'Evidence Vault', badge: 'SEALED', icon: FileCheck },
      { id: 'audit-ledger', stage: 'RESPOND', label: 'Audit Ledger', icon: ScrollText },
    ],
  },
  {
    step: 'SYS',
    stage: 'TOOLS',
    title: 'UTILITIES & LAB',
    items: [
      { id: 'simulator', stage: 'TOOLS', label: 'Scenario Simulator', badge: 'SYNTH', icon: Sliders },
      { id: 'replay', stage: 'TOOLS', label: 'Hero Replay', icon: PlayCircle },
      { id: 'health', stage: 'TOOLS', label: 'System Health', icon: HeartPulse },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { activeModule, activeStage, navigateToModule } = useInvestigation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`intelligence-sidebar ${isCollapsed ? 'collapsed' : ''}`}
      aria-label="Intelligence Navigation Sidebar"
    >
      {/* Sidebar Header & Toggle */}
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-brand-summary">
            <span className="sidebar-dot" />
            <span className="sidebar-pipeline-title">INVESTIGATION WORKFLOW</span>
          </div>
        )}
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav-container">
        {SECTIONS.map((section) => {
          const isSectionActive = activeStage === section.stage;
          return (
            <div key={section.stage} className={`sidebar-section ${isSectionActive ? 'active-section' : ''}`}>
              {!isCollapsed && (
                <div className="sidebar-section-header">
                  <span className="section-step-num">{section.step}</span>
                  <span className="section-title">{section.title}</span>
                </div>
              )}

              <div className="sidebar-section-items">
                {section.items.map((item) => {
                  const isActive = activeModule === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => navigateToModule(item.stage, item.id)}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={`${item.label} (${section.title})`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="nav-item-icon">
                        <Icon size={15} style={{ color: isActive ? 'var(--accent-gold)' : undefined }} />
                      </span>

                      {!isCollapsed && (
                        <div className="nav-item-content">
                          <span className="nav-item-label">{item.label}</span>
                          {item.badge && (
                            <span className={`nav-item-badge ${isActive ? 'active' : ''}`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {isActive && <span className="active-indicator" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer Indicator */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="security-posture-box">
            <div className="posture-header">
              <Shield size={12} color="var(--steel-blue)" />
              <span className="posture-title">ENGINE INTEGRITY</span>
            </div>
            <div className="posture-meta">
              <span className="meta-dot online" />
              <span>8 ENGINES SYNCHRONIZED</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

