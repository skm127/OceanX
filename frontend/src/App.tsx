/**
 * OCEAN-X main application shell.
 * Interactive 3D Ocean Intelligence & Visualization Platform (SIH 2026 // PS26067 - INCOIS).
 * Integrates:
 * - 3D Ocean Globe & Subsurface Water Column Depth Slabs (Image 1 & 2)
 * - Vertical Profile Sounding HUD with live cursor & readings (Image 1)
 * - Ocean Region Dossier (Right-click contextual inspection — PRD §15)
 * - Draw & Analyze / Region Analytics (PRD §16 & Image 2)
 * - Ocean Transect Cross-Section Tool (PRD §17)
 * - OSIRIS-Style Persistent Left Layer Rail (PRD §6)
 * - Global Search (⌘K / Ctrl+K — PRD §24)
 * - Grounded Ocean Analyst AI (PRD §21-23)
 */
import { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import Globe from './components/Globe/Globe';
import ControlBar from './components/Controls/ControlBar';
import Colorbar from './components/Controls/Colorbar';
import TimeAnimator from './components/Controls/TimeAnimator';
import InfoPanel from './components/Controls/InfoPanel';
import SectorNavigator from './components/Controls/SectorNavigator';
import ComparisonPanel from './components/Panels/ComparisonPanel';
import FleetSidebar from './components/Panels/FleetSidebar';
import MissionBriefingModal from './components/Panels/MissionBriefingModal';
import VerticalProfileHUD from './components/Controls/VerticalProfileHUD';
import OceanDossierModal from './components/Panels/OceanDossierModal';
import RegionAnalysisModal from './components/Panels/RegionAnalysisModal';
import TransectModal from './components/Panels/TransectModal';
import LayerRail from './components/Controls/LayerRail';
import GlobalSearchModal from './components/Panels/GlobalSearchModal';
import AiAnalystModal from './components/Panels/AiAnalystModal';
import ExplainabilityToggle, { type ExplainMode } from './components/Controls/ExplainabilityToggle';
import HoverSounderHUD from './components/Controls/HoverSounderHUD';
import { useOceanData } from './hooks/useOceanData';
import { useCurrentVectors } from './hooks/useCurrentVectors';
import { useArgoData } from './hooks/useArgoData';
import { getModelProfile, getArgoProfile } from './services/api';
import {
  getSectorCameraPosition,
  latLonToVector3,
  type SectorId,
} from './utils/coordinates';
import './App.css';

function App() {
  const {
    sliceData,
    loading: sliceLoading,
    error,
    variable,
    depth,
    timeIndex,
    depthLevels,
    timeSteps,
    dates,
    setVariable,
    setDepth,
    setTimeIndex,
  } = useOceanData();

  const {
    vectors,
    speedMin,
    speedMax,
    loading: currentsLoading,
    visible: showCurrents,
    setVisible: setShowCurrents,
  } = useCurrentVectors(depth, timeIndex);

  const {
    profiles: argoProfiles,
    selectedProfileId,
    setSelectedProfileId,
  } = useArgoData();

  // Sector and Camera flight state
  const [currentSector, setCurrentSector] = useState<SectorId>('all_india');
  const [targetCameraPos, setTargetCameraPos] = useState<THREE.Vector3 | null>(null);
  const [fleetOpen, setFleetOpen] = useState(false);
  const [probedCoord, setProbedCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [oceanOpacity, setOceanOpacity] = useState<number>(0.82);
  const [showHotkeys, setShowHotkeys] = useState<boolean>(false);
  const [briefingOpen, setBriefingOpen] = useState<boolean>(false);

  // New PRD Intelligence & Spatial Modals
  const [dossierCoord, setDossierCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [regionBounds, setRegionBounds] = useState({ latMin: 10, latMax: 22, lonMin: 80, lonMax: 92 });
  const [transectModalOpen, setTransectModalOpen] = useState(false);
  const [transectLine, setTransectLine] = useState({ lat1: 10, lon1: 85, lat2: 19, lon2: 89 });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [explainMode, setExplainMode] = useState<ExplainMode>('citizen');
  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [cameraPitch, setCameraPitch] = useState<number>(50);

  // Vertical Profile HUD state matching Image 1
  const [profileHudData, setProfileHudData] = useState<{
    isOpen: boolean;
    lat: number;
    lon: number;
    depths: number[];
    modelValues: (number | null)[];
    observedValues: (number | null)[] | null;
  }>({
    isOpen: false,
    lat: 14.5,
    lon: 84.8,
    depths: [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500],
    modelValues: [29.2, 29.1, 28.8, 27.5, 26.0, 23.2, 19.8, 16.5, 13.8, 11.5, 10.2, 9.1, 7.5, 6.2],
    observedValues: [29.4, 29.3, 29.0, 28.2, 27.8, 25.4, 22.1, 19.7, 16.2, 13.1, 11.0, 9.4, 7.8, 6.4],
  });

  // Layer Rail Toggles
  const [layerRailOpen, setLayerRailOpen] = useState(true);
  const [showArgo, setShowArgo] = useState(true);
  const [showSST, setShowSST] = useState(false);
  const [showCyclones, setShowCyclones] = useState(true);

  // Live UTC Clock
  const [utcTime, setUtcTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentDate = dates[timeIndex] || `Day ${timeIndex + 1}`;
  const totalLoading = sliceLoading || currentsLoading;

  // WebGL Screenshot snapshot handler
  const handleCaptureSnapshot = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `OCEANX_SURVEILLANCE_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '_')}.png`;
    a.click();
  };

  // Sector selection handler
  const handleSelectSector = (sectorId: SectorId) => {
    setCurrentSector(sectorId);
    setTargetCameraPos(getSectorCameraPosition(sectorId));

    if (sectorId === 'anomaly_target') {
      const anom = argoProfiles.find((p) => p.platform_id === '2902345');
      if (anom) {
        setSelectedProfileId(anom.id);
        setProbedCoord({ lat: anom.latitude, lon: anom.longitude });
        // Fetch profile data for HUD
        loadProfileForLocation(anom.latitude, anom.longitude, anom.id);
      }
    }
  };

  // Load vertical profile sounding data for HUD
  const loadProfileForLocation = useCallback(
    async (lat: number, lon: number, floatId?: string) => {
      try {
        const mProfile = await getModelProfile(variable, lat, lon, timeIndex);
        let obsVals: (number | null)[] | null = null;

        if (floatId) {
          const fProfile = await getArgoProfile(floatId);
          if (fProfile && fProfile.temperatures && fProfile.depths) {
            // Map float observed values to model depths
            obsVals = mProfile.depths.map((d: number) => {
              const idx = fProfile.depths.findIndex((fd) => Math.abs(fd - d) < 15);
              return idx !== -1 && fProfile.temperatures ? fProfile.temperatures[idx] : null;
            });
          }
        }

        setProfileHudData({
          isOpen: true,
          lat,
          lon,
          depths: mProfile.depths,
          modelValues: mProfile.values,
          observedValues: obsVals,
        });
      } catch (err) {
        console.warn('Failed to load profile for location', err);
      }
    },
    [variable, timeIndex]
  );

  // Argo float selection with smooth camera fly-to
  const handleSelectArgo = (id: string) => {
    setSelectedProfileId(id);
    const p = argoProfiles.find((item) => item.id === id);
    if (p) {
      setProbedCoord({ lat: p.latitude, lon: p.longitude });
      setTargetCameraPos(latLonToVector3(p.latitude, p.longitude, 4.6));
      loadProfileForLocation(p.latitude, p.longitude, id);
    }
  };

  // Ocean surface coordinate left-click probe
  const handleProbeCoordinate = (coord: { lat: number; lon: number }) => {
    setProbedCoord(coord);
    setSelectedProfileId(null);
    loadProfileForLocation(coord.lat, coord.lon);
  };

  // Ocean surface right-click -> Ocean Region Dossier (PRD §15)
  const handleContextMenuCoordinate = (coord: { lat: number; lon: number }) => {
    setDossierCoord(coord);
    setProbedCoord(coord);
  };

  // Start transect from a specific coordinate
  const handleStartTransectFromHere = (lat: number, lon: number) => {
    setTransectLine({
      lat1: lat,
      lon1: lon,
      lat2: Math.min(26, lat + 8),
      lon2: Math.min(94, lon + 5),
    });
    setTransectModalOpen(true);
  };

  // Start region analysis from a specific coordinate
  const handleAnalyzeRegionHere = (lat: number, lon: number) => {
    setRegionBounds({
      latMin: Math.max(0, lat - 4),
      latMax: Math.min(28, lat + 4),
      lonMin: Math.max(60, lon - 4),
      lonMax: Math.min(100, lon + 4),
    });
    setRegionModalOpen(true);
  };

  // C2 Keyboard Command Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      // ⌘K / Ctrl+K -> Global Search
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setSelectedProfileId(null);
        setProbedCoord(null);
        setDossierCoord(null);
        setRegionModalOpen(false);
        setTransectModalOpen(false);
        setSearchModalOpen(false);
        setAiModalOpen(false);
        setFleetOpen(false);
        setShowHotkeys(false);
        setBriefingOpen(false);
      } else if (e.key === '1') {
        handleSelectSector('all_india');
      } else if (e.key === '2') {
        handleSelectSector('arabian_sea');
      } else if (e.key === '3') {
        handleSelectSector('bay_of_bengal');
      } else if (e.key === '4') {
        handleSelectSector('anomaly_target');
      } else if (e.key === '5') {
        handleSelectSector('equatorial');
      } else if (e.key === 'b' || e.key === 'B') {
        setBriefingOpen((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setShowCurrents((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        setLayerRailOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        setTransectModalOpen((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        setRegionModalOpen((prev) => !prev);
      } else if (e.key === 'a' || e.key === 'A' || e.key === 'i' || e.key === 'I') {
        setAiModalOpen((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        setProfileHudData((prev) => ({ ...prev, isOpen: !prev.isOpen }));
      } else if (e.key === 'f' || e.key === 'F') {
        setFleetOpen((prev) => !prev);
      } else if (e.key === '?') {
        setShowHotkeys((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [argoProfiles]);

  const unit = variable === 'thetao' ? '°C' : variable === 'so' ? 'PSU' : 'm/s';

  return (
    <div className="app">
      {/* OSIRIS Command & Control Top Bar */}
      <header className="top-bar">
        <div className="logo">
          <div className="logo-hex">⬡</div>
          <div className="logo-text">
            <h1>OCEAN-X</h1>
            <span className="logo-subtitle">3D OCEAN INTELLIGENCE // SIH26067</span>
          </div>
          <span className="c2-live-indicator">● LIVE</span>
        </div>

        {/* FR-15: Dual-Lens Citizen / Scientist Explainability Switch */}
        <ExplainabilityToggle mode={explainMode} onChange={setExplainMode} />

        {/* Global Search Bar (⌘K / Ctrl+K) */}
        <div className="global-search-bar" onClick={() => setSearchModalOpen(true)}>
          <span className="search-bar-icon">🔍</span>
          <span className="search-bar-placeholder">Search region, platform, variable, anomaly...</span>
          <span className="search-bar-kbd">⌘K</span>
        </div>

        {/* Quick Camera Sector Jump Strip */}
        <div className="top-bar-center">
          <SectorNavigator
            currentSector={currentSector}
            onSelectSector={handleSelectSector}
          />
        </div>

        <div className="top-bar-right">
          <span className="utc-clock">⏱ {utcTime}</span>

          {/* Camera Horizon Tilt Angle (15° to 75°) */}
          <div className="c2-pitch-control" title="Google Earth Horizon Tilt Angle (15° to 75°)">
            <span className="pitch-label">TILT {cameraPitch}°</span>
            <input
              type="range"
              min="15"
              max="75"
              value={cameraPitch}
              onChange={(e) => setCameraPitch(parseInt(e.target.value))}
              className="pitch-slider"
            />
          </div>

          {/* Anomaly Hero Badge */}
          <button
            className="c2-badge anomaly-alert-badge anomaly-clickable"
            onClick={() => handleSelectSector('anomaly_target')}
            title="Target Subsurface Marine Heatwave Anomaly #2902345 (Key: 4)"
          >
            🚨 1 CRITICAL ANOMALY
          </button>

          {/* AI Analyst Trigger */}
          <button
            className="c2-badge ai-btn"
            onClick={() => setAiModalOpen(true)}
            title="Open Grounded Ocean Analyst AI (Key: A / I)"
          >
            ✦ ANALYZE
          </button>

          {/* Spatial Tools Shortcuts */}
          <button
            className="c2-badge tool-btn"
            onClick={() => setTransectModalOpen(true)}
            title="Open Ocean Transect Cross-Section (Key: T)"
          >
            ⟂ TRANSECT
          </button>

          <button
            className="c2-badge tool-btn"
            onClick={() => setRegionModalOpen(true)}
            title="Open Bounding Box Region Analytics (Key: R)"
          >
            ⬚ REGION
          </button>

          {/* In-Situ Fleet Count */}
          <button
            className="c2-badge floats fleet-btn"
            onClick={() => setFleetOpen(!fleetOpen)}
            title="Toggle Float Fleet Drawer (Key: F)"
          >
            📍 {argoProfiles.length} FLOATS
          </button>

          {/* Mission Briefing */}
          <button
            className="c2-badge briefing-btn"
            onClick={() => setBriefingOpen(true)}
            title="SIH 2026 PS26067 Mission Briefing & Evaluation Guide (Key: B)"
          >
            📖 BRIEFING
          </button>

          {/* Snapshot */}
          <button
            className="c2-badge snapshot-btn"
            onClick={handleCaptureSnapshot}
            title="Capture High-Resolution WebGL Canvas Snapshot"
          >
            📸
          </button>

          {/* Hotkeys Matrix */}
          <button
            className="c2-badge hotkeys-btn"
            onClick={() => setShowHotkeys(!showHotkeys)}
            title="Toggle Keyboard Shortcuts HUD (Key: ?)"
          >
            ⌨
          </button>
        </div>
      </header>

      {/* 3D Ocean Viewport */}
      <main className="viewport">
        {/* Persistent Left Layer Rail (PRD §6) */}
        <LayerRail
          variable={variable}
          depth={depth}
          showCurrents={showCurrents}
          opacity={oceanOpacity}
          showArgo={showArgo}
          showSST={showSST}
          showCyclones={showCyclones}
          onVariableChange={setVariable}
          onToggleCurrents={() => setShowCurrents(!showCurrents)}
          onToggleArgo={() => setShowArgo(!showArgo)}
          onToggleSST={() => setShowSST(!showSST)}
          onToggleCyclones={() => setShowCyclones(!showCyclones)}
          onOpacityChange={setOceanOpacity}
          onOpenTransect={() => setTransectModalOpen(true)}
          onOpenRegionAnalysis={() => setRegionModalOpen(true)}
          isOpen={layerRailOpen}
          onToggleOpen={() => setLayerRailOpen(!layerRailOpen)}
        />

        {/* Real-time View Diagnostics & Parameter Card */}
        {sliceData && (
          <InfoPanel
            variable={variable}
            depth={depth}
            timeIndex={timeIndex}
            date={currentDate}
            vMin={sliceData.vMin}
            vMax={sliceData.vMax}
            loading={totalLoading}
            showCurrents={showCurrents}
            opacity={oceanOpacity}
            fleetCount={argoProfiles.length}
            onOpacityChange={setOceanOpacity}
            onOpenFleet={() => setFleetOpen(!fleetOpen)}
          />
        )}

        {/* In-Situ Fleet Sidebar Drawer */}
        <FleetSidebar
          profiles={argoProfiles}
          selectedId={selectedProfileId}
          isOpen={fleetOpen}
          onToggle={() => setFleetOpen(!fleetOpen)}
          onSelect={handleSelectArgo}
        />

        {/* 3D Globe with continents, ocean raster, currents, and Argo markers */}
        <Globe
          sliceData={sliceData}
          currentVectors={vectors}
          currentSpeedMin={speedMin}
          currentSpeedMax={speedMax}
          showCurrents={showCurrents}
          argoProfiles={showArgo ? argoProfiles : []}
          selectedArgoId={selectedProfileId}
          targetCameraPos={targetCameraPos}
          cameraPitch={cameraPitch}
          probedCoordinate={probedCoord}
          onHoverCoordinate={setHoverCoord}
          oceanOpacity={oceanOpacity}
          depthLevels={depthLevels}
          onSelectArgo={handleSelectArgo}
          onProbeCoordinate={handleProbeCoordinate}
          onContextMenuCoordinate={handleContextMenuCoordinate}
        />

        {/* Floating Vertical Profile Sounding HUD (Image 1) */}
        {profileHudData.isOpen && (
          <VerticalProfileHUD
            title={selectedProfileId ? 'Observation vs Model Sounding' : 'Vertical profile'}
            latitude={profileHudData.lat}
            longitude={profileHudData.lon}
            depths={profileHudData.depths}
            modelValues={profileHudData.modelValues}
            observedValues={profileHudData.observedValues}
            variable={variable}
            unit={unit}
            currentDepth={depth}
            onDepthSelect={(d) => setDepth(d)}
            onClose={() => setProfileHudData((prev) => ({ ...prev, isOpen: false }))}
          />
        )}

        {/* Right-Click Ocean Region Dossier Modal (PRD §15) */}
        {dossierCoord && (
          <OceanDossierModal
            coordinate={dossierCoord}
            depth={depth}
            timeIndex={timeIndex}
            date={currentDate}
            onClose={() => setDossierCoord(null)}
            onOpenProfile={(lat, lon, depths, vals) => {
              setProfileHudData({
                isOpen: true,
                lat,
                lon,
                depths,
                modelValues: vals,
                observedValues: null,
              });
            }}
            onSelectArgo={handleSelectArgo}
            onStartTransectFromHere={handleStartTransectFromHere}
            onAnalyzeRegionHere={handleAnalyzeRegionHere}
          />
        )}

        {/* Region Analysis Bounding Box Modal (PRD §16 & Image 2) */}
        {regionModalOpen && (
          <RegionAnalysisModal
            initialBounds={regionBounds}
            depth={depth}
            timeIndex={timeIndex}
            onClose={() => setRegionModalOpen(false)}
            onFocusRegion={(latMin, latMax, lonMin, lonMax) => {
              const cLat = (latMin + latMax) / 2;
              const cLon = (lonMin + lonMax) / 2;
              setTargetCameraPos(latLonToVector3(cLat, cLon, 5.5));
            }}
          />
        )}

        {/* Ocean Transect Vertical Cross-Section Modal (PRD §17) */}
        {transectModalOpen && (
          <TransectModal
            initialLine={transectLine}
            timeIndex={timeIndex}
            onClose={() => setTransectModalOpen(false)}
          />
        )}

        {/* Global Search Modal (⌘K / Ctrl+K — PRD §24) */}
        <GlobalSearchModal
          isOpen={searchModalOpen}
          argoProfiles={argoProfiles}
          onClose={() => setSearchModalOpen(false)}
          onSelectCoordinate={(lat, lon) => {
            setProbedCoord({ lat, lon });
            setTargetCameraPos(latLonToVector3(lat, lon, 4.8));
            loadProfileForLocation(lat, lon);
          }}
          onSelectArgo={handleSelectArgo}
          onSelectSector={handleSelectSector}
        />

        {/* Grounded Ocean Analyst AI Modal (PRD §21-23) */}
        <AiAnalystModal
          isOpen={aiModalOpen}
          latitude={probedCoord?.lat ?? 14.5}
          longitude={probedCoord?.lon ?? 84.8}
          depth={depth}
          timeIndex={timeIndex}
          onClose={() => setAiModalOpen(false)}
          onTargetAnomaly={() => handleSelectSector('anomaly_target')}
        />

        {/* Command & Control Hotkeys Guide Modal */}
        {showHotkeys && (
          <div className="hotkeys-modal-overlay" onClick={() => setShowHotkeys(false)}>
            <div className="hotkeys-modal" onClick={(e) => e.stopPropagation()}>
              <div className="hotkeys-header">
                <span>⌨ COMMAND & CONTROL // SHORTCUT MATRIX</span>
                <button className="hotkeys-close-btn" onClick={() => setShowHotkeys(false)}>
                  ✕
                </button>
              </div>
              <div className="hotkeys-grid">
                <div className="hotkey-row">
                  <kbd>⌘K</kbd>
                  <span>Global Search (Regions, Floats, Coordinates)</span>
                </div>
                <div className="hotkey-row">
                  <kbd>Right-Click</kbd>
                  <span>Ocean Region Dossier (Contextual Telemetry)</span>
                </div>
                <div className="hotkey-row">
                  <kbd>P</kbd>
                  <span>Toggle Vertical Depth Profile HUD</span>
                </div>
                <div className="hotkey-row">
                  <kbd>T</kbd>
                  <span>Ocean Transect Subsurface Cross-Section</span>
                </div>
                <div className="hotkey-row">
                  <kbd>R</kbd>
                  <span>Draw & Analyze Geographic Region</span>
                </div>
                <div className="hotkey-row">
                  <kbd>A / I</kbd>
                  <span>Grounded Ocean Analyst AI</span>
                </div>
                <div className="hotkey-row">
                  <kbd>L</kbd>
                  <span>Toggle Persistent Left Layer Rail</span>
                </div>
                <div className="hotkey-row">
                  <kbd>C</kbd>
                  <span>Toggle 3D Current Vector Cones</span>
                </div>
                <div className="hotkey-row">
                  <kbd>4</kbd>
                  <span>Target Critical Subsurface Heatwave Anomaly</span>
                </div>
                <div className="hotkey-row">
                  <kbd>ESC</kbd>
                  <span>Dismiss All Modals & Overlays</span>
                </div>
              </div>
              <div className="hotkeys-footer">
                Tip: Right-click anywhere in the ocean to inspect depth, salinity, currents, and model errors.
              </div>
            </div>
          </div>
        )}

        {/* SIH 2026 PS26067 Mission Briefing Modal */}
        <MissionBriefingModal
          isOpen={briefingOpen}
          onClose={() => setBriefingOpen(false)}
          onJumpToAnomaly={() => handleSelectSector('anomaly_target')}
        />

        {/* Core Differentiator: Model vs Reality Comparison Drawer */}
        {selectedProfileId && (
          <ComparisonPanel
            profileId={selectedProfileId}
            variable={variable}
            timeIndex={timeIndex}
            explainMode={explainMode}
            onClose={() => setSelectedProfileId(null)}
          />
        )}

        {/* Colorbar scale legend */}
        {sliceData && (
          <Colorbar
            variable={variable}
            vMin={sliceData.vMin}
            vMax={sliceData.vMax}
          />
        )}

        {/* Zero-network 60 FPS in-memory Hover Sounding HUD with Citizen/Scientist dual-lens */}
        <HoverSounderHUD
          coordinate={hoverCoord}
          sliceData={sliceData}
          variable={variable}
          depth={depth}
          explainMode={explainMode}
        />

        {/* Error notification banner */}
        {error && (
          <div className="error-overlay">
            <span>⚠ {error}</span>
          </div>
        )}
      </main>

      {/* Bottom Timeline Animation & Ocean Controls */}
      <footer>
        <TimeAnimator
          timeIndex={timeIndex}
          timeSteps={timeSteps}
          dates={dates}
          loading={sliceLoading}
          onTimeChange={setTimeIndex}
        />
        <ControlBar
          variable={variable}
          depth={depth}
          timeIndex={timeIndex}
          depthLevels={depthLevels}
          timeSteps={timeSteps}
          loading={totalLoading}
          showCurrents={showCurrents}
          onVariableChange={setVariable}
          onDepthChange={setDepth}
          onToggleCurrents={() => setShowCurrents(!showCurrents)}
        />
      </footer>
    </div>
  );
}

export default App;
