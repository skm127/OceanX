/**
 * ExplainabilityToggle.tsx
 * FR-15: Citizen vs Scientist Dual-Lens Explainability Switch.
 * Seamlessly adapts ocean intelligence between plain English for citizens/disaster managers
 * and rigorous quantitative physics for research scientists.
 */
import React from 'react';
import './ExplainabilityToggle.css';

export type ExplainMode = 'citizen' | 'scientist';

interface ExplainabilityToggleProps {
  mode: ExplainMode;
  onChange: (mode: ExplainMode) => void;
}

export const ExplainabilityToggle: React.FC<ExplainabilityToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="explain-toggle-container">
      <div className="explain-toggle-track">
        <button
          className={`explain-toggle-btn citizen ${mode === 'citizen' ? 'active' : ''}`}
          onClick={() => onChange('citizen')}
          title="Citizen Lens: Plain English explanations for citizens, students, and disaster responders"
        >
          <span className="mode-dot citizen" />
          <span className="mode-label">Citizen View</span>
        </button>

        <button
          className={`explain-toggle-btn scientist ${mode === 'scientist' ? 'active' : ''}`}
          onClick={() => onChange('scientist')}
          title="Scientist Lens: Rigorous quantitative metrics and isopycnal physics for ocean researchers"
        >
          <span className="mode-dot scientist" />
          <span className="mode-label">Scientist View</span>
        </button>
      </div>
    </div>
  );
};

export default ExplainabilityToggle;
