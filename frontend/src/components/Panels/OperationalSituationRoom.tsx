/**
 * OperationalSituationRoom.tsx
 * Implements SAGAR-VIEW Blueprint §8.7 & §16 (Operational Situation Room):
 * - Real-time disaster-management & forecaster overview
 * - Subsurface Marine Heatwave warning indicators
 * - High Tropical Cyclone Heat Potential (TCHP) alerts
 * - Quick-action jumping to high-divergence platforms
 */
import React from 'react';
import './OperationalSituationRoom.css';

interface OperationalSituationRoomProps {
  onJumpToAnomaly: () => void;
  onJumpToBuoy: (buoyId: string) => void;
  onClose: () => void;
}

export const OperationalSituationRoom: React.FC<OperationalSituationRoomProps> = ({
  onJumpToAnomaly,
  onJumpToBuoy,
  onClose,
}) => {
  return (
    <div className="situation-room-banner">
      <div className="sr-header">
        <div className="sr-title-group">
          <span className="sr-pulse-dot" />
          <span className="sr-badge">OPERATIONAL SITUATION ROOM</span>
          <span className="sr-subtext">INCOIS National Ocean Decision Support System</span>
        </div>
        <button className="sr-close-btn" onClick={onClose} title="Switch to Research Workstation">
          ✕
        </button>
      </div>

      <div className="sr-body">
        {/* Status Metrics Strip */}
        <div className="sr-metric-tile critical">
          <div className="sr-tile-icon">🚨</div>
          <div className="sr-tile-content">
            <span className="sr-tile-label">CRITICAL WARNING</span>
            <span className="sr-tile-value">+3.22°C Subsurface Heatwave</span>
            <span className="sr-tile-sub">Trapped heat at 110m (Float #2902345)</span>
          </div>
          <button className="sr-action-btn pulse" onClick={onJumpToAnomaly}>
            INTERROGATE ➔
          </button>
        </div>

        <div className="sr-metric-tile warning">
          <div className="sr-tile-icon">🌀</div>
          <div className="sr-tile-content">
            <span className="sr-tile-label">CYCLONE RISK (TCHP)</span>
            <span className="sr-tile-value">78.4 kJ/cm² (Elevated)</span>
            <span className="sr-tile-sub">Central Bay of Bengal (Buoy BD08)</span>
          </div>
          <button className="sr-action-btn" onClick={() => onJumpToBuoy('buoy_BD08')}>
            INSPECT ➔
          </button>
        </div>

        <div className="sr-metric-tile nominal">
          <div className="sr-tile-icon">🌊</div>
          <div className="sr-tile-content">
            <span className="sr-tile-label">COASTAL SURVEILLANCE</span>
            <span className="sr-tile-value">14 Platforms Synchronized</span>
            <span className="sr-tile-sub">8 Argo • 5 OMNI/RAMA Buoys • 1 Glider</span>
          </div>
          <span className="sr-status-pill live">FEED LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default OperationalSituationRoom;
