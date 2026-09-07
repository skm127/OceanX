/**
 * FleetSidebar — In-Situ Argo Float Manager.
 * Lists all active observation floats categorized by Indian Ocean basins.
 */
import { useMemo } from 'react';
import type { ArgoProfileSummary } from '../../types';
import './FleetSidebar.css';

interface FleetSidebarProps {
  profiles: ArgoProfileSummary[];
  selectedId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
}

export default function FleetSidebar({
  profiles,
  selectedId,
  isOpen,
  onToggle,
  onSelect,
}: FleetSidebarProps) {
  // Group profiles by ocean basin
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

  return (
    <div className="fleet-sidebar">
      <div className="fleet-header">
        <div className="fleet-header-title">
          <span>📍</span>
          <h4>In-Situ Float Fleet</h4>
          <span className="fleet-header-badge">{profiles.length} Active</span>
        </div>
        <button className="fleet-close-btn" onClick={onToggle} title="Close Fleet Drawer">
          ✕
        </button>
      </div>

      <div className="fleet-body">
        {basins.map((basin) => (
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
      </div>
    </div>
  );
}
