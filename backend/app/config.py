from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str = ""
    model_name: str = "gemini-3.8-flash"
    fallback_models: str = "gemini-3.6-flash,gemini-3.5-flash-lite"

    cors_origins: str = "*"

    @property
    def model_list(self) -> list[str]:
        """Models to try in order: primary first, then fallbacks."""
        models = [self.model_name] + [
            model.strip() for model in self.fallback_models.split(",") if model.strip()
        ]
        return [model for model in models if model]

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",")]
        return [origin for origin in origins if origin]


settings = Settings()
