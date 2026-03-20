from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    dvla_api_key: str = ""
    dvsa_api_key: str = ""
    allowed_origins: str = "http://localhost:5173"
    cache_ttl_seconds: int = 3600
    rate_limit_per_hour: int = 10
    environment: str = "development"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
