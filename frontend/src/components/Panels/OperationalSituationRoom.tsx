/**
 * OperationalSituationRoom.tsx
 * Implements SAGAR-VIEW Blueprint §8.7 & §16 (Operational Situation Room):
 * - Real-time disaster-management & forecaster overview
 * - Subsurface Marine Heatwave warning indicators
 * - High Tropical Cyclone Heat Potential (TCHP) alerts
 * - Quick-action jumping to high-divergence platforms
 *
 * All headline numbers (anomaly magnitude/depth/float, TCHP reading, platform
 * counts) come from live backend data passed by App.tsx; props are optional so
 * the banner still renders (with honest "—" placeholders) if a fetch failed.
 */
import React from 'react';
import { AlertTriangle, Activity, Radio, Waves, ArrowRight } from 'lucide-react';
import './OperationalSituationRoom.css';

export interface SituationRoomData {
  /** platform_id of the highest-anomaly float, e.g. "2902345". */
  topFloatId: string | null;
  maxDelta: number | null;
  maxDepth: number | null;
  tchpKjCm2: number | null;
  argoCount: number;
  buoyCount: number;
  gliderCount: number;
}

interface OperationalSituationRoomProps {
  data: SituationRoomData;
  onJumpToAnomaly: () => void;
  onJumpToBuoy: (buoyId: string) => void;
  onClose: () => void;
}

export const OperationalSituationRoom: React.FC<OperationalSituationRoomProps> = ({
  data,
  onJumpToAnomaly,
  onJumpToBuoy,
  onClose,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const total = data.argoCount + data.buoyCount + data.gliderCount;
  const fmtDelta = data.maxDelta != null ? `+${data.maxDelta.toFixed(2)}°C` : '—';
  const fmtDepth = data.maxDepth != null ? `${Math.round(data.maxDepth)}m` : '—';
  const fmtTchp = data.tchpKjCm2 != null ? `${data.tchpKjCm2.toFixed(1)} kJ/cm²` : null;
  // Never claim a status for data we don't have — enable the TCHP layer to populate it.
  const tchpStatus = fmtTchp ? (data.tchpKjCm2! >= 50 ? '(Elevated)' : '(Nominal)') : '(Enable TCHP layer)';
  const fleetSub = `${data.argoCount} Argo • ${data.buoyCount} OMNI/RAMA Buoys • ${data.gliderCount} Glider`;

  return (
    <div className={`situation-room-banner ${collapsed ? 'collapsed' : ''}`}>
      <div className="sr-header">
        <div className="sr-title-group">
          <span className="sr-pulse-dot" />
          <span className="sr-badge">OPERATIONAL SITUATION ROOM</span>
          <span className="sr-subtext">INCOIS National Ocean Decision Support System</span>
        </div>
        <div className="sr-header-actions">
          <button
            className="sr-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand Situation Room' : 'Collapse to Ticker'}
          >
            {collapsed ? '▾ EXPAND' : '▴ COLLAPSE'}
          </button>
          <button className="sr-close-btn" onClick={onClose} title="Switch to Research Workstation">
            ✕
          </button>
        </div>
      </div>

      {collapsed ? (
        <div className="sr-ticker-row">
          <div className="sr-ticker-item">
            <span className="sr-ticker-tag critical">
              <AlertTriangle size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              CRITICAL
            </span>
            <span className="sr-ticker-text">{fmtDelta} Subsurface Heatwave (Float #{data.topFloatId ?? '—'} @ {fmtDepth})</span>
            <button className="sr-ticker-btn" onClick={onJumpToAnomaly}>
              INTERROGATE <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
          <div className="sr-ticker-sep">|</div>
          <div className="sr-ticker-item">
            <span className="sr-ticker-tag warning">
              <Activity size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              CYCLONE
            </span>
            <span className="sr-ticker-text">TCHP {fmtTchp ?? '—'} {tchpStatus} (Central Bay of Bengal)</span>
            <button className="sr-ticker-btn" onClick={() => onJumpToBuoy('buoy_BD08')}>
              INSPECT <ArrowRight size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
          <div className="sr-ticker-sep">|</div>
          <div className="sr-ticker-item">
            <span className="sr-ticker-tag live">
              <Radio size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              LIVE
            </span>
            <span className="sr-ticker-text">{total} Platforms Synced</span>
          </div>
        </div>
      ) : (
        <div className="sr-body">
          {/* Status Metrics Strip */}
          <div className="sr-metric-tile critical">
            <div className="sr-tile-icon"><AlertTriangle size={20} /></div>
            <div className="sr-tile-content">
              <span className="sr-tile-label">CRITICAL WARNING</span>
              <span className="sr-tile-value">{fmtDelta} Subsurface Heatwave</span>
              <span className="sr-tile-sub">Trapped heat at {fmtDepth} (Float #{data.topFloatId ?? '—'})</span>
            </div>
            <button className="sr-action-btn pulse" onClick={onJumpToAnomaly}>
              INTERROGATE <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            </button>
          </div>

          <div className="sr-metric-tile warning">
            <div className="sr-tile-icon"><Activity size={20} /></div>
            <div className="sr-tile-content">
              <span className="sr-tile-label">CYCLONE RISK (TCHP)</span>
              <span className="sr-tile-value">{fmtTchp ?? '—'} {tchpStatus}</span>
              <span className="sr-tile-sub">Central Bay of Bengal (Buoy BD08)</span>
            </div>
            <button className="sr-action-btn" onClick={() => onJumpToBuoy('buoy_BD08')}>
              INSPECT <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            </button>
          </div>

          <div className="sr-metric-tile nominal">
            <div className="sr-tile-icon"><Waves size={20} /></div>
            <div className="sr-tile-content">
              <span className="sr-tile-label">COASTAL SURVEILLANCE</span>
              <span className="sr-tile-value">{total} Platforms Synchronized</span>
              <span className="sr-tile-sub">{fleetSub}</span>
            </div>
            <span className="sr-status-pill live">FEED LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalSituationRoom;
