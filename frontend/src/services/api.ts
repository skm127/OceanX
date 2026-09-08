/**
 * API client for OCEAN-X backend.
 * Features transparent data source modes:
 * - 'live': Live streaming from INCOIS NetCDF FastAPI backend
 * - 'demo': Client-side simulation fallback when backend is unreachable or explicitly requested
 */
import axios from 'axios';
import type {
  ArgoProfile,
  ArgoProfileSummary,
  ComparisonResponse,
  DatasetInfo,
  AnomalyFleetSummary,
  AnomalyAnalysisResponse,
  OceanDossierResponse,
  RegionStatsResponse,
  TransectResponse,
  AiAnalystResponse,
} from '../types';
import {
  getMockModelInfo,
  getMockTimeInfo,
  getMockModelSlice,
  getMockArgoProfiles,
  getMockArgoProfile,
  getMockComparison,
  getMockCurrentVectors,
  getMockDossier,
  getMockRegionStats,
  getMockTransect,
  getMockAiAnalyst,
  getMockAnomalySummary,
  getMockDetectAnomaly,
} from './mockFallback';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 8000,
});

export type DataSourceMode = 'live' | 'demo';

let currentMode: DataSourceMode = 'live';
let forceDemoMode = false;
const modeListeners = new Set<(mode: DataSourceMode) => void>();

export function getDataSourceMode(): DataSourceMode {
  return currentMode;
}

export function setForceDemoMode(enable: boolean) {
  forceDemoMode = enable;
  currentMode = enable ? 'demo' : 'live';
  modeListeners.forEach((fn) => fn(currentMode));
}

export function onDataSourceModeChange(listener: (mode: DataSourceMode) => void) {
  modeListeners.add(listener);
  return () => {
    modeListeners.delete(listener);
  };
}

function notifySuccess() {
  if (forceDemoMode) return;
  if (currentMode !== 'live') {
    currentMode = 'live';
    modeListeners.forEach((fn) => fn('live'));
  }
}

function notifyFallback() {
  if (currentMode !== 'demo') {
    currentMode = 'demo';
    modeListeners.forEach((fn) => fn('demo'));
  }
}

/** Health check */
export async function getHealth() {
  if (forceDemoMode) {
    notifyFallback();
    return { status: 'healthy_simulation', app_name: 'OCEAN-X (Simulation Mode)' };
  }
  try {
    const res = await api.get('/api/health');
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return { status: 'healthy_simulation', app_name: 'OCEAN-X (Simulation Mode)' };
  }
}

/** Get model dataset info */
export async function getModelInfo(): Promise<DatasetInfo> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockModelInfo();
  }
  try {
    const res = await api.get('/api/model/info');
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockModelInfo();
  }
}

/** Get a 2D depth slice as binary Float32Array */
export async function getModelSlice(
  variable: string = 'thetao',
  depth: number = 0,
  timeIndex: number = 0
): Promise<{ data: Float32Array; metadata: Record<string, string> }> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockModelSlice(variable, depth, timeIndex);
  }
  try {
    const res = await api.get('/api/model/slice', {
      params: { variable, depth, time_index: timeIndex },
      responseType: 'arraybuffer',
    });

    const metadata: Record<string, string> = {};
    ['x-width', 'x-height', 'x-min', 'x-max', 'x-variable', 'x-depth',
     'x-lat-min', 'x-lat-max', 'x-lon-min', 'x-lon-max'].forEach((key) => {
      const val = res.headers[key];
      if (val) metadata[key] = val;
    });

    notifySuccess();
    return {
      data: new Float32Array(res.data),
      metadata,
    };
  } catch {
    notifyFallback();
    return getMockModelSlice(variable, depth, timeIndex);
  }
}

