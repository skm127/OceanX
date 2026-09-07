/**
 * mockFallback.ts
 * Standalone client-side fallback provider for OCEAN-X.
 * Automatically activates if the backend API is unreachable (e.g. on Vercel preview/production
 * before an external backend instance is linked).
 * Ensures zero-downtime, fully interactive 3D ocean intelligence with realistic synthetic physics.
 */
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

export function getMockModelInfo(): DatasetInfo {
  return {
    filename: 'INCOIS_NEMO_BOB_4D_SYNTHETIC.nc',
    variables: ['thetao', 'so', 'uo', 'vo'],
    dimensions: { time: 7, depth: 14, lat: 113, lon: 161 },
    lat_range: [0.0, 28.0],
    lon_range: [60.0, 100.0],
    depth_levels: [0.0, 5.0, 10.0, 20.0, 30.0, 50.0, 75.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0],
    time_steps: 7,
    is_synthetic: true,
  };
}

export function getMockTimeInfo(): { dates: string[]; count: number } {
  const dates = [];
  const start = new Date('2024-08-05T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return { dates, count: 7 };
}

export function getMockModelSlice(
  variable: string = 'thetao',
  depth: number = 0,
  timeIndex: number = 0
): { data: Float32Array; metadata: Record<string, string> } {
  const width = 161;
  const height = 113;
  const data = new Float32Array(width * height);

  const depthFactor = Math.exp(-depth / 160);
  const timeFactor = Math.sin((timeIndex / 7) * Math.PI * 2) * 0.4;

  let min = Infinity;
  let max = -Infinity;

  for (let row = 0; row < height; row++) {
    const lat = row * (28.0 / (height - 1));
    for (let col = 0; col < width; col++) {
      const lon = 60.0 + col * (40.0 / (width - 1));
      const idx = row * width + col;

      // Indian landmask approximation
      const isLand =
        lat > 8.0 &&
        lat < 24.0 &&
        lon > 72.0 &&
        lon < 88.0 &&
        (lat > 12.0 || (lon > 75.0 && lon < 81.0));

      if (isLand) {
        data[idx] = -9999;
      } else {
        let val: number;
        if (variable === 'thetao') {
          val =
            21.0 +
            8.5 * depthFactor +
            Math.cos((lat / 28) * Math.PI) * 2.0 +
            Math.sin((lon / 40) * Math.PI) * 0.8 +
            timeFactor;
        } else if (variable === 'so') {
          val = 33.2 + (1 - depthFactor) * 1.6 + Math.sin((lat / 28) * Math.PI) * 0.8;
        } else {
          val = 0.15 + depthFactor * 0.6 + Math.sin(lat * 0.4) * Math.cos(lon * 0.3) * 0.25;
        }
        val = Number(val.toFixed(2));
        data[idx] = val;
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
  }

  return {
    data,
    metadata: {
      'x-width': String(width),
      'x-height': String(height),
      'x-min': String(min === Infinity ? 0 : min),
      'x-max': String(max === -Infinity ? 32 : max),
      'x-variable': variable,
      'x-depth': String(depth),
      'x-lat-min': '0',
      'x-lat-max': '28',
      'x-lon-min': '60',
      'x-lon-max': '100',
    },
  };
}

export function getMockArgoProfiles(): { profiles: ArgoProfileSummary[]; count: number } {
  const profiles: ArgoProfileSummary[] = [
    {
      id: 'argo_2902345_0',
      platform_id: '2902345',
      platform_type: 'argo',
      latitude: 14.5,
      longitude: 84.8,
      timestamp: '2024-08-05T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
    {
      id: 'argo_2903001_1',
      platform_id: '2903001',
      platform_type: 'argo',
      latitude: 18.8,
      longitude: 88.5,
      timestamp: '2024-08-06T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
    {
      id: 'argo_2903456_2',
      platform_id: '2903456',
      platform_type: 'argo',
      latitude: 11.5,
      longitude: 93.2,
      timestamp: '2024-08-07T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
    {
      id: 'argo_2903123_3',
      platform_id: '2903123',
      platform_type: 'argo',
      latitude: 8.2,
      longitude: 83.5,
      timestamp: '2024-08-08T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
    {
      id: 'argo_2904001_4',
      platform_id: '2904001',
      platform_type: 'argo',
      latitude: 17.8,
      longitude: 68.5,
      timestamp: '2024-08-05T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
    {
      id: 'argo_2904002_5',
      platform_id: '2904002',
      platform_type: 'argo',
      latitude: 19.5,
      longitude: 64.2,
      timestamp: '2024-08-06T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
    {
      id: 'argo_2904003_6',
      platform_id: '2904003',
      platform_type: 'argo',
      latitude: 11.2,
      longitude: 71.8,
      timestamp: '2024-08-07T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
    {
      id: 'argo_2904004_7',
      platform_id: '2904004',
      platform_type: 'argo',
      latitude: 3.8,
      longitude: 76.5,
      timestamp: '2024-08-08T00:00:00Z',
      n_depths: 70,
      max_depth: 950.0,
    },
  ];
  return { profiles, count: profiles.length };
}

export function getMockArgoProfile(profileId: string): ArgoProfile {
  const depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 950];
  const isAnomaly = profileId.includes('2902345');

  const temperatures = depths.map((d) => {
    const base = 29.4 * Math.exp(-d / 180) + 5.0;
    const boost = isAnomaly && d >= 50 && d <= 200 ? 3.2 : 0;
    return Number((base + boost).toFixed(2));
  });

  const salinities = depths.map((d) => {
    return Number((33.2 + (d / 1000) * 1.8).toFixed(2));
  });

  return {
    id: profileId,
    platform_id: profileId.replace('argo_', '').split('_')[0],
    platform_type: 'argo',
    latitude: isAnomaly ? 14.5 : 18.8,
    longitude: isAnomaly ? 84.8 : 88.5,
    timestamp: '2024-08-05T00:00:00Z',
    depths,
    temperatures,
    salinities,
    source: 'INCOIS Argo GDAC',
  };
}

export function getMockComparison(
  profileId: string,
  variable: string = 'thetao',
  _timeIndex: number = 0,
  threshold: number = 1.0
): ComparisonResponse {
  const depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500];
  const isAnomaly = profileId.includes('2902345');
  const unit = variable === 'thetao' ? '°C' : variable === 'so' ? 'PSU' : 'm/s';

  const comparisons = depths.map((d) => {
    const modelVal = Number((29.1 * Math.exp(-d / 180) + 5.0).toFixed(2));
    const boost = isAnomaly && d >= 50 && d <= 200 ? 3.2 : 0.15;
    const obsVal = Number((modelVal + boost).toFixed(2));
    const delta = Number((obsVal - modelVal).toFixed(2));
    const anomalyFlag = Math.abs(delta) >= threshold;

    return {
      depth: d,
      model_value: modelVal,
      observed_value: obsVal,
      delta,
      unit,
      anomaly_flag: anomalyFlag,
    };
  });

  return {
    observation_id: profileId,
    platform_type: 'argo',
    latitude: isAnomaly ? 14.5 : 18.8,
    longitude: isAnomaly ? 84.8 : 88.5,
    timestamp: '2024-08-05T00:00:00Z',
    variable,
    comparisons,
    anomaly_detected: isAnomaly,
    anomaly_threshold: threshold,
  };
}

export function getMockCurrentVectors(depth: number = 0, _timeIndex: number = 0) {
  const vectors = [];
  const depthAtten = Math.exp(-depth / 150);

  for (let lat = 2; lat <= 26; lat += 3) {
    for (let lon = 62; lon <= 96; lon += 3) {
      const isLand =
        lat > 8.0 &&
        lat < 24.0 &&
        lon > 72.0 &&
        lon < 88.0 &&
        (lat > 12.0 || (lon > 75.0 && lon < 81.0));
      if (!isLand) {
        const u = Number((Math.sin(lat * 0.3) * 0.5 * depthAtten).toFixed(2));
        const v = Number((Math.cos(lon * 0.3) * 0.4 * depthAtten).toFixed(2));
        const speed = Number(Math.sqrt(u * u + v * v).toFixed(2));
        vectors.push({ lat, lon, u, v, speed });
      }
    }
  }

  return {
    depth,
    time_index: 0,
    count: vectors.length,
    speed_min: 0.05,
    speed_max: 0.95,
    vectors,
  };
}

export function getMockDossier(lat: number, lon: number, depth: number = 0): OceanDossierResponse {
  const isAnomalyZone = Math.abs(lat - 14.5) < 3 && Math.abs(lon - 84.8) < 3;
  return {
    coordinate: {
      latitude: lat,
      longitude: lon,
      formatted: `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`,
    },
    depth_m: depth,
    time_index: 0,
    telemetry: {
      temperature: Number((28.8 * Math.exp(-depth / 180) + 5.0).toFixed(2)),
      temperature_unit: '°C',
      salinity: 33.4,
      salinity_unit: 'PSU',
      current_speed: 0.48,
      current_speed_unit: 'm/s',
      current_direction: 'NE',
      current_degrees: 42,
    },
    profile_preview: {
      depths: [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500],
      temperatures: [29.2, 29.1, 28.8, 27.5, 26.0, 23.2, 19.8, 16.5, 13.8, 11.5, 10.2, 9.1, 7.5, 6.2],
      salinities: [33.1, 33.1, 33.2, 33.4, 33.7, 34.0, 34.4, 34.8, 35.0, 35.1, 35.2, 35.2, 35.3, 35.3],
    },
    ocean_context: {
      model_dataset: 'INCOIS NEMO-ROMS 4D Reanalysis (8km)',
      nearby_argo_count: isAnomalyZone ? 1 : 0,
      nearest_float_id: isAnomalyZone ? 'argo_2902345_0' : null,
      nearest_float_dist_km: isAnomalyZone ? 12.4 : null,
      estimated_model_error: isAnomalyZone ? 2.45 : 0.28,
      anomaly_status: isAnomalyZone ? 'Critical Marine Heatwave (+2.45°C)' : 'Nominal Stratification',
    },
    nearby_floats: isAnomalyZone
      ? [
          {
            id: 'argo_2902345_0',
            platform_id: '2902345',
            distance_km: 12.4,
            latitude: 14.5,
            longitude: 84.8,
            last_reported: '2024-08-05T00:00:00Z',
          },
        ]
      : [],
  };
}

export function getMockRegionStats(params: {
  lat_min: number;
  lat_max: number;
  lon_min: number;
  lon_max: number;
}): RegionStatsResponse {
  const latDelta = params.lat_max - params.lat_min;
  const lonDelta = params.lon_max - params.lon_min;
  const areaKm2 = Number((latDelta * 111 * lonDelta * 105).toFixed(1));

  return {
    bounds: params,
    area_km2: areaKm2,
    depth: 0,
    time_index: 0,
    temperature: {
      mean: 28.4,
      min: 24.1,
      max: 30.2,
      std: 1.15,
      histogram: [
        { range: '24-25°C', count: 120, percentage: 5.2 },
        { range: '25-26°C', count: 240, percentage: 10.4 },
        { range: '26-27°C', count: 510, percentage: 22.1 },
        { range: '27-28°C', count: 890, percentage: 38.5 },
        { range: '28-29°C', count: 420, percentage: 18.2 },
        { range: '29-30°C', count: 130, percentage: 5.6 },
      ],
    },
    salinity: {
      mean: 33.6,
      min: 32.1,
      max: 35.2,
    },
    currents: {
      mean_speed_ms: 0.42,
      max_speed_ms: 1.15,
    },
    observations_count: 3,
    model_mean_residual: 0.38,
    anomalies_detected: 1,
    sample_points: 1250,
  };
}

export function getMockTransect(params: {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
}): TransectResponse {
  const depths = [0, 5, 10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 500];
  const numSamples = 25;
  const distancesKm = [];
  const gridMatrix: (number | null)[][] = [];

  for (let s = 0; s < numSamples; s++) {
    distancesKm.push(Number((s * 48.5).toFixed(1)));
    const col: (number | null)[] = [];
    for (const d of depths) {
      const val = Number((29.0 * Math.exp(-d / 180) + 5.0 + Math.sin(s * 0.3) * 0.6).toFixed(2));
      col.push(val);
    }
    gridMatrix.push(col);
  }

  return {
    variable: 'thetao',
    unit: '°C',
    point_a: { lat: params.lat1, lon: params.lon1 },
    point_b: { lat: params.lat2, lon: params.lon2 },
    total_distance_km: Number(((numSamples - 1) * 48.5).toFixed(1)),
    stations_count: numSamples,
    depths,
    distances_km: distancesKm,
    grid_matrix: gridMatrix,
    min_val: 6.2,
    max_val: 29.8,
    time_index: 0,
  };
}

export function getMockAiAnalyst(params: {
  query: string;
  lat?: number;
  lon?: number;
  depth?: number;
}): AiAnalystResponse {
  const isAnomaly = params.lat && Math.abs(params.lat - 14.5) < 3;
  return {
    query: params.query,
    location: {
      latitude: params.lat ?? 14.5,
      longitude: params.lon ?? 84.8,
      depth_m: params.depth ?? 100,
    },
    severity: isAnomaly ? 'CRITICAL' : 'NOMINAL',
    confidence_percent: 89,
    title: isAnomaly
      ? 'Critical Subsurface Marine Heatwave Detected'
      : 'Regional Ocean Stratification Concordant with Baseline',
    scientific_narrative: isAnomaly
      ? 'Critical subsurface thermal anomaly observed in the Bay of Bengal. The upper 150m isopycnal layer exhibits a +3.2°C elevation above the numerical forecast model.'
      : 'Regional ocean thermal structure and salinity stratification match historical INCOIS reanalysis standards.',
    evidence: {
      model_value: 22.8,
      observed_value: 26.0,
      residual_delta: 3.2,
      unit: '°C',
      depth_range: '50m - 200m',
      supporting_argo_count: 1,
      model_dataset: 'INCOIS NEMO-ROMS 4D Reanalysis',
      primary_float_id: 'argo_2902345_0',
    },
    recommendations: isAnomaly
      ? 'Advisory: High Tropical Cyclone Heat Potential (TCHP) in sector. Recommend initiating enhanced ocean sensor telemetry cycles.'
      : 'Routine surveillance advisory: Ocean conditions nominal.',
  };
}

export function getMockAnomalySummary(): AnomalyFleetSummary {
  const member = {
    id: 'argo_2902345_0',
    platform_id: '2902345',
    latitude: 14.5,
    longitude: 84.8,
    status: 'CRITICAL_ANOMALY' as const,
    severity: 'HIGH' as const,
    anomaly_score: 0.884,
    max_delta: 3.22,
    max_depth: 100,
    hypothesis: 'Subsurface Marine Heatwave & Downwelling Eddy',
  };

  return {
    total_floats: 8,
    critical_count: 1,
    warning_count: 0,
    nominal_count: 7,
    highest_anomaly_float: member,
    fleet: [member],
  };
}

export function getMockDetectAnomaly(
  profileId: string,
  variable: string = 'thetao',
  _threshold: number = 1.0,
  _timeIndex: number = 0
): AnomalyAnalysisResponse {
  const isAnomaly = profileId.includes('2902345');
  return {
    profile_id: profileId,
    variable,
    anomaly_score: isAnomaly ? 0.884 : 0.125,
    status: isAnomaly ? 'CRITICAL_ANOMALY' : 'NOMINAL',
    severity: isAnomaly ? 'HIGH' : 'LOW',
    features: {
      max_layer_depth: isAnomaly ? 100 : 20,
      mean_delta: isAnomaly ? 2.45 : 0.18,
      max_delta: isAnomaly ? 3.22 : 0.25,
      thermocline_gradient_diff: isAnomaly ? 0.038 : 0.004,
      upper_200m_heat_delta: isAnomaly ? 3.12 : 0.22,
    },
    hypothesis: isAnomaly
      ? 'Anti-cyclonic mesoscale eddy downwelling trapping anomalously warm equatorial surface waters below 80m thermocline boundary.'
      : 'Close concordance between numerical model equations and in-situ CTD probe measurements.',
    anomalous_depths: isAnomaly ? [50, 75, 100, 150, 200] : [],
    layer_anomalies: isAnomaly
      ? [
          { depth: 50, model: 23.2, observed: 25.4, delta: 2.2, is_anomaly: true },
          { depth: 75, model: 19.8, observed: 22.1, delta: 2.3, is_anomaly: true },
          { depth: 100, model: 16.5, observed: 19.7, delta: 3.22, is_anomaly: true },
          { depth: 150, model: 13.8, observed: 16.2, delta: 2.4, is_anomaly: true },
          { depth: 200, model: 11.5, observed: 13.1, delta: 1.6, is_anomaly: true },
        ]
      : [],
  };
}
