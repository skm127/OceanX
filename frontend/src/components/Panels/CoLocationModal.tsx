import React, { useState, useEffect } from 'react';
import './CoLocationModal.css';

interface CoLocationResult {
  sensor_id: string;
  sensor_type: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  time_offset_hours: number;
  model_value: number | null;
  observed_value: number | null;
  rmse: number | null;
  bias: number | null;
  match_score: number;
}

interface CoLocationModalProps {
  isOpen: boolean;
  probedLat: number;
  probedLon: number;
  onClose: () => void;
  onJumpToSensor: (lat: number, lon: number) => void;
}

export const CoLocationModal: React.FC<CoLocationModalProps> = ({
  isOpen,
  probedLat,
  probedLon,
  onClose,
  onJumpToSensor,
}) => {
  const [radius, setRadius] = useState(200);
  const [timeWindow, setTimeWindow] = useState(24);
  const [results, setResults] = useState<CoLocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(
        `${API_BASE}/api/analytics/colocate?lat=${probedLat}&lon=${probedLon}&radius_km=${radius}&time_window_hours=${timeWindow}&variable=thetao&time_index=0`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.matches || []);
      } else {
        // Mock fallback
        setResults(getMockCoLocationResults(probedLat, probedLon));
      }
    } catch {
      setResults(getMockCoLocationResults(probedLat, probedLon));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      setSearched(false);
      setResults([]);
    }
  }, [isOpen, probedLat, probedLon]);

  if (!isOpen) return null;

  return (
    <div className="coloc-overlay" onClick={onClose}>
      <div className="coloc-modal" onClick={e => e.stopPropagation()}>
        <div className="coloc-header">
          <div className="coloc-title-group">
            <span className="coloc-badge">🎯 CO-LOCATION ENGINE</span>
            <span className="coloc-sub">Spatial-Temporal Model–Observation Matching</span>
          </div>
          <button className="coloc-close" onClick={onClose}>✕</button>
        </div>

        <div className="coloc-body">
          {/* Probe Coordinate */}
          <div className="coloc-probe">
            <span className="coloc-probe-label">Probed Coordinate</span>
            <span className="coloc-probe-value">
              {probedLat.toFixed(2)}°N, {probedLon.toFixed(2)}°E
            </span>
          </div>

          {/* Sliders */}
          <div className="coloc-controls">
            <div className="coloc-slider-group">
              <label>Search Radius: <strong>{radius} km</strong></label>
              <input
                type="range"
                min={25}
                max={500}
                step={25}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="coloc-slider"
              />
              <div className="coloc-slider-marks">
                <span>25km</span><span>250km</span><span>500km</span>
              </div>
            </div>

            <div className="coloc-slider-group">
              <label>Time Window: <strong>±{timeWindow}h</strong></label>
              <input
                type="range"
                min={6}
                max={48}
                step={6}
                value={timeWindow}
                onChange={e => setTimeWindow(Number(e.target.value))}
                className="coloc-slider"
              />
              <div className="coloc-slider-marks">
                <span>±6h</span><span>±24h</span><span>±48h</span>
              </div>
            </div>
          </div>

          <button className="coloc-search-btn" onClick={runSearch} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Find Co-Located Observations'}
          </button>

          {/* Results Table */}
          {searched && (
            <div className="coloc-results">
              <h4 className="coloc-results-title">
                {results.length} Match{results.length !== 1 ? 'es' : ''} Found
              </h4>
              {results.length === 0 ? (
                <div className="coloc-empty">No observations within {radius}km and ±{timeWindow}h window.</div>
              ) : (
                <table className="coloc-table">
                  <thead>
                    <tr>
                      <th>Sensor</th>
                      <th>Type</th>
                      <th>Distance</th>
                      <th>Model</th>
                      <th>Observed</th>
                      <th>RMSE</th>
                      <th>Score</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(r => (
                      <tr key={r.sensor_id} className={r.match_score >= 70 ? 'high-score' : ''}>
                        <td className="coloc-sensor-id">{r.sensor_id}</td>
                        <td>{r.sensor_type}</td>
                        <td>{r.distance_km.toFixed(1)} km</td>
                        <td>{r.model_value?.toFixed(2) ?? '—'}</td>
                        <td>{r.observed_value?.toFixed(2) ?? '—'}</td>
                        <td>{r.rmse?.toFixed(3) ?? '—'}</td>
                        <td>
                          <span className={`coloc-score ${r.match_score >= 70 ? 'high' : r.match_score >= 40 ? 'med' : 'low'}`}>
                            {r.match_score.toFixed(1)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="coloc-jump-btn"
                            onClick={() => onJumpToSensor(r.latitude, r.longitude)}
                            title="Fly to this sensor"
                          >
                            ➔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Mock fallback for Vercel deployment
function getMockCoLocationResults(lat: number, lon: number): CoLocationResult[] {
  return [
    {
      sensor_id: '2902345',
      sensor_type: 'argo',
      latitude: lat + 0.3,
      longitude: lon - 0.5,
      distance_km: 62.4,
      time_offset_hours: 2,
      model_value: 28.5,
      observed_value: 31.7,
      rmse: 0.847,
      bias: 3.22,
      match_score: 87.8,
    },
    {
      sensor_id: 'BD11',
      sensor_type: 'moored_buoy',
      latitude: lat - 1.2,
      longitude: lon + 0.8,
      distance_km: 165.3,
      time_offset_hours: 0,
      model_value: 29.1,
      observed_value: 29.4,
      rmse: 0.212,
      bias: 0.30,
      match_score: 34.5,
    },
    {
      sensor_id: 'GLIDER_BOB_01',
      sensor_type: 'glider',
      latitude: lat + 2.1,
      longitude: lon + 1.5,
      distance_km: 298.7,
      time_offset_hours: 8,
      model_value: 27.8,
      observed_value: 28.1,
      rmse: 0.156,
      bias: 0.30,
      match_score: 19.3,
    },
  ];
}

export default CoLocationModal;