/** Get a vertical profile from the model */
export async function getModelProfile(
  variable: string,
  lat: number,
  lon: number,
  timeIndex: number = 0
) {
  if (forceDemoMode) {
    notifyFallback();
    const depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500];
    const isAnomaly = Math.abs(lat - 14.5) < 3 && Math.abs(lon - 84.8) < 3;
    const values = depths.map((d) => {
      const base = 29.1 * Math.exp(-d / 180) + 5.0;
      const boost = isAnomaly && d >= 50 && d <= 200 ? 3.1 : 0;
      return Number((base + boost).toFixed(2));
    });
    return { latitude: lat, longitude: lon, variable, time_index: timeIndex, depths, values };
  }
  try {
    const res = await api.get('/api/model/profile', {
      params: { variable, lat, lon, time_index: timeIndex },
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    const depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500];
    const isAnomaly = Math.abs(lat - 14.5) < 3 && Math.abs(lon - 84.8) < 3;
    const values = depths.map((d) => {
      const base = 29.1 * Math.exp(-d / 180) + 5.0;
      const boost = isAnomaly && d >= 50 && d <= 200 ? 3.1 : 0;
      return Number((base + boost).toFixed(2));
    });
    return { latitude: lat, longitude: lon, variable, time_index: timeIndex, depths, values };
  }
}

/** Get all Argo profiles in region */
export async function getArgoProfiles(
  latMin = 0, latMax = 28, lonMin = 60, lonMax = 100
): Promise<{ profiles: ArgoProfileSummary[]; count: number }> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockArgoProfiles();
  }
  try {
    const res = await api.get('/api/observations/argo', {
      params: { lat_min: latMin, lat_max: latMax, lon_min: lonMin, lon_max: lonMax },
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockArgoProfiles();
  }
}

/** Get a specific Argo profile with full data */
export async function getArgoProfile(profileId: string): Promise<ArgoProfile> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockArgoProfile(profileId);
  }
  try {
    const res = await api.get(`/api/observations/argo/${profileId}`);
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockArgoProfile(profileId);
  }
}

/** Compare an Argo profile against the model */
export async function compareProfile(
  profileId: string,
  variable: string = 'thetao',
  timeIndex: number = 0,
  anomalyThreshold: number = 1.0
): Promise<ComparisonResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockComparison(profileId, variable, timeIndex, anomalyThreshold);
  }
  try {
    const res = await api.get(`/api/compare/profile/${profileId}`, {
      params: { variable, time_index: timeIndex, anomaly_threshold: anomalyThreshold },
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockComparison(profileId, variable, timeIndex, anomalyThreshold);
  }
}

/** Get current vectors for visualization */
export async function getCurrentVectors(
  depth: number = 0,
  timeIndex: number = 0,
  subsample: number = 5
) {
  if (forceDemoMode) {
    notifyFallback();
    return getMockCurrentVectors(depth, timeIndex);
  }
  try {
    const res = await api.get('/api/model/currents', {
      params: { depth, time_index: timeIndex, subsample },
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockCurrentVectors(depth, timeIndex);
  }
}

/** Get time step dates */
export async function getTimeInfo(): Promise<{ dates: string[]; count: number }> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockTimeInfo();
  }
  try {
    const res = await api.get('/api/model/time_info');
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockTimeInfo();
  }
}

/** Get fleet-wide ML anomaly intelligence summary */
export async function getAnomalySummary(): Promise<AnomalyFleetSummary> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockAnomalySummary();
  }
  try {
    const res = await api.get('/api/anomaly/summary');
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockAnomalySummary();
  }
}

