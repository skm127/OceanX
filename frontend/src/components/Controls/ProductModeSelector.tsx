/**
 * ProductModeSelector.tsx
 * Implements SAGAR-VIEW Blueprint §16 & Copernicus MyOcean Pro benchmark:
 * 1. 🧑‍🔬 Research Mode: Full scientific controls, raw gradients, transects, ML diagnostics
 * 2. 🚨 Operational Mode: Situation Room with real-time warnings, TCHP cyclonic potential, and rapid decision chips
 * 3. 🎓 Learn Mode: Guided educational journey with interactive story cards & camera fly-tos
 * 4. 🗂️ Data Manager Mode: CF-1.8 NetCDF metadata inspector, ingestion quality gates, and API registry
 */
import React from 'react';
import './ProductModeSelector.css';

export type ProductMode = 'research' | 'operational' | 'learn' | 'datamanager';

interface ProductModeSelectorProps {
  currentMode: ProductMode;
  onSelectMode: (mode: ProductMode) => void;
}

export const ProductModeSelector: React.FC<ProductModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  return (
    <div className="product-mode-container" title="SAGAR-VIEW Product Modes (Blueprint §16)">
      <div className="product-mode-track">
        <button
          className={`product-mode-btn ${currentMode === 'research' ? 'active research' : ''}`}
          onClick={() => onSelectMode('research')}
          title="Research Mode: Full scientific workstation with depth soundings, transects, and ML diagnostics"
        >
          <span className="mode-icon">🧑‍🔬</span>
          <span className="mode-text">Research</span>
        </button>

        <button
          className={`product-mode-btn ${currentMode === 'operational' ? 'active operational' : ''}`}
          onClick={() => onSelectMode('operational')}
          title="Operational Mode: Situation Room with real-time marine heatwave warnings and rapid decision chips"
        >
          <span className="mode-icon">🚨</span>
          <span className="mode-text">Situation Room</span>
        </button>

        <button
          className={`product-mode-btn ${currentMode === 'learn' ? 'active learn' : ''}`}
          onClick={() => onSelectMode('learn')}
          title="Learn Mode: Guided interactive educational journey through Indian Ocean dynamics"
        >
          <span className="mode-icon">🎓</span>
          <span className="mode-text">Learn</span>
        </button>

        <button
          className={`product-mode-btn ${currentMode === 'datamanager' ? 'active datamanager' : ''}`}
          onClick={() => onSelectMode('datamanager')}
          title="Data Manager Mode: CF-1.8 NetCDF inspector, ingestion health, and sensor registry"
        >
          <span className="mode-icon">🗂️</span>
          <span className="mode-text">Data Manager</span>
        </button>
      </div>
    </div>
  );
};

export default ProductModeSelector;
