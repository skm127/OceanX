"""
Copernicus Marine Service (CMEMS) Ingestion Module.
Ingests numerical ocean physics model reanalysis & forecasts
for the Indian Ocean domain (0°N-28°N, 60°E-100°E, 0-500m depth).

Target dataset: cmems_mod_glo_phy_anfc_0.083deg_P1D-m / GLOBAL_ANALYSISFORECAST_PHY_001_024
Variables:
- thetao: Sea water potential temperature (°C)
- so: Sea water salinity (PSU)
- uo: Eastward sea water velocity (m/s)
- vo: Northward sea water velocity (m/s)
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Default Indian Ocean / Bay of Bengal & Arabian Sea spatial bounding box
DEFAULT_BOUNDS = {
    "lat_min": 0.0,
    "lat_max": 28.0,
    "lon_min": 60.0,
    "lon_max": 100.0,
    "depth_min": 0.0,
    "depth_max": 500.0,
}

DATASET_ID = "cmems_mod_glo_phy_anfc_0.083deg_P1D-m"
VARIABLES = ["thetao", "so", "uo", "vo"]


def fetch_cmems_ocean_model(
    output_filepath: str,
    username: Optional[str] = None,
    password: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    bounds: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Download a regional NetCDF subset from Copernicus Marine Service.
    
    If copernicusmarine is installed and credentials are provided, calls
    the official SDK subset API. Otherwise, logs an informative operational message
    explaining how to supply credentials.
    """
    b = bounds or DEFAULT_BOUNDS
    user = username or os.getenv("COPERNICUS_USERNAME")
    pwd = password or os.getenv("COPERNICUS_PASSWORD")

    end = end_date or datetime.utcnow()
    start = start_date or (end - timedelta(days=7))

    os.makedirs(os.path.dirname(os.path.abspath(output_filepath)), exist_ok=True)

    if not user or not pwd:
        msg = (
            "Copernicus Marine credentials (COPERNICUS_USERNAME / COPERNICUS_PASSWORD) "
            "not set in environment. Retaining operational local reanalysis baseline at: "
            f"{output_filepath}"
        )
        logger.info(msg)
        return {
            "status": "baseline_retained",
            "message": msg,
            "filepath": output_filepath,
            "bounds": b,
            "variables": VARIABLES,
            "is_live_ingested": False,
        }

    try:
        import copernicusmarine

        logger.info("Connecting to Copernicus Marine Service for dataset: %s", DATASET_ID)
        copernicusmarine.subset(
            dataset_id=DATASET_ID,
            variables=VARIABLES,
            minimum_longitude=b["lon_min"],
            maximum_longitude=b["lon_max"],
            minimum_latitude=b["lat_min"],
            maximum_latitude=b["lat_max"],
            minimum_depth=b["depth_min"],
            maximum_depth=b["depth_max"],
            start_datetime=start.strftime("%Y-%m-%d"),
            end_datetime=end.strftime("%Y-%m-%d"),
            output_filename=os.path.basename(output_filepath),
            output_directory=os.path.dirname(output_filepath),
            username=user,
            password=pwd,
            force_download=True,
        )

        logger.info("Successfully ingested Copernicus Marine dataset to %s", output_filepath)
        return {
            "status": "success",
            "message": "Live CMEMS subset downloaded successfully",
            "filepath": output_filepath,
            "bounds": b,
            "variables": VARIABLES,
            "is_live_ingested": True,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except ImportError:
        msg = (
            "copernicusmarine library not installed. Install via: pip install copernicusmarine. "
            f"Retaining operational baseline at {output_filepath}"
        )
        logger.warning(msg)
        return {
            "status": "library_missing",
            "message": msg,
            "filepath": output_filepath,
            "bounds": b,
            "variables": VARIABLES,
            "is_live_ingested": False,
        }
    except Exception as e:
        msg = f"CMEMS subset request failed: {str(e)}"
        logger.error(msg)
        return {
            "status": "error",
            "message": msg,
            "filepath": output_filepath,
            "bounds": b,
            "variables": VARIABLES,
            "is_live_ingested": False,
        }