/** Run deep ML anomaly detection on a single float profile */
export async function detectAnomaly(
  profileId: string,
  variable: string = 'thetao',
  threshold: number = 1.0,
  timeIndex: number = 0
): Promise<AnomalyAnalysisResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockDetectAnomaly(profileId, variable, threshold, timeIndex);
  }
  try {
    const res = await api.get(`/api/anomaly/detect/${profileId}`, {
      params: { variable, threshold, time_index: timeIndex },
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockDetectAnomaly(profileId, variable, threshold, timeIndex);
  }
}

/** Contextual Ocean Region Dossier for right-click inspection */
export async function getOceanDossier(
  lat: number,
  lon: number,
  depth: number = 0,
  timeIndex: number = 0
): Promise<OceanDossierResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockDossier(lat, lon, depth);
  }
  try {
    const res = await api.get('/api/analytics/dossier', {
      params: { lat, lon, depth, time_index: timeIndex },
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockDossier(lat, lon, depth);
  }
}

/** Calculate spatial statistics over a bounding box region */
export async function calculateRegionStats(params: {
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
  depth?: number;
  time_index?: number;
  variable?: string;
}): Promise<RegionStatsResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockRegionStats(params);
  }
  try {
    const res = await api.post('/api/analytics/region/stats', {
      lat_min: params.lat_min,
      lat_max: params.lat_max,
      lon_min: params.lon_min,
      lon_max: params.lon_max,
      depth: params.depth ?? 0.0,
      time_index: params.time_index ?? 0,
      variable: params.variable ?? 'thetao',
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockRegionStats(params);
  }
}

/** Calculate ocean transect vertical depth-distance cross section */
export async function calculateTransect(params: {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
  variable?: string;
  time_index?: number;
  num_samples?: number;
}): Promise<TransectResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockTransect(params);
  }
  try {
    const res = await api.post('/api/analytics/transect', {
      lat1: params.lat1,
      lon1: params.lon1,
      lat2: params.lat2,
      lon2: params.lon2,
      variable: params.variable ?? 'thetao',
      time_index: params.time_index ?? 0,
      num_samples: params.num_samples ?? 25,
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockTransect(params);
  }
}

/** Grounded AI ocean analyst query */
export async function queryAiAnalyst(params: {
  query: string;
  lat?: number;
  lon?: number;
  depth?: number;
  profile_id?: string;
  time_index?: number;
}): Promise<AiAnalystResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockAiAnalyst(params);
  }
  try {
    const res = await api.post('/api/analytics/ai/analyze', {
      query: params.query,
      lat: params.lat,
      lon: params.lon,
      depth: params.depth ?? 100.0,
      profile_id: params.profile_id,
      time_index: params.time_index ?? 0,
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockAiAnalyst(params);
  }
}

// ═══════════════════════════════════════════════════════════════
// SAGAR-VIEW Multi-Sensor INCOIS Network APIs
// ═══════════════════════════════════════════════════════════════

export interface SensorSummary {
  id: string;
  type: 'argo' | 'moored_buoy' | 'glider';
  platform_id: string;
  latitude: number;
  longitude: number;
  status: string;
  last_report?: string;
}

export interface AllObservationsResponse {
  argo: SensorSummary[];
  moored_buoys: SensorSummary[];
  gliders: SensorSummary[];
  total_platforms: number;
}

export interface CoLocationMatch {
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

export interface CoLocationResponse {
  query: { lat: number; lon: number; radius_km: number; time_window_hours: number };
  matches: CoLocationMatch[];
  total_candidates: number;
}

/** Get all observations across all sensor types (Argo + Buoys + Gliders) */
export async function getAllObservations(): Promise<AllObservationsResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockAllObservations();
  }
  try {
    const res = await api.get('/api/observations/all');
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockAllObservations();
  }
}

/** Spatial-temporal co-location: find nearby observations for a model grid point */
export async function getCoLocationResults(params: {
  lat: number;
  lon: number;
  radius_km?: number;
  time_window_hours?: number;
  variable?: string;
  time_index?: number;
}): Promise<CoLocationResponse> {
  if (forceDemoMode) {
    notifyFallback();
    return getMockCoLocation(params.lat, params.lon);
  }
  try {
    const res = await api.get('/api/analytics/colocate', {
      params: {
        lat: params.lat,
        lon: params.lon,
        radius_km: params.radius_km ?? 200,
        time_window_hours: params.time_window_hours ?? 24,
        variable: params.variable ?? 'thetao',
        time_index: params.time_index ?? 0,
      },
    });
    notifySuccess();
    return res.data;
  } catch {
    notifyFallback();
    return getMockCoLocation(params.lat, params.lon);
  }
}

