/**
 * RegionAnalysisModal.tsx
 * PRD Section 16 & Image 2: Regional Scientific Analysis.
 * Computes surface area, statistical distributions, observations count, and model errors for any bounding box.
 */
import React, { useState, useEffect } from 'react';
import { calculateRegionStats } from '../../services/api';
import type { RegionStatsResponse } from '../../types';
import './RegionAnalysisModal.css';

interface RegionAnalysisModalProps {
  initialBounds?: { latMin: number; latMax: number; lonMin: number; lonMax: number };
  depth: number;
  timeIndex: number;
  onClose: () => void;
  onFocusRegion?: (latMin: number, latMax: number, lonMin: number, lonMax: number) => void;
}

const REGION_PRESETS = [
  { name: 'Bay of Bengal Basin', latMin: 10, latMax: 22, lonMin: 80, lonMax: 94 },
  { name: 'Arabian Sea Basin', latMin: 10, latMax: 24, lonMin: 62, lonMax: 76 },
  { name: 'Andaman & Nicobar', latMin: 6, latMax: 14, lonMin: 90, lonMax: 96 },
  { name: 'Equatorial Indian Ocean', latMin: 0, latMax: 8, lonMin: 70, lonMax: 90 },
];

export const RegionAnalysisModal: React.FC<RegionAnalysisModalProps> = ({
  initialBounds = { latMin: 10, latMax: 22, lonMin: 80, lonMax: 92 },
  depth,
  timeIndex,
  onClose,
  onFocusRegion,
}) => {
  const [bounds, setBounds] = useState(initialBounds);
  const [stats, setStats] = useState<RegionStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = (b: typeof bounds) => {
    setLoading(true);
    setError(null);
    calculateRegionStats({
      lat_min: b.latMin,
      lat_max: b.latMax,
      lon_min: b.lonMin,
      lon_max: b.lonMax,
      depth,
      time_index: timeIndex,
    })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to compute region statistics');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats(bounds);
  }, [depth, timeIndex]);

  const handleApplyPreset = (preset: (typeof REGION_PRESETS)[0]) => {
    const newB = {
      latMin: preset.latMin,
      latMax: preset.latMax,
      lonMin: preset.lonMin,
      lonMax: preset.lonMax,
    };
    setBounds(newB);
    fetchStats(newB);
    if (onFocusRegion) {
      onFocusRegion(newB.latMin, newB.latMax, newB.lonMin, newB.lonMax);
    }
  };

  return (
    <div className="region-modal-overlay" onClick={onClose}>
      <div className="region-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="region-header">
          <div className="region-badge-row">
            <span className="region-tag">⬚ SPATIAL COMPUTING & INTEGRATION</span>
            <span className="region-depth-tag">DEPTH: {depth}M</span>
          </div>
          <div className="region-title-row">
            <h2 className="region-title">REGION ANALYSIS</h2>
            <button className="region-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Region Presets Bar */}
        <div className="region-presets-bar">
          <span className="presets-label">Domain Presets:</span>
          {REGION_PRESETS.map((p) => (
            <button
              key={p.name}
              className={`preset-btn ${bounds.latMin === p.latMin && bounds.lonMin === p.lonMin ? 'active' : ''}`}
              onClick={() => handleApplyPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="region-content">
          {loading && (
            <div className="region-loading">
              <div className="region-spinner" />
              <span>Integrating xarray NetCDF Grid Cells...</span>
            </div>
          )}

          {error && (
            <div className="region-error">
              <span>⚠ {error}</span>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* Primary KPI Row */}
              <div className="region-kpi-grid">
                <div className="kpi-card">
                  <span className="kpi-label">SURFACE AREA</span>
                  <span className="kpi-val">
                    {(stats.area_km2 / 1000000).toFixed(2)}M km²
                  </span>
                  <span className="kpi-sub">{stats.area_km2.toLocaleString()} km²</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">IN-SITU OBSERVATIONS</span>
                  <span className="kpi-val highlight">{stats.observations_count}</span>
                  <span className="kpi-sub">Active Argo Floats</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">MEAN MODEL ERROR</span>
                  <span className={`kpi-val ${stats.model_mean_residual > 1.0 ? 'amber' : 'green'}`}>
                    ±{stats.model_mean_residual}°C
                  </span>
                  <span className="kpi-sub">Residual vs Ground Truth</span>
                </div>

                <div className="kpi-card">
                  <span className="kpi-label">ANOMALIES DETECTED</span>
                  <span className={`kpi-val ${stats.anomalies_detected > 0 ? 'red' : 'green'}`}>
                    {stats.anomalies_detected}
                  </span>
                  <span className="kpi-sub">Critical Divergences</span>
                </div>
              </div>

              {/* Physical Parameters Breakdown */}
              <div className="region-params-grid">
                {/* Temperature */}
                <div className="param-box">
                  <div className="param-header">
                    <span className="param-icon temp">●</span>
                    <span className="param-title">TEMPERATURE DYNAMICS</span>
                  </div>
                  <div className="param-stats-row">
                    <div className="param-stat">
                      <span className="stat-name">MEAN</span>
                      <span className="stat-val">{stats.temperature.mean}°C</span>
                    </div>
                    <div className="param-stat">
                      <span className="stat-name">MIN</span>
                      <span className="stat-val">{stats.temperature.min}°C</span>
                    </div>
                    <div className="param-stat">
                      <span className="stat-name">MAX</span>
                      <span className="stat-val">{stats.temperature.max}°C</span>
                    </div>
                    <div className="param-stat">
                      <span className="stat-name">STD DEV</span>
                      <span className="stat-val">±{stats.temperature.std}°C</span>
                    </div>
                  </div>
                </div>

                {/* Salinity & Currents */}
                <div className="param-box">
                  <div className="param-header">
                    <span className="param-icon sal">●</span>
                    <span className="param-title">SALINITY & KINETICS</span>
                  </div>
                  <div className="param-stats-row">
                    <div className="param-stat">
                      <span className="stat-name">MEAN SAL</span>
                      <span className="stat-val">{stats.salinity.mean} PSU</span>
                    </div>
                    <div className="param-stat">
                      <span className="stat-name">RANGE</span>
                      <span className="stat-val">
                        {stats.salinity.min}–{stats.salinity.max}
                      </span>
                    </div>
                    <div className="param-stat">
                      <span className="stat-name">MEAN CURRENT</span>
                      <span className="stat-val">{stats.currents.mean_speed_ms} m/s</span>
                    </div>
                    <div className="param-stat">
                      <span className="stat-name">MAX GUST</span>
                      <span className="stat-val">{stats.currents.max_speed_ms} m/s</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histogram Distribution matching Image 2 */}
              {stats.temperature.histogram.length > 0 && (
                <div className="region-histogram-wrap">
                  <span className="histogram-title">TEMPERATURE DISTRIBUTION HISTOGRAM</span>
                  <div className="histogram-bars">
                    {stats.temperature.histogram.map((bin) => (
                      <div key={bin.range} className="hist-col">
                        <div className="hist-bar-track">
                          <div
                            className="hist-bar-fill"
                            style={{ height: `${Math.max(4, bin.percentage * 2.2)}px` }}
                          />
                        </div>
                        <span className="hist-pct">{bin.percentage}%</span>
                        <span className="hist-range">{bin.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegionAnalysisModal;
