/**
 * SectorNavigator — Tactical Quick-Jump Camera Strip.
 * Allows instant framing of Arabian Sea, Bay of Bengal, All India, or Anomaly Floats.
 */
import { SECTOR_PRESETS, type SectorId } from '../../utils/coordinates';
import './SectorNavigator.css';

interface SectorNavigatorProps {
  currentSector: SectorId;
  onSelectSector: (sectorId: SectorId) => void;
}

export default function SectorNavigator({
  currentSector,
  onSelectSector,
}: SectorNavigatorProps) {
  const sectors = Object.values(SECTOR_PRESETS);

  return (
    <nav className="sector-navigator" aria-label="Ocean Sectors">
      {sectors.map((s) => (
        <button
          key={s.id}
          className={`sector-btn ${currentSector === s.id ? 'active' : ''} ${
            s.id === 'anomaly_target' ? 'anomaly-sector' : ''
          }`}
          onClick={() => onSelectSector(s.id)}
          title={s.description}
        >
          <span className="sector-icon">{s.icon}</span>
          <span>{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
