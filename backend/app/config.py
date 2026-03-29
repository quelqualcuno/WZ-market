from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

_DEFAULT_SECRET = "your-secret-key-change-in-production-min-32-chars"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/zeromarket"
    SECRET_KEY: str = _DEFAULT_SECRET
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    PROJECT_NAME: str = "ZeroMarket"
    VERSION: str = "1.0.0"

    model_config = SettingsConfigDict(env_file=".env")

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        if v == _DEFAULT_SECRET:
            import warnings
            warnings.warn(
                "Using the default SECRET_KEY. Set a strong SECRET_KEY in production.",
                stacklevel=2,
            )
        return v


settings = Settings()
