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
import { lazy, Suspense, useState, useEffect, useCallback, useRef } from 'react';
import * as THREE from 'three';
import Globe from './components/Globe/Globe';
import ControlBar from './components/Controls/ControlBar';
import Colorbar from './components/Controls/Colorbar';
import TimeAnimator from './components/Controls/TimeAnimator';
import InfoPanel from './components/Controls/InfoPanel';
import SectorNavigator from './components/Controls/SectorNavigator';
import FleetSidebar from './components/Panels/FleetSidebar';
import LayerRail from './components/Controls/LayerRail';
import ExplainabilityToggle, { type ExplainMode } from './components/Controls/ExplainabilityToggle';
import HoverSounderHUD from './components/Controls/HoverSounderHUD';
import DataSourceBadge from './components/Controls/DataSourceBadge';
import ViewportControls from './components/Controls/ViewportControls';
import ProductModeSelector, { type ProductMode } from './components/Controls/ProductModeSelector';
import ToastContainer from './components/Controls/ToastContainer';
import OnboardingHint from './components/Controls/OnboardingHint';

import { useOceanData } from './hooks/useOceanData';
import { useCurrentVectors } from './hooks/useCurrentVectors';
import { useArgoData } from './hooks/useArgoData';
import {
  getModelProfile,
  getArgoProfile,
  getAnomalySummary,
  getAllObservations,
  getHeatPotential,
  inspectHeatPotentialPoint,
} from './services/api';
import type { AnomalyFleetSummary, HeatPotentialPoint } from './types';
import type { OceanSliceData } from './hooks/useOceanData';

import {
  getSectorCameraPosition,
  latLonToVector3,
  type SectorId,
} from './utils/coordinates';
import './App.css';

const TCHPInspectorCard = lazy(() => import('./components/Panels/TCHPInspectorCard'));
const ComparisonPanel = lazy(() => import('./components/Panels/ComparisonPanel'));
const MissionBriefingModal = lazy(() => import('./components/Panels/MissionBriefingModal'));
const VerticalProfileHUD = lazy(() => import('./components/Controls/VerticalProfileHUD'));
const OceanDossierModal = lazy(() => import('./components/Panels/OceanDossierModal'));
const RegionAnalysisModal = lazy(() => import('./components/Panels/RegionAnalysisModal'));

