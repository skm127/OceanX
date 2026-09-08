/**
 * DataProvenanceModal.tsx
 * Comprehensive scientific data provenance and methodology dialog.
 * Answers INCOIS and MoES scientific audit criteria with complete transparency.
 */
import React, { useRef } from 'react';
import useModalA11y from '../../hooks/useModalA11y';
import './DataProvenanceModal.css';

interface DataProvenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataProvenanceModal: React.FC<DataProvenanceModalProps> = ({ isOpen, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useModalA11y(isOpen, onClose, cardRef);

  if (!isOpen) return null;

  return (
    <div className="provenance-overlay" onClick={onClose}>
      <div
        ref={cardRef}
        className="provenance-card"
        role="dialog"
        aria-modal="true"
        aria-label="Scientific Data Provenance and Methodology"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="provenance-header">
          <div className="header-title-block">
            <span className="provenance-tag">SCIENTIFIC PROVENANCE & METHODOLOGY</span>
            <h2>DATA AUDIT // INCOIS & ARGO REANALYSIS</h2>
          </div>
          <button className="provenance-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="provenance-content">
          {/* Numerical Ocean Model */}
          <div className="provenance-section">
            <div className="section-title-row">
              <span className="section-icon">🌐</span>
              <h3>1. NUMERICAL OCEAN FORECAST MODEL</h3>
            </div>
            <div className="provenance-grid">
              <div className="prov-item">
                <span className="p-label">Dataset / Model System</span>
                <span className="p-val">INCOIS NEMO-ROMS 4D Reanalysis</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Spatial Resolution</span>
                <span className="p-val">0.25° × 0.25° Grid (113 × 161 Spatial Points)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Coverage Domain</span>
                <span className="p-val">Indian Ocean (0.0°N to 28.0°N, 60.0°E to 100.0°E)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Vertical Structure</span>
                <span className="p-val">14 Standard Depths (0m, 5m, 10m, 20m, 30m, 50m... 500m)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Temporal Resolution</span>
                <span className="p-val">Daily 4D Time Slices (NetCDF-4 CF-1.6 Compliant)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Primary Variables</span>
                <span className="p-val">thetao (Temp °C), so (Salinity PSU), uo & vo (Currents m/s)</span>
              </div>
            </div>
          </div>

          {/* In-Situ Observation Network */}
          <div className="provenance-section">
            <div className="section-title-row">
              <span className="section-icon">📍</span>
              <h3>2. IN-SITU OBSERVATIONAL NETWORK</h3>
            </div>
            <div className="provenance-grid">
              <div className="prov-item">
                <span className="p-label">Observing System</span>
                <span className="p-val">International Argo Profiling Floats</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Data Assembly Centre</span>
                <span className="p-val">INCOIS National Data Centre / GDAC Coriolis</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Active Deployments</span>
                <span className="p-val">8 Autonomous CTD Profiling Buoys</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Sampling Depth Range</span>
                <span className="p-val">Surface (0m) to Deep Twilight (950m)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Sensor Payloads</span>
                <span className="p-val">Sea-Bird SBE 41CP CTD (Temperature, Salinity, Pressure)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Quality Control</span>
                <span className="p-val">Real-time QC Flags (1 = Good Data, 4 = Bad Data filtered)</span>
              </div>
            </div>
          </div>

          {/* Mathematical Alignment & ML Anomaly Detection */}
          <div className="provenance-section">
            <div className="section-title-row">
              <span className="section-icon">🔬</span>
              <h3>3. MATHEMATICAL INTERPOLATION & ML ENGINE</h3>
            </div>
            <div className="provenance-grid">
              <div className="prov-item">
                <span className="p-label">Spatial Interpolation</span>
                <span className="p-val">2D Bilinear Grid Interpolation (xarray interp linear)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Vertical Alignment</span>
                <span className="p-val">Piecewise 1D Depth Spline Interpolation to CTD horizons</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Temporal Alignment</span>
                <span className="p-val">Nearest Model Forecast Epoch to Float Telemetry Timestamp</span>
              </div>
              <div className="prov-item">
                <span className="p-label">ML Anomaly Engine</span>
                <span className="p-val">Scikit-Learn IsolationForest (100 Trees, 15% Contamination)</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Feature Vector (5D)</span>
                <span className="p-val">Mean Δ, Max Δ, Upper 200m Heat Integral, dT/dz, Max Layer Depth</span>
              </div>
              <div className="prov-item">
                <span className="p-label">Grounded AI Analysis</span>
                <span className="p-val">Evidence-derived from computed residuals (Zero Hallucination)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="provenance-footer">
          <span className="footer-note">Ministry of Earth Sciences // Indian National Centre for Ocean Information Services (INCOIS)</span>
          <button className="done-btn" onClick={onClose}>Close Provenance</button>
        </div>
      </div>
    </div>
  );
};

export default DataProvenanceModal;
