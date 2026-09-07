"""Argo observation data service.

Reads Argo-format NetCDF profiles and normalizes them
to the internal Observation data model.
"""
import xarray as xr
import numpy as np
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ArgoService:
    """Service for reading and querying Argo float profiles."""
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.dataset: Optional[xr.Dataset] = None
        self._profiles: List[Dict[str, Any]] = []
        self._is_loaded = False
    
    def load(self) -> bool:
        """Load Argo profiles from NetCDF."""
        try:
            self.dataset = xr.open_dataset(self.filepath, engine="netcdf4")
            self._parse_profiles()
            self._is_loaded = True
            logger.info(f"Loaded Argo data: {self.filepath}")
            logger.info(f"  Found {len(self._profiles)} profiles")
            return True
        except Exception as e:
            logger.error(f"Failed to load Argo data: {e}")
            self._is_loaded = False
            return False
    
    @property
    def is_loaded(self) -> bool:
        return self._is_loaded
    
    def _parse_profiles(self):
        """Parse all profiles from the dataset into our internal model."""
        ds = self.dataset
        if ds is None:
            return
        
        n_profiles = ds.dims.get('N_PROF', ds.dims.get('n_prof', 0))
        
        for i in range(n_profiles):
            try:
                # Extract profile data
                lat = float(ds['LATITUDE'].values[i])
                lon = float(ds['LONGITUDE'].values[i])
                
                # Handle JULD — xarray may auto-decode to datetime64 or keep as float
                juld_val = ds['JULD'].values[i]
                if np.issubdtype(type(juld_val), np.datetime64):
                    # xarray auto-decoded: convert numpy datetime64 to Python datetime
                    timestamp = juld_val.astype('datetime64[ms]').astype(datetime)
                else:
                    # Raw float: days since 1950-01-01
                    juld = int(float(juld_val))
                    ref_date = datetime(1950, 1, 1)
                    timestamp = ref_date + timedelta(days=juld)
                
                # Platform number — handle various formats (bytes, char array, string array)
                platform_raw = ds['PLATFORM_NUMBER'].values[i]
                if isinstance(platform_raw, (bytes, np.bytes_)):
                    platform_id = platform_raw.decode('utf-8').strip()
                elif isinstance(platform_raw, np.ndarray):
                    # Character array: join individual elements
                    platform_id = ''.join(str(c) for c in platform_raw.flat).strip()
                elif isinstance(platform_raw, str):
                    platform_id = platform_raw.strip()
                else:
                    platform_id = str(platform_raw).strip()
                
                # Pressure/depth, temperature, salinity
                pres = ds['PRES'].values[i]
                temp = ds['TEMP'].values[i] if 'TEMP' in ds else None
                psal = ds['PSAL'].values[i] if 'PSAL' in ds else None
                
                # Filter out fill values and NaN
                valid_mask = ~np.isnan(pres) & (pres < 99999)
                if temp is not None:
                    valid_mask &= ~np.isnan(temp) & (temp < 99999)
                
                profile = {
                    'id': f"argo_{platform_id}_{i}",
                    'platform_id': platform_id,
                    'platform_type': 'argo',
                    'latitude': lat,
                    'longitude': lon,
                    'timestamp': timestamp.isoformat(),
                    'depths': pres[valid_mask].tolist(),
                    'temperatures': temp[valid_mask].tolist() if temp is not None else None,
                    'salinities': psal[valid_mask].tolist() if psal is not None else None,
                    'source': 'synthetic_argo'  # Flag: synthetic data
                }
                self._profiles.append(profile)
            except Exception as e:
                logger.warning(f"Failed to parse profile {i}: {e}")
                continue
    
    def get_all_profiles_summary(self) -> List[Dict[str, Any]]:
        """Return summary of all profiles (for marker placement)."""
        return [
            {
                'id': p['id'],
                'platform_id': p['platform_id'],
                'platform_type': p['platform_type'],
                'latitude': p['latitude'],
                'longitude': p['longitude'],
                'timestamp': p['timestamp'],
                'n_depths': len(p['depths']),
                'max_depth': max(p['depths']) if p['depths'] else 0
            }
            for p in self._profiles
        ]
    
    def get_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific profile by ID."""
        for p in self._profiles:
            if p['id'] == profile_id:
                return p
        return None
    
    def get_profiles_in_region(
        self,
        lat_min: float = 0,
        lat_max: float = 25,
        lon_min: float = 75,
        lon_max: float = 100
    ) -> List[Dict[str, Any]]:
        """Get all profiles within a geographic bounding box."""
        return [
            p for p in self._profiles
            if lat_min <= p['latitude'] <= lat_max
            and lon_min <= p['longitude'] <= lon_max
        ]
    
    def get_info(self) -> Dict[str, Any]:
        """Return info about loaded Argo data."""
        if not self._profiles:
            return {"loaded": False, "n_profiles": 0}
        return {
            "loaded": True,
            "n_profiles": len(self._profiles),
            "profiles": self.get_all_profiles_summary()
        }
    
    def close(self):
        if self.dataset:
            self.dataset.close()
            self._is_loaded = False
