"""API endpoints for observation data (Argo floats, etc.)."""
from fastapi import APIRouter, Request, HTTPException, Query
from typing import Optional

router = APIRouter(prefix="/api/observations", tags=["Observations"])


@router.get("/argo")
def get_argo_profiles(
    request: Request,
    lat_min: float = Query(default=0.0),
    lat_max: float = Query(default=28.0),
    lon_min: float = Query(default=60.0),
    lon_max: float = Query(default=100.0),
):
    """Get all Argo float profiles in the region."""
    argo_service = request.app.state.argo_service
    if not argo_service.is_loaded:
        raise HTTPException(status_code=503, detail="Argo data not loaded")
    
    profiles = argo_service.get_profiles_in_region(
        lat_min=lat_min,
        lat_max=lat_max,
        lon_min=lon_min,
        lon_max=lon_max
    )
    return {"profiles": profiles, "count": len(profiles)}


@router.get("/argo/{profile_id}")
def get_argo_profile(profile_id: str, request: Request):
    """Get a specific Argo profile with full depth data."""
    argo_service = request.app.state.argo_service
    if not argo_service.is_loaded:
        raise HTTPException(status_code=503, detail="Argo data not loaded")
    
    profile = argo_service.get_profile(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Profile {profile_id} not found")
    
    return profile


@router.get("/info")
def get_observations_info(request: Request):
    """Get information about loaded observation data."""
    argo_service = request.app.state.argo_service
    return argo_service.get_info()
