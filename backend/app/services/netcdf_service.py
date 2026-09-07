"""NetCDF data service using xarray.

Handles lazy loading of NetCDF datasets and provides methods for
spatial/depth/time subsetting. Never loads full datasets into memory.
"""
import xarray as xr
import numpy as np
from typing import Optional, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


class NetCDFService:
    """Service for reading and subsetting model NetCDF data."""
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.dataset: Optional[xr.Dataset] = None
        self._is_loaded = False
    
    def load(self) -> bool:
        """Load dataset with lazy chunking (data not read until accessed)."""
        try:
            # Load without chunking (dask not required for small sample datasets)
            # For production with large files, install dask and add chunks={"time": 1}
            self.dataset = xr.open_dataset(
                self.filepath,
                engine="netcdf4",
            )
            self._is_loaded = True
            logger.info(f"Loaded NetCDF dataset: {self.filepath}")
            logger.info(f"  Variables: {list(self.dataset.data_vars)}")
            logger.info(f"  Dimensions: {dict(self.dataset.sizes)}")
            return True
        except Exception as e:
            logger.error(f"Failed to load NetCDF: {e}")
            self._is_loaded = False
            return False
    
    @property
    def is_loaded(self) -> bool:
        return self._is_loaded and self.dataset is not None
    
    def get_info(self) -> Dict[str, Any]:
        """Return dataset metadata."""
        if not self.is_loaded:
            return {}
        ds = self.dataset
        
        # Find coordinate names (handle different naming conventions)
        lat_name = self._find_coord('lat', 'latitude', 'y')
        lon_name = self._find_coord('lon', 'longitude', 'x')
        depth_name = self._find_coord('depth', 'lev', 'z')
        time_name = self._find_coord('time', 't')
        
        info = {
            "filename": self.filepath,
            "variables": list(ds.data_vars),
            "dimensions": dict(ds.sizes),
            "lat_range": [float(ds[lat_name].min()), float(ds[lat_name].max())] if lat_name else [],
            "lon_range": [float(ds[lon_name].min()), float(ds[lon_name].max())] if lon_name else [],
            "depth_levels": ds[depth_name].values.tolist() if depth_name else [],
            "time_steps": int(ds.sizes.get(time_name, 0)) if time_name else 0,
            "is_synthetic": True  # Flag: using sample data
        }
        return info
    
    def _find_coord(self, *names: str) -> Optional[str]:
        """Find a coordinate by trying multiple possible names."""
        if not self.dataset:
            return None
        for name in names:
            if name in self.dataset.coords or name in self.dataset.dims:
                return name
        return None
    
    def get_depth_slice(
        self,
        variable: str,
        depth: float,
        time_index: int = 0,
        lat_range: Optional[Tuple[float, float]] = None,
        lon_range: Optional[Tuple[float, float]] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        """Extract a 2D horizontal slice at a given depth and time.
        
        Returns:
            Tuple of (data_array as float32, metadata dict)
        """
        if not self.is_loaded:
            raise RuntimeError("Dataset not loaded")
        
        ds = self.dataset
        lat_name = self._find_coord('lat', 'latitude')
        lon_name = self._find_coord('lon', 'longitude')
        depth_name = self._find_coord('depth', 'lev')
        time_name = self._find_coord('time', 't')
        
        # Select time step
        data = ds[variable].isel({time_name: time_index})
        
        # Select nearest depth
        data = data.sel({depth_name: depth}, method="nearest")
        
        # Spatial crop if specified
        if lat_range:
            data = data.sel({lat_name: slice(lat_range[0], lat_range[1])})
        if lon_range:
            data = data.sel({lon_name: slice(lon_range[0], lon_range[1])})
        
        # Compute (load into memory) and convert to float32
        arr = data.values.astype(np.float32)
        
        metadata = {
            "variable": variable,
            "depth": float(data.coords[depth_name].values) if depth_name else depth,
            "time_index": time_index,
            "lat_min": float(data.coords[lat_name].min()),
            "lat_max": float(data.coords[lat_name].max()),
            "lon_min": float(data.coords[lon_name].min()),
            "lon_max": float(data.coords[lon_name].max()),
            "width": arr.shape[1] if arr.ndim == 2 else arr.shape[0],
            "height": arr.shape[0] if arr.ndim == 2 else 1,
            "value_min": float(np.nanmin(arr)),
            "value_max": float(np.nanmax(arr)),
        }
        
        return arr, metadata
    
    def get_depth_profile(
        self,
        variable: str,
        lat: float,
        lon: float,
        time_index: int = 0
    ) -> Tuple[list, list]:
        """Extract a vertical profile at a given lat/lon.
        
        Returns:
            Tuple of (depths list, values list)
        """
        if not self.is_loaded:
            raise RuntimeError("Dataset not loaded")
        
        ds = self.dataset
        lat_name = self._find_coord('lat', 'latitude')
        lon_name = self._find_coord('lon', 'longitude')
        depth_name = self._find_coord('depth', 'lev')
        time_name = self._find_coord('time', 't')
        
        profile = ds[variable].isel({time_name: time_index}).sel(
            {lat_name: lat, lon_name: lon}, method="nearest"
        )
        
        depths = profile.coords[depth_name].values.tolist()
        values = profile.values.tolist()
        
        # Replace NaN with None for JSON serialization
        values = [None if np.isnan(v) else round(v, 4) for v in values]
        
        return depths, values
    
    def close(self):
        """Close the dataset."""
        if self.dataset:
            self.dataset.close()
            self._is_loaded = False
