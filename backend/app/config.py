from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    openai_api_key: str
    realtime_model: str = "gpt-4o-realtime-preview-2024-12-17"
    gpt4_model: str = "gpt-4-turbo"
    interview_duration_seconds: int = 1800  # 30 minutes
    code_review_line_threshold: int = 5
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )

    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
