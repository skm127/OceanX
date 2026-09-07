/**
 * DataSourceBadge.tsx
 * Explicit, transparent data provenance indicator:
 * - [ ● LIVE STREAM ] (Real INCOIS NetCDF FastAPI backend)
 * - [ ◆ SIMULATED DATA ] (Client-side physical simulation)
 * Eliminates silent fabrication and guarantees scientific integrity.
 */
import React, { useState, useEffect } from 'react';
import {
  getDataSourceMode,
  setForceDemoMode,
  onDataSourceModeChange,
  type DataSourceMode,
} from '../../services/api';
import './DataSourceBadge.css';

export const DataSourceBadge: React.FC = () => {
  const [mode, setMode] = useState<DataSourceMode>(getDataSourceMode());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsub = onDataSourceModeChange((newMode) => {
      setMode(newMode);
    });
    return () => {
      unsub();
    };
  }, []);

  const isLive = mode === 'live';

  return (
    <div className="data-source-wrapper">
      <button
        className={`data-source-badge ${isLive ? 'live' : 'demo'}`}
        onClick={() => setMenuOpen(!menuOpen)}
        title={
          isLive
            ? 'Connected to live INCOIS NetCDF backend. Click to inspect source.'
            : 'Operating in client-side simulation mode. Click to toggle.'
        }
      >
        <span className={`source-dot ${isLive ? 'live' : 'demo'}`}>
          {isLive ? '●' : '◆'}
        </span>
        <span className="source-label">
          {isLive ? 'LIVE INCOIS' : 'SIMULATED DATA'}
        </span>
      </button>

      {menuOpen && (
        <div className="data-source-popover" onClick={(e) => e.stopPropagation()}>
          <div className="popover-header">
            <span>DATA PIPELINE INTEGRITY</span>
            <button className="popover-close" onClick={() => setMenuOpen(false)}>✕</button>
          </div>
          <div className="popover-status">
            <div className="status-row">
              <span className="status-k">Pipeline Status:</span>
              <span className={`status-v ${isLive ? 'live' : 'demo'}`}>
                {isLive ? 'Connected (Port 8000)' : 'Simulation Fallback'}
              </span>
            </div>
            <div className="status-row">
              <span className="status-k">Model Dataset:</span>
              <span className="status-v">INCOIS NEMO-ROMS 4D</span>
            </div>
            <div className="status-row">
              <span className="status-k">In-Situ Floats:</span>
              <span className="status-v">8 Argo Profilers</span>
            </div>
          </div>
          <div className="popover-footer">
            <button
              className="toggle-mode-btn"
              onClick={() => {
                setForceDemoMode(isLive);
                setMenuOpen(false);
              }}
            >
              {isLive ? 'Switch to Offline Demo Mode' : 'Attempt Reconnect to Live API'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSourceBadge;
