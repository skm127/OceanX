"""
realtime.py
REST API endpoints for real-time live ocean telemetry and 72-hour forward predictions.
"""

from fastapi import APIRouter, Query, Request
from typing import Optional

router = APIRouter(prefix="/api/realtime", tags=["realtime"])


@router.get("/live-ocean")
def get_live_ocean_conditions(
    request: Request,
    lat: float = Query(14.5, description="Latitude in degrees (-90 to 90)"),
    lon: float = Query(84.8, description="Longitude in degrees (-180 to 180)"),
):
    """
    Retrieve real-time live ocean observations (waves, currents, thermal state)
    plus actual 72-hour hourly forward predictions for specified geographic coordinates.
    """
    service = getattr(request.app.state, "realtime_service", None)
    if not service:
        from app.services.realtime_service import RealtimeOceanService
        service = RealtimeOceanService()
        request.app.state.realtime_service = service

    return service.get_live_conditions_and_forecast(lat=lat, lon=lon)


@router.get("/fleet-live")
def get_live_argo_fleet(request: Request):
    """
    Retrieve live real-time autonomous profiling float and buoy network telemetry
    directly from Ifremer GDAC ERDDAP and INCOIS Observation Network.
    """
    service = getattr(request.app.state, "realtime_service", None)
    if not service:
        from app.services.realtime_service import RealtimeOceanService
        service = RealtimeOceanService()
        request.app.state.realtime_service = service

    return service.get_live_argo_network()
