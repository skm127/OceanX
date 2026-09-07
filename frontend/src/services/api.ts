/**
 * API client for OCEAN-X backend.
 * Features automatic client-side fallback simulation for standalone Vercel deployments.
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

/** Health check */
export async function getHealth() {
  try {
    const res = await api.get('/api/health');
    return res.data;
  } catch {
    return { status: 'healthy_fallback', app_name: 'OCEAN-X (Client Simulation)' };
  }
}

/** Get model dataset info */
export async function getModelInfo(): Promise<DatasetInfo> {
  try {
    const res = await api.get('/api/model/info');
    return res.data;
  } catch {
    return getMockModelInfo();
  }
}

/** Get a 2D depth slice as binary Float32Array */
export async function getModelSlice(
  variable: string = 'thetao',
  depth: number = 0,
  timeIndex: number = 0
): Promise<{ data: Float32Array; metadata: Record<string, string> }> {
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

    return {
      data: new Float32Array(res.data),
      metadata,
    };
  } catch {
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
  try {
    const res = await api.get('/api/model/profile', {
      params: { variable, lat, lon, time_index: timeIndex },
    });
    return res.data;
  } catch {
    const depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500];
    const isAnomaly = Math.abs(lat - 14.5) < 3 && Math.abs(lon - 84.8) < 3;
    const values = depths.map((d) => {
      const base = 29.1 * Math.exp(-d / 180) + 5.0;
      const boost = isAnomaly && d >= 50 && d <= 200 ? 3.1 : 0;
      return Number((base + boost).toFixed(2));
    });
    return {
      latitude: lat,
      longitude: lon,
      variable,
      time_index: timeIndex,
      depths,
      values,
    };
  }
}

/** Get all Argo profiles in region */
export async function getArgoProfiles(
  latMin = 0, latMax = 28, lonMin = 60, lonMax = 100
): Promise<{ profiles: ArgoProfileSummary[]; count: number }> {
  try {
    const res = await api.get('/api/observations/argo', {
      params: { lat_min: latMin, lat_max: latMax, lon_min: lonMin, lon_max: lonMax },
    });
    return res.data;
  } catch {
    return getMockArgoProfiles();
  }
}

/** Get a specific Argo profile with full data */
export async function getArgoProfile(profileId: string): Promise<ArgoProfile> {
  try {
    const res = await api.get(`/api/observations/argo/${profileId}`);
    return res.data;
  } catch {
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
  try {
    const res = await api.get(`/api/compare/profile/${profileId}`, {
      params: { variable, time_index: timeIndex, anomaly_threshold: anomalyThreshold },
    });
    return res.data;
  } catch {
    return getMockComparison(profileId, variable, timeIndex, anomalyThreshold);
  }
}

/** Get current vectors for visualization */
export async function getCurrentVectors(
  depth: number = 0,
  timeIndex: number = 0,
  subsample: number = 5
) {
  try {
    const res = await api.get('/api/model/currents', {
      params: { depth, time_index: timeIndex, subsample },
    });
    return res.data;
  } catch {
    return getMockCurrentVectors(depth, timeIndex);
  }
}

/** Get time step dates */
export async function getTimeInfo(): Promise<{ dates: string[]; count: number }> {
  try {
    const res = await api.get('/api/model/time_info');
    return res.data;
  } catch {
    return getMockTimeInfo();
  }
}

/** Get fleet-wide ML anomaly intelligence summary */
export async function getAnomalySummary(): Promise<AnomalyFleetSummary> {
  try {
    const res = await api.get('/api/anomaly/summary');
    return res.data;
  } catch {
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
  try {
    const res = await api.get(`/api/anomaly/detect/${profileId}`, {
      params: { variable, threshold, time_index: timeIndex },
    });
    return res.data;
  } catch {
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
  try {
    const res = await api.get('/api/analytics/dossier', {
      params: { lat, lon, depth, time_index: timeIndex },
    });
    return res.data;
  } catch {
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
    return res.data;
  } catch {
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
    return res.data;
  } catch {
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
  try {
    const res = await api.post('/api/analytics/ai/analyze', {
      query: params.query,
      lat: params.lat,
      lon: params.lon,
      depth: params.depth ?? 100.0,
      profile_id: params.profile_id,
      time_index: params.time_index ?? 0,
    });
    return res.data;
  } catch {
    return getMockAiAnalyst(params);
  }
}
