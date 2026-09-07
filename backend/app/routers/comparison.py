"""API endpoints for Model vs Observation comparison.

This is the hero feature of OCEAN-X — finding where model
predictions diverge from real observations.
"""
from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional
import numpy as np

router = APIRouter(prefix="/api/compare", tags=["Comparison"])


@router.get("/profile/{profile_id}")
def compare_profile(
    profile_id: str,
    request: Request,
    variable: str = Query(default="thetao", description="Variable to compare"),
    time_index: int = Query(default=0, ge=0),
    anomaly_threshold: float = Query(default=1.0, description="Threshold for anomaly flag"),
):
    """Compare an Argo profile against the model at matching depths.
    
    This is the core comparison logic:
    1. Get the observation profile (depths + values)
    2. For each observation depth, interpolate the model value at that lat/lon/depth
    3. Compute delta = observed - model
    4. Flag anomalies where |delta| > threshold
    """
    argo_service = request.app.state.argo_service
    nc_service = request.app.state.nc_service
    
    if not argo_service.is_loaded:
        raise HTTPException(status_code=503, detail="Argo data not loaded")
    if not nc_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model data not loaded")
    
    # Get observation profile
    profile = argo_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile {profile_id} not found")
    
    # Determine which values to compare based on variable
    if variable == "thetao" and profile.get('temperatures'):
        obs_values = profile['temperatures']
    elif variable == "so" and profile.get('salinities'):
        obs_values = profile['salinities']
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Variable '{variable}' not available for this profile"
        )
    
    obs_depths = profile['depths']
    lat = profile['latitude']
    lon = profile['longitude']
    
    # Get model profile at the same location
    try:
        model_depths, model_values = nc_service.get_depth_profile(
            variable=variable,
            lat=lat,
            lon=lon,
            time_index=time_index
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model query failed: {e}")
    
    # Interpolate model values at observation depths
    model_at_obs_depths = np.interp(
        obs_depths,
        model_depths,
        [v if v is not None else np.nan for v in model_values]
    )
    
    # Build comparison results
    comparisons = []
    anomaly_detected = False
    unit = "°C" if variable == "thetao" else "PSU" if variable == "so" else "m/s"
    
    for i, (depth, obs_val) in enumerate(zip(obs_depths, obs_values)):
        if obs_val is None or np.isnan(model_at_obs_depths[i]):
            continue
        
        model_val = float(round(model_at_obs_depths[i], 4))
        delta = round(obs_val - model_val, 4)
        is_anomaly = abs(delta) > anomaly_threshold
        
        if is_anomaly:
            anomaly_detected = True
        
        comparisons.append({
            "depth": depth,
            "model_value": model_val,
            "observed_value": obs_val,
            "delta": delta,
            "unit": unit,
            "anomaly_flag": is_anomaly
        })
    
    return {
        "observation_id": profile_id,
        "platform_type": profile['platform_type'],
        "latitude": lat,
        "longitude": lon,
        "timestamp": profile['timestamp'],
        "variable": variable,
        "comparisons": comparisons,
        "anomaly_detected": anomaly_detected,
        "anomaly_threshold": anomaly_threshold
    }
