"""Pydantic schemas for OCEAN-X data models.

These match the internal data model specification:
- Observation: normalized observation from any platform (Argo, Glider, CTD, etc.)
- ModelField: normalized model grid point value
- ComparisonResult: model vs observation deviation at a depth level
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PlatformType(str, Enum):
    ARGO = "argo"
    GLIDER = "glider"
    CTD = "ctd"
    BGC = "bgc"
    MOORING = "mooring"


class Variable(str, Enum):
    TEMPERATURE = "thetao"
    SALINITY = "so"
    EASTWARD_CURRENT = "uo"
    NORTHWARD_CURRENT = "vo"


class Observation(BaseModel):
    """A single observation measurement at a specific depth."""
    id: str
    platform_type: PlatformType
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=360)
    timestamp: datetime
    depth: float = Field(ge=0, description="Depth in meters")
    variable: Variable
    value: float
    unit: str
    source: str


class ModelFieldPoint(BaseModel):
    """A single model grid point value."""
    dataset_id: str
    variable: Variable
    timestamp: datetime
    latitude: float
    longitude: float
    depth: float
    value: float
    unit: str


class ComparisonResult(BaseModel):
    """Comparison between model and observation at one depth."""
    depth: float
    model_value: float
    observed_value: float
    delta: float
    unit: str
    anomaly_flag: bool = Field(default=False, description="True if |delta| exceeds threshold")


class ComparisonResponse(BaseModel):
    """Full comparison response for an observation profile."""
    observation_id: str
    platform_type: PlatformType
    latitude: float
    longitude: float
    timestamp: datetime
    variable: Variable
    comparisons: List[ComparisonResult]
    anomaly_detected: bool = False
    anomaly_threshold: float = 1.0


class ObservationProfile(BaseModel):
    """A complete observation profile (all depths for one float/cast)."""
    id: str
    platform_type: PlatformType
    latitude: float
    longitude: float
    timestamp: datetime
    depths: List[float]
    temperatures: Optional[List[Optional[float]]] = None
    salinities: Optional[List[Optional[float]]] = None
    source: str


class ModelSliceMetadata(BaseModel):
    """Metadata returned with a binary model data slice."""
    variable: str
    depth: float
    time_index: int
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float
    width: int
    height: int
    value_min: float
    value_max: float


class DatasetInfo(BaseModel):
    """Information about a loaded dataset."""
    filename: str
    variables: List[str]
    dimensions: dict
    lat_range: List[float]
    lon_range: List[float]
    depth_levels: List[float]
    time_steps: int
    is_synthetic: bool = True


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    app_name: str
    model_data_loaded: bool
    argo_data_loaded: bool
    model_info: Optional[DatasetInfo] = None
    argo_info: Optional[dict] = None
