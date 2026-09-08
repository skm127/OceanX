/**
 * LayerRail.tsx
 * PRD Section 6: Persistent Left Layer Rail inspired by OSIRIS.
 * Manages active scientific feeds across Model, Observations, Satellite, and Environment.
 */
import React, { useState } from 'react';
import type { OceanVariable } from '../../types';
import './LayerRail.css';

interface LayerRailProps {
  variable: OceanVariable;
  depth: number;
  showCurrents: boolean;
  opacity: number;
  showArgo: boolean;
  showSST: boolean;
  showCyclones: boolean;
  showVolumetricBlock?: boolean;
  verticalExaggeration?: number;
  onVariableChange: (v: OceanVariable) => void;
  onToggleCurrents: () => void;
  onToggleArgo: () => void;
  onToggleSST: () => void;
  onToggleCyclones: () => void;
  onToggleVolumetricBlock?: () => void;
  onVerticalExaggerationChange?: (ex: number) => void;
  onOpacityChange: (op: number) => void;
  onOpenTransect: () => void;
  onOpenRegionAnalysis: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const LayerRail: React.FC<LayerRailProps> = ({
  variable,
  depth,
  showCurrents,
  opacity,
  showArgo,
  showSST,
  showCyclones,
  showVolumetricBlock = true,
  verticalExaggeration = 1.0,
  onVariableChange,
  onToggleCurrents,
  onToggleArgo,
  onToggleSST,
  onToggleCyclones,
  onToggleVolumetricBlock = () => {},
  onVerticalExaggerationChange = () => {},
  onOpacityChange,
  onOpenTransect,
  onOpenRegionAnalysis,
  isOpen,
  onToggleOpen,
}) => {
  const [modelExpanded, setModelExpanded] = useState(true);
  const [obsExpanded, setObsExpanded] = useState(true);
  const [satExpanded, setSatExpanded] = useState(false);
  const [envExpanded, setEnvExpanded] = useState(false);

  return (
    <aside className={`layer-rail ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Rail Tab Toggle Button */}
      <button
        className="layer-rail-toggle-btn"
        onClick={onToggleOpen}
        title={isOpen ? 'Collapse Layer Rail (Key: L)' : 'Expand Layer Rail (Key: L)'}
      >
        <span className="rail-toggle-icon">{isOpen ? '◀' : '▶'}</span>
        <span className="rail-toggle-text">LAYERS</span>
      </button>

      {isOpen && (
        <div className="layer-rail-content">
          <div className="layer-rail-header">
            <div className="layer-rail-title">
              <span className="rail-icon">⬡</span>
              <span>SCIENTIFIC FEEDS</span>
            </div>
            <span className="rail-active-count">
              DEPTH: {depth}M
            </span>
          </div>

          {/* Quick Spatial Tools */}
          <div className="rail-tools-strip">
            <button
              className="rail-tool-btn"
              onClick={onOpenRegionAnalysis}
              title="Draw / Analyze Region (Area, Mean Temp, Residual)"
            >
              ⬚ REGION
            </button>
            <button
              className="rail-tool-btn"
              onClick={onOpenTransect}
              title="Generate Subsurface Depth Transect A ➔ B"
            >
              ⟂ TRANSECT
            </button>
          </div>

          {/* Opacity Control */}
          <div className="rail-slider-group">
            <div className="rail-slider-label">
              <span>LAYER OPACITY</span>
              <span>{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.02"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="rail-range"
            />
          </div>

          {/* 3D Subsurface Volume Block Control matching Image 1 & 2 */}
          <div className="rail-slider-group">
            <div className="rail-slider-label">
              <span>3D VOLUME SLABS</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showVolumetricBlock}
                  onChange={onToggleVolumetricBlock}
                  style={{ accentColor: '#00E5FF' }}
                />
                <span style={{ color: '#00E5FF', fontSize: '9px' }}>{showVolumetricBlock ? 'ON' : 'OFF'}</span>
              </label>
            </div>
            <div className="rail-slider-label" style={{ marginTop: '4px' }}>
              <span>VERTICAL EXAGGERATION</span>
              <span>{verticalExaggeration.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={verticalExaggeration}
              onChange={(e) => onVerticalExaggerationChange(parseFloat(e.target.value))}
              className="rail-range"
            />
          </div>

          {/* Group 1: Numerical Model */}
          <div className="feed-category">
            <div
              className="category-header"
              onClick={() => setModelExpanded(!modelExpanded)}
            >
              <span className="category-title">NUMERICAL MODEL (NEMO 4D)</span>
              <span className="category-arrow">{modelExpanded ? '▾' : '▸'}</span>
            </div>
            {modelExpanded && (
              <div className="category-items">
                <label
                  className={`feed-item ${variable === 'thetao' ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="model_var"
                    checked={variable === 'thetao'}
                    onChange={() => onVariableChange('thetao')}
                  />
                  <span className="feed-label">Temperature (θ)</span>
                  <span className="feed-badge">°C</span>
                </label>

                <label
                  className={`feed-item ${variable === 'so' ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="model_var"
                    checked={variable === 'so'}
                    onChange={() => onVariableChange('so')}
                  />
                  <span className="feed-label">Salinity (S)</span>
                  <span className="feed-badge">PSU</span>
                </label>

                <label
                  className={`feed-item ${showCurrents ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={showCurrents}
                    onChange={onToggleCurrents}
                  />
                  <span className="feed-label">3D Current Vectors</span>
                  <span className="feed-badge cyan">VECTORS</span>
                </label>
              </div>
            )}
          </div>

          {/* Group 2: In-Situ Observations */}
          <div className="feed-category">
            <div
              className="category-header"
              onClick={() => setObsExpanded(!obsExpanded)}
            >
              <span className="category-title">IN-SITU OBSERVATIONS</span>
              <span className="category-arrow">{obsExpanded ? '▾' : '▸'}</span>
            </div>
            {obsExpanded && (
              <div className="category-items">
                <label
                  className={`feed-item ${showArgo ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={showArgo}
                    onChange={onToggleArgo}
                  />
                  <span className="feed-label">Argo Profiling Fleet</span>
                  <span className="feed-badge green">LIVE (8)</span>
                </label>

                <label className="feed-item disabled" title="Autonomous Glider feed standby">
                  <input type="checkbox" disabled />
                  <span className="feed-label muted">Ocean Gliders</span>
                  <span className="feed-badge faint">STANDBY</span>
                </label>

                <label className="feed-item disabled" title="Moored buoy arrays standby">
                  <input type="checkbox" disabled />
                  <span className="feed-label muted">Moored Buoys (OMNI)</span>
                  <span className="feed-badge faint">STANDBY</span>
                </label>
              </div>
            )}
          </div>

          {/* Group 3: Satellite Data */}
          <div className="feed-category">
            <div
              className="category-header"
              onClick={() => setSatExpanded(!satExpanded)}
            >
              <span className="category-title">SATELLITE TELEMETRY</span>
              <span className="category-arrow">{satExpanded ? '▾' : '▸'}</span>
            </div>
            {satExpanded && (
              <div className="category-items">
                <label
                  className={`feed-item ${showSST ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={showSST}
                    onChange={onToggleSST}
                  />
                  <span className="feed-label">MODIS Infrared SST</span>
                  <span className="feed-badge">NASA</span>
                </label>

                <label className="feed-item disabled" title="Sea Level Anomaly standby">
                  <input type="checkbox" disabled />
                  <span className="feed-label muted">Sea Level Anomaly (SLA)</span>
                  <span className="feed-badge faint">ALTIMETRY</span>
                </label>
              </div>
            )}
          </div>

          {/* Group 4: Environment & Disasters */}
          <div className="feed-category">
            <div
              className="category-header"
              onClick={() => setEnvExpanded(!envExpanded)}
            >
              <span className="category-title">HAZARDS & ENVIRONMENT</span>
              <span className="category-arrow">{envExpanded ? '▾' : '▸'}</span>
            </div>
            {envExpanded && (
              <div className="category-items">
                <label
                  className={`feed-item ${showCyclones ? 'active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={showCyclones}
                    onChange={onToggleCyclones}
                  />
                  <span className="feed-label">Cyclone Track Hazards</span>
                  <span className="feed-badge red">IMD/JTWC</span>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default LayerRail;
