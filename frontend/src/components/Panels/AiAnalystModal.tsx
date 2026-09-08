/**
 * AiAnalystModal.tsx
 * PRD Section 21-23: Grounded Ocean Analyst AI.
 * Grounded in real mathematical residuals against NEMO model and in-situ Argo observations.
 */
import React, { useState, useRef } from 'react';
import useModalA11y from '../../hooks/useModalA11y';
import { showToast } from '../../utils/toast';
import { queryAiAnalyst } from '../../services/api';
import type { AiAnalystResponse } from '../../types';
import './AiAnalystModal.css';


interface AiAnalystModalProps {
  isOpen: boolean;
  latitude: number;
  longitude: number;
  depth: number;
  timeIndex: number;
  onClose: () => void;
  onTargetAnomaly?: () => void;
}

const SAMPLE_QUERIES = [
  'Why is the Bay of Bengal showing a subsurface thermal anomaly?',
  'Compare NEMO model outputs against ground truth Argo observations.',
  'Assess tropical cyclone rapid intensification risk from upper ocean heat.',
  'Analyze thermocline salinity barrier layer dynamics.',
];

export const AiAnalystModal: React.FC<AiAnalystModalProps> = ({
  isOpen,
  latitude,
  longitude,
  depth,
  timeIndex,
  onClose,
  onTargetAnomaly,
}) => {
  const [queryText, setQueryText] = useState(SAMPLE_QUERIES[0]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalystResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useModalA11y(isOpen, onClose, cardRef);

  const handleRunAnalysis = (queryToRun: string) => {
    setLoading(true);
    setError(null);
    queryAiAnalyst({
      query: queryToRun,
      lat: latitude,
      lon: longitude,
      depth,
      time_index: timeIndex,
    })
      .then((data) => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || err.message || 'AI grounding calculation failed';
        showToast(msg, 'error', 'AI Analyst Error');
        setError(msg);
        setLoading(false);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div
        ref={cardRef}
        className="ai-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Grounded Oceanographic Analyst"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className="ai-header">
          <div className="ai-badge-row">
            <span className="ai-badge-tag">✦ GROUNDED OCEANOGRAPHIC INTELLIGENCE</span>
            <span className="ai-hallucination-badge">ZERO HALLUCINATION // EVIDENCE-BACKED</span>
          </div>
          <div className="ai-title-row">
            <h2 className="ai-title">OCEAN ANALYST</h2>
            <button className="ai-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Query Input Section */}
        <div className="ai-query-section">
          <div className="ai-input-wrap">
            <input
              type="text"
              className="ai-input"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Ask about this ocean region, anomaly, or model divergence..."
              onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis(queryText)}
            />
            <button
              className="ai-run-btn"
              disabled={loading || !queryText.trim()}
              onClick={() => handleRunAnalysis(queryText)}
            >
              {loading ? 'ANALYZING...' : 'RUN INFERENCE'}
            </button>
          </div>

          <div className="ai-preset-queries">
            <span className="queries-label">Scientific Prompts:</span>
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                className={`preset-q-btn ${queryText === q ? 'active' : ''}`}
                onClick={() => {
                  setQueryText(q);
                  handleRunAnalysis(q);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="ai-body">
          {loading && (
            <div className="ai-loading">
              <div className="ai-spinner" />
              <span>Retrieving in-situ profiles & calculating numerical residuals...</span>
            </div>
          )}

          {error && (
            <div className="ai-error">
              <span>⚠ {error}</span>
            </div>
          )}

          {!loading && analysis && (
            <div className="ai-results-pane">
              {/* Severity & Confidence Banner */}
              <div className="ai-status-banner">
                <div className="status-left">
                  <span className={`status-pill ${analysis.severity.toLowerCase()}`}>
                    {analysis.severity === 'CRITICAL' ? '🚨 CRITICAL ANOMALY' : 'ℹ STATUS NOMINAL'}
                  </span>
                  <h3 className="status-title">{analysis.title}</h3>
                </div>
                <div className="confidence-meter">
                  <span className="conf-label">GROUNDING CONFIDENCE</span>
                  <span className="conf-val">{analysis.confidence_percent}%</span>
                </div>
              </div>

              {/* Hard Evidence Grid */}
              <div className="ai-evidence-grid">
                <div className="evidence-card">
                  <span className="ev-label">MODEL VALUE</span>
                  <span className="ev-val">{analysis.evidence.model_value}°C</span>
                  <span className="ev-sub">{analysis.evidence.model_dataset}</span>
                </div>
                <div className="evidence-card">
                  <span className="ev-label">OBSERVED VALUE</span>
                  <span className="ev-val pink">{analysis.evidence.observed_value}°C</span>
                  <span className="ev-sub">Argo #{analysis.evidence.primary_float_id}</span>
                </div>
                <div className="evidence-card">
                  <span className="ev-label">RESIDUAL DELTA</span>
                  <span className={`ev-val ${Math.abs(analysis.evidence.residual_delta) > 1 ? 'amber' : 'green'}`}>
                    +{analysis.evidence.residual_delta}°C
                  </span>
                  <span className="ev-sub">At {analysis.location.depth_m}m depth</span>
                </div>
                <div className="evidence-card">
                  <span className="ev-label">EVIDENCE SUPPORT</span>
                  <span className="ev-val highlight">{analysis.evidence.supporting_argo_count} Floats</span>
                  <span className="ev-sub">Within 250km radius</span>
                </div>
              </div>

              {/* Scientific Narrative */}
              <div className="ai-narrative-box">
                <span className="narrative-label">PHYSICAL OCEANOGRAPHIC DIAGNOSIS</span>
                <p className="narrative-text">{analysis.scientific_narrative}</p>
              </div>

              {/* Operational Recommendations */}
              <div className="ai-rec-box">
                <span className="rec-label">OPERATIONAL INCOIS ADVISORY</span>
                <div className="rec-text">{analysis.recommendations}</div>
              </div>

              {/* Action Buttons */}
              <div className="ai-action-row">
                {onTargetAnomaly && (
                  <button className="ai-action-btn primary" onClick={onTargetAnomaly}>
                    🎯 FLY CAMERA TO ANOMALY TARGET
                  </button>
                )}
                <button className="ai-action-btn secondary" onClick={onClose}>
                  DISMISS
                </button>
              </div>
            </div>
          )}

          {!loading && !analysis && !error && (
            <div className="ai-empty-state">
              <span className="empty-icon">✦</span>
              <p>Select a scientific prompt above or type a custom inquiry to run grounded inference.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAnalystModal;
