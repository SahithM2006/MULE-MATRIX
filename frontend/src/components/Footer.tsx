import React from 'react';
import { useInvestigation } from '../context/InvestigationContext';

export const Footer: React.FC = () => {
  const { navigateToModule } = useInvestigation();

  return (
    <footer className="app-footer">
      <div>
        <span>MULE MATRIX v1.0.0</span>
        <span style={{ margin: '0 8px' }}>|</span>
        <span>Simulated e-rupee token provenance and graph threat intelligence prototype.</span>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          onClick={() => navigateToModule('TOOLS', 'privacy')}
          style={{ background: 'none', border: 'none', color: '#7596C8', cursor: 'pointer', fontSize: '12px' }}
        >
          Privacy Policy
        </button>
        <button
          onClick={() => navigateToModule('TOOLS', 'terms')}
          style={{ background: 'none', border: 'none', color: '#7596C8', cursor: 'pointer', fontSize: '12px' }}
        >
          Terms of Use
        </button>
      </div>
    </footer>
  );
};
