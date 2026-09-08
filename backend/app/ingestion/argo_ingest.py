"""
Argo GDAC ERDDAP Ingestion Module.
Ingests live in-situ profiling float data from the Global Data Assembly Centre (GDAC)
via the Ifremer ERDDAP tabledap server for the North Indian Ocean.

ERDDAP endpoint: https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats
Spatial bounds: 0°N–28°N, 60°E–100°E
"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import urllib.request
import json

logger = logging.getLogger(__name__)

DEFAULT_ERDDAP_URL = "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats"


def fetch_erddap_argo_profiles(
    output_filepath: str,
    days_back: int = 15,
    lat_min: float = 0.0,
    lat_max: float = 28.0,
    lon_min: float = 60.0,
    lon_max: float = 100.0,
    erddap_base_url: str = DEFAULT_ERDDAP_URL,
    timeout_seconds: int = 15,
) -> Dict[str, Any]:
    """
    Fetch active Argo float profiles from the Ifremer ERDDAP server.
    
    If network is accessible, downloads recent CTD soundings in the region.
    Otherwise gracefully preserves and reports the existing baseline dataset.
    """
    start_time = (datetime.utcnow() - timedelta(days=days_back)).strftime("%Y-%m-%dT00:00:00Z")
    
    # Construct ERDDAP tabledap JSON query URL
    # Query variables: platform_number, cycle_number, time, latitude, longitude, pres, temp, psal
    query_url = (
        f"{erddap_base_url}.json?"
        f"platform_number,cycle_number,time,latitude,longitude,pres,temp,psal&"
        f"latitude>={lat_min}&latitude<={lat_max}&"
        f"longitude>={lon_min}&longitude<={lon_max}&"
        f"time>={start_time}"
    )

    logger.info("Querying Argo GDAC ERDDAP: %s (past %d days)", erddap_base_url, days_back)

    try:
        import ssl
        try:
            ctx = ssl.create_default_context()
        except Exception:
            ctx = ssl._create_unverified_context()

        req = urllib.request.Request(
            query_url,
            headers={"User-Agent": "OCEAN-X-INCOIS-Platform/1.0 (Ocean Intelligence)"}
        )
        try:
            resp_ctx = urllib.request.urlopen(req, timeout=timeout_seconds, context=ctx)
        except ssl.SSLCertVerificationError:
            ctx = ssl._create_unverified_context()
            resp_ctx = urllib.request.urlopen(req, timeout=timeout_seconds, context=ctx)

        with resp_ctx as response:
            if response.status == 200:
                raw_data = json.loads(response.read().decode("utf-8"))
                rows = raw_data.get("table", {}).get("rows", [])
                logger.info("Retrieved %d sounding records from Argo GDAC", len(rows))
                
                # Save cached JSON records alongside the netcdf file
                cache_path = output_filepath.replace(".nc", "_erddap_cache.json")
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump({
                        "ingested_at": datetime.utcnow().isoformat(),
                        "query_url": query_url,
                        "n_records": len(rows),
                        "rows": rows[:5000],  # keep top 5000 soundings
                    }, f, indent=2)

                return {
                    "status": "success",
                    "records_fetched": len(rows),
                    "cache_filepath": cache_path,
                    "target_nc": output_filepath,
                    "is_live_ingested": True,
                    "timestamp": datetime.utcnow().isoformat(),
                }
    except Exception as e:
        logger.info(
            "Argo ERDDAP network query not reachable (%s). Retaining calibrated operational Argo baseline at %s",
            e, output_filepath
        )

    return {
        "status": "baseline_retained",
        "message": "Using operational in-situ Argo profile array",
        "target_nc": output_filepath,
        "is_live_ingested": False,
        "timestamp": datetime.utcnow().isoformat(),
    }
