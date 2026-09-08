/**
 * FleetSidebar — In-Situ Multi-Sensor Platform Manager (INCOIS Network).
 * Blueprint §7 & §15: Unified inventory of Argo Profilers, OMNI/RAMA Moored Buoys, and Ocean Gliders.
 */
import { useState, useMemo } from 'react';
import type { ArgoProfileSummary } from '../../types';
import './FleetSidebar.css';

interface FleetSidebarProps {
  profiles: ArgoProfileSummary[];
  selectedId: string | null;
  isOpen: boolean;
  railOpen?: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

const MOORED_BUOYS = [
  { id: 'buoy_BD08', platform_id: 'BD08', name: 'Bay of Bengal OMNI Buoy', basin: 'Bay of Bengal', latitude: 13.0, longitude: 84.0, max_depth: 500, type: 'INCOIS OMNI', status: 'warning', statusLabel: 'ELEVATED TCHP' },
  { id: 'buoy_BD11', platform_id: 'BD11', name: 'Central Bay of Bengal OMNI', basin: 'Bay of Bengal', latitude: 15.5, longitude: 86.5, max_depth: 500, type: 'INCOIS OMNI', status: 'nominal', statusLabel: 'NOMINAL' },
  { id: 'buoy_AD02', platform_id: 'AD02', name: 'Arabian Sea OMNI Buoy', basin: 'Arabian Sea', latitude: 15.0, longitude: 69.0, max_depth: 500, type: 'INCOIS OMNI', status: 'nominal', statusLabel: 'NOMINAL' },
  { id: 'buoy_AD07', platform_id: 'AD07', name: 'Lakshadweep RAMA Buoy', basin: 'Arabian Sea', latitude: 10.5, longitude: 72.5, max_depth: 200, type: 'MoES RAMA', status: 'nominal', statusLabel: 'NOMINAL' },
  { id: 'buoy_RAMA_EQ', platform_id: 'RAMA_EQ', name: 'Equatorial RAMA Buoy', basin: 'Equatorial Indian Ocean', latitude: 0.0, longitude: 80.5, max_depth: 200, type: 'MoES RAMA', status: 'nominal', statusLabel: 'NOMINAL' },
];

const GLIDER_MISSIONS = [
  { id: 'glider_bob_01', platform_id: 'GLIDER_BOB_01', name: 'Visakhapatnam Shelf Coastal Glider', basin: 'Bay of Bengal', latitude: 16.0, longitude: 85.5, max_depth: 200, type: 'Ocean Glider', status: 'nominal', statusLabel: 'ACTIVE SAWTOOTH' },
];

export default function FleetSidebar({
  profiles,
  selectedId,
  isOpen,
  railOpen = false,
  onToggle,
  onSelect,
}: FleetSidebarProps) {
  const [activeTab, setActiveTab] = useState<'argo' | 'buoys' | 'gliders'>('argo');

  // Group argo profiles by ocean basin
  const basins = useMemo(() => {
    const bob: ArgoProfileSummary[] = [];
    const arabian: ArgoProfileSummary[] = [];
    const equatorial: ArgoProfileSummary[] = [];

    profiles.forEach((p) => {
      if (p.latitude < 6.0) {
        equatorial.push(p);
      } else if (p.longitude >= 77.0) {
        bob.push(p);
      } else {
        arabian.push(p);
      }
    });

    return [
      { name: 'Bay of Bengal Basin', count: bob.length, list: bob },
      { name: 'Arabian Sea Basin', count: arabian.length, list: arabian },
      { name: 'Equatorial Indian Ocean', count: equatorial.length, list: equatorial },
    ];
  }, [profiles]);

  if (!isOpen) {
    return null;
  }

  const totalPlatforms = profiles.length + MOORED_BUOYS.length + GLIDER_MISSIONS.length;

  return (
    <div className={`fleet-sidebar ${railOpen ? 'with-layer-rail' : ''}`}>
      <div className="fleet-header">
        <div className="fleet-header-title">
          <span>📡</span>
          <h4>INCOIS Sensor Network</h4>
          <span className="fleet-header-badge">{totalPlatforms} Platforms</span>
        </div>
        <button className="fleet-close-btn" onClick={onToggle} title="Close Fleet Drawer">
          ✕
        </button>
      </div>

      {/* Sensor Category Filter Tabs */}
      <div className="fleet-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(56, 189, 248, 0.2)', background: 'rgba(0, 0, 0, 0.2)' }}>
        <button
          className={`fleet-tab-btn ${activeTab === 'argo' ? 'active' : ''}`}
          onClick={() => setActiveTab('argo')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 600,
            background: activeTab === 'argo' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'argo' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'argo' ? '2px solid #38bdf8' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          ARGO ({profiles.length})
        </button>
        <button
          className={`fleet-tab-btn ${activeTab === 'buoys' ? 'active' : ''}`}
          onClick={() => setActiveTab('buoys')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 600,
            background: activeTab === 'buoys' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
            color: activeTab === 'buoys' ? '#fbbf24' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'buoys' ? '2px solid #fbbf24' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          BUOYS ({MOORED_BUOYS.length})
        </button>
        <button
          className={`fleet-tab-btn ${activeTab === 'gliders' ? 'active' : ''}`}
          onClick={() => setActiveTab('gliders')}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '10px',
            fontFamily: 'monospace',
            fontWeight: 600,
            background: activeTab === 'gliders' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
            color: activeTab === 'gliders' ? '#34d399' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'gliders' ? '2px solid #34d399' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          GLIDER ({GLIDER_MISSIONS.length})
        </button>
      </div>

      <div className="fleet-body">
        {/* Tab 1: Argo Profiles */}
        {activeTab === 'argo' && basins.map((basin) => (
          <div key={basin.name} className="basin-section">
            <div className="basin-title">
              {basin.name} ({basin.count})
            </div>
            {basin.list.map((p) => {
              const isCritical = p.platform_id === '2902345';
              const isWarning = p.platform_id === '2904001';
              const statusClass = isCritical ? 'critical' : isWarning ? 'warning' : 'nominal';
              const statusLabel = isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOMINAL';
              const isSelected = selectedId === p.id;

              return (
                <div
                  key={p.id}
                  className={`float-card ${statusClass} ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelect(p.id)}
                >
                  <div className="float-card-left">
                    <div className="float-card-id">
                      <span className={`float-status-dot ${statusClass}`} />
                      <span>#{p.platform_id}</span>
                    </div>
                    <span className="float-card-coords">
                      {p.latitude.toFixed(1)}°N, {p.longitude.toFixed(1)}°E
                    </span>
                  </div>

                  <div className="float-card-right">
                    <span className={`float-card-tag ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <span className="float-card-depth">{p.max_depth}m sounding</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Tab 2: Moored Buoys */}
        {activeTab === 'buoys' && (
          <div className="basin-section">
            <div className="basin-title">Moored Surface & Subsurface Buoys (5)</div>
            {MOORED_BUOYS.map((b) => {
              const isSelected = selectedId === b.id;
              return (
                <div
                  key={b.id}
                  className={`float-card ${b.status} ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelect(b.id)}
                >
                  <div className="float-card-left">
                    <div className="float-card-id">
                      <span className={`float-status-dot ${b.status}`} />
                      <span>#{b.platform_id}</span>
                      <span style={{ fontSize: '9px', color: '#94a3b8', marginLeft: '4px' }}>{b.type}</span>
                    </div>
                    <span className="float-card-coords">
                      {b.latitude.toFixed(1)}°N, {b.longitude.toFixed(1)}°E • {b.basin}
                    </span>
                  </div>

                  <div className="float-card-right">
                    <span className={`float-card-tag ${b.status}`}>
                      {b.statusLabel}
                    </span>
                    <span className="float-card-depth">{b.max_depth}m chain</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Gliders */}
        {activeTab === 'gliders' && (
          <div className="basin-section">
            <div className="basin-title">Underwater Autonomous Gliders (1)</div>
            {GLIDER_MISSIONS.map((g) => {
              const isSelected = selectedId === g.id;
              return (
                <div
                  key={g.id}
                  className={`float-card nominal ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelect(g.id)}
                >
                  <div className="float-card-left">
                    <div className="float-card-id">
                      <span className="float-status-dot nominal" />
                      <span>#{g.platform_id}</span>
                      <span style={{ fontSize: '9px', color: '#34d399', marginLeft: '4px' }}>Sawtooth</span>
                    </div>
                    <span className="float-card-coords">
                      {g.latitude.toFixed(1)}°N, {g.longitude.toFixed(1)}°E • {g.name}
                    </span>
                  </div>

                  <div className="float-card-right">
                    <span className="float-card-tag nominal">
                      {g.statusLabel}
                    </span>
                    <span className="float-card-depth">{g.max_depth}m diving</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
