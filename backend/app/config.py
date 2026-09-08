"""Application configuration loaded from environment variables."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    """OCEAN-X backend settings."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "OCEAN-X API"
    debug: bool = False
    data_dir: str = "../data"
    model_data_path: str = ""
    argo_data_path: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    database_url: str | None = None
    redis_url: str | None = None
    copernicus_username: str | None = None
    copernicus_password: str | None = None
    argo_erddap_url: str = "https://erddap.ifremer.fr/erddap/tabledap/ArgoFloats"
    bob_lat_min: float = 0.0
    bob_lat_max: float = 28.0
    bob_lon_min: float = 60.0
    bob_lon_max: float = 100.0
    bob_depth_max: float = 500.0

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.model_data_path:
            self.model_data_path = os.path.join(self.data_dir, "model", "sample_bob_model.nc")
        if not self.argo_data_path:
            self.argo_data_path = os.path.join(self.data_dir, "argo", "sample_argo_profiles.nc")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

@lru_cache()
def get_settings() -> Settings:
    return Settings()
