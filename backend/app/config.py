"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    """OCEAN-X backend settings."""
    app_name: str = "OCEAN-X API"
    debug: bool = True
    
    # Data paths
    data_dir: str = os.environ.get("DATA_DIR", "../data")
    model_data_path: str = ""
    argo_data_path: str = ""
    
    # Database
    database_url: str = os.environ.get(
        "DATABASE_URL", 
        "postgresql://oceanx:oceanx_dev@localhost:5432/oceanx"
    )
    
    # Redis
    redis_url: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    
    # Indian Ocean region bounds (Arabian Sea + Bay of Bengal + Equatorial IO)
    bob_lat_min: float = 0.0
    bob_lat_max: float = 28.0
    bob_lon_min: float = 60.0
    bob_lon_max: float = 100.0
    bob_depth_max: float = 500.0
    
    class Config:
        env_file = ".env"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.model_data_path:
            self.model_data_path = os.path.join(self.data_dir, "model", "sample_bob_model.nc")
        if not self.argo_data_path:
            self.argo_data_path = os.path.join(self.data_dir, "argo", "sample_argo_profiles.nc")

@lru_cache()
def get_settings() -> Settings:
    return Settings()