// ── Mock fallbacks for Vercel deployment ──

function getMockAllObservations(): AllObservationsResponse {
  return {
    argo: [
      { id: 'argo_2902345', type: 'argo', platform_id: '2902345', latitude: 14.5, longitude: 84.8, status: 'active' },
      { id: 'argo_2904001', type: 'argo', platform_id: '2904001', latitude: 12.3, longitude: 87.5, status: 'active' },
      { id: 'argo_2903811', type: 'argo', platform_id: '2903811', latitude: 16.1, longitude: 83.2, status: 'active' },
      { id: 'argo_5904321', type: 'argo', platform_id: '5904321', latitude: 8.7, longitude: 72.4, status: 'active' },
      { id: 'argo_2901678', type: 'argo', platform_id: '2901678', latitude: 10.5, longitude: 74.1, status: 'active' },
      { id: 'argo_5905012', type: 'argo', platform_id: '5905012', latitude: 18.3, longitude: 67.6, status: 'active' },
      { id: 'argo_2905234', type: 'argo', platform_id: '2905234', latitude: 4.2, longitude: 81.9, status: 'active' },
      { id: 'argo_2906001', type: 'argo', platform_id: '2906001', latitude: 6.8, longitude: 88.2, status: 'active' },
    ],
    moored_buoys: [
      { id: 'buoy_BD08', type: 'moored_buoy', platform_id: 'BD08', latitude: 13.0, longitude: 84.0, status: 'operational' },
      { id: 'buoy_BD11', type: 'moored_buoy', platform_id: 'BD11', latitude: 15.5, longitude: 86.5, status: 'operational' },
      { id: 'buoy_AD02', type: 'moored_buoy', platform_id: 'AD02', latitude: 15.0, longitude: 69.0, status: 'operational' },
      { id: 'buoy_AD07', type: 'moored_buoy', platform_id: 'AD07', latitude: 10.5, longitude: 72.5, status: 'operational' },
      { id: 'buoy_RAMA_EQ', type: 'moored_buoy', platform_id: 'RAMA_EQ', latitude: 0.0, longitude: 80.5, status: 'operational' },
    ],
    gliders: [
      { id: 'glider_BOB_01', type: 'glider', platform_id: 'GLIDER_BOB_01', latitude: 16.0, longitude: 85.5, status: 'active_mission' },
    ],
    total_platforms: 14,
  };
}

function getMockCoLocation(lat: number, lon: number): CoLocationResponse {
  return {
    query: { lat, lon, radius_km: 200, time_window_hours: 24 },
    matches: [
      {
        sensor_id: '2902345', sensor_type: 'argo',
        latitude: 14.5, longitude: 84.8,
        distance_km: Math.sqrt((lat - 14.5) ** 2 + (lon - 84.8) ** 2) * 111,
        time_offset_hours: 2,
        model_value: 28.5, observed_value: 31.7,
        rmse: 0.847, bias: 3.22, match_score: 87.8,
      },
      {
        sensor_id: 'BD11', sensor_type: 'moored_buoy',
        latitude: 15.5, longitude: 86.5,
        distance_km: Math.sqrt((lat - 15.5) ** 2 + (lon - 86.5) ** 2) * 111,
        time_offset_hours: 0,
        model_value: 29.1, observed_value: 29.4,
        rmse: 0.212, bias: 0.30, match_score: 34.5,
      },
      {
        sensor_id: 'GLIDER_BOB_01', sensor_type: 'glider',
        latitude: 16.0, longitude: 85.5,
        distance_km: Math.sqrt((lat - 16.0) ** 2 + (lon - 85.5) ** 2) * 111,
        time_offset_hours: 8,
        model_value: 27.8, observed_value: 28.1,
        rmse: 0.156, bias: 0.30, match_score: 19.3,
      },
    ],
    total_candidates: 3,
  };
}
