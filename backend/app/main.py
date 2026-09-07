"""OCEAN-X FastAPI application.

Main entry point. Loads datasets on startup via lifespan,
registers routers, and serves the API.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from app.config import get_settings
from app.services.netcdf_service import NetCDFService
from app.services.argo_service import ArgoService
from app.services.anomaly_service import AnomalyService
from app.routers import model_data, observations, comparison, anomaly, analytics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load datasets on startup, close on shutdown."""
    settings = get_settings()
    
    # Initialize NetCDF service for model data
    nc_service = NetCDFService(settings.model_data_path)
    if os.path.exists(settings.model_data_path):
        nc_service.load()
    else:
        logger.warning(f"Model data not found at {settings.model_data_path}")
        logger.warning("Run 'python scripts/generate_sample_data.py' to create sample data")
    
    # Initialize Argo service
    argo_service = ArgoService(settings.argo_data_path)
    if os.path.exists(settings.argo_data_path):
        argo_service.load()
    else:
        logger.warning(f"Argo data not found at {settings.argo_data_path}")
        logger.warning("Run 'python scripts/generate_sample_data.py' to create sample data")
    
    # Initialize Anomaly Intelligence service
    anomaly_service = AnomalyService()
    
    # Store on app state for access in endpoints
    app.state.nc_service = nc_service
    app.state.argo_service = argo_service
    app.state.anomaly_service = anomaly_service
    app.state.settings = settings
    
    logger.info("🌊 OCEAN-X API started")
    
    yield
    
    # Cleanup
    nc_service.close()
    argo_service.close()
    logger.info("🌊 OCEAN-X API shutdown")


# Create FastAPI app
app = FastAPI(
    title="OCEAN-X API",
    description="3D Ocean Intelligence & Visualization Platform API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Dev: allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Width", "X-Height", "X-Min", "X-Max", "X-Variable", 
                    "X-Depth", "X-Lat-Min", "X-Lat-Max", "X-Lon-Min", "X-Lon-Max"]
)

# Register routers
app.include_router(model_data.router)
app.include_router(observations.router)
app.include_router(comparison.router)
app.include_router(anomaly.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health_check():
    """Health check endpoint with dataset status."""
    settings = get_settings()
    nc_service = app.state.nc_service
    argo_service = app.state.argo_service
    
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "model_data_loaded": nc_service.is_loaded,
        "argo_data_loaded": argo_service.is_loaded,
        "model_info": nc_service.get_info() if nc_service.is_loaded else None,
        "argo_info": argo_service.get_info() if argo_service.is_loaded else None
    }
