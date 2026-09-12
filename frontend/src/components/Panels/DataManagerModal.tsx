import React, { useRef } from 'react';
import { Database, Grid, FileCode2, Radio, Cpu } from 'lucide-react';
import useModalA11y from '../../hooks/useModalA11y';
import './DataManagerModal.css';

interface DataManagerModalProps {
  onClose: () => void;
}


const GRID_INFO = {
  model: 'INCOIS NEMO Indian Ocean Regional (IND-NEMO)',
  resolution: '0.25° × 0.25° (~28km)',
  domain: '0°N–28°N, 60°E–100°E',
  depthLevels: '14 levels (0m – 500m)',
  timeSteps: '7 daily forecasts',
  temporalRes: '24-hour forward steps',
  convention: 'CF-1.8 / COARDS / ACDD-1.3',
  format: 'NetCDF-4 / HDF5 chunked',
};

const VARIABLES = [
  { name: 'thetao', longName: 'Sea Water Potential Temperature', unit: '°C', dims: '(time, depth, lat, lon)', standard: 'sea_water_potential_temperature' },
  { name: 'so', longName: 'Sea Water Salinity', unit: 'PSU', dims: '(time, depth, lat, lon)', standard: 'sea_water_salinity' },
  { name: 'uo', longName: 'Eastward Sea Water Velocity', unit: 'm/s', dims: '(time, depth, lat, lon)', standard: 'eastward_sea_water_velocity' },
  { name: 'vo', longName: 'Northward Sea Water Velocity', unit: 'm/s', dims: '(time, depth, lat, lon)', standard: 'northward_sea_water_velocity' },
];

const SENSORS = [
  { id: 'ARGO_FLEET', type: 'Argo Profiling Floats', count: 8, status: 'operational', lastSync: '2024-08-11T06:00Z', coverage: 'Full Bay & Arabian Sea' },
  { id: 'OMNI_BUOYS', type: 'INCOIS OMNI Moored Buoys', count: 3, status: 'operational', lastSync: '2024-08-11T05:45Z', coverage: 'BD08, BD11, AD02' },
  { id: 'RAMA_BUOYS', type: 'RAMA Array Moored Buoys', count: 2, status: 'operational', lastSync: '2024-08-11T05:30Z', coverage: 'AD07, RAMA_EQ' },
  { id: 'GLIDERS', type: 'Autonomous Underwater Gliders', count: 1, status: 'active_mission', lastSync: '2024-08-11T04:00Z', coverage: 'GLIDER_BOB_01 (Sawtooth)' },
];

const PIPELINE_STAGES = [
  { stage: '1. NetCDF Ingestion', status: 'complete', detail: 'Zero-copy memory mapping via xarray & dask chunking' },
  { stage: '2. WMO QC Filtering', status: 'complete', detail: 'Quality flags 1 (Good) enforced on observed soundings' },
  { stage: '3. Bilinear Spatial Crop', status: 'complete', detail: 'Bilinear 2D interpolation for target depth levels' },
  { stage: '4. IsolationForest ML', status: 'complete', detail: '5D anomaly scoring (lat, lon, depth, residual, gradient)' },
  { stage: '5. Fast Float32 Stream', status: 'live', detail: 'Binary buffer transport with HTTP sub-35ms delivery' },
];

export const DataManagerModal: React.FC<DataManagerModalProps> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useModalA11y(true, onClose, modalRef);

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="dm-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Data Manager and Metadata Inspector"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="dm-header">
          <div className="dm-title-group">
            <span className="dm-badge">
              <Database size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              DATA MANAGER & METADATA INSPECTOR
            </span>
            <span className="dm-sub">CF-1.8 NetCDF Metadata, Sensor Registry & Ingestion Pipeline Health</span>
          </div>
          <button className="dm-close" onClick={onClose} title="Close Data Manager">✕</button>
        </div>

        <div className="dm-body">
          {/* Grid Specification */}
          <section className="dm-section">
            <h4 className="dm-section-title">
              <Grid size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              CF-1.8 Grid Specification & Extents
            </h4>
            <div className="dm-grid-info">
              {Object.entries(GRID_INFO).map(([key, val]) => (
                <div key={key} className="dm-grid-row">
                  <span className="dm-grid-key">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </span>
                  <span className="dm-grid-val">{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CF Variables */}
          <section className="dm-section">
            <h4 className="dm-section-title">
              <FileCode2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              NetCDF CF Variables & Coordinate Axes
            </h4>
            <table className="dm-var-table">
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Standard Name</th>
                  <th>Unit</th>
                  <th>Dimensions</th>
                </tr>
              </thead>
              <tbody>
                {VARIABLES.map((v) => (
                  <tr key={v.name}>
                    <td className="dm-var-name">{v.name}</td>
                    <td>{v.standard}</td>
                    <td><span className="dm-unit-badge">{v.unit}</span></td>
                    <td className="dm-var-dims">{v.dims}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Sensor Registry */}
          <section className="dm-section">
            <h4 className="dm-section-title">
              <Radio size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              INCOIS Multi-Sensor Registry Status
            </h4>
            <div className="dm-sensor-grid">
              {SENSORS.map((s) => (
                <div key={s.id} className={`dm-sensor-card ${s.status}`}>
                  <div className="dm-sensor-top">
                    <span className="dm-sensor-type">{s.type}</span>
                    <span className={`dm-sensor-status ${s.status}`}>
                      {s.status === 'operational' ? '● ONLINE' : '● ACTIVE MISSION'}
                    </span>
                  </div>
                  <div className="dm-sensor-bottom">
                    <span>{s.count} platforms ({s.coverage})</span>
                    <span className="dm-sensor-sync">Last: {new Date(s.lastSync).toUTCString().slice(17, 22)} UTC</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Ingestion Pipeline */}
          <section className="dm-section">
            <h4 className="dm-section-title">
              <Cpu size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              Data Pipeline Processing Stages
            </h4>
            <div className="dm-pipeline">
              {PIPELINE_STAGES.map((p, i) => (
                <div key={p.stage} className={`dm-pipe-stage ${p.status}`}>
                  <div className="dm-pipe-num">{i + 1}</div>
                  <div className="dm-pipe-content">
                    <span className="dm-pipe-name">{p.stage}</span>
                    <span className="dm-pipe-detail">{p.detail}</span>
                  </div>
                  <span className={`dm-pipe-badge ${p.status}`}>
                    {p.status === 'complete' ? '✓ READY' : '◉ STREAMING'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DataManagerModal;