const TransectModal = lazy(() => import('./components/Panels/TransectModal'));
const GlobalSearchModal = lazy(() => import('./components/Panels/GlobalSearchModal'));
const AiAnalystModal = lazy(() => import('./components/Panels/AiAnalystModal'));
const DataProvenanceModal = lazy(() => import('./components/Panels/DataProvenanceModal'));
const OperationalSituationRoom = lazy(() => import('./components/Panels/OperationalSituationRoom'));
const LearnStoryJourney = lazy(() => import('./components/Panels/LearnStoryJourney'));
const DataManagerModal = lazy(() => import('./components/Panels/DataManagerModal'));
const CoLocationModal = lazy(() => import('./components/Panels/CoLocationModal'));
const SoundingStudioPage = lazy(() => import('./components/Panels/SoundingStudioPage'));

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
   const [provenanceOpen, setProvenanceOpen] = useState(false);
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);

  // SAGAR-VIEW Product Mode & Co-Location Engine state
  const [productMode, setProductMode] = useState<ProductMode>('research');
  const [coLocationOpen, setCoLocationOpen] = useState(false);

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
  const [showTCHP, setShowTCHP] = useState<boolean>(false);
  const [tchpSliceData, setTchpSliceData] = useState<OceanSliceData | null>(null);
  const [tchpPointData, setTchpPointData] = useState<HeatPotentialPoint | null>(null);
  const [showVolumetricBlock, setShowVolumetricBlock] = useState(true);
  const [verticalExaggeration, setVerticalExaggeration] = useState(1.0);

  // Fetch TCHP 2D grid whenever showTCHP is active or timeIndex changes
  useEffect(() => {
    if (!showTCHP) return;
    getHeatPotential({ time_index: timeIndex })
      .then((res) => {
        if (!res) return;
        const { metadata, statistics, tchp } = res;
        const width = metadata.width;
        const height = metadata.height;
        const flatValues = new Float32Array(width * height);
        for (let r = 0; r < height; r++) {
          for (let c = 0; c < width; c++) {
            const v = tchp[r]?.[c];
            flatValues[r * width + c] = v !== null && v !== undefined ? v : -9999;
          }
        }
        setTchpSliceData({
          variable: 'tchp',
          depth: 0,
          latMin: metadata.lat_min,
          latMax: metadata.lat_max,
          lonMin: metadata.lon_min,
          lonMax: metadata.lon_max,
          width,
          height,
          vMin: 0,
          vMax: Math.max(100, statistics.tchp_max || 100),
          values: flatValues,
        });
      })
      .catch((err) => console.warn('Failed to fetch TCHP data', err));

  }, [showTCHP, timeIndex]);


  // Dynamic Fleet Anomaly Intelligence & Sensor Network Counters
  const [anomalySummary, setAnomalySummary] = useState<AnomalyFleetSummary | null>(null);
  const [sensorNetworkCount, setSensorNetworkCount] = useState<number>(argoProfiles.length + 6);

  useEffect(() => {
    getAnomalySummary()
      .then((res) => {
        if (res) setAnomalySummary(res);
      })
      .catch(() => {});
  }, [timeIndex]);

  useEffect(() => {
    getAllObservations()
      .then((res) => {
        if (res && typeof res.total_platforms === 'number') {
          setSensorNetworkCount(res.total_platforms);
        }
      })
      .catch(() => {});
  }, [argoProfiles.length]);

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
      const topFloat = anomalySummary?.highest_anomaly_float;
      const target = topFloat
        ? argoProfiles.find((p) => p.id === topFloat.id || p.platform_id === topFloat.platform_id) || {
            id: topFloat.id,
            platform_id: topFloat.platform_id,
            latitude: topFloat.latitude,
            longitude: topFloat.longitude,
          }
        : argoProfiles[0];

      if (target) {
        setSelectedProfileId(target.id);
        setProbedCoord({ lat: target.latitude, lon: target.longitude });
        // Fetch profile data for HUD
        loadProfileForLocation(target.latitude, target.longitude, target.id);
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

  // Multi-sensor platform selection with smooth camera fly-to (Argo, Buoys, Gliders)
  const handleSelectArgo = (id: string) => {
    setSelectedProfileId(id);
    setProfileHudData((prev) => ({ ...prev, isOpen: false }));
    const p = argoProfiles.find((item) => item.id === id);
    if (p) {
      setProbedCoord({ lat: p.latitude, lon: p.longitude });
      setTargetCameraPos(latLonToVector3(p.latitude, p.longitude, 4.6));
      loadProfileForLocation(p.latitude, p.longitude, id);
    } else {
      const KNOWN_SENSORS: Record<string, { lat: number; lon: number }> = {
        buoy_BD08: { lat: 13.0, lon: 84.0 },
        buoy_BD11: { lat: 15.5, lon: 86.5 },
        buoy_AD02: { lat: 15.0, lon: 69.0 },
        buoy_AD07: { lat: 10.5, lon: 72.5 },
        buoy_RAMA_EQ: { lat: 0.0, lon: 80.5 },
        glider_bob_01: { lat: 16.0, lon: 85.5 },
      };
      const s = KNOWN_SENSORS[id];
      if (s) {
        setProbedCoord({ lat: s.lat, lon: s.lon });
        setTargetCameraPos(latLonToVector3(s.lat, s.lon, 4.4));
        loadProfileForLocation(s.lat, s.lon, id);
      }
    }
  };

  // Ocean surface coordinate left-click probe
  const handleProbeCoordinate = (coord: { lat: number; lon: number }) => {
    setProbedCoord(coord);
    setSelectedProfileId(null);
    loadProfileForLocation(coord.lat, coord.lon);
    if (showTCHP) {
      inspectHeatPotentialPoint({ lat: coord.lat, lon: coord.lon, time_index: timeIndex })
        .then(setTchpPointData)
        .catch(() => {});
    }
  };

  // Quick preset: Bay of Bengal Cyclone Season View (12°N, 88°E, Depth 0m, TCHP active)
  const handleCycloneSeasonView = () => {
    handleSelectSector('bay_of_bengal');
    setTargetCameraPos(getSectorCameraPosition('bay_of_bengal'));
    setDepth(0);
    setShowTCHP(true);
    inspectHeatPotentialPoint({ lat: 14.0, lon: 88.0, time_index: timeIndex })
      .then(setTchpPointData)
      .catch(() => {});
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

  // SAGAR-VIEW Product Mode change handler with explainMode backward compatibility
  const handleProductModeChange = (mode: ProductMode) => {
    setProductMode(mode);
    // Map product mode to explainMode for ComparisonPanel & HoverSounderHUD backward compat
    if (mode === 'research') {
      // Research mode preserves current explainMode (citizen/scientist toggle stays)
    } else if (mode === 'operational') {
      setExplainMode('citizen');
    } else if (mode === 'learn') {
      setExplainMode('citizen');
    } else if (mode === 'datamanager') {
      setExplainMode('scientist');
    }
  };

  // Camera fly-to handler for LearnStoryJourney
  const handleCameraFlyTo = (lat: number, lon: number, altitude?: number) => {
    setTargetCameraPos(latLonToVector3(lat, lon, altitude ?? 4.6));
  };

  // Keep fresh references for keyboard handlers to prevent stale closures
  const handleSelectSectorRef = useRef(handleSelectSector);
  handleSelectSectorRef.current = handleSelectSector;

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
        setCoLocationOpen(false);
      } else if (e.key === '1') {
        handleSelectSectorRef.current('all_india');
      } else if (e.key === '2') {
        handleSelectSectorRef.current('arabian_sea');
      } else if (e.key === '3') {
        handleSelectSectorRef.current('bay_of_bengal');
      } else if (e.key === '4') {
        handleSelectSectorRef.current('anomaly_target');
      } else if (e.key === '5') {
        handleSelectSectorRef.current('equatorial');
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
        setProfileHudData((prev) => {
          const next = !prev.isOpen;
          if (next) setSelectedProfileId(null);
          return { ...prev, isOpen: next };
        });
      } else if (e.key === 'f' || e.key === 'F') {
        setFleetOpen((prev) => !prev);
      } else if (e.key === '?') {
        setShowHotkeys((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unit = variable === 'thetao' ? '°C' : variable === 'so' ? 'PSU' : 'm/s';

  return (
    <div className="app">
      {/* Real-time Scientific & Operational Toast Notifications */}
      <ToastContainer />

      {/* First-Run Operational Orientation Hint */}
      <OnboardingHint />

      {/* Scientific Ocean Intelligence Header */}
      <header className="top-bar">

        <div className="top-bar-left">
          <div className="logo">
            <div className="logo-hex">⬡</div>
            <div className="logo-text">
              <h1>OCEAN-X</h1>
              <span className="logo-subtitle">SCIENTIFIC 3D OCEAN WORKSTATION</span>
            </div>
          </div>
          
          <DataSourceBadge />

          {/* Global Search Bar (⌘K / Ctrl+K) */}
          <div className="global-search-bar" onClick={() => setSearchModalOpen(true)}>
            <span className="search-bar-icon">⌕</span>
            <span className="search-bar-placeholder">Search domain, platform, variable...</span>
            <span className="search-bar-kbd">⌘K</span>
          </div>
        </div>

        {/* View Lens Switcher & Ocean Basin Presets */}
        <div className="top-bar-center">
          <ProductModeSelector currentMode={productMode} onSelectMode={handleProductModeChange} />
          {productMode === 'research' && (
            <ExplainabilityToggle mode={explainMode} onChange={setExplainMode} />
          )}
          <SectorNavigator
            currentSector={currentSector}
            onSelectSector={handleSelectSector}
          />
        </div>

        <div className="top-bar-right">
          <span className="utc-clock">{utcTime}</span>

          {/* Significant Anomaly Alert Badge */}
          {(() => {
            const anomCount = anomalySummary
              ? anomalySummary.critical_count + anomalySummary.warning_count
              : 0;
            return (
              <button
                className="c2-badge anomaly-alert-badge anomaly-clickable"
                onClick={() => handleSelectSector('anomaly_target')}
                title={`Inspect Subsurface Thermal Anomalies (${anomCount} detected, Key: 4)`}
              >
                ⚠ {anomCount} {anomCount === 1 ? 'ANOMALY' : 'ANOMALIES'}
              </button>
            );
          })()}

          {/* Data Provenance & Methodology */}
          <button
            className="c2-badge tool-btn"
            onClick={() => setProvenanceOpen(true)}
            title="View Data Provenance, Grid Resolution & ML Methods"
          >
            PROVENANCE
          </button>

          {/* Spatial & AI Analysis Tools Dropdown */}
          <div className="tools-dropdown-container">
            <button
              className={`c2-badge tool-btn ${toolsMenuOpen ? 'active' : ''}`}
              onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
              title="Spatial & ML Analysis Tools"
            >
              ANALYSIS ▾
            </button>
            {toolsMenuOpen && (
              <div className="tools-dropdown-menu" onClick={() => setToolsMenuOpen(false)}>
                <button className="tools-menu-item" onClick={() => setTransectModalOpen(true)}>
                  <span className="item-icon">⟂</span>
                  <div className="item-text">
                    <span className="item-title">Vertical Transect</span>
                    <span className="item-desc">2D depth-distance cross-section (T)</span>
                  </div>
                </button>
                <button className="tools-menu-item" onClick={() => setRegionModalOpen(true)}>
                  <span className="item-icon">⬚</span>
                  <div className="item-text">
                    <span className="item-title">Basin Analytics</span>
                    <span className="item-desc">Bounding box stats & histogram (R)</span>
                  </div>
                </button>
                <button className="tools-menu-item" onClick={() => setAiModalOpen(true)}>
                  <span className="item-icon">✦</span>
                  <div className="item-text">
                    <span className="item-title">Grounded AI Analyst</span>
                    <span className="item-desc">Residual-backed diagnosis (A)</span>
                  </div>
                </button>
                <button className="tools-menu-item" onClick={() => setCoLocationOpen(true)}>
                  <span className="item-icon">🎯</span>
                  <div className="item-text">
                    <span className="item-title">Co-Location Engine</span>
                    <span className="item-desc">Model–observation spatial matching</span>
                  </div>
                </button>
                <button className="tools-menu-item" onClick={() => setProductMode('sounding')}>
                  <span className="item-icon">📊</span>
                  <div className="item-text">
                    <span className="item-title">Sounding Studio</span>
                    <span className="item-desc">Dedicated observation workstation</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* In-Situ Multi-Sensor Platform Network Count */}
          <button
            className="c2-badge floats fleet-btn"
            onClick={() => setFleetOpen(!fleetOpen)}
            title="Inspect Active In-Situ Sensor Network (Key: F)"
          >
            📡 {sensorNetworkCount} SENSORS
          </button>

          {/* Scientific Briefing */}
          <button
            className="c2-badge briefing-btn"
            onClick={() => setBriefingOpen(true)}
            title="SIH26067 Scientific Brief & Evaluation Guide (Key: B)"
          >
            BRIEF
          </button>

          {/* Snapshot Export */}
          <button
            className="c2-badge snapshot-btn"
            onClick={handleCaptureSnapshot}
            title="Export High-Resolution Canvas"
          >
            EXPORT
          </button>

          {/* Keyboard Shortcuts Matrix */}
          <button
            className="c2-badge hotkeys-btn"
            onClick={() => setShowHotkeys(!showHotkeys)}
            title="Keyboard Shortcuts Guide (Key: ?)"
          >
            ?
          </button>
        </div>
      </header>

      {/* SAGAR-VIEW Operational Situation Room Banner (Blueprint §8.7 & §16) */}
      {productMode === 'operational' && (
        <Suspense fallback={null}>
          <OperationalSituationRoom
            onJumpToAnomaly={() => handleSelectSector('anomaly_target')}
            onJumpToBuoy={(buoyId) => {
              if (buoyId === 'buoy_BD08') {
                handleCameraFlyTo(13.0, 84.0, 4.2);
                setProbedCoord({ lat: 13.0, lon: 84.0 });
                loadProfileForLocation(13.0, 84.0, 'buoy_BD08');
              }
            }}
            onClose={() => setProductMode('research')}
          />
        </Suspense>
      )}

      {/* 3D Ocean Viewport */}
      <main className="viewport">
        {/* Google Earth Style On-Screen Viewport Navigation Controls */}
        <ViewportControls
          cameraPitch={cameraPitch}
          onPitchChange={setCameraPitch}
          onResetNadir={() => {
            setCameraPitch(75);
            setCurrentSector('all_india');
            setTargetCameraPos(getSectorCameraPosition('all_india'));
          }}
        />
        {/* Persistent Left Layer Rail (PRD §6) */}
        <LayerRail
          variable={variable}
          depth={depth}
          showCurrents={showCurrents}
          opacity={oceanOpacity}
          showArgo={showArgo}
          showSST={showSST}
          showCyclones={showCyclones}
          showTCHP={showTCHP}
          showVolumetricBlock={showVolumetricBlock}
          verticalExaggeration={verticalExaggeration}
          onVariableChange={setVariable}
          onToggleCurrents={() => setShowCurrents((visible) => !visible)}
          onToggleArgo={() => setShowArgo((visible) => !visible)}
          onToggleSST={() => setShowSST((visible) => !visible)}
          onToggleCyclones={() => setShowCyclones((visible) => !visible)}
          onToggleTCHP={() => {
            const next = !showTCHP;
            setShowTCHP(next);
            if (!next) setTchpPointData(null);
          }}
          onCycloneSeasonView={handleCycloneSeasonView}
          onToggleVolumetricBlock={() => setShowVolumetricBlock((visible) => !visible)}
          onVerticalExaggerationChange={setVerticalExaggeration}
          onOpacityChange={setOceanOpacity}
          onOpenTransect={() => setTransectModalOpen(true)}
          onOpenRegionAnalysis={() => setRegionModalOpen(true)}
          isOpen={layerRailOpen}
          onToggleOpen={() => setLayerRailOpen(!layerRailOpen)}
        />

        {/* Real-time View Diagnostics & Parameter Card */}
        {sliceData && !fleetOpen && !layerRailOpen && (
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
            railOpen={layerRailOpen}
          />
        )}

        {/* In-Situ Fleet Sidebar Drawer */}
        <FleetSidebar
          profiles={argoProfiles}
          selectedId={selectedProfileId}
          isOpen={fleetOpen}
          onToggle={() => setFleetOpen(!fleetOpen)}
          onSelect={handleSelectArgo}
          railOpen={layerRailOpen}
        />

        {/* 3D Globe with continents, ocean raster, currents, and Argo markers */}
        <Globe
          sliceData={showTCHP && tchpSliceData ? tchpSliceData : sliceData}
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
          showVolumetricBlock={showVolumetricBlock}
          verticalExaggeration={verticalExaggeration}
          onSelectArgo={handleSelectArgo}
          onProbeCoordinate={handleProbeCoordinate}
          onContextMenuCoordinate={handleContextMenuCoordinate}
          onCameraFlightComplete={() => setTargetCameraPos(null)}
        />


        {/* Floating Vertical Profile Sounding HUD (Image 1) */}
        {profileHudData.isOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {/* Right-Click Ocean Region Dossier Modal (PRD §15) */}
        {dossierCoord && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {/* Region Analysis Bounding Box Modal (PRD §16 & Image 2) */}
        {regionModalOpen && (
          <Suspense fallback={null}>
            <RegionAnalysisModal
              initialBounds={regionBounds}
              depth={depth}
              timeIndex={timeIndex}
              variable={variable}
              sliceData={sliceData}
              date={currentDate}
              onClose={() => setRegionModalOpen(false)}
              onFocusRegion={(latMin, latMax, lonMin, lonMax) => {
                const cLat = (latMin + latMax) / 2;
                const cLon = (lonMin + lonMax) / 2;
                setTargetCameraPos(latLonToVector3(cLat, cLon, 5.5));
              }}
              onInspectCoordinate={(lat, lon) => {
                setProbedCoord({ lat, lon });
                setTargetCameraPos(latLonToVector3(lat, lon, 4.8));
                loadProfileForLocation(lat, lon);
              }}
            />
          </Suspense>
        )}

        {/* Ocean Transect Vertical Cross-Section Modal (PRD §17) */}
        {transectModalOpen && (
          <Suspense fallback={null}>
            <TransectModal
              initialLine={transectLine}
              timeIndex={timeIndex}
              onClose={() => setTransectModalOpen(false)}
            />
          </Suspense>
        )}

        {/* Global Search Modal (⌘K / Ctrl+K — PRD §24) */}
        {searchModalOpen && (
          <Suspense fallback={null}>
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
          </Suspense>
        )}

        {/* Grounded Ocean Analyst AI Modal (PRD §21-23) */}
        {aiModalOpen && (
          <Suspense fallback={null}>
            <AiAnalystModal
              isOpen={aiModalOpen}
              latitude={probedCoord?.lat ?? 14.5}
              longitude={probedCoord?.lon ?? 84.8}
              depth={depth}
              timeIndex={timeIndex}
              onClose={() => setAiModalOpen(false)}
              onTargetAnomaly={() => handleSelectSector('anomaly_target')}
            />
          </Suspense>
        )}

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
        {briefingOpen && (
          <Suspense fallback={null}>
            <MissionBriefingModal
              isOpen={briefingOpen}
              onClose={() => setBriefingOpen(false)}
              onJumpToAnomaly={() => handleSelectSector('anomaly_target')}
            />
          </Suspense>
        )}

        {/* Data Provenance & Scientific Methodology Modal */}
        {provenanceOpen && (
          <Suspense fallback={null}>
            <DataProvenanceModal
              isOpen={provenanceOpen}
              onClose={() => setProvenanceOpen(false)}
            />
          </Suspense>
        )}

        {/* SAGAR-VIEW Learn Mode Guided Journey (Blueprint §16) */}
        {productMode === 'learn' && (
          <Suspense fallback={null}>
            <LearnStoryJourney
              onCameraFlyTo={handleCameraFlyTo}
              onClose={() => setProductMode('research')}
            />
          </Suspense>
        )}

        {/* SAGAR-VIEW Data Manager & CF-1.8 NetCDF Inspector (Blueprint §16) */}
        {productMode === 'datamanager' && (
          <Suspense fallback={null}>
            <DataManagerModal
              onClose={() => setProductMode('research')}
            />
          </Suspense>
        )}

        {/* SAGAR-VIEW Spatial-Temporal Co-Location Engine (Blueprint §8.2) */}
        {coLocationOpen && (
          <Suspense fallback={null}>
            <CoLocationModal
              isOpen={coLocationOpen}
              probedLat={probedCoord?.lat ?? 14.5}
              probedLon={probedCoord?.lon ?? 84.8}
              onClose={() => setCoLocationOpen(false)}
              onJumpToSensor={(lat, lon) => {
                handleCameraFlyTo(lat, lon, 4.4);
                setProbedCoord({ lat, lon });
                loadProfileForLocation(lat, lon);
                setCoLocationOpen(false);
              }}
            />
          </Suspense>
        )}

        {/* Core Differentiator: Model vs Reality Comparison Drawer */}
        {selectedProfileId && productMode !== 'sounding' && (
          <Suspense fallback={null}>
            <ComparisonPanel
              profileId={selectedProfileId}
              variable={variable}
              timeIndex={timeIndex}
              explainMode={explainMode}
              onClose={() => setSelectedProfileId(null)}
              onOpenFullPage={() => setProductMode('sounding')}
            />
          </Suspense>
        )}

        {/* SAGAR-VIEW Dedicated In-Situ Sounding Studio Workstation */}
        {productMode === 'sounding' && (
          <Suspense fallback={null}>
            <SoundingStudioPage
              initialProfileId={selectedProfileId}
              profiles={argoProfiles}
              variable={variable}
              timeIndex={timeIndex}
              onSelectProfile={(id) => setSelectedProfileId(id)}
              onVariableChange={setVariable}
              onClose={() => setProductMode('research')}
            />
          </Suspense>
        )}

        {/* Colorbar scale legend */}
        {showTCHP && tchpSliceData ? (
          <Colorbar
            variable="tchp"
            vMin={0}
            vMax={tchpSliceData.vMax}
          />
        ) : sliceData ? (
          <Colorbar
            variable={variable}
            vMin={sliceData.vMin}
            vMax={sliceData.vMax}
          />
        ) : null}

        {/* TCHP & Marine Heatwave Inspection HUD Card */}
        {showTCHP && tchpPointData && (
          <Suspense fallback={null}>
            <TCHPInspectorCard
              data={tchpPointData}
              onClose={() => setTchpPointData(null)}
              onOpenTransect={() => {
                setTransectLine({
                  lat1: Math.max(0, tchpPointData.latitude - 3),
                  lon1: Math.max(60, tchpPointData.longitude - 3),
                  lat2: Math.min(28, tchpPointData.latitude + 3),
                  lon2: Math.min(100, tchpPointData.longitude + 3),
                });
                setTransectModalOpen(true);
              }}
            />
          </Suspense>
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
          onToggleCurrents={() => setShowCurrents((visible) => !visible)}
        />
      </footer>
    </div>
  );
}

export default App;
